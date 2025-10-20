using UnityEngine;
using UnityEngine.UI;
using TMPro;
using DG.Tweening;
using System.Collections;

namespace Evergreen.UI
{
    /// <summary>
    /// Main Menu Controller
    /// Handles the main menu screen with top bar, play button, and side buttons
    /// </summary>
    public class MainMenuController : MonoBehaviour
    {
        [Header("Top Bar Elements")]
        [SerializeField] private Image playerAvatar;
        [SerializeField] private TextMeshProUGUI levelText;
        [SerializeField] private TextMeshProUGUI coinsText;
        [SerializeField] private TextMeshProUGUI gemsText;
        [SerializeField] private Button coinsButton;
        [SerializeField] private Button gemsButton;
        
        [Header("Main Buttons")]
        [SerializeField] private Button playButton;
        [SerializeField] private Button shopButton;
        [SerializeField] private Button eventsButton;
        [SerializeField] private Button settingsButton;
        
        [Header("Background Elements")]
        [SerializeField] private Image backgroundImage;
        [SerializeField] private Transform parallaxLayer1;
        [SerializeField] private Transform parallaxLayer2;
        [SerializeField] private Transform parallaxLayer3;
        
        [Header("Animation Settings")]
        [SerializeField] private float buttonHoverScale = 1.1f;
        [SerializeField] private float buttonHoverDuration = 0.2f;
        [SerializeField] private Ease buttonHoverEase = Ease.OutBack;
        [SerializeField] private float parallaxSpeed = 0.5f;
        
        [Header("Player Data")]
        [SerializeField] private int currentLevel = 1;
        [SerializeField] private int currentCoins = 1000;
        [SerializeField] private int currentGems = 50;
        
        private Match3UISystem uiSystem;
        private bool isInitialized = false;
        
        void Start()
        {
            InitializeMainMenu();
        }
        
        void Update()
        {
            if (isInitialized)
            {
                UpdateParallax();
            }
        }
        
        private void InitializeMainMenu()
        {
            Debug.Log("🏠 Initializing Main Menu...");
            
            // Get UI system reference
            uiSystem = FindObjectOfType<Match3UISystem>();
            
            // Setup button listeners
            SetupButtonListeners();
            
            // Setup button animations
            SetupButtonAnimations();
            
            // Update UI with current data
            UpdatePlayerData(currentLevel, currentCoins, currentGems);
            
            // Start background animations
            StartBackgroundAnimations();
            
            isInitialized = true;
            Debug.Log("✅ Main Menu initialized!");
        }
        
        private void SetupButtonListeners()
        {
            if (playButton != null)
            {
                playButton.onClick.AddListener(() => OnPlayButtonClicked());
            }
            
            if (shopButton != null)
            {
                shopButton.onClick.AddListener(() => OnShopButtonClicked());
            }
            
            if (eventsButton != null)
            {
                eventsButton.onClick.AddListener(() => OnEventsButtonClicked());
            }
            
            if (settingsButton != null)
            {
                settingsButton.onClick.AddListener(() => OnSettingsButtonClicked());
            }
            
            if (coinsButton != null)
            {
                coinsButton.onClick.AddListener(() => OnCoinsButtonClicked());
            }
            
            if (gemsButton != null)
            {
                gemsButton.onClick.AddListener(() => OnGemsButtonClicked());
            }
        }
        
        private void SetupButtonAnimations()
        {
            // Add hover animations to all buttons
            AddButtonHoverAnimation(playButton);
            AddButtonHoverAnimation(shopButton);
            AddButtonHoverAnimation(eventsButton);
            AddButtonHoverAnimation(settingsButton);
            AddButtonHoverAnimation(coinsButton);
            AddButtonHoverAnimation(gemsButton);
        }
        
        private void AddButtonHoverAnimation(Button button)
        {
            if (button == null) return;
            
            var eventTrigger = button.gameObject.AddComponent<UnityEngine.EventSystems.EventTrigger>();
            
            // Pointer Enter
            var pointerEnter = new UnityEngine.EventSystems.EventTrigger.Entry();
            pointerEnter.eventID = UnityEngine.EventSystems.EventTriggerType.PointerEnter;
            pointerEnter.callback.AddListener((data) => {
                button.transform.DOScale(buttonHoverScale, buttonHoverDuration).SetEase(buttonHoverEase);
            });
            eventTrigger.triggers.Add(pointerEnter);
            
            // Pointer Exit
            var pointerExit = new UnityEngine.EventSystems.EventTrigger.Entry();
            pointerExit.eventID = UnityEngine.EventSystems.EventTriggerType.PointerExit;
            pointerExit.callback.AddListener((data) => {
                button.transform.DOScale(1f, buttonHoverDuration).SetEase(buttonHoverEase);
            });
            eventTrigger.triggers.Add(pointerExit);
        }
        
        private void StartBackgroundAnimations()
        {
            // Animate background elements
            if (backgroundImage != null)
            {
                backgroundImage.transform.DOScale(1.05f, 3f)
                    .SetEase(Ease.InOutSine)
                    .SetLoops(-1, LoopType.Yoyo);
            }
        }
        
        private void UpdateParallax()
        {
            // Simple parallax effect
            if (parallaxLayer1 != null)
            {
                parallaxLayer1.Rotate(0, 0, parallaxSpeed * Time.deltaTime);
            }
            
            if (parallaxLayer2 != null)
            {
                parallaxLayer2.Rotate(0, 0, -parallaxSpeed * 0.5f * Time.deltaTime);
            }
            
            if (parallaxLayer3 != null)
            {
                parallaxLayer3.Rotate(0, 0, parallaxSpeed * 0.3f * Time.deltaTime);
            }
        }
        
        #region Button Events
        
        private void OnPlayButtonClicked()
        {
            Debug.Log("🎮 Play button clicked!");
            AnimateButton(playButton);
            uiSystem?.OnButtonClick("Play");
        }
        
        private void OnShopButtonClicked()
        {
            Debug.Log("🛒 Shop button clicked!");
            AnimateButton(shopButton);
            uiSystem?.OnButtonClick("Shop");
        }
        
        private void OnEventsButtonClicked()
        {
            Debug.Log("🎉 Events button clicked!");
            AnimateButton(eventsButton);
            uiSystem?.OnButtonClick("Events");
        }
        
        private void OnSettingsButtonClicked()
        {
            Debug.Log("⚙️ Settings button clicked!");
            AnimateButton(settingsButton);
            uiSystem?.OnButtonClick("Settings");
        }
        
        private void OnCoinsButtonClicked()
        {
            Debug.Log("💰 Coins button clicked!");
            AnimateButton(coinsButton);
            // Show coins shop or add coins
        }
        
        private void OnGemsButtonClicked()
        {
            Debug.Log("💎 Gems button clicked!");
            AnimateButton(gemsButton);
            // Show gems shop or add gems
        }
        
        #endregion
        
        #region Public API
        
        public void UpdatePlayerData(int level, int coins, int gems)
        {
            currentLevel = level;
            currentCoins = coins;
            currentGems = gems;
            
            UpdateUI();
        }
        
        public void AddCoins(int amount)
        {
            currentCoins += amount;
            UpdateUI();
            ShowCoinAnimation(amount);
        }
        
        public void AddGems(int amount)
        {
            currentGems += amount;
            UpdateUI();
            ShowGemAnimation(amount);
        }
        
        public void SetLevel(int level)
        {
            currentLevel = level;
            UpdateUI();
        }
        
        #endregion
        
        #region UI Updates
        
        private void UpdateUI()
        {
            if (levelText != null)
            {
                levelText.text = $"Level {currentLevel}";
            }
            
            if (coinsText != null)
            {
                coinsText.text = currentCoins.ToString("N0");
            }
            
            if (gemsText != null)
            {
                gemsText.text = currentGems.ToString("N0");
            }
        }
        
        private void ShowCoinAnimation(int amount)
        {
            if (coinsText != null)
            {
                // Scale animation for coin text
                coinsText.transform.DOScale(1.2f, 0.2f)
                    .SetEase(Ease.OutBack)
                    .OnComplete(() => {
                        coinsText.transform.DOScale(1f, 0.2f).SetEase(Ease.OutBack);
                    });
            }
        }
        
        private void ShowGemAnimation(int amount)
        {
            if (gemsText != null)
            {
                // Scale animation for gem text
                gemsText.transform.DOScale(1.2f, 0.2f)
                    .SetEase(Ease.OutBack)
                    .OnComplete(() => {
                        gemsText.transform.DOScale(1f, 0.2f).SetEase(Ease.OutBack);
                    });
            }
        }
        
        #endregion
        
        #region Button Animation
        
        private void AnimateButton(Button button)
        {
            if (button == null) return;
            
            // Click animation
            button.transform.DOScale(0.95f, 0.1f)
                .SetEase(Ease.InOutQuad)
                .OnComplete(() => {
                    button.transform.DOScale(1f, 0.1f).SetEase(Ease.OutBack);
                });
        }
        
        #endregion
    }
}