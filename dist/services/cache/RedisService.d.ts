export declare class RedisService {
    private client;
    private subscriber;
    private publisher;
    constructor();
    private setupEventHandlers;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttl?: number): Promise<boolean>;
    del(key: string): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    getJSON<T>(key: string): Promise<T | null>;
    setJSON(key: string, value: any, ttl?: number): Promise<boolean>;
    hget(key: string, field: string): Promise<string | null>;
    hset(key: string, field: string, value: string): Promise<boolean>;
    hgetall(key: string): Promise<Record<string, string> | null>;
    lpush(key: string, ...values: string[]): Promise<number>;
    rpop(key: string): Promise<string | null>;
    llen(key: string): Promise<number>;
    sadd(key: string, ...members: string[]): Promise<number>;
    smembers(key: string): Promise<string[]>;
    sismember(key: string, member: string): Promise<boolean>;
    zadd(key: string, score: number, member: string): Promise<number>;
    zrange(key: string, start: number, stop: number): Promise<string[]>;
    zrevrange(key: string, start: number, stop: number): Promise<string[]>;
    publish(channel: string, message: string): Promise<number>;
    subscribe(channel: string, callback: (message: string) => void): Promise<void>;
    unsubscribe(channel: string): Promise<void>;
    cachePlayer(playerId: string, playerData: any, ttl?: number): Promise<boolean>;
    getCachedPlayer(playerId: string): Promise<any | null>;
    cacheGameSession(sessionId: string, sessionData: any, ttl?: number): Promise<boolean>;
    getCachedGameSession(sessionId: string): Promise<any | null>;
    cacheLeaderboard(leaderboardType: string, data: any[], ttl?: number): Promise<boolean>;
    getCachedLeaderboard(leaderboardType: string): Promise<any[] | null>;
    checkRateLimit(key: string, limit: number, window: number): Promise<{
        allowed: boolean;
        remaining: number;
        resetTime: number;
    }>;
    healthCheck(): Promise<{
        status: string;
        latency: number;
    }>;
    disconnect(): Promise<void>;
}
export declare const redisService: RedisService;
export default redisService;
//# sourceMappingURL=RedisService.d.ts.map