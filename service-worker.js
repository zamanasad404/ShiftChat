
const CACHE_NAME = 'shiftstrong-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './onboard.html',
  './dashboard.html',
  './pricing.html',
  './about.html',
  './faq.html',
  './privacy.html',
  './terms.html',
  './contact.html',
  './checkout.html',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-128.png',
  './icons/icon-64.png',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
    event.respondWith(
      fetch(event.request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return resp;
      }).catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
  }
});
