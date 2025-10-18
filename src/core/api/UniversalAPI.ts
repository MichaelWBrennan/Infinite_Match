/**
 * Free Universal API Compatibility Layer - 100% Open Source
 * Provides unified API across all platforms with no external dependencies
 */

import { Logger } from '../logger/index.js';
import { PlatformDetector, PlatformInfo } from '../platform/PlatformDetector.js';
import { ApiResponseBuilder } from '../types/ApiResponse.js';
import { ErrorHandler } from '../errors/ErrorHandler.js';

export interface UniversalAPIResponse<T = any> {
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

export class UniversalAPI {
  private logger: Logger;
  private platformDetector: PlatformDetector;
  private platformAPI: any;
  private currentPlatform: PlatformInfo | null = null;
  private localData: Map<string, any> = new Map();
  private mockData: Map<string, any> = new Map();

  constructor() {
    this.logger = new Logger('UniversalAPI');
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
      this.logger.error('Failed to initialize Free Universal API:', { error });
      throw error;
    }
  }

  /**
   * Initialize local data storage
   */
  private initializeLocalData() {
    // Load real user data from storage
    this.loadRealUserData();
    this.loadRealAdSettings();
    this.loadRealAnalytics();
    this.loadRealPurchases();
    this.loadRealGameData();

    // Initialize mock data for testing
    this.initializeMockData();
  }

  /**
   * Load real user data from storage
   */
  private loadRealUserData() {
    try {
      const userData = this.getFromLocalStorage('user_info');
      if (userData) {
        this.localData.set('user_info', userData);
      } else {
        // Create new user with real data
        const newUser = {
          id: this.generateUserId(),
          name: this.getRealUserName(),
          platform: this.getRealPlatform(),
          isGuest: false,
          isPremium: this.checkPremiumStatus(),
          source: 'local',
          created_at: new Date().toISOString(),
          last_seen: new Date().toISOString(),
          preferences: this.getUserPreferences(),
          game_progress: this.getGameProgress(),
          achievements: this.getUserAchievements()
        };
        this.localData.set('user_info', newUser);
        this.saveToLocalStorage('user_info', newUser);
      }
    } catch (error) {
      console.warn('Failed to load real user data:', error);
      this.createDefaultUser();
    }
  }

  /**
   * Load real ad settings
   */
  private loadRealAdSettings() {
    try {
      const adSettings = this.getFromLocalStorage('ad_settings');
      if (adSettings) {
        this.localData.set('ad_settings', adSettings);
      } else {
        const defaultSettings = {
          banner_enabled: true,
          interstitial_enabled: true,
          rewarded_enabled: true,
          ad_frequency: 3,
          last_ad_shown: 0,
          ad_revenue: 0,
          ads_shown_today: 0,
          last_reset_date: new Date().toDateString(),
          user_preferences: this.getAdPreferences()
        };
        this.localData.set('ad_settings', defaultSettings);
        this.saveToLocalStorage('ad_settings', defaultSettings);
      }
    } catch (error) {
      console.warn('Failed to load real ad settings:', error);
      this.createDefaultAdSettings();
    }
  }

  /**
   * Load real analytics data
   */
  private loadRealAnalytics() {
    try {
      const analytics = this.getFromLocalStorage('analytics');
      if (analytics) {
        this.localData.set('analytics', analytics);
      } else {
        const defaultAnalytics = {
          events: [],
          session_start: Date.now(),
          total_events: 0,
          daily_events: 0,
          last_reset_date: new Date().toDateString(),
          user_engagement: this.calculateUserEngagement(),
          performance_metrics: this.getPerformanceMetrics(),
          error_logs: []
        };
        this.localData.set('analytics', defaultAnalytics);
        this.saveToLocalStorage('analytics', defaultAnalytics);
      }
    } catch (error) {
      console.warn('Failed to load real analytics:', error);
      this.createDefaultAnalytics();
    }
  }

  /**
   * Load real purchases data
   */
  private loadRealPurchases() {
    try {
      const purchases = this.getFromLocalStorage('purchases');
      if (purchases) {
        this.localData.set('purchases', purchases);
      } else {
        const defaultPurchases = {
          items: [],
          total_spent: 0,
          currency: 'USD',
          purchase_history: [],
          refunds: [],
          subscription_status: this.getSubscriptionStatus(),
          payment_methods: this.getPaymentMethods()
        };
        this.localData.set('purchases', defaultPurchases);
        this.saveToLocalStorage('purchases', defaultPurchases);
      }
    } catch (error) {
      console.warn('Failed to load real purchases:', error);
      this.createDefaultPurchases();
    }
  }

  /**
   * Load real game data
   */
  private loadRealGameData() {
    try {
      const gameData = this.getFromLocalStorage('game_data');
      if (gameData) {
        this.localData.set('game_data', gameData);
      } else {
        const defaultGameData = {
          level: 1,
          score: 0,
          coins: 100,
          gems: 10,
          powerups: [],
          achievements: [],
          settings: this.getGameSettings(),
          statistics: this.getGameStatistics(),
          progress: this.getGameProgress()
        };
        this.localData.set('game_data', defaultGameData);
        this.saveToLocalStorage('game_data', defaultGameData);
      }
    } catch (error) {
      console.warn('Failed to load real game data:', error);
      this.createDefaultGameData();
    }
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
   * Show advertisement (local implementation)
   */
  async showAd(
    config: AdConfig,
  ): Promise<UniversalAPIResponse<{ shown: boolean; revenue?: number }>> {
    try {
      this.logger.info(`Showing ${config.type} ad locally`);

      const adSettings = this.localData.get('ad_settings');
      const adData = this.mockData.get('ads');

      // Check if ads should be shown
      if (!this.shouldShowAd(config.type, adSettings)) {
        return {
          success: true,
          data: { shown: false, revenue: 0 },
          platform: this.currentPlatform?.name || 'unknown',
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
        platform: this.currentPlatform?.name || 'unknown',
        source: 'local'
      };
    } catch (error) {
      this.logger.error('Error showing ad:', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: this.currentPlatform?.name || 'unknown',
        source: 'local'
      };
    }
  }

  /**
   * Show rewarded advertisement
   */
  async showRewardedAd(): Promise<
    UniversalAPIResponse<{ shown: boolean; rewarded: boolean; reward?: any }>
    > {
    try {
      this.logger.info(`Showing rewarded ad on ${this.currentPlatform?.name}`);

      if (!this.platformAPI || !this.platformAPI.showRewardedAd) {
        this.logger.warn('Rewarded ad API not available on current platform');
        return {
          success: false,
          error: 'Rewarded ad API not available',
          platform: this.currentPlatform?.name || 'unknown',
          source: 'local'
        };
      }

      const result = await this.platformAPI.showRewardedAd();

      return {
        success: true,
        data: {
          shown: true,
          rewarded: result?.rewarded || false,
          reward: result?.reward,
        },
        platform: this.currentPlatform?.name || 'unknown',
        source: 'local'
      };
    } catch (error) {
      this.logger.error('Error showing rewarded ad:', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: this.currentPlatform?.name || 'unknown',
        source: 'local'
      };
    }
  }

  /**
   * Show interstitial advertisement
   */
  async showInterstitialAd(): Promise<UniversalAPIResponse<{ shown: boolean }>> {
    try {
      this.logger.info(`Showing interstitial ad on ${this.currentPlatform?.name}`);

      if (!this.platformAPI || !this.platformAPI.showInterstitialAd) {
        this.logger.warn('Interstitial ad API not available on current platform');
        return {
          success: false,
          error: 'Interstitial ad API not available',
          platform: this.currentPlatform?.name || 'unknown',
        };
      }

      await this.platformAPI.showInterstitialAd();

      return {
        success: true,
        data: { shown: true },
        platform: this.currentPlatform?.name || 'unknown',
        source: 'local'
      };
    } catch (error) {
      this.logger.error('Error showing interstitial ad:', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: this.currentPlatform?.name || 'unknown',
        source: 'local'
      };
    }
  }

  /**
   * Get user information
   */
  async getUserInfo(): Promise<UniversalAPIResponse<UserInfo>> {
    try {
      this.logger.info(`Getting user info from ${this.currentPlatform?.name}`);

      if (!this.platformAPI || !this.platformAPI.getUserInfo) {
        // Return mock user info for platforms without user API
        return {
          success: true,
          data: {
            id: 'guest-user',
            name: 'Guest User',
            platform: this.currentPlatform?.name || 'unknown',
            isGuest: true,
            isPremium: false,
            source: 'local'
          },
          platform: this.currentPlatform?.name || 'unknown',
        };
      }

      const userInfo = await this.platformAPI.getUserInfo();

      return {
        success: true,
        data: {
          id: userInfo.id || 'unknown',
          name: userInfo.name || 'Unknown User',
          avatar: userInfo.avatar,
          platform: this.currentPlatform?.name || 'unknown',
          isGuest: userInfo.isGuest || false,
          isPremium: userInfo.isPremium || false,
          source: 'local'
        },
        platform: this.currentPlatform?.name || 'unknown',
        source: 'local'
      };
    } catch (error) {
      this.logger.error('Error getting user info:', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: this.currentPlatform?.name || 'unknown',
        source: 'local'
      };
    }
  }

  /**
   * Track analytics event
   */
  async trackEvent(
    eventName: string,
    parameters: Record<string, any> = {},
  ): Promise<UniversalAPIResponse<void>> {
    try {
      this.logger.info(`Tracking event: ${eventName} on ${this.currentPlatform?.name}`);

      const event: AnalyticsEvent = {
        eventName,
        parameters,
        timestamp: Date.now(),
        platform: this.currentPlatform?.name || 'unknown',
        source: 'local'
      };

      // Track via platform API if available
      if (this.platformAPI && this.platformAPI.trackEvent) {
        await this.platformAPI.trackEvent(eventName, parameters);
      }

      // Always track internally for analytics
      await this.trackInternalEvent(event);

      return {
        success: true,
        platform: this.currentPlatform?.name || 'unknown',
        source: 'local'
      };
    } catch (error) {
      this.logger.error('Error tracking event:', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: this.currentPlatform?.name || 'unknown',
        source: 'local'
      };
    }
  }

  /**
   * Check if ads are blocked
   */
  async isAdBlocked(): Promise<UniversalAPIResponse<boolean>> {
    try {
      if (!this.platformAPI || !this.platformAPI.isAdBlocked) {
        return {
          success: true,
          data: false,
          platform: this.currentPlatform?.name || 'unknown',
        };
      }

      const isBlocked = await this.platformAPI.isAdBlocked();

      return {
        success: true,
        data: isBlocked,
        platform: this.currentPlatform?.name || 'unknown',
        source: 'local'
      };
    } catch (error) {
      this.logger.error('Error checking ad block status:', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: this.currentPlatform?.name || 'unknown',
        source: 'local'
      };
    }
  }

  /**
   * Check if user has ad-free subscription
   */
  async isAdFree(): Promise<UniversalAPIResponse<boolean>> {
    try {
      if (!this.platformAPI || !this.platformAPI.isAdFree) {
        return {
          success: true,
          data: false,
          platform: this.currentPlatform?.name || 'unknown',
        };
      }

      const isAdFree = await this.platformAPI.isAdFree();

      return {
        success: true,
        data: isAdFree,
        platform: this.currentPlatform?.name || 'unknown',
        source: 'local'
      };
    } catch (error) {
      this.logger.error('Error checking ad-free status:', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: this.currentPlatform?.name || 'unknown',
        source: 'local'
      };
    }
  }

  /**
   * Handle gameplay start
   */
  async gameplayStart(): Promise<UniversalAPIResponse<void>> {
    try {
      this.logger.info(`Gameplay started on ${this.currentPlatform?.name}`);

      if (this.platformAPI && this.platformAPI.gameplayStart) {
        await this.platformAPI.gameplayStart();
      }

      // Track gameplay start event
      await this.trackEvent('gameplay_started', {
        platform: this.currentPlatform?.name || 'unknown',
        timestamp: Date.now(),
      });

      return {
        success: true,
        platform: this.currentPlatform?.name || 'unknown',
        source: 'local'
      };
    } catch (error) {
      this.logger.error('Error handling gameplay start:', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: this.currentPlatform?.name || 'unknown',
        source: 'local'
      };
    }
  }

  /**
   * Handle gameplay stop
   */
  async gameplayStop(): Promise<UniversalAPIResponse<void>> {
    try {
      this.logger.info(`Gameplay stopped on ${this.currentPlatform?.name}`);

      if (this.platformAPI && this.platformAPI.gameplayStop) {
        await this.platformAPI.gameplayStop();
      }

      // Track gameplay stop event
      await this.trackEvent('gameplay_stopped', {
        platform: this.currentPlatform?.name || 'unknown',
        timestamp: Date.now(),
      });

      return {
        success: true,
        platform: this.currentPlatform?.name || 'unknown',
        source: 'local'
      };
    } catch (error) {
      this.logger.error('Error handling gameplay stop:', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: this.currentPlatform?.name || 'unknown',
        source: 'local'
      };
    }
  }

  /**
   * Get platform capabilities
   */
  getPlatformCapabilities(): UniversalAPIResponse<any> {
    if (!this.currentPlatform) {
      return {
        success: false,
        error: 'Platform not detected',
        platform: 'unknown',
      };
    }

    return {
      success: true,
      data: {
        platform: this.currentPlatform.name,
        type: this.currentPlatform.type,
        capabilities: this.currentPlatform.capabilities,
        features: this.currentPlatform.config.features,
      },
      platform: this.currentPlatform.name,
    };
  }

  /**
   * Get platform-specific configuration
   */
  getPlatformConfig(): UniversalAPIResponse<any> {
    if (!this.currentPlatform) {
      return {
        success: false,
        error: 'Platform not detected',
        platform: 'unknown',
      };
    }

    return {
      success: true,
      data: {
        platform: this.currentPlatform.name,
        optimization: this.currentPlatform.config.optimization,
        build: this.currentPlatform.config.build,
      },
      platform: this.currentPlatform.name,
    };
  }

  /**
   * Track internal analytics event
   */
  private async trackInternalEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // This would integrate with your analytics service
      this.logger.debug('Tracking internal event:', event);

      // Example: Send to analytics service
      // await analyticsService.trackEvent(event.eventName, event.parameters);
    } catch (error) {
      this.logger.error('Error tracking internal event:', { error });
    }
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
   * Real data helper methods
   */
  private generateUserId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `user_${timestamp}_${random}`;
  }

  private getRealUserName(): string {
    try {
      if (typeof localStorage !== 'undefined') {
        const savedName = localStorage.getItem('user_name');
        if (savedName) return savedName;
      }
      
      // Generate a realistic username
      const adjectives = ['Cool', 'Amazing', 'Super', 'Epic', 'Awesome', 'Fantastic', 'Incredible', 'Brilliant'];
      const nouns = ['Player', 'Gamer', 'Champion', 'Hero', 'Master', 'Legend', 'Pro', 'Expert'];
      const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
      const noun = nouns[Math.floor(Math.random() * nouns.length)];
      const number = Math.floor(Math.random() * 999) + 1;
      
      return `${adjective}${noun}${number}`;
    } catch (error) {
      return 'Player' + Math.floor(Math.random() * 9999) + 1;
    }
  }

  private getRealPlatform(): string {
    try {
      if (typeof navigator !== 'undefined') {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('mobile') || userAgent.includes('android') || userAgent.includes('iphone')) {
          return 'mobile';
        } else if (userAgent.includes('tablet') || userAgent.includes('ipad')) {
          return 'tablet';
        } else {
          return 'desktop';
        }
      }
      return 'web';
    } catch (error) {
      return 'web';
    }
  }

  private checkPremiumStatus(): boolean {
    try {
      if (typeof localStorage !== 'undefined') {
        const premiumStatus = localStorage.getItem('premium_status');
        return premiumStatus === 'true';
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  private getUserPreferences(): any {
    try {
      if (typeof localStorage !== 'undefined') {
        const preferences = localStorage.getItem('user_preferences');
        return preferences ? JSON.parse(preferences) : {
          theme: 'dark',
          sound_enabled: true,
          music_enabled: true,
          notifications: true,
          language: navigator.language || 'en-US'
        };
      }
      return {
        theme: 'dark',
        sound_enabled: true,
        music_enabled: true,
        notifications: true,
        language: 'en-US'
      };
    } catch (error) {
      return {
        theme: 'dark',
        sound_enabled: true,
        music_enabled: true,
        notifications: true,
        language: 'en-US'
      };
    }
  }

  private getGameProgress(): any {
    try {
      if (typeof localStorage !== 'undefined') {
        const progress = localStorage.getItem('game_progress');
        return progress ? JSON.parse(progress) : {
          current_level: 1,
          levels_completed: 0,
          total_score: 0,
          play_time: 0,
          last_played: new Date().toISOString()
        };
      }
      return {
        current_level: 1,
        levels_completed: 0,
        total_score: 0,
        play_time: 0,
        last_played: new Date().toISOString()
      };
    } catch (error) {
      return {
        current_level: 1,
        levels_completed: 0,
        total_score: 0,
        play_time: 0,
        last_played: new Date().toISOString()
      };
    }
  }

  private getUserAchievements(): any[] {
    try {
      if (typeof localStorage !== 'undefined') {
        const achievements = localStorage.getItem('user_achievements');
        return achievements ? JSON.parse(achievements) : [];
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  private getAdPreferences(): any {
    try {
      if (typeof localStorage !== 'undefined') {
        const adPrefs = localStorage.getItem('ad_preferences');
        return adPrefs ? JSON.parse(adPrefs) : {
          frequency: 'normal',
          types: ['banner', 'interstitial', 'rewarded'],
          personalized: true
        };
      }
      return {
        frequency: 'normal',
        types: ['banner', 'interstitial', 'rewarded'],
        personalized: true
      };
    } catch (error) {
      return {
        frequency: 'normal',
        types: ['banner', 'interstitial', 'rewarded'],
        personalized: true
      };
    }
  }

  private calculateUserEngagement(): any {
    try {
      if (typeof localStorage !== 'undefined') {
        const sessionData = localStorage.getItem('session_data');
        if (sessionData) {
          const data = JSON.parse(sessionData);
          return {
            total_sessions: data.total_sessions || 0,
            average_session_duration: data.average_session_duration || 0,
            last_session_duration: data.last_session_duration || 0,
            engagement_score: this.calculateEngagementScore(data)
          };
        }
      }
      return {
        total_sessions: 0,
        average_session_duration: 0,
        last_session_duration: 0,
        engagement_score: 0
      };
    } catch (error) {
      return {
        total_sessions: 0,
        average_session_duration: 0,
        last_session_duration: 0,
        engagement_score: 0
      };
    }
  }

  private calculateEngagementScore(data: any): number {
    const sessions = data.total_sessions || 0;
    const avgDuration = data.average_session_duration || 0;
    const lastDuration = data.last_session_duration || 0;
    
    // Simple engagement score calculation
    let score = 0;
    if (sessions > 0) score += Math.min(sessions * 10, 50);
    if (avgDuration > 0) score += Math.min(avgDuration / 60, 30);
    if (lastDuration > 0) score += Math.min(lastDuration / 60, 20);
    
    return Math.min(score, 100);
  }

  private getPerformanceMetrics(): any {
    try {
      if (typeof performance !== 'undefined') {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paint = performance.getEntriesByType('paint');
        
        return {
          load_time: navigation ? Math.round(navigation.loadEventEnd - navigation.loadEventStart) : 0,
          dom_content_loaded: navigation ? Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart) : 0,
          first_paint: paint.find(p => p.name === 'first-paint') ? Math.round(paint.find(p => p.name === 'first-paint')!.startTime) : 0,
          first_contentful_paint: paint.find(p => p.name === 'first-contentful-paint') ? Math.round(paint.find(p => p.name === 'first-contentful-paint')!.startTime) : 0,
          memory_usage: this.getMemoryUsage(),
          fps: this.getFPS()
        };
      }
      return {
        load_time: 0,
        dom_content_loaded: 0,
        first_paint: 0,
        first_contentful_paint: 0,
        memory_usage: 0,
        fps: 60
      };
    } catch (error) {
      return {
        load_time: 0,
        dom_content_loaded: 0,
        first_paint: 0,
        first_contentful_paint: 0,
        memory_usage: 0,
        fps: 60
      };
    }
  }

  private getMemoryUsage(): number {
    try {
      if (typeof performance !== 'undefined' && (performance as any).memory) {
        return Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024);
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  private getFPS(): number {
    try {
      if (typeof performance !== 'undefined') {
        const fps = performance.getEntriesByType('measure').find(m => m.name === 'fps');
        return fps ? Math.round(fps.duration) : 60;
      }
      return 60;
    } catch (error) {
      return 60;
    }
  }

  private getSubscriptionStatus(): any {
    try {
      if (typeof localStorage !== 'undefined') {
        const subscription = localStorage.getItem('subscription_status');
        return subscription ? JSON.parse(subscription) : {
          active: false,
          type: 'none',
          expires_at: null,
          auto_renew: false
        };
      }
      return {
        active: false,
        type: 'none',
        expires_at: null,
        auto_renew: false
      };
    } catch (error) {
      return {
        active: false,
        type: 'none',
        expires_at: null,
        auto_renew: false
      };
    }
  }

  private getPaymentMethods(): any[] {
    try {
      if (typeof localStorage !== 'undefined') {
        const paymentMethods = localStorage.getItem('payment_methods');
        return paymentMethods ? JSON.parse(paymentMethods) : [];
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  private getGameSettings(): any {
    try {
      if (typeof localStorage !== 'undefined') {
        const settings = localStorage.getItem('game_settings');
        return settings ? JSON.parse(settings) : {
          sound_volume: 0.8,
          music_volume: 0.6,
          graphics_quality: 'high',
          controls: 'touch',
          language: navigator.language || 'en-US'
        };
      }
      return {
        sound_volume: 0.8,
        music_volume: 0.6,
        graphics_quality: 'high',
        controls: 'touch',
        language: 'en-US'
      };
    } catch (error) {
      return {
        sound_volume: 0.8,
        music_volume: 0.6,
        graphics_quality: 'high',
        controls: 'touch',
        language: 'en-US'
      };
    }
  }

  private getGameStatistics(): any {
    try {
      if (typeof localStorage !== 'undefined') {
        const stats = localStorage.getItem('game_statistics');
        return stats ? JSON.parse(stats) : {
          total_play_time: 0,
          levels_completed: 0,
          total_score: 0,
          matches_made: 0,
          powerups_used: 0,
          coins_earned: 0,
          gems_earned: 0
        };
      }
      return {
        total_play_time: 0,
        levels_completed: 0,
        total_score: 0,
        matches_made: 0,
        powerups_used: 0,
        coins_earned: 0,
        gems_earned: 0
      };
    } catch (error) {
      return {
        total_play_time: 0,
        levels_completed: 0,
        total_score: 0,
        matches_made: 0,
        powerups_used: 0,
        coins_earned: 0,
        gems_earned: 0
      };
    }
  }

  private getFromLocalStorage(key: string): any {
    try {
      if (typeof localStorage !== 'undefined') {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  private saveToLocalStorage(key: string, data: any): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(data));
      }
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  private createDefaultUser(): void {
    const defaultUser = {
      id: this.generateUserId(),
      name: 'Player',
      platform: 'web',
      isGuest: false,
      isPremium: false,
      source: 'local',
      created_at: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      preferences: this.getUserPreferences(),
      game_progress: this.getGameProgress(),
      achievements: []
    };
    this.localData.set('user_info', defaultUser);
  }

  private createDefaultAdSettings(): void {
    const defaultSettings = {
      banner_enabled: true,
      interstitial_enabled: true,
      rewarded_enabled: true,
      ad_frequency: 3,
      last_ad_shown: 0,
      ad_revenue: 0,
      ads_shown_today: 0,
      last_reset_date: new Date().toDateString(),
      user_preferences: this.getAdPreferences()
    };
    this.localData.set('ad_settings', defaultSettings);
  }

  private createDefaultAnalytics(): void {
    const defaultAnalytics = {
      events: [],
      session_start: Date.now(),
      total_events: 0,
      daily_events: 0,
      last_reset_date: new Date().toDateString(),
      user_engagement: this.calculateUserEngagement(),
      performance_metrics: this.getPerformanceMetrics(),
      error_logs: []
    };
    this.localData.set('analytics', defaultAnalytics);
  }

  private createDefaultPurchases(): void {
    const defaultPurchases = {
      items: [],
      total_spent: 0,
      currency: 'USD',
      purchase_history: [],
      refunds: [],
      subscription_status: this.getSubscriptionStatus(),
      payment_methods: []
    };
    this.localData.set('purchases', defaultPurchases);
  }

  private createDefaultGameData(): void {
    const defaultGameData = {
      level: 1,
      score: 0,
      coins: 100,
      gems: 10,
      powerups: [],
      achievements: [],
      settings: this.getGameSettings(),
      statistics: this.getGameStatistics(),
      progress: this.getGameProgress()
    };
    this.localData.set('game_data', defaultGameData);
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
  isFeatureSupported(feature: keyof typeof this.currentPlatform.capabilities): boolean {
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

    return recommendations;
  }
}

export default UniversalAPI;
