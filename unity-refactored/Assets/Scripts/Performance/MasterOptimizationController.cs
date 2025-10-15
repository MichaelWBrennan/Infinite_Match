using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using Evergreen.Core;
using Evergreen.Match3;
using Evergreen.Graphics;
using Evergreen.Data;
using Evergreen.Performance;
using Evergreen.AI;
using Evergreen.Mobile;

namespace Evergreen.Performance
{
    /// <summary>
    /// Master optimization controller that orchestrates all optimization systems
    /// Provides unified interface for managing all performance optimizations
    /// </summary>
    public class MasterOptimizationController : MonoBehaviour
    {
        public static MasterOptimizationController Instance { get; private set; }

        [Header("System Management")]
        public bool enableAllOptimizations = true;
        public bool enableAutoOptimization = true;
        public bool enablePerformanceMonitoring = true;
        public float optimizationCheckInterval = 5f;

        [Header("Priority Settings")]
        public OptimizationPriority[] optimizationPriorities = {
            new OptimizationPriority { system = "MatchDetection", priority = 1 },
            new OptimizationPriority { system = "TextureAtlas", priority = 2 },
            new OptimizationPriority { system = "PredictiveCache", priority = 3 },
            new OptimizationPriority { system = "FramePacing", priority = 4 },
            new OptimizationPriority { system = "MobileOptimization", priority = 5 },
            new OptimizationPriority { system = "AIValidation", priority = 6 }
        };

        // Optimization systems
        private OptimizedMatchDetector _matchDetector;
        private TextureAtlasManager _atlasManager;
        private PredictiveCacheManager _cacheManager;
        private FramePacingManager _framePacingManager;
        private AdvancedMobileOptimizer _mobileOptimizer;
        private LevelValidationAI _levelValidator;

        // Performance monitoring
        private Dictionary<string, OptimizationSystem> _optimizationSystems = new Dictionary<string, OptimizationSystem>();
        private List<PerformanceAlert> _performanceAlerts = new List<PerformanceAlert>();
        private OptimizationReport _currentReport;

        // Statistics
        private MasterOptimizationStats _masterStats;

        [System.Serializable]
        public class OptimizationPriority
        {
            public string system;
            public int priority;
        }

        [System.Serializable]
        public class OptimizationSystem
        {
            public string name;
            public bool isEnabled;
            public bool isInitialized;
            public float performanceImpact;
            public DateTime lastOptimized;
            public Dictionary<string, object> stats;
        }

        [System.Serializable]
        public class PerformanceAlert
        {
            public string system;
            public string message;
            public AlertLevel level;
            public DateTime timestamp;
            public bool isResolved;
        }

        [System.Serializable]
        public class OptimizationReport
        {
            public DateTime generatedAt;
            public float overallPerformanceScore;
            public Dictionary<string, float> systemScores;
            public List<PerformanceAlert> alerts;
            public List<string> recommendations;
            public MasterOptimizationStats stats;
        }

        [System.Serializable]
        public class MasterOptimizationStats
        {
            public int totalOptimizations;
            public int successfulOptimizations;
            public int failedOptimizations;
            public float averageFPS;
            public float averageMemoryUsage;
            public int drawCallReduction;
            public int memoryReduction;
            public float loadingTimeImprovement;
            public float batteryLifeImprovement;
            public float thermalImprovement;
            public int levelsValidated;
            public int levelsPassed;
        }

        public enum AlertLevel
        {
            Info,
            Warning,
            Critical,
            Emergency
        }

        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeMasterController();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        void Start()
        {
            StartCoroutine(InitializeAllSystems());
            StartCoroutine(ContinuousOptimization());
        }

        private void InitializeMasterController()
        {
            _masterStats = new MasterOptimizationStats();
            _currentReport = new OptimizationReport
            {
                generatedAt = DateTime.Now,
                overallPerformanceScore = 0f,
                systemScores = new Dictionary<string, float>(),
                alerts = new List<PerformanceAlert>(),
                recommendations = new List<string>(),
                stats = _masterStats
            };

            Logger.Info("Master Optimization Controller initialized", "MasterOptimizer");
        }

        #region System Initialization
        private IEnumerator InitializeAllSystems()
        {
            Logger.Info("Initializing all optimization systems...", "MasterOptimizer");

            // Initialize Match Detection System
            yield return StartCoroutine(InitializeMatchDetectionsystemSafe());

            // Initialize Texture Atlas System
            yield return StartCoroutine(InitializeTextureAtlassystemSafe());

            // Initialize Predictive Cache System
            yield return StartCoroutine(InitializePredictiveCachesystemSafe());

            // Initialize Frame Pacing System
            yield return StartCoroutine(InitializeFramePacingsystemSafe());

            // Initialize Mobile Optimization System
            yield return StartCoroutine(InitializeMobileOptimizationsystemSafe());

            // Initialize AI Validation System
            yield return StartCoroutine(InitializeAIValidationsystemSafe());

            // Generate initial optimization report
            GenerateOptimizationReport();

            Logger.Info("All optimization systems initialized successfully", "MasterOptimizer");
        }

        private IEnumerator InitializeMatchDetectionsystemSafe()
        {
            _matchDetector = FindObjectOfType<OptimizedMatchDetector>();
            if (_matchDetector == null)
            {
                var go = new GameObject("OptimizedMatchDetector");
                _matchDetector = go.AddComponent<OptimizedMatchDetector>();
            }

            _optimizationSystems["MatchDetection"] = new OptimizationSystem
            {
                name = "Match Detection",
                isEnabled = true,
                isInitialized = true,
                performanceImpact = 0f,
                lastOptimized = DateTime.Now,
                stats = new Dictionary<string, object>()
            };

            yield return null;
        }

        private IEnumerator InitializeTextureAtlassystemSafe()
        {
            _atlasManager = FindObjectOfType<TextureAtlasManager>();
            if (_atlasManager == null)
            {
                var go = new GameObject("TextureAtlasManager");
                _atlasManager = go.AddComponent<TextureAtlasManager>();
            }

            _optimizationSystems["TextureAtlas"] = new OptimizationSystem
            {
                name = "Texture Atlas",
                isEnabled = true,
                isInitialized = true,
                performanceImpact = 0f,
                lastOptimized = DateTime.Now,
                stats = new Dictionary<string, object>()
            };

            yield return null;
        }

        private IEnumerator InitializePredictiveCachesystemSafe()
        {
            _cacheManager = FindObjectOfType<PredictiveCacheManager>();
            if (_cacheManager == null)
            {
                var go = new GameObject("PredictiveCacheManager");
                _cacheManager = go.AddComponent<PredictiveCacheManager>();
            }

            _optimizationSystems["PredictiveCache"] = new OptimizationSystem
            {
                name = "Predictive Cache",
                isEnabled = true,
                isInitialized = true,
                performanceImpact = 0f,
                lastOptimized = DateTime.Now,
                stats = new Dictionary<string, object>()
            };

            yield return null;
        }

        private IEnumerator InitializeFramePacingsystemSafe()
        {
            _framePacingManager = FindObjectOfType<FramePacingManager>();
            if (_framePacingManager == null)
            {
                var go = new GameObject("FramePacingManager");
                _framePacingManager = go.AddComponent<FramePacingManager>();
            }

            _optimizationSystems["FramePacing"] = new OptimizationSystem
            {
                name = "Frame Pacing",
                isEnabled = true,
                isInitialized = true,
                performanceImpact = 0f,
                lastOptimized = DateTime.Now,
                stats = new Dictionary<string, object>()
            };

            yield return null;
        }

        private IEnumerator InitializeMobileOptimizationsystemSafe()
        {
            _mobileOptimizer = FindObjectOfType<AdvancedMobileOptimizer>();
            if (_mobileOptimizer == null)
            {
                var go = new GameObject("AdvancedMobileOptimizer");
                _mobileOptimizer = go.AddComponent<AdvancedMobileOptimizer>();
            }

            _optimizationSystems["MobileOptimization"] = new OptimizationSystem
            {
                name = "Mobile Optimization",
                isEnabled = true,
                isInitialized = true,
                performanceImpact = 0f,
                lastOptimized = DateTime.Now,
                stats = new Dictionary<string, object>()
            };

            yield return null;
        }

        private IEnumerator InitializeAIValidationsystemSafe()
        {
            _levelValidator = FindObjectOfType<LevelValidationAI>();
            if (_levelValidator == null)
            {
                var go = new GameObject("LevelValidationAI");
                _levelValidator = go.AddComponent<LevelValidationAI>();
            }

            _optimizationSystems["AIValidation"] = new OptimizationSystem
            {
                name = "AI Validation",
                isEnabled = true,
                isInitialized = true,
                performanceImpact = 0f,
                lastOptimized = DateTime.Now,
                stats = new Dictionary<string, object>()
            };

            yield return null;
        }
        #endregion

        #region Continuous Optimization
        private IEnumerator ContinuousOptimization()
        {
            while (enableAutoOptimization)
            {
                // Update system statistics
                UpdateSystemStatistics();

                // Check for performance issues
                CheckPerformanceIssues();

                // Apply optimizations based on priority
                ApplyPriorityBasedOptimizations();

                // Generate performance alerts
                GeneratePerformanceAlerts();

                yield return new WaitForSeconds(optimizationCheckInterval);
            }
        }

        private void UpdateSystemStatistics()
        {
            // Update match detection stats
            if (_matchDetector != null)
            {
                var stats = _matchDetector.GetPerformanceStats();
                _optimizationSystems["MatchDetection"].stats = stats;
            }

            // Update texture atlas stats
            if (_atlasManager != null)
            {
                var stats = _atlasManager.GetPerformanceStats();
                _optimizationSystems["TextureAtlas"].stats = stats;
            }

            // Update cache stats
            if (_cacheManager != null)
            {
                var stats = _cacheManager.GetCacheStats();
                _optimizationSystems["PredictiveCache"].stats = stats;
            }

            // Update frame pacing stats
            if (_framePacingManager != null)
            {
                var stats = _framePacingManager.GetFramePacingStats();
                _optimizationSystems["FramePacing"].stats = stats;
            }

            // Update mobile optimization stats
            if (_mobileOptimizer != null)
            {
                var stats = _mobileOptimizer.GetOptimizationStats();
                _optimizationSystems["MobileOptimization"].stats = stats;
            }

            // Update AI validation stats
            if (_levelValidator != null)
            {
                var stats = _levelValidator.GetAIStats();
                _optimizationSystems["AIValidation"].stats = stats;
            }
        }

        private void CheckPerformanceIssues()
        {
            // Check FPS performance
            var currentFPS = 1f / Time.unscaledDeltaTime;
            if (currentFPS < 30f)
            {
                AddPerformanceAlert("FramePacing", "FPS critically low", AlertLevel.Critical);
            }
            else if (currentFPS < 45f)
            {
                AddPerformanceAlert("FramePacing", "FPS below target", AlertLevel.Warning);
            }

            // Check memory usage
            var memoryUsage = UnityEngine.Profiling.Profiler.GetTotalAllocatedMemory(false) / 1024f / 1024f;
            if (memoryUsage > 512f)
            {
                AddPerformanceAlert("MobileOptimization", "Memory usage high", AlertLevel.Warning);
            }

            // Check draw calls
            var drawCalls = GetDrawCallCount();
            if (drawCalls > 100)
            {
                AddPerformanceAlert("TextureAtlas", "Draw calls high", AlertLevel.Warning);
            }
        }

        private void ApplyPriorityBasedOptimizations()
        {
            // Sort systems by priority
            var sortedSystems = new List<KeyValuePair<string, OptimizationSystem>>(_optimizationSystems);
            sortedSystems.Sort((a, b) => 
            {
                var priorityA = GetSystemPriority(a.Key);
                var priorityB = GetSystemPriority(b.Key);
                return priorityA.CompareTo(priorityB);
            });

            // Apply optimizations in priority order
            foreach (var kvp in sortedSystems)
            {
                if (kvp.Value.isEnabled && kvp.Value.isInitialized)
                {
                    ApplySystemOptimization(kvp.Key, kvp.Value);
                }
            }
        }

        private int GetSystemPriority(string systemName)
        {
            foreach (var priority in optimizationPriorities)
            {
                if (priority.system == systemName)
                    return priority.priority;
            }
            return 999; // Default low priority
        }

        private void ApplySystemOptimization(string systemName, OptimizationSystem system)
        {
            try
            {
                switch (systemName)
                {
                    case "MatchDetection":
                        // Match detection optimizations are automatic
                        break;
                    case "TextureAtlas":
                        // Texture atlas optimizations are automatic
                        break;
                    case "PredictiveCache":
                        // Cache optimizations are automatic
                        break;
                    case "FramePacing":
                        // Frame pacing optimizations are automatic
                        break;
                    case "MobileOptimization":
                        // Mobile optimizations are automatic
                        break;
                    case "AIValidation":
                        // AI validation optimizations are automatic
                        break;
                }

                system.lastOptimized = DateTime.Now;
                _masterStats.totalOptimizations++;
                _masterStats.successfulOptimizations++;
            }
            catch (Exception e)
            {
                Logger.Error($"Failed to apply optimization for {systemName}: {e.Message}", "MasterOptimizer");
                _masterStats.failedOptimizations++;
                AddPerformanceAlert(systemName, $"Optimization failed: {e.Message}", AlertLevel.Warning);
            }
        }
        #endregion

        #region Performance Monitoring
        private void AddPerformanceAlert(string system, string message, AlertLevel level)
        {
            var alert = new PerformanceAlert
            {
                system = system,
                message = message,
                level = level,
                timestamp = DateTime.Now,
                isResolved = false
            };

            _performanceAlerts.Add(alert);

            // Log alert
            switch (level)
            {
                case AlertLevel.Info:
                    Logger.Info($"[{system}] {message}", "MasterOptimizer");
                    break;
                case AlertLevel.Warning:
                    Logger.Warning($"[{system}] {message}", "MasterOptimizer");
                    break;
                case AlertLevel.Critical:
                    Logger.Error($"[{system}] {message}", "MasterOptimizer");
                    break;
                case AlertLevel.Emergency:
                    Logger.Error($"[{system}] EMERGENCY: {message}", "MasterOptimizer");
                    break;
            }
        }

        private void GeneratePerformanceAlerts()
        {
            // Check for unresolved alerts
            var unresolvedAlerts = _performanceAlerts.FindAll(a => !a.isResolved);
            foreach (var alert in unresolvedAlerts)
            {
                // Check if alert should be resolved
                if (ShouldResolveAlert(alert))
                {
                    alert.isResolved = true;
                    Logger.Info($"[{alert.system}] Alert resolved: {alert.message}", "MasterOptimizer");
                }
            }

            // Remove old resolved alerts
            _performanceAlerts.RemoveAll(a => a.isResolved && (DateTime.Now - a.timestamp).TotalMinutes > 30);
        }

        private bool ShouldResolveAlert(PerformanceAlert alert)
        {
            // Simple resolution logic - can be enhanced
            switch (alert.system)
            {
                case "FramePacing":
                    var currentFPS = 1f / Time.unscaledDeltaTime;
                    return currentFPS > 45f;
                case "MobileOptimization":
                    var memoryUsage = UnityEngine.Profiling.Profiler.GetTotalAllocatedMemory(false) / 1024f / 1024f;
                    return memoryUsage < 400f;
                case "TextureAtlas":
                    var drawCalls = GetDrawCallCount();
                    return drawCalls < 80;
                default:
                    return false;
            }
        }

        private int GetDrawCallCount()
        {
            // Simplified draw call counting
            var renderers = FindObjectsOfType<Renderer>();
            return renderers.Length;
        }
        #endregion

        #region Report Generation
        public OptimizationReport GenerateOptimizationReport()
        {
            _currentReport = new OptimizationReport
            {
                generatedAt = DateTime.Now,
                overallPerformanceScore = CalculateOverallPerformanceScore(),
                systemScores = CalculateSystemScores(),
                alerts = new List<PerformanceAlert>(_performanceAlerts),
                recommendations = GenerateRecommendations(),
                stats = _masterStats
            };

            return _currentReport;
        }

        private float CalculateOverallPerformanceScore()
        {
            var scores = new List<float>();

            // FPS score
            var currentFPS = 1f / Time.unscaledDeltaTime;
            var fpsScore = Mathf.Clamp01(currentFPS / 60f);
            scores.Add(fpsScore);

            // Memory score
            var memoryUsage = UnityEngine.Profiling.Profiler.GetTotalAllocatedMemory(false) / 1024f / 1024f;
            var memoryScore = Mathf.Clamp01(1f - (memoryUsage / 512f));
            scores.Add(memoryScore);

            // Draw call score
            var drawCalls = GetDrawCallCount();
            var drawCallScore = Mathf.Clamp01(1f - (drawCalls / 100f));
            scores.Add(drawCallScore);

            // System health score
            var activeSystems = _optimizationSystems.Values.Count(s => s.isEnabled && s.isInitialized);
            var totalSystems = _optimizationSystems.Count;
            var systemHealthScore = (float)activeSystems / totalSystems;
            scores.Add(systemHealthScore);

            return scores.Average();
        }

        private Dictionary<string, float> CalculateSystemScores()
        {
            var scores = new Dictionary<string, float>();

            foreach (var kvp in _optimizationSystems)
            {
                var system = kvp.Value;
                var score = 0f;

                if (system.stats.ContainsKey("performance_score"))
                {
                    score = Convert.ToSingle(system.stats["performance_score"]);
                }
                else if (system.stats.ContainsKey("hit_rate_percent"))
                {
                    score = Convert.ToSingle(system.stats["hit_rate_percent"]) / 100f;
                }
                else if (system.stats.ContainsKey("pass_rate_percent"))
                {
                    score = Convert.ToSingle(system.stats["pass_rate_percent"]) / 100f;
                }
                else
                {
                    score = system.isEnabled && system.isInitialized ? 0.8f : 0.2f;
                }

                scores[kvp.Key] = score;
            }

            return scores;
        }

        private List<string> GenerateRecommendations()
        {
            var recommendations = new List<string>();

            // Check FPS
            var currentFPS = 1f / Time.unscaledDeltaTime;
            if (currentFPS < 45f)
            {
                recommendations.Add("Consider reducing quality settings or enabling frame pacing optimizations");
            }

            // Check memory
            var memoryUsage = UnityEngine.Profiling.Profiler.GetTotalAllocatedMemory(false) / 1024f / 1024f;
            if (memoryUsage > 400f)
            {
                recommendations.Add("Enable memory optimization features or reduce texture quality");
            }

            // Check draw calls
            var drawCalls = GetDrawCallCount();
            if (drawCalls > 80)
            {
                recommendations.Add("Enable texture atlasing to reduce draw calls");
            }

            // Check system health
            var disabledSystems = _optimizationSystems.Values.Count(s => !s.isEnabled);
            if (disabledSystems > 0)
            {
                recommendations.Add($"Enable {disabledSystems} disabled optimization systems");
            }

            return recommendations;
        }
        #endregion

        #region Public API
        public void EnablesystemSafe(string systemName, bool enable)
        {
            if (_optimizationSystems.ContainsKey(systemName))
            {
                _optimizationSystems[systemName].isEnabled = enable;
                Logger.Info($"System {systemName} {(enable ? "enabled" : "disabled")}", "MasterOptimizer");
            }
        }

        public void ForceOptimization(string systemName)
        {
            if (_optimizationSystems.ContainsKey(systemName))
            {
                ApplySystemOptimization(systemName, _optimizationSystems[systemName]);
                Logger.Info($"Forced optimization for {systemName}", "MasterOptimizer");
            }
        }

        public void ResetAllOptimizations()
        {
            foreach (var system in _optimizationSystems.Values)
            {
                system.lastOptimized = DateTime.Now;
            }

            _masterStats = new MasterOptimizationStats();
            _performanceAlerts.Clear();

            Logger.Info("All optimizations reset", "MasterOptimizer");
        }

        public Dictionary<string, object> GetMasterStats()
        {
            return new Dictionary<string, object>
            {
                {"overall_performance_score", _currentReport.overallPerformanceScore},
                {"total_optimizations", _masterStats.totalOptimizations},
                {"successful_optimizations", _masterStats.successfulOptimizations},
                {"failed_optimizations", _masterStats.failedOptimizations},
                {"active_systems", _optimizationSystems.Values.Count(s => s.isEnabled)},
                {"total_systems", _optimizationSystems.Count},
                {"active_alerts", _performanceAlerts.Count(a => !a.isResolved)},
                {"current_fps", 1f / Time.unscaledDeltaTime},
                {"memory_usage_mb", UnityEngine.Profiling.Profiler.GetTotalAllocatedMemory(false) / 1024f / 1024f},
                {"draw_calls", GetDrawCallCount()},
                {"enable_auto_optimization", enableAutoOptimization},
                {"optimization_check_interval", optimizationCheckInterval}
            };
        }
        #endregion

        void OnDestroy()
        {
            // Cleanup
            _optimizationSystems.Clear();
            _performanceAlerts.Clear();
        }
    }
}