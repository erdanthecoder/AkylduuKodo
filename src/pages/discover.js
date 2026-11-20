// discover.js — find quizzes: Quickzy's own, by subject, by search.

import { h, fill, debounce } from '../ui/dom.js';
import { icon, verifiedBadge } from '../ui/icons.js';
import { empty, segmented } from '../ui/kit.js';
import { popularQuizzes, newestQuizzes, searchQuizzes, quizzesBy, words, getQuiz } from '../services/quizzes.js';
import { site } from '../services/site.js';
import { OFFICIAL_UID } from '../config.js';
import { quizCard, pageTitle } from './parts.js';

/** Subjects, matched against the words of a quiz's title and description. */
export const SUBJECTS = [
  { id: 'all', name: 'All', words: [] },
  { id: 'science', name: 'Science', words: ['science', 'planets', 'space', 'sun', 'moon', 'gas', 'water', 'gravity', 'energy', 'body', 'organ', 'bones', 'blood', 'magnet', 'matter', 'chemistry', 'physics', 'biology'] },
  { id: 'maths', name: 'Maths', words: ['maths', 'math', 'times', 'fraction', 'fractions', 'prime', 'numbers', 'number', 'percent', 'sum', 'divide', 'multiply', 'geometry', 'calculators'] },
  { id: 'geography', name: 'Geography', words: ['capital', 'capitals', 'country', 'countries', 'continent', 'continents', 'ocean', 'oceans', 'desert', 'deserts', 'mountain', 'mountains', 'lakes', 'river', 'lake', 'geography', 'city', 'cities'] },
  { id: 'animals', name: 'Animals', words: ['animal', 'animals', 'mammal', 'mammals', 'birds', 'bird', 'fish', 'insects', 'whale', 'cat', 'dog'] },
  { id: 'language', name: 'Language', words: ['english', 'words', 'word', 'grammar', 'spelling', 'noun', 'verb', 'adjective', 'adjectives', 'plural', 'vocabulary', 'language', 'spanish', 'french', 'russian', 'kyrgyz'] },
  { id: 'history', name: 'History', words: ['history', 'inventions', 'invented', 'ancient', 'war', 'king', 'queen', 'empire', 'pyramids', 'year', 'independence', 'epic'] },
  { id: 'sports', name: 'Sports', words: ['sport', 'sports', 'football', 'soccer', 'olympic', 'olympics', 'chess', 'tennis', 'basketball', 'game', 'games'] },
];

// questions are left out on purpose: one question about the Moon does not
// make a history quiz a science quiz
export const inSubject = (quiz, subject) => !subject.words.length
  || words(`${quiz.title} ${quiz.description || ''}`).some((k) => subject.words.includes(k));

function row(title, badge, list) {
  return h('section', { class: 'stack', style: { gap: '10px' } },
    h('div', { class: 'section-head', style: { margin: 0 } }, h('h2', { class: 'row', style: { gap: '8px' } }, title, badge)),
    h('div', { class: 'shelf' }, ...list.map((q) => quizCard(q))));
}

export default async function Discover({ query }) {
  pageTitle('Discover');
  let sort = 'popular';
  let subject = SUBJECTS.find((s) => s.id === query.subject) || SUBJECTS[0];
  const featured = h('div', { class: 'stack', style: { gap: '18px' } });
  const results = h('div');
  const search = h('input', { class: 'input input-xl', type: 'search', placeholder: 'Search quizzes: planets, fractions, capitals…', value: query.q || '', 'aria-label': 'Search quizzes',
    style: { paddingLeft: '52px', textAlign: 'left' } });

  // the owner's picks first, then Quickzy's own quizzes
  Promise.all([
    site().then((s) => Promise.all(s.featured.map((id) => getQuiz(id).catch(() => null)))).catch(() => []),
    quizzesBy(OFFICIAL_UID).catch(() => []),
  ]).then(([picked, official]) => {
    picked = picked.filter((q) => q && q.public);
    fill(featured,
      picked.length ? row('Picked by the owner', verifiedBadge(null, 'owner'), picked) : null,
      official.length ? row('Made by Quickzy', verifiedBadge(null, 'official'), official) : null);
  });

  const chips = h('div', { class: 'chips', role: 'tablist', 'aria-label': 'Subjects' });
  const drawChips = () => fill(chips, ...SUBJECTS.map((s) => h('button', {
    type: 'button', role: 'tab', 'aria-selected': String(s === subject), class: `chip${s === subject ? ' is-on' : ''}`,
    onclick: () => { subject = s; drawChips(); run(); },
  }, s.name)));
  drawChips();

  let seq = 0;
  const run = async () => {
    const mine = ++seq;
    const q = search.value.trim();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (subject.id !== 'all') params.set('subject', subject.id);
    history.replaceState(null, '', `/discover${params.toString() ? `?${params}` : ''}`);
    featured.hidden = Boolean(q) || subject.id !== 'all';
    fill(results, h('div', { class: 'loading' }, h('div', { class: 'spinner' })));
    try {
      let list = q ? await searchQuizzes(q) : sort === 'new' ? await newestQuizzes(80) : await popularQuizzes(80);
      list = list.filter((x) => inSubject(x, subject));
      if (mine !== seq) return;
      fill(results, list.length
        ? h('div', { class: 'grid' }, ...list.map((x) => quizCard(x)))
        : h('div', { class: 'card flat' }, empty(q ? `Nothing found for "${q}"` : `No ${subject.id === 'all' ? '' : `${subject.name.toLowerCase()} `}quizzes yet`, q ? 'Try a shorter or different word.' : 'Make one and publish it to be the first.',
          h('a', { class: 'btn btn-main', href: '/create' }, 'Make a quiz'))));
    } catch {
      if (mine === seq) fill(results, h('p', { class: 'muted' }, 'Quizzes could not be loaded right now.'));
    }
  };
  search.addEventListener('input', debounce(run, 300));
  run();
  return h('div', { class: 'page stack', style: { gap: '18px' } },
    h('h1', {}, 'Discover'),
    h('div', { style: { position: 'relative' } }, search,
      h('span', { style: { position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'flex' } }, icon('search', { size: 22 }))),
    chips,
    featured,
    h('div', { class: 'row spread' }, h('h2', {}, 'All quizzes'),
      segmented([['popular', 'Most played'], ['new', 'Newest']], sort, (v) => { sort = v; if (!search.value.trim()) run(); })),
    results);
}
