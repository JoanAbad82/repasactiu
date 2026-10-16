import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateEmotionsGroupData,createEmotionsGroupState,emotionsGroupProgress,renderEmotionsGroupHtml} from '../../site/js/emotions-group-practice.js';
const data=JSON.parse(await readFile(new URL('../../site/data/uf0520-emotions-group-practice-v1.json',import.meta.url),'utf8'));
test('original classroom group dynamic, full scenario, five questions plus reflection and source hashes are retained',()=>{
 validateEmotionsGroupData(data);
 assert.equal(data.graded,false);assert.equal(data.stages.length,3);assert.equal(data.scenario.length,4);
 assert.equal(data.prompts.length,6);assert.deepEqual(data.prompts.map(q=>q.id),['1','2','3','4','5','reflection']);
 assert.equal(data.source.original.sha256,'b777b6e7618517ee817f5f5ae671f67676a2f04b826bdda0502110de2cbdd71c');
 assert.equal(data.source.resolved.sha256,'ba98eadd6ed5f4b298b552324737d5d2b46b422e6518a23d1a55510db8ebc212');
 assert.match(data.scenario[0].ca,/12\.30 h/);assert.match(data.scenario[1].ca,/Marta/);assert.match(data.scenario[2].ca,/Àlex/);assert.match(data.scenario[3].ca,/Sònia/);
 assert.match(data.prompts[4].solution.ca,/avisar el client del retard/);
 assert.match(data.prompts[5].solution.ca,/en públic/);
});
test('all prompts are open responses without numerical grading and the model is hidden before completion',()=>{
 const state=createEmotionsGroupState();
 assert.deepEqual(emotionsGroupProgress(data,state),{filled:0,total:6,complete:false});
 for(const lang of ['ca','es']){
  const html=renderEmotionsGroupHtml(data,lang,state);
  assert.equal((html.match(/data-emotion-item=/g)||[]).length,6);
  assert.equal((html.match(/data-emotion-answer=/g)||[]).length,6);
  assert.doesNotMatch(html,/data-emotion-solution=/);
  assert.match(html,lang==='ca'?/no té nota/:/no tiene nota/);
 }
 for(const q of data.prompts)state.answers[q.id]='Proposta reflexionada amb accions concretes.';
 assert.equal(emotionsGroupProgress(data,state).complete,true);
 state.revealed=true;
 assert.equal((renderEmotionsGroupHtml(data,'ca',state).match(/data-emotion-solution=/g)||[]).length,6);
 assert.match(renderEmotionsGroupHtml(data,'es',state),/no se corrigen automáticamente/);
});
