using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using Evergreen.Core;
using Evergreen.Integration;
using Evergreen.AI;

namespace Evergreen.Integration
{
    /// <summary>
    /// Game Data Manager - Handles data persistence and synchronization
    /// Manages local storage, cloud save, and data synchronization with backend
    /// </summary>
    public class GameDataManager : MonoBehaviour
    {
        [Header("Data Configuration")]
        public bool enableCloudSave = true;
        public bool enableLocalBackup = true;
        public float autoSaveInterval = 30f;
        public bool saveOnLevelComplete = true;
        public bool saveOnGameOver = true;
        
        [Header("Data Encryption")]
        public bool enableEncryption = true;
        public string encryptionKey = "EvergreenMatch3Key2024";
        
        // Singleton
        public static GameDataManager Instance { get; private set; }
        
        // References
        private BackendConnector backendConnector;
        private AIInfiniteContentManager aiContentManager;
        private GameAnalyticsManager analyticsManager;
        
        // Data
        private GameData currentGameData;
        private Dictionary<string, object> playerProgress;
        private Dictionary<string, object> settings;
        private Dictionary<string, object> achievements;
        private Dictionary<string, object> socialData;
        
        // State
        private bool isSaving = false;
        private bool isLoading = false;
        private Coroutine autoSaveCoroutine;
        
        // Events
        public System.Action<GameData> OnGameDataLoaded;
        public System.Action<GameData> OnGameDataSaved;
        public System.Action<string> OnSaveError;
        public System.Action<string> OnLoadError;
        
        [System.Serializable]
        public class GameData
        {
            public int level = 1;
            public int score = 0;
            public int moves = 30;
            public int coins = 1000;
            public int gems = 50;
            public int totalScore = 0;
            public int gamesPlayed = 0;
            public int gamesWon = 0;
            public float playTime = 0f;
            public DateTime lastPlayed;
            public Dictionary<string, object> progress = new Dictionary<string, object>();
            public Dictionary<string, object> settings = new Dictionary<string, object>();
            public Dictionary<string, object> achievements = new Dictionary<string, object>();
            public Dictionary<string, object> socialData = new Dictionary<string, object>();
        }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                Initialize();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            // Load initial data
            LoadGameData();
            
            // Start auto-save
            if (autoSaveInterval > 0)
            {
                autoSaveCoroutine = StartCoroutine(AutoSave());
            }
        }
        
        /// <summary>
        /// Initialize data manager
        /// </summary>
        private void Initialize()
        {
            // Get references
            backendConnector = BackendConnector.Instance;
            aiContentManager = FindObjectOfType<AIInfiniteContentManager>();
            analyticsManager = FindObjectOfType<GameAnalyticsManager>();
            
            // Initialize data structures
            currentGameData = new GameData();
            playerProgress = new Dictionary<string, object>();
            settings = new Dictionary<string, object>();
            achievements = new Dictionary<string, object>();
            socialData = new Dictionary<string, object>();
            
            Debug.Log("💾 Game Data Manager initialized");
        }
        
        /// <summary>
        /// Load game data
        /// </summary>
        public void LoadGameData()
        {
            if (isLoading) return;
            
            StartCoroutine(LoadGameDataCoroutine());
        }
        
        /// <summary>
        /// Load game data coroutine
        /// </summary>
        private IEnumerator LoadGameDataCoroutine()
        {
            isLoading = true;
            
            // Try to load from cloud first
            if (enableCloudSave && backendConnector != null && backendConnector.IsOnline())
            {
                yield return StartCoroutine(LoadFromCloud());
            }
            else
            {
                // Load from local storage
                LoadFromLocal();
            }
            
            // Apply loaded data
            ApplyGameData();
            
            isLoading = false;
            OnGameDataLoaded?.Invoke(currentGameData);
            
            Debug.Log("💾 Game data loaded successfully");
        }
        
        /// <summary>
        /// Load from cloud
        /// </summary>
        private IEnumerator LoadFromCloud()
        {
            bool loaded = false;
            
            backendConnector.GetLeaderboard("player_data", (data) => {
                if (data != null)
                {
                    try
                    {
                        currentGameData = JsonConvert.DeserializeObject<GameData>(data.ToString());
                        loaded = true;
                    }
                    catch (Exception e)
                    {
                        Debug.LogError($"❌ Failed to parse cloud data: {e.Message}");
                        loaded = false;
                    }
                }
            });
            
            // Wait for response
            float timeout = 10f;
            float elapsed = 0f;
            
            while (!loaded && elapsed < timeout)
            {
                elapsed += Time.deltaTime;
                yield return null;
            }
            
            if (!loaded)
            {
                Debug.LogWarning("⚠️ Cloud load failed, falling back to local storage");
                LoadFromLocal();
            }
        }
        
        /// <summary>
        /// Load from local storage
        /// </summary>
        private void LoadFromLocal()
        {
            try
            {
                // Load basic data
                currentGameData.level = PlayerPrefs.GetInt("Level", 1);
                currentGameData.score = PlayerPrefs.GetInt("Score", 0);
                currentGameData.moves = PlayerPrefs.GetInt("Moves", 30);
                currentGameData.coins = PlayerPrefs.GetInt("Coins", 1000);
                currentGameData.gems = PlayerPrefs.GetInt("Gems", 50);
                currentGameData.totalScore = PlayerPrefs.GetInt("TotalScore", 0);
                currentGameData.gamesPlayed = PlayerPrefs.GetInt("GamesPlayed", 0);
                currentGameData.gamesWon = PlayerPrefs.GetInt("GamesWon", 0);
                currentGameData.playTime = PlayerPrefs.GetFloat("PlayTime", 0f);
                
                // Load last played time
                string lastPlayedStr = PlayerPrefs.GetString("LastPlayed", "");
                if (!string.IsNullOrEmpty(lastPlayedStr))
                {
                    currentGameData.lastPlayed = DateTime.Parse(lastPlayedStr);
                }
                else
                {
                    currentGameData.lastPlayed = DateTime.Now;
                }
                
                // Load encrypted data
                LoadEncryptedData();
                
                Debug.Log("💾 Game data loaded from local storage");
            }
            catch (Exception e)
            {
                Debug.LogError($"❌ Failed to load local data: {e.Message}");
                OnLoadError?.Invoke(e.Message);
            }
        }
        
        /// <summary>
        /// Load encrypted data
        /// </summary>
        private void LoadEncryptedData()
        {
            if (!enableEncryption) return;
            
            try
            {
                // Load progress data
                string progressData = PlayerPrefs.GetString("ProgressData", "");
                if (!string.IsNullOrEmpty(progressData))
                {
                    string decryptedData = DecryptData(progressData);
                    currentGameData.progress = JsonConvert.DeserializeObject<Dictionary<string, object>>(decryptedData);
                }
                
                // Load settings
                string settingsData = PlayerPrefs.GetString("SettingsData", "");
                if (!string.IsNullOrEmpty(settingsData))
                {
                    string decryptedData = DecryptData(settingsData);
                    currentGameData.settings = JsonConvert.DeserializeObject<Dictionary<string, object>>(decryptedData);
                }
                
                // Load achievements
                string achievementsData = PlayerPrefs.GetString("AchievementsData", "");
                if (!string.IsNullOrEmpty(achievementsData))
                {
                    string decryptedData = DecryptData(achievementsData);
                    currentGameData.achievements = JsonConvert.DeserializeObject<Dictionary<string, object>>(decryptedData);
                }
                
                // Load social data
                string socialDataStr = PlayerPrefs.GetString("SocialData", "");
                if (!string.IsNullOrEmpty(socialDataStr))
                {
                    string decryptedData = DecryptData(socialDataStr);
                    currentGameData.socialData = JsonConvert.DeserializeObject<Dictionary<string, object>>(decryptedData);
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"❌ Failed to load encrypted data: {e.Message}");
            }
        }
        
        /// <summary>
        /// Apply loaded game data
        /// </summary>
        private void ApplyGameData()
        {
            // Update GameManager
            if (GameManager.Instance != null)
            {
                GameManager.Instance.UpdateScore(currentGameData.score);
                GameManager.Instance.UpdateCoins(currentGameData.coins);
                GameManager.Instance.UpdateGems(currentGameData.gems);
                GameManager.Instance.UpdateLevel(currentGameData.level.ToString());
            }
            
            // Update AI content manager
            if (aiContentManager != null)
            {
                // Send player profile to AI
                var playerProfile = new Dictionary<string, object>
                {
                    {"level", currentGameData.level},
                    {"total_score", currentGameData.totalScore},
                    {"games_played", currentGameData.gamesPlayed},
                    {"games_won", currentGameData.gamesWon},
                    {"play_time", currentGameData.playTime},
                    {"preferences", currentGameData.settings}
                };
                
                aiContentManager.UpdatePlayerProfile(currentGameData.level.ToString(), playerProfile);
            }
        }
        
        /// <summary>
        /// Save game data
        /// </summary>
        public void SaveGameData()
        {
            if (isSaving) return;
            
            StartCoroutine(SaveGameDataCoroutine());
        }
        
        /// <summary>
        /// Save game data coroutine
        /// </summary>
        private IEnumerator SaveGameDataCoroutine()
        {
            isSaving = true;
            
            // Update current data
            UpdateCurrentData();
            
            // Save locally first
            SaveToLocal();
            
            // Save to cloud if available
            if (enableCloudSave && backendConnector != null && backendConnector.IsOnline())
            {
                yield return StartCoroutine(SaveToCloud());
            }
            
            isSaving = false;
            OnGameDataSaved?.Invoke(currentGameData);
            
            Debug.Log("💾 Game data saved successfully");
        }
        
        /// <summary>
        /// Update current data from game state
        /// </summary>
        private void UpdateCurrentData()
        {
            // Update from GameManager
            if (GameManager.Instance != null)
            {
                currentGameData.score = GameManager.Instance.playerScore;
                currentGameData.coins = GameManager.Instance.playerCoins;
                currentGameData.gems = GameManager.Instance.playerGems;
                currentGameData.level = int.Parse(GameManager.Instance.currentLevel);
            }
            
            // Update play time
            currentGameData.playTime += Time.deltaTime;
            currentGameData.lastPlayed = DateTime.Now;
            
            // Update progress data
            UpdateProgressData();
        }
        
        /// <summary>
        /// Update progress data
        /// </summary>
        private void UpdateProgressData()
        {
            // Update level progress
            currentGameData.progress["current_level"] = currentGameData.level;
            currentGameData.progress["current_score"] = currentGameData.score;
            currentGameData.progress["total_coins"] = currentGameData.coins;
            currentGameData.progress["total_gems"] = currentGameData.gems;
            
            // Update AI content preferences
            if (aiContentManager != null)
            {
                var aiPreferences = aiContentManager.GetPlayerPreferences();
                currentGameData.progress["ai_preferences"] = aiPreferences;
            }
            
            // Update analytics data
            if (analyticsManager != null)
            {
                var analyticsData = analyticsManager.GetPlayerAnalytics();
                currentGameData.progress["analytics"] = analyticsData;
            }
        }
        
        /// <summary>
        /// Save to local storage
        /// </summary>
        private void SaveToLocal()
        {
            try
            {
                // Save basic data
                PlayerPrefs.SetInt("Level", currentGameData.level);
                PlayerPrefs.SetInt("Score", currentGameData.score);
                PlayerPrefs.SetInt("Moves", currentGameData.moves);
                PlayerPrefs.SetInt("Coins", currentGameData.coins);
                PlayerPrefs.SetInt("Gems", currentGameData.gems);
                PlayerPrefs.SetInt("TotalScore", currentGameData.totalScore);
                PlayerPrefs.SetInt("GamesPlayed", currentGameData.gamesPlayed);
                PlayerPrefs.SetInt("GamesWon", currentGameData.gamesWon);
                PlayerPrefs.SetFloat("PlayTime", currentGameData.playTime);
                PlayerPrefs.SetString("LastPlayed", currentGameData.lastPlayed.ToString());
                
                // Save encrypted data
                SaveEncryptedData();
                
                PlayerPrefs.Save();
                
                Debug.Log("💾 Game data saved to local storage");
            }
            catch (Exception e)
            {
                Debug.LogError($"❌ Failed to save local data: {e.Message}");
                OnSaveError?.Invoke(e.Message);
            }
        }
        
        /// <summary>
        /// Save encrypted data
        /// </summary>
        private void SaveEncryptedData()
        {
            if (!enableEncryption) return;
            
            try
            {
                // Save progress data
                string progressJson = JsonConvert.SerializeObject(currentGameData.progress);
                string encryptedProgress = EncryptData(progressJson);
                PlayerPrefs.SetString("ProgressData", encryptedProgress);
                
                // Save settings
                string settingsJson = JsonConvert.SerializeObject(currentGameData.settings);
                string encryptedSettings = EncryptData(settingsJson);
                PlayerPrefs.SetString("SettingsData", encryptedSettings);
                
                // Save achievements
                string achievementsJson = JsonConvert.SerializeObject(currentGameData.achievements);
                string encryptedAchievements = EncryptData(achievementsJson);
                PlayerPrefs.SetString("AchievementsData", encryptedAchievements);
                
                // Save social data
                string socialJson = JsonConvert.SerializeObject(currentGameData.socialData);
                string encryptedSocial = EncryptData(socialJson);
                PlayerPrefs.SetString("SocialData", encryptedSocial);
            }
            catch (Exception e)
            {
                Debug.LogError($"❌ Failed to save encrypted data: {e.Message}");
            }
        }
        
        /// <summary>
        /// Save to cloud
        /// </summary>
        private IEnumerator SaveToCloud()
        {
            bool saved = false;
            
            backendConnector.SendGameData(currentGameData);
            
            // Wait for save confirmation
            float timeout = 10f;
            float elapsed = 0f;
            
            while (!saved && elapsed < timeout)
            {
                elapsed += Time.deltaTime;
                yield return null;
            }
            
            if (!saved)
            {
                Debug.LogWarning("⚠️ Cloud save failed, data saved locally only");
            }
        }
        
        /// <summary>
        /// Auto-save coroutine
        /// </summary>
        private IEnumerator AutoSave()
        {
            while (true)
            {
                yield return new WaitForSeconds(autoSaveInterval);
                
                if (!isSaving)
                {
                    SaveGameData();
                }
            }
        }
        
        /// <summary>
        /// Encrypt data
        /// </summary>
        private string EncryptData(string data)
        {
            if (!enableEncryption) return data;
            
            // Simple XOR encryption (replace with proper encryption in production)
            string encrypted = "";
            for (int i = 0; i < data.Length; i++)
            {
                encrypted += (char)(data[i] ^ encryptionKey[i % encryptionKey.Length]);
            }
            
            return Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(encrypted));
        }
        
        /// <summary>
        /// Decrypt data
        /// </summary>
        private string DecryptData(string encryptedData)
        {
            if (!enableEncryption) return encryptedData;
            
            try
            {
                byte[] data = Convert.FromBase64String(encryptedData);
                string decrypted = System.Text.Encoding.UTF8.GetString(data);
                
                string result = "";
                for (int i = 0; i < decrypted.Length; i++)
                {
                    result += (char)(decrypted[i] ^ encryptionKey[i % encryptionKey.Length]);
                }
                
                return result;
            }
            catch (Exception e)
            {
                Debug.LogError($"❌ Failed to decrypt data: {e.Message}");
                return "";
            }
        }
        
        /// <summary>
        /// Get current game data
        /// </summary>
        public GameData GetCurrentGameData()
        {
            return currentGameData;
        }
        
        /// <summary>
        /// Update game data
        /// </summary>
        public void UpdateGameData(GameData newData)
        {
            currentGameData = newData;
            ApplyGameData();
        }
        
        /// <summary>
        /// Reset game data
        /// </summary>
        public void ResetGameData()
        {
            currentGameData = new GameData();
            SaveGameData();
        }
        
        /// <summary>
        /// Get progress data
        /// </summary>
        public Dictionary<string, object> GetProgressData()
        {
            return currentGameData.progress;
        }
        
        /// <summary>
        /// Set progress data
        /// </summary>
        public void SetProgressData(string key, object value)
        {
            currentGameData.progress[key] = value;
        }
        
        /// <summary>
        /// Get settings
        /// </summary>
        public Dictionary<string, object> GetSettings()
        {
            return currentGameData.settings;
        }
        
        /// <summary>
        /// Set setting
        /// </summary>
        public void SetSetting(string key, object value)
        {
            currentGameData.settings[key] = value;
        }
        
        /// <summary>
        /// Get achievements
        /// </summary>
        public Dictionary<string, object> GetAchievements()
        {
            return currentGameData.achievements;
        }
        
        /// <summary>
        /// Set achievement
        /// </summary>
        public void SetAchievement(string key, object value)
        {
            currentGameData.achievements[key] = value;
        }
        
        /// <summary>
        /// Get social data
        /// </summary>
        public Dictionary<string, object> GetSocialData()
        {
            return currentGameData.socialData;
        }
        
        /// <summary>
        /// Set social data
        /// </summary>
        public void SetSocialData(string key, object value)
        {
            currentGameData.socialData[key] = value;
        }
        
        /// <summary>
        /// Check if saving
        /// </summary>
        public bool IsSaving()
        {
            return isSaving;
        }
        
        /// <summary>
        /// Check if loading
        /// </summary>
        public bool IsLoading()
        {
            return isLoading;
        }
        
        void OnApplicationPause(bool pauseStatus)
        {
            if (pauseStatus)
            {
                SaveGameData();
            }
        }
        
        void OnApplicationFocus(bool hasFocus)
        {
            if (!hasFocus)
            {
                SaveGameData();
            }
        }
        
        void OnDestroy()
        {
            SaveGameData();
        }
    }
}