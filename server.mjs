// server.mjs — a local stand-in for Firebase Hosting, so what is seen here is
// what gets published: clean URLs, directory index files, and a fallback.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const ROOT = process.cwd();
const PORT = process.env.PORT || 5173;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2',
};

async function find(path) {
  const clean = normalize(path.split('?')[0]).replace(/^(\.\.[/\\])+/, '');
  const candidates = extname(clean)
    ? [clean]
    : [join(clean, 'index.html'), `${clean}.html`, clean];
  for (const candidate of candidates) {
    const full = join(ROOT, candidate);
    try {
      if ((await stat(full)).isFile()) return full;
    } catch { /* try the next shape */ }
  }
  return null;
}

createServer(async (req, res) => {
  let file = await find(decodeURIComponent(req.url));
  // Hosting rewrites anything unknown to the right single-page shell
  if (!file) {
    file = join(ROOT, req.url.startsWith('/forteachersonly') ? 'forteachersonly/index.html' : 'index.html');
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
}).listen(PORT, () => console.log(`Malika Study running at http://localhost:${PORT}`));
