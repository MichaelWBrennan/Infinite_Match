using UnityEngine;
using UnityEngine.UI;
using Evergreen.Core;

namespace Evergreen.UI
{
    /// <summary>
    /// Unified Navigation UI Component
    /// Provides consistent navigation buttons across all scenes
    /// Can be easily added to any scene for complete navigation coverage
    /// </summary>
    public class UnifiedNavigationUI : MonoBehaviour
    {
        [Header("Navigation Buttons")]
        [SerializeField] private Button mainMenuButton;
        [SerializeField] private Button gameplayButton;
        [SerializeField] private Button settingsButton;
        [SerializeField] private Button shopButton;
        [SerializeField] private Button socialButton;
        [SerializeField] private Button eventsButton;
        [SerializeField] private Button collectionsButton;
        
        [Header("UI Configuration")]
        [SerializeField] private bool showCurrentSceneButton = false;
        [SerializeField] private bool enableButtonSounds = true;
        [SerializeField] private bool enableHapticFeedback = true;
        
        [Header("Visual Settings")]
        [SerializeField] private Color buttonNormalColor = new Color(0.2f, 0.5f, 1f, 0.85f);
        [SerializeField] private Color buttonHoverColor = new Color(0.3f, 0.6f, 1f, 1f);
        [SerializeField] private Color buttonPressedColor = new Color(0.1f, 0.4f, 0.9f, 1f);
        
        private string _currentScene;
        private AudioSource _audioSource;
        
        void Start()
        {
            InitializeNavigation();
            SetupButtonListeners();
            ApplyVisualSettings();
        }
        
        private void InitializeNavigation()
        {
            _currentScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene().name;
            
            // Get or create audio source
            _audioSource = GetComponent<AudioSource>();
            if (_audioSource == null)
            {
                _audioSource = gameObject.AddComponent<AudioSource>();
            }
            
            // Hide current scene button if configured
            if (!showCurrentSceneButton)
            {
                HideCurrentSceneButton();
            }
        }
        
        private void SetupButtonListeners()
        {
            // Main Menu Button
            if (mainMenuButton != null)
            {
                mainMenuButton.onClick.AddListener(() => NavigateToScene("MainMenu"));
            }
            
            // Gameplay Button
            if (gameplayButton != null)
            {
                gameplayButton.onClick.AddListener(() => NavigateToScene("Gameplay"));
            }
            
            // Settings Button
            if (settingsButton != null)
            {
                settingsButton.onClick.AddListener(() => NavigateToScene("Settings"));
            }
            
            // Shop Button
            if (shopButton != null)
            {
                shopButton.onClick.AddListener(() => NavigateToScene("Shop"));
            }
            
            // Social Button
            if (socialButton != null)
            {
                socialButton.onClick.AddListener(() => NavigateToScene("Social"));
            }
            
            // Events Button
            if (eventsButton != null)
            {
                eventsButton.onClick.AddListener(() => NavigateToScene("Events"));
            }
            
            // Collections Button
            if (collectionsButton != null)
            {
                collectionsButton.onClick.AddListener(() => NavigateToScene("Collections"));
            }
        }
        
        private void ApplyVisualSettings()
        {
            var buttons = new Button[] { mainMenuButton, gameplayButton, settingsButton, shopButton, socialButton, eventsButton, collectionsButton };
            
            foreach (var button in buttons)
            {
                if (button != null)
                {
                    var colors = button.colors;
                    colors.normalColor = buttonNormalColor;
                    colors.highlightedColor = buttonHoverColor;
                    colors.pressedColor = buttonPressedColor;
                    button.colors = colors;
                }
            }
        }
        
        private void HideCurrentSceneButton()
        {
            switch (_currentScene)
            {
                case "MainMenu":
                    if (mainMenuButton != null) mainMenuButton.gameObject.SetActive(false);
                    break;
                case "Gameplay":
                    if (gameplayButton != null) gameplayButton.gameObject.SetActive(false);
                    break;
                case "Settings":
                    if (settingsButton != null) settingsButton.gameObject.SetActive(false);
                    break;
                case "Shop":
                    if (shopButton != null) shopButton.gameObject.SetActive(false);
                    break;
                case "Social":
                    if (socialButton != null) socialButton.gameObject.SetActive(false);
                    break;
                case "Events":
                    if (eventsButton != null) eventsButton.gameObject.SetActive(false);
                    break;
                case "Collections":
                    if (collectionsButton != null) collectionsButton.gameObject.SetActive(false);
                    break;
            }
        }
        
        private void NavigateToScene(string sceneName)
        {
            try
            {
                // Play button sound
                if (enableButtonSounds)
                {
                    PlayButtonSound();
                }
                
                // Haptic feedback for mobile
                if (enableHapticFeedback && Application.isMobilePlatform)
                {
                    Handheld.Vibrate();
                }
                
                // Navigate using SceneManager
                if (SceneManager.Instance != null)
                {
                    SceneManager.Instance.LoadScene(sceneName);
                }
                else
                {
                    // Fallback to Unity's SceneManager
                    UnityEngine.SceneManagement.SceneManager.LoadScene(sceneName);
                }
                
                Logger.Info($"Navigating to {sceneName}", "UnifiedNavigation");
            }
            catch (System.Exception e)
            {
                Logger.LogException(e, "UnifiedNavigation");
            }
        }
        
        private void PlayButtonSound()
        {
            // Play a simple button click sound
            // You can replace this with your own audio clip
            if (_audioSource != null)
            {
                _audioSource.pitch = Random.Range(0.9f, 1.1f);
                _audioSource.Play();
            }
        }
        
        /// <summary>
        /// Create navigation buttons programmatically
        /// </summary>
        public void CreateNavigationButtons(Transform parent, Vector2 position, Vector2 size)
        {
            CreateButton(parent, "MainMenu", position, size, () => NavigateToScene("MainMenu"));
            CreateButton(parent, "Gameplay", position + Vector2.up * 60, size, () => NavigateToScene("Gameplay"));
            CreateButton(parent, "Settings", position + Vector2.up * 120, size, () => NavigateToScene("Settings"));
            CreateButton(parent, "Shop", position + Vector2.up * 180, size, () => NavigateToScene("Shop"));
            CreateButton(parent, "Social", position + Vector2.up * 240, size, () => NavigateToScene("Social"));
            CreateButton(parent, "Events", position + Vector2.up * 300, size, () => NavigateToScene("Events"));
            CreateButton(parent, "Collections", position + Vector2.up * 360, size, () => NavigateToScene("Collections"));
        }
        
        private void CreateButton(Transform parent, string name, Vector2 position, Vector2 size, UnityEngine.Events.UnityAction onClick)
        {
            var buttonGO = new GameObject(name + "Button");
            buttonGO.transform.SetParent(parent, false);
            
            var rectTransform = buttonGO.AddComponent<RectTransform>();
            rectTransform.anchoredPosition = position;
            rectTransform.sizeDelta = size;
            
            var image = buttonGO.AddComponent<Image>();
            image.color = buttonNormalColor;
            
            var button = buttonGO.AddComponent<Button>();
            button.onClick.AddListener(onClick);
            
            // Add text
            var textGO = new GameObject("Text");
            textGO.transform.SetParent(buttonGO.transform, false);
            
            var textRect = textGO.AddComponent<RectTransform>();
            textRect.anchorMin = Vector2.zero;
            textRect.anchorMax = Vector2.one;
            textRect.offsetMin = textRect.offsetMax = Vector2.zero;
            
            var text = textGO.AddComponent<Text>();
            text.text = name;
            text.alignment = TextAnchor.MiddleCenter;
            text.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
            text.color = Color.white;
            text.fontSize = 14;
        }
        
        /// <summary>
        /// Show or hide specific navigation buttons
        /// </summary>
        public void SetButtonVisibility(string buttonName, bool visible)
        {
            Button targetButton = null;
            
            switch (buttonName.ToLower())
            {
                case "mainmenu":
                    targetButton = mainMenuButton;
                    break;
                case "gameplay":
                    targetButton = gameplayButton;
                    break;
                case "settings":
                    targetButton = settingsButton;
                    break;
                case "shop":
                    targetButton = shopButton;
                    break;
                case "social":
                    targetButton = socialButton;
                    break;
                case "events":
                    targetButton = eventsButton;
                    break;
                case "collections":
                    targetButton = collectionsButton;
                    break;
            }
            
            if (targetButton != null)
            {
                targetButton.gameObject.SetActive(visible);
            }
        }
        
        /// <summary>
        /// Enable or disable all navigation buttons
        /// </summary>
        public void SetAllButtonsEnabled(bool enabled)
        {
            var buttons = new Button[] { mainMenuButton, gameplayButton, settingsButton, shopButton, socialButton, eventsButton, collectionsButton };
            
            foreach (var button in buttons)
            {
                if (button != null)
                {
                    button.interactable = enabled;
                }
            }
        }
        
        /// <summary>
        /// Get the current scene name
        /// </summary>
        public string GetCurrentScene()
        {
            return _currentScene;
        }
        
        void OnDestroy()
        {
            // Clean up button listeners
            if (mainMenuButton != null)
            {
                mainMenuButton.onClick.RemoveAllListeners();
            }
            
            if (gameplayButton != null)
            {
                gameplayButton.onClick.RemoveAllListeners();
            }
            
            if (settingsButton != null)
            {
                settingsButton.onClick.RemoveAllListeners();
            }
            
            if (shopButton != null)
            {
                shopButton.onClick.RemoveAllListeners();
            }
            
            if (socialButton != null)
            {
                socialButton.onClick.RemoveAllListeners();
            }
            
            if (eventsButton != null)
            {
                eventsButton.onClick.RemoveAllListeners();
            }
            
            if (collectionsButton != null)
            {
                collectionsButton.onClick.RemoveAllListeners();
            }
        }
    }
}