using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using System.Linq;
using Evergreen.Core;
using Evergreen.Weather;
using Evergreen.Social;

namespace Evergreen.Realtime
{
    /// <summary>
    /// Key-Free Unified Manager
    /// Connects weather, calendar, events, and social systems without API keys
    /// </summary>
    public class KeyFreeUnifiedManager : MonoBehaviour
    {
        [Header("Unified System Configuration")]
        [SerializeField] private bool enableUnifiedSystem = true;
        [SerializeField] private bool enableRealTimeUpdates = true;
        [SerializeField] private string timezone = "UTC";
        [SerializeField] private float updateInterval = 30f; // 30 seconds
        
        [Header("System Components")]
        [SerializeField] private bool enableWeatherSystem = true;
        [SerializeField] private bool enableCalendarSystem = true;
        [SerializeField] private bool enableEventSystem = true;
        [SerializeField] private bool enableSocialSystem = true;
        
        [Header("Player Configuration")]
        [SerializeField] private string playerId = "";
        [SerializeField] private float latitude = 51.5074f; // London default
        [SerializeField] private float longitude = -0.1278f;
        [SerializeField] private string locationName = "London";
        
        // Singleton
        public static KeyFreeUnifiedManager Instance { get; private set; }
        
        // Services
        private GameAnalyticsManager analyticsManager;
        private GameDataManager dataManager;
        private KeyFreeWeatherSystem weatherSystem;
        private KeyFreeCalendarManager calendarManager;
        private KeyFreeEventManager eventManager;
        private KeyFreeSocialManager socialManager;
        
        // Unified data
        private UnifiedPlayerData currentPlayerData;
        private Dictionary<string, object> systemStatus = new Dictionary<string, object>();
        private DateTime lastUpdate;
        
        // Events
        public System.Action<UnifiedPlayerData> OnPlayerDataUpdated;
        public System.Action<WeatherData> OnWeatherUpdated;
        public System.Action<List<CalendarEvent>> OnCalendarUpdated;
        public System.Action<List<GameEvent>> OnEventsUpdated;
        public System.Action<Dictionary<string, object>> OnSystemStatusUpdated;
        
        [System.Serializable]
        public class UnifiedPlayerData
        {
            public string playerId;
            public string timezone;
            public DateTime timestamp;
            public WeatherData weather;
            public CalendarData calendar;
            public EventData events;
            public SocialData social;
            public UnifiedFeatures unified;
            public SystemStatus system;
        }
        
        [System.Serializable]
        public class WeatherData
        {
            public bool isActive;
            public string type;
            public string description;
            public float temperature;
            public int humidity;
            public float windSpeed;
            public int cloudCover;
            public Dictionary<string, object> gameplayEffects;
        }
        
        [System.Serializable]
        public class CalendarData
        {
            public List<CalendarEvent> current;
            public List<CalendarEvent> upcoming;
            public int total;
        }
        
        [System.Serializable]
        public class EventData
        {
            public List<GameEvent> current;
            public List<GameEvent> upcoming;
            public int total;
        }
        
        [System.Serializable]
        public class SocialData
        {
            public int totalShares;
            public int successfulShares;
            public int failedShares;
            public List<ShareRecord> recentShares;
        }
        
        [System.Serializable]
        public class UnifiedFeatures
        {
            public List<ActiveFeature> activeFeatures;
            public List<Recommendation> recommendations;
            public List<SpecialOffer> specialOffers;
            public TimeBasedContent timeBasedContent;
        }
        
        [System.Serializable]
        public class ActiveFeature
        {
            public string type;
            public string name;
            public string description;
            public float multiplier;
            public string icon;
        }
        
        [System.Serializable]
        public class Recommendation
        {
            public string type;
            public string title;
            public string description;
            public string action;
            public string priority;
            public int timeRemaining;
        }
        
        [System.Serializable]
        public class SpecialOffer
        {
            public string type;
            public string title;
            public string description;
            public int discount;
            public List<string> items;
            public int expiresIn;
        }
        
        [System.Serializable]
        public class TimeBasedContent
        {
            public string timeOfDay;
            public string dayType;
            public string specialDay;
            public List<Recommendation> recommendations;
        }
        
        [System.Serializable]
        public class SystemStatus
        {
            public Dictionary<string, object> weather;
            public Dictionary<string, object> calendar;
            public Dictionary<string, object> events;
            public Dictionary<string, object> social;
            public Dictionary<string, object> unified;
        }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeUnifiedManager();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            if (enableUnifiedSystem)
            {
                StartCoroutine(InitializeUnifiedSystem());
            }
        }
        
        private void InitializeUnifiedManager()
        {
            lastUpdate = DateTime.MinValue;
            
            // Get player ID from GameDataManager
            if (GameDataManager.Instance != null)
            {
                playerId = GameDataManager.Instance.GetPlayerId();
            }
            else
            {
                playerId = System.Guid.NewGuid().ToString();
                Debug.LogWarning("GameDataManager not found, using random player ID");
            }
        }
        
        private IEnumerator InitializeUnifiedSystem()
        {
            Debug.Log("Initializing Key-Free Unified System");
            
            // Get references to other systems
            analyticsManager = GameAnalyticsManager.Instance;
            dataManager = GameDataManager.Instance;
            
            // Initialize individual systems
            if (enableWeatherSystem)
            {
                weatherSystem = KeyFreeWeatherSystem.Instance;
                if (weatherSystem == null)
                {
                    var weatherGO = new GameObject("WeatherSystem");
                    weatherSystem = weatherGO.AddComponent<KeyFreeWeatherSystem>();
                }
            }
            
            if (enableCalendarSystem)
            {
                calendarManager = KeyFreeCalendarManager.Instance;
                if (calendarManager == null)
                {
                    var calendarGO = new GameObject("CalendarManager");
                    calendarManager = calendarGO.AddComponent<KeyFreeCalendarManager>();
                }
            }
            
            if (enableEventSystem)
            {
                eventManager = KeyFreeEventManager.Instance;
                if (eventManager == null)
                {
                    var eventGO = new GameObject("EventManager");
                    eventManager = eventGO.AddComponent<KeyFreeEventManager>();
                }
            }
            
            if (enableSocialSystem)
            {
                socialManager = KeyFreeSocialManager.Instance;
                if (socialManager == null)
                {
                    var socialGO = new GameObject("SocialManager");
                    socialManager = socialGO.AddComponent<KeyFreeSocialManager>();
                }
            }
            
            // Set up event listeners
            SetupEventListeners();
            
            // Load initial unified data
            yield return StartCoroutine(LoadUnifiedPlayerData());
            
            // Start real-time updates
            if (enableRealTimeUpdates)
            {
                StartCoroutine(UnifiedUpdateLoop());
            }
            
            Debug.Log("Key-Free Unified System initialized successfully");
        }
        
        private void SetupEventListeners()
        {
            // Weather system events
            if (weatherSystem != null)
            {
                weatherSystem.OnWeatherUpdated += OnWeatherDataUpdated;
            }
            
            // Calendar system events
            if (calendarManager != null)
            {
                calendarManager.OnEventsUpdated += OnCalendarEventsUpdated;
            }
            
            // Event system events
            if (eventManager != null)
            {
                eventManager.OnEventsUpdated += OnGameEventsUpdated;
            }
            
            // Social system events
            if (socialManager != null)
            {
                socialManager.OnShareCompleted += OnSocialShareCompleted;
            }
        }
        
        private void OnWeatherDataUpdated(Evergreen.Weather.KeyFreeWeatherSystem.WeatherData weatherData)
        {
            // Convert weather data to unified format
            var unifiedWeather = new WeatherData
            {
                isActive = weatherData != null,
                type = weatherData?.type.ToString() ?? "Unknown",
                description = weatherData?.description ?? "",
                temperature = weatherData?.temperature ?? 20f,
                humidity = weatherData?.humidity ?? 50,
                windSpeed = weatherData?.windSpeed ?? 0f,
                cloudCover = weatherData?.cloudCover ?? 0,
                gameplayEffects = weatherData?.gameplayEffects ?? new Dictionary<string, object>()
            };
            
            OnWeatherUpdated?.Invoke(unifiedWeather);
        }
        
        private void OnCalendarEventsUpdated(List<CalendarEvent> events)
        {
            OnCalendarUpdated?.Invoke(events);
        }
        
        private void OnGameEventsUpdated(List<GameEvent> events)
        {
            OnEventsUpdated?.Invoke(events);
        }
        
        private void OnSocialShareCompleted(KeyFreeSocialManager.ShareRecord shareRecord)
        {
            Debug.Log($"Social share completed: {shareRecord.platform}");
        }
        
        private IEnumerator UnifiedUpdateLoop()
        {
            while (enableRealTimeUpdates)
            {
                yield return new WaitForSeconds(updateInterval);
                yield return StartCoroutine(UpdateUnifiedSystem());
            }
        }
        
        private IEnumerator LoadUnifiedPlayerData()
        {
            // Load data from individual systems
            var weatherData = LoadWeatherData();
            var calendarData = LoadCalendarData();
            var eventData = LoadEventData();
            var socialData = LoadSocialData();
            
            // Generate unified features
            var unifiedFeatures = GenerateUnifiedFeatures(weatherData, calendarData, eventData);
            
            // Create unified player data
            currentPlayerData = new UnifiedPlayerData
            {
                playerId = playerId,
                timezone = timezone,
                timestamp = DateTime.Now,
                weather = weatherData,
                calendar = calendarData,
                eventData = eventData,
                social = socialData,
                unified = unifiedFeatures,
                system = LoadSystemStatus()
            };
            
            // Notify listeners
            OnPlayerDataUpdated?.Invoke(currentPlayerData);
            
            lastUpdate = DateTime.Now;
        }
        
        private WeatherData LoadWeatherData()
        {
            if (weatherSystem != null && weatherSystem.IsWeatherActive())
            {
                var weather = weatherSystem.GetCurrentWeather();
                if (weather != null)
                {
                    return new WeatherData
                    {
                        isActive = true,
                        type = weather.type.ToString(),
                        description = weather.description,
                        temperature = weather.temperature,
                        humidity = weather.humidity,
                        windSpeed = weather.windSpeed,
                        cloudCover = weather.cloudCover,
                        gameplayEffects = weather.gameplayEffects
                    };
                }
            }
            
            return new WeatherData
            {
                isActive = false,
                type = "Unknown",
                description = "Weather data unavailable",
                temperature = 20f,
                humidity = 50,
                windSpeed = 0f,
                cloudCover = 0,
                gameplayEffects = new Dictionary<string, object>()
            };
        }
        
        private CalendarData LoadCalendarData()
        {
            if (calendarManager != null)
            {
                var current = calendarManager.GetActiveEvents();
                var upcoming = calendarManager.GetUpcomingEvents();
                
                return new CalendarData
                {
                    current = current,
                    upcoming = upcoming,
                    total = current.Count + upcoming.Count
                };
            }
            
            return new CalendarData
            {
                current = new List<CalendarEvent>(),
                upcoming = new List<CalendarEvent>(),
                total = 0
            };
        }
        
        private EventData LoadEventData()
        {
            if (eventManager != null)
            {
                var current = eventManager.GetActiveEvents();
                var upcoming = eventManager.GetUpcomingEvents();
                
                return new EventData
                {
                    current = current,
                    upcoming = upcoming,
                    total = current.Count + upcoming.Count
                };
            }
            
            return new EventData
            {
                current = new List<GameEvent>(),
                upcoming = new List<GameEvent>(),
                total = 0
            };
        }
        
        private SocialData LoadSocialData()
        {
            if (socialManager != null)
            {
                var stats = socialManager.GetSocialStats();
                var history = socialManager.GetShareHistory();
                
                return new SocialData
                {
                    totalShares = (int)stats.GetValueOrDefault("totalShares", 0),
                    successfulShares = (int)stats.GetValueOrDefault("successfulShares", 0),
                    failedShares = (int)stats.GetValueOrDefault("failedShares", 0),
                    recentShares = history.Take(5).ToList()
                };
            }
            
            return new SocialData
            {
                totalShares = 0,
                successfulShares = 0,
                failedShares = 0,
                recentShares = new List<KeyFreeSocialManager.ShareRecord>()
            };
        }
        
        private UnifiedFeatures GenerateUnifiedFeatures(WeatherData weather, CalendarData calendar, EventData events)
        {
            var features = new UnifiedFeatures
            {
                activeFeatures = new List<ActiveFeature>(),
                recommendations = new List<Recommendation>(),
                specialOffers = new List<SpecialOffer>(),
                timeBasedContent = GenerateTimeBasedContent()
            };
            
            // Generate active features based on current conditions
            GenerateActiveFeatures(weather, calendar, events, features);
            
            // Generate recommendations
            GenerateRecommendations(weather, calendar, events, features);
            
            // Generate special offers
            GenerateSpecialOffers(weather, events, features);
            
            return features;
        }
        
        private void GenerateActiveFeatures(WeatherData weather, CalendarData calendar, EventData events, UnifiedFeatures features)
        {
            // Weather-based features
            if (weather.isActive)
            {
                switch (weather.type)
                {
                    case "Rain":
                        features.activeFeatures.Add(new ActiveFeature
                        {
                            type = "weather_rain",
                            name = "Rainy Day Bonus",
                            description = "Earn extra coins during rainy weather!",
                            multiplier = 1.2f,
                            icon = "🌧️"
                        });
                        break;
                    
                    case "Snow":
                        features.activeFeatures.Add(new ActiveFeature
                        {
                            type = "weather_snow",
                            name = "Winter Wonderland",
                            description = "Special winter rewards available!",
                            multiplier = 1.1f,
                            icon = "❄️"
                        });
                        break;
                    
                    case "Thunderstorm":
                        features.activeFeatures.Add(new ActiveFeature
                        {
                            type = "weather_storm",
                            name = "Storm Power",
                            description = "High energy events with amazing rewards!",
                            multiplier = 1.5f,
                            icon = "⛈️"
                        });
                        break;
                }
            }
            
            // Event-based features
            foreach (var evt in events.current)
            {
                features.activeFeatures.Add(new ActiveFeature
                {
                    type = "event",
                    name = evt.title,
                    description = evt.description,
                    multiplier = 1.0f,
                    icon = GetEventIcon(evt.eventType)
                });
            }
            
            // Calendar-based features
            foreach (var evt in calendar.current)
            {
                features.activeFeatures.Add(new ActiveFeature
                {
                    type = "calendar",
                    name = evt.title,
                    description = evt.description,
                    multiplier = 1.0f,
                    icon = GetCalendarIcon(evt.eventType)
                });
            }
        }
        
        private void GenerateRecommendations(WeatherData weather, CalendarData calendar, EventData events, UnifiedFeatures features)
        {
            // Weather-based recommendations
            if (weather.isActive)
            {
                switch (weather.type)
                {
                    case "Rain":
                    case "Thunderstorm":
                        features.recommendations.Add(new Recommendation
                        {
                            type = "weather",
                            title = "Perfect Weather for Gaming!",
                            description = "The weather is perfect for indoor gaming. Try our special weather events!",
                            action = "play_weather_event",
                            priority = "high",
                            timeRemaining = 0
                        });
                        break;
                }
            }
            
            // Event-based recommendations
            foreach (var evt in events.current)
            {
                if (evt.priority >= 3)
                {
                    features.recommendations.Add(new Recommendation
                    {
                        type = "event",
                        title = $"Don't Miss: {evt.title}",
                        description = evt.description,
                        action = "join_event",
                        priority = "high",
                        timeRemaining = evt.timeRemainingMinutes
                    });
                }
            }
            
            // Time-based recommendations
            var hour = DateTime.Now.Hour;
            if (hour >= 18 || hour <= 6)
            {
                features.recommendations.Add(new Recommendation
                {
                    type = "time",
                    title = "Evening Gaming Session",
                    description = "Perfect time for a relaxing gaming session!",
                    action = "start_session",
                    priority = "medium",
                    timeRemaining = 0
                });
            }
        }
        
        private void GenerateSpecialOffers(WeatherData weather, EventData events, UnifiedFeatures features)
        {
            // Weather-based offers
            if (weather.isActive && weather.type == "Thunderstorm")
            {
                features.specialOffers.Add(new SpecialOffer
                {
                    type = "weather_storm_offer",
                    title = "Storm Special Pack",
                    description = "Limited time offer during stormy weather!",
                    discount = 25,
                    items = new List<string> { "energy_pack", "coin_boost", "special_tiles" },
                    expiresIn = 60
                });
            }
            
            // Event-based offers
            foreach (var evt in events.current)
            {
                if (evt.eventType == EventType.SpecialOffer)
                {
                    features.specialOffers.Add(new SpecialOffer
                    {
                        type = "event_offer",
                        title = evt.title,
                        description = evt.description,
                        discount = 0,
                        items = new List<string>(),
                        expiresIn = evt.timeRemainingMinutes
                    });
                }
            }
        }
        
        private TimeBasedContent GenerateTimeBasedContent()
        {
            var now = DateTime.Now;
            var hour = now.Hour;
            var dayOfWeek = now.DayOfWeek;
            var dayOfMonth = now.Day;
            
            var content = new TimeBasedContent
            {
                timeOfDay = GetTimeOfDay(hour),
                dayType = GetDayType(dayOfWeek),
                specialDay = GetSpecialDay(dayOfMonth),
                recommendations = new List<Recommendation>()
            };
            
            // Time-based recommendations
            if (hour >= 6 && hour < 12)
            {
                content.recommendations.Add(new Recommendation
                {
                    type = "morning",
                    title = "Good Morning!",
                    description = "Start your day with a quick game session!",
                    action = "morning_session",
                    priority = "medium",
                    timeRemaining = 0
                });
            }
            else if (hour >= 12 && hour < 18)
            {
                content.recommendations.Add(new Recommendation
                {
                    type = "afternoon",
                    title = "Afternoon Break",
                    description = "Perfect time for a gaming break!",
                    action = "afternoon_session",
                    priority = "medium",
                    timeRemaining = 0
                });
            }
            else if (hour >= 18 && hour < 22)
            {
                content.recommendations.Add(new Recommendation
                {
                    type = "evening",
                    title = "Evening Gaming",
                    description = "Relax with some evening gaming!",
                    action = "evening_session",
                    priority = "medium",
                    timeRemaining = 0
                });
            }
            
            return content;
        }
        
        private string GetTimeOfDay(int hour)
        {
            if (hour >= 6 && hour < 12) return "morning";
            if (hour >= 12 && hour < 18) return "afternoon";
            if (hour >= 18 && hour < 22) return "evening";
            return "night";
        }
        
        private string GetDayType(DayOfWeek dayOfWeek)
        {
            if (dayOfWeek == DayOfWeek.Saturday || dayOfWeek == DayOfWeek.Sunday) return "weekend";
            return "weekday";
        }
        
        private string GetSpecialDay(int dayOfMonth)
        {
            if (dayOfMonth == 1) return "month_start";
            if (dayOfMonth == 15) return "mid_month";
            if (dayOfMonth == 25) return "month_end";
            if (dayOfMonth == 31) return "month_end";
            return "regular";
        }
        
        private SystemStatus LoadSystemStatus()
        {
            return new SystemStatus
            {
                weather = weatherSystem?.GetCurrentWeather() != null ? new Dictionary<string, object> { {"status", "active"} } : new Dictionary<string, object> { {"status", "inactive"} },
                calendar = calendarManager?.GetCalendarStatistics() ?? new Dictionary<string, object>(),
                events = eventManager?.GetEventStatistics() ?? new Dictionary<string, object>(),
                social = socialManager?.GetSocialStats() ?? new Dictionary<string, object>(),
                unified = new Dictionary<string, object> { {"status", "active"}, {"lastUpdate", lastUpdate.ToString()} }
            };
        }
        
        private IEnumerator UpdateUnifiedSystem()
        {
            yield return StartCoroutine(LoadUnifiedPlayerData());
            
            // Update system status
            systemStatus = LoadSystemStatus();
            OnSystemStatusUpdated?.Invoke(systemStatus);
            
            lastUpdate = DateTime.Now;
        }
        
        private string GetEventIcon(EventType eventType)
        {
            switch (eventType)
            {
                case EventType.DailyChallenge: return "📅";
                case EventType.WeeklyTournament: return "🏆";
                case EventType.SpecialOffer: return "🎁";
                case EventType.Weather: return "🌤️";
                case EventType.Random: return "🎲";
                default: return "📌";
            }
        }
        
        private string GetCalendarIcon(CalendarEvent.EventType eventType)
        {
            switch (eventType)
            {
                case CalendarEvent.EventType.DailyReset: return "🔄";
                case CalendarEvent.EventType.WeeklyReset: return "📅";
                case CalendarEvent.EventType.MonthlyReset: return "📆";
                case CalendarEvent.EventType.Holiday: return "🎉";
                case CalendarEvent.EventType.Seasonal: return "🎄";
                default: return "📅";
            }
        }
        
        // Public API
        public UnifiedPlayerData GetCurrentPlayerData()
        {
            return currentPlayerData;
        }
        
        public Dictionary<string, object> GetSystemStatus()
        {
            return systemStatus;
        }
        
        public void SetTimezone(string newTimezone)
        {
            timezone = newTimezone;
            
            // Update individual systems
            if (calendarManager != null)
                calendarManager.SetTimezone(newTimezone);
            if (eventManager != null)
                eventManager.SetTimezone(newTimezone);
        }
        
        public string GetCurrentTimezone()
        {
            return timezone;
        }
        
        public void SetLocation(float latitude, float longitude, string locationName = null)
        {
            this.latitude = latitude;
            this.longitude = longitude;
            if (!string.IsNullOrEmpty(locationName))
            {
                this.locationName = locationName;
            }
            
            // Update weather system
            if (weatherSystem != null)
            {
                weatherSystem.SetLocation(latitude, longitude, locationName);
            }
        }
        
        public void RefreshAllData()
        {
            StartCoroutine(LoadUnifiedPlayerData());
        }
        
        public void SetUnifiedSystemEnabled(bool enabled)
        {
            enableUnifiedSystem = enabled;
        }
        
        public void SetRealTimeUpdatesEnabled(bool enabled)
        {
            enableRealTimeUpdates = enabled;
        }
        
        void OnDestroy()
        {
            // Clean up event listeners
            if (weatherSystem != null)
            {
                weatherSystem.OnWeatherUpdated -= OnWeatherDataUpdated;
            }
            
            if (calendarManager != null)
            {
                calendarManager.OnEventsUpdated -= OnCalendarEventsUpdated;
            }
            
            if (eventManager != null)
            {
                eventManager.OnEventsUpdated -= OnGameEventsUpdated;
            }
            
            if (socialManager != null)
            {
                socialManager.OnShareCompleted -= OnSocialShareCompleted;
            }
        }
    }
}