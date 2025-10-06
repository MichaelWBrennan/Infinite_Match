using System;
using System.Collections.Generic;
using UnityEngine;
using Evergreen.Core;

namespace Evergreen.Economy
{
    /// <summary>
    /// Economy analytics system for tracking monetization and player behavior
    /// Provides insights into economy performance and player spending patterns
    /// </summary>
    public class EconomyAnalytics : MonoBehaviour
    {
        [Header("Analytics Configuration")]
        [SerializeField] private bool enableDetailedTracking = true;
        [SerializeField] private bool enableRealTimeAnalytics = true;
        [SerializeField] private bool enablePredictiveAnalytics = true;
        [SerializeField] private float dataRetentionDays = 30f;
        
        [Header("Tracking Settings")]
        [SerializeField] private bool trackCurrencyFlow = true;
        [SerializeField] private bool trackPurchaseBehavior = true;
        [SerializeField] private bool trackRewardEngagement = true;
        [SerializeField] private bool trackShopPerformance = true;
        
        private Dictionary<string, EconomyEvent> _events = new Dictionary<string, EconomyEvent>();
        private Dictionary<string, PlayerEconomyProfile> _playerProfiles = new Dictionary<string, PlayerEconomyProfile>();
        private Dictionary<string, CurrencyAnalytics> _currencyAnalytics = new Dictionary<string, CurrencyAnalytics>();
        private Dictionary<string, ShopAnalytics> _shopAnalytics = new Dictionary<string, ShopAnalytics>();
        private Dictionary<string, RewardAnalytics> _rewardAnalytics = new Dictionary<string, RewardAnalytics>();
        
        // Events
        public System.Action<EconomyEvent> OnEconomyEvent;
        public System.Action<PlayerEconomyProfile> OnPlayerProfileUpdated;
        
        public static EconomyAnalytics Instance { get; private set; }
        
        [System.Serializable]
        public class EconomyEvent
        {
            public string id;
            public string eventType;
            public string playerId;
            public Dictionary<string, object> parameters;
            public DateTime timestamp;
            public float value;
            public string source;
        }
        
        [System.Serializable]
        public class PlayerEconomyProfile
        {
            public string playerId;
            public float totalSpent;
            public float totalEarned;
            public int totalPurchases;
            public int totalRewardsClaimed;
            public float averageSessionValue;
            public float lifetimeValue;
            public float averagePurchaseValue;
            public float purchaseFrequency;
            public DateTime firstPurchaseTime;
            public DateTime lastPurchaseTime;
            public DateTime lastActiveTime;
            public Dictionary<string, int> currencyBalances = new Dictionary<string, int>();
            public Dictionary<string, int> purchaseCounts = new Dictionary<string, int>();
            public Dictionary<string, float> spendingByCategory = new Dictionary<string, float>();
            public PlayerSegment segment = PlayerSegment.Casual;
            public float churnRisk = 0f;
            public float engagementScore = 0f;
        }
        
        [System.Serializable]
        public class CurrencyAnalytics
        {
            public string currencyId;
            public float totalEarned;
            public float totalSpent;
            public float averageBalance;
            public float inflationRate;
            public float velocity; // How quickly currency is earned and spent
            public int transactionCount;
            public DateTime lastUpdated;
            public List<CurrencyTransaction> recentTransactions = new List<CurrencyTransaction>();
        }
        
        [System.Serializable]
        public class CurrencyTransaction
        {
            public string type; // "earn", "spend", "exchange"
            public int amount;
            public string source;
            public DateTime timestamp;
            public float value;
        }
        
        [System.Serializable]
        public class ShopAnalytics
        {
            public string itemId;
            public int views;
            public int purchases;
            public float conversionRate;
            public float revenue;
            public float averagePrice;
            public int refunds;
            public float refundRate;
            public DateTime lastUpdated;
        }
        
        [System.Serializable]
        public class RewardAnalytics
        {
            public string rewardId;
            public int earned;
            public int claimed;
            public float claimRate;
            public float averageValue;
            public DateTime lastUpdated;
        }
        
        public enum PlayerSegment
        {
            New,
            Casual,
            Regular,
            Whale,
            Churned
        }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeAnalytics();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            LoadAnalyticsData();
            StartCoroutine(UpdateAnalytics());
        }
        
        private void InitializeAnalytics()
        {
            Debug.Log("Economy Analytics initialized");
        }
        
        public void TrackEvent(string eventName, Dictionary<string, object> parameters)
        {
            if (!enableDetailedTracking) return;
            
            var economyEvent = new EconomyEvent
            {
                id = System.Guid.NewGuid().ToString(),
                eventType = eventName,
                playerId = parameters.ContainsKey("playerId") ? parameters["playerId"].ToString() : "unknown",
                parameters = parameters,
                timestamp = DateTime.Now,
                value = parameters.ContainsKey("value") ? Convert.ToSingle(parameters["value"]) : 0f,
                source = parameters.ContainsKey("source") ? parameters["source"].ToString() : "unknown"
            };
            
            _events[economyEvent.id] = economyEvent;
            
            // Update relevant analytics
            UpdateAnalyticsFromEvent(economyEvent);
            
            // Fire event
            OnEconomyEvent?.Invoke(economyEvent);
            
            // Clean up old events
            CleanupOldEvents();
        }
        
        private void UpdateAnalyticsFromEvent(EconomyEvent economyEvent)
        {
            string playerId = economyEvent.playerId;
            
            // Update player profile
            UpdatePlayerProfile(playerId, economyEvent);
            
            // Update currency analytics
            if (economyEvent.parameters.ContainsKey("currencyId"))
            {
                string currencyId = economyEvent.parameters["currencyId"].ToString();
                UpdateCurrencyAnalytics(currencyId, economyEvent);
            }
            
            // Update shop analytics
            if (economyEvent.parameters.ContainsKey("itemId"))
            {
                string itemId = economyEvent.parameters["itemId"].ToString();
                UpdateShopAnalytics(itemId, economyEvent);
            }
            
            // Update reward analytics
            if (economyEvent.parameters.ContainsKey("rewardId"))
            {
                string rewardId = economyEvent.parameters["rewardId"].ToString();
                UpdateRewardAnalytics(rewardId, economyEvent);
            }
        }
        
        private void UpdatePlayerProfile(string playerId, EconomyEvent economyEvent)
        {
            var profile = GetPlayerProfile(playerId);
            
            profile.lastActiveTime = economyEvent.timestamp;
            
            switch (economyEvent.eventType)
            {
                case "currency_spent":
                    profile.totalSpent += economyEvent.value;
                    profile.totalPurchases++;
                    profile.lastPurchaseTime = economyEvent.timestamp;
                    
                    if (profile.firstPurchaseTime == DateTime.MinValue)
                    {
                        profile.firstPurchaseTime = economyEvent.timestamp;
                    }
                    
                    // Update spending by category
                    if (economyEvent.parameters.ContainsKey("category"))
                    {
                        string category = economyEvent.parameters["category"].ToString();
                        if (!profile.spendingByCategory.ContainsKey(category))
                        {
                            profile.spendingByCategory[category] = 0f;
                        }
                        profile.spendingByCategory[category] += economyEvent.value;
                    }
                    break;
                    
                case "currency_earned":
                    profile.totalEarned += economyEvent.value;
                    break;
                    
                case "reward_claimed":
                    profile.totalRewardsClaimed++;
                    break;
            }
            
            // Update calculated metrics
            UpdatePlayerMetrics(profile);
            
            // Update player segment
            UpdatePlayerSegment(profile);
            
            _playerProfiles[playerId] = profile;
            OnPlayerProfileUpdated?.Invoke(profile);
        }
        
        private void UpdatePlayerMetrics(PlayerEconomyProfile profile)
        {
            // Calculate average purchase value
            if (profile.totalPurchases > 0)
            {
                profile.averagePurchaseValue = profile.totalSpent / profile.totalPurchases;
            }
            
            // Calculate purchase frequency (purchases per day)
            if (profile.firstPurchaseTime != DateTime.MinValue)
            {
                TimeSpan timeSpan = profile.lastActiveTime - profile.firstPurchaseTime;
                if (timeSpan.TotalDays > 0)
                {
                    profile.purchaseFrequency = profile.totalPurchases / (float)timeSpan.TotalDays;
                }
            }
            
            // Calculate lifetime value
            profile.lifetimeValue = profile.totalSpent;
            
            // Calculate engagement score (0-100)
            profile.engagementScore = CalculateEngagementScore(profile);
            
            // Calculate churn risk (0-100)
            profile.churnRisk = CalculateChurnRisk(profile);
        }
        
        private float CalculateEngagementScore(PlayerEconomyProfile profile)
        {
            float score = 0f;
            
            // Base score from total activity
            score += Mathf.Min(profile.totalPurchases * 10f, 50f);
            score += Mathf.Min(profile.totalRewardsClaimed * 2f, 20f);
            
            // Recency bonus
            TimeSpan timeSinceLastActivity = DateTime.Now - profile.lastActiveTime;
            if (timeSinceLastActivity.TotalDays < 1)
            {
                score += 20f;
            }
            else if (timeSinceLastActivity.TotalDays < 7)
            {
                score += 10f;
            }
            
            // Frequency bonus
            if (profile.purchaseFrequency > 1f)
            {
                score += 10f;
            }
            
            return Mathf.Clamp(score, 0f, 100f);
        }
        
        private float CalculateChurnRisk(PlayerEconomyProfile profile)
        {
            float risk = 0f;
            
            // Time since last activity
            TimeSpan timeSinceLastActivity = DateTime.Now - profile.lastActiveTime;
            if (timeSinceLastActivity.TotalDays > 30)
            {
                risk += 50f;
            }
            else if (timeSinceLastActivity.TotalDays > 14)
            {
                risk += 30f;
            }
            else if (timeSinceLastActivity.TotalDays > 7)
            {
                risk += 15f;
            }
            
            // Low engagement
            if (profile.engagementScore < 20f)
            {
                risk += 30f;
            }
            
            // Low spending
            if (profile.totalSpent < 5f)
            {
                risk += 20f;
            }
            
            return Mathf.Clamp(risk, 0f, 100f);
        }
        
        private void UpdatePlayerSegment(PlayerEconomyProfile profile)
        {
            if (profile.totalSpent == 0f)
            {
                profile.segment = PlayerSegment.New;
            }
            else if (profile.totalSpent < 10f)
            {
                profile.segment = PlayerSegment.Casual;
            }
            else if (profile.totalSpent < 100f)
            {
                profile.segment = PlayerSegment.Regular;
            }
            else
            {
                profile.segment = PlayerSegment.Whale;
            }
            
            // Check for churned players
            TimeSpan timeSinceLastActivity = DateTime.Now - profile.lastActiveTime;
            if (timeSinceLastActivity.TotalDays > 30)
            {
                profile.segment = PlayerSegment.Churned;
            }
        }
        
        private void UpdateCurrencyAnalytics(string currencyId, EconomyEvent economyEvent)
        {
            if (!_currencyAnalytics.ContainsKey(currencyId))
            {
                _currencyAnalytics[currencyId] = new CurrencyAnalytics
                {
                    currencyId = currencyId,
                    totalEarned = 0f,
                    totalSpent = 0f,
                    averageBalance = 0f,
                    inflationRate = 0f,
                    velocity = 0f,
                    transactionCount = 0,
                    lastUpdated = DateTime.Now,
                    recentTransactions = new List<CurrencyTransaction>()
                };
            }
            
            var analytics = _currencyAnalytics[currencyId];
            
            if (economyEvent.eventType == "currency_earned")
            {
                analytics.totalEarned += economyEvent.value;
            }
            else if (economyEvent.eventType == "currency_spent")
            {
                analytics.totalSpent += economyEvent.value;
            }
            
            analytics.transactionCount++;
            analytics.lastUpdated = DateTime.Now;
            
            // Add to recent transactions
            var transaction = new CurrencyTransaction
            {
                type = economyEvent.eventType.Replace("currency_", ""),
                amount = (int)economyEvent.value,
                source = economyEvent.source,
                timestamp = economyEvent.timestamp,
                value = economyEvent.value
            };
            
            analytics.recentTransactions.Add(transaction);
            
            // Keep only last 100 transactions
            if (analytics.recentTransactions.Count > 100)
            {
                analytics.recentTransactions.RemoveAt(0);
            }
            
            // Calculate velocity (transactions per day)
            if (analytics.recentTransactions.Count > 1)
            {
                TimeSpan timeSpan = analytics.recentTransactions[analytics.recentTransactions.Count - 1].timestamp - 
                                  analytics.recentTransactions[0].timestamp;
                if (timeSpan.TotalDays > 0)
                {
                    analytics.velocity = analytics.recentTransactions.Count / (float)timeSpan.TotalDays;
                }
            }
        }
        
        private void UpdateShopAnalytics(string itemId, EconomyEvent economyEvent)
        {
            if (!_shopAnalytics.ContainsKey(itemId))
            {
                _shopAnalytics[itemId] = new ShopAnalytics
                {
                    itemId = itemId,
                    views = 0,
                    purchases = 0,
                    conversionRate = 0f,
                    revenue = 0f,
                    averagePrice = 0f,
                    refunds = 0,
                    refundRate = 0f,
                    lastUpdated = DateTime.Now
                };
            }
            
            var analytics = _shopAnalytics[itemId];
            
            if (economyEvent.eventType == "item_viewed")
            {
                analytics.views++;
            }
            else if (economyEvent.eventType == "item_purchased")
            {
                analytics.purchases++;
                analytics.revenue += economyEvent.value;
            }
            else if (economyEvent.eventType == "item_refunded")
            {
                analytics.refunds++;
            }
            
            // Calculate derived metrics
            if (analytics.views > 0)
            {
                analytics.conversionRate = (float)analytics.purchases / analytics.views;
            }
            
            if (analytics.purchases > 0)
            {
                analytics.averagePrice = analytics.revenue / analytics.purchases;
            }
            
            if (analytics.purchases > 0)
            {
                analytics.refundRate = (float)analytics.refunds / analytics.purchases;
            }
            
            analytics.lastUpdated = DateTime.Now;
        }
        
        private void UpdateRewardAnalytics(string rewardId, EconomyEvent economyEvent)
        {
            if (!_rewardAnalytics.ContainsKey(rewardId))
            {
                _rewardAnalytics[rewardId] = new RewardAnalytics
                {
                    rewardId = rewardId,
                    earned = 0,
                    claimed = 0,
                    claimRate = 0f,
                    averageValue = 0f,
                    lastUpdated = DateTime.Now
                };
            }
            
            var analytics = _rewardAnalytics[rewardId];
            
            if (economyEvent.eventType == "reward_earned")
            {
                analytics.earned++;
            }
            else if (economyEvent.eventType == "reward_claimed")
            {
                analytics.claimed++;
            }
            
            // Calculate claim rate
            if (analytics.earned > 0)
            {
                analytics.claimRate = (float)analytics.claimed / analytics.earned;
            }
            
            analytics.lastUpdated = DateTime.Now;
        }
        
        private PlayerEconomyProfile GetPlayerProfile(string playerId)
        {
            if (!_playerProfiles.ContainsKey(playerId))
            {
                _playerProfiles[playerId] = new PlayerEconomyProfile
                {
                    playerId = playerId,
                    totalSpent = 0f,
                    totalEarned = 0f,
                    totalPurchases = 0,
                    totalRewardsClaimed = 0,
                    averageSessionValue = 0f,
                    lifetimeValue = 0f,
                    averagePurchaseValue = 0f,
                    purchaseFrequency = 0f,
                    firstPurchaseTime = DateTime.MinValue,
                    lastPurchaseTime = DateTime.MinValue,
                    lastActiveTime = DateTime.Now,
                    currencyBalances = new Dictionary<string, int>(),
                    purchaseCounts = new Dictionary<string, int>(),
                    spendingByCategory = new Dictionary<string, float>(),
                    segment = PlayerSegment.New,
                    churnRisk = 0f,
                    engagementScore = 0f
                };
            }
            
            return _playerProfiles[playerId];
        }
        
        public string GetReport()
        {
            var report = new System.Text.StringBuilder();
            report.AppendLine("=== ECONOMY ANALYTICS REPORT ===");
            report.AppendLine($"Generated: {DateTime.Now}");
            report.AppendLine();
            
            // Player segments
            report.AppendLine("=== PLAYER SEGMENTS ===");
            var segmentCounts = new Dictionary<PlayerSegment, int>();
            foreach (var profile in _playerProfiles.Values)
            {
                if (!segmentCounts.ContainsKey(profile.segment))
                    segmentCounts[profile.segment] = 0;
                segmentCounts[profile.segment]++;
            }
            
            foreach (var kvp in segmentCounts)
            {
                report.AppendLine($"{kvp.Key}: {kvp.Value} players");
            }
            report.AppendLine();
            
            // Revenue metrics
            report.AppendLine("=== REVENUE METRICS ===");
            float totalRevenue = 0f;
            int totalPurchases = 0;
            foreach (var profile in _playerProfiles.Values)
            {
                totalRevenue += profile.totalSpent;
                totalPurchases += profile.totalPurchases;
            }
            
            report.AppendLine($"Total Revenue: ${totalRevenue:F2}");
            report.AppendLine($"Total Purchases: {totalPurchases}");
            report.AppendLine($"Average Purchase Value: ${totalPurchases > 0 ? totalRevenue / totalPurchases : 0:F2}");
            report.AppendLine();
            
            // Currency analytics
            report.AppendLine("=== CURRENCY ANALYTICS ===");
            foreach (var analytics in _currencyAnalytics.Values)
            {
                report.AppendLine($"{analytics.currencyId}:");
                report.AppendLine($"  Earned: {analytics.totalEarned:F2}");
                report.AppendLine($"  Spent: {analytics.totalSpent:F2}");
                report.AppendLine($"  Velocity: {analytics.velocity:F2} transactions/day");
                report.AppendLine();
            }
            
            // Shop analytics
            report.AppendLine("=== SHOP ANALYTICS ===");
            foreach (var analytics in _shopAnalytics.Values)
            {
                report.AppendLine($"{analytics.itemId}:");
                report.AppendLine($"  Views: {analytics.views}");
                report.AppendLine($"  Purchases: {analytics.purchases}");
                report.AppendLine($"  Conversion Rate: {analytics.conversionRate:P2}");
                report.AppendLine($"  Revenue: ${analytics.revenue:F2}");
                report.AppendLine();
            }
            
            return report.ToString();
        }
        
        public PlayerEconomyProfile GetPlayerProfile(string playerId)
        {
            return _playerProfiles.ContainsKey(playerId) ? _playerProfiles[playerId] : null;
        }
        
        public List<PlayerEconomyProfile> GetPlayersBySegment(PlayerSegment segment)
        {
            var players = new List<PlayerEconomyProfile>();
            foreach (var profile in _playerProfiles.Values)
            {
                if (profile.segment == segment)
                {
                    players.Add(profile);
                }
            }
            return players;
        }
        
        public Dictionary<string, CurrencyAnalytics> GetCurrencyAnalytics()
        {
            return new Dictionary<string, CurrencyAnalytics>(_currencyAnalytics);
        }
        
        public Dictionary<string, ShopAnalytics> GetShopAnalytics()
        {
            return new Dictionary<string, ShopAnalytics>(_shopAnalytics);
        }
        
        private System.Collections.IEnumerator UpdateAnalytics()
        {
            while (true)
            {
                // Update analytics calculations
                UpdateAllPlayerMetrics();
                
                // Clean up old data
                CleanupOldData();
                
                yield return new WaitForSeconds(300f); // Update every 5 minutes
            }
        }
        
        private void UpdateAllPlayerMetrics()
        {
            foreach (var profile in _playerProfiles.Values)
            {
                UpdatePlayerMetrics(profile);
                UpdatePlayerSegment(profile);
            }
        }
        
        private void CleanupOldData()
        {
            DateTime cutoff = DateTime.Now.AddDays(-dataRetentionDays);
            
            // Clean up old events
            var eventsToRemove = new List<string>();
            foreach (var kvp in _events)
            {
                if (kvp.Value.timestamp < cutoff)
                {
                    eventsToRemove.Add(kvp.Key);
                }
            }
            
            foreach (var eventId in eventsToRemove)
            {
                _events.Remove(eventId);
            }
        }
        
        private void CleanupOldEvents()
        {
            // Keep only last 1000 events
            if (_events.Count > 1000)
            {
                var sortedEvents = new List<KeyValuePair<string, EconomyEvent>>(_events);
                sortedEvents.Sort((a, b) => a.Value.timestamp.CompareTo(b.Value.timestamp));
                
                int toRemove = _events.Count - 1000;
                for (int i = 0; i < toRemove; i++)
                {
                    _events.Remove(sortedEvents[i].Key);
                }
            }
        }
        
        private void SaveAnalyticsData()
        {
            var saveData = new AnalyticsSaveData
            {
                events = new Dictionary<string, EconomyEvent>(_events),
                playerProfiles = new Dictionary<string, PlayerEconomyProfile>(_playerProfiles),
                currencyAnalytics = new Dictionary<string, CurrencyAnalytics>(_currencyAnalytics),
                shopAnalytics = new Dictionary<string, ShopAnalytics>(_shopAnalytics),
                rewardAnalytics = new Dictionary<string, RewardAnalytics>(_rewardAnalytics)
            };
            
            string json = JsonUtility.ToJson(saveData, true);
            System.IO.File.WriteAllText(Application.persistentDataPath + "/economy_analytics.json", json);
        }
        
        private void LoadAnalyticsData()
        {
            string path = Application.persistentDataPath + "/economy_analytics.json";
            if (System.IO.File.Exists(path))
            {
                try
                {
                    string json = System.IO.File.ReadAllText(path);
                    var saveData = JsonUtility.FromJson<AnalyticsSaveData>(json);
                    
                    if (saveData.events != null)
                    {
                        _events = saveData.events;
                    }
                    
                    if (saveData.playerProfiles != null)
                    {
                        _playerProfiles = saveData.playerProfiles;
                    }
                    
                    if (saveData.currencyAnalytics != null)
                    {
                        _currencyAnalytics = saveData.currencyAnalytics;
                    }
                    
                    if (saveData.shopAnalytics != null)
                    {
                        _shopAnalytics = saveData.shopAnalytics;
                    }
                    
                    if (saveData.rewardAnalytics != null)
                    {
                        _rewardAnalytics = saveData.rewardAnalytics;
                    }
                }
                catch (Exception e)
                {
                    Debug.LogError($"Failed to load analytics data: {e.Message}");
                }
            }
        }
        
        [System.Serializable]
        private class AnalyticsSaveData
        {
            public Dictionary<string, EconomyEvent> events;
            public Dictionary<string, PlayerEconomyProfile> playerProfiles;
            public Dictionary<string, CurrencyAnalytics> currencyAnalytics;
            public Dictionary<string, ShopAnalytics> shopAnalytics;
            public Dictionary<string, RewardAnalytics> rewardAnalytics;
        }
        
        void OnDestroy()
        {
            SaveAnalyticsData();
        }
    }
}