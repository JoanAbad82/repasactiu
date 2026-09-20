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
  'js/concept-dictionary.js'
]){
  await access(path.join(dist,rel));
}
const semantic=JSON.parse(await readFile(path.join(dist,'data','study-cards-semantic-v2.json'),'utf8'));
const traceability=JSON.parse(await readFile(path.join(dist,'data','study-cards-traceability-v2.json'),'utf8'));
const dictionary=JSON.parse(await readFile(path.join(dist,'data','concept-dictionary-v1.json'),'utf8'));
if(!Array.isArray(semantic.changes)||semantic.changes.length!==84){
  throw new Error('Build validation failed: semantic manifest must contain 84 changes.');
}
if(traceability.version!==2||!traceability.topicRanges||!traceability.questionRanges){
  throw new Error('Build validation failed: traceability v2 is invalid.');
}
if(dictionary.version!==1||dictionary.count!==54||!Array.isArray(dictionary.entries)||dictionary.entries.length!==54){
  throw new Error('Build validation failed: concept dictionary v1 is invalid.');
}
console.log('Static build PASS: site/ -> dist/ with semantic manifest, traceability v2 and 54-concept dictionary');
