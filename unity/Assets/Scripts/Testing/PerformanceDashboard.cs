using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Linq;
using Evergreen.Core;

namespace Evergreen.Testing
{
    /// <summary>
    /// Performance monitoring dashboard with real-time metrics and alerts
    /// </summary>
    public class PerformanceDashboard : MonoBehaviour
    {
        [Header("UI References")]
        public Canvas dashboardCanvas;
        public TextMeshProUGUI fpsText;
        public TextMeshProUGUI memoryText;
        public TextMeshProUGUI frameTimeText;
        public TextMeshProUGUI drawCallsText;
        public TextMeshProUGUI trianglesText;
        public TextMeshProUGUI alertsText;
        public ScrollRect metricsScrollRect;
        public Transform metricsContainer;
        public GameObject metricItemPrefab;

        [Header("Settings")]
        public bool enableRealTimeUpdates = true;
        public float updateInterval = 0.1f;
        public bool enableAlerts = true;
        public bool enableDetailedMetrics = true;
        public Color goodColor = Color.green;
        public Color warningColor = Color.yellow;
        public Color criticalColor = Color.red;

        private AdvancedPerformanceTests _performanceTests;
        private Dictionary<string, GameObject> _metricItems = new Dictionary<string, GameObject>();
        private float _lastUpdateTime = 0f;
        private List<string> _alertMessages = new List<string>();
        private UIElementPoolManager _uiPoolManager;

        void Start()
        {
            InitializeDashboard();
            _performanceTests = FindObjectOfType<AdvancedPerformanceTests>();
            if (_performanceTests == null)
            {
                _performanceTests = gameObject.AddComponent<AdvancedPerformanceTests>();
            }
            
            // Initialize UI pool manager
            _uiPoolManager = GetComponent<UIElementPoolManager>();
            if (_uiPoolManager == null)
            {
                _uiPoolManager = gameObject.AddComponent<UIElementPoolManager>();
            }
        }

        void Update()
        {
            if (enableRealTimeUpdates && Time.time - _lastUpdateTime > updateInterval)
            {
                UpdateDashboard();
                _lastUpdateTime = Time.time;
            }
        }

        private void InitializeDashboard()
        {
            if (dashboardCanvas == null)
            {
                dashboardCanvas = GetComponent<Canvas>();
            }

            if (dashboardCanvas == null)
            {
                Logger.Error("Performance Dashboard: No canvas found", "PerformanceDashboard");
                return;
            }

            // Create UI elements if they don't exist
            CreateUIElements();

            Logger.Info("Performance Dashboard initialized", "PerformanceDashboard");
        }

        private void CreateUIElements()
        {
            if (fpsText == null)
            {
                fpsText = CreateTextElement("FPS: --", new Vector2(-200, 200));
            }

            if (memoryText == null)
            {
                memoryText = CreateTextElement("Memory: -- MB", new Vector2(-200, 180));
            }

            if (frameTimeText == null)
            {
                frameTimeText = CreateTextElement("Frame Time: -- ms", new Vector2(-200, 160));
            }

            if (drawCallsText == null)
            {
                drawCallsText = CreateTextElement("Draw Calls: --", new Vector2(-200, 140));
            }

            if (trianglesText == null)
            {
                trianglesText = CreateTextElement("Triangles: --", new Vector2(-200, 120));
            }

            if (alertsText == null)
            {
                alertsText = CreateTextElement("Alerts: None", new Vector2(-200, 100));
            }

            if (metricsScrollRect == null)
            {
                CreateMetricsScrollView();
            }
        }

        private TextMeshProUGUI CreateTextElement(string text, Vector2 position)
        {
            var textObj = new GameObject("Text_" + text.Split(':')[0]);
            textObj.transform.SetParent(dashboardCanvas.transform, false);

            var rectTransform = textObj.AddComponent<RectTransform>();
            rectTransform.anchoredPosition = position;
            rectTransform.sizeDelta = new Vector2(200, 20);

            var textComponent = textObj.AddComponent<TextMeshProUGUI>();
            textComponent.text = text;
            textComponent.fontSize = 14;
            textComponent.color = Color.white;

            return textComponent;
        }

        private void CreateMetricsScrollView()
        {
            var scrollViewObj = new GameObject("MetricsScrollView");
            scrollViewObj.transform.SetParent(dashboardCanvas.transform, false);

            var scrollRect = scrollViewObj.AddComponent<ScrollRect>();
            var rectTransform = scrollViewObj.GetComponent<RectTransform>();
            rectTransform.anchoredPosition = new Vector2(200, 0);
            rectTransform.sizeDelta = new Vector2(300, 400);

            // Create viewport
            var viewportObj = new GameObject("Viewport");
            viewportObj.transform.SetParent(scrollViewObj.transform, false);
            var viewportRect = viewportObj.AddComponent<RectTransform>();
            viewportRect.anchorMin = Vector2.zero;
            viewportRect.anchorMax = Vector2.one;
            viewportRect.offsetMin = Vector2.zero;
            viewportRect.offsetMax = Vector2.zero;

            // Create content
            var contentObj = new GameObject("Content");
            contentObj.transform.SetParent(viewportObj.transform, false);
            var contentRect = contentObj.AddComponent<RectTransform>();
            contentRect.anchorMin = new Vector2(0, 1);
            contentRect.anchorMax = new Vector2(1, 1);
            contentRect.pivot = new Vector2(0.5f, 1);
            contentRect.offsetMin = Vector2.zero;
            contentRect.offsetMax = Vector2.zero;

            scrollRect.viewport = viewportRect;
            scrollRect.content = contentRect;
            scrollRect.horizontal = false;
            scrollRect.vertical = true;

            metricsScrollRect = scrollRect;
            metricsContainer = contentObj.transform;
        }

        private void UpdateDashboard()
        {
            if (_performanceTests == null) return;

            // Update basic metrics
            UpdateBasicMetrics();

            // Update detailed metrics
            if (enableDetailedMetrics)
            {
                UpdateDetailedMetrics();
            }

            // Update alerts
            if (enableAlerts)
            {
                UpdateAlerts();
            }
        }

        private void UpdateBasicMetrics()
        {
            // FPS
            var fps = 1f / Time.unscaledDeltaTime;
            if (fpsText != null)
            {
                fpsText.text = $"FPS: {fps:F1}";
                fpsText.color = GetColorForValue(fps, 60f, 30f);
            }

            // Memory
            var memory = UnityEngine.Profiling.Profiler.GetTotalAllocatedMemory(false) / 1024f / 1024f;
            if (memoryText != null)
            {
                memoryText.text = $"Memory: {memory:F1} MB";
                memoryText.color = GetColorForValue(memory, 256f, 512f, true);
            }

            // Frame Time
            var frameTime = Time.unscaledDeltaTime * 1000f;
            if (frameTimeText != null)
            {
                frameTimeText.text = $"Frame Time: {frameTime:F1} ms";
                frameTimeText.color = GetColorForValue(frameTime, 16.67f, 33.33f, true);
            }

            // Draw Calls (simplified)
            var drawCalls = 0; // This would be more complex in a real implementation
            if (drawCallsText != null)
            {
                drawCallsText.text = $"Draw Calls: {drawCalls}";
                drawCallsText.color = GetColorForValue(drawCalls, 100, 500, true);
            }

            // Triangles (simplified)
            var triangles = 0; // This would be more complex in a real implementation
            if (trianglesText != null)
            {
                trianglesText.text = $"Triangles: {triangles}";
                trianglesText.color = GetColorForValue(triangles, 10000, 50000, true);
            }
        }

        private void UpdateDetailedMetrics()
        {
            if (_performanceTests == null || metricsContainer == null) return;

            var metrics = _performanceTests.GetMetrics();
            foreach (var kvp in metrics)
            {
                var metricName = kvp.Key;
                var metric = kvp.Value;

                if (!_metricItems.ContainsKey(metricName))
                {
                    CreateMetricItem(metricName, metric);
                }
                else
                {
                    UpdateMetricItem(metricName, metric);
                }
            }
        }

        private void CreateMetricItem(string metricName, AdvancedPerformanceTests.PerformanceMetric metric)
        {
            if (_uiPoolManager != null)
            {
                // Use pooled UI element
                var itemObj = _uiPoolManager.CreateTextElement(
                    $"{metricName}: {metric.currentValue:F2}",
                    new Vector2(0, -_metricItems.Count * 25),
                    metricsContainer
                );
                
                if (itemObj != null)
                {
                    var textComponent = itemObj.GetComponent<TextMeshProUGUI>();
                    if (textComponent != null)
                    {
                        textComponent.fontSize = 12;
                        textComponent.color = Color.white;
                    }
                    _metricItems[metricName] = itemObj;
                }
            }
            else if (metricItemPrefab == null)
            {
                // Create a simple text item (fallback)
                var itemObj = new GameObject($"Metric_{metricName}");
                itemObj.transform.SetParent(metricsContainer, false);

                var rectTransform = itemObj.AddComponent<RectTransform>();
                rectTransform.anchoredPosition = new Vector2(0, -_metricItems.Count * 25);
                rectTransform.sizeDelta = new Vector2(280, 20);

                var textComponent = itemObj.AddComponent<TextMeshProUGUI>();
                textComponent.text = $"{metricName}: {metric.currentValue:F2}";
                textComponent.fontSize = 12;
                textComponent.color = Color.white;

                _metricItems[metricName] = itemObj;
            }
            else
            {
                // Use prefab (fallback)
                var itemObj = Instantiate(metricItemPrefab, metricsContainer);
                var textComponent = itemObj.GetComponent<TextMeshProUGUI>();
                if (textComponent != null)
                {
                    textComponent.text = $"{metricName}: {metric.currentValue:F2}";
                }
                _metricItems[metricName] = itemObj;
            }
        }

        private void UpdateMetricItem(string metricName, AdvancedPerformanceTests.PerformanceMetric metric)
        {
            if (_metricItems.TryGetValue(metricName, out var itemObj))
            {
                var textComponent = itemObj.GetComponent<TextMeshProUGUI>();
                if (textComponent != null)
                {
                    textComponent.text = $"{metricName}: {metric.currentValue:F2} (Avg: {metric.averageValue:F2}, Min: {metric.minValue:F2}, Max: {metric.maxValue:F2})";
                }
            }
        }

        private void UpdateAlerts()
        {
            if (_performanceTests == null || alertsText == null) return;

            var alerts = _performanceTests.GetAlerts();
            var recentAlerts = alerts.TakeLast(5).ToList();

            if (recentAlerts.Count == 0)
            {
                alertsText.text = "Alerts: None";
                alertsText.color = goodColor;
            }
            else
            {
                var alertText = "Alerts:\n";
                foreach (var alert in recentAlerts)
                {
                    alertText += $"• {alert.message}\n";
                }
                alertsText.text = alertText.TrimEnd('\n');

                var criticalAlerts = recentAlerts.Count(a => a.level == AdvancedPerformanceTests.PerformanceAlertLevel.Critical);
                if (criticalAlerts > 0)
                {
                    alertsText.color = criticalColor;
                }
                else
                {
                    alertsText.color = warningColor;
                }
            }
        }

        private Color GetColorForValue(float value, float goodThreshold, float badThreshold, bool reverse = false)
        {
            if (reverse)
            {
                if (value <= goodThreshold) return goodColor;
                if (value >= badThreshold) return criticalColor;
                return warningColor;
            }
            else
            {
                if (value >= goodThreshold) return goodColor;
                if (value <= badThreshold) return criticalColor;
                return warningColor;
            }
        }

        #region Public API
        /// <summary>
        /// Show/hide dashboard
        /// </summary>
        public void SetDashboardVisible(bool visible)
        {
            if (dashboardCanvas != null)
            {
                dashboardCanvas.gameObject.SetActive(visible);
            }
        }

        /// <summary>
        /// Toggle dashboard visibility
        /// </summary>
        public void ToggleDashboard()
        {
            if (dashboardCanvas != null)
            {
                dashboardCanvas.gameObject.SetActive(!dashboardCanvas.gameObject.activeInHierarchy);
            }
        }

        /// <summary>
        /// Get current performance summary
        /// </summary>
        public Dictionary<string, object> GetPerformanceSummary()
        {
            var summary = new Dictionary<string, object>
            {
                {"fps", 1f / Time.unscaledDeltaTime},
                {"memory_mb", UnityEngine.Profiling.Profiler.GetTotalAllocatedMemory(false) / 1024f / 1024f},
                {"frame_time_ms", Time.unscaledDeltaTime * 1000f},
                {"total_metrics", _metricItems.Count},
                {"total_alerts", _alertMessages.Count}
            };

            if (_performanceTests != null)
            {
                var testStats = _performanceTests.GetTestStatistics();
                foreach (var kvp in testStats)
                {
                    summary[$"test_{kvp.Key}"] = kvp.Value;
                }
            }

            return summary;
        }

        /// <summary>
        /// Clear all metrics
        /// </summary>
        public void ClearMetrics()
        {
            if (_uiPoolManager != null)
            {
                // Return all elements to pool
                foreach (var item in _metricItems.Values)
                {
                    if (item != null)
                    {
                        _uiPoolManager.ReturnTextElement(item);
                    }
                }
            }
            else
            {
                // Fallback: destroy elements
                foreach (var item in _metricItems.Values)
                {
                    if (item != null)
                    {
                        DestroyImmediate(item);
                    }
                }
            }
            
            _metricItems.Clear();
            _alertMessages.Clear();
        }

        /// <summary>
        /// Export performance data
        /// </summary>
        public string ExportPerformanceData()
        {
            var data = new Dictionary<string, object>
            {
                {"timestamp", System.DateTime.Now.ToString()},
                {"performance_summary", GetPerformanceSummary()},
                {"metrics", _performanceTests?.GetMetrics() ?? new Dictionary<string, AdvancedPerformanceTests.PerformanceMetric>()},
                {"test_results", _performanceTests?.GetTestResults() ?? new List<AdvancedPerformanceTests.PerformanceTestResult>()},
                {"alerts", _performanceTests?.GetAlerts() ?? new List<AdvancedPerformanceTests.PerformanceAlert>()}
            };

            return JsonUtility.ToJson(data, true);
        }
        #endregion

        void OnDestroy()
        {
            ClearMetrics();
        }
    }
}