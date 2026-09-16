import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const dataDir=path.resolve("site/data");
const i18nDir=path.join(dataDir,"i18n","es");
const memoryDir=path.join(dataDir,"memory");
const bankPattern=/^(?:bloc_\d+|unitat_\d+_bloc_\d+)(?:_extra|_expansion)?\.json$/;
const files=(await readdir(dataDir)).filter(n=>bankPattern.test(n)).sort();
const translationFiles=(await readdir(i18nDir)).filter(n=>n.endsWith(".json")).sort();
const memoryFiles=(await readdir(memoryDir)).filter(n=>n.endsWith(".json")).sort();
const course=JSON.parse(await readFile(path.join(dataDir,"course.json"),"utf8"));

const declaredFiles=[];
const declaredTranslationFiles=[];
const declaredMemoryFiles=[];
const metadataErrors=[];
const unitTitles=new Map();
const unitTitlesEs=new Map();

const normalizeDataPath=value=>value?.replace(/^data\//,"");
const basename=value=>path.basename(value);

if(!course.titleEs?.trim())metadataErrors.push("course.json: titleEs obligatori");
for(const block of course.blocks||[]){
  if(!block.id?.trim())metadataErrors.push("course.json: id de bloc obligatori");
  if(!block.unitId?.trim())metadataErrors.push(`${block.id||"bloc"}: unitId obligatori`);
  if(!block.unitTitle?.trim())metadataErrors.push(`${block.id||"bloc"}: unitTitle obligatori`);
  if(!block.unitTitleEs?.trim())metadataErrors.push(`${block.id||"bloc"}: unitTitleEs obligatori`);
  if(!block.titleEs?.trim())metadataErrors.push(`${block.id||"bloc"}: titleEs obligatori`);
  if(!Number.isInteger(block.blockNumber)||block.blockNumber<1)metadataErrors.push(`${block.id||"bloc"}: blockNumber ha de ser un enter positiu`);

  if(block.unitId&&block.unitTitle){
    const previous=unitTitles.get(block.unitId);
    if(previous&&previous!==block.unitTitle)metadataErrors.push(`${block.unitId}: unitTitle inconsistent`);
    else unitTitles.set(block.unitId,block.unitTitle);
  }
  if(block.unitId&&block.unitTitleEs){
    const previous=unitTitlesEs.get(block.unitId);
    if(previous&&previous!==block.unitTitleEs)metadataErrors.push(`${block.unitId}: unitTitleEs inconsistent`);
    else unitTitlesEs.set(block.unitId,block.unitTitleEs);
  }

  const bankPaths=[block.file,block.extraFile,...(block.additionalFiles||[])].filter(Boolean);
  for(const bankPath of bankPaths){
    const fileName=basename(bankPath);
    if(bankPath!==`data/${fileName}`||!files.includes(fileName))metadataErrors.push(`course.json: ruta de bloc invàlida (${bankPath})`);
    else declaredFiles.push(fileName);
  }

  const expectedTranslationBase=`data/i18n/es/${block.id}.json`;
  if(block.translationFile!==expectedTranslationBase)metadataErrors.push(`course.json: ruta de traducció base invàlida (${block.translationFile})`);
  const tPaths=[block.translationFile,...(block.additionalTranslationFiles||[])].filter(Boolean);
  for(const tPath of tPaths){
    const fileName=basename(tPath);
    if(!tPath.startsWith("data/i18n/es/")||!translationFiles.includes(fileName))metadataErrors.push(`course.json: ruta de traducció invàlida (${tPath})`);
    else declaredTranslationFiles.push(fileName);
  }

  const expectedMemoryBase=`data/memory/${block.id}.json`;
  if(block.memoryAidFile!==expectedMemoryBase)metadataErrors.push(`course.json: ruta d'ajudes base invàlida (${block.memoryAidFile})`);
  const mPaths=[block.memoryAidFile,...(block.additionalMemoryAidFiles||[])].filter(Boolean);
  for(const mPath of mPaths){
    const fileName=basename(mPath);
    if(!mPath.startsWith("data/memory/")||!memoryFiles.includes(fileName))metadataErrors.push(`course.json: ruta d'ajudes de memòria invàlida (${mPath})`);
    else declaredMemoryFiles.push(fileName);
  }
}

const expectedCounts={
  "bloc_1.json":24,"bloc_1_extra.json":18,"bloc_1_expansion.json":8,
  "bloc_2.json":30,"bloc_2_extra.json":26,"bloc_2_expansion.json":14,
  "bloc_3.json":30,"bloc_3_extra.json":26,"bloc_3_expansion.json":14,
  "bloc_4.json":24,"bloc_4_extra.json":16,"bloc_4_expansion.json":20,
  "bloc_5.json":24,"bloc_5_extra.json":22,"bloc_5_expansion.json":14,
  "unitat_2_bloc_1.json":40,"unitat_2_bloc_1_extra.json":40,"unitat_2_bloc_1_expansion.json":60
};

function expectedBlockId(file){
  let match=file.match(/^bloc_(\d+)/);
  if(match)return `bloc-${match[1]}`;
  match=file.match(/^unitat_(\d+)_bloc_(\d+)/);
  if(match)return `unitat-${match[1]}-bloc-${match[2]}`;
  return null;
}

const ids=new Set();
const questionTexts=new Set();
const questionsByBlock=new Map();
const correctDistribution=[0,0,0,0];
const expansionCorrectDistribution=[0,0,0,0];
let total=0;
const errors=[...metadataErrors];

for(const file of files){
  const bank=JSON.parse(await readFile(path.join(dataDir,file),"utf8"));
  if(!bank.blockId||!bank.blockTitle||!Array.isArray(bank.questions)){
    errors.push(`${file}: blockId, blockTitle i questions són obligatoris`);
    continue;
  }
  if(expectedCounts[file]===undefined)errors.push(`${file}: fitxer de banc no previst`);
  else if(bank.questions.length!==expectedCounts[file])errors.push(`${file}: s’esperaven ${expectedCounts[file]} preguntes i n’hi ha ${bank.questions.length}`);
  const expectedId=expectedBlockId(file);
  if(expectedId&&bank.blockId!==expectedId)errors.push(`${file}: blockId no coincideix amb el nom del fitxer`);
  const blockQuestions=questionsByBlock.get(bank.blockId)||[];

  for(const [index,q] of bank.questions.entries()){
    const where=`${file}#${index+1}`;
    if(!q.id||ids.has(q.id))errors.push(`${where}: id absent o duplicat (${q.id})`);
    if(q.id)ids.add(q.id);
    if(q.block!==bank.blockId)errors.push(`${where}: block no coincideix amb blockId`);
    if(!q.topic?.trim())errors.push(`${where}: topic obligatori`);
    if(!q.question?.trim())errors.push(`${where}: question obligatòria`);
    else{
      const qt=q.question.trim().toLocaleLowerCase("ca");
      if(questionTexts.has(qt))errors.push(`${where}: enunciat duplicat`);
      questionTexts.add(qt);
    }
    if(!Array.isArray(q.options)||q.options.length!==4)errors.push(`${where}: exactament 4 options`);
    else{
      const normalized=q.options.map(v=>String(v).trim().toLocaleLowerCase("ca"));
      if(new Set(normalized).size!==4)errors.push(`${where}: options duplicades`);
      if(q.options.some(v=>!String(v).trim()))errors.push(`${where}: options buides`);
    }
    if(!Number.isInteger(q.correct)||q.correct<0||q.correct>3)errors.push(`${where}: correct ha de ser un enter de 0 a 3`);
    else{
      correctDistribution[q.correct]++;
      if(file.endsWith("_expansion.json"))expansionCorrectDistribution[q.correct]++;
    }
    if(!q.explanation?.trim())errors.push(`${where}: explanation obligatòria`);
    if(q.id)blockQuestions.push(q.id);
    total++;
  }
  questionsByBlock.set(bank.blockId,blockQuestions);
}

if(new Set(declaredFiles).size!==files.length||declaredFiles.length!==files.length)errors.push(`course.json ha de declarar una vegada cadascun dels ${files.length} bancs publicats`);
if(files.length!==18)errors.push(`S’esperaven 18 fitxers de banc i n’hi ha ${files.length}`);
if(total!==450)errors.push(`El banc publicat ha de contenir exactament 450 preguntes; trobades: ${total}`);
if(Math.max(...expansionCorrectDistribution)-Math.min(...expansionCorrectDistribution)>1)errors.push(`Les respostes correctes de l'expansió han d'estar equilibrades; distribució: ${expansionCorrectDistribution.join(",")}`);

let translationTotal=0;
const translatedQuestionTexts=new Set();
for(const block of course.blocks||[]){
  const combined={};
  const paths=[block.translationFile,...(block.additionalTranslationFiles||[])].filter(Boolean);
  for(const translationFile of paths){
    const translationPath=path.join(dataDir,normalizeDataPath(translationFile));
    let translated;
    try{translated=JSON.parse(await readFile(translationPath,"utf8"));}
    catch{errors.push(`${translationFile}: no s’ha pogut llegir la traducció`);continue;}
    if(translated.blockId!==block.id)errors.push(`${translationFile}: blockId de traducció incorrecte`);
    if(translated.blockTitle&&translated.blockTitle!==block.titleEs)errors.push(`${translationFile}: blockTitle no coincideix amb titleEs`);
    if(!translated.questions||Array.isArray(translated.questions)||typeof translated.questions!=="object"){
      errors.push(`${translationFile}: questions ha de ser un objecte indexat per id`);continue;
    }
    for(const [id,t] of Object.entries(translated.questions)){
      if(Object.hasOwn(combined,id)){errors.push(`${translationFile}#${id}: traducció duplicada entre fitxers`);continue;}
      combined[id]={value:t,source:translationFile};
    }
  }

  const canonicalIds=questionsByBlock.get(block.id)||[];
  const translatedIds=Object.keys(combined);
  const missing=canonicalIds.filter(id=>!Object.hasOwn(combined,id));
  const extra=translatedIds.filter(id=>!canonicalIds.includes(id));
  if(missing.length||extra.length)errors.push(`${block.id}: la traducció no cobreix exactament les preguntes canòniques (absents: ${missing.join(",")||"cap"}; sobrants: ${extra.join(",")||"cap"})`);

  for(const id of canonicalIds){
    const entry=combined[id]; if(!entry)continue;
    const t=entry.value; const where=`${entry.source}#${id}`;
    if(Object.hasOwn(t,"correct"))errors.push(`${where}: la traducció no pot duplicar el camp correct`);
    if(!t.topic?.trim())errors.push(`${where}: topic obligatori`);
    if(!t.question?.trim())errors.push(`${where}: question obligatòria`);
    else{
      const qt=t.question.trim().toLocaleLowerCase("es");
      if(translatedQuestionTexts.has(qt))errors.push(`${where}: enunciat castellà duplicat`);
      translatedQuestionTexts.add(qt);
    }
    if(!Array.isArray(t.options)||t.options.length!==4)errors.push(`${where}: exactament 4 options traduïdes`);
    else{
      const normalized=t.options.map(v=>String(v).trim().toLocaleLowerCase("es"));
      if(new Set(normalized).size!==4)errors.push(`${where}: options traduïdes duplicades`);
      if(t.options.some(v=>!String(v).trim()))errors.push(`${where}: options traduïdes buides`);
    }
    if(!t.explanation?.trim())errors.push(`${where}: explanation obligatòria`);
    translationTotal++;
  }
}

if(new Set(declaredTranslationFiles).size!==translationFiles.length||declaredTranslationFiles.length!==translationFiles.length)errors.push(`course.json ha de declarar una vegada cadascun dels ${translationFiles.length} fitxers de traducció`);
if(translationFiles.length!==12)errors.push(`S’esperaven 12 fitxers de traducció i n’hi ha ${translationFiles.length}`);
if(translationTotal!==450)errors.push(`La traducció castellana ha de cobrir exactament 450 preguntes; trobades: ${translationTotal}`);

let memoryAidTotal=0;
for(const block of course.blocks||[]){
  const combined={};
  const paths=[block.memoryAidFile,...(block.additionalMemoryAidFiles||[])].filter(Boolean);
  for(const memoryFile of paths){
    const memoryPath=path.join(dataDir,normalizeDataPath(memoryFile));
    let memory;
    try{memory=JSON.parse(await readFile(memoryPath,"utf8"));}
    catch{errors.push(`${memoryFile}: no s’ha pogut llegir el fitxer`);continue;}
    if(memory.blockId!==block.id)errors.push(`${memoryFile}: blockId incorrecte`);
    if(!memory.questions||Array.isArray(memory.questions)||typeof memory.questions!=="object"){
      errors.push(`${memoryFile}: questions ha de ser un objecte indexat per id`);continue;
    }
    for(const [id,aid] of Object.entries(memory.questions)){
      if(Object.hasOwn(combined,id)){errors.push(`${memoryFile}#${id}: ajuda duplicada entre fitxers`);continue;}
      combined[id]={value:aid,source:memoryFile};
    }
  }
  const canonicalIds=questionsByBlock.get(block.id)||[];
  const memoryIds=Object.keys(combined);
  const missing=canonicalIds.filter(id=>!Object.hasOwn(combined,id));
  const extra=memoryIds.filter(id=>!canonicalIds.includes(id));
  if(missing.length||extra.length)errors.push(`${block.id}: cobertura d'ajudes incorrecta (absents: ${missing.join(",")||"cap"}; sobrants: ${extra.join(",")||"cap"})`);

  for(const id of canonicalIds){
    const entry=combined[id]; if(!entry)continue;
    const aid=entry.value; const where=`${entry.source}#${id}`;
    if(aid.type!=="example"&&aid.type!=="idea")errors.push(`${where}: type ha de ser example o idea`);
    for(const lang of ["ca","es"]){
      if(typeof aid[lang]!=="string"||!aid[lang].trim())errors.push(`${where}: ${lang} obligatori`);
      else if(aid[lang].length>144)errors.push(`${where}: ${lang} supera 144 caràcters (${aid[lang].length})`);
    }
    const allowed=new Set(["type","ca","es"]);
    const unknown=Object.keys(aid).filter(key=>!allowed.has(key));
    if(unknown.length)errors.push(`${where}: camps no admesos (${unknown.join(",")})`);
    memoryAidTotal++;
  }
}

if(new Set(declaredMemoryFiles).size!==memoryFiles.length||declaredMemoryFiles.length!==memoryFiles.length)errors.push(`course.json ha de declarar una vegada cadascun dels ${memoryFiles.length} fitxers d'ajudes de memòria`);
if(memoryFiles.length!==12)errors.push(`S’esperaven 12 fitxers d'ajudes de memòria i n’hi ha ${memoryFiles.length}`);
if(memoryAidTotal!==450)errors.push(`Les ajudes de memòria han de cobrir exactament 450 preguntes; trobades: ${memoryAidTotal}`);

if(errors.length){console.error(errors.join("\n"));process.exit(1);}
console.log("QUESTION_BANK_VALIDATION=PASS");
console.log(`BLOCK_FILES=${files.length}`);
console.log(`QUESTION_COUNT=${total}`);
console.log(`TRANSLATION_FILES=${translationFiles.length}`);
console.log(`TRANSLATION_COUNT=${translationTotal}`);
console.log(`MEMORY_AID_FILES=${memoryFiles.length}`);
console.log(`MEMORY_AID_COUNT=${memoryAidTotal}`);
console.log(`CORRECT_DISTRIBUTION=${correctDistribution.join(",")}`);
console.log(`EXPANSION_CORRECT_DISTRIBUTION=${expansionCorrectDistribution.join(",")}`);
