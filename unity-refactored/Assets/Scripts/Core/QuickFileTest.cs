using UnityEngine;
using Core;

namespace Core
{
    /// <summary>
    /// Quick test to verify file reading is working
    /// Add this to any GameObject and use the context menu to test
    /// </summary>
    public class QuickFileTest : MonoBehaviour
    {
        [ContextMenu("Test Config File Reading")]
        public void TestConfigFileReading()
        {
            Debug.Log("=== Testing Config File Reading ===");
            
            try
            {
                string content = RobustFileManager.ReadTextFile("unity_services_config.json", FileLocation.StreamingAssets);
                
                if (string.IsNullOrEmpty(content))
                {
                    Debug.LogError("❌ FAILED: Could not read config file");
                    Debug.LogError("Possible issues:");
                    Debug.LogError("- File doesn't exist in StreamingAssets");
                    Debug.LogError("- Platform-specific file access issue");
                    Debug.LogError("- Unity build settings problem");
                }
                else
                {
                    Debug.Log($"✅ SUCCESS: Read config file ({content.Length} characters)");
                    Debug.Log($"First 100 characters: {content.Substring(0, Mathf.Min(100, content.Length))}...");
                }
            }
            catch (System.Exception ex)
            {
                Debug.LogError($"❌ EXCEPTION: {ex.Message}");
            }
        }

        [ContextMenu("Test Level File Reading")]
        public void TestLevelFileReading()
        {
            Debug.Log("=== Testing Level File Reading ===");
            
            try
            {
                string content = RobustFileManager.ReadTextFile("level_1.json", FileLocation.StreamingAssets, "levels");
                
                if (string.IsNullOrEmpty(content))
                {
                    Debug.LogError("❌ FAILED: Could not read level file");
                    Debug.LogError("Possible issues:");
                    Debug.LogError("- Level file doesn't exist in StreamingAssets/levels/");
                    Debug.LogError("- JSON file is corrupted");
                    Debug.LogError("- File permissions issue");
                }
                else
                {
                    Debug.Log($"✅ SUCCESS: Read level file ({content.Length} characters)");
                    Debug.Log($"First 100 characters: {content.Substring(0, Mathf.Min(100, content.Length))}...");
                }
            }
            catch (System.Exception ex)
            {
                Debug.LogError($"❌ EXCEPTION: {ex.Message}");
            }
        }

        [ContextMenu("Test File Existence Checks")]
        public void TestFileExistenceChecks()
        {
            Debug.Log("=== Testing File Existence Checks ===");
            
            string[] testFiles = {
                "unity_services_config.json",
                "level_1.json",
                "level_2.json",
                "nonexistent_file.json"
            };
            
            foreach (string fileName in testFiles)
            {
                bool exists = RobustFileManager.FileExists(fileName, FileLocation.StreamingAssets, 
                    fileName.StartsWith("level_") ? "levels" : "");
                
                string status = exists ? "✅ EXISTS" : "❌ NOT FOUND";
                Debug.Log($"{status}: {fileName}");
            }
        }

        [ContextMenu("List All Available Files")]
        public void ListAllAvailableFiles()
        {
            Debug.Log("=== Listing All Available Files ===");
            
            try
            {
                // List root StreamingAssets files
                string[] rootFiles = RobustFileManager.ListFiles("", FileLocation.StreamingAssets);
                Debug.Log($"Root StreamingAssets files ({rootFiles?.Length ?? 0}):");
                if (rootFiles != null)
                {
                    foreach (string file in rootFiles)
                    {
                        Debug.Log($"- {file}");
                    }
                }
                
                // List level files
                string[] levelFiles = RobustFileManager.ListFiles("levels", FileLocation.StreamingAssets, "level_*.json");
                Debug.Log($"Level files ({levelFiles?.Length ?? 0}):");
                if (levelFiles != null)
                {
                    foreach (string file in levelFiles)
                    {
                        Debug.Log($"- levels/{file}");
                    }
                }
            }
            catch (System.Exception ex)
            {
                Debug.LogError($"❌ EXCEPTION listing files: {ex.Message}");
            }
        }

        [ContextMenu("Test Migration Helper")]
        public void TestMigrationHelper()
        {
            Debug.Log("=== Testing Migration Helper ===");
            
            try
            {
                // Test using migration helper
                string content1 = FileReadingMigrationHelper.ReadAllTextSafe(
                    Application.streamingAssetsPath + "/unity_services_config.json");
                
                string content2 = FileReadingMigrationHelper.ReadAllTextSafe(
                    Application.streamingAssetsPath + "/levels/level_1.json");
                
                bool exists1 = FileReadingMigrationHelper.ExistsSafe(
                    Application.streamingAssetsPath + "/unity_services_config.json");
                
                bool exists2 = FileReadingMigrationHelper.ExistsSafe(
                    Application.streamingAssetsPath + "/levels/level_1.json");
                
                Debug.Log($"Migration Helper Results:");
                Debug.Log($"- Config file: {(content1 != null ? "✅ Read" : "❌ Failed")} (exists: {exists1})");
                Debug.Log($"- Level file: {(content2 != null ? "✅ Read" : "❌ Failed")} (exists: {exists2})");
            }
            catch (System.Exception ex)
            {
                Debug.LogError($"❌ EXCEPTION in migration helper: {ex.Message}");
            }
        }

        [ContextMenu("Run All Tests")]
        public void RunAllTests()
        {
            Debug.Log("=== Running All Quick Tests ===");
            TestConfigFileReading();
            TestLevelFileReading();
            TestFileExistenceChecks();
            ListAllAvailableFiles();
            TestMigrationHelper();
            Debug.Log("=== All Tests Complete ===");
        }
    }
}