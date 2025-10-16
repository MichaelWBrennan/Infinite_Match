import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
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
import { MonitoringServiceV2Client } from '@google-cloud/monitoring';
import { LoggingServiceV2Client } from '@google-cloud/logging';
import { BlobServiceClient } from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import { ServiceBusClient } from '@azure/service-bus';
import { CosmosClient } from '@azure/cosmos';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from 'redis';
import { MongoClient } from 'mongodb';

/**
 * Enhanced Cloud Services Manager for Match 3 Game
 * Integrates AWS, Google Cloud, Azure, Redis, and MongoDB with advanced features
 */
class EnhancedCloudServicesManager {
  constructor() {
    this.awsClients = {};
    this.googleClients = {};
    this.azureClients = {};
    this.redis = null;
    this.mongodb = null;
    this.isInitialized = false;
    this.healthChecks = new Map();
    this.retryPolicies = new Map();
    this.circuitBreakers = new Map();

    // Configuration
    this.config = {
      enableAWS: process.env.AWS_ACCESS_KEY_ID ? true : false,
      enableGoogleCloud: process.env.GOOGLE_CLOUD_PROJECT_ID ? true : false,
      enableAzure: process.env.AZURE_STORAGE_ACCOUNT ? true : false,
      enableRedis: process.env.REDIS_URL ? true : false,
      enableMongoDB: process.env.MONGODB_URI ? true : false,
      enableCircuitBreaker: true,
      enableRetryPolicy: true,
      enableHealthChecks: true,
    };
  }

  /**
   * Initialize all cloud services
   */
  async initialize() {
    try {
      console.log('☁️ Initializing Enhanced Cloud Services...');

      // Initialize AWS services
      if (this.config.enableAWS) {
        await this.initializeAWS();
      }

      // Initialize Google Cloud services
      if (this.config.enableGoogleCloud) {
        await this.initializeGoogleCloud();
      }

      // Initialize Azure services
      if (this.config.enableAzure) {
        await this.initializeAzure();
      }

      // Initialize Redis
      if (this.config.enableRedis) {
        await this.initializeRedis();
      }

      // Initialize MongoDB
      if (this.config.enableMongoDB) {
        await this.initializeMongoDB();
      }

      // Initialize circuit breakers
      if (this.config.enableCircuitBreaker) {
        this.initializeCircuitBreakers();
      }

      // Initialize retry policies
      if (this.config.enableRetryPolicy) {
        this.initializeRetryPolicies();
      }

      // Initialize health checks
      if (this.config.enableHealthChecks) {
        await this.initializeHealthChecks();
      }

      this.isInitialized = true;
      console.log('✅ Enhanced Cloud Services initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced Cloud Services:', error);
      throw error;
    }
  }

  /**
   * Initialize AWS services
   */
  async initializeAWS() {
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

    console.log('✅ AWS services initialized');
  }

  /**
   * Initialize Google Cloud services
   */
  async initializeGoogleCloud() {
    const googleConfig = {
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
    };

    this.googleClients = {
      storage: new Storage(googleConfig),
      firestore: new Firestore(googleConfig),
      pubsub: new PubSub(googleConfig),
      monitoring: new MonitoringServiceV2Client(googleConfig),
      logging: new LoggingServiceV2Client(googleConfig),
    };

    console.log('✅ Google Cloud services initialized');
  }

  /**
   * Initialize Azure services
   */
  async initializeAzure() {
    const credential = new DefaultAzureCredential();

    this.azureClients = {
      blobStorage: new BlobServiceClient(
        `https://${process.env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net`,
        credential,
      ),
      keyVault: new SecretClient(
        `https://${process.env.AZURE_KEY_VAULT_NAME}.vault.azure.net`,
        credential,
      ),
      serviceBus: new ServiceBusClient(process.env.AZURE_SERVICE_BUS_CONNECTION_STRING),
      cosmos: new CosmosClient({
        endpoint: process.env.AZURE_COSMOS_ENDPOINT,
        key: process.env.AZURE_COSMOS_KEY,
      }),
    };

    console.log('✅ Azure services initialized');
  }

  /**
   * Initialize Redis
   */
  async initializeRedis() {
    this.redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    this.redis.on('error', (err) => console.error('Redis Client Error', err));
    await this.redis.connect();
    console.log('✅ Redis initialized');
  }

  /**
   * Initialize MongoDB
   */
  async initializeMongoDB() {
    this.mongodb = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
    await this.mongodb.connect();
    console.log('✅ MongoDB initialized');
  }

  /**
   * Initialize circuit breakers
   */
  initializeCircuitBreakers() {
    const services = ['aws', 'google', 'azure', 'redis', 'mongodb'];

    services.forEach((service) => {
      this.circuitBreakers.set(service, {
        state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
        failureCount: 0,
        lastFailureTime: null,
        threshold: 5,
        timeout: 60000, // 1 minute
      });
    });
  }

  /**
   * Initialize retry policies
   */
  initializeRetryPolicies() {
    this.retryPolicies.set('default', {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
    });
  }

  /**
   * Initialize health checks
   */
  async initializeHealthChecks() {
    const services = [
      { name: 'aws', check: () => this.checkAWSHealth() },
      { name: 'google', check: () => this.checkGoogleHealth() },
      { name: 'azure', check: () => this.checkAzureHealth() },
      { name: 'redis', check: () => this.checkRedisHealth() },
      { name: 'mongodb', check: () => this.checkMongoDBHealth() },
    ];

    services.forEach((service) => {
      this.healthChecks.set(service.name, {
        status: 'unknown',
        lastCheck: null,
        checkFunction: service.check,
      });
    });

    // Run initial health checks
    await this.runHealthChecks();
  }

  /**
   * Check AWS health
   */
  async checkAWSHealth() {
    try {
      if (this.awsClients.s3) {
        await this.awsClients.s3.send(
          new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET || 'test-bucket',
            Key: 'health-check',
          }),
        );
      }
      return { status: 'healthy', latency: Date.now() };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  /**
   * Check Google Cloud health
   */
  async checkGoogleHealth() {
    try {
      if (this.googleClients.storage) {
        const [buckets] = await this.googleClients.storage.getBuckets();
        return { status: 'healthy', latency: Date.now() };
      }
      return { status: 'healthy', latency: Date.now() };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  /**
   * Check Azure health
   */
  async checkAzureHealth() {
    try {
      if (this.azureClients.blobStorage) {
        const containerClient = this.azureClients.blobStorage.getContainerClient(
          process.env.AZURE_CONTAINER_NAME || 'test-container',
        );
        await containerClient.exists();
      }
      return { status: 'healthy', latency: Date.now() };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  /**
   * Check Redis health
   */
  async checkRedisHealth() {
    try {
      if (this.redis) {
        await this.redis.ping();
      }
      return { status: 'healthy', latency: Date.now() };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  /**
   * Check MongoDB health
   */
  async checkMongoDBHealth() {
    try {
      if (this.mongodb) {
        await this.mongodb.db('admin').command({ ping: 1 });
      }
      return { status: 'healthy', latency: Date.now() };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  /**
   * Run all health checks
   */
  async runHealthChecks() {
    for (const [serviceName, healthCheck] of this.healthChecks) {
      try {
        const result = await healthCheck.checkFunction();
        healthCheck.status = result.status;
        healthCheck.lastCheck = new Date();
        healthCheck.latency = result.latency;
        healthCheck.error = result.error;
      } catch (error) {
        healthCheck.status = 'unhealthy';
        healthCheck.lastCheck = new Date();
        healthCheck.error = error.message;
      }
    }
  }

  /**
   * Save game state with multi-cloud redundancy
   */
  async saveGameState(playerId, gameState) {
    const timestamp = new Date().toISOString();
    const gameData = {
      playerId,
      gameState,
      timestamp,
      version: process.env.GAME_VERSION || '1.0.0',
    };

    const promises = [];

    // AWS S3
    if (this.awsClients.s3 && this.circuitBreakers.get('aws').state !== 'OPEN') {
      promises.push(
        this.saveGameDataToS3(
          process.env.AWS_S3_BUCKET,
          `game-states/${playerId}/${timestamp}.json`,
          gameData,
        ).catch((error) => {
          console.error('AWS S3 save failed:', error);
          this.updateCircuitBreaker('aws', false);
        }),
      );
    }

    // Google Cloud Storage
    if (this.googleClients.storage && this.circuitBreakers.get('google').state !== 'OPEN') {
      promises.push(
        this.saveGameDataToGCS(
          process.env.GOOGLE_CLOUD_BUCKET,
          `game-states/${playerId}/${timestamp}.json`,
          gameData,
        ).catch((error) => {
          console.error('Google Cloud Storage save failed:', error);
          this.updateCircuitBreaker('google', false);
        }),
      );
    }

    // Azure Blob Storage
    if (this.azureClients.blobStorage && this.circuitBreakers.get('azure').state !== 'OPEN') {
      promises.push(
        this.saveGameDataToAzureBlob(
          process.env.AZURE_CONTAINER_NAME,
          `game-states/${playerId}/${timestamp}.json`,
          gameData,
        ).catch((error) => {
          console.error('Azure Blob Storage save failed:', error);
          this.updateCircuitBreaker('azure', false);
        }),
      );
    }

    // Redis cache
    if (this.redis && this.circuitBreakers.get('redis').state !== 'OPEN') {
      promises.push(
        this.redis
          .setex(
            `game-state:${playerId}`,
            3600, // 1 hour TTL
            JSON.stringify(gameData),
          )
          .catch((error) => {
            console.error('Redis save failed:', error);
            this.updateCircuitBreaker('redis', false);
          }),
      );
    }

    // MongoDB
    if (this.mongodb && this.circuitBreakers.get('mongodb').state !== 'OPEN') {
      promises.push(
        this.saveGameDataToMongoDB(playerId, gameData).catch((error) => {
          console.error('MongoDB save failed:', error);
          this.updateCircuitBreaker('mongodb', false);
        }),
      );
    }

    const results = await Promise.allSettled(promises);
    const successful = results.filter((r) => r.status === 'fulfilled').length;

    console.log(`💾 Game state saved: ${successful}/${promises.length} services successful`);

    if (successful === 0) {
      throw new Error('All cloud services failed');
    }

    return { success: true, servicesUsed: successful };
  }

  /**
   * Load game state with fallback strategy
   */
  async loadGameState(playerId) {
    // Try Redis first (fastest)
    if (this.redis && this.circuitBreakers.get('redis').state !== 'OPEN') {
      try {
        const cached = await this.redis.get(`game-state:${playerId}`);
        if (cached) {
          console.log('📱 Game state loaded from Redis cache');
          return JSON.parse(cached);
        }
      } catch (error) {
        console.error('Redis load failed:', error);
        this.updateCircuitBreaker('redis', false);
      }
    }

    // Try MongoDB (fast)
    if (this.mongodb && this.circuitBreakers.get('mongodb').state !== 'OPEN') {
      try {
        const db = this.mongodb.db('match3_analytics');
        const gameState = await db
          .collection('game_states')
          .findOne({ playerId }, { sort: { timestamp: -1 } });

        if (gameState) {
          console.log('📱 Game state loaded from MongoDB');
          return gameState;
        }
      } catch (error) {
        console.error('MongoDB load failed:', error);
        this.updateCircuitBreaker('mongodb', false);
      }
    }

    // Try cloud storage services
    const cloudServices = [
      {
        name: 'aws',
        load: () =>
          this.loadGameDataFromS3(process.env.AWS_S3_BUCKET, `game-states/${playerId}/latest.json`),
      },
      {
        name: 'google',
        load: () =>
          this.loadGameDataFromGCS(
            process.env.GOOGLE_CLOUD_BUCKET,
            `game-states/${playerId}/latest.json`,
          ),
      },
      {
        name: 'azure',
        load: () =>
          this.loadGameDataFromAzureBlob(
            process.env.AZURE_CONTAINER_NAME,
            `game-states/${playerId}/latest.json`,
          ),
      },
    ];

    for (const service of cloudServices) {
      if (this.circuitBreakers.get(service.name).state !== 'OPEN') {
        try {
          const gameState = await service.load();
          console.log(`📱 Game state loaded from ${service.name}`);
          return gameState;
        } catch (error) {
          console.error(`${service.name} load failed:`, error);
          this.updateCircuitBreaker(service.name, false);
        }
      }
    }

    throw new Error('All services failed to load game state');
  }

  /**
   * Update circuit breaker state
   */
  updateCircuitBreaker(service, success) {
    const breaker = this.circuitBreakers.get(service);

    if (success) {
      breaker.failureCount = 0;
      breaker.state = 'CLOSED';
    } else {
      breaker.failureCount++;
      breaker.lastFailureTime = Date.now();

      if (breaker.failureCount >= breaker.threshold) {
        breaker.state = 'OPEN';
        console.warn(`⚠️ Circuit breaker OPEN for ${service}`);
      }
    }
  }

  /**
   * AWS S3 operations
   */
  async saveGameDataToS3(bucketName, key, data) {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: JSON.stringify(data),
      ContentType: 'application/json',
      Metadata: {
        'game-version': process.env.GAME_VERSION || '1.0.0',
        timestamp: new Date().toISOString(),
      },
    });

    const result = await this.awsClients.s3.send(command);
    console.log(`💾 Game data saved to S3: ${key}`);
    return result;
  }

  async loadGameDataFromS3(bucketName, key) {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const result = await this.awsClients.s3.send(command);
    const data = await result.Body.transformToString();
    return JSON.parse(data);
  }

  /**
   * Google Cloud Storage operations
   */
  async saveGameDataToGCS(bucketName, fileName, data) {
    const bucket = this.googleClients.storage.bucket(bucketName);
    const file = bucket.file(fileName);

    await file.save(JSON.stringify(data), {
      metadata: {
        contentType: 'application/json',
        metadata: {
          'game-version': process.env.GAME_VERSION || '1.0.0',
          timestamp: new Date().toISOString(),
        },
      },
    });

    console.log(`💾 Game data saved to GCS: ${fileName}`);
  }

  async loadGameDataFromGCS(bucketName, fileName) {
    const bucket = this.googleClients.storage.bucket(bucketName);
    const file = bucket.file(fileName);
    const [data] = await file.download();
    return JSON.parse(data.toString());
  }

  /**
   * Azure Blob Storage operations
   */
  async saveGameDataToAzureBlob(containerName, blobName, data) {
    const containerClient = this.azureClients.blobStorage.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const uploadOptions = {
      blobHTTPHeaders: {
        blobContentType: 'application/json',
      },
      metadata: {
        'game-version': process.env.GAME_VERSION || '1.0.0',
        timestamp: new Date().toISOString(),
      },
    };

    await blockBlobClient.upload(JSON.stringify(data), JSON.stringify(data).length, uploadOptions);
    console.log(`💾 Game data saved to Azure Blob: ${blobName}`);
  }

  async loadGameDataFromAzureBlob(containerName, blobName) {
    const containerClient = this.azureClients.blobStorage.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const downloadResponse = await blockBlobClient.download();
    const data = await this.streamToString(downloadResponse.readableStreamBody);
    return JSON.parse(data);
  }

  /**
   * MongoDB operations
   */
  async saveGameDataToMongoDB(playerId, gameData) {
    const db = this.mongodb.db('match3_analytics');
    await db.collection('game_states').replaceOne({ playerId }, gameData, { upsert: true });
    console.log(`💾 Game data saved to MongoDB: ${playerId}`);
  }

  /**
   * Utility methods
   */
  async streamToString(readableStream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      readableStream.on('data', (data) => {
        chunks.push(data.toString());
      });
      readableStream.on('end', () => {
        resolve(chunks.join(''));
      });
      readableStream.on('error', reject);
    });
  }

  /**
   * Get service status
   */
  getServiceStatus() {
    return {
      is_initialized: this.isInitialized,
      health_checks: Object.fromEntries(this.healthChecks),
      circuit_breakers: Object.fromEntries(this.circuitBreakers),
      services: {
        aws: this.config.enableAWS,
        google: this.config.enableGoogleCloud,
        azure: this.config.enableAzure,
        redis: this.config.enableRedis,
        mongodb: this.config.enableMongoDB,
      },
    };
  }

  /**
   * Shutdown all services
   */
  async shutdown() {
    try {
      if (this.redis) {
        await this.redis.quit();
      }

      if (this.mongodb) {
        await this.mongodb.close();
      }

      console.log('✅ Enhanced Cloud Services shutdown complete');
    } catch (error) {
      console.error('Error during cloud services shutdown:', error);
    }
  }
}

// Export singleton instance
export default new EnhancedCloudServicesManager();
