import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import * as Sentry from '@sentry/node';
import analyticsService from '../services/enhanced-analytics-service.js';
import cloudServices from '../services/enhanced-cloud-services.js';
import gameRoutes from '../routes/game-routes.js';
import {
  analyticsMiddleware,
  errorTrackingMiddleware,
} from '../middleware/analytics-middleware.js';
import { readFileSync } from 'fs';
import { join } from 'path';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3000;

// Platform detection utility
function detectPlatform(req) {
  const hostname = req.hostname.toLowerCase();
  const referrer = req.get('referer')?.toLowerCase() || '';
  const userAgent = req.get('user-agent')?.toLowerCase() || '';

  // Check for Kongregate
  if (hostname.includes('kongregate.com') || referrer.includes('kongregate.com')) {
    return 'kongregate';
  }

  // Check for Game Crazy
  if (hostname.includes('gamecrazy.com') || referrer.includes('gamecrazy.com')) {
    return 'gamecrazy';
  }

  // Check for Poki
  if (hostname.includes('poki.com') || referrer.includes('poki.com')) {
    return 'poki';
  }

  // Check for mobile platforms
  if (userAgent.includes('android')) {
    return 'android';
  }

  if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
    return 'ios';
  }

  return 'webgl'; // Default to WebGL
}

// Platform-specific optimizations
function getPlatformOptimizations(platform) {
  const optimizations = {
    webgl: { memorySize: 256, compression: 'gzip', textureFormat: 'astc' },
    kongregate: { memorySize: 128, compression: 'gzip', textureFormat: 'dxt' },
    poki: { memorySize: 64, compression: 'brotli', textureFormat: 'etc2' },
    gamecrazy: { memorySize: 32, compression: 'gzip', textureFormat: 'dxt' },
    android: { memorySize: 512, compression: 'none', textureFormat: 'astc' },
    ios: { memorySize: 256, compression: 'none', textureFormat: 'astc' },
  };

  return optimizations[platform] || optimizations.webgl;
}

// Initialize services
async function initializeServices() {
  try {
    console.log('Initializing services...');

    // Initialize analytics service
    await analyticsService.initialize();

    // Initialize cloud services
    await cloudServices.initialize();

    console.log('All services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
    new Sentry.Integrations.Mongo({ useMongoose: true }),
    new Sentry.Integrations.Redis({ useRedis: true }),
  ],
});

// Middleware
app.use(Sentry.requestHandler());
app.use(Sentry.tracingHandler());

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://cdn.amplitude.com',
          'https://cdn.mxpnl.com',
        ],
        connectSrc: [
          "'self'",
          'https://api2.amplitude.com',
          'https://api.mixpanel.com',
          'https://browser.sentry-cdn.com',
        ],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'https:', 'data:'],
      },
    },
  }),
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  }),
);

app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Analytics middleware
app.use(analyticsMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      analytics: analyticsService.getAnalyticsSummary(),
      cloud: cloudServices.getServiceStatus(),
    },
  };

  try {
    res.status(200).json(healthCheck);
  } catch (error) {
    healthCheck.message = 'ERROR';
    res.status(503).json(healthCheck);
  }
});

// API routes
app.use('/api/game', gameRoutes);

// Platform detection endpoint
app.get('/api/platform/detect', (req, res) => {
  const platform = detectPlatform(req);
  const optimizations = getPlatformOptimizations(platform);

  res.json({
    success: true,
    data: {
      platform,
      optimizations,
      capabilities: {
        webgl: true,
        wasm: true,
        touch: req.get('user-agent')?.includes('Mobile') || false,
        mobile: platform === 'android' || platform === 'ios',
      },
    },
  });
});

// Platform optimization endpoint
app.get('/api/platform/optimize', (req, res) => {
  const platform = detectPlatform(req);
  const optimizations = getPlatformOptimizations(platform);

  res.json({
    success: true,
    data: {
      platform,
      optimizations,
      recommendations: [
        `Optimized for ${platform} platform`,
        `Memory size: ${optimizations.memorySize}MB`,
        `Compression: ${optimizations.compression}`,
        `Texture format: ${optimizations.textureFormat}`,
      ],
    },
  });
});

// Serve static files for WebGL build with platform optimization
app.use(
  express.static('webgl', {
    setHeaders: (res, path) => {
      // Set platform-specific headers
      res.setHeader('X-Platform', 'webgl');
      res.setHeader('X-WebGL-Optimized', 'true');

      // Set compression headers
      if (path.endsWith('.wasm')) {
        res.setHeader('Content-Type', 'application/wasm');
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      }
    },
  }),
);

// Serve Unity WebGL build with platform detection
app.get('/', (req, res) => {
  const platform = detectPlatform(req);
  const optimizations = getPlatformOptimizations(platform);

  // Set platform-specific headers
  res.setHeader('X-Platform', platform);
  res.setHeader('X-Platform-Type', platform === 'android' || platform === 'ios' ? 'mobile' : 'web');
  res.setHeader('X-WebGL-Optimized', 'true');

  res.sendFile('index.html', { root: 'webgl' });
});

// WebSocket connection for real-time game events
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Track connection
  analyticsService.trackGameEvent('websocket_connected', {
    socket_id: socket.id,
    ip_address: socket.handshake.address,
  });

  // Handle game events
  socket.on('game_event', async (data) => {
    try {
      await analyticsService.trackGameEvent(data.event_name, data.properties, data.user_id);

      // Broadcast to other clients if needed
      socket.broadcast.emit('game_event', data);
    } catch (error) {
      console.error('Error handling game event:', error);
      socket.emit('error', { message: 'Failed to process game event' });
    }
  });

  // Handle performance metrics
  socket.on('performance_metric', async (data) => {
    try {
      await analyticsService.trackPerformance(data.user_id, {
        metricName: data.metric_name,
        value: data.value,
        unit: data.unit,
        level: data.level,
        deviceInfo: data.device_info,
      });
    } catch (error) {
      console.error('Error handling performance metric:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    analyticsService.trackGameEvent('websocket_disconnected', {
      socket_id: socket.id,
    });
  });
});

// Error handling middleware
app.use(Sentry.errorHandler());
app.use(errorTrackingMiddleware);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');

  try {
    await analyticsService.shutdown();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');

  try {
    await analyticsService.shutdown();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Start server
async function startServer() {
  await initializeServices();

  server.listen(PORT, () => {
    console.log(`🚀 Match 3 Game Server running on port ${PORT}`);
    console.log(`📊 Analytics: ${analyticsService.isInitialized ? 'Enabled' : 'Disabled'}`);
    console.log(`☁️  Cloud Services: ${cloudServices.isInitialized ? 'Enabled' : 'Disabled'}`);
    console.log('🌐 WebSocket: Enabled');
    console.log('📈 Monitoring: Sentry, OpenTelemetry, New Relic');
  });
}

startServer().catch(console.error);
