/**
 * Infinite Match Code Splitting - Lazy Loader
 *
 * Dynamically loads non-critical feature scripts on demand, keeping the
 * initial page load fast. Critical scripts (Phaser, resource config,
 * streamer, procedural levels, etc.) still load upfront; everything else
 * is fetched only when the user actually needs that feature.
 *
 * Usage:
 *   await lazyLoad('kingdom-scene');        // loads js/kingdom-scene.js
 *   await lazyLoad(['match-feedback', 'win-queue']); // loads multiple
 *
 * Each script is loaded at most once; subsequent calls resolve immediately.
 * Returns the global object the script attaches (e.g. window.InfiniteKingdomScene).
 */

const LOADED = new Set();      // scripts that have finished loading
const LOADING = new Map();     // url -> promise for in-flight loads

/**
 * Load one or more feature scripts by name (without .js extension) or full URL.
 * Resolves when all requested scripts are available.
 * Rejects if any script fails to load.
 */
export async function lazyLoad(features) {
  const list = Array.isArray(features) ? features : [features];
  const urls = list.map((f) => (f.endsWith('.js') ? f : `js/${f}.js`));

  await Promise.all(urls.map(loadOne));
}

async function loadOne(url) {
  if (LOADED.has(url)) return;
  if (LOADING.has(url)) return LOADING.get(url);

  const promise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${url}"]`);
    if (existing) {
      // Already in the DOM; wait for it to load
      if (existing.dataset.lazyLoaded === 'true') {
        LOADED.add(url);
        resolve();
        return;
      }
      existing.addEventListener('load', () => {
        LOADED.add(url);
        existing.dataset.lazyLoaded = 'true';
        resolve();
      });
      existing.addEventListener('error', () => {
        reject(new Error(`Failed to load ${url}`));
      });
      return;
    }

    const script = document.createElement('script');
    script.src = url;
    script.async = false;
    script.dataset.lazyLoaded = 'false';
    script.onload = () => {
      LOADED.add(url);
      script.dataset.lazyLoaded = 'true';
      resolve();
    };
    script.onerror = () => {
      reject(new Error(`Failed to load ${url}`));
    };
    document.head.appendChild(script);
  });

  LOADING.set(url, promise);
  try {
    await promise;
  } finally {
    LOADING.delete(url);
  }
}

/**
 * Check whether a feature script has already been loaded.
 */
export function isLoaded(feature) {
  const url = feature.endsWith('.js') ? feature : `js/${feature}.js`;
  return LOADED.has(url);
}

/**
 * Preload (non-blocking) a feature script so it's ready when needed.
 * Does not await completion.
 */
export function prefetch(feature) {
  void lazyLoad(feature).catch(() => { /* best-effort prefetch */ });
}

if (typeof window !== 'undefined') {
  window.lazyLoad = lazyLoad;
  window.isLoaded = isLoaded;
  window.prefetch = prefetch;
}
