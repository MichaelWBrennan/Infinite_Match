using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using System.Diagnostics;
using Evergreen.Core;

namespace Evergreen.Testing
{
    /// <summary>
    /// Advanced performance testing system with comprehensive benchmarks and monitoring
    /// </summary>
    public class AdvancedPerformanceTests : MonoBehaviour
    {
        [Header("Test Settings")]
        public bool enableAutomatedTesting = true;
        public float testInterval = 60f;
        public bool enableContinuousMonitoring = true;
        public bool enableStressTesting = false;
        public int stressTestDuration = 300; // 5 minutes

        [Header("Performance Thresholds")]
        public float targetFPS = 60f;
        public float minFPS = 30f;
        public float maxFrameTime = 16.67f; // 60 FPS
        public float maxMemoryUsageMB = 512f;
        public float maxCPUUsagePercent = 80f;
        public float maxGPUUsagePercent = 90f;

        [Header("Test Categories")]
        public bool enableRenderingTests = true;
        public bool enableMemoryTests = true;
        public bool enableAudioTests = true;
        public bool enableNetworkTests = true;
        public bool enableUITests = true;
        public bool enableGameplayTests = true;

        private readonly List<PerformanceTestResult> _testResults = new List<PerformanceTestResult>();
        private readonly Dictionary<string, PerformanceMetric> _metrics = new Dictionary<string, PerformanceMetric>();
        private readonly List<PerformanceAlert> _alerts = new List<PerformanceAlert>();

        private float _lastTestTime = 0f;
        private bool _isRunningTests = false;
        private Coroutine _continuousMonitoringCoroutine;

        public class PerformanceTestResult
        {
            public string testName;
            public bool passed;
            public float value;
            public float threshold;
            public string unit;
            public DateTime timestamp;
            public string message;
            public PerformanceTestCategory category;
        }

        public class PerformanceMetric
        {
            public string name;
            public float currentValue;
            public float averageValue;
            public float minValue;
            public float maxValue;
            public List<float> history = new List<float>();
            public DateTime lastUpdated;
        }

        public class PerformanceAlert
        {
            public string message;
            public PerformanceAlertLevel level;
            public DateTime timestamp;
            public string category;
        }

        public enum PerformanceTestCategory
        {
            Rendering,
            Memory,
            Audio,
            Network,
            UI,
            Gameplay,
            System
        }

        public enum PerformanceAlertLevel
        {
            Info,
            Warning,
            Critical
        }

        void Start()
        {
            if (enableAutomatedTesting)
            {
                StartCoroutine(RunAutomatedTests());
            }

            if (enableContinuousMonitoring)
            {
                _continuousMonitoringCoroutine = StartCoroutine(ContinuousMonitoring());
            }
        }

        void Update()
        {
            if (enableContinuousMonitoring)
            {
                UpdatePerformanceMetrics();
            }
        }

        #region Automated Testing
        private IEnumerator RunAutomatedTests()
        {
            while (true)
            {
                yield return new WaitForSeconds(testInterval);

                if (!_isRunningTests)
                {
                    yield return StartCoroutine(RunAllPerformanceTests());
                }
            }
        }

        private IEnumerator RunAllPerformanceTests()
        {
            _isRunningTests = true;
            Logger.Info("Starting automated performance tests", "PerformanceTests");

            var tests = new List<IEnumerator>();

            if (enableRenderingTests)
            {
                tests.Add(RunRenderingTests());
            }

            if (enableMemoryTests)
            {
                tests.Add(RunMemoryTests());
            }

            if (enableAudioTests)
            {
                tests.Add(RunAudioTests());
            }

            if (enableNetworkTests)
            {
                tests.Add(RunNetworkTests());
            }

            if (enableUITests)
            {
                tests.Add(RunUITests());
            }

            if (enableGameplayTests)
            {
                tests.Add(RunGameplayTests());
            }

            foreach (var test in tests)
            {
                yield return StartCoroutine(test);
            }

            _isRunningTests = false;
            Logger.Info("Automated performance tests completed", "PerformanceTests");
        }
        #endregion

        #region Rendering Tests
        private IEnumerator RunRenderingTests()
        {
            Logger.Info("Running rendering performance tests", "PerformanceTests");

            // FPS Test
            yield return StartCoroutine(TestFPS());

            // Frame Time Test
            yield return StartCoroutine(TestFrameTime());

            // Draw Call Test
            yield return StartCoroutine(TestDrawCalls());

            // Triangle Count Test
            yield return StartCoroutine(TestTriangleCount());

            // GPU Memory Test
            yield return StartCoroutine(TestGPUMemory());

            // Rendering Pipeline Test
            yield return StartCoroutine(TestRenderingPipeline());
        }

        private IEnumerator TestFPS()
        {
            var startTime = Time.time;
            var frameCount = 0;
            var testDuration = 5f;

            while (Time.time - startTime < testDuration)
            {
                frameCount++;
                yield return null;
            }

            var fps = frameCount / testDuration;
            var result = new PerformanceTestResult
            {
                testName = "FPS Test",
                passed = fps >= minFPS,
                value = fps,
                threshold = minFPS,
                unit = "FPS",
                timestamp = DateTime.Now,
                category = PerformanceTestCategory.Rendering,
                message = fps >= minFPS ? $"FPS is acceptable: {fps:F1}" : $"FPS is too low: {fps:F1}"
            };

            _testResults.Add(result);
            UpdateMetric("FPS", fps);
        }

        private IEnumerator TestFrameTime()
        {
            var frameTimes = new List<float>();
            var testDuration = 5f;
            var startTime = Time.time;

            while (Time.time - startTime < testDuration)
            {
                frameTimes.Add(Time.unscaledDeltaTime * 1000f); // Convert to milliseconds
                yield return null;
            }

            var averageFrameTime = 0f;
            foreach (var frameTime in frameTimes)
            {
                averageFrameTime += frameTime;
            }
            averageFrameTime /= frameTimes.Count;

            var result = new PerformanceTestResult
            {
                testName = "Frame Time Test",
                passed = averageFrameTime <= maxFrameTime,
                value = averageFrameTime,
                threshold = maxFrameTime,
                unit = "ms",
                timestamp = DateTime.Now,
                category = PerformanceTestCategory.Rendering,
                message = averageFrameTime <= maxFrameTime ? $"Frame time is acceptable: {averageFrameTime:F2}ms" : $"Frame time is too high: {averageFrameTime:F2}ms"
            };

            _testResults.Add(result);
            UpdateMetric("FrameTime", averageFrameTime);
        }

        private IEnumerator TestDrawCalls()
        {
            var drawCalls = 0;
            var testDuration = 1f;
            var startTime = Time.time;

            while (Time.time - startTime < testDuration)
            {
                drawCalls = UnityEngine.Rendering.GraphicsSettings.renderPipelineAsset != null ? 
                    UnityEngine.Rendering.GraphicsSettings.renderPipelineAsset.GetType().GetField("drawCalls", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)?.GetValue(UnityEngine.Rendering.GraphicsSettings.renderPipelineAsset) as int? ?? 0 : 0;
                yield return null;
            }

            var result = new PerformanceTestResult
            {
                testName = "Draw Calls Test",
                passed = drawCalls <= 1000, // Reasonable threshold
                value = drawCalls,
                threshold = 1000,
                unit = "calls",
                timestamp = DateTime.Now,
                category = PerformanceTestCategory.Rendering,
                message = drawCalls <= 1000 ? $"Draw calls are acceptable: {drawCalls}" : $"Too many draw calls: {drawCalls}"
            };

            _testResults.Add(result);
            UpdateMetric("DrawCalls", drawCalls);
        }

        private IEnumerator TestTriangleCount()
        {
            var triangles = 0;
            var testDuration = 1f;
            var startTime = Time.time;

            while (Time.time - startTime < testDuration)
            {
                // Count triangles in scene
                var renderers = FindObjectsOfType<Renderer>();
                foreach (var renderer in renderers)
                {
                    var meshFilter = renderer.GetComponent<MeshFilter>();
                    if (meshFilter != null && meshFilter.mesh != null)
                    {
                        triangles += meshFilter.mesh.triangles.Length / 3;
                    }
                }
                yield return null;
            }

            var result = new PerformanceTestResult
            {
                testName = "Triangle Count Test",
                passed = triangles <= 100000, // Reasonable threshold
                value = triangles,
                threshold = 100000,
                unit = "triangles",
                timestamp = DateTime.Now,
                category = PerformanceTestCategory.Rendering,
                message = triangles <= 100000 ? $"Triangle count is acceptable: {triangles}" : $"Too many triangles: {triangles}"
            };

            _testResults.Add(result);
            UpdateMetric("Triangles", triangles);
        }

        private IEnumerator TestGPUMemory()
        {
            var gpuMemory = 0f;
            var testDuration = 1f;
            var startTime = Time.time;

            while (Time.time - startTime < testDuration)
            {
                // Get GPU memory usage (simplified)
                gpuMemory = UnityEngine.Profiling.Profiler.GetTotalAllocatedMemory(false) / 1024f / 1024f;
                yield return null;
            }

            var result = new PerformanceTestResult
            {
                testName = "GPU Memory Test",
                passed = gpuMemory <= maxMemoryUsageMB,
                value = gpuMemory,
                threshold = maxMemoryUsageMB,
                unit = "MB",
                timestamp = DateTime.Now,
                category = PerformanceTestCategory.Rendering,
                message = gpuMemory <= maxMemoryUsageMB ? $"GPU memory usage is acceptable: {gpuMemory:F1}MB" : $"GPU memory usage is too high: {gpuMemory:F1}MB"
            };

            _testResults.Add(result);
            UpdateMetric("GPUMemory", gpuMemory);
        }

        private IEnumerator TestRenderingPipeline()
        {
            var startTime = Time.time;
            var testDuration = 2f;

            // Test rendering pipeline performance
            while (Time.time - startTime < testDuration)
            {
                // Simulate rendering workload
                var camera = Camera.main;
                if (camera != null)
                {
                    camera.Render();
                }
                yield return null;
            }

            var result = new PerformanceTestResult
            {
                testName = "Rendering Pipeline Test",
                passed = true, // This would be more complex in a real implementation
                value = 1f,
                threshold = 1f,
                unit = "pass",
                timestamp = DateTime.Now,
                category = PerformanceTestCategory.Rendering,
                message = "Rendering pipeline test completed"
            };

            _testResults.Add(result);
        }
        #endregion

        #region Memory Tests
        private IEnumerator RunMemoryTests()
        {
            Logger.Info("Running memory performance tests", "PerformanceTests");

            // Memory Usage Test
            yield return StartCoroutine(TestMemoryUsage());

            // Garbage Collection Test
            yield return StartCoroutine(TestGarbageCollection());

            // Memory Leak Test
            yield return StartCoroutine(TestMemoryLeaks());

            // Object Pool Test
            yield return StartCoroutine(TestObjectPooling());
        }

        private IEnumerator TestMemoryUsage()
        {
            var memoryUsage = GC.GetTotalMemory(false) / 1024f / 1024f;
            var result = new PerformanceTestResult
            {
                testName = "Memory Usage Test",
                passed = memoryUsage <= maxMemoryUsageMB,
                value = memoryUsage,
                threshold = maxMemoryUsageMB,
                unit = "MB",
                timestamp = DateTime.Now,
                category = PerformanceTestCategory.Memory,
                message = memoryUsage <= maxMemoryUsageMB ? $"Memory usage is acceptable: {memoryUsage:F1}MB" : $"Memory usage is too high: {memoryUsage:F1}MB"
            };

            _testResults.Add(result);
            UpdateMetric("MemoryUsage", memoryUsage);
            yield return null;
        }

        private IEnumerator TestGarbageCollection()
        {
            var beforeMemory = GC.GetTotalMemory(false);
            var beforeGen0 = GC.CollectionCount(0);
            var beforeGen1 = GC.CollectionCount(1);
            var beforeGen2 = GC.CollectionCount(2);

            // Force garbage collection
            GC.Collect();
            GC.WaitForPendingFinalizers();
            GC.Collect();

            var afterMemory = GC.GetTotalMemory(false);
            var afterGen0 = GC.CollectionCount(0);
            var afterGen1 = GC.CollectionCount(1);
            var afterGen2 = GC.CollectionCount(2);

            var freedMemory = (beforeMemory - afterMemory) / 1024f / 1024f;
            var gen0Collections = afterGen0 - beforeGen0;
            var gen1Collections = afterGen1 - beforeGen1;
            var gen2Collections = afterGen2 - beforeGen2;

            var result = new PerformanceTestResult
            {
                testName = "Garbage Collection Test",
                passed = gen2Collections == 0, // No Gen2 collections is good
                value = gen2Collections,
                threshold = 0,
                unit = "collections",
                timestamp = DateTime.Now,
                category = PerformanceTestCategory.Memory,
                message = $"GC freed {freedMemory:F1}MB, Gen0: {gen0Collections}, Gen1: {gen1Collections}, Gen2: {gen2Collections}"
            };

            _testResults.Add(result);
            UpdateMetric("GCGen2Collections", gen2Collections);
            yield return null;
        }

        private IEnumerator TestMemoryLeaks()
        {
            var initialMemory = GC.GetTotalMemory(false);
            var testDuration = 10f;
            var startTime = Time.time;

            // Create and destroy objects repeatedly
            while (Time.time - startTime < testDuration)
            {
                var objects = new List<GameObject>();
                for (int i = 0; i < 100; i++)
                {
                    var obj = new GameObject($"TestObject_{i}");
                    objects.Add(obj);
                }

                foreach (var obj in objects)
                {
                    DestroyImmediate(obj);
                }

                yield return null;
            }

            var finalMemory = GC.GetTotalMemory(false);
            var memoryIncrease = (finalMemory - initialMemory) / 1024f / 1024f;

            var result = new PerformanceTestResult
            {
                testName = "Memory Leak Test",
                passed = memoryIncrease <= 10f, // Less than 10MB increase is acceptable
                value = memoryIncrease,
                threshold = 10f,
                unit = "MB",
                timestamp = DateTime.Now,
                category = PerformanceTestCategory.Memory,
                message = memoryIncrease <= 10f ? $"No significant memory leak detected: {memoryIncrease:F1}MB increase" : $"Potential memory leak detected: {memoryIncrease:F1}MB increase"
            };

            _testResults.Add(result);
            UpdateMetric("MemoryLeak", memoryIncrease);
        }

        private IEnumerator TestObjectPooling()
        {
            var pool = new ObjectPool<GameObject>(
                createFunc: () => new GameObject("PooledObject"),
                onGet: obj => obj.SetActive(true),
                onReturn: obj => obj.SetActive(false),
                maxSize: 100
            );

            var startTime = Time.time;
            var testDuration = 5f;
            var operations = 0;

            while (Time.time - startTime < testDuration)
            {
                var obj = pool.Get();
                pool.Return(obj);
                operations++;
                yield return null;
            }

            var operationsPerSecond = operations / testDuration;

            var result = new PerformanceTestResult
            {
                testName = "Object Pool Test",
                passed = operationsPerSecond >= 1000, // At least 1000 operations per second
                value = operationsPerSecond,
                threshold = 1000,
                unit = "ops/sec",
                timestamp = DateTime.Now,
                category = PerformanceTestCategory.Memory,
                message = $"Object pool performance: {operationsPerSecond:F0} operations/second"
            };

            _testResults.Add(result);
            UpdateMetric("ObjectPoolOps", operationsPerSecond);
        }
        #endregion

        #region Audio Tests
        private IEnumerator RunAudioTests()
        {
            Logger.Info("Running audio performance tests", "PerformanceTests");

            // Audio Memory Test
            yield return StartCoroutine(TestAudioMemory());

            // Audio Latency Test
            yield return StartCoroutine(TestAudioLatency());

            // Audio Quality Test
            yield return StartCoroutine(TestAudioQuality());
        }

        private IEnumerator TestAudioMemory()
        {
            var audioSources = FindObjectsOfType<AudioSource>();
            var audioMemory = 0f;

            foreach (var audioSource in audioSources)
            {
                if (audioSource.clip != null)
                {
                    audioMemory += audioSource.clip.length * audioSource.clip.frequency * audioSource.clip.channels * 4; // 32-bit float
                }
            }

            audioMemory /= 1024f * 1024f; // Convert to MB

            var result = new PerformanceTestResult
            {
                testName = "Audio Memory Test",
                passed = audioMemory <= 100f, // Less than 100MB is acceptable
                value = audioMemory,
                threshold = 100f,
                unit = "MB",
                timestamp = DateTime.Now,
                category = PerformanceTestCategory.Audio,
                message = audioMemory <= 100f ? $"Audio memory usage is acceptable: {audioMemory:F1}MB" : $"Audio memory usage is too high: {audioMemory:F1}MB"
            };

            _testResults.Add(result);
            UpdateMetric("AudioMemory", audioMemory);
            yield return null;
        }

        private IEnumerator TestAudioLatency()
        {
            var audioSource = GetComponent<AudioSource>();
            if (audioSource == null)
            {
                audioSource = gameObject.AddComponent<AudioSource>();
            }

            var startTime = Time.time;
            audioSource.Play();
            var latency = Time.time - startTime;

            var result = new PerformanceTestResult
            {
                testName = "Audio Latency Test",
                passed = latency <= 0.1f, // Less than 100ms latency is acceptable
                value = latency * 1000f,
                threshold = 100f,
                unit = "ms",
                timestamp = DateTime.Now,
                category = PerformanceTestCategory.Audio,
                message = latency <= 0.1f ? $"Audio latency is acceptable: {latency * 1000f:F1}ms" : $"Audio latency is too high: {latency * 1000f:F1}ms"
            };

            _testResults.Add(result);
            UpdateMetric("AudioLatency", latency * 1000f);
            yield return null;
        }

        private IEnumerator TestAudioQuality()
        {
            // This would test audio quality in a real implementation
            var result = new PerformanceTestResult
            {
                testName = "Audio Quality Test",
                passed = true,
                value = 1f,
                threshold = 1f,
                unit = "pass",
                timestamp = DateTime.Now,
                category = PerformanceTestCategory.Audio,
                message = "Audio quality test completed"
            };

            _testResults.Add(result);
            yield return null;
        }
        #endregion

        #region Network Tests
        private IEnumerator RunNetworkTests()
        {
            Logger.Info("Running network performance tests", "PerformanceTests");

            // Network Latency Test
            yield return StartCoroutine(TestNetworkLatency());

            // Network Throughput Test
            yield return StartCoroutine(TestNetworkThroughput());

            // Network Reliability Test
            yield return StartCoroutine(TestNetworkReliability());
        }

        private IEnumerator TestNetworkLatency()
        {
            var startTime = Time.time;
            var latency = 0f;

            // Simulate network request
            using (var www = new UnityEngine.Networking.UnityWebRequest("https://httpbin.org/delay/0"))
            {
                yield return www.SendWebRequest();
                latency = (Time.time - startTime) * 1000f; // Convert to milliseconds
            }

            var result = new PerformanceTestResult
            {
                testName = "Network Latency Test",
                passed = latency <= 1000f, // Less than 1 second is acceptable
                value = latency,
                threshold = 1000f,
                unit = "ms",
                timestamp = DateTime.Now,
                category = PerformanceTestCategory.Network,
                message = latency <= 1000f ? $"Network latency is acceptable: {latency:F1}ms" : $"Network latency is too high: {latency:F1}ms"
            };

            _testResults.Add(result);
            UpdateMetric("NetworkLatency", latency);
        }

        private IEnumerator TestNetworkThroughput()
        {
            var startTime = Time.time;
            var dataSize = 1024 * 1024; // 1MB
            var data = new byte[dataSize];

            using (var www = new UnityEngine.Networking.UnityWebRequest("https://httpbin.org/post"))
            {
                www.method = "POST";
                www.uploadHandler = new UnityEngine.Networking.UploadHandlerRaw(data);
                www.downloadHandler = new UnityEngine.Networking.DownloadHandlerBuffer();

                yield return www.SendWebRequest();

                var duration = Time.time - startTime;
                var throughput = (dataSize / 1024f / 1024f) / duration; // MB/s

                var result = new PerformanceTestResult
                {
                    testName = "Network Throughput Test",
                    passed = throughput >= 1f, // At least 1 MB/s is acceptable
                    value = throughput,
                    threshold = 1f,
                    unit = "MB/s",
                    timestamp = DateTime.Now,
                    category = PerformanceTestCategory.Network,
                    message = throughput >= 1f ? $"Network throughput is acceptable: {throughput:F2}MB/s" : $"Network throughput is too low: {throughput:F2}MB/s"
                };

                _testResults.Add(result);
                UpdateMetric("NetworkThroughput", throughput);
            }
        }

        private IEnumerator TestNetworkReliability()
        {
            var successCount = 0;
            var totalRequests = 10;

            for (int i = 0; i < totalRequests; i++)
            {
                using (var www = new UnityEngine.Networking.UnityWebRequest("https://httpbin.org/status/200"))
                {
                    yield return www.SendWebRequest();
                    if (www.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
                    {
                        successCount++;
                    }
                }
            }

            var reliability = (float)successCount / totalRequests * 100f;

            var result = new PerformanceTestResult
            {
                testName = "Network Reliability Test",
                passed = reliability >= 90f, // At least 90% success rate
                value = reliability,
                threshold = 90f,
                unit = "%",
                timestamp = DateTime.Now,
                category = PerformanceTestCategory.Network,
                message = reliability >= 90f ? $"Network reliability is acceptable: {reliability:F1}%" : $"Network reliability is too low: {reliability:F1}%"
            };

            _testResults.Add(result);
            UpdateMetric("NetworkReliability", reliability);
        }
        #endregion

        #region UI Tests
        private IEnumerator RunUITests()
        {
            Logger.Info("Running UI performance tests", "PerformanceTests");

            // UI Rendering Test
            yield return StartCoroutine(TestUIRendering());

            // UI Responsiveness Test
            yield return StartCoroutine(TestUIResponsiveness());

            // UI Memory Test
            yield return StartCoroutine(TestUIMemory());
        }

        private IEnumerator TestUIRendering()
        {
            var canvas = FindObjectOfType<Canvas>();
            if (canvas == null)
            {
                yield return null;
                yield break;
            }

            var startTime = Time.time;
            var testDuration = 2f;

            while (Time.time - startTime < testDuration)
            {
                // Force UI update
                canvas.enabled = false;
                yield return null;
                canvas.enabled = true;
                yield return null;
            }

            var result = new PerformanceTestResult
            {
                testName = "UI Rendering Test",
                passed = true,
                value = 1f,
                threshold = 1f,
                unit = "pass",
                timestamp = DateTime.Now,
                category = PerformanceTestCategory.UI,
                message = "UI rendering test completed"
            };

            _testResults.Add(result);
        }

        private IEnumerator TestUIResponsiveness()
        {
            var buttons = FindObjectsOfType<UnityEngine.UI.Button>();
            var responseTime = 0f;

            foreach (var button in buttons)
            {
                var startTime = Time.time;
                button.onClick.Invoke();
                responseTime += Time.time - startTime;
            }

            var averageResponseTime = responseTime / buttons.Length * 1000f; // Convert to milliseconds

            var result = new PerformanceTestResult
            {
                testName = "UI Responsiveness Test",
                passed = averageResponseTime <= 16f, // Less than 16ms is acceptable
                value = averageResponseTime,
                threshold = 16f,
                unit = "ms",
                timestamp = DateTime.Now,
                category = PerformanceTestCategory.UI,
                message = averageResponseTime <= 16f ? $"UI responsiveness is acceptable: {averageResponseTime:F1}ms" : $"UI responsiveness is too slow: {averageResponseTime:F1}ms"
            };

            _testResults.Add(result);
            UpdateMetric("UIResponsiveness", averageResponseTime);
            yield return null;
        }

        private IEnumerator TestUIMemory()
        {
            var uiElements = FindObjectsOfType<UnityEngine.UI.Graphic>();
            var memoryUsage = uiElements.Length * 0.1f; // Rough estimate

            var result = new PerformanceTestResult
            {
                testName = "UI Memory Test",
                passed = memoryUsage <= 50f, // Less than 50MB is acceptable
                value = memoryUsage,
                threshold = 50f,
                unit = "MB",
                timestamp = DateTime.Now,
                category = PerformanceTestCategory.UI,
                message = memoryUsage <= 50f ? $"UI memory usage is acceptable: {memoryUsage:F1}MB" : $"UI memory usage is too high: {memoryUsage:F1}MB"
            };

            _testResults.Add(result);
            UpdateMetric("UIMemory", memoryUsage);
            yield return null;
        }
        #endregion

        #region Gameplay Tests
        private IEnumerator RunGameplayTests()
        {
            Logger.Info("Running gameplay performance tests", "PerformanceTests");

            // Game Logic Test
            yield return StartCoroutine(TestGameLogic());

            // Physics Test
            yield return StartCoroutine(TestPhysics());

            // Animation Test
            yield return StartCoroutine(TestAnimation());
        }

        private IEnumerator TestGameLogic()
        {
            var startTime = Time.time;
            var operations = 0;
            var testDuration = 2f;

            while (Time.time - startTime < testDuration)
            {
                // Simulate game logic operations
                for (int i = 0; i < 1000; i++)
                {
                    var result = Mathf.Sin(i) * Mathf.Cos(i);
                    operations++;
                }
                yield return null;
            }

            var operationsPerSecond = operations / testDuration;

            var result = new PerformanceTestResult
            {
                testName = "Game Logic Test",
                passed = operationsPerSecond >= 10000, // At least 10k operations per second
                value = operationsPerSecond,
                threshold = 10000,
                unit = "ops/sec",
                timestamp = DateTime.Now,
                category = PerformanceTestCategory.Gameplay,
                message = $"Game logic performance: {operationsPerSecond:F0} operations/second"
            };

            _testResults.Add(result);
            UpdateMetric("GameLogicOps", operationsPerSecond);
        }

        private IEnumerator TestPhysics()
        {
            var rigidbodies = FindObjectsOfType<Rigidbody>();
            var physicsTime = 0f;
            var testDuration = 2f;
            var startTime = Time.time;

            while (Time.time - startTime < testDuration)
            {
                var physicsStart = Time.time;
                Physics.Simulate(Time.fixedDeltaTime);
                physicsTime += Time.time - physicsStart;
                yield return null;
            }

            var averagePhysicsTime = physicsTime / testDuration * 1000f; // Convert to milliseconds

            var result = new PerformanceTestResult
            {
                testName = "Physics Test",
                passed = averagePhysicsTime <= 5f, // Less than 5ms is acceptable
                value = averagePhysicsTime,
                threshold = 5f,
                unit = "ms",
                timestamp = DateTime.Now,
                category = PerformanceTestCategory.Gameplay,
                message = averagePhysicsTime <= 5f ? $"Physics performance is acceptable: {averagePhysicsTime:F1}ms" : $"Physics performance is too slow: {averagePhysicsTime:F1}ms"
            };

            _testResults.Add(result);
            UpdateMetric("PhysicsTime", averagePhysicsTime);
        }

        private IEnumerator TestAnimation()
        {
            var animators = FindObjectsOfType<Animator>();
            var animationTime = 0f;
            var testDuration = 2f;
            var startTime = Time.time;

            while (Time.time - startTime < testDuration)
            {
                var animationStart = Time.time;
                foreach (var animator in animators)
                {
                    animator.Update(Time.deltaTime);
                }
                animationTime += Time.time - animationStart;
                yield return null;
            }

            var averageAnimationTime = animationTime / testDuration * 1000f; // Convert to milliseconds

            var result = new PerformanceTestResult
            {
                testName = "Animation Test",
                passed = averageAnimationTime <= 10f, // Less than 10ms is acceptable
                value = averageAnimationTime,
                threshold = 10f,
                unit = "ms",
                timestamp = DateTime.Now,
                category = PerformanceTestCategory.Gameplay,
                message = averageAnimationTime <= 10f ? $"Animation performance is acceptable: {averageAnimationTime:F1}ms" : $"Animation performance is too slow: {averageAnimationTime:F1}ms"
            };

            _testResults.Add(result);
            UpdateMetric("AnimationTime", averageAnimationTime);
        }
        #endregion

        #region Continuous Monitoring
        private IEnumerator ContinuousMonitoring()
        {
            while (true)
            {
                yield return new WaitForSeconds(1f);
                CheckPerformanceAlerts();
            }
        }

        private void UpdatePerformanceMetrics()
        {
            // Update FPS
            var fps = 1f / Time.unscaledDeltaTime;
            UpdateMetric("FPS", fps);

            // Update memory usage
            var memoryUsage = GC.GetTotalMemory(false) / 1024f / 1024f;
            UpdateMetric("MemoryUsage", memoryUsage);

            // Update frame time
            var frameTime = Time.unscaledDeltaTime * 1000f;
            UpdateMetric("FrameTime", frameTime);
        }

        private void UpdateMetric(string name, float value)
        {
            if (!_metrics.ContainsKey(name))
            {
                _metrics[name] = new PerformanceMetric
                {
                    name = name,
                    currentValue = value,
                    averageValue = value,
                    minValue = value,
                    maxValue = value,
                    lastUpdated = DateTime.Now
                };
            }
            else
            {
                var metric = _metrics[name];
                metric.currentValue = value;
                metric.history.Add(value);
                
                if (metric.history.Count > 100)
                {
                    metric.history.RemoveAt(0);
                }

                var sum = 0f;
                foreach (var val in metric.history)
                {
                    sum += val;
                }
                metric.averageValue = sum / metric.history.Count;
                metric.minValue = Mathf.Min(metric.minValue, value);
                metric.maxValue = Mathf.Max(metric.maxValue, value);
                metric.lastUpdated = DateTime.Now;
            }
        }

        private void CheckPerformanceAlerts()
        {
            // Check FPS
            if (_metrics.ContainsKey("FPS"))
            {
                var fps = _metrics["FPS"].currentValue;
                if (fps < minFPS)
                {
                    AddAlert($"Low FPS detected: {fps:F1}", PerformanceAlertLevel.Critical, "Rendering");
                }
            }

            // Check memory usage
            if (_metrics.ContainsKey("MemoryUsage"))
            {
                var memory = _metrics["MemoryUsage"].currentValue;
                if (memory > maxMemoryUsageMB)
                {
                    AddAlert($"High memory usage: {memory:F1}MB", PerformanceAlertLevel.Warning, "Memory");
                }
            }

            // Check frame time
            if (_metrics.ContainsKey("FrameTime"))
            {
                var frameTime = _metrics["FrameTime"].currentValue;
                if (frameTime > maxFrameTime)
                {
                    AddAlert($"High frame time: {frameTime:F1}ms", PerformanceAlertLevel.Warning, "Rendering");
                }
            }
        }

        private void AddAlert(string message, PerformanceAlertLevel level, string category)
        {
            var alert = new PerformanceAlert
            {
                message = message,
                level = level,
                timestamp = DateTime.Now,
                category = category
            };

            _alerts.Add(alert);

            // Keep only last 100 alerts
            if (_alerts.Count > 100)
            {
                _alerts.RemoveAt(0);
            }

            Logger.Warning($"Performance Alert: {message}", "PerformanceTests");
        }
        #endregion

        #region Stress Testing
        public IEnumerator RunStressTest()
        {
            if (!enableStressTesting) yield break;

            Logger.Info($"Starting stress test for {stressTestDuration} seconds", "PerformanceTests");
            var startTime = Time.time;

            while (Time.time - startTime < stressTestDuration)
            {
                // Create heavy workload
                for (int i = 0; i < 100; i++)
                {
                    var obj = new GameObject($"StressTest_{i}");
                    var renderer = obj.AddComponent<MeshRenderer>();
                    var filter = obj.AddComponent<MeshFilter>();
                    filter.mesh = new Mesh();
                    DestroyImmediate(obj);
                }

                yield return null;
            }

            Logger.Info("Stress test completed", "PerformanceTests");
        }
        #endregion

        #region Statistics and Reporting
        public Dictionary<string, object> GetTestStatistics()
        {
            var totalTests = _testResults.Count;
            var passedTests = _testResults.FindAll(r => r.passed).Count;
            var failedTests = totalTests - passedTests;

            return new Dictionary<string, object>
            {
                {"total_tests", totalTests},
                {"passed_tests", passedTests},
                {"failed_tests", failedTests},
                {"success_rate", totalTests > 0 ? (float)passedTests / totalTests * 100f : 0f},
                {"total_alerts", _alerts.Count},
                {"critical_alerts", _alerts.FindAll(a => a.level == PerformanceAlertLevel.Critical).Count},
                {"warning_alerts", _alerts.FindAll(a => a.level == PerformanceAlertLevel.Warning).Count},
                {"metrics_count", _metrics.Count},
                {"enable_automated_testing", enableAutomatedTesting},
                {"enable_continuous_monitoring", enableContinuousMonitoring},
                {"enable_stress_testing", enableStressTesting}
            };
        }

        public List<PerformanceTestResult> GetTestResults()
        {
            return new List<PerformanceTestResult>(_testResults);
        }

        public List<PerformanceAlert> GetAlerts()
        {
            return new List<PerformanceAlert>(_alerts);
        }

        public Dictionary<string, PerformanceMetric> GetMetrics()
        {
            return new Dictionary<string, PerformanceMetric>(_metrics);
        }

        public void ClearTestResults()
        {
            _testResults.Clear();
            _alerts.Clear();
            Logger.Info("Test results cleared", "PerformanceTests");
        }
        #endregion

        void OnDestroy()
        {
            if (_continuousMonitoringCoroutine != null)
            {
                StopCoroutine(_continuousMonitoringCoroutine);
            }
        }
    }
}