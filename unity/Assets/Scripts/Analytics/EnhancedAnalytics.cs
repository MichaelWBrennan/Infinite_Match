using System.Collections.Generic;
using UnityEngine;
using System;

namespace Evergreen.Analytics
{
    public class EnhancedAnalytics : MonoBehaviour
    {
        [Header("Analytics Settings")]
        public bool enableAnalytics = true;
        public bool enableDebugLogs = true;
        public float batchInterval = 30f; // Send events in batches every 30 seconds
        
        [Header("Providers")]
        public bool useFirebase = false; // Disabled - using local fallback
        public bool useGameAnalytics = false; // Disabled - using local fallback
        public bool useUnityAnalytics = false; // Disabled - using local fallback
        public bool useCustomAnalytics = true; // Using local analytics
        
        public static EnhancedAnalytics Instance { get; private set; }
        
        private List<AnalyticsEvent> eventQueue = new List<AnalyticsEvent>();
        private float lastBatchTime;
        
        [System.Serializable]
        public class AnalyticsEvent
        {
            public string eventName;
            public Dictionary<string, object> parameters;
            public long timestamp;
            public string sessionId;
            
            public AnalyticsEvent(string name, Dictionary<string, object> param = null)
            {
                eventName = name;
                parameters = param ?? new Dictionary<string, object>();
                timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                sessionId = GetSessionId();
            }
        }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeAnalytics();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            TrackSessionStart();
        }
        
        void Update()
        {
            if (Time.time - lastBatchTime > batchInterval)
            {
                SendBatchedEvents();
            }
        }
        
        private void InitializeAnalytics()
        {
            // Initialize analytics providers
            if (useFirebase)
            {
                InitializeFirebase();
            }
            
            if (useGameAnalytics)
            {
                InitializeGameAnalytics();
            }
            
            if (useUnityAnalytics)
            {
                InitializeUnityAnalytics();
            }
            
            if (useCustomAnalytics)
            {
                InitializeCustomAnalytics();
            }
        }
        
        private void InitializeFirebase()
        {
            // Initialize Firebase Analytics
            Debug.Log("Initializing Firebase Analytics");
        }
        
        private void InitializeGameAnalytics()
        {
            // Initialize GameAnalytics
            Debug.Log("Initializing GameAnalytics");
        }
        
        private void InitializeUnityAnalytics()
        {
            // Initialize Unity Analytics
            Debug.Log("Initializing Unity Analytics");
        }
        
        private void InitializeCustomAnalytics()
        {
            // Initialize custom analytics backend
            Debug.Log("Initializing Custom Analytics");
        }
        
        public void TrackEvent(string eventName, Dictionary<string, object> parameters = null)
        {
            if (!enableAnalytics) return;
            
            var evt = new AnalyticsEvent(eventName, parameters);
            eventQueue.Add(evt);
            
            if (enableDebugLogs)
            {
                Debug.Log($"[Analytics] {eventName}: {string.Join(", ", parameters?.Keys ?? new string[0])}");
            }
            
            // Send immediately for critical events
            if (IsCriticalEvent(eventName))
            {
                SendEvent(evt);
            }
        }
        
        private bool IsCriticalEvent(string eventName)
        {
            var criticalEvents = new[]
            {
                "session_start", "session_end", "level_complete", "level_failed",
                "purchase", "ad_show", "ad_complete", "crash", "error"
            };
            
            foreach (var critical in criticalEvents)
            {
                if (eventName.Contains(critical))
                    return true;
            }
            
            return false;
        }
        
        private void SendBatchedEvents()
        {
            if (eventQueue.Count == 0) return;
            
            var eventsToSend = new List<AnalyticsEvent>(eventQueue);
            eventQueue.Clear();
            lastBatchTime = Time.time;
            
            foreach (var evt in eventsToSend)
            {
                SendEvent(evt);
            }
        }
        
        private void SendEvent(AnalyticsEvent evt)
        {
            if (useFirebase)
            {
                SendToFirebase(evt);
            }
            
            if (useGameAnalytics)
            {
                SendToGameAnalytics(evt);
            }
            
            if (useUnityAnalytics)
            {
                SendToUnityAnalytics(evt);
            }
            
            if (useCustomAnalytics)
            {
                SendToCustomAnalytics(evt);
            }
        }
        
        private void SendToFirebase(AnalyticsEvent evt)
        {
            // Send to Firebase Analytics
            Debug.Log($"[Firebase] {evt.eventName}");
        }
        
        private void SendToGameAnalytics(AnalyticsEvent evt)
        {
            // Send to GameAnalytics
            Debug.Log($"[GameAnalytics] {evt.eventName}");
        }
        
        private void SendToUnityAnalytics(AnalyticsEvent evt)
        {
            // Send to Unity Analytics
            Debug.Log($"[UnityAnalytics] {evt.eventName}");
        }
        
        private void SendToCustomAnalytics(AnalyticsEvent evt)
        {
            // Send to custom analytics backend
            Debug.Log($"[CustomAnalytics] {evt.eventName}");
        }
        
        // Game Events
        public void TrackSessionStart()
        {
            var parameters = new Dictionary<string, object>
            {
                {"session_id", GetSessionId()},
                {"platform", Application.platform.ToString()},
                {"version", Application.version},
                {"device_model", SystemInfo.deviceModel},
                {"device_type", SystemInfo.deviceType.ToString()},
                {"operating_system", SystemInfo.operatingSystem},
                {"memory_size", SystemInfo.systemMemorySize},
                {"graphics_device", SystemInfo.graphicsDeviceName},
                {"graphics_memory", SystemInfo.graphicsMemorySize}
            };
            
            TrackEvent("session_start", parameters);
        }
        
        public void TrackSessionEnd()
        {
            var parameters = new Dictionary<string, object>
            {
                {"session_id", GetSessionId()},
                {"session_duration", Time.time}
            };
            
            TrackEvent("session_end", parameters);
        }
        
        public void TrackLevelStart(int level, string levelType = "normal")
        {
            var parameters = new Dictionary<string, object>
            {
                {"level", level},
                {"level_type", levelType},
                {"attempt", GetLevelAttempt(level)},
                {"player_level", Evergreen.Game.GameState.CurrentLevel}
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
        
        public void TrackMatchMade(int matchSize, bool isSpecial, string pieceType = "normal")
        {
            var parameters = new Dictionary<string, object>
            {
                {"match_size", matchSize},
                {"is_special", isSpecial},
                {"piece_type", pieceType}
            };
            
            TrackEvent("match_made", parameters);
        }
        
        public void TrackSpecialPieceCreated(string pieceType, int level)
        {
            var parameters = new Dictionary<string, object>
            {
                {"piece_type", pieceType},
                {"level", level}
            };
            
            TrackEvent("special_piece_created", parameters);
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
        
        public void TrackEventParticipation(string eventId, string eventType)
        {
            var parameters = new Dictionary<string, object>
            {
                {"event_id", eventId},
                {"event_type", eventType}
            };
            
            TrackEvent("event_participation", parameters);
        }
        
        public void TrackSocialAction(string action, string target = "")
        {
            var parameters = new Dictionary<string, object>
            {
                {"action", action},
                {"target", target}
            };
            
            TrackEvent("social_action", parameters);
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
        
        void OnApplicationPause(bool pauseStatus)
        {
            if (pauseStatus)
            {
                TrackSessionEnd();
            }
            else
            {
                TrackSessionStart();
            }
        }
        
        void OnApplicationFocus(bool hasFocus)
        {
            if (!hasFocus)
            {
                SendBatchedEvents();
            }
        }
        
        void OnDestroy()
        {
            TrackSessionEnd();
            SendBatchedEvents();
        }
    }
}