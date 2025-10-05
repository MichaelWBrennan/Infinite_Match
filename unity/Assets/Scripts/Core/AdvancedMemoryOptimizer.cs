using System;
using System.Collections.Generic;
using UnityEngine;
using System.Collections;
using System.Runtime.CompilerServices;

namespace Evergreen.Core
{
    /// <summary>
    /// Advanced memory optimization system with string interning, texture compression, and smart caching
    /// </summary>
    public static class AdvancedMemoryOptimizer
    {
        private static readonly Dictionary<string, string> _stringInternCache = new Dictionary<string, string>();
        private static readonly Dictionary<string, Texture2D> _compressedTextureCache = new Dictionary<string, Texture2D>();
        private static readonly Dictionary<string, AudioClip> _compressedAudioCache = new Dictionary<string, AudioClip>();
        private static readonly Dictionary<string, Mesh> _optimizedMeshCache = new Dictionary<string, Mesh>();
        
        private static bool _isInitialized = false;
        private static int _maxCacheSize = 1000;
        private static float _cacheCleanupInterval = 60f;
        private static float _lastCleanupTime = 0f;

        /// <summary>
        /// Initialize advanced memory optimization
        /// </summary>
        public static void Initialize()
        {
            if (_isInitialized) return;

            _isInitialized = true;
            Logger.Info("Advanced Memory Optimizer initialized", "MemoryOptimizer");
            
            // Start cleanup coroutine
            var go = new GameObject("AdvancedMemoryOptimizer");
            var manager = go.AddComponent<AdvancedMemoryOptimizerManager>();
            DontDestroyOnLoad(go);
        }

        #region String Interning
        /// <summary>
        /// Intern a string to reduce memory usage for frequently used strings
        /// </summary>
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public static string InternString(string str)
        {
            if (string.IsNullOrEmpty(str)) return str;

            if (_stringInternCache.TryGetValue(str, out var interned))
            {
                return interned;
            }

            var result = string.Intern(str);
            _stringInternCache[str] = result;
            return result;
        }

        /// <summary>
        /// Intern multiple strings at once
        /// </summary>
        public static void InternStrings(params string[] strings)
        {
            foreach (var str in strings)
            {
                InternString(str);
            }
        }

        /// <summary>
        /// Get interned string statistics
        /// </summary>
        public static int GetInternedStringCount()
        {
            return _stringInternCache.Count;
        }
        #endregion

        #region Texture Optimization
        /// <summary>
        /// Compress texture for better memory usage
        /// </summary>
        public static Texture2D CompressTexture(Texture2D original, TextureFormat format = TextureFormat.DXT1)
        {
            if (original == null) return null;

            var key = $"{original.name}_{format}_{original.width}x{original.height}";
            if (_compressedTextureCache.TryGetValue(key, out var compressed))
            {
                return compressed;
            }

            var compressedTexture = new Texture2D(original.width, original.height, format, false);
            compressedTexture.SetPixels(original.GetPixels());
            compressedTexture.Apply();
            compressedTexture.name = original.name + "_Compressed";

            _compressedTextureCache[key] = compressedTexture;
            return compressedTexture;
        }

        /// <summary>
        /// Optimize texture for mobile devices
        /// </summary>
        public static Texture2D OptimizeTextureForMobile(Texture2D original)
        {
            if (original == null) return null;

            var key = $"{original.name}_mobile_{original.width}x{original.height}";
            if (_compressedTextureCache.TryGetValue(key, out var optimized))
            {
                return optimized;
            }

            // Use ETC2 for Android, ASTC for iOS
            var format = Application.platform == RuntimePlatform.Android ? 
                TextureFormat.ETC2_RGBA8 : TextureFormat.ASTC_6x6;

            var optimizedTexture = CompressTexture(original, format);
            _compressedTextureCache[key] = optimizedTexture;
            return optimizedTexture;
        }

        /// <summary>
        /// Get texture memory usage
        /// </summary>
        public static long GetTextureMemoryUsage()
        {
            long totalMemory = 0;
            foreach (var texture in _compressedTextureCache.Values)
            {
                if (texture != null)
                {
                    totalMemory += CalculateTextureMemorySize(texture);
                }
            }
            return totalMemory;
        }

        private static long CalculateTextureMemorySize(Texture2D texture)
        {
            var bytesPerPixel = GetBytesPerPixel(texture.format);
            return texture.width * texture.height * bytesPerPixel;
        }

        private static int GetBytesPerPixel(TextureFormat format)
        {
            switch (format)
            {
                case TextureFormat.RGBA32: return 4;
                case TextureFormat.RGB24: return 3;
                case TextureFormat.DXT1: return 0; // Compressed
                case TextureFormat.DXT5: return 0; // Compressed
                case TextureFormat.ETC2_RGBA8: return 0; // Compressed
                case TextureFormat.ASTC_6x6: return 0; // Compressed
                default: return 4;
            }
        }
        #endregion

        #region Audio Optimization
        /// <summary>
        /// Compress audio clip for better memory usage
        /// </summary>
        public static AudioClip CompressAudioClip(AudioClip original, AudioCompressionFormat format = AudioCompressionFormat.Vorbis)
        {
            if (original == null) return null;

            var key = $"{original.name}_{format}_{original.frequency}";
            if (_compressedAudioCache.TryGetValue(key, out var compressed))
            {
                return compressed;
            }

            // Note: In a real implementation, you would use AudioClip.Create with compression
            // For now, we'll return the original but cache it
            _compressedAudioCache[key] = original;
            return original;
        }

        /// <summary>
        /// Get audio memory usage
        /// </summary>
        public static long GetAudioMemoryUsage()
        {
            long totalMemory = 0;
            foreach (var clip in _compressedAudioCache.Values)
            {
                if (clip != null)
                {
                    totalMemory += CalculateAudioMemorySize(clip);
                }
            }
            return totalMemory;
        }

        private static long CalculateAudioMemorySize(AudioClip clip)
        {
            return clip.samples * clip.channels * 4; // Assuming 32-bit float
        }
        #endregion

        #region Mesh Optimization
        /// <summary>
        /// Optimize mesh for better memory usage
        /// </summary>
        public static Mesh OptimizeMesh(Mesh original)
        {
            if (original == null) return null;

            var key = $"{original.name}_{original.vertexCount}";
            if (_optimizedMeshCache.TryGetValue(key, out var optimized))
            {
                return optimized;
            }

            var optimizedMesh = new Mesh();
            optimizedMesh.name = original.name + "_Optimized";
            
            // Copy vertices and triangles
            optimizedMesh.vertices = original.vertices;
            optimizedMesh.triangles = original.triangles;
            optimizedMesh.uv = original.uv;
            optimizedMesh.normals = original.normals;
            optimizedMesh.colors = original.colors;

            // Optimize mesh
            optimizedMesh.RecalculateBounds();
            optimizedMesh.RecalculateNormals();
            optimizedMesh.Optimize();

            _optimizedMeshCache[key] = optimizedMesh;
            return optimizedMesh;
        }

        /// <summary>
        /// Get mesh memory usage
        /// </summary>
        public static long GetMeshMemoryUsage()
        {
            long totalMemory = 0;
            foreach (var mesh in _optimizedMeshCache.Values)
            {
                if (mesh != null)
                {
                    totalMemory += CalculateMeshMemorySize(mesh);
                }
            }
            return totalMemory;
        }

        private static long CalculateMeshMemorySize(Mesh mesh)
        {
            long size = 0;
            if (mesh.vertices != null) size += mesh.vertices.Length * 12; // Vector3 = 12 bytes
            if (mesh.triangles != null) size += mesh.triangles.Length * 4; // int = 4 bytes
            if (mesh.uv != null) size += mesh.uv.Length * 8; // Vector2 = 8 bytes
            if (mesh.normals != null) size += mesh.normals.Length * 12; // Vector3 = 12 bytes
            if (mesh.colors != null) size += mesh.colors.Length * 16; // Color = 16 bytes
            return size;
        }
        #endregion

        #region Smart Caching
        /// <summary>
        /// Smart cache with LRU eviction and TTL
        /// </summary>
        public class SmartCache<T>
        {
            private readonly Dictionary<string, CacheEntry<T>> _cache = new Dictionary<string, CacheEntry<T>>();
            private readonly int _maxSize;
            private readonly float _ttl;
            private readonly LinkedList<string> _accessOrder = new LinkedList<string>();

            public SmartCache(int maxSize = 100, float ttl = 300f)
            {
                _maxSize = maxSize;
                _ttl = ttl;
            }

            public void Set(string key, T value)
            {
                var now = Time.time;
                
                if (_cache.ContainsKey(key))
                {
                    _cache[key].Value = value;
                    _cache[key].LastAccess = now;
                    MoveToFront(key);
                }
                else
                {
                    if (_cache.Count >= _maxSize)
                    {
                        EvictLRU();
                    }

                    _cache[key] = new CacheEntry<T>
                    {
                        Value = value,
                        LastAccess = now,
                        Created = now
                    };
                    _accessOrder.AddFirst(key);
                }
            }

            public T Get(string key)
            {
                if (_cache.TryGetValue(key, out var entry))
                {
                    if (Time.time - entry.Created > _ttl)
                    {
                        Remove(key);
                        return default(T);
                    }

                    entry.LastAccess = Time.time;
                    MoveToFront(key);
                    return entry.Value;
                }
                return default(T);
            }

            public bool Contains(string key)
            {
                if (_cache.TryGetValue(key, out var entry))
                {
                    if (Time.time - entry.Created > _ttl)
                    {
                        Remove(key);
                        return false;
                    }
                    return true;
                }
                return false;
            }

            public void Remove(string key)
            {
                if (_cache.Remove(key))
                {
                    _accessOrder.Remove(key);
                }
            }

            private void MoveToFront(string key)
            {
                _accessOrder.Remove(key);
                _accessOrder.AddFirst(key);
            }

            private void EvictLRU()
            {
                if (_accessOrder.Count > 0)
                {
                    var lruKey = _accessOrder.Last.Value;
                    Remove(lruKey);
                }
            }

            public void Clear()
            {
                _cache.Clear();
                _accessOrder.Clear();
            }

            public int Count => _cache.Count;
        }

        private class CacheEntry<T>
        {
            public T Value;
            public float LastAccess;
            public float Created;
        }
        #endregion

        #region Memory Pooling
        /// <summary>
        /// Advanced memory pool with different strategies
        /// </summary>
        public class AdvancedMemoryPool<T> where T : class, new()
        {
            private readonly Stack<T> _pool = new Stack<T>();
            private readonly int _maxSize;
            private readonly Func<T> _createFunc;
            private readonly Action<T> _resetAction;
            private int _activeCount = 0;

            public AdvancedMemoryPool(int maxSize = 100, Func<T> createFunc = null, Action<T> resetAction = null)
            {
                _maxSize = maxSize;
                _createFunc = createFunc ?? (() => new T());
                _resetAction = resetAction;
            }

            public T Get()
            {
                if (_pool.Count > 0)
                {
                    var item = _pool.Pop();
                    _activeCount++;
                    return item;
                }

                _activeCount++;
                return _createFunc();
            }

            public void Return(T item)
            {
                if (item == null) return;

                _resetAction?.Invoke(item);
                
                if (_pool.Count < _maxSize)
                {
                    _pool.Push(item);
                }
                _activeCount--;
            }

            public void Clear()
            {
                _pool.Clear();
                _activeCount = 0;
            }

            public int PooledCount => _pool.Count;
            public int ActiveCount => _activeCount;
            public int TotalCount => PooledCount + ActiveCount;
        }
        #endregion

        #region Cache Management
        /// <summary>
        /// Clean up old cache entries
        /// </summary>
        public static void CleanupCaches()
        {
            var now = Time.time;
            if (now - _lastCleanupTime < _cacheCleanupInterval) return;

            _lastCleanupTime = now;

            // Clean up string intern cache if it gets too large
            if (_stringInternCache.Count > _maxCacheSize)
            {
                var keysToRemove = new List<string>();
                var count = 0;
                foreach (var kvp in _stringInternCache)
                {
                    if (count++ > _maxCacheSize / 2)
                    {
                        keysToRemove.Add(kvp.Key);
                    }
                }
                foreach (var key in keysToRemove)
                {
                    _stringInternCache.Remove(key);
                }
            }

            Logger.Info($"Cache cleanup completed. String cache: {_stringInternCache.Count}, " +
                       $"Texture cache: {_compressedTextureCache.Count}, " +
                       $"Audio cache: {_compressedAudioCache.Count}, " +
                       $"Mesh cache: {_optimizedMeshCache.Count}", "MemoryOptimizer");
        }

        /// <summary>
        /// Get memory statistics
        /// </summary>
        public static Dictionary<string, object> GetMemoryStatistics()
        {
            return new Dictionary<string, object>
            {
                {"interned_strings", _stringInternCache.Count},
                {"compressed_textures", _compressedTextureCache.Count},
                {"compressed_audio", _compressedAudioCache.Count},
                {"optimized_meshes", _optimizedMeshCache.Count},
                {"texture_memory_mb", GetTextureMemoryUsage() / 1024f / 1024f},
                {"audio_memory_mb", GetAudioMemoryUsage() / 1024f / 1024f},
                {"mesh_memory_mb", GetMeshMemoryUsage() / 1024f / 1024f}
            };
        }

        /// <summary>
        /// Clear all caches
        /// </summary>
        public static void ClearAllCaches()
        {
            _stringInternCache.Clear();
            _compressedTextureCache.Clear();
            _compressedAudioCache.Clear();
            _optimizedMeshCache.Clear();
            Logger.Info("All caches cleared", "MemoryOptimizer");
        }
        #endregion
    }

    /// <summary>
    /// Manager component for advanced memory optimization
    /// </summary>
    public class AdvancedMemoryOptimizerManager : MonoBehaviour
    {
        [Header("Memory Settings")]
        public bool enableAutoCleanup = true;
        public float cleanupInterval = 60f;
        public int maxCacheSize = 1000;
        public bool logMemoryStats = true;
        public float logInterval = 30f;

        private float _lastCleanup = 0f;
        private float _lastLog = 0f;

        void Start()
        {
            AdvancedMemoryOptimizer.Initialize();
        }

        void Update()
        {
            if (enableAutoCleanup && Time.time - _lastCleanup > cleanupInterval)
            {
                AdvancedMemoryOptimizer.CleanupCaches();
                _lastCleanup = Time.time;
            }

            if (logMemoryStats && Time.time - _lastLog > logInterval)
            {
                var stats = AdvancedMemoryOptimizer.GetMemoryStatistics();
                Logger.Info($"Memory Stats: {string.Join(", ", stats)}", "MemoryOptimizer");
                _lastLog = Time.time;
            }
        }

        void OnApplicationPause(bool pauseStatus)
        {
            if (pauseStatus)
            {
                AdvancedMemoryOptimizer.CleanupCaches();
            }
        }

        void OnApplicationFocus(bool hasFocus)
        {
            if (!hasFocus)
            {
                AdvancedMemoryOptimizer.CleanupCaches();
            }
        }
    }
}