declare const _default: UnifiedAnalyticsService;
export default _default;
/**
 * Unified Analytics Service
 * Consolidates Amplitude, Mixpanel, and other analytics into PostHog
 */
declare class UnifiedAnalyticsService {
    logger: Logger;
    sessionId: `${string}-${string}-${string}-${string}-${string}`;
    posthog: PostHog | null;
    browserPostHog: any;
    isInitialized: boolean;
    eventQueue: any[];
    playerCohorts: Map<any, any>;
    insights: Map<any, any>;
    /**
     * Initialize analytics tracking
     */
    initializeAnalytics(): void;
    /**
     * Track player events (replaces Amplitude, Mixpanel)
     */
    trackEvent(playerId: any, eventName: any, properties?: {}): Promise<void>;
    /**
     * Track game events (replaces Unity Analytics)
     */
    trackGameEvent(eventName: any, properties?: {}, userId?: null): Promise<void>;
    /**
     * Track a game session starting (replaces Unity Analytics).
     */
    trackGameStart(userId: any, gameData?: {}): Promise<void>;
    /**
     * Track a completed level (replaces Unity Analytics).
     */
    trackLevelComplete(userId: any, levelData?: {}): Promise<void>;
    /**
     * Track a match being made on the board.
     */
    trackMatchMade(userId: any, matchData?: {}): Promise<void>;
    /**
     * Track a power-up being consumed.
     */
    trackPowerUpUsed(userId: any, powerUpData?: {}): Promise<void>;
    /**
     * Track an in-game purchase.
     */
    trackPurchase(userId: any, purchaseData?: {}): Promise<void>;
    /**
     * Summary of what this service has recorded, used by the analytics endpoint.
     */
    getAnalyticsSummary(): {
        service: string;
        initialized: boolean;
        provider: string;
        trackedPlayers: number;
        trackedInsights: number;
        timestamp: string;
    };
    /**
     * Track performance metrics (replaces Datadog)
     */
    trackPerformance(userId: any, metrics: any): Promise<void>;
    /**
     * Create and manage A/B tests (replaces Amplitude experiments)
     */
    createExperiment(experimentName: any, variants: any, targetAudience?: {}): Promise<{
        name: any;
        variants: any;
        targetAudience: {};
        startDate: string;
        status: string;
        results: {};
    }>;
    /**
     * Get experiment variant for a player
     */
    getExperimentVariant(playerId: any, experimentName: any): Promise<string | boolean | null | undefined>;
    /**
     * Enrich event properties with additional context
     */
    enrichEventProperties(playerId: any, eventName: any, properties: any): Promise<any>;
    /**
     * Get player cohort analysis
     */
    getPlayerCohort(playerId: any): Promise<any>;
    /**
     * Analyze player cohort based on behavior
     */
    analyzePlayerCohort(playerData: any): "paying_player" | "engaged_free_player" | "high_level_player" | "new_player" | "casual_player";
    getSessionId(playerId: any): string;
    detectPlatform(): "mobile" | "desktop" | "unknown" | "tablet";
    getUserAgent(): string;
    getScreenResolution(): string;
    getGameState(playerId: any): Promise<{
        level: number;
        score: number;
        coins: number;
    }>;
    getPlayerData(playerId: any): Promise<{
        sessionCount: number;
        totalPlayTime: number;
        purchases: number;
        level: number;
    }>;
    setGlobalProperties(properties: any): void;
    /**
     * Get analytics dashboard data
     */
    getDashboardData(timeRange?: string): Promise<{
        insights: any;
        playerCohorts: {};
        generatedAt: string;
    }>;
    getDateFrom(timeRange: any): string;
    getCohortAnalysis(): {};
    /**
     * Initialize the service.
     *
     * Called by the server bootstrap; safe to invoke repeatedly because the
     * constructor already performs the first-time setup.
     */
    initialize(): Promise<boolean>;
    /**
     * Track an error (used by the error-tracking middleware).
     */
    trackError(userId: any, errorData?: {}): Promise<void>;
    /**
     * Report service health for the /health endpoint.
     */
    getHealthStatus(): {
        service: string;
        status: string;
        provider: string;
        queuedEvents: number;
        trackedPlayers: number;
    };
    /**
     * Shut the service down. Alias of `cleanup()` - the server's graceful
     * shutdown path calls `analyticsService.shutdown()`.
     */
    shutdown(): Promise<void>;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
import { Logger } from '../core/logger/index.js';
import { PostHog } from 'posthog-node';
//# sourceMappingURL=unified-analytics-service.d.ts.map