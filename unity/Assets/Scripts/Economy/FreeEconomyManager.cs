using System;
using System.Collections.Generic;
using UnityEngine;
using System.IO;
using Newtonsoft.Json;

namespace Economy
{
    [System.Serializable]
    public class FreeCurrency
    {
        public string id;
        public string name;
        public string type;
        public int initial;
        public int maximum;
        public string description;
        [NonSerialized]
        public int currentAmount;
    }

    [System.Serializable]
    public class FreeInventoryItem
    {
        public string id;
        public string name;
        public string type;
        public bool tradable;
        public bool stackable;
        public string rarity;
        public string description;
        [NonSerialized]
        public int quantity;
    }

    [System.Serializable]
    public class FreeCatalogItem
    {
        public string id;
        public string name;
        public string cost_currency;
        public int cost_amount;
        public string rewards;
        public string description;
        public bool isPremium;
        public bool isLimited;
        public DateTime? expiryDate;
    }

    [System.Serializable]
    public class FreeEconomyData
    {
        public List<FreeCurrency> currencies;
        public List<FreeInventoryItem> inventory;
        public List<FreeCatalogItem> catalog;
    }

    [System.Serializable]
    public class FreeEconomyConfig
    {
        public string version;
        public string licenseType;
        public bool cloudServicesAvailable;
        public bool localDataEnabled;
        public FreeEconomyData economy;
        public Dictionary<string, object> settings;
    }

    /// <summary>
    /// Free Economy Manager - 100% Open Source
    /// Complete economy system with no external dependencies or API keys required
    /// </summary>
    public class FreeEconomyManager : MonoBehaviour
    {
        [Header("Free Economy Settings")]
        public bool debugMode = true;
        public bool enableLocalData = true;
        public bool enableCloudSync = false; // Optional cloud sync
        public string dataPath = "EconomyData";
        
        private FreeEconomyConfig config;
        private Dictionary<string, FreeCurrency> currencies;
        private Dictionary<string, FreeInventoryItem> inventory;
        private Dictionary<string, FreeCatalogItem> catalog;
        private Dictionary<string, object> localSettings;
        
        public static FreeEconomyManager Instance { get; private set; }
        
        // Events
        public static event Action<FreeCurrency> OnCurrencyChanged;
        public static event Action<FreeInventoryItem> OnInventoryChanged;
        public static event Action<string, int> OnPurchaseCompleted;
        public static event Action<string, string> OnError;
        public static event Action<string> OnDataSaved;
        public static event Action<string> OnDataLoaded;

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeEconomy();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        private void InitializeEconomy()
        {
            LoadConfiguration();
            InitializeCurrencies();
            InitializeInventory();
            InitializeCatalog();
            InitializeLocalSettings();
            
            if (debugMode)
            {
                LogEconomyStatus();
            }
        }

        private void LoadConfiguration()
        {
            try
            {
                string configPath = Path.Combine(Application.persistentDataPath, dataPath, "free_economy_config.json");
                
                if (File.Exists(configPath))
                {
                    string jsonContent = File.ReadAllText(configPath);
                    config = JsonConvert.DeserializeObject<FreeEconomyConfig>(jsonContent);
                    
                    if (debugMode)
                    {
                        Debug.Log($"[FreeEconomyManager] Configuration loaded successfully. Version: {config.version}");
                    }
                }
                else
                {
                    Debug.LogWarning("[FreeEconomyManager] Configuration file not found, creating default configuration");
                    CreateDefaultConfiguration();
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"[FreeEconomyManager] Failed to load configuration: {e.Message}");
                CreateDefaultConfiguration();
            }
        }

        private void CreateDefaultConfiguration()
        {
            config = new FreeEconomyConfig
            {
                version = "1.0.0",
                licenseType = "free",
                cloudServicesAvailable = false,
                localDataEnabled = true,
                economy = new FreeEconomyData
                {
                    currencies = new List<FreeCurrency>
                    {
                        new FreeCurrency
                        {
                            id = "coins",
                            name = "Coins",
                            type = "soft_currency",
                            initial = 1000,
                            maximum = 999999,
                            description = "Basic currency for purchases"
                        },
                        new FreeCurrency
                        {
                            id = "gems",
                            name = "Gems",
                            type = "premium_currency",
                            initial = 50,
                            maximum = 99999,
                            description = "Premium currency for special items"
                        },
                        new FreeCurrency
                        {
                            id = "energy",
                            name = "Energy",
                            type = "consumable",
                            initial = 100,
                            maximum = 100,
                            description = "Energy for playing levels"
                        }
                    },
                    inventory = new List<FreeInventoryItem>
                    {
                        new FreeInventoryItem
                        {
                            id = "powerup_rocket",
                            name = "Rocket Power-up",
                            type = "powerup",
                            tradable = true,
                            stackable = true,
                            rarity = "common",
                            description = "Clears a row or column"
                        },
                        new FreeInventoryItem
                        {
                            id = "powerup_bomb",
                            name = "Bomb Power-up",
                            type = "powerup",
                            tradable = true,
                            stackable = true,
                            rarity = "common",
                            description = "Clears surrounding tiles"
                        },
                        new FreeInventoryItem
                        {
                            id = "powerup_color_bomb",
                            name = "Color Bomb",
                            type = "powerup",
                            tradable = false,
                            stackable = true,
                            rarity = "rare",
                            description = "Clears all tiles of one color"
                        }
                    },
                    catalog = new List<FreeCatalogItem>
                    {
                        new FreeCatalogItem
                        {
                            id = "coins_100",
                            name = "100 Coins",
                            cost_currency = "gems",
                            cost_amount = 1,
                            rewards = "coins:100",
                            description = "Purchase 100 coins",
                            isPremium = false,
                            isLimited = false
                        },
                        new FreeCatalogItem
                        {
                            id = "coins_500",
                            name = "500 Coins",
                            cost_currency = "gems",
                            cost_amount = 4,
                            rewards = "coins:500",
                            description = "Purchase 500 coins",
                            isPremium = false,
                            isLimited = false
                        },
                        new FreeCatalogItem
                        {
                            id = "premium_pass",
                            name = "Premium Pass",
                            cost_currency = "gems",
                            cost_amount = 10,
                            rewards = "coins:1000,gems:20,powerup_rocket:5",
                            description = "Premium pass with exclusive rewards",
                            isPremium = true,
                            isLimited = false
                        }
                    }
                },
                settings = new Dictionary<string, object>
                {
                    { "auto_save", true },
                    { "save_interval", 300 }, // 5 minutes
                    { "max_backups", 10 },
                    { "compression_enabled", true }
                }
            };

            SaveConfiguration();
        }

        private void InitializeCurrencies()
        {
            currencies = new Dictionary<string, FreeCurrency>();
            
            foreach (var currency in config.economy.currencies)
            {
                currency.currentAmount = currency.initial;
                currencies[currency.id] = currency;
                
                if (debugMode)
                {
                    Debug.Log($"[FreeEconomyManager] Initialized currency: {currency.name} ({currency.id}) = {currency.currentAmount}");
                }
            }
        }

        private void InitializeInventory()
        {
            inventory = new Dictionary<string, FreeInventoryItem>();
            
            foreach (var item in config.economy.inventory)
            {
                item.quantity = 0;
                inventory[item.id] = item;
                
                if (debugMode)
                {
                    Debug.Log($"[FreeEconomyManager] Initialized inventory item: {item.name} ({item.id})");
                }
            }
        }

        private void InitializeCatalog()
        {
            catalog = new Dictionary<string, FreeCatalogItem>();
            
            foreach (var item in config.economy.catalog)
            {
                catalog[item.id] = item;
                
                if (debugMode)
                {
                    Debug.Log($"[FreeEconomyManager] Initialized catalog item: {item.name} ({item.id})");
                }
            }
        }

        private void InitializeLocalSettings()
        {
            localSettings = new Dictionary<string, object>();
            
            // Load local settings from config
            if (config.settings != null)
            {
                foreach (var setting in config.settings)
                {
                    localSettings[setting.Key] = setting.Value;
                }
            }
        }

        // Currency Management
        public bool AddCurrency(string currencyId, int amount)
        {
            if (currencies.TryGetValue(currencyId, out FreeCurrency currency))
            {
                int newAmount = Mathf.Min(currency.currentAmount + amount, currency.maximum);
                currency.currentAmount = newAmount;
                
                OnCurrencyChanged?.Invoke(currency);
                
                if (debugMode)
                {
                    Debug.Log($"[FreeEconomyManager] Added {amount} {currency.name}. New amount: {currency.currentAmount}");
                }
                
                // Auto-save if enabled
                if (GetSetting<bool>("auto_save"))
                {
                    SaveEconomyData();
                }
                
                return true;
            }
            
            OnError?.Invoke("currency_not_found", $"Currency {currencyId} not found");
            return false;
        }

        public bool SpendCurrency(string currencyId, int amount)
        {
            if (currencies.TryGetValue(currencyId, out FreeCurrency currency))
            {
                if (currency.currentAmount >= amount)
                {
                    currency.currentAmount -= amount;
                    OnCurrencyChanged?.Invoke(currency);
                    
                    if (debugMode)
                    {
                        Debug.Log($"[FreeEconomyManager] Spent {amount} {currency.name}. New amount: {currency.currentAmount}");
                    }
                    
                    // Auto-save if enabled
                    if (GetSetting<bool>("auto_save"))
                    {
                        SaveEconomyData();
                    }
                    
                    return true;
                }
                else
                {
                    OnError?.Invoke("insufficient_funds", $"Not enough {currency.name}");
                    return false;
                }
            }
            
            OnError?.Invoke("currency_not_found", $"Currency {currencyId} not found");
            return false;
        }

        public int GetCurrencyAmount(string currencyId)
        {
            return currencies.TryGetValue(currencyId, out FreeCurrency currency) ? currency.currentAmount : 0;
        }

        // Inventory Management
        public bool AddInventoryItem(string itemId, int quantity = 1)
        {
            if (inventory.TryGetValue(itemId, out FreeInventoryItem item))
            {
                item.quantity += quantity;
                OnInventoryChanged?.Invoke(item);
                
                if (debugMode)
                {
                    Debug.Log($"[FreeEconomyManager] Added {quantity} {item.name} to inventory. Total: {item.quantity}");
                }
                
                // Auto-save if enabled
                if (GetSetting<bool>("auto_save"))
                {
                    SaveEconomyData();
                }
                
                return true;
            }
            
            OnError?.Invoke("item_not_found", $"Item {itemId} not found");
            return false;
        }

        public bool UseInventoryItem(string itemId, int quantity = 1)
        {
            if (inventory.TryGetValue(itemId, out FreeInventoryItem item))
            {
                if (item.quantity >= quantity)
                {
                    item.quantity -= quantity;
                    OnInventoryChanged?.Invoke(item);
                    
                    if (debugMode)
                    {
                        Debug.Log($"[FreeEconomyManager] Used {quantity} {item.name}. Remaining: {item.quantity}");
                    }
                    
                    // Auto-save if enabled
                    if (GetSetting<bool>("auto_save"))
                    {
                        SaveEconomyData();
                    }
                    
                    return true;
                }
                else
                {
                    OnError?.Invoke("insufficient_items", $"Not enough {item.name}");
                    return false;
                }
            }
            
            OnError?.Invoke("item_not_found", $"Item {itemId} not found");
            return false;
        }

        public int GetInventoryQuantity(string itemId)
        {
            return inventory.TryGetValue(itemId, out FreeInventoryItem item) ? item.quantity : 0;
        }

        // Purchase System
        public bool PurchaseItem(string catalogItemId)
        {
            if (catalog.TryGetValue(catalogItemId, out FreeCatalogItem catalogItem))
            {
                // Check if item is limited and expired
                if (catalogItem.isLimited && catalogItem.expiryDate.HasValue && DateTime.Now > catalogItem.expiryDate.Value)
                {
                    OnError?.Invoke("item_expired", $"Item {catalogItemId} has expired");
                    return false;
                }

                // Check if player has enough currency
                if (SpendCurrency(catalogItem.cost_currency, catalogItem.cost_amount))
                {
                    // Process rewards
                    ProcessRewards(catalogItem.rewards);
                    
                    OnPurchaseCompleted?.Invoke(catalogItemId, catalogItem.cost_amount);
                    
                    if (debugMode)
                    {
                        Debug.Log($"[FreeEconomyManager] Purchased {catalogItem.name} for {catalogItem.cost_amount} {catalogItem.cost_currency}");
                    }
                    
                    return true;
                }
            }
            else
            {
                OnError?.Invoke("item_not_found", $"Catalog item {catalogItemId} not found");
            }
            
            return false;
        }

        private void ProcessRewards(string rewardsString)
        {
            string[] rewards = rewardsString.Split(',');
            
            foreach (string reward in rewards)
            {
                string[] parts = reward.Trim().Split(':');
                if (parts.Length == 2)
                {
                    string rewardId = parts[0];
                    int quantity = int.Parse(parts[1]);
                    
                    // Check if it's a currency or inventory item
                    if (currencies.ContainsKey(rewardId))
                    {
                        AddCurrency(rewardId, quantity);
                    }
                    else if (inventory.ContainsKey(rewardId))
                    {
                        AddInventoryItem(rewardId, quantity);
                    }
                }
            }
        }

        // Data Management
        public void SaveEconomyData()
        {
            try
            {
                string dataPath = Path.Combine(Application.persistentDataPath, this.dataPath);
                Directory.CreateDirectory(dataPath);

                // Save current state
                var economyState = new
                {
                    currencies = currencies.Values,
                    inventory = inventory.Values,
                    timestamp = DateTime.Now,
                    version = config.version
                };

                string jsonData = JsonConvert.SerializeObject(economyState, Formatting.Indented);
                string filePath = Path.Combine(dataPath, "economy_state.json");
                File.WriteAllText(filePath, jsonData);

                // Create backup
                CreateBackup(dataPath);

                OnDataSaved?.Invoke("Economy data saved successfully");
                
                if (debugMode)
                {
                    Debug.Log($"[FreeEconomyManager] Economy data saved to {filePath}");
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"[FreeEconomyManager] Failed to save economy data: {e.Message}");
                OnError?.Invoke("save_failed", e.Message);
            }
        }

        public void LoadEconomyData()
        {
            try
            {
                string dataPath = Path.Combine(Application.persistentDataPath, this.dataPath);
                string filePath = Path.Combine(dataPath, "economy_state.json");

                if (File.Exists(filePath))
                {
                    string jsonData = File.ReadAllText(filePath);
                    var economyState = JsonConvert.DeserializeObject<dynamic>(jsonData);

                    // Load currencies
                    if (economyState.currencies != null)
                    {
                        foreach (var currencyData in economyState.currencies)
                        {
                            string currencyId = currencyData.id;
                            int currentAmount = currencyData.currentAmount;
                            
                            if (currencies.ContainsKey(currencyId))
                            {
                                currencies[currencyId].currentAmount = currentAmount;
                            }
                        }
                    }

                    // Load inventory
                    if (economyState.inventory != null)
                    {
                        foreach (var itemData in economyState.inventory)
                        {
                            string itemId = itemData.id;
                            int quantity = itemData.quantity;
                            
                            if (inventory.ContainsKey(itemId))
                            {
                                inventory[itemId].quantity = quantity;
                            }
                        }
                    }

                    OnDataLoaded?.Invoke("Economy data loaded successfully");
                    
                    if (debugMode)
                    {
                        Debug.Log($"[FreeEconomyManager] Economy data loaded from {filePath}");
                    }
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"[FreeEconomyManager] Failed to load economy data: {e.Message}");
                OnError?.Invoke("load_failed", e.Message);
            }
        }

        private void CreateBackup(string dataPath)
        {
            try
            {
                string backupPath = Path.Combine(dataPath, "backups");
                Directory.CreateDirectory(backupPath);

                string timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
                string backupFile = Path.Combine(backupPath, $"economy_backup_{timestamp}.json");
                
                string sourceFile = Path.Combine(dataPath, "economy_state.json");
                if (File.Exists(sourceFile))
                {
                    File.Copy(sourceFile, backupFile, true);
                }

                // Clean old backups
                CleanOldBackups(backupPath);
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[FreeEconomyManager] Failed to create backup: {e.Message}");
            }
        }

        private void CleanOldBackups(string backupPath)
        {
            try
            {
                int maxBackups = GetSetting<int>("max_backups");
                var backupFiles = Directory.GetFiles(backupPath, "economy_backup_*.json")
                    .OrderByDescending(f => File.GetCreationTime(f))
                    .ToArray();

                if (backupFiles.Length > maxBackups)
                {
                    for (int i = maxBackups; i < backupFiles.Length; i++)
                    {
                        File.Delete(backupFiles[i]);
                    }
                }
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[FreeEconomyManager] Failed to clean old backups: {e.Message}");
            }
        }

        // Settings Management
        public void SetSetting<T>(string key, T value)
        {
            localSettings[key] = value;
        }

        public T GetSetting<T>(string key, T defaultValue = default(T))
        {
            if (localSettings.TryGetValue(key, out object value))
            {
                try
                {
                    return (T)Convert.ChangeType(value, typeof(T));
                }
                catch
                {
                    return defaultValue;
                }
            }
            return defaultValue;
        }

        // Getters for UI
        public Dictionary<string, FreeCurrency> GetAllCurrencies()
        {
            return new Dictionary<string, FreeCurrency>(currencies);
        }

        public Dictionary<string, FreeInventoryItem> GetAllInventoryItems()
        {
            return new Dictionary<string, FreeInventoryItem>(inventory);
        }

        public Dictionary<string, FreeCatalogItem> GetAllCatalogItems()
        {
            return new Dictionary<string, FreeCatalogItem>(catalog);
        }

        public FreeCurrency GetCurrency(string currencyId)
        {
            return currencies.TryGetValue(currencyId, out FreeCurrency currency) ? currency : null;
        }

        public FreeInventoryItem GetInventoryItem(string itemId)
        {
            return inventory.TryGetValue(itemId, out FreeInventoryItem item) ? item : null;
        }

        public FreeCatalogItem GetCatalogItem(string catalogItemId)
        {
            return catalog.TryGetValue(catalogItemId, out FreeCatalogItem item) ? item : null;
        }

        // Utility Methods
        public void ResetEconomy()
        {
            foreach (var currency in currencies.Values)
            {
                currency.currentAmount = currency.initial;
            }

            foreach (var item in inventory.Values)
            {
                item.quantity = 0;
            }

            OnDataSaved?.Invoke("Economy reset to initial state");
            
            if (debugMode)
            {
                Debug.Log("[FreeEconomyManager] Economy reset to initial state");
            }
        }

        public void ExportEconomyData()
        {
            try
            {
                var exportData = new
                {
                    currencies = currencies.Values,
                    inventory = inventory.Values,
                    catalog = catalog.Values,
                    settings = localSettings,
                    export_timestamp = DateTime.Now,
                    version = config.version
                };

                string jsonData = JsonConvert.SerializeObject(exportData, Formatting.Indented);
                string fileName = $"economy_export_{DateTime.Now:yyyyMMdd_HHmmss}.json";
                string filePath = Path.Combine(Application.persistentDataPath, fileName);
                
                File.WriteAllText(filePath, jsonData);
                
                OnDataSaved?.Invoke($"Economy data exported to {fileName}");
                
                if (debugMode)
                {
                    Debug.Log($"[FreeEconomyManager] Economy data exported to {filePath}");
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"[FreeEconomyManager] Failed to export economy data: {e.Message}");
                OnError?.Invoke("export_failed", e.Message);
            }
        }

        public void ImportEconomyData(string jsonData)
        {
            try
            {
                var importData = JsonConvert.DeserializeObject<dynamic>(jsonData);

                // Import currencies
                if (importData.currencies != null)
                {
                    foreach (var currencyData in importData.currencies)
                    {
                        string currencyId = currencyData.id;
                        int currentAmount = currencyData.currentAmount;
                        
                        if (currencies.ContainsKey(currencyId))
                        {
                            currencies[currencyId].currentAmount = currentAmount;
                        }
                    }
                }

                // Import inventory
                if (importData.inventory != null)
                {
                    foreach (var itemData in importData.inventory)
                    {
                        string itemId = itemData.id;
                        int quantity = itemData.quantity;
                        
                        if (inventory.ContainsKey(itemId))
                        {
                            inventory[itemId].quantity = quantity;
                        }
                    }
                }

                OnDataLoaded?.Invoke("Economy data imported successfully");
                
                if (debugMode)
                {
                    Debug.Log("[FreeEconomyManager] Economy data imported successfully");
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"[FreeEconomyManager] Failed to import economy data: {e.Message}");
                OnError?.Invoke("import_failed", e.Message);
            }
        }

        private void SaveConfiguration()
        {
            try
            {
                string dataPath = Path.Combine(Application.persistentDataPath, this.dataPath);
                Directory.CreateDirectory(dataPath);

                string jsonData = JsonConvert.SerializeObject(config, Formatting.Indented);
                string filePath = Path.Combine(dataPath, "free_economy_config.json");
                File.WriteAllText(filePath, jsonData);
            }
            catch (Exception e)
            {
                Debug.LogError($"[FreeEconomyManager] Failed to save configuration: {e.Message}");
            }
        }

        private void LogEconomyStatus()
        {
            Debug.Log("=== FREE ECONOMY STATUS ===");
            Debug.Log($"Version: {config.version}");
            Debug.Log($"License Type: {config.licenseType}");
            Debug.Log($"Local Data Enabled: {config.localDataEnabled}");
            Debug.Log($"Cloud Services Available: {config.cloudServicesAvailable}");
            Debug.Log($"Currencies: {currencies.Count}");
            Debug.Log($"Inventory Items: {inventory.Count}");
            Debug.Log($"Catalog Items: {catalog.Count}");
            Debug.Log("==========================");
        }

        // Auto-save on application pause/focus
        private void OnApplicationPause(bool pauseStatus)
        {
            if (pauseStatus && GetSetting<bool>("auto_save"))
            {
                SaveEconomyData();
            }
        }

        private void OnApplicationFocus(bool hasFocus)
        {
            if (!hasFocus && GetSetting<bool>("auto_save"))
            {
                SaveEconomyData();
            }
        }

        private void OnDestroy()
        {
            if (GetSetting<bool>("auto_save"))
            {
                SaveEconomyData();
            }
        }
    }
}