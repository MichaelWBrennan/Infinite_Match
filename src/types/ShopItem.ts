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

export enum CurrencyType {
  COINS = 'COINS',
  GEMS = 'GEMS',
  ENERGY = 'ENERGY'
}

export enum ShopCategory {
  POWER_UPS = 'POWER_UPS',
  COSMETICS = 'COSMETICS',
  CURRENCY = 'CURRENCY',
  BOOSTERS = 'BOOSTERS'
}

export enum ItemRarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY'
}