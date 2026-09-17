import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';

const dataDir=path.resolve('site/data');
const i18nDir=path.join(dataDir,'i18n','es');
const memoryDir=path.join(dataDir,'memory');
const course=JSON.parse(await readFile(path.join(dataDir,'course.json'),'utf8'));
const normalizeDataPath=value=>value?.replace(/^data\//,'');
const normalize=value=>String(value??'').trim().replace(/\s+/g,' ').toLocaleLowerCase('ca');
const errors=[];
const ids=new Set();
const questionTexts=new Set();
const questionsByBlock=new Map();
const declaredBanks=[];
const declaredTranslations=[];
const declaredMemory=[];
const correctDistribution=[0,0,0,0];
let total=0;

if(!course.titleEs?.trim())errors.push('course.json: titleEs obligatori');
const unitTitles=new Map();
const unitTitlesEs=new Map();

for(const block of course.blocks||[]){
  if(!block.id?.trim())errors.push('course.json: id de bloc obligatori');
  if(!block.unitId?.trim())errors.push(`${block.id||'bloc'}: unitId obligatori`);
  if(!block.unitTitle?.trim())errors.push(`${block.id||'bloc'}: unitTitle obligatori`);
  if(!block.unitTitleEs?.trim())errors.push(`${block.id||'bloc'}: unitTitleEs obligatori`);
  if(!block.title?.trim())errors.push(`${block.id||'bloc'}: title obligatori`);
  if(!block.titleEs?.trim())errors.push(`${block.id||'bloc'}: titleEs obligatori`);
  if(!Number.isInteger(block.blockNumber)||block.blockNumber<1)errors.push(`${block.id||'bloc'}: blockNumber ha de ser un enter positiu`);

  if(block.unitId&&block.unitTitle){
    const previous=unitTitles.get(block.unitId);
    if(previous&&previous!==block.unitTitle)errors.push(`${block.unitId}: unitTitle inconsistent`);
    else unitTitles.set(block.unitId,block.unitTitle);
  }
  if(block.unitId&&block.unitTitleEs){
    const previous=unitTitlesEs.get(block.unitId);
    if(previous&&previous!==block.unitTitleEs)errors.push(`${block.unitId}: unitTitleEs inconsistent`);
    else unitTitlesEs.set(block.unitId,block.unitTitleEs);
  }

  const blockIds=[];
  for(const file of [block.file,block.extraFile,...(block.additionalFiles||[])].filter(Boolean)){
    declaredBanks.push(normalizeDataPath(file));
    let bank;
    try{bank=JSON.parse(await readFile(path.join(dataDir,normalizeDataPath(file)),'utf8'));}
    catch{errors.push(`${file}: no s’ha pogut llegir el banc`);continue;}
    if(bank.blockId!==block.id)errors.push(`${file}: blockId no coincideix amb course.json`);
    if(!bank.blockTitle?.trim())errors.push(`${file}: blockTitle obligatori`);
    if(!Array.isArray(bank.questions)){errors.push(`${file}: questions ha de ser un array`);continue;}
    for(const [index,q] of bank.questions.entries()){
      const where=`${file}#${index+1}`;
      if(!q.id||ids.has(q.id))errors.push(`${where}: id absent o duplicat (${q.id})`);
      if(q.id){ids.add(q.id);blockIds.push(q.id);}
      if(q.block!==block.id)errors.push(`${where}: block no coincideix amb blockId`);
      if(!q.topic?.trim())errors.push(`${where}: topic obligatori`);
      if(!q.question?.trim())errors.push(`${where}: question obligatòria`);
      else{
        const text=normalize(q.question);
        if(questionTexts.has(text))errors.push(`${where}: enunciat duplicat`);
        questionTexts.add(text);
      }
      if(!Array.isArray(q.options)||q.options.length!==4)errors.push(`${where}: exactament 4 options`);
      else{
        const optionSet=new Set(q.options.map(normalize));
        if(optionSet.size!==4)errors.push(`${where}: options duplicades`);
        if(q.options.some(v=>!String(v).trim()))errors.push(`${where}: options buides`);
      }
      if(!Number.isInteger(q.correct)||q.correct<0||q.correct>3)errors.push(`${where}: correct ha de ser un enter de 0 a 3`);
      else correctDistribution[q.correct]++;
      if(!q.explanation?.trim())errors.push(`${where}: explanation obligatòria`);
      total++;
    }
  }
  questionsByBlock.set(block.id,blockIds);

  const translations={};
  for(const file of [block.translationFile,...(block.additionalTranslationFiles||[])].filter(Boolean)){
    declaredTranslations.push(normalizeDataPath(file).replace(/^i18n\/es\//,''));
    let data;
    try{data=JSON.parse(await readFile(path.join(dataDir,normalizeDataPath(file)),'utf8'));}
    catch{errors.push(`${file}: no s’ha pogut llegir la traducció`);continue;}
    if(data.blockId!==block.id)errors.push(`${file}: blockId de traducció incorrecte`);
    if(data.blockTitle&&data.blockTitle!==block.titleEs)errors.push(`${file}: blockTitle no coincideix amb titleEs`);
    if(!data.questions||Array.isArray(data.questions)){errors.push(`${file}: questions ha de ser un objecte`);continue;}
    for(const [id,value] of Object.entries(data.questions)){
      if(Object.hasOwn(translations,id))errors.push(`${file}#${id}: traducció duplicada`);
      translations[id]=value;
    }
  }
  const missingT=blockIds.filter(id=>!Object.hasOwn(translations,id));
  const extraT=Object.keys(translations).filter(id=>!blockIds.includes(id));
  if(missingT.length||extraT.length)errors.push(`${block.id}: cobertura de traducció incorrecta (absents: ${missingT.join(',')||'cap'}; sobrants: ${extraT.join(',')||'cap'})`);
  for(const id of blockIds){
    const t=translations[id]; if(!t)continue;
    const where=`translation#${id}`;
    if(Object.hasOwn(t,'correct'))errors.push(`${where}: la traducció no pot duplicar correct`);
    if(!t.topic?.trim()||!t.question?.trim()||!t.explanation?.trim())errors.push(`${where}: contingut obligatori absent`);
    if(!Array.isArray(t.options)||t.options.length!==4)errors.push(`${where}: exactament 4 options traduïdes`);
    else if(new Set(t.options.map(normalize)).size!==4)errors.push(`${where}: options traduïdes duplicades`);
  }

  const aids={};
  for(const file of [block.memoryAidFile,...(block.additionalMemoryAidFiles||[])].filter(Boolean)){
    declaredMemory.push(normalizeDataPath(file).replace(/^memory\//,''));
    let data;
    try{data=JSON.parse(await readFile(path.join(dataDir,normalizeDataPath(file)),'utf8'));}
    catch{errors.push(`${file}: no s’ha pogut llegir les ajudes`);continue;}
    if(data.blockId!==block.id)errors.push(`${file}: blockId d'ajudes incorrecte`);
    if(!data.questions||Array.isArray(data.questions)){errors.push(`${file}: questions d'ajudes ha de ser un objecte`);continue;}
    for(const [id,value] of Object.entries(data.questions)){
      if(Object.hasOwn(aids,id))errors.push(`${file}#${id}: ajuda duplicada`);
      aids[id]=value;
    }
  }
  const missingA=blockIds.filter(id=>!Object.hasOwn(aids,id));
  const extraA=Object.keys(aids).filter(id=>!blockIds.includes(id));
  if(missingA.length||extraA.length)errors.push(`${block.id}: cobertura d'ajudes incorrecta (absents: ${missingA.join(',')||'cap'}; sobrants: ${extraA.join(',')||'cap'})`);
  for(const id of blockIds){
    const aid=aids[id]; if(!aid)continue;
    if(aid.type!=='example'&&aid.type!=='idea')errors.push(`${id}: type d'ajuda invàlid`);
    for(const lang of ['ca','es']){
      if(typeof aid[lang]!=='string'||!aid[lang].trim())errors.push(`${id}: ajuda ${lang} obligatòria`);
      else if([...aid[lang]].length>144)errors.push(`${id}: ajuda ${lang} supera 144 caràcters`);
    }
  }
}

const topLevel=await readdir(dataDir,{withFileTypes:true});
const undeclaredBanks=[];
for(const entry of topLevel){
  if(!entry.isFile()||!entry.name.endsWith('.json')||['course.json','content_corrections.json'].includes(entry.name))continue;
  try{
    const data=JSON.parse(await readFile(path.join(dataDir,entry.name),'utf8'));
    if(Array.isArray(data.questions)&&!declaredBanks.includes(entry.name))undeclaredBanks.push(entry.name);
  }catch{}
}
if(undeclaredBanks.length)errors.push(`bancs no declarats a course.json: ${undeclaredBanks.join(',')}`);

const translationFiles=(await readdir(i18nDir)).filter(n=>n.endsWith('.json')).sort();
const memoryFiles=(await readdir(memoryDir)).filter(n=>n.endsWith('.json')).sort();
if(new Set(declaredTranslations).size!==translationFiles.length||translationFiles.some(x=>!declaredTranslations.includes(x)))errors.push('course.json ha de declarar exactament tots els fitxers de traducció publicats');
if(new Set(declaredMemory).size!==memoryFiles.length||memoryFiles.some(x=>!declaredMemory.includes(x)))errors.push("course.json ha de declarar exactament tots els fitxers d'ajudes publicats");

const translationTotal=[...questionsByBlock.values()].reduce((n,ids)=>n+ids.length,0);
const memoryAidTotal=translationTotal;
if(ids.size!==total)errors.push(`ids/count invalid: ${ids.size}/${total}`);

if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log('QUESTION_BANK_VALIDATION=PASS');
console.log(`BLOCK_FILES=${declaredBanks.length}`);
console.log(`QUESTION_COUNT=${total}`);
console.log(`TRANSLATION_FILES=${translationFiles.length}`);
console.log(`TRANSLATION_COUNT=${translationTotal}`);
console.log(`MEMORY_AID_FILES=${memoryFiles.length}`);
console.log(`MEMORY_AID_COUNT=${memoryAidTotal}`);
console.log(`CORRECT_DISTRIBUTION=${correctDistribution.join(',')}`);
