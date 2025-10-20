using UnityEngine;
using UnityEngine.UI;
using Evergreen.Core;

namespace Evergreen.UI
{
    /// <summary>
    /// Scene Navigation Enforcer
    /// Automatically ensures all scenes have navigation buttons
    /// Can be added to any scene to guarantee navigation coverage
    /// </summary>
    public class SceneNavigationEnforcer : MonoBehaviour
    {
        [Header("Auto-Creation Settings")]
        [SerializeField] private bool autoCreateNavigation = true;
        [SerializeField] private bool createOnAwake = true;
        [SerializeField] private Vector2 navigationPosition = new Vector2(10, 10);
        [SerializeField] private Vector2 buttonSize = new Vector2(100, 30);
        [SerializeField] private float buttonSpacing = 35f;
        
        [Header("Navigation Configuration")]
        [SerializeField] private bool showMainMenu = true;
        [SerializeField] private bool showGameplay = true;
        [SerializeField] private bool showSettings = true;
        [SerializeField] private bool showShop = true;
        [SerializeField] private bool showSocial = true;
        [SerializeField] private bool showEvents = true;
        [SerializeField] private bool showCollections = true;
        
        private string _currentScene;
        private Canvas _canvas;
        private GameObject _navigationPanel;
        
        void Awake()
        {
            if (createOnAwake)
            {
                EnsureNavigationExists();
            }
        }
        
        void Start()
        {
            _currentScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene().name;
            
            if (autoCreateNavigation)
            {
                EnsureNavigationExists();
            }
        }
        
        /// <summary>
        /// Ensure navigation exists in this scene
        /// </summary>
        public void EnsureNavigationExists()
        {
            // Check if navigation already exists
            if (FindExistingNavigation())
            {
                return;
            }
            
            // Create navigation if it doesn't exist
            CreateNavigationPanel();
        }
        
        private bool FindExistingNavigation()
        {
            // Look for existing navigation components
            var existingNavigation = FindObjectOfType<UnifiedNavigationUI>();
            if (existingNavigation != null)
            {
                return true;
            }
            
            // Look for existing navigation buttons
            var navigationButtons = GameObject.FindGameObjectsWithTag("NavigationButton");
            if (navigationButtons.Length > 0)
            {
                return true;
            }
            
            return false;
        }
        
        private void CreateNavigationPanel()
        {
            // Ensure we have a canvas
            EnsureCanvas();
            
            // Create navigation panel
            _navigationPanel = new GameObject("NavigationPanel");
            _navigationPanel.transform.SetParent(_canvas.transform, false);
            
            var rectTransform = _navigationPanel.AddComponent<RectTransform>();
            rectTransform.anchorMin = new Vector2(0, 1);
            rectTransform.anchorMax = new Vector2(0, 1);
            rectTransform.anchoredPosition = navigationPosition;
            rectTransform.sizeDelta = new Vector2(buttonSize.x, buttonSize.y * 7 + buttonSpacing * 6);
            
            // Add background
            var image = _navigationPanel.AddComponent<Image>();
            image.color = new Color(0, 0, 0, 0.5f);
            
            // Add navigation component
            var navigationUI = _navigationPanel.AddComponent<UnifiedNavigationUI>();
            
            // Create individual buttons
            CreateNavigationButtons();
        }
        
        private void EnsureCanvas()
        {
            _canvas = FindObjectOfType<Canvas>();
            if (_canvas == null)
            {
                var canvasGO = new GameObject("Canvas");
                _canvas = canvasGO.AddComponent<Canvas>();
                _canvas.renderMode = RenderMode.ScreenSpaceOverlay;
                canvasGO.AddComponent<CanvasScaler>();
                canvasGO.AddComponent<GraphicRaycaster>();
            }
        }
        
        private void CreateNavigationButtons()
        {
            if (_navigationPanel == null) return;
            
            var navigationUI = _navigationPanel.GetComponent<UnifiedNavigationUI>();
            if (navigationUI == null) return;
            
            // Create buttons based on configuration
            int buttonIndex = 0;
            
            if (showMainMenu && _currentScene != "MainMenu")
            {
                CreateNavigationButton("MainMenu", buttonIndex++, () => NavigateToScene("MainMenu"));
            }
            
            if (showGameplay && _currentScene != "Gameplay")
            {
                CreateNavigationButton("Gameplay", buttonIndex++, () => NavigateToScene("Gameplay"));
            }
            
            if (showSettings && _currentScene != "Settings")
            {
                CreateNavigationButton("Settings", buttonIndex++, () => NavigateToScene("Settings"));
            }
            
            if (showShop && _currentScene != "Shop")
            {
                CreateNavigationButton("Shop", buttonIndex++, () => NavigateToScene("Shop"));
            }
            
            if (showSocial && _currentScene != "Social")
            {
                CreateNavigationButton("Social", buttonIndex++, () => NavigateToScene("Social"));
            }
            
            if (showEvents && _currentScene != "Events")
            {
                CreateNavigationButton("Events", buttonIndex++, () => NavigateToScene("Events"));
            }
            
            if (showCollections && _currentScene != "Collections")
            {
                CreateNavigationButton("Collections", buttonIndex++, () => NavigateToScene("Collections"));
            }
        }
        
        private void CreateNavigationButton(string sceneName, int index, System.Action onClick)
        {
            var buttonGO = new GameObject(sceneName + "Button");
            buttonGO.transform.SetParent(_navigationPanel.transform, false);
            buttonGO.tag = "NavigationButton";
            
            var rectTransform = buttonGO.AddComponent<RectTransform>();
            rectTransform.anchorMin = new Vector2(0, 1);
            rectTransform.anchorMax = new Vector2(0, 1);
            rectTransform.anchoredPosition = new Vector2(0, -index * buttonSpacing);
            rectTransform.sizeDelta = buttonSize;
            
            var image = buttonGO.AddComponent<Image>();
            image.color = new Color(0.2f, 0.5f, 1f, 0.85f);
            
            var button = buttonGO.AddComponent<Button>();
            button.onClick.AddListener(() => onClick());
            
            // Add text
            var textGO = new GameObject("Text");
            textGO.transform.SetParent(buttonGO.transform, false);
            
            var textRect = textGO.AddComponent<RectTransform>();
            textRect.anchorMin = Vector2.zero;
            textRect.anchorMax = Vector2.one;
            textRect.offsetMin = textRect.offsetMax = Vector2.zero;
            
            var text = textGO.AddComponent<Text>();
            text.text = sceneName;
            text.alignment = TextAnchor.MiddleCenter;
            text.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
            text.color = Color.white;
            text.fontSize = 12;
        }
        
        private void NavigateToScene(string sceneName)
        {
            try
            {
                if (SceneManager.Instance != null)
                {
                    SceneManager.Instance.LoadScene(sceneName);
                }
                else
                {
                    UnityEngine.SceneManagement.SceneManager.LoadScene(sceneName);
                }
                
                Logger.Info($"Navigating to {sceneName}", "SceneNavigationEnforcer");
            }
            catch (System.Exception e)
            {
                Logger.LogException(e, "SceneNavigationEnforcer");
            }
        }
        
        /// <summary>
        /// Force recreate navigation (useful for testing)
        /// </summary>
        public void RecreateNavigation()
        {
            if (_navigationPanel != null)
            {
                DestroyImmediate(_navigationPanel);
            }
            
            CreateNavigationPanel();
        }
        
        /// <summary>
        /// Remove navigation from this scene
        /// </summary>
        public void RemoveNavigation()
        {
            if (_navigationPanel != null)
            {
                DestroyImmediate(_navigationPanel);
            }
            
            // Also remove any navigation buttons with the tag
            var navigationButtons = GameObject.FindGameObjectsWithTag("NavigationButton");
            foreach (var button in navigationButtons)
            {
                DestroyImmediate(button);
            }
        }
        
        /// <summary>
        /// Check if this scene has navigation
        /// </summary>
        public bool HasNavigation()
        {
            return FindExistingNavigation();
        }
        
        /// <summary>
        /// Get the current scene name
        /// </summary>
        public string GetCurrentScene()
        {
            return _currentScene;
        }
    }
}