const CACHE_NAME = 'edusl-v3';

// Only cache what you KNOW exists
const urlsToCache = [
  './index.html'   // relative to the service worker's location
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching index.html');
        // Use individual cache.add to catch errors per file
        return Promise.all(
          urlsToCache.map(url => {
            return cache.add(url).catch(err => {
              console.warn('⚠️ Could not cache', url, err);
            });
          })
        );
      })
      .then(() => console.log('✅ Cache attempt complete'))
      .catch(err => console.error('❌ Cache error:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});