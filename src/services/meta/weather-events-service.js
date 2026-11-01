/**
 * Weather & Context Events Service - real-world weather-linked gameplay.
 *
 * Ties real-world weather (from MET Norway / Open-Meteo via weather-context.js),
 * time of day, and holidays (from location-context.js) to in-game events and
 * modifiers. Examples:
 *   - Rainy day: double coin rewards
 *   - Snowstorm: free life refill
 *   - Storm: bonus booster drops
 *   - Clear night: star rush event
 *   - Holiday: themed event + bonus prizes
 *
 * All weather data is server-fetched and cached; clients cannot spoof weather.
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

/**
 * WeatherEventsService - computes active weather/context gameplay modifiers.
 */
export class WeatherEventsService {
  constructor() {
    this.logger = new Logger('WeatherEventsService');
    this.weatherCache = new Map(); // lat/lon -> { weather, fetchedAt }
    this.cacheTtlMs = 30 * 60 * 1000; // 30 minutes
  }

  /**
   * Get active gameplay modifiers for a player based on their location/time.
   * playerContext - { lat, lon, timezone, country, playerId }
   * nowMs - reference time (default: now)
   */
  async getActiveModifiers(playerContext = {}, { nowMs = Date.now() } = {}) {
    const { lat, lon, timezone = 'UTC', country = 'US', playerId } = playerContext;

    // Build full local context (timeOfDay, season, holidays, civil date)
    const context = localLevelContext({ timezone, country, holidayThemes: true, timeOfDayEnabled: true }, nowMs);

    // Fetch current weather (cached)
    let weather = null;
    if (lat !== undefined && lon !== undefined) {
      weather = await this.getWeather({ lat, lon, timezone }, nowMs);
    }

    const timeOfDay = context.timeOfDay || 'afternoon';
    const season = context.season || 'spring';
    const holidays = context.holidays || [];

    // Build combined modifier
    const weatherEffect = weather ? WEATHER_EFFECTS[weather.condition] || WEATHER_EFFECTS.clear : WEATHER_EFFECTS.clear;
    const timeEffect = TIME_OF_DAY_EFFECTS[timeOfDay] || TIME_OF_DAY_EFFECTS.afternoon;

    // Holiday effect: use the first active holiday
    const activeHoliday = holidays.length > 0 ? holidays[0] : null;
    const holidayKey = activeHoliday ? activeHoliday.name.toLowerCase() : null;
    const holidayEffect = HOLIDAY_EFFECTS[holidayKey] || null;

    // Combine multipliers (weather * time * holiday, capped)
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
    };

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
    } catch (error) {
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
   */
  async isWeatherActive(playerContext, condition, { nowMs = Date.now() } = {}) {
    const modifiers = await this.getActiveModifiers(playerContext, { nowMs });
    return modifiers.weather?.condition === condition;
  }
}

export default WeatherEventsService;
