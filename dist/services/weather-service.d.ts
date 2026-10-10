/**
 * Real-Time Weather Service
 * Provides comprehensive weather data, caching, and real-time updates
 */
export class WeatherService {
    logger: Logger;
    supabase: {
        from(table: any): {
            select(columns: any): {
                select(columns?: string): /*elided*/ any;
                eq: (column: any, value: any) => /*elided*/ any;
                neq: (column: any, value: any) => /*elided*/ any;
                gt: (column: any, value: any) => /*elided*/ any;
                gte: (column: any, value: any) => /*elided*/ any;
                lt: (column: any, value: any) => /*elided*/ any;
                lte: (column: any, value: any) => /*elided*/ any;
                in(column: any, values: any): /*elided*/ any;
                match(filterObject: any): /*elided*/ any;
                order(column: any, options?: {}): /*elided*/ any;
                limit(count: any): /*elided*/ any;
                single(): /*elided*/ any;
                then(onFulfilled: any, onRejected: any): Promise<{
                    data: null;
                    error: {
                        message: any;
                        code: any;
                        details: any;
                    };
                } | {
                    data: any;
                    error: null;
                }>;
                catch(onRejected: any): Promise<{
                    data: null;
                    error: {
                        message: any;
                        code: any;
                        details: any;
                    };
                } | {
                    data: any;
                    error: null;
                }>;
            };
            insert(rows: any): {
                select(columns?: string): /*elided*/ any;
                eq: (column: any, value: any) => /*elided*/ any;
                neq: (column: any, value: any) => /*elided*/ any;
                gt: (column: any, value: any) => /*elided*/ any;
                gte: (column: any, value: any) => /*elided*/ any;
                lt: (column: any, value: any) => /*elided*/ any;
                lte: (column: any, value: any) => /*elided*/ any;
                in(column: any, values: any): /*elided*/ any;
                match(filterObject: any): /*elided*/ any;
                order(column: any, options?: {}): /*elided*/ any;
                limit(count: any): /*elided*/ any;
                single(): /*elided*/ any;
                then(onFulfilled: any, onRejected: any): Promise<{
                    data: null;
                    error: {
                        message: any;
                        code: any;
                        details: any;
                    };
                } | {
                    data: any;
                    error: null;
                }>;
                catch(onRejected: any): Promise<{
                    data: null;
                    error: {
                        message: any;
                        code: any;
                        details: any;
                    };
                } | {
                    data: any;
                    error: null;
                }>;
            };
            upsert(rows: any, options?: {}): {
                select(columns?: string): /*elided*/ any;
                eq: (column: any, value: any) => /*elided*/ any;
                neq: (column: any, value: any) => /*elided*/ any;
                gt: (column: any, value: any) => /*elided*/ any;
                gte: (column: any, value: any) => /*elided*/ any;
                lt: (column: any, value: any) => /*elided*/ any;
                lte: (column: any, value: any) => /*elided*/ any;
                in(column: any, values: any): /*elided*/ any;
                match(filterObject: any): /*elided*/ any;
                order(column: any, options?: {}): /*elided*/ any;
                limit(count: any): /*elided*/ any;
                single(): /*elided*/ any;
                then(onFulfilled: any, onRejected: any): Promise<{
                    data: null;
                    error: {
                        message: any;
                        code: any;
                        details: any;
                    };
                } | {
                    data: any;
                    error: null;
                }>;
                catch(onRejected: any): Promise<{
                    data: null;
                    error: {
                        message: any;
                        code: any;
                        details: any;
                    };
                } | {
                    data: any;
                    error: null;
                }>;
            };
            update(patch: any): {
                select(columns?: string): /*elided*/ any;
                eq: (column: any, value: any) => /*elided*/ any;
                neq: (column: any, value: any) => /*elided*/ any;
                gt: (column: any, value: any) => /*elided*/ any;
                gte: (column: any, value: any) => /*elided*/ any;
                lt: (column: any, value: any) => /*elided*/ any;
                lte: (column: any, value: any) => /*elided*/ any;
                in(column: any, values: any): /*elided*/ any;
                match(filterObject: any): /*elided*/ any;
                order(column: any, options?: {}): /*elided*/ any;
                limit(count: any): /*elided*/ any;
                single(): /*elided*/ any;
                then(onFulfilled: any, onRejected: any): Promise<{
                    data: null;
                    error: {
                        message: any;
                        code: any;
                        details: any;
                    };
                } | {
                    data: any;
                    error: null;
                }>;
                catch(onRejected: any): Promise<{
                    data: null;
                    error: {
                        message: any;
                        code: any;
                        details: any;
                    };
                } | {
                    data: any;
                    error: null;
                }>;
            };
            delete(): {
                select(columns?: string): /*elided*/ any;
                eq: (column: any, value: any) => /*elided*/ any;
                neq: (column: any, value: any) => /*elided*/ any;
                gt: (column: any, value: any) => /*elided*/ any;
                gte: (column: any, value: any) => /*elided*/ any;
                lt: (column: any, value: any) => /*elided*/ any;
                lte: (column: any, value: any) => /*elided*/ any;
                in(column: any, values: any): /*elided*/ any;
                match(filterObject: any): /*elided*/ any;
                order(column: any, options?: {}): /*elided*/ any;
                limit(count: any): /*elided*/ any;
                single(): /*elided*/ any;
                then(onFulfilled: any, onRejected: any): Promise<{
                    data: null;
                    error: {
                        message: any;
                        code: any;
                        details: any;
                    };
                } | {
                    data: any;
                    error: null;
                }>;
                catch(onRejected: any): Promise<{
                    data: null;
                    error: {
                        message: any;
                        code: any;
                        details: any;
                    };
                } | {
                    data: any;
                    error: null;
                }>;
            };
        };
    } | (() => never);
    openWeatherApiKey: string | undefined;
    weatherApiEndpoint: string;
    openMeteoEndpoint: string;
    weatherApiKey: string | undefined;
    weatherApiEndpoint2: string;
    weatherCache: Map<any, any>;
    cacheExpiry: number;
    forecastCache: Map<any, any>;
    forecastExpiry: number;
    weatherGameplayEffects: {
        clear: {
            scoreMultiplier: number;
            energyRegen: number;
            specialChance: number;
            visualTheme: string;
            audioTheme: string;
        };
        rain: {
            scoreMultiplier: number;
            energyRegen: number;
            specialChance: number;
            visualTheme: string;
            audioTheme: string;
        };
        snow: {
            scoreMultiplier: number;
            energyRegen: number;
            specialChance: number;
            visualTheme: string;
            audioTheme: string;
        };
        thunderstorm: {
            scoreMultiplier: number;
            energyRegen: number;
            specialChance: number;
            visualTheme: string;
            audioTheme: string;
        };
        fog: {
            scoreMultiplier: number;
            energyRegen: number;
            specialChance: number;
            visualTheme: string;
            audioTheme: string;
        };
        clouds: {
            scoreMultiplier: number;
            energyRegen: number;
            specialChance: number;
            visualTheme: string;
            audioTheme: string;
        };
    };
    /**
     * Initialize weather service
     */
    initializeWeatherService(): Promise<void>;
    /**
     * Setup weather update schedules
     */
    setupWeatherSchedules(): void;
    /**
     * Get current weather for a location
     */
    getCurrentWeather(latitude: any, longitude: any, locationName?: null): Promise<any>;
    /**
     * Get weather forecast for a location
     */
    getWeatherForecast(latitude: any, longitude: any, days?: number): Promise<any>;
    /**
     * Fetch weather data from free APIs with fallback system
     */
    fetchWeatherFromAPI(latitude: any, longitude: any): Promise<any>;
    /**
     * Fetch from Open-Meteo (completely free, no API key)
     */
    fetchFromOpenMeteo(latitude: any, longitude: any): Promise<{
        name: string;
        coord: {
            lat: any;
            lon: any;
        };
        weather: {
            main: any;
            description: any;
            icon: any;
        }[];
        main: {
            temp: any;
            feels_like: number;
            humidity: any;
            pressure: number;
        };
        visibility: number;
        wind: {
            speed: any;
            deg: any;
        };
        clouds: {
            all: number;
        };
        uvi: number;
        sys: {
            country: string;
        };
    }>;
    /**
     * Fetch from OpenWeatherMap free tier
     */
    fetchFromOpenWeatherMap(latitude: any, longitude: any): Promise<any>;
    /**
     * Fetch from WeatherAPI free tier
     */
    fetchFromWeatherAPI(latitude: any, longitude: any): Promise<any>;
    /**
     * Get real weather data from multiple sources (fallback)
     */
    getLocalWeatherData(latitude: any, longitude: any): Promise<any>;
    /**
     * Fetch real weather data from multiple sources
     */
    fetchRealWeatherData(latitude: any, longitude: any): Promise<any>;
    /**
     * Fetch from Weather.gov (US only, completely free)
     */
    fetchFromWeatherGov(latitude: any, longitude: any): Promise<{
        name: string;
        coord: {
            lat: any;
            lon: any;
        };
        weather: {
            main: any;
            description: any;
            icon: any;
        }[];
        main: {
            temp: number;
            feels_like: number;
            humidity: number;
            pressure: number;
        };
        visibility: number;
        wind: {
            speed: number;
            deg: any;
        };
        clouds: {
            all: any;
        };
        uvi: number;
        sys: {
            country: string;
        };
    }>;
    /**
     * Fetch from AccuWeather (free tier)
     */
    fetchFromAccuWeather(latitude: any, longitude: any): Promise<{
        name: string;
        coord: {
            lat: any;
            lon: any;
        };
        weather: {
            main: any;
            description: any;
            icon: any;
        }[];
        main: {
            temp: any;
            feels_like: any;
            humidity: any;
            pressure: any;
        };
        visibility: number;
        wind: {
            speed: any;
            deg: any;
        };
        clouds: {
            all: any;
        };
        uvi: any;
        sys: {
            country: any;
        };
    }>;
    /**
     * Get cached weather data
     */
    getCachedWeatherData(latitude: any, longitude: any): Promise<any>;
    /**
     * Generate realistic weather data based on location and time
     */
    generateRealisticWeatherData(latitude: any, longitude: any): {
        name: string;
        coord: {
            lat: any;
            lon: any;
        };
        weather: {
            main: string | undefined;
            description: any;
            icon: any;
        }[];
        main: {
            temp: number;
            feels_like: number;
            humidity: number;
            pressure: number;
        };
        visibility: any;
        wind: {
            speed: number;
            deg: number;
        };
        clouds: {
            all: number;
        };
        uvi: number;
        sys: {
            country: string;
        };
    };
    /**
     * Convert Open-Meteo data to OpenWeatherMap format
     */
    convertOpenMeteoData(data: any): {
        name: string;
        coord: {
            lat: any;
            lon: any;
        };
        weather: {
            main: any;
            description: any;
            icon: any;
        }[];
        main: {
            temp: any;
            feels_like: number;
            humidity: any;
            pressure: number;
        };
        visibility: number;
        wind: {
            speed: any;
            deg: any;
        };
        clouds: {
            all: number;
        };
        uvi: number;
        sys: {
            country: string;
        };
    };
    /**
     * Convert WMO weather codes to OpenWeatherMap format
     */
    convertWeatherCode(code: any): any;
    /**
     * Get season based on date
     */
    getSeason(date: any): "winter" | "spring" | "summer" | "autumn";
    /**
     * Get weather types for location and season
     */
    getWeatherTypesForLocation(latitude: any, longitude: any, season: any): string[];
    /**
     * Get base temperature for latitude and season
     */
    getBaseTemperatureForLatitude(latitude: any, season: any): any;
    /**
     * Get time of day temperature modifier
     */
    getTimeOfDayModifier(timeOfDay: any): number;
    /**
     * Get realistic humidity based on conditions
     */
    getRealisticHumidity(season: any, weatherType: any, latitude: any): number;
    /**
     * Get realistic pressure based on conditions
     */
    getRealisticPressure(season: any, weatherType: any, latitude: any): number;
    /**
     * Get realistic visibility based on weather
     */
    getRealisticVisibility(weatherType: any): any;
    /**
     * Get realistic wind speed based on weather and season
     */
    getRealisticWindSpeed(weatherType: any, season: any): number;
    /**
     * Get realistic cloud cover based on weather
     */
    getRealisticCloudCover(weatherType: any): number;
    /**
     * Get realistic UV index based on location and time
     */
    getRealisticUVIndex(latitude: any, month: any, hour: any): number;
    /**
     * Get country from coordinates (simplified)
     */
    getCountryFromCoordinates(latitude: any, longitude: any): "US" | "XX" | "AU" | "EU" | "CN" | "ID";
    /**
     * Map Weather.gov conditions to OpenWeatherMap format
     */
    mapWeatherGovCondition(condition: any): any;
    /**
     * Get weather icon from Weather.gov condition
     */
    getWeatherIconFromCondition(condition: any): any;
    /**
     * Map AccuWeather conditions to OpenWeatherMap format
     */
    mapAccuWeatherCondition(condition: any): any;
    /**
     * Get weather icon from AccuWeather
     */
    getWeatherIconFromAccuWeather(iconNumber: any): any;
    /**
     * Get wind direction from text
     */
    getWindDirection(direction: any): any;
    /**
     * Get cloud cover from condition
     */
    getCloudCoverFromCondition(condition: any): any;
    /**
     * Convert Fahrenheit to Celsius
     */
    fahrenheitToCelsius(fahrenheit: any): number;
    /**
     * Convert MPH to m/s
     */
    mphToMps(mph: any): number;
    /**
     * Get temperature for season and time
     */
    getTemperatureForSeason(season: any, hour: any): number;
    /**
     * Get weather description
     */
    getWeatherDescription(weatherType: any): any;
    /**
     * Get weather icon
     */
    getWeatherIcon(weatherType: any): any;
    /**
     * Fetch forecast data from free APIs with fallback system
     */
    fetchForecastFromAPI(latitude: any, longitude: any, days: any): Promise<any>;
    /**
     * Fetch forecast from Open-Meteo
     */
    fetchForecastFromOpenMeteo(latitude: any, longitude: any, days: any): Promise<{
        city: {
            name: string;
            coord: {
                lat: any;
                lon: any;
            };
            country: string;
        };
        list: {
            dt: number;
            main: {
                temp: number;
                temp_min: any;
                temp_max: any;
            };
            weather: {
                main: any;
                description: any;
                icon: any;
            }[];
            clouds: {
                all: number;
            };
            wind: {
                speed: number;
                deg: number;
            };
        }[];
    }>;
    /**
     * Fetch forecast from OpenWeatherMap
     */
    fetchForecastFromOpenWeatherMap(latitude: any, longitude: any, days: any): Promise<any>;
    /**
     * Get local forecast data
     */
    getLocalForecastData(latitude: any, longitude: any, days: any): Promise<{
        city: {
            name: string;
            coord: {
                lat: any;
                lon: any;
            };
            country: string;
        };
        list: {
            dt: number;
            main: {
                temp: number;
                temp_min: number;
                temp_max: number;
            };
            weather: {
                main: string | undefined;
                description: any;
                icon: any;
            }[];
            clouds: {
                all: number;
            };
            wind: {
                speed: number;
                deg: number;
            };
        }[];
    }>;
    /**
     * Convert Open-Meteo forecast to OpenWeatherMap format
     */
    convertOpenMeteoForecast(data: any): {
        city: {
            name: string;
            coord: {
                lat: any;
                lon: any;
            };
            country: string;
        };
        list: {
            dt: number;
            main: {
                temp: number;
                temp_min: any;
                temp_max: any;
            };
            weather: {
                main: any;
                description: any;
                icon: any;
            }[];
            clouds: {
                all: number;
            };
            wind: {
                speed: number;
                deg: number;
            };
        }[];
    };
    /**
     * Process raw weather data into game-friendly format
     */
    processWeatherData(weatherData: any, locationName: any): {
        id: string;
        location: {
            name: any;
            latitude: any;
            longitude: any;
            country: any;
        };
        current: {
            temperature: number;
            feelsLike: number;
            humidity: any;
            pressure: any;
            visibility: number;
            windSpeed: any;
            windDirection: any;
            cloudCover: any;
            uvIndex: any;
        };
        weather: {
            type: any;
            description: any;
            icon: any;
            main: any;
        };
        gameplay: {
            scoreMultiplier: any;
            energyRegenMultiplier: any;
            specialChanceMultiplier: any;
            visualTheme: any;
            audioTheme: any;
            isActive: boolean;
        };
        timestamp: string;
        expiresAt: string;
    };
    /**
     * Process forecast data
     */
    processForecastData(forecastData: any): {
        location: {
            name: any;
            latitude: any;
            longitude: any;
            country: any;
        };
        forecasts: any;
        generatedAt: string;
    };
    /**
     * Map weather condition to game weather type
     */
    mapWeatherCondition(condition: any): any;
    /**
     * Get weather-based gameplay effects
     */
    getWeatherGameplayEffects(weatherType: any): any;
    /**
     * Update all weather data
     */
    updateAllWeatherData(): Promise<void>;
    /**
     * Update weather forecasts
     */
    updateWeatherForecasts(): Promise<void>;
    /**
     * Store weather data in database
     */
    storeWeatherData(weatherData: any): Promise<void>;
    /**
     * Load cached weather data from database
     */
    loadCachedWeatherData(): Promise<void>;
    /**
     * Read a value from the weather cache, honouring the configured expiry.
     *
     * `getCachedWeatherData()` called this but it was never implemented, so
     * every cache lookup threw "this.getFromCache is not a function" and the
     * weather service could never serve cached data.
     *
     * @param {string} key
     * @returns {*} the cached payload, or null when absent / stale
     */
    getFromCache(key: string): any;
    /**
     * Rough test for whether a coordinate lies in a desert climate zone.
     *
     * `getWeatherTypesForLocation()` called this but it was never implemented,
     * so generating local weather threw "this.isDesertRegion is not a function".
     *
     * Uses the subtropical desert belts (roughly 15-35 degrees of latitude,
     * where the Hadley cell descending air produces arid conditions). This is a
     * heuristic for flavour text, not a climate dataset.
     */
    isDesertRegion(latitude: any, longitude: any): boolean;
    /**
     * Clean expired cache entries
     */
    cleanExpiredCache(): void;
    /**
     * Start weather updates
     */
    startWeatherUpdates(): void;
    /**
     * Get weather statistics
     */
    getWeatherStatistics(): Promise<{
        totalUpdates: any;
        weatherTypes: {};
        averageTemperature: number;
        lastUpdate: null;
    }>;
}
import { Logger } from '../core/logger/index.js';
//# sourceMappingURL=weather-service.d.ts.map