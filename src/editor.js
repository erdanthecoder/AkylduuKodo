// editor.js — a small code editor: line numbers, Tab that indents,
// auto-closing brackets, and Ctrl+Enter to run.

import { h, highlight } from './ui.js';

export function createEditor({ value = '', onRun = () => {}, minRows = 8 } = {}) {
  const gutter = h('div', { class: 'gutter' });
  const area = h('textarea', {
    class: 'code-area',
    spellcheck: 'false',
    autocapitalize: 'off',
    autocomplete: 'off',
    autocorrect: 'off',
    rows: String(minRows),
  });
  area.value = value;

  const wrap = h('div', { class: 'editor' }, gutter, area);

  const syncGutter = () => {
    const lines = area.value.split('\n').length;
    gutter.textContent = Array.from({ length: Math.max(lines, minRows) }, (_, i) => i + 1).join('\n');
    gutter.scrollTop = area.scrollTop;
  };

  const autoGrow = () => {
    area.style.height = 'auto';
    area.style.height = Math.max(area.scrollHeight, minRows * 22) + 'px';
    gutter.style.height = area.style.height;
  };

  area.addEventListener('input', () => {
    syncGutter();
    autoGrow();
  });
  area.addEventListener('scroll', () => {
    gutter.scrollTop = area.scrollTop;
  });

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
      // keep the indentation of the current line, and open a block nicely
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
        syncGutter();
        autoGrow();
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
        const close = PAIRS[e.key];
        insert(e.key + close);
        area.selectionStart = area.selectionEnd = area.selectionStart - 1;
      }
    }
  });

  function insert(text) {
    const { selectionStart: s, selectionEnd: e2 } = area;
    area.value = area.value.slice(0, s) + text + area.value.slice(e2);
    area.selectionStart = area.selectionEnd = s + text.length;
    syncGutter();
    autoGrow();
  }

  syncGutter();
  setTimeout(autoGrow, 0);

  return {
    el: wrap,
    get value() {
      return area.value;
    },
    set value(v) {
      area.value = v;
      syncGutter();
      autoGrow();
    },
    focus: () => area.focus(),
    textarea: area,
  };
}

/** The black box under the editor where printed lines land. */
export function createConsole() {
  const body = h('div', { class: 'console-body' });
  const el = h('div', { class: 'console' }, h('div', { class: 'console-bar' }, 'Output'), body);

  return {
    el,
    clear() {
      body.replaceChildren();
    },
    write(lines, error) {
      body.replaceChildren();
      if (!lines.length && !error) {
        body.append(h('div', { class: 'console-empty' }, 'No output yet. Press Run ▶'));
      }
      lines.forEach((line) => body.append(h('div', { class: 'console-line' }, line)));
      if (error) {
        body.append(h('div', { class: 'console-error', html: String(error).replace(/\n/g, '<br>') }));
      }
      body.scrollTop = body.scrollHeight;
    },
    note(text) {
      body.append(h('div', { class: 'console-note' }, text));
      body.scrollTop = body.scrollHeight;
    },
    preview(code) {
      body.replaceChildren(h('pre', { class: 'console-preview' }, h('code', { html: highlight(code) })));
    },
  };
}
