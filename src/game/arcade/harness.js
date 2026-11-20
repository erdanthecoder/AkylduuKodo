// harness.js — what every arcade game shares on the player's device:
// the top bar (time, score, rank, the mode's meter) and the question overlay.
//
// A mode gets a `game` object and builds its world on the stage. When it
// needs a question answered (out of energy, at a gate…) it calls game.ask(),
// which shows the next question and resolves once the host has marked it.

import { picture } from '../../ui/picture.js';
import { h, fill } from '../../ui/dom.js';
import { icon } from '../../ui/icons.js';
import { answerPad, verdict } from '../answer-ui.js';
import { sfx, playMusic } from '../sound.js';
import { confetti } from '../../ui/confetti.js';

function shuffled(n) {
  const a = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function createHarness(root, { live, P, uid, meta, qs, name, blook }) {
  const showText = meta.settings.showText !== false;
  const stage = h('div', { class: 'arcade-stage' });
  const timeEl = h('b', {}, '–:––');
  const scoreEl = h('b', {}, '0');
  const rankEl = h('b', {}, '–');
  const meterFill = h('i');
  const meterText = h('span', {}, '');
  const meterLabel = h('small', {}, '');
  const hud = h('div', { class: 'hud' },
    h('div', { class: 'hud-cell' }, icon('clock', { size: 18 }), timeEl),
    h('div', { class: 'hud-cell hud-meter' }, meterLabel, h('div', { class: 'meter' }, meterFill, meterText)),
    h('div', { class: 'hud-cell' }, icon('star', { size: 18 }), scoreEl),
    h('div', { class: 'hud-cell hud-rank' }, icon('trophy', { size: 18 }), rankEl));
  const overlay = h('div', { class: 'q-overlay', hidden: true });
  const flash = h('div', { class: 'flash-msg' });
  root.append(h('div', { class: 'arcade' }, hud, stage, overlay, flash));

  let order = shuffled(qs.length);
  let at = 0;
  let asking = null;
  let score = 0;
  let mine = null;
  const unsubs = [];

  // marks from the host arrive under res/{uid}
  const waiting = new Map();
  const early = new Map();        // a mark that beat our own write's confirmation
  unsubs.push(live.onChild(P(`res/${uid}`), (id, r) => {
    const w = waiting.get(id);
    if (w) { waiting.delete(id); w(r); } else early.set(id, r);
  }));

  let lastRank = 0;
  let bestStreak = 0;
  const streakEl = h('div', { class: 'hud-streak', hidden: true });
  root.querySelector('.arcade').append(streakEl);
  unsubs.push(live.on(P(`me/${uid}`), (m) => {
    if (!m) return;
    // moving up the leaderboard deserves a shout
    if (lastRank && m.r && m.r < lastRank) {
      game.flash(m.r === 1 ? 'You took 1st place!' : `Up to #${m.r}!`, 'is-ok');
      sfx(m.r === 1 ? 'checkpoint' : 'coin');
      if (m.r === 1) confetti({ y: 0.3, count: 70, power: 700 });
      rankEl.parentElement.classList.remove('is-up'); void rankEl.offsetWidth; rankEl.parentElement.classList.add('is-up');
    } else if (lastRank && m.r && m.r > lastRank && lastRank === 1) {
      game.flash('Someone passed you. Get it back!', 'is-bad');
    }
    lastRank = m.r || lastRank;
    mine = m;
    score = m.s || 0;
    scoreEl.textContent = score.toLocaleString();
    rankEl.textContent = `${m.r || '–'}${m.of ? `/${m.of}` : ''}`;
  }));

  let warned30 = false;
  let warned10 = false;
  const clock = setInterval(() => {
    const left = Math.max(0, meta.endsAt - live.now());
    const s = Math.ceil(left / 1000);
    if (s <= 30 && s > 0 && !warned30) { warned30 = true; game.flash('30 seconds left!', 'is-bad'); playMusic('tense'); }
    if (s <= 10 && s > 0 && !warned10) { warned10 = true; game.flash('Final 10 seconds!', 'is-bad'); sfx('countdown'); root.querySelector('.arcade')?.classList.add('is-final'); }
    timeEl.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    timeEl.classList.toggle('is-low', s <= 30);
  }, 250);

  let flashTimer = 0;
  const game = {
    stage, uid, name, blook, meta, live, P, qs,
    get asking() { return Boolean(asking); },
    get me() { return mine; },
    now: () => live.now(),
    timeLeft: () => Math.max(0, meta.endsAt - live.now()),
    setMeter(label, frac, text = '') {
      meterLabel.textContent = label;
      meterFill.style.width = `${Math.max(0, Math.min(1, frac)) * 100}%`;
      meterFill.classList.toggle('is-low', frac <= 0.2);
      meterText.textContent = text;
    },
    flash(text, kind = '') {
      fill(flash, text);
      flash.className = `flash-msg is-on ${kind}`;
      clearTimeout(flashTimer);
      flashTimer = setTimeout(() => { flash.className = 'flash-msg'; }, 1400);
    },
    shake() {
      const a = root.querySelector('.arcade');
      if (!a || document.documentElement.dataset.motion === 'calm') return;
      a.classList.remove('is-shake'); void a.offsetWidth; a.classList.add('is-shake');
    },
    sendProg: (data) => live.set(P(`prog/${uid}`), data).catch(() => {}),
    sendAct: (data) => live.push(P('act'), { ...data, u: uid, t: live.TIMESTAMP }).catch(() => {}),
    /** Show the next question; resolves {ok, pts, g, poll} once marked. */
    ask({ title = 'Answer to keep going' } = {}) {
      if (asking) return asking;
      asking = new Promise((resolve) => {
        if (at >= order.length) { order = shuffled(qs.length); at = 0; }
        const qi = order[at++];
        const q = qs[qi];
        const shownAt = live.now();
        overlay.hidden = false;
        const finish = (r) => { overlay.hidden = true; fill(overlay); asking = null; resolve(r); };
        const pad = answerPad(q, {
          showText,
          compact: true,
          onSubmit: async (choice) => {
            fill(overlay, h('div', { class: 'q-card' }, h('div', { class: 'spinner' }), h('p', { class: 'muted' }, 'Checking…')));
            let id;
            try {
              id = await live.push(P('ans'), { u: uid, q: qi, c: choice, t: live.TIMESTAMP, s: shownAt });
            } catch {
              finish({ ok: false, error: true, g: 0 }); return;
            }
            const result = early.has(id) ? early.get(id) : await new Promise((res) => {
              waiting.set(id, res);
              setTimeout(() => { if (waiting.has(id)) { waiting.delete(id); res({ ok: false, timeout: true, g: 0 }); } }, 8000);
            });
            if (result.skip || result.timeout) { finish(result); return; }
            sfx(result.ok || result.poll ? 'right' : 'wrong');
            if (result.ok) bestStreak = Math.max(bestStreak, result.st || 1);
            streakEl.hidden = !(result.ok && result.st >= 2);
            if (result.ok && result.st >= 2) fill(streakEl, icon('bolt', { size: 16 }), `${result.st} streak`);
            if (!result.ok && !result.poll) game.shake();
            if (result.ok && result.st >= 3) {
              setTimeout(() => game.flash(`On fire! ${result.st} in a row`, 'is-ok'), 1050);
              confetti({ y: 0.5, count: 60 + Math.min(result.st, 10) * 10, power: 750 });
            }
            fill(overlay, h('div', { class: 'q-card' }, verdict({ ok: result.ok, poll: result.poll, pts: result.pts, display: result.d, streak: result.st }),
              result.g && (result.ok || result.poll) ? h('p', { class: 'grant' }, game.grantText ? game.grantText(result.g) : '') : null));
            setTimeout(() => finish(result), result.ok || result.poll ? 1000 : 2300);
          },
        });
        fill(overlay, h('div', { class: 'q-card' },
          h('p', { class: 'q-title' }, title),
          h('h2', { class: 'q-text-play' }, q.text),
          picture(q.img, { cls: 'q-pic-small' }),
          pad));
      });
      return asking;
    },
    destroy() {
      if (window.__quickzyAsk) delete window.__quickzyAsk;
      clearInterval(clock);
      unsubs.forEach((u) => u());
      waiting.clear();
    },
  };
  // lets the browser tests open a question without playing until a meter runs out
  window.__quickzyAsk = () => game.ask();
  return game;
}
