// RobotSpeak Service Worker — Bulletproof Offline
const CACHE_NAME = 'robotspeak-v10';
const ASSETS = ['./index.html', './manifest.json', './icon-192.svg', './icon-512.svg'];

// Install: precache
self.addEventListener('install', e => {
  console.log('[SW] Installing...');
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching', ASSETS);
      return Promise.all(ASSETS.map(a => fetch(a).then(r => r.ok ? cache.put(a, r) : Promise.reject())));
    })
  );
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', e => {
  console.log('[SW] Activated');
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // 1) Navigation (page refresh, URL bar → go) → always serve cached index.html
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match('./index.html').then(c => {
        if (c) return c;
        return fetch(e.request).then(r => {
          caches.open(CACHE_NAME).then(ca => ca.put('./index.html', r.clone()));
          return r;
        }).catch(() => caches.match('./index.html'));
      })
    );
    return;
  }

  // 2) All other resources → cache first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(r => {
      if (r.ok) {
        const clone = r.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      }
      return r;
    }))
  );
});
  );
});
