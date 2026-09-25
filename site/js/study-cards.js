import {resolveSourceId,sortChronologically} from './chronology.js';
const esc=value=>String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));

const COPY={
  ca:{
    title:'Targetes de memòria',
    subtitle:'Tria les unitats i blocs que vols repassar. Pots combinar-los i barrejar les targetes.',
    available:'targetes disponibles',
    all:'Tot el temari',
    selectUnit:'Seleccionar',
    clear:'Netejar selecció',
    selected:'Targetes seleccionades',
    start:'Començar repàs',
    backHome:'← Tornar al temari',
    backSelection:'← Selecció',
    shuffle:'Barrejar',
    question:'PREGUNTA',
    answer:'RESPOSTA',
    mnemonic:'Mnemotècnia',
    tap:'Toca per girar',
    instruction:'Gira la targeta per veure la resposta',
    previous:'Targeta anterior',
    next:'Següent targeta',
    showAnswer:'Mostrar resposta',
    showQuestion:'Mostrar pregunta',
    empty:'Selecciona almenys un bloc per començar.',
    cards:'targetes',
    selectedBlocks:'blocs seleccionats'
  },
  es:{
    title:'Tarjetas de memoria',
    subtitle:'Elige las unidades y bloques que quieres repasar. Puedes combinarlos y barajar las tarjetas.',
    available:'tarjetas disponibles',
    all:'Todo el temario',
    selectUnit:'Seleccionar',
    clear:'Limpiar selección',
    selected:'Tarjetas seleccionadas',
    start:'Empezar repaso',
    backHome:'← Volver al temario',
    backSelection:'← Selección',
    shuffle:'Barajar',
    question:'PREGUNTA',
    answer:'RESPUESTA',
    mnemonic:'Mnemotecnia',
    tap:'Toca para girar',
    instruction:'Gira la tarjeta para ver la respuesta',
    previous:'Tarjeta anterior',
    next:'Siguiente tarjeta',
    showAnswer:'Mostrar respuesta',
    showQuestion:'Mostrar pregunta',
    empty:'Selecciona al menos un bloque para empezar.',
    cards:'tarjetas',
    selectedBlocks:'bloques seleccionados'
  }
};


const SOURCE_RANGES={
  'bloc-1':{id:'B1',pageRange:[1,19]},
  'bloc-2':{id:'B2',pageRange:[1,33]},
  'bloc-3':{id:'B3',pageRange:[1,35]},
  'bloc-4':{id:'B4',pageRange:[1,34]},
  'bloc-5':{id:'B5',pageRange:[1,24]},
  'unitat-2-bloc-1':{id:'U2B1',pageRange:[1,119]},
  'uf0518-bloc-1':{id:'UF0518_B1',pageRange:[1,31]},
  'uf0518-bloc-2':{id:'UF0518_B2',pageRange:[1,39]},
  'uf0518-bloc-3':{id:'UF0518_B3',pageRange:[1,50]},
  'uf0519-bloc-1':{id:'UF0519_U1',pageRange:[1,76]},
  'uf0519-bloc-2':{id:'UF0519_U1',pageRange:[1,76]},
  'uf0519-bloc-3':{id:'UF0519_U1',pageRange:[1,76]},
  'uf0519-bloc-4':{id:'UF0519_U1',pageRange:[1,76]},
  'uf0519-bloc-5':{id:'UF0519_U1',pageRange:[1,76]}
};

const conceptPart=value=>String(value??'')
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[^\p{L}\p{N}]+/gu,'-')
  .replace(/^-+|-+$/g,'')
  .toLocaleLowerCase('ca')||'sense-etiqueta';

export function semanticChangeMap(manifest={}){
  return new Map((manifest?.changes||[]).map(change=>[change.id,change]));
}

function effectiveSemantic(change){
  if(!change)return null;
  return change.status==='MERGE/REPLACE'?(change.replacement||null):change;
}

function parseSourceLabel(label,blockId){
  const fallback=SOURCE_RANGES[blockId]||null;
  const text=String(label||'').trim();
  if(!text)return fallback?{...fallback,precision:'block'}:null;
  const sourceId=resolveSourceId(
    text.match(/^(MF0969|UF0519|UF0518|U2|B[1-5])/i)?.[1],
    blockId,
    fallback?.id||'SOURCE'
  );
  const pageMatch=text.match(/pp?\.?\s*(\d+)(?:\s*(?:[-–—]|i|y)\s*(\d+))?/i);
  if(pageMatch){
    const start=Number(pageMatch[1]);
    const end=Number(pageMatch[2]||pageMatch[1]);
    return {id:sourceId,pageRange:[start,end],precision:'page'};
  }
  return fallback?{...fallback,id:sourceId,precision:'block'}:{id:sourceId,pageRange:null,precision:'label'};
}

function deriveConceptId(blockId,topic,canonicalAnswer,explicit){
  if(explicit)return explicit;
  return [String(blockId||'block').toUpperCase(),conceptPart(topic),conceptPart(canonicalAnswer)].join('.');
}

function traceForCore(traceability,blockId,questionId,topic){
  const exact=traceability?.questionRanges?.[questionId];
  if(exact?.source&&Array.isArray(exact.pageRange)){
    return {id:exact.source,pageRange:exact.pageRange,precision:'question'};
  }
  const range=traceability?.topicRanges?.[blockId]?.[topic];
  const sourceId=traceability?.blockSources?.[blockId]||SOURCE_RANGES[blockId]?.id||null;
  if(sourceId&&Array.isArray(range)){
    return {id:sourceId,pageRange:range,precision:'section'};
  }
  const fallback=SOURCE_RANGES[blockId];
  return fallback?{...fallback,precision:'block'}:null;
}

export function shuffleCards(cards,random=Math.random){
  const copy=cards.slice();
  for(let i=copy.length-1;i>0;i--){
    const j=Math.floor(random()*(i+1));
    [copy[i],copy[j]]=[copy[j],copy[i]];
  }
  return copy;
}

export function wrapIndex(index,length){
  if(!length)return 0;
  return ((index%length)+length)%length;
}

export async function loadStudyCardsBank(fetcher=fetch){
  const [response,semanticResponse,traceResponse]=await Promise.all([
    fetcher('data/study-cards-extra.json'),
    fetcher('data/study-cards-semantic-v2.json'),
    fetcher('data/study-cards-traceability-v2.json')
  ]);
  if(!response.ok)throw new Error('No s’ha pogut carregar el banc extra de targetes de memòria.');
  if(!semanticResponse.ok)throw new Error('No s’ha pogut carregar el manifest semàntic de targetes de memòria.');
  if(!traceResponse.ok)throw new Error('No s’ha pogut carregar la traçabilitat de targetes de memòria.');
  const [bank,semanticV2,traceabilityV2]=await Promise.all([response.json(),semanticResponse.json(),traceResponse.json()]);
  if(!Array.isArray(bank.languages)||!bank.languages.includes('ca')||!bank.languages.includes('es')||!Array.isArray(bank.cards)){
    throw new Error('Banc extra de targetes de memòria invàlid.');
  }
  if(!Array.isArray(semanticV2.changes)||semanticV2.changes.length!==84){
    throw new Error('Manifest semàntic de targetes de memòria invàlid.');
  }
  if(traceabilityV2.version!==2||!traceabilityV2.topicRanges||!traceabilityV2.questionRanges){
    throw new Error('Traçabilitat de targetes de memòria invàlida.');
  }
  return {...bank,semanticV2,traceabilityV2};
}

export function buildCoreStudyCards(banks,lang='ca',overrides={},semanticManifest={},traceability={}){
  const language=lang==='es'?'es':'ca';
  const semantic=semanticChangeMap(semanticManifest);
  return banks.flatMap(bank=>bank.questions.map(question=>{
    const localized=language==='es'?(question.translations?.es||question):question;
    const options=localized.options||question.options;
    const baseOverride=overrides?.[question.id]?.[language]||{};
    const semanticRecord=effectiveSemantic(semantic.get(question.id));
    const semanticText=semanticRecord?.[language]||{};
    const answer=semanticText.answer||baseOverride.answer||options?.[question.correct];
    const mnemonic=semanticText.mnemonic||baseOverride.mnemonic||question.memoryAid?.[language]||'';
    const canonicalAnswer=semanticRecord?.ca?.answer||overrides?.[question.id]?.ca?.answer||question.options?.[question.correct]||'';
    return {
      id:'test-'+question.id,
      sourceId:question.id,
      sourceType:'test',
      blockId:bank.blockId,
      unitId:bank.unitId,
      conceptId:deriveConceptId(bank.blockId,question.topic,canonicalAnswer,semanticRecord?.concept_id),
      chronologyConcept:question.topic,
      sourceRef:semanticRecord?.source?parseSourceLabel(semanticRecord.source,bank.blockId):traceForCore(traceability,bank.blockId,question.id,question.topic),
      question:semanticText.question||baseOverride.question||localized.question,
      answer,
      mnemonic
    };
  }));
}

export function buildExtraStudyCards(extraBank,lang='ca'){
  const language=lang==='es'?'es':'ca';
  const semantic=semanticChangeMap(extraBank.semanticV2||{});
  return (extraBank.cards||[]).map(card=>{
    const semanticRecord=effectiveSemantic(semantic.get(card.id));
    const effective=semanticRecord?.[language]||card[language]||{};
    const canonicalAnswer=semanticRecord?.ca?.answer||card.ca?.answer||'';
    const originalSource=card.source?{id:card.source.id,pageRange:card.source.pages,precision:'page'}:null;
    return {
      id:card.id,
      sourceId:card.id,
      sourceType:'extra',
      blockId:card.blockId,
      unitId:null,
      conceptId:deriveConceptId(card.blockId,'extra',canonicalAnswer,semanticRecord?.concept_id),
      chronologyConcept:semanticRecord?.concept_id||card.ca?.question||card.id,
      sourceRef:semanticRecord?.source?parseSourceLabel(semanticRecord.source,card.blockId):(originalSource||parseSourceLabel(null,card.blockId)),
      question:effective.question||'',
      answer:effective.answer||'',
      mnemonic:effective.mnemonic||''
    };
  });
}

export function buildOrderedStudyCards(banks,extraBank,lang='ca'){
  return sortChronologically([
    ...buildCoreStudyCards(banks,lang,extraBank.coreOverrides||{},extraBank.semanticV2||{},extraBank.traceabilityV2||{}),
    ...buildExtraStudyCards(extraBank,lang)
  ]);
}

export function selectCardsByBlocks(cards,selectedBlocks){
  return cards.filter(card=>selectedBlocks.has(card.blockId));
}

export function buildStudyCatalog(banks,extraCounts={},lang='ca'){
  const language=lang==='es'?'es':'ca';
  const units=[];
  const unitMap=new Map();
  let total=0;
  for(const bank of banks){
    const count=bank.questions.length+(extraCounts[bank.blockId]||0);
    total+=count;
    if(!unitMap.has(bank.unitId)){
      const unit={
        id:bank.unitId,
        title:language==='es'?(bank.unitTitleEs||bank.unitTitle):bank.unitTitle,
        count:0,
        blocks:[]
      };
      unitMap.set(bank.unitId,unit);
      units.push(unit);
    }
    const unit=unitMap.get(bank.unitId);
    unit.count+=count;
    unit.blocks.push({
      id:bank.blockId,
      number:bank.blockNumber,
      title:language==='es'?(bank.blockTitleEs||bank.blockTitle):bank.blockTitle,
      count
    });
  }
  return {total,units};
}

function extraCounts(extraBank){
  const counts={};
  for(const card of extraBank.cards||[])counts[card.blockId]=(counts[card.blockId]||0)+1;
  return counts;
}

function selectedCount(catalog,selectedBlocks){
  let count=0;
  for(const unit of catalog.units)for(const block of unit.blocks)if(selectedBlocks.has(block.id))count+=block.count;
  return count;
}

function selectorHtml(catalog,selectedBlocks,lang){
  const c=COPY[lang];
  const count=selectedCount(catalog,selectedBlocks);
  return `<div class="study-selector">
    <div class="study-selector-head">
      <button class="back-button" data-study-action="home" type="button">${c.backHome}</button>
      <div>
        <p class="eyebrow">${c.title}</p>
        <h1>${c.title}</h1>
        <p>${c.subtitle}</p>
        <p class="study-total"><strong>${catalog.total}</strong> ${c.available}</p>
      </div>
    </div>
    <div class="study-selector-actions">
      <button type="button" data-study-action="all">${c.all}</button>
      <button type="button" data-study-action="clear">${c.clear}</button>
    </div>
    <div class="study-units">
      ${catalog.units.map(unit=>`<section class="study-unit" data-study-unit="${esc(unit.id)}">
        <div class="study-unit-head">
          <div><h2>${esc(unit.title)}</h2><span>${unit.count} ${c.cards}</span></div>
          <button type="button" data-study-action="unit" data-unit-id="${esc(unit.id)}" aria-label="${c.selectUnit} ${esc(unit.title)}">${c.selectUnit}</button>
        </div>
        <div class="study-blocks">
          ${unit.blocks.map(block=>`<label class="study-block" data-study-block="${esc(block.id)}">
            <input type="checkbox" value="${esc(block.id)}" ${selectedBlocks.has(block.id)?'checked':''}>
            <span class="study-block-text"><strong>${lang==='es'?'Bloque':'Bloc'} ${block.number}</strong><span>${esc(block.title)}</span></span>
            <span class="study-block-count" data-study-count>${block.count}</span>
          </label>`).join('')}
        </div>
      </section>`).join('')}
    </div>
    <div class="study-selector-footer">
      <div><span>${c.selected}</span><strong id="study-selected-count">${count}</strong></div>
      <button class="primary" data-study-action="start" type="button" ${count?'':'disabled'}>${c.start}</button>
    </div>
  </div>`;
}

function cardHtml(card,index,total,flipped,lang){
  const c=COPY[lang];
  return `<div class="study-card-stage">
    <button type="button" class="study-card-nav previous" data-study-action="previous" aria-label="${c.previous}">‹</button>
    <button type="button" class="study-card${flipped?' is-flipped':''}" data-study-card data-study-id="${esc(card.id)}" aria-pressed="${String(flipped)}" aria-label="${flipped?c.showQuestion:c.showAnswer}">
      <span class="study-card-inner">
        <span class="study-card-face front" aria-hidden="${String(flipped)}">
          <span class="study-card-kicker">${c.question}</span>
          <span class="study-card-question" data-study-question>${esc(card.question)}</span>
          <span class="study-card-tap">${c.tap}</span>
        </span>
        <span class="study-card-face back" aria-hidden="${String(!flipped)}">
          <span class="study-card-kicker answer">${c.answer}</span>
          <span class="study-card-answer" data-study-answer>${esc(card.answer)}</span>
          <span class="study-card-mnemonic">
            <span class="study-card-mnemonic-label">${c.mnemonic}</span>
            <span data-study-mnemonic>${esc(card.mnemonic)}</span>
          </span>
        </span>
      </span>
    </button>
    <button type="button" class="study-card-nav next" data-study-action="next" aria-label="${c.next}">›</button>
  </div>
  <div class="study-card-progress" id="study-card-progress">${index+1} / ${total}</div>
  <p class="study-card-instruction">${c.instruction}</p>`;
}

export function createStudyCards({screen,live,banks,extraBank,language='ca',random=Math.random,onHome=()=>{}}){
  let lang=language==='es'?'es':'ca';
  let mode='selector';
  let selectedBlocks=new Set();
  let orderIds=[];
  let index=0;
  let flipped=false;

  const allCards=currentLang=>buildOrderedStudyCards(banks,extraBank,currentLang);
  const idsForSelection=()=>{
    const cards=allCards('ca');
    return selectCardsByBlocks(cards,selectedBlocks).map(card=>card.id);
  };
  const localizedMap=()=>new Map(allCards(lang).map(card=>[card.id,card]));
  const catalog=()=>buildStudyCatalog(banks,extraCounts(extraBank),lang);

  function renderSelector(){
    mode='selector';
    screen.innerHTML=selectorHtml(catalog(),selectedBlocks,lang);
  }

  function syncSelectionSummary(){
    const count=selectedCount(catalog(),selectedBlocks);
    const countNode=screen.querySelector('#study-selected-count');
    const startButton=screen.querySelector('[data-study-action="start"]');
    if(countNode)countNode.textContent=String(count);
    if(startButton)startButton.disabled=!count;
  }

  function renderReview(){
    mode='review';
    const map=localizedMap();
    const card=map.get(orderIds[index]);
    const c=COPY[lang];
    screen.innerHTML=`<div class="study-cards-shell">
      <div class="study-cards-toolbar">
        <button class="back-button" data-study-action="selection" type="button">${c.backSelection}</button>
        <button class="study-card-shuffle" data-study-action="shuffle" type="button">↝ ${c.shuffle}</button>
      </div>
      ${cardHtml(card,index,orderIds.length,flipped,lang)}
    </div>`;
  }

  function announce(){
    if(mode!=='review')return;
    const card=localizedMap().get(orderIds[index]);
    live.textContent=flipped
      ?(lang==='es'?'Respuesta mostrada. ':'Resposta mostrada. ')+card.answer
      :(lang==='es'?'Pregunta ':'Pregunta ')+(index+1)+' de '+orderIds.length+'.';
  }

  function go(delta){
    index=wrapIndex(index+delta,orderIds.length);
    flipped=false;
    renderReview();
    announce();
  }

  function shuffle(){
    orderIds=shuffleCards(orderIds,random);
    index=0;
    flipped=false;
    renderReview();
    live.textContent=(lang==='es'?'Tarjetas barajadas. ':'Targetes barrejades. ')+(lang==='es'?'Pregunta ':'Pregunta ')+'1 de '+orderIds.length+'.';
  }

  function start(){
    const ids=idsForSelection();
    if(!ids.length){
      live.textContent=COPY[lang].empty;
      return;
    }
    orderIds=ids;
    index=0;
    flipped=false;
    renderReview();
    announce();
  }

  function selectUnit(unitId){
    const unit=catalog().units.find(item=>item.id===unitId);
    if(!unit)return;
    const ids=unit.blocks.map(block=>block.id);
    const allSelected=ids.every(id=>selectedBlocks.has(id));
    for(const id of ids){
      if(allSelected)selectedBlocks.delete(id);
      else selectedBlocks.add(id);
    }
    renderSelector();
  }

  function handleClick(event){
    const actionNode=event.target.closest('[data-study-action]');
    const action=actionNode?.dataset.studyAction;
    if(action==='home'){onHome();return;}
    if(action==='all'){
      selectedBlocks=new Set(catalog().units.flatMap(unit=>unit.blocks.map(block=>block.id)));
      renderSelector();return;
    }
    if(action==='clear'){selectedBlocks.clear();renderSelector();return;}
    if(action==='unit'){selectUnit(actionNode.dataset.unitId);return;}
    if(action==='start'){start();return;}
    if(action==='selection'){renderSelector();return;}
    if(action==='previous'){go(-1);return;}
    if(action==='next'){go(1);return;}
    if(action==='shuffle'){shuffle();return;}
    if(event.target.closest('[data-study-card]')){
      flipped=!flipped;
      renderReview();
      announce();
      screen.querySelector('[data-study-card]')?.focus();
    }
  }

  function handleChange(event){
    const input=event.target.closest('[data-study-block] input');
    if(!input)return;
    if(input.checked)selectedBlocks.add(input.value);
    else selectedBlocks.delete(input.value);
    syncSelectionSummary();
  }

  screen.addEventListener('click',handleClick);
  screen.addEventListener('change',handleChange);
  renderSelector();

  return {
    setLanguage(nextLanguage){
      lang=nextLanguage==='es'?'es':'ca';
      if(mode==='review')renderReview();
      else renderSelector();
    },
    destroy(){
      screen.removeEventListener('click',handleClick);
      screen.removeEventListener('change',handleChange);
      screen.innerHTML='';
    }
  };
}
