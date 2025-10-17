using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using System.Linq;
using Evergreen.Core;

namespace Evergreen.Realtime
{
    /// <summary>
    /// Key-Free Calendar Manager
    /// Uses system time and local data for calendar events without external APIs
    /// </summary>
    public class KeyFreeCalendarManager : MonoBehaviour
    {
        [Header("Calendar Configuration")]
        [SerializeField] private bool enableCalendarSystem = true;
        [SerializeField] private bool enableRealTimeUpdates = true;
        [SerializeField] private string timezone = "UTC";
        [SerializeField] private float updateInterval = 60f; // 1 minute
        
        [Header("Event Generation")]
        [SerializeField] private bool enableDailyEvents = true;
        [SerializeField] private bool enableWeeklyEvents = true;
        [SerializeField] private bool enableMonthlyEvents = true;
        [SerializeField] private bool enableSeasonalEvents = true;
        [SerializeField] private bool enableHolidayEvents = true;
        
        [Header("Event Settings")]
        [SerializeField] private int maxActiveEvents = 10;
        [SerializeField] private float eventDuration = 24f; // hours
        [SerializeField] private bool enableRandomEvents = true;
        [SerializeField] private float randomEventChance = 0.1f; // 10% chance per update
        
        // Singleton
        public static KeyFreeCalendarManager Instance { get; private set; }
        
        // Services
        private GameAnalyticsManager analyticsManager;
        
        // Calendar data
        private List<CalendarEvent> activeEvents = new List<CalendarEvent>();
        private List<CalendarEvent> upcomingEvents = new List<CalendarEvent>();
        private Dictionary<string, CalendarEvent> eventCache = new Dictionary<string, CalendarEvent>();
        private DateTime lastUpdate;
        private DateTime lastDailyReset;
        private DateTime lastWeeklyReset;
        private DateTime lastMonthlyReset;
        
        // Events
        public System.Action<CalendarEvent> OnEventStarted;
        public System.Action<CalendarEvent> OnEventEnded;
        public System.Action<CalendarEvent> OnEventUpdated;
        public System.Action<List<CalendarEvent>> OnEventsUpdated;
        public System.Action<string> OnDailyReset;
        public System.Action<string> OnWeeklyReset;
        public System.Action<string> OnMonthlyReset;
        
        [System.Serializable]
        public class CalendarEvent
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
            public RecurrencePattern recurrencePattern;
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
        public class RecurrencePattern
        {
            public RecurrenceType type;
            public int interval;
            public List<int> daysOfWeek; // 0 = Sunday, 1 = Monday, etc.
            public List<int> daysOfMonth; // 1-31
            public int hour; // 0-23
            public int minute; // 0-59
        }
        
        public enum EventType
        {
            DailyReset,
            WeeklyReset,
            MonthlyReset,
            Seasonal,
            Holiday,
            Special,
            Random,
            Maintenance,
            Tournament,
            Challenge
        }
        
        public enum RecurrenceType
        {
            None,
            Daily,
            Weekly,
            Monthly,
            Yearly,
            Custom
        }
        
        // Holiday data (no API needed)
        private Dictionary<string, HolidayData> holidays = new Dictionary<string, HolidayData>();
        
        [System.Serializable]
        public class HolidayData
        {
            public string name;
            public int month;
            public int day;
            public bool isRecurring;
            public string description;
            public EventType eventType;
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
            if (enableCalendarSystem)
            {
                StartCoroutine(InitializeCalendarSystem());
            }
        }
        
        private void InitializeCalendarManager()
        {
            lastUpdate = DateTime.MinValue;
            lastDailyReset = DateTime.MinValue;
            lastWeeklyReset = DateTime.MinValue;
            lastMonthlyReset = DateTime.MinValue;
            
            analyticsManager = GameAnalyticsManager.Instance;
            
            // Initialize holidays
            InitializeHolidays();
        }
        
        private void InitializeHolidays()
        {
            // Add common holidays (no API needed)
            holidays["new_year"] = new HolidayData
            {
                name = "New Year's Day",
                month = 1,
                day = 1,
                isRecurring = true,
                description = "Start the new year with special rewards!",
                eventType = EventType.Holiday
            };
            
            holidays["valentines"] = new HolidayData
            {
                name = "Valentine's Day",
                month = 2,
                day = 14,
                isRecurring = true,
                description = "Share the love with special Valentine's events!",
                eventType = EventType.Holiday
            };
            
            holidays["easter"] = new HolidayData
            {
                name = "Easter",
                month = 4,
                day = 1, // Approximate, would need calculation for actual Easter
                isRecurring = true,
                description = "Easter egg hunt special event!",
                eventType = EventType.Holiday
            };
            
            holidays["halloween"] = new HolidayData
            {
                name = "Halloween",
                month = 10,
                day = 31,
                isRecurring = true,
                description = "Spooky Halloween special event!",
                eventType = EventType.Holiday
            };
            
            holidays["christmas"] = new HolidayData
            {
                name = "Christmas",
                month = 12,
                day = 25,
                isRecurring = true,
                description = "Merry Christmas special event!",
                eventType = EventType.Holiday
            };
        }
        
        private IEnumerator InitializeCalendarSystem()
        {
            Debug.Log("Initializing Key-Free Calendar System");
            
            // Load existing events from local storage
            LoadEventsFromStorage();
            
            // Generate initial events
            GenerateInitialEvents();
            
            // Start update loop
            if (enableRealTimeUpdates)
            {
                StartCoroutine(CalendarUpdateLoop());
            }
            
            Debug.Log("Key-Free Calendar System initialized successfully");
        }
        
        private void LoadEventsFromStorage()
        {
            // Load events from PlayerPrefs or local file
            string eventsJson = PlayerPrefs.GetString("calendar_events", "");
            
            if (!string.IsNullOrEmpty(eventsJson))
            {
                try
                {
                    var savedEvents = JsonUtility.FromJson<CalendarEventList>(eventsJson);
                    if (savedEvents != null && savedEvents.events != null)
                    {
                        foreach (var evt in savedEvents.events)
                        {
                            ProcessCalendarEvent(evt);
                            eventCache[evt.id] = evt;
                        }
                    }
                }
                catch (Exception e)
                {
                    Debug.LogError($"Failed to load events from storage: {e.Message}");
                }
            }
        }
        
        private void SaveEventsToStorage()
        {
            try
            {
                var allEvents = GetAllEvents();
                var eventList = new CalendarEventList { events = allEvents };
                string eventsJson = JsonUtility.ToJson(eventList);
                PlayerPrefs.SetString("calendar_events", eventsJson);
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to save events to storage: {e.Message}");
            }
        }
        
        [System.Serializable]
        public class CalendarEventList
        {
            public List<CalendarEvent> events;
        }
        
        private void GenerateInitialEvents()
        {
            var now = DateTime.Now;
            
            // Generate daily events
            if (enableDailyEvents)
            {
                GenerateDailyEvents(now);
            }
            
            // Generate weekly events
            if (enableWeeklyEvents)
            {
                GenerateWeeklyEvents(now);
            }
            
            // Generate monthly events
            if (enableMonthlyEvents)
            {
                GenerateMonthlyEvents(now);
            }
            
            // Generate seasonal events
            if (enableSeasonalEvents)
            {
                GenerateSeasonalEvents(now);
            }
            
            // Generate holiday events
            if (enableHolidayEvents)
            {
                GenerateHolidayEvents(now);
            }
        }
        
        private void GenerateDailyEvents(DateTime now)
        {
            // Daily reset event
            var dailyReset = new CalendarEvent
            {
                id = $"daily_reset_{now:yyyyMMdd}",
                title = "Daily Reset",
                description = "Daily rewards and challenges have been reset!",
                eventType = EventType.DailyReset,
                startTime = now.Date,
                endTime = now.Date.AddHours(1),
                timezone = timezone,
                priority = 1,
                isActive = true,
                isRecurring = true,
                recurrencePattern = new RecurrencePattern
                {
                    type = RecurrenceType.Daily,
                    hour = 0,
                    minute = 0
                },
                requirements = new Dictionary<string, object>(),
                rewards = new Dictionary<string, object>
                {
                    {"coins", 100},
                    {"energy", 5},
                    {"daily_bonus", 1}
                },
                metadata = new Dictionary<string, object>(),
                createdAt = now,
                updatedAt = now
            };
            
            AddEvent(dailyReset);
        }
        
        private void GenerateWeeklyEvents(DateTime now)
        {
            // Weekly reset event (Monday)
            var monday = now.Date.AddDays(-(int)now.DayOfWeek + 1);
            var weeklyReset = new CalendarEvent
            {
                id = $"weekly_reset_{monday:yyyyMMdd}",
                title = "Weekly Reset",
                description = "Weekly challenges and tournaments have been reset!",
                eventType = EventType.WeeklyReset,
                startTime = monday,
                endTime = monday.AddHours(2),
                timezone = timezone,
                priority = 2,
                isActive = true,
                isRecurring = true,
                recurrencePattern = new RecurrencePattern
                {
                    type = RecurrenceType.Weekly,
                    daysOfWeek = new List<int> { 1 }, // Monday
                    hour = 0,
                    minute = 0
                },
                requirements = new Dictionary<string, object>(),
                rewards = new Dictionary<string, object>
                {
                    {"coins", 500},
                    {"gems", 50},
                    {"weekly_bonus", 1}
                },
                metadata = new Dictionary<string, object>(),
                createdAt = now,
                updatedAt = now
            };
            
            AddEvent(weeklyReset);
        }
        
        private void GenerateMonthlyEvents(DateTime now)
        {
            // Monthly reset event (1st of month)
            var firstOfMonth = new DateTime(now.Year, now.Month, 1);
            var monthlyReset = new CalendarEvent
            {
                id = $"monthly_reset_{firstOfMonth:yyyyMM}",
                title = "Monthly Reset",
                description = "Monthly rewards and seasonal content have been reset!",
                eventType = EventType.MonthlyReset,
                startTime = firstOfMonth,
                endTime = firstOfMonth.AddHours(4),
                timezone = timezone,
                priority = 2,
                isActive = true,
                isRecurring = true,
                recurrencePattern = new RecurrencePattern
                {
                    type = RecurrenceType.Monthly,
                    daysOfMonth = new List<int> { 1 },
                    hour = 0,
                    minute = 0
                },
                requirements = new Dictionary<string, object>(),
                rewards = new Dictionary<string, object>
                {
                    {"coins", 2000},
                    {"gems", 200},
                    {"monthly_bonus", 1}
                },
                metadata = new Dictionary<string, object>(),
                createdAt = now,
                updatedAt = now
            };
            
            AddEvent(monthlyReset);
        }
        
        private void GenerateSeasonalEvents(DateTime now)
        {
            string season = GetCurrentSeason(now);
            var seasonalEvent = new CalendarEvent
            {
                id = $"seasonal_{season}_{now:yyyy}",
                title = $"{season} Festival",
                description = $"Celebrate the {season.ToLower()} season with special rewards!",
                eventType = EventType.Seasonal,
                startTime = GetSeasonStart(now),
                endTime = GetSeasonEnd(now),
                timezone = timezone,
                priority = 3,
                isActive = true,
                isRecurring = true,
                recurrencePattern = new RecurrencePattern
                {
                    type = RecurrenceType.Yearly
                },
                requirements = new Dictionary<string, object>(),
                rewards = new Dictionary<string, object>
                {
                    {"coins", 1000},
                    {"gems", 100},
                    {"seasonal_items", 5}
                },
                metadata = new Dictionary<string, object>
                {
                    {"season", season}
                },
                createdAt = now,
                updatedAt = now
            };
            
            AddEvent(seasonalEvent);
        }
        
        private string GetCurrentSeason(DateTime date)
        {
            int month = date.Month;
            if (month >= 3 && month <= 5) return "Spring";
            if (month >= 6 && month <= 8) return "Summer";
            if (month >= 9 && month <= 11) return "Autumn";
            return "Winter";
        }
        
        private DateTime GetSeasonStart(DateTime date)
        {
            int month = date.Month;
            if (month >= 3 && month <= 5) return new DateTime(date.Year, 3, 1);
            if (month >= 6 && month <= 8) return new DateTime(date.Year, 6, 1);
            if (month >= 9 && month <= 11) return new DateTime(date.Year, 9, 1);
            return new DateTime(date.Year, 12, 1);
        }
        
        private DateTime GetSeasonEnd(DateTime date)
        {
            int month = date.Month;
            if (month >= 3 && month <= 5) return new DateTime(date.Year, 5, 31);
            if (month >= 6 && month <= 8) return new DateTime(date.Year, 8, 31);
            if (month >= 9 && month <= 11) return new DateTime(date.Year, 11, 30);
            return new DateTime(date.Year, 2, 28);
        }
        
        private void GenerateHolidayEvents(DateTime now)
        {
            foreach (var holiday in holidays.Values)
            {
                if (holiday.isRecurring)
                {
                    var holidayDate = new DateTime(now.Year, holiday.month, holiday.day);
                    
                    // Check if holiday is in the current month or next month
                    if (holidayDate >= now.Date && holidayDate <= now.Date.AddMonths(1))
                    {
                        var holidayEvent = new CalendarEvent
                        {
                            id = $"holiday_{holiday.name.ToLower()}_{now.Year}",
                            title = holiday.name,
                            description = holiday.description,
                            eventType = holiday.eventType,
                            startTime = holidayDate,
                            endTime = holidayDate.AddDays(1),
                            timezone = timezone,
                            priority = 4,
                            isActive = true,
                            isRecurring = true,
                            recurrencePattern = new RecurrencePattern
                            {
                                type = RecurrenceType.Yearly
                            },
                            requirements = new Dictionary<string, object>(),
                            rewards = new Dictionary<string, object>
                            {
                                {"coins", 500},
                                {"gems", 50},
                                {"holiday_items", 3}
                            },
                            metadata = new Dictionary<string, object>
                            {
                                {"holiday_type", holiday.name}
                            },
                            createdAt = now,
                            updatedAt = now
                        };
                        
                        AddEvent(holidayEvent);
                    }
                }
            }
        }
        
        private void AddEvent(CalendarEvent evt)
        {
            ProcessCalendarEvent(evt);
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
        
        private IEnumerator CalendarUpdateLoop()
        {
            while (enableRealTimeUpdates)
            {
                yield return new WaitForSeconds(updateInterval);
                UpdateCalendarEvents();
            }
        }
        
        private void UpdateCalendarEvents()
        {
            var now = DateTime.Now;
            
            // Check for daily reset
            if (enableDailyEvents && ShouldTriggerDailyReset(now))
            {
                TriggerDailyReset(now);
            }
            
            // Check for weekly reset
            if (enableWeeklyEvents && ShouldTriggerWeeklyReset(now))
            {
                TriggerWeeklyReset(now);
            }
            
            // Check for monthly reset
            if (enableMonthlyEvents && ShouldTriggerMonthlyReset(now))
            {
                TriggerMonthlyReset(now);
            }
            
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
        
        private bool ShouldTriggerDailyReset(DateTime now)
        {
            return now.Date > lastDailyReset.Date;
        }
        
        private bool ShouldTriggerWeeklyReset(DateTime now)
        {
            return now.Date > lastWeeklyReset.Date && now.DayOfWeek == DayOfWeek.Monday;
        }
        
        private bool ShouldTriggerMonthlyReset(DateTime now)
        {
            return now.Date > lastMonthlyReset.Date && now.Day == 1;
        }
        
        private void TriggerDailyReset(DateTime now)
        {
            lastDailyReset = now;
            OnDailyReset?.Invoke(now.ToString("yyyy-MM-dd"));
            Debug.Log("Daily reset triggered");
        }
        
        private void TriggerWeeklyReset(DateTime now)
        {
            lastWeeklyReset = now;
            OnWeeklyReset?.Invoke(now.ToString("yyyy-MM-dd"));
            Debug.Log("Weekly reset triggered");
        }
        
        private void TriggerMonthlyReset(DateTime now)
        {
            lastMonthlyReset = now;
            OnMonthlyReset?.Invoke(now.ToString("yyyy-MM"));
            Debug.Log("Monthly reset triggered");
        }
        
        private void GenerateRandomEvent(DateTime now)
        {
            var randomEvents = new[]
            {
                "Double Coins Hour",
                "Energy Boost",
                "Lucky Day",
                "Special Challenge",
                "Bonus Rewards"
            };
            
            var randomEvent = randomEvents[UnityEngine.Random.Range(0, randomEvents.Length)];
            var duration = UnityEngine.Random.Range(1f, 4f); // 1-4 hours
            
            var evt = new CalendarEvent
            {
                id = $"random_{now.Ticks}",
                title = randomEvent,
                description = $"Special random event: {randomEvent}!",
                eventType = EventType.Random,
                startTime = now,
                endTime = now.AddHours(duration),
                timezone = timezone,
                priority = 5,
                isActive = true,
                isRecurring = false,
                requirements = new Dictionary<string, object>(),
                rewards = new Dictionary<string, object>
                {
                    {"coins", UnityEngine.Random.Range(100, 500)},
                    {"gems", UnityEngine.Random.Range(10, 50)}
                },
                metadata = new Dictionary<string, object>(),
                createdAt = now,
                updatedAt = now
            };
            
            AddEvent(evt);
            Debug.Log($"Random event generated: {randomEvent}");
        }
        
        private void UpdateEventStatuses()
        {
            var now = DateTime.Now;
            var eventsToRemove = new List<CalendarEvent>();
            
            foreach (var evt in activeEvents.ToList())
            {
                ProcessCalendarEvent(evt);
                
                if (evt.isExpired)
                {
                    eventsToRemove.Add(evt);
                    OnEventEnded?.Invoke(evt);
                }
            }
            
            foreach (var evt in upcomingEvents.ToList())
            {
                ProcessCalendarEvent(evt);
                
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
        
        private void ProcessCalendarEvent(CalendarEvent evt)
        {
            var now = DateTime.Now;
            
            evt.isOngoing = now >= evt.startTime && now <= evt.endTime;
            evt.isUpcoming = now < evt.startTime;
            evt.isExpired = now > evt.endTime;
            evt.durationMinutes = (int)(evt.endTime - evt.startTime).TotalMinutes;
            evt.timeRemainingMinutes = evt.isOngoing ? (int)(evt.endTime - now).TotalMinutes : 0;
        }
        
        // Public API
        public List<CalendarEvent> GetAllEvents()
        {
            var allEvents = new List<CalendarEvent>();
            allEvents.AddRange(activeEvents);
            allEvents.AddRange(upcomingEvents);
            return allEvents;
        }
        
        public List<CalendarEvent> GetActiveEvents()
        {
            return activeEvents.FindAll(e => e.isOngoing);
        }
        
        public List<CalendarEvent> GetUpcomingEvents()
        {
            return upcomingEvents.FindAll(e => e.isUpcoming);
        }
        
        public List<CalendarEvent> GetEventsByType(EventType eventType)
        {
            return GetAllEvents().FindAll(e => e.eventType == eventType);
        }
        
        public CalendarEvent GetEvent(string eventId)
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
        
        public void SetTimezone(string newTimezone)
        {
            timezone = newTimezone;
        }
        
        public string GetCurrentTimezone()
        {
            return timezone;
        }
        
        public Dictionary<string, object> GetCalendarStatistics()
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
        
        public void RefreshCalendar()
        {
            UpdateCalendarEvents();
        }
        
        public void SetCalendarEnabled(bool enabled)
        {
            enableCalendarSystem = enabled;
        }
        
        void OnDestroy()
        {
            // Clean up
        }
    }
}