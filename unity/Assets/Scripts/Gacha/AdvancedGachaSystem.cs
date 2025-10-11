using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using Evergreen.Core;
using Evergreen.Analytics;

namespace Evergreen.Gacha
{
    /// <summary>
    /// Advanced gacha/loot box system with pity mechanics, rarity tiers, and psychological triggers
    /// Designed for maximum monetization and player engagement
    /// </summary>
    public class AdvancedGachaSystem : MonoBehaviour
    {
        [Header("Gacha Mechanics")]
        public bool enableGacha = true;
        public float baseRareChance = 0.05f;
        public float baseEpicChance = 0.02f;
        public float baseLegendaryChance = 0.01f;
        public int pitySystemThreshold = 90;
        public float pitySystemMultiplier = 2.0f;
        public int maxPityCount = 100;
        
        [Header("Rarity Tiers")]
        public GachaRarity[] rarities = {
            new GachaRarity { name = "Common", chance = 0.70f, color = Color.white, multiplier = 1.0f },
            new GachaRarity { name = "Uncommon", chance = 0.20f, color = Color.green, multiplier = 1.5f },
            new GachaRarity { name = "Rare", chance = 0.07f, color = Color.blue, multiplier = 2.0f },
            new GachaRarity { name = "Epic", chance = 0.025f, color = Color.magenta, multiplier = 3.0f },
            new GachaRarity { name = "Legendary", chance = 0.005f, color = Color.yellow, multiplier = 5.0f }
        };
        
        [Header("Gacha Boxes")]
        public GachaBox[] gachaBoxes = {
            new GachaBox { id = "basic", name = "Basic Box", price = 100, currency = "coins", maxPulls = 10 },
            new GachaBox { id = "premium", name = "Premium Box", price = 50, currency = "gems", maxPulls = 5 },
            new GachaBox { id = "exclusive", name = "Exclusive Box", price = 200, currency = "gems", maxPulls = 1 }
        };
        
        [Header("Psychological Triggers")]
        public bool enableNearMiss = true;
        public float nearMissChance = 0.3f;
        public bool enableGuaranteedRare = true;
        public int guaranteedRareThreshold = 50;
        public bool enableLuckyStreak = true;
        public int luckyStreakThreshold = 3;
        public float luckyStreakMultiplier = 1.5f;
        
        [Header("Visual Effects")]
        public float animationDuration = 3f;
        public float rareAnimationDuration = 5f;
        public float epicAnimationDuration = 7f;
        public float legendaryAnimationDuration = 10f;
        public AudioClip[] gachaSounds;
        public ParticleSystem[] rarityEffects;
        
        private Dictionary<string, PlayerGachaProfile> _playerProfiles = new Dictionary<string, PlayerGachaProfile>();
        private Dictionary<string, GachaBox> _gachaBoxes = new Dictionary<string, GachaBox>();
        private Dictionary<string, GachaItem> _gachaItems = new Dictionary<string, GachaItem>();
        private Dictionary<string, GachaSession> _gachaSessions = new Dictionary<string, GachaSession>();
        private Dictionary<string, GachaReward> _gachaRewards = new Dictionary<string, GachaReward>();
        
        private Coroutine _gachaAnimationCoroutine;
        private Coroutine _pitySystemCoroutine;
        
        // Events
        public System.Action<GachaReward> OnGachaRewardEarned;
        public System.Action<GachaSession> OnGachaSessionStarted;
        public System.Action<GachaSession> OnGachaSessionCompleted;
        public System.Action<GachaRarity> OnRarityAchieved;
        public System.Action<GachaPity> OnPityTriggered;
        
        public static AdvancedGachaSystem Instance { get; private set; }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeGachaSystem();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            StartGachaSystems();
        }
        
        private void InitializeGachaSystem()
        {
            Debug.Log("Advanced Gacha System initialized - Maximum engagement mode activated!");
            
            // Initialize gacha boxes
            InitializeGachaBoxes();
            
            // Initialize gacha items
            InitializeGachaItems();
            
            // Load player profiles
            LoadPlayerProfiles();
        }
        
        private void InitializeGachaBoxes()
        {
            foreach (var box in gachaBoxes)
            {
                _gachaBoxes[box.id] = box;
            }
        }
        
        private void InitializeGachaItems()
        {
            // Initialize gacha items for each rarity
            foreach (var rarity in rarities)
            {
                for (int i = 0; i < 10; i++)
                {
                    var item = new GachaItem
                    {
                        id = $"{rarity.name.ToLower()}_{i}",
                        name = $"{rarity.name} Item {i + 1}",
                        rarity = rarity.name,
                        description = $"A {rarity.name.ToLower()} item with special properties",
                        value = Mathf.RoundToInt(100 * rarity.multiplier),
                        iconPath = $"icons/{rarity.name.ToLower()}_{i}",
                        isExclusive = rarity.name == "Legendary"
                    };
                    
                    _gachaItems[item.id] = item;
                }
            }
        }
        
        private void StartGachaSystems()
        {
            if (enableGacha)
            {
                _pitySystemCoroutine = StartCoroutine(PitySystemCoroutine());
            }
        }
        
        #region Gacha Pulling
        public bool PullGacha(string playerId, string boxId, int pullCount = 1)
        {
            // Respect kid safe mode: disable gacha mechanics when enabled
            if (RemoteConfig.RemoteConfigManager.Instance != null &&
                RemoteConfig.RemoteConfigManager.Instance.GetBool("kid_safe_mode", true))
            {
                Debug.LogWarning("Gacha pulls are disabled in kid_safe_mode");
                return false;
            }
            if (!_gachaBoxes.ContainsKey(boxId))
                return false;
                
            var box = _gachaBoxes[boxId];
            var profile = GetPlayerProfile(playerId);
            
            // Check if player can afford the pull
            if (!CanAffordPull(playerId, box, pullCount))
                return false;
                
            // Deduct currency
            if (!DeductCurrency(playerId, box, pullCount))
                return false;
                
            // Create gacha session
            var session = new GachaSession
            {
                id = Guid.NewGuid().ToString(),
                playerId = playerId,
                boxId = boxId,
                pullCount = pullCount,
                startedAt = DateTime.Now,
                isActive = true
            };
            
            _gachaSessions[session.id] = session;
            OnGachaSessionStarted?.Invoke(session);
            
            // Start gacha animation
            StartCoroutine(PerformGachaPull(session));
            
            return true;
        }
        
        private IEnumerator PerformGachaPull(GachaSession session)
        {
            var profile = GetPlayerProfile(session.playerId);
            var box = _gachaBoxes[session.boxId];
            var rewards = new List<GachaReward>();
            
            for (int i = 0; i < session.pullCount; i++)
            {
                // Calculate rarity with pity system
                var rarity = CalculateRarity(profile, box);
                
                // Select item from rarity
                var item = SelectItemFromRarity(rarity);
                
                // Create reward
                var reward = new GachaReward
                {
                    id = Guid.NewGuid().ToString(),
                    playerId = session.playerId,
                    itemId = item.id,
                    item = item,
                    rarity = rarity,
                    sessionId = session.id,
                    pullNumber = i + 1,
                    earnedAt = DateTime.Now
                };
                
                rewards.Add(reward);
                
                // Update pity system
                UpdatePitySystem(profile, rarity);
                
                // Play animation
                yield return StartCoroutine(PlayGachaAnimation(reward));
                
                // Award reward
                AwardGachaReward(session.playerId, reward);
                
                OnGachaRewardEarned?.Invoke(reward);
            }
            
            // Complete session
            session.isActive = false;
            session.completedAt = DateTime.Now;
            session.rewards = rewards;
            
            OnGachaSessionCompleted?.Invoke(session);
        }
        
        private GachaRarity CalculateRarity(PlayerGachaProfile profile, GachaBox box)
        {
            // Check pity system
            if (profile.pityCount >= pitySystemThreshold)
            {
                // Guaranteed rare or better
                var rareRarities = rarities.Where(r => r.name == "Rare" || r.name == "Epic" || r.name == "Legendary").ToArray();
                return rareRarities[UnityEngine.Random.Range(0, rareRarities.Length)];
            }
            
            // Check guaranteed rare threshold
            if (enableGuaranteedRare && profile.pityCount >= guaranteedRareThreshold)
            {
                var rareRarities = rarities.Where(r => r.name == "Rare" || r.name == "Epic" || r.name == "Legendary").ToArray();
                return rareRarities[UnityEngine.Random.Range(0, rareRarities.Length)];
            }
            
            // Check lucky streak
            if (enableLuckyStreak && profile.luckyStreak >= luckyStreakThreshold)
            {
                // Increase chances for lucky streak
                var modifiedRarities = rarities.Select(r => new GachaRarity
                {
                    name = r.name,
                    chance = r.chance * luckyStreakMultiplier,
                    color = r.color,
                    multiplier = r.multiplier
                }).ToArray();
                
                return SelectRarityFromChances(modifiedRarities);
            }
            
            // Check near miss
            if (enableNearMiss && UnityEngine.Random.Range(0f, 1f) < nearMissChance)
            {
                // Show near miss animation
                ShowNearMissAnimation();
            }
            
            // Normal rarity calculation
            return SelectRarityFromChances(rarities);
        }
        
        private GachaRarity SelectRarityFromChances(GachaRarity[] rarities)
        {
            float totalChance = rarities.Sum(r => r.chance);
            float randomValue = UnityEngine.Random.Range(0f, totalChance);
            
            float currentChance = 0f;
            foreach (var rarity in rarities)
            {
                currentChance += rarity.chance;
                if (randomValue <= currentChance)
                {
                    return rarity;
                }
            }
            
            return rarities[rarities.Length - 1]; // Fallback to last rarity
        }
        
        private GachaItem SelectItemFromRarity(GachaRarity rarity)
        {
            var itemsOfRarity = _gachaItems.Values.Where(i => i.rarity == rarity.name).ToArray();
            return itemsOfRarity[UnityEngine.Random.Range(0, itemsOfRarity.Length)];
        }
        
        private void UpdatePitySystem(PlayerGachaProfile profile, GachaRarity rarity)
        {
            if (rarity.name == "Rare" || rarity.name == "Epic" || rarity.name == "Legendary")
            {
                // Reset pity count on rare or better
                profile.pityCount = 0;
                profile.luckyStreak++;
            }
            else
            {
                // Increase pity count on common/uncommon
                profile.pityCount++;
                profile.luckyStreak = 0;
            }
            
            // Check if pity system should trigger
            if (profile.pityCount >= pitySystemThreshold)
            {
                var pity = new GachaPity
                {
                    playerId = profile.playerId,
                    pityCount = profile.pityCount,
                    triggeredAt = DateTime.Now
                };
                
                OnPityTriggered?.Invoke(pity);
            }
        }
        #endregion
        
        #region Gacha Animation
        private IEnumerator PlayGachaAnimation(GachaReward reward)
        {
            var duration = GetAnimationDuration(reward.rarity);
            
            // Play sound
            PlayGachaSound(reward.rarity);
            
            // Show rarity effect
            ShowRarityEffect(reward.rarity);
            
            // Wait for animation duration
            yield return new WaitForSeconds(duration);
            
            // Show reward
            ShowGachaReward(reward);
        }
        
        private float GetAnimationDuration(GachaRarity rarity)
        {
            switch (rarity.name)
            {
                case "Common":
                case "Uncommon":
                    return animationDuration;
                case "Rare":
                    return rareAnimationDuration;
                case "Epic":
                    return epicAnimationDuration;
                case "Legendary":
                    return legendaryAnimationDuration;
                default:
                    return animationDuration;
            }
        }
        
        private void PlayGachaSound(GachaRarity rarity)
        {
            if (gachaSounds == null || gachaSounds.Length == 0)
                return;
                
            int soundIndex = 0;
            switch (rarity.name)
            {
                case "Common":
                    soundIndex = 0;
                    break;
                case "Uncommon":
                    soundIndex = 1;
                    break;
                case "Rare":
                    soundIndex = 2;
                    break;
                case "Epic":
                    soundIndex = 3;
                    break;
                case "Legendary":
                    soundIndex = 4;
                    break;
            }
            
            if (soundIndex < gachaSounds.Length)
            {
                AudioSource.PlayClipAtPoint(gachaSounds[soundIndex], Vector3.zero);
            }
        }
        
        private void ShowRarityEffect(GachaRarity rarity)
        {
            if (rarityEffects == null || rarityEffects.Length == 0)
                return;
                
            int effectIndex = 0;
            switch (rarity.name)
            {
                case "Common":
                    effectIndex = 0;
                    break;
                case "Uncommon":
                    effectIndex = 1;
                    break;
                case "Rare":
                    effectIndex = 2;
                    break;
                case "Epic":
                    effectIndex = 3;
                    break;
                case "Legendary":
                    effectIndex = 4;
                    break;
            }
            
            if (effectIndex < rarityEffects.Length)
            {
                rarityEffects[effectIndex].Play();
            }
        }
        
        private void ShowGachaReward(GachaReward reward)
        {
            var uiSystem = AdvancedUISystem.Instance;
            if (uiSystem != null)
            {
                var message = $"🎁 {reward.item.name} ({reward.rarity.name}) earned!";
                var notificationType = GetNotificationType(reward.rarity);
                uiSystem.ShowNotification(message, notificationType, 8f);
            }
        }
        
        private NotificationType GetNotificationType(GachaRarity rarity)
        {
            switch (rarity.name)
            {
                case "Common":
                case "Uncommon":
                    return NotificationType.Info;
                case "Rare":
                    return NotificationType.Success;
                case "Epic":
                    return NotificationType.Warning;
                case "Legendary":
                    return NotificationType.Error;
                default:
                    return NotificationType.Info;
            }
        }
        
        private void ShowNearMissAnimation()
        {
            var uiSystem = AdvancedUISystem.Instance;
            if (uiSystem != null)
            {
                uiSystem.ShowNotification("So close! Almost got a rare item!", NotificationType.Warning, 3f);
            }
        }
        #endregion
        
        #region Reward System
        private void AwardGachaReward(string playerId, GachaReward reward)
        {
            var gameManager = GameManager.Instance;
            if (gameManager == null) return;
            
            // Award the item based on type
            switch (reward.item.name.ToLower())
            {
                case var name when name.Contains("coin"):
                    gameManager.AddCurrency("coins", reward.item.value);
                    break;
                case var name when name.Contains("gem"):
                    gameManager.AddCurrency("gems", reward.item.value);
                    break;
                case var name when name.Contains("energy"):
                    gameManager.AddCurrency("energy", reward.item.value);
                    break;
                case var name when name.Contains("booster"):
                    gameManager.AddInventoryItem("booster_extra_moves", 1);
                    break;
                default:
                    // Default to coins
                    gameManager.AddCurrency("coins", reward.item.value);
                    break;
            }
            
            // Store reward
            _gachaRewards[reward.id] = reward;
        }
        #endregion
        
        #region Pity System
        private IEnumerator PitySystemCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(60f); // Check every minute
                
                UpdatePitySystem();
            }
        }
        
        private void UpdatePitySystem()
        {
            foreach (var profile in _playerProfiles.Values)
            {
                // Gradually increase pity count for inactive players
                if (DateTime.Now - profile.lastPull > TimeSpan.FromHours(1))
                {
                    profile.pityCount = Mathf.Min(profile.pityCount + 1, maxPityCount);
                }
            }
        }
        #endregion
        
        #region Currency Management
        private bool CanAffordPull(string playerId, GachaBox box, int pullCount)
        {
            var gameManager = GameManager.Instance;
            if (gameManager == null) return false;
            
            var totalCost = box.price * pullCount;
            var currentAmount = gameManager.GetCurrency(box.currency);
            
            return currentAmount >= totalCost;
        }
        
        private bool DeductCurrency(string playerId, GachaBox box, int pullCount)
        {
            var gameManager = GameManager.Instance;
            if (gameManager == null) return false;
            
            var totalCost = box.price * pullCount;
            return gameManager.SpendCurrency(box.currency, totalCost);
        }
        #endregion
        
        #region Player Profile Management
        private PlayerGachaProfile GetPlayerProfile(string playerId)
        {
            if (!_playerProfiles.ContainsKey(playerId))
            {
                _playerProfiles[playerId] = new PlayerGachaProfile
                {
                    playerId = playerId,
                    pityCount = 0,
                    luckyStreak = 0,
                    totalPulls = 0,
                    rarePulls = 0,
                    epicPulls = 0,
                    legendaryPulls = 0,
                    lastPull = DateTime.MinValue,
                    totalSpent = 0f
                };
            }
            
            return _playerProfiles[playerId];
        }
        
        public void OnGachaPull(string playerId, string boxId, int pullCount)
        {
            var profile = GetPlayerProfile(playerId);
            profile.totalPulls += pullCount;
            profile.lastPull = DateTime.Now;
            
            // Update spending
            var box = _gachaBoxes[boxId];
            profile.totalSpent += box.price * pullCount;
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
        public Dictionary<string, object> GetGachaStatistics()
        {
            return new Dictionary<string, object>
            {
                {"total_players", _playerProfiles.Count},
                {"total_pulls", _playerProfiles.Values.Sum(p => p.totalPulls)},
                {"total_spent", _playerProfiles.Values.Sum(p => p.totalSpent)},
                {"average_pulls_per_player", _playerProfiles.Values.Average(p => p.totalPulls)},
                {"rare_pulls", _playerProfiles.Values.Sum(p => p.rarePulls)},
                {"epic_pulls", _playerProfiles.Values.Sum(p => p.epicPulls)},
                {"legendary_pulls", _playerProfiles.Values.Sum(p => p.legendaryPulls)},
                {"players_with_pity", _playerProfiles.Values.Count(p => p.pityCount >= pitySystemThreshold)},
                {"average_pity_count", _playerProfiles.Values.Average(p => p.pityCount)}
            };
        }
        
        public List<GachaBox> GetAvailableBoxes(string playerId)
        {
            var profile = GetPlayerProfile(playerId);
            var availableBoxes = new List<GachaBox>();
            
            foreach (var box in _gachaBoxes.Values)
            {
                if (CanAffordPull(playerId, box, 1))
                {
                    availableBoxes.Add(box);
                }
            }
            
            return availableBoxes;
        }
        
        public List<GachaReward> GetPlayerRewards(string playerId)
        {
            return _gachaRewards.Values.Where(r => r.playerId == playerId).ToList();
        }
        #endregion
        
        void OnDestroy()
        {
            if (_pitySystemCoroutine != null)
                StopCoroutine(_pitySystemCoroutine);
                
            SavePlayerProfiles();
        }
    }
    
    // Data Classes
    [System.Serializable]
    public class GachaRarity
    {
        public string name;
        public float chance;
        public Color color;
        public float multiplier;
    }
    
    [System.Serializable]
    public class GachaBox
    {
        public string id;
        public string name;
        public int price;
        public string currency;
        public int maxPulls;
    }
    
    [System.Serializable]
    public class GachaItem
    {
        public string id;
        public string name;
        public string rarity;
        public string description;
        public int value;
        public string iconPath;
        public bool isExclusive;
    }
    
    [System.Serializable]
    public class GachaSession
    {
        public string id;
        public string playerId;
        public string boxId;
        public int pullCount;
        public DateTime startedAt;
        public DateTime completedAt;
        public bool isActive;
        public List<GachaReward> rewards;
    }
    
    [System.Serializable]
    public class GachaReward
    {
        public string id;
        public string playerId;
        public string itemId;
        public GachaItem item;
        public GachaRarity rarity;
        public string sessionId;
        public int pullNumber;
        public DateTime earnedAt;
    }
    
    [System.Serializable]
    public class GachaPity
    {
        public string playerId;
        public int pityCount;
        public DateTime triggeredAt;
    }
    
    [System.Serializable]
    public class PlayerGachaProfile
    {
        public string playerId;
        public int pityCount;
        public int luckyStreak;
        public int totalPulls;
        public int rarePulls;
        public int epicPulls;
        public int legendaryPulls;
        public DateTime lastPull;
        public float totalSpent;
    }
}