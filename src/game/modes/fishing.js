// fishing.js — Fishing Frenzy (Pro): answer right for bait, cast, and reel
// in at the right moment. Better timing hooks rarer, heavier fish.
// The host rolls every catch. Score = pounds of fish.

import { h, fill } from '../../ui/dom.js';
import { blook } from '../../ui/blooks.js';
import { sfx } from '../sound.js';
import { makeCanvas, loop } from '../arcade/engine.js';

// [name, colour, min lb, max lb, weight of chance]
export const FISH = [
  ['Minnow', '#9fb6c9', 1, 4, 30],
  ['Sardine', '#7fa8d6', 3, 8, 24],
  ['Trout', '#c98a5a', 6, 15, 18],
  ['Salmon', '#ff8a6a', 10, 25, 12],
  ['Tuna', '#4a6fb5', 20, 45, 8],
  ['Swordfish', '#3a4f8f', 35, 70, 5],
  ['Golden Koi', '#ffcd1f', 60, 120, 2.2],
  ['Kraken', '#a560ff', 120, 250, 0.8],
];

/** Roll a catch. `q` is the reel timing, 0 (missed) … 1 (perfect). */
export function rollFish(q, rnd = Math.random) {
  if (q < 0.15) return null;                          // it got away
  const boost = 1 + q * q * 6;                         // great timing favours rare fish
  const table = FISH.map((f, i) => f[4] * (i >= 3 ? boost : 1));
  let r = rnd() * table.reduce((a, b) => a + b, 0);
  let i = 0;
  while (r > table[i]) { r -= table[i]; i += 1; }
  const [, , lo, hi] = FISH[i];
  return { i, lb: Math.round(lo + (hi - lo) * rnd() * (0.6 + q * 0.4)) };
}

/* ================================================================== host */

export function createHost({ live, P, players, dirty }) {
  const feed = [];
  let seq = 0;
  return {
    join(p) { if (p.extra.bait === undefined) Object.assign(p.extra, { bait: 0, best: 0, summary: '0 lb' }); },
    grant(p, ok) { if (!ok) return 0; p.extra.bait += 1; return 1; },
    act(p, a) {
      if (a.k !== 'f' || p.extra.bait <= 0) return;
      p.extra.bait -= 1;
      const q = Math.max(0, Math.min(1, Number(a.a) || 0));
      const fish = rollFish(q);
      seq += 1;
      if (fish) {
        p.score += fish.lb;
        p.extra.best = Math.max(p.extra.best, fish.lb);
        p.extra.summary = `${p.score} lb · best ${p.extra.best} lb`;
        if (fish.i >= 6) { feed.unshift(`${p.name} caught a ${FISH[fish.i][0]}! (${fish.lb} lb)`); feed.length = Math.min(feed.length, 6); }
      }
      p.meExtra = { ...(p.meExtra || {}), ev: { n: seq, f: fish ? fish.i : -1, lb: fish ? fish.lb : 0 } };
      dirty.add(p.uid);
    },
    tick() { live.set(P('snap'), { feed }).catch(() => {}); },
  };
}

/* ================================================================ player */

export function mountPlayer(game) {
  const { stage, uid, live, P } = game;
  let bait = 0;
  let state = 'idle';          // idle | cast | bite | wait
  let t = 0;
  let bar = 0;                 // the reel marker, 0…1
  let zone = 0.5;
  let biteAt = 0;
  let lastEv = 0;
  let caught = null;           // { i, lb, at }
  game.grantText = () => '+1 bait';

  const view = makeCanvas(stage);
  const btn = h('button', { class: 'btn btn-main btn-lg fi-btn' }, 'Answer for bait');
  const info = h('div', { class: 'fi-info' });
  stage.append(h('div', { class: 'fi-ui' }, info, btn));
  const draw = () => {
    fill(info, h('b', {}, `Bait: ${bait}`));
    btn.disabled = game.asking || state === 'cast' || state === 'wait';
    btn.textContent = state === 'bite' ? 'REEL IN!' : bait ? 'Cast your line' : 'Answer for bait';
    btn.classList.toggle('is-reel', state === 'bite');
  };
  draw();

  btn.addEventListener('click', async () => {
    if (state === 'bite') { reel(); return; }
    if (!bait) {
      btn.disabled = true;
      const r = await game.ask({ title: 'Answer right to get bait' });
      if (r && r.ok) { bait += 1; sfx('coin'); }
      draw();
      return;
    }
    state = 'cast'; bait -= 1; sfx('jump'); t = 0;
    biteAt = 1.2 + Math.random() * 2;
    zone = 0.25 + Math.random() * 0.5;
    draw();
  });

  function reel() {
    if (state !== 'bite') return;
    const q = Math.max(0, 1 - Math.abs(bar - zone) / 0.32);
    state = 'wait';
    game.sendAct({ k: 'f', a: Math.round(q * 100) / 100 });
    draw();
  }

  const off = live.on(P(`me/${uid}`), (m) => {
    const ev = m && m.ev;
    if (!ev || ev.n === lastEv) return;
    lastEv = ev.n;
    state = 'idle';
    if (ev.f < 0) { game.flash('It got away!', 'is-bad'); sfx('wrong'); } else {
      caught = { i: ev.f, lb: ev.lb, at: t };
      const [name] = FISH[ev.f];
      game.flash(`${name}! ${ev.lb} lb`, 'is-ok');
      sfx(ev.f >= 6 ? 'win' : 'checkpoint');
    }
    draw();
  });

  const fishShape = (ctx, x, y, s, col) => {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse(x, y, 26 * s, 13 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 22 * s, y); ctx.lineTo(x - 40 * s, y - 13 * s); ctx.lineTo(x - 40 * s, y + 13 * s); ctx.fill();
    ctx.fillStyle = '#17133f'; ctx.beginPath(); ctx.arc(x + 14 * s, y - 3 * s, 3 * s, 0, Math.PI * 2); ctx.fill();
  };

  const stop = loop((dt) => {
    t += dt;
    if (state === 'cast' && t > biteAt) { state = 'bite'; t = 0; sfx('reveal'); draw(); }
    if (state === 'bite') {
      bar = (Math.sin(t * 3.2) + 1) / 2;
      if (t > 4) { state = 'wait'; game.sendAct({ k: 'f', a: 0 }); draw(); }
    }
  }, () => {
    const { ctx, w, h: hh } = view;
    view.begin();
    const sky = ctx.createLinearGradient(0, 0, 0, hh * 0.4);
    sky.addColorStop(0, '#ffb86b'); sky.addColorStop(1, '#ffe2b0');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, hh * 0.4);
    const sea = ctx.createLinearGradient(0, hh * 0.4, 0, hh);
    sea.addColorStop(0, '#2fb8ff'); sea.addColorStop(1, '#0b3a7a');
    ctx.fillStyle = sea; ctx.fillRect(0, hh * 0.4, w, hh * 0.6);
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) { const y = hh * 0.45 + i * 30; ctx.beginPath(); for (let x = 0; x <= w; x += 20) ctx.lineTo(x, y + Math.sin(x / 40 + t * 2 + i) * 4); ctx.stroke(); }
    // dock and fisher
    ctx.fillStyle = '#8a5a2b'; ctx.fillRect(0, hh * 0.36, w * 0.28, 18);
    blookDraw(ctx, w * 0.16, hh * 0.36 - 30);
    // line and bobber
    const bx = w * 0.62; const by = hh * 0.48 + (state === 'bite' ? Math.sin(t * 25) * 6 : Math.sin(t * 2) * 2);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(w * 0.22, hh * 0.24); ctx.quadraticCurveTo(w * 0.45, hh * 0.2, bx, by); ctx.stroke();
    ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(w * 0.17, hh * 0.36 - 10); ctx.lineTo(w * 0.22, hh * 0.24); ctx.stroke();
    if (state !== 'idle') { ctx.fillStyle = '#ff4772'; ctx.beginPath(); ctx.arc(bx, by, 7, 0, Math.PI * 2); ctx.fill(); }
    // fish swimming below
    for (let i = 0; i < 5; i++) {
      const x = ((t * (30 + i * 12) + i * 200) % (w + 120)) - 60;
      fishShape(ctx, x, hh * (0.6 + i * 0.07), 0.6, 'rgba(255,255,255,.18)');
    }
    // the reel meter
    if (state === 'bite') {
      const mx = w * 0.1; const mw = w * 0.8; const my = hh * 0.82;
      ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(mx, my, mw, 22);
      ctx.fillStyle = '#12c9a6'; ctx.fillRect(mx + (zone - 0.08) * mw, my, 0.16 * mw, 22);
      ctx.fillStyle = '#ffcd1f'; ctx.fillRect(mx + bar * mw - 4, my - 6, 8, 34);
      ctx.fillStyle = '#fff'; ctx.font = '400 26px "Lilita One", system-ui'; ctx.textAlign = 'center';
      ctx.fillText('BITE! Reel in on the green!', w / 2, my - 16);
    }
    // the catch
    if (caught && t - caught.at < 2.4) {
      const [name, col] = FISH[caught.i];
      const k = Math.min(1, (t - caught.at) * 3);
      fishShape(ctx, w / 2, hh * 0.3 + (1 - k) * 80, 1.6 + Math.min(1.4, caught.lb / 80), col);
      ctx.fillStyle = '#fff'; ctx.font = '400 28px "Lilita One", system-ui'; ctx.textAlign = 'center';
      ctx.fillText(`${name} · ${caught.lb} lb`, w / 2, hh * 0.3 - 56);
    }
  });
  function blookDraw(ctx, x, y) { ctx.fillStyle = '#ffcd1f'; ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#17133f'; ctx.beginPath(); ctx.arc(x - 6, y - 3, 3, 0, Math.PI * 2); ctx.arc(x + 6, y - 3, 3, 0, Math.PI * 2); ctx.fill(); }
  const key = (e) => { if (e.code === 'Space' && state === 'bite') { e.preventDefault(); reel(); } };
  window.addEventListener('keydown', key);
  if (navigator.webdriver) window.__quickzyFishing = { give: () => { bait += 1; draw(); }, state: () => state };
  return () => { stop(); view.destroy(); off(); window.removeEventListener('keydown', key); delete window.__quickzyFishing; };
}

/* =========================================================== big screen */

export function mountScreen(el, { ref, live, P }) {
  const list = h('div', { class: 'th-board' });
  const feedEl = h('div', { class: 'th-feed' });
  el.append(h('div', { class: 'th-screen fi-screen' }, h('h2', {}, 'Fishing Frenzy'), list, feedEl));
  const off = live && P ? live.on(P('snap'), (s) => fill(feedEl, ...((s && s.feed) || []).map((t) => h('p', {}, t)))) : () => {};
  const timer = setInterval(() => {
    const top = ref.ranked().slice(0, 8);
    const max = Math.max(1, ...top.map((p) => p.score));
    fill(list, ...top.map((p, i) => h('div', { class: 'th-bar' },
      h('b', {}, String(i + 1)), blook(p.blook, 40), h('span', { class: 'grow' }, p.name),
      h('div', { class: 'th-bar-track' }, h('i', { style: { width: `${(p.score / max) * 100}%` } })),
      h('b', { class: 'th-gold' }, `${p.score} lb`))));
  }, 500);
  return () => { clearInterval(timer); off(); };
}
