export function roomById(roomId: any): {
    id: string;
    name: string;
    baseCost: number;
} | null;
/** Coins to upgrade a room to `targetLevel`: baseCost x level squared (x1, x4, x9, x16, x25). */
export function upgradeCost(room: any, targetLevel: any): number;
export function initialKingdom(): {
    rooms: {
        [k: string]: number;
    };
    renovations: number;
    completedRooms: never[];
    completedAt: null;
};
/** Fills in a kingdom for economies saved before this feature existed. */
export function ensureKingdom(playerEconomy: any): any;
/** True when every room has reached KINGDOM_MAX_LEVEL. */
export function kingdomCompleted(kingdom: any): boolean;
/** The room IDs that have reached max level, in completion order. */
export function completedRoomIds(kingdom: any): any[];
/** The timestamp the kingdom was fully completed, or null. */
export function kingdomCompletedAt(kingdom: any): any;
/**
 * Marks a room as completed when its level reaches KINGDOM_MAX_LEVEL.
 * Returns { kingdom, justCompleted, allCompleted } where `kingdom` is the
 * updated state (with completedRooms and completedAt set), `justCompleted` is
 * true when this call completed the room, and `allCompleted` is true when
 * every room is now complete.
 */
export function markRoomCompleted(kingdom: any, roomId: any, nowMs?: number): {
    kingdom: any;
    justCompleted: boolean;
    allCompleted: boolean;
};
/**
 * What the next upgrade of a room would cost and require. `ok` is false with a
 * `reason` when the player cannot upgrade it now.
 */
export function planRenovation({ kingdom, room, coins, lifetimeStars }: {
    kingdom: any;
    room: any;
    coins: any;
    lifetimeStars: any;
}): {
    ok: boolean;
    reason: string;
    current: any;
    targetLevel: null;
    costCoins: number;
    starsNeeded?: never;
} | {
    ok: boolean;
    reason: string;
    current: any;
    targetLevel: any;
    costCoins: number;
    starsNeeded: number | undefined;
} | {
    ok: boolean;
    current: any;
    targetLevel: any;
    costCoins: number;
    starsNeeded: number | undefined;
    reason?: never;
};
/** The kingdom as the client shows it: each room with its level and next upgrade. */
export function kingdomView({ kingdom, coins, lifetimeStars, roomJustCompleted }: {
    kingdom: any;
    coins: any;
    lifetimeStars: any;
    roomJustCompleted?: null | undefined;
}): {
    rooms: {
        id: string;
        name: string;
        level: any;
        maxLevel: number;
        completed: any;
        justCompleted: boolean;
        next: {
            level: any;
            costCoins: number;
            starsRequired: number | undefined;
            milestone: any;
        } | null;
        canRenovate: boolean;
        blockedBy: string | null | undefined;
    }[];
    renovations: any;
    totalLevel: number;
    maxTotalLevel: number;
    completedRooms: any[];
    completedAt: any;
    allCompleted: boolean;
    completionReward: {
        category: string;
        itemId: string;
        amount: number;
    } | null;
};
/**
 * The coin multiplier from kingdom rooms: 1 plus 1% per room level, capped at +15%. Reads only;
 * a missing kingdom gives 1.
 */
export function kingdomCoinMultiplier(kingdom: any): number;
/**
 * Kingdom renovation: six rooms, each upgraded from level 0 to KINGDOM_MAX_LEVEL.
 *
 * Each upgrade costs coins and needs a lifetime star count. Reaching certain levels
 * grants an item. The server decides the price, the gate, and the reward. The client
 * only asks to renovate a room. Kingdom levels do not change gameplay yet.
 */
export const KINGDOM_MAX_LEVEL: 5;
export const KINGDOM_ROOMS: readonly {
    id: string;
    name: string;
    baseCost: number;
}[];
export const STARS_REQUIRED: readonly number[];
export const MILESTONE_REWARDS: Readonly<{
    3: {
        category: string;
        itemId: string;
        amount: number;
    };
    5: {
        category: string;
        itemId: string;
        amount: number;
    };
}>;
export namespace KINGDOM_COMPLETION_REWARD {
    let category: string;
    let itemId: string;
    let amount: number;
}
export const ROOM_COIN_BONUS_PER_LEVEL: 0.01;
export const ROOM_COIN_BONUS_CAP: 0.15;
//# sourceMappingURL=kingdom.d.ts.map