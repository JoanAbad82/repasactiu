import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const get=async p=>JSON.parse(await readFile(new URL('../../'+p,import.meta.url),'utf8'));
const [u3,u2,es3,es2,extra,trace3,trace2,manifest]=await Promise.all([
 'site/data/uf0519_unitat_3_bloc_2.json','site/data/uf0519_unitat_2_bloc_2.json',
 'site/data/i18n/es/uf0519-unitat-3-bloc-2.json','site/data/i18n/es/uf0519-unitat-2-bloc-2.json',
 'site/data/study-cards-extra.json','docs/content/UF0519_U3_SOURCE_TRACEABILITY.json',
 'docs/content/UF0519_SOURCE_TRACEABILITY.json','docs/content/NEW_CLASS_SOURCES_20261013.json'
].map(get));
const pick=(bank,id)=>{const q=bank.questions.find(x=>x.id===id);assert.ok(q,'missing '+id);return q.options[q.correct];};
test('inventaris: 6 solucions derivades de les dades del document original',()=>{
 const results=[57,12,75,14,24,10];
 for(let i=0;i<results.length;i++){
  const id='uf0519-u3b2-'+String(32+i).padStart(3,'0');
  const q=pick(u3,id);
  assert.equal(Number(q.match(/\d+/)[0]),results[i],id);
  assert.ok(trace3.questionTraces.some(t=>t.id===id&&t.source==='UF0519_U3_INVENTORY_20261013'));
 }
});
test('plantilles XLSX: dos exemples numèrics etiquetats sintètics i amb caselles font',()=>{
 for(const [id,result,source] of [
  ['uf0519-u2b2-042',135,'XLSX_CASH_TEMPLATE_20261013'],
  ['uf0519-u2b2-043',1270,'XLSX_BANK_TEMPLATE_20261013']
 ]){
  assert.equal(Number(pick(u2,id).match(/[\d.]+/)[0].replaceAll('.','')),result);
  const t=trace2.questionTraces.find(x=>x.id===id);
  assert.equal(t.source,source);assert.deepEqual(t.cells,['A6:E7']);
  assert.equal(t.kind,'SYNTHETIC_ON_EMPTY_TEMPLATE');
  assert.match(u2.questions.find(x=>x.id===id).question,/Exemple inventat/);
 }
});
test('20 preguntes noves bilingües i sis targetes independents amb pàgina',()=>{
 const new3=u3.questions.filter(x=>/^uf0519-u3b2-0(2\d|3\d)$/.test(x.id));
 const new2=u2.questions.filter(x=>/^uf0519-u2b2-04[23]$/.test(x.id));
 assert.equal(new3.length,18);assert.equal(new2.length,2);
 for(const q of new3){assert.equal(es3.questions[q.id].options.length,4);assert.ok(es3.questions[q.id].options[q.correct]);}
 for(const q of new2){assert.equal(es2.questions[q.id].options.length,4);assert.ok(es2.questions[q.id].options[q.correct]);}
 const independent=extra.cards.filter(x=>x.id.startsWith('sc-uf0519-u3b2-ext-'));
 assert.equal(independent.length,6);
 for(const c of independent){assert.equal(c.source.id,'UF0519_U3_BLOC2_20261013');assert.ok(c.ca.mnemonic&&c.es.mnemonic);assert.ok(c.source.pages[0]>=1&&c.source.pages[0]<=39);}
 assert.equal(manifest.extensionAudit.addedQuestions,20);
});
