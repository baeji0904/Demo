import { state } from './state.js';
import { elementLabel, elementIcon, elementClass } from './cardData.js';

const handEl   = document.getElementById('hand');
const enemyHandEl = document.getElementById('enemyHand');   // ✅ 적 손패 컨테이너
const logEl    = document.getElementById('log');
const barEnemy = document.getElementById('barEnemy');
const barPlayer= document.getElementById('barPlayer');
const txtEnemyHP = document.getElementById('txtEnemyHP');
const txtPlayerHP= document.getElementById('txtPlayerHP');
const elStage  = document.getElementById('uiStage');
const elTurn   = document.getElementById('uiTurn');
const uiEnemyElem = document.getElementById('uiEnemyElem');
const uiPlayerElem= document.getElementById('uiPlayerElem');
const toastEl  = document.getElementById('toast');
const battleArea = document.getElementById('battleArea');
const tblLeaderboardBody = document.querySelector('#tblLeaderboard tbody');

export function getPlayerDefenseElement(){
  const counts = {fire:0,poison:0,electric:0,water:0};
  state.deck.forEach(d=>{
    const e=d.card.element;
    if(counts[e]!=null) counts[e]++;
  });
  let best=null,bestCount=0;
  for(const [e,c] of Object.entries(counts)){
    if(c>bestCount){bestCount=c;best=e;}
    else if(c===bestCount && c>0){best=null;}
  }
  return best || 'normal';
}

export function updateBars(){
  const pRate = Math.max(0, Math.min(1, state.playerHP/state.playerMaxHP));
  const eRate = Math.max(0, Math.min(1, state.enemyHP/state.enemyMaxHP));
  barPlayer.style.width = (pRate*100)+'%';
  barEnemy.style.width  = (eRate*100)+'%';
  txtPlayerHP.textContent = `${state.playerHP} / ${state.playerMaxHP}`;
  txtEnemyHP.textContent  = `${state.enemyHP} / ${state.enemyMaxHP}`;
  elStage.textContent = state.stage;
  elTurn.textContent  = state.turn;
  uiEnemyElem.textContent  = elementLabel(state.enemyElem);
  uiPlayerElem.textContent = elementLabel(getPlayerDefenseElement());
}

export function createCardElement(card){
  const div = document.createElement('div');
  div.className = 'card-ui';
  div.dataset.element = card.element;

  const top = document.createElement('div');
  top.className = 'card-top-row';
  const tag = document.createElement('div');
  tag.className = 'card-tag';
  tag.textContent = '노멀';
  const elem = document.createElement('div');
  elem.className = 'card-element-pill '+elementClass(card.element);
  elem.innerHTML = `<span class="icon">${elementIcon(card.element)}</span><span>${elementLabel(card.element)}</span>`;
  top.appendChild(tag);
  top.appendChild(elem);
  div.appendChild(top);

  const nameArea = document.createElement('div');
  nameArea.className = 'card-name-area';
  nameArea.innerHTML = `<div class="card-name">${card.name}</div><div class="card-role">공격</div>`;
  div.appendChild(nameArea);

  const body = document.createElement('div');
  body.className = 'card-body';
  body.textContent = card.description;
  div.appendChild(body);

  const stats = document.createElement('div');
  stats.className = 'card-stats';
  stats.innerHTML = `
    <div><span>⚔ 공격력</span><span>${card.power}</span></div>
    <div><span>🎯 명중률</span><span>${Math.round(card.hit*100)}%</span></div>
    <div><span>🔁 발동</span><span>${card.repeat}</span></div>
  `;
  div.appendChild(stats);

  return div;
}

export function renderHand(){
  handEl.innerHTML = '';
  state.deck.forEach((d,idx)=>{
    const el = createCardElement(d.card);
    el.dataset.index = idx;
    handEl.appendChild(el);
  });
}

/* ✅ 적 손패 렌더링 */
export function renderEnemyHand(){
  if(!enemyHandEl) return;
  enemyHandEl.innerHTML = '';
  state.enemyDeck.forEach(d=>{
    const el = createCardElement(d.card);
    el.classList.add('card-enemy');
    enemyHandEl.appendChild(el);
  });
}

export function appendLog(text){
  const div = document.createElement('div');
  div.className = 'log-entry';
  div.innerHTML = `<span class="turn">[T${state.turn}]</span> ${text}`;
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
}

export function showToast(msg){
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(()=>toastEl.classList.remove('show'), 1400);
}

export function floatText(type,target,value){
  const span = document.createElement('div');
  span.className='damage-float';
  if(type==='player-dmg'){ span.classList.add('damage-player'); span.textContent=`-${value}`; }
  else if(type==='enemy-dmg'){ span.classList.add('damage-enemy'); span.textContent=`-${value}`; }
  else if(type==='heal'){ span.classList.add('damage-heal'); span.textContent=`+${value}`; }
  else if(type==='miss'){ span.classList.add('damage-miss'); span.textContent='MISS'; }

  const rect = battleArea.getBoundingClientRect();
  let x = rect.width/2, y = rect.height/2;
  if(target==='enemy'){ x = rect.width*0.75; y = 34; }
  else if(target==='player'){ x = rect.width*0.25; y = 72; }

  span.style.left = `${x}px`;
  span.style.top  = `${y}px`;
  battleArea.appendChild(span);
  span.addEventListener('animationend',()=>span.remove());
}

export function renderLeaderboardTable(entries){
  tblLeaderboardBody.innerHTML = '';
  if(entries.length===0){
    const tr=document.createElement('tr');
    const td=document.createElement('td');
    td.colSpan=7;
    td.textContent='기록이 없습니다.';
    tr.appendChild(td);
    tblLeaderboardBody.appendChild(tr);
    return;
  }
  entries.forEach((e,idx)=>{
    const tr=document.createElement('tr');
    const date=new Date(e.date);
    const cells=[
      idx+1,
      e.name,
      e.stage,
      e.turns,
      e.damage,
      e.taken,
      date.toLocaleDateString()
    ];
    cells.forEach(v=>{
      const td=document.createElement('td');
      td.textContent=v;
      tr.appendChild(td);
    });
    tblLeaderboardBody.appendChild(tr);
  });
}
