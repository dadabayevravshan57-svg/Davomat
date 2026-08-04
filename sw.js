const CACHE_NAME = 'davomat-cache-v1';
const APP_SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for navigation/data, cache-first fallback for app shell files
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isAppShellFile = APP_SHELL.some((f) => url.pathname.endsWith(f.replace('./', '')));

  if (isAppShellFile){
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
  // Everything else (Firebase, Firestore calls) goes straight to network — not intercepted.
});
