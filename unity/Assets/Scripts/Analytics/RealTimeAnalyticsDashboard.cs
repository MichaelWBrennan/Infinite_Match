using UnityEngine;
using UnityEngine.UI;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System;
using TMPro;

namespace Evergreen.Analytics
{
    /// <summary>
    /// Real-Time Analytics Dashboard for comprehensive game monitoring
    /// Implements industry-leading analytics visualization for maximum insights
    /// </summary>
    public class RealTimeAnalyticsDashboard : MonoBehaviour
    {
        [Header("Dashboard UI")]
        [SerializeField] private Canvas dashboardCanvas;
        [SerializeField] private GameObject dashboardPanel;
        [SerializeField] private ScrollRect scrollRect;
        [SerializeField] private Transform contentParent;
        
        [Header("Metric Displays")]
        [SerializeField] private GameObject metricPrefab;
        [SerializeField] private GameObject chartPrefab;
        [SerializeField] private GameObject alertPrefab;
        [SerializeField] private GameObject filterPrefab;
        
        [Header("Real-Time Settings")]
        [SerializeField] private bool enableRealTimeUpdates = true;
        [SerializeField] private float updateInterval = 1.0f;
        [SerializeField] private bool enableAlerts = true;
        [SerializeField] private bool enableCharts = true;
        [SerializeField] private bool enableFilters = true;
        
        [Header("Analytics Categories")]
        [SerializeField] private bool enablePlayerAnalytics = true;
        [SerializeField] private bool enableRevenueAnalytics = true;
        [SerializeField] private bool enablePerformanceAnalytics = true;
        [SerializeField] private bool enableRetentionAnalytics = true;
        [SerializeField] private bool enableEngagementAnalytics = true;
        [SerializeField] private bool enableMonetizationAnalytics = true;
        
        [Header("Visualization Settings")]
        [SerializeField] private Color positiveColor = Color.green;
        [SerializeField] private Color negativeColor = Color.red;
        [SerializeField] private Color neutralColor = Color.white;
        [SerializeField] private Color warningColor = Color.yellow;
        [SerializeField] private Color criticalColor = Color.red;
        
        private Dictionary<string, MetricDisplay> _metricDisplays = new Dictionary<string, MetricDisplay>();
        private Dictionary<string, ChartDisplay> _chartDisplays = new Dictionary<string, ChartDisplay>();
        private Dictionary<string, AlertDisplay> _alertDisplays = new Dictionary<string, AlertDisplay>();
        private Dictionary<string, FilterDisplay> _filterDisplays = new Dictionary<string, FilterDisplay>();
        
        private List<AnalyticsEvent> _recentEvents = new List<AnalyticsEvent>();
        private Dictionary<string, float> _metricValues = new Dictionary<string, float>();
        private Dictionary<string, List<float>> _metricHistory = new Dictionary<string, List<float>>();
        private Dictionary<string, AlertRule> _alertRules = new Dictionary<string, AlertRule>();
        
        public static RealTimeAnalyticsDashboard Instance { get; private set; }
        
        [System.Serializable]
        public class MetricDisplay
        {
            public string id;
            public string name;
            public string description;
            public float currentValue;
            public float previousValue;
            public float changePercent;
            public MetricType type;
            public string unit;
            public Color color;
            public bool isVisible;
            public GameObject gameObject;
            public TextMeshProUGUI valueText;
            public TextMeshProUGUI changeText;
            public Image trendIcon;
        }
        
        [System.Serializable]
        public class ChartDisplay
        {
            public string id;
            public string name;
            public string description;
            public ChartType type;
            public List<Vector2> dataPoints;
            public Color lineColor;
            public Color fillColor;
            public bool isVisible;
            public GameObject gameObject;
            public RectTransform chartContainer;
            public Image chartImage;
        }
        
        [System.Serializable]
        public class AlertDisplay
        {
            public string id;
            public string title;
            public string message;
            public AlertLevel level;
            public DateTime timestamp;
            public bool isVisible;
            public GameObject gameObject;
            public TextMeshProUGUI titleText;
            public TextMeshProUGUI messageText;
            public Image alertIcon;
        }
        
        [System.Serializable]
        public class FilterDisplay
        {
            public string id;
            public string name;
            public FilterType type;
            public List<string> options;
            public string selectedValue;
            public bool isVisible;
            public GameObject gameObject;
            public Dropdown dropdown;
            public Toggle toggle;
        }
        
        [System.Serializable]
        public class AlertRule
        {
            public string id;
            public string name;
            public string metricId;
            public ComparisonType comparison;
            public float threshold;
            public AlertLevel level;
            public bool isActive;
            public float cooldown;
            public float lastTriggered;
        }
        
        public enum MetricType
        {
            Counter,
            Gauge,
            Trend,
            Percentage,
            Currency,
            Time,
            Custom
        }
        
        public enum ChartType
        {
            Line,
            Bar,
            Pie,
            Area,
            Scatter,
            Heatmap
        }
        
        public enum AlertLevel
        {
            Info,
            Warning,
            Critical,
            Success
        }
        
        public enum FilterType
        {
            Dropdown,
            Toggle,
            Slider,
            DateRange,
            Text
        }
        
        public enum ComparisonType
        {
            GreaterThan,
            LessThan,
            EqualTo,
            NotEqualTo,
            GreaterThanOrEqual,
            LessThanOrEqual
        }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeDashboard();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            SetupDashboardUI();
            SetupMetricDisplays();
            SetupChartDisplays();
            SetupAlertDisplays();
            SetupFilterDisplays();
            SetupAlertRules();
            StartCoroutine(UpdateDashboard());
        }
        
        private void InitializeDashboard()
        {
            // Initialize dashboard components
            if (dashboardCanvas == null)
            {
                dashboardCanvas = GetComponent<Canvas>();
                if (dashboardCanvas == null)
                {
                    dashboardCanvas = gameObject.AddComponent<Canvas>();
                }
            }
            
            if (dashboardPanel == null)
            {
                dashboardPanel = new GameObject("DashboardPanel");
                dashboardPanel.transform.SetParent(dashboardCanvas.transform);
                
                RectTransform panelRect = dashboardPanel.AddComponent<RectTransform>();
                panelRect.anchorMin = Vector2.zero;
                panelRect.anchorMax = Vector2.one;
                panelRect.offsetMin = Vector2.zero;
                panelRect.offsetMax = Vector2.zero;
                
                Image panelImage = dashboardPanel.AddComponent<Image>();
                panelImage.color = new Color(0.1f, 0.1f, 0.1f, 0.9f);
            }
            
            if (scrollRect == null)
            {
                scrollRect = dashboardPanel.AddComponent<ScrollRect>();
                scrollRect.horizontal = false;
                scrollRect.vertical = true;
            }
            
            if (contentParent == null)
            {
                GameObject content = new GameObject("Content");
                content.transform.SetParent(dashboardPanel.transform);
                
                RectTransform contentRect = content.AddComponent<RectTransform>();
                contentRect.anchorMin = Vector2.zero;
                contentRect.anchorMax = Vector2.one;
                contentRect.offsetMin = Vector2.zero;
                contentRect.offsetMax = Vector2.zero;
                
                scrollRect.content = contentRect;
                contentParent = content.transform;
            }
        }
        
        private void SetupDashboardUI()
        {
            // Setup dashboard UI components
            if (dashboardCanvas != null)
            {
                dashboardCanvas.renderMode = RenderMode.ScreenSpaceOverlay;
                dashboardCanvas.sortingOrder = 1000;
            }
            
            // Create header
            CreateDashboardHeader();
            
            // Create navigation
            CreateDashboardNavigation();
        }
        
        private void CreateDashboardHeader()
        {
            GameObject header = new GameObject("Header");
            header.transform.SetParent(dashboardPanel.transform);
            
            RectTransform headerRect = header.AddComponent<RectTransform>();
            headerRect.anchorMin = new Vector2(0, 0.9f);
            headerRect.anchorMax = new Vector2(1, 1);
            headerRect.offsetMin = Vector2.zero;
            headerRect.offsetMax = Vector2.zero;
            
            Image headerImage = header.AddComponent<Image>();
            headerImage.color = new Color(0.2f, 0.2f, 0.2f, 1f);
            
            // Add title
            GameObject title = new GameObject("Title");
            title.transform.SetParent(header.transform);
            
            RectTransform titleRect = title.AddComponent<RectTransform>();
            titleRect.anchorMin = Vector2.zero;
            titleRect.anchorMax = Vector2.one;
            titleRect.offsetMin = new Vector2(20, 0);
            titleRect.offsetMax = new Vector2(-20, 0);
            
            TextMeshProUGUI titleText = title.AddComponent<TextMeshProUGUI>();
            titleText.text = "Real-Time Analytics Dashboard";
            titleText.fontSize = 24;
            titleText.color = Color.white;
            titleText.alignment = TextAlignmentOptions.Center;
        }
        
        private void CreateDashboardNavigation()
        {
            GameObject navigation = new GameObject("Navigation");
            navigation.transform.SetParent(dashboardPanel.transform);
            
            RectTransform navRect = navigation.AddComponent<RectTransform>();
            navRect.anchorMin = new Vector2(0, 0.8f);
            navRect.anchorMax = new Vector2(1, 0.9f);
            navRect.offsetMin = Vector2.zero;
            navRect.offsetMax = Vector2.zero;
            
            Image navImage = navigation.AddComponent<Image>();
            navImage.color = new Color(0.15f, 0.15f, 0.15f, 1f);
            
            // Add navigation buttons
            CreateNavigationButton(navigation, "Overview", 0);
            CreateNavigationButton(navigation, "Players", 1);
            CreateNavigationButton(navigation, "Revenue", 2);
            CreateNavigationButton(navigation, "Performance", 3);
            CreateNavigationButton(navigation, "Retention", 4);
            CreateNavigationButton(navigation, "Engagement", 5);
        }
        
        private void CreateNavigationButton(GameObject parent, string text, int index)
        {
            GameObject button = new GameObject($"Button_{text}");
            button.transform.SetParent(parent.transform);
            
            RectTransform buttonRect = button.AddComponent<RectTransform>();
            buttonRect.anchorMin = new Vector2(index / 6f, 0);
            buttonRect.anchorMax = new Vector2((index + 1) / 6f, 1);
            buttonRect.offsetMin = Vector2.zero;
            buttonRect.offsetMax = Vector2.zero;
            
            Image buttonImage = button.AddComponent<Image>();
            buttonImage.color = new Color(0.3f, 0.3f, 0.3f, 1f);
            
            Button buttonComponent = button.AddComponent<Button>();
            buttonComponent.onClick.AddListener(() => OnNavigationButtonClicked(text));
            
            // Add text
            GameObject buttonText = new GameObject("Text");
            buttonText.transform.SetParent(button.transform);
            
            RectTransform textRect = buttonText.AddComponent<RectTransform>();
            textRect.anchorMin = Vector2.zero;
            textRect.anchorMax = Vector2.one;
            textRect.offsetMin = Vector2.zero;
            textRect.offsetMax = Vector2.zero;
            
            TextMeshProUGUI textComponent = buttonText.AddComponent<TextMeshProUGUI>();
            textComponent.text = text;
            textComponent.fontSize = 16;
            textComponent.color = Color.white;
            textComponent.alignment = TextAlignmentOptions.Center;
        }
        
        private void SetupMetricDisplays()
        {
            // Create metric displays for different categories
            if (enablePlayerAnalytics)
            {
                CreateMetricDisplay("active_players", "Active Players", "Number of currently active players", MetricType.Counter, "players");
                CreateMetricDisplay("new_players", "New Players", "Number of new players today", MetricType.Counter, "players");
                CreateMetricDisplay("total_players", "Total Players", "Total number of registered players", MetricType.Counter, "players");
                CreateMetricDisplay("player_retention", "Player Retention", "Percentage of players who returned", MetricType.Percentage, "%");
            }
            
            if (enableRevenueAnalytics)
            {
                CreateMetricDisplay("revenue_today", "Revenue Today", "Total revenue generated today", MetricType.Currency, "$");
                CreateMetricDisplay("revenue_total", "Total Revenue", "Total revenue generated", MetricType.Currency, "$");
                CreateMetricDisplay("arpu", "ARPU", "Average Revenue Per User", MetricType.Currency, "$");
                CreateMetricDisplay("ltv", "LTV", "Lifetime Value", MetricType.Currency, "$");
            }
            
            if (enablePerformanceAnalytics)
            {
                CreateMetricDisplay("fps", "FPS", "Current frames per second", MetricType.Gauge, "fps");
                CreateMetricDisplay("memory_usage", "Memory Usage", "Current memory usage", MetricType.Gauge, "MB");
                CreateMetricDisplay("cpu_usage", "CPU Usage", "Current CPU usage", MetricType.Percentage, "%");
                CreateMetricDisplay("gpu_usage", "GPU Usage", "Current GPU usage", MetricType.Percentage, "%");
            }
            
            if (enableRetentionAnalytics)
            {
                CreateMetricDisplay("day1_retention", "Day 1 Retention", "Percentage of players who returned after 1 day", MetricType.Percentage, "%");
                CreateMetricDisplay("day7_retention", "Day 7 Retention", "Percentage of players who returned after 7 days", MetricType.Percentage, "%");
                CreateMetricDisplay("day30_retention", "Day 30 Retention", "Percentage of players who returned after 30 days", MetricType.Percentage, "%");
            }
            
            if (enableEngagementAnalytics)
            {
                CreateMetricDisplay("session_length", "Session Length", "Average session length", MetricType.Time, "min");
                CreateMetricDisplay("sessions_per_day", "Sessions Per Day", "Average sessions per day per player", MetricType.Gauge, "sessions");
                CreateMetricDisplay("levels_completed", "Levels Completed", "Total levels completed today", MetricType.Counter, "levels");
            }
            
            if (enableMonetizationAnalytics)
            {
                CreateMetricDisplay("conversion_rate", "Conversion Rate", "Percentage of players who made a purchase", MetricType.Percentage, "%");
                CreateMetricDisplay("purchase_count", "Purchase Count", "Total number of purchases today", MetricType.Counter, "purchases");
                CreateMetricDisplay("average_purchase", "Average Purchase", "Average purchase value", MetricType.Currency, "$");
            }
        }
        
        private void CreateMetricDisplay(string id, string name, string description, MetricType type, string unit)
        {
            GameObject metricObj = Instantiate(metricPrefab, contentParent);
            if (metricObj == null)
            {
                metricObj = CreateMetricDisplayPrefab();
                metricObj.transform.SetParent(contentParent);
            }
            
            MetricDisplay display = new MetricDisplay
            {
                id = id,
                name = name,
                description = description,
                type = type,
                unit = unit,
                currentValue = 0f,
                previousValue = 0f,
                changePercent = 0f,
                color = neutralColor,
                isVisible = true,
                gameObject = metricObj
            };
            
            // Setup UI components
            display.valueText = metricObj.transform.Find("ValueText")?.GetComponent<TextMeshProUGUI>();
            display.changeText = metricObj.transform.Find("ChangeText")?.GetComponent<TextMeshProUGUI>();
            display.trendIcon = metricObj.transform.Find("TrendIcon")?.GetComponent<Image>();
            
            _metricDisplays[id] = display;
            _metricValues[id] = 0f;
            _metricHistory[id] = new List<float>();
        }
        
        private GameObject CreateMetricDisplayPrefab()
        {
            GameObject prefab = new GameObject("MetricDisplay");
            
            // Add background
            Image background = prefab.AddComponent<Image>();
            background.color = new Color(0.2f, 0.2f, 0.2f, 1f);
            
            RectTransform rect = prefab.GetComponent<RectTransform>();
            rect.sizeDelta = new Vector2(300, 100);
            
            // Add name text
            GameObject nameObj = new GameObject("NameText");
            nameObj.transform.SetParent(prefab.transform);
            
            RectTransform nameRect = nameObj.AddComponent<RectTransform>();
            nameRect.anchorMin = new Vector2(0, 0.7f);
            nameRect.anchorMax = new Vector2(1, 1);
            nameRect.offsetMin = new Vector2(10, 0);
            nameRect.offsetMax = new Vector2(-10, 0);
            
            TextMeshProUGUI nameText = nameObj.AddComponent<TextMeshProUGUI>();
            nameText.fontSize = 16;
            nameText.color = Color.white;
            nameText.alignment = TextAlignmentOptions.Left;
            
            // Add value text
            GameObject valueObj = new GameObject("ValueText");
            valueObj.transform.SetParent(prefab.transform);
            
            RectTransform valueRect = valueObj.AddComponent<RectTransform>();
            valueRect.anchorMin = new Vector2(0, 0.3f);
            valueRect.anchorMax = new Vector2(0.7f, 0.7f);
            valueRect.offsetMin = new Vector2(10, 0);
            valueRect.offsetMax = new Vector2(-10, 0);
            
            TextMeshProUGUI valueText = valueObj.AddComponent<TextMeshProUGUI>();
            valueText.fontSize = 24;
            valueText.color = Color.white;
            valueText.alignment = TextAlignmentOptions.Left;
            
            // Add change text
            GameObject changeObj = new GameObject("ChangeText");
            changeObj.transform.SetParent(prefab.transform);
            
            RectTransform changeRect = changeObj.AddComponent<RectTransform>();
            changeRect.anchorMin = new Vector2(0.7f, 0.3f);
            changeRect.anchorMax = new Vector2(1, 0.7f);
            changeRect.offsetMin = new Vector2(10, 0);
            changeRect.offsetMax = new Vector2(-10, 0);
            
            TextMeshProUGUI changeText = changeObj.AddComponent<TextMeshProUGUI>();
            changeText.fontSize = 16;
            changeText.color = Color.white;
            changeText.alignment = TextAlignmentOptions.Right;
            
            // Add trend icon
            GameObject trendObj = new GameObject("TrendIcon");
            trendObj.transform.SetParent(prefab.transform);
            
            RectTransform trendRect = trendObj.AddComponent<RectTransform>();
            trendRect.anchorMin = new Vector2(0.9f, 0.1f);
            trendRect.anchorMax = new Vector2(1, 0.3f);
            trendRect.offsetMin = new Vector2(10, 0);
            trendRect.offsetMax = new Vector2(-10, 0);
            
            Image trendIcon = trendObj.AddComponent<Image>();
            trendIcon.color = Color.white;
            
            return prefab;
        }
        
        private void SetupChartDisplays()
        {
            if (!enableCharts) return;
            
            // Create chart displays for different metrics
            CreateChartDisplay("revenue_chart", "Revenue Over Time", "Revenue trends over the last 24 hours", ChartType.Line);
            CreateChartDisplay("player_chart", "Player Activity", "Player activity over the last 24 hours", ChartType.Area);
            CreateChartDisplay("performance_chart", "Performance Metrics", "Performance metrics over time", ChartType.Line);
        }
        
        private void CreateChartDisplay(string id, string name, string description, ChartType type)
        {
            GameObject chartObj = Instantiate(chartPrefab, contentParent);
            if (chartObj == null)
            {
                chartObj = CreateChartDisplayPrefab();
                chartObj.transform.SetParent(contentParent);
            }
            
            ChartDisplay display = new ChartDisplay
            {
                id = id,
                name = name,
                description = description,
                type = type,
                dataPoints = new List<Vector2>(),
                lineColor = Color.blue,
                fillColor = new Color(0, 0, 1, 0.3f),
                isVisible = true,
                gameObject = chartObj
            };
            
            _chartDisplays[id] = display;
        }
        
        private GameObject CreateChartDisplayPrefab()
        {
            GameObject prefab = new GameObject("ChartDisplay");
            
            // Add background
            Image background = prefab.AddComponent<Image>();
            background.color = new Color(0.2f, 0.2f, 0.2f, 1f);
            
            RectTransform rect = prefab.GetComponent<RectTransform>();
            rect.sizeDelta = new Vector2(600, 200);
            
            // Add title
            GameObject titleObj = new GameObject("Title");
            titleObj.transform.SetParent(prefab.transform);
            
            RectTransform titleRect = titleObj.AddComponent<RectTransform>();
            titleRect.anchorMin = new Vector2(0, 0.8f);
            titleRect.anchorMax = new Vector2(1, 1);
            titleRect.offsetMin = new Vector2(10, 0);
            titleRect.offsetMax = new Vector2(-10, 0);
            
            TextMeshProUGUI titleText = titleObj.AddComponent<TextMeshProUGUI>();
            titleText.fontSize = 18;
            titleText.color = Color.white;
            titleText.alignment = TextAlignmentOptions.Center;
            
            // Add chart container
            GameObject chartContainer = new GameObject("ChartContainer");
            chartContainer.transform.SetParent(prefab.transform);
            
            RectTransform chartRect = chartContainer.AddComponent<RectTransform>();
            chartRect.anchorMin = new Vector2(0, 0);
            chartRect.anchorMax = new Vector2(1, 0.8f);
            chartRect.offsetMin = new Vector2(10, 10);
            chartRect.offsetMax = new Vector2(-10, -10);
            
            Image chartImage = chartContainer.AddComponent<Image>();
            chartImage.color = new Color(0.1f, 0.1f, 0.1f, 1f);
            
            return prefab;
        }
        
        private void SetupAlertDisplays()
        {
            if (!enableAlerts) return;
            
            // Create alert display
            GameObject alertContainer = new GameObject("AlertContainer");
            alertContainer.transform.SetParent(dashboardPanel.transform);
            
            RectTransform alertRect = alertContainer.AddComponent<RectTransform>();
            alertRect.anchorMin = new Vector2(0.7f, 0.1f);
            alertRect.anchorMax = new Vector2(1, 0.8f);
            alertRect.offsetMin = new Vector2(10, 10);
            alertRect.offsetMax = new Vector2(-10, -10);
            
            Image alertImage = alertContainer.AddComponent<Image>();
            alertImage.color = new Color(0.15f, 0.15f, 0.15f, 1f);
        }
        
        private void SetupFilterDisplays()
        {
            if (!enableFilters) return;
            
            // Create filter displays
            CreateFilterDisplay("time_filter", "Time Range", FilterType.Dropdown, new string[] { "1 Hour", "6 Hours", "24 Hours", "7 Days", "30 Days" });
            CreateFilterDisplay("metric_filter", "Metrics", FilterType.Dropdown, new string[] { "All", "Players", "Revenue", "Performance", "Retention" });
        }
        
        private void CreateFilterDisplay(string id, string name, FilterType type, string[] options)
        {
            GameObject filterObj = Instantiate(filterPrefab, dashboardPanel.transform);
            if (filterObj == null)
            {
                filterObj = CreateFilterDisplayPrefab();
                filterObj.transform.SetParent(dashboardPanel.transform);
            }
            
            FilterDisplay display = new FilterDisplay
            {
                id = id,
                name = name,
                type = type,
                options = new List<string>(options),
                selectedValue = options[0],
                isVisible = true,
                gameObject = filterObj
            };
            
            _filterDisplays[id] = display;
        }
        
        private GameObject CreateFilterDisplayPrefab()
        {
            GameObject prefab = new GameObject("FilterDisplay");
            
            // Add background
            Image background = prefab.AddComponent<Image>();
            background.color = new Color(0.2f, 0.2f, 0.2f, 1f);
            
            RectTransform rect = prefab.GetComponent<RectTransform>();
            rect.sizeDelta = new Vector2(200, 50);
            
            // Add dropdown
            GameObject dropdownObj = new GameObject("Dropdown");
            dropdownObj.transform.SetParent(prefab.transform);
            
            RectTransform dropdownRect = dropdownObj.AddComponent<RectTransform>();
            dropdownRect.anchorMin = Vector2.zero;
            dropdownRect.anchorMax = Vector2.one;
            dropdownRect.offsetMin = new Vector2(10, 10);
            dropdownRect.offsetMax = new Vector2(-10, -10);
            
            Dropdown dropdown = dropdownObj.AddComponent<Dropdown>();
            
            return prefab;
        }
        
        private void SetupAlertRules()
        {
            // Setup alert rules for different metrics
            _alertRules["low_fps"] = new AlertRule
            {
                id = "low_fps",
                name = "Low FPS Alert",
                metricId = "fps",
                comparison = ComparisonType.LessThan,
                threshold = 30f,
                level = AlertLevel.Critical,
                isActive = true,
                cooldown = 60f,
                lastTriggered = 0f
            };
            
            _alertRules["high_memory"] = new AlertRule
            {
                id = "high_memory",
                name = "High Memory Usage Alert",
                metricId = "memory_usage",
                comparison = ComparisonType.GreaterThan,
                threshold = 1000f,
                level = AlertLevel.Warning,
                isActive = true,
                cooldown = 300f,
                lastTriggered = 0f
            };
            
            _alertRules["low_revenue"] = new AlertRule
            {
                id = "low_revenue",
                name = "Low Revenue Alert",
                metricId = "revenue_today",
                comparison = ComparisonType.LessThan,
                threshold = 100f,
                level = AlertLevel.Warning,
                isActive = true,
                cooldown = 3600f,
                lastTriggered = 0f
            };
        }
        
        private IEnumerator UpdateDashboard()
        {
            while (true)
            {
                if (enableRealTimeUpdates)
                {
                    UpdateMetricValues();
                    UpdateCharts();
                    CheckAlerts();
                    UpdateFilters();
                }
                
                yield return new WaitForSeconds(updateInterval);
            }
        }
        
        private void UpdateMetricValues()
        {
            // Update metric values from analytics system
            foreach (var metric in _metricDisplays.Values)
            {
                if (metric.isVisible)
                {
                    // Get current value from analytics system
                    float currentValue = GetMetricValue(metric.id);
                    
                    // Update metric display
                    metric.previousValue = metric.currentValue;
                    metric.currentValue = currentValue;
                    metric.changePercent = CalculateChangePercent(metric.previousValue, metric.currentValue);
                    
                    // Update color based on change
                    UpdateMetricColor(metric);
                    
                    // Update UI
                    UpdateMetricUI(metric);
                    
                    // Update history
                    UpdateMetricHistory(metric.id, currentValue);
                }
            }
        }
        
        private float GetMetricValue(string metricId)
        {
            // Get metric value from analytics system
            // This would integrate with your analytics system
            return _metricValues.ContainsKey(metricId) ? _metricValues[metricId] : 0f;
        }
        
        private float CalculateChangePercent(float previous, float current)
        {
            if (previous == 0) return 0f;
            return ((current - previous) / previous) * 100f;
        }
        
        private void UpdateMetricColor(MetricDisplay metric)
        {
            if (metric.changePercent > 0)
            {
                metric.color = positiveColor;
            }
            else if (metric.changePercent < 0)
            {
                metric.color = negativeColor;
            }
            else
            {
                metric.color = neutralColor;
            }
        }
        
        private void UpdateMetricUI(MetricDisplay metric)
        {
            if (metric.valueText != null)
            {
                metric.valueText.text = FormatMetricValue(metric.currentValue, metric.type, metric.unit);
                metric.valueText.color = metric.color;
            }
            
            if (metric.changeText != null)
            {
                string changeText = metric.changePercent >= 0 ? "+" : "";
                metric.changeText.text = $"{changeText}{metric.changePercent:F1}%";
                metric.changeText.color = metric.color;
            }
            
            if (metric.trendIcon != null)
            {
                // Update trend icon based on change
                if (metric.changePercent > 0)
                {
                    metric.trendIcon.color = positiveColor;
                }
                else if (metric.changePercent < 0)
                {
                    metric.trendIcon.color = negativeColor;
                }
                else
                {
                    metric.trendIcon.color = neutralColor;
                }
            }
        }
        
        private string FormatMetricValue(float value, MetricType type, string unit)
        {
            switch (type)
            {
                case MetricType.Currency:
                    return $"${value:F2}";
                case MetricType.Percentage:
                    return $"{value:F1}%";
                case MetricType.Time:
                    return $"{value:F0} {unit}";
                case MetricType.Counter:
                    return $"{value:F0} {unit}";
                default:
                    return $"{value:F2} {unit}";
            }
        }
        
        private void UpdateMetricHistory(string metricId, float value)
        {
            if (!_metricHistory.ContainsKey(metricId))
            {
                _metricHistory[metricId] = new List<float>();
            }
            
            _metricHistory[metricId].Add(value);
            
            // Keep only last 100 values
            if (_metricHistory[metricId].Count > 100)
            {
                _metricHistory[metricId].RemoveAt(0);
            }
        }
        
        private void UpdateCharts()
        {
            if (!enableCharts) return;
            
            foreach (var chart in _chartDisplays.Values)
            {
                if (chart.isVisible)
                {
                    UpdateChartData(chart);
                    UpdateChartUI(chart);
                }
            }
        }
        
        private void UpdateChartData(ChartDisplay chart)
        {
            // Update chart data based on metric history
            chart.dataPoints.Clear();
            
            switch (chart.id)
            {
                case "revenue_chart":
                    UpdateRevenueChart(chart);
                    break;
                case "player_chart":
                    UpdatePlayerChart(chart);
                    break;
                case "performance_chart":
                    UpdatePerformanceChart(chart);
                    break;
            }
        }
        
        private void UpdateRevenueChart(ChartDisplay chart)
        {
            // Update revenue chart with historical data
            if (_metricHistory.ContainsKey("revenue_today"))
            {
                var history = _metricHistory["revenue_today"];
                for (int i = 0; i < history.Count; i++)
                {
                    chart.dataPoints.Add(new Vector2(i, history[i]));
                }
            }
        }
        
        private void UpdatePlayerChart(ChartDisplay chart)
        {
            // Update player chart with historical data
            if (_metricHistory.ContainsKey("active_players"))
            {
                var history = _metricHistory["active_players"];
                for (int i = 0; i < history.Count; i++)
                {
                    chart.dataPoints.Add(new Vector2(i, history[i]));
                }
            }
        }
        
        private void UpdatePerformanceChart(ChartDisplay chart)
        {
            // Update performance chart with historical data
            if (_metricHistory.ContainsKey("fps"))
            {
                var history = _metricHistory["fps"];
                for (int i = 0; i < history.Count; i++)
                {
                    chart.dataPoints.Add(new Vector2(i, history[i]));
                }
            }
        }
        
        private void UpdateChartUI(ChartDisplay chart)
        {
            // Update chart UI with new data
            // This would integrate with your chart rendering system
        }
        
        private void CheckAlerts()
        {
            if (!enableAlerts) return;
            
            foreach (var rule in _alertRules.Values)
            {
                if (rule.isActive && Time.time - rule.lastTriggered > rule.cooldown)
                {
                    if (CheckAlertRule(rule))
                    {
                        TriggerAlert(rule);
                        rule.lastTriggered = Time.time;
                    }
                }
            }
        }
        
        private bool CheckAlertRule(AlertRule rule)
        {
            float currentValue = GetMetricValue(rule.metricId);
            
            switch (rule.comparison)
            {
                case ComparisonType.GreaterThan:
                    return currentValue > rule.threshold;
                case ComparisonType.LessThan:
                    return currentValue < rule.threshold;
                case ComparisonType.EqualTo:
                    return Mathf.Approximately(currentValue, rule.threshold);
                case ComparisonType.NotEqualTo:
                    return !Mathf.Approximately(currentValue, rule.threshold);
                case ComparisonType.GreaterThanOrEqual:
                    return currentValue >= rule.threshold;
                case ComparisonType.LessThanOrEqual:
                    return currentValue <= rule.threshold;
                default:
                    return false;
            }
        }
        
        private void TriggerAlert(AlertRule rule)
        {
            // Create alert display
            CreateAlertDisplay(rule);
        }
        
        private void CreateAlertDisplay(AlertRule rule)
        {
            GameObject alertObj = Instantiate(alertPrefab, dashboardPanel.transform);
            if (alertObj == null)
            {
                alertObj = CreateAlertDisplayPrefab();
                alertObj.transform.SetParent(dashboardPanel.transform);
            }
            
            AlertDisplay display = new AlertDisplay
            {
                id = rule.id,
                title = rule.name,
                message = $"Alert: {rule.metricId} is {rule.comparison} {rule.threshold}",
                level = rule.level,
                timestamp = DateTime.Now,
                isVisible = true,
                gameObject = alertObj
            };
            
            _alertDisplays[rule.id] = display;
        }
        
        private GameObject CreateAlertDisplayPrefab()
        {
            GameObject prefab = new GameObject("AlertDisplay");
            
            // Add background
            Image background = prefab.AddComponent<Image>();
            background.color = warningColor;
            
            RectTransform rect = prefab.GetComponent<RectTransform>();
            rect.sizeDelta = new Vector2(400, 80);
            
            // Add title
            GameObject titleObj = new GameObject("Title");
            titleObj.transform.SetParent(prefab.transform);
            
            RectTransform titleRect = titleObj.AddComponent<RectTransform>();
            titleRect.anchorMin = new Vector2(0, 0.5f);
            titleRect.anchorMax = new Vector2(1, 1);
            titleRect.offsetMin = new Vector2(10, 0);
            titleRect.offsetMax = new Vector2(-10, 0);
            
            TextMeshProUGUI titleText = titleObj.AddComponent<TextMeshProUGUI>();
            titleText.fontSize = 16;
            titleText.color = Color.white;
            titleText.alignment = TextAlignmentOptions.Left;
            
            // Add message
            GameObject messageObj = new GameObject("Message");
            messageObj.transform.SetParent(prefab.transform);
            
            RectTransform messageRect = messageObj.AddComponent<RectTransform>();
            messageRect.anchorMin = new Vector2(0, 0);
            messageRect.anchorMax = new Vector2(1, 0.5f);
            messageRect.offsetMin = new Vector2(10, 0);
            messageRect.offsetMax = new Vector2(-10, 0);
            
            TextMeshProUGUI messageText = messageObj.AddComponent<TextMeshProUGUI>();
            messageText.fontSize = 14;
            messageText.color = Color.white;
            messageText.alignment = TextAlignmentOptions.Left;
            
            return prefab;
        }
        
        private void UpdateFilters()
        {
            if (!enableFilters) return;
            
            // Update filter displays
            foreach (var filter in _filterDisplays.Values)
            {
                if (filter.isVisible)
                {
                    UpdateFilterUI(filter);
                }
            }
        }
        
        private void UpdateFilterUI(FilterDisplay filter)
        {
            // Update filter UI based on current selection
            // This would integrate with your filter system
        }
        
        private void OnNavigationButtonClicked(string category)
        {
            // Handle navigation button clicks
            switch (category)
            {
                case "Overview":
                    ShowOverview();
                    break;
                case "Players":
                    ShowPlayerAnalytics();
                    break;
                case "Revenue":
                    ShowRevenueAnalytics();
                    break;
                case "Performance":
                    ShowPerformanceAnalytics();
                    break;
                case "Retention":
                    ShowRetentionAnalytics();
                    break;
                case "Engagement":
                    ShowEngagementAnalytics();
                    break;
            }
        }
        
        private void ShowOverview()
        {
            // Show overview metrics
            SetMetricVisibility("active_players", true);
            SetMetricVisibility("revenue_today", true);
            SetMetricVisibility("fps", true);
            SetMetricVisibility("conversion_rate", true);
        }
        
        private void ShowPlayerAnalytics()
        {
            // Show player analytics
            SetMetricVisibility("active_players", true);
            SetMetricVisibility("new_players", true);
            SetMetricVisibility("total_players", true);
            SetMetricVisibility("player_retention", true);
        }
        
        private void ShowRevenueAnalytics()
        {
            // Show revenue analytics
            SetMetricVisibility("revenue_today", true);
            SetMetricVisibility("revenue_total", true);
            SetMetricVisibility("arpu", true);
            SetMetricVisibility("ltv", true);
        }
        
        private void ShowPerformanceAnalytics()
        {
            // Show performance analytics
            SetMetricVisibility("fps", true);
            SetMetricVisibility("memory_usage", true);
            SetMetricVisibility("cpu_usage", true);
            SetMetricVisibility("gpu_usage", true);
        }
        
        private void ShowRetentionAnalytics()
        {
            // Show retention analytics
            SetMetricVisibility("day1_retention", true);
            SetMetricVisibility("day7_retention", true);
            SetMetricVisibility("day30_retention", true);
        }
        
        private void ShowEngagementAnalytics()
        {
            // Show engagement analytics
            SetMetricVisibility("session_length", true);
            SetMetricVisibility("sessions_per_day", true);
            SetMetricVisibility("levels_completed", true);
        }
        
        private void SetMetricVisibility(string metricId, bool visible)
        {
            if (_metricDisplays.ContainsKey(metricId))
            {
                _metricDisplays[metricId].isVisible = visible;
                _metricDisplays[metricId].gameObject.SetActive(visible);
            }
        }
        
        /// <summary>
        /// Update metric value
        /// </summary>
        public void UpdateMetric(string metricId, float value)
        {
            if (_metricValues.ContainsKey(metricId))
            {
                _metricValues[metricId] = value;
            }
        }
        
        /// <summary>
        /// Add analytics event
        /// </summary>
        public void AddAnalyticsEvent(AnalyticsEvent analyticsEvent)
        {
            _recentEvents.Add(analyticsEvent);
            
            // Keep only last 1000 events
            if (_recentEvents.Count > 1000)
            {
                _recentEvents.RemoveAt(0);
            }
        }
        
        /// <summary>
        /// Get dashboard data
        /// </summary>
        public string GetDashboardData()
        {
            System.Text.StringBuilder data = new System.Text.StringBuilder();
            data.AppendLine("=== DASHBOARD DATA ===");
            data.AppendLine($"Timestamp: {DateTime.Now}");
            data.AppendLine();
            
            foreach (var metric in _metricDisplays.Values)
            {
                if (metric.isVisible)
                {
                    data.AppendLine($"{metric.name}: {metric.currentValue:F2} {metric.unit} ({metric.changePercent:F1}%)");
                }
            }
            
            return data.ToString();
        }
        
        /// <summary>
        /// Export dashboard data
        /// </summary>
        public void ExportDashboardData()
        {
            string data = GetDashboardData();
            string fileName = $"dashboard_export_{DateTime.Now:yyyyMMdd_HHmmss}.txt";
            System.IO.File.WriteAllText(fileName, data);
        }
        
        void OnDestroy()
        {
            // Clean up dashboard
        }
    }
}