/** Picks one wheel reward. `randomInt(max)` must return an integer in [0, max). */
export function pickWheelReward(randomInt: any): {
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
} | undefined;
export namespace ITEM_CATALOG {
    namespace bomb {
        let category: string;
        let currencyId: string;
        let price: number;
    }
    namespace rocket {
        let category_1: string;
        export { category_1 as category };
        let currencyId_1: string;
        export { currencyId_1 as currencyId };
        let price_1: number;
        export { price_1 as price };
    }
    namespace rainbow {
        let category_2: string;
        export { category_2 as category };
        let currencyId_2: string;
        export { currencyId_2 as currencyId };
        let price_2: number;
        export { price_2 as price };
    }
    namespace lightning {
        let category_3: string;
        export { category_3 as category };
        let currencyId_3: string;
        export { currencyId_3 as currencyId };
        let price_3: number;
        export { price_3 as price };
    }
    namespace diamond {
        let category_4: string;
        export { category_4 as category };
        let currencyId_4: string;
        export { currencyId_4 as currencyId };
        let price_4: number;
        export { price_4 as price };
    }
    namespace target {
        let category_5: string;
        export { category_5 as category };
        let currencyId_5: string;
        export { currencyId_5 as currencyId };
        let price_5: number;
        export { price_5 as price };
    }
    namespace star {
        let category_6: string;
        export { category_6 as category };
        let currencyId_6: string;
        export { currencyId_6 as currencyId };
        let price_6: number;
        export { price_6 as price };
    }
}
export namespace LEVEL_LIMITS {
    let maxLevel: number;
    let maxScore: number;
    let maxStars: number;
    let maxCoinsPerLevel: number;
}
export default ITEM_CATALOG;
export const WHEEL_REWARDS: ({
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
//# sourceMappingURL=item-catalog.d.ts.map