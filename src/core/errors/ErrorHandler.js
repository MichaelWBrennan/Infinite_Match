/**
 * Centralized Error Handling Framework
 * Provides consistent error handling across the application
 */

import { Logger } from '../logger/index.js';

const logger = new Logger('ErrorHandler');

export class AppError extends Error {
  constructor(message, code, statusCode = 500, context = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

export class ValidationError extends AppError {
  constructor(message, field = null, context = {}) {
    super(message, 'VALIDATION_ERROR', 400, { field, ...context });
  }
}

export class NetworkError extends AppError {
  constructor(message, url = null, context = {}) {
    super(message, 'NETWORK_ERROR', 503, { url, ...context });
  }
}

export class ConfigurationError extends AppError {
  constructor(message, configKey = null, context = {}) {
    super(message, 'CONFIGURATION_ERROR', 500, { configKey, ...context });
  }
}

export class ServiceError extends AppError {
  constructor(message, serviceName = null, context = {}) {
    super(message, 'SERVICE_ERROR', 500, { serviceName, ...context });
  }
}

export class ErrorHandler {
  /**
   * Handle and categorize errors
   * @param {Error} error - The error to handle
   * @param {Object} context - Additional context
   * @returns {Object} Error information
   */
  static handle(error, context = {}) {
    const errorInfo = {
      message: error.message,
      name: error.name,
      context: { ...context, ...error.context },
      timestamp: error.timestamp || new Date().toISOString(),
      stack: error.stack,
    };

    // Categorize error
    if (error instanceof ValidationError) {
      return this.handleValidationError(errorInfo);
    } else if (error instanceof NetworkError) {
      return this.handleNetworkError(errorInfo);
    } else if (error instanceof ConfigurationError) {
      return this.handleConfigurationError(errorInfo);
    } else if (error instanceof ServiceError) {
      return this.handleServiceError(errorInfo);
    } else if (error instanceof AppError) {
      return this.handleAppError(errorInfo);
    }

    return this.handleGenericError(errorInfo);
  }

  static handleValidationError(errorInfo) {
    logger.warn('Validation error occurred', errorInfo);
    return {
      type: 'validation',
      recoverable: true,
      action: 'retry_with_correction',
      ...errorInfo,
    };
  }

  static handleNetworkError(errorInfo) {
    logger.error('Network error occurred', errorInfo);
    return {
      type: 'network',
      recoverable: true,
      action: 'retry_with_backoff',
      ...errorInfo,
    };
  }

  static handleConfigurationError(errorInfo) {
    logger.error('Configuration error occurred', errorInfo);
    return {
      type: 'configuration',
      recoverable: false,
      action: 'fix_configuration',
      ...errorInfo,
    };
  }

  static handleServiceError(errorInfo) {
    logger.error('Service error occurred', errorInfo);
    return {
      type: 'service',
      recoverable: true,
      action: 'retry_or_fallback',
      ...errorInfo,
    };
  }

  static handleAppError(errorInfo) {
    logger.error('Application error occurred', errorInfo);
    return {
      type: 'application',
      recoverable: false,
      action: 'investigate',
      ...errorInfo,
    };
  }

  static handleGenericError(errorInfo) {
    logger.error('Unexpected error occurred', errorInfo);
    return {
      type: 'unknown',
      recoverable: false,
      action: 'investigate',
      ...errorInfo,
    };
  }

  /**
   * Create a standardized error response
   * @param {Object} errorInfo - Error information
   * @returns {Object} Standardized error response
   */
  static createErrorResponse(errorInfo) {
    return {
      success: false,
      error: {
        code: errorInfo.context?.code || 'UNKNOWN_ERROR',
        message: errorInfo.message,
        type: errorInfo.type,
        recoverable: errorInfo.recoverable,
        action: errorInfo.action,
        timestamp: errorInfo.timestamp,
        context: errorInfo.context,
      },
    };
  }

  /**
   * Wrap async functions with error handling
   * @param {Function} fn - Async function to wrap
   * @param {Object} context - Error context
   * @returns {Function} Wrapped function
   */
  static wrapAsync(fn, context = {}) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        const errorInfo = this.handle(error, context);
        throw new AppError(
          errorInfo.message,
          errorInfo.context?.code || 'WRAPPED_ERROR',
          errorInfo.context?.statusCode || 500,
          errorInfo.context
        );
      }
    };
  }
}

export default ErrorHandler;