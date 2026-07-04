/* DMOL service worker — cache-first para uso offline */
const CACHE = 'dmol-v4';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './stimuli/manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(ASSETS);
    // precache os estímulos listados no manifest (imagens MST), para uso offline
    try {
      const r = await fetch('./stimuli/manifest.json', { cache: 'no-cache' });
      if (r.ok) {
        const m = await r.json();
        const imgs = [];
        (m.pairs || []).forEach((p) => { if (p.a) imgs.push('./stimuli/' + p.a); if (p.b) imgs.push('./stimuli/' + p.b); });
        await Promise.allSettled(imgs.map((u) => c.add(u)));
      }
    } catch (e) { /* sem manifest → app roda com estímulos procedurais */ }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error()))
  );
});
