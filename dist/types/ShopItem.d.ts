export interface ShopItem {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: CurrencyType;
    category: ShopCategory;
    rarity: ItemRarity;
    metadata?: Record<string, any>;
    available: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum CurrencyType {
    COINS = "COINS",
    GEMS = "GEMS",
    ENERGY = "ENERGY"
}
export declare enum ShopCategory {
    POWER_UPS = "POWER_UPS",
    COSMETICS = "COSMETICS",
    CURRENCY = "CURRENCY",
    BOOSTERS = "BOOSTERS"
}
export declare enum ItemRarity {
    COMMON = "COMMON",
    UNCOMMON = "UNCOMMON",
    RARE = "RARE",
    EPIC = "EPIC",
    LEGENDARY = "LEGENDARY"
}
//# sourceMappingURL=ShopItem.d.ts.map