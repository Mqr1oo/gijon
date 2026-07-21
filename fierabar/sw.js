const CACHE_NAME = 'menu-cache-v1';

// Fisiere esențiale pe care le salvăm din prima
const urlsToCache = [
  '/',
  '/index.html',
  '/menu.json',
  '/config.json',
  '/manifest.json'
];

// Instalarea Service Worker-ului
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache deschis cu succes');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activarea și curățarea cache-ului vechi
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Strategia Fetch: Stale-While-Revalidate
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(cachedResponse => {
        const fetchedResponse = fetch(event.request).then(networkResponse => {
          // Actualizăm cache-ul în fundal
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // Dacă e complet offline și pică și rețeaua
          return cachedResponse;
        });

        // Returnăm instant varianta din cache (dacă există), altfel așteptăm rețeaua
        return cachedResponse || fetchedResponse;
      });
    })
  );
});
