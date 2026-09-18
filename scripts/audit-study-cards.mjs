import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dataDir=path.join(root,'site','data');
const readJson=async rel=>JSON.parse(await readFile(path.join(dataDir,String(rel).replace(/^data\//,'')),'utf8'));
const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim().toLocaleLowerCase('es');
const catalanLeak=/(?<!\p{L})(?:què|aquest|aquesta|aquests|aquestes|amb|perquè|dins|treball|funció|preguntes|persones|organització|ajuntament)(?!\p{L})/iu;

export async function runStudyCardsAudit(){
  const bank=await readJson('study-cards-es.json');
  const course=await readJson('course.json');
  const errors=[];
  const expectedBlocks=new Set(course.blocks.map(block=>block.id));
  const counts={};
  const ids=new Set();
  const questions=new Set();
  const testQuestions=new Set();

  for(const block of course.blocks){
    for(const file of [block.file,block.extraFile,...(block.additionalFiles||[])].filter(Boolean)){
      const data=await readJson(file);
      for(const q of data.questions||[])testQuestions.add(normalize(q.question));
    }
    for(const file of [block.translationFile,...(block.additionalTranslationFiles||[])].filter(Boolean)){
      const data=await readJson(file);
      for(const q of Object.values(data.questions||{}))testQuestions.add(normalize(q.question));
    }
  }

  if(bank.language!=='es')errors.push('language ha de ser es');
  if(bank.cards?.length!==42)errors.push('el banc ha de contenir 42 targetes');

  for(const card of bank.cards||[]){
    if(!card.id||ids.has(card.id))errors.push((card.id||'<sense-id>')+': id duplicat o buit');
    ids.add(card.id);
    if(!expectedBlocks.has(card.blockId))errors.push(card.id+': blockId desconegut');
    counts[card.blockId]=(counts[card.blockId]||0)+1;

    const question=String(card.question||'').trim();
    const answer=String(card.answer||'').trim();
    const mnemonic=String(card.mnemonic||'').trim();
    if(!/^¿.+\?$/u.test(question))errors.push(card.id+': pregunta no té format interrogatiu espanyol');
    if(!answer)errors.push(card.id+': resposta buida');
    if(!mnemonic)errors.push(card.id+': mnemotècnia buida');
    if([...mnemonic].length>100)errors.push(card.id+': mnemotècnia massa llarga');
    if(catalanLeak.test(question+' '+answer+' '+mnemonic))errors.push(card.id+': possible fuga de català');

    const key=normalize(question);
    if(questions.has(key))errors.push(card.id+': pregunta duplicada');
    questions.add(key);
    if(testQuestions.has(key))errors.push(card.id+': duplica literalment una pregunta dels 596 tests');

    const source=bank.sources?.[card.source?.id];
    const pages=card.source?.pages;
    if(!source)errors.push(card.id+': font desconeguda');
    if(!Array.isArray(pages)||pages.length!==2||!pages.every(Number.isInteger))errors.push(card.id+': pageRange invàlid');
    else if(source&&(pages[0]<1||pages[1]<pages[0]||pages[1]>source.pages))errors.push(card.id+': pageRange fora de la font');
  }

  for(const blockId of expectedBlocks){
    if(counts[blockId]!==6)errors.push(blockId+': '+(counts[blockId]||0)+'/6 targetes');
  }

  return {cards:bank.cards?.length||0,blocks:Object.keys(counts).length,errors};
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
  const result=await runStudyCardsAudit();
  if(result.errors.length){console.error(result.errors.join('\n'));process.exit(1);}
  console.log('STUDY_CARDS_AUDIT=PASS');
  console.log('CARDS='+result.cards);
  console.log('BLOCKS='+result.blocks);
}
