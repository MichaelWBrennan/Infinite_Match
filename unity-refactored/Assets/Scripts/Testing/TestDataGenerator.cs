using System;
using System.Collections.Generic;
using UnityEngine;
using Evergreen.Core;

namespace Evergreen.Testing
{
    /// <summary>
    /// Test Data Generator for creating comprehensive test data
    /// </summary>
    public class TestDataGenerator
    {
        private System.Random _random = new System.Random();
        
        public void GenerateMatch3Data(int count)
        {
            var match3Data = new List<Match3TestData>();
            
            for (int i = 0; i < count; i++)
            {
                var data = new Match3TestData
                {
                    LevelId = i + 1,
                    BoardSize = new Vector2Int(
                        _random.Next(6, 10),
                        _random.Next(6, 10)
                    ),
                    NumColors = _random.Next(4, 7),
                    MoveLimit = _random.Next(20, 50),
                    Goals = GenerateGoals(),
                    SpecialPieces = GenerateSpecialPieces(),
                    Obstacles = GenerateObstacles(),
                    ExpectedScore = _random.Next(1000, 10000),
                    Difficulty = (DifficultyLevel)_random.Next(0, 3)
                };
                
                match3Data.Add(data);
            }
            
            // Save test data
            SaveTestData("Match3Data", match3Data);
        }
        
        public void GeneratePlayerData(int count)
        {
            var playerData = new List<PlayerTestData>();
            
            for (int i = 0; i < count; i++)
            {
                var data = new PlayerTestData
                {
                    PlayerId = $"Player_{i + 1}",
                    Level = _random.Next(1, 100),
                    Coins = _random.Next(0, 10000),
                    Gems = _random.Next(0, 1000),
                    Energy = _random.Next(0, 100),
                    Experience = _random.Next(0, 100000),
                    PlayTime = TimeSpan.FromHours(_random.Next(0, 1000)),
                    PurchaseHistory = GeneratePurchaseHistory(),
                    AchievementProgress = GenerateAchievementProgress(),
                    Settings = GeneratePlayerSettings()
                };
                
                playerData.Add(data);
            }
            
            SaveTestData("PlayerData", playerData);
        }
        
        public void GenerateLevelData(int count)
        {
            var levelData = new List<LevelTestData>();
            
            for (int i = 0; i < count; i++)
            {
                var data = new LevelTestData
                {
                    LevelId = i + 1,
                    Name = $"Level {i + 1}",
                    Description = $"Test level {i + 1}",
                    Difficulty = (DifficultyLevel)_random.Next(0, 3),
                    BoardSize = new Vector2Int(
                        _random.Next(6, 10),
                        _random.Next(6, 10)
                    ),
                    NumColors = _random.Next(4, 7),
                    MoveLimit = _random.Next(20, 50),
                    TimeLimit = _random.Next(60, 300),
                    Goals = GenerateGoals(),
                    Obstacles = GenerateObstacles(),
                    SpecialPieces = GenerateSpecialPieces(),
                    Rewards = GenerateRewards(),
                    Prerequisites = GeneratePrerequisites(),
                    IsUnlocked = _random.Next(0, 2) == 1,
                    CompletionRate = (float)_random.NextDouble(),
                    AverageScore = _random.Next(1000, 10000),
                    AverageMoves = _random.Next(10, 40)
                };
                
                levelData.Add(data);
            }
            
            SaveTestData("LevelData", levelData);
        }
        
        public void GenerateEconomyData(int count)
        {
            var economyData = new List<EconomyTestData>();
            
            for (int i = 0; i < count; i++)
            {
                var data = new EconomyTestData
                {
                    TransactionId = $"TXN_{i + 1}",
                    PlayerId = $"Player_{_random.Next(1, 100)}",
                    TransactionType = (TransactionType)_random.Next(0, 4),
                    Amount = _random.Next(1, 1000),
                    Currency = (CurrencyType)_random.Next(0, 3),
                    Price = (float)(_random.NextDouble() * 100),
                    Timestamp = DateTime.Now.AddDays(-_random.Next(0, 365)),
                    Success = _random.Next(0, 2) == 1,
                    Refunded = _random.Next(0, 10) == 0,
                    Metadata = GenerateTransactionMetadata()
                };
                
                economyData.Add(data);
            }
            
            SaveTestData("EconomyData", economyData);
        }
        
        private List<Goal> GenerateGoals()
        {
            var goals = new List<Goal>();
            var goalCount = _random.Next(1, 4);
            
            for (int i = 0; i < goalCount; i++)
            {
                var goal = new Goal
                {
                    Type = (GoalType)_random.Next(0, 6),
                    TargetValue = _random.Next(10, 100),
                    CurrentValue = 0,
                    IsCompleted = false,
                    Reward = GenerateReward()
                };
                
                goals.Add(goal);
            }
            
            return goals;
        }
        
        private List<SpecialPiece> GenerateSpecialPieces()
        {
            var specialPieces = new List<SpecialPiece>();
            var pieceCount = _random.Next(0, 5);
            
            for (int i = 0; i < pieceCount; i++)
            {
                var piece = new SpecialPiece
                {
                    Type = (SpecialPieceType)_random.Next(0, 4),
                    Position = new Vector2Int(
                        _random.Next(0, 10),
                        _random.Next(0, 10)
                    ),
                    Color = _random.Next(0, 6),
                    Power = _random.Next(1, 5)
                };
                
                specialPieces.Add(piece);
            }
            
            return specialPieces;
        }
        
        private List<Obstacle> GenerateObstacles()
        {
            var obstacles = new List<Obstacle>();
            var obstacleCount = _random.Next(0, 10);
            
            for (int i = 0; i < obstacleCount; i++)
            {
                var obstacle = new Obstacle
                {
                    Type = (ObstacleType)_random.Next(0, 6),
                    Position = new Vector2Int(
                        _random.Next(0, 10),
                        _random.Next(0, 10)
                    ),
                    Health = _random.Next(1, 5),
                    IsDestructible = _random.Next(0, 2) == 1
                };
                
                obstacles.Add(obstacle);
            }
            
            return obstacles;
        }
        
        private List<Reward> GenerateRewards()
        {
            var rewards = new List<Reward>();
            var rewardCount = _random.Next(1, 5);
            
            for (int i = 0; i < rewardCount; i++)
            {
                var reward = new Reward
                {
                    Type = (RewardType)_random.Next(0, 4),
                    Amount = _random.Next(1, 100),
                    Currency = (CurrencyType)_random.Next(0, 3),
                    Rarity = (Rarity)_random.Next(0, 4),
                    IsGuaranteed = _random.Next(0, 2) == 1
                };
                
                rewards.Add(reward);
            }
            
            return rewards;
        }
        
        private Reward GenerateReward()
        {
            return new Reward
            {
                Type = (RewardType)_random.Next(0, 4),
                Amount = _random.Next(1, 100),
                Currency = (CurrencyType)_random.Next(0, 3),
                Rarity = (Rarity)_random.Next(0, 4),
                IsGuaranteed = true
            };
        }
        
        private List<int> GeneratePrerequisites()
        {
            var prerequisites = new List<int>();
            var prereqCount = _random.Next(0, 3);
            
            for (int i = 0; i < prereqCount; i++)
            {
                prerequisites.Add(_random.Next(1, 100));
            }
            
            return prerequisites;
        }
        
        private List<Purchase> GeneratePurchaseHistory()
        {
            var purchases = new List<Purchase>();
            var purchaseCount = _random.Next(0, 20);
            
            for (int i = 0; i < purchaseCount; i++)
            {
                var purchase = new Purchase
                {
                    TransactionId = $"TXN_{i + 1}",
                    ItemId = $"Item_{_random.Next(1, 100)}",
                    Amount = _random.Next(1, 100),
                    Price = (float)(_random.NextDouble() * 100),
                    Currency = (CurrencyType)_random.Next(0, 3),
                    Timestamp = DateTime.Now.AddDays(-_random.Next(0, 365)),
                    Success = _random.Next(0, 2) == 1
                };
                
                purchases.Add(purchase);
            }
            
            return purchases;
        }
        
        private Dictionary<string, int> GenerateAchievementProgress()
        {
            var progress = new Dictionary<string, int>();
            var achievementCount = _random.Next(0, 20);
            
            for (int i = 0; i < achievementCount; i++)
            {
                progress[$"Achievement_{i + 1}"] = _random.Next(0, 100);
            }
            
            return progress;
        }
        
        private PlayerSettings GeneratePlayerSettings()
        {
            return new PlayerSettings
            {
                MusicVolume = (float)_random.NextDouble(),
                SFXVolume = (float)_random.NextDouble(),
                VoiceVolume = (float)_random.NextDouble(),
                GraphicsQuality = (QualityLevel)_random.Next(0, 3),
                Language = "en",
                NotificationsEnabled = _random.Next(0, 2) == 1,
                AnalyticsEnabled = _random.Next(0, 2) == 1,
                PrivacyMode = _random.Next(0, 2) == 1
            };
        }
        
        private Dictionary<string, object> GenerateTransactionMetadata()
        {
            var metadata = new Dictionary<string, object>
            {
                ["platform"] = "mobile",
                ["version"] = "1.0.0",
                ["region"] = "US",
                ["payment_method"] = "credit_card",
                ["discount_applied"] = _random.Next(0, 2) == 1,
                ["promo_code"] = _random.Next(0, 2) == 1 ? $"PROMO_{_random.Next(1000, 9999)}" : null
            };
            
            return metadata;
        }
        
        private void SaveTestData<T>(string fileName, List<T> data)
        {
            try
            {
                var json = JsonUtility.ToJson(new TestDataContainer<T> { Data = data }, true);
                var path = System.IO.Path.Combine(Application.persistentDataPath, "TestData", $"{fileName}.json");
                
                if (!System.IO.Directory.Exists(System.IO.Path.GetDirectoryName(path)))
                {
                    System.IO.Directory.CreateDirectory(System.IO.Path.GetDirectoryName(path));
                }
                
                System.IO.File.WriteAllText(path, json);
                Debug.Log($"Test data saved: {fileName} ({data.Count} items)");
            }
            catch (Exception ex)
            {
                Debug.LogError($"Failed to save test data {fileName}: {ex.Message}");
            }
        }
    }
    
    [System.Serializable]
    public class TestDataContainer<T>
    {
        public List<T> Data;
    }
    
    // Test Data Classes
    [System.Serializable]
    public class Match3TestData
    {
        public int LevelId;
        public Vector2Int BoardSize;
        public int NumColors;
        public int MoveLimit;
        public List<Goal> Goals;
        public List<SpecialPiece> SpecialPieces;
        public List<Obstacle> Obstacles;
        public int ExpectedScore;
        public DifficultyLevel Difficulty;
    }
    
    [System.Serializable]
    public class PlayerTestData
    {
        public string PlayerId;
        public int Level;
        public int Coins;
        public int Gems;
        public int Energy;
        public int Experience;
        public TimeSpan PlayTime;
        public List<Purchase> PurchaseHistory;
        public Dictionary<string, int> AchievementProgress;
        public PlayerSettings Settings;
    }
    
    [System.Serializable]
    public class LevelTestData
    {
        public int LevelId;
        public string Name;
        public string Description;
        public DifficultyLevel Difficulty;
        public Vector2Int BoardSize;
        public int NumColors;
        public int MoveLimit;
        public int TimeLimit;
        public List<Goal> Goals;
        public List<Obstacle> Obstacles;
        public List<SpecialPiece> SpecialPieces;
        public List<Reward> Rewards;
        public List<int> Prerequisites;
        public bool IsUnlocked;
        public float CompletionRate;
        public int AverageScore;
        public int AverageMoves;
    }
    
    [System.Serializable]
    public class EconomyTestData
    {
        public string TransactionId;
        public string PlayerId;
        public TransactionType TransactionType;
        public int Amount;
        public CurrencyType Currency;
        public float Price;
        public DateTime Timestamp;
        public bool Success;
        public bool Refunded;
        public Dictionary<string, object> Metadata;
    }
    
    [System.Serializable]
    public class Goal
    {
        public GoalType Type;
        public int TargetValue;
        public int CurrentValue;
        public bool IsCompleted;
        public Reward Reward;
    }
    
    [System.Serializable]
    public class SpecialPiece
    {
        public SpecialPieceType Type;
        public Vector2Int Position;
        public int Color;
        public int Power;
    }
    
    [System.Serializable]
    public class Obstacle
    {
        public ObstacleType Type;
        public Vector2Int Position;
        public int Health;
        public bool IsDestructible;
    }
    
    [System.Serializable]
    public class Reward
    {
        public RewardType Type;
        public int Amount;
        public CurrencyType Currency;
        public Rarity Rarity;
        public bool IsGuaranteed;
    }
    
    [System.Serializable]
    public class Purchase
    {
        public string TransactionId;
        public string ItemId;
        public int Amount;
        public float Price;
        public CurrencyType Currency;
        public DateTime Timestamp;
        public bool Success;
    }
    
    [System.Serializable]
    public class PlayerSettings
    {
        public float MusicVolume;
        public float SFXVolume;
        public float VoiceVolume;
        public QualityLevel GraphicsQuality;
        public string Language;
        public bool NotificationsEnabled;
        public bool AnalyticsEnabled;
        public bool PrivacyMode;
    }
    
    // Enums
    public enum DifficultyLevel
    {
        Easy,
        Medium,
        Hard,
        Expert
    }
    
    public enum GoalType
    {
        CollectColor,
        ClearJelly,
        DeliverIngredients,
        ClearVines,
        ClearLicorice,
        ClearHoney
    }
    
    public enum SpecialPieceType
    {
        RocketH,
        RocketV,
        Bomb,
        ColorBomb
    }
    
    public enum ObstacleType
    {
        Hole,
        Crate,
        Ice,
        Lock,
        Chocolate,
        Vine
    }
    
    public enum RewardType
    {
        Coins,
        Gems,
        Energy,
        Experience
    }
    
    public enum CurrencyType
    {
        Coins,
        Gems,
        Energy
    }
    
    public enum Rarity
    {
        Common,
        Uncommon,
        Rare,
        Epic,
        Legendary
    }
    
    public enum TransactionType
    {
        Purchase,
        Reward,
        Refund,
        Gift
    }
}