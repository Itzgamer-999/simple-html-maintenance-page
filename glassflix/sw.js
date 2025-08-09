const STATIC_CACHE = 'static-v1';
const IMG_CACHE = 'img-v1';
const STATIC_ASSETS = [
  '/', '/index.html', '/search.html', '/details.html', '/player.html', '/my-list.html', '/admin.html', '/status.html', '/maintenance.html', '/404.html', '/styles/theme.css', '/styles/glass.css', '/styles/layout.css', '/styles/animations.css', '/assets/logo.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(STATIC_CACHE).then(c => c.addAll(STATIC_ASSETS)));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => ![STATIC_CACHE, IMG_CACHE].includes(k)).map(k => caches.delete(k)))));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // App shell
  if (url.origin === location.origin) {
    e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request)));
    return;
  }
  // TMDB images
  if (url.hostname.endsWith('image.tmdb.org')) {
    e.respondWith((async () => {
      const cache = await caches.open(IMG_CACHE);
      const cached = await cache.match(e.request);
      if (cached) return cached;
      const res = await fetch(e.request);
      cache.put(e.request, res.clone());
      return res;
    })());
  }
});