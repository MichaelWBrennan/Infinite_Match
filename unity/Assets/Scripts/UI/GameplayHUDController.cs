using UnityEngine;
using UnityEngine.UI;
using TMPro;
using DG.Tweening;
using System.Collections;
using System.Collections.Generic;

namespace Evergreen.UI
{
    /// <summary>
    /// Gameplay HUD Controller
    /// Handles the in-game HUD with moves, score, boosters, and objectives
    /// </summary>
    public class GameplayHUDController : MonoBehaviour
    {
        [Header("Top HUD Elements")]
        [SerializeField] private TextMeshProUGUI movesText;
        [SerializeField] private TextMeshProUGUI scoreText;
        [SerializeField] private TextMeshProUGUI targetText;
        [SerializeField] private Slider progressSlider;
        [SerializeField] private Button pauseButton;
        
        [Header("Boosters")]
        [SerializeField] private Transform boosterContainer;
        [SerializeField] private GameObject boosterPrefab;
        [SerializeField] private Button[] boosterButtons;
        
        [Header("Objective Display")]
        [SerializeField] private Transform objectiveContainer;
        [SerializeField] private GameObject objectivePrefab;
        [SerializeField] private TextMeshProUGUI objectiveText;
        
        [Header("Score Animation")]
        [SerializeField] private GameObject scoreIncrementPrefab;
        [SerializeField] private Transform scoreAnimationContainer;
        [SerializeField] private float scoreAnimationDuration = 1f;
        [SerializeField] private float scoreAnimationDistance = 100f;
        
        [Header("Star Animation")]
        [SerializeField] private GameObject starPrefab;
        [SerializeField] private Transform starAnimationContainer;
        [SerializeField] private float starAnimationDuration = 1.5f;
        
        [Header("Game Data")]
        [SerializeField] private int currentMoves = 30;
        [SerializeField] private int currentScore = 0;
        [SerializeField] private int targetScore = 5000;
        [SerializeField] private int currentStars = 0;
        
        [Header("Animation Settings")]
        [SerializeField] private float elementAnimationDuration = 0.3f;
        [SerializeField] private Ease elementAnimationEase = Ease.OutBack;
        
        private Match3UISystem uiSystem;
        private List<GameObject> activeScoreAnimations = new List<GameObject>();
        private List<GameObject> activeStarAnimations = new List<GameObject>();
        private bool isInitialized = false;
        
        void Start()
        {
            InitializeGameplayHUD();
        }
        
        private void InitializeGameplayHUD()
        {
            Debug.Log("🎮 Initializing Gameplay HUD...");
            
            // Get UI system reference
            uiSystem = FindObjectOfType<Match3UISystem>();
            
            // Setup button listeners
            SetupButtonListeners();
            
            // Setup boosters
            SetupBoosters();
            
            // Setup objectives
            SetupObjectives();
            
            // Update initial UI
            UpdateGameplayData(currentMoves, currentScore, targetScore);
            
            isInitialized = true;
            Debug.Log("✅ Gameplay HUD initialized!");
        }
        
        private void SetupButtonListeners()
        {
            if (pauseButton != null)
            {
                pauseButton.onClick.AddListener(() => OnPauseButtonClicked());
            }
            
            // Setup booster buttons
            for (int i = 0; i < boosterButtons.Length; i++)
            {
                int boosterIndex = i; // Capture for closure
                if (boosterButtons[i] != null)
                {
                    boosterButtons[i].onClick.AddListener(() => OnBoosterButtonClicked(boosterIndex));
                }
            }
        }
        
        private void SetupBoosters()
        {
            if (boosterContainer == null || boosterPrefab == null) return;
            
            // Clear existing boosters
            foreach (Transform child in boosterContainer)
            {
                DestroyImmediate(child.gameObject);
            }
            
            // Create booster UI elements
            string[] boosterNames = { "Hammer", "Bomb", "Color Bomb", "Striped", "Wrapped" };
            
            for (int i = 0; i < boosterNames.Length; i++)
            {
                CreateBoosterUI(boosterNames[i], i);
            }
        }
        
        private void CreateBoosterUI(string boosterName, int index)
        {
            GameObject boosterObj = Instantiate(boosterPrefab, boosterContainer);
            
            // Setup booster button
            Button boosterButton = boosterObj.GetComponent<Button>();
            if (boosterButton == null)
            {
                boosterButton = boosterObj.AddComponent<Button>();
            }
            
            // Setup booster text
            TextMeshProUGUI boosterText = boosterObj.GetComponentInChildren<TextMeshProUGUI>();
            if (boosterText != null)
            {
                boosterText.text = boosterName;
            }
            
            // Setup booster count
            TextMeshProUGUI countText = boosterObj.transform.Find("Count")?.GetComponent<TextMeshProUGUI>();
            if (countText != null)
            {
                countText.text = "3"; // Default count
            }
            
            // Add click listener
            boosterButton.onClick.AddListener(() => OnBoosterButtonClicked(index));
        }
        
        private void SetupObjectives()
        {
            if (objectiveContainer == null || objectivePrefab == null) return;
            
            // Clear existing objectives
            foreach (Transform child in objectiveContainer)
            {
                DestroyImmediate(child.gameObject);
            }
            
            // Create objective UI elements
            string[] objectives = { "Clear 20 Gems", "Score 5000 Points", "Clear All Jelly" };
            
            for (int i = 0; i < objectives.Length; i++)
            {
                CreateObjectiveUI(objectives[i], i);
            }
        }
        
        private void CreateObjectiveUI(string objectiveText, int index)
        {
            GameObject objectiveObj = Instantiate(objectivePrefab, objectiveContainer);
            
            // Setup objective text
            TextMeshProUGUI text = objectiveObj.GetComponentInChildren<TextMeshProUGUI>();
            if (text != null)
            {
                text.text = objectiveText;
            }
            
            // Setup objective progress
            Slider progressSlider = objectiveObj.GetComponentInChildren<Slider>();
            if (progressSlider != null)
            {
                progressSlider.value = 0f;
            }
        }
        
        #region Button Events
        
        private void OnPauseButtonClicked()
        {
            Debug.Log("⏸️ Pause button clicked!");
            AnimateButton(pauseButton);
            uiSystem?.OnButtonClick("Pause");
        }
        
        private void OnBoosterButtonClicked(int boosterIndex)
        {
            Debug.Log($"💥 Booster {boosterIndex} clicked!");
            AnimateButton(boosterButtons[boosterIndex]);
            // Implement booster logic
        }
        
        #endregion
        
        #region Public API
        
        public void UpdateGameplayData(int moves, int score, int target)
        {
            currentMoves = moves;
            currentScore = score;
            targetScore = target;
            
            UpdateUI();
        }
        
        public void ShowScoreIncrement(int scoreIncrement)
        {
            if (scoreIncrementPrefab == null || scoreAnimationContainer == null) return;
            
            // Create score increment animation
            GameObject scoreObj = Instantiate(scoreIncrementPrefab, scoreAnimationContainer);
            TextMeshProUGUI scoreText = scoreObj.GetComponent<TextMeshProUGUI>();
            
            if (scoreText != null)
            {
                scoreText.text = $"+{scoreIncrement}";
            }
            
            // Animate score increment
            StartCoroutine(AnimateScoreIncrement(scoreObj));
        }
        
        public void ShowStarAnimation(int stars)
        {
            if (starPrefab == null || starAnimationContainer == null) return;
            
            // Create star animation
            GameObject starObj = Instantiate(starPrefab, starAnimationContainer);
            
            // Animate star
            StartCoroutine(AnimateStar(starObj, stars));
        }
        
        public void UpdateMoves(int moves)
        {
            currentMoves = moves;
            UpdateMovesUI();
        }
        
        public void UpdateScore(int score)
        {
            currentScore = score;
            UpdateScoreUI();
        }
        
        public void UpdateTarget(int target)
        {
            targetScore = target;
            UpdateTargetUI();
        }
        
        public void UpdateProgress(float progress)
        {
            if (progressSlider != null)
            {
                progressSlider.value = progress;
            }
        }
        
        #endregion
        
        #region UI Updates
        
        private void UpdateUI()
        {
            UpdateMovesUI();
            UpdateScoreUI();
            UpdateTargetUI();
            UpdateProgressUI();
        }
        
        private void UpdateMovesUI()
        {
            if (movesText != null)
            {
                movesText.text = currentMoves.ToString();
                
                // Animate moves text if low
                if (currentMoves <= 5)
                {
                    movesText.color = Color.red;
                    movesText.transform.DOScale(1.2f, 0.2f)
                        .SetEase(Ease.OutBack)
                        .OnComplete(() => {
                            movesText.transform.DOScale(1f, 0.2f).SetEase(Ease.OutBack);
                        });
                }
                else
                {
                    movesText.color = Color.white;
                }
            }
        }
        
        private void UpdateScoreUI()
        {
            if (scoreText != null)
            {
                scoreText.text = currentScore.ToString("N0");
            }
        }
        
        private void UpdateTargetUI()
        {
            if (targetText != null)
            {
                targetText.text = $"Target: {targetScore:N0}";
            }
        }
        
        private void UpdateProgressUI()
        {
            if (progressSlider != null)
            {
                float progress = Mathf.Clamp01((float)currentScore / targetScore);
                progressSlider.value = progress;
            }
        }
        
        #endregion
        
        #region Animations
        
        private IEnumerator AnimateScoreIncrement(GameObject scoreObj)
        {
            // Initial position
            scoreObj.transform.localPosition = Vector3.zero;
            scoreObj.transform.localScale = Vector3.zero;
            
            // Scale in
            scoreObj.transform.DOScale(1f, 0.2f).SetEase(Ease.OutBack);
            
            // Move up and fade out
            yield return new WaitForSeconds(0.2f);
            
            scoreObj.transform.DOLocalMoveY(scoreAnimationDistance, scoreAnimationDuration).SetEase(Ease.OutQuad);
            scoreObj.GetComponent<CanvasGroup>()?.DOFade(0f, scoreAnimationDuration).SetEase(Ease.OutQuad);
            
            yield return new WaitForSeconds(scoreAnimationDuration);
            
            // Clean up
            activeScoreAnimations.Remove(scoreObj);
            Destroy(scoreObj);
        }
        
        private IEnumerator AnimateStar(GameObject starObj, int stars)
        {
            // Initial position
            starObj.transform.localPosition = Vector3.zero;
            starObj.transform.localScale = Vector3.zero;
            
            // Scale in
            starObj.transform.DOScale(1f, 0.3f).SetEase(Ease.OutBack);
            
            // Rotate and move up
            yield return new WaitForSeconds(0.3f);
            
            starObj.transform.DORotate(new Vector3(0, 0, 360f), starAnimationDuration, RotateMode.FastBeyond360);
            starObj.transform.DOLocalMoveY(starAnimationDistance, starAnimationDuration).SetEase(Ease.OutQuad);
            starObj.GetComponent<CanvasGroup>()?.DOFade(0f, starAnimationDuration).SetEase(Ease.OutQuad);
            
            yield return new WaitForSeconds(starAnimationDuration);
            
            // Clean up
            activeStarAnimations.Remove(starObj);
            Destroy(starObj);
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
        
        #endregion
        
        #region Cleanup
        
        void OnDestroy()
        {
            // Clean up active animations
            foreach (GameObject obj in activeScoreAnimations)
            {
                if (obj != null)
                {
                    Destroy(obj);
                }
            }
            
            foreach (GameObject obj in activeStarAnimations)
            {
                if (obj != null)
                {
                    Destroy(obj);
                }
            }
        }
        
        #endregion
    }
}