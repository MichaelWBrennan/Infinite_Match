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

    this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

    // Free Weather API configuration - 100% open source
    this.openWeatherApiKey = process.env.OPENWEATHER_API_KEY; // Optional for higher limits
    this.weatherApiEndpoint = 'https://api.openweathermap.org/data/2.5';
    
    // Open-Meteo (completely free, no API key required)
    this.openMeteoEndpoint = 'https://api.open-meteo.com/v1';
    
    // WeatherAPI free tier (optional)
    this.weatherApiKey = process.env.WEATHERAPI_API_KEY; // Optional
    this.weatherApiEndpoint2 = 'https://api.weatherapi.com/v1';

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
        timestamp: Date.now(),
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
        timestamp: Date.now(),
      });

      return processedForecast;
    } catch (error) {
      this.logger.error('Failed to get weather forecast', error);
      throw new ServiceError('Failed to fetch weather forecast', error);
    }
  }

  /**
   * Fetch weather data from free APIs with fallback system
   */
  async fetchWeatherFromAPI(latitude, longitude) {
    // Try Open-Meteo first (completely free, no API key)
    try {
      return await this.fetchFromOpenMeteo(latitude, longitude);
    } catch (error) {
      this.logger.warn('Open-Meteo failed, trying OpenWeatherMap', error);
      
      // Try OpenWeatherMap free tier
      try {
        if (this.openWeatherApiKey) {
          return await this.fetchFromOpenWeatherMap(latitude, longitude);
        } else {
          throw new Error('OpenWeatherMap API key not available');
        }
      } catch (error) {
        this.logger.warn('OpenWeatherMap failed, trying WeatherAPI', error);
        
        // Try WeatherAPI free tier
        try {
          if (this.weatherApiKey) {
            return await this.fetchFromWeatherAPI(latitude, longitude);
          } else {
            throw new Error('WeatherAPI key not available');
          }
        } catch (error) {
          this.logger.warn('All APIs failed, using local simulation', error);
          
          // Use local weather simulation as final fallback
          return await this.getLocalWeatherData(latitude, longitude);
        }
      }
    }
  }

  /**
   * Fetch from Open-Meteo (completely free, no API key)
   */
  async fetchFromOpenMeteo(latitude, longitude) {
    const url = `${this.openMeteoEndpoint}/forecast`;
    const params = {
      latitude: latitude,
      longitude: longitude,
      current_weather: true,
      hourly: 'temperature_2m,relativehumidity_2m,precipitation,weathercode',
      timezone: 'auto'
    };

    const response = await axios.get(url, { params, timeout: 10000 });
    return this.convertOpenMeteoData(response.data);
  }

  /**
   * Fetch from OpenWeatherMap free tier
   */
  async fetchFromOpenWeatherMap(latitude, longitude) {
    const url = `${this.weatherApiEndpoint}/weather`;
    const params = {
      lat: latitude,
      lon: longitude,
      appid: this.openWeatherApiKey,
      units: 'metric',
    };

    const response = await axios.get(url, { params, timeout: 10000 });
    return response.data;
  }

  /**
   * Fetch from WeatherAPI free tier
   */
  async fetchFromWeatherAPI(latitude, longitude) {
    const url = `${this.weatherApiEndpoint2}/current.json`;
    const params = {
      key: this.weatherApiKey,
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
   * Fetch forecast data from free APIs with fallback system
   */
  async fetchForecastFromAPI(latitude, longitude, days) {
    // Try Open-Meteo first (completely free, no API key)
    try {
      return await this.fetchForecastFromOpenMeteo(latitude, longitude, days);
    } catch (error) {
      this.logger.warn('Open-Meteo forecast failed, trying OpenWeatherMap', error);
      
      // Try OpenWeatherMap free tier
      try {
        if (this.openWeatherApiKey) {
          return await this.fetchForecastFromOpenWeatherMap(latitude, longitude, days);
        } else {
          throw new Error('OpenWeatherMap API key not available');
        }
      } catch (error) {
        this.logger.warn('All forecast APIs failed, using local simulation', error);
        
        // Use local forecast simulation as final fallback
        return await this.getLocalForecastData(latitude, longitude, days);
      }
    }
  }

  /**
   * Fetch forecast from Open-Meteo
   */
  async fetchForecastFromOpenMeteo(latitude, longitude, days) {
    const url = `${this.openMeteoEndpoint}/forecast`;
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
    const url = `${this.weatherApiEndpoint}/forecast`;
    const params = {
      lat: latitude,
      lon: longitude,
      appid: this.openWeatherApiKey,
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
  processWeatherData(weatherData, locationName) {
    const weatherType = this.mapWeatherCondition(weatherData.weather[0].main.toLowerCase());
    const gameplayEffects =
      this.weatherGameplayEffects[weatherType] || this.weatherGameplayEffects['clear'];

    return {
      id: `weather_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      location: {
        name: locationName || weatherData.name,
        latitude: weatherData.coord.lat,
        longitude: weatherData.coord.lon,
        country: weatherData.sys.country,
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
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.cacheExpiry).toISOString(),
    };
  }

  /**
   * Process forecast data
   */
  processForecastData(forecastData) {
    const forecasts = forecastData.list.map((item) => {
      const weatherType = this.mapWeatherCondition(item.weather[0].main.toLowerCase());
      const gameplayEffects =
        this.weatherGameplayEffects[weatherType] || this.weatherGameplayEffects['clear'];

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
      generatedAt: new Date().toISOString(),
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

      const { data: locations, error } = await this.supabase
        .from('weather_locations')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

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
   * Store weather data in database
   */
  async storeWeatherData(weatherData) {
    try {
      const { error } = await this.supabase.from('weather_data').upsert({
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
        expires_at: weatherData.expiresAt,
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
              longitude: item.longitude,
            },
            current: {
              temperature: item.temperature,
              humidity: item.humidity,
              pressure: item.pressure,
              windSpeed: item.wind_speed,
              cloudCover: item.cloud_cover,
            },
            weather: {
              type: item.weather_type,
            },
            gameplay: item.gameplay_effects,
            timestamp: item.timestamp,
          },
          timestamp: new Date(item.timestamp).getTime(),
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
        lastUpdate: null,
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
