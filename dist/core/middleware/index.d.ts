/**
 * Optimized Middleware Management
 * Consolidated middleware functions with enhanced functionality
 */
import { Request, Response, NextFunction } from 'express';
export declare const requestIdMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const requestLoggingMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const errorHandlingMiddleware: (error: Error, req: Request, res: Response, next: NextFunction) => void;
export declare const securityHeadersMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const corsPreflightMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const rateLimitResponseMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const healthCheckMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const apiVersioningMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const requestSizeValidationMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const contentTypeValidationMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const requestTimeoutMiddleware: (timeoutMs?: number) => (req: Request, res: Response, next: NextFunction) => void;
export declare const asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateRequest: (req: Request, res: Response, next: NextFunction) => void;
export declare const responseFormatter: (req: Request, res: Response, next: NextFunction) => void;
export declare const performanceMonitor: (req: Request, res: Response, next: NextFunction) => void;
export declare const analyticsMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const gameEventMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare class MiddlewareChain {
    private middlewares;
    add(middleware: (req: Request, res: Response, next: NextFunction) => void): MiddlewareChain;
    build(): Array<(req: Request, res: Response, next: NextFunction) => void>;
}
export declare const createSecurityChain: () => MiddlewareChain;
export declare const createApiChain: () => MiddlewareChain;
export declare const createErrorChain: () => MiddlewareChain;
export declare const createGameChain: () => MiddlewareChain;
declare const _default: {
    requestIdMiddleware: (req: Request, res: Response, next: NextFunction) => void;
    requestLoggingMiddleware: (req: Request, res: Response, next: NextFunction) => void;
    errorHandlingMiddleware: (error: Error, req: Request, res: Response, next: NextFunction) => void;
    securityHeadersMiddleware: (req: Request, res: Response, next: NextFunction) => void;
    corsPreflightMiddleware: (req: Request, res: Response, next: NextFunction) => void;
    rateLimitResponseMiddleware: (req: Request, res: Response, next: NextFunction) => void;
    healthCheckMiddleware: (req: Request, res: Response, next: NextFunction) => void;
    apiVersioningMiddleware: (req: Request, res: Response, next: NextFunction) => void;
    requestSizeValidationMiddleware: (req: Request, res: Response, next: NextFunction) => void;
    contentTypeValidationMiddleware: (req: Request, res: Response, next: NextFunction) => void;
    requestTimeoutMiddleware: (timeoutMs?: number) => (req: Request, res: Response, next: NextFunction) => void;
    asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
    validateRequest: (req: Request, res: Response, next: NextFunction) => void;
    responseFormatter: (req: Request, res: Response, next: NextFunction) => void;
    performanceMonitor: (req: Request, res: Response, next: NextFunction) => void;
    analyticsMiddleware: (req: Request, res: Response, next: NextFunction) => void;
    gameEventMiddleware: (req: Request, res: Response, next: NextFunction) => void;
    MiddlewareChain: typeof MiddlewareChain;
    createSecurityChain: () => MiddlewareChain;
    createApiChain: () => MiddlewareChain;
    createErrorChain: () => MiddlewareChain;
    createGameChain: () => MiddlewareChain;
};
export default _default;
//# sourceMappingURL=index.d.ts.map