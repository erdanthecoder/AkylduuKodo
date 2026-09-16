// lab.js — the Code Lab: a blank page and a Run button.

import { h, toast } from '../ui.js';
import { ui } from '../i18n.js';
import { createEditor, createScreen } from '../editor.js';
import { runCode } from '../runner.js';

const KEY = 'akylduukodo.lab';

const SNIPPETS = [
  {
    name: '🎲 Dice roller',
    code: 'function roll() {\n  return 1 + Math.floor(Math.random() * 6);\n}\n\nfor (let i = 1; i <= 5; i++) {\n  console.log(`Roll ${i}: ${roll()}`);\n}',
  },
  {
    name: '🧮 Times table',
    code: 'let n = 8;\nfor (let i = 1; i <= 10; i++) {\n  console.log(`${n} x ${i} = ${n * i}`);\n}',
  },
  {
    name: '🎄 Pyramid',
    code: 'let rows = 6;\nfor (let i = 1; i <= rows; i++) {\n  console.log(" ".repeat(rows - i) + "*".repeat(i * 2 - 1));\n}',
  },
  {
    name: '🔤 Secret code',
    code: 'function secret(text) {\n  let out = "";\n  for (let ch of text) {\n    out += ch === " " ? " " : String.fromCharCode(ch.charCodeAt(0) + 1);\n  }\n  return out;\n}\n\nconsole.log(secret("salam dostor"));',
  },
  {
    name: '🏔️ Name art',
    code: 'let name = "KODO";\nfor (let ch of name) {\n  console.log(ch + " " + "*".repeat(name.length));\n}',
  },
];

export function LabView() {
  const cons = createScreen({ title: 'What your code shows' });
  const editor = createEditor({
    value: localStorage.getItem(KEY) || '// Anything goes. Try me:\nconsole.log("Salam, " + "world!");\n',
    onRun: run,
    minRows: 14,
  });

  cons.clear('Write anything, then press Run ▶.');

  function run() {
    const code = editor.value;
    try {
      localStorage.setItem(KEY, code);
    } catch { /* ignore */ }
    const res = runCode(code, { maxLogs: 400 });
    cons.write(res.logs, res.error);
  }

  return h(
    'div',
    { class: 'view' },
    h('h1', { class: 'view-title' }, '🧪 ' + ui('lab_title')),
    h('p', { class: 'muted' }, ui('lab_sub')),
    h('div', { class: 'chips snippets' },
      ...SNIPPETS.map((s) =>
        h('button', {
          class: 'chip chip-btn',
          onclick: () => {
            editor.value = s.code;
            toast(`${s.name} loaded — press Run ▶`, 'ok');
          },
        }, s.name),
      ),
    ),
    h('div', { class: 'card' },
      h('div', { class: 'bench-split' },
        h('div', { class: 'bench-code' }, h('span', { class: 'bench-label' }, '✍️ Your code'), editor.el),
        h('div', { class: 'bench-out' }, cons.el),
      ),
      h('div', { class: 'row gap tools' },
        h('button', { class: 'btn btn-run', onclick: run }, '▶ ' + ui('run')),
        h('button', { class: 'btn btn-ghost', onclick: () => { editor.value = ''; cons.clear(); } }, '↺ ' + ui('reset_code')),
      ),
      h('p', { class: 'muted small' }, ui('run_hint') + ' · your code is saved in this browser'),
    ),
  );
}
