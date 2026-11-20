// flight.js — the Quickzy 1.1 launch film: "Flight to Kyrgyzstan".
//
//   1. A little plane flies into a storm of falling rocks and dodges them.
//   2. The radio crackles: the only safe route is to the country with
//      Issyk-Kul. The viewer answers for the pilot (wrong answers: try again).
//   3. Right answer: the rocks freeze and fall away; the plane flies over the
//      Tian Shan mountains and the blue lake.
//   4. It lands at the airport, the pilot climbs out, the arrivals hall
//      cheers.
//   5. The Quickzy 1.1 card, with everything new in this update.

import { h } from './dom.js';
import { logo, icon } from './icons.js';
import { blook, REGULAR } from './blooks.js';
import { confetti, celebrate } from './confetti.js';
import { sfx, playMusic, stopMusic } from '../game/sound.js';
import { VERSION } from '../config.js';
import { NEWS } from './whatsnew.js';

const SEEN = 'quickzy.flight.seen';
export const flightSeen = () => { try { return localStorage.getItem(SEEN) === VERSION; } catch { return true; } };

function planeSVG() {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 220 110');
  s.innerHTML = '<path d="M40 70 L8 30 L30 30 L66 62 Z" fill="#e8112d"/>'
    + '<path d="M40 70 L14 92 L32 92 L70 74 Z" fill="#b5121b"/>'
    + '<path d="M30 58 C30 46 60 42 120 42 C170 42 200 50 210 62 C200 74 170 80 120 80 C60 80 30 72 30 58 Z" fill="#fff"/>'
    + '<path d="M60 76 C90 80 150 80 196 70 C190 78 168 84 120 84 C80 84 62 80 60 76 Z" fill="#c9cff5"/>'
    + '<path d="M122 62 L170 62 L140 104 L118 104 Z" fill="#6b4cff"/>'
    + '<path d="M126 60 L160 60 L148 30 L132 30 Z" fill="#a560ff" opacity=".9"/>'
    + '<rect x="70" y="52" width="12" height="9" rx="3" fill="#59f0ff"/><rect x="88" y="52" width="12" height="9" rx="3" fill="#59f0ff"/>'
    + '<rect x="150" y="52" width="12" height="9" rx="3" fill="#59f0ff"/>'
    + '<path d="M182 50 C192 52 202 56 208 62 L186 62 Z" fill="#17133f"/>'
    + '<text x="80" y="74" font-family="Lilita One, sans-serif" font-size="11" fill="#6b4cff" text-anchor="middle">QUICKZY AIR</text>';
  return s;
}

function mountains() {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 800 300');
  s.setAttribute('preserveAspectRatio', 'none');
  s.innerHTML = '<path d="M0 300 L0 180 L90 90 L150 150 L240 40 L330 140 L400 80 L480 160 L560 60 L650 150 L720 100 L800 170 L800 300 Z" fill="#5b6cb8"/>'
    + '<path d="M240 40 L270 75 L255 70 L240 85 L225 72 L212 76 Z M560 60 L590 95 L574 90 L560 104 L546 92 L532 96 Z M90 90 L112 112 L98 108 L86 118 L76 104 Z" fill="#fff"/>'
    + '<path d="M0 300 L0 230 L120 160 L220 220 L340 150 L460 230 L580 170 L700 230 L800 190 L800 300 Z" fill="#3e4c94"/>'
    + '<ellipse cx="420" cy="275" rx="260" ry="26" fill="#2fb8ff"/><ellipse cx="400" cy="270" rx="180" ry="10" fill="#9be7ff" opacity=".7"/>';
  return s;
}

/** Play the film. Resolves when it closes. */
export function playFlight({ pilot = 'fox' } = {}) {
  return new Promise((resolve) => {
    try { localStorage.setItem(SEEN, VERSION); } catch { /* private mode */ }
    const calm = document.documentElement.dataset.motion === 'calm';
    const sky = h('div', { class: 'fl-sky' });
    const world = h('div', { class: 'fl-world' });
    const caption = h('div', { class: 'fl-caption' });
    const plane = h('div', { class: 'fl-plane' }, planeSVG(), h('div', { class: 'fl-pilot' }, blook(pilot, 34)));
    const skip = h('button', { class: 'btn btn-sm fl-skip' }, 'Skip');
    const root = h('div', { class: 'fl-root', role: 'dialog', 'aria-label': `Quickzy ${VERSION}` }, sky, world, plane, caption, skip);
    document.body.append(root);
    const timers = [];
    const later = (ms, fn) => new Promise((res) => timers.push(setTimeout(() => { if (!done) fn && fn(); res(); }, calm ? Math.min(ms, 60) : ms)));
    let done = false;
    let rockTimer = 0;
    const close = () => {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout); clearInterval(rockTimer);
      stopMusic();
      root.classList.add('fl-out');
      setTimeout(() => { root.remove(); resolve(); }, 350);
    };
    skip.onclick = () => { if (!root.querySelector('.fl-card')) { timers.forEach(clearTimeout); clearInterval(rockTimer); showCard(); } else close(); };
    const say = (text, cls = '') => { caption.className = `fl-caption ${cls}`; caption.replaceChildren(text ? h('span', {}, text) : ''); };

    // 1 — the rock storm
    function spawnRock() {
      const size = 30 + Math.random() * 70;
      const rock = h('div', { class: 'fl-rock', style: { width: `${size}px`, height: `${size}px`, top: `${5 + Math.random() * 80}%`,
        animationDuration: `${1.6 + Math.random() * 1.6}s`, '--spin': `${Math.random() > 0.5 ? '' : '-'}${200 + Math.random() * 400}deg` } });
      world.append(rock);
      setTimeout(() => rock.remove(), 3500);
    }
    async function storm() {
      sky.className = 'fl-sky is-storm';
      plane.className = 'fl-plane is-dodge';
      playMusic('tense');
      say('Quickzy Air, flight 1.1 …');
      rockTimer = setInterval(spawnRock, calm ? 600 : 260);
      await later(1800, () => { say('ROCK STORM!', 'is-alert'); sfx('tagged'); root.classList.add('fl-shake'); });
      await later(700, () => root.classList.remove('fl-shake'));
      await later(1300, () => { sfx('bump'); root.classList.add('fl-shake'); });
      await later(500, () => root.classList.remove('fl-shake'));
      await later(900, () => question());
    }

    // 2 — the radio question; keep asking until it is right
    function question() {
      plane.className = 'fl-plane is-hover';
      say('');
      sfx('reveal');
      const options = ['Kazakhstan', 'Kyrgyzstan', 'Uzbekistan', 'Tajikistan'];
      const colours = ['#ff4772', '#2f9bff', '#ffb21f', '#12c9a6'];
      const note = h('p', { class: 'fl-note' }, 'Answer for the pilot!');
      const panel = h('div', { class: 'fl-radio' },
        h('div', { class: 'fl-radio-top' }, icon('volume', { size: 16 }), 'Radio · Control tower'),
        h('h2', {}, 'Pilot! The only safe route is to the country with Issyk-Kul. Which one?'),
        h('div', { class: 'fl-opts' }, ...options.map((o, i) => {
          const b = h('button', { class: 'fl-opt', style: { background: colours[i] } }, o);
          b.addEventListener('click', () => {
            if (o !== 'Kyrgyzstan') {
              sfx('wrong');
              b.classList.add('is-wrong'); b.disabled = true;
              note.textContent = 'Not that one! The rocks are getting closer. Try again!';
              panel.classList.remove('fl-wobble'); void panel.offsetWidth; panel.classList.add('fl-wobble');
              return;
            }
            sfx('right');
            b.classList.add('is-right');
            note.textContent = 'Correct! Issyk-Kul is in Kyrgyzstan.';
            setTimeout(() => { panel.remove(); calmSkies(); }, calm ? 50 : 1100);
          });
          return b;
        })),
        note);
      root.append(panel);
    }

    // 3 — the rocks stop; over the mountains to Kyrgyzstan
    async function calmSkies() {
      clearInterval(rockTimer);
      world.querySelectorAll('.fl-rock').forEach((r) => r.classList.add('is-frozen'));
      say('The rocks stopped!', 'is-good');
      sfx('checkpoint');
      if (!calm) confetti({ y: 0.4, count: 80 });
      playMusic('menu');
      await later(1200, () => {
        world.querySelectorAll('.fl-rock').forEach((r) => r.classList.add('is-drop'));
        sky.className = 'fl-sky is-clear';
        plane.className = 'fl-plane is-cruise';
        world.append(h('div', { class: 'fl-mountains' }, mountains()),
          h('div', { class: 'fl-flag' }, blook('kyrgyzstan', 60)));
        say('Next stop: Kyrgyzstan. Over the Tian Shan and Issyk-Kul…');
      });
      await later(4200, () => land());
    }

    // 4 — landing
    async function land() {
      world.replaceChildren(
        h('div', { class: 'fl-airport' },
          h('div', { class: 'fl-terminal' }, h('b', {}, 'ARRIVALS'), h('span', {}, 'Welcome to Kyrgyzstan')),
          h('div', { class: 'fl-runway' }, ...Array.from({ length: 12 }, () => h('i')))));
      sky.className = 'fl-sky is-sunset';
      plane.className = 'fl-plane is-land';
      say('Coming in to land…');
      await later(2600, () => {
        sfx('land'); sfx('bump');
        for (let i = 0; i < 6; i++) plane.append(h('i', { class: 'fl-puff', style: { '--d': `${i * 14}px`, animationDelay: `${i * 0.05}s` } }));
        say('Touchdown!', 'is-good');
      });
      await later(1400, () => arrive());
    }

    // 5 — the pilot climbs out; everyone cheers
    async function arrive() {
      const crowd = h('div', { class: 'fl-crowd' }, ...Array.from({ length: 11 }, (_, i) =>
        h('div', { class: 'fl-fan', style: { animationDelay: `${(i % 4) * 0.12}s` } }, blook(i === 5 ? 'kyrgyzstan' : REGULAR[(i * 7) % REGULAR.length], 46))));
      const hero = h('div', { class: 'fl-hero' }, blook(pilot, 70));
      world.querySelector('.fl-airport').append(crowd, hero);
      say('Welcome home, pilot!', 'is-good');
      sfx('win');
      playMusic('victory');
      if (!calm) { celebrate(); setTimeout(() => celebrate(['#e8112d', '#ffef00', '#ffffff']), 900); }
      await later(3400, () => showCard());
    }

    // 6 — the update
    function showCard() {
      clearInterval(rockTimer);
      say('');
      plane.remove();
      playMusic('victory');
      root.append(h('div', { class: 'fl-card' },
        h('div', { class: 'fl-card-head' }, logo(), h('div', {}, h('small', {}, 'Now landing'), h('h1', {}, `Quickzy ${VERSION}`))),
        h('ul', { class: 'wn-list' }, ...NEWS.map(([ic, col, title, text], i) => h('li', { style: { animationDelay: `${0.2 + i * 0.12}s` } },
          h('span', { class: 'wn-ic', style: { background: col } }, icon(ic, { size: 18 })), h('div', {}, h('b', {}, title), h('small', {}, text))))),
        h('button', { class: 'btn btn-main btn-lg btn-block', onclick: close }, "Let's play")));
      skip.textContent = 'Close';
    }

    storm();
  });
}
