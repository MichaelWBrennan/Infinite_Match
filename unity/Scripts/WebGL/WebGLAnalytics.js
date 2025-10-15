// WebGL Analytics Integration for Match 3 Game
// This file should be placed in the WebGL build and referenced in index.html

class WebGLAnalytics {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.isInitialized = false;
        this.eventQueue = [];
        this.config = {
            amplitudeApiKey: 'YOUR_AMPLITUDE_API_KEY',
            mixpanelToken: 'YOUR_MIXPANEL_TOKEN',
            datadogApplicationId: 'YOUR_DATADOG_APPLICATION_ID',
            datadogClientToken: 'YOUR_DATADOG_CLIENT_TOKEN',
            sentryDsn: 'YOUR_SENTRY_DSN'
        };
    }

    // Initialize all analytics services
    async initialize() {
        try {
            // Initialize Sentry for error tracking
            this.initializeSentry();
            
            // Initialize Amplitude
            this.initializeAmplitude();
            
            // Initialize Mixpanel
            this.initializeMixpanel();
            
            // Initialize Datadog RUM
            this.initializeDatadog();
            
            this.isInitialized = true;
            console.log('WebGL Analytics initialized successfully');
            
            // Process queued events
            this.processEventQueue();
            
        } catch (error) {
            console.error('Failed to initialize WebGL Analytics:', error);
        }
    }

    // Initialize Sentry for error tracking
    initializeSentry() {
        if (typeof Sentry !== 'undefined') {
            Sentry.init({
                dsn: this.config.sentryDsn,
                environment: 'webgl',
                tracesSampleRate: 1.0,
                integrations: [
                    new Sentry.Integrations.Breadcrumbs({ console: true }),
                    new Sentry.Integrations.GlobalHandlers({ onerror: true, onunhandledrejection: true })
                ]
            });
            console.log('Sentry initialized for WebGL');
        }
    }

    // Initialize Amplitude
    initializeAmplitude() {
        if (typeof amplitude !== 'undefined') {
            amplitude.init(this.config.amplitudeApiKey, null, {
                saveEvents: true,
                includeUtm: true,
                includeReferrer: true,
                includeGclid: true,
                includeFbclid: true,
                logLevel: 'debug'
            });
            console.log('Amplitude initialized for WebGL');
        }
    }

    // Initialize Mixpanel
    initializeMixpanel() {
        if (typeof mixpanel !== 'undefined') {
            mixpanel.init(this.config.mixpanelToken, {
                debug: true,
                track_pageview: false,
                persistence: 'localStorage'
            });
            console.log('Mixpanel initialized for WebGL');
        }
    }

    // Initialize Datadog RUM
    initializeDatadog() {
        if (typeof DD_RUM !== 'undefined') {
            DD_RUM.init({
                applicationId: this.config.datadogApplicationId,
                clientToken: this.config.datadogClientToken,
                site: 'datadoghq.com',
                service: 'match3-game-webgl',
                env: 'production',
                version: '1.0.0',
                sessionSampleRate: 100,
                sessionReplaySampleRate: 20,
                trackUserInteractions: true,
                trackResources: true,
                trackLongTasks: true,
                defaultPrivacyLevel: 'mask-user-input'
            });
            console.log('Datadog RUM initialized for WebGL');
        }
    }

    // Track game events
    trackEvent(eventName, properties = {}) {
        const eventData = {
            event_name: eventName,
            properties: {
                ...properties,
                session_id: this.sessionId,
                timestamp: new Date().toISOString(),
                platform: 'webgl',
                game_version: '1.0.0'
            }
        };

        if (!this.isInitialized) {
            this.eventQueue.push(eventData);
            return;
        }

        try {
            // Track with Amplitude
            if (typeof amplitude !== 'undefined') {
                amplitude.track(eventName, eventData.properties);
            }

            // Track with Mixpanel
            if (typeof mixpanel !== 'undefined') {
                mixpanel.track(eventName, eventData.properties);
            }

            // Track with Datadog RUM
            if (typeof DD_RUM !== 'undefined') {
                DD_RUM.addAction(eventName, eventData.properties);
            }

            // Track with Sentry (as breadcrumb)
            if (typeof Sentry !== 'undefined') {
                Sentry.addBreadcrumb({
                    message: eventName,
                    category: 'game_event',
                    data: eventData.properties,
                    level: 'info'
                });
            }

            console.log(`Event tracked: ${eventName}`, eventData.properties);

        } catch (error) {
            console.error('Failed to track event:', error);
        }
    }

    // Game-specific event tracking methods
    trackGameStart(level, difficulty) {
        this.trackEvent('game_started', {
            level: level,
            difficulty: difficulty,
            platform: 'webgl'
        });
    }

    trackLevelComplete(level, score, timeSpent, movesUsed) {
        this.trackEvent('level_completed', {
            level: level,
            score: score,
            time_spent: timeSpent,
            moves_used: movesUsed
        });
    }

    trackMatchMade(matchType, piecesMatched, position) {
        this.trackEvent('match_made', {
            match_type: matchType,
            pieces_matched: piecesMatched,
            position_x: position.x,
            position_y: position.y
        });
    }

    trackPowerUpUsed(powerUpType, level, position) {
        this.trackEvent('powerup_used', {
            powerup_type: powerUpType,
            level: level,
            position_x: position.x,
            position_y: position.y
        });
    }

    trackPurchase(itemId, currency, amount) {
        this.trackEvent('purchase_made', {
            item_id: itemId,
            currency: currency,
            amount: amount
        });
    }

    trackError(errorType, errorMessage, stackTrace) {
        this.trackEvent('error_occurred', {
            error_type: errorType,
            error_message: errorMessage,
            stack_trace: stackTrace
        });

        // Also send to Sentry
        if (typeof Sentry !== 'undefined') {
            Sentry.captureException(new Error(errorMessage), {
                tags: {
                    error_type: errorType
                },
                extra: {
                    stack_trace: stackTrace
                }
            });
        }
    }

    // Process queued events
    processEventQueue() {
        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            this.trackEvent(event.event_name, event.properties);
        }
    }

    // Generate session ID
    generateSessionId() {
        return 'webgl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Get analytics summary
    getAnalyticsSummary() {
        return {
            session_id: this.sessionId,
            is_initialized: this.isInitialized,
            events_queued: this.eventQueue.length,
            services: {
                sentry: typeof Sentry !== 'undefined',
                amplitude: typeof amplitude !== 'undefined',
                mixpanel: typeof mixpanel !== 'undefined',
                datadog: typeof DD_RUM !== 'undefined'
            }
        };
    }
}

// Create global instance
window.webglAnalytics = new WebGLAnalytics();

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.webglAnalytics.initialize();
});

// Export for Unity
window.WebGLAnalytics = WebGLAnalytics;