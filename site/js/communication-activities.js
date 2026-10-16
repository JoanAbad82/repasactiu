const escapeText=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const T={
 ca:{title:'Activitats 1.1.1',intro:'Resol els quatre apartats de comunicació professional. Escriu les teves respostes i compara-les després amb el solucionari de classe.',section:'Apartat',questions:'qüestions',source:'Material de classe, UF0520, apartat 1.1',response:'La teva resposta',placeholder:'Escriu la resposta amb les dades del cas...',check:'Comparar amb el solucionari',reset:'Reiniciar aquest apartat',missing:'Respon totes les qüestions d’aquest apartat abans de veure les solucions.',solution:'Resposta del document resolt',self:'Les respostes obertes no reben puntuació automàtica. Compara-les amb les del document resolt i comprova que coincideixen les dades i el raonament.',done:'Qüestions respostes',original:'Original en castellà; traducció didàctica al català',prev:'Exercici pràctic'},
 es:{title:'Actividades 1.1.1',intro:'Resuelve los cuatro apartados de comunicación profesional. Escribe tus respuestas y compáralas después con el solucionario de clase.',section:'Apartado',questions:'preguntas',source:'Material de clase, UF0520, apartado 1.1',response:'Tu respuesta',placeholder:'Escribe la respuesta usando los datos del caso...',check:'Comparar con el solucionario',reset:'Reiniciar este apartado',missing:'Responde todas las preguntas de este apartado antes de ver las soluciones.',solution:'Respuesta del documento resuelto',self:'Las respuestas abiertas no reciben puntuación automática. Compáralas con el documento resuelto y comprueba los datos y el razonamiento.',done:'Preguntas respondidas',original:'Texto original en castellano',prev:'Ejercicio práctico'}
};
export function validateCommunicationActivitiesData(data){
 if(data?.version!==1||data.blockId!=='uf0520-unitat-1-bloc-1'||data.sections?.length!==4)throw Error('UF0520 1.1.1 invalid dataset');
 if(data.source?.original?.sha256!=='f00b729ee09447409951c0f23ae162739fd6da11eb1e8f4d4283d9853dd373d7'||data.source?.resolved?.sha256!=='17b43b7225c009a370c6dec5f672578fbd381295bfdc210eb5655993fb9afcd2')throw Error('UF0520 1.1.1 source provenance mismatch');
 const seen=new Set();
 for(let n=1;n<=4;n++){
  const section=data.sections[n-1];
  if(section.id!==String(n)||section.page!==n||section.items.length!==[4,7,8,8][n-1])throw Error('UF0520 1.1.1 section mismatch');
  for(let i=0;i<section.items.length;i++){
   const item=section.items[i],expected=n+'.'+(i+1);
   if(item.id!==expected||seen.has(item.id))throw Error('UF0520 1.1.1 id mismatch');
   seen.add(item.id);
   for(const lang of ['ca','es']){
    if(!item.prompt?.[lang]?.trim()||!item.solution?.[lang]?.trim()||!section.title?.[lang]?.trim()||!section.objective?.[lang]?.trim())throw Error('UF0520 1.1.1 missing text '+expected+' '+lang);
   }
  }
 }
 if(seen.size!==27)throw Error('UF0520 1.1.1 incomplete coverage');
 return data;
}
export async function loadCommunicationActivities(fetcher=fetch){
 const response=await fetcher('data/uf0520-activities-111-practice-v1.json');
 if(!response.ok)throw Error('UF0520 1.1.1 load failed');
 return validateCommunicationActivitiesData(await response.json());
}
export function createCommunicationActivitiesState(){return {section:'1',answers:{},revealed:{},incomplete:false};}
export function activityProgress(section,state){
 const filled=section.items.filter(item=>String(state.answers[item.id]??'').trim().length>0).length;
 return {filled,total:section.items.length,complete:filled===section.items.length};
}
export function renderCommunicationActivitiesHtml(data,language='ca',state=createCommunicationActivitiesState()){
 validateCommunicationActivitiesData(data);
 const l=language==='es'?'es':'ca',t=T[l],section=data.sections.find(s=>s.id===state.section)||data.sections[0];
 const nav=data.sections.map(s=>'<button type="button" data-activity-section="'+s.id+'" aria-pressed="'+String(section.id===s.id)+'">'+s.id+'. '+escapeText(s.title[l])+'</button>').join('');
 const progress=activityProgress(section,state);
 const items=section.items.map(item=>{
  const id=escapeText(item.id),answer=escapeText(state.answers[item.id]||'');
  const resolved=state.revealed[section.id]&&progress.complete?'<div class="comm-activities-solution" data-activity-solution="'+id+'"><strong>'+t.solution+':</strong><p>'+escapeText(item.solution[l])+'</p></div>':'';
  return '<div class="comm-practice-case comm-activities-item" data-activity-item="'+id+'"><label for="activity-answer-'+id+'"><strong>'+id+' '+escapeText(item.prompt[l])+'</strong></label><span class="comm-practice-reason">'+t.response+'</span><textarea id="activity-answer-'+id+'" data-activity-answer="'+id+'" rows="3" placeholder="'+escapeText(t.placeholder)+'">'+answer+'</textarea>'+resolved+'</div>';
 }).join('');
 return '<section class="stock-practice comm-activities" data-communication-activities><header class="stock-head"><p class="eyebrow">UF0520 · '+escapeText(t.source)+'</p><h2>'+t.title+'</h2><p>'+t.intro+'</p></header><nav class="new-class-subtabs" aria-label="'+t.section+'">'+nav+'</nav><div class="comm-activities-head"><h3>'+section.id+'. '+escapeText(section.title[l])+'</h3><p>'+escapeText(section.objective[l])+'</p>'+(section.intro?'<p>'+escapeText(section.intro[l])+'</p>':'')+(section.context?'<blockquote class="comm-activities-context">'+escapeText(section.context[l])+'</blockquote>':'')+'</div><form data-activity-form>'+items+'<p data-activity-progress>'+t.done+': '+progress.filled+' / '+progress.total+'</p><div class="stock-actions"><button type="submit" class="primary">'+t.check+'</button><button type="button" data-activity-reset>'+t.reset+'</button></div>'+(state.incomplete?'<p role="status" data-activity-incomplete class="stock-wrong">'+t.missing+'</p>':'')+(state.revealed[section.id]&&progress.complete?'<p class="comm-activities-note" data-activity-self>'+t.self+'</p>':'')+'</form><p class="stock-reference">'+t.original+' · '+(l==='es'?'Página ':'Pàgina ')+section.page+' / 4.</p></section>';
}
export function bindCommunicationActivities({root,data,state,language='ca',rerender}){
 root.querySelectorAll('[data-activity-section]').forEach(btn=>btn.addEventListener('click',()=>{state.section=btn.dataset.activitySection;state.incomplete=false;rerender();}));
 root.querySelectorAll('[data-activity-answer]').forEach(el=>el.addEventListener('input',()=>{
  state.answers[el.dataset.activityAnswer]=el.value;
  const section=data.sections.find(s=>s.id===state.section);
  state.revealed[section.id]=false;state.incomplete=false;
  root.querySelectorAll('[data-activity-solution],[data-activity-self],[data-activity-incomplete]').forEach(x=>x.remove());
  const progress=root.querySelector('[data-activity-progress]'),p=activityProgress(section,state);
  if(progress)progress.textContent=(language==='es'?T.es.done:T.ca.done)+': '+p.filled+' / '+p.total;
 }));
 root.querySelector('[data-activity-form]')?.addEventListener('submit',e=>{
  e.preventDefault();const sec=data.sections.find(s=>s.id===state.section),p=activityProgress(sec,state);
  state.incomplete=!p.complete;state.revealed[sec.id]=p.complete;rerender();
 });
 root.querySelector('[data-activity-reset]')?.addEventListener('click',()=>{
  for(const item of data.sections.find(s=>s.id===state.section).items)delete state.answers[item.id];
  delete state.revealed[state.section];state.incomplete=false;rerender();
 });
}
