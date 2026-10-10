const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const locale=value=>String(value||"").trim().replace(/\s/g,"").replace(/€/g,"").replace(/\.(?=\d{3}(?:,|$))/g,"").replace(",",".");
const number=value=>{const n=Number(locale(value));return value===null||String(value).trim()===""||!Number.isFinite(n)?null:n;};
const money=value=>new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR"}).format(value);
const T={
 ca:{title:"Existències · Unitat 3",intro:"11 activitats de classe, amb el material necessari en pantalla. Els exercicis provenen dels documents del curs; les dades comercials de la simulació 011 són fictícies.",back:"← Tornar a les activitats",check:"Comprovar respostes",progress:"Respostes correctes",missing:"Sense respondre",correct:"Correcte",wrong:"Cal revisar",try:"Intents",answer:"Solució",hint:"Pista",reset:"Reiniciar activitat",reference:"Dades i material de consulta",source:"Font",siteTranslation:"Traducció al castellà de la web; el document original és en català.",inputs:"Exercicis",calculate:"Calculadora integrada",first:"Primer import",second:"Segon import",operator:"Operació",equals:"Calcula",use:"Aplicar al camp numèric seleccionat",result:"Resultat",select:"Tria una resposta",officeTitle:"Pressupost d'oficina",officeNote:"PREUS SIMULATS: catàleg didàctic amb IVA inclòs, sense cap oferta comercial real. Pots modificar quantitats i preus. L'import i el total es recalculen automàticament.",kind:"Tipus",quantity:"Quantitat",price:"Preu amb IVA",amount:"Import",model:"Marca / model (de mostra)",supplier:"Proveïdor (de mostra)",total:"TOTAL AMB IVA",officeCheck:"Revisar classificació",officeScore:"Classificacions correctes",incomplete:"Tria F/NF per a cada producte per completar l'exercici.",f:"Fungible",nf:"No fungible",verified:"Resultats comprovats",completed:"Has completat les respostes amb correcció.",again:"Pots rectificar les respostes i tornar-les a comprovar."},
 es:{title:"Existencias · Unidad 3",intro:"11 actividades de clase, con el material necesario en pantalla. Los ejercicios proceden de los documentos del curso; los datos comerciales de la simulación 011 son ficticios.",back:"← Volver a las actividades",check:"Comprobar respuestas",progress:"Respuestas correctas",missing:"Sin responder",correct:"Correcto",wrong:"Revisar",try:"Intentos",answer:"Solución",hint:"Pista",reset:"Reiniciar actividad",reference:"Datos y material de consulta",source:"Fuente",siteTranslation:"Traducción al castellano de la web; el documento original está en catalán.",inputs:"Ejercicios",calculate:"Calculadora integrada",first:"Primer importe",second:"Segundo importe",operator:"Operación",equals:"Calcular",use:"Aplicar al campo numérico seleccionado",result:"Resultado",select:"Selecciona una respuesta",officeTitle:"Presupuesto de oficina",officeNote:"PRECIOS SIMULADOS: catálogo didáctico con IVA incluido, sin ofertas comerciales reales. Puedes modificar cantidades y precios. El importe y el total se recalculan automáticamente.",kind:"Tipo",quantity:"Cantidad",price:"Precio con IVA",amount:"Importe",model:"Marca / modelo (de muestra)",supplier:"Proveedor (de muestra)",total:"TOTAL CON IVA",officeCheck:"Revisar clasificación",officeScore:"Clasificaciones correctas",incomplete:"Selecciona F/NF para cada producto para completar el ejercicio.",f:"Fungible",nf:"No fungible",verified:"Resultados comprobados",completed:"Has completado las respuestas correctamente.",again:"Puedes corregir las respuestas y volverlas a comprobar."}
};
const knownHashes=["3_Gestió i control bàsic d’existències.pdf","Excel oficina.xlsx","UF0519_U3_01_Material_i_arxiu_Exercicis.docx","UF0519_U3_02_Aprovisionament_i_etiquetatge_Exercicis.docx","UF0519_U3_03_Magatzem_i_seguretat_Exercicis.docx","UF0519_U3_04_Organitzacio_rotacio_i_trasllats_Exercicis.docx"];
export function validateStockExercisesData(data){
 if(data?.version!==1||data.id!=="UF0519_U3_PRACTICE_V1"||data.sourcePdfPages!==29||data.exercises?.length!==11)throw new Error("UF0519 U3: dades generals o nombre d'activitats no vàlids");
 if(knownHashes.some(file=>!/^[a-f0-9]{64}$/.test(data.sourceHashesSha256?.[file]||"")))throw new Error("UF0519 U3: manca un hash de font");
 const ids=new Set(),expected=[6,4,8,7,7,6,8,6,4,5];
 for(const [index,exercise] of data.exercises.entries()){
  if(exercise.id!==String(index+1).padStart(3,"0")||!exercise.title?.ca||!exercise.title?.es||!knownHashes.includes(exercise.source?.file)||ids.has(exercise.id))throw new Error("UF0519 U3: activitat incoherent "+index);
  ids.add(exercise.id);
  if(index===10){
   if(exercise.type!=="office"||exercise.products?.length!==21||exercise.products.some(p=>!p.name?.ca||!p.name?.es||!["F","NF"].includes(p.classification)||!(p.price>0)||!(p.quantity>0)))throw new Error("UF0519 U3: catàleg incomplet");
  }else{
   if(exercise.fields?.length!==expected[index])throw new Error("UF0519 U3: nombre de respostes incorrecte");
   for(const q of exercise.fields){
    if(!q.question?.ca||!q.question?.es||!q.answer||!["choice","number"].includes(q.type))throw new Error("UF0519 U3: pregunta incompleta");
    if(q.type==="choice"&&(q.options?.length<2||q.options.filter(o=>o.value===q.answer).length!==1))throw new Error("UF0519 U3: resposta ambigua");
    if(q.type==="number"&&number(q.answer)===null)throw new Error("UF0519 U3: resultat numèric invàlid");
   }
  }
 }
 return data;
}
export async function loadStockExercises(fetcher=fetch){
 const response=await fetcher("data/stock-exercises-u3-v1.json");
 if(!response.ok)throw new Error("No s'han pogut carregar els exercicis d'existències");
 return validateStockExercisesData(await response.json());
}
const STORAGE_KEY="repasactiu:uf0519-u3-practice-v1";
export function createStockExerciseState(storage=globalThis.localStorage){
 try{
  const s=JSON.parse(storage?.getItem(STORAGE_KEY)||"null");
  if(s&&typeof s==="object"&&s.answers&&s.office&&s.attempts)return {...s,selected:"",checked:false};
 }catch{}
 return {selected:"",answers:{},office:{},attempts:{},checked:false};
}
const persist=state=>{try{globalThis.localStorage?.setItem(STORAGE_KEY,JSON.stringify({...state,checked:false}));}catch{}};
export const checkStockField=(field,value)=>{
 if(field.type==="number"){const n=number(value);return n!==null&&Math.abs(n-Number(field.answer))<0.005;}
 return String(value??"")===field.answer;
};
export function officeTotal(exercise,state){
 return exercise.products.reduce((sum,p)=>{
  const row=state.office[p.id]||{};
  const n=number(row.quantity??p.quantity),price=number(row.price??p.price);
  return sum+(n!==null&&n>=0&&price!==null&&price>=0?Math.round(n*price*100)/100:0);
 },0);
}
const resultFor=(exercise,state)=>{
 const entries=exercise.fields||[];
 const answers=state.answers[exercise.id]||{};
 return {correct:entries.filter(q=>checkStockField(q,answers[q.id])).length,answered:entries.filter(q=>String(answers[q.id]??"").trim()!=="").length,total:entries.length};
};
function landing(bank,l,state){
 const t=T[l];
 return '<header class="stock-head"><h2>'+t.title+'</h2><p>'+t.intro+'</p></header><div class="stock-exercise-grid">'+bank.exercises.map(x=>{
  const result=x.type==="office"?null:resultFor(x,state);
  return '<button type="button" class="stock-exercise-card" data-stock-exercise="'+esc(x.id)+'"><span class="stock-exercise-number">'+esc(x.id)+'</span><strong>'+esc(x.title[l])+'</strong><small>'+esc(x.source.file)+'</small>'+ (result&&result.answered?'<span class="stock-progress">'+result.correct+' / '+result.total+'</span>':'')+'</button>';
 }).join("")+'</div>';
}
function calculator(l){
 const t=T[l];
 return '<section class="stock-calculator"><h3>'+t.calculate+'</h3><div class="stock-calculator-row"><label>'+t.first+'<input data-stock-calc-a type="text" inputmode="decimal" value="0"></label><label>'+t.operator+'<select data-stock-calc-op><option value="+">+</option><option value="-">−</option><option value="*">×</option><option value="/">÷</option></select></label><label>'+t.second+'<input data-stock-calc-b type="text" inputmode="decimal" value="0"></label></div><div class="stock-calculator-actions"><button type="button" data-stock-calc-equals>'+t.equals+'</button><output data-stock-calc-result aria-live="polite">'+t.result+': —</output><button type="button" data-stock-calc-use disabled>'+t.use+'</button></div></section>';
}
function guided(exercise,l,state){
 const t=T[l],answers=state.answers[exercise.id]||{},result=resultFor(exercise,state),checks=Number(state.attempts[exercise.id]||0);
 return '<header class="stock-head"><button type="button" class="back-button" data-stock-back>'+t.back+'</button><h2>'+esc(exercise.id+' · '+exercise.title[l])+'</h2><p class="stock-source">'+t.source+': '+esc(exercise.source.file)+' · PDF p. '+exercise.source.pages.join('–')+'</p></header>'+
 '<section class="stock-reference"><h3>'+t.reference+'</h3><p>'+esc(exercise.reference[l])+'</p>'+(l==="es"?'<small>'+t.siteTranslation+'</small>':'')+'</section>'+
 calculator(l)+
 '<form data-stock-guided-form><div class="stock-questions">'+exercise.fields.map((q,index)=>{
  const value=String(answers[q.id]??"");
  const control=q.type==="choice"?'<select data-stock-answer="'+esc(q.id)+'"><option value="">'+t.select+'</option>'+q.options.map(o=>'<option value="'+esc(o.value)+'"'+(value===o.value?' selected':'')+'>'+esc(o.label[l])+'</option>').join("")+'</select>':'<input data-stock-answer="'+esc(q.id)+'" type="text" inputmode="decimal" placeholder="0,00" value="'+esc(value)+'">';
  const tried=state.checked&&value.trim()!=="",ok=checkStockField(q,value);
  const feedback=tried?'<small class="'+(ok?'stock-correct':'stock-wrong')+'">'+(ok?t.correct:t.wrong)+'</small>':'';
  const extra=checks>0&&!ok?'<details><summary>'+t.hint+'</summary><p>'+esc(q.hint?.[l]||exercise.reference[l])+'</p></details>':'';
  const solution=checks>=2&&!ok?'<p class="stock-solution">'+t.answer+': '+esc(q.type==="choice"?q.options.find(o=>o.value===q.answer)?.label[l]:q.answer)+'</p>':'';
  return '<label class="stock-question"><span class="stock-question-title">'+(index+1)+'. '+esc(q.question[l])+'</span>'+control+feedback+extra+solution+'</label>';
 }).join("")+'</div><div class="stock-actions"><button type="submit" class="primary">'+t.check+'</button><button type="button" data-stock-reset>'+t.reset+'</button></div></form>'+
 (checks?'<p class="stock-summary" role="status">'+t.progress+': '+result.correct+'/'+result.total+' · '+t.missing+': '+(result.total-result.answered)+' · '+t.try+': '+checks+'. '+(result.correct===result.total?t.completed:t.again)+'</p>':'');
}
function office(exercise,l,state){
 const t=T[l];
 const cards=exercise.products.map(p=>{
  const saved=state.office[p.id]||{},q=saved.quantity??p.quantity,price=saved.price??p.price,kind=saved.classification||"";
  const subtotal=number(q)!==null&&number(price)!==null?money(number(q)*number(price)):"—";
  const status=state.checked?(kind===p.classification?"✓":"✗"):"";
  return '<div class="stock-office-product" data-stock-office-row="'+p.id+'"><header><strong>'+p.id+'. '+esc(p.name[l])+'</strong><span class="stock-line-amount" data-stock-line-total="'+p.id+'">'+esc(subtotal)+'</span></header><small>'+t.model+': '+esc(p.model[l])+' · '+t.supplier+': '+esc(p.supplier[l])+'</small><div class="stock-office-fields"><label>'+t.kind+'<select data-stock-office-kind="'+p.id+'"><option value="">—</option><option value="F"'+(kind==="F"?' selected':'')+'>'+t.f+' (F)</option><option value="NF"'+(kind==="NF"?' selected':'')+'>'+t.nf+' (NF)</option></select></label><label>'+t.quantity+'<input type="number" min="0" step="1" data-stock-office-quantity="'+p.id+'" value="'+esc(q)+'"></label><label>'+t.price+' (€)<input type="text" inputmode="decimal" data-stock-office-price="'+p.id+'" value="'+esc(price)+'"></label></div>'+(status?'<small class="'+(kind===p.classification?'stock-correct':'stock-wrong')+'">'+status+'</small>':'')+'</div>';
 }).join("");
 const ok=exercise.products.filter(p=>state.office[p.id]?.classification===p.classification).length;
 return '<header class="stock-head"><button type="button" class="back-button" data-stock-back>'+t.back+'</button><h2>'+esc(exercise.id+' · '+exercise.title[l])+'</h2><p class="stock-source">'+t.source+': '+esc(exercise.source.file)+' · Oficina!A5:I25</p></header><section class="stock-reference"><h3>'+t.reference+'</h3><p>'+esc(exercise.reference[l])+'</p><p><strong>'+t.officeNote+'</strong></p>'+(l==="es"?'<small>'+t.siteTranslation+'</small>':'')+'</section><div class="stock-office-grid">'+cards+'</div><div class="stock-office-final"><strong>'+t.total+': <output data-stock-office-total>'+money(officeTotal(exercise,state))+'</output></strong><button type="button" class="primary" data-stock-office-check>'+t.officeCheck+'</button><button type="button" data-stock-reset>'+t.reset+'</button>'+(state.checked?'<p role="status">'+t.officeScore+': '+ok+'/21. '+(ok===21?t.completed:t.incomplete)+'</p>':'')+'</div>';
}
export function renderStockExercisesHtml(bank,language="ca",state=createStockExerciseState()){
 validateStockExercisesData(bank);
 const l=language==="es"?"es":"ca";
 const exercise=bank.exercises.find(e=>e.id===state.selected);
 return '<section class="stock-practice" aria-label="'+T[l].title+'">'+(exercise?(exercise.type==="office"?office(exercise,l,state):guided(exercise,l,state)):landing(bank,l,state))+'</section>';
}
export function bindStockExercises({root,bank,language="ca",state,rerender}){
 const exercise=bank.exercises.find(e=>e.id===state.selected);
 root.querySelectorAll('[data-stock-exercise]').forEach(b=>b.addEventListener('click',()=>{state.selected=b.dataset.stockExercise;state.checked=false;persist(state);rerender();root.querySelector('.stock-head')?.scrollIntoView({block:'start'});}));
 root.querySelector('[data-stock-back]')?.addEventListener('click',()=>{state.selected="";state.checked=false;persist(state);rerender();root.querySelector('.stock-head')?.scrollIntoView({block:'start'});});
 if(!exercise)return;
 root.querySelector('[data-stock-reset]')?.addEventListener('click',()=>{
  if(exercise.type==="office")state.office={};
  else{delete state.answers[exercise.id];delete state.attempts[exercise.id];}
  state.checked=false;persist(state);rerender();
 });
 if(exercise.type==="office"){
  const update=()=>{
   for(const p of exercise.products){
    const row=state.office[p.id]||{};
    const qty=root.querySelector('[data-stock-office-quantity="'+p.id+'"]');
    const price=root.querySelector('[data-stock-office-price="'+p.id+'"]');
    row.quantity=qty?.value??p.quantity;row.price=price?.value??p.price;
    row.classification=root.querySelector('[data-stock-office-kind="'+p.id+'"]')?.value||"";
    state.office[p.id]=row;
    const subtotal=number(row.quantity)!==null&&number(row.price)!==null?money(number(row.quantity)*number(row.price)):"—";
    const out=root.querySelector('[data-stock-line-total="'+p.id+'"]');if(out)out.textContent=subtotal;
   }
   root.querySelector('[data-stock-office-total]').textContent=money(officeTotal(exercise,state));
   persist(state);
  };
  root.querySelectorAll('[data-stock-office-kind],[data-stock-office-quantity],[data-stock-office-price]').forEach(input=>input.addEventListener('input',update));
  root.querySelector('[data-stock-office-check]')?.addEventListener('click',()=>{update();state.checked=true;rerender();});
  return;
 }
 const inputs=root.querySelectorAll('[data-stock-answer]');
 let active=null,calcResult=null;
 inputs.forEach(input=>{
  input.addEventListener('focus',()=>{if(input.matches('input'))active=input.dataset.stockAnswer;});
  input.addEventListener('change',()=>{(state.answers[exercise.id]??={})[input.dataset.stockAnswer]=input.value;state.checked=false;persist(state);});
  input.addEventListener('input',()=>{(state.answers[exercise.id]??={})[input.dataset.stockAnswer]=input.value;state.checked=false;persist(state);});
 });
 root.querySelector('[data-stock-guided-form]')?.addEventListener('submit',event=>{
  event.preventDefault();
  inputs.forEach(input=>(state.answers[exercise.id]??={})[input.dataset.stockAnswer]=input.value);
  state.attempts[exercise.id]=(state.attempts[exercise.id]||0)+1;state.checked=true;persist(state);rerender();
 });
 root.querySelector('[data-stock-calc-equals]')?.addEventListener('click',()=>{
  const a=number(root.querySelector('[data-stock-calc-a]').value),b=number(root.querySelector('[data-stock-calc-b]').value),op=root.querySelector('[data-stock-calc-op]').value;
  const result=a===null||b===null?NaN:op==="+"?a+b:op==="-"?a-b:op==="*"?a*b:b===0?NaN:a/b;
  calcResult=Number.isFinite(result)?Math.round(result*1000000)/1000000:null;
  root.querySelector('[data-stock-calc-result]').textContent=T[language==="es"?"es":"ca"].result+': '+(calcResult===null?"—":new Intl.NumberFormat("es-ES",{maximumFractionDigits:6}).format(calcResult));
  root.querySelector('[data-stock-calc-use]').disabled=calcResult===null;
 });
 root.querySelector('[data-stock-calc-use]')?.addEventListener('click',()=>{
  if(active===null||calcResult===null)return;
  const input=root.querySelector('[data-stock-answer="'+active+'"]');
  if(input?.matches('input')){input.value=String(calcResult).replace(".",",");input.dispatchEvent(new Event("input",{bubbles:true}));input.focus();}
 });
}
