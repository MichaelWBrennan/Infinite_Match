using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using System.Text;

namespace Evergreen.CloudSave
{
    [System.Serializable]
    public class SaveData
    {
        public string playerId;
        public long timestamp;
        public int version;
        public GameSaveData gameData;
        public MetaGameSaveData metaGameData;
        public SocialSaveData socialData;
        public AchievementSaveData achievementData;
        public CharacterSaveData characterData;
        public SettingsSaveData settingsData;
    }
    
    [System.Serializable]
    public class GameSaveData
    {
        public int currentLevel;
        public int coins;
        public int gems;
        public int energyCurrent;
        public int energyMax;
        public long lastEnergyTimestamp;
        public int totalScore;
        public int levelsCompleted;
        public int matchesMade;
        public int specialMatchesMade;
        public int threeStarLevels;
        public int winStreak;
        public int maxWinStreak;
        public float totalPlayTime;
        public Dictionary<string, int> levelScores = new Dictionary<string, int>();
        public Dictionary<string, int> levelAttempts = new Dictionary<string, int>();
    }
    
    [System.Serializable]
    public class MetaGameSaveData
    {
        public int currentRoom;
        public List<RoomSaveData> rooms = new List<RoomSaveData>();
        public List<DecorationSaveData> decorations = new List<DecorationSaveData>();
        public int totalCoinsEarned;
        public int totalGemsEarned;
    }
    
    [System.Serializable]
    public class RoomSaveData
    {
        public int roomId;
        public bool isUnlocked;
        public List<PlacedDecorationData> placedDecorations = new List<PlacedDecorationData>();
    }
    
    [System.Serializable]
    public class PlacedDecorationData
    {
        public int itemId;
        public Vector2Int position;
        public int rotation;
    }
    
    [System.Serializable]
    public class DecorationSaveData
    {
        public int itemId;
        public bool isPurchased;
        public bool isPlaced;
        public Vector2Int gridPosition;
        public int rotation;
    }
    
    [System.Serializable]
    public class SocialSaveData
    {
        public string playerName;
        public string avatar;
        public List<string> friends = new List<string>();
        public Dictionary<string, int> leaderboardScores = new Dictionary<string, int>();
        public Dictionary<string, int> leaderboardRanks = new Dictionary<string, int>();
    }
    
    [System.Serializable]
    public class AchievementSaveData
    {
        public List<string> unlockedAchievements = new List<string>();
        public List<string> claimedAchievements = new List<string>();
        public Dictionary<string, int> progressCounters = new Dictionary<string, int>();
        public List<CollectionSaveData> collections = new List<CollectionSaveData>();
    }
    
    [System.Serializable]
    public class CollectionSaveData
    {
        public string collectionId;
        public List<string> collectedItems = new List<string>();
        public bool isCompleted;
    }
    
    [System.Serializable]
    public class CharacterSaveData
    {
        public List<CharacterDataSave> characters = new List<CharacterDataSave>();
        public Dictionary<string, int> dialogueCounts = new Dictionary<string, int>();
        public Dictionary<string, float> lastInteractionTimes = new Dictionary<string, float>();
    }
    
    [System.Serializable]
    public class CharacterDataSave
    {
        public string characterId;
        public int level;
        public int experience;
        public int experienceToNext;
        public List<string> unlockedEmotions = new List<string>();
        public string currentEmotion;
        public bool isUnlocked;
        public long lastInteraction;
    }
    
    [System.Serializable]
    public class SettingsSaveData
    {
        public float masterVolume = 1f;
        public float musicVolume = 0.7f;
        public float sfxVolume = 1f;
        public float uiVolume = 1f;
        public float ambientVolume = 0.5f;
        public bool notificationsEnabled = true;
        public bool vibrationEnabled = true;
        public string language = "en";
        public int graphicsQuality = 2;
        public bool fullscreen = true;
    }
    
    public class CloudSaveManager : MonoBehaviour
    {
        [Header("Cloud Save Settings")]
        public bool enableCloudSave = true;
        public bool autoSave = true;
        public float autoSaveInterval = 300f; // 5 minutes
        public bool saveOnLevelComplete = true;
        public bool saveOnPurchase = true;
        public bool saveOnAchievement = true;
        
        [Header("Backend Settings")]
        public string cloudSaveUrl = "https://api.evergreen-game.com/save";
        public string cloudLoadUrl = "https://api.evergreen-game.com/load";
        public string apiKey = "your-api-key";
        
        public static CloudSaveManager Instance { get; private set; }
        
        private SaveData currentSaveData;
        private bool isSaving = false;
        private bool isLoading = false;
        private float lastAutoSaveTime;
        private string playerId;
        
        public event Action<SaveData> OnSaveDataLoaded;
        public event Action<bool> OnSaveCompleted;
        public event Action<string> OnSaveError;
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeCloudSave();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            LoadPlayerId();
            if (enableCloudSave)
            {
                LoadFromCloud();
            }
            else
            {
                LoadFromLocal();
            }
        }
        
        void Update()
        {
            if (autoSave && enableCloudSave && Time.time - lastAutoSaveTime > autoSaveInterval)
            {
                SaveToCloud();
                lastAutoSaveTime = Time.time;
            }
        }
        
        private void InitializeCloudSave()
        {
            // Initialize cloud save system
            Debug.Log("Initializing Cloud Save Manager");
        }
        
        private void LoadPlayerId()
        {
            playerId = PlayerPrefs.GetString("PlayerId", "");
            if (string.IsNullOrEmpty(playerId))
            {
                playerId = System.Guid.NewGuid().ToString();
                PlayerPrefs.SetString("PlayerId", playerId);
            }
        }
        
        public void SaveToCloud()
        {
            if (!enableCloudSave || isSaving) return;
            
            StartCoroutine(SaveToCloudCoroutine());
        }
        
        private IEnumerator SaveToCloudCoroutine()
        {
            isSaving = true;
            
            try
            {
                // Collect current save data
                currentSaveData = CollectSaveData();
                
                // Convert to JSON
                string jsonData = JsonUtility.ToJson(currentSaveData, true);
                
                // Compress data (optional)
                byte[] compressedData = CompressData(jsonData);
                
                // Send to cloud
                using (var request = new UnityEngine.Networking.UnityWebRequest(cloudSaveUrl, "POST"))
                {
                    request.SetRequestHeader("Content-Type", "application/json");
                    request.SetRequestHeader("Authorization", $"Bearer {apiKey}");
                    request.SetRequestHeader("Player-ID", playerId);
                    
                    request.uploadHandler = new UnityEngine.Networking.UploadHandlerRaw(compressedData);
                    request.downloadHandler = new UnityEngine.Networking.DownloadHandlerBuffer();
                    
                    yield return request.SendWebRequest();
                    
                    if (request.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
                    {
                        Debug.Log("Save to cloud successful");
                        OnSaveCompleted?.Invoke(true);
                        
                        // Also save locally as backup
                        SaveToLocal();
                    }
                    else
                    {
                        Debug.LogError($"Save to cloud failed: {request.error}");
                        OnSaveError?.Invoke(request.error);
                        
                        // Fallback to local save
                        SaveToLocal();
                    }
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"Save to cloud error: {e.Message}");
                OnSaveError?.Invoke(e.Message);
                
                // Fallback to local save
                SaveToLocal();
            }
            finally
            {
                isSaving = false;
            }
        }
        
        public void LoadFromCloud()
        {
            if (!enableCloudSave || isLoading) return;
            
            StartCoroutine(LoadFromCloudCoroutine());
        }
        
        private IEnumerator LoadFromCloudCoroutine()
        {
            isLoading = true;
            
            try
            {
                using (var request = new UnityEngine.Networking.UnityWebRequest(cloudLoadUrl, "GET"))
                {
                    request.SetRequestHeader("Authorization", $"Bearer {apiKey}");
                    request.SetRequestHeader("Player-ID", playerId);
                    request.downloadHandler = new UnityEngine.Networking.DownloadHandlerBuffer();
                    
                    yield return request.SendWebRequest();
                    
                    if (request.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
                    {
                        // Decompress data
                        string jsonData = DecompressData(request.downloadHandler.data);
                        
                        // Parse save data
                        currentSaveData = JsonUtility.FromJson<SaveData>(jsonData);
                        
                        // Apply save data
                        ApplySaveData(currentSaveData);
                        
                        Debug.Log("Load from cloud successful");
                        OnSaveDataLoaded?.Invoke(currentSaveData);
                    }
                    else
                    {
                        Debug.LogWarning($"Load from cloud failed: {request.error}");
                        // Fallback to local load
                        LoadFromLocal();
                    }
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"Load from cloud error: {e.Message}");
                // Fallback to local load
                LoadFromLocal();
            }
            finally
            {
                isLoading = false;
            }
        }
        
        private void LoadFromLocal()
        {
            try
            {
                string jsonData = PlayerPrefs.GetString("SaveData", "");
                if (!string.IsNullOrEmpty(jsonData))
                {
                    currentSaveData = JsonUtility.FromJson<SaveData>(jsonData);
                    ApplySaveData(currentSaveData);
                    Debug.Log("Load from local successful");
                }
                else
                {
                    Debug.Log("No local save data found, creating new save");
                    CreateNewSaveData();
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"Load from local error: {e.Message}");
                CreateNewSaveData();
            }
        }
        
        private void SaveToLocal()
        {
            try
            {
                currentSaveData = CollectSaveData();
                string jsonData = JsonUtility.ToJson(currentSaveData, true);
                PlayerPrefs.SetString("SaveData", jsonData);
                Debug.Log("Save to local successful");
            }
            catch (Exception e)
            {
                Debug.LogError($"Save to local error: {e.Message}");
            }
        }
        
        private SaveData CollectSaveData()
        {
            var saveData = new SaveData
            {
                playerId = playerId,
                timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                version = 1,
                gameData = CollectGameData(),
                metaGameData = CollectMetaGameData(),
                socialData = CollectSocialData(),
                achievementData = CollectAchievementData(),
                characterData = CollectCharacterData(),
                settingsData = CollectSettingsData()
            };
            
            return saveData;
        }
        
        private GameSaveData CollectGameData()
        {
            return new GameSaveData
            {
                currentLevel = Evergreen.Game.GameState.CurrentLevel,
                coins = Evergreen.Game.GameState.Coins,
                gems = Evergreen.Game.GameState.Gems,
                energyCurrent = Evergreen.Game.GameState.EnergyCurrent,
                energyMax = Evergreen.Game.GameState.EnergyMax,
                lastEnergyTimestamp = 0, // This would be collected from GameState
                totalScore = 0, // This would be collected from game statistics
                levelsCompleted = 0, // This would be collected from game statistics
                matchesMade = 0, // This would be collected from game statistics
                specialMatchesMade = 0, // This would be collected from game statistics
                threeStarLevels = 0, // This would be collected from game statistics
                winStreak = 0, // This would be collected from game statistics
                maxWinStreak = 0, // This would be collected from game statistics
                totalPlayTime = Time.time // This would be collected from game statistics
            };
        }
        
        private MetaGameSaveData CollectMetaGameData()
        {
            var metaGameData = new MetaGameSaveData
            {
                currentRoom = 0, // This would be collected from DecorationSystem
                totalCoinsEarned = 0, // This would be collected from DecorationSystem
                totalGemsEarned = 0 // This would be collected from DecorationSystem
            };
            
            // Collect room data
            if (Evergreen.MetaGame.DecorationSystem.Instance != null)
            {
                foreach (var room in Evergreen.MetaGame.DecorationSystem.Instance.rooms)
                {
                    var roomSaveData = new RoomSaveData
                    {
                        roomId = room.id,
                        isUnlocked = room.isUnlocked
                    };
                    
                    // Collect placed decorations
                    foreach (var decoration in room.decorations)
                    {
                        if (decoration.isPlaced)
                        {
                            roomSaveData.placedDecorations.Add(new PlacedDecorationData
                            {
                                itemId = decoration.id,
                                position = decoration.gridPosition,
                                rotation = decoration.rotation
                            });
                        }
                    }
                    
                    metaGameData.rooms.Add(roomSaveData);
                }
            }
            
            return metaGameData;
        }
        
        private SocialSaveData CollectSocialData()
        {
            return new SocialSaveData
            {
                playerName = PlayerPrefs.GetString("PlayerName", "Player"),
                avatar = PlayerPrefs.GetString("PlayerAvatar", "default_avatar")
            };
        }
        
        private AchievementSaveData CollectAchievementData()
        {
            var achievementData = new AchievementSaveData();
            
            if (Evergreen.Collections.AchievementSystem.Instance != null)
            {
                foreach (var achievement in Evergreen.Collections.AchievementSystem.Instance.achievements)
                {
                    if (achievement.isUnlocked)
                    {
                        achievementData.unlockedAchievements.Add(achievement.achievementId);
                    }
                    
                    if (achievement.isClaimed)
                    {
                        achievementData.claimedAchievements.Add(achievement.achievementId);
                    }
                }
            }
            
            return achievementData;
        }
        
        private CharacterSaveData CollectCharacterData()
        {
            var characterData = new CharacterSaveData();
            
            if (Evergreen.Character.CharacterSystem.Instance != null)
            {
                foreach (var character in Evergreen.Character.CharacterSystem.Instance.characters)
                {
                    characterData.characters.Add(new CharacterDataSave
                    {
                        characterId = character.characterId,
                        level = character.level,
                        experience = character.experience,
                        experienceToNext = character.experienceToNext,
                        unlockedEmotions = character.unlockedEmotions,
                        currentEmotion = character.currentEmotion,
                        isUnlocked = character.isUnlocked,
                        lastInteraction = character.lastInteraction
                    });
                }
            }
            
            return characterData;
        }
        
        private SettingsSaveData CollectSettingsData()
        {
            return new SettingsSaveData
            {
                masterVolume = PlayerPrefs.GetFloat("MasterVolume", 1f),
                musicVolume = PlayerPrefs.GetFloat("MusicVolume", 0.7f),
                sfxVolume = PlayerPrefs.GetFloat("SFXVolume", 1f),
                uiVolume = PlayerPrefs.GetFloat("UIVolume", 1f),
                ambientVolume = PlayerPrefs.GetFloat("AmbientVolume", 0.5f),
                notificationsEnabled = PlayerPrefs.GetInt("NotificationsEnabled", 1) == 1,
                vibrationEnabled = PlayerPrefs.GetInt("VibrationEnabled", 1) == 1,
                language = PlayerPrefs.GetString("Language", "en"),
                graphicsQuality = PlayerPrefs.GetInt("GraphicsQuality", 2),
                fullscreen = PlayerPrefs.GetInt("Fullscreen", 1) == 1
            };
        }
        
        private void ApplySaveData(SaveData saveData)
        {
            if (saveData == null) return;
            
            // Apply game data
            if (saveData.gameData != null)
            {
                ApplyGameData(saveData.gameData);
            }
            
            // Apply meta game data
            if (saveData.metaGameData != null)
            {
                ApplyMetaGameData(saveData.metaGameData);
            }
            
            // Apply social data
            if (saveData.socialData != null)
            {
                ApplySocialData(saveData.socialData);
            }
            
            // Apply achievement data
            if (saveData.achievementData != null)
            {
                ApplyAchievementData(saveData.achievementData);
            }
            
            // Apply character data
            if (saveData.characterData != null)
            {
                ApplyCharacterData(saveData.characterData);
            }
            
            // Apply settings data
            if (saveData.settingsData != null)
            {
                ApplySettingsData(saveData.settingsData);
            }
        }
        
        private void ApplyGameData(GameSaveData gameData)
        {
            // Apply to GameState
            Evergreen.Game.GameState.CurrentLevel = gameData.currentLevel;
            Evergreen.Game.GameState.AddCoins(gameData.coins - Evergreen.Game.GameState.Coins);
            Evergreen.Game.GameState.AddGems(gameData.gems - Evergreen.Game.GameState.Gems);
        }
        
        private void ApplyMetaGameData(MetaGameSaveData metaGameData)
        {
            // Apply to DecorationSystem
            if (Evergreen.MetaGame.DecorationSystem.Instance != null)
            {
                foreach (var roomSaveData in metaGameData.rooms)
                {
                    var room = Evergreen.MetaGame.DecorationSystem.Instance.GetRoom(roomSaveData.roomId);
                    if (room != null)
                    {
                        room.isUnlocked = roomSaveData.isUnlocked;
                    }
                }
            }
        }
        
        private void ApplySocialData(SocialSaveData socialData)
        {
            PlayerPrefs.SetString("PlayerName", socialData.playerName);
            PlayerPrefs.SetString("PlayerAvatar", socialData.avatar);
        }
        
        private void ApplyAchievementData(AchievementSaveData achievementData)
        {
            // Apply to AchievementSystem
            if (Evergreen.Collections.AchievementSystem.Instance != null)
            {
                foreach (var achievement in Evergreen.Collections.AchievementSystem.Instance.achievements)
                {
                    if (achievementData.unlockedAchievements.Contains(achievement.achievementId))
                    {
                        achievement.isUnlocked = true;
                    }
                    
                    if (achievementData.claimedAchievements.Contains(achievement.achievementId))
                    {
                        achievement.isClaimed = true;
                    }
                }
            }
        }
        
        private void ApplyCharacterData(CharacterSaveData characterData)
        {
            // Apply to CharacterSystem
            if (Evergreen.Character.CharacterSystem.Instance != null)
            {
                foreach (var characterSave in characterData.characters)
                {
                    var character = Evergreen.Character.CharacterSystem.Instance.GetCharacter(characterSave.characterId);
                    if (character != null)
                    {
                        character.level = characterSave.level;
                        character.experience = characterSave.experience;
                        character.experienceToNext = characterSave.experienceToNext;
                        character.unlockedEmotions = characterSave.unlockedEmotions;
                        character.currentEmotion = characterSave.currentEmotion;
                        character.isUnlocked = characterSave.isUnlocked;
                        character.lastInteraction = characterSave.lastInteraction;
                    }
                }
            }
        }
        
        private void ApplySettingsData(SettingsSaveData settingsData)
        {
            PlayerPrefs.SetFloat("MasterVolume", settingsData.masterVolume);
            PlayerPrefs.SetFloat("MusicVolume", settingsData.musicVolume);
            PlayerPrefs.SetFloat("SFXVolume", settingsData.sfxVolume);
            PlayerPrefs.SetFloat("UIVolume", settingsData.uiVolume);
            PlayerPrefs.SetFloat("AmbientVolume", settingsData.ambientVolume);
            PlayerPrefs.SetInt("NotificationsEnabled", settingsData.notificationsEnabled ? 1 : 0);
            PlayerPrefs.SetInt("VibrationEnabled", settingsData.vibrationEnabled ? 1 : 0);
            PlayerPrefs.SetString("Language", settingsData.language);
            PlayerPrefs.SetInt("GraphicsQuality", settingsData.graphicsQuality);
            PlayerPrefs.SetInt("Fullscreen", settingsData.fullscreen ? 1 : 0);
        }
        
        private void CreateNewSaveData()
        {
            currentSaveData = new SaveData
            {
                playerId = playerId,
                timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                version = 1
            };
            
            ApplySaveData(currentSaveData);
        }
        
        private byte[] CompressData(string data)
        {
            // Simple compression (in a real implementation, you'd use proper compression)
            return Encoding.UTF8.GetBytes(data);
        }
        
        private string DecompressData(byte[] data)
        {
            // Simple decompression (in a real implementation, you'd use proper decompression)
            return Encoding.UTF8.GetString(data);
        }
        
        // Public methods for triggering saves
        public void OnLevelComplete()
        {
            if (saveOnLevelComplete)
            {
                SaveToCloud();
            }
        }
        
        public void OnPurchase()
        {
            if (saveOnPurchase)
            {
                SaveToCloud();
            }
        }
        
        public void OnAchievementUnlocked()
        {
            if (saveOnAchievement)
            {
                SaveToCloud();
            }
        }
        
        void OnApplicationPause(bool pauseStatus)
        {
            if (pauseStatus && enableCloudSave)
            {
                SaveToCloud();
            }
        }
        
        void OnApplicationFocus(bool hasFocus)
        {
            if (!hasFocus && enableCloudSave)
            {
                SaveToCloud();
            }
        }
    }
}