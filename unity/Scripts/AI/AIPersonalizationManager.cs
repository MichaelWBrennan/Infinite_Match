using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System;
using Match3Game.Analytics;

namespace Match3Game.AI
{
    /// <summary>
    /// AI-powered personalization manager
    /// Implements machine learning algorithms for player behavior prediction and personalization
    /// </summary>
    public class AIPersonalizationManager : MonoBehaviour
    {
        [Header("Difficulty Adjustment")]
        [SerializeField] private bool enableDifficultyAdjustment = true;
        [SerializeField] private float baseDifficulty = 0.5f;
        [SerializeField] private float difficultyAdjustmentRate = 0.1f;
        [SerializeField] private float minDifficulty = 0.1f;
        [SerializeField] private float maxDifficulty = 1.0f;
        
        [Header("Offer Targeting")]
        [SerializeField] private bool enableOfferTargeting = true;
        [SerializeField] private int maxActiveOffers = 3;
        [SerializeField] private float offerRefreshInterval = 3600f; // 1 hour
        [SerializeField] private float offerSuccessThreshold = 0.3f;
        
        [Header("Churn Prediction")]
        [SerializeField] private bool enableChurnPrediction = true;
        [SerializeField] private float churnThreshold = 0.7f;
        [SerializeField] private float churnCheckInterval = 1800f; // 30 minutes
        [SerializeField] private int churnPredictionWindow = 7; // 7 days
        
        [Header("Player Segmentation")]
        [SerializeField] private bool enablePlayerSegmentation = true;
        [SerializeField] private int maxSegments = 10;
        [SerializeField] private float segmentUpdateInterval = 3600f; // 1 hour
        
        [Header("Recommendation Engine")]
        [SerializeField] private bool enableRecommendations = true;
        [SerializeField] private int maxRecommendations = 5;
        [SerializeField] private float recommendationUpdateInterval = 1800f; // 30 minutes
        
        // Private variables
        private Dictionary<string, PlayerProfile> playerProfiles = new Dictionary<string, PlayerProfile>();
        private Dictionary<string, float> difficultyScores = new Dictionary<string, float>();
        private Dictionary<string, List<PersonalizedOffer>> activeOffers = new Dictionary<string, List<PersonalizedOffer>>();
        private Dictionary<string, float> churnProbabilities = new Dictionary<string, float>();
        private Dictionary<string, PlayerSegment> playerSegments = new Dictionary<string, PlayerSegment>();
        private Dictionary<string, List<Recommendation>> recommendations = new Dictionary<string, List<Recommendation>>();
        private GameAnalyticsManager analyticsManager;
        
        // Events
        public System.Action<string, float> OnDifficultyAdjusted;
        public System.Action<string, PersonalizedOffer> OnNewOfferGenerated;
        public System.Action<string, float> OnChurnPredicted;
        public System.Action<string, PlayerSegment> OnPlayerSegmentUpdated;
        public System.Action<string, List<Recommendation>> OnRecommendationsUpdated;
        
        private void Start()
        {
            InitializeAISystems();
        }
        
        private void InitializeAISystems()
        {
            analyticsManager = FindObjectOfType<GameAnalyticsManager>();
            
            // Start AI systems
            if (enableDifficultyAdjustment)
                StartCoroutine(DifficultyAdjustmentCoroutine());
            
            if (enableOfferTargeting)
                StartCoroutine(OfferTargetingCoroutine());
            
            if (enableChurnPrediction)
                StartCoroutine(ChurnPredictionCoroutine());
            
            if (enablePlayerSegmentation)
                StartCoroutine(PlayerSegmentationCoroutine());
            
            if (enableRecommendations)
                StartCoroutine(RecommendationEngineCoroutine());
            
            // Track AI systems initialization
            TrackEvent("ai_systems_initialized", new Dictionary<string, object>
            {
                {"difficulty_adjustment_enabled", enableDifficultyAdjustment},
                {"offer_targeting_enabled", enableOfferTargeting},
                {"churn_prediction_enabled", enableChurnPrediction},
                {"player_segmentation_enabled", enablePlayerSegmentation},
                {"recommendations_enabled", enableRecommendations}
            });
        }
        
        #region Difficulty Adjustment System
        
        private IEnumerator DifficultyAdjustmentCoroutine()
        {
            while (true)
            {
                AdjustDifficultyForAllPlayers();
                yield return new WaitForSeconds(300f); // Adjust every 5 minutes
            }
        }
        
        private void AdjustDifficultyForAllPlayers()
        {
            foreach (var playerId in playerProfiles.Keys)
            {
                AdjustDifficultyForPlayer(playerId);
            }
        }
        
        private void AdjustDifficultyForPlayer(string playerId)
        {
            if (!playerProfiles.ContainsKey(playerId)) return;
            
            PlayerProfile profile = playerProfiles[playerId];
            float currentDifficulty = difficultyScores.GetValueOrDefault(playerId, baseDifficulty);
            
            // Analyze player performance
            float performanceScore = CalculatePerformanceScore(profile);
            float targetDifficulty = CalculateTargetDifficulty(performanceScore, profile);
            
            // Adjust difficulty gradually
            float newDifficulty = Mathf.Lerp(currentDifficulty, targetDifficulty, difficultyAdjustmentRate);
            newDifficulty = Mathf.Clamp(newDifficulty, minDifficulty, maxDifficulty);
            
            difficultyScores[playerId] = newDifficulty;
            
            // Track difficulty adjustment
            TrackEvent("difficulty_adjusted", new Dictionary<string, object>
            {
                {"player_id", playerId},
                {"old_difficulty", currentDifficulty},
                {"new_difficulty", newDifficulty},
                {"performance_score", performanceScore},
                {"target_difficulty", targetDifficulty}
            });
            
            OnDifficultyAdjusted?.Invoke(playerId, newDifficulty);
        }
        
        private float CalculatePerformanceScore(PlayerProfile profile)
        {
            // Calculate performance based on various metrics
            float levelCompletionRate = profile.levelsCompleted / Mathf.Max(profile.levelsAttempted, 1f);
            float averageScore = profile.totalScore / Mathf.Max(profile.levelsCompleted, 1f);
            float averageTime = profile.totalPlayTime / Mathf.Max(profile.levelsCompleted, 1f);
            
            // Normalize scores
            float normalizedCompletionRate = Mathf.Clamp01(levelCompletionRate);
            float normalizedScore = Mathf.Clamp01(averageScore / 1000f); // Assuming 1000 is good score
            float normalizedTime = Mathf.Clamp01(1f - (averageTime / 300f)); // Assuming 300s is good time
            
            // Weighted average
            return (normalizedCompletionRate * 0.4f + normalizedScore * 0.3f + normalizedTime * 0.3f);
        }
        
        private float CalculateTargetDifficulty(float performanceScore, PlayerProfile profile)
        {
            // Target difficulty based on performance
            float baseTarget = baseDifficulty;
            
            if (performanceScore > 0.8f)
            {
                // High performer - increase difficulty
                baseTarget += 0.2f;
            }
            else if (performanceScore < 0.3f)
            {
                // Low performer - decrease difficulty
                baseTarget -= 0.2f;
            }
            
            // Adjust based on player preferences
            if (profile.preferredDifficulty > 0)
            {
                baseTarget = Mathf.Lerp(baseTarget, profile.preferredDifficulty, 0.3f);
            }
            
            return Mathf.Clamp(baseTarget, minDifficulty, maxDifficulty);
        }
        
        #endregion
        
        #region Offer Targeting System
        
        private IEnumerator OfferTargetingCoroutine()
        {
            while (true)
            {
                GeneratePersonalizedOffers();
                yield return new WaitForSeconds(offerRefreshInterval);
            }
        }
        
        private void GeneratePersonalizedOffers()
        {
            foreach (var playerId in playerProfiles.Keys)
            {
                GenerateOffersForPlayer(playerId);
            }
        }
        
        private void GenerateOffersForPlayer(string playerId)
        {
            if (!playerProfiles.ContainsKey(playerId)) return;
            
            PlayerProfile profile = playerProfiles[playerId];
            PlayerSegment segment = playerSegments.GetValueOrDefault(playerId, PlayerSegment.Casual);
            
            // Clear existing offers
            if (activeOffers.ContainsKey(playerId))
            {
                activeOffers[playerId].Clear();
            }
            else
            {
                activeOffers[playerId] = new List<PersonalizedOffer>();
            }
            
            // Generate offers based on player segment and behavior
            List<PersonalizedOffer> offers = GenerateOffersForSegment(segment, profile);
            
            // Limit number of active offers
            if (offers.Count > maxActiveOffers)
            {
                offers = offers.GetRange(0, maxActiveOffers);
            }
            
            activeOffers[playerId] = offers;
            
            // Track offer generation
            TrackEvent("offers_generated", new Dictionary<string, object>
            {
                {"player_id", playerId},
                {"segment", segment.ToString()},
                {"offers_count", offers.Count}
            });
            
            // Notify about new offers
            foreach (var offer in offers)
            {
                OnNewOfferGenerated?.Invoke(playerId, offer);
            }
        }
        
        private List<PersonalizedOffer> GenerateOffersForSegment(PlayerSegment segment, PlayerProfile profile)
        {
            List<PersonalizedOffer> offers = new List<PersonalizedOffer>();
            
            switch (segment)
            {
                case PlayerSegment.Whale:
                    offers.AddRange(GenerateWhaleOffers(profile));
                    break;
                case PlayerSegment.Spender:
                    offers.AddRange(GenerateSpenderOffers(profile));
                    break;
                case PlayerSegment.Engaged:
                    offers.AddRange(GenerateEngagedOffers(profile));
                    break;
                case PlayerSegment.FreePlayer:
                    offers.AddRange(GenerateFreePlayerOffers(profile));
                    break;
                case PlayerSegment.AtRisk:
                    offers.AddRange(GenerateAtRiskOffers(profile));
                    break;
                default:
                    offers.AddRange(GenerateCasualOffers(profile));
                    break;
            }
            
            return offers;
        }
        
        private List<PersonalizedOffer> GenerateWhaleOffers(PlayerProfile profile)
        {
            List<PersonalizedOffer> offers = new List<PersonalizedOffer>();
            
            // High-value offers for whales
            offers.Add(new PersonalizedOffer
            {
                id = Guid.NewGuid().ToString(),
                title = "VIP Exclusive Pack",
                description = "Get 50% off our premium pack!",
                discount = 0.5f,
                originalPrice = 49.99f,
                discountedPrice = 24.99f,
                items = new List<string> { "premium_pack", "gems_1000", "exclusive_skin" },
                urgencyLevel = UrgencyLevel.Medium,
                expirationTime = DateTime.Now.AddHours(2),
                targetAudience = PlayerSegment.Whale
            });
            
            return offers;
        }
        
        private List<PersonalizedOffer> GenerateSpenderOffers(PlayerProfile profile)
        {
            List<PersonalizedOffer> offers = new List<PersonalizedOffer>();
            
            // Medium-value offers for spenders
            offers.Add(new PersonalizedOffer
            {
                id = Guid.NewGuid().ToString(),
                title = "Special Deal",
                description = "Get 30% off coins and gems!",
                discount = 0.3f,
                originalPrice = 19.99f,
                discountedPrice = 13.99f,
                items = new List<string> { "coins_1000", "gems_200" },
                urgencyLevel = UrgencyLevel.Medium,
                expirationTime = DateTime.Now.AddHours(4),
                targetAudience = PlayerSegment.Spender
            });
            
            return offers;
        }
        
        private List<PersonalizedOffer> GenerateEngagedOffers(PlayerProfile profile)
        {
            List<PersonalizedOffer> offers = new List<PersonalizedOffer>();
            
            // Engagement-focused offers
            offers.Add(new PersonalizedOffer
            {
                id = Guid.NewGuid().ToString(),
                title = "Keep Playing!",
                description = "Get extra energy to continue your streak!",
                discount = 0.4f,
                originalPrice = 4.99f,
                discountedPrice = 2.99f,
                items = new List<string> { "energy_pack" },
                urgencyLevel = UrgencyLevel.Low,
                expirationTime = DateTime.Now.AddHours(6),
                targetAudience = PlayerSegment.Engaged
            });
            
            return offers;
        }
        
        private List<PersonalizedOffer> GenerateFreePlayerOffers(PlayerProfile profile)
        {
            List<PersonalizedOffer> offers = new List<PersonalizedOffer>();
            
            // Conversion offers for free players
            offers.Add(new PersonalizedOffer
            {
                id = Guid.NewGuid().ToString(),
                title = "First Purchase Bonus!",
                description = "Get 60% off your first purchase!",
                discount = 0.6f,
                originalPrice = 4.99f,
                discountedPrice = 1.99f,
                items = new List<string> { "coins_500", "gems_100" },
                urgencyLevel = UrgencyLevel.High,
                expirationTime = DateTime.Now.AddHours(24),
                targetAudience = PlayerSegment.FreePlayer
            });
            
            return offers;
        }
        
        private List<PersonalizedOffer> GenerateAtRiskOffers(PlayerProfile profile)
        {
            List<PersonalizedOffer> offers = new List<PersonalizedOffer>();
            
            // Retention offers for at-risk players
            offers.Add(new PersonalizedOffer
            {
                id = Guid.NewGuid().ToString(),
                title = "We Miss You!",
                description = "Come back with 70% off everything!",
                discount = 0.7f,
                originalPrice = 19.99f,
                discountedPrice = 5.99f,
                items = new List<string> { "coins_1000", "gems_300", "energy_pack" },
                urgencyLevel = UrgencyLevel.High,
                expirationTime = DateTime.Now.AddHours(48),
                targetAudience = PlayerSegment.AtRisk
            });
            
            return offers;
        }
        
        private List<PersonalizedOffer> GenerateCasualOffers(PlayerProfile profile)
        {
            List<PersonalizedOffer> offers = new List<PersonalizedOffer>();
            
            // General offers for casual players
            offers.Add(new PersonalizedOffer
            {
                id = Guid.NewGuid().ToString(),
                title = "Daily Special",
                description = "Get 25% off today's special!",
                discount = 0.25f,
                originalPrice = 9.99f,
                discountedPrice = 7.49f,
                items = new List<string> { "coins_500", "gems_100" },
                urgencyLevel = UrgencyLevel.Low,
                expirationTime = DateTime.Now.AddHours(12),
                targetAudience = PlayerSegment.Casual
            });
            
            return offers;
        }
        
        #endregion
        
        #region Churn Prediction System
        
        private IEnumerator ChurnPredictionCoroutine()
        {
            while (true)
            {
                PredictChurnForAllPlayers();
                yield return new WaitForSeconds(churnCheckInterval);
            }
        }
        
        private void PredictChurnForAllPlayers()
        {
            foreach (var playerId in playerProfiles.Keys)
            {
                PredictChurnForPlayer(playerId);
            }
        }
        
        private void PredictChurnForPlayer(string playerId)
        {
            if (!playerProfiles.ContainsKey(playerId)) return;
            
            PlayerProfile profile = playerProfiles[playerId];
            float churnProbability = CalculateChurnProbability(profile);
            
            churnProbabilities[playerId] = churnProbability;
            
            // Track churn prediction
            TrackEvent("churn_predicted", new Dictionary<string, object>
            {
                {"player_id", playerId},
                {"churn_probability", churnProbability},
                {"is_at_risk", churnProbability > churnThreshold}
            });
            
            if (churnProbability > churnThreshold)
            {
                OnChurnPredicted?.Invoke(playerId, churnProbability);
            }
        }
        
        private float CalculateChurnProbability(PlayerProfile profile)
        {
            // Calculate churn probability based on various factors
            float daysSinceLastLogin = (float)(DateTime.Now - profile.lastLoginTime).TotalDays;
            float daysSinceLastPurchase = (float)(DateTime.Now - profile.lastPurchaseTime).TotalDays;
            float sessionDuration = profile.averageSessionDuration;
            float sessionsPerDay = profile.sessionsPerDay;
            float levelCompletionRate = profile.levelsCompleted / Mathf.Max(profile.levelsAttempted, 1f);
            
            // Calculate individual risk factors
            float loginRisk = Mathf.Clamp01(daysSinceLastLogin / 7f); // 7 days = 100% risk
            float purchaseRisk = Mathf.Clamp01(daysSinceLastPurchase / 14f); // 14 days = 100% risk
            float engagementRisk = Mathf.Clamp01(1f - (sessionDuration / 1800f)); // 30 min = 0% risk
            float sessionRisk = Mathf.Clamp01(1f - (sessionsPerDay / 5f)); // 5 sessions = 0% risk
            float completionRisk = Mathf.Clamp01(1f - levelCompletionRate);
            
            // Weighted average
            float churnProbability = (loginRisk * 0.3f + purchaseRisk * 0.25f + engagementRisk * 0.2f + sessionRisk * 0.15f + completionRisk * 0.1f);
            
            return Mathf.Clamp01(churnProbability);
        }
        
        #endregion
        
        #region Player Segmentation System
        
        private IEnumerator PlayerSegmentationCoroutine()
        {
            while (true)
            {
                UpdatePlayerSegments();
                yield return new WaitForSeconds(segmentUpdateInterval);
            }
        }
        
        private void UpdatePlayerSegments()
        {
            foreach (var playerId in playerProfiles.Keys)
            {
                UpdatePlayerSegment(playerId);
            }
        }
        
        private void UpdatePlayerSegment(string playerId)
        {
            if (!playerProfiles.ContainsKey(playerId)) return;
            
            PlayerProfile profile = playerProfiles[playerId];
            PlayerSegment newSegment = DeterminePlayerSegment(profile);
            
            if (playerSegments.GetValueOrDefault(playerId, PlayerSegment.Casual) != newSegment)
            {
                playerSegments[playerId] = newSegment;
                
                // Track segment change
                TrackEvent("player_segment_updated", new Dictionary<string, object>
                {
                    {"player_id", playerId},
                    {"old_segment", playerSegments.GetValueOrDefault(playerId, PlayerSegment.Casual).ToString()},
                    {"new_segment", newSegment.ToString()}
                });
                
                OnPlayerSegmentUpdated?.Invoke(playerId, newSegment);
            }
        }
        
        private PlayerSegment DeterminePlayerSegment(PlayerProfile profile)
        {
            // Calculate spending tier
            SpendingTier spendingTier = SpendingTier.Low;
            if (profile.totalSpent > 100f) spendingTier = SpendingTier.High;
            else if (profile.totalSpent > 20f) spendingTier = SpendingTier.Medium;
            
            // Calculate engagement level
            EngagementLevel engagementLevel = EngagementLevel.Low;
            if (profile.sessionsPerDay > 5 && profile.averageSessionDuration > 1800f) engagementLevel = EngagementLevel.High;
            else if (profile.sessionsPerDay > 2 && profile.averageSessionDuration > 600f) engagementLevel = EngagementLevel.Medium;
            
            // Determine segment
            if (spendingTier == SpendingTier.High && engagementLevel == EngagementLevel.High)
                return PlayerSegment.Whale;
            else if (spendingTier == SpendingTier.High && engagementLevel == EngagementLevel.Medium)
                return PlayerSegment.Spender;
            else if (spendingTier == SpendingTier.Medium && engagementLevel == EngagementLevel.High)
                return PlayerSegment.Engaged;
            else if (spendingTier == SpendingTier.Low && engagementLevel == EngagementLevel.High)
                return PlayerSegment.FreePlayer;
            else if (spendingTier == SpendingTier.Low && engagementLevel == EngagementLevel.Low)
                return PlayerSegment.AtRisk;
            else
                return PlayerSegment.Casual;
        }
        
        #endregion
        
        #region Recommendation Engine
        
        private IEnumerator RecommendationEngineCoroutine()
        {
            while (true)
            {
                GenerateRecommendationsForAllPlayers();
                yield return new WaitForSeconds(recommendationUpdateInterval);
            }
        }
        
        private void GenerateRecommendationsForAllPlayers()
        {
            foreach (var playerId in playerProfiles.Keys)
            {
                GenerateRecommendationsForPlayer(playerId);
            }
        }
        
        private void GenerateRecommendationsForPlayer(string playerId)
        {
            if (!playerProfiles.ContainsKey(playerId)) return;
            
            PlayerProfile profile = playerProfiles[playerId];
            List<Recommendation> playerRecommendations = GenerateRecommendations(profile);
            
            recommendations[playerId] = playerRecommendations;
            
            // Track recommendations
            TrackEvent("recommendations_generated", new Dictionary<string, object>
            {
                {"player_id", playerId},
                {"recommendations_count", playerRecommendations.Count}
            });
            
            OnRecommendationsUpdated?.Invoke(playerId, playerRecommendations);
        }
        
        private List<Recommendation> GenerateRecommendations(PlayerProfile profile)
        {
            List<Recommendation> recommendations = new List<Recommendation>();
            
            // Generate recommendations based on player behavior
            if (profile.energy < 5)
            {
                recommendations.Add(new Recommendation
                {
                    id = Guid.NewGuid().ToString(),
                    type = RecommendationType.Energy,
                    title = "Low Energy",
                    description = "Your energy is running low. Consider buying an energy pack!",
                    priority = RecommendationPriority.High,
                    action = "buy_energy_pack"
                });
            }
            
            if (profile.coins < 100)
            {
                recommendations.Add(new Recommendation
                {
                    id = Guid.NewGuid().ToString(),
                    type = RecommendationType.Currency,
                    title = "Low Coins",
                    description = "You're running low on coins. Complete more levels to earn coins!",
                    priority = RecommendationPriority.Medium,
                    action = "play_levels"
                });
            }
            
            if (profile.currentStreak > 0)
            {
                recommendations.Add(new Recommendation
                {
                    id = Guid.NewGuid().ToString(),
                    type = RecommendationType.Streak,
                    title = "Maintain Streak",
                    description = $"Keep your {profile.currentStreak} day streak going!",
                    priority = RecommendationPriority.High,
                    action = "play_daily"
                });
            }
            
            if (profile.friendsCount < 5)
            {
                recommendations.Add(new Recommendation
                {
                    id = Guid.NewGuid().ToString(),
                    type = RecommendationType.Social,
                    title = "Add Friends",
                    description = "Add friends to compete and share achievements!",
                    priority = RecommendationPriority.Low,
                    action = "add_friends"
                });
            }
            
            // Limit number of recommendations
            if (recommendations.Count > maxRecommendations)
            {
                recommendations = recommendations.GetRange(0, maxRecommendations);
            }
            
            return recommendations;
        }
        
        #endregion
        
        #region Helper Methods
        
        private void TrackEvent(string eventName, Dictionary<string, object> properties)
        {
            if (analyticsManager)
            {
                analyticsManager.TrackCustomEvent(eventName, properties);
            }
        }
        
        #endregion
        
        #region Public API
        
        public void UpdatePlayerProfile(string playerId, PlayerProfile profile)
        {
            playerProfiles[playerId] = profile;
        }
        
        public PlayerProfile GetPlayerProfile(string playerId)
        {
            return playerProfiles.GetValueOrDefault(playerId, new PlayerProfile());
        }
        
        public float GetDifficultyForPlayer(string playerId)
        {
            return difficultyScores.GetValueOrDefault(playerId, baseDifficulty);
        }
        
        public List<PersonalizedOffer> GetOffersForPlayer(string playerId)
        {
            return activeOffers.GetValueOrDefault(playerId, new List<PersonalizedOffer>());
        }
        
        public float GetChurnProbability(string playerId)
        {
            return churnProbabilities.GetValueOrDefault(playerId, 0f);
        }
        
        public PlayerSegment GetPlayerSegment(string playerId)
        {
            return playerSegments.GetValueOrDefault(playerId, PlayerSegment.Casual);
        }
        
        public List<Recommendation> GetRecommendations(string playerId)
        {
            return recommendations.GetValueOrDefault(playerId, new List<Recommendation>());
        }
        
        #endregion
    }
    
    #region Data Classes
    
    [System.Serializable]
    public class PlayerProfile
    {
        public string playerId;
        public float totalSpent;
        public int levelsCompleted;
        public int levelsAttempted;
        public float totalScore;
        public float totalPlayTime;
        public float averageSessionDuration;
        public float sessionsPerDay;
        public float levelCompletionRate;
        public float preferredDifficulty;
        public DateTime lastLoginTime;
        public DateTime lastPurchaseTime;
        public int currentStreak;
        public float energy;
        public float coins;
        public int friendsCount;
        public List<string> purchasedItems;
        public List<string> favoriteItems;
        public Dictionary<string, float> behaviorMetrics;
    }
    
    [System.Serializable]
    public class PersonalizedOffer
    {
        public string id;
        public string title;
        public string description;
        public float discount;
        public float originalPrice;
        public float discountedPrice;
        public List<string> items;
        public UrgencyLevel urgencyLevel;
        public DateTime expirationTime;
        public PlayerSegment targetAudience;
    }
    
    [System.Serializable]
    public class Recommendation
    {
        public string id;
        public RecommendationType type;
        public string title;
        public string description;
        public RecommendationPriority priority;
        public string action;
    }
    
    public enum PlayerSegment
    {
        Whale,
        Spender,
        Engaged,
        FreePlayer,
        AtRisk,
        Casual
    }
    
    public enum SpendingTier
    {
        Low,
        Medium,
        High
    }
    
    public enum EngagementLevel
    {
        Low,
        Medium,
        High
    }
    
    public enum UrgencyLevel
    {
        Low,
        Medium,
        High
    }
    
    public enum RecommendationType
    {
        Energy,
        Currency,
        Streak,
        Social,
        Achievement,
        Purchase
    }
    
    public enum RecommendationPriority
    {
        Low,
        Medium,
        High
    }
    
    #endregion
}