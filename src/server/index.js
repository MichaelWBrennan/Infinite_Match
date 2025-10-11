/**
 * Main Server Application
 * Simplified and industry-standard Express server
 */

import express from 'express';
import compression from 'compression';
import { v4 as uuidv4 } from 'uuid';

// Core modules
import { AppConfig } from 'core/config/index.js';
import { Logger } from 'core/logger/index.js';
import security from 'core/security/index.js';
import { mobileGameSecurity } from 'core/security/mobile-game-security.js';
import {
  registerServices,
  getService,
} from 'core/services/ServiceRegistry.js';
import {
  asyncHandler,
  responseFormatter,
  performanceMonitor,
  errorHandler,
} from 'core/middleware/index.js';
import { HTTP_STATUS, CACHE_KEYS, PROMO_CODES, PROMO_REWARDS } from 'core/constants/index.js';

// Routes
import authRoutes from 'routes/auth.js';
import economyRoutes from 'routes/economy.js';
import gameRoutes from 'routes/game.js';
import adminRoutes from 'routes/admin.js';

const logger = new Logger('Server');
const app = express();

// Register services
registerServices();

// Initialize services
const unityService = getService('unityService');
const economyService = getService('economyService');

// Middleware stack
app.use(security.helmetConfig);
app.use(security.corsConfig);
app.use(security.securityHeaders);
app.use(security.requestLogger);
app.use(security.ipReputationCheck);
app.use(security.slowDownConfig);
app.use(security.generalRateLimit);

// Compression
app.use(compression());

// Input validation
app.use(security.inputValidation);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID middleware
app.use((req, res, next) => {
  req.requestId = uuidv4();
  next();
});

// Performance monitoring
app.use(performanceMonitor);

// Response formatter
app.use(responseFormatter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Mobile game health check endpoint
app.get('/health/mobile', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'mobile',
    environment: AppConfig.server.environment,
    timestamp: new Date().toISOString(),
    services: {
      game: 'active',
      economy: 'active',
      analytics: 'active',
      security: 'active',
      unity: 'active',
      ai: 'active'
    }
  });
});

// Mobile Game Security Endpoints
app.post('/api/mobile/device/fingerprint', asyncHandler(async (req, res) => {
  const { deviceInfo } = req.body;
  
  if (!deviceInfo) {
    return res.status(400).json({
      success: false,
      error: 'Device information required',
      requestId: req.requestId
    });
  }
  
  const fingerprint = mobileGameSecurity.generateDeviceFingerprint(deviceInfo);
  
  res.json({
    success: true,
    fingerprint,
    requestId: req.requestId
  });
}));

app.post('/api/mobile/cheat/detect', security.sessionValidation, asyncHandler(async (req, res) => {
  const { gameAction } = req.body;
  const { playerId } = req.user;
  
  if (!gameAction) {
    return res.status(400).json({
      success: false,
      error: 'Game action data required',
      requestId: req.requestId
    });
  }
  
  const cheatDetection = mobileGameSecurity.detectCheating(playerId, gameAction);
  
  res.json({
    success: true,
    cheatDetection,
    requestId: req.requestId
  });
}));

app.post('/api/mobile/save/validate', security.sessionValidation, asyncHandler(async (req, res) => {
  const { saveData } = req.body;
  const { playerId } = req.user;
  
  if (!saveData) {
    return res.status(400).json({
      success: false,
      error: 'Save data required',
      requestId: req.requestId
    });
  }
  
  const validation = mobileGameSecurity.validateCloudSave(playerId, saveData);
  
  res.json({
    success: true,
    validation,
    requestId: req.requestId
  });
}));

app.get('/api/mobile/security/stats', security.requireMinRole('ADMIN'), (req, res) => {
  const stats = mobileGameSecurity.getMobileGameSecurityStats();
  
  res.json({
    success: true,
    stats,
    requestId: req.requestId
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/economy', economyRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/admin', adminRoutes);

// Receipt verification endpoint
app.post('/api/verify_receipt', security.authRateLimit, asyncHandler(async (req, res) => {
  const { sku, receipt } = req.body;

  if (!sku || !receipt) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      valid: false,
      error: 'Missing required fields: sku, receipt',
    });
  }

  // TODO: Implement actual receipt verification with Apple/Google
  const isValid = String(receipt).length > 20;

  res.json({
    valid: isValid,
    sku,
    timestamp: new Date().toISOString(),
  });
}));

// Segments endpoint
app.post('/api/segments', security.sessionValidation, asyncHandler(async (req, res) => {
  const profile = req.body;
  // const playerId = req.user.playerId;

  // Check cache first
  const cacheKey = `${CACHE_KEYS.SEGMENTS}_${JSON.stringify(profile)}`;
  const cached = economyService.getCachedData(cacheKey);

  if (cached) {
    return res.json({
      ...cached.data,
      cached: true,
    });
  }

  // Generate segments based on profile
  const overrides = {};

  if (profile.payer === 'nonpayer' && profile.skill === 'newbie') {
    overrides.best_value_sku = 'starter_pack_small';
  }

  if (profile.region === 'IN') {
    overrides.most_popular_sku = 'gems_medium';
  }

  if (profile.level && profile.level < 10) {
    overrides.tutorial_offers = true;
  }

  if (
    profile.last_play &&
    Date.now() - new Date(profile.last_play).getTime() >
      7 * 24 * 60 * 60 * 1000
  ) {
    overrides.comeback_offers = true;
  }

  const result = {
    ...overrides,
    timestamp: new Date().toISOString(),
  };

  // Cache the result
  economyService.setCachedData(cacheKey, result);

  res.json(result);
}));

// Promo codes endpoint
app.post('/api/promo', security.strictRateLimit, asyncHandler(async (req, res) => {
  const { code, playerId } = req.body;

  if (!code || !playerId) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      ok: false,
      error: 'Missing required fields: code, playerId',
    });
  }

  const validCodes = Object.values(PROMO_CODES);
  const isValid = validCodes.includes(String(code).toUpperCase());

  if (isValid) {
    security.logSecurityEvent('promo_code_used', {
      playerId,
      code: String(code).toUpperCase(),
      ip: req.ip,
    });

    res.json({
      ok: true,
      code: String(code).toUpperCase(),
      reward: PROMO_REWARDS[String(code).toUpperCase()],
    });
  } else {
    security.logSecurityEvent('invalid_promo_code', {
      playerId,
      code: String(code).toUpperCase(),
      ip: req.ip,
    });

    res.status(HTTP_STATUS.NOT_FOUND).json({
      ok: false,
      error: 'Invalid promo code',
    });
  }
}));

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    error: 'Not found',
    path: req.path,
  });
});

// Start server
const startServer = async () => {
  try {
    // Initialize Unity service
    await unityService.authenticate();

    // Start server
    app.listen(AppConfig.server.port, AppConfig.server.host, () => {
      logger.info(
        `Server started on ${AppConfig.server.host}:${AppConfig.server.port}`
      );
      logger.info(`Environment: ${AppConfig.server.environment}`);
      logger.info('Security features enabled:');
      logger.info('  - Rate limiting & DDoS protection');
      logger.info('  - Input sanitization & validation');
      logger.info('  - Session management');
      logger.info('  - Security logging');
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();

export default app;
