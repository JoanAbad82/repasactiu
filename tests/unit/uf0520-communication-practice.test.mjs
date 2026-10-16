import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateCommunicationPracticeData,createCommunicationPracticeState,checkCommunicationPractice,renderCommunicationPracticeHtml} from '../../site/js/communication-practice.js';
const file=new URL('../../site/data/uf0520-comunicacio-vs-informacio-practice-v1.json',import.meta.url);
const data=JSON.parse(await readFile(file,'utf8'));
test('the two original documents are provenance-linked and all five exact classifications match the supplied solved exercise',()=>{
 validateCommunicationPracticeData(data);
 assert.deepEqual(data.cases.map(x=>x.answer),['informacio','comunicacio','informacio','comunicacio','informacio']);
 assert.equal(data.source.original.sha256,'e77aa9eb80254ad96e691bdc159afcee96bdb7f2d5f72ae70f5c84011c24d537');
 assert.equal(data.source.resolved.sha256,'464a12f4a36294f6ccf0907acfd9a23be2f48c5d9c621d85ab3bdd3534c25d9d');
 assert.match(data.cases[0].scenario.ca,/horari de vacances/);
 assert.match(data.cases[1].scenario.ca,/venedor li respon/);
 assert.match(data.cases[2].scenario.ca,/Tancat per vacances/);
 assert.match(data.cases[3].scenario.ca,/canvi d’organització interna/);
 assert.match(data.cases[4].scenario.ca,/La seva trucada serà atesa en breu/);
 for(const c of data.cases)for(const l of ['ca','es'])assert.ok(c.explanation[l].length>40);
 assert.match(data.classificationNote.ca,/sentit ampli/);
});
test('no teacher solution is revealed before the learner supplies a classification and written justification',()=>{
 const state=createCommunicationPracticeState();
 assert.deepEqual(checkCommunicationPractice(data,state),{complete:false,correct:null,total:5});
 let html=renderCommunicationPracticeHtml(data,'ca',state);
 assert.equal((html.match(/data-comm-case=/g)||[]).length,5);
 assert.doesNotMatch(html,/data-comm-feedback=/);
 state.answers['01']='informacio';
 html=renderCommunicationPracticeHtml(data,'es',state);
 assert.doesNotMatch(html,/data-comm-score/);
 for(const c of data.cases){state.answers[c.id]=c.answer;state.reasons[c.id]='Una raó pròpia que justifica la resposta.';}
 assert.deepEqual(checkCommunicationPractice(data,state),{complete:true,correct:5,total:5});
 state.checked=true;
 html=renderCommunicationPracticeHtml(data,'ca',state);
 assert.equal((html.match(/data-comm-feedback=/g)||[]).length,5);
 assert.match(html,/5 de 5/);
 state.answers['03']='comunicacio';
 assert.equal(checkCommunicationPractice(data,state).correct,4);
 assert.match(renderCommunicationPracticeHtml(data,'es',state),/4 de 5/);
});
test('both languages have working fieldsets and source explanations, and free text is clearly marked as self assessment',()=>{
 for(const language of ['ca','es']){
  const html=renderCommunicationPracticeHtml(data,language,{answers:{},reasons:{},checked:false,incomplete:true});
  assert.equal((html.match(/<fieldset/g)||[]).length,5);
  assert.equal((html.match(/<textarea/g)||[]).length,5);
  assert.equal((html.match(/data-comm-choice=/g)||[]).length,10);
  assert.match(html,/data-comm-incomplete/);
 }
 const state=createCommunicationPracticeState();
 for(const c of data.cases){state.answers[c.id]=c.answer;state.reasons[c.id]='He llegit i justificat la situació.';}
 state.checked=true;
 const html=renderCommunicationPracticeHtml(data,'es',state);
 assert.match(html,/no se corrige automáticamente/);
});
