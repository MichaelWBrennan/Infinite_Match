/**
 * Enhanced Helmet configuration
 */
export const helmetConfig: (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void;
/**
 * CORS configuration
 */
export const corsConfig: (req: cors.CorsRequest, res: {
    statusCode?: number | undefined;
    setHeader(key: string, value: string): any;
    end(): any;
}, next: (err?: any) => any) => void;
/**
 * Rate limiting configurations
 */
export const generalRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export const strictRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export const authRateLimit: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Slow down middleware
 */
export const slowDownConfig: any;
/**
 * Input validation and sanitization
 */
export const inputValidation: any[];
export function securityHeaders(req: any, res: any, next: any): void;
export function requestLogger(req: any, res: any, next: any): void;
export function ipReputationCheck(req: any, res: any, next: any): any;
export function sessionValidation(req: any, res: any, next: any): any;
export function hashPassword(password: any): Promise<string>;
export function comparePassword(password: any, hash: any): Promise<boolean>;
export function generateToken(payload: any): string;
export function createSession(userId: any, sessionData?: {}): `${string}-${string}-${string}-${string}-${string}`;
export function validateSession(sessionId: any): any;
export function destroySession(sessionId: any): void;
export function logSecurityEvent(eventType: any, details: any): `${string}-${string}-${string}-${string}-${string}`;
export function markIPSuspicious(ip: any, reason: any): void;
export function cleanupOldData(): void;
declare namespace _default {
    export { helmetConfig };
    export { corsConfig };
    export { generalRateLimit };
    export { strictRateLimit };
    export { authRateLimit };
    export { slowDownConfig };
    export { inputValidation };
    export { securityHeaders };
    export { requestLogger };
    export { ipReputationCheck };
    export { sessionValidation };
    export { hashPassword };
    export { comparePassword };
    export { generateToken };
    export { createSession };
    export { validateSession };
    export { destroySession };
    export { logSecurityEvent };
    export { markIPSuspicious };
    export { cleanupOldData };
}
export default _default;
export function requirePermission(permission: any): (req: any, res: any, next: any) => any;
export function requireMinRole(minRole: any): (req: any, res: any, next: any) => any;
import cors from 'cors';
//# sourceMappingURL=index.d.ts.map