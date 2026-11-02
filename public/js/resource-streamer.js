/**
 * Resource Streamer for Infinite Match.
 *
 * Fetches textures, audio, and JSON from remote URLs with:
 *   - Priority queues (critical on launch, background during play)
 *   - Concurrency limits
 *   - Per-request timeout and retry
 *   - In-memory blob caching with optional TTL
 *   - Abort support for cancelling in-flight requests
 *   - Graceful fallback: missing/unreachable resources silently degrade
 *
 * Usage:
 *   const streamer = new ResourceStreamer(RESOURCE_CONFIG);
 *   await streamer.preloadCritical(themes);   // on launch
 *   const url = await streamer.getUrl('winter'); // during play
 *   await streamer.prefetchBackground(themes); // idle preload during play
 */
export class ResourceStreamer {
  constructor(config = {}) {
    this.config = config;
    this.cache = new Map(); // url -> { url, data, type, fetchedAt, ttl, promise }
    this.inFlight = new Map(); // url -> Promise
    this.abortControllers = new Map(); // url -> AbortController
    this.listeners = new Set(); // progress callbacks
    this.stats = { fetched: 0, failed: 0, cached: 0, bytes: 0 };
  }

  // ----- Progress events -----

  onProgress(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  emitProgress(event) {
    for (const cb of this.listeners) {
      try { cb(event); } catch (_) { /* progress callbacks never break loading */ }
    }
  }

  // ----- Public API -----

  /**
   * Preload critical resources needed for launch. Returns when all critical
   * resources are resolved (fetched or failed). Does not block the UI thread.
   */
  async preloadCritical(resources) {
    const critical = resources.filter((r) => r.priority === 'critical');
    return this.fetchBatch(critical, { concurrency: this.config.behavior.maxConcurrentLaunch });
  }

  /**
   * Prefetch resources during play (background, non-blocking).
   */
  async prefetchBackground(resources) {
    if (!this.config.behavior.preloadDuringPlay) return;
    const background = resources.filter((r) => r.priority !== 'critical');
    return this.fetchBatch(background, {
      concurrency: this.config.behavior.maxConcurrentPlay,
      background: true,
    });
  }

  /**
   * Get the object URL for a previously fetched resource, or null if not available.
   */
  getUrl(url) {
    const entry = this.cache.get(url);
    if (!entry) return null;
    if (this.isExpired(entry)) {
      this.cache.delete(url);
      return null;
    }
    return entry.objectUrl;
  }

  /**
   * Get the parsed JSON for a previously fetched JSON resource.
   */
  getJson(url) {
    const entry = this.cache.get(url);
    if (!entry || entry.type !== 'json') return null;
    if (this.isExpired(entry)) {
      this.cache.delete(url);
      return null;
    }
    return entry.data;
  }

  /**
   * Check whether a resource is already cached.
   */
  has(url) {
    const entry = this.cache.get(url);
    if (!entry) return false;
    if (this.isExpired(entry)) {
      this.cache.delete(url);
      return false;
    }
    return true;
  }

  /**
   * Clear the entire cache and revoke object URLs.
   */
  clear() {
    for (const [url, entry] of this.cache.entries()) {
      if (entry.objectUrl) URL.revokeObjectURL(entry.objectUrl);
    }
    this.cache.clear();
    this.inFlight.clear();
    for (const [url, ctrl] of this.abortControllers.entries()) {
      ctrl.abort();
    }
    this.abortControllers.clear();
  }

  /**
   * Get current streaming stats.
   */
  getStats() {
    return { ...this.stats, cached: this.cache.size, inFlight: this.inFlight.size };
  }

  // ----- Internal -----

  async fetchBatch(resources, { concurrency = 4, background = false } = {}) {
    if (!resources.length) return;
    const queue = [...resources];
    const workers = [];
    const workerCount = Math.min(concurrency, queue.length);

    for (let i = 0; i < workerCount; i++) {
      workers.push(this.worker(queue, { concurrency, background }));
    }
    await Promise.all(workers);
  }

  async worker(queue, { concurrency, background }) {
    while (queue.length) {
      const resource = queue.shift();
      if (!resource || !resource.url) continue;
      if (this.has(resource.url)) {
        this.stats.cached++;
        this.emitProgress({ type: 'cached', resource });
        continue;
      }
      await this.fetchOne(resource, { background });
    }
  }

  async fetchOne(resource, { background = false } = {}) {
    const { url, type = 'blob', priority = 'normal', retry = 0 } = resource;

    // Cancel any previous in-flight request for this URL.
    this.cancel(url);

    const controller = new AbortController();
    this.abortControllers.set(url, controller);

    const fetchPromise = this.doFetch(url, type, controller.signal, retry);
    this.inFlight.set(url, fetchPromise);

    try {
      const entry = await fetchPromise;
      this.cache.set(url, entry);
      this.inFlight.delete(url);
      this.abortControllers.delete(url);
      this.stats.fetched++;
      this.emitProgress({ type: 'fetched', resource, entry });
      return entry;
    } catch (error) {
      this.inFlight.delete(url);
      this.abortControllers.delete(url);
      this.stats.failed++;
      this.emitProgress({ type: 'failed', resource, error });
      // Silent degradation: missing resources fall back to programmatic rendering.
      if (!background) {
        console.warn(`[ResourceStreamer] Failed to load ${url}: ${error.message}`);
      }
      return null;
    }
  }

  async doFetch(url, type, signal, retry) {
    const timeoutMs = this.config.behavior.fetchTimeoutMs;
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

    const combinedSignal = AbortSignal.any([signal, timeoutController.signal]);

    try {
      const response = await fetch(url, { signal: combinedSignal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      let data;
      if (type === 'json') {
        data = await response.json();
      } else {
        data = await response.blob();
      }

      clearTimeout(timeoutId);

      const objectUrl = type === 'blob' ? URL.createObjectURL(data) : null;
      const entry = {
        url,
        data,
        type,
        objectUrl,
        fetchedAt: Date.now(),
        ttl: this.config.behavior.cacheTtlMs,
        size: data.size || 0,
      };
      this.stats.bytes += entry.size;
      return entry;
    } catch (error) {
      clearTimeout(timeoutId);
      if (retry > 0 && (error.name === 'AbortError' || error.message.includes('HTTP'))) {
        // Retry with a fresh controller
        return this.doFetch(url, type, signal, retry - 1);
      }
      throw error;
    }
  }

  isExpired(entry) {
    const ttl = entry.ttl;
    if (!ttl || ttl <= 0) return false;
    return Date.now() - entry.fetchedAt > ttl;
  }

  cancel(url) {
    const ctrl = this.abortControllers.get(url);
    if (ctrl) {
      ctrl.abort();
      this.abortControllers.delete(url);
    }
    const promise = this.inFlight.get(url);
    if (promise) {
      promise.catch(() => {}); // suppress unhandled rejection
      this.inFlight.delete(url);
    }
  }
}

// Attach to window for use by non-module scripts (phaser3-game.js in VM sandbox).
if (typeof window !== 'undefined') {
  window.ResourceStreamer = ResourceStreamer;
}

export default ResourceStreamer;
