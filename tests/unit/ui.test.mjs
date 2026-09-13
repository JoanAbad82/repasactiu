import test from "node:test"; import assert from "node:assert/strict";
import {renderHomeHtml,renderSetupHtml,renderQuestionHtml,renderResultsHtml,renderReviewHtml} from "../../site/js/ui.js";
const course={title:"Operacions auxiliars de serveis administratius i generals"};
const banks=[{blockId:"bloc-1",blockTitle:"Entitats públiques i privades",questions:Array(24).fill({})}];
test("home inclou curs, bloc i tot el temari",()=>{const h=renderHomeHtml(course,banks,{pendingErrors:2,blockProgress:{}}); assert.match(h,/Operacions auxiliars/); assert.match(h,/Bloc 1/); assert.match(h,/Tot el temari disponible/); assert.match(h,/24 preguntes/);});
test("setup examen mostra penalització",()=>{const h=renderSetupHtml({label:"Bloc 1",mode:"exam",count:10,penaltyEnabled:true,available:24}); assert.match(h,/Amb penalització/); assert.match(h,/−0,33/);});
test("pregunta mostra quatre opcions",()=>{const h=renderQuestionHtml({question:{id:"q",question:"Pregunta?",options:["A","B","C","D"],correct:0,explanation:"Exp"},index:0,total:10,mode:"study",selected:null,revealed:false}); assert.equal((h.match(/data-answer-option/g)||[]).length,4); assert.match(h,/Pregunta 1 de 10/);});
test("resultats separen percentatge i nota",()=>{const h=renderResultsHtml({score:{total:10,correct:8,incorrect:2,blank:0,rawPoints:7.34,percentCorrect:80,grade10:7.34},breakdown:{byBlock:{},byTopic:{}},penaltyEnabled:true}); assert.match(h,/80 %/); assert.match(h,/7,34 \/ 10/);});
test("review mostra resposta i explicació",()=>{const h=renderReviewHtml([{question:{question:"Q?",options:["A","B","C","D"],correct:0,explanation:"Exp"},selected:1}]); assert.match(h,/La teva resposta/); assert.match(h,/Resposta correcta/); assert.match(h,/Exp/);});

test("setup normal ofereix mode Repassar errors",()=>{
  const h=renderSetupHtml({label:"Bloc 1",mode:"study",count:10,penaltyEnabled:false,available:24,pendingReview:3});
  assert.match(h,/Repassar errors/);
});
