import { existsSync } from 'fs';
import { join } from 'path';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer, Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import * as Sentry from '@sentry/node';
import AppConfig from '../core/config/index.js';
import { Logger } from '../core/logger/index.js';
import { ErrorHandler } from '../core/errors/ErrorHandler.js';
import { ApiResponseBuilder } from '../core/types/ApiResponse.js';
import { ServiceContainer, container } from '../core/container/ServiceContainer.js';
import { registerServices } from '../core/services/ServiceRegistry.js';
import { PlatformDetector } from '../core/platform/PlatformDetector.js';
import { UniversalAPI } from '../core/api/UniversalAPI.js';
import WebGLMiddleware from '../core/middleware/WebGLMiddleware.js';
import { PlatformBuildConfig } from '../core/build/PlatformBuildConfig.js';
// import { AnalyticsService } from '../services/analytics-service.js';
import CloudServices from '../services/cloud-services.js';
import UnifiedAnalyticsService from '../services/unified-analytics-service.js';
import PrometheusMonitoringService from '../services/prometheus-monitoring-service.js';
import OpenSourceCloudServices from '../services/open-source-cloud-services.js';
import { ASOOptimizationService } from '../services/aso-optimization-service.js';
import gameRoutes from '../routes/game-routes.js';
import aiContentRoutes from '../routes/ai-content.js';
import realtimeRoutes from '../routes/realtime.js';
import asoRoutes from '../routes/aso-routes.js';
import { router as multiplayerRoutes, initializeMultiplayerServices } from '../routes/multiplayer.js';
import playerAccountRoutes from '../routes/player-accounts.js';
import authRoutes from '../routes/auth.js';
import accountEconomyRoutes from '../routes/account-economy.js';
import stripeRoutes from '../routes/stripe.js';
import entitlementsRoutes from '../routes/entitlements.js';
import monetizationRoutes from '../routes/monetization.js';
import arpuRoutes from '../routes/arpu.js';
import analyticsRoutes from '../routes/analytics.js';
import adsRoutes from '../routes/ads.js';
import {
  analyticsMiddleware,
  errorTrackingMiddleware,
} from '../middleware/analytics-middleware.js';

interface ServerConfig {
  port: number;
  host: string;
  environment: string;
}

/**
 * Root-level files that make up the playable game shell.
 *
 * These are served through an explicit allowlist rather than mounting the
 * repository root, which would also expose `.env`, credentials and
 * `node_modules`.
 */
const ROOT_GAME_ASSETS = new Set([
  'index.html',
  'styles.css',
  'phaser3-game.js',
  'script.js',
  'platform-detection.js',
  'shared-game.js',
  'shared-ui.css',
  'test-phaser3.html',
]);

/**
 * Locate a WebGL build directory if one is present.
 *
 * The code historically assumed a lowercase `webgl/` directory; the checked-in
 * build lives in `WebGL/` (and older layouts use `Build/`), which mismatch made
 * every WebGL request 404. Returns null when no build exists.
 */
function resolveWebGLDir(): string | null {
  for (const candidate of ['webgl', 'WebGL', 'Build']) {
    if (existsSync(join(process.cwd(), candidate))) {
      return candidate;
    }
  }
  return null;
}

interface HealthCheckResponse {
  uptime: number;
  message: string;
  timestamp: string;
  services: {
    analytics: any;
    monitoring: any;
    cloud: any;
    legacy: any;
  };
}

class GameServer {
  private app: Application;
  private server: HttpServer;
  private io: SocketIOServer | null = null;
  private config: ServerConfig;
  private logger: Logger;
  private errorHandler: ErrorHandler;
  private serviceContainer: ServiceContainer;
  private platformDetector: PlatformDetector;
  private universalAPI: UniversalAPI;
  private webglMiddleware: WebGLMiddleware;
  private platformBuildConfig: PlatformBuildConfig;
  private analyticsService: any;
  private cloudServices: any;
  private unifiedAnalytics: any;
  private prometheusMonitoring: any;
  private openSourceCloud: any;
  private asoOptimization: any;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.config = {
      port: AppConfig.server.port,
      host: AppConfig.server.host,
      environment: AppConfig.server.environment,
    };
    this.logger = new Logger('GameServer');
    this.errorHandler = new ErrorHandler();
    // Use the shared container so routes (which import the same singleton)
    // resolve the very instances initialized below.
    this.serviceContainer = container;
    this.platformDetector = new PlatformDetector();
    this.universalAPI = new UniversalAPI();
    this.webglMiddleware = new WebGLMiddleware();
    this.platformBuildConfig = new PlatformBuildConfig();

    this.initializeSocketIO();
    // Services are initialized (awaited) in `start()`. Calling it here as well
    // started every service twice - duplicate timers, duplicate clients and
    // duplicated log output - via an unawaited promise.
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
    this.setupGracefulShutdown();
  }

  private initializeSocketIO(): void {
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: AppConfig.server.cors.origin,
        methods: ['GET', 'POST'],
      },
    });
    
    // Initialize multiplayer services with Socket.IO
    initializeMultiplayerServices(this.io);
  }

  private async initializeServices(): Promise<void> {
    try {
      this.logger.info('Initializing services...');

      // Initialize platform detection
      await this.platformDetector.detectPlatform();
      this.logger.info('Platform detection initialized');

      // Initialize universal API
      await this.universalAPI.initialize();
      this.logger.info('Universal API initialized');

      // Initialize WebGL middleware
      await this.webglMiddleware.initialize();
      this.logger.info('WebGL middleware initialized');

      // Initialize unified analytics service (replaces Amplitude, Mixpanel, Unity Analytics)
      this.unifiedAnalytics = UnifiedAnalyticsService;
      await this.unifiedAnalytics.initialize();
      // `analyticsService` is the field the WebSocket handlers and the
      // shutdown path read. It was never assigned, so the first socket event
      // (and the "server running" banner) threw a TypeError.
      this.analyticsService = this.unifiedAnalytics;
      this.logger.info('Unified analytics service initialized');

      // Initialize Prometheus monitoring (replaces Datadog)
      this.prometheusMonitoring = PrometheusMonitoringService;
      await this.prometheusMonitoring.initialize();
      this.logger.info('Prometheus monitoring service initialized');

      // Initialize open source cloud services (replaces AWS, Google Cloud, Azure)
      this.openSourceCloud = OpenSourceCloudServices;
      await this.openSourceCloud.initialize();
      this.logger.info('Open source cloud services initialized');

      // Initialize ASO optimization service
      this.asoOptimization = new ASOOptimizationService();
      this.logger.info('ASO optimization service initialized');

      // Keep legacy cloud services for backward compatibility
      this.cloudServices = CloudServices;
      await this.cloudServices.initialize();

      // Publish the running instances on the shared container so route modules
      // can resolve them (previously nothing registered 'analytics'/'cloud',
      // so every game route threw "Service not found").
      registerServices();
      this.serviceContainer.registerInstance('analytics', this.unifiedAnalytics);
      this.serviceContainer.registerInstance('cloud', this.cloudServices);
      this.serviceContainer.registerInstance('openSourceCloud', this.openSourceCloud);
      this.serviceContainer.registerInstance('monitoring', this.prometheusMonitoring);

      this.logger.info('All services initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize services:', { error });
      process.exit(1);
    }
  }

  private initializeSentry(): void {
    if (process.env['SENTRY_DSN']) {
      Sentry.init({
        dsn: process.env['SENTRY_DSN'],
        environment: this.config.environment,
        tracesSampleRate: 1.0,
        integrations: [
          // Use basic integrations for now
        ],
      });
    }
  }

  private setupMiddleware(): void {
    // Initialize Sentry
    this.initializeSentry();

    // Sentry request/tracing instrumentation is installed automatically by
    // `expressIntegration()` above; v10 removed the standalone
    // `requestHandler()` / `tracingHandler()` middleware factories.

    // Security middleware
    this.app.use(
      helmet({
        // Stricter than helmet's default SAMEORIGIN: this game should never be
        // embedded in a frame, including same-origin ones.
        frameguard: { action: 'deny' },
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ['\'self\''],
            styleSrc: ['\'self\'', '\'unsafe-inline\''],
            scriptSrc: [
              '\'self\'',
              '\'unsafe-inline\'',
            ],
            // helmet defaults `script-src-attr` to 'none', which blocks every
            // inline `onclick="..."` handler in index.html (Play, Settings,
            // Login, News...). The game UI relies on those attributes.
            scriptSrcAttr: ['\'unsafe-inline\''],
            connectSrc: [
              '\'self\'',
            ],
            imgSrc: ['\'self\'', 'data:', 'https:'],
            fontSrc: ['\'self\'', 'https:', 'data:'],
          },
        },
      }),
    );

    // CORS
    this.app.use(
      cors({
        origin: AppConfig.server.cors.origin,
        credentials: AppConfig.server.cors.credentials,
      }),
    );

    // Compression
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: AppConfig.security.rateLimit.windowMs,
      max: AppConfig.security.rateLimit.max,
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });

    this.app.use('/api/', limiter);

    // Stripe webhooks must receive the untouched body so the signature can be
    // verified. This raw parser has to run before express.json below; the
    // router's own express.raw then sees the body as already parsed.
    this.app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Analytics middleware
    this.app.use(analyticsMiddleware);

    // WebGL middleware for platform-specific optimizations
    this.app.use(this.webglMiddleware.webglServingMiddleware);
  }

  private setupRoutes(): void {
    // Make services available to routes
    this.app.locals['asoOptimization'] = this.asoOptimization;
    this.app.locals['unifiedAnalytics'] = this.unifiedAnalytics;
    this.app.locals['prometheusMonitoring'] = this.prometheusMonitoring;
    this.app.locals['openSourceCloud'] = this.openSourceCloud;
    
    // Health check endpoint
    this.app.get('/health', this.handleHealthCheck.bind(this));

    // Prometheus metrics endpoint
    this.app.get('/metrics', this.handleMetrics.bind(this));

    // API routes
    this.app.use('/api/game', gameRoutes);
    this.app.use('/api/ai', aiContentRoutes);
    this.app.use('/api/realtime', realtimeRoutes);
    this.app.use('/api/aso', asoRoutes);
    this.app.use('/api/multiplayer', multiplayerRoutes);
    this.app.use('/api/accounts', playerAccountRoutes);
    // The game shell (script.js) calls these for login, registration, platform
    // sync and account economy sync. The route modules existed but were never
    // mounted, so every call returned 404.
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/account-economy', accountEconomyRoutes);
    // stripe-payment.js calls these endpoints; the router was never mounted.
    this.app.use('/api/stripe', stripeRoutes);
    // Session-gated routers that were written but never mounted. Each route
    // checks security.sessionValidation. Economy is deliberately not mounted:
    // its write routes only require a normal player session.
    this.app.use('/api/entitlements', entitlementsRoutes);
    this.app.use('/api/monetization', monetizationRoutes);
    this.app.use('/api/arpu', arpuRoutes);
    this.app.use('/api/analytics', analyticsRoutes);
    this.app.use('/api/ads', adsRoutes);

    // Platform-specific API routes
    this.setupPlatformRoutes();

    // Serve static files from public directory
    this.app.use(express.static('public'));

    // Serve static files for WebGL build with platform optimization (only when
    // a WebGL build directory actually exists).
    const webglDir = resolveWebGLDir();
    if (webglDir) {
      // Mounted under an explicit prefix on purpose. Mounting it at `/` let it
      // shadow the root game assets: express.static answers `/` with the
      // directory's own index.html and served WebGL/shared-game.js (an older
      // copy) in place of the root one. Unity's index.html uses relative
      // paths, so everything still resolves under /webgl.
      this.app.use(
        '/webgl',
        express.static(webglDir, {
          setHeaders: (res) => {
            // Set platform-specific headers
            const platform = this.platformDetector.getCurrentPlatform();
            if (platform) {
              res.setHeader('X-Platform', platform.name);
              res.setHeader('X-Platform-Type', platform.type);
            }
          },
        }),
      );
    }

    // Serve the game shell.
    //
    // `index.html` and its sibling assets live at the repository root, but the
    // root also holds `.env`, credentials and `node_modules`, so it must never
    // be mounted as a static directory. Only these known game files are
    // exposed.
    this.app.get('/', (req: Request, res: Response) => {
      const platform = this.platformDetector.getCurrentPlatform();
      if (platform) {
        res.setHeader('X-Platform', platform.name);
        res.setHeader('X-Platform-Type', platform.type);
      }
      res.sendFile('index.html', { root: process.cwd() }, (err) => {
        if (err) {
          this.logger.error('Failed to serve index.html', err);
          res.status(500).json({ success: false, message: 'Game shell unavailable' });
        }
      });
    });

    this.app.get('/:gameAsset', (req: Request, res: Response, next: NextFunction) => {
      const file = req.params['gameAsset'];
      if (!file || !ROOT_GAME_ASSETS.has(file)) {
        next();
        return;
      }
      res.sendFile(file, { root: process.cwd() }, (err) => {
        if (err) next();
      });
    });

    // Setup WebSocket handlers
    this.setupWebSocketHandlers();
  }

  private async handleHealthCheck(req: Request, res: Response): Promise<void> {
    // Services are only assigned during `initializeServices()` (from `start()`).
    // Reading them unconditionally made /health throw a TypeError and return
    // 500 whenever the app was used before boot - a health endpoint must
    // always answer, so report each service as uninitialized instead.
    const statusOf = (
      service: { getHealthStatus?: () => unknown; getServiceStatus?: () => unknown } | undefined,
    ): unknown => {
      if (!service) {
        return { status: 'not_initialized' };
      }
      if (typeof service.getHealthStatus === 'function') {
        return service.getHealthStatus();
      }
      if (typeof service.getServiceStatus === 'function') {
        return service.getServiceStatus();
      }
      return { status: 'unknown' };
    };

    const healthCheck: HealthCheckResponse = {
      uptime: process.uptime(),
      message: 'OK',
      timestamp: new Date().toISOString(),
      services: {
        analytics: statusOf(this.unifiedAnalytics),
        monitoring: statusOf(this.prometheusMonitoring),
        cloud: statusOf(this.openSourceCloud),
        legacy: statusOf(this.cloudServices),
      },
    };

    try {
      // Wrapped in the standard { success, data } envelope used by the rest of
      // the API. Consumers (Docker HEALTHCHECK, CI) only read the status code,
      // so this is a safe shape change.
      res.status(200).json(ApiResponseBuilder.success(healthCheck));
    } catch (error) {
      this.logger.error('Health check failed:', { error });
      healthCheck.message = 'ERROR';
      res.status(503).json(ApiResponseBuilder.error('HEALTH_CHECK_FAILED', 'Health check failed'));
    }
  }

  private async handleMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await this.prometheusMonitoring.getMetrics();
      res.set('Content-Type', 'text/plain');
      res.status(200).send(metrics);
    } catch (error) {
      this.logger.error('Metrics endpoint failed:', { error });
      res.status(500).json({ error: 'Failed to get metrics' });
    }
  }

  private setupPlatformRoutes(): void {
    // Platform detection endpoint
    this.app.get('/api/platform/detect', async (req: Request, res: Response) => {
      try {
        const platform = this.platformDetector.getCurrentPlatform();
        const capabilities = this.universalAPI.getPlatformCapabilities();
        const config = this.universalAPI.getPlatformConfig();

        res.json({
          success: true,
          data: {
            platform: platform?.name || 'unknown',
            type: platform?.type || 'unknown',
            capabilities: capabilities.data,
            config: config.data,
            recommendations: this.universalAPI.getPlatformRecommendations(),
          },
        });
      } catch (error) {
        this.logger.error('Platform detection error:', { error });
        res.status(500).json({
          success: false,
          error: 'Platform detection failed',
        });
      }
    });

    // Platform capabilities endpoint
    this.app.get('/api/platform/capabilities', async (req: Request, res: Response) => {
      try {
        const capabilities = this.universalAPI.getPlatformCapabilities();
        res.json(capabilities);
      } catch (error) {
        this.logger.error('Platform capabilities error:', { error });
        res.status(500).json({
          success: false,
          error: 'Failed to get platform capabilities',
        });
      }
    });

    // Build configuration endpoint
    this.app.get('/api/platform/build-config', async (req: Request, res: Response) => {
      try {
        const buildConfig = await this.platformBuildConfig.getOptimizedBuildConfig();
        res.json({
          success: true,
          data: buildConfig,
        });
      } catch (error) {
        this.logger.error('Build config error:', { error });
        res.status(500).json({
          success: false,
          error: 'Failed to get build configuration',
        });
      }
    });

    // Universal API endpoints
    this.app.post('/api/platform/show-ad', async (req: Request, res: Response) => {
      try {
        const result = await this.universalAPI.showAd(req.body);
        res.json(result);
      } catch (error) {
        this.logger.error('Show ad error:', { error });
        res.status(500).json({
          success: false,
          error: 'Failed to show advertisement',
        });
      }
    });

    this.app.post('/api/platform/show-rewarded-ad', async (req: Request, res: Response) => {
      try {
        const result = await this.universalAPI.showRewardedAd();
        res.json(result);
      } catch (error) {
        this.logger.error('Show rewarded ad error:', { error });
        res.status(500).json({
          success: false,
          error: 'Failed to show rewarded advertisement',
        });
      }
    });

    this.app.get('/api/platform/user-info', async (req: Request, res: Response) => {
      try {
        const result = await this.universalAPI.getUserInfo();
        res.json(result);
      } catch (error) {
        this.logger.error('Get user info error:', { error });
        res.status(500).json({
          success: false,
          error: 'Failed to get user information',
        });
      }
    });

    this.app.post('/api/platform/track-event', async (req: Request, res: Response) => {
      try {
        const { eventName, parameters } = req.body;
        const result = await this.universalAPI.trackEvent(eventName, parameters);
        res.json(result);
      } catch (error) {
        this.logger.error('Track event error:', { error });
        res.status(500).json({
          success: false,
          error: 'Failed to track event',
        });
      }
    });

    this.app.post('/api/platform/gameplay-start', async (req: Request, res: Response) => {
      try {
        const result = await this.universalAPI.gameplayStart();
        res.json(result);
      } catch (error) {
        this.logger.error('Gameplay start error:', { error });
        res.status(500).json({
          success: false,
          error: 'Failed to handle gameplay start',
        });
      }
    });

    this.app.post('/api/platform/gameplay-stop', async (req: Request, res: Response) => {
      try {
        const result = await this.universalAPI.gameplayStop();
        res.json(result);
      } catch (error) {
        this.logger.error('Gameplay stop error:', { error });
        res.status(500).json({
          success: false,
          error: 'Failed to handle gameplay stop',
        });
      }
    });
  }

  private setupWebSocketHandlers(): void {
    if (!this.io) {
      this.logger.warn('Socket.IO server unavailable, skipping WebSocket handlers');
      return;
    }

    this.io.on('connection', (socket) => {
      this.logger.info('Client connected:', socket.id);

      // Get platform info
      const platform = this.platformDetector.getCurrentPlatform();

      // Track connection with platform info
      this.analyticsService.trackGameEvent('websocket_connected', {
        socket_id: socket.id,
        ip_address: socket.handshake.address,
        platform: platform?.name || 'unknown',
        platform_type: platform?.type || 'unknown',
      });

      // Handle game events
      socket.on('game_event', async (data) => {
        try {
          await this.analyticsService.trackGameEvent(
            data.event_name,
            data.properties,
            data.user_id,
          );

          // Broadcast to other clients if needed
          socket.broadcast.emit('game_event', data);
        } catch (error) {
          this.logger.error('Error handling game event:', { error });
          socket.emit('error', { message: 'Failed to process game event' });
        }
      });

      // Handle performance metrics
      socket.on('performance_metric', async (data) => {
        try {
          await this.analyticsService.trackPerformance(data.user_id, {
            metricName: data.metric_name,
            value: data.value,
            unit: data.unit,
            level: data.level,
            deviceInfo: data.device_info,
            platform: platform?.name || 'unknown',
          });
        } catch (error) {
          this.logger.error('Error handling performance metric:', { error });
        }
      });

      // Handle platform-specific events
      socket.on('platform_event', async (data) => {
        try {
          // Handle platform-specific events through Universal API
          if (data.type === 'show_ad') {
            await this.universalAPI.showAd(data.config);
          } else if (data.type === 'track_event') {
            await this.universalAPI.trackEvent(data.eventName, data.parameters);
          }
        } catch (error) {
          this.logger.error('Error handling platform event:', { error });
          socket.emit('error', { message: 'Failed to process platform event' });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.logger.info('Client disconnected:', socket.id);

        this.analyticsService.trackGameEvent('websocket_disconnected', {
          socket_id: socket.id,
          platform: platform?.name || 'unknown',
        });
      });
    });
  }

  private setupErrorHandling(): void {
    // Sentry error handler (must be registered after all routes/middleware)
    if (process.env['SENTRY_DSN']) {
      Sentry.setupExpressErrorHandler(this.app);
    }

    // Custom error tracking middleware
    this.app.use(errorTrackingMiddleware);

    // 404 handler. Express 5 / path-to-regexp v8 reject a bare `'*'` path, so
    // the catch-all is registered without a path matcher.
    this.app.use((req: Request, res: Response) => {
      // Use the shared { success, error } envelope so clients can rely on a
      // single error shape across 404s and handled errors alike.
      res.status(404).json({
        ...ApiResponseBuilder.error('ROUTE_NOT_FOUND', 'Route not found'),
        path: req.originalUrl,
      });
    });
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      this.logger.info(`${signal} received, shutting down gracefully...`);

      try {
        await this.analyticsService.shutdown();
        this.server.close(() => {
          this.logger.info('Server closed');
          process.exit(0);
        });
      } catch (error) {
        this.logger.error('Error during shutdown:', { error });
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  /**
   * Exposes the configured Express application. Routes and middleware are
   * wired up in the constructor, so this is usable (for tests or embedding)
   * without calling `start()` and binding a port.
   */
  public getApp(): Application {
    return this.app;
  }

  public async start(): Promise<void> {
    await this.initializeServices();

    this.server.listen(this.config.port, this.config.host, () => {
      this.logger.info(`🚀 Infinite Match Game Server running on port ${this.config.port}`);
      this.logger.info(
        `📊 Analytics: ${this.analyticsService.isInitialized ? 'Enabled' : 'Disabled'}`,
      );
      this.logger.info(
        `☁️  Cloud Services: ${this.cloudServices.isInitialized ? 'Enabled' : 'Disabled'}`,
      );
      this.logger.info('🌐 WebSocket: Enabled');
      this.logger.info('📈 Monitoring: Sentry, OpenTelemetry, New Relic');
    });
  }
}

// Start server
const server = new GameServer();
server.start().catch((error) => {
  const logger = new Logger('ServerStartup');
  logger.error('Failed to start server:', { error });
  process.exit(1);
});

export default GameServer;
