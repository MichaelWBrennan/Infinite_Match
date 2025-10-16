export interface Player {
  id: string;
  username: string;
  email: string;
  level: number;
  experience: number;
  currency: PlayerCurrency;
  inventory: InventoryItem[];
  statistics: PlayerStatistics;
  achievements: Achievement[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PlayerCurrency {
  coins: number;
  gems: number;
  energy: number;
  maxEnergy: number;
}

export interface InventoryItem {
  id: string;
  itemId: string;
  quantity: number;
  rarity: ItemRarity;
  metadata?: Record<string, any>;
}

export interface PlayerStatistics {
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
  bestScore: number;
  averageScore: number;
  playTime: number;
  lastPlayed?: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress: number;
  maxProgress: number;
  reward?: Record<string, any>;
}

export enum ItemRarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
}
