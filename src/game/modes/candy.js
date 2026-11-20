// candy.js — Candy Factory (Pro): answer right for cash, buy machines,
// and your factory makes candy every second. Score = candy made.
// The host runs the factory, so prices and output can't be faked.

import { h, fill } from '../../ui/dom.js';
import { blook } from '../../ui/blooks.js';
import { sfx } from '../sound.js';

// [name, emoji colour, base cost, candy per second]
export const MACHINES = [
  ['Lollipop press', '#ff4772', 10, 1],
  ['Gummy mould', '#12c9a6', 45, 5],
  ['Chocolate river', '#8a5a2b', 160, 18],
  ['Cotton cloud', '#a560ff', 500, 55],
  ['Rainbow rocket', '#ffcd1f', 1500, 170],
];
export const costOf = (i, owned) => Math.round(MACHINES[i][2] * 1.18 ** owned);
export const cashFor = (rate) => 12 + Math.round(rate * 4);

/* ================================================================== host */

export function createHost({ players, dirty }) {
  const send = (p) => { p.meExtra = { ...(p.meExtra || {}), f: { c: Math.floor(p.extra.cash), r: p.extra.rate, m: p.extra.m.slice() } }; dirty.add(p.uid); };
  let last = 0;
  return {
    join(p) { if (!p.extra.m) { Object.assign(p.extra, { cash: 0, rate: 0, m: MACHINES.map(() => 0), summary: '0 candy' }); send(p); } },
    grant(p, ok) {
      if (!ok) return 0;
      const g = cashFor(p.extra.rate);
      p.extra.cash += g;
      send(p);
      return g;
    },
    act(p, a) {
      const i = Number(a.a);
      if (a.k !== 'b' || !Number.isInteger(i) || !MACHINES[i]) return;
      const e = p.extra;
      const cost = costOf(i, e.m[i]);
      if (e.cash < cost) return;
      e.cash -= cost; e.m[i] += 1; e.rate += MACHINES[i][3];
      send(p);
    },
    tick(now) {
      const secs = last ? Math.min(3, (now - last) / 1000) : 1;
      last = now;
      for (const p of players.values()) {
        if (!p.extra.rate) continue;
        p.score += Math.round(p.extra.rate * secs);
        p.extra.summary = `${p.score} candy · ${p.extra.rate}/s`;
        dirty.add(p.uid);
      }
    },
  };
}

/* ================================================================ player */

export function mountPlayer(game) {
  const { stage, uid, live, P } = game;
  let f = { c: 0, r: 0, m: MACHINES.map(() => 0) };
  game.grantText = (g) => `+$${g}`;
  const cashEl = h('b', { class: 'cf-cash' });
  const rateEl = h('small', {});
  const shop = h('div', { class: 'cf-shop' });
  const belt = h('div', { class: 'cf-belt' });
  const answer = h('button', { class: 'btn btn-main btn-lg' }, 'Answer for cash');
  stage.append(h('div', { class: 'cf-root' },
    h('div', { class: 'cf-top' }, h('h2', {}, 'Candy Factory'), h('div', {}, cashEl, rateEl)),
    belt, answer, shop));
  const draw = () => {
    cashEl.textContent = `$${f.c}`;
    rateEl.textContent = ` · ${f.r} candy a second`;
    fill(shop, ...MACHINES.map(([name, col, , per], i) => {
      const cost = costOf(i, f.m[i] || 0);
      const b = h('button', { class: 'cf-machine', disabled: f.c < cost, style: { '--c': col } },
        h('span', { class: 'cf-icon' }), h('b', {}, name), h('small', {}, `+${per}/s · owned ${f.m[i] || 0}`), h('span', { class: 'cf-cost' }, `$${cost}`));
      b.addEventListener('click', () => { game.sendAct({ k: 'b', a: i }); sfx('coin'); b.classList.add('is-bought'); });
      return b;
    }));
    // one candy on the belt per machine type owned, up to 12
    const n = Math.min(12, f.m.reduce((a, b) => a + b, 0));
    fill(belt, ...Array.from({ length: n }, (_, i) => h('i', { style: { background: MACHINES[i % MACHINES.length][1], animationDelay: `${-i * 0.35}s` } })));
    belt.classList.toggle('is-on', n > 0);
  };
  draw();
  answer.addEventListener('click', async () => {
    answer.disabled = true;
    await game.ask({ title: 'Answer right to earn cash' });
    answer.disabled = false;
  });
  const off = live.on(P(`me/${uid}`), (m) => { if (m && m.f) { f = { c: m.f.c || 0, r: m.f.r || 0, m: m.f.m || [] }; draw(); } });
  return () => off();
}

/* =========================================================== big screen */

export function mountScreen(el, { ref }) {
  const list = h('div', { class: 'th-board' });
  el.append(h('div', { class: 'th-screen cf-screen' }, h('h2', {}, 'Candy Factory'), list));
  const timer = setInterval(() => {
    const top = ref.ranked().slice(0, 8);
    const max = Math.max(1, ...top.map((p) => p.score));
    fill(list, ...top.map((p, i) => h('div', { class: 'th-bar' },
      h('b', {}, String(i + 1)), blook(p.blook, 40), h('span', { class: 'grow' }, p.name),
      h('div', { class: 'th-bar-track' }, h('i', { style: { width: `${(p.score / max) * 100}%` } })),
      h('b', { class: 'th-gold' }, `${p.score} candy`))));
  }, 500);
  return () => clearInterval(timer);
}
