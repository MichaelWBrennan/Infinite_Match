/**
 * Cache Manager
 * Provides in-memory caching with TTL support
 */

import { Logger } from '../logger/index.js';

const logger = new Logger('CacheManager');

export class CacheManager {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };
  }

  /**
   * Set a cache entry with TTL
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttlMs - Time to live in milliseconds
   */
  set(key, value, ttlMs = 300000) { // Default 5 minutes
    this.cache.set(key, value);
    this.ttl.set(key, Date.now() + ttlMs);
    this.stats.sets++;
    logger.debug(`Cached key: ${key} (TTL: ${ttlMs}ms)`);
  }

  /**
   * Get a cache entry
   * @param {string} key - Cache key
   * @returns {*} Cached value or null if not found/expired
   */
  get(key) {
    if (!this.cache.has(key)) {
      this.stats.misses++;
      logger.debug(`Cache miss: ${key}`);
      return null;
    }

    const expiry = this.ttl.get(key);
    if (expiry < Date.now()) {
      this.cache.delete(key);
      this.ttl.delete(key);
      this.stats.misses++;
      logger.debug(`Cache expired: ${key}`);
      return null;
    }

    this.stats.hits++;
    logger.debug(`Cache hit: ${key}`);
    return this.cache.get(key);
  }

  /**
   * Check if a key exists and is not expired
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    if (!this.cache.has(key)) {
      return false;
    }

    const expiry = this.ttl.get(key);
    if (expiry < Date.now()) {
      this.cache.delete(key);
      this.ttl.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a cache entry
   * @param {string} key - Cache key
   * @returns {boolean} True if key was deleted
   */
  delete(key) {
    const deleted = this.cache.delete(key);
    this.ttl.delete(key);
    if (deleted) {
      this.stats.deletes++;
      logger.debug(`Deleted cache key: ${key}`);
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.ttl.clear();
    logger.info(`Cleared cache (${size} entries)`);
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      size: this.cache.size,
    };
  }

  /**
   * Clean up expired entries
   * @returns {number} Number of entries cleaned up
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, expiry] of this.ttl.entries()) {
      if (expiry < now) {
        this.cache.delete(key);
        this.ttl.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`Cleaned up ${cleaned} expired cache entries`);
    }

    return cleaned;
  }

  /**
   * Get or set pattern with TTL
   * @param {string} key - Cache key
   * @param {Function} factory - Function to generate value if not cached
   * @param {number} ttlMs - Time to live in milliseconds
   * @returns {*} Cached or generated value
   */
  async getOrSet(key, factory, ttlMs = 300000) {
    let value = this.get(key);
    
    if (value === null) {
      try {
        value = await factory();
        this.set(key, value, ttlMs);
      } catch (error) {
        logger.error(`Failed to generate value for key ${key}`, { error: error.message });
        throw error;
      }
    }

    return value;
  }
}

export default CacheManager;