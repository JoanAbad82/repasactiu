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
  'css/main.css',
  'css/material-notice.css',
  'css/navigation-polish.css',
  'js/study-cards.js',
  'data/course.json',
  'data/study-cards-extra.json',
  'data/study-cards-semantic-v2.json',
  'data/study-cards-traceability-v2.json',
  'data/concept-dictionary-v1.json',
  'data/hangman-bank-v2.json',
  'js/hangman.js',
  'data/key-lists-v1.json',
  'js/concept-dictionary.js',
  'data/commercial-correspondence-v1.json',
  'js/commercial-correspondence.js',
  'data/payroll-example-2026-v1.json',
  'js/practical-examples.js',
  'data/administrative-exercises-v1.json',
  'js/administrative-exercises.js',
  'data/treasury-practice-v1.json',
  'js/treasury-practice.js'
]){
  await access(path.join(dist,rel));
}
const semantic=JSON.parse(await readFile(path.join(dist,'data','study-cards-semantic-v2.json'),'utf8'));
const traceability=JSON.parse(await readFile(path.join(dist,'data','study-cards-traceability-v2.json'),'utf8'));
const dictionary=JSON.parse(await readFile(path.join(dist,'data','concept-dictionary-v1.json'),'utf8'));
const hangman=JSON.parse(await readFile(path.join(dist,'data','hangman-bank-v2.json'),'utf8'));
const keyLists=JSON.parse(await readFile(path.join(dist,'data','key-lists-v1.json'),'utf8'));
const correspondence=JSON.parse(await readFile(path.join(dist,'data','commercial-correspondence-v1.json'),'utf8'));
const payroll=JSON.parse(await readFile(path.join(dist,'data','payroll-example-2026-v1.json'),'utf8'));
const administrative=JSON.parse(await readFile(path.join(dist,'data','administrative-exercises-v1.json'),'utf8'));
const treasury=JSON.parse(await readFile(path.join(dist,'data','treasury-practice-v1.json'),'utf8'));
if(!Array.isArray(semantic.changes)||semantic.changes.length!==84){
  throw new Error('Build validation failed: semantic manifest must contain 84 changes.');
}
if(traceability.version!==2||!traceability.topicRanges||!traceability.questionRanges){
  throw new Error('Build validation failed: traceability v2 is invalid.');
}
if(dictionary.version!==1||dictionary.count!==138||!Array.isArray(dictionary.entries)||dictionary.entries.length!==138){
  throw new Error('Build validation failed: concept dictionary v1 is invalid.');
}
if(!Array.isArray(dictionary.families)||dictionary.families.length!==17||dictionary.families.flatMap(family=>family.entryIds||[]).length!==138){
  throw new Error('Build validation failed: concept dictionary families are invalid.');
}
if(hangman.version!=='2.0'||hangman.count<300||!Array.isArray(hangman.entries)||hangman.entries.length!==hangman.count||!Array.isArray(hangman.groups)||hangman.groups.length!==17){
  throw new Error('Build validation failed: full-course hangman bank is invalid.');
}
if(keyLists.version!==1||keyLists.count!==85||!Array.isArray(keyLists.entries)||keyLists.entries.length!==85){
  throw new Error('Build validation failed: key-list bank is invalid.');
}
if(!Array.isArray(keyLists.families)||keyLists.families.length!==11||keyLists.families.flatMap(family=>family.entryIds||[]).length!==85){
  throw new Error('Build validation failed: key-list families are invalid.');
}
if(correspondence.version!==1||!Array.isArray(correspondence.structure)||correspondence.structure.length!==10||!Array.isArray(correspondence.models)||correspondence.models.length!==8){
  throw new Error('Build validation failed: commercial correspondence guide is invalid.');
}
if(payroll.version!==1||payroll.source?.sourceId!=='UF0519_NOMINA_2026_CECOT'||payroll.source?.pages!==3||payroll.calculations?.netPay!==1496.24){
  throw new Error('Build validation failed: payroll practical example is invalid.');
}
if(administrative.version!==1||administrative.source?.filename!=='Exercicis_1-10_unificats.docx'||administrative.source?.embeddedSheets!==9||administrative.sheets?.length!==9){
  throw new Error('Build validation failed: administrative/commercial document exercises are invalid.');
}
if(treasury.version!==1||treasury.source?.sourceId!=='UF0519_U2_TRESORERIA'||treasury.source?.pages!==41||!Array.isArray(treasury.steps)||treasury.steps.length!==10){
  throw new Error('Build validation failed: treasury practical circuit is invalid.');
}
for(const lang of ['ca','es']){
  const abbreviations=correspondence.abbreviations?.[lang];
  const items=abbreviations?.groups?.flatMap(group=>group.items||[])||[];
  if(items.length<20||items.length>30||abbreviations.count!==items.length){
    throw new Error(`Build validation failed: commercial abbreviations for ${lang} must contain 20-30 curated entries.`);
  }
}
console.log(`Static build PASS: site/ -> dist/ with learning tools, 138-concept dictionary, ${hangman.count}-entry full-course hangman bank, 85 key lists, payroll and treasury practicals, bilingual commercial correspondence guide and 9 administrative/commercial document exercises`);
