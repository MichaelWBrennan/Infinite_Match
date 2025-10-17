using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using Evergreen.Core;
using Evergreen.Analytics;

namespace Evergreen.Monetization
{
    /// <summary>
    /// Advanced monetization system with dynamic pricing, subscriptions, and psychological triggers
    /// Designed for maximum revenue generation and player retention
    /// </summary>
    public class AdvancedMonetizationSystem : MonoBehaviour
    {
        [Header("Dynamic Pricing")]
        public bool enableDynamicPricing = true;
        public float basePriceMultiplier = 1.0f;
        public float highSpenderMultiplier = 1.3f;
        public float priceSensitiveMultiplier = 0.7f;
        public float urgencyMultiplier = 1.5f;
        
        [Header("Subscription System")]
        public bool enableSubscriptions = true;
        public float subscriptionPrice = 9.99f;
        public int subscriptionDuration = 30; // days
        public float subscriptionRewardMultiplier = 2.0f;
        
        [Header("Battle Pass System")]
        public bool enableBattlePass = true;
        public int battlePassLevels = 50;
        public float xpPerLevel = 1000f;
        public float battlePassPrice = 4.99f;
        public int daysRemaining = 14;
        
        [Header("Impulse Purchase Triggers")]
        public bool enableImpulsePurchases = true;
        public float impulseChance = 0.15f;
        public float impulseDiscount = 0.5f;
        public float impulseDuration = 300f; // 5 minutes
        
        [Header("VIP System")]
        public bool enableVIPSystem = true;
        public int[] vipThresholds = { 100, 500, 1000, 2500, 5000 }; // USD spent
        public string[] vipTiers = { "Bronze", "Silver", "Gold", "Platinum", "Diamond" };
        public float[] vipMultipliers = { 1.0f, 1.1f, 1.2f, 1.3f, 1.5f };
        
        [Header("Limited Time Offers")]
        public bool enableLimitedOffers = true;
        public float offerChance = 0.2f;
        public float offerDiscount = 0.6f;
        public float offerDuration = 1800f; // 30 minutes
        
        private Dictionary<string, PlayerMonetizationProfile> _playerProfiles = new Dictionary<string, PlayerMonetizationProfile>();
        private Dictionary<string, DynamicPrice> _dynamicPrices = new Dictionary<string, DynamicPrice>();
        private Dictionary<string, Subscription> _subscriptions = new Dictionary<string, Subscription>();
        private Dictionary<string, BattlePass> _battlePasses = new Dictionary<string, BattlePass>();
        private Dictionary<string, ImpulseOffer> _impulseOffers = new Dictionary<string, ImpulseOffer>();
        private Dictionary<string, LimitedOffer> _limitedOffers = new Dictionary<string, LimitedOffer>();
        private Dictionary<string, VIPStatus> _vipStatuses = new Dictionary<string, VIPStatus>();
        
        private Coroutine _pricingUpdateCoroutine;
        private Coroutine _offerGenerationCoroutine;
        private Coroutine _subscriptionCheckCoroutine;
        
        // Events
        public System.Action<DynamicPrice> OnPriceUpdated;
        public System.Action<Subscription> OnSubscriptionStarted;
        public System.Action<BattlePass> OnBattlePassPurchased;
        public System.Action<ImpulseOffer> OnImpulseOfferCreated;
        public System.Action<LimitedOffer> OnLimitedOfferCreated;
        public System.Action<VIPStatus> OnVIPStatusUpdated;
        
        public static AdvancedMonetizationSystem Instance { get; private set; }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeMonetizationSystem();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            StartMonetizationSystems();
        }
        
        private void InitializeMonetizationSystem()
        {
            Debug.Log("Advanced Monetization System initialized - Maximum revenue mode activated!");
            
            // Initialize dynamic pricing
            InitializeDynamicPricing();
            
            // Initialize subscriptions
            InitializeSubscriptions();
            
            // Initialize battle pass
            InitializeBattlePass();
            
            // Initialize VIP system
            InitializeVIPSystem();
            
            // Load player profiles
            LoadPlayerProfiles();
        }
        
        private void InitializeDynamicPricing()
        {
            // Initialize dynamic pricing for all shop items
            var shopSystem = ShopSystem.Instance;
            if (shopSystem != null)
            {
                var items = shopSystem.GetAvailableItems("default");
                foreach (var item in items)
                {
                    _dynamicPrices[item.id] = new DynamicPrice
                    {
                        itemId = item.id,
                        basePrice = item.costs[0].amount,
                        currentPrice = item.costs[0].amount,
                        minPrice = Mathf.RoundToInt(item.costs[0].amount * 0.5f),
                        maxPrice = Mathf.RoundToInt(item.costs[0].amount * 2.0f),
                        lastUpdated = DateTime.Now
                    };
                }
            }
        }
        
        private void InitializeSubscriptions()
        {
            // Initialize subscription templates
            _subscriptions["premium"] = new Subscription
            {
                id = "premium",
                name = "Premium Subscription",
                price = subscriptionPrice,
                duration = subscriptionDuration,
                benefits = new List<string>
                {
                    "2x XP and coins",
                    "Exclusive items",
                    "Priority support",
                    "No ads",
                    "Daily bonus"
                },
                isActive = false
            };
        }
        
        private void InitializeBattlePass()
        {
            // Initialize battle pass
            _battlePasses["season_1"] = new BattlePass
            {
                id = "season_1",
                name = "Season 1 Battle Pass",
                price = battlePassPrice,
                levels = battlePassLevels,
                xpPerLevel = xpPerLevel,
                daysRemaining = daysRemaining,
                isActive = true,
                rewards = GenerateBattlePassRewards()
            };
        }
        
        private void InitializeVIPSystem()
        {
            // Initialize VIP tiers
            for (int i = 0; i < vipTiers.Length; i++)
            {
                _vipStatuses[vipTiers[i].ToLower()] = new VIPStatus
                {
                    tier = vipTiers[i],
                    threshold = vipThresholds[i],
                    multiplier = vipMultipliers[i],
                    benefits = GenerateVIPBenefits(vipTiers[i])
                };
            }
        }
        
        private List<BattlePassReward> GenerateBattlePassRewards()
        {
            var rewards = new List<BattlePassReward>();
            
            for (int i = 1; i <= battlePassLevels; i++)
            {
                var reward = new BattlePassReward
                {
                    level = i,
                    isFree = i % 3 == 0, // Every 3rd level is free
                    rewards = GenerateLevelRewards(i)
                };
                rewards.Add(reward);
            }
            
            return rewards;
        }
        
        private List<string> GenerateLevelRewards(int level)
        {
            var rewards = new List<string>();
            
            if (level % 5 == 0)
            {
                rewards.Add("coins:" + (level * 100));
                rewards.Add("gems:" + (level * 5));
            }
            else if (level % 3 == 0)
            {
                rewards.Add("energy:" + 5);
                rewards.Add("booster_extra_moves:" + 2);
            }
            else
            {
                rewards.Add("coins:" + (level * 50));
            }
            
            return rewards;
        }
        
        private List<string> GenerateVIPBenefits(string tier)
        {
            var benefits = new List<string>();
            
            switch (tier.ToLower())
            {
                case "bronze":
                    benefits.AddRange(new[] { "5% bonus coins", "Priority support" });
                    break;
                case "silver":
                    benefits.AddRange(new[] { "10% bonus coins", "Exclusive items", "Priority support" });
                    break;
                case "gold":
                    benefits.AddRange(new[] { "15% bonus coins", "Exclusive items", "Priority support", "No ads" });
                    break;
                case "platinum":
                    benefits.AddRange(new[] { "20% bonus coins", "Exclusive items", "Priority support", "No ads", "Daily bonus" });
                    break;
                case "diamond":
                    benefits.AddRange(new[] { "25% bonus coins", "Exclusive items", "Priority support", "No ads", "Daily bonus", "VIP events" });
                    break;
            }
            
            return benefits;
        }
        
        private void StartMonetizationSystems()
        {
            if (enableDynamicPricing)
            {
                _pricingUpdateCoroutine = StartCoroutine(PricingUpdateCoroutine());
            }
            
            if (enableImpulsePurchases || enableLimitedOffers)
            {
                _offerGenerationCoroutine = StartCoroutine(OfferGenerationCoroutine());
            }
            
            if (enableSubscriptions)
            {
                _subscriptionCheckCoroutine = StartCoroutine(SubscriptionCheckCoroutine());
            }
        }
        
        #region Dynamic Pricing
        private IEnumerator PricingUpdateCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(60f); // Update every minute
                
                UpdateDynamicPricing();
            }
        }
        
        private void UpdateDynamicPricing()
        {
            foreach (var kvp in _dynamicPrices)
            {
                var price = kvp.Value;
                var newPrice = CalculateDynamicPrice(price);
                
                if (newPrice != price.currentPrice)
                {
                    price.currentPrice = newPrice;
                    price.lastUpdated = DateTime.Now;
                    OnPriceUpdated?.Invoke(price);
                }
            }
        }
        
        private int CalculateDynamicPrice(DynamicPrice price)
        {
            float multiplier = basePriceMultiplier;
            
            // Apply time-based pricing
            var timeSinceUpdate = DateTime.Now - price.lastUpdated;
            if (timeSinceUpdate.TotalHours > 24)
            {
                multiplier *= 0.9f; // Slight discount for old prices
            }
            
            // Apply demand-based pricing
            var demand = CalculateDemand(price.itemId);
            if (demand > 0.8f)
            {
                multiplier *= 1.2f; // Increase price for high demand
            }
            else if (demand < 0.3f)
            {
                multiplier *= 0.8f; // Decrease price for low demand
            }
            
            int newPrice = Mathf.RoundToInt(price.basePrice * multiplier);
            return Mathf.Clamp(newPrice, price.minPrice, price.maxPrice);
        }
        
        private float CalculateDemand(string itemId)
        {
            // Calculate demand based on recent purchases
            // This would implement demand calculation logic
            return UnityEngine.Random.Range(0.3f, 0.9f);
        }
        
        public int GetDynamicPrice(string itemId, string playerId)
        {
            if (!_dynamicPrices.ContainsKey(itemId))
                return 0;
                
            var price = _dynamicPrices[itemId];
            var profile = GetPlayerProfile(playerId);
            
            // Apply player-specific pricing
            float playerMultiplier = 1.0f;
            
            if (profile.isHighSpender)
            {
                playerMultiplier *= highSpenderMultiplier;
            }
            else if (profile.isPriceSensitive)
            {
                playerMultiplier *= priceSensitiveMultiplier;
            }
            
            if (profile.hasUrgency)
            {
                playerMultiplier *= urgencyMultiplier;
            }
            
            return Mathf.RoundToInt(price.currentPrice * playerMultiplier);
        }
        #endregion
        
        #region Subscription System
        private IEnumerator SubscriptionCheckCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(3600f); // Check every hour
                
                CheckSubscriptions();
            }
        }
        
        private void CheckSubscriptions()
        {
            foreach (var subscription in _subscriptions.Values)
            {
                if (subscription.isActive && subscription.expiryDate <= DateTime.Now)
                {
                    subscription.isActive = false;
                    // Notify player of expiry
                    NotifySubscriptionExpiry(subscription);
                }
            }
        }
        
        public bool StartSubscription(string playerId, string subscriptionId)
        {
            if (!_subscriptions.ContainsKey(subscriptionId))
                return false;
                
            var subscription = _subscriptions[subscriptionId];
            var profile = GetPlayerProfile(playerId);
            
            subscription.playerId = playerId;
            subscription.startDate = DateTime.Now;
            subscription.expiryDate = DateTime.Now.AddDays(subscription.duration);
            subscription.isActive = true;
            
            profile.hasActiveSubscription = true;
            profile.subscriptionTier = subscriptionId;
            
            OnSubscriptionStarted?.Invoke(subscription);
            
            // Apply subscription benefits
            ApplySubscriptionBenefits(playerId, subscription);
            
            return true;
        }
        
        private void ApplySubscriptionBenefits(string playerId, Subscription subscription)
        {
            // Apply subscription benefits to player
            var gameManager = OptimizedCoreSystem.Instance;
            if (gameManager != null)
            {
                // Apply 2x XP and coins multiplier
                // This would integrate with your existing systems
            }
        }
        
        private void NotifySubscriptionExpiry(Subscription subscription)
        {
            var uiSystem = OptimizedUISystem.Instance;
            if (uiSystem != null)
            {
                uiSystem.ShowNotification($"Your {subscription.name} has expired! Renew now for continued benefits!", 
                    NotificationType.Warning, 10f);
            }
        }
        #endregion
        
        #region Battle Pass System
        public bool PurchaseBattlePass(string playerId, string battlePassId)
        {
            if (!_battlePasses.ContainsKey(battlePassId))
                return false;
                
            var battlePass = _battlePasses[battlePassId];
            var profile = GetPlayerProfile(playerId);
            
            if (profile.hasBattlePass)
                return false; // Already has battle pass
                
            battlePass.playerId = playerId;
            battlePass.purchaseDate = DateTime.Now;
            battlePass.isActive = true;
            
            profile.hasBattlePass = true;
            profile.battlePassId = battlePassId;
            profile.battlePassLevel = 0;
            profile.battlePassXP = 0;
            
            OnBattlePassPurchased?.Invoke(battlePass);
            
            return true;
        }
        
        public void AddBattlePassXP(string playerId, int xp)
        {
            var profile = GetPlayerProfile(playerId);
            if (!profile.hasBattlePass)
                return;
                
            profile.battlePassXP += xp;
            
            // Check for level up
            int newLevel = Mathf.FloorToInt(profile.battlePassXP / 1000f);
            if (newLevel > profile.battlePassLevel)
            {
                LevelUpBattlePass(playerId, newLevel);
            }
        }
        
        private void LevelUpBattlePass(string playerId, int newLevel)
        {
            var profile = GetPlayerProfile(playerId);
            var battlePass = _battlePasses[profile.battlePassId];
            
            profile.battlePassLevel = newLevel;
            
            // Award rewards for the new level
            var rewards = battlePass.rewards.Where(r => r.level == newLevel).ToList();
            foreach (var reward in rewards)
            {
                if (reward.isFree || profile.hasBattlePass)
                {
                    AwardBattlePassReward(playerId, reward);
                }
            }
            
            // Show level up notification
            var uiSystem = OptimizedUISystem.Instance;
            if (uiSystem != null)
            {
                uiSystem.ShowNotification($"Battle Pass Level {newLevel} reached! Check your rewards!", 
                    NotificationType.Success, 5f);
            }
        }
        
        private void AwardBattlePassReward(string playerId, BattlePassReward reward)
        {
            var gameManager = OptimizedCoreSystem.Instance;
            if (gameManager == null) return;
            
            foreach (var rewardString in reward.rewards)
            {
                var parts = rewardString.Split(':');
                if (parts.Length == 2)
                {
                    var type = parts[0];
                    var amount = int.Parse(parts[1]);
                    
                    switch (type)
                    {
                        case "coins":
                            gameManager.AddCurrency("coins", amount);
                            break;
                        case "gems":
                            gameManager.AddCurrency("gems", amount);
                            break;
                        case "energy":
                            gameManager.AddCurrency("energy", amount);
                            break;
                        case "booster_extra_moves":
                            gameManager.AddInventoryItem("booster_extra_moves", amount);
                            break;
                    }
                }
            }
        }
        #endregion
        
        #region Impulse Purchase System
        private IEnumerator OfferGenerationCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(300f); // Check every 5 minutes
                
                if (enableImpulsePurchases)
                {
                    CheckImpulsePurchases();
                }
                
                if (enableLimitedOffers)
                {
                    CheckLimitedOffers();
                }
            }
        }
        
        private void CheckImpulsePurchases()
        {
            foreach (var profile in _playerProfiles.Values)
            {
                if (ShouldCreateImpulseOffer(profile))
                {
                    CreateImpulseOffer(profile.playerId);
                }
            }
        }
        
        private bool ShouldCreateImpulseOffer(PlayerMonetizationProfile profile)
        {
            // Create impulse offers based on player behavior
            if (profile.hasActiveImpulseOffer)
                return false;
                
            if (profile.lastImpulseOffer > DateTime.Now.AddHours(-2))
                return false; // Minimum 2 hours between offers
                
            return UnityEngine.Random.Range(0f, 1f) < impulseChance;
        }
        
        private void CreateImpulseOffer(string playerId)
        {
            var profile = GetPlayerProfile(playerId);
            var offer = new ImpulseOffer
            {
                id = Guid.NewGuid().ToString(),
                playerId = playerId,
                itemId = "impulse_pack",
                originalPrice = 100,
                impulsePrice = Mathf.RoundToInt(100 * impulseDiscount),
                duration = impulseDuration,
                remainingTime = impulseDuration,
                isActive = true,
                createdAt = DateTime.Now
            };
            
            _impulseOffers[offer.id] = offer;
            profile.hasActiveImpulseOffer = true;
            profile.lastImpulseOffer = DateTime.Now;
            
            OnImpulseOfferCreated?.Invoke(offer);
            
            // Show impulse offer UI
            ShowImpulseOfferUI(offer);
            
            // Start countdown
            StartCoroutine(ImpulseOfferCountdown(offer));
        }
        
        private void ShowImpulseOfferUI(ImpulseOffer offer)
        {
            var uiSystem = OptimizedUISystem.Instance;
            if (uiSystem != null)
            {
                var message = $"⚡ IMPULSE DEAL! {offer.itemId} - {offer.impulsePrice} coins (was {offer.originalPrice})! Only {offer.remainingTime:F0}s left!";
                uiSystem.ShowNotification(message, NotificationType.Warning, 10f);
            }
        }
        
        private IEnumerator ImpulseOfferCountdown(ImpulseOffer offer)
        {
            while (offer.isActive && offer.remainingTime > 0)
            {
                yield return new WaitForSeconds(1f);
                offer.remainingTime -= 1f;
                
                if (offer.remainingTime <= 0)
                {
                    offer.isActive = false;
                    var profile = GetPlayerProfile(offer.playerId);
                    profile.hasActiveImpulseOffer = false;
                }
            }
        }
        #endregion
        
        #region Limited Time Offers
        private void CheckLimitedOffers()
        {
            if (UnityEngine.Random.Range(0f, 1f) < offerChance)
            {
                CreateLimitedOffer();
            }
        }
        
        private void CreateLimitedOffer()
        {
            var offer = new LimitedOffer
            {
                id = Guid.NewGuid().ToString(),
                name = "Limited Time Offer",
                description = "Exclusive items at 60% off!",
                originalPrice = 200,
                limitedPrice = Mathf.RoundToInt(200 * (1f - offerDiscount)),
                duration = offerDuration,
                remainingTime = offerDuration,
                isActive = true,
                createdAt = DateTime.Now
            };
            
            _limitedOffers[offer.id] = offer;
            OnLimitedOfferCreated?.Invoke(offer);
            
            // Show limited offer UI
            ShowLimitedOfferUI(offer);
            
            // Start countdown
            StartCoroutine(LimitedOfferCountdown(offer));
        }
        
        private void ShowLimitedOfferUI(LimitedOffer offer)
        {
            var uiSystem = OptimizedUISystem.Instance;
            if (uiSystem != null)
            {
                var message = $"🔥 LIMITED TIME! {offer.name} - {offer.limitedPrice} coins (was {offer.originalPrice})! Only {offer.remainingTime:F0}s left!";
                uiSystem.ShowNotification(message, NotificationType.Error, 15f);
            }
        }
        
        private IEnumerator LimitedOfferCountdown(LimitedOffer offer)
        {
            while (offer.isActive && offer.remainingTime > 0)
            {
                yield return new WaitForSeconds(1f);
                offer.remainingTime -= 1f;
                
                if (offer.remainingTime <= 0)
                {
                    offer.isActive = false;
                }
            }
        }
        #endregion
        
        #region VIP System
        public void UpdateVIPStatus(string playerId)
        {
            var profile = GetPlayerProfile(playerId);
            var totalSpent = profile.totalSpent;
            
            string newTier = "bronze";
            for (int i = vipThresholds.Length - 1; i >= 0; i--)
            {
                if (totalSpent >= vipThresholds[i])
                {
                    newTier = vipTiers[i].ToLower();
                    break;
                }
            }
            
            if (profile.vipTier != newTier)
            {
                profile.vipTier = newTier;
                var vipStatus = _vipStatuses[newTier];
                vipStatus.playerId = playerId;
                vipStatus.achievedDate = DateTime.Now;
                
                OnVIPStatusUpdated?.Invoke(vipStatus);
                
                // Show VIP status update
                ShowVIPStatusUpdate(vipStatus);
            }
        }
        
        private void ShowVIPStatusUpdate(VIPStatus vipStatus)
        {
            var uiSystem = OptimizedUISystem.Instance;
            if (uiSystem != null)
            {
                var message = $"🎉 VIP {vipStatus.tier.ToUpper()} achieved! New benefits unlocked!";
                uiSystem.ShowNotification(message, NotificationType.Success, 8f);
            }
        }
        
        public float GetVIPMultiplier(string playerId)
        {
            var profile = GetPlayerProfile(playerId);
            if (string.IsNullOrEmpty(profile.vipTier))
                return 1.0f;
                
            var vipStatus = _vipStatuses[profile.vipTier];
            return vipStatus.multiplier;
        }
        #endregion
        
        #region Player Profile Management
        private PlayerMonetizationProfile GetPlayerProfile(string playerId)
        {
            if (!_playerProfiles.ContainsKey(playerId))
            {
                _playerProfiles[playerId] = new PlayerMonetizationProfile
                {
                    playerId = playerId,
                    totalSpent = 0f,
                    isHighSpender = false,
                    isPriceSensitive = false,
                    hasUrgency = false,
                    hasActiveSubscription = false,
                    hasBattlePass = false,
                    hasActiveImpulseOffer = false,
                    vipTier = "bronze",
                    lastImpulseOffer = DateTime.MinValue,
                    lastPurchase = DateTime.MinValue
                };
            }
            
            return _playerProfiles[playerId];
        }
        
        public void OnPurchaseMade(string playerId, float amount, string currency)
        {
            var profile = GetPlayerProfile(playerId);
            profile.totalSpent += amount;
            profile.lastPurchase = DateTime.Now;
            
            // Update spending behavior
            UpdateSpendingBehavior(profile);
            
            // Update VIP status
            UpdateVIPStatus(playerId);
            
            // Track for analytics
            var analytics = AdvancedAnalyticsSystem.Instance;
            if (analytics != null)
            {
                analytics.TrackPurchase("monetization_purchase", amount, currency, new Dictionary<string, object>
                {
                    ["player_id"] = playerId,
                    ["total_spent"] = profile.totalSpent,
                    ["vip_tier"] = profile.vipTier
                });
            }
        }
        
        private void UpdateSpendingBehavior(PlayerMonetizationProfile profile)
        {
            // Determine if player is high spender
            profile.isHighSpender = profile.totalSpent > 100f;
            
            // Determine if player is price sensitive
            profile.isPriceSensitive = profile.totalSpent < 50f && profile.lastPurchase < DateTime.Now.AddDays(-7);
            
            // Determine if player has urgency
            profile.hasUrgency = profile.lastPurchase > DateTime.Now.AddHours(-1);
        }
        
        private void LoadPlayerProfiles()
        {
            // Load player profiles from save data
            // This would implement profile loading logic
        }
        
        private void SavePlayerProfiles()
        {
            // Save player profiles to persistent storage
            // This would implement profile saving logic
        }
        #endregion
        
        #region Public API
        public Dictionary<string, object> GetMonetizationStatistics()
        {
            return new Dictionary<string, object>
            {
                {"total_players", _playerProfiles.Count},
                {"total_revenue", _playerProfiles.Values.Sum(p => p.totalSpent)},
                {"average_revenue_per_user", _playerProfiles.Values.Average(p => p.totalSpent)},
                {"subscription_count", _subscriptions.Values.Count(s => s.isActive)},
                {"battle_pass_count", _playerProfiles.Values.Count(p => p.hasBattlePass)},
                {"active_impulse_offers", _impulseOffers.Values.Count(o => o.isActive)},
                {"active_limited_offers", _limitedOffers.Values.Count(o => o.isActive)},
                {"vip_distribution", GetVIPDistribution()}
            };
        }
        
        private Dictionary<string, int> GetVIPDistribution()
        {
            var distribution = new Dictionary<string, int>();
            foreach (var tier in vipTiers)
            {
                distribution[tier] = _playerProfiles.Values.Count(p => p.vipTier == tier.ToLower());
            }
            return distribution;
        }
        #endregion
        
        void OnDestroy()
        {
            if (_pricingUpdateCoroutine != null)
                StopCoroutine(_pricingUpdateCoroutine);
            if (_offerGenerationCoroutine != null)
                StopCoroutine(_offerGenerationCoroutine);
            if (_subscriptionCheckCoroutine != null)
                StopCoroutine(_subscriptionCheckCoroutine);
                
            SavePlayerProfiles();
        }
    }
    
    // Data Classes
    [System.Serializable]
    public class PlayerMonetizationProfile
    {
        public string playerId;
        public float totalSpent;
        public bool isHighSpender;
        public bool isPriceSensitive;
        public bool hasUrgency;
        public bool hasActiveSubscription;
        public string subscriptionTier;
        public bool hasBattlePass;
        public string battlePassId;
        public int battlePassLevel;
        public int battlePassXP;
        public bool hasActiveImpulseOffer;
        public string vipTier;
        public DateTime lastImpulseOffer;
        public DateTime lastPurchase;
    }
    
    [System.Serializable]
    public class DynamicPrice
    {
        public string itemId;
        public int basePrice;
        public int currentPrice;
        public int minPrice;
        public int maxPrice;
        public DateTime lastUpdated;
    }
    
    [System.Serializable]
    public class Subscription
    {
        public string id;
        public string name;
        public float price;
        public int duration;
        public List<string> benefits;
        public bool isActive;
        public string playerId;
        public DateTime startDate;
        public DateTime expiryDate;
    }
    
    [System.Serializable]
    public class BattlePass
    {
        public string id;
        public string name;
        public float price;
        public int levels;
        public float xpPerLevel;
        public int daysRemaining;
        public bool isActive;
        public string playerId;
        public DateTime purchaseDate;
        public List<BattlePassReward> rewards;
    }
    
    [System.Serializable]
    public class BattlePassReward
    {
        public int level;
        public bool isFree;
        public List<string> rewards;
    }
    
    [System.Serializable]
    public class ImpulseOffer
    {
        public string id;
        public string playerId;
        public string itemId;
        public int originalPrice;
        public int impulsePrice;
        public float duration;
        public float remainingTime;
        public bool isActive;
        public DateTime createdAt;
    }
    
    [System.Serializable]
    public class LimitedOffer
    {
        public string id;
        public string name;
        public string description;
        public int originalPrice;
        public int limitedPrice;
        public float duration;
        public float remainingTime;
        public bool isActive;
        public DateTime createdAt;
    }
    
    [System.Serializable]
    public class VIPStatus
    {
        public string tier;
        public int threshold;
        public float multiplier;
        public List<string> benefits;
        public string playerId;
        public DateTime achievedDate;
    }
}