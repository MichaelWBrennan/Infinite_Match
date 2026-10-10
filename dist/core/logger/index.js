/**
 * Centralized Logging Module
 * Industry-standard logging with structured output and multiple transports
 */
import winston from 'winston';
import Transport from 'winston-transport';
import DailyRotateFile from 'winston-daily-rotate-file';
import AppConfig from '../config/index.js';
const { combine, timestamp, errors, json, printf, colorize } = winston.format;
// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
});
// Create transports array
const transports = [];
// Console transport
if (AppConfig.analytics.logging.format === 'json') {
    transports.push(new winston.transports.Console({
        format: combine(timestamp(), errors({ stack: true }), json()),
    }));
}
else {
    transports.push(new winston.transports.Console({
        format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), colorize(), errors({ stack: true }), consoleFormat),
    }));
}
// File transport (if enabled)
if (AppConfig.analytics.logging.file?.enabled || false) {
    transports.push(new DailyRotateFile({
        filename: `${AppConfig.analytics.logging.file?.path || 'logs'}/app-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        maxSize: AppConfig.analytics.logging.file?.maxSize || '20m',
        maxFiles: AppConfig.analytics.logging.file?.maxFiles || '14d',
        format: combine(timestamp(), errors({ stack: true }), json()),
    }));
}
// Recent entries kept in memory for the admin logs endpoint. Only the timestamp,
// level, message, and context are kept. Other metadata can hold personal data.
const RECENT_LOG_LIMIT = 500;
const recentLogs = [];
class RecentLogTransport extends Transport {
    log(info, callback) {
        recentLogs.push({
            timestamp: String(info.timestamp ?? new Date().toISOString()),
            level: String(info.level),
            message: String(info.message),
            context: info.context ? String(info.context) : undefined,
        });
        if (recentLogs.length > RECENT_LOG_LIMIT)
            recentLogs.shift();
        callback();
    }
}
transports.push(new RecentLogTransport());
/** Newest first. Optional exact-match filters on level and context. */
export function getRecentLogs({ limit = 100, level, context } = {}) {
    return recentLogs
        .filter((entry) => (!level || entry.level === level) && (!context || entry.context === context))
        .slice(-Math.max(0, limit))
        .reverse();
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
/**
 * Normalize whatever a caller passes as log metadata into a plain object.
 *
 * Winston only serializes enumerable own properties, so passing an `Error`
 * directly (e.g. `logger.error('boom', error)` from a `catch (error)` block,
 * where `error` is `unknown` under `useUnknownInCatchVariables`) produced an
 * empty metadata object and silently dropped the message and stack trace.
 */
function toLogMeta(meta) {
    if (meta === null || meta === undefined) {
        return {};
    }
    if (meta instanceof Error) {
        return { name: meta.name, error: meta.message, stack: meta.stack };
    }
    if (typeof meta === 'object') {
        return meta;
    }
    return { detail: meta };
}
// Enhanced logger with context
export class Logger {
    context;
    constructor(context = '') {
        this.context = context;
    }
    info(message, meta) {
        logger.info(message, { context: this.context, ...toLogMeta(meta) });
    }
    warn(message, meta) {
        logger.warn(message, { context: this.context, ...toLogMeta(meta) });
    }
    error(message, meta) {
        logger.error(message, { context: this.context, ...toLogMeta(meta) });
    }
    debug(message, meta) {
        logger.debug(message, { context: this.context, ...toLogMeta(meta) });
    }
    // Security-specific logging
    security(event, details) {
        securityLogger.info(event, { context: this.context, ...toLogMeta(details) });
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
export { logger, securityLogger, requestLogger };
export default logger;
//# sourceMappingURL=index.js.map