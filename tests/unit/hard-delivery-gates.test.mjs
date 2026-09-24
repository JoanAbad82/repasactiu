import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const course=JSON.parse(await readFile(new URL('../../site/data/course.json',import.meta.url),'utf8'));
const pkg=JSON.parse(await readFile(new URL('../../package.json',import.meta.url),'utf8'));

test('tots els blocs declaren exactament un overlay de distractors difícils',()=>{
  assert.equal(course.blocks.length,14);
  for(const block of course.blocks){
    assert.match(block.hardDistractorFile||'',/^data\/hard\/.+\.json$/);
  }
  assert.equal(new Set(course.blocks.map(block=>block.hardDistractorFile)).size,course.blocks.length);
});

test('audit:full executa explícitament l auditoria hard',()=>{
  assert.equal(pkg.scripts['test:audit:hard'],'node scripts/hard-distractor-lib.mjs');
  assert.match(pkg.scripts['audit:full'],/npm run test:audit:hard/);
});


test('audit:full inclou l auditoria del nivell estàndard reforçat',()=>{
  assert.equal(pkg.scripts['test:audit:standard-distractors'],'node scripts/audit-standard-distractors.mjs');
  assert.match(pkg.scripts['audit:full'],/npm run test:audit:standard-distractors/);
});
