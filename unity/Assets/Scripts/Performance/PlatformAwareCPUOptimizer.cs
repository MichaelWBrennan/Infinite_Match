using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using System.Threading.Tasks;
using Evergreen.Core;

namespace Evergreen.Performance
{
    /// <summary>
    /// PLATFORM-AWARE CPU OPTIMIZER
    /// Automatically switches between full performance and WebGL-compatible optimization
    /// Uses platform detection to provide optimal performance for each platform
    /// </summary>
    public class PlatformAwareCPUOptimizer : MonoBehaviour
    {
        public static PlatformAwareCPUOptimizer Instance { get; private set; }

        [Header("Platform Detection")]
        public bool enablePlatformDetection = true;
        public bool enableWebGLFallback = true;
        public bool enableDesktopOptimization = true;
        public bool enableMobileOptimization = true;

        [Header("WebGL Settings")]
        public bool enableWebGLOptimization = true;
        public bool enableCoroutineOptimization = true;
        public bool enableAsyncOptimization = true;
        public bool enableChunkedProcessing = true;
        public int maxChunkSize = 100;
        public float processingTimePerFrame = 0.016f;

        [Header("Desktop Settings")]
        public bool enableDesktopThreading = true;
        public bool enableSIMDOptimization = true;
        public bool enableAdvancedMemoryManagement = true;
        public int maxWorkerThreads = 8;

        [Header("Mobile Settings")]
        public bool enableMobileOptimization = true;
        public bool enableBatteryOptimization = true;
        public bool enableThermalOptimization = true;
        public int maxMobileThreads = 4;

        // Platform capabilities
        private PlatformCapabilities _platformCapabilities;
        private ICPUOptimizer _currentOptimizer;

        // WebGL optimizer
        private WebGLCompatibleCPUOptimizer _webGLOptimizer;

        // Desktop optimizer (if available)
        private UltraCPUOptimizer _desktopOptimizer;

        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
            }
            else
            {
                Destroy(gameObject);
            }
        }

        void Start()
        {
            InitializePlatformOptimizer();
        }

        private void InitializePlatformOptimizer()
        {
            Debug.Log("🔍 Detecting platform capabilities...");
            
            _platformCapabilities = DetectPlatformCapabilities();
            
            // Initialize appropriate optimizer based on platform
            if (_platformCapabilities.supportsThreading && _platformCapabilities.supportsSIMD)
            {
                InitializeDesktopOptimizer();
            }
            else
            {
                InitializeWebGLOptimizer();
            }
            
            Debug.Log($"✅ Platform optimizer initialized for: {_platformCapabilities.platform}");
        }

        private PlatformCapabilities DetectPlatformCapabilities()
        {
            var capabilities = new PlatformCapabilities();
            
            #if UNITY_WEBGL && !UNITY_EDITOR
            // WebGL - Limited capabilities
            capabilities.platform = "WebGL";
            capabilities.supportsThreading = false;
            capabilities.supportsSIMD = false;
            capabilities.supportsFileIO = false;
            capabilities.supportsAsyncAwait = true;
            capabilities.supportsCoroutines = true;
            capabilities.optimizationLevel = OptimizationLevel.Basic;
            capabilities.maxWorkerThreads = 1;
            #elif UNITY_ANDROID || UNITY_IOS
            // Mobile - Good capabilities
            capabilities.platform = "Mobile";
            capabilities.supportsThreading = true;
            capabilities.supportsSIMD = true;
            capabilities.supportsFileIO = true;
            capabilities.supportsAsyncAwait = true;
            capabilities.supportsCoroutines = true;
            capabilities.optimizationLevel = OptimizationLevel.Advanced;
            capabilities.maxWorkerThreads = 4;
            #elif UNITY_STANDALONE_WIN || UNITY_STANDALONE_OSX || UNITY_STANDALONE_LINUX
            // Desktop - Full capabilities
            capabilities.platform = "Desktop";
            capabilities.supportsThreading = true;
            capabilities.supportsSIMD = true;
            capabilities.supportsFileIO = true;
            capabilities.supportsAsyncAwait = true;
            capabilities.supportsCoroutines = true;
            capabilities.optimizationLevel = OptimizationLevel.Ultra;
            capabilities.maxWorkerThreads = 8;
            #else
            // Editor - Full capabilities
            capabilities.platform = "Editor";
            capabilities.supportsThreading = true;
            capabilities.supportsSIMD = true;
            capabilities.supportsFileIO = true;
            capabilities.supportsAsyncAwait = true;
            capabilities.supportsCoroutines = true;
            capabilities.optimizationLevel = OptimizationLevel.Ultra;
            capabilities.maxWorkerThreads = 16;
            #endif
            
            return capabilities;
        }

        private void InitializeWebGLOptimizer()
        {
            Debug.Log("🌐 Initializing WebGL-compatible optimizer...");
            
            _webGLOptimizer = gameObject.AddComponent<WebGLCompatibleCPUOptimizer>();
            _currentOptimizer = _webGLOptimizer;
            
            // Configure WebGL settings
            _webGLOptimizer.enableWebGLOptimization = enableWebGLOptimization;
            _webGLOptimizer.enableCoroutineOptimization = enableCoroutineOptimization;
            _webGLOptimizer.enableAsyncOptimization = enableAsyncOptimization;
            _webGLOptimizer.enableChunkedProcessing = enableChunkedProcessing;
            _webGLOptimizer.maxChunkSize = maxChunkSize;
            _webGLOptimizer.processingTimePerFrame = processingTimePerFrame;
        }

        private void InitializeDesktopOptimizer()
        {
            Debug.Log("🚀 Initializing desktop optimizer...");
            
            // Try to use UltraCPUOptimizer if available
            try
            {
                _desktopOptimizer = gameObject.AddComponent<UltraCPUOptimizer>();
                _currentOptimizer = _desktopOptimizer;
                
                // Configure desktop settings
                _desktopOptimizer.enableUltraMultithreading = enableDesktopThreading;
                _desktopOptimizer.maxWorkerThreads = maxWorkerThreads;
                
                Debug.Log("✅ Desktop optimizer initialized with full capabilities");
            }
            catch (Exception e)
            {
                Debug.LogWarning($"⚠️ Desktop optimizer failed to initialize: {e.Message}");
                Debug.Log("🔄 Falling back to WebGL-compatible optimizer...");
                
                InitializeWebGLOptimizer();
            }
        }

        // Public API methods that delegate to the current optimizer

        public void QueueTask(Action task, TaskPriority priority = TaskPriority.Normal)
        {
            if (_currentOptimizer != null)
            {
                _currentOptimizer.QueueTask(task, priority);
            }
        }

        public async Task QueueTaskAsync(Action task, TaskPriority priority = TaskPriority.Normal)
        {
            if (_currentOptimizer != null)
            {
                await _currentOptimizer.QueueTaskAsync(task, priority);
            }
        }

        public T GetPooledObject<T>() where T : class, new()
        {
            if (_currentOptimizer != null)
            {
                return _currentOptimizer.GetPooledObject<T>();
            }
            return new T();
        }

        public void ReturnPooledObject<T>(T obj) where T : class
        {
            if (_currentOptimizer != null)
            {
                _currentOptimizer.ReturnPooledObject(obj);
            }
        }

        public void OptimizeGameObject(GameObject go)
        {
            if (_currentOptimizer != null)
            {
                _currentOptimizer.OptimizeGameObject(go);
            }
        }

        public void OptimizeScene()
        {
            if (_currentOptimizer != null)
            {
                _currentOptimizer.OptimizeScene();
            }
        }

        public void OptimizeMemory()
        {
            if (_currentOptimizer != null)
            {
                _currentOptimizer.OptimizeMemory();
            }
        }

        public PerformanceMetrics GetPerformanceMetrics()
        {
            if (_currentOptimizer != null)
            {
                return _currentOptimizer.GetPerformanceMetrics();
            }
            
            return new PerformanceMetrics();
        }

        public void SetTargetFrameRate(int targetFPS)
        {
            if (_currentOptimizer != null)
            {
                _currentOptimizer.SetTargetFrameRate(targetFPS);
            }
        }

        public void EnableOptimization(bool enable)
        {
            if (_currentOptimizer != null)
            {
                _currentOptimizer.EnableOptimization(enable);
            }
        }

        public void SetProcessingParameters(int chunkSize, float processingTime)
        {
            if (_currentOptimizer != null)
            {
                _currentOptimizer.SetProcessingParameters(chunkSize, processingTime);
            }
        }

        // Platform-specific methods

        public bool IsWebGL()
        {
            return _platformCapabilities.platform == "WebGL";
        }

        public bool IsDesktop()
        {
            return _platformCapabilities.platform == "Desktop";
        }

        public bool IsMobile()
        {
            return _platformCapabilities.platform == "Mobile";
        }

        public OptimizationLevel GetOptimizationLevel()
        {
            return _platformCapabilities.optimizationLevel;
        }

        public int GetMaxWorkerThreads()
        {
            return _platformCapabilities.maxWorkerThreads;
        }

        public PlatformCapabilities GetPlatformCapabilities()
        {
            return _platformCapabilities;
        }

        // Cleanup
        void OnDestroy()
        {
            if (_webGLOptimizer != null)
            {
                Destroy(_webGLOptimizer);
            }
            
            if (_desktopOptimizer != null)
            {
                Destroy(_desktopOptimizer);
            }
        }
    }

    // Interface for CPU optimizers
    public interface ICPUOptimizer
    {
        void QueueTask(Action task, TaskPriority priority = TaskPriority.Normal);
        Task QueueTaskAsync(Action task, TaskPriority priority = TaskPriority.Normal);
        T GetPooledObject<T>() where T : class, new();
        void ReturnPooledObject<T>(T obj) where T : class;
        void OptimizeGameObject(GameObject go);
        void OptimizeScene();
        void OptimizeMemory();
        PerformanceMetrics GetPerformanceMetrics();
        void SetTargetFrameRate(int targetFPS);
        void EnableOptimization(bool enable);
        void SetProcessingParameters(int chunkSize, float processingTime);
    }

    // Platform capabilities
    [System.Serializable]
    public class PlatformCapabilities
    {
        public string platform;
        public bool supportsThreading;
        public bool supportsSIMD;
        public bool supportsFileIO;
        public bool supportsAsyncAwait;
        public bool supportsCoroutines;
        public OptimizationLevel optimizationLevel;
        public int maxWorkerThreads;
    }

    public enum OptimizationLevel
    {
        Basic,      // WebGL
        Standard,   // Mobile
        Advanced,   // Desktop
        Ultra       // Console/Editor
    }
}
