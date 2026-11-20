// owner.js — the owner's control room. Only the owner's account sees it,
// and the security rules refuse these actions from anyone else.

import { h, fill, ago, debounce } from '../ui/dom.js';
import { icon, verifiedBadge } from '../ui/icons.js';
import { blook, BLOOKS, blookName, rarityOf } from '../ui/blooks.js';
import { busy, toast, confirm, modal, segmented } from '../ui/kit.js';
import { net, explain } from '../net/index.js';
import { popularQuizzes, deleteQuiz } from '../services/quizzes.js';
import { levelOf } from '../services/progress.js';
import * as siteSvc from '../services/site.js';
import { BADGES } from '../config.js';
import { pageTitle } from './parts.js';
import NotFound from './notfound.js';

const fmt = (n) => Number(n || 0).toLocaleString();

function act(button, work, done) {
  button.addEventListener('click', busy(button, async () => {
    try { await work(); if (done) toast(done, 'ok'); } catch (err) { toast(err.message && !err.code ? err.message : explain(err), 'bad'); }
  }));
  return button;
}

/* ----------------------------------------------------------------- stats */

function stats() {
  const box = h('div', { class: 'owner-stats' });
  const tile = (label, value, ic) => h('div', { class: 'owner-stat' }, icon(ic, { size: 22 }), h('b', {}, value), h('small', {}, label));
  fill(box, tile('Accounts', '…', 'users'), tile('Published quizzes', '…', 'list'), tile('Live games', '…', 'play'));
  Promise.all([
    net.store.count('users').catch(() => '?'),
    net.store.count('quizzes', { where: [['public', '==', true]] }).catch(() => '?'),
    siteSvc.liveGames().then((g) => g.length).catch(() => '?'),
  ]).then(([u, q, g]) => fill(box, tile('Accounts', fmt(u), 'users'), tile('Published quizzes', fmt(q), 'list'), tile('Live games', fmt(g), 'play')));
  return box;
}

/* ---------------------------------------------------------- announcement */

async function announcement() {
  const s = await siteSvc.site(true);
  const text = h('textarea', { class: 'textarea', maxlength: 200, placeholder: 'A message everyone sees at the top of every page. Leave empty for none.' });
  text.value = s.announce;
  const save = act(h('button', { class: 'btn btn-main' }, 'Show to everyone'), () => siteSvc.setAnnouncement(text.value), 'Announcement saved');
  const clear = act(h('button', { class: 'btn' }, 'Remove'), async () => { text.value = ''; await siteSvc.setAnnouncement(''); }, 'Announcement removed');
  return h('section', { class: 'card stack' }, h('h2', {}, 'Announcement'), text, h('div', { class: 'row end' }, clear, save));
}

/* --------------------------------------------------------------- quizzes */

async function quizzes() {
  const box = h('div', { class: 'stack', style: { gap: '8px' } });
  let featured = (await siteSvc.site(true)).featured;
  const draw = async () => {
    const list = await popularQuizzes(150).catch(() => []);
    if (!list.length) { fill(box, h('p', { class: 'muted' }, 'No published quizzes.')); return; }
    fill(box, ...list.map((q) => {
      const on = featured.includes(q.id);
      const feat = act(h('button', { class: `btn btn-sm${on ? ' btn-main' : ''}` }, icon('star', { size: 14 }), on ? 'Featured' : 'Feature'), async () => {
        featured = on ? featured.filter((x) => x !== q.id) : [...featured, q.id];
        await siteSvc.setFeatured(featured);
        draw();
      });
      const unpub = act(h('button', { class: 'btn btn-sm' }, icon('lock', { size: 14 }), 'Unpublish'), async () => {
        if (!(await confirm({ title: `Unpublish "${q.title}"?`, text: 'It disappears from Discover. Its author can still see and edit it.', yes: 'Unpublish' }))) return;
        await siteSvc.unpublish(q.id);
        toast('Unpublished', 'ok');
        draw();
      });
      const del = act(h('button', { class: 'btn btn-sm btn-bad' }, icon('trash', { size: 14 })), async () => {
        if (!(await confirm({ title: `Delete "${q.title}"?`, text: 'Gone for good, for everyone, including its author.', yes: 'Delete', danger: true }))) return;
        await deleteQuiz(q.id);
        toast('Deleted', 'ok');
        draw();
      });
      return h('div', { class: 'owner-row' },
        h('a', { href: `/quiz/${q.id}`, class: 'grow owner-row-main' }, h('b', {}, q.title), h('small', { class: 'muted' }, `by ${q.authorName} · ${fmt(q.plays)} plays · ${q.questionCount} questions`)),
        feat, unpub, del);
    }));
  };
  draw();
  return h('section', { class: 'card stack' }, h('h2', {}, 'Quizzes'),
    h('p', { class: 'muted small', style: { margin: 0 } }, 'Featured quizzes appear in a "Picked by the owner" row on Discover.'), box);
}

/* ----------------------------------------------------------------- users */

async function users() {
  const box = h('div', { class: 'stack', style: { gap: '8px' } });
  const find = h('input', { class: 'input', type: 'search', placeholder: 'Search by name or username' });
  let all = [];
  const row = (u) => {
    const special = BADGES[u.id];
    const badgeSlot = h('span', { style: { display: 'inline-flex' } });
    const verifyBtn = h('button', { class: 'btn btn-sm' });
    const banBtn = h('button', { class: 'btn btn-sm' });
    const refresh = async () => {
      const [given, banned] = await Promise.all([siteSvc.hasGrantedBadge(u.id), siteSvc.isBanned(u.id)]);
      fill(badgeSlot, special ? verifiedBadge(null, special) : given ? verifiedBadge() : null);
      fill(verifyBtn, icon('check', { size: 14 }), given ? 'Remove blue check' : 'Give blue check');
      verifyBtn.hidden = Boolean(special);
      fill(banBtn, icon(banned ? 'check' : 'stop', { size: 14 }), banned ? 'Allow publishing' : 'Stop publishing');
      banBtn.className = `btn btn-sm${banned ? ' btn-ok' : ''}`;
      banBtn.hidden = Boolean(special);
      // relabel only after the spinner has given the button back
      verifyBtn.onclick = async () => {
        await busy(verifyBtn, async () => { try { await siteSvc.setGrantedBadge(u.id, !given); } catch (e) { toast(explain(e), 'bad'); } })();
        refresh();
      };
      banBtn.onclick = async () => {
        if (!banned && !(await confirm({ title: `Stop ${u.displayName} publishing?`, text: 'They can still play and host, but cannot save or publish quizzes until you allow it again.', yes: 'Stop publishing', danger: true }))) return;
        await busy(banBtn, async () => { try { await siteSvc.setBanned(u.id, !banned); } catch (e) { toast(explain(e), 'bad'); } })();
        refresh();
      };
    };
    refresh();
    const coins = act(h('button', { class: 'btn btn-sm' }, '+100 coins'), async () => { await siteSvc.giveCoins(u, 100); u.coins = (u.coins || 0) + 100; }, `Gave ${u.displayName} 100 coins`);
    const gift = h('button', { class: 'btn btn-sm' }, icon('star', { size: 14 }), 'Give a blook');
    gift.addEventListener('click', async () => {
      const pick = await modal((close) => [h('h2', {}, `Give ${u.displayName} a blook`),
        h('div', { class: 'blook-grid' }, ...BLOOKS.map((b) => h('button', { class: 'blook-pick', style: { '--rc': rarityOf(b.id).colour }, onclick: () => close(b.id) }, blook(b.id), h('small', {}, b.name))))], { wide: true });
      if (!pick) return;
      try { await siteSvc.giveBlook(u, pick); u.owned = { ...(u.owned || {}), [pick]: 1 }; toast(`Gave ${u.displayName} ${blookName(pick)}`, 'ok'); } catch (e) { toast(explain(e), 'bad'); }
    });
    return h('div', { class: 'owner-row' },
      blook(u.blook || 'dog', 40),
      h('a', { href: `/u/${u.username}`, class: 'grow owner-row-main' },
        h('b', { class: 'row', style: { gap: '6px' } }, u.displayName, badgeSlot),
        h('small', { class: 'muted' }, `@${u.username} · level ${levelOf(u.xp || 0)} · ${fmt(u.coins)} coins${u.createdAt ? ` · joined ${ago(u.createdAt)}` : ''}`)),
      coins, gift, verifyBtn, banBtn);
  };
  const draw = () => {
    const q = find.value.trim().toLowerCase();
    const list = all.filter((u) => !q || `${u.displayName} ${u.username}`.toLowerCase().includes(q));
    fill(box, list.length ? list.slice(0, 100).map(row) : h('p', { class: 'muted' }, 'No accounts found.'));
  };
  find.addEventListener('input', debounce(draw, 200));
  siteSvc.allUsers().then((u) => { all = u; draw(); }).catch((e) => fill(box, h('p', { class: 'error-text' }, explain(e))));
  return h('section', { class: 'card stack' }, h('h2', {}, 'Players'), find, box);
}

/* ----------------------------------------------------------------- games */

function games() {
  const box = h('div', { class: 'stack', style: { gap: '8px' } });
  const draw = async () => {
    const list = await siteSvc.liveGames().catch(() => []);
    fill(box, list.length ? list.map((g) => h('div', { class: 'owner-row' },
      h('div', { class: 'grow owner-row-main' }, h('b', {}, `Game ${g.pin}`), h('small', { class: 'muted' }, `started ${ago(g.at)}`)),
      act(h('button', { class: 'btn btn-sm btn-bad' }, icon('stop', { size: 14 }), 'End game'), async () => {
        if (!(await confirm({ title: `End game ${g.pin}?`, text: 'Everyone in it is sent home.', yes: 'End it', danger: true }))) return;
        await siteSvc.endGame(g.pin); toast('Game ended', 'ok'); draw();
      }))) : h('p', { class: 'muted' }, 'No games running right now.'));
  };
  draw();
  return h('section', { class: 'card stack' },
    h('div', { class: 'row spread' }, h('h2', {}, 'Live games'), h('button', { class: 'btn btn-sm', onclick: draw }, 'Refresh')), box);
}

/* ------------------------------------------------------------------ page */

export default async function Owner() {
  if (!siteSvc.isOwner()) return NotFound();
  pageTitle('Owner');
  let tab = 'quizzes';
  const body = h('div', { class: 'stack', style: { gap: '18px' } });
  const sections = { quizzes, users, games: async () => games(), announcement };
  const draw = async () => { fill(body, h('div', { class: 'loading' }, h('div', { class: 'spinner' }))); fill(body, await sections[tab]()); };
  draw();
  return h('div', { class: 'page stack', style: { gap: '18px' } },
    h('div', { class: 'row', style: { gap: '10px' } }, h('h1', {}, 'Owner'), h('span', { style: { transform: 'scale(1.5)', display: 'inline-flex' } }, verifiedBadge(null, 'owner'))),
    h('p', { class: 'muted', style: { margin: 0 } }, 'Only your account can open this page, and the database refuses these actions from anyone else.'),
    stats(),
    segmented([['quizzes', 'Quizzes'], ['users', 'Players'], ['games', 'Live games'], ['announcement', 'Announcement']], tab, (v) => { tab = v; draw(); }),
    body);
}
