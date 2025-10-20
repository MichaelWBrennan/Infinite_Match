// Mobile WebGL Support JavaScript
// Provides mobile device detection and optimization for WebGL builds

var MobileWebGLSupport = {
    isInitialized: false,
    isMobileDevice: false,
    deviceInfo: null,
    performanceLevel: 'medium',
    
    // Initialize mobile WebGL support
    init: function() {
        if (this.isInitialized) return;
        
        console.log('🌐 Initializing Mobile WebGL Support...');
        
        // Detect mobile device
        this.isMobileDevice = this.detectMobileDevice();
        
        if (this.isMobileDevice) {
            console.log('📱 Mobile device detected for WebGL build');
            this.setupMobileOptimizations();
        } else {
            console.log('🖥️ Desktop device detected for WebGL build');
        }
        
        this.isInitialized = true;
    },
    
    // Detect if the current device is mobile
    detectMobileDevice: function() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        
        // Check for mobile indicators
        const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
        const isMobile = mobileRegex.test(userAgent);
        
        // Check for touch support
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Check screen size (mobile typically < 768px)
        const isSmallScreen = window.innerWidth < 768 || window.innerHeight < 768;
        
        // Check for mobile-specific features
        const hasMobileFeatures = 'orientation' in window || 'devicePixelRatio' in window;
        
        return isMobile || (hasTouch && (isSmallScreen || hasMobileFeatures));
    },
    
    // Get detailed device information
    getDeviceInfo: function() {
        if (this.deviceInfo) return this.deviceInfo;
        
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const platform = navigator.platform || 'unknown';
        const language = navigator.language || 'unknown';
        const cookieEnabled = navigator.cookieEnabled;
        const onLine = navigator.onLine;
        const hardwareConcurrency = navigator.hardwareConcurrency || 1;
        const memory = navigator.deviceMemory || 'unknown';
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        this.deviceInfo = {
            userAgent: userAgent,
            platform: platform,
            language: language,
            cookieEnabled: cookieEnabled,
            onLine: onLine,
            hardwareConcurrency: hardwareConcurrency,
            memory: memory,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            pixelRatio: window.devicePixelRatio || 1,
            touchSupport: 'ontouchstart' in window,
            maxTouchPoints: navigator.maxTouchPoints || 0,
            connectionType: connection ? connection.effectiveType : 'unknown',
            connectionDownlink: connection ? connection.downlink : 'unknown'
        };
        
        return this.deviceInfo;
    },
    
    // Setup mobile-specific optimizations
    setupMobileOptimizations: function() {
        // Set mobile viewport
        this.setMobileViewport();
        
        // Enable touch optimizations
        this.enableTouchOptimizations();
        
        // Set up performance monitoring
        this.setupPerformanceMonitoring();
        
        // Optimize for mobile
        this.optimizeForMobile();
    },
    
    // Set mobile viewport
    setMobileViewport: function() {
        // Ensure viewport meta tag is set for mobile
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        
        // Prevent zoom on double tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(event) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        
        console.log('📱 Mobile viewport configured');
    },
    
    // Enable touch optimizations
    enableTouchOptimizations: function() {
        // Prevent default touch behaviors that interfere with game
        document.addEventListener('touchstart', function(e) {
            if (e.touches.length > 1) {
                e.preventDefault(); // Prevent zoom
            }
        }, { passive: false });
        
        document.addEventListener('touchmove', function(e) {
            if (e.touches.length > 1) {
                e.preventDefault(); // Prevent zoom
            }
        }, { passive: false });
        
        // Prevent context menu on long press
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        });
        
        // Prevent text selection
        document.addEventListener('selectstart', function(e) {
            e.preventDefault();
        });
        
        console.log('👆 Touch optimizations enabled');
    },
    
    // Setup performance monitoring
    setupPerformanceMonitoring: function() {
        let frameCount = 0;
        let lastTime = performance.now();
        let fps = 0;
        
        const measureFPS = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                frameCount = 0;
                lastTime = currentTime;
                
                // Log performance every 5 seconds
                if (fps % 5 === 0) {
                    console.log(`📊 Mobile WebGL Performance - FPS: ${fps}`);
                }
                
                // Adjust quality based on performance
                this.adjustQualityBasedOnPerformance(fps);
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        requestAnimationFrame(measureFPS);
    },
    
    // Adjust quality based on performance
    adjustQualityBasedOnPerformance: function(fps) {
        const targetFPS = 30;
        const qualityThreshold = 0.8;
        
        if (fps < targetFPS * qualityThreshold) {
            // Reduce quality
            this.setMobileQuality(0);
        } else if (fps > targetFPS * 1.2) {
            // Increase quality
            this.setMobileQuality(2);
        }
    },
    
    // Optimize for mobile
    optimizeForMobile: function() {
        // Reduce memory usage
        this.optimizeMemory();
        
        // Optimize rendering
        this.optimizeRendering();
        
        // Optimize input
        this.optimizeInput();
        
        console.log('⚡ Mobile optimizations applied');
    },
    
    // Optimize memory usage
    optimizeMemory: function() {
        // Enable garbage collection hints
        if (window.gc) {
            setInterval(() => {
                window.gc();
            }, 10000); // GC every 10 seconds
        }
        
        // Monitor memory usage
        if (performance.memory) {
            setInterval(() => {
                const memory = performance.memory;
                const usedMB = memory.usedJSHeapSize / 1024 / 1024;
                const totalMB = memory.totalJSHeapSize / 1024 / 1024;
                
                if (usedMB > totalMB * 0.8) {
                    console.warn('⚠️ High memory usage detected:', usedMB.toFixed(2) + 'MB');
                    this.triggerMemoryCleanup();
                }
            }, 5000);
        }
    },
    
    // Optimize rendering
    optimizeRendering: function() {
        // Reduce frame rate for mobile
        this.setMobileFrameRate(30);
        
        // Disable expensive effects
        this.disableExpensiveEffects();
    },
    
    // Optimize input
    optimizeInput: function() {
        // Enable touch events
        this.enableTouchEvents();
        
        // Optimize gesture recognition
        this.setupGestureRecognition();
    },
    
    // Set mobile quality level
    setMobileQuality: function(level) {
        // This would communicate with Unity WebGL build
        if (window.unityInstance && window.unityInstance.SendMessage) {
            window.unityInstance.SendMessage('MobileWebGLSupport', 'SetMobileQuality', level.toString());
        }
        
        console.log('🎨 Mobile quality set to level:', level);
    },
    
    // Set mobile frame rate
    setMobileFrameRate: function(frameRate) {
        // This would communicate with Unity WebGL build
        if (window.unityInstance && window.unityInstance.SendMessage) {
            window.unityInstance.SendMessage('MobileWebGLSupport', 'SetMobileFrameRate', frameRate.toString());
        }
        
        console.log('⏱️ Mobile frame rate set to:', frameRate);
    },
    
    // Disable expensive effects
    disableExpensiveEffects: function() {
        // This would communicate with Unity WebGL build
        if (window.unityInstance && window.unityInstance.SendMessage) {
            window.unityInstance.SendMessage('MobileWebGLSupport', 'DisableExpensiveEffects', '');
        }
    },
    
    // Enable touch events
    enableTouchEvents: function() {
        // Touch events are already enabled in setupMobileOptimizations
        console.log('👆 Touch events enabled');
    },
    
    // Setup gesture recognition
    setupGestureRecognition: function() {
        let startX, startY, startTime;
        
        document.addEventListener('touchstart', function(e) {
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            startTime = Date.now();
        });
        
        document.addEventListener('touchend', function(e) {
            const touch = e.changedTouches[0];
            const endX = touch.clientX;
            const endY = touch.clientY;
            const endTime = Date.now();
            
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            const deltaTime = endTime - startTime;
            
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            if (distance < 10 && deltaTime < 500) {
                // Tap gesture
                MobileWebGLSupport.handleGesture('tap', startX, startY, endX, endY);
            } else if (distance > 50 && deltaTime < 1000) {
                // Swipe gesture
                const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
                let direction = 'right';
                
                if (angle > -45 && angle <= 45) direction = 'right';
                else if (angle > 45 && angle <= 135) direction = 'down';
                else if (angle > 135 || angle <= -135) direction = 'left';
                else direction = 'up';
                
                MobileWebGLSupport.handleGesture('swipe' + direction, startX, startY, endX, endY);
            }
        });
        
        console.log('👆 Gesture recognition enabled');
    },
    
    // Handle gesture
    handleGesture: function(type, startX, startY, endX, endY) {
        console.log('👆 Gesture detected:', type, 'from', startX, startY, 'to', endX, endY);
        
        // Send gesture to Unity
        if (window.unityInstance && window.unityInstance.SendMessage) {
            const gestureData = {
                type: type,
                startX: startX,
                startY: startY,
                endX: endX,
                endY: endY
            };
            window.unityInstance.SendMessage('MobileWebGLSupport', 'HandleGesture', JSON.stringify(gestureData));
        }
    },
    
    // Trigger memory cleanup
    triggerMemoryCleanup: function() {
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
        // Clear any caches
        if (window.caches) {
            window.caches.keys().then(function(names) {
                names.forEach(function(name) {
                    window.caches.delete(name);
                });
            });
        }
        
        console.log('🧹 Memory cleanup triggered');
    },
    
    // Get performance metrics
    getPerformanceMetrics: function() {
        const metrics = {
            fps: 0, // This would be calculated in the FPS monitoring
            memory: performance.memory ? {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            } : null,
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink
            } : null,
            deviceInfo: this.getDeviceInfo()
        };
        
        return metrics;
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        MobileWebGLSupport.init();
    });
} else {
    MobileWebGLSupport.init();
}

// Export for Unity
window.MobileWebGLSupport = MobileWebGLSupport;