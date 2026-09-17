import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dataDir=path.join(root,'site','data');
const docsDir=path.join(root,'docs','content');

const readJson=async file=>JSON.parse(await readFile(file,'utf8'));
const dataPath=value=>path.join(dataDir,String(value).replace(/^data\//,''));

export function normalizeForComparison(value){
  return String(value??'')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[’'`´]/g,' ')
    .replace(/[^\p{L}\p{N}]+/gu,' ')
    .trim()
    .replace(/\s+/g,' ')
    .toLocaleLowerCase('ca');
}

export function findExactDuplicateQuestions(questions){
  const firstByText=new Map();
  const pairs=[];
  for(const q of questions||[]){
    const normalized=normalizeForComparison(q?.question);
    if(!normalized)continue;
    const first=firstByText.get(normalized);
    if(first)pairs.push([first,q.id]);
    else firstByText.set(normalized,q.id);
  }
  return pairs;
}

const catalanSignals=[
  /\b(?:què|quina|quines|quin|quins)\b/iu,
  /\b(?:aquest|aquesta|aquests|aquestes)\b/iu,
  /\b(?:comunicació|organització|administració|correspondència|informació|explicació|preguntes)\b/iu,
  /\b(?:adreçat|adreçada|adreçats|adreçades)\b/iu,
  /\b(?:següent|següents|dins|perquè|també)\b/iu
];

export function detectCatalanLeakageInSpanish(record){
  const leaking=[];
  for(const field of ['topic','question','explanation']){
    const value=String(record?.[field]??'');
    if(catalanSignals.some(pattern=>pattern.test(value)))leaking.push(field);
  }
  return leaking;
}

export function validateTraceEntry(entry,sources){
  const errors=[];
  const id=entry?.id||'trace';
  const source=sources?.[entry?.source];
  if(!source){
    errors.push(`${id}: font desconeguda ${entry?.source??''}`.trim());
    return errors;
  }
  const range=entry?.pageRange;
  if(!Array.isArray(range)||range.length!==2||!range.every(Number.isInteger)||range[0]<1||range[1]<range[0]){
    errors.push(`${id}: pageRange invàlid`);
    return errors;
  }
  if(range[1]>source.pages)errors.push(`${id}: pageRange ${range[0]}-${range[1]} fora de ${entry.source} (1-${source.pages})`);
  return errors;
}

function expandUf0517Trace(manifest){
  const traces=[];
  const overrides=new Map((manifest.sourceOverrides||[]).map(x=>[x.id,x]));
  for(const rule of manifest.coverageRules||[]){
    for(let n=rule.start;n<=rule.end;n++){
      const id=`${rule.prefix}${String(n).padStart(3,'0')}`;
      const override=overrides.get(id);
      traces.push(override?{id,source:override.source,pageRange:override.pageRange}:{id,source:rule.source,pageRange:rule.pageRange});
    }
  }
  return traces;
}

export async function runContentQualityAudit(){
  const course=await readJson(path.join(dataDir,'course.json'));
  const canonical=[];
  const translations=new Map();
  const errors=[];

  for(const block of course.blocks||[]){
    for(const file of [block.file,block.extraFile,...(block.additionalFiles||[])].filter(Boolean)){
      const bank=await readJson(dataPath(file));
      canonical.push(...(bank.questions||[]));
    }
    for(const file of [block.translationFile,...(block.additionalTranslationFiles||[])].filter(Boolean)){
      const translated=await readJson(dataPath(file));
      for(const [id,value] of Object.entries(translated.questions||{}))translations.set(id,value);
    }
  }

  for(const [a,b] of findExactDuplicateQuestions(canonical))errors.push(`duplicate question: ${a}/${b}`);

  for(const q of canonical){
    const es=translations.get(q.id);
    if(!es){errors.push(`${q.id}: missing Spanish translation`);continue;}
    for(const field of detectCatalanLeakageInSpanish(es))errors.push(`${q.id}: probable Catalan leakage in Spanish ${field}`);
  }

  const manifests=[
    await readJson(path.join(docsDir,'UF0517_SOURCE_TRACEABILITY.json')),
    await readJson(path.join(docsDir,'UF0518_SOURCE_TRACEABILITY.json'))
  ];
  const traceById=new Map();
  for(const manifest of manifests){
    const traces=manifest.scope==='UF0517'?expandUf0517Trace(manifest):(manifest.questionTraces||[]);
    for(const trace of traces){
      if(traceById.has(trace.id))errors.push(`${trace.id}: duplicate trace entry`);
      traceById.set(trace.id,trace);
      errors.push(...validateTraceEntry(trace,manifest.sources||{}));
    }
  }

  const canonicalIds=new Set(canonical.map(q=>q.id));
  for(const q of canonical)if(!traceById.has(q.id))errors.push(`${q.id}: missing traceability`);
  for(const id of traceById.keys())if(!canonicalIds.has(id))errors.push(`${id}: orphan traceability`);

  return {
    questions:canonical.length,
    translations:translations.size,
    traceable:[...canonicalIds].filter(id=>traceById.has(id)).length,
    duplicateQuestions:findExactDuplicateQuestions(canonical),
    errors
  };
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
  const result=await runContentQualityAudit();
  if(result.errors.length){console.error(result.errors.join('\n'));process.exit(1);}
  console.log('CONTENT_QUALITY_AUDIT=PASS');
  console.log(`QUESTIONS=${result.questions}`);
  console.log(`TRANSLATIONS=${result.translations}`);
  console.log(`TRACEABLE=${result.traceable}`);
  console.log(`EXACT_DUPLICATES=${result.duplicateQuestions.length}`);
}
