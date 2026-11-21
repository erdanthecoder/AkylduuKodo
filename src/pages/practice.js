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
          h('button', { class: 'btn btn-main btn-xl btn-block', onclick: () => run() }, icon('play'), 'Start'),
          h('a', { class: 'btn btn-block', href: `/host/${quiz.id}` }, icon('users', { size: 18 }), 'Host it live for a group instead')))));
  }

  /* -------------------------------------------------------------- game */

  async function run() {
    playMusic('game');
    const order = shuffled(qs.length);
    const log = [];
    let score = 0;
    let streak = 0;
    let best = 0;
    for (let n = 0; n < order.length; n++) {
      if (stopped) return;
      const i = order[n];
      const q = qs[i];
      const res = await ask(q, i, n, order.length, score, streak);
      if (stopped) return;
      if (res.correct) { streak += 1; best = Math.max(best, streak); } else if (!res.poll) streak = 0;
      const pts = res.correct ? points({ correct: true, elapsedMs: res.ms, limitS: q.time, kind: q.points, speed: true, streak }) : 0;
      score += pts;
      log.push({ q, choice: res.choice, ok: res.correct, poll: res.poll, pts, display: res.display, ms: res.ms });
      await feedback(res, pts, streak, score);
    }
    finish(log, score, best);
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

  async function ask(q, i, n, total, score, streak) {
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
          h('span', {}, `${n + 1} / ${total}`),
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

  function feedback(res, pts, streak, score) {
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
      t = setTimeout(go, res.correct ? 2200 : 3800);
      next.focus();
    });
  }

  /* --------------------------------------------------------------- end */

  async function finish(log, score, bestStreak) {
    stopMusic();
    const marked = log.filter((x) => !x.poll);
    const right = marked.filter((x) => x.ok).length;
    const before = bests()[quiz.id] || 0;
    const record = score > before;
    if (record) saveBest(quiz.id, score);
    sfx(record ? 'win' : 'reveal');
    if (record || right === marked.length) celebrate();
    const reward = h('div', { class: 'reward' });
    // homework: hand in the first try
    const hwId = new URLSearchParams(location.search).get('hw');
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
