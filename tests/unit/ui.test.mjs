import test from "node:test"; import assert from "node:assert/strict";
import {renderHomeHtml,renderSetupHtml,renderQuestionHtml,renderResultsHtml,renderReviewHtml} from "../../site/js/ui.js";
const course={title:"Operacions auxiliars de serveis administratius i generals",titleEs:"Operaciones auxiliares de servicios administrativos y generales"};
const banks=[
  {blockId:"bloc-1",blockTitle:"Entitats públiques i privades",blockTitleEs:"Entidades públicas y privadas",unitId:"unitat-1",unitTitle:"Unitat 1 — Organització empresarial",unitTitleEs:"Unidad 1 — Organización empresarial",blockNumber:1,questions:Array(24).fill({})},
  {blockId:"unitat-2-bloc-1",blockTitle:"L’organització d’activitats de suport administratiu",blockTitleEs:"La organización de actividades de apoyo administrativo",unitId:"unitat-2",unitTitle:"Unitat 2 — L’organització dels recursos humans",unitTitleEs:"Unidad 2 — La organización de los recursos humanos",blockNumber:1,questions:Array(80).fill({})}
];
test("home agrupa els blocs per unitat i manté l'accés a tot el temari",()=>{const h=renderHomeHtml(course,banks,{pendingErrors:2,blockProgress:{}}); assert.match(h,/Operacions auxiliars/); assert.match(h,/Unitat 1 — Organització empresarial/); assert.match(h,/Unitat 2 — L’organització dels recursos humans/); assert.equal((h.match(/data-unit-group/g)||[]).length,2); assert.match(h,/Tot el temari disponible/); assert.match(h,/104 preguntes/);});
test("home es pot renderitzar íntegrament en castellà",()=>{const h=renderHomeHtml(course,banks,{pendingErrors:2,blockProgress:{}},"es"); assert.match(h,/Operaciones auxiliares/); assert.match(h,/Unidad 1 — Organización empresarial/); assert.match(h,/Unidad 2 — La organización de los recursos humanos/); assert.match(h,/Todo el temario disponible/); assert.match(h,/104 preguntas/); assert.match(h,/Preguntas pendientes de repaso: 2/); assert.doesNotMatch(h,/Tot el temari disponible/);});
test("setup examen mostra penalització",()=>{const h=renderSetupHtml({label:"Bloc 1",mode:"exam",count:10,penaltyEnabled:true,available:24}); assert.match(h,/Amb penalització/); assert.match(h,/−0,33/);});
test("setup es tradueix al castellà",()=>{const h=renderSetupHtml({label:"Bloque 1",mode:"exam",count:10,penaltyEnabled:true,available:24},"es"); assert.match(h,/Configura el test/); assert.match(h,/Modo Examen/); assert.match(h,/Número de preguntas/); assert.match(h,/Con penalización/); assert.match(h,/Comenzar/); assert.doesNotMatch(h,/Mode Examen/);});
test("pregunta mostra quatre opcions",()=>{const h=renderQuestionHtml({question:{id:"q",question:"Pregunta?",options:["A","B","C","D"],correct:0,explanation:"Exp"},index:0,total:10,mode:"study",selected:null,revealed:false}); assert.equal((h.match(/data-answer-option/g)||[]).length,4); assert.match(h,/Pregunta 1 de 10/);});
test("feedback i navegació de pregunta es tradueixen al castellà",()=>{const h=renderQuestionHtml({question:{id:"q",question:"¿Pregunta?",options:["A","B","C","D"],correct:0,explanation:"Explicación"},index:0,total:10,mode:"study",selected:0,revealed:true},"es"); assert.match(h,/Respuesta correcta/); assert.match(h,/Siguiente/); assert.doesNotMatch(h,/Resposta correcta/);});

test("l'ajuda de memòria no es mostra abans de respondre",()=>{const h=renderQuestionHtml({question:{id:"q",question:"Pregunta?",options:["A","B","C","D"],correct:0,explanation:"Exp",memoryAid:{type:"example",text:"Exemple que no ha de donar pistes"}},index:0,total:10,mode:"study",selected:null,revealed:false}); assert.doesNotMatch(h,/Exemple que no ha de donar pistes/);});
test("el feedback mostra l'exemple per recordar en castellà després de respondre",()=>{const h=renderQuestionHtml({question:{id:"q",question:"¿Pregunta?",options:["A","B","C","D"],correct:0,explanation:"Explicación",memoryAid:{type:"example",text:"Una pyme puede agrupar varias funciones."}},index:0,total:10,mode:"study",selected:0,revealed:true},"es"); assert.match(h,/Ejemplo para recordar/); assert.match(h,/Una pyme puede agrupar varias funciones\./);});
test("el feedback usa Idea para recordar quan l'ajuda no és un exemple pràctic",()=>{const h=renderQuestionHtml({question:{id:"q",question:"¿Pregunta?",options:["A","B","C","D"],correct:0,explanation:"Explicación",memoryAid:{type:"idea",text:"Relaciona eficacia con lograr el objetivo."}},index:0,total:10,mode:"study",selected:0,revealed:true},"es"); assert.match(h,/Idea para recordar/);});

test("resultats separen percentatge i nota",()=>{const h=renderResultsHtml({score:{total:10,correct:8,incorrect:2,blank:0,rawPoints:7.34,percentCorrect:80,grade10:7.34},breakdown:{byBlock:{},byTopic:{}},penaltyEnabled:true}); assert.match(h,/80 %/); assert.match(h,/7,34 \/ 10/);});
test("resultats es tradueixen al castellà",()=>{const h=renderResultsHtml({score:{total:10,correct:8,incorrect:2,blank:0,rawPoints:7.34,percentCorrect:80,grade10:7.34},breakdown:{byBlock:{},byTopic:{}},penaltyEnabled:true},"es"); assert.match(h,/Resultado/); assert.match(h,/Porcentaje de aciertos/); assert.match(h,/Aciertos: 8/); assert.match(h,/Revisar respuestas/); assert.match(h,/Volver al temario/);});
test("review mostra resposta i explicació",()=>{const h=renderReviewHtml([{question:{question:"Q?",options:["A","B","C","D"],correct:0,explanation:"Exp"},selected:1}]); assert.match(h,/La teva resposta/); assert.match(h,/Resposta correcta/); assert.match(h,/Exp/);});
test("review es tradueix al castellà",()=>{const h=renderReviewHtml([{question:{question:"¿Q?",options:["A","B","C","D"],correct:0,explanation:"Exp"},selected:1}],"es"); assert.match(h,/Tu respuesta/); assert.match(h,/Respuesta correcta/); assert.match(h,/Revisar respuestas/);});
test("review conserva l'ajuda de memòria",()=>{const h=renderReviewHtml([{question:{question:"¿Q?",options:["A","B","C","D"],correct:0,explanation:"Exp",memoryAid:{type:"example",text:"Ejemplo breve para recordar."}},selected:1}],"es"); assert.match(h,/Ejemplo para recordar/); assert.match(h,/Ejemplo breve para recordar\./);});
test("setup normal ofereix mode Repassar errors",()=>{const h=renderSetupHtml({label:"Bloc 1",mode:"study",count:10,penaltyEnabled:false,available:24,pendingReview:3}); assert.match(h,/Repassar errors/);});


test("setup ofereix Mode Examen difícil en català i mostra penalització",()=>{
  const h=renderSetupHtml({label:"Bloc 1",mode:"hard-exam",count:10,penaltyEnabled:true,available:24,pendingReview:0},"ca");
  assert.match(h,/Mode Examen difícil/);
  assert.match(h,/Amb penalització/);
  assert.match(h,/−0,33/);
});

test("setup ofereix Modo Examen difícil en castellà",()=>{
  const h=renderSetupHtml({label:"Bloque 1",mode:"hard-exam",count:10,penaltyEnabled:false,available:24,pendingReview:0},"es");
  assert.match(h,/Modo Examen difícil/);
  assert.match(h,/Sin penalización/);
});
