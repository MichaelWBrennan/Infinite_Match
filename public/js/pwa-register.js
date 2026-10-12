// Registers the Infinite Match service worker (public/sw.js) for installability
// and an offline app shell. Does nothing when service workers are unsupported or
// the page is not on a secure origin.
(function () {
  'use strict';
  if (!('serviceWorker' in navigator)) return;
  var host = window.location.hostname;
  var secure = window.location.protocol === 'https:' || host === 'localhost' || host === '127.0.0.1';
  if (!secure) return;
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function (error) {
      console.warn('[pwa] service worker not registered:', error && error.message);
    });
  });
})();
