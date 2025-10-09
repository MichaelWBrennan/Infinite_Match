/**
 * Health Check Workflow Step
 * Validates system health before proceeding
 */

import { Logger } from 'core/logger/index.js';
import { getService } from 'core/services/ServiceRegistry.js';

const logger = new Logger('HealthCheckStep');

export class HealthCheckStep {
  constructor() {
    this.name = 'healthCheck';
  }

  async execute(state) {
    logger.info('Starting health check...');

    try {
      const economyService = getService('economyService');
      const unityService = getService('unityService');

      // Check economy service
      const economyData = await economyService.loadEconomyData();
      logger.info('Economy service health check passed', {
        currencies: economyData.currencies.length,
        inventory: economyData.inventory.length,
        catalog: economyData.catalog.length,
      });

      // Check Unity service
      const unityAuthenticated = await unityService.authenticate();
      if (!unityAuthenticated) {
        throw new Error('Unity service authentication failed');
      }
      logger.info('Unity service health check passed');

      // Check system resources
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();

      const healthStatus = {
        economy: {
          status: 'healthy',
          data: economyData.summary || {
            totalCurrencies: economyData.currencies.length,
            totalInventoryItems: economyData.inventory.length,
            totalCatalogItems: economyData.catalog.length,
          },
        },
        unity: {
          status: unityAuthenticated ? 'healthy' : 'unhealthy',
          authenticated: unityAuthenticated,
        },
        system: {
          status: 'healthy',
          memory: {
            rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          },
          uptime: Math.round(uptime), // seconds
        },
      };

      const overallStatus = Object.values(healthStatus).every(
        (check) => check.status === 'healthy'
      )
        ? 'healthy'
        : 'unhealthy';

      const result = {
        status: overallStatus,
        checks: healthStatus,
        timestamp: new Date().toISOString(),
      };

      // Store in state for other steps
      state.set('healthStatus', result);
      state.set('economyData', economyData);

      if (overallStatus === 'unhealthy') {
        throw new Error('System health check failed');
      }

      logger.info('Health check completed successfully');
      return result;
    } catch (error) {
      logger.error('Health check failed', { error: error.message });
      throw error;
    }
  }
}

export default HealthCheckStep;
