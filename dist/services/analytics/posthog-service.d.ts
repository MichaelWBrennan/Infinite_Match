/**
 * PostHog Analytics Service - Advanced analytics with AI-powered insights
 * Provides real-time player behavior analysis, A/B testing, and automated optimization
 */
export class PostHogAnalyticsService {
    logger: Logger;
    posthog: any;
    browserPostHog: any;
    experiments: Map<any, any>;
    playerCohorts: Map<any, any>;
    insights: Map<any, any>;
    /**
     * Initialize analytics tracking
     */
    initializeAnalytics(): void;
    /**
     * Track player events with AI-powered analysis
     */
    trackEvent(playerId: any, eventName: any, properties?: {}): Promise<void>;
    /**
     * Enrich event properties with AI-generated insights
     */
    enrichEventProperties(playerId: any, eventName: any, properties: any): Promise<any>;
    /**
     * Create and manage A/B tests
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
    getExperimentVariant(playerId: any, experimentName: any): Promise<any>;
    /**
     * Generate AI-powered insights from player behavior
     */
    generateRealTimeInsights(playerId: any, eventName: any, properties: any): Promise<void>;
    /**
     * Analyze player behavior patterns
     */
    analyzeBehaviorPatterns(events: any): {
        sessionLength: number;
        eventFrequency: number;
        engagementTrend: number;
        monetizationBehavior: {
            spendingPotential: number;
            purchaseHistory: never[];
        };
        progressionRate: number;
    };
    /**
     * Generate actionable insights
     */
    generateInsights(playerId: any, patterns: any, eventName: any, properties: any): Promise<{
        playerId: any;
        patterns: any;
        recommendations: never[];
        alerts: never[];
        opportunities: never[];
    }>;
    /**
     * Trigger automated actions based on insights
     */
    triggerAutomatedActions(playerId: any, insights: any): Promise<void>;
    /**
     * Handle player alerts
     */
    handleAlert(playerId: any, alert: any): Promise<void>;
    /**
     * Handle monetization opportunities
     */
    handleOpportunity(playerId: any, opportunity: any): Promise<void>;
    /**
     * Handle engagement recommendations
     */
    handleRecommendation(playerId: any, recommendation: any): Promise<void>;
    /**
     * Get player cohort analysis
     */
    getPlayerCohort(playerId: any): Promise<any>;
    /**
     * Analyze player cohort based on behavior
     */
    analyzePlayerCohort(playerData: any): "paying_player" | "engaged_free_player" | "high_level_player" | "new_player" | "casual_player";
    /**
     * Predict player LTV
     */
    predictLTV(playerId: any): Promise<number>;
    /**
     * Predict churn risk
     */
    predictChurnRisk(playerId: any): Promise<0.1 | 0.6 | 0.9>;
    /**
     * Calculate engagement score
     */
    calculateEngagementScore(playerId: any): Promise<number>;
    getSessionId(playerId: any): string;
    detectPlatform(): "unknown" | "mobile" | "desktop" | "tablet";
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
    getRecentEvents(playerId: any, limit: any): Promise<never[]>;
    getDaysSinceLastEvent(events: any): number;
    calculateAverageSessionLength(events: any): number;
    calculateEventFrequency(events: any): number;
    calculateEngagementTrend(events: any): number;
    analyzeMonetizationBehavior(events: any): {
        spendingPotential: number;
        purchaseHistory: never[];
    };
    calculateProgressionRate(events: any): number;
    sendRetentionCampaign(playerId: any): Promise<void>;
    sendEngagementBoost(playerId: any): Promise<void>;
    showPersonalizedOffer(playerId: any, opportunity: any): Promise<void>;
    improvePlayerExperience(playerId: any, recommendation: any): Promise<void>;
    setGlobalProperties(properties: any): void;
    startInsightsGeneration(): void;
    generateBatchInsights(): Promise<void>;
    /**
     * Get analytics dashboard data
     */
    getDashboardData(timeRange?: string): Promise<{
        insights: any;
        experiments: any[];
        playerCohorts: {};
        generatedAt: string;
    }>;
    getDateFrom(timeRange: any): string;
    getCohortAnalysis(): {};
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
import { Logger } from '../../core/logger/index.js';
//# sourceMappingURL=posthog-service.d.ts.map