import { Logger } from '../core/logger/index.js';
import { ServiceError } from '../core/errors/ErrorHandler.js';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import cron from 'node-cron';

/**
 * Real-Time Weather Service
 * Provides comprehensive weather data, caching, and real-time updates
 */
class WeatherService {
    constructor() {
        this.logger = new Logger('WeatherService');
        
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );
        
        // Weather API configuration
        this.openWeatherApiKey = process.env.OPENWEATHER_API_KEY;
        this.accuWeatherApiKey = process.env.ACCUWEATHER_API_KEY;
        this.weatherApiEndpoint = 'https://api.openweathermap.org/data/2.5';
        
        // Cache configuration
        this.weatherCache = new Map();
        this.cacheExpiry = 10 * 60 * 1000; // 10 minutes
        this.forecastCache = new Map();
        this.forecastExpiry = 60 * 60 * 1000; // 1 hour
        
        // Weather types and their gameplay effects
        this.weatherGameplayEffects = {
            'clear': { 
                scoreMultiplier: 1.0, 
                energyRegen: 1.0, 
                specialChance: 1.0,
                visualTheme: 'sunny',
                audioTheme: 'cheerful'
            },
            'rain': { 
                scoreMultiplier: 1.2, 
                energyRegen: 0.8, 
                specialChance: 1.3,
                visualTheme: 'rainy',
                audioTheme: 'ambient_rain'
            },
            'snow': { 
                scoreMultiplier: 1.1, 
                energyRegen: 0.9, 
                specialChance: 1.2,
                visualTheme: 'winter',
                audioTheme: 'peaceful_snow'
            },
            'thunderstorm': { 
                scoreMultiplier: 1.5, 
                energyRegen: 0.7, 
                specialChance: 1.8,
                visualTheme: 'stormy',
                audioTheme: 'dramatic_storm'
            },
            'fog': { 
                scoreMultiplier: 0.9, 
                energyRegen: 1.1, 
                specialChance: 0.8,
                visualTheme: 'mysterious',
                audioTheme: 'mysterious_fog'
            },
            'clouds': { 
                scoreMultiplier: 1.0, 
                energyRegen: 1.0, 
                specialChance: 1.0,
                visualTheme: 'cloudy',
                audioTheme: 'neutral'
            }
        };
        
        this.initializeWeatherService();
        this.startWeatherUpdates();
    }

    /**
     * Initialize weather service
     */
    async initializeWeatherService() {
        this.logger.info('Initializing Weather Service');
        
        try {
            // Load cached weather data
            await this.loadCachedWeatherData();
            
            // Start weather update schedules
            this.setupWeatherSchedules();
            
            this.logger.info('Weather Service initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize Weather Service', error);
            throw new ServiceError('Weather service initialization failed', error);
        }
    }

    /**
     * Setup weather update schedules
     */
    setupWeatherSchedules() {
        // Update weather every 10 minutes
        cron.schedule('*/10 * * * *', async () => {
            await this.updateAllWeatherData();
        });

        // Update forecasts every hour
        cron.schedule('0 * * * *', async () => {
            await this.updateWeatherForecasts();
        });

        // Clean cache every 30 minutes
        cron.schedule('*/30 * * * *', () => {
            this.cleanExpiredCache();
        });
    }

    /**
     * Get current weather for a location
     */
    async getCurrentWeather(latitude, longitude, locationName = null) {
        try {
            const cacheKey = `current_${latitude}_${longitude}`;
            
            // Check cache first
            if (this.weatherCache.has(cacheKey)) {
                const cached = this.weatherCache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheExpiry) {
                    return cached.data;
                }
            }

            // Fetch from API
            const weatherData = await this.fetchWeatherFromAPI(latitude, longitude);
            
            // Process weather data
            const processedWeather = this.processWeatherData(weatherData, locationName);
            
            // Cache the result
            this.weatherCache.set(cacheKey, {
                data: processedWeather,
                timestamp: Date.now()
            });

            // Store in database
            await this.storeWeatherData(processedWeather);

            return processedWeather;
        } catch (error) {
            this.logger.error('Failed to get current weather', error);
            throw new ServiceError('Failed to fetch weather data', error);
        }
    }

    /**
     * Get weather forecast for a location
     */
    async getWeatherForecast(latitude, longitude, days = 5) {
        try {
            const cacheKey = `forecast_${latitude}_${longitude}_${days}`;
            
            // Check cache first
            if (this.forecastCache.has(cacheKey)) {
                const cached = this.forecastCache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.forecastExpiry) {
                    return cached.data;
                }
            }

            // Fetch from API
            const forecastData = await this.fetchForecastFromAPI(latitude, longitude, days);
            
            // Process forecast data
            const processedForecast = this.processForecastData(forecastData);
            
            // Cache the result
            this.forecastCache.set(cacheKey, {
                data: processedForecast,
                timestamp: Date.now()
            });

            return processedForecast;
        } catch (error) {
            this.logger.error('Failed to get weather forecast', error);
            throw new ServiceError('Failed to fetch weather forecast', error);
        }
    }

    /**
     * Fetch weather data from OpenWeatherMap API
     */
    async fetchWeatherFromAPI(latitude, longitude) {
        const url = `${this.weatherApiEndpoint}/weather`;
        const params = {
            lat: latitude,
            lon: longitude,
            appid: this.openWeatherApiKey,
            units: 'metric'
        };

        const response = await axios.get(url, { params });
        return response.data;
    }

    /**
     * Fetch forecast data from OpenWeatherMap API
     */
    async fetchForecastFromAPI(latitude, longitude, days) {
        const url = `${this.weatherApiEndpoint}/forecast`;
        const params = {
            lat: latitude,
            lon: longitude,
            appid: this.openWeatherApiKey,
            units: 'metric',
            cnt: days * 8 // 8 forecasts per day (3-hour intervals)
        };

        const response = await axios.get(url, { params });
        return response.data;
    }

    /**
     * Process raw weather data into game-friendly format
     */
    processWeatherData(weatherData, locationName) {
        const weatherType = this.mapWeatherCondition(weatherData.weather[0].main.toLowerCase());
        const gameplayEffects = this.weatherGameplayEffects[weatherType] || this.weatherGameplayEffects['clear'];
        
        return {
            id: `weather_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            location: {
                name: locationName || weatherData.name,
                latitude: weatherData.coord.lat,
                longitude: weatherData.coord.lon,
                country: weatherData.sys.country
            },
            current: {
                temperature: Math.round(weatherData.main.temp),
                feelsLike: Math.round(weatherData.main.feels_like),
                humidity: weatherData.main.humidity,
                pressure: weatherData.main.pressure,
                visibility: weatherData.visibility / 1000, // Convert to km
                windSpeed: weatherData.wind?.speed || 0,
                windDirection: weatherData.wind?.deg || 0,
                cloudCover: weatherData.clouds.all,
                uvIndex: weatherData.uvi || 0
            },
            weather: {
                type: weatherType,
                description: weatherData.weather[0].description,
                icon: weatherData.weather[0].icon,
                main: weatherData.weather[0].main
            },
            gameplay: {
                scoreMultiplier: gameplayEffects.scoreMultiplier,
                energyRegenMultiplier: gameplayEffects.energyRegen,
                specialChanceMultiplier: gameplayEffects.specialChance,
                visualTheme: gameplayEffects.visualTheme,
                audioTheme: gameplayEffects.audioTheme,
                isActive: true
            },
            timestamp: new Date().toISOString(),
            expiresAt: new Date(Date.now() + this.cacheExpiry).toISOString()
        };
    }

    /**
     * Process forecast data
     */
    processForecastData(forecastData) {
        const forecasts = forecastData.list.map(item => {
            const weatherType = this.mapWeatherCondition(item.weather[0].main.toLowerCase());
            const gameplayEffects = this.weatherGameplayEffects[weatherType] || this.weatherGameplayEffects['clear'];
            
            return {
                timestamp: new Date(item.dt * 1000).toISOString(),
                temperature: Math.round(item.main.temp),
                weather: {
                    type: weatherType,
                    description: item.weather[0].description,
                    icon: item.weather[0].icon
                },
                gameplay: {
                    scoreMultiplier: gameplayEffects.scoreMultiplier,
                    energyRegenMultiplier: gameplayEffects.energyRegen,
                    specialChanceMultiplier: gameplayEffects.specialChance,
                    visualTheme: gameplayEffects.visualTheme,
                    audioTheme: gameplayEffects.audioTheme
                }
            };
        });

        return {
            location: {
                name: forecastData.city.name,
                latitude: forecastData.city.coord.lat,
                longitude: forecastData.city.coord.lon,
                country: forecastData.city.country
            },
            forecasts: forecasts,
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Map weather condition to game weather type
     */
    mapWeatherCondition(condition) {
        const conditionMap = {
            'clear': 'clear',
            'sunny': 'clear',
            'partly cloudy': 'clouds',
            'clouds': 'clouds',
            'overcast': 'clouds',
            'rain': 'rain',
            'drizzle': 'rain',
            'shower': 'rain',
            'thunderstorm': 'thunderstorm',
            'storm': 'thunderstorm',
            'snow': 'snow',
            'blizzard': 'snow',
            'fog': 'fog',
            'mist': 'fog',
            'haze': 'fog'
        };

        return conditionMap[condition.toLowerCase()] || 'clear';
    }

    /**
     * Get weather-based gameplay effects
     */
    getWeatherGameplayEffects(weatherType) {
        return this.weatherGameplayEffects[weatherType] || this.weatherGameplayEffects['clear'];
    }

    /**
     * Update all weather data
     */
    async updateAllWeatherData() {
        try {
            this.logger.info('Updating all weather data');
            
            // Get all active locations from database
            const { data: locations, error } = await this.supabase
                .from('weather_locations')
                .select('*')
                .eq('is_active', true);

            if (error) throw error;

            for (const location of locations) {
                try {
                    await this.getCurrentWeather(
                        location.latitude, 
                        location.longitude, 
                        location.name
                    );
                } catch (error) {
                    this.logger.error(`Failed to update weather for ${location.name}`, error);
                }
            }

            this.logger.info('Weather data update completed');
        } catch (error) {
            this.logger.error('Failed to update weather data', error);
        }
    }

    /**
     * Update weather forecasts
     */
    async updateWeatherForecasts() {
        try {
            this.logger.info('Updating weather forecasts');
            
            const { data: locations, error } = await this.supabase
                .from('weather_locations')
                .select('*')
                .eq('is_active', true);

            if (error) throw error;

            for (const location of locations) {
                try {
                    await this.getWeatherForecast(
                        location.latitude, 
                        location.longitude, 
                        5
                    );
                } catch (error) {
                    this.logger.error(`Failed to update forecast for ${location.name}`, error);
                }
            }

            this.logger.info('Weather forecasts update completed');
        } catch (error) {
            this.logger.error('Failed to update weather forecasts', error);
        }
    }

    /**
     * Store weather data in database
     */
    async storeWeatherData(weatherData) {
        try {
            const { error } = await this.supabase
                .from('weather_data')
                .upsert({
                    id: weatherData.id,
                    location_name: weatherData.location.name,
                    latitude: weatherData.location.latitude,
                    longitude: weatherData.location.longitude,
                    weather_type: weatherData.weather.type,
                    temperature: weatherData.current.temperature,
                    humidity: weatherData.current.humidity,
                    pressure: weatherData.current.pressure,
                    wind_speed: weatherData.current.windSpeed,
                    cloud_cover: weatherData.current.cloudCover,
                    gameplay_effects: weatherData.gameplay,
                    timestamp: weatherData.timestamp,
                    expires_at: weatherData.expiresAt
                });

            if (error) throw error;
        } catch (error) {
            this.logger.error('Failed to store weather data', error);
        }
    }

    /**
     * Load cached weather data from database
     */
    async loadCachedWeatherData() {
        try {
            const { data, error } = await this.supabase
                .from('weather_data')
                .select('*')
                .gt('expires_at', new Date().toISOString())
                .order('timestamp', { ascending: false });

            if (error) throw error;

            // Populate cache
            for (const item of data) {
                const cacheKey = `current_${item.latitude}_${item.longitude}`;
                this.weatherCache.set(cacheKey, {
                    data: {
                        id: item.id,
                        location: {
                            name: item.location_name,
                            latitude: item.latitude,
                            longitude: item.longitude
                        },
                        current: {
                            temperature: item.temperature,
                            humidity: item.humidity,
                            pressure: item.pressure,
                            windSpeed: item.wind_speed,
                            cloudCover: item.cloud_cover
                        },
                        weather: {
                            type: item.weather_type
                        },
                        gameplay: item.gameplay_effects,
                        timestamp: item.timestamp
                    },
                    timestamp: new Date(item.timestamp).getTime()
                });
            }

            this.logger.info(`Loaded ${data.length} cached weather entries`);
        } catch (error) {
            this.logger.error('Failed to load cached weather data', error);
        }
    }

    /**
     * Clean expired cache entries
     */
    cleanExpiredCache() {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, value] of this.weatherCache.entries()) {
            if (now - value.timestamp > this.cacheExpiry) {
                this.weatherCache.delete(key);
                cleaned++;
            }
        }

        for (const [key, value] of this.forecastCache.entries()) {
            if (now - value.timestamp > this.forecastExpiry) {
                this.forecastCache.delete(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            this.logger.info(`Cleaned ${cleaned} expired cache entries`);
        }
    }

    /**
     * Start weather updates
     */
    startWeatherUpdates() {
        this.logger.info('Starting weather update schedules');
    }

    /**
     * Get weather statistics
     */
    async getWeatherStatistics() {
        try {
            const { data, error } = await this.supabase
                .from('weather_data')
                .select('weather_type, temperature, timestamp')
                .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

            if (error) throw error;

            const stats = {
                totalUpdates: data.length,
                weatherTypes: {},
                averageTemperature: 0,
                lastUpdate: null
            };

            let totalTemp = 0;
            for (const item of data) {
                stats.weatherTypes[item.weather_type] = (stats.weatherTypes[item.weather_type] || 0) + 1;
                totalTemp += item.temperature;
                if (!stats.lastUpdate || new Date(item.timestamp) > new Date(stats.lastUpdate)) {
                    stats.lastUpdate = item.timestamp;
                }
            }

            stats.averageTemperature = data.length > 0 ? Math.round(totalTemp / data.length) : 0;

            return stats;
        } catch (error) {
            this.logger.error('Failed to get weather statistics', error);
            throw new ServiceError('Failed to get weather statistics', error);
        }
    }
}

export { WeatherService };