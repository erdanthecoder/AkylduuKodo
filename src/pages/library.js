// library.js — my quizzes and my game reports.

import { h, fill, ago, plural } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { busy, toast, confirm, empty, segmented } from '../ui/kit.js';
import { explain } from '../net/index.js';
import { myQuizzes, deleteQuiz, duplicateQuiz, myReports, deleteReport } from '../services/quizzes.js';
import { modeOf } from '../game/modes/index.js';
import { cover, pageTitle } from './parts.js';
import { downloadCSV } from '../game/report.js';

function quizRow(q, redraw) {
  const dup = h('button', { class: 'btn btn-sm', title: 'Duplicate' }, icon('copy', { size: 16 }));
  dup.addEventListener('click', busy(dup, async () => {
    try { await duplicateQuiz(q.id); toast('Copy made', 'ok'); redraw(); } catch (err) { toast(explain(err), 'bad'); }
  }));
  const del = h('button', { class: 'btn btn-sm btn-ghost', title: 'Delete' }, icon('trash', { size: 16 }));
  del.addEventListener('click', busy(del, async () => {
    if (!(await confirm({ title: `Delete "${q.title}"?`, text: 'It is gone for good, for everyone.', yes: 'Delete', danger: true }))) return;
    try { await deleteQuiz(q.id); toast('Deleted'); redraw(); } catch (err) { toast(explain(err), 'bad'); }
  }));
  const c = cover(q);
  c.style.height = '88px'; c.style.width = '140px'; c.style.borderRadius = '14px'; c.style.flex = 'none';
  return h('div', { class: 'card lib-row' },
    h('a', { href: `/edit/${q.id}`, style: { display: 'contents' } }, c),
    h('div', { class: 'grow', style: { minWidth: '180px' } },
      h('a', { href: `/edit/${q.id}`, class: 'quiz-title' }, q.title),
      h('div', { class: 'row small muted', style: { gap: '10px', marginTop: '4px' } },
        q.public ? h('span', { class: 'pill pill-ok' }, icon('globe', { size: 12 }), 'Published') : h('span', { class: 'pill' }, icon('lock', { size: 12 }), 'Draft'),
        h('span', {}, plural(q.questionCount || 0, 'question')),
        h('span', {}, plural(q.plays || 0, 'play')),
        q.updatedAt ? h('span', {}, `Edited ${ago(q.updatedAt)}`) : null)),
    h('div', { class: 'row' },
      h('a', { class: 'btn btn-main btn-sm', href: `/host/${q.id}` }, icon('play', { size: 16 }), 'Host'),
      h('a', { class: 'btn btn-sm', href: `/edit/${q.id}` }, icon('edit', { size: 16 }), 'Edit'),
      dup, del));
}

function reportRow(r, redraw) {
  const players = r.players || [];
  const del = h('button', { class: 'btn btn-sm btn-ghost', title: 'Delete report' }, icon('trash', { size: 16 }));
  del.addEventListener('click', busy(del, async () => {
    if (!(await confirm({ title: 'Delete this report?', yes: 'Delete', danger: true }))) return;
    await deleteReport(r.id).catch(() => {}); redraw();
  }));
  const winner = [...players].sort((a, b) => b.score - a.score)[0];
  return h('div', { class: 'card lib-row' },
    h('div', { class: 'grow', style: { minWidth: '200px' } },
      h('b', {}, r.quizTitle || 'Game'),
      h('div', { class: 'row small muted', style: { gap: '10px', marginTop: '4px' } },
        h('span', { class: 'pill' }, modeOf(r.mode).name),
        h('span', {}, plural(players.length, 'player')),
        winner ? h('span', {}, `Winner: ${winner.name}`) : null,
        r.at ? h('span', {}, ago(r.at)) : null)),
    h('div', { class: 'row' },
      h('button', { class: 'btn btn-sm', onclick: () => downloadCSV(r) }, icon('download', { size: 16 }), 'Download CSV'),
      del));
}

export default async function Library({ query }) {
  pageTitle('My quizzes');
  let tab = query.tab === 'reports' ? 'reports' : 'quizzes';
  const body = h('div', { class: 'stack' });
  const draw = async () => {
    fill(body, h('div', { class: 'loading' }, h('div', { class: 'spinner' })));
    try {
      if (tab === 'quizzes') {
        const list = await myQuizzes();
        fill(body, list.length ? list.map((q) => quizRow(q, draw)) : h('div', { class: 'card' }, empty('No quizzes yet', 'Make your first one. It takes a couple of minutes.',
          h('a', { class: 'btn btn-main', href: '/create' }, icon('plus'), 'Make a quiz'))));
      } else {
        const list = await myReports();
        fill(body, list.length ? list.map((r) => reportRow(r, draw)) : h('div', { class: 'card' }, empty('No reports yet', 'When a game you host ends, its results are saved here.')));
      }
    } catch (err) {
      fill(body, h('div', { class: 'card' }, empty('Could not load', explain(err), h('button', { class: 'btn', onclick: draw }, 'Try again'))));
    }
  };
  draw();
  return h('div', { class: 'page stack', style: { gap: '18px' } },
    h('div', { class: 'row spread' }, h('h1', {}, 'My quizzes'),
      h('div', { class: 'row' },
        h('a', { class: 'btn btn-violet', href: '/create?ai=1' }, icon('bolt'), 'Make with AI'),
        h('a', { class: 'btn btn-main', href: '/create' }, icon('plus'), 'New quiz'))),
    segmented([['quizzes', 'Quizzes'], ['reports', 'Game reports']], tab, (v) => {
      tab = v; history.replaceState(null, '', v === 'reports' ? '/library?tab=reports' : '/library'); draw();
    }),
    body);
}
