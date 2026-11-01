/**
 * Cross-Platform Progression Sync Service Tests - Phase 9.
 */

import { describe, expect, test, beforeEach } from '@jest/globals';
import { ProgressionSyncService } from '../services/cross-platform/progression-sync-service.js';

describe('ProgressionSyncService', () => {
  let service: ProgressionSyncService;

  beforeEach(() => {
    service = new ProgressionSyncService();
  });

  test('initializes player state on first sync', () => {
    const result = service.syncPlatformProgress('player-1', 'webgl', {
      coins: 1000,
      lives: 5,
      stars: 50,
      timestamp: Date.now(),
    });

    expect(result.success).toBe(true);
    expect(result.mergedState.coins).toBe(1000);
    expect(result.mergedState.lives).toBe(5);
    expect(result.mergedState.stars).toBe(50);
  });

  test('merges state across multiple platforms', () => {
    const now = Date.now();

    // Sync from webgl
    service.syncPlatformProgress('multi-player', 'webgl', {
      coins: 1000,
      lives: 5,
      maxLevelReached: 10,
      timestamp: now,
    });

    // Sync from mobile with different data
    service.syncPlatformProgress('multi-player', 'android', {
      coins: 1500,
      lives: 3,
      boosters: { hammer: 5 },
      timestamp: now + 1000, // newer
    });

    const state = service.getMergedState('multi-player');
    // Coins: android is newer (now+1000), so 1500 wins
    expect(state.mergedState.coins).toBe(1500);
    // Lives: android is newer, so 3 wins
    expect(state.mergedState.lives).toBe(3);
    // maxLevelReached: only webgl has it
    expect(state.mergedState.maxLevelReached).toBe(10);
    // boosters: only android has it
    expect(state.mergedState.boosters).toEqual({ hammer: 5 });
    expect(state.platforms).toContain('webgl');
    expect(state.platforms).toContain('android');
  });

  test('rejects unsupported platform', () => {
    const result = service.syncPlatformProgress('player-1', 'playstation', {
      coins: 100,
      timestamp: Date.now(),
    });

    expect(result.success).toBe(false);
    expect(result.reason).toContain('Unsupported platform');
  });

  test('last-write-wins for conflicting fields', () => {
    const now = Date.now();

    // Webgl says coins=100 at time now
    service.syncPlatformProgress('conflict-player', 'webgl', {
      coins: 100, timestamp: now,
    });

    // Facebook says coins=500 at time now+5000 (newer)
    service.syncPlatformProgress('conflict-player', 'facebook', {
      coins: 500, timestamp: now + 5000,
    });

    const state = service.getMergedState('conflict-player');
    expect(state.mergedState.coins).toBe(500);
  });

  test('older write does not overwrite newer value', () => {
    const now = Date.now();

    // Webgl says coins=100 at time now+5000 (newer)
    service.syncPlatformProgress('old-player', 'webgl', {
      coins: 100, timestamp: now + 5000,
    });

    // Facebook says coins=500 at time now (older)
    service.syncPlatformProgress('old-player', 'facebook', {
      coins: 500, timestamp: now,
    });

    const state = service.getMergedState('old-player');
    expect(state.mergedState.coins).toBe(100); // webgl wins (newer)
  });

  test('getProgressSummary shows cross-platform status', () => {
    const now = Date.now();
    service.syncPlatformProgress('summary-player', 'webgl', {
      coins: 100, timestamp: now,
    });
    service.syncPlatformProgress('summary-player', 'ios', {
      lives: 5, timestamp: now,
    });

    const summary = service.getProgressSummary('summary-player');
    expect(summary.playerId).toBe('summary-player');
    expect(summary.isCrossPlatform).toBe(true);
    expect(Object.keys(summary.platforms).length).toBe(2);
    expect(summary.mergedState.coins).toBe(100);
    expect(summary.mergedState.lives).toBe(5);
  });

  test('getMergedState returns defaults for empty player', () => {
    const state = service.getMergedState('new-player');
    expect(state.mergedState.coins).toBe(0);
    expect(state.mergedState.lives).toBe(5);
    expect(state.mergedState.stars).toBe(0);
    expect(state.mergedState.currentLevel).toBe(1);
  });

  test('resolveConflict forces a platform value to win', () => {
    const now = Date.now();
    service.syncPlatformProgress('resolve-player', 'webgl', {
      coins: 100, timestamp: now,
    });
    service.syncPlatformProgress('resolve-player', 'android', {
      coins: 200, timestamp: now + 1000, // android is newer
    });

    // Force webgl to win
    const result = service.resolveConflict('resolve-player', 'coins', 'webgl');
    expect(result.success).toBe(true);
    expect(result.winningPlatform).toBe('webgl');
    expect(result.value).toBe(100);

    const state = service.getMergedState('resolve-player');
    expect(state.mergedState.coins).toBe(100);
  });
});
