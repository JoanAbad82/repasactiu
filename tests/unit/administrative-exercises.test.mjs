import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {
  validateAdministrativeExercisesData,
  renderAdministrativeExercisesHtml,
  createAdministrativeExerciseState,
  evaluateAdministrativeSheet,
  orderFieldSpecs,
  gradeAdminField,
  parseFlexibleNumber,
  normalizeAdminText,
  addDays,
  formatIsoDate,
  calculateAdminPair
} from "../../site/js/administrative-exercises.js";
import {
  renderPracticalExamplesHtml,
  validatePayrollExampleData
} from "../../site/js/practical-examples.js";
import {validateCommercialCorrespondenceData} from "../../site/js/commercial-correspondence.js";

const bank=JSON.parse(await readFile(new URL("../../site/data/administrative-exercises-v1.json",import.meta.url),"utf8"));
const payroll=JSON.parse(await readFile(new URL("../../site/data/payroll-example-2026-v1.json",import.meta.url),"utf8"));
const correspondence=JSON.parse(await readFile(new URL("../../site/data/commercial-correspondence-v1.json",import.meta.url),"utf8"));
const traceability=JSON.parse(await readFile(new URL("../../docs/content/ADMIN_DOCUMENTS_EXERCISES_SOURCE_TRACEABILITY_2026-09-28.json",import.meta.url),"utf8"));

test("el material declara 9 fulls incrustats i no inventa cap full 10",()=>{
  validateAdministrativeExercisesData(bank);
  assert.equal(bank.source.filename,"Exercicis_1-10_unificats.docx");
  assert.equal(bank.source.embeddedSheets,9);
  assert.equal(bank.source.filenameSuggestsSheets,10);
  assert.equal(bank.source.received,"2026-09-28");
  assert.equal(bank.sheets.length,9);
  assert.equal(bank.sheets.filter(sheet=>sheet.kind==="questions").length,5);
  assert.equal(bank.sheets.filter(sheet=>sheet.kind==="order").length,4);
  assert.equal(traceability.embeddedSheets,9);
  assert.equal(traceability.filenameSuggestsSheets,10);
  assert.equal(traceability.tenthSheetAdded,false);
  assert.equal(traceability.received,"2026-09-28");
});

test("els cinc primers fulls són bilingües i els quatre darrers només catalans amb traducció del lloc",()=>{
  for(const sheet of bank.sheets.slice(0,5))assert.equal(sheet.sourceLanguage,"ca+es");
  for(const sheet of bank.sheets.slice(5))assert.equal(sheet.sourceLanguage,"ca");
  assert.equal(bank.source.languageBySheet["sheet-6"],"ca");
  assert.match(traceability.siteTranslationNote.es,/traducciones del sitio/);
});

test("els identificadors i codis postals es conserven literalment encara que semblin inusuals",()=>{
  assert.equal(bank.source.identifiersPreservedLiterally,true);
  const serialized=JSON.stringify(bank);
  for(const literal of ["B08999999","A08444445","082936","200820","200750","45826","123/08","140/08","12589","15289"]){
    assert.ok(serialized.includes(literal),`${literal} ha de constar literalment`);
  }
  assert.ok(traceability.literalIdentifiers.includes("082936"));
  assert.ok(traceability.literalIdentifiers.includes("200820"));
});

test("el full 2 manté el mapatge de categories indicat pel material",()=>{
  const expected={pedido:"purchase_sale",nomina:"hr",factura:"purchase_sale",instancia:"procedures",cheque:"payments",acta:"decisions",albaran:"purchase_sale"};
  for(const document of bank.resources.documents)assert.equal(document.category,expected[document.id],document.id);
  const sheet=bank.sheets.find(item=>item.id==="sheet-2");
  for(const [documentId,category] of Object.entries(expected)){
    const field=sheet.fields.find(item=>item.id===`s2-${documentId}`);
    assert.equal(field.expected,category,documentId);
  }
});

test("els imports derivats de les comandes 6-9 quadren amb el material",()=>{
  const expected={
    "sheet-6":{subtotal:34150,discountAmount:1024.5,totalBeforeTax:33125.5,latest:"2025-11-15"},
    "sheet-7":{subtotal:379000,discountAmount:15160,totalBeforeTax:363840,latest:"2026-06-15"},
    "sheet-8":{subtotal:2970000,discountAmount:148500,totalBeforeTax:2821600,latest:"2026-01-18"},
    "sheet-9":{subtotal:47500,discountAmount:0,totalBeforeTax:47950,latest:"2017-03-07"}
  };
  for(const [sheetId,values] of Object.entries(expected)){
    const order=bank.sheets.find(sheet=>sheet.id===sheetId).order;
    assert.equal(order.derived.subtotal,values.subtotal,sheetId);
    assert.equal(order.derived.discountAmount,values.discountAmount,sheetId);
    assert.equal(order.derived.totalBeforeTax,values.totalBeforeTax,sheetId);
    assert.equal(order.latestDelivery,values.latest,sheetId);
  }
  assert.equal(bank.sheets.find(sheet=>sheet.id==="sheet-8").order.transport.cost,100);
  assert.equal(bank.sheets.find(sheet=>sheet.id==="sheet-9").order.transport.cost,450);
});

test("les respostes accepten formats i puntuació flexibles",()=>{
  assert.equal(parseFlexibleNumber("33.125,50 €"),33125.5);
  assert.equal(parseFlexibleNumber("1,024.50"),1024.5);
  assert.equal(parseFlexibleNumber("290"),290);
  assert.equal(normalizeAdminText("  Muebles García, S.L. "),normalizeAdminText("muebles garcia sl"));
  assert.equal(formatIsoDate("2025-11-15","ca"),"15/11/2025");
  assert.equal(addDays("2025-11-05",10),"2025-11-15");
  assert.equal(addDays("2026-06-10",5),"2026-06-15");
  assert.equal(addDays("",10),"");
  assert.equal(calculateAdminPair(290,"×",120),34800);
});

test("la correcció valora text, NIF, imports, dates i seleccions",()=>{
  const specs=orderFieldSpecs(bank.sheets.find(sheet=>sheet.id==="sheet-6").order);
  const byKey=Object.fromEntries(specs.map(spec=>[spec.key,spec]));
  assert.equal(gradeAdminField(byKey.buyerName,"software reus sl","ca").correct,true);
  assert.equal(gradeAdminField(byKey.buyerNif,"b-08999999","ca").correct,true);
  assert.equal(gradeAdminField(byKey.buyerAddress,"calle Arenys 56 de Barcelona 08000","es").correct,true);
  assert.equal(gradeAdminField(byKey.item1Line,"2.900,00","ca").correct,true);
  assert.equal(gradeAdminField(byKey.item1Line,"2900,5","ca").correct,false);
  assert.equal(gradeAdminField(byKey.latestDelivery,"15/11/2025","ca").correct,true);
  assert.equal(gradeAdminField(byKey.paymentMethod,"transfer","es").correct,true);
  assert.equal(gradeAdminField(byKey.paymentMethod,"cash","es").correct,false);
});

test("les comandes es poden resoldre completament i les respostes errònies es detecten",()=>{
  const sheet=bank.sheets.find(item=>item.id==="sheet-6");
  const specs=orderFieldSpecs(sheet.order);
  const answers={"sheet-6":{}};
  for(const spec of specs){
    answers["sheet-6"][spec.key]=spec.kind==="number"?String(spec.expected).replace(".",","):spec.kind==="select"?spec.expected:spec.kind==="date"?spec.expected:spec.accept?.[0]??"";
  }
  assert.equal(evaluateAdministrativeSheet(bank,"sheet-6",answers,"ca").allCorrect,true);
  answers["sheet-6"].subtotal="999";
  const failed=evaluateAdministrativeSheet(bank,"sheet-6",answers,"ca");
  assert.equal(failed.allCorrect,false);
  assert.equal(failed.results.subtotal.correct,false);
});

test("el full 3 corregeix només l'ordre i deixa l'explicació lliure amb punts model",()=>{
  const sheet=bank.sheets.find(item=>item.id==="sheet-3");
  const answers={"sheet-3":{"s3-rank-pedido":"1","s3-rank-albaran":"2","s3-rank-factura":"3","s3-explanation":"text lliure"}};
  const ok=evaluateAdministrativeSheet(bank,"sheet-3",answers,"ca");
  assert.equal(ok.allCorrect,true);
  assert.equal("s3-explanation" in ok.results,false);
  const wrong=evaluateAdministrativeSheet(bank,"sheet-3",{"sheet-3":{"s3-rank-pedido":"2","s3-rank-albaran":"1","s3-rank-factura":"3"}},"ca");
  assert.equal(wrong.allCorrect,false);
  assert.equal(wrong.results["s3-rank-pedido"].correct,false);
});

test("les instruccions especials es corregeixen per paraules clau",()=>{
  const sheet=bank.sheets.find(item=>item.id==="sheet-9");
  const spec=orderFieldSpecs(sheet.order).find(item=>item.key==="specialInstructions");
  assert.equal(gradeAdminField(spec,"Palets verds per a Xocolata i vermells per a Vainilla","ca").correct,true);
  assert.equal(gradeAdminField(spec,"Etiquetes de colors","ca").correct,false);
});

test("cada full es renderitza amb la seva guia i el seu enunciat",()=>{
  const resources=bank.sheets.find(sheet=>sheet.id==="sheet-1");
  const state=createAdministrativeExerciseState();
  const html=renderAdministrativeExercisesHtml(bank,"ca",state);
  assert.match(html,/Full 1 de 9/);
  assert.match(html,/Cicle comercial de la compravenda/);
  assert.match(html,/data-admin-check/);
  assert.equal((html.match(/data-admin-sheet=/g)||[]).length,9);

  const orderState={...createAdministrativeExerciseState(),sheetId:"sheet-6"};
  const order=renderAdministrativeExercisesHtml(bank,"ca",orderState);
  assert.match(order,/Camps que ha de tenir una comanda/);
  assert.match(order,/Total abans d’impostos = subtotal − descompte/);
  assert.match(order,/No hi afegeixis IVA/);
  assert.match(order,/data-admin-calc-use/);
  assert.match(order,/data-admin-date-copy/);
  assert.match(order,/123\/08/);

  const spanish=renderAdministrativeExercisesHtml(bank,"es",orderState);
  assert.match(spanish,/traducción del sitio web/);
  const catalanFirstSheet=renderAdministrativeExercisesHtml(bank,"ca",createAdministrativeExerciseState());
  assert.doesNotMatch(catalanFirstSheet,/traducció del lloc web/);
});

test("els exemples pràctics integren la nova categoria al costat de correspondència i nòmines",()=>{
  validateCommercialCorrespondenceData(correspondence);
  validatePayrollExampleData(payroll);
  const html=renderPracticalExamplesHtml({correspondenceBank:correspondence,payrollBank:payroll,administrativeBank:bank,language:"ca",category:"administrative"});
  assert.match(html,/Documents administratius i comercials/);
  assert.match(html,/data-practical-category="administrative"/);
  assert.match(html,/data-practical-category="correspondence"/);
  assert.match(html,/data-practical-category="payroll"/);
  assert.match(html,/data-admin-exercises/);

  const spanish=renderPracticalExamplesHtml({correspondenceBank:correspondence,payrollBank:payroll,administrativeBank:bank,language:"es",category:"administrative"});
  assert.match(spanish,/Documentos administrativos y comerciales/);

  const withoutBank=renderPracticalExamplesHtml({correspondenceBank:correspondence,payrollBank:payroll,language:"ca",category:"correspondence"});
  assert.doesNotMatch(withoutBank,/data-practical-category="administrative"/);
});
