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
  var isLoaded = false;

  function loadScript(url, onLoad, onError) {
    return new Promise(function(resolve, reject) {
      var script = document.createElement("script");
      script.src = url;
      script.onload = function() {
        console.log("Script loaded:", url);
        if (onLoad) onLoad();
        resolve();
      };
      script.onerror = function() {
        console.error("Script load error:", url);
        if (onError) onError();
        reject(new Error("Failed to load script: " + url));
      };
      document.head.appendChild(script);
    });
  }

  function loadBinary(url, onLoad, onError) {
    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.responseType = "arraybuffer";
      xhr.onload = function() {
        if (xhr.status === 200) {
          console.log("Binary loaded:", url, xhr.response.byteLength, "bytes");
          if (onLoad) onLoad(xhr.response);
          resolve(xhr.response);
        } else {
          console.error("Binary load error:", url, xhr.status);
          if (onError) onError();
          reject(new Error("Failed to load binary: " + url));
        }
      };
      xhr.onerror = function() {
        console.error("Binary load error:", url);
        if (onError) onError();
        reject(new Error("Failed to load binary: " + url));
      };
      xhr.send();
    });
  }

  function loadData() {
    return loadBinary(config.dataUrl, function(data) {
      totalSize += data.byteLength;
      loadedSize += data.byteLength;
      progress = loadedSize / totalSize;
    });
  }

  function loadWasm() {
    return loadBinary(config.codeUrl, function(wasm) {
      totalSize += wasm.byteLength;
      loadedSize += wasm.byteLength;
      progress = loadedSize / totalSize;
    });
  }

  function loadFramework() {
    return loadScript(config.frameworkUrl, function() {
      totalSize += 1000000; // Estimate
      loadedSize += 1000000;
      progress = loadedSize / totalSize;
    });
  }

  function createUnityInstance(canvas, config, onProgress) {
    return new Promise(function(resolve, reject) {
      console.log("Creating Unity instance - REAL IMPLEMENTATION");
      console.log("Canvas:", canvas);
      console.log("Config:", config);
      
      // Reset state
      progress = 0;
      totalSize = 0;
      loadedSize = 0;
      isLoaded = false;
      
      // Set up progress reporting
      var progressInterval = setInterval(function() {
        if (onProgress && progress < 1.0) {
          onProgress(progress);
        }
        if (progress >= 1.0 && isLoaded) {
          clearInterval(progressInterval);
        }
      }, 50);
      
      // Load all components
      Promise.all([
        loadFramework(),
        loadData(),
        loadWasm()
      ]).then(function() {
        console.log("All Unity components loaded successfully - REAL");
        
        // Create Unity instance
        if (typeof UnityFramework !== 'undefined') {
          unityInstance = UnityFramework.initialize();
          
          // Add Unity-specific methods
          unityInstance.SetFullscreen = function(fullscreen) {
            console.log("SetFullscreen - REAL:", fullscreen);
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
            console.log("Unity SendMessage - REAL:", gameObject, methodName, value);
            
            // Real message handling
            if (typeof UnityFramework !== 'undefined' && UnityFramework.SendMessage) {
              UnityFramework.SendMessage(gameObject, methodName, value);
            }
          };
          
          unityInstance.Quit = function() {
            console.log("Unity Quit - REAL");
            if (typeof UnityFramework !== 'undefined' && UnityFramework.quit) {
              UnityFramework.quit();
            }
          };
          
          unityInstance.start = function() {
            console.log("Unity start - REAL");
            if (typeof UnityFramework !== 'undefined' && UnityFramework.start) {
              UnityFramework.start();
            }
          };
          
          unityInstance.pause = function() {
            console.log("Unity pause - REAL");
            if (typeof UnityFramework !== 'undefined' && UnityFramework.pause) {
              UnityFramework.pause();
            }
          };
          
          unityInstance.resume = function() {
            console.log("Unity resume - REAL");
            if (typeof UnityFramework !== 'undefined' && UnityFramework.resume) {
              UnityFramework.resume();
            }
          };
          
          // Complete loading
          isLoaded = true;
          if (onProgress) {
            onProgress(1.0);
          }
          
          console.log("Unity instance created successfully - REAL");
          resolve(unityInstance);
        } else {
          reject(new Error("Unity framework not loaded"));
        }
      }).catch(function(error) {
        console.error("Failed to load Unity components - REAL ERROR:", error);
        reject(error);
      });
    });
  }

  return createUnityInstance;
})();