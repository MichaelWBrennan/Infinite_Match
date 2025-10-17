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
        
        [Header("Transition Settings")]
        public float transitionDuration = 0.3f;
        public AnimationCurve transitionCurve = AnimationCurve.EaseInOut(0, 0, 1, 1);
        public bool enableSmoothTransitions = true;
        public bool enableUIAnimations = true;
        
        [Header("UI Effects")]
        public GameObject loadingOverlay;
        public GameObject notificationPrefab;
        public Transform notificationContainer;
        public GameObject rewardPopupPrefab;
        public Transform rewardPopupContainer;
        
        [Header("Performance Settings")]
        public bool enableObjectPooling = true;
        public bool enableComponentCaching = true;
        public bool enableBatchUpdates = true;
        public int maxPooledElements = 100;
        public float uiUpdateInterval = 0.1f;
        
        [Header("Audio Settings")]
        public AudioClip buttonClickSound;
        public AudioClip buttonHoverSound;
        public AudioClip notificationSound;
        public AudioClip rewardSound;
        public float audioVolume = 1f;
        
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
        
        #region Utility Methods
        
        public void ShowLoadingOverlay(bool show)
        {
            if (loadingOverlay != null)
            {
                loadingOverlay.SetActive(show);
            }
        }
        
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