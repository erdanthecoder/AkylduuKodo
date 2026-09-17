// welcome.js — the front door. A layered mountain scene with real depth: six
// ridges on different parallax planes, drifting cloud, falling snow, and a sun
// that sits behind the peaks. Then it explains itself, then it asks two
// questions and lets you in.

import { h, confetti } from '../ui.js';
import { icon, mascot } from '../icons.js';
import { routeMap, STOPS } from '../map.js';
import * as store from '../state.js';

const reduced = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** Ridge silhouettes, back to front. Depth comes from how far each one moves. */
const RIDGES = [
  { d: 'M0 300 L120 190 L210 250 L300 150 L420 240 L520 170 L640 260 L760 160 L880 240 L1000 190 L1100 250 L1200 200 L1200 400 L0 400 Z', depth: 0.1, fill: '#2b3a6b' },
  { d: 'M0 330 L100 250 L190 300 L300 210 L400 290 L520 230 L620 300 L740 220 L860 300 L980 250 L1100 310 L1200 260 L1200 400 L0 400 Z', depth: 0.2, fill: '#243059' },
  { d: 'M0 350 L140 270 L240 330 L360 250 L470 330 L600 260 L720 340 L840 270 L960 340 L1090 280 L1200 330 L1200 400 L0 400 Z', depth: 0.34, fill: '#1c2647' },
  { d: 'M0 370 L120 310 L260 360 L380 300 L500 365 L640 305 L780 370 L900 315 L1040 370 L1160 320 L1200 350 L1200 400 L0 400 Z', depth: 0.5, fill: '#151d38' },
  { d: 'M0 392 L160 350 L320 385 L460 345 L620 390 L780 350 L940 390 L1100 355 L1200 380 L1200 400 L0 400 Z', depth: 0.72, fill: '#0f1529' },
];

/** Snow caps sit on the two front-most ridges only. */
const CAPS = [
  { d: 'M300 150 L330 186 L312 180 L300 190 L288 180 L270 186 Z', depth: 0.1 },
  { d: 'M520 170 L548 206 L532 200 L520 210 L508 200 L492 206 Z', depth: 0.1 },
  { d: 'M760 160 L790 196 L772 190 L760 200 L748 190 L730 196 Z', depth: 0.1 },
];

export function WelcomeView(go, rerender) {
  const scene = h('div', { class: 'scene' });
  const layers = [];

  const sky = h('div', { class: 'scene-sky' });
  const sun = h('div', { class: 'scene-sun' });
  scene.append(sky, sun);

  // clouds drift on their own plane, between the far ridges
  const clouds = h('div', { class: 'scene-clouds' });
  for (let i = 0; i < 5; i++) {
    const c = h('span', { class: 'cloud' });
    c.style.top = 12 + i * 9 + '%';
    c.style.left = -30 + i * 26 + '%';
    c.style.animationDuration = 70 + i * 22 + 's';
    c.style.animationDelay = -i * 19 + 's';
    c.style.transform = `scale(${0.6 + i * 0.22})`;
    clouds.append(c);
  }
  scene.append(clouds);
  layers.push({ el: clouds, depth: 0.06 });

  RIDGES.forEach((ridge, i) => {
    const layer = h('div', { class: 'ridge' });
    layer.innerHTML =
      `<svg viewBox="0 0 1200 400" preserveAspectRatio="none" aria-hidden="true">` +
      `<path d="${ridge.d}" fill="${ridge.fill}"/>` +
      (i === 0 ? CAPS.map((c) => `<path d="${c.d}" fill="#dfe8ff" opacity="0.92"/>`).join('') : '') +
      `</svg>`;
    scene.append(layer);
    layers.push({ el: layer, depth: ridge.depth });
  });

  const snow = h('canvas', { class: 'scene-snow', 'aria-hidden': 'true' });
  scene.append(snow);

  const title = h('div', { class: 'scene-title' },
    h('span', { class: 'scene-kicker' }, 'London to Bishkek, one lesson at a time'),
    h('h1', {},
      h('span', { class: 'word' }, 'Akyldu'),
      h('span', { class: 'word accent' }, 'u'),
      h('span', { class: 'word' }, 'Kodo'),
    ),
    h('p', {}, 'Learn to build real things on the web. You write the code, you see it run, and you travel a little further east with every unit you finish.'),
    h('div', { class: 'scene-cta' },
      h('button', { class: 'btn btn-primary btn-lift', onclick: () => document.getElementById('start-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' }) },
        'Start the journey', icon('arrowRight', { size: 18 })),
      h('button', { class: 'btn btn-ghost btn-clear', onclick: () => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }) },
        'How it works'),
    ),
  );
  scene.append(title, h('div', { class: 'scene-fade' }));
  layers.push({ el: title, depth: 0.16 });

  // ---------------------------------------------------------------- parallax
  let ticking = false;
  const move = (nx, ny, scroll) => {
    layers.forEach(({ el, depth }) => {
      const x = nx * depth * 42;
      const y = ny * depth * 26 + scroll * depth * 0.35;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
    sun.style.transform = `translate3d(${nx * -14}px, ${ny * -8 + scroll * 0.12}px, 0)`;
  };
  const onPointer = (e) => {
    if (reduced() || ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      move(nx, ny, window.scrollY);
      ticking = false;
    });
  };
  const onScroll = () => {
    if (reduced()) return;
    move(0, 0, window.scrollY);
  };
  window.addEventListener('pointermove', onPointer);
  window.addEventListener('scroll', onScroll, { passive: true });

  // -------------------------------------------------------------------- snow
  let snowRaf = 0;
  function startSnow() {
    if (reduced()) return;
    const ctx = snow.getContext('2d');
    const flakes = [];
    const resize = () => {
      snow.width = scene.clientWidth;
      snow.height = scene.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    for (let i = 0; i < 90; i++) {
      flakes.push({
        x: Math.random() * snow.width,
        y: Math.random() * snow.height,
        r: 0.7 + Math.random() * 2.1,
        vy: 0.25 + Math.random() * 0.75,
        drift: Math.random() * 2 * Math.PI,
      });
    }
    const tick = () => {
      ctx.clearRect(0, 0, snow.width, snow.height);
      for (const f of flakes) {
        f.y += f.vy;
        f.drift += 0.008;
        const x = f.x + Math.sin(f.drift) * 14;
        if (f.y > snow.height) {
          f.y = -8;
          f.x = Math.random() * snow.width;
        }
        ctx.globalAlpha = 0.18 + f.r / 7;
        ctx.fillStyle = '#eaf1ff';
        ctx.beginPath();
        ctx.arc(x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
      snowRaf = requestAnimationFrame(tick);
    };
    tick();
  }
  setTimeout(startSnow, 60);

  // ------------------------------------------------------------- explanation
  const steps = [
    ['pencil', 'You type, the page appears', 'Write one tag and a real web page shows up beside your code. Nothing to install, nothing to set up.'],
    ['code', 'Then you make it think', 'Buttons that react, loops that repeat, programs that decide. Real JavaScript, in tiny steps.'],
    ['bug', 'You break things on purpose', 'Hunt bugs, guess what code prints, program a rover through a maze. Practice that does not feel like practice.'],
    ['map', 'And you travel', 'Every unit is a city. Finish one and you fly east — London, Paris, Rome, Istanbul, Tbilisi, Samarkand, Almaty, and home to Bishkek.'],
  ];

  const how = h('section', { class: 'how-section', id: 'how-it-works' },
    h('div', { class: 'section-lede' },
      h('span', { class: 'eyebrow' }, 'How it works'),
      h('h2', {}, 'Four things happen, over and over'),
    ),
    h('div', { class: 'how-grid' },
      ...steps.map(([ic, head, body], i) =>
        h('article', { class: 'how-card', style: `--i:${i}` },
          h('span', { class: 'how-mark' }, icon(ic, { size: 22 })),
          h('h3', {}, head),
          h('p', {}, body),
        ),
      ),
    ),
  );

  const routePreview = h('section', { class: 'route-section' },
    h('div', { class: 'section-lede' },
      h('span', { class: 'eyebrow' }, 'The route'),
      h('h2', {}, `${STOPS.length} cities, west to east`),
      h('p', { class: 'muted' }, 'You start where the web was invented and finish at home. The plane moves when you do.'),
    ),
    h('div', { class: 'route-frame' }, routeMap({ compact: true })),
  );

  // ------------------------------------------------------------- the sign-up
  let name = '';
  let goal = 5;

  const startCard = h('section', { class: 'card start-card', id: 'start-card' },
    h('div', { class: 'start-mascot' }, mascot(120, 'happy')),
    h('h2', {}, 'Two quick questions'),
    h('label', { class: 'field' },
      h('span', { class: 'field-label' }, 'What should we call you?'),
      h('input', { class: 'text-input', id: 'welcome-name', placeholder: 'Aisuluu', oninput: (e) => (name = e.target.value) }),
    ),
    h('div', { class: 'field' },
      h('span', { class: 'field-label' }, 'How many lessons a week?'),
      h('div', { class: 'chips' },
        ...[3, 5, 7, 10].map((n) =>
          h('button', {
            class: `chip chip-btn ${n === goal ? 'chip-on' : ''}`,
            onclick: (e) => {
              goal = n;
              [...e.target.parentElement.children].forEach((c) => c.classList.remove('chip-on'));
              e.target.classList.add('chip-on');
            },
          }, `${n} a week`),
        ),
      ),
    ),
    h('button', {
      class: 'btn btn-primary btn-big',
      onclick: () => {
        store.set({ name: name.trim(), goalPerWeek: goal, onboarded: true, created: store.today() });
        confetti(26);
        go('#/journey');
        rerender();
      },
    }, 'Fly to London', icon('arrowRight', { size: 18 })),
    h('p', { class: 'muted small center' }, 'No account needed to start. You can sign in later to keep your progress.'),
  );

  const view = h('div', { class: 'view welcome' }, scene, how, routePreview, startCard);
  view.addEventListener('view-destroy', () => {
    window.removeEventListener('pointermove', onPointer);
    window.removeEventListener('scroll', onScroll);
    cancelAnimationFrame(snowRaf);
  });
  return view;
}
