import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dataDir=path.join(root,'site','data');
const readJson=async rel=>JSON.parse(await readFile(path.join(dataDir,String(rel).replace(/^data\//,'')),'utf8'));
const normalize=value=>String(value??'')
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[^\p{L}\p{N}]+/gu,' ')
  .trim().toLocaleLowerCase('es');

const EXPECTED={
  'bloc-1':66,
  'bloc-2':86,
  'bloc-3':86,
  'bloc-4':76,
  'bloc-5':76,
  'unitat-2-bloc-1':156,
  'uf0518-bloc-1':92,
  'uf0518-bloc-2':74,
  'uf0518-bloc-3':86,
  'uf0519-bloc-1':22,
  'uf0519-bloc-2':39,
  'uf0519-bloc-3':25,
  'uf0519-bloc-4':14,
  'uf0519-bloc-5':28
};

function mergeQuestionObjects(items){
  return Object.assign({},...items.map(item=>item.questions||{}));
}

export async function runStudyCardsAudit(){
  const course=await readJson('course.json');
  const extra=await readJson('study-cards-extra.json');
  const errors=[];
  const knownBlocks=new Set(course.blocks.map(block=>block.id));
  const canonicalQuestions={ca:new Set(),es:new Set()};
  const coreById=new Map();
  const coreCounts={};
  const extraCounts={};
  let coreCards=0;

  for(const block of course.blocks){
    const bankFiles=[block.file,block.extraFile,...(block.additionalFiles||[])].filter(Boolean);
    const translationFiles=[block.translationFile,...(block.additionalTranslationFiles||[])].filter(Boolean);
    const memoryFiles=[block.memoryAidFile,...(block.additionalMemoryAidFiles||[])].filter(Boolean);

    const banks=await Promise.all(bankFiles.map(readJson));
    const translations=mergeQuestionObjects(await Promise.all(translationFiles.map(readJson)));
    const memories=mergeQuestionObjects(await Promise.all(memoryFiles.map(readJson)));
    const questions=banks.flatMap(bank=>bank.questions||[]);

    coreCounts[block.id]=questions.length;
    coreCards+=questions.length;

    for(const q of questions){
      const es=translations[q.id];
      const memory=memories[q.id];
      if(!es)errors.push(q.id+': falta traducció ES per a flashcard');
      if(!memory)errors.push(q.id+': falta mnemotècnia bilingüe per a flashcard');
      if(!q.question||!Array.isArray(q.options)||!q.options[q.correct])errors.push(q.id+': targeta CA no construïble');
      if(es&&(!es.question||!Array.isArray(es.options)||!es.options[q.correct]))errors.push(q.id+': targeta ES no construïble');
      if(memory&&(!String(memory.ca||'').trim()||!String(memory.es||'').trim()))errors.push(q.id+': mnemotècnia CA/ES buida');
      if(q.question)canonicalQuestions.ca.add(normalize(q.question));
      if(es?.question)canonicalQuestions.es.add(normalize(es.question));
      coreById.set(q.id,{ca:q,es,memory,blockId:block.id});
    }
  }

  if(coreCards!==842)errors.push('nucli: '+coreCards+'/842 targetes');

  const coreOverrides=extra.coreOverrides||{};
  const standaloneRiskPhrasesCa=[
    'quina d’aquestes','quina d\'aquestes','quin d’aquests','quin d\'aquests',
    'quina opció','quina afirmació','quina combinació','quin conjunt',
    'quina parella','quin parell','quina conclusió','quina lectura','quina relació'
  ];
  const standaloneRiskPhrasesEs=[
    'cuál de estas','cual de estas','cuál de estos','cual de estos',
    'qué opción','que opción','qué afirmación','que afirmación',
    'qué combinación','que combinación','qué conjunto','que conjunto',
    'qué pareja','que pareja','qué conclusión','que conclusión',
    'qué lectura','que lectura','qué relación','que relación'
  ];
  const hasStandaloneRisk=(value,lang)=>{
    const text=String(value??'').toLocaleLowerCase(lang==='es'?'es':'ca');
    const phrases=lang==='es'?standaloneRiskPhrasesEs:standaloneRiskPhrasesCa;
    return phrases.some(phrase=>text.includes(phrase));
  };
  const isQuestion=value=>String(value??'').trim().endsWith('?');

  for(const [id,record] of coreById){
    const override=coreOverrides[id];
    if(hasStandaloneRisk(record.ca?.question,'ca')&&!override?.ca?.question){
      errors.push(id+': la pregunta de test depèn de les opcions i necessita pregunta pròpia de flashcard CA');
    }
    if(hasStandaloneRisk(record.ca?.question,'ca')&&!override?.es?.question){
      errors.push(id+': la pregunta de test depèn de les opcions i necessita pregunta pròpia de flashcard ES');
    }
    const caQuestion=override?.ca?.question||record.ca?.question||'';
    const esQuestion=override?.es?.question||record.es?.question||'';
    if(!String(caQuestion).trim()||!String(esQuestion).trim())errors.push(id+': pregunta efectiva de flashcard buida');
    if(hasStandaloneRisk(caQuestion,'ca'))errors.push(id+': la flashcard CA continua depenent de les opcions');
    if(hasStandaloneRisk(esQuestion,'es'))errors.push(id+': la flashcard ES continua depenent de les opcions');
    if(!isQuestion(caQuestion))errors.push(id+': la flashcard CA ha de ser una pregunta completa');
    if(!isQuestion(esQuestion))errors.push(id+': la flashcard ES ha de ser una pregunta completa');
  }

  for(const [id,override] of Object.entries(coreOverrides)){
    if(!coreById.has(id)){errors.push(id+': override de flashcard per a pregunta desconeguda');continue;}
    for(const lang of ['ca','es']){
      const loc=override?.[lang];
      if(!loc||typeof loc!=='object'){errors.push(id+': override '+lang+' absent');continue;}
      for(const key of Object.keys(loc)){
        if(!['question','answer','mnemonic'].includes(key))errors.push(id+': camp override no admès '+lang+'.'+key);
        if(!String(loc[key]??'').trim())errors.push(id+': camp override buit '+lang+'.'+key);
      }
    }
  }

  if(!Array.isArray(extra.languages)||!extra.languages.includes('ca')||!extra.languages.includes('es'))errors.push('extra: idiomes CA/ES incomplets');
  if(extra.cards?.length!==84)errors.push('extra: '+(extra.cards?.length||0)+'/84 targetes');

  const ids=new Set();
  const extraQuestions={ca:new Set(),es:new Set()};
  for(const card of extra.cards||[]){
    if(!card.id||ids.has(card.id))errors.push((card.id||'<sense-id>')+': id extra duplicat o buit');
    ids.add(card.id);
    if(!knownBlocks.has(card.blockId))errors.push(card.id+': blockId desconegut');
    extraCounts[card.blockId]=(extraCounts[card.blockId]||0)+1;

    for(const lang of ['ca','es']){
      const loc=card[lang]||{};
      if(!String(loc.question||'').trim())errors.push(card.id+': pregunta '+lang+' buida');
      else if(!isQuestion(loc.question))errors.push(card.id+': la pregunta extra '+lang+' ha de ser interrogativa');
      if(!String(loc.answer||'').trim())errors.push(card.id+': resposta '+lang+' buida');
      if(!String(loc.mnemonic||'').trim())errors.push(card.id+': mnemotècnia '+lang+' buida');
      if([...String(loc.mnemonic||'')].length>110)errors.push(card.id+': mnemotècnia '+lang+' massa llarga');
      const key=normalize(loc.question);
      if(extraQuestions[lang].has(key))errors.push(card.id+': pregunta extra '+lang+' duplicada');
      extraQuestions[lang].add(key);
      if(canonicalQuestions[lang].has(key))errors.push(card.id+': duplica literalment una pregunta dels tests en '+lang);
    }

    const source=extra.sources?.[card.source?.id];
    const pages=card.source?.pages;
    if(!source)errors.push(card.id+': font desconeguda');
    if(!Array.isArray(pages)||pages.length!==2||!pages.every(Number.isInteger))errors.push(card.id+': pageRange invàlid');
    else if(source&&(pages[0]<1||pages[1]<pages[0]||pages[1]>source.pages))errors.push(card.id+': pageRange fora de la font');
  }

  let totalCards=0;
  for(const block of course.blocks){
    if((extraCounts[block.id]||0)!==6)errors.push(block.id+': '+(extraCounts[block.id]||0)+'/6 targetes extra');
    const combined=(coreCounts[block.id]||0)+(extraCounts[block.id]||0);
    totalCards+=combined;
    if(combined!==EXPECTED[block.id])errors.push(block.id+': '+combined+'/'+EXPECTED[block.id]+' targetes totals');
  }

  if(totalCards!==926)errors.push('total: '+totalCards+'/926 targetes');

  return {
    coreCards,
    extraCards:extra.cards?.length||0,
    totalCards,
    blocks:course.blocks.length,
    languages:['ca','es'],
    coreOverrides:Object.keys(coreOverrides).length,
    counts:Object.fromEntries(course.blocks.map(block=>[block.id,(coreCounts[block.id]||0)+(extraCounts[block.id]||0)])),
    errors
  };
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
  const result=await runStudyCardsAudit();
  if(result.errors.length){
    console.error(result.errors.join('\n'));
    process.exit(1);
  }
  console.log('STUDY_CARDS_AUDIT=PASS');
  console.log('CORE_CARDS='+result.coreCards);
  console.log('EXTRA_CARDS='+result.extraCards);
  console.log('TOTAL_CARDS='+result.totalCards);
  console.log('BLOCKS='+result.blocks);
  console.log('LANGUAGES='+result.languages.join(','));
  console.log('CORE_OVERRIDES='+result.coreOverrides);
  console.log('BLOCK_COUNTS='+JSON.stringify(result.counts));
}
