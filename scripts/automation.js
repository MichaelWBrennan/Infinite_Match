#!/usr/bin/env node
/**
 * Unified Automation Script
 * Replaces all redundant automation scripts with a single, efficient solution
 */

import { Logger } from 'src/core/logger/index.js';
import EconomyService from 'src/services/economy/index.js';
import UnityService from 'src/services/unity/index.js';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { AppConfig } from 'src/core/config/index.js';

const logger = new Logger('Automation');

class UnifiedAutomation {
  constructor() {
    this.economyService = new EconomyService();
    this.unityService = new UnityService();
    this.results = {
      economy: { success: false, errors: [] },
      unity: { success: false, errors: [] },
      cloudCode: { success: false, errors: [] },
      remoteConfig: { success: false, errors: [] },
    };
  }

  /**
   * Run complete automation workflow
   */
  async run() {
    try {
      logger.info('Starting unified automation...');

      // Step 1: Validate system health
      await this.validateSystemHealth();

      // Step 2: Process economy data
      await this.processEconomyData();

      // Step 3: Deploy to Unity Services
      await this.deployToUnity();

      // Step 4: Generate report
      await this.generateReport();

      logger.info('Unified automation completed successfully');
      return true;
    } catch (error) {
      logger.error('Unified automation failed', { error: error.message });
      return false;
    }
  }

  /**
   * Validate system health
   */
  async validateSystemHealth() {
    logger.info('Validating system health...');

    // Check Unity authentication
    const unityAuth = await this.unityService.authenticate();
    if (!unityAuth) {
      throw new Error('Unity Services authentication failed');
    }

    // Check economy data
    const economyData = await this.economyService.loadEconomyData();
    if (
      !economyData.currencies.length &&
      !economyData.inventory.length &&
      !economyData.catalog.length
    ) {
      throw new Error('No economy data found');
    }

    logger.info('System health validation passed');
  }

  /**
   * Process economy data
   */
  async processEconomyData() {
    try {
      logger.info('Processing economy data...');

      const economyData = await this.economyService.loadEconomyData();
      const report = await this.economyService.generateReport();

      // Save processed data
      await this.economyService.saveToJSON(
        economyData,
        'processed_economy_data.json'
      );

      this.results.economy = {
        success: true,
        currencies: economyData.currencies.length,
        inventory: economyData.inventory.length,
        catalog: economyData.catalog.length,
      };

      logger.info('Economy data processing completed', this.results.economy);
    } catch (error) {
      this.results.economy.errors.push(error.message);
      logger.error('Economy data processing failed', { error: error.message });
    }
  }

  /**
   * Deploy to Unity Services
   */
  async deployToUnity() {
    try {
      logger.info('Deploying to Unity Services...');

      // Deploy economy data
      const economyData = await this.economyService.loadEconomyData();
      const economyResult =
        await this.unityService.deployEconomyData(economyData);

      this.results.unity = {
        success: true,
        currencies: economyResult.currencies.length,
        inventory: economyResult.inventory.length,
        catalog: economyResult.catalog.length,
        errors: economyResult.errors.length,
      };

      // Deploy Cloud Code (simulated)
      await this.deployCloudCode();

      // Deploy Remote Config
      await this.deployRemoteConfig();

      logger.info('Unity Services deployment completed', this.results.unity);
    } catch (error) {
      this.results.unity.errors.push(error.message);
      logger.error('Unity Services deployment failed', {
        error: error.message,
      });
    }
  }

  /**
   * Deploy Cloud Code functions
   */
  async deployCloudCode() {
    try {
      logger.info('Deploying Cloud Code functions...');

      // TODO: Implement actual Cloud Code deployment
      // This would read Cloud Code files and deploy them

      this.results.cloudCode = {
        success: true,
        deployed: 0,
        errors: [],
      };

      logger.info('Cloud Code deployment completed (simulated)');
    } catch (error) {
      this.results.cloudCode.errors.push(error.message);
      logger.error('Cloud Code deployment failed', { error: error.message });
    }
  }

  /**
   * Deploy Remote Config
   */
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

      await this.unityService.updateRemoteConfig(configData);

      this.results.remoteConfig = {
        success: true,
        deployed: true,
        errors: [],
      };

      logger.info('Remote Config deployment completed');
    } catch (error) {
      this.results.remoteConfig.errors.push(error.message);
      logger.error('Remote Config deployment failed', { error: error.message });
    }
  }

  /**
   * Generate automation report
   */
  async generateReport() {
    try {
      logger.info('Generating automation report...');

      const report = {
        timestamp: new Date().toISOString(),
        status: this.getOverallStatus(),
        results: this.results,
        summary: {
          totalSteps: Object.keys(this.results).length,
          successfulSteps: Object.values(this.results).filter((r) => r.success)
            .length,
          failedSteps: Object.values(this.results).filter((r) => !r.success)
            .length,
        },
      };

      // Save report
      const reportsDir = join(AppConfig.paths.root, 'reports');
      await mkdir(reportsDir, { recursive: true });

      const reportPath = join(
        reportsDir,
        `automation_report_${Date.now()}.json`
      );
      await writeFile(reportPath, JSON.stringify(report, null, 2));

      logger.info('Automation report generated', {
        path: reportPath,
        status: report.status,
        summary: report.summary,
      });

      return report;
    } catch (error) {
      logger.error('Failed to generate automation report', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get overall automation status
   */
  getOverallStatus() {
    const allSuccessful = Object.values(this.results).every(
      (result) => result.success
    );
    return allSuccessful ? 'success' : 'partial';
  }
}

// Run automation
const automation = new UnifiedAutomation();
automation
  .run()
  .then((success) => {
    if (success) {
      logger.info('Automation completed successfully');
      process.exit(0);
    } else {
      logger.error('Automation completed with errors');
      process.exit(1);
    }
  })
  .catch((error) => {
    logger.error('Automation failed', { error: error.message });
    process.exit(1);
  });
