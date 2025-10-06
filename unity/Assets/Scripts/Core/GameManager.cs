using UnityEngine;
using Evergreen.Game;
using Evergreen.Performance;
using Evergreen.Ads;
using Evergreen.Social;
using Evergreen.MetaGame;
using Evergreen.Economy;
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
        [SerializeField] private bool enableAnalytics = true;
        
        [Header("Currency Settings")]
        [SerializeField] private int startingCoins = 1000;
        [SerializeField] private int startingGems = 50;
        
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