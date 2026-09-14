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
  "bloc_5.json":"144a26b8d513f0ec1c5494e20af0068063ebde4a",
  "bloc_5_extra.json":"281df4a24381a77ac7495523804beb76e2b9783b"
};

function gitBlobSha(text){
  const bytes=Buffer.from(text,"utf8");
  return createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
}

test("les 200 preguntes existents es mantenen byte per byte",async()=>{
  for(const [name,expected] of Object.entries(preservedBankBlobShas)){
    const text=await readFile(path.join(dataDir,name),"utf8");
    assert.equal(gitBlobSha(text),expected,`${name} no s'ha de modificar`);
  }
});

test("course.json declara dues unitats i incorpora el Bloc 4 i la Unitat 2",async()=>{
  const course=await readJson("course.json");
  assert.equal(course.blocks.length,6);
  assert.deepEqual([...new Set(course.blocks.map(b=>b.unitId))],["unitat-1","unitat-2"]);
  const u1b4=course.blocks.find(b=>b.id==="bloc-4");
  assert.ok(u1b4);
  assert.equal(u1b4.unitId,"unitat-1");
  assert.equal(u1b4.blockNumber,4);
  const u2b1=course.blocks.find(b=>b.id==="unitat-2-bloc-1");
  assert.ok(u2b1);
  assert.equal(u2b1.unitId,"unitat-2");
  assert.equal(u2b1.blockNumber,1);
});

test("els nous bancs aporten 40 preguntes al Bloc 4 i 80 a la Unitat 2",async()=>{
  const expected={
    "bloc_4.json":24,
    "bloc_4_extra.json":16,
    "unitat_2_bloc_1.json":40,
    "unitat_2_bloc_1_extra.json":40
  };
  let added=0;
  for(const [name,count] of Object.entries(expected)){
    assert.ok(existsSync(path.join(dataDir,name)),`${name} ha d'existir`);
    const bank=await readJson(name);
    assert.equal(bank.questions.length,count,`${name} ha de contenir ${count} preguntes`);
    added+=bank.questions.length;
  }
  assert.equal(added,120);
});

test("el curs complet conté 320 preguntes",async()=>{
  const course=await readJson("course.json");
  let total=0;
  for(const block of course.blocks){
    for(const key of ["file","extraFile"]){
      if(!block[key])continue;
      const bank=await readJson(path.basename(block[key]));
      total+=bank.questions.length;
    }
  }
  assert.equal(total,320);
});
