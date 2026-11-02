/**
 * Infinite Match Cache Manager
 *
 * Dual-layer caching for instant load and offline play:
 *   1. Cache API (service worker) - Shell, HTML, CSS, JS bundles
 *   2. IndexedDB - Game assets (blobs), level definitions, player state
 *
 * All operations are async and never block the main thread.
 * Failed cache operations silently degrade - the game always works online.
 */

const DB_NAME = 'infinite-match';
const DB_VERSION = 1;
const STORE_LEVELS = 'levels';
const STORE_ASSETS = 'assets';
const STORE_STATE = 'state';
const CACHE_NAME = 'infinite-match-v1';

let dbPromise = null;

/**
 * Open (or create) the IndexedDB database.
 */
function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (!indexedDB) {
      reject(new Error('IndexedDB not available'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_LEVELS)) {
        db.createObjectStore(STORE_LEVELS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_ASSETS)) {
        db.createObjectStore(STORE_ASSETS, { keyPath: 'url' });
      }
      if (!db.objectStoreNames.contains(STORE_STATE)) {
        db.createObjectStore(STORE_STATE, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.target.result);
    req.onerror = () => reject(req.target.error);
  });
  return dbPromise;
}

/**
 * Get a cached level definition by ID.
 */
async function getCachedLevel(levelId) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_LEVELS, 'readonly');
      const store = tx.objectStore(STORE_LEVELS);
      const req = store.get(levelId);
      req.onsuccess = () => resolve(req.result ? req.result.data : null);
      req.onerror = () => reject(req.target.error);
    });
  } catch (e) {
    return null;
  }
}

/**
 * Cache a level definition.
 */
async function cacheLevel(levelId, definition) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_LEVELS, 'readwrite');
      const store = tx.objectStore(STORE_LEVELS);
      const req = store.put({ id: levelId, data: definition, cachedAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.target.error);
    });
  } catch (e) {
    // Silent degrade
  }
}

/**
 * Get a cached asset blob (texture, audio) by URL.
 */
async function getCachedAsset(url) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ASSETS, 'readonly');
      const store = tx.objectStore(STORE_ASSETS);
      const req = store.get(url);
      req.onsuccess = () => resolve(req.result ? req.result.blob : null);
      req.onerror = () => reject(req.target.error);
    });
  } catch (e) {
    return null;
  }
}

/**
 * Cache an asset blob.
 */
async function cacheAsset(url, blob) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ASSETS, 'readwrite');
      const store = tx.objectStore(STORE_ASSETS);
      const req = store.put({ url, blob, cachedAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.target.error);
    });
  } catch (e) {
    // Silent degrade
  }
}

/**
 * Get player state from cache.
 */
async function getCachedState(key) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_STATE, 'readonly');
      const store = tx.objectStore(STORE_STATE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ? req.result.value : null);
      req.onerror = () => reject(req.target.error);
    });
  } catch (e) {
    return null;
  }
}

/**
 * Cache player state.
 */
async function cacheState(key, value) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_STATE, 'readwrite');
      const store = tx.objectStore(STORE_STATE);
      const req = store.put({ key, value, cachedAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.target.error);
    });
  } catch (e) {
    // Silent degrade
  }
}

/**
 * Preload critical resources into Cache API (shell + bundles).
 * Call this from a service worker or at app init.
 */
async function precacheShell(urls) {
  if (!caches) return;
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(urls);
  } catch (e) {
    console.warn('[CacheManager] Precache failed:', e.message);
  }
}

/**
 * Try Cache API first, then network. Returns a Response.
 */
async function cacheFirst(request) {
  if (!caches) return fetch(request);
  try {
    const cached = await caches.match(request);
    if (cached) return cached;
  } catch (e) { /* fall through to network */ }
  return fetch(request);
}

/**
 * Network first, then cache. Updates cache in background.
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok && caches) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    if (caches) {
      const cached = await caches.match(request);
      if (cached) return cached;
    }
    throw e;
  }
}

/**
 * Clear all caches (for logout or fresh start).
 */
async function clearAll() {
  if (caches) {
    await caches.delete(CACHE_NAME);
  }
  try {
    const db = await openDB();
    db.close();
    indexedDB.deleteDatabase(DB_NAME);
  } catch (e) { /* ignore */ }
  dbPromise = null;
}

/**
 * Get cache statistics.
 */
async function getStats() {
  let levels = 0, assets = 0, state = 0;
  try {
    const db = await openDB();
    levels = await new Promise((res) => {
      const tx = db.transaction(STORE_LEVELS, 'readonly');
      const req = tx.objectStore(STORE_LEVELS).count();
      req.onsuccess = () => res(req.result);
    });
    assets = await new Promise((res) => {
      const tx = db.transaction(STORE_ASSETS, 'readonly');
      const req = tx.objectStore(STORE_ASSETS).count();
      req.onsuccess = () => res(req.result);
    });
    state = await new Promise((res) => {
      const tx = db.transaction(STORE_STATE, 'readonly');
      const req = tx.objectStore(STORE_STATE).count();
      req.onsuccess = () => res(req.result);
    });
  } catch (e) { /* ignore */ }
  return { levels, assets, state };
}

export {
  getCachedLevel, cacheLevel,
  getCachedAsset, cacheAsset,
  getCachedState, cacheState,
  precacheShell, cacheFirst, networkFirst,
  clearAll, getStats,
};
