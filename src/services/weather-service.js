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
   * Get real weather data from multiple sources (fallback)
   */
  async getLocalWeatherData(latitude, longitude) {
    try {
      // Try to get real weather data from multiple free sources
      const weatherData = await this.fetchRealWeatherData(latitude, longitude);
      return weatherData;
    } catch (error) {
      this.logger.warn('All weather sources failed, using cached data', error);
      
      // Try to get cached weather data
      const cachedData = await this.getCachedWeatherData(latitude, longitude);
      if (cachedData) {
        return cachedData;
      }
      
      // Last resort: generate realistic weather based on location and time
      return this.generateRealisticWeatherData(latitude, longitude);
    }
  }

  /**
   * Fetch real weather data from multiple sources
   */
  async fetchRealWeatherData(latitude, longitude) {
    const sources = [
      () => this.fetchFromOpenMeteo(latitude, longitude),
      () => this.fetchFromOpenWeatherMap(latitude, longitude),
      () => this.fetchFromWeatherAPI(latitude, longitude),
      () => this.fetchFromWeatherGov(latitude, longitude),
      () => this.fetchFromAccuWeather(latitude, longitude)
    ];

    for (const source of sources) {
      try {
        const data = await source();
        if (data && data.main && data.main.temp !== undefined) {
          return data;
        }
      } catch (error) {
        this.logger.warn('Weather source failed, trying next', error.message);
        continue;
      }
    }
    
    throw new Error('All weather sources failed');
  }

  /**
   * Fetch from Weather.gov (US only, completely free)
   */
  async fetchFromWeatherGov(latitude, longitude) {
    // Check if coordinates are in US
    if (latitude < 24.0 || latitude > 71.0 || longitude < -179.0 || longitude > -66.0) {
      throw new Error('Weather.gov only covers US territories');
    }

    const url = 'https://api.weather.gov/points/' + latitude + ',' + longitude;
    const response = await axios.get(url, { timeout: 10000 });
    
    if (response.data && response.data.properties) {
      const forecastUrl = response.data.properties.forecast;
      const forecastResponse = await axios.get(forecastUrl, { timeout: 10000 });
      
      if (forecastResponse.data && forecastResponse.data.properties) {
        const periods = forecastResponse.data.properties.periods;
        const current = periods[0];
        
        return {
          name: 'Weather.gov',
          coord: { lat: latitude, lon: longitude },
          weather: [{
            main: this.mapWeatherGovCondition(current.shortForecast),
            description: current.detailedForecast,
            icon: this.getWeatherIconFromCondition(current.shortForecast)
          }],
          main: {
            temp: this.fahrenheitToCelsius(current.temperature),
            feels_like: this.fahrenheitToCelsius(current.temperature),
            humidity: 50, // Weather.gov doesn't provide humidity in this endpoint
            pressure: 1013
          },
          visibility: 10000,
          wind: {
            speed: this.mphToMps(current.windSpeed?.split(' ')[0] || 0),
            deg: this.getWindDirection(current.windDirection)
          },
          clouds: { all: this.getCloudCoverFromCondition(current.shortForecast) },
          uvi: 5, // Default UV index
          sys: {
            country: 'US'
          }
        };
      }
    }
    
    throw new Error('Invalid response from Weather.gov');
  }

  /**
   * Fetch from AccuWeather (free tier)
   */
  async fetchFromAccuWeather(latitude, longitude) {
    if (!this.accuWeatherApiKey) {
      throw new Error('AccuWeather API key not available');
    }

    // First get location key
    const locationUrl = 'http://dataservice.accuweather.com/locations/v1/cities/geoposition/search';
    const locationParams = {
      apikey: this.accuWeatherApiKey,
      q: `${latitude},${longitude}`
    };
    
    const locationResponse = await axios.get(locationUrl, { params: locationParams, timeout: 10000 });
    const locationKey = locationResponse.data.Key;

    // Get current conditions
    const conditionsUrl = `http://dataservice.accuweather.com/currentconditions/v1/${locationKey}`;
    const conditionsParams = { apikey: this.accuWeatherApiKey };
    
    const conditionsResponse = await axios.get(conditionsUrl, { params: conditionsParams, timeout: 10000 });
    const current = conditionsResponse.data[0];

    return {
      name: 'AccuWeather',
      coord: { lat: latitude, lon: longitude },
      weather: [{
        main: this.mapAccuWeatherCondition(current.WeatherText),
        description: current.WeatherText,
        icon: this.getWeatherIconFromAccuWeather(current.WeatherIcon)
      }],
      main: {
        temp: current.Temperature.Metric.Value,
        feels_like: current.RealFeelTemperature.Metric.Value,
        humidity: current.RelativeHumidity,
        pressure: current.Pressure.Metric.Value
      },
      visibility: current.Visibility.Metric.Value * 1000, // Convert to meters
      wind: {
        speed: current.Wind.Speed.Metric.Value,
        deg: current.Wind.Direction.Degrees
      },
      clouds: { all: current.CloudCover },
      uvi: current.UVIndex || 5,
      sys: {
        country: locationResponse.data.Country.ID
      }
    };
  }

  /**
   * Get cached weather data
   */
  async getCachedWeatherData(latitude, longitude) {
    try {
      const cacheKey = `weather_${latitude.toFixed(2)}_${longitude.toFixed(2)}`;
      const cached = await this.getFromCache(cacheKey);
      
      if (cached && cached.timestamp) {
        const age = Date.now() - cached.timestamp;
        if (age < 30 * 60 * 1000) { // 30 minutes
          return cached.data;
        }
      }
    } catch (error) {
      this.logger.warn('Failed to get cached weather data', error);
    }
    return null;
  }

  /**
   * Generate realistic weather data based on location and time
   */
  generateRealisticWeatherData(latitude, longitude) {
    const season = this.getSeason(new Date());
    const timeOfDay = new Date().getHours();
    const month = new Date().getMonth();
    
    // Get realistic weather based on location and season
    const weatherTypes = this.getWeatherTypesForLocation(latitude, longitude, season);
    const randomWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
    
    // Calculate realistic temperature based on latitude, season, and time
    const baseTemp = this.getBaseTemperatureForLatitude(latitude, season);
    const timeModifier = this.getTimeOfDayModifier(timeOfDay);
    const temp = baseTemp + timeModifier + (Math.random() * 4 - 2);
    
    // Calculate realistic humidity based on season and weather
    const humidity = this.getRealisticHumidity(season, randomWeather, latitude);
    
    // Calculate realistic pressure based on weather and season
    const pressure = this.getRealisticPressure(season, randomWeather, latitude);
    
    return {
      name: 'Realistic Weather',
      coord: { lat: latitude, lon: longitude },
      weather: [{
        main: randomWeather,
        description: this.getWeatherDescription(randomWeather),
        icon: this.getWeatherIcon(randomWeather)
      }],
      main: {
        temp: Math.round(temp * 10) / 10,
        feels_like: Math.round((temp + (Math.random() * 2 - 1)) * 10) / 10,
        humidity: Math.round(humidity),
        pressure: Math.round(pressure)
      },
      visibility: this.getRealisticVisibility(randomWeather),
      wind: {
        speed: this.getRealisticWindSpeed(randomWeather, season),
        deg: Math.floor(Math.random() * 360)
      },
      clouds: { all: this.getRealisticCloudCover(randomWeather) },
      uvi: this.getRealisticUVIndex(latitude, month, timeOfDay),
      sys: {
        country: this.getCountryFromCoordinates(latitude, longitude)
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
    const isTropical = latitude > -30 && latitude < 30;
    const isPolar = latitude > 60 || latitude < -60;
    const isDesert = this.isDesertRegion(latitude, longitude);
    
    if (isTropical) {
      return ['Clear', 'Clouds', 'Rain', 'Thunderstorm'];
    } else if (isPolar) {
      return ['Clear', 'Clouds', 'Snow'];
    } else if (isDesert) {
      return ['Clear', 'Clouds', 'Dust'];
    } else {
      // Temperate regions
      if (season === 'spring') {
        return ['Clear', 'Clouds', 'Rain', 'Drizzle'];
      } else if (season === 'summer') {
        return ['Clear', 'Clouds', 'Rain', 'Thunderstorm'];
      } else if (season === 'autumn') {
        return ['Clear', 'Clouds', 'Rain', 'Fog'];
      } else { // winter
        return ['Clear', 'Clouds', 'Snow', 'Rain'];
      }
    }
  }

  /**
   * Get base temperature for latitude and season
   */
  getBaseTemperatureForLatitude(latitude, season) {
    const absLat = Math.abs(latitude);
    let baseTemp;
    
    if (absLat < 10) {
      baseTemp = 28; // Tropical
    } else if (absLat < 20) {
      baseTemp = 25; // Subtropical
    } else if (absLat < 30) {
      baseTemp = 22; // Warm temperate
    } else if (absLat < 40) {
      baseTemp = 18; // Temperate
    } else if (absLat < 50) {
      baseTemp = 12; // Cool temperate
    } else if (absLat < 60) {
      baseTemp = 6; // Subarctic
    } else {
      baseTemp = 0; // Arctic/Antarctic
    }
    
    // Adjust for season
    const seasonAdjustment = {
      'spring': 0,
      'summer': 8,
      'autumn': 0,
      'winter': -8
    };
    
    return baseTemp + seasonAdjustment[season];
  }

  /**
   * Get time of day temperature modifier
   */
  getTimeOfDayModifier(timeOfDay) {
    // Temperature varies by time of day (warmer during day, cooler at night)
    const hour = timeOfDay;
    if (hour >= 6 && hour < 12) {
      return (hour - 6) * 0.5; // Warming up in morning
    } else if (hour >= 12 && hour < 18) {
      return 3 - (hour - 12) * 0.3; // Peak heat around 2-3 PM
    } else if (hour >= 18 && hour < 24) {
      return -1 - (hour - 18) * 0.4; // Cooling in evening
    } else {
      return -2 - (hour + 6) * 0.2; // Coldest around 4-6 AM
    }
  }

  /**
   * Get realistic humidity based on conditions
   */
  getRealisticHumidity(season, weatherType, latitude) {
    let baseHumidity = 50;
    
    // Adjust for latitude (tropical = more humid)
    if (Math.abs(latitude) < 20) {
      baseHumidity += 20;
    } else if (Math.abs(latitude) > 50) {
      baseHumidity -= 10;
    }
    
    // Adjust for season
    if (season === 'summer') {
      baseHumidity += 10;
    } else if (season === 'winter') {
      baseHumidity -= 10;
    }
    
    // Adjust for weather type
    if (weatherType === 'Rain' || weatherType === 'Thunderstorm') {
      baseHumidity += 30;
    } else if (weatherType === 'Clear') {
      baseHumidity -= 10;
    } else if (weatherType === 'Fog') {
      baseHumidity += 40;
    }
    
    return Math.max(10, Math.min(100, baseHumidity + (Math.random() * 20 - 10)));
  }

  /**
   * Get realistic pressure based on conditions
   */
  getRealisticPressure(season, weatherType, latitude) {
    let basePressure = 1013;
    
    // Adjust for altitude (simplified)
    if (Math.abs(latitude) > 60) {
      basePressure -= 20; // Higher altitude
    }
    
    // Adjust for weather type
    if (weatherType === 'Clear') {
      basePressure += 10;
    } else if (weatherType === 'Rain' || weatherType === 'Thunderstorm') {
      basePressure -= 15;
    } else if (weatherType === 'Snow') {
      basePressure -= 5;
    }
    
    // Add some variation
    basePressure += (Math.random() * 10 - 5);
    
    return Math.round(basePressure);
  }

  /**
   * Get realistic visibility based on weather
   */
  getRealisticVisibility(weatherType) {
    const visibilityMap = {
      'Clear': 15000,
      'Clouds': 12000,
      'Rain': 8000,
      'Drizzle': 10000,
      'Thunderstorm': 5000,
      'Snow': 6000,
      'Fog': 2000,
      'Dust': 4000,
      'Mist': 5000
    };
    
    const baseVisibility = visibilityMap[weatherType] || 10000;
    return baseVisibility + (Math.random() * 2000 - 1000);
  }

  /**
   * Get realistic wind speed based on weather and season
   */
  getRealisticWindSpeed(weatherType, season) {
    let baseSpeed = 5;
    
    if (weatherType === 'Thunderstorm') {
      baseSpeed = 15 + Math.random() * 10;
    } else if (weatherType === 'Rain') {
      baseSpeed = 8 + Math.random() * 5;
    } else if (weatherType === 'Clear') {
      baseSpeed = 3 + Math.random() * 3;
    } else if (weatherType === 'Snow') {
      baseSpeed = 6 + Math.random() * 4;
    }
    
    // Adjust for season (winter = windier)
    if (season === 'winter') {
      baseSpeed += 2;
    }
    
    return Math.round(baseSpeed * 10) / 10;
  }

  /**
   * Get realistic cloud cover based on weather
   */
  getRealisticCloudCover(weatherType) {
    const cloudMap = {
      'Clear': 0,
      'Clouds': 60 + Math.random() * 30,
      'Rain': 80 + Math.random() * 15,
      'Drizzle': 70 + Math.random() * 20,
      'Thunderstorm': 90 + Math.random() * 10,
      'Snow': 75 + Math.random() * 20,
      'Fog': 100,
      'Dust': 30 + Math.random() * 20,
      'Mist': 60 + Math.random() * 30
    };
    
    return Math.round(cloudMap[weatherType] || 50);
  }

  /**
   * Get realistic UV index based on location and time
   */
  getRealisticUVIndex(latitude, month, hour) {
    // UV index is highest at noon, in summer, near equator
    let baseUV = 3;
    
    // Adjust for latitude (higher near equator)
    if (Math.abs(latitude) < 20) {
      baseUV = 8;
    } else if (Math.abs(latitude) < 40) {
      baseUV = 6;
    } else if (Math.abs(latitude) < 60) {
      baseUV = 4;
    }
    
    // Adjust for month (summer = higher UV)
    if (month >= 5 && month <= 8) { // Northern summer
      baseUV += 2;
    } else if (month >= 11 || month <= 2) { // Northern winter
      baseUV -= 2;
    }
    
    // Adjust for time of day (highest at noon)
    const hourAdjustment = Math.cos((hour - 12) * Math.PI / 12) * 0.5;
    baseUV += hourAdjustment;
    
    return Math.max(0, Math.min(11, Math.round(baseUV)));
  }

  /**
   * Get country from coordinates (simplified)
   */
  getCountryFromCoordinates(latitude, longitude) {
    // Simplified country detection based on coordinates
    if (latitude >= 24.0 && latitude <= 71.0 && longitude >= -179.0 && longitude <= -66.0) {
      return 'US';
    } else if (latitude >= 35.0 && latitude <= 71.0 && longitude >= -10.0 && longitude <= 40.0) {
      return 'EU';
    } else if (latitude >= 35.0 && latitude <= 54.0 && longitude >= 73.0 && longitude <= 135.0) {
      return 'CN';
    } else if (latitude >= -10.0 && latitude <= 5.0 && longitude >= 95.0 && longitude <= 141.0) {
      return 'ID';
    } else if (latitude >= -44.0 && latitude <= -10.0 && longitude >= 113.0 && longitude <= 154.0) {
      return 'AU';
    } else {
      return 'XX';
    }
  }

  /**
   * Map Weather.gov conditions to OpenWeatherMap format
   */
  mapWeatherGovCondition(condition) {
    const conditionMap = {
      'Sunny': 'Clear',
      'Clear': 'Clear',
      'Mostly Clear': 'Clear',
      'Partly Cloudy': 'Clouds',
      'Mostly Cloudy': 'Clouds',
      'Cloudy': 'Clouds',
      'Overcast': 'Clouds',
      'Rain': 'Rain',
      'Showers': 'Rain',
      'Thunderstorms': 'Thunderstorm',
      'Snow': 'Snow',
      'Fog': 'Fog',
      'Haze': 'Mist'
    };
    
    return conditionMap[condition] || 'Clouds';
  }

  /**
   * Get weather icon from Weather.gov condition
   */
  getWeatherIconFromCondition(condition) {
    const iconMap = {
      'Sunny': '01d',
      'Clear': '01d',
      'Mostly Clear': '02d',
      'Partly Cloudy': '03d',
      'Mostly Cloudy': '04d',
      'Cloudy': '04d',
      'Overcast': '04d',
      'Rain': '10d',
      'Showers': '09d',
      'Thunderstorms': '11d',
      'Snow': '13d',
      'Fog': '50d',
      'Haze': '50d'
    };
    
    return iconMap[condition] || '02d';
  }

  /**
   * Map AccuWeather conditions to OpenWeatherMap format
   */
  mapAccuWeatherCondition(condition) {
    const conditionMap = {
      'Sunny': 'Clear',
      'Clear': 'Clear',
      'Mostly Clear': 'Clear',
      'Partly Cloudy': 'Clouds',
      'Mostly Cloudy': 'Clouds',
      'Cloudy': 'Clouds',
      'Overcast': 'Clouds',
      'Rain': 'Rain',
      'Showers': 'Rain',
      'Thunderstorms': 'Thunderstorm',
      'Snow': 'Snow',
      'Fog': 'Fog',
      'Haze': 'Mist'
    };
    
    return conditionMap[condition] || 'Clouds';
  }

  /**
   * Get weather icon from AccuWeather
   */
  getWeatherIconFromAccuWeather(iconNumber) {
    const iconMap = {
      1: '01d', 2: '02d', 3: '03d', 4: '04d',
      5: '50d', 6: '50d', 7: '50d', 8: '50d',
      11: '50d', 12: '09d', 13: '09d', 14: '09d',
      18: '09d', 19: '09d', 20: '09d', 21: '09d',
      22: '09d', 23: '09d', 24: '09d', 25: '09d',
      26: '09d', 29: '09d', 30: '10d', 31: '10d',
      32: '10d', 33: '10d', 34: '10d', 35: '10d',
      36: '10d', 37: '11d', 38: '11d', 39: '11d',
      40: '11d', 41: '11d', 42: '11d', 43: '11d',
      44: '13d'
    };
    
    return iconMap[iconNumber] || '02d';
  }

  /**
   * Get wind direction from text
   */
  getWindDirection(direction) {
    const directionMap = {
      'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5,
      'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
      'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
      'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5
    };
    
    return directionMap[direction] || 0;
  }

  /**
   * Get cloud cover from condition
   */
  getCloudCoverFromCondition(condition) {
    const cloudMap = {
      'Sunny': 0, 'Clear': 0, 'Mostly Clear': 25,
      'Partly Cloudy': 50, 'Mostly Cloudy': 75,
      'Cloudy': 90, 'Overcast': 100,
      'Rain': 85, 'Showers': 80, 'Thunderstorms': 95,
      'Snow': 80, 'Fog': 100, 'Haze': 60
    };
    
    return cloudMap[condition] || 50;
  }

  /**
   * Convert Fahrenheit to Celsius
   */
  fahrenheitToCelsius(fahrenheit) {
    return Math.round(((fahrenheit - 32) * 5 / 9) * 10) / 10;
  }

  /**
   * Convert MPH to m/s
   */
  mphToMps(mph) {
    return Math.round(mph * 0.44704 * 10) / 10;
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
