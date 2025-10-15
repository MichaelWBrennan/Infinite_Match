using UnityEngine;
using Evergreen.ARPU;
using Evergreen.UI;

namespace Evergreen.ARPU
{
    /// <summary>
    /// Complete ARPU Initializer - One-click setup for all ARPU systems
    /// Automatically configures and initializes all ARPU maximization features
    /// </summary>
    public class CompleteARPUInitializer : MonoBehaviour
    {
        [Header("ARPU Configuration")]
        public bool initializeOnStart = true;
        public bool showDebugLogs = true;
        public bool enableAllSystems = true;
        
        [Header("System Toggles")]
        public bool enableEnergySystem = true;
        public bool enableSubscriptionSystem = true;
        public bool enablePersonalizedOffers = true;
        public bool enableSocialFeatures = true;
        public bool enableARPUAnalytics = true;
        public bool enableRetentionSystem = true;
        public bool enableAdvancedMonetization = true;
        public bool enableCompleteUI = true;
        
        [Header("Energy Settings")]
        public int maxEnergy = 30;
        public int energyPerLevel = 1;
        public int energyRefillCost = 10;
        public float energyRefillTime = 300f;
        public bool enableEnergyPacks = true;
        public bool enableEnergyAds = true;
        public int energyAdReward = 5;
        public float energyAdCooldown = 300f;
        
        [Header("Subscription Settings")]
        public float basicPassPrice = 4.99f;
        public float premiumPassPrice = 9.99f;
        public float ultimatePassPrice = 19.99f;
        public int subscriptionDuration = 30;
        
        [Header("Offer Settings")]
        public int maxActiveOffers = 3;
        public float offerRefreshInterval = 1800f;
        public float offerExpiryTime = 3600f;
        public bool enablePersonalization = true;
        public bool enableAITargeting = true;
        public float personalizationUpdateInterval = 300f;
        
        [Header("Social Settings")]
        public bool enableLeaderboards = true;
        public bool enableGuilds = true;
        public bool enableSocialChallenges = true;
        public bool enableFriendGifting = true;
        public int maxGuildMembers = 50;
        public int guildCreationCost = 1000;
        public int guildUpgradeCost = 500;
        public int maxGuildLevel = 10;
        
        [Header("Analytics Settings")]
        public bool enableRealTimeRevenue = true;
        public bool enablePlayerSegmentation = true;
        public bool enableConversionFunnels = true;
        public bool enableRetentionAnalysis = true;
        public bool enableLTVPrediction = true;
        public float revenueUpdateInterval = 60f;
        public int maxRevenueHistory = 1000;
        
        [Header("Retention Settings")]
        public bool enableStreakSystem = true;
        public bool enableComebackOffers = true;
        public bool enableDailyTasks = true;
        public bool enableHabitFormation = true;
        public bool enableChurnPrediction = true;
        public float streakMultiplier = 0.1f;
        public float maxStreakMultiplier = 3.0f;
        public int churnRiskThreshold = 3;
        
        [Header("UI Settings")]
        public bool createUI = true;
        public Canvas targetCanvas;
        public GameObject uiPrefab;
        
        private CompleteARPUManager _arpuManager;
        private CompleteARPUUI _arpuUI;
        private bool _isInitialized = false;
        
        void Start()
        {
            if (initializeOnStart)
            {
                InitializeCompleteARPU();
            }
        }
        
        public void InitializeCompleteARPU()
        {
            if (_isInitialized)
            {
                if (showDebugLogs)
                    Debug.Log("[CompleteARPUInitializer] ARPU systems already initialized");
                return;
            }
            
            if (showDebugLogs)
                Debug.Log("[CompleteARPUInitializer] Starting complete ARPU initialization...");
            
            try
            {
                // Initialize ARPU Manager
                InitializeARPUManager();
                
                // Initialize UI if requested
                if (enableCompleteUI && createUI)
                {
                    InitializeARPUUI();
                }
                
                // Setup event listeners
                SetupEventListeners();
                
                _isInitialized = true;
                
                if (showDebugLogs)
                    Debug.Log("[CompleteARPUInitializer] Complete ARPU initialization successful!");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"[CompleteARPUInitializer] Initialization failed: {e.Message}");
                throw;
            }
        }
        
        private void InitializeARPUManager()
        {
            // Create ARPU Manager if it doesn't exist
            if (CompleteARPUManager.Instance == null)
            {
                var arpuManagerGO = new GameObject("CompleteARPUManager");
                _arpuManager = arpuManagerGO.AddComponent<CompleteARPUManager>();
                DontDestroyOnLoad(arpuManagerGO);
            }
            else
            {
                _arpuManager = CompleteARPUManager.Instance;
            }
            
            // Configure ARPU Manager
            ConfigureARPUManager();
            
            if (showDebugLogs)
                Debug.Log("[CompleteARPUInitializer] ARPU Manager initialized and configured");
        }
        
        private void ConfigureARPUManager()
        {
            if (_arpuManager == null) return;
            
            // Configure system toggles
            _arpuManager.enableEnergySystem = enableEnergySystem;
            _arpuManager.enableSubscriptionSystem = enableSubscriptionSystem;
            _arpuManager.enablePersonalizedOffers = enablePersonalizedOffers;
            _arpuManager.enableSocialFeatures = enableSocialFeatures;
            _arpuManager.enableARPUAnalytics = enableARPUAnalytics;
            _arpuManager.enableRetentionSystem = enableRetentionSystem;
            _arpuManager.enableAdvancedMonetization = enableAdvancedMonetization;
            
            // Configure energy settings
            _arpuManager.maxEnergy = maxEnergy;
            _arpuManager.energyPerLevel = energyPerLevel;
            _arpuManager.energyRefillCost = energyRefillCost;
            _arpuManager.energyRefillTime = energyRefillTime;
            _arpuManager.enableEnergyPacks = enableEnergyPacks;
            _arpuManager.enableEnergyAds = enableEnergyAds;
            _arpuManager.energyAdReward = energyAdReward;
            _arpuManager.energyAdCooldown = energyAdCooldown;
            
            // Configure subscription settings
            _arpuManager.subscriptionTiers = CreateSubscriptionTiers();
            
            // Configure offer settings
            _arpuManager.maxActiveOffers = maxActiveOffers;
            _arpuManager.offerRefreshInterval = offerRefreshInterval;
            _arpuManager.offerExpiryTime = offerExpiryTime;
            _arpuManager.enablePersonalization = enablePersonalization;
            _arpuManager.enableAITargeting = enableAITargeting;
            _arpuManager.personalizationUpdateInterval = personalizationUpdateInterval;
            
            // Configure social settings
            _arpuManager.enableLeaderboards = enableLeaderboards;
            _arpuManager.enableGuilds = enableGuilds;
            _arpuManager.enableSocialChallenges = enableSocialChallenges;
            _arpuManager.enableFriendGifting = enableFriendGifting;
            _arpuManager.maxGuildMembers = maxGuildMembers;
            _arpuManager.guildCreationCost = guildCreationCost;
            _arpuManager.guildUpgradeCost = guildUpgradeCost;
            _arpuManager.maxGuildLevel = maxGuildLevel;
            
            // Configure analytics settings
            _arpuManager.enableRealTimeRevenue = enableRealTimeRevenue;
            _arpuManager.enablePlayerSegmentation = enablePlayerSegmentation;
            _arpuManager.enableConversionFunnels = enableConversionFunnels;
            _arpuManager.enableRetentionAnalysis = enableRetentionAnalysis;
            _arpuManager.enableLTVPrediction = enableLTVPrediction;
            _arpuManager.revenueUpdateInterval = revenueUpdateInterval;
            _arpuManager.maxRevenueHistory = maxRevenueHistory;
            
            // Configure retention settings
            _arpuManager.enableStreakSystem = enableStreakSystem;
            _arpuManager.enableComebackOffers = enableComebackOffers;
            _arpuManager.enableDailyTasks = enableDailyTasks;
            _arpuManager.enableHabitFormation = enableHabitFormation;
            _arpuManager.enableChurnPrediction = enableChurnPrediction;
            _arpuManager.streakMultiplier = streakMultiplier;
            _arpuManager.maxStreakMultiplier = maxStreakMultiplier;
            _arpuManager.churnRiskThreshold = churnRiskThreshold;
        }
        
        private SubscriptionTier[] CreateSubscriptionTiers()
        {
            return new SubscriptionTier[]
            {
                new SubscriptionTier
                {
                    id = "basic",
                    name = "Basic Pass",
                    price = basicPassPrice,
                    duration = subscriptionDuration,
                    benefits = new System.Collections.Generic.List<SubscriptionBenefit>
                    {
                        new SubscriptionBenefit { type = "energy_multiplier", value = 1.5f, description = "1.5x Energy Regeneration" },
                        new SubscriptionBenefit { type = "coins_multiplier", value = 1.2f, description = "1.2x Coin Rewards" },
                        new SubscriptionBenefit { type = "daily_bonus", value = 100, description = "Daily 100 Coins" }
                    }
                },
                new SubscriptionTier
                {
                    id = "premium",
                    name = "Premium Pass",
                    price = premiumPassPrice,
                    duration = subscriptionDuration,
                    benefits = new System.Collections.Generic.List<SubscriptionBenefit>
                    {
                        new SubscriptionBenefit { type = "energy_multiplier", value = 2.0f, description = "2x Energy Regeneration" },
                        new SubscriptionBenefit { type = "coins_multiplier", value = 1.5f, description = "1.5x Coin Rewards" },
                        new SubscriptionBenefit { type = "gems_multiplier", value = 1.3f, description = "1.3x Gem Rewards" },
                        new SubscriptionBenefit { type = "daily_bonus", value = 200, description = "Daily 200 Coins + 10 Gems" },
                        new SubscriptionBenefit { type = "exclusive_items", value = 1, description = "Exclusive Items Access" }
                    }
                },
                new SubscriptionTier
                {
                    id = "ultimate",
                    name = "Ultimate Pass",
                    price = ultimatePassPrice,
                    duration = subscriptionDuration,
                    benefits = new System.Collections.Generic.List<SubscriptionBenefit>
                    {
                        new SubscriptionBenefit { type = "unlimited_energy", value = 1, description = "Unlimited Energy" },
                        new SubscriptionBenefit { type = "coins_multiplier", value = 2.0f, description = "2x Coin Rewards" },
                        new SubscriptionBenefit { type = "gems_multiplier", value = 1.5f, description = "1.5x Gem Rewards" },
                        new SubscriptionBenefit { type = "daily_bonus", value = 500, description = "Daily 500 Coins + 25 Gems" },
                        new SubscriptionBenefit { type = "exclusive_items", value = 1, description = "All Exclusive Items" },
                        new SubscriptionBenefit { type = "priority_support", value = 1, description = "Priority Support" },
                        new SubscriptionBenefit { type = "no_ads", value = 1, description = "Ad-Free Experience" }
                    }
                }
            };
        }
        
        private void InitializeARPUUI()
        {
            // Find or create canvas
            Canvas canvas = targetCanvas;
            if (canvas == null)
            {
                canvas = FindObjectOfType<Canvas>();
                if (canvas == null)
                {
                    var canvasGO = new GameObject("ARPU Canvas");
                    canvas = canvasGO.AddComponent<Canvas>();
                    canvas.renderMode = RenderMode.ScreenSpaceOverlay;
                    canvasGO.AddComponent<UnityEngine.UI.CanvasScaler>();
                    canvasGO.AddComponent<UnityEngine.UI.GraphicRaycaster>();
                }
            }
            
            // Create ARPU UI
            var uiGO = new GameObject("CompleteARPUUI");
            uiGO.transform.SetParent(canvas.transform, false);
            _arpuUI = uiGO.AddComponent<CompleteARPUUI>();
            
            // Configure UI
            ConfigureARPUUI();
            
            if (showDebugLogs)
                Debug.Log("[CompleteARPUInitializer] ARPU UI initialized and configured");
        }
        
        private void ConfigureARPUUI()
        {
            if (_arpuUI == null) return;
            
            // Set player ID
            _arpuUI.playerId = "player_123"; // You can make this configurable
            
            // Configure update interval
            _arpuUI.updateInterval = 1f;
            
            // Configure debug info
            _arpuUI.showDebugInfo = showDebugLogs;
        }
        
        private void SetupEventListeners()
        {
            if (_arpuManager == null) return;
            
            // Subscribe to ARPU events
            CompleteARPUManager.OnPlayerProfileUpdated += OnPlayerProfileUpdated;
            CompleteARPUManager.OnRevenueGenerated += OnRevenueGenerated;
            CompleteARPUManager.OnOfferCreated += OnOfferCreated;
            CompleteARPUManager.OnOfferPurchased += OnOfferPurchased;
            CompleteARPUManager.OnGuildCreated += OnGuildCreated;
            CompleteARPUManager.OnChallengeStarted += OnChallengeStarted;
            CompleteARPUManager.OnARPUOptimized += OnARPUOptimized;
            
            if (showDebugLogs)
                Debug.Log("[CompleteARPUInitializer] Event listeners configured");
        }
        
        // Event Handlers
        
        private void OnPlayerProfileUpdated(PlayerARPUProfile profile)
        {
            if (showDebugLogs)
                Debug.Log($"[CompleteARPUInitializer] Player profile updated: {profile.playerId}");
        }
        
        private void OnRevenueGenerated(RevenueEvent revenueEvent)
        {
            if (showDebugLogs)
                Debug.Log($"[CompleteARPUInitializer] Revenue generated: ${revenueEvent.amount:F2} from {revenueEvent.source}");
        }
        
        private void OnOfferCreated(PersonalizedOffer offer)
        {
            if (showDebugLogs)
                Debug.Log($"[CompleteARPUInitializer] Offer created: {offer.name} for {offer.playerId}");
        }
        
        private void OnOfferPurchased(PersonalizedOffer offer)
        {
            if (showDebugLogs)
                Debug.Log($"[CompleteARPUInitializer] Offer purchased: {offer.name} by {offer.playerId}");
        }
        
        private void OnGuildCreated(Guild guild)
        {
            if (showDebugLogs)
                Debug.Log($"[CompleteARPUInitializer] Guild created: {guild.name} by {guild.leaderId}");
        }
        
        private void OnChallengeStarted(SocialChallenge challenge)
        {
            if (showDebugLogs)
                Debug.Log($"[CompleteARPUInitializer] Challenge started: {challenge.type} by {challenge.creatorId}");
        }
        
        private void OnARPUOptimized(System.Collections.Generic.Dictionary<string, object> optimizationData)
        {
            if (showDebugLogs)
                Debug.Log($"[CompleteARPUInitializer] ARPU optimized with {optimizationData.Count} data points");
        }
        
        // Public Methods
        
        public void ForceInitialize()
        {
            if (!_isInitialized)
            {
                InitializeCompleteARPU();
            }
        }
        
        public bool IsInitialized()
        {
            return _isInitialized;
        }
        
        public CompleteARPUManager GetARPUManager()
        {
            return _arpuManager;
        }
        
        public CompleteARPUUI GetARPUUI()
        {
            return _arpuUI;
        }
        
        public System.Collections.Generic.Dictionary<string, object> GetSystemStatus()
        {
            if (_arpuManager == null) return new System.Collections.Generic.Dictionary<string, object>();
            return _arpuManager.GetSystemStatus();
        }
        
        public System.Collections.Generic.Dictionary<string, object> GetARPUReport()
        {
            if (_arpuManager == null) return new System.Collections.Generic.Dictionary<string, object>();
            return _arpuManager.GetARPUReport();
        }
        
        // Cleanup
        
        void OnDestroy()
        {
            // Unsubscribe from events
            CompleteARPUManager.OnPlayerProfileUpdated -= OnPlayerProfileUpdated;
            CompleteARPUManager.OnRevenueGenerated -= OnRevenueGenerated;
            CompleteARPUManager.OnOfferCreated -= OnOfferCreated;
            CompleteARPUManager.OnOfferPurchased -= OnOfferPurchased;
            CompleteARPUManager.OnGuildCreated -= OnGuildCreated;
            CompleteARPUManager.OnChallengeStarted -= OnChallengeStarted;
            CompleteARPUManager.OnARPUOptimized -= OnARPUOptimized;
        }
    }
}