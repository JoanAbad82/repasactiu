import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHRONOLOGY_SOURCE_ORDER,
  chronologyKey,
  compareChronology,
  chronologyInversions,
  resolveSourceId,
  sortChronologically
} from '../../site/js/chronology.js';

const item=(id,source,page,concept)=>({
  id,blockId:'bloc-1',sourceRef:{id:source,pageRange:[page,page],precision:'question'},conceptId:concept
});

test('ordre canònic de fonts segueix el recorregut pedagògic del curs',()=>{
  assert.deepEqual(CHRONOLOGY_SOURCE_ORDER,[
    'B1','B2','B3','B4','B5','U2B1',
    'UF0518_B1','UF0518_B2','UF0518_B3',
    'UF0519_U1','MF0969_PRESENTACIO'
  ]);
});

test('comparador aplica source → pàgina → concepte → id',()=>{
  const input=[
    item('c','B2',1,'A'),
    item('b','B1',7,'B'),
    item('d','B1',7,'A'),
    item('a','B1',5,'Z')
  ];
  assert.deepEqual(sortChronologically(input).map(x=>x.id),['a','d','b','c']);
  assert.equal(chronologyInversions(sortChronologically(input)).length,0);
});

test('resolució de font abreujada UF0518 respecta el bloc',()=>{
  assert.equal(resolveSourceId('UF0518','uf0518-bloc-1'),'UF0518_B1');
  assert.equal(resolveSourceId('UF0518','uf0518-bloc-2'),'UF0518_B2');
  assert.equal(resolveSourceId('UF0518','uf0518-bloc-3'),'UF0518_B3');
  assert.equal(resolveSourceId('UF0519','uf0519-bloc-5'),'UF0519_U1');
  assert.equal(resolveSourceId('MF0969','uf0519-bloc-5'),'MF0969_PRESENTACIO');
});

test('chronologyKey rebutja fonts o rangs sense traçabilitat vàlida',()=>{
  assert.throws(()=>chronologyKey({id:'x',sourceRef:{id:'NOPE',pageRange:[1,1]}}),/desconeguda/);
  assert.throws(()=>chronologyKey({id:'x',sourceRef:{id:'B1',pageRange:null}}),/invàlid/);
});

test('compareChronology és estable per id quan font pàgina i concepte coincideixen',()=>{
  assert.ok(compareChronology(item('q-2','B1',5,'A'),item('q-10','B1',5,'A'))<0);
});
