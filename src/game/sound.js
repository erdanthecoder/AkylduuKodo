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
if (typeof window !== 'undefined') ['pointerdown', 'keydown'].forEach((ev) => window.addEventListener(ev, () => audio(), { once: true, passive: true }));

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

// Little songs, written as patterns and played by a scheduler that looks a
// little ahead, so nothing stutters. Every track has drums, a bass line,
// chords, an arpeggio and a lead that switches between an A and a B part.
//
// Pattern letters: x = hit, . = rest. Melody arrays hold semitones above the
// key (null = rest), one per sixteenth note; they loop.

const N = null;
const TRACKS = {
  // calm and bouncy: home, menus, the intro
  menu: {
    bpm: 100, key: 60, swing: 0.12,
    chords: [[0, 4, 7, 11], [9, 12, 16, 19], [5, 9, 12, 16], [7, 11, 14, 17]],
    kick:  'x.......x.......', snare: '....x.......x...', hat: '..x...x...x...x.',
    bass: [0, N, N, 0, N, N, 7, N, 0, N, N, 0, N, 12, N, 7],
    arp: true, leadWave: 'triangle',
    leadA: [12, N, 16, N, 19, N, 16, N, 14, N, 12, N, 9, N, N, N],
    leadB: [16, N, 19, 21, 19, N, 16, N, 14, 16, 14, 12, 11, N, N, N],
  },
  // the lobby: funky, waiting for friends
  lobby: {
    bpm: 112, key: 62, swing: 0.16,
    chords: [[0, 3, 7, 10], [5, 9, 12, 15], [-2, 2, 5, 9], [3, 7, 10, 14]],
    kick:  'x..x....x.x.....', snare: '....x.......x..x', hat: 'x.xxx.xxx.xxx.xx',
    bass: [0, N, 0, 12, N, 0, 10, N, 0, N, 0, 12, N, 7, 10, N],
    arp: false, leadWave: 'square',
    leadA: [12, N, 15, N, 17, 15, N, 12, N, N, 10, N, 12, N, N, N],
    leadB: [19, N, 17, N, 15, N, 17, 19, 22, N, 19, N, 17, 15, 12, N],
  },
  // playing: fast and bright
  game: {
    bpm: 136, key: 64, swing: 0,
    chords: [[0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2]],
    kick:  'x...x...x...x...', snare: '....x.......x...', hat: '..x...x...x...xx',
    bass: [0, 0, 12, 0, 0, 12, 0, 12, -3, -3, 9, -3, -5, -5, 7, -5],
    arp: true, leadWave: 'square',
    leadA: [12, N, 12, 14, 16, N, 12, N, 9, N, 9, 12, 14, N, N, N],
    leadB: [19, N, 16, N, 19, 21, 19, 16, 14, N, 12, N, 14, 16, 12, N],
  },
  // a different feel for the arcade games
  arcade: {
    bpm: 128, key: 57, swing: 0.08,
    chords: [[0, 3, 7], [-4, 0, 3], [-2, 2, 5], [-5, -1, 2]],
    kick:  'x.....x...x.....', snare: '....x.......x...', hat: 'xxx.xxx.xxx.xxx.',
    bass: [0, N, 0, N, 12, N, 0, 3, -4, N, -4, N, 8, N, -4, -2],
    arp: true, leadWave: 'sawtooth',
    leadA: [12, N, 15, N, 19, N, 15, 12, 10, N, 12, N, 7, N, N, N],
    leadB: [24, 22, 19, N, 15, N, 19, 22, 20, N, 19, N, 15, N, 12, N],
  },
  // the last 30 seconds
  tense: {
    bpm: 150, key: 57, swing: 0,
    chords: [[0, 3, 7], [0, 3, 7], [-4, 0, 3], [-2, 1, 5]],
    kick:  'x.x.x.x.x.x.x.x.', snare: '....x.......x.xx', hat: 'xxxxxxxxxxxxxxxx',
    bass: [0, 0, 0, 0, 0, 0, 0, 0, -4, -4, -4, -4, -2, -2, -2, -2],
    arp: true, leadWave: 'square',
    leadA: [12, N, 11, N, 12, N, 15, N, 14, N, 12, N, 11, N, 7, N],
    leadB: [15, 14, 12, 11, 12, N, 15, N, 19, N, 17, 15, 14, N, 11, N],
  },
  // the podium
  victory: {
    bpm: 120, key: 60, swing: 0,
    chords: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]],
    kick:  'x.......x.x.....', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.',
    bass: [0, N, 7, N, 0, N, 7, N, 5, N, 12, N, 7, N, 14, N],
    arp: true, leadWave: 'triangle',
    leadA: [12, N, 12, N, 12, 16, 19, N, 17, N, 17, 21, 24, N, N, N],
    leadB: [24, N, 23, N, 21, N, 19, N, 17, 19, 21, 19, 24, N, N, N],
  },
};
// old scene names still work
TRACKS.space = TRACKS.arcade;

let music = null;

const midi = (n) => 440 * 2 ** ((n - 69) / 12);

function kick(at, out) {
  const c = audio(); const t = c.currentTime + at;
  const o = c.createOscillator(); const g = c.createGain();
  o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.55, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  o.connect(g).connect(out); o.start(t); o.stop(t + 0.25);
}
let noiseBuf = null;
function hiss(at, out, { dur, gain, type, freq }) {
  const c = audio(); const t = c.currentTime + at;
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = c.createBufferSource(); src.buffer = noiseBuf;
  const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(out); src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
}

export function playMusic(scene = 'lobby') {
  if (!prefs().music) { stopMusic(); return; }
  if (music && music.scene === scene) return;
  stopMusic();
  const c = audio();
  if (!c) return;
  const s = TRACKS[scene] || TRACKS.lobby;
  const bus = c.createGain();
  bus.gain.value = 0.0001;
  bus.gain.exponentialRampToValueAtTime(0.32, c.currentTime + 1);
  bus.connect(master);
  // a soft echo on the lead makes it feel bigger
  const echo = c.createDelay(); echo.delayTime.value = (60 / s.bpm) * 0.75;
  const fb = c.createGain(); fb.gain.value = 0.28;
  const wet = c.createGain(); wet.gain.value = 0.35;
  echo.connect(fb).connect(echo); echo.connect(wet).connect(bus);
  const lead = c.createGain(); lead.gain.value = 1; lead.connect(bus); lead.connect(echo);
  const six = 60 / s.bpm / 4;
  let step = 0;
  let next = c.currentTime + 0.12;
  const timer = setInterval(() => {
    if (!prefs().music) { stopMusic(); return; }
    while (next < c.currentTime + 0.5) {
      const i = step % 16;
      const swing = i % 2 ? six * s.swing : 0;
      const at = next - c.currentTime + swing;
      const bar = Math.floor(step / 16);
      const chord = s.chords[bar % s.chords.length];
      const part = Math.floor(bar / 4) % 2 ? s.leadB : s.leadA;
      if (s.kick[i] === 'x') kick(at, bus);
      if (s.snare[i] === 'x') hiss(at, bus, { dur: 0.16, gain: 0.22, type: 'bandpass', freq: 1800 });
      if (s.hat[i] === 'x') hiss(at, bus, { dur: 0.04, gain: i % 4 === 2 ? 0.09 : 0.05, type: 'highpass', freq: 8000 });
      if (s.bass[i] !== null) tone(midi(s.key - 24 + s.bass[i] + chord[0]), { at, dur: six * 1.6, type: 'triangle', gain: 0.2, out: bus });
      if (i === 0) chord.forEach((n) => tone(midi(s.key + n - 12), { at, dur: six * 15, type: 'sine', gain: 0.045, out: bus }));
      if (s.arp && i % 2 === 0) tone(midi(s.key + chord[(i / 2) % chord.length] + 12), { at, dur: six * 0.9, type: 'triangle', gain: 0.03, out: bus });
      // the lead rests in the first bar of each part, so the song breathes
      if (part[i] !== null && bar % 8 !== 0) tone(midi(s.key + part[i]), { at, dur: six * 1.5, type: s.leadWave, gain: s.leadWave === 'triangle' ? 0.07 : 0.03, out: lead });
      step += 1;
      next += six;
    }
  }, 100);
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
