using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Evergreen.Core;
using Evergreen.Analytics;

namespace Evergreen.Addiction
{
    /// <summary>
    /// Advanced psychological addiction mechanics for maximum player engagement
    /// Implements variable ratio rewards, loss aversion, social proof, and FOMO
    /// </summary>
    public class AddictionMechanics : MonoBehaviour
    {
        [Header("Variable Ratio Rewards")]
        public float baseRewardChance = 0.1f;
        public float rewardEscalation = 0.05f;
        public float maxRewardChance = 0.8f;
        public int rewardStreakThreshold = 5;
        
        [Header("Loss Aversion")]
        public float nearMissThreshold = 0.8f;
        public float lossAversionMultiplier = 2.0f;
        public float nearMissReward = 0.5f;
        
        [Header("Social Proof")]
        public bool enableSocialProof = true;
        public float socialProofUpdateInterval = 30f;
        public int fakePlayerCount = 3247;
        public string[] socialProofMessages = {
            "3,247 players are playing right now!",
            "Sarah just got a 50x combo!",
            "Mike found a rare item!",
            "Lisa completed level 100!",
            "Tom earned 1000 coins!"
        };
        
        [Header("FOMO (Fear of Missing Out)")]
        public bool enableFOMO = true;
        public float fomoUpdateInterval = 60f;
        public int[] fomoThresholds = { 10, 30, 60, 120, 300 }; // minutes
        public string[] fomoMessages = {
            "Limited time offer! Only 10 minutes left!",
            "Exclusive item! 30 minutes remaining!",
            "Special deal! 1 hour left!",
            "Rare opportunity! 2 hours remaining!",
            "Ultimate offer! 5 hours left!"
        };
        
        [Header("Sunk Cost Fallacy")]
        public bool enableSunkCost = true;
        public float investmentMultiplier = 1.2f;
        public int investmentThreshold = 100; // coins spent
        
        [Header("Dopamine Triggers")]
        public float dopamineHitDuration = 2f;
        public float dopamineHitIntensity = 1.5f;
        public Color dopamineColor = Color.yellow;
        public AudioClip dopamineSound;
        
        private Dictionary<string, PlayerAddictionProfile> _playerProfiles = new Dictionary<string, PlayerAddictionProfile>();
        private Dictionary<string, VariableReward> _variableRewards = new Dictionary<string, VariableReward>();
        private Dictionary<string, FOMOOffer> _fomoOffers = new Dictionary<string, FOMOOffer>();
        private Coroutine _socialProofCoroutine;
        private Coroutine _fomoCoroutine;
        private Coroutine _dopamineCoroutine;
        
        // Events
        public System.Action<VariableReward> OnVariableRewardTriggered;
        public System.Action<NearMiss> OnNearMissTriggered;
        public System.Action<FOMOOffer> OnFOMOOfferCreated;
        public System.Action<SocialProof> OnSocialProofShown;
        public System.Action<DopamineHit> OnDopamineHitTriggered;
        
        public static AddictionMechanics Instance { get; private set; }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeAddictionMechanics();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            StartAddictionSystems();
        }
        
        private void InitializeAddictionMechanics()
        {
            Debug.Log("Addiction Mechanics initialized - Maximum engagement mode activated!");
            
            // Initialize variable rewards
            InitializeVariableRewards();
            
            // Initialize FOMO offers
            InitializeFOMOOffers();
            
            // Load player profiles
            LoadPlayerProfiles();
        }
        
        private void InitializeVariableRewards()
        {
            _variableRewards["coins"] = new VariableReward
            {
                id = "coins",
                name = "Coin Bonus",
                baseChance = 0.15f,
                escalation = 0.03f,
                minReward = 10,
                maxReward = 100,
                streakBonus = 1.5f
            };
            
            _variableRewards["gems"] = new VariableReward
            {
                id = "gems",
                name = "Gem Bonus",
                baseChance = 0.05f,
                escalation = 0.01f,
                minReward = 1,
                maxReward = 10,
                streakBonus = 2.0f
            };
            
            _variableRewards["energy"] = new VariableReward
            {
                id = "energy",
                name = "Energy Bonus",
                baseChance = 0.08f,
                escalation = 0.02f,
                minReward = 1,
                maxReward = 5,
                streakBonus = 1.8f
            };
            
            _variableRewards["booster"] = new VariableReward
            {
                id = "booster",
                name = "Booster Bonus",
                baseChance = 0.03f,
                escalation = 0.005f,
                minReward = 1,
                maxReward = 3,
                streakBonus = 3.0f
            };
        }
        
        private void InitializeFOMOOffers()
        {
            _fomoOffers["limited_energy"] = new FOMOOffer
            {
                id = "limited_energy",
                name = "Energy Surge",
                description = "Double energy for 1 hour!",
                originalPrice = 50,
                fomoPrice = 25,
                duration = 60f,
                isActive = false
            };
            
            _fomoOffers["exclusive_booster"] = new FOMOOffer
            {
                id = "exclusive_booster",
                name = "Exclusive Booster Pack",
                description = "Rare boosters at 50% off!",
                originalPrice = 100,
                fomoPrice = 50,
                duration = 30f,
                isActive = false
            };
            
            _fomoOffers["premium_currency"] = new FOMOOffer
                {
                    id = "premium_currency",
                    name = "Premium Currency Pack",
                    description = "Limited time gem offer!",
                    originalPrice = 200,
                    fomoPrice = 100,
                    duration = 120f,
                    isActive = false
                };
        }
        
        private void StartAddictionSystems()
        {
            if (enableSocialProof)
            {
                _socialProofCoroutine = StartCoroutine(SocialProofCoroutine());
            }
            
            if (enableFOMO)
            {
                _fomoCoroutine = StartCoroutine(FOMOCoroutine());
            }
            
            _dopamineCoroutine = StartCoroutine(DopamineCoroutine());
        }
        
        #region Variable Ratio Rewards
        public void TriggerVariableReward(string playerId, string rewardType)
        {
            if (!_variableRewards.ContainsKey(rewardType)) return;
            
            var profile = GetPlayerProfile(playerId);
            var reward = _variableRewards[rewardType];
            
            // Calculate chance based on player engagement
            float chance = CalculateRewardChance(profile, reward);
            
            if (UnityEngine.Random.Range(0f, 1f) < chance)
            {
                var rewardAmount = CalculateRewardAmount(profile, reward);
                var variableReward = new VariableReward
                {
                    id = reward.id,
                    name = reward.name,
                    amount = rewardAmount,
                    playerId = playerId,
                    timestamp = DateTime.Now
                };
                
                AwardReward(playerId, variableReward);
                OnVariableRewardTriggered?.Invoke(variableReward);
                
                // Trigger dopamine hit
                TriggerDopamineHit(playerId, "Variable Reward: " + reward.name);
                
                // Update player profile
                profile.variableRewardCount++;
                profile.lastVariableReward = DateTime.Now;
            }
        }
        
        private float CalculateRewardChance(PlayerAddictionProfile profile, VariableReward reward)
        {
            float baseChance = reward.baseChance;
            float escalation = reward.escalation * profile.engagementLevel;
            float streakBonus = profile.rewardStreak >= rewardStreakThreshold ? reward.streakBonus : 1f;
            
            return Mathf.Clamp01(baseChance + escalation) * streakBonus;
        }
        
        private int CalculateRewardAmount(PlayerAddictionProfile profile, VariableReward reward)
        {
            float multiplier = 1f + (profile.engagementLevel * 0.5f);
            if (profile.rewardStreak >= rewardStreakThreshold)
                multiplier *= reward.streakBonus;
                
            return Mathf.RoundToInt(UnityEngine.Random.Range(reward.minReward, reward.maxReward + 1) * multiplier);
        }
        #endregion
        
        #region Loss Aversion
        public void TriggerNearMiss(string playerId, float progress)
        {
            if (progress >= nearMissThreshold)
            {
                var nearMiss = new NearMiss
                {
                    playerId = playerId,
                    progress = progress,
                    reward = nearMissReward,
                    timestamp = DateTime.Now
                };
                
                OnNearMissTriggered?.Invoke(nearMiss);
                
                // Show near miss UI
                ShowNearMissUI(nearMiss);
                
                // Trigger dopamine hit
                TriggerDopamineHit(playerId, "Almost got it! Try again!");
            }
        }
        
        private void ShowNearMissUI(NearMiss nearMiss)
        {
            // Show "Almost!" popup with encouraging message
            var uiSystem = OptimizedUISystem.Instance;
            if (uiSystem != null)
            {
                uiSystem.ShowNotification("So close! " + (nearMiss.progress * 100).ToString("F0") + "% complete!", 
                    NotificationType.Warning, 3f);
            }
        }
        #endregion
        
        #region Social Proof
        private IEnumerator SocialProofCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(socialProofUpdateInterval);
                
                if (enableSocialProof)
                {
                    ShowSocialProof();
                }
            }
        }
        
        private void ShowSocialProof()
        {
            var message = socialProofMessages[UnityEngine.Random.Range(0, socialProofMessages.Length)];
            var socialProof = new SocialProof
            {
                message = message,
                playerCount = fakePlayerCount + UnityEngine.Random.Range(-100, 100),
                timestamp = DateTime.Now
            };
            
            OnSocialProofShown?.Invoke(socialProof);
            
            // Show social proof UI
            var uiSystem = OptimizedUISystem.Instance;
            if (uiSystem != null)
            {
                uiSystem.ShowNotification(socialProof.message, NotificationType.Info, 5f);
            }
        }
        #endregion
        
        #region FOMO (Fear of Missing Out)
        private IEnumerator FOMOCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(fomoUpdateInterval);
                
                if (enableFOMO)
                {
                    CheckAndCreateFOMOOffers();
                }
            }
        }
        
        private void CheckAndCreateFOMOOffers()
        {
            foreach (var offer in _fomoOffers.Values)
            {
                if (!offer.isActive && ShouldCreateFOMOOffer(offer))
                {
                    CreateFOMOOffer(offer);
                }
            }
        }
        
        private bool ShouldCreateFOMOOffer(FOMOOffer offer)
        {
            // Create FOMO offers based on player behavior and time
            var timeSinceLastOffer = DateTime.Now - offer.lastCreated;
            return timeSinceLastOffer.TotalMinutes > 30; // Minimum 30 minutes between offers
        }
        
        private void CreateFOMOOffer(FOMOOffer offer)
        {
            offer.isActive = true;
            offer.lastCreated = DateTime.Now;
            offer.remainingTime = offer.duration;
            
            OnFOMOOfferCreated?.Invoke(offer);
            
            // Show FOMO offer UI
            ShowFOMOOfferUI(offer);
            
            // Start countdown
            StartCoroutine(FOMOOfferCountdown(offer));
        }
        
        private void ShowFOMOOfferUI(FOMOOffer offer)
        {
            var uiSystem = OptimizedUISystem.Instance;
            if (uiSystem != null)
            {
                var message = $"🔥 {offer.name} - {offer.description} Only {offer.remainingTime:F0} minutes left!";
                uiSystem.ShowNotification(message, NotificationType.Warning, 10f);
            }
        }
        
        private IEnumerator FOMOOfferCountdown(FOMOOffer offer)
        {
            while (offer.isActive && offer.remainingTime > 0)
            {
                yield return new WaitForSeconds(1f);
                offer.remainingTime -= 1f;
                
                // Update UI with remaining time
                if (offer.remainingTime <= 0)
                {
                    offer.isActive = false;
                    // Show "Offer expired" message
                    var uiSystem = OptimizedUISystem.Instance;
                    if (uiSystem != null)
                    {
                        uiSystem.ShowNotification("Offer expired! Better luck next time!", NotificationType.Error, 3f);
                    }
                }
            }
        }
        #endregion
        
        #region Sunk Cost Fallacy
        public void TrackInvestment(string playerId, int amount, string currency)
        {
            var profile = GetPlayerProfile(playerId);
            profile.totalInvestment += amount;
            
            if (profile.totalInvestment >= investmentThreshold)
            {
                // Player has invested enough, increase engagement
                profile.engagementLevel = Mathf.Clamp01(profile.engagementLevel + 0.1f);
                
                // Show investment reward
                var reward = Mathf.RoundToInt(amount * investmentMultiplier);
                var uiSystem = OptimizedUISystem.Instance;
                if (uiSystem != null)
                {
                    uiSystem.ShowNotification($"Investment bonus! +{reward} {currency}", NotificationType.Success, 3f);
                }
            }
        }
        #endregion
        
        #region Dopamine Triggers
        private IEnumerator DopamineCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(1f);
                
                // Check for dopamine triggers
                CheckDopamineTriggers();
            }
        }
        
        private void CheckDopamineTriggers()
        {
            // Check for various dopamine triggers
            // This would be called by other systems when positive events occur
        }
        
        public void TriggerDopamineHit(string playerId, string reason)
        {
            var dopamineHit = new DopamineHit
            {
                playerId = playerId,
                reason = reason,
                intensity = dopamineHitIntensity,
                duration = dopamineHitDuration,
                timestamp = DateTime.Now
            };
            
            OnDopamineHitTriggered?.Invoke(dopamineHit);
            
            // Visual and audio feedback
            ShowDopamineEffect(dopamineHit);
        }
        
        private void ShowDopamineEffect(DopamineHit hit)
        {
            // Show visual effect
            var uiSystem = OptimizedUISystem.Instance;
            if (uiSystem != null)
            {
                uiSystem.ShowNotification("🎉 " + hit.reason, NotificationType.Success, hit.duration);
            }
            
            // Play sound
            if (dopamineSound != null)
            {
                AudioSource.PlayClipAtPoint(dopamineSound, Vector3.zero);
            }
        }
        #endregion
        
        #region Player Profile Management
        private PlayerAddictionProfile GetPlayerProfile(string playerId)
        {
            if (!_playerProfiles.ContainsKey(playerId))
            {
                _playerProfiles[playerId] = new PlayerAddictionProfile
                {
                    playerId = playerId,
                    engagementLevel = 0.5f,
                    variableRewardCount = 0,
                    nearMissCount = 0,
                    totalInvestment = 0,
                    rewardStreak = 0,
                    lastVariableReward = DateTime.MinValue,
                    lastNearMiss = DateTime.MinValue,
                    lastLogin = DateTime.Now
                };
            }
            
            return _playerProfiles[playerId];
        }
        
        private void AwardReward(string playerId, VariableReward reward)
        {
            // Award the reward through the economy system
            var gameManager = OptimizedCoreSystem.Instance;
            if (gameManager != null)
            {
                switch (reward.id)
                {
                    case "coins":
                        gameManager.AddCurrency("coins", reward.amount);
                        break;
                    case "gems":
                        gameManager.AddCurrency("gems", reward.amount);
                        break;
                    case "energy":
                        gameManager.AddCurrency("energy", reward.amount);
                        break;
                    case "booster":
                        gameManager.AddInventoryItem("booster_extra_moves", reward.amount);
                        break;
                }
            }
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
        public void OnPlayerAction(string playerId, string action, float value = 0f)
        {
            var profile = GetPlayerProfile(playerId);
            
            switch (action)
            {
                case "level_complete":
                    TriggerVariableReward(playerId, "coins");
                    break;
                case "combo_achieved":
                    if (value >= 5) TriggerVariableReward(playerId, "gems");
                    break;
                case "near_miss":
                    TriggerNearMiss(playerId, value);
                    break;
                case "purchase_made":
                    TrackInvestment(playerId, Mathf.RoundToInt(value), "coins");
                    break;
            }
        }
        
        public Dictionary<string, object> GetAddictionStatistics()
        {
            return new Dictionary<string, object>
            {
                {"total_players", _playerProfiles.Count},
                {"average_engagement", CalculateAverageEngagement()},
                {"variable_rewards_triggered", CalculateTotalVariableRewards()},
                {"near_misses_triggered", CalculateTotalNearMisses()},
                {"fomo_offers_active", CountActiveFOMOOffers()},
                {"total_investment", CalculateTotalInvestment()}
            };
        }
        
        private float CalculateAverageEngagement()
        {
            if (_playerProfiles.Count == 0) return 0f;
            
            float total = 0f;
            foreach (var profile in _playerProfiles.Values)
            {
                total += profile.engagementLevel;
            }
            return total / _playerProfiles.Count;
        }
        
        private int CalculateTotalVariableRewards()
        {
            int total = 0;
            foreach (var profile in _playerProfiles.Values)
            {
                total += profile.variableRewardCount;
            }
            return total;
        }
        
        private int CalculateTotalNearMisses()
        {
            int total = 0;
            foreach (var profile in _playerProfiles.Values)
            {
                total += profile.nearMissCount;
            }
            return total;
        }
        
        private int CountActiveFOMOOffers()
        {
            int count = 0;
            foreach (var offer in _fomoOffers.Values)
            {
                if (offer.isActive) count++;
            }
            return count;
        }
        
        private int CalculateTotalInvestment()
        {
            int total = 0;
            foreach (var profile in _playerProfiles.Values)
            {
                total += profile.totalInvestment;
            }
            return total;
        }
        #endregion
        
        void OnDestroy()
        {
            if (_socialProofCoroutine != null)
                StopCoroutine(_socialProofCoroutine);
            if (_fomoCoroutine != null)
                StopCoroutine(_fomoCoroutine);
            if (_dopamineCoroutine != null)
                StopCoroutine(_dopamineCoroutine);
                
            SavePlayerProfiles();
        }
    }
    
    // Data Classes
    [System.Serializable]
    public class PlayerAddictionProfile
    {
        public string playerId;
        public float engagementLevel;
        public int variableRewardCount;
        public int nearMissCount;
        public int totalInvestment;
        public int rewardStreak;
        public DateTime lastVariableReward;
        public DateTime lastNearMiss;
        public DateTime lastLogin;
    }
    
    [System.Serializable]
    public class VariableReward
    {
        public string id;
        public string name;
        public float baseChance;
        public float escalation;
        public int minReward;
        public int maxReward;
        public float streakBonus;
        public int amount;
        public string playerId;
        public DateTime timestamp;
    }
    
    [System.Serializable]
    public class NearMiss
    {
        public string playerId;
        public float progress;
        public float reward;
        public DateTime timestamp;
    }
    
    [System.Serializable]
    public class FOMOOffer
    {
        public string id;
        public string name;
        public string description;
        public int originalPrice;
        public int fomoPrice;
        public float duration;
        public float remainingTime;
        public bool isActive;
        public DateTime lastCreated;
    }
    
    [System.Serializable]
    public class SocialProof
    {
        public string message;
        public int playerCount;
        public DateTime timestamp;
    }
    
    [System.Serializable]
    public class DopamineHit
    {
        public string playerId;
        public string reason;
        public float intensity;
        public float duration;
        public DateTime timestamp;
    }
}