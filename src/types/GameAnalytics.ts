export interface GameAnalytics {
  playerId: string;
  sessionId: string;
  events: AnalyticsEvent[];
  metrics: GameMetrics;
  timestamp: Date;
}

export interface AnalyticsEvent {
  id: string;
  type: string;
  data: Record<string, any>;
  timestamp: Date;
}

export interface GameMetrics {
  sessionDuration: number;
  levelsCompleted: number;
  totalScore: number;
  averageMoveTime: number;
  powerUpsUsed: number;
  purchases: number;
  revenue: number;
}

export interface PlayerBehavior {
  playerId: string;
  playPatterns: PlayPattern[];
  preferences: PlayerPreferences;
  engagement: EngagementMetrics;
  retention: RetentionMetrics;
}

export interface PlayPattern {
  timeOfDay: number;
  dayOfWeek: number;
  sessionLength: number;
  frequency: number;
  preferredLevels: number[];
  difficulty: string;
}

export interface PlayerPreferences {
  theme: string;
  soundEnabled: boolean;
  musicEnabled: boolean;
  vibrationEnabled: boolean;
  language: string;
  notifications: boolean;
}

export interface EngagementMetrics {
  dailyActiveMinutes: number;
  weeklyActiveMinutes: number;
  monthlyActiveMinutes: number;
  averageSessionLength: number;
  sessionsPerDay: number;
  daysSinceLastPlay: number;
}

export interface RetentionMetrics {
  day1: boolean;
  day7: boolean;
  day30: boolean;
  day90: boolean;
  cohort: string;
  lifetimeValue: number;
}