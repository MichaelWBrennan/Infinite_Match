using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Evergreen.Core;
using Evergreen.Analytics;

namespace Evergreen.Monetization
{
    /// <summary>
    /// Advanced Subscription System with multiple tiers and benefits
    /// Maximizes ARPU through recurring revenue and exclusive benefits
    /// </summary>
    public class SubscriptionSystem : MonoBehaviour
    {
        [Header("Subscription Settings")]
        public bool enableSubscriptions = true;
        public float subscriptionCheckInterval = 3600f; // 1 hour
        
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
        
        private Dictionary<string, PlayerSubscription> _playerSubscriptions = new Dictionary<string, PlayerSubscription>();
        private Coroutine _subscriptionCheckCoroutine;
        
        // Events
        public static event Action<PlayerSubscription> OnSubscriptionStarted;
        public static event Action<PlayerSubscription> OnSubscriptionRenewed;
        public static event Action<PlayerSubscription> OnSubscriptionExpired;
        public static event Action<PlayerSubscription> OnSubscriptionCancelled;
        public static event Action<SubscriptionBenefit> OnBenefitApplied;
        
        public static SubscriptionSystem Instance { get; private set; }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeSubscriptionSystem();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            if (enableSubscriptions)
            {
                LoadSubscriptionData();
                StartSubscriptionMonitoring();
            }
        }
        
        private void InitializeSubscriptionSystem()
        {
            Debug.Log("Subscription System initialized - Recurring revenue mode activated!");
        }
        
        private void LoadSubscriptionData()
        {
            // Load subscription data from save system
            // This would integrate with your existing save system
        }
        
        private void StartSubscriptionMonitoring()
        {
            _subscriptionCheckCoroutine = StartCoroutine(SubscriptionCheckCoroutine());
        }
        
        private IEnumerator SubscriptionCheckCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(subscriptionCheckInterval);
                
                CheckAllSubscriptions();
            }
        }
        
        private void CheckAllSubscriptions()
        {
            var expiredSubscriptions = new List<string>();
            
            foreach (var kvp in _playerSubscriptions)
            {
                var subscription = kvp.Value;
                
                if (subscription.isActive && subscription.expiryDate <= DateTime.Now)
                {
                    subscription.isActive = false;
                    expiredSubscriptions.Add(kvp.Key);
                    
                    OnSubscriptionExpired?.Invoke(subscription);
                    
                    // Track analytics
                    var analytics = AdvancedAnalyticsSystem.Instance;
                    if (analytics != null)
                    {
                        analytics.TrackEvent("subscription_expired", new Dictionary<string, object>
                        {
                            ["tier"] = subscription.tierId,
                            ["duration_days"] = (subscription.expiryDate - subscription.startDate).TotalDays
                        });
                    }
                }
            }
            
            // Remove expired subscriptions
            foreach (var playerId in expiredSubscriptions)
            {
                _playerSubscriptions.Remove(playerId);
            }
        }
        
        public bool StartSubscription(string playerId, string tierId)
        {
            if (!enableSubscriptions) return false;
            
            var tier = Array.Find(subscriptionTiers, t => t.id == tierId);
            if (tier == null) return false;
            
            var subscription = new PlayerSubscription
            {
                playerId = playerId,
                tierId = tierId,
                tierName = tier.name,
                startDate = DateTime.Now,
                expiryDate = DateTime.Now.AddDays(tier.duration),
                isActive = true,
                benefits = new List<SubscriptionBenefit>(tier.benefits)
            };
            
            _playerSubscriptions[playerId] = subscription;
            
            // Apply subscription benefits
            ApplySubscriptionBenefits(subscription);
            
            OnSubscriptionStarted?.Invoke(subscription);
            
            // Track analytics
            var analytics = AdvancedAnalyticsSystem.Instance;
            if (analytics != null)
            {
                analytics.TrackEvent("subscription_started", new Dictionary<string, object>
                {
                    ["tier"] = tierId,
                    ["price"] = tier.price,
                    ["duration"] = tier.duration
                });
            }
            
            return true;
        }
        
        public bool RenewSubscription(string playerId)
        {
            if (!_playerSubscriptions.ContainsKey(playerId)) return false;
            
            var subscription = _playerSubscriptions[playerId];
            var tier = Array.Find(subscriptionTiers, t => t.id == subscription.tierId);
            if (tier == null) return false;
            
            subscription.startDate = DateTime.Now;
            subscription.expiryDate = DateTime.Now.AddDays(tier.duration);
            subscription.isActive = true;
            
            // Reapply benefits
            ApplySubscriptionBenefits(subscription);
            
            OnSubscriptionRenewed?.Invoke(subscription);
            
            // Track analytics
            var analytics = AdvancedAnalyticsSystem.Instance;
            if (analytics != null)
            {
                analytics.TrackEvent("subscription_renewed", new Dictionary<string, object>
                {
                    ["tier"] = subscription.tierId,
                    ["price"] = tier.price
                });
            }
            
            return true;
        }
        
        public bool CancelSubscription(string playerId)
        {
            if (!_playerSubscriptions.ContainsKey(playerId)) return false;
            
            var subscription = _playerSubscriptions[playerId];
            subscription.isActive = false;
            
            // Remove benefits
            RemoveSubscriptionBenefits(subscription);
            
            OnSubscriptionCancelled?.Invoke(subscription);
            
            // Track analytics
            var analytics = AdvancedAnalyticsSystem.Instance;
            if (analytics != null)
            {
                analytics.TrackEvent("subscription_cancelled", new Dictionary<string, object>
                {
                    ["tier"] = subscription.tierId,
                    ["duration_days"] = (DateTime.Now - subscription.startDate).TotalDays
                });
            }
            
            return true;
        }
        
        private void ApplySubscriptionBenefits(PlayerSubscription subscription)
        {
            foreach (var benefit in subscription.benefits)
            {
                ApplyBenefit(subscription.playerId, benefit);
                OnBenefitApplied?.Invoke(benefit);
            }
        }
        
        private void RemoveSubscriptionBenefits(PlayerSubscription subscription)
        {
            foreach (var benefit in subscription.benefits)
            {
                RemoveBenefit(subscription.playerId, benefit);
            }
        }
        
        private void ApplyBenefit(string playerId, SubscriptionBenefit benefit)
        {
            switch (benefit.type)
            {
                case "energy_multiplier":
                    // Apply energy regeneration multiplier
                    var energySystem = OptimizedGameSystem.Instance;
                    if (energySystem != null)
                    {
                        // This would modify energy regeneration rate
                    }
                    break;
                    
                case "coins_multiplier":
                    // Apply coin reward multiplier
                    // This would modify coin rewards in game
                    break;
                    
                case "gems_multiplier":
                    // Apply gem reward multiplier
                    // This would modify gem rewards in game
                    break;
                    
                case "unlimited_energy":
                    // Grant unlimited energy
                    if (benefit.value > 0)
                    {
                        var energy = OptimizedGameSystem.Instance;
                        if (energy != null)
                        {
                            energy.AddEnergy(999);
                        }
                    }
                    break;
                    
                case "daily_bonus":
                    // Grant daily bonus
                    GrantDailyBonus(playerId, benefit.value);
                    break;
                    
                case "exclusive_items":
                    // Unlock exclusive items
                    UnlockExclusiveItems(playerId);
                    break;
                    
                case "no_ads":
                    // Disable ads
                    DisableAdsForPlayer(playerId);
                    break;
            }
        }
        
        private void RemoveBenefit(string playerId, SubscriptionBenefit benefit)
        {
            // Remove benefit logic
            switch (benefit.type)
            {
                case "unlimited_energy":
                    // Restore normal energy limits
                    break;
                    
                case "no_ads":
                    // Re-enable ads
                    EnableAdsForPlayer(playerId);
                    break;
            }
        }
        
        private void GrantDailyBonus(string playerId, int bonusValue)
        {
            var economyManager = EconomyManager.Instance;
            if (economyManager != null)
            {
                economyManager.AddCurrency("coins", bonusValue);
                
                // Track analytics
                var analytics = AdvancedAnalyticsSystem.Instance;
                if (analytics != null)
                {
                    analytics.TrackEvent("subscription_daily_bonus", new Dictionary<string, object>
                    {
                        ["player_id"] = playerId,
                        ["bonus_value"] = bonusValue
                    });
                }
            }
        }
        
        private void UnlockExclusiveItems(string playerId)
        {
            // Unlock exclusive items for subscriber
            // This would integrate with your inventory system
        }
        
        private void DisableAdsForPlayer(string playerId)
        {
            PlayerPrefs.SetInt("ads_removed", 1);
            PlayerPrefs.Save();
        }
        
        private void EnableAdsForPlayer(string playerId)
        {
            PlayerPrefs.SetInt("ads_removed", 0);
            PlayerPrefs.Save();
        }
        
        public bool HasActiveSubscription(string playerId)
        {
            return _playerSubscriptions.ContainsKey(playerId) && _playerSubscriptions[playerId].isActive;
        }
        
        public PlayerSubscription GetPlayerSubscription(string playerId)
        {
            return _playerSubscriptions.ContainsKey(playerId) ? _playerSubscriptions[playerId] : null;
        }
        
        public SubscriptionTier[] GetAvailableTiers()
        {
            return subscriptionTiers;
        }
        
        public float GetSubscriptionMultiplier(string playerId, string multiplierType)
        {
            var subscription = GetPlayerSubscription(playerId);
            if (subscription == null || !subscription.isActive) return 1f;
            
            var benefit = subscription.benefits.Find(b => b.type == multiplierType);
            return benefit != null ? benefit.value : 1f;
        }
        
        public Dictionary<string, object> GetSubscriptionStatistics()
        {
            var activeSubscriptions = 0;
            var totalRevenue = 0f;
            var tierDistribution = new Dictionary<string, int>();
            
            foreach (var subscription in _playerSubscriptions.Values)
            {
                if (subscription.isActive)
                {
                    activeSubscriptions++;
                    
                    var tier = Array.Find(subscriptionTiers, t => t.id == subscription.tierId);
                    if (tier != null)
                    {
                        totalRevenue += tier.price;
                        
                        if (!tierDistribution.ContainsKey(subscription.tierId))
                            tierDistribution[subscription.tierId] = 0;
                        tierDistribution[subscription.tierId]++;
                    }
                }
            }
            
            return new Dictionary<string, object>
            {
                ["active_subscriptions"] = activeSubscriptions,
                ["total_revenue"] = totalRevenue,
                ["tier_distribution"] = tierDistribution,
                ["conversion_rate"] = activeSubscriptions / Math.Max(1, _playerSubscriptions.Count)
            };
        }
        
        void OnDestroy()
        {
            if (_subscriptionCheckCoroutine != null)
            {
                StopCoroutine(_subscriptionCheckCoroutine);
            }
        }
    }
    
    [System.Serializable]
    public class SubscriptionTier
    {
        public string id;
        public string name;
        public float price;
        public int duration; // days
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
    public class PlayerSubscription
    {
        public string playerId;
        public string tierId;
        public string tierName;
        public DateTime startDate;
        public DateTime expiryDate;
        public bool isActive;
        public List<SubscriptionBenefit> benefits;
    }
}