const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LABELS={
 ca:{kind:'Informació',dialog:'Comunicació',reason:'Justifica breument la resposta',placeholder:'Quin fet del cas justifica la classificació?',check:'Comprovar les cinc situacions',restart:'Tornar a començar',incomplete:'Classifica i justifica els cinc casos abans de comprovar.',result:'Classificacions correctes',of:'de',correct:'Classificació correcta',incorrect:'Revisa la classificació',teacher:'Solució raonada del material',reasonNote:'La justificació escrita és una autoavaluació: compara-la amb la solució, ja que no es corregeix automàticament.',sourceNote:'Font: dos documents de classe (exercici i versió resolta), pàgina 1.',sourceKind:'Criteri didàctic',source:'Material original de classe'},
 es:{kind:'Información',dialog:'Comunicación',reason:'Justifica brevemente la respuesta',placeholder:'¿Qué hecho del caso justifica la clasificación?',check:'Comprobar las cinco situaciones',restart:'Volver a empezar',incomplete:'Clasifica y justifica los cinco casos antes de comprobar.',result:'Clasificaciones correctas',of:'de',correct:'Clasificación correcta',incorrect:'Revisa la clasificación',teacher:'Solución razonada del material',reasonNote:'La justificación escrita es una autoevaluación: compárala con la solución, ya que no se corrige automáticamente.',sourceNote:'Fuente: dos documentos de clase (ejercicio y versión resuelta), página 1.',sourceKind:'Criterio didáctico',source:'Material original de clase'}
};
export function validateCommunicationPracticeData(data){
 if(data?.version!==1||data.blockId!=='uf0520-unitat-1-bloc-1'||!Array.isArray(data.cases)||data.cases.length!==5)throw Error('UF0520: invalid practice data');
 if(data.source?.original?.sha256!=='e77aa9eb80254ad96e691bdc159afcee96bdb7f2d5f72ae70f5c84011c24d537'||data.source?.resolved?.sha256!=='464a12f4a36294f6ccf0907acfd9a23be2f48c5d9c621d85ab3bdd3534c25d9d')throw Error('UF0520: source mismatch');
 const expected=['informacio','comunicacio','informacio','comunicacio','informacio'];
 for(let i=0;i<5;i++){
  const c=data.cases[i];
  if(c.id!==String(i+1).padStart(2,'0')||c.answer!==expected[i])throw Error('UF0520: case answer mismatch');
  for(const lang of ['ca','es'])if(!c.scenario?.[lang]||!c.explanation?.[lang])throw Error('UF0520: incomplete translation');
 }
 return data;
}
export async function loadCommunicationPractice(fetcher=fetch){
 const r=await fetcher('data/uf0520-comunicacio-vs-informacio-practice-v1.json');
 if(!r.ok)throw Error('UF0520: cannot load classroom exercise');
 return validateCommunicationPracticeData(await r.json());
}
export function createCommunicationPracticeState(){return {answers:{},reasons:{},checked:false,incomplete:false};}
export function checkCommunicationPractice(data,state){
 validateCommunicationPracticeData(data);
 const complete=data.cases.every(c=>['informacio','comunicacio'].includes(state.answers[c.id])&&String(state.reasons[c.id]||'').trim().length>0);
 return {complete,correct:complete?data.cases.filter(c=>state.answers[c.id]===c.answer).length:null,total:5};
}
export function renderCommunicationPracticeHtml(data,language='ca',state=createCommunicationPracticeState()){
 validateCommunicationPracticeData(data);
 const l=language==='es'?'es':'ca',t=LABELS[l],grade=checkCommunicationPractice(data,state);
 const cases=data.cases.map((c,i)=>{
  const chosen=state.answers[c.id]||'',key='communication-case-'+c.id;
  const choices=[['informacio',t.kind],['comunicacio',t.dialog]].map(([value,label])=>'<label class="comm-practice-choice"><input type="radio" name="'+key+'" value="'+value+'" data-comm-choice="'+c.id+'" '+(chosen===value?'checked':'')+'><span>'+label+'</span></label>').join('');
  const feedback=state.checked&&grade.complete?'<div class="comm-practice-feedback" data-comm-feedback="'+c.id+'"><p class="'+(chosen===c.answer?'stock-correct':'stock-wrong')+'"><strong>'+(chosen===c.answer?t.correct:t.incorrect)+'.</strong> '+esc(c.answer==='informacio'?t.kind:t.dialog)+'.</p><p><strong>'+t.teacher+':</strong> '+esc(c.explanation[l])+'</p></div>':'';
  return '<fieldset class="comm-practice-case" data-comm-case="'+c.id+'"><legend>'+(i+1)+'. '+esc(c.scenario[l])+'</legend><div class="comm-practice-choices">'+choices+'</div><label class="comm-practice-reason" for="comm-reason-'+c.id+'">'+t.reason+'</label><textarea id="comm-reason-'+c.id+'" data-comm-reason="'+c.id+'" rows="2" placeholder="'+esc(t.placeholder)+'">'+esc(state.reasons[c.id]||'')+'</textarea>'+feedback+'</fieldset>';
 }).join('');
 const summary=state.checked&&grade.complete?'<div class="comm-practice-summary" role="status" data-comm-score><strong>'+t.result+': '+grade.correct+' '+t.of+' '+grade.total+'.</strong><p>'+t.reasonNote+'</p></div>':state.incomplete?'<p class="stock-wrong" role="status" data-comm-incomplete>'+t.incomplete+'</p>':'';
 return '<section class="stock-practice comm-practice" data-communication-practice><header class="stock-head"><p class="eyebrow">UF0520 · '+t.source+'</p><h2>'+esc(data.title[l])+'</h2><p>'+esc(data.instruction[l])+'</p></header><p class="comm-practice-criterion"><strong>'+t.sourceKind+':</strong> '+esc(data.classificationNote[l])+'</p><form data-comm-form>'+cases+'<div class="stock-actions"><button type="submit" class="primary">'+t.check+'</button><button type="button" data-comm-reset>'+t.restart+'</button></div>'+summary+'</form><p class="stock-reference">'+t.sourceNote+'</p></section>';
}
export function bindCommunicationPractice({root,data,state,rerender}){
 const invalidate=()=>{state.checked=false;state.incomplete=false;root.querySelectorAll('[data-comm-feedback],[data-comm-score],[data-comm-incomplete]').forEach(el=>el.remove());};
 root.querySelectorAll('[data-comm-choice]').forEach(el=>el.addEventListener('change',()=>{state.answers[el.dataset.commChoice]=el.value;invalidate();}));
 root.querySelectorAll('[data-comm-reason]').forEach(el=>el.addEventListener('input',()=>{state.reasons[el.dataset.commReason]=el.value;invalidate();}));
 root.querySelector('[data-comm-form]')?.addEventListener('submit',event=>{
  event.preventDefault();const result=checkCommunicationPractice(data,state);
  state.checked=result.complete;state.incomplete=!result.complete;rerender();
  if(result.complete)root.querySelector('[data-comm-score]')?.scrollIntoView?.({block:'nearest'});
 });
 root.querySelector('[data-comm-reset]')?.addEventListener('click',()=>{Object.assign(state,createCommunicationPracticeState());rerender();});
}
