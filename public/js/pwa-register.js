/**
 * Infinite Match PWA registration.
 *
 * Registers the offline shell, exposes honest install/update/offline status, and
 * never reloads a running game by itself. An update is applied only after the
 * player presses "Restart to apply update" in This week.
 */
(function (root) {
  'use strict';

  const listeners = new Set();
  const state = {
    supported: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
    registered: false,
    offlineReady: false,
    updateReady: false,
    installAvailable: false,
    installed: false,
    online: typeof navigator === 'undefined' || navigator.onLine !== false,
    error: null,
  };
  let registration = null;
  let installPrompt = null;
  let userRequestedUpdate = false;

  function snapshot() {
    return Object.freeze({ ...state });
  }

  function emit() {
    const view = snapshot();
    for (const listener of listeners) {
      try { listener(view); } catch { /* A UI listener must not break registration. */ }
    }
    try { root.dispatchEvent?.(new CustomEvent('infinite:pwa-status', { detail: view })); } catch { /* Optional event. */ }
  }

  function set(patch) {
    Object.assign(state, patch);
    emit();
  }

  async function checkOfflineReady() {
    if (typeof caches === 'undefined') return false;
    try {
      const needed = ['/index.html', '/js/phaser.min.js', '/phaser3-game.js', '/js/procedural-levels.js', '/js/offline-api.js'];
      const found = await Promise.all(needed.map((path) => caches.match(path)));
      return found.every(Boolean);
    } catch {
      return false;
    }
  }

  function watchRegistration(reg) {
    registration = reg;
    const waiting = reg.waiting || reg.installing;
    if (reg.waiting) set({ updateReady: true });
    if (waiting) {
      waiting.addEventListener('statechange', () => {
        if (waiting.state === 'installed' && navigator.serviceWorker.controller) set({ updateReady: true });
        if (waiting.state === 'activated') void refresh();
      });
    }
    reg.addEventListener('updatefound', () => {
      const next = reg.installing;
      if (!next) return;
      next.addEventListener('statechange', () => {
        if (next.state === 'installed' && navigator.serviceWorker.controller) set({ updateReady: true });
        if (next.state === 'activated') void refresh();
      });
    });
  }

  async function refresh() {
    const offlineReady = await checkOfflineReady();
    set({
      registered: !!registration || !!navigator.serviceWorker?.controller,
      offlineReady,
      installed: state.installed || root.matchMedia?.('(display-mode: standalone)')?.matches === true || root.navigator?.standalone === true,
      online: navigator.onLine !== false,
    });
  }

  async function init() {
    if (!state.supported) {
      set({ error: 'unsupported' });
      return snapshot();
    }
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
      watchRegistration(reg);
      await refresh();
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (userRequestedUpdate) root.location.reload();
        else void refresh();
      });
      return snapshot();
    } catch (error) {
      set({ error: 'registration_failed' });
      console.warn('Service worker registration failed:', error);
      return snapshot();
    }
  }

  async function promptInstall() {
    if (!installPrompt) return 'unavailable';
    const prompt = installPrompt;
    installPrompt = null;
    set({ installAvailable: false });
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice?.outcome === 'accepted') set({ installed: true });
      return choice?.outcome || 'dismissed';
    } catch {
      return 'failed';
    }
  }

  function applyUpdate() {
    if (!registration?.waiting) return false;
    userRequestedUpdate = true;
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    return true;
  }

  function checkForUpdate() {
    return registration?.update?.().catch(() => undefined);
  }

  root.addEventListener?.('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;
    set({ installAvailable: true });
  });
  root.addEventListener?.('appinstalled', () => {
    installPrompt = null;
    set({ installed: true, installAvailable: false });
  });
  root.addEventListener?.('online', () => set({ online: true }));
  root.addEventListener?.('offline', () => set({ online: false }));

  const api = Object.freeze({
    status: snapshot,
    subscribe(listener) {
      listeners.add(listener);
      listener(snapshot());
      return () => listeners.delete(listener);
    },
    init,
    refresh,
    promptInstall,
    applyUpdate,
    checkForUpdate,
  });
  root.InfinitePWA = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  void init();
})(typeof window !== 'undefined' ? window : globalThis);
