using System;
using System.Collections.Generic;
using UnityEngine;
using Evergreen.Core;

namespace Evergreen.Testing
{
    /// <summary>
    /// Mock Data Provider for testing with simulated data and services
    /// </summary>
    public class MockDataProvider
    {
        private Dictionary<Type, object> _mockServices = new Dictionary<Type, object>();
        private Dictionary<string, object> _mockData = new Dictionary<string, object>();
        
        public void SetupMockServices()
        {
            // Mock Game Manager
            _mockServices[typeof(GameManager)] = new MockGameManager();
            
            // Mock Audio System
            _mockServices[typeof(AdvancedAudioSystem)] = new MockAudioSystem();
            
            // Mock UI System
            _mockServices[typeof(AdvancedUISystem)] = new MockUISystem();
            
            // Mock Analytics System
            _mockServices[typeof(AdvancedAnalyticsSystem)] = new MockAnalyticsSystem();
            
            // Mock Performance System
            _mockServices[typeof(AdvancedPerformanceSystem)] = new MockPerformanceSystem();
            
            // Mock Event Bus
            _mockServices[typeof(AdvancedEventBus)] = new MockEventBus();
            
            // Mock Logger
            _mockServices[typeof(AdvancedLogger)] = new MockLogger();
        }
        
        public void SetupMockData()
        {
            // Mock player data
            _mockData["PlayerData"] = new MockPlayerData
            {
                PlayerId = "test_player_1",
                Level = 25,
                Coins = 5000,
                Gems = 100,
                Energy = 50,
                Experience = 15000,
                PlayTime = TimeSpan.FromHours(25.5f),
                IsPremium = false,
                LastLogin = DateTime.Now.AddHours(-2)
            };
            
            // Mock level data
            _mockData["LevelData"] = new MockLevelData
            {
                LevelId = 1,
                Name = "Test Level",
                Difficulty = DifficultyLevel.Medium,
                BoardSize = new Vector2Int(8, 8),
                NumColors = 5,
                MoveLimit = 30,
                Goals = new List<MockGoal>
                {
                    new MockGoal { Type = GoalType.CollectColor, TargetValue = 50, CurrentValue = 0 },
                    new MockGoal { Type = GoalType.ClearJelly, TargetValue = 20, CurrentValue = 0 }
                },
                IsUnlocked = true,
                CompletionRate = 0.75f
            };
            
            // Mock economy data
            _mockData["EconomyData"] = new MockEconomyData
            {
                CoinsPerLevel = 100,
                GemsPerLevel = 5,
                EnergyRegenRate = 1f,
                EnergyRegenInterval = 300f,
                MaxEnergy = 100,
                PurchaseMultiplier = 1.0f
            };
            
            // Mock settings data
            _mockData["SettingsData"] = new MockSettingsData
            {
                MusicVolume = 0.8f,
                SFXVolume = 1.0f,
                VoiceVolume = 0.9f,
                GraphicsQuality = QualityLevel.High,
                Language = "en",
                NotificationsEnabled = true,
                AnalyticsEnabled = true
            };
        }
        
        public T GetMockService<T>()
        {
            if (_mockServices.ContainsKey(typeof(T)))
            {
                return (T)_mockServices[typeof(T)];
            }
            return default(T);
        }
        
        public T GetMockData<T>(string key)
        {
            if (_mockData.ContainsKey(key))
            {
                return (T)_mockData[key];
            }
            return default(T);
        }
        
        public void SetMockData<T>(string key, T data)
        {
            _mockData[key] = data;
        }
        
        public void ClearMockData()
        {
            _mockData.Clear();
        }
        
        public void ClearMockServices()
        {
            _mockServices.Clear();
        }
    }
    
    // Mock Service Implementations
    public class MockGameManager : GameManager
    {
        public override int GetCurrency(string currencyType)
        {
            switch (currencyType)
            {
                case "coins": return 5000;
                case "gems": return 100;
                case "energy": return 50;
                default: return 0;
            }
        }
        
        public override void AddCurrency(string currencyType, int amount)
        {
            // Mock implementation - do nothing
        }
        
        public override bool SpendCurrency(string currencyType, int amount)
        {
            return GetCurrency(currencyType) >= amount;
        }
    }
    
    public class MockAudioSystem : AdvancedAudioSystem
    {
        public override void PlayMusic(string clipName, bool fadeIn = true)
        {
            Debug.Log($"Mock: Playing music {clipName}");
        }
        
        public override void PlaySFX(string clipName, Vector3 position = default, float pitch = 1f)
        {
            Debug.Log($"Mock: Playing SFX {clipName}");
        }
        
        public override void PlayVoice(string clipName, bool showSubtitles = true)
        {
            Debug.Log($"Mock: Playing voice {clipName}");
        }
    }
    
    public class MockUISystem : AdvancedUISystem
    {
        public override void ShowScreen(string screenId, bool animated = true)
        {
            Debug.Log($"Mock: Showing screen {screenId}");
        }
        
        public override void ShowNotification(string message, NotificationType type = NotificationType.Info, float duration = 0f)
        {
            Debug.Log($"Mock: Showing notification {message}");
        }
        
        public override void ShowModal(string modalId, GameObject modalPrefab, bool animated = true)
        {
            Debug.Log($"Mock: Showing modal {modalId}");
        }
    }
    
    public class MockAnalyticsSystem : AdvancedAnalyticsSystem
    {
        public override void TrackEvent(string eventName, Dictionary<string, object> parameters = null)
        {
            Debug.Log($"Mock: Tracking event {eventName}");
        }
        
        public override void TrackLevelStart(int levelId, Dictionary<string, object> parameters = null)
        {
            Debug.Log($"Mock: Tracking level start {levelId}");
        }
        
        public override void TrackLevelComplete(int levelId, int score, int moves, float time, Dictionary<string, object> parameters = null)
        {
            Debug.Log($"Mock: Tracking level complete {levelId} - Score: {score}, Moves: {moves}, Time: {time}");
        }
    }
    
    public class MockPerformanceSystem : AdvancedPerformanceSystem
    {
        public override float GetCurrentFPS()
        {
            return 60f;
        }
        
        public override long GetCurrentMemoryUsage()
        {
            return 100 * 1024 * 1024; // 100MB
        }
        
        public override float GetCurrentCPUUsage()
        {
            return 0.3f;
        }
    }
    
    public class MockEventBus : AdvancedEventBus
    {
        public override void Publish<T>(T eventData)
        {
            Debug.Log($"Mock: Publishing event {typeof(T).Name}");
        }
        
        public override void Subscribe<T>(Action<T> handler)
        {
            Debug.Log($"Mock: Subscribing to event {typeof(T).Name}");
        }
        
        public override void Unsubscribe<T>(Action<T> handler)
        {
            Debug.Log($"Mock: Unsubscribing from event {typeof(T).Name}");
        }
    }
    
    public class MockLogger : AdvancedLogger
    {
        public override void Log(string message)
        {
            Debug.Log($"Mock Logger: {message}");
        }
        
        public override void LogWarning(string message)
        {
            Debug.LogWarning($"Mock Logger: {message}");
        }
        
        public override void LogError(string message)
        {
            Debug.LogError($"Mock Logger: {message}");
        }
    }
    
    // Mock Data Classes
    [System.Serializable]
    public class MockPlayerData
    {
        public string PlayerId;
        public int Level;
        public int Coins;
        public int Gems;
        public int Energy;
        public int Experience;
        public TimeSpan PlayTime;
        public bool IsPremium;
        public DateTime LastLogin;
    }
    
    [System.Serializable]
    public class MockLevelData
    {
        public int LevelId;
        public string Name;
        public DifficultyLevel Difficulty;
        public Vector2Int BoardSize;
        public int NumColors;
        public int MoveLimit;
        public List<MockGoal> Goals;
        public bool IsUnlocked;
        public float CompletionRate;
    }
    
    [System.Serializable]
    public class MockGoal
    {
        public GoalType Type;
        public int TargetValue;
        public int CurrentValue;
    }
    
    [System.Serializable]
    public class MockEconomyData
    {
        public int CoinsPerLevel;
        public int GemsPerLevel;
        public float EnergyRegenRate;
        public float EnergyRegenInterval;
        public int MaxEnergy;
        public float PurchaseMultiplier;
    }
    
    [System.Serializable]
    public class MockSettingsData
    {
        public float MusicVolume;
        public float SFXVolume;
        public float VoiceVolume;
        public QualityLevel GraphicsQuality;
        public string Language;
        public bool NotificationsEnabled;
        public bool AnalyticsEnabled;
    }
}