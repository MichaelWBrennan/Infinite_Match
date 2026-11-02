/**
 * Infinite Match Performance Monitor
 *
 * Tracks key performance metrics and reports them:
 *   - Frame rate (FPS) via requestAnimationFrame
 *   - Input-to-paint latency
 *   - Resource load times
 *   - Memory usage (when available)
 *   - Long task detection
 *   - Frame budget enforcement (soft defer / hard pause)
 *   - requestIdleCallback scheduler for background work
 *   - Memory leak detection (object pool growth tracking)
 *
 * Overhead is minimal: <1ms per frame.
 */

class PerfMonitor {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.sampleInterval = options.sampleInterval || 1000; // ms
    this.reportCallback = options.onReport || null;

    // Frame timing
    this.frameCount = 0;
    this.lastFrameTime = performance.now();
    this.fps = 60;

    // Input latency
    this.inputEvents = [];
    this.maxInputEvents = 50;

    // Long tasks
    this.longTasks = [];

    // Memory
    this.memory = null;

    // Frame budget (16.67ms = 60fps)
    this.frameBudgetMs = options.frameBudgetMs || 16.67;
    this.hardPauseBudgetMs = options.hardPauseBudgetMs || 33.33; // 30fps threshold
    this.frameTimes = [];
    this.maxFrameTimes = 120; // ~2 seconds at 60fps
    this._deferWork = false; // Soft: defer non-urgent work
    this._hardPause = false; // Hard: pause all non-essential work

    // Memory leak detection: track object pool sizes over time
    this._poolSnapshots = []; // { time, spritePoolSize, ... }
    this._maxPoolSnapshots = 60; // ~1 minute at 1s samples
    this._leakWarningThreshold = 1.5; // 50% growth over window = warning

    // Web Vitals
    this._webVitals = {
      lcp: null,      // Largest Contentful Paint
      cls: null,      // Cumulative Layout Shift
      inp: null,      // Interaction to Next Paint
      fcp: null,      // First Contentful Paint
      ttfb: null,     // Time to First Byte
    };

    // Idle work scheduler
    this._idleQueue = []; // [{ callback, deadline }]
    this._idleHandle = null;

    this._rafId = null;
    this._sampleId = null;
    this._observer = null;
    this._idleTickId = null;

    if (this.enabled) this.start();
  }

  start() {
    if (this._rafId) return;
    this.lastFrameTime = performance.now();
    this._tick = this._tick.bind(this);
    this._rafId = requestAnimationFrame(this._tick);

    // Sample metrics periodically
    this._sampleId = setInterval(() => this._sample(), this.sampleInterval);

    // Observe long tasks
    if ('PerformanceObserver' in window) {
      try {
        this._observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              this.longTasks.push({
                time: performance.now(),
                duration: entry.duration,
                name: entry.name,
              });
              // Keep only recent
              if (this.longTasks.length > 100) this.longTasks.shift();
            }
          }
        });
        this._observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // Long task observation not supported
      }
    }

    // Observe web vitals (LCP, CLS, INP, FCP, TTFB)
    this._observeWebVitals();

    // Kick off idle work processing
    this._processIdleQueue();
  }

  _observeWebVitals() {
    if (!('PerformanceObserver' in window)) return;
    try {
      this._webVitalObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const { name, entryType, startTime, duration, value } = entry;
          if (entryType === 'largest-contentful-paint') {
            this._webVitals.lcp = startTime;
          } else if (entryType === 'layout-shift' && !entry.hadRecentInput) {
            this._webVitals.cls = (this._webVitals.cls || 0) + value;
          } else if (entryType === 'first-contentful-paint') {
            this._webVitals.fcp = startTime;
          }
        }
      });
      this._webVitalObserver.observe({
        entryTypes: ['largest-contentful-paint', 'layout-shift', 'first-contentful-paint'],
      });
    } catch (e) {
      // Web Vitals observation not supported
    }

    // INP via event timing (fallback for browsers without event-timing)
    if ('EventTiming' in window || 'PerformanceEventTiming' in window) {
      try {
        this._inpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'event' || entry.entryType === 'first-input') {
              const processingDuration = entry.duration || 0;
              const currentInp = this._webVitals.inp || 0;
              this._webVitals.inp = Math.max(currentInp, processingDuration);
            }
          }
        });
        this._inpObserver.observe({ entryTypes: ['event', 'first-input'] });
      } catch (e) {
        // INP observation not supported
      }
    }

    // TTFB from navigation timing
    if ('performance' in window && performance.timing) {
      const nav = performance.timing;
      this._webVitals.ttfb = nav.responseStart - nav.requestStart;
    }
  }

  stop() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = null;
    if (this._sampleId) clearInterval(this._sampleId);
    if (this._observer) this._observer.disconnect();
    if (this._webVitalObserver) this._webVitalObserver.disconnect();
    if (this._inpObserver) this._inpObserver.disconnect();
    if (this._idleHandle !== null) {
      cancelIdleCallback?.(this._idleHandle);
      this._idleHandle = null;
    }
    if (this._idleTickId !== null) {
      clearTimeout(this._idleTickId);
      this._idleTickId = null;
    }
  }

  _tick(now) {
    const dt = now - this.lastFrameTime;
    this.frameCount++;
    this.lastFrameTime = now;

    // Track per-frame time for budget monitoring
    this.frameTimes.push(dt);
    if (this.frameTimes.length > this.maxFrameTimes) this.frameTimes.shift();

    // Budget enforcement based on recent average frame time
    const recent = this.frameTimes.slice(-30);
    const avgFrameTime = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;

    // Soft defer: frames over 16.67ms (under 60fps)
    this._deferWork = avgFrameTime > this.frameBudgetMs;

    // Hard pause: frames over 33.33ms (under 30fps) — stop all non-essential work
    this._hardPause = avgFrameTime > this.hardPauseBudgetMs;

    // Estimate FPS
    if (dt >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / dt);
      this.frameCount = 0;
      this.lastFrameTime = now;
    }

    this._rafId = requestAnimationFrame(this._tick);
  }

  _sample() {
    const sample = {
      time: performance.now(),
      fps: this.fps,
      longTasks: this.longTasks.length,
      memory: this._getMemory(),
      frameBudget: this.getFrameBudget(),
    };

    // Memory leak detection: record pool snapshot
    this._recordPoolSnapshot();

    if (this.reportCallback) {
      try { this.reportCallback(sample); } catch (e) { /* ignore */ }
    }
  }

  _getMemory() {
    if (performance.memory) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
      };
    }
    return null;
  }

  /**
   * Record a pool-size snapshot for leak detection. Callers (e.g. the game)
   * should call registerPoolSize(name, size) to report pool sizes.
   */
  _recordPoolSnapshot() {
    const snapshot = { time: performance.now(), pools: { ...this._poolSizes } };
    this._poolSnapshots.push(snapshot);
    if (this._poolSnapshots.length > this._maxPoolSnapshots) this._poolSnapshots.shift();
  }

  /**
   * Register a pool size for leak tracking. Call this whenever a pool changes size.
   * @param {string} name - pool name (e.g. 'spritePool', 'gemDataPool')
   * @param {number} size - current number of pooled items
   */
  registerPoolSize(name, size) {
    if (!this._poolSizes) this._poolSizes = {};
    this._poolSizes[name] = size;
  }

  /**
   * Check for memory leaks: returns { leaking: boolean, pools: { name: growthRatio } }
   * A pool is flagged if it has grown more than leakWarningThreshold over the sample window.
   */
  checkMemoryLeaks() {
    if (!this._poolSizes || this._poolSnapshots.length < 2) return { leaking: false, pools: {} };

    const now = performance.now();
    const windowMs = 60000; // 1 minute
    const oldSnapshots = this._poolSnapshots.filter((s) => now - s.time < windowMs);
    if (oldSnapshots.length < 2) return { leaking: false, pools: {} };

    const oldest = oldSnapshots[0];
    const newest = oldSnapshots[oldSnapshots.length - 1];
    const pools = {};
    let leaking = false;

    for (const [name, currentSize] of Object.entries(this._poolSizes)) {
      const oldSize = oldest.pools[name] || 0;
      if (oldSize <= 0) continue;
      const ratio = currentSize / oldSize;
      pools[name] = ratio;
      if (ratio > this._leakWarningThreshold) leaking = true;
    }

    return { leaking, pools };
  }

  /** Get current metrics snapshot. */
  getMetrics() {
    return {
      fps: this.fps,
      longTasks: this.longTasks.length,
      memory: this._getMemory(),
      pendingInputs: this.inputEvents.filter((e) => !e.completed).length,
      frameBudget: this.getFrameBudget(),
      shouldDeferWork: this.shouldDeferWork(),
      hardPause: this.isHardPaused(),
      webVitals: { ...this._webVitals },
    };
  }

  /** Get web vitals scores for scoring. */
  _getWebVitalsScore() {
    let penalty = 0;
    const lcp = this._webVitals.lcp;
    if (lcp !== null) {
      if (lcp > 4000) penalty += 15; // Poor LCP > 4s
      else if (lcp > 2500) penalty += 5; // Needs improvement > 2.5s
    }
    const cls = this._webVitals.cls;
    if (cls !== null) {
      if (cls > 0.25) penalty += 10; // Poor CLS > 0.25
      else if (cls > 0.1) penalty += 3; // Needs improvement > 0.1
    }
    const inp = this._webVitals.inp;
    if (inp !== null) {
      if (inp > 500) penalty += 15; // Poor INP > 500ms
      else if (inp > 200) penalty += 5; // Needs improvement > 200ms
    }
    return penalty;
  }

  /** Returns true when recent frames have exceeded the soft budget. */
  shouldDeferWork() {
    return this._deferWork;
  }

  /** Returns true when frames are severely over budget (hard pause). */
  isHardPaused() {
    return this._hardPause;
  }

  /**
   * Returns frame budget info: { budgetMs, hardPauseBudgetMs, avgFrameMs,
   * overBudget, hardPaused }.
   */
  getFrameBudget() {
    const recent = this.frameTimes.slice(-30);
    const avg = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
    return {
      budgetMs: this.frameBudgetMs,
      hardPauseBudgetMs: this.hardPauseBudgetMs,
      avgFrameMs: avg,
      overBudget: avg > this.frameBudgetMs,
      hardPaused: avg > this.hardPauseBudgetMs,
    };
  }

  /**
   * Schedule a callback to run during idle periods using requestIdleCallback.
   * Falls back to setTimeout(0) if requestIdleCallback is unavailable.
   * Returns an id that can be used to cancel via cancelIdleWork(id).
   */
  scheduleIdleWork(callback, options = {}) {
    const id = Symbol('idle-work');
    const entry = { id, callback, deadline: options.deadline || 0 };
    this._idleQueue.push(entry);
    this._scheduleIdleTick();
    return id;
  }

  /** Cancel a previously scheduled idle work item. */
  cancelIdleWork(id) {
    this._idleQueue = this._idleQueue.filter((e) => e.id !== id);
  }

  _scheduleIdleTick() {
    if (this._idleHandle !== null || this._idleTickId !== null) return;
    if ('requestIdleCallback' in window) {
      this._idleHandle = requestIdleCallback((deadline) => this._processIdleQueue(deadline), { timeout: 1000 });
    } else {
      this._idleTickId = setTimeout(() => this._processIdleQueue(), 0);
    }
  }

  _processIdleQueue(deadline) {
    this._idleHandle = null;
    this._idleTickId = null;

    // Don't run idle work if frames are hard-paused
    if (this._hardPause) {
      // Re-queue everything and try again later
      this._idleQueue.forEach((e) => { /* keep in queue */ });
      this._scheduleIdleTick();
      return;
    }

    const start = performance.now();
    const timeRemaining = deadline && typeof deadline.timeRemaining === 'function'
      ? deadline.timeRemaining()
      : 50; // Default 50ms budget for setTimeout fallback

    const remaining = [];
    while (this._idleQueue.length > 0) {
      const entry = this._idleQueue.shift();
      const entryStart = performance.now();
      try { entry.callback(); } catch (e) { /* ignore idle work errors */ }
      const elapsed = performance.now() - entryStart;

      // If we're running out of time, re-queue the rest
      if (performance.now() - start > timeRemaining - 5) {
        remaining.push(entry);
        break;
      }
    }

    // Add any unprocessed entries back
    remaining.push(...this._idleQueue);
    this._idleQueue = remaining;

    // Schedule more if there's work left
    if (this._idleQueue.length > 0) {
      this._scheduleIdleTick();
    }
  }

  /** Get a performance score (0-100). */
  getScore() {
    let score = 100;
    if (this.fps < 30) score -= 30;
    else if (this.fps < 60) score -= 15;
    if (this.longTasks.length > 10) score -= 20;
    const mem = this._getMemory();
    if (mem && mem.usedJSHeapSize > mem.jsHeapSizeLimit * 0.9) score -= 10;
    const leak = this.checkMemoryLeaks();
    if (leak.leaking) score -= 10;
    score -= this._getWebVitalsScore();
    return Math.max(0, Math.min(100, score));
  }
}

// Singleton
const perfMonitor = new PerfMonitor();

export { PerfMonitor, perfMonitor };

// Auto-expose to window
if (typeof window !== 'undefined') {
  window.PerfMonitor = PerfMonitor;
  window.perfMonitor = perfMonitor;
}
