import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const dataDir=path.resolve("site/data");
const i18nDir=path.join(dataDir,"i18n","es");
const memoryDir=path.join(dataDir,"memory");
const bankPattern=/^(?:bloc_\d+|unitat_\d+_bloc_\d+)(?:_extra)?\.json$/;
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

  for(const key of ["file","extraFile"]){
    if(!block[key])continue;
    const fileName=path.basename(block[key]);
    const expected=`data/${fileName}`;
    if(block[key]!==expected||!files.includes(fileName)){
      metadataErrors.push(`course.json: ruta de bloc invàlida (${block[key]})`);
      continue;
    }
    declaredFiles.push(fileName);
  }

  if(!block.translationFile){
    metadataErrors.push(`${block.id||"bloc"}: translationFile obligatori`);
  }else{
    const translationName=path.basename(block.translationFile);
    const expected=`data/i18n/es/${block.id}.json`;
    if(block.translationFile!==expected||!translationFiles.includes(translationName)){
      metadataErrors.push(`course.json: ruta de traducció invàlida (${block.translationFile})`);
    }else declaredTranslationFiles.push(translationName);
  }

  if(!block.memoryAidFile){
    metadataErrors.push(`${block.id||"bloc"}: memoryAidFile obligatori`);
  }else{
    const memoryName=path.basename(block.memoryAidFile);
    const expected=`data/memory/${block.id}.json`;
    if(block.memoryAidFile!==expected||!memoryFiles.includes(memoryName)){
      metadataErrors.push(`course.json: ruta d'ajudes de memòria invàlida (${block.memoryAidFile})`);
    }else declaredMemoryFiles.push(memoryName);
  }
}

const ids=new Set();
const questionTexts=new Set();
const questionsByBlock=new Map();
let total=0;
const errors=[...metadataErrors];
const expectedCounts={
  "bloc_1.json":24,"bloc_1_extra.json":18,
  "bloc_2.json":30,"bloc_2_extra.json":26,
  "bloc_3.json":30,"bloc_3_extra.json":26,
  "bloc_4.json":24,"bloc_4_extra.json":16,
  "bloc_5.json":24,"bloc_5_extra.json":22,
  "unitat_2_bloc_1.json":40,"unitat_2_bloc_1_extra.json":40
};

function expectedBlockId(file){
  let match=file.match(/^bloc_(\d+)/);
  if(match)return `bloc-${match[1]}`;
  match=file.match(/^unitat_(\d+)_bloc_(\d+)/);
  if(match)return `unitat-${match[1]}-bloc-${match[2]}`;
  return null;
}

for(const file of files){
  const bank=JSON.parse(await readFile(path.join(dataDir,file),"utf8"));
  if(!bank.blockId||!bank.blockTitle||!Array.isArray(bank.questions)){
    errors.push(`${file}: blockId, blockTitle i questions són obligatoris`);
    continue;
  }
  if(expectedCounts[file]!==undefined&&bank.questions.length!==expectedCounts[file])errors.push(`${file}: s’esperaven ${expectedCounts[file]} preguntes i n’hi ha ${bank.questions.length}`);
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
    if(!q.explanation?.trim())errors.push(`${where}: explanation obligatòria`);
    if(q.id)blockQuestions.push(q.id);
    total++;
  }
  questionsByBlock.set(bank.blockId,blockQuestions);
}

if(new Set(declaredFiles).size!==files.length||declaredFiles.length!==files.length)errors.push(`course.json ha de declarar una vegada cadascun dels ${files.length} bancs publicats`);
if(files.length!==12)errors.push(`S’esperaven 12 fitxers de banc i n’hi ha ${files.length}`);
if(total!==320)errors.push(`El banc publicat ha de contenir exactament 320 preguntes; trobades: ${total}`);

let translationTotal=0;
const translatedQuestionTexts=new Set();
for(const block of course.blocks||[]){
  if(!block.translationFile)continue;
  const translationPath=path.join(dataDir,block.translationFile.replace(/^data\//,""));
  let translated;
  try{translated=JSON.parse(await readFile(translationPath,"utf8"));}
  catch{errors.push(`${block.translationFile}: no s’ha pogut llegir la traducció`);continue;}
  if(translated.blockId!==block.id)errors.push(`${block.translationFile}: blockId de traducció incorrecte`);
  if(translated.blockTitle!==block.titleEs)errors.push(`${block.translationFile}: blockTitle no coincideix amb titleEs`);
  if(!translated.questions||Array.isArray(translated.questions)||typeof translated.questions!=="object"){
    errors.push(`${block.translationFile}: questions ha de ser un objecte indexat per id`);continue;
  }

  const canonicalIds=questionsByBlock.get(block.id)||[];
  const translatedIds=Object.keys(translated.questions);
  const missing=canonicalIds.filter(id=>!Object.hasOwn(translated.questions,id));
  const extra=translatedIds.filter(id=>!canonicalIds.includes(id));
  if(missing.length||extra.length)errors.push(`${block.translationFile}: la traducció no cobreix exactament les preguntes canòniques (absents: ${missing.join(",")||"cap"}; sobrants: ${extra.join(",")||"cap"})`);

  for(const id of canonicalIds){
    const t=translated.questions[id];
    if(!t)continue;
    const where=`${block.translationFile}#${id}`;
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
if(translationFiles.length!==6)errors.push(`S’esperaven 6 fitxers de traducció i n’hi ha ${translationFiles.length}`);
if(translationTotal!==320)errors.push(`La traducció castellana ha de cobrir exactament 320 preguntes; trobades: ${translationTotal}`);

let memoryAidTotal=0;
for(const block of course.blocks||[]){
  if(!block.memoryAidFile)continue;
  const memoryPath=path.join(dataDir,block.memoryAidFile.replace(/^data\//,""));
  let memory;
  try{memory=JSON.parse(await readFile(memoryPath,"utf8"));}
  catch{errors.push(`${block.memoryAidFile}: no s’ha pogut llegir el fitxer`);continue;}
  if(memory.blockId!==block.id)errors.push(`${block.memoryAidFile}: blockId incorrecte`);
  if(!memory.questions||Array.isArray(memory.questions)||typeof memory.questions!=="object"){
    errors.push(`${block.memoryAidFile}: questions ha de ser un objecte indexat per id`);continue;
  }
  const canonicalIds=questionsByBlock.get(block.id)||[];
  const memoryIds=Object.keys(memory.questions);
  const missing=canonicalIds.filter(id=>!Object.hasOwn(memory.questions,id));
  const extra=memoryIds.filter(id=>!canonicalIds.includes(id));
  if(missing.length||extra.length)errors.push(`${block.memoryAidFile}: cobertura incorrecta (absents: ${missing.join(",")||"cap"}; sobrants: ${extra.join(",")||"cap"})`);

  for(const id of canonicalIds){
    const aid=memory.questions[id];
    if(!aid)continue;
    const where=`${block.memoryAidFile}#${id}`;
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
if(memoryFiles.length!==6)errors.push(`S’esperaven 6 fitxers d'ajudes de memòria i n’hi ha ${memoryFiles.length}`);
if(memoryAidTotal!==320)errors.push(`Les ajudes de memòria han de cobrir exactament 320 preguntes; trobades: ${memoryAidTotal}`);

if(errors.length){
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("QUESTION_BANK_VALIDATION=PASS");
console.log(`BLOCK_FILES=${files.length}`);
console.log(`QUESTION_COUNT=${total}`);
console.log(`TRANSLATION_FILES=${translationFiles.length}`);
console.log(`TRANSLATION_COUNT=${translationTotal}`);
console.log(`MEMORY_AID_FILES=${memoryFiles.length}`);
console.log(`MEMORY_AID_COUNT=${memoryAidTotal}`);
