using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using Evergreen.Core;
using Evergreen.Economy;
using Evergreen.Monetization;
using Evergreen.Social;
using Evergreen.Analytics;

namespace Evergreen.ARPU
{
    /// <summary>
    /// Complete ARPU Manager - All-in-one ARPU maximization system
    /// Integrates energy, subscriptions, offers, social, analytics, and retention
    /// </summary>
    public class CompleteARPUManager : MonoBehaviour
    {
        [Header("ARPU Configuration")]
        public bool enableEnergySystem = true;
        public bool enableSubscriptionSystem = true;
        public bool enablePersonalizedOffers = true;
        public bool enableSocialFeatures = true;
        public bool enableARPUAnalytics = true;
        public bool enableRetentionSystem = true;
        public bool enableAdvancedMonetization = true;
        
        [Header("Energy Settings")]
        public int maxEnergy = 30;
        public int energyPerLevel = 1;
        public int energyRefillCost = 10;
        public float energyRefillTime = 300f;
        public bool enableEnergyPacks = true;
        public bool enableEnergyAds = true;
        public int energyAdReward = 5;
        public float energyAdCooldown = 300f;
        
        [Header("Subscription Settings")]
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
        
        [Header("Offer Settings")]
        public int maxActiveOffers = 3;
        public float offerRefreshInterval = 1800f;
        public float offerExpiryTime = 3600f;
        public bool enablePersonalization = true;
        public bool enableAITargeting = true;
        public float personalizationUpdateInterval = 300f;
        
        [Header("Social Settings")]
        public bool enableLeaderboards = true;
        public bool enableGuilds = true;
        public bool enableSocialChallenges = true;
        public bool enableFriendGifting = true;
        public int maxGuildMembers = 50;
        public int guildCreationCost = 1000;
        public int guildUpgradeCost = 500;
        public int maxGuildLevel = 10;
        
        [Header("Analytics Settings")]
        public bool enableRealTimeRevenue = true;
        public bool enablePlayerSegmentation = true;
        public bool enableConversionFunnels = true;
        public bool enableRetentionAnalysis = true;
        public bool enableLTVPrediction = true;
        public float revenueUpdateInterval = 60f;
        public int maxRevenueHistory = 1000;
        
        [Header("Retention Settings")]
        public bool enableStreakSystem = true;
        public bool enableComebackOffers = true;
        public bool enableDailyTasks = true;
        public bool enableHabitFormation = true;
        public bool enableChurnPrediction = true;
        public float streakMultiplier = 0.1f;
        public float maxStreakMultiplier = 3.0f;
        public int churnRiskThreshold = 3;
        
        // Core Systems
        private EnergySystem _energySystem;
        private SubscriptionSystem _subscriptionSystem;
        private PersonalizedOfferSystem _offerSystem;
        private SocialCompetitionSystem _socialSystem;
        private ARPUAnalyticsSystem _analyticsSystem;
        private AdvancedRetentionSystem _retentionSystem;
        private AdvancedMonetizationSystem _monetizationSystem;
        
        // Data Storage
        private Dictionary<string, PlayerARPUProfile> _playerProfiles = new Dictionary<string, PlayerARPUProfile>();
        private Dictionary<string, RevenueEvent> _revenueEvents = new Dictionary<string, RevenueEvent>();
        private Dictionary<string, PersonalizedOffer> _activeOffers = new Dictionary<string, PersonalizedOffer>();
        private Dictionary<string, Guild> _guilds = new Dictionary<string, Guild>();
        private Dictionary<string, SocialChallenge> _activeChallenges = new Dictionary<string, SocialChallenge>();
        private Dictionary<string, Leaderboard> _leaderboards = new Dictionary<string, Leaderboard>();
        
        // Coroutines
        private Coroutine _arpuUpdateCoroutine;
        private Coroutine _offerRefreshCoroutine;
        private Coroutine _analyticsUpdateCoroutine;
        private Coroutine _retentionUpdateCoroutine;
        
        // Events
        public static event Action<PlayerARPUProfile> OnPlayerProfileUpdated;
        public static event Action<RevenueEvent> OnRevenueGenerated;
        public static event Action<PersonalizedOffer> OnOfferCreated;
        public static event Action<PersonalizedOffer> OnOfferPurchased;
        public static event Action<Guild> OnGuildCreated;
        public static event Action<SocialChallenge> OnChallengeStarted;
        public static event Action<Dictionary<string, object>> OnARPUOptimized;
        
        public static CompleteARPUManager Instance { get; private set; }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeCompleteARPU();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            StartARPUSystems();
        }
        
        private void InitializeCompleteARPU()
        {
            Debug.Log("Complete ARPU Manager initialized - All systems integrated for maximum revenue!");
            
            // Initialize all subsystems
            InitializeEnergySystem();
            InitializeSubscriptionSystem();
            InitializeOfferSystem();
            InitializeSocialSystem();
            InitializeAnalyticsSystem();
            InitializeRetentionSystem();
            InitializeMonetizationSystem();
            InitializeLeaderboards();
            
            // Load saved data
            LoadARPUData();
        }
        
        private void InitializeEnergySystem()
        {
            if (!enableEnergySystem) return;
            
            _energySystem = gameObject.AddComponent<EnergySystem>();
            _energySystem.maxEnergy = maxEnergy;
            _energySystem.energyPerLevel = energyPerLevel;
            _energySystem.energyRefillCost = energyRefillCost;
            _energySystem.energyRefillTime = energyRefillTime;
            _energySystem.enableEnergyPacks = enableEnergyPacks;
            _energySystem.enableEnergyAds = enableEnergyAds;
            _energySystem.energyAdReward = energyAdReward;
            _energySystem.energyAdCooldown = energyAdCooldown;
        }
        
        private void InitializeSubscriptionSystem()
        {
            if (!enableSubscriptionSystem) return;
            
            _subscriptionSystem = gameObject.AddComponent<SubscriptionSystem>();
            _subscriptionSystem.subscriptionTiers = subscriptionTiers;
        }
        
        private void InitializeOfferSystem()
        {
            if (!enablePersonalizedOffers) return;
            
            _offerSystem = gameObject.AddComponent<PersonalizedOfferSystem>();
            _offerSystem.maxActiveOffers = maxActiveOffers;
            _offerSystem.offerRefreshInterval = offerRefreshInterval;
            _offerSystem.offerExpiryTime = offerExpiryTime;
            _offerSystem.enablePersonalization = enablePersonalization;
            _offerSystem.enableAITargeting = enableAITargeting;
            _offerSystem.personalizationUpdateInterval = personalizationUpdateInterval;
        }
        
        private void InitializeSocialSystem()
        {
            if (!enableSocialFeatures) return;
            
            _socialSystem = gameObject.AddComponent<SocialCompetitionSystem>();
            _socialSystem.enableLeaderboards = enableLeaderboards;
            _socialSystem.enableGuilds = enableGuilds;
            _socialSystem.enableSocialChallenges = enableSocialChallenges;
            _socialSystem.enableFriendGifting = enableFriendGifting;
            _socialSystem.maxGuildMembers = maxGuildMembers;
            _socialSystem.guildCreationCost = guildCreationCost;
            _socialSystem.guildUpgradeCost = guildUpgradeCost;
            _socialSystem.maxGuildLevel = maxGuildLevel;
        }
        
        private void InitializeAnalyticsSystem()
        {
            if (!enableARPUAnalytics) return;
            
            _analyticsSystem = gameObject.AddComponent<ARPUAnalyticsSystem>();
            _analyticsSystem.enableRealTimeRevenue = enableRealTimeRevenue;
            _analyticsSystem.enablePlayerSegmentation = enablePlayerSegmentation;
            _analyticsSystem.enableConversionFunnels = enableConversionFunnels;
            _analyticsSystem.enableRetentionAnalysis = enableRetentionAnalysis;
            _analyticsSystem.enableLTVPrediction = enableLTVPrediction;
            _analyticsSystem.revenueUpdateInterval = revenueUpdateInterval;
            _analyticsSystem.maxRevenueHistory = maxRevenueHistory;
        }
        
        private void InitializeRetentionSystem()
        {
            if (!enableRetentionSystem) return;
            
            _retentionSystem = gameObject.AddComponent<AdvancedRetentionSystem>();
        }
        
        private void InitializeMonetizationSystem()
        {
            if (!enableAdvancedMonetization) return;
            
            _monetizationSystem = gameObject.AddComponent<AdvancedMonetizationSystem>();
        }
        
        private void InitializeLeaderboards()
        {
            if (!enableLeaderboards) return;
            
            var leaderboardTypes = new[] { "weekly_score", "monthly_score", "total_coins", "total_gems", "levels_completed" };
            
            foreach (var type in leaderboardTypes)
            {
                _leaderboards[type] = new Leaderboard
                {
                    type = type,
                    entries = new List<LeaderboardEntry>(),
                    lastUpdated = DateTime.Now
                };
            }
        }
        
        private void StartARPUSystems()
        {
            // Start all update coroutines
            _arpuUpdateCoroutine = StartCoroutine(ARPUUpdateCoroutine());
            _offerRefreshCoroutine = StartCoroutine(OfferRefreshCoroutine());
            _analyticsUpdateCoroutine = StartCoroutine(AnalyticsUpdateCoroutine());
            _retentionUpdateCoroutine = StartCoroutine(RetentionUpdateCoroutine());
        }
        
        private IEnumerator ARPUUpdateCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(60f); // Update every minute
                
                UpdateAllSystems();
                OptimizeARPU();
            }
        }
        
        private IEnumerator OfferRefreshCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(offerRefreshInterval);
                
                RefreshExpiredOffers();
                GenerateNewOffers();
            }
        }
        
        private IEnumerator AnalyticsUpdateCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(revenueUpdateInterval);
                
                UpdateAnalytics();
            }
        }
        
        private IEnumerator RetentionUpdateCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(300f); // Update every 5 minutes
                
                UpdateRetentionSystems();
            }
        }
        
        private void UpdateAllSystems()
        {
            // Update energy system
            if (_energySystem != null)
            {
                // Energy system updates automatically
            }
            
            // Update subscription system
            if (_subscriptionSystem != null)
            {
                // Check for expired subscriptions
                CheckExpiredSubscriptions();
            }
            
            // Update social system
            if (_socialSystem != null)
            {
                UpdateLeaderboards();
                UpdateChallenges();
            }
            
            // Update analytics
            if (_analyticsSystem != null)
            {
                // Analytics updates automatically
            }
        }
        
        private void OptimizeARPU()
        {
            var optimizationData = new Dictionary<string, object>();
            
            // Energy optimization
            if (_energySystem != null)
            {
                var energyLevel = _energySystem.GetCurrentEnergy();
                var energyMax = _energySystem.GetMaxEnergy();
                var energyPercentage = (float)energyLevel / energyMax;
                
                optimizationData["energy_level"] = energyLevel;
                optimizationData["energy_max"] = energyMax;
                optimizationData["energy_percentage"] = energyPercentage;
                
                if (energyPercentage < 0.3f)
                {
                    TriggerEnergyOffers();
                }
            }
            
            // Subscription optimization
            if (_subscriptionSystem != null)
            {
                var stats = _subscriptionSystem.GetSubscriptionStatistics();
                optimizationData["subscription_stats"] = stats;
                
                var activeSubscriptions = (int)stats["active_subscriptions"];
                if (activeSubscriptions < 10)
                {
                    TriggerSubscriptionOffers();
                }
            }
            
            // Social optimization
            if (_socialSystem != null)
            {
                var stats = _socialSystem.GetSocialStatistics();
                optimizationData["social_stats"] = stats;
                
                var socialEngagement = (float)stats["social_engagement"];
                if (socialEngagement < 0.5f)
                {
                    TriggerSocialFeatures();
                }
            }
            
            // Analytics optimization
            if (_analyticsSystem != null)
            {
                var report = _analyticsSystem.GetARPUReport();
                optimizationData["arpu_report"] = report;
            }
            
            OnARPUOptimized?.Invoke(optimizationData);
        }
        
        private void CheckExpiredSubscriptions()
        {
            // This would check for expired subscriptions and handle them
            // Implementation depends on your subscription system
        }
        
        private void UpdateLeaderboards()
        {
            foreach (var leaderboard in _leaderboards.Values)
            {
                UpdateLeaderboard(leaderboard);
            }
        }
        
        private void UpdateLeaderboard(Leaderboard leaderboard)
        {
            var entries = GetLeaderboardEntries(leaderboard.type);
            leaderboard.entries = entries.OrderByDescending(e => e.score).Take(100).ToList();
            leaderboard.lastUpdated = DateTime.Now;
        }
        
        private List<LeaderboardEntry> GetLeaderboardEntries(string type)
        {
            var entries = new List<LeaderboardEntry>();
            
            foreach (var profile in _playerProfiles.Values)
            {
                var score = GetPlayerScore(profile, type);
                if (score > 0)
                {
                    entries.Add(new LeaderboardEntry
                    {
                        playerId = profile.playerId,
                        playerName = profile.playerName,
                        score = score,
                        rank = 0,
                        lastUpdated = DateTime.Now
                    });
                }
            }
            
            return entries;
        }
        
        private int GetPlayerScore(PlayerARPUProfile profile, string type)
        {
            switch (type)
            {
                case "weekly_score":
                    return profile.weeklyScore;
                case "monthly_score":
                    return profile.monthlyScore;
                case "total_coins":
                    return profile.totalCoins;
                case "total_gems":
                    return profile.totalGems;
                case "levels_completed":
                    return profile.levelsCompleted;
                default:
                    return 0;
            }
        }
        
        private void UpdateChallenges()
        {
            var expiredChallenges = new List<string>();
            
            foreach (var kvp in _activeChallenges)
            {
                var challenge = kvp.Value;
                if (challenge.endTime <= DateTime.Now)
                {
                    challenge.isActive = false;
                    expiredChallenges.Add(kvp.Key);
                }
            }
            
            foreach (var challengeId in expiredChallenges)
            {
                _activeChallenges.Remove(challengeId);
            }
        }
        
        private void UpdateAnalytics()
        {
            if (_analyticsSystem != null)
            {
                // Analytics system updates automatically
            }
        }
        
        private void UpdateRetentionSystems()
        {
            if (_retentionSystem != null)
            {
                // Retention system updates automatically
            }
        }
        
        private void RefreshExpiredOffers()
        {
            var expiredOffers = new List<string>();
            
            foreach (var kvp in _activeOffers)
            {
                var offer = kvp.Value;
                if (offer.expiresAt <= DateTime.Now)
                {
                    offer.isActive = false;
                    expiredOffers.Add(kvp.Key);
                }
            }
            
            foreach (var offerId in expiredOffers)
            {
                _activeOffers.Remove(offerId);
            }
        }
        
        private void GenerateNewOffers()
        {
            if (_offerSystem == null) return;
            
            var activePlayerIds = GetActivePlayerIds();
            
            foreach (var playerId in activePlayerIds)
            {
                var profile = GetPlayerProfile(playerId);
                var offers = _offerSystem.GetOffersForPlayer(playerId);
                
                foreach (var offer in offers)
                {
                    if (_activeOffers.Count < maxActiveOffers)
                    {
                        _activeOffers[offer.id] = offer;
                        OnOfferCreated?.Invoke(offer);
                    }
                }
            }
        }
        
        private void TriggerEnergyOffers()
        {
            Debug.Log("Triggering energy-focused offers due to low energy");
            // This would trigger energy-specific offers
        }
        
        private void TriggerSubscriptionOffers()
        {
            Debug.Log("Triggering subscription-focused offers due to low subscription count");
            // This would trigger subscription-specific offers
        }
        
        private void TriggerSocialFeatures()
        {
            Debug.Log("Triggering social features due to low engagement");
            // This would trigger social challenges or features
        }
        
        private List<string> GetActivePlayerIds()
        {
            return _playerProfiles.Keys.ToList();
        }
        
        // Public API Methods
        
        public bool CanPlayLevel(string playerId)
        {
            if (_energySystem == null) return true;
            return _energySystem.CanPlayLevel();
        }
        
        public bool TryConsumeEnergy(string playerId, int amount = 1)
        {
            if (_energySystem == null) return true;
            return _energySystem.TryConsumeEnergy(amount);
        }
        
        public int GetCurrentEnergy(string playerId)
        {
            if (_energySystem == null) return maxEnergy;
            return _energySystem.GetCurrentEnergy();
        }
        
        public int GetMaxEnergy(string playerId)
        {
            if (_energySystem == null) return maxEnergy;
            return _energySystem.GetMaxEnergy();
        }
        
        public bool HasActiveSubscription(string playerId)
        {
            if (_subscriptionSystem == null) return false;
            return _subscriptionSystem.HasActiveSubscription(playerId);
        }
        
        public float GetSubscriptionMultiplier(string playerId, string multiplierType)
        {
            if (_subscriptionSystem == null) return 1f;
            return _subscriptionSystem.GetSubscriptionMultiplier(playerId, multiplierType);
        }
        
        public List<PersonalizedOffer> GetPersonalizedOffers(string playerId)
        {
            if (_offerSystem == null) return new List<PersonalizedOffer>();
            return _offerSystem.GetOffersForPlayer(playerId);
        }
        
        public bool PurchaseOffer(string playerId, string offerId)
        {
            if (_offerSystem == null) return false;
            return _offerSystem.PurchaseOffer(offerId, playerId);
        }
        
        public List<LeaderboardEntry> GetLeaderboard(string type, int limit = 10)
        {
            if (!_leaderboards.ContainsKey(type)) return new List<LeaderboardEntry>();
            return _leaderboards[type].entries.Take(limit).ToList();
        }
        
        public bool CreateGuild(string playerId, string guildName, string description)
        {
            if (_socialSystem == null) return false;
            return _socialSystem.CreateGuild(playerId, guildName, description);
        }
        
        public bool JoinGuild(string playerId, string guildId)
        {
            if (_socialSystem == null) return false;
            return _socialSystem.JoinGuild(playerId, guildId);
        }
        
        public bool StartChallenge(string playerId, ChallengeType challengeType)
        {
            if (_socialSystem == null) return false;
            return _socialSystem.StartSocialChallenge(playerId, challengeType);
        }
        
        public bool SendGift(string fromPlayerId, string toPlayerId, GiftType giftType, int quantity)
        {
            if (_socialSystem == null) return false;
            return _socialSystem.SendGift(fromPlayerId, toPlayerId, giftType, quantity);
        }
        
        public void TrackRevenue(string playerId, float amount, RevenueSource source, string itemId = "")
        {
            if (_analyticsSystem == null) return;
            _analyticsSystem.TrackRevenue(playerId, amount, source, itemId);
        }
        
        public void TrackPlayerAction(string playerId, string action, Dictionary<string, object> parameters = null)
        {
            if (_analyticsSystem == null) return;
            _analyticsSystem.TrackPlayerAction(playerId, action, parameters);
        }
        
        public PlayerARPUProfile GetPlayerProfile(string playerId)
        {
            if (!_playerProfiles.ContainsKey(playerId))
            {
                _playerProfiles[playerId] = new PlayerARPUProfile
                {
                    playerId = playerId,
                    playerName = "Player_" + playerId.Substring(0, 8),
                    totalSpent = 0f,
                    iapSpent = 0f,
                    subscriptionSpent = 0f,
                    adRevenue = 0f,
                    purchaseCount = 0,
                    lastPurchaseTime = DateTime.MinValue,
                    installDate = DateTime.Now,
                    lastPlayTime = DateTime.Now,
                    tutorialCompleted = false,
                    levelsCompleted = 0,
                    hasActiveSubscription = false,
                    segment = "non_payer",
                    predictedLTV = 0f,
                    weeklyScore = 0,
                    monthlyScore = 0,
                    totalCoins = 0,
                    totalGems = 0
                };
            }
            
            return _playerProfiles[playerId];
        }
        
        public Dictionary<string, object> GetARPUReport()
        {
            if (_analyticsSystem == null) return new Dictionary<string, object>();
            return _analyticsSystem.GetARPUReport();
        }
        
        public Dictionary<string, object> GetSystemStatus()
        {
            return new Dictionary<string, object>
            {
                ["energy_system"] = _energySystem != null,
                ["subscription_system"] = _subscriptionSystem != null,
                ["offer_system"] = _offerSystem != null,
                ["social_system"] = _socialSystem != null,
                ["analytics_system"] = _analyticsSystem != null,
                ["retention_system"] = _retentionSystem != null,
                ["monetization_system"] = _monetizationSystem != null,
                ["total_players"] = _playerProfiles.Count,
                ["active_offers"] = _activeOffers.Count,
                ["active_guilds"] = _guilds.Count,
                ["active_challenges"] = _activeChallenges.Count
            };
        }
        
        private void LoadARPUData()
        {
            // Load saved ARPU data
            string path = Application.persistentDataPath + "/arpu_data.json";
            if (System.IO.File.Exists(path))
            {
                try
                {
                    string json = System.IO.File.ReadAllText(path);
                    var saveData = JsonUtility.FromJson<ARPUData>(json);
                    
                    if (saveData.playerProfiles != null)
                    {
                        _playerProfiles = saveData.playerProfiles;
                    }
                    
                    if (saveData.revenueEvents != null)
                    {
                        _revenueEvents = saveData.revenueEvents;
                    }
                    
                    if (saveData.activeOffers != null)
                    {
                        _activeOffers = saveData.activeOffers;
                    }
                    
                    if (saveData.guilds != null)
                    {
                        _guilds = saveData.guilds;
                    }
                    
                    if (saveData.activeChallenges != null)
                    {
                        _activeChallenges = saveData.activeChallenges;
                    }
                }
                catch (Exception e)
                {
                    Debug.LogError($"Failed to load ARPU data: {e.Message}");
                }
            }
        }
        
        private void SaveARPUData()
        {
            var saveData = new ARPUData
            {
                playerProfiles = _playerProfiles,
                revenueEvents = _revenueEvents,
                activeOffers = _activeOffers,
                guilds = _guilds,
                activeChallenges = _activeChallenges
            };
            
            string json = JsonUtility.ToJson(saveData, true);
            System.IO.File.WriteAllText(Application.persistentDataPath + "/arpu_data.json", json);
        }
        
        void OnDestroy()
        {
            if (_arpuUpdateCoroutine != null)
                StopCoroutine(_arpuUpdateCoroutine);
            if (_offerRefreshCoroutine != null)
                StopCoroutine(_offerRefreshCoroutine);
            if (_analyticsUpdateCoroutine != null)
                StopCoroutine(_analyticsUpdateCoroutine);
            if (_retentionUpdateCoroutine != null)
                StopCoroutine(_retentionUpdateCoroutine);
            
            SaveARPUData();
        }
    }
    
    // Data Classes
    [System.Serializable]
    public class PlayerARPUProfile
    {
        public string playerId;
        public string playerName;
        public float totalSpent;
        public float iapSpent;
        public float subscriptionSpent;
        public float adRevenue;
        public int purchaseCount;
        public DateTime lastPurchaseTime;
        public DateTime installDate;
        public DateTime lastPlayTime;
        public bool tutorialCompleted;
        public int levelsCompleted;
        public bool hasActiveSubscription;
        public string segment;
        public float predictedLTV;
        public int weeklyScore;
        public int monthlyScore;
        public int totalCoins;
        public int totalGems;
    }
    
    [System.Serializable]
    public class RevenueEvent
    {
        public string id;
        public string playerId;
        public float amount;
        public RevenueSource source;
        public string itemId;
        public DateTime timestamp;
    }
    
    [System.Serializable]
    public class PersonalizedOffer
    {
        public string id;
        public string templateId;
        public string name;
        public float originalPrice;
        public float personalizedPrice;
        public float discount;
        public Dictionary<string, int> rewards;
        public string playerId;
        public DateTime createdAt;
        public DateTime expiresAt;
        public bool isActive;
        public Dictionary<string, object> personalizationFactors;
    }
    
    [System.Serializable]
    public class Guild
    {
        public string id;
        public string name;
        public string description;
        public string leaderId;
        public List<string> members;
        public int level;
        public int experience;
        public int maxMembers;
        public DateTime createdAt;
        public bool isActive;
    }
    
    [System.Serializable]
    public class SocialChallenge
    {
        public string id;
        public ChallengeType type;
        public string creatorId;
        public List<string> participants;
        public DateTime startTime;
        public DateTime endTime;
        public bool isActive;
        public Dictionary<string, int> rewards;
    }
    
    [System.Serializable]
    public class Leaderboard
    {
        public string type;
        public List<LeaderboardEntry> entries;
        public DateTime lastUpdated;
    }
    
    [System.Serializable]
    public class LeaderboardEntry
    {
        public string playerId;
        public string playerName;
        public int score;
        public int rank;
        public DateTime lastUpdated;
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
    public class ARPUData
    {
        public Dictionary<string, PlayerARPUProfile> playerProfiles;
        public Dictionary<string, RevenueEvent> revenueEvents;
        public Dictionary<string, PersonalizedOffer> activeOffers;
        public Dictionary<string, Guild> guilds;
        public Dictionary<string, SocialChallenge> activeChallenges;
    }
    
    public enum RevenueSource
    {
        IAP,
        Subscription,
        Ad
    }
    
    public enum ChallengeType
    {
        ScoreCompetition,
        LevelRace,
        CollectionChallenge
    }
    
    public enum GiftType
    {
        Coins,
        Gems,
        Energy
    }
}