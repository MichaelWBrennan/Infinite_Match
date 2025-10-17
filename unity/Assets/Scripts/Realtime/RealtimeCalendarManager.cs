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
    /// Real-Time Calendar Manager for Unity
    /// Handles calendar events, timezone management, and real-time updates
    /// </summary>
    public class RealtimeCalendarManager : MonoBehaviour
    {
        [Header("Calendar Configuration")]
        [SerializeField] private bool enableCalendarSystem = true;
        [SerializeField] private bool enableRealTimeUpdates = true;
        [SerializeField] private string defaultTimezone = "UTC";
        [SerializeField] private float updateInterval = 30f;
        
        [Header("API Configuration")]
        [SerializeField] private string backendUrl = "http://localhost:3000";
        [SerializeField] private string apiKey = "your_api_key_here";
        
        [Header("Event Types")]
        [SerializeField] private bool enableGameEvents = true;
        [SerializeField] private bool enableWeatherEvents = true;
        [SerializeField] private bool enableMaintenanceEvents = true;
        [SerializeField] private bool enableSpecialOffers = true;
        [SerializeField] private bool enableTournaments = true;
        [SerializeField] private bool enableSeasonalEvents = true;
        
        // Singleton
        public static RealtimeCalendarManager Instance { get; private set; }
        
        // Services
        private BackendConnector backendConnector;
        private GameAnalyticsManager analyticsManager;
        
        // Calendar data
        private List<CalendarEvent> currentEvents = new List<CalendarEvent>();
        private List<CalendarEvent> upcomingEvents = new List<CalendarEvent>();
        private Dictionary<string, CalendarEvent> eventCache = new Dictionary<string, CalendarEvent>();
        
        // Timezone management
        private string currentTimezone;
        private DateTime lastUpdate;
        
        // Events
        public System.Action<CalendarEvent> OnEventStarted;
        public System.Action<CalendarEvent> OnEventEnded;
        public System.Action<CalendarEvent> OnEventUpdated;
        public System.Action<List<CalendarEvent>> OnEventsUpdated;
        
        [System.Serializable]
        public class CalendarEvent
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
        public class CalendarResponse
        {
            public bool success;
            public List<CalendarEvent> data;
            public string error;
        }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeCalendarManager();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            StartCoroutine(InitializeCalendarSystem());
        }
        
        private void InitializeCalendarManager()
        {
            currentTimezone = defaultTimezone;
            lastUpdate = DateTime.MinValue;
        }
        
        private IEnumerator InitializeCalendarSystem()
        {
            if (!enableCalendarSystem)
            {
                Debug.Log("Calendar system is disabled");
                yield break;
            }
            
            // Get references to other systems
            backendConnector = BackendConnector.Instance;
            analyticsManager = GameAnalyticsManager.Instance;
            
            if (backendConnector == null)
            {
                Debug.LogError("BackendConnector not found! Calendar system requires backend connection.");
                yield break;
            }
            
            // Load initial calendar data
            yield return StartCoroutine(LoadCalendarEvents());
            
            // Start real-time updates
            if (enableRealTimeUpdates)
            {
                StartCoroutine(CalendarUpdateLoop());
            }
            
            Debug.Log("Calendar system initialized successfully");
        }
        
        private IEnumerator CalendarUpdateLoop()
        {
            while (enableRealTimeUpdates)
            {
                yield return new WaitForSeconds(updateInterval);
                yield return StartCoroutine(UpdateCalendarEvents());
            }
        }
        
        /// <summary>
        /// Load calendar events from backend
        /// </summary>
        public IEnumerator LoadCalendarEvents()
        {
            if (backendConnector == null) yield break;
            
            // Load current events
            yield return StartCoroutine(LoadCurrentEvents());
            
            // Load upcoming events
            yield return StartCoroutine(LoadUpcomingEvents());
            
            // Process events
            ProcessCalendarEvents();
            
            lastUpdate = DateTime.Now;
        }
        
        private IEnumerator LoadCurrentEvents()
        {
            string url = $"{backendUrl}/api/realtime/calendar/current?timezone={currentTimezone}";
            
            yield return StartCoroutine(backendConnector.MakeAPIRequest("GET", url, null, (response) =>
            {
                if (response.success)
                {
                    currentEvents = response.data ?? new List<CalendarEvent>();
                    Debug.Log($"Loaded {currentEvents.Count} current calendar events");
                }
                else
                {
                    Debug.LogError($"Failed to load current events: {response.error}");
                }
            }));
        }
        
        private IEnumerator LoadUpcomingEvents()
        {
            string url = $"{backendUrl}/api/realtime/calendar/upcoming?timezone={currentTimezone}&hours=24";
            
            yield return StartCoroutine(backendConnector.MakeAPIRequest("GET", url, null, (response) =>
            {
                if (response.success)
                {
                    upcomingEvents = response.data ?? new List<CalendarEvent>();
                    Debug.Log($"Loaded {upcomingEvents.Count} upcoming calendar events");
                }
                else
                {
                    Debug.LogError($"Failed to load upcoming events: {response.error}");
                }
            }));
        }
        
        private IEnumerator UpdateCalendarEvents()
        {
            yield return StartCoroutine(LoadCalendarEvents());
            
            // Check for event changes
            CheckForEventChanges();
            
            // Notify listeners
            OnEventsUpdated?.Invoke(GetAllEvents());
        }
        
        private void ProcessCalendarEvents()
        {
            var allEvents = new List<CalendarEvent>();
            allEvents.AddRange(currentEvents);
            allEvents.AddRange(upcomingEvents);
            
            foreach (var evt in allEvents)
            {
                ProcessCalendarEvent(evt);
                eventCache[evt.id] = evt;
            }
        }
        
        private void ProcessCalendarEvent(CalendarEvent evt)
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
                            Debug.Log($"Calendar event started: {evt.title}");
                        }
                        else if (cachedEvent.isOngoing && !evt.isOngoing)
                        {
                            OnEventEnded?.Invoke(evt);
                            Debug.Log($"Calendar event ended: {evt.title}");
                        }
                    }
                    
                    // Check for other changes
                    if (cachedEvent.title != evt.title || 
                        cachedEvent.description != evt.description ||
                        cachedEvent.startTime != evt.startTime ||
                        cachedEvent.endTime != evt.endTime)
                    {
                        OnEventUpdated?.Invoke(evt);
                        Debug.Log($"Calendar event updated: {evt.title}");
                    }
                }
                else
                {
                    // New event
                    OnEventStarted?.Invoke(evt);
                    Debug.Log($"New calendar event: {evt.title}");
                }
            }
        }
        
        /// <summary>
        /// Get all calendar events
        /// </summary>
        public List<CalendarEvent> GetAllEvents()
        {
            var allEvents = new List<CalendarEvent>();
            allEvents.AddRange(currentEvents);
            allEvents.AddRange(upcomingEvents);
            return allEvents;
        }
        
        /// <summary>
        /// Get current ongoing events
        /// </summary>
        public List<CalendarEvent> GetCurrentEvents()
        {
            return currentEvents.FindAll(e => e.isOngoing);
        }
        
        /// <summary>
        /// Get upcoming events
        /// </summary>
        public List<CalendarEvent> GetUpcomingEvents()
        {
            return upcomingEvents.FindAll(e => e.isUpcoming);
        }
        
        /// <summary>
        /// Get events by type
        /// </summary>
        public List<CalendarEvent> GetEventsByType(string eventType)
        {
            return GetAllEvents().FindAll(e => e.eventType == eventType);
        }
        
        /// <summary>
        /// Get events by priority
        /// </summary>
        public List<CalendarEvent> GetEventsByPriority(int priority)
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
        /// Set timezone
        /// </summary>
        public void SetTimezone(string timezone)
        {
            if (currentTimezone != timezone)
            {
                currentTimezone = timezone;
                StartCoroutine(LoadCalendarEvents());
                Debug.Log($"Calendar timezone changed to: {timezone}");
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
        /// Get calendar statistics
        /// </summary>
        public Dictionary<string, object> GetCalendarStatistics()
        {
            var allEvents = GetAllEvents();
            
            var stats = new Dictionary<string, object>
            {
                {"totalEvents", allEvents.Count},
                {"currentEvents", currentEvents.Count},
                {"upcomingEvents", upcomingEvents.Count},
                {"eventTypes", new Dictionary<string, int>()},
                {"lastUpdate", lastUpdate.ToString("yyyy-MM-dd HH:mm:ss")},
                {"timezone", currentTimezone}
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
        /// Force refresh calendar data
        /// </summary>
        public void RefreshCalendar()
        {
            StartCoroutine(LoadCalendarEvents());
        }
        
        /// <summary>
        /// Enable/disable calendar system
        /// </summary>
        public void SetCalendarEnabled(bool enabled)
        {
            enableCalendarSystem = enabled;
            if (enabled)
            {
                StartCoroutine(InitializeCalendarSystem());
            }
        }
        
        /// <summary>
        /// Enable/disable real-time updates
        /// </summary>
        public void SetRealTimeUpdatesEnabled(bool enabled)
        {
            enableRealTimeUpdates = enabled;
            if (enabled && enableCalendarSystem)
            {
                StartCoroutine(CalendarUpdateLoop());
            }
        }
        
        void OnDestroy()
        {
            // Clean up
        }
    }
}