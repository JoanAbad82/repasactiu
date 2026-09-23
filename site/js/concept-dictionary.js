const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));

const COPY={
  ca:{
    title:'Diccionari de conceptes clau',
    subtitle:'Conceptes connectats per famílies per entendre millor les relacions i memoritzar amb menys esforç.',
    listSubtitle:'Enumeracions, classificacions i seqüències del temari que convé recordar com un conjunt complet.',
    back:'← Tornar al temari',
    concepts:'Conceptes',
    lists:'Llistes clau',
    search:'Cerca un concepte',
    searchList:'Cerca una llista',
    searchPlaceholder:'Ex.: delegació, directiva, sinergia…',
    searchListPlaceholder:'Ex.: organigrama, enviament, arxiu…',
    filter:'Filtra per bloc',
    all:'Tots els blocs',
    results:'conceptes',
    listResults:'llistes',
    memory:'Recorda',
    source:'Font',
    family:'Família conceptual',
    listFamily:'Família de llistes',
    orderImportant:'Ordre important',
    completeSet:'Conjunt',
    emptyTitle:'No hi ha coincidències',
    emptyText:'Prova una altra paraula o selecciona un altre bloc.'
  },
  es:{
    title:'Diccionario de conceptos clave',
    subtitle:'Conceptos conectados por familias para entender mejor las relaciones y memorizar con menos esfuerzo.',
    listSubtitle:'Enumeraciones, clasificaciones y secuencias del temario que conviene recordar como un conjunto completo.',
    back:'← Volver al temario',
    concepts:'Conceptos',
    lists:'Listas clave',
    search:'Busca un concepto',
    searchList:'Busca una lista',
    searchPlaceholder:'Ej.: delegación, directiva, sinergia…',
    searchListPlaceholder:'Ej.: organigrama, envío, archivo…',
    filter:'Filtra por bloque',
    all:'Todos los bloques',
    results:'conceptos',
    listResults:'listas',
    memory:'Recuerda',
    source:'Fuente',
    family:'Familia conceptual',
    listFamily:'Familia de listas',
    orderImportant:'Orden importante',
    completeSet:'Conjunto',
    emptyTitle:'No hay coincidencias',
    emptyText:'Prueba otra palabra o selecciona otro bloque.'
  }
};

const normalize=value=>String(value??'')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'')
  .toLocaleLowerCase('ca')
  .trim();

function entryOrder(families=[]){
  const map=new Map();
  for(const [familyIndex,family] of families.entries()){
    for(const [entryIndex,id] of (family.entryIds||[]).entries()){
      map.set(id,{familyIndex,entryIndex});
    }
  }
  return map;
}

function validatePartition(bank,label){
  const ids=new Set();
  for(const entry of bank.entries){
    if(!entry?.id||ids.has(entry.id))throw new Error(`${label} amb IDs invàlids.`);
    ids.add(entry.id);
  }
  const assigned=(bank.families||[]).flatMap(family=>family.entryIds||[]);
  if(assigned.length!==bank.entries.length||new Set(assigned).size!==bank.entries.length||assigned.some(id=>!ids.has(id))){
    throw new Error(`${label} amb famílies incompletes o duplicades.`);
  }
}

export async function loadConceptDictionary(fetcher=fetch){
  const response=await fetcher('data/concept-dictionary-v1.json');
  if(!response.ok)throw new Error('No s’ha pogut carregar el diccionari de conceptes.');
  const bank=await response.json();
  if(bank?.version!==1||!Array.isArray(bank.entries)||!bank.entries.length||bank?.count!==bank.entries.length){
    throw new Error('Diccionari de conceptes invàlid.');
  }
  if(!Array.isArray(bank.languages)||!bank.languages.includes('ca')||!bank.languages.includes('es')){
    throw new Error('Diccionari de conceptes sense contracte bilingüe.');
  }
  if(!Array.isArray(bank.families)||!bank.families.length){
    throw new Error('Diccionari de conceptes sense famílies conceptuals.');
  }
  for(const entry of bank.entries){
    if(!entry?.blockId||!entry?.ca?.term||!entry?.ca?.definition||!entry?.ca?.memory||
       !entry?.es?.term||!entry?.es?.definition||!entry?.es?.memory||
       !entry?.source?.id||!Array.isArray(entry?.source?.pages)){
      throw new Error('Diccionari de conceptes amb una entrada incompleta.');
    }
  }
  validatePartition(bank,'Diccionari de conceptes');
  return bank;
}

export function validateKeyLists(bank){
  if(bank?.version!==1||!Array.isArray(bank.entries)||!bank.entries.length||bank?.count!==bank.entries.length){
    throw new Error('Banc de llistes clau invàlid.');
  }
  if(!Array.isArray(bank.languages)||!bank.languages.includes('ca')||!bank.languages.includes('es')){
    throw new Error('Banc de llistes clau sense contracte bilingüe.');
  }
  if(!Array.isArray(bank.groups)||!bank.groups.length||!Array.isArray(bank.families)||!bank.families.length){
    throw new Error('Banc de llistes clau sense grups o famílies.');
  }
  for(const entry of bank.entries){
    if(!entry?.blockId||typeof entry?.ordered!=='boolean'||!entry?.source?.id||!Array.isArray(entry?.source?.pages)||
       !entry?.ca?.title||!Array.isArray(entry?.ca?.items)||entry.ca.items.length<3||
       !entry?.es?.title||!Array.isArray(entry?.es?.items)||entry.es.items.length!==entry.ca.items.length){
      throw new Error('Banc de llistes clau amb una entrada incompleta.');
    }
  }
  validatePartition(bank,'Banc de llistes clau');
  return bank;
}

export async function loadKeyLists(fetcher=fetch){
  const response=await fetcher('data/key-lists-v1.json');
  if(!response.ok)throw new Error('No s’han pogut carregar les llistes clau.');
  return validateKeyLists(await response.json());
}

export function filterConceptEntries(bank,{language='ca',query='',blockId='all'}={}){
  const lang=language==='es'?'es':'ca';
  const q=normalize(query);
  const order=entryOrder(bank?.families||[]);
  return (bank?.entries||[])
    .filter(entry=>blockId==='all'||entry.blockId===blockId)
    .filter(entry=>{
      if(!q)return true;
      const localized=entry[lang]||{};
      return normalize([localized.term,localized.definition,localized.memory].join(' ')).includes(q);
    })
    .slice()
    .sort((a,b)=>{
      const ao=order.get(a.id)||{familyIndex:Number.MAX_SAFE_INTEGER,entryIndex:Number.MAX_SAFE_INTEGER};
      const bo=order.get(b.id)||{familyIndex:Number.MAX_SAFE_INTEGER,entryIndex:Number.MAX_SAFE_INTEGER};
      if(ao.familyIndex!==bo.familyIndex)return ao.familyIndex-bo.familyIndex;
      if(ao.entryIndex!==bo.entryIndex)return ao.entryIndex-bo.entryIndex;
      return (a[lang]?.term||'').localeCompare(b[lang]?.term||'',lang,{sensitivity:'base'});
    });
}

export function filterKeyListEntries(bank,{language='ca',query='',blockId='all'}={}){
  const lang=language==='es'?'es':'ca';
  const q=normalize(query);
  const order=entryOrder(bank?.families||[]);
  return (bank?.entries||[])
    .filter(entry=>blockId==='all'||entry.blockId===blockId)
    .filter(entry=>{
      if(!q)return true;
      const localized=entry[lang]||{};
      return normalize([localized.title,...(localized.items||[]),localized.memory||''].join(' ')).includes(q);
    })
    .slice()
    .sort((a,b)=>{
      const ao=order.get(a.id)||{familyIndex:Number.MAX_SAFE_INTEGER,entryIndex:Number.MAX_SAFE_INTEGER};
      const bo=order.get(b.id)||{familyIndex:Number.MAX_SAFE_INTEGER,entryIndex:Number.MAX_SAFE_INTEGER};
      if(ao.familyIndex!==bo.familyIndex)return ao.familyIndex-bo.familyIndex;
      if(ao.entryIndex!==bo.entryIndex)return ao.entryIndex-bo.entryIndex;
      return (a[lang]?.title||'').localeCompare(b[lang]?.title||'',lang,{sensitivity:'base'});
    });
}

export function groupConceptEntriesByFamily(bank,entries){
  const byId=new Map((entries||[]).map(entry=>[entry.id,entry]));
  return (bank?.families||[])
    .map(family=>({family,entries:(family.entryIds||[]).map(id=>byId.get(id)).filter(Boolean)}))
    .filter(group=>group.entries.length);
}

export function groupKeyListEntriesByFamily(bank,entries){
  return groupConceptEntriesByFamily(bank,entries);
}

export function sourceLabel(source,language='ca'){
  const pages=source?.pages||[];
  if(!source?.id||!pages.length)return '';
  const [start,end=start]=pages;
  const pageWord=start===end?'p.':'pp.';
  return start===end?`${source.id} · ${pageWord} ${start}`:`${source.id} · ${pageWord} ${start}–${end}`;
}

function groupLabel(group,lang){
  return group?.[lang]||group?.ca||group?.id||'';
}

function conceptEntryHtml(entry,lang,c){
  const item=entry[lang];
  return `<article class="concept-entry" data-concept-id="${esc(entry.id)}">
    <div class="concept-entry-head">
      <h3>${esc(item.term)}</h3>
      <span class="concept-source" title="${esc(c.source)}">${esc(sourceLabel(entry.source,lang))}</span>
    </div>
    <p class="concept-definition">${esc(item.definition)}</p>
    <p class="concept-memory"><strong>${esc(c.memory)}:</strong> ${esc(item.memory)}</p>
  </article>`;
}

function conceptListHtml(bank,entries,lang,c){
  if(!entries.length)return `<div class="dictionary-empty"><strong>${esc(c.emptyTitle)}</strong><p>${esc(c.emptyText)}</p></div>`;
  return groupConceptEntriesByFamily(bank,entries).map(({family,entries:familyEntries})=>`
    <section class="concept-family" data-concept-family="${esc(family.id)}">
      <div class="concept-family-head">
        <p class="eyebrow">${esc(c.family)}</p>
        <h2>${esc(groupLabel(family,lang))}</h2>
        <span>${familyEntries.length}</span>
      </div>
      <div class="concept-family-list">
        ${familyEntries.map(entry=>conceptEntryHtml(entry,lang,c)).join('')}
      </div>
    </section>`).join('');
}

function keyListEntryHtml(entry,lang,c){
  const item=entry[lang];
  const items=entry.ordered
    ? `<ol class="key-list-items key-list-ordered">${item.items.map(value=>`<li>${esc(value)}</li>`).join('')}</ol>`
    : `<ul class="key-list-items key-list-chips">${item.items.map(value=>`<li>${esc(value)}</li>`).join('')}</ul>`;
  return `<article class="key-list-entry" data-key-list-id="${esc(entry.id)}">
    <div class="key-list-entry-head">
      <div>
        <h3>${esc(item.title)}</h3>
        <span class="key-list-kind">${esc(entry.ordered?c.orderImportant:c.completeSet)}</span>
      </div>
      <span class="concept-source" title="${esc(c.source)}">${esc(sourceLabel(entry.source,lang))}</span>
    </div>
    ${items}
    ${item.memory?`<p class="concept-memory key-list-memory"><strong>${esc(c.memory)}:</strong> ${esc(item.memory)}</p>`:''}
  </article>`;
}

function keyListHtml(bank,entries,lang,c){
  if(!entries.length)return `<div class="dictionary-empty"><strong>${esc(c.emptyTitle)}</strong><p>${esc(c.emptyText)}</p></div>`;
  return groupKeyListEntriesByFamily(bank,entries).map(({family,entries:familyEntries})=>`
    <section class="concept-family key-list-family" data-key-list-family="${esc(family.id)}">
      <div class="concept-family-head">
        <p class="eyebrow">${esc(c.listFamily)}</p>
        <h2>${esc(groupLabel(family,lang))}</h2>
        <span>${familyEntries.length}</span>
      </div>
      <div class="key-list-family-list">
        ${familyEntries.map(entry=>keyListEntryHtml(entry,lang,c)).join('')}
      </div>
    </section>`).join('');
}

function optionHtml(groups,blockId,lang,c){
  return [
    `<option value="all" ${blockId==='all'?'selected':''}>${esc(c.all)}</option>`,
    ...(groups||[]).map(group=>`<option value="${esc(group.id)}" ${blockId===group.id?'selected':''}>${esc(groupLabel(group,lang))}</option>`)
  ].join('');
}

export function renderConceptDictionaryHtml(bank,{language='ca',query='',blockId='all',keyLists=null,mode='concepts'}={}){
  const lang=language==='es'?'es':'ca';
  const c=COPY[lang];
  const hasLists=Boolean(keyLists?.entries?.length);
  const active=hasLists&&mode==='lists'?'lists':'concepts';
  const activeBank=active==='lists'?keyLists:bank;
  const entries=active==='lists'
    ? filterKeyListEntries(keyLists,{language:lang,query,blockId})
    : filterConceptEntries(bank,{language:lang,query,blockId});
  const options=optionHtml(activeBank?.groups||bank.groups,blockId,lang,c);
  const listPolicy=active==='lists'&&keyLists?.policy?.[lang]
    ? `<p class="key-list-policy">${esc(keyLists.policy[lang])}</p>`
    :'';

  return `<div class="concept-dictionary-shell">
    <div class="dictionary-toolbar">
      <button class="back-button" data-dictionary-action="home" type="button">${esc(c.back)}</button>
    </div>
    <header class="dictionary-head">
      <p class="eyebrow">Repàs Actiu</p>
      <h1>${esc(c.title)}</h1>
      <p>${esc(active==='lists'?c.listSubtitle:c.subtitle)}</p>
    </header>
    ${hasLists?`<nav class="dictionary-tabs" aria-label="${esc(c.title)}">
      <button type="button" data-dictionary-mode="concepts" aria-pressed="${String(active==='concepts')}">${esc(c.concepts)}</button>
      <button type="button" data-dictionary-mode="lists" aria-pressed="${String(active==='lists')}">${esc(c.lists)}</button>
    </nav>`:''}
    ${listPolicy}
    <div class="dictionary-controls">
      <label class="dictionary-field">
        <span>${esc(active==='lists'?c.searchList:c.search)}</span>
        <input type="search" data-dictionary-search value="${esc(query)}" placeholder="${esc(active==='lists'?c.searchListPlaceholder:c.searchPlaceholder)}" autocomplete="off">
      </label>
      <label class="dictionary-field">
        <span>${esc(c.filter)}</span>
        <select data-dictionary-filter>${options}</select>
      </label>
    </div>
    <p class="dictionary-count"><strong data-dictionary-count>${entries.length}</strong> ${esc(active==='lists'?c.listResults:c.results)}</p>
    <div class="${active==='lists'?'key-list-list':'concept-list'}" data-dictionary-list>
      ${active==='lists'?keyListHtml(keyLists,entries,lang,c):conceptListHtml(bank,entries,lang,c)}
    </div>
  </div>`;
}

export function createConceptDictionary({screen,bank,keyLists=null,language='ca',onHome=()=>{}}){
  let lang=language==='es'?'es':'ca';
  let query='';
  let blockId='all';
  let mode='concepts';

  function render(){
    screen.innerHTML=renderConceptDictionaryHtml(bank,{language:lang,query,blockId,keyLists,mode});
  }

  function refreshList(){
    const c=COPY[lang];
    const entries=mode==='lists'
      ? filterKeyListEntries(keyLists,{language:lang,query,blockId})
      : filterConceptEntries(bank,{language:lang,query,blockId});
    const count=screen.querySelector('[data-dictionary-count]');
    const list=screen.querySelector('[data-dictionary-list]');
    if(count)count.textContent=String(entries.length);
    if(list)list.innerHTML=mode==='lists'?keyListHtml(keyLists,entries,lang,c):conceptListHtml(bank,entries,lang,c);
  }

  function handleInput(event){
    const search=event.target.closest('[data-dictionary-search]');
    if(!search)return;
    query=search.value;
    refreshList();
  }

  function handleChange(event){
    const filter=event.target.closest('[data-dictionary-filter]');
    if(!filter)return;
    blockId=filter.value||'all';
    render();
    screen.querySelector('[data-dictionary-filter]')?.focus();
  }

  function handleClick(event){
    if(event.target.closest('[data-dictionary-action="home"]')){onHome();return;}
    const modeButton=event.target.closest('[data-dictionary-mode]');
    if(!modeButton)return;
    mode=modeButton.dataset.dictionaryMode==='lists'?'lists':'concepts';
    query='';
    render();
    screen.querySelector(`[data-dictionary-mode="${mode}"]`)?.focus();
  }

  screen.addEventListener('input',handleInput);
  screen.addEventListener('change',handleChange);
  screen.addEventListener('click',handleClick);
  render();

  return {
    setLanguage(nextLanguage){
      lang=nextLanguage==='es'?'es':'ca';
      render();
    },
    destroy(){
      screen.removeEventListener('input',handleInput);
      screen.removeEventListener('change',handleChange);
      screen.removeEventListener('click',handleClick);
      screen.innerHTML='';
    }
  };
}
