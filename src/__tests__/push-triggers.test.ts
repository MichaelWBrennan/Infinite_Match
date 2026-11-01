import { describe, expect, test } from '@jest/globals';
import {
  getAllTriggers,
  sendTrigger,
  setEnabled,
  isEnabled,
  getAll,
} from '../services/push/push-triggers.js';

describe('push triggers', () => {
  test('getAllTriggers returns all trigger definitions', () => {
    const triggers = getAllTriggers();
    expect(triggers).toHaveProperty('energy_full');
    expect(triggers).toHaveProperty('streak_reminder');
    expect(triggers).toHaveProperty('battle_pass_ending');
    expect(triggers).toHaveProperty('tournament_starting');
    expect(triggers).toHaveProperty('comeback');
    expect(triggers).toHaveProperty('new_level');
    expect(triggers).toHaveProperty('limited_offer');
    expect(triggers).toHaveProperty('gift_received');
    for (const def of Object.values(triggers)) {
      expect(def).toHaveProperty('type');
      expect(def).toHaveProperty('title');
      expect(def).toHaveProperty('body');
    }
  });

  test('setEnabled and isEnabled work', () => {
    const playerId = 'player_trigger_1';
    setEnabled(playerId, 'energy_full', false);
    expect(isEnabled(playerId, 'energy_full')).toBe(false);
    setEnabled(playerId, 'energy_full', true);
    expect(isEnabled(playerId, 'energy_full')).toBe(true);
  });

  test('getAll returns all preferences', () => {
    const playerId = 'player_trigger_2';
    setEnabled(playerId, 'streak_reminder', false);
    const prefs = getAll(playerId);
    expect(prefs.streak_reminder).toBe(false);
    expect(prefs.energy_full).toBe(true); // default enabled
    expect(prefs.gift_received).toBe(true); // default enabled
  });

  test('sendTrigger returns unknown for invalid type', async () => {
    const result = await sendTrigger('player_trigger_3', 'nonexistent_trigger', {});
    expect(result.sent).toBe(false);
    expect(result.reason).toBe('unknown_trigger');
  });

  test('sendTrigger returns disabled when trigger is disabled', async () => {
    const playerId = 'player_trigger_4';
    setEnabled(playerId, 'comeback', false);
    const result = await sendTrigger(playerId, 'comeback', { days: 7 });
    expect(result.sent).toBe(false);
    expect(result.reason).toBe('disabled');
  });
});
