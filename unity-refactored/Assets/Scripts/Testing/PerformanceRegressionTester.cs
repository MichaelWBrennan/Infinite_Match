using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.IO;
using System;
using Evergreen.Core;
using Evergreen.Performance;
using Evergreen.Graphics;
using Evergreen.Audio;
using Evergreen.Data;
using Evergreen.Mobile;

namespace Evergreen.Testing
{
    /// <summary>
    /// Automated performance regression testing system for CI/CD integration
    /// </summary>
    public class PerformanceRegressionTester : MonoBehaviour
    {
        public static PerformanceRegressionTester Instance { get; private set; }

        [Header("Regression Testing Settings")]
        public bool enableRegressionTesting = true;
        public bool enableContinuousTesting = true;
        public float testInterval = 60f; // Run tests every 60 seconds
        public bool enableBaselineComparison = true;
        public bool enableThresholdTesting = true;
        public bool enableTrendAnalysis = true;

        [Header("Performance Thresholds")]
        public float minFPSThreshold = 30f;
        public float maxMemoryThresholdMB = 512f;
        public float maxCPUThreshold = 80f;
        public float maxGPUThreshold = 80f;
        public int maxDrawCallsThreshold = 1000;
        public int maxTrianglesThreshold = 100000;

        [Header("Regression Detection")]
        public float fpsRegressionThreshold = 0.1f; // 10% regression
        public float memoryRegressionThreshold = 0.2f; // 20% regression
        public float cpuRegressionThreshold = 0.15f; // 15% regression
        public float gpuRegressionThreshold = 0.15f; // 15% regression
        public int drawCallsRegressionThreshold = 100;
        public int trianglesRegressionThreshold = 10000;

        [Header("Reporting")]
        public bool enableDetailedReporting = true;
        public bool enableCSVExport = true;
        public bool enableJSONExport = true;
        public string reportPath = "PerformanceReports";
        public string baselinePath = "PerformanceBaselines";

        // Performance tracking
        private readonly List<PerformanceSnapshot> _performanceHistory = new List<PerformanceSnapshot>();
        private readonly Dictionary<string, PerformanceBaseline> _baselines = new Dictionary<string, PerformanceBaseline>();
        private readonly List<RegressionAlert> _regressionAlerts = new List<RegressionAlert>();
        
        // Testing state
        private bool _isRunningTests = false;
        private float _lastTestTime = 0f;
        private int _testRunCount = 0;
        private int _regressionCount = 0;
        private int _thresholdViolationCount = 0;

        // Performance managers
        private PerformanceManager _performanceManager;
        private GraphicsOptimizer _graphicsOptimizer;
        private OptimizedAudioManager _audioManager;
        private DataOptimizer _dataOptimizer;
        private MobileMemoryManager _mobileMemoryManager;

        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeRegressionTester();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        void Update()
        {
            if (enableRegressionTesting && enableContinuousTesting)
            {
                if (Time.time - _lastTestTime > testInterval)
                {
                    StartCoroutine(RunPerformanceTests());
                    _lastTestTime = Time.time;
                }
            }
        }

        private void InitializeRegressionTester()
        {
            // Find performance managers
            _performanceManager = FindObjectOfType<PerformanceManager>();
            _graphicsOptimizer = FindObjectOfType<GraphicsOptimizer>();
            _audioManager = FindObjectOfType<OptimizedAudioManager>();
            _dataOptimizer = FindObjectOfType<DataOptimizer>();
            _mobileMemoryManager = FindObjectOfType<MobileMemoryManager>();

            // Load baselines
            LoadPerformanceBaselines();

            // Create report directories
            CreateReportDirectories();

            Logger.Info("Performance Regression Tester initialized", "PerformanceRegressionTester");
        }

        /// <summary>
        /// Run comprehensive performance tests
        /// </summary>
        public IEnumerator RunPerformanceTests()
        {
            if (_isRunningTests) yield break;

            _isRunningTests = true;
            _testRunCount++;

            Logger.Info($"Starting performance test run #{_testRunCount}", "PerformanceRegressionTester");

            // Collect performance snapshot
            var snapshot = CollectPerformanceSnapshot();
            _performanceHistory.Add(snapshot);

            // Run threshold tests
            yield return StartCoroutine(RunThresholdTests(snapshot));

            // Run regression tests
            yield return StartCoroutine(RunRegressionTests(snapshot));

            // Run trend analysis
            if (enableTrendAnalysis)
            {
                yield return StartCoroutine(RunTrendAnalysis());
            }

            // Generate reports
            if (enableDetailedReporting)
            {
                yield return StartCoroutine(GenerateReports());
            }

            _isRunningTests = false;

            Logger.Info($"Performance test run #{_testRunCount} completed", "PerformanceRegressionTester");
        }

        /// <summary>
        /// Collect current performance snapshot
        /// </summary>
        private PerformanceSnapshot CollectPerformanceSnapshot()
        {
            var snapshot = new PerformanceSnapshot
            {
                Timestamp = DateTime.Now,
                TestRunId = _testRunCount,
                FPS = _performanceManager?.GetFPS() ?? 0f,
                MemoryUsageMB = _performanceManager?.GetMemoryUsage() / (1024f * 1024f) ?? 0f,
                CPUUsage = _performanceManager?.GetCPUUsage() ?? 0f,
                GPUUsage = _performanceManager?.GetGPUUsage() ?? 0f,
                DrawCalls = _performanceManager?.GetDrawCalls() ?? 0,
                Triangles = _performanceManager?.GetTriangles() ?? 0,
                Vertices = _performanceManager?.GetVertices() ?? 0,
                Batches = _performanceManager?.GetBatches() ?? 0,
                AudioMemoryMB = _performanceManager?.GetAudioMemory() / (1024f * 1024f) ?? 0f,
                TextureMemoryMB = _performanceManager?.GetTextureMemory() / (1024f * 1024f) ?? 0f,
                MeshMemoryMB = _performanceManager?.GetMeshMemory() / (1024f * 1024f) ?? 0f,
                Platform = Application.platform.ToString(),
                QualityLevel = QualitySettings.GetQualityLevel(),
                TargetFrameRate = Application.targetFrameRate,
                SystemMemoryMB = SystemInfo.systemMemorySize,
                ProcessorCount = SystemInfo.processorCount,
                ProcessorFrequency = SystemInfo.processorFrequency,
                GraphicsDeviceName = SystemInfo.graphicsDeviceName,
                GraphicsMemoryMB = SystemInfo.graphicsMemorySize,
                GraphicsDeviceType = SystemInfo.graphicsDeviceType.ToString(),
                OperatingSystem = SystemInfo.operatingSystem,
                DeviceModel = SystemInfo.deviceModel,
                DeviceName = SystemInfo.deviceName
            };

            return snapshot;
        }

        /// <summary>
        /// Run threshold tests
        /// </summary>
        private IEnumerator RunThresholdTests(PerformanceSnapshot snapshot)
        {
            var violations = new List<ThresholdViolation>();

            // FPS threshold test
            if (snapshot.FPS < minFPSThreshold)
            {
                violations.Add(new ThresholdViolation
                {
                    Metric = "FPS",
                    Value = snapshot.FPS,
                    Threshold = minFPSThreshold,
                    Severity = GetViolationSeverity(snapshot.FPS, minFPSThreshold, true)
                });
            }

            // Memory threshold test
            if (snapshot.MemoryUsageMB > maxMemoryThresholdMB)
            {
                violations.Add(new ThresholdViolation
                {
                    Metric = "Memory",
                    Value = snapshot.MemoryUsageMB,
                    Threshold = maxMemoryThresholdMB,
                    Severity = GetViolationSeverity(snapshot.MemoryUsageMB, maxMemoryThresholdMB, false)
                });
            }

            // CPU threshold test
            if (snapshot.CPUUsage > maxCPUThreshold)
            {
                violations.Add(new ThresholdViolation
                {
                    Metric = "CPU",
                    Value = snapshot.CPUUsage,
                    Threshold = maxCPUThreshold,
                    Severity = GetViolationSeverity(snapshot.CPUUsage, maxCPUThreshold, false)
                });
            }

            // GPU threshold test
            if (snapshot.GPUUsage > maxGPUThreshold)
            {
                violations.Add(new ThresholdViolation
                {
                    Metric = "GPU",
                    Value = snapshot.GPUUsage,
                    Threshold = maxGPUThreshold,
                    Severity = GetViolationSeverity(snapshot.GPUUsage, maxGPUThreshold, false)
                });
            }

            // Draw calls threshold test
            if (snapshot.DrawCalls > maxDrawCallsThreshold)
            {
                violations.Add(new ThresholdViolation
                {
                    Metric = "DrawCalls",
                    Value = snapshot.DrawCalls,
                    Threshold = maxDrawCallsThreshold,
                    Severity = GetViolationSeverity(snapshot.DrawCalls, maxDrawCallsThreshold, false)
                });
            }

            // Triangles threshold test
            if (snapshot.Triangles > maxTrianglesThreshold)
            {
                violations.Add(new ThresholdViolation
                {
                    Metric = "Triangles",
                    Value = snapshot.Triangles,
                    Threshold = maxTrianglesThreshold,
                    Severity = GetViolationSeverity(snapshot.Triangles, maxTrianglesThreshold, false)
                });
            }

            // Process violations
            foreach (var violation in violations)
            {
                _thresholdViolationCount++;
                Logger.Warning($"Threshold violation: {violation.Metric} = {violation.Value} (threshold: {violation.Threshold})", "PerformanceRegressionTester");
            }

            yield return null;
        }

        /// <summary>
        /// Run regression tests
        /// </summary>
        private IEnumerator RunRegressionTests(PerformanceSnapshot snapshot)
        {
            if (!enableBaselineComparison || _baselines.Count == 0)
            {
                yield break;
            }

            var regressions = new List<RegressionAlert>();

            // Compare with baselines
            foreach (var baseline in _baselines.Values)
            {
                // FPS regression test
                if (baseline.FPS > 0 && snapshot.FPS < baseline.FPS * (1f - fpsRegressionThreshold))
                {
                    regressions.Add(new RegressionAlert
                    {
                        Metric = "FPS",
                        CurrentValue = snapshot.FPS,
                        BaselineValue = baseline.FPS,
                        RegressionPercentage = (baseline.FPS - snapshot.FPS) / baseline.FPS * 100f,
                        Severity = GetRegressionSeverity(snapshot.FPS, baseline.FPS, fpsRegressionThreshold, true)
                    });
                }

                // Memory regression test
                if (baseline.MemoryUsageMB > 0 && snapshot.MemoryUsageMB > baseline.MemoryUsageMB * (1f + memoryRegressionThreshold))
                {
                    regressions.Add(new RegressionAlert
                    {
                        Metric = "Memory",
                        CurrentValue = snapshot.MemoryUsageMB,
                        BaselineValue = baseline.MemoryUsageMB,
                        RegressionPercentage = (snapshot.MemoryUsageMB - baseline.MemoryUsageMB) / baseline.MemoryUsageMB * 100f,
                        Severity = GetRegressionSeverity(snapshot.MemoryUsageMB, baseline.MemoryUsageMB, memoryRegressionThreshold, false)
                    });
                }

                // CPU regression test
                if (baseline.CPUUsage > 0 && snapshot.CPUUsage > baseline.CPUUsage * (1f + cpuRegressionThreshold))
                {
                    regressions.Add(new RegressionAlert
                    {
                        Metric = "CPU",
                        CurrentValue = snapshot.CPUUsage,
                        BaselineValue = baseline.CPUUsage,
                        RegressionPercentage = (snapshot.CPUUsage - baseline.CPUUsage) / baseline.CPUUsage * 100f,
                        Severity = GetRegressionSeverity(snapshot.CPUUsage, baseline.CPUUsage, cpuRegressionThreshold, false)
                    });
                }

                // GPU regression test
                if (baseline.GPUUsage > 0 && snapshot.GPUUsage > baseline.GPUUsage * (1f + gpuRegressionThreshold))
                {
                    regressions.Add(new RegressionAlert
                    {
                        Metric = "GPU",
                        CurrentValue = snapshot.GPUUsage,
                        BaselineValue = baseline.GPUUsage,
                        RegressionPercentage = (snapshot.GPUUsage - baseline.GPUUsage) / baseline.GPUUsage * 100f,
                        Severity = GetRegressionSeverity(snapshot.GPUUsage, baseline.GPUUsage, gpuRegressionThreshold, false)
                    });
                }

                // Draw calls regression test
                if (baseline.DrawCalls > 0 && snapshot.DrawCalls > baseline.DrawCalls + drawCallsRegressionThreshold)
                {
                    regressions.Add(new RegressionAlert
                    {
                        Metric = "DrawCalls",
                        CurrentValue = snapshot.DrawCalls,
                        BaselineValue = baseline.DrawCalls,
                        RegressionPercentage = (snapshot.DrawCalls - baseline.DrawCalls) / (float)baseline.DrawCalls * 100f,
                        Severity = GetRegressionSeverity(snapshot.DrawCalls, baseline.DrawCalls, drawCallsRegressionThreshold, false)
                    });
                }

                // Triangles regression test
                if (baseline.Triangles > 0 && snapshot.Triangles > baseline.Triangles + trianglesRegressionThreshold)
                {
                    regressions.Add(new RegressionAlert
                    {
                        Metric = "Triangles",
                        CurrentValue = snapshot.Triangles,
                        BaselineValue = baseline.Triangles,
                        RegressionPercentage = (snapshot.Triangles - baseline.Triangles) / (float)baseline.Triangles * 100f,
                        Severity = GetRegressionSeverity(snapshot.Triangles, baseline.Triangles, trianglesRegressionThreshold, false)
                    });
                }
            }

            // Process regressions
            foreach (var regression in regressions)
            {
                _regressionCount++;
                _regressionAlerts.Add(regression);
                Logger.Warning($"Performance regression detected: {regression.Metric} - Current: {regression.CurrentValue}, Baseline: {regression.BaselineValue}, Regression: {regression.RegressionPercentage:F1}%", "PerformanceRegressionTester");
            }

            yield return null;
        }

        /// <summary>
        /// Run trend analysis
        /// </summary>
        private IEnumerator RunTrendAnalysis()
        {
            if (_performanceHistory.Count < 10) yield break;

            // Analyze trends over last 10 snapshots
            var recentSnapshots = _performanceHistory.GetRange(_performanceHistory.Count - 10, 10);
            
            // Calculate trends
            var fpsTrend = CalculateTrend(recentSnapshots, s => s.FPS);
            var memoryTrend = CalculateTrend(recentSnapshots, s => s.MemoryUsageMB);
            var cpuTrend = CalculateTrend(recentSnapshots, s => s.CPUUsage);
            var gpuTrend = CalculateTrend(recentSnapshots, s => s.GPUUsage);

            // Log trends
            Logger.Info($"Performance trends - FPS: {fpsTrend:F2}, Memory: {memoryTrend:F2}, CPU: {cpuTrend:F2}, GPU: {gpuTrend:F2}", "PerformanceRegressionTester");

            yield return null;
        }

        /// <summary>
        /// Generate performance reports
        /// </summary>
        private IEnumerator GenerateReports()
        {
            // Generate CSV report
            if (enableCSVExport)
            {
                yield return StartCoroutine(GenerateCSVReport());
            }

            // Generate JSON report
            if (enableJSONExport)
            {
                yield return StartCoroutine(GenerateJSONReport());
            }

            yield return null;
        }

        /// <summary>
        /// Generate CSV performance report
        /// </summary>
        private IEnumerator GenerateCSVReport()
        {
            var csvPath = Path.Combine(reportPath, $"performance_report_{DateTime.Now:yyyyMMdd_HHmmss}.csv");
            
            using (var writer = new StreamWriter(csvPath))
            {
                // Write header
                writer.WriteLine("Timestamp,TestRunId,FPS,MemoryMB,CPU,GPU,DrawCalls,Triangles,Vertices,Batches,AudioMemoryMB,TextureMemoryMB,MeshMemoryMB,Platform,QualityLevel,TargetFrameRate");
                
                // Write data
                foreach (var snapshot in _performanceHistory)
                {
                    writer.WriteLine($"{snapshot.Timestamp:yyyy-MM-dd HH:mm:ss},{snapshot.TestRunId},{snapshot.FPS:F2},{snapshot.MemoryUsageMB:F2},{snapshot.CPUUsage:F2},{snapshot.GPUUsage:F2},{snapshot.DrawCalls},{snapshot.Triangles},{snapshot.Vertices},{snapshot.Batches},{snapshot.AudioMemoryMB:F2},{snapshot.TextureMemoryMB:F2},{snapshot.MeshMemoryMB:F2},{snapshot.Platform},{snapshot.QualityLevel},{snapshot.TargetFrameRate}");
                }
            }

            Logger.Info($"CSV report generated: {csvPath}", "PerformanceRegressionTester");
            yield return null;
        }

        /// <summary>
        /// Generate JSON performance report
        /// </summary>
        private IEnumerator GenerateJSONReport()
        {
            var jsonPath = Path.Combine(reportPath, $"performance_report_{DateTime.Now:yyyyMMdd_HHmmss}.json");
            
            var report = new PerformanceReport
            {
                GeneratedAt = DateTime.Now,
                TestRunCount = _testRunCount,
                RegressionCount = _regressionCount,
                ThresholdViolationCount = _thresholdViolationCount,
                Snapshots = _performanceHistory,
                Regressions = _regressionAlerts,
                Summary = new PerformanceSummary
                {
                    AverageFPS = CalculateAverage(_performanceHistory, s => s.FPS),
                    AverageMemoryMB = CalculateAverage(_performanceHistory, s => s.MemoryUsageMB),
                    AverageCPU = CalculateAverage(_performanceHistory, s => s.CPUUsage),
                    AverageGPU = CalculateAverage(_performanceHistory, s => s.GPUUsage),
                    AverageDrawCalls = CalculateAverage(_performanceHistory, s => s.DrawCalls),
                    AverageTriangles = CalculateAverage(_performanceHistory, s => s.Triangles)
                }
            };

            var json = JsonUtility.ToJson(report, true);
            File.WriteAllText(jsonPath, json);

            Logger.Info($"JSON report generated: {jsonPath}", "PerformanceRegressionTester");
            yield return null;
        }

        /// <summary>
        /// Load performance baselines
        /// </summary>
        private void LoadPerformanceBaselines()
        {
            var baselineFile = Path.Combine(baselinePath, "performance_baseline.json");
            
            if (File.Exists(baselineFile))
            {
                try
                {
                    var json = File.ReadAllText(baselineFile);
                    var baseline = JsonUtility.FromJson<PerformanceBaseline>(json);
                    _baselines["default"] = baseline;
                    Logger.Info("Performance baseline loaded", "PerformanceRegressionTester");
                }
                catch (Exception e)
                {
                    Logger.Error($"Failed to load performance baseline: {e.Message}", "PerformanceRegressionTester");
                }
            }
            else
            {
                Logger.Warning("No performance baseline found. Create one by running SetBaseline()", "PerformanceRegressionTester");
            }
        }

        /// <summary>
        /// Create report directories
        /// </summary>
        private void CreateReportDirectories()
        {
            if (!Directory.Exists(reportPath))
            {
                Directory.CreateDirectory(reportPath);
            }
            
            if (!Directory.Exists(baselinePath))
            {
                Directory.CreateDirectory(baselinePath);
            }
        }

        /// <summary>
        /// Set performance baseline
        /// </summary>
        public void SetBaseline(string name = "default")
        {
            var snapshot = CollectPerformanceSnapshot();
            var baseline = new PerformanceBaseline
            {
                Name = name,
                SetAt = DateTime.Now,
                FPS = snapshot.FPS,
                MemoryUsageMB = snapshot.MemoryUsageMB,
                CPUUsage = snapshot.CPUUsage,
                GPUUsage = snapshot.GPUUsage,
                DrawCalls = snapshot.DrawCalls,
                Triangles = snapshot.Triangles,
                Vertices = snapshot.Vertices,
                Batches = snapshot.Batches,
                AudioMemoryMB = snapshot.AudioMemoryMB,
                TextureMemoryMB = snapshot.TextureMemoryMB,
                MeshMemoryMB = snapshot.MeshMemoryMB,
                Platform = snapshot.Platform,
                QualityLevel = snapshot.QualityLevel,
                TargetFrameRate = snapshot.TargetFrameRate
            };

            _baselines[name] = baseline;

            // Save to file
            var baselineFile = Path.Combine(baselinePath, "performance_baseline.json");
            var json = JsonUtility.ToJson(baseline, true);
            File.WriteAllText(baselineFile, json);

            Logger.Info($"Performance baseline '{name}' set", "PerformanceRegressionTester");
        }

        /// <summary>
        /// Get violation severity
        /// </summary>
        private Severity GetViolationSeverity(float value, float threshold, bool lowerIsBetter)
        {
            float ratio = lowerIsBetter ? threshold / value : value / threshold;
            
            if (ratio > 2f) return Severity.Critical;
            if (ratio > 1.5f) return Severity.High;
            if (ratio > 1.2f) return Severity.Medium;
            return Severity.Low;
        }

        /// <summary>
        /// Get regression severity
        /// </summary>
        private Severity GetRegressionSeverity(float current, float baseline, float threshold, bool lowerIsBetter)
        {
            float regression = lowerIsBetter ? (baseline - current) / baseline : (current - baseline) / baseline;
            
            if (regression > threshold * 2f) return Severity.Critical;
            if (regression > threshold * 1.5f) return Severity.High;
            if (regression > threshold) return Severity.Medium;
            return Severity.Low;
        }

        /// <summary>
        /// Calculate trend
        /// </summary>
        private float CalculateTrend(List<PerformanceSnapshot> snapshots, Func<PerformanceSnapshot, float> selector)
        {
            if (snapshots.Count < 2) return 0f;
            
            float sum = 0f;
            for (int i = 1; i < snapshots.Count; i++)
            {
                sum += selector(snapshots[i]) - selector(snapshots[i - 1]);
            }
            
            return sum / (snapshots.Count - 1);
        }

        /// <summary>
        /// Calculate average
        /// </summary>
        private float CalculateAverage(List<PerformanceSnapshot> snapshots, Func<PerformanceSnapshot, float> selector)
        {
            if (snapshots.Count == 0) return 0f;
            
            float sum = 0f;
            foreach (var snapshot in snapshots)
            {
                sum += selector(snapshot);
            }
            
            return sum / snapshots.Count;
        }

        /// <summary>
        /// Get performance statistics
        /// </summary>
        public Dictionary<string, object> GetPerformanceStatistics()
        {
            return new Dictionary<string, object>
            {
                {"test_run_count", _testRunCount},
                {"regression_count", _regressionCount},
                {"threshold_violation_count", _thresholdViolationCount},
                {"snapshot_count", _performanceHistory.Count},
                {"baseline_count", _baselines.Count},
                {"is_running_tests", _isRunningTests},
                {"last_test_time", _lastTestTime}
            };
        }

        // Data structures
        [System.Serializable]
        public class PerformanceSnapshot
        {
            public DateTime Timestamp;
            public int TestRunId;
            public float FPS;
            public float MemoryUsageMB;
            public float CPUUsage;
            public float GPUUsage;
            public int DrawCalls;
            public int Triangles;
            public int Vertices;
            public int Batches;
            public float AudioMemoryMB;
            public float TextureMemoryMB;
            public float MeshMemoryMB;
            public string Platform;
            public int QualityLevel;
            public int TargetFrameRate;
            public int SystemMemoryMB;
            public int ProcessorCount;
            public int ProcessorFrequency;
            public string GraphicsDeviceName;
            public int GraphicsMemoryMB;
            public string GraphicsDeviceType;
            public string OperatingSystem;
            public string DeviceModel;
            public string DeviceName;
        }

        [System.Serializable]
        public class PerformanceBaseline
        {
            public string Name;
            public DateTime SetAt;
            public float FPS;
            public float MemoryUsageMB;
            public float CPUUsage;
            public float GPUUsage;
            public int DrawCalls;
            public int Triangles;
            public int Vertices;
            public int Batches;
            public float AudioMemoryMB;
            public float TextureMemoryMB;
            public float MeshMemoryMB;
            public string Platform;
            public int QualityLevel;
            public int TargetFrameRate;
        }

        [System.Serializable]
        public class ThresholdViolation
        {
            public string Metric;
            public float Value;
            public float Threshold;
            public Severity Severity;
        }

        [System.Serializable]
        public class RegressionAlert
        {
            public string Metric;
            public float CurrentValue;
            public float BaselineValue;
            public float RegressionPercentage;
            public Severity Severity;
        }

        [System.Serializable]
        public class PerformanceReport
        {
            public DateTime GeneratedAt;
            public int TestRunCount;
            public int RegressionCount;
            public int ThresholdViolationCount;
            public List<PerformanceSnapshot> Snapshots;
            public List<RegressionAlert> Regressions;
            public PerformanceSummary Summary;
        }

        [System.Serializable]
        public class PerformanceSummary
        {
            public float AverageFPS;
            public float AverageMemoryMB;
            public float AverageCPU;
            public float AverageGPU;
            public float AverageDrawCalls;
            public float AverageTriangles;
        }

        public enum Severity
        {
            Low,
            Medium,
            High,
            Critical
        }
    }
}