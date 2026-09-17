// book.js — the C++ handbook.
//
// A full reference book that lives inside the site: chapters down the side,
// one idea per page, a runnable-looking sample with the output it prints, and
// a pad on every page for the reader's own notes.

import { h, escapeHtml, md, toast } from '../ui.js';
import { icon } from '../icons.js';
import * as store from '../state.js';
import { notePad, noteKey } from '../notes.js';
import { CHAPTERS, PAGES, pageAt, findPage, chapterOf } from '../data/book/index.js';

/** Syntax highlighting for C++ samples. */
export function highlightCpp(code) {
  const OPEN = '@@c';
  const CLOSE = 'c@@';
  const stash = [];
  const keep = (html) => `${OPEN}${stash.push(html) - 1}${CLOSE}`;
  const KEYWORDS = /\b(alignas|auto|bool|break|case|catch|char|class|const|constexpr|continue|decltype|default|delete|do|double|else|enum|explicit|export|extern|false|float|for|friend|goto|if|inline|int|long|mutable|namespace|new|noexcept|nullptr|operator|private|protected|public|return|short|signed|sizeof|static|struct|switch|template|this|throw|true|try|typedef|typename|union|unsigned|using|virtual|void|while)\b/g;
  const TYPES = /\b(std|string|vector|map|set|array|pair|tuple|cout|cin|cerr|endl|size_t|ostream|istream|ifstream|ofstream|unique_ptr|shared_ptr|sort|find|swap|push_back|begin|end|size|length|substr|main)\b/g;

  let out = escapeHtml(code)
    .replace(/(^|\n)(\s*#[^\n]*)/g, (m, nl, d) => nl + keep(`<span class="tok-pre">${d}</span>`))
    .replace(/(\/\/[^\n]*)/g, (m) => keep(`<span class="tok-com">${m}</span>`))
    .replace(/(&quot;[^\n]*?&quot;|&#39;.&#39;)/g, (m) => keep(`<span class="tok-str">${m}</span>`))
    .replace(KEYWORDS, (m) => keep(`<span class="tok-kw">${m}</span>`))
    .replace(/\b(\d+(?:\.\d+)?f?)\b/g, (m) => keep(`<span class="tok-num">${m}</span>`))
    .replace(TYPES, (m) => keep(`<span class="tok-fn">${m}</span>`));

  return out.replace(new RegExp(`${OPEN}(\\d+)${CLOSE}`, 'g'), (_, i) => stash[Number(i)]);
}

function markRead(pageId) {
  const book = { ...(store.get().book || {}) };
  const read = { ...(book.read || {}) };
  read[pageId] = true;
  store.set({ book: { ...book, read, last: pageId } });
}

export function bookProgress() {
  const read = store.get().book?.read || {};
  const count = PAGES.filter((p) => read[p.id]).length;
  return { count, total: PAGES.length, pct: Math.round((count / PAGES.length) * 100) };
}

/* ------------------------------------------------------------- the contents */

function contents(currentId, go, filter = '') {
  const read = store.get().book?.read || {};
  const needle = filter.trim().toLowerCase();
  const list = h('nav', { class: 'toc' });

  CHAPTERS.forEach((chapter, ci) => {
    const pages = chapter.pages.filter(
      (p) => !needle || p.title.toLowerCase().includes(needle) || (p.lede || '').toLowerCase().includes(needle) || chapter.title.toLowerCase().includes(needle),
    );
    if (!pages.length) return;
    const openNow = pages.some((p) => p.id === currentId) || Boolean(needle);
    const group = h('section', { class: 'toc-group' + (openNow ? ' is-open' : '') });
    const doneHere = chapter.pages.filter((p) => read[p.id]).length;
    group.append(
      h('button', {
        class: 'toc-head',
        onclick: () => group.classList.toggle('is-open'),
      },
        h('span', { class: 'toc-num' }, String(ci + 1).padStart(2, '0')),
        h('span', { class: 'toc-name' }, chapter.title),
        h('span', { class: 'toc-count' }, `${doneHere}/${chapter.pages.length}`),
      ),
      h('ol', { class: 'toc-pages' },
        ...pages.map((p) =>
          h('li', {},
            h('button', {
              class: 'toc-link' + (p.id === currentId ? ' is-current' : '') + (read[p.id] ? ' is-read' : ''),
              onclick: () => go(`#/book/${p.id}`),
            },
              h('span', { class: 'toc-page-num' }, String(p.number)),
              h('span', {}, p.title),
            ),
          ),
        ),
      ),
    );
    list.append(group);
  });

  if (!list.children.length) list.append(h('p', { class: 'muted small toc-empty' }, 'Nothing matches that.'));
  return list;
}

function sidebar(currentId, go) {
  const wrap = h('aside', { class: 'book-side' });
  const search = h('input', {
    class: 'text-input book-search',
    type: 'search',
    placeholder: 'Search the book',
    oninput: (e) => {
      const next = contents(currentId, go, e.target.value);
      wrap.replaceChild(next, wrap.lastElementChild);
    },
  });
  const p = bookProgress();
  wrap.append(
    h('div', { class: 'book-side-head' },
      h('span', { class: 'eyebrow' }, 'Contents'),
      h('span', { class: 'muted small' }, `${p.count} of ${p.total} pages read`),
      h('span', { class: 'mini-bar' }, h('span', { class: 'mini-bar-fill', style: `width:${p.pct}%` })),
    ),
    search,
    contents(currentId, go),
  );
  return wrap;
}

/* ------------------------------------------------------------ a single page */

function sample(page) {
  if (!page.code) return null;
  const copy = h('button', {
    class: 'code-copy',
    title: 'Copy',
    onclick: async () => {
      try {
        await navigator.clipboard.writeText(page.code);
        toast('Copied.', 'ok');
      } catch {
        toast('Your browser would not let us copy that.', 'warn');
      }
    },
  }, icon('layers', { size: 14 }), 'Copy');

  return h('div', { class: 'cpp-sample' },
    h('div', { class: 'cpp-bar' },
      h('span', { class: 'cpp-file' }, page.file || 'main.cpp'),
      copy,
    ),
    h('pre', { class: 'code-sample cpp-code' }, h('code', { html: highlightCpp(page.code) })),
    page.output
      ? h('div', { class: 'cpp-out' },
          h('span', { class: 'cpp-out-label' }, 'What it prints'),
          h('pre', {}, page.output),
        )
      : null,
  );
}

function pageView(page, go) {
  const chapter = chapterOf(page.id);
  const prev = pageAt(page.number - 1);
  const next = pageAt(page.number + 1);
  markRead(page.id);

  return h('article', { class: 'book-page' },
    h('div', { class: 'book-page-head' },
      h('span', { class: 'eyebrow' }, `${chapter.title} · page ${page.number} of ${PAGES.length}`),
      h('h1', {}, page.title),
      page.lede ? h('p', { class: 'book-lede' }, page.lede) : null,
    ),
    h('div', { class: 'book-body', html: md(page.body) }),
    sample(page),
    page.points?.length
      ? h('div', { class: 'book-points' },
          h('h3', {}, 'Remember'),
          h('ul', {}, ...page.points.map((t) => h('li', {}, t))),
        )
      : null,
    page.tip ? h('aside', { class: 'book-tip' }, h('span', { class: 'tip-mark' }, icon('bulb', { size: 16 })), h('p', {}, page.tip)) : null,
    notePad({
      key: noteKey('book', page.id),
      title: 'My note on this page',
      label: `Book · ${page.title}`,
      href: `#/book/${page.id}`,
      placeholder: 'Write it in your own words — that is what makes it stick.',
    }),
    h('nav', { class: 'book-nav' },
      prev
        ? h('button', { class: 'btn btn-ghost book-prev', onclick: () => go(`#/book/${prev.id}`) },
            icon('arrowLeft', { size: 16 }), h('span', {}, prev.title))
        : h('span', {}),
      next
        ? h('button', { class: 'btn btn-primary book-next', onclick: () => go(`#/book/${next.id}`) },
            h('span', {}, next.title), icon('arrowRight', { size: 16 }))
        : h('button', { class: 'btn btn-primary', onclick: () => go('#/journey') }, 'Back to the journey'),
    ),
  );
}

/* ------------------------------------------------------------- the cover */

function cover(go) {
  const p = bookProgress();
  const last = store.get().book?.last;
  const resume = last && findPage(last);

  return h('article', { class: 'book-cover' },
    h('div', { class: 'cover-plate' },
      h('span', { class: 'eyebrow' }, 'The handbook'),
      h('h1', {}, 'C++ from the beginning'),
      h('p', { class: 'cover-lede' },
        'Everything the language asks of you, in order, one idea to a page. Start at page one and read it like a book, or jump straight to the thing you are stuck on.'),
      h('div', { class: 'cover-stats' },
        h('span', {}, h('b', {}, String(PAGES.length)), ' pages'),
        h('span', {}, h('b', {}, String(CHAPTERS.length)), ' chapters'),
        h('span', {}, h('b', {}, `${p.pct}%`), ' read'),
      ),
      h('div', { class: 'cover-cta' },
        h('button', { class: 'btn btn-primary btn-big', onclick: () => go(`#/book/${(resume || PAGES[0]).id}`) },
          resume ? 'Continue reading' : 'Open at page one', icon('arrowRight', { size: 17 })),
        resume
          ? h('button', { class: 'btn btn-ghost', onclick: () => go(`#/book/${PAGES[0].id}`) }, 'Start from the beginning')
          : null,
      ),
    ),
    h('div', { class: 'cover-grid' },
      ...CHAPTERS.map((c, i) =>
        h('button', {
          class: 'cover-chapter',
          style: `--i:${i}`,
          onclick: () => go(`#/book/${c.pages[0].id}`),
        },
          h('span', { class: 'cover-num' }, String(i + 1).padStart(2, '0')),
          h('h3', {}, c.title),
          h('p', {}, c.blurb),
          h('span', { class: 'cover-pages' }, `${c.pages.length} pages`),
        ),
      ),
    ),
  );
}

export function BookView(pageId, go) {
  const page = pageId ? findPage(pageId) : null;
  const view = h('div', { class: 'view book' + (page ? ' book-reading' : '') });

  if (!page) {
    view.append(cover(go));
    return view;
  }

  view.append(sidebar(page.id, go), pageView(page, go));

  const onKey = (e) => {
    if (e.target.matches('input, textarea')) return;
    if (e.key === 'ArrowRight') {
      const next = pageAt(page.number + 1);
      if (next) go(`#/book/${next.id}`);
    }
    if (e.key === 'ArrowLeft') {
      const prev = pageAt(page.number - 1);
      if (prev) go(`#/book/${prev.id}`);
    }
  };
  window.addEventListener('keydown', onKey);
  view.addEventListener('view-destroy', () => window.removeEventListener('keydown', onKey));
  return view;
}
