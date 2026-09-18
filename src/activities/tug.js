// tug.js — Tug of War.
//
// One claim about one snippet, true or false. The rope never stops: the machine
// pulls a little harder every second, so hesitating costs you ground even when
// you are right. Reading a line at a glance is the whole skill.

import { h, codeBlock, confetti, sfx, shuffle } from '../ui.js';
import { icon } from '../icons.js';
import * as store from '../state.js';
import { TUG } from '../data/activities.js';
import { activityShell, finishCard, hudItem, briefing } from './shell.js';

const WIN = 100;           // rope position that ends it
const PULL = 11;           // ground gained by a right answer
const SLIP = 9;            // ground lost by a wrong one
const MACHINE = 0.55;      // ground the machine takes every tick, before ramp

export function tugActivity(activity, go) {
  const score = hudItem('bolt', 0, 'Score');
  const streakItem = hudItem('flame', '0x', 'Right in a row');
  const clock = hudItem('clock', activity.seconds, 'Seconds left');
  const { el, stage } = activityShell(activity, go, score.wrap, streakItem.wrap, clock.wrap);

  let pullTimer = null;
  let clockTimer = null;
  el.addEventListener('view-destroy', () => {
    clearInterval(pullTimer);
    clearInterval(clockTimer);
  });

  stage.replaceChildren(briefing(activity, {
    rules: [
      'A snippet and a claim about it. Answer true or false.',
      'Right pulls the rope your way. Wrong hands ground back.',
      'The machine pulls the whole time, and it gets stronger. Keyboard: ← true, → false.',
    ],
    cta: `Start · ${activity.seconds}s`,
    onStart: run,
  }));

  function run() {
    let pos = 0;
    let points = 0;
    let streak = 0;
    let bestStreak = 0;
    let right = 0;
    let wrong = 0;
    let left = activity.seconds;
    let locked = false;
    let ended = false;

    let queue = shuffle(TUG);
    let qi = 0;

    const knot = h('div', { class: 'tug-knot' }, icon('bolt', { size: 16 }));
    const rope = h('div', { class: 'tug-rope' },
      h('div', { class: 'tug-zone is-them' }),
      h('div', { class: 'tug-zone is-you' }),
      h('div', { class: 'tug-centre' }),
      knot,
    );
    const board = h('div', { class: 'tug-board' });
    const verdict = h('div', { class: 'tug-verdict' });

    stage.replaceChildren(
      h('div', { class: 'card tug-card' },
        h('div', { class: 'tug-rig' },
          h('div', { class: 'tug-side is-them' }, icon('bug', { size: 22 }), h('small', {}, 'The machine')),
          rope,
          h('div', { class: 'tug-side is-you' }, icon('user', { size: 22 }), h('small', {}, 'You')),
        ),
        board,
        verdict,
      ),
    );

    paintRope();
    ask();

    clockTimer = setInterval(() => {
      left -= 1;
      clock.set(left);
      clock.wrap.classList.toggle('hot', left <= 5);
      if (left <= 0) stop('time');
    }, 1000);

    // the machine pulls on its own clock, and leans in as the round goes on
    pullTimer = setInterval(() => {
      const ramp = 1 + (activity.seconds - left) / activity.seconds;
      pos -= MACHINE * ramp;
      paintRope();
      if (pos <= -WIN) stop('lost');
    }, 250);

    function paintRope() {
      const clamped = Math.max(-WIN, Math.min(WIN, pos));
      knot.style.left = `${50 + (clamped / WIN) * 46}%`;
      rope.classList.toggle('is-winning', clamped > 25);
      rope.classList.toggle('is-losing', clamped < -25);
    }

    /* ------------------------------------------------------------ questions */

    function ask() {
      if (qi >= queue.length) {
        queue = shuffle(TUG);
        qi = 0;
      }
      const q = queue[qi++];
      locked = false;
      verdict.replaceChildren();

      const yes = h('button', { class: 'btn tug-answer is-true', onclick: () => answer(q, true) }, icon('check', { size: 18 }), 'True');
      const no = h('button', { class: 'btn tug-answer is-false', onclick: () => answer(q, false) }, icon('close', { size: 18 }), 'False');

      board.replaceChildren(
        h('div', { class: 'tug-claim' },
          codeBlock(q.code),
          h('p', { class: 'tug-line' }, 'It ', h('strong', {}, q.claim), '.'),
        ),
        h('div', { class: 'tug-answers' }, yes, no),
      );
    }

    function answer(q, said) {
      if (locked || ended) return;
      locked = true;
      if (said === q.answer) {
        streak += 1;
        bestStreak = Math.max(bestStreak, streak);
        right += 1;
        const gain = 12 + Math.min(streak, 6) * 3;
        points += gain;
        pos += PULL + Math.min(streak, 5);
        score.set(points);
        streakItem.set(`${streak}x`);
        streakItem.wrap.classList.toggle('is-hot', streak >= 3);
        sfx('good', store.get().sound);
        verdict.className = 'tug-verdict is-ok';
        verdict.replaceChildren(h('span', {}, 'Right — you pull ahead'));
        paintRope();
        if (pos >= WIN) return stop('won');
        setTimeout(() => { if (!ended) ask(); }, 340);
      } else {
        streak = 0;
        wrong += 1;
        points = Math.max(0, points - 6);
        pos -= SLIP;
        score.set(points);
        streakItem.set('0x');
        streakItem.wrap.classList.remove('is-hot');
        sfx('bad', store.get().sound);
        verdict.className = 'tug-verdict is-bad';
        verdict.replaceChildren(h('span', {}, q.why || (q.answer ? 'That one is true.' : 'That one is false.')));
        paintRope();
        if (pos <= -WIN) return stop('lost');
        setTimeout(() => { if (!ended) ask(); }, 1200);
      }
    }

    const onKey = (e) => {
      if (locked || ended) return;
      const q = queue[qi - 1];
      if (e.key === 'ArrowLeft') answer(q, true);
      if (e.key === 'ArrowRight') answer(q, false);
    };
    window.addEventListener('keydown', onKey);
    el.addEventListener('view-destroy', () => window.removeEventListener('keydown', onKey));

    function stop(how) {
      if (ended) return;
      ended = true;
      clearInterval(clockTimer);
      clearInterval(pullTimer);
      window.removeEventListener('keydown', onKey);
      const ground = Math.round(Math.max(-WIN, Math.min(WIN, pos)));
      const total = Math.max(0, points + (how === 'won' ? 150 : 0) + Math.max(0, ground));
      const accuracy = Math.round((right / Math.max(1, right + wrong)) * 100);
      if (how === 'won') confetti(36);
      stage.replaceChildren(
        finishCard(activity, total, go, {
          title: how === 'won'
            ? 'Rope taken — the machine is over the line'
            : how === 'lost'
              ? 'Pulled over. The machine had the ground.'
              : `Time — ${ground > 0 ? 'ahead' : 'behind'} by ${Math.abs(ground)}`,
          mark: how === 'won' ? 'trophy' : 'scale',
          lines: [
            { value: right, label: 'right' },
            { value: `${accuracy}%`, label: 'accuracy' },
            { value: `${bestStreak}x`, label: 'best run' },
          ],
        }),
      );
    }
  }

  return el;
}
