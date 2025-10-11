export class AppError extends Error {
    constructor(message: any, code: any, statusCode?: number, context?: {});
    code: any;
    statusCode: number;
    context: {};
    timestamp: string;
}
export class ValidationError extends AppError {
    constructor(message: any, field?: null, context?: {});
}
export class NetworkError extends AppError {
    constructor(message: any, url?: null, context?: {});
}
export class ConfigurationError extends AppError {
    constructor(message: any, configKey?: null, context?: {});
}
export class ServiceError extends AppError {
    constructor(message: any, serviceName?: null, context?: {});
}
export class ErrorHandler {
    /**
     * Handle and categorize errors
     * @param {Error} error - The error to handle
     * @param {Object} context - Additional context
     * @returns {Object} Error information
     */
    static handle(error: Error, context?: Object): Object;
    static handleValidationError(errorInfo: any): any;
    static handleNetworkError(errorInfo: any): any;
    static handleConfigurationError(errorInfo: any): any;
    static handleServiceError(errorInfo: any): any;
    static handleAppError(errorInfo: any): any;
    static handleGenericError(errorInfo: any): any;
    /**
     * Create a standardized error response
     * @param {Object} errorInfo - Error information
     * @returns {Object} Standardized error response
     */
    static createErrorResponse(errorInfo: Object): Object;
    /**
     * Wrap async functions with error handling
     * @param {Function} fn - Async function to wrap
     * @param {Object} context - Error context
     * @returns {Function} Wrapped function
     */
    static wrapAsync(fn: Function, context?: Object): Function;
}
export default ErrorHandler;
//# sourceMappingURL=ErrorHandler.d.ts.map