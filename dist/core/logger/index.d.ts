/**
 * Centralized Logging Module
 * Industry-standard logging with structured output and multiple transports
 */
import winston from 'winston';
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
    info(message: string, meta?: LogMeta): void;
    warn(message: string, meta?: LogMeta): void;
    error(message: string, meta?: LogMeta): void;
    debug(message: string, meta?: LogMeta): void;
    security(event: string, details?: LogMeta): void;
    request(req: any, res: any, duration: number): void;
}
export { logger, securityLogger, requestLogger };
export default logger;
//# sourceMappingURL=index.d.ts.map