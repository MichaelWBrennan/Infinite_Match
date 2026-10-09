/**
 * Centralized Logging Module
 * Industry-standard logging with structured output and multiple transports
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import AppConfig from '../config/index.js';

const { combine, timestamp, errors, json, printf, colorize } = winston.format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
  return `${timestamp} [${level}]: ${message} ${metaStr}`;
});

// Create transports array
const transports: winston.transport[] = [];

// Console transport
if (AppConfig.analytics.logging.format === 'json') {
  transports.push(
    new winston.transports.Console({
      format: combine(timestamp(), errors({ stack: true }), json()),
    }),
  );
} else {
  transports.push(
    new winston.transports.Console({
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        colorize(),
        errors({ stack: true }),
        consoleFormat,
      ),
    }),
  );
}

// File transport (if enabled)
if (AppConfig.analytics.logging.file?.enabled || false) {
  transports.push(
    new DailyRotateFile({
      filename: `${AppConfig.analytics.logging.file?.path || 'logs'}/app-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      maxSize: AppConfig.analytics.logging.file?.maxSize || '20m',
      maxFiles: AppConfig.analytics.logging.file?.maxFiles || '14d',
      format: combine(timestamp(), errors({ stack: true }), json()),
    }),
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: AppConfig.analytics.logging.level,
  format: combine(timestamp(), errors({ stack: true })),
  transports,
  exitOnError: false,
});

// Security logger for sensitive operations
const securityLogger = winston.createLogger({
  level: 'info',
  format: combine(timestamp(), errors({ stack: true }), json()),
  transports: [
    new winston.transports.Console({
      format: combine(timestamp(), colorize(), consoleFormat),
    }),
    ...(AppConfig.analytics.logging.file?.enabled
      ? [
        new DailyRotateFile({
          filename: `${AppConfig.analytics.logging.file?.path || 'logs'}/security-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          maxSize: AppConfig.analytics.logging.file?.maxSize || '20m',
          maxFiles: AppConfig.analytics.logging.file?.maxFiles || '14d',
        }),
      ]
      : []),
  ],
  exitOnError: false,
});

// Request logger for HTTP requests
const requestLogger = winston.createLogger({
  level: 'info',
  format: combine(timestamp(), errors({ stack: true }), json()),
  transports: [
    ...(AppConfig.analytics.logging.file?.enabled
      ? [
        new DailyRotateFile({
          filename: `${AppConfig.analytics.logging.file?.path || 'logs'}/requests-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          maxSize: AppConfig.analytics.logging.file?.maxSize || '20m',
          maxFiles: AppConfig.analytics.logging.file?.maxFiles || '14d',
        }),
      ]
      : []),
  ],
  exitOnError: false,
});

export interface LogMeta {
  [key: string]: any;
}

/**
 * Normalize whatever a caller passes as log metadata into a plain object.
 *
 * Winston only serializes enumerable own properties, so passing an `Error`
 * directly (e.g. `logger.error('boom', error)` from a `catch (error)` block,
 * where `error` is `unknown` under `useUnknownInCatchVariables`) produced an
 * empty metadata object and silently dropped the message and stack trace.
 */
function toLogMeta(meta: unknown): LogMeta {
  if (meta === null || meta === undefined) {
    return {};
  }
  if (meta instanceof Error) {
    return { name: meta.name, error: meta.message, stack: meta.stack };
  }
  if (typeof meta === 'object') {
    return meta as LogMeta;
  }
  return { detail: meta };
}

export interface RequestLogMeta {
  method: string;
  url: string;
  statusCode: number;
  duration: string;
  ip: string;
  userAgent?: string;
  requestId?: string;
}

// Enhanced logger with context
export class Logger {
  private context: string;

  constructor(context: string = '') {
    this.context = context;
  }

  info(message: string, meta?: unknown): void {
    logger.info(message, { context: this.context, ...toLogMeta(meta) });
  }

  warn(message: string, meta?: unknown): void {
    logger.warn(message, { context: this.context, ...toLogMeta(meta) });
  }

  error(message: string, meta?: unknown): void {
    logger.error(message, { context: this.context, ...toLogMeta(meta) });
  }

  debug(message: string, meta?: unknown): void {
    logger.debug(message, { context: this.context, ...toLogMeta(meta) });
  }

  // Security-specific logging
  security(event: string, details?: unknown): void {
    securityLogger.info(event, { context: this.context, ...toLogMeta(details) });
  }

  // Request-specific logging
  request(req: any, res: any, duration: number): void {
    requestLogger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestId: req.requestId,
    });
  }
}

// Export logger instances
export { logger, securityLogger, requestLogger };
export default logger;
