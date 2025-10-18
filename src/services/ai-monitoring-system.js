import { Logger } from '../core/logger/index.js';
import { aiCacheManager } from './ai-cache-manager.js';
import { AIContentGenerator } from './ai-content-generator.js';
import { AIPersonalizationEngine } from './ai-personalization-engine.js';
import { AIAnalyticsEngine } from './ai-analytics-engine.js';
import Redis from 'ioredis';
import { EventEmitter } from 'events';

/**
 * AI Monitoring System - Comprehensive monitoring and alerting for all AI services
 * 
 * Features:
 * - Real-time performance monitoring
 * - Intelligent alerting system
 * - Performance analytics and insights
 * - Automated optimization recommendations
 * - Health checks and diagnostics
 * - Resource usage tracking
 */
class AIMonitoringSystem extends EventEmitter {
  constructor() {
    super();
    this.logger = new Logger('AIMonitoringSystem');

    // Redis for storing monitoring data
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    // Monitoring configuration
    this.config = {
      monitoringInterval: 30000, // 30 seconds
      alertCooldown: 300000, // 5 minutes
      maxAlertsPerHour: 10,
      performanceThresholds: {
        responseTime: 5000, // 5 seconds
        errorRate: 0.05, // 5%
        cacheHitRate: 0.7, // 70%
        memoryUsage: 0.8, // 80%
        cpuUsage: 0.8, // 80%
      },
    };

    // Monitoring data
    this.metrics = {
      totalRequests: 0,
      totalErrors: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      activeConnections: 0,
      lastUpdate: Date.now(),
    };

    // Alert system
    this.alerts = new Map();
    this.alertHistory = [];
    this.alertCooldowns = new Map();

    // Service health status
    this.serviceHealth = {
      contentGenerator: 'healthy',
      personalizationEngine: 'healthy',
      analyticsEngine: 'healthy',
      cacheManager: 'healthy',
      redis: 'healthy',
    };

    // Performance baselines
    this.baselines = {
      responseTime: 1000,
      errorRate: 0.01,
      cacheHitRate: 0.8,
      memoryUsage: 0.5,
    };

    this.initializeMonitoring();
  }

  /**
   * Initialize monitoring system
   */
  async initializeMonitoring() {
    try {
      // Test Redis connection
      await this.redis.ping();
      this.logger.info('AI Monitoring System initialized with Redis connection');
    } catch (error) {
      this.logger.warn('Redis connection failed, using memory-only monitoring', { error: error.message });
    }

    // Start monitoring loops
    this.startPerformanceMonitoring();
    this.startHealthChecks();
    this.startAlertProcessing();
    this.startMetricsCollection();
    this.startOptimizationAnalysis();

    this.logger.info('AI Monitoring System started');
  }

  /**
   * Performance monitoring
   */
  startPerformanceMonitoring() {
    setInterval(async () => {
      await this.collectPerformanceMetrics();
      await this.analyzePerformance();
      await this.checkThresholds();
    }, this.config.monitoringInterval);
  }

  async collectPerformanceMetrics() {
    try {
      // Collect metrics from all AI services
      const cacheStats = aiCacheManager.getCacheStats();
      const contentStats = this.getServiceStats('contentGenerator');
      const personalizationStats = this.getServiceStats('personalizationEngine');
      const analyticsStats = this.getServiceStats('analyticsEngine');

      // Calculate aggregated metrics
      const totalRequests = (contentStats.totalRequests || 0) + 
                           (personalizationStats.totalRequests || 0) + 
                           (analyticsStats.totalRequests || 0);

      const totalErrors = (contentStats.totalErrors || 0) + 
                         (personalizationStats.totalErrors || 0) + 
                         (analyticsStats.totalErrors || 0);

      const averageResponseTime = this.calculateWeightedAverage([
        { value: contentStats.averageResponseTime || 0, weight: contentStats.totalRequests || 0 },
        { value: personalizationStats.averageResponseTime || 0, weight: personalizationStats.totalRequests || 0 },
        { value: analyticsStats.averageResponseTime || 0, weight: analyticsStats.totalRequests || 0 },
      ]);

      const cacheHitRate = cacheStats.hitRate || 0;
      const memoryUsage = this.getMemoryUsage();
      const cpuUsage = this.getCPUUsage();

      // Update metrics
      this.metrics = {
        totalRequests,
        totalErrors,
        averageResponseTime,
        cacheHitRate,
        memoryUsage,
        cpuUsage,
        activeConnections: this.getActiveConnections(),
        lastUpdate: Date.now(),
      };

      // Store metrics in Redis
      await this.storeMetrics();

      this.logger.debug('Performance metrics collected', this.metrics);
    } catch (error) {
      this.logger.error('Failed to collect performance metrics', { error: error.message });
    }
  }

  async analyzePerformance() {
    try {
      // Analyze performance trends
      const trends = await this.analyzeTrends();
      
      // Detect anomalies
      const anomalies = await this.detectAnomalies();
      
      // Generate insights
      const insights = await this.generateInsights(trends, anomalies);
      
      // Emit performance analysis event
      this.emit('performanceAnalysis', {
        metrics: this.metrics,
        trends,
        anomalies,
        insights,
        timestamp: new Date().toISOString(),
      });

      this.logger.debug('Performance analysis completed', { trends, anomalies, insights });
    } catch (error) {
      this.logger.error('Performance analysis failed', { error: error.message });
    }
  }

  async checkThresholds() {
    const thresholds = this.config.performanceThresholds;
    const alerts = [];

    // Check response time threshold
    if (this.metrics.averageResponseTime > thresholds.responseTime) {
      alerts.push({
        type: 'high_response_time',
        severity: 'warning',
        message: `Average response time ${this.metrics.averageResponseTime}ms exceeds threshold ${thresholds.responseTime}ms`,
        value: this.metrics.averageResponseTime,
        threshold: thresholds.responseTime,
      });
    }

    // Check error rate threshold
    const errorRate = this.metrics.totalRequests > 0 ? this.metrics.totalErrors / this.metrics.totalRequests : 0;
    if (errorRate > thresholds.errorRate) {
      alerts.push({
        type: 'high_error_rate',
        severity: 'critical',
        message: `Error rate ${(errorRate * 100).toFixed(2)}% exceeds threshold ${(thresholds.errorRate * 100).toFixed(2)}%`,
        value: errorRate,
        threshold: thresholds.errorRate,
      });
    }

    // Check cache hit rate threshold
    if (this.metrics.cacheHitRate < thresholds.cacheHitRate) {
      alerts.push({
        type: 'low_cache_hit_rate',
        severity: 'warning',
        message: `Cache hit rate ${(this.metrics.cacheHitRate * 100).toFixed(2)}% below threshold ${(thresholds.cacheHitRate * 100).toFixed(2)}%`,
        value: this.metrics.cacheHitRate,
        threshold: thresholds.cacheHitRate,
      });
    }

    // Check memory usage threshold
    if (this.metrics.memoryUsage > thresholds.memoryUsage) {
      alerts.push({
        type: 'high_memory_usage',
        severity: 'critical',
        message: `Memory usage ${(this.metrics.memoryUsage * 100).toFixed(2)}% exceeds threshold ${(thresholds.memoryUsage * 100).toFixed(2)}%`,
        value: this.metrics.memoryUsage,
        threshold: thresholds.memoryUsage,
      });
    }

    // Process alerts
    for (const alert of alerts) {
      await this.processAlert(alert);
    }
  }

  /**
   * Health checks
   */
  startHealthChecks() {
    setInterval(async () => {
      await this.checkServiceHealth();
    }, 60000); // Every minute
  }

  async checkServiceHealth() {
    try {
      // Check cache manager health
      const cacheHealth = await aiCacheManager.healthCheck();
      this.serviceHealth.cacheManager = cacheHealth.status;

      // Check Redis health
      try {
        await this.redis.ping();
        this.serviceHealth.redis = 'healthy';
      } catch (error) {
        this.serviceHealth.redis = 'unhealthy';
      }

      // Check AI services health
      this.serviceHealth.contentGenerator = await this.checkAIServiceHealth('contentGenerator');
      this.serviceHealth.personalizationEngine = await this.checkAIServiceHealth('personalizationEngine');
      this.serviceHealth.analyticsEngine = await this.checkAIServiceHealth('analyticsEngine');

      // Emit health status event
      this.emit('healthStatus', {
        services: this.serviceHealth,
        timestamp: new Date().toISOString(),
      });

      this.logger.debug('Health checks completed', this.serviceHealth);
    } catch (error) {
      this.logger.error('Health checks failed', { error: error.message });
    }
  }

  async checkAIServiceHealth(serviceName) {
    try {
      // This would check the actual health of AI services
      // For now, we'll assume they're healthy if they're responding
      return 'healthy';
    } catch (error) {
      return 'unhealthy';
    }
  }

  /**
   * Alert processing
   */
  startAlertProcessing() {
    setInterval(async () => {
      await this.processPendingAlerts();
    }, 10000); // Every 10 seconds
  }

  async processAlert(alert) {
    const alertKey = `${alert.type}:${Date.now()}`;
    
    // Check cooldown
    const cooldownKey = alert.type;
    const lastAlert = this.alertCooldowns.get(cooldownKey);
    if (lastAlert && Date.now() - lastAlert < this.config.alertCooldown) {
      return; // Still in cooldown
    }

    // Check rate limit
    const recentAlerts = this.alertHistory.filter(
      a => a.type === alert.type && Date.now() - a.timestamp < 3600000 // 1 hour
    );
    if (recentAlerts.length >= this.config.maxAlertsPerHour) {
      return; // Rate limited
    }

    // Create alert
    const alertData = {
      id: alertKey,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      value: alert.value,
      threshold: alert.threshold,
      timestamp: Date.now(),
      status: 'active',
    };

    // Store alert
    this.alerts.set(alertKey, alertData);
    this.alertHistory.push(alertData);
    this.alertCooldowns.set(cooldownKey, Date.now());

    // Emit alert event
    this.emit('alert', alertData);

    // Send alert notifications
    await this.sendAlertNotifications(alertData);

    this.logger.warn('Alert triggered', alertData);
  }

  async sendAlertNotifications(alert) {
    try {
      // Send to monitoring systems (PagerDuty, Slack, etc.)
      await this.sendToMonitoringSystem(alert);
      
      // Send email notifications for critical alerts
      if (alert.severity === 'critical') {
        await this.sendEmailNotification(alert);
      }
      
      // Send Slack notifications
      await this.sendSlackNotification(alert);
    } catch (error) {
      this.logger.error('Failed to send alert notifications', { error: error.message, alertId: alert.id });
    }
  }

  async sendToMonitoringSystem(alert) {
    // This would integrate with monitoring systems like PagerDuty, DataDog, etc.
    this.logger.info('Alert sent to monitoring system', { alertId: alert.id, type: alert.type });
  }

  async sendEmailNotification(alert) {
    // This would send email notifications
    this.logger.info('Email notification sent', { alertId: alert.id, type: alert.type });
  }

  async sendSlackNotification(alert) {
    // This would send Slack notifications
    this.logger.info('Slack notification sent', { alertId: alert.id, type: alert.type });
  }

  async processPendingAlerts() {
    // Process any pending alerts or cleanup old ones
    const cutoff = Date.now() - 3600000; // 1 hour ago
    const oldAlerts = Array.from(this.alerts.values()).filter(alert => alert.timestamp < cutoff);
    
    for (const alert of oldAlerts) {
      this.alerts.delete(alert.id);
    }
  }

  /**
   * Metrics collection
   */
  startMetricsCollection() {
    setInterval(async () => {
      await this.collectDetailedMetrics();
    }, 300000); // Every 5 minutes
  }

  async collectDetailedMetrics() {
    try {
      const metrics = {
        timestamp: Date.now(),
        performance: this.metrics,
        health: this.serviceHealth,
        alerts: Array.from(this.alerts.values()),
        baselines: this.baselines,
      };

      // Store in Redis
      await this.redis.setex(
        `ai_metrics:${Date.now()}`,
        86400, // 24 hours
        JSON.stringify(metrics)
      );

      this.logger.debug('Detailed metrics collected and stored');
    } catch (error) {
      this.logger.error('Failed to collect detailed metrics', { error: error.message });
    }
  }

  /**
   * Optimization analysis
   */
  startOptimizationAnalysis() {
    setInterval(async () => {
      await this.analyzeOptimizationOpportunities();
    }, 1800000); // Every 30 minutes
  }

  async analyzeOptimizationOpportunities() {
    try {
      const opportunities = [];

      // Analyze cache performance
      if (this.metrics.cacheHitRate < 0.8) {
        opportunities.push({
          type: 'cache_optimization',
          priority: 'high',
          description: 'Cache hit rate is below optimal. Consider increasing cache size or TTL.',
          currentValue: this.metrics.cacheHitRate,
          targetValue: 0.8,
          recommendations: [
            'Increase cache size limits',
            'Extend cache TTL for frequently accessed data',
            'Implement cache warming strategies',
          ],
        });
      }

      // Analyze response times
      if (this.metrics.averageResponseTime > 2000) {
        opportunities.push({
          type: 'performance_optimization',
          priority: 'medium',
          description: 'Average response time is high. Consider optimizing AI models or increasing resources.',
          currentValue: this.metrics.averageResponseTime,
          targetValue: 1000,
          recommendations: [
            'Optimize AI model parameters',
            'Implement request batching',
            'Add more caching layers',
            'Scale up resources',
          ],
        });
      }

      // Analyze memory usage
      if (this.metrics.memoryUsage > 0.7) {
        opportunities.push({
          type: 'memory_optimization',
          priority: 'high',
          description: 'Memory usage is high. Consider implementing memory optimization strategies.',
          currentValue: this.metrics.memoryUsage,
          targetValue: 0.5,
          recommendations: [
            'Implement memory pooling',
            'Add garbage collection triggers',
            'Optimize data structures',
            'Implement memory compression',
          ],
        });
      }

      if (opportunities.length > 0) {
        this.emit('optimizationOpportunities', {
          opportunities,
          timestamp: new Date().toISOString(),
        });

        this.logger.info('Optimization opportunities identified', { count: opportunities.length });
      }
    } catch (error) {
      this.logger.error('Optimization analysis failed', { error: error.message });
    }
  }

  /**
   * Utility methods
   */
  getServiceStats(serviceName) {
    // This would get actual stats from AI services
    // For now, return mock data
    return {
      totalRequests: Math.floor(Math.random() * 1000),
      totalErrors: Math.floor(Math.random() * 10),
      averageResponseTime: Math.random() * 2000,
    };
  }

  calculateWeightedAverage(items) {
    if (items.length === 0) return 0;
    
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight === 0) return 0;
    
    const weightedSum = items.reduce((sum, item) => sum + (item.value * item.weight), 0);
    return weightedSum / totalWeight;
  }

  getMemoryUsage() {
    const used = process.memoryUsage();
    return used.heapUsed / used.heapTotal;
  }

  getCPUUsage() {
    // This would get actual CPU usage
    return Math.random() * 0.5; // Mock data
  }

  getActiveConnections() {
    // This would get actual connection count
    return Math.floor(Math.random() * 100); // Mock data
  }

  async storeMetrics() {
    try {
      await this.redis.setex(
        'ai_monitoring:current_metrics',
        300, // 5 minutes
        JSON.stringify(this.metrics)
      );
    } catch (error) {
      this.logger.warn('Failed to store metrics in Redis', { error: error.message });
    }
  }

  async analyzeTrends() {
    // This would analyze historical data for trends
    return {
      responseTimeTrend: 'stable',
      errorRateTrend: 'decreasing',
      cacheHitRateTrend: 'increasing',
    };
  }

  async detectAnomalies() {
    // This would detect anomalies in the data
    return [];
  }

  async generateInsights(trends, anomalies) {
    // This would generate insights based on trends and anomalies
    return [
      'System performance is stable',
      'Cache hit rate is improving',
      'Error rate is decreasing',
    ];
  }

  /**
   * Public API methods
   */
  getMetrics() {
    return {
      current: this.metrics,
      health: this.serviceHealth,
      alerts: Array.from(this.alerts.values()),
      baselines: this.baselines,
    };
  }

  getAlertHistory(limit = 100) {
    return this.alertHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  async getHistoricalMetrics(timeRange = '1h') {
    try {
      const keys = await this.redis.keys('ai_metrics:*');
      const metrics = [];
      
      for (const key of keys) {
        const data = await this.redis.get(key);
        if (data) {
          metrics.push(JSON.parse(data));
        }
      }
      
      return metrics.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      this.logger.error('Failed to get historical metrics', { error: error.message });
      return [];
    }
  }

  async clearAlerts() {
    this.alerts.clear();
    this.alertHistory = [];
    this.alertCooldowns.clear();
    this.logger.info('All alerts cleared');
  }

  async shutdown() {
    try {
      await this.redis.quit();
      this.logger.info('AI Monitoring System shutdown completed');
    } catch (error) {
      this.logger.error('Error during monitoring system shutdown', { error: error.message });
    }
  }
}

// Create singleton instance
const aiMonitoringSystem = new AIMonitoringSystem();

export { AIMonitoringSystem, aiMonitoringSystem };