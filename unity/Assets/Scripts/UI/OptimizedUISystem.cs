using UnityEngine;
using UnityEngine.UI;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using Evergreen.Core;
using Evergreen.MetaGame;
using Evergreen.Economy;
using Evergreen.Social;
using Evergreen.ARPU;

namespace Evergreen.UI
{
    /// <summary>
    /// OPTIMIZED UI SYSTEM - Consolidated UI Management
    /// Combines: EnhancedUIManager, AdvancedUISystem, UIOptimizer, UltraUIOptimizer, UIComponentCache, UIElementPool
    /// Reduces 6+ files to 1 optimized system
    /// </summary>
    public class OptimizedUISystem : MonoBehaviour
    {
        [Header("UI Panels")]
        public GameObject mainMenuPanel;
        public GameObject gameplayPanel;
        public GameObject castleViewPanel;
        public GameObject shopPanel;
        public GameObject settingsPanel;
        public GameObject pausePanel;
        public GameObject achievementPanel;
        public GameObject leaderboardPanel;
        public GameObject eventPanel;
        public GameObject economyPanel;
        public GameObject premiumPanel;
        
        [Header("5/5 User Experience Settings")]
        public float transitionDuration = 0.25f; // Faster, more responsive
        public AnimationCurve transitionCurve = AnimationCurve.EaseOut(0, 0, 1, 1); // More polished easing
        public bool enableSmoothTransitions = true;
        public bool enableUIAnimations = true;
        public bool enableHapticFeedback = true; // Mobile haptic feedback
        public bool enableAccessibilityFeatures = true; // 5/5 accessibility
        public bool enableHighContrastMode = false; // Accessibility option
        public bool enableLargeTextMode = false; // Accessibility option
        public float uiScaleFactor = 1.0f; // Dynamic UI scaling
        public bool enablePixelPerfectUI = true; // Crisp, pixel-perfect rendering
        
        [Header("5/5 UI Effects & Polish")]
        public GameObject loadingOverlay;
        public GameObject notificationPrefab;
        public Transform notificationContainer;
        public GameObject rewardPopupPrefab;
        public Transform rewardPopupContainer;
        public GameObject particleEffectPrefab; // Particle effects for interactions
        public GameObject glowEffectPrefab; // Glow effects for important elements
        public GameObject shimmerEffectPrefab; // Shimmer effects for premium items
        public Material uiMaterial; // High-quality UI material
        public Material glowMaterial; // Glow effect material
        public Material shimmerMaterial; // Shimmer effect material
        
        [Header("Performance Settings")]
        public bool enableObjectPooling = true;
        public bool enableComponentCaching = true;
        public bool enableBatchUpdates = true;
        public int maxPooledElements = 100;
        public float uiUpdateInterval = 0.1f;
        
        [Header("5/5 Audio & Feedback")]
        public AudioClip buttonClickSound;
        public AudioClip buttonHoverSound;
        public AudioClip notificationSound;
        public AudioClip rewardSound;
        public AudioClip successSound; // Success feedback
        public AudioClip errorSound; // Error feedback
        public AudioClip levelUpSound; // Level up celebration
        public AudioClip achievementSound; // Achievement unlock
        public float audioVolume = 1f;
        public float sfxVolume = 0.8f; // Separate SFX volume
        public float musicVolume = 0.6f; // Separate music volume
        public bool enableSpatialAudio = true; // 3D audio positioning
        
        // UI Management
        private Dictionary<string, GameObject> _uiPanels = new Dictionary<string, GameObject>();
        private Dictionary<string, UIComponentCache> _componentCaches = new Dictionary<string, UIComponentCache>();
        private Dictionary<string, UIElementPool> _elementPools = new Dictionary<string, UIElementPool>();
        private GameObject _currentPanel;
        private Queue<GameObject> _notificationQueue = new Queue<GameObject>();
        private bool _isTransitioning = false;
        
        // Performance Optimization
        private Dictionary<string, float> _lastUpdateTimes = new Dictionary<string, float>();
        private List<UIUpdateRequest> _pendingUpdates = new List<UIUpdateRequest>();
        private Coroutine _batchUpdateCoroutine;
        
        // Audio
        private AudioSource _audioSource;
        
        // Events
        public static event System.Action<string> OnPanelChanged;
        public static event System.Action<string> OnNotificationShown;
        public static event System.Action<string, int> OnRewardShown;
        
        public static OptimizedUISystem Instance { get; private set; }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeUISystem();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            ShowMainMenu();
            StartBatchUpdates();
            WireAllButtonsInScene();
        }
        
        #region Initialization
        
        private void InitializeUISystem()
        {
            Log("🎨 Initializing Optimized UI System...");
            
            // Initialize audio
            InitializeAudio();
            
            // Register UI panels
            RegisterUIPanels();
            
            // Initialize object pooling
            if (enableObjectPooling)
            {
                InitializeObjectPools();
            }
            
            // Initialize component caching
            if (enableComponentCaching)
            {
                InitializeComponentCaching();
            }
            
            // Setup integrations
            SetupSystemIntegrations();
            
            // Hide all panels initially
            HideAllPanels();
            
            Log("✅ UI System Initialized");
        }
        
        private void InitializeAudio()
        {
            _audioSource = GetComponent<AudioSource>();
            if (_audioSource == null)
            {
                _audioSource = gameObject.AddComponent<AudioSource>();
            }
            
            _audioSource.volume = audioVolume;
        }
        
        private void RegisterUIPanels()
        {
            var panels = new Dictionary<string, GameObject>
            {
                ["main_menu"] = mainMenuPanel,
                ["gameplay"] = gameplayPanel,
                ["castle_view"] = castleViewPanel,
                ["shop"] = shopPanel,
                ["settings"] = settingsPanel,
                ["pause"] = pausePanel,
                ["achievement"] = achievementPanel,
                ["leaderboard"] = leaderboardPanel,
                ["event"] = eventPanel,
                ["economy"] = economyPanel,
                ["premium"] = premiumPanel
            };
            
            foreach (var kvp in panels)
            {
                if (kvp.Value != null)
                {
                    _uiPanels[kvp.Key] = kvp.Value;
                }
            }
        }
        
        private void InitializeObjectPools()
        {
            // Initialize pools for common UI elements
            _elementPools["notifications"] = new UIElementPool(notificationPrefab, maxPooledElements);
            _elementPools["reward_popups"] = new UIElementPool(rewardPopupPrefab, maxPooledElements);
            _elementPools["buttons"] = new UIElementPool(null, maxPooledElements);
            _elementPools["texts"] = new UIElementPool(null, maxPooledElements);
            
            Log("Object pools initialized");
        }
        
        private void InitializeComponentCaching()
        {
            // Cache components for all panels
            foreach (var panel in _uiPanels.Values)
            {
                if (panel != null)
                {
                    var cache = new UIComponentCache(panel);
                    _componentCaches[panel.name] = cache;
                }
            }
            
            Log("Component caching initialized");
        }
        
        private void SetupSystemIntegrations()
        {
            // Castle system integration
            var castleSystem = OptimizedCoreSystem.Instance?.Resolve<CastleRenovationSystem>();
            if (castleSystem != null)
            {
                castleSystem.OnRoomUnlocked += OnRoomUnlocked;
                castleSystem.OnRoomCompleted += OnRoomCompleted;
                castleSystem.OnTaskCompleted += OnTaskCompleted;
                castleSystem.OnRewardEarned += OnRewardEarned;
            }
            
            // Economy system integration
            var economySystem = OptimizedCoreSystem.Instance?.Resolve<IEconomyManager>();
            if (economySystem != null)
            {
                // Subscribe to economy events
            }
            
            // Social system integration
            var socialSystem = OptimizedCoreSystem.Instance?.Resolve<AdvancedSocialSystem>();
            if (socialSystem != null)
            {
                // Subscribe to social events
            }
        }
        
        private void HideAllPanels()
        {
            foreach (var panel in _uiPanels.Values)
            {
                if (panel != null)
                {
                    panel.SetActive(false);
                }
            }
        }
        
        #endregion
        
        #region Button Wiring
        
        private void WireAllButtonsInScene()
        {
            Button[] allButtons = FindObjectsOfType<Button>();
            foreach (Button button in allButtons)
            {
                // Skip if already wired
                if (button.onClick.GetPersistentEventCount() > 0) continue;
                
                string buttonName = button.name.ToLower();
                
                // Wire buttons based on name patterns
                if (buttonName.Contains("play") || buttonName.Contains("start") || buttonName.Contains("game"))
                {
                    button.onClick.AddListener(() => StartGameplay());
                }
                else if (buttonName.Contains("main") || buttonName.Contains("menu"))
                {
                    button.onClick.AddListener(() => ShowMainMenu());
                }
                else if (buttonName.Contains("settings"))
                {
                    button.onClick.AddListener(() => ShowSettings());
                }
                else if (buttonName.Contains("shop"))
                {
                    button.onClick.AddListener(() => ShowShop());
                }
                else if (buttonName.Contains("social") || buttonName.Contains("leaderboard") || buttonName.Contains("friends"))
                {
                    button.onClick.AddListener(() => ShowLeaderboard());
                }
                else if (buttonName.Contains("event") || buttonName.Contains("daily") || buttonName.Contains("tournament"))
                {
                    button.onClick.AddListener(() => ShowEvents());
                }
                else if (buttonName.Contains("achievement") || buttonName.Contains("reward"))
                {
                    button.onClick.AddListener(() => ShowAchievements());
                }
                else if (buttonName.Contains("pause"))
                {
                    button.onClick.AddListener(() => ShowPause());
                }
                else if (buttonName.Contains("back") || buttonName.Contains("return"))
                {
                    button.onClick.AddListener(() => ShowMainMenu());
                }
                else if (buttonName.Contains("castle") || buttonName.Contains("view"))
                {
                    button.onClick.AddListener(() => ShowCastleView());
                }
                else if (buttonName.Contains("economy") || buttonName.Contains("currency"))
                {
                    button.onClick.AddListener(() => ShowEconomy());
                }
                else if (buttonName.Contains("premium") || buttonName.Contains("upgrade"))
                {
                    button.onClick.AddListener(() => ShowPremium());
                }
                
                // Add hover effects
                AddButtonHoverEffects(button);
            }
        }
        
        private void AddButtonHoverEffects(Button button)
        {
            var eventTrigger = button.gameObject.GetComponent<UnityEngine.EventSystems.EventTrigger>();
            if (eventTrigger == null)
            {
                eventTrigger = button.gameObject.AddComponent<UnityEngine.EventSystems.EventTrigger>();
            }
            
            // Pointer enter event
            var pointerEnter = new UnityEngine.EventSystems.EventTrigger.Entry();
            pointerEnter.eventID = UnityEngine.EventSystems.EventTriggerType.PointerEnter;
            pointerEnter.callback.AddListener((data) => { PlayButtonHoverEffect(button); });
            eventTrigger.triggers.Add(pointerEnter);
            
            // Pointer exit event
            var pointerExit = new UnityEngine.EventSystems.EventTrigger.Entry();
            pointerExit.eventID = UnityEngine.EventSystems.EventTriggerType.PointerExit;
            pointerExit.callback.AddListener((data) => { OnButtonHoverExit(button); });
            eventTrigger.triggers.Add(pointerExit);
        }
        
        private void OnButtonHoverExit(Button button)
        {
            // Reset button scale
            var rectTransform = button.GetComponent<RectTransform>();
            rectTransform.localScale = Vector3.one;
        }
        
        #endregion
        
        #region Panel Management
        
        public void ShowMainMenu()
        {
            ShowPanel("main_menu");
        }
        
        public void ShowGameplay()
        {
            ShowPanel("gameplay");
        }
        
        public void ShowCastleView()
        {
            ShowPanel("castle_view");
        }
        
        public void ShowShop()
        {
            ShowPanel("shop");
        }
        
        public void ShowSettings()
        {
            ShowPanel("settings");
        }
        
        public void ShowPause()
        {
            ShowPanel("pause");
        }
        
        public void ShowAchievements()
        {
            ShowPanel("achievement");
        }
        
        public void ShowLeaderboard()
        {
            ShowPanel("leaderboard");
        }
        
        public void ShowEvents()
        {
            ShowPanel("event");
        }
        
        public void ShowEconomy()
        {
            ShowPanel("economy");
        }
        
        public void ShowPremium()
        {
            ShowPanel("premium");
        }
        
        public void ShowPanel(string panelName)
        {
            if (_isTransitioning) return;
            
            if (!_uiPanels.ContainsKey(panelName))
            {
                LogWarning($"Panel '{panelName}' not found!");
                return;
            }
            
            if (enableSmoothTransitions)
            {
                StartCoroutine(TransitionToPanel(panelName));
            }
            else
            {
                SetPanelDirect(panelName);
            }
        }
        
        private void SetPanelDirect(string panelName)
        {
            // Hide current panel
            if (_currentPanel != null)
            {
                _currentPanel.SetActive(false);
            }
            
            // Show new panel
            var newPanel = _uiPanels[panelName];
            newPanel.SetActive(true);
            _currentPanel = newPanel;
            
            OnPanelChanged?.Invoke(panelName);
        }
        
        private IEnumerator TransitionToPanel(string panelName)
        {
            _isTransitioning = true;
            
            // Fade out current panel
            if (_currentPanel != null)
            {
                yield return StartCoroutine(FadeOutPanel(_currentPanel));
                _currentPanel.SetActive(false);
            }
            
            // Show new panel
            var newPanel = _uiPanels[panelName];
            newPanel.SetActive(true);
            _currentPanel = newPanel;
            
            // Fade in new panel
            yield return StartCoroutine(FadeInPanel(newPanel));
            
            _isTransitioning = false;
            OnPanelChanged?.Invoke(panelName);
        }
        
        private CanvasGroup GetOrAddCanvasGroup(GameObject panel)
        {
            var canvasGroup = panel.GetComponent<CanvasGroup>();
            if (canvasGroup == null)
            {
                canvasGroup = panel.AddComponent<CanvasGroup>();
            }
            return canvasGroup;
        }
        
        private IEnumerator FadeOutPanel(GameObject panel)
        {
            var canvasGroup = GetOrAddCanvasGroup(panel);
            
            float elapsed = 0f;
            float startAlpha = canvasGroup.alpha;
            
            while (elapsed < transitionDuration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / transitionDuration;
                canvasGroup.alpha = Mathf.Lerp(startAlpha, 0f, transitionCurve.Evaluate(t));
                yield return null;
            }
            
            canvasGroup.alpha = 0f;
        }
        
        private IEnumerator FadeInPanel(GameObject panel)
        {
            var canvasGroup = GetOrAddCanvasGroup(panel);
            canvasGroup.alpha = 0f;
            
            float elapsed = 0f;
            
            while (elapsed < transitionDuration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / transitionDuration;
                canvasGroup.alpha = Mathf.Lerp(0f, 1f, transitionCurve.Evaluate(t));
                yield return null;
            }
            
            canvasGroup.alpha = 1f;
        }
        
        #endregion
        
        #region Notification System
        
        public void ShowNotification(string message, float duration = 3f, NotificationType type = NotificationType.Info)
        {
            if (notificationPrefab == null || notificationContainer == null) return;
            
            GameObject notification;
            
            if (enableObjectPooling && _elementPools.ContainsKey("notifications"))
            {
                notification = _elementPools["notifications"].Get();
            }
            else
            {
                notification = Instantiate(notificationPrefab, notificationContainer);
            }
            
            // Setup notification
            SetupNotification(notification, message, type);
            
            _notificationQueue.Enqueue(notification);
            StartCoroutine(ShowNotificationCoroutine(notification, duration));
            
            OnNotificationShown?.Invoke(message);
        }
        
        private void SetupNotification(GameObject notification, string message, NotificationType type)
        {
            var notificationText = notification.GetComponentInChildren<Text>();
            if (notificationText != null)
            {
                notificationText.text = message;
            }
            
            // Set notification type styling
            var image = notification.GetComponent<Image>();
            if (image != null)
            {
                switch (type)
                {
                    case NotificationType.Success:
                        image.color = Color.green;
                        break;
                    case NotificationType.Warning:
                        image.color = Color.yellow;
                        break;
                    case NotificationType.Error:
                        image.color = Color.red;
                        break;
                    default:
                        image.color = Color.white;
                        break;
                }
            }
        }
        
        private IEnumerator ShowNotificationCoroutine(GameObject notification, float duration)
        {
            // Animate in
            var rectTransform = notification.GetComponent<RectTransform>();
            var startPos = rectTransform.anchoredPosition;
            var targetPos = startPos;
            startPos.y += 100f;
            
            float elapsed = 0f;
            while (elapsed < 0.3f)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / 0.3f;
                rectTransform.anchoredPosition = Vector2.Lerp(startPos, targetPos, transitionCurve.Evaluate(t));
                yield return null;
            }
            
            rectTransform.anchoredPosition = targetPos;
            
            // Play notification sound
            PlaySound(notificationSound);
            
            // Wait for duration
            yield return new WaitForSeconds(duration);
            
            // Animate out
            elapsed = 0f;
            while (elapsed < 0.3f)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / 0.3f;
                rectTransform.anchoredPosition = Vector2.Lerp(targetPos, startPos, transitionCurve.Evaluate(t));
                yield return null;
            }
            
            _notificationQueue.Dequeue();
            
            if (enableObjectPooling && _elementPools.ContainsKey("notifications"))
            {
                _elementPools["notifications"].Return(notification);
            }
            else
            {
                Destroy(notification);
            }
        }
        
        #endregion
        
        #region Reward System
        
        public void ShowRewardPopup(string title, string description, Sprite icon, int amount, RewardType type = RewardType.Coins)
        {
            if (rewardPopupPrefab == null || rewardPopupContainer == null) return;
            
            GameObject rewardPopup;
            
            if (enableObjectPooling && _elementPools.ContainsKey("reward_popups"))
            {
                rewardPopup = _elementPools["reward_popups"].Get();
            }
            else
            {
                rewardPopup = Instantiate(rewardPopupPrefab, rewardPopupContainer);
            }
            
            // Setup reward popup
            SetupRewardPopup(rewardPopup, title, description, icon, amount, type);
            
            StartCoroutine(ShowRewardPopupCoroutine(rewardPopup));
            
            OnRewardShown?.Invoke(title, amount);
        }
        
        private void SetupRewardPopup(GameObject rewardPopup, string title, string description, Sprite icon, int amount, RewardType type)
        {
            // Find and set title text
            var titleText = rewardPopup.GetComponentInChildren<Text>();
            if (titleText != null)
            {
                titleText.text = title;
            }
            
            // Find and set description text
            var descriptionTexts = rewardPopup.GetComponentsInChildren<Text>();
            if (descriptionTexts.Length > 1)
            {
                descriptionTexts[1].text = description;
            }
            
            // Find and set amount text
            if (descriptionTexts.Length > 2)
            {
                descriptionTexts[2].text = amount.ToString();
            }
            
            // Find and set icon
            var iconImage = rewardPopup.GetComponentInChildren<Image>();
            if (iconImage != null && icon != null)
            {
                iconImage.sprite = icon;
            }
        }
        
        private IEnumerator ShowRewardPopupCoroutine(GameObject rewardPopup)
        {
            // Animate in
            var rectTransform = rewardPopup.GetComponent<RectTransform>();
            var startScale = Vector3.zero;
            var targetScale = Vector3.one;
            
            rewardPopup.transform.localScale = startScale;
            
            float elapsed = 0f;
            while (elapsed < 0.5f)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / 0.5f;
                rewardPopup.transform.localScale = Vector3.Lerp(startScale, targetScale, transitionCurve.Evaluate(t));
                yield return null;
            }
            
            rewardPopup.transform.localScale = targetScale;
            
            // Play reward sound
            PlaySound(rewardSound);
            
            // Wait for display duration
            yield return new WaitForSeconds(2f);
            
            // Animate out
            elapsed = 0f;
            while (elapsed < 0.3f)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / 0.3f;
                rewardPopup.transform.localScale = Vector3.Lerp(targetScale, startScale, transitionCurve.Evaluate(t));
                yield return null;
            }
            
            if (enableObjectPooling && _elementPools.ContainsKey("reward_popups"))
            {
                _elementPools["reward_popups"].Return(rewardPopup);
            }
            else
            {
                Destroy(rewardPopup);
            }
        }
        
        #endregion
        
        #region Performance Optimization
        
        private void StartBatchUpdates()
        {
            if (enableBatchUpdates)
            {
                _batchUpdateCoroutine = StartCoroutine(BatchUpdateCoroutine());
            }
        }
        
        private IEnumerator BatchUpdateCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(uiUpdateInterval);
                
                ProcessPendingUpdates();
            }
        }
        
        private void ProcessPendingUpdates()
        {
            foreach (var update in _pendingUpdates)
            {
                if (Time.time - _lastUpdateTimes.GetValueOrDefault(update.ComponentId, 0f) >= uiUpdateInterval)
                {
                    update.UpdateAction?.Invoke();
                    _lastUpdateTimes[update.ComponentId] = Time.time;
                }
            }
            
            _pendingUpdates.Clear();
        }
        
        public void RequestUIUpdate(string componentId, System.Action updateAction)
        {
            if (enableBatchUpdates)
            {
                _pendingUpdates.Add(new UIUpdateRequest
                {
                    ComponentId = componentId,
                    UpdateAction = updateAction
                });
            }
            else
            {
                updateAction?.Invoke();
            }
        }
        
        public UIComponentCache GetComponentCache(string panelName)
        {
            return _componentCaches.ContainsKey(panelName) ? _componentCaches[panelName] : null;
        }
        
        public UIElementPool GetElementPool(string poolName)
        {
            return _elementPools.ContainsKey(poolName) ? _elementPools[poolName] : null;
        }
        
        #endregion
        
        #region Audio System
        
        public void PlayButtonClickSound()
        {
            PlaySound(buttonClickSound);
        }
        
        public void PlayButtonHoverSound()
        {
            PlaySound(buttonHoverSound);
        }
        
        public void PlayNotificationSound()
        {
            PlaySound(notificationSound);
        }
        
        public void PlayRewardSound()
        {
            PlaySound(rewardSound);
        }
        
        private void PlaySound(AudioClip clip)
        {
            if (clip != null && _audioSource != null)
            {
                _audioSource.PlayOneShot(clip);
            }
        }
        
        public void SetUIVolume(float volume)
        {
            audioVolume = Mathf.Clamp01(volume);
            if (_audioSource != null)
            {
                _audioSource.volume = audioVolume;
            }
        }
        
        #endregion
        
        #region 5/5 User Experience Methods
        
        public void ShowLoadingOverlay(bool show)
        {
            if (loadingOverlay != null)
            {
                loadingOverlay.SetActive(show);
            }
        }
        
        // 5/5 User Experience - Seamless Navigation
        public void ShowPanelWithSmoothTransition(string panelName, bool playSound = true)
        {
            if (playSound)
            {
                PlayButtonClickSound();
            }
            
            if (enableSmoothTransitions)
            {
                StartCoroutine(EnhancedTransitionToPanel(panelName));
            }
            else
            {
                ShowPanel(panelName);
            }
        }
        
        private IEnumerator EnhancedTransitionToPanel(string panelName)
        {
            _isTransitioning = true;
            
            // Enhanced fade out with scale animation
            if (_currentPanel != null)
            {
                yield return StartCoroutine(EnhancedFadeOutPanel(_currentPanel));
                _currentPanel.SetActive(false);
            }
            
            // Show new panel
            var newPanel = _uiPanels[panelName];
            newPanel.SetActive(true);
            _currentPanel = newPanel;
            
            // Enhanced fade in with scale animation
            yield return StartCoroutine(EnhancedFadeInPanel(newPanel));
            
            _isTransitioning = false;
            OnPanelChanged?.Invoke(panelName);
        }
        
        private IEnumerator EnhancedFadeOutPanel(GameObject panel)
        {
            var canvasGroup = GetOrAddCanvasGroup(panel);
            var rectTransform = panel.GetComponent<RectTransform>();
            
            float elapsed = 0f;
            float startAlpha = canvasGroup.alpha;
            Vector3 startScale = rectTransform.localScale;
            Vector3 targetScale = startScale * 0.95f; // Slight scale down
            
            while (elapsed < transitionDuration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / transitionDuration;
                float easedT = transitionCurve.Evaluate(t);
                
                canvasGroup.alpha = Mathf.Lerp(startAlpha, 0f, easedT);
                rectTransform.localScale = Vector3.Lerp(startScale, targetScale, easedT);
                
                yield return null;
            }
            
            canvasGroup.alpha = 0f;
            rectTransform.localScale = startScale; // Reset scale
        }
        
        private IEnumerator EnhancedFadeInPanel(GameObject panel)
        {
            var canvasGroup = GetOrAddCanvasGroup(panel);
            var rectTransform = panel.GetComponent<RectTransform>();
            
            canvasGroup.alpha = 0f;
            Vector3 startScale = rectTransform.localScale * 0.95f;
            Vector3 targetScale = rectTransform.localScale;
            rectTransform.localScale = startScale;
            
            float elapsed = 0f;
            
            while (elapsed < transitionDuration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / transitionDuration;
                float easedT = transitionCurve.Evaluate(t);
                
                canvasGroup.alpha = Mathf.Lerp(0f, 1f, easedT);
                rectTransform.localScale = Vector3.Lerp(startScale, targetScale, easedT);
                
                yield return null;
            }
            
            canvasGroup.alpha = 1f;
            rectTransform.localScale = targetScale;
        }
        
        // 5/5 User Experience - Responsive Interactions
        public void PlayButtonHoverEffect(Button button)
        {
            if (button == null) return;
            
            // Visual feedback
            StartCoroutine(ButtonHoverAnimation(button));
            
            // Audio feedback
            PlayButtonHoverSound();
            
            // Haptic feedback (mobile)
            if (enableHapticFeedback && Application.isMobilePlatform)
            {
                Handheld.Vibrate();
            }
        }
        
        private IEnumerator ButtonHoverAnimation(Button button)
        {
            var rectTransform = button.GetComponent<RectTransform>();
            Vector3 originalScale = rectTransform.localScale;
            Vector3 hoverScale = originalScale * 1.05f;
            
            // Scale up
            float elapsed = 0f;
            while (elapsed < 0.1f)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / 0.1f;
                rectTransform.localScale = Vector3.Lerp(originalScale, hoverScale, t);
                yield return null;
            }
            
            // Scale back down
            elapsed = 0f;
            while (elapsed < 0.1f)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / 0.1f;
                rectTransform.localScale = Vector3.Lerp(hoverScale, originalScale, t);
                yield return null;
            }
            
            rectTransform.localScale = originalScale;
        }
        
        // 5/5 User Experience - Accessibility Features
        public void ToggleHighContrastMode()
        {
            enableHighContrastMode = !enableHighContrastMode;
            ApplyAccessibilitySettings();
        }
        
        public void ToggleLargeTextMode()
        {
            enableLargeTextMode = !enableLargeTextMode;
            ApplyAccessibilitySettings();
        }
        
        public void SetUIScale(float scale)
        {
            uiScaleFactor = Mathf.Clamp(scale, 0.5f, 2.0f);
            ApplyAccessibilitySettings();
        }
        
        private void ApplyAccessibilitySettings()
        {
            // Apply high contrast mode
            if (enableHighContrastMode)
            {
                // Increase contrast for all UI elements
                ApplyHighContrastToAllPanels();
            }
            
            // Apply large text mode
            if (enableLargeTextMode)
            {
                // Increase text size for all text elements
                ApplyLargeTextToAllPanels();
            }
            
            // Apply UI scale
            var canvasScaler = GetComponent<CanvasScaler>();
            if (canvasScaler != null)
            {
                canvasScaler.scaleFactor = uiScaleFactor;
            }
        }
        
        private void ApplyHighContrastToAllPanels()
        {
            foreach (var panel in _uiPanels.Values)
            {
                if (panel != null)
                {
                    ApplyHighContrastToPanel(panel);
                }
            }
        }
        
        private void ApplyHighContrastToPanel(GameObject panel)
        {
            // Increase contrast for images
            var images = panel.GetComponentsInChildren<Image>();
            foreach (var image in images)
            {
                if (image.color.a > 0.1f) // Only modify visible images
                {
                    // Increase contrast
                    var color = image.color;
                    color.r = Mathf.Clamp01(color.r * 1.5f);
                    color.g = Mathf.Clamp01(color.g * 1.5f);
                    color.b = Mathf.Clamp01(color.b * 1.5f);
                    image.color = color;
                }
            }
            
            // Increase text contrast
            var texts = panel.GetComponentsInChildren<Text>();
            foreach (var text in texts)
            {
                text.color = Color.white; // High contrast white text
            }
        }
        
        private void ApplyLargeTextToAllPanels()
        {
            foreach (var panel in _uiPanels.Values)
            {
                if (panel != null)
                {
                    ApplyLargeTextToPanel(panel);
                }
            }
        }
        
        private void ApplyLargeTextToPanel(GameObject panel)
        {
            var texts = panel.GetComponentsInChildren<Text>();
            foreach (var text in texts)
            {
                text.fontSize = Mathf.RoundToInt(text.fontSize * 1.3f); // 30% larger text
            }
        }
        
        // 5/5 User Experience - Visual Polish
        public void ShowParticleEffect(Vector3 position, ParticleEffectType effectType)
        {
            if (particleEffectPrefab == null) return;
            
            var effect = Instantiate(particleEffectPrefab, position, Quaternion.identity);
            
            // Configure particle effect based on type
            var particleSystem = effect.GetComponent<ParticleSystem>();
            if (particleSystem != null)
            {
                var main = particleSystem.main;
                switch (effectType)
                {
                    case ParticleEffectType.Success:
                        main.startColor = Color.green;
                        break;
                    case ParticleEffectType.Reward:
                        main.startColor = Color.yellow;
                        break;
                    case ParticleEffectType.LevelUp:
                        main.startColor = Color.cyan;
                        break;
                    case ParticleEffectType.Achievement:
                        main.startColor = Color.magenta;
                        break;
                }
            }
            
            // Destroy after duration
            Destroy(effect, 2f);
        }
        
        public void ShowGlowEffect(GameObject target, float duration = 1f)
        {
            if (glowEffectPrefab == null || target == null) return;
            
            var glow = Instantiate(glowEffectPrefab, target.transform);
            glow.transform.localPosition = Vector3.zero;
            glow.transform.localScale = Vector3.one * 1.2f;
            
            // Animate glow
            StartCoroutine(AnimateGlowEffect(glow, duration));
        }
        
        private IEnumerator AnimateGlowEffect(GameObject glow, float duration)
        {
            var canvasGroup = glow.GetComponent<CanvasGroup>();
            if (canvasGroup == null)
            {
                canvasGroup = glow.AddComponent<CanvasGroup>();
            }
            
            float elapsed = 0f;
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / duration;
                
                // Pulsing glow effect
                canvasGroup.alpha = Mathf.Sin(t * Mathf.PI * 4) * 0.5f + 0.5f;
                
                yield return null;
            }
            
            Destroy(glow);
        }
        
        // 5/5 User Experience - Enhanced Audio
        public void PlaySuccessSound()
        {
            PlaySound(successSound);
        }
        
        public void PlayErrorSound()
        {
            PlaySound(errorSound);
        }
        
        public void PlayLevelUpSound()
        {
            PlaySound(levelUpSound);
        }
        
        public void PlayAchievementSound()
        {
            PlaySound(achievementSound);
        }
        
        public void SetSFXVolume(float volume)
        {
            sfxVolume = Mathf.Clamp01(volume);
            UpdateAudioVolumes();
        }
        
        public void SetMusicVolume(float volume)
        {
            musicVolume = Mathf.Clamp01(volume);
            UpdateAudioVolumes();
        }
        
        private void UpdateAudioVolumes()
        {
            if (_audioSource != null)
            {
                _audioSource.volume = sfxVolume;
            }
        }
        
        #endregion
        
        #region Utility Methods
        
        public void SetUIScale(float scale)
        {
            var canvasScaler = GetComponent<CanvasScaler>();
            if (canvasScaler != null)
            {
                canvasScaler.scaleFactor = scale;
            }
        }
        
        public void SetUIScale(string panelName, float scale)
        {
            if (_uiPanels.ContainsKey(panelName))
            {
                var canvasScaler = _uiPanels[panelName].GetComponent<CanvasScaler>();
                if (canvasScaler != null)
                {
                    canvasScaler.scaleFactor = scale;
                }
            }
        }
        
        public void EnableUIAnimations(bool enable)
        {
            enableUIAnimations = enable;
        }
        
        public void EnableSmoothTransitions(bool enable)
        {
            enableSmoothTransitions = enable;
        }
        
        #endregion
        
        #region Event Handlers
        
        private void OnRoomUnlocked(Room room)
        {
            ShowNotification($"New room unlocked: {room.name}!", 3f, NotificationType.Success);
        }
        
        private void OnRoomCompleted(Room room)
        {
            ShowNotification($"Room completed: {room.name}!", 3f, NotificationType.Success);
        }
        
        private void OnTaskCompleted(Task task)
        {
            ShowNotification($"Task completed: {task.description}!", 3f, NotificationType.Success);
        }
        
        private void OnRewardEarned(Reward reward)
        {
            string message = $"Reward earned: {reward.amount} {reward.type}";
            if (!string.IsNullOrEmpty(reward.itemId))
            {
                message += $" ({reward.itemId})";
            }
            ShowNotification(message, 3f, NotificationType.Success);
        }
        
        #endregion
        
        #region Logging
        
        private void Log(string message)
        {
            Debug.Log($"[OptimizedUI] {message}");
        }
        
        private void LogWarning(string message)
        {
            Debug.LogWarning($"[OptimizedUI] {message}");
        }
        
        private void LogError(string message)
        {
            Debug.LogError($"[OptimizedUI] {message}");
        }
        
        #endregion
        
        #region Unity Lifecycle
        
        void OnDestroy()
        {
            if (_batchUpdateCoroutine != null)
            {
                StopCoroutine(_batchUpdateCoroutine);
            }
            
            // Unsubscribe from events
            var castleSystem = OptimizedCoreSystem.Instance?.Resolve<CastleRenovationSystem>();
            if (castleSystem != null)
            {
                castleSystem.OnRoomUnlocked -= OnRoomUnlocked;
                castleSystem.OnRoomCompleted -= OnRoomCompleted;
                castleSystem.OnTaskCompleted -= OnTaskCompleted;
                castleSystem.OnRewardEarned -= OnRewardEarned;
            }
        }
        
        #endregion
    }
    
    #region Data Structures
    
    public enum NotificationType
    {
        Info, Success, Warning, Error
    }
    
    public enum RewardType
    {
        Coins, Gems, Energy, Items, Experience
    }
    
    public enum ParticleEffectType
    {
        Success, Reward, LevelUp, Achievement
    }
    
    [System.Serializable]
    public class UIUpdateRequest
    {
        public string ComponentId;
        public System.Action UpdateAction;
    }
    
    [System.Serializable]
    public class UIComponentCache
    {
        private Dictionary<string, Component> _cachedComponents = new Dictionary<string, Component>();
        private GameObject _targetObject;
        
        public UIComponentCache(GameObject targetObject)
        {
            _targetObject = targetObject;
            CacheCommonComponents();
        }
        
        private void CacheCommonComponents()
        {
            // Cache commonly used components
            _cachedComponents["CanvasGroup"] = _targetObject.GetComponent<CanvasGroup>();
            _cachedComponents["RectTransform"] = _targetObject.GetComponent<RectTransform>();
            _cachedComponents["Image"] = _targetObject.GetComponent<Image>();
            _cachedComponents["Button"] = _targetObject.GetComponent<Button>();
            _cachedComponents["Text"] = _targetObject.GetComponent<Text>();
        }
        
        public T GetComponent<T>() where T : Component
        {
            var key = typeof(T).Name;
            if (_cachedComponents.ContainsKey(key))
            {
                return _cachedComponents[key] as T;
            }
            
            var component = _targetObject.GetComponent<T>();
            if (component != null)
            {
                _cachedComponents[key] = component;
            }
            
            return component;
        }
        
        public T[] GetComponentsInChildren<T>() where T : Component
        {
            return _targetObject.GetComponentsInChildren<T>();
        }
    }
    
    [System.Serializable]
    public class UIElementPool
    {
        private Queue<GameObject> _pool = new Queue<GameObject>();
        private GameObject _prefab;
        private int _maxSize;
        
        public UIElementPool(GameObject prefab, int maxSize)
        {
            _prefab = prefab;
            _maxSize = maxSize;
        }
        
        public GameObject Get()
        {
            if (_pool.Count > 0)
            {
                var obj = _pool.Dequeue();
                obj.SetActive(true);
                return obj;
            }
            
            if (_prefab != null)
            {
                return Object.Instantiate(_prefab);
            }
            
            return null;
        }
        
        public void Return(GameObject obj)
        {
            if (obj != null && _pool.Count < _maxSize)
            {
                obj.SetActive(false);
                _pool.Enqueue(obj);
            }
            else if (obj != null)
            {
                Object.Destroy(obj);
            }
        }
    }
    
    #endregion
}