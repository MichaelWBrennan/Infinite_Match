/**
 * Centralized Error Handling Framework
 * Provides consistent error handling across the application
 */

import { Logger } from '../logger/index.js';

const logger = new Logger('ErrorHandler');

export interface ErrorContext {
  [key: string]: any;
}

export interface ErrorInfo {
  message: string;
  name: string;
  context: ErrorContext;
  timestamp: string;
  stack?: string;
}

export interface HandledError extends ErrorInfo {
  type: string;
  recoverable: boolean;
  action: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    type: string;
    recoverable: boolean;
    action: string;
    timestamp: string;
    context: ErrorContext;
  };
}

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly context: ErrorContext;
  public readonly timestamp: string;

  constructor(message: string, code: string, statusCode: number = 500, context: ErrorContext = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field: string | null = null, context: ErrorContext = {}) {
    super(message, 'VALIDATION_ERROR', 400, { field, ...context });
  }
}

export class NetworkError extends AppError {
  constructor(message: string, url: string | null = null, context: ErrorContext = {}) {
    super(message, 'NETWORK_ERROR', 503, { url, ...context });
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string, configKey: string | null = null, context: ErrorContext = {}) {
    super(message, 'CONFIGURATION_ERROR', 500, { configKey, ...context });
  }
}

export class ServiceError extends AppError {
  constructor(message: string, serviceName: string | null = null, context: ErrorContext = {}) {
    super(message, 'SERVICE_ERROR', 500, { serviceName, ...context });
  }
}

export class ErrorHandler {
  /**
   * Handle and categorize errors
   */
  static handle(error: Error, context: ErrorContext = {}): HandledError {
    const errorInfo: ErrorInfo = {
      message: error.message,
      name: error.name,
      context: { ...context, ...(error as any).context },
      timestamp: (error as any).timestamp || new Date().toISOString(),
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

  private static handleValidationError(errorInfo: ErrorInfo): HandledError {
    logger.warn('Validation error occurred', errorInfo);
    return {
      type: 'validation',
      recoverable: true,
      action: 'retry_with_correction',
      ...errorInfo,
    };
  }

  private static handleNetworkError(errorInfo: ErrorInfo): HandledError {
    logger.error('Network error occurred', errorInfo);
    return {
      type: 'network',
      recoverable: true,
      action: 'retry_with_backoff',
      ...errorInfo,
    };
  }

  private static handleConfigurationError(errorInfo: ErrorInfo): HandledError {
    logger.error('Configuration error occurred', errorInfo);
    return {
      type: 'configuration',
      recoverable: false,
      action: 'fix_configuration',
      ...errorInfo,
    };
  }

  private static handleServiceError(errorInfo: ErrorInfo): HandledError {
    logger.error('Service error occurred', errorInfo);
    return {
      type: 'service',
      recoverable: true,
      action: 'retry_or_fallback',
      ...errorInfo,
    };
  }

  private static handleAppError(errorInfo: ErrorInfo): HandledError {
    logger.error('Application error occurred', errorInfo);
    return {
      type: 'application',
      recoverable: false,
      action: 'investigate',
      ...errorInfo,
    };
  }

  private static handleGenericError(errorInfo: ErrorInfo): HandledError {
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
   */
  static createErrorResponse(errorInfo: HandledError): ErrorResponse {
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
   */
  static wrapAsync<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    context: ErrorContext = {},
  ): T {
    return (async (...args: any[]) => {
      try {
        return await fn(...args);
      } catch (error) {
        const errorInfo = this.handle(error as Error, context);
        throw new AppError(
          errorInfo.message,
          errorInfo.context?.code || 'WRAPPED_ERROR',
          errorInfo.context?.statusCode || 500,
          errorInfo.context,
        );
      }
    }) as T;
  }
}

export default ErrorHandler;
