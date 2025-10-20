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
using Evergreen.HybridGameplay;

namespace Evergreen.UI
{
    /// <summary>
    /// Master UI Setup - One-Click Complete UI System Setup
    /// Replaces all individual setup scripts with a single, comprehensive solution
    /// Merges: CompleteUnifiedUISetup, CompleteMatch3UISetup, RoyalMatchSceneSetup, 
    /// OneClickRoyalMatchSetup, RoyalMatchUISetup, and Match3UIBootstrap
    /// </summary>
    public class MasterUISetup : MonoBehaviour
    {
        [Header("🎮 Master Setup Configuration")]
        [SerializeField] private bool setupOnStart = true;
        [SerializeField] private bool useRoyalMatchStyle = true;
        [SerializeField] private bool useIndustryStandards = true;
        [SerializeField] private bool usePremiumFeatures = true;
        [SerializeField] private bool integrateWithLegacy = true;
        [SerializeField] private bool enableAIGameplay = true;
        [SerializeField] private bool showDebugInfo = true;
        [SerializeField] private bool createUIPanels = true;
        [SerializeField] private bool applyStyling = true;
        [SerializeField] private bool setupAnimations = true;
        
        [Header("🎨 Styling Configuration")]
        [SerializeField] private Color primaryColor = new Color(0.2f, 0.6f, 0.9f, 1f);
        [SerializeField] private Color secondaryColor = new Color(1f, 0.8f, 0.2f, 1f);
        [SerializeField] private Color accentColor = new Color(0.9f, 0.3f, 0.3f, 1f);
        [SerializeField] private Color backgroundColor = new Color(0.95f, 0.95f, 0.98f, 1f);
        [SerializeField] private Color textColor = new Color(0.2f, 0.2f, 0.2f, 1f);
        
        [Header("🎭 Animation Configuration")]
        [SerializeField] private float defaultAnimationDuration = 0.3f;
        [SerializeField] private Ease defaultEase = Ease.OutCubic;
        [SerializeField] private float bounceIntensity = 1.2f;
        [SerializeField] private float shakeIntensity = 10f;
        [SerializeField] private bool enableHapticFeedback = true;
        [SerializeField] private bool enableParticleEffects = true;
        [SerializeField] private bool enableScreenShake = true;
        [SerializeField] private bool enableGlowEffects = true;
        
        [Header("🔊 Audio Configuration")]
        [SerializeField] private AudioClip buttonClickSound;
        [SerializeField] private AudioClip buttonHoverSound;
        [SerializeField] private AudioClip successSound;
        [SerializeField] private AudioClip errorSound;
        [SerializeField] private AudioClip levelCompleteSound;
        
        [Header("🤖 AI Configuration")]
        [SerializeField] private bool enableAIHints = true;
        [SerializeField] private bool enableAIDifficultyAdaptation = true;
        [SerializeField] private float aiHintFrequency = 0.3f;
        
        [Header("📊 Performance Configuration")]
        [SerializeField] private bool enablePerformanceOptimization = true;
        [SerializeField] private bool enableObjectPooling = true;
        [SerializeField] private int maxPooledObjects = 100;
        
        [Header("🔧 System References")]
        [SerializeField] private MasterUISystem masterUI;
        [SerializeField] private OptimizedCoreSystem coreSystem;
        [SerializeField] private UnityAdsManager adsManager;
        [SerializeField] private UnifiedAIAPIService aiService;
        [SerializeField] private HybridGameplayManager hybridGameplayManager;
        
        [Header("📱 UI Panel References")]
        [SerializeField] private GameObject mainMenuScreen;
        [SerializeField] private GameObject levelSelectionScreen;
        [SerializeField] private GameObject gameplayScreen;
        [SerializeField] private GameObject pauseScreen;
        [SerializeField] private GameObject shopScreen;
        [SerializeField] private GameObject settingsScreen;
        [SerializeField] private GameObject eventsScreen;
        [SerializeField] private GameObject socialScreen;
        [SerializeField] private GameObject collectionsScreen;
        [SerializeField] private GameObject profileScreen;
        
        [Header("🎯 Controller References")]
        [SerializeField] private MainMenuController mainMenuController;
        [SerializeField] private LevelSelectionController levelSelectionController;
        [SerializeField] private GameplayHUDController gameplayHUDController;
        [SerializeField] private PopupController popupController;
        [SerializeField] private ShopUI shopUI;
        [SerializeField] private SettingsUI settingsUI;
        [SerializeField] private EventsUI eventsUI;
        [SerializeField] private SocialUI socialUI;
        [SerializeField] private CollectionsUI collectionsUI;
        
        [Header("🎪 Visual Effect References")]
        [SerializeField] private ParticleSystem sparkleEffect;
        [SerializeField] private ParticleSystem confettiEffect;
        [SerializeField] private ParticleSystem starBurstEffect;
        [SerializeField] private GameObject glowEffect;
        [SerializeField] private GameObject rippleEffect;
        
        void Start()
        {
            if (setupOnStart)
            {
                StartCoroutine(SetupMasterUI());
            }
        }
        
        [ContextMenu("Setup Master UI")]
        public void SetupMasterUIManual()
        {
            StartCoroutine(SetupMasterUI());
        }
        
        private IEnumerator SetupMasterUI()
        {
            Debug.Log("🎮 Starting Master UI Setup...");
            
            // Step 1: Initialize core systems
            yield return StartCoroutine(InitializeCoreSystems());
            
            // Step 2: Create Master UI System
            yield return StartCoroutine(CreateMasterUISystem());
            
            // Step 3: Create UI panels
            if (createUIPanels)
            {
                yield return StartCoroutine(CreateUIPanels());
            }
            
            // Step 4: Create UI controllers
            yield return StartCoroutine(CreateUIControllers());
            
            // Step 5: Setup visual effects
            if (usePremiumFeatures)
            {
                yield return StartCoroutine(SetupVisualEffects());
            }
            
            // Step 6: Setup audio
            yield return StartCoroutine(SetupAudio());
            
            // Step 7: Apply styling
            if (applyStyling)
            {
                yield return StartCoroutine(ApplyStyling());
            }
            
            // Step 8: Setup animations
            if (setupAnimations)
            {
                yield return StartCoroutine(SetupAnimations());
            }
            
            // Step 9: Setup AI integration
            if (enableAIGameplay)
            {
                yield return StartCoroutine(SetupAIIntegration());
            }
            
            // Step 10: Integrate with legacy systems
            if (integrateWithLegacy)
            {
                yield return StartCoroutine(IntegrateWithLegacySystems());
            }
            
            // Step 11: Final configuration
            yield return StartCoroutine(FinalConfiguration());
            
            Debug.Log("🎉 Master UI Setup Complete!");
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
            
            // Initialize HybridGameplayManager
            if (hybridGameplayManager == null)
            {
                var hybridGO = new GameObject("HybridGameplayManager");
                hybridGameplayManager = hybridGO.AddComponent<HybridGameplayManager>();
            }
            
            // Initialize UnifiedAIAPIService
            if (aiService == null && enableAIGameplay)
            {
                var aiGO = new GameObject("UnifiedAIAPIService");
                aiService = aiGO.AddComponent<UnifiedAIAPIService>();
            }
            
            yield return new WaitForEndOfFrame();
        }
        
        private IEnumerator CreateMasterUISystem()
        {
            Debug.Log("🎮 Creating Master UI System...");
            
            // Create MasterUISystem
            if (masterUI == null)
            {
                var masterGO = new GameObject("MasterUISystem");
                masterUI = masterGO.AddComponent<MasterUISystem>();
            }
            
            // Configure Master UI
            masterUI.useRoyalMatchStyle = useRoyalMatchStyle;
            masterUI.useIndustryStandards = useIndustryStandards;
            masterUI.usePremiumFeatures = usePremiumFeatures;
            masterUI.integrateWithLegacy = integrateWithLegacy;
            masterUI.enableAIGameplay = enableAIGameplay;
            masterUI.showDebugInfo = showDebugInfo;
            
            // Set colors
            masterUI.primaryColor = primaryColor;
            masterUI.secondaryColor = secondaryColor;
            masterUI.accentColor = accentColor;
            masterUI.backgroundColor = backgroundColor;
            masterUI.textColor = textColor;
            
            // Set animation settings
            masterUI.defaultAnimationDuration = defaultAnimationDuration;
            masterUI.defaultEase = defaultEase;
            masterUI.bounceIntensity = bounceIntensity;
            masterUI.shakeIntensity = shakeIntensity;
            masterUI.enableHapticFeedback = enableHapticFeedback;
            masterUI.enableParticleEffects = enableParticleEffects;
            masterUI.enableScreenShake = enableScreenShake;
            masterUI.enableGlowEffects = enableGlowEffects;
            
            // Set audio clips
            masterUI.buttonClickSound = buttonClickSound;
            masterUI.buttonHoverSound = buttonHoverSound;
            masterUI.successSound = successSound;
            masterUI.errorSound = errorSound;
            masterUI.levelCompleteSound = levelCompleteSound;
            
            // Set AI settings
            masterUI.enableAIHints = enableAIHints;
            masterUI.enableAIDifficultyAdaptation = enableAIDifficultyAdaptation;
            masterUI.aiHintFrequency = aiHintFrequency;
            
            // Set performance settings
            masterUI.enablePerformanceOptimization = enablePerformanceOptimization;
            masterUI.enableObjectPooling = enableObjectPooling;
            masterUI.maxPooledObjects = maxPooledObjects;
            
            yield return new WaitForEndOfFrame();
        }
        
        private IEnumerator CreateUIPanels()
        {
            Debug.Log("📱 Creating UI panels...");
            
            // Create main menu screen
            if (mainMenuScreen == null)
            {
                mainMenuScreen = CreateMainMenuPanel();
            }
            
            // Create level selection screen
            if (levelSelectionScreen == null)
            {
                levelSelectionScreen = CreateLevelSelectionPanel();
            }
            
            // Create gameplay screen
            if (gameplayScreen == null)
            {
                gameplayScreen = CreateGameplayPanel();
            }
            
            // Create pause screen
            if (pauseScreen == null)
            {
                pauseScreen = CreatePausePanel();
            }
            
            // Create shop screen
            if (shopScreen == null)
            {
                shopScreen = CreateShopPanel();
            }
            
            // Create settings screen
            if (settingsScreen == null)
            {
                settingsScreen = CreateSettingsPanel();
            }
            
            // Create events screen
            if (eventsScreen == null)
            {
                eventsScreen = CreateEventsPanel();
            }
            
            // Create social screen
            if (socialScreen == null)
            {
                socialScreen = CreateSocialPanel();
            }
            
            // Create collections screen
            if (collectionsScreen == null)
            {
                collectionsScreen = CreateCollectionsPanel();
            }
            
            // Create profile screen
            if (profileScreen == null)
            {
                profileScreen = CreateProfilePanel();
            }
            
            yield return new WaitForEndOfFrame();
        }
        
        private IEnumerator CreateUIControllers()
        {
            Debug.Log("🎯 Creating UI controllers...");
            
            // Create main menu controller
            if (mainMenuController == null)
            {
                var mainMenuGO = new GameObject("MainMenuController");
                mainMenuController = mainMenuGO.AddComponent<MainMenuController>();
            }
            
            // Create level selection controller
            if (levelSelectionController == null)
            {
                var levelSelectionGO = new GameObject("LevelSelectionController");
                levelSelectionController = levelSelectionGO.AddComponent<LevelSelectionController>();
            }
            
            // Create gameplay HUD controller
            if (gameplayHUDController == null)
            {
                var gameplayHUDGO = new GameObject("GameplayHUDController");
                gameplayHUDController = gameplayHUDGO.AddComponent<GameplayHUDController>();
            }
            
            // Create popup controller
            if (popupController == null)
            {
                var popupGO = new GameObject("PopupController");
                popupController = popupGO.AddComponent<PopupController>();
            }
            
            // Create other controllers
            if (shopUI == null)
            {
                var shopGO = new GameObject("ShopUI");
                shopUI = shopGO.AddComponent<ShopUI>();
            }
            
            if (settingsUI == null)
            {
                var settingsGO = new GameObject("SettingsUI");
                settingsUI = settingsGO.AddComponent<SettingsUI>();
            }
            
            if (eventsUI == null)
            {
                var eventsGO = new GameObject("EventsUI");
                eventsUI = eventsGO.AddComponent<EventsUI>();
            }
            
            if (socialUI == null)
            {
                var socialGO = new GameObject("SocialUI");
                socialUI = socialGO.AddComponent<SocialUI>();
            }
            
            if (collectionsUI == null)
            {
                var collectionsGO = new GameObject("CollectionsUI");
                collectionsUI = collectionsGO.AddComponent<CollectionsUI>();
            }
            
            yield return new WaitForEndOfFrame();
        }
        
        private IEnumerator SetupVisualEffects()
        {
            Debug.Log("🎪 Setting up visual effects...");
            
            // Create sparkle effect
            if (sparkleEffect == null)
            {
                var sparkleGO = new GameObject("SparkleEffect");
                sparkleEffect = sparkleGO.AddComponent<ParticleSystem>();
                // Configure sparkle effect
            }
            
            // Create confetti effect
            if (confettiEffect == null)
            {
                var confettiGO = new GameObject("ConfettiEffect");
                confettiEffect = confettiGO.AddComponent<ParticleSystem>();
                // Configure confetti effect
            }
            
            // Create star burst effect
            if (starBurstEffect == null)
            {
                var starBurstGO = new GameObject("StarBurstEffect");
                starBurstEffect = starBurstGO.AddComponent<ParticleSystem>();
                // Configure star burst effect
            }
            
            // Create glow effect
            if (glowEffect == null)
            {
                glowEffect = new GameObject("GlowEffect");
                // Configure glow effect
            }
            
            // Create ripple effect
            if (rippleEffect == null)
            {
                rippleEffect = new GameObject("RippleEffect");
                // Configure ripple effect
            }
            
            yield return new WaitForEndOfFrame();
        }
        
        private IEnumerator SetupAudio()
        {
            Debug.Log("🔊 Setting up audio...");
            
            // Audio setup is handled by MasterUISystem
            // This is where you would load audio clips from resources
            
            yield return new WaitForEndOfFrame();
        }
        
        private IEnumerator ApplyStyling()
        {
            Debug.Log("🎨 Applying styling...");
            
            // Styling is applied by MasterUISystem
            // This is where you would apply custom styling
            
            yield return new WaitForEndOfFrame();
        }
        
        private IEnumerator SetupAnimations()
        {
            Debug.Log("🎭 Setting up animations...");
            
            // Animations are set up by MasterUISystem
            // This is where you would configure custom animations
            
            yield return new WaitForEndOfFrame();
        }
        
        private IEnumerator SetupAIIntegration()
        {
            Debug.Log("🤖 Setting up AI integration...");
            
            // AI integration is handled by MasterUISystem
            // This is where you would configure AI settings
            
            yield return new WaitForEndOfFrame();
        }
        
        private IEnumerator IntegrateWithLegacySystems()
        {
            Debug.Log("🔗 Integrating with legacy systems...");
            
            // Legacy integration is handled by MasterUISystem
            // This is where you would connect with existing systems
            
            yield return new WaitForEndOfFrame();
        }
        
        private IEnumerator FinalConfiguration()
        {
            Debug.Log("⚙️ Final configuration...");
            
            // Connect all components to Master UI
            if (masterUI != null)
            {
                // Connect UI panels
                masterUI.mainMenuScreen = mainMenuScreen;
                masterUI.levelSelectionScreen = levelSelectionScreen;
                masterUI.gameplayScreen = gameplayScreen;
                masterUI.pauseScreen = pauseScreen;
                masterUI.shopScreen = shopScreen;
                masterUI.settingsScreen = settingsScreen;
                masterUI.eventsScreen = eventsScreen;
                masterUI.socialScreen = socialScreen;
                masterUI.collectionsScreen = collectionsScreen;
                masterUI.profileScreen = profileScreen;
                
                // Connect controllers
                masterUI.mainMenuController = mainMenuController;
                masterUI.levelSelectionController = levelSelectionController;
                masterUI.gameplayHUDController = gameplayHUDController;
                masterUI.popupController = popupController;
                masterUI.shopUI = shopUI;
                masterUI.settingsUI = settingsUI;
                masterUI.eventsUI = eventsUI;
                masterUI.socialUI = socialUI;
                masterUI.collectionsUI = collectionsUI;
                
                // Connect visual effects
                masterUI.sparkleEffect = sparkleEffect;
                masterUI.confettiEffect = confettiEffect;
                masterUI.starBurstEffect = starBurstEffect;
                masterUI.glowEffect = glowEffect;
                masterUI.rippleEffect = rippleEffect;
                
                // Connect core systems
                masterUI.coreSystem = coreSystem;
                masterUI.adsManager = adsManager;
                masterUI.aiService = aiService;
                masterUI.hybridGameplayManager = hybridGameplayManager;
            }
            
            // Show appropriate UI based on current scene
            string currentScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene().name;
            
            switch (currentScene)
            {
                case "MainMenu":
                    if (masterUI != null) masterUI.ShowMainMenu();
                    break;
                case "Gameplay":
                    if (masterUI != null) masterUI.ShowGameplay();
                    break;
                case "LevelSelection":
                    if (masterUI != null) masterUI.ShowLevelSelection();
                    break;
                default:
                    if (masterUI != null) masterUI.ShowMainMenu();
                    break;
            }
            
            yield return new WaitForEndOfFrame();
        }
        
        #region Panel Creation Methods
        
        private GameObject CreateMainMenuPanel()
        {
            var panel = new GameObject("MainMenuPanel");
            var image = panel.AddComponent<Image>();
            image.color = backgroundColor;
            
            // Add main menu UI elements
            CreateMainMenuUI(panel);
            
            return panel;
        }
        
        private GameObject CreateLevelSelectionPanel()
        {
            var panel = new GameObject("LevelSelectionPanel");
            var image = panel.AddComponent<Image>();
            image.color = backgroundColor;
            
            // Add level selection UI elements
            CreateLevelSelectionUI(panel);
            
            return panel;
        }
        
        private GameObject CreateGameplayPanel()
        {
            var panel = new GameObject("GameplayPanel");
            var image = panel.AddComponent<Image>();
            image.color = backgroundColor;
            
            // Add gameplay UI elements
            CreateGameplayUI(panel);
            
            return panel;
        }
        
        private GameObject CreatePausePanel()
        {
            var panel = new GameObject("PausePanel");
            var image = panel.AddComponent<Image>();
            image.color = backgroundColor;
            
            // Add pause UI elements
            CreatePauseUI(panel);
            
            return panel;
        }
        
        private GameObject CreateShopPanel()
        {
            var panel = new GameObject("ShopPanel");
            var image = panel.AddComponent<Image>();
            image.color = backgroundColor;
            
            // Add shop UI elements
            CreateShopUI(panel);
            
            return panel;
        }
        
        private GameObject CreateSettingsPanel()
        {
            var panel = new GameObject("SettingsPanel");
            var image = panel.AddComponent<Image>();
            image.color = backgroundColor;
            
            // Add settings UI elements
            CreateSettingsUI(panel);
            
            return panel;
        }
        
        private GameObject CreateEventsPanel()
        {
            var panel = new GameObject("EventsPanel");
            var image = panel.AddComponent<Image>();
            image.color = backgroundColor;
            
            // Add events UI elements
            CreateEventsUI(panel);
            
            return panel;
        }
        
        private GameObject CreateSocialPanel()
        {
            var panel = new GameObject("SocialPanel");
            var image = panel.AddComponent<Image>();
            image.color = backgroundColor;
            
            // Add social UI elements
            CreateSocialUI(panel);
            
            return panel;
        }
        
        private GameObject CreateCollectionsPanel()
        {
            var panel = new GameObject("CollectionsPanel");
            var image = panel.AddComponent<Image>();
            image.color = backgroundColor;
            
            // Add collections UI elements
            CreateCollectionsUI(panel);
            
            return panel;
        }
        
        private GameObject CreateProfilePanel()
        {
            var panel = new GameObject("ProfilePanel");
            var image = panel.AddComponent<Image>();
            image.color = backgroundColor;
            
            // Add profile UI elements
            CreateProfileUI(panel);
            
            return panel;
        }
        
        #endregion
        
        #region UI Creation Methods
        
        private void CreateMainMenuUI(GameObject parent)
        {
            // Create title
            var titleGO = new GameObject("Title");
            titleGO.transform.SetParent(parent.transform, false);
            var titleText = titleGO.AddComponent<TextMeshProUGUI>();
            titleText.text = "Match-3 Game";
            titleText.fontSize = 48;
            titleText.color = textColor;
            titleText.alignment = TextAlignmentOptions.Center;
            
            // Create play button
            var playButtonGO = new GameObject("PlayButton");
            playButtonGO.transform.SetParent(parent.transform, false);
            var playButton = playButtonGO.AddComponent<Button>();
            var playButtonImage = playButtonGO.AddComponent<Image>();
            playButtonImage.color = primaryColor;
            
            // Add button text
            var playButtonTextGO = new GameObject("Text");
            playButtonTextGO.transform.SetParent(playButtonGO.transform, false);
            var playButtonText = playButtonTextGO.AddComponent<TextMeshProUGUI>();
            playButtonText.text = "Play";
            playButtonText.fontSize = 24;
            playButtonText.color = Color.white;
            playButtonText.alignment = TextAlignmentOptions.Center;
        }
        
        private void CreateLevelSelectionUI(GameObject parent)
        {
            // Create level selection UI elements
            // This would be implemented based on specific needs
        }
        
        private void CreateGameplayUI(GameObject parent)
        {
            // Create gameplay UI elements
            // This would be implemented based on specific needs
        }
        
        private void CreatePauseUI(GameObject parent)
        {
            // Create pause UI elements
            // This would be implemented based on specific needs
        }
        
        private void CreateShopUI(GameObject parent)
        {
            // Create shop UI elements
            // This would be implemented based on specific needs
        }
        
        private void CreateSettingsUI(GameObject parent)
        {
            // Create settings UI elements
            // This would be implemented based on specific needs
        }
        
        private void CreateEventsUI(GameObject parent)
        {
            // Create events UI elements
            // This would be implemented based on specific needs
        }
        
        private void CreateSocialUI(GameObject parent)
        {
            // Create social UI elements
            // This would be implemented based on specific needs
        }
        
        private void CreateCollectionsUI(GameObject parent)
        {
            // Create collections UI elements
            // This would be implemented based on specific needs
        }
        
        private void CreateProfileUI(GameObject parent)
        {
            // Create profile UI elements
            // This would be implemented based on specific needs
        }
        
        #endregion
        
        #region Public API
        
        [ContextMenu("Check Setup Status")]
        public void CheckSetupStatus()
        {
            Debug.Log("🔍 Master UI Setup Status:");
            Debug.Log($"✅ Master UI: {(masterUI != null ? "Active" : "Missing")}");
            Debug.Log($"✅ Core System: {(coreSystem != null ? "Active" : "Missing")}");
            Debug.Log($"✅ Ads Manager: {(adsManager != null ? "Active" : "Missing")}");
            Debug.Log($"✅ AI Service: {(aiService != null ? "Active" : "Missing")}");
            Debug.Log($"✅ Hybrid Gameplay: {(hybridGameplayManager != null ? "Active" : "Missing")}");
        }
        
        [ContextMenu("Test Master UI")]
        public void TestMasterUI()
        {
            if (masterUI != null)
            {
                masterUI.TestUIFunctions();
            }
            else
            {
                Debug.Log("❌ Master UI not found! Run setup first.");
            }
        }
        
        #endregion
    }
}