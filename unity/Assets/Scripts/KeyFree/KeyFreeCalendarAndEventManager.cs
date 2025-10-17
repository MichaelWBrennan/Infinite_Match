using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using System.Linq;
using Evergreen.Core;

namespace Evergreen.KeyFree
{
    /// <summary>
    /// Consolidated Calendar and Event Manager - No API keys required
    /// Combines calendar events and game events functionality
    /// </summary>
    public class KeyFreeCalendarAndEventManager : MonoBehaviour
    {
        [Header("Calendar Configuration")]
        [SerializeField] private bool enableCalendarSystem = true;
        [SerializeField] private bool enableHolidayEvents = true;
        [SerializeField] private bool enableSeasonalEvents = true;
        [SerializeField] private bool enableRandomEvents = true;
        [SerializeField] private float randomEventChance = 0.1f;
        
        [Header("Event Configuration")]
        [SerializeField] private bool enableEventSystem = true;
        [SerializeField] private bool enableWeatherEvents = true;
        [SerializeField] private bool enableDailyChallenges = true;
        [SerializeField] private bool enableWeeklyTournaments = true;
        [SerializeField] private bool enableSpecialOffers = true;
        [SerializeField] private float specialOfferChance = 0.05f;
        
        [Header("Timezone Settings")]
        [SerializeField] private string defaultTimezone = "America/New_York";
        
        // Calendar Data Structures
        [System.Serializable]
        public class CalendarEvent
        {
            public string id;
            public string title;
            public string description;
            public DateTime startTime;
            public DateTime endTime;
            public EventType eventType;
            public RecurrencePattern recurrence;
            public Dictionary<string, object> metadata;
            public bool isOngoing;
            public bool isUpcoming;
            public bool isExpired;
            public TimeSpan timeRemaining;
        }
        
        [System.Serializable]
        public class RecurrencePattern
        {
            public RecurrenceType type;
            public int interval;
            public List<int> daysOfWeek;
            public int dayOfMonth;
            public DateTime? endDate;
        }
        
        public enum EventType
        {
            Daily, Weekly, Monthly, Seasonal, Holiday, Random, Weather, Special
        }
        
        public enum RecurrenceType
        {
            None, Daily, Weekly, Monthly, Yearly
        }
        
        // Game Event Data Structures
        [System.Serializable]
        public class GameEvent
        {
            public string id;
            public string title;
            public string description;
            public EventType eventType;
            public DateTime startTime;
            public DateTime endTime;
            public Dictionary<string, object> requirements;
            public Dictionary<string, object> rewards;
            public Dictionary<string, object> progress;
            public bool isOngoing;
            public bool isUpcoming;
            public bool isExpired;
            public TimeSpan timeRemaining;
            public bool isCompleted;
        }
        
        [System.Serializable]
        public class EventProgress
        {
            public string eventId;
            public string playerId;
            public Dictionary<string, object> progressData;
            public DateTime lastUpdated;
            public bool isCompleted;
        }
        
        [System.Serializable]
        public class EventTemplate
        {
            public string id;
            public string title;
            public string description;
            public EventType eventType;
            public Dictionary<string, object> requirements;
            public Dictionary<string, object> rewards;
            public float chance;
            public int durationHours;
        }
        
        // Holiday Data
        [System.Serializable]
        public class HolidayData
        {
            public string name;
            public int month;
            public int day;
            public bool isRecurring;
            public string description;
        }
        
        // Storage Structures
        [System.Serializable]
        public class CalendarEventList
        {
            public List<CalendarEvent> events;
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
        
        // Events
        public static event Action<List<CalendarEvent>> OnCalendarEventsUpdated;
        public static event Action<List<GameEvent>> OnGameEventsUpdated;
        public static event Action<GameEvent> OnEventCompleted;
        public static event Action<string> OnEventProgressUpdated;
        
        // Singleton
        public static KeyFreeCalendarAndEventManager Instance { get; private set; }
        
        // Private fields
        private List<CalendarEvent> calendarEvents;
        private List<GameEvent> gameEvents;
        private List<EventProgress> eventProgress;
        private List<EventTemplate> eventTemplates;
        private List<HolidayData> holidays;
        private Dictionary<string, object> calendarStats;
        private Dictionary<string, object> eventStats;
        private string currentTimezone;
        private bool isInitialized = false;
        private Coroutine updateCoroutine;
        
        // Weather system reference
        private Evergreen.KeyFree.KeyFreeWeatherAndSocialManager weatherSystem;
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeCalendarAndEventManager();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            StartCoroutine(InitializeCalendarAndEventSystem());
        }
        
        private void InitializeCalendarAndEventManager()
        {
            calendarEvents = new List<CalendarEvent>();
            gameEvents = new List<GameEvent>();
            eventProgress = new List<EventProgress>();
            eventTemplates = new List<EventTemplate>();
            holidays = new List<HolidayData>();
            currentTimezone = defaultTimezone;
            
            // Initialize statistics
            calendarStats = new Dictionary<string, object>
            {
                {"totalEvents", 0},
                {"activeEvents", 0},
                {"upcomingEvents", 0},
                {"completedEvents", 0},
                {"lastUpdate", DateTime.Now}
            };
            
            eventStats = new Dictionary<string, object>
            {
                {"totalEvents", 0},
                {"activeEvents", 0},
                {"upcomingEvents", 0},
                {"completedEvents", 0},
                {"lastUpdate", DateTime.Now}
            };
            
            // Initialize holidays
            InitializeHolidays();
            
            // Initialize event templates
            InitializeEventTemplates();
        }
        
        private void InitializeHolidays()
        {
            holidays = new List<HolidayData>
            {
                new HolidayData { name = "New Year's Day", month = 1, day = 1, isRecurring = true, description = "Start of the new year" },
                new HolidayData { name = "Valentine's Day", month = 2, day = 14, isRecurring = true, description = "Day of love and romance" },
                new HolidayData { name = "St. Patrick's Day", month = 3, day = 17, isRecurring = true, description = "Irish cultural celebration" },
                new HolidayData { name = "Easter", month = 4, day = 1, isRecurring = false, description = "Spring celebration" },
                new HolidayData { name = "Mother's Day", month = 5, day = 8, isRecurring = false, description = "Honor mothers" },
                new HolidayData { name = "Memorial Day", month = 5, day = 29, isRecurring = false, description = "Remember fallen soldiers" },
                new HolidayData { name = "Father's Day", month = 6, day = 18, isRecurring = false, description = "Honor fathers" },
                new HolidayData { name = "Independence Day", month = 7, day = 4, isRecurring = true, description = "US Independence Day" },
                new HolidayData { name = "Labor Day", month = 9, day = 4, isRecurring = false, description = "Honor workers" },
                new HolidayData { name = "Halloween", month = 10, day = 31, isRecurring = true, description = "Spooky celebration" },
                new HolidayData { name = "Thanksgiving", month = 11, day = 23, isRecurring = false, description = "Gratitude celebration" },
                new HolidayData { name = "Christmas", month = 12, day = 25, isRecurring = true, description = "Christmas celebration" },
                new HolidayData { name = "New Year's Eve", month = 12, day = 31, isRecurring = true, description = "End of year celebration" }
            };
        }
        
        private void InitializeEventTemplates()
        {
            eventTemplates = new List<EventTemplate>
            {
                new EventTemplate
                {
                    id = "daily_score_challenge",
                    title = "Daily Score Challenge",
                    description = "Score 10,000 points in a single game",
                    eventType = EventType.Daily,
                    requirements = new Dictionary<string, object> { {"score", 10000} },
                    rewards = new Dictionary<string, object> { {"coins", 100}, {"energy", 50} },
                    chance = 1.0f,
                    durationHours = 24
                },
                new EventTemplate
                {
                    id = "weekly_tournament",
                    title = "Weekly Tournament",
                    description = "Compete in the weekly tournament",
                    eventType = EventType.Weekly,
                    requirements = new Dictionary<string, object> { {"wins", 5} },
                    rewards = new Dictionary<string, object> { {"coins", 500}, {"gems", 10} },
                    chance = 1.0f,
                    durationHours = 168
                },
                new EventTemplate
                {
                    id = "special_offer",
                    title = "Special Offer",
                    description = "Limited time special offer",
                    eventType = EventType.Special,
                    requirements = new Dictionary<string, object> { {"purchase", 1} },
                    rewards = new Dictionary<string, object> { {"discount", 0.5f} },
                    chance = 0.1f,
                    durationHours = 48
                },
                new EventTemplate
                {
                    id = "combo_master",
                    title = "Combo Master",
                    description = "Create a 10x combo",
                    eventType = EventType.Daily,
                    requirements = new Dictionary<string, object> { {"combo", 10} },
                    rewards = new Dictionary<string, object> { {"coins", 200}, {"energy", 25} },
                    chance = 0.8f,
                    durationHours = 24
                },
                new EventTemplate
                {
                    id = "energy_saver",
                    title = "Energy Saver",
                    description = "Complete 5 levels without using energy",
                    eventType = EventType.Daily,
                    requirements = new Dictionary<string, object> { {"levels", 5}, {"energy_used", 0} },
                    rewards = new Dictionary<string, object> { {"energy", 100} },
                    chance = 0.6f,
                    durationHours = 24
                }
            };
        }
        
        private IEnumerator InitializeCalendarAndEventSystem()
        {
            // Get weather system reference
            weatherSystem = Evergreen.KeyFree.KeyFreeWeatherAndSocialManager.Instance;
            
            // Load data from storage
            LoadEventsFromStorage();
            
            // Generate initial events
            GenerateInitialEvents();
            
            // Start update loop
            if (updateCoroutine != null)
            {
                StopCoroutine(updateCoroutine);
            }
            updateCoroutine = StartCoroutine(UpdateLoop());
            
            isInitialized = true;
            Debug.Log("✅ Calendar and Event Manager initialized successfully");
            
            yield return null;
        }
        
        private void LoadEventsFromStorage()
        {
            // Load calendar events
            string calendarJson = PlayerPrefs.GetString("calendar_events", "");
            if (!string.IsNullOrEmpty(calendarJson))
            {
                try
                {
                    var eventList = JsonUtility.FromJson<CalendarEventList>(calendarJson);
                    calendarEvents = eventList?.events ?? new List<CalendarEvent>();
                }
                catch
                {
                    calendarEvents = new List<CalendarEvent>();
                }
            }
            
            // Load game events
            string gameEventsJson = PlayerPrefs.GetString("game_events", "");
            if (!string.IsNullOrEmpty(gameEventsJson))
            {
                try
                {
                    var eventList = JsonUtility.FromJson<GameEventList>(gameEventsJson);
                    gameEvents = eventList?.events ?? new List<GameEvent>();
                }
                catch
                {
                    gameEvents = new List<GameEvent>();
                }
            }
            
            // Load event progress
            string progressJson = PlayerPrefs.GetString("event_progress", "");
            if (!string.IsNullOrEmpty(progressJson))
            {
                try
                {
                    var progressList = JsonUtility.FromJson<EventProgressList>(progressJson);
                    eventProgress = progressList?.progress ?? new List<EventProgress>();
                }
                catch
                {
                    eventProgress = new List<EventProgress>();
                }
            }
        }
        
        private void SaveEventsToStorage()
        {
            try
            {
                // Save calendar events
                var calendarList = new CalendarEventList { events = calendarEvents };
                string calendarJson = JsonUtility.ToJson(calendarList);
                PlayerPrefs.SetString("calendar_events", calendarJson);
                
                // Save game events
                var gameEventList = new GameEventList { events = gameEvents };
                string gameEventsJson = JsonUtility.ToJson(gameEventList);
                PlayerPrefs.SetString("game_events", gameEventsJson);
                
                // Save event progress
                var progressList = new EventProgressList { progress = eventProgress };
                string progressJson = JsonUtility.ToJson(progressList);
                PlayerPrefs.SetString("event_progress", progressJson);
                
                PlayerPrefs.Save();
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to save events: {e.Message}");
            }
        }
        
        private void GenerateInitialEvents()
        {
            DateTime now = DateTime.Now;
            
            if (enableCalendarSystem)
            {
                GenerateDailyEvents(now);
                GenerateWeeklyEvents(now);
                GenerateMonthlyEvents(now);
                GenerateSeasonalEvents(now);
                GenerateHolidayEvents(now);
            }
            
            if (enableEventSystem)
            {
                GenerateDailyChallenges(now);
                GenerateWeeklyTournaments(now);
                GenerateSpecialOffers(now);
                GenerateWeatherEvents(now);
            }
            
            UpdateEventStatuses();
            SaveEventsToStorage();
        }
        
        private void GenerateDailyEvents(DateTime now)
        {
            // Check if daily reset is needed
            if (ShouldTriggerDailyReset(now))
            {
                TriggerDailyReset(now);
            }
        }
        
        private void GenerateWeeklyEvents(DateTime now)
        {
            // Check if weekly reset is needed
            if (ShouldTriggerWeeklyReset(now))
            {
                TriggerWeeklyReset(now);
            }
        }
        
        private void GenerateMonthlyEvents(DateTime now)
        {
            // Check if monthly reset is needed
            if (ShouldTriggerMonthlyReset(now))
            {
                TriggerMonthlyReset(now);
            }
        }
        
        private void GenerateSeasonalEvents(DateTime now)
        {
            string season = GetCurrentSeason(now);
            DateTime seasonStart = GetSeasonStart(now);
            DateTime seasonEnd = GetSeasonEnd(now);
            
            // Check if seasonal event already exists
            var existingSeasonal = calendarEvents.FirstOrDefault(e => 
                e.eventType == EventType.Seasonal && 
                e.title.Contains(season) &&
                e.startTime >= seasonStart && e.startTime <= seasonEnd);
            
            if (existingSeasonal == null)
            {
                var seasonalEvent = new CalendarEvent
                {
                    id = $"seasonal_{season}_{now.Year}",
                    title = $"{season} Celebration",
                    description = $"Special {season.ToLower()} event with bonus rewards",
                    startTime = seasonStart,
                    endTime = seasonEnd,
                    eventType = EventType.Seasonal,
                    recurrence = new RecurrencePattern { type = RecurrenceType.Yearly },
                    metadata = new Dictionary<string, object>
                    {
                        {"season", season},
                        {"bonus_multiplier", 1.5f},
                        {"special_rewards", true}
                    }
                };
                
                AddCalendarEvent(seasonalEvent);
            }
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
            int year = date.Year;
            
            if (month >= 3 && month <= 5) return new DateTime(year, 3, 1);
            if (month >= 6 && month <= 8) return new DateTime(year, 6, 1);
            if (month >= 9 && month <= 11) return new DateTime(year, 9, 1);
            return new DateTime(year, 12, 1);
        }
        
        private DateTime GetSeasonEnd(DateTime date)
        {
            int month = date.Month;
            int year = date.Year;
            
            if (month >= 3 && month <= 5) return new DateTime(year, 5, 31);
            if (month >= 6 && month <= 8) return new DateTime(year, 8, 31);
            if (month >= 9 && month <= 11) return new DateTime(year, 11, 30);
            return new DateTime(year, 2, 28);
        }
        
        private void GenerateHolidayEvents(DateTime now)
        {
            foreach (var holiday in holidays)
            {
                if (holiday.isRecurring)
                {
                    DateTime holidayDate = new DateTime(now.Year, holiday.month, holiday.day);
                    
                    // Check if holiday event already exists
                    var existingHoliday = calendarEvents.FirstOrDefault(e => 
                        e.eventType == EventType.Holiday && 
                        e.title == holiday.name &&
                        e.startTime.Year == now.Year);
                    
                    if (existingHoliday == null)
                    {
                        var holidayEvent = new CalendarEvent
                        {
                            id = $"holiday_{holiday.name}_{now.Year}",
                            title = holiday.name,
                            description = holiday.description,
                            startTime = holidayDate,
                            endTime = holidayDate.AddDays(1),
                            eventType = EventType.Holiday,
                            recurrence = new RecurrencePattern { type = RecurrenceType.Yearly },
                            metadata = new Dictionary<string, object>
                            {
                                {"holiday_type", "recurring"},
                                {"special_rewards", true},
                                {"bonus_multiplier", 2.0f}
                            }
                        };
                        
                        AddCalendarEvent(holidayEvent);
                    }
                }
            }
        }
        
        private void GenerateDailyChallenges(DateTime now)
        {
            // Check if daily challenge is needed
            var existingDaily = gameEvents.FirstOrDefault(e => 
                e.eventType == EventType.Daily && 
                e.startTime.Date == now.Date);
            
            if (existingDaily == null)
            {
                var dailyChallenge = new GameEvent
                {
                    id = $"daily_challenge_{now:yyyyMMdd}",
                    title = "Daily Challenge",
                    description = "Complete today's special challenge",
                    eventType = EventType.Daily,
                    startTime = now.Date,
                    endTime = now.Date.AddDays(1),
                    requirements = new Dictionary<string, object> { {"score", 5000} },
                    rewards = new Dictionary<string, object> { {"coins", 100}, {"energy", 25} },
                    progress = new Dictionary<string, object> { {"score", 0} },
                    isCompleted = false
                };
                
                AddGameEvent(dailyChallenge);
            }
        }
        
        private void GenerateWeeklyTournaments(DateTime now)
        {
            // Check if weekly tournament is needed
            var existingWeekly = gameEvents.FirstOrDefault(e => 
                e.eventType == EventType.Weekly && 
                e.startTime.Date >= now.Date.AddDays(-7) && e.startTime.Date <= now.Date);
            
            if (existingWeekly == null)
            {
                var weeklyTournament = new GameEvent
                {
                    id = $"weekly_tournament_{now:yyyyMMdd}",
                    title = "Weekly Tournament",
                    description = "Compete in this week's tournament",
                    eventType = EventType.Weekly,
                    startTime = now.Date,
                    endTime = now.Date.AddDays(7),
                    requirements = new Dictionary<string, object> { {"wins", 10} },
                    rewards = new Dictionary<string, object> { {"coins", 500}, {"gems", 10} },
                    progress = new Dictionary<string, object> { {"wins", 0} },
                    isCompleted = false
                };
                
                AddGameEvent(weeklyTournament);
            }
        }
        
        private void GenerateSpecialOffers(DateTime now)
        {
            if (UnityEngine.Random.Range(0f, 1f) < specialOfferChance)
            {
                var specialOffer = new GameEvent
                {
                    id = $"special_offer_{now:yyyyMMddHHmm}",
                    title = "Special Offer",
                    description = "Limited time special offer",
                    eventType = EventType.Special,
                    startTime = now,
                    endTime = now.AddHours(48),
                    requirements = new Dictionary<string, object> { {"purchase", 1} },
                    rewards = new Dictionary<string, object> { {"discount", 0.5f} },
                    progress = new Dictionary<string, object> { {"purchase", 0} },
                    isCompleted = false
                };
                
                AddGameEvent(specialOffer);
            }
        }
        
        private void GenerateWeatherEvents(DateTime now)
        {
            if (weatherSystem != null && weatherSystem.IsWeatherActive())
            {
                var weather = weatherSystem.GetCurrentWeather();
                if (weather != null && weather.weatherType != Evergreen.KeyFree.KeyFreeWeatherAndSocialManager.WeatherType.Clear)
                {
                    var weatherEvent = new GameEvent
                    {
                        id = $"weather_event_{now:yyyyMMddHHmm}",
                        title = GetWeatherEventTitle(weather.weatherType),
                        description = GetWeatherEventDescription(weather.weatherType),
                        eventType = EventType.Weather,
                        startTime = now,
                        endTime = now.AddHours(6),
                        requirements = new Dictionary<string, object> { {"weather_bonus", 1} },
                        rewards = GetWeatherEventRewards(weather.weatherType),
                        progress = new Dictionary<string, object> { {"weather_bonus", 0} },
                        isCompleted = false
                    };
                    
                    AddGameEvent(weatherEvent);
                }
            }
        }
        
        private string GetWeatherEventTitle(Evergreen.KeyFree.KeyFreeWeatherAndSocialManager.WeatherType weatherType)
        {
            switch (weatherType)
            {
                case Evergreen.KeyFree.KeyFreeWeatherAndSocialManager.WeatherType.Rainy:
                    return "Rainy Day Bonus";
                case Evergreen.KeyFree.KeyFreeWeatherAndSocialManager.WeatherType.Stormy:
                    return "Stormy Weather Challenge";
                case Evergreen.KeyFree.KeyFreeWeatherAndSocialManager.WeatherType.Snowy:
                    return "Snow Day Special";
                case Evergreen.KeyFree.KeyFreeWeatherAndSocialManager.WeatherType.Sunny:
                    return "Sunny Day Boost";
                default:
                    return "Weather Event";
            }
        }
        
        private string GetWeatherEventDescription(Evergreen.KeyFree.KeyFreeWeatherAndSocialManager.WeatherType weatherType)
        {
            switch (weatherType)
            {
                case Evergreen.KeyFree.KeyFreeWeatherAndSocialManager.WeatherType.Rainy:
                    return "Take advantage of the rainy weather for bonus rewards";
                case Evergreen.KeyFree.KeyFreeWeatherAndSocialManager.WeatherType.Stormy:
                    return "Brave the stormy weather for extra challenges";
                case Evergreen.KeyFree.KeyFreeWeatherAndSocialManager.WeatherType.Snowy:
                    return "Enjoy the snowy weather with special bonuses";
                case Evergreen.KeyFree.KeyFreeWeatherAndSocialManager.WeatherType.Sunny:
                    return "Bask in the sunny weather for enhanced gameplay";
                default:
                    return "Special weather-based event";
            }
        }
        
        private Dictionary<string, object> GetWeatherEventRewards(Evergreen.KeyFree.KeyFreeWeatherAndSocialManager.WeatherType weatherType)
        {
            switch (weatherType)
            {
                case Evergreen.KeyFree.KeyFreeWeatherAndSocialManager.WeatherType.Rainy:
                    return new Dictionary<string, object> { {"coins", 150}, {"energy", 30} };
                case Evergreen.KeyFree.KeyFreeWeatherAndSocialManager.WeatherType.Stormy:
                    return new Dictionary<string, object> { {"coins", 200}, {"gems", 5} };
                case Evergreen.KeyFree.KeyFreeWeatherAndSocialManager.WeatherType.Snowy:
                    return new Dictionary<string, object> { {"coins", 100}, {"energy", 40} };
                case Evergreen.KeyFree.KeyFreeWeatherAndSocialManager.WeatherType.Sunny:
                    return new Dictionary<string, object> { {"coins", 120}, {"energy", 25} };
                default:
                    return new Dictionary<string, object> { {"coins", 100}, {"energy", 20} };
            }
        }
        
        private void AddCalendarEvent(CalendarEvent evt)
        {
            calendarEvents.Add(evt);
            ProcessCalendarEvent(evt);
        }
        
        private void AddGameEvent(GameEvent evt)
        {
            gameEvents.Add(evt);
            ProcessGameEvent(evt);
        }
        
        private IEnumerator UpdateLoop()
        {
            while (true)
            {
                yield return new WaitForSeconds(60f); // Update every minute
                UpdateEvents();
            }
        }
        
        private void UpdateEvents()
        {
            DateTime now = DateTime.Now;
            
            // Generate new events
            if (enableCalendarSystem)
            {
                GenerateDailyEvents(now);
                GenerateWeeklyEvents(now);
                GenerateMonthlyEvents(now);
                GenerateSeasonalEvents(now);
                GenerateHolidayEvents(now);
            }
            
            if (enableEventSystem)
            {
                GenerateDailyChallenges(now);
                GenerateWeeklyTournaments(now);
                GenerateSpecialOffers(now);
                GenerateWeatherEvents(now);
            }
            
            // Generate random events
            if (enableRandomEvents && UnityEngine.Random.Range(0f, 1f) < randomEventChance)
            {
                GenerateRandomEvent(now);
            }
            
            // Update event statuses
            UpdateEventStatuses();
            
            // Save to storage
            SaveEventsToStorage();
        }
        
        private void GenerateRandomEvent(DateTime now)
        {
            var template = eventTemplates[UnityEngine.Random.Range(0, eventTemplates.Count)];
            if (UnityEngine.Random.Range(0f, 1f) < template.chance)
            {
                var randomEvent = new GameEvent
                {
                    id = $"random_{template.id}_{now:yyyyMMddHHmm}",
                    title = template.title,
                    description = template.description,
                    eventType = template.eventType,
                    startTime = now,
                    endTime = now.AddHours(template.durationHours),
                    requirements = template.requirements,
                    rewards = template.rewards,
                    progress = new Dictionary<string, object>(),
                    isCompleted = false
                };
                
                AddGameEvent(randomEvent);
            }
        }
        
        private bool ShouldTriggerDailyReset(DateTime now)
        {
            var lastDaily = calendarEvents
                .Where(e => e.eventType == EventType.Daily)
                .OrderByDescending(e => e.startTime)
                .FirstOrDefault();
            
            return lastDaily == null || lastDaily.startTime.Date < now.Date;
        }
        
        private bool ShouldTriggerWeeklyReset(DateTime now)
        {
            var lastWeekly = calendarEvents
                .Where(e => e.eventType == EventType.Weekly)
                .OrderByDescending(e => e.startTime)
                .FirstOrDefault();
            
            return lastWeekly == null || lastWeekly.startTime.Date < now.Date.AddDays(-7);
        }
        
        private bool ShouldTriggerMonthlyReset(DateTime now)
        {
            var lastMonthly = calendarEvents
                .Where(e => e.eventType == EventType.Monthly)
                .OrderByDescending(e => e.startTime)
                .FirstOrDefault();
            
            return lastMonthly == null || lastMonthly.startTime.Month < now.Month || lastMonthly.startTime.Year < now.Year;
        }
        
        private void TriggerDailyReset(DateTime now)
        {
            var dailyReset = new CalendarEvent
            {
                id = $"daily_reset_{now:yyyyMMdd}",
                title = "Daily Reset",
                description = "Daily reset event",
                startTime = now.Date,
                endTime = now.Date.AddDays(1),
                eventType = EventType.Daily,
                recurrence = new RecurrencePattern { type = RecurrenceType.Daily },
                metadata = new Dictionary<string, object>
                {
                    {"reset_type", "daily"},
                    {"bonus_energy", 50},
                    {"bonus_coins", 100}
                }
            };
            
            AddCalendarEvent(dailyReset);
        }
        
        private void TriggerWeeklyReset(DateTime now)
        {
            var weeklyReset = new CalendarEvent
            {
                id = $"weekly_reset_{now:yyyyMMdd}",
                title = "Weekly Reset",
                description = "Weekly reset event",
                startTime = now.Date,
                endTime = now.Date.AddDays(7),
                eventType = EventType.Weekly,
                recurrence = new RecurrencePattern { type = RecurrenceType.Weekly },
                metadata = new Dictionary<string, object>
                {
                    {"reset_type", "weekly"},
                    {"bonus_energy", 200},
                    {"bonus_coins", 500}
                }
            };
            
            AddCalendarEvent(weeklyReset);
        }
        
        private void TriggerMonthlyReset(DateTime now)
        {
            var monthlyReset = new CalendarEvent
            {
                id = $"monthly_reset_{now:yyyyMM}",
                title = "Monthly Reset",
                description = "Monthly reset event",
                startTime = now.Date,
                endTime = now.Date.AddMonths(1),
                eventType = EventType.Monthly,
                recurrence = new RecurrencePattern { type = RecurrenceType.Monthly },
                metadata = new Dictionary<string, object>
                {
                    {"reset_type", "monthly"},
                    {"bonus_energy", 500},
                    {"bonus_coins", 1000}
                }
            };
            
            AddCalendarEvent(monthlyReset);
        }
        
        private void UpdateEventStatuses()
        {
            DateTime now = DateTime.Now;
            
            // Update calendar events
            foreach (var evt in calendarEvents)
            {
                ProcessCalendarEvent(evt);
            }
            
            // Update game events
            foreach (var evt in gameEvents)
            {
                ProcessGameEvent(evt);
            }
            
            // Update statistics
            UpdateStatistics();
            
            // Notify listeners
            OnCalendarEventsUpdated?.Invoke(calendarEvents);
            OnGameEventsUpdated?.Invoke(gameEvents);
        }
        
        private void ProcessCalendarEvent(CalendarEvent evt)
        {
            DateTime now = DateTime.Now;
            evt.isOngoing = now >= evt.startTime && now <= evt.endTime;
            evt.isUpcoming = now < evt.startTime;
            evt.isExpired = now > evt.endTime;
            evt.timeRemaining = evt.endTime - now;
        }
        
        private void ProcessGameEvent(GameEvent evt)
        {
            DateTime now = DateTime.Now;
            evt.isOngoing = now >= evt.startTime && now <= evt.endTime && !evt.isCompleted;
            evt.isUpcoming = now < evt.startTime;
            evt.isExpired = now > evt.endTime;
            evt.timeRemaining = evt.endTime - now;
        }
        
        private void UpdateStatistics()
        {
            // Calendar statistics
            calendarStats["totalEvents"] = calendarEvents.Count;
            calendarStats["activeEvents"] = calendarEvents.Count(e => e.isOngoing);
            calendarStats["upcomingEvents"] = calendarEvents.Count(e => e.isUpcoming);
            calendarStats["lastUpdate"] = DateTime.Now;
            
            // Event statistics
            eventStats["totalEvents"] = gameEvents.Count;
            eventStats["activeEvents"] = gameEvents.Count(e => e.isOngoing);
            eventStats["upcomingEvents"] = gameEvents.Count(e => e.isUpcoming);
            eventStats["completedEvents"] = gameEvents.Count(e => e.isCompleted);
            eventStats["lastUpdate"] = DateTime.Now;
        }
        
        // Event Progress Management
        public void UpdateEventProgress(string eventId, Dictionary<string, object> progressData)
        {
            var evt = gameEvents.FirstOrDefault(e => e.id == eventId);
            if (evt == null) return;
            
            // Update progress
            foreach (var kvp in progressData)
            {
                evt.progress[kvp.Key] = kvp.Value;
            }
            
            // Check if event is completed
            if (IsEventCompleted(evt, progressData))
            {
                CompleteEvent(eventId);
            }
            
            // Update progress record
            var progress = eventProgress.FirstOrDefault(p => p.eventId == eventId);
            if (progress == null)
            {
                progress = new EventProgress
                {
                    eventId = eventId,
                    playerId = GetPlayerId(),
                    progressData = progressData,
                    lastUpdated = DateTime.Now,
                    isCompleted = false
                };
                eventProgress.Add(progress);
            }
            else
            {
                progress.progressData = progressData;
                progress.lastUpdated = DateTime.Now;
            }
            
            OnEventProgressUpdated?.Invoke(eventId);
            SaveEventsToStorage();
        }
        
        private bool IsEventCompleted(GameEvent evt, Dictionary<string, object> progressData)
        {
            foreach (var requirement in evt.requirements)
            {
                if (!progressData.ContainsKey(requirement.Key)) return false;
                
                var progressValue = progressData[requirement.Key];
                var requiredValue = requirement.Value;
                
                if (progressValue is int progressInt && requiredValue is int requiredInt)
                {
                    if (progressInt < requiredInt) return false;
                }
                else if (progressValue is float progressFloat && requiredValue is float requiredFloat)
                {
                    if (progressFloat < requiredFloat) return false;
                }
            }
            
            return true;
        }
        
        private void CompleteEvent(string eventId)
        {
            var evt = gameEvents.FirstOrDefault(e => e.id == eventId);
            if (evt == null || evt.isCompleted) return;
            
            evt.isCompleted = true;
            
            // Grant rewards
            GrantEventRewards(evt);
            
            // Update progress record
            var progress = eventProgress.FirstOrDefault(p => p.eventId == eventId);
            if (progress != null)
            {
                progress.isCompleted = true;
            }
            
            OnEventCompleted?.Invoke(evt);
            Debug.Log($"🎉 Event completed: {evt.title}");
        }
        
        private void GrantEventRewards(GameEvent evt)
        {
            // Placeholder for economy system integration
            Debug.Log($"🎁 Rewards granted for {evt.title}: {JsonUtility.ToJson(evt.rewards)}");
        }
        
        private string GetPlayerId()
        {
            // Get player ID from GameDataManager or generate new one
            string playerId = PlayerPrefs.GetString("player_id", "");
            if (string.IsNullOrEmpty(playerId))
            {
                playerId = System.Guid.NewGuid().ToString();
                PlayerPrefs.SetString("player_id", playerId);
                PlayerPrefs.Save();
            }
            return playerId;
        }
        
        // Public API Methods
        public List<CalendarEvent> GetAllCalendarEvents() => calendarEvents;
        public List<CalendarEvent> GetActiveCalendarEvents() => calendarEvents.Where(e => e.isOngoing).ToList();
        public List<CalendarEvent> GetUpcomingCalendarEvents() => calendarEvents.Where(e => e.isUpcoming).ToList();
        public List<CalendarEvent> GetCalendarEventsByType(EventType eventType) => calendarEvents.Where(e => e.eventType == eventType).ToList();
        public CalendarEvent GetCalendarEvent(string eventId) => calendarEvents.FirstOrDefault(e => e.id == eventId);
        public bool IsCalendarEventActive(string eventId) => GetCalendarEvent(eventId)?.isOngoing ?? false;
        public TimeSpan GetCalendarEventTimeRemaining(string eventId) => GetCalendarEvent(eventId)?.timeRemaining ?? TimeSpan.Zero;
        
        public List<GameEvent> GetAllGameEvents() => gameEvents;
        public List<GameEvent> GetActiveGameEvents() => gameEvents.Where(e => e.isOngoing).ToList();
        public List<GameEvent> GetUpcomingGameEvents() => gameEvents.Where(e => e.isUpcoming).ToList();
        public List<GameEvent> GetGameEventsByType(EventType eventType) => gameEvents.Where(e => e.eventType == eventType).ToList();
        public GameEvent GetGameEvent(string eventId) => gameEvents.FirstOrDefault(e => e.id == eventId);
        public bool IsGameEventActive(string eventId) => GetGameEvent(eventId)?.isOngoing ?? false;
        public TimeSpan GetGameEventTimeRemaining(string eventId) => GetGameEvent(eventId)?.timeRemaining ?? TimeSpan.Zero;
        public EventProgress GetEventProgress(string eventId) => eventProgress.FirstOrDefault(p => p.eventId == eventId);
        public bool IsEventCompleted(string eventId) => GetGameEvent(eventId)?.isCompleted ?? false;
        public float GetEventCompletionPercentage(string eventId)
        {
            var evt = GetGameEvent(eventId);
            if (evt == null) return 0f;
            
            float totalRequirements = evt.requirements.Count;
            float completedRequirements = 0f;
            
            foreach (var requirement in evt.requirements)
            {
                if (evt.progress.ContainsKey(requirement.Key))
                {
                    var progressValue = evt.progress[requirement.Key];
                    var requiredValue = requirement.Value;
                    
                    if (progressValue is int progressInt && requiredValue is int requiredInt)
                    {
                        if (progressInt >= requiredInt) completedRequirements++;
                    }
                    else if (progressValue is float progressFloat && requiredValue is float requiredFloat)
                    {
                        if (progressFloat >= requiredFloat) completedRequirements++;
                    }
                }
            }
            
            return totalRequirements > 0 ? completedRequirements / totalRequirements : 0f;
        }
        
        public void SetTimezone(string timezone)
        {
            currentTimezone = timezone;
            Debug.Log($"Timezone set to: {timezone}");
        }
        
        public string GetCurrentTimezone() => currentTimezone;
        
        public Dictionary<string, object> GetCalendarStatistics() => calendarStats;
        public Dictionary<string, object> GetEventStatistics() => eventStats;
        
        public void RefreshCalendar()
        {
            GenerateInitialEvents();
            UpdateEventStatuses();
        }
        
        public void RefreshEvents()
        {
            GenerateInitialEvents();
            UpdateEventStatuses();
        }
        
        public void SetCalendarEnabled(bool enabled) => enableCalendarSystem = enabled;
        public void SetEventSystemEnabled(bool enabled) => enableEventSystem = enabled;
        
        void OnDestroy()
        {
            if (updateCoroutine != null)
            {
                StopCoroutine(updateCoroutine);
            }
        }
    }
}