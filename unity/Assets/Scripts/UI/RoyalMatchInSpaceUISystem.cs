using UnityEngine;
using UnityEngine.UI;
using System.Collections;
using System.Collections.Generic;

// [RoyalMatchInSpace Overhaul] Visual refactor applied
namespace RoyalMatchInSpace.UI
{
    /// <summary>
    /// Royal Match in Space UI System - Complete overhaul with space royal theme
    /// Implements luxurious sci-fi visual language with royal elements
    /// </summary>
    public class RoyalMatchInSpaceUISystem : MonoBehaviour
    {
        [Header("Space Royal Theme Configuration")]
        [SerializeField] private Color deepSpaceNavy = new Color(0.04f, 0.06f, 0.2f, 1f);
        [SerializeField] private Color royalGold = new Color(1f, 0.85f, 0.4f, 1f);
        [SerializeField] private Color nebulaViolet = new Color(0.4f, 0.23f, 0.72f, 1f);
        [SerializeField] private Color cosmicCyan = new Color(0.3f, 0.82f, 0.88f, 1f);
        
        [Header("UI References")]
        [SerializeField] private Canvas mainCanvas;
        [SerializeField] private Canvas gameplayCanvas;
        [SerializeField] private Canvas uiCanvas;
        
        [Header("Main Menu Elements")]
        [SerializeField] private GameObject mainMenuPrefab;
        [SerializeField] private Text titleText;
        [SerializeField] private Button playButton;
        [SerializeField] private Button settingsButton;
        [SerializeField] private Button shopButton;
        [SerializeField] private Button profileButton;
        
        [Header("Game HUD Elements")]
        [SerializeField] private GameObject gameHUDPrefab;
        [SerializeField] private Text scoreText;
        [SerializeField] private Text movesText;
        [SerializeField] private Text levelText;
        [SerializeField] private Slider progressBar;
        
        [Header("End Screen Elements")]
        [SerializeField] private GameObject endScreenPrefab;
        [SerializeField] private Text levelCompleteText;
        [SerializeField] private Button nextLevelButton;
        [SerializeField] private Button retryButton;
        [SerializeField] private Button mainMenuButton;
        
        [Header("Settings Panel")]
        [SerializeField] private GameObject settingsPanelPrefab;
        [SerializeField] private Text settingsTitle;
        [SerializeField] private Slider musicVolumeSlider;
        [SerializeField] private Slider sfxVolumeSlider;
        [SerializeField] private Toggle vibrationToggle;
        
        [Header("Particle Effects")]
        [SerializeField] private ParticleSystem starlightParticles;
        [SerializeField] private ParticleSystem energyCoreEffect;
        [SerializeField] private ParticleSystem glowPulseEffect;
        
        [Header("Animation Settings")]
        [SerializeField] private float animationDuration = 0.4f;
        [SerializeField] private AnimationCurve easeInOutCubic = AnimationCurve.EaseInOut(0, 0, 1, 1);
        
        private Dictionary<string, GameObject> uiElements = new Dictionary<string, GameObject>();
        private Coroutine currentAnimation;
        
        void Start()
        {
            InitializeSpaceRoyalTheme();
            SetupParticleEffects();
            ApplyRoyalMatchInSpaceStyling();
        }
        
        /// <summary>
        /// Initialize the space royal theme with proper color palette and materials
        /// </summary>
        private void InitializeSpaceRoyalTheme()
        {
            // Configure Canvas settings for Royal Match in Space
            if (mainCanvas != null)
            {
                CanvasScaler scaler = mainCanvas.GetComponent<CanvasScaler>();
                if (scaler != null)
                {
                    scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
                    scaler.referenceResolution = new Vector2(1080, 1920);
                    scaler.screenMatchMode = CanvasScaler.ScreenMatchMode.MatchWidthOrHeight;
                    scaler.matchWidthOrHeight = 0.5f;
                }
            }
            
            // Apply space royal materials
            ApplySpaceRoyalMaterials();
        }
        
        /// <summary>
        /// Apply Royal Match in Space materials to all UI elements
        /// </summary>
        private void ApplySpaceRoyalMaterials()
        {
            // Apply materials based on UI_SpaceRoyal naming convention
            Material buttonMaterial = Resources.Load<Material>("Materials/UI/UI_SpaceRoyal_Button");
            Material backgroundMaterial = Resources.Load<Material>("Materials/UI/UI_SpaceRoyal_Background");
            Material panelMaterial = Resources.Load<Material>("Materials/UI/UI_SpaceRoyal_Panel");
            Material textMaterial = Resources.Load<Material>("Materials/UI/UI_SpaceRoyal_Text");
            
            // Apply materials to UI elements
            ApplyMaterialToUIElements(buttonMaterial, "Button");
            ApplyMaterialToUIElements(backgroundMaterial, "Background");
            ApplyMaterialToUIElements(panelMaterial, "Panel");
            ApplyMaterialToUIElements(textMaterial, "Text");
        }
        
        /// <summary>
        /// Apply material to UI elements by type
        /// </summary>
        private void ApplyMaterialToUIElements(Material material, string elementType)
        {
            if (material == null) return;
            
            // Find all UI elements of specified type
            Component[] components = GetComponentsInChildren<Component>();
            foreach (Component component in components)
            {
                if (component.name.Contains(elementType))
                {
                    if (component is Image image)
                    {
                        image.material = material;
                    }
                    else if (component is Text text)
                    {
                        text.material = material;
                    }
                }
            }
        }
        
        /// <summary>
        /// Setup particle effects for space royal theme
        /// </summary>
        private void SetupParticleEffects()
        {
            if (starlightParticles != null)
            {
                var main = starlightParticles.main;
                main.startLifetime = 5f;
                main.startSpeed = 2f;
                main.startSize = 0.1f;
                main.startColor = royalGold;
                main.maxParticles = 15;
                
                var emission = starlightParticles.emission;
                emission.rateOverTime = 12f;
                
                var shape = starlightParticles.shape;
                shape.shapeType = ParticleSystemShapeType.Circle;
                shape.radius = 10f;
            }
            
            if (energyCoreEffect != null)
            {
                var main = energyCoreEffect.main;
                main.startLifetime = 2f;
                main.startSpeed = 1f;
                main.startSize = 0.2f;
                main.startColor = cosmicCyan;
                main.maxParticles = 8;
                
                var emission = energyCoreEffect.emission;
                emission.rateOverTime = 6f;
            }
        }
        
        /// <summary>
        /// Apply Royal Match in Space styling to all UI elements
        /// </summary>
        private void ApplyRoyalMatchInSpaceStyling()
        {
            // Apply space royal color scheme
            ApplyColorScheme();
            
            // Setup button animations
            SetupButtonAnimations();
            
            // Configure text styling
            SetupTextStyling();
            
            // Setup panel styling
            SetupPanelStyling();
        }
        
        /// <summary>
        /// Apply the space royal color scheme
        /// </summary>
        private void ApplyColorScheme()
        {
            // Apply colors to UI elements
            if (titleText != null)
            {
                titleText.color = royalGold;
                titleText.fontSize = 72;
                titleText.fontStyle = FontStyle.Bold;
            }
            
            if (playButton != null)
            {
                var colors = playButton.colors;
                colors.normalColor = royalGold;
                colors.highlightedColor = new Color(royalGold.r * 1.2f, royalGold.g * 1.2f, royalGold.b * 1.2f, 1f);
                colors.pressedColor = new Color(royalGold.r * 0.8f, royalGold.g * 0.8f, royalGold.b * 0.8f, 1f);
                playButton.colors = colors;
            }
            
            if (settingsButton != null)
            {
                var colors = settingsButton.colors;
                colors.normalColor = nebulaViolet;
                colors.highlightedColor = new Color(nebulaViolet.r * 1.2f, nebulaViolet.g * 1.2f, nebulaViolet.b * 1.2f, 1f);
                colors.pressedColor = new Color(nebulaViolet.r * 0.8f, nebulaViolet.g * 0.8f, nebulaViolet.b * 0.8f, 1f);
                settingsButton.colors = colors;
            }
            
            if (shopButton != null)
            {
                var colors = shopButton.colors;
                colors.normalColor = cosmicCyan;
                colors.highlightedColor = new Color(cosmicCyan.r * 1.2f, cosmicCyan.g * 1.2f, cosmicCyan.b * 1.2f, 1f);
                colors.pressedColor = new Color(cosmicCyan.r * 0.8f, cosmicCyan.g * 0.8f, cosmicCyan.b * 0.8f, 1f);
                shopButton.colors = colors;
            }
        }
        
        /// <summary>
        /// Setup button animations with space royal theme
        /// </summary>
        private void SetupButtonAnimations()
        {
            Button[] buttons = GetComponentsInChildren<Button>();
            foreach (Button button in buttons)
            {
                SetupButtonHoverAnimation(button);
                SetupButtonClickAnimation(button);
            }
        }
        
        /// <summary>
        /// Setup button hover animation
        /// </summary>
        private void SetupButtonHoverAnimation(Button button)
        {
            // Add hover effect with scale and glow
            button.onClick.AddListener(() => {
                if (currentAnimation != null)
                    StopCoroutine(currentAnimation);
                currentAnimation = StartCoroutine(AnimateButtonClick(button));
            });
        }
        
        /// <summary>
        /// Setup button click animation
        /// </summary>
        private void SetupButtonClickAnimation(Button button)
        {
            // Add click effect with scale down and glow pulse
            button.onClick.AddListener(() => {
                if (currentAnimation != null)
                    StopCoroutine(currentAnimation);
                currentAnimation = StartCoroutine(AnimateButtonClick(button));
            });
        }
        
        /// <summary>
        /// Animate button click with space royal effects
        /// </summary>
        private IEnumerator AnimateButtonClick(Button button)
        {
            Vector3 originalScale = button.transform.localScale;
            Vector3 targetScale = originalScale * 1.1f;
            
            // Scale up
            float elapsed = 0f;
            while (elapsed < animationDuration * 0.5f)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / (animationDuration * 0.5f);
                button.transform.localScale = Vector3.Lerp(originalScale, targetScale, easeInOutCubic.Evaluate(t));
                yield return null;
            }
            
            // Scale down
            elapsed = 0f;
            while (elapsed < animationDuration * 0.5f)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / (animationDuration * 0.5f);
                button.transform.localScale = Vector3.Lerp(targetScale, originalScale, easeInOutCubic.Evaluate(t));
                yield return null;
            }
            
            button.transform.localScale = originalScale;
        }
        
        /// <summary>
        /// Setup text styling for space royal theme
        /// </summary>
        private void SetupTextStyling()
        {
            Text[] texts = GetComponentsInChildren<Text>();
            foreach (Text text in texts)
            {
                text.color = royalGold;
                text.fontStyle = FontStyle.Bold;
                
                // Add glow effect
                if (text.name.Contains("Title") || text.name.Contains("Score"))
                {
                    text.fontSize = Mathf.RoundToInt(text.fontSize * 1.2f);
                }
            }
        }
        
        /// <summary>
        /// Setup panel styling for space royal theme
        /// </summary>
        private void SetupPanelStyling()
        {
            Image[] images = GetComponentsInChildren<Image>();
            foreach (Image image in images)
            {
                if (image.name.Contains("Panel") || image.name.Contains("Background"))
                {
                    image.color = deepSpaceNavy;
                }
                else if (image.name.Contains("Button"))
                {
                    image.color = royalGold;
                }
            }
        }
        
        /// <summary>
        /// Show main menu with space royal theme
        /// </summary>
        public void ShowMainMenu()
        {
            if (mainMenuPrefab != null)
            {
                mainMenuPrefab.SetActive(true);
                StartCoroutine(AnimatePanelSlideIn(mainMenuPrefab));
            }
        }
        
        /// <summary>
        /// Show game HUD with cosmic elements
        /// </summary>
        public void ShowGameHUD()
        {
            if (gameHUDPrefab != null)
            {
                gameHUDPrefab.SetActive(true);
                StartCoroutine(AnimatePanelSlideIn(gameHUDPrefab));
            }
        }
        
        /// <summary>
        /// Show end screen with throne room aesthetic
        /// </summary>
        public void ShowEndScreen()
        {
            if (endScreenPrefab != null)
            {
                endScreenPrefab.SetActive(true);
                StartCoroutine(AnimatePanelSlideIn(endScreenPrefab));
            }
        }
        
        /// <summary>
        /// Show settings panel with space theme
        /// </summary>
        public void ShowSettingsPanel()
        {
            if (settingsPanelPrefab != null)
            {
                settingsPanelPrefab.SetActive(true);
                StartCoroutine(AnimatePanelSlideIn(settingsPanelPrefab));
            }
        }
        
        /// <summary>
        /// Animate panel slide in with space royal effects
        /// </summary>
        private IEnumerator AnimatePanelSlideIn(GameObject panel)
        {
            Vector3 originalPosition = panel.transform.localPosition;
            Vector3 startPosition = originalPosition + Vector3.left * 800f;
            
            panel.transform.localPosition = startPosition;
            
            float elapsed = 0f;
            while (elapsed < animationDuration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / animationDuration;
                panel.transform.localPosition = Vector3.Lerp(startPosition, originalPosition, easeInOutCubic.Evaluate(t));
                yield return null;
            }
            
            panel.transform.localPosition = originalPosition;
        }
        
        /// <summary>
        /// Update score with space royal styling
        /// </summary>
        public void UpdateScore(int score)
        {
            if (scoreText != null)
            {
                scoreText.text = score.ToString();
                StartCoroutine(AnimateScoreUpdate());
            }
        }
        
        /// <summary>
        /// Animate score update with space royal effects
        /// </summary>
        private IEnumerator AnimateScoreUpdate()
        {
            Vector3 originalScale = scoreText.transform.localScale;
            Vector3 targetScale = originalScale * 1.2f;
            
            // Scale up
            float elapsed = 0f;
            while (elapsed < animationDuration * 0.5f)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / (animationDuration * 0.5f);
                scoreText.transform.localScale = Vector3.Lerp(originalScale, targetScale, easeInOutCubic.Evaluate(t));
                yield return null;
            }
            
            // Scale down
            elapsed = 0f;
            while (elapsed < animationDuration * 0.5f)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / (animationDuration * 0.5f);
                scoreText.transform.localScale = Vector3.Lerp(targetScale, originalScale, easeInOutCubic.Evaluate(t));
                yield return null;
            }
            
            scoreText.transform.localScale = originalScale;
        }
        
        /// <summary>
        /// Update moves remaining with cosmic styling
        /// </summary>
        public void UpdateMoves(int moves)
        {
            if (movesText != null)
            {
                movesText.text = moves.ToString();
            }
        }
        
        /// <summary>
        /// Update level with space royal styling
        /// </summary>
        public void UpdateLevel(int level)
        {
            if (levelText != null)
            {
                levelText.text = level.ToString();
            }
        }
        
        /// <summary>
        /// Update progress bar with space royal styling
        /// </summary>
        public void UpdateProgress(float progress)
        {
            if (progressBar != null)
            {
                progressBar.value = progress;
            }
        }
        
        /// <summary>
        /// Play starlight particle effect
        /// </summary>
        public void PlayStarlightEffect()
        {
            if (starlightParticles != null)
            {
                starlightParticles.Play();
            }
        }
        
        /// <summary>
        /// Play energy core effect
        /// </summary>
        public void PlayEnergyCoreEffect()
        {
            if (energyCoreEffect != null)
            {
                energyCoreEffect.Play();
            }
        }
        
        /// <summary>
        /// Play glow pulse effect
        /// </summary>
        public void PlayGlowPulseEffect()
        {
            if (glowPulseEffect != null)
            {
                glowPulseEffect.Play();
            }
        }
        
        /// <summary>
        /// Hide all UI elements
        /// </summary>
        public void HideAllUI()
        {
            if (mainMenuPrefab != null) mainMenuPrefab.SetActive(false);
            if (gameHUDPrefab != null) gameHUDPrefab.SetActive(false);
            if (endScreenPrefab != null) endScreenPrefab.SetActive(false);
            if (settingsPanelPrefab != null) settingsPanelPrefab.SetActive(false);
        }
        
        /// <summary>
        /// Get space royal color by name
        /// </summary>
        public Color GetSpaceRoyalColor(string colorName)
        {
            switch (colorName.ToLower())
            {
                case "deepspacenavy":
                    return deepSpaceNavy;
                case "royalgold":
                    return royalGold;
                case "nebulaviolet":
                    return nebulaViolet;
                case "cosmiccyan":
                    return cosmicCyan;
                default:
                    return Color.white;
            }
        }
    }
}