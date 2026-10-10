/** Picks one reward by weight. `randomInt(max)` must return an integer in [0, max). */
export function pickLootReward(rewards: any, randomInt: any): any;
/**
 * Loot boxes are bought with coins and the reward is rolled on the server.
 * Weights are relative. A reward is either a currency or an inventory item.
 */
export const LOOTBOXES: Readonly<{
    common: Readonly<{
        costCoins: 100;
        rewards: readonly ({
            id: string;
            weight: number;
            type: string;
            currencyId: string;
            amount: number;
            category?: never;
            itemId?: never;
        } | {
            id: string;
            weight: number;
            type: string;
            category: string;
            itemId: string;
            amount: number;
            currencyId?: never;
        })[];
    }>;
    rare: Readonly<{
        costCoins: 500;
        rewards: readonly ({
            id: string;
            weight: number;
            type: string;
            currencyId: string;
            amount: number;
            category?: never;
            itemId?: never;
        } | {
            id: string;
            weight: number;
            type: string;
            category: string;
            itemId: string;
            amount: number;
            currencyId?: never;
        })[];
    }>;
    epic: Readonly<{
        costCoins: 1000;
        rewards: readonly ({
            id: string;
            weight: number;
            type: string;
            currencyId: string;
            amount: number;
            category?: never;
            itemId?: never;
        } | {
            id: string;
            weight: number;
            type: string;
            category: string;
            itemId: string;
            amount: number;
            currencyId?: never;
        })[];
    }>;
}>;
/** Energy refill: coins per missing energy point. Refilling to full costs only what is missing. */
export const ENERGY_PRICE_COINS: 10;
//# sourceMappingURL=lootbox.d.ts.map