import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {detectCatalanLeakageInSpanish} from './content-quality-lib.mjs';
import {composePracticeQuestion,composeHardQuestion} from '../site/js/hard-distractors.js';
export {composePracticeQuestion,composeHardQuestion};

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dataDir=path.join(root,'site','data');
const hardDir=path.join(dataDir,'hard');

const normalize=value=>String(value??'')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'')
  .replace(/\+/g,' plus ')
  .replace(/−/g,' minus ')
  .replace(/[’'\`´]/g,' ')
  .replace(/[^\p{L}\p{N}]+/gu,' ')
  .trim()
  .replace(/\s+/g,' ')
  .toLocaleLowerCase('ca');

const readJson=async p=>JSON.parse(await readFile(path.join(dataDir,String(p).replace(/^data\//,'')),'utf8'));

const giveawayAbsoluteWords={
  ca:new Set(['només','sempre','mai','exclusivament','necessàriament','únicament','unicament']),
  es:new Set(['solo','sólo','siempre','nunca','exclusivamente','necesariamente','únicamente'])
};

function hasGiveawayAbsolute(value,lang){
  const words=String(value??'').toLocaleLowerCase(lang==='es'?'es':'ca').match(/\p{L}+/gu)||[];
  return words.some(word=>giveawayAbsoluteWords[lang].has(word));
}

export function countGiveawayAbsoluteDistractors(values,lang){
  return Array.isArray(values)?values.filter(value=>hasGiveawayAbsolute(value,lang)).length:0;
}

function validateLanguage(question,hardRecord,lang){
  const errors=[];
  const values=hardRecord?.[lang];
  if(!Array.isArray(values)||values.length!==3){
    errors.push(`${question.id}: ${lang} ha de contenir exactament 3 distractors`);
    return errors;
  }
  if(values.some(v=>!String(v??'').trim()))errors.push(`${question.id}: ${lang} conté distractors buits`);
  const normalized=values.map(normalize);
  if(new Set(normalized).size!==3)errors.push(`${question.id}: ${lang} conté distractor duplicat`);

  const sourceOptions=lang==='ca'?question.options:question.translations?.es?.options;
  if(!Array.isArray(sourceOptions)||sourceOptions.length!==4){
    errors.push(`${question.id}: opcions ${lang} de pràctica invàlides`);
    return errors;
  }
  const correct=normalize(sourceOptions[question.correct]);
  if(normalized.includes(correct))errors.push(`${question.id}: ${lang} conté la resposta correct com a distractor`);

  const practiceWrong=new Set(sourceOptions.filter((_,i)=>i!==question.correct).map(normalize));
  const changed=normalized.filter(value=>!practiceWrong.has(value)).length;
  if(changed<2)errors.push(`${question.id}: ${lang} ha de canviar almenys 2 distractors respecte pràctica`);
  if(countGiveawayAbsoluteDistractors(values,lang)>1)errors.push(`${question.id}: ${lang} conté massa distractors amb absoluts que poden donar pistes`);
  return errors;
}

export function validateHardRecord(question,hardRecord){
  const errors=[
    ...validateLanguage(question,hardRecord,'ca'),
    ...validateLanguage(question,hardRecord,'es')
  ];
  if(Array.isArray(hardRecord?.es)){
    const leaking=detectCatalanLeakageInSpanish({options:hardRecord.es});
    for(const field of leaking)errors.push(`${question.id}: probable català al distractor castellà ${field}`);
  }
  return errors;
}

export async function loadEffectiveQuestions(){
  const course=await readJson('course.json');
  const corrections=await readJson('content_corrections.json');
  const questionsByBlock=new Map();

  for(const block of course.blocks||[]){
    const canonical=[];
    const translations=new Map();
    for(const file of [block.file,block.extraFile,...(block.additionalFiles||[])].filter(Boolean)){
      const bank=await readJson(file);
      canonical.push(...(bank.questions||[]));
    }
    for(const file of [block.translationFile,...(block.additionalTranslationFiles||[])].filter(Boolean)){
      const translated=await readJson(file);
      for(const [id,value] of Object.entries(translated.questions||{})){
        if(translations.has(id))throw new Error(`${id}: duplicate Spanish translation`);
        translations.set(id,value);
      }
    }

    const effective=canonical.map(q=>{
      const correction=corrections.questions?.[q.id]||{};
      const esBase=translations.get(q.id);
      return {
        ...q,
        ...(correction.canonical||{}),
        id:q.id,
        block:q.block,
        correct:q.correct,
        translations:{
          ...(q.translations||{}),
          es:esBase?{...esBase,...(correction.es||{})}:undefined
        }
      };
    });
    questionsByBlock.set(block.id,{meta:block,questions:effective});
  }
  return {course,questionsByBlock};
}

export async function runHardDistractorAudit(){
  const {course,questionsByBlock}=await loadEffectiveQuestions();
  const errors=[];
  const seenIds=new Set();
  const declaredFiles=[];
  let records=0;

  for(const block of course.blocks||[]){
    const bundle=questionsByBlock.get(block.id);
    const expected=bundle?.questions||[];
    const expectedIds=new Set(expected.map(q=>q.id));
    const file=block.hardDistractorFile;
    if(!file){
      errors.push(`${block.id}: hardDistractorFile absent`);
      continue;
    }
    declaredFiles.push(String(file).replace(/^data\/hard\//,''));
    let data;
    try{data=await readJson(file);}
    catch{errors.push(`${block.id}: no s'ha pogut llegir ${file}`);continue;}
    if(data.blockId!==block.id)errors.push(`${file}: blockId no coincideix`);
    if(!data.questions||Array.isArray(data.questions)){
      errors.push(`${file}: questions ha de ser un objecte`);
      continue;
    }
    const ids=Object.keys(data.questions);
    for(const id of ids){
      records++;
      if(seenIds.has(id))errors.push(`${id}: hard record duplicat`);
      seenIds.add(id);
      if(!expectedIds.has(id)){
        errors.push(`${id}: hard record orfe a ${block.id}`);
        continue;
      }
      const q=expected.find(x=>x.id===id);
      errors.push(...validateHardRecord(q,data.questions[id]));
    }
    for(const q of expected)if(!Object.hasOwn(data.questions,q.id))errors.push(`${q.id}: hard record absent`);
  }

  let hardFiles=[];
  try{hardFiles=(await readdir(hardDir)).filter(x=>x.endsWith('.json')).sort();}
  catch{}
  if(new Set(declaredFiles).size!==hardFiles.length||hardFiles.some(x=>!declaredFiles.includes(x))){
    errors.push('course.json ha de declarar exactament tots els fitxers hard publicats');
  }

  const questionCount=[...questionsByBlock.values()].reduce((n,b)=>n+b.questions.length,0);
  if(seenIds.size!==questionCount)errors.push(`hard coverage mismatch: ${seenIds.size}/${questionCount}`);

  return {questions:questionCount,records,uniqueRecords:seenIds.size,files:declaredFiles.length,errors};
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
  const result=await runHardDistractorAudit();
  if(result.errors.length){
    console.error(result.errors.join('\n'));
    process.exit(1);
  }
  console.log('HARD_DISTRACTOR_AUDIT=PASS');
  console.log(`QUESTIONS=${result.questions}`);
  console.log(`HARD_RECORDS=${result.records}`);
  console.log(`HARD_FILES=${result.files}`);
}
