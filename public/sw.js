/*
 * Infinite Match service worker: a conservative, installable offline shell.
 *
 * Caches ONLY the static files listed in SHELL below. It never caches or
 * intercepts:
 *   - /api/* (game state, economy, social, payments)
 *   - cross-origin requests (CDNs, analytics, Stripe, store SDKs)
 *   - non-GET requests
 *   - any same-origin path that is not in SHELL
 *
 * Installing does not skip waiting, so a new version activates only after
 * open tabs close, which avoids swapping scripts under a running game.
 * Bump SHELL_VERSION whenever a file in SHELL changes; old caches are removed
 * on activate.
 */
const SHELL_VERSION = 'v1';
const CACHE_PREFIX = 'infinite-match-shell-';
const CACHE_NAME = CACHE_PREFIX + SHELL_VERSION;
const NAVIGATION_PATHS = ['/', '/index.html'];

const SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/styles.css',
  '/css/fonts.css',
  '/js/offline-api.js',
  '/js/phaser.min.js',
  '/js/procedural-levels.js',
  '/js/level-location.js',
  '/js/sound-effects.js',
  '/js/kingdom-scene.js',
  '/js/player-experience.js',
  '/js/assistive-board.js',
  '/js/match-feedback.js',
  '/js/pwa-register.js',
  '/phaser3-game.js',
  '/platform-detection.js',
  '/script.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
];
const SHELL_SET = new Set(SHELL);

self.addEventListener('install', (event) => {
  event.waitUntil(precache());
});

async function precache() {
  const cache = await caches.open(CACHE_NAME);
  // Each file is best-effort: one file missing from a particular deploy must
  // not stop the rest of the shell from installing.
  await Promise.all(
    SHELL.map(async (path) => {
      try {
        const response = await fetch(new Request(path, { cache: 'reload' }));
        if (response.ok) await cache.put(path, response);
      } catch {
        // Skip this file; it will be fetched from the network as normal.
      }
    }),
  );
}

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(navigate(request, url));
    return;
  }

  if (SHELL_SET.has(url.pathname)) {
    event.respondWith(staleWhileRevalidate(event, request, url.pathname));
  }
});

// Navigations are network-first so a deployed update is seen as soon as the
// player is online. Offline, they get the cached app shell.
async function navigate(request, url) {
  try {
    const response = await fetch(request);
    if (response.ok && NAVIGATION_PATHS.includes(url.pathname)) {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.put('/index.html', response.clone());
      } catch {
        // Caching is an optimisation; the fresh response is still returned.
      }
    }
    return response;
  } catch {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match('/index.html');
    if (cached) return cached;
    return new Response(
      'Infinite Match is offline and has not been cached yet. Reconnect once to finish installing it.',
      { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
    );
  }
}

// Shell files: serve the cached copy immediately and refresh it in the background.
async function staleWhileRevalidate(event, request, path) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(path);
  const network = fetch(request).then(async (response) => {
    if (response.ok) await cache.put(path, response.clone());
    return response;
  });
  if (cached) {
    event.waitUntil(network.catch(() => {}));
    return cached;
  }
  return network;
}
