import test from "node:test"; import assert from "node:assert/strict"; import {createDefaultState,loadState,saveState,recordAttempt,appendHistory,resetProgress} from "../../site/js/storage.js";
function memoryStorage(){const d=new Map();return{getItem:k=>d.has(k)?d.get(k):null,setItem:(k,v)=>d.set(k,String(v)),removeItem:k=>d.delete(k)}}
test("estat inicial",()=>{const s=createDefaultState(); assert.equal(s.version,1); assert.deepEqual(s.errorScores,{});});
test("error suma encert resta",()=>{let s=createDefaultState(); s=recordAttempt(s,"q1","incorrect"); s=recordAttempt(s,"q1","incorrect"); s=recordAttempt(s,"q1","correct"); assert.equal(s.errorScores.q1,1); s=recordAttempt(s,"q1","correct"); s=recordAttempt(s,"q1","correct"); assert.equal(s.errorScores.q1,0);});
test("blanc no modifica",()=>assert.equal(recordAttempt(createDefaultState(),"q1","blank").errorScores.q1??0,0));
test("historial 20",()=>{let s=createDefaultState(); for(let i=0;i<25;i++)s=appendHistory(s,{id:String(i)}); assert.equal(s.history.length,20); assert.equal(s.history[0].id,"5");});
test("reset conserva tema",()=>{const st=memoryStorage(); let s=createDefaultState(); s.theme="dark"; s.errorScores.q1=3; saveState(s,st); resetProgress(st); const r=loadState(st); assert.equal(r.theme,"dark"); assert.deepEqual(r.errorScores,{});});
