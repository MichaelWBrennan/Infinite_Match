/**
 * Free Universal API Compatibility Layer - 100% Open Source
 * Provides unified API across all platforms with no external dependencies
 */

import { Logger } from '../logger/index.js';
import { PlatformDetector, PlatformInfo } from '../platform/PlatformDetector.js';
import { ApiResponseBuilder } from '../types/ApiResponse.js';
import { ErrorHandler } from '../errors/ErrorHandler.js';

export interface FreeUniversalAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  platform?: string;
  source?: 'local' | 'mock' | 'simulated';
}

export interface AdConfig {
  type: 'banner' | 'interstitial' | 'rewarded';
  placement: string;
  size?: string;
  position?: string;
}

export interface UserInfo {
  id: string;
  name: string;
  avatar?: string;
  platform: string;
  isGuest: boolean;
  isPremium: boolean;
  source: 'local' | 'mock' | 'simulated';
}

export interface AnalyticsEvent {
  eventName: string;
  parameters: Record<string, any>;
  timestamp: number;
  platform: string;
  source: 'local' | 'mock' | 'simulated';
}

export interface PurchaseInfo {
  productId: string;
  price: number;
  currency: string;
  platform: string;
  transactionId: string;
  source: 'local' | 'mock' | 'simulated';
}

export class FreeUniversalAPI {
  private logger: Logger;
  private platformDetector: PlatformDetector;
  private platformAPI: any;
  private currentPlatform: PlatformInfo | null = null;
  private localData: Map<string, any> = new Map();
  private mockData: Map<string, any> = new Map();

  constructor() {
    this.logger = new Logger('FreeUniversalAPI');
    this.platformDetector = new PlatformDetector();
    this.initializeLocalData();
  }

  /**
   * Initialize Universal API
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Free Universal API...');

      // Detect platform
      this.currentPlatform = await this.platformDetector.detectPlatform();

      // Get platform-specific API (local implementation)
      this.platformAPI = this.createLocalPlatformAPI();

      this.logger.info(`Free Universal API initialized for platform: ${this.currentPlatform.name}`);
    } catch (error) {
      this.logger.error('Failed to initialize Free Universal API:', error);
      throw error;
    }
  }

  /**
   * Create local platform API implementation
   */
  private createLocalPlatformAPI() {
    return {
      showAd: this.showAdLocal.bind(this),
      showRewardedAd: this.showRewardedAdLocal.bind(this),
      showInterstitialAd: this.showInterstitialAdLocal.bind(this),
      getUserInfo: this.getUserInfoLocal.bind(this),
      trackEvent: this.trackEventLocal.bind(this),
      isAdBlocked: this.isAdBlockedLocal.bind(this),
      isAdFree: this.isAdFreeLocal.bind(this),
      gameplayStart: this.gameplayStartLocal.bind(this),
      gameplayStop: this.gameplayStopLocal.bind(this)
    };
  }

  /**
   * Initialize local data storage
   */
  private initializeLocalData() {
    // Initialize with default values
    this.localData.set('user_info', {
      id: 'local-user-' + Math.random().toString(36).substr(2, 9),
      name: 'Local User',
      platform: 'local',
      isGuest: false,
      isPremium: false,
      source: 'local'
    });

    this.localData.set('ad_settings', {
      banner_enabled: true,
      interstitial_enabled: true,
      rewarded_enabled: true,
      ad_frequency: 3, // Show ad every 3 levels
      last_ad_shown: 0
    });

    this.localData.set('analytics', {
      events: [],
      session_start: Date.now(),
      total_events: 0
    });

    this.localData.set('purchases', {
      items: [],
      total_spent: 0,
      currency: 'USD'
    });

    // Initialize mock data for testing
    this.initializeMockData();
  }

  /**
   * Initialize mock data for testing
   */
  private initializeMockData() {
    this.mockData.set('ads', {
      banner: { shown: 0, revenue: 0 },
      interstitial: { shown: 0, revenue: 0 },
      rewarded: { shown: 0, rewarded: 0, revenue: 0 }
    });

    this.mockData.set('users', [
      { id: 'user1', name: 'Test User 1', isPremium: false },
      { id: 'user2', name: 'Test User 2', isPremium: true },
      { id: 'user3', name: 'Test User 3', isPremium: false }
    ]);

    this.mockData.set('products', [
      { id: 'coins_100', name: '100 Coins', price: 0.99, currency: 'USD' },
      { id: 'coins_500', name: '500 Coins', price: 4.99, currency: 'USD' },
      { id: 'premium_pass', name: 'Premium Pass', price: 9.99, currency: 'USD' }
    ]);
  }

  /**
   * Show advertisement (local implementation)
   */
  async showAd(config: AdConfig): Promise<FreeUniversalAPIResponse<{ shown: boolean; revenue?: number }>> {
    try {
      this.logger.info(`Showing ${config.type} ad locally`);

      const adSettings = this.localData.get('ad_settings');
      const adData = this.mockData.get('ads');

      // Check if ads should be shown
      if (!this.shouldShowAd(config.type, adSettings)) {
        return {
          success: true,
          data: { shown: false, revenue: 0 },
          platform: this.currentPlatform?.name,
          source: 'local'
        };
      }

      // Simulate ad display
      const adResult = await this.simulateAdDisplay(config.type);
      
      // Update local data
      adData[config.type].shown++;
      adData[config.type].revenue += adResult.revenue || 0;
      adSettings.last_ad_shown = Date.now();

      // Track ad event
      await this.trackEventLocal('ad_shown', {
        ad_type: config.type,
        placement: config.placement,
        revenue: adResult.revenue
      });

      return {
        success: true,
        data: { shown: true, revenue: adResult.revenue },
        platform: this.currentPlatform?.name,
        source: 'local'
      };
    } catch (error) {
      this.logger.error('Error showing ad:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: this.currentPlatform?.name,
        source: 'local'
      };
    }
  }

  /**
   * Show rewarded advertisement (local implementation)
   */
  async showRewardedAd(): Promise<FreeUniversalAPIResponse<{ shown: boolean; rewarded: boolean; reward?: any }>> {
    try {
      this.logger.info('Showing rewarded ad locally');

      const adData = this.mockData.get('ads');

      // Simulate rewarded ad
      const adResult = await this.simulateRewardedAd();
      
      // Update local data
      adData.rewarded.shown++;
      if (adResult.rewarded) {
        adData.rewarded.rewarded++;
        adData.rewarded.revenue += adResult.revenue || 0;
      }

      // Track rewarded ad event
      await this.trackEventLocal('rewarded_ad_shown', {
        rewarded: adResult.rewarded,
        reward: adResult.reward
      });

      return {
        success: true,
        data: {
          shown: true,
          rewarded: adResult.rewarded,
          reward: adResult.reward
        },
        platform: this.currentPlatform?.name,
        source: 'local'
      };
    } catch (error) {
      this.logger.error('Error showing rewarded ad:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: this.currentPlatform?.name,
        source: 'local'
      };
    }
  }

  /**
   * Show interstitial advertisement (local implementation)
   */
  async showInterstitialAd(): Promise<FreeUniversalAPIResponse<{ shown: boolean }>> {
    try {
      this.logger.info('Showing interstitial ad locally');

      const adSettings = this.localData.get('ad_settings');
      const adData = this.mockData.get('ads');

      // Check if interstitial should be shown
      if (!this.shouldShowAd('interstitial', adSettings)) {
        return {
          success: true,
          data: { shown: false },
          platform: this.currentPlatform?.name,
          source: 'local'
        };
      }

      // Simulate interstitial ad
      await this.simulateInterstitialAd();
      
      // Update local data
      adData.interstitial.shown++;
      adSettings.last_ad_shown = Date.now();

      // Track interstitial ad event
      await this.trackEventLocal('interstitial_ad_shown', {});

      return {
        success: true,
        data: { shown: true },
        platform: this.currentPlatform?.name,
        source: 'local'
      };
    } catch (error) {
      this.logger.error('Error showing interstitial ad:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: this.currentPlatform?.name,
        source: 'local'
      };
    }
  }

  /**
   * Get user information (local implementation)
   */
  async getUserInfo(): Promise<FreeUniversalAPIResponse<UserInfo>> {
    try {
      this.logger.info('Getting user info locally');

      const userInfo = this.localData.get('user_info');
      
      // Update last seen
      userInfo.lastSeen = new Date().toISOString();

      return {
        success: true,
        data: userInfo,
        platform: this.currentPlatform?.name,
        source: 'local'
      };
    } catch (error) {
      this.logger.error('Error getting user info:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: this.currentPlatform?.name,
        source: 'local'
      };
    }
  }

  /**
   * Track analytics event (local implementation)
   */
  async trackEvent(eventName: string, parameters: Record<string, any> = {}): Promise<FreeUniversalAPIResponse<void>> {
    try {
      this.logger.info(`Tracking event locally: ${eventName}`);

      const event: AnalyticsEvent = {
        eventName,
        parameters,
        timestamp: Date.now(),
        platform: this.currentPlatform?.name || 'unknown',
        source: 'local'
      };

      // Track via local analytics
      await this.trackEventLocal(eventName, parameters);

      return {
        success: true,
        platform: this.currentPlatform?.name,
        source: 'local'
      };
    } catch (error) {
      this.logger.error('Error tracking event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: this.currentPlatform?.name,
        source: 'local'
      };
    }
  }

  /**
   * Check if ads are blocked (local implementation)
   */
  async isAdBlocked(): Promise<FreeUniversalAPIResponse<boolean>> {
    try {
      // Simulate ad block detection
      const isBlocked = this.simulateAdBlockDetection();
      
      return {
        success: true,
        data: isBlocked,
        platform: this.currentPlatform?.name,
        source: 'local'
      };
    } catch (error) {
      this.logger.error('Error checking ad block status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: this.currentPlatform?.name,
        source: 'local'
      };
    }
  }

  /**
   * Check if user has ad-free subscription (local implementation)
   */
  async isAdFree(): Promise<FreeUniversalAPIResponse<boolean>> {
    try {
      const userInfo = this.localData.get('user_info');
      
      return {
        success: true,
        data: userInfo.isPremium || userInfo.isAdFree || false,
        platform: this.currentPlatform?.name,
        source: 'local'
      };
    } catch (error) {
      this.logger.error('Error checking ad-free status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: this.currentPlatform?.name,
        source: 'local'
      };
    }
  }

  /**
   * Handle gameplay start (local implementation)
   */
  async gameplayStart(): Promise<FreeUniversalAPIResponse<void>> {
    try {
      this.logger.info('Gameplay started locally');

      const analytics = this.localData.get('analytics');
      analytics.session_start = Date.now();
      analytics.is_playing = true;

      // Track gameplay start event
      await this.trackEventLocal('gameplay_started', {
        platform: this.currentPlatform?.name,
        timestamp: Date.now(),
      });

      return {
        success: true,
        platform: this.currentPlatform?.name,
        source: 'local'
      };
    } catch (error) {
      this.logger.error('Error handling gameplay start:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: this.currentPlatform?.name,
        source: 'local'
      };
    }
  }

  /**
   * Handle gameplay stop (local implementation)
   */
  async gameplayStop(): Promise<FreeUniversalAPIResponse<void>> {
    try {
      this.logger.info('Gameplay stopped locally');

      const analytics = this.localData.get('analytics');
      analytics.is_playing = false;
      analytics.session_duration = Date.now() - analytics.session_start;

      // Track gameplay stop event
      await this.trackEventLocal('gameplay_stopped', {
        platform: this.currentPlatform?.name,
        timestamp: Date.now(),
        session_duration: analytics.session_duration
      });

      return {
        success: true,
        platform: this.currentPlatform?.name,
        source: 'local'
      };
    } catch (error) {
      this.logger.error('Error handling gameplay stop:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: this.currentPlatform?.name,
        source: 'local'
      };
    }
  }

  /**
   * Get platform capabilities
   */
  getPlatformCapabilities(): FreeUniversalAPIResponse<any> {
    if (!this.currentPlatform) {
      return {
        success: false,
        error: 'Platform not detected',
        platform: 'unknown',
        source: 'local'
      };
    }

    return {
      success: true,
      data: {
        platform: this.currentPlatform.name,
        type: this.currentPlatform.type,
        capabilities: this.currentPlatform.capabilities,
        features: this.currentPlatform.config.features,
        local_implementation: true
      },
      platform: this.currentPlatform.name,
      source: 'local'
    };
  }

  /**
   * Get platform-specific configuration
   */
  getPlatformConfig(): FreeUniversalAPIResponse<any> {
    if (!this.currentPlatform) {
      return {
        success: false,
        error: 'Platform not detected',
        platform: 'unknown',
        source: 'local'
      };
    }

    return {
      success: true,
      data: {
        platform: this.currentPlatform.name,
        optimization: this.currentPlatform.config.optimization,
        build: this.currentPlatform.config.build,
        local_implementation: true
      },
      platform: this.currentPlatform.name,
      source: 'local'
    };
  }

  /**
   * Local implementation methods
   */
  private async showAdLocal(adType: string) {
    // Simulate ad display delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      shown: true,
      revenue: Math.random() * 0.1 // Random revenue between 0-0.1
    };
  }

  private async showRewardedAdLocal() {
    // Simulate rewarded ad display
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const rewarded = Math.random() > 0.1; // 90% success rate
    return {
      shown: true,
      rewarded,
      reward: rewarded ? { coins: 50, gems: 5 } : null,
      revenue: rewarded ? Math.random() * 0.2 : 0
    };
  }

  private async showInterstitialAdLocal() {
    // Simulate interstitial ad display
    await new Promise(resolve => setTimeout(resolve, 150));
    return { shown: true };
  }

  private async getUserInfoLocal() {
    return this.localData.get('user_info');
  }

  private async trackEventLocal(eventName: string, parameters: Record<string, any>) {
    const analytics = this.localData.get('analytics');
    analytics.events.push({
      eventName,
      parameters,
      timestamp: Date.now(),
      platform: this.currentPlatform?.name || 'unknown'
    });
    analytics.total_events++;
  }

  private isAdBlockedLocal() {
    // Simulate ad block detection (10% chance of being blocked)
    return Math.random() < 0.1;
  }

  private isAdFreeLocal() {
    const userInfo = this.localData.get('user_info');
    return userInfo.isPremium || userInfo.isAdFree || false;
  }

  private async gameplayStartLocal() {
    const analytics = this.localData.get('analytics');
    analytics.session_start = Date.now();
    analytics.is_playing = true;
  }

  private async gameplayStopLocal() {
    const analytics = this.localData.get('analytics');
    analytics.is_playing = false;
    analytics.session_duration = Date.now() - analytics.session_start;
  }

  /**
   * Helper methods
   */
  private shouldShowAd(adType: string, adSettings: any): boolean {
    if (adType === 'banner') return adSettings.banner_enabled;
    if (adType === 'interstitial') return adSettings.interstitial_enabled;
    if (adType === 'rewarded') return adSettings.rewarded_enabled;
    return false;
  }

  private async simulateAdDisplay(adType: string) {
    // Simulate ad display with random success
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    return {
      shown: true,
      revenue: Math.random() * 0.1
    };
  }

  private async simulateRewardedAd() {
    // Simulate rewarded ad with 90% success rate
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    const rewarded = Math.random() > 0.1;
    return {
      shown: true,
      rewarded,
      reward: rewarded ? { coins: 50, gems: 5 } : null,
      revenue: rewarded ? Math.random() * 0.2 : 0
    };
  }

  private async simulateInterstitialAd() {
    // Simulate interstitial ad display
    await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 100));
    return { shown: true };
  }

  private simulateAdBlockDetection(): boolean {
    // Simulate ad block detection (10% chance of being blocked)
    return Math.random() < 0.1;
  }

  /**
   * Get current platform info
   */
  getCurrentPlatform(): PlatformInfo | null {
    return this.currentPlatform;
  }

  /**
   * Check if feature is supported
   */
  isFeatureSupported(feature: string): boolean {
    if (!this.currentPlatform) {
      return false;
    }
    return this.currentPlatform.capabilities[feature] || false;
  }

  /**
   * Get platform-specific recommendations
   */
  getPlatformRecommendations(): string[] {
    if (!this.currentPlatform) {
      return [];
    }

    const recommendations: string[] = [];
    const capabilities = this.currentPlatform.capabilities;

    // Memory recommendations
    if (capabilities.maxMemory < 512) {
      recommendations.push('Consider reducing memory usage for better performance');
    }

    // Feature recommendations
    if (!capabilities.ads && this.currentPlatform.type === 'web') {
      recommendations.push('Ads are not supported on this platform');
    }

    if (!capabilities.iap && this.currentPlatform.type === 'web') {
      recommendations.push('In-app purchases are not supported on this platform');
    }

    // Performance recommendations
    if (capabilities.maxTextureSize < 2048) {
      recommendations.push('Use smaller texture sizes for better performance');
    }

    // Local implementation recommendations
    recommendations.push('Using local implementation - no external dependencies');
    recommendations.push('All data is stored locally for privacy');

    return recommendations;
  }

  /**
   * Get local data
   */
  getLocalData(key: string): any {
    return this.localData.get(key);
  }

  /**
   * Set local data
   */
  setLocalData(key: string, value: any): void {
    this.localData.set(key, value);
  }

  /**
   * Get analytics data
   */
  getAnalyticsData() {
    return this.localData.get('analytics');
  }

  /**
   * Get ad statistics
   */
  getAdStatistics() {
    return this.mockData.get('ads');
  }

  /**
   * Get user statistics
   */
  getUserStatistics() {
    const userInfo = this.localData.get('user_info');
    const analytics = this.localData.get('analytics');
    
    return {
      user: userInfo,
      session_duration: analytics.session_duration || 0,
      total_events: analytics.total_events,
      is_playing: analytics.is_playing || false
    };
  }

  /**
   * Reset local data
   */
  resetLocalData() {
    this.localData.clear();
    this.initializeLocalData();
  }

  /**
   * Export local data
   */
  exportLocalData() {
    return {
      localData: Object.fromEntries(this.localData),
      mockData: Object.fromEntries(this.mockData),
      platform: this.currentPlatform,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Import local data
   */
  importLocalData(data: any) {
    if (data.localData) {
      this.localData = new Map(Object.entries(data.localData));
    }
    if (data.mockData) {
      this.mockData = new Map(Object.entries(data.mockData));
    }
  }
}

export default FreeUniversalAPI;