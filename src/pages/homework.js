// homework.js — Homework: set a quiz with a due date, share the link,
// students play it solo, and the teacher sees the results.

import { h, fill, plural } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { blook } from '../ui/blooks.js';
import { modal, toast, busy, empty, confirm } from '../ui/kit.js';
import { navigate } from '../router.js';
import { me, signedIn } from '../services/session.js';
import * as hw from '../services/homework.js';
import { getQuiz } from '../services/quizzes.js';
import { cover, pageTitle } from './parts.js';
import NotFound from './notfound.js';

const when = (ms) => new Date(ms).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const left = (ms) => {
  const d = ms - Date.now();
  if (d <= 0) return 'Closed';
  const days = Math.floor(d / 86400000);
  const hours = Math.floor((d % 86400000) / 3600000);
  return days ? `${days} day${days === 1 ? '' : 's'} ${hours} h left` : `${hours} h ${Math.floor((d % 3600000) / 60000)} min left`;
};

async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast('Link copied! Share it with your class.', 'ok'); } catch { toast(text); }
}

/** The "Assign as homework" dialog, from a quiz page. */
export function assignDialog(quiz) {
  if (!signedIn()) { navigate(`/login?next=/quiz/${quiz.id}`); return null; }
  return modal((close) => {
    let days = 3;
    const title = h('input', { class: 'input', maxlength: 80, value: quiz.title });
    const seg = h('div', { class: 'row', style: { gap: '6px' } });
    const draw = () => fill(seg, ...[[1, '1 day'], [3, '3 days'], [7, '1 week'], [14, '2 weeks']].map(([d, label]) =>
      h('button', { type: 'button', class: `chip${d === days ? ' is-on' : ''}`, onclick: () => { days = d; draw(); } }, label)));
    draw();
    const go = h('button', { class: 'btn btn-main' }, icon('check', { size: 16 }), 'Set homework');
    go.addEventListener('click', busy(go, async () => {
      try {
        const id = await hw.assign(quiz, { title: title.value, days });
        close();
        navigate(`/hw/${id}`);
        setTimeout(() => copy(hw.linkFor(id)), 400);
      } catch (e) { toast(e.message || 'Could not set homework', 'bad'); }
    }));
    return [h('h2', {}, 'Set as homework'),
      h('p', { class: 'muted', style: { margin: 0 } }, 'Students open the link, play the quiz on their own, and you see every score here. Their first try counts.'),
      h('label', { class: 'field' }, h('span', {}, 'Title'), title),
      h('div', { class: 'field' }, h('span', {}, 'Due in'), seg),
      h('div', { class: 'row end' }, h('button', { class: 'btn', onclick: () => close() }, 'Cancel'), go)];
  });
}

/** /hw/:id — the student's start page, and the teacher's results. */
export default async function HomeworkPage({ params }) {
  const item = await hw.getHomework(params.id).catch(() => null);
  if (!item) return NotFound();
  pageTitle(item.title);
  const quiz = await getQuiz(item.quizId).catch(() => null);
  const isOwner = signedIn() && me().uid === item.owner;
  const open = item.dueAt > Date.now();
  const mineResult = await hw.myResult(item.id);
  const head = h('section', { class: 'hw-head' },
    quiz ? cover(quiz, { big: true }) : null,
    h('div', { class: 'hw-info' },
      h('span', { class: 'pill' }, icon('book', { size: 14 }), 'Homework'),
      h('h1', {}, item.title),
      h('p', { class: 'muted', style: { margin: 0 } }, `Set by ${item.ownerName} · ${item.quizTitle}`),
      h('div', { class: `hw-due${open ? '' : ' is-closed'}` }, icon('clock', { size: 18 }), h('b', {}, left(item.dueAt)), h('small', {}, `Due ${when(item.dueAt)}`)),
      h('div', { class: 'row' },
        isOwner ? h('button', { class: 'btn btn-main', onclick: () => copy(hw.linkFor(item.id)) }, icon('copy', { size: 16 }), 'Copy link for students') : null,
        !isOwner && open && !mineResult
          ? h('a', { class: 'btn btn-main btn-lg', href: signedIn() ? `/practice/${item.quizId}?hw=${item.id}` : `/signup?next=/hw/${item.id}` }, icon('play', { size: 18 }), signedIn() ? 'Start homework' : 'Sign up to start')
          : null,
        mineResult ? h('span', { class: 'pill pill-ok' }, icon('check', { size: 14 }), `Handed in: ${mineResult.right}/${mineResult.total} right · ${mineResult.score} points`) : null,
        !open && !isOwner && !mineResult ? h('span', { class: 'pill' }, 'This homework is closed') : null)));

  if (!isOwner) return h('div', { class: 'page narrow stack' }, head);

  const list = (await hw.results(item.id)).sort((a, b) => b.score - a.score);
  const avg = list.length ? Math.round((list.reduce((n, r) => n + (r.total ? r.right / r.total : 0), 0) / list.length) * 100) : 0;
  const del = h('button', { class: 'btn btn-ghost' }, icon('trash', { size: 16 }), 'Delete homework');
  del.addEventListener('click', async () => {
    if (!(await confirm({ title: 'Delete this homework?', text: 'The link stops working. Results are deleted too.', yes: 'Delete', danger: true }))) return;
    await hw.remove(item.id).catch(() => {}); navigate('/homework');
  });
  return h('div', { class: 'page stack', style: { gap: '18px' } }, head,
    h('div', { class: 'hw-stats' },
      h('div', {}, h('b', {}, String(list.length)), h('small', {}, 'handed in')),
      h('div', {}, h('b', {}, `${avg}%`), h('small', {}, 'average right')),
      h('div', {}, h('b', {}, list[0] ? String(list[0].score) : '–'), h('small', {}, 'top score'))),
    list.length
      ? h('div', { class: 'card' }, h('table', { class: 'table' },
        h('thead', {}, h('tr', {}, h('th', {}, '#'), h('th', {}, 'Student'), h('th', {}, 'Right'), h('th', {}, 'Score'), h('th', {}, 'Handed in'))),
        h('tbody', {}, ...list.map((r, i) => h('tr', {}, h('td', {}, String(i + 1)), h('td', {}, h('b', {}, r.name)),
          h('td', {}, `${r.right}/${r.total}`), h('td', {}, String(r.score)), h('td', {}, r.at ? when(r.at) : ''))))))
      : h('div', { class: 'card flat' }, empty('Nobody has handed it in yet', 'Share the link with your class. Results appear here as they finish.')),
    h('div', { class: 'row end' }, del));
}

/** /homework — everything you have set. */
export async function MyHomework() {
  pageTitle('Homework');
  if (!signedIn()) { navigate('/login?next=/homework'); return h('div'); }
  const items = (await hw.mine()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return h('div', { class: 'page stack', style: { gap: '18px' } },
    h('section', { class: 'channels-hero hw-hero' }, h('h1', {}, 'Homework'),
      h('p', {}, 'Set any quiz as homework: open a quiz and press "Set as homework". Students play it on their own before the due date.')),
    items.length
      ? h('div', { class: 'stack', style: { gap: '10px' } }, ...items.map((it) => h('a', { class: 'card hw-row', href: `/hw/${it.id}` },
        h('span', { class: 'hw-ic' }, icon('book', { size: 22 })),
        h('div', { class: 'grow' }, h('b', {}, it.title), h('small', { class: 'muted' }, it.quizTitle)),
        h('span', { class: `pill${it.dueAt > Date.now() ? ' pill-ok' : ''}` }, left(it.dueAt)))))
      : h('div', { class: 'card flat' }, empty('No homework yet', 'Find a quiz on Discover and press "Set as homework".', h('a', { class: 'btn btn-main', href: '/discover' }, 'Find a quiz'))),
    h('div', { class: 'row', style: { justifyContent: 'center' } }, blook('owl', 64)));
}
