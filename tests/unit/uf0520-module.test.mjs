import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const get=async file=>JSON.parse(await readFile(new URL('../../'+file,import.meta.url),'utf8'));
const [course,q,es,mem,hard,trace,dict,lists,extra,hang]=await Promise.all([
 'site/data/course.json','site/data/uf0520_unitat_1_bloc_1.json','site/data/i18n/es/uf0520-unitat-1-bloc-1.json',
 'site/data/memory/uf0520-unitat-1-bloc-1.json','site/data/hard/uf0520-unitat-1-bloc-1.json',
 'docs/content/UF0520_SOURCE_TRACEABILITY.json','site/data/concept-dictionary-v1.json',
 'site/data/key-lists-v1.json','site/data/study-cards-extra.json','site/data/hangman-bank-v2.json'
].map(get));
const id='uf0520-unitat-1-bloc-1',source='UF0520_U1_1';
test('UF0520 published as independent 20th block and only under own unit',()=>{
 const b=course.blocks.filter(b=>b.id===id);
 assert.equal(course.blocks.length,20);assert.equal(b.length,1);
 assert.equal(b[0].unitId,'uf0520-unitat-1');assert.match(b[0].unitTitle,/Comunicació en entorns laborals/);
 assert.match(b[0].unitTitleEs,/Comunicación en entornos laborales/);
});
test('60 questions, bilingual and hard, 48-page source checksum, exact pages',()=>{
 assert.equal(q.questions.length,60);
 assert.equal(new Set(q.questions.map(x=>x.id)).size,60);
 assert.equal(trace.questionTraces.length,60);
 assert.equal(trace.sources[source].sha256,'cc6f7a7e6ad35421eb17fd4b937fe4d4170e2527074f9659b49519107217e96d');
 for(const question of q.questions){
  const t=trace.questionTraces.find(x=>x.id===question.id);
  assert.equal(t.source,source);assert.ok(t.pageRange[0]>=4&&t.pageRange[0]<=43);
  assert.equal(es.questions[question.id].options.length,4);
  assert.equal(hard.questions[question.id].ca.length,3);
  assert.equal(hard.questions[question.id].es.length,3);
  assert.ok(mem.questions[question.id].ca.length<=144);
  assert.ok(mem.questions[question.id].es.length<=144);
 }
});
test('dictionary, lists, flashcards and hangman cover new block with precise sources',()=>{
 const entries=dict.entries.filter(x=>x.blockId===id),l=lists.entries.filter(x=>x.blockId===id);
 const independent=extra.cards.filter(x=>x.blockId===id),h=hang.entries.filter(x=>x.blockId===id);
 assert.equal(entries.length,18);assert.equal(l.length,4);assert.equal(independent.length,6);
 assert.ok(h.length>=15);
 for(const x of [...entries,...l,...independent]){assert.equal(x.source.id,source);assert.ok(x.source.pages[0]>=1&&x.source.pages[1]<=48)}
});
