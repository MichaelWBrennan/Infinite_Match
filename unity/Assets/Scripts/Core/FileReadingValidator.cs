using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Core;

namespace Core
{
    /// <summary>
    /// Validates file reading functionality and provides diagnostic information
    /// Use this to verify that file reading is working correctly
    /// </summary>
    public class FileReadingValidator : MonoBehaviour
    {
        [Header("Validation Settings")]
        [SerializeField] private bool validateOnStart = true;
        [SerializeField] private bool showDetailedResults = true;
        
        [Header("Validation Results")]
        [SerializeField] private bool streamingAssetsAccessible = false;
        [SerializeField] private bool levelFilesReadable = false;
        [SerializeField] private bool configFilesReadable = false;
        [SerializeField] private int totalFilesFound = 0;
        [SerializeField] private int filesSuccessfullyRead = 0;

        private void Start()
        {
            if (validateOnStart)
            {
                StartCoroutine(ValidateFileReading());
            }
        }

        [ContextMenu("Validate File Reading")]
        public void ValidateFileReading()
        {
            StartCoroutine(ValidateFileReading());
        }

        private IEnumerator ValidateFileReading()
        {
            Debug.Log("[FileReadingValidator] Starting file reading validation...");
            
            // Reset validation results
            streamingAssetsAccessible = false;
            levelFilesReadable = false;
            configFilesReadable = false;
            totalFilesFound = 0;
            filesSuccessfullyRead = 0;

            // Test 1: Check StreamingAssets accessibility
            yield return StartCoroutine(ValidateStreamingAssetsAccess());
            
            // Test 2: Check level files
            yield return StartCoroutine(ValidateLevelFiles());
            
            // Test 3: Check config files
            yield return StartCoroutine(ValidateConfigFiles());
            
            // Test 4: Check file listing functionality
            yield return StartCoroutine(ValidateFileListing());
            
            // Generate validation report
            GenerateValidationReport();
        }

        private IEnumerator ValidateStreamingAssetsAccess()
        {
            Debug.Log("[FileReadingValidator] Testing StreamingAssets access...");
            
            try
            {
                // Test basic StreamingAssets access
                string streamingPath = Application.streamingAssetsPath;
                Debug.Log($"[FileReadingValidator] StreamingAssets path: {streamingPath}");
                
                if (string.IsNullOrEmpty(streamingPath))
                {
                    Debug.LogError("[FileReadingValidator] StreamingAssets path is null or empty!");
                    streamingAssetsAccessible = false;
                }
                else
                {
                    // Try to read a known file
                    string content = RobustFileManager.ReadTextFile("unity_services_config.json", FileLocation.StreamingAssets);
                    streamingAssetsAccessible = !string.IsNullOrEmpty(content);
                    
                    if (streamingAssetsAccessible)
                    {
                        Debug.Log($"[FileReadingValidator] Successfully read config file ({content.Length} characters)");
                    }
                    else
                    {
                        Debug.LogWarning("[FileReadingValidator] Failed to read config file from StreamingAssets");
                    }
                }
            }
            catch (System.Exception ex)
            {
                Debug.LogError($"[FileReadingValidator] Exception during StreamingAssets validation: {ex.Message}");
                streamingAssetsAccessible = false;
            }
            
            yield return null;
        }

        private IEnumerator ValidateLevelFiles()
        {
            Debug.Log("[FileReadingValidator] Testing level files...");
            
            try
            {
                // List level files
                string[] levelFiles = RobustFileManager.ListFiles("levels", FileLocation.StreamingAssets, "level_*.json");
                totalFilesFound += levelFiles?.Length ?? 0;
                
                Debug.Log($"[FileReadingValidator] Found {levelFiles?.Length ?? 0} level files");
                
                if (levelFiles != null && levelFiles.Length > 0)
                {
                    int successCount = 0;
                    
                    // Try to read each level file
                    foreach (string levelFile in levelFiles)
                    {
                        string fileName = System.IO.Path.GetFileName(levelFile);
                        string content = RobustFileManager.ReadTextFile(fileName, FileLocation.StreamingAssets, "levels");
                        
                        if (!string.IsNullOrEmpty(content))
                        {
                            successCount++;
                            filesSuccessfullyRead++;
                            
                            if (showDetailedResults)
                            {
                                Debug.Log($"[FileReadingValidator] ✓ Successfully read {fileName} ({content.Length} characters)");
                            }
                        }
                        else
                        {
                            Debug.LogWarning($"[FileReadingValidator] ✗ Failed to read {fileName}");
                        }
                    }
                    
                    levelFilesReadable = successCount > 0;
                    Debug.Log($"[FileReadingValidator] Successfully read {successCount}/{levelFiles.Length} level files");
                }
                else
                {
                    Debug.LogWarning("[FileReadingValidator] No level files found!");
                    levelFilesReadable = false;
                }
            }
            catch (System.Exception ex)
            {
                Debug.LogError($"[FileReadingValidator] Exception during level files validation: {ex.Message}");
                levelFilesReadable = false;
            }
            
            yield return null;
        }

        private IEnumerator ValidateConfigFiles()
        {
            Debug.Log("[FileReadingValidator] Testing config files...");
            
            try
            {
                string[] configFiles = { "unity_services_config.json", "economy_data.json" };
                int successCount = 0;
                
                foreach (string configFile in configFiles)
                {
                    string content = RobustFileManager.ReadTextFile(configFile, FileLocation.StreamingAssets);
                    
                    if (!string.IsNullOrEmpty(content))
                    {
                        successCount++;
                        filesSuccessfullyRead++;
                        
                        if (showDetailedResults)
                        {
                            Debug.Log($"[FileReadingValidator] ✓ Successfully read {configFile} ({content.Length} characters)");
                        }
                    }
                    else
                    {
                        Debug.LogWarning($"[FileReadingValidator] ✗ Failed to read {configFile}");
                    }
                }
                
                configFilesReadable = successCount > 0;
                Debug.Log($"[FileReadingValidator] Successfully read {successCount}/{configFiles.Length} config files");
            }
            catch (System.Exception ex)
            {
                Debug.LogError($"[FileReadingValidator] Exception during config files validation: {ex.Message}");
                configFilesReadable = false;
            }
            
            yield return null;
        }

        private IEnumerator ValidateFileListing()
        {
            Debug.Log("[FileReadingValidator] Testing file listing functionality...");
            
            try
            {
                // Test listing files in root StreamingAssets
                string[] rootFiles = RobustFileManager.ListFiles("", FileLocation.StreamingAssets);
                Debug.Log($"[FileReadingValidator] Found {rootFiles?.Length ?? 0} files in StreamingAssets root");
                
                if (showDetailedResults && rootFiles != null)
                {
                    foreach (string file in rootFiles)
                    {
                        Debug.Log($"[FileReadingValidator] - {file}");
                    }
                }
                
                // Test listing files in levels subdirectory
                string[] levelFiles = RobustFileManager.ListFiles("levels", FileLocation.StreamingAssets);
                Debug.Log($"[FileReadingValidator] Found {levelFiles?.Length ?? 0} files in levels directory");
                
                if (showDetailedResults && levelFiles != null)
                {
                    foreach (string file in levelFiles)
                    {
                        Debug.Log($"[FileReadingValidator] - levels/{file}");
                    }
                }
            }
            catch (System.Exception ex)
            {
                Debug.LogError($"[FileReadingValidator] Exception during file listing validation: {ex.Message}");
            }
            
            yield return null;
        }

        private void GenerateValidationReport()
        {
            Debug.Log("=== FILE READING VALIDATION REPORT ===");
            Debug.Log($"Platform: {Application.platform}");
            Debug.Log($"StreamingAssets Path: {Application.streamingAssetsPath}");
            Debug.Log($"Persistent Data Path: {Application.persistentDataPath}");
            Debug.Log("");
            
            Debug.Log("VALIDATION RESULTS:");
            Debug.Log($"StreamingAssets Accessible: {(streamingAssetsAccessible ? "✓ PASS" : "✗ FAIL")}");
            Debug.Log($"Level Files Readable: {(levelFilesReadable ? "✓ PASS" : "✗ FAIL")}");
            Debug.Log($"Config Files Readable: {(configFilesReadable ? "✓ PASS" : "✗ FAIL")}");
            Debug.Log($"Total Files Found: {totalFilesFound}");
            Debug.Log($"Files Successfully Read: {filesSuccessfullyRead}");
            
            bool overallSuccess = streamingAssetsAccessible && levelFilesReadable && configFilesReadable;
            Debug.Log($"");
            Debug.Log($"OVERALL STATUS: {(overallSuccess ? "✓ ALL TESTS PASSED" : "✗ SOME TESTS FAILED")}");
            
            if (!overallSuccess)
            {
                Debug.LogError("=== TROUBLESHOOTING SUGGESTIONS ===");
                
                if (!streamingAssetsAccessible)
                {
                    Debug.LogError("- Check if StreamingAssets folder exists and is accessible");
                    Debug.LogError("- Verify file permissions on StreamingAssets folder");
                    Debug.LogError("- Check Unity build settings for StreamingAssets inclusion");
                }
                
                if (!levelFilesReadable)
                {
                    Debug.LogError("- Check if levels folder exists in StreamingAssets");
                    Debug.LogError("- Verify level files are properly formatted JSON");
                    Debug.LogError("- Check file names and extensions");
                }
                
                if (!configFilesReadable)
                {
                    Debug.LogError("- Check if config files exist in StreamingAssets");
                    Debug.LogError("- Verify config files are valid JSON");
                    Debug.LogError("- Check file permissions and encoding");
                }
            }
            
            Debug.Log("=== END VALIDATION REPORT ===");
        }

        [ContextMenu("Test Single File Read")]
        public void TestSingleFileRead()
        {
            string content = RobustFileManager.ReadTextFile("unity_services_config.json", FileLocation.StreamingAssets);
            Debug.Log($"Config file content: {(content != null ? $"{content.Length} characters" : "NULL")}");
        }

        [ContextMenu("Test Level File Read")]
        public void TestLevelFileRead()
        {
            string content = RobustFileManager.ReadTextFile("level_1.json", FileLocation.StreamingAssets, "levels");
            Debug.Log($"Level 1 content: {(content != null ? $"{content.Length} characters" : "NULL")}");
        }

        [ContextMenu("List All Files")]
        public void ListAllFiles()
        {
            string[] files = RobustFileManager.ListFiles("", FileLocation.StreamingAssets);
            Debug.Log($"Found {files.Length} files in StreamingAssets:");
            foreach (string file in files)
            {
                Debug.Log($"- {file}");
            }
        }

        [ContextMenu("Check File Existence")]
        public void CheckFileExistence()
        {
            bool configExists = RobustFileManager.FileExists("unity_services_config.json", FileLocation.StreamingAssets);
            bool levelExists = RobustFileManager.FileExists("level_1.json", FileLocation.StreamingAssets, "levels");
            
            Debug.Log($"Config file exists: {configExists}");
            Debug.Log($"Level 1 exists: {levelExists}");
        }
    }
}