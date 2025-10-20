using UnityEngine;
using UnityEngine.UI;
using TMPro;
using DG.Tweening;
using System.Collections;
using System.Collections.Generic;

namespace Evergreen.UI
{
    /// <summary>
    /// Complete Match-3 UI Setup
    /// Creates the entire UI system with all screens, popups, and animations
    /// </summary>
    public class CompleteMatch3UISetup : MonoBehaviour
    {
        [Header("Setup Options")]
        [SerializeField] private bool setupOnStart = true;
        [SerializeField] private bool createUIPanels = true;
        [SerializeField] private bool applyStyling = true;
        [SerializeField] private bool setupAnimations = true;
        
        [Header("UI References")]
        [SerializeField] private Match3UISystem uiSystem;
        [SerializeField] private MainMenuController mainMenuController;
        [SerializeField] private LevelSelectionController levelSelectionController;
        [SerializeField] private GameplayHUDController gameplayHUDController;
        [SerializeField] private PopupController popupController;
        
        [Header("Styling")]
        [SerializeField] private Color primaryColor = new Color(0.2f, 0.6f, 0.9f, 1f);
        [SerializeField] private Color secondaryColor = new Color(1f, 0.8f, 0.2f, 1f);
        [SerializeField] private Color accentColor = new Color(0.9f, 0.3f, 0.3f, 1f);
        [SerializeField] private Color backgroundColor = new Color(0.95f, 0.95f, 0.98f, 1f);
        
        void Start()
        {
            if (setupOnStart)
            {
                StartCoroutine(SetupCompleteUI());
            }
        }
        
        [ContextMenu("Setup Complete Match-3 UI")]
        public void SetupCompleteUIManual()
        {
            StartCoroutine(SetupCompleteUI());
        }
        
        private IEnumerator SetupCompleteUI()
        {
            Debug.Log("🎮 Starting Complete Match-3 UI Setup...");
            
            // Step 1: Create main UI system
            yield return StartCoroutine(CreateMainUISystem());
            
            // Step 2: Create main menu screen
            yield return StartCoroutine(CreateMainMenuScreen());
            
            // Step 3: Create level selection screen
            yield return StartCoroutine(CreateLevelSelectionScreen());
            
            // Step 4: Create gameplay screen
            yield return StartCoroutine(CreateGameplayScreen());
            
            // Step 5: Create popup system
            yield return StartCoroutine(CreatePopupSystem());
            
            // Step 6: Apply styling
            if (applyStyling)
            {
                yield return StartCoroutine(ApplyStyling());
            }
            
            // Step 7: Setup animations
            if (setupAnimations)
            {
                yield return StartCoroutine(SetupAnimations());
            }
            
            // Step 8: Final configuration
            yield return StartCoroutine(FinalConfiguration());
            
            Debug.Log("🎉 Complete Match-3 UI Setup Finished!");
        }
        
        private IEnumerator CreateMainUISystem()
        {
            Debug.Log("🔧 Creating main UI system...");
            
            // Create main UI system
            var uiSystemGO = new GameObject("Match3UISystem");
            uiSystem = uiSystemGO.AddComponent<Match3UISystem>();
            
            // Create main canvas
            var mainCanvas = CreateMainCanvas();
            uiSystemGO.transform.SetParent(mainCanvas.transform);
            
            yield return new WaitForEndOfFrame();
        }
        
        private IEnumerator CreateMainMenuScreen()
        {
            Debug.Log("🏠 Creating main menu screen...");
            
            // Create main menu screen
            var mainMenuScreen = CreateScreen("MainMenuScreen");
            uiSystem.mainMenuScreen = mainMenuScreen;
            
            // Create main menu controller
            var mainMenuControllerGO = new GameObject("MainMenuController");
            mainMenuController = mainMenuControllerGO.AddComponent<MainMenuController>();
            mainMenuControllerGO.transform.SetParent(mainMenuScreen.transform);
            
            // Create main menu UI elements
            CreateMainMenuUI(mainMenuScreen);
            
            yield return new WaitForEndOfFrame();
        }
        
        private IEnumerator CreateLevelSelectionScreen()
        {
            Debug.Log("🗺️ Creating level selection screen...");
            
            // Create level selection screen
            var levelSelectionScreen = CreateScreen("LevelSelectionScreen");
            uiSystem.levelSelectionScreen = levelSelectionScreen;
            
            // Create level selection controller
            var levelSelectionControllerGO = new GameObject("LevelSelectionController");
            levelSelectionController = levelSelectionControllerGO.AddComponent<LevelSelectionController>();
            levelSelectionControllerGO.transform.SetParent(levelSelectionScreen.transform);
            
            // Create level selection UI elements
            CreateLevelSelectionUI(levelSelectionScreen);
            
            yield return new WaitForEndOfFrame();
        }
        
        private IEnumerator CreateGameplayScreen()
        {
            Debug.Log("🎮 Creating gameplay screen...");
            
            // Create gameplay screen
            var gameplayScreen = CreateScreen("GameplayScreen");
            uiSystem.gameplayScreen = gameplayScreen;
            
            // Create gameplay HUD controller
            var gameplayHUDControllerGO = new GameObject("GameplayHUDController");
            gameplayHUDController = gameplayHUDControllerGO.AddComponent<GameplayHUDController>();
            gameplayHUDControllerGO.transform.SetParent(gameplayScreen.transform);
            
            // Create gameplay UI elements
            CreateGameplayUI(gameplayScreen);
            
            yield return new WaitForEndOfFrame();
        }
        
        private IEnumerator CreatePopupSystem()
        {
            Debug.Log("💬 Creating popup system...");
            
            // Create popup controller
            var popupControllerGO = new GameObject("PopupController");
            popupController = popupControllerGO.AddComponent<PopupController>();
            popupControllerGO.transform.SetParent(transform);
            
            // Create popup UI elements
            CreatePopupUI();
            
            yield return new WaitForEndOfFrame();
        }
        
        private IEnumerator ApplyStyling()
        {
            Debug.Log("🎨 Applying styling...");
            
            // Apply styling to all UI elements
            ApplyColorScheme();
            ApplyButtonStyling();
            ApplyTextStyling();
            
            yield return new WaitForEndOfFrame();
        }
        
        private IEnumerator SetupAnimations()
        {
            Debug.Log("✨ Setting up animations...");
            
            // Setup button animations
            SetupButtonAnimations();
            
            // Setup popup animations
            SetupPopupAnimations();
            
            yield return new WaitForEndOfFrame();
        }
        
        private IEnumerator FinalConfiguration()
        {
            Debug.Log("⚙️ Final configuration...");
            
            // Connect all components
            ConnectComponents();
            
            // Initialize all controllers
            InitializeControllers();
            
            // Show main menu
            uiSystem.ShowMainMenu();
            
            yield return new WaitForEndOfFrame();
        }
        
        #region UI Creation
        
        private GameObject CreateMainCanvas()
        {
            var canvasGO = new GameObject("MainCanvas");
            canvasGO.transform.SetParent(transform);
            
            var canvas = canvasGO.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 0;
            
            var scaler = canvasGO.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1080, 1920); // Portrait
            scaler.screenMatchMode = CanvasScaler.ScreenMatchMode.MatchWidthOrHeight;
            scaler.matchWidthOrHeight = 0.5f;
            
            canvasGO.AddComponent<GraphicRaycaster>();
            
            return canvasGO;
        }
        
        private GameObject CreateScreen(string screenName)
        {
            var screen = new GameObject(screenName);
            screen.transform.SetParent(transform);
            
            var canvas = screen.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 1;
            
            var scaler = screen.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1080, 1920);
            scaler.screenMatchMode = CanvasScaler.ScreenMatchMode.MatchWidthOrHeight;
            scaler.matchWidthOrHeight = 0.5f;
            
            screen.AddComponent<GraphicRaycaster>();
            
            // Initially hide screen
            screen.SetActive(false);
            
            return screen;
        }
        
        private void CreateMainMenuUI(GameObject screen)
        {
            // Background
            var background = CreateImage("Background", screen);
            SetRectTransform(background.GetComponent<RectTransform>(), Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            background.color = backgroundColor;
            
            // Top bar
            var topBar = CreateImage("TopBar", screen);
            SetRectTransform(topBar.GetComponent<RectTransform>(), new Vector2(0f, 0.85f), new Vector2(1f, 1f), Vector2.zero, Vector2.zero);
            topBar.color = primaryColor;
            
            // Player avatar
            var avatar = CreateImage("PlayerAvatar", screen);
            SetRectTransform(avatar.GetComponent<RectTransform>(), new Vector2(0.05f, 0.9f), new Vector2(0.15f, 0.98f), Vector2.zero, Vector2.zero);
            avatar.color = Color.white;
            
            // Level text
            var levelText = CreateText("LevelText", screen, "Level 1");
            levelText.fontSize = 24;
            levelText.color = Color.white;
            SetRectTransform(levelText.GetComponent<RectTransform>(), new Vector2(0.2f, 0.9f), new Vector2(0.4f, 0.98f), Vector2.zero, Vector2.zero);
            
            // Coins text
            var coinsText = CreateText("CoinsText", screen, "1000");
            coinsText.fontSize = 24;
            coinsText.color = Color.yellow;
            SetRectTransform(coinsText.GetComponent<RectTransform>(), new Vector2(0.45f, 0.9f), new Vector2(0.65f, 0.98f), Vector2.zero, Vector2.zero);
            
            // Gems text
            var gemsText = CreateText("GemsText", screen, "50");
            gemsText.fontSize = 24;
            gemsText.color = Color.cyan;
            SetRectTransform(gemsText.GetComponent<RectTransform>(), new Vector2(0.7f, 0.9f), new Vector2(0.9f, 0.98f), Vector2.zero, Vector2.zero);
            
            // Play button
            var playButton = CreateButton("PlayButton", screen, "PLAY");
            SetRectTransform(playButton.GetComponent<RectTransform>(), new Vector2(0.25f, 0.4f), new Vector2(0.75f, 0.6f), Vector2.zero, Vector2.zero);
            
            // Shop button
            var shopButton = CreateButton("ShopButton", screen, "SHOP");
            SetRectTransform(shopButton.GetComponent<RectTransform>(), new Vector2(0.1f, 0.25f), new Vector2(0.45f, 0.35f), Vector2.zero, Vector2.zero);
            
            // Events button
            var eventsButton = CreateButton("EventsButton", screen, "EVENTS");
            SetRectTransform(eventsButton.GetComponent<RectTransform>(), new Vector2(0.55f, 0.25f), new Vector2(0.9f, 0.35f), Vector2.zero, Vector2.zero);
            
            // Settings button
            var settingsButton = CreateButton("SettingsButton", screen, "SETTINGS");
            SetRectTransform(settingsButton.GetComponent<RectTransform>(), new Vector2(0.1f, 0.1f), new Vector2(0.45f, 0.2f), Vector2.zero, Vector2.zero);
            
            // Profile button
            var profileButton = CreateButton("ProfileButton", screen, "PROFILE");
            SetRectTransform(profileButton.GetComponent<RectTransform>(), new Vector2(0.55f, 0.1f), new Vector2(0.9f, 0.2f), Vector2.zero, Vector2.zero);
        }
        
        private void CreateLevelSelectionUI(GameObject screen)
        {
            // Background
            var background = CreateImage("Background", screen);
            SetRectTransform(background.GetComponent<RectTransform>(), Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            background.color = backgroundColor;
            
            // Level scroll rect
            var scrollRect = CreateScrollRect("LevelScrollRect", screen);
            SetRectTransform(scrollRect.GetComponent<RectTransform>(), new Vector2(0f, 0.1f), new Vector2(1f, 0.9f), Vector2.zero, Vector2.zero);
            
            // Level container
            var levelContainer = CreateImage("LevelContainer", scrollRect);
            SetRectTransform(levelContainer.GetComponent<RectTransform>(), Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            levelContainer.color = Color.clear;
            
            // Level preview popup
            var levelPreviewPopup = CreateImage("LevelPreviewPopup", screen);
            SetRectTransform(levelPreviewPopup.GetComponent<RectTransform>(), new Vector2(0.1f, 0.2f), new Vector2(0.9f, 0.8f), Vector2.zero, Vector2.zero);
            levelPreviewPopup.color = new Color(0f, 0f, 0f, 0.8f);
            levelPreviewPopup.gameObject.SetActive(false);
            
            // Preview title
            var previewTitle = CreateText("PreviewTitle", levelPreviewPopup.gameObject, "Level 1");
            previewTitle.fontSize = 36;
            previewTitle.color = Color.white;
            SetRectTransform(previewTitle.GetComponent<RectTransform>(), new Vector2(0.1f, 0.7f), new Vector2(0.9f, 0.9f), Vector2.zero, Vector2.zero);
            
            // Preview play button
            var previewPlayButton = CreateButton("PreviewPlayButton", levelPreviewPopup.gameObject, "PLAY");
            SetRectTransform(previewPlayButton.GetComponent<RectTransform>(), new Vector2(0.3f, 0.1f), new Vector2(0.7f, 0.25f), Vector2.zero, Vector2.zero);
        }
        
        private void CreateGameplayUI(GameObject screen)
        {
            // Background
            var background = CreateImage("Background", screen);
            SetRectTransform(background.GetComponent<RectTransform>(), Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            background.color = backgroundColor;
            
            // Top HUD
            var topHUD = CreateImage("TopHUD", screen);
            SetRectTransform(topHUD.GetComponent<RectTransform>(), new Vector2(0f, 0.85f), new Vector2(1f, 1f), Vector2.zero, Vector2.zero);
            topHUD.color = new Color(0f, 0f, 0f, 0.5f);
            
            // Moves text
            var movesText = CreateText("MovesText", screen, "30");
            movesText.fontSize = 24;
            movesText.color = Color.white;
            SetRectTransform(movesText.GetComponent<RectTransform>(), new Vector2(0.05f, 0.9f), new Vector2(0.25f, 0.98f), Vector2.zero, Vector2.zero);
            
            // Score text
            var scoreText = CreateText("ScoreText", screen, "0");
            scoreText.fontSize = 24;
            scoreText.color = Color.white;
            SetRectTransform(scoreText.GetComponent<RectTransform>(), new Vector2(0.3f, 0.9f), new Vector2(0.7f, 0.98f), Vector2.zero, Vector2.zero);
            
            // Pause button
            var pauseButton = CreateButton("PauseButton", screen, "⏸️");
            SetRectTransform(pauseButton.GetComponent<RectTransform>(), new Vector2(0.8f, 0.9f), new Vector2(0.95f, 0.98f), Vector2.zero, Vector2.zero);
            
            // Bottom HUD
            var bottomHUD = CreateImage("BottomHUD", screen);
            SetRectTransform(bottomHUD.GetComponent<RectTransform>(), new Vector2(0f, 0f), new Vector2(1f, 0.15f), Vector2.zero, Vector2.zero);
            bottomHUD.color = new Color(0f, 0f, 0f, 0.5f);
            
            // Boosters container
            var boosterContainer = CreateImage("BoosterContainer", screen);
            SetRectTransform(boosterContainer.GetComponent<RectTransform>(), new Vector2(0.05f, 0.05f), new Vector2(0.95f, 0.12f), Vector2.zero, Vector2.zero);
            boosterContainer.color = Color.clear;
        }
        
        private void CreatePopupUI()
        {
            // Reward popup
            var rewardPopup = CreateImage("RewardPopup", transform);
            SetRectTransform(rewardPopup.GetComponent<RectTransform>(), new Vector2(0.1f, 0.2f), new Vector2(0.9f, 0.8f), Vector2.zero, Vector2.zero);
            rewardPopup.color = new Color(0f, 0f, 0f, 0.8f);
            rewardPopup.gameObject.SetActive(false);
            
            // Confirmation dialog
            var confirmationDialog = CreateImage("ConfirmationDialog", transform);
            SetRectTransform(confirmationDialog.GetComponent<RectTransform>(), new Vector2(0.2f, 0.3f), new Vector2(0.8f, 0.7f), Vector2.zero, Vector2.zero);
            confirmationDialog.color = new Color(0f, 0f, 0f, 0.8f);
            confirmationDialog.gameObject.SetActive(false);
            
            // Level complete popup
            var levelCompletePopup = CreateImage("LevelCompletePopup", transform);
            SetRectTransform(levelCompletePopup.GetComponent<RectTransform>(), new Vector2(0.1f, 0.2f), new Vector2(0.9f, 0.8f), Vector2.zero, Vector2.zero);
            levelCompletePopup.color = new Color(0f, 0f, 0f, 0.8f);
            levelCompletePopup.gameObject.SetActive(false);
        }
        
        #endregion
        
        #region Helper Methods
        
        private GameObject CreateImage(string name, Transform parent)
        {
            var imageGO = new GameObject(name);
            imageGO.transform.SetParent(parent);
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
        
        private ScrollRect CreateScrollRect(string name, GameObject parent)
        {
            var scrollRectGO = new GameObject(name);
            scrollRectGO.transform.SetParent(parent.transform);
            
            var scrollRect = scrollRectGO.AddComponent<ScrollRect>();
            var image = scrollRectGO.AddComponent<Image>();
            
            return scrollRect;
        }
        
        private void SetRectTransform(RectTransform rect, Vector2 anchorMin, Vector2 anchorMax, Vector2 offsetMin, Vector2 offsetMax)
        {
            rect.anchorMin = anchorMin;
            rect.anchorMax = anchorMax;
            rect.offsetMin = offsetMin;
            rect.offsetMax = offsetMax;
        }
        
        #endregion
        
        #region Styling and Animation
        
        private void ApplyColorScheme()
        {
            // Apply primary color scheme to all UI elements
            var images = FindObjectsOfType<Image>();
            foreach (var image in images)
            {
                if (image.name.Contains("Button") || image.name.Contains("TopBar"))
                {
                    image.color = primaryColor;
                }
            }
        }
        
        private void ApplyButtonStyling()
        {
            var buttons = FindObjectsOfType<Button>();
            foreach (var button in buttons)
            {
                var colors = button.colors;
                colors.normalColor = primaryColor;
                colors.highlightedColor = Color.Lerp(primaryColor, Color.white, 0.2f);
                colors.pressedColor = Color.Lerp(primaryColor, Color.black, 0.2f);
                colors.selectedColor = secondaryColor;
                button.colors = colors;
            }
        }
        
        private void ApplyTextStyling()
        {
            var texts = FindObjectsOfType<TextMeshProUGUI>();
            foreach (var text in texts)
            {
                text.fontStyle = FontStyles.Bold;
                if (text.name.Contains("Title") || text.name.Contains("Level"))
                {
                    text.fontSize = 36;
                }
                else if (text.name.Contains("Button"))
                {
                    text.fontSize = 24;
                }
                else
                {
                    text.fontSize = 18;
                }
            }
        }
        
        private void SetupButtonAnimations()
        {
            // Setup button hover and click animations
            var buttons = FindObjectsOfType<Button>();
            foreach (var button in buttons)
            {
                AddButtonHoverAnimation(button);
            }
        }
        
        private void AddButtonHoverAnimation(Button button)
        {
            if (button == null) return;
            
            var eventTrigger = button.gameObject.AddComponent<UnityEngine.EventSystems.EventTrigger>();
            
            // Pointer Enter
            var pointerEnter = new UnityEngine.EventSystems.EventTrigger.Entry();
            pointerEnter.eventID = UnityEngine.EventSystems.EventTriggerType.PointerEnter;
            pointerEnter.callback.AddListener((data) => {
                button.transform.DOScale(1.1f, 0.2f).SetEase(Ease.OutBack);
            });
            eventTrigger.triggers.Add(pointerEnter);
            
            // Pointer Exit
            var pointerExit = new UnityEngine.EventSystems.EventTrigger.Entry();
            pointerExit.eventID = UnityEngine.EventSystems.EventTriggerType.PointerExit;
            pointerExit.callback.AddListener((data) => {
                button.transform.DOScale(1f, 0.2f).SetEase(Ease.OutBack);
            });
            eventTrigger.triggers.Add(pointerExit);
        }
        
        private void SetupPopupAnimations()
        {
            // Setup popup animations
            var popups = FindObjectsOfType<Image>();
            foreach (var popup in popups)
            {
                if (popup.name.Contains("Popup") || popup.name.Contains("Dialog"))
                {
                    var canvasGroup = popup.gameObject.AddComponent<CanvasGroup>();
                    canvasGroup.alpha = 0f;
                }
            }
        }
        
        #endregion
        
        #region Configuration
        
        private void ConnectComponents()
        {
            // Connect all UI components
            if (uiSystem != null)
            {
                uiSystem.mainMenuController = mainMenuController;
                uiSystem.levelSelectionController = levelSelectionController;
                uiSystem.gameplayHUDController = gameplayHUDController;
                uiSystem.popupController = popupController;
            }
        }
        
        private void InitializeControllers()
        {
            // Initialize all controllers
            if (mainMenuController != null)
            {
                mainMenuController.UpdatePlayerData(1, 1000, 50);
            }
            
            if (gameplayHUDController != null)
            {
                gameplayHUDController.UpdateGameplayData(30, 0, 5000);
            }
        }
        
        #endregion
    }
}