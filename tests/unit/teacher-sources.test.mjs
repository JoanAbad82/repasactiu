import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const readJson=async rel=>JSON.parse(await readFile(new URL('../../'+rel,import.meta.url),'utf8'));

test('les 11 fonts validades per la professora governen tots els manifests de traçabilitat',async()=>{
  const [canonical,uf0517,uf0518,uf0519,studyTrace,extra]=await Promise.all([
    readJson('docs/content/TEACHER_VALIDATED_SOURCES_2026-09-24.json'),
    readJson('docs/content/UF0517_SOURCE_TRACEABILITY.json'),
    readJson('docs/content/UF0518_SOURCE_TRACEABILITY.json'),
    readJson('docs/content/UF0519_SOURCE_TRACEABILITY.json'),
    readJson('site/data/study-cards-traceability-v2.json'),
    readJson('site/data/study-cards-extra.json')
  ]);

  assert.equal(canonical.status,'CANONICAL_TEACHER_VALIDATED');
  assert.equal(canonical.files.length,11);
  assert.equal(new Set(canonical.files.map(x=>x.sourceId)).size,11);
  assert.equal(new Set(canonical.files.map(x=>x.sha256)).size,11);

  const expected=Object.fromEntries(canonical.files.map(x=>[x.sourceId,{file:x.file,pages:x.pages}]));
  const combined={...uf0517.sources,...uf0518.sources,...uf0519.sources};
  for(const [id,source] of Object.entries(expected)){
    assert.deepEqual(combined[id],source,id);
    assert.deepEqual(studyTrace.sources[id],source,'study trace '+id);
  }
  for(const [id,source] of Object.entries(extra.sources)){
    assert.deepEqual(source,expected[id],'extra '+id);
  }

  const firstUf0518=uf0518.questionTraces.find(x=>x.id==='uf0518-b1-001');
  assert.deepEqual(firstUf0518.pageRange,[6,6]);
  assert.equal(uf0518.sources.UF0518_B1.pages,31);
});
