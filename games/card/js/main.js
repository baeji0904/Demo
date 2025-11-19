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
const ovS
