/**
 * Economy Data Validator
 * Validates economy-related data structures
 */

import { Logger } from '../../core/logger/index.js';
import { ValidationError } from '../../core/errors/ErrorHandler.js';

const logger = new Logger('EconomyValidator');

export class EconomyValidator {
  constructor() {
    this.currencyRules = {
      required: ['id', 'name', 'type'],
      optional: [
        'description',
        'initial',
        'maximum',
        'isTradable',
        'isConsumable',
      ],
      types: {
        id: 'string',
        name: 'string',
        type: 'string',
        initial: 'number',
        maximum: 'number',
        isTradable: 'boolean',
        isConsumable: 'boolean',
      },
    };

    this.inventoryRules = {
      required: ['id', 'name', 'type'],
      optional: [
        'description',
        'rarity',
        'category',
        'tradable',
        'stackable',
        'iconPath',
      ],
      types: {
        id: 'string',
        name: 'string',
        type: 'string',
        description: 'string',
        rarity: 'string',
        category: 'string',
        tradable: 'boolean',
        stackable: 'boolean',
        iconPath: 'string',
      },
    };

    this.catalogRules = {
      required: ['id', 'name', 'cost_currency', 'cost_amount'],
      optional: [
        'description',
        'type',
        'rewards',
        'category',
        'rarity',
        'isActive',
      ],
      types: {
        id: 'string',
        name: 'string',
        cost_currency: 'string',
        cost_amount: 'number',
        description: 'string',
        type: 'string',
        rewards: 'string',
        category: 'string',
        rarity: 'string',
        isActive: 'boolean',
      },
    };
  }

  /**
   * Validate currency data
   * @param {Array} currencies - Currency data
   * @returns {Array} Validated currencies
   */
  validateCurrencies(currencies) {
    return this.validateData(currencies, this.currencyRules, 'currency');
  }

  /**
   * Validate inventory data
   * @param {Array} inventory - Inventory data
   * @returns {Array} Validated inventory items
   */
  validateInventory(inventory) {
    return this.validateData(inventory, this.inventoryRules, 'inventory');
  }

  /**
   * Validate catalog data
   * @param {Array} catalog - Catalog data
   * @returns {Array} Validated catalog items
   */
  validateCatalog(catalog) {
    return this.validateData(catalog, this.catalogRules, 'catalog');
  }

  /**
   * Generic data validation
   * @param {Array} data - Data to validate
   * @param {Object} rules - Validation rules
   * @param {string} dataType - Type of data being validated
   * @returns {Array} Validated data
   */
  validateData(data, rules, dataType) {
    if (!Array.isArray(data)) {
      throw new ValidationError(
        `Expected array for ${dataType} data`,
        'dataType'
      );
    }

    const validatedData = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const item = data[i];

      try {
        const validatedItem = this.validateItem(item, rules, dataType, i);
        validatedData.push(validatedItem);
      } catch (error) {
        errors.push({
          index: i,
          item: item,
          error: error.message,
        });
        logger.warn(`Invalid ${dataType} item at index ${i}`, {
          item,
          error: error.message,
        });
      }
    }

    if (errors.length > 0) {
      logger.warn(`Validation completed with ${errors.length} errors`, {
        dataType,
        totalItems: data.length,
        validItems: validatedData.length,
        errors: errors.length,
      });
    }

    return validatedData;
  }

  /**
   * Validate a single item
   * @param {Object} item - Item to validate
   * @param {Object} rules - Validation rules
   * @param {string} dataType - Type of data
   * @param {number} index - Item index
   * @returns {Object} Validated item
   */
  validateItem(item, rules, dataType, index) {
    if (!item || typeof item !== 'object') {
      throw new ValidationError(
        `Invalid item at index ${index}: must be an object`,
        'itemType'
      );
    }

    // Check required fields
    for (const field of rules.required) {
      if (
        !(field in item) ||
        item[field] === null ||
        item[field] === undefined
      ) {
        throw new ValidationError(
          `Missing required field '${field}' at index ${index}`,
          field
        );
      }
    }

    // Validate field types and apply transformations
    const validatedItem = {};

    for (const [field, value] of Object.entries(item)) {
      if (rules.types[field]) {
        validatedItem[field] = this.validateFieldType(
          field,
          value,
          rules.types[field],
          index
        );
      } else {
        validatedItem[field] = value;
      }
    }

    // Apply field mappings and defaults
    const mappedItem = this.applyFieldMappings(validatedItem, rules, dataType);

    return mappedItem;
  }

  /**
   * Validate field type and apply transformations
   * @param {string} field - Field name
   * @param {*} value - Field value
   * @param {string} expectedType - Expected type
   * @param {number} index - Item index
   * @returns {*} Validated and transformed value
   */
  validateFieldType(field, value, expectedType, index) {
    switch (expectedType) {
      case 'string': {
        return String(value);
      }

      case 'number': {
        const num = Number(value);
        if (isNaN(num)) {
          throw new ValidationError(
            `Invalid number for field '${field}' at index ${index}: ${value}`,
            field
          );
        }
        return num;
      }

      case 'boolean': {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
          const lower = value.toLowerCase();
          if (lower === 'true') return true;
          if (lower === 'false') return false;
        }
        throw new ValidationError(
          `Invalid boolean for field '${field}' at index ${index}: ${value}`,
          field
        );
      }

      default:
        return value;
    }
  }

  /**
   * Apply field mappings and defaults
   * @param {Object} item - Item to map
   * @param {Object} rules - Validation rules
   * @param {string} dataType - Type of data
   * @returns {Object} Mapped item
   */
  applyFieldMappings(item, rules, dataType) {
    const mappedItem = { ...item };

    // Apply specific mappings based on data type
    switch (dataType) {
      case 'currency':
        mappedItem.isTradable = mappedItem.isTradable || false;
        mappedItem.isConsumable = mappedItem.isConsumable || false;
        break;

      case 'inventory':
        mappedItem.isTradable = this.parseBoolean(mappedItem.tradable) || false;
        mappedItem.isConsumable = mappedItem.isConsumable || false;
        mappedItem.maxStackSize = this.parseBoolean(mappedItem.stackable)
          ? 999
          : 1;
        mappedItem.rarity = mappedItem.rarity || 'common';
        mappedItem.category = mappedItem.category || 'general';
        break;

      case 'catalog':
        mappedItem.cost = mappedItem.cost_amount || 0;
        mappedItem.currency = mappedItem.cost_currency || 'coins';
        mappedItem.type = mappedItem.type || 'item';
        mappedItem.isActive = mappedItem.isActive !== false;
        break;
    }

    return mappedItem;
  }

  /**
   * Parse boolean value
   * @param {*} value - Value to parse
   * @returns {boolean} Parsed boolean
   */
  parseBoolean(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      return lower === 'true' || lower === '1' || lower === 'yes';
    }
    return Boolean(value);
  }

  /**
   * Get validation statistics
   * @param {Array} originalData - Original data
   * @param {Array} validatedData - Validated data
   * @returns {Object} Validation statistics
   */
  getValidationStats(originalData, validatedData) {
    return {
      totalItems: originalData.length,
      validItems: validatedData.length,
      invalidItems: originalData.length - validatedData.length,
      successRate:
        originalData.length > 0
          ? ((validatedData.length / originalData.length) * 100).toFixed(2) +
            '%'
          : '0%',
    };
  }
}

export default EconomyValidator;
