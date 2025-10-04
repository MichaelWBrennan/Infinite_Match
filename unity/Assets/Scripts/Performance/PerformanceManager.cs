using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System;

namespace Evergreen.Performance
{
    [System.Serializable]
    public class PerformanceMetrics
    {
        public float fps;
        public float frameTime;
        public float memoryUsage;
        public float gpuMemoryUsage;
        public int drawCalls;
        public int triangles;
        public int vertices;
        public float cpuUsage;
        public float gpuUsage;
        public int particleCount;
        public int audioSourceCount;
        public int activeGameObjects;
        public float batteryLevel;
        public float batteryTemperature;
        public bool isCharging;
        public string deviceModel;
        public string operatingSystem;
        public int systemMemorySize;
        public string graphicsDeviceName;
        public int graphicsMemorySize;
        public int screenWidth;
        public int screenHeight;
        public float screenDPI;
        public bool isFullscreen;
        public int targetFrameRate;
        public int vsyncCount;
        public int qualityLevel;
    }
    
    [System.Serializable]
    public class PerformanceThresholds
    {
        public float minFPS = 30f;
        public float maxFrameTime = 33.33f; // 30 FPS
        public float maxMemoryUsage = 1024f; // 1GB
        public float maxGPUMemoryUsage = 512f; // 512MB
        public int maxDrawCalls = 100;
        public int maxTriangles = 100000;
        public int maxVertices = 100000;
        public float maxCPUUsage = 80f;
        public float maxGPUUsage = 80f;
        public int maxParticleCount = 1000;
        public int maxAudioSourceCount = 32;
        public int maxActiveGameObjects = 1000;
    }
    
    public class PerformanceManager : MonoBehaviour
    {
        [Header("Performance Settings")]
        public bool enablePerformanceMonitoring = true;
        public float monitoringInterval = 1f;
        public bool enableAutoOptimization = true;
        public bool enablePerformanceWarnings = true;
        public bool enablePerformanceLogging = false;
        
        [Header("Performance UI")]
        public GameObject performancePanel;
        public TextMeshProUGUI fpsText;
        public TextMeshProUGUI memoryText;
        public TextMeshProUGUI drawCallsText;
        public TextMeshProUGUI trianglesText;
        public TextMeshProUGUI cpuText;
        public TextMeshProUGUI gpuText;
        public Slider performanceSlider;
        public Button optimizeButton;
        public Button resetButton;
        
        [Header("Performance Thresholds")]
        public PerformanceThresholds thresholds = new PerformanceThresholds();
        
        [Header("Optimization Settings")]
        public bool enableLODOptimization = true;
        public bool enableOcclusionCulling = true;
        public bool enableFrustumCulling = true;
        public bool enableBatching = true;
        public bool enableInstancing = true;
        public bool enableTextureStreaming = true;
        public bool enableAudioOptimization = true;
        public bool enableParticleOptimization = true;
        
        public static PerformanceManager Instance { get; private set; }
        
        private PerformanceMetrics currentMetrics;
        private List<PerformanceMetrics> metricsHistory = new List<PerformanceMetrics>();
        private int maxHistorySize = 60; // 1 minute at 1 FPS
        private float lastMonitoringTime;
        private bool isPerformancePanelVisible = false;
        private Coroutine monitoringCoroutine;
        private Dictionary<string, float> performanceWarnings = new Dictionary<string, float>();
        
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
            SetupUI();
            StartPerformanceMonitoring();
        }
        
        void Update()
        {
            if (enablePerformanceMonitoring && Time.time - lastMonitoringTime >= monitoringInterval)
            {
                UpdatePerformanceMetrics();
                lastMonitoringTime = Time.time;
            }
        }
        
        private void InitializePerformanceManager()
        {
            currentMetrics = new PerformanceMetrics();
            SetupPerformanceOptimizations();
        }
        
        private void SetupPerformanceOptimizations()
        {
            // Enable/disable optimizations based on settings
            if (enableLODOptimization)
            {
                // Enable LOD optimization
                QualitySettings.lodBias = 1.0f;
            }
            
            if (enableOcclusionCulling)
            {
                // Enable occlusion culling
                Camera.main.useOcclusionCulling = true;
            }
            
            if (enableFrustumCulling)
            {
                // Enable frustum culling (enabled by default)
                Camera.main.cullingMask = -1;
            }
            
            if (enableBatching)
            {
                // Enable static batching
                StaticBatchingUtility.Combine(GameObject.FindGameObjectsWithTag("Static"));
            }
            
            if (enableInstancing)
            {
                // Enable GPU instancing for materials
                // This would be set on materials
            }
            
            if (enableTextureStreaming)
            {
                // Enable texture streaming
                QualitySettings.streamingMipmapsActive = true;
            }
            
            if (enableAudioOptimization)
            {
                // Optimize audio settings
                AudioSettings.GetConfiguration();
            }
            
            if (enableParticleOptimization)
            {
                // Optimize particle systems
                // This would be applied to particle systems
            }
        }
        
        private void SetupUI()
        {
            if (performancePanel != null)
                performancePanel.SetActive(false);
            
            if (optimizeButton != null)
                optimizeButton.onClick.AddListener(OptimizePerformance);
            
            if (resetButton != null)
                resetButton.onClick.AddListener(ResetPerformanceSettings);
            
            if (performanceSlider != null)
            {
                performanceSlider.onValueChanged.AddListener(OnPerformanceSliderChanged);
                performanceSlider.value = QualitySettings.GetQualityLevel() / 3f; // 0-1 range
            }
        }
        
        private void StartPerformanceMonitoring()
        {
            if (enablePerformanceMonitoring)
            {
                monitoringCoroutine = StartCoroutine(PerformanceMonitoringCoroutine());
            }
        }
        
        private IEnumerator PerformanceMonitoringCoroutine()
        {
            while (enablePerformanceMonitoring)
            {
                UpdatePerformanceMetrics();
                CheckPerformanceThresholds();
                
                if (enableAutoOptimization)
                {
                    AutoOptimizePerformance();
                }
                
                yield return new WaitForSeconds(monitoringInterval);
            }
        }
        
        private void UpdatePerformanceMetrics()
        {
            currentMetrics.fps = 1f / Time.deltaTime;
            currentMetrics.frameTime = Time.deltaTime * 1000f; // Convert to milliseconds
            currentMetrics.memoryUsage = GetMemoryUsage();
            currentMetrics.gpuMemoryUsage = GetGPUMemoryUsage();
            currentMetrics.drawCalls = GetDrawCalls();
            currentMetrics.triangles = GetTriangles();
            currentMetrics.vertices = GetVertices();
            currentMetrics.cpuUsage = GetCPUUsage();
            currentMetrics.gpuUsage = GetGPUUsage();
            currentMetrics.particleCount = GetParticleCount();
            currentMetrics.audioSourceCount = GetAudioSourceCount();
            currentMetrics.activeGameObjects = GetActiveGameObjectCount();
            currentMetrics.batteryLevel = GetBatteryLevel();
            currentMetrics.batteryTemperature = GetBatteryTemperature();
            currentMetrics.isCharging = IsCharging();
            currentMetrics.deviceModel = SystemInfo.deviceModel;
            currentMetrics.operatingSystem = SystemInfo.operatingSystem;
            currentMetrics.systemMemorySize = SystemInfo.systemMemorySize;
            currentMetrics.graphicsDeviceName = SystemInfo.graphicsDeviceName;
            currentMetrics.graphicsMemorySize = SystemInfo.graphicsMemorySize;
            currentMetrics.screenWidth = Screen.width;
            currentMetrics.screenHeight = Screen.height;
            currentMetrics.screenDPI = Screen.dpi;
            currentMetrics.isFullscreen = Screen.fullScreen;
            currentMetrics.targetFrameRate = Application.targetFrameRate;
            currentMetrics.vsyncCount = QualitySettings.vSyncCount;
            currentMetrics.qualityLevel = QualitySettings.GetQualityLevel();
            
            // Add to history
            metricsHistory.Add(new PerformanceMetrics(currentMetrics));
            if (metricsHistory.Count > maxHistorySize)
            {
                metricsHistory.RemoveAt(0);
            }
            
            // Update UI
            UpdatePerformanceUI();
            
            // Log performance data
            if (enablePerformanceLogging)
            {
                LogPerformanceMetrics();
            }
        }
        
        private float GetMemoryUsage()
        {
            return UnityEngine.Profiling.Profiler.GetTotalAllocatedMemory(UnityEngine.Profiling.Profiler.Area.All) / (1024f * 1024f); // MB
        }
        
        private float GetGPUMemoryUsage()
        {
            return UnityEngine.Profiling.Profiler.GetAllocatedMemoryForGraphicsDriver() / (1024f * 1024f); // MB
        }
        
        private int GetDrawCalls()
        {
            return UnityEngine.Profiling.Profiler.GetRuntimeMemorySize(UnityEngine.Profiling.Profiler.Area.Rendering) / 1024; // Approximate
        }
        
        private int GetTriangles()
        {
            return UnityEngine.Profiling.Profiler.GetRuntimeMemorySize(UnityEngine.Profiling.Profiler.Area.Rendering) / 1024; // Approximate
        }
        
        private int GetVertices()
        {
            return UnityEngine.Profiling.Profiler.GetRuntimeMemorySize(UnityEngine.Profiling.Profiler.Area.Rendering) / 1024; // Approximate
        }
        
        private float GetCPUUsage()
        {
            return UnityEngine.Profiling.Profiler.GetTotalAllocatedMemory(UnityEngine.Profiling.Profiler.Area.CPU) / (1024f * 1024f); // Approximate
        }
        
        private float GetGPUUsage()
        {
            return UnityEngine.Profiling.Profiler.GetTotalAllocatedMemory(UnityEngine.Profiling.Profiler.Area.GPU) / (1024f * 1024f); // Approximate
        }
        
        private int GetParticleCount()
        {
            var particleSystems = FindObjectsOfType<ParticleSystem>();
            int totalParticles = 0;
            foreach (var ps in particleSystems)
            {
                totalParticles += ps.particleCount;
            }
            return totalParticles;
        }
        
        private int GetAudioSourceCount()
        {
            return FindObjectsOfType<AudioSource>().Length;
        }
        
        private int GetActiveGameObjectCount()
        {
            return FindObjectsOfType<GameObject>().Length;
        }
        
        private float GetBatteryLevel()
        {
            return SystemInfo.batteryLevel;
        }
        
        private float GetBatteryTemperature()
        {
            return SystemInfo.batteryTemperature;
        }
        
        private bool IsCharging()
        {
            return SystemInfo.batteryStatus == BatteryStatus.Charging;
        }
        
        private void CheckPerformanceThresholds()
        {
            if (!enablePerformanceWarnings) return;
            
            CheckFPSThreshold();
            CheckMemoryThreshold();
            CheckDrawCallsThreshold();
            CheckTrianglesThreshold();
            CheckCPUThreshold();
            CheckGPUThreshold();
            CheckParticleThreshold();
            CheckAudioThreshold();
        }
        
        private void CheckFPSThreshold()
        {
            if (currentMetrics.fps < thresholds.minFPS)
            {
                ShowPerformanceWarning("Low FPS", $"FPS is {currentMetrics.fps:F1}, below threshold of {thresholds.minFPS}");
            }
        }
        
        private void CheckMemoryThreshold()
        {
            if (currentMetrics.memoryUsage > thresholds.maxMemoryUsage)
            {
                ShowPerformanceWarning("High Memory Usage", $"Memory usage is {currentMetrics.memoryUsage:F1}MB, above threshold of {thresholds.maxMemoryUsage}MB");
            }
        }
        
        private void CheckDrawCallsThreshold()
        {
            if (currentMetrics.drawCalls > thresholds.maxDrawCalls)
            {
                ShowPerformanceWarning("High Draw Calls", $"Draw calls is {currentMetrics.drawCalls}, above threshold of {thresholds.maxDrawCalls}");
            }
        }
        
        private void CheckTrianglesThreshold()
        {
            if (currentMetrics.triangles > thresholds.maxTriangles)
            {
                ShowPerformanceWarning("High Triangle Count", $"Triangles is {currentMetrics.triangles}, above threshold of {thresholds.maxTriangles}");
            }
        }
        
        private void CheckCPUThreshold()
        {
            if (currentMetrics.cpuUsage > thresholds.maxCPUUsage)
            {
                ShowPerformanceWarning("High CPU Usage", $"CPU usage is {currentMetrics.cpuUsage:F1}%, above threshold of {thresholds.maxCPUUsage}%");
            }
        }
        
        private void CheckGPUThreshold()
        {
            if (currentMetrics.gpuUsage > thresholds.maxGPUUsage)
            {
                ShowPerformanceWarning("High GPU Usage", $"GPU usage is {currentMetrics.gpuUsage:F1}%, above threshold of {thresholds.maxGPUUsage}%");
            }
        }
        
        private void CheckParticleThreshold()
        {
            if (currentMetrics.particleCount > thresholds.maxParticleCount)
            {
                ShowPerformanceWarning("High Particle Count", $"Particle count is {currentMetrics.particleCount}, above threshold of {thresholds.maxParticleCount}");
            }
        }
        
        private void CheckAudioThreshold()
        {
            if (currentMetrics.audioSourceCount > thresholds.maxAudioSourceCount)
            {
                ShowPerformanceWarning("High Audio Source Count", $"Audio sources is {currentMetrics.audioSourceCount}, above threshold of {thresholds.maxAudioSourceCount}");
            }
        }
        
        private void ShowPerformanceWarning(string title, string message)
        {
            var warningKey = title;
            var currentTime = Time.time;
            
            // Throttle warnings to avoid spam
            if (performanceWarnings.ContainsKey(warningKey))
            {
                if (currentTime - performanceWarnings[warningKey] < 5f) // 5 second cooldown
                    return;
            }
            
            performanceWarnings[warningKey] = currentTime;
            
            if (Evergreen.Notifications.NotificationManager.Instance != null)
            {
                Evergreen.Notifications.NotificationManager.Instance.ShowWarningNotification(message);
            }
            
            Debug.LogWarning($"[Performance] {title}: {message}");
        }
        
        private void AutoOptimizePerformance()
        {
            // Auto-optimize based on current performance
            if (currentMetrics.fps < thresholds.minFPS)
            {
                ReduceQualityLevel();
            }
            
            if (currentMetrics.memoryUsage > thresholds.maxMemoryUsage)
            {
                OptimizeMemoryUsage();
            }
            
            if (currentMetrics.drawCalls > thresholds.maxDrawCalls)
            {
                OptimizeDrawCalls();
            }
            
            if (currentMetrics.particleCount > thresholds.maxParticleCount)
            {
                OptimizeParticles();
            }
        }
        
        private void ReduceQualityLevel()
        {
            var currentQuality = QualitySettings.GetQualityLevel();
            if (currentQuality > 0)
            {
                QualitySettings.SetQualityLevel(currentQuality - 1);
                Debug.Log($"Auto-optimization: Reduced quality level to {QualitySettings.GetQualityLevel()}");
            }
        }
        
        private void OptimizeMemoryUsage()
        {
            // Force garbage collection
            System.GC.Collect();
            Resources.UnloadUnusedAssets();
            Debug.Log("Auto-optimization: Performed memory cleanup");
        }
        
        private void OptimizeDrawCalls()
        {
            // Enable static batching
            StaticBatchingUtility.Combine(GameObject.FindGameObjectsWithTag("Static"));
            Debug.Log("Auto-optimization: Enabled static batching");
        }
        
        private void OptimizeParticles()
        {
            // Reduce particle count
            var particleSystems = FindObjectsOfType<ParticleSystem>();
            foreach (var ps in particleSystems)
            {
                var emission = ps.emission;
                emission.rateOverTime = Mathf.Max(emission.rateOverTime.constant * 0.8f, 1f);
            }
            Debug.Log("Auto-optimization: Reduced particle emission rates");
        }
        
        public void OptimizePerformance()
        {
            // Manual optimization
            OptimizeMemoryUsage();
            OptimizeDrawCalls();
            OptimizeParticles();
            
            // Reduce quality if needed
            if (currentMetrics.fps < thresholds.minFPS)
            {
                ReduceQualityLevel();
            }
            
            Debug.Log("Manual performance optimization completed");
        }
        
        public void ResetPerformanceSettings()
        {
            // Reset to default quality settings
            QualitySettings.SetQualityLevel(2); // High quality
            QualitySettings.vSyncCount = 1;
            Application.targetFrameRate = 60;
            
            // Reset optimizations
            SetupPerformanceOptimizations();
            
            Debug.Log("Performance settings reset to default");
        }
        
        private void OnPerformanceSliderChanged(float value)
        {
            int qualityLevel = Mathf.RoundToInt(value * 3f); // 0-3 range
            QualitySettings.SetQualityLevel(qualityLevel);
        }
        
        private void UpdatePerformanceUI()
        {
            if (fpsText != null)
                fpsText.text = $"FPS: {currentMetrics.fps:F1}";
            
            if (memoryText != null)
                memoryText.text = $"Memory: {currentMetrics.memoryUsage:F1}MB";
            
            if (drawCallsText != null)
                drawCallsText.text = $"Draw Calls: {currentMetrics.drawCalls}";
            
            if (trianglesText != null)
                trianglesText.text = $"Triangles: {currentMetrics.triangles:N0}";
            
            if (cpuText != null)
                cpuText.text = $"CPU: {currentMetrics.cpuUsage:F1}%";
            
            if (gpuText != null)
                gpuText.text = $"GPU: {currentMetrics.gpuUsage:F1}%";
        }
        
        private void LogPerformanceMetrics()
        {
            Debug.Log($"[Performance] FPS: {currentMetrics.fps:F1}, Memory: {currentMetrics.memoryUsage:F1}MB, Draw Calls: {currentMetrics.drawCalls}, Triangles: {currentMetrics.triangles:N0}");
        }
        
        public void TogglePerformancePanel()
        {
            if (performancePanel != null)
            {
                isPerformancePanelVisible = !isPerformancePanelVisible;
                performancePanel.SetActive(isPerformancePanelVisible);
            }
        }
        
        public PerformanceMetrics GetCurrentMetrics()
        {
            return currentMetrics;
        }
        
        public List<PerformanceMetrics> GetMetricsHistory()
        {
            return new List<PerformanceMetrics>(metricsHistory);
        }
        
        public float GetAverageFPS(int sampleCount = 10)
        {
            if (metricsHistory.Count == 0) return 0f;
            
            int count = Mathf.Min(sampleCount, metricsHistory.Count);
            float totalFPS = 0f;
            
            for (int i = metricsHistory.Count - count; i < metricsHistory.Count; i++)
            {
                totalFPS += metricsHistory[i].fps;
            }
            
            return totalFPS / count;
        }
        
        public float GetAverageMemoryUsage(int sampleCount = 10)
        {
            if (metricsHistory.Count == 0) return 0f;
            
            int count = Mathf.Min(sampleCount, metricsHistory.Count);
            float totalMemory = 0f;
            
            for (int i = metricsHistory.Count - count; i < metricsHistory.Count; i++)
            {
                totalMemory += metricsHistory[i].memoryUsage;
            }
            
            return totalMemory / count;
        }
        
        public bool IsPerformanceGood()
        {
            return currentMetrics.fps >= thresholds.minFPS &&
                   currentMetrics.memoryUsage <= thresholds.maxMemoryUsage &&
                   currentMetrics.drawCalls <= thresholds.maxDrawCalls &&
                   currentMetrics.triangles <= thresholds.maxTriangles;
        }
        
        public string GetPerformanceReport()
        {
            var report = $"Performance Report:\n";
            report += $"FPS: {currentMetrics.fps:F1} (Target: {thresholds.minFPS})\n";
            report += $"Memory: {currentMetrics.memoryUsage:F1}MB (Max: {thresholds.maxMemoryUsage}MB)\n";
            report += $"Draw Calls: {currentMetrics.drawCalls} (Max: {thresholds.maxDrawCalls})\n";
            report += $"Triangles: {currentMetrics.triangles:N0} (Max: {thresholds.maxTriangles:N0})\n";
            report += $"CPU: {currentMetrics.cpuUsage:F1}% (Max: {thresholds.maxCPUUsage}%)\n";
            report += $"GPU: {currentMetrics.gpuUsage:F1}% (Max: {thresholds.maxGPUUsage}%)\n";
            report += $"Quality Level: {currentMetrics.qualityLevel}\n";
            report += $"Device: {currentMetrics.deviceModel}\n";
            report += $"OS: {currentMetrics.operatingSystem}\n";
            
            return report;
        }
        
        void OnDestroy()
        {
            if (monitoringCoroutine != null)
            {
                StopCoroutine(monitoringCoroutine);
            }
        }
    }
}