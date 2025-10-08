using System;
using System.Collections.Generic;
using UnityEngine;
using Evergreen.Core;

namespace Evergreen.Economy
{
    /// <summary>
    /// Comprehensive reward system for Unity games
    /// Handles level completion rewards, achievements, events, and daily rewards
    /// </summary>
    public class RewardSystem : MonoBehaviour
    {
        [Header("Reward Configuration")]
        [SerializeField] private RewardData[] rewardTemplates;
        [SerializeField] private bool enableMultipliers = true;
        [SerializeField] private bool enableStreakRewards = true;
        [SerializeField] private bool enableDailyRewards = true;
        [SerializeField] private bool enableAchievementRewards = true;
        
        [Header("Multiplier Settings")]
        [SerializeField] private float baseMultiplier = 1.0f;
        [SerializeField] private float streakMultiplier = 0.1f; // 10% per streak
        [SerializeField] private float maxMultiplier = 3.0f;
        [SerializeField] private float multiplierDecayRate = 0.1f; // 10% decay per day
        
        [Header("Daily Reward Settings")]
        [SerializeField] private DailyRewardData[] dailyRewards;
        [SerializeField] private int dailyRewardCycle = 7; // 7-day cycle
        [SerializeField] private bool resetOnMiss = true;
        
        private Dictionary<string, RewardData> _rewardTemplates = new Dictionary<string, RewardData>();
        private Dictionary<string, RewardInstance> _activeRewards = new Dictionary<string, RewardInstance>();
        private Dictionary<string, PlayerRewardProgress> _playerProgress = new Dictionary<string, PlayerRewardProgress>();
        private Dictionary<string, AchievementData> _achievements = new Dictionary<string, AchievementData>();
        
        // Events
        public System.Action<RewardInstance> OnRewardEarned;
        public System.Action<RewardInstance> OnRewardClaimed;
        public System.Action<AchievementData> OnAchievementUnlocked;
        public System.Action<DailyRewardData> OnDailyRewardClaimed;
        public System.Action<float> OnMultiplierChanged;
        
        public static RewardSystem Instance { get; private set; }
        
        [System.Serializable]
        public class RewardData
        {
            public string id;
            public string name;
            public string description;
            public RewardType type;
            public RewardRarity rarity;
            public List<RewardItem> items = new List<RewardItem>();
            public RewardConditions conditions;
            public bool isRepeatable;
            public int maxClaims = -1; // -1 = unlimited
            public float weight = 1.0f; // For random selection
            public string iconPath;
            public string soundPath;
            public string particleEffectPath;
        }
        
        [System.Serializable]
        public class RewardItem
        {
            public string currencyId;
            public int amount;
            public int minAmount;
            public int maxAmount;
            public bool isRandom;
            public float probability = 1.0f;
        }
        
        [System.Serializable]
        public class RewardConditions
        {
            public int minLevel = 1;
            public int maxLevel = int.MaxValue;
            public int minScore = 0;
            public int maxScore = int.MaxValue;
            public int minStreak = 0;
            public int maxStreak = int.MaxValue;
            public string[] requiredAchievements;
            public string[] requiredCurrencies;
            public int[] requiredAmounts;
            public bool requireFirstTime = false;
            public bool requirePerfectScore = false;
            public bool requireNoHints = false;
            public bool requireNoBoosts = false;
        }
        
        [System.Serializable]
        public class RewardInstance
        {
            public string id;
            public string templateId;
            public string playerId;
            public RewardData template;
            public List<RewardItem> actualItems = new List<RewardItem>();
            public DateTime earnedTime;
            public DateTime? claimedTime;
            public bool isClaimed;
            public float multiplier = 1.0f;
            public string source; // "level_complete", "achievement", "daily", "event"
            public string reason; // "level_1", "first_win", "streak_5", etc.
        }
        
        [System.Serializable]
        public class PlayerRewardProgress
        {
            public string playerId;
            public int currentStreak = 0;
            public int maxStreak = 0;
            public int totalRewardsEarned = 0;
            public int totalRewardsClaimed = 0;
            public float currentMultiplier = 1.0f;
            public DateTime lastRewardTime = DateTime.MinValue;
            public DateTime lastDailyRewardTime = DateTime.MinValue;
            public int dailyRewardDay = 0;
            public List<string> claimedRewards = new List<string>();
            public Dictionary<string, int> rewardCounts = new Dictionary<string, int>();
        }
        
        [System.Serializable]
        public class AchievementData
        {
            public string id;
            public string name;
            public string description;
            public AchievementType type;
            public int targetValue;
            public int currentValue;
            public bool isUnlocked;
            public DateTime unlockedTime;
            public List<RewardItem> rewards = new List<RewardItem>();
            public string iconPath;
            public string category;
        }
        
        [System.Serializable]
        public class DailyRewardData
        {
            public int day;
            public string name;
            public string description;
            public List<RewardItem> items = new List<RewardItem>();
            public bool isSpecial;
            public string iconPath;
        }
        
        public enum RewardType
        {
            LevelComplete,
            Achievement,
            Daily,
            Event,
            Streak,
            FirstTime,
            PerfectScore,
            NoHints,
            NoBoosts,
            Special,
            Random
        }
        
        public enum RewardRarity
        {
            Common,
            Uncommon,
            Rare,
            Epic,
            Legendary
        }
        
        public enum AchievementType
        {
            LevelComplete,
            Score,
            Streak,
            Currency,
            Time,
            Special
        }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeRewardsystemSafe();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            LoadRewardData();
            SetupDefaultRewards();
            SetupDefaultAchievements();
            SetupDefaultDailyRewards();
            StartCoroutine(UpdateRewardsystemSafe());
        }
        
        private void InitializeRewardsystemSafe()
        {
            Debug.Log("Reward System initialized");
        }
        
        private void SetupDefaultRewards()
        {
            if (rewardTemplates == null || rewardTemplates.Length == 0)
            {
                rewardTemplates = new RewardData[]
                {
                    new RewardData
                    {
                        id = "level_complete_basic",
                        name = "Level Complete",
                        description = "Reward for completing a level",
                        type = RewardType.LevelComplete,
                        rarity = RewardRarity.Common,
                        items = new List<RewardItem>
                        {
                            new RewardItem { currencyId = "coins", amount = 100, minAmount = 50, maxAmount = 200, isRandom = true },
                            new RewardItem { currencyId = "stars", amount = 1, minAmount = 1, maxAmount = 3, isRandom = true }
                        },
                        conditions = new RewardConditions
                        {
                            minLevel = 1,
                            maxLevel = int.MaxValue
                        },
                        isRepeatable = true,
                        maxClaims = -1,
                        weight = 1.0f
                    },
                    new RewardData
                    {
                        id = "level_complete_perfect",
                        name = "Perfect Score",
                        description = "Reward for achieving a perfect score",
                        type = RewardType.PerfectScore,
                        rarity = RewardRarity.Rare,
                        items = new List<RewardItem>
                        {
                            new RewardItem { currencyId = "coins", amount = 500, minAmount = 300, maxAmount = 800, isRandom = true },
                            new RewardItem { currencyId = "gems", amount = 10, minAmount = 5, maxAmount = 20, isRandom = true },
                            new RewardItem { currencyId = "stars", amount = 5, minAmount = 3, maxAmount = 8, isRandom = true }
                        },
                        conditions = new RewardConditions
                        {
                            minLevel = 1,
                            maxLevel = int.MaxValue,
                            requirePerfectScore = true
                        },
                        isRepeatable = true,
                        maxClaims = -1,
                        weight = 0.1f
                    },
                    new RewardData
                    {
                        id = "streak_5",
                        name = "5 Win Streak",
                        description = "Reward for winning 5 levels in a row",
                        type = RewardType.Streak,
                        rarity = RewardRarity.Uncommon,
                        items = new List<RewardItem>
                        {
                            new RewardItem { currencyId = "coins", amount = 300, minAmount = 200, maxAmount = 500, isRandom = true },
                            new RewardItem { currencyId = "gems", amount = 5, minAmount = 3, maxAmount = 10, isRandom = true }
                        },
                        conditions = new RewardConditions
                        {
                            minStreak = 5,
                            maxStreak = 5
                        },
                        isRepeatable = true,
                        maxClaims = -1,
                        weight = 0.3f
                    },
                    new RewardData
                    {
                        id = "first_time_level",
                        name = "First Time",
                        description = "Reward for completing a level for the first time",
                        type = RewardType.FirstTime,
                        rarity = RewardRarity.Epic,
                        items = new List<RewardItem>
                        {
                            new RewardItem { currencyId = "coins", amount = 1000, minAmount = 800, maxAmount = 1500, isRandom = true },
                            new RewardItem { currencyId = "gems", amount = 20, minAmount = 15, maxAmount = 30, isRandom = true },
                            new RewardItem { currencyId = "stars", amount = 10, minAmount = 8, maxAmount = 15, isRandom = true }
                        },
                        conditions = new RewardConditions
                        {
                            minLevel = 1,
                            maxLevel = int.MaxValue,
                            requireFirstTime = true
                        },
                        isRepeatable = false,
                        maxClaims = 1,
                        weight = 0.05f
                    }
                };
            }
            
            foreach (var reward in rewardTemplates)
            {
                _rewardTemplates[reward.id] = reward;
            }
        }
        
        private void SetupDefaultAchievements()
        {
            var achievements = new AchievementData[]
            {
                new AchievementData
                {
                    id = "first_level",
                    name = "First Steps",
                    description = "Complete your first level",
                    type = AchievementType.LevelComplete,
                    targetValue = 1,
                    currentValue = 0,
                    isUnlocked = false,
                    rewards = new List<RewardItem>
                    {
                        new RewardItem { currencyId = "coins", amount = 500 },
                        new RewardItem { currencyId = "gems", amount = 10 }
                    },
                    category = "Levels"
                },
                new AchievementData
                {
                    id = "level_master",
                    name = "Level Master",
                    description = "Complete 100 levels",
                    type = AchievementType.LevelComplete,
                    targetValue = 100,
                    currentValue = 0,
                    isUnlocked = false,
                    rewards = new List<RewardItem>
                    {
                        new RewardItem { currencyId = "coins", amount = 5000 },
                        new RewardItem { currencyId = "gems", amount = 100 },
                        new RewardItem { currencyId = "stars", amount = 50 }
                    },
                    category = "Levels"
                },
                new AchievementData
                {
                    id = "streak_master",
                    name = "Streak Master",
                    description = "Achieve a 10-win streak",
                    type = AchievementType.Streak,
                    targetValue = 10,
                    currentValue = 0,
                    isUnlocked = false,
                    rewards = new List<RewardItem>
                    {
                        new RewardItem { currencyId = "coins", amount = 2000 },
                        new RewardItem { currencyId = "gems", amount = 50 }
                    },
                    category = "Streaks"
                },
                new AchievementData
                {
                    id = "coin_collector",
                    name = "Coin Collector",
                    description = "Collect 10,000 coins",
                    type = AchievementType.Currency,
                    targetValue = 10000,
                    currentValue = 0,
                    isUnlocked = false,
                    rewards = new List<RewardItem>
                    {
                        new RewardItem { currencyId = "gems", amount = 25 },
                        new RewardItem { currencyId = "stars", amount = 10 }
                    },
                    category = "Currency"
                }
            };
            
            foreach (var achievement in achievements)
            {
                _achievements[achievement.id] = achievement;
            }
        }
        
        private void SetupDefaultDailyRewards()
        {
            if (dailyRewards == null || dailyRewards.Length == 0)
            {
                dailyRewards = new DailyRewardData[]
                {
                    new DailyRewardData
                    {
                        day = 1,
                        name = "Day 1",
                        description = "Welcome back!",
                        items = new List<RewardItem>
                        {
                            new RewardItem { currencyId = "coins", amount = 100 },
                            new RewardItem { currencyId = "energy", amount = 5 }
                        },
                        isSpecial = false
                    },
                    new DailyRewardData
                    {
                        day = 2,
                        name = "Day 2",
                        description = "Keep it up!",
                        items = new List<RewardItem>
                        {
                            new RewardItem { currencyId = "coins", amount = 150 },
                            new RewardItem { currencyId = "gems", amount = 2 }
                        },
                        isSpecial = false
                    },
                    new DailyRewardData
                    {
                        day = 3,
                        name = "Day 3",
                        description = "You're on fire!",
                        items = new List<RewardItem>
                        {
                            new RewardItem { currencyId = "coins", amount = 200 },
                            new RewardItem { currencyId = "gems", amount = 5 },
                            new RewardItem { currencyId = "stars", amount = 2 }
                        },
                        isSpecial = false
                    },
                    new DailyRewardData
                    {
                        day = 7,
                        name = "Week Complete!",
                        description = "Amazing dedication!",
                        items = new List<RewardItem>
                        {
                            new RewardItem { currencyId = "coins", amount = 1000 },
                            new RewardItem { currencyId = "gems", amount = 25 },
                            new RewardItem { currencyId = "stars", amount = 10 }
                        },
                        isSpecial = true
                    }
                };
            }
        }
        
        public RewardInstance EarnReward(string playerId, string rewardId, string source = "unknown", string reason = "unknown")
        {
            if (!_rewardTemplates.ContainsKey(rewardId)) return null;
            
            var template = _rewardTemplates[rewardId];
            var progress = GetPlayerProgress(playerId);
            
            // Check if reward can be earned
            if (!CanEarnReward(template, progress)) return null;
            
            // Create reward instance
            var reward = new RewardInstance
            {
                id = System.Guid.NewGuid().ToString(),
                templateId = rewardId,
                playerId = playerId,
                template = template,
                earnedTime = DateTime.Now,
                isClaimed = false,
                multiplier = CalculateMultiplier(progress),
                source = source,
                reason = reason
            };
            
            // Calculate actual items based on template
            reward.actualItems = CalculateRewardItems(template, reward.multiplier);
            
            // Store reward
            _activeRewards[reward.id] = reward;
            
            // Update player progress
            UpdatePlayerProgress(playerId, reward);
            
            // Fire event
            OnRewardEarned?.Invoke(reward);
            
            SaveRewardData();
            return reward;
        }
        
        public bool ClaimReward(string rewardId)
        {
            if (!_activeRewards.ContainsKey(rewardId)) return false;
            
            var reward = _activeRewards[rewardId];
            if (reward.isClaimed) return false;
            
            // Award items
            var currencyManager = ServiceLocator.Get<CurrencyManager>();
            if (currencyManager != null)
            {
                foreach (var item in reward.actualItems)
                {
                    currencyManager.AddCurrency(item.currencyId, item.amount, $"reward_{reward.templateId}");
                }
            }
            
            // Mark as claimed
            reward.isClaimed = true;
            reward.claimedTime = DateTime.Now;
            
            // Update player progress
            var progress = GetPlayerProgress(reward.playerId);
            progress.totalRewardsClaimed++;
            progress.claimedRewards.Add(rewardId);
            
            if (!progress.rewardCounts.ContainsKey(reward.templateId))
            {
                progress.rewardCounts[reward.templateId] = 0;
            }
            progress.rewardCounts[reward.templateId]++;
            
            // Fire event
            OnRewardClaimed?.Invoke(reward);
            
            SaveRewardData();
            return true;
        }
        
        public List<RewardInstance> GetPlayerRewards(string playerId, bool unclaimedOnly = false)
        {
            var playerRewards = new List<RewardInstance>();
            
            foreach (var reward in _activeRewards.Values)
            {
                if (reward.playerId == playerId)
                {
                    if (!unclaimedOnly || !reward.isClaimed)
                    {
                        playerRewards.Add(reward);
                    }
                }
            }
            
            return playerRewards;
        }
        
        public RewardInstance GetReward(string rewardId)
        {
            return _activeRewards.ContainsKey(rewardId) ? _activeRewards[rewardId] : null;
        }
        
        public bool CanEarnReward(RewardData template, PlayerRewardProgress progress)
        {
            // Check level requirements
            if (progress.currentLevel < template.conditions.minLevel || 
                progress.currentLevel > template.conditions.maxLevel)
                return false;
            
            // Check streak requirements
            if (progress.currentStreak < template.conditions.minStreak || 
                progress.currentStreak > template.conditions.maxStreak)
                return false;
            
            // Check if already claimed max times
            if (template.maxClaims > 0)
            {
                int claimedCount = progress.rewardCounts.ContainsKey(template.id) ? 
                    progress.rewardCounts[template.id] : 0;
                if (claimedCount >= template.maxClaims)
                    return false;
            }
            
            // Check first time requirement
            if (template.conditions.requireFirstTime && progress.totalRewardsEarned > 0)
                return false;
            
            return true;
        }
        
        private List<RewardItem> CalculateRewardItems(RewardData template, float multiplier)
        {
            var items = new List<RewardItem>();
            
            foreach (var item in template.items)
            {
                if (UnityEngine.Random.Range(0f, 1f) > item.probability) continue;
                
                int amount = item.amount;
                if (item.isRandom)
                {
                    amount = UnityEngine.Random.Range(item.minAmount, item.maxAmount + 1);
                }
                
                amount = Mathf.RoundToInt(amount * multiplier);
                
                items.Add(new RewardItem
                {
                    currencyId = item.currencyId,
                    amount = amount,
                    minAmount = item.minAmount,
                    maxAmount = item.maxAmount,
                    isRandom = item.isRandom,
                    probability = item.probability
                });
            }
            
            return items;
        }
        
        private float CalculateMultiplier(PlayerRewardProgress progress)
        {
            float multiplier = baseMultiplier;
            
            if (enableMultipliers)
            {
                // Streak multiplier
                if (enableStreakRewards)
                {
                    multiplier += progress.currentStreak * streakMultiplier;
                }
                
                // Apply current multiplier
                multiplier *= progress.currentMultiplier;
            }
            
            return Mathf.Clamp(multiplier, 1.0f, maxMultiplier);
        }
        
        private PlayerRewardProgress GetPlayerProgress(string playerId)
        {
            if (!_playerProgress.ContainsKey(playerId))
            {
                _playerProgress[playerId] = new PlayerRewardProgress
                {
                    playerId = playerId,
                    currentStreak = 0,
                    maxStreak = 0,
                    totalRewardsEarned = 0,
                    totalRewardsClaimed = 0,
                    currentMultiplier = baseMultiplier,
                    lastRewardTime = DateTime.MinValue,
                    lastDailyRewardTime = DateTime.MinValue,
                    dailyRewardDay = 0,
                    claimedRewards = new List<string>(),
                    rewardCounts = new Dictionary<string, int>()
                };
            }
            
            return _playerProgress[playerId];
        }
        
        private void UpdatePlayerProgress(string playerId, RewardInstance reward)
        {
            var progress = GetPlayerProgress(playerId);
            
            progress.totalRewardsEarned++;
            progress.lastRewardTime = DateTime.Now;
            
            // Update streak based on reward type
            if (reward.template.type == RewardType.LevelComplete)
            {
                progress.currentStreak++;
                progress.maxStreak = Mathf.Max(progress.maxStreak, progress.currentStreak);
            }
            else if (reward.template.type == RewardType.Streak)
            {
                // Streak rewards don't affect the streak counter
            }
            else
            {
                // Other rewards might break the streak
                progress.currentStreak = 0;
            }
        }
        
        public bool CanClaimDailyReward(string playerId)
        {
            if (!enableDailyRewards) return false;
            
            var progress = GetPlayerProgress(playerId);
            DateTime now = DateTime.Now;
            
            // Check if enough time has passed since last daily reward
            if (progress.lastDailyRewardTime != DateTime.MinValue)
            {
                TimeSpan timeSinceLastReward = now - progress.lastDailyRewardTime;
                if (timeSinceLastReward.TotalHours < 24) return false;
            }
            
            return true;
        }
        
        public DailyRewardData GetDailyReward(string playerId)
        {
            if (!CanClaimDailyReward(playerId)) return null;
            
            var progress = GetPlayerProgress(playerId);
            int day = (progress.dailyRewardDay % dailyRewardCycle) + 1;
            
            foreach (var dailyReward in dailyRewards)
            {
                if (dailyReward.day == day)
                {
                    return dailyReward;
                }
            }
            
            return null;
        }
        
        public bool ClaimDailyReward(string playerId)
        {
            if (!CanClaimDailyReward(playerId)) return false;
            
            var dailyReward = GetDailyReward(playerId);
            if (dailyReward == null) return false;
            
            // Award items
            var currencyManager = ServiceLocator.Get<CurrencyManager>();
            if (currencyManager != null)
            {
                foreach (var item in dailyReward.items)
                {
                    currencyManager.AddCurrency(item.currencyId, item.amount, "daily_reward");
                }
            }
            
            // Update progress
            var progress = GetPlayerProgress(playerId);
            progress.lastDailyRewardTime = DateTime.Now;
            progress.dailyRewardDay++;
            
            // Fire event
            OnDailyRewardClaimed?.Invoke(dailyReward);
            
            SaveRewardData();
            return true;
        }
        
        public void UpdateAchievement(string playerId, string achievementId, int value)
        {
            if (!_achievements.ContainsKey(achievementId)) return;
            
            var achievement = _achievements[achievementId];
            if (achievement.isUnlocked) return;
            
            achievement.currentValue = Mathf.Min(achievement.currentValue + value, achievement.targetValue);
            
            if (achievement.currentValue >= achievement.targetValue)
            {
                achievement.isUnlocked = true;
                achievement.unlockedTime = DateTime.Now;
                
                // Award achievement rewards
                var currencyManager = ServiceLocator.Get<CurrencyManager>();
                if (currencyManager != null)
                {
                    foreach (var item in achievement.rewards)
                    {
                        currencyManager.AddCurrency(item.currencyId, item.amount, $"achievement_{achievementId}");
                    }
                }
                
                // Fire event
                OnAchievementUnlocked?.Invoke(achievement);
            }
        }
        
        public List<AchievementData> GetAchievements(string category = null)
        {
            var achievements = new List<AchievementData>();
            
            foreach (var achievement in _achievements.Values)
            {
                if (category == null || achievement.category == category)
                {
                    achievements.Add(achievement);
                }
            }
            
            return achievements;
        }
        
        private System.Collections.IEnumerator UpdateRewardsystemSafe()
        {
            while (true)
            {
                // Update multipliers
                UpdateMultipliers();
                
                // Clean up old rewards
                CleanupOldRewards();
                
                yield return new WaitForSeconds(300f); // Update every 5 minutes
            }
        }
        
        private void UpdateMultipliers()
        {
            foreach (var progress in _playerProgress.Values)
            {
                // Decay multiplier over time
                if (progress.currentMultiplier > baseMultiplier)
                {
                    progress.currentMultiplier = Mathf.Max(baseMultiplier, 
                        progress.currentMultiplier - multiplierDecayRate);
                }
            }
        }
        
        private void CleanupOldRewards()
        {
            var toRemove = new List<string>();
            DateTime cutoff = DateTime.Now.AddDays(-30); // Keep rewards for 30 days
            
            foreach (var kvp in _activeRewards)
            {
                if (kvp.Value.earnedTime < cutoff)
                {
                    toRemove.Add(kvp.Key);
                }
            }
            
            foreach (var id in toRemove)
            {
                _activeRewards.Remove(id);
            }
        }
        
        private void SaveRewardData()
        {
            var saveData = new RewardSaveData
            {
                activeRewards = new Dictionary<string, RewardInstance>(_activeRewards),
                playerProgress = new Dictionary<string, PlayerRewardProgress>(_playerProgress),
                achievements = new Dictionary<string, AchievementData>(_achievements)
            };
            
            string json = JsonUtility.ToJson(saveData, true);
            System.IO.File.WriteAllText(Application.persistentDataPath + "/reward_data.json", json);
        }
        
        private void LoadRewardData()
        {
            string path = Application.persistentDataPath + "/reward_data.json";
            if (System.IO.File.Exists(path))
            {
                try
                {
                    string json = System.IO.File.ReadAllText(path);
                    var saveData = JsonUtility.FromJson<RewardSaveData>(json);
                    
                    if (saveData.activeRewards != null)
                    {
                        _activeRewards = saveData.activeRewards;
                    }
                    
                    if (saveData.playerProgress != null)
                    {
                        _playerProgress = saveData.playerProgress;
                    }
                    
                    if (saveData.achievements != null)
                    {
                        _achievements = saveData.achievements;
                    }
                }
                catch (Exception e)
                {
                    Debug.LogError($"Failed to load reward data: {e.Message}");
                }
            }
        }
        
        [System.Serializable]
        private class RewardSaveData
        {
            public Dictionary<string, RewardInstance> activeRewards;
            public Dictionary<string, PlayerRewardProgress> playerProgress;
            public Dictionary<string, AchievementData> achievements;
        }
        
        void OnDestroy()
        {
            SaveRewardData();
        }
    }
}