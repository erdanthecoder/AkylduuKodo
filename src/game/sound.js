// sound.js — every sound Quickzy makes, synthesised with WebAudio.
//
// No audio files to download, nothing to license. Respects the Sound and Music
// switches in Settings, and stays silent until the page has been touched (the
// browser's rule), so nothing blares out on load.

import { prefs } from '../services/session.js';

let ctx = null;
let master = null;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

// unlock on the first touch or key
['pointerdown', 'keydown'].forEach((ev) => window.addEventListener(ev, () => audio(), { once: true, passive: true }));

function tone(freq, { at = 0, dur = 0.12, type = 'sine', gain = 0.3, slide = 0, out = master } = {}) {
  const c = audio();
  if (!c) return;
  const t = c.currentTime + at;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise({ at = 0, dur = 0.2, gain = 0.25, freq = 1200 } = {}) {
  const c = audio();
  if (!c) return;
  const t = c.currentTime + at;
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = freq;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(f).connect(g).connect(master);
  src.start(t);
}

const SOUNDS = {
  pick: () => tone(660, { dur: 0.08, type: 'triangle', gain: 0.2 }),
  tap: () => tone(520, { dur: 0.05, type: 'square', gain: 0.08 }),
  join: () => { tone(523, { dur: 0.1, type: 'triangle' }); tone(784, { at: 0.08, dur: 0.16, type: 'triangle' }); },
  right: () => { tone(659, { dur: 0.1, type: 'triangle' }); tone(880, { at: 0.09, dur: 0.1, type: 'triangle' }); tone(1319, { at: 0.18, dur: 0.22, type: 'triangle', gain: 0.25 }); },
  wrong: () => { tone(220, { dur: 0.18, type: 'sawtooth', gain: 0.12, slide: -80 }); tone(165, { at: 0.14, dur: 0.26, type: 'sawtooth', gain: 0.12, slide: -60 }); },
  tick: () => tone(1200, { dur: 0.03, type: 'square', gain: 0.05 }),
  countdown: () => tone(880, { dur: 0.12, type: 'triangle', gain: 0.25 }),
  go: () => { tone(880, { dur: 0.1, type: 'triangle' }); tone(1760, { at: 0.06, dur: 0.3, type: 'triangle', gain: 0.25 }); },
  reveal: () => { [523, 659, 784].forEach((f, i) => tone(f, { at: i * 0.06, dur: 0.18, type: 'triangle', gain: 0.18 })); },
  laser: () => tone(1400, { dur: 0.14, type: 'sawtooth', gain: 0.09, slide: -1100 }),
  tagged: () => { noise({ dur: 0.25, gain: 0.2, freq: 900 }); tone(300, { dur: 0.25, type: 'square', gain: 0.08, slide: -200 }); },
  jump: () => tone(380, { dur: 0.16, type: 'square', gain: 0.07, slide: 420 }),
  land: () => noise({ dur: 0.06, gain: 0.12, freq: 600 }),
  bump: () => { noise({ dur: 0.18, gain: 0.25, freq: 500 }); tone(140, { dur: 0.15, type: 'square', gain: 0.1, slide: -60 }); },
  boost: () => tone(300, { dur: 0.45, type: 'sawtooth', gain: 0.08, slide: 900 }),
  shoot: () => tone(900, { dur: 0.07, type: 'square', gain: 0.05, slide: -500 }),
  boom: () => { noise({ dur: 0.35, gain: 0.3, freq: 700 }); tone(90, { dur: 0.3, type: 'sine', gain: 0.25, slide: -40 }); },
  coin: () => { tone(988, { dur: 0.06, type: 'square', gain: 0.07 }); tone(1319, { at: 0.06, dur: 0.14, type: 'square', gain: 0.07 }); },
  checkpoint: () => { [784, 988, 1175, 1568].forEach((f, i) => tone(f, { at: i * 0.07, dur: 0.14, type: 'triangle', gain: 0.18 })); },
  fall: () => tone(600, { dur: 0.5, type: 'triangle', gain: 0.14, slide: -480 }),
  win: () => { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, { at: i * 0.11, dur: 0.22, type: 'triangle', gain: 0.22 })); },
  drum: () => { noise({ dur: 0.08, gain: 0.25, freq: 300 }); tone(110, { dur: 0.1, type: 'sine', gain: 0.3, slide: -50 }); },
};

export function sfx(name) {
  if (!prefs().sound) return;
  const fn = SOUNDS[name];
  if (fn) { try { fn(); } catch { /* audio not available */ } }
}

/* ------------------------------------------------------------------ music */

// A short, cheerful loop built from a chord progression, scheduled ahead in
// small chunks so it never stutters. Different tempo and mood per scene.
const SCENES = {
  lobby: { bpm: 112, chords: [[60, 64, 67], [57, 60, 64], [65, 69, 72], [67, 71, 74]], lead: [72, 74, 76, 79, 76, 74, 72, 67] },
  game: { bpm: 132, chords: [[57, 60, 64], [65, 69, 72], [60, 64, 67], [67, 71, 74]], lead: [76, 79, 81, 79, 76, 74, 72, 74] },
  tense: { bpm: 140, chords: [[57, 60, 64], [57, 60, 64], [53, 57, 60], [55, 59, 62]], lead: [69, 72, 69, 76, 74, 72, 71, 69] },
};

let music = null;

const midi = (n) => 440 * 2 ** ((n - 69) / 12);

export function playMusic(scene = 'lobby') {
  if (!prefs().music) { stopMusic(); return; }
  if (music && music.scene === scene) return;
  stopMusic();
  const c = audio();
  if (!c) return;
  const s = SCENES[scene] || SCENES.lobby;
  const bus = c.createGain();
  bus.gain.value = 0.0001;
  bus.gain.exponentialRampToValueAtTime(0.35, c.currentTime + 1.2);
  bus.connect(master);
  const beat = 60 / s.bpm;
  let step = 0;
  let next = c.currentTime + 0.1;
  const timer = setInterval(() => {
    if (!prefs().music) { stopMusic(); return; }
    while (next < c.currentTime + 0.6) {
      const at = next - c.currentTime;
      const bar = Math.floor(step / 8) % s.chords.length;
      const chord = s.chords[bar];
      if (step % 8 === 0) chord.forEach((n) => tone(midi(n - 12), { at, dur: beat * 3.8, type: 'triangle', gain: 0.06, out: bus }));
      if (step % 2 === 0) tone(midi(chord[0] - 24), { at, dur: beat * 0.9, type: 'sine', gain: 0.16, out: bus });
      if (step % 4 === 2) tone(midi(s.lead[(step / 2) % s.lead.length | 0]), { at, dur: beat * 0.7, type: 'square', gain: 0.025, out: bus });
      if (step % 2 === 1) tone(midi(chord[(step >> 1) % 3] + 12), { at, dur: beat * 0.35, type: 'triangle', gain: 0.035, out: bus });
      step += 1;
      next += beat / 2;
    }
  }, 120);
  music = { scene, timer, bus };
}

export function stopMusic() {
  if (!music) return;
  clearInterval(music.timer);
  const { bus } = music;
  try {
    bus.gain.cancelScheduledValues(ctx.currentTime);
    bus.gain.setValueAtTime(Math.max(0.0001, bus.gain.value), ctx.currentTime);
    bus.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    setTimeout(() => bus.disconnect(), 600);
  } catch { /* already gone */ }
  music = null;
}
