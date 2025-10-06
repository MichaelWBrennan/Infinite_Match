using UnityEngine;
using System.Collections.Generic;
using System;
using System.Collections;
using Evergreen.Core;

namespace Evergreen.Analytics
{
    [System.Serializable]
    public class AnalyticsEvent
    {
        public string eventId;
        public string eventName;
        public string category;
        public Dictionary<string, object> parameters = new Dictionary<string, object>();
        public DateTime timestamp;
        public string playerId;
        public string sessionId;
        public string version;
        public string platform;
        public string region;
        public int level;
        public float sessionTime;
        public Dictionary<string, object> customData = new Dictionary<string, object>();
    }

    [System.Serializable]
    public class PlayerProfile
    {
        public string playerId;
        public DateTime firstSeen;
        public DateTime lastSeen;
        public int totalSessions;
        public float totalPlayTime;
        public int currentLevel;
        public int totalLevelsCompleted;
        public float completionRate;
        public int totalPurchases;
        public float totalSpent;
        public int currentStreak;
        public int bestStreak;
        public Dictionary<string, int> currencyBalances = new Dictionary<string, int>();
        public Dictionary<string, int> featureUsage = new Dictionary<string, int>();
        public Dictionary<string, float> performanceMetrics = new Dictionary<string, float>();
        public List<string> achievements = new List<string>();
        public string playerSegment;
        public string region;
        public string language;
        public DateTime lastUpdated;
    }

    [System.Serializable]
    public class SessionData
    {
        public string sessionId;
        public string playerId;
        public DateTime startTime;
        public DateTime endTime;
        public float duration;
        public int levelsPlayed;
        public int levelsCompleted;
        public int levelsFailed;
        public int totalScore;
        public int totalMoves;
        public int totalMatches;
        public int totalCombos;
        public int totalSpecialPieces;
        public int totalCoinsEarned;
        public int totalGemsEarned;
        public int totalEnergyUsed;
        public int totalPurchases;
        public float totalSpent;
        public List<string> featuresUsed = new List<string>();
        public Dictionary<string, int> eventCounts = new Dictionary<string, int>();
        public string sessionEndReason; // "normal", "crash", "force_close", "background"
        public bool isRetentionSession;
        public int daysSinceLastSession;
    }

    [System.Serializable]
    public class RetentionData
    {
        public string playerId;
        public DateTime firstSession;
        public bool day1Retention;
        public bool day3Retention;
        public bool day7Retention;
        public bool day14Retention;
        public bool day30Retention;
        public int totalSessions;
        public float averageSessionLength;
        public int totalPlayTime;
        public DateTime lastSession;
        public int daysSinceLastSession;
        public bool isActive;
        public string churnReason;
        public DateTime churnDate;
    }

    [System.Serializable]
    public class MonetizationData
    {
        public string playerId;
        public int totalPurchases;
        public float totalRevenue;
        public float averagePurchaseValue;
        public int firstPurchaseDay;
        public int lastPurchaseDay;
        public float lifetimeValue;
        public float averageRevenuePerUser;
        public float averageRevenuePerPayingUser;
        public Dictionary<string, int> purchaseCounts = new Dictionary<string, int>();
        public Dictionary<string, float> purchaseRevenue = new Dictionary<string, float>();
        public List<string> purchaseHistory = new List<string>();
        public float conversionRate;
        public int daysToFirstPurchase;
        public bool isPayingUser;
        public string preferredCurrency;
        public float averagePurchaseFrequency;
    }

    [System.Serializable]
    public class PerformanceData
    {
        public string playerId;
        public string sessionId;
        public DateTime timestamp;
        public float frameRate;
        public float memoryUsage;
        public float cpuUsage;
        public float gpuUsage;
        public int drawCalls;
        public int triangles;
        public float loadTime;
        public int crashes;
        public int errors;
        public Dictionary<string, float> customMetrics = new Dictionary<string, float>();
    }

    [System.Serializable]
    public class ABTestData
    {
        public string testId;
        public string testName;
        public string playerId;
        public string variant;
        public DateTime startTime;
        public DateTime endTime;
        public bool isActive;
        public Dictionary<string, object> testParameters = new Dictionary<string, object>();
        public Dictionary<string, float> testResults = new Dictionary<string, float>();
        public float conversionRate;
        public float revenue;
        public int participants;
        public int conversions;
        public float confidence;
        public bool isSignificant;
    }

    public class AdvancedAnalyticsSystem : MonoBehaviour
    {
        [Header("Analytics Settings")]
        public bool enableAnalytics = true;
        public bool enablePerformanceTracking = true;
        public bool enableRetentionTracking = true;
        public bool enableMonetizationTracking = true;
        public bool enableABTesting = true;
        public bool enableRealTimeAnalytics = true;
        
        [Header("Data Collection")]
        public float dataFlushInterval = 300f; // 5 minutes
        public int maxEventsPerBatch = 1000;
        public bool enableDataCompression = true;
        public bool enableDataEncryption = false;
        
        [Header("Privacy Settings")]
        public bool enableDataAnonymization = true;
        public bool enableConsentTracking = true;
        public bool enableDataRetention = true;
        public int dataRetentionDays = 365;
        
        private List<AnalyticsEvent> _eventQueue = new List<AnalyticsEvent>();
        private Dictionary<string, PlayerProfile> _playerProfiles = new Dictionary<string, PlayerProfile>();
        private Dictionary<string, SessionData> _activeSessions = new Dictionary<string, SessionData>();
        private Dictionary<string, RetentionData> _retentionData = new Dictionary<string, RetentionData>();
        private Dictionary<string, MonetizationData> _monetizationData = new Dictionary<string, MonetizationData>();
        private Dictionary<string, ABTestData> _abTestData = new Dictionary<string, ABTestData>();
        private Dictionary<string, List<PerformanceData>> _performanceData = new Dictionary<string, List<PerformanceData>>();
        
        private string _currentSessionId;
        private DateTime _sessionStartTime;
        private bool _isSessionActive = false;
        
        // Events
        public System.Action<AnalyticsEvent> OnEventTracked;
        public System.Action<PlayerProfile> OnPlayerProfileUpdated;
        public System.Action<SessionData> OnSessionEnded;
        public System.Action<RetentionData> OnRetentionCalculated;
        public System.Action<MonetizationData> OnMonetizationUpdated;
        
        public static AdvancedAnalyticsSystem Instance { get; private set; }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeAnalyticsSystem();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            LoadAnalyticsData();
            StartSession();
            StartCoroutine(FlushAnalyticsData());
            StartCoroutine(UpdatePerformanceMetrics());
        }
        
        private void InitializeAnalyticsSystem()
        {
            if (!enableAnalytics) return;
            
            Debug.Log("Advanced Analytics System initialized");
        }
        
        public void TrackEvent(string eventName, string category = "general", Dictionary<string, object> parameters = null)
        {
            if (!enableAnalytics) return;
            
            var analyticsEvent = new AnalyticsEvent
            {
                eventId = Guid.NewGuid().ToString(),
                eventName = eventName,
                category = category,
                parameters = parameters ?? new Dictionary<string, object>(),
                timestamp = DateTime.Now,
                playerId = GetCurrentPlayerId(),
                sessionId = _currentSessionId,
                version = Application.version,
                platform = Application.platform.ToString(),
                region = GetPlayerRegion(),
                level = GetCurrentLevel(),
                sessionTime = GetSessionTime(),
                customData = new Dictionary<string, object>()
            };
            
            _eventQueue.Add(analyticsEvent);
            
            // Update player profile
            UpdatePlayerProfile(analyticsEvent);
            
            // Update session data
            UpdateSessionData(analyticsEvent);
            
            OnEventTracked?.Invoke(analyticsEvent);
            
            // Flush if queue is full
            if (_eventQueue.Count >= maxEventsPerBatch)
            {
                StartCoroutine(FlushAnalyticsData());
            }
        }
        
        public void TrackPurchase(string productId, float price, string currency, string transactionId = "")
        {
            var parameters = new Dictionary<string, object>
            {
                {"product_id", productId},
                {"price", price},
                {"currency", currency},
                {"transaction_id", transactionId}
            };
            
            TrackEvent("purchase", "monetization", parameters);
            
            // Update monetization data
            UpdateMonetizationData(productId, price, currency);
        }
        
        public void TrackLevelStart(int levelId, int levelNumber)
        {
            var parameters = new Dictionary<string, object>
            {
                {"level_id", levelId},
                {"level_number", levelNumber}
            };
            
            TrackEvent("level_start", "gameplay", parameters);
        }
        
        public void TrackLevelComplete(int levelId, int levelNumber, int score, int moves, float time)
        {
            var parameters = new Dictionary<string, object>
            {
                {"level_id", levelId},
                {"level_number", levelNumber},
                {"score", score},
                {"moves", moves},
                {"time", time}
            };
            
            TrackEvent("level_complete", "gameplay", parameters);
        }
        
        public void TrackLevelFail(int levelId, int levelNumber, int score, int moves, float time, string failReason = "")
        {
            var parameters = new Dictionary<string, object>
            {
                {"level_id", levelId},
                {"level_number", levelNumber},
                {"score", score},
                {"moves", moves},
                {"time", time},
                {"fail_reason", failReason}
            };
            
            TrackEvent("level_fail", "gameplay", parameters);
        }
        
        public void TrackFeatureUsage(string featureName, Dictionary<string, object> parameters = null)
        {
            var eventParameters = new Dictionary<string, object>
            {
                {"feature_name", featureName}
            };
            
            if (parameters != null)
            {
                foreach (var kvp in parameters)
                {
                    eventParameters[kvp.Key] = kvp.Value;
                }
            }
            
            TrackEvent("feature_usage", "engagement", eventParameters);
        }
        
        public void TrackError(string errorType, string errorMessage, string stackTrace = "")
        {
            var parameters = new Dictionary<string, object>
            {
                {"error_type", errorType},
                {"error_message", errorMessage},
                {"stack_trace", stackTrace}
            };
            
            TrackEvent("error", "technical", parameters);
        }
        
        public void TrackPerformance(string metricName, float value, Dictionary<string, object> parameters = null)
        {
            if (!enablePerformanceTracking) return;
            
            var performanceData = new PerformanceData
            {
                playerId = GetCurrentPlayerId(),
                sessionId = _currentSessionId,
                timestamp = DateTime.Now,
                customMetrics = new Dictionary<string, float> { { metricName, value } }
            };
            
            if (parameters != null)
            {
                foreach (var kvp in parameters)
                {
                    performanceData.customMetrics[kvp.Key] = Convert.ToSingle(kvp.Value);
                }
            }
            
            if (!_performanceData.ContainsKey(_currentSessionId))
            {
                _performanceData[_currentSessionId] = new List<PerformanceData>();
            }
            _performanceData[_currentSessionId].Add(performanceData);
        }
        
        public void StartABTest(string testId, string testName, string variant, Dictionary<string, object> parameters = null)
        {
            if (!enableABTesting) return;
            
            var abTestData = new ABTestData
            {
                testId = testId,
                testName = testName,
                playerId = GetCurrentPlayerId(),
                variant = variant,
                startTime = DateTime.Now,
                isActive = true,
                testParameters = parameters ?? new Dictionary<string, object>()
            };
            
            _abTestData[testId + "_" + GetCurrentPlayerId()] = abTestData;
            
            var eventParameters = new Dictionary<string, object>
            {
                {"test_id", testId},
                {"test_name", testName},
                {"variant", variant}
            };
            
            if (parameters != null)
            {
                foreach (var kvp in parameters)
                {
                    eventParameters[kvp.Key] = kvp.Value;
                }
            }
            
            TrackEvent("ab_test_start", "experimentation", eventParameters);
        }
        
        public void EndABTest(string testId, Dictionary<string, float> results = null)
        {
            if (!enableABTesting) return;
            
            string key = testId + "_" + GetCurrentPlayerId();
            if (!_abTestData.ContainsKey(key)) return;
            
            var abTestData = _abTestData[key];
            abTestData.endTime = DateTime.Now;
            abTestData.isActive = false;
            
            if (results != null)
            {
                abTestData.testResults = results;
            }
            
            var eventParameters = new Dictionary<string, object>
            {
                {"test_id", testId},
                {"duration", (abTestData.endTime - abTestData.startTime).TotalSeconds}
            };
            
            TrackEvent("ab_test_end", "experimentation", eventParameters);
        }
        
        private void StartSession()
        {
            _currentSessionId = Guid.NewGuid().ToString();
            _sessionStartTime = DateTime.Now;
            _isSessionActive = true;
            
            var sessionData = new SessionData
            {
                sessionId = _currentSessionId,
                playerId = GetCurrentPlayerId(),
                startTime = _sessionStartTime,
                isRetentionSession = IsRetentionSession()
            };
            
            _activeSessions[_currentSessionId] = sessionData;
            
            TrackEvent("session_start", "session");
        }
        
        public void EndSession(string reason = "normal")
        {
            if (!_isSessionActive) return;
            
            var sessionData = _activeSessions[_currentSessionId];
            sessionData.endTime = DateTime.Now;
            sessionData.duration = (float)(sessionData.endTime - sessionData.startTime).TotalSeconds;
            sessionData.sessionEndReason = reason;
            
            _isSessionActive = false;
            
            TrackEvent("session_end", "session", new Dictionary<string, object>
            {
                {"duration", sessionData.duration},
                {"reason", reason}
            });
            
            OnSessionEnded?.Invoke(sessionData);
        }
        
        private void UpdatePlayerProfile(AnalyticsEvent analyticsEvent)
        {
            string playerId = analyticsEvent.playerId;
            
            if (!_playerProfiles.ContainsKey(playerId))
            {
                _playerProfiles[playerId] = new PlayerProfile
                {
                    playerId = playerId,
                    firstSeen = analyticsEvent.timestamp,
                    lastSeen = analyticsEvent.timestamp,
                    totalSessions = 0,
                    totalPlayTime = 0f,
                    currentLevel = 1,
                    totalLevelsCompleted = 0,
                    completionRate = 0f,
                    totalPurchases = 0,
                    totalSpent = 0f,
                    currentStreak = 0,
                    bestStreak = 0,
                    currencyBalances = new Dictionary<string, int>(),
                    featureUsage = new Dictionary<string, int>(),
                    performanceMetrics = new Dictionary<string, float>(),
                    achievements = new List<string>(),
                    playerSegment = "new",
                    region = analyticsEvent.region,
                    language = "en",
                    lastUpdated = analyticsEvent.timestamp
                };
            }
            
            var profile = _playerProfiles[playerId];
            profile.lastSeen = analyticsEvent.timestamp;
            profile.currentLevel = analyticsEvent.level;
            profile.totalPlayTime += analyticsEvent.sessionTime;
            profile.region = analyticsEvent.region;
            profile.lastUpdated = analyticsEvent.timestamp;
            
            // Update feature usage
            if (analyticsEvent.category == "engagement")
            {
                string featureName = analyticsEvent.parameters.ContainsKey("feature_name") ? 
                    analyticsEvent.parameters["feature_name"].ToString() : "unknown";
                
                if (!profile.featureUsage.ContainsKey(featureName))
                {
                    profile.featureUsage[featureName] = 0;
                }
                profile.featureUsage[featureName]++;
            }
            
            // Update level completion
            if (analyticsEvent.eventName == "level_complete")
            {
                profile.totalLevelsCompleted++;
                profile.completionRate = (float)profile.totalLevelsCompleted / profile.currentLevel;
            }
            
            OnPlayerProfileUpdated?.Invoke(profile);
        }
        
        private void UpdateSessionData(AnalyticsEvent analyticsEvent)
        {
            if (!_activeSessions.ContainsKey(_currentSessionId)) return;
            
            var sessionData = _activeSessions[_currentSessionId];
            
            // Update event counts
            if (!sessionData.eventCounts.ContainsKey(analyticsEvent.eventName))
            {
                sessionData.eventCounts[analyticsEvent.eventName] = 0;
            }
            sessionData.eventCounts[analyticsEvent.eventName]++;
            
            // Update gameplay metrics
            if (analyticsEvent.eventName == "level_start")
            {
                sessionData.levelsPlayed++;
            }
            else if (analyticsEvent.eventName == "level_complete")
            {
                sessionData.levelsCompleted++;
                if (analyticsEvent.parameters.ContainsKey("score"))
                {
                    sessionData.totalScore += Convert.ToInt32(analyticsEvent.parameters["score"]);
                }
                if (analyticsEvent.parameters.ContainsKey("moves"))
                {
                    sessionData.totalMoves += Convert.ToInt32(analyticsEvent.parameters["moves"]);
                }
            }
            else if (analyticsEvent.eventName == "level_fail")
            {
                sessionData.levelsFailed++;
            }
            else if (analyticsEvent.eventName == "purchase")
            {
                sessionData.totalPurchases++;
                if (analyticsEvent.parameters.ContainsKey("price"))
                {
                    sessionData.totalSpent += Convert.ToSingle(analyticsEvent.parameters["price"]);
                }
            }
        }
        
        private void UpdateMonetizationData(string productId, float price, string currency)
        {
            string playerId = GetCurrentPlayerId();
            
            if (!_monetizationData.ContainsKey(playerId))
            {
                _monetizationData[playerId] = new MonetizationData
                {
                    playerId = playerId,
                    totalPurchases = 0,
                    totalRevenue = 0f,
                    averagePurchaseValue = 0f,
                    firstPurchaseDay = 0,
                    lastPurchaseDay = 0,
                    lifetimeValue = 0f,
                    averageRevenuePerUser = 0f,
                    averageRevenuePerPayingUser = 0f,
                    purchaseCounts = new Dictionary<string, int>(),
                    purchaseRevenue = new Dictionary<string, float>(),
                    purchaseHistory = new List<string>(),
                    conversionRate = 0f,
                    daysToFirstPurchase = 0,
                    isPayingUser = false,
                    preferredCurrency = currency,
                    averagePurchaseFrequency = 0f
                };
            }
            
            var monetizationData = _monetizationData[playerId];
            monetizationData.totalPurchases++;
            monetizationData.totalRevenue += price;
            monetizationData.averagePurchaseValue = monetizationData.totalRevenue / monetizationData.totalPurchases;
            monetizationData.lifetimeValue = monetizationData.totalRevenue;
            monetizationData.isPayingUser = true;
            monetizationData.preferredCurrency = currency;
            
            if (!monetizationData.purchaseCounts.ContainsKey(productId))
            {
                monetizationData.purchaseCounts[productId] = 0;
            }
            monetizationData.purchaseCounts[productId]++;
            
            if (!monetizationData.purchaseRevenue.ContainsKey(productId))
            {
                monetizationData.purchaseRevenue[productId] = 0f;
            }
            monetizationData.purchaseRevenue[productId] += price;
            
            monetizationData.purchaseHistory.Add(productId);
            
            OnMonetizationUpdated?.Invoke(monetizationData);
        }
        
        private bool IsRetentionSession()
        {
            string playerId = GetCurrentPlayerId();
            
            if (!_retentionData.ContainsKey(playerId))
            {
                _retentionData[playerId] = new RetentionData
                {
                    playerId = playerId,
                    firstSession = DateTime.Now,
                    day1Retention = false,
                    day3Retention = false,
                    day7Retention = false,
                    day14Retention = false,
                    day30Retention = false,
                    totalSessions = 0,
                    averageSessionLength = 0f,
                    totalPlayTime = 0,
                    lastSession = DateTime.Now,
                    daysSinceLastSession = 0,
                    isActive = true,
                    churnReason = "",
                    churnDate = DateTime.MinValue
                };
            }
            
            var retentionData = _retentionData[playerId];
            retentionData.totalSessions++;
            retentionData.lastSession = DateTime.Now;
            retentionData.daysSinceLastSession = 0;
            retentionData.isActive = true;
            
            // Calculate retention
            var daysSinceFirstSession = (DateTime.Now - retentionData.firstSession).Days;
            if (daysSinceFirstSession >= 1) retentionData.day1Retention = true;
            if (daysSinceFirstSession >= 3) retentionData.day3Retention = true;
            if (daysSinceFirstSession >= 7) retentionData.day7Retention = true;
            if (daysSinceFirstSession >= 14) retentionData.day14Retention = true;
            if (daysSinceFirstSession >= 30) retentionData.day30Retention = true;
            
            OnRetentionCalculated?.Invoke(retentionData);
            
            return retentionData.totalSessions > 1;
        }
        
        private System.Collections.IEnumerator FlushAnalyticsData()
        {
            while (true)
            {
                yield return new WaitForSeconds(dataFlushInterval);
                
                if (_eventQueue.Count > 0)
                {
                    FlushEventQueue();
                }
            }
        }
        
        private System.Collections.IEnumerator UpdatePerformanceMetrics()
        {
            while (true)
            {
                yield return new WaitForSeconds(1f);
                
                if (enablePerformanceTracking)
                {
                    TrackPerformance("frame_rate", 1f / Time.deltaTime);
                    TrackPerformance("memory_usage", GC.GetTotalMemory(false) / 1024f / 1024f);
                }
            }
        }
        
        private void FlushEventQueue()
        {
            if (_eventQueue.Count == 0) return;
            
            var eventsToFlush = new List<AnalyticsEvent>(_eventQueue);
            _eventQueue.Clear();
            
            // Send to analytics service
            SendEventsToAnalyticsService(eventsToFlush);
        }
        
        private void SendEventsToAnalyticsService(List<AnalyticsEvent> events)
        {
            // This would integrate with your analytics service (Firebase, GameAnalytics, etc.)
            Debug.Log($"Sending {events.Count} events to analytics service");
        }
        
        private string GetCurrentPlayerId()
        {
            // This would integrate with your player identification system
            return "player_" + SystemInfo.deviceUniqueIdentifier;
        }
        
        private string GetPlayerRegion()
        {
            // This would integrate with your region detection system
            return "US";
        }
        
        private int GetCurrentLevel()
        {
            // This would integrate with your level system
            return 1;
        }
        
        private float GetSessionTime()
        {
            return _isSessionActive ? (float)(DateTime.Now - _sessionStartTime).TotalSeconds : 0f;
        }
        
        private void LoadAnalyticsData()
        {
            string path = Application.persistentDataPath + "/analytics_data.json";
            if (System.IO.File.Exists(path))
            {
                string json = System.IO.File.ReadAllText(path);
                var saveData = JsonUtility.FromJson<AnalyticsSaveData>(json);
                
                _playerProfiles = saveData.playerProfiles;
                _retentionData = saveData.retentionData;
                _monetizationData = saveData.monetizationData;
                _abTestData = saveData.abTestData;
            }
        }
        
        public void SaveAnalyticsData()
        {
            var saveData = new AnalyticsSaveData
            {
                playerProfiles = _playerProfiles,
                retentionData = _retentionData,
                monetizationData = _monetizationData,
                abTestData = _abTestData
            };
            
            string json = JsonUtility.ToJson(saveData, true);
            System.IO.File.WriteAllText(Application.persistentDataPath + "/analytics_data.json", json);
        }
        
        void OnDestroy()
        {
            EndSession("app_close");
            SaveAnalyticsData();
        }
        
        void OnApplicationPause(bool pauseStatus)
        {
            if (pauseStatus)
            {
                EndSession("app_pause");
            }
            else
            {
                StartSession();
            }
        }
        
        void OnApplicationFocus(bool hasFocus)
        {
            if (!hasFocus)
            {
                EndSession("app_focus_lost");
            }
            else
            {
                StartSession();
            }
        }
    }
    
    [System.Serializable]
    public class AnalyticsSaveData
    {
        public Dictionary<string, PlayerProfile> playerProfiles;
        public Dictionary<string, RetentionData> retentionData;
        public Dictionary<string, MonetizationData> monetizationData;
        public Dictionary<string, ABTestData> abTestData;
    }
}