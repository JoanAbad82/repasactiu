import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
const dataDir=path.resolve("site/data");
const files=(await readdir(dataDir)).filter(n=>/^bloc_\d+(?:_extra)?\.json$/.test(n)).sort();
const course=JSON.parse(await readFile(path.join(dataDir,"course.json"),"utf8"));
const declaredFiles=[];
for(const block of course.blocks||[]){
  for(const key of ["file","extraFile"]){
    if(!block[key])continue;
    const fileName=path.basename(block[key]);
    const expected=`data/${fileName}`;
    if(block[key]!==expected||!files.includes(fileName)){console.error(`course.json: ruta de bloc invàlida (${block[key]})`);process.exit(1);}
    declaredFiles.push(fileName);
  }
}
const ids=new Set(); const questionTexts=new Set(); let total=0; const errors=[];
const expectedCounts={"bloc_1.json":24,"bloc_1_extra.json":18,"bloc_2.json":30,"bloc_2_extra.json":26,"bloc_3.json":30,"bloc_3_extra.json":26,"bloc_5.json":24,"bloc_5_extra.json":22};
for(const file of files){
  const bank=JSON.parse(await readFile(path.join(dataDir,file),"utf8"));
  if(!bank.blockId||!bank.blockTitle||!Array.isArray(bank.questions)){errors.push(`${file}: blockId, blockTitle i questions són obligatoris`);continue;}
  if(expectedCounts[file]!==undefined && bank.questions.length!==expectedCounts[file]) errors.push(`${file}: s’esperaven ${expectedCounts[file]} preguntes i n’hi ha ${bank.questions.length}`);
  const m=file.match(/^bloc_(\d+)/); if(m && bank.blockId!==`bloc-${m[1]}`) errors.push(`${file}: blockId no coincideix amb el nom del fitxer`);
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
if(new Set(declaredFiles).size!==files.length)errors.push(`course.json ha de declarar els ${files.length} bancs publicats`);
if(files.length===8&&total!==200)errors.push(`El banc publicat ha de contenir exactament 200 preguntes; trobades: ${total}`);
if(errors.length){console.error(errors.join("\n"));process.exit(1);}
console.log("QUESTION_BANK_VALIDATION=PASS");console.log(`BLOCK_FILES=${files.length}`);console.log(`QUESTION_COUNT=${total}`);
