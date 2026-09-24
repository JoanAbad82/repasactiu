import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import path from "node:path";

const dataDir=path.resolve("site/data");
const readJson=async name=>JSON.parse(await readFile(path.join(dataDir,name),"utf8"));
const bankFiles=block=>[block.file,block.extraFile,...(block.additionalFiles||[])].filter(Boolean);
const memoryFiles=block=>[block.memoryAidFile,...(block.additionalMemoryAidFiles||[])].filter(Boolean);
const preservedBankBlobShas={
  "bloc_1.json":"b8dc6e3b640ce1de7081fd996f758ebf19286363","bloc_1_extra.json":"28129903eab0064329a735521050f0c80ffb37c9",
  "bloc_2.json":"f2b5c80d5219c4cd26e585c197aadb3e4f8dd182","bloc_2_extra.json":"c7ab4a26de4689d84981be03a68ec188332d39e1",
  "bloc_3.json":"9e3df1c06603faad130ee566caf58a018c2b9bde","bloc_3_extra.json":"0b9d2a4bad587af2100c5f6f518b54dfe420e770",
  "bloc_4.json":"897f993e69115de35ab549e60e070ada61c12891","bloc_4_extra.json":"972dd866e4e2fce731c08a2bc04fb71fe85b3754",
  "bloc_5.json":"144a26b8d513f0ec1c5494e20af0068063ebde4a","bloc_5_extra.json":"281df4a24381a77ac7495523804beb76e2b9783b",
  "unitat_2_bloc_1.json":"beccc885747411bc10bc2b41ed63e6f17f8a68f6","unitat_2_bloc_1_extra.json":"e2dd987115e7643b3b00c89d963626ff9bcea59c"
};
const uf0517FinalCounts={"bloc-1":60,"bloc-2":80,"bloc-3":80,"bloc-4":70,"bloc-5":70,"unitat-2-bloc-1":150};
const uf0519Counts={"uf0519-bloc-1":16,"uf0519-bloc-2":33,"uf0519-bloc-3":19,"uf0519-bloc-4":8,"uf0519-bloc-5":22};
const gitBlobSha=text=>{const bytes=Buffer.from(text,"utf8");return createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");};

test("les 320 preguntes prèvies es mantenen byte per byte",async()=>{
  for(const [name,expected] of Object.entries(preservedBankBlobShas)){
    const text=await readFile(path.join(dataDir,name),"utf8");
    assert.equal(gitBlobSha(text),expected,`${name} no s'ha de modificar`);
  }
});

test("UF0517 manté 510 preguntes, UF0518 en té 234 i UF0519 n’afegeix 98",async()=>{
  const course=await readJson("course.json");
  assert.equal(course.blocks.length,14);
  assert.deepEqual([...new Set(course.blocks.map(b=>b.unitId))],["unitat-1","unitat-2","uf0518","uf0519-unitat-1"]);
  let uf0517=0,uf0518=0,uf0519=0;
  for(const block of course.blocks){
    let count=0;
    for(const file of bankFiles(block))count+=(await readJson(file.replace(/^data\//,""))).questions.length;
    if(block.unitId==='uf0518'){
      const expectedUf0518=block.id==='uf0518-bloc-1'?86:block.id==='uf0518-bloc-2'?68:80;
      assert.equal(count,expectedUf0518,`${block.id}: total UF0518 incorrecte`);
      uf0518+=count;
    }else if(block.unitId==='uf0519-unitat-1'){
      assert.equal(count,uf0519Counts[block.id],`${block.id}: total UF0519 incorrecte`);
      uf0519+=count;
    }else{
      assert.equal(count,uf0517FinalCounts[block.id],`${block.id}: total UF0517 incorrecte`);
      uf0517+=count;
    }
  }
  assert.equal(uf0517,510);
  assert.equal(uf0518,234);
  assert.equal(uf0519,98);
  assert.equal(uf0517+uf0518+uf0519,842);
});

test("les 842 preguntes tenen una ajuda de memòria bilingüe de màxim 144 caràcters",async()=>{
  const course=await readJson("course.json");
  let total=0;
  for(const block of course.blocks){
    const aids={};
    for(const file of memoryFiles(block)){
      const memory=await readJson(file.replace(/^data\//,""));
      assert.equal(memory.blockId,block.id);
      for(const [id,aid] of Object.entries(memory.questions||{})){
        assert.equal(Object.hasOwn(aids,id),false,`${id}: ajuda duplicada`);
        aids[id]=aid;
      }
    }
    const canonical=[];
    for(const file of bankFiles(block))canonical.push(...(await readJson(file.replace(/^data\//,""))).questions.map(q=>q.id));
    assert.deepEqual(Object.keys(aids).sort(),canonical.sort(),`${block.id}: cobertura d'ajudes incompleta`);
    for(const id of canonical){
      const aid=aids[id];
      assert.match(aid.type,/^(example|idea)$/);
      for(const lang of ["ca","es"]){assert.ok(aid[lang]?.trim());assert.ok([...aid[lang]].length<=144,`${id}: ${lang} > 144`);}
      total++;
    }
  }
  assert.equal(total,842);
});
