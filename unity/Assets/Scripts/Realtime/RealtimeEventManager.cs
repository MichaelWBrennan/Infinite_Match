using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using System.Text;
using Newtonsoft.Json;
using Evergreen.Core;
using Evergreen.Integration;

namespace Evergreen.Realtime
{
    /// <summary>
    /// Real-Time Event Manager for Unity
    /// Handles game events, progress tracking, and real-time updates
    /// </summary>
    public class RealtimeEventManager : MonoBehaviour
    {
        [Header("Event Configuration")]
        [SerializeField] private bool enableEventSystem = true;
        [SerializeField] private bool enableRealTimeUpdates = true;
        [SerializeField] private string defaultTimezone = "UTC";
        [SerializeField] private float updateInterval = 30f;
        
        [Header("API Configuration")]
        [SerializeField] private string backendUrl = "http://localhost:3000";
        [SerializeField] private string apiKey = "your_api_key_here";
        
        [Header("Event Types")]
        [SerializeField] private bool enableDailyChallenges = true;
        [SerializeField] private bool enableWeeklyTournaments = true;
        [SerializeField] private bool enableWeatherEvents = true;
        [SerializeField] private bool enableSpecialOffers = true;
        [SerializeField] private bool enableSeasonalEvents = true;
        [SerializeField] private bool enableLiveEvents = true;
        
        // Singleton
        public static RealtimeEventManager Instance { get; private set; }
        
        // Services
        private BackendConnector backendConnector;
        private GameAnalyticsManager analyticsManager;
        private GameDataManager dataManager;
        
        // Event data
        private List<GameEvent> activeEvents = new List<GameEvent>();
        private List<GameEvent> upcomingEvents = new List<GameEvent>();
        private Dictionary<string, GameEvent> eventCache = new Dictionary<string, GameEvent>();
        private Dictionary<string, EventProgress> playerProgress = new Dictionary<string, EventProgress>();
        
        // Player data
        private string playerId;
        private string currentTimezone;
        private DateTime lastUpdate;
        
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
            public string eventType;
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
        
        [System.Serializable]
        public class EventResponse
        {
            public bool success;
            public List<GameEvent> data;
            public string error;
        }
        
        [System.Serializable]
        public class ProgressResponse
        {
            public bool success;
            public EventProgress data;
            public string error;
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
            StartCoroutine(InitializeEventSystem());
        }
        
        private void InitializeEventManager()
        {
            currentTimezone = defaultTimezone;
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
        
        private IEnumerator InitializeEventSystem()
        {
            if (!enableEventSystem)
            {
                Debug.Log("Event system is disabled");
                yield break;
            }
            
            // Get references to other systems
            backendConnector = BackendConnector.Instance;
            analyticsManager = GameAnalyticsManager.Instance;
            dataManager = GameDataManager.Instance;
            
            if (backendConnector == null)
            {
                Debug.LogError("BackendConnector not found! Event system requires backend connection.");
                yield break;
            }
            
            // Load initial event data
            yield return StartCoroutine(LoadGameEvents());
            
            // Start real-time updates
            if (enableRealTimeUpdates)
            {
                StartCoroutine(EventUpdateLoop());
            }
            
            Debug.Log("Event system initialized successfully");
        }
        
        private IEnumerator EventUpdateLoop()
        {
            while (enableRealTimeUpdates)
            {
                yield return new WaitForSeconds(updateInterval);
                yield return StartCoroutine(UpdateGameEvents());
            }
        }
        
        /// <summary>
        /// Load game events from backend
        /// </summary>
        public IEnumerator LoadGameEvents()
        {
            if (backendConnector == null) yield break;
            
            // Load active events
            yield return StartCoroutine(LoadActiveEvents());
            
            // Load upcoming events
            yield return StartCoroutine(LoadUpcomingEvents());
            
            // Process events
            ProcessGameEvents();
            
            lastUpdate = DateTime.Now;
        }
        
        private IEnumerator LoadActiveEvents()
        {
            string url = $"{backendUrl}/api/realtime/events/active?timezone={currentTimezone}";
            
            yield return StartCoroutine(backendConnector.MakeAPIRequest("GET", url, null, (response) =>
            {
                if (response.success)
                {
                    activeEvents = response.data ?? new List<GameEvent>();
                    Debug.Log($"Loaded {activeEvents.Count} active events");
                }
                else
                {
                    Debug.LogError($"Failed to load active events: {response.error}");
                }
            }));
        }
        
        private IEnumerator LoadUpcomingEvents()
        {
            string url = $"{backendUrl}/api/realtime/events/upcoming?timezone={currentTimezone}&hours=24";
            
            yield return StartCoroutine(backendConnector.MakeAPIRequest("GET", url, null, (response) =>
            {
                if (response.success)
                {
                    upcomingEvents = response.data ?? new List<GameEvent>();
                    Debug.Log($"Loaded {upcomingEvents.Count} upcoming events");
                }
                else
                {
                    Debug.LogError($"Failed to load upcoming events: {response.error}");
                }
            }));
        }
        
        private IEnumerator UpdateGameEvents()
        {
            yield return StartCoroutine(LoadGameEvents());
            
            // Check for event changes
            CheckForEventChanges();
            
            // Notify listeners
            OnEventsUpdated?.Invoke(GetAllEvents());
        }
        
        private void ProcessGameEvents()
        {
            var allEvents = new List<GameEvent>();
            allEvents.AddRange(activeEvents);
            allEvents.AddRange(upcomingEvents);
            
            foreach (var evt in allEvents)
            {
                ProcessGameEvent(evt);
                eventCache[evt.id] = evt;
            }
        }
        
        private void ProcessGameEvent(GameEvent evt)
        {
            var now = DateTime.Now;
            
            // Calculate computed properties
            evt.isOngoing = now >= evt.startTime && now <= evt.endTime;
            evt.isUpcoming = now < evt.startTime;
            evt.isExpired = now > evt.endTime;
            evt.durationMinutes = (int)(evt.endTime - evt.startTime).TotalMinutes;
            evt.timeRemainingMinutes = evt.isOngoing ? (int)(evt.endTime - now).TotalMinutes : 0;
        }
        
        private void CheckForEventChanges()
        {
            var allEvents = GetAllEvents();
            
            foreach (var evt in allEvents)
            {
                if (eventCache.ContainsKey(evt.id))
                {
                    var cachedEvent = eventCache[evt.id];
                    
                    // Check if event status changed
                    if (cachedEvent.isOngoing != evt.isOngoing)
                    {
                        if (evt.isOngoing)
                        {
                            OnEventStarted?.Invoke(evt);
                            Debug.Log($"Game event started: {evt.title}");
                        }
                        else if (cachedEvent.isOngoing && !evt.isOngoing)
                        {
                            OnEventEnded?.Invoke(evt);
                            Debug.Log($"Game event ended: {evt.title}");
                        }
                    }
                    
                    // Check for other changes
                    if (cachedEvent.title != evt.title || 
                        cachedEvent.description != evt.description ||
                        cachedEvent.startTime != evt.startTime ||
                        cachedEvent.endTime != evt.endTime)
                    {
                        OnEventUpdated?.Invoke(evt);
                        Debug.Log($"Game event updated: {evt.title}");
                    }
                }
                else
                {
                    // New event
                    OnEventStarted?.Invoke(evt);
                    Debug.Log($"New game event: {evt.title}");
                }
            }
        }
        
        /// <summary>
        /// Update event progress
        /// </summary>
        public IEnumerator UpdateEventProgress(string eventId, Dictionary<string, object> progressData)
        {
            if (backendConnector == null) yield break;
            
            string url = $"{backendUrl}/api/realtime/events/{eventId}/progress";
            var requestData = new Dictionary<string, object>
            {
                {"playerId", playerId},
                {"progressData", progressData}
            };
            
            yield return StartCoroutine(backendConnector.MakeAPIRequest("POST", url, requestData, (response) =>
            {
                if (response.success)
                {
                    var progress = response.data;
                    playerProgress[eventId] = progress;
                    OnProgressUpdated?.Invoke(progress);
                    Debug.Log($"Event progress updated for {eventId}");
                }
                else
                {
                    Debug.LogError($"Failed to update event progress: {response.error}");
                }
            }));
        }
        
        /// <summary>
        /// Complete an event
        /// </summary>
        public IEnumerator CompleteEvent(string eventId)
        {
            if (backendConnector == null) yield break;
            
            string url = $"{backendUrl}/api/realtime/events/{eventId}/complete";
            var requestData = new Dictionary<string, object>
            {
                {"playerId", playerId}
            };
            
            yield return StartCoroutine(backendConnector.MakeAPIRequest("POST", url, requestData, (response) =>
            {
                if (response.success)
                {
                    var evt = GetAllEvents().Find(e => e.id == eventId);
                    if (evt != null)
                    {
                        OnEventCompleted?.Invoke(evt);
                        Debug.Log($"Event completed: {evt.title}");
                    }
                }
                else
                {
                    Debug.LogError($"Failed to complete event: {response.error}");
                }
            }));
        }
        
        /// <summary>
        /// Get all game events
        /// </summary>
        public List<GameEvent> GetAllEvents()
        {
            var allEvents = new List<GameEvent>();
            allEvents.AddRange(activeEvents);
            allEvents.AddRange(upcomingEvents);
            return allEvents;
        }
        
        /// <summary>
        /// Get active ongoing events
        /// </summary>
        public List<GameEvent> GetActiveEvents()
        {
            return activeEvents.FindAll(e => e.isOngoing);
        }
        
        /// <summary>
        /// Get upcoming events
        /// </summary>
        public List<GameEvent> GetUpcomingEvents()
        {
            return upcomingEvents.FindAll(e => e.isUpcoming);
        }
        
        /// <summary>
        /// Get events by type
        /// </summary>
        public List<GameEvent> GetEventsByType(string eventType)
        {
            return GetAllEvents().FindAll(e => e.eventType == eventType);
        }
        
        /// <summary>
        /// Get events by priority
        /// </summary>
        public List<GameEvent> GetEventsByPriority(int priority)
        {
            return GetAllEvents().FindAll(e => e.priority == priority);
        }
        
        /// <summary>
        /// Check if an event is active
        /// </summary>
        public bool IsEventActive(string eventId)
        {
            var evt = GetAllEvents().Find(e => e.id == eventId);
            return evt != null && evt.isOngoing;
        }
        
        /// <summary>
        /// Get time remaining for an event
        /// </summary>
        public int GetEventTimeRemaining(string eventId)
        {
            var evt = GetAllEvents().Find(e => e.id == eventId);
            return evt?.timeRemainingMinutes ?? 0;
        }
        
        /// <summary>
        /// Get event progress
        /// </summary>
        public EventProgress GetEventProgress(string eventId)
        {
            return playerProgress.ContainsKey(eventId) ? playerProgress[eventId] : null;
        }
        
        /// <summary>
        /// Check if event is completed
        /// </summary>
        public bool IsEventCompleted(string eventId)
        {
            var progress = GetEventProgress(eventId);
            return progress != null && progress.isCompleted;
        }
        
        /// <summary>
        /// Get event completion percentage
        /// </summary>
        public float GetEventCompletionPercentage(string eventId)
        {
            var evt = GetAllEvents().Find(e => e.id == eventId);
            if (evt == null) return 0f;
            
            var progress = GetEventProgress(eventId);
            if (progress == null) return 0f;
            
            var requirements = evt.requirements ?? new Dictionary<string, object>();
            if (requirements.Count == 0) return 0f;
            
            float totalProgress = 0f;
            int requirementCount = 0;
            
            foreach (var req in requirements)
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
        
        /// <summary>
        /// Set timezone
        /// </summary>
        public void SetTimezone(string timezone)
        {
            if (currentTimezone != timezone)
            {
                currentTimezone = timezone;
                StartCoroutine(LoadGameEvents());
                Debug.Log($"Event timezone changed to: {timezone}");
            }
        }
        
        /// <summary>
        /// Get current timezone
        /// </summary>
        public string GetCurrentTimezone()
        {
            return currentTimezone;
        }
        
        /// <summary>
        /// Get event statistics
        /// </summary>
        public Dictionary<string, object> GetEventStatistics()
        {
            var allEvents = GetAllEvents();
            
            var stats = new Dictionary<string, object>
            {
                {"totalEvents", allEvents.Count},
                {"activeEvents", activeEvents.Count},
                {"upcomingEvents", upcomingEvents.Count},
                {"eventTypes", new Dictionary<string, int>()},
                {"lastUpdate", lastUpdate.ToString("yyyy-MM-dd HH:mm:ss")},
                {"timezone", currentTimezone},
                {"playerId", playerId}
            };
            
            // Count events by type
            var eventTypes = new Dictionary<string, int>();
            foreach (var evt in allEvents)
            {
                if (eventTypes.ContainsKey(evt.eventType))
                    eventTypes[evt.eventType]++;
                else
                    eventTypes[evt.eventType] = 1;
            }
            
            stats["eventTypes"] = eventTypes;
            
            return stats;
        }
        
        /// <summary>
        /// Force refresh event data
        /// </summary>
        public void RefreshEvents()
        {
            StartCoroutine(LoadGameEvents());
        }
        
        /// <summary>
        /// Enable/disable event system
        /// </summary>
        public void SetEventSystemEnabled(bool enabled)
        {
            enableEventSystem = enabled;
            if (enabled)
            {
                StartCoroutine(InitializeEventSystem());
            }
        }
        
        /// <summary>
        /// Enable/disable real-time updates
        /// </summary>
        public void SetRealTimeUpdatesEnabled(bool enabled)
        {
            enableRealTimeUpdates = enabled;
            if (enabled && enableEventSystem)
            {
                StartCoroutine(EventUpdateLoop());
            }
        }
        
        void OnDestroy()
        {
            // Clean up
        }
    }
}