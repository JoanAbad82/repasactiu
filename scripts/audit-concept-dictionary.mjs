import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const bank=JSON.parse(await readFile(path.join(root,'site','data','concept-dictionary-v1.json'),'utf8'));

const EXPECTED={
  'bloc-1':6,
  'bloc-2':10,
  'bloc-3':10,
  'bloc-4':4,
  'bloc-5':10,
  'unitat-2-bloc-1':7,
  'uf0518-bloc-1':7
};
const SOURCE_LIMITS={B1:19,B2:33,B3:35,B4:34,B5:24,U2B1:119,UF0518_B1:28};
const errors=[];

if(bank.version!==1)errors.push('version != 1');
if(bank.count!==54)errors.push('count != 54');
if(!Array.isArray(bank.entries)||bank.entries.length!==54)errors.push('entries != 54');
if(!Array.isArray(bank.groups)||bank.groups.length!==7)errors.push('groups != 7');
if(!Array.isArray(bank.languages)||bank.languages.join(',')!=='ca,es')errors.push('languages must be ca,es');

const ids=new Set();
const terms={ca:new Set(),es:new Set()};
const counts={};

for(const entry of bank.entries||[]){
  if(!entry.id||ids.has(entry.id))errors.push('duplicate/empty id: '+entry.id);
  ids.add(entry.id);
  counts[entry.blockId]=(counts[entry.blockId]||0)+1;

  const maxPage=SOURCE_LIMITS[entry.source?.id];
  const pages=entry.source?.pages;
  if(!maxPage||!Array.isArray(pages)||pages.length!==2)errors.push(entry.id+': invalid source');
  else if(!Number.isInteger(pages[0])||!Number.isInteger(pages[1])||pages[0]<1||pages[1]<pages[0]||pages[1]>maxPage){
    errors.push(entry.id+': invalid page range');
  }

  for(const lang of ['ca','es']){
    const item=entry[lang]||{};
    const term=String(item.term||'').trim();
    const definition=String(item.definition||'').trim();
    const memory=String(item.memory||'').trim();
    if(!term||!definition||!memory)errors.push(entry.id+': incomplete '+lang);
    const key=term.toLocaleLowerCase(lang);
    if(terms[lang].has(key))errors.push(entry.id+': duplicate term '+lang+' '+term);
    terms[lang].add(key);
    if(term.length>70)errors.push(entry.id+': term too long '+lang);
    if(definition.length>260)errors.push(entry.id+': definition too long '+lang);
    if(memory.length>140)errors.push(entry.id+': memory cue too long '+lang);
    if(/[?]$/.test(term))errors.push(entry.id+': term should not be a question '+lang);
  }
}

for(const [blockId,count] of Object.entries(EXPECTED)){
  if(counts[blockId]!==count)errors.push(blockId+': '+(counts[blockId]||0)+'/'+count);
}
for(const blockId of Object.keys(counts)){
  if(!(blockId in EXPECTED))errors.push('unexpected block '+blockId);
}

if(errors.length)throw new Error('CONCEPT_DICTIONARY_AUDIT=FAIL\n- '+errors.join('\n- '));
console.log('CONCEPT_DICTIONARY_AUDIT=PASS');
console.log('CONCEPTS=54');
console.log('BLOCK_COUNTS='+JSON.stringify(counts));
console.log('LANGUAGES=ca,es');
