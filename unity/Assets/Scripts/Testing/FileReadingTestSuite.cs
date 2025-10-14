using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Core;

namespace Testing
{
    /// <summary>
    /// Comprehensive test suite for Unity file reading functionality
    /// Tests the RobustFileManager and migration helper across different scenarios
    /// </summary>
    public class FileReadingTestSuite : MonoBehaviour
    {
        [Header("Test Configuration")]
        [SerializeField] private bool runTestsOnStart = false;
        [SerializeField] private bool enableDetailedLogging = true;
        [SerializeField] private float testDelay = 0.1f;

        [Header("Test Results")]
        [SerializeField] private int totalTests = 0;
        [SerializeField] private int passedTests = 0;
        [SerializeField] private int failedTests = 0;

        private List<TestResult> testResults = new List<TestResult>();

        [System.Serializable]
        public class TestResult
        {
            public string testName;
            public bool passed;
            public string message;
            public float executionTime;

            public TestResult(string name, bool success, string msg, float time = 0f)
            {
                testName = name;
                passed = success;
                message = msg;
                executionTime = time;
            }
        }

        private void Start()
        {
            if (runTestsOnStart)
            {
                StartCoroutine(RunAllTests());
            }
        }

        [ContextMenu("Run All File Reading Tests")]
        public void RunTests()
        {
            StartCoroutine(RunAllTests());
        }

        private IEnumerator RunAllTests()
        {
            Debug.Log("[FileReadingTestSuite] Starting comprehensive file reading tests...");
            
            testResults.Clear();
            totalTests = 0;
            passedTests = 0;
            failedTests = 0;

            // Test 1: Basic text file reading from StreamingAssets
            yield return StartCoroutine(TestBasicTextReading());
            yield return new WaitForSeconds(testDelay);

            // Test 2: Level file reading
            yield return StartCoroutine(TestLevelFileReading());
            yield return new WaitForSeconds(testDelay);

            // Test 3: Config file reading
            yield return StartCoroutine(TestConfigFileReading());
            yield return new WaitForSeconds(testDelay);

            // Test 4: File existence checks
            yield return StartCoroutine(TestFileExistenceChecks());
            yield return new WaitForSeconds(testDelay);

            // Test 5: Fallback mechanisms
            yield return StartCoroutine(TestFallbackMechanisms());
            yield return new WaitForSeconds(testDelay);

            // Test 6: Error handling
            yield return StartCoroutine(TestErrorHandling());
            yield return new WaitForSeconds(testDelay);

            // Test 7: Migration helper compatibility
            yield return StartCoroutine(TestMigrationHelper());
            yield return new WaitForSeconds(testDelay);

            // Test 8: Platform-specific behavior
            yield return StartCoroutine(TestPlatformSpecificBehavior());
            yield return new WaitForSeconds(testDelay);

            // Test 9: Performance testing
            yield return StartCoroutine(TestPerformance());
            yield return new WaitForSeconds(testDelay);

            // Test 10: Memory usage
            yield return StartCoroutine(TestMemoryUsage());

            // Generate final report
            GenerateTestReport();
        }

        private IEnumerator TestBasicTextReading()
        {
            string testName = "Basic Text File Reading";
            float startTime = Time.realtimeSinceStartup;

            try
            {
                // Test reading a known file
                string content = RobustFileManager.ReadTextFile("unity_services_config.json", FileLocation.StreamingAssets);
                
                bool success = !string.IsNullOrEmpty(content) && content.Contains("projectId");
                string message = success ? "Successfully read config file" : "Failed to read or parse config file";
                
                AddTestResult(testName, success, message, Time.realtimeSinceStartup - startTime);
            }
            catch (System.Exception ex)
            {
                AddTestResult(testName, false, $"Exception: {ex.Message}", Time.realtimeSinceStartup - startTime);
            }

            yield return null;
        }

        private IEnumerator TestLevelFileReading()
        {
            string testName = "Level File Reading";
            float startTime = Time.realtimeSinceStartup;

            try
            {
                // Test reading level files
                string[] levelFiles = RobustFileManager.ListFiles("levels", FileLocation.StreamingAssets, "level_*.json");
                
                bool success = levelFiles != null && levelFiles.Length > 0;
                string message = success ? $"Found {levelFiles.Length} level files" : "No level files found";

                if (success)
                {
                    // Try to read the first level file
                    string firstLevel = RobustFileManager.ReadTextFile("level_1.json", FileLocation.StreamingAssets, "levels");
                    success = !string.IsNullOrEmpty(firstLevel) && firstLevel.Contains("goals");
                    message += success ? " and successfully read level_1.json" : " but failed to read level_1.json";
                }
                
                AddTestResult(testName, success, message, Time.realtimeSinceStartup - startTime);
            }
            catch (System.Exception ex)
            {
                AddTestResult(testName, false, $"Exception: {ex.Message}", Time.realtimeSinceStartup - startTime);
            }

            yield return null;
        }

        private IEnumerator TestConfigFileReading()
        {
            string testName = "Config File Reading";
            float startTime = Time.realtimeSinceStartup;

            try
            {
                // Test reading various config files
                string[] configFiles = { "unity_services_config.json", "economy_data.json" };
                int successCount = 0;

                foreach (string configFile in configFiles)
                {
                    string content = RobustFileManager.ReadTextFile(configFile, FileLocation.StreamingAssets);
                    if (!string.IsNullOrEmpty(content))
                    {
                        successCount++;
                    }
                }

                bool success = successCount > 0;
                string message = $"Successfully read {successCount}/{configFiles.Length} config files";
                
                AddTestResult(testName, success, message, Time.realtimeSinceStartup - startTime);
            }
            catch (System.Exception ex)
            {
                AddTestResult(testName, false, $"Exception: {ex.Message}", Time.realtimeSinceStartup - startTime);
            }

            yield return null;
        }

        private IEnumerator TestFileExistenceChecks()
        {
            string testName = "File Existence Checks";
            float startTime = Time.realtimeSinceStartup;

            try
            {
                // Test checking existing files
                bool exists1 = RobustFileManager.FileExists("unity_services_config.json", FileLocation.StreamingAssets);
                bool exists2 = RobustFileManager.FileExists("level_1.json", FileLocation.StreamingAssets, "levels");
                bool exists3 = RobustFileManager.FileExists("nonexistent_file.json", FileLocation.StreamingAssets);

                bool success = exists1 && exists2 && !exists3;
                string message = $"Existing files: {exists1}, {exists2}, Non-existent: {!exists3}";
                
                AddTestResult(testName, success, message, Time.realtimeSinceStartup - startTime);
            }
            catch (System.Exception ex)
            {
                AddTestResult(testName, false, $"Exception: {ex.Message}", Time.realtimeSinceStartup - startTime);
            }

            yield return null;
        }

        private IEnumerator TestFallbackMechanisms()
        {
            string testName = "Fallback Mechanisms";
            float startTime = Time.realtimeSinceStartup;

            try
            {
                // Test fallback to Resources (if file doesn't exist in StreamingAssets)
                string content = RobustFileManager.ReadTextFile("nonexistent_file.json", FileLocation.StreamingAssets);
                
                // This should return null since the file doesn't exist and there's no fallback
                bool success = content == null;
                string message = success ? "Correctly handled non-existent file" : "Unexpected content returned for non-existent file";
                
                AddTestResult(testName, success, message, Time.realtimeSinceStartup - startTime);
            }
            catch (System.Exception ex)
            {
                AddTestResult(testName, false, $"Exception: {ex.Message}", Time.realtimeSinceStartup - startTime);
            }

            yield return null;
        }

        private IEnumerator TestErrorHandling()
        {
            string testName = "Error Handling";
            float startTime = Time.realtimeSinceStartup;

            try
            {
                // Test with invalid parameters
                string content1 = RobustFileManager.ReadTextFile(null, FileLocation.StreamingAssets);
                string content2 = RobustFileManager.ReadTextFile("", FileLocation.StreamingAssets);
                string content3 = RobustFileManager.ReadTextFile("invalid/path/file.json", FileLocation.StreamingAssets);

                bool success = content1 == null && content2 == null && content3 == null;
                string message = success ? "Properly handled invalid parameters" : "Failed to handle invalid parameters";
                
                AddTestResult(testName, success, message, Time.realtimeSinceStartup - startTime);
            }
            catch (System.Exception ex)
            {
                AddTestResult(testName, false, $"Exception: {ex.Message}", Time.realtimeSinceStartup - startTime);
            }

            yield return null;
        }

        private IEnumerator TestMigrationHelper()
        {
            string testName = "Migration Helper Compatibility";
            float startTime = Time.realtimeSinceStartup;

            try
            {
                // Test migration helper methods
                string content1 = FileReadingMigrationHelper.ReadAllTextSafe(Application.streamingAssetsPath + "/unity_services_config.json");
                bool exists1 = FileReadingMigrationHelper.ExistsSafe(Application.streamingAssetsPath + "/unity_services_config.json");
                string[] files = FileReadingMigrationHelper.ListFilesSafe("levels", FileLocation.StreamingAssets, "level_*.json");

                bool success = !string.IsNullOrEmpty(content1) && exists1 && files.Length > 0;
                string message = $"Migration helper: content={!string.IsNullOrEmpty(content1)}, exists={exists1}, files={files.Length}";
                
                AddTestResult(testName, success, message, Time.realtimeSinceStartup - startTime);
            }
            catch (System.Exception ex)
            {
                AddTestResult(testName, false, $"Exception: {ex.Message}", Time.realtimeSinceStartup - startTime);
            }

            yield return null;
        }

        private IEnumerator TestPlatformSpecificBehavior()
        {
            string testName = "Platform-Specific Behavior";
            float startTime = Time.realtimeSinceStartup;

            try
            {
                // Test platform-specific path handling
                string streamingPath = Application.streamingAssetsPath;
                string persistentPath = Application.persistentDataPath;
                string dataPath = Application.dataPath;

                bool success = !string.IsNullOrEmpty(streamingPath) && 
                              !string.IsNullOrEmpty(persistentPath) && 
                              !string.IsNullOrEmpty(dataPath);

                string message = $"Platform: {Application.platform}, Streaming: {streamingPath}, Persistent: {persistentPath}";
                
                AddTestResult(testName, success, message, Time.realtimeSinceStartup - startTime);
            }
            catch (System.Exception ex)
            {
                AddTestResult(testName, false, $"Exception: {ex.Message}", Time.realtimeSinceStartup - startTime);
            }

            yield return null;
        }

        private IEnumerator TestPerformance()
        {
            string testName = "Performance Testing";
            float startTime = Time.realtimeSinceStartup;

            try
            {
                // Test reading multiple files to measure performance
                int iterations = 10;
                float totalTime = 0f;

                for (int i = 0; i < iterations; i++)
                {
                    float iterStart = Time.realtimeSinceStartup;
                    RobustFileManager.ReadTextFile("unity_services_config.json", FileLocation.StreamingAssets);
                    totalTime += Time.realtimeSinceStartup - iterStart;
                }

                float averageTime = totalTime / iterations;
                bool success = averageTime < 0.1f; // Should be under 100ms per read
                string message = $"Average read time: {averageTime:F4}s over {iterations} iterations";
                
                AddTestResult(testName, success, message, Time.realtimeSinceStartup - startTime);
            }
            catch (System.Exception ex)
            {
                AddTestResult(testName, false, $"Exception: {ex.Message}", Time.realtimeSinceStartup - startTime);
            }

            yield return null;
        }

        private IEnumerator TestMemoryUsage()
        {
            string testName = "Memory Usage";
            float startTime = Time.realtimeSinceStartup;

            try
            {
                // Test memory usage during file operations
                long initialMemory = System.GC.GetTotalMemory(false);
                
                // Read multiple files
                for (int i = 1; i <= 5; i++)
                {
                    RobustFileManager.ReadTextFile($"level_{i}.json", FileLocation.StreamingAssets, "levels");
                }

                long finalMemory = System.GC.GetTotalMemory(false);
                long memoryUsed = finalMemory - initialMemory;

                bool success = memoryUsed < 1024 * 1024; // Less than 1MB
                string message = $"Memory used: {memoryUsed / 1024}KB";
                
                AddTestResult(testName, success, message, Time.realtimeSinceStartup - startTime);
            }
            catch (System.Exception ex)
            {
                AddTestResult(testName, false, $"Exception: {ex.Message}", Time.realtimeSinceStartup - startTime);
            }

            yield return null;
        }

        private void AddTestResult(string testName, bool passed, string message, float executionTime)
        {
            TestResult result = new TestResult(testName, passed, message, executionTime);
            testResults.Add(result);
            totalTests++;
            
            if (passed)
                passedTests++;
            else
                failedTests++;

            if (enableDetailedLogging)
            {
                string status = passed ? "PASS" : "FAIL";
                Debug.Log($"[FileReadingTestSuite] {status}: {testName} - {message} ({executionTime:F4}s)");
            }
        }

        private void GenerateTestReport()
        {
            Debug.Log("=== FILE READING TEST SUITE REPORT ===");
            Debug.Log($"Total Tests: {totalTests}");
            Debug.Log($"Passed: {passedTests}");
            Debug.Log($"Failed: {failedTests}");
            Debug.Log($"Success Rate: {(float)passedTests / totalTests * 100:F1}%");
            Debug.Log("");

            if (failedTests > 0)
            {
                Debug.LogError("FAILED TESTS:");
                foreach (TestResult result in testResults)
                {
                    if (!result.passed)
                    {
                        Debug.LogError($"- {result.testName}: {result.message}");
                    }
                }
            }

            Debug.Log("=== END REPORT ===");
        }

        [ContextMenu("Test Single File Read")]
        public void TestSingleFileRead()
        {
            string content = RobustFileManager.ReadTextFile("unity_services_config.json", FileLocation.StreamingAssets);
            Debug.Log($"Config file content length: {content?.Length ?? 0} characters");
        }

        [ContextMenu("List All StreamingAssets Files")]
        public void ListStreamingAssetsFiles()
        {
            string[] files = RobustFileManager.ListFiles("", FileLocation.StreamingAssets);
            Debug.Log($"Found {files.Length} files in StreamingAssets:");
            foreach (string file in files)
            {
                Debug.Log($"- {file}");
            }
        }

        [ContextMenu("Test Level Files")]
        public void TestLevelFiles()
        {
            string[] levelFiles = RobustFileManager.ListFiles("levels", FileLocation.StreamingAssets, "level_*.json");
            Debug.Log($"Found {levelFiles.Length} level files:");
            foreach (string file in levelFiles)
            {
                Debug.Log($"- {file}");
            }
        }
    }
}