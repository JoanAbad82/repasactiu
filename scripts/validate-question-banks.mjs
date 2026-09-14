import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
const dataDir=path.resolve("site/data");
const bankPattern=/^(?:bloc_\d+|unitat_\d+_bloc_\d+)(?:_extra)?\.json$/;
const files=(await readdir(dataDir)).filter(n=>bankPattern.test(n)).sort();
const course=JSON.parse(await readFile(path.join(dataDir,"course.json"),"utf8"));
const declaredFiles=[]; const metadataErrors=[]; const unitTitles=new Map();
for(const block of course.blocks||[]){
  if(!block.id?.trim())metadataErrors.push("course.json: id de bloc obligatori");
  if(!block.unitId?.trim())metadataErrors.push(`${block.id||"bloc"}: unitId obligatori`);
  if(!block.unitTitle?.trim())metadataErrors.push(`${block.id||"bloc"}: unitTitle obligatori`);
  if(!Number.isInteger(block.blockNumber)||block.blockNumber<1)metadataErrors.push(`${block.id||"bloc"}: blockNumber ha de ser un enter positiu`);
  if(block.unitId&&block.unitTitle){const previous=unitTitles.get(block.unitId); if(previous&&previous!==block.unitTitle)metadataErrors.push(`${block.unitId}: unitTitle inconsistent`); else unitTitles.set(block.unitId,block.unitTitle);}
  for(const key of ["file","extraFile"]){
    if(!block[key])continue;
    const fileName=path.basename(block[key]);
    const expected=`data/${fileName}`;
    if(block[key]!==expected||!files.includes(fileName)){metadataErrors.push(`course.json: ruta de bloc invàlida (${block[key]})`);continue;}
    declaredFiles.push(fileName);
  }
}
const ids=new Set(); const questionTexts=new Set(); let total=0; const errors=[...metadataErrors];
const expectedCounts={
  "bloc_1.json":24,"bloc_1_extra.json":18,
  "bloc_2.json":30,"bloc_2_extra.json":26,
  "bloc_3.json":30,"bloc_3_extra.json":26,
  "bloc_4.json":24,"bloc_4_extra.json":16,
  "bloc_5.json":24,"bloc_5_extra.json":22,
  "unitat_2_bloc_1.json":40,"unitat_2_bloc_1_extra.json":40
};
function expectedBlockId(file){
  let match=file.match(/^bloc_(\d+)/); if(match)return `bloc-${match[1]}`;
  match=file.match(/^unitat_(\d+)_bloc_(\d+)/); if(match)return `unitat-${match[1]}-bloc-${match[2]}`;
  return null;
}
for(const file of files){
  const bank=JSON.parse(await readFile(path.join(dataDir,file),"utf8"));
  if(!bank.blockId||!bank.blockTitle||!Array.isArray(bank.questions)){errors.push(`${file}: blockId, blockTitle i questions són obligatoris`);continue;}
  if(expectedCounts[file]!==undefined && bank.questions.length!==expectedCounts[file]) errors.push(`${file}: s’esperaven ${expectedCounts[file]} preguntes i n’hi ha ${bank.questions.length}`);
  const expectedId=expectedBlockId(file); if(expectedId&&bank.blockId!==expectedId)errors.push(`${file}: blockId no coincideix amb el nom del fitxer`);
  for(const [index,q] of bank.questions.entries()){
    const where=`${file}#${index+1}`;
    if(!q.id||ids.has(q.id))errors.push(`${where}: id absent o duplicat (${q.id})`); if(q.id)ids.add(q.id);
    if(q.block!==bank.blockId)errors.push(`${where}: block no coincideix amb blockId`);
    if(!q.topic?.trim())errors.push(`${where}: topic obligatori`);
    if(!q.question?.trim())errors.push(`${where}: question obligatòria`); else { const qt=q.question.trim().toLocaleLowerCase("ca"); if(questionTexts.has(qt))errors.push(`${where}: enunciat duplicat`); questionTexts.add(qt); }
    if(!Array.isArray(q.options)||q.options.length!==4)errors.push(`${where}: exactament 4 options`);
    else { const normalized=q.options.map(v=>String(v).trim().toLocaleLowerCase("ca")); if(new Set(normalized).size!==4)errors.push(`${where}: options duplicades`); if(q.options.some(v=>!String(v).trim()))errors.push(`${where}: options buides`); }
    if(!Number.isInteger(q.correct)||q.correct<0||q.correct>3)errors.push(`${where}: correct ha de ser un enter de 0 a 3`);
    if(!q.explanation?.trim())errors.push(`${where}: explanation obligatòria`);
    total++;
  }
}
if(new Set(declaredFiles).size!==files.length||declaredFiles.length!==files.length)errors.push(`course.json ha de declarar una vegada cadascun dels ${files.length} bancs publicats`);
if(files.length!==12)errors.push(`S’esperaven 12 fitxers de banc i n’hi ha ${files.length}`);
if(total!==320)errors.push(`El banc publicat ha de contenir exactament 320 preguntes; trobades: ${total}`);
if(errors.length){console.error(errors.join("\n"));process.exit(1);}
console.log("QUESTION_BANK_VALIDATION=PASS");console.log(`BLOCK_FILES=${files.length}`);console.log(`QUESTION_COUNT=${total}`);
