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
    dynamodb: {
        region: string;
        tableName: string;
    };
}
interface CloudConfig {
    aws: {
        region: string;
        accessKeyId: string;
        secretAccessKey: string;
        s3Bucket: string;
        snsTopicArn: string;
        sqsQueueUrl: string;
        sesFromEmail: string;
    };
    google: {
        projectId: string;
        keyFile: string;
    };
    azure: {
        storageAccount: string;
        cosmosEndpoint: string;
        cosmosKey: string;
        cosmosDatabase: string;
    };
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
declare class OptimizedConfig {
    readonly server: ServerConfig;
    readonly security: SecurityConfig;
    readonly database: DatabaseConfig;
    readonly cloud: CloudConfig;
    readonly analytics: AnalyticsConfig;
    readonly game: GameConfig;
    constructor();
    private parseCorsOrigin;
    isDevelopment(): boolean;
    isProduction(): boolean;
    isTest(): boolean;
    getDatabaseUrl(): string;
    getRedisUrl(): string;
    getAwsConfig(): {
        region: string;
        credentials: {
            accessKeyId: string;
            secretAccessKey: string;
        };
    };
    getGoogleConfig(): {
        projectId: string;
        keyFilename: string;
    };
    getAzureConfig(): {
        storageAccount: string;
        cosmosEndpoint: string;
        cosmosKey: string;
        cosmosDatabase: string;
    };
    validate(): {
        isValid: boolean;
        errors: string[];
    };
}
declare const _default: OptimizedConfig;
export default _default;
//# sourceMappingURL=index.d.ts.map