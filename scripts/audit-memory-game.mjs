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

const catalanLeak=/\b(?:què|aquest|aquesta|aquests|aquestes|amb|perquè|dins|treball|funció|preguntes|persones|organització|empresa pública|empresa privada|ajuntament)\b/iu;

export async function runMemoryGameAudit(){
  const bank=await readJson('memory-game-es.json');
  const course=await readJson('course.json');
  const errors=[];
  const expectedBlocks=new Set(course.blocks.map(block=>block.id));
  const counts={};
  const pairIds=new Set();
  const cardTexts=new Map();

  if(bank.language!=='es')errors.push('language ha de ser es');
  if(bank.pairs?.length!==42)errors.push('el banc ha de contenir 42 parelles');
  if(bank.levels?.easy?.pairs!==8)errors.push('nivell easy ha de tenir 8 parelles');
  if(bank.levels?.difficult?.pairs!==18)errors.push('nivell difficult ha de tenir 18 parelles');

  const canonicalQuestions=new Set();
  for(const block of course.blocks){
    for(const file of [block.file,block.extraFile,...(block.additionalFiles||[])].filter(Boolean)){
      const data=await readJson(file);
      for(const question of data.questions||[])canonicalQuestions.add(normalize(question.question));
    }
  }

  for(const pair of bank.pairs||[]){
    if(!pair.id||pairIds.has(pair.id))errors.push((pair.id||'<sense-id>')+': id duplicat o buit');
    pairIds.add(pair.id);

    if(!expectedBlocks.has(pair.blockId))errors.push(pair.id+': blockId desconegut');
    counts[pair.blockId]=(counts[pair.blockId]||0)+1;

    for(const [side,value] of [['left',pair.left],['right',pair.right]]){
      if(!String(value||'').trim())errors.push(pair.id+': '+side+' buit');
      if([...String(value||'')].length>145)errors.push(pair.id+': '+side+' massa llarg');
      const key=normalize(value);
      if(cardTexts.has(key))errors.push(pair.id+': text duplicat amb '+cardTexts.get(key));
      cardTexts.set(key,pair.id+'-'+side);
      if(catalanLeak.test(String(value||'')))errors.push(pair.id+': possible fuga de català a '+side);
    }

    if(normalize(pair.left)===normalize(pair.right))errors.push(pair.id+': les dues cares no poden ser iguals');
    if(canonicalQuestions.has(normalize(pair.left)))errors.push(pair.id+': l enunciat duplica literalment una pregunta dels 596 tests');

    const source=bank.sources?.[pair.source?.id];
    if(!source)errors.push(pair.id+': font desconeguda');
    const pages=pair.source?.pages;
    if(!Array.isArray(pages)||pages.length!==2||!pages.every(Number.isInteger))errors.push(pair.id+': pageRange invàlid');
    else if(source&&(pages[0]<1||pages[1]<pages[0]||pages[1]>source.pages))errors.push(pair.id+': pageRange fora de la font');
  }

  for(const blockId of expectedBlocks){
    if(counts[blockId]!==6)errors.push(blockId+': '+(counts[blockId]||0)+'/6 parelles');
  }

  return {
    pairs:bank.pairs?.length||0,
    cards:(bank.pairs?.length||0)*2,
    blocks:Object.keys(counts).length,
    easyPairs:bank.levels?.easy?.pairs,
    difficultPairs:bank.levels?.difficult?.pairs,
    errors
  };
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
  const result=await runMemoryGameAudit();
  if(result.errors.length){
    console.error(result.errors.join('\n'));
    process.exit(1);
  }
  console.log('MEMORY_GAME_AUDIT=PASS');
  console.log('PAIRS='+result.pairs);
  console.log('CARDS='+result.cards);
  console.log('BLOCKS='+result.blocks);
  console.log('EASY_PAIRS='+result.easyPairs);
  console.log('DIFFICULT_PAIRS='+result.difficultPairs);
}
