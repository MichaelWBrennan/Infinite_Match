using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using System.Linq;
using Evergreen.Social;
using Evergreen.Core;
using Evergreen.Integration;

namespace Evergreen.Social
{
    /// <summary>
    /// Social Analytics - Comprehensive analytics for social media integration
    /// Tracks engagement, viral content, sharing patterns, and social ROI
    /// </summary>
    public class SocialAnalytics : MonoBehaviour
    {
        [Header("Analytics Configuration")]
        public bool enableSocialAnalytics = true;
        public float analyticsUpdateInterval = 60f;
        public bool enableRealTimeTracking = true;
        public bool enablePredictiveAnalytics = true;
        public bool enableROITracking = true;
        
        [Header("Data Retention")]
        public int maxDataPoints = 10000;
        public float dataRetentionDays = 30f;
        public bool enableDataCompression = true;
        
        [Header("Reporting")]
        public bool enableDailyReports = true;
        public bool enableWeeklyReports = true;
        public bool enableMonthlyReports = true;
        public bool enableCustomReports = true;
        
        // Singleton
        public static SocialAnalytics Instance { get; private set; }
        
        // References
        private SocialMediaManager socialManager;
        private ViralMechanics viralMechanics;
        private GameAnalyticsManager analyticsManager;
        private BackendConnector backendConnector;
        private GameDataManager dataManager;
        
        // Analytics Data
        private List<SocialEvent> socialEvents = new List<SocialEvent>();
        private List<EngagementMetric> engagementMetrics = new List<EngagementMetric>();
        private List<ViralContent> viralContent = new List<ViralContent>();
        private List<SocialROI> socialROIs = new List<SocialROI>();
        private Dictionary<string, SocialInsight> socialInsights = new Dictionary<string, SocialInsight>();
        private Dictionary<string, SocialPrediction> socialPredictions = new Dictionary<string, SocialPrediction>();
        
        // Events
        public System.Action<SocialInsight> OnInsightGenerated;
        public System.Action<SocialPrediction> OnPredictionGenerated;
        public System.Action<SocialReport> OnReportGenerated;
        public System.Action<SocialROI> OnROIUpdated;
        
        [System.Serializable]
        public class SocialEvent
        {
            public string id;
            public string eventType;
            public string platform;
            public string contentId;
            public int engagement;
            public float timestamp;
            public Dictionary<string, object> metadata;
        }
        
        [System.Serializable]
        public class EngagementMetric
        {
            public string platform;
            public int totalShares;
            public int totalLikes;
            public int totalComments;
            public int totalViews;
            public float engagementRate;
            public float clickThroughRate;
            public float conversionRate;
            public DateTime timestamp;
        }
        
        [System.Serializable]
        public class ViralContent
        {
            public string id;
            public string platform;
            public string content;
            public int engagement;
            public bool isViral;
            public float viralScore;
            public DateTime timestamp;
            public Dictionary<string, object> metadata;
        }
        
        [System.Serializable]
        public class SocialROI
        {
            public string platform;
            public float investment;
            public float returnValue;
            public float roi;
            public int newUsers;
            public int retainedUsers;
            public float userLifetimeValue;
            public DateTime timestamp;
        }
        
        [System.Serializable]
        public class SocialInsight
        {
            public string id;
            public string type;
            public string title;
            public string description;
            public float confidence;
            public Dictionary<string, object> data;
            public DateTime timestamp;
        }
        
        [System.Serializable]
        public class SocialPrediction
        {
            public string id;
            public string type;
            public string description;
            public float probability;
            public Dictionary<string, object> factors;
            public DateTime timestamp;
        }
        
        [System.Serializable]
        public class SocialReport
        {
            public string id;
            public string type;
            public string title;
            public Dictionary<string, object> data;
            public DateTime generatedAt;
            public DateTime periodStart;
            public DateTime periodEnd;
        }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                Initialize();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            if (enableSocialAnalytics)
            {
                StartCoroutine(AnalyticsLoop());
                StartCoroutine(InsightsLoop());
                StartCoroutine(PredictionsLoop());
                StartCoroutine(ReportsLoop());
            }
        }
        
        /// <summary>
        /// Initialize social analytics
        /// </summary>
        private void Initialize()
        {
            // Get references
            socialManager = SocialMediaManager.Instance;
            viralMechanics = ViralMechanics.Instance;
            analyticsManager = FindObjectOfType<GameAnalyticsManager>();
            backendConnector = BackendConnector.Instance;
            dataManager = GameDataManager.Instance;
            
            // Subscribe to events
            if (socialManager != null)
            {
                socialManager.OnPostShared += OnPostShared;
                socialManager.OnViralAchievement += OnViralAchievement;
                socialManager.OnAnalyticsUpdated += OnAnalyticsUpdated;
            }
            
            if (viralMechanics != null)
            {
                viralMechanics.OnViralContentGenerated += OnViralContentGenerated;
                viralMechanics.OnViralRewardEarned += OnViralRewardEarned;
            }
            
            Debug.Log("📊 Social Analytics initialized");
        }
        
        /// <summary>
        /// Analytics loop
        /// </summary>
        private IEnumerator AnalyticsLoop()
        {
            while (true)
            {
                yield return new WaitForSeconds(analyticsUpdateInterval);
                
                // Update engagement metrics
                UpdateEngagementMetrics();
                
                // Calculate ROI
                if (enableROITracking)
                {
                    CalculateROI();
                }
                
                // Generate insights
                if (enableRealTimeTracking)
                {
                    GenerateInsights();
                }
                
                // Clean up old data
                CleanupOldData();
            }
        }
        
        /// <summary>
        /// Insights loop
        /// </summary>
        private IEnumerator InsightsLoop()
        {
            while (true)
            {
                yield return new WaitForSeconds(analyticsUpdateInterval * 2);
                
                if (enableRealTimeTracking)
                {
                    GenerateInsights();
                }
            }
        }
        
        /// <summary>
        /// Predictions loop
        /// </summary>
        private IEnumerator PredictionsLoop()
        {
            while (true)
            {
                yield return new WaitForSeconds(analyticsUpdateInterval * 3);
                
                if (enablePredictiveAnalytics)
                {
                    GeneratePredictions();
                }
            }
        }
        
        /// <summary>
        /// Reports loop
        /// </summary>
        private IEnumerator ReportsLoop()
        {
            while (true)
            {
                yield return new WaitForSeconds(analyticsUpdateInterval * 4);
                
                if (enableDailyReports)
                {
                    GenerateDailyReport();
                }
            }
        }
        
        /// <summary>
        /// Track social event
        /// </summary>
        public void TrackSocialEvent(string eventType, string platform, string contentId, int engagement, Dictionary<string, object> metadata = null)
        {
            if (!enableSocialAnalytics) return;
            
            var socialEvent = new SocialEvent
            {
                id = System.Guid.NewGuid().ToString(),
                eventType = eventType,
                platform = platform,
                contentId = contentId,
                engagement = engagement,
                timestamp = Time.time,
                metadata = metadata ?? new Dictionary<string, object>()
            };
            
            socialEvents.Add(socialEvent);
            
            // Track with analytics manager
            if (analyticsManager != null)
            {
                analyticsManager.TrackEvent($"social_{eventType}", new Dictionary<string, object>
                {
                    {"platform", platform},
                    {"content_id", contentId},
                    {"engagement", engagement}
                });
            }
            
            // Track with backend
            if (backendConnector != null)
            {
                backendConnector.TrackEvent($"social_{eventType}", new Dictionary<string, object>
                {
                    {"platform", platform},
                    {"content_id", contentId},
                    {"engagement", engagement}
                });
            }
        }
        
        /// <summary>
        /// Update engagement metrics
        /// </summary>
        private void UpdateEngagementMetrics()
        {
            var platformMetrics = new Dictionary<string, EngagementMetric>();
            
            // Calculate metrics for each platform
            foreach (var platform in socialManager.GetAvailablePlatforms())
            {
                var platformEvents = socialEvents.Where(e => e.platform == platform).ToList();
                
                var metric = new EngagementMetric
                {
                    platform = platform,
                    totalShares = platformEvents.Count(e => e.eventType == "content_shared"),
                    totalLikes = platformEvents.Sum(e => e.engagement),
                    totalComments = platformEvents.Count(e => e.eventType == "comment"),
                    totalViews = platformEvents.Sum(e => e.engagement * 10), // Estimate views
                    engagementRate = 0f,
                    clickThroughRate = 0f,
                    conversionRate = 0f,
                    timestamp = DateTime.Now
                };
                
                // Calculate engagement rate
                if (metric.totalViews > 0)
                {
                    metric.engagementRate = (float)(metric.totalLikes + metric.totalComments + metric.totalShares) / metric.totalViews;
                }
                
                // Calculate click-through rate (simplified)
                metric.clickThroughRate = metric.engagementRate * 0.1f;
                
                // Calculate conversion rate (simplified)
                metric.conversionRate = metric.engagementRate * 0.05f;
                
                platformMetrics[platform] = metric;
            }
            
            // Update engagement metrics
            engagementMetrics.Clear();
            engagementMetrics.AddRange(platformMetrics.Values);
        }
        
        /// <summary>
        /// Calculate ROI
        /// </summary>
        private void CalculateROI()
        {
            foreach (var platform in socialManager.GetAvailablePlatforms())
            {
                var platformEvents = socialEvents.Where(e => e.platform == platform).ToList();
                var platformEngagement = platformEvents.Sum(e => e.engagement);
                
                // Calculate investment (simplified)
                float investment = platformEvents.Count * 0.1f; // $0.10 per post
                
                // Calculate return value (simplified)
                float returnValue = platformEngagement * 0.01f; // $0.01 per engagement
                
                // Calculate ROI
                float roi = investment > 0 ? (returnValue - investment) / investment : 0f;
                
                var socialROI = new SocialROI
                {
                    platform = platform,
                    investment = investment,
                    returnValue = returnValue,
                    roi = roi,
                    newUsers = platformEvents.Count(e => e.eventType == "new_user"),
                    retainedUsers = platformEvents.Count(e => e.eventType == "user_retained"),
                    userLifetimeValue = returnValue / Mathf.Max(1, platformEvents.Count),
                    timestamp = DateTime.Now
                };
                
                socialROIs.Add(socialROI);
                OnROIUpdated?.Invoke(socialROI);
            }
        }
        
        /// <summary>
        /// Generate insights
        /// </summary>
        private void GenerateInsights()
        {
            // Best performing platform
            var bestPlatform = engagementMetrics.OrderByDescending(m => m.engagementRate).FirstOrDefault();
            if (bestPlatform != null)
            {
                var insight = new SocialInsight
                {
                    id = System.Guid.NewGuid().ToString(),
                    type = "best_platform",
                    title = "Best Performing Platform",
                    description = $"{bestPlatform.platform} has the highest engagement rate at {bestPlatform.engagementRate:P2}",
                    confidence = 0.8f,
                    data = new Dictionary<string, object>
                    {
                        {"platform", bestPlatform.platform},
                        {"engagement_rate", bestPlatform.engagementRate}
                    },
                    timestamp = DateTime.Now
                };
                
                socialInsights["best_platform"] = insight;
                OnInsightGenerated?.Invoke(insight);
            }
            
            // Viral content insights
            var viralContent = this.viralContent.Where(c => c.isViral).ToList();
            if (viralContent.Count > 0)
            {
                var insight = new SocialInsight
                {
                    id = System.Guid.NewGuid().ToString(),
                    type = "viral_content",
                    title = "Viral Content Analysis",
                    description = $"{viralContent.Count} pieces of content went viral with average engagement of {viralContent.Average(c => c.engagement):F0}",
                    confidence = 0.9f,
                    data = new Dictionary<string, object>
                    {
                        {"viral_count", viralContent.Count},
                        {"average_engagement", viralContent.Average(c => c.engagement)}
                    },
                    timestamp = DateTime.Now
                };
                
                socialInsights["viral_content"] = insight;
                OnInsightGenerated?.Invoke(insight);
            }
            
            // ROI insights
            var bestROI = socialROIs.OrderByDescending(r => r.roi).FirstOrDefault();
            if (bestROI != null && bestROI.roi > 0)
            {
                var insight = new SocialInsight
                {
                    id = System.Guid.NewGuid().ToString(),
                    type = "best_roi",
                    title = "Best ROI Platform",
                    description = $"{bestROI.platform} has the best ROI at {bestROI.roi:P2}",
                    confidence = 0.7f,
                    data = new Dictionary<string, object>
                    {
                        {"platform", bestROI.platform},
                        {"roi", bestROI.roi}
                    },
                    timestamp = DateTime.Now
                };
                
                socialInsights["best_roi"] = insight;
                OnInsightGenerated?.Invoke(insight);
            }
        }
        
        /// <summary>
        /// Generate predictions
        /// </summary>
        private void GeneratePredictions()
        {
            // Predict viral content
            var recentContent = viralContent.Where(c => c.timestamp > DateTime.Now.AddDays(-7)).ToList();
            if (recentContent.Count > 0)
            {
                var avgEngagement = recentContent.Average(c => c.engagement);
                var viralProbability = Mathf.Clamp01((float)avgEngagement / 1000f);
                
                var prediction = new SocialPrediction
                {
                    id = System.Guid.NewGuid().ToString(),
                    type = "viral_content",
                    description = $"Based on recent content, there's a {viralProbability:P0} chance of content going viral",
                    probability = viralProbability,
                    factors = new Dictionary<string, object>
                    {
                        {"average_engagement", avgEngagement},
                        {"content_count", recentContent.Count}
                    },
                    timestamp = DateTime.Now
                };
                
                socialPredictions["viral_content"] = prediction;
                OnPredictionGenerated?.Invoke(prediction);
            }
            
            // Predict platform performance
            foreach (var platform in socialManager.GetAvailablePlatforms())
            {
                var platformEvents = socialEvents.Where(e => e.platform == platform).ToList();
                if (platformEvents.Count > 0)
                {
                    var recentEvents = platformEvents.Where(e => e.timestamp > Time.time - 3600).ToList(); // Last hour
                    var engagementTrend = recentEvents.Count > 0 ? recentEvents.Average(e => e.engagement) : 0;
                    
                    var prediction = new SocialPrediction
                    {
                        id = System.Guid.NewGuid().ToString(),
                        type = "platform_performance",
                        description = $"{platform} is trending with {engagementTrend:F0} average engagement",
                        probability = Mathf.Clamp01((float)engagementTrend / 100f),
                        factors = new Dictionary<string, object>
                        {
                            {"platform", platform},
                            {"engagement_trend", engagementTrend}
                        },
                        timestamp = DateTime.Now
                    };
                    
                    socialPredictions[$"platform_{platform}"] = prediction;
                    OnPredictionGenerated?.Invoke(prediction);
                }
            }
        }
        
        /// <summary>
        /// Generate daily report
        /// </summary>
        private void GenerateDailyReport()
        {
            var today = DateTime.Today;
            var yesterday = today.AddDays(-1);
            
            var todayEvents = socialEvents.Where(e => DateTime.FromOADate(e.timestamp).Date == today).ToList();
            var yesterdayEvents = socialEvents.Where(e => DateTime.FromOADate(e.timestamp).Date == yesterday).ToList();
            
            var report = new SocialReport
            {
                id = System.Guid.NewGuid().ToString(),
                type = "daily",
                title = "Daily Social Media Report",
                data = new Dictionary<string, object>
                {
                    {"today_events", todayEvents.Count},
                    {"yesterday_events", yesterdayEvents.Count},
                    {"engagement_change", todayEvents.Count - yesterdayEvents.Count},
                    {"top_platform", GetTopPlatform(todayEvents)},
                    {"viral_content", viralContent.Count(c => c.isViral && c.timestamp.Date == today)},
                    {"total_roi", socialROIs.Where(r => r.timestamp.Date == today).Sum(r => r.roi)}
                },
                generatedAt = DateTime.Now,
                periodStart = today,
                periodEnd = today.AddDays(1)
            };
            
            OnReportGenerated?.Invoke(report);
        }
        
        /// <summary>
        /// Get top platform
        /// </summary>
        private string GetTopPlatform(List<SocialEvent> events)
        {
            if (events.Count == 0) return "None";
            
            var platformGroups = events.GroupBy(e => e.platform);
            var topPlatform = platformGroups.OrderByDescending(g => g.Sum(e => e.engagement)).FirstOrDefault();
            
            return topPlatform?.Key ?? "Unknown";
        }
        
        /// <summary>
        /// Clean up old data
        /// </summary>
        private void CleanupOldData()
        {
            var cutoffTime = Time.time - (dataRetentionDays * 24 * 3600);
            
            // Remove old events
            socialEvents.RemoveAll(e => e.timestamp < cutoffTime);
            
            // Remove old engagement metrics
            engagementMetrics.RemoveAll(m => m.timestamp < DateTime.Now.AddDays(-dataRetentionDays));
            
            // Remove old viral content
            viralContent.RemoveAll(c => c.timestamp < DateTime.Now.AddDays(-dataRetentionDays));
            
            // Remove old ROI data
            socialROIs.RemoveAll(r => r.timestamp < DateTime.Now.AddDays(-dataRetentionDays));
        }
        
        /// <summary>
        /// On post shared
        /// </summary>
        private void OnPostShared(string platform, SocialPost post)
        {
            TrackSocialEvent("content_shared", platform, post.id, post.likes + post.shares + post.comments);
        }
        
        /// <summary>
        /// On viral achievement
        /// </summary>
        private void OnViralAchievement(string platform, int engagement)
        {
            TrackSocialEvent("viral_achievement", platform, "", engagement);
        }
        
        /// <summary>
        /// On analytics updated
        /// </summary>
        private void OnAnalyticsUpdated(SocialAnalytics analytics)
        {
            // Update viral content
            foreach (var post in analytics.topPosts)
            {
                var viralContent = new ViralContent
                {
                    id = post.id,
                    platform = post.platform,
                    content = post.content,
                    engagement = post.likes + post.shares + post.comments,
                    isViral = post.isViral,
                    viralScore = post.isViral ? 1f : 0f,
                    timestamp = post.timestamp,
                    metadata = new Dictionary<string, object>()
                };
                
                this.viralContent.Add(viralContent);
            }
        }
        
        /// <summary>
        /// On viral content generated
        /// </summary>
        private void OnViralContentGenerated(ViralContent content)
        {
            viralContent.Add(content);
        }
        
        /// <summary>
        /// On viral reward earned
        /// </summary>
        private void OnViralRewardEarned(ViralReward reward)
        {
            TrackSocialEvent("viral_reward_earned", "all", reward.id, reward.coins + reward.gems);
        }
        
        /// <summary>
        /// Get social insights
        /// </summary>
        public Dictionary<string, SocialInsight> GetSocialInsights()
        {
            return new Dictionary<string, SocialInsight>(socialInsights);
        }
        
        /// <summary>
        /// Get social predictions
        /// </summary>
        public Dictionary<string, SocialPrediction> GetSocialPredictions()
        {
            return new Dictionary<string, SocialPrediction>(socialPredictions);
        }
        
        /// <summary>
        /// Get engagement metrics
        /// </summary>
        public List<EngagementMetric> GetEngagementMetrics()
        {
            return new List<EngagementMetric>(engagementMetrics);
        }
        
        /// <summary>
        /// Get social ROI data
        /// </summary>
        public List<SocialROI> GetSocialROI()
        {
            return new List<SocialROI>(socialROIs);
        }
        
        /// <summary>
        /// Get viral content
        /// </summary>
        public List<ViralContent> GetViralContent()
        {
            return new List<ViralContent>(viralContent);
        }
        
        /// <summary>
        /// Get social statistics
        /// </summary>
        public Dictionary<string, object> GetSocialStatistics()
        {
            return new Dictionary<string, object>
            {
                {"total_events", socialEvents.Count},
                {"total_engagement", socialEvents.Sum(e => e.engagement)},
                {"viral_content_count", viralContent.Count(c => c.isViral)},
                {"total_roi", socialROIs.Sum(r => r.roi)},
                {"insights_count", socialInsights.Count},
                {"predictions_count", socialPredictions.Count}
            };
        }
    }
}