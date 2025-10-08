using UnityEngine;
using UnityEngine.UI;
using System.Collections;
using System.Collections.Generic;
using Evergreen.Core;
using Evergreen.MetaGame;

namespace Evergreen.UI
{
    public class EnhancedUIManager : MonoBehaviour
    {
        [Header("UI Panels")]
        public GameObject mainMenuPanel;
        public GameObject gameplayPanel;
        public GameObject castleViewPanel;
        public GameObject shopPanel;
        public GameObject settingsPanel;
        public GameObject pausePanel;
        
        [Header("Transition Settings")]
        public float transitionDuration = 0.3f;
        public AnimationCurve transitionCurve = AnimationCurve.EaseInOut(0, 0, 1, 1);
        
        [Header("UI Effects")]
        public GameObject loadingOverlay;
        public GameObject notificationPrefab;
        public Transform notificationContainer;
        
        private Dictionary<string, GameObject> _uiPanels = new Dictionary<string, GameObject>();
        private GameObject _currentPanel;
        private Queue<GameObject> _notificationQueue = new Queue<GameObject>();
        private bool _isTransitioning = false;
        
        public static EnhancedUIManager Instance { get; private set; }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeUI();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            ShowMainMenu();
        }
        
        private void InitializeUI()
        {
            // Register UI panels
            if (mainMenuPanel != null) _uiPanels["main_menu"] = mainMenuPanel;
            if (gameplayPanel != null) _uiPanels["gameplay"] = gameplayPanel;
            if (castleViewPanel != null) _uiPanels["castle_view"] = castleViewPanel;
            if (shopPanel != null) _uiPanels["shop"] = shopPanel;
            if (settingsPanel != null) _uiPanels["settings"] = settingsPanel;
            if (pausePanel != null) _uiPanels["pause"] = pausePanel;
            
            // Hide all panels initially
            foreach (var panel in _uiPanels.Values)
            {
                if (panel != null)
                {
                    panel.SetActive(false);
                }
            }
            
            // Setup castle view integration
            SetupCastleViewIntegration();
        }
        
        private void SetupCastleViewIntegration()
        {
            var castleSystem = ServiceLocator.Get<CastleRenovationSystem>();
            if (castleSystem != null)
            {
                castleSystem.OnRoomUnlocked += OnRoomUnlocked;
                castleSystem.OnRoomCompleted += OnRoomCompleted;
                castleSystem.OnTaskCompleted += OnTaskCompleted;
                castleSystem.OnRewardEarned += OnRewardEarned;
            }
        }
        
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
        
        public void ShowPanel(string panelName)
        {
            if (_isTransitioning) return;
            
            if (!_uiPanels.ContainsKey(panelName))
            {
                Debug.LogWarning($"Panel '{panelName}' not found!");
                return;
            }
            
            StartCoroutine(TransitionToPanel(panelName));
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
        
        public void ShowNotification(string message, float duration = 3f)
        {
            if (notificationPrefab == null || notificationContainer == null) return;
            
            var notification = Instantiate(notificationPrefab, notificationContainer);
            var notificationText = notification.GetComponentInChildren<Text>();
            if (notificationText != null)
            {
                notificationText.text = message;
            }
            
            _notificationQueue.Enqueue(notification);
            StartCoroutine(ShowNotificationCoroutine(notification, duration));
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
            Destroy(notification);
        }
        
        public void ShowLoadingOverlay(bool show)
        {
            if (loadingOverlay != null)
            {
                loadingOverlay.SetActive(show);
            }
        }
        
        public void ShowRewardPopup(string title, string description, Sprite icon, int amount)
        {
            // This would show a proper reward popup
            ShowNotification($"{title}: {amount} {description}");
        }
        
        private void OnRoomUnlocked(Room room)
        {
            ShowNotification($"New room unlocked: {room.name}!");
        }
        
        private void OnRoomCompleted(Room room)
        {
            ShowNotification($"Room completed: {room.name}!");
        }
        
        private void OnTaskCompleted(Task task)
        {
            ShowNotification($"Task completed: {task.description}!");
        }
        
        private void OnRewardEarned(Reward reward)
        {
            string message = $"Reward earned: {reward.amount} {reward.type}";
            if (!string.IsNullOrEmpty(reward.itemId))
            {
                message += $" ({reward.itemId})";
            }
            ShowNotification(message);
        }
        
        private AudioSource GetAudioSource()
        {
            return GetComponent<AudioSource>();
        }
        
        public void PlayButtonClickSound()
        {
            // Play button click sound
            var audioSource = GetAudioSource();
            audioSource?.Play();
        }
        
        public void PlayButtonHoverSound()
        {
            // Play button hover sound
            var audioSource = GetAudioSource();
            audioSource?.Play();
        }
        
        public void SetUIScale(float scale)
        {
            var canvasScaler = GetComponent<CanvasScaler>();
            if (canvasScaler != null)
            {
                canvasScaler.scaleFactor = scale;
            }
        }
        
        public void SetUIVolume(float volume)
        {
            var audioSource = GetAudioSource();
            if (audioSource != null)
            {
                audioSource.volume = volume;
            }
        }
        
        void OnDestroy()
        {
            var castleSystem = ServiceLocator.Get<CastleRenovationSystem>();
            if (castleSystem != null)
            {
                castleSystem.OnRoomUnlocked -= OnRoomUnlocked;
                castleSystem.OnRoomCompleted -= OnRoomCompleted;
                castleSystem.OnTaskCompleted -= OnTaskCompleted;
                castleSystem.OnRewardEarned -= OnRewardEarned;
            }
        }
    }
}