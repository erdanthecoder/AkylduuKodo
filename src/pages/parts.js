// parts.js — pieces several pages share: quiz cards, author lines, covers.

import { h, svg, plural } from '../ui/dom.js';
import { icon, verifiedBadge } from '../ui/icons.js';
import { blook } from '../ui/blooks.js';
import { navigate } from '../router.js';
import { isVerified } from '../services/quizzes.js';

export const COVER_BG = [
  'linear-gradient(135deg, #6b4cff, #a560ff)',
  'linear-gradient(135deg, #ff4772, #ff8a2a)',
  'linear-gradient(135deg, #2f9bff, #12c9a6)',
  'linear-gradient(135deg, #ffcd1f, #ff8a2a)',
  'linear-gradient(135deg, #12c9a6, #19c37d)',
  'linear-gradient(135deg, #17133f, #3a2ca0)',
];

/** Pattern of soft shapes laid over a cover, different per cover index. */
function coverPattern(i) {
  const s = svg('svg', { viewBox: '0 0 200 112', preserveAspectRatio: 'xMidYMid slice', 'aria-hidden': 'true',
    style: 'position:absolute;inset:0;width:100%;height:100%;opacity:.22' });
  const seeds = [[20, 20, 26], [170, 90, 34], [120, 10, 14], [60, 96, 18], [190, 24, 12]];
  seeds.forEach(([x, y, r], k) => {
    if ((k + i) % 2) s.append(svg('rect', { x: x - r, y: y - r, width: r * 2, height: r * 2, rx: r / 2.4, fill: '#fff', transform: `rotate(${(i * 17 + k * 23) % 45} ${x} ${y})` }));
    else s.append(svg('circle', { cx: x, cy: y, r, fill: '#fff' }));
  });
  return s;
}

export function cover(quiz, { big = false } = {}) {
  const i = Number(quiz.cover) || 0;
  return h('div', { class: 'quiz-cover', style: { background: COVER_BG[i % COVER_BG.length], height: big ? '180px' : null } },
    coverPattern(i),
    h('span', { class: 'cover-title' }, quiz.title || 'Untitled quiz'),
    h('span', { class: 'count' }, plural(quiz.questionCount || (quiz.questions || []).length || 0, 'question')));
}

/** "by Name ✓" — the badge appears once the author is confirmed verified. */
export function authorLine(quiz, { size = 22 } = {}) {
  const badge = h('span', { style: { display: 'inline-flex' } });
  isVerified(quiz.owner).then((ok) => { if (ok) badge.append(verifiedBadge()); });
  const b = blook(quiz.authorBlook || 'dog');
  b.style.width = `${size}px`; b.style.height = `${size}px`;
  return h('a', { class: 'quiz-meta author', href: quiz.authorUsername ? `/u/${quiz.authorUsername}` : null, onclick: (e) => e.stopPropagation() },
    b, h('span', {}, quiz.authorName || 'Someone'), badge);
}

export function quizCard(quiz, { href } = {}) {
  const to = href || `/quiz/${quiz.id}`;
  const card = h('article', { class: 'quiz-card', tabindex: 0, role: 'link', 'aria-label': quiz.title,
    onclick: () => navigate(to), onkeydown: (e) => { if (e.key === 'Enter') navigate(to); } },
  cover(quiz),
  h('div', { class: 'quiz-body' },
    h('div', { class: 'quiz-title' }, quiz.title || 'Untitled quiz'),
    h('div', { class: 'row spread', style: { gap: '6px' } },
      authorLine(quiz),
      h('span', { class: 'quiz-meta' }, icon('play', { size: 14 }), String(quiz.plays || 0)))));
  return card;
}

export function pageTitle(text) {
  document.title = text ? `${text} · Quickzy` : 'Quickzy — live quiz games';
}
