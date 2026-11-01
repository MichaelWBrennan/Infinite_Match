import { describe, expect, test } from '@jest/globals';
import {
  initializeDailyQuests,
  updateQuestProgress,
  claimQuest,
  getQuestDefinitions,
  getClaimableQuests,
  todayStartMs,
} from '../services/meta/daily-quests/daily-quests.js';

describe('daily quests', () => {
  const now = todayStartMs();

  test('getQuestDefinitions returns all quests', () => {
    const quests = getQuestDefinitions();
    expect(quests.length).toBeGreaterThan(0);
    for (const q of quests) {
      expect(q).toHaveProperty('id');
      expect(q).toHaveProperty('type');
      expect(q).toHaveProperty('target');
      expect(q).toHaveProperty('reward');
    }
  });

  test('initializeDailyQuests creates fresh quests for today', () => {
    const quests = initializeDailyQuests(null, now);
    expect(quests.dayStartMs).toBe(now);
    expect(quests.quests.length).toBe(getQuestDefinitions().length);
    for (const q of quests.quests) {
      expect(q.progress).toBe(0);
      expect(q.claimed).toBe(false);
    }
  });

  test('initializeDailyQuests preserves existing state from same day', () => {
    const initial = initializeDailyQuests(null, now);
    const again = initializeDailyQuests(initial, now);
    expect(again).toBe(initial);
  });

  test('initializeDailyQuests resets for a new day', () => {
    const initial = initializeDailyQuests(null, now);
    const tomorrow = new Date(now + 24 * 60 * 60 * 1000).getTime();
    const reset = initializeDailyQuests(initial, tomorrow);
    expect(reset.dayStartMs).toBe(todayStartMs(tomorrow));
    expect(reset.quests[0].progress).toBe(0);
    expect(reset.quests[0].claimed).toBe(false);
  });

  test('updateQuestProgress increments progress', () => {
    const quests = initializeDailyQuests(null, now);
    const updated = updateQuestProgress(quests, 'level_played', 1, now);
    const playQuest = updated.quests.find((q) => q.type === 'levels_played');
    expect(playQuest.progress).toBe(1);
  });

  test('updateQuestProgress caps at target', () => {
    const quests = initializeDailyQuests(null, now);
    const updated = updateQuestProgress(quests, 'level_played', 10, now);
    const playQuest = updated.quests.find((q) => q.type === 'levels_played');
    expect(playQuest.progress).toBe(3); // capped at target of 3
  });

  test('updateQuestProgress does not affect unrelated quests', () => {
    const quests = initializeDailyQuests(null, now);
    const updated = updateQuestProgress(quests, 'level_played', 1, now);
    const winQuest = updated.quests.find((q) => q.type === 'levels_won');
    expect(winQuest.progress).toBe(0);
  });

  test('claimQuest succeeds for completed quest', () => {
    let quests = initializeDailyQuests(null, now);
    quests = updateQuestProgress(quests, 'level_played', 3, now);
    const result = claimQuest(quests, 'daily_play_3', now);
    expect(result.success).toBe(true);
    expect(result.reward).toEqual({ coins: 200, xp: 100 });
    const claimed = result.quests.quests.find((q) => q.id === 'daily_play_3');
    expect(claimed.claimed).toBe(true);
  });

  test('claimQuest fails for incomplete quest', () => {
    const quests = initializeDailyQuests(null, now);
    const result = claimQuest(quests, 'daily_play_3', now);
    expect(result.success).toBe(false);
    expect(result.reason).toBe('quest_not_complete');
  });

  test('claimQuest fails for already claimed quest', () => {
    let quests = initializeDailyQuests(null, now);
    quests = updateQuestProgress(quests, 'level_played', 3, now);
    const first = claimQuest(quests, 'daily_play_3', now);
    expect(first.success).toBe(true);
    const result = claimQuest(first.quests, 'daily_play_3', now);
    expect(result.success).toBe(false);
    expect(result.reason).toBe('already_claimed');
  });

  test('getClaimableQuests returns only claimable quests', () => {
    let quests = initializeDailyQuests(null, now);
    quests = updateQuestProgress(quests, 'level_played', 3, now); // complete but not claimed
    const claimable = getClaimableQuests(quests);
    expect(claimable.length).toBe(1);
    expect(claimable[0].id).toBe('daily_play_3');
  });

  test('resets quests on new day', () => {
    let quests = initializeDailyQuests(null, now);
    quests = updateQuestProgress(quests, 'level_played', 3, now);
    const claimed = claimQuest(quests, 'daily_play_3', now);
    expect(claimed.success).toBe(true);

    const tomorrow = new Date(now + 25 * 60 * 60 * 1000).getTime();
    const reset = initializeDailyQuests(claimed.quests, tomorrow);
    const resetQuests = reset.quests.find((q) => q.id === 'daily_play_3');
    expect(resetQuests.progress).toBe(0);
    expect(resetQuests.claimed).toBe(false);
  });
});
