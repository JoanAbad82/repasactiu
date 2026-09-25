import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {validatePayrollExampleData,renderPracticalExamplesHtml,parsePayrollAmount,checkPayrollPracticeAnswer,createPayrollPracticeState} from "../../site/js/practical-examples.js";
import {validateCommercialCorrespondenceData} from "../../site/js/commercial-correspondence.js";

const payroll=JSON.parse(await readFile(new URL("../../site/data/payroll-example-2026-v1.json",import.meta.url),"utf8"));
const correspondence=JSON.parse(await readFile(new URL("../../site/data/commercial-correspondence-v1.json",import.meta.url),"utf8"));

test("el cas de nòmina conserva els imports del material i valida tots els càlculs",()=>{
  const data=validatePayrollExampleData(payroll);
  assert.equal(data.calculations.proratedExtraMonthly,250);
  assert.equal(data.calculations.monthlyEarnings,1750);
  assert.equal(data.calculations.workerContributionsTotal,113.76);
  assert.equal(data.calculations.irpfAmount,140);
  assert.equal(data.calculations.totalDeductions,253.76);
  assert.equal(data.calculations.netPay,1496.24);
});

test("els exemples pràctics integren correspondència i nòmines en una sola entrada",()=>{
  validateCommercialCorrespondenceData(correspondence);
  const ca=renderPracticalExamplesHtml({correspondenceBank:correspondence,payrollBank:payroll,language:"ca",category:"payroll"});
  const es=renderPracticalExamplesHtml({correspondenceBank:correspondence,payrollBank:payroll,language:"es",category:"payroll"});
  assert.match(ca,/Exemples pràctics/);
  assert.match(ca,/Correspondència i cartes comercials/);
  assert.match(ca,/Nòmines/);
  assert.match(ca,/1\.496,24/);
  assert.match(ca,/P-D-B-C-I-L/);
  assert.match(es,/Ejemplos prácticos/);
  assert.match(es,/Correspondencia y cartas comerciales/);
  assert.match(es,/Nóminas/);
  assert.match(es,/1\.496,24/);
  assert.match(es,/Material de clase CECOT/);
});

test("la categoria de correspondència manté la guia existent dins d'exemples pràctics",()=>{
  const html=renderPracticalExamplesHtml({correspondenceBank:correspondence,payrollBank:payroll,language:"ca",category:"correspondence"});
  assert.match(html,/Correspondència comercial/);
  assert.match(html,/Estructura d’una carta comercial/);
  assert.equal((html.match(/correspondence-structure-item/g)||[]).length,10);
});


test("el parser de la pràctica accepta formats monetaris habituals",()=>{
  assert.equal(parsePayrollAmount("1496,24"),1496.24);
  assert.equal(parsePayrollAmount("1496.24"),1496.24);
  assert.equal(parsePayrollAmount("1.496,24 €"),1496.24);
  assert.equal(parsePayrollAmount("1,496.24"),1496.24);
  assert.equal(parsePayrollAmount("1.496"),1496);
  assert.equal(checkPayrollPracticeAnswer("1.496,24 €",1496.24),true);
  assert.equal(checkPayrollPracticeAnswer("1490",1496.24),false);
});

test("la pràctica de nòmina oculta les fórmules inicialment i permet revelar ajuda progressiva",()=>{
  const initial=createPayrollPracticeState();
  const first=renderPracticalExamplesHtml({correspondenceBank:correspondence,payrollBank:payroll,language:"ca",category:"payroll",payrollView:"practice",practiceState:initial});
  assert.match(first,/Practica aquesta nòmina/);
  assert.match(first,/Pas 1 de 11/);
  assert.match(first,/Prorrata mensual de pagues extres/);
  assert.doesNotMatch(first,/1\.500,00 € × 2/);

  const hinted={...initial,attempts:{prorata:1},feedback:{type:"wrong"}};
  const oneError=renderPracticalExamplesHtml({correspondenceBank:correspondence,payrollBank:payroll,language:"ca",category:"payroll",payrollView:"practice",practiceState:hinted});
  assert.match(oneError,/Pista/);
  assert.doesNotMatch(oneError,/Solució del pas/);

  const revealed={...initial,attempts:{prorata:2},feedback:{type:"wrong"}};
  const twoErrors=renderPracticalExamplesHtml({correspondenceBank:correspondence,payrollBank:payroll,language:"ca",category:"payroll",payrollView:"practice",practiceState:revealed});
  assert.match(twoErrors,/Solució del pas/);
  assert.match(twoErrors,/250,00 €/);
  assert.match(twoErrors,/Usar el resultat i continuar/);
});

test("la pràctica completada mostra el recompte d'encerts i totes les respostes",()=>{
  const state={index:11,attempts:{},completed:["prorata","devengos","base","common","unemployment","training","mei","contribTotal","irpf","deductions","net"],firstTry:["devengos","base"],feedback:null};
  const html=renderPracticalExamplesHtml({correspondenceBank:correspondence,payrollBank:payroll,language:"es",category:"payroll",payrollView:"practice",practiceState:state});
  assert.match(html,/Nómina completada/);
  assert.match(html,/2\/11 aciertos al primer intento/);
  assert.match(html,/1\.496,24 €/);
  assert.match(html,/Ver el ejemplo resuelto/);
});
