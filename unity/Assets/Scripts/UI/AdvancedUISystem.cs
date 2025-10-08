using UnityEngine;
using UnityEngine.UI;
using System.Collections;
using System.Collections.Generic;
using System;
using DG.Tweening;
using Evergreen.Core;

namespace Evergreen.UI
{
    public class AdvancedUISystem : MonoBehaviour
    {
        [Header("UI Animation Settings")]
        public float defaultAnimationDuration = 0.3f;
        public Ease defaultEase = Ease.OutCubic;
        public float screenTransitionDuration = 0.5f;
        public float elementFadeDuration = 0.2f;
        public float buttonPressScale = 0.95f;
        public float hoverScale = 1.05f;
        
        [Header("Screen Management")]
        public Canvas mainCanvas;
        public CanvasGroup screenGroup;
        public List<UIScreen> screens = new List<UIScreen>();
        public UIScreen currentScreen;
        public UIScreen previousScreen;
        
        [Header("Notification System")]
        public GameObject notificationPrefab;
        public Transform notificationContainer;
        public int maxNotifications = 5;
        public float notificationDuration = 3f;
        public float notificationSpacing = 10f;
        
        [Header("Loading System")]
        public GameObject loadingOverlay;
        public Slider loadingProgressBar;
        public Text loadingText;
        public Image loadingIcon;
        public float loadingIconRotationSpeed = 90f;
        
        [Header("Modal System")]
        public GameObject modalOverlay;
        public Transform modalContainer;
        public float modalFadeDuration = 0.3f;
        public float modalScaleDuration = 0.2f;
        
        [Header("Button System")]
        public AudioClip buttonClickSound;
        public AudioClip buttonHoverSound;
        public float buttonSoundVolume = 0.7f;
        
        [Header("Responsive Design")]
        public bool enableResponsiveDesign = true;
        public Vector2 referenceResolution = new Vector2(1080, 1920);
        public float scaleFactor = 1f;
        public bool maintainAspectRatio = true;
        
        private Dictionary<string, UIScreen> _screenLookup = new Dictionary<string, UIScreen>();
        private Queue<UINotification> _notificationQueue = new Queue<UINotification>();
        private List<UINotification> _activeNotifications = new List<UINotification>();
        private Dictionary<string, GameObject> _activeModals = new Dictionary<string, GameObject>();
        private Dictionary<Button, ButtonState> _buttonStates = new Dictionary<Button, ButtonState>();
        private Coroutine _loadingCoroutine;
        private bool _isTransitioning = false;
        
        // Events
        public System.Action<UIScreen> OnScreenChanged;
        public System.Action<UINotification> OnNotificationShown;
        public System.Action<UINotification> OnNotificationHidden;
        public System.Action<GameObject> OnModalShown;
        public System.Action<GameObject> OnModalHidden;
        public System.Action<Button> OnButtonPressed;
        public System.Action<Button> OnButtonHovered;
        
        public static AdvancedUISystem Instance { get; private set; }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeUIsystemSafe();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            SetupResponsiveDesign();
            InitializeScreens();
            SetupButtonsystemSafe();
            StartCoroutine(ProcessNotificationQueue());
        }
        
        void Update()
        {
            UpdateResponsiveDesign();
            UpdateButtonStates();
        }
        
        private void InitializeUIsystemSafe()
        {
            Debug.Log("Advanced UI System initialized");
            
            // Setup main canvas
            if (mainCanvas == null)
                mainCanvas = GetComponent<Canvas>();
                
            if (screenGroup == null)
                screenGroup = GetComponent<CanvasGroup>();
                
            // Initialize screen lookup
            foreach (var screen in screens)
            {
                if (screen != null && !string.IsNullOrEmpty(screen.screenId))
                {
                    _screenLookup[screen.screenId] = screen;
                    screen.gameObject.SetActive(false);
                }
            }
            
            // Show first screen
            if (screens.Count > 0)
            {
                ShowScreen(screens[0].screenId);
            }
        }
        
        private void SetupResponsiveDesign()
        {
            if (!enableResponsiveDesign) return;
            
            var canvasScaler = mainCanvas.GetComponent<CanvasScaler>();
            if (canvasScaler != null)
            {
                canvasScaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
                canvasScaler.referenceResolution = referenceResolution;
                canvasScaler.screenMatchMode = CanvasScaler.ScreenMatchMode.MatchWidthOrHeight;
                canvasScaler.matchWidthOrHeight = maintainAspectRatio ? 0.5f : 0f;
            }
        }
        
        private void UpdateResponsiveDesign()
        {
            if (!enableResponsiveDesign) return;
            
            float currentAspectRatio = (float)Screen.width / Screen.height;
            float referenceAspectRatio = referenceResolution.x / referenceResolution.y;
            
            if (maintainAspectRatio)
            {
                scaleFactor = Mathf.Min(Screen.width / referenceResolution.x, Screen.height / referenceResolution.y);
            }
            else
            {
                scaleFactor = 1f;
            }
        }
        
        private void InitializeScreens()
        {
            foreach (var screen in screens)
            {
                if (screen != null)
                {
                    screen.Initialize(this);
                    screen.gameObject.SetActive(false);
                }
            }
        }
        
        private void SetupButtonsystemSafe()
        {
            var buttons = FindObjectsOfType<Button>();
            foreach (var button in buttons)
            {
                SetupButton(button);
            }
        }
        
        private void SetupButton(Button button)
        {
            if (button == null) return;
            
            var buttonState = new ButtonState
            {
                button = button,
                originalScale = button.transform.localScale,
                isPressed = false,
                isHovered = false
            };
            
            _buttonStates[button] = buttonState;
            
            // Add click listener
            button.onClick.AddListener(() => OnButtonClick(button));
            
            // Add hover listeners if supported
            var eventTrigger = button.GetComponent<UnityEngine.EventSystems.EventTrigger>();
            if (eventTrigger == null)
            {
                eventTrigger = button.gameObject.AddComponent<UnityEngine.EventSystems.EventTrigger>();
            }
            
            // Pointer enter
            var pointerEnter = new UnityEngine.EventSystems.EventTrigger.Entry();
            pointerEnter.eventID = UnityEngine.EventSystems.EventTriggerType.PointerEnter;
            pointerEnter.callback.AddListener((data) => OnButtonHover(button, true));
            eventTrigger.triggers.Add(pointerEnter);
            
            // Pointer exit
            var pointerExit = new UnityEngine.EventSystems.EventTrigger.Entry();
            pointerExit.eventID = UnityEngine.EventSystems.EventTriggerType.PointerExit;
            pointerExit.callback.AddListener((data) => OnButtonHover(button, false));
            eventTrigger.triggers.Add(pointerExit);
            
            // Pointer down
            var pointerDown = new UnityEngine.EventSystems.EventTrigger.Entry();
            pointerDown.eventID = UnityEngine.EventSystems.EventTriggerType.PointerDown;
            pointerDown.callback.AddListener((data) => OnButtonPress(button, true));
            eventTrigger.triggers.Add(pointerDown);
            
            // Pointer up
            var pointerUp = new UnityEngine.EventSystems.EventTrigger.Entry();
            pointerUp.eventID = UnityEngine.EventSystems.EventTriggerType.PointerUp;
            pointerUp.callback.AddListener((data) => OnButtonPress(button, false));
            eventTrigger.triggers.Add(pointerUp);
        }
        
        private void UpdateButtonStates()
        {
            foreach (var kvp in _buttonStates)
            {
                var buttonState = kvp.Value;
                var button = kvp.Key;
                
                if (button == null) continue;
                
                // Update hover state
                bool isHovered = UnityEngine.EventSystems.EventSystem.current.currentSelectedGameObject == button.gameObject;
                if (isHovered != buttonState.isHovered)
                {
                    OnButtonHover(button, isHovered);
                }
            }
        }
        
        public void ShowScreen(string screenId, bool animated = true)
        {
            if (_isTransitioning) return;
            if (!_screenLookup.ContainsKey(screenId)) return;
            
            var targetScreen = _screenLookup[screenId];
            if (targetScreen == currentScreen) return;
            
            StartCoroutine(TransitionToScreen(targetScreen, animated));
        }
        
        private IEnumerator TransitionToScreen(UIScreen targetScreen, bool animated)
        {
            _isTransitioning = true;
            
            // Hide current screen
            if (currentScreen != null)
            {
                previousScreen = currentScreen;
                yield return StartCoroutine(HideScreen(currentScreen, animated));
            }
            
            // Show target screen
            currentScreen = targetScreen;
            yield return StartCoroutine(ShowScreen(targetScreen, animated));
            
            OnScreenChanged?.Invoke(currentScreen);
            _isTransitioning = false;
        }
        
        private IEnumerator ShowScreen(UIScreen screen, bool animated)
        {
            screen.gameObject.SetActive(true);
            screen.OnShow();
            
            if (animated)
            {
                var canvasGroup = screen.GetComponent<CanvasGroup>();
                if (canvasGroup != null)
                {
                    canvasGroup.alpha = 0f;
                    canvasGroup.DOFade(1f, screenTransitionDuration).SetEase(defaultEase);
                }
                
                screen.transform.localScale = Vector3.one * 0.8f;
                screen.transform.DOScale(Vector3.one, screenTransitionDuration).SetEase(defaultEase);
                
                yield return new WaitForSeconds(screenTransitionDuration);
            }
            else
            {
                var canvasGroup = screen.GetComponent<CanvasGroup>();
                if (canvasGroup != null)
                {
                    canvasGroup.alpha = 1f;
                }
                screen.transform.localScale = Vector3.one;
            }
        }
        
        private IEnumerator HideScreen(UIScreen screen, bool animated)
        {
            if (animated)
            {
                var canvasGroup = screen.GetComponent<CanvasGroup>();
                if (canvasGroup != null)
                {
                    canvasGroup.DOFade(0f, screenTransitionDuration).SetEase(defaultEase);
                }
                
                screen.transform.DOScale(Vector3.one * 0.8f, screenTransitionDuration).SetEase(defaultEase);
                
                yield return new WaitForSeconds(screenTransitionDuration);
            }
            
            screen.OnHide();
            screen.gameObject.SetActive(false);
        }
        
        public void ShowNotification(string message, NotificationType type = NotificationType.Info, float duration = 0f)
        {
            if (duration <= 0) duration = notificationDuration;
            
            var notification = new UINotification
            {
                message = message,
                type = type,
                duration = duration,
                timestamp = Time.time
            };
            
            _notificationQueue.Enqueue(notification);
        }
        
        private IEnumerator ProcessNotificationQueue()
        {
            while (true)
            {
                if (_notificationQueue.Count > 0 && _activeNotifications.Count < maxNotifications)
                {
                    var notification = _notificationQueue.Dequeue();
                    yield return StartCoroutine(ShowNotification(notification));
                }
                
                yield return new WaitForSeconds(0.1f);
            }
        }
        
        private IEnumerator ShowNotification(UINotification notification)
        {
            if (notificationPrefab == null || notificationContainer == null)
            {
                Debug.LogWarning("Notification prefab or container not set");
                yield break;
            }
            
            var notificationObj = Instantiate(notificationPrefab, notificationContainer);
            var notificationUI = notificationObj.GetComponent<UINotificationUI>();
            
            if (notificationUI != null)
            {
                notificationUI.Setup(notification);
            }
            
            _activeNotifications.Add(notification);
            OnNotificationShown?.Invoke(notification);
            
            // Animate in
            notificationObj.transform.localScale = Vector3.zero;
            notificationObj.transform.DOScale(Vector3.one, 0.3f).SetEase(Ease.OutBack);
            
            // Wait for duration
            yield return new WaitForSeconds(notification.duration);
            
            // Animate out
            notificationObj.transform.DOScale(Vector3.zero, 0.3f).SetEase(Ease.InBack);
            yield return new WaitForSeconds(0.3f);
            
            _activeNotifications.Remove(notification);
            OnNotificationHidden?.Invoke(notification);
            Destroy(notificationObj);
        }
        
        public void ShowModal(string modalId, GameObject modalPrefab, bool animated = true)
        {
            if (_activeModals.ContainsKey(modalId)) return;
            
            var modalObj = Instantiate(modalPrefab, modalContainer);
            _activeModals[modalId] = modalObj;
            
            if (animated)
            {
                var canvasGroup = modalObj.GetComponent<CanvasGroup>();
                if (canvasGroup != null)
                {
                    canvasGroup.alpha = 0f;
                    canvasGroup.DOFade(1f, modalFadeDuration).SetEase(defaultEase);
                }
                
                modalObj.transform.localScale = Vector3.zero;
                modalObj.transform.DOScale(Vector3.one, modalScaleDuration).SetEase(Ease.OutBack);
            }
            
            OnModalShown?.Invoke(modalObj);
        }
        
        public void HideModal(string modalId, bool animated = true)
        {
            if (!_activeModals.ContainsKey(modalId)) return;
            
            var modalObj = _activeModals[modalId];
            _activeModals.Remove(modalId);
            
            if (animated)
            {
                var canvasGroup = modalObj.GetComponent<CanvasGroup>();
                if (canvasGroup != null)
                {
                    canvasGroup.DOFade(0f, modalFadeDuration).SetEase(defaultEase);
                }
                
                modalObj.transform.DOScale(Vector3.zero, modalScaleDuration).SetEase(Ease.InBack);
                
                StartCoroutine(DestroyAfterDelay(modalObj, modalScaleDuration));
            }
            else
            {
                Destroy(modalObj);
            }
            
            OnModalHidden?.Invoke(modalObj);
        }
        
        private IEnumerator DestroyAfterDelay(GameObject obj, float delay)
        {
            yield return new WaitForSeconds(delay);
            if (obj != null) Destroy(obj);
        }
        
        public void ShowLoading(string message = "Loading...", float progress = 0f)
        {
            if (loadingOverlay == null) return;
            
            loadingOverlay.SetActive(true);
            
            if (loadingText != null)
                loadingText.text = message;
                
            if (loadingProgressBar != null)
                loadingProgressBar.value = progress;
                
            if (loadingIcon != null)
            {
                _loadingCoroutine = StartCoroutine(RotateLoadingIcon());
            }
        }
        
        public void UpdateLoadingProgress(float progress, string message = null)
        {
            if (loadingOverlay == null || !loadingOverlay.activeInHierarchy) return;
            
            if (loadingProgressBar != null)
                loadingProgressBar.value = progress;
                
            if (loadingText != null && !string.IsNullOrEmpty(message))
                loadingText.text = message;
        }
        
        public void HideLoading()
        {
            if (loadingOverlay == null) return;
            
            if (_loadingCoroutine != null)
            {
                StopCoroutine(_loadingCoroutine);
                _loadingCoroutine = null;
            }
            
            loadingOverlay.SetActive(false);
        }
        
        private IEnumerator RotateLoadingIcon()
        {
            while (loadingOverlay.activeInHierarchy)
            {
                if (loadingIcon != null)
                {
                    loadingIcon.transform.Rotate(0, 0, loadingIconRotationSpeed * Time.deltaTime);
                }
                yield return null;
            }
        }
        
        private void OnButtonClick(Button button)
        {
            if (button == null) return;
            
            // Play sound
            PlayButtonSound(buttonClickSound);
            
            // Animate button
            AnimateButtonClick(button);
            
            OnButtonPressed?.Invoke(button);
        }
        
        private void OnButtonHover(Button button, bool isHovered)
        {
            if (button == null || !_buttonStates.ContainsKey(button)) return;
            
            var buttonState = _buttonStates[button];
            buttonState.isHovered = isHovered;
            
            if (isHovered)
            {
                PlayButtonSound(buttonHoverSound);
                AnimateButtonHover(button, true);
            }
            else
            {
                AnimateButtonHover(button, false);
            }
            
            OnButtonHovered?.Invoke(button);
        }
        
        private void OnButtonPress(Button button, bool isPressed)
        {
            if (button == null || !_buttonStates.ContainsKey(button)) return;
            
            var buttonState = _buttonStates[button];
            buttonState.isPressed = isPressed;
            
            if (isPressed)
            {
                AnimateButtonPress(button, true);
            }
            else
            {
                AnimateButtonPress(button, false);
            }
        }
        
        private void AnimateButtonClick(Button button)
        {
            if (button == null) return;
            
            var sequence = DOTween.Sequence();
            sequence.Append(button.transform.DOScale(buttonPressScale, 0.1f).SetEase(Ease.OutQuad));
            sequence.Append(button.transform.DOScale(1f, 0.1f).SetEase(Ease.OutQuad));
        }
        
        private void AnimateButtonHover(Button button, bool isHovered)
        {
            if (button == null) return;
            
            float targetScale = isHovered ? hoverScale : 1f;
            button.transform.DOScale(targetScale, 0.2f).SetEase(Ease.OutQuad);
        }
        
        private void AnimateButtonPress(Button button, bool isPressed)
        {
            if (button == null) return;
            
            float targetScale = isPressed ? buttonPressScale : 1f;
            button.transform.DOScale(targetScale, 0.1f).SetEase(Ease.OutQuad);
        }
        
        private void PlayButtonSound(AudioClip clip)
        {
            if (clip != null)
            {
                var audioSource = GetComponent<AudioSource>();
                if (audioSource == null)
                {
                    audioSource = gameObject.AddComponent<AudioSource>();
                }
                
                audioSource.PlayOneShot(clip, buttonSoundVolume);
            }
        }
        
        public void FadeIn(CanvasGroup canvasGroup, float duration = 0f)
        {
            if (canvasGroup == null) return;
            if (duration <= 0) duration = elementFadeDuration;
            
            canvasGroup.alpha = 0f;
            canvasGroup.DOFade(1f, duration).SetEase(defaultEase);
        }
        
        public void FadeOut(CanvasGroup canvasGroup, float duration = 0f)
        {
            if (canvasGroup == null) return;
            if (duration <= 0) duration = elementFadeDuration;
            
            canvasGroup.DOFade(0f, duration).SetEase(defaultEase);
        }
        
        public void ScaleIn(Transform transform, float duration = 0f)
        {
            if (transform == null) return;
            if (duration <= 0) duration = elementFadeDuration;
            
            transform.localScale = Vector3.zero;
            transform.DOScale(Vector3.one, duration).SetEase(Ease.OutBack);
        }
        
        public void ScaleOut(Transform transform, float duration = 0f)
        {
            if (transform == null) return;
            if (duration <= 0) duration = elementFadeDuration;
            
            transform.DOScale(Vector3.zero, duration).SetEase(Ease.InBack);
        }
        
        public void Shake(Transform transform, float strength = 10f, float duration = 0.5f)
        {
            if (transform == null) return;
            
            transform.DOShakePosition(duration, strength, 10, 90, false, true);
        }
        
        public void Pulse(Transform transform, float scale = 1.1f, float duration = 0.5f)
        {
            if (transform == null) return;
            
            var sequence = DOTween.Sequence();
            sequence.Append(transform.DOScale(scale, duration * 0.5f).SetEase(Ease.OutQuad));
            sequence.Append(transform.DOScale(1f, duration * 0.5f).SetEase(Ease.InQuad));
            sequence.SetLoops(-1);
        }
        
        public void StopPulse(Transform transform)
        {
            if (transform == null) return;
            
            transform.DOKill();
            transform.localScale = Vector3.one;
        }
        
        void OnDestroy()
        {
            DOTween.KillAll();
        }
    }
    
    [System.Serializable]
    public class UIScreen : MonoBehaviour
    {
        public string screenId;
        public bool isModal = false;
        public bool canGoBack = true;
        public UIScreen previousScreen;
        
        public virtual void Initialize(AdvancedUISystem uiSystem) { }
        public virtual void OnShow() { }
        public virtual void OnHide() { }
        public virtual void OnUpdate() { }
    }
    
    [System.Serializable]
    public class UINotification
    {
        public string message;
        public NotificationType type;
        public float duration;
        public float timestamp;
    }
    
    public enum NotificationType
    {
        Info,
        Success,
        Warning,
        Error
    }
    
    [System.Serializable]
    public class ButtonState
    {
        public Button button;
        public Vector3 originalScale;
        public bool isPressed;
        public bool isHovered;
    }
}