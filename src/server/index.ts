import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer, Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import * as Sentry from '@sentry/node';
import { AppConfig } from '../core/config/index.js';
import { Logger } from '../core/logger/index.js';
import { ErrorHandler } from '../core/errors/ErrorHandler.js';
import { ServiceContainer } from '../core/container/ServiceContainer.js';
import { AnalyticsService } from '../services/analytics-service.js';
import { CloudServices } from '../services/cloud-services.js';
import gameRoutes from '../routes/game-routes.js';
import {
  analyticsMiddleware,
  errorTrackingMiddleware,
} from '../middleware/analytics-middleware.js';

interface ServerConfig {
  port: number;
  host: string;
  environment: string;
}

interface HealthCheckResponse {
  uptime: number;
  message: string;
  timestamp: string;
  services: {
    analytics: any;
    cloud: any;
  };
}

class GameServer {
  private app: Application;
  private server: HttpServer;
  private io: SocketIOServer;
  private config: ServerConfig;
  private logger: Logger;
  private errorHandler: ErrorHandler;
  private serviceContainer: ServiceContainer;
  private analyticsService: AnalyticsService;
  private cloudServices: CloudServices;

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
    this.serviceContainer = new ServiceContainer();
    
    this.initializeSocketIO();
    this.initializeServices();
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
  }

  private async initializeServices(): Promise<void> {
    try {
      this.logger.info('Initializing services...');

      // Initialize analytics service
      this.analyticsService = this.serviceContainer.get<AnalyticsService>('analytics');
      await this.analyticsService.initialize();

      // Initialize cloud services
      this.cloudServices = this.serviceContainer.get<CloudServices>('cloud');
      await this.cloudServices.initialize();

      this.logger.info('All services initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize services:', error);
      process.exit(1);
    }
  }

  private initializeSentry(): void {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: this.config.environment,
      tracesSampleRate: 1.0,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app: this.app }),
        new Sentry.Integrations.Mongo({ useMongoose: true }),
        new Sentry.Integrations.Redis({ useRedis: true }),
      ],
    });
  }

  private setupMiddleware(): void {
    // Initialize Sentry
    this.initializeSentry();

    // Sentry middleware
    this.app.use(Sentry.requestHandler());
    this.app.use(Sentry.tracingHandler());

    // Security middleware
    this.app.use(
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

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Analytics middleware
    this.app.use(analyticsMiddleware);
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', this.handleHealthCheck.bind(this));

    // API routes
    this.app.use('/api/game', gameRoutes);

    // Serve static files for WebGL build
    this.app.use(express.static('webgl'));

    // Serve Unity WebGL build
    this.app.get('/', (req: Request, res: Response) => {
      res.sendFile('index.html', { root: 'webgl' });
    });

    // Setup WebSocket handlers
    this.setupWebSocketHandlers();
  }

  private async handleHealthCheck(req: Request, res: Response): Promise<void> {
    const healthCheck: HealthCheckResponse = {
      uptime: process.uptime(),
      message: 'OK',
      timestamp: new Date().toISOString(),
      services: {
        analytics: this.analyticsService.getAnalyticsSummary(),
        cloud: this.cloudServices.getServiceStatus(),
      },
    };

    try {
      res.status(200).json(healthCheck);
    } catch (error) {
      this.logger.error('Health check failed:', error);
      healthCheck.message = 'ERROR';
      res.status(503).json(healthCheck);
    }
  }

  private setupWebSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      this.logger.info('Client connected:', socket.id);

      // Track connection
      this.analyticsService.trackGameEvent('websocket_connected', {
        socket_id: socket.id,
        ip_address: socket.handshake.address,
      });

      // Handle game events
      socket.on('game_event', async (data) => {
        try {
          await this.analyticsService.trackGameEvent(
            data.event_name,
            data.properties,
            data.user_id
          );

          // Broadcast to other clients if needed
          socket.broadcast.emit('game_event', data);
        } catch (error) {
          this.logger.error('Error handling game event:', error);
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
          });
        } catch (error) {
          this.logger.error('Error handling performance metric:', error);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.logger.info('Client disconnected:', socket.id);

        this.analyticsService.trackGameEvent('websocket_disconnected', {
          socket_id: socket.id,
        });
      });
    });
  }

  private setupErrorHandling(): void {
    // Sentry error handler
    this.app.use(Sentry.errorHandler());
    
    // Custom error tracking middleware
    this.app.use(errorTrackingMiddleware);

    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
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
        this.logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  public async start(): Promise<void> {
    await this.initializeServices();

    this.server.listen(this.config.port, this.config.host, () => {
      this.logger.info(`🚀 Match 3 Game Server running on port ${this.config.port}`);
      this.logger.info(`📊 Analytics: ${this.analyticsService.isInitialized ? 'Enabled' : 'Disabled'}`);
      this.logger.info(`☁️  Cloud Services: ${this.cloudServices.isInitialized ? 'Enabled' : 'Disabled'}`);
      this.logger.info('🌐 WebSocket: Enabled');
      this.logger.info('📈 Monitoring: Sentry, OpenTelemetry, New Relic');
    });
  }
}

// Start server
const server = new GameServer();
server.start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default GameServer;