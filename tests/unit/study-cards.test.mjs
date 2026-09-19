import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCoreStudyCards,
  buildExtraStudyCards,
  selectCardsByBlocks,
  buildStudyCatalog,
  shuffleCards,
  wrapIndex
} from '../../site/js/study-cards.js';

const mockBanks=[
  {
    blockId:'bloc-1',unitId:'unitat-1',unitTitle:'Unitat 1',unitTitleEs:'Unidad 1',blockNumber:1,blockTitle:'Bloc A',blockTitleEs:'Bloque A',
    questions:[{
      id:'q1',question:'Pregunta CA?',options:['Correcta CA','No'],correct:0,
      translations:{es:{question:'¿Pregunta ES?',options:['Correcta ES','No'],topic:'Tema ES'}},
      memoryAid:{type:'idea',ca:'Memòria CA',es:'Memoria ES'}
    }]
  },
  {
    blockId:'bloc-2',unitId:'unitat-1',unitTitle:'Unitat 1',unitTitleEs:'Unidad 1',blockNumber:2,blockTitle:'Bloc B',blockTitleEs:'Bloque B',
    questions:[{
      id:'q2',question:'Segona CA?',options:['No','Resposta CA'],correct:1,
      translations:{es:{question:'¿Segunda ES?',options:['No','Respuesta ES'],topic:'Tema ES'}},
      memoryAid:{type:'idea',ca:'Memòria 2',es:'Memoria 2'}
    }]
  }
];

const extras={cards:[
  {id:'e1',blockId:'bloc-1',ca:{question:'Extra CA?',answer:'Resposta extra CA',mnemonic:'Truc CA'},es:{question:'¿Extra ES?',answer:'Respuesta extra ES',mnemonic:'Truco ES'}},
  {id:'e2',blockId:'bloc-2',ca:{question:'Extra 2 CA?',answer:'Resposta 2 CA',mnemonic:'Truc 2'},es:{question:'¿Extra 2 ES?',answer:'Respuesta 2 ES',mnemonic:'Truco 2'}}
]};

test('buildCoreStudyCards converteix preguntes certificades a flashcards bilingües',()=>{
  const ca=buildCoreStudyCards(mockBanks,'ca');
  const es=buildCoreStudyCards(mockBanks,'es');
  assert.equal(ca.length,2);
  assert.equal(es.length,2);
  assert.deepEqual(ca[0],{
    id:'test-q1',sourceType:'test',blockId:'bloc-1',unitId:'unitat-1',
    question:'Pregunta CA?',answer:'Correcta CA',mnemonic:'Memòria CA'
  });
  assert.equal(es[0].question,'¿Pregunta ES?');
  assert.equal(es[0].answer,'Correcta ES');
  assert.equal(es[0].mnemonic,'Memoria ES');
});

test('buildExtraStudyCards localitza les targetes extra',()=>{
  assert.equal(buildExtraStudyCards(extras,'ca')[0].question,'Extra CA?');
  assert.equal(buildExtraStudyCards(extras,'es')[0].answer,'Respuesta extra ES');
});

test('selectCardsByBlocks permet barrejar diversos blocs en una sola baralla',()=>{
  const cards=[...buildCoreStudyCards(mockBanks,'ca'),...buildExtraStudyCards(extras,'ca')];
  const selected=selectCardsByBlocks(cards,new Set(['bloc-1','bloc-2']));
  assert.equal(selected.length,4);
  assert.deepEqual(new Set(selected.map(c=>c.blockId)),new Set(['bloc-1','bloc-2']));
});

test('buildStudyCatalog agrupa per unitat i bloc amb recompte total',()=>{
  const catalog=buildStudyCatalog(mockBanks,{ 'bloc-1':1,'bloc-2':1 },'es');
  assert.equal(catalog.total,4);
  assert.equal(catalog.units.length,1);
  assert.equal(catalog.units[0].count,4);
  assert.deepEqual(catalog.units[0].blocks.map(b=>b.count),[2,2]);
});

test('shuffleCards conserva exactament les mateixes targetes',()=>{
  const cards=[...buildCoreStudyCards(mockBanks,'ca'),...buildExtraStudyCards(extras,'ca')];
  const shuffled=shuffleCards(cards,()=>0.271828);
  assert.equal(shuffled.length,4);
  assert.deepEqual(new Set(shuffled.map(c=>c.id)),new Set(cards.map(c=>c.id)));
});

test('wrapIndex permet navegació circular',()=>{
  assert.equal(wrapIndex(0,638),0);
  assert.equal(wrapIndex(638,638),0);
  assert.equal(wrapIndex(-1,638),637);
});
