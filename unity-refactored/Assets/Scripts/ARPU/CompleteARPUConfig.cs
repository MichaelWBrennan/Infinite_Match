using UnityEngine;
using System.Collections.Generic;

namespace Evergreen.ARPU
{
    /// <summary>
    /// Complete ARPU Configuration - Centralized configuration for all ARPU systems
    /// Provides easy configuration and tuning of all ARPU features
    /// </summary>
    [CreateAssetMenu(fileName = "ARPUConfig", menuName = "ARPU/Complete ARPU Config")]
    public class CompleteARPUConfig : ScriptableObject
    {
        [Header("General Settings")]
        public bool enableARPU = true;
        public bool enableDebugLogs = true;
        public bool enablePerformanceOptimization = true;
        public float updateInterval = 60f;
        
        [Header("Energy System Configuration")]
        public EnergyConfig energyConfig = new EnergyConfig();
        
        [Header("Subscription System Configuration")]
        public SubscriptionConfig subscriptionConfig = new SubscriptionConfig();
        
        [Header("Offer System Configuration")]
        public OfferConfig offerConfig = new OfferConfig();
        
        [Header("Social System Configuration")]
        public SocialConfig socialConfig = new SocialConfig();
        
        [Header("Analytics Configuration")]
        public AnalyticsConfig analyticsConfig = new AnalyticsConfig();
        
        [Header("Retention Configuration")]
        public RetentionConfig retentionConfig = new RetentionConfig();
        
        [Header("Monetization Configuration")]
        public MonetizationConfig monetizationConfig = new MonetizationConfig();
        
        [Header("UI Configuration")]
        public UIConfig uiConfig = new UIConfig();
        
        [System.Serializable]
        public class EnergyConfig
        {
            [Header("Basic Settings")]
            public bool enableEnergySystem = true;
            public int maxEnergy = 30;
            public int energyPerLevel = 1;
            public int energyRefillCost = 10;
            public float energyRefillTime = 300f;
            
            [Header("Monetization")]
            public bool enableEnergyPacks = true;
            public bool enableEnergyAds = true;
            public int energyAdReward = 5;
            public float energyAdCooldown = 300f;
            
            [Header("Energy Packs")]
            public EnergyPack[] energyPacks = new EnergyPack[]
            {
                new EnergyPack { id = "energy_small", name = "Energy Boost", energy = 10, cost = 5, costType = "gems" },
                new EnergyPack { id = "energy_medium", name = "Energy Surge", energy = 25, cost = 10, costType = "gems" },
                new EnergyPack { id = "energy_large", name = "Energy Rush", energy = 50, cost = 18, costType = "gems" },
                new EnergyPack { id = "energy_ultimate", name = "Unlimited Energy", energy = 999, cost = 50, costType = "gems" }
            };
        }
        
        [System.Serializable]
        public class SubscriptionConfig
        {
            [Header("Basic Settings")]
            public bool enableSubscriptionSystem = true;
            public float subscriptionCheckInterval = 3600f;
            
            [Header("Subscription Tiers")]
            public SubscriptionTier[] subscriptionTiers = new SubscriptionTier[]
            {
                new SubscriptionTier
                {
                    id = "basic",
                    name = "Basic Pass",
                    price = 4.99f,
                    duration = 30,
                    benefits = new List<SubscriptionBenefit>
                    {
                        new SubscriptionBenefit { type = "energy_multiplier", value = 1.5f, description = "1.5x Energy Regeneration" },
                        new SubscriptionBenefit { type = "coins_multiplier", value = 1.2f, description = "1.2x Coin Rewards" },
                        new SubscriptionBenefit { type = "daily_bonus", value = 100, description = "Daily 100 Coins" }
                    }
                },
                new SubscriptionTier
                {
                    id = "premium",
                    name = "Premium Pass",
                    price = 9.99f,
                    duration = 30,
                    benefits = new List<SubscriptionBenefit>
                    {
                        new SubscriptionBenefit { type = "energy_multiplier", value = 2.0f, description = "2x Energy Regeneration" },
                        new SubscriptionBenefit { type = "coins_multiplier", value = 1.5f, description = "1.5x Coin Rewards" },
                        new SubscriptionBenefit { type = "gems_multiplier", value = 1.3f, description = "1.3x Gem Rewards" },
                        new SubscriptionBenefit { type = "daily_bonus", value = 200, description = "Daily 200 Coins + 10 Gems" },
                        new SubscriptionBenefit { type = "exclusive_items", value = 1, description = "Exclusive Items Access" }
                    }
                },
                new SubscriptionTier
                {
                    id = "ultimate",
                    name = "Ultimate Pass",
                    price = 19.99f,
                    duration = 30,
                    benefits = new List<SubscriptionBenefit>
                    {
                        new SubscriptionBenefit { type = "unlimited_energy", value = 1, description = "Unlimited Energy" },
                        new SubscriptionBenefit { type = "coins_multiplier", value = 2.0f, description = "2x Coin Rewards" },
                        new SubscriptionBenefit { type = "gems_multiplier", value = 1.5f, description = "1.5x Gem Rewards" },
                        new SubscriptionBenefit { type = "daily_bonus", value = 500, description = "Daily 500 Coins + 25 Gems" },
                        new SubscriptionBenefit { type = "exclusive_items", value = 1, description = "All Exclusive Items" },
                        new SubscriptionBenefit { type = "priority_support", value = 1, description = "Priority Support" },
                        new SubscriptionBenefit { type = "no_ads", value = 1, description = "Ad-Free Experience" }
                    }
                }
            };
        }
        
        [System.Serializable]
        public class OfferConfig
        {
            [Header("Basic Settings")]
            public bool enablePersonalizedOffers = true;
            public bool enableAITargeting = true;
            public bool enableBehavioralAnalysis = true;
            public float personalizationUpdateInterval = 300f;
            
            [Header("Offer Settings")]
            public int maxActiveOffers = 3;
            public float offerRefreshInterval = 1800f;
            public float offerExpiryTime = 3600f;
            
            [Header("Targeting Settings")]
            public float highValueThreshold = 100f;
            public float lowValueThreshold = 10f;
            public int newPlayerThreshold = 7;
            public int churnRiskThreshold = 3;
            
            [Header("Offer Templates")]
            public OfferTemplate[] offerTemplates = new OfferTemplate[]
            {
                new OfferTemplate
                {
                    id = "starter_pack",
                    name = "Starter Pack",
                    basePrice = 4.99f,
                    baseDiscount = 0.8f,
                    targetSegments = new string[] { "new_players", "low_value" },
                    conditions = new Dictionary<string, object>
                    {
                        ["max_level"] = 10,
                        ["max_spent"] = 5f,
                        ["days_since_install"] = 7
                    },
                    rewards = new Dictionary<string, int>
                    {
                        ["coins"] = 1000,
                        ["gems"] = 50,
                        ["energy"] = 20
                    }
                },
                new OfferTemplate
                {
                    id = "comeback_pack",
                    name = "Welcome Back!",
                    basePrice = 9.99f,
                    baseDiscount = 0.7f,
                    targetSegments = new string[] { "returning_players", "churn_risk" },
                    conditions = new Dictionary<string, object>
                    {
                        ["days_since_last_play"] = 3,
                        ["max_days_since_last_play"] = 30
                    },
                    rewards = new Dictionary<string, int>
                    {
                        ["coins"] = 2000,
                        ["gems"] = 100,
                        ["energy"] = 50
                    }
                },
                new OfferTemplate
                {
                    id = "premium_pack",
                    name = "Premium Pack",
                    basePrice = 19.99f,
                    baseDiscount = 0.6f,
                    targetSegments = new string[] { "high_value", "whales" },
                    conditions = new Dictionary<string, object>
                    {
                        ["min_spent"] = 50f,
                        ["min_level"] = 20
                    },
                    rewards = new Dictionary<string, int>
                    {
                        ["coins"] = 5000,
                        ["gems"] = 300,
                        ["energy"] = 100
                    }
                }
            };
        }
        
        [System.Serializable]
        public class SocialConfig
        {
            [Header("Basic Settings")]
            public bool enableSocialFeatures = true;
            public bool enableLeaderboards = true;
            public bool enableGuilds = true;
            public bool enableSocialChallenges = true;
            public bool enableFriendGifting = true;
            
            [Header("Leaderboard Settings")]
            public int leaderboardUpdateInterval = 300f;
            public int maxLeaderboardEntries = 100;
            public string[] leaderboardTypes = new string[]
            {
                "weekly_score",
                "monthly_score",
                "total_coins",
                "total_gems",
                "levels_completed"
            };
            
            [Header("Guild Settings")]
            public int maxGuildMembers = 50;
            public int guildCreationCost = 1000;
            public int guildUpgradeCost = 500;
            public int maxGuildLevel = 10;
            
            [Header("Challenge Settings")]
            public int challengeDuration = 7;
            public int maxActiveChallenges = 3;
            public float challengeRewardMultiplier = 1.5f;
        }
        
        [System.Serializable]
        public class AnalyticsConfig
        {
            [Header("Basic Settings")]
            public bool enableARPUTracking = true;
            public bool enableRealTimeRevenue = true;
            public bool enablePlayerSegmentation = true;
            public bool enableConversionFunnels = true;
            public bool enableRetentionAnalysis = true;
            public bool enableLTVPrediction = true;
            
            [Header("Revenue Tracking")]
            public float revenueUpdateInterval = 60f;
            public int maxRevenueHistory = 1000;
            public bool trackMicroTransactions = true;
            public bool trackSubscriptionRevenue = true;
            public bool trackAdRevenue = true;
            
            [Header("Player Segmentation")]
            public float[] spendingThresholds = new float[] { 0f, 5f, 25f, 100f, 500f };
            public string[] playerSegments = new string[] { "non_payer", "low_value", "medium_value", "high_value", "whale" };
            public int[] retentionThresholds = new int[] { 1, 3, 7, 14, 30 };
        }
        
        [System.Serializable]
        public class RetentionConfig
        {
            [Header("Basic Settings")]
            public bool enableStreakSystem = true;
            public bool enableComebackOffers = true;
            public bool enableDailyTasks = true;
            public bool enableHabitFormation = true;
            public bool enableChurnPrediction = true;
            
            [Header("Streak Settings")]
            public float streakMultiplier = 0.1f;
            public float maxStreakMultiplier = 3.0f;
            public float streakDecayRate = 0.1f;
            
            [Header("Churn Prediction")]
            public int churnRiskThreshold = 3;
            public float churnPredictionAccuracy = 0.85f;
            public int churnPredictionWindow = 7;
            
            [Header("Daily Tasks")]
            public DailyTask[] dailyTasks = new DailyTask[]
            {
                new DailyTask
                {
                    id = "play_levels",
                    name = "Play 3 Levels",
                    target = 3,
                    reward = new Dictionary<string, int> { ["coins"] = 100 }
                },
                new DailyTask
                {
                    id = "use_boosters",
                    name = "Use 5 Boosters",
                    target = 5,
                    reward = new Dictionary<string, int> { ["gems"] = 50 }
                },
                new DailyTask
                {
                    id = "complete_challenge",
                    name = "Complete 1 Challenge",
                    target = 1,
                    reward = new Dictionary<string, int> { ["coins"] = 200 }
                }
            };
        }
        
        [System.Serializable]
        public class MonetizationConfig
        {
            [Header("Basic Settings")]
            public bool enableAdvancedMonetization = true;
            public bool enableDynamicPricing = true;
            public bool enableImpulsePurchases = true;
            public bool enableLimitedTimeOffers = true;
            
            [Header("Dynamic Pricing")]
            public float basePriceMultiplier = 1.0f;
            public float highValueMultiplier = 1.2f;
            public float lowValueMultiplier = 0.8f;
            public float churnRiskMultiplier = 0.7f;
            public float newPlayerMultiplier = 0.6f;
            
            [Header("Impulse Purchases")]
            public float impulsePurchaseChance = 0.1f;
            public float impulsePurchaseMultiplier = 1.5f;
            public int impulsePurchaseCooldown = 3600;
            
            [Header("Limited Time Offers")]
            public float limitedOfferChance = 0.05f;
            public float limitedOfferDuration = 3600f;
            public float limitedOfferDiscount = 0.5f;
        }
        
        [System.Serializable]
        public class UIConfig
        {
            [Header("Basic Settings")]
            public bool enableCompleteUI = true;
            public bool showDebugInfo = true;
            public float uiUpdateInterval = 1f;
            
            [Header("Panel Settings")]
            public bool showEnergyPanel = true;
            public bool showSubscriptionPanel = true;
            public bool showOffersPanel = true;
            public bool showSocialPanel = true;
            public bool showAnalyticsPanel = true;
            public bool showRetentionPanel = true;
            
            [Header("Notification Settings")]
            public bool enableNotifications = true;
            public float notificationDuration = 3f;
            public bool enableSoundEffects = true;
            public bool enableParticleEffects = true;
        }
        
        [System.Serializable]
        public class EnergyPack
        {
            public string id;
            public string name;
            public int energy;
            public int cost;
            public string costType;
            public string description;
        }
        
        [System.Serializable]
        public class SubscriptionTier
        {
            public string id;
            public string name;
            public float price;
            public int duration;
            public List<SubscriptionBenefit> benefits;
        }
        
        [System.Serializable]
        public class SubscriptionBenefit
        {
            public string type;
            public float value;
            public string description;
        }
        
        [System.Serializable]
        public class OfferTemplate
        {
            public string id;
            public string name;
            public float basePrice;
            public float baseDiscount;
            public string[] targetSegments;
            public Dictionary<string, object> conditions;
            public Dictionary<string, int> rewards;
        }
        
        [System.Serializable]
        public class DailyTask
        {
            public string id;
            public string name;
            public int target;
            public Dictionary<string, int> reward;
        }
        
        // Public Methods
        
        public bool IsARPUEnabled()
        {
            return enableARPU;
        }
        
        public EnergyConfig GetEnergyConfig()
        {
            return energyConfig;
        }
        
        public SubscriptionConfig GetSubscriptionConfig()
        {
            return subscriptionConfig;
        }
        
        public OfferConfig GetOfferConfig()
        {
            return offerConfig;
        }
        
        public SocialConfig GetSocialConfig()
        {
            return socialConfig;
        }
        
        public AnalyticsConfig GetAnalyticsConfig()
        {
            return analyticsConfig;
        }
        
        public RetentionConfig GetRetentionConfig()
        {
            return retentionConfig;
        }
        
        public MonetizationConfig GetMonetizationConfig()
        {
            return monetizationConfig;
        }
        
        public UIConfig GetUIConfig()
        {
            return uiConfig;
        }
        
        public void ValidateConfig()
        {
            // Validate energy config
            if (energyConfig.maxEnergy <= 0)
            {
                Debug.LogWarning("ARPU Config: maxEnergy must be greater than 0");
                energyConfig.maxEnergy = 30;
            }
            
            if (energyConfig.energyPerLevel <= 0)
            {
                Debug.LogWarning("ARPU Config: energyPerLevel must be greater than 0");
                energyConfig.energyPerLevel = 1;
            }
            
            // Validate subscription config
            if (subscriptionConfig.subscriptionTiers == null || subscriptionConfig.subscriptionTiers.Length == 0)
            {
                Debug.LogWarning("ARPU Config: No subscription tiers defined");
            }
            
            // Validate offer config
            if (offerConfig.maxActiveOffers <= 0)
            {
                Debug.LogWarning("ARPU Config: maxActiveOffers must be greater than 0");
                offerConfig.maxActiveOffers = 3;
            }
            
            // Validate social config
            if (socialConfig.maxGuildMembers <= 0)
            {
                Debug.LogWarning("ARPU Config: maxGuildMembers must be greater than 0");
                socialConfig.maxGuildMembers = 50;
            }
            
            // Validate analytics config
            if (analyticsConfig.spendingThresholds == null || analyticsConfig.spendingThresholds.Length == 0)
            {
                Debug.LogWarning("ARPU Config: No spending thresholds defined");
            }
            
            // Validate retention config
            if (retentionConfig.streakMultiplier <= 0)
            {
                Debug.LogWarning("ARPU Config: streakMultiplier must be greater than 0");
                retentionConfig.streakMultiplier = 0.1f;
            }
            
            // Validate monetization config
            if (monetizationConfig.basePriceMultiplier <= 0)
            {
                Debug.LogWarning("ARPU Config: basePriceMultiplier must be greater than 0");
                monetizationConfig.basePriceMultiplier = 1.0f;
            }
            
            // Validate UI config
            if (uiConfig.uiUpdateInterval <= 0)
            {
                Debug.LogWarning("ARPU Config: uiUpdateInterval must be greater than 0");
                uiConfig.uiUpdateInterval = 1f;
            }
        }
        
        void OnValidate()
        {
            ValidateConfig();
        }
    }
}