using System.Collections.Generic;
using UnityEngine;
using System;
using System.Linq;

namespace Evergreen.Collections
{
    [Serializable]
    public class Achievement
    {
        public string achievementId;
        public string name;
        public string description;
        public AchievementType type;
        public AchievementRarity rarity;
        public Dictionary<string, object> requirements = new Dictionary<string, object>();
        public Dictionary<string, object> rewards = new Dictionary<string, object>();
        public bool isUnlocked;
        public bool isClaimed;
        public long unlockTime;
        public int progress;
        public int target;
        public int priority;
    }
    
    public enum AchievementType
    {
        Progression,
        Skill,
        Collection,
        Social,
        Special,
        TimeBased
    }
    
    public enum AchievementRarity
    {
        Common,
        Uncommon,
        Rare,
        Epic,
        Legendary
    }
    
    [Serializable]
    public class Collection
    {
        public string collectionId;
        public string name;
        public string description;
        public List<CollectionItem> items = new List<CollectionItem>();
        public Dictionary<string, object> completionRewards = new Dictionary<string, object>();
        public bool isCompleted;
        public int completionPercentage;
    }
    
    [Serializable]
    public class CollectionItem
    {
        public string itemId;
        public string name;
        public string description;
        public string category;
        public bool isCollected;
        public long collectTime;
        public Dictionary<string, object> properties = new Dictionary<string, object>();
        public string rarity;
    }
    
    public class AchievementSystem : MonoBehaviour
    {
        [Header("Achievements")]
        public List<Achievement> achievements = new List<Achievement>();
        public List<Collection> collections = new List<Collection>();
        
        [Header("Settings")]
        public float checkInterval = 5f; // Check every 5 seconds
        public int maxAchievementsPerType = 50;
        
        public static AchievementSystem Instance { get; private set; }
        
        private float lastCheckTime;
        private Dictionary<string, int> progressCounters = new Dictionary<string, int>();
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeAchievements();
                InitializeCollections();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            LoadAchievementData();
            CheckAllAchievements();
        }
        
        void Update()
        {
            if (Time.time - lastCheckTime > checkInterval)
            {
                CheckAllAchievements();
            }
        }
        
        private void InitializeAchievements()
        {
            achievements = new List<Achievement>
            {
                // Progression Achievements
                new Achievement
                {
                    achievementId = "first_level",
                    name = "First Steps",
                    description = "Complete your first level",
                    type = AchievementType.Progression,
                    rarity = AchievementRarity.Common,
                    requirements = new Dictionary<string, object> { {"levels_completed", 1} },
                    rewards = new Dictionary<string, object> { {"coins", 100}, {"gems", 10} },
                    target = 1,
                    priority = 10
                },
                new Achievement
                {
                    achievementId = "level_master",
                    name = "Level Master",
                    description = "Complete 100 levels",
                    type = AchievementType.Progression,
                    rarity = AchievementRarity.Rare,
                    requirements = new Dictionary<string, object> { {"levels_completed", 100} },
                    rewards = new Dictionary<string, object> { {"coins", 5000}, {"gems", 100} },
                    target = 100,
                    priority = 5
                },
                new Achievement
                {
                    achievementId = "level_legend",
                    name = "Level Legend",
                    description = "Complete 500 levels",
                    type = AchievementType.Progression,
                    rarity = AchievementRarity.Legendary,
                    requirements = new Dictionary<string, object> { {"levels_completed", 500} },
                    rewards = new Dictionary<string, object> { {"coins", 25000}, {"gems", 500} },
                    target = 500,
                    priority = 1
                },
                
                // Skill Achievements
                new Achievement
                {
                    achievementId = "match_master",
                    name = "Match Master",
                    description = "Make 1000 matches",
                    type = AchievementType.Skill,
                    rarity = AchievementRarity.Uncommon,
                    requirements = new Dictionary<string, object> { {"matches_made", 1000} },
                    rewards = new Dictionary<string, object> { {"coins", 2000}, {"gems", 50} },
                    target = 1000,
                    priority = 7
                },
                new Achievement
                {
                    achievementId = "combo_king",
                    name = "Combo King",
                    description = "Make a 10x combo",
                    type = AchievementType.Skill,
                    rarity = AchievementRarity.Epic,
                    requirements = new Dictionary<string, object> { {"max_combo", 10} },
                    rewards = new Dictionary<string, object> { {"coins", 3000}, {"gems", 75} },
                    target = 10,
                    priority = 3
                },
                new Achievement
                {
                    achievementId = "perfect_level",
                    name = "Perfectionist",
                    description = "Complete a level with 3 stars",
                    type = AchievementType.Skill,
                    rarity = AchievementRarity.Uncommon,
                    requirements = new Dictionary<string, object> { {"three_star_levels", 1} },
                    rewards = new Dictionary<string, object> { {"coins", 1000}, {"gems", 25} },
                    target = 1,
                    priority = 8
                },
                
                // Collection Achievements
                new Achievement
                {
                    achievementId = "collector",
                    name = "Collector",
                    description = "Collect 50 items",
                    type = AchievementType.Collection,
                    rarity = AchievementRarity.Uncommon,
                    requirements = new Dictionary<string, object> { {"items_collected", 50} },
                    rewards = new Dictionary<string, object> { {"coins", 1500}, {"gems", 30} },
                    target = 50,
                    priority = 6
                },
                new Achievement
                {
                    achievementId = "hoarder",
                    name = "Hoarder",
                    description = "Collect 200 items",
                    type = AchievementType.Collection,
                    rarity = AchievementRarity.Rare,
                    requirements = new Dictionary<string, object> { {"items_collected", 200} },
                    rewards = new Dictionary<string, object> { {"coins", 5000}, {"gems", 100} },
                    target = 200,
                    priority = 4
                },
                
                // Social Achievements
                new Achievement
                {
                    achievementId = "social_butterfly",
                    name = "Social Butterfly",
                    description = "Add 10 friends",
                    type = AchievementType.Social,
                    rarity = AchievementRarity.Uncommon,
                    requirements = new Dictionary<string, object> { {"friends_added", 10} },
                    rewards = new Dictionary<string, object> { {"coins", 2000}, {"gems", 40} },
                    target = 10,
                    priority = 5
                },
                new Achievement
                {
                    achievementId = "leaderboard_champion",
                    name = "Leaderboard Champion",
                    description = "Reach top 10 on any leaderboard",
                    type = AchievementType.Social,
                    rarity = AchievementRarity.Epic,
                    requirements = new Dictionary<string, object> { {"top_10_rank", 1} },
                    rewards = new Dictionary<string, object> { {"coins", 4000}, {"gems", 100} },
                    target = 1,
                    priority = 2
                },
                
                // Special Achievements
                new Achievement
                {
                    achievementId = "lucky_streak",
                    name = "Lucky Streak",
                    description = "Win 5 levels in a row",
                    type = AchievementType.Special,
                    rarity = AchievementRarity.Rare,
                    requirements = new Dictionary<string, object> { {"win_streak", 5} },
                    rewards = new Dictionary<string, object> { {"coins", 3000}, {"gems", 75} },
                    target = 5,
                    priority = 4
                },
                new Achievement
                {
                    achievementId = "speed_demon",
                    name = "Speed Demon",
                    description = "Complete a level in under 30 seconds",
                    type = AchievementType.Special,
                    rarity = AchievementRarity.Epic,
                    requirements = new Dictionary<string, object> { {"fast_level", 30} },
                    rewards = new Dictionary<string, object> { {"coins", 2500}, {"gems", 60} },
                    target = 30,
                    priority = 3
                }
            };
        }
        
        private void InitializeCollections()
        {
            collections = new List<Collection>
            {
                new Collection
                {
                    collectionId = "gems_collection",
                    name = "Gem Collection",
                    description = "Collect all types of magical gems",
                    items = new List<CollectionItem>
                    {
                        new CollectionItem { itemId = "red_gem", name = "Ruby", description = "A fiery red gem", category = "gems", rarity = "common" },
                        new CollectionItem { itemId = "blue_gem", name = "Sapphire", description = "A cool blue gem", category = "gems", rarity = "common" },
                        new CollectionItem { itemId = "green_gem", name = "Emerald", description = "A vibrant green gem", category = "gems", rarity = "common" },
                        new CollectionItem { itemId = "yellow_gem", name = "Topaz", description = "A bright yellow gem", category = "gems", rarity = "common" },
                        new CollectionItem { itemId = "purple_gem", name = "Amethyst", description = "A mysterious purple gem", category = "gems", rarity = "uncommon" },
                        new CollectionItem { itemId = "diamond", name = "Diamond", description = "The rarest of gems", category = "gems", rarity = "rare" }
                    },
                    completionRewards = new Dictionary<string, object> { {"coins", 5000}, {"gems", 200} }
                },
                new Collection
                {
                    collectionId = "special_pieces",
                    name = "Special Pieces",
                    description = "Collect all special match pieces",
                    items = new List<CollectionItem>
                    {
                        new CollectionItem { itemId = "rocket_h", name = "Horizontal Rocket", description = "Clears a row", category = "special", rarity = "common" },
                        new CollectionItem { itemId = "rocket_v", name = "Vertical Rocket", description = "Clears a column", category = "special", rarity = "common" },
                        new CollectionItem { itemId = "bomb", name = "Bomb", description = "Explodes in a 3x3 area", category = "special", rarity = "uncommon" },
                        new CollectionItem { itemId = "color_bomb", name = "Color Bomb", description = "Clears all pieces of one color", category = "special", rarity = "rare" }
                    },
                    completionRewards = new Dictionary<string, object> { {"coins", 3000}, {"gems", 150} }
                }
            };
        }
        
        public void CheckAllAchievements()
        {
            lastCheckTime = Time.time;
            
            foreach (var achievement in achievements)
            {
                if (!achievement.isUnlocked)
                {
                    CheckAchievement(achievement);
                }
            }
            
            CheckCollections();
        }
        
        private void CheckAchievement(Achievement achievement)
        {
            bool isUnlocked = true;
            int totalProgress = 0;
            
            foreach (var requirement in achievement.requirements)
            {
                var currentValue = GetProgressValue(requirement.Key);
                var targetValue = Convert.ToInt32(requirement.Value);
                
                if (currentValue < targetValue)
                {
                    isUnlocked = false;
                }
                
                totalProgress += Mathf.Min(currentValue, targetValue);
            }
            
            if (isUnlocked && !achievement.isUnlocked)
            {
                UnlockAchievement(achievement);
            }
            else
            {
                achievement.progress = totalProgress;
            }
        }
        
        private int GetProgressValue(string key)
        {
            switch (key)
            {
                case "levels_completed":
                    return Evergreen.Game.GameState.CurrentLevel - 1;
                case "matches_made":
                    return progressCounters.GetValueOrDefault("matches_made", 0);
                case "max_combo":
                    return progressCounters.GetValueOrDefault("max_combo", 0);
                case "three_star_levels":
                    return progressCounters.GetValueOrDefault("three_star_levels", 0);
                case "items_collected":
                    return progressCounters.GetValueOrDefault("items_collected", 0);
                case "friends_added":
                    return progressCounters.GetValueOrDefault("friends_added", 0);
                case "top_10_rank":
                    return progressCounters.GetValueOrDefault("top_10_rank", 0);
                case "win_streak":
                    return progressCounters.GetValueOrDefault("win_streak", 0);
                case "fast_level":
                    return progressCounters.GetValueOrDefault("fast_level", 0);
                default:
                    return 0;
            }
        }
        
        private void UnlockAchievement(Achievement achievement)
        {
            achievement.isUnlocked = true;
            achievement.unlockTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            
            // Show notification
            ShowAchievementNotification(achievement);
            
            // Analytics
            Evergreen.Game.AnalyticsAdapter.CustomEvent("achievement_unlocked", new Dictionary<string, object>
            {
                {"achievement_id", achievement.achievementId},
                {"achievement_type", achievement.type.ToString()},
                {"rarity", achievement.rarity.ToString()}
            });
            
            SaveAchievementData();
        }
        
        public void ClaimAchievement(string achievementId)
        {
            var achievement = achievements.Find(a => a.achievementId == achievementId);
            if (achievement == null || !achievement.isUnlocked || achievement.isClaimed) return;
            
            achievement.isClaimed = true;
            
            // Grant rewards
            GrantAchievementRewards(achievement);
            
            // Analytics
            Evergreen.Game.AnalyticsAdapter.CustomEvent("achievement_claimed", new Dictionary<string, object>
            {
                {"achievement_id", achievementId}
            });
            
            SaveAchievementData();
        }
        
        private void GrantAchievementRewards(Achievement achievement)
        {
            foreach (var reward in achievement.rewards)
            {
                switch (reward.Key)
                {
                    case "coins":
                        Evergreen.Game.GameState.AddCoins(Convert.ToInt32(reward.Value));
                        break;
                    case "gems":
                        Evergreen.Game.GameState.AddGems(Convert.ToInt32(reward.Value));
                        break;
                }
            }
        }
        
        private void CheckCollections()
        {
            foreach (var collection in collections)
            {
                int collectedCount = collection.items.Count(item => item.isCollected);
                collection.completionPercentage = Mathf.RoundToInt((float)collectedCount / collection.items.Count * 100);
                
                if (collectedCount == collection.items.Count && !collection.isCompleted)
                {
                    CompleteCollection(collection);
                }
            }
        }
        
        private void CompleteCollection(Collection collection)
        {
            collection.isCompleted = true;
            
            // Grant completion rewards
            foreach (var reward in collection.completionRewards)
            {
                switch (reward.Key)
                {
                    case "coins":
                        Evergreen.Game.GameState.AddCoins(Convert.ToInt32(reward.Value));
                        break;
                    case "gems":
                        Evergreen.Game.GameState.AddGems(Convert.ToInt32(reward.Value));
                        break;
                }
            }
            
            // Show notification
            ShowCollectionNotification(collection);
            
            // Analytics
            Evergreen.Game.AnalyticsAdapter.CustomEvent("collection_completed", new Dictionary<string, object>
            {
                {"collection_id", collection.collectionId}
            });
            
            SaveAchievementData();
        }
        
        public void CollectItem(string collectionId, string itemId)
        {
            var collection = collections.Find(c => c.collectionId == collectionId);
            if (collection == null) return;
            
            var item = collection.items.Find(i => i.itemId == itemId);
            if (item == null || item.isCollected) return;
            
            item.isCollected = true;
            item.collectTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            
            // Update progress counter
            progressCounters["items_collected"] = progressCounters.GetValueOrDefault("items_collected", 0) + 1;
            
            // Show notification
            ShowItemCollectedNotification(item);
            
            // Analytics
            Evergreen.Game.AnalyticsAdapter.CustomEvent("item_collected", new Dictionary<string, object>
            {
                {"collection_id", collectionId},
                {"item_id", itemId},
                {"rarity", item.rarity}
            });
            
            SaveAchievementData();
        }
        
        public void UpdateProgress(string key, int value)
        {
            progressCounters[key] = progressCounters.GetValueOrDefault(key, 0) + value;
        }
        
        public void SetProgress(string key, int value)
        {
            progressCounters[key] = value;
        }
        
        private void ShowAchievementNotification(Achievement achievement)
        {
            Debug.Log($"Achievement Unlocked: {achievement.name} - {achievement.description}");
            // This would trigger the UI to show the achievement notification
        }
        
        private void ShowCollectionNotification(Collection collection)
        {
            Debug.Log($"Collection Completed: {collection.name} - {collection.description}");
            // This would trigger the UI to show the collection notification
        }
        
        private void ShowItemCollectedNotification(CollectionItem item)
        {
            Debug.Log($"Item Collected: {item.name} - {item.description}");
            // This would trigger the UI to show the item collected notification
        }
        
        public List<Achievement> GetUnlockedAchievements()
        {
            return achievements.Where(a => a.isUnlocked).ToList();
        }
        
        public List<Achievement> GetClaimableAchievements()
        {
            return achievements.Where(a => a.isUnlocked && !a.isClaimed).ToList();
        }
        
        public List<Collection> GetCollections()
        {
            return collections;
        }
        
        private void LoadAchievementData()
        {
            var data = PlayerPrefs.GetString("AchievementData", "");
            if (!string.IsNullOrEmpty(data))
            {
                try
                {
                    var achievementData = JsonUtility.FromJson<Achievement[]>(data);
                    if (achievementData != null)
                    {
                        achievements = new List<Achievement>(achievementData);
                    }
                }
                catch (Exception e)
                {
                    Debug.LogError($"Failed to load achievement data: {e.Message}");
                }
            }
        }
        
        private void SaveAchievementData()
        {
            try
            {
                var data = JsonUtility.ToJson(achievements.ToArray());
                PlayerPrefs.SetString("AchievementData", data);
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to save achievement data: {e.Message}");
            }
        }
    }
}