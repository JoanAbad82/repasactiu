import test from 'node:test';
import assert from 'node:assert/strict';
import { applyContentCorrections } from '../../site/js/catalog.js';

const ambiguous={
  blockId:'bloc-2',
  questions:[{
    id:'b2-037',block:'bloc-2',topic:'Tipus de capital',
    question:'Una empresa rep el 60% del capital d’una administració i el 40% d’inversors privats. Quin tipus és segons l’origen del capital?',
    options:['Pública, perquè la majoria és pública','Privada, perquè hi ha inversors privats','Mixta, perquè combina aportacions públiques i privades','Cooperativa, perquè hi ha més d’un aportant'],
    correct:2,
    explanation:'Una empresa mixta combina capital públic i privat, independentment del percentatge concret de cada part.',
    translations:{es:{question:'Una empresa recibe el 60 % del capital de una administración y el 40 % de inversores privados. ¿Qué tipo es según el origen del capital?',options:['Pública, porque la mayoría es pública','Privada, porque hay inversores privados','Mixta, porque combina aportaciones públicas y privadas','Cooperativa, porque hay más de un aportante'],explanation:'Una empresa mixta combina capital público y privado, independientemente del porcentaje concreto de cada parte.'}},
    memoryAid:{type:'example',ca:'60% públic i 40% privat continua sent capital mixt perquè hi participen tots dos sectors.',es:'60% público y 40% privado sigue siendo capital mixto porque participan ambos sectores.'}
  }]
};

const corrections={questions:{
  'b2-037':{
    canonical:{
      question:'Una empresa rep aportacions de capital d’una administració pública i també d’inversors privats. Quin tipus és segons l’origen del capital?',
      options:['Pública, perquè hi participa una administració','Privada, perquè hi ha inversors privats','Mixta, perquè combina aportacions públiques i privades','Cooperativa, perquè hi ha més d’un aportant'],
      explanation:'Segons el material, una empresa mixta combina aportacions de capital del sector públic i del sector privat.'
    },
    es:{
      question:'Una empresa recibe aportaciones de capital de una administración pública y también de inversores privados. ¿Qué tipo es según el origen del capital?',
      options:['Pública, porque participa una administración','Privada, porque hay inversores privados','Mixta, porque combina aportaciones públicas y privadas','Cooperativa, porque hay más de un aportante'],
      explanation:'Según el material, una empresa mixta combina aportaciones de capital del sector público y del sector privado.'
    },
    memoryAid:{type:'example',ca:'Capital públic + capital privat = empresa mixta.',es:'Capital público + capital privado = empresa mixta.'}
  }
}};

test('b2-037 elimina la contradicció 60/40 entre empresa pública i mixta',()=>{
  const corrected=applyContentCorrections(ambiguous,corrections);
  const q=corrected.questions[0];
  assert.equal(q.correct,2);
  assert.match(q.question,/aportacions de capital/);
  assert.doesNotMatch(q.question,/60%|40%/);
  assert.doesNotMatch(q.options[0],/majoria/);
  assert.match(q.translations.es.question,/aportaciones de capital/);
  assert.doesNotMatch(q.translations.es.question,/60\s*%|40\s*%/);
  assert.equal(q.memoryAid.ca,'Capital públic + capital privat = empresa mixta.');
});

test('les correccions no poden canviar id, bloc ni índex correct',()=>{
  const invalid={questions:{'b2-037':{canonical:{correct:0}}}};
  assert.throws(()=>applyContentCorrections(ambiguous,invalid),/camp protegit/);
});
