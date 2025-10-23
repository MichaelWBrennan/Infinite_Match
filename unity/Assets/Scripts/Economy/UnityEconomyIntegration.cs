using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using Unity.Services.Authentication;
using Unity.Services.CloudCode;
using Unity.Services.Economy;
using Unity.Services.Economy.Model;
using Unity.Services.Core;
using System.Threading.Tasks;

namespace Evergreen.Economy
{
    /// <summary>
    /// Unity Economy Service integration for automated economy management
    /// Handles authentication, currency management, and purchases
    /// </summary>
    public class UnityEconomyIntegration : MonoBehaviour
    {
        [Header("Economy Configuration")]
        [SerializeField] private bool enableUnityEconomy = true;
        [SerializeField] private bool enableAuthentication = true;
        [SerializeField] private bool enableCloudCode = true;
        [SerializeField] private string projectId;
        [SerializeField] private string environmentId;
        
        [Header("Debug Settings")]
        [SerializeField] private bool enableDebugLogs = true;
        [SerializeField] private bool enableTestMode = false;
        
        private bool _isInitialized = false;
        private bool _isAuthenticated = false;
        private Dictionary<string, PlayerBalance> _playerBalances = new Dictionary<string, PlayerBalance>();
        private Dictionary<string, PlayerInventoryItem> _playerInventory = new Dictionary<string, PlayerInventoryItem>();
        
        // Events
        public System.Action OnInitialized;
        public System.Action OnAuthenticated;
        public System.Action<string, int> OnBalanceChanged;
        public System.Action<string, int> OnInventoryChanged;
        public System.Action<string, bool> OnPurchaseCompleted;
        
        public static UnityEconomyIntegration Instance { get; private set; }
        
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
            if (enableUnityEconomy)
            {
                await InitializeUnityServices();
            }
        }
        
        /// <summary>
        /// Initialize Unity Services
        /// </summary>
        public async Task InitializeUnityServices()
        {
            try
            {
                if (enableDebugLogs)
                    Debug.Log("Initializing Unity Services...");
                
                // Initialize Unity Services
                await UnityServices.InitializeAsync();
                
                if (enableAuthentication)
                {
                    await InitializeAuthentication();
                }
                
                if (enableUnityEconomy)
                {
                    await InitializeEconomy();
                }
                
                _isInitialized = true;
                OnInitialized?.Invoke();
                
                if (enableDebugLogs)
                    Debug.Log("Unity Services initialized successfully");
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to initialize Unity Services: {e.Message}");
                throw;
            }
        }
        
        /// <summary>
        /// Initialize Unity Authentication with account linking
        /// </summary>
        private async Task InitializeAuthentication()
        {
            try
            {
                if (enableDebugLogs)
                    Debug.Log("Initializing Unity Authentication...");
                
                // Check if player is already authenticated with account system
                string playerId = GetStoredPlayerId();
                
                if (!string.IsNullOrEmpty(playerId))
                {
                    // Link with existing account
                    await LinkWithAccount(playerId);
                }
                else
                {
                    // Sign in anonymously and create account
                    await AuthenticationService.Instance.SignInAnonymouslyAsync();
                    playerId = AuthenticationService.Instance.PlayerId;
                    StorePlayerId(playerId);
                }
                
                _isAuthenticated = true;
                OnAuthenticated?.Invoke();
                
                if (enableDebugLogs)
                    Debug.Log($"Authentication successful. Player ID: {playerId}");
            }
            catch (Exception e)
            {
                Debug.LogError($"Authentication failed: {e.Message}");
                throw;
            }
        }
        
        /// <summary>
        /// Link Unity player with account system
        /// </summary>
        private async Task LinkWithAccount(string playerId)
        {
            try
            {
                // Initialize account economy
                await InitializeAccountEconomy(playerId);
                
                if (enableDebugLogs)
                    Debug.Log($"Account linked successfully: {playerId}");
            }
            catch (Exception e)
            {
                Debug.LogError($"Account linking failed: {e.Message}");
                throw;
            }
        }
        
        /// <summary>
        /// Initialize account economy system
        /// </summary>
        private async Task InitializeAccountEconomy(string playerId)
        {
            try
            {
                // This would call your backend API to initialize player economy
                // For now, we'll simulate the initialization
                if (enableDebugLogs)
                    Debug.Log($"Initializing account economy for player: {playerId}");
                
                // In a real implementation, you would make an API call here
                // await CallBackendAPI("/api/account-economy/initialize", new { playerId });
            }
            catch (Exception e)
            {
                Debug.LogError($"Account economy initialization failed: {e.Message}");
                throw;
            }
        }
        
        /// <summary>
        /// Get stored player ID
        /// </summary>
        private string GetStoredPlayerId()
        {
            return PlayerPrefs.GetString("player_id", "");
        }
        
        /// <summary>
        /// Store player ID
        /// </summary>
        private void StorePlayerId(string playerId)
        {
            PlayerPrefs.SetString("player_id", playerId);
            PlayerPrefs.Save();
        }
        
        /// <summary>
        /// Initialize Unity Economy
        /// </summary>
        private async Task InitializeEconomy()
        {
            try
            {
                if (enableDebugLogs)
                    Debug.Log("Initializing Unity Economy...");
                
                // Load player balances
                await LoadPlayerBalances();
                
                // Load player inventory
                await LoadPlayerInventory();
                
                if (enableDebugLogs)
                    Debug.Log("Unity Economy initialized successfully");
            }
            catch (Exception e)
            {
                Debug.LogError($"Economy initialization failed: {e.Message}");
                throw;
            }
        }
        
        /// <summary>
        /// Load player balances from Unity Economy
        /// </summary>
        public async Task LoadPlayerBalances()
        {
            try
            {
                var balances = await EconomyService.Instance.PlayerBalances.GetBalancesAsync();
                
                _playerBalances.Clear();
                foreach (var balance in balances)
                {
                    _playerBalances[balance.CurrencyId] = balance;
                }
                
                if (enableDebugLogs)
                    Debug.Log($"Loaded {_playerBalances.Count} player balances");
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to load player balances: {e.Message}");
            }
        }
        
        /// <summary>
        /// Load player inventory from Unity Economy
        /// </summary>
        public async Task LoadPlayerInventory()
        {
            try
            {
                var inventory = await EconomyService.Instance.PlayerInventory.GetInventoryAsync();
                
                _playerInventory.Clear();
                foreach (var item in inventory)
                {
                    _playerInventory[item.InventoryItemId] = item;
                }
                
                if (enableDebugLogs)
                    Debug.Log($"Loaded {_playerInventory.Count} inventory items");
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to load player inventory: {e.Message}");
            }
        }
        
        /// <summary>
        /// Get player balance for a specific currency
        /// </summary>
        public int GetPlayerBalance(string currencyId)
        {
            if (_playerBalances.ContainsKey(currencyId))
            {
                return _playerBalances[currencyId].Balance;
            }
            return 0;
        }
        
        /// <summary>
        /// Get player inventory count for a specific item
        /// </summary>
        public int GetPlayerInventoryCount(string itemId)
        {
            if (_playerInventory.ContainsKey(itemId))
            {
                return _playerInventory[itemId].Count;
            }
            return 0;
        }
        
        /// <summary>
        /// Purchase an item using Unity Economy
        /// </summary>
        public async Task<bool> PurchaseItem(string purchaseId)
        {
            try
            {
                if (!_isAuthenticated)
                {
                    Debug.LogError("Player not authenticated. Cannot make purchase.");
                    return false;
                }
                
                if (enableDebugLogs)
                    Debug.Log($"Attempting to purchase: {purchaseId}");
                
                // Make the purchase
                var result = await EconomyService.Instance.Purchases.MakePurchaseAsync(purchaseId);
                
                if (result.Status == TransactionStatus.Success)
                {
                    // Refresh balances and inventory
                    await LoadPlayerBalances();
                    await LoadPlayerInventory();
                    
                    OnPurchaseCompleted?.Invoke(purchaseId, true);
                    
                    if (enableDebugLogs)
                        Debug.Log($"Purchase successful: {purchaseId}");
                    
                    return true;
                }
                else
                {
                    Debug.LogWarning($"Purchase failed: {purchaseId} - Status: {result.Status}");
                    OnPurchaseCompleted?.Invoke(purchaseId, false);
                    return false;
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"Purchase error: {e.Message}");
                OnPurchaseCompleted?.Invoke(purchaseId, false);
                return false;
            }
        }
        
        /// <summary>
        /// Add currency to player balance (for testing or rewards)
        /// </summary>
        public async Task<bool> AddCurrency(string currencyId, int amount)
        {
            try
            {
                if (enableTestMode)
                {
                    // In test mode, just update local balance
                    if (_playerBalances.ContainsKey(currencyId))
                    {
                        _playerBalances[currencyId].Balance += amount;
                    }
                    else
                    {
                        // Create new balance entry
                        _playerBalances[currencyId] = new PlayerBalance
                        {
                            CurrencyId = currencyId,
                            Balance = amount
                        };
                    }
                    
                    OnBalanceChanged?.Invoke(currencyId, _playerBalances[currencyId].Balance);
                    return true;
                }
                else
                {
                    // Use Cloud Code to add currency
                    var result = await CloudCodeService.Instance.CallEndpointAsync<AddCurrencyResult>("AddCurrency", new Dictionary<string, object>
                    {
                        { "currencyId", currencyId },
                        { "amount", amount }
                    });
                    
                    if (result.Success)
                    {
                        await LoadPlayerBalances();
                        OnBalanceChanged?.Invoke(currencyId, GetPlayerBalance(currencyId));
                        return true;
                    }
                    else
                    {
                        Debug.LogError($"Failed to add currency: {result.ErrorMessage}");
                        return false;
                    }
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"Add currency error: {e.Message}");
                return false;
            }
        }
        
        /// <summary>
        /// Spend currency from player balance
        /// </summary>
        public async Task<bool> SpendCurrency(string currencyId, int amount)
        {
            try
            {
                int currentBalance = GetPlayerBalance(currencyId);
                if (currentBalance < amount)
                {
                    Debug.LogWarning($"Insufficient balance. Required: {amount}, Available: {currentBalance}");
                    return false;
                }
                
                if (enableTestMode)
                {
                    // In test mode, just update local balance
                    _playerBalances[currencyId].Balance -= amount;
                    OnBalanceChanged?.Invoke(currencyId, _playerBalances[currencyId].Balance);
                    return true;
                }
                else
                {
                    // Use Cloud Code to spend currency
                    var result = await CloudCodeService.Instance.CallEndpointAsync<SpendCurrencyResult>("SpendCurrency", new Dictionary<string, object>
                    {
                        { "currencyId", currencyId },
                        { "amount", amount }
                    });
                    
                    if (result.Success)
                    {
                        await LoadPlayerBalances();
                        OnBalanceChanged?.Invoke(currencyId, GetPlayerBalance(currencyId));
                        return true;
                    }
                    else
                    {
                        Debug.LogError($"Failed to spend currency: {result.ErrorMessage}");
                        return false;
                    }
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"Spend currency error: {e.Message}");
                return false;
            }
        }
        
        /// <summary>
        /// Add item to player inventory
        /// </summary>
        public async Task<bool> AddInventoryItem(string itemId, int quantity = 1)
        {
            try
            {
                if (enableTestMode)
                {
                    // In test mode, just update local inventory
                    if (_playerInventory.ContainsKey(itemId))
                    {
                        _playerInventory[itemId].Count += quantity;
                    }
                    else
                    {
                        _playerInventory[itemId] = new PlayerInventoryItem
                        {
                            InventoryItemId = itemId,
                            Count = quantity
                        };
                    }
                    
                    OnInventoryChanged?.Invoke(itemId, _playerInventory[itemId].Count);
                    return true;
                }
                else
                {
                    // Use Cloud Code to add inventory item
                    var result = await CloudCodeService.Instance.CallEndpointAsync<AddInventoryItemResult>("AddInventoryItem", new Dictionary<string, object>
                    {
                        { "itemId", itemId },
                        { "quantity", quantity }
                    });
                    
                    if (result.Success)
                    {
                        await LoadPlayerInventory();
                        OnInventoryChanged?.Invoke(itemId, GetPlayerInventoryCount(itemId));
                        return true;
                    }
                    else
                    {
                        Debug.LogError($"Failed to add inventory item: {result.ErrorMessage}");
                        return false;
                    }
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"Add inventory item error: {e.Message}");
                return false;
            }
        }
        
        /// <summary>
        /// Use/consume an inventory item
        /// </summary>
        public async Task<bool> UseInventoryItem(string itemId, int quantity = 1)
        {
            try
            {
                int currentCount = GetPlayerInventoryCount(itemId);
                if (currentCount < quantity)
                {
                    Debug.LogWarning($"Insufficient inventory. Required: {quantity}, Available: {currentCount}");
                    return false;
                }
                
                if (enableTestMode)
                {
                    // In test mode, just update local inventory
                    _playerInventory[itemId].Count -= quantity;
                    OnInventoryChanged?.Invoke(itemId, _playerInventory[itemId].Count);
                    return true;
                }
                else
                {
                    // Use Cloud Code to consume inventory item
                    var result = await CloudCodeService.Instance.CallEndpointAsync<UseInventoryItemResult>("UseInventoryItem", new Dictionary<string, object>
                    {
                        { "itemId", itemId },
                        { "quantity", quantity }
                    });
                    
                    if (result.Success)
                    {
                        await LoadPlayerInventory();
                        OnInventoryChanged?.Invoke(itemId, GetPlayerInventoryCount(itemId));
                        return true;
                    }
                    else
                    {
                        Debug.LogError($"Failed to use inventory item: {result.ErrorMessage}");
                        return false;
                    }
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"Use inventory item error: {e.Message}");
                return false;
            }
        }
        
        /// <summary>
        /// Get all available purchases
        /// </summary>
        public async Task<List<PurchaseDefinition>> GetAvailablePurchases()
        {
            try
            {
                var purchases = await EconomyService.Instance.Purchases.GetPurchasesAsync();
                return purchases.ToList();
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to get purchases: {e.Message}");
                return new List<PurchaseDefinition>();
            }
        }
        
        /// <summary>
        /// Check if player can afford a purchase
        /// </summary>
        public bool CanAffordPurchase(string purchaseId)
        {
            // This would need to be implemented based on your specific purchase requirements
            // For now, return true for testing
            return true;
        }
        
        /// <summary>
        /// Sync economy data with account system
        /// </summary>
        public async Task<bool> SyncWithAccount()
        {
            try
            {
                if (!_isAuthenticated)
                {
                    Debug.LogError("Player not authenticated. Cannot sync with account.");
                    return false;
                }
                
                string playerId = GetStoredPlayerId();
                if (string.IsNullOrEmpty(playerId))
                {
                    Debug.LogError("No player ID found. Cannot sync with account.");
                    return false;
                }
                
                // Prepare Unity economy data for sync
                var unityData = new Dictionary<string, object>
                {
                    { "currencies", GetCurrenciesData() },
                    { "inventory", GetInventoryData() },
                    { "timestamp", DateTime.Now.ToString("O") }
                };
                
                // In a real implementation, you would call your backend API here
                // var result = await CallBackendAPI("/api/account-economy/sync/unity", unityData);
                
                if (enableDebugLogs)
                    Debug.Log($"Economy synced with account for player: {playerId}");
                
                return true;
            }
            catch (Exception e)
            {
                Debug.LogError($"Account sync failed: {e.Message}");
                return false;
            }
        }
        
        /// <summary>
        /// Load economy data from account system
        /// </summary>
        public async Task<bool> LoadFromAccount()
        {
            try
            {
                if (!_isAuthenticated)
                {
                    Debug.LogError("Player not authenticated. Cannot load from account.");
                    return false;
                }
                
                string playerId = GetStoredPlayerId();
                if (string.IsNullOrEmpty(playerId))
                {
                    Debug.LogError("No player ID found. Cannot load from account.");
                    return false;
                }
                
                // In a real implementation, you would call your backend API here
                // var accountData = await CallBackendAPI("/api/account-economy/data", new { playerId });
                
                // For now, we'll simulate loading from account
                if (enableDebugLogs)
                    Debug.Log($"Economy data loaded from account for player: {playerId}");
                
                return true;
            }
            catch (Exception e)
            {
                Debug.LogError($"Load from account failed: {e.Message}");
                return false;
            }
        }
        
        /// <summary>
        /// Get currencies data for sync
        /// </summary>
        private Dictionary<string, int> GetCurrenciesData()
        {
            var currencies = new Dictionary<string, int>();
            foreach (var balance in _playerBalances.Values)
            {
                currencies[balance.CurrencyId] = balance.Balance;
            }
            return currencies;
        }
        
        /// <summary>
        /// Get inventory data for sync
        /// </summary>
        private Dictionary<string, Dictionary<string, int>> GetInventoryData()
        {
            var inventory = new Dictionary<string, Dictionary<string, int>>();
            
            // Group inventory items by category
            var powerups = new Dictionary<string, int>();
            var boosters = new Dictionary<string, int>();
            var decorations = new Dictionary<string, int>();
            
            foreach (var item in _playerInventory.Values)
            {
                // Categorize items based on their ID or type
                if (item.InventoryItemId.Contains("powerup") || item.InventoryItemId.Contains("bomb") || 
                    item.InventoryItemId.Contains("rocket") || item.InventoryItemId.Contains("rainbow"))
                {
                    powerups[item.InventoryItemId] = item.Count;
                }
                else if (item.InventoryItemId.Contains("booster") || item.InventoryItemId.Contains("extra_moves"))
                {
                    boosters[item.InventoryItemId] = item.Count;
                }
                else
                {
                    decorations[item.InventoryItemId] = item.Count;
                }
            }
            
            inventory["powerups"] = powerups;
            inventory["boosters"] = boosters;
            inventory["decorations"] = decorations;
            
            return inventory;
        }
        
        /// <summary>
        /// Call backend API (placeholder for real implementation)
        /// </summary>
        private async Task<object> CallBackendAPI(string endpoint, object data)
        {
            // This would be implemented with your actual HTTP client
            // For now, return a mock response
            await Task.Delay(100); // Simulate API call delay
            return new { success = true };
        }

        /// <summary>
        /// Get economy status
        /// </summary>
        public Dictionary<string, object> GetEconomyStatus()
        {
            return new Dictionary<string, object>
            {
                { "isInitialized", _isInitialized },
                { "isAuthenticated", _isAuthenticated },
                { "playerId", GetStoredPlayerId() },
                { "balanceCount", _playerBalances.Count },
                { "inventoryCount", _playerInventory.Count },
                { "testMode", enableTestMode },
                { "accountLinked", !string.IsNullOrEmpty(GetStoredPlayerId()) }
            };
        }
        
        // Cloud Code result classes
        [System.Serializable]
        public class AddCurrencyResult
        {
            public bool Success;
            public string ErrorMessage;
        }
        
        [System.Serializable]
        public class SpendCurrencyResult
        {
            public bool Success;
            public string ErrorMessage;
        }
        
        [System.Serializable]
        public class AddInventoryItemResult
        {
            public bool Success;
            public string ErrorMessage;
        }
        
        [System.Serializable]
        public class UseInventoryItemResult
        {
            public bool Success;
            public string ErrorMessage;
        }
    }
}