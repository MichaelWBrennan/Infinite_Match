using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;
using UnityEngine;
using Evergreen.Economy;

namespace Evergreen.Editor
{
    /// <summary>
    /// Cloud Build processor that automatically parses CSV and generates economy assets
    /// Runs during build process to ensure economy data is always up-to-date
    /// </summary>
    public class CloudBuildEconomyProcessor : IPreprocessBuildWithReport, IPostprocessBuildWithReport
    {
        public int callbackOrder => 0;
        
        /// <summary>
        /// Pre-build processing - parse CSV and generate assets
        /// </summary>
        public void OnPreprocessBuild(BuildReport report)
        {
            try
            {
                Debug.Log("Cloud Build Economy Processor: Starting pre-build processing...");
                
                // Parse CSV and generate assets
                EconomyCSVParser.ParseCSVAndGenerateAssets();
                
                // Validate generated data
                ValidateEconomyData();
                
                Debug.Log("Cloud Build Economy Processor: Pre-build processing completed successfully");
            }
            catch (Exception e)
            {
                Debug.LogError($"Cloud Build Economy Processor: Pre-build processing failed: {e.Message}");
                throw new BuildFailedException($"Economy processing failed: {e.Message}");
            }
        }
        
        /// <summary>
        /// Post-build processing - cleanup and validation
        /// </summary>
        public void OnPostprocessBuild(BuildReport report)
        {
            try
            {
                Debug.Log("Cloud Build Economy Processor: Starting post-build processing...");
                
                // Generate build report
                GenerateBuildReport(report);
                
                // Cleanup temporary files if needed
                CleanupTemporaryFiles();
                
                Debug.Log("Cloud Build Economy Processor: Post-build processing completed successfully");
            }
            catch (Exception e)
            {
                Debug.LogError($"Cloud Build Economy Processor: Post-build processing failed: {e.Message}");
                // Don't throw here as the build is already complete
            }
        }
        
        /// <summary>
        /// Validate economy data for consistency
        /// </summary>
        private void ValidateEconomyData()
        {
            try
            {
                // Load and validate CSV data
                var items = EconomyCSVParser.ParseCSVFile();
                if (items == null || items.Count == 0)
                {
                    throw new BuildFailedException("No economy items found in CSV file");
                }
                
                // Validate data
                var errors = EconomyCSVParser.ValidateCSVData(items);
                if (errors.Count > 0)
                {
                    string errorMessage = "CSV validation errors:\n" + string.Join("\n", errors);
                    throw new BuildFailedException(errorMessage);
                }
                
                // Validate ScriptableObjects were created
                string scriptableObjectsPath = "Assets/Resources/Economy/";
                if (!Directory.Exists(scriptableObjectsPath))
                {
                    throw new BuildFailedException("ScriptableObjects directory not found");
                }
                
                var scriptableObjectFiles = Directory.GetFiles(scriptableObjectsPath, "*.asset");
                if (scriptableObjectFiles.Length != items.Count)
                {
                    throw new BuildFailedException($"Mismatch between CSV items ({items.Count}) and ScriptableObjects ({scriptableObjectFiles.Length})");
                }
                
                // Validate JSON data was created
                string jsonPath = Path.Combine(Application.dataPath, "StreamingAssets/economy_data.json");
                if (!File.Exists(jsonPath))
                {
                    throw new BuildFailedException("Economy JSON data not found");
                }
                
                // Validate Unity Economy config was created
                string configPath = Path.Combine(Application.dataPath, "StreamingAssets/unity_economy_config.json");
                if (!File.Exists(configPath))
                {
                    throw new BuildFailedException("Unity Economy configuration not found");
                }
                
                Debug.Log($"Economy data validation passed: {items.Count} items processed successfully");
            }
            catch (Exception e)
            {
                Debug.LogError($"Economy data validation failed: {e.Message}");
                throw;
            }
        }
        
        /// <summary>
        /// Generate build report with economy data
        /// </summary>
        private void GenerateBuildReport(BuildReport report)
        {
            try
            {
                var reportData = new BuildReportData
                {
                    buildNumber = report.summary.buildNumber,
                    buildStartTime = report.summary.buildStartedAt,
                    buildEndTime = report.summary.buildEndedAt,
                    buildDuration = report.summary.totalTime,
                    buildResult = report.summary.result.ToString(),
                    platform = report.summary.platform.ToString(),
                    economyItemsCount = GetEconomyItemsCount(),
                    economyDataVersion = GetEconomyDataVersion(),
                    lastUpdated = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
                };
                
                string reportPath = Path.Combine(Application.dataPath, "StreamingAssets/build_report.json");
                string reportJson = JsonUtility.ToJson(reportData, true);
                File.WriteAllText(reportPath, reportJson);
                
                Debug.Log($"Build report generated: {reportPath}");
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to generate build report: {e.Message}");
            }
        }
        
        /// <summary>
        /// Get count of economy items
        /// </summary>
        private int GetEconomyItemsCount()
        {
            try
            {
                var items = EconomyCSVParser.ParseCSVFile();
                return items?.Count ?? 0;
            }
            catch
            {
                return 0;
            }
        }
        
        /// <summary>
        /// Get economy data version
        /// </summary>
        private string GetEconomyDataVersion()
        {
            try
            {
                string jsonPath = Path.Combine(Application.dataPath, "StreamingAssets/economy_data.json");
                if (File.Exists(jsonPath))
                {
                    string json = File.ReadAllText(jsonPath);
                    var data = JsonUtility.FromJson<EconomyCSVParser.EconomyDataCollection>(json);
                    return data.version;
                }
            }
            catch
            {
                // Ignore errors
            }
            return "unknown";
        }
        
        /// <summary>
        /// Cleanup temporary files
        /// </summary>
        private void CleanupTemporaryFiles()
        {
            try
            {
                // Add any cleanup logic here if needed
                Debug.Log("Temporary files cleanup completed");
            }
            catch (Exception e)
            {
                Debug.LogError($"Cleanup failed: {e.Message}");
            }
        }
        
        [System.Serializable]
        public class BuildReportData
        {
            public int buildNumber;
            public DateTime buildStartTime;
            public DateTime buildEndTime;
            public TimeSpan buildDuration;
            public string buildResult;
            public string platform;
            public int economyItemsCount;
            public string economyDataVersion;
            public string lastUpdated;
        }
    }
    
    /// <summary>
    /// Custom build exception for economy processing failures
    /// </summary>
    public class BuildFailedException : Exception
    {
        public BuildFailedException(string message) : base(message) { }
        public BuildFailedException(string message, Exception innerException) : base(message, innerException) { }
    }
}