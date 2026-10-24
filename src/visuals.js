// visuals.js — the pictures a question can carry.
//
// Every one is drawn as SVG at the size it is needed, because a seven-year-old
// reads a picture of four tenths long before she reads "4/10".

import { svg, h } from './ui.js';

const INK = 'var(--ink)';
const LINE = 'var(--line)';
const FILL = 'var(--sun)';

/** A bar split into equal parts, some shaded — fractions you can see. */
function bar({ parts, filled }) {
  const w = Math.min(420, parts * 46);
  const hgt = 72;
  const step = w / parts;
  const box = svg('svg', { viewBox: `0 0 ${w} ${hgt}`, class: 'vis vis-bar', role: 'img',
    'aria-label': `${filled} out of ${parts} parts shaded` });
  for (let i = 0; i < parts; i++) {
    box.append(svg('rect', {
      x: i * step, y: 0, width: step, height: hgt,
      fill: i < filled ? FILL : 'transparent', stroke: INK, 'stroke-width': 3,
    }));
  }
  return box;
}

/** A rectangle with its sides labelled, for perimeter. */
function rect({ w, h: tall }) {
  const scale = Math.min(26, 260 / Math.max(w, tall));
  const bw = w * scale;
  const bh = tall * scale;
  const pad = 34;
  const box = svg('svg', { viewBox: `0 0 ${bw + pad * 2} ${bh + pad * 2}`, class: 'vis vis-rect', role: 'img',
    'aria-label': `a rectangle ${w} by ${tall} centimetres` });
  box.append(svg('rect', { x: pad, y: pad, width: bw, height: bh, fill: 'var(--sky-soft)', stroke: INK, 'stroke-width': 3, rx: 2 }));
  const label = (x, y, text, anchor) => {
    const t = svg('text', { x, y, 'text-anchor': anchor, class: 'vis-label' });
    t.textContent = text;
    return t;
  };
  box.append(label(pad + bw / 2, pad - 10, `${w} cm`, 'middle'));
  box.append(label(pad + bw / 2, pad + bh + 24, `${w} cm`, 'middle'));
  box.append(label(pad - 8, pad + bh / 2 + 5, `${tall} cm`, 'end'));
  box.append(label(pad + bw + 8, pad + bh / 2 + 5, `${tall} cm`, 'start'));
  return box;
}

/** A clock face with hands, numbered in the ordinary way. */
function clock({ h: hour, m }) {
  const size = 230;
  const c = size / 2;
  const box = svg('svg', { viewBox: `0 0 ${size} ${size}`, class: 'vis vis-clock', role: 'img',
    'aria-label': 'a clock face' });
  box.append(svg('circle', { cx: c, cy: c, r: c - 6, fill: 'var(--paper)', stroke: INK, 'stroke-width': 4 }));
  for (let i = 1; i <= 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const t = svg('text', {
      x: c + Math.cos(a) * (c - 26), y: c + Math.sin(a) * (c - 26) + 7,
      'text-anchor': 'middle', class: 'vis-number',
    });
    t.textContent = String(i);
    box.append(t);
  }
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const long = i % 5 === 0;
    box.append(svg('line', {
      x1: c + Math.cos(a) * (c - 12), y1: c + Math.sin(a) * (c - 12),
      x2: c + Math.cos(a) * (c - (long ? 18 : 15)), y2: c + Math.sin(a) * (c - (long ? 18 : 15)),
      stroke: long ? INK : LINE, 'stroke-width': long ? 3 : 1.5,
    }));
  }
  const hand = (angle, len, width, colour) => {
    const a = angle - Math.PI / 2;
    return svg('line', {
      x1: c, y1: c, x2: c + Math.cos(a) * len, y2: c + Math.sin(a) * len,
      stroke: colour, 'stroke-width': width, 'stroke-linecap': 'round',
    });
  };
  // the hour hand creeps on as the minutes pass, exactly as a real clock does
  box.append(hand(((hour % 12) + m / 60) / 12 * Math.PI * 2, c - 72, 9, INK));
  box.append(hand((m / 60) * Math.PI * 2, c - 38, 6, 'var(--berry)'));
  box.append(svg('circle', { cx: c, cy: c, r: 7, fill: INK }));
  return box;
}

const COIN_LOOK = {
  1: ['1p', 'copper', 30], 2: ['2p', 'copper', 36], 5: ['5p', 'silver', 28],
  10: ['10p', 'silver', 34], 20: ['20p', 'silver', 32], 50: ['50p', 'silver', 38],
  100: ['£1', 'gold', 36], 200: ['£2', 'gold', 42],
};

function coins({ coins: list }) {
  return h('div', { class: 'vis vis-coins' },
    ...list.map((value) => {
      const [label, metal, size] = COIN_LOOK[value] || ['?', 'silver', 32];
      const coin = h('span', { class: `coin coin-${metal}` }, label);
      coin.style.width = `${size * 1.7}px`;
      coin.style.height = `${size * 1.7}px`;
      return coin;
    }),
  );
}

function bars({ title, labels, values, step = 1 }) {
  const max = Math.max(...values, step);
  const top = Math.ceil(max / step) * step;
  const w = 340;
  const hgt = 210;
  const left = 34;
  const bottom = hgt - 30;
  const bandW = (w - left) / labels.length;
  const box = svg('svg', { viewBox: `0 0 ${w} ${hgt}`, class: 'vis vis-chart', role: 'img', 'aria-label': title });
  const ticks = Math.min(6, top / step);
  for (let i = 0; i <= ticks; i++) {
    const value = Math.round((top / ticks) * i);
    const y = bottom - (value / top) * (bottom - 18);
    box.append(svg('line', { x1: left, y1: y, x2: w - 4, y2: y, stroke: LINE, 'stroke-width': 1 }));
    const t = svg('text', { x: left - 7, y: y + 4, 'text-anchor': 'end', class: 'vis-small' });
    t.textContent = String(value);
    box.append(t);
  }
  values.forEach((value, i) => {
    const barH = (value / top) * (bottom - 18);
    box.append(svg('rect', {
      x: left + i * bandW + bandW * 0.18, y: bottom - barH,
      width: bandW * 0.64, height: barH, fill: FILL, stroke: INK, 'stroke-width': 2, rx: 3,
    }));
    const t = svg('text', { x: left + i * bandW + bandW / 2, y: bottom + 18, 'text-anchor': 'middle', class: 'vis-small' });
    t.textContent = labels[i];
    box.append(t);
  });
  box.append(svg('line', { x1: left, y1: bottom, x2: w - 4, y2: bottom, stroke: INK, 'stroke-width': 3 }));
  box.append(svg('line', { x1: left, y1: 14, x2: left, y2: bottom, stroke: INK, 'stroke-width': 3 }));
  return h('figure', { class: 'vis-figure' }, h('figcaption', {}, title), box);
}

function picto({ title, labels, counts, each }) {
  return h('figure', { class: 'vis-figure' },
    h('figcaption', {}, title),
    h('table', { class: 'vis-picto' },
      ...labels.map((label, i) =>
        h('tr', {},
          h('th', {}, label),
          h('td', {}, ...Array.from({ length: counts[i] }, () => {
            const s = svg('svg', { viewBox: '0 0 24 24', class: 'picto-mark' });
            s.append(svg('circle', { cx: 12, cy: 12, r: 9, fill: FILL, stroke: INK, 'stroke-width': 2 }));
            return s;
          })),
        ),
      ),
    ),
    h('p', { class: 'vis-key' }, `Each circle stands for ${each}.`),
  );
}

/** Three pairs of lines; the first is always the right one, then shuffled by CSS order. */
function lines({ want }) {
  const make = (kind) => {
    const s = svg('svg', { viewBox: '0 0 90 90', class: 'vis-lines' });
    const stroke = { stroke: INK, 'stroke-width': 4, 'stroke-linecap': 'round' };
    if (kind === 'parallel') {
      s.append(svg('line', { x1: 14, y1: 24, x2: 76, y2: 24, ...stroke }));
      s.append(svg('line', { x1: 14, y1: 62, x2: 76, y2: 62, ...stroke }));
    } else if (kind === 'perpendicular') {
      s.append(svg('line', { x1: 14, y1: 66, x2: 76, y2: 66, ...stroke }));
      s.append(svg('line', { x1: 36, y1: 16, x2: 36, y2: 66, ...stroke }));
    } else {
      s.append(svg('line', { x1: 12, y1: 70, x2: 78, y2: 54, ...stroke }));
      s.append(svg('line', { x1: 20, y1: 18, x2: 70, y2: 62, ...stroke }));
    }
    return s;
  };
  const other = want === 'parallel' ? 'perpendicular' : 'parallel';
  return h('div', { class: 'vis vis-linebox' },
    ...[['A', want], ['B', other], ['C', 'crossed']].map(([label, kind]) =>
      h('div', { class: 'linecard' }, make(kind), h('span', {}, label)),
    ),
  );
}

const DRAW = { bar, rect, clock, coins, bars, picto, lines };

export function visual(spec) {
  if (!spec || !DRAW[spec.type]) return null;
  return DRAW[spec.type](spec);
}
