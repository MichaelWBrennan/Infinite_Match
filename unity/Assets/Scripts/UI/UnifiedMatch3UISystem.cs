using UnityEngine;
using UnityEngine.UI;
using TMPro;
using DG.Tweening;
using System.Collections;
using System.Collections.Generic;
using Evergreen.Game;
using Evergreen.Core;
using Evergreen.Social;
using Evergreen.Ads;
using Evergreen.Match3;
using Evergreen.AI;

namespace Evergreen.UI
{
    /// <summary>
    /// Unified Match-3 UI System
    /// Combines all existing UI components with the new Match-3 UI system
    /// Integrates with existing game systems and provides a complete UI solution
    /// </summary>
    public class UnifiedMatch3UISystem : MonoBehaviour
    {
        [Header("UI System Configuration")]
        [SerializeField] private bool useNewMatch3UI = true;
        [SerializeField] private bool integrateWithExistingSystems = true;
        [SerializeField] private bool enableAIGameplay = true;
        [SerializeField] private bool enableIndustryStandards = true;
        
        [Header("UI Controllers")]
        [SerializeField] private Match3UISystem match3UISystem;
        [SerializeField] private IndustryStandardUIManager industryStandardUI;
        [SerializeField] private OptimizedUISystem optimizedUI;
        [SerializeField] private MainMenuController mainMenuController;
        [SerializeField] private LevelSelectionController levelSelectionController;
        [SerializeField] private GameplayHUDController gameplayHUDController;
        [SerializeField] private PopupController popupController;
        
        [Header("Legacy UI Integration")]
        [SerializeField] private OptimizedMainMenuUI legacyMainMenuUI;
        [SerializeField] private GameplayUI legacyGameplayUI;
        [SerializeField] private Match3UIBootstrap legacyBootstrap;
        
        [Header("AI Integration")]
        [SerializeField] private UnifiedAIAPIService aiService;
        [SerializeField] private bool enableAIHints = true;
        [SerializeField] private bool enableAIDifficultyAdaptation = true;
        [SerializeField] private float aiHintFrequency = 0.3f;
        
        [Header("System Integration")]
        [SerializeField] private OptimizedCoreSystem coreSystem;
        [SerializeField] private UnityAdsManager adsManager;
        [SerializeField] private TeamChatUIFactory chatFactory;
        
        private Dictionary<string, UIComponent> activeUIComponents = new Dictionary<string, UIComponent>();
        private bool isInitialized = false;
        
        public static UnifiedMatch3UISystem Instance { get; private set; }
        
        // Events
        public System.Action<GameObject> OnScreenChanged;
        public System.Action<string> OnButtonClicked;
        public System.Action<int, int, int> OnRewardEarned;
        public System.Action<int, int> OnLevelComplete;
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeUnifiedUI();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            if (isInitialized)
            {
                StartUI();
            }
        }
        
        private void InitializeUnifiedUI()
        {
            Debug.Log("🎮 Initializing Unified Match-3 UI System...");
            
            // Initialize core systems
            InitializeCoreSystems();
            
            // Initialize UI controllers
            InitializeUIControllers();
            
            // Setup integration
            SetupSystemIntegration();
            
            // Apply industry standards if enabled
            if (enableIndustryStandards)
            {
                ApplyIndustryStandards();
            }
            
            isInitialized = true;
            Debug.Log("✅ Unified Match-3 UI System initialized!");
        }
        
        private void InitializeCoreSystems()
        {
            // Get or create core system
            if (coreSystem == null)
            {
                coreSystem = FindObjectOfType<OptimizedCoreSystem>();
                if (coreSystem == null)
                {
                    var coreGO = new GameObject("OptimizedCoreSystem");
                    coreSystem = coreGO.AddComponent<OptimizedCoreSystem>();
                }
            }
            
            // Get or create ads manager
            if (adsManager == null)
            {
                adsManager = coreSystem.Resolve<UnityAdsManager>();
                if (adsManager == null)
                {
                    var adsGO = new GameObject("UnityAdsManager");
                    adsManager = adsGO.AddComponent<UnityAdsManager>();
                }
            }
            
            // Get or create AI service
            if (aiService == null && enableAIGameplay)
            {
                aiService = UnifiedAIAPIService.Instance;
                if (aiService == null)
                {
                    var aiGO = new GameObject("UnifiedAIAPIService");
                    aiService = aiGO.AddComponent<UnifiedAIAPIService>();
                }
            }
        }
        
        private void InitializeUIControllers()
        {
            // Initialize Match-3 UI System
            if (useNewMatch3UI)
            {
                if (match3UISystem == null)
                {
                    var match3GO = new GameObject("Match3UISystem");
                    match3UISystem = match3GO.AddComponent<Match3UISystem>();
                }
                
                // Initialize individual controllers
                InitializeMatch3Controllers();
            }
            
            // Initialize Industry Standard UI
            if (enableIndustryStandards)
            {
                if (industryStandardUI == null)
                {
                    var industryGO = new GameObject("IndustryStandardUIManager");
                    industryStandardUI = industryGO.AddComponent<IndustryStandardUIManager>();
                }
            }
            
            // Initialize Optimized UI
            if (integrateWithExistingSystems)
            {
                if (optimizedUI == null)
                {
                    var optimizedGO = new GameObject("OptimizedUISystem");
                    optimizedUI = optimizedGO.AddComponent<OptimizedUISystem>();
                }
            }
        }
        
        private void InitializeMatch3Controllers()
        {
            // Initialize Main Menu Controller
            if (mainMenuController == null)
            {
                var mainMenuGO = new GameObject("MainMenuController");
                mainMenuController = mainMenuGO.AddComponent<MainMenuController>();
            }
            
            // Initialize Level Selection Controller
            if (levelSelectionController == null)
            {
                var levelSelectionGO = new GameObject("LevelSelectionController");
                levelSelectionController = levelSelectionGO.AddComponent<LevelSelectionController>();
            }
            
            // Initialize Gameplay HUD Controller
            if (gameplayHUDController == null)
            {
                var gameplayHUDGO = new GameObject("GameplayHUDController");
                gameplayHUDController = gameplayHUDGO.AddComponent<GameplayHUDController>();
            }
            
            // Initialize Popup Controller
            if (popupController == null)
            {
                var popupGO = new GameObject("PopupController");
                popupController = popupGO.AddComponent<PopupController>();
            }
        }
        
        private void SetupSystemIntegration()
        {
            // Connect UI systems
            if (match3UISystem != null)
            {
                match3UISystem.mainMenuController = mainMenuController;
                match3UISystem.levelSelectionController = levelSelectionController;
                match3UISystem.gameplayHUDController = gameplayHUDController;
                match3UISystem.popupController = popupController;
            }
            
            // Setup event listeners
            SetupEventListeners();
            
            // Setup AI integration
            if (enableAIGameplay && aiService != null)
            {
                SetupAIIntegration();
            }
        }
        
        private void SetupEventListeners()
        {
            // Connect UI events
            if (match3UISystem != null)
            {
                match3UISystem.OnScreenChanged += OnScreenChangedHandler;
                match3UISystem.OnButtonClicked += OnButtonClickedHandler;
            }
            
            // Connect popup events
            if (popupController != null)
            {
                // Popup events are handled internally
            }
        }
        
        private void SetupAIIntegration()
        {
            if (aiService == null) return;
            
            // Setup AI gameplay systems
            if (enableAIHints)
            {
                StartCoroutine(AIHintCoroutine());
            }
            
            if (enableAIDifficultyAdaptation)
            {
                StartCoroutine(AIDifficultyAdaptationCoroutine());
            }
        }
        
        private void ApplyIndustryStandards()
        {
            if (industryStandardUI != null)
            {
                // Industry standards are applied automatically
                Debug.Log("✅ Industry standards applied");
            }
        }
        
        private void StartUI()
        {
            // Show appropriate UI based on current scene
            string currentScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene().name;
            
            switch (currentScene)
            {
                case "MainMenu":
                    ShowMainMenu();
                    break;
                case "Gameplay":
                    ShowGameplay();
                    break;
                case "LevelSelection":
                    ShowLevelSelection();
                    break;
                default:
                    ShowMainMenu();
                    break;
            }
        }
        
        #region UI Management
        
        public void ShowMainMenu()
        {
            Debug.Log("🏠 Showing Main Menu");
            
            if (useNewMatch3UI && match3UISystem != null)
            {
                match3UISystem.ShowMainMenu();
            }
            else if (legacyMainMenuUI != null)
            {
                legacyMainMenuUI.gameObject.SetActive(true);
            }
            
            OnScreenChanged?.Invoke(gameObject);
        }
        
        public void ShowLevelSelection()
        {
            Debug.Log("🗺️ Showing Level Selection");
            
            if (useNewMatch3UI && match3UISystem != null)
            {
                match3UISystem.ShowLevelSelection();
            }
            
            OnScreenChanged?.Invoke(gameObject);
        }
        
        public void ShowGameplay()
        {
            Debug.Log("🎮 Showing Gameplay");
            
            if (useNewMatch3UI && match3UISystem != null)
            {
                match3UISystem.ShowGameplay();
            }
            else if (legacyGameplayUI != null)
            {
                legacyGameplayUI.gameObject.SetActive(true);
            }
            
            OnScreenChanged?.Invoke(gameObject);
        }
        
        public void ShowPause()
        {
            Debug.Log("⏸️ Showing Pause");
            
            if (useNewMatch3UI && match3UISystem != null)
            {
                match3UISystem.ShowPause();
            }
            
            OnScreenChanged?.Invoke(gameObject);
        }
        
        #endregion
        
        #region Game Integration
        
        public void StartGame()
        {
            Debug.Log("🎮 Starting Game");
            
            // Check energy
            if (!GameState.ConsumeEnergy(1))
            {
                ShowEnergyRequiredDialog();
                return;
            }
            
            // Start game
            if (useNewMatch3UI)
            {
                ShowGameplay();
            }
            else
            {
                UnityEngine.SceneManagement.SceneManager.LoadScene("Gameplay");
            }
        }
        
        public void CompleteLevel(int score, int stars, int coinsEarned)
        {
            Debug.Log($"🏆 Level Complete: Score={score}, Stars={stars}, Coins={coinsEarned}");
            
            // Update game state
            GameState.AddCoins(coinsEarned);
            GameState.AddScore(score);
            
            // Show level complete popup
            if (popupController != null)
            {
                popupController.ShowLevelCompletePopup(stars, score, coinsEarned);
            }
            
            // Trigger events
            OnLevelComplete?.Invoke(score, stars);
            OnRewardEarned?.Invoke(coinsEarned, 0, 0);
        }
        
        public void ShowRewardPopup(int coins, int gems, int stars)
        {
            Debug.Log($"🎁 Showing Reward: Coins={coins}, Gems={gems}, Stars={stars}");
            
            if (popupController != null)
            {
                popupController.ShowRewardPopup(coins, gems, stars);
            }
            
            OnRewardEarned?.Invoke(coins, gems, stars);
        }
        
        public void ShowConfirmationDialog(string title, string message, System.Action onConfirm, System.Action onCancel = null)
        {
            Debug.Log($"❓ Showing Confirmation: {title}");
            
            if (popupController != null)
            {
                popupController.ShowConfirmationDialog(title, message, onConfirm, onCancel);
            }
        }
        
        #endregion
        
        #region AI Integration
        
        private IEnumerator AIHintCoroutine()
        {
            while (enableAIHints && aiService != null)
            {
                yield return new WaitForSeconds(1f / aiHintFrequency);
                
                // Request AI hint
                var context = new GameplayContext
                {
                    GameState = "playing",
                    PlayerAction = "hint_request",
                    GameData = new Dictionary<string, object>
                    {
                        ["player_level"] = GameState.CurrentLevel,
                        ["moves_remaining"] = GetMovesRemaining(),
                        ["current_score"] = GameState.Score
                    },
                    Difficulty = "medium",
                    Performance = GetCurrentPerformance()
                };
                
                aiService.RequestGameplayAI("player_1", context, (response) => {
                    if (response != null && !string.IsNullOrEmpty(response.Hint))
                    {
                        ShowAIHint(response.Hint);
                    }
                });
            }
        }
        
        private IEnumerator AIDifficultyAdaptationCoroutine()
        {
            while (enableAIDifficultyAdaptation && aiService != null)
            {
                yield return new WaitForSeconds(5f);
                
                // Request difficulty adaptation
                var context = new GameplayContext
                {
                    GameState = "playing",
                    PlayerAction = "difficulty_check",
                    GameData = new Dictionary<string, object>
                    {
                        ["recent_performance"] = GetRecentPerformance(),
                        ["level_completion_time"] = GetLevelCompletionTime(),
                        ["mistakes_count"] = GetMistakesCount()
                    },
                    Difficulty = "medium",
                    Performance = GetCurrentPerformance()
                };
                
                aiService.RequestGameplayAI("player_1", context, (response) => {
                    if (response != null && response.DifficultyAdjustment != 0)
                    {
                        ApplyDifficultyAdjustment(response.DifficultyAdjustment);
                    }
                });
            }
        }
        
        private void ShowAIHint(string hint)
        {
            Debug.Log($"🤖 AI Hint: {hint}");
            
            // Show hint in UI
            if (gameplayHUDController != null)
            {
                // Show hint in gameplay HUD
            }
        }
        
        private void ApplyDifficultyAdjustment(float adjustment)
        {
            Debug.Log($"🎯 AI Difficulty Adjustment: {adjustment:F2}");
            
            // Apply difficulty adjustment to game
        }
        
        #endregion
        
        #region Helper Methods
        
        private void ShowEnergyRequiredDialog()
        {
            ShowConfirmationDialog(
                "Energy Required",
                "You need energy to play. Watch an ad to get energy?",
                () => {
                    if (adsManager != null)
                    {
                        adsManager.ShowRewarded(() => {
                            GameState.AddEnergy(1);
                            StartGame();
                        });
                    }
                },
                () => {
                    Debug.Log("Player declined to watch ad");
                }
            );
        }
        
        private int GetMovesRemaining()
        {
            // Get remaining moves from game state
            return 10; // Simplified
        }
        
        private float GetCurrentPerformance()
        {
            // Get current performance metric
            return 1f / Time.unscaledDeltaTime / 60f; // FPS-based performance
        }
        
        private Dictionary<string, object> GetRecentPerformance()
        {
            return new Dictionary<string, object>
            {
                ["avg_fps"] = GetCurrentPerformance(),
                ["memory_usage"] = 50f,
                ["cpu_usage"] = 30f
            };
        }
        
        private float GetLevelCompletionTime()
        {
            return Time.time; // Simplified
        }
        
        private int GetMistakesCount()
        {
            return 0; // Simplified
        }
        
        #endregion
        
        #region Event Handlers
        
        private void OnScreenChangedHandler(GameObject screen)
        {
            Debug.Log($"📱 Screen changed to: {screen.name}");
        }
        
        private void OnButtonClickedHandler(string buttonName)
        {
            Debug.Log($"🔘 Button clicked: {buttonName}");
            
            // Handle common button actions
            switch (buttonName)
            {
                case "Play":
                    StartGame();
                    break;
                case "Shop":
                    OpenShop();
                    break;
                case "Settings":
                    OpenSettings();
                    break;
                case "Events":
                    OpenEvents();
                    break;
                case "Social":
                    OpenSocial();
                    break;
                case "Collections":
                    OpenCollections();
                    break;
            }
        }
        
        #endregion
        
        #region Navigation
        
        private void OpenShop()
        {
            Debug.Log("🛒 Opening Shop");
            // Implement shop opening
        }
        
        private void OpenSettings()
        {
            Debug.Log("⚙️ Opening Settings");
            // Implement settings opening
        }
        
        private void OpenEvents()
        {
            Debug.Log("🎉 Opening Events");
            // Implement events opening
        }
        
        private void OpenSocial()
        {
            Debug.Log("👥 Opening Social");
            // Implement social opening
        }
        
        private void OpenCollections()
        {
            Debug.Log("📚 Opening Collections");
            // Implement collections opening
        }
        
        #endregion
        
        #region Public API
        
        public void UpdatePlayerData(int level, int coins, int gems, int energy)
        {
            // Update player data in all UI systems
            if (mainMenuController != null)
            {
                mainMenuController.UpdatePlayerData(level, coins, gems);
            }
            
            if (gameplayHUDController != null)
            {
                gameplayHUDController.UpdateGameplayData(10, 0, 5000); // Simplified
            }
        }
        
        public void UpdateGameplayData(int moves, int score, int target)
        {
            if (gameplayHUDController != null)
            {
                gameplayHUDController.UpdateGameplayData(moves, score, target);
            }
        }
        
        public void ShowScoreIncrement(int score)
        {
            if (gameplayHUDController != null)
            {
                gameplayHUDController.ShowScoreIncrement(score);
            }
        }
        
        public void ShowStarAnimation(int stars)
        {
            if (gameplayHUDController != null)
            {
                gameplayHUDController.ShowStarAnimation(stars);
            }
        }
        
        #endregion
        
        #region Cleanup
        
        void OnDestroy()
        {
            // Clean up event listeners
            if (match3UISystem != null)
            {
                match3UISystem.OnScreenChanged -= OnScreenChangedHandler;
                match3UISystem.OnButtonClicked -= OnButtonClickedHandler;
            }
        }
        
        #endregion
    }
    
    /// <summary>
    /// UI Component wrapper for unified management
    /// </summary>
    public class UIComponent
    {
        public string name;
        public GameObject gameObject;
        public RectTransform rectTransform;
        public Image image;
        public TextMeshProUGUI text;
        public Button button;
        public bool isActive;
        
        public UIComponent(string componentName, GameObject obj)
        {
            name = componentName;
            gameObject = obj;
            rectTransform = obj.GetComponent<RectTransform>();
            image = obj.GetComponent<Image>();
            text = obj.GetComponent<TextMeshProUGUI>();
            button = obj.GetComponent<Button>();
            isActive = obj.activeInHierarchy;
        }
    }
}