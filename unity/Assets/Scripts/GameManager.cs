using UnityEngine;
using Economy;
using CloudCode;
using RemoteConfig;
using UI;
using Evergreen.Integration;
using Evergreen.Addiction;
using Evergreen.Monetization;
using Evergreen.Social;
using Evergreen.Retention;
using Evergreen.Gacha;
using Evergreen.AI;
using Evergreen.Analytics;

public class GameManager : MonoBehaviour
{
    [Header("Game Settings")]
    public bool debugMode = true;
    
    [Header("Core Managers")]
    public EconomyManager economyManager;
    public CloudCodeManager cloudCodeManager;
    public RemoteConfigManager remoteConfigManager;
    public EconomyUI economyUI;
    
    [Header("Advanced Systems")]
    public SystemIntegrationManager systemIntegrationManager;
    public AddictionMechanics addictionMechanics;
    public AdvancedMonetizationSystem monetizationSystem;
    public AdvancedSocialSystem socialSystem;
    public AdvancedRetentionSystem retentionSystem;
    public AdvancedGachaSystem gachaSystem;
    public AdvancedAIOptimization aiOptimization;
    public AdvancedAnalyticsSystem analyticsSystem;
    
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
        
        // Initialize advanced systems
        InitializeAdvancedSystems();
        
        // Set up event listeners
        SetupEventListeners();
        
        // Set up cross-system integration
        SetupSystemIntegration();
        
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
    
    private void InitializeAdvancedSystems()
    {
        // System Integration Manager
        if (systemIntegrationManager == null)
        {
            systemIntegrationManager = FindObjectOfType<SystemIntegrationManager>();
        }
        
        // Addiction Mechanics
        if (addictionMechanics == null)
        {
            addictionMechanics = FindObjectOfType<AddictionMechanics>();
        }
        
        // Advanced Monetization System
        if (monetizationSystem == null)
        {
            monetizationSystem = FindObjectOfType<AdvancedMonetizationSystem>();
        }
        
        // Advanced Social System
        if (socialSystem == null)
        {
            socialSystem = FindObjectOfType<AdvancedSocialSystem>();
        }
        
        // Advanced Retention System
        if (retentionSystem == null)
        {
            retentionSystem = FindObjectOfType<AdvancedRetentionSystem>();
        }
        
        // Advanced Gacha System
        if (gachaSystem == null)
        {
            gachaSystem = FindObjectOfType<AdvancedGachaSystem>();
        }
        
        // Advanced AI Optimization
        if (aiOptimization == null)
        {
            aiOptimization = FindObjectOfType<AdvancedAIOptimization>();
        }
        
        // Advanced Analytics System
        if (analyticsSystem == null)
        {
            analyticsSystem = FindObjectOfType<AdvancedAnalyticsSystem>();
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
    
    private void SetupSystemIntegration()
    {
        // Set up cross-system event handling
        if (addictionMechanics != null)
        {
            addictionMechanics.OnVariableRewardTriggered += OnVariableRewardTriggered;
            addictionMechanics.OnNearMissTriggered += OnNearMissTriggered;
        }
        
        if (monetizationSystem != null)
        {
            monetizationSystem.OnPriceUpdated += OnPriceUpdated;
            monetizationSystem.OnSubscriptionStarted += OnSubscriptionStarted;
        }
        
        if (socialSystem != null)
        {
            socialSystem.OnGuildCreated += OnGuildCreated;
            socialSystem.OnLeaderboardUpdated += OnLeaderboardUpdated;
        }
        
        if (retentionSystem != null)
        {
            retentionSystem.OnStreakRewardEarned += OnStreakRewardEarned;
            retentionSystem.OnComebackOfferCreated += OnComebackOfferCreated;
        }
        
        if (gachaSystem != null)
        {
            gachaSystem.OnGachaRewardEarned += OnGachaRewardEarned;
            gachaSystem.OnRarityAchieved += OnRarityAchieved;
        }
        
        if (aiOptimization != null)
        {
            aiOptimization.OnChurnPredicted += OnChurnPredicted;
            aiOptimization.OnLTVPredicted += OnLTVPredicted;
        }
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
        
        // Unsubscribe from advanced system events
        if (addictionMechanics != null)
        {
            addictionMechanics.OnVariableRewardTriggered -= OnVariableRewardTriggered;
            addictionMechanics.OnNearMissTriggered -= OnNearMissTriggered;
        }
        
        if (monetizationSystem != null)
        {
            monetizationSystem.OnPriceUpdated -= OnPriceUpdated;
            monetizationSystem.OnSubscriptionStarted -= OnSubscriptionStarted;
        }
        
        if (socialSystem != null)
        {
            socialSystem.OnGuildCreated -= OnGuildCreated;
            socialSystem.OnLeaderboardUpdated -= OnLeaderboardUpdated;
        }
        
        if (retentionSystem != null)
        {
            retentionSystem.OnStreakRewardEarned -= OnStreakRewardEarned;
            retentionSystem.OnComebackOfferCreated -= OnComebackOfferCreated;
        }
        
        if (gachaSystem != null)
        {
            gachaSystem.OnGachaRewardEarned -= OnGachaRewardEarned;
            gachaSystem.OnRarityAchieved -= OnRarityAchieved;
        }
        
        if (aiOptimization != null)
        {
            aiOptimization.OnChurnPredicted -= OnChurnPredicted;
            aiOptimization.OnLTVPredicted -= OnLTVPredicted;
        }
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
    
    // Advanced System Event Handlers
    private void OnVariableRewardTriggered(VariableReward reward)
    {
        if (debugMode)
        {
            Debug.Log($"[GameManager] Variable reward triggered: {reward.item.name} for {reward.playerId}");
        }
        
        // Track analytics
        if (analyticsSystem != null)
        {
            analyticsSystem.TrackEvent("variable_reward_earned", new Dictionary<string, object>
            {
                ["player_id"] = reward.playerId,
                ["reward_type"] = reward.item.name,
                ["rarity"] = reward.rarity.name
            });
        }
    }
    
    private void OnNearMissTriggered(NearMiss nearMiss)
    {
        if (debugMode)
        {
            Debug.Log($"[GameManager] Near miss triggered: {nearMiss.progress:F2} for {nearMiss.playerId}");
        }
    }
    
    private void OnPriceUpdated(DynamicPrice price)
    {
        if (debugMode)
        {
            Debug.Log($"[GameManager] Price updated: {price.itemId} = {price.currentPrice}");
        }
    }
    
    private void OnSubscriptionStarted(Subscription subscription)
    {
        if (debugMode)
        {
            Debug.Log($"[GameManager] Subscription started: {subscription.name} for {subscription.playerId}");
        }
    }
    
    private void OnGuildCreated(Guild guild)
    {
        if (debugMode)
        {
            Debug.Log($"[GameManager] Guild created: {guild.name} by {guild.leaderId}");
        }
    }
    
    private void OnLeaderboardUpdated(Leaderboard leaderboard)
    {
        if (debugMode)
        {
            Debug.Log($"[GameManager] Leaderboard updated: {leaderboard.type}");
        }
    }
    
    private void OnStreakRewardEarned(StreakReward reward)
    {
        if (debugMode)
        {
            Debug.Log($"[GameManager] Streak reward earned: {reward.milestone} days for {reward.playerId}");
        }
    }
    
    private void OnComebackOfferCreated(ComebackOffer offer)
    {
        if (debugMode)
        {
            Debug.Log($"[GameManager] Comeback offer created: {offer.daysAway} days for {offer.playerId}");
        }
    }
    
    private void OnGachaRewardEarned(GachaReward reward)
    {
        if (debugMode)
        {
            Debug.Log($"[GameManager] Gacha reward earned: {reward.item.name} ({reward.rarity.name}) for {reward.playerId}");
        }
    }
    
    private void OnRarityAchieved(GachaRarity rarity)
    {
        if (debugMode)
        {
            Debug.Log($"[GameManager] Rarity achieved: {rarity.name}");
        }
    }
    
    private void OnChurnPredicted(ChurnPrediction prediction)
    {
        if (debugMode)
        {
            Debug.Log($"[GameManager] Churn predicted: {prediction.riskLevel:F2} for {prediction.playerId}");
        }
    }
    
    private void OnLTVPredicted(LTVPrediction prediction)
    {
        if (debugMode)
        {
            Debug.Log($"[GameManager] LTV predicted: {prediction.predictedLTV:F2} for {prediction.playerId}");
        }
    }
}
