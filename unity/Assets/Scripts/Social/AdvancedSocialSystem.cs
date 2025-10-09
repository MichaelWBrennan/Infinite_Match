using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using Evergreen.Core;
using Evergreen.Analytics;

namespace Evergreen.Social
{
    /// <summary>
    /// Advanced social system with guilds, leaderboards, and viral mechanics
    /// Designed to maximize player retention and viral growth
    /// </summary>
    public class AdvancedSocialSystem : MonoBehaviour
    {
        [Header("Guild System")]
        public bool enableGuilds = true;
        public int maxGuildMembers = 50;
        public int maxGuilds = 1000;
        public int guildLevels = 20;
        public float guildXpPerLevel = 1000f;
        
        [Header("Leaderboard System")]
        public bool enableLeaderboards = true;
        public int leaderboardSize = 100;
        public float leaderboardUpdateInterval = 300f; // 5 minutes
        public string[] leaderboardTypes = { "coins", "gems", "levels", "combo", "guild" };
        
        [Header("Social Challenges")]
        public bool enableSocialChallenges = true;
        public int dailyChallengeCount = 3;
        public float challengeRewardMultiplier = 1.5f;
        public int challengeDuration = 24; // hours
        
        [Header("Gift System")]
        public bool enableGiftSystem = true;
        public int maxGiftsPerDay = 5;
        public int maxGiftValue = 100;
        public float giftCooldown = 3600f; // 1 hour
        
        [Header("Viral Mechanics")]
        public bool enableViralMechanics = true;
        public float viralShareChance = 0.3f;
        public string[] viralMessages = {
            "I just got a 50x combo! Can you beat that?",
            "I reached level 100! How far can you go?",
            "I found a rare item! Check out this game!",
            "I'm in the top 10! Can you catch me?",
            "My guild is #1! Join us and compete!"
        };
        
        [Header("Social Proof")]
        public bool enableSocialProof = true;
        public float socialProofUpdateInterval = 30f;
        public int fakePlayerCount = 5000;
        public string[] socialProofActions = {
            "just completed level",
            "earned a rare item",
            "achieved a high score",
            "joined a guild",
            "sent a gift"
        };
        
        private Dictionary<string, Guild> _guilds = new Dictionary<string, Guild>();
        private Dictionary<string, PlayerSocialProfile> _playerProfiles = new Dictionary<string, PlayerSocialProfile>();
        private Dictionary<string, Leaderboard> _leaderboards = new Dictionary<string, Leaderboard>();
        private Dictionary<string, SocialChallenge> _socialChallenges = new Dictionary<string, SocialChallenge>();
        private Dictionary<string, Gift> _gifts = new Dictionary<string, Gift>();
        private Dictionary<string, SocialProof> _socialProofs = new Dictionary<string, SocialProof>();
        
        private Coroutine _leaderboardUpdateCoroutine;
        private Coroutine _socialProofCoroutine;
        private Coroutine _challengeUpdateCoroutine;
        private Coroutine _giftUpdateCoroutine;
        
        // Events
        public System.Action<Guild> OnGuildCreated;
        public System.Action<Guild> OnGuildJoined;
        public System.Action<Leaderboard> OnLeaderboardUpdated;
        public System.Action<SocialChallenge> OnChallengeCompleted;
        public System.Action<Gift> OnGiftSent;
        public System.Action<Gift> OnGiftReceived;
        public System.Action<SocialProof> OnSocialProofShown;
        
        public static AdvancedSocialSystem Instance { get; private set; }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeSocialSystem();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            StartSocialSystems();
        }
        
        private void InitializeSocialSystem()
        {
            Debug.Log("Advanced Social System initialized - Maximum engagement mode activated!");
            
            // Initialize leaderboards
            InitializeLeaderboards();
            
            // Initialize social challenges
            InitializeSocialChallenges();
            
            // Initialize social proof
            InitializeSocialProof();
            
            // Load player profiles
            LoadPlayerProfiles();
        }
        
        private void InitializeLeaderboards()
        {
            foreach (var type in leaderboardTypes)
            {
                _leaderboards[type] = new Leaderboard
                {
                    type = type,
                    entries = new List<LeaderboardEntry>(),
                    lastUpdated = DateTime.Now
                };
            }
        }
        
        private void InitializeSocialChallenges()
        {
            // Create daily social challenges
            for (int i = 0; i < dailyChallengeCount; i++)
            {
                var challenge = new SocialChallenge
                {
                    id = Guid.NewGuid().ToString(),
                    name = $"Daily Challenge {i + 1}",
                    description = GenerateChallengeDescription(i),
                    type = GetChallengeType(i),
                    target = GetChallengeTarget(i),
                    reward = GetChallengeReward(i),
                    duration = challengeDuration,
                    isActive = true,
                    createdAt = DateTime.Now
                };
                
                _socialChallenges[challenge.id] = challenge;
            }
        }
        
        private void InitializeSocialProof()
        {
            // Initialize social proof messages
            for (int i = 0; i < 10; i++)
            {
                var socialProof = new SocialProof
                {
                    id = Guid.NewGuid().ToString(),
                    playerName = GenerateRandomName(),
                    action = socialProofActions[UnityEngine.Random.Range(0, socialProofActions.Length)],
                    value = UnityEngine.Random.Range(1, 100),
                    timestamp = DateTime.Now
                };
                
                _socialProofs[socialProof.id] = socialProof;
            }
        }
        
        private void StartSocialSystems()
        {
            if (enableLeaderboards)
            {
                _leaderboardUpdateCoroutine = StartCoroutine(LeaderboardUpdateCoroutine());
            }
            
            if (enableSocialProof)
            {
                _socialProofCoroutine = StartCoroutine(SocialProofCoroutine());
            }
            
            if (enableSocialChallenges)
            {
                _challengeUpdateCoroutine = StartCoroutine(ChallengeUpdateCoroutine());
            }
            
            if (enableGiftSystem)
            {
                _giftUpdateCoroutine = StartCoroutine(GiftUpdateCoroutine());
            }
        }
        
        #region Guild System
        public bool CreateGuild(string playerId, string guildName, string description = "")
        {
            if (_guilds.Count >= maxGuilds)
                return false;
                
            var guild = new Guild
            {
                id = Guid.NewGuid().ToString(),
                name = guildName,
                description = description,
                leaderId = playerId,
                members = new List<string> { playerId },
                level = 1,
                xp = 0,
                maxMembers = maxGuildMembers,
                createdAt = DateTime.Now,
                isActive = true
            };
            
            _guilds[guild.id] = guild;
            
            // Update player profile
            var profile = GetPlayerProfile(playerId);
            profile.guildId = guild.id;
            profile.guildRole = "Leader";
            
            OnGuildCreated?.Invoke(guild);
            
            return true;
        }
        
        public bool JoinGuild(string playerId, string guildId)
        {
            if (!_guilds.ContainsKey(guildId))
                return false;
                
            var guild = _guilds[guildId];
            if (guild.members.Count >= guild.maxMembers)
                return false;
                
            guild.members.Add(playerId);
            
            // Update player profile
            var profile = GetPlayerProfile(playerId);
            profile.guildId = guildId;
            profile.guildRole = "Member";
            
            OnGuildJoined?.Invoke(guild);
            
            return true;
        }
        
        public void LeaveGuild(string playerId)
        {
            var profile = GetPlayerProfile(playerId);
            if (string.IsNullOrEmpty(profile.guildId))
                return;
                
            var guild = _guilds[profile.guildId];
            guild.members.Remove(playerId);
            
            profile.guildId = "";
            profile.guildRole = "";
        }
        
        public void AddGuildXP(string guildId, int xp)
        {
            if (!_guilds.ContainsKey(guildId))
                return;
                
            var guild = _guilds[guildId];
            guild.xp += xp;
            
            // Check for level up
            int newLevel = Mathf.FloorToInt(guild.xp / guildXpPerLevel) + 1;
            if (newLevel > guild.level)
            {
                guild.level = newLevel;
                guild.maxMembers = Mathf.Min(maxGuildMembers, 20 + (guild.level * 2));
                
                // Notify guild members
                NotifyGuildLevelUp(guild);
            }
        }
        
        private void NotifyGuildLevelUp(Guild guild)
        {
            var uiSystem = AdvancedUISystem.Instance;
            if (uiSystem != null)
            {
                var message = $"🎉 {guild.name} reached level {guild.level}! Max members increased to {guild.maxMembers}!";
                uiSystem.ShowNotification(message, NotificationType.Success, 8f);
            }
        }
        #endregion
        
        #region Leaderboard System
        private IEnumerator LeaderboardUpdateCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(leaderboardUpdateInterval);
                
                UpdateAllLeaderboards();
            }
        }
        
        private void UpdateAllLeaderboards()
        {
            foreach (var leaderboard in _leaderboards.Values)
            {
                UpdateLeaderboard(leaderboard);
            }
        }
        
        private void UpdateLeaderboard(Leaderboard leaderboard)
        {
            var entries = new List<LeaderboardEntry>();
            
            // Get top players for this leaderboard type
            var topPlayers = GetTopPlayers(leaderboard.type, leaderboardSize);
            
            for (int i = 0; i < topPlayers.Count; i++)
            {
                var entry = new LeaderboardEntry
                {
                    rank = i + 1,
                    playerId = topPlayers[i].playerId,
                    playerName = topPlayers[i].playerName,
                    value = topPlayers[i].value,
                    isCurrentPlayer = false // This would be set based on current player
                };
                
                entries.Add(entry);
            }
            
            leaderboard.entries = entries;
            leaderboard.lastUpdated = DateTime.Now;
            
            OnLeaderboardUpdated?.Invoke(leaderboard);
        }
        
        private List<LeaderboardPlayer> GetTopPlayers(string type, int count)
        {
            var players = new List<LeaderboardPlayer>();
            
            // This would get actual player data from your systems
            // For now, generate fake data
            for (int i = 0; i < count; i++)
            {
                players.Add(new LeaderboardPlayer
                {
                    playerId = $"player_{i}",
                    playerName = GenerateRandomName(),
                    value = UnityEngine.Random.Range(100, 10000)
                });
            }
            
            return players.OrderByDescending(p => p.value).Take(count).ToList();
        }
        
        public Leaderboard GetLeaderboard(string type)
        {
            return _leaderboards.ContainsKey(type) ? _leaderboards[type] : null;
        }
        #endregion
        
        #region Social Challenges
        private IEnumerator ChallengeUpdateCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(3600f); // Check every hour
                
                UpdateSocialChallenges();
            }
        }
        
        private void UpdateSocialChallenges()
        {
            foreach (var challenge in _socialChallenges.Values)
            {
                if (challenge.isActive && DateTime.Now > challenge.createdAt.AddHours(challenge.duration))
                {
                    challenge.isActive = false;
                    // Create new challenge
                    CreateNewChallenge(challenge);
                }
            }
        }
        
        private void CreateNewChallenge(SocialChallenge oldChallenge)
        {
            var challenge = new SocialChallenge
            {
                id = Guid.NewGuid().ToString(),
                name = oldChallenge.name,
                description = GenerateChallengeDescription(UnityEngine.Random.Range(0, 3)),
                type = GetChallengeType(UnityEngine.Random.Range(0, 3)),
                target = GetChallengeTarget(UnityEngine.Random.Range(0, 3)),
                reward = GetChallengeReward(UnityEngine.Random.Range(0, 3)),
                duration = challengeDuration,
                isActive = true,
                createdAt = DateTime.Now
            };
            
            _socialChallenges[challenge.id] = challenge;
        }
        
        public void CompleteChallenge(string playerId, string challengeId, int value)
        {
            if (!_socialChallenges.ContainsKey(challengeId))
                return;
                
            var challenge = _socialChallenges[challengeId];
            if (!challenge.isActive || value < challenge.target)
                return;
                
            // Award reward
            AwardChallengeReward(playerId, challenge);
            
            // Mark as completed
            challenge.isActive = false;
            
            OnChallengeCompleted?.Invoke(challenge);
            
            // Show completion notification
            ShowChallengeCompletion(challenge);
        }
        
        private void AwardChallengeReward(string playerId, SocialChallenge challenge)
        {
            var gameManager = GameManager.Instance;
            if (gameManager == null) return;
            
            var reward = Mathf.RoundToInt(challenge.reward * challengeRewardMultiplier);
            
            switch (challenge.type)
            {
                case "coins":
                    gameManager.AddCurrency("coins", reward);
                    break;
                case "gems":
                    gameManager.AddCurrency("gems", reward);
                    break;
                case "energy":
                    gameManager.AddCurrency("energy", reward);
                    break;
            }
        }
        
        private void ShowChallengeCompletion(SocialChallenge challenge)
        {
            var uiSystem = AdvancedUISystem.Instance;
            if (uiSystem != null)
            {
                var message = $"🎯 Challenge completed! {challenge.name} - +{challenge.reward} {challenge.type}!";
                uiSystem.ShowNotification(message, NotificationType.Success, 5f);
            }
        }
        #endregion
        
        #region Gift System
        private IEnumerator GiftUpdateCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(60f); // Check every minute
                
                ProcessGifts();
            }
        }
        
        private void ProcessGifts()
        {
            // Process pending gifts
            foreach (var gift in _gifts.Values)
            {
                if (gift.isPending && DateTime.Now > gift.sentAt.AddSeconds(giftCooldown))
                {
                    gift.isPending = false;
                    gift.isReceived = true;
                    
                    // Award gift to recipient
                    AwardGift(gift);
                    
                    OnGiftReceived?.Invoke(gift);
                }
            }
        }
        
        public bool SendGift(string senderId, string recipientId, string itemType, int amount)
        {
            var senderProfile = GetPlayerProfile(senderId);
            if (senderProfile.giftsSentToday >= maxGiftsPerDay)
                return false;
                
            if (amount > maxGiftValue)
                return false;
                
            var gift = new Gift
            {
                id = Guid.NewGuid().ToString(),
                senderId = senderId,
                recipientId = recipientId,
                itemType = itemType,
                amount = amount,
                sentAt = DateTime.Now,
                isPending = true,
                isReceived = false
            };
            
            _gifts[gift.id] = gift;
            senderProfile.giftsSentToday++;
            
            OnGiftSent?.Invoke(gift);
            
            return true;
        }
        
        private void AwardGift(Gift gift)
        {
            var gameManager = GameManager.Instance;
            if (gameManager == null) return;
            
            switch (gift.itemType)
            {
                case "coins":
                    gameManager.AddCurrency("coins", gift.amount);
                    break;
                case "gems":
                    gameManager.AddCurrency("gems", gift.amount);
                    break;
                case "energy":
                    gameManager.AddCurrency("energy", gift.amount);
                    break;
            }
        }
        #endregion
        
        #region Viral Mechanics
        public void TriggerViralShare(string playerId, string action, int value)
        {
            if (!enableViralMechanics)
                return;
                
            if (UnityEngine.Random.Range(0f, 1f) < viralShareChance)
            {
                var message = GenerateViralMessage(action, value);
                ShowViralSharePrompt(playerId, message);
            }
        }
        
        private string GenerateViralMessage(string action, int value)
        {
            var baseMessage = viralMessages[UnityEngine.Random.Range(0, viralMessages.Length)];
            return baseMessage.Replace("{value}", value.ToString());
        }
        
        private void ShowViralSharePrompt(string playerId, string message)
        {
            var uiSystem = AdvancedUISystem.Instance;
            if (uiSystem != null)
            {
                uiSystem.ShowNotification($"Share your achievement: {message}", NotificationType.Info, 10f);
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
            var socialProof = _socialProofs.Values.OrderBy(s => s.timestamp).First();
            socialProof.timestamp = DateTime.Now;
            
            OnSocialProofShown?.Invoke(socialProof);
            
            // Show social proof UI
            var uiSystem = AdvancedUISystem.Instance;
            if (uiSystem != null)
            {
                var message = $"{socialProof.playerName} {socialProof.action} {socialProof.value}!";
                uiSystem.ShowNotification(message, NotificationType.Info, 5f);
            }
        }
        #endregion
        
        #region Helper Methods
        private string GenerateChallengeDescription(int index)
        {
            var descriptions = new[]
            {
                "Complete 5 levels in a row",
                "Achieve a 10x combo",
                "Earn 1000 coins",
                "Use 3 boosters in one level"
            };
            return descriptions[index % descriptions.Length];
        }
        
        private string GetChallengeType(int index)
        {
            var types = new[] { "coins", "gems", "energy", "combo" };
            return types[index % types.Length];
        }
        
        private int GetChallengeTarget(int index)
        {
            var targets = new[] { 5, 10, 1000, 3 };
            return targets[index % targets.Length];
        }
        
        private int GetChallengeReward(int index)
        {
            var rewards = new[] { 100, 50, 10, 5 };
            return rewards[index % rewards.Length];
        }
        
        private string GenerateRandomName()
        {
            var names = new[]
            {
                "Player", "Gamer", "Pro", "Master", "Champion", "Hero", "Legend", "Star", "Ace", "Boss"
            };
            var numbers = new[] { "123", "456", "789", "007", "999", "111", "222", "333", "444", "555" };
            
            return names[UnityEngine.Random.Range(0, names.Length)] + numbers[UnityEngine.Random.Range(0, numbers.Length)];
        }
        #endregion
        
        #region Player Profile Management
        private PlayerSocialProfile GetPlayerProfile(string playerId)
        {
            if (!_playerProfiles.ContainsKey(playerId))
            {
                _playerProfiles[playerId] = new PlayerSocialProfile
                {
                    playerId = playerId,
                    guildId = "",
                    guildRole = "",
                    friends = new List<string>(),
                    giftsSentToday = 0,
                    giftsReceivedToday = 0,
                    lastGiftSent = DateTime.MinValue,
                    lastGiftReceived = DateTime.MinValue,
                    socialScore = 0,
                    lastSocialActivity = DateTime.Now
                };
            }
            
            return _playerProfiles[playerId];
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
        public Dictionary<string, object> GetSocialStatistics()
        {
            return new Dictionary<string, object>
            {
                {"total_guilds", _guilds.Count},
                {"total_players", _playerProfiles.Count},
                {"active_challenges", _socialChallenges.Values.Count(c => c.isActive)},
                {"gifts_sent_today", _gifts.Values.Count(g => g.sentAt.Date == DateTime.Today)},
                {"gifts_received_today", _gifts.Values.Count(g => g.isReceived && g.sentAt.Date == DateTime.Today)},
                {"average_guild_size", _guilds.Values.Average(g => g.members.Count)},
                {"leaderboard_updates", _leaderboards.Values.Sum(l => l.entries.Count)}
            };
        }
        #endregion
        
        void OnDestroy()
        {
            if (_leaderboardUpdateCoroutine != null)
                StopCoroutine(_leaderboardUpdateCoroutine);
            if (_socialProofCoroutine != null)
                StopCoroutine(_socialProofCoroutine);
            if (_challengeUpdateCoroutine != null)
                StopCoroutine(_challengeUpdateCoroutine);
            if (_giftUpdateCoroutine != null)
                StopCoroutine(_giftUpdateCoroutine);
                
            SavePlayerProfiles();
        }
    }
    
    // Data Classes
    [System.Serializable]
    public class Guild
    {
        public string id;
        public string name;
        public string description;
        public string leaderId;
        public List<string> members;
        public int level;
        public int xp;
        public int maxMembers;
        public DateTime createdAt;
        public bool isActive;
    }
    
    [System.Serializable]
    public class PlayerSocialProfile
    {
        public string playerId;
        public string guildId;
        public string guildRole;
        public List<string> friends;
        public int giftsSentToday;
        public int giftsReceivedToday;
        public DateTime lastGiftSent;
        public DateTime lastGiftReceived;
        public int socialScore;
        public DateTime lastSocialActivity;
    }
    
    [System.Serializable]
    public class Leaderboard
    {
        public string type;
        public List<LeaderboardEntry> entries;
        public DateTime lastUpdated;
    }
    
    [System.Serializable]
    public class LeaderboardEntry
    {
        public int rank;
        public string playerId;
        public string playerName;
        public int value;
        public bool isCurrentPlayer;
    }
    
    [System.Serializable]
    public class LeaderboardPlayer
    {
        public string playerId;
        public string playerName;
        public int value;
    }
    
    [System.Serializable]
    public class SocialChallenge
    {
        public string id;
        public string name;
        public string description;
        public string type;
        public int target;
        public int reward;
        public int duration;
        public bool isActive;
        public DateTime createdAt;
    }
    
    [System.Serializable]
    public class Gift
    {
        public string id;
        public string senderId;
        public string recipientId;
        public string itemType;
        public int amount;
        public DateTime sentAt;
        public bool isPending;
        public bool isReceived;
    }
    
    [System.Serializable]
    public class SocialProof
    {
        public string id;
        public string playerName;
        public string action;
        public int value;
        public DateTime timestamp;
    }
}