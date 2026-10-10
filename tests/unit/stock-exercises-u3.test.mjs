import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {validateStockExercisesData,checkStockField,officeTotal,renderStockExercisesHtml,createStockExerciseState} from "../../site/js/stock-exercises.js";
const data=validateStockExercisesData(JSON.parse(await readFile(new URL("../../site/data/stock-exercises-u3-v1.json",import.meta.url),"utf8")));
test("UF0519 U3 publica 10 exercicis complets i 21 materials d'oficina",()=>{
 assert.equal(data.exercises.length,11);
 assert.deepEqual(data.exercises.map(e=>e.id),Array.from({length:11},(_,i)=>String(i+1).padStart(3,"0")));
 assert.deepEqual(data.exercises.slice(0,10).map(e=>e.fields.length),[6,4,8,7,7,6,8,6,4,5]);
 assert.equal(data.exercises.slice(0,10).reduce((s,e)=>s+e.fields.length,0),61);
 assert.equal(data.exercises.at(-1).products.length,21);
 for(const e of data.exercises){
  assert.ok(e.title.ca&&e.title.es&&e.reference.ca&&e.reference.es&&e.source.file);
 }
});
test("les 61 respostes són inequívocament corregibles i les dades de càlcul quadran",()=>{
 for(const e of data.exercises.slice(0,10)){
  const keys=new Set();
  for(const field of e.fields){
   assert.ok(!keys.has(field.id),field.id);keys.add(field.id);
   assert.equal(checkStockField(field,field.answer),true,field.id);
   if(field.type==="choice"){
    assert.equal(field.options.filter(o=>o.value===field.answer).length,1,field.id);
    assert.equal(checkStockField(field,field.options.find(o=>o.value!==field.answer).value),false,field.id);
   }else{
    assert.equal(checkStockField(field,"import no vàlid"),false,field.id);
    assert.equal(checkStockField(field,String(Number(field.answer)+1)),false,field.id);
   }
  }
 }
 const supplier=Object.fromEntries(data.exercises[3].fields.map(f=>[f.id,f.answer]));
 assert.equal(Number(supplier.a),12*4);
 assert.ok(Math.abs(Number(supplier.b)-(12*4.2+3))<1e-9);
 assert.ok(Math.abs(Number(supplier.c)-(12*4.4))<1e-9);
 assert.equal(supplier.chosen,"C");
 assert.ok(Math.abs(Number(supplier.saving)-(Number(supplier.b)-Number(supplier.c)))<0.01);
});
test("l'activitat 011 utilitza imports simulats editables i mai els presenta com a preus comercials reals",()=>{
 const office=data.exercises[10];
 const state=createStockExerciseState({getItem:()=>null});
 const expected=Math.round(office.products.reduce((sum,p)=>sum+p.price*p.quantity,0)*100)/100;
 assert.equal(Math.round(officeTotal(office,state)*100)/100,expected);
 state.office[1]={quantity:"3",price:"165",classification:"NF"};
 assert.equal(Math.round((officeTotal(office,state)-expected)*100)/100,165);
 state.selected="011";
 const html=renderStockExercisesHtml(data,"ca",state);
 assert.match(html,/PREUS SIMULATS/);
 assert.match(html,/data-stock-office-row/);
 assert.equal((html.match(/data-stock-office-row=/g)||[]).length,21);
 assert.doesNotMatch(html,/amazon\.|fnac\.|pccomponentes/);
});
test("es conserva l'idioma i les pistes davant d'errors, sense exposar resposta abans d'intentar-ho",()=>{
 const state=createStockExerciseState({getItem:()=>null});
 state.selected="004";
 const before=renderStockExercisesHtml(data,"ca",state);
 assert.match(before,/Oferta A: 4,00/);
 assert.doesNotMatch(before,/stock-solution/);
 state.attempts["004"]=2;state.checked=true;
 const after=renderStockExercisesHtml(data,"es",state);
 assert.match(after,/Oferta A: 4,00/);
 assert.match(after,/stock-solution/);
 assert.match(after,/Volver a las actividades/);
});
