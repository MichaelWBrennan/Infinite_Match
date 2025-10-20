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
export class AICacheManager {
    logger: Logger;
    redis: Redis;
    caches: {
        content: any;
        personalization: any;
        analytics: any;
        predictions: any;
        profiles: any;
        market: any;
    };
    stats: {
        hits: number;
        misses: number;
        sets: number;
        deletes: number;
        evictions: number;
        totalSize: number;
        lastReset: number;
    };
    warmingStrategies: Map<any, any>;
    isWarming: boolean;
    performanceMetrics: {
        averageGetTime: number;
        averageSetTime: number;
        cacheHitRate: number;
        memoryUsage: number;
        redisConnectionStatus: string;
    };
    /**
     * Initialize cache manager
     */
    initializeCacheManager(): Promise<void>;
    /**
     * Get cached data with intelligent fallback
     */
    get(key: any, cacheType?: string): Promise<any>;
    /**
     * Set cached data with intelligent TTL
     */
    set(key: any, data: any, cacheType?: string, ttlSeconds?: null): Promise<boolean>;
    /**
     * Delete cached data
     */
    delete(key: any, cacheType?: string): Promise<boolean>;
    /**
     * Clear all caches
     */
    clear(cacheType?: null): Promise<boolean>;
    /**
     * Get or set pattern for common use cases
     */
    getOrSet(key: any, fetchFunction: any, cacheType?: string, ttlSeconds?: null): Promise<any>;
    /**
     * Batch operations for efficiency
     */
    mget(keys: any, cacheType?: string): Promise<{}>;
    mset(keyValuePairs: any, cacheType?: string, ttlSeconds?: null): Promise<boolean>;
    /**
     * Cache warming strategies
     */
    registerWarmingStrategy(name: any, strategy: any): void;
    warmCache(strategyName?: null): Promise<void>;
    startCacheWarming(): void;
    /**
     * Cache invalidation strategies
     */
    invalidatePattern(pattern: any, cacheType?: string): Promise<boolean>;
    invalidateByTags(tags: any, cacheType?: string): Promise<boolean>;
    /**
     * Cache analytics and insights
     */
    getCacheStats(): {
        hitRate: number;
        missRate: number;
        totalRequests: number;
        memoryUsage: number;
        cacheSizes: {};
        uptime: number;
        hits: number;
        misses: number;
        sets: number;
        deletes: number;
        evictions: number;
        totalSize: number;
        lastReset: number;
    };
    calculateMemoryUsage(): number;
    getCacheSizes(): {};
    /**
     * Performance monitoring
     */
    startPerformanceMonitoring(): void;
    logPerformanceMetrics(): void;
    updatePerformanceMetrics(operation: any, duration: any): void;
    resetStats(): void;
    /**
     * Memory optimization
     */
    startMemoryOptimization(): void;
    optimizeMemory(): void;
    /**
     * Utility methods
     */
    getDefaultTTL(cacheType: any): any;
    generateCacheKey(prefix: any, ...parts: any[]): string;
    /**
     * Health check
     */
    healthCheck(): Promise<{
        status: string;
        redis: string;
        memory: number;
        caches: {};
        stats: {
            hitRate: number;
            missRate: number;
            totalRequests: number;
            memoryUsage: number;
            cacheSizes: {};
            uptime: number;
            hits: number;
            misses: number;
            sets: number;
            deletes: number;
            evictions: number;
            totalSize: number;
            lastReset: number;
        };
    }>;
    /**
     * Cleanup and shutdown
     */
    shutdown(): Promise<void>;
}
export const aiCacheManager: AICacheManager;
import { Logger } from '../core/logger/index.js';
import Redis from 'ioredis';
//# sourceMappingURL=ai-cache-manager.d.ts.map