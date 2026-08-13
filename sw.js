const CACHE_NAME = 'davomat-cache-v2';
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

// index.html (va navigatsiya so'rovlari) uchun: avval tarmoqdan yangisini olishga
// harakat qiladi, faqat internet yo'q bo'lsa keshdan foydalanadi. Shunday qilib
// sayt yangilanganda telefon eski nusxani "yopishib qolmaydi".
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isHtmlOrNav = event.request.mode === 'navigate' || url.pathname.endsWith('index.html') || url.pathname.endsWith('/');

  if (isHtmlOrNav){
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  const isAppShellFile = APP_SHELL.some((f) => url.pathname.endsWith(f.replace('./', '')));
  if (isAppShellFile){
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
  // Everything else (Firebase, Firestore calls) goes straight to network — not intercepted.
});
