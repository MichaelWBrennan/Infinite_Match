using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections.Generic;

namespace Evergreen.UI
{
    /// <summary>
    /// Royal Match UI Setup Helper
    /// Use this to create proper Royal Match-style UI panels in your scene
    /// </summary>
    public class RoyalMatchUISetup : MonoBehaviour
    {
        [Header("Royal Match UI Setup")]
        [SerializeField] private bool createUIPanels = true;
        [SerializeField] private bool applyRoyalMatchStyling = true;
        [SerializeField] private bool setupButtonAnimations = true;
        
        [ContextMenu("Create Royal Match UI Structure")]
        public void CreateRoyalMatchUIStructure()
        {
            Debug.Log("👑 Creating Royal Match UI Structure...");
            
            // Create main UI canvas
            var mainCanvas = CreateMainCanvas();
            
            // Create all UI panels
            CreateMainMenuPanel(mainCanvas);
            CreateGameplayPanel(mainCanvas);
            CreateShopPanel(mainCanvas);
            CreateSettingsPanel(mainCanvas);
            CreatePausePanel(mainCanvas);
            CreateLevelCompletePanel(mainCanvas);
            CreateGameOverPanel(mainCanvas);
            CreateBoostersPanel(mainCanvas);
            CreateDailyRewardsPanel(mainCanvas);
            CreateEventsPanel(mainCanvas);
            CreateLeaderboardPanel(mainCanvas);
            CreateProfilePanel(mainCanvas);
            
            Debug.Log("✅ Royal Match UI Structure created successfully!");
            Debug.Log("📝 Next steps:");
            Debug.Log("1. Assign the created panels to RoyalMatchUIManager in the Inspector");
            Debug.Log("2. Customize the UI elements as needed");
            Debug.Log("3. Add your own graphics and animations");
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
            scaler.referenceResolution = new Vector2(1080, 1920); // Royal Match uses portrait
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
            background.color = new Color(0.2f, 0.4f, 0.8f, 1f); // Royal blue background
            
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
    }
}