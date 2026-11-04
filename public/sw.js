/**
 * Infinite Match Service Worker
 *
 * Caches the application shell for instant load and offline play:
 *   - HTML, CSS, JS bundles
 *   - Critical textures and audio
 *
 * Strategy: network-first navigation with offline shell fallback, stale-while-
 * revalidate shell assets, and no interception of API or cross-origin requests.
 * A new worker waits for an explicit player restart instead of reloading play.
 */

const SHELL_VERSION = 'v9';
const SHELL_CACHE = 'infinite-match-shell-v11';
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
  '/js/art-direction.js',
  '/js/texture-atlas.js',
  '/js/pwa-register.js',
  '/js/level-location.js',
  '/js/sound-effects.js',
  '/js/kingdom-scene.js',
  '/js/player-experience.js',
  '/js/assistive-board.js',
  '/js/match-feedback.js',
  '/js/game-feel.js',
  '/js/kingdom-payoff.js',
  '/js/play-flow.js',
  '/js/weekly-hub.js',
  '/js/loss-review.js',
  '/js/offline-api.js',
  '/js/lazy-loader.js',
  '/js/perf-overlay.js',
  '/js/score-challenge-card.js',
  '/js/win-queue.js',
  '/unified.css',
  '/css/fonts.css',
  '/css/design-tokens.css',
  '/css/components.css',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
];

// The guest game must not advertise offline readiness from a half-installed shell.
const CRITICAL_SHELL = new Set([
  '/', '/index.html', '/script.js', '/phaser3-game.js', '/styles.css',
  '/js/phaser.min.js', '/js/procedural-levels.js', '/js/offline-api.js',
  '/js/pwa-register.js', '/js/player-experience.js', '/js/lazy-loader.js',
  '/js/cache-manager.js', '/js/art-direction.js', '/js/texture-atlas.js',
]);

// Install: precache the shell. Optional files may be skipped; a missing critical
// file fails the install so the previous working shell remains active.
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    try {
      await Promise.all(SHELL.map(async (url) => {
        try {
          const response = await fetch(url);
          if (response.ok) return await cache.put(url, response);
          if (CRITICAL_SHELL.has(url)) throw new Error(`Missing critical shell file: ${url}`);
        } catch (error) {
          if (CRITICAL_SHELL.has(url)) throw error;
        }
      }));
    } catch (error) {
      await caches.delete(SHELL_CACHE);
      throw error;
    }
    // Do not skipWaiting here. The page applies an update only after an explicit restart.
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING' && self.skipWaiting) {
    event.waitUntil(self.skipWaiting());
  }
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

  // Navigation requests: try the network first so a deployed HTML update is not
  // hidden by an old shell; fall back to the cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await cacheOpened;
          await cache.put('/index.html', response.clone());
        }
        return response;
      } catch {
        const cache = await cacheOpened;
        const offline = await cache.match(request) || await cache.match('/index.html');
        if (offline) return offline;
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      }
    })());
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
