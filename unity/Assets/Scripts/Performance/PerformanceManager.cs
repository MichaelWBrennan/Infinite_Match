using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using System.Linq;
using System.Diagnostics;

namespace Evergreen.Performance
{
    [System.Serializable]
    public class PerformanceMetrics
    {
        public float fps;
        public float frameTime;
        public float memoryUsage;
        public float memoryAllocated;
        public float cpuUsage;
        public float gpuUsage;
        public int drawCalls;
        public int triangles;
        public int vertices;
        public int batches;
        public float audioMemory;
        public float textureMemory;
        public float meshMemory;
        public DateTime timestamp;
    }
    
    [System.Serializable]
    public class PerformanceThreshold
    {
        public string thresholdId;
        public string metricName;
        public float warningValue;
        public float criticalValue;
        public bool isEnabled;
        public ThresholdType thresholdType;
        public DateTime lastTriggered;
    }
    
    public enum ThresholdType
    {
        Above,
        Below,
        Equal,
        NotEqual
    }
    
    [System.Serializable]
    public class PerformanceOptimization
    {
        public string optimizationId;
        public string name;
        public OptimizationType optimizationType;
        public bool isEnabled;
        public float priority;
        public Dictionary<string, object> parameters = new Dictionary<string, object>();
        public DateTime lastApplied;
        public int applicationCount;
    }
    
    public enum OptimizationType
    {
        Quality,
        LOD,
        Culling,
        Batching,
        Compression,
        Pooling,
        Streaming,
        Caching,
        GarbageCollection,
        Custom
    }
    
    [System.Serializable]
    public class PerformanceProfile
    {
        public string profileId;
        public string name;
        public PerformanceLevel level;
        public Dictionary<string, float> settings = new Dictionary<string, float>();
        public bool isActive;
        public DateTime created;
        public DateTime lastUsed;
    }
    
    public enum PerformanceLevel
    {
        Ultra,
        High,
        Medium,
        Low,
        Custom
    }
    
    [System.Serializable]
    public class PerformanceWarning
    {
        public string warningId;
        public string metricName;
        public float currentValue;
        public float thresholdValue;
        public WarningLevel level;
        public string message;
        public DateTime timestamp;
        public bool isResolved;
    }
    
    public enum WarningLevel
    {
        Info,
        Warning,
        Critical,
        Emergency
    }
    
    [System.Serializable]
    public class PerformanceReport
    {
        public string reportId;
        public DateTime startTime;
        public DateTime endTime;
        public float averageFPS;
        public float minFPS;
        public float maxFPS;
        public float averageMemory;
        public float peakMemory;
        public int totalWarnings;
        public int totalOptimizations;
        public Dictionary<string, object> details = new Dictionary<string, object>();
    }
    
    public class PerformanceManager : MonoBehaviour
    {
        [Header("Performance Monitoring")]
        public bool enableMonitoring = true;
        public bool enableRealTimeMonitoring = true;
        public bool enableAdaptiveOptimization = true;
        public bool enableWarningSystem = true;
        public bool enableAutoOptimization = true;
        
        [Header("Monitoring Settings")]
        public float monitoringInterval = 0.5f;
        public int maxMetricsHistory = 1000;
        public float warningCooldown = 5f;
        public float optimizationCooldown = 10f;
        
        [Header("Performance Thresholds")]
        public float targetFPS = 60f;
        public float minFPS = 30f;
        public float maxMemoryUsage = 1024f; // MB
        public float maxCPUUsage = 80f; // Percentage
        public float maxGPUUsage = 80f; // Percentage
        public int maxDrawCalls = 1000;
        public int maxTriangles = 100000;
        
        [Header("Optimization Settings")]
        public bool enableQualityOptimization = true;
        public bool enableLODOptimization = true;
        public bool enableCullingOptimization = true;
        public bool enableBatchingOptimization = true;
        public bool enableCompressionOptimization = true;
        public bool enablePoolingOptimization = true;
        public bool enableStreamingOptimization = true;
        public bool enableCachingOptimization = true;
        public bool enableGCOptimization = true;
        
        [Header("Adaptive Settings")]
        public float adaptationSpeed = 1f;
        public float adaptationThreshold = 0.1f;
        public bool enableGradualAdaptation = true;
        public int maxAdaptationSteps = 5;
        
        public static PerformanceManager Instance { get; private set; }
        
        private List<PerformanceMetrics> metricsHistory = new List<PerformanceMetrics>();
        private Dictionary<string, PerformanceThreshold> performanceThresholds = new Dictionary<string, PerformanceThreshold>();
        private Dictionary<string, PerformanceOptimization> performanceOptimizations = new Dictionary<string, PerformanceOptimization>();
        private Dictionary<string, PerformanceProfile> performanceProfiles = new Dictionary<string, PerformanceProfile>();
        private List<PerformanceWarning> activeWarnings = new List<PerformanceWarning>();
        private List<PerformanceReport> performanceReports = new List<PerformanceReport>();
        
        private PerformanceMetrics currentMetrics;
        private PerformanceProfile currentProfile;
        private PerformanceReport currentReport;
        
        private Coroutine monitoringCoroutine;
        private Coroutine optimizationCoroutine;
        private Coroutine warningCoroutine;
        
        // Performance monitoring variables
        private float frameCount = 0;
        private float deltaTime = 0;
        private float fps = 0;
        private float memoryUsage = 0;
        private float cpuUsage = 0;
        private float gpuUsage = 0;
        private int drawCalls = 0;
        private int triangles = 0;
        private int vertices = 0;
        private int batches = 0;
        
        // Performance optimization variables
        private bool isOptimizing = false;
        private int optimizationStep = 0;
        private DateTime lastOptimization;
        private DateTime lastWarning;
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializePerformanceManager();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            InitializePerformanceProfiles();
            InitializePerformanceThresholds();
            InitializePerformanceOptimizations();
            StartPerformanceServices();
        }
        
        private void InitializePerformanceManager()
        {
            // Initialize current metrics
            currentMetrics = new PerformanceMetrics();
            
            // Initialize performance profiles
            CreateDefaultPerformanceProfiles();
            
            // Set initial profile
            SetPerformanceProfile("high");
        }
        
        private void CreateDefaultPerformanceProfiles()
        {
            // Ultra Profile
            var ultraProfile = new PerformanceProfile
            {
                profileId = "ultra",
                name = "Ultra",
                level = PerformanceLevel.Ultra,
                settings = new Dictionary<string, float>
                {
                    {"quality", 1f},
                    {"lod_bias", 1f},
                    {"shadow_distance", 1000f},
                    {"texture_quality", 1f},
                    {"particle_quality", 1f},
                    {"audio_quality", 1f}
                },
                isActive = false,
                created = DateTime.Now
            };
            performanceProfiles["ultra"] = ultraProfile;
            
            // High Profile
            var highProfile = new PerformanceProfile
            {
                profileId = "high",
                name = "High",
                level = PerformanceLevel.High,
                settings = new Dictionary<string, float>
                {
                    {"quality", 0.8f},
                    {"lod_bias", 0.8f},
                    {"shadow_distance", 800f},
                    {"texture_quality", 0.8f},
                    {"particle_quality", 0.8f},
                    {"audio_quality", 0.8f}
                },
                isActive = true,
                created = DateTime.Now
            };
            performanceProfiles["high"] = highProfile;
            
            // Medium Profile
            var mediumProfile = new PerformanceProfile
            {
                profileId = "medium",
                name = "Medium",
                level = PerformanceLevel.Medium,
                settings = new Dictionary<string, float>
                {
                    {"quality", 0.6f},
                    {"lod_bias", 0.6f},
                    {"shadow_distance", 600f},
                    {"texture_quality", 0.6f},
                    {"particle_quality", 0.6f},
                    {"audio_quality", 0.6f}
                },
                isActive = false,
                created = DateTime.Now
            };
            performanceProfiles["medium"] = mediumProfile;
            
            // Low Profile
            var lowProfile = new PerformanceProfile
            {
                profileId = "low",
                name = "Low",
                level = PerformanceLevel.Low,
                settings = new Dictionary<string, float>
                {
                    {"quality", 0.4f},
                    {"lod_bias", 0.4f},
                    {"shadow_distance", 400f},
                    {"texture_quality", 0.4f},
                    {"particle_quality", 0.4f},
                    {"audio_quality", 0.4f}
                },
                isActive = false,
                created = DateTime.Now
            };
            performanceProfiles["low"] = lowProfile;
        }
        
        private void InitializePerformanceProfiles()
        {
            // Initialize performance profiles
            // This would load custom profiles from save data
        }
        
        private void InitializePerformanceThresholds()
        {
            // Initialize performance thresholds
            CreateDefaultPerformanceThresholds();
        }
        
        private void CreateDefaultPerformanceThresholds()
        {
            // FPS thresholds
            performanceThresholds["fps_warning"] = new PerformanceThreshold
            {
                thresholdId = "fps_warning",
                metricName = "fps",
                warningValue = minFPS,
                criticalValue = minFPS * 0.8f,
                isEnabled = true,
                thresholdType = ThresholdType.Below
            };
            
            // Memory thresholds
            performanceThresholds["memory_warning"] = new PerformanceThreshold
            {
                thresholdId = "memory_warning",
                metricName = "memoryUsage",
                warningValue = maxMemoryUsage * 0.8f,
                criticalValue = maxMemoryUsage,
                isEnabled = true,
                thresholdType = ThresholdType.Above
            };
            
            // CPU thresholds
            performanceThresholds["cpu_warning"] = new PerformanceThreshold
            {
                thresholdId = "cpu_warning",
                metricName = "cpuUsage",
                warningValue = maxCPUUsage * 0.8f,
                criticalValue = maxCPUUsage,
                isEnabled = true,
                thresholdType = ThresholdType.Above
            };
            
            // GPU thresholds
            performanceThresholds["gpu_warning"] = new PerformanceThreshold
            {
                thresholdId = "gpu_warning",
                metricName = "gpuUsage",
                warningValue = maxGPUUsage * 0.8f,
                criticalValue = maxGPUUsage,
                isEnabled = true,
                thresholdType = ThresholdType.Above
            };
            
            // Draw call thresholds
            performanceThresholds["drawcalls_warning"] = new PerformanceThreshold
            {
                thresholdId = "drawcalls_warning",
                metricName = "drawCalls",
                warningValue = maxDrawCalls * 0.8f,
                criticalValue = maxDrawCalls,
                isEnabled = true,
                thresholdType = ThresholdType.Above
            };
        }
        
        private void InitializePerformanceOptimizations()
        {
            // Initialize performance optimizations
            CreateDefaultPerformanceOptimizations();
        }
        
        private void CreateDefaultPerformanceOptimizations()
        {
            // Quality optimization
            performanceOptimizations["quality"] = new PerformanceOptimization
            {
                optimizationId = "quality",
                name = "Quality Optimization",
                optimizationType = OptimizationType.Quality,
                isEnabled = enableQualityOptimization,
                priority = 1f,
                parameters = new Dictionary<string, object>
                {
                    {"quality_level", 0.8f},
                    {"adaptation_speed", 0.1f}
                }
            };
            
            // LOD optimization
            performanceOptimizations["lod"] = new PerformanceOptimization
            {
                optimizationId = "lod",
                name = "LOD Optimization",
                optimizationType = OptimizationType.LOD,
                isEnabled = enableLODOptimization,
                priority = 0.9f,
                parameters = new Dictionary<string, object>
                {
                    {"lod_bias", 0.8f},
                    {"cull_distance", 1000f}
                }
            };
            
            // Culling optimization
            performanceOptimizations["culling"] = new PerformanceOptimization
            {
                optimizationId = "culling",
                name = "Culling Optimization",
                optimizationType = OptimizationType.Culling,
                isEnabled = enableCullingOptimization,
                priority = 0.8f,
                parameters = new Dictionary<string, object>
                {
                    {"frustum_culling", true},
                    {"occlusion_culling", true}
                }
            };
            
            // Batching optimization
            performanceOptimizations["batching"] = new PerformanceOptimization
            {
                optimizationId = "batching",
                name = "Batching Optimization",
                optimizationType = OptimizationType.Batching,
                isEnabled = enableBatchingOptimization,
                priority = 0.7f,
                parameters = new Dictionary<string, object>
                {
                    {"static_batching", true},
                    {"dynamic_batching", true}
                }
            };
            
            // Compression optimization
            performanceOptimizations["compression"] = new PerformanceOptimization
            {
                optimizationId = "compression",
                name = "Compression Optimization",
                optimizationType = OptimizationType.Compression,
                isEnabled = enableCompressionOptimization,
                priority = 0.6f,
                parameters = new Dictionary<string, object>
                {
                    {"texture_compression", true},
                    {"audio_compression", true}
                }
            };
        }
        
        private void StartPerformanceServices()
        {
            if (enableMonitoring)
            {
                monitoringCoroutine = StartCoroutine(PerformanceMonitoringLoop());
            }
            
            if (enableAdaptiveOptimization)
            {
                optimizationCoroutine = StartCoroutine(AdaptiveOptimizationLoop());
            }
            
            if (enableWarningSystem)
            {
                warningCoroutine = StartCoroutine(WarningSystemLoop());
            }
        }
        
        private IEnumerator PerformanceMonitoringLoop()
        {
            while (enableMonitoring)
            {
                UpdatePerformanceMetrics();
                CheckPerformanceThresholds();
                yield return new WaitForSeconds(monitoringInterval);
            }
        }
        
        private IEnumerator AdaptiveOptimizationLoop()
        {
            while (enableAdaptiveOptimization)
            {
                if (enableAutoOptimization && !isOptimizing)
                {
                    CheckForOptimization();
                }
                yield return new WaitForSeconds(optimizationCooldown);
            }
        }
        
        private IEnumerator WarningSystemLoop()
        {
            while (enableWarningSystem)
            {
                ProcessWarnings();
                yield return new WaitForSeconds(1f);
            }
        }
        
        // Performance Monitoring
        private void UpdatePerformanceMetrics()
        {
            // Update FPS
            frameCount++;
            deltaTime += Time.deltaTime;
            if (deltaTime >= 1f)
            {
                fps = frameCount / deltaTime;
                frameCount = 0;
                deltaTime = 0;
            }
            
            // Update memory usage
            memoryUsage = GC.GetTotalMemory(false) / 1024f / 1024f; // MB
            
            // Update CPU usage
            cpuUsage = GetCPUUsage();
            
            // Update GPU usage
            gpuUsage = GetGPUUsage();
            
            // Update rendering metrics
            drawCalls = GetDrawCalls();
            triangles = GetTriangles();
            vertices = GetVertices();
            batches = GetBatches();
            
            // Create metrics object
            currentMetrics = new PerformanceMetrics
            {
                fps = fps,
                frameTime = Time.deltaTime * 1000f, // ms
                memoryUsage = memoryUsage,
                memoryAllocated = GC.GetTotalMemory(true) / 1024f / 1024f, // MB
                cpuUsage = cpuUsage,
                gpuUsage = gpuUsage,
                drawCalls = drawCalls,
                triangles = triangles,
                vertices = vertices,
                batches = batches,
                audioMemory = GetAudioMemory(),
                textureMemory = GetTextureMemory(),
                meshMemory = GetMeshMemory(),
                timestamp = DateTime.Now
            };
            
            // Add to history
            metricsHistory.Add(currentMetrics);
            
            // Limit history size
            if (metricsHistory.Count > maxMetricsHistory)
            {
                metricsHistory.RemoveAt(0);
            }
        }
        
        private float GetCPUUsage()
        {
            // Get CPU usage (simplified)
            return Time.deltaTime * 1000f; // Simplified calculation
        }
        
        private float GetGPUUsage()
        {
            // Get GPU usage (simplified)
            return drawCalls / 100f; // Simplified calculation
        }
        
        private int GetDrawCalls()
        {
            // Get draw calls count
            return UnityEngine.Rendering.GraphicsSettings.renderPipelineAsset != null ? 
                UnityEngine.Rendering.GraphicsSettings.renderPipelineAsset.GetType().GetField("drawCalls", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)?.GetValue(UnityEngine.Rendering.GraphicsSettings.renderPipelineAsset) as int? ?? 0 : 0;
        }
        
        private int GetTriangles()
        {
            // Get triangles count
            return 0; // Would need to be implemented with rendering statistics
        }
        
        private int GetVertices()
        {
            // Get vertices count
            return 0; // Would need to be implemented with rendering statistics
        }
        
        private int GetBatches()
        {
            // Get batches count
            return 0; // Would need to be implemented with rendering statistics
        }
        
        private float GetAudioMemory()
        {
            // Get audio memory usage
            return 0; // Would need to be implemented with audio statistics
        }
        
        private float GetTextureMemory()
        {
            // Get texture memory usage
            return 0; // Would need to be implemented with texture statistics
        }
        
        private float GetMeshMemory()
        {
            // Get mesh memory usage
            return 0; // Would need to be implemented with mesh statistics
        }
        
        // Performance Threshold Checking
        private void CheckPerformanceThresholds()
        {
            foreach (var threshold in performanceThresholds.Values)
            {
                if (!threshold.isEnabled) continue;
                
                var currentValue = GetMetricValue(threshold.metricName);
                var shouldTrigger = CheckThreshold(currentValue, threshold.warningValue, threshold.thresholdType);
                
                if (shouldTrigger)
                {
                    TriggerPerformanceWarning(threshold, currentValue);
                }
            }
        }
        
        private float GetMetricValue(string metricName)
        {
            switch (metricName)
            {
                case "fps": return currentMetrics.fps;
                case "memoryUsage": return currentMetrics.memoryUsage;
                case "cpuUsage": return currentMetrics.cpuUsage;
                case "gpuUsage": return currentMetrics.gpuUsage;
                case "drawCalls": return currentMetrics.drawCalls;
                case "triangles": return currentMetrics.triangles;
                case "vertices": return currentMetrics.vertices;
                case "batches": return currentMetrics.batches;
                default: return 0f;
            }
        }
        
        private bool CheckThreshold(float currentValue, float thresholdValue, ThresholdType thresholdType)
        {
            switch (thresholdType)
            {
                case ThresholdType.Above: return currentValue > thresholdValue;
                case ThresholdType.Below: return currentValue < thresholdValue;
                case ThresholdType.Equal: return Mathf.Approximately(currentValue, thresholdValue);
                case ThresholdType.NotEqual: return !Mathf.Approximately(currentValue, thresholdValue);
                default: return false;
            }
        }
        
        private void TriggerPerformanceWarning(PerformanceThreshold threshold, float currentValue)
        {
            // Check cooldown
            if (DateTime.Now - threshold.lastTriggered < TimeSpan.FromSeconds(warningCooldown))
                return;
            
            var warningLevel = currentValue >= threshold.criticalValue ? WarningLevel.Critical : WarningLevel.Warning;
            
            var warning = new PerformanceWarning
            {
                warningId = Guid.NewGuid().ToString(),
                metricName = threshold.metricName,
                currentValue = currentValue,
                thresholdValue = threshold.warningValue,
                level = warningLevel,
                message = $"{threshold.metricName} is {currentValue:F2}, threshold is {threshold.warningValue:F2}",
                timestamp = DateTime.Now,
                isResolved = false
            };
            
            activeWarnings.Add(warning);
            threshold.lastTriggered = DateTime.Now;
            
            // Log warning
            Debug.LogWarning($"Performance Warning: {warning.message}");
            
            // Trigger optimization if enabled
            if (enableAutoOptimization)
            {
                TriggerOptimization(threshold.metricName);
            }
        }
        
        // Performance Optimization
        private void CheckForOptimization()
        {
            if (isOptimizing) return;
            
            // Check if optimization is needed
            var needsOptimization = false;
            var optimizationReason = "";
            
            if (currentMetrics.fps < minFPS)
            {
                needsOptimization = true;
                optimizationReason = "Low FPS";
            }
            else if (currentMetrics.memoryUsage > maxMemoryUsage * 0.8f)
            {
                needsOptimization = true;
                optimizationReason = "High Memory Usage";
            }
            else if (currentMetrics.cpuUsage > maxCPUUsage * 0.8f)
            {
                needsOptimization = true;
                optimizationReason = "High CPU Usage";
            }
            else if (currentMetrics.drawCalls > maxDrawCalls * 0.8f)
            {
                needsOptimization = true;
                optimizationReason = "High Draw Calls";
            }
            
            if (needsOptimization)
            {
                TriggerOptimization(optimizationReason);
            }
        }
        
        private void TriggerOptimization(string reason)
        {
            if (isOptimizing) return;
            
            isOptimizing = true;
            optimizationStep = 0;
            lastOptimization = DateTime.Now;
            
            Debug.Log($"Starting performance optimization: {reason}");
            
            StartCoroutine(ApplyOptimizations());
        }
        
        private IEnumerator ApplyOptimizations()
        {
            var enabledOptimizations = performanceOptimizations.Values
                .Where(o => o.isEnabled)
                .OrderByDescending(o => o.priority)
                .ToList();
            
            foreach (var optimization in enabledOptimizations)
            {
                if (optimizationStep >= maxAdaptationSteps) break;
                
                ApplyOptimization(optimization);
                optimizationStep++;
                
                yield return new WaitForSeconds(adaptationSpeed);
            }
            
            isOptimizing = false;
            Debug.Log("Performance optimization completed");
        }
        
        private void ApplyOptimization(PerformanceOptimization optimization)
        {
            switch (optimization.optimizationType)
            {
                case OptimizationType.Quality:
                    ApplyQualityOptimization(optimization);
                    break;
                case OptimizationType.LOD:
                    ApplyLODOptimization(optimization);
                    break;
                case OptimizationType.Culling:
                    ApplyCullingOptimization(optimization);
                    break;
                case OptimizationType.Batching:
                    ApplyBatchingOptimization(optimization);
                    break;
                case OptimizationType.Compression:
                    ApplyCompressionOptimization(optimization);
                    break;
                case OptimizationType.Pooling:
                    ApplyPoolingOptimization(optimization);
                    break;
                case OptimizationType.Streaming:
                    ApplyStreamingOptimization(optimization);
                    break;
                case OptimizationType.Caching:
                    ApplyCachingOptimization(optimization);
                    break;
                case OptimizationType.GarbageCollection:
                    ApplyGCOptimization(optimization);
                    break;
            }
            
            optimization.lastApplied = DateTime.Now;
            optimization.applicationCount++;
        }
        
        private void ApplyQualityOptimization(PerformanceOptimization optimization)
        {
            if (optimization.parameters.ContainsKey("quality_level"))
            {
                var qualityLevel = Convert.ToSingle(optimization.parameters["quality_level"]);
                QualitySettings.SetQualityLevel(Mathf.RoundToInt(qualityLevel * 5f));
            }
        }
        
        private void ApplyLODOptimization(PerformanceOptimization optimization)
        {
            if (optimization.parameters.ContainsKey("lod_bias"))
            {
                var lodBias = Convert.ToSingle(optimization.parameters["lod_bias"]);
                QualitySettings.lodBias = lodBias;
            }
        }
        
        private void ApplyCullingOptimization(PerformanceOptimization optimization)
        {
            // Apply culling optimizations
            if (optimization.parameters.ContainsKey("frustum_culling"))
            {
                var frustumCulling = Convert.ToBoolean(optimization.parameters["frustum_culling"]);
                // Apply frustum culling settings
            }
        }
        
        private void ApplyBatchingOptimization(PerformanceOptimization optimization)
        {
            // Apply batching optimizations
            if (optimization.parameters.ContainsKey("static_batching"))
            {
                var staticBatching = Convert.ToBoolean(optimization.parameters["static_batching"]);
                // Apply static batching settings
            }
        }
        
        private void ApplyCompressionOptimization(PerformanceOptimization optimization)
        {
            // Apply compression optimizations
            if (optimization.parameters.ContainsKey("texture_compression"))
            {
                var textureCompression = Convert.ToBoolean(optimization.parameters["texture_compression"]);
                // Apply texture compression settings
            }
        }
        
        private void ApplyPoolingOptimization(PerformanceOptimization optimization)
        {
            // Apply pooling optimizations
            // This would optimize object pooling
        }
        
        private void ApplyStreamingOptimization(PerformanceOptimization optimization)
        {
            // Apply streaming optimizations
            // This would optimize asset streaming
        }
        
        private void ApplyCachingOptimization(PerformanceOptimization optimization)
        {
            // Apply caching optimizations
            // This would optimize various caches
        }
        
        private void ApplyGCOptimization(PerformanceOptimization optimization)
        {
            // Apply garbage collection optimizations
            GC.Collect();
            GC.WaitForPendingFinalizers();
            GC.Collect();
        }
        
        // Performance Profile Management
        public void SetPerformanceProfile(string profileId)
        {
            if (!performanceProfiles.ContainsKey(profileId)) return;
            
            var profile = performanceProfiles[profileId];
            
            // Deactivate current profile
            if (currentProfile != null)
            {
                currentProfile.isActive = false;
            }
            
            // Activate new profile
            profile.isActive = true;
            profile.lastUsed = DateTime.Now;
            currentProfile = profile;
            
            // Apply profile settings
            ApplyProfileSettings(profile);
            
            Debug.Log($"Performance profile set to: {profile.name}");
        }
        
        private void ApplyProfileSettings(PerformanceProfile profile)
        {
            foreach (var setting in profile.settings)
            {
                ApplyProfileSetting(setting.Key, setting.Value);
            }
        }
        
        private void ApplyProfileSetting(string settingName, float value)
        {
            switch (settingName)
            {
                case "quality":
                    QualitySettings.SetQualityLevel(Mathf.RoundToInt(value * 5f));
                    break;
                case "lod_bias":
                    QualitySettings.lodBias = value;
                    break;
                case "shadow_distance":
                    QualitySettings.shadowDistance = value;
                    break;
                case "texture_quality":
                    QualitySettings.masterTextureLimit = Mathf.RoundToInt((1f - value) * 3f);
                    break;
                case "particle_quality":
                    QualitySettings.particleRaycastBudget = Mathf.RoundToInt(value * 1000f);
                    break;
                case "audio_quality":
                    // Apply audio quality settings
                    break;
            }
        }
        
        // Warning Management
        private void ProcessWarnings()
        {
            // Remove resolved warnings
            activeWarnings.RemoveAll(w => w.isResolved);
            
            // Check for warning resolution
            foreach (var warning in activeWarnings)
            {
                var currentValue = GetMetricValue(warning.metricName);
                if (currentValue < warning.thresholdValue * 0.9f) // 10% below threshold
                {
                    warning.isResolved = true;
                }
            }
        }
        
        // Utility Methods
        public PerformanceMetrics GetCurrentMetrics()
        {
            return currentMetrics;
        }
        
        public List<PerformanceMetrics> GetMetricsHistory()
        {
            return metricsHistory;
        }
        
        public List<PerformanceWarning> GetActiveWarnings()
        {
            return activeWarnings.Where(w => !w.isResolved).ToList();
        }
        
        public PerformanceProfile GetCurrentProfile()
        {
            return currentProfile;
        }
        
        public Dictionary<string, PerformanceProfile> GetAvailableProfiles()
        {
            return performanceProfiles;
        }
        
        public void CreateCustomProfile(string profileId, string name, Dictionary<string, float> settings)
        {
            var profile = new PerformanceProfile
            {
                profileId = profileId,
                name = name,
                level = PerformanceLevel.Custom,
                settings = settings,
                isActive = false,
                created = DateTime.Now
            };
            
            performanceProfiles[profileId] = profile;
        }
        
        public void EnableOptimization(string optimizationId, bool enable)
        {
            if (performanceOptimizations.ContainsKey(optimizationId))
            {
                performanceOptimizations[optimizationId].isEnabled = enable;
            }
        }
        
        public void SetThreshold(string thresholdId, float warningValue, float criticalValue)
        {
            if (performanceThresholds.ContainsKey(thresholdId))
            {
                performanceThresholds[thresholdId].warningValue = warningValue;
                performanceThresholds[thresholdId].criticalValue = criticalValue;
            }
        }
        
        public Dictionary<string, object> GetPerformanceAnalytics()
        {
            return new Dictionary<string, object>
            {
                {"monitoring_enabled", enableMonitoring},
                {"real_time_monitoring_enabled", enableRealTimeMonitoring},
                {"adaptive_optimization_enabled", enableAdaptiveOptimization},
                {"warning_system_enabled", enableWarningSystem},
                {"auto_optimization_enabled", enableAutoOptimization},
                {"current_fps", currentMetrics.fps},
                {"current_memory_usage", currentMetrics.memoryUsage},
                {"current_cpu_usage", currentMetrics.cpuUsage},
                {"current_gpu_usage", currentMetrics.gpuUsage},
                {"current_draw_calls", currentMetrics.drawCalls},
                {"metrics_history_count", metricsHistory.Count},
                {"active_warnings_count", activeWarnings.Count(w => !w.isResolved)},
                {"total_optimizations", performanceOptimizations.Count},
                {"enabled_optimizations", performanceOptimizations.Count(o => o.Value.isEnabled)},
                {"current_profile", currentProfile?.profileId ?? "none"},
                {"is_optimizing", isOptimizing},
                {"optimization_step", optimizationStep}
            };
        }
        
        void OnDestroy()
        {
            if (monitoringCoroutine != null)
            {
                StopCoroutine(monitoringCoroutine);
            }
            if (optimizationCoroutine != null)
            {
                StopCoroutine(optimizationCoroutine);
            }
            if (warningCoroutine != null)
            {
                StopCoroutine(warningCoroutine);
            }
        }
    }
}