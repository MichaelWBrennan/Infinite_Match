using System;
using System.Collections.Generic;
using UnityEngine;
using System.IO;
using Newtonsoft.Json;

namespace Economy
{
    [System.Serializable]
    public class Currency
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
    public class InventoryItem
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
    public class CatalogItem
    {
        public string id;
        public string name;
        public string cost_currency;
        public int cost_amount;
        public string rewards;
        public string description;
    }

    [System.Serializable]
    public class EconomyData
    {
        public List<Currency> currencies;
        public List<InventoryItem> inventory;
        public List<CatalogItem> catalog;
    }

    [System.Serializable]
    public class UnityServicesConfig
    {
        public string projectId;
        public string environmentId;
        public string licenseType;
        public bool cloudServicesAvailable;
        public EconomyData economy;
    }

    public class EconomyManager : MonoBehaviour
    {
        [Header("Economy Settings")]
        public bool debugMode = true;
        
        private UnityServicesConfig config;
        private Dictionary<string, Currency> currencies;
        private Dictionary<string, InventoryItem> inventory;
        private Dictionary<string, CatalogItem> catalog;
        
        public static EconomyManager Instance { get; private set; }
        
        // Events
        public static event Action<Currency> OnCurrencyChanged;
        public static event Action<InventoryItem> OnInventoryChanged;
        public static event Action<string, int> OnPurchaseCompleted;
        public static event Action<string, string> OnError;

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
            
            if (debugMode)
            {
                LogEconomyStatus();
            }
        }

        private void LoadConfiguration()
        {
            try
            {
                string configPath = Path.Combine(Application.streamingAssetsPath, "unity_services_config.json");
                
                if (File.Exists(configPath))
                {
                    string jsonContent = File.ReadAllText(configPath);
                    config = JsonConvert.DeserializeObject<UnityServicesConfig>(jsonContent);
                    
                    if (debugMode)
                    {
                        Debug.Log($"[EconomyManager] Configuration loaded successfully. License: {config.licenseType}");
                    }
                }
                else
                {
                    Debug.LogError("[EconomyManager] Configuration file not found at: " + configPath);
                    CreateDefaultConfiguration();
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"[EconomyManager] Failed to load configuration: {e.Message}");
                CreateDefaultConfiguration();
            }
        }

        private void CreateDefaultConfiguration()
        {
            config = new UnityServicesConfig
            {
                projectId = "default-project",
                environmentId = "default-environment",
                licenseType = "personal",
                cloudServicesAvailable = false,
                economy = new EconomyData
                {
                    currencies = new List<Currency>(),
                    inventory = new List<InventoryItem>(),
                    catalog = new List<CatalogItem>()
                }
            };
        }

        private void InitializeCurrencies()
        {
            currencies = new Dictionary<string, Currency>();
            
            foreach (var currency in config.economy.currencies)
            {
                currency.currentAmount = currency.initial;
                currencies[currency.id] = currency;
                
                if (debugMode)
                {
                    Debug.Log($"[EconomyManager] Initialized currency: {currency.name} ({currency.id}) = {currency.currentAmount}");
                }
            }
        }

        private void InitializeInventory()
        {
            inventory = new Dictionary<string, InventoryItem>();
            
            foreach (var item in config.economy.inventory)
            {
                item.quantity = 0;
                inventory[item.id] = item;
                
                if (debugMode)
                {
                    Debug.Log($"[EconomyManager] Initialized inventory item: {item.name} ({item.id})");
                }
            }
        }

        private void InitializeCatalog()
        {
            catalog = new Dictionary<string, CatalogItem>();
            
            foreach (var item in config.economy.catalog)
            {
                catalog[item.id] = item;
                
                if (debugMode)
                {
                    Debug.Log($"[EconomyManager] Initialized catalog item: {item.name} ({item.id})");
                }
            }
        }

        // Currency Management
        public bool AddCurrency(string currencyId, int amount)
        {
            if (currencies.TryGetValue(currencyId, out Currency currency))
            {
                int newAmount = Mathf.Min(currency.currentAmount + amount, currency.maximum);
                currency.currentAmount = newAmount;
                
                OnCurrencyChanged?.Invoke(currency);
                
                if (debugMode)
                {
                    Debug.Log($"[EconomyManager] Added {amount} {currency.name}. New amount: {currency.currentAmount}");
                }
                
                return true;
            }
            
            OnError?.Invoke("currency_not_found", $"Currency {currencyId} not found");
            return false;
        }

        public bool SpendCurrency(string currencyId, int amount)
        {
            if (currencies.TryGetValue(currencyId, out Currency currency))
            {
                if (currency.currentAmount >= amount)
                {
                    currency.currentAmount -= amount;
                    OnCurrencyChanged?.Invoke(currency);
                    
                    if (debugMode)
                    {
                        Debug.Log($"[EconomyManager] Spent {amount} {currency.name}. New amount: {currency.currentAmount}");
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
            return currencies.TryGetValue(currencyId, out Currency currency) ? currency.currentAmount : 0;
        }

        // Inventory Management
        public bool AddInventoryItem(string itemId, int quantity = 1)
        {
            if (inventory.TryGetValue(itemId, out InventoryItem item))
            {
                item.quantity += quantity;
                OnInventoryChanged?.Invoke(item);
                
                if (debugMode)
                {
                    Debug.Log($"[EconomyManager] Added {quantity} {item.name} to inventory. Total: {item.quantity}");
                }
                
                return true;
            }
            
            OnError?.Invoke("item_not_found", $"Item {itemId} not found");
            return false;
        }

        public bool UseInventoryItem(string itemId, int quantity = 1)
        {
            if (inventory.TryGetValue(itemId, out InventoryItem item))
            {
                if (item.quantity >= quantity)
                {
                    item.quantity -= quantity;
                    OnInventoryChanged?.Invoke(item);
                    
                    if (debugMode)
                    {
                        Debug.Log($"[EconomyManager] Used {quantity} {item.name}. Remaining: {item.quantity}");
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
            return inventory.TryGetValue(itemId, out InventoryItem item) ? item.quantity : 0;
        }

        // Purchase System
        public bool PurchaseItem(string catalogItemId)
        {
            if (catalog.TryGetValue(catalogItemId, out CatalogItem catalogItem))
            {
                // Check if player has enough currency
                if (SpendCurrency(catalogItem.cost_currency, catalogItem.cost_amount))
                {
                    // Process rewards
                    ProcessRewards(catalogItem.rewards);
                    
                    OnPurchaseCompleted?.Invoke(catalogItemId, catalogItem.cost_amount);
                    
                    if (debugMode)
                    {
                        Debug.Log($"[EconomyManager] Purchased {catalogItem.name} for {catalogItem.cost_amount} {catalogItem.cost_currency}");
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

        // Getters for UI
        public Dictionary<string, Currency> GetAllCurrencies()
        {
            return new Dictionary<string, Currency>(currencies);
        }

        public Dictionary<string, InventoryItem> GetAllInventoryItems()
        {
            return new Dictionary<string, InventoryItem>(inventory);
        }

        public Dictionary<string, CatalogItem> GetAllCatalogItems()
        {
            return new Dictionary<string, CatalogItem>(catalog);
        }

        public Currency GetCurrency(string currencyId)
        {
            return currencies.TryGetValue(currencyId, out Currency currency) ? currency : null;
        }

        public InventoryItem GetInventoryItem(string itemId)
        {
            return inventory.TryGetValue(itemId, out InventoryItem item) ? item : null;
        }

        public CatalogItem GetCatalogItem(string catalogItemId)
        {
            return catalog.TryGetValue(catalogItemId, out CatalogItem item) ? item : null;
        }

        private void LogEconomyStatus()
        {
            Debug.Log("=== ECONOMY STATUS ===");
            Debug.Log($"License Type: {config.licenseType}");
            Debug.Log($"Cloud Services Available: {config.cloudServicesAvailable}");
            Debug.Log($"Currencies: {currencies.Count}");
            Debug.Log($"Inventory Items: {inventory.Count}");
            Debug.Log($"Catalog Items: {catalog.Count}");
            Debug.Log("=====================");
        }
    }
}
