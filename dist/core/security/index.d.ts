/**
 * Enhanced Helmet configuration
 */
export const helmetConfig: (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void;
/**
 * CORS configuration
 */
export const corsConfig: any;
/**
 * Rate limiting configurations
 */
export const generalRateLimit: any;
export const strictRateLimit: any;
export const authRateLimit: any;
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
export function hashPassword(password: any): Promise<any>;
export function comparePassword(password: any, hash: any): Promise<any>;
export function generateToken(payload: any): any;
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
//# sourceMappingURL=index.d.ts.map