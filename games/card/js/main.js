import { START_CARD_IDS, findCard, CARD_LIBRARY } from './cardData.js';
import { state, loadGame, saveGame, resetStateWithStartCard, loadLeaderboard, clearLeaderboard } from './state.js';
import { renderHand, renderEnemyHand, updateBars, appendLog, createCardElement, renderLeaderboardTable, showToast } from './ui.js';
import { startBattle } from './battle.js';

/* 공통 DOM */
const btnMainStart = document.getElementById('btnMainStart');
const btnContinue  = document.getElementById('btnContinue');
const btnHelp      = document.getElementById('btnHelp');
const btnGallery   = document.getElementById('btnGallery');
const btnLeaderboard = document.getElementById('btnLeaderboard');
const btnSettings  = document.getElementById('btnSettings');
const speedButtons = document.getElementById('speedButtons');
const btnToggleSfx = document.getElementById('btnToggleSfx');
const txtSfx       = document.getElementById('txtSfx');

/* 시작 카드 선택 오버레이 */
const ovStart        = document.getElementById('ovStart');
const ovStartCards   = document.getElementById('ovStartCards');
const ovStartCancel  = document.getElementById('ovStartCancel');
const ovStartConfirm = document.getElementById('ovStartConfirm');

const ovHelp        = document.getElementById('ovHelp');
const ovHelpClose   = document.getElementById('ovHelpClose');

const ovGallery       = document.getElementById('ovGallery');
const ovGalleryCards  = document.getElementById('ovGalleryCards');
const ovGalleryClose  = document.getElementById('ovGalleryClose');

const ovSettings      = document.getElementById('ovSettings');
const inputPlayerName = document.getElementById('inputPlayerName');
const btnSettingsSfx  = document.getElementById('btnSettingsSfx');
const ovSettingsCancel= document.getElementById('ovSettingsCancel');
const ovSettingsSave  = document.getElementById('ovSettingsSave');

const ovLeaderboard       = document.getElementById('ovLeaderboard');
const ovLeaderboardClose  = document.getElementById('ovLeaderboardClose');
const btnLbClear          = document.getElementById('btnLbClear');

let startSelectedCardId = null;

/* 시작 카드 선택 */

function openStartOverlay(){
  startSelectedCardId = null;
  ovStartCards.innerHTML='';
  START_CARD_IDS.forEach(id=>{
    const card=findCard(id);
    const el=createCardElement(card);
    el.dataset.id=id;
    el.addEventListener('click',()=>{
      startSelectedCardId=id;
      Array.from(ovStartCards.children).forEach(c=>c.classList.remove('selected'));
      el.classList.add('selected');
    });
    ovStartCards.appendChild(el);
  });
  ovStart.classList.add('show');
}

function startNewGameFromSelection(){
  if(!startSelectedCardId){
    showToast('시작 카드를 선택해 주세요.');
    return;
  }
  resetStateWithStartCard(startSelectedCardId);
  document.getElementById('log').innerHTML='';
  appendLog('새 게임을 시작합니다.');
  renderHand();
  renderEnemyHand();   // ✅ 새 게임 시 적 손패도 초기화
  updateBars();
  ovStart.classList.remove('show');
  startBattle();
}

/* 도움말 / 갤러리 / 설정 / 리더보드 */

function openGallery(){
  ovGalleryCards.innerHTML='';
  CARD_LIBRARY.forEach(c=>{
    const el=createCardElement(c);
    el.style.cursor='default';
    ovGalleryCards.appendChild(el);
  });
  ovGallery.classList.add('show');
}

function openSettings(){
  inputPlayerName.value = state.playerName;
  btnSettingsSfx.textContent = state.sfx ? '효과음 ON' : '효과음 OFF';
  ovSettings.classList.add('show');
}

function applySettings(){
  state.playerName = inputPlayerName.value.trim() || '플레이어';
  ovSettings.classList.remove('show');
  saveGame();
}

/* 속도 / SFX 버튼 */

speedButtons.addEventListener('click', e=>{
  if(e.target.tagName!=='BUTTON') return;
  const sp=e.target.dataset.speed;
  if(!sp) return;
  state.speed=sp;
  Array.from(speedButtons.querySelectorAll('button')).forEach(b=>b.classList.remove('active'));
  e.target.classList.add('active');
  saveGame();
});

btnToggleSfx.addEventListener('click', ()=>{
  state.sfx=!state.sfx;
  txtSfx.textContent = state.sfx ? '🔊 효과음 ON' : '🔇 효과음 OFF';
  saveGame();
});

/* 메인 버튼들 */

btnMainStart.addEventListener('click', openStartOverlay);

btnContinue.addEventListener('click', ()=>{
  if(loadGame()){
    renderHand();
    renderEnemyHand();   // ✅ 이어하기 시 적 손패도 렌더
    updateBars();
    document.getElementById('log').innerHTML='';
    appendLog('저장된 진행을 불러왔습니다.');
    if(!state.gameOver) startBattle();
    else appendLog('이미 게임이 종료된 상태입니다. 새 게임을 시작해 보세요.');
  }else{
    showToast('저장된 진행이 없습니다.');
  }
});

btnHelp.addEventListener('click', ()=> ovHelp.classList.add('show'));
ovHelpClose.addEventListener('click', ()=> ovHelp.classList.remove('show'));

btnGallery.addEventListener('click', openGallery);
ovGalleryClose.addEventListener('click', ()=> ovGallery.classList.remove('show'));

btnSettings.addEventListener('click', openSettings);
btnSettingsSfx.addEventListener('click', ()=>{
  state.sfx=!state.sfx;
  btnSettingsSfx.textContent = state.sfx ? '효과음 ON' : '효과음 OFF';
});
ovSettingsCancel.addEventListener('click', ()=> ovSettings.classList.remove('show'));
ovSettingsSave.addEventListener('click', applySettings);

btnLeaderboard.addEventListener('click', ()=>{
  const list = loadLeaderboard();
  renderLeaderboardTable(list);
  ovLeaderboard.classList.add('show');
});
ovLeaderboardClose.addEventListener('click', ()=> ovLeaderboard.classList.remove('show'));
btnLbClear.addEventListener('click', ()=>{
  if(confirm('저장된 기록을 모두 삭제할까요?')){
    clearLeaderboard();
    renderLeaderboardTable([]);
  }
});

/* 시작 오버레이 버튼 */
ovStartCancel.addEventListener('click', ()=> ovStart.classList.remove('show'));
ovStartConfirm.addEventListener('click', startNewGameFromSelection);

/* battle.js에서 "다시 도전" 요청 */
window.addEventListener('requestNewGame', openStartOverlay);

/* 초기화 */

if(loadGame()){
  renderHand();
  renderEnemyHand();
}
updateBars();
txtSfx.textContent = state.sfx ? '🔊 효과음 ON' : '🔇 효과음 OFF';
