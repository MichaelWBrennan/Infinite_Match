#!/usr/bin/env node
/**
 * Economy Deployment Script
 * Deploys economy data to Unity Services
 */

import { Logger } from 'src/core/logger/index.js';
import EconomyService from 'src/services/economy/index.js';
import UnityService from 'src/services/unity/index.js';

const logger = new Logger('EconomyDeploy');

class EconomyDeployer {
  constructor() {
    this.economyService = new EconomyService();
    this.unityService = new UnityService();
  }

  async deploy() {
    try {
      logger.info('Starting economy deployment...');

      // Load economy data
      const economyData = await this.economyService.loadEconomyData();
      logger.info('Economy data loaded', {
        currencies: economyData.currencies.length,
        inventory: economyData.inventory.length,
        catalog: economyData.catalog.length,
      });

      // Deploy to Unity Services
      const result = await this.unityService.deployEconomyData(economyData);

      logger.info('Economy deployment completed', {
        currenciesDeployed: result.currencies.length,
        inventoryDeployed: result.inventory.length,
        catalogDeployed: result.catalog.length,
        errors: result.errors.length,
      });

      if (result.errors.length > 0) {
        logger.warn('Deployment completed with errors', {
          errors: result.errors,
        });
      }

      return result;
    } catch (error) {
      logger.error('Economy deployment failed', { error: error.message });
      throw error;
    }
  }
}

// Run deployment
const deployer = new EconomyDeployer();
deployer
  .deploy()
  .then(() => {
    logger.info('Economy deployment script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Economy deployment script failed', { error: error.message });
    process.exit(1);
  });
