import { state } from './state.js';

const Ctx = window.AudioContext || window.webkitAudioContext;
const ctx = Ctx ? new Ctx() : null;

function beep(freq,dur,gain){
  if(!ctx || !state.sfx) return;
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'square';
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0,t0);
  g.gain.linearRampToValueAtTime(gain,t0+0.01);
  g.gain.linearRampToValueAtTime(0,t0+dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0+dur+0.02);
}

export const audio = {
  hit(){  beep(420,0.06,0.05); },
  miss(){ beep(260,0.05,0.04); },
  hurt(){ beep(180,0.08,0.06); },
  stage(){beep(600,0.12,0.07); },
  over(){ beep(120,0.2,0.08);  },
};
