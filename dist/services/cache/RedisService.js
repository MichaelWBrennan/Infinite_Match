import Redis from 'ioredis';
import { Logger } from '../../core/logger/index.js';
const logger = new Logger('RedisService');
export class RedisService {
    client;
    subscriber;
    publisher;
    constructor() {
        const redisConfig = {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB || '0'),
            retryDelayOnFailover: 100,
            enableReadyCheck: false,
            maxRetriesPerRequest: null,
            lazyConnect: true,
        };
        this.client = new Redis(redisConfig);
        this.subscriber = new Redis(redisConfig);
        this.publisher = new Redis(redisConfig);
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.client.on('connect', () => {
            logger.info('Redis client connected');
        });
        this.client.on('error', (error) => {
            logger.error('Redis client error', error);
        });
        this.subscriber.on('connect', () => {
            logger.info('Redis subscriber connected');
        });
        this.subscriber.on('error', (error) => {
            logger.error('Redis subscriber error', error);
        });
        this.publisher.on('connect', () => {
            logger.info('Redis publisher connected');
        });
        this.publisher.on('error', (error) => {
            logger.error('Redis publisher error', error);
        });
    }
    // Basic cache operations
    async get(key) {
        try {
            return await this.client.get(key);
        }
        catch (error) {
            logger.error('Redis get error', { key, error });
            return null;
        }
    }
    async set(key, value, ttl) {
        try {
            if (ttl) {
                await this.client.setex(key, ttl, value);
            }
            else {
                await this.client.set(key, value);
            }
            return true;
        }
        catch (error) {
            logger.error('Redis set error', { key, error });
            return false;
        }
    }
    async del(key) {
        try {
            await this.client.del(key);
            return true;
        }
        catch (error) {
            logger.error('Redis del error', { key, error });
            return false;
        }
    }
    async exists(key) {
        try {
            const result = await this.client.exists(key);
            return result === 1;
        }
        catch (error) {
            logger.error('Redis exists error', { key, error });
            return false;
        }
    }
    // JSON operations
    async getJSON(key) {
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        }
        catch (error) {
            logger.error('Redis getJSON error', { key, error });
            return null;
        }
    }
    async setJSON(key, value, ttl) {
        try {
            const jsonValue = JSON.stringify(value);
            return await this.set(key, jsonValue, ttl);
        }
        catch (error) {
            logger.error('Redis setJSON error', { key, error });
            return false;
        }
    }
    // Hash operations
    async hget(key, field) {
        try {
            return await this.client.hget(key, field);
        }
        catch (error) {
            logger.error('Redis hget error', { key, field, error });
            return null;
        }
    }
    async hset(key, field, value) {
        try {
            await this.client.hset(key, field, value);
            return true;
        }
        catch (error) {
            logger.error('Redis hset error', { key, field, error });
            return false;
        }
    }
    async hgetall(key) {
        try {
            return await this.client.hgetall(key);
        }
        catch (error) {
            logger.error('Redis hgetall error', { key, error });
            return null;
        }
    }
    // List operations
    async lpush(key, ...values) {
        try {
            return await this.client.lpush(key, ...values);
        }
        catch (error) {
            logger.error('Redis lpush error', { key, error });
            return 0;
        }
    }
    async rpop(key) {
        try {
            return await this.client.rpop(key);
        }
        catch (error) {
            logger.error('Redis rpop error', { key, error });
            return null;
        }
    }
    async llen(key) {
        try {
            return await this.client.llen(key);
        }
        catch (error) {
            logger.error('Redis llen error', { key, error });
            return 0;
        }
    }
    // Set operations
    async sadd(key, ...members) {
        try {
            return await this.client.sadd(key, ...members);
        }
        catch (error) {
            logger.error('Redis sadd error', { key, error });
            return 0;
        }
    }
    async smembers(key) {
        try {
            return await this.client.smembers(key);
        }
        catch (error) {
            logger.error('Redis smembers error', { key, error });
            return [];
        }
    }
    async sismember(key, member) {
        try {
            const result = await this.client.sismember(key, member);
            return result === 1;
        }
        catch (error) {
            logger.error('Redis sismember error', { key, member, error });
            return false;
        }
    }
    // Sorted set operations
    async zadd(key, score, member) {
        try {
            return await this.client.zadd(key, score, member);
        }
        catch (error) {
            logger.error('Redis zadd error', { key, score, member, error });
            return 0;
        }
    }
    async zrange(key, start, stop) {
        try {
            return await this.client.zrange(key, start, stop);
        }
        catch (error) {
            logger.error('Redis zrange error', { key, start, stop, error });
            return [];
        }
    }
    async zrevrange(key, start, stop) {
        try {
            return await this.client.zrevrange(key, start, stop);
        }
        catch (error) {
            logger.error('Redis zrevrange error', { key, start, stop, error });
            return [];
        }
    }
    // Pub/Sub operations
    async publish(channel, message) {
        try {
            return await this.publisher.publish(channel, message);
        }
        catch (error) {
            logger.error('Redis publish error', { channel, error });
            return 0;
        }
    }
    async subscribe(channel, callback) {
        try {
            await this.subscriber.subscribe(channel);
            this.subscriber.on('message', (receivedChannel, message) => {
                if (receivedChannel === channel) {
                    callback(message);
                }
            });
        }
        catch (error) {
            logger.error('Redis subscribe error', { channel, error });
        }
    }
    async unsubscribe(channel) {
        try {
            await this.subscriber.unsubscribe(channel);
        }
        catch (error) {
            logger.error('Redis unsubscribe error', { channel, error });
        }
    }
    // Game-specific cache operations
    async cachePlayer(playerId, playerData, ttl = 3600) {
        const key = `player:${playerId}`;
        return await this.setJSON(key, playerData, ttl);
    }
    async getCachedPlayer(playerId) {
        const key = `player:${playerId}`;
        return await this.getJSON(key);
    }
    async cacheGameSession(sessionId, sessionData, ttl = 1800) {
        const key = `session:${sessionId}`;
        return await this.setJSON(key, sessionData, ttl);
    }
    async getCachedGameSession(sessionId) {
        const key = `session:${sessionId}`;
        return await this.getJSON(key);
    }
    async cacheLeaderboard(leaderboardType, data, ttl = 300) {
        const key = `leaderboard:${leaderboardType}`;
        return await this.setJSON(key, data, ttl);
    }
    async getCachedLeaderboard(leaderboardType) {
        const key = `leaderboard:${leaderboardType}`;
        return await this.getJSON(key);
    }
    // Rate limiting
    async checkRateLimit(key, limit, window) {
        try {
            const current = await this.client.incr(key);
            if (current === 1) {
                await this.client.expire(key, window);
            }
            const ttl = await this.client.ttl(key);
            const remaining = Math.max(0, limit - current);
            const resetTime = Date.now() + (ttl * 1000);
            return {
                allowed: current <= limit,
                remaining,
                resetTime
            };
        }
        catch (error) {
            logger.error('Redis rate limit error', { key, error });
            return { allowed: true, remaining: limit, resetTime: Date.now() + window * 1000 };
        }
    }
    // Health check
    async healthCheck() {
        const start = Date.now();
        try {
            await this.client.ping();
            const latency = Date.now() - start;
            return { status: 'healthy', latency };
        }
        catch (error) {
            logger.error('Redis health check failed', error);
            return { status: 'unhealthy', latency: -1 };
        }
    }
    // Cleanup
    async disconnect() {
        try {
            await this.client.quit();
            await this.subscriber.quit();
            await this.publisher.quit();
            logger.info('Redis connections closed');
        }
        catch (error) {
            logger.error('Redis disconnect error', error);
        }
    }
}
export const redisService = new RedisService();
export default redisService;
//# sourceMappingURL=RedisService.js.map