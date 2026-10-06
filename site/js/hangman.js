const esc=v=>String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

const COPY={
  ca:{back:"← Tornar",eyebrow:"Joc de repàs",title:"Penjat de conceptes",subtitle:"Endevina el concepte a partir d’una pista o definició. El banc cobreix tots els blocs publicats del curs.",filter:"Bloc o tema",all:"Tot el curs",hint:"Pista",errors:"Errors",wins:"Encerts",streak:"Ratxa",letters:"Teclat de lletres",newWord:"Nova paraula",won:"Correcte. Has completat el concepte.",lost:"S'han acabat els intents.",answer:"Resposta",memory:"Per recordar",source:"Font",empty:"No hi ha conceptes aptes per jugar en aquesta selecció.",words:"paraules",lettersCount:"lletres",playable:"conceptes disponibles",languageChangeWarning:"Canviar l\'idioma reiniciarà la ronda actual. Vols continuar?"},
  es:{back:"← Volver",eyebrow:"Juego de repaso",title:"Ahorcado de conceptos",subtitle:"Adivina el concepto a partir de una pista o definición. El banco cubre todos los bloques publicados del curso.",filter:"Bloque o tema",all:"Todo el curso",hint:"Pista",errors:"Errores",wins:"Aciertos",streak:"Racha",letters:"Teclado de letras",newWord:"Nueva palabra",won:"Correcto. Has completado el concepto.",lost:"Se han acabado los intentos.",answer:"Respuesta",memory:"Para recordar",source:"Fuente",empty:"No hay conceptos aptos para jugar en esta selección.",words:"palabras",lettersCount:"letras",playable:"conceptos disponibles",languageChangeWarning:"Cambiar el idioma reiniciará la ronda actual. ¿Quieres continuar?"}
};

const ALPHABETS={
  ca:["A","B","C","Ç","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"],
  es:["A","B","C","D","E","F","G","H","I","J","K","L","M","N","Ñ","O","P","Q","R","S","T","U","V","W","X","Y","Z"]
};

const ACCENT_MAP=new Map(Object.entries({
  á:"a",à:"a",ä:"a",â:"a",ã:"a",å:"a",Á:"a",À:"a",Ä:"a",Â:"a",Ã:"a",Å:"a",
  é:"e",è:"e",ë:"e",ê:"e",É:"e",È:"e",Ë:"e",Ê:"e",
  í:"i",ì:"i",ï:"i",î:"i",Í:"i",Ì:"i",Ï:"i",Î:"i",
  ó:"o",ò:"o",ö:"o",ô:"o",õ:"o",Ó:"o",Ò:"o",Ö:"o",Ô:"o",Õ:"o",
  ú:"u",ù:"u",ü:"u",û:"u",Ú:"u",Ù:"u",Ü:"u",Û:"u"
}));

const isLetter=char=>/^[A-Za-zÀ-ÖØ-öø-ÿ]$/u.test(char);
export function foldLetter(char){
  if(!char)return "";
  if(char==="ç"||char==="Ç")return "ç";
  if(char==="ñ"||char==="Ñ")return "ñ";
  return ACCENT_MAP.get(char)??char.toLocaleLowerCase();
}
export function isPlayableEntry(entry,language="ca"){
  const lang=language==="es"?"es":"ca";
  const term=entry?.[lang]?.term?.trim()||"";
  if(!term||/[0-9./:;=+<>→←]/u.test(term)||/vs/i.test(term))return false;
  const letters=[...term].filter(isLetter);
  const words=term.split(/\s+/u).filter(Boolean);
  const longest=Math.max(0,...words.map(word=>[...word].filter(isLetter).length));
  return letters.length>=4&&letters.length<=45&&words.length<=6&&longest<=18;
}
export function playableEntries(bank,{language="ca",blockId="all"}={}){
  return (bank?.entries||[]).filter(entry=>(blockId==="all"||entry.blockId===blockId)&&isPlayableEntry(entry,language));
}
export function termHasGuess(term,guess){const g=foldLetter(guess);return [...term].some(char=>isLetter(char)&&foldLetter(char)===g);}
export function maskedTerm(term,guessed=[]){
  const set=guessed instanceof Set?guessed:new Set(guessed);
  return [...term].map(char=>!isLetter(char)?char:(set.has(foldLetter(char))?char:"_")).join("");
}
export function isSolved(term,guessed=[]){return ![...maskedTerm(term,guessed)].includes("_");}

function sourceLabel(source){
  const pages=source?.pages||[];
  if(!source?.id||!pages.length)return source?.id||"";
  const [start,end=start]=pages;
  return start===end?`${source.id} · p. ${start}`:`${source.id} · pp. ${start}–${end}`;
}
function groupLabel(bank,id,lang){const group=(bank?.groups||[]).find(item=>item.id===id);return group?.[lang]||group?.ca||id;}
function termStats(term,c){
  const words=term.split(/\s+/u).filter(Boolean).length;
  const letters=[...term].filter(isLetter).length;
  return `${words} ${c.words} · ${letters} ${c.lettersCount}`;
}
function wordTokenHtml(token,guessed,finished){
  const letterCount=[...token].filter(isLetter).length;
  const sizeClass=letterCount>=15?" is-long-word":"";
  const chars=[...token].map(char=>{
    if(!isLetter(char))return `<span class="hangman-punct">${esc(char)}</span>`;
    const shown=finished||guessed.has(foldLetter(char));
    return `<span class="hangman-char ${shown?"is-revealed":""}">${shown?esc(char):"&nbsp;"}</span>`;
  }).join("");
  return `<span class="hangman-word-token${sizeClass}" data-letter-count="${letterCount}">${chars}</span>`;
}
function wordHtml(term,guessed,finished){
  return term.trim().split(/\s+/u).filter(Boolean).map(token=>wordTokenHtml(token,guessed,finished)).join("");
}
function drawingHtml(wrong){
  const show=n=>wrong>=n?"is-visible":"";
  return `<svg class="hangman-drawing" viewBox="0 0 180 180" aria-hidden="true">
    <path class="hangman-gallows" d="M24 164H156M50 164V18H124V38"/>
    <circle class="hangman-person ${show(1)}" cx="124" cy="54" r="16"/>
    <path class="hangman-person ${show(2)}" d="M124 70V112"/>
    <path class="hangman-person ${show(3)}" d="M124 82L101 99"/>
    <path class="hangman-person ${show(4)}" d="M124 82L147 99"/>
    <path class="hangman-person ${show(5)}" d="M124 112L104 143"/>
    <path class="hangman-person ${show(6)}" d="M124 112L144 143"/>
  </svg>`;
}
function keyboardHtml(lang,guessed,finished){
  return ALPHABETS[lang].map(letter=>{
    const folded=foldLetter(letter);
    return `<button type="button" data-hangman-letter="${esc(folded)}" ${guessed.has(folded)||finished?"disabled":""}>${esc(letter)}</button>`;
  }).join("");
}

export async function loadHangmanBank(fetcher=fetch){
  const response=await fetcher('data/hangman-bank-v2.json');
  if(!response.ok)throw new Error('No s’ha pogut carregar el banc del penjat.');
  const bank=await response.json();
  if(bank?.version!=='2.0'||!Array.isArray(bank.entries)||!bank.entries.length||bank.count!==bank.entries.length){
    throw new Error('Banc del penjat invàlid.');
  }
  if(!Array.isArray(bank.groups)||!bank.groups.length||!Array.isArray(bank.languages)||!bank.languages.includes('ca')||!bank.languages.includes('es')){
    throw new Error('Banc del penjat incomplet.');
  }
  for(const entry of bank.entries){
    if(!entry?.id||!entry?.blockId||!entry?.source?.id||!entry?.ca?.term||!entry?.ca?.hint||!entry?.es?.term||!entry?.es?.hint||
       !isPlayableEntry(entry,'ca')||!isPlayableEntry(entry,'es'))throw new Error('Banc del penjat amb una entrada invàlida.');
  }
  return bank;
}

export function createHangman({screen,bank,language="ca",onHome=()=>{}}){
  let lang=language==="es"?"es":"ca";
  let blockId="all";
  let current=null;
  let previousId=null;
  let guessed=new Set();
  let wrong=0;
  let finished=false;
  let played=0;
  let wins=0;
  let streak=0;
  const maxWrong=6;

  function pool(){return playableEntries(bank,{language:lang,blockId});}
  function chooseRound({keepCurrent=false}={}){
    const entries=pool();
    if(!entries.length){current=null;guessed=new Set();wrong=0;finished=false;render();return;}
    if(!keepCurrent||!current||!entries.some(entry=>entry.id===current.id)){
      const candidates=entries.length>1?entries.filter(entry=>entry.id!==previousId):entries;
      current=candidates[Math.floor(Math.random()*candidates.length)];
      previousId=current.id;
    }
    guessed=new Set();wrong=0;finished=false;render();
  }
  function render(){
    const c=COPY[lang];
    const entries=pool();
    const groups=(bank?.groups||[]).filter(group=>playableEntries(bank,{language:lang,blockId:group.id}).length);
    const options=[`<option value="all" ${blockId==="all"?"selected":""}>${esc(c.all)}</option>`,...groups.map(group=>`<option value="${esc(group.id)}" ${blockId===group.id?"selected":""}>${esc(group[lang]||group.ca||group.id)}</option>`)].join("");
    if(!current&&entries.length)current=entries[0];
    const body=!current?`<div class="hangman-empty">${esc(c.empty)}</div>`:(()=>{
      const item=current[lang];
      const solved=isSolved(item.term,guessed);
      const memory=item.memory?`<p><span>${esc(c.memory)}:</span> ${esc(item.memory)}</p>`:"";
      const result=finished?`<div class="hangman-feedback ${solved?"is-win":"is-loss"}"><strong>${esc(solved?c.won:c.lost)}</strong><p><span>${esc(c.answer)}:</span> ${esc(item.term)}</p>${memory}<p class="hangman-source"><span>${esc(c.source)}:</span> ${esc(sourceLabel(current.source))}</p></div>`:"";
      return `<div class="hangman-round" data-hangman-entry="${esc(current.id)}">
        <div class="hangman-stage">
          <div class="hangman-visual">${drawingHtml(wrong)}<strong>${esc(c.errors)}: ${wrong} / ${maxWrong}</strong></div>
          <div class="hangman-clue">
            <p class="eyebrow">${esc(c.hint)}</p>
            <p class="hangman-definition">${esc(item.hint||item.definition||"")}</p>
            <p class="hangman-category">${esc(groupLabel(bank,current.blockId,lang))}</p>
          </div>
        </div>
        <div class="hangman-word" aria-label="${esc(maskedTerm(item.term,guessed))}">${wordHtml(item.term,guessed,finished)}</div>
        <p class="hangman-term-stats">${esc(termStats(item.term,c))}</p>
        <div class="hangman-keyboard" role="group" aria-label="${esc(c.letters)}">${keyboardHtml(lang,guessed,finished)}</div>
        ${result}
        <div class="hangman-actions"><button class="primary" type="button" data-hangman-action="new">${esc(c.newWord)}</button></div>
      </div>`;
    })();
    screen.innerHTML=`<div class="hangman-shell">
      <div class="hangman-toolbar"><button class="back-button" type="button" data-hangman-action="home">${esc(c.back)}</button></div>
      <header class="hangman-head"><p class="eyebrow">${esc(c.eyebrow)}</p><h1>${esc(c.title)}</h1><p>${esc(c.subtitle)}</p></header>
      <div class="hangman-summary"><span><strong>${wins}</strong> ${esc(c.wins)}</span><span><strong>${streak}</strong> ${esc(c.streak)}</span><span><strong>${entries.length}</strong> ${esc(c.playable)}</span></div>
      <label class="hangman-filter"><span>${esc(c.filter)}</span><select data-hangman-filter>${options}</select></label>
      ${body}
    </div>`;
  }
  function finishIfNeeded(){
    if(!current||finished)return;
    const term=current[lang].term;
    const solved=isSolved(term,guessed);
    if(solved||wrong>=maxWrong){finished=true;played+=1;if(solved){wins+=1;streak+=1;}else streak=0;}
  }
  function handleClick(event){
    if(event.target.closest('[data-hangman-action="home"]')){onHome();return;}
    if(event.target.closest('[data-hangman-action="new"]')){chooseRound();return;}
    const letterButton=event.target.closest("[data-hangman-letter]");
    if(!letterButton||finished||!current)return;
    const guess=letterButton.dataset.hangmanLetter;
    if(guessed.has(guess))return;
    guessed.add(guess);
    if(!termHasGuess(current[lang].term,guess))wrong+=1;
    finishIfNeeded();
    render();
  }
  function handleChange(event){
    const select=event.target.closest("[data-hangman-filter]");
    if(!select)return;
    blockId=select.value||"all";
    current=null;
    chooseRound();
  }
  screen.addEventListener("click",handleClick);
  screen.addEventListener("change",handleChange);
  chooseRound();
  return {
    confirmLanguageChange(nextLanguage){
      const target=nextLanguage==="es"?"es":"ca";
      if(target===lang||!current||finished)return true;
      return window.confirm(COPY[lang].languageChangeWarning);
    },
    setLanguage(nextLanguage){
      lang=nextLanguage==="es"?"es":"ca";
      blockId=playableEntries(bank,{language:lang,blockId}).length?blockId:"all";
      chooseRound({keepCurrent:true});
    },
    destroy(){
      screen.removeEventListener("click",handleClick);
      screen.removeEventListener("change",handleChange);
      screen.innerHTML="";
    }
  };
}
