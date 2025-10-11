/**
 * HTTPS Enforcement Module
 * Ensures secure connections in production
 */
import { Logger } from '../logger/index.js';
import { AppConfig } from '../config/index.js';
const logger = new Logger('HTTPS');
/**
 * HTTPS enforcement middleware
 * Redirects HTTP to HTTPS in production
 */
export const httpsEnforcement = (req, res, next) => {
    // Skip HTTPS enforcement in development
    if (AppConfig.server.environment === 'development') {
        return next();
    }
    // Check if request is already HTTPS
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
        return next();
    }
    // Check for HTTPS header from load balancer
    if (req.headers['x-forwarded-proto'] === 'https') {
        return next();
    }
    // Redirect to HTTPS
    const httpsUrl = `https://${req.get('host')}${req.originalUrl}`;
    logger.info('Redirecting to HTTPS', {
        originalUrl: req.originalUrl,
        httpsUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    res.redirect(301, httpsUrl);
};
/**
 * HTTPS-only middleware
 * Blocks non-HTTPS requests in production
 */
export const httpsOnly = (req, res, next) => {
    // Skip in development
    if (AppConfig.server.environment === 'development') {
        return next();
    }
    // Check if request is secure
    if (!req.secure && req.headers['x-forwarded-proto'] !== 'https') {
        logger.warn('Blocked non-HTTPS request', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            url: req.originalUrl
        });
        return res.status(403).json({
            success: false,
            error: 'HTTPS required',
            message: 'This application requires a secure connection'
        });
    }
    next();
};
/**
 * Security headers for HTTPS
 */
export const httpsHeaders = (req, res, next) => {
    // Strict Transport Security (HSTS)
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    // Content Security Policy with HTTPS enforcement
    res.setHeader('Content-Security-Policy', "default-src 'self' https:; " +
        "script-src 'self' 'unsafe-inline' https:; " +
        "style-src 'self' 'unsafe-inline' https:; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' https:; " +
        "connect-src 'self' https:; " +
        "frame-ancestors 'none'; " +
        "upgrade-insecure-requests");
    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Permissions Policy
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()');
    next();
};
/**
 * HTTPS health check
 */
export const httpsHealthCheck = (req, res) => {
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    const protocol = isSecure ? 'https' : 'http';
    res.json({
        https: isSecure,
        protocol,
        environment: AppConfig.server.environment,
        timestamp: new Date().toISOString()
    });
};
/**
 * Get HTTPS configuration
 */
export const getHttpsConfig = () => {
    return {
        enabled: AppConfig.server.environment !== 'development',
        environment: AppConfig.server.environment,
        enforcement: AppConfig.server.environment === 'production',
        headers: {
            hsts: true,
            csp: true,
            referrerPolicy: true,
            permissionsPolicy: true
        }
    };
};
export default {
    httpsEnforcement,
    httpsOnly,
    httpsHeaders,
    httpsHealthCheck,
    getHttpsConfig
};
//# sourceMappingURL=https.js.map