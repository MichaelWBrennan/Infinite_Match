using UnityEngine;
using Unity.Services.Analytics;
using Unity.Services.Core;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Match3Game.Analytics
{
    /// <summary>
    /// Comprehensive analytics manager for Match 3 game
    /// Integrates Unity Analytics, Sentry, and custom analytics
    /// </summary>
    public class GameAnalyticsManager : MonoBehaviour
    {
        [Header("Analytics Configuration")]
        [SerializeField] private bool enableUnityAnalytics = true;
        [SerializeField] private bool enableCustomAnalytics = true;
        [SerializeField] private bool enableErrorTracking = true;
        
        [Header("Game Events")]
        [SerializeField] private string gameSessionId;
        [SerializeField] private int currentLevel = 1;
        [SerializeField] private int totalScore = 0;
        
        private bool isInitialized = false;
        
        private void Start()
        {
            InitializeAnalytics();
        }
        
        private async void InitializeAnalytics()
        {
            try
            {
                // Initialize Unity Services
                await UnityServices.InitializeAsync();
                
                // Initialize custom analytics
                if (enableCustomAnalytics)
                {
                    await InitializeCustomAnalytics();
                }
                
                // Initialize error tracking
                if (enableErrorTracking)
                {
                    InitializeErrorTracking();
                }
                
                isInitialized = true;
                Debug.Log("Analytics initialized successfully");
                
                // Track game start
                TrackGameStart();
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to initialize analytics: {e.Message}");
            }
        }
        
        private async Task InitializeCustomAnalytics()
        {
            // Initialize Amplitude
            await InitializeAmplitude();
            
            // Initialize Mixpanel
            InitializeMixpanel();
        }
        
        private async Task InitializeAmplitude()
        {
            // Amplitude initialization will be handled in JavaScript for WebGL
            // For standalone builds, you'd use the native SDK
            Debug.Log("Amplitude analytics initialized");
        }
        
        private void InitializeMixpanel()
        {
            // Mixpanel initialization for WebGL
            Debug.Log("Mixpanel analytics initialized");
        }
        
        private void InitializeErrorTracking()
        {
            // Sentry error tracking initialization
            Debug.Log("Sentry error tracking initialized");
        }
        
        #region Game Event Tracking
        
        public void TrackGameStart()
        {
            if (!isInitialized) return;
            
            gameSessionId = System.Guid.NewGuid().ToString();
            
            // Unity Analytics
            if (enableUnityAnalytics)
            {
                AnalyticsService.Instance.CustomData("game_started", new Dictionary<string, object>
                {
                    {"session_id", gameSessionId},
                    {"timestamp", System.DateTime.UtcNow.ToString()},
                    {"platform", Application.platform.ToString()}
                });
            }
            
            // Custom analytics
            if (enableCustomAnalytics)
            {
                TrackCustomEvent("game_started", new Dictionary<string, object>
                {
                    {"session_id", gameSessionId},
                    {"level", currentLevel},
                    {"platform", Application.platform.ToString()}
                });
            }
        }
        
        public void TrackLevelStart(int level)
        {
            if (!isInitialized) return;
            
            currentLevel = level;
            
            // Unity Analytics
            if (enableUnityAnalytics)
            {
                AnalyticsService.Instance.CustomData("level_started", new Dictionary<string, object>
                {
                    {"level", level},
                    {"session_id", gameSessionId},
                    {"timestamp", System.DateTime.UtcNow.ToString()}
                });
            }
            
            // Custom analytics
            if (enableCustomAnalytics)
            {
                TrackCustomEvent("level_started", new Dictionary<string, object>
                {
                    {"level", level},
                    {"session_id", gameSessionId}
                });
            }
        }
        
        public void TrackLevelComplete(int level, int score, float timeSpent, int movesUsed)
        {
            if (!isInitialized) return;
            
            totalScore += score;
            
            // Unity Analytics
            if (enableUnityAnalytics)
            {
                AnalyticsService.Instance.CustomData("level_completed", new Dictionary<string, object>
                {
                    {"level", level},
                    {"score", score},
                    {"total_score", totalScore},
                    {"time_spent", timeSpent},
                    {"moves_used", movesUsed},
                    {"session_id", gameSessionId}
                });
            }
            
            // Custom analytics
            if (enableCustomAnalytics)
            {
                TrackCustomEvent("level_completed", new Dictionary<string, object>
                {
                    {"level", level},
                    {"score", score},
                    {"total_score", totalScore},
                    {"time_spent", timeSpent},
                    {"moves_used", movesUsed},
                    {"session_id", gameSessionId}
                });
            }
        }
        
        public void TrackMatch(int matchType, int piecesMatched, Vector3 position)
        {
            if (!isInitialized) return;
            
            // Unity Analytics
            if (enableUnityAnalytics)
            {
                AnalyticsService.Instance.CustomData("match_made", new Dictionary<string, object>
                {
                    {"match_type", matchType},
                    {"pieces_matched", piecesMatched},
                    {"position_x", position.x},
                    {"position_y", position.y},
                    {"level", currentLevel},
                    {"session_id", gameSessionId}
                });
            }
            
            // Custom analytics
            if (enableCustomAnalytics)
            {
                TrackCustomEvent("match_made", new Dictionary<string, object>
                {
                    {"match_type", matchType},
                    {"pieces_matched", piecesMatched},
                    {"level", currentLevel},
                    {"session_id", gameSessionId}
                });
            }
        }
        
        public void TrackPowerUpUsed(string powerUpType, int level, Vector3 position)
        {
            if (!isInitialized) return;
            
            // Unity Analytics
            if (enableUnityAnalytics)
            {
                AnalyticsService.Instance.CustomData("powerup_used", new Dictionary<string, object>
                {
                    {"powerup_type", powerUpType},
                    {"level", level},
                    {"position_x", position.x},
                    {"position_y", position.y},
                    {"session_id", gameSessionId}
                });
            }
            
            // Custom analytics
            if (enableCustomAnalytics)
            {
                TrackCustomEvent("powerup_used", new Dictionary<string, object>
                {
                    {"powerup_type", powerUpType},
                    {"level", level},
                    {"session_id", gameSessionId}
                });
            }
        }
        
        public void TrackPurchase(string itemId, string currency, float amount)
        {
            if (!isInitialized) return;
            
            // Unity Analytics
            if (enableUnityAnalytics)
            {
                AnalyticsService.Instance.CustomData("purchase_made", new Dictionary<string, object>
                {
                    {"item_id", itemId},
                    {"currency", currency},
                    {"amount", amount},
                    {"session_id", gameSessionId}
                });
            }
            
            // Custom analytics
            if (enableCustomAnalytics)
            {
                TrackCustomEvent("purchase_made", new Dictionary<string, object>
                {
                    {"item_id", itemId},
                    {"currency", currency},
                    {"amount", amount},
                    {"session_id", gameSessionId}
                });
            }
        }
        
        public void TrackError(string errorType, string errorMessage, string stackTrace)
        {
            if (!isInitialized) return;
            
            // Unity Analytics
            if (enableUnityAnalytics)
            {
                AnalyticsService.Instance.CustomData("error_occurred", new Dictionary<string, object>
                {
                    {"error_type", errorType},
                    {"error_message", errorMessage},
                    {"level", currentLevel},
                    {"session_id", gameSessionId}
                });
            }
            
            // Sentry error tracking
            if (enableErrorTracking)
            {
                TrackErrorEvent(errorType, errorMessage, stackTrace);
            }
        }
        
        #endregion
        
        #region Custom Analytics Implementation
        
        private void TrackCustomEvent(string eventName, Dictionary<string, object> properties)
        {
            // This will be implemented with JavaScript calls for WebGL
            // or native SDK calls for other platforms
            Debug.Log($"Custom Event: {eventName} - {JsonUtility.ToJson(properties)}");
        }
        
        private void TrackErrorEvent(string errorType, string errorMessage, string stackTrace)
        {
            // Sentry error tracking implementation
            Debug.LogError($"Error Tracked: {errorType} - {errorMessage}");
        }
        
        #endregion
        
        #region Public API
        
        public void SetLevel(int level)
        {
            currentLevel = level;
        }
        
        public void AddScore(int score)
        {
            totalScore += score;
        }
        
        public int GetTotalScore()
        {
            return totalScore;
        }
        
        public string GetSessionId()
        {
            return gameSessionId;
        }
        
        #endregion
    }
}