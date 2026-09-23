import {access,cp,readFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.join(root,'site');
const dist=path.join(root,'dist');

await rm(dist,{recursive:true,force:true});
await cp(source,dist,{recursive:true});

for(const rel of [
  'index.html',
  'js/study-cards.js',
  'data/course.json',
  'data/study-cards-extra.json',
  'data/study-cards-semantic-v2.json',
  'data/study-cards-traceability-v2.json',
  'data/concept-dictionary-v1.json',
  'data/key-lists-v1.json',
  'js/concept-dictionary.js',
  'data/commercial-correspondence-v1.json',
  'js/commercial-correspondence.js'
]){
  await access(path.join(dist,rel));
}
const semantic=JSON.parse(await readFile(path.join(dist,'data','study-cards-semantic-v2.json'),'utf8'));
const traceability=JSON.parse(await readFile(path.join(dist,'data','study-cards-traceability-v2.json'),'utf8'));
const dictionary=JSON.parse(await readFile(path.join(dist,'data','concept-dictionary-v1.json'),'utf8'));
const keyLists=JSON.parse(await readFile(path.join(dist,'data','key-lists-v1.json'),'utf8'));
const correspondence=JSON.parse(await readFile(path.join(dist,'data','commercial-correspondence-v1.json'),'utf8'));
if(!Array.isArray(semantic.changes)||semantic.changes.length!==84){
  throw new Error('Build validation failed: semantic manifest must contain 84 changes.');
}
if(traceability.version!==2||!traceability.topicRanges||!traceability.questionRanges){
  throw new Error('Build validation failed: traceability v2 is invalid.');
}
if(dictionary.version!==1||dictionary.count!==75||!Array.isArray(dictionary.entries)||dictionary.entries.length!==75){
  throw new Error('Build validation failed: concept dictionary v1 is invalid.');
}
if(!Array.isArray(dictionary.families)||dictionary.families.length!==12||dictionary.families.flatMap(family=>family.entryIds||[]).length!==75){
  throw new Error('Build validation failed: concept dictionary families are invalid.');
}
if(keyLists.version!==1||keyLists.count!==53||!Array.isArray(keyLists.entries)||keyLists.entries.length!==53){
  throw new Error('Build validation failed: key-list bank is invalid.');
}
if(!Array.isArray(keyLists.families)||keyLists.families.length!==6||keyLists.families.flatMap(family=>family.entryIds||[]).length!==53){
  throw new Error('Build validation failed: key-list families are invalid.');
}
if(correspondence.version!==1||!Array.isArray(correspondence.structure)||correspondence.structure.length!==10||!Array.isArray(correspondence.models)||correspondence.models.length!==8){
  throw new Error('Build validation failed: commercial correspondence guide is invalid.');
}
for(const lang of ['ca','es']){
  const abbreviations=correspondence.abbreviations?.[lang];
  const items=abbreviations?.groups?.flatMap(group=>group.items||[])||[];
  if(items.length<20||items.length>30||abbreviations.count!==items.length){
    throw new Error(`Build validation failed: commercial abbreviations for ${lang} must contain 20-30 curated entries.`);
  }
}
console.log('Static build PASS: site/ -> dist/ with learning tools, 75-concept dictionary, 53 key lists and bilingual commercial correspondence guide');
