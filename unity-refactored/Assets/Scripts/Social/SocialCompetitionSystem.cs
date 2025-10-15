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
    /// Advanced Social Competition System with leaderboards, guilds, and social monetization
    /// Drives engagement and creates social pressure for monetization
    /// </summary>
    public class SocialCompetitionSystem : MonoBehaviour
    {
        [Header("Social Settings")]
        public bool enableSocialFeatures = true;
        public bool enableLeaderboards = true;
        public bool enableGuilds = true;
        public bool enableSocialChallenges = true;
        public bool enableFriendGifting = true;
        
        [Header("Leaderboard Settings")]
        public int leaderboardUpdateInterval = 300f; // 5 minutes
        public int maxLeaderboardEntries = 100;
        public LeaderboardType[] leaderboardTypes = new LeaderboardType[]
        {
            LeaderboardType.WeeklyScore,
            LeaderboardType.MonthlyScore,
            LeaderboardType.TotalCoins,
            LeaderboardType.TotalGems,
            LeaderboardType.LevelsCompleted
        };
        
        [Header("Guild Settings")]
        public int maxGuildMembers = 50;
        public int guildCreationCost = 1000; // coins
        public int guildUpgradeCost = 500; // gems
        public int maxGuildLevel = 10;
        
        [Header("Social Challenge Settings")]
        public int challengeDuration = 7; // days
        public int maxActiveChallenges = 3;
        public float challengeRewardMultiplier = 1.5f;
        
        private Dictionary<string, Leaderboard> _leaderboards = new Dictionary<string, Leaderboard>();
        private Dictionary<string, Guild> _guilds = new Dictionary<string, Guild>();
        private Dictionary<string, SocialChallenge> _activeChallenges = new Dictionary<string, SocialChallenge>();
        private Dictionary<string, PlayerSocialProfile> _playerProfiles = new Dictionary<string, PlayerSocialProfile>();
        private Dictionary<string, List<string>> _friendships = new Dictionary<string, List<string>>();
        
        private Coroutine _leaderboardUpdateCoroutine;
        private Coroutine _challengeUpdateCoroutine;
        
        // Events
        public static event Action<LeaderboardEntry> OnLeaderboardUpdated;
        public static event Action<Guild> OnGuildCreated;
        public static event Action<Guild> OnGuildJoined;
        public static event Action<SocialChallenge> OnChallengeStarted;
        public static event Action<SocialChallenge> OnChallengeCompleted;
        public static event Action<Gift> OnGiftSent;
        public static event Action<Gift> OnGiftReceived;
        
        public static SocialCompetitionSystem Instance { get; private set; }
        
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
            if (enableSocialFeatures)
            {
                InitializeLeaderboards();
                StartSocialSystems();
            }
        }
        
        private void InitializeSocialSystem()
        {
            Debug.Log("Social Competition System initialized - Engagement maximization mode activated!");
        }
        
        private void InitializeLeaderboards()
        {
            foreach (var type in leaderboardTypes)
            {
                _leaderboards[type.ToString()] = new Leaderboard
                {
                    type = type,
                    entries = new List<LeaderboardEntry>(),
                    lastUpdated = DateTime.Now
                };
            }
        }
        
        private void StartSocialSystems()
        {
            if (enableLeaderboards)
            {
                _leaderboardUpdateCoroutine = StartCoroutine(LeaderboardUpdateCoroutine());
            }
            
            if (enableSocialChallenges)
            {
                _challengeUpdateCoroutine = StartCoroutine(ChallengeUpdateCoroutine());
            }
        }
        
        private IEnumerator LeaderboardUpdateCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(leaderboardUpdateInterval);
                
                UpdateAllLeaderboards();
            }
        }
        
        private IEnumerator ChallengeUpdateCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(3600f); // 1 hour
                
                UpdateChallenges();
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
            var entries = GetLeaderboardEntries(leaderboard.type);
            leaderboard.entries = entries.OrderByDescending(e => e.score).Take(maxLeaderboardEntries).ToList();
            leaderboard.lastUpdated = DateTime.Now;
            
            // Notify players of leaderboard updates
            foreach (var entry in leaderboard.entries)
            {
                OnLeaderboardUpdated?.Invoke(entry);
            }
        }
        
        private List<LeaderboardEntry> GetLeaderboardEntries(LeaderboardType type)
        {
            var entries = new List<LeaderboardEntry>();
            
            foreach (var profile in _playerProfiles.Values)
            {
                var score = GetPlayerScore(profile, type);
                if (score > 0)
                {
                    entries.Add(new LeaderboardEntry
                    {
                        playerId = profile.playerId,
                        playerName = profile.playerName,
                        score = score,
                        rank = 0, // Will be set after sorting
                        lastUpdated = DateTime.Now
                    });
                }
            }
            
            return entries;
        }
        
        private int GetPlayerScore(PlayerSocialProfile profile, LeaderboardType type)
        {
            switch (type)
            {
                case LeaderboardType.WeeklyScore:
                    return profile.weeklyScore;
                case LeaderboardType.MonthlyScore:
                    return profile.monthlyScore;
                case LeaderboardType.TotalCoins:
                    return profile.totalCoins;
                case LeaderboardType.TotalGems:
                    return profile.totalGems;
                case LeaderboardType.LevelsCompleted:
                    return profile.levelsCompleted;
                default:
                    return 0;
            }
        }
        
        public bool CreateGuild(string playerId, string guildName, string description)
        {
            if (!enableGuilds) return false;
            
            var economyManager = EconomyManager.Instance;
            if (economyManager == null) return false;
            
            // Check if player has enough coins
            if (economyManager.GetCurrencyAmount("coins") < guildCreationCost)
                return false;
            
            // Spend coins
            if (!economyManager.SpendCurrency("coins", guildCreationCost))
                return false;
            
            var guild = new Guild
            {
                id = Guid.NewGuid().ToString(),
                name = guildName,
                description = description,
                leaderId = playerId,
                members = new List<string> { playerId },
                level = 1,
                experience = 0,
                maxMembers = maxGuildMembers,
                createdAt = DateTime.Now,
                isActive = true
            };
            
            _guilds[guild.id] = guild;
            
            // Add player to guild
            var profile = GetPlayerProfile(playerId);
            profile.guildId = guild.id;
            profile.guildRole = GuildRole.Leader;
            
            OnGuildCreated?.Invoke(guild);
            
            // Track analytics
            var analytics = AdvancedAnalyticsSystem.Instance;
            if (analytics != null)
            {
                analytics.TrackEvent("guild_created", new Dictionary<string, object>
                {
                    ["guild_id"] = guild.id,
                    ["guild_name"] = guildName,
                    ["cost"] = guildCreationCost
                });
            }
            
            return true;
        }
        
        public bool JoinGuild(string playerId, string guildId)
        {
            if (!_guilds.ContainsKey(guildId)) return false;
            
            var guild = _guilds[guildId];
            if (guild.members.Count >= guild.maxMembers) return false;
            
            guild.members.Add(playerId);
            
            var profile = GetPlayerProfile(playerId);
            profile.guildId = guildId;
            profile.guildRole = GuildRole.Member;
            
            OnGuildJoined?.Invoke(guild);
            
            // Track analytics
            var analytics = AdvancedAnalyticsSystem.Instance;
            if (analytics != null)
            {
                analytics.TrackEvent("guild_joined", new Dictionary<string, object>
                {
                    ["guild_id"] = guildId,
                    ["player_id"] = playerId
                });
            }
            
            return true;
        }
        
        public bool UpgradeGuild(string playerId, string guildId)
        {
            if (!_guilds.ContainsKey(guildId)) return false;
            
            var guild = _guilds[guildId];
            var profile = GetPlayerProfile(playerId);
            
            if (profile.guildRole != GuildRole.Leader) return false;
            if (guild.level >= maxGuildLevel) return false;
            
            var economyManager = EconomyManager.Instance;
            if (economyManager == null) return false;
            
            var upgradeCost = guildUpgradeCost * guild.level;
            if (economyManager.GetCurrencyAmount("gems") < upgradeCost)
                return false;
            
            if (!economyManager.SpendCurrency("gems", upgradeCost))
                return false;
            
            guild.level++;
            guild.maxMembers += 5; // Increase max members
            
            // Track analytics
            var analytics = AdvancedAnalyticsSystem.Instance;
            if (analytics != null)
            {
                analytics.TrackEvent("guild_upgraded", new Dictionary<string, object>
                {
                    ["guild_id"] = guildId,
                    ["new_level"] = guild.level,
                    ["cost"] = upgradeCost
                });
            }
            
            return true;
        }
        
        public bool StartSocialChallenge(string playerId, ChallengeType challengeType)
        {
            if (!enableSocialChallenges) return false;
            
            var activeChallenges = _activeChallenges.Values.Count(c => c.creatorId == playerId);
            if (activeChallenges >= maxActiveChallenges) return false;
            
            var challenge = new SocialChallenge
            {
                id = Guid.NewGuid().ToString(),
                type = challengeType,
                creatorId = playerId,
                participants = new List<string> { playerId },
                startTime = DateTime.Now,
                endTime = DateTime.Now.AddDays(challengeDuration),
                isActive = true,
                rewards = GenerateChallengeRewards(challengeType)
            };
            
            _activeChallenges[challenge.id] = challenge;
            
            OnChallengeStarted?.Invoke(challenge);
            
            // Track analytics
            var analytics = AdvancedAnalyticsSystem.Instance;
            if (analytics != null)
            {
                analytics.TrackEvent("social_challenge_started", new Dictionary<string, object>
                {
                    ["challenge_id"] = challenge.id,
                    ["challenge_type"] = challengeType.ToString(),
                    ["creator_id"] = playerId
                });
            }
            
            return true;
        }
        
        private Dictionary<string, int> GenerateChallengeRewards(ChallengeType challengeType)
        {
            var rewards = new Dictionary<string, int>();
            
            switch (challengeType)
            {
                case ChallengeType.ScoreCompetition:
                    rewards["coins"] = 1000;
                    rewards["gems"] = 50;
                    break;
                case ChallengeType.LevelRace:
                    rewards["coins"] = 500;
                    rewards["energy"] = 20;
                    break;
                case ChallengeType.CollectionChallenge:
                    rewards["gems"] = 100;
                    rewards["coins"] = 2000;
                    break;
            }
            
            return rewards;
        }
        
        public bool JoinChallenge(string playerId, string challengeId)
        {
            if (!_activeChallenges.ContainsKey(challengeId)) return false;
            
            var challenge = _activeChallenges[challengeId];
            if (challenge.participants.Contains(playerId)) return false;
            
            challenge.participants.Add(playerId);
            
            // Track analytics
            var analytics = AdvancedAnalyticsSystem.Instance;
            if (analytics != null)
            {
                analytics.TrackEvent("social_challenge_joined", new Dictionary<string, object>
                {
                    ["challenge_id"] = challengeId,
                    ["player_id"] = playerId
                });
            }
            
            return true;
        }
        
        public bool SendGift(string fromPlayerId, string toPlayerId, GiftType giftType, int quantity)
        {
            if (!enableFriendGifting) return false;
            
            // Check if players are friends
            if (!AreFriends(fromPlayerId, toPlayerId)) return false;
            
            var gift = new Gift
            {
                id = Guid.NewGuid().ToString(),
                fromPlayerId = fromPlayerId,
                toPlayerId = toPlayerId,
                type = giftType,
                quantity = quantity,
                sentAt = DateTime.Now,
                isReceived = false
            };
            
            // Process gift
            if (ProcessGift(gift))
            {
                OnGiftSent?.Invoke(gift);
                OnGiftReceived?.Invoke(gift);
                
                // Track analytics
                var analytics = AdvancedAnalyticsSystem.Instance;
                if (analytics != null)
                {
                    analytics.TrackEvent("gift_sent", new Dictionary<string, object>
                    {
                        ["gift_id"] = gift.id,
                        ["from_player"] = fromPlayerId,
                        ["to_player"] = toPlayerId,
                        ["gift_type"] = giftType.ToString(),
                        ["quantity"] = quantity
                    });
                }
                
                return true;
            }
            
            return false;
        }
        
        private bool ProcessGift(Gift gift)
        {
            var economyManager = EconomyManager.Instance;
            if (economyManager == null) return false;
            
            switch (gift.type)
            {
                case GiftType.Coins:
                    economyManager.AddCurrency("coins", gift.quantity);
                    break;
                case GiftType.Gems:
                    economyManager.AddCurrency("gems", gift.quantity);
                    break;
                case GiftType.Energy:
                    var energySystem = EnergySystem.Instance;
                    if (energySystem != null)
                    {
                        energySystem.AddEnergy(gift.quantity);
                    }
                    break;
            }
            
            gift.isReceived = true;
            return true;
        }
        
        public bool AddFriend(string playerId, string friendId)
        {
            if (!_friendships.ContainsKey(playerId))
                _friendships[playerId] = new List<string>();
            
            if (!_friendships[playerId].Contains(friendId))
            {
                _friendships[playerId].Add(friendId);
                
                // Add reverse friendship
                if (!_friendships.ContainsKey(friendId))
                    _friendships[friendId] = new List<string>();
                
                if (!_friendships[friendId].Contains(playerId))
                    _friendships[friendId].Add(playerId);
                
                return true;
            }
            
            return false;
        }
        
        public bool AreFriends(string playerId1, string playerId2)
        {
            return _friendships.ContainsKey(playerId1) && _friendships[playerId1].Contains(playerId2);
        }
        
        public List<LeaderboardEntry> GetLeaderboard(LeaderboardType type, int limit = 10)
        {
            if (!_leaderboards.ContainsKey(type.ToString())) return new List<LeaderboardEntry>();
            
            return _leaderboards[type.ToString()].entries.Take(limit).ToList();
        }
        
        public Guild GetGuild(string guildId)
        {
            return _guilds.ContainsKey(guildId) ? _guilds[guildId] : null;
        }
        
        public List<SocialChallenge> GetActiveChallenges()
        {
            return _activeChallenges.Values.Where(c => c.isActive).ToList();
        }
        
        public PlayerSocialProfile GetPlayerProfile(string playerId)
        {
            if (!_playerProfiles.ContainsKey(playerId))
            {
                _playerProfiles[playerId] = new PlayerSocialProfile
                {
                    playerId = playerId,
                    playerName = "Player_" + playerId.Substring(0, 8),
                    weeklyScore = 0,
                    monthlyScore = 0,
                    totalCoins = 0,
                    totalGems = 0,
                    levelsCompleted = 0,
                    guildId = "",
                    guildRole = GuildRole.None,
                    friends = new List<string>(),
                    challengesParticipated = 0,
                    giftsSent = 0,
                    giftsReceived = 0
                };
            }
            
            return _playerProfiles[playerId];
        }
        
        public void UpdatePlayerScore(string playerId, int score)
        {
            var profile = GetPlayerProfile(playerId);
            profile.weeklyScore += score;
            profile.monthlyScore += score;
        }
        
        public void UpdatePlayerStats(string playerId, int coins, int gems, int levels)
        {
            var profile = GetPlayerProfile(playerId);
            profile.totalCoins += coins;
            profile.totalGems += gems;
            profile.levelsCompleted += levels;
        }
        
        private void UpdateChallenges()
        {
            var expiredChallenges = new List<string>();
            
            foreach (var kvp in _activeChallenges)
            {
                var challenge = kvp.Value;
                if (challenge.endTime <= DateTime.Now)
                {
                    challenge.isActive = false;
                    expiredChallenges.Add(kvp.Key);
                    
                    OnChallengeCompleted?.Invoke(challenge);
                }
            }
            
            foreach (var challengeId in expiredChallenges)
            {
                _activeChallenges.Remove(challengeId);
            }
        }
        
        public Dictionary<string, object> GetSocialStatistics()
        {
            return new Dictionary<string, object>
            {
                ["total_guilds"] = _guilds.Count,
                ["active_challenges"] = _activeChallenges.Count,
                ["total_friendships"] = _friendships.Values.Sum(f => f.Count),
                ["leaderboards_updated"] = _leaderboards.Count,
                ["social_engagement"] = CalculateSocialEngagement()
            };
        }
        
        private float CalculateSocialEngagement()
        {
            var totalPlayers = _playerProfiles.Count;
            if (totalPlayers == 0) return 0f;
            
            var engagedPlayers = _playerProfiles.Values.Count(p => 
                !string.IsNullOrEmpty(p.guildId) || p.friends.Count > 0 || p.challengesParticipated > 0);
            
            return (float)engagedPlayers / totalPlayers;
        }
        
        void OnDestroy()
        {
            if (_leaderboardUpdateCoroutine != null)
                StopCoroutine(_leaderboardUpdateCoroutine);
            if (_challengeUpdateCoroutine != null)
                StopCoroutine(_challengeUpdateCoroutine);
        }
    }
    
    [System.Serializable]
    public class Leaderboard
    {
        public LeaderboardType type;
        public List<LeaderboardEntry> entries;
        public DateTime lastUpdated;
    }
    
    [System.Serializable]
    public class LeaderboardEntry
    {
        public string playerId;
        public string playerName;
        public int score;
        public int rank;
        public DateTime lastUpdated;
    }
    
    [System.Serializable]
    public class Guild
    {
        public string id;
        public string name;
        public string description;
        public string leaderId;
        public List<string> members;
        public int level;
        public int experience;
        public int maxMembers;
        public DateTime createdAt;
        public bool isActive;
    }
    
    [System.Serializable]
    public class SocialChallenge
    {
        public string id;
        public ChallengeType type;
        public string creatorId;
        public List<string> participants;
        public DateTime startTime;
        public DateTime endTime;
        public bool isActive;
        public Dictionary<string, int> rewards;
    }
    
    [System.Serializable]
    public class PlayerSocialProfile
    {
        public string playerId;
        public string playerName;
        public int weeklyScore;
        public int monthlyScore;
        public int totalCoins;
        public int totalGems;
        public int levelsCompleted;
        public string guildId;
        public GuildRole guildRole;
        public List<string> friends;
        public int challengesParticipated;
        public int giftsSent;
        public int giftsReceived;
    }
    
    [System.Serializable]
    public class Gift
    {
        public string id;
        public string fromPlayerId;
        public string toPlayerId;
        public GiftType type;
        public int quantity;
        public DateTime sentAt;
        public bool isReceived;
    }
    
    public enum LeaderboardType
    {
        WeeklyScore,
        MonthlyScore,
        TotalCoins,
        TotalGems,
        LevelsCompleted
    }
    
    public enum GuildRole
    {
        None,
        Member,
        Officer,
        Leader
    }
    
    public enum ChallengeType
    {
        ScoreCompetition,
        LevelRace,
        CollectionChallenge
    }
    
    public enum GiftType
    {
        Coins,
        Gems,
        Energy
    }
}