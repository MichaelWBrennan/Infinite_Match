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
const transports = [];

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

// Enhanced logger with context
class Logger {
  constructor(context = '') {
    this.context = context;
  }

  info(message, meta = {}) {
    logger.info(message, { context: this.context, ...meta });
  }

  warn(message, meta = {}) {
    logger.warn(message, { context: this.context, ...meta });
  }

  error(message, meta = {}) {
    logger.error(message, { context: this.context, ...meta });
  }

  debug(message, meta = {}) {
    logger.debug(message, { context: this.context, ...meta });
  }

  // Security-specific logging
  security(event, details = {}) {
    securityLogger.info(event, { context: this.context, ...details });
  }

  // Request-specific logging
  request(req, res, duration) {
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
export { logger, securityLogger, requestLogger, Logger };
export default logger;
