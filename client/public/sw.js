// SFAS Resilient Offline Service Worker
const CACHE_NAME = 'sfas-cache-v2';

self.addEventListener('install', (event) => {
  // Activate immediately without waiting for old tabs to close
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      // Purge old stale caches (including v1)
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => {
          console.log('🧹 Purging outdated service worker cache:', key);
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1. API requests: Network-First with graceful offline fallback
  if (url.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return new Response(
            JSON.stringify({
              success: true,
              data: { isOfflineCached: true, message: 'Offline mode active. Using cached agricultural data.' }
            }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        })
    );
    return;
  }

  // 2. Static Assets (JS, CSS, images, fonts): Network-First to guarantee latest deploy
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return networkResponse;
      })
      .catch(async () => {
        // Fallback to cache ONLY if network is genuinely disconnected
        const cached = await caches.match(event.request);
        if (cached) return cached;
        // Never return HTML for JS/CSS assets
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
        return new Response('Offline asset unavailable', { status: 503, statusText: 'Service Unavailable' });
      })
  );
});
