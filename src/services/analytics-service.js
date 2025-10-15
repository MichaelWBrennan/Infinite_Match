import * as Sentry from '@sentry/node';
import { init as initOpenTelemetry } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { Amplitude } from '@amplitude/analytics-node';
import { DatadogRum } from '@datadog/browser-rum';
import newrelic from 'newrelic';
import { v4 as uuidv4 } from 'uuid';

/**
 * Comprehensive Analytics Service for Match 3 Game
 * Integrates Sentry, OpenTelemetry, Amplitude, Datadog, and New Relic
 */
class AnalyticsService {
    constructor() {
        this.amplitude = null;
        this.datadogRum = null;
        this.isInitialized = false;
        this.sessionId = uuidv4();
        this.gameEvents = new Map();
    }

    /**
     * Initialize all analytics services
     */
    async initialize() {
        try {
            // Initialize Sentry for error tracking
            await this.initializeSentry();
            
            // Initialize OpenTelemetry for observability
            await this.initializeOpenTelemetry();
            
            // Initialize Amplitude for game analytics
            await this.initializeAmplitude();
            
            // Initialize Datadog RUM
            await this.initializeDatadog();
            
            // Initialize New Relic (already initialized via require)
            this.initializeNewRelic();
            
            this.isInitialized = true;
            console.log('Analytics Service initialized successfully');
            
            // Track service initialization
            this.trackEvent('analytics_service_initialized', {
                session_id: this.sessionId,
                timestamp: new Date().toISOString(),
                services: ['sentry', 'opentelemetry', 'amplitude', 'datadog', 'newrelic']
            });
            
        } catch (error) {
            console.error('Failed to initialize Analytics Service:', error);
            throw error;
        }
    }

    /**
     * Initialize Sentry for error tracking and performance monitoring
     */
    async initializeSentry() {
        Sentry.init({
            dsn: process.env.SENTRY_DSN,
            environment: process.env.NODE_ENV || 'development',
            tracesSampleRate: 1.0,
            profilesSampleRate: 1.0,
            integrations: [
                new Sentry.Integrations.Http({ tracing: true }),
                new Sentry.Integrations.Express({ app: require('express') }),
                new Sentry.Integrations.Mongo({ useMongoose: true }),
                new Sentry.Integrations.Redis({ useRedis: true })
            ],
            beforeSend(event) {
                // Filter out non-critical errors in production
                if (process.env.NODE_ENV === 'production' && event.level === 'info') {
                    return null;
                }
                return event;
            }
        });
    }

    /**
     * Initialize OpenTelemetry for distributed tracing and metrics
     */
    async initializeOpenTelemetry() {
        const traceExporter = new OTLPTraceExporter({
            url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://localhost:4318/v1/traces'
        });

        const metricExporter = new OTLPMetricExporter({
            url: process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT || 'http://localhost:4318/v1/metrics'
        });

        const sdk = initOpenTelemetry({
            resource: new Resource({
                [SemanticResourceAttributes.SERVICE_NAME]: 'match3-game-backend',
                [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
                [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development'
            }),
            traceExporter,
            metricExporter,
            instrumentations: [getNodeAutoInstrumentations()]
        });

        await sdk.start();
    }

    /**
     * Initialize Amplitude for game analytics
     */
    async initializeAmplitude() {
        this.amplitude = Amplitude.getInstance();
        await this.amplitude.init(process.env.AMPLITUDE_API_KEY, {
            serverUrl: process.env.AMPLITUDE_SERVER_URL || 'https://api2.amplitude.com',
            flushQueueSize: 10,
            flushIntervalMillis: 10000,
            logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error'
        });
    }

    /**
     * Initialize Datadog RUM for real user monitoring
     */
    async initializeDatadog() {
        if (typeof window !== 'undefined') {
            this.datadogRum = DatadogRum.init({
                applicationId: process.env.DATADOG_APPLICATION_ID,
                clientToken: process.env.DATADOG_CLIENT_TOKEN,
                site: process.env.DATADOG_SITE || 'datadoghq.com',
                service: 'match3-game',
                env: process.env.NODE_ENV || 'development',
                version: '1.0.0',
                sessionSampleRate: 100,
                sessionReplaySampleRate: 20,
                trackUserInteractions: true,
                trackResources: true,
                trackLongTasks: true,
                defaultPrivacyLevel: 'mask-user-input'
            });
        }
    }

    /**
     * Initialize New Relic (already configured via require)
     */
    initializeNewRelic() {
        // New Relic is automatically initialized when the module is required
        console.log('New Relic initialized');
    }

    /**
     * Track game events with comprehensive analytics
     */
    async trackGameEvent(eventName, properties = {}, userId = null) {
        if (!this.isInitialized) {
            console.warn('Analytics Service not initialized');
            return;
        }

        const eventData = {
            event_name: eventName,
            properties: {
                ...properties,
                session_id: this.sessionId,
                timestamp: new Date().toISOString(),
                platform: 'web',
                game_version: process.env.GAME_VERSION || '1.0.0'
            },
            user_id: userId,
            session_id: this.sessionId
        };

        try {
            // Store event for batch processing
            this.gameEvents.set(uuidv4(), eventData);

            // Track with Amplitude
            if (this.amplitude) {
                await this.amplitude.track(eventName, eventData.properties, {
                    user_id: userId,
                    session_id: this.sessionId
                });
            }

            // Track with New Relic
            if (newrelic) {
                newrelic.recordCustomEvent('GameEvent', {
                    eventName,
                    ...eventData.properties
                });
            }

            // Track with Datadog RUM
            if (this.datadogRum) {
                this.datadogRum.addAction(eventName, eventData.properties);
            }

            // Track with Sentry (for performance monitoring)
            Sentry.addBreadcrumb({
                message: eventName,
                category: 'game_event',
                data: eventData.properties,
                level: 'info'
            });

            console.log(`Game event tracked: ${eventName}`, eventData.properties);

        } catch (error) {
            console.error('Failed to track game event:', error);
            Sentry.captureException(error);
        }
    }

    /**
     * Track specific game events
     */
    async trackGameStart(userId, gameData) {
        await this.trackGameEvent('game_started', {
            level: gameData.level,
            difficulty: gameData.difficulty,
            platform: gameData.platform,
            user_agent: gameData.userAgent
        }, userId);
    }

    async trackLevelComplete(userId, levelData) {
        await this.trackGameEvent('level_completed', {
            level: levelData.level,
            score: levelData.score,
            time_spent: levelData.timeSpent,
            moves_used: levelData.movesUsed,
            stars_earned: levelData.starsEarned,
            powerups_used: levelData.powerupsUsed
        }, userId);
    }

    async trackMatchMade(userId, matchData) {
        await this.trackGameEvent('match_made', {
            match_type: matchData.matchType,
            pieces_matched: matchData.piecesMatched,
            position_x: matchData.position.x,
            position_y: matchData.position.y,
            level: matchData.level,
            score_gained: matchData.scoreGained
        }, userId);
    }

    async trackPowerUpUsed(userId, powerUpData) {
        await this.trackGameEvent('powerup_used', {
            powerup_type: powerUpData.type,
            level: powerUpData.level,
            position_x: powerUpData.position.x,
            position_y: powerUpData.position.y,
            cost: powerUpData.cost
        }, userId);
    }

    async trackPurchase(userId, purchaseData) {
        await this.trackGameEvent('purchase_made', {
            item_id: purchaseData.itemId,
            item_type: purchaseData.itemType,
            currency: purchaseData.currency,
            amount: purchaseData.amount,
            transaction_id: purchaseData.transactionId,
            platform: purchaseData.platform
        }, userId);
    }

    async trackError(userId, errorData) {
        await this.trackGameEvent('error_occurred', {
            error_type: errorData.type,
            error_message: errorData.message,
            error_code: errorData.code,
            level: errorData.level,
            stack_trace: errorData.stackTrace
        }, userId);

        // Also send to Sentry
        Sentry.captureException(new Error(errorData.message), {
            tags: {
                error_type: errorData.type,
                level: errorData.level,
                user_id: userId
            },
            extra: errorData
        });
    }

    /**
     * Track performance metrics
     */
    async trackPerformance(userId, performanceData) {
        await this.trackGameEvent('performance_metric', {
            metric_name: performanceData.metricName,
            value: performanceData.value,
            unit: performanceData.unit,
            level: performanceData.level,
            device_info: performanceData.deviceInfo
        }, userId);

        // Track with New Relic
        if (newrelic) {
            newrelic.recordMetric(performanceData.metricName, performanceData.value);
        }
    }

    /**
     * Get analytics summary
     */
    getAnalyticsSummary() {
        return {
            session_id: this.sessionId,
            is_initialized: this.isInitialized,
            events_tracked: this.gameEvents.size,
            services: {
                sentry: !!process.env.SENTRY_DSN,
                amplitude: !!this.amplitude,
                datadog: !!this.datadogRum,
                newrelic: !!newrelic,
                opentelemetry: true
            }
        };
    }

    /**
     * Flush all pending events
     */
    async flush() {
        if (this.amplitude) {
            await this.amplitude.flush();
        }
        
        if (this.datadogRum) {
            this.datadogRum.flush();
        }
    }

    /**
     * Shutdown analytics service
     */
    async shutdown() {
        try {
            await this.flush();
            this.isInitialized = false;
            console.log('Analytics Service shutdown complete');
        } catch (error) {
            console.error('Error during analytics shutdown:', error);
        }
    }
}

// Export singleton instance
export default new AnalyticsService();