using System.Collections;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using Core;

namespace Core
{
    /// <summary>
    /// Comprehensive diagnostic tool to identify specific asset loading issues
    /// </summary>
    public class AssetDiagnosticTool : MonoBehaviour
    {
        [Header("Diagnostic Settings")]
        [SerializeField] private bool runDiagnosticOnStart = true;
        [SerializeField] private bool testAllLevels = true;
        [SerializeField] private bool testAllConfigs = true;
        [SerializeField] private bool validateJSON = true;
        
        [Header("Diagnostic Results")]
        [SerializeField] private int totalAssetsTested = 0;
        [SerializeField] private int assetsLoadedSuccessfully = 0;
        [SerializeField] private int assetsFailedToLoad = 0;
        [SerializeField] private List<string> failedAssets = new List<string>();
        [SerializeField] private List<string> errorMessages = new List<string>();

        private void Start()
        {
            if (runDiagnosticOnStart)
            {
                StartCoroutine(RunComprehensiveDiagnostic());
            }
        }

        [ContextMenu("Run Comprehensive Diagnostic")]
        public void RunComprehensiveDiagnostic()
        {
            StartCoroutine(RunComprehensiveDiagnostic());
        }

        private IEnumerator RunComprehensiveDiagnostic()
        {
            Debug.Log("=== COMPREHENSIVE ASSET DIAGNOSTIC TOOL ===");
            Debug.Log($"Platform: {Application.platform}");
            Debug.Log($"Unity Version: {Application.unityVersion}");
            Debug.Log($"StreamingAssets Path: {Application.streamingAssetsPath}");
            Debug.Log($"Persistent Data Path: {Application.persistentDataPath}");
            Debug.Log("");

            // Reset counters
            totalAssetsTested = 0;
            assetsLoadedSuccessfully = 0;
            assetsFailedToLoad = 0;
            failedAssets.Clear();
            errorMessages.Clear();

            // Test 1: Basic StreamingAssets access
            yield return StartCoroutine(TestStreamingAssetsAccess());
            
            // Test 2: Configuration files
            if (testAllConfigs)
            {
                yield return StartCoroutine(TestConfigurationFiles());
            }
            
            // Test 3: Level files
            if (testAllLevels)
            {
                yield return StartCoroutine(TestLevelFiles());
            }
            
            // Test 4: Other asset types
            yield return StartCoroutine(TestOtherAssets());
            
            // Test 5: Platform-specific tests
            yield return StartCoroutine(TestPlatformSpecific());
            
            // Test 6: Performance and memory
            yield return StartCoroutine(TestPerformanceAndMemory());
            
            // Generate final report
            GenerateDiagnosticReport();
        }

        private IEnumerator TestStreamingAssetsAccess()
        {
            Debug.Log("--- Testing StreamingAssets Access ---");
            
            try
            {
                // Test basic path access
                string streamingPath = Application.streamingAssetsPath;
                if (string.IsNullOrEmpty(streamingPath))
                {
                    LogError("StreamingAssets path is null or empty!");
                    yield break;
                }
                
                Debug.Log($"✓ StreamingAssets path accessible: {streamingPath}");
                
                // Test directory listing
                string[] files = RobustFileManager.ListFiles("", FileLocation.StreamingAssets);
                Debug.Log($"✓ Found {files?.Length ?? 0} files in StreamingAssets root");
                
                if (files != null)
                {
                    foreach (string file in files)
                    {
                        Debug.Log($"  - {file}");
                    }
                }
            }
            catch (System.Exception ex)
            {
                LogError($"StreamingAssets access failed: {ex.Message}");
            }
            
            yield return null;
        }

        private IEnumerator TestConfigurationFiles()
        {
            Debug.Log("--- Testing Configuration Files ---");
            
            string[] configFiles = {
                "unity_services_config.json",
                "economy_data.json"
            };
            
            foreach (string configFile in configFiles)
            {
                yield return StartCoroutine(TestSingleFile(configFile, FileLocation.StreamingAssets, ""));
            }
        }

        private IEnumerator TestLevelFiles()
        {
            Debug.Log("--- Testing Level Files ---");
            
            try
            {
                // Get all level files
                string[] levelFiles = RobustFileManager.ListFiles("levels", FileLocation.StreamingAssets, "level_*.json");
                
                if (levelFiles == null || levelFiles.Length == 0)
                {
                    LogError("No level files found in levels directory!");
                    yield break;
                }
                
                Debug.Log($"Found {levelFiles.Length} level files to test:");
                
                foreach (string levelFile in levelFiles)
                {
                    string fileName = Path.GetFileName(levelFile);
                    yield return StartCoroutine(TestSingleFile(fileName, FileLocation.StreamingAssets, "levels"));
                }
            }
            catch (System.Exception ex)
            {
                LogError($"Level files test failed: {ex.Message}");
            }
        }

        private IEnumerator TestOtherAssets()
        {
            Debug.Log("--- Testing Other Assets ---");
            
            // Test CSV files
            yield return StartCoroutine(TestSingleFile("economy_items.csv", FileLocation.StreamingAssets, ""));
            
            // Test binary files (if any exist)
            string[] binaryFiles = RobustFileManager.ListFiles("", FileLocation.StreamingAssets, "*.png");
            if (binaryFiles != null && binaryFiles.Length > 0)
            {
                foreach (string binaryFile in binaryFiles)
                {
                    string fileName = Path.GetFileName(binaryFile);
                    yield return StartCoroutine(TestBinaryFile(fileName, FileLocation.StreamingAssets, ""));
                }
            }
        }

        private IEnumerator TestPlatformSpecific()
        {
            Debug.Log("--- Testing Platform-Specific Behavior ---");
            
            try
            {
                // Test UnityWebRequest requirement
                bool shouldUseWebRequest = Application.platform == RuntimePlatform.WebGLPlayer || 
                                         Application.platform == RuntimePlatform.Android;
                
                Debug.Log($"Platform requires UnityWebRequest: {shouldUseWebRequest}");
                
                // Test path separators
                string testPath = Path.Combine("test", "path", "file.json");
                Debug.Log($"Path combination test: {testPath}");
                
                // Test file existence with different methods
                bool exists1 = RobustFileManager.FileExists("unity_services_config.json", FileLocation.StreamingAssets);
                bool exists2 = File.Exists(Path.Combine(Application.streamingAssetsPath, "unity_services_config.json"));
                
                Debug.Log($"File exists (RobustFileManager): {exists1}");
                Debug.Log($"File exists (File.Exists): {exists2}");
                
                if (exists1 != exists2)
                {
                    LogError($"Inconsistent file existence detection! RobustFileManager: {exists1}, File.Exists: {exists2}");
                }
            }
            catch (System.Exception ex)
            {
                LogError($"Platform-specific test failed: {ex.Message}");
            }
            
            yield return null;
        }

        private IEnumerator TestPerformanceAndMemory()
        {
            Debug.Log("--- Testing Performance and Memory ---");
            
            try
            {
                long initialMemory = System.GC.GetTotalMemory(false);
                float startTime = Time.realtimeSinceStartup;
                
                // Test reading multiple files
                for (int i = 0; i < 10; i++)
                {
                    RobustFileManager.ReadTextFile("unity_services_config.json", FileLocation.StreamingAssets);
                }
                
                float endTime = Time.realtimeSinceStartup;
                long finalMemory = System.GC.GetTotalMemory(false);
                
                float totalTime = endTime - startTime;
                long memoryUsed = finalMemory - initialMemory;
                
                Debug.Log($"✓ Performance test: {totalTime:F4}s for 10 reads");
                Debug.Log($"✓ Memory usage: {memoryUsed / 1024}KB");
                
                if (totalTime > 1.0f)
                {
                    LogError($"Performance issue: File reading took {totalTime:F4}s (should be < 1.0s)");
                }
                
                if (memoryUsed > 1024 * 1024) // 1MB
                {
                    LogError($"Memory issue: Used {memoryUsed / 1024}KB (should be < 1MB)");
                }
            }
            catch (System.Exception ex)
            {
                LogError($"Performance test failed: {ex.Message}");
            }
            
            yield return null;
        }

        private IEnumerator TestSingleFile(string fileName, FileLocation location, string subDirectory)
        {
            totalAssetsTested++;
            
            try
            {
                Debug.Log($"Testing file: {fileName}");
                
                // Test file existence
                bool exists = RobustFileManager.FileExists(fileName, location, subDirectory);
                if (!exists)
                {
                    LogError($"File does not exist: {fileName}");
                    yield break;
                }
                
                // Test file reading
                string content = RobustFileManager.ReadTextFile(fileName, location, subDirectory);
                if (string.IsNullOrEmpty(content))
                {
                    LogError($"Failed to read file: {fileName}");
                    yield break;
                }
                
                // Validate JSON if it's a JSON file
                if (validateJSON && fileName.EndsWith(".json"))
                {
                    bool isValidJSON = ValidateJSON(content);
                    if (!isValidJSON)
                    {
                        LogError($"Invalid JSON in file: {fileName}");
                        yield break;
                    }
                }
                
                assetsLoadedSuccessfully++;
                Debug.Log($"✓ Successfully loaded: {fileName} ({content.Length} characters)");
            }
            catch (System.Exception ex)
            {
                LogError($"Exception loading {fileName}: {ex.Message}");
            }
            
            yield return null;
        }

        private IEnumerator TestBinaryFile(string fileName, FileLocation location, string subDirectory)
        {
            totalAssetsTested++;
            
            try
            {
                Debug.Log($"Testing binary file: {fileName}");
                
                byte[] data = RobustFileManager.ReadBinaryFile(fileName, location, subDirectory);
                if (data == null || data.Length == 0)
                {
                    LogError($"Failed to read binary file: {fileName}");
                    yield break;
                }
                
                assetsLoadedSuccessfully++;
                Debug.Log($"✓ Successfully loaded binary: {fileName} ({data.Length} bytes)");
            }
            catch (System.Exception ex)
            {
                LogError($"Exception loading binary {fileName}: {ex.Message}");
            }
            
            yield return null;
        }

        private bool ValidateJSON(string jsonContent)
        {
            try
            {
                // Simple JSON validation - check for basic structure
                jsonContent = jsonContent.Trim();
                if (!jsonContent.StartsWith("{") && !jsonContent.StartsWith("["))
                {
                    return false;
                }
                
                // Try to parse with Unity's JsonUtility (basic validation)
                // This is a simple test - for full validation, we'd need a proper JSON parser
                return true;
            }
            catch
            {
                return false;
            }
        }

        private void LogError(string message)
        {
            assetsFailedToLoad++;
            failedAssets.Add(message);
            errorMessages.Add(message);
            Debug.LogError($"[AssetDiagnostic] {message}");
        }

        private void GenerateDiagnosticReport()
        {
            Debug.Log("");
            Debug.Log("=== DIAGNOSTIC REPORT ===");
            Debug.Log($"Total Assets Tested: {totalAssetsTested}");
            Debug.Log($"Successfully Loaded: {assetsLoadedSuccessfully}");
            Debug.Log($"Failed to Load: {assetsFailedToLoad}");
            Debug.Log($"Success Rate: {(float)assetsLoadedSuccessfully / totalAssetsTested * 100:F1}%");
            Debug.Log("");
            
            if (failedAssets.Count > 0)
            {
                Debug.LogError("FAILED ASSETS:");
                foreach (string failedAsset in failedAssets)
                {
                    Debug.LogError($"- {failedAsset}");
                }
                Debug.Log("");
            }
            
            if (errorMessages.Count > 0)
            {
                Debug.LogError("ERROR MESSAGES:");
                foreach (string error in errorMessages)
                {
                    Debug.LogError($"- {error}");
                }
                Debug.Log("");
            }
            
            // Recommendations
            Debug.Log("RECOMMENDATIONS:");
            if (assetsFailedToLoad == 0)
            {
                Debug.Log("✓ All assets are loading correctly!");
                Debug.Log("✓ Your file reading system is working properly.");
            }
            else
            {
                Debug.LogError("✗ Some assets failed to load. Check the error messages above.");
                Debug.LogError("✗ Verify that all files exist in the correct locations.");
                Debug.LogError("✗ Check file permissions and Unity build settings.");
            }
            
            Debug.Log("=== END DIAGNOSTIC REPORT ===");
        }

        [ContextMenu("Test Single Config File")]
        public void TestSingleConfigFile()
        {
            StartCoroutine(TestSingleFile("unity_services_config.json", FileLocation.StreamingAssets, ""));
        }

        [ContextMenu("Test Single Level File")]
        public void TestSingleLevelFile()
        {
            StartCoroutine(TestSingleFile("level_1.json", FileLocation.StreamingAssets, "levels"));
        }

        [ContextMenu("List All StreamingAssets")]
        public void ListAllStreamingAssets()
        {
            string[] files = RobustFileManager.ListFiles("", FileLocation.StreamingAssets);
            Debug.Log($"StreamingAssets files ({files.Length}):");
            foreach (string file in files)
            {
                Debug.Log($"- {file}");
            }
        }

        [ContextMenu("Test File Reading Performance")]
        public void TestFileReadingPerformance()
        {
            StartCoroutine(TestPerformanceAndMemory());
        }
    }
}