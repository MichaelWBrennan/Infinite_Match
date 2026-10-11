// Offline reconciliation for signed-in level wins (S4). A win whose reward request failed because
// the network was down, or the server failed (5xx), is kept with its attempt id and sent again
// later. The server pays a settled attempt once and returns its receipt for any repeat, so sending
// the same win twice grants nothing new. A win the server refuses (stale, expired, mismatched) is
// dropped with its reason, and no reward is granted for it.
//
// Classic (non-module) script on purpose. It is exported for tests as well as used in the browser.
(function (root) {
  'use strict';

  var KEY = 'infiniteMatch.pendingWins.v1';
  var MAX_ITEMS = 20;
  // Matches the server's attempt age limit (ATTEMPT_MAX_AGE_MS, 3 hours). Older wins are refused anyway.
  var MAX_AGE_MS = 3 * 60 * 60 * 1000;

  // The account a token belongs to, read from the JWT payload. Used only to keep queued wins with
  // the account that earned them; the server still checks the token on every request.
  function playerIdFromToken(token) {
    try {
      var part = String(token || '').split('.')[1];
      if (!part) return '';
      var base64 = part.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) base64 += '=';
      var json = root.atob(base64);
      var payload = JSON.parse(json);
      return typeof payload.playerId === 'string' ? payload.playerId : '';
    } catch {
      return '';
    }
  }

  function create(storage) {
    function read() {
      try {
        var list = JSON.parse(storage.getItem(KEY) || '[]');
        return Array.isArray(list) ? list.filter(function (item) {
          return item && typeof item.attemptId === 'string' && item.body && typeof item.playerId === 'string';
        }) : [];
      } catch {
        return [];
      }
    }

    function write(list) {
      try {
        storage.setItem(KEY, JSON.stringify(list.slice(-MAX_ITEMS)));
      } catch {
        // Storage is full or blocked. The win is lost for this session; the server grants nothing for it.
      }
    }

    function live(list, nowMs) {
      return list.filter(function (item) { return nowMs - item.queuedAt <= MAX_AGE_MS; });
    }

    return {
      // Keeps one entry per attempt id. Newest entries win when the queue is full.
      add: function (playerId, attemptId, body, nowMs) {
        var list = live(read(), nowMs).filter(function (item) { return item.attemptId !== attemptId; });
        list.push({ playerId: playerId, attemptId: attemptId, body: body, queuedAt: nowMs });
        write(list);
      },
      // The queued wins for one account, oldest first. Expired entries are removed.
      pendingFor: function (playerId, nowMs) {
        var all = read();
        var kept = live(all, nowMs);
        if (kept.length !== all.length) write(kept);
        return kept.filter(function (item) { return item.playerId === playerId; });
      },
      remove: function (attemptId) {
        write(read().filter(function (item) { return item.attemptId !== attemptId; }));
      },
      size: function () { return read().length; },
    };
  }

  // Sends each queued win for `playerId` in order. `send(body)` resolves to { ok, status, data }
  // or throws on a network error. Returns one outcome per win:
  //   settled  the server paid it (or confirmed the earlier payment)
  //   refused  the server will not pay it; `reason` is its error code
  //   kept     could not be sent now; it stays queued
  // Stops at the first kept win, so a dead connection does not send the rest in a burst.
  function flush(queue, playerId, send, nowMs) {
    var outcomes = [];
    var items = queue.pendingFor(playerId, nowMs);
    return items.reduce(function (chain, item) {
      return chain.then(function (stop) {
        if (stop) return true;
        return Promise.resolve().then(function () { return send(item.body); }).then(function (res) {
          if (res && res.ok && res.data && res.data.success) {
            queue.remove(item.attemptId);
            outcomes.push({ attemptId: item.attemptId, outcome: 'settled', result: res.data.result });
            return false;
          }
          var status = res ? res.status : 0;
          if (status >= 400 && status < 500) {
            queue.remove(item.attemptId);
            outcomes.push({ attemptId: item.attemptId, outcome: 'refused', reason: (res.data && res.data.error) || 'refused' });
            return false;
          }
          outcomes.push({ attemptId: item.attemptId, outcome: 'kept' });
          return true;
        }, function () {
          outcomes.push({ attemptId: item.attemptId, outcome: 'kept' });
          return true;
        });
      });
    }, Promise.resolve(false)).then(function () { return outcomes; });
  }

  var api = { KEY: KEY, MAX_ITEMS: MAX_ITEMS, MAX_AGE_MS: MAX_AGE_MS, playerIdFromToken: playerIdFromToken, create: create, flush: flush };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.WinQueue = api;
})(typeof window !== 'undefined' ? window : globalThis);
