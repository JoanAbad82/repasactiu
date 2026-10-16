import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateCommunicationActivitiesData,createCommunicationActivitiesState,activityProgress,renderCommunicationActivitiesHtml} from '../../site/js/communication-activities.js';
const bank=JSON.parse(await readFile(new URL('../../site/data/uf0520-activities-111-practice-v1.json',import.meta.url),'utf8'));
test('source-locked UF0520 classroom workbook has all 27 numbered items in four source pages, bilingual',()=>{
 validateCommunicationActivitiesData(bank);
 assert.equal(bank.source.original.sha256,'f00b729ee09447409951c0f23ae162739fd6da11eb1e8f4d4283d9853dd373d7');
 assert.equal(bank.source.resolved.sha256,'17b43b7225c009a370c6dec5f672578fbd381295bfdc210eb5655993fb9afcd2');
 assert.deepEqual(bank.sections.map(x=>x.items.length),[4,7,8,8]);
 assert.deepEqual(bank.sections.flatMap(x=>x.items.map(a=>a.id)).filter(x=>x==='3.8'||x==='4.8'),['3.8','4.8']);
 assert.equal(bank.sections[0].context.es.includes('Elena'),true);
 assert.equal(bank.sections[2].context.es.includes('Óscar'),true);
 assert.equal(bank.sections[2].items[2].solution.es,'Lengua castellana, en un mensaje escrito.');
 assert.equal(bank.sections[3].items[6].solution.es.startsWith('Sí.'),true);
 assert.equal(bank.sections[3].items[7].solution.es.startsWith('No.'),true);
 for(const sec of bank.sections)for(const item of sec.items)for(const l of ['ca','es'])assert.ok(item.solution[l].length>3&&item.prompt[l].length>10);
});
test('solutions for written questions are withheld until a section is complete; no automatic grading is invented',()=>{
 const state=createCommunicationActivitiesState();
 let html=renderCommunicationActivitiesHtml(bank,'ca',state);
 assert.equal((html.match(/data-activity-item=/g)||[]).length,4);
 assert.doesNotMatch(html,/data-activity-solution=/);
 assert.deepEqual(activityProgress(bank.sections[0],state),{filled:0,total:4,complete:false});
 for(const item of bank.sections[0].items)state.answers[item.id]='Resposta pròpia de l’alumne';
 assert.equal(activityProgress(bank.sections[0],state).complete,true);
 state.revealed['1']=true;
 html=renderCommunicationActivitiesHtml(bank,'ca',state);
 assert.equal((html.match(/data-activity-solution=/g)||[]).length,4);
 assert.match(html,/no reben puntuació automàtica/);
 state.section='4';
 html=renderCommunicationActivitiesHtml(bank,'es',state);
 assert.equal((html.match(/data-activity-item=/g)||[]).length,8);
 assert.doesNotMatch(html,/data-activity-solution=/);
});
test('all four sections retain context, bilingual questions and optional context appropriately',()=>{
 const state=createCommunicationActivitiesState();
 for(const sec of bank.sections){
  state.section=sec.id;
  for(const lang of ['ca','es']){
   const html=renderCommunicationActivitiesHtml(bank,lang,state);
   assert.ok(html.includes(sec.title[lang].replaceAll("'",'&#39;')),sec.id+lang);
   assert.equal((html.match(/data-activity-answer=/g)||[]).length,sec.items.length);
   if(sec.context)assert.match(html,/comm-activities-context/);
   assert.match(html,/data-activity-form/);
  }
 }
});
