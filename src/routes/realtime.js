import express from 'express';
import { Logger } from '../core/logger/index.js';
import { ServiceError } from '../core/errors/ErrorHandler.js';
import { WeatherService } from '../services/weather-service.js';
import { RealtimeCalendarService } from '../services/realtime-calendar-service.js';
import { RealtimeEventService } from '../services/realtime-event-service.js';
import { UnifiedRealtimeSystem } from '../services/unified-realtime-system.js';

const router = express.Router();
const logger = new Logger('RealtimeRoutes');

// Initialize services
const weatherService = new WeatherService();
const calendarService = new RealtimeCalendarService();
const eventService = new RealtimeEventService();
const unifiedSystem = new UnifiedRealtimeSystem();

/**
 * WEATHER ROUTES
 */

// Get current weather
router.get('/weather/current', async (req, res) => {
    try {
        const { latitude, longitude, location } = req.query;
        
        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                error: 'Latitude and longitude are required'
            });
        }

        const weather = await weatherService.getCurrentWeather(
            parseFloat(latitude),
            parseFloat(longitude),
            location
        );

        res.json({
            success: true,
            data: weather
        });
    } catch (error) {
        logger.error('Failed to get current weather', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get weather forecast
router.get('/weather/forecast', async (req, res) => {
    try {
        const { latitude, longitude, days = 5 } = req.query;
        
        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                error: 'Latitude and longitude are required'
            });
        }

        const forecast = await weatherService.getWeatherForecast(
            parseFloat(latitude),
            parseFloat(longitude),
            parseInt(days)
        );

        res.json({
            success: true,
            data: forecast
        });
    } catch (error) {
        logger.error('Failed to get weather forecast', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get weather statistics
router.get('/weather/stats', async (req, res) => {
    try {
        const stats = await weatherService.getWeatherStatistics();
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Failed to get weather statistics', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * CALENDAR ROUTES
 */

// Get calendar events
router.get('/calendar/events', async (req, res) => {
    try {
        const { startDate, endDate, timezone = 'UTC', eventTypes } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Start date and end date are required'
            });
        }

        const eventTypesArray = eventTypes ? eventTypes.split(',') : null;
        const events = await calendarService.getCalendarEvents(
            startDate,
            endDate,
            timezone,
            eventTypesArray
        );

        res.json({
            success: true,
            data: events
        });
    } catch (error) {
        logger.error('Failed to get calendar events', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get current calendar events
router.get('/calendar/current', async (req, res) => {
    try {
        const { timezone = 'UTC' } = req.query;
        const events = await calendarService.getCurrentEvents(timezone);

        res.json({
            success: true,
            data: events
        });
    } catch (error) {
        logger.error('Failed to get current calendar events', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get upcoming calendar events
router.get('/calendar/upcoming', async (req, res) => {
    try {
        const { hours = 24, timezone = 'UTC' } = req.query;
        const events = await calendarService.getUpcomingEvents(
            parseInt(hours),
            timezone
        );

        res.json({
            success: true,
            data: events
        });
    } catch (error) {
        logger.error('Failed to get upcoming calendar events', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Create calendar event
router.post('/calendar/events', async (req, res) => {
    try {
        const eventData = req.body;
        const event = await calendarService.createCalendarEvent(eventData);

        res.json({
            success: true,
            data: event
        });
    } catch (error) {
        logger.error('Failed to create calendar event', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Update calendar event
router.put('/calendar/events/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;
        const updateData = req.body;
        const event = await calendarService.updateCalendarEvent(eventId, updateData);

        res.json({
            success: true,
            data: event
        });
    } catch (error) {
        logger.error('Failed to update calendar event', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Delete calendar event
router.delete('/calendar/events/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;
        await calendarService.deleteCalendarEvent(eventId);

        res.json({
            success: true,
            message: 'Calendar event deleted successfully'
        });
    } catch (error) {
        logger.error('Failed to delete calendar event', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get calendar statistics
router.get('/calendar/stats', async (req, res) => {
    try {
        const stats = await calendarService.getCalendarStatistics();
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Failed to get calendar statistics', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * EVENT ROUTES
 */

// Get active events
router.get('/events/active', async (req, res) => {
    try {
        const { timezone = 'UTC', eventTypes } = req.query;
        const eventTypesArray = eventTypes ? eventTypes.split(',') : null;
        const events = await eventService.getActiveEvents(timezone, eventTypesArray);

        res.json({
            success: true,
            data: events
        });
    } catch (error) {
        logger.error('Failed to get active events', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get upcoming events
router.get('/events/upcoming', async (req, res) => {
    try {
        const { hours = 24, timezone = 'UTC' } = req.query;
        const events = await eventService.getUpcomingEvents(
            parseInt(hours),
            timezone
        );

        res.json({
            success: true,
            data: events
        });
    } catch (error) {
        logger.error('Failed to get upcoming events', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Create event
router.post('/events', async (req, res) => {
    try {
        const eventData = req.body;
        const event = await eventService.createEvent(eventData);

        res.json({
            success: true,
            data: event
        });
    } catch (error) {
        logger.error('Failed to create event', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Update event progress
router.post('/events/:eventId/progress', async (req, res) => {
    try {
        const { eventId } = req.params;
        const { playerId, progressData } = req.body;
        
        if (!playerId || !progressData) {
            return res.status(400).json({
                success: false,
                error: 'Player ID and progress data are required'
            });
        }

        const progress = await eventService.updateEventProgress(
            eventId,
            playerId,
            progressData
        );

        res.json({
            success: true,
            data: progress
        });
    } catch (error) {
        logger.error('Failed to update event progress', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Complete event
router.post('/events/:eventId/complete', async (req, res) => {
    try {
        const { eventId } = req.params;
        const { playerId } = req.body;
        
        if (!playerId) {
            return res.status(400).json({
                success: false,
                error: 'Player ID is required'
            });
        }

        await eventService.completeEvent(eventId, playerId);

        res.json({
            success: true,
            message: 'Event completed successfully'
        });
    } catch (error) {
        logger.error('Failed to complete event', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get event statistics
router.get('/events/stats', async (req, res) => {
    try {
        const stats = await eventService.getEventStatistics();
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Failed to get event statistics', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * UNIFIED SYSTEM ROUTES
 */

// Get unified real-time data for player
router.get('/unified/player/:playerId', async (req, res) => {
    try {
        const { playerId } = req.params;
        const { timezone = 'UTC' } = req.query;
        
        const data = await unifiedSystem.getPlayerRealtimeData(playerId, timezone);

        res.json({
            success: true,
            data
        });
    } catch (error) {
        logger.error('Failed to get unified player data', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Update player location
router.post('/unified/player/:playerId/location', async (req, res) => {
    try {
        const { playerId } = req.params;
        const { latitude, longitude, locationName, timezone = 'UTC' } = req.body;
        
        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                error: 'Latitude and longitude are required'
            });
        }

        await unifiedSystem.updatePlayerLocation(
            playerId,
            parseFloat(latitude),
            parseFloat(longitude),
            locationName,
            timezone
        );

        res.json({
            success: true,
            message: 'Player location updated successfully'
        });
    } catch (error) {
        logger.error('Failed to update player location', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get system statistics
router.get('/unified/stats', async (req, res) => {
    try {
        const stats = await unifiedSystem.getSystemStatistics();
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Failed to get system statistics', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get system health
router.get('/unified/health', async (req, res) => {
    try {
        const health = {
            timestamp: new Date().toISOString(),
            weather: await weatherService.getWeatherStatistics(),
            calendar: await calendarService.getCalendarStatistics(),
            events: await eventService.getEventStatistics(),
            status: 'healthy'
        };

        res.json({
            success: true,
            data: health
        });
    } catch (error) {
        logger.error('Failed to get system health', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * UTILITY ROUTES
 */

// Get supported timezones
router.get('/timezones', (req, res) => {
    const timezones = [
        'UTC', 'America/New_York', 'America/Los_Angeles', 'America/Chicago',
        'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo',
        'Asia/Shanghai', 'Asia/Kolkata', 'Australia/Sydney', 'Pacific/Auckland'
    ];

    res.json({
        success: true,
        data: timezones
    });
});

// Get current time in timezone
router.get('/time/:timezone', (req, res) => {
    try {
        const { timezone } = req.params;
        const moment = require('moment-timezone');
        const currentTime = moment.tz(timezone);

        res.json({
            success: true,
            data: {
                timezone,
                currentTime: currentTime.format('YYYY-MM-DD HH:mm:ss'),
                timestamp: currentTime.valueOf(),
                utc: currentTime.utc().format('YYYY-MM-DD HH:mm:ss')
            }
        });
    } catch (error) {
        logger.error('Failed to get current time', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;