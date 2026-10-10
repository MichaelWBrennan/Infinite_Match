import { Logger } from '../core/logger/index.js';
import { Client as MinioClient } from 'minio';
import { Sequelize } from 'sequelize';
import nodemailer from 'nodemailer';
import { Queue } from 'bullmq';
import { randomUUID as uuidv4 } from 'node:crypto';

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
    // Per-backend start-up outcome, separate from `healthChecks` which holds
    // live probe functions used by getHealthStatus().
    this.serviceStatus = new Map();
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
    this.logger.info('Initializing open source cloud services...');

    // Every backend here is optional infrastructure. Previously the first
    // unreachable service aborted start-up (and the server exited), so a
    // missing MinIO/Postgres/SMTP took the whole game offline. Now each one is
    // attempted independently and a failure degrades that feature only.
    const backends = [
      ['minio', () => this.initializeMinIO()],
      ['postgres', () => this.initializePostgreSQL()],
      ['email', () => this.initializeEmailService()],
      ['redis', () => this.initializeRedis()],
      ['jobQueue', () => this.initializeJobQueue()],
    ];

    const unavailable = [];

    for (const [name, init] of backends) {
      try {
        await init();
        this.serviceStatus.set(name, { status: 'connected' });
      } catch (error) {
        this.serviceStatus.set(name, { status: 'unavailable', error: error.message });
        unavailable.push(name);
        this.logger.warn(
          `Optional service '${name}' is unavailable, continuing without it: ${error.message}`,
        );
      }
    }

    // Setup health checks
    this.setupHealthChecks();

    this.isInitialized = true;

    if (unavailable.length > 0) {
      this.logger.warn(
        `Open source cloud services running in degraded mode. Unavailable: ${unavailable.join(', ')}`,
      );
    } else {
      this.logger.info('All open source cloud services initialized successfully');
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
    this.emailTransporter = nodemailer.createTransport({
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
    // Optional cache/queue backend. Works with Redis or Valkey (BSD-3) —
    // both speak the same protocol. Unreachable servers are skipped here so
    // the game stays up without cache.
    const { default: Redis } = await import('ioredis');
    const client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      lazyConnect: false,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
      enableOfflineQueue: false,
    });
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Redis connect timeout')), 5000);
      client.once('ready', () => {
        clearTimeout(timer);
        resolve();
      });
      client.once('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
    this.redis = client;
    this.logger.info('Redis/Valkey connected successfully');
  }

  async initializeJobQueue() {
    // BullMQ (MIT) is the maintained successor of Bull. Works with Redis or
    // Valkey. Fails fast here when the broker is unreachable so the service
    // degrades instead of queueing into the void.
    this.jobQueue = new Queue('game-events', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        maxRetriesPerRequest: 1,
        retryStrategy: () => null,
      },
    });
    // Force a connection attempt now so an unreachable broker surfaces here
    // (and disables the queue) rather than on the first event.
    await this.jobQueue.waitUntilReady();

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
    // The previous try/catch was unreachable: the try only ever returned a
    // literal. Report whether a client was actually established instead.
    if (!this.redis) {
      return { status: 'not_configured', service: 'redis' };
    }
    try {
      await this.redis.ping();
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

      // Game state is a best-effort write: without Postgres the game must
      // stay playable, so degrade instead of failing the request.
      if (!this.postgres) {
        this.logger.warn('PostgreSQL unavailable, skipping game state persistence');
        return { success: false, degraded: true, userId, gameState };
      }

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
      this.logger.warn('Error saving game state:', error && error.message);
      return { success: false, degraded: true, userId, error: error.message };
    }
  }

  async getGameState(userId) {
    const startTime = Date.now();
    try {
      this.metrics.requests++;

      if (!this.postgres) {
        this.logger.warn('PostgreSQL unavailable, cannot read game state');
        return null;
      }

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
      this.logger.warn('Error getting game state:', error && error.message);
      return null;
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

      // Add to job queue (Redis/Valkey-backed). Skip when the queue is down:
      // gameplay must not depend on the event pipeline.
      if (!this.jobQueue) {
        this.logger.debug('Job queue unavailable, skipping game event notification');
        return { success: false, degraded: true, messageId: message.messageId };
      }
      await this.jobQueue.add('process-game-event', message);

      return { success: true, messageId: message.messageId };
    } catch (error) {
      this.logger.warn('Error sending game event notification:', error && error.message);
      return { success: false, degraded: true, error: error.message };
    }
  }

  /**
   * Create the `player_data` table on first use (idempotent).
   */
  async ensurePlayerDataTable() {
    await this.postgres.query(`
      CREATE TABLE IF NOT EXISTS player_data (
        player_id   TEXT PRIMARY KEY,
        level       INTEGER NOT NULL DEFAULT 1,
        score       BIGINT NOT NULL DEFAULT 0,
        game_data   JSONB NOT NULL DEFAULT '{}'::jsonb,
        last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
  }

  /**
   * Persist a player's progression record.
   *
   * The legacy name is kept because the game routes call it; the backing
   * store is PostgreSQL (not DynamoDB).
   */
  async savePlayerDataToDynamoDB(tableName, playerData) {
    try {
      if (!this.postgres) {
        this.logger.warn('PostgreSQL unavailable, skipping player data persistence');
        return { success: false, degraded: true };
      }

      await this.ensurePlayerDataTable();
      await this.postgres.query(
        `INSERT INTO player_data (player_id, level, score, game_data, last_updated)
         VALUES (:playerId, :level, :score, :gameData, now())
         ON CONFLICT (player_id) DO UPDATE SET
           level = EXCLUDED.level,
           score = EXCLUDED.score,
           game_data = EXCLUDED.game_data,
           last_updated = now()`,
        {
          replacements: {
            playerId: playerData.playerId,
            level: Number(playerData.level) || 1,
            score: Number(playerData.score) || 0,
            gameData: JSON.stringify(playerData.gameData || {}),
          },
        },
      );
      return { success: true };
    } catch (error) {
      this.logger.warn('Error saving player data:', error && error.message);
      return { success: false, degraded: true, error: error.message };
    }
  }

  /**
   * Read a player's progression record. Returns null when the store is
   * unavailable so GET /api/game/progress degrades instead of 500-ing.
   */
  async getPlayerProgress(playerId) {
    try {
      if (!this.postgres) {
        this.logger.warn('PostgreSQL unavailable, returning empty player progress', { playerId });
        return null;
      }

      await this.ensurePlayerDataTable();
      const [rows] = await this.postgres.query(
        `SELECT player_id, level, score, game_data, last_updated
         FROM player_data WHERE player_id = :playerId`,
        { replacements: { playerId } },
      );

      if (!rows.length) return null;

      const row = rows[0];
      return {
        playerId: row.player_id,
        level: Number(row.level) || 1,
        score: Number(row.score) || 0,
        gameData: row.game_data || {},
        lastUpdated: row.last_updated ? new Date(row.last_updated).toISOString() : null,
      };
    } catch (error) {
      this.logger.warn('Error getting player progress:', error && error.message);
      return null;
    }
  }

  /**
   * Read a player's achievements. Returns [] when the store is unavailable.
   */
  async getPlayerAchievements(playerId) {
    try {
      if (!playerId) return [];
      const progress = await this.getPlayerProgress(playerId);
      return (progress && progress.gameData && progress.gameData.achievements) || [];
    } catch (error) {
      this.logger.warn('Error getting player achievements:', error && error.message);
      return [];
    }
  }

  /**
   * Read a leaderboard page. Returns [] when the store is unavailable.
   */
  async getLeaderboard(type = 'global', limit = 10) {
    try {
      const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

      if (!this.postgres) {
        this.logger.warn('PostgreSQL unavailable, returning empty leaderboard', { type, limit: safeLimit });
        return [];
      }

      await this.ensurePlayerDataTable();
      const [rows] = await this.postgres.query(
        `SELECT player_id, level, score
         FROM player_data
         ORDER BY score DESC, level DESC
         LIMIT :limit`,
        { replacements: { limit: safeLimit } },
      );

      return rows.map((row, index) => ({
        playerId: row.player_id,
        level: Number(row.level) || 1,
        score: Number(row.score) || 0,
        rank: index + 1,
        type,
      }));
    } catch (error) {
      this.logger.warn('Error getting leaderboard:', error && error.message);
      return [];
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
        minio: this.serviceStatus.get('minio')?.status ?? 'not_configured',
        postgres: this.serviceStatus.get('postgres')?.status ?? 'not_configured',
        email: this.serviceStatus.get('email')?.status ?? 'not_configured',
        redis: this.serviceStatus.get('redis')?.status ?? 'not_configured',
        jobQueue: this.serviceStatus.get('jobQueue')?.status ?? 'not_configured',
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