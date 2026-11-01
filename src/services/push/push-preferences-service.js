/**
 * Push Preferences Service
 *
 * Persists player push notification trigger preferences in the player economy
 * instead of in-memory Maps. Survives server restarts and enables
 * cross-device preference sync.
 *
 * Trigger preferences are stored under economy.settings.pushTriggers:
 *  { energy_full: true, streak_reminder: true, ... }
 */

import { Logger } from '../../core/logger/index.js';

const logger = new Logger('PushPreferencesService');

// Default trigger preferences (matching push-triggers.js defaults)
const DEFAULT_TRIGGER_PREFERENCES = {
  energy_full: true,
  streak_reminder: true,
  battle_pass_ending: true,
  tournament_starting: true,
  comeback: true,
  new_level: true,
  limited_offer: true,
  gift_received: true,
  winback: true,
  event_advance_notify: true,
  d1_recovery: true,
  streak_repair: true,
};

class PushPreferencesService {
  constructor(accountEconomy) {
    this.accountEconomy = accountEconomy;
  }

  /**
   * Get a player's push trigger preferences.
   * Returns the full preferences object with defaults applied.
   */
  async getPreferences(playerId) {
    const economy = await this.accountEconomy.getPlayerEconomy(playerId);
    const settings = economy.settings || {};
    const stored = settings.pushTriggers || {};

    return { ...DEFAULT_TRIGGER_PREFERENCES, ...stored };
  }

  /**
   * Get a single trigger preference for a player.
   */
  async isEnabled(playerId, triggerType) {
    const prefs = await this.getPreferences(playerId);
    return prefs[triggerType] ?? DEFAULT_TRIGGER_PREFERENCES[triggerType] ?? false;
  }

  /**
   * Set a single trigger preference for a player.
   */
  async setEnabled(playerId, triggerType, enabled) {
    const economy = await this.accountEconomy.getPlayerEconomy(playerId);
    if (!economy.settings) economy.settings = {};
    if (!economy.settings.pushTriggers) economy.settings.pushTriggers = {};

    economy.settings.pushTriggers[triggerType] = enabled;
    economy.settings.lastUpdated = new Date().toISOString();

    await this.accountEconomy.updatePlayerEconomyCache(playerId, economy);

    logger.info('Push trigger preference updated', { playerId, triggerType, enabled });
    return { success: true, triggerType, enabled };
  }

  /**
   * Get all trigger preferences for a player (with enabled/disabled flags).
   */
  async getAll(playerId) {
    const prefs = await this.getPreferences(playerId);
    const result = {};
    for (const [type, def] of Object.entries(DEFAULT_TRIGGER_PREFERENCES)) {
      result[type] = prefs[type] ?? def;
    }
    return result;
  }

  /**
   * Set multiple trigger preferences at once.
   */
  async setMultiple(playerId, preferences) {
    const economy = await this.accountEconomy.getPlayerEconomy(playerId);
    if (!economy.settings) economy.settings = {};
    if (!economy.settings.pushTriggers) economy.settings.pushTriggers = {};

    for (const [triggerType, enabled] of Object.entries(preferences)) {
      if (typeof enabled === 'boolean') {
        economy.settings.pushTriggers[triggerType] = enabled;
      }
    }
    economy.settings.lastUpdated = new Date().toISOString();

    await this.accountEconomy.updatePlayerEconomyCache(playerId, economy);

    logger.info('Multiple push trigger preferences updated', { playerId, count: Object.keys(preferences).length });
    return { success: true, preferences };
  }

  /**
   * Reset preferences to defaults.
   */
  async resetToDefaults(playerId) {
    const economy = await this.accountEconomy.getPlayerEconomy(playerId);
    if (!economy.settings) economy.settings = {};
    economy.settings.pushTriggers = { ...DEFAULT_TRIGGER_PREFERENCES };
    economy.settings.lastUpdated = new Date().toISOString();

    await this.accountEconomy.updatePlayerEconomyCache(playerId, economy);

    logger.info('Push preferences reset to defaults', { playerId });
    return { success: true, preferences: DEFAULT_TRIGGER_PREFERENCES };
  }

  /**
   * Get all trigger preference definitions (for client exposure).
   */
  getAllTriggerDefinitions() {
    return Object.fromEntries(
      Object.entries(DEFAULT_TRIGGER_PREFERENCES).map(([type]) => [
        type,
        { type, enabledByDefault: true },
      ]),
    );
  }
}

export default PushPreferencesService;
export { PushPreferencesService, DEFAULT_TRIGGER_PREFERENCES };
