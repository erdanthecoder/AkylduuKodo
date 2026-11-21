// home.js — the front door: join a game, or make one.

import { h, fill } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { blook } from '../ui/blooks.js';
import { scanForPin } from '../ui/qr.js';
import { navigate } from '../router.js';
import { MODES, modeArt } from '../game/modes/index.js';
import { signedIn } from '../services/session.js';
import { popularQuizzes, quizzesBy } from '../services/quizzes.js';
import { OFFICIAL_UID } from '../config.js';
import { quizCard, cover, authorLine } from './parts.js';
import { ornamentBand } from '../ui/ornament.js';

export function joinBox() {
  const pin = h('input', {
    class: 'input input-xl', inputmode: 'numeric', autocomplete: 'off', maxlength: 6,
    placeholder: 'Game PIN', 'aria-label': 'Game PIN',
  });
  const go = h('button', { class: 'btn btn-main btn-lg btn-block' }, 'Enter');
  const submit = () => {
    const v = pin.value.replace(/\D/g, '');
    if (v.length !== 6) { pin.classList.add('is-bad'); pin.focus(); return; }
    navigate(`/join/${v}`);
  };
  pin.addEventListener('input', () => {
    pin.value = pin.value.replace(/\D/g, '').slice(0, 6);
    pin.classList.remove('is-bad');
  });
  pin.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  go.addEventListener('click', submit);
  return h('div', { class: 'join-box' },
    h('h2', {}, 'Join a game'),
    pin,
    go,
    h('button', { class: 'btn btn-block', onclick: async () => { const p = await scanForPin(); if (p) navigate(`/join/${p}`); } },
      icon('camera'), 'Scan a QR code'),
  );
}

export default async function Home() {
  const popular = h('div', { class: 'grid' });
  popularQuizzes(8).then((list) => {
    if (!list.length) {
      popular.replaceWith(h('div', { class: 'card flat empty' },
        h('h3', {}, 'No public quizzes yet'),
        h('p', {}, 'Be the first: make one and publish it.'),
        h('a', { class: 'btn btn-main', href: signedIn() ? '/create' : '/signup' }, 'Make a quiz')));
      return;
    }
    popular.append(...list.map(quizCard));
  }).catch(() => popular.replaceWith(h('p', { class: 'muted' }, 'Quizzes could not be loaded right now.')));

  // one official quiz a day, the same for everyone that day
  const daily = h('div');
  const inviteSlot = h('div');
  const installSlot = h('div');
  import('../ui/install.js').then((m) => {
    const draw = () => fill(installSlot, m.canInstall() ? h('div', { class: 'install-card' },
      icon('download', { size: 22 }), h('div', { class: 'grow' }, h('b', {}, 'Get the Quickzy app'), h('small', {}, 'One tap from your home screen. Free.')),
      h('button', { class: 'btn btn-main btn-sm', onclick: () => m.install() }, 'Install')) : null);
    draw(); m.onInstallChange(draw);
  }).catch(() => {});
  import('../services/invite.js').then((m) => fill(inviteSlot, m.inviteCard())).catch(() => {});
  quizzesBy(OFFICIAL_UID).then((list) => {
    if (!list.length) return;
    const day = Math.floor(Date.now() / 86400000);
    const q = [...list].sort((a, b) => a.id.localeCompare(b.id))[day % list.length];
    const c = cover(q);
    c.classList.add('daily-cover');
    fill(daily, h('section', { class: 'daily card' },
      c,
      h('div', { class: 'stack grow', style: { gap: '8px' } },
        h('span', { class: 'pill pill-zing', style: { justifySelf: 'start' } }, icon('star', { size: 14 }), 'Quiz of the day'),
        h('h2', {}, q.title),
        h('p', { class: 'muted', style: { margin: 0 } }, q.description),
        authorLine(q, { size: 24 }),
        h('div', { class: 'row' },
          h('a', { class: 'btn btn-main', href: `/practice/${q.id}` }, icon('play', { size: 18 }), 'Play now'),
          h('a', { class: 'btn', href: `/host/${q.id}` }, icon('users', { size: 18 }), 'Host it')))));
  }).catch(() => {});

  const floaters = [['dog', 47, 10], ['robot', 3, 84], ['frog', 41, 80], ['cupcake', 93, 86], ['alien', 51, 46], ['penguin', 25, 88]]
    .map(([id, left, top], i) => {
      const b = blook(id);
      Object.assign(b.style, { left: `${left}%`, top: `${top}%`, animationDelay: `${i * 0.6}s` });
      return b;
    });

  // the hero's last words change: game, race, treasure hunt...
  const WORDS = ['a game.', 'a race.', 'a treasure hunt.', 'a sky climb.', 'a battle.'];
  let wi = 0;
  const cyc = setInterval(() => {
    const el = document.querySelector('.hero-cycle');
    if (!el) { clearInterval(cyc); return; }
    wi = (wi + 1) % WORDS.length;
    el.classList.add('is-out');
    setTimeout(() => { el.textContent = `Play it like ${WORDS[wi]}`; el.classList.remove('is-out'); }, 280);
  }, 2600);
  // sections slide in as they scroll into view
  setTimeout(() => {
    const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { threshold: 0.12 }) : null;
    document.querySelectorAll('.reveal').forEach((el) => (io ? io.observe(el) : el.classList.add('is-in')));
  }, 0);

  return h('div', { class: 'page' },
    h('section', { class: 'hero pattern' },
      h('div', { class: 'hero-blooks' }, ...floaters),
      h('div', { style: { position: 'relative' } },
        h('span', { class: 'pill pill-dark' }, icon('bolt', { size: 14 }), 'Live quiz games'),
        h('h1', { style: { marginTop: '14px' } }, 'Make a quiz.', h('br'), h('em', { class: 'hero-cycle' }, 'Play it like a game.')),
        h('p', {}, 'Host it live on the big screen. Everyone joins with a PIN or a QR code and plays on their own device.'),
        h('div', { class: 'row' },
          h('a', { class: 'btn btn-main btn-lg', href: signedIn() ? '/create' : '/signup' }, icon('plus'), 'Create a quiz'),
          h('a', { class: 'btn btn-dark btn-lg', href: '/discover' }, icon('compass'), 'Discover'),
        ),
      ),
      h('div', { class: 'hero-join', style: { position: 'relative' } }, joinBox()),
    ),

    daily,

    h('section', { class: 'how reveal' },
      h('h2', {}, 'How Quickzy works'),
      h('div', { class: 'how-steps' },
        ...[['1', 'Make or pick a quiz', 'Write your own in minutes, or pick a ready one from Discover.', '#6b4cff'],
          ['2', 'Everyone joins', 'Players type the PIN or scan the QR code. No accounts, no downloads.', '#2f9bff'],
          ['3', 'Play it like a game', 'Race planes, climb towers, hunt treasure: right answers power you up.', '#ff4772']]
          .map(([n, t, d, c]) => h('div', { class: 'how-step', style: { '--c': c } }, h('b', { class: 'how-n' }, n), h('h3', {}, t), h('p', {}, d))))),

    h('section', { class: 'trust reveal' },
      ornamentBand({ count: 11, height: 30 }),
      h('h2', {}, 'Made for classrooms. Safe for kids.'),
      h('div', { class: 'trust-grid' },
        ...[['shield', 'No ads, ever', 'Nothing to click away to, nothing sold to children.'],
          ['users', 'No chat with strangers', 'Players only see names and scores. Hosts can remove anyone.'],
          ['lock', 'Join without an account', 'Kids play with just a PIN and a nickname.'],
          ['star', 'Made in Kyrgyzstan', 'Built with care, for schools everywhere.']]
          .map(([ic, t, d]) => h('div', { class: 'trust-item' }, h('span', { class: 'trust-ic' }, icon(ic, { size: 22 })), h('b', {}, t), h('small', {}, d)))),
      h('a', { class: 'btn', href: '/teachers' }, 'For teachers', icon('arrowRight', { size: 16 }))),

    h('div', { class: 'section-head' }, h('h2', {}, `${MODES.length} ways to play`)),
    h('div', { class: 'features reveal' },
      ...MODES.map((m) => h('div', { class: 'mode-card', style: { background: m.bg } },
        modeArt(m.id),
        h('h3', {}, m.name),
        h('p', {}, m.tagline)))),

    installSlot,
    inviteSlot,

    h('div', { class: 'section-head' },
      h('h2', {}, 'Popular quizzes'),
      h('a', { href: '/discover', class: 'btn btn-sm' }, 'See all', icon('arrowRight', { size: 16 }))),
    popular,

    h('footer', { class: 'site-foot' },
      ornamentBand({ count: 9, height: 22 }),
      h('div', { class: 'site-foot-row' },
        h('b', {}, 'Quickzy'),
        h('nav', {}, h('a', { href: '/discover' }, 'Discover'), h('a', { href: '/teachers' }, 'For teachers'), h('a', { href: '/pro' }, 'Pro'),
          h('a', { href: '/terms' }, 'Terms'), h('a', { href: '/privacy' }, 'Privacy'))),
      h('small', {}, `© ${new Date().getFullYear()} Quickzy · Made with care in Kyrgyzstan`)),
  );
}
