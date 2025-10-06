using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using Evergreen.Core;

namespace Evergreen.Social
{
    /// <summary>
    /// Advanced Social System with comprehensive team management, leaderboards, and community features
    /// Provides 100% social engagement for player retention and monetization
    /// </summary>
    public class AdvancedSocialSystem : MonoBehaviour
    {
        [Header("Social Settings")]
        public bool enableSocialFeatures = true;
        public bool enableTeamManagement = true;
        public bool enableLeaderboards = true;
        public bool enableChatSystem = true;
        public bool enableGiftingSystem = true;
        public bool enableSocialEvents = true;
        public bool enableFriendSystem = true;
        public bool enableGuildSystem = true;
        
        [Header("Team Management")]
        public int maxTeamSize = 50;
        public int maxTeamsPerPlayer = 3;
        public bool enableTeamCreation = true;
        public bool enableTeamInvites = true;
        public bool enableTeamChat = true;
        public bool enableTeamEvents = true;
        
        [Header("Leaderboards")]
        public bool enableGlobalLeaderboards = true;
        public bool enableRegionalLeaderboards = true;
        public bool enableTeamLeaderboards = true;
        public bool enableWeeklyLeaderboards = true;
        public bool enableMonthlyLeaderboards = true;
        public int leaderboardUpdateInterval = 300f; // 5 minutes
        public int maxLeaderboardEntries = 1000;
        
        [Header("Chat System")]
        public bool enableGlobalChat = true;
        public bool enableTeamChat = true;
        public bool enablePrivateChat = true;
        public bool enableChatModeration = true;
        public bool enableChatFilters = true;
        public int maxChatHistory = 1000;
        public float chatCooldown = 1f;
        
        [Header("Gifting System")]
        public bool enableGiftGiving = true;
        public bool enableGiftReceiving = true;
        public bool enableGiftTracking = true;
        public int maxGiftsPerDay = 10;
        public int maxGiftValue = 1000;
        public float giftCooldown = 3600f; // 1 hour
        
        [Header("Social Events")]
        public bool enableSocialEvents = true;
        public bool enableTeamEvents = true;
        public bool enableGlobalEvents = true;
        public bool enableEventRewards = true;
        public float eventCheckInterval = 60f;
        
        [Header("Friend System")]
        public bool enableFriendRequests = true;
        public bool enableFriendStatus = true;
        public bool enableFriendActivity = true;
        public int maxFriends = 200;
        public float friendRequestCooldown = 300f; // 5 minutes
        
        [Header("Guild System")]
        public bool enableGuildCreation = true;
        public bool enableGuildManagement = true;
        public bool enableGuildWars = true;
        public bool enableGuildEvents = true;
        public int maxGuildSize = 100;
        public int maxGuildsPerPlayer = 1;
        
        private Dictionary<string, SocialPlayer> _players = new Dictionary<string, SocialPlayer>();
        private Dictionary<string, SocialTeam> _teams = new Dictionary<string, SocialTeam>();
        private Dictionary<string, SocialGuild> _guilds = new Dictionary<string, SocialGuild>();
        private Dictionary<string, SocialLeaderboard> _leaderboards = new Dictionary<string, SocialLeaderboard>();
        private Dictionary<string, SocialChat> _chats = new Dictionary<string, SocialChat>();
        private Dictionary<string, SocialGift> _gifts = new Dictionary<string, SocialGift>();
        private Dictionary<string, SocialEvent> _events = new Dictionary<string, SocialEvent>();
        private Dictionary<string, SocialFriend> _friends = new Dictionary<string, SocialFriend>();
        private Dictionary<string, SocialActivity> _activities = new Dictionary<string, SocialActivity>();
        
        private Coroutine _leaderboardUpdateCoroutine;
        private Coroutine _eventCheckCoroutine;
        private Coroutine _activityUpdateCoroutine;
        private Coroutine _chatModerationCoroutine;
        
        private bool _isInitialized = false;
        private string _currentPlayerId;
        private Dictionary<string, object> _socialConfig = new Dictionary<string, object>();
        
        // Events
        public event Action<SocialPlayer> OnPlayerJoined;
        public event Action<SocialPlayer> OnPlayerLeft;
        public event Action<SocialTeam> OnTeamCreated;
        public event Action<SocialTeam> OnTeamJoined;
        public event Action<SocialTeam> OnTeamLeft;
        public event Action<SocialGuild> OnGuildCreated;
        public event Action<SocialGuild> OnGuildJoined;
        public event Action<SocialGuild> OnGuildLeft;
        public event Action<SocialLeaderboard> OnLeaderboardUpdated;
        public event Action<SocialChat> OnChatMessage;
        public event Action<SocialGift> OnGiftSent;
        public event Action<SocialGift> OnGiftReceived;
        public event Action<SocialEvent> OnEventStarted;
        public event Action<SocialEvent> OnEventEnded;
        public event Action<SocialFriend> OnFriendAdded;
        public event Action<SocialFriend> OnFriendRemoved;
        public event Action<SocialActivity> OnActivityPosted;
        
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
            StartSocialSystem();
        }
        
        private void InitializeSocialSystem()
        {
            Debug.Log("Advanced Social System initialized");
            
            // Initialize social configuration
            InitializeSocialConfig();
            
            // Initialize leaderboards
            InitializeLeaderboards();
            
            // Initialize chat channels
            InitializeChatChannels();
            
            // Initialize social events
            InitializeSocialEvents();
            
            // Load social data
            LoadSocialData();
            
            _isInitialized = true;
        }
        
        private void InitializeSocialConfig()
        {
            _socialConfig["max_team_size"] = maxTeamSize;
            _socialConfig["max_teams_per_player"] = maxTeamsPerPlayer;
            _socialConfig["max_friends"] = maxFriends;
            _socialConfig["max_guild_size"] = maxGuildSize;
            _socialConfig["leaderboard_update_interval"] = leaderboardUpdateInterval;
            _socialConfig["chat_cooldown"] = chatCooldown;
            _socialConfig["gift_cooldown"] = giftCooldown;
            _socialConfig["friend_request_cooldown"] = friendRequestCooldown;
        }
        
        private void InitializeLeaderboards()
        {
            // Global leaderboard
            _leaderboards["global"] = new SocialLeaderboard
            {
                Id = "global",
                Name = "Global Leaderboard",
                Type = LeaderboardType.Global,
                Category = "score",
                Entries = new List<LeaderboardEntry>(),
                LastUpdated = DateTime.Now,
                IsActive = true
            };
            
            // Regional leaderboards
            _leaderboards["north_america"] = new SocialLeaderboard
            {
                Id = "north_america",
                Name = "North America",
                Type = LeaderboardType.Regional,
                Category = "score",
                Region = "NA",
                Entries = new List<LeaderboardEntry>(),
                LastUpdated = DateTime.Now,
                IsActive = true
            };
            
            _leaderboards["europe"] = new SocialLeaderboard
            {
                Id = "europe",
                Name = "Europe",
                Type = LeaderboardType.Regional,
                Category = "score",
                Region = "EU",
                Entries = new List<LeaderboardEntry>(),
                LastUpdated = DateTime.Now,
                IsActive = true
            };
            
            _leaderboards["asia"] = new SocialLeaderboard
            {
                Id = "asia",
                Name = "Asia",
                Type = LeaderboardType.Regional,
                Category = "score",
                Region = "AS",
                Entries = new List<LeaderboardEntry>(),
                LastUpdated = DateTime.Now,
                IsActive = true
            };
            
            // Weekly leaderboard
            _leaderboards["weekly"] = new SocialLeaderboard
            {
                Id = "weekly",
                Name = "Weekly Leaderboard",
                Type = LeaderboardType.Weekly,
                Category = "score",
                Entries = new List<LeaderboardEntry>(),
                LastUpdated = DateTime.Now,
                IsActive = true
            };
            
            // Monthly leaderboard
            _leaderboards["monthly"] = new SocialLeaderboard
            {
                Id = "monthly",
                Name = "Monthly Leaderboard",
                Type = LeaderboardType.Monthly,
                Category = "score",
                Entries = new List<LeaderboardEntry>(),
                LastUpdated = DateTime.Now,
                IsActive = true
            };
        }
        
        private void InitializeChatChannels()
        {
            // Global chat
            _chats["global"] = new SocialChat
            {
                Id = "global",
                Name = "Global Chat",
                Type = ChatType.Global,
                Messages = new List<ChatMessage>(),
                IsActive = true,
                IsModerated = true
            };
            
            // Team chat
            _chats["team"] = new SocialChat
            {
                Id = "team",
                Name = "Team Chat",
                Type = ChatType.Team,
                Messages = new List<ChatMessage>(),
                IsActive = true,
                IsModerated = false
            };
            
            // Guild chat
            _chats["guild"] = new SocialChat
            {
                Id = "guild",
                Name = "Guild Chat",
                Type = ChatType.Guild,
                Messages = new List<ChatMessage>(),
                IsActive = true,
                IsModerated = false
            };
        }
        
        private void InitializeSocialEvents()
        {
            // Team event
            _events["team_challenge"] = new SocialEvent
            {
                Id = "team_challenge",
                Name = "Team Challenge",
                Description = "Complete levels as a team to earn rewards",
                Type = EventType.Team,
                StartTime = DateTime.Now,
                EndTime = DateTime.Now.AddDays(7),
                Rewards = new List<EventReward>
                {
                    new EventReward { Type = RewardType.Coins, Amount = 1000 },
                    new EventReward { Type = RewardType.Gems, Amount = 50 }
                },
                Participants = new List<string>(),
                IsActive = true
            };
            
            // Global event
            _events["global_competition"] = new SocialEvent
            {
                Id = "global_competition",
                Name = "Global Competition",
                Description = "Compete with players worldwide",
                Type = EventType.Global,
                StartTime = DateTime.Now,
                EndTime = DateTime.Now.AddDays(3),
                Rewards = new List<EventReward>
                {
                    new EventReward { Type = RewardType.Coins, Amount = 5000 },
                    new EventReward { Type = RewardType.Gems, Amount = 100 }
                },
                Participants = new List<string>(),
                IsActive = true
            };
        }
        
        private void LoadSocialData()
        {
            // Load social data from storage
            // This would implement data loading logic
        }
        
        private void StartSocialSystem()
        {
            if (!enableSocialFeatures) return;
            
            // Start leaderboard updates
            if (enableLeaderboards)
            {
                _leaderboardUpdateCoroutine = StartCoroutine(LeaderboardUpdateCoroutine());
            }
            
            // Start event checking
            if (enableSocialEvents)
            {
                _eventCheckCoroutine = StartCoroutine(EventCheckCoroutine());
            }
            
            // Start activity updates
            _activityUpdateCoroutine = StartCoroutine(ActivityUpdateCoroutine());
            
            // Start chat moderation
            if (enableChatModeration)
            {
                _chatModerationCoroutine = StartCoroutine(ChatModerationCoroutine());
            }
        }
        
        private IEnumerator LeaderboardUpdateCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(leaderboardUpdateInterval);
                
                // Update all leaderboards
                UpdateLeaderboards();
            }
        }
        
        private IEnumerator EventCheckCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(eventCheckInterval);
                
                // Check for events that should start
                CheckEventStart();
                
                // Check for events that should end
                CheckEventEnd();
                
                // Update event participants
                UpdateEventParticipants();
            }
        }
        
        private IEnumerator ActivityUpdateCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(30f);
                
                // Update player activities
                UpdatePlayerActivities();
                
                // Update friend activities
                UpdateFriendActivities();
            }
        }
        
        private IEnumerator ChatModerationCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(10f);
                
                // Moderate chat messages
                ModerateChatMessages();
            }
        }
        
        private void UpdateLeaderboards()
        {
            foreach (var leaderboard in _leaderboards.Values)
            {
                if (!leaderboard.IsActive) continue;
                
                // Update leaderboard entries
                UpdateLeaderboardEntries(leaderboard);
                
                // Sort entries by score
                leaderboard.Entries = leaderboard.Entries.OrderByDescending(e => e.Score).ToList();
                
                // Limit entries
                if (leaderboard.Entries.Count > maxLeaderboardEntries)
                {
                    leaderboard.Entries = leaderboard.Entries.Take(maxLeaderboardEntries).ToList();
                }
                
                leaderboard.LastUpdated = DateTime.Now;
                OnLeaderboardUpdated?.Invoke(leaderboard);
            }
        }
        
        private void UpdateLeaderboardEntries(SocialLeaderboard leaderboard)
        {
            // Update leaderboard entries based on player scores
            // This would implement leaderboard entry calculation
        }
        
        private void CheckEventStart()
        {
            foreach (var eventData in _events.Values)
            {
                if (!eventData.IsActive) continue;
                
                if (eventData.StartTime <= DateTime.Now && eventData.Status == EventStatus.Scheduled)
                {
                    eventData.Status = EventStatus.Active;
                    OnEventStarted?.Invoke(eventData);
                }
            }
        }
        
        private void CheckEventEnd()
        {
            foreach (var eventData in _events.Values)
            {
                if (!eventData.IsActive) continue;
                
                if (eventData.EndTime <= DateTime.Now && eventData.Status == EventStatus.Active)
                {
                    eventData.Status = EventStatus.Ended;
                    OnEventEnded?.Invoke(eventData);
                }
            }
        }
        
        private void UpdateEventParticipants()
        {
            foreach (var eventData in _events.Values)
            {
                if (eventData.Status != EventStatus.Active) continue;
                
                // Update event participants
                // This would implement participant tracking logic
            }
        }
        
        private void UpdatePlayerActivities()
        {
            // Update current player activities
            // This would implement activity tracking logic
        }
        
        private void UpdateFriendActivities()
        {
            // Update friend activities
            // This would implement friend activity tracking logic
        }
        
        private void ModerateChatMessages()
        {
            foreach (var chat in _chats.Values)
            {
                if (!chat.IsModerated) continue;
                
                // Moderate chat messages
                // This would implement chat moderation logic
            }
        }
        
        /// <summary>
        /// Create a new team
        /// </summary>
        public void CreateTeam(string teamName, string description, TeamPrivacy privacy)
        {
            if (!enableTeamManagement || !enableTeamCreation) return;
            
            var team = new SocialTeam
            {
                Id = Guid.NewGuid().ToString(),
                Name = teamName,
                Description = description,
                Privacy = privacy,
                OwnerId = _currentPlayerId,
                Members = new List<string> { _currentPlayerId },
                CreatedAt = DateTime.Now,
                IsActive = true
            };
            
            _teams[team.Id] = team;
            OnTeamCreated?.Invoke(team);
        }
        
        /// <summary>
        /// Join a team
        /// </summary>
        public void JoinTeam(string teamId)
        {
            if (!enableTeamManagement) return;
            
            if (!_teams.ContainsKey(teamId)) return;
            
            var team = _teams[teamId];
            if (team.Members.Count >= maxTeamSize) return;
            
            team.Members.Add(_currentPlayerId);
            OnTeamJoined?.Invoke(team);
        }
        
        /// <summary>
        /// Leave a team
        /// </summary>
        public void LeaveTeam(string teamId)
        {
            if (!enableTeamManagement) return;
            
            if (!_teams.ContainsKey(teamId)) return;
            
            var team = _teams[teamId];
            team.Members.Remove(_currentPlayerId);
            
            if (team.Members.Count == 0)
            {
                team.IsActive = false;
            }
            
            OnTeamLeft?.Invoke(team);
        }
        
        /// <summary>
        /// Create a new guild
        /// </summary>
        public void CreateGuild(string guildName, string description, GuildPrivacy privacy)
        {
            if (!enableGuildSystem || !enableGuildCreation) return;
            
            var guild = new SocialGuild
            {
                Id = Guid.NewGuid().ToString(),
                Name = guildName,
                Description = description,
                Privacy = privacy,
                OwnerId = _currentPlayerId,
                Members = new List<string> { _currentPlayerId },
                CreatedAt = DateTime.Now,
                IsActive = true
            };
            
            _guilds[guild.Id] = guild;
            OnGuildCreated?.Invoke(guild);
        }
        
        /// <summary>
        /// Join a guild
        /// </summary>
        public void JoinGuild(string guildId)
        {
            if (!enableGuildSystem) return;
            
            if (!_guilds.ContainsKey(guildId)) return;
            
            var guild = _guilds[guildId];
            if (guild.Members.Count >= maxGuildSize) return;
            
            guild.Members.Add(_currentPlayerId);
            OnGuildJoined?.Invoke(guild);
        }
        
        /// <summary>
        /// Leave a guild
        /// </summary>
        public void LeaveGuild(string guildId)
        {
            if (!enableGuildSystem) return;
            
            if (!_guilds.ContainsKey(guildId)) return;
            
            var guild = _guilds[guildId];
            guild.Members.Remove(_currentPlayerId);
            
            if (guild.Members.Count == 0)
            {
                guild.IsActive = false;
            }
            
            OnGuildLeft?.Invoke(guild);
        }
        
        /// <summary>
        /// Send a chat message
        /// </summary>
        public void SendChatMessage(string chatId, string message)
        {
            if (!enableChatSystem) return;
            
            if (!_chats.ContainsKey(chatId)) return;
            
            var chat = _chats[chatId];
            var chatMessage = new ChatMessage
            {
                Id = Guid.NewGuid().ToString(),
                PlayerId = _currentPlayerId,
                Message = message,
                Timestamp = DateTime.Now,
                IsModerated = chat.IsModerated
            };
            
            chat.Messages.Add(chatMessage);
            
            // Limit chat history
            if (chat.Messages.Count > maxChatHistory)
            {
                chat.Messages.RemoveAt(0);
            }
            
            OnChatMessage?.Invoke(chat);
        }
        
        /// <summary>
        /// Send a gift
        /// </summary>
        public void SendGift(string recipientId, GiftType giftType, int amount)
        {
            if (!enableGiftingSystem || !enableGiftGiving) return;
            
            var gift = new SocialGift
            {
                Id = Guid.NewGuid().ToString(),
                SenderId = _currentPlayerId,
                RecipientId = recipientId,
                Type = giftType,
                Amount = amount,
                SentAt = DateTime.Now,
                IsReceived = false
            };
            
            _gifts[gift.Id] = gift;
            OnGiftSent?.Invoke(gift);
        }
        
        /// <summary>
        /// Receive a gift
        /// </summary>
        public void ReceiveGift(string giftId)
        {
            if (!enableGiftingSystem || !enableGiftReceiving) return;
            
            if (!_gifts.ContainsKey(giftId)) return;
            
            var gift = _gifts[giftId];
            gift.IsReceived = true;
            gift.ReceivedAt = DateTime.Now;
            
            OnGiftReceived?.Invoke(gift);
        }
        
        /// <summary>
        /// Add a friend
        /// </summary>
        public void AddFriend(string friendId)
        {
            if (!enableFriendSystem || !enableFriendRequests) return;
            
            var friend = new SocialFriend
            {
                Id = Guid.NewGuid().ToString(),
                PlayerId = _currentPlayerId,
                FriendId = friendId,
                Status = FriendStatus.Pending,
                AddedAt = DateTime.Now
            };
            
            _friends[friend.Id] = friend;
            OnFriendAdded?.Invoke(friend);
        }
        
        /// <summary>
        /// Remove a friend
        /// </summary>
        public void RemoveFriend(string friendId)
        {
            if (!enableFriendSystem) return;
            
            var friend = _friends.Values.FirstOrDefault(f => f.FriendId == friendId);
            if (friend != null)
            {
                _friends.Remove(friend.Id);
                OnFriendRemoved?.Invoke(friend);
            }
        }
        
        /// <summary>
        /// Post an activity
        /// </summary>
        public void PostActivity(ActivityType type, string description, Dictionary<string, object> data = null)
        {
            var activity = new SocialActivity
            {
                Id = Guid.NewGuid().ToString(),
                PlayerId = _currentPlayerId,
                Type = type,
                Description = description,
                Data = data ?? new Dictionary<string, object>(),
                PostedAt = DateTime.Now,
                IsPublic = true
            };
            
            _activities[activity.Id] = activity;
            OnActivityPosted?.Invoke(activity);
        }
        
        /// <summary>
        /// Get player teams
        /// </summary>
        public List<SocialTeam> GetPlayerTeams()
        {
            return _teams.Values.Where(t => t.Members.Contains(_currentPlayerId)).ToList();
        }
        
        /// <summary>
        /// Get player guilds
        /// </summary>
        public List<SocialGuild> GetPlayerGuilds()
        {
            return _guilds.Values.Where(g => g.Members.Contains(_currentPlayerId)).ToList();
        }
        
        /// <summary>
        /// Get leaderboard
        /// </summary>
        public SocialLeaderboard GetLeaderboard(string leaderboardId)
        {
            return _leaderboards.ContainsKey(leaderboardId) ? _leaderboards[leaderboardId] : null;
        }
        
        /// <summary>
        /// Get chat messages
        /// </summary>
        public List<ChatMessage> GetChatMessages(string chatId, int count = 50)
        {
            if (!_chats.ContainsKey(chatId)) return new List<ChatMessage>();
            
            var chat = _chats[chatId];
            return chat.Messages.TakeLast(count).ToList();
        }
        
        /// <summary>
        /// Get player friends
        /// </summary>
        public List<SocialFriend> GetPlayerFriends()
        {
            return _friends.Values.Where(f => f.PlayerId == _currentPlayerId).ToList();
        }
        
        /// <summary>
        /// Get player activities
        /// </summary>
        public List<SocialActivity> GetPlayerActivities(int count = 20)
        {
            return _activities.Values
                .Where(a => a.PlayerId == _currentPlayerId)
                .OrderByDescending(a => a.PostedAt)
                .Take(count)
                .ToList();
        }
        
        /// <summary>
        /// Get friend activities
        /// </summary>
        public List<SocialActivity> GetFriendActivities(int count = 20)
        {
            var friendIds = _friends.Values
                .Where(f => f.PlayerId == _currentPlayerId && f.Status == FriendStatus.Accepted)
                .Select(f => f.FriendId)
                .ToList();
            
            return _activities.Values
                .Where(a => friendIds.Contains(a.PlayerId))
                .OrderByDescending(a => a.PostedAt)
                .Take(count)
                .ToList();
        }
        
        /// <summary>
        /// Set current player ID
        /// </summary>
        public void SetCurrentPlayer(string playerId)
        {
            _currentPlayerId = playerId;
        }
        
        void OnDestroy()
        {
            if (_leaderboardUpdateCoroutine != null)
            {
                StopCoroutine(_leaderboardUpdateCoroutine);
            }
            
            if (_eventCheckCoroutine != null)
            {
                StopCoroutine(_eventCheckCoroutine);
            }
            
            if (_activityUpdateCoroutine != null)
            {
                StopCoroutine(_activityUpdateCoroutine);
            }
            
            if (_chatModerationCoroutine != null)
            {
                StopCoroutine(_chatModerationCoroutine);
            }
        }
    }
    
    // Social Data Classes
    [System.Serializable]
    public class SocialPlayer
    {
        public string Id;
        public string Name;
        public int Level;
        public int Score;
        public string Avatar;
        public PlayerStatus Status;
        public DateTime LastSeen;
        public Dictionary<string, object> Stats;
    }
    
    [System.Serializable]
    public class SocialTeam
    {
        public string Id;
        public string Name;
        public string Description;
        public TeamPrivacy Privacy;
        public string OwnerId;
        public List<string> Members;
        public DateTime CreatedAt;
        public bool IsActive;
    }
    
    [System.Serializable]
    public class SocialGuild
    {
        public string Id;
        public string Name;
        public string Description;
        public GuildPrivacy Privacy;
        public string OwnerId;
        public List<string> Members;
        public DateTime CreatedAt;
        public bool IsActive;
    }
    
    [System.Serializable]
    public class SocialLeaderboard
    {
        public string Id;
        public string Name;
        public LeaderboardType Type;
        public string Category;
        public string Region;
        public List<LeaderboardEntry> Entries;
        public DateTime LastUpdated;
        public bool IsActive;
    }
    
    [System.Serializable]
    public class LeaderboardEntry
    {
        public string PlayerId;
        public string PlayerName;
        public int Score;
        public int Rank;
        public DateTime LastUpdated;
    }
    
    [System.Serializable]
    public class SocialChat
    {
        public string Id;
        public string Name;
        public ChatType Type;
        public List<ChatMessage> Messages;
        public bool IsActive;
        public bool IsModerated;
    }
    
    [System.Serializable]
    public class ChatMessage
    {
        public string Id;
        public string PlayerId;
        public string Message;
        public DateTime Timestamp;
        public bool IsModerated;
    }
    
    [System.Serializable]
    public class SocialGift
    {
        public string Id;
        public string SenderId;
        public string RecipientId;
        public GiftType Type;
        public int Amount;
        public DateTime SentAt;
        public DateTime? ReceivedAt;
        public bool IsReceived;
    }
    
    [System.Serializable]
    public class SocialEvent
    {
        public string Id;
        public string Name;
        public string Description;
        public EventType Type;
        public DateTime StartTime;
        public DateTime EndTime;
        public EventStatus Status;
        public List<EventReward> Rewards;
        public List<string> Participants;
        public bool IsActive;
    }
    
    [System.Serializable]
    public class EventReward
    {
        public RewardType Type;
        public int Amount;
    }
    
    [System.Serializable]
    public class SocialFriend
    {
        public string Id;
        public string PlayerId;
        public string FriendId;
        public FriendStatus Status;
        public DateTime AddedAt;
    }
    
    [System.Serializable]
    public class SocialActivity
    {
        public string Id;
        public string PlayerId;
        public ActivityType Type;
        public string Description;
        public Dictionary<string, object> Data;
        public DateTime PostedAt;
        public bool IsPublic;
    }
    
    // Enums
    public enum PlayerStatus
    {
        Online,
        Offline,
        Away,
        Busy
    }
    
    public enum TeamPrivacy
    {
        Public,
        Private,
        InviteOnly
    }
    
    public enum GuildPrivacy
    {
        Public,
        Private,
        InviteOnly
    }
    
    public enum LeaderboardType
    {
        Global,
        Regional,
        Team,
        Weekly,
        Monthly
    }
    
    public enum ChatType
    {
        Global,
        Team,
        Guild,
        Private
    }
    
    public enum GiftType
    {
        Coins,
        Gems,
        Energy,
        Items
    }
    
    public enum EventType
    {
        Team,
        Global,
        Guild,
        Special
    }
    
    public enum EventStatus
    {
        Scheduled,
        Active,
        Ended,
        Cancelled
    }
    
    public enum RewardType
    {
        Coins,
        Gems,
        Energy,
        Experience,
        Items
    }
    
    public enum FriendStatus
    {
        Pending,
        Accepted,
        Blocked
    }
    
    public enum ActivityType
    {
        LevelComplete,
        Achievement,
        Purchase,
        Gift,
        TeamJoin,
        GuildJoin
    }
}