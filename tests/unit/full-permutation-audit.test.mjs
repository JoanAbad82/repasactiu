import test from 'node:test';
import assert from 'node:assert/strict';
import { runPermutationAudit, generatePermutations } from '../../scripts/audit-permutations.mjs';

test('generatePermutations produeix exactament les 24 permutacions de quatre opcions', () => {
  const permutations=generatePermutations([0,1,2,3]);
  assert.equal(permutations.length,24);
  assert.equal(new Set(permutations.map(p=>p.join(','))).size,24);
});

test('totes les preguntes publicades superen les 24 permutacions en pràctica i examen difícil, en català i castellà', async () => {
  const result=await runPermutationAudit();
  const perRepresentation=result.questions*result.permutationsPerQuestion*result.languages;
  assert.equal(result.questions,842);
  assert.equal(result.permutationsPerQuestion,24);
  assert.equal(result.languages,2);
  assert.equal(result.practiceCases,perRepresentation);
  assert.equal(result.hardCases,perRepresentation);
  assert.equal(result.practiceCases,40416);
  assert.equal(result.hardCases,40416);
  assert.equal(result.cases,80832);
  assert.deepEqual(result.errors,[]);
});
