/**
 * Centralized Logging Module
 * Industry-standard logging with structured output and multiple transports
 */
import winston from 'winston';
interface RecentLogEntry {
    timestamp: string;
    level: string;
    message: string;
    context?: string | undefined;
}
/** Newest first. Optional exact-match filters on level and context. */
export declare function getRecentLogs({ limit, level, context }?: {
    limit?: number;
    level?: string;
    context?: string;
}): RecentLogEntry[];
declare const logger: winston.Logger;
declare const securityLogger: winston.Logger;
declare const requestLogger: winston.Logger;
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
export declare class Logger {
    private context;
    constructor(context?: string);
    info(message: string, meta?: unknown): void;
    warn(message: string, meta?: unknown): void;
    error(message: string, meta?: unknown): void;
    debug(message: string, meta?: unknown): void;
    security(event: string, details?: unknown): void;
    request(req: any, res: any, duration: number): void;
}
export { logger, securityLogger, requestLogger };
export default logger;
//# sourceMappingURL=index.d.ts.map