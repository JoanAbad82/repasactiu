import test from "node:test";
import assert from "node:assert/strict";
import { loadBlockBundle } from "../../site/js/catalog.js";

const original={
  blockId:"bloc-1",
  blockTitle:"Entitats públiques i privades",
  questions:[{id:"q1",topic:"Tema",question:"Pregunta?",options:["A","B","C","D"],correct:2,explanation:"Explicació"}]
};
const extra={blockId:"bloc-1",blockTitle:"Entitats públiques i privades",questions:[{id:"q2",topic:"Tema 2",question:"Pregunta 2?",options:["A2","B2","C2","D2"],correct:1,explanation:"Explicació 2"}]};
const es={blockId:"bloc-1",blockTitle:"Entidades públicas y privadas",questions:{q1:{topic:"Tema",question:"¿Pregunta?",options:["A es","B es","C es","D es"],explanation:"Explicación"},q2:{topic:"Tema 2",question:"¿Pregunta 2?",options:["A2 es","B2 es","C2 es","D2 es"],explanation:"Explicación 2"}}};
const fetchOk=async url=>({ok:true,json:async()=>url.includes("extra")?extra:url.includes("i18n")?es:original});

test("loadBlockBundle adjunta la traducció sense duplicar la resposta correcta",async()=>{
  const bank=await loadBlockBundle("data/bloc_1.json","data/bloc_1_extra.json","data/i18n/es/bloc-1.json",fetchOk);
  assert.equal(bank.blockTitleEs,"Entidades públicas y privadas");
  assert.equal(bank.questions[0].correct,2);
  assert.equal(bank.questions[0].translations.es.question,"¿Pregunta?");
  assert.deepEqual(bank.questions[1].translations.es.options,["A2 es","B2 es","C2 es","D2 es"]);
  assert.equal("correct" in bank.questions[0].translations.es,false);
});

test("loadBlockBundle rebutja traduccions amb ids absents o sobrants",async()=>{
  const bad={...es,questions:{q1:es.questions.q1}};
  const badFetch=async url=>({ok:true,json:async()=>url.includes("extra")?extra:url.includes("i18n")?bad:original});
  await assert.rejects(()=>loadBlockBundle("data/bloc_1.json","data/bloc_1_extra.json","data/i18n/es/bloc-1.json",badFetch),/traducció.*preguntes/i);
});
