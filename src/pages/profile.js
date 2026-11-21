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
import { profileBanner } from '../ui/banner.js';
import { ACHIEVEMENTS, statsFor, earned } from '../services/achievements.js';
import { isPro } from '../services/plan.js';
import { levelOf } from '../services/progress.js';
import { OWNER_UID } from '../config.js';
import { logo } from '../ui/icons.js';

/** The ribbon emblem next to a name, like a partner badge. */
function emblem(kind) {
  if (kind === 'owner') return h('span', { class: 'emblem emblem-owner', title: 'Founder of Quickzy' }, h('span', { class: 'emblem-mark' }, logo()), h('b', {}, 'FOUNDER'), h('small', {}, 'Quickzy'));
  if (kind === 'official') return h('span', { class: 'emblem emblem-official', title: 'Official Quickzy account' }, h('span', { class: 'emblem-mark' }, logo()), h('b', {}, 'OFFICIAL'), h('small', {}, 'Quickzy'));
  if (kind === 'pro') return h('span', { class: 'emblem emblem-pro', title: 'Quickzy Pro member' }, h('b', {}, 'PRO'), h('small', {}, 'member'));
  return null;
}

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
  const owner = claim.uid === OWNER_UID;
  const [quizzes, badge, followers, pro] = await Promise.all([quizzesBy(claim.uid).catch(() => []), badgeOf(claim.uid), channels.followerCount(claim.uid), isPro(claim.uid).catch(() => false)]);
  const mine = me() && me().uid === claim.uid;
  const hasChannel = user.channel !== false;
  const plays = quizzes.reduce((n, q) => n + (q.plays || 0), 0);
  const stats = statsFor(user, { quizzes, followers, pro, owner });
  const ach = earned(stats);
  const countEl = h('b', { 'data-n': String(followers) }, fmt(followers));
  const kind = owner ? 'owner' : badge === 'official' ? 'official' : pro ? 'pro' : null;

  let sort = 'top';
  let tab = 'content';
  const body = h('div', { class: 'stack' });
  const drawBody = () => {
    tabs.querySelectorAll('button').forEach((b) => b.classList.toggle('is-on', b.dataset.t === tab));
    if (tab === 'content') {
      const list = [...quizzes].sort(sort === 'top' ? (a, b) => (b.plays || 0) - (a.plays || 0) : (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      fill(body,
        quizzes.length > 1 ? h('div', { class: 'row', style: { gap: '6px' } },
          ...[['top', 'Most played'], ['new', 'Newest']].map(([id, label]) => h('button', { class: `chip${sort === id ? ' is-on' : ''}`, onclick: () => { sort = id; drawBody(); } }, label))) : null,
        quizzes.length ? h('div', { class: 'grid' }, ...list.map((q) => quizCard(q)))
          : h('div', { class: 'card flat' }, empty('No published quizzes yet', mine ? 'Publish a quiz and it shows up on your profile.' : `When ${user.displayName} publishes a quiz, it shows up here.`,
            mine ? h('a', { class: 'btn btn-main', href: '/create' }, 'Make a quiz') : null)));
    } else if (tab === 'ach') {
      const got = ach.filter((a) => a.done).length;
      fill(body, h('p', { class: 'muted', style: { margin: 0 } }, `${got} of ${ach.length} achievements`),
        h('div', { class: 'ach-grid' }, ...ach.map((a, i) => h('div', { class: `ach${a.done ? ' is-done' : ''}`, style: { '--c': a.col, animationDelay: `${i * 0.04}s` } },
          h('span', { class: 'ach-medal' }, icon(a.done ? 'trophy' : 'lock', { size: 22 })), h('b', {}, a.title), h('small', {}, a.how)))));
    } else {
      fill(body, h('div', { class: 'card stack about-card' },
        user.bio ? h('p', { class: 'about-bio' }, user.bio) : h('p', { class: 'muted' }, mine ? 'Add a few words about yourself in Settings.' : 'No bio yet.'),
        h('div', { class: 'about-facts' },
          h('div', {}, icon('star', { size: 18 }), h('span', {}, `Level ${levelOf(user.xp || 0)}`)),
          h('div', {}, icon('users', { size: 18 }), h('span', {}, `${plural(followers, 'follower')}`)),
          user.createdAt ? h('div', {}, icon('clock', { size: 18 }), h('span', {}, `Joined ${new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`)) : null,
          h('div', {}, blook(user.blook, 22), h('span', {}, `${stats.blooks} blooks collected`)))));
    }
  };
  const tabs = h('div', { class: 'profile-tabs' },
    ...[['content', 'Content'], ['ach', 'Achievements'], ['about', 'About']].map(([t, label]) => h('button', { 'data-t': t, onclick: () => { tab = t; drawBody(); } }, label)));
  drawBody();

  const earnedBadges = ach.filter((a) => a.done && ['met-owner', 'pro', 'famous', 'level-25', 'friend'].includes(a.id));
  return h('div', { class: 'page stack', style: { gap: '18px' } },
    h('section', { class: `profile${owner ? ' is-owner' : ''}` },
      h('div', { class: 'profile-banner' }, profileBanner(user.banner, { owner })),
      h('div', { class: 'profile-main' },
        h('div', { class: 'profile-avatar' }, blook(user.blook, owner ? 132 : 120), owner ? h('span', { class: 'profile-crown' }, icon('star', { size: 20 })) : null),
        h('div', { class: 'profile-name' },
          h('div', { class: 'row', style: { gap: '10px', alignItems: 'center' } },
            h('h1', {}, user.displayName), badge ? nameBadges(badge) : null, emblem(kind)),
          h('p', { class: 'muted', style: { margin: '2px 0 0' } }, `@${user.username}`),
          earnedBadges.length ? h('div', { class: 'profile-earned' }, ...earnedBadges.map((a) => h('span', { class: 'earned-chip', style: { '--c': a.col } }, icon('trophy', { size: 12 }), a.title))) : null),
        h('div', { class: 'profile-stats' },
          h('div', {}, h('small', {}, 'Quizzes'), h('b', {}, fmt(quizzes.length))),
          h('div', {}, h('small', {}, 'Plays'), h('b', {}, fmt(plays))),
          h('div', {}, h('small', {}, 'Level'), h('b', {}, String(stats.level))),
          hasChannel ? h('div', {}, h('small', {}, 'Followers'), countEl) : null),
        h('div', { class: 'profile-action' }, mine
          ? h('a', { class: 'btn', href: '/settings' }, icon('gear', { size: 18 }), 'Edit profile')
          : hasChannel ? followButton(claim.uid, countEl) : null)),
      tabs),
    body);
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
