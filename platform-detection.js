// Platform Detection and Configuration
// Detects Kongregate, Game Crazy, or Poki platform and loads appropriate SDK

class PlatformDetector {
    constructor() {
        this.currentPlatform = null;
        this.platformConfig = null;
        this.sdk = null;
    }

    // Detect the current platform
    detectPlatform() {
        const hostname = window.location.hostname.toLowerCase();
        const referrer = document.referrer.toLowerCase();
        
        // Check for Kongregate
        if (hostname.includes('kongregate.com') || 
            referrer.includes('kongregate.com') ||
            window.kongregateAPI) {
            return 'kongregate';
        }
        
        // Check for Game Crazy
        if (hostname.includes('gamecrazy.com') || 
            referrer.includes('gamecrazy.com') ||
            window.gameCrazyAPI) {
            return 'gamecrazy';
        }
        
        // Check for Poki
        if (hostname.includes('poki.com') || 
            referrer.includes('poki.com') ||
            window.pokiSDK) {
            return 'poki';
        }
        
        // Check for local development or direct access
        if (hostname.includes('localhost') || 
            hostname.includes('127.0.0.1') ||
            hostname.includes('vercel.app')) {
            return 'local';
        }
        
        return 'unknown';
    }

    // Get platform configuration
    getPlatformConfig(platform) {
        const configs = {
            kongregate: {
                name: 'Kongregate',
                sdkUrl: 'https://cdn1.kongregate.com/javascripts/kongregate_api.js',
                features: {
                    ads: true,
                    iap: true,
                    social: true,
                    analytics: true,
                    achievements: true,
                    chat: true
                },
                compliance: {
                    ageRating: 'Teen',
                    contentGuidelines: {
                        violence: 'mild',
                        sexualContent: 'none',
                        profanity: 'mild',
                        drugs: 'none',
                        gambling: 'simulated',
                        horror: 'mild'
                    },
                    monetization: {
                        lootBoxes: { allowed: true, disclosureRequired: true, oddsDisclosure: true },
                        subscriptions: { allowed: true, autoRenewalDisclosure: true, cancellationRequired: true },
                        ads: { allowed: true, ageAppropriate: true, disclosureRequired: true, frequencyCapping: true }
                    },
                    privacy: {
                        dataCollection: { personalData: 'minimal', locationData: 'none', deviceData: 'allowed', analyticsData: 'allowed' },
                        gdprCompliance: true,
                        ccpaCompliance: true,
                        coppaCompliance: true,
                        privacyPolicyRequired: true
                    }
                },
                api: {
                    showAd: 'kongregate.services.showAd',
                    showRewardedAd: 'kongregate.services.showRewardedAd',
                    showInterstitialAd: 'kongregate.services.showInterstitialAd',
                    trackEvent: 'kongregate.stats.submit',
                    getUserInfo: 'kongregate.services.getUserInfo',
                    isAdBlocked: 'kongregate.services.isAdBlocked',
                    isAdFree: 'kongregate.services.isAdFree'
                }
            },
            gamecrazy: {
                name: 'Game Crazy',
                sdkUrl: 'https://cdn.gamecrazy.com/sdk/gamecrazy-sdk.js',
                features: {
                    ads: true,
                    iap: true,
                    social: false,
                    analytics: true,
                    achievements: false,
                    chat: false
                },
                api: {
                    showAd: 'gameCrazy.showAd',
                    showRewardedAd: 'gameCrazy.showRewardedAd',
                    showInterstitialAd: 'gameCrazy.showInterstitialAd',
                    trackEvent: 'gameCrazy.trackEvent',
                    getUserInfo: 'gameCrazy.getUserInfo',
                    isAdBlocked: 'gameCrazy.isAdBlocked',
                    isAdFree: 'gameCrazy.isAdFree'
                }
            },
            poki: {
                name: 'Poki',
                sdkUrl: 'https://game-cdn.poki.com/scripts/poki-sdk.js',
                features: {
                    ads: true,
                    iap: true,
                    social: true,
                    analytics: true,
                    achievements: false,
                    chat: false
                },
                api: {
                    showAd: 'pokiSDK.showAd',
                    showRewardedAd: 'pokiSDK.showRewardedAd',
                    showInterstitialAd: 'pokiSDK.showInterstitialAd',
                    trackEvent: 'pokiSDK.trackEvent',
                    getUserInfo: 'pokiSDK.getUserInfo',
                    isAdBlocked: 'pokiSDK.getAdBlocked',
                    isAdFree: 'pokiSDK.getAdFree'
                }
            },
            local: {
                name: 'Local Development',
                sdkUrl: null,
                features: {
                    ads: false,
                    iap: false,
                    social: false,
                    analytics: false,
                    achievements: false,
                    chat: false
                },
                api: {
                    showAd: null,
                    showRewardedAd: null,
                    showInterstitialAd: null,
                    trackEvent: null,
                    getUserInfo: null,
                    isAdBlocked: null,
                    isAdFree: null
                }
            }
        };

        return configs[platform] || configs.local;
    }

    // Initialize platform detection and SDK loading
    async initialize() {
        this.currentPlatform = this.detectPlatform();
        this.platformConfig = this.getPlatformConfig(this.currentPlatform);
        
        console.log(`🎮 Platform detected: ${this.platformConfig.name}`);
        
        // Load platform-specific SDK if available
        if (this.platformConfig.sdkUrl) {
            await this.loadPlatformSDK();
        } else {
            console.log('📱 No SDK required for this platform');
        }
        
        return {
            platform: this.currentPlatform,
            config: this.platformConfig,
            sdk: this.sdk
        };
    }

    // Load platform-specific SDK
    loadPlatformSDK() {
        return new Promise((resolve, reject) => {
            if (!this.platformConfig.sdkUrl) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = this.platformConfig.sdkUrl;
            script.onload = () => {
                console.log(`✅ ${this.platformConfig.name} SDK loaded`);
                this.sdk = this.getSDKInstance();
                resolve();
            };
            script.onerror = () => {
                console.error(`❌ Failed to load ${this.platformConfig.name} SDK`);
                reject(new Error(`Failed to load ${this.platformConfig.name} SDK`));
            };
            
            document.head.appendChild(script);
        });
    }

    // Get SDK instance based on platform
    getSDKInstance() {
        switch (this.currentPlatform) {
            case 'kongregate':
                return window.kongregateAPI || null;
            case 'gamecrazy':
                return window.gameCrazyAPI || null;
            case 'poki':
                return window.pokiSDK || null;
            default:
                return null;
        }
    }

    // Get unified API for the current platform
    getUnifiedAPI() {
        if (!this.sdk || !this.platformConfig.api) {
            return this.getMockAPI();
        }

        return {
            // Ad functions
            showAd: (type) => this.callPlatformAPI('showAd', type),
            showRewardedAd: () => this.callPlatformAPI('showRewardedAd'),
            showInterstitialAd: () => this.callPlatformAPI('showInterstitialAd'),
            
            // User info
            getUserInfo: () => this.callPlatformAPI('getUserInfo'),
            isAdBlocked: () => this.callPlatformAPI('isAdBlocked'),
            isAdFree: () => this.callPlatformAPI('isAdFree'),
            
            // Analytics
            trackEvent: (eventName, data) => this.callPlatformAPI('trackEvent', eventName, data),
            
            // Platform info
            getPlatform: () => this.currentPlatform,
            getPlatformName: () => this.platformConfig.name,
            getFeatures: () => this.platformConfig.features,
            
            // Game lifecycle
            gameplayStart: () => this.handleGameplayStart(),
            gameplayStop: () => this.handleGameplayStop()
        };
    }

    // Call platform-specific API
    callPlatformAPI(apiName, ...args) {
        const apiPath = this.platformConfig.api[apiName];
        if (!apiPath) {
            console.warn(`API ${apiName} not available on ${this.platformConfig.name}`);
            return Promise.resolve();
        }

        try {
            const apiFunction = this.resolveAPIPath(apiPath);
            if (typeof apiFunction === 'function') {
                return apiFunction(...args);
            } else {
                console.warn(`API function ${apiName} not found`);
                return Promise.resolve();
            }
        } catch (error) {
            console.error(`Error calling API ${apiName}:`, error);
            return Promise.resolve();
        }
    }

    // Resolve API path (e.g., 'kongregate.services.showAd' -> window.kongregateAPI.services.showAd)
    resolveAPIPath(path) {
        const parts = path.split('.');
        let current = window;
        
        for (const part of parts) {
            if (current && current[part]) {
                current = current[part];
            } else {
                return null;
            }
        }
        
        return current;
    }

    // Handle gameplay start
    handleGameplayStart() {
        console.log(`🎮 Gameplay started on ${this.platformConfig.name}`);
        
        // Platform-specific gameplay start logic
        switch (this.currentPlatform) {
            case 'kongregate':
                if (this.sdk && this.sdk.services) {
                    this.sdk.services.startGame();
                }
                break;
            case 'poki':
                if (this.sdk && this.sdk.gameplayStart) {
                    this.sdk.gameplayStart();
                }
                break;
            case 'gamecrazy':
                if (this.sdk && this.sdk.gameplayStart) {
                    this.sdk.gameplayStart();
                }
                break;
        }
    }

    // Handle gameplay stop
    handleGameplayStop() {
        console.log(`⏹️ Gameplay stopped on ${this.platformConfig.name}`);
        
        // Platform-specific gameplay stop logic
        switch (this.currentPlatform) {
            case 'kongregate':
                if (this.sdk && this.sdk.services) {
                    this.sdk.services.stopGame();
                }
                break;
            case 'poki':
                if (this.sdk && this.sdk.gameplayStop) {
                    this.sdk.gameplayStop();
                }
                break;
            case 'gamecrazy':
                if (this.sdk && this.sdk.gameplayStop) {
                    this.sdk.gameplayStop();
                }
                break;
        }
    }

    // Mock API for development/testing
    getMockAPI() {
        return {
            showAd: (type) => {
                console.log(`🎯 Mock: Show ${type} ad`);
                return Promise.resolve();
            },
            showRewardedAd: () => {
                console.log('🎯 Mock: Show rewarded ad');
                return Promise.resolve();
            },
            showInterstitialAd: () => {
                console.log('🎯 Mock: Show interstitial ad');
                return Promise.resolve();
            },
            getUserInfo: () => {
                console.log('👤 Mock: Get user info');
                return { id: 'mock-user', name: 'Mock User' };
            },
            isAdBlocked: () => {
                console.log('🚫 Mock: Check ad blocked');
                return false;
            },
            isAdFree: () => {
                console.log('💎 Mock: Check ad free');
                return false;
            },
            trackEvent: (eventName, data) => {
                console.log(`📊 Mock: Track event ${eventName}`, data);
            },
            getPlatform: () => this.currentPlatform,
            getPlatformName: () => this.platformConfig.name,
            getFeatures: () => this.platformConfig.features,
            gameplayStart: () => console.log('🎮 Mock: Gameplay start'),
            gameplayStop: () => console.log('⏹️ Mock: Gameplay stop')
        };
    }
}

// Export for use
window.PlatformDetector = PlatformDetector;