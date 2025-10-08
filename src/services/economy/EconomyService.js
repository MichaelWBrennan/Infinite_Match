/**
 * Economy Service
 * Handles game economy data management and validation
 */

import { Logger } from '../../core/logger/index.js';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { AppConfig } from '../../core/config/index.js';
import { ServiceError } from '../../core/errors/ErrorHandler.js';

const logger = new Logger('EconomyService');

class EconomyService {
  constructor(dataLoader, validator, cacheManager) {
    this.dataPath = AppConfig.paths.config; // Direct path to economy directory
    this.dataLoader = dataLoader;
    this.validator = validator;
    this.cacheManager = cacheManager;
  }

  /**
   * Load economy data from CSV files
   */
  async loadEconomyData() {
    const cacheKey = 'economy_data';
    
    // Check cache first
    const cached = this.cacheManager.get(cacheKey);
    if (cached) {
      logger.debug('Returning cached economy data');
      return cached;
    }

    try {
      const filePaths = [
        join(this.dataPath, 'currencies.csv'),
        join(this.dataPath, 'inventory.csv'),
        join(this.dataPath, 'catalog.csv'),
      ];

      const files = await this.dataLoader.loadFiles(filePaths);
      
      const economyData = {
        currencies: this.validator.validateCurrencies(files.currencies || []),
        inventory: this.validator.validateInventory(files.inventory || []),
        catalog: this.validator.validateCatalog(files.catalog || []),
        timestamp: new Date().toISOString(),
      };

      logger.info('Economy data loaded successfully', {
        currencies: economyData.currencies.length,
        inventory: economyData.inventory.length,
        catalog: economyData.catalog.length,
      });

      // Cache the result
      this.cacheManager.set(cacheKey, economyData, 300000); // 5 minutes

      return economyData;
    } catch (error) {
      logger.error('Failed to load economy data', { error: error.message });
      throw new ServiceError(`Failed to load economy data: ${error.message}`, 'EconomyService');
    }
  }

  /**
   * Generate economy report
   */
  async generateReport() {
    try {
      const data = await this.loadEconomyData();
      
      const report = {
        timestamp: new Date().toISOString(),
        summary: {
          totalCurrencies: data.currencies.length,
          totalInventoryItems: data.inventory.length,
          totalCatalogItems: data.catalog.length,
        },
        currencies: data.currencies.map(c => ({
          id: c.id,
          name: c.name,
          type: c.type,
          initial: c.initial || 0,
          maximum: c.maximum || 999999,
        })),
        inventory: data.inventory.map(i => ({
          id: i.id,
          name: i.name,
          type: i.type,
          rarity: i.rarity || 'common',
          tradable: i.isTradable || false,
        })),
        catalog: data.catalog.map(c => ({
          id: c.id,
          name: c.name,
          cost: c.cost || 0,
          currency: c.currency || 'coins',
          type: c.type || 'item',
        })),
      };

      logger.info('Economy report generated', report.summary);
      return report;
    } catch (error) {
      logger.error('Failed to generate economy report', { error: error.message });
      throw new ServiceError(`Failed to generate economy report: ${error.message}`, 'EconomyService');
    }
  }

  /**
   * Save economy data to file
   */
  async saveEconomyData(data, filename = 'economy_data.json') {
    try {
      const filePath = join(this.dataPath, filename);
      await writeFile(filePath, JSON.stringify(data, null, 2));
      logger.info(`Economy data saved to ${filePath}`);
    } catch (error) {
      logger.error('Failed to save economy data', { error: error.message });
      throw new ServiceError(`Failed to save economy data: ${error.message}`, 'EconomyService');
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cacheManager.delete('economy_data');
    logger.debug('Economy data cache cleared');
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      cacheStats: this.cacheManager.getStats(),
      dataPath: this.dataPath,
    };
  }
}

export default EconomyService;