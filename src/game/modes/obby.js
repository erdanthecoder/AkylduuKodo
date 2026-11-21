// obby.js — Sky Climb: six worlds stacked into one tall climb.
//
// Run left and right and jump up from ledge to ledge. Each jump uses energy;
// when it runs out, answer a question. A wrong answer gives nothing: you get
// another question straight away, until you get one right.
//
// Six levels of 15 ledges, each its own world with its own trick:
//   1 Meadow           plain ledges, to learn the jump
//   2 Whisper Woods    ledges that slide side to side
//   3 Ice Caves        slippery ice: you keep sliding
//   4 Sandstorm Cliffs wind pushes you, sandstone crumbles
//   5 Thunder Clouds   storm clouds blink in and out, bouncy puffs
//   6 Star Summit      low gravity, drifting and fading ledges
// Every level starts on a wide gate ledge you can never fall below. Miss a
// jump anywhere else and you drop, maybe a long way. Don't look down.
//
// Points: 20 a ledge, 150 for each new level, 500 for the summit.
// The climb is generated from the game, so everyone climbs the same one.

import { makeCanvas, loop, controls, particles, shaker, drawBlook, nameTag, rng, hashString, rr, lerp } from '../arcade/engine.js';
import { preloadBlooks } from '../../ui/blooks.js';
import { sfx } from '../sound.js';

const TW = 520;                   // climb width in world units
const GAP = 118;                  // height between ledges
const PER = 15;                   // ledges in a level
const LEVELS = 6;
const TOP = PER * LEVELS;         // the summit ledge
const PR = 17;                    // half size of the player
const GRAV = 2300;
const JUMP = 940;
const RUN = 330;
const MAX_FLOOR_RATE = 3;         // ledges per second the host will believe
const START_ENERGY = 10;
const REFUEL = 8;

export const WORLDS = [
  { name: 'Meadow', sky: ['#78cbff', '#cdf6c4'], ledge: '#ffffff', edge: '#4bb35f', ink: '#17133f' },
  { name: 'Whisper Woods', sky: ['#245a49', '#8fd97f'], ledge: '#a8703c', edge: '#5b3a1a', ink: '#fff' },
  { name: 'Ice Caves', sky: ['#7fdcff', '#eafbff'], ledge: '#c9f2ff', edge: '#59b8e6', ink: '#17133f' },
  { name: 'Sandstorm Cliffs', sky: ['#ff9f5a', '#ffe1a0'], ledge: '#e8b46a', edge: '#a8682a', ink: '#17133f' },
  { name: 'Thunder Clouds', sky: ['#2c3060', '#7a80b8'], ledge: '#eef0ff', edge: '#9aa2d8', ink: '#17133f' },
  { name: 'Star Summit', sky: ['#070b26', '#3a2380'], ledge: '#b9a3ff', edge: '#6b4cff', ink: '#fff' },
];

export const levelOfFloor = (n) => Math.min(LEVELS - 1, Math.floor(Math.max(0, n) / PER));
const isGate = (n) => n % PER === 0;

/** Points for reaching ledge k for the first time. */
export function pointsFor(k) {
  if (k <= 0) return 0;
  if (k === TOP) return 20 + 500;
  return 20 + (isGate(k) ? 150 : 0);
}

/**
 * Ledge n of the climb. Gates (every 15th, and the summit) are full width,
 * so nobody falls below the start of the level they reached. Every other
 * ledge sits within one jump of the one below it.
 */
function floorOf(seed, n, prev) {
  if (n === 0 || isGate(n)) return { n, x: 0, w: TW, y: n * GAP, kind: n === TOP ? 'summit' : n === 0 ? 'ground' : 'gate', level: levelOfFloor(n) };
  const level = levelOfFloor(n);
  const r = rng(seed + n * 1013);
  const into = n % PER;
  // narrower as each level goes on, and a little narrower each level
  let w = 175 - level * 9 - into * 2.6 - r() * 30;
  if (level === 2) w += 20;           // ice is hard enough
  w = Math.max(74, w);
  const centre = (prev.kind === 'gate' || prev.kind === 'ground' || prev.kind === 'move') ? TW / 2 : prev.x + prev.w / 2;
  const reach = 140 + r() * 70;
  const want = centre + (r() < 0.5 ? -1 : 1) * reach * (0.35 + r() * 0.65);
  const x = Math.max(16, Math.min(TW - 16 - w, want - w / 2));
  let kind = 'solid';
  const roll = r();
  if (level === 1 && roll < 0.55) kind = 'move';
  if (level === 2) kind = roll < 0.8 ? 'ice' : 'solid';
  if (level === 3) kind = roll < 0.4 ? 'crumble' : 'solid';
  if (level === 4) kind = roll < 0.45 ? 'blink' : roll < 0.65 ? 'bounce' : 'cloud';
  if (level === 5) kind = roll < 0.4 ? 'move' : roll < 0.75 ? 'fade' : 'solid';
  const phase = r() * Math.PI * 2;
  const speed = 0.5 + r() * 0.7 + level * 0.06;
  // some ledges hold a crystal (+3 energy) or a feather (3 super jumps)
  const gem = r() < 0.2 ? (r() < 0.7 ? 'energy' : 'feather') : null;
  return { n, x, w, y: n * GAP, kind, level, phase, speed, gem };
}

/* ================================================================== host */

export function createHost({ live, P, players, dirty }) {
  const seen = new Map();
  return {
    watch: ['prog'],
    join(p) { if (p.extra.f === undefined) Object.assign(p.extra, { f: 0, summary: 'Level 1 · ledge 0' }); },
    // a wrong answer gives nothing: the player gets another question instead
    grant(p, ok) { return ok ? REFUEL : 0; },
    data(path, val) {
      const now = live.now();
      for (const [uid, v] of Object.entries(val)) {
        const p = players.get(uid);
        if (!p || !v || typeof v.f !== 'number') continue;
        const was = seen.get(uid) || { f: p.extra.f || 0, at: now - 1000 };
        const allowed = was.f + Math.ceil((MAX_FLOOR_RATE * (now - was.at)) / 1000) + 1;
        const f = Math.min(TOP, Math.max(was.f, Math.min(Math.floor(v.f), allowed)));
        let gained = 0;
        for (let k = was.f + 1; k <= f; k++) gained += pointsFor(k);
        seen.set(uid, { f, at: now });
        p.extra.f = f;
        p.extra.h = Math.max(0, Number(v.h) || 0);
        p.extra.summary = f >= TOP ? 'Reached the summit!' : `Level ${levelOfFloor(f) + 1} · ledge ${f}`;
        if (gained > 0) { p.score += gained; dirty.add(uid); }
      }
    },
    tick() {
      const tower = {};
      for (const p of players.values()) tower[p.uid] = p.extra.f || 0;
      live.set(P('tower'), tower).catch(() => {});
    },
  };
}

/* ================================================================ player */

function ledgeX(f, t) {
  if (f.kind !== 'move') return f.x;
  const span = Math.min(200, TW - 40 - f.w);
  const mid = Math.max(20 + span / 2, Math.min(TW - 20 - span / 2 - f.w, f.x));
  return mid + Math.sin(t * f.speed + f.phase) * span / 2;
}

/** Is a ledge solid right now? Blinking clouds and fading crystals come and go. */
function solidAt(f, t) {
  if (f.kind === 'blink') return Math.sin(t * 1.3 + f.phase) > -0.25;
  if (f.kind === 'fade') return Math.sin(t * 0.9 + f.phase) > -0.45;
  return true;
}
/** 0..1: how visible it is (it flickers just before vanishing). */
function visibility(f, t) {
  if (f.kind !== 'blink' && f.kind !== 'fade') return 1;
  const k = f.kind === 'blink' ? 1.3 : 0.9;
  const v = Math.sin(t * k + f.phase);
  const cut = f.kind === 'blink' ? -0.25 : -0.45;
  if (v <= cut) return 0.12;
  if (v < cut + 0.3) return 0.35 + 0.4 * (Math.sin(t * 40) > 0 ? 1 : 0);
  return 1;
}

const mix = (a, b, k) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], k))).join(',')})`;
};

/** The sky: blends from world to world as you climb, with each world's weather. */
function drawSky(ctx, w, h, camY, t, flash = 0) {
  const pos = Math.max(0, camY / GAP / PER);
  const i = Math.min(LEVELS - 1, Math.floor(pos));
  const j = Math.min(LEVELS - 1, i + 1);
  const k = Math.max(0, Math.min(1, (pos - i - 0.8) / 0.2));     // blend in the last fifth
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, mix(WORLDS[i].sky[0], WORLDS[j].sky[0], k));
  g.addColorStop(1, mix(WORLDS[i].sky[1], WORLDS[j].sky[1], k));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const world = k > 0.5 ? j : i;
  ctx.save();
  if (world === 0) {
    // soft clouds and distant hills
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    for (let n = 0; n < 6; n++) {
      const x = ((n * 211 + t * (10 + n * 4)) % (w + 240)) - 120;
      const y = ((n * 157 + camY * 0.15) % (h * 0.7));
      ctx.beginPath(); ctx.ellipse(x, y, 70, 20, 0, 0, Math.PI * 2); ctx.ellipse(x + 30, y - 10, 40, 18, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(60,160,80,0.35)';
    ctx.beginPath(); ctx.ellipse(w * 0.2, h + 60 + camY * 0.05, w * 0.5, 160, 0, 0, Math.PI * 2); ctx.ellipse(w * 0.85, h + 80 + camY * 0.05, w * 0.45, 170, 0, 0, Math.PI * 2); ctx.fill();
  } else if (world === 1) {
    // pine trees down both sides, drifting leaves
    for (let side = 0; side < 2; side++) {
      for (let n = 0; n < 7; n++) {
        const y = ((n * 140 + camY * 0.4) % (h + 140)) - 70;
        const x = side ? w - 30 - (n % 2) * 26 : 30 + (n % 2) * 26;
        ctx.fillStyle = n % 2 ? 'rgba(10,50,30,0.55)' : 'rgba(20,80,45,0.5)';
        ctx.beginPath(); ctx.moveTo(x, y - 70); ctx.lineTo(x + 38, y + 30); ctx.lineTo(x - 38, y + 30); ctx.fill();
      }
    }
    ctx.fillStyle = 'rgba(255,200,90,0.8)';
    for (let n = 0; n < 12; n++) {
      const x = ((n * 97 + t * 30 + Math.sin(t + n) * 20) % w);
      const y = ((n * 131 + t * 40) % h);
      ctx.beginPath(); ctx.ellipse(x, y, 5, 2.5, t + n, 0, Math.PI * 2); ctx.fill();
    }
  } else if (world === 2) {
    // icicles on the walls, sparkles
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let n = 0; n < 14; n++) {
      const y = ((n * 77 + camY * 0.5) % (h + 80)) - 40;
      const left = n % 2 === 0;
      const x = left ? 0 : w;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (left ? 34 : -34), y + 8); ctx.lineTo(x, y + 18); ctx.fill();
    }
    for (let n = 0; n < 18; n++) {
      const a = Math.sin(t * 3 + n * 1.7) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fillRect((n * 113) % w, (n * 71 + camY * 0.2) % h, 3, 3);
    }
  } else if (world === 3) {
    // a hot sun and blowing sand
    ctx.fillStyle = 'rgba(255,240,180,0.8)';
    ctx.beginPath(); ctx.arc(w * 0.78, h * 0.2, 46, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(160,100,40,0.35)';
    const dir = Math.sin(t * 0.5) >= 0 ? 1 : -1;
    for (let n = 0; n < 40; n++) {
      const x = ((n * 53 + dir * t * 260) % w + w) % w;
      const y = (n * 97 + camY * 0.3) % h;
      ctx.fillRect(x, y, 14, 2);
    }
  } else if (world === 4) {
    // dark clouds, rain, and the odd lightning flash
    ctx.strokeStyle = 'rgba(200,210,255,0.35)'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let n = 0; n < 50; n++) {
      const x = (n * 41 + t * 60) % w;
      const y = (n * 89 + t * 700) % h;
      ctx.moveTo(x, y); ctx.lineTo(x - 5, y + 14);
    }
    ctx.stroke();
    if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash * 0.6})`; ctx.fillRect(0, 0, w, h); }
  } else {
    // stars and a ringed planet
    for (let n = 0; n < 60; n++) {
      const a = Math.sin(t * 2 + n) * 0.4 + 0.6;
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fillRect((n * 137) % w, ((n * 59 + camY * 0.1) % h), n % 7 === 0 ? 3 : 1.6, n % 7 === 0 ? 3 : 1.6);
    }
    ctx.fillStyle = '#ff8ad8';
    ctx.beginPath(); ctx.arc(w * 0.82, h * 0.25, 36, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(w * 0.82, h * 0.25, 62, 14, -0.3, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

function drawLedge(ctx, f, x, y, t, alpha = 1) {
  const W = WORLDS[f.level];
  ctx.globalAlpha = alpha;
  if (f.kind === 'gate' || f.kind === 'ground' || f.kind === 'summit') {
    ctx.fillStyle = f.kind === 'summit' ? '#ffcd1f' : W.edge;
    rr(ctx, x, y, f.w, 22, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    for (let i = 0; i < f.w; i += 40) ctx.fillRect(x + i, y + 4, 20, 4);
    if (f.kind !== 'ground') {
      ctx.font = '400 15px "Lilita One", system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = f.kind === 'summit' ? '#17133f' : '#fff';
      ctx.fillText(f.kind === 'summit' ? 'SUMMIT' : `LEVEL ${f.level + 1} · ${WORLDS[f.level].name.toUpperCase()}`, x + f.w / 2, y + 12);
    }
    ctx.globalAlpha = 1;
    return;
  }
  const H = 18;
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  rr(ctx, x + 3, y + 5, f.w, H, 8); ctx.fill();
  if (f.kind === 'cloud' || f.kind === 'blink' || f.kind === 'bounce') {
    // puffy clouds
    ctx.fillStyle = f.kind === 'blink' ? '#c9cff5' : f.kind === 'bounce' ? '#ffd1f0' : W.ledge;
    for (let i = 0; i <= 4; i++) { ctx.beginPath(); ctx.arc(x + (f.w * i) / 4, y + 9, 11 + (i % 2) * 3, 0, Math.PI * 2); ctx.fill(); }
    rr(ctx, x, y + 2, f.w, 16, 8); ctx.fill();
    if (f.kind === 'blink') {
      ctx.strokeStyle = '#ffcd1f'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(x + f.w / 2 - 4, y + 18); ctx.lineTo(x + f.w / 2 + 3, y + 26); ctx.lineTo(x + f.w / 2 - 2, y + 28); ctx.lineTo(x + f.w / 2 + 5, y + 38); ctx.stroke();
    }
    if (f.kind === 'bounce') {
      ctx.fillStyle = '#ff4772';
      for (let k = 0; k < 3; k++) { const cx = x + f.w * (0.25 + k * 0.25); ctx.fillRect(cx - 6, y - 4 - Math.abs(Math.sin(t * 6 + k)) * 3, 12, 5); }
    }
  } else {
    ctx.fillStyle = f.kind === 'move' ? '#ffcd1f' : f.kind === 'crumble' ? '#d99a4e' : f.kind === 'fade' ? '#8fe8ff' : W.ledge;
    rr(ctx, x, y, f.w, H, 8); ctx.fill();
    ctx.fillStyle = W.edge;
    rr(ctx, x, y + H - 6, f.w, 6, 3); ctx.fill();
    if (f.kind === 'ice') {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(x + 10, y + 4, f.w * 0.35, 3);
      for (let i = 12; i < f.w - 8; i += 22) { ctx.beginPath(); ctx.moveTo(x + i, y + H); ctx.lineTo(x + i + 4, y + H + 10); ctx.lineTo(x + i + 8, y + H); ctx.fill(); }
    }
    if (f.kind === 'crumble') {
      ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + f.w * 0.3, y); ctx.lineTo(x + f.w * 0.36, y + H); ctx.moveTo(x + f.w * 0.7, y); ctx.lineTo(x + f.w * 0.62, y + H); ctx.stroke();
    }
    if (f.kind === 'fade') { ctx.shadowColor = '#8fe8ff'; ctx.shadowBlur = 12; rr(ctx, x, y, f.w, 4, 2); ctx.fill(); ctx.shadowBlur = 0; }
    if (f.level === 1 && f.kind === 'solid') {
      // a bit of moss
      ctx.fillStyle = '#4bb35f';
      rr(ctx, x, y - 2, f.w, 6, 3); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}


/* ----------------------------------------------------------------- props */

/** Scenery standing on a ledge: every world has its own. Purely for looks. */
function drawProps(ctx, f, x, y, t) {
  if (f.kind === 'gate' || f.kind === 'summit') { drawGateArch(ctx, f, x, y, t); return; }
  if (f.kind === 'ground' || f.kind === 'cloud' || f.kind === 'blink' || f.kind === 'bounce' || f.w < 90) return;
  const h1 = (f.n * 2654435761) >>> 0;
  const pick = (k) => ((h1 >>> (k * 3)) & 7) / 7;
  if (pick(0) < 0.35) return;                      // some ledges stay bare
  const px = x + 14 + pick(1) * (f.w - 28);
  const L = f.level;
  ctx.save();
  if (L === 0) {
    // flowers, a bush, or a little signpost
    const kind = Math.floor(pick(2) * 3);
    if (kind === 0) for (let i = 0; i < 3; i++) {
      const fx = px + i * 9 - 9; const sway = Math.sin(t * 2 + i + f.n) * 2;
      ctx.strokeStyle = '#2f8a3e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(fx, y); ctx.lineTo(fx + sway, y - 12); ctx.stroke();
      ctx.fillStyle = ['#ff4772', '#ffcd1f', '#a560ff'][i]; ctx.beginPath(); ctx.arc(fx + sway, y - 14, 4, 0, Math.PI * 2); ctx.fill();
    } else if (kind === 1) {
      ctx.fillStyle = '#3fa357'; for (const [dx, r] of [[-8, 9], [6, 11], [0, 13]]) { ctx.beginPath(); ctx.arc(px + dx, y - 8, r, Math.PI, 0); ctx.fill(); }
      ctx.fillStyle = '#ff4772'; ctx.beginPath(); ctx.arc(px + 4, y - 14, 2.5, 0, Math.PI * 2); ctx.arc(px - 6, y - 10, 2.5, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#8a5a2b'; ctx.fillRect(px - 2, y - 22, 4, 22); ctx.fillRect(px - 12, y - 24, 24, 9);
      ctx.fillStyle = '#fff'; ctx.font = '700 7px Nunito, system-ui'; ctx.textAlign = 'center'; ctx.fillText('UP!', px, y - 17);
    }
  } else if (L === 1) {
    // mushrooms and tiny pines
    if (pick(2) < 0.5) {
      ctx.fillStyle = '#f4e7d0'; ctx.fillRect(px - 3, y - 10, 6, 10);
      ctx.fillStyle = '#e8112d'; ctx.beginPath(); ctx.arc(px, y - 10, 10, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#fff'; for (const dx of [-5, 3]) { ctx.beginPath(); ctx.arc(px + dx, y - 14, 2, 0, Math.PI * 2); ctx.fill(); }
    } else {
      ctx.fillStyle = '#5b3a1a'; ctx.fillRect(px - 2, y - 8, 4, 8);
      ctx.fillStyle = '#1f6b3a'; ctx.beginPath(); ctx.moveTo(px, y - 34); ctx.lineTo(px + 12, y - 8); ctx.lineTo(px - 12, y - 8); ctx.fill();
    }
  } else if (L === 2) {
    // ice crystals and a tiny snowman
    if (pick(2) < 0.6) {
      ctx.fillStyle = 'rgba(160,230,255,0.9)';
      for (const [dx, hh] of [[-6, 16], [0, 24], [6, 14]]) { ctx.beginPath(); ctx.moveTo(px + dx - 4, y); ctx.lineTo(px + dx, y - hh); ctx.lineTo(px + dx + 4, y); ctx.fill(); }
      ctx.fillStyle = `rgba(255,255,255,${0.5 + Math.sin(t * 4 + f.n) * 0.5})`; ctx.fillRect(px - 1, y - 20, 2, 2);
    } else {
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px, y - 7, 7, 0, Math.PI * 2); ctx.arc(px, y - 18, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.moveTo(px + 2, y - 18); ctx.lineTo(px + 8, y - 17); ctx.lineTo(px + 2, y - 16); ctx.fill();
    }
  } else if (L === 3) {
    // cactus and a skull rock
    ctx.fillStyle = '#3c8d4a';
    rr(ctx, px - 4, y - 26, 8, 26, 4); ctx.fill();
    rr(ctx, px - 13, y - 18, 6, 10, 3); ctx.fill(); rr(ctx, px + 7, y - 22, 6, 10, 3); ctx.fill();
    ctx.fillRect(px - 9, y - 11, 6, 3); ctx.fillRect(px + 3, y - 15, 6, 3);
  } else if (L === 4) {
    // a lightning rod that sparks
    ctx.strokeStyle = '#9aa2d8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, y - 26); ctx.stroke();
    if (Math.sin(t * 7 + f.n) > 0.85) { ctx.strokeStyle = '#ffe45c'; ctx.beginPath(); ctx.moveTo(px, y - 26); ctx.lineTo(px + 5, y - 33); ctx.lineTo(px - 2, y - 36); ctx.lineTo(px + 4, y - 44); ctx.stroke(); }
  } else {
    // glowing star crystals
    ctx.shadowColor = '#b9a3ff'; ctx.shadowBlur = 10 + Math.sin(t * 3 + f.n) * 5;
    ctx.fillStyle = '#e3d8ff';
    ctx.beginPath(); ctx.moveTo(px, y - 22); ctx.lineTo(px + 6, y - 8); ctx.lineTo(px, y); ctx.lineTo(px - 6, y - 8); ctx.fill();
  }
  ctx.restore();
}

/** Each level starts at a checkpoint arch with flags and lanterns. */
function drawGateArch(ctx, f, x, y, t) {
  const W = WORLDS[f.level];
  const posts = [x + 10, x + f.w - 18];
  ctx.save();
  for (const px of posts) {
    ctx.fillStyle = f.kind === 'summit' ? '#ffcd1f' : W.edge; ctx.fillRect(px, y - 56, 8, 56);
    const glow = 0.6 + Math.sin(t * 3 + px) * 0.4;
    ctx.fillStyle = `rgba(255,214,90,${glow})`; ctx.shadowColor = '#ffd65a'; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(px + 4, y - 60, 6, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  }
  // bunting between the posts
  ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(posts[0] + 4, y - 50); ctx.quadraticCurveTo(x + f.w / 2, y - 30, posts[1] + 4, y - 50); ctx.stroke();
  const cols = ['#ff4772', '#ffcd1f', '#12c9a6', '#2f9bff', '#a560ff'];
  for (let i = 1; i < 12; i++) {
    const k = i / 12; const bx = lerp(posts[0] + 4, posts[1] + 4, k); const by = y - 50 + Math.sin(k * Math.PI) * 10 + Math.sin(t * 3 + i) * 1.5;
    ctx.fillStyle = cols[i % cols.length]; ctx.beginPath(); ctx.moveTo(bx - 5, by); ctx.lineTo(bx + 5, by); ctx.lineTo(bx, by + 10); ctx.fill();
  }
  ctx.restore();
}

/** Creatures that fly past behind the climb, one kind per world. */
function drawCritters(ctx, w, h, camY, t) {
  const pos = Math.max(0, camY / GAP / PER);
  const world = Math.min(LEVELS - 1, Math.round(pos - 0.4));
  ctx.save();
  for (let n = 0; n < 4; n++) {
    const speed = 40 + n * 18;
    const x = ((t * speed + n * 260) % (w + 160)) - 80;
    const y = h * (0.15 + n * 0.17) + Math.sin(t * 2 + n) * 10;
    const flap = Math.sin(t * 12 + n) * 6;
    if (world === 0 || world === 3) {
      ctx.strokeStyle = world === 3 ? 'rgba(90,50,20,.6)' : 'rgba(23,19,63,.55)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x - 9, y - flap); ctx.quadraticCurveTo(x - 4, y - 4, x, y); ctx.quadraticCurveTo(x + 4, y - 4, x + 9, y - flap); ctx.stroke();
    } else if (world === 1) {
      ctx.fillStyle = `rgba(255,240,120,${0.5 + Math.sin(t * 5 + n) * 0.5})`; ctx.shadowColor = '#fff27a'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc((x * 0.7 + n * 90) % w, y + Math.sin(t * 3 + n) * 30, 3, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    } else if (world === 2) {
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc((n * 137 + Math.sin(t + n) * 30) % w, (t * (30 + n * 10) + n * 200) % h, 2.5, 0, Math.PI * 2); ctx.fill();
    } else if (world === 5) {
      const cx = ((t * 160 + n * 400) % (w + 400)) - 200; const cy = (n * 90 + 40) % (h * 0.6);
      const g = ctx.createLinearGradient(cx - 60, cy - 20, cx, cy); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,.9)');
      ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 60, cy - 20); ctx.lineTo(cx, cy); ctx.stroke();
    }
  }
  ctx.restore();
}

function drawFlag(ctx, x, y, t, colour = '#ff4772') {
  ctx.fillStyle = '#fff';
  ctx.fillRect(x, y - 60, 5, 60);
  ctx.fillStyle = colour;
  ctx.beginPath(); ctx.moveTo(x + 5, y - 60); ctx.lineTo(x + 44 + Math.sin(t * 5) * 4, y - 50); ctx.lineTo(x + 5, y - 38); ctx.fill();
}

export function mountPlayer(game) {
  const { stage, uid, live, P, meta } = game;
  const view = makeCanvas(stage);
  const ctl = controls(stage, { joystick: true, buttons: [{ id: 'action', label: 'Jump', className: 'is-right' }] });
  const fx = particles();
  const shake = shaker();
  const seed = hashString(`${meta.quizId}:${meta.createdAt || 0}`);
  const floors = new Map();
  const getFloor = (n) => {
    if (n < 0 || n > TOP) return null;
    if (!floors.has(n)) {
      let k = n;
      while (k > 0 && !floors.has(k - 1)) k -= 1;
      for (; k <= n; k++) floors.set(k, floorOf(seed, k, floors.get(k - 1)));
    }
    return floors.get(n);
  };
  const crumble = new Map();      // ledge -> seconds since stepped on
  const names = new Map();
  let tower = {};
  const unsubs = [];
  unsubs.push(live.on(P('players'), (v) => { for (const [u, p] of Object.entries(v || {})) names.set(u, p); preloadBlooks([...names.values()].map((p) => p.blook)); }));
  unsubs.push(live.on(P('tower'), (v) => { tower = v || {}; }));

  // world y grows upwards; screen y = base - (y - cam)
  const me = { x: TW / 2, y: 22, vx: 0, vy: 0, on: 0, face: 1, squash: 1, peak: 22 };
  let energy = START_ENERGY;
  let feathers = 0;
  const gemsTaken = new Set();
  let best = 0;
  let gate = 0;
  let cam = 0;
  let lastProg = 0;
  let refuelling = false;
  let tSec = 0;
  let banner = { text: '', sub: '', t: 0 };
  let lightning = 0;
  let summitDone = false;
  game.grantText = (g) => `+${g} energy`;
  const geo = { s: 1, ox: 0, base: 0 };
  const pop = (x, y, opts) => fx.burst(geo.ox + x * geo.s, geo.base - (y - cam) * geo.s, opts);
  const showBanner = (text, sub) => { banner = { text, sub, t: 2.6 }; };
  showBanner('LEVEL 1', WORLDS[0].name);

  // out of energy: questions until one is right
  async function refuel() {
    if (refuelling || game.asking) return;
    refuelling = true;
    let tries = 0;
    while (game.timeLeft() > 0) {
      const r = await game.ask({ title: tries ? 'Not quite! Get one right to refuel' : 'Out of energy: answer to refuel' });
      tries += 1;
      if (!r || r.error || r.timeout || r.skip) break;
      if (r.ok || r.poll) { energy += r.g || REFUEL; break; }
    }
    refuelling = false;
  }

  const stop = loop((dt) => {
    tSec += dt;
    ctl.update();
    fx.update(dt); shake.update(dt);
    banner.t = Math.max(0, banner.t - dt);
    lightning = Math.max(0, lightning - dt * 3);
    if (game.asking) { ctl.clear(); return; }
    const over = game.timeLeft() <= 0;
    const here = getFloor(me.on ?? -1);
    const level = levelOfFloor(Math.floor(me.y / GAP));
    const grav = level === 5 ? GRAV * 0.62 : GRAV;
    const jumpV = level === 5 ? JUMP * 0.82 : JUMP;
    const onIce = here && here.kind === 'ice';
    const want = over ? 0 : ctl.x;
    me.vx = lerp(me.vx, want * RUN, me.on !== null ? (onIce ? 0.035 : 0.3) : 0.12);
    if (want) me.face = Math.sign(want);
    // the sandstorm blows people about
    if (level === 3 && !summitDone) me.x += Math.sin(tSec * 0.5) * (me.on === null ? 110 : 45) * dt;
    if (level === 4 && Math.random() < dt * 0.25) { lightning = 1; sfx('drum'); }

    if (!over && (ctl.tapped('action') || ctl.tapped('up'))) {
      if (me.on !== null) {
        if (energy > 0 || summitDone) {
          if (!summitDone) energy -= 1;
          me.vy = feathers > 0 ? jumpV * 1.3 : jumpV; me.on = null; me.squash = 0.7;
          if (feathers > 0) feathers -= 1;
          sfx('jump');
          if (energy === 0 && !summitDone) setTimeout(() => { if (energy === 0 && !game.asking) refuel(); }, 900);
        } else { game.flash('No energy: answer to refuel', 'is-bad'); refuel(); }
      }
    }
    me.vy -= grav * dt;
    const prevY = me.y;
    me.x += me.vx * dt;
    me.y += me.vy * dt;
    me.x = Math.max(PR, Math.min(TW - PR, me.x));
    if (me.on === null) me.peak = Math.max(me.peak, me.y);

    // landing: only when falling through the top of a ledge
    if (me.vy <= 0) {
      const lo = Math.max(0, Math.floor((me.y - 40) / GAP));
      const hi = Math.min(TOP, Math.floor((prevY + 10) / GAP));
      let landed = null;
      for (let n = hi; n >= lo; n--) {
        const f = getFloor(n);
        if (!f || (crumble.get(n) || 0) > 0.8 || !solidAt(f, tSec)) continue;
        const x = ledgeX(f, tSec);
        const top = f.y + 22;
        if (prevY >= top - 1 && me.y <= top && me.x + PR * 0.6 > x && me.x - PR * 0.6 < x + f.w) { landed = f; me.y = top; break; }
      }
      if (landed) {
        const drop = me.peak - me.y;
        if (me.on === null) {
          me.squash = 1.25; sfx('land');
          pop(me.x, me.y, { n: 6, color: '#fff', speed: 90, life: 0.3 });
          if (drop > GAP * 3.5) { shake.kick(Math.min(14, drop / 60)); game.flash(`Fell ${Math.round(drop / GAP)} ledges!`, 'is-bad'); sfx('bump'); }
        }
        me.peak = me.y;
        me.on = landed.n;
        me.vy = 0;
        if (landed.kind === 'bounce') { me.vy = jumpV * 1.45; me.on = null; sfx('boost'); }
        if (landed.kind === 'crumble' && !crumble.has(landed.n)) crumble.set(landed.n, 0.001);
        if (landed.gem && !gemsTaken.has(landed.n)) {
          gemsTaken.add(landed.n);
          if (landed.gem === 'energy') { energy += 3; game.flash('+3 energy', 'is-ok'); } else { feathers = 3; game.flash('Feather: 3 super jumps!', 'is-ok'); }
          sfx('coin');
          pop(me.x, me.y + 20, { n: 16, color: landed.gem === 'energy' ? '#59f0ff' : '#ff8ad8', speed: 200 });
        }
        if (landed.n > best) {
          best = landed.n;
          if (landed.n === TOP) {
            summitDone = true;
            sfx('win');
            import('../../ui/confetti.js').then(({ confetti }) => { confetti({ y: 0.4, count: 200 }); confetti({ x: 0.2, y: 0.8, angle: -70 }); confetti({ x: 0.8, y: 0.8, angle: -110 }); });
            showBanner('SUMMIT!', 'You climbed all six worlds');
          } else if (isGate(landed.n)) {
            gate = landed.n;
            const lv = levelOfFloor(landed.n);
            sfx('checkpoint');
            showBanner(`LEVEL ${lv + 1}`, WORLDS[lv].name);
            pop(me.x, me.y + 20, { n: 34, color: '#ffcd1f', speed: 280 });
          } else sfx('coin');
        }
      } else if (me.on !== null) {
        const f = getFloor(me.on);
        const x = ledgeX(f, tSec);
        if (me.x + PR * 0.6 <= x || me.x - PR * 0.6 >= x + f.w || (crumble.get(me.on) || 0) > 0.8 || !solidAt(f, tSec)) me.on = null;
      }
    }
    // ride a sliding ledge
    if (me.on !== null && getFloor(me.on).kind === 'move') {
      const f = getFloor(me.on);
      me.x += ledgeX(f, tSec) - ledgeX(f, tSec - dt);
    }
    for (const [n, s] of crumble) {
      const next = s + dt;
      if (next > 3.5) crumble.delete(n); else crumble.set(n, next);
    }
    // safety net: never below the gate of the level you reached
    const net = getFloor(gate);
    if (me.y < net.y - 200) {
      sfx('fall'); shake.kick(10);
      me.x = TW / 2; me.y = net.y + 22; me.vy = 0; me.on = gate; me.peak = me.y;
    }
    me.squash = lerp(me.squash, 1, 0.2);
    cam = lerp(cam, Math.max(0, me.y - 170), me.vy < -900 ? 0.18 : 0.08);
    game.setMeter('Energy', Math.min(1, energy / 12), summitDone ? 'free' : feathers > 0 ? `${energy} · feather x${feathers}` : `${energy}`);
    const now = live.now();
    if (now - lastProg > 600) { lastProg = now; game.sendProg({ f: best, h: Math.round(me.y) }); }
  }, () => {
    const { ctx, w, h } = view;
    view.begin();
    ctx.save();
    shake.apply(ctx);
    drawSky(ctx, w, h, cam, tSec, lightning);
    drawCritters(ctx, w, h, cam, tSec);
    const s = Math.min(w / (TW + 70), h / 640);
    const ox = (w - TW * s) / 2 - 20 * s;
    const base = h - 40;
    const sy = (y) => base - (y - cam) * s;
    Object.assign(geo, { s, ox, base });
    ctx.translate(ox, 0);
    const lo = Math.max(0, Math.floor((cam - 80) / GAP));
    const hi = Math.min(TOP, Math.ceil((cam + h / s + 80) / GAP));
    ctx.save();
    ctx.scale(s, s);
    for (let n = lo; n <= hi; n++) {
      const f = getFloor(n);
      const c = crumble.get(n) || 0;
      if (c > 0.8) continue;
      const jitter = c > 0 ? (Math.random() - 0.5) * 4 : 0;
      const x = ledgeX(f, tSec) + jitter;
      const y = sy(f.y + 22) / s;
      drawLedge(ctx, f, x, y, tSec, visibility(f, tSec));
      if (visibility(f, tSec) > 0.5) drawProps(ctx, f, x, y, tSec);
      if (f.kind === 'summit') drawFlag(ctx, TW / 2 - 2, y, tSec, '#6b4cff');
      if (f.kind === 'gate' && n > best) drawFlag(ctx, f.w - 50, y, tSec);
      if (f.gem && !gemsTaken.has(n)) {
        const gx = x + f.w / 2;
        const gy = y - 20 + Math.sin(tSec * 3 + n) * 3;
        ctx.save();
        const col = f.gem === 'energy' ? '#59f0ff' : '#ff8ad8';
        ctx.shadowColor = col; ctx.shadowBlur = 14; ctx.fillStyle = col;
        ctx.beginPath(); ctx.moveTo(gx, gy - 11); ctx.lineTo(gx + 8, gy); ctx.lineTo(gx, gy + 11); ctx.lineTo(gx - 8, gy); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
    // everyone else, as ghosts at their highest ledge
    for (const [u, fl] of Object.entries(tower)) {
      if (u === uid) continue;
      const info = names.get(u);
      const f = info && getFloor(fl);
      if (!f) continue;
      const y = sy(f.y + 22) - 16 * s;
      if (y < -40 || y > h + 40) continue;
      const x = (ledgeX(f, tSec) + f.w / 2) * s + ((hashString(u) % 40) - 20) * s;
      drawBlook(ctx, info.blook, x, y, 30 * s, { alpha: 0.45 });
      nameTag(ctx, info.name, x, y - 18 * s, { bg: 'rgba(23,19,63,.4)', size: 10 });
    }
    drawBlook(ctx, game.blook, me.x * s, sy(me.y) - PR * s, PR * 2.2 * s, { squash: me.squash, flip: me.face < 0 });
    ctx.restore();
    fx.draw(ctx);

    // the climb meter on the right: six worlds, you, and everyone else
    const mx = w - 26;
    const mTop = 70;
    const mBot = h - 150;            // clear of the Jump button
    const span = mBot - mTop;
    for (let l = 0; l < LEVELS; l++) {
      ctx.fillStyle = WORLDS[l].edge;
      const y0 = mBot - ((l + 1) / LEVELS) * span;
      rr(ctx, mx - 6, y0 + 1, 12, span / LEVELS - 2, 4); ctx.fill();
    }
    for (const [u, fl] of Object.entries(tower)) {
      if (u === uid) continue;
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath(); ctx.arc(mx - 12, mBot - (fl / TOP) * span, 3, 0, Math.PI * 2); ctx.fill();
    }
    const myY = mBot - Math.min(1, Math.max(0, (me.y - 22) / GAP / TOP)) * span;
    drawBlook(ctx, game.blook, mx, myY, 22);

    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.font = '400 26px "Lilita One", system-ui';
    ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 6;
    ctx.fillText(`Level ${levelOfFloor(best) + 1} · ${best}/${TOP}`, 16, 12);
    ctx.shadowBlur = 0;

    if (banner.t > 0) {
      const a = Math.min(1, banner.t * 2, (2.6 - banner.t) * 4);
      const pop2 = 1 + Math.max(0, 0.3 - (2.6 - banner.t)) * 2;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(w / 2, h * 0.36);
      ctx.scale(pop2, pop2);
      ctx.fillStyle = 'rgba(23,19,63,.55)';
      rr(ctx, -170, -52, 340, 104, 22); ctx.fill();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffcd1f';
      ctx.font = '400 44px "Lilita One", system-ui';
      ctx.fillText(banner.text, 0, -14);
      ctx.fillStyle = '#fff';
      ctx.font = '800 18px Nunito, system-ui';
      ctx.fillText(banner.sub, 0, 28);
      ctx.restore();
    }
  });

  // browser tests can drop the player on any ledge to look at each world
  if (navigator.webdriver) {
    window.__quickzyClimb = (n) => {
      const f = getFloor(Math.min(TOP, n));
      best = Math.max(best, f.n); gate = f.n - (f.n % PER);
      me.x = ledgeX(f, tSec) + f.w / 2; me.y = f.y + 22; me.vy = 0; me.on = f.n; me.peak = me.y; cam = me.y - 170;
    };
  }

  return () => { stop(); ctl.destroy(); view.destroy(); unsubs.forEach((u) => u()); delete window.__quickzyClimb; };
}

/* =========================================================== big screen */

export function mountScreen(el, { ref }) {
  const view = makeCanvas(el);
  let t = 0;
  const shown = new Map();
  const stop = loop((dt) => { t += dt; }, () => {
    const { ctx, w, h } = view;
    view.begin();
    const top = 40;
    const bottom = h - 4;
    const span = bottom - top;
    // the six worlds as bands, bottom to top
    for (let l = 0; l < LEVELS; l++) {
      const y1 = bottom - (l / LEVELS) * span;
      const y0 = bottom - ((l + 1) / LEVELS) * span;
      const g = ctx.createLinearGradient(0, y0, 0, y1);
      g.addColorStop(0, WORLDS[l].sky[0]); g.addColorStop(1, WORLDS[l].sky[1]);
      ctx.fillStyle = g;
      ctx.fillRect(0, y0, w, y1 - y0 + 1);
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.fillRect(0, y1 - 3, w, 3);
      ctx.font = '400 18px "Lilita One", system-ui'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillStyle = WORLDS[l].ink;
      ctx.fillText(`${l + 1} · ${WORLDS[l].name}`, 14, y0 + 8);
    }
    ctx.fillStyle = '#17133f';
    ctx.fillRect(0, 0, w, top);
    ctx.fillStyle = '#ffcd1f';
    ctx.font = '400 22px "Lilita One", system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('SUMMIT', w / 2, top / 2);
    const list = ref.ranked().slice(0, 14);
    const x0 = 190;
    const colW = (w - x0 - 30) / Math.max(1, list.length);
    list.forEach((p, i) => {
      const f = Math.min(TOP, p.extra.f || 0);
      const target = bottom - (f / TOP) * span;
      const y = lerp(shown.get(p.uid) ?? bottom, target, 0.08);
      shown.set(p.uid, y);
      const x = x0 + colW * i + colW / 2;
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 3; ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.moveTo(x, bottom); ctx.lineTo(x, y); ctx.stroke(); ctx.setLineDash([]);
      const size = Math.min(54, colW * 0.75);
      drawBlook(ctx, p.blook, x, y - size / 2 + Math.sin(t * 3 + i) * 3, size);
      nameTag(ctx, `${p.name} · ${f}`, x, y - size - 4, { size: 12, bg: i === 0 ? '#ffcd1f' : 'rgba(23,19,63,.85)', fg: i === 0 ? '#17133f' : '#fff' });
      if (f >= TOP) drawFlag(ctx, x + size / 2, y - size / 2, t, '#6b4cff');
    });
  });
  return () => { stop(); view.destroy(); };
}
