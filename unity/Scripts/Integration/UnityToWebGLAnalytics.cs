using UnityEngine;
using System.Runtime.InteropServices;
using System.Collections.Generic;

namespace Match3Game.Integration
{
    /// <summary>
    /// Unity to WebGL Analytics Integration
    /// Bridges Unity game events to WebGL analytics services
    /// </summary>
    public class UnityToWebGLAnalytics : MonoBehaviour
    {
        [Header("WebGL Analytics Configuration")]
        [SerializeField] private bool enableWebGLAnalytics = true;
        [SerializeField] private bool enableErrorTracking = true;
        [SerializeField] private bool enablePerformanceTracking = true;
        
        [Header("Game Configuration")]
        [SerializeField] private int currentLevel = 1;
        [SerializeField] private int totalScore = 0;
        [SerializeField] private string playerId = "";
        
        private bool isWebGLAnalyticsAvailable = false;
        
        // WebGL JavaScript function calls
        #if UNITY_WEBGL && !UNITY_EDITOR
        [DllImport("__Internal")]
        private static extern bool IsWebGLAnalyticsAvailable();
        
        [DllImport("__Internal")]
        private static extern void TrackWebGLEvent(string eventName, string eventData);
        
        [DllImport("__Internal")]
        private static extern void TrackWebGLGameStart(string level, string difficulty);
        
        [DllImport("__Internal")]
        private static extern void TrackWebGLLevelComplete(string level, string score, string timeSpent, string movesUsed);
        
        [DllImport("__Internal")]
        private static extern void TrackWebGLMatchMade(string matchType, string piecesMatched, string position);
        
        [DllImport("__Internal")]
        private static extern void TrackWebGLPowerUpUsed(string powerUpType, string level, string position);
        
        [DllImport("__Internal")]
        private static extern void TrackWebGLPurchase(string itemId, string currency, string amount);
        
        [DllImport("__Internal")]
        private static extern void TrackWebGLError(string errorType, string errorMessage, string stackTrace);
        
        [DllImport("__Internal")]
        private static extern void TrackWebGLPerformance(string metricName, string value, string unit);
        #endif
        
        private void Start()
        {
            InitializeWebGLAnalytics();
        }
        
        private void InitializeWebGLAnalytics()
        {
            if (!enableWebGLAnalytics) return;
            
            #if UNITY_WEBGL && !UNITY_EDITOR
            try
            {
                isWebGLAnalyticsAvailable = IsWebGLAnalyticsAvailable();
                
                if (isWebGLAnalyticsAvailable)
                {
                    Debug.Log("WebGL Analytics initialized successfully");
                    
                    // Track game initialization
                    TrackWebGLEvent("unity_game_initialized", JsonUtility.ToJson(new {
                        level = currentLevel,
                        platform = "webgl",
                        unity_version = Application.unityVersion,
                        game_version = Application.version
                    }));
                }
                else
                {
                    Debug.LogWarning("WebGL Analytics not available");
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
        
        #region Game Event Tracking
        
        public void TrackGameStart(int level, string difficulty = "normal")
        {
            if (!enableWebGLAnalytics || !isWebGLAnalyticsAvailable) return;
            
            currentLevel = level;
            
            #if UNITY_WEBGL && !UNITY_EDITOR
            try
            {
                TrackWebGLGameStart(level.ToString(), difficulty);
                Debug.Log($"WebGL: Game started - Level {level}, Difficulty: {difficulty}");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to track game start: {e.Message}");
            }
            #endif
        }
        
        public void TrackLevelComplete(int level, int score, float timeSpent, int movesUsed, int starsEarned = 0, int powerupsUsed = 0)
        {
            if (!enableWebGLAnalytics || !isWebGLAnalyticsAvailable) return;
            
            totalScore += score;
            
            #if UNITY_WEBGL && !UNITY_EDITOR
            try
            {
                TrackWebGLLevelComplete(
                    level.ToString(), 
                    score.ToString(), 
                    timeSpent.ToString("F2"), 
                    movesUsed.ToString()
                );
                
                // Track additional data
                TrackWebGLEvent("level_completed_details", JsonUtility.ToJson(new {
                    level = level,
                    score = score,
                    total_score = totalScore,
                    time_spent = timeSpent,
                    moves_used = movesUsed,
                    stars_earned = starsEarned,
                    powerups_used = powerupsUsed,
                    player_id = playerId
                }));
                
                Debug.Log($"WebGL: Level {level} completed - Score: {score}, Time: {timeSpent:F2}s");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to track level completion: {e.Message}");
            }
            #endif
        }
        
        public void TrackMatchMade(int matchType, int piecesMatched, Vector3 position, int scoreGained = 0)
        {
            if (!enableWebGLAnalytics || !isWebGLAnalyticsAvailable) return;
            
            #if UNITY_WEBGL && !UNITY_EDITOR
            try
            {
                TrackWebGLMatchMade(
                    matchType.ToString(), 
                    piecesMatched.ToString(), 
                    JsonUtility.ToJson(position)
                );
                
                // Track additional match data
                TrackWebGLEvent("match_made_details", JsonUtility.ToJson(new {
                    match_type = matchType,
                    pieces_matched = piecesMatched,
                    position = position,
                    score_gained = scoreGained,
                    level = currentLevel,
                    player_id = playerId
                }));
                
                Debug.Log($"WebGL: Match made - Type: {matchType}, Pieces: {piecesMatched}");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to track match: {e.Message}");
            }
            #endif
        }
        
        public void TrackPowerUpUsed(string powerUpType, int level, Vector3 position, int cost = 0)
        {
            if (!enableWebGLAnalytics || !isWebGLAnalyticsAvailable) return;
            
            #if UNITY_WEBGL && !UNITY_EDITOR
            try
            {
                TrackWebGLPowerUpUsed(
                    powerUpType, 
                    level.ToString(), 
                    JsonUtility.ToJson(position)
                );
                
                // Track additional power-up data
                TrackWebGLEvent("powerup_used_details", JsonUtility.ToJson(new {
                    powerup_type = powerUpType,
                    level = level,
                    position = position,
                    cost = cost,
                    player_id = playerId
                }));
                
                Debug.Log($"WebGL: Power-up used - Type: {powerUpType}, Level: {level}");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to track power-up: {e.Message}");
            }
            #endif
        }
        
        public void TrackPurchase(string itemId, string currency, float amount, string transactionId = "")
        {
            if (!enableWebGLAnalytics || !isWebGLAnalyticsAvailable) return;
            
            #if UNITY_WEBGL && !UNITY_EDITOR
            try
            {
                TrackWebGLPurchase(itemId, currency, amount.ToString("F2"));
                
                // Track additional purchase data
                TrackWebGLEvent("purchase_details", JsonUtility.ToJson(new {
                    item_id = itemId,
                    currency = currency,
                    amount = amount,
                    transaction_id = transactionId,
                    player_id = playerId,
                    level = currentLevel
                }));
                
                Debug.Log($"WebGL: Purchase made - Item: {itemId}, Amount: {amount} {currency}");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to track purchase: {e.Message}");
            }
            #endif
        }
        
        public void TrackError(string errorType, string errorMessage, string stackTrace = "")
        {
            if (!enableErrorTracking || !isWebGLAnalyticsAvailable) return;
            
            #if UNITY_WEBGL && !UNITY_EDITOR
            try
            {
                TrackWebGLError(errorType, errorMessage, stackTrace);
                
                // Track additional error data
                TrackWebGLEvent("error_details", JsonUtility.ToJson(new {
                    error_type = errorType,
                    error_message = errorMessage,
                    stack_trace = stackTrace,
                    level = currentLevel,
                    player_id = playerId,
                    platform = "webgl"
                }));
                
                Debug.LogError($"WebGL: Error tracked - Type: {errorType}, Message: {errorMessage}");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to track error: {e.Message}");
            }
            #endif
        }
        
        public void TrackPerformance(string metricName, float value, string unit = "ms")
        {
            if (!enablePerformanceTracking || !isWebGLAnalyticsAvailable) return;
            
            #if UNITY_WEBGL && !UNITY_EDITOR
            try
            {
                TrackWebGLPerformance(metricName, value.ToString("F2"), unit);
                
                Debug.Log($"WebGL: Performance tracked - {metricName}: {value} {unit}");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to track performance: {e.Message}");
            }
            #endif
        }
        
        #endregion
        
        #region Custom Event Tracking
        
        public void TrackCustomEvent(string eventName, Dictionary<string, object> properties)
        {
            if (!enableWebGLAnalytics || !isWebGLAnalyticsAvailable) return;
            
            #if UNITY_WEBGL && !UNITY_EDITOR
            try
            {
                var eventData = new Dictionary<string, object>
                {
                    {"event_name", eventName},
                    {"properties", properties},
                    {"level", currentLevel},
                    {"player_id", playerId},
                    {"timestamp", System.DateTime.UtcNow.ToString()}
                };
                
                TrackWebGLEvent(eventName, JsonUtility.ToJson(eventData));
                Debug.Log($"WebGL: Custom event tracked - {eventName}");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to track custom event: {e.Message}");
            }
            #endif
        }
        
        #endregion
        
        #region Public API
        
        public void SetPlayerId(string id)
        {
            playerId = id;
        }
        
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
        
        public bool IsWebGLAnalyticsReady()
        {
            return isWebGLAnalyticsAvailable;
        }
        
        #endregion
        
        #region Unity Lifecycle Events
        
        private void OnApplicationPause(bool pauseStatus)
        {
            if (pauseStatus)
            {
                TrackCustomEvent("game_paused", new Dictionary<string, object>
                {
                    {"level", currentLevel},
                    {"total_score", totalScore}
                });
            }
            else
            {
                TrackCustomEvent("game_resumed", new Dictionary<string, object>
                {
                    {"level", currentLevel},
                    {"total_score", totalScore}
                });
            }
        }
        
        private void OnApplicationFocus(bool hasFocus)
        {
            if (!hasFocus)
            {
                TrackCustomEvent("game_lost_focus", new Dictionary<string, object>
                {
                    {"level", currentLevel},
                    {"total_score", totalScore}
                });
            }
            else
            {
                TrackCustomEvent("game_gained_focus", new Dictionary<string, object>
                {
                    {"level", currentLevel},
                    {"total_score", totalScore}
                });
            }
        }
        
        private void OnDestroy()
        {
            TrackCustomEvent("game_session_ended", new Dictionary<string, object>
            {
                {"level", currentLevel},
                {"total_score", totalScore},
                {"session_duration", Time.time}
            });
        }
        
        #endregion
    }
}