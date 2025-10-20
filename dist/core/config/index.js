/**
 * Optimized Configuration Management
 * Consolidated configuration with environment-based settings
 */
import dotenv from 'dotenv';
// Load environment variables
dotenv.config();
class OptimizedConfig {
    server;
    security;
    database;
    cloud;
    analytics;
    game;
    constructor() {
        this.server = {
            port: parseInt(process.env['PORT'] || '3000', 10),
            host: process.env['HOST'] || '0.0.0.0',
            environment: process.env['NODE_ENV'] || 'development',
            cors: {
                origin: this.parseCorsOrigin(process.env['CORS_ORIGIN'] || '*'),
                credentials: process.env['CORS_CREDENTIALS'] === 'true',
            },
        };
        this.security = {
            rateLimit: {
                windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000', 10), // 15 minutes
                max: parseInt(process.env['RATE_LIMIT_MAX'] || '100', 10),
            },
            jwt: {
                secret: process.env['JWT_SECRET'] || 'your-secret-key',
                expiresIn: process.env['JWT_EXPIRES_IN'] || '24h',
            },
            bcrypt: {
                saltRounds: parseInt(process.env['BCRYPT_SALT_ROUNDS'] || '12', 10),
            },
        };
        this.database = {
            mongodb: {
                uri: process.env['MONGODB_URI'] || 'mongodb://localhost:27017/match3game',
                options: {
                    maxPoolSize: parseInt(process.env['MONGODB_MAX_POOL_SIZE'] || '10', 10),
                    serverSelectionTimeoutMS: parseInt(process.env['MONGODB_TIMEOUT'] || '5000', 10),
                    socketTimeoutMS: parseInt(process.env['MONGODB_SOCKET_TIMEOUT'] || '45000', 10),
                },
            },
            redis: {
                url: process.env['REDIS_URL'] || 'redis://localhost:6379',
                retryDelayOnFailover: parseInt(process.env['REDIS_RETRY_DELAY'] || '100', 10),
                maxRetriesPerRequest: parseInt(process.env['REDIS_MAX_RETRIES'] || '3', 10),
            },
            dynamodb: {
                region: process.env['AWS_REGION'] || 'us-east-1',
                tableName: process.env['AWS_DYNAMODB_TABLE'] || 'match3game',
            },
        };
        this.cloud = {
            aws: {
                region: process.env['AWS_REGION'] || 'us-east-1',
                accessKeyId: process.env['AWS_ACCESS_KEY_ID'] || '',
                secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY'] || '',
                s3Bucket: process.env['AWS_S3_BUCKET'] || '',
                snsTopicArn: process.env['AWS_SNS_TOPIC_ARN'] || '',
                sqsQueueUrl: process.env['AWS_SQS_QUEUE_URL'] || '',
                sesFromEmail: process.env['AWS_SES_FROM_EMAIL'] || '',
            },
            google: {
                projectId: process.env['GOOGLE_CLOUD_PROJECT_ID'] || '',
                keyFile: process.env['GOOGLE_CLOUD_KEY_FILE'] || '',
            },
            azure: {
                storageAccount: process.env['AZURE_STORAGE_ACCOUNT'] || '',
                cosmosEndpoint: process.env['AZURE_COSMOS_ENDPOINT'] || '',
                cosmosKey: process.env['AZURE_COSMOS_KEY'] || '',
                cosmosDatabase: process.env['AZURE_COSMOS_DATABASE'] || 'match3game',
            },
        };
        this.analytics = {
            sentry: {
                dsn: process.env['SENTRY_DSN'] || '',
                environment: this.server.environment,
                tracesSampleRate: parseFloat(process.env['SENTRY_TRACES_SAMPLE_RATE'] || '1.0'),
            },
            logging: {
                level: process.env['LOG_LEVEL'] || 'info',
                format: process.env['LOG_FORMAT'] || 'json',
                maxFiles: parseInt(process.env['LOG_MAX_FILES'] || '5', 10),
                maxSize: process.env['LOG_MAX_SIZE'] || '10m',
                file: {
                    enabled: process.env['LOG_FILE_ENABLED'] === 'true',
                    path: process.env['LOG_FILE_PATH'] || 'logs',
                    maxSize: process.env['LOG_FILE_MAX_SIZE'] || '20m',
                    maxFiles: process.env['LOG_FILE_MAX_FILES'] || '14d',
                },
            },
        };
        this.game = {
            maxLevel: parseInt(process.env['GAME_MAX_LEVEL'] || '1000', 10),
            maxScore: parseInt(process.env['GAME_MAX_SCORE'] || '999999', 10),
            powerUps: {
                maxCount: parseInt(process.env['GAME_POWERUP_MAX_COUNT'] || '10', 10),
                cooldownMs: parseInt(process.env['GAME_POWERUP_COOLDOWN'] || '5000', 10),
            },
            match3: {
                boardSize: parseInt(process.env['GAME_BOARD_SIZE'] || '8', 10),
                colors: (process.env['GAME_COLORS'] || 'red,blue,green,yellow,purple,orange').split(','),
                minMatch: parseInt(process.env['GAME_MIN_MATCH'] || '3', 10),
            },
        };
    }
    parseCorsOrigin(origin) {
        if (origin === '*')
            return '*';
        if (origin.includes(','))
            return origin.split(',').map(o => o.trim());
        return origin;
    }
    isDevelopment() {
        return this.server.environment === 'development';
    }
    isProduction() {
        return this.server.environment === 'production';
    }
    isTest() {
        return this.server.environment === 'test';
    }
    getDatabaseUrl() {
        return this.database.mongodb.uri;
    }
    getRedisUrl() {
        return this.database.redis.url;
    }
    getAwsConfig() {
        return {
            region: this.cloud.aws.region,
            credentials: {
                accessKeyId: this.cloud.aws.accessKeyId,
                secretAccessKey: this.cloud.aws.secretAccessKey,
            },
        };
    }
    getGoogleConfig() {
        return {
            projectId: this.cloud.google.projectId,
            keyFilename: this.cloud.google.keyFile,
        };
    }
    getAzureConfig() {
        return {
            storageAccount: this.cloud.azure.storageAccount,
            cosmosEndpoint: this.cloud.azure.cosmosEndpoint,
            cosmosKey: this.cloud.azure.cosmosKey,
            cosmosDatabase: this.cloud.azure.cosmosDatabase,
        };
    }
    validate() {
        const errors = [];
        // Validate required environment variables
        if (this.isProduction()) {
            if (!process.env['JWT_SECRET'] || process.env['JWT_SECRET'] === 'your-secret-key') {
                errors.push('JWT_SECRET must be set in production');
            }
            if (!process.env['MONGODB_URI']) {
                errors.push('MONGODB_URI must be set in production');
            }
            if (!process.env['REDIS_URL']) {
                errors.push('REDIS_URL must be set in production');
            }
        }
        // Validate numeric values
        if (this.server.port < 1 || this.server.port > 65535) {
            errors.push('PORT must be between 1 and 65535');
        }
        if (this.security.rateLimit.max < 1) {
            errors.push('RATE_LIMIT_MAX must be greater than 0');
        }
        if (this.game.match3.boardSize < 3) {
            errors.push('GAME_BOARD_SIZE must be at least 3');
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}
export default new OptimizedConfig();
//# sourceMappingURL=index.js.map