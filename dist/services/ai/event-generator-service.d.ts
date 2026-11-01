/**
 * EventGeneratorService - generates and manages AI live events.
 */
export class EventGeneratorService {
    constructor(contentGenerator?: null, personalizationEngine?: null, contentPipeline?: null);
    logger: Logger;
    contentGenerator: AIContentGenerator;
    personalizationEngine: AIPersonalizationEngine;
    contentPipeline: InfiniteContentPipeline;
    activeEvents: Map<any, any>;
    eventById: Map<any, any>;
    eventHistory: any[];
    generationSchedule: any;
    /**
     * Generate a new AI live event.
     * theme - optional theme override
     * durationKey - 'flash' | 'daily' | 'weekend' | 'weekly'
     * nowMs - reference time (default: now)
     */
    generateEvent({ theme, durationKey, nowMs }?: {
        theme?: null | undefined;
        durationKey?: string | undefined;
        nowMs?: number | undefined;
    }): Promise<{
        id: string;
        name: string;
        theme: string | undefined;
        mechanic: string | undefined;
        type: string;
        status: string;
        startsAt: number;
        endsAt: any;
        durationHours: number;
        aiGenerated: boolean;
        aiContent: any;
        prizes: {
            coins: number;
            lives: number;
        };
        rules: {
            description: any;
            mechanic: any;
        };
        leaderboardEnabled: boolean;
        playerCount: number;
        generatedAt: number;
        leaderboard: never[];
        leaderboardIndex: Map<any, any>;
    }>;
    /**
     * Activate an event (move from scheduled to active).
     */
    activateEvent(eventId: any, { nowMs }?: {
        nowMs?: number | undefined;
    }): any;
    /**
     * Get all events that are active at nowMs.
     * Cleans up expired events and bounds history size.
     */
    getActiveEvents({ nowMs }?: {
        nowMs?: number | undefined;
    }): any[];
    /**
     * Get a specific event by ID.
     * O(1) lookup across active and history.
     */
    getEvent(eventId: any): any;
    /**
     * Schedule a rotating series of events.
     * Creates one event per interval starting at startMs.
     */
    scheduleEvents({ startMs, intervalMs, count }?: {
        startMs?: number | undefined;
        intervalMs?: number | undefined;
        count?: number | undefined;
    }): Promise<{
        id: string;
        name: string;
        theme: string | undefined;
        mechanic: string | undefined;
        type: string;
        status: string;
        startsAt: number;
        endsAt: any;
        durationHours: number;
        aiGenerated: boolean;
        aiContent: any;
        prizes: {
            coins: number;
            lives: number;
        };
        rules: {
            description: any;
            mechanic: any;
        };
        leaderboardEnabled: boolean;
        playerCount: number;
        generatedAt: number;
        leaderboard: never[];
        leaderboardIndex: Map<any, any>;
    }[]>;
    /**
     * Record a player joining an event.
     */
    recordPlayerJoin(eventId: any, playerId: any): boolean;
    /**
     * Record a player's score in an event leaderboard.
     * O(1) player lookup via leaderboardIndex Map.
     * Leaderboard kept sorted by inserting at correct position.
     */
    recordEventScore(eventId: any, playerId: any, score: any, { verified, nowMs }?: {
        verified?: boolean | undefined;
        nowMs?: number | undefined;
    }): {
        success: boolean;
        reason: string;
        leaderboard?: never;
    } | {
        success: boolean;
        leaderboard: any;
        reason?: never;
    };
    /**
     * Re-insert an element at its correct sorted position after a score update.
     */
    _reinsertSorted(leaderboard: any, fromIdx: any): void;
    /**
     * Rebuild the leaderboardIndex map after array mutations.
     */
    _rebuildLeaderboardIndex(event: any): void;
    generatePrizes(theme: any, mechanic: any): {
        coins: number;
        lives: number;
    };
    generateRules(mechanic: any): {
        description: any;
        mechanic: any;
    };
    capitalize(str: any): any;
    /**
     * Clear all events and caches (testing / memory pressure).
     */
    clearCache(): void;
}
export default EventGeneratorService;
import { Logger } from '../../core/logger/index.js';
import { AIContentGenerator } from '../ai-content-generator.js';
import { AIPersonalizationEngine } from '../ai-personalization-engine.js';
import { InfiniteContentPipeline } from '../infinite-content-pipeline.js';
//# sourceMappingURL=event-generator-service.d.ts.map