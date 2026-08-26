const CACHE_NAME = 'warungku-internal-v77';
const ASSETS = [
  './index.html',
  './css/style.css',
  './js/db.js',
  './js/app.js',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  // Network-first: selalu coba ambil versi terbaru dulu.
  // Cache hanya dipakai sebagai cadangan kalau benar-benar offline,
  // supaya update kode ke depannya tidak pernah "tersangkut" di cache lama.
  e.respondWith(
    fetch(e.request)
      .then((resp) => {
        var copy = resp.clone();
        caches.open(CACHE_NAME).then((c) => c.put(e.request, copy));
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});
