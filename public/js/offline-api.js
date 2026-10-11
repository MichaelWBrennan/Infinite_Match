// API routing for the static build. Answers /api/* in one of three modes:
//
//   remote   A server address is configured (window.INFINITE_MATCH_API_BASE, or the
//            <meta name="infinite-match-api-base"> tag in index.html). Same-origin /api/* calls
//            go to that server. Only https:// (or http:// on localhost) addresses are accepted.
//   offline  The default on the public static host with no server configured. Every same-origin
//            /api/* request is answered locally with HTTP 503 and a JSON error code, and never
//            leaves the browser. Without this, the catch-all rewrite returned the game page with
//            HTTP 200, which the game treats as success with empty data.
//   live     localhost, or ?api=live. Requests go to the same origin, as in development.
//
// Load this script before the game scripts. It is classic (non-module) JavaScript on purpose.
(function () {
  'use strict';

  var params = new URLSearchParams(location.search);
  var host = location.hostname;
  var isLocal = host === 'localhost' || host === '127.0.0.1' || host === '[::1]';

  function normalizeBase(value) {
    if (typeof value !== 'string' || !value.trim()) return '';
    try {
      var url = new URL(value.trim());
      var localHttp = url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1');
      if (url.protocol !== 'https:' && !localHttp) return '';
      return url.origin;
    } catch (error) {
      return '';
    }
  }

  function configuredBase() {
    var fromWindow = normalizeBase(window.INFINITE_MATCH_API_BASE);
    if (fromWindow) return fromWindow;
    if (typeof document === 'undefined' || !document.querySelector) return '';
    var meta = document.querySelector('meta[name="infinite-match-api-base"]');
    return meta ? normalizeBase(meta.getAttribute('content')) : '';
  }

  var base = configuredBase();
  var offline = !base && !isLocal && params.get('api') !== 'live';
  window.InfiniteMatchApi = { mode: base ? 'remote' : (offline ? 'offline' : 'live'), base: base };

  if (typeof window.fetch !== 'function' || typeof window.Response !== 'function') return;

  var nativeFetch = window.fetch.bind(window);
  var apiPath = /^\/api(\/|$)/;

  function resolveUrl(input) {
    try {
      return new URL(typeof input === 'string' ? input : input.url, location.href);
    } catch (error) {
      return null;
    }
  }

  function isSameOriginApi(target) {
    return !!target && target.origin === location.origin && apiPath.test(target.pathname);
  }

  if (base) {
    window.fetch = function (input, init) {
      var target = resolveUrl(input);
      if (isSameOriginApi(target)) {
        var remote = base + target.pathname + target.search;
        if (typeof input === 'string' || input instanceof URL) return nativeFetch(remote, init);
        return nativeFetch(new Request(remote, input), init);
      }
      return nativeFetch(input, init);
    };
    return;
  }

  if (!offline) return;

  window.fetch = function (input, init) {
    var target = resolveUrl(input);
    if (isSameOriginApi(target)) {
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
