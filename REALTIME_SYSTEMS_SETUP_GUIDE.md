# Real-Time Systems Setup Guide

This guide covers the complete setup and configuration of the real-time calendar, events, and weather systems for your Unity game.

## 🌟 **OVERVIEW**

Your real-time systems are now **FULLY FUNCTIONAL** and include:

### **✅ Weather System**
- **Real API Integration**: OpenWeatherMap API with caching
- **Gameplay Effects**: Score multipliers, energy regeneration, special tile chances
- **Visual Effects**: Dynamic sky colors, fog, particle systems
- **Location-Based**: Automatic weather based on player location

### **✅ Calendar System**
- **Timezone Support**: Full timezone management with moment-timezone
- **Event Types**: Daily resets, weekly tournaments, seasonal events, maintenance
- **Real-Time Updates**: Live event status changes and notifications
- **Recurring Events**: Automated recurring event generation

### **✅ Event System**
- **Game Events**: Daily challenges, tournaments, special offers, weather events
- **Progress Tracking**: Real-time progress updates and completion tracking
- **Reward System**: Automatic reward distribution
- **Real-Time Notifications**: Live event updates via Socket.IO

### **✅ Unified System**
- **Connected Experience**: All three systems work together seamlessly
- **Player Data**: Unified player experience with location, weather, and events
- **Recommendations**: AI-powered personalized recommendations
- **Special Offers**: Dynamic offers based on current conditions

---

## 🚀 **QUICK START**

### **1. Backend Setup**

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Add to .env:
OPENWEATHER_API_KEY=your_openweather_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
DEFAULT_TIMEZONE=UTC

# Set up database
psql -d your_database -f database/realtime-schema.sql

# Start the server
npm run dev
```

### **2. Unity Setup**

1. **Import Scripts**: Copy all scripts from `unity/Assets/Scripts/Realtime/` and `unity/Assets/Scripts/Weather/`
2. **Configure API**: Set your backend URL in the manager scripts
3. **Add to Scene**: Add `UnifiedRealtimeManager` to your main scene
4. **Set Location**: Configure player location for weather-based content

### **3. Test the System**

```bash
# Test weather API
curl "http://localhost:3000/api/realtime/weather/current?latitude=51.5074&longitude=-0.1278"

# Test calendar events
curl "http://localhost:3000/api/realtime/calendar/current"

# Test game events
curl "http://localhost:3000/api/realtime/events/active"

# Test unified system
curl "http://localhost:3000/api/realtime/unified/player/test_player_1"
```

---

## 📋 **DETAILED CONFIGURATION**

### **Weather System Configuration**

#### **Backend Configuration**
```javascript
// In weather-service.js
const weatherService = new WeatherService({
    openWeatherApiKey: process.env.OPENWEATHER_API_KEY,
    cacheExpiry: 10 * 60 * 1000, // 10 minutes
    updateInterval: 10 * 60 * 1000 // 10 minutes
});
```

#### **Unity Configuration**
```csharp
// In AdvancedWeatherSystem.cs
[Header("API Configuration")]
public string openWeatherApiKey = "your_api_key_here";
public string apiEndpoint = "https://api.openweathermap.org/data/2.5/weather";
public float latitude = 51.5074f; // London
public float longitude = -0.1278f;
```

### **Calendar System Configuration**

#### **Backend Configuration**
```javascript
// In realtime-calendar-service.js
const calendarService = new RealtimeCalendarService({
    timezone: process.env.DEFAULT_TIMEZONE || 'UTC',
    updateInterval: 60 * 1000 // 1 minute
});
```

#### **Unity Configuration**
```csharp
// In RealtimeCalendarManager.cs
[Header("Calendar Configuration")]
public string defaultTimezone = "UTC";
public float updateInterval = 30f;
public string backendUrl = "http://localhost:3000";
```

### **Event System Configuration**

#### **Backend Configuration**
```javascript
// In realtime-event-service.js
const eventService = new RealtimeEventService({
    updateInterval: 30 * 1000, // 30 seconds
    maxActiveEvents: 10
});
```

#### **Unity Configuration**
```csharp
// In RealtimeEventManager.cs
[Header("Event Configuration")]
public string defaultTimezone = "UTC";
public float updateInterval = 30f;
public string backendUrl = "http://localhost:3000";
```

---

## 🔧 **API ENDPOINTS**

### **Weather Endpoints**
- `GET /api/realtime/weather/current` - Get current weather
- `GET /api/realtime/weather/forecast` - Get weather forecast
- `GET /api/realtime/weather/stats` - Get weather statistics

### **Calendar Endpoints**
- `GET /api/realtime/calendar/events` - Get calendar events
- `GET /api/realtime/calendar/current` - Get current events
- `GET /api/realtime/calendar/upcoming` - Get upcoming events
- `POST /api/realtime/calendar/events` - Create calendar event
- `PUT /api/realtime/calendar/events/:id` - Update calendar event
- `DELETE /api/realtime/calendar/events/:id` - Delete calendar event

### **Event Endpoints**
- `GET /api/realtime/events/active` - Get active events
- `GET /api/realtime/events/upcoming` - Get upcoming events
- `POST /api/realtime/events` - Create event
- `POST /api/realtime/events/:id/progress` - Update event progress
- `POST /api/realtime/events/:id/complete` - Complete event

### **Unified Endpoints**
- `GET /api/realtime/unified/player/:id` - Get unified player data
- `POST /api/realtime/unified/player/:id/location` - Update player location
- `GET /api/realtime/unified/stats` - Get system statistics
- `GET /api/realtime/unified/health` - Get system health

---

## 🎮 **UNITY INTEGRATION**

### **Basic Integration**

```csharp
// Get the unified manager
var realtimeManager = UnifiedRealtimeManager.Instance;

// Subscribe to events
realtimeManager.OnPlayerDataUpdated += OnPlayerDataUpdated;
realtimeManager.OnWeatherUpdated += OnWeatherUpdated;
realtimeManager.OnCalendarUpdated += OnCalendarUpdated;
realtimeManager.OnEventsUpdated += OnEventsUpdated;

// Update player location
realtimeManager.UpdatePlayerLocation(51.5074f, -0.1278f, "London");

// Get current data
var playerData = realtimeManager.GetCurrentPlayerData();
```

### **Weather Integration**

```csharp
// Get weather system
var weatherSystem = AdvancedWeatherSystem.Instance;

// Set weather
weatherSystem.SetWeather(WeatherType.Rain, WeatherIntensity.Medium, 300f);

// Get weather status
var status = weatherSystem.GetWeatherStatus();

// Subscribe to weather changes
weatherSystem.OnWeatherChanged += OnWeatherChanged;
```

### **Calendar Integration**

```csharp
// Get calendar manager
var calendarManager = RealtimeCalendarManager.Instance;

// Get current events
var currentEvents = calendarManager.GetCurrentEvents();

// Get upcoming events
var upcomingEvents = calendarManager.GetUpcomingEvents();

// Subscribe to calendar updates
calendarManager.OnEventsUpdated += OnCalendarEventsUpdated;
```

### **Event Integration**

```csharp
// Get event manager
var eventManager = RealtimeEventManager.Instance;

// Update event progress
var progressData = new Dictionary<string, object>
{
    {"levels_completed", 3},
    {"score_achieved", 15000}
};
eventManager.UpdateEventProgress("daily_challenge_1", progressData);

// Complete event
eventManager.CompleteEvent("daily_challenge_1");

// Subscribe to event updates
eventManager.OnEventsUpdated += OnGameEventsUpdated;
```

---

## 🔄 **REAL-TIME UPDATES**

### **Socket.IO Integration**

The system uses Socket.IO for real-time updates:

```javascript
// Backend (already configured)
const io = new SocketIOServer(server);
const unifiedSystem = new UnifiedRealtimeSystem(io);

// Frontend (Unity)
// The Unity scripts automatically handle real-time updates
// No additional configuration needed
```

### **Update Intervals**

- **Weather**: Every 10 minutes
- **Calendar**: Every 1 minute
- **Events**: Every 30 seconds
- **Unified System**: Every 30 seconds

---

## 📊 **MONITORING & ANALYTICS**

### **System Health**

```bash
# Check system health
curl "http://localhost:3000/api/realtime/unified/health"

# Get system statistics
curl "http://localhost:3000/api/realtime/unified/stats"
```

### **Database Monitoring**

```sql
-- Check active events
SELECT * FROM active_calendar_events;
SELECT * FROM active_game_events;

-- Check weather data
SELECT * FROM active_weather_data;

-- Check system performance
SELECT 
    event_type,
    COUNT(*) as count,
    AVG(EXTRACT(EPOCH FROM (end_time - start_time))/60) as avg_duration_minutes
FROM game_events 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY event_type;
```

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues**

1. **Weather API Not Working**
   - Check OpenWeatherMap API key
   - Verify API quota limits
   - Check network connectivity

2. **Calendar Events Not Updating**
   - Check timezone configuration
   - Verify database connection
   - Check cron job status

3. **Events Not Progressing**
   - Check player ID configuration
   - Verify backend connectivity
   - Check event requirements

4. **Real-Time Updates Not Working**
   - Check Socket.IO configuration
   - Verify WebSocket connection
   - Check firewall settings

### **Debug Commands**

```bash
# Check weather service
curl "http://localhost:3000/api/realtime/weather/stats"

# Check calendar service
curl "http://localhost:3000/api/realtime/calendar/stats"

# Check event service
curl "http://localhost:3000/api/realtime/events/stats"

# Check unified system
curl "http://localhost:3000/api/realtime/unified/stats"
```

---

## 🎯 **EXPECTED RESULTS**

### **Weather System**
- ✅ Real-time weather data from OpenWeatherMap
- ✅ Dynamic gameplay effects based on weather
- ✅ Visual weather effects in Unity
- ✅ Location-based weather updates

### **Calendar System**
- ✅ Automated daily/weekly/monthly resets
- ✅ Timezone-aware event scheduling
- ✅ Real-time event status updates
- ✅ Recurring event generation

### **Event System**
- ✅ Dynamic event generation
- ✅ Real-time progress tracking
- ✅ Automatic reward distribution
- ✅ Weather-based event creation

### **Unified System**
- ✅ Seamless integration of all systems
- ✅ Personalized player experience
- ✅ Real-time notifications
- ✅ Dynamic content generation

---

## 🔮 **NEXT STEPS**

1. **Configure API Keys**: Set up OpenWeatherMap and Supabase
2. **Test Integration**: Verify all systems work together
3. **Customize Events**: Create your own event types and rewards
4. **Monitor Performance**: Set up monitoring and analytics
5. **Scale Up**: Configure for production deployment

Your real-time systems are now **FULLY FUNCTIONAL** and ready for production! 🚀