import { Logger } from '../core/logger/index.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

/**
 * Free Analytics Service - 100% Open Source
 * Local analytics with no external dependencies or API keys required
 */
class FreeAnalyticsService {
  constructor() {
    this.logger = new Logger('FreeAnalyticsService');
    
    this.isInitialized = false;
    this.sessionId = uuidv4();
    this.gameEvents = new Map();
    this.analyticsData = new Map();
    
    // Configuration
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

    this.initializeAnalytics();
  }

  /**
   * Initialize analytics service
   */
  async initialize() {
    try {
      this.logger.info('Initializing Free Analytics Service');

      // Create data directory
      await this.ensureDataDirectory();

      // Load existing analytics data
      await this.loadAnalyticsData();

      // Start periodic data flushing
      this.startDataFlushing();

      this.isInitialized = true;
      this.logger.info('Free Analytics Service initialized successfully');

      // Track service initialization
      await this.trackEvent('analytics_service_initialized', {
        session_id: this.sessionId,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        type: 'free'
      });

    } catch (error) {
      this.logger.error('Failed to initialize Analytics Service:', error);
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
      this.logger.error('Failed to create data directory:', error);
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
          this.logger.warn(`Failed to load session file ${file}:`, error);
        }
      }

      this.logger.info(`Loaded ${this.analyticsData.size} sessions`);
    } catch (error) {
      this.logger.warn('Failed to load analytics data:', error);
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
   * Track game events with comprehensive analytics
   */
  async trackGameEvent(eventName, properties = {}, userId = null) {
    if (!this.isInitialized) {
      this.logger.warn('Analytics Service not initialized');
      return;
    }

    const eventData = {
      event_id: uuidv4(),
      event_name: eventName,
      properties: this.anonymizeData ? this.anonymizeProperties(properties) : properties,
      user_id: this.anonymizeData ? this.anonymizeUserId(userId) : userId,
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
      platform: 'web',
      game_version: process.env.GAME_VERSION || '1.0.0',
      user_agent: this.getUserAgent(),
      ip_address: this.anonymizeData ? this.anonymizeIP(this.getClientIP()) : this.getClientIP()
    };

    try {
      // Store event in memory
      this.gameEvents.set(eventData.event_id, eventData);

      // Flush if we have too many events in memory
      if (this.gameEvents.size >= this.config.maxEventsInMemory) {
        await this.flushEvents();
      }

      this.logger.debug(`Game event tracked: ${eventName}`, eventData.properties);
    } catch (error) {
      this.logger.error('Failed to track game event:', error);
    }
  }

  /**
   * Track specific game events
   */
  async trackGameStart(userId, gameData) {
    await this.trackGameEvent('game_started', {
      level: gameData.level,
      difficulty: gameData.difficulty,
      platform: gameData.platform,
      user_agent: gameData.userAgent,
      start_time: new Date().toISOString()
    }, userId);
  }

  async trackLevelComplete(userId, levelData) {
    await this.trackGameEvent('level_completed', {
      level: levelData.level,
      score: levelData.score,
      time_spent: levelData.timeSpent,
      moves_used: levelData.movesUsed,
      stars_earned: levelData.starsEarned,
      powerups_used: levelData.powerupsUsed,
      completion_time: new Date().toISOString()
    }, userId);
  }

  async trackMatchMade(userId, matchData) {
    await this.trackGameEvent('match_made', {
      match_type: matchData.matchType,
      pieces_matched: matchData.piecesMatched,
      position_x: matchData.position.x,
      position_y: matchData.position.y,
      level: matchData.level,
      score_gained: matchData.scoreGained,
      match_time: new Date().toISOString()
    }, userId);
  }

  async trackPowerUpUsed(userId, powerUpData) {
    await this.trackGameEvent('powerup_used', {
      powerup_type: powerUpData.type,
      level: powerUpData.level,
      position_x: powerUpData.position.x,
      position_y: powerUpData.position.y,
      cost: powerUpData.cost,
      usage_time: new Date().toISOString()
    }, userId);
  }

  async trackPurchase(userId, purchaseData) {
    await this.trackGameEvent('purchase_made', {
      item_id: purchaseData.itemId,
      item_type: purchaseData.itemType,
      currency: purchaseData.currency,
      amount: purchaseData.amount,
      transaction_id: purchaseData.transactionId,
      platform: purchaseData.platform,
      purchase_time: new Date().toISOString()
    }, userId);
  }

  async trackError(userId, errorData) {
    await this.trackGameEvent('error_occurred', {
      error_type: errorData.type,
      error_message: errorData.message,
      error_code: errorData.code,
      level: errorData.level,
      stack_trace: this.anonymizeData ? this.anonymizeStackTrace(errorData.stackTrace) : errorData.stackTrace,
      error_time: new Date().toISOString()
    }, userId);
  }

  /**
   * Track performance metrics
   */
  async trackPerformance(userId, performanceData) {
    await this.trackGameEvent('performance_metric', {
      metric_name: performanceData.metricName,
      value: performanceData.value,
      unit: performanceData.unit,
      level: performanceData.level,
      device_info: this.anonymizeData ? this.anonymizeDeviceInfo(performanceData.deviceInfo) : performanceData.deviceInfo,
      measurement_time: new Date().toISOString()
    }, userId);
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
      
      this.logger.info(`Flushed ${events.length} events to ${filename}`);
      this.gameEvents.clear();

      // Clean old files if needed
      await this.cleanOldFiles('events');
    } catch (error) {
      this.logger.error('Failed to flush events:', error);
    }
  }

  /**
   * Generate analytics reports
   */
  async generateReport(reportType = 'summary', options = {}) {
    try {
      this.logger.info(`Generating ${reportType} report`);

      const report = {
        report_id: uuidv4(),
        report_type: reportType,
        generated_at: new Date().toISOString(),
        data: {}
      };

      switch (reportType) {
        case 'summary':
          report.data = await this.generateSummaryReport();
          break;
        case 'events':
          report.data = await this.generateEventsReport(options);
          break;
        case 'users':
          report.data = await this.generateUsersReport(options);
          break;
        case 'performance':
          report.data = await this.generatePerformanceReport(options);
          break;
        case 'errors':
          report.data = await this.generateErrorsReport(options);
          break;
        default:
          throw new Error(`Unknown report type: ${reportType}`);
      }

      // Save report
      const filename = `report_${reportType}_${Date.now()}.json`;
      const filepath = path.join(this.config.dataPath, 'reports', filename);
      await fs.writeFile(filepath, JSON.stringify(report, null, 2));

      this.logger.info(`Report generated: ${filename}`);
      return report;
    } catch (error) {
      this.logger.error('Failed to generate report:', error);
      throw error;
    }
  }

  /**
   * Generate summary report
   */
  async generateSummaryReport() {
    const events = await this.getAllEvents();
    const sessions = Array.from(this.analyticsData.values());

    return {
      total_events: events.length,
      total_sessions: sessions.length,
      unique_users: new Set(events.map(e => e.user_id)).size,
      event_types: this.getEventTypeCounts(events),
      top_events: this.getTopEvents(events, 10),
      session_stats: this.getSessionStats(sessions),
      time_range: {
        start: events.length > 0 ? events[0].timestamp : null,
        end: events.length > 0 ? events[events.length - 1].timestamp : null
      }
    };
  }

  /**
   * Generate events report
   */
  async generateEventsReport(options) {
    const events = await this.getAllEvents();
    const filteredEvents = this.filterEvents(events, options);

    return {
      total_events: filteredEvents.length,
      events_by_type: this.getEventTypeCounts(filteredEvents),
      events_by_hour: this.getEventsByHour(filteredEvents),
      events_by_day: this.getEventsByDay(filteredEvents),
      recent_events: filteredEvents.slice(-50)
    };
  }

  /**
   * Generate users report
   */
  async generateUsersReport(options) {
    const events = await this.getAllEvents();
    const users = this.groupEventsByUser(events);

    return {
      total_users: users.size,
      active_users: Array.from(users.values()).filter(user => 
        this.isUserActive(user, options.days || 7)
      ).length,
      user_engagement: this.calculateUserEngagement(users),
      top_users: this.getTopUsers(users, 20),
      user_retention: this.calculateUserRetention(users)
    };
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(options) {
    const events = await this.getAllEvents();
    const performanceEvents = events.filter(e => e.event_name === 'performance_metric');

    return {
      total_metrics: performanceEvents.length,
      metrics_by_name: this.groupMetricsByName(performanceEvents),
      average_values: this.calculateAverageMetrics(performanceEvents),
      performance_trends: this.calculatePerformanceTrends(performanceEvents),
      device_performance: this.getDevicePerformance(performanceEvents)
    };
  }

  /**
   * Generate errors report
   */
  async generateErrorsReport(options) {
    const events = await this.getAllEvents();
    const errorEvents = events.filter(e => e.event_name === 'error_occurred');

    return {
      total_errors: errorEvents.length,
      errors_by_type: this.groupErrorsByType(errorEvents),
      errors_by_level: this.groupErrorsByLevel(errorEvents),
      error_trends: this.calculateErrorTrends(errorEvents),
      recent_errors: errorEvents.slice(-20)
    };
  }

  /**
   * Get all events from files
   */
  async getAllEvents() {
    const events = [];
    const eventFiles = await this.getFilesInDirectory(path.join(this.config.dataPath, 'events'));

    for (const file of eventFiles) {
      try {
        const data = await fs.readFile(file, 'utf8');
        const fileEvents = JSON.parse(data);
        events.push(...fileEvents);
      } catch (error) {
        this.logger.warn(`Failed to read event file ${file}:`, error);
      }
    }

    return events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
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
        this.logger.info(`Cleaned ${filesToDelete.length} old ${type} files`);
      }
    } catch (error) {
      this.logger.warn(`Failed to clean old ${type} files:`, error);
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

  anonymizeStackTrace(stackTrace) {
    if (!stackTrace) return null;
    return stackTrace.replace(/\/[^\s]+/g, '/path/to/file');
  }

  anonymizeDeviceInfo(deviceInfo) {
    if (!deviceInfo) return {};
    return {
      ...deviceInfo,
      device_id: deviceInfo.device_id ? this.hashString(deviceInfo.device_id) : null,
      user_agent: deviceInfo.user_agent ? this.hashString(deviceInfo.user_agent) : null
    };
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
   * Helper methods for report generation
   */
  getEventTypeCounts(events) {
    const counts = {};
    events.forEach(event => {
      counts[event.event_name] = (counts[event.event_name] || 0) + 1;
    });
    return counts;
  }

  getTopEvents(events, limit) {
    const counts = this.getEventTypeCounts(events);
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([event, count]) => ({ event, count }));
  }

  getSessionStats(sessions) {
    if (sessions.length === 0) return {};
    
    const durations = sessions.map(s => s.duration || 0);
    return {
      average_duration: durations.reduce((a, b) => a + b, 0) / durations.length,
      total_duration: durations.reduce((a, b) => a + b, 0),
      longest_session: Math.max(...durations),
      shortest_session: Math.min(...durations)
    };
  }

  filterEvents(events, options) {
    let filtered = events;
    
    if (options.startDate) {
      filtered = filtered.filter(e => new Date(e.timestamp) >= new Date(options.startDate));
    }
    if (options.endDate) {
      filtered = filtered.filter(e => new Date(e.timestamp) <= new Date(options.endDate));
    }
    if (options.eventTypes) {
      filtered = filtered.filter(e => options.eventTypes.includes(e.event_name));
    }
    if (options.userId) {
      filtered = filtered.filter(e => e.user_id === options.userId);
    }

    return filtered;
  }

  getEventsByHour(events) {
    const hourly = {};
    events.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      hourly[hour] = (hourly[hour] || 0) + 1;
    });
    return hourly;
  }

  getEventsByDay(events) {
    const daily = {};
    events.forEach(event => {
      const day = new Date(event.timestamp).toISOString().split('T')[0];
      daily[day] = (daily[day] || 0) + 1;
    });
    return daily;
  }

  groupEventsByUser(events) {
    const users = new Map();
    events.forEach(event => {
      if (!users.has(event.user_id)) {
        users.set(event.user_id, []);
      }
      users.get(event.user_id).push(event);
    });
    return users;
  }

  isUserActive(userEvents, days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return userEvents.some(event => new Date(event.timestamp) > cutoff);
  }

  calculateUserEngagement(users) {
    const engagement = {};
    users.forEach((events, userId) => {
      engagement[userId] = {
        total_events: events.length,
        unique_event_types: new Set(events.map(e => e.event_name)).size,
        last_activity: Math.max(...events.map(e => new Date(e.timestamp).getTime())),
        session_count: new Set(events.map(e => e.session_id)).size
      };
    });
    return engagement;
  }

  getTopUsers(users, limit) {
    const userStats = this.calculateUserEngagement(users);
    return Object.entries(userStats)
      .sort(([,a], [,b]) => b.total_events - a.total_events)
      .slice(0, limit)
      .map(([userId, stats]) => ({ userId, ...stats }));
  }

  calculateUserRetention(users) {
    // Simple retention calculation
    const totalUsers = users.size;
    const activeUsers = Array.from(users.values()).filter(user => 
      this.isUserActive(user, 7)
    ).length;
    
    return {
      total_users: totalUsers,
      active_users_7d: activeUsers,
      retention_rate_7d: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0
    };
  }

  groupMetricsByName(events) {
    const metrics = {};
    events.forEach(event => {
      const metricName = event.properties.metric_name;
      if (!metrics[metricName]) {
        metrics[metricName] = [];
      }
      metrics[metricName].push(event.properties.value);
    });
    return metrics;
  }

  calculateAverageMetrics(events) {
    const averages = {};
    const metrics = this.groupMetricsByName(events);
    
    Object.entries(metrics).forEach(([name, values]) => {
      averages[name] = values.reduce((a, b) => a + b, 0) / values.length;
    });
    
    return averages;
  }

  calculatePerformanceTrends(events) {
    // Simple trend calculation
    const trends = {};
    const metrics = this.groupMetricsByName(events);
    
    Object.entries(metrics).forEach(([name, values]) => {
      if (values.length > 1) {
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        
        trends[name] = {
          trend: secondAvg > firstAvg ? 'improving' : 'declining',
          change: ((secondAvg - firstAvg) / firstAvg) * 100
        };
      }
    });
    
    return trends;
  }

  getDevicePerformance(events) {
    const deviceMetrics = {};
    events.forEach(event => {
      const device = event.properties.device_info?.device_type || 'unknown';
      if (!deviceMetrics[device]) {
        deviceMetrics[device] = [];
      }
      deviceMetrics[device].push(event.properties.value);
    });
    
    const performance = {};
    Object.entries(deviceMetrics).forEach(([device, values]) => {
      performance[device] = {
        average: values.reduce((a, b) => a + b, 0) / values.length,
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      };
    });
    
    return performance;
  }

  groupErrorsByType(events) {
    const types = {};
    events.forEach(event => {
      const errorType = event.properties.error_type;
      types[errorType] = (types[errorType] || 0) + 1;
    });
    return types;
  }

  groupErrorsByLevel(events) {
    const levels = {};
    events.forEach(event => {
      const level = event.properties.level;
      levels[level] = (levels[level] || 0) + 1;
    });
    return levels;
  }

  calculateErrorTrends(events) {
    // Simple error trend calculation
    const dailyErrors = {};
    events.forEach(event => {
      const day = new Date(event.timestamp).toISOString().split('T')[0];
      dailyErrors[day] = (dailyErrors[day] || 0) + 1;
    });
    
    const days = Object.keys(dailyErrors).sort();
    if (days.length < 2) return { trend: 'stable', change: 0 };
    
    const firstHalf = days.slice(0, Math.floor(days.length / 2));
    const secondHalf = days.slice(Math.floor(days.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, day) => sum + (dailyErrors[day] || 0), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, day) => sum + (dailyErrors[day] || 0), 0) / secondHalf.length;
    
    return {
      trend: secondAvg > firstAvg ? 'increasing' : 'decreasing',
      change: firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0
    };
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
    await this.flushEvents();
  }

  /**
   * Shutdown analytics service
   */
  async shutdown() {
    try {
      await this.flush();
      this.isInitialized = false;
      this.logger.info('Free Analytics Service shutdown complete');
    } catch (error) {
      this.logger.error('Error during analytics shutdown:', error);
    }
  }
}

// Export singleton instance
export default new FreeAnalyticsService();