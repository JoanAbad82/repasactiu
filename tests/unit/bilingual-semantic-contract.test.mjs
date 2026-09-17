import test from 'node:test';
import assert from 'node:assert/strict';
import {runBilingualContractAudit} from '../../scripts/audit-bilingual-contract.mjs';

test('totes les preguntes publicades compleixen el contracte bilingüe i editorial estricte',async()=>{
  const result=await runBilingualContractAudit();
  assert.equal(result.questions,526);
  assert.equal(result.translations,result.questions);
  assert.equal(result.memoryAids,result.questions);
  assert.equal(result.corrections,1);
  assert.deepEqual(result.errors,[]);
});
