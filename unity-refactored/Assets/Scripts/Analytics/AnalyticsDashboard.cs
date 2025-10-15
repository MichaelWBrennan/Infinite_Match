using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Evergreen.Analytics
{
    [System.Serializable]
    public class AnalyticsEvent
    {
        public string eventId;
        public string eventName;
        public string category;
        public Dictionary<string, object> parameters = new Dictionary<string, object>();
        public DateTime timestamp;
        public string sessionId;
        public string playerId;
        public string platform;
        public string version;
        public int priority;
        public bool isProcessed;
    }
    
    [System.Serializable]
    public class AnalyticsMetric
    {
        public string metricId;
        public string metricName;
        public MetricType metricType;
        public float value;
        public string unit;
        public DateTime timestamp;
        public Dictionary<string, object> metadata = new Dictionary<string, object>();
    }
    
    public enum MetricType
    {
        Counter,
        Gauge,
        Histogram,
        Timer,
        Custom
    }
    
    [System.Serializable]
    public class AnalyticsReport
    {
        public string reportId;
        public string reportName;
        public ReportType reportType;
        public DateTime startDate;
        public DateTime endDate;
        public Dictionary<string, object> data = new Dictionary<string, object>();
        public List<AnalyticsChart> charts = new List<AnalyticsChart>();
        public bool isGenerated;
        public DateTime generatedAt;
    }
    
    public enum ReportType
    {
        RealTime,
        Daily,
        Weekly,
        Monthly,
        Custom
    }
    
    [System.Serializable]
    public class AnalyticsChart
    {
        public string chartId;
        public string chartName;
        public ChartType chartType;
        public List<ChartDataPoint> dataPoints = new List<ChartDataPoint>();
        public string xAxisLabel;
        public string yAxisLabel;
        public Dictionary<string, object> options = new Dictionary<string, object>();
    }
    
    public enum ChartType
    {
        Line,
        Bar,
        Pie,
        Area,
        Scatter,
        Heatmap,
        Custom
    }
    
    [System.Serializable]
    public class ChartDataPoint
    {
        public string label;
        public float value;
        public DateTime timestamp;
        public Dictionary<string, object> metadata = new Dictionary<string, object>();
    }
    
    [System.Serializable]
    public class AnalyticsFilter
    {
        public string filterId;
        public string filterName;
        public FilterType filterType;
        public string fieldName;
        public object filterValue;
        public FilterOperator filterOperator;
        public bool isEnabled;
    }
    
    public enum FilterType
    {
        String,
        Number,
        Date,
        Boolean,
        Array,
        Custom
    }
    
    public enum FilterOperator
    {
        Equals,
        NotEquals,
        GreaterThan,
        LessThan,
        GreaterThanOrEqual,
        LessThanOrEqual,
        Contains,
        NotContains,
        StartsWith,
        EndsWith,
        In,
        NotIn
    }
    
    [System.Serializable]
    public class AnalyticsAlert
    {
        public string alertId;
        public string alertName;
        public string metricName;
        public AlertCondition condition;
        public float threshold;
        public bool isActive;
        public bool isTriggered;
        public DateTime lastTriggered;
        public int triggerCount;
        public string message;
    }
    
    public enum AlertCondition
    {
        Above,
        Below,
        Equal,
        NotEqual,
        Change,
        NoChange
    }
    
    [System.Serializable]
    public class AnalyticsDashboard
    {
        public string dashboardId;
        public string dashboardName;
        public List<string> widgetIds = new List<string>();
        public Dictionary<string, object> layout = new Dictionary<string, object>();
        public bool isPublic;
        public DateTime created;
        public DateTime lastModified;
    }
    
    [System.Serializable]
    public class AnalyticsWidget
    {
        public string widgetId;
        public string widgetName;
        public WidgetType widgetType;
        public string metricName;
        public Dictionary<string, object> configuration = new Dictionary<string, object>();
        public Vector2 position;
        public Vector2 size;
        public bool isVisible;
        public DateTime lastUpdated;
    }
    
    public enum WidgetType
    {
        Metric,
        Chart,
        Table,
        List,
        Gauge,
        Progress,
        Text,
        Custom
    }
    
    public class AnalyticsDashboardManager : MonoBehaviour
    {
        [Header("Analytics Settings")]
        public bool enableAnalytics = true;
        public bool enableRealTimeAnalytics = true;
        public bool enableBatchAnalytics = true;
        public bool enableDataExport = true;
        public bool enableAlerts = true;
        public bool enableDashboards = true;
        
        [Header("Data Collection Settings")]
        public float collectionInterval = 1f;
        public int maxEventsPerBatch = 1000;
        public int maxMetricsHistory = 10000;
        public bool enableEventBatching = true;
        public bool enableDataCompression = true;
        
        [Header("Reporting Settings")]
        public bool enableAutoReports = true;
        public float reportGenerationInterval = 3600f; // 1 hour
        public int maxReports = 100;
        public bool enableReportScheduling = true;
        
        [Header("Alert Settings")]
        public bool enableRealTimeAlerts = true;
        public float alertCheckInterval = 30f;
        public int maxAlerts = 50;
        public bool enableAlertNotifications = true;
        
        [Header("Dashboard Settings")]
        public bool enableCustomDashboards = true;
        public bool enableDashboardSharing = true;
        public int maxDashboards = 20;
        public bool enableDashboardTemplates = true;
        
        public static AnalyticsDashboardManager Instance { get; private set; }
        
        private List<AnalyticsEvent> analyticsEvents = new List<AnalyticsEvent>();
        private List<AnalyticsMetric> analyticsMetrics = new List<AnalyticsMetric>();
        private List<AnalyticsReport> analyticsReports = new List<AnalyticsReport>();
        private List<AnalyticsFilter> analyticsFilters = new List<AnalyticsFilter>();
        private List<AnalyticsAlert> analyticsAlerts = new List<AnalyticsAlert>();
        private List<AnalyticsDashboard> analyticsDashboards = new List<AnalyticsDashboard>();
        private List<AnalyticsWidget> analyticsWidgets = new List<AnalyticsWidget>();
        
        private Dictionary<string, object> globalMetrics = new Dictionary<string, object>();
        private Dictionary<string, List<AnalyticsEvent>> eventHistory = new Dictionary<string, List<AnalyticsEvent>>();
        private Dictionary<string, List<AnalyticsMetric>> metricHistory = new Dictionary<string, List<AnalyticsMetric>>();
        
        private Coroutine collectionCoroutine;
        private Coroutine reportCoroutine;
        private Coroutine alertCoroutine;
        private Coroutine dashboardCoroutine;
        
        // Analytics Components
        private AnalyticsCollector analyticsCollector;
        private AnalyticsProcessor analyticsProcessor;
        private AnalyticsReporter analyticsReporter;
        private AnalyticsAlertManager alertManager;
        private AnalyticsDashboardRenderer dashboardRenderer;
        private AnalyticsExporter analyticsExporter;
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeAnalyticsDashboard();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            InitializeComponents();
            LoadAnalyticsData();
            StartAnalyticsServices();
        }
        
        private void InitializeAnalyticsDashboard()
        {
            // Initialize analytics components
            analyticsCollector = gameObject.AddComponent<AnalyticsCollector>();
            analyticsProcessor = gameObject.AddComponent<AnalyticsProcessor>();
            analyticsReporter = gameObject.AddComponent<AnalyticsReporter>();
            alertManager = gameObject.AddComponent<AnalyticsAlertManager>();
            dashboardRenderer = gameObject.AddComponent<AnalyticsDashboardRenderer>();
            analyticsExporter = gameObject.AddComponent<AnalyticsExporter>();
        }
        
        private void InitializeComponents()
        {
            if (analyticsCollector != null)
            {
                analyticsCollector.Initialize(collectionInterval, maxEventsPerBatch, enableEventBatching);
            }
            
            if (analyticsProcessor != null)
            {
                analyticsProcessor.Initialize(enableDataCompression, maxMetricsHistory);
            }
            
            if (analyticsReporter != null)
            {
                analyticsReporter.Initialize(reportGenerationInterval, maxReports, enableReportScheduling);
            }
            
            if (alertManager != null)
            {
                alertManager.Initialize(alertCheckInterval, maxAlerts, enableRealTimeAlerts);
            }
            
            if (dashboardRenderer != null)
            {
                dashboardRenderer.Initialize(enableCustomDashboards, enableDashboardSharing);
            }
            
            if (analyticsExporter != null)
            {
                analyticsExporter.Initialize(enableDataExport);
            }
        }
        
        private void LoadAnalyticsData()
        {
            // Load analytics data from save system
            LoadAnalyticsEvents();
            LoadAnalyticsMetrics();
            LoadAnalyticsReports();
            LoadAnalyticsFilters();
            LoadAnalyticsAlerts();
            LoadAnalyticsDashboards();
            LoadAnalyticsWidgets();
        }
        
        private void LoadAnalyticsEvents()
        {
            // Load analytics events from save data
        }
        
        private void LoadAnalyticsMetrics()
        {
            // Load analytics metrics from save data
        }
        
        private void LoadAnalyticsReports()
        {
            // Load analytics reports from save data
        }
        
        private void LoadAnalyticsFilters()
        {
            // Load analytics filters from save data
        }
        
        private void LoadAnalyticsAlerts()
        {
            // Load analytics alerts from save data
        }
        
        private void LoadAnalyticsDashboards()
        {
            // Load analytics dashboards from save data
        }
        
        private void LoadAnalyticsWidgets()
        {
            // Load analytics widgets from save data
        }
        
        private void StartAnalyticsServices()
        {
            if (enableAnalytics)
            {
                collectionCoroutine = StartCoroutine(DataCollectionLoop());
            }
            
            if (enableAutoReports)
            {
                reportCoroutine = StartCoroutine(ReportGenerationLoop());
            }
            
            if (enableAlerts)
            {
                alertCoroutine = StartCoroutine(AlertCheckLoop());
            }
            
            if (enableDashboards)
            {
                dashboardCoroutine = StartCoroutine(DashboardUpdateLoop());
            }
        }
        
        private IEnumerator DataCollectionLoop()
        {
            while (enableAnalytics)
            {
                CollectAnalyticsData();
                yield return new WaitForSeconds(collectionInterval);
            }
        }
        
        private IEnumerator ReportGenerationLoop()
        {
            while (enableAutoReports)
            {
                GenerateScheduledReports();
                yield return new WaitForSeconds(reportGenerationInterval);
            }
        }
        
        private IEnumerator AlertCheckLoop()
        {
            while (enableAlerts)
            {
                CheckAlerts();
                yield return new WaitForSeconds(alertCheckInterval);
            }
        }
        
        private IEnumerator DashboardUpdateLoop()
        {
            while (enableDashboards)
            {
                UpdateDashboards();
                yield return new WaitForSeconds(1f);
            }
        }
        
        // Data Collection
        private void CollectAnalyticsData()
        {
            // Collect system metrics
            CollectSystemMetrics();
            
            // Collect game metrics
            CollectGameMetrics();
            
            // Collect user metrics
            CollectUserMetrics();
            
            // Process collected data
            if (analyticsProcessor != null)
            {
                analyticsProcessor.ProcessData(analyticsEvents, analyticsMetrics);
            }
        }
        
        private void CollectSystemMetrics()
        {
            // Collect system performance metrics
            var fps = 1f / Time.deltaTime;
            var memoryUsage = GC.GetTotalMemory(false) / 1024f / 1024f; // MB
            var cpuUsage = Time.deltaTime * 1000f; // Simplified CPU usage
            
            // Record metrics
            RecordMetric("fps", fps, "fps");
            RecordMetric("memory_usage", memoryUsage, "MB");
            RecordMetric("cpu_usage", cpuUsage, "ms");
        }
        
        private void CollectGameMetrics()
        {
            // Collect game-specific metrics
            var gameState = Evergreen.Core.GameIntegrationManager.Instance?.GetGameState();
            if (gameState != null)
            {
                RecordMetric("current_level", gameState.currentLevel, "level");
                RecordMetric("score", gameState.score, "points");
                RecordMetric("coins", gameState.coins, "coins");
                RecordMetric("gems", gameState.gems, "gems");
                RecordMetric("energy", gameState.energy, "energy");
            }
        }
        
        private void CollectUserMetrics()
        {
            // Collect user behavior metrics
            var sessionDuration = (DateTime.Now - Application.installTime).TotalSeconds;
            RecordMetric("session_duration", (float)sessionDuration, "seconds");
        }
        
        // Event Tracking
        public void TrackEvent(string eventName, string category, Dictionary<string, object> parameters = null, int priority = 0)
        {
            if (!enableAnalytics) return;
            
            var analyticsEvent = new AnalyticsEvent
            {
                eventId = Guid.NewGuid().ToString(),
                eventName = eventName,
                category = category,
                parameters = parameters ?? new Dictionary<string, object>(),
                timestamp = DateTime.Now,
                sessionId = GetSessionId(),
                playerId = GetPlayerId(),
                platform = Application.platform.ToString(),
                version = Application.version,
                priority = priority,
                isProcessed = false
            };
            
            analyticsEvents.Add(analyticsEvent);
            
            // Add to event history
            if (!eventHistory.ContainsKey(category))
            {
                eventHistory[category] = new List<AnalyticsEvent>();
            }
            eventHistory[category].Add(analyticsEvent);
            
            // Process event
            if (analyticsProcessor != null)
            {
                analyticsProcessor.ProcessEvent(analyticsEvent);
            }
        }
        
        public void RecordMetric(string metricName, float value, string unit = "", Dictionary<string, object> metadata = null)
        {
            if (!enableAnalytics) return;
            
            var analyticsMetric = new AnalyticsMetric
            {
                metricId = Guid.NewGuid().ToString(),
                metricName = metricName,
                metricType = MetricType.Gauge,
                value = value,
                unit = unit,
                timestamp = DateTime.Now,
                metadata = metadata ?? new Dictionary<string, object>()
            };
            
            analyticsMetrics.Add(analyticsMetric);
            
            // Add to metric history
            if (!metricHistory.ContainsKey(metricName))
            {
                metricHistory[metricName] = new List<AnalyticsMetric>();
            }
            metricHistory[metricName].Add(analyticsMetric);
            
            // Update global metrics
            globalMetrics[metricName] = value;
            
            // Process metric
            if (analyticsProcessor != null)
            {
                analyticsProcessor.ProcessMetric(analyticsMetric);
            }
        }
        
        // Report Generation
        public AnalyticsReport GenerateReport(string reportName, ReportType reportType, DateTime startDate, DateTime endDate)
        {
            var report = new AnalyticsReport
            {
                reportId = Guid.NewGuid().ToString(),
                reportName = reportName,
                reportType = reportType,
                startDate = startDate,
                endDate = endDate,
                isGenerated = false,
                generatedAt = DateTime.Now
            };
            
            // Generate report data
            GenerateReportData(report);
            
            // Generate charts
            GenerateReportCharts(report);
            
            report.isGenerated = true;
            analyticsReports.Add(report);
            
            return report;
        }
        
        private void GenerateReportData(AnalyticsReport report)
        {
            // Filter events by date range
            var filteredEvents = analyticsEvents.Where(e => e.timestamp >= report.startDate && e.timestamp <= report.endDate).ToList();
            var filteredMetrics = analyticsMetrics.Where(m => m.timestamp >= report.startDate && m.timestamp <= report.endDate).ToList();
            
            // Generate summary data
            report.data["total_events"] = filteredEvents.Count;
            report.data["total_metrics"] = filteredMetrics.Count;
            report.data["unique_players"] = filteredEvents.Select(e => e.playerId).Distinct().Count();
            report.data["unique_sessions"] = filteredEvents.Select(e => e.sessionId).Distinct().Count();
            
            // Generate category breakdown
            var categoryBreakdown = filteredEvents.GroupBy(e => e.category)
                .ToDictionary(g => g.Key, g => g.Count());
            report.data["category_breakdown"] = categoryBreakdown;
            
            // Generate metric summaries
            var metricSummaries = filteredMetrics.GroupBy(m => m.metricName)
                .ToDictionary(g => g.Key, g => new
                {
                    count = g.Count(),
                    average = g.Average(m => m.value),
                    min = g.Min(m => m.value),
                    max = g.Max(m => m.value)
                });
            report.data["metric_summaries"] = metricSummaries;
        }
        
        private void GenerateReportCharts(AnalyticsReport report)
        {
            // Generate FPS chart
            var fpsChart = new AnalyticsChart
            {
                chartId = Guid.NewGuid().ToString(),
                chartName = "FPS Over Time",
                chartType = ChartType.Line,
                xAxisLabel = "Time",
                yAxisLabel = "FPS"
            };
            
            var fpsMetrics = analyticsMetrics.Where(m => m.metricName == "fps" && 
                m.timestamp >= report.startDate && m.timestamp <= report.endDate).ToList();
            
            foreach (var metric in fpsMetrics)
            {
                fpsChart.dataPoints.Add(new ChartDataPoint
                {
                    label = metric.timestamp.ToString("HH:mm:ss"),
                    value = metric.value,
                    timestamp = metric.timestamp
                });
            }
            
            report.charts.Add(fpsChart);
            
            // Generate memory usage chart
            var memoryChart = new AnalyticsChart
            {
                chartId = Guid.NewGuid().ToString(),
                chartName = "Memory Usage Over Time",
                chartType = ChartType.Area,
                xAxisLabel = "Time",
                yAxisLabel = "Memory (MB)"
            };
            
            var memoryMetrics = analyticsMetrics.Where(m => m.metricName == "memory_usage" && 
                m.timestamp >= report.startDate && m.timestamp <= report.endDate).ToList();
            
            foreach (var metric in memoryMetrics)
            {
                memoryChart.dataPoints.Add(new ChartDataPoint
                {
                    label = metric.timestamp.ToString("HH:mm:ss"),
                    value = metric.value,
                    timestamp = metric.timestamp
                });
            }
            
            report.charts.Add(memoryChart);
        }
        
        private void GenerateScheduledReports()
        {
            // Generate daily report
            var yesterday = DateTime.Now.AddDays(-1);
            var dailyReport = GenerateReport("Daily Report", ReportType.Daily, yesterday, DateTime.Now);
            
            // Generate weekly report if it's Monday
            if (DateTime.Now.DayOfWeek == DayOfWeek.Monday)
            {
                var lastWeek = DateTime.Now.AddDays(-7);
                var weeklyReport = GenerateReport("Weekly Report", ReportType.Weekly, lastWeek, DateTime.Now);
            }
            
            // Generate monthly report if it's the first day of the month
            if (DateTime.Now.Day == 1)
            {
                var lastMonth = DateTime.Now.AddMonths(-1);
                var monthlyReport = GenerateReport("Monthly Report", ReportType.Monthly, lastMonth, DateTime.Now);
            }
        }
        
        // Alert Management
        public void CreateAlert(string alertName, string metricName, AlertCondition condition, float threshold, string message = "")
        {
            var alert = new AnalyticsAlert
            {
                alertId = Guid.NewGuid().ToString(),
                alertName = alertName,
                metricName = metricName,
                condition = condition,
                threshold = threshold,
                isActive = true,
                isTriggered = false,
                lastTriggered = DateTime.MinValue,
                triggerCount = 0,
                message = message
            };
            
            analyticsAlerts.Add(alert);
        }
        
        private void CheckAlerts()
        {
            foreach (var alert in analyticsAlerts.Where(a => a.isActive))
            {
                CheckAlert(alert);
            }
        }
        
        private void CheckAlert(AnalyticsAlert alert)
        {
            if (!globalMetrics.ContainsKey(alert.metricName)) return;
            
            var currentValue = Convert.ToSingle(globalMetrics[alert.metricName]);
            var shouldTrigger = false;
            
            switch (alert.condition)
            {
                case AlertCondition.Above:
                    shouldTrigger = currentValue > alert.threshold;
                    break;
                case AlertCondition.Below:
                    shouldTrigger = currentValue < alert.threshold;
                    break;
                case AlertCondition.Equal:
                    shouldTrigger = Mathf.Approximately(currentValue, alert.threshold);
                    break;
                case AlertCondition.NotEqual:
                    shouldTrigger = !Mathf.Approximately(currentValue, alert.threshold);
                    break;
            }
            
            if (shouldTrigger && !alert.isTriggered)
            {
                TriggerAlert(alert, currentValue);
            }
            else if (!shouldTrigger && alert.isTriggered)
            {
                ResolveAlert(alert);
            }
        }
        
        private void TriggerAlert(AnalyticsAlert alert, float currentValue)
        {
            alert.isTriggered = true;
            alert.lastTriggered = DateTime.Now;
            alert.triggerCount++;
            
            Debug.LogWarning($"Analytics Alert: {alert.alertName} - {alert.metricName} is {currentValue} (threshold: {alert.threshold})");
            
            if (enableAlertNotifications && alertManager != null)
            {
                alertManager.SendAlert(alert, currentValue);
            }
        }
        
        private void ResolveAlert(AnalyticsAlert alert)
        {
            alert.isTriggered = false;
            Debug.Log($"Analytics Alert Resolved: {alert.alertName}");
        }
        
        // Dashboard Management
        public AnalyticsDashboard CreateDashboard(string dashboardName, bool isPublic = false)
        {
            var dashboard = new AnalyticsDashboard
            {
                dashboardId = Guid.NewGuid().ToString(),
                dashboardName = dashboardName,
                isPublic = isPublic,
                created = DateTime.Now,
                lastModified = DateTime.Now
            };
            
            analyticsDashboards.Add(dashboard);
            return dashboard;
        }
        
        public AnalyticsWidget CreateWidget(string widgetName, WidgetType widgetType, string metricName, Vector2 position, Vector2 size)
        {
            var widget = new AnalyticsWidget
            {
                widgetId = Guid.NewGuid().ToString(),
                widgetName = widgetName,
                widgetType = widgetType,
                metricName = metricName,
                position = position,
                size = size,
                isVisible = true,
                lastUpdated = DateTime.Now
            };
            
            analyticsWidgets.Add(widget);
            return widget;
        }
        
        public void AddWidgetToDashboard(string dashboardId, string widgetId)
        {
            var dashboard = analyticsDashboards.FirstOrDefault(d => d.dashboardId == dashboardId);
            if (dashboard != null && !dashboard.widgetIds.Contains(widgetId))
            {
                dashboard.widgetIds.Add(widgetId);
                dashboard.lastModified = DateTime.Now;
            }
        }
        
        private void UpdateDashboards()
        {
            foreach (var dashboard in analyticsDashboards)
            {
                UpdateDashboard(dashboard);
            }
        }
        
        private void UpdateDashboard(AnalyticsDashboard dashboard)
        {
            foreach (var widgetId in dashboard.widgetIds)
            {
                var widget = analyticsWidgets.FirstOrDefault(w => w.widgetId == widgetId);
                if (widget != null)
                {
                    UpdateWidget(widget);
                }
            }
        }
        
        private void UpdateWidget(AnalyticsWidget widget)
        {
            // Update widget data based on metric
            if (globalMetrics.ContainsKey(widget.metricName))
            {
                widget.configuration["current_value"] = globalMetrics[widget.metricName];
                widget.lastUpdated = DateTime.Now;
            }
        }
        
        // Data Export
        public void ExportData(string format, DateTime startDate, DateTime endDate)
        {
            if (!enableDataExport || analyticsExporter == null) return;
            
            var filteredEvents = analyticsEvents.Where(e => e.timestamp >= startDate && e.timestamp <= endDate).ToList();
            var filteredMetrics = analyticsMetrics.Where(m => m.timestamp >= startDate && m.timestamp <= endDate).ToList();
            
            analyticsExporter.ExportData(filteredEvents, filteredMetrics, format);
        }
        
        // Utility Methods
        private string GetSessionId()
        {
            return PlayerPrefs.GetString("SessionId", Guid.NewGuid().ToString());
        }
        
        private string GetPlayerId()
        {
            return PlayerPrefs.GetString("PlayerId", SystemInfo.deviceUniqueIdentifier);
        }
        
        public List<AnalyticsEvent> GetEvents(string category = null, DateTime? startDate = null, DateTime? endDate = null)
        {
            var events = analyticsEvents.AsEnumerable();
            
            if (!string.IsNullOrEmpty(category))
            {
                events = events.Where(e => e.category == category);
            }
            
            if (startDate.HasValue)
            {
                events = events.Where(e => e.timestamp >= startDate.Value);
            }
            
            if (endDate.HasValue)
            {
                events = events.Where(e => e.timestamp <= endDate.Value);
            }
            
            return events.ToList();
        }
        
        public List<AnalyticsMetric> GetMetrics(string metricName = null, DateTime? startDate = null, DateTime? endDate = null)
        {
            var metrics = analyticsMetrics.AsEnumerable();
            
            if (!string.IsNullOrEmpty(metricName))
            {
                metrics = metrics.Where(m => m.metricName == metricName);
            }
            
            if (startDate.HasValue)
            {
                metrics = metrics.Where(m => m.timestamp >= startDate.Value);
            }
            
            if (endDate.HasValue)
            {
                metrics = metrics.Where(m => m.timestamp <= endDate.Value);
            }
            
            return metrics.ToList();
        }
        
        public Dictionary<string, object> GetAnalyticsSummary()
        {
            return new Dictionary<string, object>
            {
                {"total_events", analyticsEvents.Count},
                {"total_metrics", analyticsMetrics.Count},
                {"total_reports", analyticsReports.Count},
                {"total_alerts", analyticsAlerts.Count},
                {"active_alerts", analyticsAlerts.Count(a => a.isTriggered)},
                {"total_dashboards", analyticsDashboards.Count},
                {"total_widgets", analyticsWidgets.Count},
                {"current_fps", globalMetrics.ContainsKey("fps") ? globalMetrics["fps"] : 0},
                {"current_memory_usage", globalMetrics.ContainsKey("memory_usage") ? globalMetrics["memory_usage"] : 0},
                {"current_cpu_usage", globalMetrics.ContainsKey("cpu_usage") ? globalMetrics["cpu_usage"] : 0}
            };
        }
        
        void OnDestroy()
        {
            if (collectionCoroutine != null)
            {
                StopCoroutine(collectionCoroutine);
            }
            if (reportCoroutine != null)
            {
                StopCoroutine(reportCoroutine);
            }
            if (alertCoroutine != null)
            {
                StopCoroutine(alertCoroutine);
            }
            if (dashboardCoroutine != null)
            {
                StopCoroutine(dashboardCoroutine);
            }
        }
    }
    
    // Supporting classes
    public class AnalyticsCollector : MonoBehaviour
    {
        public void Initialize(float collectionInterval, int maxEventsPerBatch, bool enableEventBatching) { }
    }
    
    public class AnalyticsProcessor : MonoBehaviour
    {
        public void Initialize(bool enableDataCompression, int maxMetricsHistory) { }
        public void ProcessData(List<AnalyticsEvent> events, List<AnalyticsMetric> metrics) { }
        public void ProcessEvent(AnalyticsEvent analyticsEvent) { }
        public void ProcessMetric(AnalyticsMetric analyticsMetric) { }
    }
    
    public class AnalyticsReporter : MonoBehaviour
    {
        public void Initialize(float reportGenerationInterval, int maxReports, bool enableReportScheduling) { }
    }
    
    public class AnalyticsAlertManager : MonoBehaviour
    {
        public void Initialize(float alertCheckInterval, int maxAlerts, bool enableRealTimeAlerts) { }
        public void SendAlert(AnalyticsAlert alert, float currentValue) { }
    }
    
    public class AnalyticsDashboardRenderer : MonoBehaviour
    {
        public void Initialize(bool enableCustomDashboards, bool enableDashboardSharing) { }
    }
    
    public class AnalyticsExporter : MonoBehaviour
    {
        public void Initialize(bool enableDataExport) { }
        public void ExportData(List<AnalyticsEvent> events, List<AnalyticsMetric> metrics, string format) { }
    }
}