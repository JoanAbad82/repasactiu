import test from "node:test";
import assert from "node:assert/strict";
import { loadCourse, loadBlock, loadBlockBundle } from "../../site/js/catalog.js";
const okFetch = async (url) => ({ ok: true, json: async () => url.endsWith("course.json") ? {id:"course",title:"Curs",blocks:[]} : {blockId:"bloc-1",blockTitle:"Bloc 1",questions:url.includes("extra")?[{id:"q2"}]:[{id:"q1"}]} });
test("loadCourse retorna el catàleg", async()=> assert.equal((await loadCourse(okFetch)).title,"Curs"));
test("loadBlock carrega un banc", async()=> assert.equal((await loadBlock("data/bloc_1.json",okFetch)).blockId,"bloc-1"));
test("loadBlock falla amb missatge funcional", async()=> { const bad=async()=>({ok:false,status:500}); await assert.rejects(()=>loadBlock("data/bloc_1.json",bad),/No s’ha pogut carregar aquest bloc/); });
test("loadBlockBundle fusiona banc principal i addicional", async()=> { const bank=await loadBlockBundle("data/bloc_1.json","data/bloc_1_extra.json",okFetch); assert.deepEqual(bank.questions.map(q=>q.id),["q1","q2"]); });
test("loadBlockBundle rebutja un banc addicional d’un altre bloc", async()=> { const mismatch=async(url)=>({ok:true,json:async()=>url.includes("extra")?{blockId:"bloc-2",questions:[]}:{blockId:"bloc-1",questions:[]}}); await assert.rejects(()=>loadBlockBundle("data/bloc_1.json","data/bloc_1_extra.json",mismatch),/no correspon al bloc principal/); });
