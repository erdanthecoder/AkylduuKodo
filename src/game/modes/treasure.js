// treasure.js — Treasure Hunt (Pro): answer right, open one of three chests.
//
// Chests hold gold, multipliers, a chance to steal from a rival, a swap with
// someone richer, or a trap. The host rolls every chest, so nobody can cheat
// their luck. Score = gold.

import { h, fill } from '../../ui/dom.js';
import { blook, preloadBlooks } from '../../ui/blooks.js';
import { sfx } from '../sound.js';

const STEAL_SHARE = [0.1, 0.25];

/** One chest, rolled by the host. `level` grows with right answers. */
export function rollChest(gold, level, rnd = Math.random) {
  const r = rnd();
  const base = 10 + level * 10;
  if (r < 0.40) return { k: 'gold', amt: Math.round(base * (0.6 + rnd() * 1.4)) };
  if (r < 0.52) return { k: 'x2', amt: Math.max(25, gold) };
  if (r < 0.57) return { k: 'x3', amt: Math.max(50, gold * 2) };
  if (r < 0.72) return { k: 'steal', amt: 0 };
  if (r < 0.77) return { k: 'swap', amt: 0 };
  if (r < 0.90) return { k: 'lose', amt: -Math.round(gold * 0.25) };
  return { k: 'none', amt: 0 };
}

export const CHEST_TEXT = {
  gold: ['coin', 'Gold!'], x2: ['star', 'DOUBLE!'], x3: ['star', 'TRIPLE!'], steal: ['bolt', 'Steal from a rival!'],
  swap: ['users', 'Swap with someone richer!'], lose: ['x', 'Trap! You lost gold'], none: ['x', 'Empty chest'],
};

/* ================================================================== host */

export function createHost({ live, P, players, dirty }) {
  const feed = [];
  const log = (t) => { feed.unshift(t); feed.length = Math.min(feed.length, 6); };
  let seq = 0;
  const tell = (p, ev) => { seq += 1; p.meExtra = { ...(p.meExtra || {}), ev: { ...ev, n: seq } }; dirty.add(p.uid); };
  return {
    join(p) { if (p.extra.ch === undefined) Object.assign(p.extra, { ch: 0, lv: 0, steal: 0, summary: '0 gold' }); },
    grant(p, ok) { if (!ok) return 0; p.extra.ch += 1; p.extra.lv += 1; dirty.add(p.uid); return 1; },
    act(p, a) {
      const e = p.extra;
      if (a.k === 'c') {                       // open a chest
        if (e.ch <= 0 || e.steal) return;
        e.ch -= 1;
        const c = rollChest(p.score, e.lv);
        if (c.k === 'steal' || c.k === 'swap') {
          const others = [...players.values()].filter((o) => o !== p && (c.k === 'steal' ? o.score > 0 : o.score > p.score));
          if (!others.length) { p.score += 20; tell(p, { k: 'gold', amt: 20, i: a.a }); return; }
          e.steal = c.k;
          tell(p, { k: c.k, i: a.a, pick: others.slice(0, 8).map((o) => [o.uid, o.name, o.blook, o.score]) });
          return;
        }
        p.score = Math.max(0, p.score + c.amt);
        e.summary = `${p.score} gold`;
        if (c.k === 'x3' || c.k === 'x2') log(`${p.name} got ${c.k === 'x3' ? 'TRIPLE' : 'DOUBLE'} gold!`);
        tell(p, { k: c.k, amt: c.amt, i: a.a });
      } else if (a.k === 't') {                // pick who to steal from / swap with
        const kind = e.steal;
        const o = typeof a.h === 'string' && players.get(a.h);
        if (!kind || !o || o === p) return;
        e.steal = 0;
        if (kind === 'steal') {
          const share = STEAL_SHARE[0] + Math.random() * (STEAL_SHARE[1] - STEAL_SHARE[0]);
          const amt = Math.max(1, Math.round(o.score * share));
          o.score = Math.max(0, o.score - amt); p.score += amt;
          tell(p, { k: 'stole', amt, who: o.name });
          tell(o, { k: 'robbed', amt, who: p.name });
          log(`${p.name} stole ${amt} gold from ${o.name}!`);
        } else {
          if (o.score <= p.score) { tell(p, { k: 'none', amt: 0 }); return; }
          [p.score, o.score] = [o.score, p.score];
          tell(p, { k: 'swapped', amt: p.score, who: o.name });
          tell(o, { k: 'swappedBy', amt: o.score, who: p.name });
          log(`${p.name} swapped gold with ${o.name}!`);
        }
        for (const x of [p, o]) { x.extra.summary = `${x.score} gold`; dirty.add(x.uid); }
      }
    },
    tick() {
      for (const p of players.values()) p.extra.summary = `${p.score} gold`;
      live.set(P('snap'), { feed }).catch(() => {});
    },
  };
}

/* ================================================================ player */

export function mountPlayer(game) {
  const { stage, uid, live, P } = game;
  let chests = 0;
  let lastEv = 0;
  let busy = false;
  game.grantText = () => 'A chest to open!';
  const status = h('p', { class: 'th-status' }, 'Answer a question to earn a chest.');
  const row = h('div', { class: 'th-chests' });
  const answer = h('button', { class: 'btn btn-main btn-lg' }, 'Answer a question');
  const pick = h('div', { class: 'th-pick', hidden: true });
  stage.append(h('div', { class: 'th-root' }, h('h2', { class: 'th-title' }, 'Treasure Hunt'), status, row, pick, answer));

  const drawChests = (open = -1, ev = null) => fill(row, ...[0, 1, 2].map((i) => {
    const isOpen = i === open;
    const b = h('button', { class: `th-chest${isOpen ? ` is-open is-${ev.k}` : ''}`, disabled: !chests || busy || open >= 0, 'aria-label': `Chest ${i + 1}` },
      h('span', { class: 'th-lid' }), h('span', { class: 'th-box' }),
      isOpen ? h('b', { class: 'th-prize' }, prizeText(ev)) : null);
    b.addEventListener('click', () => {
      if (!chests || busy) return;
      busy = true; chests -= 1;
      b.classList.add('is-shaking'); sfx('reveal');
      game.sendAct({ k: 'c', a: i });
      drawState();
    });
    return b;
  }));
  const prizeText = (ev) => {
    if (!ev) return '';
    if (ev.k === 'gold') return `+${ev.amt}`;
    if (ev.k === 'x2') return 'x2';
    if (ev.k === 'x3') return 'x3';
    if (ev.k === 'lose') return `${ev.amt}`;
    if (ev.k === 'steal') return 'STEAL';
    if (ev.k === 'swap') return 'SWAP';
    return '–';
  };
  const drawState = () => {
    status.textContent = busy ? 'Opening…' : chests ? `Pick a chest! (${chests} to open)` : 'Answer a question to earn a chest.';
    answer.disabled = busy || chests > 0 || game.asking;
    if (!busy) drawChests();
  };
  drawState();

  answer.addEventListener('click', async () => {
    if (busy || chests) return;
    answer.disabled = true;
    const r = await game.ask({ title: 'Answer right to earn a chest' });
    if (r && r.ok) { chests += 1; sfx('coin'); }
    drawState();
  });

  const showPick = (ev) => {
    pick.hidden = false;
    fill(pick, h('b', {}, ev.k === 'steal' ? 'Who do you rob?' : 'Who do you swap with?'),
      h('div', { class: 'th-pick-list' }, ...ev.pick.map(([u, name, bl, s]) => {
        const btn = h('button', { class: 'th-target' }, blook(bl, 40), h('span', {}, name), h('small', {}, `${s} gold`));
        btn.addEventListener('click', () => { game.sendAct({ k: 't', h: u }); pick.hidden = true; busy = true; status.textContent = 'Sneaking in…'; });
        return btn;
      })));
    preloadBlooks(ev.pick.map((x) => x[2]));
  };

  const off = live.on(P(`me/${uid}`), (m) => {
    const ev = m && m.ev;
    if (!ev || ev.n === lastEv) return;
    lastEv = ev.n;
    if (ev.k === 'robbed') { game.flash(`${ev.who} stole ${ev.amt} gold from you!`, 'is-bad'); sfx('wrong'); return; }
    if (ev.k === 'swappedBy') { game.flash(`${ev.who} swapped gold with you!`, 'is-bad'); sfx('wrong'); return; }
    if (ev.k === 'stole') { busy = false; game.flash(`You stole ${ev.amt} gold from ${ev.who}!`, 'is-ok'); sfx('win'); drawState(); return; }
    if (ev.k === 'swapped') { busy = false; game.flash(`Swapped! You now have ${ev.amt} gold`, 'is-ok'); sfx('win'); drawState(); return; }
    drawChests(Number.isInteger(ev.i) ? ev.i : 0, ev);
    const [, text] = CHEST_TEXT[ev.k] || ['', ''];
    const good = ['gold', 'x2', 'x3', 'steal', 'swap'].includes(ev.k);
    game.flash(ev.k === 'gold' ? `+${ev.amt} gold!` : text, good ? 'is-ok' : 'is-bad');
    sfx(good ? (ev.k.startsWith('x') ? 'win' : 'coin') : 'wrong');
    if (ev.k === 'steal' || ev.k === 'swap') { showPick(ev); return; }
    setTimeout(() => { busy = false; drawState(); }, 1300);
  });
  if (navigator.webdriver) window.__quickzyTreasure = { give: () => { chests += 1; drawState(); } };
  return () => { off(); delete window.__quickzyTreasure; };
}

/* =========================================================== big screen */

export function mountScreen(el, { ref, live, P }) {
  const list = h('div', { class: 'th-board' });
  const feedEl = h('div', { class: 'th-feed' });
  el.append(h('div', { class: 'th-screen' }, h('h2', {}, 'Treasure Hunt'), list, feedEl));
  const off = live && P ? live.on(P('snap'), (s) => fill(feedEl, ...((s && s.feed) || []).map((t) => h('p', {}, t)))) : () => {};
  const timer = setInterval(() => {
    const top = ref.ranked().slice(0, 8);
    const max = Math.max(1, ...top.map((p) => p.score));
    fill(list, ...top.map((p, i) => h('div', { class: 'th-bar' },
      h('b', {}, String(i + 1)), blook(p.blook, 40), h('span', { class: 'grow' }, p.name),
      h('div', { class: 'th-bar-track' }, h('i', { style: { width: `${(p.score / max) * 100}%` } })),
      h('b', { class: 'th-gold' }, `${p.score}`))));
  }, 500);
  return () => { clearInterval(timer); off(); };
}
