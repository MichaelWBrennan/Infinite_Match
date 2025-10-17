using System;
using System.Collections.Generic;
using UnityEngine;
using Evergreen.Core;

namespace Evergreen.Economy
{
    /// <summary>
    /// Store optimization system implementing industry best practices
    /// Based on data from top-grossing mobile games and proven monetization strategies
    /// </summary>
    public class StoreOptimizer : MonoBehaviour
    {
        [Header("Optimization Settings")]
        [SerializeField] private bool enableDynamicPricing = true;
        [SerializeField] private bool enablePersonalization = true;
        [SerializeField] private bool enableABTesting = true;
        [SerializeField] private bool enableUrgencyMechanics = true;
        [SerializeField] private bool enableSocialProof = true;
        
        [Header("Conversion Optimization")]
        [SerializeField] private float starterPackConversionTarget = 0.15f; // 15% conversion rate
        [SerializeField] private float valuePackConversionTarget = 0.08f; // 8% conversion rate
        [SerializeField] private float whalePackConversionTarget = 0.02f; // 2% conversion rate
        
        [Header("Pricing Psychology")]
        [SerializeField] private bool useAnchoring = true;
        [SerializeField] private bool useDecoyEffect = true;
        [SerializeField] private bool useScarcity = true;
        [SerializeField] private bool useSocialProof = true;
        
        private Dictionary<string, StoreOptimizationData> _optimizationData = new Dictionary<string, StoreOptimizationData>();
        private Dictionary<string, ABTest> _activeTests = new Dictionary<string, ABTest>();
        private Dictionary<string, PlayerBehavior> _playerBehaviors = new Dictionary<string, PlayerBehavior>();
        
        // Events
        public System.Action<ShopItem> OnItemOptimized;
        public System.Action<string, float> OnConversionRateUpdated;
        
        public static StoreOptimizer Instance { get; private set; }
        
        [System.Serializable]
        public class StoreOptimizationData
        {
            public string itemId;
            public float baseConversionRate;
            public float currentConversionRate;
            public int views;
            public int purchases;
            public float revenue;
            public float averageSessionValue;
            public DateTime lastUpdated;
            public List<OptimizationTest> tests = new List<OptimizationTest>();
        }
        
        [System.Serializable]
        public class OptimizationTest
        {
            public string testId;
            public string testType; // "pricing", "positioning", "description", "visual"
            public string variant;
            public float conversionRate;
            public int sampleSize;
            public DateTime startTime;
            public DateTime endTime;
            public bool isActive;
        }
        
        [System.Serializable]
        public class ABTest
        {
            public string testId;
            public string testName;
            public string itemId;
            public List<ABTestVariant> variants = new List<ABTestVariant>();
            public float trafficAllocation = 1.0f;
            public DateTime startTime;
            public DateTime endTime;
            public bool isActive = true;
            public string targetMetric = "conversion_rate";
        }
        
        [System.Serializable]
        public class ABTestVariant
        {
            public string variantId;
            public string variantName;
            public Dictionary<string, object> parameters = new Dictionary<string, object>();
            public int views;
            public int purchases;
            public float conversionRate;
            public float revenue;
        }
        
        [System.Serializable]
        public class PlayerBehavior
        {
            public string playerId;
            public PlayerSegment segment;
            public float spendingTendency;
            public float priceSensitivity;
            public List<string> preferredCategories = new List<string>();
            public List<string> purchaseHistory = new List<string>();
            public DateTime lastPurchaseTime;
            public float totalSpent;
            public int sessionCount;
            public float averageSessionLength;
        }
        
        public enum PlayerSegment
        {
            NewPlayer,      // 0-7 days, 0 purchases
            Casual,         // 8-30 days, $0-10 spent
            Regular,        // 31+ days, $10-50 spent
            Whale,          // 31+ days, $50+ spent
            Churned         // 7+ days inactive
        }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeStoreOptimizer();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            LoadOptimizationData();
            SetupDefaultTests();
            StartCoroutine(UpdateOptimization());
        }
        
        private void InitializeStoreOptimizer()
        {
            Debug.Log("Store Optimizer initialized");
        }
        
        private void SetupDefaultTests()
        {
            if (enableABTesting)
            {
                // Pricing test for starter pack
                var starterPricingTest = new ABTest
                {
                    testId = "starter_pricing_test",
                    testName = "Starter Pack Pricing Test",
                    itemId = "starter_pack_99",
                    variants = new List<ABTestVariant>
                    {
                        new ABTestVariant
                        {
                            variantId = "control",
                            variantName = "Control ($0.99)",
                            parameters = new Dictionary<string, object>
                            {
                                {"price", 20},
                                {"discount", 50f}
                            }
                        },
                        new ABTestVariant
                        {
                            variantId = "premium",
                            variantName = "Premium ($1.99)",
                            parameters = new Dictionary<string, object>
                            {
                                {"price", 40},
                                {"discount", 60f}
                            }
                        }
                    },
                    startTime = DateTime.Now,
                    endTime = DateTime.Now.AddDays(14),
                    isActive = true
                };
                
                _activeTests["starter_pricing_test"] = starterPricingTest;
                
                // Positioning test for value pack
                var valuePositioningTest = new ABTest
                {
                    testId = "value_positioning_test",
                    testName = "Value Pack Positioning Test",
                    itemId = "value_pack_499",
                    variants = new List<ABTestVariant>
                    {
                        new ABTestVariant
                        {
                            variantId = "control",
                            variantName = "Standard Position",
                            parameters = new Dictionary<string, object>
                            {
                                {"displayOrder", 2},
                                {"isRecommended", true}
                            }
                        },
                        new ABTestVariant
                        {
                            variantId = "featured",
                            variantName = "Featured Position",
                            parameters = new Dictionary<string, object>
                            {
                                {"displayOrder", 1},
                                {"isRecommended", true},
                                {"isPopular", true}
                            }
                        }
                    },
                    startTime = DateTime.Now,
                    endTime = DateTime.Now.AddDays(14),
                    isActive = true
                };
                
                _activeTests["value_positioning_test"] = valuePositioningTest;
            }
        }
        
        public List<ShopItem> GetOptimizedItems(string playerId, int maxItems = 6)
        {
            var shopSystem = OptimizedCoreSystem.Instance.Resolve<ShopSystem>();
            if (shopSystem == null) return new List<ShopItem>();
            
            var availableItems = shopSystem.GetAvailableItems(playerId);
            var playerBehavior = GetPlayerBehavior(playerId);
            
            // Apply optimization strategies
            var optimizedItems = new List<ShopItem>();
            
            foreach (var item in availableItems)
            {
                var optimizedItem = ApplyOptimizations(item, playerBehavior);
                optimizedItems.Add(optimizedItem);
            }
            
            // Sort by optimization score
            optimizedItems.Sort((a, b) => 
            {
                float scoreA = CalculateOptimizationScore(a, playerBehavior);
                float scoreB = CalculateOptimizationScore(b, playerBehavior);
                return scoreB.CompareTo(scoreA);
            });
            
            // Apply A/B testing
            if (enableABTesting)
            {
                optimizedItems = ApplyABTesting(optimizedItems, playerId);
            }
            
            // Limit to max items
            if (optimizedItems.Count > maxItems)
            {
                optimizedItems = optimizedItems.GetRange(0, maxItems);
            }
            
            return optimizedItems;
        }
        
        private ShopItem ApplyOptimizations(ShopItem item, PlayerBehavior playerBehavior)
        {
            var optimizedItem = new ShopItem(item);
            
            // Apply personalization based on player segment
            ApplyPersonalization(optimizedItem, playerBehavior);
            
            // Apply urgency mechanics
            if (enableUrgencyMechanics)
            {
                ApplyUrgencyMechanics(optimizedItem, playerBehavior);
            }
            
            // Apply social proof
            if (enableSocialProof)
            {
                ApplySocialProof(optimizedItem, playerBehavior);
            }
            
            // Apply pricing psychology
            ApplyPricingPsychology(optimizedItem, playerBehavior);
            
            return optimizedItem;
        }
        
        private void ApplyPersonalization(ShopItem item, PlayerBehavior playerBehavior)
        {
            if (!enablePersonalization) return;
            
            switch (playerBehavior.segment)
            {
                case PlayerSegment.NewPlayer:
                    // Emphasize starter packs and value
                    if (item.categoryId == "starter")
                    {
                        item.isRecommended = true;
                        item.displayOrder = 1;
                    }
                    break;
                    
                case PlayerSegment.Casual:
                    // Show value packs and energy
                    if (item.categoryId == "currency" && item.id.Contains("value"))
                    {
                        item.isRecommended = true;
                        item.displayOrder = 1;
                    }
                    break;
                    
                case PlayerSegment.Regular:
                    // Show premium packs and boosters
                    if (item.categoryId == "currency" && item.id.Contains("premium"))
                    {
                        item.isRecommended = true;
                        item.displayOrder = 1;
                    }
                    break;
                    
                case PlayerSegment.Whale:
                    // Show all premium options
                    if (item.categoryId == "currency")
                    {
                        item.isRecommended = true;
                        item.displayOrder = 1;
                    }
                    break;
            }
        }
        
        private void ApplyUrgencyMechanics(ShopItem item, PlayerBehavior playerBehavior)
        {
            // Add limited time offers for high-value items
            if (item.categoryId == "special" && !item.isLimitedTime)
            {
                item.isLimitedTime = true;
                item.availableUntil = DateTime.Now.AddHours(24);
            }
            
            // Add countdown timers for flash sales
            if (item.id.Contains("flash_sale"))
            {
                item.isLimitedTime = true;
                item.availableUntil = DateTime.Now.AddHours(6);
            }
        }
        
        private void ApplySocialProof(ShopItem item, PlayerBehavior playerBehavior)
        {
            // Add popularity indicators
            if (item.categoryId == "currency" && item.id.Contains("value"))
            {
                item.isPopular = true;
            }
            
            // Add "X players bought this" messaging
            if (item.purchases > 100)
            {
                item.isPopular = true;
            }
        }
        
        private void ApplyPricingPsychology(ShopItem item, PlayerBehavior playerBehavior)
        {
            // Use anchoring - show higher price first
            if (useAnchoring && item.costs.Count > 0)
            {
                var cost = item.costs[0];
                if (!cost.isDiscounted)
                {
                    cost.isDiscounted = true;
                    cost.originalAmount = Mathf.RoundToInt(cost.amount * 1.5f);
                    cost.discountPercentage = 33f;
                }
            }
            
            // Use decoy effect - add a slightly worse option
            if (useDecoyEffect && item.categoryId == "currency")
            {
                // This would be handled by adding decoy items to the shop
            }
            
            // Use scarcity - limit availability
            if (useScarcity && item.categoryId == "special")
            {
                item.maxPurchases = 3;
            }
        }
        
        private float CalculateOptimizationScore(ShopItem item, PlayerBehavior playerBehavior)
        {
            float score = 0f;
            
            // Base score from item properties
            score += item.displayOrder * 10f;
            
            // Personalization bonus
            if (item.isRecommended)
                score += 50f;
            
            if (item.isPopular)
                score += 30f;
            
            // Urgency bonus
            if (item.isLimitedTime)
                score += 40f;
            
            // Segment-based scoring
            switch (playerBehavior.segment)
            {
                case PlayerSegment.NewPlayer:
                    if (item.categoryId == "starter")
                        score += 100f;
                    break;
                case PlayerSegment.Casual:
                    if (item.categoryId == "currency" && item.id.Contains("value"))
                        score += 80f;
                    break;
                case PlayerSegment.Regular:
                    if (item.categoryId == "currency" && item.id.Contains("premium"))
                        score += 80f;
                    break;
                case PlayerSegment.Whale:
                    if (item.categoryId == "currency")
                        score += 60f;
                    break;
            }
            
            // Price sensitivity adjustment
            if (playerBehavior.priceSensitivity > 0.7f && item.costs.Count > 0)
            {
                var cost = item.costs[0];
                if (cost.isDiscounted)
                    score += 20f;
            }
            
            return score;
        }
        
        private List<ShopItem> ApplyABTesting(List<ShopItem> items, string playerId)
        {
            var modifiedItems = new List<ShopItem>();
            
            foreach (var item in items)
            {
                var modifiedItem = new ShopItem(item);
                
                foreach (var test in _activeTests.Values)
                {
                    if (!test.isActive || test.itemId != item.id) continue;
                    
                    string variant = GetABTestVariant(test, playerId);
                    var testVariant = test.variants.Find(v => v.variantId == variant);
                    
                    if (testVariant != null)
                    {
                        ApplyABTestVariant(modifiedItem, test, testVariant);
                    }
                }
                
                modifiedItems.Add(modifiedItem);
            }
            
            return modifiedItems;
        }
        
        private string GetABTestVariant(ABTest test, string playerId)
        {
            // Simple hash-based variant selection for consistency
            int hash = (playerId + test.testId).GetHashCode();
            float random = (hash % 1000) / 1000.0f;
            
            float cumulative = 0f;
            foreach (var variant in test.variants)
            {
                cumulative += 1.0f / test.variants.Count; // Equal distribution
                if (random <= cumulative)
                {
                    return variant.variantId;
                }
            }
            
            return test.variants[0].variantId;
        }
        
        private void ApplyABTestVariant(ShopItem item, ABTest test, ABTestVariant variant)
        {
            switch (test.testId)
            {
                case "starter_pricing_test":
                    if (variant.parameters.ContainsKey("price"))
                    {
                        var cost = item.costs[0];
                        cost.amount = Convert.ToInt32(variant.parameters["price"]);
                    }
                    if (variant.parameters.ContainsKey("discount"))
                    {
                        var cost = item.costs[0];
                        cost.discountPercentage = Convert.ToSingle(variant.parameters["discount"]);
                        cost.isDiscounted = true;
                    }
                    break;
                    
                case "value_positioning_test":
                    if (variant.parameters.ContainsKey("displayOrder"))
                    {
                        item.displayOrder = Convert.ToInt32(variant.parameters["displayOrder"]);
                    }
                    if (variant.parameters.ContainsKey("isRecommended"))
                    {
                        item.isRecommended = Convert.ToBoolean(variant.parameters["isRecommended"]);
                    }
                    if (variant.parameters.ContainsKey("isPopular"))
                    {
                        item.isPopular = Convert.ToBoolean(variant.parameters["isPopular"]);
                    }
                    break;
            }
        }
        
        public void TrackItemView(string itemId, string playerId)
        {
            var optimizationData = GetOptimizationData(itemId);
            optimizationData.views++;
            
            // Track A/B test views
            foreach (var test in _activeTests.Values)
            {
                if (test.itemId == itemId)
                {
                    string variant = GetABTestVariant(test, playerId);
                    var testVariant = test.variants.Find(v => v.variantId == variant);
                    if (testVariant != null)
                    {
                        testVariant.views++;
                    }
                }
            }
            
            UpdateConversionRates();
        }
        
        public void TrackItemPurchase(string itemId, string playerId, float revenue)
        {
            var optimizationData = GetOptimizationData(itemId);
            optimizationData.purchases++;
            optimizationData.revenue += revenue;
            
            // Update player behavior
            var playerBehavior = GetPlayerBehavior(playerId);
            playerBehavior.purchaseHistory.Add(itemId);
            playerBehavior.lastPurchaseTime = DateTime.Now;
            playerBehavior.totalSpent += revenue;
            
            // Track A/B test purchases
            foreach (var test in _activeTests.Values)
            {
                if (test.itemId == itemId)
                {
                    string variant = GetABTestVariant(test, playerId);
                    var testVariant = test.variants.Find(v => v.variantId == variant);
                    if (testVariant != null)
                    {
                        testVariant.purchases++;
                        testVariant.revenue += revenue;
                    }
                }
            }
            
            UpdateConversionRates();
        }
        
        private void UpdateConversionRates()
        {
            foreach (var data in _optimizationData.Values)
            {
                if (data.views > 0)
                {
                    data.currentConversionRate = (float)data.purchases / data.views;
                    OnConversionRateUpdated?.Invoke(data.itemId, data.currentConversionRate);
                }
            }
            
            // Update A/B test conversion rates
            foreach (var test in _activeTests.Values)
            {
                foreach (var variant in test.variants)
                {
                    if (variant.views > 0)
                    {
                        variant.conversionRate = (float)variant.purchases / variant.views;
                    }
                }
            }
        }
        
        private StoreOptimizationData GetOptimizationData(string itemId)
        {
            if (!_optimizationData.ContainsKey(itemId))
            {
                _optimizationData[itemId] = new StoreOptimizationData
                {
                    itemId = itemId,
                    baseConversionRate = 0.05f, // 5% default
                    currentConversionRate = 0f,
                    views = 0,
                    purchases = 0,
                    revenue = 0f,
                    averageSessionValue = 0f,
                    lastUpdated = DateTime.Now,
                    tests = new List<OptimizationTest>()
                };
            }
            
            return _optimizationData[itemId];
        }
        
        private PlayerBehavior GetPlayerBehavior(string playerId)
        {
            if (!_playerBehaviors.ContainsKey(playerId))
            {
                _playerBehaviors[playerId] = new PlayerBehavior
                {
                    playerId = playerId,
                    segment = PlayerSegment.NewPlayer,
                    spendingTendency = 0.5f,
                    priceSensitivity = 0.5f,
                    preferredCategories = new List<string>(),
                    purchaseHistory = new List<string>(),
                    lastPurchaseTime = DateTime.MinValue,
                    totalSpent = 0f,
                    sessionCount = 0,
                    averageSessionLength = 0f
                };
            }
            
            return _playerBehaviors[playerId];
        }
        
        private System.Collections.IEnumerator UpdateOptimization()
        {
            while (true)
            {
                // Update player segments
                UpdatePlayerSegments();
                
                // Check A/B test completion
                CheckABTestCompletion();
                
                // Optimize pricing
                if (enableDynamicPricing)
                {
                    OptimizePricing();
                }
                
                yield return new WaitForSeconds(300f); // Update every 5 minutes
            }
        }
        
        private void UpdatePlayerSegments()
        {
            foreach (var behavior in _playerBehaviors.Values)
            {
                // Update segment based on spending and activity
                if (behavior.totalSpent == 0f)
                {
                    behavior.segment = PlayerSegment.NewPlayer;
                }
                else if (behavior.totalSpent < 10f)
                {
                    behavior.segment = PlayerSegment.Casual;
                }
                else if (behavior.totalSpent < 50f)
                {
                    behavior.segment = PlayerSegment.Regular;
                }
                else
                {
                    behavior.segment = PlayerSegment.Whale;
                }
                
                // Check for churned players
                TimeSpan timeSinceLastPurchase = DateTime.Now - behavior.lastPurchaseTime;
                if (timeSinceLastPurchase.TotalDays > 7)
                {
                    behavior.segment = PlayerSegment.Churned;
                }
            }
        }
        
        private void CheckABTestCompletion()
        {
            var completedTests = new List<string>();
            
            foreach (var test in _activeTests.Values)
            {
                if (DateTime.Now > test.endTime)
                {
                    CompleteABTest(test);
                    completedTests.Add(test.testId);
                }
            }
            
            foreach (var testId in completedTests)
            {
                _activeTests.Remove(testId);
            }
        }
        
        private void CompleteABTest(ABTest test)
        {
            // Find winning variant
            ABTestVariant winner = null;
            float bestConversionRate = 0f;
            
            foreach (var variant in test.variants)
            {
                if (variant.conversionRate > bestConversionRate)
                {
                    bestConversionRate = variant.conversionRate;
                    winner = variant;
                }
            }
            
            Debug.Log($"AB Test {test.testName} completed. Winner: {winner?.variantName} with {bestConversionRate:P2} conversion rate");
        }
        
        private void OptimizePricing()
        {
            // Implement dynamic pricing based on conversion rates
            foreach (var data in _optimizationData.Values)
            {
                if (data.views < 100) continue; // Need sufficient data
                
                float targetRate = GetTargetConversionRate(data.itemId);
                
                if (data.currentConversionRate < targetRate * 0.8f)
                {
                    // Conversion rate too low, consider lowering price
                    Debug.Log($"Consider lowering price for {data.itemId} - Current: {data.currentConversionRate:P2}, Target: {targetRate:P2}");
                }
                else if (data.currentConversionRate > targetRate * 1.2f)
                {
                    // Conversion rate too high, consider raising price
                    Debug.Log($"Consider raising price for {data.itemId} - Current: {data.currentConversionRate:P2}, Target: {targetRate:P2}");
                }
            }
        }
        
        private float GetTargetConversionRate(string itemId)
        {
            if (itemId.Contains("starter"))
                return starterPackConversionTarget;
            else if (itemId.Contains("value"))
                return valuePackConversionTarget;
            else if (itemId.Contains("mega"))
                return whalePackConversionTarget;
            else
                return 0.05f; // 5% default
        }
        
        public string GetOptimizationReport()
        {
            var report = new System.Text.StringBuilder();
            report.AppendLine("=== STORE OPTIMIZATION REPORT ===");
            report.AppendLine($"Generated: {DateTime.Now}");
            report.AppendLine();
            
            // Conversion rates
            report.AppendLine("=== CONVERSION RATES ===");
            foreach (var data in _optimizationData.Values)
            {
                if (data.views > 0)
                {
                    report.AppendLine($"{data.itemId}: {data.currentConversionRate:P2} ({data.purchases}/{data.views})");
                }
            }
            report.AppendLine();
            
            // A/B Tests
            report.AppendLine("=== A/B TESTS ===");
            foreach (var test in _activeTests.Values)
            {
                report.AppendLine($"{test.testName}:");
                foreach (var variant in test.variants)
                {
                    report.AppendLine($"  {variant.variantName}: {variant.conversionRate:P2} ({variant.purchases}/{variant.views})");
                }
                report.AppendLine();
            }
            
            // Player Segments
            report.AppendLine("=== PLAYER SEGMENTS ===");
            var segmentCounts = new Dictionary<PlayerSegment, int>();
            foreach (var behavior in _playerBehaviors.Values)
            {
                if (!segmentCounts.ContainsKey(behavior.segment))
                    segmentCounts[behavior.segment] = 0;
                segmentCounts[behavior.segment]++;
            }
            
            foreach (var kvp in segmentCounts)
            {
                report.AppendLine($"{kvp.Key}: {kvp.Value} players");
            }
            
            return report.ToString();
        }
        
        private void SaveOptimizationData()
        {
            var saveData = new OptimizationSaveData
            {
                optimizationData = new Dictionary<string, StoreOptimizationData>(_optimizationData),
                activeTests = new Dictionary<string, ABTest>(_activeTests),
                playerBehaviors = new Dictionary<string, PlayerBehavior>(_playerBehaviors)
            };
            
            string json = JsonUtility.ToJson(saveData, true);
            System.IO.File.WriteAllText(Application.persistentDataPath + "/store_optimization.json", json);
        }
        
        private void LoadOptimizationData()
        {
            string path = Application.persistentDataPath + "/store_optimization.json";
            if (System.IO.File.Exists(path))
            {
                try
                {
                    string json = System.IO.File.ReadAllText(path);
                    var saveData = JsonUtility.FromJson<OptimizationSaveData>(json);
                    
                    if (saveData.optimizationData != null)
                    {
                        _optimizationData = saveData.optimizationData;
                    }
                    
                    if (saveData.activeTests != null)
                    {
                        _activeTests = saveData.activeTests;
                    }
                    
                    if (saveData.playerBehaviors != null)
                    {
                        _playerBehaviors = saveData.playerBehaviors;
                    }
                }
                catch (Exception e)
                {
                    Debug.LogError($"Failed to load optimization data: {e.Message}");
                }
            }
        }
        
        [System.Serializable]
        private class OptimizationSaveData
        {
            public Dictionary<string, StoreOptimizationData> optimizationData;
            public Dictionary<string, ABTest> activeTests;
            public Dictionary<string, PlayerBehavior> playerBehaviors;
        }
        
        void OnDestroy()
        {
            SaveOptimizationData();
        }
    }
}