export interface GameSession {
  id: string;
  playerId: string;
  level: number;
  score: number;
  moves: number;
  timeSpent: number;
  completed: boolean;
  createdAt: Date;
  updatedAt?: Date;
  endedAt?: Date;
}

export interface Match3Level {
  id: string;
  levelNumber: number;
  difficulty: LevelDifficulty;
  targetScore: number;
  maxMoves: number;
  timeLimit?: number;
  specialTiles: SpecialTile[];
  obstacles: Obstacle[];
  rewards: Reward[];
}

export interface SpecialTile {
  id: string;
  type: SpecialTileType;
  position: Position;
  effect?: Record<string, any>;
}

export interface Obstacle {
  id: string;
  type: ObstacleType;
  position: Position;
  health?: number;
}

export interface Reward {
  id: string;
  type: RewardType;
  amount: number;
  probability: number;
}

export interface Position {
  x: number;
  y: number;
}

export enum LevelDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  EXPERT = 'EXPERT',
  MASTER = 'MASTER',
}

export enum SpecialTileType {
  BOMB = 'BOMB',
  LIGHTNING = 'LIGHTNING',
  RAINBOW = 'RAINBOW',
  MULTIPLIER = 'MULTIPLIER',
  FREEZE = 'FREEZE',
}

export enum ObstacleType {
  ROCK = 'ROCK',
  ICE = 'ICE',
  CHAIN = 'CHAIN',
  LOCK = 'LOCK',
  TIMER = 'TIMER',
}

export enum RewardType {
  COINS = 'COINS',
  GEMS = 'GEMS',
  ENERGY = 'ENERGY',
  POWER_UP = 'POWER_UP',
  EXPERIENCE = 'EXPERIENCE',
}
