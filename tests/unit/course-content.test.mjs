import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";

const dataDir=path.resolve("site/data");
const readJson=async name=>JSON.parse(await readFile(path.join(dataDir,name),"utf8"));
const bankFiles=block=>[block.file,block.extraFile,...(block.additionalFiles||[])].filter(Boolean);
const memoryFiles=block=>[block.memoryAidFile,...(block.additionalMemoryAidFiles||[])].filter(Boolean);
const legacyRanges={
  'bloc-1':['b1-',42],
  'bloc-2':['b2-',56],
  'bloc-3':['b3-',56],
  'bloc-4':['b4-',40],
  'bloc-5':['b5-',46],
  'unitat-2-bloc-1':['u2b1-',80]
};
const legacyIds=new Set(Object.values(legacyRanges).flatMap(([prefix,count])=>Array.from({length:count},(_,index)=>`${prefix}${String(index+1).padStart(3,'0')}`)));
const fnv1a32=text=>{
  let hash=2166136261;
  for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619)>>>0;}
  return hash.toString(16).padStart(8,'0');
};
const uf0517FinalCounts={"bloc-1":60,"bloc-2":80,"bloc-3":80,"bloc-4":70,"bloc-5":70,"unitat-2-bloc-1":150};
const uf0519Counts={"uf0519-bloc-1":16,"uf0519-bloc-2":33,"uf0519-bloc-3":19,"uf0519-bloc-4":8,"uf0519-bloc-5":22};
test("les 320 preguntes prèvies mantenen exactament el mateix contingut encara que canviï l’ordre físic",async()=>{
  const course=await readJson("course.json");
  const legacy=[];
  for(const block of course.blocks.filter(block=>legacyRanges[block.id])){
    for(const file of bankFiles(block)){
      const bank=await readJson(file.replace(/^data\\//,""));
      legacy.push(...bank.questions.filter(question=>legacyIds.has(question.id)));
    }
  }
  legacy.sort((a,b)=>a.id.localeCompare(b.id,"en",{numeric:true}));
  assert.equal(legacy.length,320);
  const payload=JSON.stringify(legacy);
  assert.equal(payload.length,146854);
  assert.equal(fnv1a32(payload),"a5492016");
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
