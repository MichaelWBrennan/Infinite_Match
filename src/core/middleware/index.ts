/**
 * Optimized Middleware Management
 * Consolidated middleware functions with enhanced functionality
 */

import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { Logger } from '../logger/index.js';
import { ErrorHandler, ValidationError } from '../errors/ErrorHandler.js';
import { ApiResponseBuilder } from '../types/ApiResponse.js';

const logger = new Logger('Middleware');

// Request ID middleware
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  (req as any).requestId =
    (req.headers['x-request-id'] as string) ||
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', (req as any).requestId);
  next();
};

// Request logging middleware
export const requestLoggingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.request(req, res, duration);
  });

  next();
};

// Error handling middleware
export const errorHandlingMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  logger.error('Unhandled error in middleware chain:', error);

  const errorInfo = ErrorHandler.handle(error, {
    requestId: (req as any).requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
  });

  const response = ApiResponseBuilder.error(
    errorInfo.context?.['code'] || 'INTERNAL_ERROR',
    errorInfo.message,
    errorInfo.type,
    errorInfo.recoverable,
    errorInfo.action,
    errorInfo.context,
  );

  res.status(errorInfo.context?.['statusCode'] || 500).json(response);
};

// Security headers middleware
export const securityHeadersMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');

  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
};

// CORS preflight middleware
export const corsPreflightMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
};

// Rate limiting response middleware
export const rateLimitResponseMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // This will be handled by express-rate-limit, but we can customize the response
  next();
};

// Health check middleware
export const healthCheckMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (req.path === '/health') {
    // Skip other middleware for health checks
    next();
    return;
  }
  next();
};

// API versioning middleware
export const apiVersioningMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const apiVersion = (req.headers['api-version'] as string) || 'v1';
  (req as any).apiVersion = apiVersion;
  res.setHeader('API-Version', apiVersion);
  next();
};

// Request size validation middleware
export const requestSizeValidationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const contentLength = parseInt(req.get('content-length') || '0');
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength > maxSize) {
    const response = ApiResponseBuilder.error(
      'REQUEST_TOO_LARGE',
      'Request body too large',
      'validation',
      false,
      'reduce_request_size',
    );
    res.status(413).json(response);
    return;
  }

  next();
};

// Content type validation middleware
export const contentTypeValidationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const response = ApiResponseBuilder.error(
        'INVALID_CONTENT_TYPE',
        'Content-Type must be application/json',
        'validation',
        true,
        'use_json_content_type',
      );
      res.status(400).json(response);
      return;
    }
  }

  next();
};

// Request timeout middleware
export const requestTimeoutMiddleware = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        const response = ApiResponseBuilder.error(
          'REQUEST_TIMEOUT',
          'Request timeout',
          'timeout',
          true,
          'retry_request',
        );
        res.status(408).json(response);
      }
    }, timeoutMs);

    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));

    next();
  };
};

// Async error handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Request validation middleware
export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new ValidationError('Validation failed', null, { errors: errors.array() });
    const errorInfo = ErrorHandler.handle(error);
    const response = ApiResponseBuilder.error(
      errorInfo.context?.['code'] || 'VALIDATION_ERROR',
      errorInfo.message,
      errorInfo.type,
      errorInfo.recoverable,
      errorInfo.action,
      errorInfo.context,
    );
    res.status(400).json(response);
    return;
  }
  next();
};

// Response formatter middleware
export const responseFormatter = (req: Request, res: Response, next: NextFunction): void => {
  const originalJson = res.json;

  res.json = function (data) {
    const response = {
      success: res.statusCode < 400,
      data: res.statusCode < 400 ? data : undefined,
      error: res.statusCode >= 400 ? data : undefined,
      timestamp: new Date().toISOString(),
      requestId: (req as any).requestId,
    };

    return originalJson.call(this, response);
  };

  next();
};

// Performance monitoring middleware
export const performanceMonitor = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request performance', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      requestId: (req as any).requestId,
    });
  });

  next();
};

// Analytics middleware
export const analyticsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Add analytics tracking
  (req as any).analytics = {
    startTime: Date.now(),
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    platform: req.get('X-Platform') || 'unknown',
  };

  res.on('finish', () => {
    const duration = Date.now() - (req as any).analytics.startTime;
    // Track request analytics here
    logger.info('Request analytics', {
      ...(req as any).analytics,
      duration,
      statusCode: res.statusCode,
      requestId: (req as any).requestId,
    });
  });

  next();
};

// Game event middleware
export const gameEventMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Add game-specific tracking
  (req as any).gameEvent = {
    eventType: req.body?.eventType || 'unknown',
    userId: (req as any).user?.id || 'anonymous',
    level: req.body?.level || null,
    score: req.body?.score || null,
  };

  next();
};

// Middleware chain builder
export class MiddlewareChain {
  private middlewares: Array<(req: Request, res: Response, next: NextFunction) => void> = [];

  add(middleware: (req: Request, res: Response, next: NextFunction) => void): MiddlewareChain {
    this.middlewares.push(middleware);
    return this;
  }

  build(): Array<(req: Request, res: Response, next: NextFunction) => void> {
    return this.middlewares;
  }
}

// Predefined middleware chains
export const createSecurityChain = (): MiddlewareChain => {
  return new MiddlewareChain()
    .add(securityHeadersMiddleware)
    .add(corsPreflightMiddleware)
    .add(requestIdMiddleware);
};

export const createApiChain = (): MiddlewareChain => {
  return new MiddlewareChain()
    .add(requestIdMiddleware)
    .add(requestLoggingMiddleware)
    .add(apiVersioningMiddleware)
    .add(requestSizeValidationMiddleware)
    .add(contentTypeValidationMiddleware)
    .add(requestTimeoutMiddleware(30000));
};

// Error handler wrapper for middleware chain
const errorHandlerWrapper = (req: Request, res: Response, next: NextFunction) => {
  // This will be used as the final error handler in Express
  return next();
};

export const createErrorChain = (): MiddlewareChain => {
  return new MiddlewareChain().add(errorHandlerWrapper);
};

export const createGameChain = (): MiddlewareChain => {
  return new MiddlewareChain()
    .add(requestIdMiddleware)
    .add(analyticsMiddleware)
    .add(gameEventMiddleware)
    .add(performanceMonitor);
};

// Export all middleware functions
export default {
  requestIdMiddleware,
  requestLoggingMiddleware,
  errorHandlingMiddleware,
  securityHeadersMiddleware,
  corsPreflightMiddleware,
  rateLimitResponseMiddleware,
  healthCheckMiddleware,
  apiVersioningMiddleware,
  requestSizeValidationMiddleware,
  contentTypeValidationMiddleware,
  requestTimeoutMiddleware,
  asyncHandler,
  validateRequest,
  responseFormatter,
  performanceMonitor,
  analyticsMiddleware,
  gameEventMiddleware,
  MiddlewareChain,
  createSecurityChain,
  createApiChain,
  createErrorChain,
  createGameChain,
};