// cutscene.js — the Quickzy intro: a short, loud, happy tour of the app.
//
// Six scenes, about 20 seconds. Shown once on a first visit, and any time
// from the home page. Skip works at any moment; Esc too.

import { h } from './dom.js';
import { logo } from './icons.js';
import { blook } from './blooks.js';
import { confetti } from './confetti.js';
import { sfx, playMusic, stopMusic } from '../game/sound.js';
import { modeArt } from '../game/modes/index.js';

const SEEN = 'quickzy.intro.seen';

export const introSeen = () => { try { return localStorage.getItem(SEEN) === '1'; } catch { return true; } };

const letters = (text, cls = '') => h('span', { class: `cs-word ${cls}` },
  ...[...text].map((ch, i) => h('span', { class: 'cs-letter', style: { animationDelay: `${i * 70}ms` } }, ch)));

function sceneLogo() {
  return h('div', { class: 'cs-scene cs-logo-scene' },
    h('div', { class: 'cs-flash' }),
    h('div', { class: 'cs-big-logo' }, logo()),
    h('h1', { class: 'cs-title' }, letters('Quick'), letters('zy', 'cs-em')),
    h('p', { class: 'cs-sub' }, 'the quiz game that plays like a game'));
}

function sceneMake() {
  const tiles = [['A', 'Mars', '#ff4772'], ['B', 'Jupiter', '#3d8bff'], ['C', 'Venus', '#ffb21f'], ['D', 'Earth', '#19c37d']];
  return h('div', { class: 'cs-scene' },
    h('h2', { class: 'cs-head' }, '1. Make a quiz'),
    h('div', { class: 'cs-card' },
      h('div', { class: 'cs-q' }, 'Which planet is the biggest?'),
      h('div', { class: 'cs-tiles' }, ...tiles.map(([k, t, c], i) =>
        h('div', { class: `cs-tile${i === 1 ? ' cs-right' : ''}`, style: { background: c, animationDelay: `${300 + i * 140}ms` } },
          h('b', {}, k), t)))));
}

function sceneJoin() {
  const crowd = ['fox', 'panda', 'robot', 'unicorn', 'frog', 'penguin', 'alien', 'cat'];
  return h('div', { class: 'cs-scene' },
    h('h2', { class: 'cs-head' }, '2. Everyone joins with a PIN'),
    h('div', { class: 'cs-pin' }, ...'422148'.split('').map((d, i) => h('span', { style: { animationDelay: `${i * 160}ms` } }, d))),
    h('div', { class: 'cs-crowd' }, ...crowd.map((id, i) => h('div', { class: 'cs-drop', style: { animationDelay: `${1000 + i * 140}ms` } }, blook(id, 64)))));
}

function scenePlay() {
  return h('div', { class: 'cs-scene' },
    h('h2', { class: 'cs-head' }, '3. Play it like a game'),
    h('div', { class: 'cs-modes' }, ...['lasertag', 'robotrun', 'spacecraft', 'obby'].map((m, i) =>
      h('div', { class: 'cs-mode', style: { animationDelay: `${i * 220}ms` } }, modeArt(m)))),
    h('div', { class: 'cs-zoom' }, blook('astronaut', 70)));
}

function sceneCollect() {
  return h('div', { class: 'cs-scene' },
    h('h2', { class: 'cs-head' }, '4. Win coins. Collect blooks.'),
    h('div', { class: 'cs-flip' },
      h('div', { class: 'cs-flip-inner' },
        h('div', { class: 'cs-face cs-back' }, logo()),
        h('div', { class: 'cs-face cs-front' }, blook('dragon', 120), h('b', {}, 'LEGENDARY')))));
}

function sceneEnd(close) {
  return h('div', { class: 'cs-scene cs-logo-scene' },
    h('div', { class: 'cs-big-logo cs-small' }, logo()),
    h('h1', { class: 'cs-title cs-final' }, 'Make a quiz.', h('br'), h('em', {}, 'Play it like a game.')),
    h('button', { class: 'btn btn-main btn-lg cs-go', onclick: close }, 'Start playing'));
}

/** Play the intro. Resolves when it is closed. */
export function playIntro() {
  return new Promise((resolve) => {
    try { localStorage.setItem(SEEN, '1'); } catch { /* private mode */ }
    const calm = document.documentElement.dataset.motion === 'calm';
    const stage = h('div', { class: 'cs-stage' });
    const bar = h('div', { class: 'cs-bar' }, h('i'));
    const skip = h('button', { class: 'btn btn-sm cs-skip' }, 'Skip');
    const root = h('div', { class: `cs-root${calm ? ' cs-calm' : ''}`, role: 'dialog', 'aria-label': 'Quickzy intro' },
      h('div', { class: 'cs-stars' }), stage, bar, skip);
    const timers = [];
    const later = (ms, fn) => timers.push(setTimeout(fn, ms));
    let done = false;
    const close = () => {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      stopMusic();
      document.removeEventListener('keydown', key);
      root.classList.add('cs-out');
      setTimeout(() => { root.remove(); resolve(); }, 350);
    };
    const key = (e) => { if (e.key === 'Escape') close(); };
    skip.onclick = close;
    document.addEventListener('keydown', key);
    document.body.append(root);

    const show = (scene) => { stage.replaceChildren(scene); };
    const scenes = [
      [0, () => { show(sceneLogo()); sfx('boost'); later(500, () => sfx('go')); later(900, () => playMusic('lobby')); }],
      [3400, () => { show(sceneMake()); sfx('pick'); later(1500, () => sfx('right')); }],
      [6800, () => { show(sceneJoin()); for (let i = 0; i < 6; i++) later(i * 160, () => sfx('tick')); for (let i = 0; i < 8; i++) later(1000 + i * 140, () => sfx(i % 2 ? 'join' : 'pick')); }],
      [10600, () => { show(scenePlay()); sfx('laser'); later(400, () => sfx('jump')); later(800, () => sfx('boost')); later(1300, () => sfx('laser')); }],
      [14200, () => { show(sceneCollect()); sfx('drum'); later(900, () => { sfx('win'); if (!calm) confetti({ y: 0.55, count: 160 }); }); }],
      [17800, () => { show(sceneEnd(close)); sfx('reveal'); if (!calm) later(200, () => { confetti({ x: 0.2, y: 0.8, angle: -70 }); confetti({ x: 0.8, y: 0.8, angle: -110 }); }); }],
    ];
    for (const [at, fn] of scenes) later(at, () => { if (!done) fn(); });
    bar.firstChild.style.animationDuration = '17.8s';
  });
}
