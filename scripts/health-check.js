#!/usr/bin/env node
/**
 * Health Check Script
 * Monitors system health and reports status
 */

import { Logger } from 'src/core/logger/index.js';
import EconomyService from 'src/services/economy/index.js';
import UnityService from 'src/services/unity/index.js';

const logger = new Logger('HealthCheck');

class HealthChecker {
  constructor() {
    this.economyService = new EconomyService();
    this.unityService = new UnityService();
  }

  async checkEconomyService() {
    try {
      const report = await this.economyService.generateReport();
      return {
        status: 'healthy',
        data: report.summary,
      };
    } catch (error) {
      logger.error('Economy service check failed', { error: error.message });
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }

  async checkUnityService() {
    try {
      const isAuthenticated = await this.unityService.authenticate();
      return {
        status: isAuthenticated ? 'healthy' : 'unhealthy',
        authenticated: isAuthenticated,
      };
    } catch (error) {
      logger.error('Unity service check failed', { error: error.message });
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }

  async checkSystemResources() {
    try {
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();

      return {
        status: 'healthy',
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        },
        uptime: Math.round(uptime), // seconds
      };
    } catch (error) {
      logger.error('System resources check failed', { error: error.message });
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }

  async runHealthCheck() {
    logger.info('Starting health check...');

    const checks = {
      economy: await this.checkEconomyService(),
      unity: await this.checkUnityService(),
      system: await this.checkSystemResources(),
    };

    const overallStatus = Object.values(checks).every(
      (check) => check.status === 'healthy'
    )
      ? 'healthy'
      : 'unhealthy';

    const healthReport = {
      timestamp: new Date().toISOString(),
      status: overallStatus,
      checks,
    };

    logger.info('Health check completed', { status: overallStatus });

    if (overallStatus === 'unhealthy') {
      logger.warn('System health issues detected', { checks });
      process.exit(1);
    } else {
      logger.info('System is healthy');
      process.exit(0);
    }
  }
}

// Run health check
const checker = new HealthChecker();
checker.runHealthCheck().catch((error) => {
  logger.error('Health check failed', { error: error.message });
  process.exit(1);
});
