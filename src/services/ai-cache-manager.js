import { Logger } from '../core/logger/index.js';
import Redis from 'ioredis';
import { LRUCache } from 'lru-cache';
import crypto from 'crypto';

/**
 * AI Cache Manager - Comprehensive caching system for all AI services
 * 
 * Features:
 * - Multi-level caching (Memory + Redis)
 * - Intelligent cache invalidation
 * - Cache warming and preloading
 * - Performance monitoring
 * - Memory optimization
 * - Cache analytics and insights
 */
class AICacheManager {
  constructor() {
    this.logger = new Logger('AICacheManager');

    // Redis connection for distributed caching
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keyPrefix: 'ai_cache:',
    });

    // Memory caches for different data types
    this.caches = {
      // Content generation cache
      content: new LRUCache({
        max: 1000,
        ttl: 1000 * 60 * 60, // 1 hour
        updateAgeOnGet: true,
      }),

      // Personalization cache
      personalization: new LRUCache({
        max: 5000,
        ttl: 1000 * 60 * 15, // 15 minutes
        updateAgeOnGet: true,
      }),

      // Analytics cache
      analytics: new LRUCache({
        max: 2000,
        ttl: 1000 * 60 * 10, // 10 minutes
        updateAgeOnGet: true,
      }),

      // Predictions cache
      predictions: new LRUCache({
        max: 10000,
        ttl: 1000 * 60 * 5, // 5 minutes
        updateAgeOnGet: true,
      }),

      // User profiles cache
      profiles: new LRUCache({
        max: 10000,
        ttl: 1000 * 60 * 30, // 30 minutes
        updateAgeOnGet: true,
      }),

      // Market data cache
      market: new LRUCache({
        max: 500,
        ttl: 1000 * 60 * 60, // 1 hour
        updateAgeOnGet: true,
      }),
    };

    // Cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      totalSize: 0,
      lastReset: Date.now(),
    };

    // Cache warming strategies
    this.warmingStrategies = new Map();
    this.isWarming = false;

    // Performance monitoring
    this.performanceMetrics = {
      averageGetTime: 0,
      averageSetTime: 0,
      cacheHitRate: 0,
      memoryUsage: 0,
      redisConnectionStatus: 'disconnected',
    };

    this.initializeCacheManager();
  }

  /**
   * Initialize cache manager
   */
  async initializeCacheManager() {
    try {
      // Test Redis connection
      await this.redis.ping();
      this.performanceMetrics.redisConnectionStatus = 'connected';
      this.logger.info('AI Cache Manager initialized with Redis connection');
    } catch (error) {
      this.performanceMetrics.redisConnectionStatus = 'disconnected';
      this.logger.warn('Redis connection failed, using memory-only caching', { error: error.message });
    }

    // Start performance monitoring
    this.startPerformanceMonitoring();
    
    // Start cache warming
    this.startCacheWarming();
    
    // Start memory optimization
    this.startMemoryOptimization();
  }

  /**
   * Get cached data with intelligent fallback
   */
  async get(key, cacheType = 'content') {
    const startTime = Date.now();
    
    try {
      // Check memory cache first
      const memoryCache = this.caches[cacheType];
      if (memoryCache) {
        const memoryResult = memoryCache.get(key);
        if (memoryResult) {
          this.stats.hits++;
          this.updatePerformanceMetrics('get', Date.now() - startTime);
          return memoryResult;
        }
      }

      // Check Redis cache
      if (this.performanceMetrics.redisConnectionStatus === 'connected') {
        const redisKey = `${cacheType}:${key}`;
        const redisResult = await this.redis.get(redisKey);
        
        if (redisResult) {
          const parsed = JSON.parse(redisResult);
          
          // Store in memory cache for faster future access
          if (memoryCache) {
            memoryCache.set(key, parsed);
          }
          
          this.stats.hits++;
          this.updatePerformanceMetrics('get', Date.now() - startTime);
          return parsed;
        }
      }

      this.stats.misses++;
      this.updatePerformanceMetrics('get', Date.now() - startTime);
      return null;
    } catch (error) {
      this.logger.error('Cache get operation failed', { error: error.message, key, cacheType });
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Set cached data with intelligent TTL
   */
  async set(key, data, cacheType = 'content', ttlSeconds = null) {
    const startTime = Date.now();
    
    try {
      // Determine TTL based on cache type
      const ttl = ttlSeconds || this.getDefaultTTL(cacheType);
      
      // Set in memory cache
      const memoryCache = this.caches[cacheType];
      if (memoryCache) {
        memoryCache.set(key, data, { ttl: ttl * 1000 });
      }

      // Set in Redis cache
      if (this.performanceMetrics.redisConnectionStatus === 'connected') {
        const redisKey = `${cacheType}:${key}`;
        await this.redis.setex(redisKey, ttl, JSON.stringify(data));
      }

      this.stats.sets++;
      this.updatePerformanceMetrics('set', Date.now() - startTime);
      
      return true;
    } catch (error) {
      this.logger.error('Cache set operation failed', { error: error.message, key, cacheType });
      return false;
    }
  }

  /**
   * Delete cached data
   */
  async delete(key, cacheType = 'content') {
    try {
      // Delete from memory cache
      const memoryCache = this.caches[cacheType];
      if (memoryCache) {
        memoryCache.delete(key);
      }

      // Delete from Redis cache
      if (this.performanceMetrics.redisConnectionStatus === 'connected') {
        const redisKey = `${cacheType}:${key}`;
        await this.redis.del(redisKey);
      }

      this.stats.deletes++;
      return true;
    } catch (error) {
      this.logger.error('Cache delete operation failed', { error: error.message, key, cacheType });
      return false;
    }
  }

  /**
   * Clear all caches
   */
  async clear(cacheType = null) {
    try {
      if (cacheType) {
        // Clear specific cache type
        const memoryCache = this.caches[cacheType];
        if (memoryCache) {
          memoryCache.clear();
        }

        if (this.performanceMetrics.redisConnectionStatus === 'connected') {
          const pattern = `${cacheType}:*`;
          const keys = await this.redis.keys(pattern);
          if (keys.length > 0) {
            await this.redis.del(...keys);
          }
        }
      } else {
        // Clear all caches
        Object.values(this.caches).forEach(cache => cache.clear());
        
        if (this.performanceMetrics.redisConnectionStatus === 'connected') {
          await this.redis.flushdb();
        }
      }

      this.logger.info('Cache cleared', { cacheType: cacheType || 'all' });
      return true;
    } catch (error) {
      this.logger.error('Cache clear operation failed', { error: error.message, cacheType });
      return false;
    }
  }

  /**
   * Get or set pattern for common use cases
   */
  async getOrSet(key, fetchFunction, cacheType = 'content', ttlSeconds = null) {
    // Try to get from cache first
    let result = await this.get(key, cacheType);
    
    if (result === null) {
      // Not in cache, fetch and store
      try {
        result = await fetchFunction();
        if (result !== null && result !== undefined) {
          await this.set(key, result, cacheType, ttlSeconds);
        }
      } catch (error) {
        this.logger.error('Fetch function failed in getOrSet', { error: error.message, key, cacheType });
        throw error;
      }
    }
    
    return result;
  }

  /**
   * Batch operations for efficiency
   */
  async mget(keys, cacheType = 'content') {
    const results = {};
    
    try {
      // Get from memory cache first
      const memoryCache = this.caches[cacheType];
      const memoryResults = {};
      const missingKeys = [];
      
      keys.forEach(key => {
        if (memoryCache) {
          const value = memoryCache.get(key);
          if (value) {
            memoryResults[key] = value;
            this.stats.hits++;
          } else {
            missingKeys.push(key);
          }
        } else {
          missingKeys.push(key);
        }
      });

      // Get missing keys from Redis
      if (missingKeys.length > 0 && this.performanceMetrics.redisConnectionStatus === 'connected') {
        const redisKeys = missingKeys.map(key => `${cacheType}:${key}`);
        const redisResults = await this.redis.mget(...redisKeys);
        
        missingKeys.forEach((key, index) => {
          const redisValue = redisResults[index];
          if (redisValue) {
            const parsed = JSON.parse(redisValue);
            results[key] = parsed;
            this.stats.hits++;
            
            // Store in memory cache
            if (memoryCache) {
              memoryCache.set(key, parsed);
            }
          } else {
            this.stats.misses++;
          }
        });
      }

      // Combine results
      Object.assign(results, memoryResults);
      
      return results;
    } catch (error) {
      this.logger.error('Batch get operation failed', { error: error.message, keys, cacheType });
      return {};
    }
  }

  async mset(keyValuePairs, cacheType = 'content', ttlSeconds = null) {
    try {
      const ttl = ttlSeconds || this.getDefaultTTL(cacheType);
      
      // Set in memory cache
      const memoryCache = this.caches[cacheType];
      if (memoryCache) {
        Object.entries(keyValuePairs).forEach(([key, value]) => {
          memoryCache.set(key, value, { ttl: ttl * 1000 });
        });
      }

      // Set in Redis cache
      if (this.performanceMetrics.redisConnectionStatus === 'connected') {
        const redisPairs = [];
        Object.entries(keyValuePairs).forEach(([key, value]) => {
          redisPairs.push(`${cacheType}:${key}`, JSON.stringify(value));
        });
        
        await this.redis.mset(...redisPairs);
        
        // Set TTL for all keys
        const pipeline = this.redis.pipeline();
        Object.keys(keyValuePairs).forEach(key => {
          pipeline.expire(`${cacheType}:${key}`, ttl);
        });
        await pipeline.exec();
      }

      this.stats.sets += Object.keys(keyValuePairs).length;
      return true;
    } catch (error) {
      this.logger.error('Batch set operation failed', { error: error.message, cacheType });
      return false;
    }
  }

  /**
   * Cache warming strategies
   */
  registerWarmingStrategy(name, strategy) {
    this.warmingStrategies.set(name, strategy);
  }

  async warmCache(strategyName = null) {
    if (this.isWarming) return;

    this.isWarming = true;
    
    try {
      if (strategyName) {
        const strategy = this.warmingStrategies.get(strategyName);
        if (strategy) {
          await strategy();
        }
      } else {
        // Run all warming strategies
        for (const [name, strategy] of this.warmingStrategies) {
          try {
            await strategy();
            this.logger.info('Cache warming strategy completed', { strategy: name });
          } catch (error) {
            this.logger.error('Cache warming strategy failed', { strategy: name, error: error.message });
          }
        }
      }
    } finally {
      this.isWarming = false;
    }
  }

  startCacheWarming() {
    // Warm cache every 5 minutes
    setInterval(() => {
      if (!this.isWarming) {
        this.warmCache();
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Cache invalidation strategies
   */
  async invalidatePattern(pattern, cacheType = 'content') {
    try {
      // Invalidate memory cache
      const memoryCache = this.caches[cacheType];
      if (memoryCache) {
        const keys = Array.from(memoryCache.keys());
        const matchingKeys = keys.filter(key => key.includes(pattern));
        matchingKeys.forEach(key => memoryCache.delete(key));
      }

      // Invalidate Redis cache
      if (this.performanceMetrics.redisConnectionStatus === 'connected') {
        const redisPattern = `${cacheType}:*${pattern}*`;
        const keys = await this.redis.keys(redisPattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }

      this.logger.info('Cache invalidated by pattern', { pattern, cacheType });
      return true;
    } catch (error) {
      this.logger.error('Cache invalidation failed', { error: error.message, pattern, cacheType });
      return false;
    }
  }

  async invalidateByTags(tags, cacheType = 'content') {
    try {
      // This would require implementing a tagging system
      // For now, we'll use pattern matching
      const patterns = tags.map(tag => `*${tag}*`);
      const promises = patterns.map(pattern => this.invalidatePattern(pattern, cacheType));
      await Promise.all(promises);
      
      this.logger.info('Cache invalidated by tags', { tags, cacheType });
      return true;
    } catch (error) {
      this.logger.error('Cache invalidation by tags failed', { error: error.message, tags, cacheType });
      return false;
    }
  }

  /**
   * Cache analytics and insights
   */
  getCacheStats() {
    const totalHits = this.stats.hits;
    const totalMisses = this.stats.misses;
    const totalRequests = totalHits + totalMisses;
    
    return {
      ...this.stats,
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      missRate: totalRequests > 0 ? totalMisses / totalRequests : 0,
      totalRequests,
      memoryUsage: this.calculateMemoryUsage(),
      cacheSizes: this.getCacheSizes(),
      uptime: Date.now() - this.stats.lastReset,
    };
  }

  calculateMemoryUsage() {
    let totalSize = 0;
    Object.values(this.caches).forEach(cache => {
      totalSize += cache.size;
    });
    return totalSize;
  }

  getCacheSizes() {
    const sizes = {};
    Object.entries(this.caches).forEach(([name, cache]) => {
      sizes[name] = cache.size;
    });
    return sizes;
  }

  /**
   * Performance monitoring
   */
  startPerformanceMonitoring() {
    setInterval(() => {
      this.logPerformanceMetrics();
    }, 60000); // Every minute
  }

  logPerformanceMetrics() {
    const stats = this.getCacheStats();
    const metrics = {
      ...stats,
      ...this.performanceMetrics,
      redisStatus: this.performanceMetrics.redisConnectionStatus,
    };

    this.logger.info('AI Cache Manager Performance', metrics);

    // Reset stats every hour
    if (Date.now() - this.stats.lastReset > 3600000) {
      this.resetStats();
    }
  }

  updatePerformanceMetrics(operation, duration) {
    const metricKey = `average${operation.charAt(0).toUpperCase() + operation.slice(1)}Time`;
    if (this.performanceMetrics[metricKey]) {
      this.performanceMetrics[metricKey] = (this.performanceMetrics[metricKey] + duration) / 2;
    } else {
      this.performanceMetrics[metricKey] = duration;
    }
  }

  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      totalSize: 0,
      lastReset: Date.now(),
    };
  }

  /**
   * Memory optimization
   */
  startMemoryOptimization() {
    setInterval(() => {
      this.optimizeMemory();
    }, 10 * 60 * 1000); // Every 10 minutes
  }

  optimizeMemory() {
    // Clear expired entries from memory caches
    Object.values(this.caches).forEach(cache => {
      // LRU cache handles expiration automatically, but we can force cleanup
      cache.purgeStale();
    });

    // Log memory usage
    const memoryUsage = this.calculateMemoryUsage();
    if (memoryUsage > 10000) { // If more than 10k items
      this.logger.warn('High memory usage detected', { memoryUsage });
    }
  }

  /**
   * Utility methods
   */
  getDefaultTTL(cacheType) {
    const ttls = {
      content: 3600,      // 1 hour
      personalization: 900,  // 15 minutes
      analytics: 600,     // 10 minutes
      predictions: 300,   // 5 minutes
      profiles: 1800,     // 30 minutes
      market: 3600,       // 1 hour
    };
    
    return ttls[cacheType] || 600; // Default 10 minutes
  }

  generateCacheKey(prefix, ...parts) {
    const key = [prefix, ...parts].join(':');
    return crypto.createHash('md5').update(key).digest('hex');
  }

  /**
   * Health check
   */
  async healthCheck() {
    const health = {
      status: 'healthy',
      redis: this.performanceMetrics.redisConnectionStatus,
      memory: this.calculateMemoryUsage(),
      caches: this.getCacheSizes(),
      stats: this.getCacheStats(),
    };

    // Check Redis connection
    if (this.performanceMetrics.redisConnectionStatus === 'connected') {
      try {
        await this.redis.ping();
      } catch (error) {
        health.status = 'degraded';
        health.redis = 'disconnected';
        health.error = error.message;
      }
    }

    return health;
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown() {
    try {
      await this.redis.quit();
      this.logger.info('AI Cache Manager shutdown completed');
    } catch (error) {
      this.logger.error('Error during cache manager shutdown', { error: error.message });
    }
  }
}

// Create singleton instance
const aiCacheManager = new AICacheManager();

export { AICacheManager, aiCacheManager };