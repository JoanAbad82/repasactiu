import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=async rel=>JSON.parse(await readFile(new URL('../../site/data/'+rel,import.meta.url),'utf8'));

test('b1-042 queda corregida a la capa auditada sense mutar el banc històric',async()=>{
  const corrections=await read('content_corrections.json');
  const q=corrections.questions['b1-042'];
  assert.ok(q);
  assert.match(q.canonical.question,/control/iu);
  assert.match(q.canonical.question,/responsabilitat/iu);
  assert.doesNotMatch(q.canonical.question,/dos principis treballats al bloc/iu);
  assert.match(q.es.question,/control/iu);
  assert.match(q.es.question,/responsabilidad/iu);
  assert.doesNotMatch(q.es.question,/dos principios trabajados en el bloque/iu);
  assert.match(q.memoryAid.ca,/responsabilitat/iu);
  assert.match(q.memoryAid.es,/responsabilidad/iu);
});


test('b1-049 usa la definició font del control de l’organització',async()=>{
  const banks=await Promise.all(['bloc_1.json','bloc_1_extra.json','bloc_1_expansion.json'].map(read));
  const es=await read('i18n/es/bloc-1-expansion.json');
  const q=banks.flatMap(bank=>bank.questions).find(item=>item.id==='b1-049');
  assert.ok(q);
  assert.match(q.question,/supervisa/iu);
  assert.match(q.question,/coordina/iu);
  assert.match(q.explanation,/supervisar/iu);
  assert.match(q.explanation,/organitzar/iu);
  assert.doesNotMatch(q.explanation,/desviacions/iu);
  assert.match(es.questions['b1-049'].explanation,/supervisar/iu);
  assert.match(es.questions['b1-049'].explanation,/organizar/iu);
  assert.doesNotMatch(es.questions['b1-049'].explanation,/desviaciones/iu);
});
