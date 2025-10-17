using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using Evergreen.Core;
using Evergreen.Analytics;

namespace Evergreen.Retention
{
    /// <summary>
    /// Advanced retention system with streaks, comeback offers, and habit-forming loops
    /// Designed to maximize player retention and minimize churn
    /// </summary>
    public class AdvancedRetentionSystem : MonoBehaviour
    {
        [Header("Streak System")]
        public bool enableStreaks = true;
        public int[] streakMilestones = { 3, 7, 14, 30, 60, 100 };
        public float[] streakMultipliers = { 1.2f, 1.5f, 2.0f, 3.0f, 5.0f, 10.0f };
        public int maxStreakDays = 365;
        public float streakDecayRate = 0.1f;
        
        [Header("Comeback System")]
        public bool enableComebackOffers = true;
        public int[] comebackThresholds = { 1, 3, 7, 14, 30 }; // days away
        public float[] comebackMultipliers = { 1.5f, 2.0f, 3.0f, 5.0f, 10.0f };
        public float comebackChance = 0.8f;
        
        [Header("Daily Engagement")]
        public bool enableDailyEngagement = true;
        public int dailyLoginReward = 100;
        public float dailyRewardMultiplier = 1.1f;
        public int maxDailyReward = 1000;
        public int dailyTaskCount = 5;
        
        [Header("Habit Formation")]
        public bool enableHabitFormation = true;
        public int habitFormationDays = 21;
        public float habitRewardMultiplier = 2.0f;
        public string[] habitTriggers = { "daily_login", "level_complete", "purchase_made", "social_action" };
        
        [Header("Churn Prediction")]
        public bool enableChurnPrediction = true;
        public float churnRiskThreshold = 0.7f;
        public float churnPreventionChance = 0.6f;
        public int churnPreventionCooldown = 24; // hours
        
        [Header("Retention Campaigns")]
        public bool enableRetentionCampaigns = true;
        public int campaignCount = 3;
        public float campaignChance = 0.3f;
        public int campaignDuration = 7; // days
        
        private Dictionary<string, PlayerRetentionProfile> _playerProfiles = new Dictionary<string, PlayerRetentionProfile>();
        private Dictionary<string, StreakReward> _streakRewards = new Dictionary<string, StreakReward>();
        private Dictionary<string, ComebackOffer> _comebackOffers = new Dictionary<string, ComebackOffer>();
        private Dictionary<string, DailyTask> _dailyTasks = new Dictionary<string, DailyTask>();
        private Dictionary<string, RetentionCampaign> _retentionCampaigns = new Dictionary<string, RetentionCampaign>();
        private Dictionary<string, ChurnPrediction> _churnPredictions = new Dictionary<string, ChurnPrediction>();
        
        private Coroutine _streakUpdateCoroutine;
        private Coroutine _comebackCheckCoroutine;
        private Coroutine _dailyTaskUpdateCoroutine;
        private Coroutine _churnPredictionCoroutine;
        private Coroutine _retentionCampaignCoroutine;
        
        // Events
        public System.Action<StreakReward> OnStreakRewardEarned;
        public System.Action<ComebackOffer> OnComebackOfferCreated;
        public System.Action<DailyTask> OnDailyTaskCompleted;
        public System.Action<RetentionCampaign> OnRetentionCampaignStarted;
        public System.Action<ChurnPrediction> OnChurnRiskDetected;
        
        public static AdvancedRetentionSystem Instance { get; private set; }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeRetentionSystem();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            StartRetentionSystems();
        }
        
        private void InitializeRetentionSystem()
        {
            Debug.Log("Advanced Retention System initialized - Maximum retention mode activated!");
            
            // Initialize streak rewards
            InitializeStreakRewards();
            
            // Initialize comeback offers
            InitializeComebackOffers();
            
            // Initialize daily tasks
            InitializeDailyTasks();
            
            // Initialize retention campaigns
            InitializeRetentionCampaigns();
            
            // Load player profiles
            LoadPlayerProfiles();
        }
        
        private void InitializeStreakRewards()
        {
            for (int i = 0; i < streakMilestones.Length; i++)
            {
                var reward = new StreakReward
                {
                    milestone = streakMilestones[i],
                    multiplier = streakMultipliers[i],
                    rewards = GenerateStreakRewards(streakMilestones[i])
                };
                
                _streakRewards[streakMilestones[i].ToString()] = reward;
            }
        }
        
        private List<string> GenerateStreakRewards(int milestone)
        {
            var rewards = new List<string>();
            
            if (milestone >= 3)
            {
                rewards.Add("coins:" + (milestone * 50));
                rewards.Add("energy:" + (milestone / 3));
            }
            
            if (milestone >= 7)
            {
                rewards.Add("gems:" + (milestone / 7));
                rewards.Add("booster_extra_moves:" + (milestone / 7));
            }
            
            if (milestone >= 14)
            {
                rewards.Add("exclusive_item:" + 1);
            }
            
            if (milestone >= 30)
            {
                rewards.Add("premium_currency:" + (milestone / 30));
            }
            
            return rewards;
        }
        
        private void InitializeComebackOffers()
        {
            for (int i = 0; i < comebackThresholds.Length; i++)
            {
                var offer = new ComebackOffer
                {
                    threshold = comebackThresholds[i],
                    multiplier = comebackMultipliers[i],
                    rewards = GenerateComebackRewards(comebackThresholds[i])
                };
                
                _comebackOffers[comebackThresholds[i].ToString()] = offer;
            }
        }
        
        private List<string> GenerateComebackRewards(int threshold)
        {
            var rewards = new List<string>();
            
            rewards.Add("coins:" + (threshold * 100));
            rewards.Add("energy:" + (threshold * 2));
            
            if (threshold >= 3)
            {
                rewards.Add("gems:" + (threshold * 5));
            }
            
            if (threshold >= 7)
            {
                rewards.Add("exclusive_comeback_item:" + 1);
            }
            
            return rewards;
        }
        
        private void InitializeDailyTasks()
        {
            var taskTypes = new[] { "login", "level_complete", "combo_achieved", "purchase_made", "social_action" };
            
            for (int i = 0; i < dailyTaskCount; i++)
            {
                var task = new DailyTask
                {
                    id = Guid.NewGuid().ToString(),
                    type = taskTypes[i % taskTypes.Length],
                    description = GenerateTaskDescription(taskTypes[i % taskTypes.Length]),
                    target = GetTaskTarget(taskTypes[i % taskTypes.Length]),
                    reward = GetTaskReward(taskTypes[i % taskTypes.Length]),
                    isCompleted = false,
                    createdAt = DateTime.Now
                };
                
                _dailyTasks[task.id] = task;
            }
        }
        
        private void InitializeRetentionCampaigns()
        {
            var campaignTypes = new[] { "welcome_back", "special_offer", "exclusive_content", "social_challenge" };
            
            for (int i = 0; i < campaignCount; i++)
            {
                var campaign = new RetentionCampaign
                {
                    id = Guid.NewGuid().ToString(),
                    type = campaignTypes[i % campaignTypes.Length],
                    name = $"Retention Campaign {i + 1}",
                    description = GenerateCampaignDescription(campaignTypes[i % campaignTypes.Length]),
                    duration = campaignDuration,
                    isActive = false,
                    createdAt = DateTime.Now
                };
                
                _retentionCampaigns[campaign.id] = campaign;
            }
        }
        
        private void StartRetentionSystems()
        {
            if (enableStreaks)
            {
                _streakUpdateCoroutine = StartCoroutine(StreakUpdateCoroutine());
            }
            
            if (enableComebackOffers)
            {
                _comebackCheckCoroutine = StartCoroutine(ComebackCheckCoroutine());
            }
            
            if (enableDailyEngagement)
            {
                _dailyTaskUpdateCoroutine = StartCoroutine(DailyTaskUpdateCoroutine());
            }
            
            if (enableChurnPrediction)
            {
                _churnPredictionCoroutine = StartCoroutine(ChurnPredictionCoroutine());
            }
            
            if (enableRetentionCampaigns)
            {
                _retentionCampaignCoroutine = StartCoroutine(RetentionCampaignCoroutine());
            }
        }
        
        #region Streak System
        private IEnumerator StreakUpdateCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(3600f); // Check every hour
                
                UpdateAllStreaks();
            }
        }
        
        private void UpdateAllStreaks()
        {
            foreach (var profile in _playerProfiles.Values)
            {
                UpdatePlayerStreak(profile);
            }
        }
        
        private void UpdatePlayerStreak(PlayerRetentionProfile profile)
        {
            var timeSinceLastLogin = DateTime.Now - profile.lastLogin;
            
            if (timeSinceLastLogin.TotalDays >= 2)
            {
                // Streak broken
                profile.currentStreak = 0;
                profile.streakBrokenAt = DateTime.Now;
            }
            else if (timeSinceLastLogin.TotalDays < 1)
            {
                // Player logged in today, maintain streak
                if (profile.lastLogin.Date == DateTime.Today)
                {
                    // Check if this is a new day
                    if (profile.lastLogin.Date != DateTime.Today)
                    {
                        profile.currentStreak++;
                        CheckStreakMilestone(profile);
                    }
                }
            }
        }
        
        private void CheckStreakMilestone(PlayerRetentionProfile profile)
        {
            if (streakMilestones.Contains(profile.currentStreak))
            {
                var reward = _streakRewards[profile.currentStreak.ToString()];
                var streakReward = new StreakReward
                {
                    milestone = profile.currentStreak,
                    multiplier = reward.multiplier,
                    rewards = reward.rewards,
                    playerId = profile.playerId,
                    earnedAt = DateTime.Now
                };
                
                // Award rewards
                AwardStreakRewards(profile.playerId, streakReward);
                
                OnStreakRewardEarned?.Invoke(streakReward);
                
                // Show streak reward UI
                ShowStreakRewardUI(streakReward);
            }
        }
        
        private void AwardStreakRewards(string playerId, StreakReward reward)
        {
            var gameManager = OptimizedCoreSystem.Instance;
            if (gameManager == null) return;
            
            foreach (var rewardString in reward.rewards)
            {
                var parts = rewardString.Split(':');
                if (parts.Length == 2)
                {
                    var type = parts[0];
                    var amount = int.Parse(parts[1]);
                    
                    switch (type)
                    {
                        case "coins":
                            gameManager.AddCurrency("coins", amount);
                            break;
                        case "gems":
                            gameManager.AddCurrency("gems", amount);
                            break;
                        case "energy":
                            gameManager.AddCurrency("energy", amount);
                            break;
                        case "booster_extra_moves":
                            gameManager.AddInventoryItem("booster_extra_moves", amount);
                            break;
                    }
                }
            }
        }
        
        private void ShowStreakRewardUI(StreakReward reward)
        {
            var uiSystem = OptimizedUISystem.Instance;
            if (uiSystem != null)
            {
                var message = $"🔥 {reward.milestone} day streak! {reward.multiplier}x rewards earned!";
                uiSystem.ShowNotification(message, NotificationType.Success, 8f);
            }
        }
        #endregion
        
        #region Comeback System
        private IEnumerator ComebackCheckCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(7200f); // Check every 2 hours
                
                CheckComebackOffers();
            }
        }
        
        private void CheckComebackOffers()
        {
            foreach (var profile in _playerProfiles.Values)
            {
                if (ShouldCreateComebackOffer(profile))
                {
                    CreateComebackOffer(profile);
                }
            }
        }
        
        private bool ShouldCreateComebackOffer(PlayerRetentionProfile profile)
        {
            if (profile.hasActiveComebackOffer)
                return false;
                
            var daysAway = (DateTime.Now - profile.lastLogin).TotalDays;
            
            foreach (var threshold in comebackThresholds)
            {
                if (daysAway >= threshold && daysAway < threshold + 1)
                {
                    return UnityEngine.Random.Range(0f, 1f) < comebackChance;
                }
            }
            
            return false;
        }
        
        private void CreateComebackOffer(PlayerRetentionProfile profile)
        {
            var daysAway = (int)(DateTime.Now - profile.lastLogin).TotalDays;
            var threshold = comebackThresholds.FirstOrDefault(t => daysAway >= t);
            
            if (threshold == 0)
                return;
                
            var offer = _comebackOffers[threshold.ToString()];
            var comebackOffer = new ComebackOffer
            {
                threshold = threshold,
                multiplier = offer.multiplier,
                rewards = offer.rewards,
                playerId = profile.playerId,
                daysAway = daysAway,
                createdAt = DateTime.Now,
                isActive = true
            };
            
            profile.hasActiveComebackOffer = true;
            profile.lastComebackOffer = DateTime.Now;
            
            OnComebackOfferCreated?.Invoke(comebackOffer);
            
            // Show comeback offer UI
            ShowComebackOfferUI(comebackOffer);
        }
        
        private void ShowComebackOfferUI(ComebackOffer offer)
        {
            var uiSystem = OptimizedUISystem.Instance;
            if (uiSystem != null)
            {
                var message = $"🎉 Welcome back! You've been away for {offer.daysAway} days. Special rewards await!";
                uiSystem.ShowNotification(message, NotificationType.Success, 10f);
            }
        }
        #endregion
        
        #region Daily Engagement
        private IEnumerator DailyTaskUpdateCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(3600f); // Check every hour
                
                UpdateDailyTasks();
            }
        }
        
        private void UpdateDailyTasks()
        {
            // Reset daily tasks if new day
            if (DateTime.Now.Date != DateTime.Today)
            {
                ResetDailyTasks();
            }
        }
        
        private void ResetDailyTasks()
        {
            foreach (var task in _dailyTasks.Values)
            {
                task.isCompleted = false;
                task.createdAt = DateTime.Now;
            }
        }
        
        public void CompleteDailyTask(string playerId, string taskType, int value)
        {
            var profile = GetPlayerProfile(playerId);
            var task = _dailyTasks.Values.FirstOrDefault(t => t.type == taskType && !t.isCompleted);
            
            if (task == null)
                return;
                
            if (value >= task.target)
            {
                task.isCompleted = true;
                task.completedAt = DateTime.Now;
                
                // Award reward
                AwardTaskReward(playerId, task);
                
                OnDailyTaskCompleted?.Invoke(task);
                
                // Show task completion UI
                ShowTaskCompletionUI(task);
                
                // Update habit formation
                UpdateHabitFormation(profile, taskType);
            }
        }
        
        private void AwardTaskReward(string playerId, DailyTask task)
        {
            var gameManager = OptimizedCoreSystem.Instance;
            if (gameManager == null) return;
            
            var reward = Mathf.RoundToInt(task.reward * dailyRewardMultiplier);
            
            switch (task.type)
            {
                case "login":
                    gameManager.AddCurrency("coins", reward);
                    break;
                case "level_complete":
                    gameManager.AddCurrency("gems", reward);
                    break;
                case "combo_achieved":
                    gameManager.AddCurrency("energy", reward);
                    break;
                case "purchase_made":
                    gameManager.AddInventoryItem("booster_extra_moves", reward);
                    break;
                case "social_action":
                    gameManager.AddCurrency("coins", reward);
                    break;
            }
        }
        
        private void ShowTaskCompletionUI(DailyTask task)
        {
            var uiSystem = OptimizedUISystem.Instance;
            if (uiSystem != null)
            {
                var message = $"✅ Daily task completed: {task.description} - +{task.reward} reward!";
                uiSystem.ShowNotification(message, NotificationType.Success, 5f);
            }
        }
        #endregion
        
        #region Habit Formation
        private void UpdateHabitFormation(PlayerRetentionProfile profile, string action)
        {
            if (!habitTriggers.Contains(action))
                return;
                
            if (!profile.habitFormation.ContainsKey(action))
            {
                profile.habitFormation[action] = 0;
            }
            
            profile.habitFormation[action]++;
            
            // Check if habit is formed
            if (profile.habitFormation[action] >= habitFormationDays)
            {
                // Habit formed, increase engagement
                profile.engagementLevel = Mathf.Clamp01(profile.engagementLevel + 0.1f);
                
                // Show habit formation notification
                ShowHabitFormationNotification(action);
            }
        }
        
        private void ShowHabitFormationNotification(string action)
        {
            var uiSystem = OptimizedUISystem.Instance;
            if (uiSystem != null)
            {
                var message = $"🎯 Habit formed! You've been {action.Replace("_", " ")} for {habitFormationDays} days!";
                uiSystem.ShowNotification(message, NotificationType.Success, 8f);
            }
        }
        #endregion
        
        #region Churn Prediction
        private IEnumerator ChurnPredictionCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(14400f); // Check every 4 hours
                
                PredictChurn();
            }
        }
        
        private void PredictChurn()
        {
            foreach (var profile in _playerProfiles.Values)
            {
                var churnRisk = CalculateChurnRisk(profile);
                
                if (churnRisk >= churnRiskThreshold)
                {
                    var prediction = new ChurnPrediction
                    {
                        playerId = profile.playerId,
                        riskLevel = churnRisk,
                        factors = GetChurnFactors(profile),
                        predictedAt = DateTime.Now
                    };
                    
                    _churnPredictions[profile.playerId] = prediction;
                    
                    OnChurnRiskDetected?.Invoke(prediction);
                    
                    // Trigger retention campaign
                    TriggerRetentionCampaign(profile);
                }
            }
        }
        
        private float CalculateChurnRisk(PlayerRetentionProfile profile)
        {
            var risk = 0f;
            
            // Time since last login
            var daysSinceLogin = (DateTime.Now - profile.lastLogin).TotalDays;
            risk += Mathf.Clamp01((float)daysSinceLogin / 7f) * 0.3f;
            
            // Engagement level
            risk += (1f - profile.engagementLevel) * 0.3f;
            
            // Streak status
            if (profile.currentStreak == 0)
                risk += 0.2f;
                
            // Purchase history
            if (profile.totalSpent == 0)
                risk += 0.1f;
                
            // Social activity
            if (profile.socialScore == 0)
                risk += 0.1f;
                
            return Mathf.Clamp01(risk);
        }
        
        private List<string> GetChurnFactors(PlayerRetentionProfile profile)
        {
            var factors = new List<string>();
            
            var daysSinceLogin = (DateTime.Now - profile.lastLogin).TotalDays;
            if (daysSinceLogin > 3)
                factors.Add("Inactive for " + daysSinceLogin + " days");
                
            if (profile.engagementLevel < 0.3f)
                factors.Add("Low engagement level");
                
            if (profile.currentStreak == 0)
                factors.Add("No active streak");
                
            if (profile.totalSpent == 0)
                factors.Add("No purchase history");
                
            return factors;
        }
        #endregion
        
        #region Retention Campaigns
        private IEnumerator RetentionCampaignCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(86400f); // Check every day
                
                CheckRetentionCampaigns();
            }
        }
        
        private void CheckRetentionCampaigns()
        {
            if (UnityEngine.Random.Range(0f, 1f) < campaignChance)
            {
                var campaign = _retentionCampaigns.Values.FirstOrDefault(c => !c.isActive);
                if (campaign != null)
                {
                    StartRetentionCampaign(campaign);
                }
            }
        }
        
        private void StartRetentionCampaign(RetentionCampaign campaign)
        {
            campaign.isActive = true;
            campaign.startedAt = DateTime.Now;
            campaign.expiresAt = DateTime.Now.AddDays(campaign.duration);
            
            OnRetentionCampaignStarted?.Invoke(campaign);
            
            // Show campaign notification
            ShowRetentionCampaignUI(campaign);
        }
        
        private void TriggerRetentionCampaign(PlayerRetentionProfile profile)
        {
            var campaign = _retentionCampaigns.Values.FirstOrDefault(c => !c.isActive);
            if (campaign != null)
            {
                campaign.targetPlayerId = profile.playerId;
                StartRetentionCampaign(campaign);
            }
        }
        
        private void ShowRetentionCampaignUI(RetentionCampaign campaign)
        {
            var uiSystem = OptimizedUISystem.Instance;
            if (uiSystem != null)
            {
                var message = $"🎯 {campaign.name}: {campaign.description}";
                uiSystem.ShowNotification(message, NotificationType.Info, 10f);
            }
        }
        #endregion
        
        #region Helper Methods
        private string GenerateTaskDescription(string type)
        {
            switch (type)
            {
                case "login":
                    return "Log in today";
                case "level_complete":
                    return "Complete 3 levels";
                case "combo_achieved":
                    return "Achieve a 5x combo";
                case "purchase_made":
                    return "Make a purchase";
                case "social_action":
                    return "Send a gift to a friend";
                default:
                    return "Complete daily task";
            }
        }
        
        private int GetTaskTarget(string type)
        {
            switch (type)
            {
                case "login":
                    return 1;
                case "level_complete":
                    return 3;
                case "combo_achieved":
                    return 5;
                case "purchase_made":
                    return 1;
                case "social_action":
                    return 1;
                default:
                    return 1;
            }
        }
        
        private int GetTaskReward(string type)
        {
            switch (type)
            {
                case "login":
                    return 100;
                case "level_complete":
                    return 50;
                case "combo_achieved":
                    return 25;
                case "purchase_made":
                    return 200;
                case "social_action":
                    return 75;
                default:
                    return 50;
            }
        }
        
        private string GenerateCampaignDescription(string type)
        {
            switch (type)
            {
                case "welcome_back":
                    return "Welcome back! Special rewards await!";
                case "special_offer":
                    return "Limited time offer! 50% off everything!";
                case "exclusive_content":
                    return "Exclusive content unlocked! Check it out!";
                case "social_challenge":
                    return "Challenge your friends! Compete and win!";
                default:
                    return "Special retention campaign!";
            }
        }
        #endregion
        
        #region Player Profile Management
        private PlayerRetentionProfile GetPlayerProfile(string playerId)
        {
            if (!_playerProfiles.ContainsKey(playerId))
            {
                _playerProfiles[playerId] = new PlayerRetentionProfile
                {
                    playerId = playerId,
                    currentStreak = 0,
                    maxStreak = 0,
                    lastLogin = DateTime.Now,
                    lastStreakReward = DateTime.MinValue,
                    streakBrokenAt = DateTime.MinValue,
                    hasActiveComebackOffer = false,
                    lastComebackOffer = DateTime.MinValue,
                    engagementLevel = 0.5f,
                    totalSpent = 0f,
                    socialScore = 0,
                    habitFormation = new Dictionary<string, int>(),
                    churnRisk = 0f,
                    lastChurnPrediction = DateTime.MinValue
                };
            }
            
            return _playerProfiles[playerId];
        }
        
        public void OnPlayerAction(string playerId, string action, int value = 0)
        {
            var profile = GetPlayerProfile(playerId);
            profile.lastLogin = DateTime.Now;
            
            // Update streak
            UpdatePlayerStreak(profile);
            
            // Complete daily task
            CompleteDailyTask(playerId, action, value);
            
            // Update habit formation
            UpdateHabitFormation(profile, action);
        }
        
        private void LoadPlayerProfiles()
        {
            // Load player profiles from save data
            // This would implement profile loading logic
        }
        
        private void SavePlayerProfiles()
        {
            // Save player profiles to persistent storage
            // This would implement profile saving logic
        }
        #endregion
        
        #region Public API
        public Dictionary<string, object> GetRetentionStatistics()
        {
            return new Dictionary<string, object>
            {
                {"total_players", _playerProfiles.Count},
                {"average_streak", _playerProfiles.Values.Average(p => p.currentStreak)},
                {"max_streak", _playerProfiles.Values.Max(p => p.maxStreak)},
                {"active_comeback_offers", _playerProfiles.Values.Count(p => p.hasActiveComebackOffer)},
                {"completed_daily_tasks", _dailyTasks.Values.Count(t => t.isCompleted)},
                {"active_retention_campaigns", _retentionCampaigns.Values.Count(c => c.isActive)},
                {"churn_risk_players", _churnPredictions.Count},
                {"average_engagement", _playerProfiles.Values.Average(p => p.engagementLevel)}
            };
        }
        #endregion
        
        void OnDestroy()
        {
            if (_streakUpdateCoroutine != null)
                StopCoroutine(_streakUpdateCoroutine);
            if (_comebackCheckCoroutine != null)
                StopCoroutine(_comebackCheckCoroutine);
            if (_dailyTaskUpdateCoroutine != null)
                StopCoroutine(_dailyTaskUpdateCoroutine);
            if (_churnPredictionCoroutine != null)
                StopCoroutine(_churnPredictionCoroutine);
            if (_retentionCampaignCoroutine != null)
                StopCoroutine(_retentionCampaignCoroutine);
                
            SavePlayerProfiles();
        }
    }
    
    // Data Classes
    [System.Serializable]
    public class PlayerRetentionProfile
    {
        public string playerId;
        public int currentStreak;
        public int maxStreak;
        public DateTime lastLogin;
        public DateTime lastStreakReward;
        public DateTime streakBrokenAt;
        public bool hasActiveComebackOffer;
        public DateTime lastComebackOffer;
        public float engagementLevel;
        public float totalSpent;
        public int socialScore;
        public Dictionary<string, int> habitFormation;
        public float churnRisk;
        public DateTime lastChurnPrediction;
    }
    
    [System.Serializable]
    public class StreakReward
    {
        public int milestone;
        public float multiplier;
        public List<string> rewards;
        public string playerId;
        public DateTime earnedAt;
    }
    
    [System.Serializable]
    public class ComebackOffer
    {
        public int threshold;
        public float multiplier;
        public List<string> rewards;
        public string playerId;
        public int daysAway;
        public DateTime createdAt;
        public bool isActive;
    }
    
    [System.Serializable]
    public class DailyTask
    {
        public string id;
        public string type;
        public string description;
        public int target;
        public int reward;
        public bool isCompleted;
        public DateTime createdAt;
        public DateTime completedAt;
    }
    
    [System.Serializable]
    public class RetentionCampaign
    {
        public string id;
        public string type;
        public string name;
        public string description;
        public int duration;
        public bool isActive;
        public string targetPlayerId;
        public DateTime createdAt;
        public DateTime startedAt;
        public DateTime expiresAt;
    }
    
    [System.Serializable]
    public class ChurnPrediction
    {
        public string playerId;
        public float riskLevel;
        public List<string> factors;
        public DateTime predictedAt;
    }
}