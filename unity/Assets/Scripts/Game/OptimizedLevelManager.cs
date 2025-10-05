using System.Collections.Generic;
using System.Threading.Tasks;
using UnityEngine;
using System.Collections;
using Evergreen.Data;
using Evergreen.Core;

namespace Evergreen.Game
{
    /// <summary>
    /// Optimized level manager with async loading, caching, and memory management
    /// </summary>
    public class OptimizedLevelManager : MonoBehaviour
    {
        public static OptimizedLevelManager Instance { get; private set; }

        [Header("Level Settings")]
        public bool enableAsyncLoading = true;
        public bool enableLevelCaching = true;
        public int maxCachedLevels = 10;
        public float cacheExpirationTime = 300f; // 5 minutes
        public bool enablePreloading = true;
        public int preloadRange = 3; // Preload current level ± 3

        [Header("Performance Settings")]
        public bool enableMemoryOptimization = true;
        public int maxMemoryUsageMB = 128;
        public bool enableGarbageCollection = true;
        public float gcInterval = 30f;
        public bool enableLevelValidation = true;

        [Header("Loading Settings")]
        public bool enableProgressTracking = true;
        public float loadingTimeout = 30f;
        public bool enableLoadingScreen = true;
        public GameObject loadingScreenPrefab;

        private readonly Dictionary<int, LevelData> _levelCache = new Dictionary<int, LevelData>();
        private readonly Dictionary<int, float> _cacheTimestamps = new Dictionary<int, float>();
        private readonly Dictionary<int, Task<LevelData>> _loadingTasks = new Dictionary<int, Task<LevelData>>();
        private readonly Queue<int> _preloadQueue = new Queue<int>();
        private readonly List<int> _preloadingLevels = new List<int>();

        private int _currentLevel = 1;
        private LevelData _currentLevelData;
        private GameObject _loadingScreen;
        private float _lastGCTime = 0f;
        private bool _isLoading = false;

        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeLevelManager();
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
                StartCoroutine(PreloadNearbyLevels());
            }
        }

        void Update()
        {
            if (enableGarbageCollection && Time.time - _lastGCTime > gcInterval)
            {
                ForceGarbageCollection();
                _lastGCTime = Time.time;
            }

            if (enableLevelCaching)
            {
                CleanupExpiredCache();
            }
        }

        private void InitializeLevelManager()
        {
            Logger.Info("Optimized Level Manager initialized", "LevelManager");
        }

        #region Level Loading
        /// <summary>
        /// Load level asynchronously
        /// </summary>
        public async Task<LevelData> LoadLevelAsync(int levelId)
        {
            if (levelId <= 0) return null;

            // Check cache first
            if (enableLevelCaching && _levelCache.TryGetValue(levelId, out var cachedLevel))
            {
                _cacheTimestamps[levelId] = Time.time;
                return cachedLevel;
            }

            // Check if already loading
            if (_loadingTasks.TryGetValue(levelId, out var existingTask))
            {
                return await existingTask;
            }

            // Show loading screen
            if (enableLoadingScreen)
            {
                ShowLoadingScreen();
            }

            // Start loading
            var task = LoadLevelTask(levelId);
            _loadingTasks[levelId] = task;

            try
            {
                var levelData = await task;
                return levelData;
            }
            finally
            {
                _loadingTasks.Remove(levelId);
                if (enableLoadingScreen)
                {
                    HideLoadingScreen();
                }
            }
        }

        private async Task<LevelData> LoadLevelTask(int levelId)
        {
            return await Task.Run(() =>
            {
                try
                {
                    // Load level data using DataOptimizer
                    var dataOptimizer = DataOptimizer.Instance;
                    if (dataOptimizer == null)
                    {
                        Logger.Error("DataOptimizer not found", "LevelManager");
                        return null;
                    }

                    var levelPath = $"levels/level_{levelId}.json";
                    var levelData = dataOptimizer.LoadDataAsync<LevelData>(levelPath).Result;

                    if (levelData == null)
                    {
                        Logger.Warning($"Level {levelId} not found", "LevelManager");
                        return null;
                    }

                    // Validate level data
                    if (enableLevelValidation && !ValidateLevelData(levelData))
                    {
                        Logger.Error($"Level {levelId} validation failed", "LevelManager");
                        return null;
                    }

                    // Cache the level
                    if (enableLevelCaching)
                    {
                        _levelCache[levelId] = levelData;
                        _cacheTimestamps[levelId] = Time.time;
                    }

                    return levelData;
                }
                catch (System.Exception e)
                {
                    Logger.Error($"Failed to load level {levelId}: {e.Message}", "LevelManager");
                    return null;
                }
            });
        }

        /// <summary>
        /// Load level synchronously (fallback)
        /// </summary>
        public LevelData LoadLevel(int levelId)
        {
            if (levelId <= 0) return null;

            // Check cache first
            if (enableLevelCaching && _levelCache.TryGetValue(levelId, out var cachedLevel))
            {
                _cacheTimestamps[levelId] = Time.time;
                return cachedLevel;
            }

            try
            {
                // Load from file
                var levelPath = $"levels/level_{levelId}.json";
                var filePath = System.IO.Path.Combine(Application.streamingAssetsPath, levelPath);
                
                if (!System.IO.File.Exists(filePath))
                {
                    Logger.Warning($"Level file not found: {filePath}", "LevelManager");
                    return null;
                }

                var json = System.IO.File.ReadAllText(filePath);
                var levelData = JsonUtility.FromJson<LevelData>(json);

                if (levelData == null)
                {
                    Logger.Warning($"Failed to parse level {levelId}", "LevelManager");
                    return null;
                }

                // Validate level data
                if (enableLevelValidation && !ValidateLevelData(levelData))
                {
                    Logger.Error($"Level {levelId} validation failed", "LevelManager");
                    return null;
                }

                // Cache the level
                if (enableLevelCaching)
                {
                    _levelCache[levelId] = levelData;
                    _cacheTimestamps[levelId] = Time.time;
                }

                return levelData;
            }
            catch (System.Exception e)
            {
                Logger.Error($"Failed to load level {levelId}: {e.Message}", "LevelManager");
                return null;
            }
        }
        #endregion

        #region Level Management
        /// <summary>
        /// Set current level
        /// </summary>
        public void SetCurrentLevel(int levelId)
        {
            _currentLevel = levelId;
            _currentLevelData = LoadLevel(levelId);
        }

        /// <summary>
        /// Get current level data
        /// </summary>
        public LevelData GetCurrentLevelData()
        {
            return _currentLevelData;
        }

        /// <summary>
        /// Get level data by ID
        /// </summary>
        public LevelData GetLevelData(int levelId)
        {
            if (enableLevelCaching && _levelCache.TryGetValue(levelId, out var cachedLevel))
            {
                _cacheTimestamps[levelId] = Time.time;
                return cachedLevel;
            }

            return LoadLevel(levelId);
        }

        /// <summary>
        /// Check if level exists
        /// </summary>
        public bool LevelExists(int levelId)
        {
            var levelPath = $"levels/level_{levelId}.json";
            var filePath = System.IO.Path.Combine(Application.streamingAssetsPath, levelPath);
            return System.IO.File.Exists(filePath);
        }

        /// <summary>
        /// Get total number of levels
        /// </summary>
        public int GetTotalLevels()
        {
            var levelsPath = System.IO.Path.Combine(Application.streamingAssetsPath, "levels");
            if (!System.IO.Directory.Exists(levelsPath))
            {
                return 0;
            }

            var files = System.IO.Directory.GetFiles(levelsPath, "level_*.json");
            return files.Length;
        }
        #endregion

        #region Preloading
        private IEnumerator PreloadNearbyLevels()
        {
            while (true)
            {
                yield return new WaitForSeconds(1f);

                if (_isLoading) continue;

                var levelsToPreload = GetLevelsToPreload();
                foreach (var levelId in levelsToPreload)
                {
                    if (!_levelCache.ContainsKey(levelId) && !_loadingTasks.ContainsKey(levelId))
                    {
                        StartCoroutine(PreloadLevel(levelId));
                    }
                }
            }
        }

        private List<int> GetLevelsToPreload()
        {
            var levels = new List<int>();
            var totalLevels = GetTotalLevels();

            for (int i = Mathf.Max(1, _currentLevel - preloadRange); 
                 i <= Mathf.Min(totalLevels, _currentLevel + preloadRange); 
                 i++)
            {
                if (i != _currentLevel && !_levelCache.ContainsKey(i))
                {
                    levels.Add(i);
                }
            }

            return levels;
        }

        private IEnumerator PreloadLevel(int levelId)
        {
            _preloadingLevels.Add(levelId);
            _isLoading = true;

            try
            {
                var task = LoadLevelAsync(levelId);
                
                while (!task.IsCompleted)
                {
                    yield return null;
                }

                if (task.Exception != null)
                {
                    Logger.Warning($"Failed to preload level {levelId}: {task.Exception.Message}", "LevelManager");
                }
            }
            finally
            {
                _preloadingLevels.Remove(levelId);
                _isLoading = false;
            }
        }
        #endregion

        #region Level Validation
        private bool ValidateLevelData(LevelData levelData)
        {
            if (levelData == null) return false;

            // Validate basic properties
            if (levelData.size.x <= 0 || levelData.size.y <= 0)
            {
                Logger.Error("Invalid level size", "LevelManager");
                return false;
            }

            if (levelData.num_colors <= 0 || levelData.num_colors > 6)
            {
                Logger.Error("Invalid number of colors", "LevelManager");
                return false;
            }

            if (levelData.move_limit <= 0)
            {
                Logger.Error("Invalid move limit", "LevelManager");
                return false;
            }

            // Validate goals
            if (levelData.goals == null || levelData.goals.Length == 0)
            {
                Logger.Error("No goals defined", "LevelManager");
                return false;
            }

            // Validate grid size
            var gridSize = levelData.size.x * levelData.size.y;
            if (gridSize > 100) // Reasonable limit
            {
                Logger.Error("Level grid too large", "LevelManager");
                return false;
            }

            return true;
        }
        #endregion

        #region Cache Management
        private void CleanupExpiredCache()
        {
            var currentTime = Time.time;
            var expiredKeys = new List<int>();

            foreach (var kvp in _cacheTimestamps)
            {
                if (currentTime - kvp.Value > cacheExpirationTime)
                {
                    expiredKeys.Add(kvp.Key);
                }
            }

            foreach (var key in expiredKeys)
            {
                _levelCache.Remove(key);
                _cacheTimestamps.Remove(key);
            }

            if (expiredKeys.Count > 0)
            {
                Logger.Info($"Cleaned up {expiredKeys.Count} expired level cache entries", "LevelManager");
            }
        }

        /// <summary>
        /// Clear level cache
        /// </summary>
        public void ClearCache()
        {
            _levelCache.Clear();
            _cacheTimestamps.Clear();
            Logger.Info("Level cache cleared", "LevelManager");
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
            Logger.Info($"Forced GC: Freed {freed / 1024f / 1024f:F2} MB", "LevelManager");
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

        #region Loading Screen
        private void ShowLoadingScreen()
        {
            if (loadingScreenPrefab != null && _loadingScreen == null)
            {
                _loadingScreen = Instantiate(loadingScreenPrefab);
            }
        }

        private void HideLoadingScreen()
        {
            if (_loadingScreen != null)
            {
                Destroy(_loadingScreen);
                _loadingScreen = null;
            }
        }
        #endregion

        #region Statistics
        /// <summary>
        /// Get level manager statistics
        /// </summary>
        public Dictionary<string, object> GetStatistics()
        {
            return new Dictionary<string, object>
            {
                {"cached_levels", _levelCache.Count},
                {"loading_tasks", _loadingTasks.Count},
                {"preloading_levels", _preloadingLevels.Count},
                {"current_level", _currentLevel},
                {"total_levels", GetTotalLevels()},
                {"memory_usage_mb", GetMemoryUsageMB()},
                {"max_memory_mb", maxMemoryUsageMB},
                {"memory_usage_percent", (GetMemoryUsageMB() / maxMemoryUsageMB) * 100f},
                {"enable_async_loading", enableAsyncLoading},
                {"enable_level_caching", enableLevelCaching},
                {"enable_preloading", enablePreloading},
                {"preload_range", preloadRange},
                {"cache_expiration_time", cacheExpirationTime}
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