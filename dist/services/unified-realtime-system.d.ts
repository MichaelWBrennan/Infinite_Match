/**
 * Unified Real-Time System
 * Connects weather, calendar, and events into a cohesive real-time experience
 */
export class UnifiedRealtimeSystem {
    constructor(io?: null);
    logger: Logger;
    supabase: any;
    weatherService: WeatherService;
    calendarService: RealtimeCalendarService;
    eventService: RealtimeEventService;
    systemCache: Map<any, any>;
    cacheExpiry: number;
    io: any;
    playerLocations: Map<any, any>;
    systemStatus: {
        weather: {
            status: string;
            lastUpdate: null;
        };
        calendar: {
            status: string;
            lastUpdate: null;
        };
        events: {
            status: string;
            lastUpdate: null;
        };
        unified: {
            status: string;
            lastUpdate: null;
        };
    };
    /**
     * Initialize unified real-time system
     */
    initializeUnifiedSystem(): Promise<void>;
    /**
     * Initialize all subsystems
     */
    initializeSubsystems(): Promise<void>;
    /**
     * Setup unified update schedules
     */
    setupUnifiedSchedules(): void;
    /**
     * Initialize real-time notifications
     */
    initializeRealtimeNotifications(): void;
    /**
     * Get unified real-time data for a player
     */
    getPlayerRealtimeData(playerId: any, timezone?: string): Promise<any>;
    /**
     * Get player location
     */
    getPlayerLocation(playerId: any): Promise<any>;
    /**
     * Update player location
     */
    updatePlayerLocation(playerId: any, latitude: any, longitude: any, locationName?: null, timezone?: string): Promise<boolean>;
    /**
     * Get active features based on current conditions
     */
    getActiveFeatures(weatherData: any, gameEvents: any, calendarEvents: any): ({
        type: string;
        name: string;
        description: string;
        multiplier: any;
        icon: string;
        eventType?: never;
        timeRemaining?: never;
    } | {
        type: string;
        name: any;
        description: any;
        eventType: any;
        timeRemaining: any;
        icon: any;
        multiplier?: never;
    })[];
    /**
     * Generate personalized recommendations
     */
    generateRecommendations(weatherData: any, gameEvents: any, calendarEvents: any): ({
        type: string;
        title: string;
        description: string;
        action: string;
        priority: string;
        timeRemaining?: never;
    } | {
        type: string;
        title: string;
        description: any;
        action: string;
        priority: string;
        timeRemaining: any;
    })[];
    /**
     * Get special offers based on current conditions
     */
    getSpecialOffers(weatherData: any, gameEvents: any): ({
        type: string;
        title: string;
        description: string;
        discount: number;
        items: string[];
        expiresIn: number;
        rewards?: never;
        timeRemaining?: never;
    } | {
        type: string;
        title: any;
        description: any;
        rewards: any;
        timeRemaining: any;
        discount?: never;
        items?: never;
        expiresIn?: never;
    })[];
    /**
     * Get time-based content
     */
    getTimeBasedContent(timezone: any): {
        timeOfDay: string;
        dayType: string;
        specialDay: any;
        recommendations: never[];
    };
    /**
     * Get time of day category
     */
    getTimeOfDay(hour: any): "morning" | "afternoon" | "evening" | "night";
    /**
     * Get day type
     */
    getDayType(dayOfWeek: any): "weekend" | "weekday";
    /**
     * Get special day
     */
    getSpecialDay(dayOfMonth: any): any;
    /**
     * Get event icon
     */
    getEventIcon(eventType: any): any;
    /**
     * Get calendar icon
     */
    getCalendarIcon(eventType: any): any;
    /**
     * Update unified system
     */
    updateUnifiedSystem(): Promise<void>;
    /**
     * Generate weather-based content
     */
    generateWeatherBasedContent(): Promise<void>;
    /**
     * Update player experiences
     */
    updatePlayerExperiences(): Promise<void>;
    /**
     * Perform system health check
     */
    performHealthCheck(): Promise<void>;
    /**
     * Check weather service health
     */
    checkWeatherHealth(): Promise<{
        status: string;
        lastUpdate: null;
        totalUpdates: any;
        error?: never;
    } | {
        status: string;
        error: any;
        lastUpdate?: never;
        totalUpdates?: never;
    }>;
    /**
     * Check calendar service health
     */
    checkCalendarHealth(): Promise<{
        status: string;
        totalEvents: any;
        activeEvents: any;
        error?: never;
    } | {
        status: string;
        error: any;
        totalEvents?: never;
        activeEvents?: never;
    }>;
    /**
     * Check event service health
     */
    checkEventHealth(): Promise<{
        status: string;
        totalEvents: any;
        activeEvents: any;
        error?: never;
    } | {
        status: string;
        error: any;
        totalEvents?: never;
        activeEvents?: never;
    }>;
    /**
     * Generate dynamic content
     */
    generateDynamicContent(): Promise<void>;
    /**
     * Generate dynamic calendar events
     */
    generateDynamicCalendarEvents(): Promise<void>;
    /**
     * Send system notification
     */
    sendSystemNotification(type: any, data: any): void;
    /**
     * Send player notification
     */
    sendPlayerNotification(playerId: any, type: any, data: any): void;
    /**
     * Clear player cache
     */
    clearPlayerCache(playerId: any): void;
    /**
     * Load system data
     */
    loadSystemData(): Promise<void>;
    /**
     * Start unified updates
     */
    startUnifiedUpdates(): void;
    /**
     * Get system statistics
     */
    getSystemStatistics(): Promise<{
        timestamp: string;
        weather: {
            totalUpdates: any;
            weatherTypes: {};
            averageTemperature: number;
            lastUpdate: null;
        };
        calendar: {
            totalEvents: any;
            activeEvents: any;
            eventTypes: {};
            upcomingEvents: number;
            ongoingEvents: number;
        };
        events: {
            totalEvents: any;
            activeEvents: any;
            eventTypes: {};
            upcomingEvents: number;
            ongoingEvents: number;
            completedEvents: number;
        };
        system: {
            status: {
                weather: {
                    status: string;
                    lastUpdate: null;
                };
                calendar: {
                    status: string;
                    lastUpdate: null;
                };
                events: {
                    status: string;
                    lastUpdate: null;
                };
                unified: {
                    status: string;
                    lastUpdate: null;
                };
            };
            cacheSize: number;
            playerLocations: number;
        };
    }>;
}
import { Logger } from '../core/logger/index.js';
import { WeatherService } from './weather-service.js';
import { RealtimeCalendarService } from './realtime-calendar-service.js';
import { RealtimeEventService } from './realtime-event-service.js';
//# sourceMappingURL=unified-realtime-system.d.ts.map