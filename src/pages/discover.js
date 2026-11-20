// discover.js — find published quizzes.

import { h, fill, debounce } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { empty, segmented } from '../ui/kit.js';
import { popularQuizzes, newestQuizzes, searchQuizzes } from '../services/quizzes.js';
import { quizCard, pageTitle } from './parts.js';

export default async function Discover({ query }) {
  pageTitle('Discover');
  let sort = 'popular';
  const results = h('div');
  const search = h('input', { class: 'input input-xl', type: 'search', placeholder: 'Search quizzes: planets, fractions, Spanish…', value: query.q || '', 'aria-label': 'Search quizzes',
    style: { paddingLeft: '52px', textAlign: 'left' } });
  let seq = 0;
  const run = async () => {
    const mine = ++seq;
    const q = search.value.trim();
    history.replaceState(null, '', q ? `/discover?q=${encodeURIComponent(q)}` : '/discover');
    fill(results, h('div', { class: 'loading' }, h('div', { class: 'spinner' })));
    try {
      const list = q ? await searchQuizzes(q) : sort === 'new' ? await newestQuizzes(36) : await popularQuizzes(36);
      if (mine !== seq) return;
      fill(results, list.length
        ? h('div', { class: 'grid' }, ...list.map((x) => quizCard(x)))
        : h('div', { class: 'card flat' }, empty(q ? `Nothing found for "${q}"` : 'No published quizzes yet', q ? 'Try a shorter or different word.' : 'Make one and publish it to be the first.',
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
    segmented([['popular', 'Most played'], ['new', 'Newest']], sort, (v) => { sort = v; if (!search.value.trim()) run(); }),
    results);
}
