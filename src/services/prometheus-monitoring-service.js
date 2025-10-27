import { Logger } from '../core/logger/index.js';
import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';
import prometheusApiMetrics from 'prometheus-api-metrics';

/**
 * Prometheus Monitoring Service
 * Replaces Datadog with self-hosted Prometheus monitoring
 */
class PrometheusMonitoringService {
  constructor() {
    this.logger = new Logger('PrometheusMonitoringService');
    
    // Collect default metrics
    collectDefaultMetrics({ register });
    
    // Custom metrics
    this.gameEventsTotal = new Counter({
      name: 'game_events_total',
      help: 'Total number of game events',
      labelNames: ['event_type', 'player_cohort', 'platform']
    });

    this.gameSessionsTotal = new Counter({
      name: 'game_sessions_total',
      help: 'Total number of game sessions',
      labelNames: ['platform', 'session_duration_bucket']
    });

    this.playerLevels = new Gauge({
      name: 'player_levels',
      help: 'Current player levels',
      labelNames: ['player_id', 'cohort']
    });

    this.gamePerformance = new Histogram({
      name: 'game_performance_duration_seconds',
      help: 'Game performance metrics',
      labelNames: ['metric_name', 'level', 'platform'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60]
    });

    this.apiRequests = new Counter({
      name: 'api_requests_total',
      help: 'Total number of API requests',
      labelNames: ['method', 'endpoint', 'status_code']
    });

    this.apiDuration = new Histogram({
      name: 'api_request_duration_seconds',
      help: 'API request duration in seconds',
      labelNames: ['method', 'endpoint'],
      buckets: [0.1, 0.5, 1, 2, 5, 10]
    });

    this.databaseConnections = new Gauge({
      name: 'database_connections_active',
      help: 'Number of active database connections'
    });

    this.redisConnections = new Gauge({
      name: 'redis_connections_active',
      help: 'Number of active Redis connections'
    });

    this.isInitialized = false;
    this.metrics = {
      requests: 0,
      errors: 0,
      latency: [],
    };
  }

  /**
   * Initialize monitoring service
   */
  async initialize() {
    try {
      this.logger.info('Initializing Prometheus monitoring service...');
      
      // Register custom metrics
      register.registerMetric(this.gameEventsTotal);
      register.registerMetric(this.gameSessionsTotal);
      register.registerMetric(this.playerLevels);
      register.registerMetric(this.gamePerformance);
      register.registerMetric(this.apiRequests);
      register.registerMetric(this.apiDuration);
      register.registerMetric(this.databaseConnections);
      register.registerMetric(this.redisConnections);

      this.isInitialized = true;
      this.logger.info('Prometheus monitoring service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize monitoring service:', error);
      throw error;
    }
  }

  /**
   * Track game events (replaces Datadog events)
   */
  trackGameEvent(eventType, playerCohort = 'unknown', platform = 'unknown') {
    try {
      this.gameEventsTotal.inc({
        event_type: eventType,
        player_cohort: playerCohort,
        platform: platform
      });
      
      this.metrics.requests++;
    } catch (error) {
      this.logger.error('Failed to track game event:', error);
    }
  }

  /**
   * Track game sessions
   */
  trackGameSession(platform = 'unknown', sessionDuration = 0) {
    try {
      this.gameSessionsTotal.inc({
        platform: platform,
        session_duration_bucket: this.getDurationBucket(sessionDuration)
      });
    } catch (error) {
      this.logger.error('Failed to track game session:', error);
    }
  }

  /**
   * Track player level
   */
  trackPlayerLevel(playerId, level, cohort = 'unknown') {
    try {
      this.playerLevels.set({
        player_id: playerId,
        cohort: cohort
      }, level);
    } catch (error) {
      this.logger.error('Failed to track player level:', error);
    }
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metricName, value, level = 'unknown', platform = 'unknown') {
    try {
      this.gamePerformance.observe({
        metric_name: metricName,
        level: level,
        platform: platform
      }, value);
    } catch (error) {
      this.logger.error('Failed to track performance:', error);
    }
  }

  /**
   * Track API requests
   */
  trackApiRequest(method, endpoint, statusCode) {
    try {
      this.apiRequests.inc({
        method: method,
        endpoint: endpoint,
        status_code: statusCode.toString()
      });
    } catch (error) {
      this.logger.error('Failed to track API request:', error);
    }
  }

  /**
   * Track API duration
   */
  trackApiDuration(method, endpoint, duration) {
    try {
      this.apiDuration.observe({
        method: method,
        endpoint: endpoint
      }, duration);
    } catch (error) {
      this.logger.error('Failed to track API duration:', error);
    }
  }

  /**
   * Track database connections
   */
  trackDatabaseConnections(count) {
    try {
      this.databaseConnections.set(count);
    } catch (error) {
      this.logger.error('Failed to track database connections:', error);
    }
  }

  /**
   * Track Redis connections
   */
  trackRedisConnections(count) {
    try {
      this.redisConnections.set(count);
    } catch (error) {
      this.logger.error('Failed to track Redis connections:', error);
    }
  }

  /**
   * Get duration bucket for histogram
   */
  getDurationBucket(duration) {
    if (duration < 60) return '0-60s';
    if (duration < 300) return '1-5m';
    if (duration < 900) return '5-15m';
    if (duration < 1800) return '15-30m';
    if (duration < 3600) return '30-60m';
    return '60m+';
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics() {
    try {
      return await register.metrics();
    } catch (error) {
      this.logger.error('Failed to get metrics:', error);
      throw error;
    }
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    return {
      status: this.isInitialized ? 'healthy' : 'unhealthy',
      metrics: {
        requests: this.metrics.requests,
        errors: this.metrics.errors,
        averageLatency: this.metrics.latency.length > 0 
          ? this.metrics.latency.reduce((a, b) => a + b, 0) / this.metrics.latency.length 
          : 0,
        errorRate: this.metrics.requests > 0 
          ? (this.metrics.errors / this.metrics.requests) * 100 
          : 0,
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Record latency
   */
  recordLatency(latency) {
    this.metrics.latency.push(latency);
    if (this.metrics.latency.length > 1000) {
      this.metrics.latency = this.metrics.latency.slice(-1000);
    }
  }

  /**
   * Record error
   */
  recordError() {
    this.metrics.errors++;
  }

  /**
   * Get monitoring dashboard data
   */
  async getDashboardData() {
    try {
      const metrics = await this.getMetrics();
      
      return {
        metrics: metrics,
        health: this.getHealthStatus(),
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get dashboard data:', error);
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    try {
      register.clear();
      this.logger.info('Prometheus monitoring service cleaned up');
    } catch (error) {
      this.logger.error('Error during cleanup:', error);
    }
  }
}

export default new PrometheusMonitoringService();