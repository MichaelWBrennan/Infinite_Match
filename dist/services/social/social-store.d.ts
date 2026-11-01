export function socialStoreFile(): string;
/** Energy gifts (S2): one friend gives one energy to another. Limits are per UTC day. */
export const ENERGY_GIFT_AMOUNT: 1;
/** Booster gifts (S2): one friend gives one booster to another. Limits are per UTC day,
 * separate from energy. Boosters are more valuable, so the daily cap is lower. */
export const BOOSTER_GIFT_AMOUNT: 1;
export const GIFT_DAILY_LIMIT: 3;
export const BOOSTER_GIFT_DAILY_LIMIT: 1;
/** Valid gift types: energy (life) and booster. */
export const GIFT_TYPES: string[];
/** Guild milestone (S3): verified classic/daily wins by a guild's members in one UTC week (Monday start). */
export const MILESTONE_GOAL: 50;
export const MILESTONE_REWARD_COINS: 25;
export const MAX_FRIENDS: 50;
export const MAX_GUILD_MEMBERS: 30;
export const NAME_PATTERN: RegExp;
export class SocialError extends Error {
    constructor(code: any);
    code: any;
}
export class SocialStore {
    /** file: JSON path for the file store. backend: a shared store (MongoSocialBackend), which replaces the file. */
    constructor(file?: null, backend?: null);
    file: any;
    backend: any;
    data: any;
    queue: Promise<void>;
    /** Shared store: read the current revision on every call, so another server's writes are seen. */
    loadShared(): Promise<{
        data: any;
        revision: any;
    }>;
    path(): any;
    load(): Promise<void>;
    persist(data: any): Promise<void>;
    /** Runs fn on a copy of the data, saves it, and only then replaces the data. Serialised. */
    write(fn: any): Promise<any>;
    /** Shared store write: reload, apply fn to a draft, save only if no other server wrote in between. */
    writeShared(fn: any): Promise<any>;
    /** Runs fn on the current data without changing it. Waits for pending writes first. */
    read(fn: any): Promise<any>;
    /** The player's own profile, with their friend code. Creates the profile on first use. */
    profile(playerId: any): Promise<any>;
    setName(playerId: any, name: any): Promise<any>;
    requestFriend(playerId: any, rawCode: any): Promise<any>;
    acceptIn(d: any, playerId: any, fromId: any): {
        status: string;
        label: any;
    };
    acceptFriend(playerId: any, fromId: any): Promise<any>;
    declineFriend(playerId: any, fromId: any): Promise<any>;
    removeFriend(playerId: any, friendId: any): Promise<any>;
    /** Friends and incoming requests. Ids are included only for the player's own list. */
    /**
     * Records a gift (energy or booster) before it is credited. Checks: friends only, not to yourself,
     * the sender's and the receiver's daily limits. A repeated giftId from the same pair returns the
     * same gift and counts nothing new, so a retry after a lost response is safe.
     *
     * giftType: 'energy' (default) or 'booster'. When 'booster', boosterId must be a valid booster id.
     * Energy and boosters share the same daily limit counters (3 per day per sender/receiver).
     */
    reserveEnergyGift(senderId: any, receiverId: any, giftId: any, nowMs?: number, giftType?: string, boosterId?: null): Promise<any>;
    /** Marks a gift as credited with the amount actually added (0 when the receiver was full). */
    markEnergyGiftCredited(giftId: any, credited: any): Promise<any>;
    /**
     * Counts one verified classic/daily win toward the player's guild milestone for this UTC week.
     * Only a server-verified win counts (`verified === true`), once per attempt: a retried completion
     * with the same attempt id does not count again. A player outside a guild counts for nothing.
     */
    recordMilestoneWin(playerId: any, attemptId: any, verified: any, nowMs?: number): Promise<any>;
    /** The player's view of this week's guild milestone. Read-only; guests and guildless players get no progress. */
    milestoneView(playerId: any, nowMs?: number): Promise<any>;
    /**
     * Checks that the player may claim this week's milestone reward. Read-only, so the caller can
     * grant the coins (idempotent per milestone in the economy) and then call markMilestoneClaimed.
     * Must be in the guild now; a member who left gets nothing new. Claims are limited to this UTC week.
     */
    milestoneClaim(playerId: any, nowMs?: number): Promise<any>;
    /** Records that the player's reward for this milestone was granted. Idempotent. */
    markMilestoneClaimed(key: any, playerId: any, nowMs?: number): Promise<any>;
    friends(playerId: any): Promise<any>;
    /** Best scores for the player and their friends. Labels only, no ids. */
    friendBoard(playerId: any): Promise<any>;
    /** Create a friend challenge. Returns the challenge id. */
    createFriendChallenge(fromId: any, toId: any, gameType?: string, targetScore?: number): Promise<any>;
    /** Accept a friend challenge. Only the challenged player can accept. */
    acceptFriendChallenge(playerId: any, challengeId: any): Promise<any>;
    /** Decline a friend challenge. Only the challenged player can decline. */
    declineFriendChallenge(playerId: any, challengeId: any): Promise<any>;
    /** Get pending friend challenges for a player (invites they received). */
    getPendingFriendChallenges(playerId: any): Promise<any>;
    /** Get all friend challenges involving a player (sent and received). */
    getFriendChallenges(playerId: any): Promise<any>;
    /** Report the result of a completed friend challenge. Only participants can report. */
    reportFriendChallengeResult(playerId: any, challengeId: any, winnerId: any, scores?: {}): Promise<any>;
    /** Get the friend challenge leaderboard for a player and their friends. */
    friendChallengeLeaderboard(playerId: any, limit?: number): Promise<any>;
    guildSummary(d: any, playerId: any): {
        id: any;
        name: any;
        memberCount: any;
        isOwner: boolean;
    } | null;
    createGuild(playerId: any, name: any): Promise<any>;
    joinGuild(playerId: any, guildId: any): Promise<any>;
    leaveGuild(playerId: any): Promise<any>;
    /** The player's guild with member labels, or null. */
    myGuild(playerId: any): Promise<any>;
    /** Guilds ranked by member count, then total best score. */
    listGuilds(limit?: number): Promise<any>;
    /**
     * Records a won level. Updates the player's best score, and their score and progress in each
     * active tournament and challenge. The caller decides which competitions are active.
     */
    recordWin(playerId: any, { level, score, tournamentIds, challengeIds, attemptId }: {
        level: any;
        score: any;
        tournamentIds?: never[] | undefined;
        challengeIds?: never[] | undefined;
        attemptId?: null | undefined;
    }): Promise<any>;
    /** Full ranking for a tournament: [{ playerId, score }], highest first. */
    tournamentRanking(tournamentId: any): Promise<any>;
    /** Top rows for display, and the viewer's own rank. Labels only, no ids. */
    tournamentBoard(tournamentId: any, viewerId: any, limit?: number): Promise<any>;
    challengeStanding(challengeId: any, playerId: any): Promise<any>;
    /**
     * Marks a payout as taken for one player. Returns false if it was already taken. Pair with
     * releasePayout when the grant fails, so a failed grant can be retried.
     */
    reservePayout(key: any, playerId: any): Promise<any>;
    hasPayout(key: any, playerId: any): Promise<any>;
    releasePayout(key: any, playerId: any): Promise<any>;
}
export const socialStore: SocialStore;
export default socialStore;
//# sourceMappingURL=social-store.d.ts.map