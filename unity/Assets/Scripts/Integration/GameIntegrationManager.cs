using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using Evergreen.Core;
using Evergreen.Integration;
using Evergreen.AI;
using Evergreen.Gameplay;

namespace Evergreen.Integration
{
    /// <summary>
    /// Game Integration Manager - Central hub for all game systems integration
    /// Coordinates AI content, analytics, backend, and data management
    /// </summary>
    public class GameIntegrationManager : MonoBehaviour
    {
        [Header("Integration Settings")]
        public bool enableAIIntegration = true;
        public bool enableAnalyticsIntegration = true;
        public bool enableBackendIntegration = true;
        public bool enableDataSync = true;
        
        [Header("AI Content Settings")]
        public float aiContentUpdateInterval = 60f;
        public int maxAIContentQueue = 10;
        public bool enablePersonalizedContent = true;
        
        [Header("Analytics Settings")]
        public bool enableRealTimeAnalytics = true;
        public float analyticsBatchInterval = 30f;
        public bool enableCrashReporting = true;
        
        [Header("Backend Settings")]
        public bool enableAutoSync = true;
        public float syncInterval = 300f; // 5 minutes
        public bool enableOfflineMode = true;
        
        // Singleton
        public static GameIntegrationManager Instance { get; private set; }
        
        // System References
        private GameManager gameManager;
        private Match3Board match3Board;
        private AIInfiniteContentManager aiContentManager;
        private GameAnalyticsManager analyticsManager;
        private BackendConnector backendConnector;
        private GameDataManager dataManager;
        private PowerUpSystem powerUpSystem;
        
        // Integration State
        private bool isInitialized = false;
        private bool isOnline = true;
        private Coroutine integrationCoroutine;
        private Coroutine aiContentCoroutine;
        private Coroutine analyticsCoroutine;
        private Coroutine syncCoroutine;
        
        // Events
        public System.Action OnIntegrationComplete;
        public System.Action<bool> OnConnectionStatusChanged;
        public System.Action<string, object> OnAIContentGenerated;
        public System.Action<string, object> OnAnalyticsEvent;
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                Initialize();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            if (!isInitialized)
            {
                StartCoroutine(InitializeIntegration());
            }
        }
        
        /// <summary>
        /// Initialize integration manager
        /// </summary>
        private void Initialize()
        {
            Debug.Log("🔗 Game Integration Manager initializing...");
            
            // Get system references
            gameManager = GameManager.Instance;
            match3Board = FindObjectOfType<Match3Board>();
            aiContentManager = FindObjectOfType<AIInfiniteContentManager>();
            analyticsManager = FindObjectOfType<GameAnalyticsManager>();
            backendConnector = BackendConnector.Instance;
            dataManager = GameDataManager.Instance;
            powerUpSystem = FindObjectOfType<PowerUpSystem>();
            
            Debug.Log("🔗 Game Integration Manager initialized");
        }
        
        /// <summary>
        /// Initialize integration systems
        /// </summary>
        private IEnumerator InitializeIntegration()
        {
            Debug.Log("🔗 Starting integration initialization...");
            
            // Wait for all systems to be ready
            yield return StartCoroutine(WaitForSystems());
            
            // Initialize AI integration
            if (enableAIIntegration)
            {
                yield return StartCoroutine(InitializeAIIntegration());
            }
            
            // Initialize analytics integration
            if (enableAnalyticsIntegration)
            {
                yield return StartCoroutine(InitializeAnalyticsIntegration());
            }
            
            // Initialize backend integration
            if (enableBackendIntegration)
            {
                yield return StartCoroutine(InitializeBackendIntegration());
            }
            
            // Initialize data sync
            if (enableDataSync)
            {
                yield return StartCoroutine(InitializeDataSync());
            }
            
            // Start integration loops
            StartIntegrationLoops();
            
            isInitialized = true;
            OnIntegrationComplete?.Invoke();
            
            Debug.Log("✅ Game Integration complete!");
        }
        
        /// <summary>
        /// Wait for all systems to be ready
        /// </summary>
        private IEnumerator WaitForSystems()
        {
            float timeout = 30f;
            float elapsed = 0f;
            
            while (elapsed < timeout)
            {
                bool allReady = true;
                
                if (gameManager == null) allReady = false;
                if (match3Board == null) allReady = false;
                if (aiContentManager == null) allReady = false;
                if (analyticsManager == null) allReady = false;
                if (backendConnector == null) allReady = false;
                if (dataManager == null) allReady = false;
                
                if (allReady) break;
                
                elapsed += Time.deltaTime;
                yield return null;
            }
            
            if (elapsed >= timeout)
            {
                Debug.LogWarning("⚠️ Some systems not ready after timeout");
            }
        }
        
        /// <summary>
        /// Initialize AI integration
        /// </summary>
        private IEnumerator InitializeAIIntegration()
        {
            Debug.Log("🤖 Initializing AI integration...");
            
            if (aiContentManager != null)
            {
                // Configure AI content manager
                aiContentManager.aiApiBaseUrl = backendConnector.baseUrl + "/ai";
                aiContentManager.apiKey = backendConnector.apiKey;
                
                // Start AI content generation
                aiContentManager.StartAIContentGeneration();
                
                // Subscribe to AI events
                aiContentManager.OnContentGenerated += OnAIContentGenerated;
            }
            
            yield return new WaitForSeconds(1f);
            Debug.Log("✅ AI integration complete");
        }
        
        /// <summary>
        /// Initialize analytics integration
        /// </summary>
        private IEnumerator InitializeAnalyticsIntegration()
        {
            Debug.Log("📊 Initializing analytics integration...");
            
            if (analyticsManager != null)
            {
                // Configure analytics
                analyticsManager.enableRealTimeTracking = enableRealTimeAnalytics;
                analyticsManager.enableCrashReporting = enableCrashReporting;
                
                // Subscribe to game events
                if (gameManager != null)
                {
                    gameManager.OnScoreChanged += (score) => TrackEvent("score_changed", new Dictionary<string, object> { {"score", score} });
                    gameManager.OnCoinsChanged += (coins) => TrackEvent("coins_changed", new Dictionary<string, object> { {"coins", coins} });
                    gameManager.OnGemsChanged += (gems) => TrackEvent("gems_changed", new Dictionary<string, object> { {"gems", gems} });
                    gameManager.OnLevelChanged += (level) => TrackEvent("level_changed", new Dictionary<string, object> { {"level", level} });
                }
                
                if (match3Board != null)
                {
                    match3Board.OnMatchFound += (tiles) => TrackEvent("match_found", new Dictionary<string, object> { {"match_count", tiles.Length} });
                    match3Board.OnGameOver += (won) => TrackEvent("game_over", new Dictionary<string, object> { {"won", won} });
                }
                
                if (powerUpSystem != null)
                {
                    powerUpSystem.OnPowerUpSpawned += (type, pos) => TrackEvent("power_up_spawned", new Dictionary<string, object> { {"type", type.ToString()}, {"position", pos} });
                    powerUpSystem.OnPowerUpActivated += (type, pos) => TrackEvent("power_up_activated", new Dictionary<string, object> { {"type", type.ToString()}, {"position", pos} });
                }
            }
            
            yield return new WaitForSeconds(1f);
            Debug.Log("✅ Analytics integration complete");
        }
        
        /// <summary>
        /// Initialize backend integration
        /// </summary>
        private IEnumerator InitializeBackendIntegration()
        {
            Debug.Log("🌐 Initializing backend integration...");
            
            if (backendConnector != null)
            {
                // Subscribe to connection events
                backendConnector.OnConnectionStatusChanged += OnBackendConnectionChanged;
                backendConnector.OnDataReceived += OnBackendDataReceived;
                backendConnector.OnError += OnBackendError;
                
                // Test connection
                yield return StartCoroutine(TestBackendConnection());
            }
            
            yield return new WaitForSeconds(1f);
            Debug.Log("✅ Backend integration complete");
        }
        
        /// <summary>
        /// Initialize data sync
        /// </summary>
        private IEnumerator InitializeDataSync()
        {
            Debug.Log("💾 Initializing data sync...");
            
            if (dataManager != null)
            {
                // Load initial data
                dataManager.LoadGameData();
                
                // Subscribe to data events
                dataManager.OnGameDataLoaded += OnGameDataLoaded;
                dataManager.OnGameDataSaved += OnGameDataSaved;
                dataManager.OnSaveError += OnDataSaveError;
                dataManager.OnLoadError += OnDataLoadError;
            }
            
            yield return new WaitForSeconds(1f);
            Debug.Log("✅ Data sync complete");
        }
        
        /// <summary>
        /// Start integration loops
        /// </summary>
        private void StartIntegrationLoops()
        {
            // Start AI content loop
            if (enableAIIntegration && aiContentCoroutine == null)
            {
                aiContentCoroutine = StartCoroutine(AIContentLoop());
            }
            
            // Start analytics loop
            if (enableAnalyticsIntegration && analyticsCoroutine == null)
            {
                analyticsCoroutine = StartCoroutine(AnalyticsLoop());
            }
            
            // Start sync loop
            if (enableAutoSync && syncCoroutine == null)
            {
                syncCoroutine = StartCoroutine(SyncLoop());
            }
        }
        
        /// <summary>
        /// AI content loop
        /// </summary>
        private IEnumerator AIContentLoop()
        {
            while (true)
            {
                yield return new WaitForSeconds(aiContentUpdateInterval);
                
                if (aiContentManager != null && isOnline)
                {
                    // Generate personalized content
                    if (enablePersonalizedContent)
                    {
                        GeneratePersonalizedContent();
                    }
                    
                    // Update AI recommendations
                    UpdateAIRecommendations();
                }
            }
        }
        
        /// <summary>
        /// Analytics loop
        /// </summary>
        private IEnumerator AnalyticsLoop()
        {
            while (true)
            {
                yield return new WaitForSeconds(analyticsBatchInterval);
                
                if (analyticsManager != null && isOnline)
                {
                    // Send batched analytics
                    analyticsManager.SendBatchedEvents();
                }
            }
        }
        
        /// <summary>
        /// Sync loop
        /// </summary>
        private IEnumerator SyncLoop()
        {
            while (true)
            {
                yield return new WaitForSeconds(syncInterval);
                
                if (isOnline && dataManager != null)
                {
                    // Sync data with backend
                    dataManager.SaveGameData();
                }
            }
        }
        
        /// <summary>
        /// Generate personalized content
        /// </summary>
        private void GeneratePersonalizedContent()
        {
            if (aiContentManager == null) return;
            
            // Get player profile
            var playerProfile = dataManager?.GetCurrentGameData();
            if (playerProfile == null) return;
            
            // Generate content based on player profile
            aiContentManager.GenerateAIContent("level", (content) => {
                if (content != null)
                {
                    OnAIContentGenerated?.Invoke("level", content);
                }
            });
            
            aiContentManager.GenerateAIContent("power_up", (content) => {
                if (content != null)
                {
                    OnAIContentGenerated?.Invoke("power_up", content);
                }
            });
        }
        
        /// <summary>
        /// Update AI recommendations
        /// </summary>
        private void UpdateAIRecommendations()
        {
            if (aiContentManager == null) return;
            
            // Get personalized recommendations
            aiContentManager.GetPersonalizedRecommendations("gameplay", (recommendations) => {
                if (recommendations != null && recommendations.Count > 0)
                {
                    // Apply recommendations to game
                    ApplyAIRecommendations(recommendations);
                }
            });
        }
        
        /// <summary>
        /// Apply AI recommendations
        /// </summary>
        private void ApplyAIRecommendations(List<object> recommendations)
        {
            foreach (var recommendation in recommendations)
            {
                // Parse and apply recommendation
                // This would be customized based on your AI response format
                Debug.Log($"🤖 Applying AI recommendation: {recommendation}");
            }
        }
        
        /// <summary>
        /// Track analytics event
        /// </summary>
        private void TrackEvent(string eventName, Dictionary<string, object> eventData)
        {
            if (analyticsManager != null)
            {
                analyticsManager.TrackEvent(eventName, eventData);
            }
            
            if (backendConnector != null && isOnline)
            {
                backendConnector.TrackEvent(eventName, eventData);
            }
            
            OnAnalyticsEvent?.Invoke(eventName, eventData);
        }
        
        /// <summary>
        /// Test backend connection
        /// </summary>
        private IEnumerator TestBackendConnection()
        {
            if (backendConnector == null) yield break;
            
            // Test connection
            bool connected = backendConnector.IsOnline();
            isOnline = connected;
            
            if (connected)
            {
                Debug.Log("🌐 Backend connection successful");
            }
            else
            {
                Debug.LogWarning("⚠️ Backend connection failed");
            }
        }
        
        /// <summary>
        /// Handle backend connection change
        /// </summary>
        private void OnBackendConnectionChanged(bool online)
        {
            isOnline = online;
            OnConnectionStatusChanged?.Invoke(online);
            
            if (online)
            {
                Debug.Log("🌐 Backend connection restored");
                // Sync data when connection is restored
                if (dataManager != null)
                {
                    dataManager.SaveGameData();
                }
            }
            else
            {
                Debug.LogWarning("⚠️ Backend connection lost");
            }
        }
        
        /// <summary>
        /// Handle backend data received
        /// </summary>
        private void OnBackendDataReceived(string endpoint, object data)
        {
            Debug.Log($"📥 Backend data received from {endpoint}");
            
            // Process received data
            ProcessBackendData(endpoint, data);
        }
        
        /// <summary>
        /// Handle backend error
        /// </summary>
        private void OnBackendError(string endpoint, string error)
        {
            Debug.LogError($"❌ Backend error from {endpoint}: {error}");
        }
        
        /// <summary>
        /// Process backend data
        /// </summary>
        private void ProcessBackendData(string endpoint, object data)
        {
            switch (endpoint)
            {
                case "/ai/generate":
                    ProcessAIContentData(data);
                    break;
                case "/analytics/track":
                    ProcessAnalyticsData(data);
                    break;
                case "/game/data":
                    ProcessGameData(data);
                    break;
                default:
                    Debug.LogWarning($"⚠️ Unknown endpoint: {endpoint}");
                    break;
            }
        }
        
        /// <summary>
        /// Process AI content data
        /// </summary>
        private void ProcessAIContentData(object data)
        {
            // Process AI-generated content
            Debug.Log("🤖 Processing AI content data");
        }
        
        /// <summary>
        /// Process analytics data
        /// </summary>
        private void ProcessAnalyticsData(object data)
        {
            // Process analytics data
            Debug.Log("📊 Processing analytics data");
        }
        
        /// <summary>
        /// Process game data
        /// </summary>
        private void ProcessGameData(object data)
        {
            // Process game data from backend
            Debug.Log("💾 Processing game data from backend");
        }
        
        /// <summary>
        /// Handle game data loaded
        /// </summary>
        private void OnGameDataLoaded(GameDataManager.GameData data)
        {
            Debug.Log("💾 Game data loaded");
        }
        
        /// <summary>
        /// Handle game data saved
        /// </summary>
        private void OnGameDataSaved(GameDataManager.GameData data)
        {
            Debug.Log("💾 Game data saved");
        }
        
        /// <summary>
        /// Handle data save error
        /// </summary>
        private void OnDataSaveError(string error)
        {
            Debug.LogError($"❌ Data save error: {error}");
        }
        
        /// <summary>
        /// Handle data load error
        /// </summary>
        private void OnDataLoadError(string error)
        {
            Debug.LogError($"❌ Data load error: {error}");
        }
        
        /// <summary>
        /// Get integration status
        /// </summary>
        public bool IsInitialized()
        {
            return isInitialized;
        }
        
        /// <summary>
        /// Get connection status
        /// </summary>
        public bool IsOnline()
        {
            return isOnline;
        }
        
        /// <summary>
        /// Force sync data
        /// </summary>
        public void ForceSync()
        {
            if (dataManager != null)
            {
                dataManager.SaveGameData();
            }
        }
        
        /// <summary>
        /// Get system status
        /// </summary>
        public Dictionary<string, bool> GetSystemStatus()
        {
            return new Dictionary<string, bool>
            {
                {"GameManager", gameManager != null},
                {"Match3Board", match3Board != null},
                {"AIContentManager", aiContentManager != null},
                {"AnalyticsManager", analyticsManager != null},
                {"BackendConnector", backendConnector != null},
                {"DataManager", dataManager != null},
                {"PowerUpSystem", powerUpSystem != null},
                {"Online", isOnline}
            };
        }
        
        void OnDestroy()
        {
            // Stop all coroutines
            if (aiContentCoroutine != null)
            {
                StopCoroutine(aiContentCoroutine);
            }
            
            if (analyticsCoroutine != null)
            {
                StopCoroutine(analyticsCoroutine);
            }
            
            if (syncCoroutine != null)
            {
                StopCoroutine(syncCoroutine);
            }
        }
    }
}