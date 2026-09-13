import test from "node:test"; import assert from "node:assert/strict"; import {scoreQuiz,buildBreakdown} from "../../site/js/scoring.js";
const questions=[{id:"q1",block:"b1",topic:"t1",correct:0},{id:"q2",block:"b1",topic:"t1",correct:1},{id:"q3",block:"b2",topic:"t2",correct:2}];
test("sense penalització",()=>{const r=scoreQuiz(questions,{q1:0,q2:0,q3:null},false); assert.deepEqual([r.correct,r.incorrect,r.blank,r.rawPoints,r.percentCorrect,r.grade10],[1,1,1,1,33.33,3.33]);});
test("amb penalització",()=>{const r=scoreQuiz(questions,{q1:0,q2:0,q3:null},true); assert.equal(r.rawPoints,0.67); assert.equal(r.grade10,2.23);});
test("nota no baixa de zero",()=>assert.equal(scoreQuiz(questions,{q1:1,q2:0,q3:0},true).grade10,0));
test("breakdown",()=>{const r=buildBreakdown(questions,{q1:0,q2:0,q3:null}); assert.equal(r.byBlock.b1.correct,1); assert.equal(r.byTopic.t2.blank,1);});
