import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
  selectBalancedPairs,
  buildMemoryDeck,
  evaluatePair,
  formatElapsed
} from '../../site/js/memory-game.js';

const bank=JSON.parse(await readFile(new URL('../../site/data/memory-game-es.json',import.meta.url),'utf8'));

test('el banco de memoria contiene 42 parejas españolas, 6 por cada bloque',()=>{
  assert.equal(bank.language,'es');
  assert.equal(bank.pairs.length,42);
  const counts={};
  const ids=new Set();
  for(const pair of bank.pairs){
    assert.ok(pair.id);
    assert.equal(ids.has(pair.id),false,pair.id+': id duplicado');
    ids.add(pair.id);
    assert.ok(pair.left?.trim());
    assert.ok(pair.right?.trim());
    assert.ok(pair.source?.id);
    assert.ok(Array.isArray(pair.source.pages)&&pair.source.pages.length===2);
    counts[pair.blockId]=(counts[pair.blockId]||0)+1;
  }
  assert.deepEqual(counts,{
    'bloc-1':6,
    'bloc-2':6,
    'bloc-3':6,
    'bloc-4':6,
    'bloc-5':6,
    'unitat-2-bloc-1':6,
    'uf0518-bloc-1':6
  });
});

test('Fácil selecciona 8 parejas equilibradas y cubre los 7 bloques',()=>{
  const selected=selectBalancedPairs(bank.pairs,8,()=>0.314159);
  assert.equal(selected.length,8);
  assert.equal(new Set(selected.map(p=>p.blockId)).size,7);
});

test('Difícil selecciona 18 parejas con al menos dos de cada bloque',()=>{
  const selected=selectBalancedPairs(bank.pairs,18,()=>0.271828);
  assert.equal(selected.length,18);
  const counts={};
  for(const pair of selected)counts[pair.blockId]=(counts[pair.blockId]||0)+1;
  assert.equal(Object.keys(counts).length,7);
  for(const blockId of Object.keys(counts))assert.ok(counts[blockId]>=2,blockId+': menos de dos parejas');
});

test('buildMemoryDeck crea exactamente dos tarjetas por pareja',()=>{
  const pairs=bank.pairs.slice(0,8);
  const deck=buildMemoryDeck(pairs,()=>0.42);
  assert.equal(deck.length,16);
  for(const pair of pairs){
    const cards=deck.filter(card=>card.pairId===pair.id);
    assert.equal(cards.length,2);
    assert.deepEqual(new Set(cards.map(card=>card.side)),new Set(['left','right']));
  }
});

test('evaluatePair solo acepta las dos caras de la misma pareja',()=>{
  assert.equal(evaluatePair({pairId:'p1',side:'left'},{pairId:'p1',side:'right'}),true);
  assert.equal(evaluatePair({pairId:'p1',side:'left'},{pairId:'p1',side:'left'}),false);
  assert.equal(evaluatePair({pairId:'p1',side:'left'},{pairId:'p2',side:'right'}),false);
});

test('formatElapsed produce un contador mm:ss',()=>{
  assert.equal(formatElapsed(0),'0:00');
  assert.equal(formatElapsed(9),'0:09');
  assert.equal(formatElapsed(65),'1:05');
});
