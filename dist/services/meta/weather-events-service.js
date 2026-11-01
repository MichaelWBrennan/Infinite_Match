/**
 * Weather & Context Events Service - ties real-world weather, time of day,
 * and holidays to in-game modifiers. All weather data is server-fetched and
 * cached; clients cannot spoof weather.
 */
import { Logger } from '../../core/logger/index.js';
import { levelWeatherService } from '../levels/weather-context.js';
import { localLevelContext } from '../levels/location-context.js';
const logger = new Logger('WeatherEventsService');
const WEATHER_EFFECTS = {
    clear: { name: 'Clear Skies', coinMultiplier: 1.0, lifeBonus: 0, boosterDropRate: 1.0, description: 'Standard gameplay conditions.' },
    rain: { name: 'Rainy Day', coinMultiplier: 2.0, lifeBonus: 0, boosterDropRate: 1.0, description: 'Double coin rewards on all levels.' },
    snow: { name: 'Snowstorm', coinMultiplier: 1.0, lifeBonus: 1, boosterDropRate: 1.0, description: 'Free life refill for all players.' },
    thunderstorm: { name: 'Thunderstorm', coinMultiplier: 1.5, lifeBonus: 0, boosterDropRate: 2.0, description: 'Double booster drop rate.' },
    drizzle: { name: 'Light Rain', coinMultiplier: 1.5, lifeBonus: 0, boosterDropRate: 1.2, description: '1.5x coin rewards.' },
    sleet: { name: 'Sleet', coinMultiplier: 1.25, lifeBonus: 0, boosterDropRate: 1.5, description: 'Bonus booster drops.' },
    fog: { name: 'Foggy', coinMultiplier: 1.0, lifeBonus: 0, boosterDropRate: 1.0, description: 'Standard conditions with reduced visibility.' },
    clouds: { name: 'Cloudy', coinMultiplier: 1.1, lifeBonus: 0, boosterDropRate: 1.0, description: 'Slight coin bonus.' },
};
const TIME_OF_DAY_EFFECTS = {
    morning: { name: 'Morning Boost', energyRegenMultiplier: 1.2, scoreMultiplier: 1.0, starMultiplier: 1.0, coinMultiplier: 1.0, boosterDropRate: 1.0, description: 'Faster energy regeneration in the morning.' },
    afternoon: { name: 'Afternoon Focus', energyRegenMultiplier: 1.0, scoreMultiplier: 1.1, starMultiplier: 1.0, coinMultiplier: 1.0, boosterDropRate: 1.0, description: 'Slight score multiplier during afternoon hours.' },
    evening: { name: 'Evening Rush', energyRegenMultiplier: 1.0, scoreMultiplier: 1.0, starMultiplier: 1.0, coinMultiplier: 1.2, boosterDropRate: 1.0, description: 'Bonus coins during evening play.' },
    night: { name: 'Night Owl', energyRegenMultiplier: 1.0, scoreMultiplier: 1.0, starMultiplier: 1.25, coinMultiplier: 1.0, boosterDropRate: 1.0, description: 'Bonus stars for night-time completions.' },
};
const HOLIDAY_EFFECTS = {
    'new years day': { name: 'New Year Celebration', coinMultiplier: 2.0, lifeBonus: 3, boosterDropRate: 2.0, description: 'Celebrate the new year with bonus rewards!' },
    "valentine's day": { name: "Valentine's Day", coinMultiplier: 1.5, lifeBonus: 1, boosterDropRate: 1.5, description: "Spread the love with bonus rewards." },
    halloween: { name: 'Halloween Spooktacular', coinMultiplier: 1.75, lifeBonus: 2, boosterDropRate: 1.75, description: 'Spooky bonuses all day!' },
    christmas: { name: 'Christmas Miracle', coinMultiplier: 2.0, lifeBonus: 5, boosterDropRate: 2.0, description: 'Merry Christmas - maximum rewards!' },
    thanksgiving: { name: 'Thanksgiving Feast', coinMultiplier: 1.5, lifeBonus: 2, boosterDropRate: 1.5, description: 'Give thanks with bonus rewards.' },
};
const MAX_WEATHER_CACHE_SIZE = 500;
const WEATHER_CACHE_TTL_MS = 30 * 60 * 1000;
const CONTEXT_CACHE_TTL_MS = 15 * 60 * 1000;
const MODIFIER_CACHE_TTL_MS = 15 * 60 * 1000;
/**
 * WeatherEventsService - computes active weather/context gameplay modifiers.
 */
export class WeatherEventsService {
    constructor() {
        this.logger = new Logger('WeatherEventsService');
        this.weatherCache = new Map(); // lat/lon -> { weather, fetchedAt }
        this.contextCache = new Map(); // locationKey -> { context, fetchedAt }
        this.modifierCache = new Map(); // modifierKey -> { modifiers, generatedAt }
        this.cacheTtlMs = WEATHER_CACHE_TTL_MS;
        this.maxCacheSize = MAX_WEATHER_CACHE_SIZE;
    }
    _evictCaches({ nowMs = Date.now() } = {}) {
        for (const [key, { fetchedAt }] of this.weatherCache) {
            if (nowMs - fetchedAt > this.cacheTtlMs)
                this.weatherCache.delete(key);
        }
        while (this.weatherCache.size > this.maxCacheSize) {
            let oldestKey = null;
            let oldestTime = Infinity;
            for (const [key, { fetchedAt }] of this.weatherCache) {
                if (fetchedAt < oldestTime) {
                    oldestTime = fetchedAt;
                    oldestKey = key;
                }
            }
            if (oldestKey)
                this.weatherCache.delete(oldestKey);
        }
        for (const [key, { fetchedAt }] of this.contextCache) {
            if (nowMs - fetchedAt > CONTEXT_CACHE_TTL_MS)
                this.contextCache.delete(key);
        }
        for (const [key, { generatedAt }] of this.modifierCache) {
            if (nowMs - generatedAt > MODIFIER_CACHE_TTL_MS)
                this.modifierCache.delete(key);
        }
    }
    /**
     * Build a cache key for location context.
     */
    _contextKey(timezone, country) {
        return `${timezone}:${country}`;
    }
    /**
     * Build a cache key for combined modifiers.
     */
    _modifierKey(playerId, lat, lon, timezone, country) {
        return `${playerId}:${lat}:${lon}:${timezone}:${country}`;
    }
    /**
     * Get active gameplay modifiers for a player based on their location/time.
     * playerContext - { lat, lon, timezone, country, playerId }
     * nowMs - reference time (default: now)
     */
    async getActiveModifiers(playerContext = {}, { nowMs = Date.now() } = {}) {
        this._evictCaches({ nowMs });
        const { lat, lon, timezone = 'UTC', country = 'US', playerId } = playerContext;
        const modifierKey = this._modifierKey(playerId, lat, lon, timezone, country);
        const cachedModifier = this.modifierCache.get(modifierKey);
        if (cachedModifier && nowMs - cachedModifier.generatedAt < MODIFIER_CACHE_TTL_MS) {
            return { ...cachedModifier.modifiers, fromCache: true };
        }
        const contextKey = this._contextKey(timezone, country);
        let context = null;
        const cachedContext = this.contextCache.get(contextKey);
        if (cachedContext && nowMs - cachedContext.fetchedAt < CONTEXT_CACHE_TTL_MS) {
            context = cachedContext.context;
        }
        else {
            context = localLevelContext({ timezone, country, holidayThemes: true, timeOfDayEnabled: true }, nowMs);
            this.contextCache.set(contextKey, { context, fetchedAt: nowMs });
        }
        let weather = null;
        if (lat !== undefined && lon !== undefined) {
            weather = await this.getWeather({ lat, lon, timezone }, nowMs);
        }
        const timeOfDay = context.timeOfDay || 'afternoon';
        const season = context.season || 'spring';
        const holidays = context.holidays || [];
        const weatherEffect = weather ? WEATHER_EFFECTS[weather.condition] || WEATHER_EFFECTS.clear : WEATHER_EFFECTS.clear;
        const timeEffect = TIME_OF_DAY_EFFECTS[timeOfDay] || TIME_OF_DAY_EFFECTS.afternoon;
        const activeHoliday = holidays.length > 0 ? holidays[0] : null;
        const holidayKey = activeHoliday ? activeHoliday.name.toLowerCase() : null;
        const holidayEffect = HOLIDAY_EFFECTS[holidayKey] || null;
        const coinMultiplier = Math.min(5, weatherEffect.coinMultiplier * timeEffect.coinMultiplier * (holidayEffect ? holidayEffect.coinMultiplier : 1));
        const lifeBonus = weatherEffect.lifeBonus + (holidayEffect ? holidayEffect.lifeBonus : 0);
        const boosterDropRate = Math.min(5, weatherEffect.boosterDropRate * timeEffect.boosterDropRate * (holidayEffect ? holidayEffect.boosterDropRate : 1));
        const energyRegenMultiplier = timeEffect.energyRegenMultiplier || 1.0;
        const scoreMultiplier = timeEffect.scoreMultiplier || 1.0;
        const starMultiplier = timeEffect.starMultiplier || 1.0;
        const activeEvents = [];
        if (holidayEffect) {
            activeEvents.push({
                id: `holiday-${holidayKey.replace(/\s+/g, '-')}`,
                type: 'holiday',
                name: holidayEffect.name,
                description: holidayEffect.description,
                holidayName: activeHoliday.name,
                holidayType: activeHoliday.type,
            });
        }
        if (weatherEffect.name !== 'Clear Skies' && weather) {
            activeEvents.push({
                id: `weather-${weather.condition}`,
                type: 'weather',
                name: weatherEffect.name,
                description: weatherEffect.description,
                temperature: weather.temperatureC,
                condition: weather.condition,
            });
        }
        const modifiers = {
            playerId,
            location: { lat, lon, timezone, country },
            weather,
            timeOfDay,
            season,
            holidays,
            activeHoliday,
            coinMultiplier,
            lifeBonus,
            boosterDropRate,
            energyRegenMultiplier,
            scoreMultiplier,
            starMultiplier,
            activeEvents,
            computedAt: nowMs,
            expiresAt: nowMs + 15 * 60 * 1000, // 15 minute cache
            fromCache: false,
        };
        // Cache the modifiers
        this.modifierCache.set(modifierKey, { modifiers, generatedAt: nowMs });
        logger.debug('Computed weather/context modifiers', {
            playerId, weather: weather?.condition, timeOfDay, season, holiday: activeHoliday?.name,
            coinMultiplier: coinMultiplier.toFixed(2),
        });
        return modifiers;
    }
    /**
     * Get weather for a location (cached).
     */
    async getWeather(location, nowMs) {
        const cacheKey = `${location.lat.toFixed(2)},${location.lon.toFixed(2)}`;
        const cached = this.weatherCache.get(cacheKey);
        if (cached && nowMs - cached.fetchedAt < this.cacheTtlMs) {
            return cached.weather;
        }
        let weather = null;
        try {
            weather = await levelWeatherService.snapshot({ ...location, weatherEnabled: true }, nowMs);
        }
        catch (error) {
            logger.warn('Weather fetch failed, using clear fallback', { lat: location.lat, lon: location.lon, error: error.message });
            weather = { condition: 'clear', temperature: 20, description: 'Clear (fallback)' };
        }
        this.weatherCache.set(cacheKey, { weather, fetchedAt: nowMs });
        return weather;
    }
    /**
     * Get available weather effect types (for admin/client config).
     */
    getWeatherEffects() {
        return WEATHER_EFFECTS;
    }
    /**
     * Get available holiday effects.
     */
    getHolidayEffects() {
        return HOLIDAY_EFFECTS;
    }
    /**
     * Check if a specific weather condition is active for a location.
     * Uses modifier cache when possible.
     */
    async isWeatherActive(playerContext, condition, { nowMs = Date.now() } = {}) {
        const modifiers = await this.getActiveModifiers(playerContext, { nowMs });
        return modifiers.weather?.condition === condition;
    }
    /**
     * Clear all caches (testing / memory pressure).
     */
    clearCache() {
        this.weatherCache.clear();
        this.contextCache.clear();
        this.modifierCache.clear();
    }
}
export default WeatherEventsService;
//# sourceMappingURL=weather-events-service.js.map