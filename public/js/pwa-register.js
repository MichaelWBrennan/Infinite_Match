/**
 * Infinite Match PWA Service Worker Registration
 *
 * Registers the service worker for offline shell caching and instant load.
 */

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then((reg) => console.log('🔧 Service worker registered:', reg.scope))
    .catch((err) => console.warn('🔧 Service worker registration failed:', err));
}
