import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=async rel=>JSON.parse(await readFile(new URL('../../site/data/'+rel,import.meta.url),'utf8'));

test('b1-042 identifica explícitament control i responsabilitat en CA i ES',async()=>{
  const ca=await read('bloc_1_extra.json');
  const es=await read('i18n/es/bloc-1.json');
  const q=ca.questions.find(item=>item.id==='b1-042');
  assert.ok(q);
  assert.match(q.question,/control/iu);
  assert.match(q.question,/responsabilitat/iu);
  assert.doesNotMatch(q.question,/dos principis treballats al bloc/iu);
  assert.match(es.questions['b1-042'].question,/control/iu);
  assert.match(es.questions['b1-042'].question,/responsabilidad/iu);
  assert.doesNotMatch(es.questions['b1-042'].question,/dos principios trabajados en el bloque/iu);
});
