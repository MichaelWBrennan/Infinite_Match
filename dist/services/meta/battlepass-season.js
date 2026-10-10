/**
 * Loads the battle pass season from config and adds season XP to a player. Kept apart from
 * battlepass.js so the rules there stay free of file and economy access.
 */
import { promises as fs } from 'fs';
import { Logger } from '../../core/logger/index.js';
import { accountEconomy as accountEconomyService } from '../economy/AccountEconomyService.js';
import { addSeasonXp, validateSeason } from './battlepass.js';
const logger = new Logger('BattlePassSeason');
/** The season config file. BATTLEPASS_CONFIG overrides it (used by tests and staging). */
export function seasonConfigPath() {
    return process.env.BATTLEPASS_CONFIG || 'config/battlepass/config.json';
}
/** Reads and validates the season config. Throws if it is missing or invalid. */
export async function loadSeason(path = seasonConfigPath()) {
    const raw = await fs.readFile(path, 'utf-8');
    const { errors, season } = validateSeason(JSON.parse(raw));
    if (errors.length)
        throw new Error(`invalid battle pass config: ${errors.join('; ')}`);
    return season;
}
/** Like loadSeason, but returns null and logs when the config cannot be used. Rewards keep working. */
export async function loadSeasonSafely(path = seasonConfigPath()) {
    try {
        return await loadSeason(path);
    }
    catch (error) {
        logger.error('Battle pass season unavailable', { error: error.message });
        return null;
    }
}
/** Adds season XP for an event (level_complete, daily_login) under the economy lock. */
export async function grantSeasonXp(playerId, event) {
    const season = await loadSeasonSafely();
    if (!season)
        return null;
    return accountEconomyService.withPlayerLock(playerId, async () => {
        const playerEconomy = await accountEconomyService.getPlayerEconomy(playerId);
        const xp = addSeasonXp(playerEconomy, season, event);
        if (xp !== null)
            await accountEconomyService.updatePlayerEconomyCache(playerId, playerEconomy);
        return xp;
    });
}
//# sourceMappingURL=battlepass-season.js.map