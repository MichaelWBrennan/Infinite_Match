export class CacheManager {
    cache: Map<any, any>;
    ttl: Map<any, any>;
    stats: {
        hits: number;
        misses: number;
        sets: number;
        deletes: number;
    };
    /**
     * Set a cache entry with TTL
     * @param {string} key - Cache key
     * @param {*} value - Value to cache
     * @param {number} ttlMs - Time to live in milliseconds
     */
    set(key: string, value: any, ttlMs?: number): void;
    /**
     * Get a cache entry
     * @param {string} key - Cache key
     * @returns {*} Cached value or null if not found/expired
     */
    get(key: string): any;
    /**
     * Check if a key exists and is not expired
     * @param {string} key - Cache key
     * @returns {boolean}
     */
    has(key: string): boolean;
    /**
     * Delete a cache entry
     * @param {string} key - Cache key
     * @returns {boolean} True if key was deleted
     */
    delete(key: string): boolean;
    /**
     * Clear all cache entries
     */
    clear(): void;
    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getStats(): Object;
    /**
     * Clean up expired entries
     * @returns {number} Number of entries cleaned up
     */
    cleanup(): number;
    /**
     * Get or set pattern with TTL
     * @param {string} key - Cache key
     * @param {Function} factory - Function to generate value if not cached
     * @param {number} ttlMs - Time to live in milliseconds
     * @returns {*} Cached or generated value
     */
    getOrSet(key: string, factory: Function, ttlMs?: number): any;
}
export default CacheManager;
//# sourceMappingURL=CacheManager.d.ts.map