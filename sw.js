// Ambica-Hind service worker
// Change the version number below whenever you want every phone to refresh its saved files.
const CACHE_NAME = 'ambica-hind-v4';

const BASE = self.registration.scope; // https://mis160.github.io/Ambica-Hind/
const BASE_PATH = new URL(BASE).pathname; // /Ambica-Hind/

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([BASE, BASE + 'index.html']))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle GET requests for our own site.
  // Google Apps Script data calls always go straight to the network.
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // Build files in /assets/ have a unique name for every version,
  // so they are safe to keep and reuse: cache first.
  if (url.pathname.startsWith(BASE_PATH + 'assets/')) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((c) => c.put(req, copy));
            }
            return res;
          })
      )
    );
    return;
  }

  // Everything else (the page, icons, logo, photos, manifest):
  // network first so updates show up, saved copy only when offline.
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          const key = req.mode === 'navigate' ? BASE + 'index.html' : req;
          caches.open(CACHE_NAME).then((c) => c.put(key, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then(
          (cached) => cached || (req.mode === 'navigate' ? caches.match(BASE + 'index.html') : undefined)
        )
      )
  );
});
