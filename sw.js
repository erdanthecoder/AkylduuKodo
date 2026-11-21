// sw.js — lets Quickzy open like an app and work offline as far as it can.
// Always tries the network first (so updates show at once) and falls back
// to the last copy it saw. Live games need the internet; the app shell does not.
const CACHE = 'quickzy-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/index.html', '/manifest.webmanifest', '/assets/icon.svg', '/assets/icon-192.png'])).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;             // Firebase, fonts, three.js: the browser handles those
  if (url.pathname.startsWith('/__')) return;              // Firebase Hosting internals
  e.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {}); }
      return res;
    } catch {
      const hit = await caches.match(req);
      if (hit) return hit;
      // pages of the app all load the same shell
      if (req.mode === 'navigate') return (await caches.match('/index.html')) || (await caches.match('/'));
      return new Response('Offline', { status: 503, statusText: 'Offline' });
    }
  })());
});
