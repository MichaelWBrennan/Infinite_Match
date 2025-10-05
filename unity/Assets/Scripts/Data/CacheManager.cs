using System;
using System.Collections.Generic;
using UnityEngine;
using System.Collections;

namespace Evergreen.Data
{
    /// <summary>
    /// Generic cache manager for efficient resource management with intelligent eviction policies
    /// </summary>
    public class CacheManager<TKey, TValue> where TValue : class
    {
        private readonly Dictionary<TKey, CacheEntry<TValue>> _cache = new Dictionary<TKey, CacheEntry<TValue>>();
        private readonly int _maxSize;
        private readonly float _defaultTTL;
        private readonly Func<TKey, TValue> _loader;
        private readonly Action<TValue> _disposer;
        
        // Eviction policies
        private readonly EvictionPolicy _evictionPolicy;
        private readonly LinkedList<TKey> _accessOrder = new LinkedList<TKey>();
        private readonly Dictionary<TKey, LinkedListNode<TKey>> _accessNodes = new Dictionary<TKey, LinkedListNode<TKey>>();
        private readonly Dictionary<TKey, int> _accessCounts = new Dictionary<TKey, int>();
        private readonly Dictionary<TKey, float> _accessWeights = new Dictionary<TKey, float>();
        
        // Cache warming
        private readonly Queue<TKey> _warmingQueue = new Queue<TKey>();
        private readonly HashSet<TKey> _warmingInProgress = new HashSet<TKey>();
        private readonly Dictionary<TKey, float> _warmingPriorities = new Dictionary<TKey, float>();
        private bool _isWarming = false;
        private float _lastWarmingTime = 0f;
        private float _warmingInterval = 1f;

        public CacheManager(int maxSize = 100, float defaultTTL = 300f, EvictionPolicy evictionPolicy = EvictionPolicy.LRU, 
                          Func<TKey, TValue> loader = null, Action<TValue> disposer = null)
        {
            _maxSize = maxSize;
            _defaultTTL = defaultTTL;
            _evictionPolicy = evictionPolicy;
            _loader = loader;
            _disposer = disposer;
        }
        
        public enum EvictionPolicy
        {
            TTL,        // Time-based eviction only
            LRU,        // Least Recently Used
            LFU,        // Least Frequently Used
            LRU_LFU,    // Hybrid LRU-LFU
            Weighted    // Weighted by access frequency and recency
        }

        public TValue Get(TKey key)
        {
            if (_cache.TryGetValue(key, out var entry))
            {
                if (entry.IsExpired)
                {
                    Remove(key);
                    return LoadAndCache(key);
                }
                
                // Update access tracking for eviction policies
                UpdateAccessTracking(key);
                entry.LastAccessed = Time.time;
                return entry.Value;
            }

            return LoadAndCache(key);
        }
        
        /// <summary>
        /// Update access tracking for eviction policies
        /// </summary>
        private void UpdateAccessTracking(TKey key)
        {
            // Update access count
            _accessCounts[key] = _accessCounts.GetValueOrDefault(key, 0) + 1;
            
            // Update access order for LRU
            if (_evictionPolicy == EvictionPolicy.LRU || _evictionPolicy == EvictionPolicy.LRU_LFU || _evictionPolicy == EvictionPolicy.Weighted)
            {
                if (_accessNodes.TryGetValue(key, out var node))
                {
                    _accessOrder.Remove(node);
                }
                else
                {
                    node = new LinkedListNode<TKey>(key);
                    _accessNodes[key] = node;
                }
                _accessOrder.AddLast(node);
            }
            
            // Update access weight for weighted policy
            if (_evictionPolicy == EvictionPolicy.Weighted)
            {
                float recencyWeight = 1.0f / (Time.time - _cache[key].LastAccessed + 1.0f);
                float frequencyWeight = Mathf.Log(_accessCounts[key] + 1.0f);
                _accessWeights[key] = recencyWeight * frequencyWeight;
            }
        }

        public TValue Get(TKey key, float ttl)
        {
            if (_cache.TryGetValue(key, out var entry))
            {
                if (entry.IsExpired)
                {
                    Remove(key);
                    return LoadAndCache(key, ttl);
                }
                
                entry.LastAccessed = Time.time;
                return entry.Value;
            }

            return LoadAndCache(key, ttl);
        }

        public void Set(TKey key, TValue value, float? ttl = null)
        {
            if (_cache.Count >= _maxSize)
            {
                EvictLeastRecentlyUsed();
            }

            var entry = new CacheEntry<TValue>
            {
                Value = value,
                CreatedAt = Time.time,
                LastAccessed = Time.time,
                TTL = ttl ?? _defaultTTL
            };

            _cache[key] = entry;
        }

        public bool Contains(TKey key)
        {
            return _cache.ContainsKey(key) && !_cache[key].IsExpired;
        }

        public void Remove(TKey key)
        {
            if (_cache.TryGetValue(key, out var entry))
            {
                _disposer?.Invoke(entry.Value);
                _cache.Remove(key);
            }
        }

        public void Clear()
        {
            foreach (var entry in _cache.Values)
            {
                _disposer?.Invoke(entry.Value);
            }
            _cache.Clear();
        }

        private TValue LoadAndCache(TKey key, float? ttl = null)
        {
            if (_loader == null)
            {
                Debug.LogWarning($"No loader function provided for key: {key}");
                return null;
            }

            var value = _loader(key);
            if (value != null)
            {
                Set(key, value, ttl);
                UpdateAccessTracking(key);
            }

            return value;
        }
        
        /// <summary>
        /// Evict entry based on selected eviction policy
        /// </summary>
        private void EvictEntry()
        {
            TKey keyToEvict = GetKeyToEvict();
            if (keyToEvict != null)
            {
                Remove(keyToEvict);
            }
        }
        
        /// <summary>
        /// Get key to evict based on eviction policy
        /// </summary>
        private TKey GetKeyToEvict()
        {
            switch (_evictionPolicy)
            {
                case EvictionPolicy.TTL:
                    return GetOldestExpiredKey();
                    
                case EvictionPolicy.LRU:
                    return GetLRUKey();
                    
                case EvictionPolicy.LFU:
                    return GetLFUKey();
                    
                case EvictionPolicy.LRU_LFU:
                    return GetLRULFUKey();
                    
                case EvictionPolicy.Weighted:
                    return GetWeightedKey();
                    
                default:
                    return GetLRUKey();
            }
        }
        
        /// <summary>
        /// Get oldest expired key (TTL policy)
        /// </summary>
        private TKey GetOldestExpiredKey()
        {
            TKey oldestKey = default(TKey);
            float oldestTime = float.MaxValue;
            
            foreach (var kvp in _cache)
            {
                if (kvp.Value.CreatedAt < oldestTime)
                {
                    oldestTime = kvp.Value.CreatedAt;
                    oldestKey = kvp.Key;
                }
            }
            
            return oldestKey;
        }
        
        /// <summary>
        /// Get least recently used key (LRU policy)
        /// </summary>
        private TKey GetLRUKey()
        {
            if (_accessOrder.Count == 0) return default(TKey);
            return _accessOrder.First.Value;
        }
        
        /// <summary>
        /// Get least frequently used key (LFU policy)
        /// </summary>
        private TKey GetLFUKey()
        {
            TKey lfuKey = default(TKey);
            int minCount = int.MaxValue;
            
            foreach (var kvp in _accessCounts)
            {
                if (kvp.Value < minCount)
                {
                    minCount = kvp.Value;
                    lfuKey = kvp.Key;
                }
            }
            
            return lfuKey;
        }
        
        /// <summary>
        /// Get key using hybrid LRU-LFU policy
        /// </summary>
        private TKey GetLRULFUKey()
        {
            // Combine LRU and LFU scores
            TKey bestKey = default(TKey);
            float bestScore = float.MaxValue;
            
            foreach (var kvp in _cache)
            {
                var key = kvp.Key;
                var entry = kvp.Value;
                
                // LRU score (higher is more recent)
                float lruScore = Time.time - entry.LastAccessed;
                
                // LFU score (higher is more frequent)
                float lfuScore = _accessCounts.GetValueOrDefault(key, 0);
                
                // Combined score (lower is better for eviction)
                float combinedScore = lruScore / (lfuScore + 1.0f);
                
                if (combinedScore < bestScore)
                {
                    bestScore = combinedScore;
                    bestKey = key;
                }
            }
            
            return bestKey;
        }
        
        /// <summary>
        /// Get key using weighted policy
        /// </summary>
        private TKey GetWeightedKey()
        {
            TKey worstKey = default(TKey);
            float worstWeight = float.MaxValue;
            
            foreach (var kvp in _accessWeights)
            {
                if (kvp.Value < worstWeight)
                {
                    worstWeight = kvp.Value;
                    worstKey = kvp.Key;
                }
            }
            
            return worstKey;
        }

        private void EvictLeastRecentlyUsed()
        {
            TKey lruKey = default;
            float oldestTime = float.MaxValue;

            foreach (var kvp in _cache)
            {
                if (kvp.Value.LastAccessed < oldestTime)
                {
                    oldestTime = kvp.Value.LastAccessed;
                    lruKey = kvp.Key;
                }
            }

            if (!EqualityComparer<TKey>.Default.Equals(lruKey, default))
            {
                Remove(lruKey);
            }
        }

        public int Count => _cache.Count;
        public int MaxSize => _maxSize;
        
        #region Cache Warming
        /// <summary>
        /// Add key to warming queue
        /// </summary>
        public void AddToWarmingQueue(TKey key, float priority = 1.0f)
        {
            if (!_warmingInProgress.Contains(key) && !_cache.ContainsKey(key))
            {
                _warmingQueue.Enqueue(key);
                _warmingPriorities[key] = priority;
            }
        }
        
        /// <summary>
        /// Process warming queue
        /// </summary>
        public void ProcessWarmingQueue()
        {
            if (Time.time - _lastWarmingTime < _warmingInterval) return;
            
            _lastWarmingTime = Time.time;
            
            // Process up to 3 items per warming cycle
            int processed = 0;
            while (_warmingQueue.Count > 0 && processed < 3)
            {
                var key = _warmingQueue.Dequeue();
                if (!_warmingInProgress.Contains(key))
                {
                    StartWarming(key);
                    processed++;
                }
            }
        }
        
        /// <summary>
        /// Start warming a specific key
        /// </summary>
        private void StartWarming(TKey key)
        {
            if (_warmingInProgress.Contains(key) || _cache.ContainsKey(key)) return;
            
            _warmingInProgress.Add(key);
            
            // Start coroutine for warming
            if (MonoBehaviour.FindObjectOfType<MonoBehaviour>() != null)
            {
                MonoBehaviour.FindObjectOfType<MonoBehaviour>().StartCoroutine(WarmKeyCoroutine(key));
            }
        }
        
        /// <summary>
        /// Coroutine for warming a key
        /// </summary>
        private System.Collections.IEnumerator WarmKeyCoroutine(TKey key)
        {
            yield return null; // Wait one frame
            
            try
            {
                var value = _loader?.Invoke(key);
                if (value != null)
                {
                    Set(key, value);
                    UpdateAccessTracking(key);
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to warm key {key}: {e.Message}");
            }
            finally
            {
                _warmingInProgress.Remove(key);
            }
        }
        
        /// <summary>
        /// Get warming statistics
        /// </summary>
        public Dictionary<string, object> GetWarmingStatistics()
        {
            return new Dictionary<string, object>
            {
                {"queue_size", _warmingQueue.Count},
                {"warming_in_progress", _warmingInProgress.Count},
                {"is_warming", _isWarming},
                {"last_warming_time", _lastWarmingTime}
            };
        }
        
        /// <summary>
        /// Clear warming queue
        /// </summary>
        public void ClearWarmingQueue()
        {
            _warmingQueue.Clear();
            _warmingInProgress.Clear();
            _warmingPriorities.Clear();
        }
        #endregion
        
        #region Statistics
        /// <summary>
        /// Get cache statistics
        /// </summary>
        public Dictionary<string, object> GetStatistics()
        {
            var stats = new Dictionary<string, object>
            {
                {"cache_size", _cache.Count},
                {"max_size", _maxSize},
                {"eviction_policy", _evictionPolicy.ToString()},
                {"hit_rate", CalculateHitRate()},
                {"memory_usage", CalculateMemoryUsage()}
            };
            
            // Add warming statistics
            foreach (var kvp in GetWarmingStatistics())
            {
                stats[$"warming_{kvp.Key}"] = kvp.Value;
            }
            
            return stats;
        }
        
        /// <summary>
        /// Calculate cache hit rate
        /// </summary>
        private float CalculateHitRate()
        {
            int totalAccesses = 0;
            int hits = 0;
            
            foreach (var kvp in _accessCounts)
            {
                totalAccesses += kvp.Value;
                if (_cache.ContainsKey(kvp.Key))
                {
                    hits += kvp.Value;
                }
            }
            
            return totalAccesses > 0 ? (float)hits / totalAccesses : 0f;
        }
        
        /// <summary>
        /// Calculate memory usage (simplified)
        /// </summary>
        private long CalculateMemoryUsage()
        {
            // This is a simplified calculation
            // In a real implementation, you would calculate actual memory usage
            return _cache.Count * 100; // Assume 100 bytes per entry
        }
        #endregion
    }

    /// <summary>
    /// Cache entry with TTL support
    /// </summary>
    public class CacheEntry<T>
    {
        public T Value { get; set; }
        public float CreatedAt { get; set; }
        public float LastAccessed { get; set; }
        public float TTL { get; set; }
        public bool IsExpired => Time.time - CreatedAt > TTL;
    }

    /// <summary>
    /// Level data cache manager
    /// </summary>
    public class LevelCacheManager : MonoBehaviour
    {
        private static LevelCacheManager _instance;
        public static LevelCacheManager Instance
        {
            get
            {
                if (_instance == null)
                {
                    var go = new GameObject("LevelCacheManager");
                    _instance = go.AddComponent<LevelCacheManager>();
                    DontDestroyOnLoad(go);
                }
                return _instance;
            }
        }

        private CacheManager<int, Dictionary<string, object>> _levelCache;
        private CacheManager<string, TextAsset> _assetCache;

        void Awake()
        {
            if (_instance == null)
            {
                _instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeCaches();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        private void InitializeCaches()
        {
            _levelCache = new CacheManager<int, Dictionary<string, object>>(
                maxSize: 50,
                defaultTTL: 600f, // 10 minutes
                loader: LoadLevelData,
                disposer: null
            );

            _assetCache = new CacheManager<string, TextAsset>(
                maxSize: 100,
                defaultTTL: 300f, // 5 minutes
                loader: LoadAsset,
                disposer: null
            );
        }

        public Dictionary<string, object> GetLevelData(int levelId)
        {
            return _levelCache.Get(levelId);
        }

        public TextAsset GetAsset(string assetPath)
        {
            return _assetCache.Get(assetPath);
        }

        private Dictionary<string, object> LoadLevelData(int levelId)
        {
            var path = System.IO.Path.Combine(Application.streamingAssetsPath, "levels", $"level_{levelId}.json");
            var asset = Resources.Load<TextAsset>($"levels/level_{levelId}");
            
            if (asset != null)
            {
                return JsonUtility.FromJsonToDictionary(asset.text);
            }
            else if (System.IO.File.Exists(path))
            {
                var json = System.IO.File.ReadAllText(path);
                return JsonUtility.FromJsonToDictionary(json);
            }

            Debug.LogWarning($"Level data not found for level {levelId}");
            return new Dictionary<string, object>();
        }

        private TextAsset LoadAsset(string assetPath)
        {
            return Resources.Load<TextAsset>(assetPath);
        }

        public void PreloadLevel(int levelId)
        {
            _levelCache.Get(levelId);
        }

        public void PreloadLevels(int startLevel, int endLevel)
        {
            for (int i = startLevel; i <= endLevel; i++)
            {
                PreloadLevel(i);
            }
        }

        public void ClearLevelCache()
        {
            _levelCache.Clear();
        }

        public void ClearAssetCache()
        {
            _assetCache.Clear();
        }

        public void ClearAllCaches()
        {
            ClearLevelCache();
            ClearAssetCache();
        }

        public Dictionary<string, object> GetCacheStats()
        {
            return new Dictionary<string, object>
            {
                {"level_cache_count", _levelCache.Count},
                {"level_cache_max_size", _levelCache.MaxSize},
                {"asset_cache_count", _assetCache.Count},
                {"asset_cache_max_size", _assetCache.MaxSize}
            };
        }
    }
}