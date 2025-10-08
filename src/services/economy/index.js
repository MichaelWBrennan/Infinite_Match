/**
 * Economy Service
 * Handles game economy data management and validation
 */

import { Logger } from '../../core/logger/index.js';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { AppConfig } from '../../core/config/index.js';

const logger = new Logger('EconomyService');

class EconomyService {
  constructor() {
    this.dataPath = join(AppConfig.paths.config, 'economy');
    this.cache = new Map();
  }

  /**
   * Load economy data from CSV files
   */
  async loadEconomyData() {
    try {
      const currencies = await this.loadCSVData('currencies.csv');
      const inventory = await this.loadCSVData('inventory.csv');
      const catalog = await this.loadCSVData('catalog.csv');

      const economyData = {
        currencies: this.validateCurrencies(currencies),
        inventory: this.validateInventory(inventory),
        catalog: this.validateCatalog(catalog),
        timestamp: new Date().toISOString(),
      };

      logger.info('Economy data loaded successfully', {
        currencies: economyData.currencies.length,
        inventory: economyData.inventory.length,
        catalog: economyData.catalog.length,
      });

      return economyData;
    } catch (error) {
      logger.error('Failed to load economy data', { error: error.message });
      throw error;
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

      const headers = lines[0].split(',').map(h => h.trim());
      const data = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
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
      logger.error(`Failed to load CSV data from ${filename}`, { error: error.message });
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
   * Validate currency data
   */
  validateCurrencies(currencies) {
    const requiredFields = ['id', 'name', 'type'];
    const validCurrencies = [];

    for (const currency of currencies) {
      if (this.hasRequiredFields(currency, requiredFields)) {
        validCurrencies.push({
          id: currency.id,
          name: currency.name,
          type: currency.type,
          description: currency.description || '',
          isTradable: currency.isTradable || false,
          isConsumable: currency.isConsumable || false,
        });
      } else {
        logger.warn('Invalid currency data', { currency });
      }
    }

    return validCurrencies;
  }

  /**
   * Validate inventory data
   */
  validateInventory(inventory) {
    const requiredFields = ['id', 'name', 'type'];
    const validItems = [];

    for (const item of inventory) {
      if (this.hasRequiredFields(item, requiredFields)) {
        validItems.push({
          id: item.id,
          name: item.name,
          type: item.type,
          description: item.description || '',
          rarity: item.rarity || 'common',
          category: item.category || 'general',
          isTradable: item.isTradable || false,
          isConsumable: item.isConsumable || false,
          maxStackSize: item.maxStackSize || 1,
          iconPath: item.iconPath || '',
        });
      } else {
        logger.warn('Invalid inventory item data', { item });
      }
    }

    return validItems;
  }

  /**
   * Validate catalog data
   */
  validateCatalog(catalog) {
    const requiredFields = ['id', 'name', 'type', 'cost'];
    const validItems = [];

    for (const item of catalog) {
      if (this.hasRequiredFields(item, requiredFields)) {
        validItems.push({
          id: item.id,
          name: item.name,
          type: item.type,
          description: item.description || '',
          cost: this.parseValue(item.cost),
          currency: item.currency || 'gems',
          category: item.category || 'general',
          rarity: item.rarity || 'common',
          isActive: item.isActive !== false,
          isLimitedTime: item.isLimitedTime || false,
          startDate: item.startDate || null,
          endDate: item.endDate || null,
          iconPath: item.iconPath || '',
        });
      } else {
        logger.warn('Invalid catalog item data', { item });
      }
    }

    return validItems;
  }

  /**
   * Check if object has required fields
   */
  hasRequiredFields(obj, requiredFields) {
    return requiredFields.every(field => obj.hasOwnProperty(field) && obj[field] !== '');
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
      logger.error('Failed to generate economy report', { error: error.message });
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
      logger.error(`Failed to save economy data to ${filename}`, { error: error.message });
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
  setCachedData(key, data, ttl = 300000) { // 5 minutes default TTL
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

export default EconomyService;