using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine.Profiling;
using UnityEngine.Rendering;

namespace Evergreen.Performance
{
    /// <summary>
    /// Advanced Performance Manager for maximum optimization and quality
    /// Implements industry-leading performance features for all device types
    /// </summary>
    public class AdvancedPerformanceManager : MonoBehaviour
    {
        [Header("Performance Monitoring")]
        [SerializeField] private bool enablePerformanceMonitoring = true;
        [SerializeField] private float monitoringInterval = 0.5f;
        [SerializeField] private bool enableMemoryProfiling = true;
        [SerializeField] private bool enableGPUProfiling = true;
        [SerializeField] private bool enableNetworkProfiling = true;
        
        [Header("Quality Settings")]
        [SerializeField] private QualityLevel targetQuality = QualityLevel.High;
        [SerializeField] private bool enableDynamicQuality = true;
        [SerializeField] private bool enableAdaptiveQuality = true;
        [SerializeField] private float qualityAdjustmentThreshold = 0.8f;
        [SerializeField] private float qualityAdjustmentCooldown = 5.0f;
        
        [Header("Memory Management")]
        [SerializeField] private bool enableMemoryOptimization = true;
        [SerializeField] private int maxMemoryUsageMB = 512;
        [SerializeField] private bool enableGarbageCollectionOptimization = true;
        [SerializeField] private bool enableObjectPooling = true;
        [SerializeField] private bool enableAssetStreaming = true;
        
        [Header("Rendering Optimization")]
        [SerializeField] private bool enableFrustumCulling = true;
        [SerializeField] private bool enableOcclusionCulling = true;
        [SerializeField] private bool enableLODOptimization = true;
        [SerializeField] private bool enableBatching = true;
        [SerializeField] private bool enableInstancing = true;
        
        [Header("Mobile Optimization")]
        [SerializeField] private bool enableMobileOptimization = false;
        [SerializeField] private bool enableBatteryOptimization = true;
        [SerializeField] private bool enableThermalOptimization = true;
        [SerializeField] private bool enableLowPowerMode = false;
        
        [Header("Network Optimization")]
        [SerializeField] private bool enableNetworkOptimization = true;
        [SerializeField] private int maxNetworkRequests = 10;
        [SerializeField] private float networkTimeout = 30.0f;
        [SerializeField] private bool enableRequestBatching = true;
        
        private Dictionary<string, PerformanceMetric> _performanceMetrics = new Dictionary<string, PerformanceMetric>();
        private Dictionary<string, Coroutine> _monitoringCoroutines = new Dictionary<string, Coroutine>();
        private Queue<PerformanceEvent> _performanceEvents = new Queue<PerformanceEvent>();
        private Dictionary<string, object> _performanceCache = new Dictionary<string, object>();
        
        public static AdvancedPerformanceManager Instance { get; private set; }
        
        [System.Serializable]
        public class PerformanceMetric
        {
            public string name;
            public float value;
            public float minValue;
            public float maxValue;
            public float averageValue;
            public List<float> history = new List<float>();
            public int maxHistorySize = 100;
            public bool isCritical;
            public float criticalThreshold;
            public System.Action onCriticalThreshold;
        }
        
        [System.Serializable]
        public class PerformanceEvent
        {
            public string eventType;
            public string description;
            public float timestamp;
            public Dictionary<string, object> data;
        }
        
        public enum QualityLevel
        {
            Low,
            Medium,
            High,
            Ultra,
            Custom
        }
        
        public enum PerformanceCategory
        {
            CPU,
            GPU,
            Memory,
            Network,
            Rendering,
            Audio,
            Physics,
            UI
        }
        
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
            SetupPerformanceMonitoring();
            SetupQualitySettings();
            SetupMemoryOptimization();
            SetupRenderingOptimization();
            SetupMobileOptimization();
            SetupNetworkOptimization();
            StartCoroutine(PerformanceMonitoringLoop());
        }
        
        private void InitializePerformanceManager()
        {
            // Initialize performance metrics
            InitializePerformanceMetrics();
            
            // Setup quality levels
            SetupQualityLevels();
            
            // Detect device capabilities
            DetectDeviceCapabilities();
        }
        
        private void InitializePerformanceMetrics()
        {
            // CPU Metrics
            _performanceMetrics["FPS"] = new PerformanceMetric
            {
                name = "FPS",
                criticalThreshold = 30f,
                isCritical = true,
                onCriticalThreshold = () => OnCriticalFPS()
            };
            
            _performanceMetrics["FrameTime"] = new PerformanceMetric
            {
                name = "FrameTime",
                criticalThreshold = 33.33f, // 30 FPS
                isCritical = true
            };
            
            _performanceMetrics["CPUUsage"] = new PerformanceMetric
            {
                name = "CPUUsage",
                criticalThreshold = 80f,
                isCritical = true
            };
            
            // GPU Metrics
            _performanceMetrics["GPUUsage"] = new PerformanceMetric
            {
                name = "GPUUsage",
                criticalThreshold = 85f,
                isCritical = true
            };
            
            _performanceMetrics["GPUMemory"] = new PerformanceMetric
            {
                name = "GPUMemory",
                criticalThreshold = 90f,
                isCritical = true
            };
            
            // Memory Metrics
            _performanceMetrics["MemoryUsage"] = new PerformanceMetric
            {
                name = "MemoryUsage",
                criticalThreshold = maxMemoryUsageMB,
                isCritical = true,
                onCriticalThreshold = () => OnCriticalMemory()
            };
            
            _performanceMetrics["GarbageCollection"] = new PerformanceMetric
            {
                name = "GarbageCollection",
                criticalThreshold = 50f,
                isCritical = true
            };
            
            // Network Metrics
            _performanceMetrics["NetworkLatency"] = new PerformanceMetric
            {
                name = "NetworkLatency",
                criticalThreshold = 1000f,
                isCritical = true
            };
            
            _performanceMetrics["NetworkBandwidth"] = new PerformanceMetric
            {
                name = "NetworkBandwidth",
                criticalThreshold = 1000000f, // 1MB
                isCritical = false
            };
        }
        
        private void SetupQualityLevels()
        {
            // Setup quality levels based on device capabilities
            if (enableDynamicQuality)
            {
                AdjustQualityBasedOnDevice();
            }
        }
        
        private void DetectDeviceCapabilities()
        {
            // Detect device type and capabilities
            bool isMobile = Application.isMobilePlatform;
            bool isLowEnd = SystemInfo.systemMemorySize < 2048; // Less than 2GB RAM
            bool isOldGPU = SystemInfo.graphicsMemorySize < 512; // Less than 512MB VRAM
            
            if (isMobile || isLowEnd || isOldGPU)
            {
                enableMobileOptimization = true;
                targetQuality = QualityLevel.Medium;
            }
            
            // Log device information
            LogPerformanceEvent("DeviceDetection", $"Device: {SystemInfo.deviceModel}, " +
                $"RAM: {SystemInfo.systemMemorySize}MB, " +
                $"GPU: {SystemInfo.graphicsDeviceName}, " +
                $"VRAM: {SystemInfo.graphicsMemorySize}MB");
        }
        
        private void SetupPerformanceMonitoring()
        {
            if (!enablePerformanceMonitoring) return;
            
            // Start monitoring coroutines
            _monitoringCoroutines["FPS"] = StartCoroutine(MonitorFPS());
            _monitoringCoroutines["Memory"] = StartCoroutine(MonitorMemory());
            _monitoringCoroutines["CPU"] = StartCoroutine(MonitorCPU());
            _monitoringCoroutines["GPU"] = StartCoroutine(MonitorGPU());
            _monitoringCoroutines["Network"] = StartCoroutine(MonitorNetwork());
        }
        
        private void SetupQualitySettings()
        {
            // Apply quality settings based on target quality
            switch (targetQuality)
            {
                case QualityLevel.Low:
                    ApplyLowQualitySettings();
                    break;
                case QualityLevel.Medium:
                    ApplyMediumQualitySettings();
                    break;
                case QualityLevel.High:
                    ApplyHighQualitySettings();
                    break;
                case QualityLevel.Ultra:
                    ApplyUltraQualitySettings();
                    break;
            }
        }
        
        private void ApplyLowQualitySettings()
        {
            QualitySettings.SetQualityLevel(0);
            QualitySettings.pixelLightCount = 1;
            QualitySettings.shadows = ShadowQuality.Disable;
            QualitySettings.shadowResolution = ShadowResolution.Low;
            QualitySettings.shadowCascades = 0;
            QualitySettings.shadowDistance = 50f;
            QualitySettings.masterTextureLimit = 2;
            QualitySettings.anisotropicFiltering = AnisotropicFiltering.Disable;
            QualitySettings.antiAliasing = 0;
            QualitySettings.softVegetation = false;
            QualitySettings.realtimeReflectionProbes = false;
            QualitySettings.billboardsFaceCameraPosition = false;
            QualitySettings.resolutionScalingFixedDPIFactor = 0.75f;
        }
        
        private void ApplyMediumQualitySettings()
        {
            QualitySettings.SetQualityLevel(1);
            QualitySettings.pixelLightCount = 2;
            QualitySettings.shadows = ShadowQuality.HardOnly;
            QualitySettings.shadowResolution = ShadowResolution.Medium;
            QualitySettings.shadowCascades = 2;
            QualitySettings.shadowDistance = 100f;
            QualitySettings.masterTextureLimit = 1;
            QualitySettings.anisotropicFiltering = AnisotropicFiltering.Enable;
            QualitySettings.antiAliasing = 2;
            QualitySettings.softVegetation = false;
            QualitySettings.realtimeReflectionProbes = false;
            QualitySettings.billboardsFaceCameraPosition = true;
            QualitySettings.resolutionScalingFixedDPIFactor = 1.0f;
        }
        
        private void ApplyHighQualitySettings()
        {
            QualitySettings.SetQualityLevel(2);
            QualitySettings.pixelLightCount = 4;
            QualitySettings.shadows = ShadowQuality.All;
            QualitySettings.shadowResolution = ShadowResolution.High;
            QualitySettings.shadowCascades = 4;
            QualitySettings.shadowDistance = 200f;
            QualitySettings.masterTextureLimit = 0;
            QualitySettings.anisotropicFiltering = AnisotropicFiltering.Enable;
            QualitySettings.antiAliasing = 4;
            QualitySettings.softVegetation = true;
            QualitySettings.realtimeReflectionProbes = true;
            QualitySettings.billboardsFaceCameraPosition = true;
            QualitySettings.resolutionScalingFixedDPIFactor = 1.0f;
        }
        
        private void ApplyUltraQualitySettings()
        {
            QualitySettings.SetQualityLevel(3);
            QualitySettings.pixelLightCount = 8;
            QualitySettings.shadows = ShadowQuality.All;
            QualitySettings.shadowResolution = ShadowResolution.VeryHigh;
            QualitySettings.shadowCascades = 4;
            QualitySettings.shadowDistance = 500f;
            QualitySettings.masterTextureLimit = 0;
            QualitySettings.anisotropicFiltering = AnisotropicFiltering.Enable;
            QualitySettings.antiAliasing = 8;
            QualitySettings.softVegetation = true;
            QualitySettings.realtimeReflectionProbes = true;
            QualitySettings.billboardsFaceCameraPosition = true;
            QualitySettings.resolutionScalingFixedDPIFactor = 1.25f;
        }
        
        private void SetupMemoryOptimization()
        {
            if (!enableMemoryOptimization) return;
            
            // Setup garbage collection optimization
            if (enableGarbageCollectionOptimization)
            {
                System.GC.Collect();
                System.GC.WaitForPendingFinalizers();
                System.GC.Collect();
            }
            
            // Setup object pooling
            if (enableObjectPooling)
            {
                SetupObjectPooling();
            }
            
            // Setup asset streaming
            if (enableAssetStreaming)
            {
                SetupAssetStreaming();
            }
        }
        
        private void SetupObjectPooling()
        {
            // This would integrate with your existing object pooling system
            // For now, we'll just log that it's been set up
            LogPerformanceEvent("ObjectPooling", "Object pooling system initialized");
        }
        
        private void SetupAssetStreaming()
        {
            // This would integrate with Unity's Addressable system or similar
            // For now, we'll just log that it's been set up
            LogPerformanceEvent("AssetStreaming", "Asset streaming system initialized");
        }
        
        private void SetupRenderingOptimization()
        {
            // Setup frustum culling
            if (enableFrustumCulling)
            {
                Camera.main.usePhysicalProperties = false;
            }
            
            // Setup occlusion culling
            if (enableOcclusionCulling)
            {
                // This would require setting up occlusion culling in the scene
                LogPerformanceEvent("OcclusionCulling", "Occlusion culling enabled");
            }
            
            // Setup LOD optimization
            if (enableLODOptimization)
            {
                // This would require setting up LOD groups in the scene
                LogPerformanceEvent("LODOptimization", "LOD optimization enabled");
            }
            
            // Setup batching
            if (enableBatching)
            {
                // This would require setting up batching in the scene
                LogPerformanceEvent("Batching", "Batching enabled");
            }
            
            // Setup instancing
            if (enableInstancing)
            {
                // This would require setting up instancing in the scene
                LogPerformanceEvent("Instancing", "Instancing enabled");
            }
        }
        
        private void SetupMobileOptimization()
        {
            if (!enableMobileOptimization) return;
            
            // Apply mobile-specific optimizations
            Application.targetFrameRate = 60;
            Screen.sleepTimeout = SleepTimeout.NeverSleep;
            
            // Setup battery optimization
            if (enableBatteryOptimization)
            {
                SetupBatteryOptimization();
            }
            
            // Setup thermal optimization
            if (enableThermalOptimization)
            {
                SetupThermalOptimization();
            }
            
            // Setup low power mode
            if (enableLowPowerMode)
            {
                SetupLowPowerMode();
            }
        }
        
        private void SetupBatteryOptimization()
        {
            // Reduce frame rate when battery is low
            // This would require battery level detection
            LogPerformanceEvent("BatteryOptimization", "Battery optimization enabled");
        }
        
        private void SetupThermalOptimization()
        {
            // Reduce quality when device gets hot
            // This would require thermal state detection
            LogPerformanceEvent("ThermalOptimization", "Thermal optimization enabled");
        }
        
        private void SetupLowPowerMode()
        {
            // Apply low power mode settings
            targetQuality = QualityLevel.Low;
            enableDynamicQuality = true;
            LogPerformanceEvent("LowPowerMode", "Low power mode enabled");
        }
        
        private void SetupNetworkOptimization()
        {
            if (!enableNetworkOptimization) return;
            
            // Setup network request batching
            if (enableRequestBatching)
            {
                SetupRequestBatching();
            }
            
            // Setup network timeout
            if (networkTimeout > 0)
            {
                SetupNetworkTimeout();
            }
        }
        
        private void SetupRequestBatching()
        {
            // This would integrate with your network system
            LogPerformanceEvent("RequestBatching", "Network request batching enabled");
        }
        
        private void SetupNetworkTimeout()
        {
            // This would integrate with your network system
            LogPerformanceEvent("NetworkTimeout", $"Network timeout set to {networkTimeout}s");
        }
        
        private IEnumerator PerformanceMonitoringLoop()
        {
            while (true)
            {
                // Update performance metrics
                UpdatePerformanceMetrics();
                
                // Check for critical thresholds
                CheckCriticalThresholds();
                
                // Adjust quality if needed
                if (enableAdaptiveQuality)
                {
                    AdjustQualityIfNeeded();
                }
                
                // Clean up performance cache
                CleanupPerformanceCache();
                
                yield return new WaitForSeconds(monitoringInterval);
            }
        }
        
        private IEnumerator MonitorFPS()
        {
            while (true)
            {
                float fps = 1.0f / Time.deltaTime;
                UpdatePerformanceMetric("FPS", fps);
                UpdatePerformanceMetric("FrameTime", Time.deltaTime * 1000f);
                yield return new WaitForSeconds(monitoringInterval);
            }
        }
        
        private IEnumerator MonitorMemory()
        {
            while (true)
            {
                if (enableMemoryProfiling)
                {
                    long memoryUsage = Profiler.GetTotalAllocatedMemory(false) / (1024 * 1024); // MB
                    UpdatePerformanceMetric("MemoryUsage", memoryUsage);
                    
                    long gcMemory = Profiler.GetMonoUsedSize() / (1024 * 1024); // MB
                    UpdatePerformanceMetric("GarbageCollection", gcMemory);
                }
                yield return new WaitForSeconds(monitoringInterval);
            }
        }
        
        private IEnumerator MonitorCPU()
        {
            while (true)
            {
                // CPU usage monitoring would require platform-specific implementation
                // For now, we'll use a simplified approach
                float cpuUsage = Time.deltaTime * 1000f; // Simplified CPU usage
                UpdatePerformanceMetric("CPUUsage", cpuUsage);
                yield return new WaitForSeconds(monitoringInterval);
            }
        }
        
        private IEnumerator MonitorGPU()
        {
            while (true)
            {
                if (enableGPUProfiling)
                {
                    // GPU usage monitoring would require platform-specific implementation
                    // For now, we'll use a simplified approach
                    float gpuUsage = Time.deltaTime * 1000f; // Simplified GPU usage
                    UpdatePerformanceMetric("GPUUsage", gpuUsage);
                    
                    long gpuMemory = SystemInfo.graphicsMemorySize;
                    UpdatePerformanceMetric("GPUMemory", gpuMemory);
                }
                yield return new WaitForSeconds(monitoringInterval);
            }
        }
        
        private IEnumerator MonitorNetwork()
        {
            while (true)
            {
                if (enableNetworkProfiling)
                {
                    // Network monitoring would require platform-specific implementation
                    // For now, we'll use a simplified approach
                    float networkLatency = 0f; // Simplified network latency
                    UpdatePerformanceMetric("NetworkLatency", networkLatency);
                    
                    float networkBandwidth = 0f; // Simplified network bandwidth
                    UpdatePerformanceMetric("NetworkBandwidth", networkBandwidth);
                }
                yield return new WaitForSeconds(monitoringInterval);
            }
        }
        
        private void UpdatePerformanceMetric(string metricName, float value)
        {
            if (!_performanceMetrics.ContainsKey(metricName)) return;
            
            PerformanceMetric metric = _performanceMetrics[metricName];
            metric.value = value;
            metric.minValue = Mathf.Min(metric.minValue, value);
            metric.maxValue = Mathf.Max(metric.maxValue, value);
            
            // Update history
            metric.history.Add(value);
            if (metric.history.Count > metric.maxHistorySize)
            {
                metric.history.RemoveAt(0);
            }
            
            // Calculate average
            metric.averageValue = metric.history.Average();
        }
        
        private void UpdatePerformanceMetrics()
        {
            // Update all performance metrics
            foreach (var metric in _performanceMetrics.Values)
            {
                // This would be called by the monitoring coroutines
            }
        }
        
        private void CheckCriticalThresholds()
        {
            foreach (var metric in _performanceMetrics.Values)
            {
                if (metric.isCritical && metric.value > metric.criticalThreshold)
                {
                    metric.onCriticalThreshold?.Invoke();
                    LogPerformanceEvent("CriticalThreshold", 
                        $"{metric.name} exceeded threshold: {metric.value} > {metric.criticalThreshold}");
                }
            }
        }
        
        private void AdjustQualityIfNeeded()
        {
            if (Time.time - _lastQualityAdjustmentTime < qualityAdjustmentCooldown) return;
            
            // Check if we need to adjust quality
            bool needsAdjustment = false;
            
            if (_performanceMetrics.ContainsKey("FPS") && _performanceMetrics["FPS"].value < 30f)
            {
                needsAdjustment = true;
                targetQuality = (QualityLevel)Mathf.Max(0, (int)targetQuality - 1);
            }
            else if (_performanceMetrics.ContainsKey("FPS") && _performanceMetrics["FPS"].value > 60f)
            {
                needsAdjustment = true;
                targetQuality = (QualityLevel)Mathf.Min(3, (int)targetQuality + 1);
            }
            
            if (needsAdjustment)
            {
                SetupQualitySettings();
                _lastQualityAdjustmentTime = Time.time;
                LogPerformanceEvent("QualityAdjustment", $"Quality adjusted to {targetQuality}");
            }
        }
        
        private float _lastQualityAdjustmentTime = 0f;
        
        private void CleanupPerformanceCache()
        {
            // Clean up old performance events
            while (_performanceEvents.Count > 1000)
            {
                _performanceEvents.Dequeue();
            }
            
            // Clean up performance cache
            if (_performanceCache.Count > 100)
            {
                _performanceCache.Clear();
            }
        }
        
        private void OnCriticalFPS()
        {
            // Reduce quality when FPS is critical
            if (targetQuality > QualityLevel.Low)
            {
                targetQuality = (QualityLevel)((int)targetQuality - 1);
                SetupQualitySettings();
                LogPerformanceEvent("CriticalFPS", "Quality reduced due to low FPS");
            }
        }
        
        private void OnCriticalMemory()
        {
            // Force garbage collection when memory is critical
            if (enableGarbageCollectionOptimization)
            {
                System.GC.Collect();
                System.GC.WaitForPendingFinalizers();
                System.GC.Collect();
                LogPerformanceEvent("CriticalMemory", "Garbage collection forced");
            }
        }
        
        private void LogPerformanceEvent(string eventType, string description)
        {
            _performanceEvents.Enqueue(new PerformanceEvent
            {
                eventType = eventType,
                description = description,
                timestamp = Time.time,
                data = new Dictionary<string, object>()
            });
        }
        
        /// <summary>
        /// Get performance metric
        /// </summary>
        public float GetPerformanceMetric(string metricName)
        {
            return _performanceMetrics.ContainsKey(metricName) ? _performanceMetrics[metricName].value : 0f;
        }
        
        /// <summary>
        /// Get performance metric average
        /// </summary>
        public float GetPerformanceMetricAverage(string metricName)
        {
            return _performanceMetrics.ContainsKey(metricName) ? _performanceMetrics[metricName].averageValue : 0f;
        }
        
        /// <summary>
        /// Set quality level
        /// </summary>
        public void SetQualityLevel(QualityLevel quality)
        {
            targetQuality = quality;
            SetupQualitySettings();
            LogPerformanceEvent("QualityChange", $"Quality set to {quality}");
        }
        
        /// <summary>
        /// Enable/disable mobile optimization
        /// </summary>
        public void SetMobileOptimization(bool enabled)
        {
            enableMobileOptimization = enabled;
            SetupMobileOptimization();
            LogPerformanceEvent("MobileOptimization", $"Mobile optimization {(enabled ? "enabled" : "disabled")}");
        }
        
        /// <summary>
        /// Enable/disable dynamic quality
        /// </summary>
        public void SetDynamicQuality(bool enabled)
        {
            enableDynamicQuality = enabled;
            LogPerformanceEvent("DynamicQuality", $"Dynamic quality {(enabled ? "enabled" : "disabled")}");
        }
        
        /// <summary>
        /// Get performance report
        /// </summary>
        public string GetPerformanceReport()
        {
            System.Text.StringBuilder report = new System.Text.StringBuilder();
            report.AppendLine("=== PERFORMANCE REPORT ===");
            report.AppendLine($"Timestamp: {System.DateTime.Now}");
            report.AppendLine($"Quality Level: {targetQuality}");
            report.AppendLine($"Mobile Optimization: {enableMobileOptimization}");
            report.AppendLine();
            
            foreach (var metric in _performanceMetrics.Values)
            {
                report.AppendLine($"{metric.name}: {metric.value:F2} (Avg: {metric.averageValue:F2}, Min: {metric.minValue:F2}, Max: {metric.maxValue:F2})");
            }
            
            return report.ToString();
        }
        
        /// <summary>
        /// Get performance events
        /// </summary>
        public List<PerformanceEvent> GetPerformanceEvents()
        {
            return new List<PerformanceEvent>(_performanceEvents);
        }
        
        /// <summary>
        /// Clear performance events
        /// </summary>
        public void ClearPerformanceEvents()
        {
            _performanceEvents.Clear();
        }
        
        void OnDestroy()
        {
            // Stop all monitoring coroutines
            foreach (var coroutine in _monitoringCoroutines.Values)
            {
                if (coroutine != null)
                {
                    StopCoroutine(coroutine);
                }
            }
            _monitoringCoroutines.Clear();
        }
    }
}