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
            
            // Return a mock Unity instance with game-like behavior
            return Promise.resolve({
                // Mock Unity instance methods
                SendMessage: function(gameObject, method, value) {
                    console.log("SendMessage:", gameObject, method, value);
                },
                
                SetFullscreen: function(fullscreen) {
                    console.log("SetFullscreen:", fullscreen);
                    if (fullscreen && canvas.requestFullscreen) {
                        canvas.requestFullscreen();
                    }
                },
                
                Quit: function() {
                    console.log("Unity Quit called");
                },
                
                // Mock game state
                isLoaded: true,
                isPlaying: true,
                
                // Add some visual feedback to the canvas
                start: function() {
                    // Add a simple game-like visual to the canvas
                    var ctx = canvas.getContext('2d');
                    if (ctx) {
                        // Draw a simple game scene
                        ctx.fillStyle = '#2a2a2a';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        
                        // Draw a simple game title
                        ctx.fillStyle = '#ffffff';
                        ctx.font = '24px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText('Unity WebGL Game', canvas.width/2, canvas.height/2 - 20);
                        
                        // Draw a simple instruction
                        ctx.font = '16px Arial';
                        ctx.fillStyle = '#cccccc';
                        ctx.fillText('Double-click for fullscreen', canvas.width/2, canvas.height/2 + 20);
                        
                        // Draw a simple game element (moving circle)
                        var x = 50;
                        var y = 50;
                        var dx = 2;
                        var dy = 1;
                        
                        function animate() {
                            ctx.fillStyle = '#2a2a2a';
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                            
                            ctx.fillStyle = '#ffffff';
                            ctx.font = '24px Arial';
                            ctx.textAlign = 'center';
                            ctx.fillText('Unity WebGL Game', canvas.width/2, canvas.height/2 - 20);
                            
                            ctx.font = '16px Arial';
                            ctx.fillStyle = '#cccccc';
                            ctx.fillText('Double-click for fullscreen', canvas.width/2, canvas.height/2 + 20);
                            
                            // Draw moving circle
                            ctx.fillStyle = '#4CAF50';
                            ctx.beginPath();
                            ctx.arc(x, y, 20, 0, 2 * Math.PI);
                            ctx.fill();
                            
                            x += dx;
                            y += dy;
                            
                            if (x <= 20 || x >= canvas.width - 20) dx = -dx;
                            if (y <= 20 || y >= canvas.height - 20) dy = -dy;
                            
                            requestAnimationFrame(animate);
                        }
                        
                        animate();
                    }
                }
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
