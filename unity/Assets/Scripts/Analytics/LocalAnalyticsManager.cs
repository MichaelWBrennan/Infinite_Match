using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using System.Linq;

namespace Evergreen.Analytics
{
    /// <summary>
    /// Local analytics manager that stores analytics data locally instead of using Unity Analytics
    /// </summary>
    public class LocalAnalyticsManager : MonoBehaviour
    {
        [Header("Local Analytics Settings")]
        [SerializeField] private bool enableLocalAnalytics = true;
        [SerializeField] private bool enableDebugLogs = true;
        [SerializeField] private float saveInterval = 30f; // Save data every 30 seconds
        [SerializeField] private int maxEventsInMemory = 1000; // Maximum events to keep in memory
        
        [Header("Data Storage")]
        [SerializeField] private string analyticsDataPath = "AnalyticsData";
        [SerializeField] private string sessionDataPath = "SessionData";
        
        public static LocalAnalyticsManager Instance { get; private set; }
        
        private List<AnalyticsEvent> _eventQueue = new List<AnalyticsEvent>();
        private Dictionary<string, object> _sessionData = new Dictionary<string, object>();
        private float _lastSaveTime;
        private string _currentSessionId;
        private DateTime _sessionStartTime;
        
        [System.Serializable]
        public class AnalyticsEvent
        {
            public string eventName;
            public Dictionary<string, object> parameters;
            public long timestamp;
            public string sessionId;
            public string platform;
            public string version;
            
            public AnalyticsEvent(string name, Dictionary<string, object> param = null)
            {
                eventName = name;
                parameters = param ?? new Dictionary<string, object>();
                timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                sessionId = GetSessionId();
                platform = Application.platform.ToString();
                version = Application.version;
            }
            
            private string GetSessionId()
            {
                var sessionId = PlayerPrefs.GetString("SessionId", "");
                if (string.IsNullOrEmpty(sessionId))
                {
                    sessionId = System.Guid.NewGuid().ToString();
                    PlayerPrefs.SetString("SessionId", sessionId);
                }
                return sessionId;
            }
        }
        
        [System.Serializable]
        public class AnalyticsData
        {
            public string version = "1.0.0";
            public DateTime lastUpdated;
            public List<AnalyticsEvent> events = new List<AnalyticsEvent>();
            public Dictionary<string, object> sessionData = new Dictionary<string, object>();
        }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeLocalAnalytics();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            StartNewSession();
        }
        
        void Update()
        {
            if (Time.time - _lastSaveTime > saveInterval)
            {
                SaveAnalyticsData();
            }
        }
        
        private void InitializeLocalAnalytics()
        {
            if (!enableLocalAnalytics) return;
            
            // Create analytics data directory
            string dataPath = Path.Combine(Application.persistentDataPath, analyticsDataPath);
            if (!Directory.Exists(dataPath))
            {
                Directory.CreateDirectory(dataPath);
            }
            
            if (enableDebugLogs)
                Debug.Log("Local Analytics Manager initialized");
        }
        
        private void StartNewSession()
        {
            _currentSessionId = System.Guid.NewGuid().ToString();
            _sessionStartTime = DateTime.Now;
            
            _sessionData.Clear();
            _sessionData["session_id"] = _currentSessionId;
            _sessionData["session_start"] = _sessionStartTime.ToString("yyyy-MM-dd HH:mm:ss");
            _sessionData["platform"] = Application.platform.ToString();
            _sessionData["version"] = Application.version;
            _sessionData["device_model"] = SystemInfo.deviceModel;
            _sessionData["device_type"] = SystemInfo.deviceType.ToString();
            _sessionData["operating_system"] = SystemInfo.operatingSystem;
            _sessionData["memory_size"] = SystemInfo.systemMemorySize;
            _sessionData["graphics_device"] = SystemInfo.graphicsDeviceName;
            _sessionData["graphics_memory"] = SystemInfo.graphicsMemorySize;
            
            TrackEvent("session_start", _sessionData);
            
            if (enableDebugLogs)
                Debug.Log($"New analytics session started: {_currentSessionId}");
        }
        
        public void TrackEvent(string eventName, Dictionary<string, object> parameters = null)
        {
            if (!enableLocalAnalytics) return;
            
            var evt = new AnalyticsEvent(eventName, parameters);
            _eventQueue.Add(evt);
            
            // Limit memory usage
            if (_eventQueue.Count > maxEventsInMemory)
            {
                _eventQueue.RemoveAt(0);
            }
            
            if (enableDebugLogs)
            {
                Debug.Log($"[LocalAnalytics] {eventName}: {string.Join(", ", parameters?.Keys ?? new string[0])}");
            }
        }
        
        public void TrackLevelStart(int level, string levelType = "normal")
        {
            var parameters = new Dictionary<string, object>
            {
                {"level", level},
                {"level_type", levelType},
                {"attempt", GetLevelAttempt(level)},
                {"player_level", GetPlayerLevel()}
            };
            
            TrackEvent("level_start", parameters);
        }
        
        public void TrackLevelComplete(int level, int score, int stars, int moves, float time)
        {
            var parameters = new Dictionary<string, object>
            {
                {"level", level},
                {"score", score},
                {"stars", stars},
                {"moves", moves},
                {"time", time},
                {"attempt", GetLevelAttempt(level)},
                {"is_first_completion", IsFirstCompletion(level)}
            };
            
            TrackEvent("level_complete", parameters);
        }
        
        public void TrackLevelFailed(int level, int score, int moves, float time, string reason = "moves_exhausted")
        {
            var parameters = new Dictionary<string, object>
            {
                {"level", level},
                {"score", score},
                {"moves", moves},
                {"time", time},
                {"reason", reason},
                {"attempt", GetLevelAttempt(level)}
            };
            
            TrackEvent("level_failed", parameters);
        }
        
        public void TrackPurchase(string productId, string currency, float price, string transactionId)
        {
            var parameters = new Dictionary<string, object>
            {
                {"product_id", productId},
                {"currency", currency},
                {"price", price},
                {"transaction_id", transactionId},
                {"revenue", price}
            };
            
            TrackEvent("purchase", parameters);
        }
        
        public void TrackAdShow(string adType, string placement)
        {
            var parameters = new Dictionary<string, object>
            {
                {"ad_type", adType},
                {"placement", placement}
            };
            
            TrackEvent("ad_show", parameters);
        }
        
        public void TrackAdComplete(string adType, string placement, bool completed)
        {
            var parameters = new Dictionary<string, object>
            {
                {"ad_type", adType},
                {"placement", placement},
                {"completed", completed}
            };
            
            TrackEvent("ad_complete", parameters);
        }
        
        public void TrackAchievementUnlocked(string achievementId, string achievementType, string rarity)
        {
            var parameters = new Dictionary<string, object>
            {
                {"achievement_id", achievementId},
                {"achievement_type", achievementType},
                {"rarity", rarity}
            };
            
            TrackEvent("achievement_unlocked", parameters);
        }
        
        public void TrackError(string errorType, string errorMessage, string stackTrace = "")
        {
            var parameters = new Dictionary<string, object>
            {
                {"error_type", errorType},
                {"error_message", errorMessage},
                {"stack_trace", stackTrace}
            };
            
            TrackEvent("error", parameters);
        }
        
        public void TrackCustomEvent(string eventName, Dictionary<string, object> parameters = null)
        {
            TrackEvent(eventName, parameters);
        }
        
        private int GetLevelAttempt(int level)
        {
            var key = $"level_attempt_{level}";
            var attempts = PlayerPrefs.GetInt(key, 0) + 1;
            PlayerPrefs.SetInt(key, attempts);
            return attempts;
        }
        
        private bool IsFirstCompletion(int level)
        {
            var key = $"level_completed_{level}";
            var completed = PlayerPrefs.GetInt(key, 0) == 1;
            if (!completed)
            {
                PlayerPrefs.SetInt(key, 1);
            }
            return !completed;
        }
        
        private int GetPlayerLevel()
        {
            return PlayerPrefs.GetInt("PlayerLevel", 1);
        }
        
        public void SaveAnalyticsData()
        {
            if (!enableLocalAnalytics) return;
            
            try
            {
                var analyticsData = new AnalyticsData
                {
                    lastUpdated = DateTime.Now,
                    events = new List<AnalyticsEvent>(_eventQueue),
                    sessionData = new Dictionary<string, object>(_sessionData)
                };
                
                string dataPath = Path.Combine(Application.persistentDataPath, analyticsDataPath);
                string filePath = Path.Combine(dataPath, $"analytics_{DateTime.Now:yyyyMMdd_HHmmss}.json");
                
                string json = JsonUtility.ToJson(analyticsData, true);
                File.WriteAllText(filePath, json);
                
                _lastSaveTime = Time.time;
                
                if (enableDebugLogs)
                    Debug.Log($"Analytics data saved to: {filePath}");
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to save analytics data: {e.Message}");
            }
        }
        
        public void LoadAnalyticsData()
        {
            if (!enableLocalAnalytics) return;
            
            try
            {
                string dataPath = Path.Combine(Application.persistentDataPath, analyticsDataPath);
                if (!Directory.Exists(dataPath)) return;
                
                var files = Directory.GetFiles(dataPath, "analytics_*.json");
                if (files.Length == 0) return;
                
                // Load the most recent file
                var latestFile = files.OrderByDescending(f => File.GetCreationTime(f)).First();
                string json = File.ReadAllText(latestFile);
                
                var analyticsData = JsonUtility.FromJson<AnalyticsData>(json);
                
                if (enableDebugLogs)
                    Debug.Log($"Loaded analytics data from: {latestFile}");
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to load analytics data: {e.Message}");
            }
        }
        
        public Dictionary<string, object> GetAnalyticsSummary()
        {
            var summary = new Dictionary<string, object>
            {
                {"total_events", _eventQueue.Count},
                {"session_id", _currentSessionId},
                {"session_duration", (DateTime.Now - _sessionStartTime).TotalSeconds},
                {"platform", Application.platform.ToString()},
                {"version", Application.version},
                {"last_save", _lastSaveTime}
            };
            
            return summary;
        }
        
        void OnApplicationPause(bool pauseStatus)
        {
            if (pauseStatus)
            {
                TrackEvent("session_pause");
                SaveAnalyticsData();
            }
            else
            {
                TrackEvent("session_resume");
            }
        }
        
        void OnApplicationFocus(bool hasFocus)
        {
            if (!hasFocus)
            {
                SaveAnalyticsData();
            }
        }
        
        void OnDestroy()
        {
            TrackEvent("session_end");
            SaveAnalyticsData();
        }
    }
}