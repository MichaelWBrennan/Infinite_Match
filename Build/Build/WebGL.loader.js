var createUnityInstance = (function() {
  "use strict";
  
  var buildUrl = "Build";
  var config = {
    dataUrl: buildUrl + "/WebGL.data",
    frameworkUrl: buildUrl + "/WebGL.framework.js",
    codeUrl: buildUrl + "/WebGL.wasm",
    streamingAssetsUrl: "StreamingAssets",
    companyName: "Infinite Match",
    productName: "Infinite Match - Match 3 Game",
    productVersion: "1.0.0",
    memoryUrl: buildUrl + "/WebGL.mem",
    symbolsUrl: buildUrl + "/WebGL.symbols.json"
  };

  var progress = 0;
  var totalSize = 0;
  var loadedSize = 0;
  var unityInstance = null;

  function loadScript(url, onLoad, onError) {
    var script = document.createElement("script");
    script.src = url;
    script.onload = onLoad;
    script.onerror = onError;
    document.head.appendChild(script);
  }

  function loadBinary(url, onLoad, onError) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "arraybuffer";
    xhr.onload = function() {
      if (xhr.status === 200) {
        onLoad(xhr.response);
      } else {
        onError("Failed to load " + url);
      }
    };
    xhr.onerror = onError;
    xhr.send();
  }

  function loadData() {
    return new Promise(function(resolve, reject) {
      loadBinary(config.dataUrl, function(data) {
        totalSize += data.byteLength;
        loadedSize += data.byteLength;
        progress = loadedSize / totalSize;
        console.log("WebGL.data loaded:", data.byteLength, "bytes");
        resolve(data);
      }, reject);
    });
  }

  function loadWasm() {
    return new Promise(function(resolve, reject) {
      loadBinary(config.codeUrl, function(wasm) {
        totalSize += wasm.byteLength;
        loadedSize += wasm.byteLength;
        progress = loadedSize / totalSize;
        console.log("WebGL.wasm loaded:", wasm.byteLength, "bytes");
        resolve(wasm);
      }, reject);
    });
  }

  function loadFramework() {
    return new Promise(function(resolve, reject) {
      loadScript(config.frameworkUrl, function() {
        totalSize += 1000000; // Estimate
        loadedSize += 1000000;
        progress = loadedSize / totalSize;
        console.log("Unity framework loaded");
        resolve();
      }, reject);
    });
  }

  function createUnityInstance(canvas, config, onProgress) {
    return new Promise(function(resolve, reject) {
      console.log("Creating Unity instance with config:", config);
      
      // Reset progress
      progress = 0;
      totalSize = 0;
      loadedSize = 0;
      
      // Load all components
      Promise.all([
        loadFramework(),
        loadData(),
        loadWasm()
      ]).then(function() {
        console.log("All Unity components loaded successfully");
        
        // Create Unity instance
        if (typeof UnityFramework !== 'undefined') {
          unityInstance = UnityFramework.initialize();
          
          // Add Unity-specific methods
          unityInstance.SetFullscreen = function(fullscreen) {
            if (fullscreen) {
              if (canvas.requestFullscreen) {
                canvas.requestFullscreen();
              } else if (canvas.webkitRequestFullscreen) {
                canvas.webkitRequestFullscreen();
              } else if (canvas.mozRequestFullScreen) {
                canvas.mozRequestFullScreen();
              } else if (canvas.msRequestFullscreen) {
                canvas.msRequestFullscreen();
              }
            } else {
              if (document.exitFullscreen) {
                document.exitFullscreen();
              } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
              } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
              } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
              }
            }
          };
          
          unityInstance.SendMessage = function(gameObject, methodName, value) {
            console.log("Unity SendMessage:", gameObject, methodName, value);
            
            // Handle common Unity messages
            switch(methodName) {
              case "OnGameStart":
                if (typeof window.GameAPI !== 'undefined') {
                  window.GameAPI.trackEvent('game_started', { source: 'unity' });
                }
                break;
              case "OnGameEnd":
                if (typeof window.GameAPI !== 'undefined') {
                  window.GameAPI.trackEvent('game_ended', { source: 'unity' });
                }
                break;
              case "OnScoreUpdate":
                if (typeof window.GameAPI !== 'undefined') {
                  window.GameAPI.trackEvent('score_updated', { 
                    score: parseInt(value) || 0,
                    source: 'unity'
                  });
                }
                break;
            }
          };
          
          unityInstance.Quit = function() {
            console.log("Unity Quit called");
            if (typeof window.GameAPI !== 'undefined') {
              window.GameAPI.trackEvent('game_quit', { source: 'unity' });
            }
          };
          
          // Complete loading
          if (onProgress) {
            onProgress(1.0);
          }
          
          console.log("Unity instance created successfully");
          resolve(unityInstance);
        } else {
          reject(new Error("Unity framework not loaded"));
        }
      }).catch(function(error) {
        console.error("Failed to load Unity components:", error);
        reject(error);
      });
      
      // Update progress during loading
      var progressInterval = setInterval(function() {
        if (onProgress && progress < 1.0) {
          onProgress(progress);
        }
        if (progress >= 1.0) {
          clearInterval(progressInterval);
        }
      }, 50);
    });
  }

  return createUnityInstance;
})();