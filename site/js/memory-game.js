const esc=value=>String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));

function shuffle(items,random=Math.random){
  const copy=items.slice();
  for(let i=copy.length-1;i>0;i--){
    const j=Math.floor(random()*(i+1));
    [copy[i],copy[j]]=[copy[j],copy[i]];
  }
  return copy;
}

export async function loadMemoryGameBank(fetcher=fetch){
  const response=await fetcher('data/memory-game-es.json');
  if(!response.ok)throw new Error('No se pudo cargar el banco de Tarjetas de Memoria.');
  const bank=await response.json();
  if(bank.language!=='es'||!Array.isArray(bank.pairs))throw new Error('Banco de Tarjetas de Memoria inválido.');
  return bank;
}

export function selectBalancedPairs(pairs,count,random=Math.random){
  const groups=new Map();
  for(const pair of pairs){
    if(!groups.has(pair.blockId))groups.set(pair.blockId,[]);
    groups.get(pair.blockId).push(pair);
  }
  const blockIds=[...groups.keys()];
  if(!blockIds.length||count>pairs.length)throw new Error('No hay suficientes parejas para este nivel.');
  const minPerBlock=count>=blockIds.length*2?2:1;
  if(blockIds.some(id=>groups.get(id).length<minPerBlock))throw new Error('Cobertura insuficiente por bloque.');

  const selected=[];
  const leftovers=[];
  for(const id of shuffle(blockIds,random)){
    const group=shuffle(groups.get(id),random);
    selected.push(...group.slice(0,minPerBlock));
    leftovers.push(...group.slice(minPerBlock));
  }
  const remaining=count-selected.length;
  selected.push(...shuffle(leftovers,random).slice(0,remaining));
  return shuffle(selected,random);
}

export function buildMemoryDeck(pairs,random=Math.random){
  const cards=pairs.flatMap(pair=>[
    {id:pair.id+'-left',pairId:pair.id,side:'left',text:pair.left,blockId:pair.blockId},
    {id:pair.id+'-right',pairId:pair.id,side:'right',text:pair.right,blockId:pair.blockId}
  ]);
  return shuffle(cards,random);
}

export function evaluatePair(first,second){
  return Boolean(first&&second&&first.pairId===second.pairId&&first.side!==second.side);
}

export function formatElapsed(seconds){
  const safe=Math.max(0,Math.floor(Number(seconds)||0));
  const minutes=Math.floor(safe/60);
  return minutes+':'+String(safe%60).padStart(2,'0');
}

function sound(success){
  try{
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(!AudioContext)return;
    const context=new AudioContext();
    const oscillator=context.createOscillator();
    const gain=context.createGain();
    oscillator.type='sine';
    oscillator.frequency.value=success?660:190;
    gain.gain.setValueAtTime(.055,context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.0001,context.currentTime+.12);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime+.12);
    oscillator.addEventListener('ended',()=>context.close().catch(()=>{}),{once:true});
  }catch{}
}

function cardHtml(card){
  return `<button type="button" class="memory-card" data-memory-card data-card-id="${esc(card.id)}" data-pair-id="${esc(card.pairId)}" data-matched="false" aria-pressed="false" aria-label="Tarjeta boca abajo">
    <span class="memory-card-inner">
      <span class="memory-card-face back" aria-hidden="true"><span class="memory-card-mark">RA</span></span>
      <span class="memory-card-face front" aria-hidden="true"><span>${esc(card.text)}</span></span>
    </span>
  </button>`;
}

export function createMemoryGame({screen,live,bank,random=Math.random}){
  let level='easy';
  let cards=[];
  let firstId=null;
  let secondId=null;
  let lock=false;
  let moves=0;
  let matches=0;
  let startedAt=null;
  let elapsed=0;
  let timer=null;
  let mismatchTimer=null;
  let hintTimer=null;
  let finished=false;

  const levelCount=()=>level==='easy'?bank.levels.easy.pairs:bank.levels.difficult.pairs;

  function clearTimers(){
    if(timer)clearInterval(timer);
    if(mismatchTimer)clearTimeout(mismatchTimer);
    if(hintTimer)clearTimeout(hintTimer);
    timer=mismatchTimer=hintTimer=null;
  }

  function startClock(){
    if(startedAt||finished)return;
    startedAt=Date.now();
    timer=setInterval(()=>{
      elapsed=Math.floor((Date.now()-startedAt)/1000);
      const node=screen.querySelector('#memory-time');
      if(node)node.textContent=formatElapsed(elapsed);
    },250);
  }

  function stopClock(){
    if(startedAt)elapsed=Math.floor((Date.now()-startedAt)/1000);
    if(timer)clearInterval(timer);
    timer=null;
  }

  function renderShell(){
    screen.innerHTML=`<div class="memory-game-shell">
      <button class="back-button" data-memory-action="home" type="button">← Volver al temario</button>
      <div class="memory-game-heading">
        <div><p class="eyebrow">Juego educativo</p><h1>Tarjetas de memoria</h1><p>Encuentra las parejas relacionadas. Todo el contenido procede del temario del curso.</p></div>
        <div class="memory-game-controls" aria-label="Controles del juego">
          <button type="button" data-memory-action="restart">Reiniciar</button>
          <button type="button" data-memory-action="level">Nivel: ${level==='easy'?'Fácil':'Difícil'}</button>
          <button type="button" data-memory-action="hint">Pista</button>
        </div>
      </div>
      <div class="memory-stats" aria-label="Marcadores">
        <div><span>Movimientos</span><strong id="memory-moves">0</strong></div>
        <div><span>Tiempo</span><strong id="memory-time">0:00</strong></div>
        <div><span>Parejas</span><strong id="memory-matches">0/${levelCount()}</strong></div>
      </div>
      <div class="memory-board" data-level="${level}" aria-label="Tablero de Tarjetas de Memoria">${cards.map(cardHtml).join('')}</div>
      <div id="memory-complete" class="memory-complete" hidden></div>
    </div>`;
  }

  function syncCard(card){
    const button=screen.querySelector('[data-card-id="'+CSS.escape(card.id)+'"]');
    if(!button)return;
    button.classList.toggle('is-flipped',Boolean(card.revealed||card.matched));
    button.classList.toggle('is-matched',Boolean(card.matched));
    button.classList.toggle('is-hint',Boolean(card.hint));
    button.dataset.matched=String(Boolean(card.matched));
    button.setAttribute('aria-pressed',String(Boolean(card.revealed||card.matched)));
    button.disabled=Boolean(card.matched);
    button.setAttribute('aria-label',card.revealed||card.matched?'Tarjeta: '+card.text:'Tarjeta boca abajo');
    const front=button.querySelector('.front');
    if(front)front.setAttribute('aria-hidden',String(!(card.revealed||card.matched)));
  }

  function syncAll(){
    for(const card of cards)syncCard(card);
    screen.querySelector('#memory-moves').textContent=String(moves);
    screen.querySelector('#memory-matches').textContent=matches+'/'+levelCount();
    screen.querySelector('#memory-time').textContent=formatElapsed(elapsed);
  }

  function newRound(){
    clearTimers();
    const pairs=selectBalancedPairs(bank.pairs,levelCount(),random);
    cards=buildMemoryDeck(pairs,random).map(card=>({...card,revealed:false,matched:false,hint:false}));
    firstId=secondId=null;
    lock=false;
    moves=matches=elapsed=0;
    startedAt=null;
    finished=false;
    renderShell();
    live.textContent='Nueva partida de Tarjetas de Memoria. Nivel '+(level==='easy'?'Fácil':'Difícil')+'.';
  }

  function finish(){
    finished=true;
    stopClock();
    const box=screen.querySelector('#memory-complete');
    box.hidden=false;
    box.innerHTML='<strong>¡Tablero completado!</strong><span>'+moves+' movimientos · '+formatElapsed(elapsed)+'</span>';
    live.textContent='Tablero completado en '+moves+' movimientos y '+formatElapsed(elapsed)+'.';
  }

  function choose(cardId){
    if(lock||finished)return;
    const card=cards.find(item=>item.id===cardId);
    if(!card||card.matched||card.revealed)return;
    startClock();
    card.revealed=true;
    syncCard(card);
    if(!firstId){
      firstId=card.id;
      live.textContent='Primera tarjeta seleccionada.';
      return;
    }
    secondId=card.id;
    moves++;
    const first=cards.find(item=>item.id===firstId);
    const second=cards.find(item=>item.id===secondId);
    if(evaluatePair(first,second)){
      first.matched=second.matched=true;
      matches++;
      firstId=secondId=null;
      sound(true);
      syncAll();
      live.textContent='Pareja encontrada.';
      if(matches===levelCount())finish();
      return;
    }
    lock=true;
    second.classList;
    sound(false);
    syncAll();
    live.textContent='No coinciden.';
    for(const item of [first,second]){
      const button=screen.querySelector('[data-card-id="'+CSS.escape(item.id)+'"]');
      button?.classList.add('is-mismatch');
    }
    mismatchTimer=setTimeout(()=>{
      first.revealed=second.revealed=false;
      firstId=secondId=null;
      lock=false;
      for(const item of [first,second]){
        const button=screen.querySelector('[data-card-id="'+CSS.escape(item.id)+'"]');
        button?.classList.remove('is-mismatch');
      }
      syncCard(first);syncCard(second);
    },1000);
  }

  function hint(){
    if(lock||finished)return;
    const candidates=[...new Set(cards.filter(card=>!card.matched&&!card.revealed).map(card=>card.pairId))]
      .filter(pairId=>cards.filter(card=>card.pairId===pairId&&!card.matched).length===2);
    if(!candidates.length)return;
    const pairId=candidates[Math.floor(random()*candidates.length)];
    const pairCards=cards.filter(card=>card.pairId===pairId&&!card.matched);
    for(const card of pairCards)card.hint=true;
    syncAll();
    live.textContent='Pista activada: observa las dos tarjetas resaltadas.';
    if(hintTimer)clearTimeout(hintTimer);
    hintTimer=setTimeout(()=>{
      for(const card of pairCards)card.hint=false;
      syncAll();
    },1200);
  }

  function handleClick(event){
    const cardButton=event.target.closest('[data-memory-card]');
    if(cardButton){choose(cardButton.dataset.cardId);return;}
    const action=event.target.closest('[data-memory-action]')?.dataset.memoryAction;
    if(action==='restart'){newRound();return;}
    if(action==='level'){level=level==='easy'?'difficult':'easy';newRound();return;}
    if(action==='hint'){hint();return;}
  }

  screen.addEventListener('click',handleClick);
  newRound();

  return {
    restart:newRound,
    destroy(){
      clearTimers();
      screen.removeEventListener('click',handleClick);
      screen.innerHTML='';
    }
  };
}
