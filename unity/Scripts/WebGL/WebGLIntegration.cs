using UnityEngine;
using System.Runtime.InteropServices;
using System.Collections.Generic;

namespace Match3Game.WebGL
{
    /// <summary>
    /// WebGL integration for Match 3 game
    /// Handles communication between Unity and JavaScript analytics
    /// </summary>
    public class WebGLIntegration : MonoBehaviour
    {
        [Header("WebGL Configuration")]
        [SerializeField] private bool enableWebGLAnalytics = true;
        [SerializeField] private bool enableWebGLPerformance = true;
        [SerializeField] private bool enableWebGLErrors = true;
        
        private bool isInitialized = false;
        
        #if UNITY_WEBGL && !UNITY_EDITOR
        // JavaScript function declarations
        [DllImport("__Internal")]
        private static extern void InitializeWebGLAnalytics();
        
        [DllImport("__Internal")]
        private static extern void TrackWebGLEvent(string eventName, string eventData);
        
        [DllImport("__Internal")]
        private static extern void TrackWebGLError(string errorType, string errorMessage, string stackTrace);
        
        [DllImport("__Internal")]
        private static extern void TrackWebGLPerformance(string metricName, float value, string unit);
        
        [DllImport("__Internal")]
        private static extern void SetWebGLUserProperty(string key, string value);
        
        [DllImport("__Internal")]
        private static extern string GetWebGLUserProperty(string key);
        
        [DllImport("__Internal")]
        private static extern void FlushWebGLAnalytics();
        
        [DllImport("__Internal")]
        private static extern string GetWebGLAnalyticsSummary();
        #endif

        private void Start()
        {
            InitializeWebGL();
        }

        private void InitializeWebGL()
        {
            #if UNITY_WEBGL && !UNITY_EDITOR
            try
            {
                if (enableWebGLAnalytics)
                {
                    InitializeWebGLAnalytics();
                    isInitialized = true;
                    Debug.Log("WebGL Analytics initialized successfully");
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to initialize WebGL Analytics: {e.Message}");
            }
            #else
            Debug.Log("WebGL Analytics not available in editor or non-WebGL builds");
            #endif
        }

        #region Public API Methods

        /// <summary>
        /// Track a game event
        /// </summary>
        public void TrackEvent(string eventName, Dictionary<string, object> properties = null)
        {
            if (!isInitialized || !enableWebGLAnalytics) return;

            #if UNITY_WEBGL && !UNITY_EDITOR
            try
            {
                string eventData = properties != null ? 
                    JsonUtility.ToJson(ConvertToSerializable(properties)) : 
                    "{}";
                
                TrackWebGLEvent(eventName, eventData);
                Debug.Log($"WebGL Event tracked: {eventName}");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to track WebGL event: {e.Message}");
            }
            #endif
        }

        /// <summary>
        /// Track a game error
        /// </summary>
        public void TrackError(string errorType, string errorMessage, string stackTrace = null)
        {
            if (!isInitialized || !enableWebGLErrors) return;

            #if UNITY_WEBGL && !UNITY_EDITOR
            try
            {
                TrackWebGLError(errorType, errorMessage, stackTrace ?? "");
                Debug.LogError($"WebGL Error tracked: {errorType} - {errorMessage}");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to track WebGL error: {e.Message}");
            }
            #endif
        }

        /// <summary>
        /// Track performance metrics
        /// </summary>
        public void TrackPerformance(string metricName, float value, string unit = "ms")
        {
            if (!isInitialized || !enableWebGLPerformance) return;

            #if UNITY_WEBGL && !UNITY_EDITOR
            try
            {
                TrackWebGLPerformance(metricName, value, unit);
                Debug.Log($"WebGL Performance tracked: {metricName} = {value} {unit}");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to track WebGL performance: {e.Message}");
            }
            #endif
        }

        /// <summary>
        /// Set user property
        /// </summary>
        public void SetUserProperty(string key, string value)
        {
            if (!isInitialized) return;

            #if UNITY_WEBGL && !UNITY_EDITOR
            try
            {
                SetWebGLUserProperty(key, value);
                Debug.Log($"WebGL User property set: {key} = {value}");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to set WebGL user property: {e.Message}");
            }
            #endif
        }

        /// <summary>
        /// Get user property
        /// </summary>
        public string GetUserProperty(string key)
        {
            if (!isInitialized) return null;

            #if UNITY_WEBGL && !UNITY_EDITOR
            try
            {
                return GetWebGLUserProperty(key);
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to get WebGL user property: {e.Message}");
                return null;
            }
            #else
            return null;
            #endif
        }

        /// <summary>
        /// Flush analytics data
        /// </summary>
        public void FlushAnalytics()
        {
            if (!isInitialized) return;

            #if UNITY_WEBGL && !UNITY_EDITOR
            try
            {
                FlushWebGLAnalytics();
                Debug.Log("WebGL Analytics flushed");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to flush WebGL analytics: {e.Message}");
            }
            #endif
        }

        /// <summary>
        /// Get analytics summary
        /// </summary>
        public string GetAnalyticsSummary()
        {
            if (!isInitialized) return "WebGL Analytics not initialized";

            #if UNITY_WEBGL && !UNITY_EDITOR
            try
            {
                return GetWebGLAnalyticsSummary();
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to get WebGL analytics summary: {e.Message}");
                return "Error getting analytics summary";
            }
            #else
            return "WebGL Analytics not available in editor";
            #endif
        }

        #endregion

        #region Game-Specific Methods

        /// <summary>
        /// Track game start
        /// </summary>
        public void TrackGameStart(int level, string difficulty = "normal")
        {
            TrackEvent("game_started", new Dictionary<string, object>
            {
                {"level", level},
                {"difficulty", difficulty},
                {"platform", "webgl"},
                {"timestamp", System.DateTime.UtcNow.ToString()}
            });
        }

        /// <summary>
        /// Track level completion
        /// </summary>
        public void TrackLevelComplete(int level, int score, float timeSpent, int movesUsed, int starsEarned)
        {
            TrackEvent("level_completed", new Dictionary<string, object>
            {
                {"level", level},
                {"score", score},
                {"time_spent", timeSpent},
                {"moves_used", movesUsed},
                {"stars_earned", starsEarned},
                {"timestamp", System.DateTime.UtcNow.ToString()}
            });
        }

        /// <summary>
        /// Track match made
        /// </summary>
        public void TrackMatchMade(int matchType, int piecesMatched, Vector3 position, int scoreGained)
        {
            TrackEvent("match_made", new Dictionary<string, object>
            {
                {"match_type", matchType},
                {"pieces_matched", piecesMatched},
                {"position_x", position.x},
                {"position_y", position.y},
                {"score_gained", scoreGained},
                {"timestamp", System.DateTime.UtcNow.ToString()}
            });
        }

        /// <summary>
        /// Track power-up usage
        /// </summary>
        public void TrackPowerUpUsed(string powerUpType, int level, Vector3 position, int cost)
        {
            TrackEvent("powerup_used", new Dictionary<string, object>
            {
                {"powerup_type", powerUpType},
                {"level", level},
                {"position_x", position.x},
                {"position_y", position.y},
                {"cost", cost},
                {"timestamp", System.DateTime.UtcNow.ToString()}
            });
        }

        /// <summary>
        /// Track purchase
        /// </summary>
        public void TrackPurchase(string itemId, string currency, float amount, string transactionId = null)
        {
            TrackEvent("purchase_made", new Dictionary<string, object>
            {
                {"item_id", itemId},
                {"currency", currency},
                {"amount", amount},
                {"transaction_id", transactionId ?? System.Guid.NewGuid().ToString()},
                {"timestamp", System.DateTime.UtcNow.ToString()}
            });
        }

        /// <summary>
        /// Track performance metrics
        /// </summary>
        public void TrackGamePerformance()
        {
            if (!enableWebGLPerformance) return;

            // Track FPS
            float fps = 1.0f / Time.deltaTime;
            TrackPerformance("fps", fps, "fps");

            // Track memory usage
            long memoryUsage = System.GC.GetTotalMemory(false);
            TrackPerformance("memory_usage", memoryUsage, "bytes");

            // Track frame time
            TrackPerformance("frame_time", Time.deltaTime * 1000, "ms");
        }

        #endregion

        #region Utility Methods

        /// <summary>
        /// Convert dictionary to serializable object
        /// </summary>
        private object ConvertToSerializable(Dictionary<string, object> dict)
        {
            var result = new Dictionary<string, object>();
            foreach (var kvp in dict)
            {
                if (kvp.Value is Vector3 vector3)
                {
                    result[kvp.Key] = new { x = vector3.x, y = vector3.y, z = vector3.z };
                }
                else if (kvp.Value is Vector2 vector2)
                {
                    result[kvp.Key] = new { x = vector2.x, y = vector2.y };
                }
                else
                {
                    result[kvp.Key] = kvp.Value;
                }
            }
            return result;
        }

        #endregion

        #region Unity Lifecycle

        private void Update()
        {
            // Track performance every 60 frames
            if (Time.frameCount % 60 == 0)
            {
                TrackGamePerformance();
            }
        }

        private void OnApplicationPause(bool pauseStatus)
        {
            if (pauseStatus)
            {
                TrackEvent("game_paused", new Dictionary<string, object>
                {
                    {"pause_time", System.DateTime.UtcNow.ToString()}
                });
            }
            else
            {
                TrackEvent("game_resumed", new Dictionary<string, object>
                {
                    {"resume_time", System.DateTime.UtcNow.ToString()}
                });
            }
        }

        private void OnApplicationFocus(bool hasFocus)
        {
            if (!hasFocus)
            {
                TrackEvent("game_focus_lost", new Dictionary<string, object>
                {
                    {"focus_lost_time", System.DateTime.UtcNow.ToString()}
                });
            }
            else
            {
                TrackEvent("game_focus_gained", new Dictionary<string, object>
                {
                    {"focus_gained_time", System.DateTime.UtcNow.ToString()}
                });
            }
        }

        private void OnDestroy()
        {
            // Flush analytics before destroying
            FlushAnalytics();
        }

        #endregion
    }
}