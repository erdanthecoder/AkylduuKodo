// check.mjs — every named import must exist as an export of its module,
// and every icon name used must exist. Catches typos no browser run would
// reach until that exact screen opens.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

const root = resolve(dirname(new URL(import.meta.url).pathname), '..');
const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p); else if (p.endsWith('.js')) files.push(p);
  }
})(join(root, 'src'));

const exportsOf = new Map();
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  const names = new Set();
  for (const m of src.matchAll(/export\s+(?:async\s+)?(?:function\*?|const|let|class)\s+([A-Za-z_$][\w$]*)/g)) names.add(m[1]);
  for (const m of src.matchAll(/export\s*\{([^}]*)\}/g)) for (const n of m[1].split(',')) { const k = n.trim().split(/\s+as\s+/).pop(); if (k) names.add(k); }
  if (/export\s+default/.test(src)) names.add('default');
  exportsOf.set(f, names);
}

let bad = 0;
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(/import\s*\{([^}]*)\}\s*from\s*'([^']+)'/g)) {
    if (!m[2].startsWith('.')) continue;
    const target = resolve(dirname(f), m[2]);
    const ex = exportsOf.get(target);
    if (!ex) { console.log(`${f}: missing module ${m[2]}`); bad++; continue; }
    for (const n of m[1].split(',')) {
      const name = n.trim().split(/\s+as\s+/)[0];
      if (name && !ex.has(name)) { console.log(`${f.replace(root, '')}: '${name}' is not exported by ${m[2]}`); bad++; }
    }
  }
  for (const m of src.matchAll(/import\(\s*'([^']+)'\s*\)/g)) {
    if (!exportsOf.has(resolve(dirname(f), m[1]))) { console.log(`${f}: dynamic import missing ${m[1]}`); bad++; }
  }
}

// icons
const iconsSrc = readFileSync(join(root, 'src/ui/icons.js'), 'utf8');
const known = new Set([...iconsSrc.matchAll(/^\s{2}([a-zA-Z]+):/gm)].map((m) => m[1]));
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(/\bicon\('([a-zA-Z]+)'/g)) if (!known.has(m[1])) { console.log(`${f.replace(root, '')}: unknown icon '${m[1]}'`); bad++; }
}

// every arcade mode implements the same interface
for (const id of ['lasertag', 'robotrun', 'spacecraft', 'obby']) {
  const ex = exportsOf.get(join(root, `src/game/modes/${id}.js`)) || new Set();
  for (const need of ['createHost', 'mountPlayer', 'mountScreen']) if (!ex.has(need)) { console.log(`mode ${id} lacks ${need}`); bad++; }
}

console.log(bad ? `${bad} problem(s)` : `ok: ${files.length} modules, imports and icons all resolve`);
process.exit(bad ? 1 : 0);
