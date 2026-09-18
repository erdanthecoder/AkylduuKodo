// laser.js — Laser Tag.
//
// A charge sits on the cannon and targets drift across the arena, each wearing
// an expression. Tag the one whose value matches. The arena guarantees there is
// always exactly one right answer in the air, so a miss is a reading mistake
// and never bad luck.

import { h, confetti, sfx } from '../ui.js';
import * as store from '../state.js';
import { calmMotion } from '../prefs.js';
import { TARGETS } from '../data/activities.js';
import { activityShell, finishCard, hudItem, briefing } from './shell.js';

const MAX_LIVE = 5;
const LANES = [0.06, 0.22, 0.38, 0.54, 0.70];

export function laserActivity(activity, go) {
  const score = hudItem('bolt', 0, 'Score');
  const combo = hudItem('flame', '0x', 'Targets in a row');
  const clock = hudItem('clock', activity.seconds, 'Seconds left');
  const { el, stage } = activityShell(activity, go, score.wrap, combo.wrap, clock.wrap);

  let raf = null;
  let timer = null;
  el.addEventListener('view-destroy', () => {
    cancelAnimationFrame(raf);
    clearInterval(timer);
  });

  stage.replaceChildren(briefing(activity, {
    rules: [
      'The cannon holds a number. Tag the target whose expression equals it.',
      'A right tag banks points and the run keeps building — a wrong one costs you the run.',
      'Keyboard: the number on a target fires at it.',
    ],
    cta: `Start · ${activity.seconds}s`,
    onStart: run,
  }));

  function run() {
    let left = activity.seconds;
    let points = 0;
    let streak = 0;
    let bestStreak = 0;
    let hits = 0;
    let misses = 0;
    let charge = null;
    let chargeAt = 0;
    let lastFrame = performance.now();
    let elapsed = 0;

    const live = [];
    const arena = h('div', { class: 'laser-arena' });
    const chargeEl = h('strong', { class: 'laser-charge-value' }, '—');
    const cannon = h('div', { class: 'laser-cannon' },
      h('div', { class: 'laser-barrel' }),
      h('div', { class: 'laser-charge' },
        h('small', {}, 'Charge'),
        chargeEl,
      ),
    );

    stage.replaceChildren(
      h('div', { class: 'card laser-card' },
        h('div', { class: 'laser-field' }, arena, cannon),
        h('p', { class: 'muted small laser-hint' }, 'Tag the expression that equals the charge.'),
      ),
    );

    clock.set(left);
    timer = setInterval(() => {
      left -= 1;
      clock.set(left);
      clock.el.parentElement.classList.toggle('hot', left <= 5);
      if (left <= 0) stop();
    }, 1000);

    /* ------------------------------------------------------------ targets */

    function spawn(forced, at) {
      const pick = forced !== undefined
        ? TARGETS.filter((t) => t.value === forced)
        : TARGETS;
      const spec = pick[Math.floor(Math.random() * pick.length)];
      const lane = freeLane();
      if (lane === null) return null;
      const node = h('button', { class: 'laser-target', type: 'button' },
        h('span', { class: 'laser-key' }, ''),
        h('code', {}, spec.expr),
      );
      const t = {
        spec, node, lane,
        x: at !== undefined ? at : 1.04 + Math.random() * 0.14,
        speed: 0.105 + Math.random() * 0.05 + elapsed * 0.0018,
        dead: false,
      };
      node.style.top = `${LANES[lane] * 100}%`;
      node.addEventListener('click', () => fire(t));
      arena.append(node);
      live.push(t);
      place(t);
      return t;
    }

    /** Keep two targets out of the same lane so nothing overlaps. */
    function freeLane() {
      const taken = new Set(live.filter((t) => t.x > 0.82).map((t) => t.lane));
      const open = LANES.map((_, i) => i).filter((i) => !taken.has(i));
      if (!open.length) return null;
      return open[Math.floor(Math.random() * open.length)];
    }

    // x is a fraction of the arena, but a percentage translate would be a
    // percentage of the target's own width — so it is turned into pixels here.
    let arenaWidth = 0;
    const measure = () => { arenaWidth = arena.clientWidth || 600; };

    function place(t) {
      t.node.style.transform = `translate3d(${(t.x * arenaWidth).toFixed(1)}px, 0, 0)`;
    }

    function remove(t) {
      t.dead = true;
      t.node.remove();
      const i = live.indexOf(t);
      if (i >= 0) live.splice(i, 1);
    }

    function renumber() {
      live
        .slice()
        .sort((a, b) => a.x - b.x)
        .forEach((t, i) => {
          t.key = i < 9 ? String(i + 1) : '';
          t.node.firstChild.textContent = t.key;
        });
    }

    /* ------------------------------------------------------------- charge */

    function setCharge(value) {
      charge = value;
      chargeAt = performance.now();
      chargeEl.textContent = String(value);
      chargeEl.classList.remove('is-new');
      void chargeEl.offsetWidth;
      chargeEl.classList.add('is-new');
      mark();
    }

    /** The matching target wears the live colour so the eye has somewhere to go
     *  once it has done the arithmetic. */
    function mark() {
      live.forEach((t) => t.node.classList.toggle('is-match', t.spec.value === charge));
    }

    /* --------------------------------------------------------------- firing */

    function fire(t) {
      if (t.dead || charge === null) return;
      beam(t);
      if (t.spec.value === charge) {
        const quick = performance.now() - chargeAt < 2200;
        const gain = 20 + Math.min(streak, 6) * 5 + (quick ? 10 : 0);
        points += gain;
        streak += 1;
        hits += 1;
        bestStreak = Math.max(bestStreak, streak);
        score.set(points);
        combo.set(`${streak}x`);
        combo.wrap.classList.toggle('is-hot', streak >= 3);
        sfx('good', store.get().sound);
        t.node.classList.add('is-hit');
        setTimeout(() => remove(t), 220);
        setTimeout(() => { if (!ended) nextCharge(t); }, 120);
      } else {
        points = Math.max(0, points - 8);
        streak = 0;
        misses += 1;
        score.set(points);
        combo.set('0x');
        combo.wrap.classList.remove('is-hot');
        sfx('bad', store.get().sound);
        t.node.classList.add('is-miss');
        setTimeout(() => t.node.classList.remove('is-miss'), 400);
      }
    }

    function nextCharge(exclude) {
      const options = live.filter((t) => t !== exclude && t.x > 0.05 && t.x < 1.0);
      if (options.length) {
        setCharge(options[Math.floor(Math.random() * options.length)].spec.value);
      } else {
        const spec = TARGETS[Math.floor(Math.random() * TARGETS.length)];
        setCharge(spec.value);
      }
    }

    /** A line drawn from the barrel to whatever was tagged. */
    function beam(t) {
      const field = cannon.parentElement;
      const box = field.getBoundingClientRect();
      const to = t.node.getBoundingClientRect();
      const from = cannon.getBoundingClientRect();
      const x0 = from.left + from.width / 2 - box.left;
      const y0 = from.top - box.top + 6;
      const x1 = to.left + to.width / 2 - box.left;
      const y1 = to.top + to.height / 2 - box.top;
      const len = Math.hypot(x1 - x0, y1 - y0);
      const angle = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
      const line = h('div', { class: 'laser-beam' + (t.spec.value === charge ? '' : ' is-bad') });
      line.style.left = `${x0}px`;
      line.style.top = `${y0}px`;
      line.style.width = `${len}px`;
      line.style.transform = `rotate(${angle}deg)`;
      field.append(line);
      setTimeout(() => line.remove(), 260);
      cannon.classList.remove('is-firing');
      void cannon.offsetWidth;
      cannon.classList.add('is-firing');
    }

    /* ---------------------------------------------------------------- loop */

    let ended = false;
    const slow = calmMotion() ? 0.45 : 1;

    function frame(now) {
      const dt = Math.min(0.05, (now - lastFrame) / 1000);
      lastFrame = now;
      elapsed += dt;

      for (const t of live.slice()) {
        t.x -= t.speed * slow * dt;
        if (t.x < -0.34) remove(t);
        else place(t);
      }

      while (live.length < MAX_LIVE && Math.random() < 0.06) spawn();
      if (charge === null && live.length) nextCharge(null);
      // the answer must always be in the air: if it drifted off, send another
      if (charge !== null && !live.some((t) => t.spec.value === charge)) spawn(charge);
      mark();
      renumber();

      raf = requestAnimationFrame(frame);
    }

    measure();
    window.addEventListener('resize', measure);
    // the first few start spread across the arena, so it never opens empty
    [0.18, 0.44, 0.7, 0.96].forEach((x) => spawn(undefined, x));
    setCharge(live[0].spec.value);
    raf = requestAnimationFrame(frame);

    const onKey = (e) => {
      const n = Number(e.key);
      if (!n) return;
      const t = live.find((x) => x.key === e.key);
      if (t) fire(t);
    };
    window.addEventListener('keydown', onKey);

    function stop() {
      if (ended) return;
      ended = true;
      clearInterval(timer);
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', measure);
      const accuracy = Math.round((hits / Math.max(1, hits + misses)) * 100);
      if (hits) confetti(18);
      stage.replaceChildren(
        finishCard(activity, points, go, {
          title: `${hits} target${hits === 1 ? '' : 's'} tagged`,
          mark: 'target',
          lines: [
            { value: hits, label: 'tagged' },
            { value: `${accuracy}%`, label: 'accuracy' },
            { value: `${bestStreak}x`, label: 'best run' },
          ],
        }),
      );
    }

    el.addEventListener('view-destroy', () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', measure);
    });
  }

  return el;
}
