using System.Collections.Generic;
using UnityEngine;
using Evergreen.Core;

namespace Evergreen.Game
{
    /// <summary>
    /// Advanced analytics adapter with Firebase/GA integration and performance tracking
    /// </summary>
    public class AnalyticsAdapter : MonoBehaviour
    {
        public static AnalyticsAdapter Instance { get; private set; }

        [Header("Analytics Settings")]
        public bool enableAnalytics = true;
        public bool enableFirebase = true;
        public bool enableGoogleAnalytics = true;
        public bool enablePerformanceTracking = true;
        public bool enableCrashReporting = true;
        public bool enableUserProperties = true;

        [Header("Event Settings")]
        public bool enableEventBatching = true;
        public int batchSize = 10;
        public float batchInterval = 30f;
        public bool enableEventCaching = true;
        public int maxCachedEvents = 100;

        [Header("Performance Settings")]
        public bool enableFPS = true;
        public bool enableMemory = true;
        public bool enableBattery = true;
        public bool enableThermal = true;
        public float performanceInterval = 10f;

        // Event batching
        private readonly Queue<AnalyticsEvent> _eventQueue = new Queue<AnalyticsEvent>();
        private readonly List<AnalyticsEvent> _cachedEvents = new List<AnalyticsEvent>();
        private float _lastBatchTime = 0f;
        private bool _isBatching = false;

        // Performance tracking
        private float _lastPerformanceTime = 0f;
        private readonly Dictionary<string, float> _performanceMetrics = new Dictionary<string, float>();

        // User properties
        private readonly Dictionary<string, object> _userProperties = new Dictionary<string, object>();

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

        void Update()
        {
            if (enableEventBatching)
            {
                ProcessEventBatching();
            }

            if (enablePerformanceTracking)
            {
                TrackPerformance();
            }
        }

        private void InitializeAnalytics()
        {
            if (!enableAnalytics) return;

            // Initialize Firebase Analytics
            if (enableFirebase)
            {
                InitializeFirebase();
            }

            // Initialize Google Analytics
            if (enableGoogleAnalytics)
            {
                InitializeGoogleAnalytics();
            }

            // Initialize crash reporting
            if (enableCrashReporting)
            {
                InitializeCrashReporting();
            }

            Logger.Info("Analytics Adapter initialized", "AnalyticsAdapter");
        }

        private void InitializeFirebase()
        {
            // Firebase Analytics initialization
            // In a real implementation, you would use Firebase SDK:
            // Firebase.FirebaseApp.CheckAndFixDependenciesAsync().ContinueWith(task => {
            //     var dependencyStatus = task.Result;
            //     if (dependencyStatus == Firebase.DependencyStatus.Available) {
            //         Firebase.Analytics.FirebaseAnalytics.SetAnalyticsCollectionEnabled(true);
            //     }
            // });

            Logger.Info("Firebase Analytics initialized", "AnalyticsAdapter");
        }

        private void InitializeGoogleAnalytics()
        {
            // Google Analytics initialization
            // In a real implementation, you would use GA SDK:
            // GoogleAnalyticsSDK.GA.StartSession();
            // GoogleAnalyticsSDK.GA.SetCustomDimension(1, "game_version", Application.version);

            Logger.Info("Google Analytics initialized", "AnalyticsAdapter");
        }

        private void InitializeCrashReporting()
        {
            // Crash reporting initialization
            // In a real implementation, you would use Firebase Crashlytics:
            // Firebase.Crashlytics.Crashlytics.SetCrashlyticsCollectionEnabled(true);

            Logger.Info("Crash reporting initialized", "AnalyticsAdapter");
        }

        /// <summary>
        /// Track custom event
        /// </summary>
        public static void CustomEvent(string name, object value = null)
        {
            if (Instance == null || !Instance.enableAnalytics) return;

            var eventData = new AnalyticsEvent
            {
                Name = name,
                Value = value,
                Timestamp = Time.time,
                Properties = new Dictionary<string, object>()
            };

            Instance.ProcessEvent(eventData);
        }

        /// <summary>
        /// Track custom event with properties
        /// </summary>
        public static void CustomEvent(string name, Dictionary<string, object> properties)
        {
            if (Instance == null || !Instance.enableAnalytics) return;

            var eventData = new AnalyticsEvent
            {
                Name = name,
                Value = null,
                Timestamp = Time.time,
                Properties = properties ?? new Dictionary<string, object>()
            };

            Instance.ProcessEvent(eventData);
        }

        /// <summary>
        /// Track level completion
        /// </summary>
        public static void TrackLevelComplete(int level, float time, int score)
        {
            var properties = new Dictionary<string, object>
            {
                {"level", level},
                {"time", time},
                {"score", score},
                {"difficulty", GetDifficultyLevel(level)}
            };

            CustomEvent("level_complete", properties);
        }

        /// <summary>
        /// Track purchase
        /// </summary>
        public static void TrackPurchase(string itemId, float value, string currency = "USD")
        {
            var properties = new Dictionary<string, object>
            {
                {"item_id", itemId},
                {"value", value},
                {"currency", currency}
            };

            CustomEvent("purchase", properties);
        }

        /// <summary>
        /// Track user engagement
        /// </summary>
        public static void TrackEngagement(string action, float duration = 0f)
        {
            var properties = new Dictionary<string, object>
            {
                {"action", action},
                {"duration", duration}
            };

            CustomEvent("user_engagement", properties);
        }

        /// <summary>
        /// Set user property
        /// </summary>
        public static void SetUserProperty(string key, object value)
        {
            if (Instance == null || !Instance.enableUserProperties) return;

            Instance._userProperties[key] = value;

            // Send to analytics services
            if (Instance.enableFirebase)
            {
                // Firebase.Analytics.FirebaseAnalytics.SetUserProperty(key, value.ToString());
            }

            if (Instance.enableGoogleAnalytics)
            {
                // GoogleAnalyticsSDK.GA.SetCustomDimension(key, value.ToString());
            }
        }

        /// <summary>
        /// Process analytics event
        /// </summary>
        private void ProcessEvent(AnalyticsEvent eventData)
        {
            if (enableEventBatching)
            {
                _eventQueue.Enqueue(eventData);
            }
            else
            {
                SendEvent(eventData);
            }
        }

        /// <summary>
        /// Process event batching
        /// </summary>
        private void ProcessEventBatching()
        {
            if (Time.time - _lastBatchTime < batchInterval) return;

            _lastBatchTime = Time.time;

            if (_eventQueue.Count >= batchSize)
            {
                SendBatchedEvents();
            }
        }

        /// <summary>
        /// Send batched events
        /// </summary>
        private void SendBatchedEvents()
        {
            var events = new List<AnalyticsEvent>();
            
            for (int i = 0; i < batchSize && _eventQueue.Count > 0; i++)
            {
                events.Add(_eventQueue.Dequeue());
            }

            foreach (var eventData in events)
            {
                SendEvent(eventData);
            }

            Logger.Info($"Sent {events.Count} batched events", "AnalyticsAdapter");
        }

        /// <summary>
        /// Send individual event
        /// </summary>
        private void SendEvent(AnalyticsEvent eventData)
        {
            try
            {
                // Send to Firebase
                if (enableFirebase)
                {
                    SendToFirebase(eventData);
                }

                // Send to Google Analytics
                if (enableGoogleAnalytics)
                {
                    SendToGoogleAnalytics(eventData);
                }

                // Cache event if enabled
                if (enableEventCaching)
                {
                    CacheEvent(eventData);
                }
            }
            catch (System.Exception e)
            {
                Logger.Error($"Failed to send analytics event: {e.Message}", "AnalyticsAdapter");
            }
        }

        /// <summary>
        /// Send event to Firebase
        /// </summary>
        private void SendToFirebase(AnalyticsEvent eventData)
        {
            // Firebase Analytics implementation
            // In a real implementation, you would use:
            // Firebase.Analytics.FirebaseAnalytics.LogEvent(eventData.Name, eventData.Properties);

            Debug.Log($"Firebase: {eventData.Name} - {eventData.Value}");
        }

        /// <summary>
        /// Send event to Google Analytics
        /// </summary>
        private void SendToGoogleAnalytics(AnalyticsEvent eventData)
        {
            // Google Analytics implementation
            // In a real implementation, you would use:
            // GoogleAnalyticsSDK.GA.LogEvent(eventData.Name, eventData.Properties);

            Debug.Log($"GA: {eventData.Name} - {eventData.Value}");
        }

        /// <summary>
        /// Cache event for offline sending
        /// </summary>
        private void CacheEvent(AnalyticsEvent eventData)
        {
            if (_cachedEvents.Count >= maxCachedEvents)
            {
                _cachedEvents.RemoveAt(0); // Remove oldest
            }

            _cachedEvents.Add(eventData);
        }

        /// <summary>
        /// Track performance metrics
        /// </summary>
        private void TrackPerformance()
        {
            if (Time.time - _lastPerformanceTime < performanceInterval) return;

            _lastPerformanceTime = Time.time;

            // Track FPS
            if (enableFPS)
            {
                float fps = 1.0f / Time.deltaTime;
                _performanceMetrics["fps"] = fps;
                CustomEvent("performance_fps", fps);
            }

            // Track memory usage
            if (enableMemory)
            {
                long memory = System.GC.GetTotalMemory(false);
                _performanceMetrics["memory_mb"] = memory / 1024f / 1024f;
                CustomEvent("performance_memory", memory / 1024f / 1024f);
            }

            // Track battery level
            if (enableBattery)
            {
                float battery = SystemInfo.batteryLevel;
                if (battery >= 0)
                {
                    _performanceMetrics["battery"] = battery;
                    CustomEvent("performance_battery", battery);
                }
            }

            // Track thermal state
            if (enableThermal)
            {
                // This would be platform-specific
                float thermal = 0.5f; // Placeholder
                _performanceMetrics["thermal"] = thermal;
                CustomEvent("performance_thermal", thermal);
            }
        }

        /// <summary>
        /// Get difficulty level based on level number
        /// </summary>
        private static string GetDifficultyLevel(int level)
        {
            if (level <= 10) return "Easy";
            if (level <= 25) return "Medium";
            if (level <= 50) return "Hard";
            return "Expert";
        }

        /// <summary>
        /// Get performance metrics
        /// </summary>
        public Dictionary<string, float> GetPerformanceMetrics()
        {
            return new Dictionary<string, float>(_performanceMetrics);
        }

        /// <summary>
        /// Get cached events count
        /// </summary>
        public int GetCachedEventsCount()
        {
            return _cachedEvents.Count;
        }

        /// <summary>
        /// Clear cached events
        /// </summary>
        public void ClearCachedEvents()
        {
            _cachedEvents.Clear();
        }

        /// <summary>
        /// Analytics event data structure
        /// </summary>
        [System.Serializable]
        public class AnalyticsEvent
        {
            public string Name;
            public object Value;
            public float Timestamp;
            public Dictionary<string, object> Properties;
        }
    }
}
