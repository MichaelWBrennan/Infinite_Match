/**
 * Shared Redis (ioredis) client factory.
 *
 * Many services build their own client in their constructor. Without an
 * `error` listener, ioredis reports an "Unhandled error event" and the default
 * retry strategy reconnects forever, which flooded the logs (thousands of
 * ECONNREFUSED entries) when Redis was not running.
 *
 * This factory:
 *  - always attaches an error listener,
 *  - logs the first connection failure once instead of on every retry,
 *  - bounds reconnects, and
 *  - disables the offline queue so commands reject fast rather than hanging.
 */
import Redis from 'ioredis';
/** Set REDIS_ENABLED=false to skip Redis entirely. */
export function isRedisEnabled() {
    return process.env['REDIS_ENABLED'] !== 'false';
}
export function createRedisClient(options = {}) {
    const redisPassword = process.env['REDIS_PASSWORD'];
    const client = new Redis({
        host: process.env['REDIS_HOST'] || 'localhost',
        port: parseInt(process.env['REDIS_PORT'] || '6379', 10),
        // `password: undefined` trips `exactOptionalPropertyTypes` and ioredis
        // validation, so only send it when it is actually configured.
        ...(redisPassword ? { password: redisPassword } : {}),
        lazyConnect: true,
        // Fail fast instead of queueing commands against a dead server.
        enableOfflineQueue: false,
        maxRetriesPerRequest: 2,
        retryStrategy: (times) => {
            // Give up after ~10 attempts (~30s) so a missing Redis stays quiet.
            if (times > 10)
                return null;
            return Math.min(times * 200, 5000);
        },
        ...options,
    });
    let reported = false;
    client.on('error', (error) => {
        if (reported)
            return;
        reported = true;
        console.warn(`Redis unavailable, continuing without cache: ${error && error.message ? error.message : error}`);
    });
    return client;
}
export default createRedisClient;
//# sourceMappingURL=redis-client.js.map