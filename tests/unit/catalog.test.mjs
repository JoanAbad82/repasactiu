import test from "node:test";
import assert from "node:assert/strict";
import { loadCourse, loadBlock } from "../../site/js/catalog.js";
const okFetch = async (url) => ({ ok: true, json: async () => url.endsWith("course.json") ? {id:"course",title:"Curs",blocks:[]} : {blockId:"bloc-1",blockTitle:"Bloc 1",questions:[]} });
test("loadCourse retorna el catàleg", async()=> assert.equal((await loadCourse(okFetch)).title,"Curs"));
test("loadBlock carrega un banc", async()=> assert.equal((await loadBlock("data/bloc_1.json",okFetch)).blockId,"bloc-1"));
test("loadBlock falla amb missatge funcional", async()=> { const bad=async()=>({ok:false,status:500}); await assert.rejects(()=>loadBlock("data/bloc_1.json",bad),/No s’ha pogut carregar aquest bloc/); });
