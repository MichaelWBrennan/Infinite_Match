using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System;
using Match3Game.Analytics;

namespace Match3Game.AddictionMechanics
{
    /// <summary>
    /// Advanced addiction mechanics manager
    /// Implements psychological hooks to maximize player engagement and retention
    /// </summary>
    public class AddictionManager : MonoBehaviour
    {
        [Header("Daily Rewards")]
        [SerializeField] private bool enableDailyRewards = true;
        [SerializeField] private int maxStreakDays = 30;
        [SerializeField] private float streakMultiplier = 1.5f;
        [SerializeField] private float comebackMultiplier = 2.0f;
        [SerializeField] private int comebackDays = 3;
        
        [Header("FOMO Events")]
        [SerializeField] private bool enableFOMOEvents = true;
        [SerializeField] private float limitedTimeOfferDuration = 3600f; // 1 hour
        [SerializeField] private float flashSaleDuration = 1800f; // 30 minutes
        [SerializeField] private int maxActiveOffers = 3;
        
        [Header("Variable Rewards")]
        [SerializeField] private bool enableVariableRewards = true;
        [SerializeField] private float jackpotChance = 0.01f; // 1% chance
        [SerializeField] private float surpriseEventChance = 0.05f; // 5% chance
        [SerializeField] private int maxLootBoxes = 10;
        
        [Header("Social Pressure")]
        [SerializeField] private bool enableSocialFeatures = true;
        [SerializeField] private int maxFriends = 100;
        [SerializeField] private int maxGuildMembers = 50;
        [SerializeField] private float leaderboardUpdateInterval = 300f; // 5 minutes
        
        // Private variables
        private DateTime lastLoginTime;
        private DateTime lastRewardTime;
        private int currentStreak = 0;
        private int maxStreakAchieved = 0;
        private bool hasClaimedTodayReward = false;
        private List<LimitedTimeOffer> activeOffers = new List<LimitedTimeOffer>();
        private List<LootBox> availableLootBoxes = new List<LootBox>();
        private Dictionary<string, float> playerBehaviorMetrics = new Dictionary<string, float>();
        private GameAnalyticsManager analyticsManager;
        
        // Events
        public System.Action<int> OnStreakUpdated;
        public System.Action<LimitedTimeOffer> OnNewOfferAvailable;
        public System.Action<LootBox> OnLootBoxOpened;
        public System.Action<string, float> OnSurpriseEventTriggered;
        public System.Action<int> OnLeaderboardUpdated;
        
        private void Start()
        {
            InitializeAddictionMechanics();
        }
        
        private void InitializeAddictionMechanics()
        {
            analyticsManager = FindObjectOfType<GameAnalyticsManager>();
            
            // Load saved data
            LoadAddictionData();
            
            // Start addiction mechanics
            if (enableDailyRewards)
                StartCoroutine(DailyRewardsCoroutine());
            
            if (enableFOMOEvents)
                StartCoroutine(FOMOEventsCoroutine());
            
            if (enableVariableRewards)
                StartCoroutine(VariableRewardsCoroutine());
            
            if (enableSocialFeatures)
                StartCoroutine(SocialFeaturesCoroutine());
            
            // Track addiction mechanics initialization
            TrackEvent("addiction_mechanics_initialized", new Dictionary<string, object>
            {
                {"daily_rewards_enabled", enableDailyRewards},
                {"fomo_events_enabled", enableFOMOEvents},
                {"variable_rewards_enabled", enableVariableRewards},
                {"social_features_enabled", enableSocialFeatures}
            });
        }
        
        #region Daily Rewards System
        
        private IEnumerator DailyRewardsCoroutine()
        {
            while (true)
            {
                CheckDailyReward();
                yield return new WaitForSeconds(3600f); // Check every hour
            }
        }
        
        private void CheckDailyReward()
        {
            DateTime now = DateTime.Now;
            DateTime lastReward = lastRewardTime;
            
            // Check if it's a new day
            if (now.Date > lastReward.Date)
            {
                // Check if streak should continue or reset
                if (now.Date == lastReward.Date.AddDays(1))
                {
                    // Continue streak
                    currentStreak++;
                    if (currentStreak > maxStreakAchieved)
                        maxStreakAchieved = currentStreak;
                }
                else if (now.Date > lastReward.Date.AddDays(comebackDays))
                {
                    // Reset streak but give comeback bonus
                    currentStreak = 1;
                    TriggerComebackBonus();
                }
                else
                {
                    // Reset streak
                    currentStreak = 1;
                }
                
                // Generate daily reward
                GenerateDailyReward();
                
                // Update tracking
                lastRewardTime = now;
                hasClaimedTodayReward = false;
                
                // Track daily reward availability
                TrackEvent("daily_reward_available", new Dictionary<string, object>
                {
                    {"streak", currentStreak},
                    {"max_streak", maxStreakAchieved},
                    {"is_comeback", now.Date > lastReward.Date.AddDays(comebackDays)}
                });
            }
        }
        
        private void GenerateDailyReward()
        {
            // Calculate reward based on streak
            float baseReward = 100f;
            float streakBonus = currentStreak * 10f;
            float multiplier = currentStreak >= 7 ? streakMultiplier : 1f;
            
            float totalReward = (baseReward + streakBonus) * multiplier;
            
            // Create reward object
            DailyReward reward = new DailyReward
            {
                coins = Mathf.RoundToInt(totalReward),
                gems = Mathf.RoundToInt(totalReward * 0.1f),
                energy = Mathf.RoundToInt(totalReward * 0.05f),
                streak = currentStreak,
                multiplier = multiplier
            };
            
            // Show reward UI
            ShowDailyRewardUI(reward);
        }
        
        public void ClaimDailyReward()
        {
            if (hasClaimedTodayReward) return;
            
            hasClaimedTodayReward = true;
            
            // Track daily reward claimed
            TrackEvent("daily_reward_claimed", new Dictionary<string, object>
            {
                {"streak", currentStreak},
                {"max_streak", maxStreakAchieved}
            });
            
            OnStreakUpdated?.Invoke(currentStreak);
        }
        
        private void TriggerComebackBonus()
        {
            // Give extra rewards for coming back
            TrackEvent("comeback_bonus_triggered", new Dictionary<string, object>
            {
                {"days_away", (DateTime.Now - lastRewardTime).Days},
                {"multiplier", comebackMultiplier}
            });
        }
        
        #endregion
        
        #region FOMO Events System
        
        private IEnumerator FOMOEventsCoroutine()
        {
            while (true)
            {
                // Generate random FOMO events
                if (UnityEngine.Random.Range(0f, 1f) < 0.1f) // 10% chance per check
                {
                    GenerateFOMOEvent();
                }
                
                // Update active offers
                UpdateActiveOffers();
                
                yield return new WaitForSeconds(300f); // Check every 5 minutes
            }
        }
        
        private void GenerateFOMOEvent()
        {
            FOMOEventType eventType = (FOMOEventType)UnityEngine.Random.Range(0, 3);
            
            switch (eventType)
            {
                case FOMOEventType.LimitedTimeOffer:
                    GenerateLimitedTimeOffer();
                    break;
                case FOMOEventType.FlashSale:
                    GenerateFlashSale();
                    break;
                case FOMOEventType.ExclusiveItem:
                    GenerateExclusiveItem();
                    break;
            }
        }
        
        private void GenerateLimitedTimeOffer()
        {
            LimitedTimeOffer offer = new LimitedTimeOffer
            {
                id = Guid.NewGuid().ToString(),
                title = "Limited Time Offer!",
                description = "Get 50% more coins for the next hour!",
                discount = 0.5f,
                duration = limitedTimeOfferDuration,
                startTime = DateTime.Now,
                originalPrice = 9.99f,
                discountedPrice = 4.99f,
                items = new List<string> { "coins_1000", "gems_100" }
            };
            
            activeOffers.Add(offer);
            OnNewOfferAvailable?.Invoke(offer);
            
            // Track FOMO event
            TrackEvent("limited_time_offer_generated", new Dictionary<string, object>
            {
                {"offer_id", offer.id},
                {"discount", offer.discount},
                {"duration", offer.duration}
            });
        }
        
        private void GenerateFlashSale()
        {
            LimitedTimeOffer offer = new LimitedTimeOffer
            {
                id = Guid.NewGuid().ToString(),
                title = "FLASH SALE!",
                description = "80% off everything for 30 minutes!",
                discount = 0.8f,
                duration = flashSaleDuration,
                startTime = DateTime.Now,
                originalPrice = 19.99f,
                discountedPrice = 3.99f,
                items = new List<string> { "premium_pack", "energy_pack", "gems_500" }
            };
            
            activeOffers.Add(offer);
            OnNewOfferAvailable?.Invoke(offer);
            
            // Track FOMO event
            TrackEvent("flash_sale_generated", new Dictionary<string, object>
            {
                {"offer_id", offer.id},
                {"discount", offer.discount},
                {"duration", offer.duration}
            });
        }
        
        private void GenerateExclusiveItem()
        {
            // Generate exclusive item that can only be obtained during this event
            TrackEvent("exclusive_item_generated", new Dictionary<string, object>
            {
                {"item_type", "exclusive_skin"},
                {"rarity", "legendary"}
            });
        }
        
        private void UpdateActiveOffers()
        {
            for (int i = activeOffers.Count - 1; i >= 0; i--)
            {
                LimitedTimeOffer offer = activeOffers[i];
                if (DateTime.Now > offer.startTime.AddSeconds(offer.duration))
                {
                    activeOffers.RemoveAt(i);
                    
                    // Track offer expiration
                    TrackEvent("offer_expired", new Dictionary<string, object>
                    {
                        {"offer_id", offer.id},
                        {"duration_offered", offer.duration}
                    });
                }
            }
        }
        
        #endregion
        
        #region Variable Rewards System
        
        private IEnumerator VariableRewardsCoroutine()
        {
            while (true)
            {
                // Check for surprise events
                if (UnityEngine.Random.Range(0f, 1f) < surpriseEventChance)
                {
                    TriggerSurpriseEvent();
                }
                
                // Check for jackpot opportunities
                if (UnityEngine.Random.Range(0f, 1f) < jackpotChance)
                {
                    TriggerJackpot();
                }
                
                yield return new WaitForSeconds(60f); // Check every minute
            }
        }
        
        private void TriggerSurpriseEvent()
        {
            string[] surpriseEvents = {
                "double_coins_hour",
                "free_energy_refill",
                "bonus_gems",
                "lucky_spin",
                "mystery_box"
            };
            
            string eventType = surpriseEvents[UnityEngine.Random.Range(0, surpriseEvents.Length)];
            float eventValue = UnityEngine.Random.Range(1f, 5f);
            
            OnSurpriseEventTriggered?.Invoke(eventType, eventValue);
            
            // Track surprise event
            TrackEvent("surprise_event_triggered", new Dictionary<string, object>
            {
                {"event_type", eventType},
                {"event_value", eventValue}
            });
        }
        
        private void TriggerJackpot()
        {
            float jackpotAmount = UnityEngine.Random.Range(1000f, 10000f);
            
            // Track jackpot
            TrackEvent("jackpot_triggered", new Dictionary<string, object>
            {
                {"amount", jackpotAmount}
            });
        }
        
        public void OpenLootBox()
        {
            if (availableLootBoxes.Count <= 0) return;
            
            LootBox lootBox = availableLootBoxes[0];
            availableLootBoxes.RemoveAt(0);
            
            // Generate random rewards
            List<Reward> rewards = GenerateLootBoxRewards(lootBox);
            
            OnLootBoxOpened?.Invoke(lootBox);
            
            // Track loot box opening
            TrackEvent("loot_box_opened", new Dictionary<string, object>
            {
                {"loot_box_id", lootBox.id},
                {"rewards_count", rewards.Count},
                {"total_value", CalculateRewardValue(rewards)}
            });
        }
        
        private List<Reward> GenerateLootBoxRewards(LootBox lootBox)
        {
            List<Reward> rewards = new List<Reward>();
            
            // Generate rewards based on loot box tier
            for (int i = 0; i < lootBox.rewardCount; i++)
            {
                Reward reward = new Reward
                {
                    type = GetRandomRewardType(),
                    amount = UnityEngine.Random.Range(lootBox.minReward, lootBox.maxReward),
                    rarity = GetRandomRarity()
                };
                rewards.Add(reward);
            }
            
            return rewards;
        }
        
        private string GetRandomRewardType()
        {
            string[] types = { "coins", "gems", "energy", "powerup", "skin" };
            return types[UnityEngine.Random.Range(0, types.Length)];
        }
        
        private string GetRandomRarity()
        {
            float random = UnityEngine.Random.Range(0f, 1f);
            if (random < 0.5f) return "common";
            if (random < 0.8f) return "rare";
            if (random < 0.95f) return "epic";
            return "legendary";
        }
        
        private float CalculateRewardValue(List<Reward> rewards)
        {
            float totalValue = 0f;
            foreach (Reward reward in rewards)
            {
                totalValue += reward.amount * GetRewardMultiplier(reward.rarity);
            }
            return totalValue;
        }
        
        private float GetRewardMultiplier(string rarity)
        {
            switch (rarity)
            {
                case "common": return 1f;
                case "rare": return 2f;
                case "epic": return 5f;
                case "legendary": return 10f;
                default: return 1f;
            }
        }
        
        #endregion
        
        #region Social Pressure System
        
        private IEnumerator SocialFeaturesCoroutine()
        {
            while (true)
            {
                // Update leaderboards
                UpdateLeaderboards();
                
                // Check for friend activities
                CheckFriendActivities();
                
                // Check for guild events
                CheckGuildEvents();
                
                yield return new WaitForSeconds(leaderboardUpdateInterval);
            }
        }
        
        private void UpdateLeaderboards()
        {
            // Simulate leaderboard update
            int playerRank = UnityEngine.Random.Range(1, 1000);
            OnLeaderboardUpdated?.Invoke(playerRank);
            
            // Track leaderboard update
            TrackEvent("leaderboard_updated", new Dictionary<string, object>
            {
                {"player_rank", playerRank}
            });
        }
        
        private void CheckFriendActivities()
        {
            // Check for friend achievements, high scores, etc.
            TrackEvent("friend_activities_checked", new Dictionary<string, object>
            {
                {"friends_count", maxFriends}
            });
        }
        
        private void CheckGuildEvents()
        {
            // Check for guild competitions, events, etc.
            TrackEvent("guild_events_checked", new Dictionary<string, object>
            {
                {"guild_members", maxGuildMembers}
            });
        }
        
        #endregion
        
        #region Data Management
        
        private void LoadAddictionData()
        {
            // Load from PlayerPrefs or cloud save
            lastRewardTime = DateTime.Parse(PlayerPrefs.GetString("lastRewardTime", DateTime.Now.AddDays(-1).ToString()));
            currentStreak = PlayerPrefs.GetInt("currentStreak", 0);
            maxStreakAchieved = PlayerPrefs.GetInt("maxStreakAchieved", 0);
            hasClaimedTodayReward = PlayerPrefs.GetInt("hasClaimedTodayReward", 0) == 1;
        }
        
        private void SaveAddictionData()
        {
            PlayerPrefs.SetString("lastRewardTime", lastRewardTime.ToString());
            PlayerPrefs.SetInt("currentStreak", currentStreak);
            PlayerPrefs.SetInt("maxStreakAchieved", maxStreakAchieved);
            PlayerPrefs.SetInt("hasClaimedTodayReward", hasClaimedTodayReward ? 1 : 0);
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
        
        public int GetCurrentStreak()
        {
            return currentStreak;
        }
        
        public int GetMaxStreak()
        {
            return maxStreakAchieved;
        }
        
        public bool CanClaimDailyReward()
        {
            return !hasClaimedTodayReward && DateTime.Now.Date > lastRewardTime.Date;
        }
        
        public List<LimitedTimeOffer> GetActiveOffers()
        {
            return new List<LimitedTimeOffer>(activeOffers);
        }
        
        public int GetAvailableLootBoxes()
        {
            return availableLootBoxes.Count;
        }
        
        #endregion
        
        #region UI Methods
        
        private void ShowDailyRewardUI(DailyReward reward)
        {
            // Implement daily reward UI
            Debug.Log($"Daily Reward Available: {reward.coins} coins, {reward.gems} gems, {reward.energy} energy (Streak: {reward.streak})");
        }
        
        #endregion
        
        private void OnApplicationPause(bool pauseStatus)
        {
            if (!pauseStatus)
            {
                // App resumed - check for comeback bonus
                CheckDailyReward();
            }
        }
        
        private void OnApplicationFocus(bool hasFocus)
        {
            if (hasFocus)
            {
                // App focused - check for comeback bonus
                CheckDailyReward();
            }
        }
        
        private void OnDestroy()
        {
            SaveAddictionData();
        }
    }
    
    #region Data Classes
    
    [System.Serializable]
    public class DailyReward
    {
        public int coins;
        public int gems;
        public int energy;
        public int streak;
        public float multiplier;
    }
    
    [System.Serializable]
    public class LimitedTimeOffer
    {
        public string id;
        public string title;
        public string description;
        public float discount;
        public float duration;
        public DateTime startTime;
        public float originalPrice;
        public float discountedPrice;
        public List<string> items;
    }
    
    [System.Serializable]
    public class LootBox
    {
        public string id;
        public string name;
        public int tier;
        public int rewardCount;
        public float minReward;
        public float maxReward;
    }
    
    [System.Serializable]
    public class Reward
    {
        public string type;
        public float amount;
        public string rarity;
    }
    
    public enum FOMOEventType
    {
        LimitedTimeOffer,
        FlashSale,
        ExclusiveItem
    }
    
    #endregion
}