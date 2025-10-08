using UnityEngine;
using Economy;
using CloudCode;
using RemoteConfig;
using UI;

public class GameManager : MonoBehaviour
{
    [Header("Game Settings")]
    public bool debugMode = true;
    
    [Header("Managers")]
    public EconomyManager economyManager;
    public CloudCodeManager cloudCodeManager;
    public RemoteConfigManager remoteConfigManager;
    public EconomyUI economyUI;
    
    public static GameManager Instance { get; private set; }
    
    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
            InitializeGame();
        }
        else
        {
            Destroy(gameObject);
        }
    }
    
    private void InitializeGame()
    {
        if (debugMode)
        {
            Debug.Log("[GameManager] Initializing game...");
        }
        
        // Initialize all managers
        InitializeManagers();
        
        // Set up event listeners
        SetupEventListeners();
        
        // Test the system
        if (debugMode)
        {
            TestSystem();
        }
    }
    
    private void InitializeManagers()
    {
        // Economy Manager
        if (economyManager == null)
        {
            economyManager = FindObjectOfType<EconomyManager>();
        }
        
        // Cloud Code Manager
        if (cloudCodeManager == null)
        {
            cloudCodeManager = FindObjectOfType<CloudCodeManager>();
        }
        
        // Remote Config Manager
        if (remoteConfigManager == null)
        {
            remoteConfigManager = FindObjectOfType<RemoteConfigManager>();
        }
        
        // Economy UI
        if (economyUI == null)
        {
            economyUI = FindObjectOfType<EconomyUI>();
        }
    }
    
    private void SetupEventListeners()
    {
        // Economy events
        EconomyManager.OnCurrencyChanged += OnCurrencyChanged;
        EconomyManager.OnInventoryChanged += OnInventoryChanged;
        EconomyManager.OnPurchaseCompleted += OnPurchaseCompleted;
        EconomyManager.OnError += OnEconomyError;
        
        // Cloud Code events
        CloudCodeManager.OnCloudCodeResult += OnCloudCodeResult;
        CloudCodeManager.OnCloudCodeError += OnCloudCodeError;
        
        // Remote Config events
        RemoteConfigManager.OnConfigUpdated += OnConfigUpdated;
        RemoteConfigManager.OnConfigError += OnConfigError;
    }
    
    private void OnDestroy()
    {
        // Unsubscribe from events
        EconomyManager.OnCurrencyChanged -= OnCurrencyChanged;
        EconomyManager.OnInventoryChanged -= OnInventoryChanged;
        EconomyManager.OnPurchaseCompleted -= OnPurchaseCompleted;
        EconomyManager.OnError -= OnEconomyError;
        
        CloudCodeManager.OnCloudCodeResult -= OnCloudCodeResult;
        CloudCodeManager.OnCloudCodeError -= OnCloudCodeError;
        
        RemoteConfigManager.OnConfigUpdated -= OnConfigUpdated;
        RemoteConfigManager.OnConfigError -= OnConfigError;
    }
    
    // Event handlers
    private void OnCurrencyChanged(Currency currency)
    {
        if (debugMode)
        {
            Debug.Log($"[GameManager] Currency changed: {currency.name} = {currency.currentAmount}");
        }
    }
    
    private void OnInventoryChanged(InventoryItem item)
    {
        if (debugMode)
        {
            Debug.Log($"[GameManager] Inventory changed: {item.name} x{item.quantity}");
        }
    }
    
    private void OnPurchaseCompleted(string itemId, int cost)
    {
        if (debugMode)
        {
            Debug.Log($"[GameManager] Purchase completed: {itemId} for {cost}");
        }
    }
    
    private void OnEconomyError(string errorType, string message)
    {
        Debug.LogError($"[GameManager] Economy Error: {errorType} - {message}");
    }
    
    private void OnCloudCodeResult(string functionName, bool success)
    {
        if (debugMode)
        {
            Debug.Log($"[GameManager] Cloud Code Result: {functionName} - Success: {success}");
        }
    }
    
    private void OnCloudCodeError(string functionName, string error)
    {
        Debug.LogError($"[GameManager] Cloud Code Error: {functionName} - {error}");
    }
    
    private void OnConfigUpdated(RemoteConfigData config)
    {
        if (debugMode)
        {
            Debug.Log("[GameManager] Remote Config updated");
        }
    }
    
    private void OnConfigError(string error)
    {
        Debug.LogError($"[GameManager] Remote Config Error: {error}");
    }
    
    private void TestSystem()
    {
        Debug.Log("[GameManager] Testing economy system...");
        
        // Test currency operations
        if (economyManager != null)
        {
            economyManager.AddCurrency("coins", 500);
            economyManager.AddCurrency("gems", 25);
            economyManager.AddInventoryItem("booster_extra_moves", 3);
        }
        
        // Test Cloud Code
        if (cloudCodeManager != null)
        {
            cloudCodeManager.AddCurrency("test_player", "coins", 100);
        }
        
        // Test Remote Config
        if (remoteConfigManager != null)
        {
            bool adsEnabled = remoteConfigManager.GetBool("ads_enabled");
            int maxEnergy = remoteConfigManager.GetInt("max_energy");
            float difficulty = remoteConfigManager.GetFloat("level_difficulty_multiplier");
            
            Debug.Log($"[GameManager] Config values - Ads: {adsEnabled}, Max Energy: {maxEnergy}, Difficulty: {difficulty}");
        }
    }
    
    // Public methods for external access
    public void AddCurrency(string currencyId, int amount)
    {
        if (economyManager != null)
        {
            economyManager.AddCurrency(currencyId, amount);
        }
    }
    
    public void SpendCurrency(string currencyId, int amount)
    {
        if (economyManager != null)
        {
            economyManager.SpendCurrency(currencyId, amount);
        }
    }
    
    public void AddInventoryItem(string itemId, int quantity = 1)
    {
        if (economyManager != null)
        {
            economyManager.AddInventoryItem(itemId, quantity);
        }
    }
    
    public void UseInventoryItem(string itemId, int quantity = 1)
    {
        if (economyManager != null)
        {
            economyManager.UseInventoryItem(itemId, quantity);
        }
    }
    
    public void PurchaseItem(string catalogItemId)
    {
        if (economyManager != null)
        {
            economyManager.PurchaseItem(catalogItemId);
        }
    }
    
    public int GetCurrencyAmount(string currencyId)
    {
        return economyManager != null ? economyManager.GetCurrencyAmount(currencyId) : 0;
    }
    
    public int GetInventoryQuantity(string itemId)
    {
        return economyManager != null ? economyManager.GetInventoryQuantity(itemId) : 0;
    }
}
