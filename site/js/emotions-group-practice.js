const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const LANG={
 ca:{case:'Situació',method:'Com treballareu · 1–2–4–Tothom',group:'Integrants del grup (opcional)',question:'Proposta d’actuació del grup',reflection:'Reflexió final per a la posada en comú',answer:'La teva proposta',placeholder:'Escriu una resposta concreta basada en els fets del cas...',check:'Comparar amb la proposta resolta',restart:'Reiniciar la dinàmica',missing:'Escriu les cinc propostes i la reflexió final abans de consultar la resolució.',example:'Proposta orientativa del document resolt',note:'Aquesta activitat no té nota. Les respostes obertes no es corregeixen automàticament: compara les teves propostes amb el model i comenta les diferències amb el grup.',source:'Fonts de classe: cas i dinàmica a la pàgina 1, resolució i reflexió a les pàgines 1–2. Text original en català.'},
 es:{case:'Situación',method:'Cómo trabajaréis · 1–2–4–Todos',group:'Integrantes del grupo (opcional)',question:'Propuesta de actuación del grupo',reflection:'Reflexión final para la puesta en común',answer:'Tu propuesta',placeholder:'Escribe una respuesta concreta basada en los hechos del caso...',check:'Comparar con la propuesta resuelta',restart:'Reiniciar la dinámica',missing:'Escribe las cinco propuestas y la reflexión final antes de consultar la resolución.',example:'Propuesta orientativa del documento resuelto',note:'Esta actividad no tiene nota. Las respuestas abiertas no se corrigen automáticamente: compara tus propuestas con el modelo y comentad las diferencias en grupo.',source:'Fuentes de clase: caso y dinámica en página 1, solución y reflexión en páginas 1–2. Original en catalán; traducción didáctica al castellano.'}
};
export function validateEmotionsGroupData(data){
 if(data?.version!==1||data.blockId!=='uf0520-unitat-1-bloc-1'||data.graded!==false||data.prompts?.length!==6||data.stages?.length!==3)throw Error('UF0520 emotions invalid structure');
 if(data.source?.original?.sha256!=='b777b6e7618517ee817f5f5ae671f67676a2f04b826bdda0502110de2cbdd71c'||data.source?.resolved?.sha256!=='ba98eadd6ed5f4b298b552324737d5d2b46b422e6518a23d1a55510db8ebc212')throw Error('UF0520 emotions source mismatch');
 if(data.prompts.map(q=>q.id).join(',')!=='1,2,3,4,5,reflection')throw Error('UF0520 emotions incomplete questions');
 for(const lang of ['ca','es']){
  if(data.scenario.length!==4||data.scenario.some(x=>!x[lang]?.trim()))throw Error('UF0520 emotions case missing');
  for(const x of [...data.stages,...data.prompts])if(!(x.label?.[lang]||x.prompt?.[lang])||!(x.description?.[lang]||x.solution?.[lang]))throw Error('UF0520 emotions translation missing');
 }
 return data;
}
export async function loadEmotionsGroupData(fetcher=fetch){
 const response=await fetcher('data/uf0520-emotions-group-practice-v1.json');
 if(!response.ok)throw Error('UF0520 emotions request failed');
 return validateEmotionsGroupData(await response.json());
}
export function createEmotionsGroupState(){return {members:'',answers:{},revealed:false,incomplete:false};}
export function emotionsGroupProgress(data,state){
 const filled=data.prompts.filter(q=>String(state.answers[q.id]||'').trim().length>0).length;
 return {filled,total:6,complete:filled===6};
}
export function renderEmotionsGroupHtml(data,language='ca',state=createEmotionsGroupState()){
 validateEmotionsGroupData(data);const lang=language==='es'?'es':'ca',t=LANG[lang],progress=emotionsGroupProgress(data,state);
 const steps=data.stages.map(s=>'<li><strong>'+escapeHtml(s.label[lang])+'</strong> — '+escapeHtml(s.description[lang])+'</li>').join('');
 const scenario=data.scenario.map(p=>'<p>'+escapeHtml(p[lang])+'</p>').join('');
 const items=data.prompts.map(q=>{
  const k=escapeHtml(q.id),special=q.id==='reflection';
  const solution=state.revealed&&progress.complete?'<div data-emotion-solution="'+k+'" class="comm-activities-solution"><strong>'+escapeHtml(t.example)+':</strong><p>'+escapeHtml(q.solution[lang])+'</p></div>':'';
  return '<div class="comm-practice-case comm-activities-item" data-emotion-item="'+k+'"><label for="emotions-'+k+'"><strong>'+(special?escapeHtml(t.reflection):k+'. '+escapeHtml(q.prompt[lang]))+'</strong></label>'+(special?'<p>'+escapeHtml(q.prompt[lang])+'</p>':'')+'<span class="comm-practice-reason">'+t.answer+'</span><textarea data-emotion-answer="'+k+'" id="emotions-'+k+'" rows="4" placeholder="'+escapeHtml(t.placeholder)+'">'+escapeHtml(state.answers[q.id]||'')+'</textarea>'+solution+'</div>';
 }).join('');
 return '<section class="stock-practice comm-activities comm-emotions" data-emotions-practice><header class="stock-head"><p class="eyebrow">UF0520 · '+escapeHtml(data.subtitle[lang])+'</p><h2>'+escapeHtml(data.title[lang])+'</h2><p>'+escapeHtml(data.instruction[lang])+'</p></header><div class="comm-activities-head"><h3>'+t.method+'</h3><ol>'+steps+'</ol><h3>'+escapeHtml(data.caseTitle[lang])+'</h3><div class="comm-activities-context">'+scenario+'</div></div><form data-emotions-form><label for="emotion-members">'+t.group+'</label><input id="emotion-members" data-emotion-members type="text" value="'+escapeHtml(state.members)+'" autocomplete="off"><h3>'+t.question+'</h3>'+items+'<p data-emotion-progress>'+progress.filled+' / 6</p><div class="stock-actions"><button class="primary" type="submit">'+t.check+'</button><button type="button" data-emotion-reset>'+t.restart+'</button></div>'+(state.incomplete?'<p role="status" class="stock-wrong" data-emotion-incomplete>'+t.missing+'</p>':'')+(state.revealed&&progress.complete?'<p data-emotion-note class="comm-activities-note">'+t.note+'</p>':'')+'</form><p class="stock-reference">'+t.source+'</p></section>';
}
export function bindEmotionsGroup({root,data,state,rerender}){
 const invalidate=()=>{state.revealed=false;state.incomplete=false;root.querySelectorAll('[data-emotion-solution],[data-emotion-note],[data-emotion-incomplete]').forEach(x=>x.remove());};
 root.querySelector('[data-emotion-members]')?.addEventListener('input',e=>{state.members=e.target.value;});
 root.querySelectorAll('[data-emotion-answer]').forEach(el=>el.addEventListener('input',()=>{
  state.answers[el.dataset.emotionAnswer]=el.value;invalidate();
  const n=root.querySelector('[data-emotion-progress]');if(n)n.textContent=emotionsGroupProgress(data,state).filled+' / 6';
 }));
 root.querySelector('[data-emotions-form]')?.addEventListener('submit',e=>{e.preventDefault();const p=emotionsGroupProgress(data,state);state.revealed=p.complete;state.incomplete=!p.complete;rerender();});
 root.querySelector('[data-emotion-reset]')?.addEventListener('click',()=>{Object.assign(state,createEmotionsGroupState());rerender();});
}
