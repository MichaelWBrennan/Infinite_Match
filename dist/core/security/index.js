/**
 * Centralized Security Module
 * Industry-standard security utilities and middleware
 */
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import xss from 'xss';
import mongoSanitize from 'express-mongo-sanitize';
import { AppConfig } from '../config/index.js';
import { securityLogger } from 'logger/index.js';
import { rbacProvider, ROLES, PERMISSIONS } from './rbac.js';
// In-memory stores for security tracking
const suspiciousIPs = new Map();
const securityEvents = new Map();
const activeSessions = new Map();
/**
 * Enhanced Helmet configuration
 */
export const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ['\'self\''],
            styleSrc: ['\'self\'', '\'unsafe-inline\''],
            scriptSrc: ['\'self\''],
            imgSrc: ['\'self\'', 'data:', 'https:'],
            connectSrc: ['\'self\''],
            fontSrc: ['\'self\''],
            objectSrc: ['\'none\''],
            mediaSrc: ['\'self\''],
            frameSrc: ['\'none\''],
        },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
});
/**
 * CORS configuration
 */
export const corsConfig = cors({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (AppConfig.server.cors.origin.includes(origin)) {
            callback(null, true);
        }
        else {
            securityLogger.warn(`CORS blocked request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: AppConfig.server.cors.credentials,
    optionsSuccessStatus: 200,
});
/**
 * Rate limiting configurations
 */
export const generalRateLimit = rateLimit({
    windowMs: AppConfig.security.rateLimit.windowMs,
    max: AppConfig.security.rateLimit.max,
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(AppConfig.security.rateLimit.windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        securityLogger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many requests from this IP, please try again later.',
            retryAfter: Math.ceil(AppConfig.security.rateLimit.windowMs / 1000),
        });
    },
});
export const strictRateLimit = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 requests per 5 minutes
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: 300,
    },
    standardHeaders: true,
    legacyHeaders: false,
});
export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per 15 minutes
    message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: 900,
    },
    standardHeaders: true,
    legacyHeaders: false,
});
/**
 * Slow down middleware
 */
export const slowDownConfig = slowDown({
    windowMs: 1000, // 1 second
    delayAfter: 1, // allow 1 request per second
    delayMs: 500,
    maxDelayMs: 20000, // max 20 seconds delay
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
});
/**
 * Input validation and sanitization
 */
export const inputValidation = [
    mongoSanitize(),
    hpp(),
    (req, res, next) => {
        if (req.body)
            req.body = sanitizeObject(req.body);
        if (req.query)
            req.query = sanitizeObject(req.query);
        if (req.params)
            req.params = sanitizeObject(req.params);
        next();
    },
];
/**
 * Security headers middleware
 */
export const securityHeaders = (req, res, next) => {
    res.removeHeader('X-Powered-By');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
};
/**
 * Request logging middleware
 */
export const requestLogger = (req, res, next) => {
    const start = Date.now();
    const requestId = crypto.randomUUID();
    req.requestId = requestId;
    req.startTime = start;
    securityLogger.info('Request started', {
        requestId,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
    });
    res.on('finish', () => {
        const duration = Date.now() - start;
        securityLogger.info('Request completed', {
            requestId,
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
        });
    });
    next();
};
/**
 * IP reputation check
 */
export const ipReputationCheck = (req, res, next) => {
    const clientIP = req.ip;
    if (suspiciousIPs.has(clientIP)) {
        const suspiciousData = suspiciousIPs.get(clientIP);
        const timeSinceLastSuspicious = Date.now() - suspiciousData.lastSeen;
        if (timeSinceLastSuspicious < 24 * 60 * 60 * 1000) {
            securityLogger.warn(`Blocked request from suspicious IP: ${clientIP}`);
            return res.status(403).json({
                error: 'Access denied due to suspicious activity',
                requestId: req.requestId,
            });
        }
        else {
            suspiciousIPs.delete(clientIP);
        }
    }
    next();
};
/**
 * Session validation middleware
 */
export const sessionValidation = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({
            error: 'No authentication token provided',
            requestId: req.requestId,
        });
    }
    try {
        const decoded = jwt.verify(token, AppConfig.security.jwt.secret);
        if (!activeSessions.has(decoded.sessionId)) {
            return res.status(401).json({
                error: 'Session expired or invalid',
                requestId: req.requestId,
            });
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        securityLogger.warn(`Invalid token from IP: ${req.ip}`, {
            error: error.message,
        });
        return res.status(401).json({
            error: 'Invalid authentication token',
            requestId: req.requestId,
        });
    }
};
/**
 * Password utilities
 */
export const hashPassword = async (password) => {
    return await bcrypt.hash(password, AppConfig.security.bcrypt.rounds);
};
export const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};
/**
 * JWT utilities
 */
export const generateToken = (payload) => {
    return jwt.sign(payload, AppConfig.security.jwt.secret, {
        expiresIn: AppConfig.security.jwt.expiresIn,
    });
};
/**
 * Session management
 */
export const createSession = (userId, sessionData = {}) => {
    const sessionId = crypto.randomUUID();
    const session = {
        sessionId,
        userId,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        ...sessionData,
    };
    activeSessions.set(sessionId, session);
    return sessionId;
};
export const validateSession = (sessionId) => {
    const session = activeSessions.get(sessionId);
    if (!session)
        return false;
    session.lastActivity = Date.now();
    return session;
};
export const destroySession = (sessionId) => {
    activeSessions.delete(sessionId);
};
/**
 * Security event tracking
 */
export const logSecurityEvent = (eventType, details) => {
    const eventId = crypto.randomUUID();
    const event = {
        eventId,
        eventType,
        details,
        timestamp: Date.now(),
    };
    securityEvents.set(eventId, event);
    securityLogger.info('Security event', event);
    return eventId;
};
export const markIPSuspicious = (ip, reason) => {
    suspiciousIPs.set(ip, {
        reason,
        lastSeen: Date.now(),
        count: (suspiciousIPs.get(ip)?.count || 0) + 1,
    });
    logSecurityEvent('suspicious_ip', { ip, reason });
};
/**
 * Data sanitization
 */
const sanitizeObject = (obj) => {
    if (typeof obj === 'string') {
        return xss(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
    }
    return obj;
};
/**
 * Cleanup old data
 */
export const cleanupOldData = () => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    // Clean up old security events
    for (const [eventId, event] of securityEvents.entries()) {
        if (now - event.timestamp > oneDay) {
            securityEvents.delete(eventId);
        }
    }
    // Clean up old suspicious IPs
    for (const [ip, data] of suspiciousIPs.entries()) {
        if (now - data.lastSeen > oneDay) {
            suspiciousIPs.delete(ip);
        }
    }
    // Clean up inactive sessions
    for (const [sessionId, session] of activeSessions.entries()) {
        if (now - session.lastActivity > 24 * 60 * 60 * 1000) {
            activeSessions.delete(sessionId);
        }
    }
};
// Run cleanup every hour
setInterval(cleanupOldData, 60 * 60 * 1000);
export default {
    helmetConfig,
    corsConfig,
    generalRateLimit,
    strictRateLimit,
    authRateLimit,
    slowDownConfig,
    inputValidation,
    securityHeaders,
    requestLogger,
    ipReputationCheck,
    sessionValidation,
    hashPassword,
    comparePassword,
    generateToken,
    createSession,
    validateSession,
    destroySession,
    logSecurityEvent,
    markIPSuspicious,
    cleanupOldData,
};
// RBAC Middleware Functions
export const requirePermission = (permission) => {
    return (req, res, next) => {
        try {
            const { playerId } = req.user || {};
            if (!playerId) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    requestId: req.requestId
                });
            }
            if (!rbacProvider.hasPermission(playerId, permission)) {
                securityLogger.warn('Permission denied', {
                    playerId,
                    permission,
                    ip: req.ip,
                    userAgent: req.get('User-Agent')
                });
                return res.status(403).json({
                    success: false,
                    error: 'Insufficient permissions',
                    requestId: req.requestId
                });
            }
            next();
        }
        catch (error) {
            securityLogger.error('Permission check failed', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Permission check failed',
                requestId: req.requestId
            });
        }
    };
};
export const requireMinRole = (minRole) => {
    return (req, res, next) => {
        try {
            const { playerId } = req.user || {};
            if (!playerId) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    requestId: req.requestId
                });
            }
            const userRole = rbacProvider.getUserRole(playerId);
            const roleHierarchy = {
                [ROLES.GUEST]: 0,
                [ROLES.USER]: 1,
                [ROLES.PREMIUM_USER]: 2,
                [ROLES.MODERATOR]: 3,
                [ROLES.ADMIN]: 4,
                [ROLES.SUPER_ADMIN]: 5
            };
            const userLevel = roleHierarchy[userRole] || 0;
            const requiredLevel = roleHierarchy[minRole] || 0;
            if (userLevel < requiredLevel) {
                securityLogger.warn('Insufficient role level', {
                    playerId,
                    requiredRole: minRole,
                    userRole,
                    ip: req.ip,
                    userAgent: req.get('User-Agent')
                });
                return res.status(403).json({
                    success: false,
                    error: 'Insufficient role privileges',
                    requestId: req.requestId
                });
            }
            next();
        }
        catch (error) {
            securityLogger.error('Role level check failed', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Role level check failed',
                requestId: req.requestId
            });
        }
    };
};
//# sourceMappingURL=index.js.map