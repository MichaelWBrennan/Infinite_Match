using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using System.Runtime.InteropServices;
using Evergreen.Core;

namespace Match3Game.WebGL
{
    /// <summary>
    /// Mobile WebGL Performance Monitor
    /// Monitors and adapts performance for mobile WebGL builds
    /// </summary>
    public class MobileWebGLPerformanceMonitor : MonoBehaviour
    {
        public static MobileWebGLPerformanceMonitor Instance { get; private set; }

        [Header("Performance Monitoring")]
        public bool enablePerformanceMonitoring = true;
        public float monitoringInterval = 1.0f;
        public int performanceHistorySize = 60; // 1 minute at 1fps monitoring
        
        [Header("Adaptive Quality")]
        public bool enableAdaptiveQuality = true;
        public float fpsThresholdLow = 20f;
        public float fpsThresholdHigh = 45f;
        public float qualityChangeCooldown = 5.0f;
        
        [Header("Memory Management")]
        public bool enableMemoryMonitoring = true;
        public float memoryThreshold = 0.8f; // 80% of available memory
        public float memoryCleanupThreshold = 0.9f; // 90% of available memory
        
        [Header("Battery Optimization")]
        public bool enableBatteryOptimization = true;
        public float batteryCheckInterval = 30.0f;
        public float lowBatteryThreshold = 0.2f; // 20% battery
        
        // Performance data
        private Queue<float> _fpsHistory = new Queue<float>();
        private Queue<float> _memoryHistory = new Queue<float>();
        private Queue<float> _frameTimeHistory = new Queue<float>();
        
        // Current metrics
        private float _currentFPS = 0f;
        private float _averageFPS = 0f;
        private float _minFPS = float.MaxValue;
        private float _maxFPS = 0f;
        private float _currentMemory = 0f;
        private float _averageMemory = 0f;
        private float _currentFrameTime = 0f;
        private float _averageFrameTime = 0f;
        
        // Quality management
        private int _currentQualityLevel = 1;
        private float _lastQualityChange = 0f;
        private bool _isQualityChanging = false;
        
        // Battery monitoring
        private float _batteryLevel = 1.0f;
        private bool _isLowBattery = false;
        private float _lastBatteryCheck = 0f;
        
        // Performance states
        private PerformanceState _currentState = PerformanceState.Normal;
        private PerformanceState _previousState = PerformanceState.Normal;
        
        // Coroutines
        private Coroutine _monitoringCoroutine;
        private Coroutine _qualityAdaptationCoroutine;
        private Coroutine _memoryManagementCoroutine;
        
        #if UNITY_WEBGL && !UNITY_EDITOR
        // JavaScript function declarations
        [DllImport("__Internal")]
        private static extern void ReportPerformanceMetrics(string metricsJson);
        
        [DllImport("__Internal")]
        private static extern void SetMobileQualityLevel(int qualityLevel);
        
        [DllImport("__Internal")]
        private static extern void SetMobileFrameRate(int frameRate);
        
        [DllImport("__Internal")]
        private static extern void TriggerMemoryCleanup();
        
        [DllImport("__Internal")]
        private static extern float GetBatteryLevel();
        
        [DllImport("__Internal")]
        private static extern bool IsLowPowerMode();
        #endif

        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializePerformanceMonitor();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        void Start()
        {
            if (enablePerformanceMonitoring)
            {
                StartPerformanceMonitoring();
            }
        }

        void Update()
        {
            if (enablePerformanceMonitoring)
            {
                UpdateCurrentMetrics();
            }
        }

        private void InitializePerformanceMonitor()
        {
            Debug.Log("📊 Mobile WebGL Performance Monitor initialized");
            
            // Initialize quality level based on device
            _currentQualityLevel = GetInitialQualityLevel();
            QualitySettings.SetQualityLevel(_currentQualityLevel, true);
            
            // Set initial frame rate
            Application.targetFrameRate = GetInitialFrameRate();
        }

        private int GetInitialQualityLevel()
        {
            #if UNITY_WEBGL && !UNITY_EDITOR
            // Check if we're on mobile
            if (MobileWebGLSupport.Instance && MobileWebGLSupport.Instance.IsMobileDevice())
            {
                var deviceType = MobileWebGLSupport.Instance.GetDeviceType();
                return deviceType switch
                {
                    MobileDeviceType.iOS => 2, // High quality for iOS
                    MobileDeviceType.Android => 1, // Medium quality for Android
                    _ => 1 // Default to medium
                };
            }
            #endif
            
            return 1; // Default to medium quality
        }

        private int GetInitialFrameRate()
        {
            #if UNITY_WEBGL && !UNITY_EDITOR
            if (MobileWebGLSupport.Instance && MobileWebGLSupport.Instance.IsMobileDevice())
            {
                return 30; // 30 FPS for mobile
            }
            #endif
            
            return 60; // 60 FPS for desktop
        }

        private void StartPerformanceMonitoring()
        {
            if (_monitoringCoroutine != null)
            {
                StopCoroutine(_monitoringCoroutine);
            }
            
            _monitoringCoroutine = StartCoroutine(PerformanceMonitoringCoroutine());
            
            if (enableAdaptiveQuality)
            {
                _qualityAdaptationCoroutine = StartCoroutine(QualityAdaptationCoroutine());
            }
            
            if (enableMemoryMonitoring)
            {
                _memoryManagementCoroutine = StartCoroutine(MemoryManagementCoroutine());
            }
        }

        private void UpdateCurrentMetrics()
        {
            // Update FPS
            _currentFPS = 1.0f / Time.deltaTime;
            _currentFrameTime = Time.deltaTime * 1000f; // Convert to milliseconds
            
            // Update memory usage
            _currentMemory = GC.GetTotalMemory(false) / (1024f * 1024f); // Convert to MB
            
            // Update min/max FPS
            if (_currentFPS < _minFPS) _minFPS = _currentFPS;
            if (_currentFPS > _maxFPS) _maxFPS = _currentFPS;
        }

        private IEnumerator PerformanceMonitoringCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(monitoringInterval);
                
                // Add current metrics to history
                AddToHistory(_fpsHistory, _currentFPS);
                AddToHistory(_memoryHistory, _currentMemory);
                AddToHistory(_frameTimeHistory, _currentFrameTime);
                
                // Calculate averages
                _averageFPS = CalculateAverage(_fpsHistory);
                _averageMemory = CalculateAverage(_memoryHistory);
                _averageFrameTime = CalculateAverage(_frameTimeHistory);
                
                // Update performance state
                UpdatePerformanceState();
                
                // Report metrics to JavaScript
                ReportMetricsToJavaScript();
                
                // Log performance info
                LogPerformanceInfo();
            }
        }

        private IEnumerator QualityAdaptationCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(1.0f);
                
                if (Time.time - _lastQualityChange < qualityChangeCooldown)
                    continue;
                
                if (_isQualityChanging)
                    continue;
                
                // Check if we need to change quality
                int targetQuality = DetermineTargetQuality();
                
                if (targetQuality != _currentQualityLevel)
                {
                    yield return StartCoroutine(ChangeQualityLevel(targetQuality));
                }
            }
        }

        private IEnumerator MemoryManagementCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(5.0f);
                
                if (enableMemoryMonitoring)
                {
                    CheckMemoryUsage();
                }
                
                if (enableBatteryOptimization)
                {
                    CheckBatteryLevel();
                }
            }
        }

        private void AddToHistory(Queue<float> history, float value)
        {
            history.Enqueue(value);
            
            if (history.Count > performanceHistorySize)
            {
                history.Dequeue();
            }
        }

        private float CalculateAverage(Queue<float> history)
        {
            if (history.Count == 0) return 0f;
            
            float sum = 0f;
            foreach (float value in history)
            {
                sum += value;
            }
            
            return sum / history.Count;
        }

        private void UpdatePerformanceState()
        {
            _previousState = _currentState;
            
            if (_averageFPS < fpsThresholdLow)
            {
                _currentState = PerformanceState.Poor;
            }
            else if (_averageFPS < fpsThresholdHigh)
            {
                _currentState = PerformanceState.Fair;
            }
            else
            {
                _currentState = PerformanceState.Good;
            }
            
            // Check for memory pressure
            if (_averageMemory > memoryThreshold * 1000f) // Convert MB to bytes
            {
                _currentState = PerformanceState.MemoryPressure;
            }
            
            // Check for low battery
            if (_isLowBattery)
            {
                _currentState = PerformanceState.LowBattery;
            }
        }

        private int DetermineTargetQuality()
        {
            int targetQuality = _currentQualityLevel;
            
            switch (_currentState)
            {
                case PerformanceState.Poor:
                    targetQuality = Mathf.Max(0, _currentQualityLevel - 1);
                    break;
                case PerformanceState.Fair:
                    // Keep current quality
                    break;
                case PerformanceState.Good:
                    if (_averageFPS > fpsThresholdHigh * 1.2f)
                    {
                        targetQuality = Mathf.Min(3, _currentQualityLevel + 1);
                    }
                    break;
                case PerformanceState.MemoryPressure:
                    targetQuality = Mathf.Max(0, _currentQualityLevel - 1);
                    break;
                case PerformanceState.LowBattery:
                    targetQuality = Mathf.Max(0, _currentQualityLevel - 1);
                    break;
            }
            
            return targetQuality;
        }

        private IEnumerator ChangeQualityLevel(int newQuality)
        {
            _isQualityChanging = true;
            _lastQualityChange = Time.time;
            
            Debug.Log($"🎨 Changing quality from {_currentQualityLevel} to {newQuality} (State: {_currentState})");
            
            // Apply quality settings
            _currentQualityLevel = newQuality;
            QualitySettings.SetQualityLevel(newQuality, true);
            
            // Apply mobile-specific optimizations
            ApplyMobileQualitySettings(newQuality);
            
            // Notify JavaScript
            #if UNITY_WEBGL && !UNITY_EDITOR
            SetMobileQualityLevel(newQuality);
            #endif
            
            // Wait a bit for the change to take effect
            yield return new WaitForSeconds(2.0f);
            
            _isQualityChanging = false;
        }

        private void ApplyMobileQualitySettings(int qualityLevel)
        {
            switch (qualityLevel)
            {
                case 0: // Low
                    QualitySettings.masterTextureLimit = 2;
                    QualitySettings.antiAliasing = 0;
                    QualitySettings.shadows = ShadowQuality.Disable;
                    QualitySettings.anisotropicFiltering = AnisotropicFiltering.Disable;
                    Application.targetFrameRate = 20;
                    break;
                case 1: // Medium
                    QualitySettings.masterTextureLimit = 1;
                    QualitySettings.antiAliasing = 0;
                    QualitySettings.shadows = ShadowQuality.Disable;
                    QualitySettings.anisotropicFiltering = AnisotropicFiltering.Disable;
                    Application.targetFrameRate = 30;
                    break;
                case 2: // High
                    QualitySettings.masterTextureLimit = 0;
                    QualitySettings.antiAliasing = 2;
                    QualitySettings.shadows = ShadowQuality.HardOnly;
                    QualitySettings.anisotropicFiltering = AnisotropicFiltering.Enable;
                    Application.targetFrameRate = 45;
                    break;
                case 3: // Ultra
                    QualitySettings.masterTextureLimit = 0;
                    QualitySettings.antiAliasing = 4;
                    QualitySettings.shadows = ShadowQuality.All;
                    QualitySettings.anisotropicFiltering = AnisotropicFiltering.Enable;
                    Application.targetFrameRate = 60;
                    break;
            }
            
            #if UNITY_WEBGL && !UNITY_EDITOR
            SetMobileFrameRate(Application.targetFrameRate);
            #endif
        }

        private void CheckMemoryUsage()
        {
            float memoryRatio = _currentMemory / (1024f * 1024f); // Convert to GB
            
            if (memoryRatio > memoryCleanupThreshold)
            {
                Debug.LogWarning($"🧹 High memory usage detected: {_currentMemory:F2}MB, triggering cleanup");
                TriggerMemoryCleanup();
            }
        }

        private void CheckBatteryLevel()
        {
            if (Time.time - _lastBatteryCheck < batteryCheckInterval)
                return;
            
            _lastBatteryCheck = Time.time;
            
            #if UNITY_WEBGL && !UNITY_EDITOR
            try
            {
                _batteryLevel = GetBatteryLevel();
                _isLowBattery = _batteryLevel < lowBatteryThreshold || IsLowPowerMode();
                
                if (_isLowBattery)
                {
                    Debug.LogWarning($"🔋 Low battery detected: {_batteryLevel:P0}, enabling power saving mode");
                    EnablePowerSavingMode();
                }
            }
            catch (Exception e)
            {
                Debug.LogWarning($"⚠️ Could not check battery level: {e.Message}");
            }
            #endif
        }

        private void EnablePowerSavingMode()
        {
            // Reduce frame rate
            Application.targetFrameRate = 20;
            
            // Reduce quality
            if (_currentQualityLevel > 0)
            {
                StartCoroutine(ChangeQualityLevel(0));
            }
            
            // Disable expensive effects
            QualitySettings.masterTextureLimit = 2;
            QualitySettings.antiAliasing = 0;
            QualitySettings.shadows = ShadowQuality.Disable;
        }

        private void TriggerMemoryCleanup()
        {
            // Force garbage collection
            GC.Collect();
            GC.WaitForPendingFinalizers();
            GC.Collect();
            
            // Unload unused assets
            Resources.UnloadUnusedAssets();
            
            #if UNITY_WEBGL && !UNITY_EDITOR
            TriggerMemoryCleanup();
            #endif
            
            Debug.Log("🧹 Memory cleanup completed");
        }

        private void ReportMetricsToJavaScript()
        {
            #if UNITY_WEBGL && !UNITY_EDITOR
            try
            {
                var metrics = new PerformanceMetrics
                {
                    fps = _currentFPS,
                    averageFPS = _averageFPS,
                    minFPS = _minFPS,
                    maxFPS = _maxFPS,
                    memoryUsage = _currentMemory,
                    averageMemory = _averageMemory,
                    frameTime = _currentFrameTime,
                    averageFrameTime = _averageFrameTime,
                    qualityLevel = _currentQualityLevel,
                    performanceState = _currentState.ToString(),
                    batteryLevel = _batteryLevel,
                    isLowBattery = _isLowBattery,
                    timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
                };
                
                string metricsJson = JsonUtility.ToJson(metrics);
                ReportPerformanceMetrics(metricsJson);
            }
            catch (Exception e)
            {
                Debug.LogError($"❌ Failed to report metrics to JavaScript: {e.Message}");
            }
            #endif
        }

        private void LogPerformanceInfo()
        {
            if (Time.frameCount % 60 == 0) // Log every 60 frames
            {
                Debug.Log($"📊 Mobile WebGL Performance - FPS: {_averageFPS:F1} (Min: {_minFPS:F1}, Max: {_maxFPS:F1}), " +
                         $"Memory: {_averageMemory:F1}MB, Quality: {_currentQualityLevel}, State: {_currentState}");
            }
        }

        // Public API
        public PerformanceMetrics GetCurrentMetrics()
        {
            return new PerformanceMetrics
            {
                fps = _currentFPS,
                averageFPS = _averageFPS,
                minFPS = _minFPS,
                maxFPS = _maxFPS,
                memoryUsage = _currentMemory,
                averageMemory = _averageMemory,
                frameTime = _currentFrameTime,
                averageFrameTime = _averageFrameTime,
                qualityLevel = _currentQualityLevel,
                performanceState = _currentState.ToString(),
                batteryLevel = _batteryLevel,
                isLowBattery = _isLowBattery,
                timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            };
        }

        public void ForceQualityLevel(int qualityLevel)
        {
            if (qualityLevel >= 0 && qualityLevel <= 3)
            {
                StartCoroutine(ChangeQualityLevel(qualityLevel));
            }
        }

        public void EnablePerformanceMonitoring(bool enable)
        {
            enablePerformanceMonitoring = enable;
            
            if (enable)
            {
                StartPerformanceMonitoring();
            }
            else
            {
                if (_monitoringCoroutine != null)
                {
                    StopCoroutine(_monitoringCoroutine);
                    _monitoringCoroutine = null;
                }
            }
        }

        void OnDestroy()
        {
            if (_monitoringCoroutine != null)
            {
                StopCoroutine(_monitoringCoroutine);
            }
            
            if (_qualityAdaptationCoroutine != null)
            {
                StopCoroutine(_qualityAdaptationCoroutine);
            }
            
            if (_memoryManagementCoroutine != null)
            {
                StopCoroutine(_memoryManagementCoroutine);
            }
        }
    }

    // Data classes
    public enum PerformanceState
    {
        Poor,
        Fair,
        Good,
        MemoryPressure,
        LowBattery
    }

    [System.Serializable]
    public class PerformanceMetrics
    {
        public float fps;
        public float averageFPS;
        public float minFPS;
        public float maxFPS;
        public float memoryUsage;
        public float averageMemory;
        public float frameTime;
        public float averageFrameTime;
        public int qualityLevel;
        public string performanceState;
        public float batteryLevel;
        public bool isLowBattery;
        public string timestamp;
    }
}