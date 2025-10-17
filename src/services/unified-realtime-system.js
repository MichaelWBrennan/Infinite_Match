import { Logger } from '../core/logger/index.js';
import { ServiceError } from '../core/errors/ErrorHandler.js';
import { WeatherService } from './weather-service.js';
import { RealtimeCalendarService } from './realtime-calendar-service.js';
import { RealtimeEventService } from './realtime-event-service.js';
import { createClient } from '@supabase/supabase-js';
import cron from 'node-cron';
import moment from 'moment-timezone';

/**
 * Unified Real-Time System
 * Connects weather, calendar, and events into a cohesive real-time experience
 */
class UnifiedRealtimeSystem {
    constructor(io = null) {
        this.logger = new Logger('UnifiedRealtimeSystem');
        
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );
        
        // Initialize all services
        this.weatherService = new WeatherService();
        this.calendarService = new RealtimeCalendarService();
        this.eventService = new RealtimeEventService(io);
        
        // System configuration
        this.systemCache = new Map();
        this.cacheExpiry = 1 * 60 * 1000; // 1 minute
        this.io = io; // Socket.IO for real-time updates
        
        // Player locations for weather-based content
        this.playerLocations = new Map();
        
        // System status
        this.systemStatus = {
            weather: { status: 'initializing', lastUpdate: null },
            calendar: { status: 'initializing', lastUpdate: null },
            events: { status: 'initializing', lastUpdate: null },
            unified: { status: 'initializing', lastUpdate: null }
        };
        
        this.initializeUnifiedSystem();
        this.startUnifiedUpdates();
    }

    /**
     * Initialize unified real-time system
     */
    async initializeUnifiedSystem() {
        this.logger.info('Initializing Unified Real-Time System');
        
        try {
            // Initialize all subsystems
            await this.initializeSubsystems();
            
            // Setup unified schedules
            this.setupUnifiedSchedules();
            
            // Initialize real-time notifications
            this.initializeRealtimeNotifications();
            
            // Load system data
            await this.loadSystemData();
            
            this.systemStatus.unified = { 
                status: 'active', 
                lastUpdate: new Date().toISOString() 
            };
            
            this.logger.info('Unified Real-Time System initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize Unified Real-Time System', error);
            throw new ServiceError('Unified system initialization failed', error);
        }
    }

    /**
     * Initialize all subsystems
     */
    async initializeSubsystems() {
        try {
            // Weather service initialization
            this.systemStatus.weather = { 
                status: 'active', 
                lastUpdate: new Date().toISOString() 
            };
            
            // Calendar service initialization
            this.systemStatus.calendar = { 
                status: 'active', 
                lastUpdate: new Date().toISOString() 
            };
            
            // Event service initialization
            this.systemStatus.events = { 
                status: 'active', 
                lastUpdate: new Date().toISOString() 
            };
            
            this.logger.info('All subsystems initialized');
        } catch (error) {
            this.logger.error('Failed to initialize subsystems', error);
            throw error;
        }
    }

    /**
     * Setup unified update schedules
     */
    setupUnifiedSchedules() {
        // Update unified system every 30 seconds
        cron.schedule('*/30 * * * * *', async () => {
            await this.updateUnifiedSystem();
        });

        // Generate weather-based events every hour
        cron.schedule('0 * * * *', async () => {
            await this.generateWeatherBasedContent();
        });

        // Update player experiences every 5 minutes
        cron.schedule('*/5 * * * *', async () => {
            await this.updatePlayerExperiences();
        });

        // System health check every minute
        cron.schedule('* * * * *', async () => {
            await this.performHealthCheck();
        });

        // Generate dynamic content every 15 minutes
        cron.schedule('*/15 * * * *', async () => {
            await this.generateDynamicContent();
        });
    }

    /**
     * Initialize real-time notifications
     */
    initializeRealtimeNotifications() {
        if (this.io) {
            this.logger.info('Real-time notifications initialized');
        } else {
            this.logger.warn('Socket.IO not provided - real-time notifications disabled');
        }
    }

    /**
     * Get unified real-time data for a player
     */
    async getPlayerRealtimeData(playerId, timezone = 'UTC') {
        try {
            const cacheKey = `player_data_${playerId}_${timezone}`;
            
            // Check cache first
            if (this.systemCache.has(cacheKey)) {
                const cached = this.systemCache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheExpiry) {
                    return cached.data;
                }
            }

            // Get player location
            const playerLocation = await this.getPlayerLocation(playerId);
            
            // Get weather data
            const weatherData = playerLocation ? 
                await this.weatherService.getCurrentWeather(
                    playerLocation.latitude, 
                    playerLocation.longitude, 
                    playerLocation.name
                ) : null;

            // Get calendar events
            const calendarEvents = await this.calendarService.getCurrentEvents(timezone);
            const upcomingCalendarEvents = await this.calendarService.getUpcomingEvents(24, timezone);

            // Get game events
            const gameEvents = await this.eventService.getActiveEvents(timezone);
            const upcomingGameEvents = await this.eventService.getUpcomingEvents(24, timezone);

            // Generate unified experience
            const unifiedData = {
                playerId,
                timezone,
                timestamp: new Date().toISOString(),
                weather: weatherData ? {
                    current: weatherData.current,
                    type: weatherData.weather.type,
                    gameplayEffects: weatherData.gameplay,
                    isActive: true
                } : null,
                calendar: {
                    current: calendarEvents,
                    upcoming: upcomingCalendarEvents,
                    total: calendarEvents.length + upcomingCalendarEvents.length
                },
                events: {
                    current: gameEvents,
                    upcoming: upcomingGameEvents,
                    total: gameEvents.length + upcomingGameEvents.length
                },
                unified: {
                    activeFeatures: this.getActiveFeatures(weatherData, gameEvents, calendarEvents),
                    recommendations: this.generateRecommendations(weatherData, gameEvents, calendarEvents),
                    specialOffers: this.getSpecialOffers(weatherData, gameEvents),
                    timeBasedContent: this.getTimeBasedContent(timezone)
                },
                systemStatus: this.systemStatus
            };

            // Cache the result
            this.systemCache.set(cacheKey, {
                data: unifiedData,
                timestamp: Date.now()
            });

            return unifiedData;
        } catch (error) {
            this.logger.error('Failed to get player real-time data', error);
            throw new ServiceError('Failed to fetch player real-time data', error);
        }
    }

    /**
     * Get player location
     */
    async getPlayerLocation(playerId) {
        try {
            // Check cache first
            if (this.playerLocations.has(playerId)) {
                const cached = this.playerLocations.get(playerId);
                if (Date.now() - cached.timestamp < 30 * 60 * 1000) { // 30 minutes
                    return cached.data;
                }
            }

            // Get from database
            const { data, error } = await this.supabase
                .from('player_locations')
                .select('*')
                .eq('player_id', playerId)
                .eq('is_active', true)
                .order('updated_at', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            const location = data ? {
                latitude: data.latitude,
                longitude: data.longitude,
                name: data.location_name,
                country: data.country,
                timezone: data.timezone
            } : null;

            // Cache the result
            this.playerLocations.set(playerId, {
                data: location,
                timestamp: Date.now()
            });

            return location;
        } catch (error) {
            this.logger.error('Failed to get player location', error);
            return null;
        }
    }

    /**
     * Update player location
     */
    async updatePlayerLocation(playerId, latitude, longitude, locationName = null, timezone = 'UTC') {
        try {
            const location = {
                player_id: playerId,
                latitude,
                longitude,
                location_name: locationName || 'Unknown Location',
                timezone,
                is_active: true,
                updated_at: new Date().toISOString()
            };

            const { error } = await this.supabase
                .from('player_locations')
                .upsert(location);

            if (error) throw error;

            // Update cache
            this.playerLocations.set(playerId, {
                data: {
                    latitude,
                    longitude,
                    name: locationName,
                    timezone
                },
                timestamp: Date.now()
            });

            // Clear player cache
            this.clearPlayerCache(playerId);

            this.logger.info(`Updated location for player ${playerId}`);
            return true;
        } catch (error) {
            this.logger.error('Failed to update player location', error);
            throw new ServiceError('Failed to update player location', error);
        }
    }

    /**
     * Get active features based on current conditions
     */
    getActiveFeatures(weatherData, gameEvents, calendarEvents) {
        const features = [];

        // Weather-based features
        if (weatherData) {
            const weatherType = weatherData.weather.type;
            switch (weatherType) {
                case 'rain':
                    features.push({
                        type: 'weather_rain',
                        name: 'Rainy Day Bonus',
                        description: 'Earn extra coins during rainy weather!',
                        multiplier: weatherData.gameplay.scoreMultiplier,
                        icon: '🌧️'
                    });
                    break;
                case 'snow':
                    features.push({
                        type: 'weather_snow',
                        name: 'Winter Wonderland',
                        description: 'Special winter rewards available!',
                        multiplier: weatherData.gameplay.scoreMultiplier,
                        icon: '❄️'
                    });
                    break;
                case 'thunderstorm':
                    features.push({
                        type: 'weather_storm',
                        name: 'Storm Power',
                        description: 'High energy events with amazing rewards!',
                        multiplier: weatherData.gameplay.scoreMultiplier,
                        icon: '⛈️'
                    });
                    break;
            }
        }

        // Event-based features
        for (const event of gameEvents) {
            features.push({
                type: 'event',
                name: event.title,
                description: event.description,
                eventType: event.eventType,
                timeRemaining: event.timeRemaining,
                icon: this.getEventIcon(event.eventType)
            });
        }

        // Calendar-based features
        for (const event of calendarEvents) {
            features.push({
                type: 'calendar',
                name: event.title,
                description: event.description,
                eventType: event.eventType,
                timeRemaining: event.duration,
                icon: this.getCalendarIcon(event.eventType)
            });
        }

        return features;
    }

    /**
     * Generate personalized recommendations
     */
    generateRecommendations(weatherData, gameEvents, calendarEvents) {
        const recommendations = [];

        // Weather-based recommendations
        if (weatherData) {
            const weatherType = weatherData.weather.type;
            if (weatherType === 'rain' || weatherType === 'thunderstorm') {
                recommendations.push({
                    type: 'weather',
                    title: 'Perfect Weather for Gaming!',
                    description: 'The weather is perfect for indoor gaming. Try our special weather events!',
                    action: 'play_weather_event',
                    priority: 'high'
                });
            }
        }

        // Event-based recommendations
        for (const event of gameEvents) {
            if (event.priority >= 3) {
                recommendations.push({
                    type: 'event',
                    title: `Don't Miss: ${event.title}`,
                    description: event.description,
                    action: 'join_event',
                    priority: 'high',
                    timeRemaining: event.timeRemaining
                });
            }
        }

        // Time-based recommendations
        const hour = moment.tz('UTC').hour();
        if (hour >= 18 || hour <= 6) {
            recommendations.push({
                type: 'time',
                title: 'Evening Gaming Session',
                description: 'Perfect time for a relaxing gaming session!',
                action: 'start_session',
                priority: 'medium'
            });
        }

        return recommendations;
    }

    /**
     * Get special offers based on current conditions
     */
    getSpecialOffers(weatherData, gameEvents) {
        const offers = [];

        // Weather-based offers
        if (weatherData) {
            const weatherType = weatherData.weather.type;
            if (weatherType === 'thunderstorm') {
                offers.push({
                    type: 'weather_storm_offer',
                    title: 'Storm Special Pack',
                    description: 'Limited time offer during stormy weather!',
                    discount: 25,
                    items: ['energy_pack', 'coin_boost', 'special_tiles'],
                    expiresIn: 60 // minutes
                });
            }
        }

        // Event-based offers
        for (const event of gameEvents) {
            if (event.eventType === 'special_offer') {
                offers.push({
                    type: 'event_offer',
                    title: event.title,
                    description: event.description,
                    rewards: event.rewards,
                    timeRemaining: event.timeRemaining
                });
            }
        }

        return offers;
    }

    /**
     * Get time-based content
     */
    getTimeBasedContent(timezone) {
        const now = moment.tz(timezone);
        const hour = now.hour();
        const dayOfWeek = now.day();
        const dayOfMonth = now.date();

        const content = {
            timeOfDay: this.getTimeOfDay(hour),
            dayType: this.getDayType(dayOfWeek),
            specialDay: this.getSpecialDay(dayOfMonth),
            recommendations: []
        };

        // Time-based recommendations
        if (hour >= 6 && hour < 12) {
            content.recommendations.push({
                type: 'morning',
                title: 'Good Morning!',
                description: 'Start your day with a quick game session!',
                action: 'morning_session'
            });
        } else if (hour >= 12 && hour < 18) {
            content.recommendations.push({
                type: 'afternoon',
                title: 'Afternoon Break',
                description: 'Perfect time for a gaming break!',
                action: 'afternoon_session'
            });
        } else if (hour >= 18 && hour < 22) {
            content.recommendations.push({
                type: 'evening',
                title: 'Evening Gaming',
                description: 'Relax with some evening gaming!',
                action: 'evening_session'
            });
        }

        return content;
    }

    /**
     * Get time of day category
     */
    getTimeOfDay(hour) {
        if (hour >= 6 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 18) return 'afternoon';
        if (hour >= 18 && hour < 22) return 'evening';
        return 'night';
    }

    /**
     * Get day type
     */
    getDayType(dayOfWeek) {
        if (dayOfWeek === 0 || dayOfWeek === 6) return 'weekend';
        return 'weekday';
    }

    /**
     * Get special day
     */
    getSpecialDay(dayOfMonth) {
        const specialDays = {
            1: 'month_start',
            15: 'mid_month',
            25: 'month_end',
            31: 'month_end'
        };
        return specialDays[dayOfMonth] || 'regular';
    }

    /**
     * Get event icon
     */
    getEventIcon(eventType) {
        const icons = {
            'daily_challenge': '📅',
            'weekly_tournament': '🏆',
            'weather_event': '🌤️',
            'special_offer': '🎁',
            'seasonal_event': '🎄',
            'live_event': '🔴'
        };
        return icons[eventType] || '📌';
    }

    /**
     * Get calendar icon
     */
    getCalendarIcon(eventType) {
        const icons = {
            'game_event': '🎮',
            'weather_event': '🌤️',
            'maintenance': '🔧',
            'special_offer': '🎁',
            'tournament': '🏆',
            'seasonal': '🎄',
            'daily_reset': '🔄',
            'weekly_reset': '📅',
            'monthly_reset': '📆'
        };
        return icons[eventType] || '📅';
    }

    /**
     * Update unified system
     */
    async updateUnifiedSystem() {
        try {
            // Update all subsystems
            await this.weatherService.updateAllWeatherData();
            await this.calendarService.updateCalendarEvents();
            await this.eventService.updateAllEvents();

            // Update system status
            this.systemStatus.unified = {
                status: 'active',
                lastUpdate: new Date().toISOString()
            };

            // Send system update notification
            this.sendSystemNotification('system_updated', {
                timestamp: new Date().toISOString(),
                status: this.systemStatus
            });

        } catch (error) {
            this.logger.error('Failed to update unified system', error);
        }
    }

    /**
     * Generate weather-based content
     */
    async generateWeatherBasedContent() {
        try {
            // This will trigger weather-based event generation
            await this.eventService.generateWeatherEvents();
            
            this.logger.info('Weather-based content generated');
        } catch (error) {
            this.logger.error('Failed to generate weather-based content', error);
        }
    }

    /**
     * Update player experiences
     */
    async updatePlayerExperiences() {
        try {
            // Get all active players
            const { data: players, error } = await this.supabase
                .from('player_locations')
                .select('player_id')
                .eq('is_active', true);

            if (error) throw error;

            // Update experiences for each player
            for (const player of players) {
                try {
                    const playerData = await this.getPlayerRealtimeData(player.player_id);
                    this.sendPlayerNotification(player.player_id, 'experience_updated', playerData);
                } catch (error) {
                    this.logger.error(`Failed to update experience for player ${player.player_id}`, error);
                }
            }

        } catch (error) {
            this.logger.error('Failed to update player experiences', error);
        }
    }

    /**
     * Perform system health check
     */
    async performHealthCheck() {
        try {
            const health = {
                timestamp: new Date().toISOString(),
                weather: await this.checkWeatherHealth(),
                calendar: await this.checkCalendarHealth(),
                events: await this.checkEventHealth(),
                unified: this.systemStatus.unified
            };

            // Log health status
            this.logger.info('System health check completed', health);

            // Send health notification if issues found
            const hasIssues = Object.values(health).some(service => 
                service.status !== 'active' && service.status !== 'healthy'
            );

            if (hasIssues) {
                this.sendSystemNotification('health_issue', health);
            }

        } catch (error) {
            this.logger.error('Failed to perform health check', error);
        }
    }

    /**
     * Check weather service health
     */
    async checkWeatherHealth() {
        try {
            const stats = await this.weatherService.getWeatherStatistics();
            return {
                status: 'healthy',
                lastUpdate: stats.lastUpdate,
                totalUpdates: stats.totalUpdates
            };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    /**
     * Check calendar service health
     */
    async checkCalendarHealth() {
        try {
            const stats = await this.calendarService.getCalendarStatistics();
            return {
                status: 'healthy',
                totalEvents: stats.totalEvents,
                activeEvents: stats.activeEvents
            };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    /**
     * Check event service health
     */
    async checkEventHealth() {
        try {
            const stats = await this.eventService.getEventStatistics();
            return {
                status: 'healthy',
                totalEvents: stats.totalEvents,
                activeEvents: stats.activeEvents
            };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    /**
     * Generate dynamic content
     */
    async generateDynamicContent() {
        try {
            // Generate special events
            await this.eventService.generateSpecialEvents();
            
            // Generate calendar events based on current conditions
            await this.generateDynamicCalendarEvents();
            
            this.logger.info('Dynamic content generated');
        } catch (error) {
            this.logger.error('Failed to generate dynamic content', error);
        }
    }

    /**
     * Generate dynamic calendar events
     */
    async generateDynamicCalendarEvents() {
        try {
            const now = moment.tz('UTC');
            const hour = now.hour();
            
            // Generate time-based calendar events
            if (hour === 0) { // Midnight
                await this.calendarService.createCalendarEvent({
                    title: 'New Day Begins',
                    description: 'A new day brings new opportunities!',
                    eventType: 'daily_reset',
                    startTime: now.format('YYYY-MM-DD HH:mm:ss'),
                    endTime: now.add(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
                    timezone: 'UTC',
                    priority: 1
                });
            }
            
        } catch (error) {
            this.logger.error('Failed to generate dynamic calendar events', error);
        }
    }

    /**
     * Send system notification
     */
    sendSystemNotification(type, data) {
        if (this.io) {
            this.io.emit('system_notification', {
                type,
                data,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Send player notification
     */
    sendPlayerNotification(playerId, type, data) {
        if (this.io) {
            this.io.to(`player_${playerId}`).emit('player_notification', {
                type,
                data,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Clear player cache
     */
    clearPlayerCache(playerId) {
        const keysToDelete = [];
        for (const [key, value] of this.systemCache.entries()) {
            if (key.includes(`player_${playerId}`)) {
                keysToDelete.push(key);
            }
        }
        
        for (const key of keysToDelete) {
            this.systemCache.delete(key);
        }
    }

    /**
     * Load system data
     */
    async loadSystemData() {
        try {
            // Load initial system data
            this.logger.info('System data loaded');
        } catch (error) {
            this.logger.error('Failed to load system data', error);
        }
    }

    /**
     * Start unified updates
     */
    startUnifiedUpdates() {
        this.logger.info('Starting unified update schedules');
    }

    /**
     * Get system statistics
     */
    async getSystemStatistics() {
        try {
            const weatherStats = await this.weatherService.getWeatherStatistics();
            const calendarStats = await this.calendarService.getCalendarStatistics();
            const eventStats = await this.eventService.getEventStatistics();

            return {
                timestamp: new Date().toISOString(),
                weather: weatherStats,
                calendar: calendarStats,
                events: eventStats,
                system: {
                    status: this.systemStatus,
                    cacheSize: this.systemCache.size,
                    playerLocations: this.playerLocations.size
                }
            };
        } catch (error) {
            this.logger.error('Failed to get system statistics', error);
            throw new ServiceError('Failed to get system statistics', error);
        }
    }
}

export { UnifiedRealtimeSystem };