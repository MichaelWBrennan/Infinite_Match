using UnityEngine;
using System.Collections.Generic;
using System;
using Match3Game.Analytics;

namespace Match3Game.Monetization
{
    /// <summary>
    /// Advanced monetization manager with AI-powered personalization
    /// Implements dynamic pricing, personalized offers, and behavioral targeting
    /// </summary>
    public class MonetizationManager : MonoBehaviour
    {
        [Header("Dynamic Pricing")]
        [SerializeField] private bool enableDynamicPricing = true;
        [SerializeField] private float basePriceMultiplier = 1.0f;
        [SerializeField] private float maxPriceMultiplier = 3.0f;
        [SerializeField] private float minPriceMultiplier = 0.5f;
        
        [Header("Player Segmentation")]
        [SerializeField] private bool enablePlayerSegmentation = true;
        [SerializeField] private int maxSegments = 10;
        [SerializeField] private float segmentUpdateInterval = 3600f; // 1 hour
        
        [Header("A/B Testing")]
        [SerializeField] private bool enableABTesting = true;
        [SerializeField] private int maxTestVariants = 5;
        [SerializeField] private float testDuration = 604800f; // 1 week
        
        [Header("Retention Offers")]
        [SerializeField] private bool enableRetentionOffers = true;
        [SerializeField] private float churnPredictionThreshold = 0.7f;
        [SerializeField] private float retentionOfferDiscount = 0.5f;
        
        // Private variables
        private Dictionary<string, PlayerSegment> playerSegments = new Dictionary<string, PlayerSegment>();
        private Dictionary<string, ABTest> activeTests = new Dictionary<string, ABTest>();
        private Dictionary<string, PersonalizedOffer> activeOffers = new Dictionary<string, PersonalizedOffer>();
        private Dictionary<string, float> playerSpendingBehavior = new Dictionary<string, float>();
        private Dictionary<string, float> playerEngagementMetrics = new Dictionary<string, float>();
        private GameAnalyticsManager analyticsManager;
        
        // Events
        public System.Action<PersonalizedOffer> OnNewOfferGenerated;
        public System.Action<string, float> OnPriceUpdated;
        public System.Action<PlayerSegment> OnPlayerSegmentUpdated;
        public System.Action<ABTest> OnABTestStarted;
        
        private void Start()
        {
            InitializeMonetization();
        }
        
        private void InitializeMonetization()
        {
            analyticsManager = FindObjectOfType<GameAnalyticsManager>();
            
            // Load saved data
            LoadMonetizationData();
            
            // Start monetization systems
            if (enableDynamicPricing)
                StartCoroutine(DynamicPricingCoroutine());
            
            if (enablePlayerSegmentation)
                StartCoroutine(PlayerSegmentationCoroutine());
            
            if (enableABTesting)
                StartCoroutine(ABTestingCoroutine());
            
            if (enableRetentionOffers)
                StartCoroutine(RetentionOffersCoroutine());
            
            // Track monetization initialization
            TrackEvent("monetization_initialized", new Dictionary<string, object>
            {
                {"dynamic_pricing_enabled", enableDynamicPricing},
                {"player_segmentation_enabled", enablePlayerSegmentation},
                {"ab_testing_enabled", enableABTesting},
                {"retention_offers_enabled", enableRetentionOffers}
            });
        }
        
        #region Dynamic Pricing System
        
        private System.Collections.IEnumerator DynamicPricingCoroutine()
        {
            while (true)
            {
                UpdateDynamicPricing();
                yield return new WaitForSeconds(300f); // Update every 5 minutes
            }
        }
        
        private void UpdateDynamicPricing()
        {
            // Analyze player spending behavior
            AnalyzeSpendingBehavior();
            
            // Update prices based on demand and player behavior
            UpdateItemPrices();
            
            // Track pricing updates
            TrackEvent("dynamic_pricing_updated", new Dictionary<string, object>
            {
                {"base_multiplier", basePriceMultiplier},
                {"max_multiplier", maxPriceMultiplier},
                {"min_multiplier", minPriceMultiplier}
            });
        }
        
        private void AnalyzeSpendingBehavior()
        {
            // Analyze recent spending patterns
            float totalSpent = 0f;
            int purchaseCount = 0;
            
            foreach (var spending in playerSpendingBehavior)
            {
                totalSpent += spending.Value;
                purchaseCount++;
            }
            
            // Calculate average spending per purchase
            float avgSpending = purchaseCount > 0 ? totalSpent / purchaseCount : 0f;
            
            // Adjust pricing based on spending behavior
            if (avgSpending > 10f) // High spenders
            {
                basePriceMultiplier = Mathf.Min(basePriceMultiplier * 1.1f, maxPriceMultiplier);
            }
            else if (avgSpending < 2f) // Low spenders
            {
                basePriceMultiplier = Mathf.Max(basePriceMultiplier * 0.9f, minPriceMultiplier);
            }
        }
        
        private void UpdateItemPrices()
        {
            // Update prices for all monetizable items
            string[] items = { "coins_100", "coins_500", "coins_1000", "gems_50", "gems_100", "gems_500", "energy_pack", "premium_pack" };
            
            foreach (string item in items)
            {
                float newPrice = CalculateDynamicPrice(item);
                OnPriceUpdated?.Invoke(item, newPrice);
            }
        }
        
        private float CalculateDynamicPrice(string itemId)
        {
            float basePrice = GetBasePrice(itemId);
            float demandMultiplier = CalculateDemandMultiplier(itemId);
            float playerSegmentMultiplier = CalculatePlayerSegmentMultiplier(itemId);
            
            return basePrice * basePriceMultiplier * demandMultiplier * playerSegmentMultiplier;
        }
        
        private float GetBasePrice(string itemId)
        {
            // Base prices for items
            Dictionary<string, float> basePrices = new Dictionary<string, float>
            {
                { "coins_100", 0.99f },
                { "coins_500", 4.99f },
                { "coins_1000", 9.99f },
                { "gems_50", 1.99f },
                { "gems_100", 3.99f },
                { "gems_500", 19.99f },
                { "energy_pack", 2.99f },
                { "premium_pack", 9.99f }
            };
            
            return basePrices.ContainsKey(itemId) ? basePrices[itemId] : 0.99f;
        }
        
        private float CalculateDemandMultiplier(string itemId)
        {
            // Calculate demand based on recent purchases
            float recentPurchases = GetRecentPurchaseCount(itemId);
            float avgPurchases = GetAveragePurchaseCount(itemId);
            
            if (avgPurchases > 0)
            {
                float demandRatio = recentPurchases / avgPurchases;
                return Mathf.Clamp(demandRatio, 0.5f, 2.0f);
            }
            
            return 1.0f;
        }
        
        private float CalculatePlayerSegmentMultiplier(string itemId)
        {
            // Calculate multiplier based on player segment
            string playerId = GetCurrentPlayerId();
            if (playerSegments.ContainsKey(playerId))
            {
                PlayerSegment segment = playerSegments[playerId];
                return segment.priceMultiplier;
            }
            
            return 1.0f;
        }
        
        #endregion
        
        #region Player Segmentation System
        
        private System.Collections.IEnumerator PlayerSegmentationCoroutine()
        {
            while (true)
            {
                UpdatePlayerSegments();
                yield return new WaitForSeconds(segmentUpdateInterval);
            }
        }
        
        private void UpdatePlayerSegments()
        {
            string playerId = GetCurrentPlayerId();
            
            // Analyze player behavior
            PlayerBehaviorData behavior = AnalyzePlayerBehavior(playerId);
            
            // Determine player segment
            PlayerSegment segment = DeterminePlayerSegment(behavior);
            
            // Update player segment
            playerSegments[playerId] = segment;
            
            // Generate personalized offers based on segment
            GeneratePersonalizedOffers(segment);
            
            OnPlayerSegmentUpdated?.Invoke(segment);
            
            // Track segment update
            TrackEvent("player_segment_updated", new Dictionary<string, object>
            {
                {"player_id", playerId},
                {"segment_type", segment.type},
                {"spending_tier", segment.spendingTier},
                {"engagement_level", segment.engagementLevel}
            });
        }
        
        private PlayerBehaviorData AnalyzePlayerBehavior(string playerId)
        {
            // Analyze spending behavior
            float totalSpent = playerSpendingBehavior.ContainsKey(playerId) ? playerSpendingBehavior[playerId] : 0f;
            int purchaseCount = GetPurchaseCount(playerId);
            float avgPurchaseValue = purchaseCount > 0 ? totalSpent / purchaseCount : 0f;
            
            // Analyze engagement behavior
            float sessionDuration = playerEngagementMetrics.ContainsKey($"{playerId}_session_duration") ? playerEngagementMetrics[$"{playerId}_session_duration"] : 0f;
            int sessionsPerDay = GetSessionsPerDay(playerId);
            int levelsCompleted = GetLevelsCompleted(playerId);
            
            return new PlayerBehaviorData
            {
                totalSpent = totalSpent,
                purchaseCount = purchaseCount,
                avgPurchaseValue = avgPurchaseValue,
                sessionDuration = sessionDuration,
                sessionsPerDay = sessionsPerDay,
                levelsCompleted = levelsCompleted,
                lastPurchaseTime = GetLastPurchaseTime(playerId),
                lastLoginTime = GetLastLoginTime(playerId)
            };
        }
        
        private PlayerSegment DeterminePlayerSegment(PlayerBehaviorData behavior)
        {
            // Determine spending tier
            SpendingTier spendingTier = SpendingTier.Low;
            if (behavior.totalSpent > 100f) spendingTier = SpendingTier.High;
            else if (behavior.totalSpent > 20f) spendingTier = SpendingTier.Medium;
            
            // Determine engagement level
            EngagementLevel engagementLevel = EngagementLevel.Low;
            if (behavior.sessionsPerDay > 5 && behavior.sessionDuration > 1800f) engagementLevel = EngagementLevel.High;
            else if (behavior.sessionsPerDay > 2 && behavior.sessionDuration > 600f) engagementLevel = EngagementLevel.Medium;
            
            // Determine segment type
            SegmentType segmentType = SegmentType.Casual;
            if (spendingTier == SpendingTier.High && engagementLevel == EngagementLevel.High)
                segmentType = SegmentType.Whale;
            else if (spendingTier == SpendingTier.High && engagementLevel == EngagementLevel.Medium)
                segmentType = SegmentType.Spender;
            else if (spendingTier == SpendingTier.Medium && engagementLevel == EngagementLevel.High)
                segmentType = SegmentType.Engaged;
            else if (spendingTier == SpendingTier.Low && engagementLevel == EngagementLevel.High)
                segmentType = SegmentType.FreePlayer;
            else if (spendingTier == SpendingTier.Low && engagementLevel == EngagementLevel.Low)
                segmentType = SegmentType.AtRisk;
            
            // Calculate price multiplier based on segment
            float priceMultiplier = CalculateSegmentPriceMultiplier(segmentType);
            
            return new PlayerSegment
            {
                type = segmentType,
                spendingTier = spendingTier,
                engagementLevel = engagementLevel,
                priceMultiplier = priceMultiplier,
                behaviorData = behavior
            };
        }
        
        private float CalculateSegmentPriceMultiplier(SegmentType segmentType)
        {
            switch (segmentType)
            {
                case SegmentType.Whale: return 1.5f; // Higher prices for whales
                case SegmentType.Spender: return 1.2f; // Slightly higher prices
                case SegmentType.Engaged: return 1.0f; // Normal prices
                case SegmentType.FreePlayer: return 0.8f; // Lower prices to convert
                case SegmentType.AtRisk: return 0.6f; // Much lower prices to retain
                default: return 1.0f;
            }
        }
        
        #endregion
        
        #region A/B Testing System
        
        private System.Collections.IEnumerator ABTestingCoroutine()
        {
            while (true)
            {
                // Check for new A/B tests to start
                CheckForNewABTests();
                
                // Update existing A/B tests
                UpdateABTests();
                
                yield return new WaitForSeconds(3600f); // Check every hour
            }
        }
        
        private void CheckForNewABTests()
        {
            // Check if we should start new A/B tests
            if (activeTests.Count < maxTestVariants)
            {
                // Start new A/B test
                StartABTest("pricing_test", "Test different pricing strategies");
            }
        }
        
        private void StartABTest(string testId, string description)
        {
            ABTest test = new ABTest
            {
                id = testId,
                description = description,
                startTime = DateTime.Now,
                duration = testDuration,
                variants = GenerateTestVariants(testId),
                participants = new Dictionary<string, int>(),
                results = new Dictionary<string, float>()
            };
            
            activeTests[testId] = test;
            OnABTestStarted?.Invoke(test);
            
            // Track A/B test start
            TrackEvent("ab_test_started", new Dictionary<string, object>
            {
                {"test_id", testId},
                {"description", description},
                {"variants_count", test.variants.Count}
            });
        }
        
        private List<ABTestVariant> GenerateTestVariants(string testId)
        {
            List<ABTestVariant> variants = new List<ABTestVariant>();
            
            switch (testId)
            {
                case "pricing_test":
                    variants.Add(new ABTestVariant { id = "control", name = "Control", priceMultiplier = 1.0f });
                    variants.Add(new ABTestVariant { id = "high", name = "High Price", priceMultiplier = 1.5f });
                    variants.Add(new ABTestVariant { id = "low", name = "Low Price", priceMultiplier = 0.7f });
                    break;
            }
            
            return variants;
        }
        
        private void UpdateABTests()
        {
            foreach (var test in activeTests.Values)
            {
                // Check if test should end
                if (DateTime.Now > test.startTime.AddSeconds(test.duration))
                {
                    EndABTest(test);
                }
                else
                {
                    // Update test results
                    UpdateTestResults(test);
                }
            }
        }
        
        private void EndABTest(ABTest test)
        {
            // Analyze results
            AnalyzeTestResults(test);
            
            // Remove from active tests
            activeTests.Remove(test.id);
            
            // Track A/B test end
            TrackEvent("ab_test_ended", new Dictionary<string, object>
            {
                {"test_id", test.id},
                {"duration", test.duration},
                {"participants_count", test.participants.Count}
            });
        }
        
        private void AnalyzeTestResults(ABTest test)
        {
            // Find best performing variant
            string bestVariant = "control";
            float bestResult = 0f;
            
            foreach (var result in test.results)
            {
                if (result.Value > bestResult)
                {
                    bestResult = result.Value;
                    bestVariant = result.Key;
                }
            }
            
            // Apply best variant globally
            ApplyTestResults(test.id, bestVariant);
        }
        
        private void ApplyTestResults(string testId, string bestVariant)
        {
            switch (testId)
            {
                case "pricing_test":
                    // Apply best pricing strategy
                    ABTest test = activeTests[testId];
                    if (test.variants.Exists(v => v.id == bestVariant))
                    {
                        ABTestVariant variant = test.variants.Find(v => v.id == bestVariant);
                        basePriceMultiplier = variant.priceMultiplier;
                    }
                    break;
            }
        }
        
        #endregion
        
        #region Retention Offers System
        
        private System.Collections.IEnumerator RetentionOffersCoroutine()
        {
            while (true)
            {
                // Check for players at risk of churning
                CheckForAtRiskPlayers();
                
                // Generate retention offers
                GenerateRetentionOffers();
                
                yield return new WaitForSeconds(1800f); // Check every 30 minutes
            }
        }
        
        private void CheckForAtRiskPlayers()
        {
            string playerId = GetCurrentPlayerId();
            
            // Calculate churn probability
            float churnProbability = CalculateChurnProbability(playerId);
            
            if (churnProbability > churnPredictionThreshold)
            {
                // Player is at risk of churning
                GenerateRetentionOffer(playerId, churnProbability);
            }
        }
        
        private float CalculateChurnProbability(string playerId)
        {
            // Simple churn prediction based on engagement metrics
            float daysSinceLastLogin = (float)(DateTime.Now - GetLastLoginTime(playerId)).TotalDays;
            float daysSinceLastPurchase = (float)(DateTime.Now - GetLastPurchaseTime(playerId)).TotalDays;
            float sessionDuration = playerEngagementMetrics.ContainsKey($"{playerId}_session_duration") ? playerEngagementMetrics[$"{playerId}_session_duration"] : 0f;
            
            // Calculate churn probability (0-1)
            float loginChurn = Mathf.Clamp01(daysSinceLastLogin / 7f); // 7 days = 100% churn risk
            float purchaseChurn = Mathf.Clamp01(daysSinceLastPurchase / 14f); // 14 days = 100% churn risk
            float engagementChurn = Mathf.Clamp01(1f - (sessionDuration / 1800f)); // 30 min = 0% churn risk
            
            return (loginChurn + purchaseChurn + engagementChurn) / 3f;
        }
        
        private void GenerateRetentionOffer(string playerId, float churnProbability)
        {
            PersonalizedOffer offer = new PersonalizedOffer
            {
                id = Guid.NewGuid().ToString(),
                playerId = playerId,
                title = "Don't Go! Special Offer Just for You!",
                description = "Get 50% off everything for the next 24 hours!",
                discount = retentionOfferDiscount,
                duration = 86400f, // 24 hours
                startTime = DateTime.Now,
                items = new List<string> { "coins_1000", "gems_100", "energy_pack" },
                originalPrice = 9.99f,
                discountedPrice = 4.99f,
                urgencyLevel = churnProbability > 0.8f ? UrgencyLevel.High : UrgencyLevel.Medium
            };
            
            activeOffers[playerId] = offer;
            OnNewOfferGenerated?.Invoke(offer);
            
            // Track retention offer
            TrackEvent("retention_offer_generated", new Dictionary<string, object>
            {
                {"player_id", playerId},
                {"churn_probability", churnProbability},
                {"discount", offer.discount},
                {"urgency_level", offer.urgencyLevel.ToString()}
            });
        }
        
        #endregion
        
        #region Personalized Offers System
        
        private void GeneratePersonalizedOffers(PlayerSegment segment)
        {
            // Generate offers based on player segment
            switch (segment.type)
            {
                case SegmentType.Whale:
                    GenerateWhaleOffers(segment);
                    break;
                case SegmentType.Spender:
                    GenerateSpenderOffers(segment);
                    break;
                case SegmentType.Engaged:
                    GenerateEngagedOffers(segment);
                    break;
                case SegmentType.FreePlayer:
                    GenerateFreePlayerOffers(segment);
                    break;
                case SegmentType.AtRisk:
                    GenerateAtRiskOffers(segment);
                    break;
            }
        }
        
        private void GenerateWhaleOffers(PlayerSegment segment)
        {
            // High-value offers for whales
            PersonalizedOffer offer = new PersonalizedOffer
            {
                id = Guid.NewGuid().ToString(),
                playerId = GetCurrentPlayerId(),
                title = "Exclusive VIP Offer",
                description = "Get 30% off our premium pack!",
                discount = 0.3f,
                duration = 3600f, // 1 hour
                startTime = DateTime.Now,
                items = new List<string> { "premium_pack", "gems_500" },
                originalPrice = 19.99f,
                discountedPrice = 13.99f,
                urgencyLevel = UrgencyLevel.Medium
            };
            
            activeOffers[offer.playerId] = offer;
            OnNewOfferGenerated?.Invoke(offer);
        }
        
        private void GenerateSpenderOffers(PlayerSegment segment)
        {
            // Medium-value offers for spenders
            PersonalizedOffer offer = new PersonalizedOffer
            {
                id = Guid.NewGuid().ToString(),
                playerId = GetCurrentPlayerId(),
                title = "Special Deal for You!",
                description = "Get 25% off coins and gems!",
                discount = 0.25f,
                duration = 7200f, // 2 hours
                startTime = DateTime.Now,
                items = new List<string> { "coins_500", "gems_100" },
                originalPrice = 7.99f,
                discountedPrice = 5.99f,
                urgencyLevel = UrgencyLevel.Medium
            };
            
            activeOffers[offer.playerId] = offer;
            OnNewOfferGenerated?.Invoke(offer);
        }
        
        private void GenerateEngagedOffers(PlayerSegment segment)
        {
            // Engagement-focused offers
            PersonalizedOffer offer = new PersonalizedOffer
            {
                id = Guid.NewGuid().ToString(),
                playerId = GetCurrentPlayerId(),
                title = "Keep the Fun Going!",
                description = "Get extra energy to keep playing!",
                discount = 0.4f,
                duration = 1800f, // 30 minutes
                startTime = DateTime.Now,
                items = new List<string> { "energy_pack" },
                originalPrice = 2.99f,
                discountedPrice = 1.79f,
                urgencyLevel = UrgencyLevel.Low
            };
            
            activeOffers[offer.playerId] = offer;
            OnNewOfferGenerated?.Invoke(offer);
        }
        
        private void GenerateFreePlayerOffers(PlayerSegment segment)
        {
            // Conversion offers for free players
            PersonalizedOffer offer = new PersonalizedOffer
            {
                id = Guid.NewGuid().ToString(),
                playerId = GetCurrentPlayerId(),
                title = "First Purchase Bonus!",
                description = "Get 50% off your first purchase!",
                discount = 0.5f,
                duration = 86400f, // 24 hours
                startTime = DateTime.Now,
                items = new List<string> { "coins_100", "gems_50" },
                originalPrice = 1.99f,
                discountedPrice = 0.99f,
                urgencyLevel = UrgencyLevel.High
            };
            
            activeOffers[offer.playerId] = offer;
            OnNewOfferGenerated?.Invoke(offer);
        }
        
        private void GenerateAtRiskOffers(PlayerSegment segment)
        {
            // Retention offers for at-risk players
            PersonalizedOffer offer = new PersonalizedOffer
            {
                id = Guid.NewGuid().ToString(),
                playerId = GetCurrentPlayerId(),
                title = "We Miss You!",
                description = "Come back with 60% off everything!",
                discount = 0.6f,
                duration = 172800f, // 48 hours
                startTime = DateTime.Now,
                items = new List<string> { "coins_1000", "gems_200", "energy_pack" },
                originalPrice = 12.99f,
                discountedPrice = 5.19f,
                urgencyLevel = UrgencyLevel.High
            };
            
            activeOffers[offer.playerId] = offer;
            OnNewOfferGenerated?.Invoke(offer);
        }
        
        #endregion
        
        #region Helper Methods
        
        private string GetCurrentPlayerId()
        {
            return SystemInfo.deviceUniqueIdentifier;
        }
        
        private float GetRecentPurchaseCount(string itemId)
        {
            // Get recent purchase count for item
            return UnityEngine.Random.Range(0f, 10f); // Placeholder
        }
        
        private float GetAveragePurchaseCount(string itemId)
        {
            // Get average purchase count for item
            return UnityEngine.Random.Range(1f, 5f); // Placeholder
        }
        
        private int GetPurchaseCount(string playerId)
        {
            return UnityEngine.Random.Range(0, 20); // Placeholder
        }
        
        private int GetSessionsPerDay(string playerId)
        {
            return UnityEngine.Random.Range(1, 10); // Placeholder
        }
        
        private int GetLevelsCompleted(string playerId)
        {
            return UnityEngine.Random.Range(0, 100); // Placeholder
        }
        
        private DateTime GetLastPurchaseTime(string playerId)
        {
            return DateTime.Now.AddDays(-UnityEngine.Random.Range(0, 30)); // Placeholder
        }
        
        private DateTime GetLastLoginTime(string playerId)
        {
            return DateTime.Now.AddDays(-UnityEngine.Random.Range(0, 7)); // Placeholder
        }
        
        private void UpdateTestResults(ABTest test)
        {
            // Update A/B test results based on current performance
            foreach (var variant in test.variants)
            {
                float result = UnityEngine.Random.Range(0f, 1f); // Placeholder
                test.results[variant.id] = result;
            }
        }
        
        #endregion
        
        #region Data Management
        
        private void LoadMonetizationData()
        {
            // Load from PlayerPrefs or cloud save
            // Implementation depends on your data storage solution
        }
        
        private void SaveMonetizationData()
        {
            // Save to PlayerPrefs or cloud save
            // Implementation depends on your data storage solution
        }
        
        #endregion
        
        #region Analytics
        
        private void TrackEvent(string eventName, Dictionary<string, object> properties)
        {
            if (analyticsManager)
            {
                analyticsManager.TrackCustomEvent(eventName, properties);
            }
        }
        
        #endregion
        
        #region Public API
        
        public PersonalizedOffer GetPersonalizedOffer(string playerId)
        {
            return activeOffers.ContainsKey(playerId) ? activeOffers[playerId] : null;
        }
        
        public PlayerSegment GetPlayerSegment(string playerId)
        {
            return playerSegments.ContainsKey(playerId) ? playerSegments[playerId] : null;
        }
        
        public float GetDynamicPrice(string itemId)
        {
            return CalculateDynamicPrice(itemId);
        }
        
        public void RecordPurchase(string playerId, string itemId, float amount)
        {
            // Record purchase for analytics
            if (playerSpendingBehavior.ContainsKey(playerId))
                playerSpendingBehavior[playerId] += amount;
            else
                playerSpendingBehavior[playerId] = amount;
            
            // Track purchase
            TrackEvent("purchase_recorded", new Dictionary<string, object>
            {
                {"player_id", playerId},
                {"item_id", itemId},
                {"amount", amount}
            });
        }
        
        #endregion
        
        private void OnDestroy()
        {
            SaveMonetizationData();
        }
    }
    
    #region Data Classes
    
    [System.Serializable]
    public class PlayerSegment
    {
        public SegmentType type;
        public SpendingTier spendingTier;
        public EngagementLevel engagementLevel;
        public float priceMultiplier;
        public PlayerBehaviorData behaviorData;
    }
    
    [System.Serializable]
    public class PlayerBehaviorData
    {
        public float totalSpent;
        public int purchaseCount;
        public float avgPurchaseValue;
        public float sessionDuration;
        public int sessionsPerDay;
        public int levelsCompleted;
        public DateTime lastPurchaseTime;
        public DateTime lastLoginTime;
    }
    
    [System.Serializable]
    public class PersonalizedOffer
    {
        public string id;
        public string playerId;
        public string title;
        public string description;
        public float discount;
        public float duration;
        public DateTime startTime;
        public List<string> items;
        public float originalPrice;
        public float discountedPrice;
        public UrgencyLevel urgencyLevel;
    }
    
    [System.Serializable]
    public class ABTest
    {
        public string id;
        public string description;
        public DateTime startTime;
        public float duration;
        public List<ABTestVariant> variants;
        public Dictionary<string, int> participants;
        public Dictionary<string, float> results;
    }
    
    [System.Serializable]
    public class ABTestVariant
    {
        public string id;
        public string name;
        public float priceMultiplier;
    }
    
    public enum SegmentType
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
    
    #endregion
}