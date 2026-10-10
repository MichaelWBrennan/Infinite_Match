import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { ServerResponse } from 'http';
import { Logger } from '../../core/logger/index.js';
const logger = new Logger('MobileAPIGateway');
const app = express();
const PORT = process.env['PORT'] || 3000;
// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'mobile-api-gateway',
        timestamp: new Date().toISOString(),
        version: process.env['npm_package_version'] || '1.0.0',
        platform: 'mobile',
    });
});
// Service discovery and routing for mobile game
const services = {
    game: process.env['GAME_SERVICE_URL'] || 'http://game-service:3001',
    economy: process.env['ECONOMY_SERVICE_URL'] || 'http://economy-service:3002',
    analytics: process.env['ANALYTICS_SERVICE_URL'] || 'http://analytics-service:3003',
    security: process.env['SECURITY_SERVICE_URL'] || 'http://security-service:3004',
    unity: process.env['UNITY_SERVICE_URL'] || 'http://unity-service:3005',
    ai: process.env['AI_SERVICE_URL'] || 'http://ai-service:3006',
};
/**
 * Respond to an upstream failure with a 503 JSON payload.
 * http-proxy-middleware v3 hands us a raw `ServerResponse`, so the Express
 * `res.status().json()` shorthand is not available here.
 */
const serviceErrorHandler = (serviceName) => (err, req, res) => {
    logger.error(`${serviceName} service error`, { error: err.message, url: req.url });
    // An upgraded WebSocket request surfaces a raw socket instead of a response.
    if (!(res instanceof ServerResponse)) {
        res.destroy();
        return;
    }
    if (res.headersSent) {
        res.end();
        return;
    }
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `${serviceName} service unavailable` }));
};
// Game Service Proxy - Core game functionality
app.use('/api/game', createProxyMiddleware({
    target: services.game,
    changeOrigin: true,
    pathRewrite: {
        '^/api/game': '/api',
    },
    on: { error: serviceErrorHandler('Game') },
}));
// Economy Service Proxy - In-game purchases and currency
app.use('/api/economy', createProxyMiddleware({
    target: services.economy,
    changeOrigin: true,
    pathRewrite: {
        '^/api/economy': '/api',
    },
    on: { error: serviceErrorHandler('Economy') },
}));
// Analytics Service Proxy - Player behavior tracking
app.use('/api/analytics', createProxyMiddleware({
    target: services.analytics,
    changeOrigin: true,
    pathRewrite: {
        '^/api/analytics': '/api',
    },
    on: { error: serviceErrorHandler('Analytics') },
}));
// Security Service Proxy - Anti-cheat and fraud detection
app.use('/api/security', createProxyMiddleware({
    target: services.security,
    changeOrigin: true,
    pathRewrite: {
        '^/api/security': '/api',
    },
    on: { error: serviceErrorHandler('Security') },
}));
// Unity Service Proxy - Unity Cloud integration
app.use('/api/unity', createProxyMiddleware({
    target: services.unity,
    changeOrigin: true,
    pathRewrite: {
        '^/api/unity': '/api',
    },
    on: { error: serviceErrorHandler('Unity') },
}));
// AI Service Proxy - Game analytics and recommendations
app.use('/api/ai', createProxyMiddleware({
    target: services.ai,
    changeOrigin: true,
    pathRewrite: {
        '^/api/ai': '/api',
    },
    on: { error: serviceErrorHandler('AI') },
}));
// Mobile-specific endpoints
app.get('/api/mobile/status', (req, res) => {
    res.json({
        status: 'healthy',
        platform: 'mobile',
        services: Object.keys(services).map((name) => ({
            name,
            url: services[name],
            status: 'healthy',
        })),
        timestamp: new Date().toISOString(),
    });
});
// Mobile game configuration endpoint
app.get('/api/mobile/config', (req, res) => {
    res.json({
        gameVersion: process.env['GAME_VERSION'] || '1.0.0',
        apiVersion: 'v1',
        platform: 'mobile',
        features: {
            multiplayer: true,
            analytics: true,
            ai: true,
            security: true,
            unityCloud: true,
        },
        endpoints: {
            game: '/api/game',
            economy: '/api/economy',
            analytics: '/api/analytics',
            security: '/api/security',
            unity: '/api/unity',
            ai: '/api/ai',
        },
    });
});
// Error handling
app.use((err, req, res, next) => {
    logger.error('Mobile API Gateway error', { error: err.message, stack: err.stack, url: req.url });
    res.status(500).json({ error: 'Internal server error' });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Mobile API endpoint not found' });
});
app.listen(PORT, () => {
    logger.info(`Mobile API Gateway running on port ${PORT}`);
    logger.info('Available mobile services:', Object.keys(services));
});
export default app;
//# sourceMappingURL=index.js.map