using UnityEngine;
using UnityEngine.UI;
using TMPro;
using DG.Tweening;
using System.Collections;
using System.Collections.Generic;

namespace Evergreen.UI
{
    /// <summary>
    /// Popup Controller
    /// Handles all popups, dialogs, and animated transitions
    /// </summary>
    public class PopupController : MonoBehaviour
    {
        [Header("Reward Popup")]
        [SerializeField] private GameObject rewardPopup;
        [SerializeField] private TextMeshProUGUI rewardCoinsText;
        [SerializeField] private TextMeshProUGUI rewardGemsText;
        [SerializeField] private TextMeshProUGUI rewardStarsText;
        [SerializeField] private Button rewardCollectButton;
        [SerializeField] private Image rewardCoinsImage;
        [SerializeField] private Image rewardGemsImage;
        [SerializeField] private Image rewardStarsImage;
        
        [Header("Confirmation Dialog")]
        [SerializeField] private GameObject confirmationDialog;
        [SerializeField] private TextMeshProUGUI confirmationTitleText;
        [SerializeField] private TextMeshProUGUI confirmationMessageText;
        [SerializeField] private Button confirmationYesButton;
        [SerializeField] private Button confirmationNoButton;
        
        [Header("Level Complete Popup")]
        [SerializeField] private GameObject levelCompletePopup;
        [SerializeField] private TextMeshProUGUI levelCompleteTitleText;
        [SerializeField] private TextMeshProUGUI levelCompleteScoreText;
        [SerializeField] private TextMeshProUGUI levelCompleteCoinsText;
        [SerializeField] private Transform levelCompleteStarsContainer;
        [SerializeField] private Button levelCompleteNextButton;
        [SerializeField] private Button levelCompleteReplayButton;
        [SerializeField] private Button levelCompleteHomeButton;
        
        [Header("Particle Effects")]
        [SerializeField] private ParticleSystem coinParticles;
        [SerializeField] private ParticleSystem gemParticles;
        [SerializeField] private ParticleSystem starParticles;
        [SerializeField] private ParticleSystem confettiParticles;
        
        [Header("Animation Settings")]
        [SerializeField] private float popupAnimationDuration = 0.5f;
        [SerializeField] private Ease popupAnimationEase = Ease.OutBack;
        [SerializeField] private float elementAnimationDelay = 0.1f;
        [SerializeField] private float particleEffectDuration = 2f;
        
        [Header("Star Animation")]
        [SerializeField] private GameObject starPrefab;
        [SerializeField] private Transform starAnimationContainer;
        [SerializeField] private float starAnimationDuration = 1f;
        [SerializeField] private float starAnimationDistance = 200f;
        
        private Match3UISystem uiSystem;
        private List<GameObject> activePopups = new List<GameObject>();
        private bool isInitialized = false;
        
        void Start()
        {
            InitializePopupController();
        }
        
        private void InitializePopupController()
        {
            Debug.Log("💬 Initializing Popup Controller...");
            
            // Get UI system reference
            uiSystem = FindObjectOfType<Match3UISystem>();
            
            // Setup popup buttons
            SetupPopupButtons();
            
            // Initially hide all popups
            HideAllPopups();
            
            isInitialized = true;
            Debug.Log("✅ Popup Controller initialized!");
        }
        
        private void SetupPopupButtons()
        {
            // Reward popup buttons
            if (rewardCollectButton != null)
            {
                rewardCollectButton.onClick.AddListener(() => OnRewardCollectButtonClicked());
            }
            
            // Confirmation dialog buttons
            if (confirmationYesButton != null)
            {
                confirmationYesButton.onClick.AddListener(() => OnConfirmationYesButtonClicked());
            }
            
            if (confirmationNoButton != null)
            {
                confirmationNoButton.onClick.AddListener(() => OnConfirmationNoButtonClicked());
            }
            
            // Level complete popup buttons
            if (levelCompleteNextButton != null)
            {
                levelCompleteNextButton.onClick.AddListener(() => OnLevelCompleteNextButtonClicked());
            }
            
            if (levelCompleteReplayButton != null)
            {
                levelCompleteReplayButton.onClick.AddListener(() => OnLevelCompleteReplayButtonClicked());
            }
            
            if (levelCompleteHomeButton != null)
            {
                levelCompleteHomeButton.onClick.AddListener(() => OnLevelCompleteHomeButtonClicked());
            }
        }
        
        private void HideAllPopups()
        {
            if (rewardPopup != null) rewardPopup.SetActive(false);
            if (confirmationDialog != null) confirmationDialog.SetActive(false);
            if (levelCompletePopup != null) levelCompletePopup.SetActive(false);
        }
        
        #region Reward Popup
        
        public void ShowRewardPopup(int coins, int gems, int stars)
        {
            if (rewardPopup == null) return;
            
            Debug.Log($"🎁 Showing reward popup: {coins} coins, {gems} gems, {stars} stars");
            
            // Update reward text
            UpdateRewardText(coins, gems, stars);
            
            // Show popup with animation
            rewardPopup.SetActive(true);
            AnimatePopupIn(rewardPopup);
            
            // Play particle effects
            PlayRewardParticles(coins, gems, stars);
            
            // Add to active popups
            if (!activePopups.Contains(rewardPopup))
            {
                activePopups.Add(rewardPopup);
            }
        }
        
        private void UpdateRewardText(int coins, int gems, int stars)
        {
            if (rewardCoinsText != null)
            {
                rewardCoinsText.text = $"+{coins}";
            }
            
            if (rewardGemsText != null)
            {
                rewardGemsText.text = $"+{gems}";
            }
            
            if (rewardStarsText != null)
            {
                rewardStarsText.text = $"+{stars}";
            }
        }
        
        private void PlayRewardParticles(int coins, int gems, int stars)
        {
            // Play coin particles
            if (coinParticles != null && coins > 0)
            {
                StartCoroutine(PlayParticleEffect(coinParticles));
            }
            
            // Play gem particles
            if (gemParticles != null && gems > 0)
            {
                StartCoroutine(PlayParticleEffect(gemParticles));
            }
            
            // Play star particles
            if (starParticles != null && stars > 0)
            {
                StartCoroutine(PlayParticleEffect(starParticles));
            }
        }
        
        #endregion
        
        #region Confirmation Dialog
        
        public void ShowConfirmationDialog(string title, string message, System.Action onConfirm, System.Action onCancel = null)
        {
            if (confirmationDialog == null) return;
            
            Debug.Log($"❓ Showing confirmation dialog: {title}");
            
            // Update dialog text
            if (confirmationTitleText != null)
            {
                confirmationTitleText.text = title;
            }
            
            if (confirmationMessageText != null)
            {
                confirmationMessageText.text = message;
            }
            
            // Store callbacks
            this.onConfirmCallback = onConfirm;
            this.onCancelCallback = onCancel;
            
            // Show dialog with animation
            confirmationDialog.SetActive(true);
            AnimatePopupIn(confirmationDialog);
            
            // Add to active popups
            if (!activePopups.Contains(confirmationDialog))
            {
                activePopups.Add(confirmationDialog);
            }
        }
        
        private System.Action onConfirmCallback;
        private System.Action onCancelCallback;
        
        #endregion
        
        #region Level Complete Popup
        
        public void ShowLevelCompletePopup(int stars, int score, int coinsEarned)
        {
            if (levelCompletePopup == null) return;
            
            Debug.Log($"🏆 Showing level complete popup: {stars} stars, {score} score, {coinsEarned} coins");
            
            // Update popup content
            UpdateLevelCompleteContent(stars, score, coinsEarned);
            
            // Show popup with animation
            levelCompletePopup.SetActive(true);
            AnimatePopupIn(levelCompletePopup);
            
            // Animate stars
            StartCoroutine(AnimateLevelCompleteStars(stars));
            
            // Play confetti
            if (confettiParticles != null)
            {
                StartCoroutine(PlayParticleEffect(confettiParticles));
            }
            
            // Add to active popups
            if (!activePopups.Contains(levelCompletePopup))
            {
                activePopups.Add(levelCompletePopup);
            }
        }
        
        private void UpdateLevelCompleteContent(int stars, int score, int coinsEarned)
        {
            if (levelCompleteTitleText != null)
            {
                levelCompleteTitleText.text = "Level Complete!";
            }
            
            if (levelCompleteScoreText != null)
            {
                levelCompleteScoreText.text = $"Score: {score:N0}";
            }
            
            if (levelCompleteCoinsText != null)
            {
                levelCompleteCoinsText.text = $"Coins Earned: {coinsEarned}";
            }
        }
        
        private IEnumerator AnimateLevelCompleteStars(int stars)
        {
            if (levelCompleteStarsContainer == null || starPrefab == null) yield break;
            
            // Clear existing stars
            foreach (Transform child in levelCompleteStarsContainer)
            {
                DestroyImmediate(child.gameObject);
            }
            
            // Create and animate stars
            for (int i = 0; i < 3; i++)
            {
                GameObject star = Instantiate(starPrefab, levelCompleteStarsContainer);
                star.SetActive(i < stars);
                
                if (i < stars)
                {
                    // Animate star
                    star.transform.localScale = Vector3.zero;
                    star.transform.DOScale(1f, 0.3f).SetEase(Ease.OutBack).SetDelay(i * 0.2f);
                }
                
                yield return new WaitForSeconds(0.1f);
            }
        }
        
        #endregion
        
        #region Button Events
        
        private void OnRewardCollectButtonClicked()
        {
            Debug.Log("💰 Reward collected!");
            AnimateButton(rewardCollectButton);
            CloseRewardPopup();
        }
        
        private void OnConfirmationYesButtonClicked()
        {
            Debug.Log("✅ Confirmation: Yes");
            AnimateButton(confirmationYesButton);
            onConfirmCallback?.Invoke();
            CloseConfirmationDialog();
        }
        
        private void OnConfirmationNoButtonClicked()
        {
            Debug.Log("❌ Confirmation: No");
            AnimateButton(confirmationNoButton);
            onCancelCallback?.Invoke();
            CloseConfirmationDialog();
        }
        
        private void OnLevelCompleteNextButtonClicked()
        {
            Debug.Log("➡️ Next level!");
            AnimateButton(levelCompleteNextButton);
            CloseLevelCompletePopup();
            uiSystem?.OnButtonClick("NextLevel");
        }
        
        private void OnLevelCompleteReplayButtonClicked()
        {
            Debug.Log("🔄 Replay level!");
            AnimateButton(levelCompleteReplayButton);
            CloseLevelCompletePopup();
            uiSystem?.OnButtonClick("ReplayLevel");
        }
        
        private void OnLevelCompleteHomeButtonClicked()
        {
            Debug.Log("🏠 Go home!");
            AnimateButton(levelCompleteHomeButton);
            CloseLevelCompletePopup();
            uiSystem?.OnButtonClick("Home");
        }
        
        #endregion
        
        #region Popup Management
        
        private void CloseRewardPopup()
        {
            if (rewardPopup == null) return;
            
            AnimatePopupOut(rewardPopup, () => {
                rewardPopup.SetActive(false);
                activePopups.Remove(rewardPopup);
            });
        }
        
        private void CloseConfirmationDialog()
        {
            if (confirmationDialog == null) return;
            
            AnimatePopupOut(confirmationDialog, () => {
                confirmationDialog.SetActive(false);
                activePopups.Remove(confirmationDialog);
            });
        }
        
        private void CloseLevelCompletePopup()
        {
            if (levelCompletePopup == null) return;
            
            AnimatePopupOut(levelCompletePopup, () => {
                levelCompletePopup.SetActive(false);
                activePopups.Remove(levelCompletePopup);
            });
        }
        
        public void CloseAllPopups()
        {
            foreach (GameObject popup in activePopups.ToArray())
            {
                if (popup != null)
                {
                    AnimatePopupOut(popup, () => {
                        popup.SetActive(false);
                        activePopups.Remove(popup);
                    });
                }
            }
        }
        
        #endregion
        
        #region Animations
        
        private void AnimatePopupIn(GameObject popup)
        {
            popup.transform.localScale = Vector3.zero;
            popup.transform.DOScale(1f, popupAnimationDuration).SetEase(popupAnimationEase);
            
            // Fade in background
            CanvasGroup canvasGroup = popup.GetComponent<CanvasGroup>();
            if (canvasGroup == null)
            {
                canvasGroup = popup.AddComponent<CanvasGroup>();
            }
            
            canvasGroup.alpha = 0f;
            canvasGroup.DOFade(1f, popupAnimationDuration).SetEase(Ease.OutQuad);
        }
        
        private void AnimatePopupOut(GameObject popup, System.Action onComplete = null)
        {
            popup.transform.DOScale(0f, popupAnimationDuration).SetEase(Ease.InBack)
                .OnComplete(() => onComplete?.Invoke());
            
            // Fade out background
            CanvasGroup canvasGroup = popup.GetComponent<CanvasGroup>();
            if (canvasGroup != null)
            {
                canvasGroup.DOFade(0f, popupAnimationDuration).SetEase(Ease.InQuad);
            }
        }
        
        private void AnimateButton(Button button)
        {
            if (button == null) return;
            
            button.transform.DOScale(0.95f, 0.1f)
                .SetEase(Ease.InOutQuad)
                .OnComplete(() => {
                    button.transform.DOScale(1f, 0.1f).SetEase(Ease.OutBack);
                });
        }
        
        private IEnumerator PlayParticleEffect(ParticleSystem particles)
        {
            if (particles == null) yield break;
            
            particles.Play();
            yield return new WaitForSeconds(particleEffectDuration);
            particles.Stop();
        }
        
        #endregion
        
        #region Cleanup
        
        void OnDestroy()
        {
            // Clean up active popups
            foreach (GameObject popup in activePopups)
            {
                if (popup != null)
                {
                    Destroy(popup);
                }
            }
        }
        
        #endregion
    }
}