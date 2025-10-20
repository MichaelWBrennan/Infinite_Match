using UnityEngine;
using UnityEngine.UI;
using TMPro;
using DG.Tweening;
using System.Collections;
using System.Collections.Generic;
using Evergreen.HybridGameplay;

namespace Evergreen.UI
{
    /// <summary>
    /// Royal Match Style UI Manager
    /// Creates and manages high-quality, pre-built UI panels like Royal Match
    /// </summary>
    public class RoyalMatchUIManager : MonoBehaviour
    {
        [Header("Royal Match UI Panels")]
        [SerializeField] private GameObject mainMenuPanel;
        [SerializeField] private GameObject gameplayPanel;
        [SerializeField] private GameObject shopPanel;
        [SerializeField] private GameObject settingsPanel;
        [SerializeField] private GameObject pausePanel;
        [SerializeField] private GameObject levelCompletePanel;
        [SerializeField] private GameObject gameOverPanel;
        [SerializeField] private GameObject boostersPanel;
        [SerializeField] private GameObject dailyRewardsPanel;
        [SerializeField] private GameObject eventsPanel;
        [SerializeField] private GameObject leaderboardPanel;
        [SerializeField] private GameObject profilePanel;
        
        [Header("Royal Match UI Elements")]
        [SerializeField] private TextMeshProUGUI levelText;
        [SerializeField] private TextMeshProUGUI scoreText;
        [SerializeField] private TextMeshProUGUI movesText;
        [SerializeField] private TextMeshProUGUI coinsText;
        [SerializeField] private TextMeshProUGUI gemsText;
        [SerializeField] private Slider levelProgressSlider;
        
        [Header("Royal Match Buttons")]
        [SerializeField] private Button playButton;
        [SerializeField] private Button shopButton;
        [SerializeField] private Button settingsButton;
        [SerializeField] private Button pauseButton;
        [SerializeField] private Button boostersButton;
        [SerializeField] private Button dailyRewardsButton;
        [SerializeField] private Button eventsButton;
        [SerializeField] private Button leaderboardButton;
        [SerializeField] private Button profileButton;
        
        [Header("Royal Match Animations")]
        [SerializeField] private float buttonScaleDuration = 0.2f;
        [SerializeField] private float panelTransitionDuration = 0.3f;
        [SerializeField] private Ease buttonScaleEase = Ease.OutBack;
        [SerializeField] private Ease panelTransitionEase = Ease.OutCubic;
        
        [Header("Royal Match Colors")]
        [SerializeField] private Color royalBlue = new Color(0.2f, 0.6f, 0.9f, 1f);
        [SerializeField] private Color royalGold = new Color(1f, 0.8f, 0.2f, 1f);
        [SerializeField] private Color royalPurple = new Color(0.7f, 0.3f, 0.9f, 1f);
        [SerializeField] private Color royalGreen = new Color(0.4f, 0.8f, 0.4f, 1f);
        [SerializeField] private Color royalRed = new Color(0.9f, 0.3f, 0.3f, 1f);
        
        private Dictionary<string, GameObject> uiPanels = new Dictionary<string, GameObject>();
        private GameObject currentPanel;
        private bool isTransitioning = false;
        
        public static RoyalMatchUIManager Instance { get; private set; }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeRoyalMatchUI();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            SetupRoyalMatchUI();
            ShowMainMenu();
        }
        
        private void InitializeRoyalMatchUI()
        {
            Debug.Log("👑 Initializing Royal Match UI Manager...");
            
            // Register all UI panels
            RegisterUIPanels();
            
            // Setup button listeners
            SetupButtonListeners();
            
            // Apply Royal Match styling
            ApplyRoyalMatchStyling();
            
            Debug.Log("✅ Royal Match UI Manager initialized!");
        }
        
        private void RegisterUIPanels()
        {
            var panels = new Dictionary<string, GameObject>
            {
                ["main_menu"] = mainMenuPanel,
                ["gameplay"] = gameplayPanel,
                ["shop"] = shopPanel,
                ["settings"] = settingsPanel,
                ["pause"] = pausePanel,
                ["level_complete"] = levelCompletePanel,
                ["game_over"] = gameOverPanel,
                ["boosters"] = boostersPanel,
                ["daily_rewards"] = dailyRewardsPanel,
                ["events"] = eventsPanel,
                ["leaderboard"] = leaderboardPanel,
                ["profile"] = profilePanel
            };
            
            foreach (var kvp in panels)
            {
                if (kvp.Value != null)
                {
                    uiPanels[kvp.Key] = kvp.Value;
                    // Initially hide all panels
                    kvp.Value.SetActive(false);
                    Debug.Log($"✅ Registered Royal Match Panel: {kvp.Key}");
                }
                else
                {
                    Debug.LogError($"❌ Royal Match Panel '{kvp.Key}' is not assigned! Please assign all UI panels in the Inspector.");
                }
            }
        }
        
        private void SetupButtonListeners()
        {
            if (playButton != null) playButton.onClick.AddListener(() => OnPlayButtonClicked());
            if (shopButton != null) shopButton.onClick.AddListener(() => OnShopButtonClicked());
            if (settingsButton != null) settingsButton.onClick.AddListener(() => OnSettingsButtonClicked());
            if (pauseButton != null) pauseButton.onClick.AddListener(() => OnPauseButtonClicked());
            if (boostersButton != null) boostersButton.onClick.AddListener(() => OnBoostersButtonClicked());
            if (dailyRewardsButton != null) dailyRewardsButton.onClick.AddListener(() => OnDailyRewardsButtonClicked());
            if (eventsButton != null) eventsButton.onClick.AddListener(() => OnEventsButtonClicked());
            if (leaderboardButton != null) leaderboardButton.onClick.AddListener(() => OnLeaderboardButtonClicked());
            if (profileButton != null) profileButton.onClick.AddListener(() => OnProfileButtonClicked());
        }
        
        private void ApplyRoyalMatchStyling()
        {
            // Apply Royal Match color scheme to buttons
            ApplyRoyalMatchButtonStyling();
            
            // Apply Royal Match typography
            ApplyRoyalMatchTypography();
            
            // Apply Royal Match animations
            ApplyRoyalMatchAnimations();
        }
        
        private void ApplyRoyalMatchButtonStyling()
        {
            var buttons = new Button[] { playButton, shopButton, settingsButton, pauseButton, 
                                       boostersButton, dailyRewardsButton, eventsButton, 
                                       leaderboardButton, profileButton };
            
            foreach (var button in buttons)
            {
                if (button != null)
                {
                    var colors = button.colors;
                    colors.normalColor = royalBlue;
                    colors.highlightedColor = Color.Lerp(royalBlue, Color.white, 0.2f);
                    colors.pressedColor = Color.Lerp(royalBlue, Color.black, 0.2f);
                    colors.selectedColor = royalGold;
                    button.colors = colors;
                }
            }
        }
        
        private void ApplyRoyalMatchTypography()
        {
            var texts = new TextMeshProUGUI[] { levelText, scoreText, movesText, coinsText, gemsText };
            
            foreach (var text in texts)
            {
                if (text != null)
                {
                    text.color = Color.white;
                    text.fontStyle = FontStyles.Bold;
                }
            }
        }
        
        private void ApplyRoyalMatchAnimations()
        {
            // Add hover animations to buttons
            var buttons = new Button[] { playButton, shopButton, settingsButton, pauseButton, 
                                       boostersButton, dailyRewardsButton, eventsButton, 
                                       leaderboardButton, profileButton };
            
            foreach (var button in buttons)
            {
                if (button != null)
                {
                    AddButtonHoverAnimation(button);
                }
            }
        }
        
        private void AddButtonHoverAnimation(Button button)
        {
            var eventTrigger = button.gameObject.AddComponent<UnityEngine.EventSystems.EventTrigger>();
            
            // Pointer Enter
            var pointerEnter = new UnityEngine.EventSystems.EventTrigger.Entry();
            pointerEnter.eventID = UnityEngine.EventSystems.EventTriggerType.PointerEnter;
            pointerEnter.callback.AddListener((data) => {
                button.transform.DOScale(1.1f, buttonScaleDuration).SetEase(buttonScaleEase);
            });
            eventTrigger.triggers.Add(pointerEnter);
            
            // Pointer Exit
            var pointerExit = new UnityEngine.EventSystems.EventTrigger.Entry();
            pointerExit.eventID = UnityEngine.EventSystems.EventTriggerType.PointerExit;
            pointerExit.callback.AddListener((data) => {
                button.transform.DOScale(1f, buttonScaleDuration).SetEase(buttonScaleEase);
            });
            eventTrigger.triggers.Add(pointerExit);
        }
        
        #region Panel Management
        
        public void ShowMainMenu()
        {
            ShowPanel("main_menu");
        }
        
        public void ShowGameplay()
        {
            ShowPanel("gameplay");
        }
        
        public void ShowShop()
        {
            ShowPanel("shop");
        }
        
        public void ShowSettings()
        {
            ShowPanel("settings");
        }
        
        public void ShowPause()
        {
            ShowPanel("pause");
        }
        
        public void ShowLevelComplete()
        {
            ShowPanel("level_complete");
        }
        
        public void ShowGameOver()
        {
            ShowPanel("game_over");
        }
        
        public void ShowBoosters()
        {
            ShowPanel("boosters");
        }
        
        public void ShowDailyRewards()
        {
            ShowPanel("daily_rewards");
        }
        
        public void ShowEvents()
        {
            ShowPanel("events");
        }
        
        public void ShowLeaderboard()
        {
            ShowPanel("leaderboard");
        }
        
        public void ShowProfile()
        {
            ShowPanel("profile");
        }
        
        private void ShowPanel(string panelName)
        {
            if (isTransitioning) return;
            
            if (!uiPanels.ContainsKey(panelName))
            {
                Debug.LogError($"❌ Royal Match Panel '{panelName}' not found!");
                return;
            }
            
            var panel = uiPanels[panelName];
            if (panel == null)
            {
                Debug.LogError($"❌ Royal Match Panel '{panelName}' is null!");
                return;
            }
            
            StartCoroutine(TransitionToPanel(panel));
        }
        
        private IEnumerator TransitionToPanel(GameObject newPanel)
        {
            isTransitioning = true;
            
            // Hide current panel
            if (currentPanel != null)
            {
                yield return StartCoroutine(FadeOutPanel(currentPanel));
                currentPanel.SetActive(false);
            }
            
            // Show new panel
            newPanel.SetActive(true);
            currentPanel = newPanel;
            
            // Fade in new panel
            yield return StartCoroutine(FadeInPanel(newPanel));
            
            isTransitioning = false;
        }
        
        private IEnumerator FadeOutPanel(GameObject panel)
        {
            var canvasGroup = panel.GetComponent<CanvasGroup>();
            if (canvasGroup == null)
                canvasGroup = panel.AddComponent<CanvasGroup>();
            
            yield return canvasGroup.DOFade(0f, panelTransitionDuration).SetEase(panelTransitionEase).WaitForCompletion();
        }
        
        private IEnumerator FadeInPanel(GameObject panel)
        {
            var canvasGroup = panel.GetComponent<CanvasGroup>();
            if (canvasGroup == null)
                canvasGroup = panel.AddComponent<CanvasGroup>();
            
            canvasGroup.alpha = 0f;
            yield return canvasGroup.DOFade(1f, panelTransitionDuration).SetEase(panelTransitionEase).WaitForCompletion();
        }
        
        #endregion
        
        #region Button Events
        
        private void OnPlayButtonClicked()
        {
            Debug.Log("🎮 Play button clicked - Royal Match style!");
            PlayButtonClickAnimation(playButton);
            ShowGameplay();
        }
        
        private void OnShopButtonClicked()
        {
            Debug.Log("🛒 Shop button clicked - Royal Match style!");
            PlayButtonClickAnimation(shopButton);
            ShowShop();
        }
        
        private void OnSettingsButtonClicked()
        {
            Debug.Log("⚙️ Settings button clicked - Royal Match style!");
            PlayButtonClickAnimation(settingsButton);
            ShowSettings();
        }
        
        private void OnPauseButtonClicked()
        {
            Debug.Log("⏸️ Pause button clicked - Royal Match style!");
            PlayButtonClickAnimation(pauseButton);
            ShowPause();
        }
        
        private void OnBoostersButtonClicked()
        {
            Debug.Log("💥 Boosters button clicked - Royal Match style!");
            PlayButtonClickAnimation(boostersButton);
            ShowBoosters();
        }
        
        private void OnDailyRewardsButtonClicked()
        {
            Debug.Log("🎁 Daily Rewards button clicked - Royal Match style!");
            PlayButtonClickAnimation(dailyRewardsButton);
            ShowDailyRewards();
        }
        
        private void OnEventsButtonClicked()
        {
            Debug.Log("🎉 Events button clicked - Royal Match style!");
            PlayButtonClickAnimation(eventsButton);
            ShowEvents();
        }
        
        private void OnLeaderboardButtonClicked()
        {
            Debug.Log("🏆 Leaderboard button clicked - Royal Match style!");
            PlayButtonClickAnimation(leaderboardButton);
            ShowLeaderboard();
        }
        
        private void OnProfileButtonClicked()
        {
            Debug.Log("👤 Profile button clicked - Royal Match style!");
            PlayButtonClickAnimation(profileButton);
            ShowProfile();
        }
        
        private void PlayButtonClickAnimation(Button button)
        {
            if (button != null)
            {
                button.transform.DOScale(0.95f, 0.1f).SetEase(Ease.InOutQuad)
                    .OnComplete(() => button.transform.DOScale(1f, 0.1f).SetEase(Ease.OutBack));
            }
        }
        
        #endregion
        
        #region Game Data Updates
        
        public void UpdateLevel(int level)
        {
            if (levelText != null)
                levelText.text = $"Level {level}";
        }
        
        public void UpdateScore(int score)
        {
            if (scoreText != null)
                scoreText.text = score.ToString("N0");
        }
        
        public void UpdateMoves(int moves)
        {
            if (movesText != null)
                movesText.text = moves.ToString();
        }
        
        public void UpdateCoins(int coins)
        {
            if (coinsText != null)
                coinsText.text = coins.ToString("N0");
        }
        
        public void UpdateGems(int gems)
        {
            if (gemsText != null)
                gemsText.text = gems.ToString("N0");
        }
        
        public void UpdateLevelProgress(float progress)
        {
            if (levelProgressSlider != null)
                levelProgressSlider.value = progress;
        }
        
        #endregion
        
        #region Feature Management
        
        public void EnableAllFeatures()
        {
            Debug.Log("👑 Enabling all Royal Match features...");
            
            // Enable hybrid gameplay features
            var hybridManager = FindObjectOfType<HybridGameplayManager>();
            if (hybridManager != null)
            {
                hybridManager.EnableFeature(FeatureType.RPG, true);
                hybridManager.EnableFeature(FeatureType.Racing, true);
                hybridManager.EnableFeature(FeatureType.Strategy, true);
                hybridManager.EnableFeature(FeatureType.HybridModes, true);
                Debug.Log("✅ All hybrid gameplay features enabled");
            }
            
            Debug.Log("🎉 All Royal Match features enabled!");
        }
        
        public void CheckUIStatus()
        {
            Debug.Log("🔍 Royal Match UI Status:");
            Debug.Log($"Current Panel: {(_currentPanel != null ? _currentPanel.name : "None")}");
            Debug.Log($"Total Panels: {uiPanels.Count}");
            
            foreach (var kvp in uiPanels)
            {
                var status = kvp.Value != null ? (kvp.Value.activeInHierarchy ? "✅ Active" : "⏸️ Inactive") : "❌ Null";
                Debug.Log($"  {kvp.Key}: {status}");
            }
        }
        
        #endregion
        
        private void SetupRoyalMatchUI()
        {
            // Initialize with sample data
            UpdateLevel(1);
            UpdateScore(0);
            UpdateMoves(20);
            UpdateCoins(100);
            UpdateGems(50);
            UpdateLevelProgress(0f);
        }
    }
}