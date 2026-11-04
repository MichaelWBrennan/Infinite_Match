export default EventCalendarService;
export class EventCalendarService {
    constructor(accountEconomy: any);
    accountEconomy: any;
    eventCalendar: Map<any, any>;
    scheduledEvents: Map<any, any>;
    playerReminders: Map<any, any>;
    advanceNotifyHistory: Map<any, any>;
    /**
     * Initialize the default event calendar.
     */
    initializeDefaultCalendar(): void;
    /**
     * Compute the next occurrence time for a recurring event.
     */
    computeNextOccurrence(event: any, fromMs?: number): number;
    /**
     * Get the upcoming events calendar (next 30 days).
     */
    getUpcomingEvents(fromMs?: number, days?: number): any[];
    /**
     * Get events starting soon (within the next 24 hours) for advance notifications.
     */
    getEventsStartingSoon(fromMs?: number, windowMs?: number): any[];
    /**
     * Register a player's interest in an event (they want reminders).
     */
    registerReminder(playerId: any, eventId: any): void;
    /**
     * Unregister a player's interest in an event.
     */
    unregisterReminder(playerId: any, eventId: any): void;
    /**
     * Get a player's event reminders.
     */
    getPlayerReminders(playerId: any): any[];
    /**
     * Send advance notifications for events starting soon.
     * Called by the scheduler before each event.
     */
    sendAdvanceNotifications(playerEconomies: any, fromMs?: number): Promise<{
        sent: number;
        notifications: {
            playerId: any;
            eventId: any;
            notifyHours: any;
        }[];
    }>;
    /**
     * Get target players for an event (players who have opted in or are active).
     */
    getTargetPlayersForEvent(event: any, playerEconomies: any): any[];
    /**
     * Schedule a one-time special event.
     */
    scheduleSpecialEvent(eventData: any, { nowMs }?: {
        nowMs?: number | undefined;
    }): string;
    /**
     * Get all scheduled special events.
     */
    getScheduledEvents(): any[];
    /**
     * Get calendar stats for admin dashboard.
     */
    getStats(): {
        totalEvents: number;
        upcomingEvents: number;
        activeSpecialEvents: number;
        totalPlayerReminders: any;
    };
}
/**
 * Default event calendar. These are recurring events that players can expect.
 */
export const DEFAULT_EVENT_CALENDAR: ({
    id: string;
    name: string;
    type: string;
    recurrence: string;
    dayOfWeek: number;
    startHour: number;
    durationHours: number;
    description: string;
    advanceNotify: number[];
} | {
    id: string;
    name: string;
    type: string;
    recurrence: string;
    startHour: number;
    durationHours: number;
    description: string;
    advanceNotify: number[];
    dayOfWeek?: never;
})[];
//# sourceMappingURL=event-calendar-service.d.ts.map