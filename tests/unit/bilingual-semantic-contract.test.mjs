import test from 'node:test';
import assert from 'node:assert/strict';
import {runBilingualContractAudit} from '../../scripts/audit-bilingual-contract.mjs';

test('les 450 preguntes compleixen el contracte bilingüe i editorial estricte',async()=>{
  const result=await runBilingualContractAudit();
  assert.equal(result.questions,450);
  assert.equal(result.translations,450);
  assert.equal(result.memoryAids,450);
  assert.equal(result.corrections,1);
  assert.deepEqual(result.errors,[]);
});
