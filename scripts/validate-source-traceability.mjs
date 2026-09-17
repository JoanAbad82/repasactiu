import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dataDir=path.join(root,'site','data');
const defaultTracePaths=[
  path.join(root,'docs','content','UF0517_SOURCE_TRACEABILITY.json'),
  path.join(root,'docs','content','UF0518_SOURCE_TRACEABILITY.json')
];
const readJson=async p=>JSON.parse(await readFile(p,'utf8'));
const readData=async p=>readJson(path.join(dataDir,p.replace(/^data\//,'')));
const formatId=(prefix,n)=>`${prefix}${String(n).padStart(3,'0')}`;

function validRange(range,source){
  return Array.isArray(range)&&range.length===2&&Number.isInteger(range[0])&&Number.isInteger(range[1])&&range[0]>=1&&range[1]>=range[0]&&range[1]<=source.pages;
}

export async function validateSourceTraceability({tracePaths=defaultTracePaths}={}){
  const course=await readData('course.json');
  const corrections=await readData('content_corrections.json');
  const errors=[];
  const ids=[];

  for(const block of course.blocks||[]){
    for(const file of [block.file,block.extraFile,...(block.additionalFiles||[])].filter(Boolean)){
      const bank=await readData(file);
      for(const q of bank.questions||[])ids.push(q.id);
    }
  }
  if(new Set(ids).size!==ids.length)errors.push('duplicate question ids in published banks');

  const ruleMap=new Map();
  const allCorrections=[];
  let sourceCount=0;
  let manifestCount=0;

  for(const tracePath of tracePaths){
    let trace;
    try{trace=await readJson(tracePath);}catch(error){
      if(error?.code==='ENOENT')continue;
      throw error;
    }
    manifestCount++;
    sourceCount+=Object.keys(trace.sources||{}).length;
    const manifestIds=new Set();

    for(const rule of trace.coverageRules||[]){
      const source=trace.sources?.[rule.source];
      if(!source){errors.push(`${trace.scope||tracePath}: unknown source ${rule.source}`);continue;}
      if(!validRange(rule.pageRange,source))errors.push(`${trace.scope||tracePath}: invalid pageRange for ${rule.prefix}`);
      for(let n=rule.start;n<=rule.end;n++){
        const id=formatId(rule.prefix,n);
        if(ruleMap.has(id))errors.push(`trace rule duplicate ${id}`);
        ruleMap.set(id,{source:rule.source,pageRange:rule.pageRange,status:rule.status,scope:trace.scope});
        manifestIds.add(id);
      }
    }

    for(const item of trace.questionTraces||[]){
      const source=trace.sources?.[item.source];
      if(!item.id?.trim()){errors.push(`${trace.scope||tracePath}: trace without id`);continue;}
      if(!source){errors.push(`${item.id}: unknown source ${item.source}`);continue;}
      if(!validRange(item.pageRange,source))errors.push(`${item.id}: invalid page range`);
      if(item.pageRange?.[0]===1&&item.pageRange?.[1]===source.pages)errors.push(`${item.id}: blanket full-document range is not allowed`);
      if(ruleMap.has(item.id))errors.push(`trace rule duplicate ${item.id}`);
      ruleMap.set(item.id,{source:item.source,pageRange:item.pageRange,status:item.status,scope:trace.scope});
      manifestIds.add(item.id);
    }

    for(const override of trace.sourceOverrides||[]){
      if(!ruleMap.has(override.id))errors.push(`override for unknown/uncovered id ${override.id}`);
      const source=trace.sources?.[override.source];
      if(!source)errors.push(`override ${override.id}: unknown source ${override.source}`);
      else if(!validRange(override.pageRange,source))errors.push(`override ${override.id}: invalid page range`);
      ruleMap.set(override.id,{source:override.source,pageRange:override.pageRange,status:override.status,scope:trace.scope});
      manifestIds.add(override.id);
    }

    for(const correction of trace.corrections||[]){
      allCorrections.push(correction);
      if(correction.status!=='CORRECTED')errors.push(`correction ${correction.id} must have CORRECTED status`);
      if(!correction.reason?.trim())errors.push(`correction ${correction.id} missing reason`);
    }

    if(Number.isInteger(trace.review?.questionCount)&&trace.review.questionCount!==manifestIds.size){
      errors.push(`${trace.scope||tracePath}: review questionCount ${trace.review.questionCount} != traced ${manifestIds.size}`);
    }
  }

  const published=new Set(ids);
  for(const id of ids)if(!ruleMap.has(id))errors.push(`missing source trace ${id}`);
  for(const id of ruleMap.keys())if(!published.has(id))errors.push(`source trace has unpublished id ${id}`);
  for(const [id,mapping] of ruleMap){
    if(mapping.status!=='PASS'&&mapping.status!=='CORRECTED')errors.push(`${id}: invalid review status`);
  }

  const correctionIds=Object.keys(corrections.questions||{}).sort();
  const manifestCorrectionIds=allCorrections.map(x=>x.id).sort();
  if(JSON.stringify(correctionIds)!==JSON.stringify(manifestCorrectionIds))errors.push('content corrections and traceability corrections differ');
  for(const correction of allCorrections)if(!published.has(correction.id))errors.push(`correction for unknown id ${correction.id}`);

  return {
    manifests:manifestCount,
    questions:ids.length,
    traceable:ids.filter(id=>ruleMap.has(id)).length,
    sources:sourceCount,
    corrections:manifestCorrectionIds.length,
    errors
  };
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
  const result=await validateSourceTraceability();
  if(result.errors.length){console.error(result.errors.join('\n'));process.exit(1);}
  console.log('SOURCE_TRACEABILITY=PASS');
  console.log(`MANIFESTS=${result.manifests}`);
  console.log(`QUESTIONS=${result.questions}`);
  console.log(`TRACEABLE=${result.traceable}`);
  console.log(`AUTHORIZED_SOURCES=${result.sources}`);
  console.log(`CORRECTIONS=${result.corrections}`);
}