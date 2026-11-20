// profile.js — a creator's channel: banner, name, badges, followers, a
// Follow button, and every quiz they have published.

import { nameBadges } from '../ui/badges.js';
import { h, fill, plural } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { blook } from '../ui/blooks.js';
import { empty, toast } from '../ui/kit.js';
import { net, explain } from '../net/index.js';
import { me, signedIn } from '../services/session.js';
import { quizzesBy, badgeOf } from '../services/quizzes.js';
import * as channels from '../services/channels.js';
import { sfx } from '../game/sound.js';
import { confetti } from '../ui/confetti.js';
import { quizCard, pageTitle, COVER_BG } from './parts.js';
import { navigate } from '../router.js';
import NotFound from './notfound.js';

const fmt = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));

/** The Follow button; keeps the follower count next to it up to date. */
export function followButton(uid, countEl) {
  const btn = h('button', { class: 'btn btn-main follow-btn' }, icon('plus', { size: 18 }), 'Follow');
  let on = false;
  let count = Number(countEl?.dataset.n || 0);
  const draw = () => {
    fill(btn, ...(on ? [icon('check', { size: 18 }), 'Following'] : [icon('plus', { size: 18 }), 'Follow']));
    btn.classList.toggle('btn-main', !on);
    btn.classList.toggle('is-following', on);
    if (countEl) { countEl.dataset.n = String(count); countEl.textContent = fmt(count); }
  };
  channels.isFollowing(uid).then((v) => { on = v; draw(); });
  btn.addEventListener('click', async () => {
    if (!signedIn()) { navigate(`/login?next=${encodeURIComponent(location.pathname)}`); return; }
    if (btn.disabled) return;
    btn.disabled = true;
    try {
      if (on) { await channels.unfollow(uid); on = false; count = Math.max(0, count - 1); }
      else {
        await channels.follow(uid); on = true; count += 1;
        sfx('coin');
        const r = btn.getBoundingClientRect();
        confetti({ x: (r.left + r.width / 2) / innerWidth, y: r.top / innerHeight, count: 40, power: 500 });
      }
    } catch (err) { toast(err.code ? explain(err) : err.message, 'bad'); }
    btn.disabled = false;
    draw();
  });
  draw();
  return btn;
}

export default async function Profile({ params }) {
  const name = String(params.username || '').toLowerCase();
  const claim = /^[a-z0-9_]{3,20}$/.test(name) ? await net.store.get('usernames', name).catch(() => null) : null;
  const user = claim ? await net.store.get('users', claim.uid).catch(() => null) : null;
  if (!user) return NotFound();
  pageTitle(user.displayName);
  const [quizzes, badge, followers] = await Promise.all([quizzesBy(claim.uid).catch(() => []), badgeOf(claim.uid), channels.followerCount(claim.uid)]);
  const mine = me() && me().uid === claim.uid;
  const plays = quizzes.reduce((n, q) => n + (q.plays || 0), 0);
  const questions = quizzes.reduce((n, q) => n + (q.questionCount || 0), 0);
  // the banner takes the colour of their most played quiz
  const tint = COVER_BG[(Number(quizzes[0]?.cover) || 0) % COVER_BG.length];
  const avatar = blook(user.blook, 120);
  const countEl = h('b', { 'data-n': String(followers) }, fmt(followers));
  let sort = 'top';
  const grid = h('div', { class: 'grid' });
  const drawGrid = () => {
    const list = [...quizzes].sort(sort === 'top' ? (a, b) => (b.plays || 0) - (a.plays || 0) : (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    fill(grid, ...list.map((q) => quizCard(q)));
  };
  drawGrid();
  const tab = (id, label) => h('button', { class: `chip${sort === id ? ' is-on' : ''}`, onclick: (e) => {
    sort = id; e.currentTarget.parentElement.querySelectorAll('.chip').forEach((c) => c.classList.remove('is-on')); e.currentTarget.classList.add('is-on'); drawGrid();
  } }, label);

  return h('div', { class: 'page stack', style: { gap: '22px' } },
    h('section', { class: 'channel' },
      h('div', { class: 'channel-banner', style: { background: tint } },
        h('div', { class: 'channel-floaters', 'aria-hidden': 'true' }, ...[0, 1, 2, 3, 4].map((i) => h('i', { style: { '--i': i } })))),
      h('div', { class: 'channel-body' },
        h('div', { class: 'channel-avatar' }, avatar),
        h('div', { class: 'grow', style: { minWidth: '220px' } },
          h('h1', { class: 'row', style: { gap: '10px', margin: 0 } }, user.displayName, badge ? nameBadges(badge) : null),
          h('p', { class: 'muted', style: { margin: '2px 0 0' } }, `@${user.username} · Quickzy channel`)),
        mine
          ? h('a', { class: 'btn', href: '/settings' }, icon('gear', { size: 18 }), 'Edit channel')
          : followButton(claim.uid, countEl)),
      h('div', { class: 'channel-stats' },
        h('div', {}, countEl, h('small', {}, followers === 1 ? 'follower' : 'followers')),
        h('div', {}, h('b', {}, fmt(quizzes.length)), h('small', {}, quizzes.length === 1 ? 'quiz' : 'quizzes')),
        h('div', {}, h('b', {}, fmt(plays)), h('small', {}, 'plays')),
        h('div', {}, h('b', {}, fmt(questions)), h('small', {}, 'questions')))),
    h('div', { class: 'section-head row spread' }, h('h2', {}, 'Quizzes'),
      quizzes.length > 1 ? h('div', { class: 'row', style: { gap: '6px' } }, tab('top', 'Most played'), tab('new', 'Newest')) : null),
    quizzes.length
      ? grid
      : h('div', { class: 'card flat' }, empty('No published quizzes yet', mine ? 'Publish a quiz and it shows up on your channel.' : `When ${user.displayName} publishes a quiz, it shows up here.`,
        mine ? h('a', { class: 'btn btn-main', href: '/create' }, 'Make a quiz') : null)));
}

/* --------------------------------------------------------- all channels */

export async function ChannelsPage() {
  pageTitle('Channels');
  const [top, mineFollow, newest] = await Promise.all([channels.topChannels(), channels.following(), channels.feed(12)]);
  const card = (c) => h('a', { class: 'channel-card', href: `/u/${c.username}` },
    h('div', { class: 'channel-card-top', style: { background: COVER_BG[(Number(c.covers[0]?.cover) || 0) % COVER_BG.length] } }, blook(c.blook || 'dog', 72)),
    h('b', { class: 'row', style: { gap: '6px', justifyContent: 'center' } }, c.name || c.username, badgeSlot(c.uid)),
    h('small', { class: 'muted' }, `${plural(c.quizzes, 'quiz', 'quizzes')} · ${fmt(c.plays)} plays`),
    mineFollow.includes(c.uid) ? h('span', { class: 'pill pill-ok' }, icon('check', { size: 12 }), 'Following') : null);
  return h('div', { class: 'page stack', style: { gap: '22px' } },
    h('section', { class: 'channels-hero' },
      h('h1', {}, 'Channels'),
      h('p', {}, 'Every quiz maker has a channel. Follow the ones you like and their new quizzes show up for you.')),
    signedIn() && newest.length ? h('div', { class: 'stack' },
      h('div', { class: 'section-head' }, h('h2', {}, 'New from channels you follow')),
      h('div', { class: 'grid' }, ...newest.map((q) => quizCard(q)))) : null,
    h('div', { class: 'section-head' }, h('h2', {}, 'Top channels')),
    top.length ? h('div', { class: 'channel-grid' }, ...top.map(card)) : h('div', { class: 'card flat' }, empty('No channels yet', 'Publish a quiz to start yours.')));
}

function badgeSlot(uid) {
  const s = h('span', { style: { display: 'inline-flex' } });
  badgeOf(uid).then((k) => { if (k) s.append(nameBadges(k)); }).catch(() => {});
  return s;
}
