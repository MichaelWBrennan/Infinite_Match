/**
 * Optimized Configuration Management
 * Consolidated configuration with environment-based settings
 */
interface ServerConfig {
    port: number;
    host: string;
    environment: string;
    cors: {
        origin: string | string[];
        credentials: boolean;
    };
}
interface SecurityConfig {
    rateLimit: {
        windowMs: number;
        max: number;
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
    bcrypt: {
        saltRounds: number;
    };
}
interface DatabaseConfig {
    mongodb: {
        uri: string;
        options: {
            maxPoolSize: number;
            serverSelectionTimeoutMS: number;
            socketTimeoutMS: number;
        };
    };
    redis: {
        url: string;
        retryDelayOnFailover: number;
        maxRetriesPerRequest: number;
    };
}
interface UnityConfig {
    projectId: string;
    environmentId: string;
    clientId: string;
    clientSecret: string;
}
interface AnalyticsConfig {
    sentry: {
        dsn: string;
        environment: string;
        tracesSampleRate: number;
    };
    logging: {
        level: string;
        format: string;
        maxFiles: number;
        maxSize: string;
        file: {
            enabled: boolean;
            path: string;
            maxSize: string;
            maxFiles: string;
        };
    };
}
interface GameConfig {
    maxLevel: number;
    maxScore: number;
    powerUps: {
        maxCount: number;
        cooldownMs: number;
    };
    match3: {
        boardSize: number;
        colors: string[];
        minMatch: number;
    };
}
interface PaymentsConfig {
    stripe: {
        publishableKey: string;
        secretKey: string;
        webhookSecret: string;
        apiVersion: string;
        currency: string;
        country: string;
    };
    apple: {
        sharedSecret: string;
    };
    google: {
        serviceAccountKeyPath: string;
    };
    pricing: {
        defaultCurrency: string;
        countryOverridesPath: string;
    };
}
declare class OptimizedConfig {
    readonly server: ServerConfig;
    readonly security: SecurityConfig;
    readonly database: DatabaseConfig;
    readonly unity: UnityConfig;
    readonly analytics: AnalyticsConfig;
    readonly game: GameConfig;
    readonly payments: PaymentsConfig;
    constructor();
    private parseCorsOrigin;
    isDevelopment(): boolean;
    isProduction(): boolean;
    isTest(): boolean;
    getDatabaseUrl(): string;
    getRedisUrl(): string;
    validate(): {
        isValid: boolean;
        errors: string[];
    };
}
declare const AppConfig: OptimizedConfig;
export { AppConfig };
export default AppConfig;
//# sourceMappingURL=index.d.ts.map