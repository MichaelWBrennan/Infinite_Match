/**
 * Event Generator Service Tests - Phase 8.
 */

import { describe, expect, test, beforeEach } from '@jest/globals';
import { EventGeneratorService } from '../services/ai/event-generator-service.js';

describe('EventGeneratorService', () => {
  let service: EventGeneratorService;

  beforeEach(() => {
    // Mock AI services to avoid external API calls
    const mockContentGenerator = {
      generatePlatformContent: async () => ({ theme: 'mock', description: 'mock event' }),
    };
    const mockPersonalizationEngine = {
      predictPlayerPreferences: async () => ({}),
    };
    const mockContentPipeline = {
      generateContent: async () => ({}),
    };
    service = new EventGeneratorService(
      mockContentGenerator,
      mockPersonalizationEngine,
      mockContentPipeline
    );
  });

  test('generates a live event', async () => {
    const event = await service.generateEvent({
      theme: 'Spring Bloom',
      durationKey: 'daily',
      nowMs: Date.now(),
    });

    expect(event.id).toBeDefined();
    expect(event.name).toContain('Spring Bloom');
    expect(event.theme).toBe('Spring Bloom');
    expect(event.mechanic).toBeDefined();
    expect(event.status).toBe('scheduled');
    expect(event.startsAt).toBeDefined();
    expect(event.endsAt).toBeGreaterThan(event.startsAt);
    expect(event.aiGenerated).toBeDefined();
    expect(event.prizes).toBeDefined();
    expect(event.rules).toBeDefined();
  });

  test('generates event with correct duration', async () => {
    const flash = await service.generateEvent({ durationKey: 'flash', nowMs: Date.now() });
    const daily = await service.generateEvent({ durationKey: 'daily', nowMs: Date.now() });
    const weekly = await service.generateEvent({ durationKey: 'weekly', nowMs: Date.now() });

    expect(flash.durationHours).toBe(2);
    expect(daily.durationHours).toBe(24);
    expect(weekly.durationHours).toBe(168);
  });

  test('activates a scheduled event', async () => {
    const now = Date.now();
    const event = await service.generateEvent({ durationKey: 'daily', nowMs: now - 60000 }); // started 1 min ago
    service.activeEvents.set(event.id, event);

    const activated = service.activateEvent(event.id, { nowMs: now });
    expect(activated.status).toBe('active');
    expect(activated.activatedAt).toBe(now);
  });

  test('getActiveEvents returns events active at nowMs', async () => {
    const now = Date.now();
    const event1 = await service.generateEvent({ durationKey: 'daily', nowMs: now - 1000 });
    const event2 = await service.generateEvent({ durationKey: 'daily', nowMs: now + 86400000 }); // tomorrow

    service.activeEvents.set(event1.id, event1);
    service.activeEvents.set(event2.id, event2);

    const active = service.getActiveEvents({ nowMs: now });
    expect(active.length).toBe(1);
    expect(active[0].id).toBe(event1.id);
    expect(active[0].status).toBe('active');
  });

  test('completes events that have ended', async () => {
    const now = Date.now();
    const event = await service.generateEvent({ durationKey: 'flash', nowMs: now - 7200000 }); // ended 2 hours ago
    service.activeEvents.set(event.id, event);

    const active = service.getActiveEvents({ nowMs: now });
    expect(active.length).toBe(0);

    const history = service.getEvent(event.id);
    expect(history.status).toBe('completed');
  });

  test('schedules a series of events', async () => {
    const startMs = Date.now();
    const events = await service.scheduleEvents({
      startMs,
      intervalMs: 24 * 60 * 60 * 1000,
      count: 5,
    });

    expect(events.length).toBe(5);
    expect(service.activeEvents.size).toBe(5);

    // Events should be staggered
    for (let i = 1; i < events.length; i++) {
      expect(events[i].startsAt).toBeGreaterThan(events[i - 1].startsAt);
    }
  });

  test('records a player joining an event', async () => {
    const event = await service.generateEvent({ durationKey: 'daily', nowMs: Date.now() });
    service.activeEvents.set(event.id, event);
    service.activateEvent(event.id, { nowMs: Date.now() });

    const result = service.recordPlayerJoin(event.id, 'player-1');
    expect(result).toBe(true);
    expect(service.getEvent(event.id).playerCount).toBe(1);
  });

  test('records an event score and maintains leaderboard', async () => {
    const event = await service.generateEvent({ durationKey: 'daily', nowMs: Date.now() });
    service.activeEvents.set(event.id, event);
    service.activateEvent(event.id, { nowMs: Date.now() });

    const r1 = service.recordEventScore(event.id, 'player-1', 1000, { verified: true });
    expect(r1.success).toBe(true);

    const r2 = service.recordEventScore(event.id, 'player-2', 2000, { verified: true });
    expect(r2.success).toBe(true);

    const r3 = service.recordEventScore(event.id, 'player-1', 1500, { verified: true }); // higher than 1000
    expect(r3.success).toBe(true);

    const leaderboard = r3.leaderboard;
    expect(leaderboard[0].playerId).toBe('player-2');
    expect(leaderboard[0].score).toBe(2000);
    expect(leaderboard[1].playerId).toBe('player-1');
    expect(leaderboard[1].score).toBe(1500);
  });

  test('generatePrizes returns appropriate prizes for mechanic', () => {
    const doubleCoins = service.generatePrizes('Spring Bloom', 'Double Coins');
    expect(doubleCoins.coins).toBe(1000);

    const lifeBonus = service.generatePrizes('Winter', 'Life Bonus');
    expect(lifeBonus.lives).toBe(3);

    const boosterDrop = service.generatePrizes('Summer', 'Booster Drop');
    expect(boosterDrop.boosters).toBeDefined();
  });
});
