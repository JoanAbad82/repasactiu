import {readdir,readFile} from "node:fs/promises";
import path from "node:path";

const root=path.resolve("site/data");
const suspicious=/[\u00C2\u00C3\u00E2\uFFFD]/u;
const control=/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/u;

async function jsonFiles(dir){
  const entries=await readdir(dir,{withFileTypes:true});
  const out=[];
  for(const entry of entries){
    const full=path.join(dir,entry.name);
    if(entry.isDirectory())out.push(...await jsonFiles(full));
    else if(entry.isFile()&&entry.name.endsWith(".json"))out.push(full);
  }
  return out;
}

function walk(value,file,trail,issues){
  if(typeof value==="string"){
    if(suspicious.test(value))issues.push({file,trail,type:"mojibake",value});
    if(control.test(value))issues.push({file,trail,type:"control-character",value});
    return;
  }
  if(Array.isArray(value)){
    value.forEach((item,index)=>walk(item,file,`${trail}[${index}]`,issues));
    return;
  }
  if(value&&typeof value==="object"){
    for(const [key,item] of Object.entries(value))walk(item,file,`${trail}.${key}`,issues);
  }
}

const files=await jsonFiles(root);
const issues=[];
for(const file of files){
  const text=await readFile(file,"utf8");
  let parsed;
  try{parsed=JSON.parse(text);}
  catch(error){
    console.error(`ENCODING_AUDIT=FAIL\nINVALID_JSON=${path.relative(process.cwd(),file)}\n${error.message}`);
    process.exit(1);
  }
  walk(parsed,path.relative(process.cwd(),file),"$",issues);
}

if(issues.length){
  console.error("ENCODING_AUDIT=FAIL");
  console.error(`ISSUES=${issues.length}`);
  for(const issue of issues.slice(0,50)){
    console.error(`${issue.file} ${issue.trail} [${issue.type}] ${JSON.stringify(issue.value)}`);
  }
  process.exit(1);
}

console.log("ENCODING_AUDIT=PASS");
console.log(`JSON_FILES=${files.length}`);
console.log("MOJIBAKE=0");
console.log("CONTROL_CHARACTERS=0");
