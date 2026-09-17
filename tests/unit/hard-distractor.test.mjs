import test from 'node:test';
import assert from 'node:assert/strict';
import {
  composeHardQuestion,
  validateHardRecord
} from '../../scripts/hard-distractor-lib.mjs';

function baseQuestion(correct=0){
  const ca=['CA-A','CA-B','CA-C','CA-D'];
  const es=['ES-A','ES-B','ES-C','ES-D'];
  return {
    id:'q1',
    block:'bloc-1',
    topic:'Tema',
    question:'Pregunta?',
    options:ca,
    correct,
    explanation:'Explicació',
    translations:{es:{topic:'Tema',question:'¿Pregunta?',options:es,explanation:'Explicación'}}
  };
}

const hard={
  ca:['CA-H1','CA-H2','CA-H3'],
  es:['ES-H1','ES-H2','ES-H3']
};

for(const correct of [0,1,2,3]){
  test(`composeHardQuestion conserva la resposta correcta amb correct=${correct}`,()=>{
    const q=baseQuestion(correct);
    const before=structuredClone(q);
    const result=composeHardQuestion(q,hard);
    assert.equal(result.correct,correct);
    assert.equal(result.options[correct],q.options[correct]);
    assert.equal(result.translations.es.options[correct],q.translations.es.options[correct]);
    assert.deepEqual(result.options.filter((_,i)=>i!==correct),hard.ca);
    assert.deepEqual(result.translations.es.options.filter((_,i)=>i!==correct),hard.es);
    assert.deepEqual(q,before);
  });
}

test('validateHardRecord accepta exactament tres distractors vàlids per idioma',()=>{
  const errors=validateHardRecord(baseQuestion(0),hard);
  assert.deepEqual(errors,[]);
});

test('validateHardRecord rebutja duplicats, resposta correcta i menys de dos canvis respecte pràctica',()=>{
  const q=baseQuestion(0);
  const record={
    ca:['CA-A','CA-B','CA-B'],
    es:['ES-A','ES-B','ES-B']
  };
  const errors=validateHardRecord(q,record);
  assert.ok(errors.some(x=>x.includes('correct')));
  assert.ok(errors.some(x=>x.includes('duplicat')));
  assert.ok(errors.some(x=>x.includes('almenys 2')));
});

test('validateHardRecord rebutja arrays incomplets o buits',()=>{
  const errors=validateHardRecord(baseQuestion(0),{ca:['A','B'],es:['A','B','']});
  assert.ok(errors.some(x=>x.includes('ca')));
  assert.ok(errors.some(x=>x.includes('es')));
});
