export default logger;
export const logger: winston.Logger;
export const securityLogger: winston.Logger;
export const requestLogger: winston.Logger;
export class Logger {
    constructor(context?: string);
    context: string;
    info(message: any, meta?: {}): void;
    warn(message: any, meta?: {}): void;
    error(message: any, meta?: {}): void;
    debug(message: any, meta?: {}): void;
    security(event: any, details?: {}): void;
    request(req: any, res: any, duration: any): void;
}
import winston from 'winston';
//# sourceMappingURL=index.d.ts.map