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

export interface ServerConfig {
  port: number;
  host: string;
  environment: string;
  cors: {
    origin: string[];
    credentials: boolean;
  };
}

export interface SecurityConfig {
  jwt: {
    secret: string;
    expiresIn: string;
  };
  bcrypt: {
    rounds: number;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  encryption: {
    algorithm: string;
    key: string;
  };
}

export interface UnityConfig {
  projectId: string;
  environmentId: string;
  clientId: string;
  clientSecret: string;
}

export interface DatabaseConfig {
  url: string;
  options: {
    useNewUrlParser: boolean;
    useUnifiedTopology: boolean;
  };
}

export interface LoggingConfig {
  level: string;
  format: string;
  file: {
    enabled: boolean;
    path: string;
    maxSize: string;
    maxFiles: string;
  };
}

export interface CacheConfig {
  ttl: {
    receipt: number;
    segments: number;
  };
  maxSize: number;
}

export interface PaymentsConfig {
  apple: {
    sharedSecret: string;
  };
  google: {
    serviceAccountKeyPath: string;
  };
  pricing: {
    defaultCurrency: string;
    countryOverridesPath: string;
  };
}

export interface PathsConfig {
  root: string;
  assets: string;
  config: string;
  logs: string;
  temp: string;
}

export interface AppConfigType {
  server: ServerConfig;
  security: SecurityConfig;
  unity: UnityConfig;
  database: DatabaseConfig;
  logging: LoggingConfig;
  cache: CacheConfig;
  payments: PaymentsConfig;
  paths: PathsConfig;
}

export const AppConfig: AppConfigType = {
  // Server Configuration
  server: {
    port: parseInt(process.env['PORT'] || '3030'),
    host: process.env['HOST'] || '0.0.0.0',
    environment: process.env['NODE_ENV'] || 'development',
    cors: {
      origin: process.env['CORS_ORIGIN']?.split(',') || ['http://localhost:3000'],
      credentials: true,
    },
  },

  // Security Configuration
  security: {
    jwt: {
      secret: process.env['JWT_SECRET'] || 'CHANGE_THIS_IN_PRODUCTION_USE_STRONG_SECRET_32_CHARS_MIN',
      expiresIn: process.env['JWT_EXPIRES_IN'] || '24h',
    },
    bcrypt: {
      rounds: parseInt(process.env['BCRYPT_ROUNDS'] || '12'),
    },
    rateLimit: {
      windowMs: parseInt(process.env['RATE_LIMIT_WINDOW'] || '900000'), // 15 minutes
      max: parseInt(process.env['RATE_LIMIT_MAX'] || '100'),
    },
    encryption: {
      algorithm: 'aes-256-gcm',
      key: process.env['ENCRYPTION_KEY'] || 'CHANGE_THIS_IN_PRODUCTION_USE_STRONG_32_CHAR_KEY',
    },
  },

  // Unity Services Configuration
  unity: {
    projectId: process.env['UNITY_PROJECT_ID'] || '0dd5a03e-7f23-49c4-964e-7919c48c0574',
    environmentId: process.env['UNITY_ENV_ID'] || '1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d',
    clientId: process.env['UNITY_CLIENT_ID'] || '',
    clientSecret: process.env['UNITY_CLIENT_SECRET'] || '',
  },

  // Database Configuration
  database: {
    url: process.env['DATABASE_URL'] || 'mongodb://localhost:27017/infinite-match',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },

  // Logging Configuration
  logging: {
    level: process.env['LOG_LEVEL'] || 'info',
    format: process.env['LOG_FORMAT'] || 'json',
    file: {
      enabled: process.env['LOG_FILE_ENABLED'] === 'true',
      path: process.env['LOG_FILE_PATH'] || join(__dirname, 'logs'),
      maxSize: process.env['LOG_MAX_SIZE'] || '20m',
      maxFiles: process.env['LOG_MAX_FILES'] || '14d',
    },
  },

  // Cache Configuration
  cache: {
    ttl: {
      receipt: parseInt(process.env['CACHE_RECEIPT_TTL'] || '300000'), // 5 minutes
      segments: parseInt(process.env['CACHE_SEGMENTS_TTL'] || '600000'), // 10 minutes
    },
    maxSize: parseInt(process.env['CACHE_MAX_SIZE'] || '1000'),
  },

  // Payments / Monetization configuration
  payments: {
    apple: {
      sharedSecret: process.env['APPLE_SHARED_SECRET'] || '',
    },
    google: {
      serviceAccountKeyPath: process.env['GOOGLE_SERVICE_ACCOUNT_KEY_PATH'] || '',
    },
    pricing: {
      defaultCurrency: process.env['DEFAULT_CURRENCY'] || 'USD',
      countryOverridesPath: process.env['PRICING_OVERRIDES_PATH'] || '',
    },
  },

  // File Paths
  paths: {
    root: join(__dirname, '..'),
    assets: join(__dirname, 'assets'),
    config: join(__dirname, '..', '..', 'economy'), // Point to /workspace/economy
    logs: join(__dirname, 'logs'),
    temp: join(__dirname, 'temp'),
  },
};

export default AppConfig;
