using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections;
using Evergreen.UI;
using Evergreen.HybridGameplay;

namespace Evergreen.UI
{
    /// <summary>
    /// Complete Royal Match Scene Setup
    /// Automatically sets up the entire Royal Match UI system
    /// </summary>
    public class RoyalMatchSceneSetup : MonoBehaviour
    {
        [Header("Auto Setup")]
        [SerializeField] private bool setupOnStart = true;
        [SerializeField] private bool enableAllFeatures = true;
        [SerializeField] private bool showDebugInfo = true;
        
        [Header("Royal Match Settings")]
        [SerializeField] private bool createUIPanels = true;
        [SerializeField] private bool applyRoyalMatchStyling = true;
        [SerializeField] private bool setupButtonAnimations = true;
        
        private RoyalMatchUIManager uiManager;
        private UIFeatureEnabler featureEnabler;
        private HybridGameplayManager hybridManager;
        
        void Start()
        {
            if (setupOnStart)
            {
                StartCoroutine(SetupRoyalMatchScene());
            }
        }
        
        [ContextMenu("Setup Royal Match Scene")]
        public void SetupRoyalMatchSceneManual()
        {
            StartCoroutine(SetupRoyalMatchScene());
        }
        
        private IEnumerator SetupRoyalMatchScene()
        {
            Debug.Log("👑 Starting Royal Match Scene Setup...");
            
            // Step 1: Create UI Structure
            yield return StartCoroutine(CreateUIStructure());
            
            // Step 2: Setup UI Manager
            yield return StartCoroutine(SetupUIManager());
            
            // Step 3: Setup Feature Enabler
            yield return StartCoroutine(SetupFeatureEnabler());
            
            // Step 4: Setup Hybrid Gameplay
            yield return StartCoroutine(SetupHybridGameplay());
            
            // Step 5: Final Configuration
            yield return StartCoroutine(FinalConfiguration());
            
            Debug.Log("🎉 Royal Match Scene Setup Complete!");
        }
        
        private IEnumerator CreateUIStructure()
        {
            Debug.Log("📱 Creating UI Structure...");
            
            // Create main UI canvas
            var mainCanvas = CreateMainCanvas();
            yield return new WaitForEndOfFrame();
            
            // Create all UI panels
            CreateMainMenuPanel(mainCanvas);
            yield return new WaitForEndOfFrame();
            
            CreateGameplayPanel(mainCanvas);
            yield return new WaitForEndOfFrame();
            
            CreateShopPanel(mainCanvas);
            yield return new WaitForEndOfFrame();
            
            CreateSettingsPanel(mainCanvas);
            yield return new WaitForEndOfFrame();
            
            CreatePausePanel(mainCanvas);
            yield return new WaitForEndOfFrame();
            
            CreateLevelCompletePanel(mainCanvas);
            yield return new WaitForEndOfFrame();
            
            CreateGameOverPanel(mainCanvas);
            yield return new WaitForEndOfFrame();
            
            CreateBoostersPanel(mainCanvas);
            yield return new WaitForEndOfFrame();
            
            CreateDailyRewardsPanel(mainCanvas);
            yield return new WaitForEndOfFrame();
            
            CreateEventsPanel(mainCanvas);
            yield return new WaitForEndOfFrame();
            
            CreateLeaderboardPanel(mainCanvas);
            yield return new WaitForEndOfFrame();
            
            CreateProfilePanel(mainCanvas);
            yield return new WaitForEndOfFrame();
            
            Debug.Log("✅ UI Structure created successfully!");
        }
        
        private IEnumerator SetupUIManager()
        {
            Debug.Log("🎮 Setting up UI Manager...");
            
            // Create UI Manager GameObject
            var uiManagerGO = new GameObject("RoyalMatchUIManager");
            uiManager = uiManagerGO.AddComponent<RoyalMatchUIManager>();
            
            // Find all UI panels and assign them
            AssignUIPanels();
            
            // Find all UI elements and assign them
            AssignUIElements();
            
            yield return new WaitForEndOfFrame();
            
            Debug.Log("✅ UI Manager setup complete!");
        }
        
        private IEnumerator SetupFeatureEnabler()
        {
            Debug.Log("⚙️ Setting up Feature Enabler...");
            
            // Create Feature Enabler GameObject
            var featureEnablerGO = new GameObject("UIFeatureEnabler");
            featureEnabler = featureEnablerGO.AddComponent<UIFeatureEnabler>();
            
            // Configure feature enabler
            featureEnabler.enableOnStart = true;
            featureEnabler.enableAllFeatures = true;
            featureEnabler.showDebugInfo = showDebugInfo;
            featureEnabler.enableRPG = true;
            featureEnabler.enableRacing = true;
            featureEnabler.enableStrategy = true;
            featureEnabler.enableHybridModes = true;
            
            yield return new WaitForEndOfFrame();
            
            Debug.Log("✅ Feature Enabler setup complete!");
        }
        
        private IEnumerator SetupHybridGameplay()
        {
            Debug.Log("🎯 Setting up Hybrid Gameplay...");
            
            // Create Hybrid Gameplay Manager if it doesn't exist
            hybridManager = FindObjectOfType<HybridGameplayManager>();
            if (hybridManager == null)
            {
                var hybridManagerGO = new GameObject("HybridGameplayManager");
                hybridManager = hybridManagerGO.AddComponent<HybridGameplayManager>();
            }
            
            // Enable all features
            if (enableAllFeatures)
            {
                hybridManager.EnableFeature(FeatureType.RPG, true);
                hybridManager.EnableFeature(FeatureType.Racing, true);
                hybridManager.EnableFeature(FeatureType.Strategy, true);
                hybridManager.EnableFeature(FeatureType.HybridModes, true);
            }
            
            yield return new WaitForEndOfFrame();
            
            Debug.Log("✅ Hybrid Gameplay setup complete!");
        }
        
        private IEnumerator FinalConfiguration()
        {
            Debug.Log("🔧 Final configuration...");
            
            // Enable all features
            if (uiManager != null)
            {
                uiManager.EnableAllFeatures();
            }
            
            // Show main menu
            if (uiManager != null)
            {
                uiManager.ShowMainMenu();
            }
            
            // Check status
            if (showDebugInfo)
            {
                yield return new WaitForSeconds(1f);
                if (uiManager != null)
                {
                    uiManager.CheckUIStatus();
                }
            }
            
            Debug.Log("✅ Final configuration complete!");
        }
        
        private GameObject CreateMainCanvas()
        {
            var canvasGO = new GameObject("RoyalMatchCanvas");
            canvasGO.transform.SetParent(transform);
            
            var canvas = canvasGO.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 0;
            
            var scaler = canvasGO.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1080, 1920); // Royal Match portrait
            scaler.screenMatchMode = CanvasScaler.ScreenMatchMode.MatchWidthOrHeight;
            scaler.matchWidthOrHeight = 0.5f;
            
            canvasGO.AddComponent<GraphicRaycaster>();
            
            return canvasGO;
        }
        
        private void CreateMainMenuPanel(GameObject parent)
        {
            var panel = CreatePanel("MainMenuPanel", parent);
            
            // Background
            var background = CreateImage("Background", panel);
            SetRectTransform(background.GetComponent<RectTransform>(), Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            background.color = new Color(0.2f, 0.4f, 0.8f, 1f); // Royal blue
            
            // Title
            var title = CreateText("Title", panel, "ROYAL MATCH");
            title.fontSize = 72;
            title.color = Color.white;
            title.fontStyle = FontStyles.Bold;
            SetRectTransform(title.GetComponent<RectTransform>(), new Vector2(0.1f, 0.7f), new Vector2(0.9f, 0.9f), Vector2.zero, Vector2.zero);
            
            // Play Button
            var playButton = CreateButton("PlayButton", panel, "PLAY");
            SetRectTransform(playButton.GetComponent<RectTransform>(), new Vector2(0.2f, 0.4f), new Vector2(0.8f, 0.6f), Vector2.zero, Vector2.zero);
            ApplyRoyalMatchButtonStyle(playButton);
            
            // Shop Button
            var shopButton = CreateButton("ShopButton", panel, "SHOP");
            SetRectTransform(shopButton.GetComponent<RectTransform>(), new Vector2(0.1f, 0.25f), new Vector2(0.45f, 0.35f), Vector2.zero, Vector2.zero);
            ApplyRoyalMatchButtonStyle(shopButton);
            
            // Settings Button
            var settingsButton = CreateButton("SettingsButton", panel, "SETTINGS");
            SetRectTransform(settingsButton.GetComponent<RectTransform>(), new Vector2(0.55f, 0.25f), new Vector2(0.9f, 0.35f), Vector2.zero, Vector2.zero);
            ApplyRoyalMatchButtonStyle(settingsButton);
            
            // Profile Button
            var profileButton = CreateButton("ProfileButton", panel, "PROFILE");
            SetRectTransform(profileButton.GetComponent<RectTransform>(), new Vector2(0.1f, 0.1f), new Vector2(0.45f, 0.2f), Vector2.zero, Vector2.zero);
            ApplyRoyalMatchButtonStyle(profileButton);
            
            // Events Button
            var eventsButton = CreateButton("EventsButton", panel, "EVENTS");
            SetRectTransform(eventsButton.GetComponent<RectTransform>(), new Vector2(0.55f, 0.1f), new Vector2(0.9f, 0.2f), Vector2.zero, Vector2.zero);
            ApplyRoyalMatchButtonStyle(eventsButton);
        }
        
        private void CreateGameplayPanel(GameObject parent)
        {
            var panel = CreatePanel("GameplayPanel", parent);
            
            // Top HUD
            var topHUD = CreateImage("TopHUD", panel);
            SetRectTransform(topHUD.GetComponent<RectTransform>(), new Vector2(0f, 0.85f), new Vector2(1f, 1f), Vector2.zero, Vector2.zero);
            topHUD.color = new Color(0f, 0f, 0f, 0.5f);
            
            // Level Text
            var levelText = CreateText("LevelText", panel, "Level 1");
            levelText.fontSize = 36;
            levelText.color = Color.white;
            SetRectTransform(levelText.GetComponent<RectTransform>(), new Vector2(0.05f, 0.9f), new Vector2(0.3f, 0.98f), Vector2.zero, Vector2.zero);
            
            // Score Text
            var scoreText = CreateText("ScoreText", panel, "0");
            scoreText.fontSize = 36;
            scoreText.color = Color.white;
            SetRectTransform(scoreText.GetComponent<RectTransform>(), new Vector2(0.35f, 0.9f), new Vector2(0.65f, 0.98f), Vector2.zero, Vector2.zero);
            
            // Moves Text
            var movesText = CreateText("MovesText", panel, "20");
            movesText.fontSize = 36;
            movesText.color = Color.white;
            SetRectTransform(movesText.GetComponent<RectTransform>(), new Vector2(0.7f, 0.9f), new Vector2(0.95f, 0.98f), Vector2.zero, Vector2.zero);
            
            // Pause Button
            var pauseButton = CreateButton("PauseButton", panel, "⏸️");
            SetRectTransform(pauseButton.GetComponent<RectTransform>(), new Vector2(0.9f, 0.85f), new Vector2(0.98f, 0.95f), Vector2.zero, Vector2.zero);
            ApplyRoyalMatchButtonStyle(pauseButton);
            
            // Bottom HUD
            var bottomHUD = CreateImage("BottomHUD", panel);
            SetRectTransform(bottomHUD.GetComponent<RectTransform>(), new Vector2(0f, 0f), new Vector2(1f, 0.15f), Vector2.zero, Vector2.zero);
            bottomHUD.color = new Color(0f, 0f, 0f, 0.5f);
            
            // Coins Text
            var coinsText = CreateText("CoinsText", panel, "100");
            coinsText.fontSize = 24;
            coinsText.color = Color.yellow;
            SetRectTransform(coinsText.GetComponent<RectTransform>(), new Vector2(0.05f, 0.05f), new Vector2(0.3f, 0.12f), Vector2.zero, Vector2.zero);
            
            // Gems Text
            var gemsText = CreateText("GemsText", panel, "50");
            gemsText.fontSize = 24;
            gemsText.color = Color.cyan;
            SetRectTransform(gemsText.GetComponent<RectTransform>(), new Vector2(0.35f, 0.05f), new Vector2(0.6f, 0.12f), Vector2.zero, Vector2.zero);
            
            // Boosters Button
            var boostersButton = CreateButton("BoostersButton", panel, "BOOSTERS");
            SetRectTransform(boostersButton.GetComponent<RectTransform>(), new Vector2(0.65f, 0.05f), new Vector2(0.95f, 0.12f), Vector2.zero, Vector2.zero);
            ApplyRoyalMatchButtonStyle(boostersButton);
        }
        
        private void CreateShopPanel(GameObject parent)
        {
            var panel = CreatePanel("ShopPanel", parent);
            CreateBasicPanelContent(panel, "SHOP", "Royal Match Shop");
        }
        
        private void CreateSettingsPanel(GameObject parent)
        {
            var panel = CreatePanel("SettingsPanel", parent);
            CreateBasicPanelContent(panel, "SETTINGS", "Game Settings");
        }
        
        private void CreatePausePanel(GameObject parent)
        {
            var panel = CreatePanel("PausePanel", parent);
            CreateBasicPanelContent(panel, "PAUSED", "Game Paused");
        }
        
        private void CreateLevelCompletePanel(GameObject parent)
        {
            var panel = CreatePanel("LevelCompletePanel", parent);
            CreateBasicPanelContent(panel, "LEVEL COMPLETE!", "Congratulations!");
        }
        
        private void CreateGameOverPanel(GameObject parent)
        {
            var panel = CreatePanel("GameOverPanel", parent);
            CreateBasicPanelContent(panel, "GAME OVER", "Try Again!");
        }
        
        private void CreateBoostersPanel(GameObject parent)
        {
            var panel = CreatePanel("BoostersPanel", parent);
            CreateBasicPanelContent(panel, "BOOSTERS", "Power-ups & Boosters");
        }
        
        private void CreateDailyRewardsPanel(GameObject parent)
        {
            var panel = CreatePanel("DailyRewardsPanel", parent);
            CreateBasicPanelContent(panel, "DAILY REWARDS", "Claim Your Rewards");
        }
        
        private void CreateEventsPanel(GameObject parent)
        {
            var panel = CreatePanel("EventsPanel", parent);
            CreateBasicPanelContent(panel, "EVENTS", "Special Events");
        }
        
        private void CreateLeaderboardPanel(GameObject parent)
        {
            var panel = CreatePanel("LeaderboardPanel", parent);
            CreateBasicPanelContent(panel, "LEADERBOARD", "Top Players");
        }
        
        private void CreateProfilePanel(GameObject parent)
        {
            var panel = CreatePanel("ProfilePanel", parent);
            CreateBasicPanelContent(panel, "PROFILE", "Player Profile");
        }
        
        private void CreateBasicPanelContent(GameObject panel, string title, string subtitle)
        {
            // Background
            var background = CreateImage("Background", panel);
            SetRectTransform(background.GetComponent<RectTransform>(), Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            background.color = new Color(0f, 0f, 0f, 0.8f);
            
            // Content Panel
            var contentPanel = CreateImage("ContentPanel", panel);
            SetRectTransform(contentPanel.GetComponent<RectTransform>(), new Vector2(0.1f, 0.2f), new Vector2(0.9f, 0.8f), Vector2.zero, Vector2.zero);
            contentPanel.color = new Color(0.2f, 0.2f, 0.2f, 0.9f);
            
            // Title
            var titleText = CreateText("Title", contentPanel, title);
            titleText.fontSize = 48;
            titleText.color = Color.white;
            titleText.fontStyle = FontStyles.Bold;
            SetRectTransform(titleText.GetComponent<RectTransform>(), new Vector2(0.1f, 0.7f), new Vector2(0.9f, 0.9f), Vector2.zero, Vector2.zero);
            
            // Subtitle
            var subtitleText = CreateText("Subtitle", contentPanel, subtitle);
            subtitleText.fontSize = 24;
            subtitleText.color = Color.gray;
            SetRectTransform(subtitleText.GetComponent<RectTransform>(), new Vector2(0.1f, 0.5f), new Vector2(0.9f, 0.65f), Vector2.zero, Vector2.zero);
            
            // Close Button
            var closeButton = CreateButton("CloseButton", contentPanel, "CLOSE");
            SetRectTransform(closeButton.GetComponent<RectTransform>(), new Vector2(0.3f, 0.1f), new Vector2(0.7f, 0.25f), Vector2.zero, Vector2.zero);
            ApplyRoyalMatchButtonStyle(closeButton);
        }
        
        private GameObject CreatePanel(string name, GameObject parent)
        {
            var panel = new GameObject(name);
            panel.transform.SetParent(parent.transform);
            panel.SetActive(false);
            return panel;
        }
        
        private Image CreateImage(string name, GameObject parent)
        {
            var imageGO = new GameObject(name);
            imageGO.transform.SetParent(parent.transform);
            var image = imageGO.AddComponent<Image>();
            return image;
        }
        
        private TextMeshProUGUI CreateText(string name, GameObject parent, string text)
        {
            var textGO = new GameObject(name);
            textGO.transform.SetParent(parent.transform);
            var textComponent = textGO.AddComponent<TextMeshProUGUI>();
            textComponent.text = text;
            textComponent.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
            textComponent.alignment = TextAlignmentOptions.Center;
            return textComponent;
        }
        
        private Button CreateButton(string name, GameObject parent, string text)
        {
            var buttonGO = new GameObject(name);
            buttonGO.transform.SetParent(parent.transform);
            
            var image = buttonGO.AddComponent<Image>();
            var button = buttonGO.AddComponent<Button>();
            
            var textGO = new GameObject("Text");
            textGO.transform.SetParent(buttonGO.transform);
            var textComponent = textGO.AddComponent<TextMeshProUGUI>();
            textComponent.text = text;
            textComponent.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
            textComponent.color = Color.white;
            textComponent.alignment = TextAlignmentOptions.Center;
            
            var textRect = textComponent.GetComponent<RectTransform>();
            textRect.anchorMin = Vector2.zero;
            textRect.anchorMax = Vector2.one;
            textRect.offsetMin = Vector2.zero;
            textRect.offsetMax = Vector2.zero;
            
            return button;
        }
        
        private void SetRectTransform(RectTransform rect, Vector2 anchorMin, Vector2 anchorMax, Vector2 offsetMin, Vector2 offsetMax)
        {
            rect.anchorMin = anchorMin;
            rect.anchorMax = anchorMax;
            rect.offsetMin = offsetMin;
            rect.offsetMax = offsetMax;
        }
        
        private void ApplyRoyalMatchButtonStyle(Button button)
        {
            var colors = button.colors;
            colors.normalColor = new Color(0.2f, 0.6f, 0.9f, 1f); // Royal blue
            colors.highlightedColor = new Color(0.3f, 0.7f, 1f, 1f);
            colors.pressedColor = new Color(0.1f, 0.5f, 0.8f, 1f);
            colors.selectedColor = new Color(1f, 0.8f, 0.2f, 1f); // Royal gold
            button.colors = colors;
        }
        
        private void AssignUIPanels()
        {
            if (uiManager == null) return;
            
            // Find all UI panels
            var mainMenuPanel = GameObject.Find("MainMenuPanel");
            var gameplayPanel = GameObject.Find("GameplayPanel");
            var shopPanel = GameObject.Find("ShopPanel");
            var settingsPanel = GameObject.Find("SettingsPanel");
            var pausePanel = GameObject.Find("PausePanel");
            var levelCompletePanel = GameObject.Find("LevelCompletePanel");
            var gameOverPanel = GameObject.Find("GameOverPanel");
            var boostersPanel = GameObject.Find("BoostersPanel");
            var dailyRewardsPanel = GameObject.Find("DailyRewardsPanel");
            var eventsPanel = GameObject.Find("EventsPanel");
            var leaderboardPanel = GameObject.Find("LeaderboardPanel");
            var profilePanel = GameObject.Find("ProfilePanel");
            
            // Assign panels using reflection
            var uiManagerType = uiManager.GetType();
            var fields = uiManagerType.GetFields(System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            
            foreach (var field in fields)
            {
                if (field.FieldType == typeof(GameObject))
                {
                    switch (field.Name)
                    {
                        case "mainMenuPanel":
                            field.SetValue(uiManager, mainMenuPanel);
                            break;
                        case "gameplayPanel":
                            field.SetValue(uiManager, gameplayPanel);
                            break;
                        case "shopPanel":
                            field.SetValue(uiManager, shopPanel);
                            break;
                        case "settingsPanel":
                            field.SetValue(uiManager, settingsPanel);
                            break;
                        case "pausePanel":
                            field.SetValue(uiManager, pausePanel);
                            break;
                        case "levelCompletePanel":
                            field.SetValue(uiManager, levelCompletePanel);
                            break;
                        case "gameOverPanel":
                            field.SetValue(uiManager, gameOverPanel);
                            break;
                        case "boostersPanel":
                            field.SetValue(uiManager, boostersPanel);
                            break;
                        case "dailyRewardsPanel":
                            field.SetValue(uiManager, dailyRewardsPanel);
                            break;
                        case "eventsPanel":
                            field.SetValue(uiManager, eventsPanel);
                            break;
                        case "leaderboardPanel":
                            field.SetValue(uiManager, leaderboardPanel);
                            break;
                        case "profilePanel":
                            field.SetValue(uiManager, profilePanel);
                            break;
                    }
                }
            }
        }
        
        private void AssignUIElements()
        {
            if (uiManager == null) return;
            
            // Find UI elements
            var levelText = GameObject.Find("LevelText")?.GetComponent<TextMeshProUGUI>();
            var scoreText = GameObject.Find("ScoreText")?.GetComponent<TextMeshProUGUI>();
            var movesText = GameObject.Find("MovesText")?.GetComponent<TextMeshProUGUI>();
            var coinsText = GameObject.Find("CoinsText")?.GetComponent<TextMeshProUGUI>();
            var gemsText = GameObject.Find("GemsText")?.GetComponent<TextMeshProUGUI>();
            
            var playButton = GameObject.Find("PlayButton")?.GetComponent<Button>();
            var shopButton = GameObject.Find("ShopButton")?.GetComponent<Button>();
            var settingsButton = GameObject.Find("SettingsButton")?.GetComponent<Button>();
            var pauseButton = GameObject.Find("PauseButton")?.GetComponent<Button>();
            var boostersButton = GameObject.Find("BoostersButton")?.GetComponent<Button>();
            var dailyRewardsButton = GameObject.Find("DailyRewardsButton")?.GetComponent<Button>();
            var eventsButton = GameObject.Find("EventsButton")?.GetComponent<Button>();
            var leaderboardButton = GameObject.Find("LeaderboardButton")?.GetComponent<Button>();
            var profileButton = GameObject.Find("ProfileButton")?.GetComponent<Button>();
            
            // Assign elements using reflection
            var uiManagerType = uiManager.GetType();
            var fields = uiManagerType.GetFields(System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            
            foreach (var field in fields)
            {
                if (field.FieldType == typeof(TextMeshProUGUI))
                {
                    switch (field.Name)
                    {
                        case "levelText":
                            field.SetValue(uiManager, levelText);
                            break;
                        case "scoreText":
                            field.SetValue(uiManager, scoreText);
                            break;
                        case "movesText":
                            field.SetValue(uiManager, movesText);
                            break;
                        case "coinsText":
                            field.SetValue(uiManager, coinsText);
                            break;
                        case "gemsText":
                            field.SetValue(uiManager, gemsText);
                            break;
                    }
                }
                else if (field.FieldType == typeof(Button))
                {
                    switch (field.Name)
                    {
                        case "playButton":
                            field.SetValue(uiManager, playButton);
                            break;
                        case "shopButton":
                            field.SetValue(uiManager, shopButton);
                            break;
                        case "settingsButton":
                            field.SetValue(uiManager, settingsButton);
                            break;
                        case "pauseButton":
                            field.SetValue(uiManager, pauseButton);
                            break;
                        case "boostersButton":
                            field.SetValue(uiManager, boostersButton);
                            break;
                        case "dailyRewardsButton":
                            field.SetValue(uiManager, dailyRewardsButton);
                            break;
                        case "eventsButton":
                            field.SetValue(uiManager, eventsButton);
                            break;
                        case "leaderboardButton":
                            field.SetValue(uiManager, leaderboardButton);
                            break;
                        case "profileButton":
                            field.SetValue(uiManager, profileButton);
                            break;
                    }
                }
            }
        }
    }
}