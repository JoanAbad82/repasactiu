import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const dataDir=path.resolve("site/data");
const readJson=async file=>JSON.parse(await readFile(path.join(dataDir,file),"utf8"));

const expectedTranslationFiles={
  "bloc-1":"i18n/es/bloc-1.json",
  "bloc-2":"i18n/es/bloc-2.json",
  "bloc-3":"i18n/es/bloc-3.json",
  "bloc-4":"i18n/es/bloc-4.json",
  "bloc-5":"i18n/es/bloc-5.json",
  "unitat-2-bloc-1":"i18n/es/unitat-2-bloc-1.json"
};

test("el catàleg declara metadades castellanes i sis fitxers de traducció",async()=>{
  const course=await readJson("course.json");
  assert.equal(course.titleEs,"Operaciones auxiliares de servicios administrativos y generales");
  assert.equal(course.blocks.length,6);
  for(const block of course.blocks){
    assert.equal(block.translationFile,`data/${expectedTranslationFiles[block.id]}`);
    assert.ok(block.titleEs?.trim(),`${block.id}: titleEs obligatori`);
    assert.ok(block.unitTitleEs?.trim(),`${block.id}: unitTitleEs obligatori`);
  }
});

test("les traduccions castellanes cobreixen exactament les 320 preguntes sense duplicar la lògica",async()=>{
  const course=await readJson("course.json");
  let total=0;
  for(const block of course.blocks){
    const rel=expectedTranslationFiles[block.id];
    assert.ok(rel,`${block.id}: fitxer de traducció esperat`);
    const full=path.join(dataDir,rel);
    assert.ok(existsSync(full),`${rel} ha d'existir`);
    const translation=JSON.parse(await readFile(full,"utf8"));
    assert.equal(translation.blockId,block.id,`${rel}: blockId incorrecte`);
    assert.equal(translation.blockTitle,block.titleEs,`${rel}: títol de bloc desalineat`);
    assert.ok(translation.questions && !Array.isArray(translation.questions),`${rel}: questions ha de ser un mapa per id`);

    const originals=[];
    for(const key of ["file","extraFile"]){
      if(!block[key])continue;
      const bank=await readJson(path.basename(block[key]));
      originals.push(...bank.questions);
    }
    const originalIds=originals.map(q=>q.id).sort();
    const translatedIds=Object.keys(translation.questions).sort();
    assert.deepEqual(translatedIds,originalIds,`${rel}: ids traduïts han de coincidir exactament amb el banc català`);

    for(const q of originals){
      const tr=translation.questions[q.id];
      assert.ok(tr.topic?.trim(),`${q.id}: topic en castellà obligatori`);
      assert.ok(tr.question?.trim(),`${q.id}: enunciat en castellà obligatori`);
      assert.ok(tr.explanation?.trim(),`${q.id}: explicació en castellà obligatòria`);
      assert.equal(tr.options?.length,4,`${q.id}: quatre opcions en castellà`);
      assert.equal(new Set(tr.options.map(v=>v.trim())).size,4,`${q.id}: opcions castellanes diferents`);
      assert.equal("correct" in tr,false,`${q.id}: la traducció no pot duplicar l'índex correcte`);
      total++;
    }
  }
  assert.equal(total,320);
});
