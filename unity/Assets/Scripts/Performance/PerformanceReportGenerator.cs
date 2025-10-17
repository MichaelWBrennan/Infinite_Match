using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.IO;
using System.Text;
using Evergreen.Performance;

namespace Evergreen.Performance
{
    /// <summary>
    /// PERFORMANCE REPORT GENERATOR - Generates comprehensive performance reports
    /// </summary>
    public class PerformanceReportGenerator : MonoBehaviour
    {
        [Header("Report Settings")]
        [SerializeField] private bool enableAutoReports = true;
        [SerializeField] private float reportInterval = 300f; // 5 minutes
        [SerializeField] private bool enableDetailedReports = true;
        [SerializeField] private bool enableCSVExport = true;
        [SerializeField] private bool enableJSONExport = true;
        
        [Header("Report Paths")]
        [SerializeField] private string reportDirectory = "PerformanceReports";
        [SerializeField] private string csvFileName = "performance_metrics.csv";
        [SerializeField] private string jsonFileName = "performance_metrics.json";
        [SerializeField] private string htmlFileName = "performance_dashboard.html";
        
        // System References
        private UltimatePerformanceMaximizer _performanceMaximizer;
        private EngagementOptimizer _engagementOptimizer;
        private RetentionOptimizer _retentionOptimizer;
        private MonetizationOptimizer _monetizationOptimizer;
        private ContentOptimizer _contentOptimizer;
        private SatisfactionOptimizer _satisfactionOptimizer;
        
        // Report Data
        private List<PerformanceReport> _reports = new List<PerformanceReport>();
        private PerformanceReport _currentReport;
        
        // Events
        public static event Action<PerformanceReport> OnReportGenerated;
        public static event Action<string> OnReportExported;
        
        void Start()
        {
            InitializeReportGenerator();
            if (enableAutoReports)
            {
                StartCoroutine(AutoReportLoop());
            }
        }
        
        private void InitializeReportGenerator()
        {
            // Get system references
            _performanceMaximizer = FindObjectOfType<UltimatePerformanceMaximizer>();
            _engagementOptimizer = FindObjectOfType<EngagementOptimizer>();
            _retentionOptimizer = FindObjectOfType<RetentionOptimizer>();
            _monetizationOptimizer = FindObjectOfType<MonetizationOptimizer>();
            _contentOptimizer = FindObjectOfType<ContentOptimizer>();
            _satisfactionOptimizer = FindObjectOfType<SatisfactionOptimizer>();
            
            // Create report directory
            CreateReportDirectory();
            
            // Initialize current report
            _currentReport = new PerformanceReport();
        }
        
        private void CreateReportDirectory()
        {
            string fullPath = Path.Combine(Application.persistentDataPath, reportDirectory);
            if (!Directory.Exists(fullPath))
            {
                Directory.CreateDirectory(fullPath);
            }
        }
        
        private IEnumerator AutoReportLoop()
        {
            while (enableAutoReports)
            {
                GenerateReport();
                yield return new WaitForSeconds(reportInterval);
            }
        }
        
        public void GenerateReport()
        {
            // Create new report
            var report = new PerformanceReport
            {
                timestamp = DateTime.Now,
                reportId = Guid.NewGuid().ToString()
            };
            
            // Collect performance data
            CollectPerformanceData(report);
            
            // Calculate performance scores
            CalculatePerformanceScores(report);
            
            // Generate insights
            GenerateInsights(report);
            
            // Add to reports list
            _reports.Add(report);
            _currentReport = report;
            
            // Export reports
            if (enableCSVExport)
            {
                ExportToCSV(report);
            }
            
            if (enableJSONExport)
            {
                ExportToJSON(report);
            }
            
            if (enableDetailedReports)
            {
                ExportToHTML(report);
            }
            
            // Trigger events
            OnReportGenerated?.Invoke(report);
            
            Debug.Log($"[PerformanceReportGenerator] Report generated: {report.reportId}");
        }
        
        private void CollectPerformanceData(PerformanceReport report)
        {
            // Collect engagement data
            if (_engagementOptimizer != null)
            {
                report.engagementScore = _engagementOptimizer.GetEngagementScore();
                report.engagementTarget = _engagementOptimizer.GetTargetScore();
                report.engagementAchieved = _engagementOptimizer.IsTargetAchieved();
            }
            
            // Collect retention data
            if (_retentionOptimizer != null)
            {
                report.day1Retention = _retentionOptimizer.GetDay1Retention();
                report.day7Retention = _retentionOptimizer.GetDay7Retention();
                report.day30Retention = _retentionOptimizer.GetDay30Retention();
                report.retentionAchieved = _retentionOptimizer.AreAllTargetsAchieved();
            }
            
            // Collect monetization data
            if (_monetizationOptimizer != null)
            {
                report.arpu = _monetizationOptimizer.GetCurrentARPU();
                report.conversionRate = _monetizationOptimizer.GetConversionRate();
                report.averageSpend = _monetizationOptimizer.GetAverageSpend();
                report.arpuAchieved = _monetizationOptimizer.IsTargetAchieved();
            }
            
            // Collect content data
            if (_contentOptimizer != null)
            {
                report.contentEfficiency = _contentOptimizer.GetContentEfficiency();
                report.aiContentRatio = _contentOptimizer.GetAIContentRatio();
                report.contentQuality = _contentOptimizer.GetContentQuality();
                report.contentAchieved = _contentOptimizer.IsTargetAchieved();
            }
            
            // Collect satisfaction data
            if (_satisfactionOptimizer != null)
            {
                report.satisfaction = _satisfactionOptimizer.GetCurrentSatisfaction();
                report.averageRating = _satisfactionOptimizer.GetAverageRating();
                report.feedbackScore = _satisfactionOptimizer.GetFeedbackScore();
                report.satisfactionAchieved = _satisfactionOptimizer.IsTargetAchieved();
            }
            
            // Collect overall performance data
            if (_performanceMaximizer != null)
            {
                var metrics = _performanceMaximizer.GetCurrentMetrics();
                report.overallPerformance = metrics.overallPerformance;
                report.optimizationScores = _performanceMaximizer.GetOptimizationScores();
            }
        }
        
        private void CalculatePerformanceScores(PerformanceReport report)
        {
            // Calculate overall performance score
            report.overallScore = CalculateOverallScore(report);
            
            // Calculate individual category scores
            report.engagementScore = CalculateEngagementScore(report);
            report.retentionScore = CalculateRetentionScore(report);
            report.monetizationScore = CalculateMonetizationScore(report);
            report.contentScore = CalculateContentScore(report);
            report.satisfactionScore = CalculateSatisfactionScore(report);
            
            // Calculate target achievement percentage
            report.targetAchievementPercentage = CalculateTargetAchievementPercentage(report);
        }
        
        private float CalculateOverallScore(PerformanceReport report)
        {
            return (report.engagementScore * 0.2f +
                   report.retentionScore * 0.2f +
                   report.monetizationScore * 0.2f +
                   report.contentScore * 0.2f +
                   report.satisfactionScore * 0.2f);
        }
        
        private float CalculateEngagementScore(PerformanceReport report)
        {
            if (report.engagementTarget > 0)
            {
                return Mathf.Clamp01(report.engagementScore / report.engagementTarget) * 100f;
            }
            return 0f;
        }
        
        private float CalculateRetentionScore(PerformanceReport report)
        {
            float avgRetention = (report.day1Retention + report.day7Retention + report.day30Retention) / 3f;
            return Mathf.Clamp01(avgRetention / 100f) * 100f;
        }
        
        private float CalculateMonetizationScore(PerformanceReport report)
        {
            if (report.arpu > 0)
            {
                return Mathf.Clamp01(report.arpu / 2.50f) * 100f; // Target: $2.50
            }
            return 0f;
        }
        
        private float CalculateContentScore(PerformanceReport report)
        {
            return Mathf.Clamp01(report.contentEfficiency / 100f) * 100f;
        }
        
        private float CalculateSatisfactionScore(PerformanceReport report)
        {
            if (report.satisfaction > 0)
            {
                return Mathf.Clamp01(report.satisfaction / 4.8f) * 100f; // Target: 4.8/5
            }
            return 0f;
        }
        
        private float CalculateTargetAchievementPercentage(PerformanceReport report)
        {
            int achievedTargets = 0;
            int totalTargets = 5;
            
            if (report.engagementAchieved) achievedTargets++;
            if (report.retentionAchieved) achievedTargets++;
            if (report.arpuAchieved) achievedTargets++;
            if (report.contentAchieved) achievedTargets++;
            if (report.satisfactionAchieved) achievedTargets++;
            
            return (float)achievedTargets / totalTargets * 100f;
        }
        
        private void GenerateInsights(PerformanceReport report)
        {
            report.insights = new List<string>();
            
            // Engagement insights
            if (report.engagementScore >= report.engagementTarget)
            {
                report.insights.Add("✅ Engagement target achieved - players are highly engaged");
            }
            else
            {
                report.insights.Add($"⚠️ Engagement below target - need to improve player engagement (Current: {report.engagementScore:F1}%, Target: {report.engagementTarget:F1}%)");
            }
            
            // Retention insights
            if (report.retentionAchieved)
            {
                report.insights.Add("✅ Retention targets achieved - players are staying engaged");
            }
            else
            {
                report.insights.Add($"⚠️ Retention below target - need to improve player retention (D1: {report.day1Retention:F1}%, D7: {report.day7Retention:F1}%, D30: {report.day30Retention:F1}%)");
            }
            
            // Monetization insights
            if (report.arpuAchieved)
            {
                report.insights.Add("✅ ARPU target achieved - monetization is performing well");
            }
            else
            {
                report.insights.Add($"⚠️ ARPU below target - need to improve monetization (Current: ${report.arpu:F2}, Target: $2.50)");
            }
            
            // Content insights
            if (report.contentAchieved)
            {
                report.insights.Add("✅ Content efficiency target achieved - AI content generation is working well");
            }
            else
            {
                report.insights.Add($"⚠️ Content efficiency below target - need to improve content creation (Current: {report.contentEfficiency:F1}%, Target: 90%)");
            }
            
            // Satisfaction insights
            if (report.satisfactionAchieved)
            {
                report.insights.Add("✅ Satisfaction target achieved - players are highly satisfied");
            }
            else
            {
                report.insights.Add($"⚠️ Satisfaction below target - need to improve player satisfaction (Current: {report.satisfaction:F1}/5, Target: 4.8/5)");
            }
            
            // Overall insights
            if (report.targetAchievementPercentage >= 100f)
            {
                report.insights.Add("🎉 ALL TARGETS ACHIEVED! 100% Performance Reached!");
            }
            else
            {
                report.insights.Add($"📊 Overall progress: {report.targetAchievementPercentage:F1}% of targets achieved");
            }
        }
        
        private void ExportToCSV(PerformanceReport report)
        {
            try
            {
                string filePath = Path.Combine(Application.persistentDataPath, reportDirectory, csvFileName);
                bool fileExists = File.Exists(filePath);
                
                using (StreamWriter writer = new StreamWriter(filePath, true))
                {
                    if (!fileExists)
                    {
                        // Write header
                        writer.WriteLine("Timestamp,ReportID,EngagementScore,EngagementTarget,EngagementAchieved," +
                                      "Day1Retention,Day7Retention,Day30Retention,RetentionAchieved," +
                                      "ARPU,ConversionRate,AverageSpend,ARPUAchieved," +
                                      "ContentEfficiency,AIContentRatio,ContentQuality,ContentAchieved," +
                                      "Satisfaction,AverageRating,FeedbackScore,SatisfactionAchieved," +
                                      "OverallPerformance,OverallScore,TargetAchievementPercentage");
                    }
                    
                    // Write data
                    writer.WriteLine($"{report.timestamp:yyyy-MM-dd HH:mm:ss},{report.reportId}," +
                                   $"{report.engagementScore:F2},{report.engagementTarget:F2},{report.engagementAchieved}," +
                                   $"{report.day1Retention:F2},{report.day7Retention:F2},{report.day30Retention:F2},{report.retentionAchieved}," +
                                   $"{report.arpu:F2},{report.conversionRate:F2},{report.averageSpend:F2},{report.arpuAchieved}," +
                                   $"{report.contentEfficiency:F2},{report.aiContentRatio:F2},{report.contentQuality:F2},{report.contentAchieved}," +
                                   $"{report.satisfaction:F2},{report.averageRating:F2},{report.feedbackScore:F2},{report.satisfactionAchieved}," +
                                   $"{report.overallPerformance:F2},{report.overallScore:F2},{report.targetAchievementPercentage:F2}");
                }
                
                OnReportExported?.Invoke($"CSV report exported to: {filePath}");
            }
            catch (Exception e)
            {
                Debug.LogError($"[PerformanceReportGenerator] Error exporting CSV: {e.Message}");
            }
        }
        
        private void ExportToJSON(PerformanceReport report)
        {
            try
            {
                string filePath = Path.Combine(Application.persistentDataPath, reportDirectory, jsonFileName);
                string json = JsonUtility.ToJson(report, true);
                File.WriteAllText(filePath, json);
                
                OnReportExported?.Invoke($"JSON report exported to: {filePath}");
            }
            catch (Exception e)
            {
                Debug.LogError($"[PerformanceReportGenerator] Error exporting JSON: {e.Message}");
            }
        }
        
        private void ExportToHTML(PerformanceReport report)
        {
            try
            {
                string filePath = Path.Combine(Application.persistentDataPath, reportDirectory, htmlFileName);
                string html = GenerateHTMLReport(report);
                File.WriteAllText(filePath, html);
                
                OnReportExported?.Invoke($"HTML report exported to: {filePath}");
            }
            catch (Exception e)
            {
                Debug.LogError($"[PerformanceReportGenerator] Error exporting HTML: {e.Message}");
            }
        }
        
        private string GenerateHTMLReport(PerformanceReport report)
        {
            StringBuilder html = new StringBuilder();
            
            html.AppendLine("<!DOCTYPE html>");
            html.AppendLine("<html><head>");
            html.AppendLine("<title>Performance Dashboard</title>");
            html.AppendLine("<style>");
            html.AppendLine("body { font-family: Arial, sans-serif; margin: 20px; }");
            html.AppendLine(".metric { margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }");
            html.AppendLine(".achieved { background-color: #d4edda; border-color: #c3e6cb; }");
            html.AppendLine(".not-achieved { background-color: #f8d7da; border-color: #f5c6cb; }");
            html.AppendLine(".progress-bar { width: 100%; height: 20px; background-color: #f0f0f0; border-radius: 10px; overflow: hidden; }");
            html.AppendLine(".progress-fill { height: 100%; background-color: #007bff; transition: width 0.3s ease; }");
            html.AppendLine("</style>");
            html.AppendLine("</head><body>");
            
            html.AppendLine("<h1>Performance Dashboard</h1>");
            html.AppendLine($"<p>Generated: {report.timestamp:yyyy-MM-dd HH:mm:ss}</p>");
            html.AppendLine($"<p>Report ID: {report.reportId}</p>");
            
            // Overall Performance
            html.AppendLine("<div class='metric'>");
            html.AppendLine("<h2>Overall Performance</h2>");
            html.AppendLine($"<p>Score: {report.overallScore:F1}%</p>");
            html.AppendLine($"<p>Target Achievement: {report.targetAchievementPercentage:F1}%</p>");
            html.AppendLine($"<div class='progress-bar'><div class='progress-fill' style='width: {report.overallScore}%'></div></div>");
            html.AppendLine("</div>");
            
            // Individual Metrics
            html.AppendLine("<div class='metric'>");
            html.AppendLine("<h2>Engagement</h2>");
            html.AppendLine($"<p>Score: {report.engagementScore:F1}% (Target: {report.engagementTarget:F1}%)</p>");
            html.AppendLine($"<p>Status: {(report.engagementAchieved ? "✅ Achieved" : "❌ Not Achieved")}</p>");
            html.AppendLine("</div>");
            
            html.AppendLine("<div class='metric'>");
            html.AppendLine("<h2>Retention</h2>");
            html.AppendLine($"<p>Day 1: {report.day1Retention:F1}%</p>");
            html.AppendLine($"<p>Day 7: {report.day7Retention:F1}%</p>");
            html.AppendLine($"<p>Day 30: {report.day30Retention:F1}%</p>");
            html.AppendLine($"<p>Status: {(report.retentionAchieved ? "✅ Achieved" : "❌ Not Achieved")}</p>");
            html.AppendLine("</div>");
            
            html.AppendLine("<div class='metric'>");
            html.AppendLine("<h2>Monetization</h2>");
            html.AppendLine($"<p>ARPU: ${report.arpu:F2} (Target: $2.50)</p>");
            html.AppendLine($"<p>Conversion Rate: {report.conversionRate:F2}%</p>");
            html.AppendLine($"<p>Average Spend: ${report.averageSpend:F2}</p>");
            html.AppendLine($"<p>Status: {(report.arpuAchieved ? "✅ Achieved" : "❌ Not Achieved")}</p>");
            html.AppendLine("</div>");
            
            html.AppendLine("<div class='metric'>");
            html.AppendLine("<h2>Content Creation</h2>");
            html.AppendLine($"<p>Efficiency: {report.contentEfficiency:F1}% (Target: 90%)</p>");
            html.AppendLine($"<p>AI Content Ratio: {report.aiContentRatio:F1}%</p>");
            html.AppendLine($"<p>Content Quality: {report.contentQuality:F1}%</p>");
            html.AppendLine($"<p>Status: {(report.contentAchieved ? "✅ Achieved" : "❌ Not Achieved")}</p>");
            html.AppendLine("</div>");
            
            html.AppendLine("<div class='metric'>");
            html.AppendLine("<h2>Satisfaction</h2>");
            html.AppendLine($"<p>Score: {report.satisfaction:F1}/5 (Target: 4.8/5)</p>");
            html.AppendLine($"<p>Average Rating: {report.averageRating:F1}/5</p>");
            html.AppendLine($"<p>Feedback Score: {report.feedbackScore:F1}/5</p>");
            html.AppendLine($"<p>Status: {(report.satisfactionAchieved ? "✅ Achieved" : "❌ Not Achieved")}</p>");
            html.AppendLine("</div>");
            
            // Insights
            html.AppendLine("<div class='metric'>");
            html.AppendLine("<h2>Insights</h2>");
            html.AppendLine("<ul>");
            foreach (var insight in report.insights)
            {
                html.AppendLine($"<li>{insight}</li>");
            }
            html.AppendLine("</ul>");
            html.AppendLine("</div>");
            
            html.AppendLine("</body></html>");
            
            return html.ToString();
        }
        
        // Public API
        public void GenerateReportNow() => GenerateReport();
        public List<PerformanceReport> GetReports() => _reports;
        public PerformanceReport GetCurrentReport() => _currentReport;
    }
    
    [System.Serializable]
    public class PerformanceReport
    {
        public string reportId;
        public DateTime timestamp;
        
        // Engagement
        public float engagementScore;
        public float engagementTarget;
        public bool engagementAchieved;
        
        // Retention
        public float day1Retention;
        public float day7Retention;
        public float day30Retention;
        public bool retentionAchieved;
        
        // Monetization
        public float arpu;
        public float conversionRate;
        public float averageSpend;
        public bool arpuAchieved;
        
        // Content
        public float contentEfficiency;
        public float aiContentRatio;
        public float contentQuality;
        public bool contentAchieved;
        
        // Satisfaction
        public float satisfaction;
        public float averageRating;
        public float feedbackScore;
        public bool satisfactionAchieved;
        
        // Overall
        public float overallPerformance;
        public float overallScore;
        public float targetAchievementPercentage;
        public Dictionary<string, float> optimizationScores;
        
        // Insights
        public List<string> insights;
    }
}