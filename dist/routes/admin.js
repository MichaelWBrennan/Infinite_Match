/**
 * Admin Routes
 * Handles administrative operations and monitoring
 */
import express from 'express';
import security from 'core/security/index.js';
import { Logger } from 'core/logger/index.js';
import EconomyService from 'services/economy/index.js';
import UnityService from 'services/unity/index.js';
const router = express.Router();
const logger = new Logger('AdminRoutes');
// Initialize services
const economyService = new EconomyService();
const unityService = new UnityService();
// Admin authentication middleware (simplified)
const adminAuth = (req, res, next) => {
    // TODO: Implement proper admin authentication
    const adminToken = req.headers['x-admin-token'];
    if (!adminToken || adminToken !== process.env.ADMIN_TOKEN) {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized',
            requestId: req.requestId,
        });
    }
    next();
};
// Apply admin authentication to all routes
router.use(adminAuth);
// Get system health
router.get('/health', async (req, res) => {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.env.npm_package_version || '1.0.0',
            services: {
                unity: await unityService.authenticate(),
                economy: true, // Economy service is always available
            },
        };
        res.json({
            success: true,
            health,
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger.error('Health check failed', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Health check failed',
            requestId: req.requestId,
        });
    }
});
// Get economy statistics
router.get('/economy/stats', async (req, res) => {
    try {
        const report = await economyService.generateReport();
        res.json({
            success: true,
            stats: report.summary,
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger.error('Failed to get economy statistics', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to get economy statistics',
            requestId: req.requestId,
        });
    }
});
// Get security events
router.get('/security/events', async (req, res) => {
    try {
        const { limit = 100 } = req.query;
        // TODO: Implement actual security events retrieval
        const events = [
            {
                id: '1',
                type: 'login',
                timestamp: new Date().toISOString(),
                details: {
                    playerId: 'player_1',
                    ip: '127.0.0.1',
                },
            },
        ];
        res.json({
            success: true,
            events: events.slice(0, parseInt(limit)),
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger.error('Failed to get security events', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to get security events',
            requestId: req.requestId,
        });
    }
});
// Get Unity Services status
router.get('/unity/status', async (req, res) => {
    try {
        const isAuthenticated = await unityService.authenticate();
        res.json({
            success: true,
            status: {
                authenticated: isAuthenticated,
                projectId: unityService.projectId,
                environmentId: unityService.environmentId,
            },
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger.error('Failed to get Unity status', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to get Unity status',
            requestId: req.requestId,
        });
    }
});
// Deploy all economy data to Unity
router.post('/unity/deploy', async (req, res) => {
    try {
        const economyData = await economyService.loadEconomyData();
        const result = await unityService.deployEconomyData(economyData);
        security.logSecurityEvent('admin_economy_deploy', {
            adminId: req.headers['x-admin-id'] || 'unknown',
            ip: req.ip,
        });
        res.json({
            success: true,
            result,
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger.error('Failed to deploy economy data', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to deploy economy data',
            requestId: req.requestId,
        });
    }
});
// Get system logs
router.get('/logs', async (req, res) => {
    try {
        const { limit = 100 } = req.query;
        // TODO: Implement actual log retrieval
        const logs = [
            {
                timestamp: new Date().toISOString(),
                level: 'info',
                message: 'Server started',
                context: 'Server',
            },
        ];
        res.json({
            success: true,
            logs: logs.slice(0, parseInt(limit)),
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger.error('Failed to get system logs', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to get system logs',
            requestId: req.requestId,
        });
    }
});
// Clear cache
router.post('/cache/clear', async (req, res) => {
    try {
        economyService.clearExpiredCache();
        res.json({
            success: true,
            message: 'Cache cleared successfully',
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger.error('Failed to clear cache', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to clear cache',
            requestId: req.requestId,
        });
    }
});
export default router;
//# sourceMappingURL=admin.js.map