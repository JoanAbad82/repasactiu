import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {validateSourceTraceability} from '../../scripts/validate-source-traceability.mjs';

test('les preguntes publicades tenen traçabilitat completa a les fonts autoritzades',async()=>{
  const result=await validateSourceTraceability();
  assert.equal(result.manifests,2);
  assert.equal(result.questions,526);
  assert.equal(result.traceable,526);
  assert.equal(result.sources,7);
  assert.equal(result.corrections,1);
  assert.deepEqual(result.errors,[]);
});

test('la traçabilitat combina UF0517 i UF0518 sense fixar el total a 450',async()=>{
  const root=path.resolve('.');
  const result=await validateSourceTraceability({tracePaths:[
    path.join(root,'docs','content','UF0517_SOURCE_TRACEABILITY.json'),
    path.join(root,'docs','content','UF0518_SOURCE_TRACEABILITY.json')
  ]});
  assert.equal(result.manifests,2);
  assert.equal(result.questions,526);
  assert.equal(result.traceable,result.questions);
  assert.deepEqual(result.errors,[]);
});
