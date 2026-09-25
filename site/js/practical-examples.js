import {renderCommercialCorrespondenceHtml,validateCommercialCorrespondenceData} from "./commercial-correspondence.js";

const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=v=>Number(v).toFixed(2).replace(".",",").replace(/\B(?=(\d{3})+(?!\d))/g,".")+" €";
const pct=v=>new Intl.NumberFormat("es-ES",{minimumFractionDigits:2,maximumFractionDigits:2}).format(v)+" %";
const r2=v=>Math.round((v+Number.EPSILON)*100)/100;
const C={
 ca:{back:"← Tornar",title:"Exemples pràctics",intro:"Casos guiats per aplicar el temari pas a pas, amb traçabilitat al material de classe.",corr:"Correspondència i cartes comercials",pay:"Nòmines",case:"UF0519 · Cas pràctic",payTitle:"Nòmina: càlcul bàsic pas a pas",payIntro:"Supòsit simplificat de juliol de 2026: contracte indefinit, jornada completa, dues pagues extraordinàries prorratejades i sense hores extres ni complements variables.",source:"Font del cas",data:"1. Dades del supòsit",salary:"Salari base mensual",extras:"Pagues extraordinàries",contract:"Tipus de contracte",workday:"Jornada",irpf:"IRPF del supòsit",smi:"2. Comprovació amb l’SMI 2026",annual:"Retribució anual del cas",smiOk:"La retribució anual del cas supera l’SMI anual de 2026.",calc:"3. Càlcul pas a pas",steps:["Prorrata de pagues extraordinàries","Devengaments salarials del mes","Base de cotització","Cotitzacions de la persona treballadora","Retenció d’IRPF","Deduccions totals i líquid a percebre"],concept:"Concepte",rate:"Percentatge",operation:"Càlcul",amount:"Import",contrib:"Total cotitzacions treballador",deductions:"Total deduccions",net:"Líquid a percebre",important:"Important",memory:"Esquema per memoritzar",memoryText:"P-D-B-C-I-L: Prorrata → Devengaments → Base → Cotitzacions → IRPF → Líquid.",note:"Exemple didàctic: una nòmina real pot incloure altres conceptes que modifiquin la base i les deduccions."},
 es:{back:"← Volver",title:"Ejemplos prácticos",intro:"Casos guiados para aplicar el temario paso a paso, con trazabilidad al material de clase.",corr:"Correspondencia y cartas comerciales",pay:"Nóminas",case:"UF0519 · Caso práctico",payTitle:"Nómina: cálculo básico paso a paso",payIntro:"Supuesto simplificado de julio de 2026: contrato indefinido, jornada completa, dos pagas extraordinarias prorrateadas y sin horas extra ni complementos variables.",source:"Fuente del caso",data:"1. Datos del supuesto",salary:"Salario base mensual",extras:"Pagas extraordinarias",contract:"Tipo de contrato",workday:"Jornada",irpf:"IRPF del supuesto",smi:"2. Comprobación con el SMI 2026",annual:"Retribución anual del caso",smiOk:"La retribución anual del caso supera el SMI anual de 2026.",calc:"3. Cálculo paso a paso",steps:["Prorrata de pagas extraordinarias","Devengos salariales del mes","Base de cotización","Cotizaciones de la persona trabajadora","Retención de IRPF","Deducciones totales y líquido a percibir"],concept:"Concepto",rate:"Porcentaje",operation:"Cálculo",amount:"Importe",contrib:"Total cotizaciones trabajador",deductions:"Total deducciones",net:"Líquido a percibir",important:"Importante",memory:"Esquema para memorizar",memoryText:"P-D-B-C-I-L: Prorrata → Devengos → Base → Cotizaciones → IRPF → Líquido.",note:"Ejemplo didáctico: una nómina real puede incluir otros conceptos que modifiquen la base y las deducciones."}
};

export function validatePayrollExampleData(b){
 if(!b||b.version!==1||b.source?.sourceId!=="UF0519_NOMINA_2026_CECOT"||b.source?.pages!==3)throw new Error("Payroll example data: invalid source");
 const a=b.assumptions||{},c=b.calculations||{},s=b.smi2026||{};
 if(a.baseSalary!==1500||a.extraPays!==2||a.extraPayAmount!==1500||a.irpfRate!==8)throw new Error("Payroll example data: assumptions mismatch");
 if(r2(a.extraPayAmount*a.extraPays/12)!==c.proratedExtraMonthly||r2(a.baseSalary+c.proratedExtraMonthly)!==c.monthlyEarnings||r2(a.baseSalary*(12+a.extraPays))!==c.annualSalary)throw new Error("Payroll example data: earnings mismatch");
 if(c.contributionBase!==c.monthlyEarnings||r2(s.monthly14*14)!==s.annual||r2(s.annual/12)!==s.monthlyEquivalent12)throw new Error("Payroll example data: base/SMI mismatch");
 let total=0;for(const x of c.workerContributions||[]){if(r2(c.contributionBase*x.rate/100)!==x.amount)throw new Error("Payroll example data: contribution mismatch");total=r2(total+x.amount);}
 if(total!==c.workerContributionsTotal||r2(c.monthlyEarnings*a.irpfRate/100)!==c.irpfAmount||r2(c.workerContributionsTotal+c.irpfAmount)!==c.totalDeductions||r2(c.monthlyEarnings-c.totalDeductions)!==c.netPay)throw new Error("Payroll example data: totals mismatch");
 return b;
}
export async function loadPayrollExample(fetcher=fetch){const r=await fetcher("data/payroll-example-2026-v1.json");if(!r.ok)throw new Error("No s’ha pogut carregar l’exemple pràctic de nòmina.");return validatePayrollExampleData(await r.json());}


const P={
 ca:{
  resolved:"Veure exemple resolt",practice:"Practicar una nòmina",practiceTitle:"Practica aquesta nòmina",practiceIntro:"Calcula cada import en ordre. No es mostra la fórmula fins que la necessitis.",formatHelp:"Pots escriure, per exemple, 1496,24 · 1496.24 · 1.496,24 €.",step:"Pas",of:"de",check:"Comprovar",restart:"Reiniciar pràctica",hint:"Pista",solution:"Solució del pas",useSolution:"Usar el resultat i continuar",invalid:"Introdueix un import vàlid.",wrong:"Encara no és correcte.",correct:"Correcte. Continuem.",usedSolution:"Has continuat amb la solució d’aquest pas.",finished:"Nòmina completada",firstTry:"encerts al primer intent",completeResult:"Resultat complet",tryAgain:"Tornar a practicar",resolvedAfter:"Veure l’exemple resolt",
  fields:{prorata:"Prorrata mensual de pagues extres",devengos:"Devengaments totals",base:"Base de cotització",common:"Contingències comunes",unemployment:"Atur",training:"Formació professional",mei:"MEI",contribTotal:"Total cotitzacions",irpf:"IRPF",deductions:"Total deduccions",net:"Líquid a percebre"},
  hints:{prorata:"Calcula el total anual de les pagues extres i divideix-lo entre 12.",devengos:"Suma el salari base i la prorrata mensual.",base:"En aquest supòsit tots els devengaments salarials cotitzen.",contribution:"Aplica el percentatge corresponent sobre la base de cotització.",contribTotal:"Suma les quatre cotitzacions de la persona treballadora.",irpf:"Aplica el 8 % als devengaments del mes.",deductions:"Suma les cotitzacions totals i la retenció d’IRPF.",net:"Resta les deduccions totals als devengaments."}
 },
 es:{
  resolved:"Ver ejemplo resuelto",practice:"Practicar una nómina",practiceTitle:"Practica esta nómina",practiceIntro:"Calcula cada importe en orden. No se muestra la fórmula hasta que la necesites.",formatHelp:"Puedes escribir, por ejemplo, 1496,24 · 1496.24 · 1.496,24 €.",step:"Paso",of:"de",check:"Comprobar",restart:"Reiniciar práctica",hint:"Pista",solution:"Solución del paso",useSolution:"Usar el resultado y continuar",invalid:"Introduce un importe válido.",wrong:"Todavía no es correcto.",correct:"Correcto. Continuamos.",usedSolution:"Has continuado con la solución de este paso.",finished:"Nómina completada",firstTry:"aciertos al primer intento",completeResult:"Resultado completo",tryAgain:"Volver a practicar",resolvedAfter:"Ver el ejemplo resuelto",
  fields:{prorata:"Prorrata mensual de pagas extra",devengos:"Devengos totales",base:"Base de cotización",common:"Contingencias comunes",unemployment:"Desempleo",training:"Formación profesional",mei:"MEI",contribTotal:"Total cotizaciones",irpf:"IRPF",deductions:"Total deducciones",net:"Líquido a percibir"},
  hints:{prorata:"Calcula el total anual de las pagas extra y divídelo entre 12.",devengos:"Suma el salario base y la prorrata mensual.",base:"En este supuesto todos los devengos salariales cotizan.",contribution:"Aplica el porcentaje correspondiente sobre la base de cotización.",contribTotal:"Suma las cuatro cotizaciones de la persona trabajadora.",irpf:"Aplica el 8 % a los devengos del mes.",deductions:"Suma las cotizaciones totales y la retención de IRPF.",net:"Resta las deducciones totales a los devengos."}
 }
};

export function parsePayrollAmount(value){
 let raw=String(value??"").trim().replace(/[\s\u00A0€]/g,"").replace(/[^\d,.\-]/g,"");
 if(!raw||!/\d/.test(raw))return Number.NaN;
 const negative=raw.startsWith("-");
 raw=raw.replace(/-/g,"");
 const dots=(raw.match(/\./g)||[]).length,commas=(raw.match(/,/g)||[]).length;
 if(dots&&commas){
  const decimal=raw.lastIndexOf(".")>raw.lastIndexOf(",")?".":",";
  const thousands=decimal==="."?",":".";
  raw=raw.split(thousands).join("");
  const pos=raw.lastIndexOf(decimal);
  raw=raw.slice(0,pos).split(decimal).join("")+"."+raw.slice(pos+1);
 }else{
  const sep=dots?".":commas?",":null;
  if(sep){
   const parts=raw.split(sep);
   if(parts.length===2){
    const [whole,fraction]=parts;
    raw=fraction.length===3&&whole.length<=3?whole+fraction:whole+"."+fraction;
   }else{
    const last=parts.at(-1);
    raw=last.length>0&&last.length<=2?parts.slice(0,-1).join("")+"."+last:parts.join("");
   }
  }
 }
 const number=Number(raw);
 return negative?-number:number;
}
export function checkPayrollPracticeAnswer(value,expected){
 const parsed=parsePayrollAmount(value);
 return Number.isFinite(parsed)&&r2(parsed)===r2(expected);
}
export function createPayrollPracticeState(){
 return {index:0,attempts:{},completed:[],firstTry:[],feedback:null};
}

function payrollHtml(b,l,t){
 const a=b.assumptions,c=b.calculations,s=b.smi2026;
 const rows=c.workerContributions.map(x=>`<tr><td>${esc(x.label[l])}</td><td>${pct(x.rate)}</td><td>${money(c.contributionBase)} × ${pct(x.rate)}</td><td>${money(x.amount)}</td></tr>`).join("");
 return `<section class="payroll-example"><header class="payroll-head"><p class="eyebrow">${t.case}</p><h2>${t.payTitle}</h2><p>${t.payIntro}</p><p class="practical-source"><strong>${t.source}:</strong> ${l==="ca"?"Material de classe":"Material de clase"} CECOT · UF0519 · 3 ${l==="ca"?"pàgines":"páginas"}</p></header>
 <section class="payroll-section"><h3>${t.data}</h3><dl class="payroll-facts"><div><dt>${t.salary}</dt><dd>${money(a.baseSalary)}</dd></div><div><dt>${t.extras}</dt><dd>${a.extraPays} × ${money(a.extraPayAmount)} · ${l==="ca"?"prorratejades":"prorrateadas"}</dd></div><div><dt>${t.contract}</dt><dd>${esc(a.contract[l])}</dd></div><div><dt>${t.workday}</dt><dd>${esc(a.workday[l])}</dd></div><div><dt>${t.irpf}</dt><dd>${pct(a.irpfRate)}</dd></div></dl></section>
 <section class="payroll-section"><h3>${t.smi}</h3><p>${l==="ca"?"El material fixa l’SMI 2026 en 1.221,00 € mensuals en 14 pagues (17.094,00 € anuals). Amb les pagues prorratejades en 12 mesos, l’equivalent és 1.424,50 € mensuals.":"El material fija el SMI 2026 en 1.221,00 € mensuales en 14 pagas (17.094,00 € anuales). Con las pagas prorrateadas en 12 meses, el equivalente es 1.424,50 € mensuales."}</p><div class="formula-card"><span>${money(s.annual)} ÷ 12 = <strong>${money(s.monthlyEquivalent12)}</strong></span><span>${t.annual}: ${money(a.baseSalary)} × 14 = <strong>${money(c.annualSalary)}</strong></span></div><p class="payroll-conclusion">${t.smiOk}</p></section>
 <section class="payroll-section"><h3>${t.calc}</h3><ol class="payroll-steps">
 <li><div class="payroll-step-head"><span>1</span><h4>${t.steps[0]}</h4></div><p class="payroll-formula">(${money(a.baseSalary)} × ${a.extraPays}) ÷ 12 = <strong>${money(c.proratedExtraMonthly)}</strong></p></li>
 <li><div class="payroll-step-head"><span>2</span><h4>${t.steps[1]}</h4></div><p class="payroll-formula">${money(a.baseSalary)} + ${money(c.proratedExtraMonthly)} = <strong>${money(c.monthlyEarnings)}</strong></p></li>
 <li><div class="payroll-step-head"><span>3</span><h4>${t.steps[2]}</h4></div><p class="payroll-formula"><strong>${money(c.contributionBase)}</strong></p><p class="payroll-note">${esc(b.notes.contributionBase[l])}</p></li>
 <li><div class="payroll-step-head"><span>4</span><h4>${t.steps[3]}</h4></div><div class="payroll-table-wrap"><table class="payroll-table"><thead><tr><th>${t.concept}</th><th>${t.rate}</th><th>${t.operation}</th><th>${t.amount}</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><th colspan="3">${t.contrib}</th><td>${money(c.workerContributionsTotal)}</td></tr></tfoot></table></div><p class="payroll-note">${esc(b.notes.temporaryContract[l])}</p></li>
 <li><div class="payroll-step-head"><span>5</span><h4>${t.steps[4]}</h4></div><p class="payroll-formula">${money(c.monthlyEarnings)} × ${pct(a.irpfRate)} = <strong>${money(c.irpfAmount)}</strong></p><aside class="payroll-warning"><strong>${t.important}:</strong> ${esc(b.notes.irpf[l])}</aside></li>
 <li><div class="payroll-step-head"><span>6</span><h4>${t.steps[5]}</h4></div><div class="payroll-summary"><div><span>${t.deductions}</span><strong>${money(c.workerContributionsTotal)} + ${money(c.irpfAmount)} = ${money(c.totalDeductions)}</strong></div><div class="payroll-net"><span>${t.net}</span><strong>${money(c.monthlyEarnings)} − ${money(c.totalDeductions)} = ${money(c.netPay)}</strong></div></div></li></ol></section>
 <section class="payroll-memory"><h3>${t.memory}</h3><p>${t.memoryText}</p></section><p class="payroll-dynamic-note">${t.note}</p></section>`;
}


function practiceSteps(b,l){
 const a=b.assumptions,c=b.calculations,p=P[l];
 const byId=Object.fromEntries(c.workerContributions.map(x=>[x.id,x]));
 const contribution=(key,id)=>({key,label:p.fields[key],expected:byId[id].amount,hint:p.hints.contribution,formula:`${money(c.contributionBase)} × ${pct(byId[id].rate)} = ${money(byId[id].amount)}`});
 return [
  {key:"prorata",label:p.fields.prorata,expected:c.proratedExtraMonthly,hint:p.hints.prorata,formula:`(${money(a.extraPayAmount)} × ${a.extraPays}) ÷ 12 = ${money(c.proratedExtraMonthly)}`},
  {key:"devengos",label:p.fields.devengos,expected:c.monthlyEarnings,hint:p.hints.devengos,formula:`${money(a.baseSalary)} + ${money(c.proratedExtraMonthly)} = ${money(c.monthlyEarnings)}`},
  {key:"base",label:p.fields.base,expected:c.contributionBase,hint:p.hints.base,formula:`${money(c.monthlyEarnings)} = ${money(c.contributionBase)}`},
  contribution("common","common"),
  contribution("unemployment","unemployment"),
  contribution("training","training"),
  contribution("mei","mei"),
  {key:"contribTotal",label:p.fields.contribTotal,expected:c.workerContributionsTotal,hint:p.hints.contribTotal,formula:`${c.workerContributions.map(x=>money(x.amount)).join(" + ")} = ${money(c.workerContributionsTotal)}`},
  {key:"irpf",label:p.fields.irpf,expected:c.irpfAmount,hint:p.hints.irpf,formula:`${money(c.monthlyEarnings)} × ${pct(a.irpfRate)} = ${money(c.irpfAmount)}`},
  {key:"deductions",label:p.fields.deductions,expected:c.totalDeductions,hint:p.hints.deductions,formula:`${money(c.workerContributionsTotal)} + ${money(c.irpfAmount)} = ${money(c.totalDeductions)}`},
  {key:"net",label:p.fields.net,expected:c.netPay,hint:p.hints.net,formula:`${money(c.monthlyEarnings)} − ${money(c.totalDeductions)} = ${money(c.netPay)}`}
 ];
}

function practiceCaseFacts(b,l,t){
 const a=b.assumptions;
 return `<dl class="payroll-facts practice-facts"><div><dt>${t.salary}</dt><dd>${money(a.baseSalary)}</dd></div><div><dt>${t.extras}</dt><dd>${a.extraPays} × ${money(a.extraPayAmount)} · ${l==="ca"?"prorratejades":"prorrateadas"}</dd></div><div><dt>${t.contract}</dt><dd>${esc(a.contract[l])}</dd></div><div><dt>${t.workday}</dt><dd>${esc(a.workday[l])}</dd></div><div><dt>${t.irpf}</dt><dd>${pct(a.irpfRate)}</dd></div></dl>`;
}

function practiceHtml(b,l,t,state){
 const p=P[l],steps=practiceSteps(b,l),safe=state||createPayrollPracticeState();
 if(safe.index>=steps.length){
  const rows=steps.map(step=>`<li><span>${esc(step.label)}</span><strong>${money(step.expected)}</strong></li>`).join("");
  return `<section class="payroll-practice"><header class="payroll-head"><p class="eyebrow">${t.case}</p><h2>${p.finished}</h2><p>${safe.firstTry.length}/${steps.length} ${p.firstTry}.</p></header><section class="practice-finish"><h3>${p.completeResult}</h3><ul>${rows}</ul><div class="practice-actions"><button class="primary" type="button" data-practice-restart>${p.tryAgain}</button><button class="back-button" type="button" data-payroll-view="resolved">${p.resolvedAfter}</button></div></section><section class="payroll-memory"><h3>${t.memory}</h3><p>${t.memoryText}</p></section></section>`;
 }
 const current=steps[safe.index],attempts=safe.attempts[current.key]||0;
 const completed=steps.slice(0,safe.index).map(step=>`<li><span aria-hidden="true">✓</span><span>${esc(step.label)}</span><strong>${money(step.expected)}</strong></li>`).join("");
 const feedback=safe.feedback?.type==="invalid"?`<p class="practice-feedback practice-feedback-wrong" role="status">${p.invalid}</p>`
  :safe.feedback?.type==="wrong"?`<div class="practice-feedback practice-feedback-wrong" role="status"><strong>${p.wrong}</strong><p><b>${p.hint}:</b> ${esc(current.hint)}</p>${attempts>=2?`<p class="practice-solution"><b>${p.solution}:</b> ${esc(current.formula)}</p><button type="button" class="text-button" data-use-practice-solution>${p.useSolution}</button>`:""}</div>`
  :safe.feedback?.type==="correct"?`<p class="practice-feedback practice-feedback-correct" role="status">${p.correct}</p>`
  :safe.feedback?.type==="solution"?`<p class="practice-feedback" role="status">${p.usedSolution}</p>`:"";
 return `<section class="payroll-practice"><header class="payroll-head"><p class="eyebrow">${t.case}</p><h2>${p.practiceTitle}</h2><p>${p.practiceIntro}</p><p class="practical-source"><strong>${t.source}:</strong> ${l==="ca"?"Material de classe":"Material de clase"} CECOT · UF0519</p></header>
 <section class="payroll-section"><h3>${t.data}</h3>${practiceCaseFacts(b,l,t)}</section>
 <section class="practice-work"><div class="practice-progress"><div><strong>${p.step} ${safe.index+1} ${p.of} ${steps.length}</strong><span>${esc(current.label)}</span></div><progress value="${safe.index}" max="${steps.length}"></progress></div>
 ${completed?`<ol class="practice-completed">${completed}</ol>`:""}
 ${feedback}
 <form class="practice-form" data-payroll-practice-form novalidate><label for="payroll-practice-value">${esc(current.label)}</label><div class="practice-input-row"><input id="payroll-practice-value" name="amount" data-payroll-practice-input type="text" inputmode="decimal" autocomplete="off" placeholder="0,00 €" aria-describedby="practice-format-help"><button class="primary" type="submit">${p.check}</button></div><small id="practice-format-help">${p.formatHelp}</small></form>
 <button class="text-button practice-restart" type="button" data-practice-restart>${p.restart}</button></section></section>`;
}

function payrollAreaHtml(b,l,t,view,state){
 const p=P[l],active=view==="practice"?"practice":"resolved";
 return `<div class="payroll-area"><nav class="payroll-mode-tabs" aria-label="${t.pay}"><button type="button" data-payroll-view="resolved" aria-pressed="${String(active==="resolved")}">${p.resolved}</button><button type="button" data-payroll-view="practice" aria-pressed="${String(active==="practice")}">${p.practice}</button></nav>${active==="practice"?practiceHtml(b,l,t,state):payrollHtml(b,l,t)}</div>`;
}


export function renderPracticalExamplesHtml({correspondenceBank,payrollBank,language="ca",category="correspondence",correspondenceTab="guide",payrollView="resolved",practiceState=null}){
 validateCommercialCorrespondenceData(correspondenceBank);validatePayrollExampleData(payrollBank);const l=language==="es"?"es":"ca",t=C[l],active=category==="payroll"?"payroll":"correspondence";
 const body=active==="payroll"?payrollAreaHtml(payrollBank,l,t,payrollView,practiceState):renderCommercialCorrespondenceHtml(correspondenceBank,l,correspondenceTab,{showBack:false});
 return `<div class="practical-examples-shell"><div class="practical-toolbar"><button class="back-button" data-action="home" type="button">${t.back}</button></div><header class="practical-head"><p class="eyebrow">${l==="ca"?"Aplicació del temari":"Aplicación del temario"}</p><h1>${t.title}</h1><p>${t.intro}</p></header><nav class="practical-tabs" aria-label="${t.title}"><button type="button" data-practical-category="correspondence" aria-pressed="${String(active==="correspondence")}">${t.corr}</button><button type="button" data-practical-category="payroll" aria-pressed="${String(active==="payroll")}">${t.pay}</button></nav><div class="practical-content">${body}</div></div>`;
}

export function createPracticalExamples({screen,correspondenceBank,payrollBank,language="ca",onHome}){
 let l=language==="es"?"es":"ca",category="correspondence",correspondenceTab="guide",payrollView="resolved",practiceState=createPayrollPracticeState();
 const render=()=>{
  screen.innerHTML=renderPracticalExamplesHtml({correspondenceBank,payrollBank,language:l,category,correspondenceTab,payrollView,practiceState});
  screen.querySelector('[data-action="home"]')?.addEventListener("click",onHome);
  for(const b of screen.querySelectorAll("[data-practical-category]"))b.addEventListener("click",()=>{category=b.dataset.practicalCategory==="payroll"?"payroll":"correspondence";render();});
  for(const b of screen.querySelectorAll("[data-correspondence-tab]"))b.addEventListener("click",()=>{correspondenceTab=b.dataset.correspondenceTab;render();});
  for(const b of screen.querySelectorAll("[data-payroll-view]"))b.addEventListener("click",()=>{payrollView=b.dataset.payrollView==="practice"?"practice":"resolved";render();});
  screen.querySelector("[data-practice-restart]")?.addEventListener("click",()=>{practiceState=createPayrollPracticeState();render();});
  screen.querySelector("[data-use-practice-solution]")?.addEventListener("click",()=>{
   const steps=practiceSteps(payrollBank,l),current=steps[practiceState.index];
   if(!current)return;
   if(!practiceState.completed.includes(current.key))practiceState.completed.push(current.key);
   practiceState.index+=1;practiceState.feedback={type:"solution"};render();
  });
  screen.querySelector("[data-payroll-practice-form]")?.addEventListener("submit",event=>{
   event.preventDefault();
   const steps=practiceSteps(payrollBank,l),current=steps[practiceState.index],input=event.currentTarget.querySelector("[data-payroll-practice-input]");
   if(!current||!input)return;
   const parsed=parsePayrollAmount(input.value);
   if(!Number.isFinite(parsed)){practiceState.feedback={type:"invalid"};render();return;}
   if(checkPayrollPracticeAnswer(input.value,current.expected)){
    if((practiceState.attempts[current.key]||0)===0&&!practiceState.firstTry.includes(current.key))practiceState.firstTry.push(current.key);
    if(!practiceState.completed.includes(current.key))practiceState.completed.push(current.key);
    practiceState.index+=1;practiceState.feedback={type:"correct"};render();return;
   }
   practiceState.attempts[current.key]=(practiceState.attempts[current.key]||0)+1;
   practiceState.feedback={type:"wrong"};render();
  });
 };
 render();
 return {setLanguage(n){l=n==="es"?"es":"ca";render();},destroy(){screen.replaceChildren();}};
}
