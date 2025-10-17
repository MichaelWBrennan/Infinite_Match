using System.Collections;
using UnityEngine;
using UnityEngine.SceneManagement;
using System;
using Evergreen.Core;
using Evergreen.AI;
using Evergreen.Analytics;
using Evergreen.Social;
using Evergreen.LiveOps;
using Evergreen.Collections;
using Evergreen.ARPU;
using Evergreen.Retention;
using Evergreen.Addiction;

namespace Evergreen.Core
{
    /// <summary>
    /// Main Game Manager - Central hub for all game systems
    /// Coordinates all game systems and ensures proper initialization order
    /// </summary>
    public class GameManager : MonoBehaviour
    {
        [Header("Game Configuration")]
        public bool enableAI = true;
        public bool enableAnalytics = true;
        public bool enableSocial = true;
        public bool enableLiveOps = true;
        public bool enableCollections = true;
        public bool enableARPU = true;
        public bool enableRetention = true;
        public bool enableAddictionMechanics = true;
        
        [Header("Initialization Settings")]
        public float initializationDelay = 0.1f;
        public bool initializeOnAwake = true;
        public bool showInitializationLogs = true;
        
        [Header("Game State")]
        public GameState currentState = GameState.Initializing;
        public string currentLevel = "1";
        public int playerScore = 0;
        public int playerCoins = 1000;
        public int playerGems = 50;
        
        // System References
        private SceneManager _sceneManager;
        private AIInfiniteContentManager _aiContentManager;
        private GameAnalyticsManager _analyticsManager;
        private AdvancedSocialSystem _socialSystem;
        private LiveEventsSystem _liveEventsSystem;
        private AchievementSystem _achievementSystem;
        private CompleteARPUManager _arpuManager;
        private AdvancedRetentionSystem _retentionSystem;
        private AddictionMechanics _addictionMechanics;
        
        // Events
        public static event Action<GameState> OnGameStateChanged;
        public static event Action<int> OnScoreChanged;
        public static event Action<int> OnCoinsChanged;
        public static event Action<int> OnGemsChanged;
        public static event Action<string> OnLevelChanged;
        public static event Action OnGameInitialized;
        
        public static GameManager Instance { get; private set; }
        
        public enum GameState
        {
            Initializing,
            MainMenu,
            Loading,
            Gameplay,
            Paused,
            Settings,
            Shop,
            Social,
            Events,
            Collections,
            GameOver,
            Quitting
        }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                
                if (initializeOnAwake)
                {
                    StartCoroutine(InitializeGame());
                }
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            if (!initializeOnAwake)
            {
                StartCoroutine(InitializeGame());
            }
        }
        
        /// <summary>
        /// Initialize all game systems
        /// </summary>
        private IEnumerator InitializeGame()
        {
            if (showInitializationLogs)
                Debug.Log("🎮 Starting Game Initialization...");
            
            SetGameState(GameState.Initializing);
            
            // Initialize core systems first
            yield return StartCoroutine(InitializeCoreSystems());
            
            // Initialize game systems
            yield return StartCoroutine(InitializeGameSystems());
            
            // Initialize AI systems
            if (enableAI)
            {
                yield return StartCoroutine(InitializeAISystems());
            }
            
            // Initialize analytics
            if (enableAnalytics)
            {
                yield return StartCoroutine(InitializeAnalytics());
            }
            
            // Initialize social systems
            if (enableSocial)
            {
                yield return StartCoroutine(InitializeSocialSystems());
            }
            
            // Initialize live operations
            if (enableLiveOps)
            {
                yield return StartCoroutine(InitializeLiveOps());
            }
            
            // Initialize collections
            if (enableCollections)
            {
                yield return StartCoroutine(InitializeCollections());
            }
            
            // Initialize monetization
            if (enableARPU)
            {
                yield return StartCoroutine(InitializeARPU());
            }
            
            // Initialize retention
            if (enableRetention)
            {
                yield return StartCoroutine(InitializeRetention());
            }
            
            // Initialize addiction mechanics
            if (enableAddictionMechanics)
            {
                yield return StartCoroutine(InitializeAddictionMechanics());
            }
            
            // Finalize initialization
            yield return StartCoroutine(FinalizeInitialization());
            
            if (showInitializationLogs)
                Debug.Log("✅ Game Initialization Complete!");
            
            OnGameInitialized?.Invoke();
        }
        
        /// <summary>
        /// Initialize core systems
        /// </summary>
        private IEnumerator InitializeCoreSystems()
        {
            if (showInitializationLogs)
                Debug.Log("🔧 Initializing Core Systems...");
            
            // Initialize Scene Manager
            _sceneManager = SceneManager.Instance;
            yield return new WaitForSeconds(initializationDelay);
            
            if (showInitializationLogs)
                Debug.Log("✅ Core Systems Initialized");
        }
        
        /// <summary>
        /// Initialize game systems
        /// </summary>
        private IEnumerator InitializeGameSystems()
        {
            if (showInitializationLogs)
                Debug.Log("🎯 Initializing Game Systems...");
            
            // Load player data
            LoadPlayerData();
            
            // Initialize game state
            SetGameState(GameState.MainMenu);
            
            yield return new WaitForSeconds(initializationDelay);
            
            if (showInitializationLogs)
                Debug.Log("✅ Game Systems Initialized");
        }
        
        /// <summary>
        /// Initialize AI systems
        /// </summary>
        private IEnumerator InitializeAISystems()
        {
            if (showInitializationLogs)
                Debug.Log("🤖 Initializing AI Systems...");
            
            _aiContentManager = FindObjectOfType<AIInfiniteContentManager>();
            if (_aiContentManager == null)
            {
                GameObject aiGO = new GameObject("AIInfiniteContentManager");
                _aiContentManager = aiGO.AddComponent<AIInfiniteContentManager>();
            }
            
            yield return new WaitForSeconds(initializationDelay);
            
            if (showInitializationLogs)
                Debug.Log("✅ AI Systems Initialized");
        }
        
        /// <summary>
        /// Initialize analytics
        /// </summary>
        private IEnumerator InitializeAnalytics()
        {
            if (showInitializationLogs)
                Debug.Log("📊 Initializing Analytics...");
            
            _analyticsManager = FindObjectOfType<GameAnalyticsManager>();
            if (_analyticsManager == null)
            {
                GameObject analyticsGO = new GameObject("GameAnalyticsManager");
                _analyticsManager = analyticsGO.AddComponent<GameAnalyticsManager>();
            }
            
            yield return new WaitForSeconds(initializationDelay);
            
            if (showInitializationLogs)
                Debug.Log("✅ Analytics Initialized");
        }
        
        /// <summary>
        /// Initialize social systems
        /// </summary>
        private IEnumerator InitializeSocialSystems()
        {
            if (showInitializationLogs)
                Debug.Log("👥 Initializing Social Systems...");
            
            _socialSystem = FindObjectOfType<AdvancedSocialSystem>();
            if (_socialSystem == null)
            {
                GameObject socialGO = new GameObject("AdvancedSocialSystem");
                _socialSystem = socialGO.AddComponent<AdvancedSocialSystem>();
            }
            
            yield return new WaitForSeconds(initializationDelay);
            
            if (showInitializationLogs)
                Debug.Log("✅ Social Systems Initialized");
        }
        
        /// <summary>
        /// Initialize live operations
        /// </summary>
        private IEnumerator InitializeLiveOps()
        {
            if (showInitializationLogs)
                Debug.Log("🎪 Initializing Live Operations...");
            
            _liveEventsSystem = FindObjectOfType<LiveEventsSystem>();
            if (_liveEventsSystem == null)
            {
                GameObject liveOpsGO = new GameObject("LiveEventsSystem");
                _liveEventsSystem = liveOpsGO.AddComponent<LiveEventsSystem>();
            }
            
            yield return new WaitForSeconds(initializationDelay);
            
            if (showInitializationLogs)
                Debug.Log("✅ Live Operations Initialized");
        }
        
        /// <summary>
        /// Initialize collections
        /// </summary>
        private IEnumerator InitializeCollections()
        {
            if (showInitializationLogs)
                Debug.Log("🏆 Initializing Collections...");
            
            _achievementSystem = FindObjectOfType<AchievementSystem>();
            if (_achievementSystem == null)
            {
                GameObject collectionsGO = new GameObject("AchievementSystem");
                _achievementSystem = collectionsGO.AddComponent<AchievementSystem>();
            }
            
            yield return new WaitForSeconds(initializationDelay);
            
            if (showInitializationLogs)
                Debug.Log("✅ Collections Initialized");
        }
        
        /// <summary>
        /// Initialize ARPU systems
        /// </summary>
        private IEnumerator InitializeARPU()
        {
            if (showInitializationLogs)
                Debug.Log("💰 Initializing ARPU Systems...");
            
            _arpuManager = FindObjectOfType<CompleteARPUManager>();
            if (_arpuManager == null)
            {
                GameObject arpuGO = new GameObject("CompleteARPUManager");
                _arpuManager = arpuGO.AddComponent<CompleteARPUManager>();
            }
            
            yield return new WaitForSeconds(initializationDelay);
            
            if (showInitializationLogs)
                Debug.Log("✅ ARPU Systems Initialized");
        }
        
        /// <summary>
        /// Initialize retention systems
        /// </summary>
        private IEnumerator InitializeRetention()
        {
            if (showInitializationLogs)
                Debug.Log("🔄 Initializing Retention Systems...");
            
            _retentionSystem = FindObjectOfType<AdvancedRetentionSystem>();
            if (_retentionSystem == null)
            {
                GameObject retentionGO = new GameObject("AdvancedRetentionSystem");
                _retentionSystem = retentionGO.AddComponent<AdvancedRetentionSystem>();
            }
            
            yield return new WaitForSeconds(initializationDelay);
            
            if (showInitializationLogs)
                Debug.Log("✅ Retention Systems Initialized");
        }
        
        /// <summary>
        /// Initialize addiction mechanics
        /// </summary>
        private IEnumerator InitializeAddictionMechanics()
        {
            if (showInitializationLogs)
                Debug.Log("🎯 Initializing Addiction Mechanics...");
            
            _addictionMechanics = FindObjectOfType<AddictionMechanics>();
            if (_addictionMechanics == null)
            {
                GameObject addictionGO = new GameObject("AddictionMechanics");
                _addictionMechanics = addictionGO.AddComponent<AddictionMechanics>();
            }
            
            yield return new WaitForSeconds(initializationDelay);
            
            if (showInitializationLogs)
                Debug.Log("✅ Addiction Mechanics Initialized");
        }
        
        /// <summary>
        /// Finalize initialization
        /// </summary>
        private IEnumerator FinalizeInitialization()
        {
            if (showInitializationLogs)
                Debug.Log("🎉 Finalizing Game Initialization...");
            
            // Set initial game state
            SetGameState(GameState.MainMenu);
            
            // Start background systems
            StartBackgroundSystems();
            
            yield return new WaitForSeconds(initializationDelay);
            
            if (showInitializationLogs)
                Debug.Log("🎮 Game Ready!");
        }
        
        /// <summary>
        /// Start background systems
        /// </summary>
        private void StartBackgroundSystems()
        {
            // Start AI content generation
            if (_aiContentManager != null)
            {
                _aiContentManager.StartAIContentGeneration();
            }
            
            // Start analytics tracking
            if (_analyticsManager != null)
            {
                // Analytics will start automatically
            }
            
            // Start social systems
            if (_socialSystem != null)
            {
                // Social systems will start automatically
            }
            
            // Start live events
            if (_liveEventsSystem != null)
            {
                // Live events will start automatically
            }
        }
        
        /// <summary>
        /// Set game state
        /// </summary>
        public void SetGameState(GameState newState)
        {
            if (currentState != newState)
            {
                GameState previousState = currentState;
                currentState = newState;
                
                OnGameStateChanged?.Invoke(newState);
                
                if (showInitializationLogs)
                    Debug.Log($"Game State: {previousState} -> {newState}");
            }
        }
        
        /// <summary>
        /// Update player score
        /// </summary>
        public void UpdateScore(int newScore)
        {
            playerScore = newScore;
            OnScoreChanged?.Invoke(playerScore);
        }
        
        /// <summary>
        /// Add score
        /// </summary>
        public void AddScore(int points)
        {
            UpdateScore(playerScore + points);
        }
        
        /// <summary>
        /// Update player coins
        /// </summary>
        public void UpdateCoins(int newCoins)
        {
            playerCoins = newCoins;
            OnCoinsChanged?.Invoke(playerCoins);
        }
        
        /// <summary>
        /// Add coins
        /// </summary>
        public void AddCoins(int coins)
        {
            UpdateCoins(playerCoins + coins);
        }
        
        /// <summary>
        /// Update player gems
        /// </summary>
        public void UpdateGems(int newGems)
        {
            playerGems = newGems;
            OnGemsChanged?.Invoke(playerGems);
        }
        
        /// <summary>
        /// Add gems
        /// </summary>
        public void AddGems(int gems)
        {
            UpdateGems(playerGems + gems);
        }
        
        /// <summary>
        /// Update current level
        /// </summary>
        public void UpdateLevel(string newLevel)
        {
            currentLevel = newLevel;
            OnLevelChanged?.Invoke(currentLevel);
        }
        
        /// <summary>
        /// Load player data
        /// </summary>
        private void LoadPlayerData()
        {
            playerScore = PlayerPrefs.GetInt("PlayerScore", 0);
            playerCoins = PlayerPrefs.GetInt("PlayerCoins", 1000);
            playerGems = PlayerPrefs.GetInt("PlayerGems", 50);
            currentLevel = PlayerPrefs.GetString("CurrentLevel", "1");
        }
        
        /// <summary>
        /// Save player data
        /// </summary>
        public void SavePlayerData()
        {
            PlayerPrefs.SetInt("PlayerScore", playerScore);
            PlayerPrefs.SetInt("PlayerCoins", playerCoins);
            PlayerPrefs.SetInt("PlayerGems", playerGems);
            PlayerPrefs.SetString("CurrentLevel", currentLevel);
            PlayerPrefs.Save();
        }
        
        /// <summary>
        /// Start new game
        /// </summary>
        public void StartNewGame()
        {
            SetGameState(GameState.Loading);
            _sceneManager?.LoadScene("Gameplay");
        }
        
        /// <summary>
        /// Pause game
        /// </summary>
        public void PauseGame()
        {
            if (currentState == GameState.Gameplay)
            {
                SetGameState(GameState.Paused);
                Time.timeScale = 0f;
            }
        }
        
        /// <summary>
        /// Resume game
        /// </summary>
        public void ResumeGame()
        {
            if (currentState == GameState.Paused)
            {
                SetGameState(GameState.Gameplay);
                Time.timeScale = 1f;
            }
        }
        
        /// <summary>
        /// Quit game
        /// </summary>
        public void QuitGame()
        {
            SetGameState(GameState.Quitting);
            SavePlayerData();
            
            #if UNITY_EDITOR
                UnityEditor.EditorApplication.isPlaying = false;
            #else
                Application.Quit();
            #endif
        }
        
        void OnApplicationPause(bool pauseStatus)
        {
            if (pauseStatus)
            {
                SavePlayerData();
            }
        }
        
        void OnApplicationFocus(bool hasFocus)
        {
            if (!hasFocus)
            {
                SavePlayerData();
            }
        }
        
        void OnDestroy()
        {
            SavePlayerData();
        }
    }
}