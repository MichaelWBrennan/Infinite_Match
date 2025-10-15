import { v4 as uuidv4 } from 'uuid';
import * as Sentry from '@sentry/node';
import { createClient } from 'redis';
import { MongoClient } from 'mongodb';
import { createClient as createPrometheusClient } from 'prom-client';

class AdvancedAnalyticsService {
    constructor() {
        this.redis = null;
        this.mongodb = null;
        this.prometheus = null;
        this.isInitialized = false;
        this.sessionCache = new Map();
        this.abTests = new Map();
        this.playerSegments = new Map();
        this.realTimeMetrics = new Map();
        this.alertThresholds = new Map();
        
        // Initialize alert thresholds
        this.initializeAlertThresholds();
    }

    async initialize() {
        try {
            console.log('🚀 Initializing Advanced Analytics Service...');
            
            // Initialize Redis for real-time data
            await this.initializeRedis();
            
            // Initialize MongoDB for historical data
            await this.initializeMongoDB();
            
            // Initialize Prometheus for metrics
            await this.initializePrometheus();
            
            // Initialize A/B testing system
            await this.initializeABTesting();
            
            // Initialize player segmentation
            await this.initializePlayerSegmentation();
            
            // Start real-time monitoring
            this.startRealTimeMonitoring();
            
            this.isInitialized = true;
            console.log('✅ Advanced Analytics Service initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Advanced Analytics Service:', error);
            Sentry.captureException(error);
            throw error;
        }
    }

    async initializeRedis() {
        try {
            this.redis = createClient({
                url: process.env.REDIS_URL || 'redis://localhost:6379'
            });
            
            await this.redis.connect();
            console.log('✅ Redis connected for real-time analytics');
        } catch (error) {
            console.error('❌ Redis connection failed:', error);
            // Continue without Redis
        }
    }

    async initializeMongoDB() {
        try {
            const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
            await client.connect();
            this.mongodb = client.db('match3_analytics');
            console.log('✅ MongoDB connected for historical analytics');
        } catch (error) {
            console.error('❌ MongoDB connection failed:', error);
            // Continue without MongoDB
        }
    }

    async initializePrometheus() {
        try {
            // Initialize Prometheus metrics
            this.prometheus = {
                gameEvents: new createPrometheusClient.Counter({
                    name: 'game_events_total',
                    help: 'Total number of game events',
                    labelNames: ['event_type', 'platform', 'version']
                }),
                playerSessions: new createPrometheusClient.Counter({
                    name: 'player_sessions_total',
                    help: 'Total number of player sessions',
                    labelNames: ['platform', 'version']
                }),
                revenue: new createPrometheusClient.Counter({
                    name: 'revenue_total',
                    help: 'Total revenue in USD',
                    labelNames: ['currency', 'platform']
                }),
                retention: new createPrometheusClient.Gauge({
                    name: 'player_retention_rate',
                    help: 'Player retention rate',
                    labelNames: ['day', 'platform']
                }),
                ltv: new createPrometheusClient.Gauge({
                    name: 'player_ltv',
                    help: 'Player lifetime value',
                    labelNames: ['segment', 'platform']
                })
            };
            console.log('✅ Prometheus metrics initialized');
        } catch (error) {
            console.error('❌ Prometheus initialization failed:', error);
        }
    }

    async initializeABTesting() {
        try {
            // Load active A/B tests from database
            if (this.mongodb) {
                const tests = await this.mongodb.collection('ab_tests').find({ status: 'active' }).toArray();
                tests.forEach(test => {
                    this.abTests.set(test.id, test);
                });
            }
            console.log(`✅ A/B Testing initialized with ${this.abTests.size} active tests`);
        } catch (error) {
            console.error('❌ A/B Testing initialization failed:', error);
        }
    }

    async initializePlayerSegmentation() {
        try {
            // Load player segments from database
            if (this.mongodb) {
                const segments = await this.mongodb.collection('player_segments').find({}).toArray();
                segments.forEach(segment => {
                    this.playerSegments.set(segment.id, segment);
                });
            }
            console.log(`✅ Player Segmentation initialized with ${this.playerSegments.size} segments`);
        } catch (error) {
            console.error('❌ Player Segmentation initialization failed:', error);
        }
    }

    initializeAlertThresholds() {
        this.alertThresholds.set('retention_rate', { min: 0.4, max: 0.8 });
        this.alertThresholds.set('arpu', { min: 0.5, max: 5.0 });
        this.alertThresholds.set('session_duration', { min: 300, max: 1800 });
        this.alertThresholds.set('error_rate', { min: 0, max: 0.05 });
        this.alertThresholds.set('conversion_rate', { min: 0.02, max: 0.1 });
    }

    startRealTimeMonitoring() {
        // Monitor real-time metrics every 30 seconds
        setInterval(() => {
            this.updateRealTimeMetrics();
        }, 30000);
        
        // Check alerts every 5 minutes
        setInterval(() => {
            this.checkAlerts();
        }, 300000);
    }

    async trackGameEvent(eventName, properties = {}, userId = null) {
        if (!this.isInitialized) return;

        try {
            const eventData = {
                id: uuidv4(),
                eventName,
                properties,
                userId: userId || 'anonymous',
                timestamp: new Date().toISOString(),
                platform: properties.platform || 'web',
                version: properties.version || '1.0.0',
                sessionId: properties.sessionId || this.generateSessionId()
            };

            // Store in Redis for real-time access
            if (this.redis) {
                await this.redis.lpush('recent_events', JSON.stringify(eventData));
                await this.redis.ltrim('recent_events', 0, 999); // Keep last 1000 events
            }

            // Store in MongoDB for historical analysis
            if (this.mongodb) {
                await this.mongodb.collection('game_events').insertOne(eventData);
            }

            // Update Prometheus metrics
            if (this.prometheus) {
                this.prometheus.gameEvents.inc({
                    event_type: eventName,
                    platform: eventData.platform,
                    version: eventData.version
                });
            }

            // Update real-time metrics
            this.updateEventMetrics(eventName, eventData);

            // Check for A/B test assignments
            await this.checkABTestAssignment(eventData);

            // Update player segmentation
            await this.updatePlayerSegmentation(eventData);

            console.log(`📊 Event tracked: ${eventName}`, eventData);

        } catch (error) {
            console.error('Failed to track game event:', error);
            Sentry.captureException(error);
        }
    }

    updateEventMetrics(eventName, eventData) {
        const key = `metrics:${eventName}`;
        const current = this.realTimeMetrics.get(key) || { count: 0, lastUpdate: Date.now() };
        
        current.count++;
        current.lastUpdate = Date.now();
        
        this.realTimeMetrics.set(key, current);
    }

    async checkABTestAssignment(eventData) {
        // Check if user should be assigned to an A/B test
        for (const [testId, test] of this.abTests) {
            if (test.status === 'active' && !eventData.properties.abTestAssignments) {
                const assignment = this.assignToABTest(test, eventData.userId);
                if (assignment) {
                    eventData.properties.abTestAssignments = { [testId]: assignment };
                    
                    // Track A/B test assignment
                    await this.trackGameEvent('ab_test_assigned', {
                        testId,
                        variant: assignment,
                        userId: eventData.userId
                    });
                }
            }
        }
    }

    assignToABTest(test, userId) {
        // Simple hash-based assignment
        const hash = this.hashString(userId + test.id);
        const variantIndex = hash % test.variants.length;
        return test.variants[variantIndex];
    }

    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    async updatePlayerSegmentation(eventData) {
        // Update player segmentation based on behavior
        const userId = eventData.userId;
        const segment = await this.calculatePlayerSegment(userId, eventData);
        
        if (segment) {
            this.playerSegments.set(userId, segment);
            
            // Store in database
            if (this.mongodb) {
                await this.mongodb.collection('player_segments').updateOne(
                    { userId },
                    { $set: { ...segment, userId, lastUpdated: new Date() } },
                    { upsert: true }
                );
            }
        }
    }

    async calculatePlayerSegment(userId, eventData) {
        // Calculate player segment based on behavior
        const behavior = await this.getPlayerBehavior(userId);
        
        if (!behavior) return null;

        let segment = 'casual';
        
        if (behavior.totalSpent > 100) segment = 'whale';
        else if (behavior.totalSpent > 20) segment = 'spender';
        else if (behavior.sessionsPerDay > 5) segment = 'engaged';
        else if (behavior.sessionsPerDay < 1) segment = 'at_risk';

        return {
            segment,
            confidence: this.calculateSegmentConfidence(behavior),
            lastUpdated: new Date()
        };
    }

    async getPlayerBehavior(userId) {
        if (this.mongodb) {
            const events = await this.mongodb.collection('game_events')
                .find({ userId })
                .sort({ timestamp: -1 })
                .limit(1000)
                .toArray();

            const totalSpent = events
                .filter(e => e.eventName === 'purchase_made')
                .reduce((sum, e) => sum + (e.properties.amount || 0), 0);

            const sessions = events
                .filter(e => e.eventName === 'game_started')
                .length;

            const days = this.getDaysSinceFirstEvent(events);
            const sessionsPerDay = days > 0 ? sessions / days : 0;

            return {
                totalSpent,
                sessions,
                sessionsPerDay,
                days
            };
        }
        
        return null;
    }

    getDaysSinceFirstEvent(events) {
        if (events.length === 0) return 0;
        const firstEvent = events[events.length - 1];
        const lastEvent = events[0];
        return (new Date(lastEvent.timestamp) - new Date(firstEvent.timestamp)) / (1000 * 60 * 60 * 24);
    }

    calculateSegmentConfidence(behavior) {
        // Calculate confidence in segment assignment
        let confidence = 0.5;
        
        if (behavior.totalSpent > 0) confidence += 0.2;
        if (behavior.sessionsPerDay > 2) confidence += 0.2;
        if (behavior.sessions > 10) confidence += 0.1;
        
        return Math.min(confidence, 1.0);
    }

    async updateRealTimeMetrics() {
        try {
            // Update real-time metrics
            const metrics = {
                activePlayers: await this.getActivePlayers(),
                revenue: await this.getRevenue(),
                retention: await this.getRetention(),
                conversion: await this.getConversion(),
                ltv: await this.getLTV()
            };

            // Store in Redis
            if (this.redis) {
                await this.redis.setex('realtime_metrics', 60, JSON.stringify(metrics));
            }

            // Update Prometheus metrics
            if (this.prometheus) {
                this.prometheus.retention.set({ day: '1', platform: 'web' }, metrics.retention.day1);
                this.prometheus.ltv.set({ segment: 'all', platform: 'web' }, metrics.ltv);
            }

        } catch (error) {
            console.error('Failed to update real-time metrics:', error);
        }
    }

    async getActivePlayers() {
        if (this.redis) {
            const sessions = await this.redis.keys('session:*');
            return sessions.length;
        }
        return 0;
    }

    async getRevenue() {
        if (this.mongodb) {
            const result = await this.mongodb.collection('game_events')
                .aggregate([
                    { $match: { eventName: 'purchase_made' } },
                    { $group: { _id: null, total: { $sum: '$properties.amount' } } }
                ])
                .toArray();
            
            return result.length > 0 ? result[0].total : 0;
        }
        return 0;
    }

    async getRetention() {
        // Calculate retention rates
        const day1 = await this.calculateRetention(1);
        const day7 = await this.calculateRetention(7);
        const day30 = await this.calculateRetention(30);
        
        return { day1, day7, day30 };
    }

    async calculateRetention(days) {
        if (this.mongodb) {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            
            const totalUsers = await this.mongodb.collection('game_events')
                .distinct('userId', { timestamp: { $gte: startDate.toISOString() } });
            
            const returningUsers = await this.mongodb.collection('game_events')
                .distinct('userId', { 
                    timestamp: { $gte: startDate.toISOString() },
                    eventName: 'game_started'
                });
            
            return totalUsers.length > 0 ? returningUsers.length / totalUsers.length : 0;
        }
        return 0;
    }

    async getConversion() {
        if (this.mongodb) {
            const totalUsers = await this.mongodb.collection('game_events')
                .distinct('userId');
            
            const payingUsers = await this.mongodb.collection('game_events')
                .distinct('userId', { eventName: 'purchase_made' });
            
            return totalUsers.length > 0 ? payingUsers.length / totalUsers.length : 0;
        }
        return 0;
    }

    async getLTV() {
        if (this.mongodb) {
            const result = await this.mongodb.collection('game_events')
                .aggregate([
                    { $match: { eventName: 'purchase_made' } },
                    { $group: { _id: '$userId', total: { $sum: '$properties.amount' } } },
                    { $group: { _id: null, avg: { $avg: '$total' } } }
                ])
                .toArray();
            
            return result.length > 0 ? result[0].avg : 0;
        }
        return 0;
    }

    async checkAlerts() {
        try {
            const metrics = await this.getRealTimeMetrics();
            
            for (const [metric, threshold] of this.alertThresholds) {
                const value = metrics[metric];
                if (value !== undefined) {
                    if (value < threshold.min || value > threshold.max) {
                        await this.sendAlert(metric, value, threshold);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to check alerts:', error);
        }
    }

    async sendAlert(metric, value, threshold) {
        console.warn(`🚨 ALERT: ${metric} = ${value} (threshold: ${threshold.min}-${threshold.max})`);
        
        // Send alert to monitoring system
        if (this.mongodb) {
            await this.mongodb.collection('alerts').insertOne({
                metric,
                value,
                threshold,
                timestamp: new Date(),
                status: 'active'
            });
        }
    }

    async getRealTimeMetrics() {
        if (this.redis) {
            const cached = await this.redis.get('realtime_metrics');
            if (cached) {
                return JSON.parse(cached);
            }
        }
        
        return await this.updateRealTimeMetrics();
    }

    async generateInsights(userId) {
        try {
            const behavior = await this.getPlayerBehavior(userId);
            const segment = this.playerSegments.get(userId);
            
            if (!behavior || !segment) return null;

            const insights = {
                userId,
                segment: segment.segment,
                confidence: segment.confidence,
                recommendations: this.generateRecommendations(behavior, segment),
                predictions: await this.generatePredictions(behavior, segment),
                metrics: behavior
            };

            return insights;
        } catch (error) {
            console.error('Failed to generate insights:', error);
            return null;
        }
    }

    generateRecommendations(behavior, segment) {
        const recommendations = [];
        
        if (behavior.totalSpent === 0) {
            recommendations.push('Offer first purchase bonus');
        }
        
        if (behavior.sessionsPerDay < 1) {
            recommendations.push('Send push notification');
        }
        
        if (segment.segment === 'at_risk') {
            recommendations.push('Offer retention discount');
        }
        
        if (behavior.totalSpent > 50 && behavior.sessionsPerDay > 3) {
            recommendations.push('Offer premium subscription');
        }
        
        return recommendations;
    }

    async generatePredictions(behavior, segment) {
        const predictions = {
            churnProbability: this.calculateChurnProbability(behavior),
            ltvPrediction: this.calculateLTVPrediction(behavior, segment),
            nextPurchaseProbability: this.calculateNextPurchaseProbability(behavior)
        };
        
        return predictions;
    }

    calculateChurnProbability(behavior) {
        let probability = 0.5;
        
        if (behavior.sessionsPerDay < 0.5) probability += 0.3;
        if (behavior.totalSpent === 0) probability += 0.2;
        if (behavior.days > 30) probability -= 0.1;
        
        return Math.max(0, Math.min(1, probability));
    }

    calculateLTVPrediction(behavior, segment) {
        const baseLTV = behavior.totalSpent;
        const segmentMultiplier = this.getSegmentMultiplier(segment.segment);
        const engagementMultiplier = Math.min(behavior.sessionsPerDay / 2, 2);
        
        return baseLTV * segmentMultiplier * engagementMultiplier;
    }

    getSegmentMultiplier(segment) {
        const multipliers = {
            'whale': 3.0,
            'spender': 2.0,
            'engaged': 1.5,
            'casual': 1.0,
            'at_risk': 0.5
        };
        
        return multipliers[segment] || 1.0;
    }

    calculateNextPurchaseProbability(behavior) {
        let probability = 0.1;
        
        if (behavior.totalSpent > 0) probability += 0.3;
        if (behavior.sessionsPerDay > 2) probability += 0.2;
        if (behavior.sessions > 20) probability += 0.1;
        
        return Math.max(0, Math.min(1, probability));
    }

    generateSessionId() {
        return uuidv4();
    }

    async getDashboardData() {
        try {
            const metrics = await this.getRealTimeMetrics();
            const insights = await this.getInsights();
            const alerts = await this.getActiveAlerts();
            
            return {
                metrics,
                insights,
                alerts,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Failed to get dashboard data:', error);
            return null;
        }
    }

    async getInsights() {
        // Generate insights for different segments
        const insights = {};
        
        for (const [segmentId, segment] of this.playerSegments) {
            insights[segmentId] = await this.generateInsights(segmentId);
        }
        
        return insights;
    }

    async getActiveAlerts() {
        if (this.mongodb) {
            return await this.mongodb.collection('alerts')
                .find({ status: 'active' })
                .sort({ timestamp: -1 })
                .limit(10)
                .toArray();
        }
        return [];
    }

    async createABTest(testData) {
        try {
            const test = {
                id: uuidv4(),
                name: testData.name,
                description: testData.description,
                variants: testData.variants,
                status: 'active',
                startDate: new Date(),
                endDate: new Date(Date.now() + (testData.duration || 7) * 24 * 60 * 60 * 1000),
                metrics: testData.metrics || [],
                createdAt: new Date()
            };
            
            this.abTests.set(test.id, test);
            
            if (this.mongodb) {
                await this.mongodb.collection('ab_tests').insertOne(test);
            }
            
            return test;
        } catch (error) {
            console.error('Failed to create A/B test:', error);
            throw error;
        }
    }

    async getABTestResults(testId) {
        const test = this.abTests.get(testId);
        if (!test) return null;
        
        // Calculate results for each variant
        const results = {};
        
        for (const variant of test.variants) {
            results[variant.id] = await this.calculateVariantResults(testId, variant.id);
        }
        
        return {
            test,
            results,
            winner: this.determineWinner(results),
            confidence: this.calculateTestConfidence(results)
        };
    }

    async calculateVariantResults(testId, variantId) {
        if (this.mongodb) {
            const events = await this.mongodb.collection('game_events')
                .find({
                    'properties.abTestAssignments': { [testId]: variantId }
                })
                .toArray();
            
            const conversionRate = events.filter(e => e.eventName === 'purchase_made').length / events.length;
            const avgSessionDuration = this.calculateAvgSessionDuration(events);
            const revenue = events
                .filter(e => e.eventName === 'purchase_made')
                .reduce((sum, e) => sum + (e.properties.amount || 0), 0);
            
            return {
                conversionRate,
                avgSessionDuration,
                revenue,
                sampleSize: events.length
            };
        }
        
        return { conversionRate: 0, avgSessionDuration: 0, revenue: 0, sampleSize: 0 };
    }

    calculateAvgSessionDuration(events) {
        const sessions = new Map();
        
        events.forEach(event => {
            if (event.eventName === 'game_started') {
                sessions.set(event.sessionId, { start: new Date(event.timestamp) });
            } else if (event.eventName === 'game_ended' && sessions.has(event.sessionId)) {
                const session = sessions.get(event.sessionId);
                session.duration = new Date(event.timestamp) - session.start;
            }
        });
        
        const durations = Array.from(sessions.values())
            .filter(s => s.duration)
            .map(s => s.duration);
        
        return durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    }

    determineWinner(results) {
        let bestVariant = null;
        let bestScore = 0;
        
        for (const [variantId, result] of Object.entries(results)) {
            const score = result.conversionRate * 0.4 + (result.revenue / result.sampleSize) * 0.6;
            if (score > bestScore) {
                bestScore = score;
                bestVariant = variantId;
            }
        }
        
        return bestVariant;
    }

    calculateTestConfidence(results) {
        // Simple confidence calculation based on sample sizes
        const totalSampleSize = Object.values(results).reduce((sum, result) => sum + result.sampleSize, 0);
        return Math.min(totalSampleSize / 1000, 1.0); // Max confidence at 1000 samples
    }
}

export default new AdvancedAnalyticsService();