import mongoose from 'mongoose';
import { Logger } from '../../core/logger/index.js';
const logger = new Logger('MongoService');
export class MongoService {
    connection = null;
    constructor() {
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        mongoose.connection.on('connected', () => {
            logger.info('MongoDB connected successfully');
        });
        mongoose.connection.on('error', (error) => {
            logger.error('MongoDB connection error', error);
        });
        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected');
        });
        process.on('SIGINT', async () => {
            await this.disconnect();
            process.exit(0);
        });
    }
    /**
     * Resolve a collection, failing fast when the service has no live connection.
     * Centralizes the "MongoDB not connected" guard that every method repeated.
     */
    requireCollection(name) {
        const db = this.connection?.db;
        if (!db) {
            throw new Error('MongoDB not connected');
        }
        return db.collection(name);
    }
    async connect() {
        try {
            const mongoUri = process.env['MONGODB_URI'] || 'mongodb://localhost:27017/evergreen-match3';
            await mongoose.connect(mongoUri, {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                bufferCommands: false,
            });
            this.connection = mongoose.connection;
            logger.info('MongoDB connected successfully');
            return true;
        }
        catch (error) {
            logger.error('MongoDB connection failed', error);
            return false;
        }
    }
    async disconnect() {
        try {
            if (this.connection) {
                await mongoose.disconnect();
                this.connection = null;
                logger.info('MongoDB disconnected');
            }
        }
        catch (error) {
            logger.error('MongoDB disconnect error', error);
        }
    }
    // Game Analytics Collection
    async saveGameAnalytics(analytics) {
        try {
            const collection = this.requireCollection('game_analytics');
            await collection.insertOne({
                ...analytics,
                timestamp: new Date(),
                createdAt: new Date(),
            });
            logger.info('Game analytics saved', { playerId: analytics.playerId });
            return true;
        }
        catch (error) {
            logger.error('Failed to save game analytics', error);
            return false;
        }
    }
    async getGameAnalytics(playerId, startDate, endDate) {
        try {
            const collection = this.requireCollection('game_analytics');
            const query = { playerId };
            if (startDate || endDate) {
                query.timestamp = {};
                if (startDate)
                    query.timestamp.$gte = startDate;
                if (endDate)
                    query.timestamp.$lte = endDate;
            }
            const analytics = await collection.find(query).sort({ timestamp: -1 }).toArray();
            return analytics;
        }
        catch (error) {
            logger.error('Failed to get game analytics', error);
            return [];
        }
    }
    // Player Behavior Collection
    async savePlayerBehavior(behavior) {
        try {
            const collection = this.requireCollection('player_behavior');
            await collection.updateOne({ playerId: behavior.playerId }, { $set: { ...behavior, updatedAt: new Date() } }, { upsert: true });
            logger.info('Player behavior saved', { playerId: behavior.playerId });
            return true;
        }
        catch (error) {
            logger.error('Failed to save player behavior', error);
            return false;
        }
    }
    async getPlayerBehavior(playerId) {
        try {
            const collection = this.requireCollection('player_behavior');
            const behavior = await collection.findOne({ playerId });
            return behavior;
        }
        catch (error) {
            logger.error('Failed to get player behavior', error);
            return null;
        }
    }
    // Game Events Collection
    async saveGameEvent(event) {
        try {
            const collection = this.requireCollection('game_events');
            await collection.insertOne({
                ...event,
                timestamp: new Date(),
                createdAt: new Date(),
            });
            logger.info('Game event saved', { eventType: event.type, playerId: event.playerId });
            return true;
        }
        catch (error) {
            logger.error('Failed to save game event', error);
            return false;
        }
    }
    async getGameEvents(playerId, eventType, limit = 100) {
        try {
            const collection = this.requireCollection('game_events');
            const query = { playerId };
            if (eventType)
                query.type = eventType;
            const events = await collection.find(query).sort({ timestamp: -1 }).limit(limit).toArray();
            return events;
        }
        catch (error) {
            logger.error('Failed to get game events', error);
            return [];
        }
    }
    // A/B Testing Collection
    async saveABTestResult(result) {
        try {
            const collection = this.requireCollection('ab_test_results');
            await collection.insertOne({
                ...result,
                timestamp: new Date(),
                createdAt: new Date(),
            });
            logger.info('A/B test result saved', { testId: result.testId, playerId: result.playerId });
            return true;
        }
        catch (error) {
            logger.error('Failed to save A/B test result', error);
            return false;
        }
    }
    async getABTestResults(testId) {
        try {
            const collection = this.requireCollection('ab_test_results');
            const results = await collection.find({ testId }).sort({ timestamp: -1 }).toArray();
            return results;
        }
        catch (error) {
            logger.error('Failed to get A/B test results', error);
            return [];
        }
    }
    // Unity Cloud Logs Collection
    async saveUnityCloudLog(log) {
        try {
            const collection = this.requireCollection('unity_cloud_logs');
            await collection.insertOne({
                ...log,
                timestamp: new Date(),
                createdAt: new Date(),
            });
            logger.info('Unity Cloud log saved', { service: log.service, level: log.level });
            return true;
        }
        catch (error) {
            logger.error('Failed to save Unity Cloud log', error);
            return false;
        }
    }
    async getUnityCloudLogs(service, level, limit = 100) {
        try {
            const collection = this.requireCollection('unity_cloud_logs');
            const query = {};
            if (service)
                query.service = service;
            if (level)
                query.level = level;
            const logs = await collection.find(query).sort({ timestamp: -1 }).limit(limit).toArray();
            return logs;
        }
        catch (error) {
            logger.error('Failed to get Unity Cloud logs', error);
            return [];
        }
    }
    // Performance Metrics Collection
    async savePerformanceMetrics(metrics) {
        try {
            const collection = this.requireCollection('performance_metrics');
            await collection.insertOne({
                ...metrics,
                timestamp: new Date(),
                createdAt: new Date(),
            });
            logger.info('Performance metrics saved', { service: metrics.service });
            return true;
        }
        catch (error) {
            logger.error('Failed to save performance metrics', error);
            return false;
        }
    }
    async getPerformanceMetrics(service, startDate, endDate) {
        try {
            const collection = this.requireCollection('performance_metrics');
            const query = {};
            if (service)
                query.service = service;
            if (startDate || endDate) {
                query.timestamp = {};
                if (startDate)
                    query.timestamp.$gte = startDate;
                if (endDate)
                    query.timestamp.$lte = endDate;
            }
            const metrics = await collection.find(query).sort({ timestamp: -1 }).toArray();
            return metrics;
        }
        catch (error) {
            logger.error('Failed to get performance metrics', error);
            return [];
        }
    }
    // Health check
    async healthCheck() {
        const start = Date.now();
        try {
            const db = this.connection?.db;
            if (!db) {
                throw new Error('MongoDB not connected');
            }
            await db.admin().ping();
            const latency = Date.now() - start;
            return { status: 'healthy', latency };
        }
        catch (error) {
            logger.error('MongoDB health check failed', error);
            return { status: 'unhealthy', latency: -1 };
        }
    }
    // Get connection status
    isConnected() {
        return this.connection?.readyState === 1;
    }
    // Get database stats
    async getDatabaseStats() {
        try {
            const db = this.connection?.db;
            if (!db) {
                throw new Error('MongoDB not connected');
            }
            const stats = await db.stats();
            return stats;
        }
        catch (error) {
            logger.error('Failed to get database stats', error);
            return null;
        }
    }
}
export const mongoService = new MongoService();
export default mongoService;
//# sourceMappingURL=MongoService.js.map