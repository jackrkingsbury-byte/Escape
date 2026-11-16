// Chess Lens service worker: offline app shell + engine, and the Android share target.
const VERSION = 'chesslens-v3';
const SHELL = [
  './', 'index.html', 'app.js', 'vision.js', 'engine.js', 'pieces.js', 'vendor/chess.js', 'model.bin',
  'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png',
  'engine/stockfish-17.1-lite-single-03e3232.js', 'engine/stockfish-17.1-lite-single-03e3232.wasm',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('chesslens-v') && k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method === 'POST' && url.pathname.endsWith('/share-target')) {
    e.respondWith((async () => {
      const form = await e.request.formData();
      const file = form.get('image');
      if (file) {
        const c = await caches.open('chesslens-share');
        await c.put('shared-image', new Response(file, { headers: { 'content-type': file.type || 'image/png' } }));
      }
      return Response.redirect('./?shared=1', 303);
    })());
    return;
  }
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.endsWith('.apk')) return; // the Android download goes straight to the network
  // Network first for the app shell and model (fresh updates), cache fallback offline.
  // Engine files have a content hash in their name, so they're served cache first.
  const big = url.pathname.includes('/engine/');
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    if (big) {
      const hit = await cache.match(e.request);
      if (hit) return hit;
    }
    try {
      const res = await fetch(e.request);
      if (res.ok && res.type === 'basic') cache.put(e.request, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(e.request, { ignoreSearch: true });
      if (hit) return hit;
      throw err;
    }
  })());
});
