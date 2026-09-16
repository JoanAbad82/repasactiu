import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dataDir=path.join(root,'site','data');
const tracePath=path.join(root,'docs','content','UF0517_SOURCE_TRACEABILITY.json');
const readJson=async p=>JSON.parse(await readFile(p,'utf8'));
const readData=async p=>readJson(path.join(dataDir,p.replace(/^data\//,'')));
const formatId=(prefix,n)=>`${prefix}${String(n).padStart(3,'0')}`;

export async function validateSourceTraceability(){
  const course=await readData('course.json');
  const trace=await readJson(tracePath);
  const corrections=await readData('content_corrections.json');
  const errors=[];
  const ids=[];

  for(const block of course.blocks){
    for(const file of [block.file,block.extraFile,...(block.additionalFiles||[])].filter(Boolean)){
      const bank=await readData(file);
      for(const q of bank.questions||[])ids.push(q.id);
    }
  }

  if(ids.length!==450)errors.push(`expected 450 questions, found ${ids.length}`);
  if(new Set(ids).size!==ids.length)errors.push('duplicate question ids in published banks');

  const ruleMap=new Map();
  for(const rule of trace.coverageRules||[]){
    const source=trace.sources?.[rule.source];
    if(!source){errors.push(`unknown source ${rule.source}`);continue;}
    if(!Array.isArray(rule.pageRange)||rule.pageRange.length!==2||rule.pageRange[0]<1||rule.pageRange[1]>source.pages||rule.pageRange[0]>rule.pageRange[1])errors.push(`invalid pageRange for ${rule.prefix}`);
    for(let n=rule.start;n<=rule.end;n++){
      const id=formatId(rule.prefix,n);
      if(ruleMap.has(id))errors.push(`trace rule duplicate ${id}`);
      ruleMap.set(id,{source:rule.source,pageRange:rule.pageRange,status:rule.status});
    }
  }

  for(const override of trace.sourceOverrides||[]){
    if(!ruleMap.has(override.id))errors.push(`override for unknown/uncovered id ${override.id}`);
    const source=trace.sources?.[override.source];
    if(!source)errors.push(`override ${override.id}: unknown source ${override.source}`);
    else if(!Array.isArray(override.pageRange)||override.pageRange[0]<1||override.pageRange[1]>source.pages)errors.push(`override ${override.id}: invalid page range`);
    ruleMap.set(override.id,{source:override.source,pageRange:override.pageRange,status:override.status});
  }

  const published=new Set(ids);
  for(const id of ids)if(!ruleMap.has(id))errors.push(`missing source trace ${id}`);
  for(const id of ruleMap.keys())if(!published.has(id))errors.push(`source trace has unpublished id ${id}`);

  const correctionIds=Object.keys(corrections.questions||{}).sort();
  const manifestCorrectionIds=(trace.corrections||[]).map(x=>x.id).sort();
  if(JSON.stringify(correctionIds)!==JSON.stringify(manifestCorrectionIds))errors.push('content corrections and traceability corrections differ');
  for(const correction of trace.corrections||[]){
    if(!published.has(correction.id))errors.push(`correction for unknown id ${correction.id}`);
    if(correction.status!=='CORRECTED')errors.push(`correction ${correction.id} must have CORRECTED status`);
    if(!correction.reason?.trim())errors.push(`correction ${correction.id} missing reason`);
  }

  for(const [id,mapping] of ruleMap){
    if(mapping.status!=='PASS'&&mapping.status!=='CORRECTED')errors.push(`${id}: invalid review status`);
  }

  if(trace.review?.questionCount!==450)errors.push('trace review questionCount must be 450');
  return {questions:ids.length,traceable:ids.filter(id=>ruleMap.has(id)).length,sources:Object.keys(trace.sources||{}).length,corrections:manifestCorrectionIds.length,errors};
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
  const result=await validateSourceTraceability();
  if(result.errors.length){console.error(result.errors.join('\n'));process.exit(1);}
  console.log('SOURCE_TRACEABILITY=PASS');
  console.log(`QUESTIONS=${result.questions}`);
  console.log(`TRACEABLE=${result.traceable}`);
  console.log(`AUTHORIZED_SOURCES=${result.sources}`);
  console.log(`CORRECTIONS=${result.corrections}`);
}
