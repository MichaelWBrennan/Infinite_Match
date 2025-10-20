using UnityEngine;
using UnityEngine.UI;
using TMPro;
using DG.Tweening;
using System.Collections;
using System.Collections.Generic;

namespace Evergreen.UI
{
    /// <summary>
    /// Level Selection Controller
    /// Handles the level selection screen with scrollable level map and preview popups
    /// </summary>
    public class LevelSelectionController : MonoBehaviour
    {
        [Header("Level Map")]
        [SerializeField] private ScrollRect levelScrollRect;
        [SerializeField] private Transform levelContainer;
        [SerializeField] private GameObject levelNodePrefab;
        [SerializeField] private int totalLevels = 100;
        [SerializeField] private int levelsPerRow = 5;
        [SerializeField] private float levelSpacing = 200f;
        
        [Header("Level Preview Popup")]
        [SerializeField] private GameObject levelPreviewPopup;
        [SerializeField] private TextMeshProUGUI previewLevelText;
        [SerializeField] private TextMeshProUGUI previewObjectiveText;
        [SerializeField] private TextMeshProUGUI previewRewardText;
        [SerializeField] private Image previewLevelImage;
        [SerializeField] private Button previewPlayButton;
        [SerializeField] private Button previewCloseButton;
        
        [Header("Level Stars")]
        [SerializeField] private GameObject starPrefab;
        [SerializeField] private Transform starContainer;
        [SerializeField] private Color starEarnedColor = Color.yellow;
        [SerializeField] private Color starLockedColor = Color.gray;
        
        [Header("Animation Settings")]
        [SerializeField] private float scrollSmoothTime = 0.3f;
        [SerializeField] private float popupAnimationDuration = 0.3f;
        [SerializeField] private Ease popupAnimationEase = Ease.OutBack;
        
        [Header("Level Data")]
        [SerializeField] private int currentUnlockedLevel = 1;
        [SerializeField] private int selectedLevel = 1;
        
        private List<LevelNode> levelNodes = new List<LevelNode>();
        private Match3UISystem uiSystem;
        private bool isInitialized = false;
        
        [System.Serializable]
        public class LevelData
        {
            public int levelNumber;
            public bool isUnlocked;
            public int starsEarned;
            public string objective;
            public int coinReward;
            public int gemReward;
            public Sprite levelPreview;
        }
        
        void Start()
        {
            InitializeLevelSelection();
        }
        
        private void InitializeLevelSelection()
        {
            Debug.Log("🗺️ Initializing Level Selection...");
            
            // Get UI system reference
            uiSystem = FindObjectOfType<Match3UISystem>();
            
            // Create level nodes
            CreateLevelNodes();
            
            // Setup level preview popup
            SetupLevelPreviewPopup();
            
            // Update level states
            UpdateLevelStates();
            
            isInitialized = true;
            Debug.Log("✅ Level Selection initialized!");
        }
        
        private void CreateLevelNodes()
        {
            if (levelContainer == null || levelNodePrefab == null) return;
            
            // Clear existing nodes
            foreach (Transform child in levelContainer)
            {
                DestroyImmediate(child.gameObject);
            }
            levelNodes.Clear();
            
            // Create level nodes
            for (int i = 1; i <= totalLevels; i++)
            {
                CreateLevelNode(i);
            }
            
            // Arrange nodes in grid
            ArrangeLevelNodes();
        }
        
        private void CreateLevelNode(int levelNumber)
        {
            // Instantiate level node
            GameObject nodeObj = Instantiate(levelNodePrefab, levelContainer);
            LevelNode levelNode = nodeObj.GetComponent<LevelNode>();
            
            if (levelNode == null)
            {
                levelNode = nodeObj.AddComponent<LevelNode>();
            }
            
            // Setup level node
            levelNode.SetupLevelNode(levelNumber, this);
            levelNodes.Add(levelNode);
        }
        
        private void ArrangeLevelNodes()
        {
            for (int i = 0; i < levelNodes.Count; i++)
            {
                int row = i / levelsPerRow;
                int col = i % levelsPerRow;
                
                Vector3 position = new Vector3(
                    col * levelSpacing - (levelsPerRow - 1) * levelSpacing * 0.5f,
                    -row * levelSpacing,
                    0
                );
                
                levelNodes[i].transform.localPosition = position;
            }
        }
        
        private void SetupLevelPreviewPopup()
        {
            if (levelPreviewPopup == null) return;
            
            // Setup preview popup buttons
            if (previewPlayButton != null)
            {
                previewPlayButton.onClick.AddListener(() => OnPreviewPlayButtonClicked());
            }
            
            if (previewCloseButton != null)
            {
                previewCloseButton.onClick.AddListener(() => OnPreviewCloseButtonClicked());
            }
            
            // Initially hide popup
            levelPreviewPopup.SetActive(false);
        }
        
        private void UpdateLevelStates()
        {
            for (int i = 0; i < levelNodes.Count; i++)
            {
                int levelNumber = i + 1;
                bool isUnlocked = levelNumber <= currentUnlockedLevel;
                int starsEarned = GetStarsEarned(levelNumber);
                
                levelNodes[i].SetLevelState(isUnlocked, starsEarned);
            }
        }
        
        private int GetStarsEarned(int levelNumber)
        {
            // This would typically come from save data
            // For now, return random stars for demo
            if (levelNumber > currentUnlockedLevel) return 0;
            return Random.Range(0, 4); // 0-3 stars
        }
        
        #region Level Node Events
        
        public void OnLevelNodeClicked(int levelNumber)
        {
            if (levelNumber > currentUnlockedLevel)
            {
                Debug.Log($"🔒 Level {levelNumber} is locked!");
                return;
            }
            
            selectedLevel = levelNumber;
            ShowLevelPreview(levelNumber);
        }
        
        #endregion
        
        #region Level Preview
        
        private void ShowLevelPreview(int levelNumber)
        {
            if (levelPreviewPopup == null) return;
            
            // Update preview content
            UpdatePreviewContent(levelNumber);
            
            // Show popup with animation
            levelPreviewPopup.SetActive(true);
            AnimatePopupIn(levelPreviewPopup);
        }
        
        private void UpdatePreviewContent(int levelNumber)
        {
            if (previewLevelText != null)
            {
                previewLevelText.text = $"Level {levelNumber}";
            }
            
            if (previewObjectiveText != null)
            {
                previewObjectiveText.text = GetLevelObjective(levelNumber);
            }
            
            if (previewRewardText != null)
            {
                int coinReward = GetLevelCoinReward(levelNumber);
                int gemReward = GetLevelGemReward(levelNumber);
                previewRewardText.text = $"Rewards: {coinReward} Coins, {gemReward} Gems";
            }
            
            if (previewLevelImage != null)
            {
                // Set level preview image
                Sprite levelPreview = GetLevelPreviewImage(levelNumber);
                if (levelPreview != null)
                {
                    previewLevelImage.sprite = levelPreview;
                }
            }
        }
        
        private string GetLevelObjective(int levelNumber)
        {
            // This would typically come from level data
            string[] objectives = {
                "Clear 20 gems in 30 moves",
                "Score 5000 points",
                "Clear all jelly",
                "Collect 10 special candies",
                "Clear 15 gems in 25 moves"
            };
            
            return objectives[levelNumber % objectives.Length];
        }
        
        private int GetLevelCoinReward(int levelNumber)
        {
            return 100 + (levelNumber * 10);
        }
        
        private int GetLevelGemReward(int levelNumber)
        {
            return levelNumber % 5 == 0 ? 1 : 0;
        }
        
        private Sprite GetLevelPreviewImage(int levelNumber)
        {
            // This would typically load from resources
            return null;
        }
        
        #endregion
        
        #region Popup Events
        
        private void OnPreviewPlayButtonClicked()
        {
            Debug.Log($"🎮 Starting Level {selectedLevel}!");
            AnimateButton(previewPlayButton);
            
            // Close popup and start level
            StartCoroutine(StartLevelAfterDelay());
        }
        
        private void OnPreviewCloseButtonClicked()
        {
            Debug.Log("❌ Closing level preview");
            AnimateButton(previewCloseButton);
            CloseLevelPreview();
        }
        
        private IEnumerator StartLevelAfterDelay()
        {
            yield return new WaitForSeconds(0.2f);
            CloseLevelPreview();
            uiSystem?.OnButtonClick("StartLevel");
        }
        
        private void CloseLevelPreview()
        {
            if (levelPreviewPopup == null) return;
            
            AnimatePopupOut(levelPreviewPopup, () => {
                levelPreviewPopup.SetActive(false);
            });
        }
        
        #endregion
        
        #region Animations
        
        private void AnimatePopupIn(GameObject popup)
        {
            popup.transform.localScale = Vector3.zero;
            popup.transform.DOScale(1f, popupAnimationDuration).SetEase(popupAnimationEase);
        }
        
        private void AnimatePopupOut(GameObject popup, System.Action onComplete = null)
        {
            popup.transform.DOScale(0f, popupAnimationDuration).SetEase(popupAnimationEase)
                .OnComplete(() => onComplete?.Invoke());
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
        
        #region Public API
        
        public void UnlockLevel(int levelNumber)
        {
            if (levelNumber > currentUnlockedLevel)
            {
                currentUnlockedLevel = levelNumber;
                UpdateLevelStates();
            }
        }
        
        public void SetLevelStars(int levelNumber, int stars)
        {
            if (levelNumber > 0 && levelNumber <= levelNodes.Count)
            {
                levelNodes[levelNumber - 1].SetStars(stars);
            }
        }
        
        public void ScrollToLevel(int levelNumber)
        {
            if (levelScrollRect == null) return;
            
            int row = (levelNumber - 1) / levelsPerRow;
            float normalizedPosition = (float)row / ((totalLevels - 1) / levelsPerRow);
            
            DOTween.To(() => levelScrollRect.verticalNormalizedPosition, 
                      x => levelScrollRect.verticalNormalizedPosition = x, 
                      1f - normalizedPosition, 
                      scrollSmoothTime);
        }
        
        #endregion
    }
    
    /// <summary>
    /// Individual Level Node Component
    /// </summary>
    public class LevelNode : MonoBehaviour
    {
        [Header("Level Node Elements")]
        [SerializeField] private Button levelButton;
        [SerializeField] private TextMeshProUGUI levelNumberText;
        [SerializeField] private Image levelIcon;
        [SerializeField] private Transform starContainer;
        [SerializeField] private GameObject starPrefab;
        
        [Header("Visual States")]
        [SerializeField] private Color unlockedColor = Color.white;
        [SerializeField] private Color lockedColor = Color.gray;
        [SerializeField] private Color selectedColor = Color.yellow;
        
        private int levelNumber;
        private bool isUnlocked;
        private int starsEarned;
        private LevelSelectionController controller;
        
        public void SetupLevelNode(int levelNum, LevelSelectionController levelController)
        {
            levelNumber = levelNum;
            controller = levelController;
            
            // Setup button
            if (levelButton == null)
            {
                levelButton = GetComponent<Button>();
            }
            
            if (levelButton != null)
            {
                levelButton.onClick.AddListener(() => OnLevelClicked());
            }
            
            // Setup text
            if (levelNumberText == null)
            {
                levelNumberText = GetComponentInChildren<TextMeshProUGUI>();
            }
            
            if (levelNumberText != null)
            {
                levelNumberText.text = levelNumber.ToString();
            }
            
            // Setup stars
            SetupStars();
        }
        
        private void SetupStars()
        {
            if (starContainer == null || starPrefab == null) return;
            
            // Clear existing stars
            foreach (Transform child in starContainer)
            {
                DestroyImmediate(child.gameObject);
            }
            
            // Create 3 stars
            for (int i = 0; i < 3; i++)
            {
                GameObject star = Instantiate(starPrefab, starContainer);
                star.SetActive(false);
            }
        }
        
        public void SetLevelState(bool unlocked, int stars)
        {
            isUnlocked = unlocked;
            starsEarned = stars;
            
            // Update visual state
            UpdateVisualState();
            UpdateStars();
        }
        
        private void UpdateVisualState()
        {
            if (levelIcon != null)
            {
                levelIcon.color = isUnlocked ? unlockedColor : lockedColor;
            }
            
            if (levelNumberText != null)
            {
                levelNumberText.color = isUnlocked ? Color.white : Color.gray;
            }
        }
        
        private void UpdateStars()
        {
            if (starContainer == null) return;
            
            for (int i = 0; i < starContainer.childCount; i++)
            {
                GameObject star = starContainer.GetChild(i).gameObject;
                star.SetActive(isUnlocked && i < starsEarned);
            }
        }
        
        public void SetStars(int stars)
        {
            starsEarned = Mathf.Clamp(stars, 0, 3);
            UpdateStars();
        }
        
        private void OnLevelClicked()
        {
            controller?.OnLevelNodeClicked(levelNumber);
        }
    }
}