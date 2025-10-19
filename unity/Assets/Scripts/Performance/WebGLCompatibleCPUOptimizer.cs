using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using System.Threading.Tasks;
using Evergreen.Core;

namespace Evergreen.Performance
{
    /// <summary>
    /// WEBGL-COMPATIBLE CPU OPTIMIZER
    /// Provides CPU optimization that works on all platforms including WebGL
    /// Uses coroutines and async/await instead of threading
    /// </summary>
    public class WebGLCompatibleCPUOptimizer : MonoBehaviour
    {
        public static WebGLCompatibleCPUOptimizer Instance { get; private set; }

        [Header("WebGL-Safe Optimization")]
        public bool enableWebGLOptimization = true;
        public bool enableCoroutineOptimization = true;
        public bool enableAsyncOptimization = true;
        public bool enableChunkedProcessing = true;
        public bool enableFrameSpreading = true;
        public int maxChunkSize = 100;
        public float processingTimePerFrame = 0.016f; // 16ms per frame

        [Header("Performance Monitoring")]
        public bool enablePerformanceMonitoring = true;
        public float targetFrameTime = 0.016f; // 60 FPS
        public float maxProcessingTime = 0.01f; // 10ms max processing per frame
        public int performanceCheckInterval = 60; // Check every 60 frames

        [Header("Memory Management")]
        public bool enableMemoryOptimization = true;
        public bool enableGarbageCollectionOptimization = true;
        public bool enableObjectPooling = true;
        public int maxPoolSize = 1000;
        public float gcThreshold = 0.8f; // Trigger GC at 80% memory usage

        // Performance metrics
        private float _currentFrameTime;
        private float _averageFrameTime;
        private int _frameCount;
        private float _totalProcessingTime;
        private float _lastGCTime;
        private float _memoryUsage;
        private float _peakMemoryUsage;

        // Object pools
        private Dictionary<Type, Queue<object>> _objectPools = new Dictionary<Type, Queue<object>>();
        private Dictionary<Type, int> _poolSizes = new Dictionary<Type, int>();

        // Processing queues
        private Queue<Action> _processingQueue = new Queue<Action>();
        private Queue<Action> _highPriorityQueue = new Queue<Action>();
        private Queue<Action> _lowPriorityQueue = new Queue<Action>();

        // Coroutine management
        private Coroutine _optimizationCoroutine;
        private Coroutine _monitoringCoroutine;
        private bool _isProcessing = false;

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
            InitializeOptimizer();
            StartOptimization();
        }

        void Update()
        {
            if (enablePerformanceMonitoring)
            {
                UpdatePerformanceMetrics();
            }
        }

        private void InitializeOptimizer()
        {
            Debug.Log("🚀 Initializing WebGL-Compatible CPU Optimizer...");
            
            // Initialize object pools
            if (enableObjectPooling)
            {
                InitializeObjectPools();
            }
            
            // Start monitoring
            if (enablePerformanceMonitoring)
            {
                _monitoringCoroutine = StartCoroutine(PerformanceMonitoringCoroutine());
            }
            
            Debug.Log("✅ WebGL-Compatible CPU Optimizer initialized!");
        }

        private void InitializeObjectPools()
        {
            // Initialize common object pools
            _objectPools[typeof(Vector3)] = new Queue<object>();
            _objectPools[typeof(Vector2)] = new Queue<object>();
            _objectPools[typeof(Quaternion)] = new Queue<object>();
            _objectPools[typeof(Color)] = new Queue<object>();
            _objectPools[typeof(string)] = new Queue<object>();
            
            _poolSizes[typeof(Vector3)] = maxPoolSize;
            _poolSizes[typeof(Vector2)] = maxPoolSize;
            _poolSizes[typeof(Quaternion)] = maxPoolSize;
            _poolSizes[typeof(Color)] = maxPoolSize;
            _poolSizes[typeof(string)] = maxPoolSize;
        }

        private void StartOptimization()
        {
            if (_optimizationCoroutine != null)
            {
                StopCoroutine(_optimizationCoroutine);
            }
            
            _optimizationCoroutine = StartCoroutine(OptimizationCoroutine());
        }

        private IEnumerator OptimizationCoroutine()
        {
            while (true)
            {
                yield return StartCoroutine(ProcessOptimizationFrame());
                yield return null; // Wait one frame
            }
        }

        private IEnumerator ProcessOptimizationFrame()
        {
            float startTime = Time.realtimeSinceStartup;
            int processedItems = 0;
            
            // Process high priority queue first
            while (_highPriorityQueue.Count > 0 && processedItems < maxChunkSize)
            {
                var action = _highPriorityQueue.Dequeue();
                action?.Invoke();
                processedItems++;
                
                // Check if we've exceeded frame time
                if (Time.realtimeSinceStartup - startTime > processingTimePerFrame)
                {
                    yield return null; // Yield control
                    startTime = Time.realtimeSinceStartup;
                }
            }
            
            // Process regular queue
            while (_processingQueue.Count > 0 && processedItems < maxChunkSize)
            {
                var action = _processingQueue.Dequeue();
                action?.Invoke();
                processedItems++;
                
                // Check if we've exceeded frame time
                if (Time.realtimeSinceStartup - startTime > processingTimePerFrame)
                {
                    yield return null; // Yield control
                    startTime = Time.realtimeSinceStartup;
                }
            }
            
            // Process low priority queue
            while (_lowPriorityQueue.Count > 0 && processedItems < maxChunkSize)
            {
                var action = _lowPriorityQueue.Dequeue();
                action?.Invoke();
                processedItems++;
                
                // Check if we've exceeded frame time
                if (Time.realtimeSinceStartup - startTime > processingTimePerFrame)
                {
                    yield return null; // Yield control
                    startTime = Time.realtimeSinceStartup;
                }
            }
        }

        private IEnumerator PerformanceMonitoringCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(1.0f); // Check every second
                
                if (enablePerformanceMonitoring)
                {
                    CheckPerformance();
                }
            }
        }

        private void UpdatePerformanceMetrics()
        {
            _currentFrameTime = Time.deltaTime;
            _averageFrameTime = (_averageFrameTime * _frameCount + _currentFrameTime) / (_frameCount + 1);
            _frameCount++;
            
            // Update memory usage
            _memoryUsage = GC.GetTotalMemory(false) / (1024f * 1024f); // MB
            if (_memoryUsage > _peakMemoryUsage)
            {
                _peakMemoryUsage = _memoryUsage;
            }
        }

        private void CheckPerformance()
        {
            // Check if we need to trigger garbage collection
            if (enableGarbageCollectionOptimization && _memoryUsage > gcThreshold * 1000f) // Convert to MB
            {
                TriggerGarbageCollection();
            }
            
            // Check if we need to adjust processing parameters
            if (_averageFrameTime > targetFrameTime * 1.5f)
            {
                // Reduce processing load
                maxChunkSize = Mathf.Max(10, maxChunkSize - 10);
                processingTimePerFrame = Mathf.Max(0.005f, processingTimePerFrame - 0.001f);
            }
            else if (_averageFrameTime < targetFrameTime * 0.8f)
            {
                // Increase processing load
                maxChunkSize = Mathf.Min(200, maxChunkSize + 10);
                processingTimePerFrame = Mathf.Min(0.025f, processingTimePerFrame + 0.001f);
            }
        }

        private void TriggerGarbageCollection()
        {
            if (Time.realtimeSinceStartup - _lastGCTime > 1.0f) // Don't GC more than once per second
            {
                GC.Collect();
                _lastGCTime = Time.realtimeSinceStartup;
                Debug.Log($"🗑️ Garbage collection triggered. Memory: {_memoryUsage:F2}MB");
            }
        }

        // Public API methods

        public void QueueTask(Action task, TaskPriority priority = TaskPriority.Normal)
        {
            switch (priority)
            {
                case TaskPriority.High:
                    _highPriorityQueue.Enqueue(task);
                    break;
                case TaskPriority.Normal:
                    _processingQueue.Enqueue(task);
                    break;
                case TaskPriority.Low:
                    _lowPriorityQueue.Enqueue(task);
                    break;
            }
        }

        public async Task QueueTaskAsync(Action task, TaskPriority priority = TaskPriority.Normal)
        {
            var tcs = new TaskCompletionSource<bool>();
            
            QueueTask(() =>
            {
                try
                {
                    task?.Invoke();
                    tcs.SetResult(true);
                }
                catch (Exception e)
                {
                    tcs.SetException(e);
                }
            }, priority);
            
            await tcs.Task;
        }

        public T GetPooledObject<T>() where T : class, new()
        {
            if (!enableObjectPooling)
                return new T();
            
            var type = typeof(T);
            if (_objectPools.ContainsKey(type) && _objectPools[type].Count > 0)
            {
                return _objectPools[type].Dequeue() as T;
            }
            
            return new T();
        }

        public void ReturnPooledObject<T>(T obj) where T : class
        {
            if (!enableObjectPooling || obj == null)
                return;
            
            var type = typeof(T);
            if (_objectPools.ContainsKey(type) && _objectPools[type].Count < _poolSizes[type])
            {
                _objectPools[type].Enqueue(obj);
            }
        }

        public void OptimizeGameObject(GameObject go)
        {
            if (go == null) return;
            
            QueueTask(() =>
            {
                // Optimize components
                var components = go.GetComponents<Component>();
                foreach (var component in components)
                {
                    if (component is MonoBehaviour mb)
                    {
                        OptimizeMonoBehaviour(mb);
                    }
                }
                
                // Optimize children
                foreach (Transform child in go.transform)
                {
                    OptimizeGameObject(child.gameObject);
                }
            }, TaskPriority.Low);
        }

        private void OptimizeMonoBehaviour(MonoBehaviour mb)
        {
            // Disable unnecessary components
            if (mb is AudioSource audioSource && !audioSource.isPlaying)
            {
                audioSource.enabled = false;
            }
            
            if (mb is ParticleSystem particleSystem && !particleSystem.isPlaying)
            {
                particleSystem.enabled = false;
            }
            
            if (mb is Animator animator && !animator.enabled)
            {
                animator.enabled = false;
            }
        }

        public void OptimizeScene()
        {
            QueueTask(() =>
            {
                var allObjects = FindObjectsOfType<GameObject>();
                foreach (var go in allObjects)
                {
                    OptimizeGameObject(go);
                }
            }, TaskPriority.Low);
        }

        public void OptimizeMemory()
        {
            QueueTask(() =>
            {
                // Clear unused object pools
                foreach (var pool in _objectPools.Values)
                {
                    while (pool.Count > maxPoolSize / 2)
                    {
                        pool.Dequeue();
                    }
                }
                
                // Trigger garbage collection
                TriggerGarbageCollection();
            }, TaskPriority.High);
        }

        public PerformanceMetrics GetPerformanceMetrics()
        {
            return new PerformanceMetrics
            {
                currentFrameTime = _currentFrameTime,
                averageFrameTime = _averageFrameTime,
                frameCount = _frameCount,
                memoryUsage = _memoryUsage,
                peakMemoryUsage = _peakMemoryUsage,
                processingQueueSize = _processingQueue.Count,
                highPriorityQueueSize = _highPriorityQueue.Count,
                lowPriorityQueueSize = _lowPriorityQueue.Count
            };
        }

        public void SetTargetFrameRate(int targetFPS)
        {
            Application.targetFrameRate = targetFPS;
            targetFrameTime = 1.0f / targetFPS;
        }

        public void EnableOptimization(bool enable)
        {
            enableWebGLOptimization = enable;
            enableCoroutineOptimization = enable;
            enableAsyncOptimization = enable;
            enableChunkedProcessing = enable;
            enableFrameSpreading = enable;
        }

        public void SetProcessingParameters(int chunkSize, float processingTime)
        {
            maxChunkSize = Mathf.Max(1, chunkSize);
            processingTimePerFrame = Mathf.Max(0.001f, processingTime);
        }

        // Cleanup
        void OnDestroy()
        {
            if (_optimizationCoroutine != null)
            {
                StopCoroutine(_optimizationCoroutine);
            }
            
            if (_monitoringCoroutine != null)
            {
                StopCoroutine(_monitoringCoroutine);
            }
        }
    }

    // Data classes
    public enum TaskPriority
    {
        Low,
        Normal,
        High
    }

    [System.Serializable]
    public class PerformanceMetrics
    {
        public float currentFrameTime;
        public float averageFrameTime;
        public int frameCount;
        public float memoryUsage;
        public float peakMemoryUsage;
        public int processingQueueSize;
        public int highPriorityQueueSize;
        public int lowPriorityQueueSize;
    }
}
