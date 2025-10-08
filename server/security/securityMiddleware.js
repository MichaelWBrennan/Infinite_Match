import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import helmet from 'helmet';
import cors from 'cors';
import { body, validationResult } from 'express-validator';
import hpp from 'hpp';
import xss from 'xss';
import mongoSanitize from 'express-mongo-sanitize';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// Security configuration
const SECURITY_CONFIG = {
  JWT_SECRET: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
  JWT_EXPIRES_IN: '24h',
  BCRYPT_ROUNDS: 12,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_TIME: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: 100, // requests per window
  SLOW_DOWN_DELAY: 500, // ms delay after 1 request per second
  ENCRYPTION_ALGORITHM: 'aes-256-gcm',
  ENCRYPTION_KEY:
    process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'),
  IV_LENGTH: 16,
  TAG_LENGTH: 16,
};

// Security logging
const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new DailyRotateFile({
      filename: 'logs/security-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// In-memory stores for security tracking
const loginAttempts = new Map();
const suspiciousIPs = new Map();
const securityEvents = new Map();
const activeSessions = new Map();

/**
 * Enhanced Helmet configuration for maximum security
 */
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
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
 * CORS configuration with security restrictions
 */
export const corsConfig = cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'https://yourdomain.com',
      // Add your production domains
    ];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      securityLogger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
});

/**
 * Rate limiting with different tiers
 */
export const generalRateLimit = rateLimit({
  windowMs: SECURITY_CONFIG.RATE_LIMIT_WINDOW,
  max: SECURITY_CONFIG.RATE_LIMIT_MAX,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(SECURITY_CONFIG.RATE_LIMIT_WINDOW / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    securityLogger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(SECURITY_CONFIG.RATE_LIMIT_WINDOW / 1000),
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
 * Slow down middleware to prevent rapid requests
 */
export const slowDownConfig = slowDown({
  windowMs: 1000, // 1 second
  delayAfter: 1, // allow 1 request per second
  delayMs: SECURITY_CONFIG.SLOW_DOWN_DELAY,
  maxDelayMs: 20000, // max 20 seconds delay
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

/**
 * Input validation and sanitization
 */
export const inputValidation = [
  // Sanitize data
  mongoSanitize(),

  // Prevent parameter pollution
  hpp(),

  // XSS protection
  (req, res, next) => {
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }
    next();
  },
];

/**
 * Security headers middleware
 */
export const securityHeaders = (req, res, next) => {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');

  // Add custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );

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

  // Log request
  securityLogger.info('Request started', {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });

  // Log response
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

  // Check if IP is in suspicious list
  if (suspiciousIPs.has(clientIP)) {
    const suspiciousData = suspiciousIPs.get(clientIP);
    const timeSinceLastSuspicious = Date.now() - suspiciousData.lastSeen;

    if (timeSinceLastSuspicious < 24 * 60 * 60 * 1000) {
      // 24 hours
      securityLogger.warn(`Blocked request from suspicious IP: ${clientIP}`);
      return res.status(403).json({
        error: 'Access denied due to suspicious activity',
        requestId: req.requestId,
      });
    } else {
      // Remove from suspicious list after 24 hours
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
    const decoded = jwt.verify(token, SECURITY_CONFIG.JWT_SECRET);

    // Check if session is still active
    if (!activeSessions.has(decoded.sessionId)) {
      return res.status(401).json({
        error: 'Session expired or invalid',
        requestId: req.requestId,
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
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
 * Anti-cheat validation middleware
 */
export const antiCheatValidation = (req, res, next) => {
  const { gameData, playerId } = req.body;

  if (!gameData || !playerId) {
    return next();
  }

  // Validate game data integrity
  if (!validateGameDataIntegrity(gameData)) {
    securityLogger.warn(`Suspicious game data from player: ${playerId}`, {
      playerId,
      gameData,
      ip: req.ip,
      requestId: req.requestId,
    });

    // Mark IP as suspicious
    markIPSuspicious(req.ip, 'Invalid game data');

    return res.status(400).json({
      error: 'Invalid game data detected',
      requestId: req.requestId,
    });
  }

  // Check for impossible values
  if (hasImpossibleValues(gameData)) {
    securityLogger.warn(`Impossible values detected from player: ${playerId}`, {
      playerId,
      gameData,
      ip: req.ip,
      requestId: req.requestId,
    });

    return res.status(400).json({
      error: 'Impossible game values detected',
      requestId: req.requestId,
    });
  }

  next();
};

/**
 * Data encryption utilities
 */
export const encryptData = (data) => {
  const iv = crypto.randomBytes(SECURITY_CONFIG.IV_LENGTH);
  const cipher = crypto.createCipher(
    SECURITY_CONFIG.ENCRYPTION_ALGORITHM,
    SECURITY_CONFIG.ENCRYPTION_KEY
  );

  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  };
};

export const decryptData = (encryptedData) => {
  try {
    const decipher = crypto.createDecipher(
      SECURITY_CONFIG.ENCRYPTION_ALGORITHM,
      SECURITY_CONFIG.ENCRYPTION_KEY
    );
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  } catch (error) {
    securityLogger.error('Failed to decrypt data', { error: error.message });
    throw new Error('Decryption failed');
  }
};

/**
 * Password hashing
 */
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, SECURITY_CONFIG.BCRYPT_ROUNDS);
};

export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * JWT token generation
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, SECURITY_CONFIG.JWT_SECRET, {
    expiresIn: SECURITY_CONFIG.JWT_EXPIRES_IN,
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
  if (!session) return false;

  // Update last activity
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

/**
 * Mark IP as suspicious
 */
export const markIPSuspicious = (ip, reason) => {
  suspiciousIPs.set(ip, {
    reason,
    lastSeen: Date.now(),
    count: (suspiciousIPs.get(ip)?.count || 0) + 1,
  });

  logSecurityEvent('suspicious_ip', { ip, reason });
};

/**
 * Validate game data integrity
 */
const validateGameDataIntegrity = (gameData) => {
  // Check for required fields
  const requiredFields = ['timestamp', 'playerId', 'action'];
  for (const field of requiredFields) {
    if (!gameData[field]) {
      return false;
    }
  }

  // Check timestamp is recent (within last 5 minutes)
  const dataTime = new Date(gameData.timestamp).getTime();
  const now = Date.now();
  if (now - dataTime > 5 * 60 * 1000) {
    return false;
  }

  return true;
};

/**
 * Check for impossible values
 */
const hasImpossibleValues = (gameData) => {
  // Check for negative values where they shouldn't be
  if (gameData.score && gameData.score < 0) return true;
  if (gameData.coins && gameData.coins < 0) return true;
  if (gameData.gems && gameData.gems < 0) return true;

  // Check for impossibly high values
  if (gameData.score && gameData.score > 10000000) return true;
  if (gameData.coins && gameData.coins > 1000000) return true;
  if (gameData.gems && gameData.gems > 100000) return true;

  return false;
};

/**
 * Sanitize object recursively
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
      // 24 hours
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
  antiCheatValidation,
  encryptData,
  decryptData,
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
