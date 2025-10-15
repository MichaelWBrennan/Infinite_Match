using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System.Runtime.InteropServices;

namespace Match3Game.Integration
{
    /// <summary>
    /// Main Game Manager that integrates all SDKs for Match 3 game
    /// Handles game state, analytics, cloud services, and monitoring
    /// </summary>
    public class GameManagerIntegration : MonoBehaviour
    {
        [Header("Game Configuration")]
        [SerializeField] private int currentLevel = 1;
        [SerializeField] private int totalScore = 0;
        [SerializeField] private int livesRemaining = 5;
        [SerializeField] private float gameStartTime;
        
        [Header("SDK Integration")]
        [SerializeField] private bool enableAnalytics = true;
        [SerializeField] private bool enableCloudSave = true;
        [SerializeField] private bool enableErrorTracking = true;
        [SerializeField] private bool enablePerformanceMonitoring = true;
        
        // Component references
        private GameAnalyticsManager analyticsManager;
        private CloudSaveManager cloudSaveManager;
        
        // Game state
        private bool isGameActive = false;
        private bool isPaused = false;
        private Dictionary<string, object> gameState = new Dictionary<string, object>();
        
        // WebGL integration
        #if UNITY_WEBGL && !UNITY_EDITOR
        [DllImport("__Internal")]
        private static extern void TrackWebGLEvent(string eventName, string eventData);
        
        [DllImport("__Internal")]
        private static extern void TrackWebGLError(string errorType, string errorMessage);
        
        [DllImport("__Internal")]
        private static extern void TrackWebGLPerformance(string metricName, float value);
        #endif

        private void Start()
        {
            InitializeGame();
        }

        private void Update()
        {
            if (isGameActive && !isPaused)
            {
                UpdateGameState();
            }
        }

        private void OnApplicationPause(bool pauseStatus)
        {
            if (pauseStatus)
            {
                PauseGame();
            }
            else
            {
                ResumeGame();
            }
        }

        private void OnApplicationFocus(bool hasFocus)
        {
            if (!hasFocus)
            {
                PauseGame();
            }
            else
            {
                ResumeGame();
            }
        }

        #region Game Initialization

        private async void InitializeGame()
        {
            try
            {
                Debug.Log("Initializing Match 3 Game with SDK integration...");
                
                // Initialize analytics
                if (enableAnalytics)
                {
                    analyticsManager = FindObjectOfType<GameAnalyticsManager>();
                    if (analyticsManager == null)
                    {
                        GameObject analyticsGO = new GameObject("AnalyticsManager");
                        analyticsManager = analyticsGO.AddComponent<GameAnalyticsManager>();
                    }
                }
                
                // Initialize cloud save
                if (enableCloudSave)
                {
                    cloudSaveManager = FindObjectOfType<CloudSaveManager>();
                    if (cloudSaveManager == null)
                    {
                        GameObject cloudSaveGO = new GameObject("CloudSaveManager");
                        cloudSaveManager = cloudSaveGO.AddComponent<CloudSaveManager>();
                    }
                }
                
                // Load saved game data
                await LoadGameData();
                
                // Initialize game state
                InitializeGameState();
                
                // Start the game
                StartGame();
                
                Debug.Log("Game initialization complete");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to initialize game: {e.Message}");
                TrackError("GameInitializationError", e.Message, e.StackTrace);
            }
        }

        private void InitializeGameState()
        {
            gameState.Clear();
            gameState["current_level"] = currentLevel;
            gameState["total_score"] = totalScore;
            gameState["lives_remaining"] = livesRemaining;
            gameState["game_start_time"] = Time.time;
            gameState["platform"] = Application.platform.ToString();
            gameState["game_version"] = Application.version;
        }

        #endregion

        #region Game Control

        public void StartGame()
        {
            if (isGameActive) return;
            
            isGameActive = true;
            isPaused = false;
            gameStartTime = Time.time;
            
            // Track game start
            TrackGameStart();
            
            // Start level
            StartLevel(currentLevel);
            
            Debug.Log($"Game started - Level {currentLevel}");
        }

        public void PauseGame()
        {
            if (!isGameActive || isPaused) return;
            
            isPaused = true;
            Time.timeScale = 0f;
            
            // Track pause event
            TrackEvent("game_paused", new Dictionary<string, object>
            {
                {"level", currentLevel},
                {"score", totalScore},
                {"pause_time", Time.time - gameStartTime}
            });
            
            Debug.Log("Game paused");
        }

        public void ResumeGame()
        {
            if (!isGameActive || !isPaused) return;
            
            isPaused = false;
            Time.timeScale = 1f;
            
            // Track resume event
            TrackEvent("game_resumed", new Dictionary<string, object>
            {
                {"level", currentLevel},
                {"score", totalScore}
            });
            
            Debug.Log("Game resumed");
        }

        public void EndGame()
        {
            if (!isGameActive) return;
            
            isGameActive = false;
            isPaused = false;
            Time.timeScale = 1f;
            
            // Track game end
            TrackEvent("game_ended", new Dictionary<string, object>
            {
                {"level", currentLevel},
                {"score", totalScore},
                {"total_play_time", Time.time - gameStartTime}
            });
            
            // Save game data
            SaveGameData();
            
            Debug.Log("Game ended");
        }

        #endregion

        #region Level Management

        public void StartLevel(int level)
        {
            currentLevel = level;
            gameState["current_level"] = currentLevel;
            
            // Track level start
            TrackLevelStart(level);
            
            Debug.Log($"Level {level} started");
        }

        public void CompleteLevel(int score, float timeSpent, int movesUsed, int starsEarned)
        {
            totalScore += score;
            gameState["total_score"] = totalScore;
            
            // Track level completion
            TrackLevelComplete(currentLevel, score, timeSpent, movesUsed, starsEarned);
            
            // Move to next level
            currentLevel++;
            gameState["current_level"] = currentLevel;
            
            Debug.Log($"Level completed! Score: {score}, Total: {totalScore}");
        }

        public void FailLevel()
        {
            livesRemaining--;
            gameState["lives_remaining"] = livesRemaining;
            
            // Track level failure
            TrackEvent("level_failed", new Dictionary<string, object>
            {
                {"level", currentLevel},
                {"lives_remaining", livesRemaining}
            });
            
            if (livesRemaining <= 0)
            {
                GameOver();
            }
            
            Debug.Log($"Level failed! Lives remaining: {livesRemaining}");
        }

        private void GameOver()
        {
            // Track game over
            TrackEvent("game_over", new Dictionary<string, object>
            {
                {"final_level", currentLevel},
                {"final_score", totalScore},
                {"total_play_time", Time.time - gameStartTime}
            });
            
            // Save final game state
            SaveGameData();
            
            Debug.Log("Game Over!");
        }

        #endregion

        #region Match and Power-up Tracking

        public void TrackMatch(int matchType, int piecesMatched, Vector3 position, int scoreGained)
        {
            totalScore += scoreGained;
            gameState["total_score"] = totalScore;
            
            // Track match made
            TrackMatchMade(matchType, piecesMatched, position, scoreGained);
            
            Debug.Log($"Match made! Type: {matchType}, Pieces: {piecesMatched}, Score: +{scoreGained}");
        }

        public void UsePowerUp(string powerUpType, Vector3 position, int cost)
        {
            // Track power-up usage
            TrackPowerUpUsed(powerUpType, position, cost);
            
            Debug.Log($"Power-up used: {powerUpType} at {position}");
        }

        #endregion

        #region Analytics Integration

        private void TrackGameStart()
        {
            if (analyticsManager != null)
            {
                analyticsManager.TrackGameStart();
            }
            
            #if UNITY_WEBGL && !UNITY_EDITOR
            TrackWebGLEvent("game_started", JsonUtility.ToJson(new {
                level = currentLevel,
                platform = Application.platform.ToString()
            }));
            #endif
        }

        private void TrackLevelStart(int level)
        {
            if (analyticsManager != null)
            {
                analyticsManager.TrackLevelStart(level);
            }
            
            #if UNITY_WEBGL && !UNITY_EDITOR
            TrackWebGLEvent("level_started", JsonUtility.ToJson(new {
                level = level,
                session_id = analyticsManager?.GetSessionId()
            }));
            #endif
        }

        private void TrackLevelComplete(int level, int score, float timeSpent, int movesUsed, int starsEarned)
        {
            if (analyticsManager != null)
            {
                analyticsManager.TrackLevelComplete(level, score, timeSpent, movesUsed);
            }
            
            #if UNITY_WEBGL && !UNITY_EDITOR
            TrackWebGLEvent("level_completed", JsonUtility.ToJson(new {
                level = level,
                score = score,
                time_spent = timeSpent,
                moves_used = movesUsed,
                stars_earned = starsEarned
            }));
            #endif
        }

        private void TrackMatchMade(int matchType, int piecesMatched, Vector3 position, int scoreGained)
        {
            if (analyticsManager != null)
            {
                analyticsManager.TrackMatch(matchType, piecesMatched, position);
            }
            
            #if UNITY_WEBGL && !UNITY_EDITOR
            TrackWebGLEvent("match_made", JsonUtility.ToJson(new {
                match_type = matchType,
                pieces_matched = piecesMatched,
                position_x = position.x,
                position_y = position.y,
                score_gained = scoreGained
            }));
            #endif
        }

        private void TrackPowerUpUsed(string powerUpType, Vector3 position, int cost)
        {
            if (analyticsManager != null)
            {
                analyticsManager.TrackPowerUpUsed(powerUpType, currentLevel, position);
            }
            
            #if UNITY_WEBGL && !UNITY_EDITOR
            TrackWebGLEvent("powerup_used", JsonUtility.ToJson(new {
                powerup_type = powerUpType,
                level = currentLevel,
                position_x = position.x,
                position_y = position.y,
                cost = cost
            }));
            #endif
        }

        private void TrackEvent(string eventName, Dictionary<string, object> properties)
        {
            if (analyticsManager != null)
            {
                // Use reflection to call the generic TrackEvent method
                var method = analyticsManager.GetType().GetMethod("TrackEvent");
                if (method != null)
                {
                    method.Invoke(analyticsManager, new object[] { eventName, properties });
                }
            }
            
            #if UNITY_WEBGL && !UNITY_EDITOR
            TrackWebGLEvent(eventName, JsonUtility.ToJson(properties));
            #endif
        }

        private void TrackError(string errorType, string errorMessage, string stackTrace)
        {
            if (analyticsManager != null)
            {
                analyticsManager.TrackError(errorType, errorMessage, stackTrace);
            }
            
            #if UNITY_WEBGL && !UNITY_EDITOR
            TrackWebGLError(errorType, errorMessage);
            #endif
        }

        #endregion

        #region Performance Monitoring

        private void UpdateGameState()
        {
            if (!enablePerformanceMonitoring) return;
            
            // Track FPS
            float fps = 1.0f / Time.deltaTime;
            TrackPerformance("fps", fps);
            
            // Track memory usage
            long memoryUsage = System.GC.GetTotalMemory(false);
            TrackPerformance("memory_usage", memoryUsage);
            
            // Track game time
            float gameTime = Time.time - gameStartTime;
            TrackPerformance("game_time", gameTime);
        }

        private void TrackPerformance(string metricName, float value)
        {
            #if UNITY_WEBGL && !UNITY_EDITOR
            TrackWebGLPerformance(metricName, value);
            #endif
        }

        #endregion

        #region Data Management

        private async System.Threading.Tasks.Task LoadGameData()
        {
            if (cloudSaveManager != null && cloudSaveManager.IsInitialized())
            {
                try
                {
                    var progressData = await cloudSaveManager.LoadPlayerProgress();
                    currentLevel = progressData.currentLevel;
                    totalScore = progressData.totalScore;
                    livesRemaining = progressData.livesRemaining;
                    
                    Debug.Log("Game data loaded from cloud");
                }
                catch (System.Exception e)
                {
                    Debug.LogError($"Failed to load game data: {e.Message}");
                }
            }
        }

        private async void SaveGameData()
        {
            if (cloudSaveManager != null && cloudSaveManager.IsInitialized())
            {
                try
                {
                    var progressData = new PlayerProgressData
                    {
                        currentLevel = currentLevel,
                        totalScore = totalScore,
                        livesRemaining = livesRemaining
                    };
                    
                    await cloudSaveManager.SavePlayerProgress(progressData);
                    Debug.Log("Game data saved to cloud");
                }
                catch (System.Exception e)
                {
                    Debug.LogError($"Failed to save game data: {e.Message}");
                }
            }
        }

        #endregion

        #region Public API

        public int GetCurrentLevel() => currentLevel;
        public int GetTotalScore() => totalScore;
        public int GetLivesRemaining() => livesRemaining;
        public bool IsGameActive() => isGameActive;
        public bool IsPaused() => isPaused;
        public float GetGameTime() => Time.time - gameStartTime;

        public PlayerProgressData GetPlayerProgress()
        {
            return new PlayerProgressData
            {
                currentLevel = currentLevel,
                totalScore = totalScore,
                livesRemaining = livesRemaining
            };
        }

        public GameSettingsData GetGameSettings()
        {
            return new GameSettingsData
            {
                soundEnabled = true,
                musicEnabled = true,
                vibrationEnabled = true,
                graphicsQuality = QualitySettings.GetQualityLevel(),
                language = Application.systemLanguage.ToString()
            };
        }

        public GameStatisticsData GetStatistics()
        {
            return new GameStatisticsData
            {
                gamesPlayed = 1,
                totalPlayTime = Time.time - gameStartTime,
                bestScore = totalScore,
                matchesMade = 0, // This would be tracked separately
                powerupsUsed = 0, // This would be tracked separately
                levelsCompleted = currentLevel - 1
            };
        }

        public void SetPlayerProgress(PlayerProgressData progressData)
        {
            currentLevel = progressData.currentLevel;
            totalScore = progressData.totalScore;
            livesRemaining = progressData.livesRemaining;
        }

        public void SetGameSettings(GameSettingsData settingsData)
        {
            // Apply game settings
            AudioListener.volume = settingsData.soundEnabled ? 1.0f : 0.0f;
            QualitySettings.SetQualityLevel(settingsData.graphicsQuality);
        }

        public void SetStatistics(GameStatisticsData statisticsData)
        {
            // Update statistics (this would typically be stored and updated over time)
        }

        #endregion
    }
}