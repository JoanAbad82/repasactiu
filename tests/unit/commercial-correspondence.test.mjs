import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {validateCommercialCorrespondenceData,renderCommercialCorrespondenceHtml} from "../../site/js/commercial-correspondence.js";

const bank=JSON.parse(await readFile(new URL("../../site/data/commercial-correspondence-v1.json",import.meta.url),"utf8"));

test("la guia publica 8 models, 10 parts de la carta i una selecció curta d'abreviatures",()=>{
  const validated=validateCommercialCorrespondenceData(bank);
  assert.equal(validated.structure.length,10);
  assert.equal(validated.models.length,8);
  assert.equal(validated.groups.flatMap(group=>group.models).length,8);
  assert.equal(validated.abbreviations.ca.count,26);
  assert.equal(validated.abbreviations.es.count,26);
});

test("la vista de guia catalana inclou estructura, criteris, errors i plantilla",()=>{
  const html=renderCommercialCorrespondenceHtml(bank,"ca","guide");
  assert.match(html,/Correspondència comercial/);
  assert.match(html,/Estructura d’una carta comercial/);
  assert.equal((html.match(/correspondence-structure-item/g)||[]).length,10);
  assert.match(html,/Errors freqüents/);
  assert.match(html,/Plantilla de treball/);
  assert.match(html,/Assumpte: \[motiu concret de la carta\]/);
});

test("la vista de models mostra els vuit exemples bilingües sense convertir-los en preguntes",()=>{
  const ca=renderCommercialCorrespondenceHtml(bank,"ca","models");
  const es=renderCommercialCorrespondenceHtml(bank,"es","models");
  assert.equal((ca.match(/data-commercial-model=/g)||[]).length,8);
  assert.match(ca,/Carta de presentació comercial/);
  assert.match(ca,/Reclamació per una incidència/);
  assert.match(ca,/Factura pendent de pagament/);
  assert.equal((es.match(/data-commercial-model=/g)||[]).length,8);
  assert.match(es,/Solicitud de información y presupuesto/);
  assert.match(es,/Reclamación por mercancía deteriorada/);
  assert.match(es,/Factura pendiente de pago/);
});

test("les abreviatures es mantenen dins el rang 20-30 i mostren la font adequada",()=>{
  const ca=renderCommercialCorrespondenceHtml(bank,"ca","abbreviations");
  const es=renderCommercialCorrespondenceHtml(bank,"es","abbreviations");
  assert.equal((ca.match(/class="abbreviation-entry"/g)||[]).length,26);
  assert.equal((es.match(/class="abbreviation-entry"/g)||[]).length,26);
  assert.match(ca,/Generalitat de Catalunya/);
  assert.match(ca,/p\. \/ pàg\./);
  assert.match(es,/Real Academia Española/);
  assert.match(es,/https:\/\/www\.rae\.es\/buen-uso-espa/);
  assert.match(es,/A\/A/);
});
