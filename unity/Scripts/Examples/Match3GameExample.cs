using UnityEngine;
using Match3Game.Core;
using Match3Game.Analytics;
using Match3Game.CloudServices;
using Match3Game.Integration;
using System.Collections;
using System.Collections.Generic;

namespace Match3Game.Examples
{
    /// <summary>
    /// Complete Match 3 Game Example
    /// Demonstrates how to integrate all SDKs in a real Match 3 game
    /// </summary>
    public class Match3GameExample : MonoBehaviour
    {
        [Header("Game Components")]
        [SerializeField] private GameManager gameManager;
        [SerializeField] private GameAnalyticsManager analyticsManager;
        [SerializeField] private CloudSaveManager cloudSaveManager;
        [SerializeField] private UnityToWebGLAnalytics webglAnalytics;
        
        [Header("Game Board")]
        [SerializeField] private GameObject[,] gameBoard = new GameObject[8, 8];
        [SerializeField] private GameObject[] gemPrefabs;
        [SerializeField] private Transform boardParent;
        
        [Header("Game State")]
        [SerializeField] private int currentLevel = 1;
        [SerializeField] private int targetScore = 1000;
        [SerializeField] private int movesRemaining = 30;
        [SerializeField] private float levelTimeLimit = 60f;
        
        [Header("UI References")]
        [SerializeField] private UnityEngine.UI.Text scoreText;
        [SerializeField] private UnityEngine.UI.Text movesText;
        [SerializeField] private UnityEngine.UI.Text levelText;
        [SerializeField] private UnityEngine.UI.Text timerText;
        [SerializeField] private UnityEngine.UI.Button pauseButton;
        [SerializeField] private UnityEngine.UI.Button powerUpButton;
        
        private float levelStartTime;
        private bool isGameActive = false;
        private bool isPaused = false;
        private List<Vector2Int> selectedGems = new List<Vector2Int>();
        
        private void Start()
        {
            InitializeGame();
            SetupEventListeners();
            StartNewLevel(currentLevel);
        }
        
        private void InitializeGame()
        {
            // Initialize game manager
            if (!gameManager)
                gameManager = FindObjectOfType<GameManager>();
            
            if (!analyticsManager)
                analyticsManager = FindObjectOfType<GameAnalyticsManager>();
            
            if (!cloudSaveManager)
                cloudSaveManager = FindObjectOfType<CloudSaveManager>();
            
            if (!webglAnalytics)
                webglAnalytics = FindObjectOfType<UnityToWebGLAnalytics>();
            
            // Initialize board
            InitializeBoard();
            
            Debug.Log("Match 3 Game Example initialized");
        }
        
        private void SetupEventListeners()
        {
            // Game Manager events
            if (gameManager)
            {
                gameManager.OnLevelChanged += OnLevelChanged;
                gameManager.OnScoreChanged += OnScoreChanged;
                gameManager.OnLivesChanged += OnLivesChanged;
                gameManager.OnGameOver += OnGameOver;
                gameManager.OnGameWin += OnGameWin;
            }
            
            // UI events
            if (pauseButton)
                pauseButton.onClick.AddListener(TogglePause);
            
            if (powerUpButton)
                powerUpButton.onClick.AddListener(UsePowerUp);
        }
        
        private void InitializeBoard()
        {
            // Create 8x8 game board
            for (int x = 0; x < 8; x++)
            {
                for (int y = 0; y < 8; y++)
                {
                    GameObject gem = CreateRandomGem();
                    gem.transform.SetParent(boardParent);
                    gem.transform.localPosition = new Vector3(x, y, 0);
                    
                    // Add click handler
                    GemClickHandler clickHandler = gem.AddComponent<GemClickHandler>();
                    clickHandler.Initialize(this, new Vector2Int(x, y));
                    
                    gameBoard[x, y] = gem;
                }
            }
        }
        
        private GameObject CreateRandomGem()
        {
            int randomIndex = Random.Range(0, gemPrefabs.Length);
            return Instantiate(gemPrefabs[randomIndex]);
        }
        
        public void StartNewLevel(int level)
        {
            currentLevel = level;
            targetScore = level * 1000; // Increase target score with level
            movesRemaining = 30;
            levelTimeLimit = 60f + (level * 5f); // Increase time limit with level
            levelStartTime = Time.time;
            isGameActive = true;
            isPaused = false;
            
            // Update UI
            UpdateUI();
            
            // Track level start
            TrackLevelStart();
            
            Debug.Log($"Level {level} started - Target: {targetScore}, Moves: {movesRemaining}");
        }
        
        public void OnGemClicked(Vector2Int position)
        {
            if (!isGameActive || isPaused) return;
            
            // Add to selection
            selectedGems.Add(position);
            
            // Visual feedback
            HighlightGem(position, true);
            
            // Check for match when 3+ gems selected
            if (selectedGems.Count >= 3)
            {
                CheckForMatch();
            }
        }
        
        private void CheckForMatch()
        {
            if (selectedGems.Count < 3) return;
            
            // Simple match detection (same type in a row)
            bool isMatch = IsValidMatch(selectedGems);
            
            if (isMatch)
            {
                ProcessMatch(selectedGems);
            }
            else
            {
                // Clear selection
                ClearSelection();
            }
        }
        
        private bool IsValidMatch(List<Vector2Int> gems)
        {
            if (gems.Count < 3) return false;
            
            // Check if gems are in a straight line
            bool isHorizontal = true;
            bool isVertical = true;
            
            for (int i = 1; i < gems.Count; i++)
            {
                if (gems[i].x != gems[0].x) isHorizontal = false;
                if (gems[i].y != gems[0].y) isVertical = false;
            }
            
            return isHorizontal || isVertical;
        }
        
        private void ProcessMatch(List<Vector2Int> matchedGems)
        {
            int matchType = GetMatchType(matchedGems);
            int scoreGained = CalculateScore(matchedGems);
            Vector3 matchPosition = GetMatchPosition(matchedGems);
            
            // Update game state
            gameManager.AddScore(scoreGained);
            gameManager.UseMove();
            movesRemaining--;
            
            // Track match
            TrackMatch(matchType, matchedGems.Count, matchPosition, scoreGained);
            
            // Remove matched gems
            foreach (Vector2Int pos in matchedGems)
            {
                if (gameBoard[pos.x, pos.y] != null)
                {
                    Destroy(gameBoard[pos.x, pos.y]);
                    gameBoard[pos.x, pos.y] = null;
                }
            }
            
            // Clear selection
            ClearSelection();
            
            // Check for level completion
            if (gameManager.GetCurrentScore() >= targetScore)
            {
                CompleteLevel();
            }
            else if (movesRemaining <= 0)
            {
                GameOver();
            }
            
            // Update UI
            UpdateUI();
        }
        
        private int GetMatchType(List<Vector2Int> gems)
        {
            // Return match type based on number of gems
            if (gems.Count >= 5) return 3; // 5+ gems = special match
            if (gems.Count == 4) return 2; // 4 gems = good match
            return 1; // 3 gems = normal match
        }
        
        private int CalculateScore(List<Vector2Int> gems)
        {
            int baseScore = gems.Count * 100;
            int levelMultiplier = currentLevel;
            return baseScore * levelMultiplier;
        }
        
        private Vector3 GetMatchPosition(List<Vector2Int> gems)
        {
            Vector3 center = Vector3.zero;
            foreach (Vector2Int pos in gems)
            {
                center += new Vector3(pos.x, pos.y, 0);
            }
            return center / gems.Count;
        }
        
        private void ClearSelection()
        {
            foreach (Vector2Int pos in selectedGems)
            {
                HighlightGem(pos, false);
            }
            selectedGems.Clear();
        }
        
        private void HighlightGem(Vector2Int position, bool highlight)
        {
            if (gameBoard[position.x, position.y] != null)
            {
                // Add visual highlight effect
                SpriteRenderer renderer = gameBoard[position.x, position.y].GetComponent<SpriteRenderer>();
                if (renderer)
                {
                    renderer.color = highlight ? Color.yellow : Color.white;
                }
            }
        }
        
        private void CompleteLevel()
        {
            isGameActive = false;
            float timeSpent = Time.time - levelStartTime;
            int stars = CalculateStars(timeSpent);
            
            // Track level completion
            TrackLevelComplete(stars);
            
            // Update game manager
            gameManager.CompleteLevel(targetScore, stars);
            
            Debug.Log($"Level {currentLevel} completed! Stars: {stars}");
            
            // Show level complete UI
            ShowLevelCompleteUI(stars);
        }
        
        private int CalculateStars(float timeSpent)
        {
            float timeRatio = timeSpent / levelTimeLimit;
            if (timeRatio <= 0.5f) return 3; // Fast completion
            if (timeRatio <= 0.8f) return 2; // Good completion
            return 1; // Slow completion
        }
        
        private void GameOver()
        {
            isGameActive = false;
            
            // Track game over
            TrackGameOver();
            
            // Update game manager
            gameManager.LoseLife();
            
            Debug.Log("Game Over!");
            
            // Show game over UI
            ShowGameOverUI();
        }
        
        private void UsePowerUp()
        {
            if (!isGameActive || isPaused) return;
            
            string powerUpType = "bomb"; // Example power-up
            Vector3 powerUpPosition = GetRandomGemPosition();
            int cost = 50;
            
            // Track power-up usage
            TrackPowerUpUsed(powerUpType, powerUpPosition, cost);
            
            // Apply power-up effect
            ApplyPowerUpEffect(powerUpType, powerUpPosition);
            
            Debug.Log($"Power-up used: {powerUpType}");
        }
        
        private Vector3 GetRandomGemPosition()
        {
            // Find a random gem on the board
            List<Vector2Int> availableGems = new List<Vector2Int>();
            for (int x = 0; x < 8; x++)
            {
                for (int y = 0; y < 8; y++)
                {
                    if (gameBoard[x, y] != null)
                    {
                        availableGems.Add(new Vector2Int(x, y));
                    }
                }
            }
            
            if (availableGems.Count > 0)
            {
                Vector2Int randomPos = availableGems[Random.Range(0, availableGems.Count)];
                return new Vector3(randomPos.x, randomPos.y, 0);
            }
            
            return Vector3.zero;
        }
        
        private void ApplyPowerUpEffect(string powerUpType, Vector3 position)
        {
            // Apply bomb effect - destroy gems in 3x3 area
            if (powerUpType == "bomb")
            {
                int centerX = Mathf.RoundToInt(position.x);
                int centerY = Mathf.RoundToInt(position.y);
                
                for (int x = centerX - 1; x <= centerX + 1; x++)
                {
                    for (int y = centerY - 1; y <= centerY + 1; y++)
                    {
                        if (x >= 0 && x < 8 && y >= 0 && y < 8 && gameBoard[x, y] != null)
                        {
                            Destroy(gameBoard[x, y]);
                            gameBoard[x, y] = null;
                        }
                    }
                }
            }
        }
        
        private void TogglePause()
        {
            isPaused = !isPaused;
            Time.timeScale = isPaused ? 0f : 1f;
            
            // Track pause/resume
            TrackPauseResume(isPaused);
            
            Debug.Log(isPaused ? "Game Paused" : "Game Resumed");
        }
        
        private void UpdateUI()
        {
            if (scoreText)
                scoreText.text = $"Score: {gameManager.GetCurrentScore()}";
            
            if (movesText)
                movesText.text = $"Moves: {movesRemaining}";
            
            if (levelText)
                levelText.text = $"Level: {currentLevel}";
            
            if (timerText)
            {
                float timeRemaining = levelTimeLimit - (Time.time - levelStartTime);
                timerText.text = $"Time: {Mathf.Max(0, timeRemaining):F1}s";
            }
        }
        
        private void Update()
        {
            if (isGameActive && !isPaused)
            {
                // Check time limit
                if (Time.time - levelStartTime >= levelTimeLimit)
                {
                    GameOver();
                }
                
                // Update UI
                UpdateUI();
            }
        }
        
        #region Analytics Tracking
        
        private void TrackLevelStart()
        {
            // Unity Analytics
            if (analyticsManager)
            {
                analyticsManager.TrackLevelStart(currentLevel);
            }
            
            // WebGL Analytics
            if (webglAnalytics)
            {
                webglAnalytics.TrackGameStart(currentLevel, "normal");
            }
        }
        
        private void TrackLevelComplete(int stars)
        {
            float timeSpent = Time.time - levelStartTime;
            
            // Unity Analytics
            if (analyticsManager)
            {
                analyticsManager.TrackLevelComplete(currentLevel, targetScore, timeSpent, 30 - movesRemaining);
            }
            
            // WebGL Analytics
            if (webglAnalytics)
            {
                webglAnalytics.TrackLevelComplete(currentLevel, targetScore, timeSpent, 30 - movesRemaining, stars, 0);
            }
        }
        
        private void TrackMatch(int matchType, int piecesMatched, Vector3 position, int scoreGained)
        {
            // Unity Analytics
            if (analyticsManager)
            {
                analyticsManager.TrackMatch(matchType, piecesMatched, position);
            }
            
            // WebGL Analytics
            if (webglAnalytics)
            {
                webglAnalytics.TrackMatchMade(matchType, piecesMatched, position, scoreGained);
            }
        }
        
        private void TrackPowerUpUsed(string powerUpType, Vector3 position, int cost)
        {
            // Unity Analytics
            if (analyticsManager)
            {
                analyticsManager.TrackPowerUpUsed(powerUpType, currentLevel, position);
            }
            
            // WebGL Analytics
            if (webglAnalytics)
            {
                webglAnalytics.TrackPowerUpUsed(powerUpType, currentLevel, position, cost);
            }
        }
        
        private void TrackGameOver()
        {
            // Unity Analytics
            if (analyticsManager)
            {
                analyticsManager.TrackCustomEvent("game_over", new Dictionary<string, object>
                {
                    {"level", currentLevel},
                    {"score", gameManager.GetCurrentScore()},
                    {"moves_used", 30 - movesRemaining},
                    {"time_spent", Time.time - levelStartTime}
                });
            }
            
            // WebGL Analytics
            if (webglAnalytics)
            {
                webglAnalytics.TrackCustomEvent("game_over", new Dictionary<string, object>
                {
                    {"level", currentLevel},
                    {"score", gameManager.GetCurrentScore()},
                    {"moves_used", 30 - movesRemaining},
                    {"time_spent", Time.time - levelStartTime}
                });
            }
        }
        
        private void TrackPauseResume(bool isPaused)
        {
            string eventName = isPaused ? "game_paused" : "game_resumed";
            
            // Unity Analytics
            if (analyticsManager)
            {
                analyticsManager.TrackCustomEvent(eventName, new Dictionary<string, object>
                {
                    {"level", currentLevel},
                    {"score", gameManager.GetCurrentScore()}
                });
            }
            
            // WebGL Analytics
            if (webglAnalytics)
            {
                webglAnalytics.TrackCustomEvent(eventName, new Dictionary<string, object>
                {
                    {"level", currentLevel},
                    {"score", gameManager.GetCurrentScore()}
                });
            }
        }
        
        #endregion
        
        #region Event Handlers
        
        private void OnLevelChanged(int level)
        {
            Debug.Log($"Level changed to: {level}");
        }
        
        private void OnScoreChanged(int score)
        {
            Debug.Log($"Score changed to: {score}");
        }
        
        private void OnLivesChanged(int lives)
        {
            Debug.Log($"Lives changed to: {lives}");
        }
        
        private void OnGameOver()
        {
            Debug.Log("Game Over event received");
        }
        
        private void OnGameWin()
        {
            Debug.Log("Game Win event received");
        }
        
        #endregion
        
        #region UI Methods
        
        private void ShowLevelCompleteUI(int stars)
        {
            // Implement level complete UI
            Debug.Log($"Level Complete! Stars: {stars}");
        }
        
        private void ShowGameOverUI()
        {
            // Implement game over UI
            Debug.Log("Game Over UI shown");
        }
        
        #endregion
    }
    
    /// <summary>
    /// Handles gem click events
    /// </summary>
    public class GemClickHandler : MonoBehaviour
    {
        private Match3GameExample game;
        private Vector2Int position;
        
        public void Initialize(Match3GameExample gameInstance, Vector2Int gemPosition)
        {
            game = gameInstance;
            position = gemPosition;
        }
        
        private void OnMouseDown()
        {
            if (game != null)
            {
                game.OnGemClicked(position);
            }
        }
    }
}