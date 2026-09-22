import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loadConceptDictionary,
  filterConceptEntries,
  groupConceptEntriesByFamily,
  renderConceptDictionaryHtml,
  sourceLabel
} from '../../site/js/concept-dictionary.js';

const bank={
  version:1,
  count:75,
  languages:['ca','es'],
  groups:[
    {id:'bloc-1',ca:'Bloc 1',es:'Bloque 1'},
    {id:'bloc-3',ca:'Bloc 3',es:'Bloque 3'}
  ],
  families:[
    {id:'entities',ca:'Entitats',es:'Entidades',entryIds:['entitat-publica']},
    {id:'organization',ca:'Organització',es:'Organización',entryIds:['delegacio']}
  ],
  entries:[
    {
      id:'delegacio',blockId:'bloc-3',source:{id:'B3',pages:[13,13]},
      ca:{term:'Delegació',definition:'Assignar tasques mantenint responsabilitat general.',memory:'Delegar no és desentendre’s.'},
      es:{term:'Delegación',definition:'Asignar tareas manteniendo responsabilidad general.',memory:'Delegar no es desentenderse.'}
    },
    {
      id:'entitat-publica',blockId:'bloc-1',source:{id:'B1',pages:[17,17]},
      ca:{term:'Entitat pública',definition:'Organització vinculada a una administració pública.',memory:'Pública = administració.'},
      es:{term:'Entidad pública',definition:'Organización vinculada a una administración pública.',memory:'Pública = administración.'}
    }
  ]
};

test('loadConceptDictionary valida 75 conceptes i una partició completa en famílies',async()=>{
  const entries=Array.from({length:75},(_,i)=>({
    id:'c'+i,blockId:'bloc-1',source:{id:'B1',pages:[17,17]},
    ca:{term:'Terme '+i,definition:'Definició '+i,memory:'Recorda '+i},
    es:{term:'Término '+i,definition:'Definición '+i,memory:'Recuerda '+i}
  }));
  const full={...bank,entries,families:[{id:'all',ca:'Família',es:'Familia',entryIds:entries.map(x=>x.id)}]};
  const loaded=await loadConceptDictionary(async()=>({ok:true,json:async()=>full}));
  assert.equal(loaded.entries.length,75);
});

test('filterConceptEntries cerca sense accents i filtra per bloc',()=>{
  const bySearch=filterConceptEntries(bank,{language:'ca',query:'delegacio'});
  assert.deepEqual(bySearch.map(x=>x.id),['delegacio']);
  const byBlock=filterConceptEntries(bank,{language:'es',blockId:'bloc-1'});
  assert.deepEqual(byBlock.map(x=>x.id),['entitat-publica']);
});

test('filterConceptEntries segueix l’ordre pedagògic de famílies, no l’alfabètic',()=>{
  const result=filterConceptEntries(bank,{language:'ca'});
  assert.deepEqual(result.map(x=>x.id),['entitat-publica','delegacio']);
});

test('groupConceptEntriesByFamily conserva famílies i ordre intern',()=>{
  const entries=filterConceptEntries(bank,{language:'ca'});
  const grouped=groupConceptEntriesByFamily(bank,entries);
  assert.deepEqual(grouped.map(x=>x.family.id),['entities','organization']);
  assert.deepEqual(grouped.map(x=>x.entries.map(e=>e.id)),[['entitat-publica'],['delegacio']]);
});

test('sourceLabel mostra pàgina o rang de pàgines',()=>{
  assert.equal(sourceLabel({id:'B3',pages:[13,13]},'ca'),'B3 · p. 13');
  assert.equal(sourceLabel({id:'B2',pages:[6,7]},'es'),'B2 · pp. 6–7');
});

test('renderConceptDictionaryHtml és bilingüe i mostra famílies, recordatori i font',()=>{
  const ca=renderConceptDictionaryHtml(bank,{language:'ca'});
  assert.match(ca,/Diccionari de conceptes clau/);
  assert.match(ca,/Família conceptual/);
  assert.match(ca,/Entitats/);
  assert.match(ca,/Organització/);
  assert.match(ca,/Recorda:/);
  assert.match(ca,/B3 · p. 13/);
  const es=renderConceptDictionaryHtml(bank,{language:'es',query:'delegacion'});
  assert.match(es,/Diccionario de conceptos clave/);
  assert.match(es,/Familia conceptual/);
  assert.match(es,/Delegación/);
  assert.match(es,/Recuerda:/);
});
