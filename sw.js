// Rugby Referee Coach – offline cache
const CACHE = 'rrc-v11';
const LOCAL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
const CDN = [
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(LOCAL);
    await Promise.all(CDN.map(async u => { try { const r = await fetch(u, {mode: 'no-cors'}); await c.put(u, r); } catch (err) {} }));
    self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === location.origin;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    if (same) {
      // network first for the app itself (so updates arrive), cache when offline
      try { const r = await fetch(req); if (r.ok) c.put(req, r.clone()); return r; }
      catch (err) { return (await c.match(req, {ignoreSearch: true})) || (await c.match('./index.html')); }
    }
    // libraries and fonts: cache first
    const hit = await c.match(req.url);
    if (hit) return hit;
    try { const r = await fetch(req); c.put(req.url, r.clone()); return r; } catch (err) { return Response.error(); }
  })());
});
