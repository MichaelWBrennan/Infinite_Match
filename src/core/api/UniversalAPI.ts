/**
 * Universal API Compatibility Layer
 * Provides unified API across all platforms (WebGL, Android, iOS, Kongregate, Poki, etc.)
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
}

export interface AnalyticsEvent {
  eventName: string;
  parameters: Record<string, any>;
  timestamp: number;
  platform: string;
}

export interface PurchaseInfo {
  productId: string;
  price: number;
  currency: string;
  platform: string;
  transactionId: string;
}

export class UniversalAPI {
  private logger: Logger;
  private platformDetector: PlatformDetector;
  private platformAPI: any;
  private currentPlatform: PlatformInfo | null = null;

  constructor() {
    this.logger = new Logger('UniversalAPI');
    this.platformDetector = new PlatformDetector();
  }

  /**
   * Initialize Universal API
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Universal API...');

      // Detect platform
      this.currentPlatform = await this.platformDetector.detectPlatform();

      // Get platform-specific API
      this.platformAPI = this.platformDetector.getPlatformAPI();

      this.logger.info(`Universal API initialized for platform: ${this.currentPlatform.name}`);
    } catch (error) {
      this.logger.error('Failed to initialize Universal API:', error);
      throw error;
    }
  }

  /**
   * Show advertisement
   */
  async showAd(
    config: AdConfig,
  ): Promise<UniversalAPIResponse<{ shown: boolean; revenue?: number }>> {
    try {
      this.logger.info(`Showing ${config.type} ad on ${this.currentPlatform?.name}`);

      if (!this.platformAPI || !this.platformAPI.showAd) {
        this.logger.warn('Ad API not available on current platform');
        return {
          success: false,
          error: 'Ad API not available',
          platform: this.currentPlatform?.name,
        };
      }

      const result = await this.platformAPI.showAd(config.type);

      return {
        success: true,
        data: { shown: true, revenue: result?.revenue },
        platform: this.currentPlatform?.name,
      };
    } catch (error) {
      this.logger.error('Error showing ad:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: this.currentPlatform?.name,
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
          platform: this.currentPlatform?.name,
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
        platform: this.currentPlatform?.name,
      };
    } catch (error) {
      this.logger.error('Error showing rewarded ad:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: this.currentPlatform?.name,
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
          platform: this.currentPlatform?.name,
        };
      }

      await this.platformAPI.showInterstitialAd();

      return {
        success: true,
        data: { shown: true },
        platform: this.currentPlatform?.name,
      };
    } catch (error) {
      this.logger.error('Error showing interstitial ad:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: this.currentPlatform?.name,
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
          },
          platform: this.currentPlatform?.name,
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
        },
        platform: this.currentPlatform?.name,
      };
    } catch (error) {
      this.logger.error('Error getting user info:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: this.currentPlatform?.name,
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
      };

      // Track via platform API if available
      if (this.platformAPI && this.platformAPI.trackEvent) {
        await this.platformAPI.trackEvent(eventName, parameters);
      }

      // Always track internally for analytics
      await this.trackInternalEvent(event);

      return {
        success: true,
        platform: this.currentPlatform?.name,
      };
    } catch (error) {
      this.logger.error('Error tracking event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: this.currentPlatform?.name,
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
          platform: this.currentPlatform?.name,
        };
      }

      const isBlocked = await this.platformAPI.isAdBlocked();

      return {
        success: true,
        data: isBlocked,
        platform: this.currentPlatform?.name,
      };
    } catch (error) {
      this.logger.error('Error checking ad block status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: this.currentPlatform?.name,
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
          platform: this.currentPlatform?.name,
        };
      }

      const isAdFree = await this.platformAPI.isAdFree();

      return {
        success: true,
        data: isAdFree,
        platform: this.currentPlatform?.name,
      };
    } catch (error) {
      this.logger.error('Error checking ad-free status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: this.currentPlatform?.name,
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
        platform: this.currentPlatform?.name,
        timestamp: Date.now(),
      });

      return {
        success: true,
        platform: this.currentPlatform?.name,
      };
    } catch (error) {
      this.logger.error('Error handling gameplay start:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: this.currentPlatform?.name,
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
        platform: this.currentPlatform?.name,
        timestamp: Date.now(),
      });

      return {
        success: true,
        platform: this.currentPlatform?.name,
      };
    } catch (error) {
      this.logger.error('Error handling gameplay stop:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: this.currentPlatform?.name,
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
      this.logger.error('Error tracking internal event:', error);
    }
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
