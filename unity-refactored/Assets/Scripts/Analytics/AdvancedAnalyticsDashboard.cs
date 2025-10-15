using System.Collections.Generic;
using UnityEngine;
using System;
using System.Linq;
using Evergreen.Core;
using Evergreen.AI;

namespace Evergreen.Analytics
{
    /// <summary>
    /// Comprehensive analytics dashboard with real-time metrics, player insights, and business intelligence
    /// </summary>
    public class AdvancedAnalyticsDashboard : MonoBehaviour
    {
        public static AdvancedAnalyticsDashboard Instance { get; private set; }

        [Header("Analytics Settings")]
        public bool enableRealTimeAnalytics = true;
        public bool enablePlayerTracking = true;
        public bool enableBusinessMetrics = true;
        public bool enablePredictiveAnalytics = true;
        public float updateInterval = 1f;

        [Header("Data Collection")]
        public bool enableEventTracking = true;
        public bool enablePerformanceTracking = true;
        public bool enableUserBehaviorTracking = true;
        public bool enableRevenueTracking = true;

        [Header("Visualization")]
        public bool enableCharts = true;
        public bool enableHeatmaps = true;
        public bool enablePlayerPaths = true;
        public bool enableRealTimeUpdates = true;

        private Dictionary<string, PlayerAnalytics> _playerAnalytics = new Dictionary<string, PlayerAnalytics>();
        private Dictionary<string, GameEvent> _gameEvents = new Dictionary<string, GameEvent>();
        private Dictionary<string, BusinessMetric> _businessMetrics = new Dictionary<string, BusinessMetric>();
        private Dictionary<string, PerformanceMetric> _performanceMetrics = new Dictionary<string, PerformanceMetric>();

        private RealTimeAnalytics _realTimeAnalytics;
        private PlayerInsightsEngine _playerInsights;
        private BusinessIntelligence _businessIntelligence;
        private PredictiveAnalytics _predictiveAnalytics;
        private DataVisualization _dataVisualization;

        public class PlayerAnalytics
        {
            public string playerId;
            public DateTime firstSeen;
            public DateTime lastSeen;
            public int totalSessions;
            public float totalPlayTime;
            public int levelsCompleted;
            public int levelsFailed;
            public float averageScore;
            public int totalSpent;
            public int totalEarned;
            public List<string> achievements;
            public Dictionary<string, float> behaviorMetrics;
            public PlayerSegment segment;
            public float churnRisk;
            public float lifetimeValue;
        }

        public class GameEvent
        {
            public string eventId;
            public string eventType;
            public string playerId;
            public Dictionary<string, object> parameters;
            public DateTime timestamp;
            public string sessionId;
            public float value;
        }

        public class BusinessMetric
        {
            public string metricId;
            public string metricName;
            public float currentValue;
            public float targetValue;
            public float previousValue;
            public float changePercent;
            public DateTime lastUpdated;
            public MetricType type;
            public string category;
        }

        public class PerformanceMetric
        {
            public string metricId;
            public string metricName;
            public float currentValue;
            public float averageValue;
            public float minValue;
            public float maxValue;
            public List<float> history;
            public DateTime lastUpdated;
            public PerformanceCategory category;
        }

        public enum PlayerSegment
        {
            NewPlayer,
            CasualPlayer,
            RegularPlayer,
            HardcorePlayer,
            Whale,
            Churned
        }

        public enum MetricType
        {
            Revenue,
            Engagement,
            Retention,
            Acquisition,
            Performance
        }

        public enum PerformanceCategory
        {
            FPS,
            Memory,
            Network,
            Loading,
            Rendering
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

        private void InitializeAnalytics()
        {
            _realTimeAnalytics = new RealTimeAnalytics();
            _playerInsights = new PlayerInsightsEngine();
            _businessIntelligence = new BusinessIntelligence();
            _predictiveAnalytics = new PredictiveAnalytics();
            _dataVisualization = new DataVisualization();

            StartCoroutine(UpdateAnalytics());
            Logger.Info("Advanced Analytics Dashboard initialized", "Analytics");
        }

        #region Event Tracking
        public void TrackEvent(string eventType, string playerId, Dictionary<string, object> parameters = null)
        {
            if (!enableEventTracking) return;

            var gameEvent = new GameEvent
            {
                eventId = Guid.NewGuid().ToString(),
                eventType = eventType,
                playerId = playerId,
                parameters = parameters ?? new Dictionary<string, object>(),
                timestamp = DateTime.Now,
                sessionId = GetCurrentSessionId(playerId),
                value = CalculateEventValue(eventType, parameters)
            };

            _gameEvents[gameEvent.eventId] = gameEvent;
            ProcessEvent(gameEvent);
        }

        private void ProcessEvent(GameEvent gameEvent)
        {
            // Update player analytics
            UpdatePlayerAnalytics(gameEvent);

            // Update business metrics
            UpdateBusinessMetrics(gameEvent);

            // Update performance metrics
            UpdatePerformanceMetrics(gameEvent);

            // Check for insights
            CheckForInsights(gameEvent);
        }

        private void UpdatePlayerAnalytics(GameEvent gameEvent)
        {
            if (!_playerAnalytics.ContainsKey(gameEvent.playerId))
            {
                _playerAnalytics[gameEvent.playerId] = new PlayerAnalytics
                {
                    playerId = gameEvent.playerId,
                    firstSeen = gameEvent.timestamp,
                    lastSeen = gameEvent.timestamp,
                    totalSessions = 0,
                    totalPlayTime = 0f,
                    levelsCompleted = 0,
                    levelsFailed = 0,
                    averageScore = 0f,
                    totalSpent = 0,
                    totalEarned = 0,
                    achievements = new List<string>(),
                    behaviorMetrics = new Dictionary<string, float>(),
                    segment = PlayerSegment.NewPlayer,
                    churnRisk = 0f,
                    lifetimeValue = 0f
                };
            }

            var player = _playerAnalytics[gameEvent.playerId];
            player.lastSeen = gameEvent.timestamp;

            switch (gameEvent.eventType)
            {
                case "session_start":
                    player.totalSessions++;
                    break;
                case "level_completed":
                    player.levelsCompleted++;
                    if (gameEvent.parameters.ContainsKey("score"))
                    {
                        var score = Convert.ToSingle(gameEvent.parameters["score"]);
                        player.averageScore = (player.averageScore * (player.levelsCompleted - 1) + score) / player.levelsCompleted;
                    }
                    break;
                case "level_failed":
                    player.levelsFailed++;
                    break;
                case "purchase_made":
                    if (gameEvent.parameters.ContainsKey("amount"))
                    {
                        player.totalSpent += Convert.ToInt32(gameEvent.parameters["amount"]);
                    }
                    break;
                case "reward_earned":
                    if (gameEvent.parameters.ContainsKey("amount"))
                    {
                        player.totalEarned += Convert.ToInt32(gameEvent.parameters["amount"]);
                    }
                    break;
            }

            // Update behavior metrics
            UpdateBehaviorMetrics(player, gameEvent);

            // Update player segment
            UpdatePlayerSegment(player);

            // Calculate churn risk
            player.churnRisk = _predictiveAnalytics.CalculateChurnRisk(player);

            // Calculate lifetime value
            player.lifetimeValue = _predictiveAnalytics.CalculateLifetimeValue(player);
        }

        private void UpdateBehaviorMetrics(PlayerAnalytics player, GameEvent gameEvent)
        {
            var behaviorKey = $"{gameEvent.eventType}_count";
            if (!player.behaviorMetrics.ContainsKey(behaviorKey))
            {
                player.behaviorMetrics[behaviorKey] = 0f;
            }
            player.behaviorMetrics[behaviorKey]++;

            // Update play time
            if (gameEvent.eventType == "session_end" && gameEvent.parameters.ContainsKey("duration"))
            {
                player.totalPlayTime += Convert.ToSingle(gameEvent.parameters["duration"]);
            }
        }

        private void UpdatePlayerSegment(PlayerAnalytics player)
        {
            var daysSinceFirstSeen = (DateTime.Now - player.firstSeen).TotalDays;
            var daysSinceLastSeen = (DateTime.Now - player.lastSeen).TotalDays;

            if (daysSinceLastSeen > 30)
            {
                player.segment = PlayerSegment.Churned;
            }
            else if (player.totalSpent > 1000)
            {
                player.segment = PlayerSegment.Whale;
            }
            else if (player.totalSessions > 50 && daysSinceFirstSeen > 7)
            {
                player.segment = PlayerSegment.HardcorePlayer;
            }
            else if (player.totalSessions > 10 && daysSinceFirstSeen > 3)
            {
                player.segment = PlayerSegment.RegularPlayer;
            }
            else if (player.totalSessions > 1)
            {
                player.segment = PlayerSegment.CasualPlayer;
            }
            else
            {
                player.segment = PlayerSegment.NewPlayer;
            }
        }
        #endregion

        #region Business Metrics
        private void UpdateBusinessMetrics(GameEvent gameEvent)
        {
            if (!enableBusinessMetrics) return;

            switch (gameEvent.eventType)
            {
                case "purchase_made":
                    UpdateRevenueMetrics(gameEvent);
                    break;
                case "session_start":
                    UpdateEngagementMetrics(gameEvent);
                    break;
                case "level_completed":
                    UpdateRetentionMetrics(gameEvent);
                    break;
            }
        }

        private void UpdateRevenueMetrics(GameEvent gameEvent)
        {
            var revenueMetric = GetOrCreateMetric("daily_revenue", "Daily Revenue", MetricType.Revenue);
            if (gameEvent.parameters.ContainsKey("amount"))
            {
                revenueMetric.currentValue += Convert.ToSingle(gameEvent.parameters["amount"]);
            }
            revenueMetric.lastUpdated = DateTime.Now;
        }

        private void UpdateEngagementMetrics(GameEvent gameEvent)
        {
            var engagementMetric = GetOrCreateMetric("daily_active_users", "Daily Active Users", MetricType.Engagement);
            engagementMetric.currentValue = _playerAnalytics.Values.Count(p => (DateTime.Now - p.lastSeen).TotalDays < 1);
            engagementMetric.lastUpdated = DateTime.Now;
        }

        private void UpdateRetentionMetrics(GameEvent gameEvent)
        {
            var retentionMetric = GetOrCreateMetric("day1_retention", "Day 1 Retention", MetricType.Retention);
            var player = _playerAnalytics.GetValueOrDefault(gameEvent.playerId);
            if (player != null)
            {
                var daysSinceFirstSeen = (DateTime.Now - player.firstSeen).TotalDays;
                if (daysSinceFirstSeen >= 1 && daysSinceFirstSeen < 2)
                {
                    retentionMetric.currentValue = 1f;
                }
            }
            retentionMetric.lastUpdated = DateTime.Now;
        }

        private BusinessMetric GetOrCreateMetric(string metricId, string metricName, MetricType type)
        {
            if (!_businessMetrics.ContainsKey(metricId))
            {
                _businessMetrics[metricId] = new BusinessMetric
                {
                    metricId = metricId,
                    metricName = metricName,
                    currentValue = 0f,
                    targetValue = 0f,
                    previousValue = 0f,
                    changePercent = 0f,
                    lastUpdated = DateTime.Now,
                    type = type,
                    category = type.ToString()
                };
            }
            return _businessMetrics[metricId];
        }
        #endregion

        #region Performance Metrics
        private void UpdatePerformanceMetrics(GameEvent gameEvent)
        {
            if (!enablePerformanceTracking) return;

            if (gameEvent.eventType == "performance_metric")
            {
                var metricName = gameEvent.parameters["metric_name"].ToString();
                var value = Convert.ToSingle(gameEvent.parameters["value"]);
                var category = (PerformanceCategory)Enum.Parse(typeof(PerformanceCategory), gameEvent.parameters["category"].ToString());

                var metric = GetOrCreatePerformanceMetric(metricName, category);
                metric.currentValue = value;
                metric.history.Add(value);
                
                if (metric.history.Count > 100)
                {
                    metric.history.RemoveAt(0);
                }

                metric.averageValue = metric.history.Average();
                metric.minValue = metric.history.Min();
                metric.maxValue = metric.history.Max();
                metric.lastUpdated = DateTime.Now;
            }
        }

        private PerformanceMetric GetOrCreatePerformanceMetric(string metricName, PerformanceCategory category)
        {
            if (!_performanceMetrics.ContainsKey(metricName))
            {
                _performanceMetrics[metricName] = new PerformanceMetric
                {
                    metricId = metricName,
                    metricName = metricName,
                    currentValue = 0f,
                    averageValue = 0f,
                    minValue = 0f,
                    maxValue = 0f,
                    history = new List<float>(),
                    lastUpdated = DateTime.Now,
                    category = category
                };
            }
            return _performanceMetrics[metricName];
        }
        #endregion

        #region Insights and Predictions
        private void CheckForInsights(GameEvent gameEvent)
        {
            if (!enablePredictiveAnalytics) return;

            var insights = _playerInsights.GenerateInsights(gameEvent, _playerAnalytics);
            foreach (var insight in insights)
            {
                ProcessInsight(insight);
            }
        }

        private void ProcessInsight(PlayerInsight insight)
        {
            Logger.Info($"Analytics Insight: {insight.message}", "Analytics");
            
            // Store insight for later analysis
            // In a real implementation, this would be stored in a database
        }
        #endregion

        #region Real-time Updates
        private System.Collections.IEnumerator UpdateAnalytics()
        {
            while (true)
            {
                if (enableRealTimeAnalytics)
                {
                    UpdateRealTimeMetrics();
                }

                yield return new WaitForSeconds(updateInterval);
            }
        }

        private void UpdateRealTimeMetrics()
        {
            // Update real-time metrics
            var activeUsers = _playerAnalytics.Values.Count(p => (DateTime.Now - p.lastSeen).TotalMinutes < 5);
            var totalRevenue = _playerAnalytics.Values.Sum(p => p.totalSpent);
            var averageSessionTime = _playerAnalytics.Values.Average(p => p.totalPlayTime / Mathf.Max(1, p.totalSessions));

            // Update real-time analytics
            _realTimeAnalytics.UpdateMetrics(activeUsers, totalRevenue, averageSessionTime);
        }
        #endregion

        #region Data Visualization
        public Dictionary<string, object> GetDashboardData()
        {
            return new Dictionary<string, object>
            {
                {"player_count", _playerAnalytics.Count},
                {"active_players", _playerAnalytics.Values.Count(p => (DateTime.Now - p.lastSeen).TotalMinutes < 5)},
                {"total_revenue", _playerAnalytics.Values.Sum(p => p.totalSpent)},
                {"average_session_time", _playerAnalytics.Values.Average(p => p.totalPlayTime / Mathf.Max(1, p.totalSessions))},
                {"retention_rate", CalculateRetentionRate()},
                {"churn_rate", CalculateChurnRate()},
                {"lifetime_value", _playerAnalytics.Values.Average(p => p.lifetimeValue)},
                {"business_metrics", _businessMetrics},
                {"performance_metrics", _performanceMetrics},
                {"player_segments", GetPlayerSegmentDistribution()},
                {"top_events", GetTopEvents()},
                {"revenue_breakdown", GetRevenueBreakdown()}
            };
        }

        private float CalculateRetentionRate()
        {
            var totalPlayers = _playerAnalytics.Count;
            if (totalPlayers == 0) return 0f;

            var retainedPlayers = _playerAnalytics.Values.Count(p => (DateTime.Now - p.lastSeen).TotalDays < 7);
            return (float)retainedPlayers / totalPlayers;
        }

        private float CalculateChurnRate()
        {
            var totalPlayers = _playerAnalytics.Count;
            if (totalPlayers == 0) return 0f;

            var churnedPlayers = _playerAnalytics.Values.Count(p => (DateTime.Now - p.lastSeen).TotalDays > 30);
            return (float)churnedPlayers / totalPlayers;
        }

        private Dictionary<string, int> GetPlayerSegmentDistribution()
        {
            var distribution = new Dictionary<string, int>();
            foreach (PlayerSegment segment in Enum.GetValues(typeof(PlayerSegment)))
            {
                distribution[segment.ToString()] = _playerAnalytics.Values.Count(p => p.segment == segment);
            }
            return distribution;
        }

        private List<Dictionary<string, object>> GetTopEvents()
        {
            return _gameEvents.Values
                .GroupBy(e => e.eventType)
                .OrderByDescending(g => g.Count())
                .Take(10)
                .Select(g => new Dictionary<string, object>
                {
                    {"event_type", g.Key},
                    {"count", g.Count()},
                    {"last_occurrence", g.Max(e => e.timestamp)}
                })
                .ToList();
        }

        private Dictionary<string, float> GetRevenueBreakdown()
        {
            var breakdown = new Dictionary<string, float>();
            var totalRevenue = _playerAnalytics.Values.Sum(p => p.totalSpent);

            foreach (PlayerSegment segment in Enum.GetValues(typeof(PlayerSegment)))
            {
                var segmentRevenue = _playerAnalytics.Values
                    .Where(p => p.segment == segment)
                    .Sum(p => p.totalSpent);
                breakdown[segment.ToString()] = totalRevenue > 0 ? segmentRevenue / totalRevenue : 0f;
            }

            return breakdown;
        }
        #endregion

        #region Utility Methods
        private string GetCurrentSessionId(string playerId)
        {
            // Generate or retrieve session ID for player
            return $"{playerId}_{DateTime.Now:yyyyMMdd}";
        }

        private float CalculateEventValue(string eventType, Dictionary<string, object> parameters)
        {
            switch (eventType)
            {
                case "purchase_made":
                    return parameters.ContainsKey("amount") ? Convert.ToSingle(parameters["amount"]) : 0f;
                case "level_completed":
                    return parameters.ContainsKey("score") ? Convert.ToSingle(parameters["score"]) : 100f;
                default:
                    return 1f;
            }
        }
        #endregion

        #region Statistics
        public Dictionary<string, object> GetAnalyticsStatistics()
        {
            return new Dictionary<string, object>
            {
                {"total_players", _playerAnalytics.Count},
                {"total_events", _gameEvents.Count},
                {"business_metrics_count", _businessMetrics.Count},
                {"performance_metrics_count", _performanceMetrics.Count},
                {"enable_real_time_analytics", enableRealTimeAnalytics},
                {"enable_player_tracking", enablePlayerTracking},
                {"enable_business_metrics", enableBusinessMetrics},
                {"enable_predictive_analytics", enablePredictiveAnalytics},
                {"update_interval", updateInterval}
            };
        }
        #endregion
    }

    /// <summary>
    /// Real-time analytics engine
    /// </summary>
    public class RealTimeAnalytics
    {
        private Dictionary<string, float> _realTimeMetrics = new Dictionary<string, float>();

        public void UpdateMetrics(int activeUsers, float totalRevenue, float averageSessionTime)
        {
            _realTimeMetrics["active_users"] = activeUsers;
            _realTimeMetrics["total_revenue"] = totalRevenue;
            _realTimeMetrics["average_session_time"] = averageSessionTime;
        }

        public Dictionary<string, float> GetRealTimeMetrics()
        {
            return new Dictionary<string, float>(_realTimeMetrics);
        }
    }

    /// <summary>
    /// Player insights engine
    /// </summary>
    public class PlayerInsightsEngine
    {
        public List<PlayerInsight> GenerateInsights(GameEvent gameEvent, Dictionary<string, PlayerAnalytics> playerAnalytics)
        {
            var insights = new List<PlayerInsight>();

            // Generate insights based on game event
            if (gameEvent.eventType == "level_failed")
            {
                var player = playerAnalytics.GetValueOrDefault(gameEvent.playerId);
                if (player != null && player.levelsFailed > 5)
                {
                    insights.Add(new PlayerInsight
                    {
                        type = "difficulty_concern",
                        message = $"Player {gameEvent.playerId} has failed {player.levelsFailed} levels - consider difficulty adjustment",
                        priority = InsightPriority.Medium,
                        playerId = gameEvent.playerId
                    });
                }
            }

            return insights;
        }
    }

    /// <summary>
    /// Business intelligence engine
    /// </summary>
    public class BusinessIntelligence
    {
        public Dictionary<string, object> GenerateBusinessReport(Dictionary<string, PlayerAnalytics> playerAnalytics)
        {
            return new Dictionary<string, object>
            {
                {"total_revenue", playerAnalytics.Values.Sum(p => p.totalSpent)},
                {"average_revenue_per_user", playerAnalytics.Values.Average(p => p.totalSpent)},
                {"whale_count", playerAnalytics.Values.Count(p => p.segment == PlayerSegment.Whale)},
                {"churn_rate", playerAnalytics.Values.Count(p => p.segment == PlayerSegment.Churned) / (float)playerAnalytics.Count}
            };
        }
    }

    /// <summary>
    /// Predictive analytics engine
    /// </summary>
    public class PredictiveAnalytics
    {
        public float CalculateChurnRisk(PlayerAnalytics player)
        {
            var daysSinceLastSeen = (DateTime.Now - player.lastSeen).TotalDays;
            var sessionFrequency = player.totalSessions / Mathf.Max(1, (float)(DateTime.Now - player.firstSeen).TotalDays);

            var churnRisk = 0f;
            churnRisk += (float)daysSinceLastSeen / 30f * 0.5f;
            churnRisk += (1f - sessionFrequency) * 0.3f;
            churnRisk += (1f - player.levelsCompleted / Mathf.Max(1, player.levelsFailed + player.levelsCompleted)) * 0.2f;

            return Mathf.Clamp01(churnRisk);
        }

        public float CalculateLifetimeValue(PlayerAnalytics player)
        {
            var daysSinceFirstSeen = (DateTime.Now - player.firstSeen).TotalDays;
            var dailyValue = player.totalSpent / Mathf.Max(1, (float)daysSinceFirstSeen);
            var predictedLifetime = 30f; // 30 days average lifetime

            return dailyValue * predictedLifetime;
        }
    }

    /// <summary>
    /// Data visualization engine
    /// </summary>
    public class DataVisualization
    {
        public void GenerateCharts(Dictionary<string, object> data)
        {
            // Generate charts for data visualization
        }

        public void GenerateHeatmaps(Dictionary<string, object> data)
        {
            // Generate heatmaps for data visualization
        }
    }

    /// <summary>
    /// Player insight data structure
    /// </summary>
    public class PlayerInsight
    {
        public string type;
        public string message;
        public InsightPriority priority;
        public string playerId;
        public DateTime timestamp;
    }

    public enum InsightPriority
    {
        Low,
        Medium,
        High,
        Critical
    }
}