using System;
using System.Collections.Generic;
using UnityEngine;
using System.Collections;

namespace Evergreen.Data
{
    /// <summary>
    /// Generic cache manager for efficient resource management
    /// </summary>
    public class CacheManager<TKey, TValue> where TValue : class
    {
        private readonly Dictionary<TKey, CacheEntry<TValue>> _cache = new Dictionary<TKey, CacheEntry<TValue>>();
        private readonly int _maxSize;
        private readonly float _defaultTTL;
        private readonly Func<TKey, TValue> _loader;
        private readonly Action<TValue> _disposer;

        public CacheManager(int maxSize = 100, float defaultTTL = 300f, Func<TKey, TValue> loader = null, Action<TValue> disposer = null)
        {
            _maxSize = maxSize;
            _defaultTTL = defaultTTL;
            _loader = loader;
            _disposer = disposer;
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
                
                entry.LastAccessed = Time.time;
                return entry.Value;
            }

            return LoadAndCache(key);
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
            }

            return value;
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