using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using Evergreen.Core;

namespace Evergreen.Analytics
{
    /// <summary>
    /// ARPU-focused Analytics System with real-time revenue tracking and optimization
    /// Provides comprehensive insights for maximizing Average Revenue Per User
    /// </summary>
    public class ARPUAnalyticsSystem : MonoBehaviour
    {
        [Header("ARPU Tracking Settings")]
        public bool enableARPUTracking = true;
        public bool enableRealTimeRevenue = true;
        public bool enablePlayerSegmentation = true;
        public bool enableConversionFunnels = true;
        public bool enableRetentionAnalysis = true;
        public bool enableLTVPrediction = true;
        
        [Header("Revenue Tracking")]
        public float revenueUpdateInterval = 60f; // 1 minute
        public int maxRevenueHistory = 1000;
        public bool trackMicroTransactions = true;
        public bool trackSubscriptionRevenue = true;
        public bool trackAdRevenue = true;
        
        [Header("Player Segmentation")]
        public float[] spendingThresholds = { 0f, 5f, 25f, 100f, 500f }; // USD
        public string[] playerSegments = { "non_payer", "low_value", "medium_value", "high_value", "whale" };
        public int[] retentionThresholds = { 1, 3, 7, 14, 30 }; // days
        
        private Dictionary<string, PlayerARPUProfile> _playerProfiles = new Dictionary<string, PlayerARPUProfile>();
        private Dictionary<string, RevenueEvent> _revenueEvents = new Dictionary<string, RevenueEvent>();
        private Dictionary<string, ConversionFunnel> _conversionFunnels = new Dictionary<string, ConversionFunnel>();
        private Dictionary<string, RetentionCohort> _retentionCohorts = new Dictionary<string, RetentionCohort>();
        private Dictionary<string, ARPUMetric> _arpuMetrics = new Dictionary<string, ARPUMetric>();
        
        private Coroutine _revenueTrackingCoroutine;
        private Coroutine _arpuAnalysisCoroutine;
        
        // Events
        public static event Action<PlayerARPUProfile> OnPlayerSegmentChanged;
        public static event Action<RevenueEvent> OnRevenueGenerated;
        public static event Action<ARPUMetric> OnARPUMetricUpdated;
        public static event Action<ConversionFunnel> OnConversionFunnelUpdated;
        
        public static ARPUAnalyticsSystem Instance { get; private set; }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeARPUAnalytics();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            if (enableARPUTracking)
            {
                InitializeARPUMetrics();
                StartARPUTracking();
            }
        }
        
        private void InitializeARPUAnalytics()
        {
            Debug.Log("ARPU Analytics System initialized - Revenue optimization mode activated!");
        }
        
        private void InitializeARPUMetrics()
        {
            // Core ARPU metrics
            _arpuMetrics["total_arpu"] = new ARPUMetric
            {
                name = "Total ARPU",
                value = 0f,
                type = MetricType.Gauge,
                unit = "USD",
                description = "Average Revenue Per User across all players"
            };
            
            _arpuMetrics["paying_arpu"] = new ARPUMetric
            {
                name = "Paying ARPU",
                value = 0f,
                type = MetricType.Gauge,
                unit = "USD",
                description = "Average Revenue Per Paying User"
            };
            
            _arpuMetrics["ltv"] = new ARPUMetric
            {
                name = "Lifetime Value",
                value = 0f,
                type = MetricType.Gauge,
                unit = "USD",
                description = "Average player lifetime value"
            };
            
            _arpuMetrics["conversion_rate"] = new ARPUMetric
            {
                name = "Conversion Rate",
                value = 0f,
                type = MetricType.Gauge,
                unit = "%",
                description = "Percentage of players who make a purchase"
            };
            
            _arpuMetrics["retention_rate"] = new ARPUMetric
            {
                name = "Retention Rate",
                value = 0f,
                type = MetricType.Gauge,
                unit = "%",
                description = "Player retention rate"
            };
            
            // Revenue source metrics
            _arpuMetrics["iap_revenue"] = new ARPUMetric
            {
                name = "IAP Revenue",
                value = 0f,
                type = MetricType.Counter,
                unit = "USD",
                description = "Revenue from in-app purchases"
            };
            
            _arpuMetrics["subscription_revenue"] = new ARPUMetric
            {
                name = "Subscription Revenue",
                value = 0f,
                type = MetricType.Counter,
                unit = "USD",
                description = "Revenue from subscriptions"
            };
            
            _arpuMetrics["ad_revenue"] = new ARPUMetric
            {
                name = "Ad Revenue",
                value = 0f,
                type = MetricType.Counter,
                unit = "USD",
                description = "Revenue from advertisements"
            };
        }
        
        private void StartARPUTracking()
        {
            _revenueTrackingCoroutine = StartCoroutine(RevenueTrackingCoroutine());
            _arpuAnalysisCoroutine = StartCoroutine(ARPUAnalysisCoroutine());
        }
        
        private IEnumerator RevenueTrackingCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(revenueUpdateInterval);
                
                UpdateRevenueMetrics();
                AnalyzePlayerSegments();
                UpdateConversionFunnels();
            }
        }
        
        private IEnumerator ARPUAnalysisCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(300f); // 5 minutes
                
                CalculateARPUMetrics();
                PredictLTV();
                AnalyzeRetentionCohorts();
            }
        }
        
        private void UpdateRevenueMetrics()
        {
            var totalRevenue = _revenueEvents.Values.Sum(e => e.amount);
            var totalPlayers = _playerProfiles.Count;
            var payingPlayers = _playerProfiles.Values.Count(p => p.totalSpent > 0);
            
            // Update ARPU metrics
            _arpuMetrics["total_arpu"].value = totalPlayers > 0 ? totalRevenue / totalPlayers : 0f;
            _arpuMetrics["paying_arpu"].value = payingPlayers > 0 ? totalRevenue / payingPlayers : 0f;
            _arpuMetrics["conversion_rate"].value = totalPlayers > 0 ? (float)payingPlayers / totalPlayers * 100f : 0f;
            
            // Update revenue source metrics
            _arpuMetrics["iap_revenue"].value = _revenueEvents.Values
                .Where(e => e.source == RevenueSource.IAP)
                .Sum(e => e.amount);
            
            _arpuMetrics["subscription_revenue"].value = _revenueEvents.Values
                .Where(e => e.source == RevenueSource.Subscription)
                .Sum(e => e.amount);
            
            _arpuMetrics["ad_revenue"].value = _revenueEvents.Values
                .Where(e => e.source == RevenueSource.Ad)
                .Sum(e => e.amount);
            
            // Notify listeners
            foreach (var metric in _arpuMetrics.Values)
            {
                OnARPUMetricUpdated?.Invoke(metric);
            }
        }
        
        private void AnalyzePlayerSegments()
        {
            foreach (var profile in _playerProfiles.Values)
            {
                var newSegment = DeterminePlayerSegment(profile);
                if (profile.segment != newSegment)
                {
                    profile.segment = newSegment;
                    OnPlayerSegmentChanged?.Invoke(profile);
                }
            }
        }
        
        private string DeterminePlayerSegment(PlayerARPUProfile profile)
        {
            var totalSpent = profile.totalSpent;
            
            for (int i = spendingThresholds.Length - 1; i >= 0; i--)
            {
                if (totalSpent >= spendingThresholds[i])
                {
                    return playerSegments[i];
                }
            }
            
            return playerSegments[0]; // non_payer
        }
        
        private void UpdateConversionFunnels()
        {
            // Update conversion funnels based on player behavior
            foreach (var funnel in _conversionFunnels.Values)
            {
                UpdateFunnelConversionRates(funnel);
            }
        }
        
        private void UpdateFunnelConversionRates(ConversionFunnel funnel)
        {
            var totalPlayers = _playerProfiles.Count;
            if (totalPlayers == 0) return;
            
            foreach (var step in funnel.steps)
            {
                var playersAtStep = _playerProfiles.Values.Count(p => HasReachedFunnelStep(p, step.name));
                step.conversionRate = totalPlayers > 0 ? (float)playersAtStep / totalPlayers : 0f;
            }
        }
        
        private bool HasReachedFunnelStep(PlayerARPUProfile profile, string stepName)
        {
            switch (stepName)
            {
                case "game_start":
                    return true;
                case "tutorial_complete":
                    return profile.tutorialCompleted;
                case "first_level":
                    return profile.levelsCompleted > 0;
                case "first_purchase":
                    return profile.totalSpent > 0;
                case "subscription":
                    return profile.hasActiveSubscription;
                default:
                    return false;
            }
        }
        
        private void CalculateARPUMetrics()
        {
            var totalRevenue = _revenueEvents.Values.Sum(e => e.amount);
            var totalPlayers = _playerProfiles.Count;
            
            if (totalPlayers > 0)
            {
                _arpuMetrics["ltv"].value = totalRevenue / totalPlayers;
            }
            
            // Calculate retention rate
            var retainedPlayers = _playerProfiles.Values.Count(p => 
                (DateTime.Now - p.lastPlayTime).TotalDays <= 7);
            _arpuMetrics["retention_rate"].value = totalPlayers > 0 ? 
                (float)retainedPlayers / totalPlayers * 100f : 0f;
        }
        
        private void PredictLTV()
        {
            foreach (var profile in _playerProfiles.Values)
            {
                var predictedLTV = CalculatePredictedLTV(profile);
                profile.predictedLTV = predictedLTV;
            }
        }
        
        private float CalculatePredictedLTV(PlayerARPUProfile profile)
        {
            var daysSinceInstall = (DateTime.Now - profile.installDate).TotalDays;
            if (daysSinceInstall <= 0) return 0f;
            
            var dailyRevenue = profile.totalSpent / (float)daysSinceInstall;
            var predictedLifetime = 30f; // Assume 30-day lifetime
            
            return dailyRevenue * predictedLifetime;
        }
        
        private void AnalyzeRetentionCohorts()
        {
            var currentDate = DateTime.Now.Date;
            
            foreach (var threshold in retentionThresholds)
            {
                var cohortKey = $"day_{threshold}";
                if (!_retentionCohorts.ContainsKey(cohortKey))
                {
                    _retentionCohorts[cohortKey] = new RetentionCohort
                    {
                        name = $"Day {threshold} Retention",
                        threshold = threshold,
                        totalPlayers = 0,
                        retainedPlayers = 0,
                        retentionRate = 0f
                    };
                }
                
                var cohort = _retentionCohorts[cohortKey];
                var playersAtThreshold = _playerProfiles.Values.Count(p => 
                    (currentDate - p.installDate.Date).TotalDays >= threshold);
                var retainedAtThreshold = _playerProfiles.Values.Count(p => 
                    (currentDate - p.installDate.Date).TotalDays >= threshold &&
                    (currentDate - p.lastPlayTime.Date).TotalDays <= threshold);
                
                cohort.totalPlayers = playersAtThreshold;
                cohort.retainedPlayers = retainedAtThreshold;
                cohort.retentionRate = playersAtThreshold > 0 ? 
                    (float)retainedAtThreshold / playersAtThreshold : 0f;
            }
        }
        
        public void TrackRevenue(string playerId, float amount, RevenueSource source, string itemId = "")
        {
            if (!enableARPUTracking) return;
            
            var revenueEvent = new RevenueEvent
            {
                id = Guid.NewGuid().ToString(),
                playerId = playerId,
                amount = amount,
                source = source,
                itemId = itemId,
                timestamp = DateTime.Now
            };
            
            _revenueEvents[revenueEvent.id] = revenueEvent;
            
            // Update player profile
            var profile = GetPlayerProfile(playerId);
            profile.totalSpent += amount;
            profile.lastPurchaseTime = DateTime.Now;
            profile.purchaseCount++;
            
            // Update revenue source tracking
            switch (source)
            {
                case RevenueSource.IAP:
                    profile.iapSpent += amount;
                    break;
                case RevenueSource.Subscription:
                    profile.subscriptionSpent += amount;
                    break;
                case RevenueSource.Ad:
                    profile.adRevenue += amount;
                    break;
            }
            
            OnRevenueGenerated?.Invoke(revenueEvent);
            
            // Track analytics
            var analytics = AdvancedAnalyticsSystem.Instance;
            if (analytics != null)
            {
                analytics.TrackEvent("revenue_generated", new Dictionary<string, object>
                {
                    ["player_id"] = playerId,
                    ["amount"] = amount,
                    ["source"] = source.ToString(),
                    ["item_id"] = itemId,
                    ["total_spent"] = profile.totalSpent
                });
            }
        }
        
        public void TrackPlayerAction(string playerId, string action, Dictionary<string, object> parameters = null)
        {
            if (!enableARPUTracking) return;
            
            var profile = GetPlayerProfile(playerId);
            profile.lastPlayTime = DateTime.Now;
            
            switch (action)
            {
                case "tutorial_complete":
                    profile.tutorialCompleted = true;
                    break;
                case "level_complete":
                    profile.levelsCompleted++;
                    break;
                case "subscription_start":
                    profile.hasActiveSubscription = true;
                    break;
                case "subscription_end":
                    profile.hasActiveSubscription = false;
                    break;
            }
        }
        
        public PlayerARPUProfile GetPlayerProfile(string playerId)
        {
            if (!_playerProfiles.ContainsKey(playerId))
            {
                _playerProfiles[playerId] = new PlayerARPUProfile
                {
                    playerId = playerId,
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
                    predictedLTV = 0f
                };
            }
            
            return _playerProfiles[playerId];
        }
        
        public Dictionary<string, ARPUMetric> GetARPUMetrics()
        {
            return new Dictionary<string, ARPUMetric>(_arpuMetrics);
        }
        
        public Dictionary<string, RetentionCohort> GetRetentionCohorts()
        {
            return new Dictionary<string, RetentionCohort>(_retentionCohorts);
        }
        
        public Dictionary<string, ConversionFunnel> GetConversionFunnels()
        {
            return new Dictionary<string, ConversionFunnel>(_conversionFunnels);
        }
        
        public Dictionary<string, object> GetARPUReport()
        {
            var totalPlayers = _playerProfiles.Count;
            var payingPlayers = _playerProfiles.Values.Count(p => p.totalSpent > 0);
            var totalRevenue = _revenueEvents.Values.Sum(e => e.amount);
            
            return new Dictionary<string, object>
            {
                ["total_players"] = totalPlayers,
                ["paying_players"] = payingPlayers,
                ["total_revenue"] = totalRevenue,
                ["arpu"] = totalPlayers > 0 ? totalRevenue / totalPlayers : 0f,
                ["arpu_paying"] = payingPlayers > 0 ? totalRevenue / payingPlayers : 0f,
                ["conversion_rate"] = totalPlayers > 0 ? (float)payingPlayers / totalPlayers * 100f : 0f,
                ["segment_distribution"] = GetSegmentDistribution(),
                ["revenue_sources"] = GetRevenueSourceDistribution(),
                ["retention_rates"] = GetRetentionRates()
            };
        }
        
        private Dictionary<string, int> GetSegmentDistribution()
        {
            var distribution = new Dictionary<string, int>();
            
            foreach (var segment in playerSegments)
            {
                distribution[segment] = _playerProfiles.Values.Count(p => p.segment == segment);
            }
            
            return distribution;
        }
        
        private Dictionary<string, float> GetRevenueSourceDistribution()
        {
            var totalRevenue = _revenueEvents.Values.Sum(e => e.amount);
            var distribution = new Dictionary<string, float>();
            
            if (totalRevenue > 0)
            {
                distribution["iap"] = _revenueEvents.Values
                    .Where(e => e.source == RevenueSource.IAP)
                    .Sum(e => e.amount) / totalRevenue * 100f;
                
                distribution["subscription"] = _revenueEvents.Values
                    .Where(e => e.source == RevenueSource.Subscription)
                    .Sum(e => e.amount) / totalRevenue * 100f;
                
                distribution["ads"] = _revenueEvents.Values
                    .Where(e => e.source == RevenueSource.Ad)
                    .Sum(e => e.amount) / totalRevenue * 100f;
            }
            
            return distribution;
        }
        
        private Dictionary<string, float> GetRetentionRates()
        {
            var rates = new Dictionary<string, float>();
            
            foreach (var cohort in _retentionCohorts.Values)
            {
                rates[cohort.name] = cohort.retentionRate;
            }
            
            return rates;
        }
        
        void OnDestroy()
        {
            if (_revenueTrackingCoroutine != null)
                StopCoroutine(_revenueTrackingCoroutine);
            if (_arpuAnalysisCoroutine != null)
                StopCoroutine(_arpuAnalysisCoroutine);
        }
    }
    
    [System.Serializable]
    public class PlayerARPUProfile
    {
        public string playerId;
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
    public class ConversionFunnel
    {
        public string name;
        public List<FunnelStep> steps;
    }
    
    [System.Serializable]
    public class FunnelStep
    {
        public string name;
        public float conversionRate;
    }
    
    [System.Serializable]
    public class RetentionCohort
    {
        public string name;
        public int threshold;
        public int totalPlayers;
        public int retainedPlayers;
        public float retentionRate;
    }
    
    [System.Serializable]
    public class ARPUMetric
    {
        public string name;
        public float value;
        public MetricType type;
        public string unit;
        public string description;
    }
    
    public enum RevenueSource
    {
        IAP,
        Subscription,
        Ad
    }
    
    public enum MetricType
    {
        Counter,
        Gauge,
        Timer,
        Histogram
    }
}