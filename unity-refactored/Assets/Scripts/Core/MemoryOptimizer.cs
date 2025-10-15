using System;
using System.Collections.Generic;
using UnityEngine;
using System.Collections;

namespace Evergreen.Core
{
    /// <summary>
    /// Memory optimization utilities and monitoring
    /// </summary>
    public static class MemoryOptimizer
    {
        private static readonly Dictionary<string, int> _allocationCounts = new Dictionary<string, int>();
        private static readonly Dictionary<string, long> _allocationSizes = new Dictionary<string, long>();
        private static bool _isMonitoring = false;

        /// <summary>
        /// Start monitoring memory allocations
        /// </summary>
        public static void StartMonitoring()
        {
            _isMonitoring = true;
            Logger.Info("Memory monitoring started", "MemoryOptimizer");
        }

        /// <summary>
        /// Stop monitoring memory allocations
        /// </summary>
        public static void StopMonitoring()
        {
            _isMonitoring = false;
            Logger.Info("Memory monitoring stopped", "MemoryOptimizer");
        }

        /// <summary>
        /// Track an allocation
        /// </summary>
        public static void TrackAllocation(string category, int count = 1, long size = 0)
        {
            if (!_isMonitoring) return;

            if (!_allocationCounts.ContainsKey(category))
            {
                _allocationCounts[category] = 0;
                _allocationSizes[category] = 0;
            }

            _allocationCounts[category] += count;
            _allocationSizes[category] += size;
        }

        /// <summary>
        /// Get memory allocation statistics
        /// </summary>
        public static Dictionary<string, object> GetAllocationStats()
        {
            var stats = new Dictionary<string, object>
            {
                {"total_allocations", _allocationCounts.Count},
                {"monitoring_enabled", _isMonitoring}
            };

            foreach (var kvp in _allocationCounts)
            {
                stats[$"{kvp.Key}_count"] = kvp.Value;
                stats[$"{kvp.Key}_size"] = _allocationSizes[kvp.Key];
            }

            return stats;
        }

        /// <summary>
        /// Clear allocation statistics
        /// </summary>
        public static void ClearStats()
        {
            _allocationCounts.Clear();
            _allocationSizes.Clear();
            Logger.Info("Memory allocation statistics cleared", "MemoryOptimizer");
        }

        /// <summary>
        /// Force garbage collection
        /// </summary>
        public static void ForceGC()
        {
            var beforeMemory = GC.GetTotalMemory(false);
            GC.Collect();
            GC.WaitForPendingFinalizers();
            GC.Collect();
            var afterMemory = GC.GetTotalMemory(false);
            
            var freed = beforeMemory - afterMemory;
            Logger.Info($"Forced GC: Freed {freed / 1024f / 1024f:F2} MB", "MemoryOptimizer");
        }

        /// <summary>
        /// Get current memory usage
        /// </summary>
        public static MemoryInfo GetMemoryInfo()
        {
            return new MemoryInfo
            {
                TotalMemory = GC.GetTotalMemory(false),
                AllocatedMemory = GC.GetTotalMemory(true),
                Gen0Collections = GC.CollectionCount(0),
                Gen1Collections = GC.CollectionCount(1),
                Gen2Collections = GC.CollectionCount(2)
            };
        }

        /// <summary>
        /// Log memory usage
        /// </summary>
        public static void LogMemoryUsage(string category = "Memory")
        {
            var info = GetMemoryInfo();
            Logger.Info($"Memory Usage - Total: {info.TotalMemory / 1024f / 1024f:F2} MB, " +
                       $"Allocated: {info.AllocatedMemory / 1024f / 1024f:F2} MB, " +
                       $"GC: {info.Gen0Collections}/{info.Gen1Collections}/{info.Gen2Collections}", category);
        }
    }

    /// <summary>
    /// Memory information structure
    /// </summary>
    public struct MemoryInfo
    {
        public long TotalMemory;
        public long AllocatedMemory;
        public int Gen0Collections;
        public int Gen1Collections;
        public int Gen2Collections;
    }

    /// <summary>
    /// Memory optimization manager component
    /// </summary>
    public class MemoryOptimizerManager : MonoBehaviour
    {
        [Header("Memory Settings")]
        public bool enableMonitoring = true;
        public bool enableAutoGC = true;
        public float gcInterval = 30f;
        public float memoryThreshold = 100f; // MB
        public bool logMemoryUsage = true;
        public float logInterval = 10f;

        private Coroutine _gcCoroutine;
        private Coroutine _logCoroutine;
        private float _lastGC = 0f;
        private float _lastLog = 0f;

        void Start()
        {
            if (enableMonitoring)
            {
                MemoryOptimizer.StartMonitoring();
            }

            if (enableAutoGC)
            {
                _gcCoroutine = StartCoroutine(AutoGCCoroutine());
            }

            if (logMemoryUsage)
            {
                _logCoroutine = StartCoroutine(LogMemoryCoroutine());
            }
        }

        void Update()
        {
            if (enableAutoGC)
            {
                CheckMemoryThreshold();
            }
        }

        private void CheckMemoryThreshold()
        {
            var memoryInfo = MemoryOptimizer.GetMemoryInfo();
            var memoryMB = memoryInfo.TotalMemory / 1024f / 1024f;

            if (memoryMB > memoryThreshold && Time.time - _lastGC > gcInterval)
            {
                MemoryOptimizer.ForceGC();
                _lastGC = Time.time;
            }
        }

        private IEnumerator AutoGCCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(gcInterval);
                
                if (Time.time - _lastGC > gcInterval)
                {
                    MemoryOptimizer.ForceGC();
                    _lastGC = Time.time;
                }
            }
        }

        private IEnumerator LogMemoryCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(logInterval);
                
                if (Time.time - _lastLog > logInterval)
                {
                    MemoryOptimizer.LogMemoryUsage("MemoryOptimizer");
                    _lastLog = Time.time;
                }
            }
        }

        void OnDestroy()
        {
            if (_gcCoroutine != null)
            {
                StopCoroutine(_gcCoroutine);
            }

            if (_logCoroutine != null)
            {
                StopCoroutine(_logCoroutine);
            }

            if (enableMonitoring)
            {
                MemoryOptimizer.StopMonitoring();
            }
        }

        void OnApplicationPause(bool pauseStatus)
        {
            if (pauseStatus)
            {
                MemoryOptimizer.ForceGC();
            }
        }

        void OnApplicationFocus(bool hasFocus)
        {
            if (!hasFocus)
            {
                MemoryOptimizer.ForceGC();
            }
        }
    }

    /// <summary>
    /// Memory-efficient string builder for frequent string operations
    /// </summary>
    public class StringBuilderPool
    {
        private static readonly ObjectPool<System.Text.StringBuilder> _pool = 
            new ObjectPool<System.Text.StringBuilder>(
                createFunc: () => new System.Text.StringBuilder(),
                onGet: sb => sb.Clear(),
                onReturn: sb => sb.Clear(),
                maxSize: 20
            );

        public static System.Text.StringBuilder Get()
        {
            return _pool.Get();
        }

        public static void Return(System.Text.StringBuilder sb)
        {
            _pool.Return(sb);
        }

        public static string GetString(System.Text.StringBuilder sb)
        {
            var result = sb.ToString();
            Return(sb);
            return result;
        }
    }

    /// <summary>
    /// Memory-efficient list pool for temporary collections
    /// </summary>
    public class ListPool<T>
    {
        private static readonly ObjectPool<List<T>> _pool = 
            new ObjectPool<List<T>>(
                createFunc: () => new List<T>(),
                onGet: list => list.Clear(),
                onReturn: list => list.Clear(),
                maxSize: 50
            );

        public static List<T> Get()
        {
            return _pool.Get();
        }

        public static void Return(List<T> list)
        {
            _pool.Return(list);
        }
    }

    /// <summary>
    /// Memory-efficient dictionary pool for temporary collections
    /// </summary>
    public class DictionaryPool<TKey, TValue>
    {
        private static readonly ObjectPool<Dictionary<TKey, TValue>> _pool = 
            new ObjectPool<Dictionary<TKey, TValue>>(
                createFunc: () => new Dictionary<TKey, TValue>(),
                onGet: dict => dict.Clear(),
                onReturn: dict => dict.Clear(),
                maxSize: 30
            );

        public static Dictionary<TKey, TValue> Get()
        {
            return _pool.Get();
        }

        public static void Return(Dictionary<TKey, TValue> dict)
        {
            _pool.Return(dict);
        }
    }
}