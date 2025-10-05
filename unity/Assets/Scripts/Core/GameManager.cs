using UnityEngine;
using Evergreen.Game;
using Evergreen.Performance;
using Evergreen.Ads;
using Evergreen.Social;

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
        
        public static GameManager Instance { get; private set; }
        
        private bool _isInitialized = false;
        
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
            
            Debug.Log("Core systems initialized");
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
        /// Shutdown all systems
        /// </summary>
        public void Shutdown()
        {
            if (!_isInitialized) return;
            
            Debug.Log("Shutting down game systems...");
            
            // Save game state
            GameState.Save();
            
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
}