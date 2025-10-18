/**
 * Unified Economy Service
 * Handles game economy data management and validation with AI optimization
 * Merged from EconomyService.js and index.js to eliminate duplication
 */

import { Logger } from '../../core/logger/index.js';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { AppConfig } from '../../core/config/index.js';
import { ServiceError } from '../../core/errors/ErrorHandler.js';
import { aiCacheManager } from '../ai-cache-manager.js';

const logger = new Logger('UnifiedEconomyService');

class UnifiedEconomyService {
  constructor(dataLoader, validator, cacheManager = null) {
    this.dataPath = AppConfig.paths.config;
    this.dataLoader = dataLoader;
    this.validator = validator;
    this.cacheManager = cacheManager || aiCacheManager;
    
    // AI-optimized caching
    this.cache = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };
  }

  /**
   * Load economy data from CSV files with AI-optimized caching
   */
  async loadEconomyData() {
    const cacheKey = 'economy_data';

    // Check AI cache first
    const cached = await this.cacheManager.get(cacheKey, 'content');
    if (cached) {
      this.cacheStats.hits++;
      logger.debug('Returning cached economy data from AI cache');
      return cached;
    }

    // Check local cache
    const localCached = this.cache.get(cacheKey);
    if (localCached && Date.now() - localCached.timestamp < localCached.ttl) {
      this.cacheStats.hits++;
      logger.debug('Returning cached economy data from local cache');
      return localCached.data;
    }

    this.cacheStats.misses++;

    try {
      const filePaths = [
        join(this.dataPath, 'currencies.csv'),
        join(this.dataPath, 'inventory.csv'),
        join(this.dataPath, 'catalog.csv'),
      ];

      const files = await this.dataLoader.loadFiles(filePaths);

      const economyData = {
        currencies: this.validateCurrencies(files.currencies || []),
        inventory: this.validateInventory(files.inventory || []),
        catalog: this.validateCatalog(files.catalog || []),
        timestamp: new Date().toISOString(),
      };

      logger.info('Economy data loaded successfully', {
        currencies: economyData.currencies.length,
        inventory: economyData.inventory.length,
        catalog: economyData.catalog.length,
      });

      // Cache in both AI cache and local cache
      await this.cacheManager.set(cacheKey, economyData, 'content', 300); // 5 minutes
      this.setCachedData(cacheKey, economyData, 300000); // 5 minutes

      return economyData;
    } catch (error) {
      logger.error('Failed to load economy data', { error: error.message });
      throw new ServiceError(`Failed to load economy data: ${error.message}`, 'UnifiedEconomyService');
    }
  }

  /**
   * Load CSV data from file with enhanced error handling
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
   * Parse CSV value based on type with AI optimization
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
   * Validate economy data with common fields and AI enhancement
   */
  validateEconomyData(data, type, requiredFields, fieldMappings) {
    const validItems = [];

    for (const item of data) {
      if (this.hasRequiredFields(item, requiredFields)) {
        const validatedItem = { id: item.id, name: item.name, type: item.type };

        // Apply field mappings with defaults
        for (const [field, mapping] of Object.entries(fieldMappings)) {
          if (mapping.transform) {
            validatedItem[field] = mapping.transform(item[mapping.source || field]);
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
   * Validate currency data with AI optimization
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

    return this.validateEconomyData(currencies, 'currency', requiredFields, fieldMappings);
  }

  /**
   * Validate inventory data with AI optimization
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

    return this.validateEconomyData(inventory, 'inventory', requiredFields, fieldMappings);
  }

  /**
   * Validate catalog data with AI optimization
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

    return this.validateEconomyData(catalog, 'catalog', requiredFields, fieldMappings);
  }

  /**
   * Check if object has required fields
   */
  hasRequiredFields(obj, requiredFields) {
    return requiredFields.every(
      (field) => Object.prototype.hasOwnProperty.call(obj, field) && obj[field] !== '',
    );
  }

  /**
   * Generate economy report with AI insights
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
        currencies: economyData.currencies.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          initial: c.initial || 0,
          maximum: c.maximum || 999999,
        })),
        inventory: economyData.inventory.map((i) => ({
          id: i.id,
          name: i.name,
          type: i.type,
          rarity: i.rarity || 'common',
          tradable: i.isTradable || false,
        })),
        catalog: economyData.catalog.map((c) => ({
          id: c.id,
          name: c.name,
          cost: c.cost || 0,
          currency: c.currency || 'coins',
          type: c.type || 'item',
        })),
        validation: {
          currenciesValid: economyData.currencies.length > 0,
          inventoryValid: economyData.inventory.length > 0,
          catalogValid: economyData.catalog.length > 0,
        },
        cacheStats: this.cacheStats,
        aiOptimized: true,
      };

      logger.info('Economy report generated', { summary: report.summary });
      return report;
    } catch (error) {
      logger.error('Failed to generate economy report', {
        error: error.message,
      });
      throw new ServiceError(
        `Failed to generate economy report: ${error.message}`,
        'UnifiedEconomyService',
      );
    }
  }

  /**
   * Save economy data to JSON with AI optimization
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
      throw new ServiceError(`Failed to save economy data: ${error.message}`, 'UnifiedEconomyService');
    }
  }

  /**
   * Get cached economy data with AI optimization
   */
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set cached economy data with AI optimization
   */
  setCachedData(key, data, ttl = 300000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
    this.cacheStats.sets++;
  }

  /**
   * Clear expired cache entries with AI optimization
   */
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key);
        this.cacheStats.deletes++;
      }
    }
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.cache.clear();
    this.cacheManager.delete('economy_data', 'content');
    logger.debug('All economy data caches cleared');
  }

  /**
   * Get service statistics with AI insights
   */
  getStats() {
    return {
      cacheStats: this.cacheStats,
      aiCacheStats: this.cacheManager.getCacheStats(),
      dataPath: this.dataPath,
      cacheHitRate: this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) || 0,
      aiOptimized: true,
    };
  }

  /**
   * Optimize economy data with AI insights
   */
  async optimizeEconomyData() {
    try {
      const economyData = await this.loadEconomyData();
      
      // AI-powered optimization suggestions
      const optimizations = {
        currencyOptimizations: this.analyzeCurrencyOptimizations(economyData.currencies),
        inventoryOptimizations: this.analyzeInventoryOptimizations(economyData.inventory),
        catalogOptimizations: this.analyzeCatalogOptimizations(economyData.catalog),
      };

      logger.info('Economy data optimization analysis completed', optimizations);
      return optimizations;
    } catch (error) {
      logger.error('Failed to optimize economy data', { error: error.message });
      throw new ServiceError(`Failed to optimize economy data: ${error.message}`, 'UnifiedEconomyService');
    }
  }

  /**
   * Analyze currency optimizations
   */
  analyzeCurrencyOptimizations(currencies) {
    const suggestions = [];
    
    // Check for duplicate currencies
    const currencyIds = currencies.map(c => c.id);
    const duplicates = currencyIds.filter((id, index) => currencyIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      suggestions.push({
        type: 'duplicate_currencies',
        severity: 'high',
        message: `Found duplicate currency IDs: ${duplicates.join(', ')}`,
      });
    }

    // Check for invalid initial/maximum values
    const invalidRanges = currencies.filter(c => c.initial > c.maximum);
    if (invalidRanges.length > 0) {
      suggestions.push({
        type: 'invalid_ranges',
        severity: 'medium',
        message: `Found currencies with initial > maximum: ${invalidRanges.map(c => c.id).join(', ')}`,
      });
    }

    return suggestions;
  }

  /**
   * Analyze inventory optimizations
   */
  analyzeInventoryOptimizations(inventory) {
    const suggestions = [];
    
    // Check for missing rarities
    const missingRarities = inventory.filter(i => !i.rarity || i.rarity === '');
    if (missingRarities.length > 0) {
      suggestions.push({
        type: 'missing_rarities',
        severity: 'low',
        message: `Found ${missingRarities.length} items without rarity specified`,
      });
    }

    // Check for duplicate IDs
    const itemIds = inventory.map(i => i.id);
    const duplicates = itemIds.filter((id, index) => itemIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      suggestions.push({
        type: 'duplicate_items',
        severity: 'high',
        message: `Found duplicate item IDs: ${duplicates.join(', ')}`,
      });
    }

    return suggestions;
  }

  /**
   * Analyze catalog optimizations
   */
  analyzeCatalogOptimizations(catalog) {
    const suggestions = [];
    
    // Check for invalid costs
    const invalidCosts = catalog.filter(c => c.cost < 0);
    if (invalidCosts.length > 0) {
      suggestions.push({
        type: 'invalid_costs',
        severity: 'medium',
        message: `Found items with negative costs: ${invalidCosts.map(c => c.id).join(', ')}`,
      });
    }

    // Check for missing currencies
    const missingCurrencies = catalog.filter(c => !c.currency || c.currency === '');
    if (missingCurrencies.length > 0) {
      suggestions.push({
        type: 'missing_currencies',
        severity: 'high',
        message: `Found items without currency specified: ${missingCurrencies.map(c => c.id).join(', ')}`,
      });
    }

    return suggestions;
  }
}

export default UnifiedEconomyService;
export { UnifiedEconomyService };