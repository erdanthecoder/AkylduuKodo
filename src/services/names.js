// names.js — keeping nicknames kind, and making up friendly ones.
//
// A host can switch on "random names" and nobody types a name at all, which is
// the safest setting for a young class. When people do type one, it is
// normalised (leetspeak, accents, stretched letters, spacing) and checked
// against a blocklist. The list is stored ROT13-encoded so this file is not a
// wall of slurs to read. No filter is perfect, so the host can also remove
// anyone from the lobby with one tap.

const ROT = (s) => s.replace(/[a-z]/g, (c) => String.fromCharCode((c.charCodeAt(0) - 97 + 13) % 26 + 97));

const LIST = {
  anywhere: ['shpx', 'fuvg', 'ovgpu', 'phag', 'qvpx', 'pbpx', 'chffl', 'nffubyr', 'onfgneq', 'fyhg', 'juber', 'avttre',
    'avttn', 'snttbg', 'ergneq', 'encr', 'cbea', 'cravf', 'intvan', 'obbo', 'gvgf', 'anmv', 'uvgyre', 'wvmm', 'qvyqb',
    'jnax', 'gjng', 'cevpx', 'obyybpxf', 'cvff', 'nany', 'ubeal', 'ahqr', 'anxrq', 'zbyrfg', 'crqb', 'puvax', 'fcvp',
    'xvxr', 'genaal', 'qlxr', 'pbba', 'jrgonpx', 'tbbx', 'cnxv', 'xvyylbhefrys', 'fhvpvqr', 'zbgures', 'ohyyfu',
    'qhzonff', 'wnpxnff', 'nefr', 'frzra', 'betnfz', 'rerpg', 'pbaqbz', 'uragnv', 'kkk', 'zvys', 'fgsh', 'jgs', 'frkl',
    'snc', 'gubg', 'phpx', 'vapry', 'xxx', 'vfvf', 'greebevfg', 'pbpnvar', 'urebva', 'zrgu', 'jrrq'],
  // only as a whole word, because they hide inside innocent ones (class, cumin)
  whole: ['nff', 'phz', 'snt', 'frk', 'xlf', 'gvg', 'ubr', 'ub', 'qvr', 'xvyy', 'avt', 'spx', 'sx', 'sh', 'qpx', 'pbx',
    'cavf', 'int', 'ohgg'],
};

const LEET = { 0: 'o', 1: 'i', 2: 'z', 3: 'e', 4: 'a', 5: 's', 6: 'g', 7: 't', 8: 'b', 9: 'g', '@': 'a', $: 's', '!': 'i', '|': 'l', '+': 't' };

/** Lowercase letters only, with accents and leetspeak undone. */
export function letters(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[0-9@$!|+]/g, (c) => LEET[c] || c)
    .replace(/[^a-z]/g, '');
}

/** "fuuuuck" -> "fuck": runs of one letter become one. */
const squash = (s) => s.replace(/(.)\1+/g, '$1');

// Each blocked word is kept in two forms. The squashed form catches stretched
// spellings, but only when it is long enough to mean something: "kkk" squashes
// to "k", and matching "k" anywhere would block every name with a k in it.
const ANYWHERE = LIST.anywhere.map(ROT).map((w) => {
  const plain = letters(w);
  const short = squash(plain);
  return { plain, squashed: short.length >= 4 ? short : null };
});

const WHOLE = new Set();
for (const w of LIST.whole.map(ROT)) {
  const plain = letters(w);
  WHOLE.add(plain);
  // "ass" squashes to "as", an ordinary word, so short forms are left out
  const short = squash(plain);
  if (short.length >= 3) WHOLE.add(short);
}

// real names and places that happen to contain a blocked word
const ALLOW = new Set(['scunthorpe', 'dickens', 'dickinson', 'dickson', 'matsushita', 'shiitake', 'hancock', 'peacock',
  'babcock', 'hitchcock', 'cockburn', 'penistone', 'sussex', 'essex', 'middlesex', 'cassandra', 'cassie']);

export function isClean(text) {
  const plain = letters(text);
  if (!plain) return true;
  // an allowed word is set aside whole; everything else is still checked,
  // so "Dickens" passes and "Dickens dickhead" does not
  const kept = String(text).split(/([^A-Za-z]+)/).map((w) => (ALLOW.has(w.toLowerCase()) ? ' ' : w)).join('');
  return isCleanWord(kept);
}

function isCleanWord(text) {
  const plain = letters(text);
  if (!plain) return true;
  const short = squash(plain);
  for (const bad of ANYWHERE) {
    if (plain.includes(bad.plain)) return false;
    if (bad.squashed && short.includes(bad.squashed)) return false;
  }
  // whole words keep the spacing the person typed, so "class" is fine and
  // "my ass" is not; the whole name joined up catches "k y s"
  const words = String(text).toLowerCase().split(/[^a-z0-9@$!|+]+/).filter(Boolean);
  for (const w of [...words, String(text)]) {
    const wp = letters(w);
    if (WHOLE.has(wp) || WHOLE.has(squash(wp))) return false;
  }
  return true;
}

/** Trim, drop invisible and control characters, squash spaces. */
export function cleanName(text, max = 16) {
  return String(text || '')
    .replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁠-⁯﻿]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

const FIRST = ['Brave', 'Zippy', 'Cosmic', 'Sunny', 'Witty', 'Mighty', 'Lucky', 'Bouncy', 'Swift', 'Jolly',
  'Clever', 'Fuzzy', 'Sparky', 'Turbo', 'Chill', 'Daring', 'Epic', 'Gentle', 'Happy', 'Nimble',
  'Rapid', 'Snappy', 'Stellar', 'Super', 'Tiny', 'Wild', 'Zesty', 'Breezy', 'Dizzy', 'Plucky'];
const SECOND = ['Otter', 'Comet', 'Panda', 'Rocket', 'Falcon', 'Pickle', 'Waffle', 'Nugget', 'Penguin', 'Koala',
  'Dragon', 'Muffin', 'Pixel', 'Tiger', 'Noodle', 'Badger', 'Sprout', 'Biscuit', 'Gecko', 'Lemur',
  'Nova', 'Puffin', 'Quokka', 'Taco', 'Yeti', 'Zebra', 'Bean', 'Cactus', 'Dumpling', 'Meteor'];

export function randomName(taken = new Set()) {
  for (let i = 0; i < 60; i++) {
    const n = `${FIRST[Math.floor(Math.random() * FIRST.length)]}${SECOND[Math.floor(Math.random() * SECOND.length)]}`;
    if (!taken.has(n.toLowerCase())) return n;
  }
  return `Player${Math.floor(100 + Math.random() * 900)}`;
}
