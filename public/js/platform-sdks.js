// Self-hosted Platform SDKs
// This file provides mock implementations of platform SDKs for offline development

(function() {
  'use strict';
  
  // Kongregate SDK Mock
  window.kongregate = window.kongregate || {
    services: {
      getUser: function(callback) {
        callback({ userId: 'mock_user_' + Math.random().toString(36).substr(2, 9) });
      },
      getStats: function(callback) {
        callback({});
      },
      submitStats: function(statName, value, callback) {
        console.log('Kongregate stat submitted:', statName, value);
        if (callback) callback(true);
      }
    }
  };
  
  // Facebook Instant Games SDK Mock
  window.FBInstant = window.FBInstant || {
    initializeAsync: function() {
      return Promise.resolve();
    },
    startGameAsync: function() {
      return Promise.resolve();
    },
    player: {
      getID: function() {
        return 'mock_fb_player_' + Math.random().toString(36).substr(2, 9);
      },
      getName: function() {
        return 'Mock Player';
      },
      getPhoto: function() {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM2MzY2RjEiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDEyQzE0LjIwOTEgMTIgMTYgMTAuMjA5MSAxNiA4QzE2IDUuNzkwODYgMTQuMjA5MSA0IDEyIDRDOS43OTA4NiA0IDggNS43OTA4NiA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTIgMTRDOC42ODYyOSAxNCA2IDE2LjY4NjMgNiAyMEgxOEMxOCAxNi42ODYzIDE1LjMxMzcgMTQgMTIgMTRaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+';
      }
    },
    context: {
      getID: function() {
        return 'mock_context_' + Math.random().toString(36).substr(2, 9);
      },
      getType: function() {
        return 'POST';
      }
    },
    payments: {
      getCatalogAsync: function() {
        return Promise.resolve([]);
      },
      purchaseAsync: function(productID) {
        return Promise.resolve({ productID: productID, purchaseToken: 'mock_token' });
      }
    }
  };
  
  // TikTok Mini Games SDK Mock
  window.tt = window.tt || {
    getSystemInfoSync: function() {
      return {
        platform: 'web',
        version: '1.0.0',
        SDKVersion: '1.0.0'
      };
    },
    login: function(options) {
      console.log('TikTok login mock');
      if (options.success) {
        options.success({ code: 'mock_code_' + Math.random().toString(36).substr(2, 9) });
      }
    },
    request: function(options) {
      console.log('TikTok request mock:', options.url);
      if (options.success) {
        options.success({ data: {} });
      }
    }
  };
  
  // Snap Mini Games SDK Mock
  window.snap = window.snap || {
    game: {
      start: function() {
        console.log('Snap game started');
      },
      end: function() {
        console.log('Snap game ended');
      }
    },
    user: {
      getData: function(callback) {
        callback({ id: 'mock_snap_user_' + Math.random().toString(36).substr(2, 9) });
      }
    }
  };
  
  // Poki SDK Mock
  window.pokiSDK = window.pokiSDK || {
    init: function() {
      console.log('Poki SDK initialized');
    },
    gameLoadingStart: function() {
      console.log('Poki game loading started');
    },
    gameLoadingFinished: function() {
      console.log('Poki game loading finished');
    },
    gameplayStart: function() {
      console.log('Poki gameplay started');
    },
    gameplayStop: function() {
      console.log('Poki gameplay stopped');
    },
    commercialBreak: function(callback) {
      console.log('Poki commercial break');
      if (callback) callback();
    },
    rewardedBreak: function(callback) {
      console.log('Poki rewarded break');
      if (callback) callback();
    }
  };
  
  console.log('Platform SDKs loaded (mock mode)');
  
})();