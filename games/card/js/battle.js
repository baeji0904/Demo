import { state, SPEED_DELAY, saveGame, saveToLeaderboard } from './state.js';
import {
  findCard,
  pickRandomCards,
  elementMultiplier,
  CARD_LIBRARY,
} from './cardData.js';
import {
  renderHand,
  renderEnemyHand,
  appendLog,
  updateBars,
  floatText,
  showToast,
  createCardElement,
  getPlayerDefenseElement,
} from './ui.js';
import { audio } from './audio.js';

/* ===== 오버레이 DOM ===== */
const ovReward = document.getElementById('ovReward');
const ovRewardTitle = document.getElementById('ovRewardTitle');
const ovRewardCards = document.getElementById('ovRewardCards');
const ovRewardViewHand = document.getElementById('ovRewardViewHand');
const ovRewardReroll = document.getElementById('ovRewardReroll');
const ovRewardAdd = document.getElementById('ovRewardAdd');
const ovRewardReplace = document.getElementById('ovRewardReplace');
const ovRewardSkip = document.getElementById('ovRewardSkip');

const ovReplace = document.getElementById('ovReplace');
const ovReplaceCards = document.getElementById('ovReplaceCards');
const ovReplaceCancel = document.getElementById('ovReplaceCancel');

const ovGameOver = document.getElementById('ovGameOver');
const ovGoName = document.getElementById('ovGoName');
const ovGoStage = document.getElementById('ovGoStage');
const ovGoTurns = document.getElementById('ovGoTurns');
const ovGoDamage = document.getElementById('ovGoDamage');
const ovGoTaken = document.getElementById('ovGoTaken');
const ovGoMenu = document.getElementById('ovGoMenu');
const ovGoRetry = document.getElementById('ovGoRetry');

/* ===== 상태 ===== */
let loopToken = 0;
let rewardPool = [];
let rewardSelectedId = null;
let rewardRerolled = false;
let replaceIndexTarget = null;

/* ===== 스테이지 설정 ===== */

function setupStage() {
  // 적 HP / 속성
  state.enemyMaxHP = 12 + (state.stage - 1) * 4;
  state.enemyHP = state.enemyMaxHP;

  const elems = ['normal', 'fire', 'poison', 'electric', 'water'];
  state.enemyElem = elems[state.stage % elems.length];

  // 적 덱 구성 (스테이지에 따라 카드 수 증가)
  const deckSize = Math.min(10, 3 + Math.floor((state.stage - 1) / 2)); // 3장부터 시작, 2스테이지마다 +1, 최대 10
  state.enemyDeck = [];

  for (let i = 0; i < deckSize; i += 1) {
    const idx = (state.stage + i) % CARD_LIBRARY.length;
    const card = CARD_LIBRARY[idx];
    state.enemyDeck.push({ id: card.id, card });
  }

  renderEnemyHand();
  updateBars();
  appendLog(`스테이지 ${state.stage} 시작! (적 카드 ${deckSize}장)`);
}

/* ===== 적 공격 ===== */

function enemyAttack() {
  // 적 덱이 비어 있으면 안전장치로 고정 피해
  if (!state.enemyDeck || state.enemyDeck.length === 0) {
    const dmg = 2 + Math.floor((state.stage - 1) / 2);
    state.playerHP = Math.max(0, state.playerHP - dmg);
    state.totalDamageTaken += dmg;
    audio.hurt();
    floatText('player-dmg', 'player', dmg);
    appendLog(`적이 공격합니다. 플레이어가 ${dmg} 피해를 입었습니다.`);
    return;
  }

  const defenseElem = getPlayerDefenseElement();
  let totalDamage = 0;
  let anyHit = false;

  state.enemyDeck.forEach((item) => {
    const c = item.card;
    for (let i = 0; i < c.repeat; i += 1) {
      if (state.playerHP <= 0) break;

      if (Math.random() <= c.hit) {
        const mul = elementMultiplier(c.element, defenseElem);
        const dmg = Math.max(1, Math.round(c.power * mul * 0.9));
        state.playerHP = Math.max(0, state.playerHP - dmg);
        state.totalDamageTaken += dmg;
        totalDamage += dmg;
        anyHit = true;
        floatText('player-dmg', 'player', dmg);
      } else {
        floatText('miss', 'player', 0);
      }
    }
  });

  if (anyHit) {
    audio.hurt();
    appendLog(`적이 카드들을 사용해 총 ${totalDamage} 피해를 줍니다.`);
  } else {
    audio.miss();
    appendLog('적의 공격이 모두 빗나갔습니다.');
  }

  if (state.playerHP <= 0) {
    state.playerHP = 0;
    appendLog('플레이어가 쓰러졌습니다.');
  }
}

/* ===== 턴 루프 ===== */

async function doTurnLoop(token) {
  if (state.gameOver) return;

  state.running = true;
  updateBars();

  while (
    !state.gameOver &&
    state.enemyHP > 0 &&
    state.playerHP > 0 &&
    token === loopToken
  ) {
    state.turn += 1;
    updateBars();
    appendLog(`턴 ${state.turn} 시작.`);

    // 플레이어 카드 사용
    for (const item of state.deck) {
      if (state.enemyHP <= 0 || state.playerHP <= 0 || token !== loopToken) break;
      const c = item.card;

      for (let i = 0; i < c.repeat; i += 1) {
        if (state.enemyHP <= 0 || state.playerHP <= 0 || token !== loopToken) {
          break;
        }

        const delay = SPEED_DELAY[state.speed];
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, delay));

        if (Math.random() <= c.hit) {
          const mul = elementMultiplier(c.element, state.enemyElem);
          const dmg = Math.max(1, Math.round(c.power * mul));
          state.enemyHP = Math.max(0, state.enemyHP - dmg);
          state.totalDamageDealt += dmg;
          audio.hit();
          floatText('enemy-dmg', 'enemy', dmg);

          let extra = '';
          if (mul > 1) extra = ' (상성 유리!)';
          else if (mul < 1) extra = ' (상성 불리)';

          appendLog(`${c.name} → 적에게 ${dmg} 피해.${extra}`);
          updateBars();
        } else {
          audio.miss();
          floatText('miss', 'enemy', 0);
          appendLog(`${c.name} → 빗나갔습니다.`);
        }
      }
    }

    // 적 쓰러짐 체크
    if (state.enemyHP <= 0) {
      state.enemyHP = 0;
      updateBars();
      appendLog(`스테이지 ${state.stage} 클리어!`);
      audio.stage();
      state.running = false;
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 500));
      handleStageClear();
      return;
    }

    // 적 공격
    const delay = SPEED_DELAY[state.speed];
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, delay));

    if (state.playerHP > 0) {
      enemyAttack();
      updateBars();
    }

    if (state.playerHP <= 0) {
      state.playerHP = 0;
      state.running = false;
      updateBars();
      audio.over();
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 500));
      handleGameOver();
      return;
    }
  }

  state.running = false;
}

/* ===== 스테이지 클리어 & 보상 ===== */

function renderRewardCards() {
  ovRewardCards.innerHTML = '';
  rewardPool.forEach((card) => {
    const el = createCardElement(card);
    el.dataset.id = card.id;
    if (card.id === rewardSelectedId) el.classList.add('selected');
    el.addEventListener('click', () => {
      rewardSelectedId = card.id;
      renderRewardCards();
    });
    ovRewardCards.appendChild(el);
  });
}

function openRewardOverlay() {
  rewardSelectedId = null;
  rewardRerolled = false;
  rewardPool = pickRandomCards(4);
  renderRewardCards();
  ovRewardTitle.textContent = `스테이지 ${state.stage} 클리어!`;
  ovReward.classList.add('show');
  saveGame();
}

function handleStageClear() {
  openRewardOverlay();
}

function applyRewardAdd() {
  if (!rewardSelectedId) {
    showToast('카드를 먼저 선택해 주세요.');
    return;
  }
  if (state.deck.length >= 10) {
    showToast('손패는 최대 10장까지입니다.');
    return;
  }
  const card = findCard(rewardSelectedId);
  state.deck.push({ id: card.id, card });
  appendLog(`보상으로 ${card.name} 카드를 얻었습니다.`);
  ovReward.classList.remove('show');
  renderHand();
  state.stage += 1;
  startBattle();
}

function openReplaceOverlay() {
  if (!rewardSelectedId) {
    showToast('카드를 먼저 선택해 주세요.');
    return;
  }
  if (state.deck.length === 0) {
    showToast('손패가 비어 있습니다.');
    return;
  }

  replaceIndexTarget = null;
  ovReplaceCards.innerHTML = '';

  state.deck.forEach((d, idx) => {
    const el = createCardElement(d.card);
    el.dataset.index = String(idx);
    el.addEventListener('click', () => {
      replaceIndexTarget = idx;
      Array.from(ovReplaceCards.children).forEach((c) =>
        c.classList.remove('selected'),
      );
      el.classList.add('selected');
      confirmReplace();
    });
    ovReplaceCards.appendChild(el);
  });

  ovReplace.classList.add('show');
}

function confirmReplace() {
  if (replaceIndexTarget == null) {
    showToast('교체할 카드를 선택해 주세요.');
    return;
  }
  const newCard = findCard(rewardSelectedId);
  const oldCard = state.deck[replaceIndexTarget].card;
  state.deck[replaceIndexTarget] = { id: newCard.id, card: newCard };
  appendLog(
    `손패에서 ${oldCard.name} → ${newCard.name} 으로 교체했습니다.`,
  );
  ovReplace.classList.remove('show');
  ovReward.classList.remove('show');
  renderHand();
  state.stage += 1;
  startBattle();
}

function skipReward() {
  appendLog('보상을 건너뛰고 다음 스테이지로 이동합니다.');
  ovReward.classList.remove('show');
  state.stage += 1;
  startBattle();
}

function rerollReward() {
  if (rewardRerolled) {
    showToast('이번 스테이지에서는 이미 다시 뽑았습니다.');
    return;
  }
  rewardRerolled = true;
  rewardSelectedId = null;
  rewardPool = pickRandomCards(4);
  renderRewardCards();
  appendLog('보상 카드를 다시 뽑었습니다.');
}

/* ===== 게임 오버 ===== */

function handleGameOver() {
  state.gameOver = true;
  ovGoName.textContent = state.playerName;
  ovGoStage.textContent = String(state.stage);
  ovGoTurns.textContent = String(state.turn);
  ovGoDamage.textContent = String(state.totalDamageDealt);
  ovGoTaken.textContent = String(state.totalDamageTaken);
  ovGameOver.classList.add('show');
  saveToLeaderboard();
  saveGame();
}

/* ===== 외부에서 호출되는 시작 함수 ===== */

export function startBattle() {
  state.gameOver = false;
  loopToken += 1;
  const token = loopToken;
  setupStage();
  saveGame();
  doTurnLoop(token);
}

/* ===== 버튼 이벤트 바인딩 ===== */

ovRewardAdd.addEventListener('click', applyRewardAdd);
ovRewardReplace.addEventListener('click', openReplaceOverlay);
ovRewardSkip.addEventListener('click', skipReward);
ovRewardViewHand.addEventListener('click', () => {
  showToast(`현재 손패 ${state.deck.length}장`);
});
ovRewardReroll.addEventListener('click', rerollReward);

ovReplaceCancel.addEventListener('click', () => {
  ovReplace.classList.remove('show');
});

ovGoMenu.addEventListener('click', () => {
  ovGameOver.classList.remove('show');
});
ovGoRetry.addEventListener('click', () => {
  ovGameOver.classList.remove('show');
  window.dispatchEvent(new CustomEvent('requestNewGame'));
});
