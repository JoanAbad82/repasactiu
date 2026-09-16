import test from 'node:test';
import assert from 'node:assert/strict';
import { runPermutationAudit, generatePermutations } from '../../scripts/audit-permutations.mjs';

test('generatePermutations produeix exactament les 24 permutacions de quatre opcions', () => {
  const permutations=generatePermutations([0,1,2,3]);
  assert.equal(permutations.length,24);
  assert.equal(new Set(permutations.map(p=>p.join(','))).size,24);
});

test('les 450 preguntes superen totes les 24 permutacions en català i castellà', async () => {
  const result=await runPermutationAudit();
  assert.equal(result.questions,450);
  assert.equal(result.permutationsPerQuestion,24);
  assert.equal(result.languages,2);
  assert.equal(result.cases,21600);
  assert.deepEqual(result.errors,[]);
});
