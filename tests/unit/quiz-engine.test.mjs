import test from "node:test"; import assert from "node:assert/strict";
import {shuffleArray,shuffleQuestionOptions,buildQuiz,buildHardQuiz,rankReviewQuestions} from "../../site/js/quiz-engine.js";
const rngZero=()=>0;
test("shuffleArray no muta",()=>{const input=[1,2,3,4]; const out=shuffleArray(input,rngZero); assert.deepEqual(input,[1,2,3,4]); assert.notStrictEqual(out,input);});
test("shuffleQuestionOptions conserva correcta",()=>{const q={id:"q1",options:["A","B","C","D"],correct:2}; const s=shuffleQuestionOptions(q,rngZero); assert.equal(s.options[s.correct],"C");});
test("shuffleQuestionOptions manté les traduccions en la mateixa permutació",()=>{
  const q={
    id:"q1",
    options:["CA-A","CA-B","CA-C","CA-D"],
    correct:2,
    translations:{
      es:{question:"Pregunta",options:["ES-A","ES-B","ES-C","ES-D"],explanation:"Explicación"}
    }
  };
  const s=shuffleQuestionOptions(q,rngZero);
  assert.equal(s.options[s.correct],"CA-C");
  assert.equal(s.translations.es.options[s.correct],"ES-C");
  assert.deepEqual(s.translations.es.options,["ES-B","ES-C","ES-D","ES-A"]);
});
test("buildQuiz limita recompte",()=>{const qs=Array.from({length:12},(_,i)=>({id:`q${i}`,options:["A","B","C","D"],correct:0})); assert.equal(buildQuiz(qs,10,rngZero).length,10); assert.equal(buildQuiz(qs,"all",rngZero).length,12);});
test("buildQuiz usa totes si en falten",()=>{const qs=Array.from({length:6},(_,i)=>({id:`q${i}`,options:["A","B","C","D"],correct:0})); assert.equal(buildQuiz(qs,20,rngZero).length,6);});
test("rankReview prioritza score",()=>{const qs=[{id:"a"},{id:"b"},{id:"c"}]; assert.deepEqual(rankReviewQuestions(qs,{a:1,b:3,c:0},rngZero).map(q=>q.id),["b","a"]);});

test("buildReviewQuiz selecciona primer les preguntes amb més errors", async () => {
  const { buildReviewQuiz } = await import("../../site/js/quiz-engine.js");
  const qs=[
    {id:"a",options:["A","B","C","D"],correct:0},
    {id:"b",options:["A","B","C","D"],correct:0},
    {id:"c",options:["A","B","C","D"],correct:0}
  ];
  const out=buildReviewQuiz(qs,{a:1,b:5,c:3},2,()=>0);
  assert.deepEqual(new Set(out.map(q=>q.id)),new Set(["b","c"]));
});


test("buildHardQuiz substitueix només els distractors abans de barrejar",()=>{
  const q={id:"q1",block:"bloc-1",options:["Correcta","P1","P2","P3"],correct:0,translations:{es:{options:["Correcta ES","P1 ES","P2 ES","P3 ES"]}}};
  const hard={q1:{ca:["H1","H2","H3"],es:["H1 ES","H2 ES","H3 ES"]}};
  const out=buildHardQuiz([q],hard,1,()=>0)[0];
  assert.equal(out.options[out.correct],"Correcta");
  assert.equal(out.translations.es.options[out.correct],"Correcta ES");
  assert.deepEqual(new Set(out.options),new Set(["Correcta","H1","H2","H3"]));
  assert.deepEqual(new Set(out.translations.es.options),new Set(["Correcta ES","H1 ES","H2 ES","H3 ES"]));
  assert.deepEqual(q.options,["Correcta","P1","P2","P3"]);
});

test("buildHardQuiz falla si falta el registre difícil d'una pregunta seleccionada",()=>{
  const q={id:"q1",block:"bloc-1",options:["A","B","C","D"],correct:0,translations:{es:{options:["A","B","C","D"]}}};
  assert.throws(()=>buildHardQuiz([q],{},1,()=>0),/hard distractor record absent/);
});
