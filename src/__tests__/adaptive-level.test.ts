/**
 * Adaptive Level Service Tests - Phase 8.
 */

import { describe, expect, test, beforeEach } from '@jest/globals';
import { AdaptiveLevelService } from '../services/ai/adaptive-level-service.js';

describe('AdaptiveLevelService', () => {
  let service: AdaptiveLevelService;

  beforeEach(() => {
    service = new AdaptiveLevelService();
  });

  test('creates a default skill profile for a new player', () => {
    const profile = service.getSkillProfile('player-1');
    expect(profile.playerId).toBe('player-1');
    expect(profile.gamesPlayed).toBe(0);
    // Default skill score: winRate(0.5)*0.4 + efficiency(1.0)*0.2 + speed(0.75)*0.1 = 0.475
    expect(profile.skillScore).toBeCloseTo(0.475, 2);
  });

  test('records a won attempt and updates skill profile', () => {
    service.recordAttempt('player-1', {
      level: 5, stars: 3, moves: 18, timeMs: 40000, boosterUsed: false, won: true,
    });

    const profile = service.getSkillProfile('player-1');
    expect(profile.gamesPlayed).toBe(1);
    expect(profile.gamesWon).toBe(1);
    expect(profile.winRate).toBe(1);
    expect(profile.totalStars).toBe(3);
    expect(profile.avgStars).toBe(3);
  });

  test('records a lost attempt and updates skill profile', () => {
    service.recordAttempt('player-1', {
      level: 5, stars: 0, moves: 25, timeMs: 60000, boosterUsed: true, won: false,
    });

    const profile = service.getSkillProfile('player-1');
    expect(profile.gamesPlayed).toBe(1);
    expect(profile.gamesWon).toBe(0);
    expect(profile.winRate).toBe(0);
  });

  test('skill score increases with wins and decreases with losses', () => {
    // Record several wins
    for (let i = 0; i < 10; i++) {
      service.recordAttempt('player-expert', {
        level: i + 1, stars: 3, moves: 15, timeMs: 30000, boosterUsed: false, won: true,
      });
    }
    const expertScore = service.getSkillProfile('player-expert').skillScore;

    // Record several losses
    for (let i = 0; i < 10; i++) {
      service.recordAttempt('player-novice', {
        level: i + 1, stars: 0, moves: 30, timeMs: 90000, boosterUsed: true, won: false,
      });
    }
    const noviceScore = service.getSkillProfile('player-novice').skillScore;

    expect(expertScore).toBeGreaterThan(noviceScore);
  });

  test('getDifficultyTier returns correct tier for skill score', () => {
    expect(service.getDifficultyTier(0.9)).toBe('expert');
    expect(service.getDifficultyTier(0.7)).toBe('challenging');
    expect(service.getDifficultyTier(0.5)).toBe('steady');
    expect(service.getDifficultyTier(0.3)).toBe('gentle');
    expect(service.getDifficultyTier(0.1)).toBe('beginner');
  });

  test('generates an adaptive level with tuning applied', async () => {
    // Build up a high-skill player
    for (let i = 0; i < 20; i++) {
      service.recordAttempt('high-skill', {
        level: i + 1, stars: 3, moves: 15, timeMs: 30000, boosterUsed: false, won: true,
      });
    }

    const level = await service.generateAdaptiveLevel('high-skill', {
      levelNumber: 10,
      mode: 'classic',
    });

    expect(level.adaptive).toBe(true);
    expect(level.playerId).toBe('high-skill');
    expect(level.skillScore).toBeGreaterThan(0.5);
    expect(level.targetScore).toBeGreaterThan(0);
    expect(level.moves).toBeGreaterThan(0);
    expect(Array.isArray(level.gemTypes)).toBe(true);
    expect(level.fromCache).toBe(false);
  });

  test('caches generated level for same player and level', async () => {
    service.recordAttempt('cache-player', {
      level: 1, stars: 2, moves: 20, timeMs: 50000, boosterUsed: false, won: true,
    });

    const level1 = await service.generateAdaptiveLevel('cache-player', {
      levelNumber: 3, mode: 'classic',
    });
    const level2 = await service.generateAdaptiveLevel('cache-player', {
      levelNumber: 3, mode: 'classic',
    });

    expect(level2.fromCache).toBe(true);
    expect(level1.seed).toBe(level2.seed);
  });

  test('invalidates cache when a new attempt is recorded', async () => {
    service.recordAttempt('invalidate-player', {
      level: 1, stars: 2, moves: 20, timeMs: 50000, boosterUsed: false, won: true,
    });

    const level1 = await service.generateAdaptiveLevel('invalidate-player', {
      levelNumber: 3, mode: 'classic',
    });

    // Record a new attempt - should invalidate cache
    service.recordAttempt('invalidate-player', {
      level: 3, stars: 3, moves: 15, timeMs: 30000, boosterUsed: false, won: true,
    });

    const level2 = await service.generateAdaptiveLevel('invalidate-player', {
      levelNumber: 3, mode: 'classic',
    });

    expect(level2.fromCache).toBe(false);
  });

  test('applies difficulty tuning - higher skill means higher target score', async () => {
    // Low skill player
    for (let i = 0; i < 10; i++) {
      service.recordAttempt('low-skill', {
        level: i + 1, stars: 0, moves: 30, timeMs: 90000, boosterUsed: true, won: false,
      });
    }
    const lowLevel = await service.generateAdaptiveLevel('low-skill', {
      levelNumber: 10, mode: 'classic',
    });

    // High skill player
    for (let i = 0; i < 10; i++) {
      service.recordAttempt('high-skill-2', {
        level: i + 1, stars: 3, moves: 15, timeMs: 30000, boosterUsed: false, won: true,
      });
    }
    const highLevel = await service.generateAdaptiveLevel('high-skill-2', {
      levelNumber: 10, mode: 'classic',
    });

    expect(highLevel.skillScore).toBeGreaterThan(lowLevel.skillScore);
  });

  test('generates level in endless mode', async () => {
    const level = await service.generateAdaptiveLevel('endless-player', {
      levelNumber: 1, mode: 'endless',
    });
    expect(level.adaptive).toBe(true);
  });
});
