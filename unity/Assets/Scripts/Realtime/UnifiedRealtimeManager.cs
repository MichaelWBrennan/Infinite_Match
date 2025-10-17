using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using System.Text;
using Newtonsoft.Json;
using Evergreen.Core;
using Evergreen.Integration;
using Evergreen.Realtime;

namespace Evergreen.Realtime
{
    /// <summary>
    /// Unified Real-Time Manager for Unity
    /// Connects weather, calendar, and events into a cohesive real-time experience
    /// </summary>
    public class UnifiedRealtimeManager : MonoBehaviour
    {
        [Header("Unified System Configuration")]
        [SerializeField] private bool enableUnifiedSystem = true;
        [SerializeField] private bool enableRealTimeUpdates = true;
        [SerializeField] private string defaultTimezone = "UTC";
        [SerializeField] private float updateInterval = 30f;
        
        [Header("API Configuration")]
        [SerializeField] private string backendUrl = "http://localhost:3000";
        [SerializeField] private string apiKey = "your_api_key_here";
        
        [Header("System Components")]
        [SerializeField] private bool enableWeatherSystem = true;
        [SerializeField] private bool enableCalendarSystem = true;
        [SerializeField] private bool enableEventSystem = true;
        [SerializeField] private bool enableLocationTracking = true;
        
        [Header("Player Configuration")]
        [SerializeField] private string playerId = "";
        [SerializeField] private float latitude = 51.5074f; // London default
        [SerializeField] private float longitude = -0.1278f;
        [SerializeField] private string locationName = "London";
        
        // Singleton
        public static UnifiedRealtimeManager Instance { get; private set; }
        
        // Services
        private BackendConnector backendConnector;
        private GameAnalyticsManager analyticsManager;
        private GameDataManager dataManager;
        private AdvancedWeatherSystem weatherSystem;
        private RealtimeCalendarManager calendarManager;
        private RealtimeEventManager eventManager;
        
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
            public Dictionary<string, object> unified;
        }
        
        [System.Serializable]
        public class UnifiedResponse
        {
            public bool success;
            public UnifiedPlayerData data;
            public string error;
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
            StartCoroutine(InitializeUnifiedSystem());
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
            if (!enableUnifiedSystem)
            {
                Debug.Log("Unified real-time system is disabled");
                yield break;
            }
            
            // Get references to other systems
            backendConnector = BackendConnector.Instance;
            analyticsManager = GameAnalyticsManager.Instance;
            dataManager = GameDataManager.Instance;
            weatherSystem = AdvancedWeatherSystem.Instance;
            calendarManager = RealtimeCalendarManager.Instance;
            eventManager = RealtimeEventManager.Instance;
            
            if (backendConnector == null)
            {
                Debug.LogError("BackendConnector not found! Unified system requires backend connection.");
                yield break;
            }
            
            // Initialize individual systems
            if (enableWeatherSystem && weatherSystem == null)
            {
                var weatherGO = new GameObject("WeatherSystem");
                weatherSystem = weatherGO.AddComponent<AdvancedWeatherSystem>();
            }
            
            if (enableCalendarSystem && calendarManager == null)
            {
                var calendarGO = new GameObject("CalendarManager");
                calendarManager = calendarGO.AddComponent<RealtimeCalendarManager>();
            }
            
            if (enableEventSystem && eventManager == null)
            {
                var eventGO = new GameObject("EventManager");
                eventManager = eventGO.AddComponent<RealtimeEventManager>();
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
            
            Debug.Log("Unified real-time system initialized successfully");
        }
        
        private void SetupEventListeners()
        {
            // Weather system events
            if (weatherSystem != null)
            {
                // Subscribe to weather events if available
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
        }
        
        private void OnCalendarEventsUpdated(List<CalendarEvent> events)
        {
            OnCalendarUpdated?.Invoke(events);
            Debug.Log($"Calendar events updated: {events.Count} events");
        }
        
        private void OnGameEventsUpdated(List<GameEvent> events)
        {
            OnEventsUpdated?.Invoke(events);
            Debug.Log($"Game events updated: {events.Count} events");
        }
        
        private IEnumerator UnifiedUpdateLoop()
        {
            while (enableRealTimeUpdates)
            {
                yield return new WaitForSeconds(updateInterval);
                yield return StartCoroutine(UpdateUnifiedSystem());
            }
        }
        
        /// <summary>
        /// Load unified player data from backend
        /// </summary>
        public IEnumerator LoadUnifiedPlayerData()
        {
            if (backendConnector == null) yield break;
            
            string url = $"{backendUrl}/api/realtime/unified/player/{playerId}?timezone={defaultTimezone}";
            
            yield return StartCoroutine(backendConnector.MakeAPIRequest("GET", url, null, (response) =>
            {
                if (response.success)
                {
                    currentPlayerData = response.data;
                    ProcessUnifiedPlayerData();
                    OnPlayerDataUpdated?.Invoke(currentPlayerData);
                    Debug.Log("Unified player data loaded successfully");
                }
                else
                {
                    Debug.LogError($"Failed to load unified player data: {response.error}");
                }
            }));
        }
        
        private IEnumerator UpdateUnifiedSystem()
        {
            yield return StartCoroutine(LoadUnifiedPlayerData());
            
            // Update individual systems
            if (enableWeatherSystem && weatherSystem != null)
            {
                UpdateWeatherSystem();
            }
            
            if (enableCalendarSystem && calendarManager != null)
            {
                calendarManager.RefreshCalendar();
            }
            
            if (enableEventSystem && eventManager != null)
            {
                eventManager.RefreshEvents();
            }
            
            // Update system status
            yield return StartCoroutine(UpdateSystemStatus());
            
            lastUpdate = DateTime.Now;
        }
        
        private void ProcessUnifiedPlayerData()
        {
            if (currentPlayerData == null) return;
            
            // Process weather data
            if (currentPlayerData.weather != null && enableWeatherSystem)
            {
                ProcessWeatherData(currentPlayerData.weather);
                OnWeatherUpdated?.Invoke(currentPlayerData.weather);
            }
            
            // Process calendar data
            if (currentPlayerData.calendar != null && enableCalendarSystem)
            {
                ProcessCalendarData(currentPlayerData.calendar);
            }
            
            // Process event data
            if (currentPlayerData.events != null && enableEventSystem)
            {
                ProcessEventData(currentPlayerData.events);
            }
            
            // Process unified features
            if (currentPlayerData.unified != null)
            {
                ProcessUnifiedFeatures(currentPlayerData.unified);
            }
        }
        
        private void ProcessWeatherData(WeatherData weatherData)
        {
            if (weatherSystem != null && weatherData.isActive)
            {
                // Apply weather effects to game systems
                var effects = weatherData.gameplayEffects;
                if (effects != null)
                {
                    ApplyWeatherGameplayEffects(effects);
                }
            }
        }
        
        private void ProcessCalendarData(CalendarData calendarData)
        {
            // Process calendar events
            Debug.Log($"Processing {calendarData.current.Count} current and {calendarData.upcoming.Count} upcoming calendar events");
        }
        
        private void ProcessEventData(EventData eventData)
        {
            // Process game events
            Debug.Log($"Processing {eventData.current.Count} current and {eventData.upcoming.Count} upcoming game events");
        }
        
        private void ProcessUnifiedFeatures(UnifiedFeatures features)
        {
            // Process active features
            if (features.activeFeatures != null)
            {
                foreach (var feature in features.activeFeatures)
                {
                    ApplyActiveFeature(feature);
                }
            }
            
            // Process recommendations
            if (features.recommendations != null)
            {
                foreach (var recommendation in features.recommendations)
                {
                    ProcessRecommendation(recommendation);
                }
            }
            
            // Process special offers
            if (features.specialOffers != null)
            {
                foreach (var offer in features.specialOffers)
                {
                    ProcessSpecialOffer(offer);
                }
            }
        }
        
        private void ApplyWeatherGameplayEffects(Dictionary<string, object> effects)
        {
            // Apply weather effects to game systems
            if (effects.ContainsKey("scoreMultiplier"))
            {
                var multiplier = Convert.ToSingle(effects["scoreMultiplier"]);
                // Apply to score system
                Debug.Log($"Applying weather score multiplier: {multiplier}");
            }
            
            if (effects.ContainsKey("energyRegen"))
            {
                var regen = Convert.ToSingle(effects["energyRegen"]);
                // Apply to energy system
                Debug.Log($"Applying weather energy regen: {regen}");
            }
            
            if (effects.ContainsKey("specialChance"))
            {
                var chance = Convert.ToSingle(effects["specialChance"]);
                // Apply to special tile system
                Debug.Log($"Applying weather special chance: {chance}");
            }
        }
        
        private void ApplyActiveFeature(ActiveFeature feature)
        {
            Debug.Log($"Applying active feature: {feature.name} (x{feature.multiplier})");
            
            switch (feature.type)
            {
                case "weather_rain":
                    // Apply rain effects
                    break;
                case "weather_snow":
                    // Apply snow effects
                    break;
                case "weather_storm":
                    // Apply storm effects
                    break;
                case "event":
                    // Apply event effects
                    break;
                case "calendar":
                    // Apply calendar effects
                    break;
            }
        }
        
        private void ProcessRecommendation(Recommendation recommendation)
        {
            Debug.Log($"Processing recommendation: {recommendation.title} ({recommendation.priority})");
            
            // Show recommendation to player
            ShowRecommendationUI(recommendation);
        }
        
        private void ProcessSpecialOffer(SpecialOffer offer)
        {
            Debug.Log($"Processing special offer: {offer.title} ({offer.discount}% off)");
            
            // Show special offer to player
            ShowSpecialOfferUI(offer);
        }
        
        private void ShowRecommendationUI(Recommendation recommendation)
        {
            // Show recommendation in UI
            // This would integrate with your UI system
        }
        
        private void ShowSpecialOfferUI(SpecialOffer offer)
        {
            // Show special offer in UI
            // This would integrate with your UI system
        }
        
        private IEnumerator UpdateSystemStatus()
        {
            if (backendConnector == null) yield break;
            
            string url = $"{backendUrl}/api/realtime/unified/stats";
            
            yield return StartCoroutine(backendConnector.MakeAPIRequest("GET", url, null, (response) =>
            {
                if (response.success)
                {
                    systemStatus = response.data;
                    OnSystemStatusUpdated?.Invoke(systemStatus);
                }
                else
                {
                    Debug.LogError($"Failed to update system status: {response.error}");
                }
            }));
        }
        
        private void UpdateWeatherSystem()
        {
            if (weatherSystem != null && currentPlayerData?.weather != null)
            {
                // Update weather system with current data
                var weatherData = currentPlayerData.weather;
                if (weatherData.isActive)
                {
                    // Apply weather effects
                    Debug.Log($"Updating weather system: {weatherData.type} ({weatherData.temperature}°C)");
                }
            }
        }
        
        /// <summary>
        /// Update player location
        /// </summary>
        public IEnumerator UpdatePlayerLocation(float latitude, float longitude, string locationName = null)
        {
            if (backendConnector == null) yield break;
            
            this.latitude = latitude;
            this.longitude = longitude;
            this.locationName = locationName ?? "Unknown Location";
            
            string url = $"{backendUrl}/api/realtime/unified/player/{playerId}/location";
            var requestData = new Dictionary<string, object>
            {
                {"latitude", latitude},
                {"longitude", longitude},
                {"locationName", this.locationName},
                {"timezone", defaultTimezone}
            };
            
            yield return StartCoroutine(backendConnector.MakeAPIRequest("POST", url, requestData, (response) =>
            {
                if (response.success)
                {
                    Debug.Log($"Player location updated: {this.locationName}");
                    // Refresh unified data with new location
                    StartCoroutine(LoadUnifiedPlayerData());
                }
                else
                {
                    Debug.LogError($"Failed to update player location: {response.error}");
                }
            }));
        }
        
        /// <summary>
        /// Get current unified player data
        /// </summary>
        public UnifiedPlayerData GetCurrentPlayerData()
        {
            return currentPlayerData;
        }
        
        /// <summary>
        /// Get system status
        /// </summary>
        public Dictionary<string, object> GetSystemStatus()
        {
            return systemStatus;
        }
        
        /// <summary>
        /// Set timezone
        /// </summary>
        public void SetTimezone(string timezone)
        {
            if (defaultTimezone != timezone)
            {
                defaultTimezone = timezone;
                
                // Update individual systems
                if (calendarManager != null)
                    calendarManager.SetTimezone(timezone);
                if (eventManager != null)
                    eventManager.SetTimezone(timezone);
                
                // Refresh unified data
                StartCoroutine(LoadUnifiedPlayerData());
                Debug.Log($"Unified system timezone changed to: {timezone}");
            }
        }
        
        /// <summary>
        /// Get current timezone
        /// </summary>
        public string GetCurrentTimezone()
        {
            return defaultTimezone;
        }
        
        /// <summary>
        /// Force refresh all data
        /// </summary>
        public void RefreshAllData()
        {
            StartCoroutine(LoadUnifiedPlayerData());
        }
        
        /// <summary>
        /// Enable/disable unified system
        /// </summary>
        public void SetUnifiedSystemEnabled(bool enabled)
        {
            enableUnifiedSystem = enabled;
            if (enabled)
            {
                StartCoroutine(InitializeUnifiedSystem());
            }
        }
        
        /// <summary>
        /// Enable/disable real-time updates
        /// </summary>
        public void SetRealTimeUpdatesEnabled(bool enabled)
        {
            enableRealTimeUpdates = enabled;
            if (enabled && enableUnifiedSystem)
            {
                StartCoroutine(UnifiedUpdateLoop());
            }
        }
        
        void OnDestroy()
        {
            // Clean up event listeners
            if (calendarManager != null)
            {
                calendarManager.OnEventsUpdated -= OnCalendarEventsUpdated;
            }
            
            if (eventManager != null)
            {
                eventManager.OnEventsUpdated -= OnGameEventsUpdated;
            }
        }
    }
}