import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dataDir=path.join(root,'site','data');
const readJson=async p=>JSON.parse(await readFile(path.join(dataDir,p.replace(/^data\//,'')),'utf8'));
const normalize=value=>String(value??'').trim().replace(/\s+/g,' ').toLocaleLowerCase('ca');

export async function runBilingualContractAudit(){
  const course=await readJson('course.json');
  const corrections=await readJson('content_corrections.json');
  const canonical=[];
  const translations=new Map();
  const memory=new Map();
  const errors=[];

  for(const block of course.blocks){
    for(const file of [block.file,block.extraFile,...(block.additionalFiles||[])].filter(Boolean)){
      const bank=await readJson(file);
      canonical.push(...bank.questions);
    }
    for(const file of [block.translationFile,...(block.additionalTranslationFiles||[])].filter(Boolean)){
      const translated=await readJson(file);
      for(const [id,value] of Object.entries(translated.questions||{})){
        if(translations.has(id))errors.push(`${id}: duplicate Spanish translation`);
        translations.set(id,value);
      }
    }
    for(const file of [block.memoryAidFile,...(block.additionalMemoryAidFiles||[])].filter(Boolean)){
      const aids=await readJson(file);
      for(const [id,value] of Object.entries(aids.questions||{})){
        if(memory.has(id))errors.push(`${id}: duplicate memory aid`);
        memory.set(id,value);
      }
    }
  }

  const ids=new Set(canonical.map(q=>q.id));
  if(canonical.length!==450||ids.size!==450)errors.push(`canonical ids/count invalid: ${canonical.length}/${ids.size}`);

  for(const q of canonical){
    const correction=corrections.questions?.[q.id]||{};
    const ca={...q,...(correction.canonical||{}),correct:q.correct,id:q.id,block:q.block};
    const rawEs=translations.get(q.id);
    const es=rawEs?{...rawEs,...(correction.es||{})}:null;
    const aid=correction.memoryAid||memory.get(q.id);

    if(!ca.question?.trim()||!ca.topic?.trim()||!ca.explanation?.trim())errors.push(`${q.id}: incomplete Catalan content`);
    if(!Array.isArray(ca.options)||ca.options.length!==4)errors.push(`${q.id}: Catalan options != 4`);
    else{
      if(ca.options.some(x=>!String(x).trim()))errors.push(`${q.id}: empty Catalan option`);
      if(new Set(ca.options.map(normalize)).size!==4)errors.push(`${q.id}: duplicate Catalan options after normalization`);
    }
    if(!Number.isInteger(ca.correct)||ca.correct<0||ca.correct>3)errors.push(`${q.id}: invalid correct index`);

    if(!es)errors.push(`${q.id}: missing Spanish translation`);
    else{
      if(Object.hasOwn(es,'correct'))errors.push(`${q.id}: Spanish translation duplicates correct index`);
      if(!es.question?.trim()||!es.topic?.trim()||!es.explanation?.trim())errors.push(`${q.id}: incomplete Spanish content`);
      if(!Array.isArray(es.options)||es.options.length!==4)errors.push(`${q.id}: Spanish options != 4`);
      else{
        if(es.options.some(x=>!String(x).trim()))errors.push(`${q.id}: empty Spanish option`);
        if(new Set(es.options.map(normalize)).size!==4)errors.push(`${q.id}: duplicate Spanish options after normalization`);
      }
    }

    if(!aid)errors.push(`${q.id}: missing memory aid`);
    else{
      if(aid.type!=='example'&&aid.type!=='idea')errors.push(`${q.id}: invalid memory aid type`);
      for(const lang of ['ca','es']){
        if(!aid[lang]?.trim())errors.push(`${q.id}: missing ${lang} memory aid`);
        else if([...aid[lang]].length>144)errors.push(`${q.id}: ${lang} memory aid > 144 chars`);
      }
    }
  }

  for(const id of translations.keys())if(!ids.has(id))errors.push(`${id}: orphan Spanish translation`);
  for(const id of memory.keys())if(!ids.has(id))errors.push(`${id}: orphan memory aid`);
  for(const id of Object.keys(corrections.questions||{}))if(!ids.has(id))errors.push(`${id}: correction for unknown question`);

  return {questions:canonical.length,translations:translations.size,memoryAids:memory.size,corrections:Object.keys(corrections.questions||{}).length,errors};
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
  const result=await runBilingualContractAudit();
  if(result.errors.length){console.error(result.errors.join('\n'));process.exit(1);}
  console.log('BILINGUAL_CONTRACT_AUDIT=PASS');
  console.log(`QUESTIONS=${result.questions}`);
  console.log(`TRANSLATIONS=${result.translations}`);
  console.log(`MEMORY_AIDS=${result.memoryAids}`);
  console.log(`CORRECTIONS=${result.corrections}`);
}
