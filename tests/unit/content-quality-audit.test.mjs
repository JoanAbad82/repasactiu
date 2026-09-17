import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeForComparison,
  findExactDuplicateQuestions,
  detectCatalanLeakageInSpanish,
  validateTraceEntry,
  runContentQualityAudit
} from '../../scripts/content-quality-lib.mjs';

test('normalitza majúscules, espais, accents i puntuació per comparar enunciats',()=>{
  assert.equal(normalizeForComparison('  Què és l’EMPRESA?  '),"que es l empresa");
});

test('detecta enunciats duplicats encara que canviïn només accents o puntuació',()=>{
  const duplicates=findExactDuplicateQuestions([
    {id:'a',question:'Què és una empresa?'},
    {id:'b',question:'Que es una empresa!'},
    {id:'c',question:'Quina funció té?'}
  ]);
  assert.deepEqual(duplicates,[['a','b']]);
});

test('detecta català inequívoc dins camps castellans sense confondre termes compartits',()=>{
  assert.deepEqual(detectCatalanLeakageInSpanish({topic:'Comunicació escrita',question:'¿Qué documento corresponde?',explanation:'Es correcto.'}),['topic']);
  assert.deepEqual(detectCatalanLeakageInSpanish({topic:'Recursos humanos',question:'¿Qué documento corresponde?',explanation:'Es correcto.'}),[]);
});

test('rebutja traçabilitat fora dels límits físics de la font',()=>{
  assert.deepEqual(validateTraceEntry({id:'q1',source:'S1',pageRange:[2,4]},{S1:{pages:3}}),['q1: pageRange 2-4 fora de S1 (1-3)']);
  assert.deepEqual(validateTraceEntry({id:'q1',source:'S1',pageRange:[2,3]},{S1:{pages:3}}),[]);
});

test('auditoria editorial completa cobreix totes les preguntes publicades',async()=>{
  const result=await runContentQualityAudit();
  assert.equal(result.questions,526);
  assert.equal(result.translations,526);
  assert.equal(result.traceable,526);
  assert.deepEqual(result.errors,[]);
});
