// discover.js — find quizzes: Quickzy's own, by subject, by search.

import { h, fill, debounce } from '../ui/dom.js';
import { icon, verifiedBadge } from '../ui/icons.js';
import { empty, segmented } from '../ui/kit.js';
import { popularQuizzes, newestQuizzes, searchQuizzes, quizzesBy, words, getQuiz } from '../services/quizzes.js';
import { site } from '../services/site.js';
import { OFFICIAL_UID } from '../config.js';
import { quizCard, pageTitle, coverPhoto, authorLine } from './parts.js';
import { navigate } from '../router.js';
import { plural } from '../ui/dom.js';

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
  { id: 'arts', name: 'Art & Music', words: ['art', 'music', 'colours', 'colors', 'painting', 'paintings', 'instruments', 'composers', 'stories', 'books'] },
  { id: 'tech', name: 'Tech', words: ['computers', 'computer', 'coding', 'internet', 'online', 'bits', 'bytes', 'code'] },
  { id: 'kyrgyzstan', name: 'Kyrgyzstan', words: ['kyrgyzstan', 'kyrgyz', 'tian', 'issyk', 'nomad', 'yurt'] },
];
const SHELF_ORDER = ['science', 'maths', 'geography', 'history', 'language', 'animals', 'kyrgyzstan', 'arts', 'tech', 'sports'];

// questions are left out on purpose: one question about the Moon does not
// make a history quiz a science quiz
export const inSubject = (quiz, subject) => !subject.words.length
  || words(`${quiz.title} ${quiz.description || ''}`).some((k) => subject.words.includes(k));

/** Big photo cards that slide by themselves, like a magazine cover. */
function heroCarousel(list) {
  let i = 0;
  const slides = list.map((q) => h('article', { class: 'hero-slide', role: 'link', tabindex: 0, onclick: () => navigate(`/quiz/${q.id}`), onkeydown: (e) => { if (e.key === 'Enter') navigate(`/quiz/${q.id}`); } },
    h('img', { src: coverPhoto(q), alt: '', loading: 'lazy', referrerpolicy: 'no-referrer' }),
    h('div', { class: 'hero-shade' }),
    h('div', { class: 'hero-text' },
      h('span', { class: 'pill' }, icon('star', { size: 12 }), 'Featured'),
      h('h2', {}, q.title),
      h('p', {}, q.description || ''),
      h('div', { class: 'row', style: { gap: '10px', alignItems: 'center' } },
        h('a', { class: 'btn btn-main', href: `/practice/${q.id}`, onclick: (e) => e.stopPropagation() }, icon('play', { size: 16 }), 'Play solo'),
        h('a', { class: 'btn', href: `/host/${q.id}`, onclick: (e) => e.stopPropagation() }, 'Host it'),
        h('span', { class: 'hero-meta' }, plural(q.questionCount || 0, 'question'), ' · ', `${q.plays || 0} plays`)))));
  const track = h('div', { class: 'hero-track' }, ...slides);
  const dots = h('div', { class: 'hero-dots' }, ...list.map((_, k) => h('button', { 'aria-label': `Slide ${k + 1}`, onclick: () => go(k) })));
  const go = (k) => {
    i = (k + list.length) % list.length;
    track.style.transform = `translateX(-${i * 100}%)`;
    [...dots.children].forEach((d, n) => d.classList.toggle('is-on', n === i));
  };
  go(0);
  const box = h('section', { class: 'hero-carousel' }, track,
    h('button', { class: 'hero-arrow is-left', 'aria-label': 'Previous', onclick: () => go(i - 1) }, icon('arrowRight', { size: 22 })),
    h('button', { class: 'hero-arrow', 'aria-label': 'Next', onclick: () => go(i + 1) }, icon('arrowRight', { size: 22 })), dots);
  const timer = setInterval(() => { if (!box.isConnected) { clearInterval(timer); return; } if (!box.matches(':hover')) go(i + 1); }, 5500);
  // swipe on phones
  let x0 = null;
  box.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', (e) => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1)); x0 = null; });
  return box;
}

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

  // the hero: the owner's picks (or the most played) as big photo cards,
  // then a shelf per subject
  Promise.all([
    site().then((s) => Promise.all(s.featured.map((id) => getQuiz(id).catch(() => null)))).catch(() => []),
    quizzesBy(OFFICIAL_UID).catch(() => []),
    popularQuizzes(80).catch(() => []),
    newestQuizzes(24).catch(() => []),
  ]).then(([picked, official, popular, newest]) => {
    picked = picked.filter((q) => q && q.public);
    const pool = [...new Map([...picked, ...popular, ...official].map((q) => [q.id, q])).values()];
    const heroList = (picked.length ? picked : [...pool].sort((a, b) => (b.plays || 0) - (a.plays || 0))).filter((q) => coverPhoto(q)).slice(0, 6);
    const shelves = SHELF_ORDER.map((id) => SUBJECTS.find((x) => x.id === id))
      .map((sub) => [sub, pool.filter((q) => inSubject(q, sub)).sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 12)])
      .filter(([, list]) => list.length >= 2);
    fill(featured,
      heroList.length ? heroCarousel(heroList) : null,
      picked.length ? row('Picked by the owner', verifiedBadge(null, 'owner'), picked) : null,
      popular.length ? row('Trending now', icon('bolt', { size: 20 }), popular.slice(0, 12)) : null,
      ...shelves.map(([sub, list]) => row(sub.name, h('button', { class: 'btn btn-sm shelf-more', onclick: () => { subject = sub; drawChips(); run(); window.scrollTo({ top: 0, behavior: 'smooth' }); } }, 'See all'), list)),
      official.length ? row('Made by Quickzy', verifiedBadge(null, 'official'), official.slice(0, 14)) : null,
      newest.length ? row('Fresh from creators', icon('star', { size: 20 }), newest.filter((q) => q.owner !== OFFICIAL_UID).slice(0, 12)) : null);
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
    h('h1', { class: 'discover-title' }, 'Discover'),
    h('div', { style: { position: 'relative' } }, search,
      h('span', { style: { position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'flex' } }, icon('search', { size: 22 }))),
    chips,
    featured,
    h('div', { class: 'row spread' }, h('h2', {}, 'All quizzes'),
      segmented([['popular', 'Most played'], ['new', 'Newest']], sort, (v) => { sort = v; if (!search.value.trim()) run(); })),
    results);
}
