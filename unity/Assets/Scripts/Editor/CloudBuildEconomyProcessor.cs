using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;
using UnityEngine;
using Evergreen.Economy;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Unity.Services.Core;
using Unity.Services.Economy;
using Unity.Services.Authentication;
using Unity.Services.CloudCode;

namespace Evergreen.Editor
{
    /// <summary>
    /// Cloud Build processor that automatically parses CSV and generates economy assets
    /// Runs during build process to ensure economy data is always up-to-date
    /// Now includes Unity Dashboard sync functionality
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
                
                // Generate Unity Dashboard configuration
                GenerateUnityDashboardConfig();
                
                // Sync with Unity Dashboard if enabled
                if (ShouldSyncWithUnityDashboard())
                {
                    SyncWithUnityDashboard();
                }
                
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
        /// Generate Unity Dashboard configuration from CSV data
        /// </summary>
        private void GenerateUnityDashboardConfig()
        {
            try
            {
                Debug.Log("Generating Unity Dashboard configuration...");
                
                var items = EconomyCSVParser.ParseCSVFile();
                if (items == null || items.Count == 0)
                {
                    Debug.LogWarning("No economy items found for Unity Dashboard configuration");
                    return;
                }
                
                // Generate currencies configuration
                var currencies = new List<object>
                {
                    new { id = "coins", name = "Coins", type = "soft_currency", initial = 1000, maximum = 999999 },
                    new { id = "gems", name = "Gems", type = "hard_currency", initial = 50, maximum = 99999 },
                    new { id = "energy", name = "Energy", type = "consumable", initial = 5, maximum = 30 }
                };
                
                // Generate inventory items configuration
                var inventoryItems = items
                    .Where(item => item["type"] == "booster" || item["type"] == "pack")
                    .Select(item => new
                    {
                        id = item["id"],
                        name = item["name"],
                        type = item["type"],
                        tradable = item["is_tradeable"] == "true",
                        stackable = item["is_consumable"] == "true"
                    })
                    .ToList();
                
                // Generate virtual purchases configuration
                var virtualPurchases = items
                    .Where(item => item["is_purchasable"] == "true")
                    .Select(item => new
                    {
                        id = item["id"],
                        name = item["name"],
                        cost = new
                        {
                            currency = int.Parse(item["cost_gems"]) > 0 ? "gems" : "coins",
                            amount = int.Parse(item["cost_gems"]) > 0 ? int.Parse(item["cost_gems"]) : int.Parse(item["cost_coins"])
                        },
                        rewards = new[]
                        {
                            new
                            {
                                currency = item["type"] == "currency" ? "coins" : "gems",
                                amount = int.Parse(item["quantity"])
                            }
                        }
                    })
                    .ToList();
                
                // Create complete configuration
                var config = new
                {
                    projectId = "your-unity-project-id",
                    environmentId = "your-environment-id",
                    currencies = currencies,
                    inventoryItems = inventoryItems,
                    virtualPurchases = virtualPurchases,
                    generatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    version = "1.0.0"
                };
                
                // Save configuration
                string configPath = Path.Combine(Application.dataPath, "StreamingAssets/unity_dashboard_config.json");
                string configJson = JsonUtility.ToJson(config, true);
                File.WriteAllText(configPath, configJson);
                
                Debug.Log($"Unity Dashboard configuration generated: {configPath}");
                Debug.Log($"  - Currencies: {currencies.Count}");
                Debug.Log($"  - Inventory Items: {inventoryItems.Count}");
                Debug.Log($"  - Virtual Purchases: {virtualPurchases.Count}");
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to generate Unity Dashboard configuration: {e.Message}");
            }
        }
        
        /// <summary>
        /// Check if should sync with Unity Dashboard
        /// </summary>
        private bool ShouldSyncWithUnityDashboard()
        {
            // Check if Unity Dashboard sync is enabled
            // This could be controlled by a build setting or environment variable
            return Environment.GetEnvironmentVariable("UNITY_DASHBOARD_SYNC") == "true" ||
                   EditorPrefs.GetBool("EconomySyncWithUnityDashboard", false);
        }
        
        /// <summary>
        /// Sync economy data with Unity Dashboard
        /// </summary>
        private async void SyncWithUnityDashboard()
        {
            try
            {
                Debug.Log("Starting Unity Dashboard sync...");
                
                // Initialize Unity Services
                await UnityServices.InitializeAsync();
                await AuthenticationService.Instance.SignInAnonymouslyAsync();
                
                // Sync currencies
                await SyncCurrenciesToUnityDashboard();
                
                // Sync inventory items
                await SyncInventoryItemsToUnityDashboard();
                
                // Sync virtual purchases
                await SyncVirtualPurchasesToUnityDashboard();
                
                Debug.Log("Unity Dashboard sync completed successfully!");
            }
            catch (Exception e)
            {
                Debug.LogError($"Unity Dashboard sync failed: {e.Message}");
                // Don't fail the build if sync fails
            }
        }
        
        /// <summary>
        /// Sync currencies to Unity Dashboard
        /// </summary>
        private async Task SyncCurrenciesToUnityDashboard()
        {
            try
            {
                var currencies = new List<CurrencyDefinition>
                {
                    new CurrencyDefinition
                    {
                        Id = "coins",
                        Name = "Coins",
                        Type = CurrencyType.Soft,
                        Initial = 1000,
                        Maximum = 999999
                    },
                    new CurrencyDefinition
                    {
                        Id = "gems",
                        Name = "Gems",
                        Type = CurrencyType.Hard,
                        Initial = 50,
                        Maximum = 99999
                    },
                    new CurrencyDefinition
                    {
                        Id = "energy",
                        Name = "Energy",
                        Type = CurrencyType.Consumable,
                        Initial = 5,
                        Maximum = 30
                    }
                };
                
                foreach (var currency in currencies)
                {
                    try
                    {
                        await EconomyService.Instance.Configuration.CreateCurrencyAsync(currency);
                        Debug.Log($"Created currency: {currency.Id}");
                    }
                    catch (Exception e)
                    {
                        Debug.LogWarning($"Currency {currency.Id} might already exist: {e.Message}");
                    }
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to sync currencies: {e.Message}");
            }
        }
        
        /// <summary>
        /// Sync inventory items to Unity Dashboard
        /// </summary>
        private async Task SyncInventoryItemsToUnityDashboard()
        {
            try
            {
                var items = EconomyCSVParser.ParseCSVFile();
                var inventoryItems = items
                    .Where(item => item["type"] == "booster" || item["type"] == "pack")
                    .Select(item => new InventoryItemDefinition
                    {
                        Id = item["id"],
                        Name = item["name"],
                        Type = item["type"] == "booster" ? InventoryItemType.Booster : InventoryItemType.Pack,
                        Tradable = item["is_tradeable"] == "true",
                        Stackable = item["is_consumable"] == "true"
                    })
                    .ToList();
                
                foreach (var item in inventoryItems)
                {
                    try
                    {
                        await EconomyService.Instance.Configuration.CreateInventoryItemAsync(item);
                        Debug.Log($"Created inventory item: {item.Id}");
                    }
                    catch (Exception e)
                    {
                        Debug.LogWarning($"Inventory item {item.Id} might already exist: {e.Message}");
                    }
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to sync inventory items: {e.Message}");
            }
        }
        
        /// <summary>
        /// Sync virtual purchases to Unity Dashboard
        /// </summary>
        private async Task SyncVirtualPurchasesToUnityDashboard()
        {
            try
            {
                var items = EconomyCSVParser.ParseCSVFile();
                var purchases = items
                    .Where(item => item["is_purchasable"] == "true")
                    .Select(item => new VirtualPurchaseDefinition
                    {
                        Id = item["id"],
                        Name = item["name"],
                        Cost = new CostDefinition
                        {
                            Currency = int.Parse(item["cost_gems"]) > 0 ? "gems" : "coins",
                            Amount = int.Parse(item["cost_gems"]) > 0 ? int.Parse(item["cost_gems"]) : int.Parse(item["cost_coins"])
                        },
                        Rewards = new List<RewardDefinition>
                        {
                            new RewardDefinition
                            {
                                Currency = item["type"] == "currency" ? "coins" : "gems",
                                Amount = int.Parse(item["quantity"])
                            }
                        }
                    })
                    .ToList();
                
                foreach (var purchase in purchases)
                {
                    try
                    {
                        await EconomyService.Instance.Configuration.CreateVirtualPurchaseAsync(purchase);
                        Debug.Log($"Created virtual purchase: {purchase.Id}");
                    }
                    catch (Exception e)
                    {
                        Debug.LogWarning($"Virtual purchase {purchase.Id} might already exist: {e.Message}");
                    }
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to sync virtual purchases: {e.Message}");
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
