// Free static build: answer /api/* in the browser instead of calling a server that is not deployed.
//
// Why: the public site is a static Vercel deploy with no API. Its catch-all rewrite returned the game
// page with HTTP 200 for every /api call, which looked like success with empty data. This shim
// answers those calls locally with HTTP 503 and a JSON error code, so the game falls back to guest play.
//
// Mode:
//   - offline (default off localhost): every same-origin /api/* request is answered locally; nothing
//     leaves the browser.
//   - live (localhost, or ?api=live): requests go to the server as before, for development with a
//     real backend.
// Load this script before the game scripts. It is classic (non-module) JavaScript on purpose.
(function () {
  'use strict';

  var params = new URLSearchParams(location.search);
  var host = location.hostname;
  var isLocal = host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
  var offline = !isLocal && params.get('api') !== 'live';
  window.InfiniteMatchApi = { mode: offline ? 'offline' : 'live' };

  if (!offline || typeof window.fetch !== 'function' || typeof window.Response !== 'function') return;

  var nativeFetch = window.fetch.bind(window);
  var apiPath = /^\/api(\/|$)/;

  function resolveUrl(input) {
    try {
      return new URL(typeof input === 'string' ? input : input.url, location.href);
    } catch (error) {
      return null;
    }
  }

  window.fetch = function (input, init) {
    var target = resolveUrl(input);
    if (target && target.origin === location.origin && apiPath.test(target.pathname)) {
      var body = {
        success: false,
        ok: false,
        code: 'api_unavailable',
        error: 'api_unavailable',
        message: 'Accounts and server features are offline in this free build. Guest play still works.'
      };
      return Promise.resolve(new Response(JSON.stringify(body), {
        status: 503,
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
      }));
    }
    return nativeFetch(input, init);
  };
})();
