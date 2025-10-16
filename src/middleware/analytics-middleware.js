import analyticsService from '../services/analytics-service.js';
import cloudServices from '../services/cloud-services.js';

/**
 * Analytics middleware for Express.js
 * Automatically tracks API requests and responses
 */
export const analyticsMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || require('crypto').randomUUID();

  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);

  // Track request start
  analyticsService.trackGameEvent(
    'api_request_started',
    {
      method: req.method,
      url: req.url,
      user_agent: req.get('User-Agent'),
      ip_address: req.ip,
      request_id: requestId,
    },
    req.user?.id,
  );

  // Override res.end to track response
  const originalEnd = res.end;
  res.end = function (chunk, encoding) {
    const duration = Date.now() - startTime;

    // Track request completion
    analyticsService.trackGameEvent(
      'api_request_completed',
      {
        method: req.method,
        url: req.url,
        status_code: res.statusCode,
        duration_ms: duration,
        request_id: requestId,
        response_size: res.get('Content-Length') || 0,
      },
      req.user?.id,
    );

    // Track performance metrics
    analyticsService.trackPerformance(req.user?.id, {
      metricName: 'api_response_time',
      value: duration,
      unit: 'milliseconds',
      level: req.user?.level || 1,
      deviceInfo: {
        user_agent: req.get('User-Agent'),
        platform: req.get('X-Platform') || 'unknown',
      },
    });

    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

/**
 * Error tracking middleware
 */
export const errorTrackingMiddleware = (error, req, res, next) => {
  // Track error with analytics
  analyticsService.trackError(req.user?.id, {
    type: error.name || 'UnknownError',
    message: error.message,
    code: error.code || 'UNKNOWN',
    level: req.user?.level || 1,
    stackTrace: error.stack,
    request_id: req.headers['x-request-id'],
    url: req.url,
    method: req.method,
  });

  // Send error notification
  cloudServices
    .sendGameEventNotification('error_occurred', req.user?.id, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      request: {
        url: req.url,
        method: req.method,
        headers: req.headers,
      },
    })
    .catch(console.error);

  next(error);
};

/**
 * Game event tracking middleware
 */
export const gameEventMiddleware = (req, res, next) => {
  // Check if this is a game event endpoint
  if (req.path.startsWith('/api/game/')) {
    const eventType = req.path.split('/').pop();

    // Track game event
    analyticsService.trackGameEvent(
      `game_${eventType}`,
      {
        ...req.body,
        request_id: req.headers['x-request-id'],
        timestamp: new Date().toISOString(),
      },
      req.user?.id,
    );
  }

  next();
};
