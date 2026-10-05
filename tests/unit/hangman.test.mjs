import test from 'node:test';
import assert from 'node:assert/strict';
import {foldLetter,isPlayableEntry,playableEntries,termHasGuess,maskedTerm,isSolved} from '../../site/js/hangman.js';

const entry=(ca,es=ca,blockId='b1')=>({id:'x',blockId,ca:{term:ca,definition:'d',memory:'m'},es:{term:es,definition:'d',memory:'m'}});

test('els accents comparteixen tecla amb la vocal base sense absorbir ç ni ñ',()=>{
  assert.equal(foldLetter('À'),'a');
  assert.equal(foldLetter('é'),'e');
  assert.equal(foldLetter('Ç'),'ç');
  assert.equal(foldLetter('Ñ'),'ñ');
  assert.equal(termHasGuess('Direcció','o'),true);
  assert.equal(termHasGuess('Direcció','ó'),true);
});

test('la màscara conserva espais i puntuació i resol lletres accentuades',()=>{
  const guesses=new Set(['f','u','n','c','i','o']);
  assert.equal(maskedTerm('Funció',guesses),'Funció');
  assert.equal(isSolved('Funció',guesses),true);
  assert.equal(maskedTerm('Funció pública',guesses).includes(' '),true);
});

test('només entren termes curts i jugables del diccionari',()=>{
  assert.equal(isPlayableEntry(entry('Cooperativa'),'ca'),true);
  assert.equal(isPlayableEntry(entry('S.A. vs. S.L.'),'ca'),false);
  assert.equal(isPlayableEntry(entry('IVA 21 %'),'ca'),false);
  const bank={entries:[entry('Cooperativa'),entry('Autoritat','Autoridad','b2'),entry('IVA 21 %')]};
  assert.deepEqual(playableEntries(bank,{language:'ca',blockId:'b1'}).map(x=>x.ca.term),['Cooperativa']);
});
