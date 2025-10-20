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
    /// Complete Unified UI Setup
    /// Sets up the entire UI system by combining all existing components
    /// with the new Match-3 UI system for a complete solution
    /// </summary>
    public class CompleteUnifiedUISetup : MonoBehaviour
    {
        [Header("Setup Configuration")]
        [SerializeField] private bool setupOnStart = true;
        [SerializeField] private bool useNewMatch3UI = true;
        [SerializeField] private bool integrateWithExistingSystems = true;
        [SerializeField] private bool enableAIGameplay = true;
        [SerializeField] private bool enableIndustryStandards = true;
        [SerializeField] private bool showDebugInfo = true;
        
        [Header("UI System References")]
        [SerializeField] private UnifiedMatch3UISystem unifiedUI;
        [SerializeField] private Match3UISystem match3UISystem;
        [SerializeField] private IndustryStandardUIManager industryStandardUI;
        [SerializeField] private OptimizedUISystem optimizedUI;
        
        [Header("Legacy System Integration")]
        [SerializeField] private OptimizedMainMenuUI legacyMainMenuUI;
        [SerializeField] private GameplayUI legacyGameplayUI;
        [SerializeField] private Match3UIBootstrap legacyBootstrap;
        
        [Header("Core System Integration")]
        [SerializeField] private OptimizedCoreSystem coreSystem;
        [SerializeField] private UnityAdsManager adsManager;
        [SerializeField] private UnifiedAIAPIService aiService;
        
        void Start()
        {
            if (setupOnStart)
            {
                StartCoroutine(SetupCompleteUnifiedUI());
            }
        }
        
        [ContextMenu("Setup Complete Unified UI")]
        public void SetupCompleteUIManual()
        {
            StartCoroutine(SetupCompleteUnifiedUI());
        }
        
        private IEnumerator SetupCompleteUnifiedUI()
        {
            Debug.Log("🎮 Starting Complete Unified UI Setup...");
            
            // Step 1: Initialize core systems
            yield return StartCoroutine(InitializeCoreSystems());
            
            // Step 2: Setup existing UI systems
            yield return StartCoroutine(SetupExistingUISystems());
            
            // Step 3: Create new Match-3 UI system
            if (useNewMatch3UI)
            {
                yield return StartCoroutine(CreateNewMatch3UISystem());
            }
            
            // Step 4: Create unified UI system
            yield return StartCoroutine(CreateUnifiedUISystem());
            
            // Step 5: Integrate all systems
            yield return StartCoroutine(IntegrateAllSystems());
            
            // Step 6: Apply industry standards
            if (enableIndustryStandards)
            {
                yield return StartCoroutine(ApplyIndustryStandards());
            }
            
            // Step 7: Setup AI integration
            if (enableAIGameplay)
            {
                yield return StartCoroutine(SetupAIIntegration());
            }
            
            // Step 8: Final configuration
            yield return StartCoroutine(FinalConfiguration());
            
            Debug.Log("🎉 Complete Unified UI Setup Finished!");
        }
        
        private IEnumerator InitializeCoreSystems()
        {
            Debug.Log("🔧 Initializing core systems...");
            
            // Initialize OptimizedCoreSystem
            if (coreSystem == null)
            {
                var coreGO = new GameObject("OptimizedCoreSystem");
                coreSystem = coreGO.AddComponent<OptimizedCoreSystem>();
            }
            
            // Initialize UnityAdsManager
            if (adsManager == null)
            {
                var adsGO = new GameObject("UnityAdsManager");
                adsManager = adsGO.AddComponent<UnityAdsManager>();
                coreSystem.Register<UnityAdsManager>(adsManager);
            }
            
            // Initialize UnifiedAIAPIService
            if (aiService == null && enableAIGameplay)
            {
                var aiGO = new GameObject("UnifiedAIAPIService");
                aiService = aiGO.AddComponent<UnifiedAIAPIService>();
            }
            
            yield return new WaitForEndOfFrame();
        }
        
        private IEnumerator SetupExistingUISystems()
        {
            Debug.Log("📱 Setting up existing UI systems...");
            
            // Setup legacy main menu UI
            if (legacyMainMenuUI == null)
            {
                var legacyMainMenuGO = new GameObject("LegacyMainMenuUI");
                legacyMainMenuUI = legacyMainMenuGO.AddComponent<OptimizedMainMenuUI>();
            }
            
            // Setup legacy gameplay UI
            if (legacyGameplayUI == null)
            {
                var legacyGameplayGO = new GameObject("LegacyGameplayUI");
                legacyGameplayUI = legacyGameplayGO.AddComponent<GameplayUI>();
            }
            
            // Setup legacy bootstrap
            if (legacyBootstrap == null)
            {
                var legacyBootstrapGO = new GameObject("LegacyBootstrap");
                legacyBootstrap = legacyBootstrapGO.AddComponent<Match3UIBootstrap>();
            }
            
            yield return new WaitForEndOfFrame();
        }
        
        private IEnumerator CreateNewMatch3UISystem()
        {
            Debug.Log("🎮 Creating new Match-3 UI system...");
            
            // Create Match3UISystem
            if (match3UISystem == null)
            {
                var match3GO = new GameObject("Match3UISystem");
                match3UISystem = match3GO.AddComponent<Match3UISystem>();
            }
            
            // Create IndustryStandardUIManager
            if (industryStandardUI == null)
            {
                var industryGO = new GameObject("IndustryStandardUIManager");
                industryStandardUI = industryGO.AddComponent<IndustryStandardUIManager>();
            }
            
            // Create OptimizedUISystem
            if (optimizedUI == null)
            {
                var optimizedGO = new GameObject("OptimizedUISystem");
                optimizedUI = optimizedGO.AddComponent<OptimizedUISystem>();
            }
            
            yield return new WaitForEndOfFrame();
        }
        
        private IEnumerator CreateUnifiedUISystem()
        {
            Debug.Log("🔗 Creating unified UI system...");
            
            // Create UnifiedMatch3UISystem
            if (unifiedUI == null)
            {
                var unifiedGO = new GameObject("UnifiedMatch3UISystem");
                unifiedUI = unifiedGO.AddComponent<UnifiedMatch3UISystem>();
            }
            
            // Configure unified UI
            unifiedUI.useNewMatch3UI = useNewMatch3UI;
            unifiedUI.integrateWithExistingSystems = integrateWithExistingSystems;
            unifiedUI.enableAIGameplay = enableAIGameplay;
            unifiedUI.enableIndustryStandards = enableIndustryStandards;
            
            yield return new WaitForEndOfFrame();
        }
        
        private IEnumerator IntegrateAllSystems()
        {
            Debug.Log("🔗 Integrating all systems...");
            
            // Connect unified UI to all systems
            if (unifiedUI != null)
            {
                unifiedUI.match3UISystem = match3UISystem;
                unifiedUI.industryStandardUI = industryStandardUI;
                unifiedUI.optimizedUI = optimizedUI;
                unifiedUI.legacyMainMenuUI = legacyMainMenuUI;
                unifiedUI.legacyGameplayUI = legacyGameplayUI;
                unifiedUI.coreSystem = coreSystem;
                unifiedUI.adsManager = adsManager;
                unifiedUI.aiService = aiService;
            }
            
            // Connect Match-3 UI to controllers
            if (match3UISystem != null)
            {
                // Controllers are created automatically by Match3UISystem
            }
            
            yield return new WaitForEndOfFrame();
        }
        
        private IEnumerator ApplyIndustryStandards()
        {
            Debug.Log("🎨 Applying industry standards...");
            
            // Industry standards are applied automatically by IndustryStandardUIManager
            if (industryStandardUI != null)
            {
                // Standards are applied in the manager's Awake/Start methods
            }
            
            yield return new WaitForEndOfFrame();
        }
        
        private IEnumerator SetupAIIntegration()
        {
            Debug.Log("🤖 Setting up AI integration...");
            
            // AI integration is handled by UnifiedMatch3UISystem
            if (unifiedUI != null && aiService != null)
            {
                // AI systems are initialized automatically
            }
            
            yield return new WaitForEndOfFrame();
        }
        
        private IEnumerator FinalConfiguration()
        {
            Debug.Log("⚙️ Final configuration...");
            
            // Show appropriate UI based on current scene
            string currentScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene().name;
            
            switch (currentScene)
            {
                case "MainMenu":
                    if (unifiedUI != null)
                    {
                        unifiedUI.ShowMainMenu();
                    }
                    break;
                case "Gameplay":
                    if (unifiedUI != null)
                    {
                        unifiedUI.ShowGameplay();
                    }
                    break;
                case "LevelSelection":
                    if (unifiedUI != null)
                    {
                        unifiedUI.ShowLevelSelection();
                    }
                    break;
                default:
                    if (unifiedUI != null)
                    {
                        unifiedUI.ShowMainMenu();
                    }
                    break;
            }
            
            // Update player data
            if (unifiedUI != null)
            {
                unifiedUI.UpdatePlayerData(
                    GameState.CurrentLevel,
                    GameState.Coins,
                    GameState.Gems,
                    GameState.EnergyCurrent
                );
            }
            
            yield return new WaitForEndOfFrame();
        }
        
        #region Public API
        
        public void ShowMainMenu()
        {
            if (unifiedUI != null)
            {
                unifiedUI.ShowMainMenu();
            }
        }
        
        public void ShowGameplay()
        {
            if (unifiedUI != null)
            {
                unifiedUI.ShowGameplay();
            }
        }
        
        public void ShowLevelSelection()
        {
            if (unifiedUI != null)
            {
                unifiedUI.ShowLevelSelection();
            }
        }
        
        public void StartGame()
        {
            if (unifiedUI != null)
            {
                unifiedUI.StartGame();
            }
        }
        
        public void CompleteLevel(int score, int stars, int coinsEarned)
        {
            if (unifiedUI != null)
            {
                unifiedUI.CompleteLevel(score, stars, coinsEarned);
            }
        }
        
        public void ShowRewardPopup(int coins, int gems, int stars)
        {
            if (unifiedUI != null)
            {
                unifiedUI.ShowRewardPopup(coins, gems, stars);
            }
        }
        
        public void ShowConfirmationDialog(string title, string message, System.Action onConfirm, System.Action onCancel = null)
        {
            if (unifiedUI != null)
            {
                unifiedUI.ShowConfirmationDialog(title, message, onConfirm, onCancel);
            }
        }
        
        public void UpdatePlayerData(int level, int coins, int gems, int energy)
        {
            if (unifiedUI != null)
            {
                unifiedUI.UpdatePlayerData(level, coins, gems, energy);
            }
        }
        
        public void UpdateGameplayData(int moves, int score, int target)
        {
            if (unifiedUI != null)
            {
                unifiedUI.UpdateGameplayData(moves, score, target);
            }
        }
        
        public void ShowScoreIncrement(int score)
        {
            if (unifiedUI != null)
            {
                unifiedUI.ShowScoreIncrement(score);
            }
        }
        
        public void ShowStarAnimation(int stars)
        {
            if (unifiedUI != null)
            {
                unifiedUI.ShowStarAnimation(stars);
            }
        }
        
        #endregion
        
        #region Debug Methods
        
        [ContextMenu("Check UI Status")]
        public void CheckUIStatus()
        {
            Debug.Log("🔍 UI Status Check:");
            
            if (unifiedUI != null)
            {
                Debug.Log("✅ UnifiedMatch3UISystem: Active");
            }
            else
            {
                Debug.Log("❌ UnifiedMatch3UISystem: Missing");
            }
            
            if (match3UISystem != null)
            {
                Debug.Log("✅ Match3UISystem: Active");
            }
            else
            {
                Debug.Log("❌ Match3UISystem: Missing");
            }
            
            if (industryStandardUI != null)
            {
                Debug.Log("✅ IndustryStandardUIManager: Active");
            }
            else
            {
                Debug.Log("❌ IndustryStandardUIManager: Missing");
            }
            
            if (optimizedUI != null)
            {
                Debug.Log("✅ OptimizedUISystem: Active");
            }
            else
            {
                Debug.Log("❌ OptimizedUISystem: Missing");
            }
            
            if (coreSystem != null)
            {
                Debug.Log("✅ OptimizedCoreSystem: Active");
            }
            else
            {
                Debug.Log("❌ OptimizedCoreSystem: Missing");
            }
            
            if (adsManager != null)
            {
                Debug.Log("✅ UnityAdsManager: Active");
            }
            else
            {
                Debug.Log("❌ UnityAdsManager: Missing");
            }
            
            if (aiService != null)
            {
                Debug.Log("✅ UnifiedAIAPIService: Active");
            }
            else
            {
                Debug.Log("❌ UnifiedAIAPIService: Missing");
            }
        }
        
        [ContextMenu("Test UI Functions")]
        public void TestUIFunctions()
        {
            Debug.Log("🧪 Testing UI Functions...");
            
            // Test main menu
            ShowMainMenu();
            
            // Test gameplay
            ShowGameplay();
            
            // Test level selection
            ShowLevelSelection();
            
            // Test reward popup
            ShowRewardPopup(100, 10, 3);
            
            // Test confirmation dialog
            ShowConfirmationDialog(
                "Test Dialog",
                "This is a test confirmation dialog.",
                () => Debug.Log("Confirmed!"),
                () => Debug.Log("Cancelled!")
            );
            
            Debug.Log("✅ UI Functions test completed!");
        }
        
        #endregion
    }
}