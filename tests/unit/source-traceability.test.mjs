import test from 'node:test';
import assert from 'node:assert/strict';
import {validateSourceTraceability} from '../../scripts/validate-source-traceability.mjs';

test('les 450 preguntes tenen traçabilitat a una de les sis fonts autoritzades',async()=>{
  const result=await validateSourceTraceability();
  assert.equal(result.questions,450);
  assert.equal(result.traceable,450);
  assert.equal(result.sources,6);
  assert.equal(result.corrections,1);
  assert.deepEqual(result.errors,[]);
});
