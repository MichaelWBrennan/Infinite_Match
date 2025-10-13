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
import OffersService from 'services/offers/OffersService.js';
import ReceiptVerificationService from 'services/payments/ReceiptVerificationService.js';
import PurchaseLedger from 'services/payments/PurchaseLedger.js';

// Routes
import authRoutes from 'routes/auth.js';
import economyRoutes from 'routes/economy.js';
import gameRoutes from 'routes/game.js';
import adminRoutes from 'routes/admin.js';
import monetizationRoutes from 'routes/monetization.js';
import analyticsRoutes from 'routes/analytics.js';
import crmRoutes from 'routes/crm.js';
import battlepassRoutes from 'routes/battlepass.js';
import subscriptionsRoutes from 'routes/subscriptions.js';
import experimentsRoutes from 'routes/experiments.js';
import pushRoutes from 'routes/push.js';

const logger = new Logger('Server');
const app = express();

// Register services
registerServices();

// Initialize services
const unityService = getService('unityService');
const economyService = getService('economyService');
const offersService = new OffersService();

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
app.use('/api/monetization', monetizationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/battlepass', battlepassRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/experiments', experimentsRoutes);
app.use('/api/push', pushRoutes);

// Receipt verification endpoint
app.post('/api/verify_receipt', security.authRateLimit, asyncHandler(async (req, res) => {
  // Backward-compatible handler. Supports two shapes:
  // 1) { platform: 'ios'|'android', payload: {...} }
  // 2) { sku, receipt, platform: 'IPhonePlayer'|'Android' }

  let { platform, payload, sku, receipt } = req.body || {};

  const normalizePlatform = (p) => {
    if (!p) return undefined;
    const v = String(p).toLowerCase();
    if (v.includes('iphone') || v.includes('ios')) return 'ios';
    if (v.includes('android')) return 'android';
    return p;
  };

  const tryParseUnityReceipt = (receiptString, platformHint) => {
    try {
      const parsed = JSON.parse(receiptString);
      // Unity IAP often wraps payload under `Payload`
      if (platformHint === 'ios') {
        const base64 = parsed?.Payload || parsed?.payload || parsed?.receipt;
        if (base64) return { platform: 'ios', payload: { receiptData: base64 } };
      }
      if (platformHint === 'android') {
        const payloadStr = parsed?.Payload || parsed?.payload || '';
        if (payloadStr) {
          try {
            const inner = JSON.parse(payloadStr);
            const jsonStr = inner?.json || payloadStr;
            const purchase = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : inner;
            return {
              platform: 'android',
              payload: {
                packageName: purchase.packageName || purchase.package_name,
                productId: purchase.productId || purchase.product_id || sku,
                purchaseToken: purchase.purchaseToken || purchase.purchase_token,
              },
            };
          } catch (_) { /* ignore */ }
        }
      }
    } catch (_) {
      // If not JSON, could be raw base64 (iOS)
      if (platformHint === 'ios' && typeof receiptString === 'string' && receiptString.length > 20) {
        return { platform: 'ios', payload: { receiptData: receiptString } };
      }
    }
    return undefined;
  };

  platform = normalizePlatform(platform);

  if (!payload && receipt) {
    const inferred = tryParseUnityReceipt(receipt, platform);
    if (inferred) {
      platform = inferred.platform;
      payload = inferred.payload;
    }
  }

  if (!platform || !payload) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: 'Missing required fields: platform, payload',
    });
  }

  const result = await ReceiptVerificationService.verify({ platform, payload });

  if (!result.success) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      platform,
      error: 'verification_failed',
      details: result.reason || result.status || result.state || 'invalid',
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    success: true,
    platform,
    productId: result.productId || sku || null,
    transactionId: result.transactionId || null,
    duplicate: Boolean(result.duplicate),
    timestamp: new Date().toISOString(),
  });
  try {
    await PurchaseLedger.recordPurchase({
      platform,
      productId: result.productId || sku || null,
      transactionId: result.transactionId || null,
      acknowledged: result.acknowledged,
      playerId: req.user?.playerId,
    });
  } catch (_) {}
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

// Event-driven offers endpoint
app.post('/api/offers', security.sessionValidation, asyncHandler(async (req, res) => {
  const profile = req.body || {};
  const offers = offersService.getOffers(profile);
  res.json({ success: true, offers });
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
