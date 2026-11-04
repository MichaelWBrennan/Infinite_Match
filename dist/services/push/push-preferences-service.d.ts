export default PushPreferencesService;
export class PushPreferencesService {
    constructor(accountEconomy: any);
    accountEconomy: any;
    /**
     * Get a player's push trigger preferences.
     * Returns the full preferences object with defaults applied.
     */
    getPreferences(playerId: any): Promise<any>;
    /**
     * Get a single trigger preference for a player.
     */
    isEnabled(playerId: any, triggerType: any): Promise<any>;
    /**
     * Set a single trigger preference for a player.
     */
    setEnabled(playerId: any, triggerType: any, enabled: any): Promise<{
        success: boolean;
        triggerType: any;
        enabled: any;
    }>;
    /**
     * Get all trigger preferences for a player (with enabled/disabled flags).
     */
    getAll(playerId: any): Promise<{}>;
    /**
     * Set multiple trigger preferences at once.
     */
    setMultiple(playerId: any, preferences: any): Promise<{
        success: boolean;
        preferences: any;
    }>;
    /**
     * Reset preferences to defaults.
     */
    resetToDefaults(playerId: any): Promise<{
        success: boolean;
        preferences: {
            energy_full: boolean;
            streak_reminder: boolean;
            battle_pass_ending: boolean;
            tournament_starting: boolean;
            comeback: boolean;
            new_level: boolean;
            limited_offer: boolean;
            gift_received: boolean;
            winback: boolean;
            event_advance_notify: boolean;
            d1_recovery: boolean;
            streak_repair: boolean;
        };
    }>;
    /**
     * Get all trigger preference definitions (for client exposure).
     */
    getAllTriggerDefinitions(): {
        [k: string]: {
            type: string;
            enabledByDefault: boolean;
        };
    };
}
export namespace DEFAULT_TRIGGER_PREFERENCES {
    let energy_full: boolean;
    let streak_reminder: boolean;
    let battle_pass_ending: boolean;
    let tournament_starting: boolean;
    let comeback: boolean;
    let new_level: boolean;
    let limited_offer: boolean;
    let gift_received: boolean;
    let winback: boolean;
    let event_advance_notify: boolean;
    let d1_recovery: boolean;
    let streak_repair: boolean;
}
//# sourceMappingURL=push-preferences-service.d.ts.map