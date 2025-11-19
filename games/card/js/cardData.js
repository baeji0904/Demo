// 카드 데이터 및 속성 유틸리티

export const CARD_LIBRARY = [
  { id: 'strike',        name: '기본 베기',   element: 'normal',   power: 4,  hit: 1.0,  repeat: 1, description: '가장 기본적인 공격입니다.' },
  { id: 'double_strike', name: '이중 베기',   element: 'normal',   power: 3,  hit: 0.95, repeat: 2, description: '연속 두 번 공격합니다.' },
  { id: 'heavy_blow',    name: '무거운 일격', element: 'normal',   power: 8,  hit: 0.7,  repeat: 1, description: '무거운 한 방. 빗나갈 수도 있습니다.' },
  { id: 'fireball',      name: '화염 구체',   element: 'fire',     power: 5,  hit: 0.95, repeat: 1, description: '불 속성 공격. 독 속성에게 강합니다.' },
  { id: 'poison_dart',   name: '독 바늘',     element: 'poison',   power: 3,  hit: 0.9,  repeat: 2, description: '독 속성 공격. 전기 속성에게 강합니다.' },
  { id: 'thunder',       name: '전격',        element: 'electric', power: 4,  hit: 0.9,  repeat: 2, description: '전기 속성 공격. 물 속성에게 강합니다.' },
  { id: 'water_splash',  name: '물보라',      element: 'water',    power: 6,  hit: 0.95, repeat: 1, description: '물 속성 공격. 불 속성에게 강합니다.' },
  { id: 'rapid_shot',    name: '연속 사격',   element: 'normal',   power: 2,  hit: 0.85, repeat: 4, description: '여러 번 공격하지만 빗나갈 수도 있습니다.' },
  { id: 'focus_strike',  name: '집중 타격',   element: 'normal',   power: 10, hit: 0.6,  repeat: 1, description: '위험하지만 강력한 공격입니다.' },
];

export const START_CARD_IDS = [
  'strike',
  'fireball',
  'poison_dart',
  'thunder',
  'water_splash',
];

export function findCard(id) {
  return CARD_LIBRARY.find((c) => c.id === id);
}

export function elementLabel(elem) {
  switch (elem) {
    case 'fire': return '불';
    case 'poison': return '독';
    case 'electric': return '전기';
    case 'water': return '물';
    case 'normal':
    default: return '노멀';
  }
}

export function elementIcon(elem) {
  switch (elem) {
    case 'fire': return '🔥';
    case 'poison': return '☠️';
    case 'electric': return '⚡';
    case 'water': return '💧';
    default: return '✊';
  }
}

export function elementClass(elem) {
  switch (elem) {
    case 'fire': return 'elem-fire';
    case 'poison': return 'elem-poison';
    case 'electric': return 'elem-electric';
    case 'water': return 'elem-water';
    default: return 'elem-normal';
  }
}

// 속성 상성 배율
export function elementMultiplier(attackElem, defendElem) {
  if (attackElem === 'normal' || defendElem === 'normal') return 1.0;
  const strongMap = {
    fire: 'poison',
    poison: 'electric',
    electric: 'water',
    water: 'fire',
  };
  if (strongMap[attackElem] === defendElem) return 1.5;
  if (strongMap[defendElem] === attackElem) return 0.5;
  return 1.0;
}

// 랜덤 카드 뽑기 (보상용)
export function pickRandomCards(n) {
  const pool = [...CARD_LIBRARY];
  const res = [];
  for (let i = 0; i < n && pool.length > 0; i += 1) {
    const idx = Math.floor(Math.random() * pool.length);
    res.push(pool.splice(idx, 1)[0]);
  }
  return res;
}
