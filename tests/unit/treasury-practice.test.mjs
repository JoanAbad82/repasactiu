import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {validateTreasuryPracticeData,createTreasuryPracticeState,renderTreasuryPracticeHtml} from "../../site/js/treasury-practice.js";

const bank=JSON.parse(await readFile(new URL("../../site/data/treasury-practice-v1.json",import.meta.url),"utf8"));

test("la pràctica de tresoreria conserva 10 incidències bilingües amb traçabilitat exacta",()=>{
  const data=validateTreasuryPracticeData(bank);
  assert.equal(data.steps.length,10);
  assert.deepEqual(data.steps.map(x=>x.page),[14,16,17,27,29,32,35,38,39,40]);
  assert.equal(new Set(data.steps.map(x=>x.id)).size,10);
  for(const step of data.steps){
    assert.equal(step.options.ca.length,4);
    assert.equal(step.options.es.length,4);
    assert.ok(step.explanation.ca);
    assert.ok(step.explanation.es);
  }
});

test("la primera incidència es presenta com un cas aplicat i no revela la solució",()=>{
  const html=renderTreasuryPracticeHtml(bank,"ca",createTreasuryPracticeState());
  assert.match(html,/Circuit pràctic de tresoreria/);
  assert.match(html,/Incidència 1 de 10/);
  assert.match(html,/1\.000 €/);
  assert.match(html,/p\. 14/);
  assert.doesNotMatch(html,/igual o superior a 1\.000 €/);
});

test("després de dos errors es mostra la pista i l’explicació de la font",()=>{
  const state=createTreasuryPracticeState();
  state.attempts["cash-limit"]=2;
  state.feedback={type:"wrong"};
  const html=renderTreasuryPracticeHtml(bank,"ca",state);
  assert.match(html,/Pista/);
  assert.match(html,/Explicació/);
  assert.match(html,/igual o superior a 1\.000 €/);
});

test("la pràctica completada resumeix el resultat i manté les pàgines font",()=>{
  const state=createTreasuryPracticeState();
  state.index=10;
  state.firstTry=["cash-limit","direct-debit","cash-on-delivery"];
  const html=renderTreasuryPracticeHtml(bank,"es",state);
  assert.match(html,/Circuito de tesorería completado/);
  assert.match(html,/3\/10 aciertos al primer intento/);
  assert.match(html,/p\. 40/);
  assert.match(html,/Recordatorio final/);
});
