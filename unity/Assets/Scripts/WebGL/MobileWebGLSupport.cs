using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using System.Runtime.InteropServices;
using Evergreen.Core;

namespace Match3Game.WebGL
{
    /// <summary>
    /// Mobile WebGL Support System
    /// Provides mobile-specific optimizations and compatibility for WebGL builds
    /// </summary>
    public class MobileWebGLSupport : MonoBehaviour
    {
        public static MobileWebGLSupport Instance { get; private set; }

        [Header("Mobile WebGL Configuration")]
        public bool enableMobileWebGL = true;
        public bool enableMobileOptimizations = true;
        public bool enableTouchOptimizations = true;
        public bool enableMobileMemoryManagement = true;
        public bool enableMobilePerformanceMonitoring = true;

        [Header("Mobile Performance Settings")]
        public int mobileTargetFrameRate = 30;
        public int mobileMaxMemoryMB = 128;
        public float mobileQualityReductionThreshold = 0.8f;
        public bool enableAdaptiveQuality = true;
        public bool enableMobileBatteryOptimization = true;

        [Header("Touch Input Settings")]
        public bool enableTouchInput = true;
        public bool enableGestureRecognition = true;
        public float touchSensitivity = 1.0f;
        public float gestureThreshold = 10.0f;

        // Mobile device detection
        private bool _isMobileDevice = false;
        private bool _isWebGLBuild = false;
        private MobileDeviceType _deviceType = MobileDeviceType.Unknown;
        private MobilePerformanceLevel _performanceLevel = MobilePerformanceLevel.Medium;

        // Performance monitoring
        private float _currentFPS = 0f;
        private float _averageFPS = 0f;
        private float _memoryUsage = 0f;
        private int _frameCount = 0;
        private float _lastPerformanceCheck = 0f;

        // Touch input
        private List<Touch> _activeTouches = new List<Touch>();
        private Dictionary<int, Vector2> _touchStartPositions = new Dictionary<int, Vector2>();
        private Dictionary<int, float> _touchStartTimes = new Dictionary<int, float>();

        #if UNITY_WEBGL && !UNITY_EDITOR
        // JavaScript function declarations for mobile WebGL
        [DllImport("__Internal")]
        private static extern bool IsMobileDevice();

        [DllImport("__Internal")]
        private static extern string GetMobileDeviceInfo();

        [DllImport("__Internal")]
        private static extern void SetMobileViewport();

        [DllImport("__Internal")]
        private static extern void EnableMobileTouch();

        [DllImport("__Internal")]
        private static extern void OptimizeForMobile();

        [DllImport("__Internal")]
        private static extern void SetMobileQuality(int qualityLevel);

        [DllImport("__Internal")]
        private static extern void SetMobileFrameRate(int frameRate);
        #endif

        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeMobileWebGLSupport();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        void Start()
        {
            StartCoroutine(InitializeMobileWebGL());
        }

        void Update()
        {
            if (_isMobileDevice && _isWebGLBuild)
            {
                UpdateMobilePerformance();
                HandleTouchInput();
            }
        }

        private void InitializeMobileWebGLSupport()
        {
            #if UNITY_WEBGL && !UNITY_EDITOR
            _isWebGLBuild = true;
            #else
            _isWebGLBuild = false;
            #endif

            Debug.Log($"🌐 Mobile WebGL Support initialized - WebGL: {_isWebGLBuild}");
        }

        private IEnumerator InitializeMobileWebGL()
        {
            yield return new WaitForEndOfFrame();

            #if UNITY_WEBGL && !UNITY_EDITOR
            try
            {
                // Detect mobile device
                _isMobileDevice = IsMobileDevice();
                
                if (_isMobileDevice)
                {
                    Debug.Log("📱 Mobile device detected for WebGL build");
                    
                    // Get device information
                    string deviceInfo = GetMobileDeviceInfo();
                    Debug.Log($"📱 Device Info: {deviceInfo}");
                    
                    // Set mobile viewport
                    SetMobileViewport();
                    
                    // Enable mobile touch
                    if (enableTouchInput)
                    {
                        EnableMobileTouch();
                    }
                    
                    // Optimize for mobile
                    OptimizeForMobile();
                    
                    // Detect device type and performance level
                    DetectMobileDevice();
                    
                    // Apply mobile optimizations
                    ApplyMobileOptimizations();
                    
                    // Set up performance monitoring
                    if (enableMobilePerformanceMonitoring)
                    {
                        StartCoroutine(MobilePerformanceMonitoring());
                    }
                }
                else
                {
                    Debug.Log("🖥️ Desktop device detected for WebGL build");
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"❌ Failed to initialize mobile WebGL support: {e.Message}");
            }
            #else
            Debug.Log("🚀 Non-WebGL build detected, mobile WebGL features disabled");
            #endif

            yield return null;
        }

        private void DetectMobileDevice()
        {
            #if UNITY_WEBGL && !UNITY_EDITOR
            try
            {
                string userAgent = GetMobileDeviceInfo();
                
                if (userAgent.Contains("iPhone") || userAgent.Contains("iPad"))
                {
                    _deviceType = MobileDeviceType.iOS;
                    _performanceLevel = MobilePerformanceLevel.High;
                }
                else if (userAgent.Contains("Android"))
                {
                    _deviceType = MobileDeviceType.Android;
                    _performanceLevel = MobilePerformanceLevel.Medium;
                }
                else if (userAgent.Contains("Windows Phone"))
                {
                    _deviceType = MobileDeviceType.WindowsPhone;
                    _performanceLevel = MobilePerformanceLevel.Low;
                }
                else
                {
                    _deviceType = MobileDeviceType.Unknown;
                    _performanceLevel = MobilePerformanceLevel.Medium;
                }
                
                Debug.Log($"📱 Detected device: {_deviceType}, Performance: {_performanceLevel}");
            }
            catch (Exception e)
            {
                Debug.LogError($"❌ Failed to detect mobile device: {e.Message}");
                _deviceType = MobileDeviceType.Unknown;
                _performanceLevel = MobilePerformanceLevel.Medium;
            }
            #endif
        }

        private void ApplyMobileOptimizations()
        {
            if (!enableMobileOptimizations) return;

            // Set target frame rate
            Application.targetFrameRate = mobileTargetFrameRate;
            SetMobileFrameRate(mobileTargetFrameRate);

            // Apply quality settings based on device performance
            int qualityLevel = GetQualityLevelForDevice();
            SetMobileQuality(qualityLevel);
            QualitySettings.SetQualityLevel(qualityLevel, true);

            // Apply mobile-specific optimizations
            ApplyMobileQualitySettings();
            ApplyMobileMemorySettings();
            ApplyMobileInputSettings();

            Debug.Log($"📱 Applied mobile optimizations - Quality: {qualityLevel}, FPS: {mobileTargetFrameRate}");
        }

        private int GetQualityLevelForDevice()
        {
            return _performanceLevel switch
            {
                MobilePerformanceLevel.Low => 0,      // Low quality
                MobilePerformanceLevel.Medium => 1,   // Medium quality
                MobilePerformanceLevel.High => 2,     // High quality
                MobilePerformanceLevel.Ultra => 3,    // Ultra quality
                _ => 1
            };
        }

        private void ApplyMobileQualitySettings()
        {
            // Reduce texture quality for mobile
            QualitySettings.masterTextureLimit = 1;
            
            // Disable expensive effects
            QualitySettings.antiAliasing = 0;
            QualitySettings.shadows = ShadowQuality.Disable;
            QualitySettings.anisotropicFiltering = AnisotropicFiltering.Disable;
            
            // Optimize for mobile GPUs
            QualitySettings.particleRaycastBudget = 64;
            QualitySettings.maxQueuedFrames = 1;
        }

        private void ApplyMobileMemorySettings()
        {
            if (!enableMobileMemoryManagement) return;

            // Set memory limits
            Application.targetFrameRate = mobileTargetFrameRate;
            
            // Enable garbage collection optimization
            if (enableMobileBatteryOptimization)
            {
                StartCoroutine(MobileMemoryManagement());
            }
        }

        private void ApplyMobileInputSettings()
        {
            if (!enableTouchInput) return;

            // Configure touch input
            Input.multiTouchEnabled = true;
            
            // Set up gesture recognition
            if (enableGestureRecognition)
            {
                StartCoroutine(GestureRecognition());
            }
        }

        private void UpdateMobilePerformance()
        {
            if (!enableMobilePerformanceMonitoring) return;

            // Update FPS
            _currentFPS = 1.0f / Time.deltaTime;
            _averageFPS = (_averageFPS * _frameCount + _currentFPS) / (_frameCount + 1);
            _frameCount++;

            // Update memory usage
            _memoryUsage = GC.GetTotalMemory(false) / (1024f * 1024f);

            // Check if we need to reduce quality
            if (enableAdaptiveQuality && Time.time - _lastPerformanceCheck > 1.0f)
            {
                CheckPerformanceAndAdjustQuality();
                _lastPerformanceCheck = Time.time;
            }
        }

        private void CheckPerformanceAndAdjustQuality()
        {
            float performanceRatio = _averageFPS / mobileTargetFrameRate;
            
            if (performanceRatio < mobileQualityReductionThreshold)
            {
                // Reduce quality
                int currentQuality = QualitySettings.GetQualityLevel();
                if (currentQuality > 0)
                {
                    SetMobileQuality(currentQuality - 1);
                    QualitySettings.SetQualityLevel(currentQuality - 1, true);
                    Debug.Log($"📱 Reduced quality to level {currentQuality - 1} due to performance");
                }
            }
            else if (performanceRatio > 1.2f && QualitySettings.GetQualityLevel() < 3)
            {
                // Increase quality
                int currentQuality = QualitySettings.GetQualityLevel();
                SetMobileQuality(currentQuality + 1);
                QualitySettings.SetQualityLevel(currentQuality + 1, true);
                Debug.Log($"📱 Increased quality to level {currentQuality + 1} due to good performance");
            }
        }

        private void HandleTouchInput()
        {
            if (!enableTouchInput) return;

            _activeTouches.Clear();
            
            for (int i = 0; i < Input.touchCount; i++)
            {
                Touch touch = Input.GetTouch(i);
                _activeTouches.Add(touch);

                switch (touch.phase)
                {
                    case TouchPhase.Began:
                        _touchStartPositions[touch.fingerId] = touch.position;
                        _touchStartTimes[touch.fingerId] = Time.time;
                        OnTouchStart(touch);
                        break;
                    case TouchPhase.Moved:
                        OnTouchMove(touch);
                        break;
                    case TouchPhase.Ended:
                    case TouchPhase.Canceled:
                        OnTouchEnd(touch);
                        _touchStartPositions.Remove(touch.fingerId);
                        _touchStartTimes.Remove(touch.fingerId);
                        break;
                }
            }
        }

        private void OnTouchStart(Touch touch)
        {
            // Convert touch to world position
            Vector3 worldPos = Camera.main.ScreenToWorldPoint(touch.position);
            worldPos.z = 0;

            // Send touch event to game systems
            SendTouchEvent("TouchStart", touch.fingerId, worldPos, touch.position);
        }

        private void OnTouchMove(Touch touch)
        {
            Vector3 worldPos = Camera.main.ScreenToWorldPoint(touch.position);
            worldPos.z = 0;

            SendTouchEvent("TouchMove", touch.fingerId, worldPos, touch.position);
        }

        private void OnTouchEnd(Touch touch)
        {
            Vector3 worldPos = Camera.main.ScreenToWorldPoint(touch.position);
            worldPos.z = 0;

            // Check for gestures
            if (enableGestureRecognition)
            {
                CheckForGestures(touch);
            }

            SendTouchEvent("TouchEnd", touch.fingerId, worldPos, touch.position);
        }

        private void CheckForGestures(Touch touch)
        {
            if (!_touchStartPositions.ContainsKey(touch.fingerId)) return;

            Vector2 startPos = _touchStartPositions[touch.fingerId];
            Vector2 endPos = touch.position;
            float touchTime = Time.time - _touchStartTimes[touch.fingerId];

            Vector2 delta = endPos - startPos;
            float distance = delta.magnitude;

            // Tap gesture
            if (distance < gestureThreshold && touchTime < 0.5f)
            {
                SendGestureEvent("Tap", touch.fingerId, startPos, endPos);
            }
            // Swipe gesture
            else if (distance > gestureThreshold && touchTime < 1.0f)
            {
                Vector2 direction = delta.normalized;
                string swipeDirection = GetSwipeDirection(direction);
                SendGestureEvent($"Swipe{swipeDirection}", touch.fingerId, startPos, endPos);
            }
        }

        private string GetSwipeDirection(Vector2 direction)
        {
            float angle = Mathf.Atan2(direction.y, direction.x) * Mathf.Rad2Deg;
            
            if (angle > -45 && angle <= 45) return "Right";
            if (angle > 45 && angle <= 135) return "Up";
            if (angle > 135 || angle <= -135) return "Left";
            return "Down";
        }

        private void SendTouchEvent(string eventType, int fingerId, Vector3 worldPos, Vector2 screenPos)
        {
            // Send to game systems
            var touchData = new TouchEventData
            {
                eventType = eventType,
                fingerId = fingerId,
                worldPosition = worldPos,
                screenPosition = screenPos,
                timestamp = Time.time
            };

            // Broadcast to all touch listeners
            BroadcastMessage("OnTouchEvent", touchData, SendMessageOptions.DontRequireReceiver);
        }

        private void SendGestureEvent(string gestureType, int fingerId, Vector2 startPos, Vector2 endPos)
        {
            var gestureData = new GestureEventData
            {
                gestureType = gestureType,
                fingerId = fingerId,
                startPosition = startPos,
                endPosition = endPos,
                timestamp = Time.time
            };

            BroadcastMessage("OnGestureEvent", gestureData, SendMessageOptions.DontRequireReceiver);
        }

        private IEnumerator MobilePerformanceMonitoring()
        {
            while (true)
            {
                yield return new WaitForSeconds(1.0f);

                if (enableMobilePerformanceMonitoring)
                {
                    LogPerformanceMetrics();
                }
            }
        }

        private IEnumerator MobileMemoryManagement()
        {
            while (true)
            {
                yield return new WaitForSeconds(5.0f);

                if (enableMobileMemoryManagement && _memoryUsage > mobileMaxMemoryMB)
                {
                    // Trigger garbage collection
                    GC.Collect();
                    GC.WaitForPendingFinalizers();
                    GC.Collect();

                    Debug.Log($"📱 Mobile memory management: GC triggered. Memory: {_memoryUsage:F2}MB");
                }
            }
        }

        private IEnumerator GestureRecognition()
        {
            while (true)
            {
                yield return new WaitForEndOfFrame();
                // Gesture recognition is handled in Update()
            }
        }

        private void LogPerformanceMetrics()
        {
            Debug.Log($"📱 Mobile WebGL Performance - FPS: {_averageFPS:F1}, Memory: {_memoryUsage:F2}MB, Quality: {QualitySettings.GetQualityLevel()}");
        }

        // Public API
        public bool IsMobileDevice() => _isMobileDevice;
        public bool IsWebGLBuild() => _isWebGLBuild;
        public MobileDeviceType GetDeviceType() => _deviceType;
        public MobilePerformanceLevel GetPerformanceLevel() => _performanceLevel;
        public float GetCurrentFPS() => _currentFPS;
        public float GetAverageFPS() => _averageFPS;
        public float GetMemoryUsage() => _memoryUsage;

        public void SetMobileQuality(int qualityLevel)
        {
            #if UNITY_WEBGL && !UNITY_EDITOR
            SetMobileQuality(qualityLevel);
            #endif
            QualitySettings.SetQualityLevel(qualityLevel, true);
        }

        public void SetMobileFrameRate(int frameRate)
        {
            mobileTargetFrameRate = frameRate;
            Application.targetFrameRate = frameRate;
            #if UNITY_WEBGL && !UNITY_EDITOR
            SetMobileFrameRate(frameRate);
            #endif
        }

        void OnDestroy()
        {
            // Cleanup
        }
    }

    // Data classes
    public enum MobileDeviceType
    {
        Unknown,
        iOS,
        Android,
        WindowsPhone
    }

    public enum MobilePerformanceLevel
    {
        Low,
        Medium,
        High,
        Ultra
    }

    [System.Serializable]
    public class TouchEventData
    {
        public string eventType;
        public int fingerId;
        public Vector3 worldPosition;
        public Vector2 screenPosition;
        public float timestamp;
    }

    [System.Serializable]
    public class GestureEventData
    {
        public string gestureType;
        public int fingerId;
        public Vector2 startPosition;
        public Vector2 endPosition;
        public float timestamp;
    }
}