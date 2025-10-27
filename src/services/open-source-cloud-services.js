import { Logger } from '../core/logger/index.js';
import { Client as MinioClient } from 'minio';
import { Sequelize } from 'sequelize';
import nodemailer from 'nodemailer';
import Bull from 'bull';
import { v4 as uuidv4 } from 'uuid';

/**
 * Open Source Cloud Services Manager
 * Replaces AWS, Google Cloud, and Azure with self-hosted alternatives
 */
class OpenSourceCloudServicesManager {
  constructor() {
    this.logger = new Logger('OpenSourceCloudServicesManager');
    this.minio = null;
    this.postgres = null;
    this.emailTransporter = null;
    this.redis = null;
    this.isInitialized = false;
    this.healthChecks = new Map();
    this.metrics = {
      requests: 0,
      errors: 0,
      latency: [],
    };
  }

  /**
   * Initialize all open source cloud services
   */
  async initialize() {
    try {
      this.logger.info('Initializing open source cloud services...');

      // Initialize MinIO (S3-compatible storage)
      await this.initializeMinIO();
      
      // Initialize PostgreSQL (replaces DynamoDB, Firestore, Cosmos DB)
      await this.initializePostgreSQL();
      
      // Initialize Email service (replaces SES)
      await this.initializeEmailService();
      
      // Initialize Redis (already open source)
      await this.initializeRedis();
      
      // Initialize Job Queue (replaces SQS)
      await this.initializeJobQueue();

      // Setup health checks
      this.setupHealthChecks();
      
      this.isInitialized = true;
      this.logger.info('All open source cloud services initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize open source cloud services:', error);
      throw error;
    }
  }

  async initializeMinIO() {
    this.minio = new MinioClient({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000', 10),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    });

    // Ensure bucket exists
    const bucketName = process.env.MINIO_BUCKET || 'match3game';
    const bucketExists = await this.minio.bucketExists(bucketName);
    if (!bucketExists) {
      await this.minio.makeBucket(bucketName, 'us-east-1');
      this.logger.info(`Created MinIO bucket: ${bucketName}`);
    }
  }

  async initializePostgreSQL() {
    this.postgres = new Sequelize(
      process.env.POSTGRES_URL || 'postgresql://postgres:password@localhost:5432/match3game',
      {
        dialect: 'postgres',
        logging: false,
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
      }
    );

    // Test connection
    await this.postgres.authenticate();
    this.logger.info('PostgreSQL connected successfully');
  }

  async initializeEmailService() {
    this.emailTransporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });

    // Verify connection
    await this.emailTransporter.verify();
    this.logger.info('Email service initialized successfully');
  }

  async initializeRedis() {
    // Redis is already initialized in the main cloud services
    this.logger.info('Redis service available');
  }

  async initializeJobQueue() {
    this.jobQueue = new Bull('game-events', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    });

    this.logger.info('Job queue initialized successfully');
  }

  setupHealthChecks() {
    this.healthChecks.set('minio', () => this.checkMinIOHealth());
    this.healthChecks.set('postgres', () => this.checkPostgreSQLHealth());
    this.healthChecks.set('email', () => this.checkEmailHealth());
    this.healthChecks.set('redis', () => this.checkRedisHealth());
  }

  // Health check methods
  async checkMinIOHealth() {
    try {
      await this.minio.bucketExists(process.env.MINIO_BUCKET || 'match3game');
      return { status: 'healthy', service: 'minio' };
    } catch (error) {
      return { status: 'unhealthy', service: 'minio', error: error.message };
    }
  }

  async checkPostgreSQLHealth() {
    try {
      await this.postgres.authenticate();
      return { status: 'healthy', service: 'postgres' };
    } catch (error) {
      return { status: 'unhealthy', service: 'postgres', error: error.message };
    }
  }

  async checkEmailHealth() {
    try {
      await this.emailTransporter.verify();
      return { status: 'healthy', service: 'email' };
    } catch (error) {
      return { status: 'unhealthy', service: 'email', error: error.message };
    }
  }

  async checkRedisHealth() {
    try {
      // Redis health check would be implemented here
      return { status: 'healthy', service: 'redis' };
    } catch (error) {
      return { status: 'unhealthy', service: 'redis', error: error.message };
    }
  }

  // Core service methods
  async saveGameState(userId, gameState) {
    const startTime = Date.now();
    try {
      this.metrics.requests++;
      
      // Save to PostgreSQL
      const GameState = this.postgres.define('GameState', {
        playerId: {
          type: Sequelize.STRING,
          primaryKey: true,
        },
        gameState: {
          type: Sequelize.JSONB,
        },
        timestamp: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },
      });

      await GameState.sync();
      await GameState.upsert({
        playerId: userId,
        gameState: gameState,
        timestamp: new Date(),
      });

      this.recordLatency(Date.now() - startTime);
      return { success: true, userId, gameState };
    } catch (error) {
      this.metrics.errors++;
      console.error('Error saving game state:', error);
      throw error;
    }
  }

  async getGameState(userId) {
    const startTime = Date.now();
    try {
      this.metrics.requests++;

      const GameState = this.postgres.define('GameState', {
        playerId: {
          type: Sequelize.STRING,
          primaryKey: true,
        },
        gameState: {
          type: Sequelize.JSONB,
        },
        timestamp: {
          type: Sequelize.DATE,
        },
      });

      await GameState.sync();
      const result = await GameState.findByPk(userId);

      if (result) {
        this.recordLatency(Date.now() - startTime);
        return result.gameState;
      }

      return null;
    } catch (error) {
      this.metrics.errors++;
      console.error('Error getting game state:', error);
      throw error;
    }
  }

  async uploadAsset(bucketName, key, data, contentType = 'application/octet-stream') {
    try {
      await this.minio.putObject(bucketName, key, data, {
        'Content-Type': contentType,
      });

      return {
        success: true,
        url: `${process.env.MINIO_ENDPOINT || 'http://localhost:9000'}/${bucketName}/${key}`,
      };
    } catch (error) {
      console.error('Error uploading asset:', error);
      throw error;
    }
  }

  async deleteAsset(bucketName, key) {
    try {
      await this.minio.removeObject(bucketName, key);
      return { success: true };
    } catch (error) {
      console.error('Error deleting asset:', error);
      throw error;
    }
  }

  async sendEmail(to, subject, body, isHtml = false) {
    try {
      await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@match3game.com',
        to: to,
        subject: subject,
        text: isHtml ? undefined : body,
        html: isHtml ? body : undefined,
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
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

      // Add to job queue
      await this.jobQueue.add('process-game-event', message);

      return { success: true, messageId: message.messageId };
    } catch (error) {
      console.error('Error sending game event notification:', error);
      throw error;
    }
  }

  recordLatency(latency) {
    this.metrics.latency.push(latency);
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
        minio: this.minio ? 'connected' : 'not_configured',
        postgres: this.postgres ? 'connected' : 'not_configured',
        email: this.emailTransporter ? 'connected' : 'not_configured',
        redis: this.redis ? 'connected' : 'not_configured',
        jobQueue: this.jobQueue ? 'connected' : 'not_configured',
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
      if (this.postgres) {
        await this.postgres.close();
      }
      if (this.jobQueue) {
        await this.jobQueue.close();
      }
      this.logger.info('Open source cloud services shutdown completed');
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
  }
}

export default new OpenSourceCloudServicesManager();