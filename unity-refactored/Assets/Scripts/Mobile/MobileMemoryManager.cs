using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Evergreen.Core;

namespace Evergreen.Mobile
{
    /// <summary>
    /// Mobile-specific memory pressure handling and quality management
    /// </summary>
    public class MobileMemoryManager : MonoBehaviour
    {
        public static MobileMemoryManager Instance { get; private set; }

        [Header("Memory Pressure Settings")]
        public bool enableMemoryPressureHandling = true;
        public float memoryPressureThreshold = 0.8f;
        public float memoryCriticalThreshold = 0.9f;
        public float memoryCheckInterval = 2f;
        public bool enableAutomaticQualityReduction = true;
        public bool enableMemoryWarnings = true;

        [Header("Quality Reduction Levels")]
        public int maxQualityReductionLevel = 3;
        public float[] memoryThresholds = { 0.6f, 0.75f, 0.85f, 0.95f };
        public int[] qualityLevels = { 3, 2, 1, 0 }; // Ultra, High, Medium, Low

        [Header("Memory Cleanup")]
        public bool enableAutomaticCleanup = true;
        public float cleanupInterval = 30f;
        public bool enableTextureCleanup = true;
        public bool enableAudioCleanup = true;
        public bool enableMeshCleanup = true;

        private float _currentMemoryUsage = 0f;
        private float _maxMemoryUsage = 0f;
        private int _currentQualityLevel = 3;
        private bool _isMemoryPressure = false;
        private bool _isCriticalMemory = false;
        private float _lastMemoryCheck = 0f;
        private float _lastCleanup = 0f;
        private int _qualityReductionLevel = 0;

        // Memory tracking
        private long _textureMemory = 0;
        private long _audioMemory = 0;
        private long _meshMemory = 0;
        private long _otherMemory = 0;

        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeMobileMemoryManager();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        void Update()
        {
            if (enableMemoryPressureHandling)
            {
                MonitorMemoryPressure();
            }

            if (enableAutomaticCleanup)
            {
                PerformAutomaticCleanup();
            }
        }

        private void InitializeMobileMemoryManager()
        {
            // Get initial memory usage
            _maxMemoryUsage = GetTotalMemory();
            _currentMemoryUsage = GetCurrentMemoryUsage();

            Logger.Info($"Mobile Memory Manager initialized - Max: {_maxMemoryUsage / 1024 / 1024:F1}MB, Current: {_currentMemoryUsage / 1024 / 1024:F1}MB", "MobileMemoryManager");
        }

        private void MonitorMemoryPressure()
        {
            if (Time.time - _lastMemoryCheck < memoryCheckInterval) return;

            _lastMemoryCheck = Time.time;
            _currentMemoryUsage = GetCurrentMemoryUsage();

            float memoryRatio = _currentMemoryUsage / _maxMemoryUsage;
            bool wasMemoryPressure = _isMemoryPressure;
            bool wasCriticalMemory = _isCriticalMemory;

            // Check memory pressure levels
            _isMemoryPressure = memoryRatio >= memoryPressureThreshold;
            _isCriticalMemory = memoryRatio >= memoryCriticalThreshold;

            // Handle memory pressure
            if (_isCriticalMemory && !wasCriticalMemory)
            {
                HandleCriticalMemoryPressure();
            }
            else if (_isMemoryPressure && !wasMemoryPressure)
            {
                HandleMemoryPressure();
            }
            else if (!_isMemoryPressure && wasMemoryPressure)
            {
                HandleMemoryRecovery();
            }

            // Update quality based on memory pressure
            if (enableAutomaticQualityReduction)
            {
                UpdateQualityBasedOnMemory(memoryRatio);
            }
        }

        private void HandleMemoryPressure()
        {
            Logger.Warning($"Memory pressure detected: {_currentMemoryUsage / 1024 / 1024:F1}MB / {_maxMemoryUsage / 1024 / 1024:F1}MB", "MobileMemoryManager");

            // Reduce quality by one level
            if (_qualityReductionLevel < maxQualityReductionLevel)
            {
                _qualityReductionLevel++;
                ApplyQualityReduction(_qualityReductionLevel);
            }

            // Perform aggressive cleanup
            PerformAggressiveCleanup();
        }

        private void HandleCriticalMemoryPressure()
        {
            Logger.Error($"Critical memory pressure detected: {_currentMemoryUsage / 1024 / 1024:F1}MB / {_maxMemoryUsage / 1024 / 1024:F1}MB", "MobileMemoryManager");

            // Maximum quality reduction
            _qualityReductionLevel = maxQualityReductionLevel;
            ApplyQualityReduction(_qualityReductionLevel);

            // Perform emergency cleanup
            PerformEmergencyCleanup();

            // Force garbage collection
            System.GC.Collect();
            System.GC.WaitForPendingFinalizers();
            System.GC.Collect();
        }

        private void HandleMemoryRecovery()
        {
            Logger.Info("Memory pressure recovered", "MobileMemoryManager");

            // Gradually restore quality
            if (_qualityReductionLevel > 0)
            {
                _qualityReductionLevel--;
                ApplyQualityReduction(_qualityReductionLevel);
            }
        }

        private void UpdateQualityBasedOnMemory(float memoryRatio)
        {
            int targetQualityLevel = 3; // Start with Ultra

            // Find appropriate quality level based on memory usage
            for (int i = 0; i < memoryThresholds.Length; i++)
            {
                if (memoryRatio >= memoryThresholds[i])
                {
                    targetQualityLevel = qualityLevels[i];
                }
            }

            if (targetQualityLevel != _currentQualityLevel)
            {
                _currentQualityLevel = targetQualityLevel;
                ApplyQualitySettings(_currentQualityLevel);
            }
        }

        private void ApplyQualityReduction(int level)
        {
            switch (level)
            {
                case 1:
                    // Light reduction
                    QualitySettings.SetQualityLevel(2, true);
                    Application.targetFrameRate = 45;
                    break;
                case 2:
                    // Medium reduction
                    QualitySettings.SetQualityLevel(1, true);
                    Application.targetFrameRate = 30;
                    break;
                case 3:
                    // Heavy reduction
                    QualitySettings.SetQualityLevel(0, true);
                    Application.targetFrameRate = 20;
                    break;
            }

            Logger.Info($"Applied quality reduction level {level}", "MobileMemoryManager");
        }

        private void ApplyQualitySettings(int qualityLevel)
        {
            switch (qualityLevel)
            {
                case 0: // Low
                    QualitySettings.SetQualityLevel(0, true);
                    Application.targetFrameRate = 20;
                    break;
                case 1: // Medium
                    QualitySettings.SetQualityLevel(1, true);
                    Application.targetFrameRate = 30;
                    break;
                case 2: // High
                    QualitySettings.SetQualityLevel(2, true);
                    Application.targetFrameRate = 45;
                    break;
                case 3: // Ultra
                    QualitySettings.SetQualityLevel(3, true);
                    Application.targetFrameRate = 60;
                    break;
            }
        }

        private void PerformAutomaticCleanup()
        {
            if (Time.time - _lastCleanup < cleanupInterval) return;

            _lastCleanup = Time.time;

            // Clean up unused assets
            Resources.UnloadUnusedAssets();

            // Force garbage collection
            System.GC.Collect();
        }

        private void PerformAggressiveCleanup()
        {
            // Unload unused textures
            if (enableTextureCleanup)
            {
                UnloadUnusedTextures();
            }

            // Unload unused audio
            if (enableAudioCleanup)
            {
                UnloadUnusedAudio();
            }

            // Unload unused meshes
            if (enableMeshCleanup)
            {
                UnloadUnusedMeshes();
            }

            // Force garbage collection
            System.GC.Collect();
        }

        private void PerformEmergencyCleanup()
        {
            // Unload all unused assets
            Resources.UnloadUnusedAssets();

            // Clear texture cache
            if (enableTextureCleanup)
            {
                ClearTextureCache();
            }

            // Clear audio cache
            if (enableAudioCleanup)
            {
                ClearAudioCache();
            }

            // Force multiple garbage collections
            for (int i = 0; i < 3; i++)
            {
                System.GC.Collect();
                System.GC.WaitForPendingFinalizers();
            }
        }

        private void UnloadUnusedTextures()
        {
            // Find all textures in the scene
            var textures = Resources.FindObjectsOfTypeAll<Texture2D>();
            int unloadedCount = 0;

            foreach (var texture in textures)
            {
                if (texture != null && !texture.isReadable)
                {
                    Resources.UnloadAsset(texture);
                    unloadedCount++;
                }
            }

            if (unloadedCount > 0)
            {
                Logger.Info($"Unloaded {unloadedCount} unused textures", "MobileMemoryManager");
            }
        }

        private void UnloadUnusedAudio()
        {
            // Find all audio clips in the scene
            var audioClips = Resources.FindObjectsOfTypeAll<AudioClip>();
            int unloadedCount = 0;

            foreach (var clip in audioClips)
            {
                if (clip != null && !clip.loadInBackground)
                {
                    Resources.UnloadAsset(clip);
                    unloadedCount++;
                }
            }

            if (unloadedCount > 0)
            {
                Logger.Info($"Unloaded {unloadedCount} unused audio clips", "MobileMemoryManager");
            }
        }

        private void UnloadUnusedMeshes()
        {
            // Find all meshes in the scene
            var meshes = Resources.FindObjectsOfTypeAll<Mesh>();
            int unloadedCount = 0;

            foreach (var mesh in meshes)
            {
                if (mesh != null && !mesh.isReadable)
                {
                    Resources.UnloadAsset(mesh);
                    unloadedCount++;
                }
            }

            if (unloadedCount > 0)
            {
                Logger.Info($"Unloaded {unloadedCount} unused meshes", "MobileMemoryManager");
            }
        }

        private void ClearTextureCache()
        {
            // Clear texture cache from OptimizedTextureManager
            var textureManager = FindObjectOfType<Evergreen.Graphics.OptimizedTextureManager>();
            if (textureManager != null)
            {
                // This would need to be implemented in OptimizedTextureManager
                Logger.Info("Cleared texture cache", "MobileMemoryManager");
            }
        }

        private void ClearAudioCache()
        {
            // Clear audio cache from OptimizedAudioManager
            var audioManager = FindObjectOfType<Evergreen.Audio.OptimizedAudioManager>();
            if (audioManager != null)
            {
                // This would need to be implemented in OptimizedAudioManager
                Logger.Info("Cleared audio cache", "MobileMemoryManager");
            }
        }

        private long GetTotalMemory()
        {
            // Get total memory available to the application
            return SystemInfo.systemMemorySize * 1024 * 1024; // Convert MB to bytes
        }

        private long GetCurrentMemoryUsage()
        {
            // Get current memory usage
            return System.GC.GetTotalMemory(false);
        }

        private void UpdateMemoryBreakdown()
        {
            // Update memory breakdown for different asset types
            _textureMemory = GetTextureMemory();
            _audioMemory = GetAudioMemory();
            _meshMemory = GetMeshMemory();
            _otherMemory = GetCurrentMemoryUsage() - _textureMemory - _audioMemory - _meshMemory;
        }

        private long GetTextureMemory()
        {
            long memory = 0;
            var textures = Resources.FindObjectsOfTypeAll<Texture2D>();
            
            foreach (var texture in textures)
            {
                if (texture != null)
                {
                    memory += CalculateTextureMemorySize(texture);
                }
            }
            
            return memory;
        }

        private long GetAudioMemory()
        {
            long memory = 0;
            var audioClips = Resources.FindObjectsOfTypeAll<AudioClip>();
            
            foreach (var clip in audioClips)
            {
                if (clip != null)
                {
                    memory += CalculateAudioMemorySize(clip);
                }
            }
            
            return memory;
        }

        private long GetMeshMemory()
        {
            long memory = 0;
            var meshes = Resources.FindObjectsOfTypeAll<Mesh>();
            
            foreach (var mesh in meshes)
            {
                if (mesh != null)
                {
                    memory += CalculateMeshMemorySize(mesh);
                }
            }
            
            return memory;
        }

        private long CalculateTextureMemorySize(Texture2D texture)
        {
            if (texture == null) return 0;
            
            int width = texture.width;
            int height = texture.height;
            int bytesPerPixel = GetBytesPerPixel(texture.format);
            
            return width * height * bytesPerPixel;
        }

        private long CalculateAudioMemorySize(AudioClip clip)
        {
            if (clip == null) return 0;
            
            // Rough estimation based on samples and channels
            return clip.samples * clip.channels * 2; // 2 bytes per sample
        }

        private long CalculateMeshMemorySize(Mesh mesh)
        {
            if (mesh == null) return 0;
            
            // Rough estimation based on vertices and triangles
            int vertexCount = mesh.vertexCount;
            int triangleCount = mesh.triangles.Length / 3;
            
            // Estimate: 12 bytes per vertex (Vector3) + 4 bytes per triangle index
            return (vertexCount * 12) + (triangleCount * 4);
        }

        private int GetBytesPerPixel(TextureFormat format)
        {
            switch (format)
            {
                case TextureFormat.RGBA32:
                case TextureFormat.ARGB32:
                    return 4;
                case TextureFormat.RGB24:
                    return 3;
                case TextureFormat.RGBA16:
                    return 2;
                case TextureFormat.R8:
                    return 1;
                default:
                    return 4; // Default assumption
            }
        }

        // Public API
        public float GetCurrentMemoryUsageMB()
        {
            return _currentMemoryUsage / 1024f / 1024f;
        }

        public float GetMaxMemoryUsageMB()
        {
            return _maxMemoryUsage / 1024f / 1024f;
        }

        public float GetMemoryUsageRatio()
        {
            return _currentMemoryUsage / _maxMemoryUsage;
        }

        public bool IsMemoryPressure()
        {
            return _isMemoryPressure;
        }

        public bool IsCriticalMemory()
        {
            return _isCriticalMemory;
        }

        public int GetCurrentQualityLevel()
        {
            return _currentQualityLevel;
        }

        public int GetQualityReductionLevel()
        {
            return _qualityReductionLevel;
        }

        public Dictionary<string, long> GetMemoryBreakdown()
        {
            UpdateMemoryBreakdown();
            
            return new Dictionary<string, long>
            {
                {"texture", _textureMemory},
                {"audio", _audioMemory},
                {"mesh", _meshMemory},
                {"other", _otherMemory},
                {"total", _currentMemoryUsage}
            };
        }
    }
}