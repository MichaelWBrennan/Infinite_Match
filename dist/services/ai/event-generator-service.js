/**
 * Event Generator Service - AI-generated live events.
 * Produces rotating live events (themes, mechanics, prizes, schedules).
 * Events are server-authoritative with bounded history to prevent leaks.
 */
import { Logger } from '../../core/logger/index.js';
import { AIContentGenerator } from '../ai-content-generator.js';
import { AIPersonalizationEngine } from '../ai-personalization-engine.js';
import { InfiniteContentPipeline } from '../infinite-content-pipeline.js';
const logger = new Logger('EventGeneratorService');
const EVENT_DURATIONS_MS = {
    flash: 2 * 60 * 60 * 1000,
    daily: 24 * 60 * 60 * 1000,
    weekend: 3 * 24 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000,
};
const EVENT_THEMES = [
    'Spring Bloom', 'Summer Splash', 'Autumn Harvest', 'Winter Wonderland',
    'Neon Nights', 'Jungle Adventure', 'Desert Mirage', 'Ocean Depths',
    'Candy Kingdom', 'Mystic Forest', 'Space Odyssey', 'Retro Arcade',
];
const EVENT_MECHANICS = [
    'Double Coins', 'Extra Moves', 'Booster Drop', 'Score Multiplier',
    'Time Attack', 'Star Rush', 'Color Cascade', 'Life Bonus',
];
const MAX_ACTIVE_EVENTS = 200;
const MAX_EVENT_HISTORY = 100;
const MAX_LEADERBOARD_SIZE = 100;
/**
 * EventGeneratorService - generates and manages AI live events.
 */
export class EventGeneratorService {
    constructor(contentGenerator = null, personalizationEngine = null, contentPipeline = null) {
        this.logger = new Logger('EventGeneratorService');
        this.contentGenerator = contentGenerator || new AIContentGenerator();
        this.personalizationEngine = personalizationEngine || new AIPersonalizationEngine();
        this.contentPipeline = contentPipeline || new InfiniteContentPipeline();
        this.activeEvents = new Map(); // eventId -> event
        this.eventById = new Map(); // eventId -> event (O(1) lookup across active + history)
        this.eventHistory = []; // past events (bounded)
        this.generationSchedule = null;
    }
    /**
     * Generate a new AI live event.
     * theme - optional theme override
     * durationKey - 'flash' | 'daily' | 'weekend' | 'weekly'
     * nowMs - reference time (default: now)
     */
    async generateEvent({ theme = null, durationKey = 'daily', nowMs = Date.now() } = {}) {
        const themeName = theme || EVENT_THEMES[Math.floor(Math.random() * EVENT_THEMES.length)];
        const mechanics = EVENT_MECHANICS[Math.floor(Math.random() * EVENT_MECHANICS.length)];
        const durationMs = EVENT_DURATIONS_MS[durationKey] ?? EVENT_DURATIONS_MS.daily;
        let aiContent = null;
        try {
            aiContent = await this.contentGenerator.generatePlatformContent('live_event', 'webgl', {
                theme: themeName,
                mechanic: mechanics,
                durationHours: durationMs / (1000 * 60 * 60),
                targetAudience: 'casual_match3_players',
            });
        }
        catch (error) {
            logger.warn('AI content generation unavailable, using template fallback', {
                error: error.message,
            });
        }
        const eventId = `event-${themeName.toLowerCase().replace(/\s+/g, '-')}-${Math.floor(nowMs / 1000)}`;
        const startsAt = nowMs;
        const endsAt = nowMs + durationMs;
        const event = {
            id: eventId,
            name: `${themeName} ${this.capitalize(mechanics)} Event`,
            theme: themeName,
            mechanic: mechanics,
            type: 'live_event',
            status: 'scheduled', // scheduled -> active -> completed
            startsAt,
            endsAt,
            durationHours: durationMs / (1000 * 60 * 60),
            aiGenerated: !!aiContent,
            aiContent,
            prizes: this.generatePrizes(themeName, mechanics),
            rules: this.generateRules(mechanics),
            leaderboardEnabled: durationKey !== 'flash',
            playerCount: 0,
            generatedAt: nowMs,
            leaderboard: [], // array of {playerId, score, verified, recordedAt}
            leaderboardIndex: new Map(), // playerId -> index in leaderboard array
        };
        logger.info('Generated AI live event', { eventId, theme: themeName, mechanic: mechanics, durationKey });
        return event;
    }
    /**
     * Activate an event (move from scheduled to active).
     */
    activateEvent(eventId, { nowMs = Date.now() } = {}) {
        const event = this.activeEvents.get(eventId);
        if (!event) {
            throw new Error(`Event ${eventId} not found`);
        }
        if (nowMs < event.startsAt) {
            throw new Error(`Event ${eventId} not yet started`);
        }
        event.status = 'active';
        event.activatedAt = nowMs;
        logger.info('Activated live event', { eventId });
        return event;
    }
    /**
     * Get all events that are active at nowMs.
     * Cleans up expired events and bounds history size.
     */
    getActiveEvents({ nowMs = Date.now() } = {}) {
        const active = [];
        const toDelete = [];
        for (const [id, event] of this.activeEvents) {
            // Scheduled but already ended -> mark completed without activating
            if (event.status === 'scheduled' && nowMs >= event.endsAt) {
                event.status = 'completed';
                event.completedAt = nowMs;
                this.eventHistory.push(event);
                this.eventById.set(event.id, event);
                toDelete.push(id);
                continue;
            }
            if (event.status === 'scheduled' && nowMs >= event.startsAt && nowMs < event.endsAt) {
                event.status = 'active';
                event.activatedAt = nowMs;
            }
            if (event.status === 'active' && nowMs >= event.startsAt && nowMs < event.endsAt) {
                active.push(event);
            }
            if (event.status === 'active' && nowMs >= event.endsAt) {
                event.status = 'completed';
                event.completedAt = nowMs;
                this.eventHistory.push(event);
                this.eventById.set(event.id, event);
                toDelete.push(id);
            }
        }
        // Remove completed events from active map
        for (const id of toDelete) {
            this.activeEvents.delete(id);
        }
        // Bound event history to prevent memory leaks
        if (this.eventHistory.length > MAX_EVENT_HISTORY) {
            this.eventHistory = this.eventHistory.slice(-MAX_EVENT_HISTORY);
        }
        // Bound active events count
        if (this.activeEvents.size > MAX_ACTIVE_EVENTS) {
            const oldest = Array.from(this.activeEvents.entries())
                .sort((a, b) => a[1].startsAt - b[1].startsAt)
                .slice(0, this.activeEvents.size - MAX_ACTIVE_EVENTS);
            for (const [id] of oldest) {
                this.activeEvents.delete(id);
            }
        }
        return active.sort((a, b) => a.endsAt - b.endsAt);
    }
    /**
     * Get a specific event by ID.
     * O(1) lookup across active and history.
     */
    getEvent(eventId) {
        return this.activeEvents.get(eventId) || this.eventById.get(eventId);
    }
    /**
     * Schedule a rotating series of events.
     * Creates one event per interval starting at startMs.
     */
    async scheduleEvents({ startMs = Date.now(), intervalMs = 24 * 60 * 60 * 1000, count = 7 } = {}) {
        const events = [];
        let current = startMs;
        for (let i = 0; i < count; i++) {
            const durationKey = i % 3 === 0 ? 'flash' : i % 7 === 0 ? 'weekend' : 'daily';
            const event = await this.generateEvent({ durationKey, nowMs: current });
            event.status = 'scheduled';
            this.activeEvents.set(event.id, event);
            events.push(event);
            current += intervalMs;
        }
        logger.info('Scheduled event series', { count, startMs, intervalMs });
        return events;
    }
    /**
     * Record a player joining an event.
     */
    recordPlayerJoin(eventId, playerId) {
        const event = this.activeEvents.get(eventId);
        if (event) {
            event.playerCount = (event.playerCount || 0) + 1;
            return true;
        }
        return false;
    }
    /**
     * Record a player's score in an event leaderboard.
     * O(1) player lookup via leaderboardIndex Map.
     * Leaderboard kept sorted by inserting at correct position.
     */
    recordEventScore(eventId, playerId, score, { verified = false, nowMs = Date.now() } = {}) {
        const event = this.activeEvents.get(eventId);
        if (!event || event.status !== 'active') {
            return { success: false, reason: 'Event not active' };
        }
        if (!event.leaderboard) {
            event.leaderboard = [];
            event.leaderboardIndex = new Map();
        }
        const idx = event.leaderboardIndex.get(playerId);
        if (idx !== undefined) {
            const existing = event.leaderboard[idx];
            if (score > existing.score) {
                existing.score = score;
                existing.verified = verified;
                existing.recordedAt = nowMs;
                this._reinsertSorted(event.leaderboard, idx);
            }
        }
        else {
            const entry = { playerId, score, verified, recordedAt: nowMs };
            // Insert at correct sorted position (descending by score)
            let insertPos = 0;
            while (insertPos < event.leaderboard.length && event.leaderboard[insertPos].score > score) {
                insertPos++;
            }
            event.leaderboard.splice(insertPos, 0, entry);
            event.leaderboardIndex.set(playerId, insertPos);
            // Rebuild index after splice (positions changed)
            this._rebuildLeaderboardIndex(event);
            // Bound leaderboard size
            if (event.leaderboard.length > MAX_LEADERBOARD_SIZE) {
                const removed = event.leaderboard.pop();
                event.leaderboardIndex.delete(removed.playerId);
                this._rebuildLeaderboardIndex(event);
            }
        }
        return { success: true, leaderboard: event.leaderboard };
    }
    /**
     * Re-insert an element at its correct sorted position after a score update.
     */
    _reinsertSorted(leaderboard, fromIdx) {
        const entry = leaderboard.splice(fromIdx, 1)[0];
        let insertPos = 0;
        while (insertPos < leaderboard.length && leaderboard[insertPos].score > entry.score) {
            insertPos++;
        }
        leaderboard.splice(insertPos, 0, entry);
    }
    /**
     * Rebuild the leaderboardIndex map after array mutations.
     */
    _rebuildLeaderboardIndex(event) {
        event.leaderboardIndex.clear();
        for (let i = 0; i < event.leaderboard.length; i++) {
            event.leaderboardIndex.set(event.leaderboard[i].playerId, i);
        }
    }
    generatePrizes(theme, mechanic) {
        const base = { coins: 500, lives: 1 };
        if (mechanic === 'Double Coins')
            base.coins *= 2;
        if (mechanic === 'Life Bonus')
            base.lives += 2;
        if (mechanic === 'Booster Drop')
            base.boosters = { colorBomb: 2, hammer: 2 };
        if (mechanic === 'Star Rush')
            base.stars = 3;
        return base;
    }
    generateRules(mechanic) {
        const rules = {
            'Double Coins': 'Earn 2x coins on every level completed during the event.',
            'Extra Moves': 'All levels grant +5 extra moves.',
            'Booster Drop': 'Boosters drop more frequently from matches.',
            'Score Multiplier': 'All scores are multiplied by 1.5x.',
            'Time Attack': 'Complete levels as fast as possible for bonus points.',
            'Star Rush': 'Earn bonus stars for 3-star completions.',
            'Color Cascade': 'Cascading matches trigger chain bonuses.',
            'Life Bonus': 'Bonus lives awarded for level completion.',
        };
        return { description: rules[mechanic] || 'Complete levels to earn event rewards.', mechanic };
    }
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    /**
     * Clear all events and caches (testing / memory pressure).
     */
    clearCache() {
        this.activeEvents.clear();
        this.eventById.clear();
        this.eventHistory = [];
    }
}
export default EventGeneratorService;
//# sourceMappingURL=event-generator-service.js.map