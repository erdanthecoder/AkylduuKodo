// boss.js — Boss Battle.
//
// Three phases against one error that never explains itself: first spot what is
// broken, then say what the code prints, then hold a value in your head. Every
// right answer lands a hit, and a wrong one costs a shield — so reading
// carefully is worth more than answering quickly.

import { h, codeBlock, confetti, sfx, shuffle } from '../ui.js';
import { icon } from '../icons.js';
import * as store from '../state.js';
import { BOSS } from '../data/activities.js';
import { activityShell, finishCard, hudItem, briefing } from './shell.js';

const SHIELDS = 3;
const THINK = 25;          // seconds a question is worth full damage for
const BASE_HIT = 26;

export function bossActivity(activity, go) {
  const score = hudItem('bolt', 0, 'Damage dealt');
  const shieldWrap = h('div', { class: 'hud-item boss-shields', title: 'Shields left' });
  const { el, stage } = activityShell(activity, go, score.wrap, shieldWrap);

  let tick = null;
  el.addEventListener('view-destroy', () => clearInterval(tick));

  stage.replaceChildren(briefing(activity, {
    rules: [
      `${BOSS.name} has three phases: ${BOSS.phases.map((p) => p.name).join(', ')}.`,
      'Each right answer hits. Answer sooner and it hits harder.',
      `A wrong answer costs one of your ${SHIELDS} shields, and it tells you why.`,
    ],
    cta: 'Face it',
    onStart: run,
  }));

  function run() {
    let phaseIndex = 0;
    let shields = SHIELDS;
    let damage = 0;
    let streak = 0;
    let bestStreak = 0;
    let right = 0;
    let wrong = 0;
    let phasesCleared = 0;

    const hpFill = h('div', { class: 'boss-hp-fill' });
    const hpLabel = h('span', { class: 'boss-hp-label' }, '');
    const phaseName = h('strong', {}, '');
    const phaseTag = h('small', { class: 'muted' }, '');
    const face = h('div', { class: 'boss-face' }, icon('bug', { size: 40 }));
    const pips = h('div', { class: 'boss-pips' });
    const question = h('div', { class: 'boss-question' });
    const timerBar = h('div', { class: 'boss-timer-fill' });

    const bossPanel = h('div', { class: 'boss-panel' },
      face,
      h('div', { class: 'boss-meta' },
        h('div', { class: 'boss-name' }, BOSS.name, h('span', { class: 'boss-phase' }, phaseName)),
        phaseTag,
        h('div', { class: 'boss-hp' }, hpFill, hpLabel),
        pips,
      ),
    );

    stage.replaceChildren(
      h('div', { class: 'card boss-card' },
        bossPanel,
        h('div', { class: 'boss-timer' }, timerBar),
        question,
      ),
    );

    function paintShields() {
      shieldWrap.replaceChildren(
        ...Array.from({ length: SHIELDS }, (_, i) =>
          h('span', { class: 'boss-shield' + (i < shields ? '' : ' is-gone') }, icon('star', { size: 16 })),
        ),
      );
    }

    /* --------------------------------------------------------------- phase */

    let phase = null;
    let queue = [];
    let qi = 0;
    let hp = 0;

    function startPhase() {
      phase = BOSS.phases[phaseIndex];
      hp = phase.hp;
      queue = shuffle(phase.questions);
      qi = 0;
      phaseName.textContent = `Phase ${phaseIndex + 1} · ${phase.name}`;
      phaseTag.textContent = phase.tagline;
      pips.replaceChildren(
        ...BOSS.phases.map((_, i) =>
          h('span', { class: 'boss-pip' + (i < phaseIndex ? ' is-done' : i === phaseIndex ? ' is-now' : '') }),
        ),
      );
      paintHp();
      banner(`Phase ${phaseIndex + 1} — ${phase.name}`, phase.tagline, ask);
    }

    function paintHp() {
      const pct = Math.max(0, (hp / phase.hp) * 100);
      hpFill.style.width = `${pct}%`;
      hpFill.classList.toggle('is-low', pct < 30);
      hpLabel.textContent = `${Math.max(0, Math.round(hp))} / ${phase.hp}`;
    }

    /** A beat between phases, so a phase change reads as an event. */
    function banner(title, sub, then) {
      question.replaceChildren(
        h('div', { class: 'boss-banner' },
          h('h3', {}, title),
          h('p', { class: 'muted' }, sub),
        ),
      );
      setTimeout(() => { if (!ended) then(); }, 1100);
    }

    /* ------------------------------------------------------------ question */

    let left = THINK;

    function ask() {
      if (qi >= queue.length) {
        queue = shuffle(phase.questions);
        qi = 0;
      }
      const q = queue[qi++];
      left = THINK;
      clearInterval(tick);
      tick = setInterval(() => {
        left -= 0.1;
        timerBar.style.width = `${Math.max(0, (left / THINK) * 100)}%`;
        timerBar.classList.toggle('is-low', left < THINK * 0.3);
        if (left <= 0) {
          clearInterval(tick);
          answer(q, -1, null);
        }
      }, 100);
      timerBar.style.width = '100%';

      const options = h('div', { class: 'options' });
      question.replaceChildren(
        h('h3', { class: 'boss-prompt' }, phase.prompt),
        codeBlock(q.code),
        options,
      );
      q.options.forEach((label, i) => {
        options.append(h('button', {
          class: 'option',
          onclick: () => answer(q, i, options),
        }, label));
      });
    }

    function answer(q, choice, options) {
      clearInterval(tick);
      if (options) [...options.children].forEach((b) => { b.disabled = true; });

      if (choice === q.answer) {
        const speed = Math.max(0, left / THINK);
        const hit = Math.round(BASE_HIT + speed * 18 + Math.min(streak, 5) * 4);
        hp -= hit;
        damage += hit;
        streak += 1;
        right += 1;
        bestStreak = Math.max(bestStreak, streak);
        score.set(damage);
        paintHp();
        if (options) options.children[choice].classList.add('option-right');
        face.classList.remove('is-hurt');
        void face.offsetWidth;
        face.classList.add('is-hurt');
        floatText(`-${hit}`, 'ok');
        sfx('good', store.get().sound);

        if (hp <= 0) {
          phasesCleared += 1;
          confetti(18);
          setTimeout(() => {
            if (ended) return;
            phaseIndex += 1;
            if (phaseIndex >= BOSS.phases.length) return stop(true);
            startPhase();
          }, 900);
          return;
        }
        setTimeout(() => { if (!ended) ask(); }, 620);
        return;
      }

      streak = 0;
      wrong += 1;
      shields -= 1;
      paintShields();
      if (options && choice >= 0) options.children[choice].classList.add('option-wrong');
      if (options) options.children[q.answer].classList.add('option-right');
      bossPanel.classList.remove('is-striking');
      void bossPanel.offsetWidth;
      bossPanel.classList.add('is-striking');
      floatText(choice < 0 ? 'Too slow' : 'Shield down', 'bad');
      sfx('bad', store.get().sound);

      question.append(h('div', { class: 'feedback bad boss-why' }, q.why));
      if (shields <= 0) {
        setTimeout(() => { if (!ended) stop(false); }, 1600);
        return;
      }
      setTimeout(() => { if (!ended) ask(); }, 1700);
    }

    function floatText(text, kind) {
      const node = h('span', { class: `boss-float is-${kind}` }, text);
      bossPanel.append(node);
      setTimeout(() => node.remove(), 900);
    }

    /* ----------------------------------------------------------- the ending */

    let ended = false;

    function stop(won) {
      if (ended) return;
      ended = true;
      clearInterval(tick);
      const total = damage + phasesCleared * 60 + (won ? shields * 40 : 0);
      const accuracy = Math.round((right / Math.max(1, right + wrong)) * 100);
      if (won) confetti(40);
      stage.replaceChildren(
        finishCard(activity, total, go, {
          title: won
            ? `${BOSS.name} is beaten`
            : `Down in phase ${phaseIndex + 1} — ${phase.name}`,
          mark: won ? 'trophy' : 'flame',
          lines: [
            { value: `${phasesCleared}/${BOSS.phases.length}`, label: 'phases' },
            { value: `${accuracy}%`, label: 'accuracy' },
            { value: `${bestStreak}x`, label: 'best run' },
          ],
        }),
      );
    }

    paintShields();
    startPhase();
  }

  return el;
}
