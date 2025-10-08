/**
 * Core Configuration Module
 * Centralized configuration management following industry standards
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const AppConfig = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3030,
    host: process.env.HOST || '0.0.0.0',
    environment: process.env.NODE_ENV || 'development',
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      credentials: true,
    },
  },

  // Security Configuration
  security: {
    jwt: {
      secret: process.env.JWT_SECRET || 'your-secret-key',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    },
    bcrypt: {
      rounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    },
    encryption: {
      algorithm: 'aes-256-gcm',
      key: process.env.ENCRYPTION_KEY || 'your-encryption-key',
    },
  },

  // Unity Services Configuration
  unity: {
    projectId: process.env.UNITY_PROJECT_ID || '0dd5a03e-7f23-49c4-964e-7919c48c0574',
    environmentId: process.env.UNITY_ENV_ID || '1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d',
    clientId: process.env.UNITY_CLIENT_ID || '',
    clientSecret: process.env.UNITY_CLIENT_SECRET || '',
  },

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL || 'mongodb://localhost:27017/evergreen-match3',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    file: {
      enabled: process.env.LOG_FILE_ENABLED === 'true',
      path: process.env.LOG_FILE_PATH || join(__dirname, '../../logs'),
      maxSize: process.env.LOG_MAX_SIZE || '20m',
      maxFiles: process.env.LOG_MAX_FILES || '14d',
    },
  },

  // Cache Configuration
  cache: {
    ttl: {
      receipt: parseInt(process.env.CACHE_RECEIPT_TTL) || 5 * 60 * 1000,
      segments: parseInt(process.env.CACHE_SEGMENTS_TTL) || 10 * 60 * 1000,
    },
    maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 1000,
  },

  // File Paths
  paths: {
    root: join(__dirname, '../..'),
    assets: join(__dirname, '../../assets'),
    config: join(__dirname, '../../config'),
    logs: join(__dirname, '../../logs'),
    temp: join(__dirname, '../../temp'),
  },
};

export default AppConfig;