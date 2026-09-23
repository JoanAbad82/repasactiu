import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
  validateKeyLists,
  filterKeyListEntries,
  groupKeyListEntriesByFamily,
  renderConceptDictionaryHtml
} from '../../site/js/concept-dictionary.js';

const concepts=JSON.parse(await readFile(new URL('../../site/data/concept-dictionary-v1.json',import.meta.url),'utf8'));
const keyLists=JSON.parse(await readFile(new URL('../../site/data/key-lists-v1.json',import.meta.url),'utf8'));

test('el banc publica 74 llistes bilingües distribuïdes en deu famílies',()=>{
  const validated=validateKeyLists(keyLists);
  assert.equal(validated.entries.length,74);
  assert.equal(validated.families.length,10);
  assert.equal(validated.families.flatMap(f=>f.entryIds).length,74);
  assert.equal(validated.entries.filter(entry=>entry.ordered).length,13);
  for(const entry of validated.entries){
    assert.equal(entry.ca.items.length,entry.es.items.length);
    assert.ok(entry.ca.items.length>=3);
  }
});

test('la cerca troba una llista pels seus elements i el filtre conserva el bloc',()=>{
  const byItem=filterKeyListEntries(keyLists,{language:'ca',query:'traçabilitat'});
  assert.ok(byItem.some(entry=>entry.id==='uf2-criteris-canal'));
  const byBlock=filterKeyListEntries(keyLists,{language:'es',blockId:'bloc-5'});
  assert.equal(byBlock.length,4);
  assert.deepEqual(byBlock.map(entry=>entry.id),[
    'b5-organitzacio-publica','b5-poders-estat','b5-institucions-autonomiques','b5-institucions-ue'
  ]);
});

test('les llistes es mantenen agrupades pedagògicament',()=>{
  const entries=filterKeyListEntries(keyLists,{language:'ca'});
  const grouped=groupKeyListEntriesByFamily(keyLists,entries);
  assert.equal(grouped.length,10);
  assert.equal(grouped[0].family.id,'empresa-organitzacio');
  assert.equal(grouped[0].entries.length,16);
  assert.equal(grouped.at(-1).family.id,'operacions-informatiques');
  assert.equal(grouped.at(-1).entries.length,3);
});

test('la pestanya de llistes mostra conjunts, seqüències, font i mnemotècnia',()=>{
  const html=renderConceptDictionaryHtml(concepts,{language:'ca',keyLists,mode:'lists'});
  assert.match(html,/Llistes clau/);
  assert.match(html,/74<\/strong> llistes/);
  assert.match(html,/Criteris principals per escollir un canal d’enviament/);
  assert.match(html,/Contingut/);
  assert.match(html,/Traçabilitat/);
  assert.match(html,/Ordre important/);
  assert.match(html,/R-C-R-C-G/);
  assert.match(html,/UF0518_B3 · p. 8/);
});

test('la pestanya de llistes canvia íntegrament a castellà',()=>{
  const html=renderConceptDictionaryHtml(concepts,{language:'es',keyLists,mode:'lists',query:'trazabilidad'});
  assert.match(html,/Listas clave/);
  assert.match(html,/Criterios principales para elegir un canal de envío/);
  assert.match(html,/Contenido/);
  assert.match(html,/Trazabilidad/);
  assert.doesNotMatch(html,/Criteris principals/);
});
