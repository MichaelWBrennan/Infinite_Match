using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using System.Linq;
using Evergreen.Core;

namespace Evergreen.Realtime
{
    /// <summary>
    /// Key-Free Event Manager
    /// Uses local data and system time for game events without external APIs
    /// </summary>
    public class KeyFreeEventManager : MonoBehaviour
    {
        [Header("Event Configuration")]
        [SerializeField] private bool enableEventSystem = true;
        [SerializeField] private bool enableRealTimeUpdates = true;
        [SerializeField] private string timezone = "UTC";
        [SerializeField] private float updateInterval = 30f; // 30 seconds
        
        [Header("Event Generation")]
        [SerializeField] private bool enableDailyChallenges = true;
        [SerializeField] private bool enableWeeklyTournaments = true;
        [SerializeField] private bool enableSpecialOffers = true;
        [SerializeField] private bool enableRandomEvents = true;
        [SerializeField] private bool enableWeatherEvents = true;
        
        [Header("Event Settings")]
        [SerializeField] private int maxActiveEvents = 10;
        [SerializeField] private float randomEventChance = 0.05f; // 5% chance per update
        [SerializeField] private float specialOfferChance = 0.02f; // 2% chance per update
        [SerializeField] private bool enableEventNotifications = true;
        
        // Singleton
        public static KeyFreeEventManager Instance { get; private set; }
        
        // Services
        private GameAnalyticsManager analyticsManager;
        private KeyFreeWeatherSystem weatherSystem;
        
        // Event data
        private List<GameEvent> activeEvents = new List<GameEvent>();
        private List<GameEvent> upcomingEvents = new List<GameEvent>();
        private Dictionary<string, GameEvent> eventCache = new Dictionary<string, GameEvent>();
        private Dictionary<string, EventProgress> playerProgress = new Dictionary<string, EventProgress>();
        private DateTime lastUpdate;
        private DateTime lastDailyChallenge;
        private DateTime lastWeeklyTournament;
        
        // Events
        public System.Action<GameEvent> OnEventStarted;
        public System.Action<GameEvent> OnEventEnded;
        public System.Action<GameEvent> OnEventUpdated;
        public System.Action<GameEvent> OnEventCompleted;
        public System.Action<EventProgress> OnProgressUpdated;
        public System.Action<List<GameEvent>> OnEventsUpdated;
        
        [System.Serializable]
        public class GameEvent
        {
            public string id;
            public string title;
            public string description;
            public EventType eventType;
            public DateTime startTime;
            public DateTime endTime;
            public string timezone;
            public int priority;
            public bool isActive;
            public bool isRecurring;
            public Dictionary<string, object> requirements;
            public Dictionary<string, object> rewards;
            public Dictionary<string, object> metadata;
            public DateTime createdAt;
            public DateTime updatedAt;
            
            // Computed properties
            public bool isOngoing;
            public bool isUpcoming;
            public bool isExpired;
            public int durationMinutes;
            public int timeRemainingMinutes;
        }
        
        [System.Serializable]
        public class EventProgress
        {
            public string eventId;
            public string playerId;
            public Dictionary<string, object> progressData;
            public bool isCompleted;
            public DateTime lastUpdated;
        }
        
        public enum EventType
        {
            DailyChallenge,
            WeeklyTournament,
            SpecialOffer,
            Random,
            Weather,
            Seasonal,
            Maintenance,
            Tutorial,
            Achievement,
            Social
        }
        
        // Event templates for generation
        private List<EventTemplate> eventTemplates = new List<EventTemplate>();
        
        [System.Serializable]
        public class EventTemplate
        {
            public EventType eventType;
            public string title;
            public string description;
            public Dictionary<string, object> requirements;
            public Dictionary<string, object> rewards;
            public float duration; // hours
            public int priority;
            public float chance; // 0-1
        }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeEventManager();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            if (enableEventSystem)
            {
                StartCoroutine(InitializeEventSystem());
            }
        }
        
        private void InitializeEventManager()
        {
            lastUpdate = DateTime.MinValue;
            lastDailyChallenge = DateTime.MinValue;
            lastWeeklyTournament = DateTime.MinValue;
            
            analyticsManager = GameAnalyticsManager.Instance;
            weatherSystem = KeyFreeWeatherSystem.Instance;
            
            // Initialize event templates
            InitializeEventTemplates();
        }
        
        private void InitializeEventTemplates()
        {
            // Daily challenge templates
            eventTemplates.Add(new EventTemplate
            {
                eventType = EventType.DailyChallenge,
                title = "Daily Challenge",
                description = "Complete 5 levels to earn bonus rewards!",
                requirements = new Dictionary<string, object> { {"levels_completed", 5} },
                rewards = new Dictionary<string, object> { {"coins", 500}, {"gems", 50}, {"energy", 5} },
                duration = 24f,
                priority = 1,
                chance = 1.0f
            });
            
            eventTemplates.Add(new EventTemplate
            {
                eventType = EventType.DailyChallenge,
                title = "Score Master",
                description = "Achieve a score of 10,000 points!",
                requirements = new Dictionary<string, object> { {"score_achieved", 10000} },
                rewards = new Dictionary<string, object> { {"coins", 800}, {"gems", 80} },
                duration = 24f,
                priority = 1,
                chance = 0.8f
            });
            
            // Weekly tournament templates
            eventTemplates.Add(new EventTemplate
            {
                eventType = EventType.WeeklyTournament,
                title = "Weekly Tournament",
                description = "Compete for the top spot and win amazing rewards!",
                requirements = new Dictionary<string, object> { {"score_achieved", 50000} },
                rewards = new Dictionary<string, object> { {"coins", 2000}, {"gems", 200}, {"trophy", 1} },
                duration = 168f, // 7 days
                priority = 2,
                chance = 1.0f
            });
            
            // Special offer templates
            eventTemplates.Add(new EventTemplate
            {
                eventType = EventType.SpecialOffer,
                title = "Double Coins Hour",
                description = "Earn double coins for the next hour!",
                requirements = new Dictionary<string, object> { {"matches_made", 10} },
                rewards = new Dictionary<string, object> { {"coins", 1000}, {"coin_multiplier", 2} },
                duration = 1f,
                priority = 3,
                chance = 0.1f
            });
            
            eventTemplates.Add(new EventTemplate
            {
                eventType = EventType.SpecialOffer,
                title = "Energy Boost",
                description = "Get bonus energy refills!",
                requirements = new Dictionary<string, object> { {"energy_used", 5} },
                rewards = new Dictionary<string, object> { {"energy", 10}, {"energy_multiplier", 1.5} },
                duration = 2f,
                priority = 3,
                chance = 0.1f
            });
            
            // Random event templates
            eventTemplates.Add(new EventTemplate
            {
                eventType = EventType.Random,
                title = "Lucky Day",
                description = "Increased chance for special tiles!",
                requirements = new Dictionary<string, object> { {"special_tiles", 5} },
                rewards = new Dictionary<string, object> { {"gems", 100}, {"special_chance", 2.0} },
                duration = 3f,
                priority = 4,
                chance = 0.05f
            });
            
            eventTemplates.Add(new EventTemplate
            {
                eventType = EventType.Random,
                title = "Power Hour",
                description = "All power-ups are 50% more effective!",
                requirements = new Dictionary<string, object> { {"powerups_used", 3} },
                rewards = new Dictionary<string, object> { {"powerup_effectiveness", 1.5} },
                duration = 1f,
                priority = 4,
                chance = 0.03f
            });
        }
        
        private IEnumerator InitializeEventSystem()
        {
            Debug.Log("Initializing Key-Free Event System");
            
            // Load existing events from local storage
            LoadEventsFromStorage();
            
            // Generate initial events
            GenerateInitialEvents();
            
            // Start update loop
            if (enableRealTimeUpdates)
            {
                StartCoroutine(EventUpdateLoop());
            }
            
            Debug.Log("Key-Free Event System initialized successfully");
        }
        
        private void LoadEventsFromStorage()
        {
            // Load events from PlayerPrefs
            string eventsJson = PlayerPrefs.GetString("game_events", "");
            
            if (!string.IsNullOrEmpty(eventsJson))
            {
                try
                {
                    var savedEvents = JsonUtility.FromJson<GameEventList>(eventsJson);
                    if (savedEvents != null && savedEvents.events != null)
                    {
                        foreach (var evt in savedEvents.events)
                        {
                            ProcessGameEvent(evt);
                            eventCache[evt.id] = evt;
                        }
                    }
                }
                catch (Exception e)
                {
                    Debug.LogError($"Failed to load events from storage: {e.Message}");
                }
            }
            
            // Load player progress
            string progressJson = PlayerPrefs.GetString("event_progress", "");
            
            if (!string.IsNullOrEmpty(progressJson))
            {
                try
                {
                    var savedProgress = JsonUtility.FromJson<EventProgressList>(progressJson);
                    if (savedProgress != null && savedProgress.progress != null)
                    {
                        foreach (var progress in savedProgress.progress)
                        {
                            playerProgress[progress.eventId] = progress;
                        }
                    }
                }
                catch (Exception e)
                {
                    Debug.LogError($"Failed to load progress from storage: {e.Message}");
                }
            }
        }
        
        private void SaveEventsToStorage()
        {
            try
            {
                var allEvents = GetAllEvents();
                var eventList = new GameEventList { events = allEvents };
                string eventsJson = JsonUtility.ToJson(eventList);
                PlayerPrefs.SetString("game_events", eventsJson);
                
                var progressList = new EventProgressList { progress = playerProgress.Values.ToList() };
                string progressJson = JsonUtility.ToJson(progressList);
                PlayerPrefs.SetString("event_progress", progressJson);
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to save events to storage: {e.Message}");
            }
        }
        
        [System.Serializable]
        public class GameEventList
        {
            public List<GameEvent> events;
        }
        
        [System.Serializable]
        public class EventProgressList
        {
            public List<EventProgress> progress;
        }
        
        private void GenerateInitialEvents()
        {
            var now = DateTime.Now;
            
            // Generate daily challenges
            if (enableDailyChallenges)
            {
                GenerateDailyChallenges(now);
            }
            
            // Generate weekly tournaments
            if (enableWeeklyTournaments)
            {
                GenerateWeeklyTournaments(now);
            }
            
            // Generate special offers
            if (enableSpecialOffers)
            {
                GenerateSpecialOffers(now);
            }
            
            // Generate weather events
            if (enableWeatherEvents && weatherSystem != null)
            {
                GenerateWeatherEvents(now);
            }
        }
        
        private void GenerateDailyChallenges(DateTime now)
        {
            if (now.Date > lastDailyChallenge.Date)
            {
                var template = eventTemplates.FirstOrDefault(t => t.eventType == EventType.DailyChallenge);
                if (template != null)
                {
                    var evt = CreateEventFromTemplate(template, now);
                    AddEvent(evt);
                    lastDailyChallenge = now;
                }
            }
        }
        
        private void GenerateWeeklyTournaments(DateTime now)
        {
            if (now.Date > lastWeeklyTournament.Date && now.DayOfWeek == DayOfWeek.Monday)
            {
                var template = eventTemplates.FirstOrDefault(t => t.eventType == EventType.WeeklyTournament);
                if (template != null)
                {
                    var evt = CreateEventFromTemplate(template, now);
                    AddEvent(evt);
                    lastWeeklyTournament = now;
                }
            }
        }
        
        private void GenerateSpecialOffers(DateTime now)
        {
            if (UnityEngine.Random.Range(0f, 1f) < specialOfferChance)
            {
                var templates = eventTemplates.Where(t => t.eventType == EventType.SpecialOffer).ToList();
                if (templates.Count > 0)
                {
                    var template = templates[UnityEngine.Random.Range(0, templates.Count)];
                    var evt = CreateEventFromTemplate(template, now);
                    AddEvent(evt);
                }
            }
        }
        
        private void GenerateWeatherEvents(DateTime now)
        {
            if (weatherSystem != null && weatherSystem.IsWeatherActive())
            {
                var weatherData = weatherSystem.GetCurrentWeather();
                if (weatherData != null && weatherData.type != Evergreen.Weather.KeyFreeWeatherSystem.WeatherType.Clear)
                {
                    var evt = CreateWeatherEvent(weatherData, now);
                    AddEvent(evt);
                }
            }
        }
        
        private GameEvent CreateEventFromTemplate(EventTemplate template, DateTime now)
        {
            return new GameEvent
            {
                id = $"{template.eventType}_{now.Ticks}",
                title = template.title,
                description = template.description,
                eventType = template.eventType,
                startTime = now,
                endTime = now.AddHours(template.duration),
                timezone = timezone,
                priority = template.priority,
                isActive = true,
                isRecurring = false,
                requirements = new Dictionary<string, object>(template.requirements),
                rewards = new Dictionary<string, object>(template.rewards),
                metadata = new Dictionary<string, object>(),
                createdAt = now,
                updatedAt = now
            };
        }
        
        private GameEvent CreateWeatherEvent(Evergreen.Weather.KeyFreeWeatherSystem.WeatherData weatherData, DateTime now)
        {
            string title = GetWeatherEventTitle(weatherData.type);
            string description = GetWeatherEventDescription(weatherData.type);
            var rewards = GetWeatherEventRewards(weatherData.type);
            
            return new GameEvent
            {
                id = $"weather_{now.Ticks}",
                title = title,
                description = description,
                eventType = EventType.Weather,
                startTime = now,
                endTime = now.AddHours(4f),
                timezone = timezone,
                priority = 3,
                isActive = true,
                isRecurring = false,
                requirements = new Dictionary<string, object> { {"weather_matches", 1} },
                rewards = rewards,
                metadata = new Dictionary<string, object>
                {
                    {"weather_type", weatherData.type.ToString()},
                    {"temperature", weatherData.temperature}
                },
                createdAt = now,
                updatedAt = now
            };
        }
        
        private string GetWeatherEventTitle(Evergreen.Weather.KeyFreeWeatherSystem.WeatherType weatherType)
        {
            switch (weatherType)
            {
                case Evergreen.Weather.KeyFreeWeatherSystem.WeatherType.Rain:
                    return "Rainy Day Bonus";
                case Evergreen.Weather.KeyFreeWeatherSystem.WeatherType.Snow:
                    return "Winter Wonderland";
                case Evergreen.Weather.KeyFreeWeatherSystem.WeatherType.Thunderstorm:
                    return "Storm Power";
                case Evergreen.Weather.KeyFreeWeatherSystem.WeatherType.Fog:
                    return "Mysterious Fog";
                case Evergreen.Weather.KeyFreeWeatherSystem.WeatherType.Cloudy:
                    return "Cloudy Day Special";
                default:
                    return "Weather Event";
            }
        }
        
        private string GetWeatherEventDescription(Evergreen.Weather.KeyFreeWeatherSystem.WeatherType weatherType)
        {
            switch (weatherType)
            {
                case Evergreen.Weather.KeyFreeWeatherSystem.WeatherType.Rain:
                    return "The rain brings extra rewards! Complete matches to earn bonus coins!";
                case Evergreen.Weather.KeyFreeWeatherSystem.WeatherType.Snow:
                    return "Snow is falling! Enjoy the winter atmosphere and special rewards!";
                case Evergreen.Weather.KeyFreeWeatherSystem.WeatherType.Thunderstorm:
                    return "Thunder and lightning! High energy events with amazing rewards!";
                case Evergreen.Weather.KeyFreeWeatherSystem.WeatherType.Fog:
                    return "Mysterious fog has appeared! Uncover hidden rewards!";
                case Evergreen.Weather.KeyFreeWeatherSystem.WeatherType.Cloudy:
                    return "Cloudy skies bring special opportunities!";
                default:
                    return "Weather-based event is active!";
            }
        }
        
        private Dictionary<string, object> GetWeatherEventRewards(Evergreen.Weather.KeyFreeWeatherSystem.WeatherType weatherType)
        {
            switch (weatherType)
            {
                case Evergreen.Weather.KeyFreeWeatherSystem.WeatherType.Rain:
                    return new Dictionary<string, object> { {"coins", 800}, {"gems", 80}, {"energy", 3} };
                case Evergreen.Weather.KeyFreeWeatherSystem.WeatherType.Snow:
                    return new Dictionary<string, object> { {"coins", 600}, {"gems", 60}, {"winter_items", 2} };
                case Evergreen.Weather.KeyFreeWeatherSystem.WeatherType.Thunderstorm:
                    return new Dictionary<string, object> { {"coins", 1200}, {"gems", 120}, {"energy", 5} };
                case Evergreen.Weather.KeyFreeWeatherSystem.WeatherType.Fog:
                    return new Dictionary<string, object> { {"coins", 500}, {"gems", 50}, {"mystery_items", 1} };
                case Evergreen.Weather.KeyFreeWeatherSystem.WeatherType.Cloudy:
                    return new Dictionary<string, object> { {"coins", 400}, {"gems", 40}, {"energy", 2} };
                default:
                    return new Dictionary<string, object> { {"coins", 300}, {"gems", 30} };
            }
        }
        
        private void AddEvent(GameEvent evt)
        {
            ProcessGameEvent(evt);
            eventCache[evt.id] = evt;
            
            if (evt.isOngoing)
            {
                activeEvents.Add(evt);
            }
            else if (evt.isUpcoming)
            {
                upcomingEvents.Add(evt);
            }
        }
        
        private IEnumerator EventUpdateLoop()
        {
            while (enableRealTimeUpdates)
            {
                yield return new WaitForSeconds(updateInterval);
                UpdateEvents();
            }
        }
        
        private void UpdateEvents()
        {
            var now = DateTime.Now;
            
            // Generate new events
            GenerateInitialEvents();
            
            // Generate random events
            if (enableRandomEvents && UnityEngine.Random.Range(0f, 1f) < randomEventChance)
            {
                GenerateRandomEvent(now);
            }
            
            // Update event statuses
            UpdateEventStatuses();
            
            // Save events
            SaveEventsToStorage();
            
            lastUpdate = now;
        }
        
        private void GenerateRandomEvent(DateTime now)
        {
            var templates = eventTemplates.Where(t => t.eventType == EventType.Random).ToList();
            if (templates.Count > 0)
            {
                var template = templates[UnityEngine.Random.Range(0, templates.Count)];
                var evt = CreateEventFromTemplate(template, now);
                AddEvent(evt);
                Debug.Log($"Random event generated: {evt.title}");
            }
        }
        
        private void UpdateEventStatuses()
        {
            var now = DateTime.Now;
            var eventsToRemove = new List<GameEvent>();
            
            foreach (var evt in activeEvents.ToList())
            {
                ProcessGameEvent(evt);
                
                if (evt.isExpired)
                {
                    eventsToRemove.Add(evt);
                    OnEventEnded?.Invoke(evt);
                }
            }
            
            foreach (var evt in upcomingEvents.ToList())
            {
                ProcessGameEvent(evt);
                
                if (evt.isOngoing)
                {
                    upcomingEvents.Remove(evt);
                    activeEvents.Add(evt);
                    OnEventStarted?.Invoke(evt);
                }
            }
            
            // Remove expired events
            foreach (var evt in eventsToRemove)
            {
                activeEvents.Remove(evt);
                eventCache.Remove(evt.id);
            }
            
            // Notify listeners
            OnEventsUpdated?.Invoke(GetAllEvents());
        }
        
        private void ProcessGameEvent(GameEvent evt)
        {
            var now = DateTime.Now;
            
            evt.isOngoing = now >= evt.startTime && now <= evt.endTime;
            evt.isUpcoming = now < evt.startTime;
            evt.isExpired = now > evt.endTime;
            evt.durationMinutes = (int)(evt.endTime - evt.startTime).TotalMinutes;
            evt.timeRemainingMinutes = evt.isOngoing ? (int)(evt.endTime - now).TotalMinutes : 0;
        }
        
        /// <summary>
        /// Update event progress
        /// </summary>
        public void UpdateEventProgress(string eventId, Dictionary<string, object> progressData)
        {
            var evt = GetEvent(eventId);
            if (evt == null) return;
            
            var playerId = GetPlayerId();
            
            if (!playerProgress.ContainsKey(eventId))
            {
                playerProgress[eventId] = new EventProgress
                {
                    eventId = eventId,
                    playerId = playerId,
                    progressData = new Dictionary<string, object>(),
                    isCompleted = false,
                    lastUpdated = DateTime.Now
                };
            }
            
            var progress = playerProgress[eventId];
            
            // Update progress data
            foreach (var kvp in progressData)
            {
                progress.progressData[kvp.Key] = kvp.Value;
            }
            
            progress.lastUpdated = DateTime.Now;
            
            // Check if event is completed
            if (IsEventCompleted(evt, progress.progressData))
            {
                CompleteEvent(eventId);
            }
            
            // Notify listeners
            OnProgressUpdated?.Invoke(progress);
            
            // Save progress
            SaveEventsToStorage();
        }
        
        private bool IsEventCompleted(GameEvent evt, Dictionary<string, object> progressData)
        {
            if (evt.requirements == null) return false;
            
            foreach (var req in evt.requirements)
            {
                if (!progressData.ContainsKey(req.Key))
                    return false;
                
                var required = Convert.ToSingle(req.Value);
                var current = Convert.ToSingle(progressData[req.Key]);
                
                if (current < required)
                    return false;
            }
            
            return true;
        }
        
        private void CompleteEvent(string eventId)
        {
            var evt = GetEvent(eventId);
            if (evt == null) return;
            
            var progress = playerProgress[eventId];
            progress.isCompleted = true;
            
            // Grant rewards
            GrantEventRewards(evt);
            
            // Notify listeners
            OnEventCompleted?.Invoke(evt);
            
            Debug.Log($"Event completed: {evt.title}");
        }
        
        private void GrantEventRewards(GameEvent evt)
        {
            if (evt.rewards == null) return;
            
            foreach (var reward in evt.rewards)
            {
                Debug.Log($"Granted reward: {reward.Key} = {reward.Value}");
                // This would integrate with your economy system
            }
        }
        
        private string GetPlayerId()
        {
            // Get player ID from GameDataManager or generate one
            if (GameDataManager.Instance != null)
            {
                return GameDataManager.Instance.GetPlayerId();
            }
            
            return "player_" + System.Guid.NewGuid().ToString();
        }
        
        // Public API
        public List<GameEvent> GetAllEvents()
        {
            var allEvents = new List<GameEvent>();
            allEvents.AddRange(activeEvents);
            allEvents.AddRange(upcomingEvents);
            return allEvents;
        }
        
        public List<GameEvent> GetActiveEvents()
        {
            return activeEvents.FindAll(e => e.isOngoing);
        }
        
        public List<GameEvent> GetUpcomingEvents()
        {
            return upcomingEvents.FindAll(e => e.isUpcoming);
        }
        
        public List<GameEvent> GetEventsByType(EventType eventType)
        {
            return GetAllEvents().FindAll(e => e.eventType == eventType);
        }
        
        public GameEvent GetEvent(string eventId)
        {
            return eventCache.ContainsKey(eventId) ? eventCache[eventId] : null;
        }
        
        public bool IsEventActive(string eventId)
        {
            var evt = GetEvent(eventId);
            return evt != null && evt.isOngoing;
        }
        
        public int GetEventTimeRemaining(string eventId)
        {
            var evt = GetEvent(eventId);
            return evt?.timeRemainingMinutes ?? 0;
        }
        
        public EventProgress GetEventProgress(string eventId)
        {
            return playerProgress.ContainsKey(eventId) ? playerProgress[eventId] : null;
        }
        
        public bool IsEventCompleted(string eventId)
        {
            var progress = GetEventProgress(eventId);
            return progress != null && progress.isCompleted;
        }
        
        public float GetEventCompletionPercentage(string eventId)
        {
            var evt = GetEvent(eventId);
            if (evt == null) return 0f;
            
            var progress = GetEventProgress(eventId);
            if (progress == null) return 0f;
            
            if (evt.requirements == null) return 0f;
            
            float totalProgress = 0f;
            int requirementCount = 0;
            
            foreach (var req in evt.requirements)
            {
                if (progress.progressData.ContainsKey(req.Key))
                {
                    var required = Convert.ToSingle(req.Value);
                    var current = Convert.ToSingle(progress.progressData[req.Key]);
                    totalProgress += Mathf.Clamp01(current / required);
                    requirementCount++;
                }
            }
            
            return requirementCount > 0 ? totalProgress / requirementCount : 0f;
        }
        
        public void SetTimezone(string newTimezone)
        {
            timezone = newTimezone;
        }
        
        public string GetCurrentTimezone()
        {
            return timezone;
        }
        
        public Dictionary<string, object> GetEventStatistics()
        {
            var allEvents = GetAllEvents();
            
            return new Dictionary<string, object>
            {
                {"totalEvents", allEvents.Count},
                {"activeEvents", activeEvents.Count},
                {"upcomingEvents", upcomingEvents.Count},
                {"lastUpdate", lastUpdate.ToString("yyyy-MM-dd HH:mm:ss")},
                {"timezone", timezone}
            };
        }
        
        public void RefreshEvents()
        {
            UpdateEvents();
        }
        
        public void SetEventSystemEnabled(bool enabled)
        {
            enableEventSystem = enabled;
        }
        
        void OnDestroy()
        {
            // Clean up
        }
    }
}