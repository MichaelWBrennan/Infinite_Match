using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Evergreen.Performance;

namespace Evergreen.Performance
{
    /// <summary>
    /// PERFORMANCE DASHBOARD - Real-time monitoring of all performance metrics
    /// </summary>
    public class PerformanceDashboard : MonoBehaviour
    {
        [Header("Dashboard UI")]
        [SerializeField] private Canvas dashboardCanvas;
        [SerializeField] private TextMeshProUGUI engagementText;
        [SerializeField] private TextMeshProUGUI retentionText;
        [SerializeField] private TextMeshProUGUI arpuText;
        [SerializeField] private TextMeshProUGUI contentText;
        [SerializeField] private TextMeshProUGUI satisfactionText;
        [SerializeField] private TextMeshProUGUI overallText;
        
        [Header("Progress Bars")]
        [SerializeField] private Slider engagementSlider;
        [SerializeField] private Slider retentionSlider;
        [SerializeField] private Slider arpuSlider;
        [SerializeField] private Slider contentSlider;
        [SerializeField] private Slider satisfactionSlider;
        [SerializeField] private Slider overallSlider;
        
        [Header("Target Indicators")]
        [SerializeField] private Image engagementTarget;
        [SerializeField] private Image retentionTarget;
        [SerializeField] private Image arpuTarget;
        [SerializeField] private Image contentTarget;
        [SerializeField] private Image satisfactionTarget;
        [SerializeField] private Image overallTarget;
        
        [Header("Dashboard Settings")]
        [SerializeField] private bool enableRealTimeUpdates = true;
        [SerializeField] private float updateInterval = 1f;
        [SerializeField] private bool showTargets = true;
        [SerializeField] private bool enableAlerts = true;
        
        // System References
        private UltimatePerformanceMaximizer _performanceMaximizer;
        private EngagementOptimizer _engagementOptimizer;
        private RetentionOptimizer _retentionOptimizer;
        private MonetizationOptimizer _monetizationOptimizer;
        private ContentOptimizer _contentOptimizer;
        private SatisfactionOptimizer _satisfactionOptimizer;
        
        // Performance Data
        private PerformanceMetrics _currentMetrics;
        private PerformanceTargets _targets;
        private Dictionary<string, float> _optimizationScores;
        
        // Events
        public static event Action<PerformanceMetrics> OnDashboardUpdated;
        public static event Action<string> OnTargetAchieved;
        
        void Start()
        {
            InitializeDashboard();
            StartCoroutine(UpdateDashboardLoop());
        }
        
        private void InitializeDashboard()
        {
            // Get system references
            _performanceMaximizer = FindObjectOfType<UltimatePerformanceMaximizer>();
            _engagementOptimizer = FindObjectOfType<EngagementOptimizer>();
            _retentionOptimizer = FindObjectOfType<RetentionOptimizer>();
            _monetizationOptimizer = FindObjectOfType<MonetizationOptimizer>();
            _contentOptimizer = FindObjectOfType<ContentOptimizer>();
            _satisfactionOptimizer = FindObjectOfType<SatisfactionOptimizer>();
            
            // Subscribe to events
            if (_performanceMaximizer != null)
            {
                UltimatePerformanceMaximizer.OnMetricsUpdated += OnMetricsUpdated;
                UltimatePerformanceMaximizer.OnTargetsAchieved += OnTargetsAchieved;
            }
            
            if (_engagementOptimizer != null)
            {
                EngagementOptimizer.OnEngagementScoreChanged += OnEngagementScoreChanged;
                EngagementOptimizer.OnEngagementOptimized += OnEngagementOptimized;
            }
            
            if (_retentionOptimizer != null)
            {
                RetentionOptimizer.OnRetentionRatesChanged += OnRetentionRatesChanged;
                RetentionOptimizer.OnRetentionOptimized += OnRetentionOptimized;
            }
            
            if (_monetizationOptimizer != null)
            {
                MonetizationOptimizer.OnARPUChanged += OnARPUChanged;
                MonetizationOptimizer.OnMonetizationOptimized += OnMonetizationOptimized;
            }
            
            if (_contentOptimizer != null)
            {
                ContentOptimizer.OnContentEfficiencyChanged += OnContentEfficiencyChanged;
                ContentOptimizer.OnContentOptimized += OnContentOptimized;
            }
            
            if (_satisfactionOptimizer != null)
            {
                SatisfactionOptimizer.OnSatisfactionChanged += OnSatisfactionChanged;
                SatisfactionOptimizer.OnSatisfactionOptimized += OnSatisfactionOptimized;
            }
            
            // Initialize UI
            InitializeUI();
        }
        
        private void InitializeUI()
        {
            // Initialize progress bars
            if (engagementSlider != null)
            {
                engagementSlider.minValue = 0f;
                engagementSlider.maxValue = 100f;
            }
            
            if (retentionSlider != null)
            {
                retentionSlider.minValue = 0f;
                retentionSlider.maxValue = 100f;
            }
            
            if (arpuSlider != null)
            {
                arpuSlider.minValue = 0f;
                arpuSlider.maxValue = 5f; // $5 max
            }
            
            if (contentSlider != null)
            {
                contentSlider.minValue = 0f;
                contentSlider.maxValue = 100f;
            }
            
            if (satisfactionSlider != null)
            {
                satisfactionSlider.minValue = 0f;
                satisfactionSlider.maxValue = 5f; // 5 stars max
            }
            
            if (overallSlider != null)
            {
                overallSlider.minValue = 0f;
                overallSlider.maxValue = 100f;
            }
        }
        
        private IEnumerator UpdateDashboardLoop()
        {
            while (enableRealTimeUpdates)
            {
                UpdateDashboard();
                yield return new WaitForSeconds(updateInterval);
            }
        }
        
        private void UpdateDashboard()
        {
            // Get current metrics
            if (_performanceMaximizer != null)
            {
                _currentMetrics = _performanceMaximizer.GetCurrentMetrics();
                _targets = _performanceMaximizer.GetTargets();
                _optimizationScores = _performanceMaximizer.GetOptimizationScores();
            }
            
            // Update UI elements
            UpdateEngagementDisplay();
            UpdateRetentionDisplay();
            UpdateARPUDisplay();
            UpdateContentDisplay();
            UpdateSatisfactionDisplay();
            UpdateOverallDisplay();
            
            // Update target indicators
            UpdateTargetIndicators();
            
            // Trigger dashboard update event
            OnDashboardUpdated?.Invoke(_currentMetrics);
        }
        
        private void UpdateEngagementDisplay()
        {
            if (engagementText != null)
            {
                float score = _currentMetrics?.engagementScore ?? 0f;
                engagementText.text = $"Engagement: {score:F1}%";
            }
            
            if (engagementSlider != null)
            {
                engagementSlider.value = _currentMetrics?.engagementScore ?? 0f;
            }
        }
        
        private void UpdateRetentionDisplay()
        {
            if (retentionText != null)
            {
                float day1 = _currentMetrics?.day1Retention ?? 0f;
                float day7 = _currentMetrics?.day7Retention ?? 0f;
                float day30 = _currentMetrics?.day30Retention ?? 0f;
                retentionText.text = $"Retention: D1:{day1:F1}% D7:{day7:F1}% D30:{day30:F1}%";
            }
            
            if (retentionSlider != null)
            {
                float avgRetention = ((_currentMetrics?.day1Retention ?? 0f) + 
                                    (_currentMetrics?.day7Retention ?? 0f) + 
                                    (_currentMetrics?.day30Retention ?? 0f)) / 3f;
                retentionSlider.value = avgRetention;
            }
        }
        
        private void UpdateARPUDisplay()
        {
            if (arpuText != null)
            {
                float arpu = _currentMetrics?.arpu ?? 0f;
                arpuText.text = $"ARPU: ${arpu:F2}";
            }
            
            if (arpuSlider != null)
            {
                arpuSlider.value = _currentMetrics?.arpu ?? 0f;
            }
        }
        
        private void UpdateContentDisplay()
        {
            if (contentText != null)
            {
                float efficiency = _currentMetrics?.contentCreationEfficiency ?? 0f;
                contentText.text = $"Content: {efficiency:F1}%";
            }
            
            if (contentSlider != null)
            {
                contentSlider.value = _currentMetrics?.contentCreationEfficiency ?? 0f;
            }
        }
        
        private void UpdateSatisfactionDisplay()
        {
            if (satisfactionText != null)
            {
                float satisfaction = _currentMetrics?.playerSatisfaction ?? 0f;
                satisfactionText.text = $"Satisfaction: {satisfaction:F1}/5";
            }
            
            if (satisfactionSlider != null)
            {
                satisfactionSlider.value = _currentMetrics?.playerSatisfaction ?? 0f;
            }
        }
        
        private void UpdateOverallDisplay()
        {
            if (overallText != null)
            {
                float overall = _currentMetrics?.overallPerformance ?? 0f;
                overallText.text = $"Overall: {overall:F1}%";
            }
            
            if (overallSlider != null)
            {
                overallSlider.value = _currentMetrics?.overallPerformance ?? 0f;
            }
        }
        
        private void UpdateTargetIndicators()
        {
            if (!showTargets) return;
            
            // Update target indicators based on achievement status
            UpdateTargetIndicator(engagementTarget, _performanceMaximizer?.IsTargetAchieved("engagement") ?? false);
            UpdateTargetIndicator(retentionTarget, _performanceMaximizer?.IsTargetAchieved("retention") ?? false);
            UpdateTargetIndicator(arpuTarget, _performanceMaximizer?.IsTargetAchieved("arpu") ?? false);
            UpdateTargetIndicator(contentTarget, _performanceMaximizer?.IsTargetAchieved("content") ?? false);
            UpdateTargetIndicator(satisfactionTarget, _performanceMaximizer?.IsTargetAchieved("satisfaction") ?? false);
            UpdateTargetIndicator(overallTarget, _performanceMaximizer?.GetOverallPerformance() >= 100f);
        }
        
        private void UpdateTargetIndicator(Image targetImage, bool isAchieved)
        {
            if (targetImage != null)
            {
                targetImage.color = isAchieved ? Color.green : Color.red;
            }
        }
        
        // Event Handlers
        private void OnMetricsUpdated(PerformanceMetrics metrics)
        {
            _currentMetrics = metrics;
            UpdateDashboard();
        }
        
        private void OnTargetsAchieved(PerformanceTargets targets)
        {
            OnTargetAchieved?.Invoke("ALL TARGETS ACHIEVED! 100% Performance Reached!");
            Debug.Log("🎉 ALL PERFORMANCE TARGETS ACHIEVED! 100% Performance Reached!");
        }
        
        private void OnEngagementScoreChanged(float score)
        {
            if (engagementText != null)
            {
                engagementText.text = $"Engagement: {score:F1}%";
            }
            if (engagementSlider != null)
            {
                engagementSlider.value = score;
            }
        }
        
        private void OnEngagementOptimized(string message)
        {
            Debug.Log($"[PerformanceDashboard] Engagement Optimized: {message}");
        }
        
        private void OnRetentionRatesChanged(float day1, float day7, float day30)
        {
            if (retentionText != null)
            {
                retentionText.text = $"Retention: D1:{day1:F1}% D7:{day7:F1}% D30:{day30:F1}%";
            }
        }
        
        private void OnRetentionOptimized(string message)
        {
            Debug.Log($"[PerformanceDashboard] Retention Optimized: {message}");
        }
        
        private void OnARPUChanged(float arpu)
        {
            if (arpuText != null)
            {
                arpuText.text = $"ARPU: ${arpu:F2}";
            }
            if (arpuSlider != null)
            {
                arpuSlider.value = arpu;
            }
        }
        
        private void OnMonetizationOptimized(string message)
        {
            Debug.Log($"[PerformanceDashboard] Monetization Optimized: {message}");
        }
        
        private void OnContentEfficiencyChanged(float efficiency)
        {
            if (contentText != null)
            {
                contentText.text = $"Content: {efficiency:F1}%";
            }
            if (contentSlider != null)
            {
                contentSlider.value = efficiency;
            }
        }
        
        private void OnContentOptimized(string message)
        {
            Debug.Log($"[PerformanceDashboard] Content Optimized: {message}");
        }
        
        private void OnSatisfactionChanged(float satisfaction)
        {
            if (satisfactionText != null)
            {
                satisfactionText.text = $"Satisfaction: {satisfaction:F1}/5";
            }
            if (satisfactionSlider != null)
            {
                satisfactionSlider.value = satisfaction;
            }
        }
        
        private void OnSatisfactionOptimized(string message)
        {
            Debug.Log($"[PerformanceDashboard] Satisfaction Optimized: {message}");
        }
        
        // Public API
        public void ToggleDashboard()
        {
            if (dashboardCanvas != null)
            {
                dashboardCanvas.gameObject.SetActive(!dashboardCanvas.gameObject.activeSelf);
            }
        }
        
        public void ForceUpdate()
        {
            UpdateDashboard();
        }
        
        public PerformanceMetrics GetCurrentMetrics() => _currentMetrics;
        public PerformanceTargets GetTargets() => _targets;
        public Dictionary<string, float> GetOptimizationScores() => _optimizationScores;
    }
}