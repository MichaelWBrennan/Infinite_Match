import { randomUUID } from 'crypto';
import { Logger } from '../core/logger/index.js';
import { PostHog } from 'posthog-node';
import posthog from 'posthog-js';
import { ServiceError } from '../core/errors/ErrorHandler.js';
/**
 * Unified Analytics Service
 * Consolidates Amplitude, Mixpanel, and other analytics into PostHog
 */
class UnifiedAnalyticsService {
    constructor() {
        this.logger = new Logger('UnifiedAnalyticsService');
        // Stable id for this service instance, surfaced in API responses.
        this.sessionId = randomUUID();
        // Initialize PostHog server-side client.
        // The client throws when no API key is configured, and analytics must never
        // prevent the game server from booting, so it stays optional.
        this.posthog = null;
        if (process.env.POSTHOG_API_KEY) {
            this.posthog = new PostHog(process.env.POSTHOG_API_KEY, {
                host: process.env.POSTHOG_HOST || 'https://app.posthog.com',
                flushAt: 20,
                flushInterval: 10000,
            });
        }
        else {
            this.logger.warn('POSTHOG_API_KEY is not set - analytics events will be logged locally only');
        }
        // Initialize PostHog client-side (for browser)
        if (typeof window !== 'undefined') {
            posthog.init(process.env.POSTHOG_PUBLIC_KEY, {
                api_host: process.env.POSTHOG_HOST || 'https://app.posthog.com',
                loaded: (posthog) => {
                    this.browserPostHog = posthog;
                }
            });
        }
        this.isInitialized = false;
        this.eventQueue = [];
        this.playerCohorts = new Map();
        this.insights = new Map();
        this.initializeAnalytics();
    }
    /**
     * Initialize analytics tracking
     */
    initializeAnalytics() {
        this.logger.info('Initializing Unified Analytics Service');
        // Set up default properties
        this.setGlobalProperties({
            game_name: 'Infinite Match',
            game_version: '1.0.0',
            platform: 'webgl',
            analytics_provider: 'posthog'
        });
        this.isInitialized = true;
        this.logger.info('Unified Analytics Service initialized');
    }
    /**
     * Track player events (replaces Amplitude, Mixpanel)
     */
    async trackEvent(playerId, eventName, properties = {}) {
        try {
            const enrichedProperties = await this.enrichEventProperties(playerId, eventName, properties);
            // Track on server-side
            if (this.posthog) {
                this.posthog.capture({
                    distinctId: playerId,
                    event: eventName,
                    properties: enrichedProperties
                });
            }
            // Track on client-side if available
            if (this.browserPostHog) {
                this.browserPostHog.capture(eventName, enrichedProperties);
            }
            this.logger.info(`Tracked event: ${eventName} for player: ${playerId}`);
        }
        catch (error) {
            this.logger.error('Failed to track event:', error);
            throw new ServiceError('EVENT_TRACKING_FAILED', error.message);
        }
    }
    /**
     * Track game events (replaces Unity Analytics)
     */
    async trackGameEvent(eventName, properties = {}, userId = null) {
        try {
            const enrichedProperties = {
                ...properties,
                timestamp: new Date().toISOString(),
                event_type: 'game_event',
                game_version: '1.0.0',
                platform: this.detectPlatform(),
            };
            if (userId) {
                await this.trackEvent(userId, eventName, enrichedProperties);
            }
            else if (this.posthog) {
                // Track as anonymous event
                this.posthog.capture({
                    distinctId: 'anonymous',
                    event: eventName,
                    properties: enrichedProperties
                });
            }
            this.logger.info(`Tracked game event: ${eventName}`);
        }
        catch (error) {
            this.logger.error('Failed to track game event:', error);
            throw new ServiceError('GAME_EVENT_TRACKING_FAILED', error.message);
        }
    }
    /**
     * Track a game session starting (replaces Unity Analytics).
     */
    async trackGameStart(userId, gameData = {}) {
        return this.trackEvent(userId, 'game_started', {
            ...gameData,
            event_type: 'game_start',
        });
    }
    /**
     * Track a completed level (replaces Unity Analytics).
     */
    async trackLevelComplete(userId, levelData = {}) {
        return this.trackEvent(userId, 'level_completed', {
            ...levelData,
            event_type: 'level_complete',
        });
    }
    /**
     * Track a match being made on the board.
     */
    async trackMatchMade(userId, matchData = {}) {
        return this.trackEvent(userId, 'match_made', {
            ...matchData,
            event_type: 'match_made',
        });
    }
    /**
     * Track a power-up being consumed.
     */
    async trackPowerUpUsed(userId, powerUpData = {}) {
        return this.trackEvent(userId, 'powerup_used', {
            ...powerUpData,
            event_type: 'powerup_used',
        });
    }
    /**
     * Track an in-game purchase.
     */
    async trackPurchase(userId, purchaseData = {}) {
        return this.trackEvent(userId, 'purchase_made', {
            ...purchaseData,
            event_type: 'purchase',
        });
    }
    /**
     * Summary of what this service has recorded, used by the analytics endpoint.
     */
    getAnalyticsSummary() {
        return {
            service: 'unified-analytics',
            initialized: this.isInitialized,
            provider: 'posthog',
            trackedPlayers: this.playerCohorts ? this.playerCohorts.size : 0,
            trackedInsights: this.insights ? this.insights.size : 0,
            timestamp: new Date().toISOString(),
        };
    }
    /**
     * Track performance metrics (replaces Datadog)
     */
    async trackPerformance(userId, metrics) {
        try {
            const performanceEvent = {
                ...metrics,
                timestamp: new Date().toISOString(),
                event_type: 'performance_metric',
                platform: this.detectPlatform(),
            };
            await this.trackEvent(userId, 'performance_metric', performanceEvent);
        }
        catch (error) {
            this.logger.error('Failed to track performance:', error);
            throw new ServiceError('PERFORMANCE_TRACKING_FAILED', error.message);
        }
    }
    /**
     * Create and manage A/B tests (replaces Amplitude experiments)
     */
    async createExperiment(experimentName, variants, targetAudience = {}) {
        try {
            const experiment = {
                name: experimentName,
                variants: variants,
                targetAudience: targetAudience,
                startDate: new Date().toISOString(),
                status: 'active',
                results: {}
            };
            // Create PostHog feature flag
            if (this.posthog) {
                await this.posthog.createFeatureFlag(experimentName, variants, {
                    active: true,
                    filters: targetAudience
                });
            }
            this.logger.info(`Created experiment: ${experimentName}`);
            return experiment;
        }
        catch (error) {
            this.logger.error('Failed to create experiment:', error);
            throw new ServiceError('EXPERIMENT_CREATION_FAILED', error.message);
        }
    }
    /**
     * Get experiment variant for a player
     */
    async getExperimentVariant(playerId, experimentName) {
        try {
            const variant = this.posthog
                ? await this.posthog.getFeatureFlag(experimentName, playerId)
                : null;
            // Track experiment exposure
            await this.trackEvent(playerId, 'experiment_exposed', {
                experiment_name: experimentName,
                variant: variant
            });
            return variant;
        }
        catch (error) {
            this.logger.error('Failed to get experiment variant:', error);
            return null;
        }
    }
    /**
     * Enrich event properties with additional context
     */
    async enrichEventProperties(playerId, eventName, properties) {
        const enriched = {
            ...properties,
            timestamp: new Date().toISOString(),
            session_id: this.getSessionId(playerId),
            platform: this.detectPlatform(),
            user_agent: this.getUserAgent(),
            screen_resolution: this.getScreenResolution(),
            game_state: await this.getGameState(playerId),
            player_cohort: await this.getPlayerCohort(playerId),
        };
        return enriched;
    }
    /**
     * Get player cohort analysis
     */
    async getPlayerCohort(playerId) {
        const cohort = this.playerCohorts.get(playerId);
        if (cohort) {
            return cohort;
        }
        // Analyze player to determine cohort
        const playerData = await this.getPlayerData(playerId);
        const newCohort = this.analyzePlayerCohort(playerData);
        this.playerCohorts.set(playerId, newCohort);
        return newCohort;
    }
    /**
     * Analyze player cohort based on behavior
     */
    analyzePlayerCohort(playerData) {
        const { sessionCount, totalPlayTime, purchases, level } = playerData;
        if (purchases > 0) {
            return 'paying_player';
        }
        else if (sessionCount > 10 && totalPlayTime > 3600) {
            return 'engaged_free_player';
        }
        else if (level > 50) {
            return 'high_level_player';
        }
        else if (sessionCount < 3) {
            return 'new_player';
        }
        else {
            return 'casual_player';
        }
    }
    // Helper methods
    getSessionId(playerId) {
        return `${playerId}_${Date.now()}`;
    }
    detectPlatform() {
        if (typeof window !== 'undefined') {
            const userAgent = window.navigator.userAgent;
            if (userAgent.includes('Mobile'))
                return 'mobile';
            if (userAgent.includes('Tablet'))
                return 'tablet';
            return 'desktop';
        }
        return 'unknown';
    }
    getUserAgent() {
        if (typeof window !== 'undefined') {
            return window.navigator.userAgent;
        }
        return 'unknown';
    }
    getScreenResolution() {
        if (typeof window !== 'undefined') {
            return `${window.screen.width}x${window.screen.height}`;
        }
        return 'unknown';
    }
    async getGameState(playerId) {
        // This would integrate with your game state service
        return {
            level: 1,
            score: 0,
            coins: 0
        };
    }
    async getPlayerData(playerId) {
        // This would integrate with your player data service
        return {
            sessionCount: 5,
            totalPlayTime: 1800,
            purchases: 0,
            level: 10
        };
    }
    setGlobalProperties(properties) {
        if (this.browserPostHog) {
            this.browserPostHog.register(properties);
        }
    }
    /**
     * Get analytics dashboard data
     */
    async getDashboardData(timeRange = '7d') {
        try {
            const insights = this.posthog
                ? await this.posthog.getInsights({
                    events: [
                        { event: 'level_completed' },
                        { event: 'purchase_made' },
                        { event: 'session_start' }
                    ],
                    date_from: this.getDateFrom(timeRange),
                    date_to: new Date().toISOString()
                })
                : null;
            return {
                insights,
                playerCohorts: this.getCohortAnalysis(),
                generatedAt: new Date().toISOString()
            };
        }
        catch (error) {
            this.logger.error('Failed to get dashboard data:', error);
            throw new ServiceError('DASHBOARD_DATA_FAILED', error.message);
        }
    }
    getDateFrom(timeRange) {
        const now = new Date();
        switch (timeRange) {
            case '1d':
                return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
            case '7d':
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
            case '30d':
                return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
            default:
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        }
    }
    getCohortAnalysis() {
        const cohorts = {};
        for (const [playerId, cohort] of this.playerCohorts.entries()) {
            cohorts[cohort] = (cohorts[cohort] || 0) + 1;
        }
        return cohorts;
    }
    /**
     * Initialize the service.
     *
     * Called by the server bootstrap; safe to invoke repeatedly because the
     * constructor already performs the first-time setup.
     */
    async initialize() {
        this.initializeAnalytics();
        return true;
    }
    /**
     * Track an error (used by the error-tracking middleware).
     */
    async trackError(userId, errorData = {}) {
        try {
            await this.trackEvent(userId, 'error_occurred', {
                error_type: errorData.type || 'UnknownError',
                error_message: errorData.message,
                error_code: errorData.code || 'UNKNOWN',
                level: errorData.level,
                stack_trace: errorData.stackTrace,
                request_id: errorData.request_id,
                url: errorData.url,
                method: errorData.method,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            this.logger.error('Failed to track error:', error);
        }
    }
    /**
     * Report service health for the /health endpoint.
     */
    getHealthStatus() {
        return {
            service: 'unified-analytics',
            status: this.isInitialized ? 'healthy' : 'not_initialized',
            provider: 'posthog',
            queuedEvents: this.eventQueue ? this.eventQueue.length : 0,
            trackedPlayers: this.playerCohorts ? this.playerCohorts.size : 0,
        };
    }
    /**
     * Shut the service down. Alias of `cleanup()` - the server's graceful
     * shutdown path calls `analyticsService.shutdown()`.
     */
    async shutdown() {
        return this.cleanup();
    }
    /**
     * Cleanup resources
     */
    async cleanup() {
        if (this.posthog) {
            await this.posthog.shutdown();
        }
        this.isInitialized = false;
        this.logger.info('Unified Analytics Service cleaned up');
    }
}
export default new UnifiedAnalyticsService();
//# sourceMappingURL=unified-analytics-service.js.map