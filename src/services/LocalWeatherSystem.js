/**
 * Local Weather System - Simulates weather without external APIs
 */

class LocalWeatherSystem {
  constructor() {
    this.weatherData = {
      current: null,
      forecast: [],
      location: 'Default City',
      lastUpdate: null
    };
    
    this.weatherPatterns = [
      { type: 'sunny', probability: 0.3, bonus: 1.2, description: 'Sunny day bonus!' },
      { type: 'cloudy', probability: 0.25, bonus: 1.0, description: 'Cloudy day' },
      { type: 'rainy', probability: 0.2, bonus: 1.1, description: 'Rainy day boost!' },
      { type: 'snowy', probability: 0.15, bonus: 1.3, description: 'Snowy day special!' },
      { type: 'stormy', probability: 0.1, bonus: 1.5, description: 'Stormy day power!' }
    ];
    
    this.seasonalModifiers = {
      spring: { sunny: 1.1, rainy: 1.2, snowy: 0.5 },
      summer: { sunny: 1.3, rainy: 0.8, snowy: 0.1 },
      autumn: { sunny: 0.9, rainy: 1.1, snowy: 0.3 },
      winter: { sunny: 0.7, rainy: 0.6, snowy: 1.4 }
    };
  }

  async initialize() {
    console.log('🌤️ Initializing Local Weather System...');
    
    this.loadData();
    this.generateWeather();
    this.startWeatherUpdates();
    
    console.log('✅ Local Weather System initialized');
  }

  generateWeather() {
    const now = new Date();
    const season = this.getCurrentSeason(now);
    const timeOfDay = this.getTimeOfDay(now);
    
    // Generate current weather
    this.weatherData.current = this.generateWeatherForTime(now, season, timeOfDay);
    
    // Generate 7-day forecast
    this.weatherData.forecast = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(now.getTime() + (i * 24 * 60 * 60 * 1000));
      const dayWeather = this.generateWeatherForTime(date, season, 'day');
      this.weatherData.forecast.push(dayWeather);
    }
    
    this.weatherData.lastUpdate = now.getTime();
    this.saveData();
  }

  generateWeatherForTime(date, season, timeOfDay) {
    const random = Math.random();
    let cumulativeProbability = 0;
    
    for (const pattern of this.weatherPatterns) {
      let probability = pattern.probability;
      
      // Apply seasonal modifiers
      if (this.seasonalModifiers[season][pattern.type]) {
        probability *= this.seasonalModifiers[season][pattern.type];
      }
      
      // Apply time of day modifiers
      if (timeOfDay === 'night' && pattern.type === 'sunny') {
        probability *= 0.1; // Less likely to be sunny at night
      }
      
      cumulativeProbability += probability;
      
      if (random <= cumulativeProbability) {
        return {
          type: pattern.type,
          temperature: this.generateTemperature(pattern.type, season, timeOfDay),
          humidity: this.generateHumidity(pattern.type),
          windSpeed: this.generateWindSpeed(pattern.type),
          description: pattern.description,
          bonus: pattern.bonus,
          icon: this.getWeatherIcon(pattern.type),
          date: date.toISOString(),
          season: season,
          timeOfDay: timeOfDay
        };
      }
    }
    
    // Fallback to cloudy
    return {
      type: 'cloudy',
      temperature: 20,
      humidity: 60,
      windSpeed: 10,
      description: 'Cloudy day',
      bonus: 1.0,
      icon: '☁️',
      date: date.toISOString(),
      season: season,
      timeOfDay: timeOfDay
    };
  }

  generateTemperature(weatherType, season, timeOfDay) {
    const baseTemps = {
      sunny: 25,
      cloudy: 20,
      rainy: 18,
      snowy: 5,
      stormy: 15
    };
    
    const seasonalModifiers = {
      spring: 0,
      summer: 10,
      autumn: -5,
      winter: -15
    };
    
    const timeModifiers = {
      day: 0,
      night: -5
    };
    
    let temperature = baseTemps[weatherType] + seasonalModifiers[season] + timeModifiers[timeOfDay];
    
    // Add some randomness
    temperature += (Math.random() - 0.5) * 10;
    
    return Math.round(temperature);
  }

  generateHumidity(weatherType) {
    const baseHumidity = {
      sunny: 40,
      cloudy: 60,
      rainy: 80,
      snowy: 70,
      stormy: 85
    };
    
    return baseHumidity[weatherType] + Math.round((Math.random() - 0.5) * 20);
  }

  generateWindSpeed(weatherType) {
    const baseWind = {
      sunny: 5,
      cloudy: 10,
      rainy: 15,
      snowy: 20,
      stormy: 35
    };
    
    return baseWind[weatherType] + Math.round(Math.random() * 10);
  }

  getCurrentSeason(date) {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  getTimeOfDay(date) {
    const hour = date.getHours();
    if (hour >= 6 && hour < 18) return 'day';
    return 'night';
  }

  getWeatherIcon(weatherType) {
    const icons = {
      sunny: '☀️',
      cloudy: '☁️',
      rainy: '🌧️',
      snowy: '❄️',
      stormy: '⛈️'
    };
    return icons[weatherType] || '☁️';
  }

  // ==================== WEATHER DATA ACCESS ====================
  
  getCurrentWeather() {
    return this.weatherData.current;
  }

  getWeatherForecast() {
    return this.weatherData.forecast;
  }

  getWeatherForDate(date) {
    const targetDate = new Date(date);
    const today = new Date();
    const daysDiff = Math.floor((targetDate - today) / (24 * 60 * 60 * 1000));
    
    if (daysDiff === 0) {
      return this.weatherData.current;
    } else if (daysDiff > 0 && daysDiff < 7) {
      return this.weatherData.forecast[daysDiff];
    }
    
    return null;
  }

  getWeatherBonus() {
    return this.weatherData.current ? this.weatherData.current.bonus : 1.0;
  }

  getWeatherDescription() {
    return this.weatherData.current ? this.weatherData.current.description : 'Unknown weather';
  }

  // ==================== WEATHER EVENTS ====================
  
  getWeatherEvents() {
    const currentWeather = this.weatherData.current;
    if (!currentWeather) return [];

    const events = [];
    
    // Special weather events
    if (currentWeather.type === 'stormy') {
      events.push({
        id: 'stormy_power',
        name: 'Stormy Power',
        description: 'Stormy weather gives extra power!',
        bonus: 1.5,
        duration: 24 * 60 * 60 * 1000, // 24 hours
        type: 'weather_bonus'
      });
    }
    
    if (currentWeather.type === 'snowy') {
      events.push({
        id: 'snowy_magic',
        name: 'Snowy Magic',
        description: 'Snowy weather creates magical effects!',
        bonus: 1.3,
        duration: 24 * 60 * 60 * 1000,
        type: 'weather_bonus'
      });
    }
    
    if (currentWeather.temperature > 30) {
      events.push({
        id: 'heat_wave',
        name: 'Heat Wave',
        description: 'Hot weather increases energy!',
        bonus: 1.2,
        duration: 24 * 60 * 60 * 1000,
        type: 'weather_bonus'
      });
    }
    
    return events;
  }

  // ==================== WEATHER UPDATES ====================
  
  startWeatherUpdates() {
    // Update weather every hour
    setInterval(() => {
      this.generateWeather();
      this.emitWeatherUpdate();
    }, 60 * 60 * 1000);
  }

  emitWeatherUpdate() {
    if (typeof window !== 'undefined' && window.gameAPI) {
      window.gameAPI.emit('weather_update', {
        current: this.weatherData.current,
        forecast: this.weatherData.forecast
      });
    }
  }

  // ==================== WEATHER SETTINGS ====================
  
  setLocation(location) {
    this.weatherData.location = location;
    this.saveData();
  }

  getLocation() {
    return this.weatherData.location;
  }

  // ==================== WEATHER STATISTICS ====================
  
  getWeatherStats() {
    const stats = {
      currentWeather: this.weatherData.current?.type || 'unknown',
      temperature: this.weatherData.current?.temperature || 0,
      humidity: this.weatherData.current?.humidity || 0,
      windSpeed: this.weatherData.current?.windSpeed || 0,
      bonus: this.getWeatherBonus(),
      location: this.weatherData.location,
      lastUpdate: this.weatherData.lastUpdate
    };
    
    return stats;
  }

  // ==================== UTILITY METHODS ====================
  
  loadData() {
    try {
      const data = JSON.parse(localStorage.getItem('game_weather') || '{}');
      this.weatherData = { ...this.weatherData, ...data };
    } catch (error) {
      console.error('Failed to load weather data:', error);
    }
  }

  saveData() {
    localStorage.setItem('game_weather', JSON.stringify(this.weatherData));
  }

  export() {
    return { ...this.weatherData };
  }

  import(data) {
    this.weatherData = { ...this.weatherData, ...data };
    this.saveData();
  }
}

// Make it globally available
window.LocalWeatherSystem = LocalWeatherSystem;