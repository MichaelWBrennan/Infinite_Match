/**
 * Universal Platform Detection and Routing System
 * Detects and optimizes for all platforms: WebGL, Android, iOS, Kongregate, Poki, Game Crazy, etc.
 */

import { Logger } from '../logger/index.js';
import { AppConfig } from '../config/index.js';

export interface PlatformInfo {
  type: 'web' | 'mobile' | 'desktop' | 'console';
  name:
    | 'webgl'
    | 'android'
    | 'ios'
    | 'kongregate'
    | 'poki'
    | 'gamecrazy'
    | 'itch'
    | 'steam'
    | 'unknown';
  version?: string;
  capabilities: PlatformCapabilities;
  sdk?: any;
  config: PlatformConfig;
}

export interface PlatformCapabilities {
  // Core capabilities
  webgl: boolean;
  webgl2: boolean;
  wasm: boolean;
  webWorkers: boolean;
  serviceWorkers: boolean;

  // Platform-specific features
  ads: boolean;
  iap: boolean;
  social: boolean;
  analytics: boolean;
  achievements: boolean;
  chat: boolean;
  leaderboards: boolean;
  cloudSave: boolean;
  pushNotifications: boolean;

  // Performance capabilities
  maxMemory: number;
  maxTextureSize: number;
  maxVertexUniforms: number;
  maxFragmentUniforms: number;

  // Input capabilities
  touch: boolean;
  keyboard: boolean;
  gamepad: boolean;
  accelerometer: boolean;
  gyroscope: boolean;
}

export interface PlatformConfig {
  name: string;
  sdkUrl?: string;
  api: Record<string, string>;
  features: PlatformCapabilities;
  optimization: {
    compression: 'gzip' | 'brotli' | 'none';
    memorySize: number;
    textureFormat: 'astc' | 'etc2' | 'dxt' | 'none';
    audioFormat: 'mp3' | 'ogg' | 'wav';
  };
  build: {
    target: string;
    architecture: 'wasm32' | 'arm64' | 'x86_64';
    optimization: 'debug' | 'release';
  };
}

export class PlatformDetector {
  private logger: Logger;
  private currentPlatform: PlatformInfo | null = null;
  private platformConfigs: Map<string, PlatformConfig> = new Map();

  constructor() {
    this.logger = new Logger('PlatformDetector');
    this.initializePlatformConfigs();
  }

  /**
   * Initialize platform configurations
   */
  private initializePlatformConfigs(): void {
    // WebGL Platform
    this.platformConfigs.set('webgl', {
      name: 'WebGL',
      features: {
        webgl: true,
        webgl2: true,
        wasm: true,
        webWorkers: true,
        serviceWorkers: true,
        ads: false,
        iap: false,
        social: false,
        analytics: true,
        achievements: false,
        chat: false,
        leaderboards: false,
        cloudSave: true,
        pushNotifications: false,
        maxMemory: 1024,
        maxTextureSize: 4096,
        maxVertexUniforms: 1024,
        maxFragmentUniforms: 1024,
        touch: true,
        keyboard: true,
        gamepad: true,
        accelerometer: true,
        gyroscope: true,
      },
      optimization: {
        compression: 'gzip',
        memorySize: 256,
        textureFormat: 'astc',
        audioFormat: 'mp3',
      },
      build: {
        target: 'webgl',
        architecture: 'wasm32',
        optimization: 'release',
      },
      api: {},
    });

    // Kongregate Platform
    this.platformConfigs.set('kongregate', {
      name: 'Kongregate',
      sdkUrl: 'https://cdn1.kongregate.com/javascripts/kongregate_api.js',
      features: {
        webgl: true,
        webgl2: true,
        wasm: true,
        webWorkers: true,
        serviceWorkers: false,
        ads: true,
        iap: true,
        social: true,
        analytics: true,
        achievements: true,
        chat: true,
        leaderboards: true,
        cloudSave: true,
        pushNotifications: false,
        maxMemory: 512,
        maxTextureSize: 2048,
        maxVertexUniforms: 512,
        maxFragmentUniforms: 512,
        touch: true,
        keyboard: true,
        gamepad: false,
        accelerometer: false,
        gyroscope: false,
      },
      optimization: {
        compression: 'gzip',
        memorySize: 128,
        textureFormat: 'dxt',
        audioFormat: 'mp3',
      },
      build: {
        target: 'webgl',
        architecture: 'wasm32',
        optimization: 'release',
      },
      api: {
        showAd: 'kongregate.services.showAd',
        showRewardedAd: 'kongregate.services.showRewardedAd',
        showInterstitialAd: 'kongregate.services.showInterstitialAd',
        trackEvent: 'kongregate.stats.submit',
        getUserInfo: 'kongregate.services.getUserInfo',
        isAdBlocked: 'kongregate.services.isAdBlocked',
        isAdFree: 'kongregate.services.isAdFree',
        showLeaderboard: 'kongregate.stats.showLeaderboard',
        showAchievements: 'kongregate.stats.showAchievements',
      },
    });

    // Poki Platform
    this.platformConfigs.set('poki', {
      name: 'Poki',
      sdkUrl: 'https://game-cdn.poki.com/scripts/poki-sdk.js',
      features: {
        webgl: true,
        webgl2: true,
        wasm: true,
        webWorkers: true,
        serviceWorkers: false,
        ads: true,
        iap: true,
        social: true,
        analytics: true,
        achievements: false,
        chat: false,
        leaderboards: false,
        cloudSave: true,
        pushNotifications: false,
        maxMemory: 256,
        maxTextureSize: 1024,
        maxVertexUniforms: 256,
        maxFragmentUniforms: 256,
        touch: true,
        keyboard: true,
        gamepad: false,
        accelerometer: false,
        gyroscope: false,
      },
      optimization: {
        compression: 'brotli',
        memorySize: 64,
        textureFormat: 'etc2',
        audioFormat: 'ogg',
      },
      build: {
        target: 'webgl',
        architecture: 'wasm32',
        optimization: 'release',
      },
      api: {
        showAd: 'pokiSDK.showAd',
        showRewardedAd: 'pokiSDK.showRewardedAd',
        showInterstitialAd: 'pokiSDK.showInterstitialAd',
        trackEvent: 'pokiSDK.trackEvent',
        getUserInfo: 'pokiSDK.getUserInfo',
        isAdBlocked: 'pokiSDK.getAdBlocked',
        isAdFree: 'pokiSDK.getAdFree',
        gameplayStart: 'pokiSDK.gameplayStart',
        gameplayStop: 'pokiSDK.gameplayStop',
      },
    });

    // Game Crazy Platform
    this.platformConfigs.set('gamecrazy', {
      name: 'Game Crazy',
      sdkUrl: 'https://cdn.gamecrazy.com/sdk/gamecrazy-sdk.js',
      features: {
        webgl: true,
        webgl2: true,
        wasm: true,
        webWorkers: true,
        serviceWorkers: false,
        ads: true,
        iap: true,
        social: false,
        analytics: true,
        achievements: false,
        chat: false,
        leaderboards: false,
        cloudSave: true,
        pushNotifications: false,
        maxMemory: 128,
        maxTextureSize: 512,
        maxVertexUniforms: 128,
        maxFragmentUniforms: 128,
        touch: true,
        keyboard: true,
        gamepad: false,
        accelerometer: false,
        gyroscope: false,
      },
      optimization: {
        compression: 'gzip',
        memorySize: 32,
        textureFormat: 'dxt',
        audioFormat: 'mp3',
      },
      build: {
        target: 'webgl',
        architecture: 'wasm32',
        optimization: 'release',
      },
      api: {
        showAd: 'gameCrazy.showAd',
        showRewardedAd: 'gameCrazy.showRewardedAd',
        showInterstitialAd: 'gameCrazy.showInterstitialAd',
        trackEvent: 'gameCrazy.trackEvent',
        getUserInfo: 'gameCrazy.getUserInfo',
        isAdBlocked: 'gameCrazy.isAdBlocked',
        isAdFree: 'gameCrazy.isAdFree',
      },
    });

    // Android Platform
    this.platformConfigs.set('android', {
      name: 'Android',
      features: {
        webgl: false,
        webgl2: false,
        wasm: false,
        webWorkers: false,
        serviceWorkers: false,
        ads: true,
        iap: true,
        social: true,
        analytics: true,
        achievements: true,
        chat: true,
        leaderboards: true,
        cloudSave: true,
        pushNotifications: true,
        maxMemory: 2048,
        maxTextureSize: 8192,
        maxVertexUniforms: 2048,
        maxFragmentUniforms: 2048,
        touch: true,
        keyboard: false,
        gamepad: true,
        accelerometer: true,
        gyroscope: true,
      },
      optimization: {
        compression: 'none',
        memorySize: 512,
        textureFormat: 'astc',
        audioFormat: 'mp3',
      },
      build: {
        target: 'android',
        architecture: 'arm64',
        optimization: 'release',
      },
      api: {},
    });

    // iOS Platform
    this.platformConfigs.set('ios', {
      name: 'iOS',
      features: {
        webgl: false,
        webgl2: false,
        wasm: false,
        webWorkers: false,
        serviceWorkers: false,
        ads: true,
        iap: true,
        social: true,
        analytics: true,
        achievements: true,
        chat: true,
        leaderboards: true,
        cloudSave: true,
        pushNotifications: true,
        maxMemory: 1024,
        maxTextureSize: 4096,
        maxVertexUniforms: 1024,
        maxFragmentUniforms: 1024,
        touch: true,
        keyboard: false,
        gamepad: true,
        accelerometer: true,
        gyroscope: true,
      },
      optimization: {
        compression: 'none',
        memorySize: 256,
        textureFormat: 'astc',
        audioFormat: 'mp3',
      },
      build: {
        target: 'ios',
        architecture: 'arm64',
        optimization: 'release',
      },
      api: {},
    });
  }

  /**
   * Detect current platform
   */
  async detectPlatform(): Promise<PlatformInfo> {
    try {
      this.logger.info('Detecting platform...');

      const platformName = this.detectPlatformName();
      const platformConfig =
        this.platformConfigs.get(platformName) || this.platformConfigs.get('webgl')!;

      // Detect capabilities
      const capabilities = await this.detectCapabilities(platformConfig);

      // Load platform SDK if available
      const sdk = await this.loadPlatformSDK(platformConfig);

      this.currentPlatform = {
        type: this.getPlatformType(platformName),
        name: platformName as any,
        capabilities,
        sdk,
        config: platformConfig,
      };

      this.logger.info(`Platform detected: ${this.currentPlatform.config.name}`);
      return this.currentPlatform;
    } catch (error) {
      this.logger.error('Platform detection failed:', error);
      // Fallback to WebGL
      return this.getFallbackPlatform();
    }
  }

  /**
   * Detect platform name
   */
  private detectPlatformName(): string {
    if (typeof window === 'undefined') {
      return 'webgl'; // Server-side fallback
    }

    const hostname = window.location.hostname.toLowerCase();
    const referrer = document.referrer.toLowerCase();
    const userAgent = navigator.userAgent.toLowerCase();

    // Check for Kongregate
    if (
      hostname.includes('kongregate.com') ||
      referrer.includes('kongregate.com') ||
      window.kongregateAPI
    ) {
      return 'kongregate';
    }

    // Check for Poki
    if (hostname.includes('poki.com') || referrer.includes('poki.com') || window.pokiSDK) {
      return 'poki';
    }

    // Check for Game Crazy
    if (
      hostname.includes('gamecrazy.com') ||
      referrer.includes('gamecrazy.com') ||
      window.gameCrazyAPI
    ) {
      return 'gamecrazy';
    }

    // Check for mobile platforms
    if (userAgent.includes('android')) {
      return 'android';
    }

    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      return 'ios';
    }

    // Check for local development
    if (
      hostname.includes('localhost') ||
      hostname.includes('127.0.0.1') ||
      hostname.includes('vercel.app')
    ) {
      return 'webgl';
    }

    return 'webgl'; // Default fallback
  }

  /**
   * Detect platform capabilities
   */
  private async detectCapabilities(config: PlatformConfig): Promise<PlatformCapabilities> {
    const capabilities = { ...config.features };

    if (typeof window !== 'undefined') {
      // Detect WebGL capabilities
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

      if (gl) {
        capabilities.webgl = true;
        capabilities.webgl2 = !!canvas.getContext('webgl2');

        // Get WebGL limits
        capabilities.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        capabilities.maxVertexUniforms = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS);
        capabilities.maxFragmentUniforms = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS);
      }

      // Detect WASM support
      capabilities.wasm = typeof WebAssembly !== 'undefined';

      // Detect Web Workers
      capabilities.webWorkers = typeof Worker !== 'undefined';

      // Detect Service Workers
      capabilities.serviceWorkers = 'serviceWorker' in navigator;

      // Detect touch support
      capabilities.touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      // Detect accelerometer and gyroscope
      capabilities.accelerometer = 'DeviceMotionEvent' in window;
      capabilities.gyroscope = 'DeviceOrientationEvent' in window;

      // Detect gamepad support
      capabilities.gamepad = 'getGamepads' in navigator;
    }

    return capabilities;
  }

  /**
   * Load platform SDK
   */
  private async loadPlatformSDK(config: PlatformConfig): Promise<any> {
    if (!config.sdkUrl || typeof window === 'undefined') {
      return null;
    }

    try {
      return await this.loadScript(config.sdkUrl);
    } catch (error) {
      this.logger.warn(`Failed to load platform SDK: ${error}`);
      return null;
    }
  }

  /**
   * Load script dynamically
   */
  private loadScript(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = () => resolve(window);
      script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
      document.head.appendChild(script);
    });
  }

  /**
   * Get platform type
   */
  private getPlatformType(platformName: string): 'web' | 'mobile' | 'desktop' | 'console' {
    if (['android', 'ios'].includes(platformName)) {
      return 'mobile';
    }
    if (['webgl', 'kongregate', 'poki', 'gamecrazy'].includes(platformName)) {
      return 'web';
    }
    return 'desktop';
  }

  /**
   * Get fallback platform
   */
  private getFallbackPlatform(): PlatformInfo {
    const config = this.platformConfigs.get('webgl')!;
    return {
      type: 'web',
      name: 'webgl',
      capabilities: config.features,
      config,
    };
  }

  /**
   * Get current platform
   */
  getCurrentPlatform(): PlatformInfo | null {
    return this.currentPlatform;
  }

  /**
   * Get platform-specific API
   */
  getPlatformAPI(): any {
    if (!this.currentPlatform || !this.currentPlatform.sdk) {
      return this.getMockAPI();
    }

    const api: any = {};
    const config = this.currentPlatform.config;

    // Map platform APIs
    Object.entries(config.api).forEach(([method, path]) => {
      api[method] = (...args: any[]) => {
        try {
          const func = this.resolveAPIPath(path);
          if (typeof func === 'function') {
            return func(...args);
          }
          return Promise.resolve();
        } catch (error) {
          this.logger.warn(`API call failed: ${method}`, error);
          return Promise.resolve();
        }
      };
    });

    return api;
  }

  /**
   * Resolve API path
   */
  private resolveAPIPath(path: string): any {
    const parts = path.split('.');
    let current: any = window;

    for (const part of parts) {
      if (current && current[part]) {
        current = current[part];
      } else {
        return null;
      }
    }

    return current;
  }

  /**
   * Get mock API for development
   */
  private getMockAPI(): any {
    return {
      showAd: (type: string) => {
        this.logger.debug(`Mock: Show ${type} ad`);
        return Promise.resolve();
      },
      showRewardedAd: () => {
        this.logger.debug('Mock: Show rewarded ad');
        return Promise.resolve();
      },
      showInterstitialAd: () => {
        this.logger.debug('Mock: Show interstitial ad');
        return Promise.resolve();
      },
      trackEvent: (eventName: string, data: any) => {
        this.logger.debug(`Mock: Track event ${eventName}`, data);
      },
      getUserInfo: () => {
        this.logger.debug('Mock: Get user info');
        return { id: 'mock-user', name: 'Mock User' };
      },
      isAdBlocked: () => {
        this.logger.debug('Mock: Check ad blocked');
        return false;
      },
      isAdFree: () => {
        this.logger.debug('Mock: Check ad free');
        return false;
      },
    };
  }

  /**
   * Get platform-specific build configuration
   */
  getBuildConfig(): any {
    if (!this.currentPlatform) {
      return this.platformConfigs.get('webgl')!.build;
    }
    return this.currentPlatform.config.build;
  }

  /**
   * Get platform-specific optimization settings
   */
  getOptimizationConfig(): any {
    if (!this.currentPlatform) {
      return this.platformConfigs.get('webgl')!.optimization;
    }
    return this.currentPlatform.config.optimization;
  }
}

export default PlatformDetector;
