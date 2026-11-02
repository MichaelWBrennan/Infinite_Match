/**
 * Infinite Match Service Worker
 *
 * Caches the application shell for instant load and offline play:
 *   - HTML, CSS, JS bundles
 *   - Critical textures and audio
 *
 * Strategy: Cache First for shell assets, Network First for API calls.
 */

const SHELL_VERSION = 'v2';
const SHELL_CACHE = 'infinite-match-shell-v4';
const SHELL = [
  '/',
  '/script.js',
  '/phaser3-game.js',
  '/styles.css',
  '/index.html',
  '/js/phaser.min.js',
  '/js/resource-config.js',
  '/js/resource-streamer.js',
  '/js/game-worker-proxy.js',
  '/js/perf-monitor.js',
  '/js/object-pool.js',
  '/js/cache-manager.js',
  '/js/procedural-levels.js',
  '/js/pwa-register.js',
  '/js/level-location.js',
  '/js/sound-effects.js',
  '/js/kingdom-scene.js',
  '/js/player-experience.js',
  '/js/assistive-board.js',
  '/js/match-feedback.js',
  '/js/score-challenge-card.js',
  '/js/win-queue.js',
  '/css/fonts.css',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
];

// Install: precache shell (fetch each URL and put into cache; skip failures)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => {
        const promises = SHELL.map((url) =>
          fetch(url).then((response) => {
            if (response.ok) {
              return cache.put(url, response);
            }
          }).catch(() => { /* skip unavailable shell files */ })
        );
        return Promise.all(promises);
      })
      .then(() => { if (self.skipWaiting) self.skipWaiting(); })
  );
});

// Activate: clean old shell caches, keep unrelated ones
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== SHELL_CACHE && k.startsWith('infinite-match-shell-')).map((k) => caches.delete(k))
      ))
      .then(() => { if (self.clients?.claim) self.clients.claim(); })
  );
});

// Fetch: navigation requests always served as shell; shell assets cache-first;
// everything else passes to the network untouched.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept cross-origin or non-GET requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  const cacheOpened = caches.open(SHELL_CACHE);

  // Navigation requests: serve the app shell from cache or network,
  // with offline fallback to cached /index.html or a 503.
  if (request.mode === 'navigate') {
    const cachedRoot = cacheOpened.then((cache) =>
      cache.match(request) || cache.match('/index.html')
    );
    event.respondWith(
      cachedRoot.then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            cacheOpened.then((cache) => cache.put('/index.html', response.clone()));
          }
          return response;
        }).catch(() => {
          return cacheOpened.then((cache) => cache.match('/index.html')).then((offline) => {
            if (offline) return offline;
            return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
          });
        });
      })
    );
    return;
  }

  // Only intercept shell assets for non-navigation requests.
  if (!SHELL.includes(url.pathname)) {
    return;
  }

  // Shell assets: cache first with background refresh on cache hit.
  const cachedMatch = cacheOpened.then((cache) => cache.match(request));

  event.waitUntil(
    cachedMatch.then((cached) => {
      if (!cached) return;
      return fetch(request).then((response) => {
        if (response.ok) {
          cacheOpened.then((cache) => cache.put(request, response.clone()));
        }
      });
    })
  );

  event.respondWith(
    cachedMatch.then((cached) => {
      if (cached) return cached;
      return fetch(request);
    })
  );
});
