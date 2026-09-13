import test from "node:test"; import assert from "node:assert/strict";
import {computeProgress} from "../../site/js/progress.js";
const banks=[{blockId:"bloc-1",questions:[{id:"q1"},{id:"q2"}]},{blockId:"bloc-2",questions:[{id:"q3"}]}];
test("progress calcula encerts sobre intents respostos",()=>{const state={errorScores:{q2:2},questionStats:{q1:{correct:2,incorrect:1,blank:0,attempts:3},q2:{correct:0,incorrect:0,blank:1,attempts:1}}}; const p=computeProgress(banks,state); assert.equal(Math.round(p.blockProgress['bloc-1']),67); assert.equal(p.pendingErrors,1);});
test("bloc sense intents dona null",()=>{const p=computeProgress(banks,{errorScores:{},questionStats:{}}); assert.equal(p.blockProgress['bloc-2'],null);});
