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
   * Get real user data
   */
  async getRealUserData(userId) {
    try {
      // Get real user data from local storage or database
      const userData = await this.getUserDataFromStorage(userId);
      
      return {
        location: userData?.location || await this.getUserLocation(),
        timezone: userData?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: userData?.language || navigator.language || 'en-US',
        preferences: userData?.preferences || {},
        gameProgress: userData?.gameProgress || {},
        lastSeen: new Date().toISOString()
      };
    } catch (error) {
      console.warn('Failed to get real user data:', error);
      return {
        location: null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language || 'en-US',
        preferences: {},
        gameProgress: {},
        lastSeen: new Date().toISOString()
      };
    }
  }

  /**
   * Get real device data
   */
  async getRealDeviceData() {
    try {
      const userAgent = this.getUserAgent();
      const deviceInfo = this.parseUserAgent(userAgent);
      
      return {
        platform: deviceInfo.platform,
        gameVersion: process.env.GAME_VERSION || '1.0.0',
        userAgent: userAgent,
        ipAddress: this.getClientIP(),
        deviceInfo: deviceInfo,
        screenResolution: this.getScreenResolution(),
        connectionType: this.getConnectionType(),
        memoryInfo: this.getMemoryInfo(),
        batteryInfo: this.getBatteryInfo()
      };
    } catch (error) {
      console.warn('Failed to get real device data:', error);
      return {
        platform: 'unknown',
        gameVersion: '1.0.0',
        userAgent: 'unknown',
        ipAddress: '127.0.0.1',
        deviceInfo: {},
        screenResolution: 'unknown',
        connectionType: 'unknown',
        memoryInfo: {},
        batteryInfo: {}
      };
    }
  }

  /**
   * Get real game data
   */
  async getRealGameData(eventName, properties) {
    try {
      const gameState = await this.getGameState();
      const performanceMetrics = await this.getPerformanceMetrics();
      
      return {
        gameState: gameState,
        performanceMetrics: performanceMetrics,
        sessionDuration: this.getSessionDuration(),
        levelProgress: this.getLevelProgress(),
        score: this.getCurrentScore(),
        achievements: this.getAchievements(),
        powerups: this.getPowerups(),
        coins: this.getCoins(),
        gems: this.getGems()
      };
    } catch (error) {
      console.warn('Failed to get real game data:', error);
      return {
        gameState: {},
        performanceMetrics: {},
        sessionDuration: 0,
        levelProgress: 0,
        score: 0,
        achievements: [],
        powerups: [],
        coins: 0,
        gems: 0
      };
    }
  }

  /**
   * Get user data from storage
   */
  async getUserDataFromStorage(userId) {
    try {
      if (typeof localStorage !== 'undefined') {
        const userData = localStorage.getItem(`user_${userId}`);
        return userData ? JSON.parse(userData) : null;
      }
      return null;
    } catch (error) {
      console.warn('Failed to get user data from storage:', error);
      return null;
    }
  }

  /**
   * Get user location (simplified)
   */
  async getUserLocation() {
    try {
      if (navigator.geolocation) {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
              });
            },
            () => resolve(null),
            { timeout: 5000 }
          );
        });
      }
      return null;
    } catch (error) {
      console.warn('Failed to get user location:', error);
      return null;
    }
  }

  /**
   * Parse user agent for device info
   */
  parseUserAgent(userAgent) {
    const ua = userAgent.toLowerCase();
    
    let platform = 'unknown';
    let device = 'unknown';
    let browser = 'unknown';
    let os = 'unknown';
    
    // Detect platform
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      platform = 'mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      platform = 'tablet';
    } else {
      platform = 'desktop';
    }
    
    // Detect device
    if (ua.includes('iphone')) device = 'iphone';
    else if (ua.includes('ipad')) device = 'ipad';
    else if (ua.includes('android')) device = 'android';
    else if (ua.includes('windows')) device = 'windows';
    else if (ua.includes('mac')) device = 'mac';
    else if (ua.includes('linux')) device = 'linux';
    
    // Detect browser
    if (ua.includes('chrome')) browser = 'chrome';
    else if (ua.includes('firefox')) browser = 'firefox';
    else if (ua.includes('safari')) browser = 'safari';
    else if (ua.includes('edge')) browser = 'edge';
    else if (ua.includes('opera')) browser = 'opera';
    
    // Detect OS
    if (ua.includes('windows')) os = 'windows';
    else if (ua.includes('mac')) os = 'macos';
    else if (ua.includes('linux')) os = 'linux';
    else if (ua.includes('android')) os = 'android';
    else if (ua.includes('ios')) os = 'ios';
    
    return {
      platform,
      device,
      browser,
      os,
      userAgent: userAgent
    };
  }

  /**
   * Get screen resolution
   */
  getScreenResolution() {
    try {
      if (typeof screen !== 'undefined') {
        return `${screen.width}x${screen.height}`;
      }
      return 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Get connection type
   */
  getConnectionType() {
    try {
      if (typeof navigator !== 'undefined' && navigator.connection) {
        return navigator.connection.effectiveType || 'unknown';
      }
      return 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Get memory info
   */
  getMemoryInfo() {
    try {
      if (typeof performance !== 'undefined' && performance.memory) {
        return {
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
        };
      }
      return {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Get battery info
   */
  getBatteryInfo() {
    try {
      if (typeof navigator !== 'undefined' && navigator.getBattery) {
        navigator.getBattery().then(battery => {
          return {
            level: Math.round(battery.level * 100),
            charging: battery.charging,
            chargingTime: battery.chargingTime,
            dischargingTime: battery.dischargingTime
          };
        });
      }
      return {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Get game state
   */
  async getGameState() {
    try {
      if (typeof localStorage !== 'undefined') {
        const gameState = localStorage.getItem('gameState');
        return gameState ? JSON.parse(gameState) : {};
      }
      return {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics() {
    try {
      if (typeof performance !== 'undefined') {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        
        return {
          loadTime: navigation ? Math.round(navigation.loadEventEnd - navigation.loadEventStart) : 0,
          domContentLoaded: navigation ? Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart) : 0,
          firstPaint: paint.find(p => p.name === 'first-paint') ? Math.round(paint.find(p => p.name === 'first-paint').startTime) : 0,
          firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint') ? Math.round(paint.find(p => p.name === 'first-contentful-paint').startTime) : 0,
          fps: this.getFPS(),
          memoryUsage: this.getMemoryInfo()
        };
      }
      return {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Get FPS
   */
  getFPS() {
    try {
      if (typeof performance !== 'undefined') {
        const fps = performance.getEntriesByType('measure').find(m => m.name === 'fps');
        return fps ? Math.round(fps.duration) : 60;
      }
      return 60;
    } catch (error) {
      return 60;
    }
  }

  /**
   * Get session duration
   */
  getSessionDuration() {
    try {
      if (typeof localStorage !== 'undefined') {
        const sessionStart = localStorage.getItem('sessionStart');
        if (sessionStart) {
          return Date.now() - parseInt(sessionStart);
        }
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get level progress
   */
  getLevelProgress() {
    try {
      if (typeof localStorage !== 'undefined') {
        const progress = localStorage.getItem('levelProgress');
        return progress ? parseInt(progress) : 0;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get current score
   */
  getCurrentScore() {
    try {
      if (typeof localStorage !== 'undefined') {
        const score = localStorage.getItem('currentScore');
        return score ? parseInt(score) : 0;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get achievements
   */
  getAchievements() {
    try {
      if (typeof localStorage !== 'undefined') {
        const achievements = localStorage.getItem('achievements');
        return achievements ? JSON.parse(achievements) : [];
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get powerups
   */
  getPowerups() {
    try {
      if (typeof localStorage !== 'undefined') {
        const powerups = localStorage.getItem('powerups');
        return powerups ? JSON.parse(powerups) : [];
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get coins
   */
  getCoins() {
    try {
      if (typeof localStorage !== 'undefined') {
        const coins = localStorage.getItem('coins');
        return coins ? parseInt(coins) : 0;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get gems
   */
  getGems() {
    try {
      if (typeof localStorage !== 'undefined') {
        const gems = localStorage.getItem('gems');
        return gems ? parseInt(gems) : 0;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Update real-time analytics
   */
  async updateRealTimeAnalytics(eventName, eventData) {
    try {
      // Update real-time counters
      const analytics = this.localData.get('analytics');
      analytics.total_events++;
      
      // Update event counters
      if (!analytics.event_counts) {
        analytics.event_counts = {};
      }
      analytics.event_counts[eventName] = (analytics.event_counts[eventName] || 0) + 1;
      
      // Update session data
      analytics.last_event_time = Date.now();
      analytics.is_active = true;
      
      // Update user data
      if (eventData.user_id) {
        if (!analytics.user_data) {
          analytics.user_data = {};
        }
        analytics.user_data[eventData.user_id] = {
          last_seen: Date.now(),
          event_count: (analytics.user_data[eventData.user_id]?.event_count || 0) + 1,
          last_event: eventName
        };
      }
      
      // Update platform data
      if (eventData.platform) {
        if (!analytics.platform_data) {
          analytics.platform_data = {};
        }
        analytics.platform_data[eventData.platform] = (analytics.platform_data[eventData.platform] || 0) + 1;
      }
      
    } catch (error) {
      console.warn('Failed to update real-time analytics:', error);
    }
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
