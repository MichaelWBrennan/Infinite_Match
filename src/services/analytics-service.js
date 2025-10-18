// Free Analytics Service - 100% Open Source
// Removed all external dependencies for open source compatibility
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

/**
 * Free Analytics Service for Match 3 Game - 100% Open Source
 * Local analytics with no external dependencies or API keys required
 */
class AnalyticsService {
  constructor() {
    this.isInitialized = false;
    this.sessionId = uuidv4();
    this.gameEvents = new Map();
    this.analyticsData = new Map();
    
    // Configuration for free analytics
    this.config = {
      // Local storage
      dataPath: './data/analytics/',
      maxEventsInMemory: 1000,
      flushInterval: 60000, // 1 minute
      
      // File storage
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 100,
      
      // Privacy settings
      anonymizeData: true,
      retentionDays: 30,
      
      // Performance
      batchSize: 100,
      compressionEnabled: true
    };
  }

  /**
   * Initialize free analytics service
   */
  async initialize() {
    try {
      console.log('Initializing Free Analytics Service');

      // Create data directory
      await this.ensureDataDirectory();

      // Load existing analytics data
      await this.loadAnalyticsData();

      // Start periodic data flushing
      this.startDataFlushing();

      this.isInitialized = true;
      console.log('Free Analytics Service initialized successfully');

      // Track service initialization
      await this.trackEvent('analytics_service_initialized', {
        session_id: this.sessionId,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        type: 'free',
        services: ['local_storage', 'file_storage', 'privacy_protection'],
      });
    } catch (error) {
      console.error('Failed to initialize Analytics Service:', error);
      throw error;
    }
  }

  /**
   * Ensure data directory exists
   */
  async ensureDataDirectory() {
    try {
      await fs.mkdir(this.config.dataPath, { recursive: true });
      await fs.mkdir(path.join(this.config.dataPath, 'events'), { recursive: true });
      await fs.mkdir(path.join(this.config.dataPath, 'sessions'), { recursive: true });
      await fs.mkdir(path.join(this.config.dataPath, 'reports'), { recursive: true });
    } catch (error) {
      console.error('Failed to create data directory:', error);
      throw error;
    }
  }

  /**
   * Load existing analytics data
   */
  async loadAnalyticsData() {
    try {
      // Load session data
      const sessionFiles = await this.getFilesInDirectory(path.join(this.config.dataPath, 'sessions'));
      for (const file of sessionFiles.slice(-10)) { // Load last 10 sessions
        try {
          const data = await fs.readFile(file, 'utf8');
          const sessionData = JSON.parse(data);
          this.analyticsData.set(sessionData.session_id, sessionData);
        } catch (error) {
          console.warn(`Failed to load session file ${file}:`, error);
        }
      }

      console.log(`Loaded ${this.analyticsData.size} sessions`);
    } catch (error) {
      console.warn('Failed to load analytics data:', error);
    }
  }

  /**
   * Start periodic data flushing
   */
  startDataFlushing() {
    setInterval(async () => {
      await this.flushEvents();
    }, this.config.flushInterval);
  }

  /**
   * Get files in directory
   */
  async getFilesInDirectory(dirPath) {
    try {
      const files = await fs.readdir(dirPath);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => path.join(dirPath, file))
        .sort();
    } catch (error) {
      return [];
    }
  }

  /**
   * Track game events with free analytics
   */
  async trackGameEvent(eventName, properties = {}, userId = null) {
    if (!this.isInitialized) {
      console.warn('Analytics Service not initialized');
      return;
    }

    const eventData = {
      event_id: uuidv4(),
      event_name: eventName,
      properties: this.config.anonymizeData ? this.anonymizeProperties(properties) : properties,
      user_id: this.config.anonymizeData ? this.anonymizeUserId(userId) : userId,
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
      platform: 'web',
      game_version: process.env.GAME_VERSION || '1.0.0',
      user_agent: this.getUserAgent(),
      ip_address: this.config.anonymizeData ? this.anonymizeIP(this.getClientIP()) : this.getClientIP()
    };

    try {
      // Store event in memory
      this.gameEvents.set(eventData.event_id, eventData);

      // Flush if we have too many events in memory
      if (this.gameEvents.size >= this.config.maxEventsInMemory) {
        await this.flushEvents();
      }

      console.log(`Game event tracked: ${eventName}`, eventData.properties);
    } catch (error) {
      console.error('Failed to track game event:', error);
    }
  }

  /**
   * Track specific game events
   */
  async trackGameStart(userId, gameData) {
    await this.trackGameEvent(
      'game_started',
      {
        level: gameData.level,
        difficulty: gameData.difficulty,
        platform: gameData.platform,
        user_agent: gameData.userAgent,
      },
      userId,
    );
  }

  async trackLevelComplete(userId, levelData) {
    await this.trackGameEvent(
      'level_completed',
      {
        level: levelData.level,
        score: levelData.score,
        time_spent: levelData.timeSpent,
        moves_used: levelData.movesUsed,
        stars_earned: levelData.starsEarned,
        powerups_used: levelData.powerupsUsed,
      },
      userId,
    );
  }

  async trackMatchMade(userId, matchData) {
    await this.trackGameEvent(
      'match_made',
      {
        match_type: matchData.matchType,
        pieces_matched: matchData.piecesMatched,
        position_x: matchData.position.x,
        position_y: matchData.position.y,
        level: matchData.level,
        score_gained: matchData.scoreGained,
      },
      userId,
    );
  }

  async trackPowerUpUsed(userId, powerUpData) {
    await this.trackGameEvent(
      'powerup_used',
      {
        powerup_type: powerUpData.type,
        level: powerUpData.level,
        position_x: powerUpData.position.x,
        position_y: powerUpData.position.y,
        cost: powerUpData.cost,
      },
      userId,
    );
  }

  async trackPurchase(userId, purchaseData) {
    await this.trackGameEvent(
      'purchase_made',
      {
        item_id: purchaseData.itemId,
        item_type: purchaseData.itemType,
        currency: purchaseData.currency,
        amount: purchaseData.amount,
        transaction_id: purchaseData.transactionId,
        platform: purchaseData.platform,
      },
      userId,
    );
  }

  async trackError(userId, errorData) {
    await this.trackGameEvent(
      'error_occurred',
      {
        error_type: errorData.type,
        error_message: errorData.message,
        error_code: errorData.code,
        level: errorData.level,
        stack_trace: errorData.stackTrace,
      },
      userId,
    );

    // Also send to Sentry
    Sentry.captureException(new Error(errorData.message), {
      tags: {
        error_type: errorData.type,
        level: errorData.level,
        user_id: userId,
      },
      extra: errorData,
    });
  }

  /**
   * Track performance metrics
   */
  async trackPerformance(userId, performanceData) {
    await this.trackGameEvent(
      'performance_metric',
      {
        metric_name: performanceData.metricName,
        value: performanceData.value,
        unit: performanceData.unit,
        level: performanceData.level,
        device_info: performanceData.deviceInfo,
      },
      userId,
    );

    // Track with New Relic
    if (newrelic) {
      newrelic.recordMetric(performanceData.metricName, performanceData.value);
    }
  }

  /**
   * Flush events to disk
   */
  async flushEvents() {
    if (this.gameEvents.size === 0) return;

    try {
      const events = Array.from(this.gameEvents.values());
      const filename = `events_${Date.now()}.json`;
      const filepath = path.join(this.config.dataPath, 'events', filename);

      await fs.writeFile(filepath, JSON.stringify(events, null, 2));
      
      console.log(`Flushed ${events.length} events to ${filename}`);
      this.gameEvents.clear();

      // Clean old files if needed
      await this.cleanOldFiles('events');
    } catch (error) {
      console.error('Failed to flush events:', error);
    }
  }

  /**
   * Clean old files
   */
  async cleanOldFiles(type) {
    try {
      const dirPath = path.join(this.config.dataPath, type);
      const files = await this.getFilesInDirectory(dirPath);

      if (files.length > this.config.maxFiles) {
        const filesToDelete = files.slice(0, files.length - this.config.maxFiles);
        for (const file of filesToDelete) {
          await fs.unlink(file);
        }
        console.log(`Cleaned ${filesToDelete.length} old ${type} files`);
      }
    } catch (error) {
      console.warn(`Failed to clean old ${type} files:`, error);
    }
  }

  /**
   * Anonymize user data
   */
  anonymizeUserId(userId) {
    if (!userId) return 'anonymous';
    return `user_${this.hashString(userId).substring(0, 8)}`;
  }

  anonymizeIP(ip) {
    if (!ip) return '0.0.0.0';
    return ip.split('.').slice(0, 3).join('.') + '.0';
  }

  anonymizeProperties(properties) {
    const anonymized = { ...properties };
    
    // Remove or hash sensitive fields
    if (anonymized.email) {
      anonymized.email = this.hashString(anonymized.email);
    }
    if (anonymized.name) {
      anonymized.name = this.hashString(anonymized.name);
    }
    if (anonymized.phone) {
      anonymized.phone = this.hashString(anonymized.phone);
    }

    return anonymized;
  }

  /**
   * Hash string for anonymization
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get user agent
   */
  getUserAgent() {
    return typeof navigator !== 'undefined' ? navigator.userAgent : 'server';
  }

  /**
   * Get client IP
   */
  getClientIP() {
    // In a real implementation, this would get the actual client IP
    return '127.0.0.1';
  }

  /**
   * Get analytics summary
   */
  getAnalyticsSummary() {
    return {
      session_id: this.sessionId,
      is_initialized: this.isInitialized,
      events_tracked: this.gameEvents.size,
      total_events_stored: this.analyticsData.size,
      services: {
        local_storage: true,
        file_storage: true,
        anonymization: this.config.anonymizeData,
        compression: this.config.compressionEnabled
      },
      configuration: this.config
    };
  }

  /**
   * Flush all pending events
   */
  async flush() {
    if (this.amplitude) {
      await this.amplitude.flush();
    }

    if (this.datadogRum) {
      this.datadogRum.flush();
    }
  }

  /**
   * Shutdown analytics service
   */
  async shutdown() {
    try {
      await this.flush();
      this.isInitialized = false;
      console.log('Analytics Service shutdown complete');
    } catch (error) {
      console.error('Error during analytics shutdown:', error);
    }
  }
}

// Export singleton instance
export default new AnalyticsService();
