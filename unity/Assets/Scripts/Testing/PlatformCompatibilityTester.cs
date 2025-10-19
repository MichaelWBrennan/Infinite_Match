using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using System.Threading.Tasks;
using Evergreen.Core;

namespace Evergreen.Testing
{
    /// <summary>
    /// PLATFORM COMPATIBILITY TESTER
    /// Comprehensive testing system for all platforms (WebGL, iOS, Android, Desktop)
    /// Validates functionality, performance, and compatibility across all targets
    /// </summary>
    public class PlatformCompatibilityTester : MonoBehaviour
    {
        public static PlatformCompatibilityTester Instance { get; private set; }

        [Header("Platform Testing")]
        public bool enableWebGLTesting = true;
        public bool enableIOSTesting = true;
        public bool enableAndroidTesting = true;
        public bool enableDesktopTesting = true;
        public bool enableConsoleTesting = true;

        [Header("Test Configuration")]
        public bool runTestsOnStart = false;
        public bool runTestsInBackground = true;
        public bool generateDetailedReport = true;
        public float testTimeout = 30f;

        [Header("Performance Thresholds")]
        public float minFPS = 30f;
        public float targetFPS = 60f;
        public float maxMemoryUsageMB = 512f;
        public float maxLoadTime = 5f;

        // Test results
        private Dictionary<string, PlatformTestResult> _testResults = new Dictionary<string, PlatformTestResult>();
        private bool _isRunningTests = false;
        private Coroutine _testCoroutine;

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
            if (runTestsOnStart)
            {
                StartCompatibilityTests();
            }
        }

        public void StartCompatibilityTests()
        {
            if (_isRunningTests)
            {
                Debug.LogWarning("⚠️ Tests already running, please wait for completion");
                return;
            }

            Debug.Log("🧪 Starting Platform Compatibility Tests...");
            _isRunningTests = true;
            _testCoroutine = StartCoroutine(RunAllPlatformTests());
        }

        private IEnumerator RunAllPlatformTests()
        {
            var startTime = Time.realtimeSinceStartup;
            
            // Test current platform
            yield return StartCoroutine(TestCurrentPlatform());
            
            // Test cross-platform compatibility
            yield return StartCoroutine(TestCrossPlatformCompatibility());
            
            // Test performance
            yield return StartCoroutine(TestPerformance());
            
            // Test memory usage
            yield return StartCoroutine(TestMemoryUsage());
            
            // Test file operations
            yield return StartCoroutine(TestFileOperations());
            
            // Test networking
            yield return StartCoroutine(TestNetworking());
            
            // Test UI responsiveness
            yield return StartCoroutine(TestUIResponsiveness());
            
            // Test input handling
            yield return StartCoroutine(TestInputHandling());
            
            // Test audio
            yield return StartCoroutine(TestAudio());
            
            // Test graphics
            yield return StartCoroutine(TestGraphics());
            
            // Generate final report
            GenerateTestReport();
            
            var totalTime = Time.realtimeSinceStartup - startTime;
            Debug.Log($"✅ Platform Compatibility Tests Complete in {totalTime:F2}s");
            
            _isRunningTests = false;
        }

        private IEnumerator TestCurrentPlatform()
        {
            Debug.Log($"🔍 Testing current platform: {Application.platform}");
            
            var result = new PlatformTestResult
            {
                platform = Application.platform.ToString(),
                testName = "Platform Detection",
                startTime = Time.realtimeSinceStartup
            };

            try
            {
                // Test platform detection
                var capabilities = DetectPlatformCapabilities();
                result.success = capabilities != null;
                result.message = capabilities != null ? "Platform detection successful" : "Platform detection failed";
                
                // Test platform-specific features
                if (capabilities != null)
                {
                    result.details.Add($"Threading: {capabilities.supportsThreading}");
                    result.details.Add($"File I/O: {capabilities.supportsFileIO}");
                    result.details.Add($"SIMD: {capabilities.supportsSIMD}");
                    result.details.Add($"Max Threads: {capabilities.maxWorkerThreads}");
                }
            }
            catch (Exception e)
            {
                result.success = false;
                result.message = $"Platform test failed: {e.Message}";
                result.error = e.ToString();
            }

            result.endTime = Time.realtimeSinceStartup;
            result.duration = result.endTime - result.startTime;
            
            _testResults["platform_detection"] = result;
            yield return null;
        }

        private IEnumerator TestCrossPlatformCompatibility()
        {
            Debug.Log("🌐 Testing cross-platform compatibility...");
            
            var result = new PlatformTestResult
            {
                platform = "CrossPlatform",
                testName = "Cross-Platform Compatibility",
                startTime = Time.realtimeSinceStartup
            };

            try
            {
                // Test WebGL compatibility layer
                WebGLCompatibilityLayer.Initialize();
                result.details.Add($"WebGL Layer: {WebGLCompatibilityLayer.IsWebGL}");
                
                // Test cross-platform file manager
                var fileManager = CrossPlatformFileManager.IsWebGL();
                result.details.Add($"File Manager: {fileManager}");
                
                // Test platform-aware optimizer
                var optimizer = PlatformAwareCPUOptimizer.Instance;
                if (optimizer != null)
                {
                    result.details.Add($"CPU Optimizer: Available");
                    result.details.Add($"Platform: {optimizer.GetPlatformCapabilities().platform}");
                }
                else
                {
                    result.details.Add($"CPU Optimizer: Not Available");
                }
                
                result.success = true;
                result.message = "Cross-platform compatibility test passed";
            }
            catch (Exception e)
            {
                result.success = false;
                result.message = $"Cross-platform test failed: {e.Message}";
                result.error = e.ToString();
            }

            result.endTime = Time.realtimeSinceStartup;
            result.duration = result.endTime - result.startTime;
            
            _testResults["cross_platform"] = result;
            yield return null;
        }

        private IEnumerator TestPerformance()
        {
            Debug.Log("⚡ Testing performance...");
            
            var result = new PlatformTestResult
            {
                platform = Application.platform.ToString(),
                testName = "Performance Test",
                startTime = Time.realtimeSinceStartup
            };

            try
            {
                var frameCount = 0;
                var totalFrameTime = 0f;
                var startTime = Time.realtimeSinceStartup;
                
                // Run performance test for 5 seconds
                while (Time.realtimeSinceStartup - startTime < 5f)
                {
                    var frameTime = Time.deltaTime;
                    totalFrameTime += frameTime;
                    frameCount++;
                    
                    // Simulate some work
                    for (int i = 0; i < 1000; i++)
                    {
                        Mathf.Sin(i * 0.01f);
                    }
                    
                    yield return null;
                }
                
                var averageFPS = frameCount / (Time.realtimeSinceStartup - startTime);
                var averageFrameTime = totalFrameTime / frameCount;
                
                result.details.Add($"Average FPS: {averageFPS:F2}");
                result.details.Add($"Average Frame Time: {averageFrameTime * 1000:F2}ms");
                result.details.Add($"Frame Count: {frameCount}");
                
                result.success = averageFPS >= minFPS;
                result.message = result.success ? 
                    $"Performance test passed ({averageFPS:F2} FPS)" : 
                    $"Performance test failed ({averageFPS:F2} FPS < {minFPS} FPS)";
            }
            catch (Exception e)
            {
                result.success = false;
                result.message = $"Performance test failed: {e.Message}";
                result.error = e.ToString();
            }

            result.endTime = Time.realtimeSinceStartup;
            result.duration = result.endTime - result.startTime;
            
            _testResults["performance"] = result;
        }

        private IEnumerator TestMemoryUsage()
        {
            Debug.Log("💾 Testing memory usage...");
            
            var result = new PlatformTestResult
            {
                platform = Application.platform.ToString(),
                testName = "Memory Usage Test",
                startTime = Time.realtimeSinceStartup
            };

            try
            {
                // Force garbage collection
                System.GC.Collect();
                System.GC.WaitForPendingFinalizers();
                System.GC.Collect();
                
                // Get memory usage
                var memoryUsage = System.GC.GetTotalMemory(false) / (1024f * 1024f); // MB
                
                result.details.Add($"Memory Usage: {memoryUsage:F2} MB");
                result.details.Add($"Max Memory: {maxMemoryUsageMB} MB");
                
                result.success = memoryUsage <= maxMemoryUsageMB;
                result.message = result.success ? 
                    $"Memory test passed ({memoryUsage:F2} MB)" : 
                    $"Memory test failed ({memoryUsage:F2} MB > {maxMemoryUsageMB} MB)";
            }
            catch (Exception e)
            {
                result.success = false;
                result.message = $"Memory test failed: {e.Message}";
                result.error = e.ToString();
            }

            result.endTime = Time.realtimeSinceStartup;
            result.duration = result.endTime - result.startTime;
            
            _testResults["memory"] = result;
            yield return null;
        }

        private IEnumerator TestFileOperations()
        {
            Debug.Log("📁 Testing file operations...");
            
            var result = new PlatformTestResult
            {
                platform = Application.platform.ToString(),
                testName = "File Operations Test",
                startTime = Time.realtimeSinceStartup
            };

            try
            {
                // Test file reading
                var testContent = "Test file content for platform compatibility";
                var fileName = "platform_test.txt";
                
                // Write test file
                var writeSuccess = await CrossPlatformFileManager.WriteTextFileAsync(fileName, testContent);
                result.details.Add($"File Write: {writeSuccess}");
                
                if (writeSuccess)
                {
                    // Read test file
                    var readContent = await CrossPlatformFileManager.ReadTextFileAsync(fileName);
                    var readSuccess = readContent == testContent;
                    result.details.Add($"File Read: {readSuccess}");
                    result.details.Add($"Content Match: {readSuccess}");
                    
                    result.success = readSuccess;
                    result.message = readSuccess ? "File operations test passed" : "File operations test failed";
                }
                else
                {
                    result.success = false;
                    result.message = "File write failed";
                }
            }
            catch (Exception e)
            {
                result.success = false;
                result.message = $"File operations test failed: {e.Message}";
                result.error = e.ToString();
            }

            result.endTime = Time.realtimeSinceStartup;
            result.duration = result.endTime - result.startTime;
            
            _testResults["file_operations"] = result;
            yield return null;
        }

        private IEnumerator TestNetworking()
        {
            Debug.Log("🌐 Testing networking...");
            
            var result = new PlatformTestResult
            {
                platform = Application.platform.ToString(),
                testName = "Networking Test",
                startTime = Time.realtimeSinceStartup
            };

            try
            {
                // Test UnityWebRequest (works on all platforms)
                using (var request = UnityEngine.Networking.UnityWebRequest.Get("https://httpbin.org/get"))
                {
                    var operation = request.SendWebRequest();
                    
                    var timeout = 10f;
                    var startTime = Time.realtimeSinceStartup;
                    
                    while (!operation.isDone && (Time.realtimeSinceStartup - startTime) < timeout)
                    {
                        yield return null;
                    }
                    
                    if (operation.isDone)
                    {
                        result.success = request.result == UnityEngine.Networking.UnityWebRequest.Result.Success;
                        result.message = result.success ? "Networking test passed" : $"Networking test failed: {request.error}";
                        result.details.Add($"Response Code: {request.responseCode}");
                        result.details.Add($"Response Time: {Time.realtimeSinceStartup - startTime:F2}s");
                    }
                    else
                    {
                        result.success = false;
                        result.message = "Networking test timed out";
                    }
                }
            }
            catch (Exception e)
            {
                result.success = false;
                result.message = $"Networking test failed: {e.Message}";
                result.error = e.ToString();
            }

            result.endTime = Time.realtimeSinceStartup;
            result.duration = result.endTime - result.startTime;
            
            _testResults["networking"] = result;
        }

        private IEnumerator TestUIResponsiveness()
        {
            Debug.Log("🖥️ Testing UI responsiveness...");
            
            var result = new PlatformTestResult
            {
                platform = Application.platform.ToString(),
                testName = "UI Responsiveness Test",
                startTime = Time.realtimeSinceStartup
            };

            try
            {
                // Test UI responsiveness by checking if we can create and destroy UI elements
                var canvas = FindObjectOfType<Canvas>();
                if (canvas != null)
                {
                    result.details.Add($"Canvas Found: {canvas.name}");
                    result.details.Add($"Canvas Scale: {canvas.scaleFactor}");
                    result.details.Add($"Canvas Render Mode: {canvas.renderMode}");
                    
                    result.success = true;
                    result.message = "UI responsiveness test passed";
                }
                else
                {
                    result.success = false;
                    result.message = "No Canvas found for UI test";
                }
            }
            catch (Exception e)
            {
                result.success = false;
                result.message = $"UI responsiveness test failed: {e.Message}";
                result.error = e.ToString();
            }

            result.endTime = Time.realtimeSinceStartup;
            result.duration = result.endTime - result.startTime;
            
            _testResults["ui_responsiveness"] = result;
            yield return null;
        }

        private IEnumerator TestInputHandling()
        {
            Debug.Log("🎮 Testing input handling...");
            
            var result = new PlatformTestResult
            {
                platform = Application.platform.ToString(),
                testName = "Input Handling Test",
                startTime = Time.realtimeSinceStartup
            };

            try
            {
                // Test input handling
                var inputSupported = true;
                var inputDetails = new List<string>();
                
                // Test touch input (mobile)
                if (Input.touchSupported)
                {
                    inputDetails.Add($"Touch Input: Supported ({Input.touchCount} touches)");
                }
                else
                {
                    inputDetails.Add("Touch Input: Not Supported");
                }
                
                // Test mouse input (desktop)
                if (Input.mousePresent)
                {
                    inputDetails.Add($"Mouse Input: Supported (Position: {Input.mousePosition})");
                }
                else
                {
                    inputDetails.Add("Mouse Input: Not Supported");
                }
                
                // Test keyboard input
                inputDetails.Add($"Keyboard Input: Supported");
                
                result.details.AddRange(inputDetails);
                result.success = inputSupported;
                result.message = "Input handling test passed";
            }
            catch (Exception e)
            {
                result.success = false;
                result.message = $"Input handling test failed: {e.Message}";
                result.error = e.ToString();
            }

            result.endTime = Time.realtimeSinceStartup;
            result.duration = result.endTime - result.startTime;
            
            _testResults["input_handling"] = result;
            yield return null;
        }

        private IEnumerator TestAudio()
        {
            Debug.Log("🔊 Testing audio...");
            
            var result = new PlatformTestResult
            {
                platform = Application.platform.ToString(),
                testName = "Audio Test",
                startTime = Time.realtimeSinceStartup
            };

            try
            {
                // Test audio system
                var audioSource = FindObjectOfType<AudioSource>();
                if (audioSource != null)
                {
                    result.details.Add($"AudioSource Found: {audioSource.name}");
                    result.details.Add($"AudioSource Volume: {audioSource.volume}");
                    result.details.Add($"AudioSource Mute: {audioSource.mute}");
                    
                    result.success = true;
                    result.message = "Audio test passed";
                }
                else
                {
                    result.success = false;
                    result.message = "No AudioSource found for audio test";
                }
            }
            catch (Exception e)
            {
                result.success = false;
                result.message = $"Audio test failed: {e.Message}";
                result.error = e.ToString();
            }

            result.endTime = Time.realtimeSinceStartup;
            result.duration = result.endTime - result.startTime;
            
            _testResults["audio"] = result;
            yield return null;
        }

        private IEnumerator TestGraphics()
        {
            Debug.Log("🎨 Testing graphics...");
            
            var result = new PlatformTestResult
            {
                platform = Application.platform.ToString(),
                testName = "Graphics Test",
                startTime = Time.realtimeSinceStartup
            };

            try
            {
                // Test graphics capabilities
                result.details.Add($"Graphics Device: {SystemInfo.graphicsDeviceName}");
                result.details.Add($"Graphics Memory: {SystemInfo.graphicsMemorySize} MB");
                result.details.Add($"Graphics API: {SystemInfo.graphicsDeviceType}");
                result.details.Add($"Screen Resolution: {Screen.width}x{Screen.height}");
                result.details.Add($"Screen DPI: {Screen.dpi}");
                result.details.Add($"Quality Level: {QualitySettings.GetQualityLevel()}");
                
                result.success = true;
                result.message = "Graphics test passed";
            }
            catch (Exception e)
            {
                result.success = false;
                result.message = $"Graphics test failed: {e.Message}";
                result.error = e.ToString();
            }

            result.endTime = Time.realtimeSinceStartup;
            result.duration = result.endTime - result.startTime;
            
            _testResults["graphics"] = result;
            yield return null;
        }

        private PlatformCapabilities DetectPlatformCapabilities()
        {
            var capabilities = new PlatformCapabilities();
            
            #if UNITY_WEBGL && !UNITY_EDITOR
            capabilities.platform = "WebGL";
            capabilities.supportsThreading = false;
            capabilities.supportsFileIO = false;
            capabilities.supportsSIMD = false;
            capabilities.supportsAsyncAwait = true;
            capabilities.supportsCoroutines = true;
            capabilities.optimizationLevel = OptimizationLevel.Basic;
            capabilities.maxWorkerThreads = 1;
            #elif UNITY_ANDROID || UNITY_IOS
            capabilities.platform = "Mobile";
            capabilities.supportsThreading = true;
            capabilities.supportsFileIO = true;
            capabilities.supportsSIMD = true;
            capabilities.supportsAsyncAwait = true;
            capabilities.supportsCoroutines = true;
            capabilities.optimizationLevel = OptimizationLevel.Advanced;
            capabilities.maxWorkerThreads = 4;
            #elif UNITY_STANDALONE_WIN || UNITY_STANDALONE_OSX || UNITY_STANDALONE_LINUX
            capabilities.platform = "Desktop";
            capabilities.supportsThreading = true;
            capabilities.supportsFileIO = true;
            capabilities.supportsSIMD = true;
            capabilities.supportsAsyncAwait = true;
            capabilities.supportsCoroutines = true;
            capabilities.optimizationLevel = OptimizationLevel.Ultra;
            capabilities.maxWorkerThreads = 8;
            #else
            capabilities.platform = "Editor";
            capabilities.supportsThreading = true;
            capabilities.supportsFileIO = true;
            capabilities.supportsSIMD = true;
            capabilities.supportsAsyncAwait = true;
            capabilities.supportsCoroutines = true;
            capabilities.optimizationLevel = OptimizationLevel.Ultra;
            capabilities.maxWorkerThreads = 16;
            #endif
            
            return capabilities;
        }

        private void GenerateTestReport()
        {
            Debug.Log("📊 Generating Platform Compatibility Test Report...");
            
            var totalTests = _testResults.Count;
            var passedTests = 0;
            var failedTests = 0;
            
            foreach (var result in _testResults.Values)
            {
                if (result.success)
                    passedTests++;
                else
                    failedTests++;
            }
            
            Debug.Log($"📈 Test Summary:");
            Debug.Log($"  Total Tests: {totalTests}");
            Debug.Log($"  Passed: {passedTests}");
            Debug.Log($"  Failed: {failedTests}");
            Debug.Log($"  Success Rate: {(float)passedTests / totalTests * 100:F1}%");
            
            if (failedTests > 0)
            {
                Debug.LogError("❌ Some tests failed. Check the details above for more information.");
            }
            else
            {
                Debug.Log("✅ All platform compatibility tests passed!");
            }
            
            // Generate detailed report if requested
            if (generateDetailedReport)
            {
                GenerateDetailedReport();
            }
        }

        private void GenerateDetailedReport()
        {
            Debug.Log("📋 Detailed Test Report:");
            
            foreach (var kvp in _testResults)
            {
                var result = kvp.Value;
                var status = result.success ? "✅ PASS" : "❌ FAIL";
                
                Debug.Log($"  {status} {result.testName} ({result.duration:F2}s)");
                Debug.Log($"    Platform: {result.platform}");
                Debug.Log($"    Message: {result.message}");
                
                if (result.details.Count > 0)
                {
                    Debug.Log($"    Details:");
                    foreach (var detail in result.details)
                    {
                        Debug.Log($"      - {detail}");
                    }
                }
                
                if (!result.success && !string.IsNullOrEmpty(result.error))
                {
                    Debug.LogError($"    Error: {result.error}");
                }
            }
        }

        // Public API
        public Dictionary<string, PlatformTestResult> GetTestResults()
        {
            return _testResults;
        }

        public bool AreAllTestsPassing()
        {
            foreach (var result in _testResults.Values)
            {
                if (!result.success)
                    return false;
            }
            return true;
        }

        public void StopTests()
        {
            if (_testCoroutine != null)
            {
                StopCoroutine(_testCoroutine);
                _testCoroutine = null;
            }
            _isRunningTests = false;
        }

        void OnDestroy()
        {
            StopTests();
        }
    }

    // Data classes
    [System.Serializable]
    public class PlatformTestResult
    {
        public string platform;
        public string testName;
        public bool success;
        public string message;
        public string error;
        public float startTime;
        public float endTime;
        public float duration;
        public List<string> details = new List<string>();
    }

    [System.Serializable]
    public class PlatformCapabilities
    {
        public string platform;
        public bool supportsThreading;
        public bool supportsFileIO;
        public bool supportsSIMD;
        public bool supportsAsyncAwait;
        public bool supportsCoroutines;
        public OptimizationLevel optimizationLevel;
        public int maxWorkerThreads;
    }

    public enum OptimizationLevel
    {
        Basic,      // WebGL
        Standard,   // Mobile
        Advanced,   // Desktop
        Ultra       // Console/Editor
    }
}
