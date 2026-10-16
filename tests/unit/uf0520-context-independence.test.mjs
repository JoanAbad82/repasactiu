import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const load=async rel=>JSON.parse(await readFile(new URL('../../'+rel,import.meta.url),'utf8'));
const [ca,es,memory,hard,manifest,trace,cards]=await Promise.all([
 'site/data/uf0520_unitat_1_bloc_1.json',
 'site/data/i18n/es/uf0520-unitat-1-bloc-1.json',
 'site/data/memory/uf0520-unitat-1-bloc-1.json',
 'site/data/hard/uf0520-unitat-1-bloc-1.json',
 'docs/content/UF0520_SOURCE_TRACEABILITY.json',
 'site/data/study-cards-traceability-v2.json',
 'site/data/study-cards-extra.json'
].map(load));
const prefix='uf0520-u1b1-',id=n=>prefix+String(n).padStart(3,'0');
const get=n=>({ca:ca.questions.find(x=>x.id===id(n)),es:es.questions[id(n)]});
test('contextual corrections provide the previously missing information without using the answer choices',()=>{
 const l=get(15),a=get(17),h=get(32);
 for(const [loc,fragments] of [
  [l.ca,['Luis','Suministros Norte','11.30','218']],
  [l.es,['Luis','Suministros Norte','11:30','218']],
  [a.ca,['tres còpies','recepció','13.00']],
  [a.es,['tres copias','recepción','13:00']],
  [h.ca,['21 d’octubre','10.00','13.00','9.00']],
  [h.es,['21 de octubre','10:00','13:00','9:00']]
 ])for(const fragment of fragments)assert.ok(loc.question.includes(fragment),fragment);
});
test('all 60 questions are autonomous statements, bilingual, valid and page-traceable',()=>{
 assert.equal(ca.questions.length,60);
 assert.equal(manifest.questionTraces.length,60);
 assert.equal(Object.keys(es.questions).length,60);
 assert.equal(Object.keys(memory.questions).length,60);
 assert.equal(Object.keys(hard.questions).length,60);
 const ids=new Set();
 for(const q of ca.questions){
  assert.ok(q.id.startsWith(prefix)&&!ids.has(q.id));ids.add(q.id);
  const t=es.questions[q.id],m=memory.questions[q.id],h=hard.questions[q.id];
  assert.ok(q.question.length>28&&q.question.endsWith('?'));
  assert.ok(t.question.length>35&&t.question.endsWith('?'));
  assert.doesNotMatch(q.question,/\ben el cas de la\b|\ben l’activitat\b|\bsegons l’exemple\b/i);
  assert.doesNotMatch(t.question,/\ben el caso de la\b|\ben la actividad\b|\bsegún el ejemplo\b/i);
  assert.deepEqual(q.question.match(/\d+/g)||[],t.question.match(/\d+/g)||[],q.id+' numeric context divergence');
  assert.equal(q.options.length,4);assert.equal(t.options.length,4);
  assert.ok(q.options[q.correct]?.length>3&&t.options[q.correct]?.length>3);
  assert.ok(m.ca?.length>0&&m.es?.length>0);
  assert.equal(h.ca.length,3);assert.equal(h.es.length,3);
  const a=manifest.questionTraces.find(x=>x.id===q.id),b=trace.questionRanges[q.id];
  assert.deepEqual(a.pageRange,b.pageRange);
  assert.equal(a.source,'UF0520_U1_1');
  assert.ok(a.pageRange[0]>=4&&a.pageRange[1]<=43);
 }
 for(let n=1;n<=60;n++)assert.ok(ids.has(id(n)));
 assert.equal(manifest.review.contextAudit.reviewedCount,60);
 assert.equal(manifest.review.contextAudit.addedCount,28);
});
test('context-sensitive flashcards ask standalone questions rather than referring to answer options',()=>{
 for(const n of [24,26,55,56]){
  const r=cards.coreOverrides[id(n)];
  assert.ok(r?.ca?.question.endsWith('?')&&r?.es?.question.endsWith('?'));
  for(const s of [r.ca.question,r.es.question])assert.doesNotMatch(s,/següents|siguientes|quina afirmació|qué afirmación/i);
 }
});
