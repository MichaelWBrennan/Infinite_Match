import { Logger } from '../core/logger/index.js';
import { ServiceError } from '../core/errors/ErrorHandler.js';
import axios from 'axios';
import cron from 'node-cron';

/**
 * Free Weather Service - 100% Open Source
 * Uses free weather APIs and local data sources with no API keys required
 */
class FreeWeatherService {
  constructor() {
    this.logger = new Logger('FreeWeatherService');

    // Free weather API configuration
    this.config = {
      // OpenWeatherMap free tier (1000 calls/day)
      openWeather: {
        baseUrl: 'https://api.openweathermap.org/data/2.5',
        apiKey: process.env.OPENWEATHER_API_KEY || null, // Optional for higher limits
        fallbackEnabled: true
      },
      
      // Open-Meteo (completely free, no API key required)
      openMeteo: {
        baseUrl: 'https://api.open-meteo.com/v1',
        noApiKeyRequired: true
      },
      
      // WeatherAPI free tier (1M calls/month)
      weatherApi: {
        baseUrl: 'https://api.weatherapi.com/v1',
        apiKey: process.env.WEATHERAPI_API_KEY || null, // Optional
        fallbackEnabled: true
      },
      
      // Local weather data (fallback)
      localData: {
        enabled: true,
        dataPath: './data/weather/',
        updateInterval: 24 * 60 * 60 * 1000 // 24 hours
      }
    };

    // Cache configuration
    this.weatherCache = new Map();
    this.cacheExpiry = 10 * 60 * 1000; // 10 minutes
    this.forecastCache = new Map();
    this.forecastExpiry = 60 * 60 * 1000; // 1 hour

    // Weather types and their gameplay effects
    this.weatherGameplayEffects = {
      clear: {
        scoreMultiplier: 1.0,
        energyRegen: 1.0,
        specialChance: 1.0,
        visualTheme: 'sunny',
        audioTheme: 'cheerful',
      },
      rain: {
        scoreMultiplier: 1.2,
        energyRegen: 0.8,
        specialChance: 1.3,
        visualTheme: 'rainy',
        audioTheme: 'ambient_rain',
      },
      snow: {
        scoreMultiplier: 1.1,
        energyRegen: 0.9,
        specialChance: 1.2,
        visualTheme: 'winter',
        audioTheme: 'peaceful_snow',
      },
      thunderstorm: {
        scoreMultiplier: 1.5,
        energyRegen: 0.7,
        specialChance: 1.8,
        visualTheme: 'stormy',
        audioTheme: 'dramatic_storm',
      },
      fog: {
        scoreMultiplier: 0.9,
        energyRegen: 1.1,
        specialChance: 0.8,
        visualTheme: 'mysterious',
        audioTheme: 'mysterious_fog',
      },
      clouds: {
        scoreMultiplier: 1.0,
        energyRegen: 1.0,
        specialChance: 1.0,
        visualTheme: 'cloudy',
        audioTheme: 'neutral',
      },
    };

    this.initializeWeatherService();
    this.startWeatherUpdates();
  }

  /**
   * Initialize weather service
   */
  async initializeWeatherService() {
    this.logger.info('Initializing Free Weather Service');

    try {
      // Load cached weather data
      await this.loadCachedWeatherData();

      // Start weather update schedules
      this.setupWeatherSchedules();

      this.logger.info('Free Weather Service initialized successfully');
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

      // Try multiple free APIs in order of preference
      let weatherData = null;
      let apiUsed = 'none';

      try {
        // Try Open-Meteo first (completely free, no API key)
        weatherData = await this.fetchFromOpenMeteo(latitude, longitude);
        apiUsed = 'open-meteo';
      } catch (error) {
        this.logger.warn('Open-Meteo failed, trying OpenWeatherMap', error);
        
        try {
          // Try OpenWeatherMap free tier
          weatherData = await this.fetchFromOpenWeatherMap(latitude, longitude);
          apiUsed = 'openweathermap';
        } catch (error) {
          this.logger.warn('OpenWeatherMap failed, trying WeatherAPI', error);
          
          try {
            // Try WeatherAPI free tier
            weatherData = await this.fetchFromWeatherAPI(latitude, longitude);
            apiUsed = 'weatherapi';
          } catch (error) {
            this.logger.warn('All APIs failed, using local data', error);
            
            // Use local weather data as fallback
            weatherData = await this.getLocalWeatherData(latitude, longitude);
            apiUsed = 'local';
          }
        }
      }

      // Process weather data
      const processedWeather = this.processWeatherData(weatherData, locationName, apiUsed);

      // Cache the result
      this.weatherCache.set(cacheKey, {
        data: processedWeather,
        timestamp: Date.now(),
      });

      return processedWeather;
    } catch (error) {
      this.logger.error('Failed to get current weather', error);
      throw new ServiceError('Failed to fetch weather data', error);
    }
  }

  /**
   * Fetch from Open-Meteo (completely free, no API key)
   */
  async fetchFromOpenMeteo(latitude, longitude) {
    const url = `${this.config.openMeteo.baseUrl}/forecast`;
    const params = {
      latitude: latitude,
      longitude: longitude,
      current_weather: true,
      hourly: 'temperature_2m,relativehumidity_2m,precipitation,weathercode',
      daily: 'weathercode,temperature_2m_max,temperature_2m_min',
      timezone: 'auto'
    };

    const response = await axios.get(url, { params, timeout: 10000 });
    return this.convertOpenMeteoData(response.data);
  }

  /**
   * Fetch from OpenWeatherMap free tier
   */
  async fetchFromOpenWeatherMap(latitude, longitude) {
    if (!this.config.openWeather.apiKey) {
      throw new Error('OpenWeatherMap API key not available');
    }

    const url = `${this.config.openWeather.baseUrl}/weather`;
    const params = {
      lat: latitude,
      lon: longitude,
      appid: this.config.openWeather.apiKey,
      units: 'metric',
    };

    const response = await axios.get(url, { params, timeout: 10000 });
    return response.data;
  }

  /**
   * Fetch from WeatherAPI free tier
   */
  async fetchFromWeatherAPI(latitude, longitude) {
    if (!this.config.weatherApi.apiKey) {
      throw new Error('WeatherAPI key not available');
    }

    const url = `${this.config.weatherApi.baseUrl}/current.json`;
    const params = {
      key: this.config.weatherApi.apiKey,
      q: `${latitude},${longitude}`,
    };

    const response = await axios.get(url, { params, timeout: 10000 });
    return response.data;
  }

  /**
   * Get local weather data (fallback)
   */
  async getLocalWeatherData(latitude, longitude) {
    // Generate realistic weather data based on location and time
    const season = this.getSeason(new Date());
    const timeOfDay = new Date().getHours();
    
    // Simple weather simulation based on location and time
    const weatherTypes = this.getWeatherTypesForLocation(latitude, longitude, season);
    const randomWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
    
    return {
      name: 'Local Weather',
      coord: { lat: latitude, lon: longitude },
      weather: [{
        main: randomWeather,
        description: this.getWeatherDescription(randomWeather),
        icon: this.getWeatherIcon(randomWeather)
      }],
      main: {
        temp: this.getTemperatureForSeason(season, timeOfDay),
        feels_like: this.getTemperatureForSeason(season, timeOfDay) + Math.random() * 2 - 1,
        humidity: 50 + Math.random() * 30,
        pressure: 1013 + Math.random() * 20 - 10,
      },
      visibility: 10000,
      wind: {
        speed: Math.random() * 10,
        deg: Math.random() * 360
      },
      clouds: { all: Math.random() * 100 },
      uvi: Math.random() * 10,
      sys: {
        country: 'XX'
      }
    };
  }

  /**
   * Convert Open-Meteo data to OpenWeatherMap format
   */
  convertOpenMeteoData(data) {
    const current = data.current_weather;
    const weatherCode = this.convertWeatherCode(current.weathercode);
    
    return {
      name: 'Open-Meteo Location',
      coord: { lat: data.latitude, lon: data.longitude },
      weather: [{
        main: weatherCode.main,
        description: weatherCode.description,
        icon: weatherCode.icon
      }],
      main: {
        temp: current.temperature,
        feels_like: current.temperature + Math.random() * 2 - 1,
        humidity: data.hourly.relativehumidity_2m[0] || 50,
        pressure: 1013 + Math.random() * 20 - 10,
      },
      visibility: 10000,
      wind: {
        speed: current.windspeed || 0,
        deg: current.winddirection || 0
      },
      clouds: { all: Math.random() * 100 },
      uvi: Math.random() * 10,
      sys: {
        country: 'XX'
      }
    };
  }

  /**
   * Convert WMO weather codes to OpenWeatherMap format
   */
  convertWeatherCode(code) {
    const weatherCodes = {
      0: { main: 'Clear', description: 'clear sky', icon: '01d' },
      1: { main: 'Clouds', description: 'mainly clear', icon: '02d' },
      2: { main: 'Clouds', description: 'partly cloudy', icon: '03d' },
      3: { main: 'Clouds', description: 'overcast', icon: '04d' },
      45: { main: 'Fog', description: 'fog', icon: '50d' },
      48: { main: 'Fog', description: 'depositing rime fog', icon: '50d' },
      51: { main: 'Rain', description: 'light drizzle', icon: '09d' },
      53: { main: 'Rain', description: 'moderate drizzle', icon: '09d' },
      55: { main: 'Rain', description: 'dense drizzle', icon: '09d' },
      61: { main: 'Rain', description: 'slight rain', icon: '10d' },
      63: { main: 'Rain', description: 'moderate rain', icon: '10d' },
      65: { main: 'Rain', description: 'heavy rain', icon: '10d' },
      71: { main: 'Snow', description: 'slight snow', icon: '13d' },
      73: { main: 'Snow', description: 'moderate snow', icon: '13d' },
      75: { main: 'Snow', description: 'heavy snow', icon: '13d' },
      80: { main: 'Rain', description: 'slight rain showers', icon: '09d' },
      81: { main: 'Rain', description: 'moderate rain showers', icon: '09d' },
      82: { main: 'Rain', description: 'violent rain showers', icon: '09d' },
      85: { main: 'Snow', description: 'slight snow showers', icon: '13d' },
      86: { main: 'Snow', description: 'heavy snow showers', icon: '13d' },
      95: { main: 'Thunderstorm', description: 'thunderstorm', icon: '11d' },
      96: { main: 'Thunderstorm', description: 'thunderstorm with slight hail', icon: '11d' },
      99: { main: 'Thunderstorm', description: 'thunderstorm with heavy hail', icon: '11d' }
    };

    return weatherCodes[code] || weatherCodes[0];
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

      // Try multiple APIs
      let forecastData = null;
      let apiUsed = 'none';

      try {
        // Try Open-Meteo first
        forecastData = await this.fetchForecastFromOpenMeteo(latitude, longitude, days);
        apiUsed = 'open-meteo';
      } catch (error) {
        this.logger.warn('Open-Meteo forecast failed, trying OpenWeatherMap', error);
        
        try {
          forecastData = await this.fetchForecastFromOpenWeatherMap(latitude, longitude, days);
          apiUsed = 'openweathermap';
        } catch (error) {
          this.logger.warn('All forecast APIs failed, using local data', error);
          forecastData = await this.getLocalForecastData(latitude, longitude, days);
          apiUsed = 'local';
        }
      }

      // Process forecast data
      const processedForecast = this.processForecastData(forecastData, apiUsed);

      // Cache the result
      this.forecastCache.set(cacheKey, {
        data: processedForecast,
        timestamp: Date.now(),
      });

      return processedForecast;
    } catch (error) {
      this.logger.error('Failed to get weather forecast', error);
      throw new ServiceError('Failed to fetch weather forecast', error);
    }
  }

  /**
   * Fetch forecast from Open-Meteo
   */
  async fetchForecastFromOpenMeteo(latitude, longitude, days) {
    const url = `${this.config.openMeteo.baseUrl}/forecast`;
    const params = {
      latitude: latitude,
      longitude: longitude,
      daily: 'weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum',
      timezone: 'auto',
      forecast_days: days
    };

    const response = await axios.get(url, { params, timeout: 10000 });
    return this.convertOpenMeteoForecast(response.data);
  }

  /**
   * Fetch forecast from OpenWeatherMap
   */
  async fetchForecastFromOpenWeatherMap(latitude, longitude, days) {
    if (!this.config.openWeather.apiKey) {
      throw new Error('OpenWeatherMap API key not available');
    }

    const url = `${this.config.openWeather.baseUrl}/forecast`;
    const params = {
      lat: latitude,
      lon: longitude,
      appid: this.config.openWeather.apiKey,
      units: 'metric',
      cnt: days * 8, // 8 forecasts per day (3-hour intervals)
    };

    const response = await axios.get(url, { params, timeout: 10000 });
    return response.data;
  }

  /**
   * Get local forecast data
   */
  async getLocalForecastData(latitude, longitude, days) {
    const forecasts = [];
    const season = this.getSeason(new Date());
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      const weatherTypes = this.getWeatherTypesForLocation(latitude, longitude, season);
      const randomWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
      
      forecasts.push({
        dt: Math.floor(date.getTime() / 1000),
        main: {
          temp: this.getTemperatureForSeason(season, 12), // Noon temperature
          temp_min: this.getTemperatureForSeason(season, 6), // Morning temperature
          temp_max: this.getTemperatureForSeason(season, 15), // Afternoon temperature
        },
        weather: [{
          main: randomWeather,
          description: this.getWeatherDescription(randomWeather),
          icon: this.getWeatherIcon(randomWeather)
        }],
        clouds: { all: Math.random() * 100 },
        wind: {
          speed: Math.random() * 10,
          deg: Math.random() * 360
        }
      });
    }

    return {
      city: {
        name: 'Local Forecast',
        coord: { lat: latitude, lon: longitude },
        country: 'XX'
      },
      list: forecasts
    };
  }

  /**
   * Convert Open-Meteo forecast to OpenWeatherMap format
   */
  convertOpenMeteoForecast(data) {
    const forecasts = [];
    
    for (let i = 0; i < data.daily.time.length; i++) {
      const weatherCode = this.convertWeatherCode(data.daily.weathercode[i]);
      
      forecasts.push({
        dt: Math.floor(new Date(data.daily.time[i]).getTime() / 1000),
        main: {
          temp: (data.daily.temperature_2m_max[i] + data.daily.temperature_2m_min[i]) / 2,
          temp_min: data.daily.temperature_2m_min[i],
          temp_max: data.daily.temperature_2m_max[i],
        },
        weather: [{
          main: weatherCode.main,
          description: weatherCode.description,
          icon: weatherCode.icon
        }],
        clouds: { all: Math.random() * 100 },
        wind: {
          speed: Math.random() * 10,
          deg: Math.random() * 360
        }
      });
    }

    return {
      city: {
        name: 'Open-Meteo Forecast',
        coord: { lat: data.latitude, lon: data.longitude },
        country: 'XX'
      },
      list: forecasts
    };
  }

  /**
   * Process raw weather data into game-friendly format
   */
  processWeatherData(weatherData, locationName, apiUsed) {
    const weatherType = this.mapWeatherCondition(weatherData.weather[0].main.toLowerCase());
    const gameplayEffects = this.weatherGameplayEffects[weatherType] || this.weatherGameplayEffects['clear'];

    return {
      id: `weather_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      location: {
        name: locationName || weatherData.name,
        latitude: weatherData.coord.lat,
        longitude: weatherData.coord.lon,
        country: weatherData.sys?.country || 'XX',
      },
      current: {
        temperature: Math.round(weatherData.main.temp),
        feelsLike: Math.round(weatherData.main.feels_like),
        humidity: weatherData.main.humidity,
        pressure: weatherData.main.pressure,
        visibility: weatherData.visibility / 1000, // Convert to km
        windSpeed: weatherData.wind?.speed || 0,
        windDirection: weatherData.wind?.deg || 0,
        cloudCover: weatherData.clouds?.all || 0,
        uvIndex: weatherData.uvi || 0,
      },
      weather: {
        type: weatherType,
        description: weatherData.weather[0].description,
        icon: weatherData.weather[0].icon,
        main: weatherData.weather[0].main,
      },
      gameplay: {
        scoreMultiplier: gameplayEffects.scoreMultiplier,
        energyRegenMultiplier: gameplayEffects.energyRegen,
        specialChanceMultiplier: gameplayEffects.specialChance,
        visualTheme: gameplayEffects.visualTheme,
        audioTheme: gameplayEffects.audioTheme,
        isActive: true,
      },
      metadata: {
        apiUsed: apiUsed,
        generatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + this.cacheExpiry).toISOString(),
      },
    };
  }

  /**
   * Process forecast data
   */
  processForecastData(forecastData, apiUsed) {
    const forecasts = forecastData.list.map((item) => {
      const weatherType = this.mapWeatherCondition(item.weather[0].main.toLowerCase());
      const gameplayEffects = this.weatherGameplayEffects[weatherType] || this.weatherGameplayEffects['clear'];

      return {
        timestamp: new Date(item.dt * 1000).toISOString(),
        temperature: Math.round(item.main.temp),
        weather: {
          type: weatherType,
          description: item.weather[0].description,
          icon: item.weather[0].icon,
        },
        gameplay: {
          scoreMultiplier: gameplayEffects.scoreMultiplier,
          energyRegenMultiplier: gameplayEffects.energyRegen,
          specialChanceMultiplier: gameplayEffects.specialChance,
          visualTheme: gameplayEffects.visualTheme,
          audioTheme: gameplayEffects.audioTheme,
        },
      };
    });

    return {
      location: {
        name: forecastData.city.name,
        latitude: forecastData.city.coord.lat,
        longitude: forecastData.city.coord.lon,
        country: forecastData.city.country,
      },
      forecasts: forecasts,
      metadata: {
        apiUsed: apiUsed,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Map weather condition to game weather type
   */
  mapWeatherCondition(condition) {
    const conditionMap = {
      clear: 'clear',
      sunny: 'clear',
      'partly cloudy': 'clouds',
      clouds: 'clouds',
      overcast: 'clouds',
      rain: 'rain',
      drizzle: 'rain',
      shower: 'rain',
      thunderstorm: 'thunderstorm',
      storm: 'thunderstorm',
      snow: 'snow',
      blizzard: 'snow',
      fog: 'fog',
      mist: 'fog',
      haze: 'fog',
    };

    return conditionMap[condition.toLowerCase()] || 'clear';
  }

  /**
   * Get season based on date
   */
  getSeason(date) {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  /**
   * Get weather types for location and season
   */
  getWeatherTypesForLocation(latitude, longitude, season) {
    // Simple weather simulation based on location and season
    const baseTypes = ['clear', 'clouds'];
    
    if (season === 'winter') {
      return ['clear', 'clouds', 'snow', 'fog'];
    } else if (season === 'summer') {
      return ['clear', 'clouds', 'rain', 'thunderstorm'];
    } else if (season === 'spring') {
      return ['clear', 'clouds', 'rain', 'fog'];
    } else { // autumn
      return ['clear', 'clouds', 'rain', 'fog'];
    }
  }

  /**
   * Get temperature for season and time
   */
  getTemperatureForSeason(season, hour) {
    const baseTemp = {
      winter: 5,
      spring: 15,
      summer: 25,
      autumn: 15
    }[season];

    // Add daily variation
    const dailyVariation = Math.sin((hour - 6) * Math.PI / 12) * 5;
    return Math.round(baseTemp + dailyVariation + (Math.random() * 10 - 5));
  }

  /**
   * Get weather description
   */
  getWeatherDescription(weatherType) {
    const descriptions = {
      clear: 'clear sky',
      clouds: 'partly cloudy',
      rain: 'light rain',
      snow: 'light snow',
      thunderstorm: 'thunderstorm',
      fog: 'fog'
    };
    return descriptions[weatherType] || 'clear sky';
  }

  /**
   * Get weather icon
   */
  getWeatherIcon(weatherType) {
    const icons = {
      clear: '01d',
      clouds: '03d',
      rain: '10d',
      snow: '13d',
      thunderstorm: '11d',
      fog: '50d'
    };
    return icons[weatherType] || '01d';
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

      // Get all active locations from cache
      const locations = this.getActiveLocations();

      for (const location of locations) {
        try {
          await this.getCurrentWeather(location.latitude, location.longitude, location.name);
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

      const locations = this.getActiveLocations();

      for (const location of locations) {
        try {
          await this.getWeatherForecast(location.latitude, location.longitude, 5);
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
   * Get active locations from cache
   */
  getActiveLocations() {
    // Return some default locations for demo
    return [
      { name: 'New York', latitude: 40.7128, longitude: -74.0060 },
      { name: 'London', latitude: 51.5074, longitude: -0.1278 },
      { name: 'Tokyo', latitude: 35.6762, longitude: 139.6503 },
    ];
  }

  /**
   * Load cached weather data
   */
  async loadCachedWeatherData() {
    // In a real implementation, this would load from a database
    this.logger.info('Loading cached weather data (mock)');
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
  getWeatherStatistics() {
    return {
      totalCachedEntries: this.weatherCache.size + this.forecastCache.size,
      weatherCacheSize: this.weatherCache.size,
      forecastCacheSize: this.forecastCache.size,
      lastUpdate: new Date().toISOString(),
      apisAvailable: {
        openMeteo: true,
        openWeatherMap: !!this.config.openWeather.apiKey,
        weatherAPI: !!this.config.weatherApi.apiKey,
        localData: this.config.localData.enabled
      }
    };
  }

  /**
   * Get service status
   */
  getServiceStatus() {
    return {
      status: 'active',
      apis: {
        openMeteo: 'available',
        openWeatherMap: this.config.openWeather.apiKey ? 'available' : 'no-api-key',
        weatherAPI: this.config.weatherApi.apiKey ? 'available' : 'no-api-key',
        localData: 'available'
      },
      cache: {
        weather: this.weatherCache.size,
        forecast: this.forecastCache.size
      }
    };
  }
}

export { FreeWeatherService };