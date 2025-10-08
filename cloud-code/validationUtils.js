// Shared validation utilities for Unity Cloud Code functions

/**
 * Validate required parameters
 * @param {Object} params - Parameters to validate
 * @param {Array} requiredFields - Array of required field names
 * @param {Object} validators - Optional custom validators for each field
 * @returns {Object} Validation result with isValid and errors
 */
function validateParams(params, requiredFields, validators = {}) {
  const errors = [];
  
  for (const field of requiredFields) {
    if (!params[field]) {
      errors.push(`${field} is required`);
    } else if (validators[field] && !validators[field](params[field])) {
      errors.push(validators[field].error || `Invalid ${field}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate positive number
 * @param {number} value - Value to validate
 * @returns {boolean} True if valid positive number
 */
function validatePositiveNumber(value) {
  return typeof value === 'number' && value > 0;
}

/**
 * Validate non-empty string
 * @param {string} value - Value to validate
 * @returns {boolean} True if valid non-empty string
 */
function validateNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Common validators
 */
const commonValidators = {
  amount: {
    validator: validatePositiveNumber,
    error: 'amount must be a positive number'
  },
  quantity: {
    validator: validatePositiveNumber,
    error: 'quantity must be a positive number'
  },
  currencyId: {
    validator: validateNonEmptyString,
    error: 'currencyId must be a non-empty string'
  },
  itemId: {
    validator: validateNonEmptyString,
    error: 'itemId must be a non-empty string'
  }
};

module.exports = {
  validateParams,
  validatePositiveNumber,
  validateNonEmptyString,
  commonValidators
};