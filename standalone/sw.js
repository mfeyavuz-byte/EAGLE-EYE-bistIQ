// EAGLE EYE: bistIQ SW — v106 (FIX: gist/api.github.com artik cache'lenmiyor → pozlar hard-refresh'siz guncel)
const CACHE = 'feysbot-v106';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  // API çağrıları cache'lenmez (gist/api.github.com DAHİL — yoksa pozlar eski cache'ten gelir)
  if (u.host.includes('api.github.com') || u.host.includes('githubusercontent.com') ||
      u.host.includes('yahoo.com') || u.host.includes('emailjs.com') ||
      u.host.includes('binance.com') || u.host.includes('anthropic.com') ||
      u.host.includes('isyatirim') || u.host.includes('allorigins') ||
      u.host.includes('corsproxy') || u.host.includes('codetabs') ||
      u.host.includes('cors.lol') || u.host.includes('cors.eu') ||
      u.host.includes('yacdn') || u.host.includes('unpkg.com')) {
    return;
  }
  // HTML/manifest/sw: NETWORK-FIRST → her zaman güncel sürüm
  if (e.request.mode === 'navigate' || u.pathname === '/' ||
      u.pathname.endsWith('.html') || u.pathname.endsWith('manifest.json') || u.pathname.endsWith('sw.js')) {
    e.respondWith(
      fetch(e.request).then(r => {
        if (r.ok) { const c = r.clone(); caches.open(CACHE).then(cc => cc.put(e.request, c)).catch(()=>{}); }
        return r;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  // PNG, ikonlar: CACHE-FIRST
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request).then(r => {
      if (r.ok && e.request.method === 'GET') {
        const c = r.clone();
        caches.open(CACHE).then(cc => cc.put(e.request, c)).catch(()=>{});
      }
      return r;
    }))
  );
});
