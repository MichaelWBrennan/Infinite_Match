import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { Logger } from '../../core/logger/index.js';

const logger = new Logger('APIGateway');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Service discovery and routing
const services = {
  graphql: process.env.GRAPHQL_SERVICE_URL || 'http://graphql-service:4000',
  game: process.env.GAME_SERVICE_URL || 'http://game-service:3001',
  economy: process.env.ECONOMY_SERVICE_URL || 'http://economy-service:3002',
  analytics: process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:3003',
  security: process.env.SECURITY_SERVICE_URL || 'http://security-service:3004',
  unity: process.env.UNITY_SERVICE_URL || 'http://unity-service:3005',
  websocket: process.env.WEBSOCKET_SERVICE_URL || 'http://websocket-service:3006',
  ai: process.env.AI_SERVICE_URL || 'http://ai-service:3007'
};

// GraphQL Service Proxy
app.use('/graphql', createProxyMiddleware({
  target: services.graphql,
  changeOrigin: true,
  pathRewrite: {
    '^/graphql': '/graphql'
  },
  onError: (err, req, res) => {
    logger.error('GraphQL service error', { error: err.message, url: req.url });
    res.status(503).json({ error: 'GraphQL service unavailable' });
  }
}));

// Game Service Proxy
app.use('/api/game', createProxyMiddleware({
  target: services.game,
  changeOrigin: true,
  pathRewrite: {
    '^/api/game': '/api'
  },
  onError: (err, req, res) => {
    logger.error('Game service error', { error: err.message, url: req.url });
    res.status(503).json({ error: 'Game service unavailable' });
  }
}));

// Economy Service Proxy
app.use('/api/economy', createProxyMiddleware({
  target: services.economy,
  changeOrigin: true,
  pathRewrite: {
    '^/api/economy': '/api'
  },
  onError: (err, req, res) => {
    logger.error('Economy service error', { error: err.message, url: req.url });
    res.status(503).json({ error: 'Economy service unavailable' });
  }
}));

// Analytics Service Proxy
app.use('/api/analytics', createProxyMiddleware({
  target: services.analytics,
  changeOrigin: true,
  pathRewrite: {
    '^/api/analytics': '/api'
  },
  onError: (err, req, res) => {
    logger.error('Analytics service error', { error: err.message, url: req.url });
    res.status(503).json({ error: 'Analytics service unavailable' });
  }
}));

// Security Service Proxy
app.use('/api/security', createProxyMiddleware({
  target: services.security,
  changeOrigin: true,
  pathRewrite: {
    '^/api/security': '/api'
  },
  onError: (err, req, res) => {
    logger.error('Security service error', { error: err.message, url: req.url });
    res.status(503).json({ error: 'Security service unavailable' });
  }
}));

// Unity Service Proxy
app.use('/api/unity', createProxyMiddleware({
  target: services.unity,
  changeOrigin: true,
  pathRewrite: {
    '^/api/unity': '/api'
  },
  onError: (err, req, res) => {
    logger.error('Unity service error', { error: err.message, url: req.url });
    res.status(503).json({ error: 'Unity service unavailable' });
  }
}));

// WebSocket Service Proxy
app.use('/ws', createProxyMiddleware({
  target: services.websocket,
  changeOrigin: true,
  ws: true,
  onError: (err, req, res) => {
    logger.error('WebSocket service error', { error: err.message, url: req.url });
    res.status(503).json({ error: 'WebSocket service unavailable' });
  }
}));

// AI Service Proxy
app.use('/api/ai', createProxyMiddleware({
  target: services.ai,
  changeOrigin: true,
  pathRewrite: {
    '^/api/ai': '/api'
  },
  onError: (err, req, res) => {
    logger.error('AI service error', { error: err.message, url: req.url });
    res.status(503).json({ error: 'AI service unavailable' });
  }
}));

// Service discovery endpoint
app.get('/services', (req, res) => {
  res.json({
    services: Object.keys(services).map(name => ({
      name,
      url: services[name as keyof typeof services],
      status: 'healthy' // In production, this would check actual service health
    }))
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('API Gateway error', { error: err.message, stack: err.stack, url: req.url });
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Service not found' });
});

app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
  logger.info('Available services:', Object.keys(services));
});

export default app;