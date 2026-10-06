import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildHangmanBank,isHangmanTerm} from './build-hangman-bank.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const committed=JSON.parse(fs.readFileSync(path.join(root,'site','data','hangman-bank-v2.json'),'utf8'));
const course=JSON.parse(fs.readFileSync(path.join(root,'site','data','course.json'),'utf8'));
const rebuilt=await buildHangmanBank();
const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('ca').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
const errors=[];

if(JSON.stringify(committed)!==JSON.stringify(rebuilt))errors.push('hangman-bank-v2.json no coincideix amb la generació determinista');
if(committed.version!=='2.0')errors.push('versió del banc incorrecta');
if(committed.count!==committed.entries?.length)errors.push('count no coincideix amb entries');
if(committed.count<300)errors.push('el banc ha de mantenir com a mínim 300 entrades de curs');
if(committed.groups?.length!==course.blocks.length)errors.push('els filtres del penjat no cobreixen tots els blocs publicats');

const ids=new Set();
const perBlock=new Map(course.blocks.map(block=>[block.id,new Set()]));
for(const entry of committed.entries||[]){
  if(ids.has(entry.id))errors.push(entry.id+': id duplicat');
  ids.add(entry.id);
  if(!perBlock.has(entry.blockId)){errors.push(entry.id+': bloc desconegut');continue;}
  if(!entry.source?.id)errors.push(entry.id+': font absent');
  for(const lang of ['ca','es']){
    const side=entry[lang];
    if(!side?.term||!side?.hint||!side?.memory)errors.push(entry.id+': entrada '+lang+' incompleta');
    if(!isHangmanTerm(side?.term))errors.push(entry.id+': terme '+lang+' no jugable');
    const term=normalize(side?.term),hint=normalize(side?.hint);
    if(term&&hint.includes(term))errors.push(entry.id+': la pista '+lang+' revela literalment la solució');
  }
  const key=normalize(entry.ca.term)+'|'+normalize(entry.es.term);
  if(perBlock.get(entry.blockId).has(key))errors.push(entry.id+': terme duplicat dins del bloc');
  perBlock.get(entry.blockId).add(key);
}
for(const block of course.blocks){
  const count=perBlock.get(block.id)?.size||0;
  if(count<5)errors.push(block.id+': cobertura insuficient ('+count+')');
}
if(errors.length){
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('HANGMAN_BANK_AUDIT=PASS');
console.log('ENTRIES='+committed.count);
console.log('BLOCKS='+committed.groups.length);
console.log('BLOCK_COUNTS='+JSON.stringify(committed.stats.byBlock));
console.log('KINDS='+JSON.stringify(committed.stats.byKind));
