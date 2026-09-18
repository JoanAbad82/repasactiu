const esc=value=>String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));

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
  const response=await fetcher('data/study-cards-es.json');
  if(!response.ok)throw new Error('No se pudo cargar el banco de Tarjetas de memoria.');
  const bank=await response.json();
  if(bank.language!=='es'||!Array.isArray(bank.cards))throw new Error('Banco de Tarjetas de memoria inválido.');
  return bank;
}

function cardHtml(card,index,total,flipped){
  return `<div class="study-card-stage">
    <button type="button" class="study-card-nav previous" data-study-action="previous" aria-label="Tarjeta anterior">‹</button>
    <button type="button" class="study-card${flipped?' is-flipped':''}" data-study-card aria-pressed="${String(flipped)}" aria-label="${flipped?'Mostrar pregunta':'Mostrar respuesta'}">
      <span class="study-card-inner">
        <span class="study-card-face front" aria-hidden="${String(flipped)}">
          <span class="study-card-kicker">PREGUNTA</span>
          <span class="study-card-question" data-study-question>${esc(card.question)}</span>
          <span class="study-card-tap">Toca para girar</span>
        </span>
        <span class="study-card-face back" aria-hidden="${String(!flipped)}">
          <span class="study-card-kicker answer">RESPUESTA</span>
          <span class="study-card-answer" data-study-answer>${esc(card.answer)}</span>
          <span class="study-card-mnemonic">
            <span class="study-card-mnemonic-label">Mnemotecnia</span>
            <span data-study-mnemonic>${esc(card.mnemonic)}</span>
          </span>
        </span>
      </span>
    </button>
    <button type="button" class="study-card-nav next" data-study-action="next" aria-label="Siguiente tarjeta">›</button>
  </div>
  <div class="study-card-progress" id="study-card-progress">${index+1} / ${total}</div>
  <p class="study-card-instruction">Gira la tarjeta para ver la respuesta</p>`;
}

export function createStudyCards({screen,live,bank,random=Math.random,onHome=()=>{}}){
  let order=bank.cards.slice();
  let index=0;
  let flipped=false;

  function render(){
    const card=order[index];
    screen.innerHTML=`<div class="study-cards-shell">
      <div class="study-cards-toolbar">
        <button class="back-button" data-study-action="home" type="button">← Volver al temario</button>
        <button class="study-card-shuffle" data-study-action="shuffle" type="button">↝ Barajar</button>
      </div>
      ${cardHtml(card,index,order.length,flipped)}
    </div>`;
  }

  function announce(){
    const card=order[index];
    live.textContent=flipped
      ?'Respuesta mostrada. '+card.answer
      :'Pregunta '+(index+1)+' de '+order.length+'.';
  }

  function go(delta){
    index=wrapIndex(index+delta,order.length);
    flipped=false;
    render();
    announce();
  }

  function shuffle(){
    order=shuffleCards(order,random);
    index=0;
    flipped=false;
    render();
    live.textContent='Tarjetas barajadas. Pregunta 1 de '+order.length+'.';
  }

  function handleClick(event){
    const action=event.target.closest('[data-study-action]')?.dataset.studyAction;
    if(action==='home'){onHome();return;}
    if(action==='previous'){go(-1);return;}
    if(action==='next'){go(1);return;}
    if(action==='shuffle'){shuffle();return;}
    if(event.target.closest('[data-study-card]')){
      flipped=!flipped;
      render();
      announce();
      screen.querySelector('[data-study-card]')?.focus();
    }
  }

  screen.addEventListener('click',handleClick);
  render();
  announce();

  return {
    destroy(){
      screen.removeEventListener('click',handleClick);
      screen.innerHTML='';
    }
  };
}
