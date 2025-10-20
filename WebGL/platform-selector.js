/**
 * Platform Selector - Dynamically loads platform configuration
 * This script determines which platform the game is running on and loads the appropriate config
 */

class PlatformSelector {
    constructor() {
        this.currentPlatform = null;
        this.platformConfig = null;
        this.platformAPI = null;
    }

    /**
     * Detect the current platform based on URL, user agent, and available APIs
     */
    detectPlatform() {
        const url = window.location.href;
        const userAgent = navigator.userAgent;
        const hostname = window.location.hostname;

        // Check for platform-specific indicators
        if (url.includes('poki.com') || url.includes('poki')) {
            return 'poki';
        }
        if (url.includes('facebook.com') || url.includes('fb.gg') || typeof FBInstant !== 'undefined') {
            return 'facebook';
        }
        if (url.includes('crazygames.com') || typeof CrazyGames !== 'undefined') {
            return 'crazygames';
        }
        if (url.includes('kongregate.com') || typeof kongregate !== 'undefined') {
            return 'kongregate';
        }
        if (url.includes('gamecrazy.com') || typeof gameCrazy !== 'undefined') {
            return 'gamecrazy';
        }
        if (url.includes('tiktok.com') || typeof tt !== 'undefined') {
            return 'tiktok';
        }
        if (url.includes('snapchat.com') || typeof snap !== 'undefined') {
            return 'snap';
        }
        if (hostname.includes('vercel.app') || hostname.includes('vercel.com')) {
            return 'vercel';
        }

        // Default fallback
        return 'vercel';
    }

    /**
     * Load platform configuration from the platforms directory
     */
    async loadPlatformConfig(platform) {
        try {
            const response = await fetch(`platforms/${platform}.json`);
            if (response.ok) {
                this.platformConfig = await response.json();
                console.log(`✅ Platform config loaded: ${this.platformConfig.name}`);
                return this.platformConfig;
            } else {
                throw new Error(`Failed to load platform config for ${platform}`);
            }
        } catch (error) {
            console.error(`❌ Failed to load platform config for ${platform}:`, error);
            // Fallback to default config
            this.platformConfig = {
                platform: 'default',
                name: 'Default',
                description: 'Infinite Match - Industry Leading Match 3 Game',
                features: {
                    ads: false,
                    iap: false,
                    social: false,
                    analytics: true,
                    achievements: false,
                    chat: false
                },
                ui: {
                    theme: 'dark',
                    primaryColor: '#667eea',
                    secondaryColor: '#764ba2'
                },
                gameplay: {
                    autoStart: true,
                    pauseOnBlur: true,
                    resumeOnFocus: true
                }
            };
            return this.platformConfig;
        }
    }

    /**
     * Load platform-specific SDK
     */
    loadPlatformSDK() {
        if (!this.platformConfig || !this.platformConfig.sdkUrl) {
            console.log('⚠️ No platform SDK URL, skipping SDK load');
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = this.platformConfig.sdkUrl;
            script.onload = () => {
                console.log(`✅ Platform SDK loaded: ${this.platformConfig.platform}`);
                resolve();
            };
            script.onerror = () => {
                console.error(`❌ Failed to load platform SDK: ${this.platformConfig.platform}`);
                reject(new Error(`Failed to load SDK for ${this.platformConfig.platform}`));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Initialize platform detection and configuration loading
     */
    async initialize() {
        try {
            // Detect platform
            this.currentPlatform = this.detectPlatform();
            console.log(`🎮 Detected platform: ${this.currentPlatform}`);

            // Load platform configuration
            await this.loadPlatformConfig(this.currentPlatform);

            // Load platform SDK
            await this.loadPlatformSDK();

            // Update page metadata
            this.updatePageMetadata();

            // Initialize platform API
            this.initializePlatformAPI();

            return {
                platform: this.currentPlatform,
                config: this.platformConfig,
                api: this.platformAPI
            };
        } catch (error) {
            console.error('❌ Platform initialization failed:', error);
            throw error;
        }
    }

    /**
     * Update page title and description based on platform
     */
    updatePageMetadata() {
        if (this.platformConfig) {
            if (this.platformConfig.name) {
                document.title = `Infinite Match - ${this.platformConfig.name}`;
            }
            if (this.platformConfig.description) {
                const metaDescription = document.querySelector('meta[name="description"]');
                if (metaDescription) {
                    metaDescription.setAttribute('content', this.platformConfig.description);
                }
            }
        }
    }

    /**
     * Initialize platform-specific API wrapper
     */
    initializePlatformAPI() {
        if (!this.platformConfig) return;

        this.platformAPI = {
            // Get platform info
            getPlatform: () => this.currentPlatform,
            getPlatformName: () => this.platformConfig.name,
            getFeatures: () => this.platformConfig.features,

            // Ad functions
            showAd: (type = 'banner') => {
                if (!this.platformConfig.features.ads) return Promise.resolve();
                return this.callPlatformAPI('showAd', type);
            },
            showRewardedAd: () => {
                if (!this.platformConfig.features.ads) return Promise.resolve();
                return this.callPlatformAPI('showRewardedAd');
            },
            showInterstitialAd: () => {
                if (!this.platformConfig.features.ads) return Promise.resolve();
                return this.callPlatformAPI('showInterstitialAd');
            },
            isAdBlocked: () => {
                if (!this.platformConfig.features.ads) return false;
                return this.callPlatformAPI('isAdBlocked');
            },
            isAdFree: () => {
                if (!this.platformConfig.features.ads) return false;
                return this.callPlatformAPI('isAdFree');
            },

            // Analytics functions
            trackEvent: (eventName, data = {}) => {
                if (!this.platformConfig.features.analytics) return;
                return this.callPlatformAPI('trackEvent', eventName, data);
            },

            // User functions
            getUserInfo: () => {
                if (!this.platformConfig.features.social) return null;
                return this.callPlatformAPI('getUserInfo');
            },

            // Gameplay functions
            gameplayStart: () => {
                this.trackEvent('gameplay_start');
            },
            gameplayStop: () => {
                this.trackEvent('gameplay_stop');
            }
        };
    }

    /**
     * Call platform-specific API function
     */
    callPlatformAPI(apiName, ...args) {
        if (!this.platformConfig || !this.platformConfig.api || !this.platformConfig.api[apiName]) {
            console.warn(`⚠️ API function ${apiName} not available for platform ${this.currentPlatform}`);
            return Promise.resolve();
        }

        try {
            const apiPath = this.platformConfig.api[apiName];
            const apiFunction = this.resolveAPIPath(apiPath);
            
            if (typeof apiFunction === 'function') {
                return apiFunction(...args);
            } else {
                console.warn(`⚠️ API function ${apiName} is not callable`);
                return Promise.resolve();
            }
        } catch (error) {
            console.error(`❌ Error calling platform API ${apiName}:`, error);
            return Promise.resolve();
        }
    }

    /**
     * Resolve API path to actual function
     */
    resolveAPIPath(path) {
        const parts = path.split('.');
        let current = window;
        
        for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            } else {
                return null;
            }
        }
        
        return current;
    }

    /**
     * Get the unified API for external use
     */
    getUnifiedAPI() {
        return this.platformAPI;
    }

    /**
     * Get current platform configuration
     */
    getConfig() {
        return this.platformConfig;
    }
}

// Export for use in other scripts
window.PlatformSelector = PlatformSelector;