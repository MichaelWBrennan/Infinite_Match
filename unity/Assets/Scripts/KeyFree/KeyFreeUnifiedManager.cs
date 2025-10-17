using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using System.Linq;
using Evergreen.Core;
using Evergreen.KeyFree;

namespace Evergreen.KeyFree
{
    /// <summary>
    /// Unified Manager for all Key-Free Systems
    /// Orchestrates weather, social, calendar, and event systems
    /// </summary>
    public class KeyFreeUnifiedManager : MonoBehaviour
    {
        [Header("System Configuration")]
        [SerializeField] private bool enableWeatherSystem = true;
        [SerializeField] private bool enableSocialSystem = true;
        [SerializeField] private bool enableCalendarSystem = true;
        [SerializeField] private bool enableEventSystem = true;
        [SerializeField] private bool enableRealTimeUpdates = true;
        [SerializeField] private float updateInterval = 60f; // 1 minute
        
        [Header("Player Settings")]
        [SerializeField] private string defaultTimezone = "America/New_York";
        [SerializeField] private string playerId = "";
        
        [Header("System Status")]
        [SerializeField] private SystemStatus systemStatus = new SystemStatus();
        [SerializeField] private UnifiedPlayerData currentPlayerData = new UnifiedPlayerData();
        
        // Data Structures
        [System.Serializable]
        public class UnifiedPlayerData
        {
            public string playerId;
            public WeatherData weather;
            public CalendarData calendar;
            public EventData events;
            public SocialData social;
            public UnifiedFeatures features;
            public DateTime lastUpdated;
        }
        
        [System.Serializable]
        public class WeatherData
        {
            public bool isActive;
            public string description;
            public float temperature;
            public string source;
            public DateTime lastUpdate;
        }
        
        [System.Serializable]
        public class CalendarData
        {
            public int total;
            public int active;
            public int upcoming;
            public List<CalendarEventSummary> recent;
        }
        
        [System.Serializable]
        public class CalendarEventSummary
        {
            public string id;
            public string title;
            public string type;
            public DateTime startTime;
            public bool isOngoing;
        }
        
        [System.Serializable]
        public class EventData
        {
            public int total;
            public int active;
            public int upcoming;
            public int completed;
            public List<GameEventSummary> recent;
        }
        
        [System.Serializable]
        public class GameEventSummary
        {
            public string id;
            public string title;
            public string type;
            public DateTime startTime;
            public bool isOngoing;
            public float completionPercentage;
        }
        
        [System.Serializable]
        public class SocialData
        {
            public int totalShares;
            public int successfulShares;
            public int failedShares;
            public DateTime lastShareTime;
            public List<ShareSummary> recent;
        }
        
        [System.Serializable]
        public class ShareSummary
        {
            public string id;
            public string platform;
            public DateTime timestamp;
            public bool success;
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
            public string name;
            public string description;
            public string icon;
            public bool isActive;
            public DateTime expiresAt;
        }
        
        [System.Serializable]
        public class Recommendation
        {
            public string title;
            public string description;
            public string type;
            public string icon;
            public int priority;
        }
        
        [System.Serializable]
        public class SpecialOffer
        {
            public string title;
            public string description;
            public string type;
            public float discount;
            public DateTime expiresAt;
        }
        
        [System.Serializable]
        public class TimeBasedContent
        {
            public string timeOfDay;
            public string dayType;
            public string specialDay;
            public List<Recommendation> timeRecommendations;
        }
        
        [System.Serializable]
        public class SystemStatus
        {
            public bool weatherSystemActive;
            public bool socialSystemActive;
            public bool calendarSystemActive;
            public bool eventSystemActive;
            public bool unifiedSystemActive;
            public DateTime lastUpdate;
            public string status;
        }
        
        // Events
        public static event Action<UnifiedPlayerData> OnPlayerDataUpdated;
        public static event Action<SystemStatus> OnSystemStatusUpdated;
        public static event Action<string> OnSystemError;
        
        // Singleton
        public static KeyFreeUnifiedManager Instance { get; private set; }
        
        // Private fields
        private bool isInitialized = false;
        private Coroutine updateCoroutine;
        
        // System references
        private KeyFreeWeatherAndSocialManager weatherAndSocialManager;
        private KeyFreeCalendarAndEventManager calendarAndEventManager;
        
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
            StartCoroutine(InitializeUnifiedSystem());
        }
        
        private void InitializeUnifiedManager()
        {
            // Generate or load player ID
            if (string.IsNullOrEmpty(playerId))
            {
                playerId = PlayerPrefs.GetString("unified_player_id", "");
                if (string.IsNullOrEmpty(playerId))
                {
                    playerId = System.Guid.NewGuid().ToString();
                    PlayerPrefs.SetString("unified_player_id", playerId);
                    PlayerPrefs.Save();
                }
            }
            
            // Initialize system status
            systemStatus = new SystemStatus
            {
                weatherSystemActive = false,
                socialSystemActive = false,
                calendarSystemActive = false,
                eventSystemActive = false,
                unifiedSystemActive = false,
                lastUpdate = DateTime.Now,
                status = "Initializing"
            };
        }
        
        private IEnumerator InitializeUnifiedSystem()
        {
            Debug.Log("🔗 Initializing Unified Key-Free System...");
            
            // Get references to sub-systems
            yield return StartCoroutine(GetSystemReferences());
            
            // Initialize sub-systems if they don't exist
            yield return StartCoroutine(InitializeSubSystems());
            
            // Set up event listeners
            SetupEventListeners();
            
            // Load initial data
            yield return StartCoroutine(LoadUnifiedPlayerData());
            
            // Start update loop
            if (enableRealTimeUpdates)
            {
                if (updateCoroutine != null)
                {
                    StopCoroutine(updateCoroutine);
                }
                updateCoroutine = StartCoroutine(UnifiedUpdateLoop());
            }
            
            isInitialized = true;
            systemStatus.unifiedSystemActive = true;
            systemStatus.status = "Operational";
            
            Debug.Log("✅ Unified Key-Free System initialized successfully");
        }
        
        private IEnumerator GetSystemReferences()
        {
            // Get weather and social manager
            weatherAndSocialManager = KeyFreeWeatherAndSocialManager.Instance;
            if (weatherAndSocialManager == null)
            {
                Debug.LogWarning("Weather and Social Manager not found, will create one");
            }
            
            // Get calendar and event manager
            calendarAndEventManager = KeyFreeCalendarAndEventManager.Instance;
            if (calendarAndEventManager == null)
            {
                Debug.LogWarning("Calendar and Event Manager not found, will create one");
            }
            
            yield return null;
        }
        
        private IEnumerator InitializeSubSystems()
        {
            // Create weather and social manager if needed
            if (weatherAndSocialManager == null)
            {
                var weatherGO = new GameObject("WeatherAndSocialManager");
                weatherAndSocialManager = weatherGO.AddComponent<KeyFreeWeatherAndSocialManager>();
                Debug.Log("Created Weather and Social Manager");
            }
            
            // Create calendar and event manager if needed
            if (calendarAndEventManager == null)
            {
                var calendarGO = new GameObject("CalendarAndEventManager");
                calendarAndEventManager = calendarGO.AddComponent<KeyFreeCalendarAndEventManager>();
                Debug.Log("Created Calendar and Event Manager");
            }
            
            yield return new WaitForSeconds(1f); // Allow systems to initialize
        }
        
        private void SetupEventListeners()
        {
            // Weather system events
            if (weatherAndSocialManager != null)
            {
                KeyFreeWeatherAndSocialManager.OnWeatherUpdated += OnWeatherDataUpdated;
                KeyFreeWeatherAndSocialManager.OnShareCompleted += OnSocialShareCompleted;
            }
            
            // Calendar and event system events
            if (calendarAndEventManager != null)
            {
                KeyFreeCalendarAndEventManager.OnCalendarEventsUpdated += OnCalendarEventsUpdated;
                KeyFreeCalendarAndEventManager.OnGameEventsUpdated += OnGameEventsUpdated;
                KeyFreeCalendarAndEventManager.OnEventCompleted += OnEventCompleted;
            }
        }
        
        private void OnWeatherDataUpdated(KeyFreeWeatherAndSocialManager.WeatherData weatherData)
        {
            if (currentPlayerData.weather == null)
            {
                currentPlayerData.weather = new WeatherData();
            }
            
            currentPlayerData.weather.isActive = weatherData.isActive;
            currentPlayerData.weather.description = weatherData.description;
            currentPlayerData.weather.temperature = weatherData.temperature;
            currentPlayerData.weather.source = weatherData.source;
            currentPlayerData.weather.lastUpdate = weatherData.timestamp;
            
            systemStatus.weatherSystemActive = true;
            UpdateSystemStatus();
        }
        
        private void OnCalendarEventsUpdated(List<KeyFreeCalendarAndEventManager.CalendarEvent> events)
        {
            if (currentPlayerData.calendar == null)
            {
                currentPlayerData.calendar = new CalendarData();
            }
            
            currentPlayerData.calendar.total = events.Count;
            currentPlayerData.calendar.active = events.Count(e => e.isOngoing);
            currentPlayerData.calendar.upcoming = events.Count(e => e.isUpcoming);
            currentPlayerData.calendar.recent = events
                .OrderByDescending(e => e.startTime)
                .Take(5)
                .Select(e => new CalendarEventSummary
                {
                    id = e.id,
                    title = e.title,
                    type = e.eventType.ToString(),
                    startTime = e.startTime,
                    isOngoing = e.isOngoing
                })
                .ToList();
            
            systemStatus.calendarSystemActive = true;
            UpdateSystemStatus();
        }
        
        private void OnGameEventsUpdated(List<KeyFreeCalendarAndEventManager.GameEvent> events)
        {
            if (currentPlayerData.events == null)
            {
                currentPlayerData.events = new EventData();
            }
            
            currentPlayerData.events.total = events.Count;
            currentPlayerData.events.active = events.Count(e => e.isOngoing);
            currentPlayerData.events.upcoming = events.Count(e => e.isUpcoming);
            currentPlayerData.events.completed = events.Count(e => e.isCompleted);
            currentPlayerData.events.recent = events
                .OrderByDescending(e => e.startTime)
                .Take(5)
                .Select(e => new GameEventSummary
                {
                    id = e.id,
                    title = e.title,
                    type = e.eventType.ToString(),
                    startTime = e.startTime,
                    isOngoing = e.isOngoing,
                    completionPercentage = calendarAndEventManager?.GetEventCompletionPercentage(e.id) ?? 0f
                })
                .ToList();
            
            systemStatus.eventSystemActive = true;
            UpdateSystemStatus();
        }
        
        private void OnEventCompleted(KeyFreeCalendarAndEventManager.GameEvent gameEvent)
        {
            Debug.Log($"🎉 Event completed: {gameEvent.title}");
            // Update player data if needed
        }
        
        private void OnSocialShareCompleted(KeyFreeWeatherAndSocialManager.ShareRecord shareRecord)
        {
            if (currentPlayerData.social == null)
            {
                currentPlayerData.social = new SocialData();
            }
            
            currentPlayerData.social.totalShares++;
            if (shareRecord.success)
            {
                currentPlayerData.social.successfulShares++;
            }
            else
            {
                currentPlayerData.social.failedShares++;
            }
            currentPlayerData.social.lastShareTime = shareRecord.timestamp;
            
            if (currentPlayerData.social.recent == null)
            {
                currentPlayerData.social.recent = new List<ShareSummary>();
            }
            
            currentPlayerData.social.recent.Insert(0, new ShareSummary
            {
                id = shareRecord.id,
                platform = shareRecord.platform.ToString(),
                timestamp = shareRecord.timestamp,
                success = shareRecord.success
            });
            
            // Keep only last 10 shares
            if (currentPlayerData.social.recent.Count > 10)
            {
                currentPlayerData.social.recent = currentPlayerData.social.recent.Take(10).ToList();
            }
            
            systemStatus.socialSystemActive = true;
            UpdateSystemStatus();
        }
        
        private IEnumerator UnifiedUpdateLoop()
        {
            while (true)
            {
                yield return new WaitForSeconds(updateInterval);
                yield return StartCoroutine(UpdateUnifiedSystem());
            }
        }
        
        private IEnumerator LoadUnifiedPlayerData()
        {
            currentPlayerData = new UnifiedPlayerData
            {
                playerId = playerId,
                lastUpdated = DateTime.Now
            };
            
            // Load weather data
            currentPlayerData.weather = LoadWeatherData();
            
            // Load calendar data
            currentPlayerData.calendar = LoadCalendarData();
            
            // Load event data
            currentPlayerData.events = LoadEventData();
            
            // Load social data
            currentPlayerData.social = LoadSocialData();
            
            // Generate unified features
            currentPlayerData.features = GenerateUnifiedFeatures(
                currentPlayerData.weather,
                currentPlayerData.calendar,
                currentPlayerData.events
            );
            
            // Update system status
            UpdateSystemStatus();
            
            // Notify listeners
            OnPlayerDataUpdated?.Invoke(currentPlayerData);
            
            yield return null;
        }
        
        private WeatherData LoadWeatherData()
        {
            if (weatherAndSocialManager == null) return new WeatherData();
            
            var weather = weatherAndSocialManager.GetCurrentWeather();
            if (weather == null) return new WeatherData();
            
            return new WeatherData
            {
                isActive = weather.isActive,
                description = weather.description,
                temperature = weather.temperature,
                source = weather.source,
                lastUpdate = weather.timestamp
            };
        }
        
        private CalendarData LoadCalendarData()
        {
            if (calendarAndEventManager == null) return new CalendarData();
            
            var events = calendarAndEventManager.GetAllCalendarEvents();
            return new CalendarData
            {
                total = events.Count,
                active = events.Count(e => e.isOngoing),
                upcoming = events.Count(e => e.isUpcoming),
                recent = events
                    .OrderByDescending(e => e.startTime)
                    .Take(5)
                    .Select(e => new CalendarEventSummary
                    {
                        id = e.id,
                        title = e.title,
                        type = e.eventType.ToString(),
                        startTime = e.startTime,
                        isOngoing = e.isOngoing
                    })
                    .ToList()
            };
        }
        
        private EventData LoadEventData()
        {
            if (calendarAndEventManager == null) return new EventData();
            
            var events = calendarAndEventManager.GetAllGameEvents();
            return new EventData
            {
                total = events.Count,
                active = events.Count(e => e.isOngoing),
                upcoming = events.Count(e => e.isUpcoming),
                completed = events.Count(e => e.isCompleted),
                recent = events
                    .OrderByDescending(e => e.startTime)
                    .Take(5)
                    .Select(e => new GameEventSummary
                    {
                        id = e.id,
                        title = e.title,
                        type = e.eventType.ToString(),
                        startTime = e.startTime,
                        isOngoing = e.isOngoing,
                        completionPercentage = calendarAndEventManager.GetEventCompletionPercentage(e.id)
                    })
                    .ToList()
            };
        }
        
        private SocialData LoadSocialData()
        {
            if (weatherAndSocialManager == null) return new SocialData();
            
            var stats = weatherAndSocialManager.GetSocialStats();
            var history = weatherAndSocialManager.GetShareHistory();
            
            return new SocialData
            {
                totalShares = (int)stats.GetValueOrDefault("totalShares", 0),
                successfulShares = (int)stats.GetValueOrDefault("successfulShares", 0),
                failedShares = (int)stats.GetValueOrDefault("failedShares", 0),
                lastShareTime = (DateTime)stats.GetValueOrDefault("lastShareTime", DateTime.MinValue),
                recent = history
                    .OrderByDescending(h => h.timestamp)
                    .Take(10)
                    .Select(h => new ShareSummary
                    {
                        id = h.id,
                        platform = h.platform.ToString(),
                        timestamp = h.timestamp,
                        success = h.success
                    })
                    .ToList()
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
            
            // Generate active features
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
                features.activeFeatures.Add(new ActiveFeature
                {
                    name = "Weather Bonus",
                    description = $"Enjoy {weather.description} weather with bonus rewards",
                    icon = GetWeatherIcon(weather.description),
                    isActive = true,
                    expiresAt = DateTime.Now.AddHours(6)
                });
            }
            
            // Event-based features
            if (events.active > 0)
            {
                features.activeFeatures.Add(new ActiveFeature
                {
                    name = "Active Events",
                    description = $"{events.active} active events available",
                    icon = "🎮",
                    isActive = true,
                    expiresAt = DateTime.Now.AddDays(1)
                });
            }
            
            // Calendar-based features
            if (calendar.active > 0)
            {
                features.activeFeatures.Add(new ActiveFeature
                {
                    name = "Calendar Events",
                    description = $"{calendar.active} calendar events ongoing",
                    icon = "📅",
                    isActive = true,
                    expiresAt = DateTime.Now.AddDays(1)
                });
            }
        }
        
        private void GenerateRecommendations(WeatherData weather, CalendarData calendar, EventData events, UnifiedFeatures features)
        {
            // Weather-based recommendations
            if (weather.isActive)
            {
                features.recommendations.Add(new Recommendation
                {
                    title = "Weather Challenge",
                    description = $"Take advantage of {weather.description} weather",
                    type = "weather",
                    icon = GetWeatherIcon(weather.description),
                    priority = 1
                });
            }
            
            // Event-based recommendations
            if (events.active > 0)
            {
                features.recommendations.Add(new Recommendation
                {
                    title = "Complete Events",
                    description = $"You have {events.active} active events to complete",
                    type = "event",
                    icon = "🎯",
                    priority = 2
                });
            }
            
            // Time-based recommendations
            features.recommendations.AddRange(features.timeBasedContent.timeRecommendations);
        }
        
        private void GenerateSpecialOffers(WeatherData weather, EventData events, UnifiedFeatures features)
        {
            // Weather-based offers
            if (weather.isActive && weather.temperature > 25f)
            {
                features.specialOffers.Add(new SpecialOffer
                {
                    title = "Hot Weather Special",
                    description = "Cool down with special offers",
                    type = "weather",
                    discount = 0.2f,
                    expiresAt = DateTime.Now.AddHours(4)
                });
            }
            
            // Event-based offers
            if (events.completed > 5)
            {
                features.specialOffers.Add(new SpecialOffer
                {
                    title = "Event Master",
                    description = "Special reward for completing events",
                    type = "event",
                    discount = 0.3f,
                    expiresAt = DateTime.Now.AddDays(1)
                });
            }
        }
        
        private TimeBasedContent GenerateTimeBasedContent()
        {
            var now = DateTime.Now;
            var timeOfDay = GetTimeOfDay(now.Hour);
            var dayType = GetDayType(now.DayOfWeek);
            var specialDay = GetSpecialDay(now.Day);
            
            var timeRecommendations = new List<Recommendation>();
            
            // Time-based recommendations
            if (timeOfDay == "morning")
            {
                timeRecommendations.Add(new Recommendation
                {
                    title = "Morning Energy",
                    description = "Start your day with fresh energy",
                    type = "time",
                    icon = "🌅",
                    priority = 1
                });
            }
            else if (timeOfDay == "evening")
            {
                timeRecommendations.Add(new Recommendation
                {
                    title = "Evening Relaxation",
                    description = "Wind down with some casual gameplay",
                    type = "time",
                    icon = "🌆",
                    priority = 2
                });
            }
            
            return new TimeBasedContent
            {
                timeOfDay = timeOfDay,
                dayType = dayType,
                specialDay = specialDay,
                timeRecommendations = timeRecommendations
            };
        }
        
        private string GetTimeOfDay(int hour)
        {
            if (hour >= 5 && hour < 12) return "morning";
            if (hour >= 12 && hour < 17) return "afternoon";
            if (hour >= 17 && hour < 21) return "evening";
            return "night";
        }
        
        private string GetDayType(DayOfWeek dayOfWeek)
        {
            return (dayOfWeek == DayOfWeek.Saturday || dayOfWeek == DayOfWeek.Sunday) ? "weekend" : "weekday";
        }
        
        private string GetSpecialDay(int dayOfMonth)
        {
            if (dayOfMonth == 1) return "month_start";
            if (dayOfMonth == 15) return "mid_month";
            if (dayOfMonth >= 28) return "month_end";
            return "regular";
        }
        
        private string GetWeatherIcon(string description)
        {
            string desc = description.ToLower();
            if (desc.Contains("sunny") || desc.Contains("clear")) return "☀️";
            if (desc.Contains("cloudy")) return "☁️";
            if (desc.Contains("rain") || desc.Contains("drizzle")) return "🌧️";
            if (desc.Contains("storm") || desc.Contains("thunder")) return "⛈️";
            if (desc.Contains("snow")) return "❄️";
            if (desc.Contains("fog")) return "🌫️";
            if (desc.Contains("wind")) return "💨";
            return "🌤️";
        }
        
        private IEnumerator UpdateUnifiedSystem()
        {
            yield return StartCoroutine(LoadUnifiedPlayerData());
            UpdateSystemStatus();
        }
        
        private void UpdateSystemStatus()
        {
            systemStatus.weatherSystemActive = weatherAndSocialManager != null && weatherAndSocialManager.IsWeatherActive();
            systemStatus.socialSystemActive = weatherAndSocialManager != null;
            systemStatus.calendarSystemActive = calendarAndEventManager != null;
            systemStatus.eventSystemActive = calendarAndEventManager != null;
            systemStatus.unifiedSystemActive = isInitialized;
            systemStatus.lastUpdate = DateTime.Now;
            
            // Determine overall status
            if (systemStatus.weatherSystemActive && systemStatus.socialSystemActive && 
                systemStatus.calendarSystemActive && systemStatus.eventSystemActive)
            {
                systemStatus.status = "All Systems Operational";
            }
            else if (systemStatus.weatherSystemActive || systemStatus.socialSystemActive || 
                     systemStatus.calendarSystemActive || systemStatus.eventSystemActive)
            {
                systemStatus.status = "Partially Operational";
            }
            else
            {
                systemStatus.status = "Systems Offline";
            }
            
            OnSystemStatusUpdated?.Invoke(systemStatus);
        }
        
        // Public API Methods
        public UnifiedPlayerData GetCurrentPlayerData()
        {
            return currentPlayerData;
        }
        
        public SystemStatus GetSystemStatus()
        {
            return systemStatus;
        }
        
        public void SetTimezone(string timezone)
        {
            defaultTimezone = timezone;
            
            if (calendarAndEventManager != null)
            {
                calendarAndEventManager.SetTimezone(timezone);
            }
            
            Debug.Log($"Timezone set to: {timezone}");
        }
        
        public string GetCurrentTimezone()
        {
            return defaultTimezone;
        }
        
        public void SetLocation(float latitude, float longitude, string locationName)
        {
            if (weatherAndSocialManager != null)
            {
                weatherAndSocialManager.SetLocation(latitude, longitude, locationName);
            }
        }
        
        public void RefreshAllData()
        {
            if (weatherAndSocialManager != null)
            {
                weatherAndSocialManager.RefreshWeather();
            }
            
            if (calendarAndEventManager != null)
            {
                calendarAndEventManager.RefreshCalendar();
                calendarAndEventManager.RefreshEvents();
            }
            
            StartCoroutine(LoadUnifiedPlayerData());
        }
        
        public void SetUnifiedSystemEnabled(bool enabled)
        {
            enableRealTimeUpdates = enabled;
            
            if (enabled && updateCoroutine == null)
            {
                updateCoroutine = StartCoroutine(UnifiedUpdateLoop());
            }
            else if (!enabled && updateCoroutine != null)
            {
                StopCoroutine(updateCoroutine);
                updateCoroutine = null;
            }
        }
        
        public void SetRealTimeUpdatesEnabled(bool enabled)
        {
            SetUnifiedSystemEnabled(enabled);
        }
        
        // Convenience methods for accessing sub-systems
        public KeyFreeWeatherAndSocialManager GetWeatherAndSocialManager()
        {
            return weatherAndSocialManager;
        }
        
        public KeyFreeCalendarAndEventManager GetCalendarAndEventManager()
        {
            return calendarAndEventManager;
        }
        
        void OnDestroy()
        {
            if (updateCoroutine != null)
            {
                StopCoroutine(updateCoroutine);
            }
            
            // Unsubscribe from events
            if (weatherAndSocialManager != null)
            {
                KeyFreeWeatherAndSocialManager.OnWeatherUpdated -= OnWeatherDataUpdated;
                KeyFreeWeatherAndSocialManager.OnShareCompleted -= OnSocialShareCompleted;
            }
            
            if (calendarAndEventManager != null)
            {
                KeyFreeCalendarAndEventManager.OnCalendarEventsUpdated -= OnCalendarEventsUpdated;
                KeyFreeCalendarAndEventManager.OnGameEventsUpdated -= OnGameEventsUpdated;
                KeyFreeCalendarAndEventManager.OnEventCompleted -= OnEventCompleted;
            }
        }
    }
}