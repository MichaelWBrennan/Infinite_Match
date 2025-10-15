// Unity WebGL Loader
// This is a minimal loader file for Unity WebGL builds

(function() {
    'use strict';
    
    var UnityLoader = {
        name: "UnityLoader",
        version: "1.0.0",
        
        // Create Unity instance
        createUnityInstance: function(canvas, config, onProgress) {
            console.log("Creating Unity instance...");
            
            // Simulate loading progress
            if (onProgress) {
                var progress = 0;
                var interval = setInterval(function() {
                    progress += 0.1;
                    if (progress >= 1) {
                        progress = 1;
                        clearInterval(interval);
                    }
                    onProgress(progress);
                }, 100);
            }
            
            // Return a mock Unity instance
            return Promise.resolve({
                // Mock Unity instance methods
                SendMessage: function(gameObject, method, value) {
                    console.log("SendMessage:", gameObject, method, value);
                },
                
                SetFullscreen: function(fullscreen) {
                    console.log("SetFullscreen:", fullscreen);
                    if (fullscreen) {
                        canvas.requestFullscreen();
                    }
                },
                
                Quit: function() {
                    console.log("Unity Quit called");
                },
                
                // Mock game state
                isLoaded: true,
                isPlaying: true
            });
        }
    };
    
    // Make createUnityInstance globally available
    window.createUnityInstance = UnityLoader.createUnityInstance;
    
    // Export for module systems
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = UnityLoader;
    }
})();
