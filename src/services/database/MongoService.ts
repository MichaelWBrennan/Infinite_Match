import mongoose from 'mongoose';
import { Logger } from '../../core/logger/index.js';

const logger = new Logger('MongoService');

export class MongoService {
  private connection: mongoose.Connection | null = null;

  constructor() {
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connected successfully');
    });

    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  async connect(): Promise<boolean> {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/evergreen-match3';

      await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
        bufferMaxEntries: 0,
      });

      this.connection = mongoose.connection;
      logger.info('MongoDB connected successfully');
      return true;
    } catch (error) {
      logger.error('MongoDB connection failed', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        this.connection = null;
        logger.info('MongoDB disconnected');
      }
    } catch (error) {
      logger.error('MongoDB disconnect error', error);
    }
  }

  // Game Analytics Collection
  async saveGameAnalytics(analytics: any): Promise<boolean> {
    try {
      const collection = this.connection?.db.collection('game_analytics');
      if (!collection) {
        throw new Error('MongoDB not connected');
      }

      await collection.insertOne({
        ...analytics,
        timestamp: new Date(),
        createdAt: new Date(),
      });

      logger.info('Game analytics saved', { playerId: analytics.playerId });
      return true;
    } catch (error) {
      logger.error('Failed to save game analytics', error);
      return false;
    }
  }

  async getGameAnalytics(playerId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    try {
      const collection = this.connection?.db.collection('game_analytics');
      if (!collection) {
        throw new Error('MongoDB not connected');
      }

      const query: any = { playerId };
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = startDate;
        if (endDate) query.timestamp.$lte = endDate;
      }

      const analytics = await collection.find(query).sort({ timestamp: -1 }).toArray();
      return analytics;
    } catch (error) {
      logger.error('Failed to get game analytics', error);
      return [];
    }
  }

  // Player Behavior Collection
  async savePlayerBehavior(behavior: any): Promise<boolean> {
    try {
      const collection = this.connection?.db.collection('player_behavior');
      if (!collection) {
        throw new Error('MongoDB not connected');
      }

      await collection.updateOne(
        { playerId: behavior.playerId },
        { $set: { ...behavior, updatedAt: new Date() } },
        { upsert: true },
      );

      logger.info('Player behavior saved', { playerId: behavior.playerId });
      return true;
    } catch (error) {
      logger.error('Failed to save player behavior', error);
      return false;
    }
  }

  async getPlayerBehavior(playerId: string): Promise<any | null> {
    try {
      const collection = this.connection?.db.collection('player_behavior');
      if (!collection) {
        throw new Error('MongoDB not connected');
      }

      const behavior = await collection.findOne({ playerId });
      return behavior;
    } catch (error) {
      logger.error('Failed to get player behavior', error);
      return null;
    }
  }

  // Game Events Collection
  async saveGameEvent(event: any): Promise<boolean> {
    try {
      const collection = this.connection?.db.collection('game_events');
      if (!collection) {
        throw new Error('MongoDB not connected');
      }

      await collection.insertOne({
        ...event,
        timestamp: new Date(),
        createdAt: new Date(),
      });

      logger.info('Game event saved', { eventType: event.type, playerId: event.playerId });
      return true;
    } catch (error) {
      logger.error('Failed to save game event', error);
      return false;
    }
  }

  async getGameEvents(playerId: string, eventType?: string, limit = 100): Promise<any[]> {
    try {
      const collection = this.connection?.db.collection('game_events');
      if (!collection) {
        throw new Error('MongoDB not connected');
      }

      const query: any = { playerId };
      if (eventType) query.type = eventType;

      const events = await collection.find(query).sort({ timestamp: -1 }).limit(limit).toArray();

      return events;
    } catch (error) {
      logger.error('Failed to get game events', error);
      return [];
    }
  }

  // A/B Testing Collection
  async saveABTestResult(result: any): Promise<boolean> {
    try {
      const collection = this.connection?.db.collection('ab_test_results');
      if (!collection) {
        throw new Error('MongoDB not connected');
      }

      await collection.insertOne({
        ...result,
        timestamp: new Date(),
        createdAt: new Date(),
      });

      logger.info('A/B test result saved', { testId: result.testId, playerId: result.playerId });
      return true;
    } catch (error) {
      logger.error('Failed to save A/B test result', error);
      return false;
    }
  }

  async getABTestResults(testId: string): Promise<any[]> {
    try {
      const collection = this.connection?.db.collection('ab_test_results');
      if (!collection) {
        throw new Error('MongoDB not connected');
      }

      const results = await collection.find({ testId }).sort({ timestamp: -1 }).toArray();

      return results;
    } catch (error) {
      logger.error('Failed to get A/B test results', error);
      return [];
    }
  }

  // Unity Cloud Logs Collection
  async saveUnityCloudLog(log: any): Promise<boolean> {
    try {
      const collection = this.connection?.db.collection('unity_cloud_logs');
      if (!collection) {
        throw new Error('MongoDB not connected');
      }

      await collection.insertOne({
        ...log,
        timestamp: new Date(),
        createdAt: new Date(),
      });

      logger.info('Unity Cloud log saved', { service: log.service, level: log.level });
      return true;
    } catch (error) {
      logger.error('Failed to save Unity Cloud log', error);
      return false;
    }
  }

  async getUnityCloudLogs(service?: string, level?: string, limit = 100): Promise<any[]> {
    try {
      const collection = this.connection?.db.collection('unity_cloud_logs');
      if (!collection) {
        throw new Error('MongoDB not connected');
      }

      const query: any = {};
      if (service) query.service = service;
      if (level) query.level = level;

      const logs = await collection.find(query).sort({ timestamp: -1 }).limit(limit).toArray();

      return logs;
    } catch (error) {
      logger.error('Failed to get Unity Cloud logs', error);
      return [];
    }
  }

  // Performance Metrics Collection
  async savePerformanceMetrics(metrics: any): Promise<boolean> {
    try {
      const collection = this.connection?.db.collection('performance_metrics');
      if (!collection) {
        throw new Error('MongoDB not connected');
      }

      await collection.insertOne({
        ...metrics,
        timestamp: new Date(),
        createdAt: new Date(),
      });

      logger.info('Performance metrics saved', { service: metrics.service });
      return true;
    } catch (error) {
      logger.error('Failed to save performance metrics', error);
      return false;
    }
  }

  async getPerformanceMetrics(service?: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    try {
      const collection = this.connection?.db.collection('performance_metrics');
      if (!collection) {
        throw new Error('MongoDB not connected');
      }

      const query: any = {};
      if (service) query.service = service;
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = startDate;
        if (endDate) query.timestamp.$lte = endDate;
      }

      const metrics = await collection.find(query).sort({ timestamp: -1 }).toArray();

      return metrics;
    } catch (error) {
      logger.error('Failed to get performance metrics', error);
      return [];
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; latency: number }> {
    const start = Date.now();
    try {
      if (!this.connection) {
        throw new Error('MongoDB not connected');
      }

      await this.connection.db.admin().ping();
      const latency = Date.now() - start;
      return { status: 'healthy', latency };
    } catch (error) {
      logger.error('MongoDB health check failed', error);
      return { status: 'unhealthy', latency: -1 };
    }
  }

  // Get connection status
  isConnected(): boolean {
    return this.connection?.readyState === 1;
  }

  // Get database stats
  async getDatabaseStats(): Promise<any> {
    try {
      if (!this.connection) {
        throw new Error('MongoDB not connected');
      }

      const stats = await this.connection.db.stats();
      return stats;
    } catch (error) {
      logger.error('Failed to get database stats', error);
      return null;
    }
  }
}

export const mongoService = new MongoService();
export default mongoService;
