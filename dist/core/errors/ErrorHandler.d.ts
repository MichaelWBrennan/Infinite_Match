/**
 * Centralized Error Handling Framework
 * Provides consistent error handling across the application
 */
export interface ErrorContext {
    [key: string]: any;
}
export interface ErrorInfo {
    message: string;
    name: string;
    context: ErrorContext;
    timestamp: string;
    stack?: string | undefined;
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
export declare class AppError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly context: ErrorContext;
    readonly timestamp: string;
    constructor(message: string, code: string, statusCode?: number, context?: ErrorContext);
}
export declare class ValidationError extends AppError {
    constructor(message: string, field?: string | null, context?: ErrorContext);
}
export declare class NetworkError extends AppError {
    constructor(message: string, url?: string | null, context?: ErrorContext);
}
export declare class ConfigurationError extends AppError {
    constructor(message: string, configKey?: string | null, context?: ErrorContext);
}
export declare class ServiceError extends AppError {
    constructor(message: string, serviceName?: string | null, context?: ErrorContext);
}
export declare class ErrorHandler {
    /**
     * Handle and categorize errors
     */
    static handle(error: Error, context?: ErrorContext): HandledError;
    private static handleValidationError;
    private static handleNetworkError;
    private static handleConfigurationError;
    private static handleServiceError;
    private static handleAppError;
    private static handleGenericError;
    /**
     * Create a standardized error response
     */
    static createErrorResponse(errorInfo: HandledError): ErrorResponse;
    /**
     * Wrap async functions with error handling
     */
    static wrapAsync<T extends (...args: any[]) => Promise<any>>(fn: T, context?: ErrorContext): T;
}
export default ErrorHandler;
//# sourceMappingURL=ErrorHandler.d.ts.map