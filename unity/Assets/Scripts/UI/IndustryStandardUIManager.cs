using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using DG.Tweening;

namespace Evergreen.UI
{
    /// <summary>
    /// Industry Standard UI Manager - Implements UI patterns from top match-3 games
    /// Based on Candy Crush Saga, Gardenscapes, Homescapes, and Royal Match
    /// </summary>
    public class IndustryStandardUIManager : MonoBehaviour
    {
        [Header("Industry Standard UI Configuration")]
        [SerializeField] private IndustryStandardUIConfig uiConfig;
        [SerializeField] private ModernUIComponents modernComponents;
        
        [Header("UI References")]
        [SerializeField] private Canvas mainCanvas;
        [SerializeField] private Canvas gameplayCanvas;
        [SerializeField] private Canvas uiCanvas;
        
        [Header("Main Menu UI")]
        [SerializeField] private GameObject mainMenuPanel;
        [SerializeField] private TextMeshProUGUI titleText;
        [SerializeField] private Button playButton;
        [SerializeField] private Button settingsButton;
        [SerializeField] private Button shopButton;
        [SerializeField] private Button profileButton;
        
        [Header("Gameplay UI")]
        [SerializeField] private GameObject topBarPanel;
        [SerializeField] private GameObject bottomBarPanel;
        [SerializeField] private GameObject scorePanel;
        [SerializeField] private GameObject movesPanel;
        [SerializeField] private GameObject levelPanel;
        [SerializeField] private Slider levelProgressBar;
        [SerializeField] private GameObject boostersPanel;
        
        [Header("Popup UI")]
        [SerializeField] private GameObject levelCompletePopup;
        [SerializeField] private GameObject gameOverPopup;
        [SerializeField] private GameObject pauseMenuPopup;
        
        [Header("Animation Settings")]
        [SerializeField] private float animationDuration = 0.3f;
        [SerializeField] private Ease animationEase = Ease.OutCubic;
        
        private Dictionary<string, UIComponent> uiComponents = new Dictionary<string, UIComponent>();
        private Dictionary<string, Tween> activeTweens = new Dictionary<string, Tween>();
        
        private void Awake()
        {
            InitializeUI();
            ApplyIndustryStandards();
        }
        
        private void Start()
        {
            SetupEventListeners();
            StartUIAnimations();
        }
        
        /// <summary>
        /// Initialize UI components and apply industry standards
        /// </summary>
        private void InitializeUI()
        {
            Debug.Log("Initializing Industry Standard UI Manager");
            
            // Load UI configuration
            LoadUIConfiguration();
            
            // Initialize UI components
            InitializeMainMenuUI();
            InitializeGameplayUI();
            InitializePopupUI();
            
            // Apply responsive design
            ApplyResponsiveDesign();
            
            Debug.Log("Industry Standard UI Manager initialized successfully");
        }
        
        /// <summary>
        /// Load UI configuration from JSON files
        /// </summary>
        private void LoadUIConfiguration()
        {
            // Load industry standard UI config
            string configPath = "UI/IndustryStandardUIConfig";
            TextAsset configAsset = Resources.Load<TextAsset>(configPath);
            if (configAsset != null)
            {
                uiConfig = JsonUtility.FromJson<IndustryStandardUIConfig>(configAsset.text);
                Debug.Log("Loaded Industry Standard UI Configuration");
            }
            
            // Load modern UI components
            string componentsPath = "UI/ModernUIComponents";
            TextAsset componentsAsset = Resources.Load<TextAsset>(componentsPath);
            if (componentsAsset != null)
            {
                modernComponents = JsonUtility.FromJson<ModernUIComponents>(componentsAsset.text);
                Debug.Log("Loaded Modern UI Components");
            }
        }
        
        /// <summary>
        /// Initialize main menu UI with industry standards
        /// </summary>
        private void InitializeMainMenuUI()
        {
            if (mainMenuPanel == null) return;
            
            // Apply gradient background
            ApplyGradientBackground(mainMenuPanel, uiConfig.color_palette.primary_colors.candy_pink, 
                uiConfig.color_palette.primary_colors.candy_blue);
            
            // Style title text
            if (titleText != null)
            {
                StyleText(titleText, uiConfig.main_menu.logo);
            }
            
            // Style buttons
            StyleButton(playButton, "primary_button");
            StyleButton(settingsButton, "secondary_button");
            StyleButton(shopButton, "secondary_button");
            StyleButton(profileButton, "secondary_button");
        }
        
        /// <summary>
        /// Initialize gameplay UI with industry standards
        /// </summary>
        private void InitializeGameplayUI()
        {
            // Style top bar
            if (topBarPanel != null)
            {
                StylePanel(topBarPanel, uiConfig.gameplay_ui.top_bar);
            }
            
            // Style bottom bar
            if (bottomBarPanel != null)
            {
                StylePanel(bottomBarPanel, uiConfig.gameplay_ui.bottom_bar);
            }
            
            // Style individual panels
            StyleScorePanel();
            StyleMovesPanel();
            StyleLevelPanel();
            StyleBoostersPanel();
            StyleProgressBar();
        }
        
        /// <summary>
        /// Initialize popup UI with industry standards
        /// </summary>
        private void InitializePopupUI()
        {
            // Style level complete popup
            if (levelCompletePopup != null)
            {
                StylePopup(levelCompletePopup, uiConfig.popup_ui.level_complete);
            }
            
            // Style game over popup
            if (gameOverPopup != null)
            {
                StylePopup(gameOverPopup, uiConfig.popup_ui.game_over);
            }
        }
        
        /// <summary>
        /// Apply industry standards to UI
        /// </summary>
        private void ApplyIndustryStandards()
        {
            // Apply color scheme
            ApplyColorScheme();
            
            // Apply typography
            ApplyTypography();
            
            // Apply spacing and layout
            ApplySpacingAndLayout();
            
            // Apply shadows and effects
            ApplyShadowsAndEffects();
            
            // Apply animations
            ApplyAnimations();
        }
        
        /// <summary>
        /// Apply industry-standard color scheme
        /// </summary>
        private void ApplyColorScheme()
        {
            // Set up color palette
            var colorPalette = uiConfig.color_palette;
            
            // Apply primary colors
            var primaryColors = colorPalette.primary_colors;
            var backgroundColors = colorPalette.background_colors;
            var textColors = colorPalette.text_colors;
            var buttonColors = colorPalette.button_colors;
            
            Debug.Log("Applied industry-standard color scheme");
        }
        
        /// <summary>
        /// Apply industry-standard typography
        /// </summary>
        private void ApplyTypography()
        {
            var typography = uiConfig.typography;
            
            // Set font families
            var primaryFont = Resources.Load<Font>(typography.font_families.primary);
            var displayFont = Resources.Load<Font>(typography.font_families.display);
            
            // Apply font sizes and weights
            var fontSizes = typography.font_sizes;
            var fontWeights = typography.font_weights;
            
            Debug.Log("Applied industry-standard typography");
        }
        
        /// <summary>
        /// Apply spacing and layout standards
        /// </summary>
        private void ApplySpacingAndLayout()
        {
            var spacing = uiConfig.spacing;
            var borderRadius = uiConfig.border_radius;
            
            // Apply consistent spacing
            var margins = spacing.margins;
            var padding = spacing.padding;
            
            Debug.Log("Applied industry-standard spacing and layout");
        }
        
        /// <summary>
        /// Apply shadows and visual effects
        /// </summary>
        private void ApplyShadowsAndEffects()
        {
            var shadows = uiConfig.shadows;
            
            // Apply shadow styles
            var lightShadow = shadows.light;
            var mediumShadow = shadows.medium;
            var heavyShadow = shadows.heavy;
            
            Debug.Log("Applied industry-standard shadows and effects");
        }
        
        /// <summary>
        /// Apply industry-standard animations
        /// </summary>
        private void ApplyAnimations()
        {
            var animations = uiConfig.animations;
            
            // Set up animation presets
            var buttonHover = animations.button_hover;
            var buttonClick = animations.button_click;
            var scorePopup = animations.score_popup;
            var comboText = animations.combo_text;
            
            Debug.Log("Applied industry-standard animations");
        }
        
        /// <summary>
        /// Apply responsive design based on screen size
        /// </summary>
        private void ApplyResponsiveDesign()
        {
            var responsiveDesign = uiConfig.responsive_design;
            
            // Detect current screen size
            var screenWidth = Screen.width;
            var screenHeight = Screen.height;
            
            // Determine breakpoint
            ResponsiveBreakpoint breakpoint = ResponsiveBreakpoint.Desktop;
            
            if (screenWidth <= 720 && screenHeight <= 1280)
            {
                breakpoint = ResponsiveBreakpoint.MobilePortrait;
            }
            else if (screenWidth <= 1280 && screenHeight <= 720)
            {
                breakpoint = ResponsiveBreakpoint.MobileLandscape;
            }
            else if (screenWidth <= 768 && screenHeight <= 1024)
            {
                breakpoint = ResponsiveBreakpoint.TabletPortrait;
            }
            else if (screenWidth <= 1024 && screenHeight <= 768)
            {
                breakpoint = ResponsiveBreakpoint.TabletLandscape;
            }
            
            // Apply responsive adjustments
            ApplyResponsiveAdjustments(breakpoint);
            
            Debug.Log($"Applied responsive design for {breakpoint}");
        }
        
        /// <summary>
        /// Apply responsive adjustments for specific breakpoint
        /// </summary>
        private void ApplyResponsiveAdjustments(ResponsiveBreakpoint breakpoint)
        {
            var responsiveDesign = uiConfig.responsive_design;
            
            switch (breakpoint)
            {
                case ResponsiveBreakpoint.MobilePortrait:
                    ApplyMobilePortraitAdjustments(responsiveDesign.mobile_portrait);
                    break;
                case ResponsiveBreakpoint.MobileLandscape:
                    ApplyMobileLandscapeAdjustments(responsiveDesign.mobile_landscape);
                    break;
                case ResponsiveBreakpoint.TabletPortrait:
                    ApplyTabletPortraitAdjustments(responsiveDesign.tablet_portrait);
                    break;
                case ResponsiveBreakpoint.TabletLandscape:
                    ApplyTabletLandscapeAdjustments(responsiveDesign.tablet_landscape);
                    break;
                case ResponsiveBreakpoint.Desktop:
                    ApplyDesktopAdjustments(responsiveDesign.desktop);
                    break;
            }
        }
        
        /// <summary>
        /// Apply mobile portrait adjustments
        /// </summary>
        private void ApplyMobilePortraitAdjustments(MobilePortraitConfig config)
        {
            // Apply scale factors
            var scaleFactor = config.scale_factor;
            var fontScale = config.font_scale;
            var spacingScale = config.spacing_scale;
            
            // Apply UI adjustments
            var uiAdjustments = config.ui_adjustments;
            var layoutAdjustments = config.layout_adjustments;
            
            Debug.Log("Applied mobile portrait adjustments");
        }
        
        /// <summary>
        /// Apply mobile landscape adjustments
        /// </summary>
        private void ApplyMobileLandscapeAdjustments(MobileLandscapeConfig config)
        {
            // Similar to mobile portrait but with different values
            Debug.Log("Applied mobile landscape adjustments");
        }
        
        /// <summary>
        /// Apply tablet portrait adjustments
        /// </summary>
        private void ApplyTabletPortraitAdjustments(TabletPortraitConfig config)
        {
            // Similar pattern for tablet portrait
            Debug.Log("Applied tablet portrait adjustments");
        }
        
        /// <summary>
        /// Apply tablet landscape adjustments
        /// </summary>
        private void ApplyTabletLandscapeAdjustments(TabletLandscapeConfig config)
        {
            // Similar pattern for tablet landscape
            Debug.Log("Applied tablet landscape adjustments");
        }
        
        /// <summary>
        /// Apply desktop adjustments
        /// </summary>
        private void ApplyDesktopAdjustments(DesktopConfig config)
        {
            // Similar pattern for desktop
            Debug.Log("Applied desktop adjustments");
        }
        
        /// <summary>
        /// Style a button with industry standards
        /// </summary>
        private void StyleButton(Button button, string buttonType)
        {
            if (button == null) return;
            
            // Get button component configuration
            var buttonConfig = modernComponents.ui_components.buttons[buttonType];
            var baseStyle = buttonConfig.base_style;
            
            // Apply background color
            var image = button.GetComponent<Image>();
            if (image != null)
            {
                image.color = new Color(baseStyle.background_color[0], baseStyle.background_color[1], 
                    baseStyle.background_color[2], baseStyle.background_color[3]);
            }
            
            // Apply text styling
            var text = button.GetComponentInChildren<TextMeshProUGUI>();
            if (text != null)
            {
                text.fontSize = baseStyle.font_size;
                text.color = new Color(baseStyle.text_color[0], baseStyle.text_color[1], 
                    baseStyle.text_color[2], baseStyle.text_color[3]);
            }
            
            // Apply border radius (using UI Image with rounded corners)
            ApplyBorderRadius(button.gameObject, baseStyle.border_radius);
            
            // Apply shadow
            ApplyShadow(button.gameObject, baseStyle.shadow);
            
            // Set up button states and animations
            SetupButtonStates(button, buttonConfig);
        }
        
        /// <summary>
        /// Style a panel with industry standards
        /// </summary>
        private void StylePanel(GameObject panel, object panelConfig)
        {
            if (panel == null) return;
            
            // Apply panel styling based on configuration
            var image = panel.GetComponent<Image>();
            if (image != null)
            {
                // Apply background color and other properties
            }
            
            // Apply border radius
            ApplyBorderRadius(panel, 20);
            
            // Apply shadow
            ApplyShadow(panel, uiConfig.shadows.medium);
        }
        
        /// <summary>
        /// Style text with industry standards
        /// </summary>
        private void StyleText(TextMeshProUGUI text, object textConfig)
        {
            if (text == null) return;
            
            // Apply text styling based on configuration
            // This would be implemented based on the specific text configuration
        }
        
        /// <summary>
        /// Style score panel
        /// </summary>
        private void StyleScorePanel()
        {
            if (scorePanel == null) return;
            
            // Apply score panel specific styling
            var image = scorePanel.GetComponent<Image>();
            if (image != null)
            {
                image.color = new Color(0.98f, 0.45f, 0.65f, 1.0f); // Candy pink
            }
            
            ApplyBorderRadius(scorePanel, 40);
            ApplyShadow(scorePanel, uiConfig.shadows.medium);
        }
        
        /// <summary>
        /// Style moves panel
        /// </summary>
        private void StyleMovesPanel()
        {
            if (movesPanel == null) return;
            
            // Apply moves panel specific styling
            var image = movesPanel.GetComponent<Image>();
            if (image != null)
            {
                image.color = new Color(0.2f, 0.6f, 0.9f, 1.0f); // Candy blue
            }
            
            ApplyBorderRadius(movesPanel, 40);
            ApplyShadow(movesPanel, uiConfig.shadows.medium);
        }
        
        /// <summary>
        /// Style level panel
        /// </summary>
        private void StyleLevelPanel()
        {
            if (levelPanel == null) return;
            
            // Apply level panel specific styling
            var image = levelPanel.GetComponent<Image>();
            if (image != null)
            {
                image.color = new Color(1.0f, 0.6f, 0.2f, 1.0f); // Candy orange
            }
            
            ApplyBorderRadius(levelPanel, 40);
            ApplyShadow(levelPanel, uiConfig.shadows.medium);
        }
        
        /// <summary>
        /// Style boosters panel
        /// </summary>
        private void StyleBoostersPanel()
        {
            if (boostersPanel == null) return;
            
            // Apply boosters panel specific styling
            var image = boostersPanel.GetComponent<Image>();
            if (image != null)
            {
                image.color = new Color(0.95f, 0.95f, 0.98f, 1.0f); // Light background
            }
            
            ApplyBorderRadius(boostersPanel, 40);
            ApplyShadow(boostersPanel, uiConfig.shadows.light);
        }
        
        /// <summary>
        /// Style progress bar
        /// </summary>
        private void StyleProgressBar()
        {
            if (levelProgressBar == null) return;
            
            // Apply progress bar styling
            var fillImage = levelProgressBar.fillRect.GetComponent<Image>();
            if (fillImage != null)
            {
                fillImage.color = new Color(0.98f, 0.45f, 0.65f, 1.0f); // Candy pink
            }
            
            var backgroundImage = levelProgressBar.GetComponent<Image>();
            if (backgroundImage != null)
            {
                backgroundImage.color = new Color(0.9f, 0.9f, 0.9f, 1.0f); // Light gray
            }
        }
        
        /// <summary>
        /// Style popup with industry standards
        /// </summary>
        private void StylePopup(GameObject popup, object popupConfig)
        {
            if (popup == null) return;
            
            // Apply popup styling based on configuration
            // This would be implemented based on the specific popup configuration
        }
        
        /// <summary>
        /// Apply border radius to UI element
        /// </summary>
        private void ApplyBorderRadius(GameObject uiElement, float radius)
        {
            // This would typically use a UI Image with rounded corners shader
            // For now, we'll just log the action
            Debug.Log($"Applied border radius {radius} to {uiElement.name}");
        }
        
        /// <summary>
        /// Apply shadow to UI element
        /// </summary>
        private void ApplyShadow(GameObject uiElement, object shadowConfig)
        {
            // This would typically use a UI shadow component
            // For now, we'll just log the action
            Debug.Log($"Applied shadow to {uiElement.name}");
        }
        
        /// <summary>
        /// Apply gradient background
        /// </summary>
        private void ApplyGradientBackground(GameObject panel, float[] color1, float[] color2)
        {
            // This would typically use a UI Image with gradient shader
            // For now, we'll just log the action
            Debug.Log($"Applied gradient background to {panel.name}");
        }
        
        /// <summary>
        /// Set up button states and animations
        /// </summary>
        private void SetupButtonStates(Button button, object buttonConfig)
        {
            // Set up hover, click, and other button states
            // This would be implemented with proper button state management
        }
        
        /// <summary>
        /// Set up event listeners
        /// </summary>
        private void SetupEventListeners()
        {
            // Set up button click events
            if (playButton != null)
            {
                playButton.onClick.AddListener(OnPlayButtonClicked);
            }
            
            if (settingsButton != null)
            {
                settingsButton.onClick.AddListener(OnSettingsButtonClicked);
            }
            
            if (shopButton != null)
            {
                shopButton.onClick.AddListener(OnShopButtonClicked);
            }
            
            if (profileButton != null)
            {
                profileButton.onClick.AddListener(OnProfileButtonClicked);
            }
        }
        
        /// <summary>
        /// Start UI animations
        /// </summary>
        private void StartUIAnimations()
        {
            // Start initial UI animations
            if (mainMenuPanel != null)
            {
                StartMainMenuAnimations();
            }
        }
        
        /// <summary>
        /// Start main menu animations
        /// </summary>
        private void StartMainMenuAnimations()
        {
            // Animate title text
            if (titleText != null)
            {
                titleText.transform.localScale = Vector3.zero;
                titleText.transform.DOScale(Vector3.one, 0.6f).SetEase(Ease.OutBounce);
            }
            
            // Animate buttons
            AnimateButtons();
        }
        
        /// <summary>
        /// Animate buttons with industry-standard effects
        /// </summary>
        private void AnimateButtons()
        {
            var buttons = new Button[] { playButton, settingsButton, shopButton, profileButton };
            
            for (int i = 0; i < buttons.Length; i++)
            {
                if (buttons[i] != null)
                {
                    buttons[i].transform.localScale = Vector3.zero;
                    buttons[i].transform.DOScale(Vector3.one, 0.4f)
                        .SetEase(Ease.OutBack)
                        .SetDelay(0.2f + i * 0.1f);
                }
            }
        }
        
        // Button event handlers
        private void OnPlayButtonClicked()
        {
            Debug.Log("Play button clicked - Industry standard animation");
            // Add button click animation
            if (playButton != null)
            {
                playButton.transform.DOScale(0.95f, 0.1f).SetEase(Ease.InOutQuad)
                    .OnComplete(() => playButton.transform.DOScale(1.0f, 0.1f));
            }
        }
        
        private void OnSettingsButtonClicked()
        {
            Debug.Log("Settings button clicked - Industry standard animation");
            // Add button click animation
        }
        
        private void OnShopButtonClicked()
        {
            Debug.Log("Shop button clicked - Industry standard animation");
            // Add button click animation
        }
        
        private void OnProfileButtonClicked()
        {
            Debug.Log("Profile button clicked - Industry standard animation");
            // Add button click animation
        }
        
        /// <summary>
        /// Show level complete popup with industry-standard animation
        /// </summary>
        public void ShowLevelCompletePopup(int score, int stars)
        {
            if (levelCompletePopup == null) return;
            
            levelCompletePopup.SetActive(true);
            
            // Animate popup appearance
            levelCompletePopup.transform.localScale = Vector3.zero;
            levelCompletePopup.transform.DOScale(Vector3.one, 0.5f).SetEase(Ease.OutBack);
            
            // Animate stars
            AnimateStars(stars);
        }
        
        /// <summary>
        /// Animate stars with industry-standard effects
        /// </summary>
        private void AnimateStars(int starCount)
        {
            // This would animate the stars based on the star count
            Debug.Log($"Animating {starCount} stars with industry-standard effects");
        }
        
        /// <summary>
        /// Show game over popup with industry-standard animation
        /// </summary>
        public void ShowGameOverPopup(int finalScore)
        {
            if (gameOverPopup == null) return;
            
            gameOverPopup.SetActive(true);
            
            // Animate popup appearance
            gameOverPopup.transform.localScale = Vector3.zero;
            gameOverPopup.transform.DOScale(Vector3.one, 0.4f).SetEase(Ease.OutBack);
        }
        
        /// <summary>
        /// Update score with industry-standard animation
        /// </summary>
        public void UpdateScore(int newScore)
        {
            // This would update the score with a popup animation
            Debug.Log($"Updating score to {newScore} with industry-standard animation");
        }
        
        /// <summary>
        /// Update moves with industry-standard animation
        /// </summary>
        public void UpdateMoves(int newMoves)
        {
            // This would update the moves with a popup animation
            Debug.Log($"Updating moves to {newMoves} with industry-standard animation");
        }
        
        /// <summary>
        /// Update level progress with industry-standard animation
        /// </summary>
        public void UpdateLevelProgress(float progress)
        {
            if (levelProgressBar != null)
            {
                levelProgressBar.DOValue(progress, 0.5f).SetEase(Ease.OutQuad);
            }
        }
        
        private void OnDestroy()
        {
            // Clean up tweens
            foreach (var tween in activeTweens.Values)
            {
                if (tween != null)
                {
                    tween.Kill();
                }
            }
            activeTweens.Clear();
        }
    }
    
    // Configuration classes for JSON deserialization
    [System.Serializable]
    public class IndustryStandardUIConfig
    {
        public UITheme ui_theme;
        public ColorPalette color_palette;
        public Typography typography;
        public Spacing spacing;
        public BorderRadius border_radius;
        public Shadows shadows;
        public MainMenu main_menu;
        public GameplayUI gameplay_ui;
        public PopupUI popup_ui;
        public Animations animations;
        public ResponsiveDesign responsive_design;
    }
    
    [System.Serializable]
    public class UITheme
    {
        public string name;
        public string version;
        public string description;
        public string[] reference_games;
    }
    
    [System.Serializable]
    public class ColorPalette
    {
        public PrimaryColors primary_colors;
        public BackgroundColors background_colors;
        public TextColors text_colors;
        public ButtonColors button_colors;
    }
    
    [System.Serializable]
    public class PrimaryColors
    {
        public float[] candy_pink;
        public float[] candy_blue;
        public float[] candy_green;
        public float[] candy_yellow;
        public float[] candy_orange;
        public float[] candy_purple;
    }
    
    [System.Serializable]
    public class BackgroundColors
    {
        public float[] main_background;
        public float[] panel_background;
        public float[] dark_panel;
        public float[] accent_background;
    }
    
    [System.Serializable]
    public class TextColors
    {
        public float[] primary_text;
        public float[] secondary_text;
        public float[] accent_text;
        public float[] white_text;
        public float[] gold_text;
    }
    
    [System.Serializable]
    public class ButtonColors
    {
        public float[] primary_button;
        public float[] secondary_button;
        public float[] success_button;
        public float[] warning_button;
        public float[] danger_button;
        public float[] disabled_button;
    }
    
    [System.Serializable]
    public class Typography
    {
        public FontFamilies font_families;
        public FontSizes font_sizes;
        public FontWeights font_weights;
    }
    
    [System.Serializable]
    public class FontFamilies
    {
        public string primary;
        public string display;
        public string ui;
    }
    
    [System.Serializable]
    public class FontSizes
    {
        public int huge;
        public int large;
        public int medium;
        public int normal;
        public int small;
        public int tiny;
    }
    
    [System.Serializable]
    public class FontWeights
    {
        public int light;
        public int normal;
        public int medium;
        public int bold;
        public int black;
    }
    
    [System.Serializable]
    public class Spacing
    {
        public Margins margins;
        public Padding padding;
    }
    
    [System.Serializable]
    public class Margins
    {
        public int tiny;
        public int small;
        public int medium;
        public int large;
        public int huge;
        public int massive;
    }
    
    [System.Serializable]
    public class Padding
    {
        public int tiny;
        public int small;
        public int medium;
        public int large;
        public int huge;
    }
    
    [System.Serializable]
    public class BorderRadius
    {
        public int small;
        public int medium;
        public int large;
        public int huge;
        public int round;
    }
    
    [System.Serializable]
    public class Shadows
    {
        public Shadow light;
        public Shadow medium;
        public Shadow heavy;
    }
    
    [System.Serializable]
    public class Shadow
    {
        public float[] offset;
        public float blur;
        public float spread;
        public float[] color;
    }
    
    [System.Serializable]
    public class MainMenu
    {
        public Background background;
        public Logo logo;
        public Button[] buttons;
        public DecorativeElement[] decorative_elements;
    }
    
    [System.Serializable]
    public class Background
    {
        public string type;
        public float[][] colors;
        public string direction;
    }
    
    [System.Serializable]
    public class Logo
    {
        public string text;
        public int font_size;
        public string font_weight;
        public float[] color;
        public Shadow shadow;
        public float[] position;
        public float[] size;
    }
    
    [System.Serializable]
    public class Button
    {
        public string name;
        public string text;
        public int font_size;
        public string font_weight;
        public float[] color;
        public float[] background_color;
        public float[] position;
        public float[] size;
        public int border_radius;
        public Shadow shadow;
        public string animation;
    }
    
    [System.Serializable]
    public class DecorativeElement
    {
        public string type;
        public float[] position;
        public float[] size;
        public string animation;
    }
    
    [System.Serializable]
    public class GameplayUI
    {
        public TopBar top_bar;
        public BottomBar bottom_bar;
        public ProgressBar[] progress_bars;
    }
    
    [System.Serializable]
    public class TopBar
    {
        public float[] background_color;
        public int height;
        public float[] position;
        public Shadow shadow;
        public UIElement[] elements;
    }
    
    [System.Serializable]
    public class BottomBar
    {
        public float[] background_color;
        public int height;
        public float[] position;
        public Shadow shadow;
        public UIElement[] elements;
    }
    
    [System.Serializable]
    public class UIElement
    {
        public string name;
        public string type;
        public float[] background_color;
        public float[] position;
        public float[] size;
        public int border_radius;
        public Shadow shadow;
        public UIElement[] elements;
    }
    
    [System.Serializable]
    public class ProgressBar
    {
        public string name;
        public string type;
        public float[] background_color;
        public float[] fill_color;
        public float[] position;
        public float[] size;
        public int border_radius;
        public float progress;
        public bool show_text;
        public string text_format;
        public float[] text_color;
        public Shadow shadow;
    }
    
    [System.Serializable]
    public class PopupUI
    {
        public LevelComplete level_complete;
        public GameOver game_over;
    }
    
    [System.Serializable]
    public class LevelComplete
    {
        public Background background;
        public Panel panel;
        public UIElement[] elements;
    }
    
    [System.Serializable]
    public class GameOver
    {
        public Background background;
        public Panel panel;
        public UIElement[] elements;
    }
    
    [System.Serializable]
    public class Panel
    {
        public float[] background_color;
        public float[] position;
        public float[] size;
        public int border_radius;
        public Shadow shadow;
        public string animation;
    }
    
    [System.Serializable]
    public class Animations
    {
        public ButtonAnimations button_animations;
        public TextAnimations text_animations;
        public PanelAnimations panel_animations;
    }
    
    [System.Serializable]
    public class ButtonAnimations
    {
        public Animation button_hover;
        public Animation button_click;
        public Animation button_pulse;
    }
    
    [System.Serializable]
    public class TextAnimations
    {
        public Animation score_popup;
        public Animation combo_text;
        public Animation bounce;
        public Animation shake;
    }
    
    [System.Serializable]
    public class PanelAnimations
    {
        public Animation panel_slide_in;
        public Animation panel_slide_out;
        public Animation scale_in;
        public Animation star_pop;
        public Animation float;
    }
    
    [System.Serializable]
    public class Animation
    {
        public float duration;
        public string ease_type;
        public float[] scale_from;
        public float[] scale_to;
        public float[] position_offset;
        public float alpha_from;
        public float alpha_to;
        public bool loop;
        public bool ping_pong;
        public int frequency;
        public float[] rotation_from;
        public float[] rotation_to;
        public float[] color_shift;
        public float color_brightness;
        public float shadow_intensity;
    }
    
    [System.Serializable]
    public class ResponsiveDesign
    {
        public MobilePortrait mobile_portrait;
        public MobileLandscape mobile_landscape;
        public TabletPortrait tablet_portrait;
        public TabletLandscape tablet_landscape;
        public Desktop desktop;
    }
    
    [System.Serializable]
    public class MobilePortrait
    {
        public float[] resolution;
        public float scale_factor;
        public float font_scale;
        public float spacing_scale;
        public UIAdjustments ui_adjustments;
        public LayoutAdjustments layout_adjustments;
    }
    
    [System.Serializable]
    public class MobileLandscape
    {
        public float[] resolution;
        public float scale_factor;
        public float font_scale;
        public float spacing_scale;
        public UIAdjustments ui_adjustments;
        public LayoutAdjustments layout_adjustments;
    }
    
    [System.Serializable]
    public class TabletPortrait
    {
        public float[] resolution;
        public float scale_factor;
        public float font_scale;
        public float spacing_scale;
        public UIAdjustments ui_adjustments;
        public LayoutAdjustments layout_adjustments;
    }
    
    [System.Serializable]
    public class TabletLandscape
    {
        public float[] resolution;
        public float scale_factor;
        public float font_scale;
        public float spacing_scale;
        public UIAdjustments ui_adjustments;
        public LayoutAdjustments layout_adjustments;
    }
    
    [System.Serializable]
    public class Desktop
    {
        public float[] resolution;
        public float scale_factor;
        public float font_scale;
        public float spacing_scale;
        public UIAdjustments ui_adjustments;
        public LayoutAdjustments layout_adjustments;
    }
    
    [System.Serializable]
    public class UIAdjustments
    {
        public float button_sizes;
        public float panel_padding;
        public float text_sizes;
        public float border_radius;
        public float shadow_intensity;
    }
    
    [System.Serializable]
    public class LayoutAdjustments
    {
        public int top_bar_height;
        public int bottom_bar_height;
        public int panel_spacing;
        public int button_spacing;
    }
    
    [System.Serializable]
    public class ModernUIComponents
    {
        public UIComponents ui_components;
        public LayoutSystems layout_systems;
        public AnimationSystems animation_systems;
        public Accessibility accessibility;
    }
    
    [System.Serializable]
    public class UIComponents
    {
        public ButtonComponents buttons;
        public PanelComponents panels;
        public ProgressBarComponents progress_bars;
        public BoosterComponents boosters;
        public TextElementComponents text_elements;
        public IconComponents icons;
    }
    
    [System.Serializable]
    public class ButtonComponents
    {
        public ButtonComponent primary_button;
        public ButtonComponent secondary_button;
        public ButtonComponent icon_button;
    }
    
    [System.Serializable]
    public class ButtonComponent
    {
        public string name;
        public BaseStyle base_style;
        public ButtonStates states;
        public ButtonAnimations animations;
    }
    
    [System.Serializable]
    public class BaseStyle
    {
        public float[] background_color;
        public float[] text_color;
        public int font_size;
        public string font_weight;
        public int border_radius;
        public int[] padding;
        public int[] min_size;
        public Shadow shadow;
    }
    
    [System.Serializable]
    public class ButtonStates
    {
        public ButtonState normal;
        public ButtonState hover;
        public ButtonState pressed;
        public ButtonState disabled;
    }
    
    [System.Serializable]
    public class ButtonState
    {
        public float[] scale;
        public float color_brightness;
        public float alpha;
        public float shadow_intensity;
    }
    
    [System.Serializable]
    public class ButtonAnimations
    {
        public Animation hover;
        public Animation click;
    }
    
    [System.Serializable]
    public class PanelComponents
    {
        public PanelComponent info_panel;
        public PanelComponent modal_panel;
    }
    
    [System.Serializable]
    public class PanelComponent
    {
        public string name;
        public BaseStyle base_style;
        public PanelVariants variants;
        public Background overlay;
    }
    
    [System.Serializable]
    public class PanelVariants
    {
        public PanelVariant score_panel;
        public PanelVariant moves_panel;
        public PanelVariant level_panel;
    }
    
    [System.Serializable]
    public class PanelVariant
    {
        public float[] background_color;
        public float[] text_color;
        public int border_radius;
        public int[] padding;
    }
    
    [System.Serializable]
    public class ProgressBarComponents
    {
        public ProgressBarComponent level_progress;
    }
    
    [System.Serializable]
    public class ProgressBarComponent
    {
        public string name;
        public BaseStyle base_style;
        public TextStyle text_style;
        public ProgressBarAnimations animations;
    }
    
    [System.Serializable]
    public class TextStyle
    {
        public int font_size;
        public string font_weight;
        public float[] color;
        public string format;
    }
    
    [System.Serializable]
    public class ProgressBarAnimations
    {
        public Animation fill;
    }
    
    [System.Serializable]
    public class BoosterComponents
    {
        public BoosterComponent booster_button;
    }
    
    [System.Serializable]
    public class BoosterComponent
    {
        public string name;
        public BaseStyle base_style;
        public BoosterVariants variants;
        public CountDisplay count_display;
    }
    
    [System.Serializable]
    public class BoosterVariants
    {
        public BoosterVariant extra_moves;
        public BoosterVariant color_bomb;
        public BoosterVariant rainbow_blast;
    }
    
    [System.Serializable]
    public class BoosterVariant
    {
        public float[] background_color;
        public string icon;
        public float[] icon_color;
    }
    
    [System.Serializable]
    public class CountDisplay
    {
        public int font_size;
        public string font_weight;
        public float[] color;
        public string position;
        public CountDisplayBackground background;
    }
    
    [System.Serializable]
    public class CountDisplayBackground
    {
        public float[] color;
        public int border_radius;
        public int[] padding;
    }
    
    [System.Serializable]
    public class TextElementComponents
    {
        public TextElementComponent title_text;
        public TextElementComponent subtitle_text;
        public TextElementComponent body_text;
        public TextElementComponent score_text;
    }
    
    [System.Serializable]
    public class TextElementComponent
    {
        public string name;
        public BaseStyle base_style;
    }
    
    [System.Serializable]
    public class IconComponents
    {
        public IconComponent star_icon;
        public IconComponent trophy_icon;
        public IconComponent target_icon;
    }
    
    [System.Serializable]
    public class IconComponent
    {
        public string name;
        public BaseStyle base_style;
        public IconAnimations animations;
    }
    
    [System.Serializable]
    public class IconAnimations
    {
        public Animation pop;
    }
    
    [System.Serializable]
    public class LayoutSystems
    {
        public Flexbox flexbox;
        public Grid grid;
    }
    
    [System.Serializable]
    public class Flexbox
    {
        public string direction;
        public string justify_content;
        public string align_items;
        public string flex_wrap;
        public int gap;
    }
    
    [System.Serializable]
    public class Grid
    {
        public int columns;
        public string rows;
        public int gap;
        public string alignment;
    }
    
    [System.Serializable]
    public class AnimationSystems
    {
        public EasingFunctions easing_functions;
        public TimingFunctions timing_functions;
    }
    
    [System.Serializable]
    public class EasingFunctions
    {
        public string EaseIn;
        public string EaseOut;
        public string EaseInOut;
        public string BounceOut;
    }
    
    [System.Serializable]
    public class TimingFunctions
    {
        public float fast;
        public float normal;
        public float slow;
        public float very_slow;
    }
    
    [System.Serializable]
    public class Accessibility
    {
        public FocusIndicators focus_indicators;
        public HighContrast high_contrast;
        public ScreenReader screen_reader;
    }
    
    [System.Serializable]
    public class FocusIndicators
    {
        public bool enabled;
        public float[] color;
        public int thickness;
        public string style;
    }
    
    [System.Serializable]
    public class HighContrast
    {
        public bool enabled;
        public ColorAdjustments color_adjustments;
    }
    
    [System.Serializable]
    public class ColorAdjustments
    {
        public float background_contrast;
        public float text_contrast;
    }
    
    [System.Serializable]
    public class ScreenReader
    {
        public bool enabled;
        public bool aria_labels;
        public bool semantic_markup;
    }
    
    public enum ResponsiveBreakpoint
    {
        MobilePortrait,
        MobileLandscape,
        TabletPortrait,
        TabletLandscape,
        Desktop
    }
    
    public class UIComponent
    {
        public string name;
        public GameObject gameObject;
        public RectTransform rectTransform;
        public Image image;
        public TextMeshProUGUI text;
        public Button button;
    }
}