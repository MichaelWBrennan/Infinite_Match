using UnityEngine;
using System.Collections.Generic;
using System;
using System.Collections;
using Evergreen.Core;

namespace Evergreen.LiveOps
{
    [System.Serializable]
    public class LiveEvent
    {
        public string id;
        public string name;
        public string description;
        public LiveEventType type;
        public DateTime startTime;
        public DateTime endTime;
        public bool isActive;
        public int priority;
        public List<EventReward> rewards = new List<EventReward>();
        public EventSettings settings = new EventSettings();
        public EventMetrics metrics = new EventMetrics();
        public List<EventCondition> conditions = new List<EventCondition>();
    }

    [System.Serializable]
    public class EventReward
    {
        public string id;
        public string name;
        public string description;
        public string type; // "coins", "gems", "energy", "decoration", "character", "ability"
        public int amount;
        public string itemId;
        public int requiredScore;
        public bool isClaimed;
        public DateTime claimTime;
        public int rarity;
        public bool isLimitedTime;
        public DateTime expiryTime;
    }

    [System.Serializable]
    public class EventSettings
    {
        public bool requiresTeam = false;
        public int minLevel = 1;
        public int maxParticipants = 10000;
        public string region = "global";
        public string language = "en";
        public bool isRepeatable = false;
        public int maxRepeats = 1;
        public float difficultyMultiplier = 1.0f;
        public bool enableLeaderboard = true;
        public bool enableRewards = true;
        public bool enableNotifications = true;
    }

    [System.Serializable]
    public class EventMetrics
    {
        public int totalParticipants = 0;
        public int totalCompletions = 0;
        public float completionRate = 0f;
        public int totalRewardsClaimed = 0;
        public float averageScore = 0f;
        public int maxScore = 0;
        public DateTime lastUpdated;
        public Dictionary<string, int> participantSegments = new Dictionary<string, int>();
        public Dictionary<string, float> regionalPerformance = new Dictionary<string, float>();
    }

    [System.Serializable]
    public class EventCondition
    {
        public string type; // "level", "purchase_count", "time_since_last_play", "currency_balance", "streak", "completion_rate"
        public string operatorType; // "greater_than", "less_than", "equals", "not_equals"
        public int value;
        public string currencyType;
        public int timeWindow; // in hours
    }

    public enum LiveEventType
    {
        Tournament,
        TeamChallenge,
        GlobalEvent,
        SeasonalEvent,
        SpecialEvent,
        DailyChallenge,
        WeeklyChallenge,
        MonthlyChallenge,
        LimitedTimeEvent,
        SocialEvent,
        CompetitiveEvent
    }

    [System.Serializable]
    public class EventRotation
    {
        public string id;
        public string name;
        public List<EventRotationEntry> entries = new List<EventRotationEntry>();
        public bool isActive = true;
        public DateTime startTime;
        public DateTime endTime;
        public int currentIndex = 0;
        public float rotationSpeed = 1.0f; // hours per rotation
    }

    [System.Serializable]
    public class EventRotationEntry
    {
        public string eventId;
        public float weight = 1.0f;
        public int minDuration = 1; // hours
        public int maxDuration = 24; // hours
        public List<EventCondition> conditions = new List<EventCondition>();
        public bool isActive = true;
    }

    [System.Serializable]
    public class EventTemplate
    {
        public string id;
        public string name;
        public string description;
        public LiveEventType type;
        public List<EventReward> defaultRewards = new List<EventReward>();
        public EventSettings defaultSettings = new EventSettings();
        public List<EventCondition> defaultConditions = new List<EventCondition>();
        public bool isActive = true;
        public int priority = 1;
    }

    [System.Serializable]
    public class EventAnalytics
    {
        public string eventId;
        public int totalViews = 0;
        public int totalClicks = 0;
        public int totalParticipations = 0;
        public int totalCompletions = 0;
        public float clickThroughRate = 0f;
        public float participationRate = 0f;
        public float completionRate = 0f;
        public float averageSessionTime = 0f;
        public float averageScore = 0f;
        public int totalRewardsClaimed = 0;
        public float revenueGenerated = 0f;
        public DateTime lastUpdated;
    }

    public class AdvancedLiveOpsSystem : MonoBehaviour
    {
        [Header("Live Events")]
        public List<LiveEvent> liveEvents = new List<LiveEvent>();
        public List<EventTemplate> eventTemplates = new List<EventTemplate>();
        public List<EventRotation> eventRotations = new List<EventRotation>();
        public List<EventAnalytics> eventAnalytics = new List<EventAnalytics>();
        
        [Header("Event Settings")]
        public bool enableEventRotation = true;
        public bool enableEventAnalytics = true;
        public bool enableEventNotifications = true;
        public float eventUpdateInterval = 60f; // seconds
        public int maxActiveEvents = 10;
        public int maxEventHistory = 100;
        
        [Header("Notification Settings")]
        public bool enablePushNotifications = true;
        public bool enableInGameNotifications = true;
        public float notificationCooldown = 300f; // seconds
        public int maxNotificationsPerDay = 10;
        
        private Dictionary<string, LiveEvent> _eventLookup = new Dictionary<string, LiveEvent>();
        private Dictionary<string, EventTemplate> _templateLookup = new Dictionary<string, EventTemplate>();
        private Dictionary<string, EventRotation> _rotationLookup = new Dictionary<string, EventRotation>();
        private Dictionary<string, EventAnalytics> _analyticsLookup = new Dictionary<string, EventAnalytics>();
        private Dictionary<string, List<EventReward>> _playerEventRewards = new Dictionary<string, List<EventReward>>();
        private Dictionary<string, int> _playerEventScores = new Dictionary<string, int>();
        private Dictionary<string, DateTime> _lastNotificationTime = new Dictionary<string, DateTime>();
        
        // Events
        public System.Action<LiveEvent> OnEventStarted;
        public System.Action<LiveEvent> OnEventEnded;
        public System.Action<LiveEvent> OnEventUpdated;
        public System.Action<EventReward> OnRewardClaimed;
        public System.Action<LiveEvent> OnEventNotification;
        
        public static AdvancedLiveOpsSystem Instance { get; private set; }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeLiveOpsSystem();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            LoadLiveOpsData();
            CreateDefaultEventTemplates();
            CreateDefaultEventRotations();
            BuildLookupTables();
            StartCoroutine(UpdateLiveEvents());
            StartCoroutine(ProcessEventRotations());
        }
        
        private void InitializeLiveOpsSystem()
        {
            Debug.Log("Advanced Live Ops System initialized");
        }
        
        private void CreateDefaultEventTemplates()
        {
            if (eventTemplates.Count == 0)
            {
                // Daily Challenge Template
                var dailyChallengeTemplate = new EventTemplate
                {
                    id = "daily_challenge_template",
                    name = "Daily Challenge",
                    description = "Complete daily challenges for rewards!",
                    type = LiveEventType.DailyChallenge,
                    defaultRewards = new List<EventReward>
                    {
                        new EventReward { type = "coins", amount = 500, requiredScore = 1000 },
                        new EventReward { type = "gems", amount = 25, requiredScore = 2500 },
                        new EventReward { type = "energy", amount = 10, requiredScore = 5000 }
                    },
                    defaultSettings = new EventSettings
                    {
                        requiresTeam = false,
                        minLevel = 1,
                        maxParticipants = 10000,
                        enableLeaderboard = true,
                        enableRewards = true,
                        enableNotifications = true
                    },
                    defaultConditions = new List<EventCondition>
                    {
                        new EventCondition { type = "level", operatorType = "greater_than", value = 1 }
                    },
                    isActive = true,
                    priority = 1
                };
                eventTemplates.Add(dailyChallengeTemplate);
                
                // Weekly Tournament Template
                var weeklyTournamentTemplate = new EventTemplate
                {
                    id = "weekly_tournament_template",
                    name = "Weekly Tournament",
                    description = "Compete in weekly tournaments!",
                    type = LiveEventType.WeeklyChallenge,
                    defaultRewards = new List<EventReward>
                    {
                        new EventReward { type = "coins", amount = 2000, requiredScore = 5000 },
                        new EventReward { type = "gems", amount = 100, requiredScore = 10000 },
                        new EventReward { type = "decoration", itemId = "tournament_trophy", requiredScore = 20000 }
                    },
                    defaultSettings = new EventSettings
                    {
                        requiresTeam = false,
                        minLevel = 5,
                        maxParticipants = 5000,
                        enableLeaderboard = true,
                        enableRewards = true,
                        enableNotifications = true
                    },
                    defaultConditions = new List<EventCondition>
                    {
                        new EventCondition { type = "level", operatorType = "greater_than", value = 5 }
                    },
                    isActive = true,
                    priority = 2
                };
                eventTemplates.Add(weeklyTournamentTemplate);
                
                // Team Challenge Template
                var teamChallengeTemplate = new EventTemplate
                {
                    id = "team_challenge_template",
                    name = "Team Challenge",
                    description = "Work together with your team!",
                    type = LiveEventType.TeamChallenge,
                    defaultRewards = new List<EventReward>
                    {
                        new EventReward { type = "coins", amount = 1000, requiredScore = 2000 },
                        new EventReward { type = "gems", amount = 50, requiredScore = 5000 },
                        new EventReward { type = "energy", amount = 20, requiredScore = 10000 }
                    },
                    defaultSettings = new EventSettings
                    {
                        requiresTeam = true,
                        minLevel = 10,
                        maxParticipants = 1000,
                        enableLeaderboard = true,
                        enableRewards = true,
                        enableNotifications = true
                    },
                    defaultConditions = new List<EventCondition>
                    {
                        new EventCondition { type = "level", operatorType = "greater_than", value = 10 }
                    },
                    isActive = true,
                    priority = 3
                };
                eventTemplates.Add(teamChallengeTemplate);
            }
        }
        
        private void CreateDefaultEventRotations()
        {
            if (eventRotations.Count == 0)
            {
                // Daily Rotation
                var dailyRotation = new EventRotation
                {
                    id = "daily_rotation",
                    name = "Daily Event Rotation",
                    entries = new List<EventRotationEntry>
                    {
                        new EventRotationEntry { eventId = "daily_challenge_template", weight = 1.0f, minDuration = 24, maxDuration = 24 },
                        new EventRotationEntry { eventId = "team_challenge_template", weight = 0.5f, minDuration = 12, maxDuration = 24 }
                    },
                    isActive = true,
                    startTime = DateTime.Now,
                    endTime = DateTime.Now.AddDays(30),
                    currentIndex = 0,
                    rotationSpeed = 24.0f
                };
                eventRotations.Add(dailyRotation);
                
                // Weekly Rotation
                var weeklyRotation = new EventRotation
                {
                    id = "weekly_rotation",
                    name = "Weekly Event Rotation",
                    entries = new List<EventRotationEntry>
                    {
                        new EventRotationEntry { eventId = "weekly_tournament_template", weight = 1.0f, minDuration = 168, maxDuration = 168 },
                        new EventRotationEntry { eventId = "team_challenge_template", weight = 0.8f, minDuration = 72, maxDuration = 168 }
                    },
                    isActive = true,
                    startTime = DateTime.Now,
                    endTime = DateTime.Now.AddDays(90),
                    currentIndex = 0,
                    rotationSpeed = 168.0f
                };
                eventRotations.Add(weeklyRotation);
            }
        }
        
        private void BuildLookupTables()
        {
            _eventLookup.Clear();
            _templateLookup.Clear();
            _rotationLookup.Clear();
            _analyticsLookup.Clear();
            
            foreach (var liveEvent in liveEvents)
            {
                _eventLookup[liveEvent.id] = liveEvent;
            }
            
            foreach (var template in eventTemplates)
            {
                _templateLookup[template.id] = template;
            }
            
            foreach (var rotation in eventRotations)
            {
                _rotationLookup[rotation.id] = rotation;
            }
            
            foreach (var analytics in eventAnalytics)
            {
                _analyticsLookup[analytics.eventId] = analytics;
            }
        }
        
        public List<LiveEvent> GetActiveEvents(string playerId)
        {
            var activeEvents = new List<LiveEvent>();
            
            foreach (var liveEvent in liveEvents)
            {
                if (!liveEvent.isActive) continue;
                if (DateTime.Now < liveEvent.startTime || DateTime.Now > liveEvent.endTime) continue;
                if (!IsPlayerEligible(liveEvent, playerId)) continue;
                
                activeEvents.Add(liveEvent);
            }
            
            // Sort by priority
            activeEvents.Sort((a, b) => b.priority.CompareTo(a.priority));
            
            // Limit to max active events
            if (activeEvents.Count > maxActiveEvents)
            {
                activeEvents = activeEvents.GetRange(0, maxActiveEvents);
            }
            
            return activeEvents;
        }
        
        private bool IsPlayerEligible(LiveEvent liveEvent, string playerId)
        {
            var playerBehavior = GetPlayerBehavior(playerId);
            
            foreach (var condition in liveEvent.conditions)
            {
                if (!EvaluateEventCondition(condition, playerId, playerBehavior)) return false;
            }
            
            return true;
        }
        
        private bool EvaluateEventCondition(EventCondition condition, string playerId, PlayerBehavior behavior)
        {
            int value = GetEventConditionValue(condition, playerId, behavior);
            
            switch (condition.operatorType)
            {
                case "greater_than":
                    return value > condition.value;
                case "less_than":
                    return value < condition.value;
                case "equals":
                    return value == condition.value;
                case "not_equals":
                    return value != condition.value;
                default:
                    return false;
            }
        }
        
        private int GetEventConditionValue(EventCondition condition, string playerId, PlayerBehavior behavior)
        {
            switch (condition.type)
            {
                case "level":
                    return behavior.level;
                case "purchase_count":
                    return behavior.purchaseCount;
                case "time_since_last_play":
                    return (int)(DateTime.Now - behavior.lastPlayTime).TotalHours;
                case "currency_balance":
                    var gameManager = ServiceLocator.Get<GameManager>();
                    return gameManager?.GetCurrency(condition.currencyType) ?? 0;
                case "streak":
                    return behavior.currentStreak;
                case "completion_rate":
                    return Mathf.RoundToInt(behavior.completionRate * 100);
                default:
                    return 0;
            }
        }
        
        public bool ParticipateInEvent(string playerId, string eventId)
        {
            if (!_eventLookup.ContainsKey(eventId)) return false;
            
            var liveEvent = _eventLookup[eventId];
            if (!liveEvent.isActive) return false;
            if (DateTime.Now < liveEvent.startTime || DateTime.Now > liveEvent.endTime) return false;
            if (!IsPlayerEligible(liveEvent, playerId)) return false;
            
            // Update analytics
            UpdateEventAnalytics(eventId, "participation");
            
            // Send notification
            if (enableEventNotifications)
            {
                SendEventNotification(liveEvent, playerId);
            }
            
            return true;
        }
        
        public bool UpdateEventScore(string playerId, string eventId, int score)
        {
            if (!_eventLookup.ContainsKey(eventId)) return false;
            
            var liveEvent = _eventLookup[eventId];
            if (!liveEvent.isActive) return false;
            
            // Update player score
            _playerEventScores[playerId + "_" + eventId] = score;
            
            // Update event metrics
            liveEvent.metrics.totalCompletions++;
            liveEvent.metrics.averageScore = (liveEvent.metrics.averageScore + score) / 2f;
            if (score > liveEvent.metrics.maxScore)
            {
                liveEvent.metrics.maxScore = score;
            }
            
            // Check for rewards
            CheckEventRewards(playerId, eventId, score);
            
            // Update analytics
            UpdateEventAnalytics(eventId, "completion", score);
            
            return true;
        }
        
        private void CheckEventRewards(string playerId, string eventId, int score)
        {
            var liveEvent = _eventLookup[eventId];
            
            foreach (var reward in liveEvent.rewards)
            {
                if (reward.isClaimed) continue;
                if (score < reward.requiredScore) continue;
                
                // Award reward
                AwardEventReward(playerId, reward);
                
                // Mark as claimed
                reward.isClaimed = true;
                reward.claimTime = DateTime.Now;
                
                // Update analytics
                liveEvent.metrics.totalRewardsClaimed++;
                
                OnRewardClaimed?.Invoke(reward);
            }
        }
        
        private void AwardEventReward(string playerId, EventReward reward)
        {
            var gameManager = ServiceLocator.Get<GameManager>();
            if (gameManager == null) return;
            
            switch (reward.type)
            {
                case "coins":
                    gameManager.AddCurrency("coins", reward.amount);
                    break;
                case "gems":
                    gameManager.AddCurrency("gems", reward.amount);
                    break;
                case "energy":
                    var energySystem = ServiceLocator.Get<EnergySystem>();
                    energySystem?.AddEnergy(reward.amount);
                    break;
                case "decoration":
                    var castleSystem = ServiceLocator.Get<CastleRenovationSystem>();
                    if (castleSystem != null && !string.IsNullOrEmpty(reward.itemId))
                    {
                        castleSystem.PurchaseDecoration(reward.itemId);
                    }
                    break;
            }
            
            // Track reward
            if (!_playerEventRewards.ContainsKey(playerId))
            {
                _playerEventRewards[playerId] = new List<EventReward>();
            }
            _playerEventRewards[playerId].Add(reward);
        }
        
        public List<EventReward> GetPlayerEventRewards(string playerId)
        {
            if (!_playerEventRewards.ContainsKey(playerId)) return new List<EventReward>();
            return _playerEventRewards[playerId];
        }
        
        public int GetPlayerEventScore(string playerId, string eventId)
        {
            string key = playerId + "_" + eventId;
            return _playerEventScores.ContainsKey(key) ? _playerEventScores[key] : 0;
        }
        
        public bool CreateEventFromTemplate(string templateId, DateTime startTime, DateTime endTime)
        {
            if (!_templateLookup.ContainsKey(templateId)) return false;
            
            var template = _templateLookup[templateId];
            var liveEvent = new LiveEvent
            {
                id = Guid.NewGuid().ToString(),
                name = template.name,
                description = template.description,
                type = template.type,
                startTime = startTime,
                endTime = endTime,
                isActive = true,
                priority = template.priority,
                rewards = new List<EventReward>(template.defaultRewards),
                settings = new EventSettings(template.defaultSettings),
                conditions = new List<EventCondition>(template.defaultConditions),
                metrics = new EventMetrics()
            };
            
            liveEvents.Add(liveEvent);
            _eventLookup[liveEvent.id] = liveEvent;
            
            OnEventStarted?.Invoke(liveEvent);
            SaveLiveOpsData();
            
            return true;
        }
        
        private void UpdateEventAnalytics(string eventId, string action, int score = 0)
        {
            if (!enableEventAnalytics) return;
            
            if (!_analyticsLookup.ContainsKey(eventId))
            {
                var analytics = new EventAnalytics
                {
                    eventId = eventId,
                    lastUpdated = DateTime.Now
                };
                eventAnalytics.Add(analytics);
                _analyticsLookup[eventId] = analytics;
            }
            
            var eventAnalytics = _analyticsLookup[eventId];
            
            switch (action)
            {
                case "view":
                    eventAnalytics.totalViews++;
                    break;
                case "click":
                    eventAnalytics.totalClicks++;
                    break;
                case "participation":
                    eventAnalytics.totalParticipations++;
                    break;
                case "completion":
                    eventAnalytics.totalCompletions++;
                    eventAnalytics.averageScore = (eventAnalytics.averageScore + score) / 2f;
                    break;
            }
            
            eventAnalytics.lastUpdated = DateTime.Now;
        }
        
        private void SendEventNotification(LiveEvent liveEvent, string playerId)
        {
            if (!enableEventNotifications) return;
            if (!enableInGameNotifications) return;
            
            // Check cooldown
            if (_lastNotificationTime.ContainsKey(playerId))
            {
                if (DateTime.Now - _lastNotificationTime[playerId] < TimeSpan.FromSeconds(notificationCooldown))
                {
                    return;
                }
            }
            
            _lastNotificationTime[playerId] = DateTime.Now;
            
            // Send notification
            OnEventNotification?.Invoke(liveEvent);
        }
        
        private System.Collections.IEnumerator UpdateLiveEvents()
        {
            while (true)
            {
                yield return new WaitForSeconds(eventUpdateInterval);
                
                // Check for events that should start
                foreach (var liveEvent in liveEvents)
                {
                    if (!liveEvent.isActive && DateTime.Now >= liveEvent.startTime)
                    {
                        liveEvent.isActive = true;
                        OnEventStarted?.Invoke(liveEvent);
                    }
                }
                
                // Check for events that should end
                foreach (var liveEvent in liveEvents)
                {
                    if (liveEvent.isActive && DateTime.Now >= liveEvent.endTime)
                    {
                        liveEvent.isActive = false;
                        OnEventEnded?.Invoke(liveEvent);
                    }
                }
                
                // Clean up old events
                CleanupOldEvents();
                
                SaveLiveOpsData();
            }
        }
        
        private System.Collections.IEnumerator ProcessEventRotations()
        {
            while (true)
            {
                yield return new WaitForSeconds(3600f); // Check every hour
                
                if (!enableEventRotation) continue;
                
                foreach (var rotation in eventRotations)
                {
                    if (!rotation.isActive) continue;
                    if (DateTime.Now < rotation.startTime || DateTime.Now > rotation.endTime) continue;
                    
                    ProcessEventRotation(rotation);
                }
            }
        }
        
        private void ProcessEventRotation(EventRotation rotation)
        {
            var currentTime = DateTime.Now;
            var rotationStartTime = rotation.startTime.AddHours(rotation.currentIndex * rotation.rotationSpeed);
            var rotationEndTime = rotationStartTime.AddHours(rotation.rotationSpeed);
            
            if (currentTime >= rotationEndTime)
            {
                // Move to next rotation
                rotation.currentIndex = (rotation.currentIndex + 1) % rotation.entries.Count;
                
                // Create new event from template
                var currentEntry = rotation.entries[rotation.currentIndex];
                if (currentEntry.isActive && _templateLookup.ContainsKey(currentEntry.eventId))
                {
                    var startTime = currentTime;
                    var endTime = startTime.AddHours(UnityEngine.Random.Range(currentEntry.minDuration, currentEntry.maxDuration));
                    
                    CreateEventFromTemplate(currentEntry.eventId, startTime, endTime);
                }
            }
        }
        
        private void CleanupOldEvents()
        {
            var cutoffTime = DateTime.Now.AddDays(-7);
            liveEvents.RemoveAll(e => e.endTime < cutoffTime);
            
            // Rebuild lookup
            _eventLookup.Clear();
            foreach (var liveEvent in liveEvents)
            {
                _eventLookup[liveEvent.id] = liveEvent;
            }
        }
        
        private PlayerBehavior GetPlayerBehavior(string playerId)
        {
            // This would integrate with your player data system
            return new PlayerBehavior
            {
                playerId = playerId,
                level = 1,
                purchaseCount = 0,
                lastPlayTime = DateTime.Now.AddHours(-1),
                currentStreak = 0,
                completionRate = 0.8f
            };
        }
        
        private void LoadLiveOpsData()
        {
            string path = Application.persistentDataPath + "/live_ops_data.json";
            if (System.IO.File.Exists(path))
            {
                string json = System.IO.File.ReadAllText(path);
                var saveData = JsonUtility.FromJson<LiveOpsSaveData>(json);
                
                liveEvents = saveData.liveEvents;
                eventTemplates = saveData.eventTemplates;
                eventRotations = saveData.eventRotations;
                eventAnalytics = saveData.eventAnalytics;
            }
        }
        
        public void SaveLiveOpsData()
        {
            var saveData = new LiveOpsSaveData
            {
                liveEvents = liveEvents,
                eventTemplates = eventTemplates,
                eventRotations = eventRotations,
                eventAnalytics = eventAnalytics
            };
            
            string json = JsonUtility.ToJson(saveData, true);
            System.IO.File.WriteAllText(Application.persistentDataPath + "/live_ops_data.json", json);
        }
        
        void OnDestroy()
        {
            SaveLiveOpsData();
        }
    }
    
    [System.Serializable]
    public class LiveOpsSaveData
    {
        public List<LiveEvent> liveEvents;
        public List<EventTemplate> eventTemplates;
        public List<EventRotation> eventRotations;
        public List<EventAnalytics> eventAnalytics;
    }
}