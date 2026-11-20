// blooks.js — your blook cards: open boxes, see the collection, build up to
// three custom blooks, and see what each level unlocks.

import { h, fill } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { blook, BLOOKS, RARITIES, rarityOf, blookName, CUSTOM_PARTS, PART_NAMES, customId, customParts } from '../ui/blooks.js';
import { modal, busy, toast } from '../ui/kit.js';
import { signedIn, whenProfile, updateProfile } from '../services/session.js';
import * as progress from '../services/progress.js';
import { sfx } from '../game/sound.js';
import { pageTitle } from './parts.js';

/** One blook as a trading card. */
export function blookCard(id, { owned = true, count = 0, big = false, onclick } = {}) {
  const r = rarityOf(id);
  const b = blook(id);
  return h(onclick ? 'button' : 'div', {
    class: `bcard r-${r.id}${owned ? '' : ' is-locked'}${big ? ' is-big' : ''}`, style: { '--rc': r.colour },
    type: onclick ? 'button' : null, onclick,
    'aria-label': owned ? `${blookName(id, nameMap())}, ${r.name}` : `Not collected yet, ${r.name}`,
  },
  h('span', { class: 'bcard-rarity' }, r.name),
  h('span', { class: 'bcard-art' }, b),
  h('b', { class: 'bcard-name' }, owned ? blookName(id, nameMap()) : '???'),
  count > 1 ? h('span', { class: 'bcard-count' }, `x${count}`) : null);
}

function nameMap() {
  const out = {};
  progress.me().customs.forEach((id, i) => { out[id] = `Custom ${i + 1}`; });
  return out;
}

function header() {
  const m = progress.me();
  const info = progress.levelInfo(m.xp);
  return h('section', { class: 'card level-card' },
    h('div', { class: 'level-badge' }, h('small', {}, 'Level'), h('b', {}, String(info.level))),
    h('div', { class: 'grow stack', style: { gap: '6px' } },
      h('div', { class: 'row spread' }, h('b', {}, info.level >= progress.MAX_LEVEL ? 'Top level' : `${info.into} / ${info.need} XP to level ${info.level + 1}`),
        h('span', { class: 'coins' }, coin(), String(m.coins))),
      h('div', { class: 'xp-bar' }, h('i', { style: { width: `${Math.round(info.frac * 100)}%` } })),
      h('small', { class: 'muted' }, 'Play games to earn XP and coins. Finishing in the top three earns extra coins.')));
}

export function coin() {
  return h('span', { class: 'coin', 'aria-hidden': 'true' }, 'Q');
}

/* ------------------------------------------------------------------ boxes */

function boxes(redraw) {
  const m = progress.me();
  const lvl = progress.levelOf(m.xp);
  return h('div', { class: 'boxes' }, ...progress.BOXES.map((box) => {
    const locked = lvl < box.level;
    const btn = h('button', { class: 'btn btn-main', disabled: locked || m.coins < box.price }, coin(), String(box.price));
    btn.addEventListener('click', busy(btn, async () => {
      try {
        const res = await progress.openBox(box.id);
        await reveal(res);
        redraw();
      } catch (err) { toast(err.message, 'bad'); }
    }));
    const odds = RARITIES.map((r) => h('li', {}, h('i', { style: { background: r.colour } }),
      `${r.name} ${fmtPct(box.luck === 1 ? r.chance : luckyChance(r.id, box.luck))}`));
    return h('div', { class: `box-card${locked ? ' is-locked' : ''}`, style: { background: box.colour } },
      h('div', { class: 'box-art' }, boxArt()),
      h('h3', {}, box.name),
      locked ? h('p', {}, icon('lock', { size: 14 }), ` Opens at level ${box.level}`) : h('ul', { class: 'odds' }, ...odds),
      btn);
  }));
}

const ORDER = RARITIES.map((r) => r.id);
/** Chance this rarity or rarer, from one draw. */
const cumulative = (id) => RARITIES.slice(ORDER.indexOf(id)).reduce((n, r) => n + r.chance, 0);
/** With several draws keeping the rarest: P(best is exactly this rarity). */
function luckyChance(id, draws) {
  const atLeast = 1 - (1 - cumulative(id)) ** draws;
  const next = ORDER.indexOf(id) + 1 < ORDER.length ? 1 - (1 - cumulative(ORDER[ORDER.indexOf(id) + 1])) ** draws : 0;
  return atLeast - next;
}
const fmtPct = (p) => `${p < 0.1 ? (p * 100).toFixed(1) : Math.round(p * 100)}%`;

function boxArt() {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 100 100');
  s.innerHTML = '<rect x="18" y="38" width="64" height="48" rx="10" fill="#fff" opacity=".95"/>'
    + '<rect x="12" y="26" width="76" height="20" rx="8" fill="#fff"/>'
    + '<rect x="44" y="26" width="12" height="60" fill="#17133f" opacity=".85"/>'
    + '<path d="M50 26 C36 6 22 16 34 26 Z M50 26 C64 6 78 16 66 26 Z" fill="#fff"/>';
  return s;
}

function reveal({ id, duplicate, refund }) {
  const r = rarityOf(id);
  sfx(['epic', 'legendary'].includes(r.id) ? 'win' : 'reveal');
  return modal((close) => {
    const card = blookCard(id, { big: true });
    card.classList.add('is-flip');
    return [h('div', { class: `reveal r-${r.id}` },
      h('div', { class: 'reveal-burst', style: { '--rc': r.colour } }),
      card,
      h('h2', { style: { color: r.colour } }, `${r.name}!`),
      duplicate
        ? h('p', {}, 'You already had this one. ', h('b', {}, `+${refund} coins`), ' back.')
        : h('p', {}, h('b', {}, 'New blook!'), ' It is yours to use in games.'),
      h('button', { class: 'btn btn-main btn-block', onclick: () => close() }, 'Nice'))];
  });
}

/* ------------------------------------------------------------- collection */

function collection() {
  const m = progress.me();
  const have = BLOOKS.filter((b) => progress.owns(b.id)).length;
  const groups = RARITIES.slice().reverse().map((r) => {
    const list = BLOOKS.filter((b) => b.rarity === r.id);
    return h('div', { class: 'stack', style: { gap: '8px' } },
      h('h3', { style: { color: r.colour } }, `${r.name} · ${list.filter((b) => progress.owns(b.id)).length}/${list.length}`),
      h('div', { class: 'card-grid' }, ...list.map((b) => blookCard(b.id, {
        owned: progress.owns(b.id),
        count: m.owned[b.id] || 0,
        onclick: progress.owns(b.id) ? () => useBlook(b.id) : null,
      }))));
  });
  return h('section', { class: 'stack' },
    h('div', { class: 'row spread' }, h('h2', {}, 'Collection'), h('span', { class: 'pill' }, `${have} of ${BLOOKS.length}`)),
    h('p', { class: 'muted', style: { margin: 0 } }, 'Tap a blook you own to make it yours in games.'),
    ...groups);
}

async function useBlook(id) {
  try { await updateProfile({ blook: id }); sfx('pick'); toast(`${blookName(id, nameMap())} is now your blook`, 'ok'); } catch (err) { toast(err.message, 'bad'); }
}

/* ---------------------------------------------------------------- customs */

function customs(redraw) {
  const m = progress.me();
  const open = progress.customSlots();
  return h('section', { class: 'stack' },
    h('div', { class: 'row spread' }, h('h2', {}, 'Custom blooks'), h('span', { class: 'pill' }, `${m.customs.length} of 3`)),
    h('p', { class: 'muted', style: { margin: 0 } }, 'Build your own blook. You get three, unlocked at levels 3, 6 and 10. Custom blooks count as legendary.'),
    h('div', { class: 'card-grid' }, ...[0, 1, 2].map((slot) => {
      const id = m.customs[slot];
      if (slot >= open) {
        return h('div', { class: 'bcard is-slot is-locked' }, icon('lock', { size: 30 }), h('b', {}, `Level ${progress.CUSTOM_SLOTS[slot]}`));
      }
      if (!id) {
        return h('button', { class: 'bcard is-slot', onclick: () => builder(slot, null, redraw) }, icon('plus', { size: 30 }), h('b', {}, 'Make one'));
      }
      const card = blookCard(id, { onclick: () => builder(slot, id, redraw) });
      return h('div', { class: 'stack', style: { gap: '6px' } }, card,
        h('button', { class: 'btn btn-sm', onclick: () => useBlook(id) }, 'Use'));
    })));
}

function builder(slot, existing, redraw) {
  const lvl = progress.levelOf(progress.me().xp);
  const parts = existing ? customParts(existing) : { body: 0, eyes: 0, mouth: 0, top: 0, extra: 0 };
  return modal((close) => {
    const preview = h('div', { class: 'builder-preview' });
    const rows = h('div', { class: 'stack', style: { gap: '12px' } });
    const draw = () => {
      fill(preview, blook(customId(parts)));
      fill(rows, ...Object.entries(CUSTOM_PARTS).map(([part, options]) => h('div', { class: 'stack', style: { gap: '6px' } },
        h('b', {}, PART_NAMES[part]),
        h('div', { class: 'row', style: { gap: '6px' } }, ...options.map((opt, i) => {
          const need = progress.partLevel(part, i);
          const locked = need > lvl;
          const on = parts[part] === i;
          const label = part === 'body'
            ? h('span', { class: 'swatch', style: { background: opt[0] } })
            : h('span', {}, String(opt).replace(/^none$/, 'None'));
          return h('button', {
            type: 'button', class: `part-btn${on ? ' is-on' : ''}${locked ? ' is-locked' : ''}`, disabled: locked,
            title: locked ? `Unlocks at level ${need}` : '', 'aria-pressed': String(on),
            onclick: () => { parts[part] = i; sfx('pick'); draw(); },
          }, label, locked ? h('small', {}, `Lv ${need}`) : null);
        })))));
    };
    draw();
    const save = h('button', { class: 'btn btn-main' }, 'Save blook');
    save.addEventListener('click', busy(save, async () => {
      try { await progress.saveCustom(slot, customId(parts)); toast('Custom blook saved', 'ok'); close(); redraw(); } catch (err) { toast(err.message, 'bad'); }
    }));
    return [h('h2', {}, `Custom blook ${slot + 1}`), preview, rows,
      h('div', { class: 'row end' }, h('button', { class: 'btn', onclick: () => close() }, 'Cancel'), save)];
  }, { wide: true });
}

/* ------------------------------------------------------------------ levels */

function roadmap() {
  const lvl = progress.levelOf(progress.me().xp);
  const items = [];
  for (let l = 1; l <= 12; l++) {
    const what = progress.unlocksAt(l);
    if (!what.length) continue;
    items.push(h('li', { class: l <= lvl ? 'is-done' : '' },
      h('span', { class: 'lv' }, String(l)),
      h('div', {}, ...what.map((t) => h('div', {}, t))),
      l <= lvl ? icon('check', { size: 18 }) : h('small', { class: 'muted' }, `${progress.xpFor(l)} XP`)));
  }
  return h('section', { class: 'stack' }, h('h2', {}, 'Levels'), h('ol', { class: 'roadmap' }, ...items));
}

/* -------------------------------------------------------------------- page */

export default async function Blooks() {
  pageTitle('Blooks');
  if (!signedIn()) {
    return h('div', { class: 'page mid' }, h('div', { class: 'card center stack', style: { justifyItems: 'center' } },
      h('div', { class: 'row', style: { justifyContent: 'center' } }, ...['dragon', 'unicorn', 'astronaut'].map((id) => blookCard(id))),
      h('h1', {}, 'Collect blooks'),
      h('p', { class: 'muted' }, 'Earn coins and XP by playing, open boxes for blooks from common to legendary, and build up to three custom blooks as you level up.'),
      h('div', { class: 'row', style: { justifyContent: 'center' } },
        h('a', { class: 'btn btn-main btn-lg', href: '/signup?next=/blooks' }, 'Sign up free'),
        h('a', { class: 'btn btn-lg', href: '/login?next=/blooks' }, 'Sign in'))));
  }
  await whenProfile();
  const root = h('div', { class: 'page stack', style: { gap: '22px' } });
  const draw = () => fill(root,
    h('h1', {}, 'Blooks'),
    header(),
    h('h2', {}, 'Boxes'),
    boxes(draw),
    customs(draw),
    collection(),
    roadmap());
  draw();
  return root;
}
