using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using Evergreen.Core;

namespace Evergreen.Economy
{
    /// <summary>
    /// Runtime economy manager that loads and manages economy data from generated assets
    /// Integrates with Unity Economy Service and provides unified economy interface
    /// </summary>
    public class RuntimeEconomyManager : MonoBehaviour
    {
        [Header("Economy Settings")]
        [SerializeField] private bool enableUnityEconomy = false; // Disabled - using local fallback
        [SerializeField] private bool enableLocalFallback = true;
        [SerializeField] private bool enableDebugLogs = true;
        
        [Header("Data Sources")]
        [SerializeField] private bool loadFromScriptableObjects = true;
        [SerializeField] private bool loadFromJSON = true;
        [SerializeField] private bool loadFromUnityEconomy = true;
        
        private Dictionary<string, EconomyItemSO> _economyItems = new Dictionary<string, EconomyItemSO>();
        private Dictionary<string, int> _localBalances = new Dictionary<string, int>();
        private Dictionary<string, int> _localInventory = new Dictionary<string, int>();
        private UnityEconomyIntegration _unityEconomyIntegration;
        private EconomyDataCollection _economyData;
        
        // Events
        public System.Action<string, int> OnBalanceChanged;
        public System.Action<string, int> OnInventoryChanged;
        public System.Action<EconomyItemSO> OnItemPurchased;
        public System.Action<string> OnEconomyDataLoaded;
        
        public static RuntimeEconomyManager Instance { get; private set; }
        
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
        
        async void Start()
        {
            await InitializeEconomyManager();
        }
        
        /// <summary>
        /// Initialize the economy manager
        /// </summary>
        public async System.Threading.Tasks.Task InitializeEconomyManager()
        {
            try
            {
                if (enableDebugLogs)
                    Debug.Log("Initializing Runtime Economy Manager...");
                
                // Load economy data
                LoadEconomyData();
                
                // Initialize Unity Economy integration
                if (enableUnityEconomy)
                {
                    _unityEconomyIntegration = GetComponent<UnityEconomyIntegration>();
                    if (_unityEconomyIntegration == null)
                    {
                        _unityEconomyIntegration = gameObject.AddComponent<UnityEconomyIntegration>();
                    }
                    
                    // Subscribe to Unity Economy events
                    _unityEconomyIntegration.OnBalanceChanged += OnUnityEconomyBalanceChanged;
                    _unityEconomyIntegration.OnInventoryChanged += OnUnityEconomyInventoryChanged;
                    _unityEconomyIntegration.OnPurchaseCompleted += OnUnityEconomyPurchaseCompleted;
                }
                
                // Initialize local balances
                InitializeLocalBalances();
                
                OnEconomyDataLoaded?.Invoke("economy_data_loaded");
                
                if (enableDebugLogs)
                    Debug.Log($"Runtime Economy Manager initialized with {_economyItems.Count} items");
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to initialize Runtime Economy Manager: {e.Message}");
                throw;
            }
        }
        
        /// <summary>
        /// Load economy data from various sources
        /// </summary>
        private void LoadEconomyData()
        {
            _economyItems.Clear();
            
            // Load from ScriptableObjects
            if (loadFromScriptableObjects)
            {
                LoadFromScriptableObjects();
            }
            
            // Load from JSON
            if (loadFromJSON)
            {
                LoadFromJSON();
            }
            
            if (enableDebugLogs)
                Debug.Log($"Loaded {_economyItems.Count} economy items");
        }
        
        /// <summary>
        /// Load economy items from ScriptableObjects
        /// </summary>
        private void LoadFromScriptableObjects()
        {
            try
            {
                var scriptableObjects = Resources.LoadAll<EconomyItemSO>("Economy");
                
                foreach (var item in scriptableObjects)
                {
                    if (item != null && item.IsValid())
                    {
                        _economyItems[item.itemId] = item;
                    }
                }
                
                if (enableDebugLogs)
                    Debug.Log($"Loaded {scriptableObjects.Length} items from ScriptableObjects");
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to load ScriptableObjects: {e.Message}");
            }
        }
        
        /// <summary>
        /// Load economy data from JSON
        /// </summary>
        private void LoadFromJSON()
        {
            try
            {
                string jsonPath = System.IO.Path.Combine(Application.streamingAssetsPath, "economy_data.json");
                
                if (System.IO.File.Exists(jsonPath))
                {
                    string json = System.IO.File.ReadAllText(jsonPath);
                    _economyData = JsonUtility.FromJson<EconomyDataCollection>(json);
                    
                    // Convert JSON data to ScriptableObjects for consistency
                    foreach (var itemData in _economyData.items)
                    {
                        if (!_economyItems.ContainsKey(itemData.id))
                        {
                            var itemSO = ScriptableObject.CreateInstance<EconomyItemSO>();
                            itemSO.Initialize(itemData);
                            _economyItems[itemData.id] = itemSO;
                        }
                    }
                    
                    if (enableDebugLogs)
                        Debug.Log($"Loaded {_economyData.items.Count} items from JSON");
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to load JSON data: {e.Message}");
            }
        }
        
        /// <summary>
        /// Initialize local balances for fallback mode
        /// </summary>
        private void InitializeLocalBalances()
        {
            if (!enableLocalFallback) return;
            
            // Initialize default currencies
            _localBalances["coins"] = 1000;
            _localBalances["gems"] = 50;
            _localBalances["energy"] = 5;
            
            if (enableDebugLogs)
                Debug.Log("Initialized local balances for fallback mode");
        }
        
        /// <summary>
        /// Get economy item by ID
        /// </summary>
        public EconomyItemSO GetEconomyItem(string itemId)
        {
            return _economyItems.ContainsKey(itemId) ? _economyItems[itemId] : null;
        }
        
        /// <summary>
        /// Get all economy items
        /// </summary>
        public List<EconomyItemSO> GetAllEconomyItems()
        {
            return _economyItems.Values.ToList();
        }
        
        /// <summary>
        /// Get economy items by type
        /// </summary>
        public List<EconomyItemSO> GetEconomyItemsByType(string type)
        {
            return _economyItems.Values.Where(item => item.itemType == type).ToList();
        }
        
        /// <summary>
        /// Get economy items by category
        /// </summary>
        public List<EconomyItemSO> GetEconomyItemsByCategory(string category)
        {
            return _economyItems.Values.Where(item => item.category == category).ToList();
        }
        
        /// <summary>
        /// Get player balance for a currency
        /// </summary>
        public int GetPlayerBalance(string currencyId)
        {
            if (enableUnityEconomy && _unityEconomyIntegration != null)
            {
                return _unityEconomyIntegration.GetPlayerBalance(currencyId);
            }
            else if (enableLocalFallback)
            {
                return _localBalances.ContainsKey(currencyId) ? _localBalances[currencyId] : 0;
            }
            
            return 0;
        }
        
        /// <summary>
        /// Get player inventory count for an item
        /// </summary>
        public int GetPlayerInventoryCount(string itemId)
        {
            if (enableUnityEconomy && _unityEconomyIntegration != null)
            {
                return _unityEconomyIntegration.GetPlayerInventoryCount(itemId);
            }
            else if (enableLocalFallback)
            {
                return _localInventory.ContainsKey(itemId) ? _localInventory[itemId] : 0;
            }
            
            return 0;
        }
        
        /// <summary>
        /// Purchase an item
        /// </summary>
        public async System.Threading.Tasks.Task<bool> PurchaseItem(string itemId)
        {
            var item = GetEconomyItem(itemId);
            if (item == null)
            {
                Debug.LogError($"Item not found: {itemId}");
                return false;
            }
            
            if (!item.isPurchasable)
            {
                Debug.LogWarning($"Item is not purchasable: {itemId}");
                return false;
            }
            
            // Check if player can afford the item
            if (!item.CanAfford(GetPlayerBalance("gems"), GetPlayerBalance("coins")))
            {
                Debug.LogWarning($"Insufficient funds for item: {itemId}");
                return false;
            }
            
            try
            {
                if (enableUnityEconomy && _unityEconomyIntegration != null)
                {
                    // Use Unity Economy for purchase
                    string purchaseId = $"purchase_{itemId}";
                    return await _unityEconomyIntegration.PurchaseItem(purchaseId);
                }
                else if (enableLocalFallback)
                {
                    // Use local fallback for purchase
                    return ProcessLocalPurchase(item);
                }
                
                return false;
            }
            catch (Exception e)
            {
                Debug.LogError($"Purchase failed: {e.Message}");
                return false;
            }
        }
        
        /// <summary>
        /// Process local purchase (fallback mode)
        /// </summary>
        private bool ProcessLocalPurchase(EconomyItemSO item)
        {
            try
            {
                // Deduct costs
                if (item.costGems > 0)
                {
                    _localBalances["gems"] -= item.costGems;
                    OnBalanceChanged?.Invoke("gems", _localBalances["gems"]);
                }
                
                if (item.costCoins > 0)
                {
                    _localBalances["coins"] -= item.costCoins;
                    OnBalanceChanged?.Invoke("coins", _localBalances["coins"]);
                }
                
                // Add rewards
                if (item.IsCurrency())
                {
                    _localBalances[item.itemId] = (_localBalances.ContainsKey(item.itemId) ? _localBalances[item.itemId] : 0) + item.quantity;
                    OnBalanceChanged?.Invoke(item.itemId, _localBalances[item.itemId]);
                }
                else if (item.IsBooster() || item.IsPack())
                {
                    _localInventory[item.itemId] = (_localInventory.ContainsKey(item.itemId) ? _localInventory[item.itemId] : 0) + item.quantity;
                    OnInventoryChanged?.Invoke(item.itemId, _localInventory[item.itemId]);
                }
                
                OnItemPurchased?.Invoke(item);
                
                if (enableDebugLogs)
                    Debug.Log($"Local purchase successful: {item.itemName}");
                
                return true;
            }
            catch (Exception e)
            {
                Debug.LogError($"Local purchase failed: {e.Message}");
                return false;
            }
        }
        
        /// <summary>
        /// Add currency to player balance
        /// </summary>
        public async System.Threading.Tasks.Task<bool> AddCurrency(string currencyId, int amount)
        {
            if (enableUnityEconomy && _unityEconomyIntegration != null)
            {
                return await _unityEconomyIntegration.AddCurrency(currencyId, amount);
            }
            else if (enableLocalFallback)
            {
                _localBalances[currencyId] = (_localBalances.ContainsKey(currencyId) ? _localBalances[currencyId] : 0) + amount;
                OnBalanceChanged?.Invoke(currencyId, _localBalances[currencyId]);
                return true;
            }
            
            return false;
        }
        
        /// <summary>
        /// Spend currency from player balance
        /// </summary>
        public async System.Threading.Tasks.Task<bool> SpendCurrency(string currencyId, int amount)
        {
            if (enableUnityEconomy && _unityEconomyIntegration != null)
            {
                return await _unityEconomyIntegration.SpendCurrency(currencyId, amount);
            }
            else if (enableLocalFallback)
            {
                int currentBalance = GetPlayerBalance(currencyId);
                if (currentBalance >= amount)
                {
                    _localBalances[currencyId] -= amount;
                    OnBalanceChanged?.Invoke(currencyId, _localBalances[currencyId]);
                    return true;
                }
                return false;
            }
            
            return false;
        }
        
        /// <summary>
        /// Use/consume an inventory item
        /// </summary>
        public async System.Threading.Tasks.Task<bool> UseInventoryItem(string itemId, int quantity = 1)
        {
            if (enableUnityEconomy && _unityEconomyIntegration != null)
            {
                return await _unityEconomyIntegration.UseInventoryItem(itemId, quantity);
            }
            else if (enableLocalFallback)
            {
                int currentCount = GetPlayerInventoryCount(itemId);
                if (currentCount >= quantity)
                {
                    _localInventory[itemId] -= quantity;
                    OnInventoryChanged?.Invoke(itemId, _localInventory[itemId]);
                    return true;
                }
                return false;
            }
            
            return false;
        }
        
        /// <summary>
        /// Get available purchases for player
        /// </summary>
        public List<EconomyItemSO> GetAvailablePurchases()
        {
            return _economyItems.Values
                .Where(item => item.isPurchasable)
                .Where(item => item.CanAfford(GetPlayerBalance("gems"), GetPlayerBalance("coins")))
                .ToList();
        }
        
        /// <summary>
        /// Get economy status
        /// </summary>
        public Dictionary<string, object> GetEconomyStatus()
        {
            var status = new Dictionary<string, object>
            {
                { "itemsCount", _economyItems.Count },
                { "unityEconomyEnabled", enableUnityEconomy },
                { "localFallbackEnabled", enableLocalFallback },
                { "dataVersion", _economyData?.version ?? "unknown" },
                { "lastUpdated", _economyData?.lastUpdated ?? "unknown" }
            };
            
            if (enableUnityEconomy && _unityEconomyIntegration != null)
            {
                var unityStatus = _unityEconomyIntegration.GetEconomyStatus();
                foreach (var kvp in unityStatus)
                {
                    status[$"unity_{kvp.Key}"] = kvp.Value;
                }
            }
            
            return status;
        }
        
        // Unity Economy event handlers
        private void OnUnityEconomyBalanceChanged(string currencyId, int balance)
        {
            OnBalanceChanged?.Invoke(currencyId, balance);
        }
        
        private void OnUnityEconomyInventoryChanged(string itemId, int count)
        {
            OnInventoryChanged?.Invoke(itemId, count);
        }
        
        private void OnUnityEconomyPurchaseCompleted(string purchaseId, bool success)
        {
            if (success)
            {
                string itemId = purchaseId.Replace("purchase_", "");
                var item = GetEconomyItem(itemId);
                if (item != null)
                {
                    OnItemPurchased?.Invoke(item);
                }
            }
        }
        
        void OnDestroy()
        {
            if (_unityEconomyIntegration != null)
            {
                _unityEconomyIntegration.OnBalanceChanged -= OnUnityEconomyBalanceChanged;
                _unityEconomyIntegration.OnInventoryChanged -= OnUnityEconomyInventoryChanged;
                _unityEconomyIntegration.OnPurchaseCompleted -= OnUnityEconomyPurchaseCompleted;
            }
        }
    }
}