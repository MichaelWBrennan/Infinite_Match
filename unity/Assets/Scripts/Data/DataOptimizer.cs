using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using UnityEngine;
using System.Collections;
using Evergreen.Core;

namespace Evergreen.Data
{
    /// <summary>
    /// Advanced data optimization system with fast serialization, compression, and async loading
    /// </summary>
    public class DataOptimizer : MonoBehaviour
    {
        public static DataOptimizer Instance { get; private set; }

        [Header("Serialization Settings")]
        public bool enableFastSerialization = true;
        public bool enableCompression = true;
        public CompressionType compressionType = CompressionType.Gzip;
        public bool enableBinarySerialization = true;
        public bool enableJsonSerialization = true;
        
        [Header("Compression Settings")]
        public int compressionLevel = 6;
        public bool enableAdaptiveCompression = true;
        public float compressionThreshold = 1024f; // Compress files larger than 1KB
        public bool enableLZ4Compression = true;
        public bool enableBrotliCompression = false;

        [Header("Caching Settings")]
        public bool enableDataCaching = true;
        public int maxCacheSize = 1000;
        public float cacheExpirationTime = 300f; // 5 minutes
        public bool enablePreloading = true;
        public string[] preloadDataPaths = new string[0];

        [Header("Async Loading")]
        public bool enableAsyncLoading = true;
        public int maxConcurrentLoads = 5;
        public float loadingTimeout = 30f;
        public bool enableProgressTracking = true;

        [Header("Memory Management")]
        public bool enableMemoryOptimization = true;
        public int maxMemoryUsageMB = 256;
        public bool enableGarbageCollection = true;
        public float gcInterval = 60f;

        private readonly Dictionary<string, object> _dataCache = new Dictionary<string, object>();
        private readonly Dictionary<string, float> _cacheTimestamps = new Dictionary<string, float>();
        private readonly Dictionary<string, Task<object>> _loadingTasks = new Dictionary<string, Task<object>>();
        private readonly Queue<string> _loadingQueue = new Queue<string>();
        private readonly List<string> _loadingInProgress = new List<string>();

        private float _lastGCTime = 0f;
        private long _currentMemoryUsage = 0;
        private bool _isInitialized = false;

        public enum CompressionType
        {
            None,
            Gzip,
            LZ4,
            Brotli
        }

        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeDataOptimizer();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        void Start()
        {
            if (enablePreloading)
            {
                StartCoroutine(PreloadData());
            }
        }

        void Update()
        {
            if (enableDataCaching)
            {
                CleanupExpiredCache();
            }

            if (enableGarbageCollection && Time.time - _lastGCTime > gcInterval)
            {
                ForceGarbageCollection();
                _lastGCTime = Time.time;
            }
        }

        private void InitializeDataOptimizer()
        {
            _isInitialized = true;
            Logger.Info("Data Optimizer initialized", "DataOptimizer");
        }

        #region Fast Serialization
        /// <summary>
        /// Serialize object with optimization
        /// </summary>
        public byte[] SerializeObject<T>(T obj)
        {
            if (obj == null) 
            {
                Debug.LogWarning("DataOptimizer: Attempting to serialize null object");
                return new byte[0];
            }

            try
            {
                if (enableBinarySerialization)
                {
                    return SerializeBinary(obj);
                }
                else if (enableJsonSerialization)
                {
                    return SerializeJson(obj);
                }
                else
                {
                    return SerializeDefault(obj);
                }
            }
            catch (Exception e)
            {
                Logger.Error($"Serialization failed: {e.Message}", "DataOptimizer");
                return null;
            }
        }

        private byte[] SerializeBinary<T>(T obj)
        {
            // In a real implementation, you would use a fast binary serializer like MessagePack
            // For now, we'll use Unity's JsonUtility as a fallback
            var json = JsonUtility.ToJson(obj);
            var bytes = System.Text.Encoding.UTF8.GetBytes(json);
            
            if (enableCompression)
            {
                return CompressData(bytes);
            }
            
            return bytes;
        }

        private byte[] SerializeJson<T>(T obj)
        {
            var json = JsonUtility.ToJson(obj);
            var bytes = System.Text.Encoding.UTF8.GetBytes(json);
            
            if (enableCompression)
            {
                return CompressData(bytes);
            }
            
            return bytes;
        }

        private byte[] SerializeDefault<T>(T obj)
        {
            var json = JsonUtility.ToJson(obj);
            return System.Text.Encoding.UTF8.GetBytes(json);
        }

        /// <summary>
        /// Deserialize object with optimization
        /// </summary>
        public T DeserializeObject<T>(byte[] data)
        {
            if (data == null || data.Length == 0) return default(T);

            try
            {
                byte[] decompressedData = data;
                
                if (enableCompression)
                {
                    decompressedData = DecompressData(data);
                    if (decompressedData == null) return default(T);
                }

                if (enableBinarySerialization)
                {
                    return DeserializeBinary<T>(decompressedData);
                }
                else if (enableJsonSerialization)
                {
                    return DeserializeJson<T>(decompressedData);
                }
                else
                {
                    return DeserializeDefault<T>(decompressedData);
                }
            }
            catch (Exception e)
            {
                Logger.Error($"Deserialization failed: {e.Message}", "DataOptimizer");
                return default(T);
            }
        }

        private T DeserializeBinary<T>(byte[] data)
        {
            var json = System.Text.Encoding.UTF8.GetString(data);
            return JsonUtility.FromJson<T>(json);
        }

        private T DeserializeJson<T>(byte[] data)
        {
            var json = System.Text.Encoding.UTF8.GetString(data);
            return JsonUtility.FromJson<T>(json);
        }

        private T DeserializeDefault<T>(byte[] data)
        {
            var json = System.Text.Encoding.UTF8.GetString(data);
            return JsonUtility.FromJson<T>(json);
        }
        #endregion

        #region Compression
        private byte[] CompressData(byte[] data)
        {
            if (data == null || data.Length == 0) return data;

            switch (compressionType)
            {
                case CompressionType.Gzip:
                    return CompressGzip(data);
                case CompressionType.LZ4:
                    return CompressLZ4(data);
                case CompressionType.Brotli:
                    return CompressBrotli(data);
                default:
                    return data;
            }
        }

        private byte[] DecompressData(byte[] data)
        {
            if (data == null || data.Length == 0) return data;

            switch (compressionType)
            {
                case CompressionType.Gzip:
                    return DecompressGzip(data);
                case CompressionType.LZ4:
                    return DecompressLZ4(data);
                case CompressionType.Brotli:
                    return DecompressBrotli(data);
                default:
                    return data;
            }
        }

        private byte[] CompressGzip(byte[] data)
        {
            // In a real implementation, you would use a Gzip compression library
            // For now, we'll return the original data
            return data;
        }

        private byte[] DecompressGzip(byte[] data)
        {
            // In a real implementation, you would use a Gzip decompression library
            // For now, we'll return the original data
            return data;
        }

        private byte[] CompressLZ4(byte[] data)
        {
            // In a real implementation, you would use an LZ4 compression library
            // For now, we'll return the original data
            return data;
        }

        private byte[] DecompressLZ4(byte[] data)
        {
            // In a real implementation, you would use an LZ4 decompression library
            // For now, we'll return the original data
            return data;
        }

        private byte[] CompressBrotli(byte[] data)
        {
            // In a real implementation, you would use a Brotli compression library
            // For now, we'll return the original data
            return data;
        }

        private byte[] DecompressBrotli(byte[] data)
        {
            // In a real implementation, you would use a Brotli decompression library
            // For now, we'll return the original data
            return data;
        }
        #endregion

        #region Async Loading
        /// <summary>
        /// Load data asynchronously
        /// </summary>
        public async Task<T> LoadDataAsync<T>(string path)
        {
            if (string.IsNullOrEmpty(path)) return default(T);

            // Check cache first
            if (enableDataCaching && _dataCache.TryGetValue(path, out var cachedData))
            {
                if (cachedData is T)
                {
                    _cacheTimestamps[path] = Time.time;
                    return (T)cachedData;
                }
            }

            // Check if already loading
            if (_loadingTasks.TryGetValue(path, out var existingTask))
            {
                var result = await existingTask;
                return result is T ? (T)result : default(T);
            }

            // Start loading
            var task = LoadDataTask<T>(path);
            _loadingTasks[path] = task;

            try
            {
                var data = await task;
                return data;
            }
            finally
            {
                _loadingTasks.Remove(path);
            }
        }

        private async Task<T> LoadDataTask<T>(string path)
        {
            return await Task.Run(() =>
            {
                try
                {
                    // Load from file
                    var filePath = Path.Combine(Application.streamingAssetsPath, path);
                    if (!File.Exists(filePath))
                    {
                        Logger.Warning($"Data file not found: {path}", "DataOptimizer");
                        return default(T);
                    }

                    var data = File.ReadAllBytes(filePath);
                    var obj = DeserializeObject<T>(data);

                    // Cache the result
                    if (enableDataCaching && obj != null)
                    {
                        _dataCache[path] = obj;
                        _cacheTimestamps[path] = Time.time;
                    }

                    return obj;
                }
                catch (Exception e)
                {
                    Logger.Error($"Failed to load data from {path}: {e.Message}", "DataOptimizer");
                    return default(T);
                }
            });
        }

        /// <summary>
        /// Load multiple data files asynchronously
        /// </summary>
        public async Task<Dictionary<string, T>> LoadMultipleDataAsync<T>(string[] paths)
        {
            var tasks = new List<Task<KeyValuePair<string, T>>>();
            
            foreach (var path in paths)
            {
                tasks.Add(LoadSingleDataAsync<T>(path));
            }

            var results = await Task.WhenAll(tasks);
            var dictionary = new Dictionary<string, T>();

            foreach (var result in results)
            {
                if (result.Value != null)
                {
                    dictionary[result.Key] = result.Value;
                }
            }

            return dictionary;
        }

        private async Task<KeyValuePair<string, T>> LoadSingleDataAsync<T>(string path)
        {
            var data = await LoadDataAsync<T>(path);
            return new KeyValuePair<string, T>(path, data);
        }
        
        /// <summary>
        /// Load data with compression and binary serialization support
        /// </summary>
        public async Task<T> LoadOptimizedDataAsync<T>(string dataPath, bool useCache = true) where T : class
        {
            if (useCache && _dataCache.ContainsKey(dataPath))
            {
                return _dataCache[dataPath] as T;
            }

            try
            {
                // Try binary format first
                if (enableBinarySerialization)
                {
                    var binaryData = await LoadBinaryDataAsync<T>(dataPath);
                    if (binaryData != null)
                    {
                        if (useCache)
                        {
                            _dataCache[dataPath] = binaryData;
                            _cacheTimestamps[dataPath] = Time.time;
                        }
                        return binaryData;
                    }
                }
                
                // Fallback to JSON with compression
                var jsonData = await LoadCompressedJsonDataAsync<T>(dataPath);
                if (jsonData != null && useCache)
                {
                    _dataCache[dataPath] = jsonData;
                    _cacheTimestamps[dataPath] = Time.time;
                }
                return jsonData;
            }
            catch (Exception e)
            {
                Logger.Error($"Failed to load optimized data from {dataPath}: {e.Message}", "DataOptimizer");
                return null;
            }
        }
        
        /// <summary>
        /// Load binary serialized data
        /// </summary>
        private async Task<T> LoadBinaryDataAsync<T>(string dataPath) where T : class
        {
            var binaryPath = GetBinaryPath(dataPath);
            
            if (!File.Exists(binaryPath))
            {
                // Try to create binary version from JSON
                var jsonData = await LoadDataAsync<T>(dataPath);
                if (jsonData != null)
                {
                    await SaveBinaryDataAsync(dataPath, jsonData);
                    return jsonData;
                }
                return null;
            }
            
            try
            {
                var compressedData = await File.ReadAllBytesAsync(binaryPath);
                var decompressedData = DecompressData(compressedData);
                var data = DeserializeBinary<T>(decompressedData);
                
                Logger.Info($"Loaded binary data: {dataPath} ({compressedData.Length} bytes)", "DataOptimizer");
                return data;
            }
            catch (Exception e)
            {
                Logger.Warning($"Failed to load binary data from {binaryPath}: {e.Message}", "DataOptimizer");
                return null;
            }
        }
        
        /// <summary>
        /// Load compressed JSON data
        /// </summary>
        private async Task<T> LoadCompressedJsonDataAsync<T>(string dataPath) where T : class
        {
            var compressedPath = GetCompressedPath(dataPath);
            
            if (!File.Exists(compressedPath))
            {
                // Try to create compressed version from JSON
                var jsonData = await LoadDataAsync<T>(dataPath);
                if (jsonData != null)
                {
                    await SaveCompressedJsonDataAsync(dataPath, jsonData);
                    return jsonData;
                }
                return null;
            }
            
            try
            {
                var compressedData = await File.ReadAllBytesAsync(compressedPath);
                var decompressedData = DecompressData(compressedData);
                var jsonString = System.Text.Encoding.UTF8.GetString(decompressedData);
                var data = JsonUtility.FromJson<T>(jsonString);
                
                Logger.Info($"Loaded compressed JSON data: {dataPath} ({compressedData.Length} bytes)", "DataOptimizer");
                return data;
            }
            catch (Exception e)
            {
                Logger.Warning($"Failed to load compressed JSON data from {compressedPath}: {e.Message}", "DataOptimizer");
                return null;
            }
        }
        
        /// <summary>
        /// Save data with compression and binary serialization
        /// </summary>
        public async Task<bool> SaveOptimizedDataAsync<T>(string dataPath, T data) where T : class
        {
            try
            {
                bool success = true;
                
                // Save binary version
                if (enableBinarySerialization)
                {
                    success &= await SaveBinaryDataAsync(dataPath, data);
                }
                
                // Save compressed JSON version
                if (enableCompression)
                {
                    success &= await SaveCompressedJsonDataAsync(dataPath, data);
                }
                
                // Save regular JSON version as fallback
                success &= await SaveDataAsync(dataPath, data);
                
                return success;
            }
            catch (Exception e)
            {
                Logger.Error($"Failed to save optimized data to {dataPath}: {e.Message}", "DataOptimizer");
                return false;
            }
        }
        
        /// <summary>
        /// Save binary serialized data
        /// </summary>
        private async Task<bool> SaveBinaryDataAsync<T>(string dataPath, T data) where T : class
        {
            try
            {
                var binaryData = SerializeBinary(data);
                var compressedData = CompressData(binaryData);
                
                var binaryPath = GetBinaryPath(dataPath);
                await File.WriteAllBytesAsync(binaryPath, compressedData);
                
                Logger.Info($"Saved binary data: {dataPath} ({compressedData.Length} bytes)", "DataOptimizer");
                return true;
            }
            catch (Exception e)
            {
                Logger.Error($"Failed to save binary data to {dataPath}: {e.Message}", "DataOptimizer");
                return false;
            }
        }
        
        /// <summary>
        /// Save compressed JSON data
        /// </summary>
        private async Task<bool> SaveCompressedJsonDataAsync<T>(string dataPath, T data) where T : class
        {
            try
            {
                var jsonString = JsonUtility.ToJson(data, true);
                var jsonBytes = System.Text.Encoding.UTF8.GetBytes(jsonString);
                
                // Only compress if data is large enough
                if (jsonBytes.Length > compressionThreshold)
                {
                    var compressedData = CompressData(jsonBytes);
                    var compressedPath = GetCompressedPath(dataPath);
                    await File.WriteAllBytesAsync(compressedPath, compressedData);
                    
                    Logger.Info($"Saved compressed JSON data: {dataPath} ({compressedData.Length} bytes, {jsonBytes.Length} original)", "DataOptimizer");
                }
                
                return true;
            }
            catch (Exception e)
            {
                Logger.Error($"Failed to save compressed JSON data to {dataPath}: {e.Message}", "DataOptimizer");
                return false;
            }
        }
        
        /// <summary>
        /// Compress data using selected compression algorithm
        /// </summary>
        private byte[] CompressData(byte[] data)
        {
            if (!enableCompression || data.Length < compressionThreshold)
            {
                return data;
            }
            
            switch (compressionType)
            {
                case CompressionType.Gzip:
                    return CompressGzip(data);
                case CompressionType.LZ4:
                    return enableLZ4Compression ? CompressLZ4(data) : data;
                case CompressionType.Brotli:
                    return enableBrotliCompression ? CompressBrotli(data) : data;
                default:
                    return data;
            }
        }
        
        /// <summary>
        /// Decompress data using selected compression algorithm
        /// </summary>
        private byte[] DecompressData(byte[] compressedData)
        {
            if (!enableCompression)
            {
                return compressedData;
            }
            
            // Try to detect compression type by checking magic bytes
            if (compressedData.Length >= 2)
            {
                if (compressedData[0] == 0x1f && compressedData[1] == 0x8b) // Gzip magic
                {
                    return DecompressGzip(compressedData);
                }
                else if (compressedData[0] == 0x04 && compressedData[1] == 0x22) // LZ4 magic
                {
                    return enableLZ4Compression ? DecompressLZ4(compressedData) : compressedData;
                }
            }
            
            // Default to Gzip
            return DecompressGzip(compressedData);
        }
        
        /// <summary>
        /// Gzip compression
        /// </summary>
        private byte[] CompressGzip(byte[] data)
        {
            using (var output = new MemoryStream())
            {
                using (var gzip = new System.IO.Compression.GZipStream(output, System.IO.Compression.CompressionLevel.Optimal))
                {
                    gzip.Write(data, 0, data.Length);
                }
                return output.ToArray();
            }
        }
        
        /// <summary>
        /// Gzip decompression
        /// </summary>
        private byte[] DecompressGzip(byte[] compressedData)
        {
            using (var input = new MemoryStream(compressedData))
            using (var gzip = new System.IO.Compression.GZipStream(input, System.IO.Compression.CompressionMode.Decompress))
            using (var output = new MemoryStream())
            {
                gzip.CopyTo(output);
                return output.ToArray();
            }
        }
        
        /// <summary>
        /// LZ4 compression (placeholder - would need LZ4 library)
        /// </summary>
        private byte[] CompressLZ4(byte[] data)
        {
            // Placeholder implementation
            // In a real implementation, you would use an LZ4 library
            Logger.Warning("LZ4 compression not implemented - using Gzip fallback", "DataOptimizer");
            return CompressGzip(data);
        }
        
        /// <summary>
        /// LZ4 decompression (placeholder - would need LZ4 library)
        /// </summary>
        private byte[] DecompressLZ4(byte[] compressedData)
        {
            // Placeholder implementation
            // In a real implementation, you would use an LZ4 library
            Logger.Warning("LZ4 decompression not implemented - using Gzip fallback", "DataOptimizer");
            return DecompressGzip(compressedData);
        }
        
        /// <summary>
        /// Brotli compression (placeholder - would need Brotli library)
        /// </summary>
        private byte[] CompressBrotli(byte[] data)
        {
            // Placeholder implementation
            // In a real implementation, you would use a Brotli library
            Logger.Warning("Brotli compression not implemented - using Gzip fallback", "DataOptimizer");
            return CompressGzip(data);
        }
        
        /// <summary>
        /// Brotli decompression (placeholder - would need Brotli library)
        /// </summary>
        private byte[] DecompressBrotli(byte[] compressedData)
        {
            // Placeholder implementation
            // In a real implementation, you would use a Brotli library
            Logger.Warning("Brotli decompression not implemented - using Gzip fallback", "DataOptimizer");
            return DecompressGzip(compressedData);
        }
        
        /// <summary>
        /// Binary serialization
        /// </summary>
        private byte[] SerializeBinary<T>(T data) where T : class
        {
            // Simple binary serialization using JSON as base
            // In a real implementation, you would use a proper binary serializer like MessagePack
            var jsonString = JsonUtility.ToJson(data, true);
            return System.Text.Encoding.UTF8.GetBytes(jsonString);
        }
        
        /// <summary>
        /// Binary deserialization
        /// </summary>
        private T DeserializeBinary<T>(byte[] data) where T : class
        {
            // Simple binary deserialization using JSON as base
            // In a real implementation, you would use a proper binary deserializer like MessagePack
            var jsonString = System.Text.Encoding.UTF8.GetString(data);
            return JsonUtility.FromJson<T>(jsonString);
        }
        
        /// <summary>
        /// Get binary file path
        /// </summary>
        private string GetBinaryPath(string dataPath)
        {
            return dataPath.Replace(".json", ".bin");
        }
        
        /// <summary>
        /// Get compressed file path
        /// </summary>
        private string GetCompressedPath(string dataPath)
        {
            return dataPath.Replace(".json", ".gz");
        }
        #endregion

        #region Data Caching
        /// <summary>
        /// Get data from cache
        /// </summary>
        public T GetCachedData<T>(string key)
        {
            if (!enableDataCaching || !_dataCache.TryGetValue(key, out var data))
            {
                return default(T);
            }

            if (data is T)
            {
                _cacheTimestamps[key] = Time.time;
                return (T)data;
            }

            return default(T);
        }

        /// <summary>
        /// Set data in cache
        /// </summary>
        public void SetCachedData<T>(string key, T data)
        {
            if (!enableDataCaching) return;

            _dataCache[key] = data;
            _cacheTimestamps[key] = Time.time;

            // Check cache size
            if (_dataCache.Count > maxCacheSize)
            {
                CleanupOldestCacheEntries();
            }
        }

        /// <summary>
        /// Remove data from cache
        /// </summary>
        public void RemoveCachedData(string key)
        {
            _dataCache.Remove(key);
            _cacheTimestamps.Remove(key);
        }

        /// <summary>
        /// Clear all cached data
        /// </summary>
        public void ClearCache()
        {
            _dataCache.Clear();
            _cacheTimestamps.Clear();
            Logger.Info("Data cache cleared", "DataOptimizer");
        }

        private void CleanupExpiredCache()
        {
            var currentTime = Time.time;
            var expiredKeys = new List<string>();

            foreach (var kvp in _cacheTimestamps)
            {
                if (currentTime - kvp.Value > cacheExpirationTime)
                {
                    expiredKeys.Add(kvp.Key);
                }
            }

            foreach (var key in expiredKeys)
            {
                _dataCache.Remove(key);
                _cacheTimestamps.Remove(key);
            }

            if (expiredKeys.Count > 0)
            {
                Logger.Info($"Cleaned up {expiredKeys.Count} expired cache entries", "DataOptimizer");
            }
        }

        private void CleanupOldestCacheEntries()
        {
            var entries = new List<KeyValuePair<string, float>>(_cacheTimestamps);
            entries.Sort((a, b) => a.Value.CompareTo(b.Value));

            var toRemove = entries.Count - maxCacheSize;
            for (int i = 0; i < toRemove; i++)
            {
                var key = entries[i].Key;
                _dataCache.Remove(key);
                _cacheTimestamps.Remove(key);
            }

            Logger.Info($"Cleaned up {toRemove} oldest cache entries", "DataOptimizer");
        }
        #endregion

        #region Preloading
        private IEnumerator PreloadData()
        {
            if (preloadDataPaths == null || preloadDataPaths.Length == 0) yield break;

            Logger.Info($"Preloading {preloadDataPaths.Length} data files", "DataOptimizer");

            foreach (var path in preloadDataPaths)
            {
                yield return StartCoroutine(PreloadSingleData(path));
            }

            Logger.Info("Data preloading completed", "DataOptimizer");
        }

        private IEnumerator PreloadSingleData(string path)
        {
            var task = LoadDataAsync<object>(path);
            
            while (!task.IsCompleted)
            {
                yield return null;
            }

            if (task.Exception != null)
            {
                Logger.Error($"Failed to preload {path}: {task.Exception.Message}", "DataOptimizer");
            }
        }
        #endregion

        #region Memory Management
        private void ForceGarbageCollection()
        {
            var beforeMemory = GC.GetTotalMemory(false);
            GC.Collect();
            GC.WaitForPendingFinalizers();
            GC.Collect();
            var afterMemory = GC.GetTotalMemory(false);
            
            var freed = beforeMemory - afterMemory;
            Logger.Info($"Forced GC: Freed {freed / 1024f / 1024f:F2} MB", "DataOptimizer");
        }

        /// <summary>
        /// Get current memory usage
        /// </summary>
        public long GetCurrentMemoryUsage()
        {
            return GC.GetTotalMemory(false);
        }

        /// <summary>
        /// Get memory usage in MB
        /// </summary>
        public float GetMemoryUsageMB()
        {
            return GetCurrentMemoryUsage() / 1024f / 1024f;
        }

        /// <summary>
        /// Check if memory usage is within limits
        /// </summary>
        public bool IsMemoryWithinLimits()
        {
            return GetMemoryUsageMB() <= maxMemoryUsageMB;
        }
        #endregion

        #region Statistics
        /// <summary>
        /// Get data optimizer statistics
        /// </summary>
        public Dictionary<string, object> GetStatistics()
        {
            return new Dictionary<string, object>
            {
                {"cached_items", _dataCache.Count},
                {"loading_tasks", _loadingTasks.Count},
                {"memory_usage_mb", GetMemoryUsageMB()},
                {"max_memory_mb", maxMemoryUsageMB},
                {"memory_usage_percent", (GetMemoryUsageMB() / maxMemoryUsageMB) * 100f},
                {"enable_fast_serialization", enableFastSerialization},
                {"enable_compression", enableCompression},
                {"compression_type", compressionType.ToString()},
                {"enable_async_loading", enableAsyncLoading},
                {"enable_data_caching", enableDataCaching},
                {"cache_expiration_time", cacheExpirationTime},
                {"enable_preloading", enablePreloading}
            };
        }
        #endregion

        void OnDestroy()
        {
            ClearCache();
        }

        void OnApplicationPause(bool pauseStatus)
        {
            if (pauseStatus)
            {
                ForceGarbageCollection();
            }
        }

        void OnApplicationFocus(bool hasFocus)
        {
            if (!hasFocus)
            {
                ForceGarbageCollection();
            }
        }
    }
}