// FeyBot Service Worker — offline destek
const CACHE = 'feybot-v12';
const ASSETS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  // API çağrılarını cache'leme — daima ağdan
  if (u.host.includes('yahoo.com') || u.host.includes('emailjs.com') ||
      u.host.includes('allorigins') || u.host.includes('corsproxy') ||
      u.host.includes('codetabs') || u.host.includes('cors.eu.org') ||
      u.host.includes('corsfix')) {
    return; // pas geç, browser direkt fetch yapsın
  }
  // Statik dosyalar: önce cache, sonra ağ (network fallback)
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request).then((r) => {
      if (r.ok && e.request.method === 'GET') {
        const clone = r.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone)).catch(() => {});
      }
      return r;
    }).catch(() => res))
  );
});
