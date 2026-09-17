// editor.js — a small code editor with live syntax highlighting.
//
// The trick: a transparent <textarea> sits exactly on top of a highlighted
// <pre>. The learner types into the textarea (so selection, undo, autocomplete
// and mobile keyboards all behave normally) but sees the coloured layer behind.
// Both must share identical font metrics and padding or the caret drifts.

import { h, highlight } from './ui.js';

export function createEditor({ value = '', onRun = () => {}, onChange = () => {}, minRows = 8 } = {}) {
  const gutter = h('div', { class: 'gutter' });
  const hl = h('pre', { class: 'hl-layer', 'aria-hidden': 'true' });
  const area = h('textarea', {
    class: 'code-area',
    spellcheck: 'false',
    autocapitalize: 'off',
    autocomplete: 'off',
    autocorrect: 'off',
    wrap: 'off',
    rows: String(minRows),
  });
  area.value = value;

  const scroller = h('div', { class: 'editor-scroll' }, hl, area);
  const wrap = h('div', { class: 'editor' }, gutter, scroller);

  function paint() {
    const text = area.value;
    const lines = text.split('\n').length;
    gutter.textContent = Array.from({ length: Math.max(lines, minRows) }, (_, i) => i + 1).join('\n');
    // A trailing newline needs a spacer or the last line has nothing to sit on.
    hl.innerHTML = highlight(text) + (text.endsWith('\n') ? ' ' : '');
    // The line height is a preference (Settings -> code size), so read it back
    // from the stylesheet rather than assuming it.
    const lh = parseFloat(getComputedStyle(area).lineHeight) || 22;
    const height = Math.max(lines, minRows) * lh + 24;
    area.style.height = height + 'px';
    hl.style.height = height + 'px';
    onChange(text);
  }

  // Scroll the layer rather than transforming it: a transform would move the
  // element's clip box too, letting long lines spill over the line numbers.
  const sync = () => {
    hl.scrollLeft = area.scrollLeft;
    hl.scrollTop = area.scrollTop;
    gutter.scrollTop = area.scrollTop;
  };

  area.addEventListener('input', () => {
    paint();
    sync();
  });
  area.addEventListener('scroll', sync);

  const PAIRS = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'", '`': '`' };

  area.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onRun();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      insert('  ');
      return;
    }
    if (e.key === 'Enter') {
      const { selectionStart: s } = area;
      const lineStart = area.value.lastIndexOf('\n', s - 1) + 1;
      const line = area.value.slice(lineStart, s);
      const indent = (line.match(/^\s*/) || [''])[0];
      const opensBlock = /[{[(]\s*$/.test(line);
      const closerNext = /^\s*[}\])]/.test(area.value.slice(s));
      if (opensBlock && closerNext) {
        e.preventDefault();
        insert('\n' + indent + '  ');
        const pos = area.selectionStart;
        area.value = area.value.slice(0, pos) + '\n' + indent + area.value.slice(pos);
        area.selectionStart = area.selectionEnd = pos;
        paint();
        return;
      }
      if (indent || opensBlock) {
        e.preventDefault();
        insert('\n' + indent + (opensBlock ? '  ' : ''));
        return;
      }
    }
    if (PAIRS[e.key] && area.selectionStart === area.selectionEnd) {
      const after = area.value[area.selectionStart];
      if (after === undefined || /[\s)\]};,]/.test(after)) {
        e.preventDefault();
        insert(e.key + PAIRS[e.key]);
        area.selectionStart = area.selectionEnd = area.selectionStart - 1;
      }
    }
  });

  function insert(text) {
    const { selectionStart: s, selectionEnd: e2 } = area;
    area.value = area.value.slice(0, s) + text + area.value.slice(e2);
    area.selectionStart = area.selectionEnd = s + text.length;
    paint();
  }

  paint();

  return {
    el: wrap,
    get value() {
      return area.value;
    },
    set value(v) {
      area.value = v;
      paint();
    },
    focus: () => area.focus(),
    textarea: area,
  };
}

/**
 * The output screen: what the learner's program actually showed.
 * Styled as a little terminal window rather than a plain box, so "the code I
 * wrote" and "what it printed" read as two different things.
 */
export function createScreen({ title = 'What your code shows' } = {}) {
  const body = h('div', { class: 'screen-body' });
  const status = h('span', { class: 'screen-status' });
  const el = h(
    'div',
    { class: 'screen' },
    h('div', { class: 'screen-bar' },
      h('span', { class: 'dots' }, h('i', {}), h('i', {}), h('i', {})),
      h('span', { class: 'screen-title' }, title),
      status,
    ),
    body,
  );

  const empty = (text) => h('div', { class: 'screen-empty' }, text);

  return {
    el,
    clear(text = 'Press Run to see what your code does.') {
      status.textContent = '';
      status.className = 'screen-status';
      body.replaceChildren(empty(text));
    },
    /** lines: string[] from console.log, error: string|null */
    write(lines, error, meta = {}) {
      body.replaceChildren();
      if (!lines.length && !error) {
        body.append(empty('Your code ran, but printed nothing. Use console.log(...) to show something.'));
      }
      lines.forEach((line, i) => {
        const row = h('div', { class: 'screen-line' },
          h('span', { class: 'screen-num' }, String(i + 1)),
          h('span', { class: 'screen-text' }, line === '' ? ' ' : line),
        );
        row.style.animationDelay = Math.min(i * 40, 400) + 'ms';
        body.append(row);
      });
      if (error) {
        body.append(h('div', { class: 'screen-error', html: String(error).replace(/\n/g, '<br>') }));
      }
      status.textContent = error ? 'stopped with an error' : `${lines.length} line${lines.length === 1 ? '' : 's'} printed`;
      status.className = 'screen-status ' + (error ? 'is-bad' : meta.ok ? 'is-ok' : '');
      body.scrollTop = 0;
    },
    note(text) {
      body.append(h('div', { class: 'screen-note' }, text));
      body.scrollTop = body.scrollHeight;
    },
    /** Side-by-side "what the task wants" vs "what you printed". */
    compare(expected, actual) {
      const differs = (i) => (expected[i] ?? null) !== (actual[i] ?? null);
      body.replaceChildren(
        h('div', { class: 'compare' },
          column('Task expects', expected, 'want', differs),
          column('Your code shows', actual, 'got', differs),
        ),
      );
      status.textContent = 'comparison';
      status.className = 'screen-status';
    },
    preview(code) {
      body.replaceChildren(h('pre', { class: 'screen-preview' }, h('code', { html: highlight(code) })));
      status.textContent = 'code your blocks make';
      status.className = 'screen-status';
    },
  };

  function column(label, lines, kind, differs) {
    const rows = lines.length
      ? lines.map((line, i) =>
          h('div', { class: 'screen-line ' + (differs(i) ? 'line-diff' : '') },
            h('span', { class: 'screen-num' }, String(i + 1)),
            h('span', { class: 'screen-text' }, line === '' ? '\u00a0' : line),
          ),
        )
      : [h('div', { class: 'screen-empty' }, '(nothing printed)')];
    return h('div', { class: `compare-col compare-${kind}` }, h('h5', {}, label), ...rows);
  }
}
