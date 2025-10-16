/**
 * Application Constants
 * Centralized constants used throughout the application
 */

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  SERVICE_ERROR: 'SERVICE_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

export const CACHE_KEYS = {
  ECONOMY_DATA: 'economy_data',
  USER_SESSION: 'user_session',
  SEGMENTS: 'segments',
  RECEIPT: 'receipt',
  UNITY_CONFIG: 'unity_config',
};

export const CACHE_TTL = {
  ECONOMY_DATA: 5 * 60 * 1000, // 5 minutes
  USER_SESSION: 24 * 60 * 60 * 1000, // 24 hours
  SEGMENTS: 10 * 60 * 1000, // 10 minutes
  RECEIPT: 5 * 60 * 1000, // 5 minutes
  UNITY_CONFIG: 30 * 60 * 1000, // 30 minutes
};

export const RATE_LIMITS = {
  GENERAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
  },
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per window
  },
  STRICT: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 requests per window
  },
};

export const VALIDATION_RULES = {
  PLAYER_ID: {
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_-]+$/,
  },
  EMAIL: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  PASSWORD: {
    minLength: 8,
    maxLength: 128,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  },
  CURRENCY_CODE: {
    pattern: /^[A-Z]{3}$/,
  },
  SKU: {
    pattern: /^[a-zA-Z0-9_-]+$/,
    minLength: 3,
    maxLength: 50,
  },
};

export const ECONOMY_TYPES = {
  CURRENCY: 'currency',
  INVENTORY: 'inventory',
  CATALOG: 'catalog',
};

export const RARITY_LEVELS = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
};

export const PROMO_CODES = {
  WELCOME: 'WELCOME',
  FREE100: 'FREE100',
  STARTER: 'STARTER',
  COMEBACK: 'COMEBACK',
};

export const PROMO_REWARDS = {
  WELCOME: { coins: 1000, gems: 50 },
  FREE100: { coins: 100, gems: 10 },
  STARTER: { coins: 500, gems: 25 },
  COMEBACK: { coins: 2000, gems: 100 },
};

export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};

export const SECURITY_EVENTS = {
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  PROMO_CODE_USED: 'promo_code_used',
  INVALID_PROMO_CODE: 'invalid_promo_code',
};

export default {
  HTTP_STATUS,
  ERROR_CODES,
  CACHE_KEYS,
  CACHE_TTL,
  RATE_LIMITS,
  VALIDATION_RULES,
  ECONOMY_TYPES,
  RARITY_LEVELS,
  PROMO_CODES,
  PROMO_REWARDS,
  LOG_LEVELS,
  SECURITY_EVENTS,
};
