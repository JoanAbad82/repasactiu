import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {shuffleCards,wrapIndex} from '../../site/js/study-cards.js';

const bank=JSON.parse(await readFile(new URL('../../site/data/study-cards-es.json',import.meta.url),'utf8'));

test('el banco contiene 42 tarjetas de estudio españolas, 6 por bloque',()=>{
  assert.equal(bank.language,'es');
  assert.equal(bank.cards.length,42);
  const counts={};
  const ids=new Set();
  for(const card of bank.cards){
    assert.ok(card.id);
    assert.equal(ids.has(card.id),false,card.id+': id duplicado');
    ids.add(card.id);
    assert.match(card.question,/^¿.+\?$/u);
    assert.ok(card.answer?.trim());
    assert.ok(card.mnemonic?.trim());
    assert.ok([...card.mnemonic].length<=100,card.id+': mnemotecnia demasiado larga');
    assert.ok(card.source?.id);
    assert.ok(Array.isArray(card.source.pages)&&card.source.pages.length===2);
    counts[card.blockId]=(counts[card.blockId]||0)+1;
  }
  assert.deepEqual(counts,{
    'bloc-1':6,'bloc-2':6,'bloc-3':6,'bloc-4':6,'bloc-5':6,
    'unitat-2-bloc-1':6,'uf0518-bloc-1':6
  });
});

test('shuffleCards conserva exactamente las mismas tarjetas',()=>{
  const shuffled=shuffleCards(bank.cards,()=>0.271828);
  assert.equal(shuffled.length,42);
  assert.deepEqual(new Set(shuffled.map(c=>c.id)),new Set(bank.cards.map(c=>c.id)));
});

test('wrapIndex permite navegación circular',()=>{
  assert.equal(wrapIndex(0,42),0);
  assert.equal(wrapIndex(42,42),0);
  assert.equal(wrapIndex(-1,42),41);
});
