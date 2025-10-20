using UnityEngine;
using UnityEngine.UI;
using TMPro;
using DG.Tweening;
using System.Collections;
using System.Collections.Generic;

namespace Evergreen.UI
{
    /// <summary>
    /// Complete Match-3 UI System Controller
    /// Manages all UI screens, transitions, and interactions
    /// </summary>
    public class Match3UISystem : MonoBehaviour
    {
        [Header("UI Screens")]
        [SerializeField] private GameObject mainMenuScreen;
        [SerializeField] private GameObject levelSelectionScreen;
        [SerializeField] private GameObject gameplayScreen;
        [SerializeField] private GameObject pauseScreen;
        
        [Header("UI Controllers")]
        [SerializeField] private MainMenuController mainMenuController;
        [SerializeField] private LevelSelectionController levelSelectionController;
        [SerializeField] private GameplayHUDController gameplayHUDController;
        [SerializeField] private PopupController popupController;
        
        [Header("Animation Settings")]
        [SerializeField] private float screenTransitionDuration = 0.5f;
        [SerializeField] private Ease screenTransitionEase = Ease.OutCubic;
        [SerializeField] private float buttonAnimationDuration = 0.2f;
        [SerializeField] private Ease buttonAnimationEase = Ease.OutBack;
        
        [Header("Audio")]
        [SerializeField] private AudioSource audioSource;
        [SerializeField] private AudioClip buttonClickSound;
        [SerializeField] private AudioClip screenTransitionSound;
        
        private GameObject currentScreen;
        private bool isTransitioning = false;
        
        public static Match3UISystem Instance { get; private set; }
        
        // Events
        public System.Action<GameObject> OnScreenChanged;
        public System.Action<string> OnButtonClicked;
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeUI();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            ShowMainMenu();
        }
        
        private void InitializeUI()
        {
            Debug.Log("🎮 Initializing Match-3 UI System...");
            
            // Initialize all UI controllers
            InitializeControllers();
            
            // Setup audio
            if (audioSource == null)
            {
                audioSource = gameObject.AddComponent<AudioSource>();
            }
            
            Debug.Log("✅ Match-3 UI System initialized!");
        }
        
        private void InitializeControllers()
        {
            // Initialize main menu controller
            if (mainMenuController == null)
            {
                mainMenuController = FindObjectOfType<MainMenuController>();
            }
            
            // Initialize level selection controller
            if (levelSelectionController == null)
            {
                levelSelectionController = FindObjectOfType<LevelSelectionController>();
            }
            
            // Initialize gameplay HUD controller
            if (gameplayHUDController == null)
            {
                gameplayHUDController = FindObjectOfType<GameplayHUDController>();
            }
            
            // Initialize popup controller
            if (popupController == null)
            {
                popupController = FindObjectOfType<PopupController>();
            }
        }
        
        #region Screen Management
        
        public void ShowMainMenu()
        {
            ShowScreen(mainMenuScreen);
        }
        
        public void ShowLevelSelection()
        {
            ShowScreen(levelSelectionScreen);
        }
        
        public void ShowGameplay()
        {
            ShowScreen(gameplayScreen);
        }
        
        public void ShowPause()
        {
            ShowScreen(pauseScreen);
        }
        
        private void ShowScreen(GameObject screen)
        {
            if (isTransitioning || screen == null) return;
            
            StartCoroutine(TransitionToScreen(screen));
        }
        
        private IEnumerator TransitionToScreen(GameObject newScreen)
        {
            isTransitioning = true;
            
            // Play transition sound
            PlaySound(screenTransitionSound);
            
            // Hide current screen
            if (currentScreen != null)
            {
                yield return StartCoroutine(FadeOutScreen(currentScreen));
                currentScreen.SetActive(false);
            }
            
            // Show new screen
            newScreen.SetActive(true);
            currentScreen = newScreen;
            
            // Fade in new screen
            yield return StartCoroutine(FadeInScreen(newScreen));
            
            isTransitioning = false;
            
            // Notify listeners
            OnScreenChanged?.Invoke(newScreen);
        }
        
        private IEnumerator FadeOutScreen(GameObject screen)
        {
            var canvasGroup = screen.GetComponent<CanvasGroup>();
            if (canvasGroup == null)
                canvasGroup = screen.AddComponent<CanvasGroup>();
            
            yield return canvasGroup.DOFade(0f, screenTransitionDuration).SetEase(screenTransitionEase).WaitForCompletion();
        }
        
        private IEnumerator FadeInScreen(GameObject screen)
        {
            var canvasGroup = screen.GetComponent<CanvasGroup>();
            if (canvasGroup == null)
                canvasGroup = screen.AddComponent<CanvasGroup>();
            
            canvasGroup.alpha = 0f;
            yield return canvasGroup.DOFade(1f, screenTransitionDuration).SetEase(screenTransitionEase).WaitForCompletion();
        }
        
        #endregion
        
        #region Button Management
        
        public void OnButtonClick(string buttonName)
        {
            if (isTransitioning) return;
            
            PlaySound(buttonClickSound);
            OnButtonClicked?.Invoke(buttonName);
            
            // Handle common button actions
            switch (buttonName)
            {
                case "Play":
                    ShowLevelSelection();
                    break;
                case "Shop":
                    ShowShop();
                    break;
                case "Settings":
                    ShowSettings();
                    break;
                case "Events":
                    ShowEvents();
                    break;
                case "Pause":
                    ShowPause();
                    break;
                case "Resume":
                    ShowGameplay();
                    break;
                case "Restart":
                    RestartLevel();
                    break;
                case "Quit":
                    QuitToMainMenu();
                    break;
            }
        }
        
        public void AnimateButton(Button button)
        {
            if (button == null) return;
            
            // Scale animation
            button.transform.DOScale(0.95f, buttonAnimationDuration * 0.5f)
                .SetEase(buttonAnimationEase)
                .OnComplete(() => {
                    button.transform.DOScale(1f, buttonAnimationDuration * 0.5f)
                        .SetEase(buttonAnimationEase);
                });
        }
        
        #endregion
        
        #region Popup Management
        
        public void ShowRewardPopup(int coins, int gems, int stars)
        {
            if (popupController != null)
            {
                popupController.ShowRewardPopup(coins, gems, stars);
            }
        }
        
        public void ShowConfirmationDialog(string title, string message, System.Action onConfirm, System.Action onCancel = null)
        {
            if (popupController != null)
            {
                popupController.ShowConfirmationDialog(title, message, onConfirm, onCancel);
            }
        }
        
        public void ShowLevelCompletePopup(int stars, int score, int coinsEarned)
        {
            if (popupController != null)
            {
                popupController.ShowLevelCompletePopup(stars, score, coinsEarned);
            }
        }
        
        #endregion
        
        #region Game Actions
        
        private void ShowShop()
        {
            // Implement shop functionality
            Debug.Log("🛒 Opening Shop...");
        }
        
        private void ShowSettings()
        {
            // Implement settings functionality
            Debug.Log("⚙️ Opening Settings...");
        }
        
        private void ShowEvents()
        {
            // Implement events functionality
            Debug.Log("🎉 Opening Events...");
        }
        
        private void RestartLevel()
        {
            // Implement restart level functionality
            Debug.Log("🔄 Restarting Level...");
            ShowGameplay();
        }
        
        private void QuitToMainMenu()
        {
            ShowMainMenu();
        }
        
        #endregion
        
        #region Audio
        
        private void PlaySound(AudioClip clip)
        {
            if (audioSource != null && clip != null)
            {
                audioSource.PlayOneShot(clip);
            }
        }
        
        #endregion
        
        #region Public API
        
        public void UpdatePlayerData(int level, int coins, int gems)
        {
            if (mainMenuController != null)
            {
                mainMenuController.UpdatePlayerData(level, coins, gems);
            }
        }
        
        public void UpdateGameplayData(int moves, int score, int target)
        {
            if (gameplayHUDController != null)
            {
                gameplayHUDController.UpdateGameplayData(moves, score, target);
            }
        }
        
        public void ShowScoreIncrement(int score)
        {
            if (gameplayHUDController != null)
            {
                gameplayHUDController.ShowScoreIncrement(score);
            }
        }
        
        public void ShowStarAnimation(int stars)
        {
            if (gameplayHUDController != null)
            {
                gameplayHUDController.ShowStarAnimation(stars);
            }
        }
        
        #endregion
    }
}