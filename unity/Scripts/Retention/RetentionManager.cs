using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System;
using Match3Game.Analytics;

namespace Match3Game.Retention
{
    /// <summary>
    /// Advanced retention manager implementing psychological hooks
    /// Designed to maximize player retention and engagement
    /// </summary>
    public class RetentionManager : MonoBehaviour
    {
        [Header("Push Notifications")]
        [SerializeField] private bool enablePushNotifications = true;
        [SerializeField] private float notificationCooldown = 3600f; // 1 hour
        [SerializeField] private int maxNotificationsPerDay = 5;
        
        [Header("Comeback Rewards")]
        [SerializeField] private bool enableComebackRewards = true;
        [SerializeField] private float comebackThreshold = 24f; // 24 hours
        [SerializeField] private float comebackRewardMultiplier = 2.0f;
        [SerializeField] private int maxComebackRewards = 3;
        
        [Header("Social Features")]
        [SerializeField] private bool enableSocialFeatures = true;
        [SerializeField] private int maxFriends = 100;
        [SerializeField] private int maxGuildMembers = 50;
        [SerializeField] private float socialUpdateInterval = 300f; // 5 minutes
        
        [Header("Progression Systems")]
        [SerializeField] private bool enableProgressionSystems = true;
        [SerializeField] private int maxLevel = 100;
        [SerializeField] private float xpMultiplier = 1.0f;
        [SerializeField] private bool enablePrestige = true;
        
        [Header("Achievement System")]
        [SerializeField] private bool enableAchievements = true;
        [SerializeField] private int maxAchievements = 50;
        [SerializeField] private float achievementNotificationDuration = 3.0f;
        
        // Private variables
        private DateTime lastLoginTime;
        private DateTime lastNotificationTime;
        private int notificationsSentToday = 0;
        private int comebackRewardsGiven = 0;
        private List<Achievement> achievements = new List<Achievement>();
        private List<SocialEvent> socialEvents = new List<SocialEvent>();
        private Dictionary<string, float> playerMetrics = new Dictionary<string, float>();
        private GameAnalyticsManager analyticsManager;
        
        // Events
        public System.Action<Achievement> OnAchievementUnlocked;
        public System.Action<SocialEvent> OnSocialEvent;
        public System.Action<ComebackReward> OnComebackReward;
        public System.Action<string> OnPushNotificationSent;
        public System.Action<int> OnLevelUp;
        public System.Action<int> OnPrestigeUp;
        
        private void Start()
        {
            InitializeRetentionSystems();
        }
        
        private void InitializeRetentionSystems()
        {
            analyticsManager = FindObjectOfType<GameAnalyticsManager>();
            
            // Load saved data
            LoadRetentionData();
            
            // Start retention systems
            if (enablePushNotifications)
                StartCoroutine(PushNotificationCoroutine());
            
            if (enableComebackRewards)
                StartCoroutine(ComebackRewardCoroutine());
            
            if (enableSocialFeatures)
                StartCoroutine(SocialFeaturesCoroutine());
            
            if (enableProgressionSystems)
                StartCoroutine(ProgressionSystemCoroutine());
            
            if (enableAchievements)
                StartCoroutine(AchievementSystemCoroutine());
            
            // Track retention systems initialization
            TrackEvent("retention_systems_initialized", new Dictionary<string, object>
            {
                {"push_notifications_enabled", enablePushNotifications},
                {"comeback_rewards_enabled", enableComebackRewards},
                {"social_features_enabled", enableSocialFeatures},
                {"progression_systems_enabled", enableProgressionSystems},
                {"achievements_enabled", enableAchievements}
            });
        }
        
        #region Push Notifications System
        
        private IEnumerator PushNotificationCoroutine()
        {
            while (true)
            {
                CheckForPushNotifications();
                yield return new WaitForSeconds(notificationCooldown);
            }
        }
        
        private void CheckForPushNotifications()
        {
            if (notificationsSentToday >= maxNotificationsPerDay) return;
            
            // Check if enough time has passed since last notification
            if (DateTime.Now < lastNotificationTime.AddSeconds(notificationCooldown)) return;
            
            // Generate appropriate notification
            PushNotification notification = GeneratePushNotification();
            if (notification != null)
            {
                SendPushNotification(notification);
            }
        }
        
        private PushNotification GeneratePushNotification()
        {
            // Analyze player behavior to determine best notification
            PlayerBehaviorData behavior = AnalyzePlayerBehavior();
            
            // Generate notification based on behavior
            if (behavior.daysSinceLastLogin > 1)
            {
                return new PushNotification
                {
                    id = Guid.NewGuid().ToString(),
                    title = "We Miss You!",
                    message = "Come back and claim your daily reward!",
                    type = PushNotificationType.Comeback,
                    priority = PushNotificationPriority.High,
                    action = "open_game"
                };
            }
            else if (behavior.energy < 5)
            {
                return new PushNotification
                {
                    id = Guid.NewGuid().ToString(),
                    title = "Energy Refilled!",
                    message = "Your energy is full, come play!",
                    type = PushNotificationType.Energy,
                    priority = PushNotificationPriority.Medium,
                    action = "open_game"
                };
            }
            else if (behavior.streak > 0)
            {
                return new PushNotification
                {
                    id = Guid.NewGuid().ToString(),
                    title = "Keep Your Streak!",
                    message = $"Don't break your {behavior.streak} day streak!",
                    type = PushNotificationType.Streak,
                    priority = PushNotificationPriority.High,
                    action = "open_game"
                };
            }
            else if (behavior.friendsOnline > 0)
            {
                return new PushNotification
                {
                    id = Guid.NewGuid().ToString(),
                    title = "Friends Are Playing!",
                    message = $"{behavior.friendsOnline} friends are online now!",
                    type = PushNotificationType.Social,
                    priority = PushNotificationPriority.Medium,
                    action = "open_game"
                };
            }
            
            return null;
        }
        
        private void SendPushNotification(PushNotification notification)
        {
            // Send push notification (implementation depends on platform)
            Debug.Log($"📱 Push Notification: {notification.title} - {notification.message}");
            
            // Track notification sent
            TrackEvent("push_notification_sent", new Dictionary<string, object>
            {
                {"notification_id", notification.id},
                {"type", notification.type.ToString()},
                {"priority", notification.priority.ToString()},
                {"notifications_sent_today", notificationsSentToday + 1}
            });
            
            notificationsSentToday++;
            lastNotificationTime = DateTime.Now;
            
            OnPushNotificationSent?.Invoke(notification.id);
        }
        
        #endregion
        
        #region Comeback Rewards System
        
        private IEnumerator ComebackRewardCoroutine()
        {
            while (true)
            {
                CheckForComebackRewards();
                yield return new WaitForSeconds(3600f); // Check every hour
            }
        }
        
        private void CheckForComebackRewards()
        {
            if (comebackRewardsGiven >= maxComebackRewards) return;
            
            // Check if player has been away long enough
            float hoursSinceLastLogin = (float)(DateTime.Now - lastLoginTime).TotalHours;
            if (hoursSinceLastLogin < comebackThreshold) return;
            
            // Generate comeback reward
            ComebackReward reward = GenerateComebackReward(hoursSinceLastLogin);
            if (reward != null)
            {
                GiveComebackReward(reward);
            }
        }
        
        private ComebackReward GenerateComebackReward(float hoursAway)
        {
            // Calculate reward based on time away
            float multiplier = Mathf.Min(hoursAway / comebackThreshold, 3.0f);
            
            return new ComebackReward
            {
                id = Guid.NewGuid().ToString(),
                coins = Mathf.RoundToInt(100 * multiplier),
                gems = Mathf.RoundToInt(10 * multiplier),
                energy = Mathf.RoundToInt(20 * multiplier),
                multiplier = multiplier,
                hoursAway = hoursAway,
                expiresAt = DateTime.Now.AddDays(1)
            };
        }
        
        private void GiveComebackReward(ComebackReward reward)
        {
            // Give reward to player
            Debug.Log($"🎁 Comeback Reward: {reward.coins} coins, {reward.gems} gems, {reward.energy} energy");
            
            // Track comeback reward
            TrackEvent("comeback_reward_given", new Dictionary<string, object>
            {
                {"reward_id", reward.id},
                {"coins", reward.coins},
                {"gems", reward.gems},
                {"energy", reward.energy},
                {"multiplier", reward.multiplier},
                {"hours_away", reward.hoursAway}
            });
            
            comebackRewardsGiven++;
            OnComebackReward?.Invoke(reward);
        }
        
        #endregion
        
        #region Social Features System
        
        private IEnumerator SocialFeaturesCoroutine()
        {
            while (true)
            {
                UpdateSocialFeatures();
                yield return new WaitForSeconds(socialUpdateInterval);
            }
        }
        
        private void UpdateSocialFeatures()
        {
            // Update friend activities
            UpdateFriendActivities();
            
            // Update guild events
            UpdateGuildEvents();
            
            // Update leaderboards
            UpdateLeaderboards();
            
            // Generate social events
            GenerateSocialEvents();
        }
        
        private void UpdateFriendActivities()
        {
            // Simulate friend activities
            int friendsOnline = UnityEngine.Random.Range(0, 10);
            int friendsPlaying = UnityEngine.Random.Range(0, 5);
            
            // Track friend activities
            TrackEvent("friend_activities_updated", new Dictionary<string, object>
            {
                {"friends_online", friendsOnline},
                {"friends_playing", friendsPlaying}
            });
        }
        
        private void UpdateGuildEvents()
        {
            // Simulate guild events
            int guildMembers = UnityEngine.Random.Range(0, 50);
            int guildEvents = UnityEngine.Random.Range(0, 3);
            
            // Track guild events
            TrackEvent("guild_events_updated", new Dictionary<string, object>
            {
                {"guild_members", guildMembers},
                {"guild_events", guildEvents}
            });
        }
        
        private void UpdateLeaderboards()
        {
            // Simulate leaderboard updates
            int playerRank = UnityEngine.Random.Range(1, 1000);
            int rankChange = UnityEngine.Random.Range(-10, 10);
            
            // Track leaderboard updates
            TrackEvent("leaderboard_updated", new Dictionary<string, object>
            {
                {"player_rank", playerRank},
                {"rank_change", rankChange}
            });
        }
        
        private void GenerateSocialEvents()
        {
            // Generate random social events
            if (UnityEngine.Random.Range(0f, 1f) < 0.1f) // 10% chance
            {
                SocialEvent socialEvent = new SocialEvent
                {
                    id = Guid.NewGuid().ToString(),
                    type = SocialEventType.FriendAchievement,
                    title = "Friend Achievement",
                    message = "Your friend just unlocked a new achievement!",
                    timestamp = DateTime.Now,
                    data = new Dictionary<string, object>
                    {
                        {"friend_name", "Player" + UnityEngine.Random.Range(1, 100)},
                        {"achievement_name", "Level Master"}
                    }
                };
                
                socialEvents.Add(socialEvent);
                OnSocialEvent?.Invoke(socialEvent);
                
                // Track social event
                TrackEvent("social_event_generated", new Dictionary<string, object>
                {
                    {"event_id", socialEvent.id},
                    {"type", socialEvent.type.ToString()},
                    {"title", socialEvent.title}
                });
            }
        }
        
        #endregion
        
        #region Progression System
        
        private IEnumerator ProgressionSystemCoroutine()
        {
            while (true)
            {
                UpdateProgressionSystem();
                yield return new WaitForSeconds(60f); // Update every minute
            }
        }
        
        private void UpdateProgressionSystem()
        {
            // Update player level
            UpdatePlayerLevel();
            
            // Update prestige system
            UpdatePrestigeSystem();
            
            // Update skill trees
            UpdateSkillTrees();
        }
        
        private void UpdatePlayerLevel()
        {
            // Calculate XP gained
            float xpGained = CalculateXPGained();
            if (xpGained > 0)
            {
                // Add XP to player
                AddXP(xpGained);
                
                // Check for level up
                CheckForLevelUp();
            }
        }
        
        private float CalculateXPGained()
        {
            // Calculate XP based on recent activities
            float xp = 0f;
            
            // XP from matches
            xp += playerMetrics.GetValueOrDefault("matches_made", 0) * 10f;
            
            // XP from levels completed
            xp += playerMetrics.GetValueOrDefault("levels_completed", 0) * 100f;
            
            // XP from achievements
            xp += playerMetrics.GetValueOrDefault("achievements_unlocked", 0) * 50f;
            
            return xp * xpMultiplier;
        }
        
        private void AddXP(float xp)
        {
            float currentXP = playerMetrics.GetValueOrDefault("current_xp", 0);
            playerMetrics["current_xp"] = currentXP + xp;
            
            // Track XP gained
            TrackEvent("xp_gained", new Dictionary<string, object>
            {
                {"xp_gained", xp},
                {"total_xp", currentXP + xp}
            });
        }
        
        private void CheckForLevelUp()
        {
            float currentXP = playerMetrics.GetValueOrDefault("current_xp", 0);
            int currentLevel = Mathf.FloorToInt(currentXP / 1000f) + 1;
            int previousLevel = Mathf.FloorToInt((currentXP - playerMetrics.GetValueOrDefault("xp_gained", 0)) / 1000f) + 1;
            
            if (currentLevel > previousLevel)
            {
                // Level up!
                playerMetrics["current_level"] = currentLevel;
                
                // Track level up
                TrackEvent("level_up", new Dictionary<string, object>
                {
                    {"new_level", currentLevel},
                    {"total_xp", currentXP}
                });
                
                OnLevelUp?.Invoke(currentLevel);
                
                // Give level up rewards
                GiveLevelUpRewards(currentLevel);
            }
        }
        
        private void GiveLevelUpRewards(int level)
        {
            // Give rewards based on level
            int coins = level * 100;
            int gems = level * 10;
            int energy = level * 5;
            
            Debug.Log($"🎉 Level {level} reached! Rewards: {coins} coins, {gems} gems, {energy} energy");
            
            // Track level up rewards
            TrackEvent("level_up_rewards", new Dictionary<string, object>
            {
                {"level", level},
                {"coins", coins},
                {"gems", gems},
                {"energy", energy}
            });
        }
        
        private void UpdatePrestigeSystem()
        {
            if (!enablePrestige) return;
            
            int currentLevel = Mathf.RoundToInt(playerMetrics.GetValueOrDefault("current_level", 1));
            if (currentLevel >= maxLevel)
            {
                // Player can prestige
                int prestigeLevel = Mathf.RoundToInt(playerMetrics.GetValueOrDefault("prestige_level", 0));
                if (prestigeLevel < 10) // Max 10 prestige levels
                {
                    // Offer prestige
                    OfferPrestige(prestigeLevel + 1);
                }
            }
        }
        
        private void OfferPrestige(int newPrestigeLevel)
        {
            // Offer prestige to player
            Debug.Log($"🌟 Prestige {newPrestigeLevel} available! Reset level for permanent bonuses!");
            
            // Track prestige offer
            TrackEvent("prestige_offered", new Dictionary<string, object>
            {
                {"prestige_level", newPrestigeLevel}
            });
        }
        
        private void UpdateSkillTrees()
        {
            // Update skill tree progression
            // Implementation depends on your skill tree system
        }
        
        #endregion
        
        #region Achievement System
        
        private IEnumerator AchievementSystemCoroutine()
        {
            while (true)
            {
                CheckForAchievements();
                yield return new WaitForSeconds(30f); // Check every 30 seconds
            }
        }
        
        private void CheckForAchievements()
        {
            // Check for new achievements
            List<Achievement> newAchievements = GetNewAchievements();
            
            foreach (Achievement achievement in newAchievements)
            {
                UnlockAchievement(achievement);
            }
        }
        
        private List<Achievement> GetNewAchievements()
        {
            List<Achievement> newAchievements = new List<Achievement>();
            
            // Check various achievement conditions
            CheckLevelAchievements(newAchievements);
            CheckScoreAchievements(newAchievements);
            CheckStreakAchievements(newAchievements);
            CheckSocialAchievements(newAchievements);
            CheckSpecialAchievements(newAchievements);
            
            return newAchievements;
        }
        
        private void CheckLevelAchievements(List<Achievement> newAchievements)
        {
            int currentLevel = Mathf.RoundToInt(playerMetrics.GetValueOrDefault("current_level", 1));
            
            // Level milestones
            int[] levelMilestones = { 10, 25, 50, 75, 100 };
            foreach (int milestone in levelMilestones)
            {
                if (currentLevel >= milestone && !HasAchievement($"level_{milestone}"))
                {
                    newAchievements.Add(new Achievement
                    {
                        id = $"level_{milestone}",
                        name = $"Level {milestone} Master",
                        description = $"Reach level {milestone}",
                        type = AchievementType.Level,
                        rarity = GetAchievementRarity(milestone),
                        reward = new AchievementReward
                        {
                            coins = milestone * 100,
                            gems = milestone * 10,
                            experience = milestone * 50
                        }
                    });
                }
            }
        }
        
        private void CheckScoreAchievements(List<Achievement> newAchievements)
        {
            float totalScore = playerMetrics.GetValueOrDefault("total_score", 0);
            
            // Score milestones
            float[] scoreMilestones = { 10000, 50000, 100000, 500000, 1000000 };
            foreach (float milestone in scoreMilestones)
            {
                if (totalScore >= milestone && !HasAchievement($"score_{milestone}"))
                {
                    newAchievements.Add(new Achievement
                    {
                        id = $"score_{milestone}",
                        name = $"Score Master {milestone}",
                        description = $"Reach {milestone:N0} total score",
                        type = AchievementType.Score,
                        rarity = GetAchievementRarity(milestone),
                        reward = new AchievementReward
                        {
                            coins = (int)(milestone / 100),
                            gems = (int)(milestone / 1000),
                            experience = (int)(milestone / 50)
                        }
                    });
                }
            }
        }
        
        private void CheckStreakAchievements(List<Achievement> newAchievements)
        {
            int currentStreak = Mathf.RoundToInt(playerMetrics.GetValueOrDefault("current_streak", 0));
            
            // Streak milestones
            int[] streakMilestones = { 3, 7, 14, 30, 100 };
            foreach (int milestone in streakMilestones)
            {
                if (currentStreak >= milestone && !HasAchievement($"streak_{milestone}"))
                {
                    newAchievements.Add(new Achievement
                    {
                        id = $"streak_{milestone}",
                        name = $"Streak Master {milestone}",
                        description = $"Maintain a {milestone} day streak",
                        type = AchievementType.Streak,
                        rarity = GetAchievementRarity(milestone),
                        reward = new AchievementReward
                        {
                            coins = milestone * 50,
                            gems = milestone * 5,
                            experience = milestone * 25
                        }
                    });
                }
            }
        }
        
        private void CheckSocialAchievements(List<Achievement> newAchievements)
        {
            int friendsCount = Mathf.RoundToInt(playerMetrics.GetValueOrDefault("friends_count", 0));
            
            // Social milestones
            int[] socialMilestones = { 5, 10, 25, 50, 100 };
            foreach (int milestone in socialMilestones)
            {
                if (friendsCount >= milestone && !HasAchievement($"social_{milestone}"))
                {
                    newAchievements.Add(new Achievement
                    {
                        id = $"social_{milestone}",
                        name = $"Social Butterfly {milestone}",
                        description = $"Add {milestone} friends",
                        type = AchievementType.Social,
                        rarity = GetAchievementRarity(milestone),
                        reward = new AchievementReward
                        {
                            coins = milestone * 25,
                            gems = milestone * 3,
                            experience = milestone * 15
                        }
                    });
                }
            }
        }
        
        private void CheckSpecialAchievements(List<Achievement> newAchievements)
        {
            // Check for special achievements
            // Implementation depends on your specific achievement requirements
        }
        
        private bool HasAchievement(string achievementId)
        {
            return achievements.Exists(a => a.id == achievementId);
        }
        
        private AchievementRarity GetAchievementRarity(float value)
        {
            if (value >= 100) return AchievementRarity.Legendary;
            if (value >= 50) return AchievementRarity.Epic;
            if (value >= 25) return AchievementRarity.Rare;
            if (value >= 10) return AchievementRarity.Uncommon;
            return AchievementRarity.Common;
        }
        
        private void UnlockAchievement(Achievement achievement)
        {
            achievements.Add(achievement);
            
            // Give rewards
            GiveAchievementRewards(achievement);
            
            // Show notification
            ShowAchievementNotification(achievement);
            
            // Track achievement unlock
            TrackEvent("achievement_unlocked", new Dictionary<string, object>
            {
                {"achievement_id", achievement.id},
                {"name", achievement.name},
                {"type", achievement.type.ToString()},
                {"rarity", achievement.rarity.ToString()},
                {"coins", achievement.reward.coins},
                {"gems", achievement.reward.gems},
                {"experience", achievement.reward.experience}
            });
            
            OnAchievementUnlocked?.Invoke(achievement);
        }
        
        private void GiveAchievementRewards(Achievement achievement)
        {
            // Give achievement rewards
            Debug.Log($"🏆 Achievement Unlocked: {achievement.name} - {achievement.description}");
            Debug.Log($"🎁 Rewards: {achievement.reward.coins} coins, {achievement.reward.gems} gems, {achievement.reward.experience} XP");
        }
        
        private void ShowAchievementNotification(Achievement achievement)
        {
            // Show achievement notification UI
            Debug.Log($"🎉 {achievement.name} - {achievement.description}");
        }
        
        #endregion
        
        #region Helper Methods
        
        private PlayerBehaviorData AnalyzePlayerBehavior()
        {
            return new PlayerBehaviorData
            {
                daysSinceLastLogin = (float)(DateTime.Now - lastLoginTime).TotalDays,
                energy = playerMetrics.GetValueOrDefault("current_energy", 30),
                streak = Mathf.RoundToInt(playerMetrics.GetValueOrDefault("current_streak", 0)),
                friendsOnline = Mathf.RoundToInt(playerMetrics.GetValueOrDefault("friends_online", 0)),
                level = Mathf.RoundToInt(playerMetrics.GetValueOrDefault("current_level", 1)),
                score = playerMetrics.GetValueOrDefault("total_score", 0)
            };
        }
        
        private void LoadRetentionData()
        {
            // Load from PlayerPrefs or cloud save
            lastLoginTime = DateTime.Parse(PlayerPrefs.GetString("lastLoginTime", DateTime.Now.ToString()));
            lastNotificationTime = DateTime.Parse(PlayerPrefs.GetString("lastNotificationTime", DateTime.Now.AddDays(-1).ToString()));
            notificationsSentToday = PlayerPrefs.GetInt("notificationsSentToday", 0);
            comebackRewardsGiven = PlayerPrefs.GetInt("comebackRewardsGiven", 0);
        }
        
        private void SaveRetentionData()
        {
            PlayerPrefs.SetString("lastLoginTime", lastLoginTime.ToString());
            PlayerPrefs.SetString("lastNotificationTime", lastNotificationTime.ToString());
            PlayerPrefs.SetInt("notificationsSentToday", notificationsSentToday);
            PlayerPrefs.SetInt("comebackRewardsGiven", comebackRewardsGiven);
            PlayerPrefs.Save();
        }
        
        #endregion
        
        #region Analytics
        
        private void TrackEvent(string eventName, Dictionary<string, object> properties)
        {
            if (analyticsManager)
            {
                analyticsManager.TrackCustomEvent(eventName, properties);
            }
        }
        
        #endregion
        
        #region Public API
        
        public void UpdatePlayerMetric(string metric, float value)
        {
            playerMetrics[metric] = value;
        }
        
        public float GetPlayerMetric(string metric)
        {
            return playerMetrics.GetValueOrDefault(metric, 0);
        }
        
        public List<Achievement> GetAchievements()
        {
            return new List<Achievement>(achievements);
        }
        
        public List<SocialEvent> GetSocialEvents()
        {
            return new List<SocialEvent>(socialEvents);
        }
        
        public void ResetDailyCounters()
        {
            notificationsSentToday = 0;
            // Reset other daily counters as needed
        }
        
        #endregion
        
        private void OnApplicationPause(bool pauseStatus)
        {
            if (!pauseStatus)
            {
                // App resumed - update last login time
                lastLoginTime = DateTime.Now;
                SaveRetentionData();
            }
        }
        
        private void OnApplicationFocus(bool hasFocus)
        {
            if (hasFocus)
            {
                // App focused - update last login time
                lastLoginTime = DateTime.Now;
                SaveRetentionData();
            }
        }
        
        private void OnDestroy()
        {
            SaveRetentionData();
        }
    }
    
    #region Data Classes
    
    [System.Serializable]
    public class PushNotification
    {
        public string id;
        public string title;
        public string message;
        public PushNotificationType type;
        public PushNotificationPriority priority;
        public string action;
    }
    
    [System.Serializable]
    public class ComebackReward
    {
        public string id;
        public int coins;
        public int gems;
        public int energy;
        public float multiplier;
        public float hoursAway;
        public DateTime expiresAt;
    }
    
    [System.Serializable]
    public class SocialEvent
    {
        public string id;
        public SocialEventType type;
        public string title;
        public string message;
        public DateTime timestamp;
        public Dictionary<string, object> data;
    }
    
    [System.Serializable]
    public class Achievement
    {
        public string id;
        public string name;
        public string description;
        public AchievementType type;
        public AchievementRarity rarity;
        public AchievementReward reward;
    }
    
    [System.Serializable]
    public class AchievementReward
    {
        public int coins;
        public int gems;
        public int experience;
    }
    
    [System.Serializable]
    public class PlayerBehaviorData
    {
        public float daysSinceLastLogin;
        public float energy;
        public int streak;
        public int friendsOnline;
        public int level;
        public float score;
    }
    
    public enum PushNotificationType
    {
        Comeback,
        Energy,
        Streak,
        Social,
        Achievement,
        Special
    }
    
    public enum PushNotificationPriority
    {
        Low,
        Medium,
        High
    }
    
    public enum SocialEventType
    {
        FriendAchievement,
        GuildEvent,
        LeaderboardUpdate,
        FriendOnline,
        Challenge
    }
    
    public enum AchievementType
    {
        Level,
        Score,
        Streak,
        Social,
        Special,
        Collection
    }
    
    public enum AchievementRarity
    {
        Common,
        Uncommon,
        Rare,
        Epic,
        Legendary
    }
    
    #endregion
}