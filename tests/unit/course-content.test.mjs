import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

const dataDir=path.resolve("site/data");
const readJson=async name=>JSON.parse(await readFile(path.join(dataDir,name),"utf8"));

const preservedBankBlobShas={
  "bloc_1.json":"b8dc6e3b640ce1de7081fd996f758ebf19286363",
  "bloc_1_extra.json":"28129903eab0064329a735521050f0c80ffb37c9",
  "bloc_2.json":"f2b5c80d5219c4cd26e585c197aadb3e4f8dd182",
  "bloc_2_extra.json":"c7ab4a26de4689d84981be03a68ec188332d39e1",
  "bloc_3.json":"9e3df1c06603faad130ee566caf58a018c2b9bde",
  "bloc_3_extra.json":"0b9d2a4bad587af2100c5f6f518b54dfe420e770",
  "bloc_4.json":"897f993e69115de35ab549e60e070ada61c12891",
  "bloc_4_extra.json":"972dd866e4e2fce731c08a2bc04fb71fe85b3754",
  "bloc_5.json":"144a26b8d513f0ec1c5494e20af0068063ebde4a",
  "bloc_5_extra.json":"281df4a24381a77ac7495523804beb76e2b9783b",
  "unitat_2_bloc_1.json":"beccc885747411bc10bc2b41ed63e6f17f8a68f6",
  "unitat_2_bloc_1_extra.json":"e2dd987115e7643b3b00c89d963626ff9bcea59c"
};

const expansionCounts={"bloc-1":8,"bloc-2":14,"bloc-3":14,"bloc-4":20,"bloc-5":14,"unitat-2-bloc-1":60};
const finalCounts={"bloc-1":50,"bloc-2":70,"bloc-3":70,"bloc-4":60,"bloc-5":60,"unitat-2-bloc-1":140};

function gitBlobSha(text){
  const bytes=Buffer.from(text,"utf8");
  return createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
}
function blockFiles(block){return [block.file,block.extraFile,...(block.additionalFiles||[])].filter(Boolean);}
function memoryFiles(block){return [block.memoryAidFile,...(block.additionalMemoryAidFiles||[])].filter(Boolean);}

test("les 320 preguntes prèvies es mantenen byte per byte",async()=>{
  for(const [name,expected] of Object.entries(preservedBankBlobShas)){
    const text=await readFile(path.join(dataDir,name),"utf8");
    assert.equal(gitBlobSha(text),expected,`${name} no s'ha de modificar`);
  }
});

test("course.json declara dues unitats i una expansió completa per bloc",async()=>{
  const course=await readJson("course.json");
  assert.equal(course.blocks.length,6);
  assert.deepEqual([...new Set(course.blocks.map(b=>b.unitId))],["unitat-1","unitat-2"]);
  for(const block of course.blocks){
    const stem=block.id==='unitat-2-bloc-1'?'unitat_2_bloc_1':block.id.replace('-','_');
    const dashStem=block.id;
    assert.deepEqual(block.additionalFiles,[`data/${stem}_expansion.json`],`${block.id}: banc d'expansió`);
    assert.deepEqual(block.additionalTranslationFiles,[`data/i18n/es/${dashStem}-expansion.json`],`${block.id}: traducció d'expansió`);
    assert.deepEqual(block.additionalMemoryAidFiles,[`data/memory/${dashStem}-expansion.json`],`${block.id}: memòria d'expansió`);
  }
});

test("els sis bancs d'expansió aporten exactament 130 preguntes",async()=>{
  let added=0;
  for(const [blockId,count] of Object.entries(expansionCounts)){
    const name=blockId==='unitat-2-bloc-1'?"unitat_2_bloc_1_expansion.json":`${blockId.replace('-','_')}_expansion.json`;
    assert.ok(existsSync(path.join(dataDir,name)),`${name} ha d'existir`);
    const bank=await readJson(name);
    assert.equal(bank.blockId,blockId,`${name}: blockId incorrecte`);
    assert.equal(bank.questions.length,count,`${name} ha de contenir ${count} preguntes`);
    added+=bank.questions.length;
  }
  assert.equal(added,130);
});

test("el curs complet conté 450 preguntes amb la distribució aprovada",async()=>{
  const course=await readJson("course.json");
  let total=0;
  for(const block of course.blocks){
    let blockTotal=0;
    for(const file of blockFiles(block)){
      const bank=await readJson(file.replace(/^data\//,""));
      blockTotal+=bank.questions.length;
    }
    assert.equal(blockTotal,finalCounts[block.id],`${block.id}: total incorrecte`);
    total+=blockTotal;
  }
  assert.equal(total,450);
});

test("les 450 preguntes tenen una ajuda de memòria bilingüe de màxim 144 caràcters",async()=>{
  const course=await readJson("course.json");
  let total=0;
  for(const block of course.blocks){
    const aids={};
    for(const file of memoryFiles(block)){
      const rel=file.replace(/^data\//,"");
      const full=path.join(dataDir,rel);
      assert.ok(existsSync(full),`${file} ha d'existir`);
      const memory=JSON.parse(await readFile(full,"utf8"));
      assert.equal(memory.blockId,block.id,`${file}: blockId d'ajudes incorrecte`);
      assert.ok(memory.questions&&!Array.isArray(memory.questions),`${file}: questions d'ajudes ha de ser un objecte`);
      for(const [id,aid] of Object.entries(memory.questions)){
        assert.equal(Object.hasOwn(aids,id),false,`${id}: ajuda duplicada entre suplements`);
        aids[id]=aid;
      }
    }

    const canonicalIds=[];
    for(const file of blockFiles(block)){
      const bank=await readJson(file.replace(/^data\//,""));
      canonicalIds.push(...bank.questions.map(q=>q.id));
    }
    assert.deepEqual(Object.keys(aids).sort(),canonicalIds.sort(),`${block.id}: cobertura d'ajudes incompleta`);

    for(const id of canonicalIds){
      const aid=aids[id];
      assert.match(aid.type,/^(example|idea)$/,`${id}: type ha de ser example o idea`);
      for(const lang of ["ca","es"]){
        assert.equal(typeof aid[lang],"string",`${id}: ${lang} ha de ser text`);
        assert.ok(aid[lang].trim(),`${id}: ${lang} no pot ser buit`);
        assert.ok(aid[lang].length<=144,`${id}: ${lang} supera 144 caràcters (${aid[lang].length})`);
      }
      total++;
    }
  }
  assert.equal(total,450);
});
