using UnityEngine;
using Match3Game.Analytics;
using Match3Game.CloudServices;
using Match3Game.Integration;
using System.Collections;
using System.Collections.Generic;

namespace Match3Game.Core
{
    /// <summary>
    /// Main Game Manager for Match 3 Game
    /// Integrates all analytics, cloud services, and game logic
    /// </summary>
    public class GameManager : MonoBehaviour
    {
        [Header("Game Configuration")]
        [SerializeField] private int startingLevel = 1;
        [SerializeField] private int startingLives = 5;
        [SerializeField] private int startingScore = 0;
        
        [Header("Analytics & Services")]
        [SerializeField] private GameAnalyticsManager analyticsManager;
        [SerializeField] private CloudSaveManager cloudSaveManager;
        [SerializeField] private UnityToWebGLAnalytics webglAnalytics;
        
        [Header("Game State")]
        [SerializeField] private int currentLevel;
        [SerializeField] private int currentScore;
        [SerializeField] private int currentLives;
        [SerializeField] private int starsEarned;
        [SerializeField] private float levelStartTime;
        [SerializeField] private int movesUsed;
        [SerializeField] private int powerupsUsed;
        
        // Game data
        private PlayerProgressData playerProgress;
        private GameSettingsData gameSettings;
        private GameStatisticsData statistics;
        
        // Events
        public System.Action<int> OnLevelChanged;
        public System.Action<int> OnScoreChanged;
        public System.Action<int> OnLivesChanged;
        public System.Action<int> OnStarsEarned;
        public System.Action OnGameOver;
        public System.Action OnGameWin;
        
        private void Start()
        {
            InitializeGame();
        }
        
        private async void InitializeGame()
        {
            try
            {
                // Initialize game state
                currentLevel = startingLevel;
                currentScore = startingScore;
                currentLives = startingLives;
                starsEarned = 0;
                movesUsed = 0;
                powerupsUsed = 0;
                
                // Load saved data from cloud
                if (cloudSaveManager && cloudSaveManager.IsInitialized())
                {
                    await LoadGameData();
                }
                
                // Initialize analytics
                if (analyticsManager)
                {
                    analyticsManager.SetLevel(currentLevel);
                }
                
                // Initialize WebGL analytics
                if (webglAnalytics)
                {
                    webglAnalytics.SetLevel(currentLevel);
                    webglAnalytics.TrackGameStart(currentLevel, "normal");
                }
                
                // Start level
                StartLevel(currentLevel);
                
                Debug.Log("Game initialized successfully");
                
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to initialize game: {e.Message}");
                TrackError("game_initialization_error", e.Message, e.StackTrace);
            }
        }
        
        private async System.Threading.Tasks.Task LoadGameData()
        {
            try
            {
                // Load player progress
                playerProgress = await cloudSaveManager.LoadPlayerProgress();
                if (playerProgress.currentLevel > 0)
                {
                    currentLevel = playerProgress.currentLevel;
                    currentScore = playerProgress.totalScore;
                    currentLives = playerProgress.livesRemaining;
                }
                
                // Load game settings
                gameSettings = await cloudSaveManager.LoadGameSettings();
                ApplyGameSettings();
                
                // Load statistics
                statistics = await cloudSaveManager.LoadStatistics();
                
                Debug.Log("Game data loaded from cloud");
                
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to load game data: {e.Message}");
                // Continue with default values
            }
        }
        
        private void ApplyGameSettings()
        {
            if (gameSettings == null) return;
            
            // Apply sound settings
            AudioListener.volume = gameSettings.soundEnabled ? 1.0f : 0.0f;
            
            // Apply graphics quality
            QualitySettings.SetQualityLevel(gameSettings.graphicsQuality);
            
            // Apply other settings as needed
            Debug.Log("Game settings applied");
        }
        
        public void StartLevel(int level)
        {
            currentLevel = level;
            levelStartTime = Time.time;
            movesUsed = 0;
            powerupsUsed = 0;
            
            // Track level start
            if (analyticsManager)
            {
                analyticsManager.TrackLevelStart(level);
            }
            
            if (webglAnalytics)
            {
                webglAnalytics.TrackGameStart(level, "normal");
            }
            
            OnLevelChanged?.Invoke(level);
            
            Debug.Log($"Level {level} started");
        }
        
        public void CompleteLevel(int score, int stars = 0)
        {
            float timeSpent = Time.time - levelStartTime;
            
            // Update game state
            currentScore += score;
            starsEarned += stars;
            
            // Track level completion
            if (analyticsManager)
            {
                analyticsManager.TrackLevelComplete(currentLevel, score, timeSpent, movesUsed);
            }
            
            if (webglAnalytics)
            {
                webglAnalytics.TrackLevelComplete(currentLevel, score, timeSpent, movesUsed, stars, powerupsUsed);
            }
            
            // Update statistics
            if (statistics != null)
            {
                statistics.levelsCompleted++;
                statistics.totalPlayTime += timeSpent;
                statistics.bestScore = Mathf.Max(statistics.bestScore, currentScore);
            }
            
            // Save progress
            SaveGameProgress();
            
            OnScoreChanged?.Invoke(currentScore);
            OnStarsEarned?.Invoke(stars);
            
            Debug.Log($"Level {currentLevel} completed - Score: {score}, Time: {timeSpent:F2}s");
            
            // Check for game completion
            if (currentLevel >= 100) // Assuming 100 levels
            {
                OnGameWin?.Invoke();
            }
        }
        
        public void TrackMatch(int matchType, int piecesMatched, Vector3 position, int scoreGained = 0)
        {
            // Track match
            if (analyticsManager)
            {
                analyticsManager.TrackMatch(matchType, piecesMatched, position);
            }
            
            if (webglAnalytics)
            {
                webglAnalytics.TrackMatchMade(matchType, piecesMatched, position, scoreGained);
            }
            
            // Update statistics
            if (statistics != null)
            {
                statistics.matchesMade++;
            }
            
            // Add score
            if (scoreGained > 0)
            {
                AddScore(scoreGained);
            }
        }
        
        public void UsePowerUp(string powerUpType, Vector3 position, int cost = 0)
        {
            powerupsUsed++;
            
            // Track power-up usage
            if (analyticsManager)
            {
                analyticsManager.TrackPowerUpUsed(powerUpType, currentLevel, position);
            }
            
            if (webglAnalytics)
            {
                webglAnalytics.TrackPowerUpUsed(powerUpType, currentLevel, position, cost);
            }
            
            // Update statistics
            if (statistics != null)
            {
                statistics.powerupsUsed++;
            }
            
            Debug.Log($"Power-up used: {powerUpType}");
        }
        
        public void MakePurchase(string itemId, string currency, float amount, string transactionId = "")
        {
            // Track purchase
            if (analyticsManager)
            {
                analyticsManager.TrackPurchase(itemId, currency, amount);
            }
            
            if (webglAnalytics)
            {
                webglAnalytics.TrackPurchase(itemId, currency, amount, transactionId);
            }
            
            Debug.Log($"Purchase made: {itemId} for {amount} {currency}");
        }
        
        public void LoseLife()
        {
            currentLives--;
            OnLivesChanged?.Invoke(currentLives);
            
            if (currentLives <= 0)
            {
                GameOver();
            }
            
            Debug.Log($"Life lost. Lives remaining: {currentLives}");
        }
        
        public void AddLife()
        {
            currentLives++;
            OnLivesChanged?.Invoke(currentLives);
            Debug.Log($"Life added. Lives: {currentLives}");
        }
        
        public void AddScore(int score)
        {
            currentScore += score;
            OnScoreChanged?.Invoke(currentScore);
        }
        
        public void UseMove()
        {
            movesUsed++;
        }
        
        private void GameOver()
        {
            // Track game over
            if (analyticsManager)
            {
                analyticsManager.TrackCustomEvent("game_over", new Dictionary<string, object>
                {
                    {"level", currentLevel},
                    {"score", currentScore},
                    {"moves_used", movesUsed},
                    {"powerups_used", powerupsUsed}
                });
            }
            
            if (webglAnalytics)
            {
                webglAnalytics.TrackCustomEvent("game_over", new Dictionary<string, object>
                {
                    {"level", currentLevel},
                    {"score", currentScore},
                    {"moves_used", movesUsed},
                    {"powerups_used", powerupsUsed}
                });
            }
            
            // Update statistics
            if (statistics != null)
            {
                statistics.gamesPlayed++;
            }
            
            OnGameOver?.Invoke();
            Debug.Log("Game Over");
        }
        
        private async void SaveGameProgress()
        {
            try
            {
                // Update player progress
                playerProgress = new PlayerProgressData
                {
                    currentLevel = currentLevel + 1,
                    totalScore = currentScore,
                    starsEarned = starsEarned,
                    livesRemaining = currentLives
                };
                
                // Save to cloud
                if (cloudSaveManager && cloudSaveManager.IsInitialized())
                {
                    await cloudSaveManager.SavePlayerProgress(playerProgress);
                    await cloudSaveManager.SaveStatistics(statistics);
                }
                
                Debug.Log("Game progress saved");
                
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to save game progress: {e.Message}");
            }
        }
        
        private void TrackError(string errorType, string errorMessage, string stackTrace = "")
        {
            if (analyticsManager)
            {
                analyticsManager.TrackError(errorType, errorMessage, stackTrace);
            }
            
            if (webglAnalytics)
            {
                webglAnalytics.TrackError(errorType, errorMessage, stackTrace);
            }
        }
        
        #region Public API
        
        public PlayerProgressData GetPlayerProgress()
        {
            return playerProgress ?? new PlayerProgressData();
        }
        
        public void SetPlayerProgress(PlayerProgressData progress)
        {
            playerProgress = progress;
            currentLevel = progress.currentLevel;
            currentScore = progress.totalScore;
            currentLives = progress.livesRemaining;
            starsEarned = progress.starsEarned;
        }
        
        public GameSettingsData GetGameSettings()
        {
            return gameSettings ?? new GameSettingsData();
        }
        
        public void SetGameSettings(GameSettingsData settings)
        {
            gameSettings = settings;
            ApplyGameSettings();
        }
        
        public GameStatisticsData GetStatistics()
        {
            return statistics ?? new GameStatisticsData();
        }
        
        public void SetStatistics(GameStatisticsData stats)
        {
            statistics = stats;
        }
        
        public int GetCurrentLevel()
        {
            return currentLevel;
        }
        
        public int GetCurrentScore()
        {
            return currentScore;
        }
        
        public int GetCurrentLives()
        {
            return currentLives;
        }
        
        public int GetStarsEarned()
        {
            return starsEarned;
        }
        
        #endregion
    }
}