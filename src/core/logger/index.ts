/**
 * Centralized Logging Module
 * Industry-standard logging with structured output and multiple transports
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { AppConfig } from '../config/index.js';

const { combine, timestamp, errors, json, printf, colorize } = winston.format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
  return `${timestamp} [${level}]: ${message} ${metaStr}`;
});

// Create transports array
const transports: winston.transport[] = [];

// Console transport
if (AppConfig.logging.format === 'json') {
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
if (AppConfig.logging.file.enabled) {
  transports.push(
    new DailyRotateFile({
      filename: `${AppConfig.logging.file.path}/app-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      maxSize: AppConfig.logging.file.maxSize,
      maxFiles: AppConfig.logging.file.maxFiles,
      format: combine(timestamp(), errors({ stack: true }), json()),
    }),
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: AppConfig.logging.level,
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
    ...(AppConfig.logging.file.enabled
      ? [
          new DailyRotateFile({
            filename: `${AppConfig.logging.file.path}/security-%DATE%.log`,
            datePattern: 'YYYY-MM-DD',
            maxSize: AppConfig.logging.file.maxSize,
            maxFiles: AppConfig.logging.file.maxFiles,
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
    ...(AppConfig.logging.file.enabled
      ? [
          new DailyRotateFile({
            filename: `${AppConfig.logging.file.path}/requests-%DATE%.log`,
            datePattern: 'YYYY-MM-DD',
            maxSize: AppConfig.logging.file.maxSize,
            maxFiles: AppConfig.logging.file.maxFiles,
          }),
        ]
      : []),
  ],
  exitOnError: false,
});

export interface LogMeta {
  [key: string]: any;
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

  info(message: string, meta: LogMeta = {}): void {
    logger.info(message, { context: this.context, ...meta });
  }

  warn(message: string, meta: LogMeta = {}): void {
    logger.warn(message, { context: this.context, ...meta });
  }

  error(message: string, meta: LogMeta = {}): void {
    logger.error(message, { context: this.context, ...meta });
  }

  debug(message: string, meta: LogMeta = {}): void {
    logger.debug(message, { context: this.context, ...meta });
  }

  // Security-specific logging
  security(event: string, details: LogMeta = {}): void {
    securityLogger.info(event, { context: this.context, ...details });
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
