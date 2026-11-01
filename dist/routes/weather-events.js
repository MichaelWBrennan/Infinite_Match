/**
 * Weather & Context-Aware Gameplay Routes - Phase 10.
 *
 * Endpoints:
 *   GET   /api/weather/modifiers       - Get active weather/context modifiers for a player
 *   GET   /api/weather/effects         - Get available weather effect types
 *   GET   /api/weather/holiday-effects - Get available holiday effect types
 *   GET   /api/weather/active          - Check if a weather condition is active
 */
import express from 'express';
import { Logger } from '../core/logger/index.js';
import { WeatherEventsService } from '../services/meta/weather-events-service.js';
const router = express.Router();
const logger = new Logger('WeatherEventsRoutes');
const weatherEventsService = new WeatherEventsService();
/**
 * GET /api/weather/modifiers
 * Get active gameplay modifiers based on player's location/time.
 * Query params: lat, lon, timezone, country, playerId
 */
router.get('/modifiers', async (req, res) => {
    try {
        const { lat, lon, timezone, country, playerId } = req.query;
        const playerContext = {
            lat: lat !== undefined ? parseFloat(lat) : undefined,
            lon: lon !== undefined ? parseFloat(lon) : undefined,
            timezone: timezone || 'UTC',
            country: country || 'US',
            playerId: playerId || 'anonymous',
        };
        const modifiers = await weatherEventsService.getActiveModifiers(playerContext);
        return res.json({ success: true, ...modifiers });
    }
    catch (error) {
        logger.error('Failed to get weather modifiers', { error: error.message });
        return res.status(500).json({ success: false, error: 'Failed to get weather modifiers' });
    }
});
/**
 * GET /api/weather/effects
 * Get available weather effect types (client config).
 */
router.get('/effects', async (req, res) => {
    try {
        const effects = weatherEventsService.getWeatherEffects();
        return res.json({ success: true, effects });
    }
    catch (error) {
        logger.error('Failed to get weather effects', { error: error.message });
        return res.status(500).json({ success: false, error: 'Failed to get weather effects' });
    }
});
/**
 * GET /api/weather/holiday-effects
 * Get available holiday effect types (client config).
 */
router.get('/holiday-effects', async (req, res) => {
    try {
        const effects = weatherEventsService.getHolidayEffects();
        return res.json({ success: true, effects });
    }
    catch (error) {
        logger.error('Failed to get holiday effects', { error: error.message });
        return res.status(500).json({ success: false, error: 'Failed to get holiday effects' });
    }
});
/**
 * GET /api/weather/active
 * Check if a specific weather condition is active for a location.
 * Query params: lat, lon, timezone, country, condition
 */
router.get('/active', async (req, res) => {
    try {
        const { lat, lon, timezone, country, condition } = req.query;
        if (!condition) {
            return res.status(400).json({ success: false, error: 'condition is required' });
        }
        const playerContext = {
            lat: lat !== undefined ? parseFloat(lat) : undefined,
            lon: lon !== undefined ? parseFloat(lon) : undefined,
            timezone: timezone || 'UTC',
            country: country || 'US',
            playerId: 'check',
        };
        const isActive = await weatherEventsService.isWeatherActive(playerContext, condition);
        return res.json({ success: true, condition, active: isActive });
    }
    catch (error) {
        logger.error('Failed to check weather active', { error: error.message });
        return res.status(500).json({ success: false, error: 'Failed to check weather condition' });
    }
});
export default router;
//# sourceMappingURL=weather-events.js.map