import Redis from 'ioredis';
import { Logger } from '../../core/logger/index.js';

const logger = new Logger('RedisService');

export class RedisService {
  private client: Redis;
  private subscriber: Redis;
  private publisher: Redis;

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

  private setupEventHandlers() {
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
  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error('Redis get error', { key, error });
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    try {
      if (ttl) {
        await this.client.setex(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      logger.error('Redis set error', { key, error });
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Redis del error', { key, error });
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis exists error', { key, error });
      return false;
    }
  }

  // JSON operations
  async getJSON<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis getJSON error', { key, error });
      return null;
    }
  }

  async setJSON(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      const jsonValue = JSON.stringify(value);
      return await this.set(key, jsonValue, ttl);
    } catch (error) {
      logger.error('Redis setJSON error', { key, error });
      return false;
    }
  }

  // Hash operations
  async hget(key: string, field: string): Promise<string | null> {
    try {
      return await this.client.hget(key, field);
    } catch (error) {
      logger.error('Redis hget error', { key, field, error });
      return null;
    }
  }

  async hset(key: string, field: string, value: string): Promise<boolean> {
    try {
      await this.client.hset(key, field, value);
      return true;
    } catch (error) {
      logger.error('Redis hset error', { key, field, error });
      return false;
    }
  }

  async hgetall(key: string): Promise<Record<string, string> | null> {
    try {
      return await this.client.hgetall(key);
    } catch (error) {
      logger.error('Redis hgetall error', { key, error });
      return null;
    }
  }

  // List operations
  async lpush(key: string, ...values: string[]): Promise<number> {
    try {
      return await this.client.lpush(key, ...values);
    } catch (error) {
      logger.error('Redis lpush error', { key, error });
      return 0;
    }
  }

  async rpop(key: string): Promise<string | null> {
    try {
      return await this.client.rpop(key);
    } catch (error) {
      logger.error('Redis rpop error', { key, error });
      return null;
    }
  }

  async llen(key: string): Promise<number> {
    try {
      return await this.client.llen(key);
    } catch (error) {
      logger.error('Redis llen error', { key, error });
      return 0;
    }
  }

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.client.sadd(key, ...members);
    } catch (error) {
      logger.error('Redis sadd error', { key, error });
      return 0;
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      return await this.client.smembers(key);
    } catch (error) {
      logger.error('Redis smembers error', { key, error });
      return [];
    }
  }

  async sismember(key: string, member: string): Promise<boolean> {
    try {
      const result = await this.client.sismember(key, member);
      return result === 1;
    } catch (error) {
      logger.error('Redis sismember error', { key, member, error });
      return false;
    }
  }

  // Sorted set operations
  async zadd(key: string, score: number, member: string): Promise<number> {
    try {
      return await this.client.zadd(key, score, member);
    } catch (error) {
      logger.error('Redis zadd error', { key, score, member, error });
      return 0;
    }
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.client.zrange(key, start, stop);
    } catch (error) {
      logger.error('Redis zrange error', { key, start, stop, error });
      return [];
    }
  }

  async zrevrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.client.zrevrange(key, start, stop);
    } catch (error) {
      logger.error('Redis zrevrange error', { key, start, stop, error });
      return [];
    }
  }

  // Pub/Sub operations
  async publish(channel: string, message: string): Promise<number> {
    try {
      return await this.publisher.publish(channel, message);
    } catch (error) {
      logger.error('Redis publish error', { channel, error });
      return 0;
    }
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    try {
      await this.subscriber.subscribe(channel);
      this.subscriber.on('message', (receivedChannel, message) => {
        if (receivedChannel === channel) {
          callback(message);
        }
      });
    } catch (error) {
      logger.error('Redis subscribe error', { channel, error });
    }
  }

  async unsubscribe(channel: string): Promise<void> {
    try {
      await this.subscriber.unsubscribe(channel);
    } catch (error) {
      logger.error('Redis unsubscribe error', { channel, error });
    }
  }

  // Game-specific cache operations
  async cachePlayer(playerId: string, playerData: any, ttl = 3600): Promise<boolean> {
    const key = `player:${playerId}`;
    return await this.setJSON(key, playerData, ttl);
  }

  async getCachedPlayer(playerId: string): Promise<any | null> {
    const key = `player:${playerId}`;
    return await this.getJSON(key);
  }

  async cacheGameSession(sessionId: string, sessionData: any, ttl = 1800): Promise<boolean> {
    const key = `session:${sessionId}`;
    return await this.setJSON(key, sessionData, ttl);
  }

  async getCachedGameSession(sessionId: string): Promise<any | null> {
    const key = `session:${sessionId}`;
    return await this.getJSON(key);
  }

  async cacheLeaderboard(leaderboardType: string, data: any[], ttl = 300): Promise<boolean> {
    const key = `leaderboard:${leaderboardType}`;
    return await this.setJSON(key, data, ttl);
  }

  async getCachedLeaderboard(leaderboardType: string): Promise<any[] | null> {
    const key = `leaderboard:${leaderboardType}`;
    return await this.getJSON(key);
  }

  // Rate limiting
  async checkRateLimit(
    key: string,
    limit: number,
    window: number,
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
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
    } catch (error) {
      logger.error('Redis rate limit error', { key, error });
      return { allowed: true, remaining: limit, resetTime: Date.now() + window * 1000 };
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; latency: number }> {
    const start = Date.now();
    try {
      await this.client.ping();
      const latency = Date.now() - start;
      return { status: 'healthy', latency };
    } catch (error) {
      logger.error('Redis health check failed', error);
      return { status: 'unhealthy', latency: -1 };
    }
  }

  // Cleanup
  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      await this.subscriber.quit();
      await this.publisher.quit();
      logger.info('Redis connections closed');
    } catch (error) {
      logger.error('Redis disconnect error', error);
    }
  }
}

export const redisService = new RedisService();
export default redisService;
