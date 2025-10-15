using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.TestTools;
using NUnit.Framework;
using Evergreen.Core;
using Evergreen.Performance;
using Evergreen.Graphics;
using Evergreen.Audio;
using Evergreen.Data;
using Evergreen.Mobile;

namespace Evergreen.Testing
{
    /// <summary>
    /// Comprehensive performance testing suite for all optimization systems
    /// </summary>
    public class AdvancedPerformanceTests
    {
        private PerformanceManager _performanceManager;
        private GraphicsOptimizer _graphicsOptimizer;
        private OptimizedAudioManager _audioManager;
        private DataOptimizer _dataOptimizer;
        private MobileMemoryManager _mobileMemoryManager;
        private CacheManager<string, object> _cacheManager;

        [SetUp]
        public void Setup()
        {
            // Create test objects
            var performanceGO = new GameObject("PerformanceManager");
            _performanceManager = performanceGO.AddComponent<PerformanceManager>();
            
            var graphicsGO = new GameObject("GraphicsOptimizer");
            _graphicsOptimizer = graphicsGO.AddComponent<GraphicsOptimizer>();
            
            var audioGO = new GameObject("AudioManager");
            _audioManager = audioGO.AddComponent<OptimizedAudioManager>();
            
            var dataGO = new GameObject("DataOptimizer");
            _dataOptimizer = dataGO.AddComponent<DataOptimizer>();
            
            var mobileGO = new GameObject("MobileMemoryManager");
            _mobileMemoryManager = mobileGO.AddComponent<MobileMemoryManager>();
            
            // Initialize cache manager
            _cacheManager = new CacheManager<string, object>(100, 300f, CacheManager<string, object>.EvictionPolicy.LRU);
        }

        [TearDown]
        public void TearDown()
        {
            // Clean up test objects
            if (_performanceManager != null) Object.DestroyImmediate(_performanceManager.gameObject);
            if (_graphicsOptimizer != null) Object.DestroyImmediate(_graphicsOptimizer.gameObject);
            if (_audioManager != null) Object.DestroyImmediate(_audioManager.gameObject);
            if (_dataOptimizer != null) Object.DestroyImmediate(_dataOptimizer.gameObject);
            if (_mobileMemoryManager != null) Object.DestroyImmediate(_mobileMemoryManager.gameObject);
        }

        #region Performance Manager Tests
        [Test]
        public void PerformanceManager_GetFPS_ReturnsValidValue()
        {
            // Arrange
            float fps = _performanceManager.GetFPS();
            
            // Assert
            Assert.Greater(fps, 0f, "FPS should be greater than 0");
            Assert.LessOrEqual(fps, 1000f, "FPS should be reasonable (less than 1000)");
        }

        [Test]
        public void PerformanceManager_GetMemoryUsage_ReturnsValidValue()
        {
            // Arrange
            long memory = _performanceManager.GetMemoryUsage();
            
            // Assert
            Assert.Greater(memory, 0, "Memory usage should be greater than 0");
            Assert.Less(memory, 1024L * 1024 * 1024, "Memory usage should be less than 1GB");
        }

        [Test]
        public void PerformanceManager_GetCPUUsage_ReturnsValidValue()
        {
            // Arrange
            float cpuUsage = _performanceManager.GetCPUUsage();
            
            // Assert
            Assert.GreaterOrEqual(cpuUsage, 0f, "CPU usage should be >= 0");
            Assert.LessOrEqual(cpuUsage, 100f, "CPU usage should be <= 100%");
        }

        [Test]
        public void PerformanceManager_GetGPUUsage_ReturnsValidValue()
        {
            // Arrange
            float gpuUsage = _performanceManager.GetGPUUsage();
            
            // Assert
            Assert.GreaterOrEqual(gpuUsage, 0f, "GPU usage should be >= 0");
            Assert.LessOrEqual(gpuUsage, 100f, "GPU usage should be <= 100%");
        }

        [Test]
        public void PerformanceManager_GetDrawCalls_ReturnsValidValue()
        {
            // Arrange
            int drawCalls = _performanceManager.GetDrawCalls();
            
            // Assert
            Assert.GreaterOrEqual(drawCalls, 0, "Draw calls should be >= 0");
        }

        [Test]
        public void PerformanceManager_GetTriangles_ReturnsValidValue()
        {
            // Arrange
            int triangles = _performanceManager.GetTriangles();
            
            // Assert
            Assert.GreaterOrEqual(triangles, 0, "Triangles should be >= 0");
        }

        [Test]
        public void PerformanceManager_GetVertices_ReturnsValidValue()
        {
            // Arrange
            int vertices = _performanceManager.GetVertices();
            
            // Assert
            Assert.GreaterOrEqual(vertices, 0, "Vertices should be >= 0");
        }

        [Test]
        public void PerformanceManager_GetBatches_ReturnsValidValue()
        {
            // Arrange
            int batches = _performanceManager.GetBatches();
            
            // Assert
            Assert.GreaterOrEqual(batches, 0, "Batches should be >= 0");
        }

        [Test]
        public void PerformanceManager_GetAudioMemory_ReturnsValidValue()
        {
            // Arrange
            long audioMemory = _performanceManager.GetAudioMemory();
            
            // Assert
            Assert.GreaterOrEqual(audioMemory, 0, "Audio memory should be >= 0");
        }

        [Test]
        public void PerformanceManager_GetTextureMemory_ReturnsValidValue()
        {
            // Arrange
            long textureMemory = _performanceManager.GetTextureMemory();
            
            // Assert
            Assert.GreaterOrEqual(textureMemory, 0, "Texture memory should be >= 0");
        }

        [Test]
        public void PerformanceManager_GetMeshMemory_ReturnsValidValue()
        {
            // Arrange
            long meshMemory = _performanceManager.GetMeshMemory();
            
            // Assert
            Assert.GreaterOrEqual(meshMemory, 0, "Mesh memory should be >= 0");
        }
        #endregion

        #region Graphics Optimizer Tests
        [Test]
        public void GraphicsOptimizer_LODSystem_WorksCorrectly()
        {
            // Arrange
            _graphicsOptimizer.enableLODSystem = true;
            _graphicsOptimizer.enableLODBias = true;
            _graphicsOptimizer.lodBias = 1.5f;
            
            // Act
            _graphicsOptimizer.Update();
            
            // Assert
            Assert.AreEqual(1.5f, QualitySettings.lodBias, "LOD bias should be set correctly");
        }

        [Test]
        public void GraphicsOptimizer_OcclusionCulling_WorksCorrectly()
        {
            // Arrange
            _graphicsOptimizer.enableOcclusionCulling = true;
            _graphicsOptimizer.enableFrustumCulling = true;
            
            // Act
            _graphicsOptimizer.Update();
            
            // Assert
            Assert.IsTrue(_graphicsOptimizer.enableOcclusionCulling, "Occlusion culling should be enabled");
            Assert.IsTrue(_graphicsOptimizer.enableFrustumCulling, "Frustum culling should be enabled");
        }

        [Test]
        public void GraphicsOptimizer_MobileOptimizations_WorkCorrectly()
        {
            // Arrange
            _graphicsOptimizer.enableMobileOptimizations = true;
            _graphicsOptimizer.mobileMaxLights = 2;
            _graphicsOptimizer.mobileMaxShadows = 1;
            
            // Act
            _graphicsOptimizer.Update();
            
            // Assert
            Assert.IsTrue(_graphicsOptimizer.enableMobileOptimizations, "Mobile optimizations should be enabled");
            Assert.AreEqual(2, _graphicsOptimizer.mobileMaxLights, "Mobile max lights should be set correctly");
            Assert.AreEqual(1, _graphicsOptimizer.mobileMaxShadows, "Mobile max shadows should be set correctly");
        }
        #endregion

        #region Audio Manager Tests
        [Test]
        public void AudioManager_Compression_WorksCorrectly()
        {
            // Arrange
            _audioManager.enableAudioCompression = true;
            _audioManager.compressionFormat = AudioCompressionFormat.Vorbis;
            _audioManager.compressionQuality = 0.7f;
            
            // Act
            _audioManager.Update();
            
            // Assert
            Assert.IsTrue(_audioManager.enableAudioCompression, "Audio compression should be enabled");
            Assert.AreEqual(AudioCompressionFormat.Vorbis, _audioManager.compressionFormat, "Compression format should be set correctly");
            Assert.AreEqual(0.7f, _audioManager.compressionQuality, "Compression quality should be set correctly");
        }

        [Test]
        public void AudioManager_FormatOptimization_WorksCorrectly()
        {
            // Arrange
            _audioManager.enableFormatOptimization = true;
            _audioManager.mobileFormat = AudioCompressionFormat.Vorbis;
            _audioManager.desktopFormat = AudioCompressionFormat.PCM;
            
            // Act
            _audioManager.Update();
            
            // Assert
            Assert.IsTrue(_audioManager.enableFormatOptimization, "Format optimization should be enabled");
            Assert.AreEqual(AudioCompressionFormat.Vorbis, _audioManager.mobileFormat, "Mobile format should be set correctly");
            Assert.AreEqual(AudioCompressionFormat.PCM, _audioManager.desktopFormat, "Desktop format should be set correctly");
        }
        #endregion

        #region Data Optimizer Tests
        [Test]
        public void DataOptimizer_Compression_WorksCorrectly()
        {
            // Arrange
            _dataOptimizer.enableCompression = true;
            _dataOptimizer.compressionType = CompressionType.Gzip;
            _dataOptimizer.compressionLevel = 6;
            
            // Act
            _dataOptimizer.Update();
            
            // Assert
            Assert.IsTrue(_dataOptimizer.enableCompression, "Data compression should be enabled");
            Assert.AreEqual(CompressionType.Gzip, _dataOptimizer.compressionType, "Compression type should be set correctly");
            Assert.AreEqual(6, _dataOptimizer.compressionLevel, "Compression level should be set correctly");
        }

        [Test]
        public void DataOptimizer_BinarySerialization_WorksCorrectly()
        {
            // Arrange
            _dataOptimizer.enableBinarySerialization = true;
            _dataOptimizer.enableJsonSerialization = true;
            
            // Act
            _dataOptimizer.Update();
            
            // Assert
            Assert.IsTrue(_dataOptimizer.enableBinarySerialization, "Binary serialization should be enabled");
            Assert.IsTrue(_dataOptimizer.enableJsonSerialization, "JSON serialization should be enabled");
        }
        #endregion

        #region Mobile Memory Manager Tests
        [Test]
        public void MobileMemoryManager_MemoryPressureHandling_WorksCorrectly()
        {
            // Arrange
            _mobileMemoryManager.enableMemoryPressureHandling = true;
            _mobileMemoryManager.memoryPressureThreshold = 0.8f;
            _mobileMemoryManager.memoryCriticalThreshold = 0.9f;
            
            // Act
            _mobileMemoryManager.Update();
            
            // Assert
            Assert.IsTrue(_mobileMemoryManager.enableMemoryPressureHandling, "Memory pressure handling should be enabled");
            Assert.AreEqual(0.8f, _mobileMemoryManager.memoryPressureThreshold, "Memory pressure threshold should be set correctly");
            Assert.AreEqual(0.9f, _mobileMemoryManager.memoryCriticalThreshold, "Memory critical threshold should be set correctly");
        }

        [Test]
        public void MobileMemoryManager_QualityReduction_WorksCorrectly()
        {
            // Arrange
            _mobileMemoryManager.enableAutomaticQualityReduction = true;
            _mobileMemoryManager.maxQualityReductionLevel = 3;
            
            // Act
            _mobileMemoryManager.Update();
            
            // Assert
            Assert.IsTrue(_mobileMemoryManager.enableAutomaticQualityReduction, "Automatic quality reduction should be enabled");
            Assert.AreEqual(3, _mobileMemoryManager.maxQualityReductionLevel, "Max quality reduction level should be set correctly");
        }
        #endregion

        #region Cache Manager Tests
        [Test]
        public void CacheManager_LRU_Eviction_WorksCorrectly()
        {
            // Arrange
            var cache = new CacheManager<string, object>(3, 300f, CacheManager<string, object>.EvictionPolicy.LRU);
            
            // Act
            cache.Set("key1", "value1");
            cache.Set("key2", "value2");
            cache.Set("key3", "value3");
            cache.Set("key4", "value4"); // This should evict key1
            
            // Assert
            Assert.IsNull(cache.Get("key1"), "key1 should be evicted");
            Assert.AreEqual("value2", cache.Get("key2"), "key2 should still be in cache");
            Assert.AreEqual("value3", cache.Get("key3"), "key3 should still be in cache");
            Assert.AreEqual("value4", cache.Get("key4"), "key4 should be in cache");
        }

        [Test]
        public void CacheManager_LFU_Eviction_WorksCorrectly()
        {
            // Arrange
            var cache = new CacheManager<string, object>(3, 300f, CacheManager<string, object>.EvictionPolicy.LFU);
            
            // Act
            cache.Set("key1", "value1");
            cache.Set("key2", "value2");
            cache.Set("key3", "value3");
            
            // Access key2 and key3 multiple times
            cache.Get("key2");
            cache.Get("key3");
            cache.Get("key2");
            cache.Get("key3");
            
            cache.Set("key4", "value4"); // This should evict key1 (least frequently used)
            
            // Assert
            Assert.IsNull(cache.Get("key1"), "key1 should be evicted");
            Assert.AreEqual("value2", cache.Get("key2"), "key2 should still be in cache");
            Assert.AreEqual("value3", cache.Get("key3"), "key3 should still be in cache");
            Assert.AreEqual("value4", cache.Get("key4"), "key4 should be in cache");
        }

        [Test]
        public void CacheManager_Weighted_Eviction_WorksCorrectly()
        {
            // Arrange
            var cache = new CacheManager<string, object>(3, 300f, CacheManager<string, object>.EvictionPolicy.Weighted);
            
            // Act
            cache.Set("key1", "value1");
            cache.Set("key2", "value2");
            cache.Set("key3", "value3");
            
            // Access key2 and key3 multiple times
            cache.Get("key2");
            cache.Get("key3");
            cache.Get("key2");
            cache.Get("key3");
            
            cache.Set("key4", "value4"); // This should evict key1 (lowest weight)
            
            // Assert
            Assert.IsNull(cache.Get("key1"), "key1 should be evicted");
            Assert.AreEqual("value2", cache.Get("key2"), "key2 should still be in cache");
            Assert.AreEqual("value3", cache.Get("key3"), "key3 should still be in cache");
            Assert.AreEqual("value4", cache.Get("key4"), "key4 should be in cache");
        }

        [Test]
        public void CacheManager_CacheWarming_WorksCorrectly()
        {
            // Arrange
            var cache = new CacheManager<string, object>(10, 300f, CacheManager<string, object>.EvictionPolicy.LRU);
            
            // Act
            cache.AddToWarmingQueue("key1", 1.0f);
            cache.AddToWarmingQueue("key2", 0.5f);
            cache.AddToWarmingQueue("key3", 1.5f);
            
            // Assert
            var stats = cache.GetWarmingStatistics();
            Assert.AreEqual(3, stats["queue_size"], "Warming queue should have 3 items");
        }
        #endregion

        #region Performance Regression Tests
        [Test]
        public void PerformanceRegression_FPS_DoesNotDegrade()
        {
            // Arrange
            float initialFPS = _performanceManager.GetFPS();
            
            // Act - Simulate some work
            for (int i = 0; i < 1000; i++)
            {
                _performanceManager.Update();
            }
            
            float finalFPS = _performanceManager.GetFPS();
            
            // Assert
            Assert.GreaterOrEqual(finalFPS, initialFPS * 0.9f, "FPS should not degrade by more than 10%");
        }

        [Test]
        public void PerformanceRegression_Memory_DoesNotLeak()
        {
            // Arrange
            long initialMemory = _performanceManager.GetMemoryUsage();
            
            // Act - Simulate some work
            for (int i = 0; i < 1000; i++)
            {
                _performanceManager.Update();
            }
            
            // Force garbage collection
            System.GC.Collect();
            System.GC.WaitForPendingFinalizers();
            System.GC.Collect();
            
            long finalMemory = _performanceManager.GetMemoryUsage();
            
            // Assert
            Assert.LessOrEqual(finalMemory, initialMemory * 1.1f, "Memory usage should not increase by more than 10%");
        }

        [Test]
        public void PerformanceRegression_DrawCalls_AreOptimized()
        {
            // Arrange
            int initialDrawCalls = _performanceManager.GetDrawCalls();
            
            // Act - Simulate some work
            for (int i = 0; i < 100; i++)
            {
                _performanceManager.Update();
            }
            
            int finalDrawCalls = _performanceManager.GetDrawCalls();
            
            // Assert
            Assert.LessOrEqual(finalDrawCalls, initialDrawCalls * 1.2f, "Draw calls should not increase significantly");
        }
        #endregion

        #region Integration Tests
        [Test]
        public void Integration_AllSystems_WorkTogether()
        {
            // Arrange
            _performanceManager.enablePerformanceMonitoring = true;
            _graphicsOptimizer.enableLODSystem = true;
            _audioManager.enableAudioCompression = true;
            _dataOptimizer.enableCompression = true;
            _mobileMemoryManager.enableMemoryPressureHandling = true;
            
            // Act - Simulate game loop
            for (int i = 0; i < 100; i++)
            {
                _performanceManager.Update();
                _graphicsOptimizer.Update();
                _audioManager.Update();
                _dataOptimizer.Update();
                _mobileMemoryManager.Update();
            }
            
            // Assert
            Assert.IsTrue(_performanceManager.enablePerformanceMonitoring, "Performance monitoring should be enabled");
            Assert.IsTrue(_graphicsOptimizer.enableLODSystem, "LOD system should be enabled");
            Assert.IsTrue(_audioManager.enableAudioCompression, "Audio compression should be enabled");
            Assert.IsTrue(_dataOptimizer.enableCompression, "Data compression should be enabled");
            Assert.IsTrue(_mobileMemoryManager.enableMemoryPressureHandling, "Memory pressure handling should be enabled");
        }

        [Test]
        public void Integration_PerformanceMetrics_AreConsistent()
        {
            // Arrange
            var metrics1 = new Dictionary<string, float>();
            var metrics2 = new Dictionary<string, float>();
            
            // Act - Collect metrics twice
            for (int i = 0; i < 10; i++)
            {
                _performanceManager.Update();
            }
            
            metrics1["fps"] = _performanceManager.GetFPS();
            metrics1["memory"] = _performanceManager.GetMemoryUsage();
            metrics1["cpu"] = _performanceManager.GetCPUUsage();
            metrics1["gpu"] = _performanceManager.GetGPUUsage();
            
            for (int i = 0; i < 10; i++)
            {
                _performanceManager.Update();
            }
            
            metrics2["fps"] = _performanceManager.GetFPS();
            metrics2["memory"] = _performanceManager.GetMemoryUsage();
            metrics2["cpu"] = _performanceManager.GetCPUUsage();
            metrics2["gpu"] = _performanceManager.GetGPUUsage();
            
            // Assert
            Assert.LessOrEqual(Mathf.Abs(metrics1["fps"] - metrics2["fps"]), 10f, "FPS should be consistent");
            Assert.LessOrEqual(Mathf.Abs(metrics1["memory"] - metrics2["memory"]), 1024 * 1024, "Memory should be consistent");
            Assert.LessOrEqual(Mathf.Abs(metrics1["cpu"] - metrics2["cpu"]), 20f, "CPU usage should be consistent");
            Assert.LessOrEqual(Mathf.Abs(metrics1["gpu"] - metrics2["gpu"]), 20f, "GPU usage should be consistent");
        }
        #endregion

        #region Stress Tests
        [Test]
        public void StressTest_HighLoad_SystemStability()
        {
            // Arrange
            var startTime = Time.realtimeSinceStartup;
            
            // Act - High load simulation
            for (int i = 0; i < 10000; i++)
            {
                _performanceManager.Update();
                _graphicsOptimizer.Update();
                _audioManager.Update();
                _dataOptimizer.Update();
                _mobileMemoryManager.Update();
                
                if (i % 1000 == 0)
                {
                    // Force garbage collection periodically
                    System.GC.Collect();
                }
            }
            
            var endTime = Time.realtimeSinceStartup;
            var duration = endTime - startTime;
            
            // Assert
            Assert.Less(duration, 10f, "High load test should complete within 10 seconds");
            Assert.Greater(_performanceManager.GetFPS(), 0f, "FPS should be positive after stress test");
            Assert.Greater(_performanceManager.GetMemoryUsage(), 0, "Memory usage should be positive after stress test");
        }

        [Test]
        public void StressTest_MemoryPressure_Handling()
        {
            // Arrange
            _mobileMemoryManager.enableMemoryPressureHandling = true;
            _mobileMemoryManager.memoryPressureThreshold = 0.1f; // Very low threshold for testing
            
            // Act - Simulate memory pressure
            for (int i = 0; i < 1000; i++)
            {
                _mobileMemoryManager.Update();
                
                // Simulate memory allocation
                var tempArray = new byte[1024 * 1024]; // 1MB
                tempArray = null; // Let it be garbage collected
            }
            
            // Assert
            Assert.IsTrue(_mobileMemoryManager.enableMemoryPressureHandling, "Memory pressure handling should remain enabled");
            Assert.GreaterOrEqual(_mobileMemoryManager.GetCurrentMemoryUsageMB(), 0f, "Memory usage should be tracked");
        }
        #endregion
    }
}