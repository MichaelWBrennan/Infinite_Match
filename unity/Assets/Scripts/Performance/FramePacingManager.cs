using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using Evergreen.Core;

namespace Evergreen.Performance
{
    /// <summary>
    /// Advanced frame pacing system for consistent 60fps performance
    /// Implements industry-leading techniques from AAA mobile games
    /// </summary>
    public class FramePacingManager : MonoBehaviour
    {
        public static FramePacingManager Instance { get; private set; }

        [Header("Frame Pacing Settings")]
        public int targetFrameRate = 60;
        public bool enableFramePacing = true;
        public bool enableAdaptiveFrameRate = true;
        public bool enableFrameTimePrediction = true;
        public float frameTimeVarianceThreshold = 0.1f;

        [Header("Performance Monitoring")]
        public bool enableFrameTimeMonitoring = true;
        public int frameTimeHistorySize = 120; // 2 seconds at 60fps
        public float lowPerformanceThreshold = 0.9f;
        public float criticalPerformanceThreshold = 0.7f;

        [Header("Adaptive Settings")]
        public bool enableDynamicQuality = true;
        public bool enableBatteryOptimization = true;
        public bool enableThermalManagement = true;
        public float adaptationSpeed = 2f;
        public float adaptationCooldown = 5f;

        [Header("Mobile Optimization")]
        public bool enableMobileFramePacing = true;
        public bool enableBackgroundThrottling = true;
        public bool enableForegroundBoost = true;
        public int backgroundFrameRate = 30;
        public int foregroundFrameRate = 60;

        // Frame timing data
        private float _targetFrameTime;
        private float _currentFrameTime;
        private float _lastFrameTime;
        private float _frameTimeAccumulator;
        private int _frameCount;
        private float _lastFPSCalculationTime;

        // Frame time history
        private Queue<float> _frameTimeHistory = new Queue<float>();
        private float _averageFrameTime;
        private float _minFrameTime = float.MaxValue;
        private float _maxFrameTime = float.MinValue;
        private float _frameTimeVariance;

        // Performance tracking
        private int _droppedFrames = 0;
        private int _totalFrames = 0;
        private float _performanceScore = 1f;
        private bool _isLowPerformance = false;
        private bool _isCriticalPerformance = false;

        // Adaptive systems
        private float _lastAdaptationTime = 0f;
        private int _currentQualityLevel = 2;
        private bool _isBackground = false;
        private bool _isThermalThrottled = false;

        // Frame pacing
        private float _framePacingAccumulator = 0f;
        private float _lastFramePacingTime = 0f;
        private bool _framePacingActive = false;

        // Coroutines
        private Coroutine _framePacingCoroutine;
        private Coroutine _monitoringCoroutine;
        private Coroutine _adaptationCoroutine;

        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeFramePacing();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        void Start()
        {
            SetupFramePacing();
            StartMonitoring();
        }

        void Update()
        {
            UpdateFrameTiming();
            CheckPerformanceThresholds();
        }

        private void InitializeFramePacing()
        {
            _targetFrameTime = 1f / targetFrameRate;
            _lastFrameTime = Time.realtimeSinceStartup;
            _lastFPSCalculationTime = Time.realtimeSinceStartup;

            // Set initial frame rate
            Application.targetFrameRate = targetFrameRate;
            QualitySettings.vSyncCount = 0; // Disable VSync for manual control

            Logger.Info($"Frame Pacing Manager initialized - Target: {targetFrameRate} FPS", "FramePacing");
        }

        #region Frame Pacing Setup
        private void SetupFramePacing()
        {
            if (enableFramePacing)
            {
                _framePacingCoroutine = StartCoroutine(FramePacingLoop());
            }

            if (enableFrameTimeMonitoring)
            {
                _monitoringCoroutine = StartCoroutine(PerformanceMonitoringLoop());
            }

            if (enableAdaptiveFrameRate)
            {
                _adaptationCoroutine = StartCoroutine(AdaptiveFrameRateLoop());
            }

            // Setup mobile optimizations
            if (Application.isMobilePlatform && enableMobileFramePacing)
            {
                SetupMobileFramePacing();
            }
        }

        private void SetupMobileFramePacing()
        {
            // Detect device capabilities
            var deviceTier = DetectDeviceTier();
            
            switch (deviceTier)
            {
                case DeviceTier.Low:
                    targetFrameRate = 30;
                    _currentQualityLevel = 0;
                    break;
                case DeviceTier.Medium:
                    targetFrameRate = 45;
                    _currentQualityLevel = 1;
                    break;
                case DeviceTier.High:
                    targetFrameRate = 60;
                    _currentQualityLevel = 2;
                    break;
            }

            _targetFrameTime = 1f / targetFrameRate;
            Application.targetFrameRate = targetFrameRate;

            Logger.Info($"Mobile frame pacing setup - Device: {deviceTier}, Target: {targetFrameRate} FPS", "FramePacing");
        }

        private DeviceTier DetectDeviceTier()
        {
            var memorySize = SystemInfo.systemMemorySize;
            var gpuMemory = SystemInfo.graphicsMemorySize;
            var processorCount = SystemInfo.processorCount;

            if (memorySize >= 4096 && gpuMemory >= 1024 && processorCount >= 8)
                return DeviceTier.High;
            else if (memorySize >= 2048 && gpuMemory >= 512 && processorCount >= 4)
                return DeviceTier.Medium;
            else
                return DeviceTier.Low;
        }
        #endregion

        #region Frame Timing
        private void UpdateFrameTiming()
        {
            var currentTime = Time.realtimeSinceStartup;
            _currentFrameTime = currentTime - _lastFrameTime;
            _lastFrameTime = currentTime;

            // Update frame time history
            _frameTimeHistory.Enqueue(_currentFrameTime);
            if (_frameTimeHistory.Count > frameTimeHistorySize)
            {
                _frameTimeHistory.Dequeue();
            }

            // Calculate statistics
            CalculateFrameTimeStatistics();

            // Update frame count
            _frameCount++;
            _totalFrames++;

            // Calculate FPS periodically
            if (currentTime - _lastFPSCalculationTime >= 1f)
            {
                var fps = _frameCount / (currentTime - _lastFPSCalculationTime);
                _lastFPSCalculationTime = currentTime;
                _frameCount = 0;

                // Track dropped frames
                if (fps < targetFrameRate * lowPerformanceThreshold)
                {
                    _droppedFrames++;
                }
            }
        }

        private void CalculateFrameTimeStatistics()
        {
            if (_frameTimeHistory.Count == 0) return;

            var frameTimes = _frameTimeHistory.ToArray();
            _averageFrameTime = 0f;
            _minFrameTime = float.MaxValue;
            _maxFrameTime = float.MinValue;

            foreach (var frameTime in frameTimes)
            {
                _averageFrameTime += frameTime;
                _minFrameTime = Mathf.Min(_minFrameTime, frameTime);
                _maxFrameTime = Mathf.Max(_maxFrameTime, frameTime);
            }

            _averageFrameTime /= frameTimes.Length;

            // Calculate variance
            _frameTimeVariance = 0f;
            foreach (var frameTime in frameTimes)
            {
                var diff = frameTime - _averageFrameTime;
                _frameTimeVariance += diff * diff;
            }
            _frameTimeVariance /= frameTimes.Length;
            _frameTimeVariance = Mathf.Sqrt(_frameTimeVariance);

            // Calculate performance score
            _performanceScore = Mathf.Clamp01(_targetFrameTime / _averageFrameTime);
        }
        #endregion

        #region Frame Pacing
        private IEnumerator FramePacingLoop()
        {
            while (enableFramePacing)
            {
                var frameStartTime = Time.realtimeSinceStartup;
                
                // Wait for target frame time
                yield return new WaitForEndOfFrame();
                
                var frameEndTime = Time.realtimeSinceStartup;
                var actualFrameTime = frameEndTime - frameStartTime;
                
                if (actualFrameTime < _targetFrameTime)
                {
                    var waitTime = _targetFrameTime - actualFrameTime;
                    if (waitTime > 0.001f) // Only wait if significant
                    {
                        yield return new WaitForSeconds(waitTime);
                    }
                }

                // Update frame pacing accumulator
                _framePacingAccumulator += actualFrameTime;
                if (_framePacingAccumulator >= 1f)
                {
                    _framePacingAccumulator = 0f;
                    _framePacingActive = true;
                }
            }
        }

        public void SetTargetFrameRate(int frameRate)
        {
            targetFrameRate = frameRate;
            _targetFrameTime = 1f / frameRate;
            Application.targetFrameRate = frameRate;
            
            Logger.Info($"Target frame rate set to {frameRate} FPS", "FramePacing");
        }

        public void EnableFramePacing(bool enable)
        {
            enableFramePacing = enable;
            
            if (enable && _framePacingCoroutine == null)
            {
                _framePacingCoroutine = StartCoroutine(FramePacingLoop());
            }
            else if (!enable && _framePacingCoroutine != null)
            {
                StopCoroutine(_framePacingCoroutine);
                _framePacingCoroutine = null;
            }
        }
        #endregion

        #region Performance Monitoring
        private IEnumerator PerformanceMonitoringLoop()
        {
            while (enableFrameTimeMonitoring)
            {
                CheckPerformanceThresholds();
                yield return new WaitForSeconds(0.1f); // Check 10 times per second
            }
        }

        private void CheckPerformanceThresholds()
        {
            _isLowPerformance = _performanceScore < lowPerformanceThreshold;
            _isCriticalPerformance = _performanceScore < criticalPerformanceThreshold;

            if (_isCriticalPerformance)
            {
                OnCriticalPerformance();
            }
            else if (_isLowPerformance)
            {
                OnLowPerformance();
            }
            else
            {
                OnGoodPerformance();
            }
        }

        private void OnCriticalPerformance()
        {
            // Emergency measures
            if (Time.time - _lastAdaptationTime > adaptationCooldown)
            {
                EmergencyPerformanceOptimization();
                _lastAdaptationTime = Time.time;
            }
        }

        private void OnLowPerformance()
        {
            // Gradual optimization
            if (Time.time - _lastAdaptationTime > adaptationCooldown)
            {
                GradualPerformanceOptimization();
                _lastAdaptationTime = Time.time;
            }
        }

        private void OnGoodPerformance()
        {
            // Can potentially increase quality
            if (Time.time - _lastAdaptationTime > adaptationCooldown * 2)
            {
                ConsiderQualityIncrease();
                _lastAdaptationTime = Time.time;
            }
        }
        #endregion

        #region Adaptive Frame Rate
        private IEnumerator AdaptiveFrameRateLoop()
        {
            while (enableAdaptiveFrameRate)
            {
                if (enableBatteryOptimization)
                {
                    CheckBatteryLevel();
                }

                if (enableThermalManagement)
                {
                    CheckThermalState();
                }

                if (enableBackgroundThrottling)
                {
                    CheckApplicationState();
                }

                yield return new WaitForSeconds(1f);
            }
        }

        private void CheckBatteryLevel()
        {
            var batteryLevel = SystemInfo.batteryLevel;
            var batteryStatus = SystemInfo.batteryStatus;

            if (batteryLevel < 0.2f || batteryStatus == BatteryStatus.Low)
            {
                // Reduce frame rate for battery saving
                if (targetFrameRate > 30)
                {
                    SetTargetFrameRate(30);
                    Logger.Info("Frame rate reduced for battery saving", "FramePacing");
                }
            }
            else if (batteryLevel > 0.5f && batteryStatus == BatteryStatus.Normal)
            {
                // Can increase frame rate
                if (targetFrameRate < 60 && _performanceScore > 0.9f)
                {
                    SetTargetFrameRate(60);
                    Logger.Info("Frame rate increased - good battery level", "FramePacing");
                }
            }
        }

        private void CheckThermalState()
        {
            // Simplified thermal state detection
            // In a real implementation, this would use platform-specific APIs
            var currentFrameTime = Time.unscaledDeltaTime;
            var thermalThreshold = _targetFrameTime * 1.5f;

            if (currentFrameTime > thermalThreshold)
            {
                if (!_isThermalThrottled)
                {
                    _isThermalThrottled = true;
                    SetTargetFrameRate(Mathf.Max(targetFrameRate - 15, 30));
                    Logger.Info("Thermal throttling activated", "FramePacing");
                }
            }
            else if (_isThermalThrottled && currentFrameTime < _targetFrameTime * 1.1f)
            {
                _isThermalThrottled = false;
                SetTargetFrameRate(Mathf.Min(targetFrameRate + 15, 60));
                Logger.Info("Thermal throttling deactivated", "FramePacing");
            }
        }

        private void CheckApplicationState()
        {
            var isBackground = !Application.isFocused;
            
            if (isBackground != _isBackground)
            {
                _isBackground = isBackground;
                
                if (isBackground && enableBackgroundThrottling)
                {
                    SetTargetFrameRate(backgroundFrameRate);
                    Logger.Info("Application backgrounded - frame rate reduced", "FramePacing");
                }
                else if (!isBackground && enableForegroundBoost)
                {
                    SetTargetFrameRate(foregroundFrameRate);
                    Logger.Info("Application foregrounded - frame rate restored", "FramePacing");
                }
            }
        }
        #endregion

        #region Performance Optimization
        private void EmergencyPerformanceOptimization()
        {
            // Drastic measures for critical performance
            SetTargetFrameRate(30);
            _currentQualityLevel = 0;
            ApplyQualitySettings(_currentQualityLevel);
            
            // Disable expensive features
            DisableExpensiveFeatures();
            
            Logger.Warning("Emergency performance optimization applied", "FramePacing");
        }

        private void GradualPerformanceOptimization()
        {
            // Gradual quality reduction
            if (_currentQualityLevel > 0)
            {
                _currentQualityLevel--;
                ApplyQualitySettings(_currentQualityLevel);
                
                if (_currentQualityLevel == 0)
                {
                    SetTargetFrameRate(30);
                }
                
                Logger.Info($"Quality reduced to level {_currentQualityLevel}", "FramePacing");
            }
        }

        private void ConsiderQualityIncrease()
        {
            // Consider increasing quality if performance is good
            if (_currentQualityLevel < 2 && _performanceScore > 0.95f)
            {
                _currentQualityLevel++;
                ApplyQualitySettings(_currentQualityLevel);
                
                if (_currentQualityLevel == 2)
                {
                    SetTargetFrameRate(60);
                }
                
                Logger.Info($"Quality increased to level {_currentQualityLevel}", "FramePacing");
            }
        }

        private void ApplyQualitySettings(int qualityLevel)
        {
            switch (qualityLevel)
            {
                case 0: // Low
                    QualitySettings.SetQualityLevel(0);
                    QualitySettings.masterTextureLimit = 2;
                    QualitySettings.antiAliasing = 0;
                    QualitySettings.shadows = ShadowQuality.Disable;
                    break;
                case 1: // Medium
                    QualitySettings.SetQualityLevel(1);
                    QualitySettings.masterTextureLimit = 1;
                    QualitySettings.antiAliasing = 2;
                    QualitySettings.shadows = ShadowQuality.HardOnly;
                    break;
                case 2: // High
                    QualitySettings.SetQualityLevel(2);
                    QualitySettings.masterTextureLimit = 0;
                    QualitySettings.antiAliasing = 4;
                    QualitySettings.shadows = ShadowQuality.All;
                    break;
            }
        }

        private void DisableExpensiveFeatures()
        {
            // Disable particle systems
            var particleSystems = FindObjectsOfType<ParticleSystem>();
            foreach (var ps in particleSystems)
            {
                ps.gameObject.SetActive(false);
            }

            // Disable post-processing
            var postProcessVolumes = FindObjectsOfType<UnityEngine.Rendering.Volume>();
            foreach (var volume in postProcessVolumes)
            {
                volume.enabled = false;
            }
        }
        #endregion

        #region Statistics and Monitoring
        public Dictionary<string, object> GetFramePacingStats()
        {
            var currentFPS = 1f / _averageFrameTime;
            var droppedFrameRate = _totalFrames > 0 ? (float)_droppedFrames / _totalFrames * 100f : 0f;

            return new Dictionary<string, object>
            {
                {"target_frame_rate", targetFrameRate},
                {"current_fps", currentFPS},
                {"average_frame_time_ms", _averageFrameTime * 1000f},
                {"min_frame_time_ms", _minFrameTime * 1000f},
                {"max_frame_time_ms", _maxFrameTime * 1000f},
                {"frame_time_variance_ms", _frameTimeVariance * 1000f},
                {"performance_score", _performanceScore},
                {"dropped_frames", _droppedFrames},
                {"total_frames", _totalFrames},
                {"dropped_frame_rate_percent", droppedFrameRate},
                {"is_low_performance", _isLowPerformance},
                {"is_critical_performance", _isCriticalPerformance},
                {"current_quality_level", _currentQualityLevel},
                {"is_background", _isBackground},
                {"is_thermal_throttled", _isThermalThrottled},
                {"frame_pacing_active", _framePacingActive}
            };
        }

        public void ResetStats()
        {
            _droppedFrames = 0;
            _totalFrames = 0;
            _frameTimeHistory.Clear();
            _performanceScore = 1f;
            _isLowPerformance = false;
            _isCriticalPerformance = false;
        }
        #endregion

        #region Public API
        public void ForceFrameRate(int frameRate)
        {
            SetTargetFrameRate(frameRate);
            Logger.Info($"Frame rate forced to {frameRate} FPS", "FramePacing");
        }

        public void EnableAdaptiveFrameRate(bool enable)
        {
            enableAdaptiveFrameRate = enable;
            
            if (enable && _adaptationCoroutine == null)
            {
                _adaptationCoroutine = StartCoroutine(AdaptiveFrameRateLoop());
            }
            else if (!enable && _adaptationCoroutine != null)
            {
                StopCoroutine(_adaptationCoroutine);
                _adaptationCoroutine = null;
            }
        }

        public void SetQualityLevel(int level)
        {
            _currentQualityLevel = Mathf.Clamp(level, 0, 2);
            ApplyQualitySettings(_currentQualityLevel);
            Logger.Info($"Quality level set to {_currentQualityLevel}", "FramePacing");
        }
        #endregion

        void OnDestroy()
        {
            if (_framePacingCoroutine != null)
            {
                StopCoroutine(_framePacingCoroutine);
            }
            if (_monitoringCoroutine != null)
            {
                StopCoroutine(_monitoringCoroutine);
            }
            if (_adaptationCoroutine != null)
            {
                StopCoroutine(_adaptationCoroutine);
            }
        }

        public enum DeviceTier
        {
            Low,
            Medium,
            High
        }
    }
}