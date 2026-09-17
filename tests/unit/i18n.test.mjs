import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {existsSync} from "node:fs";
import path from "node:path";

const dataDir=path.resolve("site/data");
const readJson=async file=>JSON.parse(await readFile(path.join(dataDir,file),"utf8"));
const bankFiles=block=>[block.file,block.extraFile,...(block.additionalFiles||[])].filter(Boolean);
const translationFiles=block=>[block.translationFile,...(block.additionalTranslationFiles||[])].filter(Boolean);

test("el catàleg declara metadades castellanes i traduccions per a tots els blocs",async()=>{
  const course=await readJson("course.json");
  assert.equal(course.titleEs,"Operaciones auxiliares de servicios administrativos y generales");
  assert.equal(course.blocks.length,7);
  assert.deepEqual([...new Set(course.blocks.map(b=>b.unitId))],["unitat-1","unitat-2","uf0518"]);
  for(const block of course.blocks){
    assert.ok(block.translationFile?.startsWith("data/i18n/es/"),`${block.id}: translationFile obligatori`);
    assert.ok(block.titleEs?.trim(),`${block.id}: titleEs obligatori`);
    assert.ok(block.unitTitleEs?.trim(),`${block.id}: unitTitleEs obligatori`);
  }
});

test("les traduccions castellanes cobreixen exactament les 526 preguntes sense duplicar la lògica",async()=>{
  const course=await readJson("course.json");
  let total=0;
  for(const block of course.blocks){
    const originals=[];
    for(const file of bankFiles(block)){
      const bank=await readJson(file.replace(/^data\//,""));
      originals.push(...bank.questions);
    }
    const translated={};
    for(const file of translationFiles(block)){
      const rel=file.replace(/^data\//,"");
      const full=path.join(dataDir,rel);
      assert.ok(existsSync(full),`${rel} ha d'existir`);
      const translation=JSON.parse(await readFile(full,"utf8"));
      assert.equal(translation.blockId,block.id,`${rel}: blockId incorrecte`);
      assert.ok(translation.questions&&!Array.isArray(translation.questions),`${rel}: questions ha de ser un mapa per id`);
      for(const [id,tr] of Object.entries(translation.questions)){
        assert.equal(Object.hasOwn(translated,id),false,`${id}: traducció duplicada entre suplements`);
        translated[id]=tr;
      }
    }
    assert.deepEqual(Object.keys(translated).sort(),originals.map(q=>q.id).sort(),`${block.id}: cobertura castellana exacta`);
    for(const q of originals){
      const tr=translated[q.id];
      assert.ok(tr.topic?.trim(),`${q.id}: topic castellà obligatori`);
      assert.ok(tr.question?.trim(),`${q.id}: enunciat castellà obligatori`);
      assert.ok(tr.explanation?.trim(),`${q.id}: explicació castellana obligatòria`);
      assert.equal(tr.options?.length,4,`${q.id}: quatre opcions castellanes`);
      assert.equal(new Set(tr.options.map(v=>v.trim())).size,4,`${q.id}: opcions castellanes diferents`);
      assert.equal("correct" in tr,false,`${q.id}: la traducció no pot duplicar correct`);
      total++;
    }
  }
  assert.equal(total,526);
});
