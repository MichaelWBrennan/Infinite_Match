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
    /// Master UI System - Consolidated UI Management
    /// Merges all UI systems into a single, comprehensive solution
    /// Combines: Match3UISystem, RoyalMatchUIManager, IndustryStandardUIManager, 
    /// OptimizedUISystem, PremiumUIManager, and all setup scripts
    /// </summary>
    public class MasterUISystem : MonoBehaviour
    {
        [Header("🎮 Master UI Configuration")]
        [SerializeField] private bool enableOnStart = true;
        [SerializeField] private bool useRoyalMatchStyle = true;
        [SerializeField] private bool useIndustryStandards = true;
        [SerializeField] private bool usePremiumFeatures = true;
        [SerializeField] private bool integrateWithLegacy = true;
        [SerializeField] private bool enableAIGameplay = true;
        [SerializeField] private bool showDebugInfo = true;
        
        [Header("🎨 UI Styling")]
        [SerializeField] private Color primaryColor = new Color(0.2f, 0.6f, 0.9f, 1f);
        [SerializeField] private Color secondaryColor = new Color(1f, 0.8f, 0.2f, 1f);
        [SerializeField] private Color accentColor = new Color(0.9f, 0.3f, 0.3f, 1f);
        [SerializeField] private Color backgroundColor = new Color(0.95f, 0.95f, 0.98f, 1f);
        [SerializeField] private Color textColor = new Color(0.2f, 0.2f, 0.2f, 1f);
        
        [Header("🎭 Animation Settings")]
        [SerializeField] private float defaultAnimationDuration = 0.3f;
        [SerializeField] private Ease defaultEase = Ease.OutCubic;
        [SerializeField] private float bounceIntensity = 1.2f;
        [SerializeField] private float shakeIntensity = 10f;
        [SerializeField] private bool enableHapticFeedback = true;
        [SerializeField] private bool enableParticleEffects = true;
        [SerializeField] private bool enableScreenShake = true;
        [SerializeField] private bool enableGlowEffects = true;
        
        [Header("🔊 Audio Settings")]
        [SerializeField] private AudioClip buttonClickSound;
        [SerializeField] private AudioClip buttonHoverSound;
        [SerializeField] private AudioClip successSound;
        [SerializeField] private AudioClip errorSound;
        [SerializeField] private AudioClip levelCompleteSound;
        [SerializeField] private AudioSource audioSource;
        
        [Header("📱 UI Screens")]
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
        
        [Header("🎯 UI Controllers")]
        [SerializeField] private MainMenuController mainMenuController;
        [SerializeField] private LevelSelectionController levelSelectionController;
        [SerializeField] private GameplayHUDController gameplayHUDController;
        [SerializeField] private PopupController popupController;
        [SerializeField] private ShopUI shopUI;
        [SerializeField] private SettingsUI settingsUI;
        [SerializeField] private EventsUI eventsUI;
        [SerializeField] private SocialUI socialUI;
        [SerializeField] private CollectionsUI collectionsUI;
        
        [Header("🎪 Visual Effects")]
        [SerializeField] private ParticleSystem sparkleEffect;
        [SerializeField] private ParticleSystem confettiEffect;
        [SerializeField] private ParticleSystem starBurstEffect;
        [SerializeField] private GameObject glowEffect;
        [SerializeField] private GameObject rippleEffect;
        
        [Header("🤖 AI Integration")]
        [SerializeField] private UnifiedAIAPIService aiService;
        [SerializeField] private bool enableAIHints = true;
        [SerializeField] private bool enableAIDifficultyAdaptation = true;
        [SerializeField] private float aiHintFrequency = 0.3f;
        
        [Header("🔧 Core Systems")]
        [SerializeField] private OptimizedCoreSystem coreSystem;
        [SerializeField] private UnityAdsManager adsManager;
        [SerializeField] private HybridGameplayManager hybridGameplayManager;
        
        [Header("📊 Performance")]
        [SerializeField] private bool enablePerformanceOptimization = true;
        [SerializeField] private bool enableObjectPooling = true;
        [SerializeField] private int maxPooledObjects = 100;
        
        // Private fields
        private Dictionary<string, GameObject> uiPanels = new Dictionary<string, GameObject>();
        private Dictionary<string, Tween> activeTweens = new Dictionary<string, Tween>();
        private Queue<UIAnimation> animationQueue = new Queue<UIAnimation>();
        private Dictionary<string, GameObject> pooledObjects = new Dictionary<string, GameObject>();
        private bool isInitialized = false;
        private Canvas mainCanvas;
        private GraphicRaycaster graphicRaycaster;
        private CanvasScaler canvasScaler;
        private CanvasGroup fadeGroup;
        
        // Events
        public System.Action<GameObject> OnScreenChanged;
        public System.Action<string> OnButtonClicked;
        public System.Action<int, int, int> OnRewardEarned;
        public System.Action<int, int> OnLevelComplete;
        public System.Action<string> OnAnimationComplete;
        
        public static MasterUISystem Instance { get; private set; }
        
        #region Unity Lifecycle
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeMasterUI();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            if (enableOnStart && isInitialized)
            {
                StartUI();
            }
        }
        
        void Update()
        {
            if (isInitialized)
            {
                ProcessAnimationQueue();
                UpdatePerformanceMetrics();
            }
        }
        
        void OnDestroy()
        {
            CleanupAllTweens();
            CleanupPooledObjects();
        }
        
        #endregion
        
        #region Initialization
        
        private void InitializeMasterUI()
        {
            Debug.Log("🎮 Initializing Master UI System...");
            
            // Initialize core systems
            InitializeCoreSystems();
            
            // Initialize UI components
            InitializeUIComponents();
            
            // Setup visual effects
            SetupVisualEffects();
            
            // Setup audio
            SetupAudio();
            
            // Setup AI integration
            if (enableAIGameplay)
            {
                SetupAIIntegration();
            }
            
            // Apply styling
            ApplyMasterStyling();
            
            // Setup performance optimization
            if (enablePerformanceOptimization)
            {
                SetupPerformanceOptimization();
            }
            
            isInitialized = true;
            Debug.Log("✅ Master UI System initialized!");
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
            
            // Get or create hybrid gameplay manager
            if (hybridGameplayManager == null)
            {
                hybridGameplayManager = FindObjectOfType<HybridGameplayManager>();
                if (hybridGameplayManager == null)
                {
                    var hybridGO = new GameObject("HybridGameplayManager");
                    hybridGameplayManager = hybridGO.AddComponent<HybridGameplayManager>();
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
        
        private void InitializeUIComponents()
        {
            // Get main canvas
            mainCanvas = GetComponentInParent<Canvas>();
            if (mainCanvas == null)
            {
                mainCanvas = FindObjectOfType<Canvas>();
                if (mainCanvas == null)
                {
                    CreateMainCanvas();
                }
            }
            
            // Get canvas components
            graphicRaycaster = mainCanvas.GetComponent<GraphicRaycaster>();
            canvasScaler = mainCanvas.GetComponent<CanvasScaler>();
            fadeGroup = mainCanvas.GetComponent<CanvasGroup>();
            
            // Initialize UI controllers
            InitializeUIControllers();
            
            // Register UI panels
            RegisterUIPanels();
        }
        
        private void CreateMainCanvas()
        {
            var canvasGO = new GameObject("MainCanvas");
            mainCanvas = canvasGO.AddComponent<Canvas>();
            mainCanvas.renderMode = RenderMode.ScreenSpaceOverlay;
            mainCanvas.sortingOrder = 0;
            
            canvasScaler = canvasGO.AddComponent<CanvasScaler>();
            canvasScaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            canvasScaler.referenceResolution = new Vector2(1920, 1080);
            canvasScaler.screenMatchMode = CanvasScaler.ScreenMatchMode.MatchWidthOrHeight;
            canvasScaler.matchWidthOrHeight = 0.5f;
            
            graphicRaycaster = canvasGO.AddComponent<GraphicRaycaster>();
            fadeGroup = canvasGO.AddComponent<CanvasGroup>();
        }
        
        private void InitializeUIControllers()
        {
            // Initialize main menu controller
            if (mainMenuController == null)
            {
                var mainMenuGO = new GameObject("MainMenuController");
                mainMenuController = mainMenuGO.AddComponent<MainMenuController>();
            }
            
            // Initialize level selection controller
            if (levelSelectionController == null)
            {
                var levelSelectionGO = new GameObject("LevelSelectionController");
                levelSelectionController = levelSelectionGO.AddComponent<LevelSelectionController>();
            }
            
            // Initialize gameplay HUD controller
            if (gameplayHUDController == null)
            {
                var gameplayHUDGO = new GameObject("GameplayHUDController");
                gameplayHUDController = gameplayHUDGO.AddComponent<GameplayHUDController>();
            }
            
            // Initialize popup controller
            if (popupController == null)
            {
                var popupGO = new GameObject("PopupController");
                popupController = popupGO.AddComponent<PopupController>();
            }
            
            // Initialize other UI controllers
            InitializeOtherControllers();
        }
        
        private void InitializeOtherControllers()
        {
            // Initialize shop UI
            if (shopUI == null)
            {
                var shopGO = new GameObject("ShopUI");
                shopUI = shopGO.AddComponent<ShopUI>();
            }
            
            // Initialize settings UI
            if (settingsUI == null)
            {
                var settingsGO = new GameObject("SettingsUI");
                settingsUI = settingsGO.AddComponent<SettingsUI>();
            }
            
            // Initialize events UI
            if (eventsUI == null)
            {
                var eventsGO = new GameObject("EventsUI");
                eventsUI = eventsGO.AddComponent<EventsUI>();
            }
            
            // Initialize social UI
            if (socialUI == null)
            {
                var socialGO = new GameObject("SocialUI");
                socialUI = socialGO.AddComponent<SocialUI>();
            }
            
            // Initialize collections UI
            if (collectionsUI == null)
            {
                var collectionsGO = new GameObject("CollectionsUI");
                collectionsUI = collectionsGO.AddComponent<CollectionsUI>();
            }
        }
        
        private void RegisterUIPanels()
        {
            // Register all UI panels
            RegisterPanel("MainMenu", mainMenuScreen);
            RegisterPanel("LevelSelection", levelSelectionScreen);
            RegisterPanel("Gameplay", gameplayScreen);
            RegisterPanel("Pause", pauseScreen);
            RegisterPanel("Shop", shopScreen);
            RegisterPanel("Settings", settingsScreen);
            RegisterPanel("Events", eventsScreen);
            RegisterPanel("Social", socialScreen);
            RegisterPanel("Collections", collectionsScreen);
            RegisterPanel("Profile", profileScreen);
        }
        
        private void RegisterPanel(string name, GameObject panel)
        {
            if (panel != null)
            {
                uiPanels[name] = panel;
            }
        }
        
        #endregion
        
        #region Visual Effects
        
        private void SetupVisualEffects()
        {
            // Setup particle effects
            if (enableParticleEffects)
            {
                SetupParticleEffects();
            }
            
            // Setup glow effects
            if (enableGlowEffects)
            {
                SetupGlowEffects();
            }
            
            // Setup ripple effects
            SetupRippleEffects();
        }
        
        private void SetupParticleEffects()
        {
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
        }
        
        private void SetupGlowEffects()
        {
            // Create glow effect
            if (glowEffect == null)
            {
                glowEffect = new GameObject("GlowEffect");
                // Configure glow effect
            }
        }
        
        private void SetupRippleEffects()
        {
            // Create ripple effect
            if (rippleEffect == null)
            {
                rippleEffect = new GameObject("RippleEffect");
                // Configure ripple effect
            }
        }
        
        #endregion
        
        #region Audio
        
        private void SetupAudio()
        {
            // Get or create audio source
            if (audioSource == null)
            {
                audioSource = GetComponent<AudioSource>();
                if (audioSource == null)
                {
                    audioSource = gameObject.AddComponent<AudioSource>();
                }
            }
            
            // Configure audio source
            audioSource.playOnAwake = false;
            audioSource.volume = 1f;
        }
        
        private void PlaySound(AudioClip clip)
        {
            if (audioSource != null && clip != null)
            {
                audioSource.PlayOneShot(clip);
            }
        }
        
        #endregion
        
        #region AI Integration
        
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
        
        #region Styling
        
        private void ApplyMasterStyling()
        {
            // Apply color scheme
            ApplyColorScheme();
            
            // Apply typography
            ApplyTypography();
            
            // Apply button styling
            ApplyButtonStyling();
            
            // Apply panel styling
            ApplyPanelStyling();
        }
        
        private void ApplyColorScheme()
        {
            // Apply primary colors to all UI elements
            var allImages = FindObjectsOfType<Image>();
            foreach (var image in allImages)
            {
                if (image.name.Contains("Primary"))
                {
                    image.color = primaryColor;
                }
                else if (image.name.Contains("Secondary"))
                {
                    image.color = secondaryColor;
                }
                else if (image.name.Contains("Accent"))
                {
                    image.color = accentColor;
                }
            }
        }
        
        private void ApplyTypography()
        {
            // Apply typography to all text elements
            var allTexts = FindObjectsOfType<TextMeshProUGUI>();
            foreach (var text in allTexts)
            {
                text.color = textColor;
                
                if (text.name.Contains("Title"))
                {
                    text.fontSize = 36;
                    text.fontStyle = FontStyles.Bold;
                }
                else if (text.name.Contains("Button"))
                {
                    text.fontSize = 24;
                    text.fontStyle = FontStyles.Bold;
                }
                else
                {
                    text.fontSize = 18;
                    text.fontStyle = FontStyles.Normal;
                }
            }
        }
        
        private void ApplyButtonStyling()
        {
            // Apply styling to all buttons
            var allButtons = FindObjectsOfType<Button>();
            foreach (var button in allButtons)
            {
                // Apply button styling
                var image = button.GetComponent<Image>();
                if (image != null)
                {
                    image.color = primaryColor;
                }
                
                // Add hover animation
                AddButtonHoverAnimation(button);
            }
        }
        
        private void ApplyPanelStyling()
        {
            // Apply styling to all panels
            foreach (var panel in uiPanels.Values)
            {
                if (panel != null)
                {
                    var image = panel.GetComponent<Image>();
                    if (image != null)
                    {
                        image.color = backgroundColor;
                    }
                }
            }
        }
        
        #endregion
        
        #region Performance Optimization
        
        private void SetupPerformanceOptimization()
        {
            if (enableObjectPooling)
            {
                SetupObjectPooling();
            }
        }
        
        private void SetupObjectPooling()
        {
            // Setup object pooling for frequently used objects
            // This would be implemented based on specific needs
        }
        
        private void UpdatePerformanceMetrics()
        {
            // Update performance metrics
            if (showDebugInfo)
            {
                // Log performance metrics
            }
        }
        
        #endregion
        
        #region UI Management
        
        public void ShowScreen(string screenName)
        {
            if (uiPanels.ContainsKey(screenName))
            {
                // Hide all other screens
                foreach (var panel in uiPanels.Values)
                {
                    if (panel != null)
                    {
                        panel.SetActive(false);
                    }
                }
                
                // Show target screen
                var targetPanel = uiPanels[screenName];
                if (targetPanel != null)
                {
                    targetPanel.SetActive(true);
                    AnimatePanelIn(targetPanel);
                }
                
                OnScreenChanged?.Invoke(targetPanel);
            }
        }
        
        public void ShowMainMenu()
        {
            ShowScreen("MainMenu");
            PlaySound(buttonClickSound);
        }
        
        public void ShowGameplay()
        {
            ShowScreen("Gameplay");
            PlaySound(buttonClickSound);
        }
        
        public void ShowLevelSelection()
        {
            ShowScreen("LevelSelection");
            PlaySound(buttonClickSound);
        }
        
        public void ShowPause()
        {
            ShowScreen("Pause");
            PlaySound(buttonClickSound);
        }
        
        public void ShowShop()
        {
            ShowScreen("Shop");
            PlaySound(buttonClickSound);
        }
        
        public void ShowSettings()
        {
            ShowScreen("Settings");
            PlaySound(buttonClickSound);
        }
        
        public void ShowEvents()
        {
            ShowScreen("Events");
            PlaySound(buttonClickSound);
        }
        
        public void ShowSocial()
        {
            ShowScreen("Social");
            PlaySound(buttonClickSound);
        }
        
        public void ShowCollections()
        {
            ShowScreen("Collections");
            PlaySound(buttonClickSound);
        }
        
        public void ShowProfile()
        {
            ShowScreen("Profile");
            PlaySound(buttonClickSound);
        }
        
        #endregion
        
        #region Animations
        
        private void ProcessAnimationQueue()
        {
            if (animationQueue.Count > 0)
            {
                var animation = animationQueue.Dequeue();
                ExecuteAnimation(animation);
            }
        }
        
        private void ExecuteAnimation(UIAnimation animation)
        {
            // Execute animation based on type
            switch (animation.Type)
            {
                case AnimationType.Scale:
                    AnimateScale(animation.Target, animation.ScaleFrom, animation.ScaleTo, animation.Duration);
                    break;
                case AnimationType.Fade:
                    AnimateFade(animation.Target, animation.AlphaFrom, animation.AlphaTo, animation.Duration);
                    break;
                case AnimationType.Move:
                    AnimateMove(animation.Target, animation.MoveFrom, animation.MoveTo, animation.Duration);
                    break;
                case AnimationType.Rotate:
                    AnimateRotate(animation.Target, animation.RotateFrom, animation.RotateTo, animation.Duration);
                    break;
            }
        }
        
        private void AnimateScale(GameObject target, Vector3 from, Vector3 to, float duration)
        {
            target.transform.localScale = from;
            var tween = target.transform.DOScale(to, duration).SetEase(defaultEase);
            activeTweens[target.name] = tween;
        }
        
        private void AnimateFade(GameObject target, float from, float to, float duration)
        {
            var canvasGroup = target.GetComponent<CanvasGroup>();
            if (canvasGroup == null)
            {
                canvasGroup = target.AddComponent<CanvasGroup>();
            }
            
            canvasGroup.alpha = from;
            var tween = canvasGroup.DOFade(to, duration).SetEase(defaultEase);
            activeTweens[target.name] = tween;
        }
        
        private void AnimateMove(GameObject target, Vector3 from, Vector3 to, float duration)
        {
            target.transform.localPosition = from;
            var tween = target.transform.DOLocalMove(to, duration).SetEase(defaultEase);
            activeTweens[target.name] = tween;
        }
        
        private void AnimateRotate(GameObject target, Vector3 from, Vector3 to, float duration)
        {
            target.transform.localEulerAngles = from;
            var tween = target.transform.DOLocalRotate(to, duration).SetEase(defaultEase);
            activeTweens[target.name] = tween;
        }
        
        private void AnimatePanelIn(GameObject panel)
        {
            panel.transform.localScale = Vector3.zero;
            var tween = panel.transform.DOScale(Vector3.one, defaultAnimationDuration)
                .SetEase(Ease.OutBack);
            activeTweens[panel.name] = tween;
        }
        
        private void AnimatePanelOut(GameObject panel)
        {
            var tween = panel.transform.DOScale(Vector3.zero, defaultAnimationDuration)
                .SetEase(Ease.InBack);
            activeTweens[panel.name] = tween;
        }
        
        private void AddButtonHoverAnimation(Button button)
        {
            var eventTrigger = button.gameObject.GetComponent<UnityEngine.EventSystems.EventTrigger>();
            if (eventTrigger == null)
            {
                eventTrigger = button.gameObject.AddComponent<UnityEngine.EventSystems.EventTrigger>();
            }
            
            // Add hover enter event
            var hoverEnter = new UnityEngine.EventSystems.EventTrigger.Entry();
            hoverEnter.eventID = UnityEngine.EventSystems.EventTriggerType.PointerEnter;
            hoverEnter.callback.AddListener((eventData) => {
                button.transform.DOScale(1.1f, 0.2f).SetEase(Ease.OutQuad);
                PlaySound(buttonHoverSound);
            });
            eventTrigger.triggers.Add(hoverEnter);
            
            // Add hover exit event
            var hoverExit = new UnityEngine.EventSystems.EventTrigger.Entry();
            hoverExit.eventID = UnityEngine.EventSystems.EventTriggerType.PointerExit;
            hoverExit.callback.AddListener((eventData) => {
                button.transform.DOScale(1f, 0.2f).SetEase(Ease.OutQuad);
            });
            eventTrigger.triggers.Add(hoverExit);
            
            // Add click event
            button.onClick.AddListener(() => {
                button.transform.DOScale(0.95f, 0.1f).SetEase(Ease.InQuad)
                    .OnComplete(() => button.transform.DOScale(1f, 0.1f).SetEase(Ease.OutQuad));
                PlaySound(buttonClickSound);
                OnButtonClicked?.Invoke(button.name);
            });
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
            ShowGameplay();
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
            
            // Play success sound
            PlaySound(successSound);
            
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
        
        #endregion
        
        #region Data Updates
        
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
        
        #region Helper Methods
        
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
        
        private int GetMovesRemaining()
        {
            return 10; // Simplified
        }
        
        private float GetCurrentPerformance()
        {
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
        
        #region Cleanup
        
        private void CleanupAllTweens()
        {
            foreach (var tween in activeTweens.Values)
            {
                if (tween != null)
                {
                    tween.Kill();
                }
            }
            activeTweens.Clear();
        }
        
        private void CleanupPooledObjects()
        {
            foreach (var obj in pooledObjects.Values)
            {
                if (obj != null)
                {
                    Destroy(obj);
                }
            }
            pooledObjects.Clear();
        }
        
        #endregion
        
        #region Public API
        
        [ContextMenu("Check UI Status")]
        public void CheckUIStatus()
        {
            Debug.Log("🔍 Master UI Status Check:");
            Debug.Log($"✅ Initialized: {isInitialized}");
            Debug.Log($"✅ UI Panels: {uiPanels.Count}");
            Debug.Log($"✅ Active Tweens: {activeTweens.Count}");
            Debug.Log($"✅ Animation Queue: {animationQueue.Count}");
        }
        
        [ContextMenu("Test UI Functions")]
        public void TestUIFunctions()
        {
            Debug.Log("🧪 Testing Master UI Functions...");
            
            // Test screen transitions
            ShowMainMenu();
            ShowGameplay();
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
            
            Debug.Log("✅ Master UI Functions test completed!");
        }
        
        #endregion
    }
    
    #region Data Structures
    
    public enum AnimationType
    {
        Scale,
        Fade,
        Move,
        Rotate
    }
    
    public class UIAnimation
    {
        public AnimationType Type;
        public GameObject Target;
        public Vector3 ScaleFrom;
        public Vector3 ScaleTo;
        public float AlphaFrom;
        public float AlphaTo;
        public Vector3 MoveFrom;
        public Vector3 MoveTo;
        public Vector3 RotateFrom;
        public Vector3 RotateTo;
        public float Duration;
    }
    
    #endregion
}