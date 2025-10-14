using UnityEngine;
using Evergreen.Game;
using Evergreen.Performance;
using Evergreen.Ads;
using Evergreen.Social;
using Evergreen.MetaGame;
using Evergreen.Economy;
using Evergreen.Monetization;
using Evergreen.Analytics;
using System.Collections.Generic;

namespace Evergreen.Core
{
    /// <summary>
    /// Central game manager that initializes and coordinates all game systems
    /// </summary>
    public class GameManager : MonoBehaviour
    {
        [Header("System Initialization")]
        [SerializeField] private bool initializeOnAwake = true;
        [SerializeField] private bool enablePerformanceMonitoring = true;
        [SerializeField] private bool enableARPUSystems = true;
        
        [Header("Industry Leader ARPU Targets")]
        [SerializeField] private float targetARPU = 3.50f; // Industry average for top games
        [SerializeField] private float targetARPPU = 25.00f; // Industry average for top games
        [SerializeField] private float targetConversionRate = 0.08f; // 8% conversion rate
        [SerializeField] private float targetRetentionD1 = 0.40f; // 40% Day 1 retention
        [SerializeField] private float targetRetentionD7 = 0.20f; // 20% Day 7 retention
        [SerializeField] private float targetRetentionD30 = 0.10f; // 10% Day 30 retention
        
        [Header("Currency Settings")]
        [SerializeField] private int startingCoins = 1000;
        [SerializeField] private int startingGems = 50;
        
        [Header("Industry Leader Strategies")]
        [SerializeField] private bool enableKingStrategies = true; // Candy Crush strategies
        [SerializeField] private bool enableSupercellStrategies = true; // Clash of Clans strategies
        [SerializeField] private bool enableNianticStrategies = true; // Pokemon GO strategies
        [SerializeField] private bool enableEpicStrategies = true; // Fortnite strategies
        [SerializeField] private bool enableRobloxStrategies = true; // Roblox strategies
        
        public static GameManager Instance { get; private set; }
        
        private bool _isInitialized = false;
        private Dictionary<string, int> _currencies = new Dictionary<string, int>();
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                
                if (initializeOnAwake)
                {
                    InitializeGame();
                }
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        /// <summary>
        /// Initialize all game systems
        /// </summary>
        public void InitializeGame()
        {
            if (_isInitialized)
            {
                Debug.LogWarning("Game already initialized");
                return;
            }
            
            Debug.Log("Initializing game systems...");
            
            try
            {
                // Initialize core systems first
                InitializeCoreSystems();
                
                // Initialize game systems
                InitializeGameSystems();
                
                // Initialize UI systems
                InitializeUISystems();
                
                // Initialize performance monitoring
                if (enablePerformanceMonitoring)
                {
                    InitializePerformanceSystems();
                }
                
                // Initialize ARPU systems
                if (enableARPUSystems)
                {
                    InitializeARPUSystems();
                }
                
                // Apply industry leader strategies
                ApplyIndustryLeaderStrategies();
                
                _isInitialized = true;
                Debug.Log("Game initialization completed successfully");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Game initialization failed: {e.Message}");
                throw;
            }
        }
        
        private void InitializeCoreSystems()
        {
            // Load remote config
            RemoteConfigService.Load();
            
            // Load game state
            GameState.Load();
            
            // Initialize currencies
            InitializeCurrencies();
            
            Debug.Log("Core systems initialized");
        }
        
        private void InitializeCurrencies()
        {
            _currencies["coins"] = startingCoins;
            _currencies["gems"] = startingGems;
            
            // Load saved currencies
            LoadCurrencies();
        }
        
        private void InitializeGameSystems()
        {
            // Register IAP Manager
            ServiceLocator.RegisterFactory<IAPManager>(() => 
            {
                var go = new GameObject("IAPManager");
                return go.AddComponent<IAPManager>();
            });
            
            // Register Ad Mediation
            ServiceLocator.RegisterFactory<AdMediation>(() => 
            {
                var go = new GameObject("AdMediation");
                return go.AddComponent<AdMediation>();
            });
            
            // Register Cloud Save
            ServiceLocator.RegisterFactory<CloudSavePlayFab>(() => 
            {
                var go = new GameObject("CloudSavePlayFab");
                return go.AddComponent<CloudSavePlayFab>();
            });
            
            // Register Unity Ads Manager
            ServiceLocator.RegisterFactory<UnityAdsManager>(() => 
            {
                var go = new GameObject("UnityAdsManager");
                return go.AddComponent<UnityAdsManager>();
            });
            
            // Register Energy System
            ServiceLocator.RegisterFactory<EnergySystem>(() => 
            {
                var go = new GameObject("EnergySystem");
                return go.AddComponent<EnergySystem>();
            });
            
            // Register Castle Renovation System
            ServiceLocator.RegisterFactory<CastleRenovationSystem>(() => 
            {
                var go = new GameObject("CastleRenovationSystem");
                return go.AddComponent<CastleRenovationSystem>();
            });
            
            // Register Character System
            ServiceLocator.RegisterFactory<CharacterSystem>(() => 
            {
                var go = new GameObject("CharacterSystem");
                return go.AddComponent<CharacterSystem>();
            });
            
            // Register Enhanced Match Effects
            ServiceLocator.RegisterFactory<EnhancedMatchEffects>(() => 
            {
                var go = new GameObject("EnhancedMatchEffects");
                return go.AddComponent<EnhancedMatchEffects>();
            });
            
            // Register Enhanced Audio Manager
            ServiceLocator.RegisterFactory<EnhancedAudioManager>(() => 
            {
                var go = new GameObject("EnhancedAudioManager");
                return go.AddComponent<EnhancedAudioManager>();
            });
            
            // Register Enhanced UI Manager
            ServiceLocator.RegisterFactory<EnhancedUIManager>(() => 
            {
                var go = new GameObject("EnhancedUIManager");
                return go.AddComponent<EnhancedUIManager>();
            });
            
            // Register Game Integration Manager
            ServiceLocator.RegisterFactory<GameIntegrationManager>(() => 
            {
                var go = new GameObject("GameIntegrationManager");
                return go.AddComponent<GameIntegrationManager>();
            });
            
            // Register Dynamic Offer System
            ServiceLocator.RegisterFactory<DynamicOfferSystem>(() => 
            {
                var go = new GameObject("DynamicOfferSystem");
                return go.AddComponent<DynamicOfferSystem>();
            });
            
            // Register Social System
            ServiceLocator.RegisterFactory<SocialSystem>(() => 
            {
                var go = new GameObject("SocialSystem");
                return go.AddComponent<SocialSystem>();
            });
            
            // Register Advanced Live Ops System
            ServiceLocator.RegisterFactory<AdvancedLiveOpsSystem>(() => 
            {
                var go = new GameObject("AdvancedLiveOpsSystem");
                return go.AddComponent<AdvancedLiveOpsSystem>();
            });
            
            // Register Advanced Analytics System
            ServiceLocator.RegisterFactory<AdvancedAnalyticsSystem>(() => 
            {
                var go = new GameObject("AdvancedAnalyticsSystem");
                return go.AddComponent<AdvancedAnalyticsSystem>();
            });
            
            // Register AI Personalization System
            ServiceLocator.RegisterFactory<AIPersonalizationSystem>(() => 
            {
                var go = new GameObject("AIPersonalizationSystem");
                return go.AddComponent<AIPersonalizationSystem>();
            });
            
            // Register Advanced Cloud Save System
            ServiceLocator.RegisterFactory<AdvancedCloudSaveSystem>(() => 
            {
                var go = new GameObject("AdvancedCloudSaveSystem");
                return go.AddComponent<AdvancedCloudSaveSystem>();
            });
            
            // Register Economy Service
            ServiceLocator.RegisterFactory<EconomyService>(() => 
            {
                var go = new GameObject("EconomyService");
                return go.AddComponent<EconomyService>();
            });
            
            Debug.Log("Game systems initialized");
        }
        
        private void InitializeUISystems()
        {
            // Initialize main menu UI
            MainMenuUI.Show();
            
            Debug.Log("UI systems initialized");
        }
        
        private void InitializePerformanceSystems()
        {
            // Register Performance Manager
            ServiceLocator.RegisterFactory<PerformanceManager>(() => 
            {
                var go = new GameObject("PerformanceManager");
                return go.AddComponent<PerformanceManager>();
            });
            
            Debug.Log("Performance systems initialized");
        }
        
        private void InitializeARPUSystems()
        {
            // Register Energy System
            ServiceLocator.RegisterFactory<EnergySystem>(() => 
            {
                var go = new GameObject("EnergySystem");
                return go.AddComponent<EnergySystem>();
            });
            
            // Register Subscription System
            ServiceLocator.RegisterFactory<SubscriptionSystem>(() => 
            {
                var go = new GameObject("SubscriptionSystem");
                return go.AddComponent<SubscriptionSystem>();
            });
            
            // Register Personalized Offer System
            ServiceLocator.RegisterFactory<PersonalizedOfferSystem>(() => 
            {
                var go = new GameObject("PersonalizedOfferSystem");
                return go.AddComponent<PersonalizedOfferSystem>();
            });
            
            // Register Social Competition System
            ServiceLocator.RegisterFactory<SocialCompetitionSystem>(() => 
            {
                var go = new GameObject("SocialCompetitionSystem");
                return go.AddComponent<SocialCompetitionSystem>();
            });
            
            // Register Unity Analytics ARPU Helper
            ServiceLocator.RegisterFactory<UnityAnalyticsARPUHelper>(() => 
            {
                var go = new GameObject("UnityAnalyticsARPUHelper");
                return go.AddComponent<UnityAnalyticsARPUHelper>();
            });
            
            // Register Advanced Retention System
            ServiceLocator.RegisterFactory<AdvancedRetentionSystem>(() => 
            {
                var go = new GameObject("AdvancedRetentionSystem");
                return go.AddComponent<AdvancedRetentionSystem>();
            });
            
            // Register ARPU Integration Manager
            ServiceLocator.RegisterFactory<ARPUIntegrationManager>(() => 
            {
                var go = new GameObject("ARPUIntegrationManager");
                return go.AddComponent<ARPUIntegrationManager>();
            });
            
            Debug.Log("ARPU systems initialized");
        }
        
        /// <summary>
        /// Get a service from the service locator
        /// </summary>
        public T GetService<T>() where T : class
        {
            return ServiceLocator.Get<T>();
        }
        
        /// <summary>
        /// Check if a service is available
        /// </summary>
        public bool HasService<T>() where T : class
        {
            return ServiceLocator.IsRegistered<T>();
        }
        
        /// <summary>
        /// Get currency amount
        /// </summary>
        public int GetCurrency(string currencyType)
        {
            return _currencies.ContainsKey(currencyType) ? _currencies[currencyType] : 0;
        }
        
        /// <summary>
        /// Add currency
        /// </summary>
        public void AddCurrency(string currencyType, int amount)
        {
            if (!_currencies.ContainsKey(currencyType))
                _currencies[currencyType] = 0;
                
            _currencies[currencyType] += amount;
            SaveCurrencies();
        }
        
        /// <summary>
        /// Spend currency
        /// </summary>
        public bool SpendCurrency(string currencyType, int amount)
        {
            if (!_currencies.ContainsKey(currencyType) || _currencies[currencyType] < amount)
                return false;
                
            _currencies[currencyType] -= amount;
            SaveCurrencies();
            return true;
        }
        
        /// <summary>
        /// Set currency amount
        /// </summary>
        public void SetCurrency(string currencyType, int amount)
        {
            _currencies[currencyType] = amount;
            SaveCurrencies();
        }
        
        /// <summary>
        /// Check if player can play level (energy check)
        /// </summary>
        public bool CanPlayLevel()
        {
            var energySystem = GetService<EnergySystem>();
            return energySystem != null ? energySystem.CanPlayLevel() : true;
        }
        
        /// <summary>
        /// Try to consume energy for level play
        /// </summary>
        public bool TryConsumeEnergy(int amount = 1)
        {
            var energySystem = GetService<EnergySystem>();
            return energySystem != null ? energySystem.TryConsumeEnergy(amount) : true;
        }
        
        /// <summary>
        /// Get current energy level
        /// </summary>
        public int GetCurrentEnergy()
        {
            var energySystem = GetService<EnergySystem>();
            return energySystem != null ? energySystem.GetCurrentEnergy() : 30;
        }
        
        /// <summary>
        /// Get max energy level
        /// </summary>
        public int GetMaxEnergy()
        {
            var energySystem = GetService<EnergySystem>();
            return energySystem != null ? energySystem.GetMaxEnergy() : 30;
        }
        
        /// <summary>
        /// Check if player has active subscription
        /// </summary>
        public bool HasActiveSubscription(string playerId)
        {
            var subscriptionSystem = GetService<SubscriptionSystem>();
            return subscriptionSystem != null ? subscriptionSystem.HasActiveSubscription(playerId) : false;
        }
        
        /// <summary>
        /// Get subscription multiplier for rewards
        /// </summary>
        public float GetSubscriptionMultiplier(string playerId, string multiplierType)
        {
            var subscriptionSystem = GetService<SubscriptionSystem>();
            return subscriptionSystem != null ? subscriptionSystem.GetSubscriptionMultiplier(playerId, multiplierType) : 1f;
        }
        
        /// <summary>
        /// Get personalized offers for player
        /// </summary>
        public System.Collections.Generic.List<PersonalizedOffer> GetPersonalizedOffers(string playerId)
        {
            var offerSystem = GetService<PersonalizedOfferSystem>();
            return offerSystem != null ? offerSystem.GetOffersForPlayer(playerId) : new System.Collections.Generic.List<PersonalizedOffer>();
        }
        
        /// <summary>
        /// Track revenue event using Unity Analytics
        /// </summary>
        public void TrackRevenue(string playerId, float amount, RevenueSource source, string itemId = "")
        {
            var helper = UnityAnalyticsARPUHelper.Instance;
            if (helper != null)
            {
                helper.TrackRevenue(playerId, amount, source.ToString(), itemId);
            }
        }
        
        /// <summary>
        /// Track player action using Unity Analytics
        /// </summary>
        public void TrackPlayerAction(string playerId, string action, System.Collections.Generic.Dictionary<string, object> parameters = null)
        {
            var helper = UnityAnalyticsARPUHelper.Instance;
            if (helper != null)
            {
                helper.TrackPlayerAction(playerId, action, parameters);
            }
        }
        
        /// <summary>
        /// Get current ARPU metrics (using Unity Analytics data)
        /// </summary>
        public System.Collections.Generic.Dictionary<string, object> GetARPUReport()
        {
            var helper = UnityAnalyticsARPUHelper.Instance;
            if (helper != null)
            {
                return helper.GetARPUReport();
            }
            
            return new System.Collections.Generic.Dictionary<string, object>();
        }
        
        /// <summary>
        /// Check if ARPU targets are being met
        /// </summary>
        public bool AreARPUTargetsMet()
        {
            var helper = UnityAnalyticsARPUHelper.Instance;
            if (helper != null)
            {
                return helper.AreARPUTargetsMet();
            }
            
            return false;
        }
        
        /// <summary>
        /// Get ARPU performance vs industry targets
        /// </summary>
        public System.Collections.Generic.Dictionary<string, float> GetARPUPerformance()
        {
            var helper = UnityAnalyticsARPUHelper.Instance;
            if (helper != null)
            {
                return helper.GetARPUPerformance();
            }
            
            return new System.Collections.Generic.Dictionary<string, float>();
        }
        
        /// <summary>
        /// Apply industry leader strategies
        /// </summary>
        public void ApplyIndustryLeaderStrategies()
        {
            if (enableKingStrategies)
            {
                ApplyKingStrategies();
            }
            
            if (enableSupercellStrategies)
            {
                ApplySupercellStrategies();
            }
            
            if (enableNianticStrategies)
            {
                ApplyNianticStrategies();
            }
            
            if (enableEpicStrategies)
            {
                ApplyEpicStrategies();
            }
            
            if (enableRobloxStrategies)
            {
                ApplyRobloxStrategies();
            }
        }
        
        private void ApplyKingStrategies()
        {
            // King (Candy Crush) strategies
            Debug.Log("Applying King (Candy Crush) strategies...");
            
            // Energy monetization
            var energySystem = GetService<EnergySystem>();
            if (energySystem != null)
            {
                // Implement King-style energy system
                energySystem.maxEnergy = 5; // King uses 5 lives
                energySystem.energyRefillTime = 1800f; // 30 minutes per life
                energySystem.energyRefillCost = 1; // 1 gem per life
            }
            
            // Boosters system
            var offerSystem = GetService<PersonalizedOfferSystem>();
            if (offerSystem != null)
            {
                // Add King-style boosters
                var boosters = new[]
                {
                    "color_bomb", "striped_candy", "wrapped_candy", "coconut_wheel", "fish"
                };
                
                foreach (var booster in boosters)
                {
                    // Add booster to offer system
                }
            }
        }
        
        private void ApplySupercellStrategies()
        {
            // Supercell (Clash of Clans) strategies
            Debug.Log("Applying Supercell (Clash of Clans) strategies...");
            
            // Gems system
            var economyService = GetService<EconomyService>();
            if (economyService != null)
            {
                // Implement Supercell-style gems
                AddCurrency("gems", 500); // Starting gems
            }
            
            // Clan system
            var socialSystem = GetService<SocialSystem>();
            if (socialSystem != null)
            {
                // Implement Supercell-style clan features
            }
        }
        
        private void ApplyNianticStrategies()
        {
            // Niantic (Pokemon GO) strategies
            Debug.Log("Applying Niantic (Pokemon GO) strategies...");
            
            // Location-based features
            var liveOpsSystem = GetService<AdvancedLiveOpsSystem>();
            if (liveOpsSystem != null)
            {
                // Implement Niantic-style location-based events
            }
        }
        
        private void ApplyEpicStrategies()
        {
            // Epic (Fortnite) strategies
            Debug.Log("Applying Epic (Fortnite) strategies...");
            
            // Battle pass system
            var subscriptionSystem = GetService<SubscriptionSystem>();
            if (subscriptionSystem != null)
            {
                // Implement Epic-style battle pass
            }
        }
        
        private void ApplyRobloxStrategies()
        {
            // Roblox strategies
            Debug.Log("Applying Roblox strategies...");
            
            // User-generated content
            var personalizationSystem = GetService<AIPersonalizationSystem>();
            if (personalizationSystem != null)
            {
                // Implement Roblox-style UGC features
            }
        }
        
        private void LoadCurrencies()
        {
            string path = Application.persistentDataPath + "/currencies.json";
            if (System.IO.File.Exists(path))
            {
                string json = System.IO.File.ReadAllText(path);
                var currencyData = JsonUtility.FromJson<CurrencyData>(json);
                
                _currencies["coins"] = currencyData.coins;
                _currencies["gems"] = currencyData.gems;
            }
        }
        
        private void SaveCurrencies()
        {
            var currencyData = new CurrencyData
            {
                coins = GetCurrency("coins"),
                gems = GetCurrency("gems")
            };
            
            string json = JsonUtility.ToJson(currencyData, true);
            System.IO.File.WriteAllText(Application.persistentDataPath + "/currencies.json", json);
        }
        
        /// <summary>
        /// Shutdown all systems
        /// </summary>
        public void Shutdown()
        {
            if (!_isInitialized) return;
            
            Debug.Log("Shutting down game systems...");
            
            // Save game state
            GameState.Save();
            
            // Save currencies
            SaveCurrencies();
            
            // Clear service locator
            ServiceLocator.Clear();
            
            _isInitialized = false;
            Debug.Log("Game shutdown completed");
        }
        
        void OnApplicationPause(bool pauseStatus)
        {
            if (pauseStatus)
            {
                GameState.Save();
            }
        }
        
        void OnApplicationFocus(bool hasFocus)
        {
            if (!hasFocus)
            {
                GameState.Save();
            }
        }
        
        void OnDestroy()
        {
            if (Instance == this)
            {
                Shutdown();
            }
        }
    }
    
    [System.Serializable]
    public class CurrencyData
    {
        public int coins;
        public int gems;
    }
}