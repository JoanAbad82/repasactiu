const esc=value=>String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));

const COPY={
  ca:{
    title:'Diccionari de conceptes clau',
    subtitle:'Només els conceptes que més ajuden a entendre, diferenciar i memoritzar el temari.',
    back:'← Tornar al temari',
    search:'Cerca un concepte',
    searchPlaceholder:'Ex.: delegació, directiva, sinergia…',
    filter:'Filtra per bloc',
    all:'Tots els blocs',
    results:'conceptes',
    memory:'Recorda',
    source:'Font',
    emptyTitle:'No hi ha coincidències',
    emptyText:'Prova una altra paraula o selecciona un altre bloc.'
  },
  es:{
    title:'Diccionario de conceptos clave',
    subtitle:'Solo los conceptos que más ayudan a entender, diferenciar y memorizar el temario.',
    back:'← Volver al temario',
    search:'Busca un concepto',
    searchPlaceholder:'Ej.: delegación, directiva, sinergia…',
    filter:'Filtra por bloque',
    all:'Todos los bloques',
    results:'conceptos',
    memory:'Recuerda',
    source:'Fuente',
    emptyTitle:'No hay coincidencias',
    emptyText:'Prueba otra palabra o selecciona otro bloque.'
  }
};

const normalize=value=>String(value??'')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'')
  .toLocaleLowerCase('ca')
  .trim();

export async function loadConceptDictionary(fetcher=fetch){
  const response=await fetcher('data/concept-dictionary-v1.json');
  if(!response.ok)throw new Error('No s’ha pogut carregar el diccionari de conceptes.');
  const bank=await response.json();
  if(bank?.version!==1||bank?.count!==54||!Array.isArray(bank.entries)||bank.entries.length!==54){
    throw new Error('Diccionari de conceptes invàlid.');
  }
  if(!Array.isArray(bank.languages)||!bank.languages.includes('ca')||!bank.languages.includes('es')){
    throw new Error('Diccionari de conceptes sense contracte bilingüe.');
  }
  const ids=new Set();
  for(const entry of bank.entries){
    if(!entry?.id||ids.has(entry.id))throw new Error('Diccionari de conceptes amb IDs invàlids.');
    ids.add(entry.id);
    if(!entry?.blockId||!entry?.ca?.term||!entry?.ca?.definition||!entry?.ca?.memory||
       !entry?.es?.term||!entry?.es?.definition||!entry?.es?.memory||
       !entry?.source?.id||!Array.isArray(entry?.source?.pages)){
      throw new Error('Diccionari de conceptes amb una entrada incompleta.');
    }
  }
  return bank;
}

export function filterConceptEntries(bank,{language='ca',query='',blockId='all'}={}){
  const lang=language==='es'?'es':'ca';
  const q=normalize(query);
  return (bank?.entries||[])
    .filter(entry=>blockId==='all'||entry.blockId===blockId)
    .filter(entry=>{
      if(!q)return true;
      const localized=entry[lang]||{};
      return normalize([localized.term,localized.definition,localized.memory].join(' ')).includes(q);
    })
    .slice()
    .sort((a,b)=>(a[lang]?.term||'').localeCompare(b[lang]?.term||'',lang,{sensitivity:'base'}));
}

export function sourceLabel(source,language='ca'){
  const pages=source?.pages||[];
  if(!source?.id||!pages.length)return '';
  const [start,end=start]=pages;
  const pageWord=language==='es'?(start===end?'p.':'pp.'):(start===end?'p.':'pp.');
  return start===end?`${source.id} · ${pageWord} ${start}`:`${source.id} · ${pageWord} ${start}–${end}`;
}

function groupLabel(group,lang){
  return group?.[lang]||group?.ca||group?.id||'';
}

export function renderConceptDictionaryHtml(bank,{language='ca',query='',blockId='all'}={}){
  const lang=language==='es'?'es':'ca';
  const c=COPY[lang];
  const entries=filterConceptEntries(bank,{language:lang,query,blockId});
  const options=[
    `<option value="all" ${blockId==='all'?'selected':''}>${esc(c.all)}</option>`,
    ...(bank.groups||[]).map(group=>`<option value="${esc(group.id)}" ${blockId===group.id?'selected':''}>${esc(groupLabel(group,lang))}</option>`)
  ].join('');
  const list=entries.length?entries.map(entry=>{
    const item=entry[lang];
    return `<article class="concept-entry" data-concept-id="${esc(entry.id)}">
      <div class="concept-entry-head">
        <h2>${esc(item.term)}</h2>
        <span class="concept-source" title="${esc(c.source)}">${esc(sourceLabel(entry.source,lang))}</span>
      </div>
      <p class="concept-definition">${esc(item.definition)}</p>
      <p class="concept-memory"><strong>${esc(c.memory)}:</strong> ${esc(item.memory)}</p>
    </article>`;
  }).join(''):`<div class="dictionary-empty"><strong>${esc(c.emptyTitle)}</strong><p>${esc(c.emptyText)}</p></div>`;

  return `<div class="concept-dictionary-shell">
    <div class="dictionary-toolbar">
      <button class="back-button" data-dictionary-action="home" type="button">${esc(c.back)}</button>
    </div>
    <header class="dictionary-head">
      <p class="eyebrow">Repàs Actiu</p>
      <h1>${esc(c.title)}</h1>
      <p>${esc(c.subtitle)}</p>
    </header>
    <div class="dictionary-controls">
      <label class="dictionary-field">
        <span>${esc(c.search)}</span>
        <input type="search" data-dictionary-search value="${esc(query)}" placeholder="${esc(c.searchPlaceholder)}" autocomplete="off">
      </label>
      <label class="dictionary-field">
        <span>${esc(c.filter)}</span>
        <select data-dictionary-filter>${options}</select>
      </label>
    </div>
    <p class="dictionary-count"><strong data-dictionary-count>${entries.length}</strong> ${esc(c.results)}</p>
    <div class="concept-list" data-concept-list>${list}</div>
  </div>`;
}

export function createConceptDictionary({screen,bank,language='ca',onHome=()=>{}}){
  let lang=language==='es'?'es':'ca';
  let query='';
  let blockId='all';

  function render(){
    screen.innerHTML=renderConceptDictionaryHtml(bank,{language:lang,query,blockId});
  }

  function handleInput(event){
    const search=event.target.closest('[data-dictionary-search]');
    if(!search)return;
    query=search.value;
    const next=filterConceptEntries(bank,{language:lang,query,blockId});
    const count=screen.querySelector('[data-dictionary-count]');
    const list=screen.querySelector('[data-concept-list]');
    if(count)count.textContent=String(next.length);
    if(list){
      const temp=document.createElement('div');
      temp.innerHTML=renderConceptDictionaryHtml(bank,{language:lang,query,blockId});
      list.innerHTML=temp.querySelector('[data-concept-list]')?.innerHTML||'';
    }
  }

  function handleChange(event){
    const filter=event.target.closest('[data-dictionary-filter]');
    if(!filter)return;
    blockId=filter.value||'all';
    render();
    screen.querySelector('[data-dictionary-filter]')?.focus();
  }

  function handleClick(event){
    if(event.target.closest('[data-dictionary-action="home"]'))onHome();
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
