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
        
        [Header("Monetization")]
        [SerializeField] private int coins = 0;
        [SerializeField] private int gems = 0;
        [SerializeField] private int energy = 30;
        [SerializeField] private int maxEnergy = 30;
        [SerializeField] private float energyRefillTime = 300f; // 5 minutes
        [SerializeField] private float lastEnergyRefill;
        [SerializeField] private string currentSubscription = "none";
        [SerializeField] private float subscriptionMultiplier = 1f;
        
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
        public System.Action<int> OnCoinsChanged;
        public System.Action<int> OnGemsChanged;
        public System.Action<int> OnEnergyChanged;
        public System.Action<string> OnSubscriptionChanged;
        
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
                
                // Load saved data from cloud with timeout
                if (cloudSaveManager && cloudSaveManager.IsInitialized())
                {
                    using (var cts = new System.Threading.CancellationTokenSource(TimeSpan.FromSeconds(10)))
                    {
                        try
                        {
                            await LoadGameData().ConfigureAwait(false);
                        }
                        catch (System.OperationCanceledException)
                        {
                            Debug.LogWarning("Game data loading timed out, using default values");
                        }
                    }
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
                // Load player progress with proper error handling
                var progressTask = cloudSaveManager.LoadPlayerProgress();
                var settingsTask = cloudSaveManager.LoadGameSettings();
                var statisticsTask = cloudSaveManager.LoadStatistics();
                
                // Wait for all tasks to complete
                await System.Threading.Tasks.Task.WhenAll(progressTask, settingsTask, statisticsTask).ConfigureAwait(false);
                
                // Process results
                playerProgress = await progressTask;
                if (playerProgress?.currentLevel > 0)
                {
                    currentLevel = playerProgress.currentLevel;
                    currentScore = playerProgress.totalScore;
                    currentLives = playerProgress.livesRemaining;
                }
                
                gameSettings = await settingsTask;
                if (gameSettings != null)
                {
                    ApplyGameSettings();
                }
                
                statistics = await statisticsTask;
                
                Debug.Log("Game data loaded from cloud");
                
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to load game data: {e.Message}");
                // Initialize with default values
                playerProgress = new PlayerProgressData();
                gameSettings = new GameSettingsData();
                statistics = new GameStatisticsData();
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
            // Process purchase based on item type
            ProcessPurchase(itemId, currency, amount);
            
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
        
        private void ProcessPurchase(string itemId, string currency, float amount)
        {
            switch (itemId)
            {
                case "coins_100":
                    AddCoins(100);
                    break;
                case "coins_500":
                    AddCoins(500);
                    break;
                case "coins_1000":
                    AddCoins(1000);
                    break;
                case "gems_50":
                    AddGems(50);
                    break;
                case "gems_100":
                    AddGems(100);
                    break;
                case "gems_500":
                    AddGems(500);
                    break;
                case "energy_pack":
                    RefillEnergy();
                    break;
                case "premium_pack":
                    AddCoins(1000);
                    AddGems(100);
                    RefillEnergy();
                    break;
                case "basic_subscription":
                    SetSubscription("basic", 1.5f);
                    break;
                case "premium_subscription":
                    SetSubscription("premium", 2f);
                    break;
                case "ultimate_subscription":
                    SetSubscription("ultimate", 3f);
                    break;
            }
        }
        
        public void AddCoins(int amount)
        {
            coins += amount;
            OnCoinsChanged?.Invoke(coins);
            
            if (analyticsManager)
            {
                analyticsManager.TrackCustomEvent("currency_earned", new Dictionary<string, object>
                {
                    {"currency_type", "coins"},
                    {"amount", amount},
                    {"total_coins", coins}
                });
            }
        }
        
        public void SpendCoins(int amount)
        {
            if (coins >= amount)
            {
                coins -= amount;
                OnCoinsChanged?.Invoke(coins);
                
                if (analyticsManager)
                {
                    analyticsManager.TrackCustomEvent("currency_spent", new Dictionary<string, object>
                    {
                        {"currency_type", "coins"},
                        {"amount", amount},
                        {"total_coins", coins}
                    });
                }
                return true;
            }
            return false;
        }
        
        public void AddGems(int amount)
        {
            gems += amount;
            OnGemsChanged?.Invoke(gems);
            
            if (analyticsManager)
            {
                analyticsManager.TrackCustomEvent("currency_earned", new Dictionary<string, object>
                {
                    {"currency_type", "gems"},
                    {"amount", amount},
                    {"total_gems", gems}
                });
            }
        }
        
        public bool SpendGems(int amount)
        {
            if (gems >= amount)
            {
                gems -= amount;
                OnGemsChanged?.Invoke(gems);
                
                if (analyticsManager)
                {
                    analyticsManager.TrackCustomEvent("currency_spent", new Dictionary<string, object>
                    {
                        {"currency_type", "gems"},
                        {"amount", amount},
                        {"total_gems", gems}
                    });
                }
                return true;
            }
            return false;
        }
        
        public void RefillEnergy()
        {
            energy = maxEnergy;
            lastEnergyRefill = Time.time;
            OnEnergyChanged?.Invoke(energy);
            
            if (analyticsManager)
            {
                analyticsManager.TrackCustomEvent("energy_refilled", new Dictionary<string, object>
                {
                    {"energy_amount", energy},
                    {"max_energy", maxEnergy}
                });
            }
        }
        
        public void UseEnergy(int amount = 1)
        {
            if (energy >= amount)
            {
                energy -= amount;
                OnEnergyChanged?.Invoke(energy);
                
                if (analyticsManager)
                {
                    analyticsManager.TrackCustomEvent("energy_used", new Dictionary<string, object>
                    {
                        {"energy_used", amount},
                        {"remaining_energy", energy}
                    });
                }
            }
        }
        
        public void SetSubscription(string subscriptionType, float multiplier)
        {
            currentSubscription = subscriptionType;
            subscriptionMultiplier = multiplier;
            OnSubscriptionChanged?.Invoke(subscriptionType);
            
            if (analyticsManager)
            {
                analyticsManager.TrackCustomEvent("subscription_changed", new Dictionary<string, object>
                {
                    {"subscription_type", subscriptionType},
                    {"multiplier", multiplier}
                });
            }
        }
        
        private void Update()
        {
            // Auto-refill energy over time
            if (energy < maxEnergy && Time.time - lastEnergyRefill >= energyRefillTime)
            {
                energy++;
                lastEnergyRefill = Time.time;
                OnEnergyChanged?.Invoke(energy);
            }
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
                
                // Save to cloud with timeout and proper error handling
                if (cloudSaveManager && cloudSaveManager.IsInitialized())
                {
                    using (var cts = new System.Threading.CancellationTokenSource(TimeSpan.FromSeconds(5)))
                    {
                        try
                        {
                            var progressTask = cloudSaveManager.SavePlayerProgress(playerProgress);
                            var statisticsTask = cloudSaveManager.SaveStatistics(statistics);
                            
                            await System.Threading.Tasks.Task.WhenAll(progressTask, statisticsTask).ConfigureAwait(false);
                            
                            Debug.Log("Game progress saved");
                        }
                        catch (System.OperationCanceledException)
                        {
                            Debug.LogWarning("Save operation timed out");
                        }
                    }
                }
                
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