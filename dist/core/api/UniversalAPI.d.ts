/**
 * Free Universal API Compatibility Layer - 100% Open Source
 * Provides unified API across all platforms with no external dependencies
 */
import { PlatformInfo } from '../platform/PlatformDetector.js';
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
export declare class UniversalAPI {
    private logger;
    private platformDetector;
    private platformAPI;
    private currentPlatform;
    private localData;
    private mockData;
    constructor();
    /**
     * Initialize Universal API
     */
    initialize(): Promise<void>;
    /**
     * Initialize local data storage
     */
    private initializeLocalData;
    /**
     * Load real user data from storage
     */
    private loadRealUserData;
    /**
     * Load real ad settings
     */
    private loadRealAdSettings;
    /**
     * Load real analytics data
     */
    private loadRealAnalytics;
    /**
     * Load real purchases data
     */
    private loadRealPurchases;
    /**
     * Load real game data
     */
    private loadRealGameData;
    /**
     * Initialize mock data for testing
     */
    private initializeMockData;
    /**
     * Create local platform API implementation
     */
    private createLocalPlatformAPI;
    /**
     * Show advertisement (local implementation)
     */
    showAd(config: AdConfig): Promise<UniversalAPIResponse<{
        shown: boolean;
        revenue?: number;
    }>>;
    /**
     * Show rewarded advertisement
     */
    showRewardedAd(): Promise<UniversalAPIResponse<{
        shown: boolean;
        rewarded: boolean;
        reward?: any;
    }>>;
    /**
     * Show interstitial advertisement
     */
    showInterstitialAd(): Promise<UniversalAPIResponse<{
        shown: boolean;
    }>>;
    /**
     * Get user information
     */
    getUserInfo(): Promise<UniversalAPIResponse<UserInfo>>;
    /**
     * Track analytics event
     */
    trackEvent(eventName: string, parameters?: Record<string, any>): Promise<UniversalAPIResponse<void>>;
    /**
     * Check if ads are blocked
     */
    isAdBlocked(): Promise<UniversalAPIResponse<boolean>>;
    /**
     * Check if user has ad-free subscription
     */
    isAdFree(): Promise<UniversalAPIResponse<boolean>>;
    /**
     * Handle gameplay start
     */
    gameplayStart(): Promise<UniversalAPIResponse<void>>;
    /**
     * Handle gameplay stop
     */
    gameplayStop(): Promise<UniversalAPIResponse<void>>;
    /**
     * Get platform capabilities
     */
    getPlatformCapabilities(): UniversalAPIResponse<any>;
    /**
     * Get platform-specific configuration
     */
    getPlatformConfig(): UniversalAPIResponse<any>;
    /**
     * Track internal analytics event
     */
    private trackInternalEvent;
    /**
     * Local implementation methods
     */
    private showAdLocal;
    private showRewardedAdLocal;
    private showInterstitialAdLocal;
    private getUserInfoLocal;
    private trackEventLocal;
    private isAdBlockedLocal;
    private isAdFreeLocal;
    private gameplayStartLocal;
    private gameplayStopLocal;
    /**
     * Helper methods
     */
    private shouldShowAd;
    private simulateAdDisplay;
    private simulateRewardedAd;
    private simulateInterstitialAd;
    private simulateAdBlockDetection;
    /**
     * Real data helper methods
     */
    private generateUserId;
    private getRealUserName;
    private getRealPlatform;
    private checkPremiumStatus;
    private getUserPreferences;
    private getGameProgress;
    private getUserAchievements;
    private getAdPreferences;
    private calculateUserEngagement;
    private calculateEngagementScore;
    private getPerformanceMetrics;
    private getMemoryUsage;
    private getFPS;
    private getSubscriptionStatus;
    private getPaymentMethods;
    private getGameSettings;
    private getGameStatistics;
    private getFromLocalStorage;
    private saveToLocalStorage;
    private createDefaultUser;
    private createDefaultAdSettings;
    private createDefaultAnalytics;
    private createDefaultPurchases;
    private createDefaultGameData;
    /**
     * Get current platform info
     */
    getCurrentPlatform(): PlatformInfo | null;
    /**
     * Check if feature is supported
     */
    isFeatureSupported(feature: keyof typeof this.currentPlatform.capabilities): boolean;
    /**
     * Get platform-specific recommendations
     */
    getPlatformRecommendations(): string[];
}
export default UniversalAPI;
//# sourceMappingURL=UniversalAPI.d.ts.map