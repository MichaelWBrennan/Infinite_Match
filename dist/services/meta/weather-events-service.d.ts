/**
 * WeatherEventsService - computes active weather/context gameplay modifiers.
 */
export class WeatherEventsService {
    logger: Logger;
    weatherCache: Map<any, any>;
    contextCache: Map<any, any>;
    modifierCache: Map<any, any>;
    cacheTtlMs: number;
    maxCacheSize: number;
    _evictCaches({ nowMs }?: {
        nowMs?: number | undefined;
    }): void;
    /**
     * Build a cache key for location context.
     */
    _contextKey(timezone: any, country: any): string;
    /**
     * Build a cache key for combined modifiers.
     */
    _modifierKey(playerId: any, lat: any, lon: any, timezone: any, country: any): string;
    /**
     * Get active gameplay modifiers for a player based on their location/time.
     * playerContext - { lat, lon, timezone, country, playerId }
     * nowMs - reference time (default: now)
     */
    getActiveModifiers(playerContext?: {}, { nowMs }?: {
        nowMs?: number | undefined;
    }): Promise<any>;
    /**
     * Get weather for a location (cached).
     */
    getWeather(location: any, nowMs: any): Promise<any>;
    /**
     * Get available weather effect types (for admin/client config).
     */
    getWeatherEffects(): {
        clear: {
            name: string;
            coinMultiplier: number;
            lifeBonus: number;
            boosterDropRate: number;
            description: string;
        };
        rain: {
            name: string;
            coinMultiplier: number;
            lifeBonus: number;
            boosterDropRate: number;
            description: string;
        };
        snow: {
            name: string;
            coinMultiplier: number;
            lifeBonus: number;
            boosterDropRate: number;
            description: string;
        };
        thunderstorm: {
            name: string;
            coinMultiplier: number;
            lifeBonus: number;
            boosterDropRate: number;
            description: string;
        };
        drizzle: {
            name: string;
            coinMultiplier: number;
            lifeBonus: number;
            boosterDropRate: number;
            description: string;
        };
        sleet: {
            name: string;
            coinMultiplier: number;
            lifeBonus: number;
            boosterDropRate: number;
            description: string;
        };
        fog: {
            name: string;
            coinMultiplier: number;
            lifeBonus: number;
            boosterDropRate: number;
            description: string;
        };
        clouds: {
            name: string;
            coinMultiplier: number;
            lifeBonus: number;
            boosterDropRate: number;
            description: string;
        };
    };
    /**
     * Get available holiday effects.
     */
    getHolidayEffects(): {
        'new years day': {
            name: string;
            coinMultiplier: number;
            lifeBonus: number;
            boosterDropRate: number;
            description: string;
        };
        "valentine's day": {
            name: string;
            coinMultiplier: number;
            lifeBonus: number;
            boosterDropRate: number;
            description: string;
        };
        halloween: {
            name: string;
            coinMultiplier: number;
            lifeBonus: number;
            boosterDropRate: number;
            description: string;
        };
        christmas: {
            name: string;
            coinMultiplier: number;
            lifeBonus: number;
            boosterDropRate: number;
            description: string;
        };
        thanksgiving: {
            name: string;
            coinMultiplier: number;
            lifeBonus: number;
            boosterDropRate: number;
            description: string;
        };
    };
    /**
     * Check if a specific weather condition is active for a location.
     * Uses modifier cache when possible.
     */
    isWeatherActive(playerContext: any, condition: any, { nowMs }?: {
        nowMs?: number | undefined;
    }): Promise<boolean>;
    /**
     * Clear all caches (testing / memory pressure).
     */
    clearCache(): void;
}
export default WeatherEventsService;
import { Logger } from '../../core/logger/index.js';
//# sourceMappingURL=weather-events-service.d.ts.map