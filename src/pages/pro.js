// pro.js — Quickzy Pro: what it gives, what it costs, and the thank-you
// letter members receive.

import { h } from '../ui/dom.js';
import { icon, logo, verifiedBadge } from '../ui/icons.js';
import { blook } from '../ui/blooks.js';
import { modal } from '../ui/kit.js';
import { signedIn, myProfile, me } from '../services/session.js';
import { myPlan, membership, PRICE, PRO_PERKS, PRO_SOON, PLANS, trialOn, TRIAL_ENDS } from '../services/plan.js';
import { celebrate } from '../ui/confetti.js';
import { sfx } from '../game/sound.js';
import { pageTitle } from './parts.js';

/** The letter. Shown once when someone becomes Pro, and any time from here. */
export function proLetter() {
  const p = myProfile() || {};
  sfx('reveal');
  setTimeout(() => celebrate(['#ffcd1f', '#ffe45c', '#ffffff', '#6b4cff']), 300);
  return modal((close) => [h('div', { class: 'letter' },
    h('div', { class: 'letter-seal' }, logo()),
    h('p', { class: 'letter-to' }, `Dear ${p.displayName || 'friend'},`),
    h('p', {}, 'Thank you for becoming a Quickzy Pro member. You are one of the people who keep Quickzy growing: every quiz you make and every game you host makes it better for everyone who plays.'),
    h('p', {}, 'Your gold PRO badge now shines next to your name. Your quizzes go live the moment you publish them, your games hold up to 100 players, and every game mode is yours to host.'),
    h('p', {}, 'We are building more for you: video quizzes, making quizzes together, and a brand new Tower Defense game. You will be the first to play them.'),
    h('p', { class: 'letter-sign' }, 'With thanks,', h('br'), h('b', {}, 'Erdan and the Quickzy team')),
    h('button', { class: 'btn btn-main btn-block', onclick: () => close() }, 'Thank you!'))], { wide: false });
}

/** After someone turns Pro, show the letter once on this device. */
export async function maybeShowLetter() {
  if (!signedIn()) return;
  const key = `quickzy.proLetter.${me().uid}`;
  try { if (localStorage.getItem(key)) return; } catch { return; }
  const m = await membership(me().uid);
  if (!m || m.plan !== 'pro' || (m.until || 0) < Date.now()) return;
  try { localStorage.setItem(key, '1'); } catch { /* ignore */ }
  proLetter();
}

export default async function Pro() {
  pageTitle('Quickzy Pro');
  const plan = await myPlan();
  const m = plan.pro && signedIn() ? await membership(me().uid) : null;
  const perk = ([ic, title, text], soon = false) => h('li', { class: soon ? 'is-soon' : '' },
    h('span', { class: 'pro-ic' }, icon(ic, { size: 18 })),
    h('div', {}, h('b', {}, title, soon ? h('span', { class: 'pill', style: { marginLeft: '6px' } }, 'Coming soon') : null), h('small', {}, text)));
  const free = PLANS.free;
  return h('div', { class: 'page stack', style: { gap: '22px' } },
    h('section', { class: 'pro-hero' },
      h('div', { class: 'pro-hero-badge' }, verifiedBadge(null, 'pro'), 'PRO'),
      h('h1', {}, 'Quickzy Pro'),
      h('p', {}, 'For the people who make Quickzy great. Publish instantly, host every game for up to 100 players, and wear the gold badge.'),
      trialOn() ? h('div', { class: 'pro-trial' }, icon('star', { size: 18 }),
        `Free test: everyone gets Pro until ${new Date(TRIAL_ENDS).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}`) : null,
      plan.pro
        ? h('div', { class: 'row', style: { justifyContent: 'center' } },
          h('span', { class: 'pro-member' }, icon('check', { size: 18 }), m && m.until ? `You are a Pro member until ${new Date(m.until).toLocaleDateString()}` : trialOn() ? 'You have Pro in the free test' : 'You are a Pro member'),
          h('button', { class: 'btn', onclick: () => proLetter() }, icon('mail', { size: 16 }), 'Read your letter'))
        : h('div', { class: 'pro-price' },
          h('b', {}, PRICE), h('span', {}, 'a year'),
          h('button', { class: 'btn btn-main btn-lg', disabled: true, title: 'Payments are coming soon' }, 'Get Pro'),
          h('small', {}, 'Payments are coming very soon. Ask a parent or guardian before buying.'))),
    h('div', { class: 'pro-cols' },
      h('section', { class: 'card stack' }, h('h2', {}, 'What Pro members get'), h('ul', { class: 'pro-list' }, ...PRO_PERKS.map((p) => perk(p)), ...PRO_SOON.map((p) => perk(p, true)))),
      h('section', { class: 'card stack' }, h('h2', {}, 'Free accounts'),
        h('ul', { class: 'pro-list is-free' },
          perk(['list', `${free.quizzes} quizzes`, 'Plenty to start with.']),
          perk(['users', `${free.players} players a game`, 'Great for one class.']),
          perk(['play', 'Classic, Robot Run and Sky Climb', 'Laser Tag and Spacecraft are Pro.']),
          perk(['clock', 'Quizzes are checked', 'Published quizzes are checked automatically and go live in 3–5 days.'])),
        h('div', { class: 'row', style: { justifyContent: 'center', gap: '10px' } }, ...['fox', 'unicorn', 'dragon', 'kyrgyzstan'].map((id) => blook(id, 56))))));
}
