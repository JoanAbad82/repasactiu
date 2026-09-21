const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));

const copy={
  ca:{
    back:"← Tornar",
    eyebrow:"Guia pràctica",
    tabs:{guide:"Estructura i guia",models:"Models",abbreviations:"Abreviatures"},
    structureTitle:"Estructura d’una carta comercial",
    structureIntro:"Una carta comercial clara segueix un ordre recognoscible. Alguns elements, com la referència o els annexos, només s’inclouen quan cal.",
    languageTitle:"Criteris bàsics de redacció",
    errorsTitle:"Errors freqüents",
    templateTitle:"Plantilla de treball",
    templateIntro:"Pots adaptar aquesta plantilla a qualsevol dels models.",
    modelsTitle:"Models de cartes comercials",
    modelsIntro:"Vuit situacions habituals agrupades per finalitat. Obre un model per veure què convé observar i un exemple complet.",
    purpose:"Finalitat",
    observe:"Fixa’t en això",
    reference:"Ref.",
    subject:"Assumpte",
    sourcePage:"Material del curs · p.",
    abbreviationsTitle:"Abreviatures útils",
    abbreviationsIntro:"Selecció deliberadament curta: 26 formes d’ús habitual i especialment útils en l’àmbit administratiu i comercial.",
    rulesTitle:"Quatre criteris per usar-les bé",
    example:"Exemple",
    source:"Font",
    sourceNote:"Aquesta selecció prioritza utilitat pràctica. No pretén substituir els repertoris complets."
  },
  es:{
    back:"← Volver",
    eyebrow:"Guía práctica",
    tabs:{guide:"Estructura y guía",models:"Modelos",abbreviations:"Abreviaturas"},
    structureTitle:"Estructura de una carta comercial",
    structureIntro:"Una carta comercial clara sigue un orden reconocible. Algunos elementos, como la referencia o los anexos, solo se incluyen cuando procede.",
    languageTitle:"Criterios básicos de redacción",
    errorsTitle:"Errores frecuentes",
    templateTitle:"Plantilla de trabajo",
    templateIntro:"Puedes adaptar esta plantilla a cualquiera de los modelos.",
    modelsTitle:"Modelos de cartas comerciales",
    modelsIntro:"Ocho situaciones habituales agrupadas por finalidad. Abre un modelo para ver qué conviene observar y un ejemplo completo.",
    purpose:"Finalidad",
    observe:"Fíjate en esto",
    reference:"Ref.",
    subject:"Asunto",
    sourcePage:"Material del curso · p.",
    abbreviationsTitle:"Abreviaturas útiles",
    abbreviationsIntro:"Selección deliberadamente corta: 26 formas de uso habitual y especialmente útiles en el ámbito administrativo y comercial.",
    rulesTitle:"Cuatro criterios para usarlas bien",
    example:"Ejemplo",
    source:"Fuente",
    sourceNote:"Esta selección prioriza la utilidad práctica. No pretende sustituir los repertorios completos."
  }
};

export function validateCommercialCorrespondenceData(bank){
  if(!bank||bank.version!==1)throw new Error("Commercial correspondence data: invalid version");
  if(!Array.isArray(bank.languages)||bank.languages.join(",")!=="ca,es")throw new Error("Commercial correspondence data: invalid languages");
  if(!Array.isArray(bank.structure)||bank.structure.length!==10)throw new Error("Commercial correspondence data: structure must contain 10 elements");
  if(!Array.isArray(bank.models)||bank.models.length!==8)throw new Error("Commercial correspondence data: models must contain 8 items");
  if(!Array.isArray(bank.groups)||bank.groups.flatMap(group=>group.models||[]).length!==8)throw new Error("Commercial correspondence data: model groups must cover 8 items");
  for(const lang of bank.languages){
    const abbreviations=bank.abbreviations?.[lang];
    const items=abbreviations?.groups?.flatMap(group=>group.items||[])||[];
    if(items.length<20||items.length>30)throw new Error("Commercial correspondence data: abbreviations must stay between 20 and 30 per language");
    if(abbreviations.count!==items.length)throw new Error("Commercial correspondence data: abbreviation count mismatch");
  }
  return bank;
}

export async function loadCommercialCorrespondence(fetcher=fetch){
  const response=await fetcher("data/commercial-correspondence-v1.json");
  if(!response.ok)throw new Error("No s’ha pogut carregar la guia de correspondència comercial.");
  return validateCommercialCorrespondenceData(await response.json());
}

const local=(value,lang)=>typeof value==="object"&&value!==null&&!Array.isArray(value)?value[lang]:value;

function renderStructure(bank,lang,t){
  const items=bank.structure.map(item=>`
    <li class="correspondence-structure-item">
      <span class="correspondence-step">${item.order}</span>
      <span>${esc(item[lang])}</span>
    </li>`).join("");
  const notes=bank.languageNotes[lang].map(note=>`<li>${esc(note)}</li>`).join("");
  const errors=bank.commonErrors[lang].map(error=>`<li>${esc(error)}</li>`).join("");
  const template=esc(bank.template[lang].join("\n"));
  return `
    <section class="correspondence-section">
      <div class="correspondence-section-head">
        <h2>${t.structureTitle}</h2>
        <p>${t.structureIntro}</p>
      </div>
      <ol class="correspondence-structure">${items}</ol>
    </section>
    <section class="correspondence-grid-two">
      <article class="correspondence-note-card">
        <h2>${t.languageTitle}</h2>
        <ul>${notes}</ul>
      </article>
      <article class="correspondence-note-card">
        <h2>${t.errorsTitle}</h2>
        <ul>${errors}</ul>
      </article>
    </section>
    <section class="correspondence-section">
      <div class="correspondence-section-head">
        <h2>${t.templateTitle}</h2>
        <p>${t.templateIntro}</p>
      </div>
      <pre class="letter-template"><code>${template}</code></pre>
    </section>`;
}

function renderLetter(example,lang,t){
  const recipient=lang==="es"?(example.recipientEs||example.recipient):example.recipient;
  const signature=example.signature.map(part=>esc(local(part,lang))).join("<br>");
  return `
    <div class="letter-sheet" lang="${lang}">
      <div class="letter-address">${example.sender.map(esc).join("<br>")}</div>
      <div class="letter-address letter-recipient">${recipient.map(esc).join("<br>")}</div>
      <div class="letter-date">${esc(example.date[lang])}</div>
      ${example.reference?`<p class="letter-reference"><strong>${t.reference}</strong> ${esc(example.reference[lang])}</p>`:""}
      <p class="letter-subject"><strong>${t.subject}:</strong> ${esc(example.subject[lang])}</p>
      <p>${esc(example.greeting[lang])}</p>
      ${example.paragraphs[lang].map(paragraph=>`<p>${esc(paragraph)}</p>`).join("")}
      <p>${esc(example.closing[lang])}</p>
      <p class="letter-signature">${signature}</p>
      ${example.annex?`<p class="letter-annex">${esc(example.annex[lang])}</p>`:""}
    </div>`;
}

function renderModels(bank,lang,t){
  const byId=new Map(bank.models.map(model=>[model.id,model]));
  const groups=bank.groups.map(group=>{
    const models=group.models.map(id=>{
      const model=byId.get(id);
      const observe=model.observe[lang].map(item=>`<li>${esc(item)}</li>`).join("");
      return `
        <details class="commercial-model" data-commercial-model="${esc(model.id)}">
          <summary>
            <span>
              <strong>${esc(model.title[lang])}</strong>
              <small>${esc(model.purpose[lang])}</small>
            </span>
            <span class="details-marker" aria-hidden="true">+</span>
          </summary>
          <div class="commercial-model-body">
            <div class="model-purpose"><strong>${t.purpose}:</strong> ${esc(model.purpose[lang])}</div>
            <div class="model-observe">
              <h3>${t.observe}</h3>
              <ul>${observe}</ul>
            </div>
            ${renderLetter(model.example,lang,t)}
            <p class="model-source">${t.sourcePage} ${model.sourcePages[lang]}</p>
          </div>
        </details>`;
    }).join("");
    return `
      <section class="model-family" data-model-family="${esc(group.id)}">
        <h2>${esc(group[lang])}</h2>
        <div class="commercial-model-list">${models}</div>
      </section>`;
  }).join("");
  return `
    <section class="correspondence-section">
      <div class="correspondence-section-head">
        <h2>${t.modelsTitle}</h2>
        <p>${t.modelsIntro}</p>
      </div>
      <div class="model-families">${groups}</div>
    </section>`;
}

function renderAbbreviations(bank,lang,t){
  const source=bank.abbreviations[lang];
  const rules=source.rules.map(rule=>`<li>${esc(rule)}</li>`).join("");
  const groups=source.groups.map(group=>`
    <section class="abbreviation-family">
      <h2>${esc(group.title)}</h2>
      <div class="abbreviation-list">
        ${group.items.map(item=>`
          <article class="abbreviation-entry">
            <div class="abbreviation-main"><strong>${esc(item.abbr)}</strong><span>${esc(item.term)}</span></div>
            <div class="abbreviation-example"><span>${t.example}</span><code>${esc(item.example)}</code></div>
          </article>`).join("")}
      </div>
    </section>`).join("");
  const sourceLine=source.url
    ? `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.source)}</a>`
    : esc(source.source);
  return `
    <section class="correspondence-section">
      <div class="correspondence-section-head">
        <h2>${t.abbreviationsTitle}</h2>
        <p>${t.abbreviationsIntro}</p>
      </div>
      <article class="correspondence-note-card abbreviation-rules">
        <h2>${t.rulesTitle}</h2>
        <ul>${rules}</ul>
      </article>
      <div class="abbreviation-families">${groups}</div>
      <p class="abbreviation-source"><strong>${t.source}:</strong> ${sourceLine}<br><span>${t.sourceNote}</span></p>
    </section>`;
}

export function renderCommercialCorrespondenceHtml(bank,language="ca",tab="guide"){
  validateCommercialCorrespondenceData(bank);
  const lang=language==="es"?"es":"ca";
  const active=["guide","models","abbreviations"].includes(tab)?tab:"guide";
  const t=copy[lang];
  const content=active==="models"?renderModels(bank,lang,t):active==="abbreviations"?renderAbbreviations(bank,lang,t):renderStructure(bank,lang,t);
  return `
    <div class="commercial-correspondence-shell">
      <div class="correspondence-toolbar">
        <button class="back-button" data-action="home" type="button">${t.back}</button>
      </div>
      <header class="correspondence-head">
        <p class="eyebrow">${t.eyebrow}</p>
        <h1>${esc(bank.title[lang])}</h1>
        <p>${esc(bank.intro[lang])}</p>
      </header>
      <nav class="correspondence-tabs" aria-label="${esc(bank.title[lang])}">
        ${Object.entries(t.tabs).map(([id,label])=>`<button type="button" data-correspondence-tab="${id}" aria-pressed="${String(id===active)}">${label}</button>`).join("")}
      </nav>
      <div class="correspondence-content">${content}</div>
    </div>`;
}

export function createCommercialCorrespondence({screen,bank,language="ca",onHome}){
  let lang=language==="es"?"es":"ca";
  let tab="guide";
  const bind=()=>{
    screen.querySelector('[data-action="home"]')?.addEventListener("click",onHome);
    for(const button of screen.querySelectorAll("[data-correspondence-tab]")){
      button.addEventListener("click",()=>{
        tab=button.dataset.correspondenceTab;
        render();
      });
    }
  };
  const render=()=>{
    screen.innerHTML=renderCommercialCorrespondenceHtml(bank,lang,tab);
    bind();
  };
  render();
  return {
    setLanguage(nextLanguage){
      lang=nextLanguage==="es"?"es":"ca";
      render();
    },
    destroy(){screen.replaceChildren();}
  };
}
