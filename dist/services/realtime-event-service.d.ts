/**
 * Real-Time Event Service
 * Provides comprehensive event management with real-time updates and notifications
 */
export class RealtimeEventService {
    constructor(io?: null);
    logger: Logger;
    supabase: any;
    weatherService: WeatherService;
    calendarService: RealtimeCalendarService;
    io: any;
    eventCache: Map<any, any>;
    notificationCache: Map<any, any>;
    cacheExpiry: number;
    eventTypes: {
        DAILY_CHALLENGE: {
            type: string;
            duration: number;
            priority: number;
            autoCreate: boolean;
            rewards: {
                coins: number;
                gems: number;
                energy: number;
            };
        };
        WEEKLY_TOURNAMENT: {
            type: string;
            duration: number;
            priority: number;
            autoCreate: boolean;
            rewards: {
                first: {
                    gems: number;
                    coins: number;
                };
                second: {
                    gems: number;
                    coins: number;
                };
                third: {
                    gems: number;
                    coins: number;
                };
            };
        };
        WEATHER_EVENT: {
            type: string;
            duration: number;
            priority: number;
            autoCreate: boolean;
            weatherDependent: boolean;
        };
        SPECIAL_OFFER: {
            type: string;
            duration: number;
            priority: number;
            autoCreate: boolean;
            limitedTime: boolean;
        };
        SEASONAL_EVENT: {
            type: string;
            duration: number;
            priority: number;
            autoCreate: boolean;
            seasonal: boolean;
        };
        LIVE_EVENT: {
            type: string;
            duration: number;
            priority: number;
            autoCreate: boolean;
            realTime: boolean;
        };
    };
    /**
     * Initialize event service
     */
    initializeEventService(): Promise<void>;
    /**
     * Setup event update schedules
     */
    setupEventSchedules(): void;
    /**
     * Initialize real-time notifications
     */
    initializeRealtimeNotifications(): void;
    /**
     * Get active events
     */
    getActiveEvents(timezone?: string, eventTypes?: null): Promise<any>;
    /**
     * Get upcoming events
     */
    getUpcomingEvents(hours?: number, timezone?: string): Promise<any>;
    /**
     * Create a new event
     */
    createEvent(eventData: any): Promise<{
        id: string;
        title: any;
        description: any;
        event_type: any;
        start_time: any;
        end_time: any;
        timezone: any;
        priority: any;
        is_active: boolean;
        is_recurring: any;
        recurrence_pattern: any;
        requirements: any;
        rewards: any;
        metadata: any;
        created_at: string;
        updated_at: string;
    }>;
    /**
     * Update event progress
     */
    updateEventProgress(eventId: any, playerId: any, progressData: any): Promise<{
        event_id: any;
        player_id: any;
        progress_data: any;
        updated_at: string;
    }>;
    /**
     * Complete event for player
     */
    completeEvent(eventId: any, playerId: any): Promise<boolean>;
    /**
     * Check if event is completed
     */
    isEventCompleted(event: any, progressData: any): boolean;
    /**
     * Grant event rewards
     */
    grantEventRewards(event: any, playerId: any): Promise<void>;
    /**
     * Grant reward to player
     */
    grantReward(playerId: any, rewardType: any, amount: any): Promise<void>;
    /**
     * Update all events
     */
    updateAllEvents(): Promise<void>;
    /**
     * Check for new events
     */
    checkForNewEvents(): Promise<void>;
    /**
     * Create daily events
     */
    createDailyEvents(): Promise<void>;
    /**
     * Create weekly events
     */
    createWeeklyEvents(): Promise<void>;
    /**
     * Create seasonal events
     */
    createSeasonalEvents(): Promise<void>;
    /**
     * Generate weather-based events
     */
    generateWeatherEvents(): Promise<void>;
    /**
     * Generate special events
     */
    generateSpecialEvents(): Promise<void>;
    /**
     * Get weather event title
     */
    getWeatherEventTitle(weatherType: any): any;
    /**
     * Get weather event description
     */
    getWeatherEventDescription(weatherType: any): any;
    /**
     * Get weather event rewards
     */
    getWeatherEventRewards(weatherType: any): any;
    /**
     * Clean expired events
     */
    cleanExpiredEvents(): Promise<void>;
    /**
     * Process event for timezone
     */
    processEvent(event: any, timezone: any): {
        id: any;
        title: any;
        description: any;
        eventType: any;
        startTime: any;
        endTime: any;
        timezone: any;
        priority: any;
        isActive: any;
        isRecurring: any;
        requirements: any;
        rewards: any;
        metadata: any;
        createdAt: any;
        updatedAt: any;
        duration: any;
        isOngoing: any;
        isUpcoming: any;
        timeRemaining: any;
    };
    /**
     * Check if event is ongoing
     */
    isEventOngoing(event: any, timezone: any): any;
    /**
     * Check if event is upcoming
     */
    isEventUpcoming(event: any, timezone: any): any;
    /**
     * Get time remaining for event
     */
    getTimeRemaining(event: any, timezone: any): any;
    /**
     * Send event notification
     */
    sendEventNotification(type: any, data: any): void;
    /**
     * Clear event cache
     */
    clearEventCache(): void;
    /**
     * Load cached event data
     */
    loadCachedEventData(): Promise<void>;
    /**
     * Start event updates
     */
    startEventUpdates(): void;
    /**
     * Get event statistics
     */
    getEventStatistics(): Promise<{
        totalEvents: any;
        activeEvents: any;
        eventTypes: {};
        upcomingEvents: number;
        ongoingEvents: number;
        completedEvents: number;
    }>;
}
import { Logger } from '../core/logger/index.js';
import { WeatherService } from './weather-service.js';
import { RealtimeCalendarService } from './realtime-calendar-service.js';
//# sourceMappingURL=realtime-event-service.d.ts.map