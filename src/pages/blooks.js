// blooks.js — your blook cards: open boxes, see the collection, build up to
// three custom blooks, and see what each level unlocks.

import { h, fill } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { blook, BLOOKS, RARITIES, rarityOf, blookName, CUSTOM_PARTS, PART_NAMES, customId, customParts } from '../ui/blooks.js';
import { modal, busy, toast } from '../ui/kit.js';
import { signedIn, whenProfile, updateProfile } from '../services/session.js';
import * as progress from '../services/progress.js';
import { myPlan, proNow } from '../services/plan.js';
import { sfx } from '../game/sound.js';
import { celebrate } from '../ui/confetti.js';
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

/** The chance of each rarity from this box, given what is in its pool. */
function boxOdds(box) {
  const tiers = RARITIES.filter((r) => box.pool.some((id) => rarityOf(id).id === r.id));
  const total = tiers.reduce((n, r) => n + r.chance, 0);
  return tiers.map((r) => [r, box.luck === 1 ? r.chance / total : luckyChance(r.id, box.luck)]);
}

function daysLeft(ends) {
  const d = Math.ceil((ends - Date.now()) / 86400000);
  return d <= 1 ? 'Last day!' : `${d} days left`;
}

function boxes(redraw) {
  const m = progress.me();
  const lvl = progress.levelOf(m.xp);
  // limited editions first while they last; closed ones disappear
  const list = progress.BOXES.filter((b) => progress.boxOpen(b)).sort((x, y) => Number(Boolean(y.limited)) - Number(Boolean(x.limited)));
  return h('div', { class: 'boxes' }, ...list.map((box) => {
    const locked = lvl < box.level;
    const btn = h('button', { class: 'btn btn-main', disabled: locked || m.coins < box.price }, coin(), String(box.price));
    btn.addEventListener('click', busy(btn, async () => {
      try {
        let again = true;
        while (again) {
          const res = await progress.openBox(box.id);
          again = (await reveal(res, box)) === 'again';
        }
        redraw();
      } catch (err) { toast(err.message, 'bad'); }
    }));
    const odds = boxOdds(box).map(([r, p]) => h('li', {}, h('i', { style: { background: r.colour } }), `${r.name} ${fmtPct(p)}`));
    const peek = h('div', { class: 'box-peek', 'aria-label': 'Blooks in this box' },
      ...box.pool.slice().sort((x, y) => ORDER.indexOf(rarityOf(y).id) - ORDER.indexOf(rarityOf(x).id)).slice(0, 6)
        .map((id) => { const el = blook(id); if (!progress.owns(id)) el.classList.add('is-unknown'); return el; }));
    return h('div', { class: `box-card${locked ? ' is-locked' : ''}${box.limited ? ' is-limited' : ''}`, style: { background: box.colour } },
      box.limited ? h('div', { class: 'snow', 'aria-hidden': 'true' }) : null,
      box.limited ? h('span', { class: 'limited-tag' }, icon('star', { size: 12 }), box.blurb, ' · ', daysLeft(box.ends)) : null,
      h('div', { class: 'box-art' }, boxArt(box.limited)),
      h('h3', {}, box.name),
      peek,
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

function boxArt(winter = false) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 100 100');
  const ribbon = winter ? '#e2384d' : '#17133f';
  s.innerHTML = '<rect x="18" y="38" width="64" height="48" rx="10" fill="#fff" opacity=".95"/>'
    + '<rect x="12" y="26" width="76" height="20" rx="8" fill="#fff"/>'
    + `<rect x="44" y="26" width="12" height="60" fill="${ribbon}" opacity=".9"/>`
    + `<path d="M50 26 C36 6 22 16 34 26 Z M50 26 C64 6 78 16 66 26 Z" fill="${winter ? '#e2384d' : '#fff'}"/>`
    + (winter ? '<path d="M14 28 q6 -6 12 0 q6 -6 12 0 q6 -6 12 0 q6 -6 12 0 q6 -6 12 0 q6 -6 12 0" fill="none" stroke="#dff1ff" stroke-width="5" stroke-linecap="round"/><circle cx="72" cy="62" r="5" fill="#19a35b"/><circle cx="64" cy="70" r="4" fill="#ffcd1f"/>' : '');
  return s;
}

/**
 * Opening a box: tap it three times. Each tap shakes it harder and the glow
 * climbs the rarity ladder towards what is inside, so a legendary teases you
 * all the way up. Then it bursts, and the card flips out.
 * Resolves 'again' to open another of the same box, or nothing when done.
 */
function reveal({ id, duplicate, refund }, box) {
  const r = rarityOf(id);
  const rank = ORDER.indexOf(r.id);
  const big = rank >= 3;
  const calm = document.documentElement.dataset.motion === 'calm';
  // the glows shown on taps 1, 2 and 3: they never go past the real rarity
  const ladder = [0, Math.min(rank, 1 + Math.floor(rank / 2)), rank].map((i) => RARITIES[Math.max(0, i)]);
  return new Promise((resolve) => {
    let taps = 0;
    let done = false;
    const art = h('div', { class: 'ub-box' }, boxArt(Boolean(box.limited)));
    const glow = h('div', { class: 'ub-glow' });
    const hint = h('p', { class: 'ub-hint' }, 'Tap the box!');
    const dots = h('div', { class: 'ub-dots' }, h('i'), h('i'), h('i'));
    const stage = h('div', { class: 'ub-stage' }, glow, art);
    const skip = h('button', { class: 'btn btn-sm ub-skip' }, 'Skip');
    const root = h('div', { class: `ub-root${calm ? ' ub-calm' : ''}`, role: 'dialog', 'aria-label': `Opening the ${box.name}` },
      h('div', { class: 'ub-rays' }), h('h2', { class: 'ub-name' }, box.name), stage, dots, hint, skip);
    document.body.append(root);

    const finish = (value) => {
      if (done) return;
      done = true;
      document.removeEventListener('keydown', key);
      root.classList.add('ub-out');
      setTimeout(() => { root.remove(); resolve(value); }, 250);
    };
    const key = (e) => {
      if (e.key === 'Escape') finish();
      else if ((e.key === ' ' || e.key === 'Enter') && taps < 3) { e.preventDefault(); tap(); }
    };
    document.addEventListener('keydown', key);

    const wait = (ms) => new Promise((res) => setTimeout(res, calm ? Math.min(ms, 30) : ms));
    const say = (text, cls = '') => { fill(hint, text); hint.className = `ub-hint ${cls}`; };

    async function burst() {
      sfx('boom');
      root.style.setProperty('--rc', ladder[0].colour);
      root.classList.add('ub-burst');
      say(''); dots.remove(); skip.remove();
      sparks(ladder[0].colour);
      await wait(420);

      // 1. a mystery card: just a black shadow, spinning, while the drums roll
      const shadow = blook(id);
      shadow.classList.add('is-unknown');
      const mystery = h('div', { class: 'bcard is-big ub-mystery' }, h('div', { class: 'ub-q' }, '?'), h('div', { class: 'bcard-art' }, shadow));
      stage.replaceChildren(h('div', { class: 'ub-shine' }), mystery);
      say('Who is it…?');
      for (let i = 0; i < 6; i++) { sfx('tick'); await wait(110); }

      // 2. the surprise: rare or better can start looking ordinary, then upgrade
      const fakeOut = rank >= 2 && (rank === 4 || Math.random() < 0.6);
      if (fakeOut) {
        mystery.style.setProperty('--rc', RARITIES[0].colour);
        root.style.setProperty('--rc', RARITIES[0].colour);
        say('Hmm, just a common…');
        await wait(900);
        say('WAIT!', 'ub-wait');
        sfx('tagged');
        mystery.classList.add('ub-crack');
        await wait(600);
        for (let i = 1; i <= rank; i++) {
          const c = RARITIES[i].colour;
          mystery.style.setProperty('--rc', c);
          root.style.setProperty('--rc', c);
          say(`${RARITIES[i].name}…`, 'ub-up');
          sfx(i === rank ? 'go' : 'jump');
          sparks(c);
          await wait(i === rank ? 500 : 420);
        }
      }

      // 3. legendary: lights out, then the letters slam in one by one
      if (rank === 4) {
        root.classList.add('ub-dark');
        say('');
        const word = h('div', { class: 'ub-word', style: { color: r.colour } });
        root.append(word);
        for (const ch of 'LEGENDARY') {
          word.append(h('span', {}, ch));
          sfx('drum');
          await wait(150);
        }
        await wait(500);
        word.remove();
        root.classList.remove('ub-dark');
      }

      // 4. the reveal
      root.style.setProperty('--rc', r.colour);
      root.classList.add(`ub-${r.id}`);
      const card = blookCard(id, { big: true });
      card.classList.add('ub-card', `ub-card-${r.id}`);
      if (rank >= 2) card.append(h('i', { class: 'ub-holo', 'aria-hidden': 'true' }));
      // hold it in your hand: the card tilts towards the finger or mouse
      const tilt = (e) => {
        const b = card.getBoundingClientRect();
        const px = ((e.touches ? e.touches[0].clientX : e.clientX) - b.left) / b.width - 0.5;
        const py = ((e.touches ? e.touches[0].clientY : e.clientY) - b.top) / b.height - 0.5;
        card.style.setProperty('--rx', `${(-py * 18).toFixed(1)}deg`);
        card.style.setProperty('--ry', `${(px * 22).toFixed(1)}deg`);
        card.style.setProperty('--hx', `${Math.round((px + 0.5) * 360)}deg`);
      };
      root.addEventListener('pointermove', tilt);
      root.addEventListener('touchmove', tilt, { passive: true });
      root.classList.add('ub-revealed');
      root.append(h('div', { class: 'ub-beams', 'aria-hidden': 'true' }, ...Array.from({ length: 12 }, (_, k) => h('i', { style: { '--k': k } }))),
        h('div', { class: 'ub-stars', 'aria-hidden': 'true' }, ...Array.from({ length: 16 }, (_, k) => h('i', { style: { '--k': k } }))));
      sparks(r.colour, 22);
      const again = progress.me().coins >= box.price && progress.boxOpen(box)
        ? h('button', { class: 'btn btn-main', onclick: () => finish('again') }, 'Open another', coin(), String(box.price)) : null;
      stage.replaceChildren(h('div', { class: 'ub-shine' }), h('div', { class: 'ub-ring' }), card);
      say('');
      root.append(h('div', { class: 'ub-result' },
        h('h2', { class: 'ub-rarity', style: { color: r.colour } }, `${r.name}!`),
        duplicate
          ? h('p', {}, `${blookName(id)} again. `, h('b', {}, `+${refund} coins`), ' back.')
          : h('p', {}, h('span', { class: 'ub-new' }, 'NEW'), ` ${blookName(id)} is yours!`),
        h('div', { class: 'row', style: { justifyContent: 'center' } },
          again, h('button', { class: `btn${again ? '' : ' btn-main'}`, onclick: () => finish() }, 'Done'))));
      sfx(big ? 'win' : rank >= 2 ? 'checkpoint' : 'reveal');
      if (duplicate) coinRain(Math.min(24, 4 + refund));
      if (!calm && rank >= 2) setTimeout(() => celebrate([r.colour, '#ffffff', '#ffcd1f']), 250);
      if (!calm && rank === 4) { setTimeout(() => celebrate([r.colour, '#ffcd1f']), 1100); coinRain(30); }
    }

    function sparks(colour, n = 14) {
      if (calm) return;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const d = 140 + Math.random() * 60;
        const sp = h('i', { class: 'ub-spark', style: { '--dx': `${Math.cos(a) * d}px`, '--dy': `${Math.sin(a) * d}px`, background: i % 2 ? colour : '#fff' } });
        stage.append(sp);
        setTimeout(() => sp.remove(), 800);
      }
    }

    function coinRain(n) {
      if (calm) return;
      for (let i = 0; i < n; i++) {
        const c = h('span', { class: 'coin ub-coin', style: { left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 0.8}s`, animationDuration: `${1.2 + Math.random()}s` } }, 'Q');
        root.append(c);
        setTimeout(() => c.remove(), 2600);
      }
      sfx('coin');
    }

    function tap() {
      if (done || taps >= 3) return;
      taps += 1;
      const tier = ladder[taps - 1];
      dots.children[taps - 1].classList.add('is-on');
      dots.children[taps - 1].style.background = tier.colour;
      glow.style.background = `radial-gradient(circle, ${tier.colour} 0%, transparent 65%)`;
      glow.style.opacity = String(0.35 + taps * 0.2);
      art.classList.remove('ub-shake1', 'ub-shake2', 'ub-shake3');
      void art.offsetWidth;
      art.classList.add(`ub-shake${taps}`);
      sfx(taps === 1 ? 'tap' : taps === 2 ? 'drum' : 'boost');
      fill(hint, taps === 1 ? 'Again!' : taps === 2 ? (rank >= 3 ? 'Something big is in there…' : 'One more!') : '');
      if (taps === 3) setTimeout(() => { burst().catch((e) => { console.error(e); finish(); }); }, calm ? 0 : 450);
    }
    stage.addEventListener('click', tap);
    skip.onclick = () => { while (taps < 2) { taps += 1; dots.children[taps - 1].classList.add('is-on'); } taps = 2; tap(); };
  });
}

/* ------------------------------------------------------------- collection */

// the catalog, pack by pack: every blook there is, black shadows for the
// ones not found yet
const SETS = [['Flags', 'Flags (exclusive)'], ['Winter', 'Winter (limited edition)'], ['Pets', 'Pets'], ['Farm', 'Farm'], ['Wild', 'Wild'], ['Snacks', 'Snacks'], ['Space', 'Space'], ['Magic', 'Magic']];

function catalog() {
  const m = progress.me();
  const have = BLOOKS.filter((b) => progress.owns(b.id)).length;
  const groups = SETS.map(([set, label]) => {
    const list = BLOOKS.filter((b) => b.set === set)
      .sort((x, y) => ORDER.indexOf(rarityOf(x.id).id) - ORDER.indexOf(rarityOf(y.id).id));
    const got = list.filter((b) => progress.owns(b.id)).length;
    return h('div', { class: 'stack', style: { gap: '8px' } },
      h('h3', { class: 'row', style: { gap: '8px' } }, label, h('span', { class: `pill${got === list.length ? ' pill-ok' : ''}` }, `${got}/${list.length}`)),
      h('div', { class: 'card-grid' }, ...list.map((b) => blookCard(b.id, {
        owned: progress.owns(b.id),
        count: m.owned[b.id] || 0,
        onclick: progress.owns(b.id) ? () => useBlook(b.id) : null,
      }))));
  });
  return h('section', { class: 'stack' },
    h('div', { class: 'row spread' }, h('h2', {}, 'Catalog'), h('span', { class: 'pill' }, `${have} of ${BLOOKS.length} found`)),
    h('div', { class: 'xp-bar' }, h('i', { style: { width: `${Math.round((have / BLOOKS.length) * 100)}%` } })),
    h('p', { class: 'muted', style: { margin: 0 } }, 'Every blook in Quickzy. Black shadows are the ones you have not found yet. Tap one you own to use it in games.'),
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
          const locked = need > lvl && !proNow();
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
  await myPlan();     // so Pro perks (all custom slots, flags) are known before drawing
  const root = h('div', { class: 'page stack', style: { gap: '22px' } });
  const draw = () => fill(root,
    h('h1', {}, 'Blooks'),
    header(),
    h('h2', {}, 'Boxes'),
    boxes(draw),
    customs(draw),
    catalog(),
    roadmap());
  draw();
  return root;
}
