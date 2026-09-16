// blocks.js — click or drag blocks together; they compile into the same
// JavaScript the learner would have typed. Blocks are training wheels, and the
// generated code is always visible so the wheels come off naturally.

import { h } from './ui.js';

let uid = 0;

/**
 * palette: [{ id, label: 'say {0}', tpl: 'console.log({0});', slots: [{kind:'str'|'num'|'raw', value}] }]
 */
export function createBlocks({ palette = [], onChange = () => {} } = {}) {
  let placed = [];

  const paletteEl = h('div', { class: 'block-palette' });
  const stackEl = h('div', { class: 'block-stack' });
  const el = h(
    'div',
    { class: 'blocks' },
    h('div', { class: 'blocks-col' }, h('h4', {}, '🧩 Blocks'), paletteEl),
    h(
      'div',
      { class: 'blocks-col' },
      h(
        'h4',
        {},
        '🏗️ Your program',
        h('button', { class: 'mini-btn', onclick: () => { placed = []; render(); } }, 'clear'),
      ),
      stackEl,
    ),
  );

  palette.forEach((def) => {
    paletteEl.append(
      h(
        'button',
        {
          class: 'block block-source',
          onclick: () => {
            placed.push({ key: ++uid, def, values: (def.slots || []).map((s) => s.value) });
            render();
          },
        },
        renderLabel(def, (def.slots || []).map((s) => s.value), null),
      ),
    );
  });

  let dragFrom = null;

  function render() {
    stackEl.replaceChildren();
    if (!placed.length) {
      stackEl.append(h('div', { class: 'block-empty' }, 'Tap a block on the left to add it here.'));
    }
    placed.forEach((item, index) => {
      const row = h(
        'div',
        {
          class: 'block block-placed',
          draggable: 'true',
          ondragstart: () => {
            dragFrom = index;
          },
          ondragover: (e) => e.preventDefault(),
          ondrop: (e) => {
            e.preventDefault();
            if (dragFrom === null || dragFrom === index) return;
            const [moved] = placed.splice(dragFrom, 1);
            placed.splice(index, 0, moved);
            dragFrom = null;
            render();
          },
        },
        h('span', { class: 'block-grip' }, '⋮⋮'),
        renderLabel(item.def, item.values, (slotIndex, value) => {
          item.values[slotIndex] = value;
          emit();
        }),
        h('span', { class: 'block-tools' },
          h('button', { class: 'mini-btn', title: 'move up', onclick: () => move(index, -1) }, '↑'),
          h('button', { class: 'mini-btn', title: 'move down', onclick: () => move(index, 1) }, '↓'),
          h('button', { class: 'mini-btn', title: 'remove', onclick: () => { placed.splice(index, 1); render(); } }, '✕'),
        ),
      );
      stackEl.append(row);
    });
    emit();
  }

  function move(index, delta) {
    const target = index + delta;
    if (target < 0 || target >= placed.length) return;
    [placed[index], placed[target]] = [placed[target], placed[index]];
    render();
  }

  function emit() {
    onChange(toCode());
  }

  function toCode() {
    let indent = 0;
    const lines = [];
    for (const item of placed) {
      const snippet = fill(item.def.tpl, item.def.slots || [], item.values).trimEnd();
      if (/^\s*[}\])]/.test(snippet)) indent = Math.max(0, indent - 1);
      lines.push('  '.repeat(indent) + snippet);
      if (/[{[(]$/.test(snippet)) indent += 1;
    }
    return lines.join('\n');
  }

  render();

  return {
    el,
    get code() {
      return toCode();
    },
    reset() {
      placed = [];
      render();
    },
  };
}

function fill(tpl, slots, values) {
  return tpl.replace(/\{(\d)\}/g, (_, i) => literal(slots[Number(i)], values[Number(i)]));
}

function literal(slot, value) {
  const raw = value === undefined || value === '' ? (slot?.value ?? '') : value;
  if (!slot || slot.kind === 'str') return JSON.stringify(String(raw));
  if (slot.kind === 'num') return String(Number(raw) || 0);
  return String(raw);
}

function renderLabel(def, values, onEdit) {
  const parts = def.label.split(/(\{\d\})/);
  const nodes = parts.map((part) => {
    const m = part.match(/^\{(\d)\}$/);
    if (!m) return h('span', { class: 'block-text' }, part);
    const i = Number(m[1]);
    const slot = (def.slots || [])[i] || {};
    if (!onEdit) return h('span', { class: 'block-slot block-slot-static' }, String(values[i] ?? slot.value ?? ''));
    const input = h('input', {
      class: 'block-slot',
      type: slot.kind === 'num' ? 'number' : 'text',
      value: String(values[i] ?? slot.value ?? ''),
      oninput: (e) => onEdit(i, e.target.value),
      onclick: (e) => e.stopPropagation(),
    });
    input.style.width = Math.max(4, String(values[i] ?? '').length + 2) + 'ch';
    input.addEventListener('input', () => {
      input.style.width = Math.max(4, input.value.length + 2) + 'ch';
    });
    return input;
  });
  return h('span', { class: 'block-label' }, ...nodes);
}
