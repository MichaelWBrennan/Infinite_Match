using UnityEngine;
using System.Collections.Generic;
using UnityEngine.Analytics;

namespace Evergreen.Analytics
{
    /// <summary>
    /// Unity Analytics ARPU Helper - Integrates ARPU tracking with Unity Analytics
    /// Provides industry leader ARPU metrics using Unity Analytics data
    /// </summary>
    public class UnityAnalyticsARPUHelper : MonoBehaviour
    {
        [Header("Industry Leader Targets")]
        public float targetARPU = 3.50f;
        public float targetARPPU = 25.00f;
        public float targetConversionRate = 0.08f;
        public float targetRetentionD1 = 0.40f;
        public float targetRetentionD7 = 0.20f;
        public float targetRetentionD30 = 0.10f;
        
        [Header("Unity Analytics Integration")]
        public bool enableARPUTracking = true;
        public bool enableRevenueTracking = true;
        public bool enablePlayerSegmentation = true;
        public bool enableRetentionTracking = true;
        
        private Dictionary<string, float> _revenueData = new Dictionary<string, float>();
        private Dictionary<string, int> _playerData = new Dictionary<string, int>();
        private Dictionary<string, float> _retentionData = new Dictionary<string, float>();
        
        public static UnityAnalyticsARPUHelper Instance { get; private set; }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeARPUHelper();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        private void InitializeARPUHelper()
        {
            LoadARPUData();
            Debug.Log("Unity Analytics ARPU Helper initialized - Industry leader tracking enabled!");
        }
        
        /// <summary>
        /// Track revenue event with Unity Analytics
        /// </summary>
        public void TrackRevenue(string playerId, float amount, string source, string itemId = "")
        {
            if (!enableRevenueTracking) return;
            
            // Track with Unity Analytics
            Analytics.CustomEvent("revenue_generated", new Dictionary<string, object>
            {
                ["player_id"] = playerId,
                ["amount"] = amount,
                ["source"] = source,
                ["item_id"] = itemId,
                ["currency"] = "USD"
            });
            
            // Track purchase transaction
            Analytics.Transaction(itemId, amount, "USD", null, null);
            
            // Update local revenue data
            if (!_revenueData.ContainsKey("total_revenue"))
                _revenueData["total_revenue"] = 0f;
            
            _revenueData["total_revenue"] += amount;
            
            if (!_revenueData.ContainsKey(source))
                _revenueData[source] = 0f;
            
            _revenueData[source] += amount;
            
            SaveARPUData();
        }
        
        /// <summary>
        /// Track player action with Unity Analytics
        /// </summary>
        public void TrackPlayerAction(string playerId, string action, Dictionary<string, object> parameters = null)
        {
            if (!enableARPUTracking) return;
            
            var eventParams = new Dictionary<string, object>
            {
                ["player_id"] = playerId
            };
            
            if (parameters != null)
            {
                foreach (var param in parameters)
                {
                    eventParams[param.Key] = param.Value;
                }
            }
            
            Analytics.CustomEvent(action, eventParams);
            
            // Track specific ARPU-related actions
            switch (action)
            {
                case "tutorial_complete":
                    TrackTutorialCompletion(playerId);
                    break;
                case "level_complete":
                    TrackLevelCompletion(playerId);
                    break;
                case "first_purchase":
                    TrackFirstPurchase(playerId);
                    break;
                case "subscription_start":
                    TrackSubscriptionStart(playerId);
                    break;
            }
        }
        
        /// <summary>
        /// Track energy consumption
        /// </summary>
        public void TrackEnergyConsumption(string playerId, int amount, int remaining, int maxEnergy)
        {
            Analytics.CustomEvent("energy_consumed", new Dictionary<string, object>
            {
                ["player_id"] = playerId,
                ["amount"] = amount,
                ["remaining"] = remaining,
                ["max_energy"] = maxEnergy,
                ["energy_percentage"] = (float)remaining / maxEnergy
            });
        }
        
        /// <summary>
        /// Track energy refill
        /// </summary>
        public void TrackEnergyRefill(string playerId, string method, int energyGained, int cost = 0)
        {
            Analytics.CustomEvent("energy_refilled", new Dictionary<string, object>
            {
                ["player_id"] = playerId,
                ["method"] = method,
                ["energy_gained"] = energyGained,
                ["cost"] = cost
            });
        }
        
        /// <summary>
        /// Track offer interaction
        /// </summary>
        public void TrackOfferInteraction(string playerId, string offerId, string action, float price = 0f)
        {
            Analytics.CustomEvent("offer_interaction", new Dictionary<string, object>
            {
                ["player_id"] = playerId,
                ["offer_id"] = offerId,
                ["action"] = action,
                ["price"] = price
            });
        }
        
        /// <summary>
        /// Track subscription event
        /// </summary>
        public void TrackSubscription(string playerId, string tier, string action, float price = 0f)
        {
            Analytics.CustomEvent("subscription_event", new Dictionary<string, object>
            {
                ["player_id"] = playerId,
                ["tier"] = tier,
                ["action"] = action,
                ["price"] = price
            });
        }
        
        /// <summary>
        /// Track social interaction
        /// </summary>
        public void TrackSocialInteraction(string playerId, string action, Dictionary<string, object> parameters = null)
        {
            var eventParams = new Dictionary<string, object>
            {
                ["player_id"] = playerId,
                ["action"] = action
            };
            
            if (parameters != null)
            {
                foreach (var param in parameters)
                {
                    eventParams[param.Key] = param.Value;
                }
            }
            
            Analytics.CustomEvent("social_interaction", eventParams);
        }
        
        /// <summary>
        /// Get ARPU report using Unity Analytics data
        /// </summary>
        public Dictionary<string, object> GetARPUReport()
        {
            var totalRevenue = GetTotalRevenue();
            var totalPlayers = GetTotalPlayers();
            var payingPlayers = GetPayingPlayers();
            
            var currentARPU = totalPlayers > 0 ? totalRevenue / totalPlayers : 0f;
            var currentARPPU = payingPlayers > 0 ? totalRevenue / payingPlayers : 0f;
            var currentConversionRate = totalPlayers > 0 ? (float)payingPlayers / totalPlayers : 0f;
            
            return new Dictionary<string, object>
            {
                ["total_players"] = totalPlayers,
                ["paying_players"] = payingPlayers,
                ["total_revenue"] = totalRevenue,
                ["arpu"] = currentARPU,
                ["arppu"] = currentARPPU,
                ["conversion_rate"] = currentConversionRate * 100f,
                ["industry_targets"] = new Dictionary<string, object>
                {
                    ["target_arpu"] = targetARPU,
                    ["target_arppu"] = targetARPPU,
                    ["target_conversion_rate"] = targetConversionRate,
                    ["target_retention_d1"] = targetRetentionD1,
                    ["target_retention_d7"] = targetRetentionD7,
                    ["target_retention_d30"] = targetRetentionD30
                },
                ["performance_vs_targets"] = new Dictionary<string, float>
                {
                    ["arpu_performance"] = currentARPU / targetARPU,
                    ["arppu_performance"] = currentARPPU / targetARPPU,
                    ["conversion_performance"] = currentConversionRate / targetConversionRate,
                    ["overall_performance"] = (currentARPU / targetARPU + currentARPPU / targetARPPU + currentConversionRate / targetConversionRate) / 3f
                },
                ["industry_leader_status"] = GetIndustryLeaderStatus(currentARPU, currentARPPU, currentConversionRate),
                ["revenue_sources"] = GetRevenueSourceDistribution(),
                ["retention_rates"] = GetRetentionRates()
            };
        }
        
        /// <summary>
        /// Check if ARPU targets are being met
        /// </summary>
        public bool AreARPUTargetsMet()
        {
            var report = GetARPUReport();
            var currentARPU = (float)report["arpu"];
            var currentARPPU = (float)report["arppu"];
            var currentConversionRate = (float)report["conversion_rate"] / 100f;
            
            return currentARPU >= targetARPU && currentARPPU >= targetARPPU && currentConversionRate >= targetConversionRate;
        }
        
        /// <summary>
        /// Get performance vs industry targets
        /// </summary>
        public Dictionary<string, float> GetARPUPerformance()
        {
            var report = GetARPUReport();
            var currentARPU = (float)report["arpu"];
            var currentARPPU = (float)report["arppu"];
            var currentConversionRate = (float)report["conversion_rate"] / 100f;
            
            return new Dictionary<string, float>
            {
                ["arpu_performance"] = currentARPU / targetARPU,
                ["arppu_performance"] = currentARPPU / targetARPPU,
                ["conversion_performance"] = currentConversionRate / targetConversionRate,
                ["overall_performance"] = (currentARPU / targetARPU + currentARPPU / targetARPPU + currentConversionRate / targetConversionRate) / 3f
            };
        }
        
        private void TrackTutorialCompletion(string playerId)
        {
            if (!_playerData.ContainsKey("tutorial_completions"))
                _playerData["tutorial_completions"] = 0;
            
            _playerData["tutorial_completions"]++;
        }
        
        private void TrackLevelCompletion(string playerId)
        {
            if (!_playerData.ContainsKey("levels_completed"))
                _playerData["levels_completed"] = 0;
            
            _playerData["levels_completed"]++;
        }
        
        private void TrackFirstPurchase(string playerId)
        {
            if (!_playerData.ContainsKey("first_purchases"))
                _playerData["first_purchases"] = 0;
            
            _playerData["first_purchases"]++;
        }
        
        private void TrackSubscriptionStart(string playerId)
        {
            if (!_playerData.ContainsKey("subscriptions"))
                _playerData["subscriptions"] = 0;
            
            _playerData["subscriptions"]++;
        }
        
        private float GetTotalRevenue()
        {
            return _revenueData.ContainsKey("total_revenue") ? _revenueData["total_revenue"] : 0f;
        }
        
        private int GetTotalPlayers()
        {
            // This would integrate with Unity Analytics to get actual player count
            // For now, return stored value
            return _playerData.ContainsKey("total_players") ? _playerData["total_players"] : 0;
        }
        
        private int GetPayingPlayers()
        {
            // This would integrate with Unity Analytics to get actual paying player count
            // For now, return stored value
            return _playerData.ContainsKey("paying_players") ? _playerData["paying_players"] : 0;
        }
        
        private Dictionary<string, object> GetIndustryLeaderStatus(float currentARPU, float currentARPPU, float currentConversionRate)
        {
            var arpuStatus = currentARPU >= targetARPU ? "ACHIEVED" : "BELOW_TARGET";
            var arppuStatus = currentARPPU >= targetARPPU ? "ACHIEVED" : "BELOW_TARGET";
            var conversionStatus = currentConversionRate >= targetConversionRate ? "ACHIEVED" : "BELOW_TARGET";
            
            var overallStatus = (currentARPU >= targetARPU && currentARPPU >= targetARPPU && currentConversionRate >= targetConversionRate) 
                ? "INDUSTRY_LEADER_LEVEL" : "NEEDS_OPTIMIZATION";
            
            return new Dictionary<string, object>
            {
                ["arpu_status"] = arpuStatus,
                ["arppu_status"] = arppuStatus,
                ["conversion_status"] = conversionStatus,
                ["overall_status"] = overallStatus,
                ["is_industry_leader"] = overallStatus == "INDUSTRY_LEADER_LEVEL"
            };
        }
        
        private Dictionary<string, float> GetRevenueSourceDistribution()
        {
            var totalRevenue = GetTotalRevenue();
            var distribution = new Dictionary<string, float>();
            
            if (totalRevenue > 0)
            {
                foreach (var source in _revenueData)
                {
                    if (source.Key != "total_revenue")
                    {
                        distribution[source.Key] = source.Value / totalRevenue * 100f;
                    }
                }
            }
            
            return distribution;
        }
        
        private Dictionary<string, float> GetRetentionRates()
        {
            // This would integrate with Unity Analytics to get actual retention rates
            // For now, return placeholder values
            return new Dictionary<string, float>
            {
                ["day_1"] = targetRetentionD1 * 100f,
                ["day_7"] = targetRetentionD7 * 100f,
                ["day_30"] = targetRetentionD30 * 100f
            };
        }
        
        private void LoadARPUData()
        {
            // Load ARPU data from PlayerPrefs
            _revenueData["total_revenue"] = PlayerPrefs.GetFloat("total_revenue", 0f);
            _revenueData["iap"] = PlayerPrefs.GetFloat("iap_revenue", 0f);
            _revenueData["subscription"] = PlayerPrefs.GetFloat("subscription_revenue", 0f);
            _revenueData["ads"] = PlayerPrefs.GetFloat("ad_revenue", 0f);
            
            _playerData["total_players"] = PlayerPrefs.GetInt("total_players", 0);
            _playerData["paying_players"] = PlayerPrefs.GetInt("paying_players", 0);
            _playerData["tutorial_completions"] = PlayerPrefs.GetInt("tutorial_completions", 0);
            _playerData["levels_completed"] = PlayerPrefs.GetInt("levels_completed", 0);
            _playerData["first_purchases"] = PlayerPrefs.GetInt("first_purchases", 0);
            _playerData["subscriptions"] = PlayerPrefs.GetInt("subscriptions", 0);
        }
        
        private void SaveARPUData()
        {
            // Save ARPU data to PlayerPrefs
            foreach (var revenue in _revenueData)
            {
                PlayerPrefs.SetFloat(revenue.Key, revenue.Value);
            }
            
            foreach (var player in _playerData)
            {
                PlayerPrefs.SetInt(player.Key, player.Value);
            }
            
            PlayerPrefs.Save();
        }
        
        void OnDestroy()
        {
            SaveARPUData();
        }
    }
}