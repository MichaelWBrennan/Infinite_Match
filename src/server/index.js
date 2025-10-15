import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import * as Sentry from '@sentry/node';
import analyticsService from '../services/advanced-analytics-service.js';
import cloudServices from '../services/enhanced-cloud-services.js';
import retentionSystem from '../services/retention-system.js';
import gameRoutes from '../routes/game-routes.js';
import { analyticsMiddleware, errorTrackingMiddleware } from '../middleware/analytics-middleware.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Initialize services
async function initializeServices() {
    try {
        console.log('Initializing services...');
        
        // Initialize analytics service
        await analyticsService.initialize();
        
        // Initialize cloud services
        await cloudServices.initialize();
        
        // Initialize retention system
        await retentionSystem.initialize();
        
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
        new Sentry.Integrations.Redis({ useRedis: true })
    ]
});

// Middleware
app.use(Sentry.requestHandler());
app.use(Sentry.tracingHandler());

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.amplitude.com", "https://cdn.mxpnl.com"],
            connectSrc: ["'self'", "https://api2.amplitude.com", "https://api.mixpanel.com", "https://browser.sentry-cdn.com"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https:", "data:"]
        }
    }
}));

app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true
}));

app.use(compression());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
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
            cloud: cloudServices.getServiceStatus()
        }
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

// Serve static files for WebGL build
app.use(express.static('webgl'));

// Serve Unity WebGL build
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: 'webgl' });
});

// WebSocket connection for real-time game events
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Track connection
    analyticsService.trackGameEvent('websocket_connected', {
        socket_id: socket.id,
        ip_address: socket.handshake.address
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
                deviceInfo: data.device_info
            });
        } catch (error) {
            console.error('Error handling performance metric:', error);
        }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        
        analyticsService.trackGameEvent('websocket_disconnected', {
            socket_id: socket.id
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
        path: req.originalUrl
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
        console.log(`🌐 WebSocket: Enabled`);
        console.log(`📈 Monitoring: Sentry, OpenTelemetry, New Relic`);
    });
}

startServer().catch(console.error);