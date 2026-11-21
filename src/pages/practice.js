// practice.js — play any quiz on your own: no host, no PIN.
//
// The same questions, timer, speed scoring and streaks as a live game,
// marked on this device. That needs the answers, which only signed-in
// accounts may read (never guests), so solo play asks people to sign in.
// Every run earns XP and coins once a day per quiz, and your best score
// for each quiz is remembered on this device.

import { picture } from '../ui/picture.js';
import { videoClip } from '../ui/video.js';
import { h, fill } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { signedIn } from '../services/session.js';
import { getQuiz, getKey } from '../services/quizzes.js';
import { check, points } from '../game/questions.js';
import { answerPad, verdict } from '../game/answer-ui.js';
import { claimGame, levelInfo, me as progressMe } from '../services/progress.js';
import { sfx, playMusic, stopMusic } from '../game/sound.js';
import { confetti, celebrate } from '../ui/confetti.js';
import { cover, authorLine, pageTitle } from './parts.js';
import NotFound from './notfound.js';

const BEST_KEY = 'quickzy.best';
const bests = () => { try { return JSON.parse(localStorage.getItem(BEST_KEY) || '{}'); } catch { return {}; } };
const saveBest = (id, score) => { try { localStorage.setItem(BEST_KEY, JSON.stringify({ ...bests(), [id]: score })); } catch { /* private mode */ } };
const fmt = (n) => Number(n || 0).toLocaleString();

// the ways to play alone: [id, emoji, name, how, colour]
export const SOLO_MODES = [
  ['classic', '🎯', 'Classic', 'Every question once. Faster answers score more.', '#6b4cff'],
  ['speed', '⚡', 'Speed Run', 'As many right answers as you can in 60 seconds.', '#ff8a2a'],
  ['survival', '❤️', 'Survival', 'Three lives. Questions get quicker. How far can you go?', '#ff4772'],
  ['bubble', '🫧', 'Bubble Pop', 'Answers float up as bubbles. Pop the right one!', '#2f9bff'],
  ['flash', '🃏', 'Flashcards', 'Study mode: flip cards and learn the answers.', '#12c9a6'],
];

function shuffled(n) {
  const a = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** A readable version of what the player chose, for the review list. */
function said(q, c) {
  if (c === undefined || c === null) return 'No answer';
  if (q.type === 'tf') return c ? 'True' : 'False';
  if (q.type === 'mc' || q.type === 'poll') return q.options[c];
  if (q.type === 'multi') return c.map((i) => q.options[i]).join(', ');
  if (q.type === 'order') return c.map((i) => q.options[i]).join(' → ');
  return String(c);
}

export default async function Practice({ params }) {
  const quiz = await getQuiz(params.id).catch(() => null);
  if (!quiz) return NotFound();
  pageTitle(`Practise ${quiz.title}`);

  if (!signedIn()) {
    return h('div', { class: 'page narrow' }, h('div', { class: 'card center stack', style: { justifyItems: 'center' } },
      h('h2', {}, 'Sign in to play solo'),
      h('p', { class: 'muted' }, 'Solo games are marked on your own device, so they need an account. It is free, and your XP and coins count towards your blooks.'),
      h('div', { class: 'row', style: { justifyContent: 'center' } },
        h('a', { class: 'btn btn-main', href: `/signup?next=/practice/${quiz.id}` }, 'Sign up'),
        h('a', { class: 'btn', href: `/login?next=/practice/${quiz.id}` }, 'Sign in'))));
  }
  const key = await getKey(quiz.id);
  if (!key) return NotFound();
  const qs = quiz.questions || [];

  const root = h('div', { class: 'solo' });
  let timer = 0;
  let stopped = false;

  /* ------------------------------------------------------------- intro */

  function intro() {
    stopMusic();
    const best = bests()[quiz.id];
    const c = cover(quiz, { big: true });
    fill(root, h('div', { class: 'page narrow stack', style: { gap: '16px' } },
      h('div', { class: 'card', style: { padding: 0, overflow: 'hidden' } }, c,
        h('div', { class: 'stack', style: { padding: '18px 20px 20px' } },
          h('h1', {}, quiz.title),
          authorLine(quiz, { size: 26 }),
          h('div', { class: 'row' },
            h('span', { class: 'pill' }, icon('list', { size: 14 }), `${qs.length} questions`),
            h('span', { class: 'pill' }, icon('bolt', { size: 14 }), 'Faster = more points'),
            best ? h('span', { class: 'pill pill-zing' }, icon('trophy', { size: 14 }), `Your best: ${fmt(best)}`) : null),
          h('div', { class: 'solo-modes' }, ...SOLO_MODES.map(([id, emoji, name, text, col]) => {
            const ok = id !== 'bubble' || qs.some((q) => q.type === 'mc' || q.type === 'tf');
            const mb = bests()[id === 'classic' ? quiz.id : `${quiz.id}:${id}`];
            return h('button', { class: `solo-mode${ok ? '' : ' is-off'}`, style: { '--c': col }, disabled: !ok,
              onclick: () => (id === 'flash' ? flashcards() : id === 'bubble' ? bubbles() : run(id)) },
            h('span', { class: 'solo-mode-ic' }, emoji), h('b', {}, name), h('small', {}, ok ? text : 'Needs multiple-choice questions'),
            mb ? h('span', { class: 'solo-mode-best' }, icon('trophy', { size: 12 }), fmt(mb)) : null);
          })),
          h('a', { class: 'btn btn-block', href: `/host/${quiz.id}` }, icon('users', { size: 18 }), 'Host it live for a group instead')))));
  }

  /* -------------------------------------------------------------- game */

  async function run(mode = 'classic') {
    playMusic(mode === 'classic' ? 'game' : 'tense');
    const order = shuffled(qs.length);
    const log = [];
    let score = 0;
    let streak = 0;
    let best = 0;
    let lives = 3;
    const deadline = performance.now() + 60000;
    const endless = mode === 'speed' || mode === 'survival';
    const total = endless ? 80 : order.length;
    for (let n = 0; n < total; n++) {
      if (stopped) return;
      if (mode === 'speed' && performance.now() >= deadline) break;
      if (mode === 'survival' && lives <= 0) break;
      const i = order[n % order.length];
      let q = qs[i];
      // Speed Run: the clock never stops; Survival: questions get quicker
      if (mode === 'speed') q = { ...q, time: Math.max(2, Math.min(q.time, Math.ceil((deadline - performance.now()) / 1000))), video: null };
      if (mode === 'survival') q = { ...q, time: Math.max(6, q.time - Math.floor(n / 4) * 2), video: null };
      const badge = mode === 'speed' ? speedBadge(deadline) : mode === 'survival' ? h('span', { class: 'solo-hearts' }, '❤️'.repeat(lives) + '🤍'.repeat(3 - lives)) : null;
      const res = await ask(q, i, n, endless ? 0 : order.length, score, streak, badge);
      if (stopped) return;
      if (res.correct) { streak += 1; best = Math.max(best, streak); } else if (!res.poll) { streak = 0; if (mode === 'survival') lives -= 1; }
      let pts = res.correct ? points({ correct: true, elapsedMs: res.ms, limitS: q.time, kind: q.points, speed: true, streak }) : 0;
      if (mode === 'speed' && res.correct) pts = 100 + streak * 25;
      score += pts;
      log.push({ q, choice: res.choice, ok: res.correct, poll: res.poll, pts, display: res.display, ms: res.ms });
      await feedback(res, pts, streak, score, endless);
    }
    finish(log, score, best, mode);
  }

  function speedBadge(deadline) {
    const el = h('span', { class: 'solo-speed' }, '⚡ 60');
    const tick = () => { if (!el.isConnected && el.dataset.on) return; el.dataset.on = '1'; el.textContent = `⚡ ${Math.max(0, Math.ceil((deadline - performance.now()) / 1000))}`; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    return el;
  }

  // a video question plays its clip first; the question comes when you are ready
  function watch(q, n, total) {
    if (!q.video) return Promise.resolve();
    stopMusic();
    return new Promise((resolve) => {
      fill(root, h('div', { class: 'solo-q' },
        h('div', { class: 'solo-top' }, h('span', {}, `${n + 1} / ${total}`), h('span', {}, 'Watch first')),
        h('h2', { class: 'q-text-play' }, q.text),
        videoClip(q.video),
        h('button', { class: 'btn btn-main btn-lg', onclick: () => { playMusic('game'); resolve(); } }, icon('play', { size: 18 }), 'I watched it: answer')));
    });
  }

  async function ask(q, i, n, total, score, streak, badge = null) {
    await watch(q, n, total);
    return new Promise((resolve) => {
      const started = performance.now();
      const bar = h('i');
      const clock = h('b', { class: 'mini-timer' }, String(q.time));
      let done = false;
      const end = (choice) => {
        if (done) return;
        done = true;
        clearInterval(timer);
        const ms = Math.min(performance.now() - started, q.time * 1000);
        const r = choice === undefined ? { correct: false, display: check(q, key[i], null).display, timeout: true } : check(q, key[i], choice);
        resolve({ ...r, choice, ms });
      };
      const pad = answerPad(q, { showText: true, onSubmit: (c) => end(c) });
      fill(root, h('div', { class: 'solo-q' },
        h('div', { class: 'solo-top' },
          h('span', {}, total ? `${n + 1} / ${total}` : `#${n + 1}`),
          badge,
          h('span', { class: 'solo-score' }, icon('star', { size: 16 }), fmt(score)),
          streak > 1 ? h('span', { class: 'pill pill-zing' }, icon('bolt', { size: 14 }), `${streak}`) : null,
          clock),
        h('div', { class: 'solo-bar' }, bar),
        h('h2', { class: 'q-text-play' }, q.text),
        picture(q.img, { cls: 'q-pic-small' }),
        pad));
      requestAnimationFrame(() => { bar.style.transitionDuration = `${q.time}s`; bar.style.width = '0%'; });
      let last = q.time;
      timer = setInterval(() => {
        const left = Math.max(0, q.time - (performance.now() - started) / 1000);
        const s = Math.ceil(left);
        if (s !== last) { last = s; clock.textContent = String(s); if (s <= 5 && s > 0) sfx('tick'); }
        clock.classList.toggle('is-low', s <= 5);
        if (left <= 0) end(undefined);
      }, 100);
    });
  }

  function feedback(res, pts, streak, score, fast = false) {
    return new Promise((resolve) => {
      if (res.poll) sfx('pick'); else sfx(res.correct ? 'right' : 'wrong');
      if (res.correct) confetti({ y: 0.45, count: streak >= 3 ? 140 : 60, power: 800 });
      const v = res.timeout
        ? h('div', { class: 'verdict is-bad' }, h('div', { class: 'verdict-icon' }, icon('clock', { size: 56 })), h('h2', {}, 'Time is up'), h('p', {}, 'The answer was ', h('b', {}, res.display)))
        : verdict({ ok: res.correct, poll: res.poll, pts, display: res.display, streak });
      const next = h('button', { class: 'btn btn-main btn-lg' }, 'Next', icon('arrowRight'));
      const screen = h('div', { class: `play-screen is-verdict ${res.poll ? 'is-poll' : res.correct ? 'is-ok' : 'is-bad'}` },
        v,
        res.correct ? h('p', { class: 'answer-time' }, `Answered in ${(res.ms / 1000).toFixed(1)} s`) : null,
        h('p', { class: 'rank-line' }, `${fmt(score)} points`),
        next);
      fill(root, screen);
      let t = 0;
      const go = () => { clearTimeout(t); document.removeEventListener('keydown', onKey); resolve(); };
      const onKey = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
      next.addEventListener('click', go);
      document.addEventListener('keydown', onKey);
      t = setTimeout(go, fast ? (res.correct ? 650 : 1400) : res.correct ? 2200 : 3800);
      next.focus();
    });
  }

  /* --------------------------------------------------------- minigames */

  // Bubble Pop: the answers float up as bubbles; pop the right one before it
  // gets away. Three lives; wrong pops and lost bubbles cost one.
  function bubbles() {
    const pool = shuffled(qs.length).filter((i) => qs[i].type === 'mc' || qs[i].type === 'tf');
    if (!pool.length) return intro();
    playMusic('arcade');
    const canvas = h('canvas', { class: 'bp-canvas' });
    const qText = h('h2', { class: 'bp-q' });
    const top = h('div', { class: 'solo-top' });
    const exit = h('button', { class: 'btn btn-sm', onclick: () => { cancelAnimationFrame(raf); intro(); } }, 'Quit');
    fill(root, h('div', { class: 'bp' }, h('div', { class: 'bp-head' }, top, exit), qText, canvas));
    const g = canvas.getContext('2d');
    let W = 0; let H = 0;
    const size = () => { const r = canvas.getBoundingClientRect(); W = r.width; H = r.height; canvas.width = W * devicePixelRatio; canvas.height = H * devicePixelRatio; g.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); };
    size();
    let lives = 3; let score = 0; let n = 0; let streak = 0; let best = 0; let raf = 0;
    let bubs = []; let pops = []; let qi = 0; let qStart = 0; let busy = false;
    const log = [];
    const COLS = ['#ff4772', '#2f9bff', '#ffb21f', '#12c9a6', '#a560ff', '#ff8a2a'];
    const drawTop = () => fill(top, h('span', {}, `#${n + 1}`), h('span', { class: 'solo-hearts' }, '❤️'.repeat(lives) + '🤍'.repeat(3 - lives)), h('span', { class: 'solo-score' }, icon('star', { size: 16 }), fmt(score)));
    const next = () => {
      if (lives <= 0 || n >= 20) { cancelAnimationFrame(raf); finish(log, score, best, 'bubble'); return; }
      qi = pool[n % pool.length];
      const q = qs[qi];
      qText.textContent = q.text;
      const opts = q.type === 'tf' ? ['True', 'False'] : q.options;
      bubs = opts.map((label, k) => ({ k, label, x: 0.15 + ((k + 0.5) / opts.length) * 0.7, y: 1.08 + Math.random() * 0.12, r: Math.min(70, Math.max(46, W / (opts.length * 2.6))), speed: 0.05 + Math.random() * 0.012 + Math.min(0.06, n * 0.004), wob: Math.random() * 6, col: COLS[k % 6] }));
      qStart = performance.now(); busy = false; drawTop();
    };
    const tap = (ev) => {
      if (busy) return;
      const r = canvas.getBoundingClientRect();
      const px = (ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left;
      const py = (ev.touches ? ev.touches[0].clientY : ev.clientY) - r.top;
      const b = bubs.find((u) => Math.hypot(px - u.x * W, py - u.y * H) < u.r);
      if (!b) return;
      const res = check(qs[qi], key[qi], b.k);
      for (let i = 0; i < 18; i++) pops.push({ x: b.x * W, y: b.y * H, vx: (Math.random() - 0.5) * 420, vy: (Math.random() - 0.5) * 420, life: 0.6, col: res.correct ? b.col : '#ffffff' });
      bubs = bubs.filter((u) => u !== b);
      log.push({ q: qs[qi], choice: b.k, ok: res.correct, poll: false, pts: 0, display: res.display, ms: performance.now() - qStart });
      if (res.correct) {
        streak += 1; best = Math.max(best, streak);
        const pts = 100 + streak * 20 + Math.max(0, Math.round(150 - (performance.now() - qStart) / 60));
        score += pts; log[log.length - 1].pts = pts;
        sfx('coin'); busy = true; n += 1; setTimeout(next, 450);
      } else { sfx('wrong'); streak = 0; lives -= 1; drawTop(); if (lives <= 0) { busy = true; setTimeout(next, 500); } }
    };
    canvas.addEventListener('pointerdown', tap);
    let last = performance.now();
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      if (!canvas.isConnected) { cancelAnimationFrame(raf); return; }
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      g.clearRect(0, 0, W, H);
      for (const b of bubs) {
        b.y -= b.speed * dt * (H / 600) * 6;
        const x = b.x * W + Math.sin(now / 600 + b.wob) * 14; const y = b.y * H;
        const grad = g.createRadialGradient(x - b.r * 0.35, y - b.r * 0.35, b.r * 0.1, x, y, b.r);
        grad.addColorStop(0, '#ffffffee'); grad.addColorStop(0.25, `${b.col}cc`); grad.addColorStop(1, `${b.col}88`);
        g.fillStyle = grad; g.beginPath(); g.arc(x, y, b.r, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#ffffffaa'; g.lineWidth = 2; g.stroke();
        g.fillStyle = '#fff'; g.font = `800 ${Math.max(13, b.r / 3.4)}px Nunito, system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle';
        const words = String(b.label).split(' '); const lines = []; let line = '';
        for (const w of words) { if ((line + ' ' + w).trim().length > 12) { lines.push(line.trim()); line = w; } else line += ` ${w}`; }
        lines.push(line.trim());
        lines.slice(0, 3).forEach((l, k) => g.fillText(l, x, y + (k - (Math.min(3, lines.length) - 1) / 2) * (b.r / 3)));
        b.x = Math.max(0.08, Math.min(0.92, b.x));
      }
      // the right answer got away: lose a life
      if (!busy && bubs.length && bubs.every((u) => u.y * H < -u.r)) { sfx('wrong'); lives -= 1; streak = 0; busy = true; log.push({ q: qs[qi], ok: false, poll: false, pts: 0, display: check(qs[qi], key[qi], null).display }); n += 1; setTimeout(next, 300); }
      if (!busy) for (const b of bubs) if (b.y * H < -b.r) b.y = 1.15;
      pops = pops.filter((p) => (p.life -= dt) > 0);
      for (const p of pops) { p.x += p.vx * dt; p.y += p.vy * dt; g.globalAlpha = p.life / 0.6; g.fillStyle = p.col; g.beginPath(); g.arc(p.x, p.y, 4, 0, Math.PI * 2); g.fill(); }
      g.globalAlpha = 1;
    };
    next();
    raf = requestAnimationFrame(frame);
  }

  // Flashcards: study mode. Flip a card to see the answer; cards you did
  // not know come back at the end.
  function flashcards() {
    stopMusic();
    const deck = shuffled(qs.length).filter((i) => qs[i].type !== 'poll');
    let known = 0; let flips = 0;
    const show = () => {
      if (!deck.length) {
        sfx('win'); celebrate();
        fill(root, h('div', { class: 'page narrow stack center', style: { gap: '14px' } },
          h('div', { class: 'big-rank' }, '🎓'), h('h1', {}, 'All cards learned!'),
          h('p', { class: 'muted' }, `${known} known first time · ${flips} flips`),
          h('div', { class: 'row', style: { justifyContent: 'center' } },
            h('button', { class: 'btn btn-main', onclick: () => run('classic') }, 'Test yourself now'),
            h('button', { class: 'btn', onclick: () => intro() }, 'Back'))));
        return;
      }
      const i = deck[0]; const q = qs[i];
      const answer = check(q, key[i], null).display;
      const card = h('button', { class: 'fc-card' },
        h('div', { class: 'fc-face fc-front' }, h('small', {}, 'Question · tap to flip'), h('h2', {}, q.text), picture(q.img, { cls: 'q-pic-small' })),
        h('div', { class: 'fc-face fc-back' }, h('small', {}, 'Answer'), h('h2', {}, answer || '—')));
      const again = h('button', { class: 'btn btn-lg', disabled: true }, '🔁 Study again');
      const got = h('button', { class: 'btn btn-main btn-lg', disabled: true }, '✅ I knew it');
      card.addEventListener('click', () => { card.classList.toggle('is-flipped'); flips += 1; sfx('pick'); again.disabled = false; got.disabled = false; });
      got.addEventListener('click', () => { deck.shift(); known += 1; sfx('coin'); show(); });
      again.addEventListener('click', () => { deck.push(deck.shift()); show(); });
      fill(root, h('div', { class: 'fc' },
        h('div', { class: 'solo-top' }, h('span', {}, `${deck.length} left`), h('button', { class: 'btn btn-sm', onclick: () => intro() }, 'Quit')),
        card, h('div', { class: 'row', style: { justifyContent: 'center' } }, again, got)));
    };
    show();
  }

  /* --------------------------------------------------------------- end */

  async function finish(log, score, bestStreak, mode = 'classic') {
    stopMusic();
    const marked = log.filter((x) => !x.poll);
    const right = marked.filter((x) => x.ok).length;
    const bestKey = mode === 'classic' ? quiz.id : `${quiz.id}:${mode}`;
    const before = bests()[bestKey] || 0;
    const record = score > before;
    if (record) saveBest(bestKey, score);
    sfx(record ? 'win' : 'reveal');
    if (record || right === marked.length) celebrate();
    const reward = h('div', { class: 'reward' });
    // homework: hand in the first try
    const hwId = mode === 'classic' ? new URLSearchParams(location.search).get('hw') : null;
    const handIn = h('div');
    if (hwId && /^[A-Za-z0-9]{6,40}$/.test(hwId)) {
      import('../services/homework.js').then((m) => m.submit(hwId, { score, right, total: marked.length }))
        .then((ok) => fill(handIn, h('p', { class: 'pill pill-ok', style: { margin: '0 auto' } }, icon('check', { size: 14 }), ok ? 'Homework handed in!' : 'Your first try was already handed in.')))
        .catch(() => fill(handIn, h('p', { class: 'pill' }, 'This homework is closed.')));
    }
    const today = new Date().toISOString().slice(0, 10);
    const claimKey = `solo:${quiz.id}:${today}`.slice(0, 40);
    let claimed = [];
    try { claimed = JSON.parse(localStorage.getItem('quickzy.claimed') || '[]'); } catch { claimed = []; }
    const already = claimed.includes(claimKey);
    (already ? Promise.resolve(null) : claimGame(claimKey, { s: score, c: right, r: 1 }, 1)).then((r) => {
      if (r) { try { localStorage.setItem('quickzy.claimed', JSON.stringify([...claimed, claimKey].slice(-200))); } catch { /* ignore */ } }
      if (!r) { fill(reward, h('p', { class: 'muted small' }, 'Rewards for this quiz are collected once a day. Try another quiz to earn more.')); return; }
      const info = levelInfo(progressMe().xp);
      fill(reward,
        h('div', { class: 'row', style: { justifyContent: 'center' } }, h('span', { class: 'pill pill-zing' }, `+${r.xp} XP`), h('span', { class: 'pill pill-zing' }, `+${r.coins} coins`)),
        r.levelUp ? h('h2', { class: 'level-up' }, `Level ${r.levelUp}!`) : null,
        h('div', { class: 'xp-bar' }, h('i', { style: { width: `${Math.round(info.frac * 100)}%` } })));
      if (r.levelUp) { sfx('checkpoint'); celebrate(); }
    }).catch(() => {});

    fill(root, h('div', { class: 'page narrow stack', style: { gap: '16px' } },
      h('div', { class: 'card center stack', style: { justifyItems: 'center' } },
        h('p', { class: 'muted', style: { margin: 0 } }, quiz.title),
        h('div', { class: 'big-score' }, fmt(score)),
        record ? h('span', { class: 'pill pill-zing' }, icon('trophy', { size: 14 }), before ? 'New personal best' : 'First score') : h('span', { class: 'pill' }, `Best: ${fmt(before)}`),
        h('div', { class: 'row', style: { justifyContent: 'center' } },
          h('span', { class: 'pill' }, icon('check', { size: 14 }), `${right} of ${marked.length} right`),
          h('span', { class: 'pill' }, icon('bolt', { size: 14 }), `Best streak ${bestStreak}`)),
        handIn,
        reward,
        h('div', { class: 'row', style: { justifyContent: 'center' } },
          h('button', { class: 'btn btn-main', onclick: () => run() }, icon('shuffle', { size: 18 }), 'Play again'),
          h('a', { class: 'btn', href: '/discover' }, icon('compass', { size: 18 }), 'More quizzes'))),
      h('h2', {}, 'Review'),
      h('ol', { class: 'review' }, ...log.map((x) => h('li', { class: x.poll ? 'is-poll' : x.ok ? 'is-ok' : 'is-bad' },
        h('span', { class: 'mark' }, icon(x.poll ? 'chart' : x.ok ? 'check' : 'close', { size: 18, stroke: 3 })),
        h('div', { class: 'grow' },
          h('b', {}, x.q.text),
          h('div', { class: 'small' }, 'You: ', said(x.q, x.choice)),
          !x.ok && !x.poll ? h('div', { class: 'small' }, 'Answer: ', h('b', {}, x.display)) : null),
        x.pts ? h('span', { class: 'pts' }, `+${x.pts}`) : null)))));
    window.scrollTo(0, 0);
  }

  intro();
  return { el: root, destroy() { stopped = true; clearInterval(timer); stopMusic(); } };
}
