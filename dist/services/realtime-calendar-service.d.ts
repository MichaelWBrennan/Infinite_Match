/**
 * Real-Time Calendar Service
 * Provides comprehensive calendar management with timezone support and real-time updates
 */
export class RealtimeCalendarService {
    logger: Logger;
    supabase: {
        from(table: any): {
            select(columns: any): {
                select(columns?: string): /*elided*/ any;
                eq: (column: any, value: any) => /*elided*/ any;
                neq: (column: any, value: any) => /*elided*/ any;
                gt: (column: any, value: any) => /*elided*/ any;
                gte: (column: any, value: any) => /*elided*/ any;
                lt: (column: any, value: any) => /*elided*/ any;
                lte: (column: any, value: any) => /*elided*/ any;
                in(column: any, values: any): /*elided*/ any;
                match(filterObject: any): /*elided*/ any;
                order(column: any, options?: {}): /*elided*/ any;
                limit(count: any): /*elided*/ any;
                single(): /*elided*/ any;
                then(onFulfilled: any, onRejected: any): Promise<{
                    data: null;
                    error: {
                        message: any;
                        code: any;
                        details: any;
                    };
                } | {
                    data: any;
                    error: null;
                }>;
                catch(onRejected: any): Promise<{
                    data: null;
                    error: {
                        message: any;
                        code: any;
                        details: any;
                    };
                } | {
                    data: any;
                    error: null;
                }>;
            };
            insert(rows: any): {
                select(columns?: string): /*elided*/ any;
                eq: (column: any, value: any) => /*elided*/ any;
                neq: (column: any, value: any) => /*elided*/ any;
                gt: (column: any, value: any) => /*elided*/ any;
                gte: (column: any, value: any) => /*elided*/ any;
                lt: (column: any, value: any) => /*elided*/ any;
                lte: (column: any, value: any) => /*elided*/ any;
                in(column: any, values: any): /*elided*/ any;
                match(filterObject: any): /*elided*/ any;
                order(column: any, options?: {}): /*elided*/ any;
                limit(count: any): /*elided*/ any;
                single(): /*elided*/ any;
                then(onFulfilled: any, onRejected: any): Promise<{
                    data: null;
                    error: {
                        message: any;
                        code: any;
                        details: any;
                    };
                } | {
                    data: any;
                    error: null;
                }>;
                catch(onRejected: any): Promise<{
                    data: null;
                    error: {
                        message: any;
                        code: any;
                        details: any;
                    };
                } | {
                    data: any;
                    error: null;
                }>;
            };
            upsert(rows: any, options?: {}): {
                select(columns?: string): /*elided*/ any;
                eq: (column: any, value: any) => /*elided*/ any;
                neq: (column: any, value: any) => /*elided*/ any;
                gt: (column: any, value: any) => /*elided*/ any;
                gte: (column: any, value: any) => /*elided*/ any;
                lt: (column: any, value: any) => /*elided*/ any;
                lte: (column: any, value: any) => /*elided*/ any;
                in(column: any, values: any): /*elided*/ any;
                match(filterObject: any): /*elided*/ any;
                order(column: any, options?: {}): /*elided*/ any;
                limit(count: any): /*elided*/ any;
                single(): /*elided*/ any;
                then(onFulfilled: any, onRejected: any): Promise<{
                    data: null;
                    error: {
                        message: any;
                        code: any;
                        details: any;
                    };
                } | {
                    data: any;
                    error: null;
                }>;
                catch(onRejected: any): Promise<{
                    data: null;
                    error: {
                        message: any;
                        code: any;
                        details: any;
                    };
                } | {
                    data: any;
                    error: null;
                }>;
            };
            update(patch: any): {
                select(columns?: string): /*elided*/ any;
                eq: (column: any, value: any) => /*elided*/ any;
                neq: (column: any, value: any) => /*elided*/ any;
                gt: (column: any, value: any) => /*elided*/ any;
                gte: (column: any, value: any) => /*elided*/ any;
                lt: (column: any, value: any) => /*elided*/ any;
                lte: (column: any, value: any) => /*elided*/ any;
                in(column: any, values: any): /*elided*/ any;
                match(filterObject: any): /*elided*/ any;
                order(column: any, options?: {}): /*elided*/ any;
                limit(count: any): /*elided*/ any;
                single(): /*elided*/ any;
                then(onFulfilled: any, onRejected: any): Promise<{
                    data: null;
                    error: {
                        message: any;
                        code: any;
                        details: any;
                    };
                } | {
                    data: any;
                    error: null;
                }>;
                catch(onRejected: any): Promise<{
                    data: null;
                    error: {
                        message: any;
                        code: any;
                        details: any;
                    };
                } | {
                    data: any;
                    error: null;
                }>;
            };
            delete(): {
                select(columns?: string): /*elided*/ any;
                eq: (column: any, value: any) => /*elided*/ any;
                neq: (column: any, value: any) => /*elided*/ any;
                gt: (column: any, value: any) => /*elided*/ any;
                gte: (column: any, value: any) => /*elided*/ any;
                lt: (column: any, value: any) => /*elided*/ any;
                lte: (column: any, value: any) => /*elided*/ any;
                in(column: any, values: any): /*elided*/ any;
                match(filterObject: any): /*elided*/ any;
                order(column: any, options?: {}): /*elided*/ any;
                limit(count: any): /*elided*/ any;
                single(): /*elided*/ any;
                then(onFulfilled: any, onRejected: any): Promise<{
                    data: null;
                    error: {
                        message: any;
                        code: any;
                        details: any;
                    };
                } | {
                    data: any;
                    error: null;
                }>;
                catch(onRejected: any): Promise<{
                    data: null;
                    error: {
                        message: any;
                        code: any;
                        details: any;
                    };
                } | {
                    data: any;
                    error: null;
                }>;
            };
        };
    } | (() => never);
    timezone: string;
    calendarCache: Map<any, any>;
    eventCache: Map<any, any>;
    cacheExpiry: number;
    supportedTimezones: string[];
    eventTypes: {
        GAME_EVENT: string;
        WEATHER_EVENT: string;
        MAINTENANCE: string;
        SPECIAL_OFFER: string;
        TOURNAMENT: string;
        SEASONAL: string;
        DAILY_RESET: string;
        WEEKLY_RESET: string;
        MONTHLY_RESET: string;
    };
    /**
     * Initialize calendar service
     */
    initializeCalendarService(): Promise<void>;
    /**
     * Setup calendar update schedules
     */
    setupCalendarSchedules(): void;
    /**
     * Initialize timezone handling
     */
    initializeTimezoneHandling(): void;
    /**
     * Get current time in specified timezone
     */
    getCurrentTime(timezone?: string): import("dayjs").Dayjs;
    /**
     * Convert time to timezone
     */
    convertToTimezone(time: any, fromTimezone: any, toTimezone: any): import("dayjs").Dayjs;
    /**
     * Get calendar events for a date range
     */
    getCalendarEvents(startDate: any, endDate: any, timezone?: string, eventTypes?: null): Promise<any>;
    /**
     * Get events happening now
     */
    getCurrentEvents(timezone?: string): Promise<any>;
    /**
     * Get upcoming events
     */
    getUpcomingEvents(hours?: number, timezone?: string): Promise<any>;
    /**
     * Create a new calendar event
     */
    createCalendarEvent(eventData: any): Promise<{
        id: string;
        title: any;
        description: any;
        event_type: any;
        start_time: string;
        end_time: string;
        timezone: any;
        is_recurring: any;
        recurrence_pattern: any;
        priority: any;
        is_active: boolean;
        metadata: any;
        created_at: string;
        updated_at: string;
    }>;
    /**
     * Update calendar event
     */
    updateCalendarEvent(eventId: any, updateData: any): Promise<any>;
    /**
     * Delete calendar event
     */
    deleteCalendarEvent(eventId: any): Promise<boolean>;
    /**
     * Process calendar event for timezone conversion
     */
    processCalendarEvent(event: any, targetTimezone: any): {
        id: any;
        title: any;
        description: any;
        eventType: any;
        startTime: string;
        endTime: string;
        timezone: any;
        isRecurring: any;
        recurrencePattern: any;
        priority: any;
        isActive: any;
        metadata: any;
        createdAt: any;
        updatedAt: any;
        duration: number;
        isOngoing: any;
        isUpcoming: boolean;
        isExpired: boolean;
    };
    /**
     * Check if event is currently ongoing
     */
    isEventOngoing(event: any, timezone: any): any;
    /**
     * Check if event is upcoming
     */
    isEventUpcoming(event: any, timezone: any): boolean;
    /**
     * Check if event is expired
     */
    isEventExpired(event: any, timezone: any): boolean;
    /**
     * Update calendar events (called by cron)
     */
    updateCalendarEvents(): Promise<void>;
    /**
     * Process recurring events
     */
    processRecurringEvent(event: any): Promise<void>;
    /**
     * Handle daily reset
     */
    handleDailyReset(): Promise<void>;
    /**
     * Handle weekly reset
     */
    handleWeeklyReset(): Promise<void>;
    /**
     * Handle monthly reset
     */
    handleMonthlyReset(): Promise<void>;
    /**
     * Clean expired events
     */
    cleanExpiredEvents(): Promise<void>;
    /**
     * Clear event cache
     */
    clearEventCache(): void;
    /**
     * Load cached calendar data
     */
    loadCachedCalendarData(): Promise<void>;
    /**
     * Start calendar updates
     */
    startCalendarUpdates(): void;
    /**
     * Get calendar statistics
     */
    getCalendarStatistics(): Promise<{
        totalEvents: any;
        activeEvents: any;
        eventTypes: {};
        upcomingEvents: number;
        ongoingEvents: number;
    }>;
    /**
     * Trigger daily reset logic
     */
    triggerDailyReset(): Promise<void>;
    /**
     * Trigger weekly reset logic
     */
    triggerWeeklyReset(): Promise<void>;
    /**
     * Trigger monthly reset logic
     */
    triggerMonthlyReset(): Promise<void>;
}
import { Logger } from '../core/logger/index.js';
//# sourceMappingURL=realtime-calendar-service.d.ts.map