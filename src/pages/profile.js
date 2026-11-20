// profile.js — a creator's public page: name, blook, badge and their quizzes.

import { nameBadges } from '../ui/badges.js';
import { h, plural } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { blook } from '../ui/blooks.js';
import { empty } from '../ui/kit.js';
import { net } from '../net/index.js';
import { me } from '../services/session.js';
import { quizzesBy, badgeOf } from '../services/quizzes.js';
import { quizCard, pageTitle } from './parts.js';
import NotFound from './notfound.js';

export default async function Profile({ params }) {
  const name = String(params.username || '').toLowerCase();
  const claim = /^[a-z0-9_]{3,20}$/.test(name) ? await net.store.get('usernames', name).catch(() => null) : null;
  const user = claim ? await net.store.get('users', claim.uid).catch(() => null) : null;
  if (!user) return NotFound();
  pageTitle(user.displayName);
  const [quizzes, badge] = await Promise.all([quizzesBy(claim.uid).catch(() => []), badgeOf(claim.uid)]);
  const verified = Boolean(badge);
  const mine = me() && me().uid === claim.uid;
  const plays = quizzes.reduce((n, q) => n + (q.plays || 0), 0);
  const big = blook(user.blook);

  return h('div', { class: 'page stack', style: { gap: '22px' } },
    h('section', { class: 'card profile-head' },
      big,
      h('div', { class: 'grow' },
        h('h1', { class: 'row', style: { gap: '10px' } }, user.displayName, verified ? h('span', { style: { transform: 'scale(1.4)', display: 'inline-flex' } }, nameBadges(badge)) : null),
        h('p', { class: 'muted', style: { margin: '2px 0 10px' } }, `@${user.username}`),
        h('div', { class: 'row' },
          h('span', { class: 'pill' }, icon('list', { size: 14 }), plural(quizzes.length, 'published quiz', 'published quizzes')),
          h('span', { class: 'pill' }, icon('play', { size: 14 }), plural(plays, 'play')),
          verified ? h('span', { class: `pill badge-pill is-${badge}` }, { official: 'Official Quickzy', owner: 'Quickzy owner', verified: 'Trusted quiz maker' }[badge]) : null)),
      mine ? h('a', { class: 'btn', href: '/settings' }, icon('gear', { size: 18 }), 'Edit profile') : null),
    h('div', { class: 'section-head' }, h('h2', {}, 'Quizzes')),
    quizzes.length
      ? h('div', { class: 'grid' }, ...quizzes.map((q) => quizCard(q)))
      : h('div', { class: 'card flat' }, empty('No published quizzes yet', mine ? 'Publish a quiz and it shows up here.' : null,
        mine ? h('a', { class: 'btn btn-main', href: '/create' }, 'Make a quiz') : null)));
}
