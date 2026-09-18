// build-playground.mjs — bundles the React lesson component into static files
// the site can serve, so the preview needs no build step at deploy time.
//
//   node scripts/build-playground.mjs
//
// Output: playground/app.js, playground/app.css, playground/index.html

import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'playground');
mkdirSync(out, { recursive: true });

await build({
  entryPoints: [join(root, 'react/preview.jsx')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020'],
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"' },
  outfile: join(out, 'app.js'),
  logLevel: 'info',
});

execFileSync(
  join(root, 'node_modules/.bin/tailwindcss'),
  ['-i', join(root, 'react/preview.css'), '-o', join(out, 'app.css'), '--minify'],
  { stdio: 'inherit', cwd: root },
);

writeFileSync(
  join(out, 'index.html'),
  `<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>AkylduuKodo — interactive lesson</title>
    <meta name="description" content="A step-by-step JavaScript lesson: editable code, a real runner, and a console that shows exactly what your code printed." />
    <meta name="theme-color" content="#090D16" />
    <link rel="icon" href="../icon.svg" type="image/svg+xml" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" />
    <link rel="stylesheet" href="app.css" />
  </head>
  <body>
    <div id="root"></div>
    <script src="app.js" defer></script>
  </body>
</html>
`,
);

console.log('playground built');
