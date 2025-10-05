using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using System.Linq;
using UnityEngine.UI;
using TMPro;

namespace Evergreen.UI
{
    [System.Serializable]
    public class UIPanel
    {
        public string panelId;
        public string panelName;
        public GameObject panelObject;
        public UIPanelType panelType;
        public UIPanelState state;
        public int priority;
        public bool isModal;
        public bool isPersistent;
        public List<string> dependencies = new List<string>();
        public Dictionary<string, object> data = new Dictionary<string, object>();
        public DateTime lastUpdated;
    }
    
    public enum UIPanelType
    {
        MainMenu,
        Gameplay,
        Settings,
        Social,
        Shop,
        Profile,
        Achievements,
        Leaderboard,
        Events,
        AR,
        Cloud,
        Accessibility,
        Subscription,
        HybridGameplay,
        LivingWorld,
        VoiceCommands,
        Custom
    }
    
    public enum UIPanelState
    {
        Hidden,
        Showing,
        Visible,
        Hiding,
        Disabled
    }
    
    [System.Serializable]
    public class UIAnimation
    {
        public string animationId;
        public string panelId;
        public AnimationType animationType;
        public float duration;
        public AnimationCurve curve;
        public Vector3 startPosition;
        public Vector3 endPosition;
        public float startAlpha;
        public float endAlpha;
        public bool isPlaying;
        public DateTime startTime;
    }
    
    public enum AnimationType
    {
        FadeIn,
        FadeOut,
        SlideIn,
        SlideOut,
        ScaleIn,
        ScaleOut,
        RotateIn,
        RotateOut,
        Custom
    }
    
    [System.Serializable]
    public class UITheme
    {
        public string themeId;
        public string themeName;
        public Color primaryColor;
        public Color secondaryColor;
        public Color accentColor;
        public Color backgroundColor;
        public Color textColor;
        public Color buttonColor;
        public Color highlightColor;
        public Font font;
        public int fontSize;
        public float spacing;
        public Dictionary<string, object> customProperties = new Dictionary<string, object>();
    }
    
    [System.Serializable]
    public class UILayout
    {
        public string layoutId;
        public string layoutName;
        public LayoutType layoutType;
        public Vector2 screenSize;
        public float scaleFactor;
        public bool isResponsive;
        public Dictionary<string, Vector2> elementPositions = new Dictionary<string, Vector2>();
        public Dictionary<string, Vector2> elementSizes = new Dictionary<string, Vector2>();
    }
    
    public enum LayoutType
    {
        Mobile,
        Tablet,
        Desktop,
        TV,
        AR,
        VR,
        Custom
    }
    
    [System.Serializable]
    public class UIEvent
    {
        public string eventId;
        public string panelId;
        public string elementId;
        public UIEventType eventType;
        public Dictionary<string, object> data;
        public DateTime timestamp;
    }
    
    public enum UIEventType
    {
        Click,
        Hover,
        Drag,
        Drop,
        Swipe,
        Pinch,
        VoiceCommand,
        Gesture,
        Custom
    }
    
    public class EnhancedUIManager : MonoBehaviour
    {
        [Header("UI Settings")]
        public bool enableUI = true;
        public bool enableAnimations = true;
        public bool enableThemes = true;
        public bool enableResponsiveDesign = true;
        public bool enableAccessibility = true;
        public bool enableVoiceControl = true;
        
        [Header("Animation Settings")]
        public float defaultAnimationDuration = 0.3f;
        public AnimationCurve defaultAnimationCurve = AnimationCurve.EaseInOut(0, 0, 1, 1);
        public bool enableAnimationQueue = true;
        public int maxConcurrentAnimations = 5;
        
        [Header("Theme Settings")]
        public string defaultTheme = "default";
        public bool enableThemeSwitching = true;
        public bool enableCustomThemes = true;
        public bool enableThemePersistence = true;
        
        [Header("Layout Settings")]
        public bool enableAutoLayout = true;
        public bool enableLayoutSwitching = true;
        public bool enableLayoutPersistence = true;
        public float layoutSwitchThreshold = 100f;
        
        [Header("Accessibility Settings")]
        public bool enableHighContrast = false;
        public bool enableLargeText = false;
        public bool enableScreenReader = true;
        public bool enableKeyboardNavigation = true;
        public bool enableVoiceNavigation = true;
        
        public static EnhancedUIManager Instance { get; private set; }
        
        private Dictionary<string, UIPanel> uiPanels = new Dictionary<string, UIPanel>();
        private Dictionary<string, UIAnimation> uiAnimations = new Dictionary<string, UIAnimation>();
        private Dictionary<string, UITheme> uiThemes = new Dictionary<string, UITheme>();
        private Dictionary<string, UILayout> uiLayouts = new Dictionary<string, UILayout>();
        private Dictionary<string, UIEvent> uiEvents = new Dictionary<string, UIEvent>();
        
        private UITheme currentTheme;
        private UILayout currentLayout;
        private List<string> panelStack = new List<string>();
        private List<string> animationQueue = new List<string>();
        
        private Coroutine animationCoroutine;
        private Coroutine layoutCoroutine;
        private Coroutine accessibilityCoroutine;
        
        // UI System References
        private Canvas mainCanvas;
        private GraphicRaycaster graphicRaycaster;
        private EventSystem eventSystem;
        private AudioSource audioSource;
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeEnhancedUI();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            InitializeUIComponents();
            LoadUIThemes();
            LoadUILayouts();
            StartUIServices();
        }
        
        private void InitializeEnhancedUI()
        {
            // Initialize main canvas
            mainCanvas = GetComponent<Canvas>();
            if (mainCanvas == null)
            {
                mainCanvas = gameObject.AddComponent<Canvas>();
            }
            
            mainCanvas.renderMode = RenderMode.ScreenSpaceOverlay;
            mainCanvas.sortingOrder = 0;
            
            // Initialize graphic raycaster
            graphicRaycaster = GetComponent<GraphicRaycaster>();
            if (graphicRaycaster == null)
            {
                graphicRaycaster = gameObject.AddComponent<GraphicRaycaster>();
            }
            
            // Initialize event system
            eventSystem = FindObjectOfType<EventSystem>();
            if (eventSystem == null)
            {
                var eventSystemObject = new GameObject("EventSystem");
                eventSystem = eventSystemObject.AddComponent<EventSystem>();
                eventSystemObject.AddComponent<StandaloneInputModule>();
            }
            
            // Initialize audio source
            audioSource = GetComponent<AudioSource>();
            if (audioSource == null)
            {
                audioSource = gameObject.AddComponent<AudioSource>();
            }
        }
        
        private void InitializeUIComponents()
        {
            // Initialize default theme
            CreateDefaultTheme();
            
            // Initialize default layout
            CreateDefaultLayout();
            
            // Initialize accessibility
            if (enableAccessibility)
            {
                InitializeAccessibility();
            }
        }
        
        private void CreateDefaultTheme()
        {
            var defaultTheme = new UITheme
            {
                themeId = "default",
                themeName = "Default Theme",
                primaryColor = new Color(0.2f, 0.6f, 1f, 1f),
                secondaryColor = new Color(0.8f, 0.8f, 0.8f, 1f),
                accentColor = new Color(1f, 0.6f, 0.2f, 1f),
                backgroundColor = new Color(0.95f, 0.95f, 0.95f, 1f),
                textColor = new Color(0.2f, 0.2f, 0.2f, 1f),
                buttonColor = new Color(0.3f, 0.7f, 1f, 1f),
                highlightColor = new Color(1f, 0.8f, 0.2f, 1f),
                fontSize = 14,
                spacing = 10f
            };
            
            uiThemes["default"] = defaultTheme;
            currentTheme = defaultTheme;
        }
        
        private void CreateDefaultLayout()
        {
            var defaultLayout = new UILayout
            {
                layoutId = "default",
                layoutName = "Default Layout",
                layoutType = LayoutType.Mobile,
                screenSize = new Vector2(Screen.width, Screen.height),
                scaleFactor = 1f,
                isResponsive = true
            };
            
            uiLayouts["default"] = defaultLayout;
            currentLayout = defaultLayout;
        }
        
        private void InitializeAccessibility()
        {
            // Initialize accessibility features
            if (enableHighContrast)
            {
                EnableHighContrast();
            }
            
            if (enableLargeText)
            {
                EnableLargeText();
            }
            
            if (enableScreenReader)
            {
                EnableScreenReader();
            }
            
            if (enableKeyboardNavigation)
            {
                EnableKeyboardNavigation();
            }
            
            if (enableVoiceNavigation)
            {
                EnableVoiceNavigation();
            }
        }
        
        private void LoadUIThemes()
        {
            // Load themes from resources or save data
            // This would load custom themes created by users
        }
        
        private void LoadUILayouts()
        {
            // Load layouts from resources or save data
            // This would load custom layouts for different devices
        }
        
        private void StartUIServices()
        {
            if (enableAnimations)
            {
                animationCoroutine = StartCoroutine(AnimationUpdateLoop());
            }
            
            if (enableResponsiveDesign)
            {
                layoutCoroutine = StartCoroutine(LayoutUpdateLoop());
            }
            
            if (enableAccessibility)
            {
                accessibilityCoroutine = StartCoroutine(AccessibilityUpdateLoop());
            }
        }
        
        private IEnumerator AnimationUpdateLoop()
        {
            while (enableAnimations)
            {
                UpdateAnimations();
                yield return new WaitForEndOfFrame();
            }
        }
        
        private IEnumerator LayoutUpdateLoop()
        {
            while (enableResponsiveDesign)
            {
                CheckLayoutChanges();
                yield return new WaitForSeconds(0.5f);
            }
        }
        
        private IEnumerator AccessibilityUpdateLoop()
        {
            while (enableAccessibility)
            {
                UpdateAccessibility();
                yield return new WaitForSeconds(1f);
            }
        }
        
        // Panel Management
        public UIPanel CreatePanel(string panelId, string panelName, UIPanelType panelType, GameObject panelPrefab, Transform parent = null)
        {
            if (uiPanels.ContainsKey(panelId))
            {
                Debug.LogWarning($"Panel {panelId} already exists");
                return uiPanels[panelId];
            }
            
            var panelObject = Instantiate(panelPrefab, parent ?? mainCanvas.transform);
            panelObject.name = panelName;
            
            var panel = new UIPanel
            {
                panelId = panelId,
                panelName = panelName,
                panelObject = panelObject,
                panelType = panelType,
                state = UIPanelState.Hidden,
                priority = 0,
                isModal = false,
                isPersistent = false,
                lastUpdated = DateTime.Now
            };
            
            uiPanels[panelId] = panel;
            
            // Apply current theme
            ApplyThemeToPanel(panel);
            
            // Hide panel initially
            SetPanelVisible(panelId, false);
            
            return panel;
        }
        
        public bool ShowPanel(string panelId, bool animated = true)
        {
            var panel = GetPanel(panelId);
            if (panel == null) return false;
            
            if (panel.state == UIPanelState.Visible) return true;
            
            panel.state = UIPanelState.Showing;
            panel.lastUpdated = DateTime.Now;
            
            // Add to panel stack
            if (!panelStack.Contains(panelId))
            {
                panelStack.Add(panelId);
            }
            
            // Show panel
            SetPanelVisible(panelId, true);
            
            // Animate if enabled
            if (animated && enableAnimations)
            {
                AnimatePanel(panelId, AnimationType.FadeIn);
            }
            
            // Notify other panels
            NotifyPanelShown(panelId);
            
            return true;
        }
        
        public bool HidePanel(string panelId, bool animated = true)
        {
            var panel = GetPanel(panelId);
            if (panel == null) return false;
            
            if (panel.state == UIPanelState.Hidden) return true;
            
            panel.state = UIPanelState.Hiding;
            panel.lastUpdated = DateTime.Now;
            
            // Remove from panel stack
            panelStack.Remove(panelId);
            
            // Animate if enabled
            if (animated && enableAnimations)
            {
                AnimatePanel(panelId, AnimationType.FadeOut, () => {
                    SetPanelVisible(panelId, false);
                    panel.state = UIPanelState.Hidden;
                });
            }
            else
            {
                SetPanelVisible(panelId, false);
                panel.state = UIPanelState.Hidden;
            }
            
            // Notify other panels
            NotifyPanelHidden(panelId);
            
            return true;
        }
        
        public bool TogglePanel(string panelId, bool animated = true)
        {
            var panel = GetPanel(panelId);
            if (panel == null) return false;
            
            if (panel.state == UIPanelState.Visible)
            {
                return HidePanel(panelId, animated);
            }
            else
            {
                return ShowPanel(panelId, animated);
            }
        }
        
        public UIPanel GetPanel(string panelId)
        {
            return uiPanels.ContainsKey(panelId) ? uiPanels[panelId] : null;
        }
        
        public List<UIPanel> GetPanelsByType(UIPanelType panelType)
        {
            return uiPanels.Values.Where(p => p.panelType == panelType).ToList();
        }
        
        public List<UIPanel> GetVisiblePanels()
        {
            return uiPanels.Values.Where(p => p.state == UIPanelState.Visible).ToList();
        }
        
        // Animation Management
        public void AnimatePanel(string panelId, AnimationType animationType, Action onComplete = null)
        {
            var panel = GetPanel(panelId);
            if (panel == null) return;
            
            var animation = new UIAnimation
            {
                animationId = Guid.NewGuid().ToString(),
                panelId = panelId,
                animationType = animationType,
                duration = defaultAnimationDuration,
                curve = defaultAnimationCurve,
                isPlaying = true,
                startTime = DateTime.Now
            };
            
            // Set animation properties based on type
            SetAnimationProperties(animation, panel);
            
            uiAnimations[animation.animationId] = animation;
            
            if (enableAnimationQueue)
            {
                animationQueue.Add(animation.animationId);
            }
            
            // Start animation coroutine
            StartCoroutine(PlayAnimation(animation, onComplete));
        }
        
        private void SetAnimationProperties(UIAnimation animation, UIPanel panel)
        {
            var rectTransform = panel.panelObject.GetComponent<RectTransform>();
            var canvasGroup = panel.panelObject.GetComponent<CanvasGroup>();
            
            switch (animation.animationType)
            {
                case AnimationType.FadeIn:
                    animation.startAlpha = 0f;
                    animation.endAlpha = 1f;
                    if (canvasGroup != null)
                    {
                        canvasGroup.alpha = animation.startAlpha;
                    }
                    break;
                case AnimationType.FadeOut:
                    animation.startAlpha = 1f;
                    animation.endAlpha = 0f;
                    if (canvasGroup != null)
                    {
                        canvasGroup.alpha = animation.startAlpha;
                    }
                    break;
                case AnimationType.SlideIn:
                    animation.startPosition = rectTransform.anchoredPosition + Vector2.up * Screen.height;
                    animation.endPosition = rectTransform.anchoredPosition;
                    rectTransform.anchoredPosition = animation.startPosition;
                    break;
                case AnimationType.SlideOut:
                    animation.startPosition = rectTransform.anchoredPosition;
                    animation.endPosition = rectTransform.anchoredPosition + Vector2.up * Screen.height;
                    break;
                case AnimationType.ScaleIn:
                    animation.startPosition = Vector3.zero;
                    animation.endPosition = Vector3.one;
                    rectTransform.localScale = animation.startPosition;
                    break;
                case AnimationType.ScaleOut:
                    animation.startPosition = Vector3.one;
                    animation.endPosition = Vector3.zero;
                    break;
            }
        }
        
        private IEnumerator PlayAnimation(UIAnimation animation, Action onComplete)
        {
            var panel = GetPanel(animation.panelId);
            if (panel == null) yield break;
            
            var rectTransform = panel.panelObject.GetComponent<RectTransform>();
            var canvasGroup = panel.panelObject.GetComponent<CanvasGroup>();
            
            var startTime = Time.time;
            var elapsed = 0f;
            
            while (elapsed < animation.duration)
            {
                elapsed = Time.time - startTime;
                var t = elapsed / animation.duration;
                var curveValue = animation.curve.Evaluate(t);
                
                // Apply animation based on type
                switch (animation.animationType)
                {
                    case AnimationType.FadeIn:
                    case AnimationType.FadeOut:
                        if (canvasGroup != null)
                        {
                            canvasGroup.alpha = Mathf.Lerp(animation.startAlpha, animation.endAlpha, curveValue);
                        }
                        break;
                    case AnimationType.SlideIn:
                    case AnimationType.SlideOut:
                        rectTransform.anchoredPosition = Vector2.Lerp(animation.startPosition, animation.endPosition, curveValue);
                        break;
                    case AnimationType.ScaleIn:
                    case AnimationType.ScaleOut:
                        rectTransform.localScale = Vector3.Lerp(animation.startPosition, animation.endPosition, curveValue);
                        break;
                }
                
                yield return null;
            }
            
            // Complete animation
            animation.isPlaying = false;
            
            // Remove from queue
            if (animationQueue.Contains(animation.animationId))
            {
                animationQueue.Remove(animation.animationId);
            }
            
            // Call completion callback
            onComplete?.Invoke();
        }
        
        private void UpdateAnimations()
        {
            // Update running animations
            var runningAnimations = uiAnimations.Values.Where(a => a.isPlaying).ToList();
            foreach (var animation in runningAnimations)
            {
                var elapsed = (float)(DateTime.Now - animation.startTime).TotalSeconds;
                if (elapsed >= animation.duration)
                {
                    animation.isPlaying = false;
                }
            }
        }
        
        // Theme Management
        public void SetTheme(string themeId)
        {
            if (!uiThemes.ContainsKey(themeId)) return;
            
            currentTheme = uiThemes[themeId];
            
            // Apply theme to all panels
            foreach (var panel in uiPanels.Values)
            {
                ApplyThemeToPanel(panel);
            }
            
            // Save theme preference
            if (enableThemePersistence)
            {
                PlayerPrefs.SetString("UITheme", themeId);
                PlayerPrefs.Save();
            }
        }
        
        public void CreateTheme(string themeId, string themeName, Color primaryColor, Color secondaryColor, Color accentColor)
        {
            var theme = new UITheme
            {
                themeId = themeId,
                themeName = themeName,
                primaryColor = primaryColor,
                secondaryColor = secondaryColor,
                accentColor = accentColor,
                backgroundColor = currentTheme.backgroundColor,
                textColor = currentTheme.textColor,
                buttonColor = currentTheme.buttonColor,
                highlightColor = currentTheme.highlightColor,
                fontSize = currentTheme.fontSize,
                spacing = currentTheme.spacing
            };
            
            uiThemes[themeId] = theme;
        }
        
        private void ApplyThemeToPanel(UIPanel panel)
        {
            if (panel.panelObject == null) return;
            
            // Apply theme to all UI elements in the panel
            var buttons = panel.panelObject.GetComponentsInChildren<Button>();
            foreach (var button in buttons)
            {
                var colors = button.colors;
                colors.normalColor = currentTheme.buttonColor;
                colors.highlightedColor = currentTheme.highlightColor;
                button.colors = colors;
            }
            
            var texts = panel.panelObject.GetComponentsInChildren<TextMeshProUGUI>();
            foreach (var text in texts)
            {
                text.color = currentTheme.textColor;
                text.fontSize = currentTheme.fontSize;
            }
            
            var images = panel.panelObject.GetComponentsInChildren<Image>();
            foreach (var image in images)
            {
                if (image.name.Contains("Background"))
                {
                    image.color = currentTheme.backgroundColor;
                }
            }
        }
        
        // Layout Management
        public void SetLayout(string layoutId)
        {
            if (!uiLayouts.ContainsKey(layoutId)) return;
            
            currentLayout = uiLayouts[layoutId];
            
            // Apply layout to all panels
            foreach (var panel in uiPanels.Values)
            {
                ApplyLayoutToPanel(panel);
            }
            
            // Save layout preference
            if (enableLayoutPersistence)
            {
                PlayerPrefs.SetString("UILayout", layoutId);
                PlayerPrefs.Save();
            }
        }
        
        private void CheckLayoutChanges()
        {
            var screenSize = new Vector2(Screen.width, Screen.height);
            var sizeDifference = Vector2.Distance(screenSize, currentLayout.screenSize);
            
            if (sizeDifference > layoutSwitchThreshold)
            {
                // Determine appropriate layout based on screen size
                var newLayoutId = DetermineLayoutForScreenSize(screenSize);
                if (newLayoutId != currentLayout.layoutId)
                {
                    SetLayout(newLayoutId);
                }
            }
        }
        
        private string DetermineLayoutForScreenSize(Vector2 screenSize)
        {
            var aspectRatio = screenSize.x / screenSize.y;
            
            if (screenSize.x < 768f)
            {
                return "mobile";
            }
            else if (screenSize.x < 1024f)
            {
                return "tablet";
            }
            else
            {
                return "desktop";
            }
        }
        
        private void ApplyLayoutToPanel(UIPanel panel)
        {
            if (panel.panelObject == null) return;
            
            var rectTransform = panel.panelObject.GetComponent<RectTransform>();
            if (rectTransform == null) return;
            
            // Apply layout-specific positioning and sizing
            if (currentLayout.elementPositions.ContainsKey(panel.panelId))
            {
                rectTransform.anchoredPosition = currentLayout.elementPositions[panel.panelId];
            }
            
            if (currentLayout.elementSizes.ContainsKey(panel.panelId))
            {
                rectTransform.sizeDelta = currentLayout.elementSizes[panel.panelId];
            }
        }
        
        // Accessibility Management
        private void EnableHighContrast()
        {
            // Enable high contrast mode
            var highContrastTheme = new UITheme
            {
                themeId = "high_contrast",
                themeName = "High Contrast",
                primaryColor = Color.white,
                secondaryColor = Color.black,
                accentColor = Color.yellow,
                backgroundColor = Color.black,
                textColor = Color.white,
                buttonColor = Color.white,
                highlightColor = Color.yellow
            };
            
            uiThemes["high_contrast"] = highContrastTheme;
            SetTheme("high_contrast");
        }
        
        private void EnableLargeText()
        {
            // Enable large text mode
            currentTheme.fontSize = Mathf.RoundToInt(currentTheme.fontSize * 1.5f);
            
            // Apply to all panels
            foreach (var panel in uiPanels.Values)
            {
                ApplyThemeToPanel(panel);
            }
        }
        
        private void EnableScreenReader()
        {
            // Enable screen reader support
            // This would integrate with the VoiceCommandManager
        }
        
        private void EnableKeyboardNavigation()
        {
            // Enable keyboard navigation
            // This would set up tab navigation and keyboard shortcuts
        }
        
        private void EnableVoiceNavigation()
        {
            // Enable voice navigation
            // This would integrate with the VoiceCommandManager
        }
        
        private void UpdateAccessibility()
        {
            // Update accessibility features
            // This would check for accessibility changes and apply them
        }
        
        // Event Management
        public void RegisterUIEvent(string panelId, string elementId, UIEventType eventType, Dictionary<string, object> data = null)
        {
            var uiEvent = new UIEvent
            {
                eventId = Guid.NewGuid().ToString(),
                panelId = panelId,
                elementId = elementId,
                eventType = eventType,
                data = data ?? new Dictionary<string, object>(),
                timestamp = DateTime.Now
            };
            
            uiEvents[uiEvent.eventId] = uiEvent;
            
            // Process event
            ProcessUIEvent(uiEvent);
        }
        
        private void ProcessUIEvent(UIEvent uiEvent)
        {
            // Process UI event based on type
            switch (uiEvent.eventType)
            {
                case UIEventType.Click:
                    ProcessClickEvent(uiEvent);
                    break;
                case UIEventType.Hover:
                    ProcessHoverEvent(uiEvent);
                    break;
                case UIEventType.VoiceCommand:
                    ProcessVoiceCommandEvent(uiEvent);
                    break;
                case UIEventType.Gesture:
                    ProcessGestureEvent(uiEvent);
                    break;
            }
        }
        
        private void ProcessClickEvent(UIEvent uiEvent)
        {
            // Process click event
            Debug.Log($"Click event on {uiEvent.panelId}.{uiEvent.elementId}");
        }
        
        private void ProcessHoverEvent(UIEvent uiEvent)
        {
            // Process hover event
            Debug.Log($"Hover event on {uiEvent.panelId}.{uiEvent.elementId}");
        }
        
        private void ProcessVoiceCommandEvent(UIEvent uiEvent)
        {
            // Process voice command event
            Debug.Log($"Voice command event on {uiEvent.panelId}.{uiEvent.elementId}");
        }
        
        private void ProcessGestureEvent(UIEvent uiEvent)
        {
            // Process gesture event
            Debug.Log($"Gesture event on {uiEvent.panelId}.{uiEvent.elementId}");
        }
        
        // Utility Methods
        private void SetPanelVisible(string panelId, bool visible)
        {
            var panel = GetPanel(panelId);
            if (panel == null) return;
            
            panel.panelObject.SetActive(visible);
        }
        
        private void NotifyPanelShown(string panelId)
        {
            // Notify other systems that a panel was shown
            Debug.Log($"Panel {panelId} shown");
        }
        
        private void NotifyPanelHidden(string panelId)
        {
            // Notify other systems that a panel was hidden
            Debug.Log($"Panel {panelId} hidden");
        }
        
        public Dictionary<string, object> GetUIAnalytics()
        {
            return new Dictionary<string, object>
            {
                {"ui_enabled", enableUI},
                {"animations_enabled", enableAnimations},
                {"themes_enabled", enableThemes},
                {"responsive_design_enabled", enableResponsiveDesign},
                {"accessibility_enabled", enableAccessibility},
                {"voice_control_enabled", enableVoiceControl},
                {"total_panels", uiPanels.Count},
                {"visible_panels", uiPanels.Count(p => p.Value.state == UIPanelState.Visible)},
                {"total_animations", uiAnimations.Count},
                {"running_animations", uiAnimations.Count(a => a.Value.isPlaying)},
                {"total_themes", uiThemes.Count},
                {"current_theme", currentTheme?.themeId ?? "none"},
                {"total_layouts", uiLayouts.Count},
                {"current_layout", currentLayout?.layoutId ?? "none"},
                {"total_events", uiEvents.Count}
            };
        }
        
        void OnDestroy()
        {
            if (animationCoroutine != null)
            {
                StopCoroutine(animationCoroutine);
            }
            if (layoutCoroutine != null)
            {
                StopCoroutine(layoutCoroutine);
            }
            if (accessibilityCoroutine != null)
            {
                StopCoroutine(accessibilityCoroutine);
            }
        }
    }
}