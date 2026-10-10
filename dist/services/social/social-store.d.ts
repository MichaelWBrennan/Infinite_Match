export function socialStoreFile(): string;
export const MAX_FRIENDS: 50;
export const MAX_GUILD_MEMBERS: 30;
export const NAME_PATTERN: RegExp;
export class SocialError extends Error {
    constructor(code: any);
    code: any;
}
export class SocialStore {
    constructor(file?: null);
    file: any;
    data: any;
    queue: Promise<void>;
    path(): any;
    load(): Promise<void>;
    persist(data: any): Promise<void>;
    /** Runs fn on a copy of the data, saves it, and only then replaces the data. Serialised. */
    write(fn: any): Promise<any>;
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
    friends(playerId: any): Promise<any>;
    /** Best scores for the player and their friends. Labels only, no ids. */
    friendBoard(playerId: any): Promise<any>;
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
    recordWin(playerId: any, { level, score, tournamentIds, challengeIds }: {
        level: any;
        score: any;
        tournamentIds?: never[] | undefined;
        challengeIds?: never[] | undefined;
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