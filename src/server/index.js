/**
 * Main Server Application
 * Simplified and industry-standard Express server
 */

import express from 'express';
import compression from 'compression';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { v4 as uuidv4 } from 'uuid';

// Core modules
import { AppConfig } from '../core/config/index.js';
import { Logger } from '../core/logger/index.js';
import security from '../core/security/index.js';

// Services
import UnityService from '../services/unity/index.js';
import EconomyService from '../services/economy/index.js';

// Routes
import authRoutes from '../routes/auth.js';
import economyRoutes from '../routes/economy.js';
import gameRoutes from '../routes/game.js';
import adminRoutes from '../routes/admin.js';

const logger = new Logger('Server');
const app = express();

// Initialize services
const unityService = new UnityService();
const economyService = new EconomyService();

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

// Response time middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.request(req, res, duration);
  });
  next();
});

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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/economy', economyRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/admin', adminRoutes);

// Receipt verification endpoint
app.post('/api/verify_receipt', security.authRateLimit, async (req, res) => {
  try {
    const { sku, receipt } = req.body;

    if (!sku || !receipt) {
      return res.status(400).json({
        valid: false,
        error: 'Missing required fields: sku, receipt',
        requestId: req.requestId,
      });
    }

    // TODO: Implement actual receipt verification with Apple/Google
    const isValid = String(receipt).length > 20;

    res.json({
      valid: isValid,
      sku,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error('Receipt verification failed', { error: error.message });
    res.status(500).json({
      valid: false,
      error: 'Internal server error',
      requestId: req.requestId,
    });
  }
});

// Segments endpoint
app.post('/api/segments', security.sessionValidation, async (req, res) => {
  try {
    const profile = req.body;
    const playerId = req.user.playerId;

    // Check cache first
    const cacheKey = `segments_${JSON.stringify(profile)}`;
    const cached = economyService.getCachedData(cacheKey);

    if (cached) {
      return res.json({
        ...cached.data,
        cached: true,
        requestId: req.requestId,
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
      requestId: req.requestId,
    };

    // Cache the result
    economyService.setCachedData(cacheKey, result);

    res.json(result);
  } catch (error) {
    logger.error('Segments generation failed', { error: error.message });
    res.status(500).json({
      error: 'Internal server error',
      requestId: req.requestId,
    });
  }
});

// Promo codes endpoint
app.post('/api/promo', security.strictRateLimit, async (req, res) => {
  try {
    const { code, playerId } = req.body;

    if (!code || !playerId) {
      return res.status(400).json({
        ok: false,
        error: 'Missing required fields: code, playerId',
        requestId: req.requestId,
      });
    }

    const validCodes = ['WELCOME', 'FREE100', 'STARTER', 'COMEBACK'];
    const isValid = validCodes.includes(String(code).toUpperCase());

    if (isValid) {
      const rewards = {
        WELCOME: { coins: 1000, gems: 50 },
        FREE100: { coins: 100, gems: 10 },
        STARTER: { coins: 500, gems: 25 },
        COMEBACK: { coins: 2000, gems: 100 },
      };

      security.logSecurityEvent('promo_code_used', {
        playerId,
        code: String(code).toUpperCase(),
        ip: req.ip,
      });

      res.json({
        ok: true,
        code: String(code).toUpperCase(),
        reward: rewards[String(code).toUpperCase()],
        requestId: req.requestId,
      });
    } else {
      security.logSecurityEvent('invalid_promo_code', {
        playerId,
        code: String(code).toUpperCase(),
        ip: req.ip,
      });

      res.status(404).json({
        ok: false,
        error: 'Invalid promo code',
        requestId: req.requestId,
      });
    }
  } catch (error) {
    logger.error('Promo code validation failed', { error: error.message });
    res.status(500).json({
      ok: false,
      error: 'Internal server error',
      requestId: req.requestId,
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    requestId: req.requestId,
  });

  res.status(500).json({
    error: 'Internal server error',
    requestId: req.requestId,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    requestId: req.requestId,
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
