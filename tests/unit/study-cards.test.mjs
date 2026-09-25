import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCoreStudyCards,
  buildExtraStudyCards,
  buildOrderedStudyCards,
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
  assert.equal(ca[0].id,'test-q1');
  assert.equal(ca[0].sourceId,'q1');
  assert.equal(ca[0].sourceType,'test');
  assert.equal(ca[0].blockId,'bloc-1');
  assert.equal(ca[0].unitId,'unitat-1');
  assert.equal(ca[0].question,'Pregunta CA?');
  assert.equal(ca[0].answer,'Correcta CA');
  assert.equal(ca[0].mnemonic,'Memòria CA');
  assert.ok(ca[0].conceptId.startsWith('BLOC-1.'));
  assert.deepEqual(ca[0].sourceRef,{id:'B1',pageRange:[1,19],precision:'block'});
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
  assert.equal(wrapIndex(0,798),0);
  assert.equal(wrapIndex(798,798),0);
  assert.equal(wrapIndex(-1,798),797);
});


test('buildCoreStudyCards aplica overrides editorials sense alterar el banc de test',()=>{
  const overrides={
    q1:{
      ca:{question:'Pregunta CA autònoma?',answer:'Resposta CA polida'},
      es:{question:'¿Pregunta ES autónoma?',answer:'Respuesta ES pulida'}
    }
  };
  const ca=buildCoreStudyCards(mockBanks,'ca',overrides);
  const es=buildCoreStudyCards(mockBanks,'es',overrides);
  assert.equal(ca[0].question,'Pregunta CA autònoma?');
  assert.equal(ca[0].answer,'Resposta CA polida');
  assert.equal(es[0].question,'¿Pregunta ES autónoma?');
  assert.equal(es[0].answer,'Respuesta ES pulida');
  assert.equal(mockBanks[0].questions[0].question,'Pregunta CA?');
});


test('manifest semàntic V2 aplica REWRITE i MERGE/REPLACE només a les flashcards',()=>{
  const manifest={changes:[
    {
      id:'q1',status:'REWRITE',source:'B1 p.6',
      ca:{question:'Pregunta CA revisada?',answer:'Resposta CA revisada',mnemonic:'Mnemotècnia CA revisada'},
      es:{question:'¿Pregunta ES revisada?',answer:'Respuesta ES revisada',mnemonic:'Mnemotecnia ES revisada'}
    },
    {
      id:'e1',status:'MERGE/REPLACE',
      replacement:{
        concept_id:'B1.TEST.NOU',source:'B1 p.7',
        ca:{question:'Extra CA nova?',answer:'Resposta extra nova',mnemonic:'Truc extra nou'},
        es:{question:'¿Extra ES nueva?',answer:'Respuesta extra nueva',mnemonic:'Truco extra nuevo'}
      }
    }
  ]};
  const ca=buildCoreStudyCards(mockBanks,'ca',{},manifest);
  const es=buildCoreStudyCards(mockBanks,'es',{},manifest);
  assert.equal(ca[0].question,'Pregunta CA revisada?');
  assert.equal(ca[0].answer,'Resposta CA revisada');
  assert.equal(ca[0].mnemonic,'Mnemotècnia CA revisada');
  assert.deepEqual(ca[0].sourceRef,{id:'B1',pageRange:[6,6],precision:'page'});
  assert.equal(es[0].question,'¿Pregunta ES revisada?');
  assert.equal(mockBanks[0].questions[0].question,'Pregunta CA?');

  const extraBank={...extras,semanticV2:manifest};
  const extra=buildExtraStudyCards(extraBank,'ca').find(card=>card.id==='e1');
  assert.equal(extra.question,'Extra CA nova?');
  assert.equal(extra.answer,'Resposta extra nova');
  assert.equal(extra.conceptId,'B1.TEST.NOU');
  assert.deepEqual(extra.sourceRef,{id:'B1',pageRange:[7,7],precision:'page'});
});


test('buildOrderedStudyCards ordena targetes per font, pàgina i concepte',()=>{
  const traceability={
    blockSources:{'bloc-1':'B1','bloc-2':'B2'},
    topicRanges:{'bloc-1':{undefined:[8,8]},'bloc-2':{undefined:[2,2]}},
    questionRanges:{q1:{source:'B1',pageRange:[8,8]},q2:{source:'B2',pageRange:[2,2]}}
  };
  const extraBank={
    ...extras,
    semanticV2:{changes:[]},
    traceabilityV2:traceability,
    cards:[
      {...extras.cards[0],source:{id:'B1',pages:[4,4]}},
      {...extras.cards[1],source:{id:'B2',pages:[1,1]}}
    ]
  };
  const ordered=buildOrderedStudyCards(mockBanks,extraBank,'ca');
  assert.deepEqual(ordered.map(card=>card.id),['e1','test-q1','e2','test-q2']);
});
