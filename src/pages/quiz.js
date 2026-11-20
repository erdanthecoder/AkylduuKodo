// quiz.js — a quiz's own page: what it is, who made it, host or copy it.

import { h, plural, ago } from '../ui/dom.js';
import { icon, shape } from '../ui/icons.js';
import { busy, toast, copy } from '../ui/kit.js';
import { navigate } from '../router.js';
import { explain } from '../net/index.js';
import { me, signedIn } from '../services/session.js';
import { getQuiz, duplicateQuiz } from '../services/quizzes.js';
import { TYPE_BY_ID } from '../game/questions.js';
import { cover, authorLine, pageTitle } from './parts.js';
import NotFound from './notfound.js';

export default async function Quiz({ params }) {
  const quiz = await getQuiz(params.id).catch(() => null);
  if (!quiz) return NotFound();
  pageTitle(quiz.title);
  const mine = me() && me().uid === quiz.owner;
  const questions = quiz.questions || [];

  const dup = h('button', { class: 'btn' }, icon('copy', { size: 18 }), 'Make a copy');
  dup.addEventListener('click', busy(dup, async () => {
    if (!signedIn()) { navigate(`/login?next=/quiz/${quiz.id}`); return; }
    try { const id = await duplicateQuiz(quiz.id); toast('Copied to your quizzes', 'ok'); navigate(`/edit/${id}`); } catch (err) { toast(explain(err), 'bad'); }
  }));

  return h('div', { class: 'page mid stack', style: { gap: '18px' } },
    h('div', { class: 'card', style: { padding: 0, overflow: 'hidden' } },
      cover(quiz, { big: true }),
      h('div', { class: 'stack', style: { padding: '20px 22px 22px' } },
        h('h1', {}, quiz.title),
        quiz.description ? h('p', { style: { margin: 0 } }, quiz.description) : null,
        h('div', { class: 'row', style: { gap: '14px' } },
          authorLine(quiz, { size: 28 }),
          h('span', { class: 'quiz-meta' }, plural(questions.length, 'question')),
          h('span', { class: 'quiz-meta' }, plural(quiz.plays || 0, 'play')),
          quiz.updatedAt ? h('span', { class: 'quiz-meta' }, `Updated ${ago(quiz.updatedAt)}`) : null,
          quiz.public ? null : h('span', { class: 'pill' }, icon('lock', { size: 12 }), 'Draft, only you can see it')),
        h('div', { class: 'row', style: { marginTop: '6px' } },
          h('a', { class: 'btn btn-main btn-lg', href: `/practice/${quiz.id}` }, icon('play'), 'Play solo'),
          h('a', { class: 'btn btn-violet btn-lg', href: signedIn() ? `/host/${quiz.id}` : `/login?next=/host/${quiz.id}` }, icon('users'), 'Host live'),
          mine ? h('a', { class: 'btn btn-lg', href: `/edit/${quiz.id}` }, icon('edit'), 'Edit') : dup,
          h('button', { class: 'btn btn-ghost', onclick: () => copy(location.href, 'Link copied') }, icon('copy', { size: 18 }), 'Copy link')))),
    h('h2', {}, 'Questions'),
    h('div', { class: 'stack', style: { gap: '10px' } }, ...questions.map((q, i) => h('div', { class: 'card flat', style: { padding: '14px 16px' } },
      h('div', { class: 'row', style: { flexWrap: 'nowrap', alignItems: 'flex-start' } },
        h('span', { class: 'q-thumb', style: { width: 'auto', border: 0, padding: 0, background: 'none' } }, h('span', { class: 'n' }, String(i + 1))),
        h('div', { class: 'grow' },
          h('b', {}, q.text),
          h('div', { class: 'small muted', style: { marginTop: '2px' } }, `${TYPE_BY_ID.get(q.type)?.label || ''} · ${q.time} s`),
          q.options && q.type !== 'order' ? h('div', { class: 'row', style: { marginTop: '8px', gap: '6px' } },
            ...q.options.map((o, k) => h('span', { class: `pill c${k % 6}`, style: { boxShadow: 'none', color: k % 6 === 2 ? 'var(--night)' : '#fff' } }, shape(k, 14), o))) : null))))),
    h('p', { class: 'small muted center' }, 'Answers are hidden here, so nobody can look them up before a game.'));
}
