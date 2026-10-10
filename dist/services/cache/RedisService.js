import { createRedisClient } from '../redis-client.js';
import { Logger } from '../../core/logger/index.js';
const logger = new Logger('RedisService');
export class RedisService {
    client;
    subscriber;
    publisher;
    constructor() {
        const redisConfig = {
            db: parseInt(process.env['REDIS_DB'] || '0', 10),
            enableReadyCheck: false,
        };
        this.client = createRedisClient(redisConfig);
        this.subscriber = createRedisClient(redisConfig);
        this.publisher = createRedisClient(redisConfig);
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.client.on('connect', () => {
            logger.info('Redis client connected');
        });
        this.client.on('error', (error) => {
            logger.debug('Redis client error', error);
        });
        this.subscriber.on('connect', () => {
            logger.info('Redis subscriber connected');
        });
        this.subscriber.on('error', (error) => {
            logger.debug('Redis subscriber error', error);
        });
        this.publisher.on('connect', () => {
            logger.info('Redis publisher connected');
        });
        this.publisher.on('error', (error) => {
            logger.debug('Redis publisher error', error);
        });
    }
    // Basic cache operations
    async get(key) {
        try {
            return await this.client.get(key);
        }
        catch (error) {
            logger.debug('Redis get error', { key, error });
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
            logger.debug('Redis set error', { key, error });
            return false;
        }
    }
    async del(key) {
        try {
            await this.client.del(key);
            return true;
        }
        catch (error) {
            logger.debug('Redis del error', { key, error });
            return false;
        }
    }
    async exists(key) {
        try {
            const result = await this.client.exists(key);
            return result === 1;
        }
        catch (error) {
            logger.debug('Redis exists error', { key, error });
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
            logger.debug('Redis getJSON error', { key, error });
            return null;
        }
    }
    async setJSON(key, value, ttl) {
        try {
            const jsonValue = JSON.stringify(value);
            return await this.set(key, jsonValue, ttl);
        }
        catch (error) {
            logger.debug('Redis setJSON error', { key, error });
            return false;
        }
    }
    // Hash operations
    async hget(key, field) {
        try {
            return await this.client.hget(key, field);
        }
        catch (error) {
            logger.debug('Redis hget error', { key, field, error });
            return null;
        }
    }
    async hset(key, field, value) {
        try {
            await this.client.hset(key, field, value);
            return true;
        }
        catch (error) {
            logger.debug('Redis hset error', { key, field, error });
            return false;
        }
    }
    async hgetall(key) {
        try {
            return await this.client.hgetall(key);
        }
        catch (error) {
            logger.debug('Redis hgetall error', { key, error });
            return null;
        }
    }
    // List operations
    async lpush(key, ...values) {
        try {
            return await this.client.lpush(key, ...values);
        }
        catch (error) {
            logger.debug('Redis lpush error', { key, error });
            return 0;
        }
    }
    async rpop(key) {
        try {
            return await this.client.rpop(key);
        }
        catch (error) {
            logger.debug('Redis rpop error', { key, error });
            return null;
        }
    }
    async llen(key) {
        try {
            return await this.client.llen(key);
        }
        catch (error) {
            logger.debug('Redis llen error', { key, error });
            return 0;
        }
    }
    // Set operations
    async sadd(key, ...members) {
        try {
            return await this.client.sadd(key, ...members);
        }
        catch (error) {
            logger.debug('Redis sadd error', { key, error });
            return 0;
        }
    }
    async smembers(key) {
        try {
            return await this.client.smembers(key);
        }
        catch (error) {
            logger.debug('Redis smembers error', { key, error });
            return [];
        }
    }
    async sismember(key, member) {
        try {
            const result = await this.client.sismember(key, member);
            return result === 1;
        }
        catch (error) {
            logger.debug('Redis sismember error', { key, member, error });
            return false;
        }
    }
    // Sorted set operations
    async zadd(key, score, member) {
        try {
            return await this.client.zadd(key, score, member);
        }
        catch (error) {
            logger.debug('Redis zadd error', { key, score, member, error });
            return 0;
        }
    }
    async zrange(key, start, stop) {
        try {
            return await this.client.zrange(key, start, stop);
        }
        catch (error) {
            logger.debug('Redis zrange error', { key, start, stop, error });
            return [];
        }
    }
    async zrevrange(key, start, stop) {
        try {
            return await this.client.zrevrange(key, start, stop);
        }
        catch (error) {
            logger.debug('Redis zrevrange error', { key, start, stop, error });
            return [];
        }
    }
    // Pub/Sub operations
    async publish(channel, message) {
        try {
            return await this.publisher.publish(channel, message);
        }
        catch (error) {
            logger.debug('Redis publish error', { channel, error });
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
            logger.debug('Redis subscribe error', { channel, error });
        }
    }
    async unsubscribe(channel) {
        try {
            await this.subscriber.unsubscribe(channel);
        }
        catch (error) {
            logger.debug('Redis unsubscribe error', { channel, error });
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
            const resetTime = Date.now() + ttl * 1000;
            return {
                allowed: current <= limit,
                remaining,
                resetTime,
            };
        }
        catch (error) {
            logger.debug('Redis rate limit error', { key, error });
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
            logger.debug('Redis health check failed', error);
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
            logger.debug('Redis disconnect error', error);
        }
    }
}
export const redisService = new RedisService();
export default redisService;
//# sourceMappingURL=RedisService.js.map