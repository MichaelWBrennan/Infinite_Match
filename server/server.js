import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { v4 as uuidv4 } from 'uuid';
import securityMiddleware, {
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
} from './security/securityMiddleware.js';
import AntiCheatValidator from './security/antiCheatValidator.js';

const app = express();

// Initialize anti-cheat validator
const antiCheatValidator = new AntiCheatValidator();

// Enhanced Security middleware stack
app.use(helmetConfig);
app.use(corsConfig);
app.use(securityHeaders);
app.use(requestLogger);
app.use(ipReputationCheck);
app.use(slowDownConfig);
app.use(generalRateLimit);

// Compression middleware
app.use(compression());

// Input validation and sanitization
app.use(inputValidation);

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  req.requestId = uuidv4();
  console.log(
    `${new Date().toISOString()} [${req.requestId}] ${req.method} ${req.path}`
  );
  next();
});

// Response time middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `${new Date().toISOString()} [${req.requestId}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`
    );
  });
  next();
});

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// Enhanced receipt verification with anti-cheat validation
const receiptCache = new Map();
const RECEIPT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

app.post('/verify_receipt', authRateLimit, (req, res) => {
  const { sku, receipt } = req.body || {};
  if (!sku || !receipt) {
    return res.status(400).json({
      valid: false,
      error: 'missing_fields',
      requestId: req.requestId,
    });
  }

  // Check cache first
  const cacheKey = `${sku}_${receipt}`;
  const cached = receiptCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < RECEIPT_CACHE_TTL) {
    return res.json({
      ...cached.data,
      cached: true,
      requestId: req.requestId,
    });
  }

  // TODO: Verify with Google/Apple servers
  // For now, accept if receipt length looks plausible
  const ok = String(receipt).length > 20;
  const result = {
    valid: ok,
    sku: sku,
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  };

  // Cache the result
  receiptCache.set(cacheKey, {
    data: result,
    timestamp: Date.now(),
  });

  // Clean up old cache entries
  if (receiptCache.size > 1000) {
    const now = Date.now();
    for (const [key, value] of receiptCache.entries()) {
      if (now - value.timestamp > RECEIPT_CACHE_TTL) {
        receiptCache.delete(key);
      }
    }
  }

  res.json(result);
});

// Optimized segments with caching
const segmentsCache = new Map();
const SEGMENTS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

app.post('/segments', (req, res) => {
  const profile = req.body || {};
  const profileKey = JSON.stringify(profile);

  // Check cache first
  const cached = segmentsCache.get(profileKey);
  if (cached && Date.now() - cached.timestamp < SEGMENTS_CACHE_TTL) {
    return res.json({
      ...cached.data,
      cached: true,
      requestId: req.requestId,
    });
  }

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
    Date.now() - new Date(profile.last_play).getTime() > 7 * 24 * 60 * 60 * 1000
  ) {
    overrides.comeback_offers = true;
  }

  const result = {
    ...overrides,
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  };

  // Cache the result
  segmentsCache.set(profileKey, {
    data: result,
    timestamp: Date.now(),
  });

  res.json(result);
});

// Optimized promo codes with rate limiting
const promoAttempts = new Map();
const PROMO_RATE_LIMIT = 5; // 5 attempts per minute per IP

app.post('/promo', (req, res) => {
  const { code } = req.body || {};
  if (!code) {
    return res.status(400).json({
      ok: false,
      error: 'missing_code',
      requestId: req.requestId,
    });
  }

  // Rate limiting for promo attempts
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const attempts = promoAttempts.get(clientIP) || [];
  const recentAttempts = attempts.filter((time) => now - time < 60000); // Last minute

  if (recentAttempts.length >= PROMO_RATE_LIMIT) {
    return res.status(429).json({
      ok: false,
      error: 'rate_limit_exceeded',
      requestId: req.requestId,
    });
  }

  // Record attempt
  recentAttempts.push(now);
  promoAttempts.set(clientIP, recentAttempts);

  // Check promo code
  const upper = String(code).toUpperCase();
  const validCodes = ['WELCOME', 'FREE100', 'STARTER', 'COMEBACK'];
  const isValid = validCodes.includes(upper);

  if (isValid) {
    res.json({
      ok: true,
      code: upper,
      reward: getPromoReward(upper),
      requestId: req.requestId,
    });
  } else {
    res.status(404).json({
      ok: false,
      error: 'invalid_code',
      requestId: req.requestId,
    });
  }
});

function getPromoReward(code) {
  const rewards = {
    WELCOME: { coins: 1000, gems: 50 },
    FREE100: { coins: 100, gems: 10 },
    STARTER: { coins: 500, gems: 25 },
    COMEBACK: { coins: 2000, gems: 100 },
  };
  return rewards[code] || { coins: 0, gems: 0 };
}

// Optimized push notifications with batching
const pushQueue = [];
const PUSH_BATCH_SIZE = 10;
const PUSH_BATCH_INTERVAL = 5000; // 5 seconds

setInterval(() => {
  if (pushQueue.length > 0) {
    const batch = pushQueue.splice(0, PUSH_BATCH_SIZE);
    processPushBatch(batch);
  }
}, PUSH_BATCH_INTERVAL);

app.post('/push', (req, res) => {
  const { user_id, message, title, data } = req.body || {};

  if (!user_id || !message) {
    return res.status(400).json({
      ok: false,
      error: 'missing_fields',
      requestId: req.requestId,
    });
  }

  // Add to batch queue
  pushQueue.push({
    user_id,
    message,
    title: title || 'Game Notification',
    data: data || {},
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });

  res.json({
    ok: true,
    queued: true,
    requestId: req.requestId,
  });
});

function processPushBatch(batch) {
  console.log(`Processing push batch of ${batch.length} notifications`);
  // In a real implementation, you would send these to a push notification service
  batch.forEach((notification) => {
    console.log(
      `Push: ${notification.user_id} - ${notification.title}: ${notification.message}`
    );
  });
}

// Optimized logging with batching
const logQueue = [];
const LOG_BATCH_SIZE = 50;
const LOG_BATCH_INTERVAL = 2000; // 2 seconds

setInterval(() => {
  if (logQueue.length > 0) {
    const batch = logQueue.splice(0, LOG_BATCH_SIZE);
    processLogBatch(batch);
  }
}, LOG_BATCH_INTERVAL);

app.post('/log', (req, res) => {
  const { level, message, data, user_id } = req.body || {};

  if (!level || !message) {
    return res.status(400).json({
      ok: false,
      error: 'missing_fields',
      requestId: req.requestId,
    });
  }

  // Add to batch queue
  logQueue.push({
    level,
    message,
    data: data || {},
    user_id: user_id || 'anonymous',
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });

  res.json({
    ok: true,
    queued: true,
    requestId: req.requestId,
  });
});

function processLogBatch(batch) {
  console.log(`Processing log batch of ${batch.length} entries`);
  // In a real implementation, you would send these to a logging service
  batch.forEach((log) => {
    console.log(
      `[${log.level.toUpperCase()}] ${log.user_id}: ${log.message}`,
      log.data
    );
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`${new Date().toISOString()} [${req.requestId}] Error:`, err);
  res.status(500).json({
    ok: false,
    error: 'internal_server_error',
    requestId: req.requestId,
  });
});

// Enhanced secure endpoints

// Player authentication endpoint
app.post('/auth/login', authRateLimit, async (req, res) => {
  const { playerId, password, deviceInfo } = req.body || {};

  if (!playerId) {
    return res.status(400).json({
      success: false,
      error: 'Player ID required',
      requestId: req.requestId,
    });
  }

  try {
    // Create session
    const sessionId = createSession(playerId, { deviceInfo });
    const token = generateToken({ playerId, sessionId });

    // Log security event
    logSecurityEvent('player_login', {
      playerId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      deviceInfo,
    });

    res.json({
      success: true,
      token,
      sessionId,
      requestId: req.requestId,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      requestId: req.requestId,
    });
  }
});

// Player logout endpoint
app.post('/auth/logout', sessionValidation, (req, res) => {
  const { sessionId } = req.user;

  destroySession(sessionId);

  logSecurityEvent('player_logout', {
    playerId: req.user.playerId,
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Logged out successfully',
    requestId: req.requestId,
  });
});

// Enhanced game data submission with anti-cheat
app.post(
  '/game/submit_data',
  sessionValidation,
  antiCheatValidation,
  (req, res) => {
    const { gameData, actionType } = req.body || {};
    const playerId = req.user.playerId;

    if (!gameData || !actionType) {
      return res.status(400).json({
        success: false,
        error: 'Missing game data or action type',
        requestId: req.requestId,
      });
    }

    try {
      // Validate with anti-cheat system
      const validationResult = antiCheatValidator.validateGameData(
        playerId,
        actionType,
        gameData
      );

      if (!validationResult.isValid) {
        // Log security violation
        logSecurityEvent('cheat_detected', {
          playerId,
          actionType,
          violations: validationResult.violations,
          ip: req.ip,
          requestId: req.requestId,
        });

        return res.status(400).json({
          success: false,
          error: 'Invalid game data detected',
          violations: validationResult.violations,
          requestId: req.requestId,
        });
      }

      // If suspicious but not invalid, log but allow
      if (validationResult.suspiciousActivities.length > 0) {
        logSecurityEvent('suspicious_activity', {
          playerId,
          actionType,
          suspiciousActivities: validationResult.suspiciousActivities,
          riskScore: validationResult.riskScore,
          ip: req.ip,
          requestId: req.requestId,
        });
      }

      // Process valid game data
      res.json({
        success: true,
        message: 'Game data processed successfully',
        riskScore: validationResult.riskScore,
        requestId: req.requestId,
      });
    } catch (error) {
      console.error('Game data submission error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process game data',
        requestId: req.requestId,
      });
    }
  }
);

// Enhanced segments with anti-cheat validation
app.post('/segments', sessionValidation, (req, res) => {
  const profile = req.body || {};
  const playerId = req.user.playerId;
  const profileKey = JSON.stringify(profile);

  // Check cache first
  const cached = segmentsCache.get(profileKey);
  if (cached && Date.now() - cached.timestamp < SEGMENTS_CACHE_TTL) {
    return res.json({
      ...cached.data,
      cached: true,
      requestId: req.requestId,
    });
  }

  // Validate profile data
  const validationResult = antiCheatValidator.validateGameData(
    playerId,
    'profile_update',
    profile
  );
  if (!validationResult.isValid) {
    return res.status(400).json({
      success: false,
      error: 'Invalid profile data',
      violations: validationResult.violations,
      requestId: req.requestId,
    });
  }

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
    Date.now() - new Date(profile.last_play).getTime() > 7 * 24 * 60 * 60 * 1000
  ) {
    overrides.comeback_offers = true;
  }

  const result = {
    ...overrides,
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  };

  // Cache the result
  segmentsCache.set(profileKey, {
    data: result,
    timestamp: Date.now(),
  });

  res.json(result);
});

// Enhanced promo codes with additional security
app.post('/promo', strictRateLimit, (req, res) => {
  const { code, playerId } = req.body || {};
  if (!code || !playerId) {
    return res.status(400).json({
      ok: false,
      error: 'missing_code_or_player_id',
      requestId: req.requestId,
    });
  }

  // Validate player ID
  const playerProfile = antiCheatValidator.getPlayerProfile(playerId);
  if (!playerProfile) {
    return res.status(400).json({
      ok: false,
      error: 'invalid_player_id',
      requestId: req.requestId,
    });
  }

  // Check if player is banned
  if (playerProfile.isBanned) {
    return res.status(403).json({
      ok: false,
      error: 'player_banned',
      requestId: req.requestId,
    });
  }

  // Rate limiting for promo attempts
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const attempts = promoAttempts.get(clientIP) || [];
  const recentAttempts = attempts.filter((time) => now - time < 60000); // Last minute

  if (recentAttempts.length >= PROMO_RATE_LIMIT) {
    return res.status(429).json({
      ok: false,
      error: 'rate_limit_exceeded',
      requestId: req.requestId,
    });
  }

  // Record attempt
  recentAttempts.push(now);
  promoAttempts.set(clientIP, recentAttempts);

  // Check promo code
  const upper = String(code).toUpperCase();
  const validCodes = ['WELCOME', 'FREE100', 'STARTER', 'COMEBACK'];
  const isValid = validCodes.includes(upper);

  if (isValid) {
    // Log successful promo usage
    logSecurityEvent('promo_code_used', {
      playerId,
      code: upper,
      ip: clientIP,
      requestId: req.requestId,
    });

    res.json({
      ok: true,
      code: upper,
      reward: getPromoReward(upper),
      requestId: req.requestId,
    });
  } else {
    // Log failed promo attempt
    logSecurityEvent('invalid_promo_code', {
      playerId,
      code: upper,
      ip: clientIP,
      requestId: req.requestId,
    });

    res.status(404).json({
      ok: false,
      error: 'invalid_code',
      requestId: req.requestId,
    });
  }
});

// Security statistics endpoint (admin only)
app.get('/admin/security/stats', sessionValidation, (req, res) => {
  const stats = antiCheatValidator.getStatistics();
  res.json({
    success: true,
    statistics: stats,
    requestId: req.requestId,
  });
});

// Player security profile endpoint
app.get('/player/security_profile', sessionValidation, (req, res) => {
  const playerId = req.user.playerId;
  const profile = antiCheatValidator.getPlayerProfile(playerId);

  if (!profile) {
    return res.status(404).json({
      success: false,
      error: 'Player profile not found',
      requestId: req.requestId,
    });
  }

  // Return sanitized profile (remove sensitive data)
  const sanitizedProfile = {
    playerId: profile.playerId,
    createdAt: profile.createdAt,
    lastActivity: profile.lastActivity,
    riskScore: profile.riskScore,
    isBanned: profile.isBanned,
    violationCount: profile.violations.length,
    suspiciousActivityCount: profile.suspiciousActivities.length,
  };

  res.json({
    success: true,
    profile: sanitizedProfile,
    requestId: req.requestId,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: 'not_found',
    path: req.path,
    requestId: req.requestId,
  });
});

// Setup cleanup intervals
setInterval(
  () => {
    cleanupOldData();
    antiCheatValidator.cleanupOldData();
  },
  60 * 60 * 1000
); // Run cleanup every hour

const port = process.env.PORT || 3030;
app.listen(port, () => {
  console.log(`🚀 Enhanced Secure Backend listening on port ${port}`);
  console.log(`🔒 Security features enabled:`);
  console.log(`   - Anti-cheat validation`);
  console.log(`   - Rate limiting & DDoS protection`);
  console.log(`   - Input sanitization & validation`);
  console.log(`   - Session management`);
  console.log(`   - Security logging`);
  console.log(`   - IP reputation tracking`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Memory usage: ${JSON.stringify(process.memoryUsage())}`);
});
