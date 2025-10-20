/**
 * Device Detection and UI Switching
 * Detects mobile vs desktop and switches UI accordingly
 */

class DeviceDetector {
    constructor() {
        this.deviceType = null;
        this.isMobile = false;
        this.isTablet = false;
        this.isDesktop = false;
        this.screenSize = null;
        this.orientation = null;
        this.touchSupport = false;
        this.userAgent = navigator.userAgent;
        this.platform = navigator.platform;
        
        this.detectDevice();
        this.setupEventListeners();
    }

    /**
     * Detect device type based on user agent and screen size
     */
    detectDevice() {
        // Check for touch support
        this.touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Check screen size
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.screenSize = { width, height };
        
        // Detect orientation
        this.orientation = width > height ? 'landscape' : 'portrait';
        
        // Mobile detection
        const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
        const isMobileUA = mobileRegex.test(this.userAgent);
        
        // Tablet detection
        const tabletRegex = /iPad|Android(?!.*Mobile)|Tablet/i;
        const isTabletUA = tabletRegex.test(this.userAgent);
        
        // Screen size based detection
        const isMobileScreen = width <= 768 || height <= 768;
        const isTabletScreen = (width > 768 && width <= 1024) || (height > 768 && height <= 1024);
        
        // Determine device type
        if (isMobileUA || (isMobileScreen && this.touchSupport)) {
            this.deviceType = 'mobile';
            this.isMobile = true;
        } else if (isTabletUA || (isTabletScreen && this.touchSupport)) {
            this.deviceType = 'tablet';
            this.isTablet = true;
        } else {
            this.deviceType = 'desktop';
            this.isDesktop = true;
        }
        
        console.log(`📱 Device detected: ${this.deviceType}`, {
            userAgent: this.userAgent,
            screenSize: this.screenSize,
            orientation: this.orientation,
            touchSupport: this.touchSupport
        });
    }

    /**
     * Setup event listeners for orientation and resize changes
     */
    setupEventListeners() {
        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.detectDevice();
                this.onDeviceChange();
            }, 100);
        });

        // Handle resize
        window.addEventListener('resize', () => {
            this.detectDevice();
            this.onDeviceChange();
        });

        // Handle visibility change (mobile app switching)
        document.addEventListener('visibilitychange', () => {
            if (this.isMobile) {
                this.onMobileVisibilityChange();
            }
        });
    }

    /**
     * Called when device type changes
     */
    onDeviceChange() {
        console.log(`🔄 Device changed to: ${this.deviceType}`);
        
        // Update UI based on new device type
        this.updateUIForDevice();
        
        // Notify other components
        window.dispatchEvent(new CustomEvent('deviceChanged', {
            detail: {
                deviceType: this.deviceType,
                isMobile: this.isMobile,
                isTablet: this.isTablet,
                isDesktop: this.isDesktop,
                screenSize: this.screenSize,
                orientation: this.orientation
            }
        }));
    }

    /**
     * Handle mobile visibility changes (app switching)
     */
    onMobileVisibilityChange() {
        if (document.hidden) {
            console.log('📱 App backgrounded');
            // Pause game when app is backgrounded
            if (window.sharedGame && !window.sharedGame.isPaused) {
                window.sharedGame.pauseGame();
            }
        } else {
            console.log('📱 App foregrounded');
            // Resume game when app is foregrounded
            if (window.sharedGame && window.sharedGame.isPaused) {
                window.sharedGame.resumeGame();
            }
        }
    }

    /**
     * Update UI based on current device type
     */
    updateUIForDevice() {
        const container = document.getElementById('unity-container');
        if (!container) return;

        // Remove existing device classes
        container.classList.remove('unity-mobile', 'unity-tablet', 'unity-desktop');
        
        // Add appropriate device class
        container.classList.add(`unity-${this.deviceType}`);
        
        // Update canvas sizing for different devices
        this.updateCanvasForDevice();
        
        // Update UI layout for device
        this.updateUILayoutForDevice();
    }

    /**
     * Update canvas sizing based on device
     */
    updateCanvasForDevice() {
        const canvas = document.getElementById('unity-canvas');
        if (!canvas) return;

        if (this.isMobile) {
            // Mobile: Full screen with proper aspect ratio
            const maxWidth = Math.min(window.innerWidth, window.innerHeight * 0.8);
            const maxHeight = Math.min(window.innerHeight * 0.8, window.innerWidth * 1.25);
            
            canvas.style.width = maxWidth + 'px';
            canvas.style.height = maxHeight + 'px';
            canvas.style.maxWidth = '100vw';
            canvas.style.maxHeight = '100vh';
        } else if (this.isTablet) {
            // Tablet: Centered with good size
            const maxWidth = Math.min(window.innerWidth * 0.9, 800);
            const maxHeight = Math.min(window.innerHeight * 0.8, 600);
            
            canvas.style.width = maxWidth + 'px';
            canvas.style.height = maxHeight + 'px';
        } else {
            // Desktop: Fixed size with responsive scaling
            const maxWidth = Math.min(window.innerWidth - 40, 960);
            const maxHeight = Math.min(window.innerHeight - 40, 600);
            const aspectRatio = 960 / 600;
            
            let canvasWidth = maxWidth;
            let canvasHeight = maxWidth / aspectRatio;
            
            if (canvasHeight > maxHeight) {
                canvasHeight = maxHeight;
                canvasWidth = maxHeight * aspectRatio;
            }
            
            canvas.style.width = canvasWidth + 'px';
            canvas.style.height = canvasHeight + 'px';
        }
    }

    /**
     * Update UI layout based on device
     */
    updateUILayoutForDevice() {
        // Update game UI positioning
        const gameUI = document.querySelector('.game-ui');
        const gameControls = document.querySelector('.game-controls');
        
        if (this.isMobile) {
            // Mobile: Full screen layout like Royal Match app
            if (gameUI) {
                gameUI.style.top = '0';
                gameUI.style.left = '0';
                gameUI.style.right = '0';
                gameUI.style.height = '60px';
                gameUI.style.padding = '10px 15px';
            }
            
            if (gameControls) {
                gameControls.style.bottom = '20px';
                gameControls.style.left = '50%';
                gameControls.style.transform = 'translateX(-50%)';
                gameControls.style.flexDirection = 'row';
                gameControls.style.gap = '10px';
            }
        } else {
            // Desktop: Overlay layout
            if (gameUI) {
                gameUI.style.top = '20px';
                gameUI.style.left = '20px';
                gameUI.style.right = '20px';
                gameUI.style.height = '80px';
                gameUI.style.padding = '0 20px';
            }
            
            if (gameControls) {
                gameControls.style.bottom = '20px';
                gameControls.style.left = '50%';
                gameControls.style.transform = 'translateX(-50%)';
                gameControls.style.flexDirection = 'row';
                gameControls.style.gap = '15px';
            }
        }
    }

    /**
     * Get device information
     */
    getDeviceInfo() {
        return {
            deviceType: this.deviceType,
            isMobile: this.isMobile,
            isTablet: this.isTablet,
            isDesktop: this.isDesktop,
            screenSize: this.screenSize,
            orientation: this.orientation,
            touchSupport: this.touchSupport,
            userAgent: this.userAgent,
            platform: this.platform
        };
    }

    /**
     * Check if device supports WebGL
     */
    supportsWebGL() {
        if (this.isMobile) {
            // Mobile devices have limited WebGL support
            return this.touchSupport && window.innerWidth >= 320;
        }
        return true;
    }

    /**
     * Get optimal game settings for device
     */
    getOptimalSettings() {
        if (this.isMobile) {
            return {
                boardSize: 8,
                tileSize: 40,
                animationSpeed: 0.3,
                particleCount: 20,
                soundEnabled: false, // Mobile often has sound disabled
                vibrationEnabled: true
            };
        } else if (this.isTablet) {
            return {
                boardSize: 8,
                tileSize: 50,
                animationSpeed: 0.4,
                particleCount: 30,
                soundEnabled: true,
                vibrationEnabled: false
            };
        } else {
            return {
                boardSize: 8,
                tileSize: 60,
                animationSpeed: 0.5,
                particleCount: 50,
                soundEnabled: true,
                vibrationEnabled: false
            };
        }
    }
}

// Export for use in other scripts
window.DeviceDetector = DeviceDetector;