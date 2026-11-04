/**
 * Picks a random card id using weighted rarity selection. `randomInt(max)` returns [0, max).
 */
export function pickRandomCard(randomInt: any): any;
/** Returns the card definition for an id, or null. */
export function cardFor(id: any): any;
/** Returns all cards in a set. */
export function cardsInSet(setId: any): any;
/** Returns all set definitions. */
export function allSets(): ({
    id: string;
    name: string;
    cards: string[];
    reward: {
        coins: number;
        stars: number;
    };
} | {
    id: string;
    name: string;
    cards: string[];
    reward: {
        coins: number;
        stars: number;
    };
} | {
    id: string;
    name: string;
    cards: string[];
    reward: {
        coins: number;
        stars: number;
    };
})[];
/** Returns the card catalog (read-only). */
export function allCards(): {
    king_card: {
        id: string;
        name: string;
        set: string;
        rarity: string;
        type: string;
    };
    queen_card: {
        id: string;
        name: string;
        set: string;
        rarity: string;
        type: string;
    };
    prince_card: {
        id: string;
        name: string;
        set: string;
        rarity: string;
        type: string;
    };
    castle_card: {
        id: string;
        name: string;
        set: string;
        rarity: string;
        type: string;
    };
    crown_card: {
        id: string;
        name: string;
        set: string;
        rarity: string;
        type: string;
    };
    tiger_card: {
        id: string;
        name: string;
        set: string;
        rarity: string;
        type: string;
    };
    parrot_card: {
        id: string;
        name: string;
        set: string;
        rarity: string;
        type: string;
    };
    monkey_card: {
        id: string;
        name: string;
        set: string;
        rarity: string;
        type: string;
    };
    temple_card: {
        id: string;
        name: string;
        set: string;
        rarity: string;
        type: string;
    };
    idol_card: {
        id: string;
        name: string;
        set: string;
        rarity: string;
        type: string;
    };
    yeti_card: {
        id: string;
        name: string;
        set: string;
        rarity: string;
        type: string;
    };
    fox_card: {
        id: string;
        name: string;
        set: string;
        rarity: string;
        type: string;
    };
    igloo_card: {
        id: string;
        name: string;
        set: string;
        rarity: string;
        type: string;
    };
    aurora_card: {
        id: string;
        name: string;
        set: string;
        rarity: string;
        type: string;
    };
};
/** Number of unique cards needed to complete a set. */
export function setGoal(setId: any): any;
/**
 * Evaluates a player's collection against all sets.
 * collection: Map<cardId, count>
 * Returns { sets: [{ id, name, progress, goal, complete, reward }], totalCards, uniqueCards }
 */
export function evaluateCollection(collection: any, sets?: ({
    id: string;
    name: string;
    cards: string[];
    reward: {
        coins: number;
        stars: number;
    };
} | {
    id: string;
    name: string;
    cards: string[];
    reward: {
        coins: number;
        stars: number;
    };
} | {
    id: string;
    name: string;
    cards: string[];
    reward: {
        coins: number;
        stars: number;
    };
})[]): {
    sets: {
        id: string;
        name: string;
        progress: number;
        goal: number;
        complete: boolean;
        reward: {
            coins: number;
            stars: number;
        } | {
            coins: number;
            stars: number;
        } | {
            coins: number;
            stars: number;
        };
    }[];
    totalCards: number;
    uniqueCards: number;
};
/**
 * Opens a card pack: deducts coins, draws cards, adds to collection.
 * Returns { success, cards: [{ id, name, rarity, isDuplicate }], coinsDeducted, collection }
 * or { success: false, error }.
 */
export function openCardPack(playerId: any, accountEconomy: any, collection: any, { nowMs, randomInt }?: {
    nowMs?: number | undefined;
    randomInt?: ((max: any) => number) | undefined;
}): Promise<{
    success: boolean;
    error: string;
    required: number;
    balance: any;
    cards?: never;
    coinsDeducted?: never;
    collection?: never;
} | {
    success: boolean;
    cards: {
        id: any;
        name: any;
        rarity: any;
        isDuplicate: boolean;
    }[];
    coinsDeducted: number;
    collection: Map<any, any>;
    error?: never;
    required?: never;
    balance?: never;
}>;
/**
 * Converts duplicate cards into coins. Converts all copies above 1 for each card.
 * Returns { success, coinsEarned, cardsConverted, collection }.
 */
export function convertDuplicates(collection: any): {
    success: boolean;
    coinsEarned: number;
    cardsConverted: {
        id: any;
        name: any;
        duplicates: number;
        coins: number;
    }[];
    collection: Map<any, any>;
};
/** Cost to open a card pack (in coins). */
export const PACK_COST_COINS: 250;
/** Cards per pack. */
export const PACK_CARD_COUNT: 3;
/** Maximum duplicates of a card before they must be converted (prevents hoarding). */
export const MAX_DUPLICATES: 5;
//# sourceMappingURL=card-collection.d.ts.map