using UnityEngine;
using Unity.Services.CloudSave;
using Unity.Services.Core;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;

namespace Match3Game.CloudServices
{
    /// <summary>
    /// Cloud save manager for Match 3 game using Unity Cloud Save
    /// Handles player progress, settings, and game state synchronization
    /// </summary>
    public class CloudSaveManager : MonoBehaviour
    {
        [Header("Cloud Save Configuration")]
        [SerializeField] private bool enableCloudSave = true;
        [SerializeField] private bool autoSave = true;
        [SerializeField] private float autoSaveInterval = 30f; // seconds
        
        private bool isInitialized = false;
        private float lastSaveTime;
        
        // Game data keys
        private const string PLAYER_PROGRESS_KEY = "player_progress";
        private const string GAME_SETTINGS_KEY = "game_settings";
        private const string STATISTICS_KEY = "statistics";
        private const string ACHIEVEMENTS_KEY = "achievements";
        
        private void Start()
        {
            InitializeCloudSave();
        }
        
        private void Update()
        {
            if (autoSave && isInitialized && Time.time - lastSaveTime > autoSaveInterval)
            {
                SaveGameData();
            }
        }
        
        private async void InitializeCloudSave()
        {
            try
            {
                if (!enableCloudSave) return;
                
                // Initialize Unity Services
                await UnityServices.InitializeAsync();
                
                isInitialized = true;
                Debug.Log("Cloud Save initialized successfully");
                
                // Load existing data
                await LoadGameData();
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to initialize Cloud Save: {e.Message}");
            }
        }
        
        #region Player Progress Management
        
        public async Task SavePlayerProgress(PlayerProgressData progressData)
        {
            if (!isInitialized) return;
            
            try
            {
                var data = new Dictionary<string, object>
                {
                    {"current_level", progressData.currentLevel},
                    {"total_score", progressData.totalScore},
                    {"stars_earned", progressData.starsEarned},
                    {"lives_remaining", progressData.livesRemaining},
                    {"last_save_time", DateTime.UtcNow.ToString()},
                    {"platform", Application.platform.ToString()}
                };
                
                await CloudSaveService.Instance.Data.Player.SaveAsync(PLAYER_PROGRESS_KEY, data);
                Debug.Log("Player progress saved to cloud");
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to save player progress: {e.Message}");
            }
        }
        
        public async Task<PlayerProgressData> LoadPlayerProgress()
        {
            if (!isInitialized) return new PlayerProgressData();
            
            try
            {
                var data = await CloudSaveService.Instance.Data.Player.LoadAsync(PLAYER_PROGRESS_KEY);
                
                if (data.ContainsKey(PLAYER_PROGRESS_KEY))
                {
                    var progressData = data[PLAYER_PROGRESS_KEY];
                    return new PlayerProgressData
                    {
                        currentLevel = Convert.ToInt32(progressData["current_level"]),
                        totalScore = Convert.ToInt32(progressData["total_score"]),
                        starsEarned = Convert.ToInt32(progressData["stars_earned"]),
                        livesRemaining = Convert.ToInt32(progressData["lives_remaining"])
                    };
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to load player progress: {e.Message}");
            }
            
            return new PlayerProgressData();
        }
        
        #endregion
        
        #region Game Settings Management
        
        public async Task SaveGameSettings(GameSettingsData settingsData)
        {
            if (!isInitialized) return;
            
            try
            {
                var data = new Dictionary<string, object>
                {
                    {"sound_enabled", settingsData.soundEnabled},
                    {"music_enabled", settingsData.musicEnabled},
                    {"vibration_enabled", settingsData.vibrationEnabled},
                    {"graphics_quality", settingsData.graphicsQuality},
                    {"language", settingsData.language},
                    {"last_updated", DateTime.UtcNow.ToString()}
                };
                
                await CloudSaveService.Instance.Data.Player.SaveAsync(GAME_SETTINGS_KEY, data);
                Debug.Log("Game settings saved to cloud");
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to save game settings: {e.Message}");
            }
        }
        
        public async Task<GameSettingsData> LoadGameSettings()
        {
            if (!isInitialized) return new GameSettingsData();
            
            try
            {
                var data = await CloudSaveService.Instance.Data.Player.LoadAsync(GAME_SETTINGS_KEY);
                
                if (data.ContainsKey(GAME_SETTINGS_KEY))
                {
                    var settingsData = data[GAME_SETTINGS_KEY];
                    return new GameSettingsData
                    {
                        soundEnabled = Convert.ToBoolean(settingsData["sound_enabled"]),
                        musicEnabled = Convert.ToBoolean(settingsData["music_enabled"]),
                        vibrationEnabled = Convert.ToBoolean(settingsData["vibration_enabled"]),
                        graphicsQuality = Convert.ToInt32(settingsData["graphics_quality"]),
                        language = settingsData["language"].ToString()
                    };
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to load game settings: {e.Message}");
            }
            
            return new GameSettingsData();
        }
        
        #endregion
        
        #region Statistics Management
        
        public async Task SaveStatistics(GameStatisticsData statisticsData)
        {
            if (!isInitialized) return;
            
            try
            {
                var data = new Dictionary<string, object>
                {
                    {"games_played", statisticsData.gamesPlayed},
                    {"total_play_time", statisticsData.totalPlayTime},
                    {"best_score", statisticsData.bestScore},
                    {"matches_made", statisticsData.matchesMade},
                    {"powerups_used", statisticsData.powerupsUsed},
                    {"levels_completed", statisticsData.levelsCompleted},
                    {"last_updated", DateTime.UtcNow.ToString()}
                };
                
                await CloudSaveService.Instance.Data.Player.SaveAsync(STATISTICS_KEY, data);
                Debug.Log("Statistics saved to cloud");
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to save statistics: {e.Message}");
            }
        }
        
        public async Task<GameStatisticsData> LoadStatistics()
        {
            if (!isInitialized) return new GameStatisticsData();
            
            try
            {
                var data = await CloudSaveService.Instance.Data.Player.LoadAsync(STATISTICS_KEY);
                
                if (data.ContainsKey(STATISTICS_KEY))
                {
                    var statsData = data[STATISTICS_KEY];
                    return new GameStatisticsData
                    {
                        gamesPlayed = Convert.ToInt32(statsData["games_played"]),
                        totalPlayTime = Convert.ToSingle(statsData["total_play_time"]),
                        bestScore = Convert.ToInt32(statsData["best_score"]),
                        matchesMade = Convert.ToInt32(statsData["matches_made"]),
                        powerupsUsed = Convert.ToInt32(statsData["powerups_used"]),
                        levelsCompleted = Convert.ToInt32(statsData["levels_completed"])
                    };
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to load statistics: {e.Message}");
            }
            
            return new GameStatisticsData();
        }
        
        #endregion
        
        #region General Save/Load
        
        public async Task SaveGameData()
        {
            if (!isInitialized) return;
            
            try
            {
                // Save all game data
                var gameManager = FindObjectOfType<GameManager>();
                if (gameManager != null)
                {
                    await SavePlayerProgress(gameManager.GetPlayerProgress());
                    await SaveGameSettings(gameManager.GetGameSettings());
                    await SaveStatistics(gameManager.GetStatistics());
                }
                
                lastSaveTime = Time.time;
                Debug.Log("All game data saved to cloud");
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to save game data: {e.Message}");
            }
        }
        
        public async Task LoadGameData()
        {
            if (!isInitialized) return;
            
            try
            {
                // Load all game data
                var gameManager = FindObjectOfType<GameManager>();
                if (gameManager != null)
                {
                    var progressData = await LoadPlayerProgress();
                    var settingsData = await LoadGameSettings();
                    var statisticsData = await LoadStatistics();
                    
                    gameManager.SetPlayerProgress(progressData);
                    gameManager.SetGameSettings(settingsData);
                    gameManager.SetStatistics(statisticsData);
                }
                
                Debug.Log("All game data loaded from cloud");
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to load game data: {e.Message}");
            }
        }
        
        #endregion
        
        #region Public API
        
        public bool IsInitialized()
        {
            return isInitialized;
        }
        
        public void ForceSave()
        {
            SaveGameData();
        }
        
        #endregion
    }
    
    #region Data Classes
    
    [System.Serializable]
    public class PlayerProgressData
    {
        public int currentLevel = 1;
        public int totalScore = 0;
        public int starsEarned = 0;
        public int livesRemaining = 5;
    }
    
    [System.Serializable]
    public class GameSettingsData
    {
        public bool soundEnabled = true;
        public bool musicEnabled = true;
        public bool vibrationEnabled = true;
        public int graphicsQuality = 2;
        public string language = "en";
    }
    
    [System.Serializable]
    public class GameStatisticsData
    {
        public int gamesPlayed = 0;
        public float totalPlayTime = 0f;
        public int bestScore = 0;
        public int matchesMade = 0;
        public int powerupsUsed = 0;
        public int levelsCompleted = 0;
    }
    
    #endregion
}