import { findCard } from './cardData.js';

export const SAVE_KEY = 'autoCardBattle.save';
export const LB_KEY = 'autoCardBattle.leaderboard';

export const SPEED_DELAY = {
  slow: 800,
  normal: 500,
  fast: 260,
  veryfast: 140,
};

export const initialState = {
  playerName: '플레이어',
  stage: 1,
  turn: 0,
  playerMaxHP: 30,
  playerHP: 30,
  enemyMaxHP: 10,
  enemyHP: 10,
  enemyElem: 'normal',
  deck: [],       // 플레이어 덱
  enemyDeck: [],  // 적 덱
  running: false,
  speed: 'normal',
  sfx: true,
  totalDamageDealt: 0,
  totalDamageTaken: 0,
  gameOver: false,
};

export let state = structuredClone(initialState);

export function resetStateWithStartCard(cardId) {
  state = structuredClone(initialState);
  state.deck = [{ id: cardId, card: findCard(cardId) }];
}

export function saveGame() {
  try {
    const data = {
      ...state,
      deck: state.deck.map((x) => x.id),
      enemyDeck: state.enemyDeck.map((x) => x.id),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    // ignore
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    state = { ...initialState, ...d };
    state.deck = (d.deck || [])
      .map((id) => ({ id, card: findCard(id) }))
      .filter((x) => x.card);
    state.enemyDeck = (d.enemyDeck || [])
      .map((id) => ({ id, card: findCard(id) }))
      .filter((x) => x.card);
    return true;
  } catch (e) {
    return false;
  }
}

/* 리더보드 */

export function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(LB_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveToLeaderboard() {
  try {
    const now = new Date();
    const entry = {
      name: state.playerName || '플레이어',
      stage: state.stage,
      turns: state.turn,
      damage: state.totalDamageDealt,
      taken: state.totalDamageTaken,
      date: now.toISOString(),
    };
    const list = loadLeaderboard();
    list.push(entry);
    list.sort((a, b) => {
      if (b.stage !== a.stage) return b.stage - a.stage;
      if (a.turns !== b.turns) return a.turns - b.turns;
      if (a.damage !== b.damage) return a.damage - b.damage;
      return a.taken - b.taken;
    });
    localStorage.setItem(LB_KEY, JSON.stringify(list.slice(0, 50)));
  } catch (e) {
    // ignore
  }
}

export function clearLeaderboard() {
  localStorage.removeItem(LB_KEY);
}
