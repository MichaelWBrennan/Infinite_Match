import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { Logger } from '../core/logger/index.js';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs';
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { Storage } from '@google-cloud/storage';
import { Firestore } from '@google-cloud/firestore';
import { PubSub } from '@google-cloud/pubsub';
import { MetricServiceClient } from '@google-cloud/monitoring';
import { Logging } from '@google-cloud/logging';
import { BlobServiceClient } from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import { ServiceBusClient } from '@azure/service-bus';
import { CosmosClient } from '@azure/cosmos';
import { createClient } from 'redis';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

/**
 * Optimized Cloud Services Manager for Match 3 Game
 * Integrates AWS, Google Cloud, Azure, Redis, and MongoDB with advanced features
 */
class OptimizedCloudServicesManager {
  constructor() {
    this.logger = new Logger('OptimizedCloudServicesManager');
    this.awsClients = {};
    this.googleClients = {};
    this.azureClients = {};
    this.redis = null;
    this.mongodb = null;
    this.isInitialized = false;
    this.healthChecks = new Map();
    // Per-provider start-up outcome (distinct from `healthChecks`, which holds
    // live probe functions).
    this.providerStatus = new Map();
    this.retryPolicies = new Map();
    this.circuitBreakers = new Map();
    this.metrics = {
      requests: 0,
      errors: 0,
      latency: [],
    };
  }

  /**
   * Initialize all cloud services with optimized configuration
   */
  async initialize() {
    this.logger.info('Initializing optimized cloud services...');

    // Each cloud provider is optional. Earlier the first unconfigured provider
    // (e.g. Azure, whose SDK throws on an undefined connection string) aborted
    // initialization and took the whole server down. Now a provider failure
    // only disables that provider.
    const providers = [
      ['aws', () => this.initializeAWSServices()],
      ['google', () => this.initializeGoogleCloudServices()],
      ['azure', () => this.initializeAzureServices()],
      ['redis', () => this.initializeRedis()],
      ['mongodb', () => this.initializeMongoDB()],
    ];

    const unavailable = [];

    for (const [name, init] of providers) {
      try {
        await init();
        this.providerStatus.set(name, { status: 'connected' });
      } catch (error) {
        this.providerStatus.set(name, { status: 'unavailable', error: error.message });
        unavailable.push(name);
        this.logger.warn(
          `Cloud provider '${name}' is unavailable, continuing without it: ${error.message}`,
        );
      }
    }

    // Setup health checks
    this.setupHealthChecks();

    // Setup retry policies
    this.setupRetryPolicies();

    // Setup circuit breakers
    this.setupCircuitBreakers();

    this.isInitialized = true;

    if (unavailable.length > 0) {
      this.logger.warn(
        `Cloud services running in degraded mode. Unavailable: ${unavailable.join(', ')}`,
      );
    } else {
      this.logger.info('All cloud services initialized successfully');
    }
  }

  async initializeAWSServices() {
    const awsConfig = {
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    };

    this.awsClients = {
      s3: new S3Client(awsConfig),
      ses: new SESClient(awsConfig),
      sns: new SNSClient(awsConfig),
      sqs: new SQSClient(awsConfig),
      dynamodb: new DynamoDBClient(awsConfig),
    };
  }

  async initializeGoogleCloudServices() {
    const googleConfig = {
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
    };

    this.googleClients = {
      storage: new Storage(googleConfig),
      firestore: new Firestore(googleConfig),
      pubsub: new PubSub(googleConfig),
      monitoring: new MetricServiceClient(googleConfig),
      logging: new Logging(googleConfig),
    };
  }

  async initializeAzureServices() {
    const credential = new DefaultAzureCredential();

    this.azureClients = {
      blob: new BlobServiceClient(
        `https://${process.env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net`,
        credential
      ),
      keyvault: new SecretClient(
        `https://${process.env.AZURE_KEYVAULT_NAME}.vault.azure.net`,
        credential
      ),
      servicebus: new ServiceBusClient(
        process.env.AZURE_SERVICEBUS_CONNECTION_STRING,
        credential
      ),
      cosmos: new CosmosClient({
        endpoint: process.env.AZURE_COSMOS_ENDPOINT,
        key: process.env.AZURE_COSMOS_KEY,
      }),
    };
  }

  async initializeRedis() {
    if (!process.env.REDIS_URL) {
      return;
    }

    // node-redis v4 configures reconnects via `socket.reconnectStrategy`.
    // The old v3 `retry_strategy` key is ignored, so an unreachable Redis
    // retried forever and `await connect()` never settled - which blocked
    // `initialize()` and stopped the server from ever listening.
    this.redis = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          // Returning false stops reconnecting and rejects the connect promise.
          if (retries > 10) return false;
          return Math.min(retries * 200, 5000);
        },
      },
    });

    // Always attach a listener: node-redis emits 'error' before it is ready,
    // and an unhandled 'error' event crashes the process.
    let reported = false;
    this.redis.on('error', (err) => {
      if (reported) return;
      reported = true;
      this.logger.warn(
        `Redis unavailable, continuing without cache: ${err && err.message ? err.message : err}`,
      );
    });

    await this.redis.connect();
  }

  async initializeMongoDB() {
    if (process.env.MONGODB_URI) {
      this.mongodb = new MongoClient(process.env.MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      await this.mongodb.connect();
    }
  }

  setupHealthChecks() {
    // AWS Health Checks
    this.healthChecks.set('aws-s3', () => this.checkS3Health());
    this.healthChecks.set('aws-dynamodb', () => this.checkDynamoDBHealth());
    
    // Google Cloud Health Checks
    this.healthChecks.set('gcp-firestore', () => this.checkFirestoreHealth());
    
    // Azure Health Checks
    this.healthChecks.set('azure-cosmos', () => this.checkCosmosHealth());
    
    // Redis Health Check
    this.healthChecks.set('redis', () => this.checkRedisHealth());
    
    // MongoDB Health Check
    this.healthChecks.set('mongodb', () => this.checkMongoDBHealth());
  }

  setupRetryPolicies() {
    this.retryPolicies.set('default', {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
    });
  }

  setupCircuitBreakers() {
    this.circuitBreakers.set('default', {
      failureThreshold: 5,
      recoveryTimeout: 30000,
      state: 'CLOSED',
      failures: 0,
      lastFailureTime: null,
    });
  }

  // Health check methods
  async checkS3Health() {
    try {
      await this.awsClients.s3.send(new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: 'health-check',
      }));
      return { status: 'healthy', service: 's3' };
    } catch (error) {
      return { status: 'unhealthy', service: 's3', error: error.message };
    }
  }

  async checkDynamoDBHealth() {
    try {
      await this.awsClients.dynamodb.send(new ScanCommand({
        TableName: process.env.AWS_DYNAMODB_TABLE,
        Limit: 1,
      }));
      return { status: 'healthy', service: 'dynamodb' };
    } catch (error) {
      return { status: 'unhealthy', service: 'dynamodb', error: error.message };
    }
  }

  async checkFirestoreHealth() {
    try {
      await this.googleClients.firestore.collection('health').doc('check').get();
      return { status: 'healthy', service: 'firestore' };
    } catch (error) {
      return { status: 'unhealthy', service: 'firestore', error: error.message };
    }
  }

  async checkCosmosHealth() {
    try {
      await this.azureClients.cosmos.database(process.env.AZURE_COSMOS_DATABASE).read();
      return { status: 'healthy', service: 'cosmos' };
    } catch (error) {
      return { status: 'unhealthy', service: 'cosmos', error: error.message };
    }
  }

  async checkRedisHealth() {
    try {
      if (this.redis) {
        await this.redis.ping();
        return { status: 'healthy', service: 'redis' };
      }
      return { status: 'not_configured', service: 'redis' };
    } catch (error) {
      return { status: 'unhealthy', service: 'redis', error: error.message };
    }
  }

  async checkMongoDBHealth() {
    try {
      if (this.mongodb) {
        await this.mongodb.db().admin().ping();
        return { status: 'healthy', service: 'mongodb' };
      }
      return { status: 'not_configured', service: 'mongodb' };
    } catch (error) {
      return { status: 'unhealthy', service: 'mongodb', error: error.message };
    }
  }

  /**
   * True when the given provider connected successfully during initialize().
   * Used to turn optional persistence into a no-op instead of a 500.
   */
  isProviderConnected(name) {
    return this.providerStatus.get(name)?.status === 'connected';
  }

  // Core service methods
  async saveGameState(userId, gameState) {
    const startTime = Date.now();
    try {
      this.metrics.requests++;

      // Game state is a cache/best-effort write: without AWS the game must
      // still be playable, so skip the write instead of failing the request.
      if (!this.isProviderConnected('aws')) {
        this.logger.warn('AWS unavailable, skipping game state persistence');
        return { success: false, degraded: true, userId, gameState };
      }

      // Save to DynamoDB
      await this.awsClients.dynamodb.send(new PutItemCommand({
        TableName: process.env.AWS_DYNAMODB_TABLE,
        Item: {
          playerId: { S: userId },
          gameState: { S: JSON.stringify(gameState) },
          timestamp: { S: new Date().toISOString() },
          ttl: { N: String(Math.floor(Date.now() / 1000) + 86400) }, // 24 hours TTL
        },
      }));

      // Cache in Redis
      if (this.redis) {
        await this.redis.setex(`game_state:${userId}`, 3600, JSON.stringify(gameState));
      }

      this.recordLatency(Date.now() - startTime);
      return { success: true, userId, gameState };
    } catch (error) {
      this.metrics.errors++;
      this.logger.warn('Error saving game state:', error && error.message);
      return { success: false, degraded: true, userId, error: error.message };
    }
  }

  async getGameState(userId) {
    const startTime = Date.now();
    try {
      this.metrics.requests++;

      // Try Redis first
      if (this.redis) {
        const cached = await this.redis.get(`game_state:${userId}`);
        if (cached) {
          this.recordLatency(Date.now() - startTime);
          return JSON.parse(cached);
        }
      }

      // Fallback to DynamoDB
      const result = await this.awsClients.dynamodb.send(new GetItemCommand({
        TableName: process.env.AWS_DYNAMODB_TABLE,
        Key: {
          playerId: { S: userId },
        },
      }));

      if (result.Item) {
        const gameState = JSON.parse(result.Item.gameState.S);
        
        // Cache in Redis
        if (this.redis) {
          await this.redis.setex(`game_state:${userId}`, 3600, JSON.stringify(gameState));
        }

        this.recordLatency(Date.now() - startTime);
        return gameState;
      }

      return null;
    } catch (error) {
      this.metrics.errors++;
      console.error('Error getting game state:', error);
      throw error;
    }
  }

  async savePlayerDataToDynamoDB(tableName, playerData) {
    try {
      if (!this.isProviderConnected('aws')) {
        this.logger.warn('AWS unavailable, skipping player data persistence');
        return { success: false, degraded: true };
      }

      await this.awsClients.dynamodb.send(new PutItemCommand({
        TableName: tableName,
        Item: {
          playerId: { S: playerData.playerId },
          level: { N: String(playerData.level) },
          score: { N: String(playerData.score) },
          gameData: { S: JSON.stringify(playerData.gameData) },
          lastUpdated: { S: new Date().toISOString() },
        },
      }));
      return { success: true };
    } catch (error) {
      this.logger.warn('Error saving player data to DynamoDB:', error && error.message);
      return { success: false, degraded: true, error: error.message };
    }
  }

  async sendGameEventNotification(eventType, userId, eventData) {
    try {
      const message = {
        eventType,
        userId,
        eventData,
        timestamp: new Date().toISOString(),
        messageId: uuidv4(),
      };

      if (!this.isProviderConnected('aws')) {
        this.logger.debug('AWS unavailable, skipping game event notification');
        return { success: false, degraded: true, messageId: message.messageId };
      }

      // Send to SNS
      await this.awsClients.sns.send(new PublishCommand({
        TopicArn: process.env.AWS_SNS_TOPIC_ARN,
        Message: JSON.stringify(message),
        Subject: `Game Event: ${eventType}`,
      }));

      // Send to SQS for processing
      await this.awsClients.sqs.send(new SendMessageCommand({
        QueueUrl: process.env.AWS_SQS_QUEUE_URL,
        MessageBody: JSON.stringify(message),
      }));

      return { success: true, messageId: message.messageId };
    } catch (error) {
      this.logger.warn('Error sending game event notification:', error && error.message);
      return { success: false, degraded: true, error: error.message };
    }
  }

  /**
   * Read a player's progression record.
   *
   * The game routes call this, but it was never implemented, so
   * GET /api/game/progress answered 500 with
   * "cloudServices.getPlayerProgress is not a function".
   */
  async getPlayerProgress(playerId) {
    try {
      if (!this.isProviderConnected('aws')) {
        this.logger.warn('AWS unavailable, returning empty player progress', {
          playerId,
        });
        return null;
      }

      const result = await this.awsClients.dynamodb.send(
        new GetItemCommand({
          TableName: process.env.AWS_DYNAMODB_TABLE,
          Key: { playerId: { S: playerId } },
        }),
      );

      if (!result.Item) return null;

      return {
        playerId,
        level: result.Item.level ? Number(result.Item.level.N) : 1,
        score: result.Item.score ? Number(result.Item.score.N) : 0,
        gameData: result.Item.gameData ? JSON.parse(result.Item.gameData.S) : {},
        lastUpdated: result.Item.lastUpdated ? result.Item.lastUpdated.S : null,
      };
    } catch (error) {
      this.logger.warn('Error getting player progress:', error && error.message);
      return null;
    }
  }

  /**
   * Read a player's achievements. Returns [] when the backing store is
   * unavailable so the endpoint degrades instead of 500-ing.
   */
  async getPlayerAchievements(playerId) {
    try {
      if (!playerId) return [];

      if (!this.isProviderConnected('aws')) {
        this.logger.warn('AWS unavailable, returning no achievements', {
          playerId,
        });
        return [];
      }

      const progress = await this.getPlayerProgress(playerId);
      return (progress && progress.gameData && progress.gameData.achievements) || [];
    } catch (error) {
      this.logger.warn('Error getting player achievements:', error && error.message);
      return [];
    }
  }

  /**
   * Read a leaderboard page. Returns [] when the backing store is
   * unavailable so the endpoint degrades instead of 500-ing.
   */
  async getLeaderboard(type = 'global', limit = 10) {
    try {
      const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

      if (!this.isProviderConnected('aws')) {
        this.logger.warn('AWS unavailable, returning empty leaderboard', {
          type,
          limit: safeLimit,
        });
        return [];
      }

      const result = await this.awsClients.dynamodb.send(
        new ScanCommand({
          TableName: process.env.AWS_DYNAMODB_TABLE,
          Limit: safeLimit,
        }),
      );

      const rows = (result.Items || [])
        .map((item) => ({
          playerId: item.playerId && item.playerId.S,
          level: item.level ? Number(item.level.N) : 1,
          score: item.score ? Number(item.score.N) : 0,
        }))
        .filter((row) => row.playerId)
        .sort((a, b) => b.score - a.score || b.level - a.level)
        .slice(0, safeLimit);

      return rows.map((row, index) => ({ ...row, rank: index + 1, type }));
    } catch (error) {
      this.logger.warn('Error getting leaderboard:', error && error.message);
      return [];
    }
  }

  async uploadAsset(bucketName, key, data, contentType = 'application/octet-stream') {
    try {
      await this.awsClients.s3.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: data,
        ContentType: contentType,
        ACL: 'public-read',
      }));

      return {
        success: true,
        url: `https://${bucketName}.s3.amazonaws.com/${key}`,
      };
    } catch (error) {
      console.error('Error uploading asset:', error);
      throw error;
    }
  }

  async deleteAsset(bucketName, key) {
    try {
      await this.awsClients.s3.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      }));

      return { success: true };
    } catch (error) {
      console.error('Error deleting asset:', error);
      throw error;
    }
  }

  async sendEmail(to, subject, body, isHtml = false) {
    try {
      await this.awsClients.ses.send(new SendEmailCommand({
        Source: process.env.AWS_SES_FROM_EMAIL,
        Destination: {
          ToAddresses: [to],
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8',
          },
          Body: isHtml ? {
            Html: {
              Data: body,
              Charset: 'UTF-8',
            },
          } : {
            Text: {
              Data: body,
              Charset: 'UTF-8',
            },
          },
        },
      }));

      return { success: true };
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  recordLatency(latency) {
    this.metrics.latency.push(latency);
    // Keep only last 1000 measurements
    if (this.metrics.latency.length > 1000) {
      this.metrics.latency = this.metrics.latency.slice(-1000);
    }
  }

  getServiceStatus() {
    return {
      initialized: this.isInitialized,
      metrics: {
        ...this.metrics,
        averageLatency: this.metrics.latency.length > 0 
          ? this.metrics.latency.reduce((a, b) => a + b, 0) / this.metrics.latency.length 
          : 0,
        errorRate: this.metrics.requests > 0 
          ? (this.metrics.errors / this.metrics.requests) * 100 
          : 0,
      },
      services: {
        aws: this.providerStatus.get('aws')?.status ?? 'not_configured',
        google: this.providerStatus.get('google')?.status ?? 'not_configured',
        azure: this.providerStatus.get('azure')?.status ?? 'not_configured',
        redis: this.providerStatus.get('redis')?.status ?? 'not_configured',
        mongodb: this.providerStatus.get('mongodb')?.status ?? 'not_configured',
      },
    };
  }

  async getHealthStatus() {
    const healthChecks = await Promise.allSettled(
      Array.from(this.healthChecks.entries()).map(async ([name, check]) => {
        const result = await check();
        return { name, ...result };
      })
    );

    const results = healthChecks.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        const name = Array.from(this.healthChecks.keys())[index];
        return { name, status: 'error', error: result.reason.message };
      }
    });

    return {
      overall: results.every(r => r.status === 'healthy' || r.status === 'not_configured') ? 'healthy' : 'unhealthy',
      services: results,
      timestamp: new Date().toISOString(),
    };
  }

  async shutdown() {
    try {
      if (this.redis) {
        await this.redis.quit();
      }
      if (this.mongodb) {
        await this.mongodb.close();
      }
      this.logger.info('Cloud services shutdown completed');
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
  }
}

export default new OptimizedCloudServicesManager();