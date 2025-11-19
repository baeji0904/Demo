import { state, SPEED_DELAY, saveGame, saveToLeaderboard } from './state.js';
import { findCard, pickRandomCards, elementMultiplier, CARD_LIBRARY } from './cardData.js';
import { renderHand, renderEnemyHand, appendLog, updateBars, floatText, showToast, createCardElement, getPlayerDefenseElement } from './ui.js';
import { audio } from './audio.js';

/* 오버레이 DOM */
const ovReward          = document.getElementById('ovReward');
const ovRewardTitle     = document.getElementById('ovRewardTitle');
const ovRewardCards     = document.getElementById('ovRewardCards');
const ovRewardViewHand  = document.getElementById('ovRewardViewHand');
const ovRewardReroll    = document.getElementById('ovRewardReroll');
const ovRewardAdd       = document.getElementById('ovRewardAdd');
const ovRewardReplace   = document.getElementById('ovRewardReplace');
const ovRewardSkip      = document.getElementById('ovRewardSkip');

const ovReplace         = document.getElementById('ovReplace');
const ovReplaceCards    = document.getElementById('ovReplaceCards');
const ovReplaceCancel   = document.getElementById('ovReplaceCancel');

const ovGameOver  = document.getElementById('ovGameOver');
const ovGoName    = document.getElementById('ovGoName');
const ovGoStage   = document.getElementById('ovGoStage');
const ovGoTurns   = document.getElementById('ovGoTurns');
const ovGoDamage  = document.getElementById('ovGoDamage');
const ovGoTaken   = document.getElementById('ovGoTaken');
const ovGoMenu    = document.getElementById('ovGoMenu');
const ovGoRetry   = document.getElementById('ovGoRetry');

let loopToken = 0;
let rewardPool = [];
let rewardSelectedId = null;
let rewardRerolled = false;
let replaceIndexTarget = null;

/* 스테이지 세팅 */

function setupStage(){
  // HP / 속성
  state.enemyMaxHP = 12 + (state.stage-1)*4;
  state.enemyHP    = state.enemyMaxHP;
  const elems = ['normal','fire','poison','electric','water'];
  state.enemyElem  = elems[state.stage % elems.length];

  // ✅ 적 덱 구성 (스테이지에 따라 카드 수 증가)
  const deckSize = Math.min(10, 3 + Math.floor((state.stage-1)/2)); // 3장부터 시작, 2스테이지마다 +1, 최대 10
  state.enemyDeck = [];
  for(let i=0;i<deckSize;i++){
    const idx = (state.stage + i) % CARD_LIBRARY.length;
    const card = CARD_LIBRARY[idx];
    state.enemyDeck.push({ id:card.id, card });
  }

  renderEnemyHand();
  updateBars();
  appendLog(`스테이지 ${state.stage} 시작! (적 카드 ${deckSize}장)`);
}

/* 적 턴: 덱 기반 공격 */

function enemyAttack(){
  if(!state.enemyDeck || state.enemyDeck.length===0){
    // 안전 장치: 덱이 비어 있으면 기존 고정 피해 사용
    const dmg = 2 + Math.floor((state.stage-1)/2);
    state.playerHP = Math.max(0, state.playerHP - dmg);
    state.totalDamageTaken += dmg;
    audio.hurt();
    floatText('player-dmg','player',dmg);
    appendLog(`적이 공격합니다. 플레이어가 ${dmg} 피해를 입었습니다.`);
    return;
  }

  const defenseElem = getPlayerDefenseElement();
  let total = 0;
  let anyHit = false;

  state.enemyDeck.forEach(item=>{
    const c = item.card;
    for(let i=0;i<c.repeat;i++){
      if(state.playerHP<=0) break;
      if(Math.random() <= c.hit){
        const mul = elementMultiplier(c.element, defenseElem);
        const dmg = Math.max(1, Math.round(c.power*mul*0.9));
        state.playerHP = Math.max(0, state.playerHP - dmg);
        state.totalDamageTaken += dmg;
        total += dmg;
        anyHit = true;
        floatText('player-dmg','player',dmg);
      }else{
        floatText('miss','player',0);
      }
    }
  });

  if(anyHit){
    audio.hurt();
    appendLog(`적이 카드들을 사용해 총 ${total} 피해를 줍니다.`);
  }else{
    audio.miss();
    appendLog('적의 공격이 모두 빗나갔습니다.');
  }

  if(state.playerHP<=0){
    state.playerHP=0;
    appendLog('플레이어가 쓰러졌습니다.');
  }
}

/* 턴 루프 */

async function doTurnLoop(token){
  if(state.gameOver) return;
  state.running = true;
  updateBars();

  while(!state.gameOver && state.enemyHP>0 && state.playerHP>0 && token===loopToken){
    state.turn++;
    updateBars();
    appendLog(`턴 ${state.turn} 시작.`);

    // 플레이어 카드
    for(const item of state.deck){
      if(state.enemyHP<=0 || state.playerHP<=0 || token!==loopToken) break;
      const c = item.card;
      for(let i=0;i<c.repeat;i++){
        if(state.enemyHP<=0 || state.playerHP<=0 || token!==loopToken) break;
        const delay = SPEED_DELAY[state.speed];
        await new Promise(r=>setTimeout(r,delay));
        if(Math.random() <= c.hit){
          const mul = elementMultiplier(c.element, state.enemyElem);
          const dmg = Math.max(1, Math.round(c.power*mul));
          state.enemyHP = Math.max(0, state.enemyHP - dmg);
          state.totalDamageDealt += dmg;
          audio.hit();
          floatText('enemy-dmg','enemy',dmg);
          const extra = mul>1 ? ' (상성 유리!)' : mul<1 ? ' (상성 불리)' : '';
          appendLog(`${c.name} → 적에게 ${dmg} 피해.${extra}`);
          updateBars();
        }else{
          audio.miss();
          floatText('miss','enemy',0);
          appendLog(`${c.name} → 빗나갔습니다.`);
        }
      }
    }

    // 적 쓰러짐
    if(state.enemyHP<=0){
      state.enemyHP=0;
      updateBars();
      appendLog(`스테이지 ${state.stage} 클리어!`);
      audio.stage();
      state.running=false;
      await new Promise(r=>setTimeout(r,500));
      handleStageClear();          // ✅ 이제 제대로 정의됨
      return;
    }

    // 적 공격
    const delay = SPEED_DELAY[state.speed];
    await new Promise(r=>setTimeout(r,delay));
    if(state.playerHP>0){
      enemyAttack();
      updateBars();
    }
    if(state.playerHP<=0){
      state.playerHP=0;
      state.running=false;
      updateBars();
      audio.over();
      await new Promise(r=>setTimeout(r,500));
      handleGameOver();
      return;
    }
  }
  state.running=false;
}

/* 스테이지 클리어 → 보상 오버레이 */

function renderRewardCards(){
  ovRewardCards.innerHTML='';
  rewardPool.forEach(card=>{
    const el = createCardElement(card);
    el.dataset.id = card.id;
    if(card.id===rewardSelectedId) el.classList.add('selected');
    el.addEventListener('click',()=>{
      rewardSelectedId = card.id;
      renderRewardCards();
    });
    ovRewardCards.appendChild(el);
  });
}

function openRewardOverlay(){
  rewardSelectedId = null;
  rewardRerolled = false;
  rewardPool = pickRandomCards(4);
  renderRewardCards();
  ovRewardTitle.textContent = `스테이지 ${state.stage} 클리어!`;
  ovReward.classList.add('show');
  saveGame();
}

/* ✅ 실제로 호출되는 스테이지 클리어 함수 */
function handleStageClear(){
  openRewardOverlay();
}

/* 보상 동작들 */

function applyRewardAdd(){
  if(!rewardSelectedId){
    showToast('카드를 먼저 선택해 주세요.');
    return;
  }
  if(state.deck.length>=10){
    showToast('손패는 최대 10장까지입니다.');
    return;
  }
  const card = findCard(rewardSelectedId);
  state.deck.push({id:card.id, card});
  appendLog(`보상으로 ${card.name} 카드를 얻었습니다.`);
  ovReward.classList.remove('show');
  renderHand();
  state.stage++;
  startBattle();
}

function openReplaceOverlay(){
  if(!rewardSelectedId){
    showToast('카드를
