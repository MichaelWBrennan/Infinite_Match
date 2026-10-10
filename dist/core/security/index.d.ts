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
export const slowDownConfig: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Input validation and sanitization
 */
export const inputValidation: any[];
export function securityHeaders(req: any, res: any, next: any): void;
export function requestLogger(req: any, res: any, next: any): void;
export function ipReputationCheck(req: any, res: any, next: any): any;
export function sessionValidation(req: any, res: any, next: any): Promise<any>;
export function hashPassword(password: any): Promise<string>;
export function comparePassword(password: any, hash: any): Promise<boolean>;
export function generateToken(payload: any): Promise<string>;
export function createSession(userId: any, sessionData?: {}): `${string}-${string}-${string}-${string}-${string}`;
export function validateSession(sessionId: any): any;
export function destroySession(sessionId: any): void;
export function logSecurityEvent(eventType: any, details: any): `${string}-${string}-${string}-${string}-${string}`;
export function getSecurityEvents({ limit, eventType }?: {
    limit?: number | undefined;
}): Promise<any[]>;
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
    export { getSecurityEvents };
    export { markIPSuspicious };
    export { cleanupOldData };
}
export default _default;
export function requirePermission(permission: any): (req: any, res: any, next: any) => any;
export function requireMinRole(minRole: any): (req: any, res: any, next: any) => any;
export function syncPlatformAccount(syncData: any): Promise<{
    success: boolean;
    syncData: {
        playerId: any;
        platform: any;
        platformUserId: any;
        platformUsername: any;
        platformData: any;
        syncedAt: string;
        isActive: boolean;
    };
    error?: never;
} | {
    success: boolean;
    error: string;
    syncData?: never;
}>;
export function getPlatformSyncStatus(playerId: any): Promise<{}>;
export function unlinkPlatformAccount(playerId: any, platform: any): Promise<{
    success: boolean;
    error: string;
} | {
    success: boolean;
    error?: never;
}>;
import cors from 'cors';
//# sourceMappingURL=index.d.ts.map