export default SocialCompetitionService;
export class SocialCompetitionService {
    constructor(accountEconomy: any, socialStore: any);
    accountEconomy: any;
    socialStore: any;
    guildEvents: Map<any, any>;
    guildCache: Map<any, any>;
    friendLeaderboards: Map<any, any>;
    /**
     * Create a guild event.
     * Returns { success, eventId, event }.
     */
    createGuildEvent(guildId: any, eventType: any, { createdBy, nowMs }?: {
        nowMs?: number | undefined;
    }): Promise<{
        success: boolean;
        error: string;
        required?: never;
        current?: never;
        eventId?: never;
        event?: never;
    } | {
        success: boolean;
        error: string;
        required: any;
        current: any;
        eventId?: never;
        event?: never;
    } | {
        success: boolean;
        eventId: string;
        event: {
            participants: any[];
            scores: any;
            id: string;
            guildId: any;
            type: any;
            name: any;
            description: any;
            status: string;
            startMs: number;
            endMs: number;
            minMembers: any;
            rewardMultiplier: any;
            createdBy: any;
            createdAt: number;
            rewardsClaimed: Set<any>;
        };
        error?: never;
        required?: never;
        current?: never;
    }>;
    /**
     * Join a guild event.
     */
    joinGuildEvent(playerId: any, eventId: any, { nowMs }?: {
        nowMs?: number | undefined;
    }): Promise<{
        success: boolean;
        error: string;
        eventId?: never;
        participantCount?: never;
    } | {
        success: boolean;
        eventId: any;
        participantCount: any;
        error?: never;
    }>;
    /**
     * Record a score for a player in a guild event.
     */
    recordEventScore(playerId: any, eventId: any, score: any, { nowMs }?: {
        nowMs?: number | undefined;
    }): Promise<{
        success: boolean;
        error: string;
        eventId?: never;
        score?: never;
        previousScore?: never;
    } | {
        success: boolean;
        eventId: any;
        score: any;
        previousScore: any;
        error?: never;
    }>;
    /**
     * Get guild event standings.
     */
    getEventStandings(eventId: any): {
        eventId: any;
        eventName: any;
        status: any;
        endMs: any;
        participantCount: any;
        standings: {
            playerId: any;
            score: any;
        }[];
    } | null;
    /**
     * End a guild event and distribute rewards.
     */
    endGuildEvent(eventId: any, { nowMs }?: {
        nowMs?: number | undefined;
    }): Promise<{
        success: boolean;
        error: string;
        eventId?: never;
        message?: never;
        standings?: never;
        rewards?: never;
    } | {
        success: boolean;
        eventId: any;
        message: string;
        error?: never;
        standings?: never;
        rewards?: never;
    } | {
        success: boolean;
        eventId: any;
        standings: {
            eventId: any;
            eventName: any;
            status: any;
            endMs: any;
            participantCount: any;
            standings: {
                playerId: any;
                score: any;
            }[];
        };
        rewards: {
            playerId: any;
            rank: number;
            coins: number;
            stars: number;
        }[];
        error?: never;
        message?: never;
    }>;
    /**
     * Get a player's active guild events.
     */
    getPlayerGuildEvents(playerId: any): any[];
    /**
     * Update friend leaderboard score for a player.
     */
    updateFriendScore(playerId: any, score: any, period?: string, { nowMs }?: {
        nowMs?: number | undefined;
    }): {
        playerId: any;
        score: any;
        previous: any;
        period: string;
    };
    /**
     * Get friend leaderboard for a period.
     */
    getFriendLeaderboard(period?: string, limit?: number): {
        period: string;
        entries: {
            rank: number;
            playerId: any;
            score: any;
        }[];
    };
    /**
     * Get social competition stats for admin dashboard.
     */
    getStats(): {
        activeGuildEvents: number;
        totalGuildEvents: number;
        totalParticipants: any;
        leaderboardPeriods: any[];
    };
}
export namespace GUILD_EVENT_TYPES {
    namespace guild_race {
        let name: string;
        let description: string;
        let durationHours: number;
        let minMembers: number;
        let rewardMultiplier: number;
    }
    namespace guild_tournament {
        let name_1: string;
        export { name_1 as name };
        let description_1: string;
        export { description_1 as description };
        let durationHours_1: number;
        export { durationHours_1 as durationHours };
        let minMembers_1: number;
        export { minMembers_1 as minMembers };
        let rewardMultiplier_1: number;
        export { rewardMultiplier_1 as rewardMultiplier };
    }
    namespace collective_goal {
        let name_2: string;
        export { name_2 as name };
        let description_2: string;
        export { description_2 as description };
        let durationHours_2: number;
        export { durationHours_2 as durationHours };
        let minMembers_2: number;
        export { minMembers_2 as minMembers };
        let rewardMultiplier_2: number;
        export { rewardMultiplier_2 as rewardMultiplier };
    }
}
//# sourceMappingURL=social-competition-service.d.ts.map