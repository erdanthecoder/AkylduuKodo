// welcome.js — the front door.
//
// The entrance is a photograph of Issyk-Kul at sunset: the place the whole
// route ends. It is built in depth rather than pasted flat — the water and sky
// sit on one plane, the beach on a nearer one, and both drift against the
// pointer while the frame slowly pushes in. Then the page explains itself,
// shows what can be changed, and asks two questions.

import { h, confetti } from '../ui.js';
import { icon, mascot } from '../icons.js';
import { routeMap, STOPS } from '../map.js';
import { createGlobe, webglAvailable } from '../globe.js';
import { calmMotion } from '../prefs.js';
import { PAGES, CHAPTERS } from '../data/book/index.js';
import * as store from '../state.js';

const HERO = 'assets/hero.jpg';
const HERO_SMALL = 'assets/hero-small.jpg';

// A 24px-wide version of the photograph, inline, so the frame is never empty
// and never flashes: it is painted blurred on the first frame and the real
// photograph fades over it once decoded.
const HERO_LQIP = 'data:image/jpeg;base64,/9j/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAASABgDASIAAhEBAxEB/8QAGQABAAMBAQAAAAAAAAAAAAAAAAEDBQQG/8QAIBAAAgICAQUBAAAAAAAAAAAAAAECAxESBAUUIVFhcf/EABcBAAMBAAAAAAAAAAAAAAAAAAABAwL/xAAWEQEBAQAAAAAAAAAAAAAAAAAAEgH/2gAMAwEAAhEDEQA/ALq+K2XdvheWjL6jzbVNKmxJfDinzb5QS3efZS9ThtzojnGyyDzkrL9tla8/oC9EITJAMKIAAyf/2Q==';

export function WelcomeView(go, rerender) {
  const calm = calmMotion();
  const scene = h('div', { class: 'scene scene-photo' });
  const layers = [];

  // --- the photograph, in two planes ------------------------------------
  // Each plane is a frame that the parallax moves, holding an image that does
  // the slow push-in. Two elements, so the two transforms never fight.
  const farImg = h('div', { class: 'photo-img' });
  const nearImg = h('div', { class: 'photo-img' });
  const far = h('div', { class: 'photo-plane photo-far' }, farImg);
  const near = h('div', { class: 'photo-plane photo-near' }, nearImg);
  farImg.style.backgroundImage = `url("${HERO_LQIP}")`;
  nearImg.style.backgroundImage = `url("${HERO_LQIP}")`;

  const src = window.innerWidth <= 900 ? HERO_SMALL : HERO;
  const full = new Image();
  full.decoding = 'async';
  full.src = src;
  const paintFull = () => {
    farImg.style.backgroundImage = `url("${src}")`;
    nearImg.style.backgroundImage = `url("${src}")`;
    scene.classList.add('is-loaded');
  };
  if (full.complete) paintFull();
  else full.addEventListener('load', paintFull, { once: true });

  const glow = h('div', { class: 'photo-glow' });
  const grade = h('div', { class: 'photo-grade' });
  scene.append(far, glow, near, grade);
  layers.push({ el: far, depth: 0.08 }, { el: near, depth: 0.3 });

  // --- birds over the water ---------------------------------------------
  if (!calm) {
    const birds = h('div', { class: 'photo-birds', 'aria-hidden': 'true' });
    for (let i = 0; i < 3; i++) {
      const b = h('span', { class: 'bird' });
      b.innerHTML =
        '<svg viewBox="0 0 40 16" aria-hidden="true"><path d="M1 12c6 0 9-3 11-8 0 0 3 6 7 6 4 0 5-5 5-5 2 5 5 7 11 7" ' +
        'fill="none" stroke="#141a26" stroke-width="1.6" stroke-linecap="round"/></svg>';
      b.style.top = 16 + i * 7 + '%';
      b.style.animationDuration = 46 + i * 15 + 's';
      b.style.animationDelay = -i * 17 + 's';
      b.style.opacity = String(0.5 - i * 0.1);
      b.style.scale = String(0.9 - i * 0.2);
      birds.append(b);
    }
    scene.append(birds);
    layers.push({ el: birds, depth: 0.14 });
  }

  const title = h('div', { class: 'scene-title' },
    h('span', { class: 'scene-kicker' }, 'London to Bishkek, one lesson at a time'),
    h('h1', {},
      h('span', { class: 'word' }, 'Akyldu'),
      h('span', { class: 'word accent' }, 'u'),
      h('span', { class: 'word' }, 'Kodo'),
    ),
    h('p', {}, 'Learn to build real things on the web. You write the code, you watch it run, and every unit you finish carries you one city further east — until you land here.'),
    h('div', { class: 'scene-cta' },
      h('button', { class: 'btn btn-primary btn-lift', onclick: () => document.getElementById('start-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' }) },
        'Start the journey', icon('arrowRight', { size: 18 })),
      h('button', { class: 'btn btn-ghost btn-clear', onclick: () => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }) },
        'How it works'),
    ),
  );
  scene.append(
    title,
    h('div', { class: 'photo-credit' }, icon('mountain', { size: 14 }), 'Issyk-Kul, Kyrgyzstan'),
    h('div', { class: 'scene-fade' }),
  );
  layers.push({ el: title, depth: 0.16 });

  // ---------------------------------------------------------------- parallax
  let ticking = false;
  const move = (nx, ny, scroll) => {
    layers.forEach(({ el, depth }) => {
      const x = nx * depth * 30;
      const y = ny * depth * 18 + scroll * depth * 0.3;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
    glow.style.transform = `translate3d(${nx * -12}px, ${ny * -7 + scroll * 0.1}px, 0)`;
  };
  const onPointer = (e) => {
    if (calm || ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      move(nx, ny, window.scrollY);
      ticking = false;
    });
  };
  const onScroll = () => {
    if (calm) return;
    move(0, 0, window.scrollY);
  };
  window.addEventListener('pointermove', onPointer);
  window.addEventListener('scroll', onScroll, { passive: true });

  // ------------------------------------------------------------- explanation
  const steps = [
    ['pencil', 'You type, the page appears', 'Write one tag and a real web page shows up beside your code. Nothing to install, nothing to set up.'],
    ['code', 'Then you make it think', 'Buttons that react, loops that repeat, programs that decide. Real JavaScript, in tiny steps.'],
    ['bug', 'You break things on purpose', 'Hunt bugs, guess what code prints, program a rover through a maze. Practice that does not feel like practice.'],
    ['map', 'And you travel', 'Every unit is a city. Finish one and you move east — London, Paris, Rome, Istanbul, Tbilisi, Samarkand, Almaty, and home to Bishkek.'],
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

  // -------------------------------------------------------------- the route
  // The planet lives here now: a real globe you can spin, with the route drawn
  // on it. Without WebGL the flat map carries the same information.
  const routeFrame = h('div', { class: 'route-frame' });
  let globe = null;
  if (webglAvailable()) {
    routeFrame.classList.add('route-frame-3d');
    const stage = h('div', { class: 'route-globe' });
    routeFrame.append(stage, h('span', { class: 'globe-hint' }, 'drag to spin'));
    createGlobe(stage, { stops: STOPS, interactive: true, distance: 3.3, cameraY: 0 })
      .then((g) => {
        globe = g;
        g.lookAt(40, 44, 2600);
        if (calm) g.setSpin(0);
      })
      .catch(() => routeFrame.append(routeMap({ compact: true })));
  } else {
    routeFrame.append(routeMap({ compact: true }));
  }

  const routePreview = h('section', { class: 'route-section' },
    h('div', { class: 'section-lede' },
      h('span', { class: 'eyebrow' }, 'The route'),
      h('h2', {}, `${STOPS.length} cities, west to east`),
      h('p', { class: 'muted' }, 'You start where the web was invented and finish at home. The marker moves when you do.'),
    ),
    routeFrame,
  );

  // ---------------------------------------------------------- the handbook
  const bookSection = h('section', { class: 'book-section' },
    h('div', { class: 'book-plate' },
      h('div', { class: 'book-plate-text' },
        h('span', { class: 'eyebrow' }, 'Included from day one'),
        h('h2', {}, 'A whole C++ handbook, inside the site'),
        h('p', {},
          `Beside the lessons there is a complete reference book: ${PAGES.length} pages across ${CHAPTERS.length} chapters, ` +
          'from your first program to templates, memory and the standard library. One idea to a page, ' +
          'a real sample on every one, and a pad at the bottom for your own notes.'),
        h('div', { class: 'book-plate-cta' },
          h('button', { class: 'btn btn-primary', onclick: () => go('#/book') },
            'Open the handbook', icon('arrowRight', { size: 17 })),
        ),
      ),
      h('ul', { class: 'book-plate-list' },
        ...CHAPTERS.slice(0, 8).map((c, i) =>
          h('li', { style: `--i:${i}` },
            h('span', { class: 'plate-num' }, String(i + 1).padStart(2, '0')),
            h('span', {}, c.title),
          ),
        ),
        h('li', { class: 'plate-more' }, `and ${CHAPTERS.length - 8} more chapters`),
      ),
    ),
  );

  // ------------------------------------------------------- what you control
  const controls = [
    ['calendar', 'Your pace', 'Three lessons a week, or ten. Change it whenever life changes.'],
    ['eye', 'Your view', 'Night or daylight, bigger text, bigger code, and a calm mode with the movement turned off.'],
    ['puzzle', 'Blocks or typing', 'Drag blocks while it is new, switch to writing the code the moment you are ready.'],
    ['globe', 'Your language', 'The app speaks English and Kyrgyz.'],
    ['cloud', 'Your progress', 'Sign in and it follows you to any device. Or keep it on this one and export it as a file.'],
    ['sound', 'Your sound', 'Little clicks and chimes, on or off.'],
  ];

  const settingsPreview = h('section', { class: 'control-section' },
    h('div', { class: 'section-lede' },
      h('span', { class: 'eyebrow' }, 'Yours to adjust'),
      h('h2', {}, 'Everything here bends to you'),
      h('p', { class: 'muted' }, 'All of it lives in Settings, and none of it is locked away.'),
    ),
    h('div', { class: 'control-grid' },
      ...controls.map(([ic, head, body], i) =>
        h('article', { class: 'control-card', style: `--i:${i}` },
          h('span', { class: 'control-mark' }, icon(ic, { size: 18 })),
          h('div', {}, h('h3', {}, head), h('p', {}, body)),
        ),
      ),
    ),
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
        if (!calm) confetti(26);
        go('#/journey');
        rerender();
      },
    }, 'Fly to London', icon('arrowRight', { size: 18 })),
    h('p', { class: 'muted small center' }, 'No account needed to start. You can sign in later to keep your progress, and change every setting after that.'),
  );

  const view = h('div', { class: 'view welcome' }, scene, how, routePreview, bookSection, settingsPreview, startCard);
  view.addEventListener('view-destroy', () => {
    globe?.destroy();
    window.removeEventListener('pointermove', onPointer);
    window.removeEventListener('scroll', onScroll);
  });
  return view;
}
