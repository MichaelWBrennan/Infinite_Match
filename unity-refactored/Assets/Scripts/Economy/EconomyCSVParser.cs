using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using UnityEngine;
using UnityEditor;

namespace Evergreen.Economy
{
    /// <summary>
    /// CSV parser for economy items that generates ScriptableObjects and JSON data
    /// Compatible with Unity Cloud Build and automated pipelines
    /// </summary>
    public static class EconomyCSVParser
    {
        private const string CSV_PATH = "StreamingAssets/economy_items.csv";
        private const string SCRIPTABLE_OBJECTS_PATH = "Resources/Economy/";
        private const string JSON_OUTPUT_PATH = "StreamingAssets/economy_data.json";
        
        [System.Serializable]
        public class EconomyItemData
        {
            public string id;
            public string type;
            public string name;
            public int costGems;
            public int costCoins;
            public int quantity;
            public string description;
            public string rarity;
            public string category;
            public bool isPurchasable;
            public bool isConsumable;
            public bool isTradeable;
            public string iconPath;
        }
        
        [System.Serializable]
        public class EconomyDataCollection
        {
            public List<EconomyItemData> items = new List<EconomyItemData>();
            public string lastUpdated;
            public string version;
        }
        
        /// <summary>
        /// Parse CSV file and generate economy data
        /// </summary>
        [MenuItem("Economy/Parse CSV and Generate Assets")]
        public static void ParseCSVAndGenerateAssets()
        {
            try
            {
                Debug.Log("Starting CSV parsing and asset generation...");
                
                // Parse CSV
                var items = ParseCSVFile();
                if (items == null || items.Count == 0)
                {
                    Debug.LogError("No items found in CSV file!");
                    return;
                }
                
                // Generate ScriptableObjects
                GenerateScriptableObjects(items);
                
                // Generate JSON data
                GenerateJSONData(items);
                
                // Generate Unity Economy configuration
                GenerateUnityEconomyConfig(items);
                
                Debug.Log($"Successfully processed {items.Count} economy items!");
            }
            catch (Exception e)
            {
                Debug.LogError($"Error parsing CSV: {e.Message}");
                throw;
            }
        }
        
        /// <summary>
        /// Parse CSV file and return list of economy items
        /// </summary>
        public static List<EconomyItemData> ParseCSVFile()
        {
            string csvPath = Path.Combine(Application.dataPath, CSV_PATH);
            
            if (!File.Exists(csvPath))
            {
                Debug.LogError($"CSV file not found at: {csvPath}");
                return null;
            }
            
            var items = new List<EconomyItemData>();
            string[] lines = File.ReadAllLines(csvPath);
            
            if (lines.Length < 2)
            {
                Debug.LogError("CSV file is empty or has no data rows!");
                return null;
            }
            
            // Parse header
            string[] headers = ParseCSVLine(lines[0]);
            
            // Parse data rows
            for (int i = 1; i < lines.Length; i++)
            {
                if (string.IsNullOrEmpty(lines[i].Trim())) continue;
                
                string[] values = ParseCSVLine(lines[i]);
                if (values.Length != headers.Length)
                {
                    Debug.LogWarning($"Row {i + 1} has incorrect number of columns. Skipping...");
                    continue;
                }
                
                var item = new EconomyItemData
                {
                    id = GetValue(values, headers, "id"),
                    type = GetValue(values, headers, "type"),
                    name = GetValue(values, headers, "name"),
                    costGems = int.Parse(GetValue(values, headers, "cost_gems")),
                    costCoins = int.Parse(GetValue(values, headers, "cost_coins")),
                    quantity = int.Parse(GetValue(values, headers, "quantity")),
                    description = GetValue(values, headers, "description"),
                    rarity = GetValue(values, headers, "rarity"),
                    category = GetValue(values, headers, "category"),
                    isPurchasable = bool.Parse(GetValue(values, headers, "is_purchasable")),
                    isConsumable = bool.Parse(GetValue(values, headers, "is_consumable")),
                    isTradeable = bool.Parse(GetValue(values, headers, "is_tradeable")),
                    iconPath = GetValue(values, headers, "icon_path")
                };
                
                items.Add(item);
            }
            
            Debug.Log($"Parsed {items.Count} items from CSV");
            return items;
        }
        
        /// <summary>
        /// Parse a CSV line handling quoted values and commas
        /// </summary>
        private static string[] ParseCSVLine(string line)
        {
            var result = new List<string>();
            bool inQuotes = false;
            string currentField = "";
            
            for (int i = 0; i < line.Length; i++)
            {
                char c = line[i];
                
                if (c == '"')
                {
                    inQuotes = !inQuotes;
                }
                else if (c == ',' && !inQuotes)
                {
                    result.Add(currentField.Trim());
                    currentField = "";
                }
                else
                {
                    currentField += c;
                }
            }
            
            result.Add(currentField.Trim());
            return result.ToArray();
        }
        
        /// <summary>
        /// Get value from CSV row by column name
        /// </summary>
        private static string GetValue(string[] values, string[] headers, string columnName)
        {
            int index = Array.IndexOf(headers, columnName);
            if (index >= 0 && index < values.Length)
            {
                return values[index];
            }
            return "";
        }
        
        /// <summary>
        /// Generate ScriptableObjects for each economy item
        /// </summary>
        private static void GenerateScriptableObjects(List<EconomyItemData> items)
        {
            string folderPath = Path.Combine(Application.dataPath, SCRIPTABLE_OBJECTS_PATH);
            
            // Create directory if it doesn't exist
            if (!Directory.Exists(folderPath))
            {
                Directory.CreateDirectory(folderPath);
            }
            
            // Clear existing ScriptableObjects
            string[] existingFiles = Directory.GetFiles(folderPath, "*.asset");
            foreach (string file in existingFiles)
            {
                File.Delete(file);
            }
            
            // Generate ScriptableObjects
            foreach (var item in items)
            {
                var scriptableObject = ScriptableObject.CreateInstance<EconomyItemSO>();
                scriptableObject.Initialize(item);
                
                string assetPath = Path.Combine(SCRIPTABLE_OBJECTS_PATH, $"{item.id}.asset");
                AssetDatabase.CreateAsset(scriptableObject, assetPath);
            }
            
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            
            Debug.Log($"Generated {items.Count} ScriptableObjects in {SCRIPTABLE_OBJECTS_PATH}");
        }
        
        /// <summary>
        /// Generate JSON data file for runtime use
        /// </summary>
        private static void GenerateJSONData(List<EconomyItemData> items)
        {
            var collection = new EconomyDataCollection
            {
                items = items,
                lastUpdated = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                version = Application.version
            };
            
            string json = JsonUtility.ToJson(collection, true);
            string jsonPath = Path.Combine(Application.dataPath, JSON_OUTPUT_PATH);
            
            // Ensure directory exists
            Directory.CreateDirectory(Path.GetDirectoryName(jsonPath));
            
            File.WriteAllText(jsonPath, json);
            
            Debug.Log($"Generated JSON data at {JSON_OUTPUT_PATH}");
        }
        
        /// <summary>
        /// Generate Unity Economy configuration
        /// </summary>
        private static void GenerateUnityEconomyConfig(List<EconomyItemData> items)
        {
            var config = new UnityEconomyConfig
            {
                currencies = new List<UnityEconomyCurrency>(),
                inventoryItems = new List<UnityEconomyInventoryItem>(),
                virtualPurchases = new List<UnityEconomyVirtualPurchase>(),
                realMoneyPurchases = new List<UnityEconomyRealMoneyPurchase>(),
                lastUpdated = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
            };
            
            // Generate currencies
            var currencyItems = items.Where(i => i.type == "currency").ToList();
            foreach (var item in currencyItems)
            {
                config.currencies.Add(new UnityEconomyCurrency
                {
                    id = item.id,
                    name = item.name,
                    description = item.description,
                    type = item.isConsumable ? "consumable" : "non_consumable",
                    initial = 0,
                    maximum = 999999
                });
            }
            
            // Generate inventory items
            var inventoryItems = items.Where(i => i.type == "booster" || i.type == "pack").ToList();
            foreach (var item in inventoryItems)
            {
                config.inventoryItems.Add(new UnityEconomyInventoryItem
                {
                    id = item.id,
                    name = item.name,
                    description = item.description,
                    type = item.type,
                    tradable = item.isTradeable,
                    stackable = item.isConsumable
                });
            }
            
            // Generate virtual purchases
            var virtualPurchases = items.Where(i => i.isPurchasable && (i.costGems > 0 || i.costCoins > 0)).ToList();
            foreach (var item in virtualPurchases)
            {
                var purchase = new UnityEconomyVirtualPurchase
                {
                    id = $"purchase_{item.id}",
                    name = $"Purchase {item.name}",
                    description = item.description,
                    costs = new List<UnityEconomyCost>(),
                    rewards = new List<UnityEconomyReward>()
                };
                
                // Add costs
                if (item.costGems > 0)
                {
                    purchase.costs.Add(new UnityEconomyCost
                    {
                        resourceId = "gems",
                        amount = item.costGems
                    });
                }
                
                if (item.costCoins > 0)
                {
                    purchase.costs.Add(new UnityEconomyCost
                    {
                        resourceId = "coins",
                        amount = item.costCoins
                    });
                }
                
                // Add rewards
                if (item.type == "currency")
                {
                    purchase.rewards.Add(new UnityEconomyReward
                    {
                        resourceId = item.id,
                        amount = item.quantity
                    });
                }
                else if (item.type == "booster" || item.type == "pack")
                {
                    purchase.rewards.Add(new UnityEconomyReward
                    {
                        resourceId = item.id,
                        amount = item.quantity
                    });
                }
                
                config.virtualPurchases.Add(purchase);
            }
            
            // Generate real money purchases (for IAP)
            var realMoneyItems = items.Where(i => i.isPurchasable && item.costGems > 0).ToList();
            foreach (var item in realMoneyItems)
            {
                config.realMoneyPurchases.Add(new UnityEconomyRealMoneyPurchase
                {
                    id = $"iap_{item.id}",
                    name = item.name,
                    description = item.description,
                    rewards = new List<UnityEconomyReward>
                    {
                        new UnityEconomyReward
                        {
                            resourceId = "gems",
                            amount = item.costGems
                        }
                    }
                });
            }
            
            // Save configuration
            string configPath = Path.Combine(Application.dataPath, "StreamingAssets/unity_economy_config.json");
            string configJson = JsonUtility.ToJson(config, true);
            File.WriteAllText(configPath, configJson);
            
            Debug.Log($"Generated Unity Economy configuration with {config.currencies.Count} currencies, {config.inventoryItems.Count} inventory items, {config.virtualPurchases.Count} virtual purchases, and {config.realMoneyPurchases.Count} real money purchases");
        }
        
        /// <summary>
        /// Validate CSV data for common issues
        /// </summary>
        public static List<string> ValidateCSVData(List<EconomyItemData> items)
        {
            var errors = new List<string>();
            
            foreach (var item in items)
            {
                // Check required fields
                if (string.IsNullOrEmpty(item.id))
                    errors.Add($"Item at index {items.IndexOf(item)} has empty ID");
                
                if (string.IsNullOrEmpty(item.name))
                    errors.Add($"Item {item.id} has empty name");
                
                if (string.IsNullOrEmpty(item.type))
                    errors.Add($"Item {item.id} has empty type");
                
                // Check numeric fields
                if (item.costGems < 0)
                    errors.Add($"Item {item.id} has negative gem cost");
                
                if (item.costCoins < 0)
                    errors.Add($"Item {item.id} has negative coin cost");
                
                if (item.quantity <= 0)
                    errors.Add($"Item {item.id} has invalid quantity");
                
                // Check business logic
                if (item.isPurchasable && item.costGems == 0 && item.costCoins == 0)
                    errors.Add($"Item {item.id} is purchasable but has no cost");
                
                if (item.type == "currency" && item.isConsumable)
                    errors.Add($"Item {item.id} is a currency but marked as consumable");
            }
            
            // Check for duplicate IDs
            var duplicateIds = items.GroupBy(i => i.id).Where(g => g.Count() > 1).Select(g => g.Key);
            foreach (var duplicateId in duplicateIds)
            {
                errors.Add($"Duplicate ID found: {duplicateId}");
            }
            
            return errors;
        }
    }
    
    [System.Serializable]
    public class UnityEconomyConfig
    {
        public List<UnityEconomyCurrency> currencies;
        public List<UnityEconomyInventoryItem> inventoryItems;
        public List<UnityEconomyVirtualPurchase> virtualPurchases;
        public List<UnityEconomyRealMoneyPurchase> realMoneyPurchases;
        public string lastUpdated;
    }
    
    [System.Serializable]
    public class UnityEconomyCurrency
    {
        public string id;
        public string name;
        public string description;
        public string type;
        public int initial;
        public int maximum;
    }
    
    [System.Serializable]
    public class UnityEconomyInventoryItem
    {
        public string id;
        public string name;
        public string description;
        public string type;
        public bool tradable;
        public bool stackable;
    }
    
    [System.Serializable]
    public class UnityEconomyVirtualPurchase
    {
        public string id;
        public string name;
        public string description;
        public List<UnityEconomyCost> costs;
        public List<UnityEconomyReward> rewards;
    }
    
    [System.Serializable]
    public class UnityEconomyRealMoneyPurchase
    {
        public string id;
        public string name;
        public string description;
        public List<UnityEconomyReward> rewards;
    }
    
    [System.Serializable]
    public class UnityEconomyCost
    {
        public string resourceId;
        public int amount;
    }
    
    [System.Serializable]
    public class UnityEconomyReward
    {
        public string resourceId;
        public int amount;
    }
}