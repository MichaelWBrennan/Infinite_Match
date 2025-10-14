var createUnityInstance = (function() {
  "use strict";
  
  var buildUrl = "Build";
  var config = {
    dataUrl: buildUrl + "/WebGL.data",
    frameworkUrl: buildUrl + "/WebGL.framework.js",
    codeUrl: buildUrl + "/WebGL.wasm",
    streamingAssetsUrl: "StreamingAssets",
    companyName: "Poki Game",
    productName: "Match3 Unity Game",
    productVersion: "1.0",
  };

  var progress = 0;
  var totalSize = 0;
  var loadedSize = 0;

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
        resolve();
      }, reject);
    });
  }

  return function(canvas, config, onProgress) {
    return new Promise(function(resolve, reject) {
      var instance = {
        SetFullscreen: function(fullscreen) {
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
        },
        SendMessage: function(object, method, value) {
          console.log("Unity SendMessage:", object, method, value);
        },
        Quit: function() {
          console.log("Unity Quit called");
        }
      };

      // Simulate loading process
      var loadingInterval = setInterval(function() {
        progress += 0.1;
        if (progress > 1) progress = 1;
        
        if (onProgress) {
          onProgress(progress);
        }
        
        if (progress >= 1) {
          clearInterval(loadingInterval);
          resolve(instance);
        }
      }, 100);
    });
  };
})();