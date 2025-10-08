/**
 * Economy Service
 * Handles game economy data management and validation
 */

import { Logger } from '../../core/logger/index.js';
import { writeFile, readFile } from 'fs/promises';
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
      throw new ServiceError(
        `Failed to load economy data: ${error.message}`,
        'EconomyService'
      );
    }
  }

  /**
   * Load CSV data from file
   */
  async loadCSVData(filename) {
    try {
      const filePath = join(this.dataPath, filename);
      const content = await readFile(filePath, 'utf-8');
      const lines = content.trim().split('\n');

      if (lines.length < 2) {
        return [];
      }

      const headers = lines[0].split(',').map((h) => h.trim());
      const data = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim());
        if (values.length === headers.length) {
          const item = {};
          headers.forEach((header, index) => {
            item[header] = this.parseValue(values[index]);
          });
          data.push(item);
        }
      }

      return data;
    } catch (error) {
      logger.error(`Failed to load CSV data from ${filename}`, {
        error: error.message,
      });
      return [];
    }
  }

  /**
   * Parse CSV value based on type
   */
  parseValue(value) {
    // Try to parse as number
    if (!isNaN(value) && value !== '') {
      return Number(value);
    }

    // Try to parse as boolean
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    // Return as string
    return value;
  }

  /**
   * Validate economy data with common fields
   */
  validateEconomyData(data, type, requiredFields, fieldMappings) {
    const validItems = [];

    for (const item of data) {
      if (this.hasRequiredFields(item, requiredFields)) {
        const validatedItem = { id: item.id, name: item.name, type: item.type };

        // Apply field mappings with defaults
        for (const [field, mapping] of Object.entries(fieldMappings)) {
          if (mapping.transform) {
            validatedItem[field] = mapping.transform(
              item[mapping.source || field]
            );
          } else {
            validatedItem[field] = item[field] || mapping.default;
          }
        }

        validItems.push(validatedItem);
      } else {
        logger.warn(`Invalid ${type} data`, { item });
      }
    }

    return validItems;
  }

  /**
   * Validate currency data
   */
  validateCurrencies(currencies) {
    const requiredFields = ['id', 'name', 'type'];
    const fieldMappings = {
      description: { default: '' },
      initial: { source: 'initial', default: 0 },
      maximum: { source: 'maximum', default: 999999 },
      isTradable: { default: false },
      isConsumable: { default: false },
    };

    return this.validateEconomyData(
      currencies,
      'currency',
      requiredFields,
      fieldMappings
    );
  }

  /**
   * Validate inventory data
   */
  validateInventory(inventory) {
    const requiredFields = ['id', 'name', 'type'];
    const fieldMappings = {
      description: { default: '' },
      rarity: { default: 'common' },
      category: { default: 'general' },
      isTradable: {
        source: 'tradable',
        transform: (val) => val === 'True' || val === true,
      },
      isConsumable: { default: false },
      maxStackSize: {
        source: 'stackable',
        transform: (val) => (val === 'True' || val === true ? 999 : 1),
      },
      iconPath: { default: '' },
    };

    return this.validateEconomyData(
      inventory,
      'inventory',
      requiredFields,
      fieldMappings
    );
  }

  /**
   * Validate catalog data
   */
  validateCatalog(catalog) {
    const requiredFields = ['id', 'name', 'cost_currency', 'cost_amount'];
    const fieldMappings = {
      description: { default: '' },
      type: { default: 'item' },
      cost: { source: 'cost_amount', transform: (val) => parseInt(val) || 0 },
      currency: { source: 'cost_currency', default: 'coins' },
      rewards: { source: 'rewards', default: '' },
      category: { default: 'general' },
      rarity: { default: 'common' },
      isActive: { transform: (value) => value !== false },
      isLimitedTime: { default: false },
      startDate: { default: null },
      endDate: { default: null },
      iconPath: { default: '' },
    };

    return this.validateEconomyData(
      catalog,
      'catalog',
      requiredFields,
      fieldMappings
    );
  }

  /**
   * Check if object has required fields
   */
  hasRequiredFields(obj, requiredFields) {
    return requiredFields.every(
      (field) =>
        Object.prototype.hasOwnProperty.call(obj, field) && obj[field] !== ''
    );
  }

  /**
   * Generate economy report
   */
  async generateReport() {
    try {
      const economyData = await this.loadEconomyData();

      const report = {
        timestamp: new Date().toISOString(),
        summary: {
          totalCurrencies: economyData.currencies.length,
          totalInventoryItems: economyData.inventory.length,
          totalCatalogItems: economyData.catalog.length,
        },
        currencies: economyData.currencies,
        inventory: economyData.inventory,
        catalog: economyData.catalog,
        validation: {
          currenciesValid: economyData.currencies.length > 0,
          inventoryValid: economyData.inventory.length > 0,
          catalogValid: economyData.catalog.length > 0,
        },
      };

      logger.info('Economy report generated', { summary: report.summary });
      return report;
    } catch (error) {
      logger.error('Failed to generate economy report', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Save economy data to JSON
   */
  async saveToJSON(economyData, filename = 'economy_data.json') {
    try {
      const filePath = join(this.dataPath, filename);
      await writeFile(filePath, JSON.stringify(economyData, null, 2));
      logger.info(`Economy data saved to ${filename}`);
    } catch (error) {
      logger.error(`Failed to save economy data to ${filename}`, {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get cached economy data
   */
  getCachedData(key) {
    return this.cache.get(key);
  }

  /**
   * Set cached economy data
   */
  setCachedData(key, data, ttl = 300000) {
    // 5 minutes default TTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Re-export the new EconomyService
export { default } from './EconomyService.js';
