const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

const COPY={
  ca:{
    eyebrow:"UF0519 · Unitat 2",
    source:"Font del cas",
    step:"Incidència",
    of:"de",
    check:"Comprovar resposta",
    next:"Següent incidència",
    restart:"Tornar a començar",
    correct:"Correcte.",
    wrong:"Encara no és correcte.",
    hint:"Pista",
    solution:"Explicació",
    firstTry:"encerts al primer intent",
    finished:"Circuit de tresoreria completat",
    finishText:"Has resolt totes les incidències del circuit.",
    page:"p.",
    choose:"Selecciona una opció abans de comprovar.",
    memory:"Recordatori final",
    memoryText:"Identifica primer el moment del pagament, després el mitjà o document i, finalment, comprova les dades i limitacions específiques."
  },
  es:{
    eyebrow:"UF0519 · Unidad 2",
    source:"Fuente del caso",
    step:"Incidencia",
    of:"de",
    check:"Comprobar respuesta",
    next:"Siguiente incidencia",
    restart:"Volver a empezar",
    correct:"Correcto.",
    wrong:"Todavía no es correcto.",
    hint:"Pista",
    solution:"Explicación",
    firstTry:"aciertos al primer intento",
    finished:"Circuito de tesorería completado",
    finishText:"Has resuelto todas las incidencias del circuito.",
    page:"p.",
    choose:"Selecciona una opción antes de comprobar.",
    memory:"Recordatorio final",
    memoryText:"Identifica primero el momento del pago, después el medio o documento y, por último, comprueba los datos y limitaciones específicas."
  }
};

export function validateTreasuryPracticeData(bank){
  if(!bank||bank.version!==1||bank.source?.sourceId!=="UF0519_U2_TRESORERIA"||bank.source?.filename!=="2. Gestió_bàsica_tresoreria.pdf"||bank.source?.pages!==41){
    throw new Error("Treasury practice data: invalid source");
  }
  if(!bank.title?.ca||!bank.title?.es||!bank.intro?.ca||!bank.intro?.es||!Array.isArray(bank.steps)||bank.steps.length!==10){
    throw new Error("Treasury practice data: invalid structure");
  }
  const ids=new Set();
  for(const step of bank.steps){
    if(!step?.id||ids.has(step.id)||!Number.isInteger(step.page)||step.page<1||step.page>41)throw new Error("Treasury practice data: invalid step");
    ids.add(step.id);
    if(!step.title?.ca||!step.title?.es||!step.scenario?.ca||!step.scenario?.es||!step.question?.ca||!step.question?.es||!step.hint?.ca||!step.hint?.es||!step.explanation?.ca||!step.explanation?.es){
      throw new Error("Treasury practice data: incomplete bilingual step");
    }
    if(!Array.isArray(step.options?.ca)||!Array.isArray(step.options?.es)||step.options.ca.length!==4||step.options.es.length!==4||!Number.isInteger(step.correct)||step.correct<0||step.correct>3){
      throw new Error("Treasury practice data: invalid options");
    }
  }
  return bank;
}

export async function loadTreasuryPractice(fetcher=fetch){
  const r=await fetcher("data/treasury-practice-v1.json");
  if(!r.ok)throw new Error("No s’ha pogut carregar la pràctica de tresoreria.");
  return validateTreasuryPracticeData(await r.json());
}

export function createTreasuryPracticeState(){
  return {index:0,selected:null,attempts:{},firstTry:[],feedback:null,solved:[]};
}

function optionHtml(step,l,state,index){
  const checked=state.selected===index;
  return `<label class="treasury-option ${checked?"treasury-option-selected":""}">
    <input type="radio" name="treasury-answer" value="${index}" ${checked?"checked":""}>
    <span>${esc(step.options[l][index])}</span>
  </label>`;
}

export function renderTreasuryPracticeHtml(bank,language="ca",state=createTreasuryPracticeState()){
  validateTreasuryPracticeData(bank);
  const l=language==="es"?"es":"ca",t=COPY[l],safe=state||createTreasuryPracticeState();

  if(safe.index>=bank.steps.length){
    return `<section class="treasury-practice">
      <header class="payroll-head">
        <p class="eyebrow">${t.eyebrow}</p>
        <h2>${t.finished}</h2>
        <p>${t.finishText}</p>
        <p class="practical-source"><strong>${t.source}:</strong> ${esc(bank.source.filename)} · ${bank.source.pages} ${l==="ca"?"pàgines":"páginas"}</p>
      </header>
      <section class="practice-finish">
        <h3>${safe.firstTry.length}/${bank.steps.length} ${t.firstTry}</h3>
        <ul>${bank.steps.map(step=>`<li><span>${esc(step.title[l])}</span><strong>${t.page} ${step.page}</strong></li>`).join("")}</ul>
        <button class="primary" type="button" data-treasury-restart>${t.restart}</button>
      </section>
      <section class="payroll-memory"><h3>${t.memory}</h3><p>${t.memoryText}</p></section>
    </section>`;
  }

  const step=bank.steps[safe.index],attempts=safe.attempts[step.id]||0;
  const feedback=safe.feedback?.type==="empty"
    ?`<p class="practice-feedback practice-feedback-wrong" role="status">${t.choose}</p>`
    :safe.feedback?.type==="wrong"
      ?`<div class="practice-feedback practice-feedback-wrong" role="status"><strong>${t.wrong}</strong><p><b>${t.hint}:</b> ${esc(step.hint[l])}</p>${attempts>=2?`<p><b>${t.solution}:</b> ${esc(step.explanation[l])}</p>`:""}</div>`
      :safe.feedback?.type==="correct"
        ?`<div class="practice-feedback practice-feedback-correct" role="status"><strong>${t.correct}</strong><p>${esc(step.explanation[l])}</p></div>`
        :"";

  return `<section class="treasury-practice">
    <header class="payroll-head">
      <p class="eyebrow">${t.eyebrow}</p>
      <h2>${esc(bank.title[l])}</h2>
      <p>${esc(bank.intro[l])}</p>
      <p class="practical-source"><strong>${t.source}:</strong> ${esc(bank.source.filename)} · ${t.page} ${step.page}</p>
    </header>
    <section class="practice-work">
      <div class="practice-progress">
        <div><strong>${t.step} ${safe.index+1} ${t.of} ${bank.steps.length}</strong><span>${esc(step.title[l])}</span></div>
        <progress value="${safe.index}" max="${bank.steps.length}"></progress>
      </div>
      <article class="treasury-case">
        <p class="treasury-scenario">${esc(step.scenario[l])}</p>
        <h3>${esc(step.question[l])}</h3>
        <form data-treasury-form>
          <div class="treasury-options">${step.options[l].map((_,i)=>optionHtml(step,l,safe,i)).join("")}</div>
          ${feedback}
          <div class="practice-actions">
            ${safe.feedback?.type==="correct"?`<button class="primary" type="button" data-treasury-next>${t.next}</button>`:`<button class="primary" type="submit">${t.check}</button>`}
            <button class="text-button" type="button" data-treasury-restart>${t.restart}</button>
          </div>
        </form>
      </article>
    </section>
  </section>`;
}

export function bindTreasuryPractice({root,bank,language="ca",state,rerender}){
  const l=language==="es"?"es":"ca";
  validateTreasuryPracticeData(bank);
  const current=()=>bank.steps[state.index];

  for(const input of root.querySelectorAll('input[name="treasury-answer"]')){
    input.addEventListener("change",()=>{
      state.selected=Number(input.value);
      if(state.feedback?.type!=="correct")state.feedback=null;
    });
  }

  root.querySelector("[data-treasury-form]")?.addEventListener("submit",event=>{
    event.preventDefault();
    const step=current();
    if(!step)return;
    if(!Number.isInteger(state.selected)){state.feedback={type:"empty"};rerender();return;}
    if(state.selected===step.correct){
      if((state.attempts[step.id]||0)===0&&!state.firstTry.includes(step.id))state.firstTry.push(step.id);
      if(!state.solved.includes(step.id))state.solved.push(step.id);
      state.feedback={type:"correct"};
      rerender();
      return;
    }
    state.attempts[step.id]=(state.attempts[step.id]||0)+1;
    state.feedback={type:"wrong"};
    rerender();
  });

  root.querySelector("[data-treasury-next]")?.addEventListener("click",()=>{
    const step=current();
    if(!step||state.feedback?.type!=="correct")return;
    state.index+=1;state.selected=null;state.feedback=null;rerender();
  });

  root.querySelector("[data-treasury-restart]")?.addEventListener("click",()=>{
    const fresh=createTreasuryPracticeState();
    Object.keys(state).forEach(k=>delete state[k]);
    Object.assign(state,fresh);
    rerender();
  });

  return l;
}
