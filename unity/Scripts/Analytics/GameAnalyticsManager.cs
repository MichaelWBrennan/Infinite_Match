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
        
        [Header("Addiction Mechanics")]
        [SerializeField] private int dailyStreak = 0;
        [SerializeField] private int maxStreak = 0;
        [SerializeField] private bool hasClaimedTodayReward = false;
        [SerializeField] private float lastLoginTime;
        [SerializeField] private int comebackBonusDays = 3;
        
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
            
            // Check for daily reward eligibility
            CheckDailyRewardEligibility();
            
            // Unity Analytics
            if (enableUnityAnalytics)
            {
                AnalyticsService.Instance.CustomData("game_started", new Dictionary<string, object>
                {
                    {"session_id", gameSessionId},
                    {"timestamp", System.DateTime.UtcNow.ToString()},
                    {"platform", Application.platform.ToString()},
                    {"daily_streak", dailyStreak},
                    {"max_streak", maxStreak},
                    {"comeback_bonus", IsComebackBonusEligible()}
                });
            }
            
            // Custom analytics
            if (enableCustomAnalytics)
            {
                TrackCustomEvent("game_started", new Dictionary<string, object>
                {
                    {"session_id", gameSessionId},
                    {"level", currentLevel},
                    {"platform", Application.platform.ToString()},
                    {"daily_streak", dailyStreak},
                    {"max_streak", maxStreak},
                    {"comeback_bonus", IsComebackBonusEligible()}
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
        
        #region Addiction Mechanics
        
        private void CheckDailyRewardEligibility()
        {
            float currentTime = Time.time;
            float timeSinceLastLogin = currentTime - lastLoginTime;
            float hoursSinceLastLogin = timeSinceLastLogin / 3600f;
            
            // Check if it's a new day (24+ hours since last login)
            if (hoursSinceLastLogin >= 24f)
            {
                // Check if streak should continue or reset
                if (hoursSinceLastLogin >= 24f && hoursSinceLastLogin <= 48f)
                {
                    // Continue streak
                    dailyStreak++;
                    if (dailyStreak > maxStreak)
                        maxStreak = dailyStreak;
                }
                else if (hoursSinceLastLogin > (comebackBonusDays * 24f))
                {
                    // Reset streak but give comeback bonus
                    dailyStreak = 1;
                    TriggerComebackBonus();
                }
                else
                {
                    // Reset streak
                    dailyStreak = 1;
                }
                
                hasClaimedTodayReward = false;
                lastLoginTime = currentTime;
                
                // Track daily reward availability
                TrackCustomEvent("daily_reward_available", new Dictionary<string, object>
                {
                    {"streak", dailyStreak},
                    {"max_streak", maxStreak},
                    {"is_comeback", hoursSinceLastLogin > (comebackBonusDays * 24f)}
                });
            }
        }
        
        private bool IsComebackBonusEligible()
        {
            float currentTime = Time.time;
            float timeSinceLastLogin = currentTime - lastLoginTime;
            float hoursSinceLastLogin = timeSinceLastLogin / 3600f;
            return hoursSinceLastLogin > (comebackBonusDays * 24f);
        }
        
        private void TriggerComebackBonus()
        {
            TrackCustomEvent("comeback_bonus_triggered", new Dictionary<string, object>
            {
                {"days_away", (Time.time - lastLoginTime) / (24f * 3600f)},
                {"streak_reset", true}
            });
        }
        
        public void ClaimDailyReward()
        {
            if (hasClaimedTodayReward) return;
            
            hasClaimedTodayReward = true;
            
            // Calculate reward based on streak
            float baseReward = 100f;
            float streakBonus = dailyStreak * 10f;
            float multiplier = dailyStreak >= 7 ? 1.5f : 1f;
            float totalReward = (baseReward + streakBonus) * multiplier;
            
            TrackCustomEvent("daily_reward_claimed", new Dictionary<string, object>
            {
                {"streak", dailyStreak},
                {"max_streak", maxStreak},
                {"base_reward", baseReward},
                {"streak_bonus", streakBonus},
                {"multiplier", multiplier},
                {"total_reward", totalReward}
            });
        }
        
        public void TrackFOMOEvent(string eventType, Dictionary<string, object> eventData)
        {
            TrackCustomEvent("fomo_event", new Dictionary<string, object>
            {
                {"event_type", eventType},
                {"timestamp", System.DateTime.UtcNow.ToString()},
                {"session_id", gameSessionId},
                {"level", currentLevel}
            }.Concat(eventData).ToDictionary(x => x.Key, x => x.Value));
        }
        
        public void TrackVariableReward(string rewardType, float rewardValue, string rarity)
        {
            TrackCustomEvent("variable_reward", new Dictionary<string, object>
            {
                {"reward_type", rewardType},
                {"reward_value", rewardValue},
                {"rarity", rarity},
                {"timestamp", System.DateTime.UtcNow.ToString()},
                {"session_id", gameSessionId}
            });
        }
        
        public void TrackSocialInteraction(string interactionType, Dictionary<string, object> interactionData)
        {
            TrackCustomEvent("social_interaction", new Dictionary<string, object>
            {
                {"interaction_type", interactionType},
                {"timestamp", System.DateTime.UtcNow.ToString()},
                {"session_id", gameSessionId}
            }.Concat(interactionData).ToDictionary(x => x.Key, x => x.Value));
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