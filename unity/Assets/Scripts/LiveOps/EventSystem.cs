using System.Collections.Generic;
using UnityEngine;
using System;
using System.Linq;

namespace Evergreen.LiveOps
{
    [Serializable]
    public class GameEvent
    {
        public string eventId;
        public string name;
        public string description;
        public EventType type;
        public EventStatus status;
        public long startTime;
        public long endTime;
        public Dictionary<string, object> rewards = new Dictionary<string, object>();
        public Dictionary<string, object> requirements = new Dictionary<string, object>();
        public Dictionary<string, object> progress = new Dictionary<string, object>();
        public bool isActive;
        public int priority;
    }
    
    public enum EventType
    {
        Tournament,
        DailyChallenge,
        WeeklyChallenge,
        Seasonal,
        Special,
        LimitedTime
    }
    
    public enum EventStatus
    {
        Upcoming,
        Active,
        Completed,
        Expired,
        Locked
    }
    
    [Serializable]
    public class TournamentData
    {
        public string tournamentId;
        public string name;
        public TournamentType type;
        public long startTime;
        public long endTime;
        public List<TournamentPlayer> players = new List<TournamentPlayer>();
        public Dictionary<string, object> rewards = new Dictionary<string, object>();
        public bool isActive;
    }
    
    public enum TournamentType
    {
        Score,
        Level,
        Time,
        Survival
    }
    
    [Serializable]
    public class TournamentPlayer
    {
        public string playerId;
        public string playerName;
        public int score;
        public int level;
        public int rank;
        public long lastUpdate;
    }
    
    public class EventSystem : MonoBehaviour
    {
        [Header("Events")]
        public List<GameEvent> activeEvents = new List<GameEvent>();
        public List<TournamentData> tournaments = new List<TournamentData>();
        
        [Header("Settings")]
        public float eventCheckInterval = 60f; // Check every minute
        public int maxActiveEvents = 5;
        
        public static EventSystem Instance { get; private set; }
        
        private float lastEventCheck;
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeEvents();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            LoadEventData();
            CheckAndUpdateEvents();
        }
        
        void Update()
        {
            if (Time.time - lastEventCheck > eventCheckInterval)
            {
                CheckAndUpdateEvents();
            }
        }
        
        private void InitializeEvents()
        {
            // Initialize with some default events
            CreateDailyChallenge();
            CreateWeeklyTournament();
        }
        
        private void CreateDailyChallenge()
        {
            var dailyEvent = new GameEvent
            {
                eventId = "daily_challenge_" + DateTimeOffset.UtcNow.DayOfYear,
                name = "Daily Challenge",
                description = "Complete 5 levels to earn bonus rewards!",
                type = EventType.DailyChallenge,
                status = EventStatus.Active,
                startTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                endTime = DateTimeOffset.UtcNow.AddDays(1).ToUnixTimeSeconds(),
                rewards = new Dictionary<string, object>
                {
                    {"coins", 500},
                    {"gems", 50},
                    {"energy", 5}
                },
                requirements = new Dictionary<string, object>
                {
                    {"levels_completed", 5}
                },
                progress = new Dictionary<string, object>
                {
                    {"levels_completed", 0}
                },
                isActive = true,
                priority = 1
            };
            
            activeEvents.Add(dailyEvent);
        }
        
        private void CreateWeeklyTournament()
        {
            var tournament = new TournamentData
            {
                tournamentId = "weekly_tournament_" + DateTimeOffset.UtcNow.DayOfYear / 7,
                name = "Weekly Tournament",
                type = TournamentType.Score,
                startTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                endTime = DateTimeOffset.UtcNow.AddDays(7).ToUnixTimeSeconds(),
                rewards = new Dictionary<string, object>
                {
                    {"1st", new Dictionary<string, object> {{"gems", 1000}, {"coins", 10000}}},
                    {"2nd", new Dictionary<string, object> {{"gems", 500}, {"coins", 5000}}},
                    {"3rd", new Dictionary<string, object> {{"gems", 250}, {"coins", 2500}}},
                    {"top_10", new Dictionary<string, object> {{"gems", 100}, {"coins", 1000}}},
                    {"top_50", new Dictionary<string, object> {{"gems", 50}, {"coins", 500}}}
                },
                isActive = true
            };
            
            tournaments.Add(tournament);
        }
        
        public void CheckAndUpdateEvents()
        {
            lastEventCheck = Time.time;
            var currentTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            
            // Update event statuses
            foreach (var evt in activeEvents)
            {
                if (evt.status == EventStatus.Active)
                {
                    if (currentTime >= evt.endTime)
                    {
                        evt.status = EventStatus.Expired;
                        evt.isActive = false;
                        OnEventExpired(evt);
                    }
                }
                else if (evt.status == EventStatus.Upcoming && currentTime >= evt.startTime)
                {
                    evt.status = EventStatus.Active;
                    evt.isActive = true;
                    OnEventStarted(evt);
                }
            }
            
            // Update tournaments
            foreach (var tournament in tournaments)
            {
                if (tournament.isActive && currentTime >= tournament.endTime)
                {
                    tournament.isActive = false;
                    OnTournamentEnded(tournament);
                }
            }
            
            // Clean up expired events
            activeEvents.RemoveAll(e => e.status == EventStatus.Expired);
            
            // Create new events if needed
            if (activeEvents.Count < maxActiveEvents)
            {
                CreateRandomEvent();
            }
            
            SaveEventData();
        }
        
        private void CreateRandomEvent()
        {
            var eventTypes = new[] { EventType.Special, EventType.LimitedTime };
            var randomType = eventTypes[UnityEngine.Random.Range(0, eventTypes.Length)];
            
            var evt = new GameEvent
            {
                eventId = "random_event_" + UnityEngine.Random.Range(1000, 9999),
                name = GetRandomEventName(randomType),
                description = GetRandomEventDescription(randomType),
                type = randomType,
                status = EventStatus.Upcoming,
                startTime = DateTimeOffset.UtcNow.AddMinutes(UnityEngine.Random.Range(5, 30)).ToUnixTimeSeconds(),
                endTime = DateTimeOffset.UtcNow.AddHours(UnityEngine.Random.Range(2, 24)).ToUnixTimeSeconds(),
                rewards = GenerateRandomRewards(),
                requirements = GenerateRandomRequirements(),
                progress = new Dictionary<string, object>(),
                isActive = false,
                priority = UnityEngine.Random.Range(1, 5)
            };
            
            activeEvents.Add(evt);
        }
        
        private string GetRandomEventName(EventType type)
        {
            var names = new Dictionary<EventType, string[]>
            {
                { EventType.Special, new[] { "Double Coins", "Energy Boost", "Lucky Day", "Power Hour" } },
                { EventType.LimitedTime, new[] { "Flash Sale", "Limited Offer", "Special Deal", "Exclusive Event" } }
            };
            
            var typeNames = names.GetValueOrDefault(type, new[] { "Special Event" });
            return typeNames[UnityEngine.Random.Range(0, typeNames.Length)];
        }
        
        private string GetRandomEventDescription(EventType type)
        {
            var descriptions = new Dictionary<EventType, string[]>
            {
                { EventType.Special, new[] { "Earn double coins for the next hour!", "Get bonus energy refills!", "Special rewards await!" } },
                { EventType.LimitedTime, new[] { "Limited time offers available!", "Don't miss out on these deals!", "Exclusive rewards for a limited time!" } }
            };
            
            var typeDescriptions = descriptions.GetValueOrDefault(type, new[] { "Special event is active!" });
            return typeDescriptions[UnityEngine.Random.Range(0, typeDescriptions.Length)];
        }
        
        private Dictionary<string, object> GenerateRandomRewards()
        {
            var rewards = new Dictionary<string, object>();
            
            if (UnityEngine.Random.value < 0.7f)
                rewards["coins"] = UnityEngine.Random.Range(100, 1000);
            
            if (UnityEngine.Random.value < 0.5f)
                rewards["gems"] = UnityEngine.Random.Range(10, 100);
            
            if (UnityEngine.Random.value < 0.3f)
                rewards["energy"] = UnityEngine.Random.Range(1, 5);
            
            return rewards;
        }
        
        private Dictionary<string, object> GenerateRandomRequirements()
        {
            var requirements = new Dictionary<string, object>();
            
            var reqTypes = new[] { "levels_completed", "score_achieved", "time_played", "matches_made" };
            var reqType = reqTypes[UnityEngine.Random.Range(0, reqTypes.Length)];
            
            switch (reqType)
            {
                case "levels_completed":
                    requirements["levels_completed"] = UnityEngine.Random.Range(3, 10);
                    break;
                case "score_achieved":
                    requirements["score_achieved"] = UnityEngine.Random.Range(10000, 50000);
                    break;
                case "time_played":
                    requirements["time_played"] = UnityEngine.Random.Range(300, 1800); // 5-30 minutes
                    break;
                case "matches_made":
                    requirements["matches_made"] = UnityEngine.Random.Range(50, 200);
                    break;
            }
            
            return requirements;
        }
        
        public void UpdateEventProgress(string eventId, string progressType, int amount)
        {
            var evt = activeEvents.Find(e => e.eventId == eventId);
            if (evt == null || !evt.isActive) return;
            
            if (evt.progress.ContainsKey(progressType))
            {
                evt.progress[progressType] = (int)evt.progress[progressType] + amount;
            }
            else
            {
                evt.progress[progressType] = amount;
            }
            
            // Check if event is completed
            if (IsEventCompleted(evt))
            {
                CompleteEvent(evt);
            }
            
            // Analytics
            Evergreen.Game.AnalyticsAdapter.CustomEvent("event_progress_updated", new Dictionary<string, object>
            {
                {"event_id", eventId},
                {"progress_type", progressType},
                {"amount", amount}
            });
        }
        
        private bool IsEventCompleted(GameEvent evt)
        {
            foreach (var req in evt.requirements)
            {
                if (!evt.progress.ContainsKey(req.Key)) return false;
                
                var required = Convert.ToInt32(req.Value);
                var current = Convert.ToInt32(evt.progress[req.Key]);
                
                if (current < required) return false;
            }
            
            return true;
        }
        
        private void CompleteEvent(GameEvent evt)
        {
            evt.status = EventStatus.Completed;
            evt.isActive = false;
            
            // Grant rewards
            GrantEventRewards(evt);
            
            // Analytics
            Evergreen.Game.AnalyticsAdapter.CustomEvent("event_completed", new Dictionary<string, object>
            {
                {"event_id", evt.eventId},
                {"event_type", evt.type.ToString()}
            });
        }
        
        private void GrantEventRewards(GameEvent evt)
        {
            foreach (var reward in evt.rewards)
            {
                switch (reward.Key)
                {
                    case "coins":
                        Evergreen.Game.GameState.AddCoins(Convert.ToInt32(reward.Value));
                        break;
                    case "gems":
                        Evergreen.Game.GameState.AddGems(Convert.ToInt32(reward.Value));
                        break;
                    case "energy":
                        for (int i = 0; i < Convert.ToInt32(reward.Value); i++)
                        {
                            Evergreen.Game.GameState.RefillEnergy();
                        }
                        break;
                }
            }
        }
        
        private void OnEventStarted(GameEvent evt)
        {
            Debug.Log($"Event started: {evt.name}");
            // Show notification to player
        }
        
        private void OnEventExpired(GameEvent evt)
        {
            Debug.Log($"Event expired: {evt.name}");
            // Show notification to player
        }
        
        private void OnTournamentEnded(TournamentData tournament)
        {
            Debug.Log($"Tournament ended: {tournament.name}");
            // Calculate final rankings and distribute rewards
        }
        
        public List<GameEvent> GetActiveEvents()
        {
            return activeEvents.Where(e => e.isActive).ToList();
        }
        
        public List<TournamentData> GetActiveTournaments()
        {
            return tournaments.Where(t => t.isActive).ToList();
        }
        
        private void LoadEventData()
        {
            var data = PlayerPrefs.GetString("EventData", "");
            if (!string.IsNullOrEmpty(data))
            {
                try
                {
                    var eventData = JsonUtility.FromJson<GameEvent[]>(data);
                    if (eventData != null)
                    {
                        activeEvents = new List<GameEvent>(eventData);
                    }
                }
                catch (Exception e)
                {
                    Debug.LogError($"Failed to load event data: {e.Message}");
                }
            }
        }
        
        private void SaveEventData()
        {
            try
            {
                var data = JsonUtility.ToJson(activeEvents.ToArray());
                PlayerPrefs.SetString("EventData", data);
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to save event data: {e.Message}");
            }
        }
    }
}