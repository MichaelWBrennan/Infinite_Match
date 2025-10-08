#!/usr/bin/env node
/**
 * Unity Services Deployment Script
 * Deploys all Unity Cloud Services configurations
 */

import { Logger } from '../src/core/logger/index.js';
import { registerServices, getService } from '../src/core/services/ServiceRegistry.js';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { AppConfig } from '../src/core/config/index.js';

const logger = new Logger('UnityDeploy');

class UnityDeployer {
  constructor() {
    // Register services
    registerServices();
    
    this.economyService = getService('economyService');
    this.unityService = getService('unityService');
  }

  async deployEconomy() {
    try {
      logger.info('Deploying economy data...');
      const economyData = await this.economyService.loadEconomyData();
      const result = await this.unityService.deployEconomyData(economyData);

      logger.info('Economy deployment completed', {
        currencies: result.currencies.length,
        inventory: result.inventory.length,
        catalog: result.catalog.length,
        errors: result.errors.length,
      });

      return result;
    } catch (error) {
      logger.error('Economy deployment failed', { error: error.message });
      throw error;
    }
  }

  async deployCloudCode() {
    try {
      logger.info('Deploying Cloud Code functions...');

      // TODO: Implement Cloud Code deployment
      // This would read Cloud Code files and deploy them
      logger.info('Cloud Code deployment completed (simulated)');

      return { deployed: 0, errors: [] };
    } catch (error) {
      logger.error('Cloud Code deployment failed', { error: error.message });
      throw error;
    }
  }

  async deployRemoteConfig() {
    try {
      logger.info('Deploying Remote Config...');

      // Load remote config
      const configPath = join(
        AppConfig.paths.config,
        'remote',
        'game_config.json'
      );
      const configData = JSON.parse(await readFile(configPath, 'utf-8'));

      const result = await this.unityService.updateRemoteConfig(configData);

      logger.info('Remote Config deployment completed');

      return result;
    } catch (error) {
      logger.error('Remote Config deployment failed', { error: error.message });
      throw error;
    }
  }

  async deployAll() {
    try {
      logger.info('Starting Unity Services deployment...');

      const results = {
        economy: await this.deployEconomy(),
        cloudCode: await this.deployCloudCode(),
        remoteConfig: await this.deployRemoteConfig(),
      };

      logger.info('Unity Services deployment completed', { results });

      return results;
    } catch (error) {
      logger.error('Unity Services deployment failed', {
        error: error.message,
      });
      throw error;
    }
  }
}

// Run deployment
const deployer = new UnityDeployer();
deployer
  .deployAll()
  .then(() => {
    logger.info('Unity deployment script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Unity deployment script failed', { error: error.message });
    process.exit(1);
  });
