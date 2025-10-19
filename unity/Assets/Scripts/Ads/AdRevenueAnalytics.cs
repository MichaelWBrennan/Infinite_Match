using UnityEngine;
using System.Collections.Generic;
using System.Collections;
using System;

namespace Evergreen.Ads
{
    public class AdRevenueAnalytics : MonoBehaviour
    {
        public static AdRevenueAnalytics Instance { get; private set; }
        
        [Header("Analytics Settings")]
        public bool enableRealTimeAnalytics = true;
        public float analyticsUpdateInterval = 30f;
        public bool enableRevenuePrediction = true;
        
        [Header("Revenue Tracking")]
        public float totalLifetimeRevenue = 0f;
        public float dailyRevenue = 0f;
        public float weeklyRevenue = 0f;
        public float monthlyRevenue = 0f;
        
        [Header("Performance Metrics")]
        public float avgRevenuePerUser = 0f;
        public float avgRevenuePerSession = 0f;
        public float avgRevenuePerImpression = 0f;
        public float adFillRate = 0f;
        public float adClickThroughRate = 0f;
        
        private Dictionary<string, AdPlacementAnalytics> _placementAnalytics;
        private Dictionary<string, AdNetworkAnalytics> _networkAnalytics;
        private Dictionary<string, UserSegmentAnalytics> _userSegmentAnalytics;
        private List<RevenueEvent> _revenueEvents;
        private Coroutine _analyticsRoutine;
        
        private void Awake()
        {
            if (Instance != null) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            
            InitializeAnalytics();
            StartAnalyticsRoutine();
        }
        
        private void InitializeAnalytics()
        {
            _placementAnalytics = new Dictionary<string, AdPlacementAnalytics>();
            _networkAnalytics = new Dictionary<string, AdNetworkAnalytics>();
            _userSegmentAnalytics = new Dictionary<string, UserSegmentAnalytics>();
            _revenueEvents = new List<RevenueEvent>();
            
            // Initialize placement analytics
            var placements = new[] { "level_complete", "rewarded_continue", "rewarded_boost", "banner_bottom" };
            foreach (var placement in placements)
            {
                _placementAnalytics[placement] = new AdPlacementAnalytics
                {
                    placementName = placement,
                    impressions = 0,
                    clicks = 0,
                    revenue = 0f,
                    avgECPM = 0f,
                    fillRate = 0f
                };
            }
            
            // Initialize network analytics
            var networks = new[] { "MAX", "LevelPlay", "UnityAds", "AdMob" };
            foreach (var network in networks)
            {
                _networkAnalytics[network] = new AdNetworkAnalytics
                {
                    networkName = network,
                    impressions = 0,
                    clicks = 0,
                    revenue = 0f,
                    avgECPM = 0f,
                    fillRate = 0f,
                    loadTime = 0f
                };
            }
            
            // Initialize user segment analytics
            var segments = new[] { "whale", "dolphin", "minnow" };
            foreach (var segment in segments)
            {
                _userSegmentAnalytics[segment] = new UserSegmentAnalytics
                {
                    segmentName = segment,
                    userCount = 0,
                    totalRevenue = 0f,
                    avgRevenuePerUser = 0f,
                    adFrequency = 0f
                };
            }
        }
        
        private void StartAnalyticsRoutine()
        {
            if (_analyticsRoutine != null) StopCoroutine(_analyticsRoutine);
            _analyticsRoutine = StartCoroutine(AnalyticsRoutine());
        }
        
        private IEnumerator AnalyticsRoutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(analyticsUpdateInterval);
                
                if (enableRealTimeAnalytics)
                {
                    UpdateAnalytics();
                    CalculateMetrics();
                    
                    if (enableRevenuePrediction)
                    {
                        PredictRevenue();
                    }
                }
            }
        }
        
        public void TrackAdImpression(string placement, string network, float revenue, string userSegment = "unknown")
        {
            var revenueEvent = new RevenueEvent
            {
                timestamp = Time.time,
                placement = placement,
                network = network,
                revenue = revenue,
                userSegment = userSegment,
                eventType = "impression"
            };
            
            _revenueEvents.Add(revenueEvent);
            
            // Update placement analytics
            if (_placementAnalytics.ContainsKey(placement))
            {
                var analytics = _placementAnalytics[placement];
                analytics.impressions++;
                analytics.revenue += revenue;
                analytics.avgECPM = analytics.revenue / analytics.impressions * 1000f;
            }
            
            // Update network analytics
            if (_networkAnalytics.ContainsKey(network))
            {
                var analytics = _networkAnalytics[network];
                analytics.impressions++;
                analytics.revenue += revenue;
                analytics.avgECPM = analytics.revenue / analytics.impressions * 1000f;
            }
            
            // Update user segment analytics
            if (_userSegmentAnalytics.ContainsKey(userSegment))
            {
                var analytics = _userSegmentAnalytics[userSegment];
                analytics.totalRevenue += revenue;
                analytics.avgRevenuePerUser = analytics.totalRevenue / Mathf.Max(1f, analytics.userCount);
            }
            
            // Update global revenue
            totalLifetimeRevenue += revenue;
            dailyRevenue += revenue;
            weeklyRevenue += revenue;
            monthlyRevenue += revenue;
            
            Debug.Log($"[AdAnalytics] Impression tracked: {placement} via {network}, Revenue: ${revenue:F4}");
        }
        
        public void TrackAdClick(string placement, string network, string userSegment = "unknown")
        {
            var revenueEvent = new RevenueEvent
            {
                timestamp = Time.time,
                placement = placement,
                network = network,
                revenue = 0f,
                userSegment = userSegment,
                eventType = "click"
            };
            
            _revenueEvents.Add(revenueEvent);
            
            // Update placement analytics
            if (_placementAnalytics.ContainsKey(placement))
            {
                _placementAnalytics[placement].clicks++;
            }
            
            // Update network analytics
            if (_networkAnalytics.ContainsKey(network))
            {
                _networkAnalytics[network].clicks++;
            }
            
            Debug.Log($"[AdAnalytics] Click tracked: {placement} via {network}");
        }
        
        public void TrackUserSegment(string userSegment, float userSpend)
        {
            if (_userSegmentAnalytics.ContainsKey(userSegment))
            {
                var analytics = _userSegmentAnalytics[userSegment];
                analytics.userCount++;
                analytics.avgRevenuePerUser = analytics.totalRevenue / analytics.userCount;
            }
        }
        
        private void UpdateAnalytics()
        {
            // Update fill rates
            foreach (var placement in _placementAnalytics.Values)
            {
                var totalRequests = placement.impressions + GetFailedRequests(placement.placementName);
                placement.fillRate = totalRequests > 0 ? (float)placement.impressions / totalRequests : 0f;
            }
            
            foreach (var network in _networkAnalytics.Values)
            {
                var totalRequests = network.impressions + GetFailedRequests(network.networkName);
                network.fillRate = totalRequests > 0 ? (float)network.impressions / totalRequests : 0f;
            }
            
            // Update click-through rates
            foreach (var placement in _placementAnalytics.Values)
            {
                placement.clickThroughRate = placement.impressions > 0 ? (float)placement.clicks / placement.impressions : 0f;
            }
            
            foreach (var network in _networkAnalytics.Values)
            {
                network.clickThroughRate = network.impressions > 0 ? (float)network.clicks / network.impressions : 0f;
            }
        }
        
        private void CalculateMetrics()
        {
            var totalUsers = GetTotalUsers();
            var totalSessions = GetTotalSessions();
            var totalImpressions = GetTotalImpressions();
            
            avgRevenuePerUser = totalUsers > 0 ? totalLifetimeRevenue / totalUsers : 0f;
            avgRevenuePerSession = totalSessions > 0 ? totalLifetimeRevenue / totalSessions : 0f;
            avgRevenuePerImpression = totalImpressions > 0 ? totalLifetimeRevenue / totalImpressions : 0f;
            
            var totalAdRequests = GetTotalAdRequests();
            adFillRate = totalAdRequests > 0 ? (float)totalImpressions / totalAdRequests : 0f;
            
            var totalClicks = GetTotalClicks();
            adClickThroughRate = totalImpressions > 0 ? (float)totalClicks / totalImpressions : 0f;
        }
        
        private void PredictRevenue()
        {
            // Simple revenue prediction based on current trends
            var recentRevenue = GetRecentRevenue(24f); // Last 24 hours
            var predictedDaily = recentRevenue * 1.1f; // 10% growth assumption
            var predictedWeekly = predictedDaily * 7f;
            var predictedMonthly = predictedDaily * 30f;
            
            Debug.Log($"[AdAnalytics] Revenue Prediction - Daily: ${predictedDaily:F2}, Weekly: ${predictedWeekly:F2}, Monthly: ${predictedMonthly:F2}");
        }
        
        private float GetRecentRevenue(float hours)
        {
            var cutoffTime = Time.time - (hours * 3600f);
            float revenue = 0f;
            
            foreach (var revenueEvent in _revenueEvents)
            {
                if (revenueEvent.timestamp >= cutoffTime && revenueEvent.eventType == "impression")
                {
                    revenue += revenueEvent.revenue;
                }
            }
            
            return revenue;
        }
        
        private int GetTotalUsers()
        {
            int total = 0;
            foreach (var segment in _userSegmentAnalytics.Values)
            {
                total += segment.userCount;
            }
            return total;
        }
        
        private int GetTotalSessions()
        {
            return PlayerPrefs.GetInt("TotalSessions", 1);
        }
        
        private int GetTotalImpressions()
        {
            int total = 0;
            foreach (var placement in _placementAnalytics.Values)
            {
                total += placement.impressions;
            }
            return total;
        }
        
        private int GetTotalAdRequests()
        {
            return PlayerPrefs.GetInt("TotalAdRequests", 1);
        }
        
        private int GetTotalClicks()
        {
            int total = 0;
            foreach (var placement in _placementAnalytics.Values)
            {
                total += placement.clicks;
            }
            return total;
        }
        
        private int GetFailedRequests(string identifier)
        {
            return PlayerPrefs.GetInt($"FailedRequests_{identifier}", 0);
        }
        
        public void GenerateRevenueReport()
        {
            Debug.Log("[AdAnalytics] === REVENUE ANALYTICS REPORT ===");
            Debug.Log($"Total Lifetime Revenue: ${totalLifetimeRevenue:F2}");
            Debug.Log($"Daily Revenue: ${dailyRevenue:F2}");
            Debug.Log($"Weekly Revenue: ${weeklyRevenue:F2}");
            Debug.Log($"Monthly Revenue: ${monthlyRevenue:F2}");
            Debug.Log($"Avg Revenue Per User: ${avgRevenuePerUser:F4}");
            Debug.Log($"Avg Revenue Per Session: ${avgRevenuePerSession:F4}");
            Debug.Log($"Avg Revenue Per Impression: ${avgRevenuePerImpression:F4}");
            Debug.Log($"Ad Fill Rate: {adFillRate:P1}");
            Debug.Log($"Ad Click-Through Rate: {adClickThroughRate:P1}");
            
            Debug.Log("\n[AdAnalytics] === PLACEMENT PERFORMANCE ===");
            foreach (var placement in _placementAnalytics.Values)
            {
                Debug.Log($"{placement.placementName}: " +
                         $"Impressions: {placement.impressions}, " +
                         $"Clicks: {placement.clicks}, " +
                         $"Revenue: ${placement.revenue:F2}, " +
                         $"eCPM: ${placement.avgECPM:F2}, " +
                         $"Fill Rate: {placement.fillRate:P1}, " +
                         $"CTR: {placement.clickThroughRate:P1}");
            }
            
            Debug.Log("\n[AdAnalytics] === NETWORK PERFORMANCE ===");
            foreach (var network in _networkAnalytics.Values)
            {
                Debug.Log($"{network.networkName}: " +
                         $"Impressions: {network.impressions}, " +
                         $"Clicks: {network.clicks}, " +
                         $"Revenue: ${network.revenue:F2}, " +
                         $"eCPM: ${network.avgECPM:F2}, " +
                         $"Fill Rate: {network.fillRate:P1}, " +
                         $"CTR: {network.clickThroughRate:P1}");
            }
            
            Debug.Log("\n[AdAnalytics] === USER SEGMENT PERFORMANCE ===");
            foreach (var segment in _userSegmentAnalytics.Values)
            {
                Debug.Log($"{segment.segmentName}: " +
                         $"Users: {segment.userCount}, " +
                         $"Total Revenue: ${segment.totalRevenue:F2}, " +
                         $"Avg Revenue Per User: ${segment.avgRevenuePerUser:F4}, " +
                         $"Ad Frequency: {segment.adFrequency:P1}");
            }
        }
        
        public void ExportAnalyticsData()
        {
            // This would export data to a file or send to analytics service
            Debug.Log("[AdAnalytics] Exporting analytics data...");
            
            var exportData = new AnalyticsExportData
            {
                timestamp = DateTime.Now.ToString(),
                totalLifetimeRevenue = totalLifetimeRevenue,
                dailyRevenue = dailyRevenue,
                weeklyRevenue = weeklyRevenue,
                monthlyRevenue = monthlyRevenue,
                avgRevenuePerUser = avgRevenuePerUser,
                avgRevenuePerSession = avgRevenuePerSession,
                avgRevenuePerImpression = avgRevenuePerImpression,
                adFillRate = adFillRate,
                adClickThroughRate = adClickThroughRate,
                placementAnalytics = _placementAnalytics,
                networkAnalytics = _networkAnalytics,
                userSegmentAnalytics = _userSegmentAnalytics
            };
            
            // In a real implementation, this would be saved to a file or sent to a server
            Debug.Log($"[AdAnalytics] Analytics data exported: {exportData.timestamp}");
        }
    }
    
    [System.Serializable]
    public class AdPlacementAnalytics
    {
        public string placementName;
        public int impressions;
        public int clicks;
        public float revenue;
        public float avgECPM;
        public float fillRate;
        public float clickThroughRate;
    }
    
    [System.Serializable]
    public class AdNetworkAnalytics
    {
        public string networkName;
        public int impressions;
        public int clicks;
        public float revenue;
        public float avgECPM;
        public float fillRate;
        public float loadTime;
        public float clickThroughRate;
    }
    
    [System.Serializable]
    public class UserSegmentAnalytics
    {
        public string segmentName;
        public int userCount;
        public float totalRevenue;
        public float avgRevenuePerUser;
        public float adFrequency;
    }
    
    [System.Serializable]
    public class RevenueEvent
    {
        public float timestamp;
        public string placement;
        public string network;
        public float revenue;
        public string userSegment;
        public string eventType;
    }
    
    [System.Serializable]
    public class AnalyticsExportData
    {
        public string timestamp;
        public float totalLifetimeRevenue;
        public float dailyRevenue;
        public float weeklyRevenue;
        public float monthlyRevenue;
        public float avgRevenuePerUser;
        public float avgRevenuePerSession;
        public float avgRevenuePerImpression;
        public float adFillRate;
        public float adClickThroughRate;
        public Dictionary<string, AdPlacementAnalytics> placementAnalytics;
        public Dictionary<string, AdNetworkAnalytics> networkAnalytics;
        public Dictionary<string, UserSegmentAnalytics> userSegmentAnalytics;
    }
}
