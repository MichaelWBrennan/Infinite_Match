/**
 * Centralized Middleware Module
 * Common middleware functions used across the application
 */

import { Logger } from 'logger/index.js';
import { ErrorHandler } from 'errors/ErrorHandler.js';

const logger = new Logger('Middleware');

/**
 * Async error handler wrapper
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Request validation middleware
 * @param {Object} schema - Validation schema
 * @returns {Function} Express middleware function
 */
export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const { error } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: error.details,
            requestId: req.requestId,
          },
        });
      }
      next();
    } catch (err) {
      logger.error('Validation middleware error', { error: err.message });
      next(err);
    }
  };
};

/**
 * Response formatter middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const responseFormatter = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    const response = {
      success: res.statusCode < 400,
      data: res.statusCode < 400 ? data : undefined,
      error: res.statusCode >= 400 ? data : undefined,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    };
    
    return originalJson.call(this, response);
  };
  
  next();
};

/**
 * Performance monitoring middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const performanceMonitor = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request performance', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      requestId: req.requestId,
    });
  });
  
  next();
};

/**
 * Error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const errorHandler = (err, req, res) => {
  const errorInfo = ErrorHandler.handle(err, {
    requestId: req.requestId,
    url: req.url,
    method: req.method,
  });

  logger.error('Request error', errorInfo);

  const statusCode = errorInfo.context?.statusCode || 500;
  const response = ErrorHandler.createErrorResponse(errorInfo);

  res.status(statusCode).json(response);
};

export default {
  asyncHandler,
  validateRequest,
  responseFormatter,
  performanceMonitor,
  errorHandler,
};