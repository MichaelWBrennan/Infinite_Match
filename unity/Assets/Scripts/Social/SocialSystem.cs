using UnityEngine;
using System.Collections.Generic;
using System;
using Evergreen.Core;

namespace Evergreen.Social
{
    [System.Serializable]
    public class Team
    {
        public string id;
        public string name;
        public string description;
        public string leaderId;
        public List<string> memberIds = new List<string>();
        public int maxMembers = 50;
        public int level;
        public int experience;
        public int experienceToNextLevel;
        public List<TeamAchievement> achievements = new List<TeamAchievement>();
        public TeamSettings settings = new TeamSettings();
        public DateTime createdTime;
        public DateTime lastActivityTime;
        public bool isPublic;
        public string inviteCode;
        public int requiredLevel;
        public string region;
        public string language;
    }

    [System.Serializable]
    public class TeamMember
    {
        public string playerId;
        public string teamId;
        public TeamRole role;
        public DateTime joinTime;
        public int contribution;
        public int lastActiveTime;
        public bool isOnline;
        public List<string> permissions = new List<string>();
    }

    [System.Serializable]
    public class TeamAchievement
    {
        public string id;
        public string name;
        public string description;
        public bool isUnlocked;
        public DateTime unlockTime;
        public int progress;
        public int target;
        public List<TeamReward> rewards = new List<TeamReward>();
    }

    [System.Serializable]
    public class TeamReward
    {
        public string type; // "coins", "gems", "energy", "decoration", "character"
        public int amount;
        public string itemId;
        public bool isClaimed;
    }

    [System.Serializable]
    public class TeamSettings
    {
        public bool allowInvites = true;
        public bool requireApproval = false;
        public bool allowChat = true;
        public bool allowGifting = true;
        public bool allowLeaderboard = true;
        public int minLevel = 1;
        public string language = "en";
    }

    public enum TeamRole
    {
        Leader,
        CoLeader,
        Elder,
        Member
    }

    [System.Serializable]
    public class Leaderboard
    {
        public string id;
        public string name;
        public LeaderboardType type;
        public List<LeaderboardEntry> entries = new List<LeaderboardEntry>();
        public DateTime lastUpdated;
        public int maxEntries = 100;
        public bool isActive = true;
    }

    [System.Serializable]
    public class LeaderboardEntry
    {
        public string playerId;
        public string playerName;
        public int score;
        public int rank;
        public DateTime lastUpdated;
        public string avatar;
        public Dictionary<string, int> additionalData = new Dictionary<string, int>();
    }

    public enum LeaderboardType
    {
        Global,
        Regional,
        Team,
        Friends,
        Weekly,
        Monthly,
        AllTime
    }

    [System.Serializable]
    public class SocialEvent
    {
        public string id;
        public string name;
        public string description;
        public SocialEventType type;
        public DateTime startTime;
        public DateTime endTime;
        public bool isActive;
        public List<SocialEventReward> rewards = new List<SocialEventReward>();
        public SocialEventSettings settings = new SocialEventSettings();
    }

    [System.Serializable]
    public class SocialEventReward
    {
        public string type;
        public int amount;
        public string itemId;
        public int requiredScore;
        public bool isClaimed;
    }

    [System.Serializable]
    public class SocialEventSettings
    {
        public int maxParticipants = 1000;
        public bool requiresTeam = false;
        public int minLevel = 1;
        public string region = "global";
    }

    public enum SocialEventType
    {
        Tournament,
        TeamChallenge,
        GlobalEvent,
        SeasonalEvent,
        SpecialEvent
    }

    [System.Serializable]
    public class ChatMessage
    {
        public string id;
        public string senderId;
        public string senderName;
        public string content;
        public DateTime timestamp;
        public ChatMessageType type;
        public string teamId;
        public bool isSystemMessage;
        public Dictionary<string, object> metadata = new Dictionary<string, object>();
    }

    public enum ChatMessageType
    {
        Text,
        System,
        Gift,
        Achievement,
        Event
    }

    [System.Serializable]
    public class Gift
    {
        public string id;
        public string senderId;
        public string receiverId;
        public string teamId;
        public GiftType type;
        public int amount;
        public string message;
        public DateTime sentTime;
        public DateTime expiryTime;
        public bool isClaimed;
        public bool isExpired;
    }

    public enum GiftType
    {
        Coins,
        Gems,
        Energy,
        Decoration,
        Character,
        Ability
    }

    public class SocialSystem : MonoBehaviour
    {
        [Header("Social Settings")]
        public List<Team> teams = new List<Team>();
        public List<Leaderboard> leaderboards = new List<Leaderboard>();
        public List<SocialEvent> socialEvents = new List<SocialEvent>();
        public List<ChatMessage> chatMessages = new List<ChatMessage>();
        public List<Gift> gifts = new List<Gift>();
        
        [Header("Team Settings")]
        public int maxTeamsPerPlayer = 1;
        public int maxTeamMembers = 50;
        public int teamCreationCost = 1000; // coins
        public int teamInviteExpiry = 24; // hours
        
        [Header("Leaderboard Settings")]
        public int leaderboardUpdateInterval = 300; // seconds
        public int maxLeaderboardEntries = 100;
        public bool enableRegionalLeaderboards = true;
        
        [Header("Chat Settings")]
        public int maxChatMessages = 1000;
        public int chatMessageExpiry = 7; // days
        public bool enableProfanityFilter = true;
        public bool enableChatModeration = true;
        
        [Header("AI Social Enhancement")]
        public bool enableAISocial = true;
        public bool enableAIMatchmaking = true;
        public bool enableAIChatModeration = true;
        public bool enableAISocialRecommendations = true;
        public bool enableAISocialOptimization = true;
        public float aiPersonalizationStrength = 0.8f;
        public float aiRecommendationAccuracy = 0.7f;
        
        private Dictionary<string, Team> _teamLookup = new Dictionary<string, Team>();
        private Dictionary<string, TeamMember> _teamMemberLookup = new Dictionary<string, TeamMember>();
        private Dictionary<string, Leaderboard> _leaderboardLookup = new Dictionary<string, Leaderboard>();
        private Dictionary<string, SocialEvent> _socialEventLookup = new Dictionary<string, SocialEvent>();
        private Dictionary<string, List<ChatMessage>> _teamChatLookup = new Dictionary<string, List<ChatMessage>>();
        private Dictionary<string, List<Gift>> _playerGiftsLookup = new Dictionary<string, List<Gift>>();
        
        // AI Social Systems
        private UnifiedAIAPIService _aiService;
        
        // Events
        public System.Action<Team> OnTeamCreated;
        public System.Action<Team> OnTeamJoined;
        public System.Action<Team> OnTeamLeft;
        public System.Action<LeaderboardEntry> OnLeaderboardUpdated;
        public System.Action<SocialEvent> OnSocialEventStarted;
        public System.Action<SocialEvent> OnSocialEventEnded;
        public System.Action<ChatMessage> OnChatMessageReceived;
        public System.Action<Gift> OnGiftReceived;
        
        public static SocialSystem Instance { get; private set; }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeSocialsystemSafe();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            LoadSocialData();
            CreateDefaultLeaderboards();
            CreateDefaultSocialEvents();
            BuildLookupTables();
            InitializeAISocialSystems();
            StartCoroutine(UpdateLeaderboards());
        }
        
        private void InitializeSocialsystemSafe()
        {
            Debug.Log("Social System initialized");
        }
        
        private void CreateDefaultLeaderboards()
        {
            if (leaderboards.Count == 0)
            {
                // Global Leaderboard
                var globalLeaderboard = new Leaderboard
                {
                    id = "global_levels",
                    name = "Global Levels",
                    type = LeaderboardType.Global,
                    maxEntries = 100,
                    isActive = true
                };
                leaderboards.Add(globalLeaderboard);
                
                // Weekly Leaderboard
                var weeklyLeaderboard = new Leaderboard
                {
                    id = "weekly_score",
                    name = "Weekly Score",
                    type = LeaderboardType.Weekly,
                    maxEntries = 100,
                    isActive = true
                };
                leaderboards.Add(weeklyLeaderboard);
                
                // Team Leaderboard
                var teamLeaderboard = new Leaderboard
                {
                    id = "team_contribution",
                    name = "Team Contribution",
                    type = LeaderboardType.Team,
                    maxEntries = 50,
                    isActive = true
                };
                leaderboards.Add(teamLeaderboard);
            }
        }
        
        private void CreateDefaultSocialEvents()
        {
            if (socialEvents.Count == 0)
            {
                // Weekly Tournament
                var weeklyTournament = new SocialEvent
                {
                    id = "weekly_tournament",
                    name = "Weekly Tournament",
                    description = "Compete against players worldwide!",
                    type = SocialEventType.Tournament,
                    startTime = DateTime.Now,
                    endTime = DateTime.Now.AddDays(7),
                    isActive = true,
                    rewards = new List<SocialEventReward>
                    {
                        new SocialEventReward { type = "coins", amount = 1000, requiredScore = 1000 },
                        new SocialEventReward { type = "gems", amount = 50, requiredScore = 5000 },
                        new SocialEventReward { type = "decoration", itemId = "tournament_trophy", requiredScore = 10000 }
                    },
                    settings = new SocialEventSettings
                    {
                        maxParticipants = 10000,
                        requiresTeam = false,
                        minLevel = 5
                    }
                };
                socialEvents.Add(weeklyTournament);
                
                // Team Challenge
                var teamChallenge = new SocialEvent
                {
                    id = "team_challenge",
                    name = "Team Challenge",
                    description = "Work together with your team!",
                    type = SocialEventType.TeamChallenge,
                    startTime = DateTime.Now,
                    endTime = DateTime.Now.AddDays(3),
                    isActive = true,
                    rewards = new List<SocialEventReward>
                    {
                        new SocialEventReward { type = "coins", amount = 500, requiredScore = 500 },
                        new SocialEventReward { type = "gems", amount = 25, requiredScore = 2500 },
                        new SocialEventReward { type = "energy", amount = 20, requiredScore = 5000 }
                    },
                    settings = new SocialEventSettings
                    {
                        maxParticipants = 1000,
                        requiresTeam = true,
                        minLevel = 10
                    }
                };
                socialEvents.Add(teamChallenge);
            }
        }
        
        private void BuildLookupTables()
        {
            _teamLookup.Clear();
            _teamMemberLookup.Clear();
            _leaderboardLookup.Clear();
            _socialEventLookup.Clear();
            _teamChatLookup.Clear();
            _playerGiftsLookup.Clear();
            
            foreach (var team in teams)
            {
                _teamLookup[team.id] = team;
            }
            
            foreach (var leaderboard in leaderboards)
            {
                _leaderboardLookup[leaderboard.id] = leaderboard;
            }
            
            foreach (var socialEvent in socialEvents)
            {
                _socialEventLookup[socialEvent.id] = socialEvent;
            }
        }
        
        // Team Management
        public bool CreateTeam(string playerId, string teamName, string description, bool isPublic = true)
        {
            var gameManager = OptimizedCoreSystem.Instance.Resolve<GameManager>();
            if (gameManager == null) return false;
            
            // Check if player has enough coins
            if (gameManager.GetCurrency("coins") < teamCreationCost) return false;
            
            // Check if player is already in a team
            if (GetPlayerTeam(playerId) != null) return false;
            
            // Create team
            var team = new Team
            {
                id = Guid.NewGuid().ToString(),
                name = teamName,
                description = description,
                leaderId = playerId,
                maxMembers = maxTeamMembers,
                level = 1,
                experience = 0,
                experienceToNextLevel = 1000,
                createdTime = DateTime.Now,
                lastActivityTime = DateTime.Now,
                isPublic = isPublic,
                inviteCode = GenerateInviteCode(),
                requiredLevel = 1,
                region = GetPlayerRegion(playerId),
                language = "en"
            };
            
            teams.Add(team);
            _teamLookup[team.id] = team;
            
            // Add leader as member
            var leaderMember = new TeamMember
            {
                playerId = playerId,
                teamId = team.id,
                role = TeamRole.Leader,
                joinTime = DateTime.Now,
                contribution = 0,
                lastActiveTime = (int)DateTime.Now.Ticks,
                isOnline = true,
                permissions = new List<string> { "invite", "kick", "promote", "demote", "edit_settings" }
            };
            
            _teamMemberLookup[playerId] = leaderMember;
            team.memberIds.Add(playerId);
            
            // Deduct creation cost
            gameManager.SpendCurrency("coins", teamCreationCost);
            
            OnTeamCreated?.Invoke(team);
            SaveSocialData();
            
            return true;
        }
        
        public bool JoinTeam(string playerId, string teamId)
        {
            if (!_teamLookup.ContainsKey(teamId)) return false;
            
            var team = _teamLookup[teamId];
            if (team.memberIds.Count >= team.maxMembers) return false;
            
            // Check if player is already in a team
            if (GetPlayerTeam(playerId) != null) return false;
            
            // Add player to team
            var member = new TeamMember
            {
                playerId = playerId,
                teamId = teamId,
                role = TeamRole.Member,
                joinTime = DateTime.Now,
                contribution = 0,
                lastActiveTime = (int)DateTime.Now.Ticks,
                isOnline = true,
                permissions = new List<string> { "chat", "gift" }
            };
            
            _teamMemberLookup[playerId] = member;
            team.memberIds.Add(playerId);
            team.lastActivityTime = DateTime.Now;
            
            OnTeamJoined?.Invoke(team);
            SaveSocialData();
            
            return true;
        }
        
        public bool LeaveTeam(string playerId)
        {
            var team = GetPlayerTeam(playerId);
            if (team == null) return false;
            
            var member = _teamMemberLookup[playerId];
            if (member.role == TeamRole.Leader)
            {
                // Transfer leadership or disband team
                if (team.memberIds.Count > 1)
                {
                    // Transfer to next highest role
                    var nextLeader = GetNextLeader(team);
                    if (nextLeader != null)
                    {
                        nextLeader.role = TeamRole.Leader;
                        nextLeader.permissions = new List<string> { "invite", "kick", "promote", "demote", "edit_settings" };
                    }
                }
                else
                {
                    // Disband team
                    teams.Remove(team);
                    _teamLookup.Remove(team.id);
                }
            }
            
            team.memberIds.Remove(playerId);
            _teamMemberLookup.Remove(playerId);
            team.lastActivityTime = DateTime.Now;
            
            OnTeamLeft?.Invoke(team);
            SaveSocialData();
            
            return true;
        }
        
        public Team GetPlayerTeam(string playerId)
        {
            if (!_teamMemberLookup.ContainsKey(playerId)) return null;
            
            var member = _teamMemberLookup[playerId];
            return _teamLookup.ContainsKey(member.teamId) ? _teamLookup[member.teamId] : null;
        }
        
        public List<Team> GetAvailableTeams(string playerId, int maxResults = 20)
        {
            var availableTeams = new List<Team>();
            
            foreach (var team in teams)
            {
                if (!team.isPublic) continue;
                if (team.memberIds.Count >= team.maxMembers) continue;
                if (team.memberIds.Contains(playerId)) continue;
                
                availableTeams.Add(team);
            }
            
            // Sort by activity and member count
            availableTeams.Sort((a, b) => 
            {
                int scoreA = a.memberIds.Count + (a.lastActivityTime > DateTime.Now.AddDays(-7) ? 10 : 0);
                int scoreB = b.memberIds.Count + (b.lastActivityTime > DateTime.Now.AddDays(-7) ? 10 : 0);
                return scoreB.CompareTo(scoreA);
            });
            
            if (availableTeams.Count > maxResults)
            {
                availableTeams = availableTeams.GetRange(0, maxResults);
            }
            
            return availableTeams;
        }
        
        // Leaderboard Management
        public void UpdateLeaderboard(string leaderboardId, string playerId, int score)
        {
            if (!_leaderboardLookup.ContainsKey(leaderboardId)) return;
            
            var leaderboard = _leaderboardLookup[leaderboardId];
            var existingEntry = leaderboard.entries.Find(e => e.playerId == playerId);
            
            if (existingEntry != null)
            {
                existingEntry.score = score;
                existingEntry.lastUpdated = DateTime.Now;
            }
            else
            {
                var newEntry = new LeaderboardEntry
                {
                    playerId = playerId,
                    playerName = GetPlayerName(playerId),
                    score = score,
                    rank = 0,
                    lastUpdated = DateTime.Now,
                    avatar = GetPlayerAvatar(playerId)
                };
                leaderboard.entries.Add(newEntry);
            }
            
            // Sort and rank entries
            leaderboard.entries.Sort((a, b) => b.score.CompareTo(a.score));
            
            for (int i = 0; i < leaderboard.entries.Count; i++)
            {
                leaderboard.entries[i].rank = i + 1;
            }
            
            // Keep only top entries
            if (leaderboard.entries.Count > leaderboard.maxEntries)
            {
                leaderboard.entries = leaderboard.entries.GetRange(0, leaderboard.maxEntries);
            }
            
            leaderboard.lastUpdated = DateTime.Now;
            
            OnLeaderboardUpdated?.Invoke(leaderboard.entries.Find(e => e.playerId == playerId));
        }
        
        public List<LeaderboardEntry> GetLeaderboard(string leaderboardId, int maxEntries = 50)
        {
            if (!_leaderboardLookup.ContainsKey(leaderboardId)) return new List<LeaderboardEntry>();
            
            var leaderboard = _leaderboardLookup[leaderboardId];
            var entries = new List<LeaderboardEntry>(leaderboard.entries);
            
            if (entries.Count > maxEntries)
            {
                entries = entries.GetRange(0, maxEntries);
            }
            
            return entries;
        }
        
        // Chat Management
        public void SendChatMessage(string playerId, string teamId, string content, ChatMessageType type = ChatMessageType.Text)
        {
            var team = GetPlayerTeam(playerId);
            if (team == null || team.id != teamId) return;
            
            var message = new ChatMessage
            {
                id = Guid.NewGuid().ToString(),
                senderId = playerId,
                senderName = GetPlayerName(playerId),
                content = content,
                timestamp = DateTime.Now,
                type = type,
                teamId = teamId,
                isSystemMessage = false
            };
            
            chatMessages.Add(message);
            
            if (!_teamChatLookup.ContainsKey(teamId))
            {
                _teamChatLookup[teamId] = new List<ChatMessage>();
            }
            _teamChatLookup[teamId].Add(message);
            
            // Clean up old messages
            CleanupOldMessages();
            
            OnChatMessageReceived?.Invoke(message);
            SaveSocialData();
        }
        
        public List<ChatMessage> GetTeamChat(string teamId, int maxMessages = 50)
        {
            if (!_teamChatLookup.ContainsKey(teamId)) return new List<ChatMessage>();
            
            var messages = _teamChatLookup[teamId];
            if (messages.Count > maxMessages)
            {
                messages = messages.GetRange(messages.Count - maxMessages, maxMessages);
            }
            
            return messages;
        }
        
        // Gift System
        public bool SendGift(string senderId, string receiverId, GiftType type, int amount, string message = "")
        {
            var senderTeam = GetPlayerTeam(senderId);
            var receiverTeam = GetPlayerTeam(receiverId);
            
            if (senderTeam == null || receiverTeam == null) return false;
            if (senderTeam.id != receiverTeam.id) return false; // Must be in same team
            
            var gift = new Gift
            {
                id = Guid.NewGuid().ToString(),
                senderId = senderId,
                receiverId = receiverId,
                teamId = senderTeam.id,
                type = type,
                amount = amount,
                message = message,
                sentTime = DateTime.Now,
                expiryTime = DateTime.Now.AddDays(7),
                isClaimed = false,
                isExpired = false
            };
            
            gifts.Add(gift);
            
            if (!_playerGiftsLookup.ContainsKey(receiverId))
            {
                _playerGiftsLookup[receiverId] = new List<Gift>();
            }
            _playerGiftsLookup[receiverId].Add(gift);
            
            OnGiftReceived?.Invoke(gift);
            SaveSocialData();
            
            return true;
        }
        
        public List<Gift> GetPlayerGifts(string playerId)
        {
            if (!_playerGiftsLookup.ContainsKey(playerId)) return new List<Gift>();
            
            var playerGifts = _playerGiftsLookup[playerId];
            var validGifts = new List<Gift>();
            
            foreach (var gift in playerGifts)
            {
                if (gift.isExpired || gift.isClaimed) continue;
                if (DateTime.Now > gift.expiryTime)
                {
                    gift.isExpired = true;
                    continue;
                }
                validGifts.Add(gift);
            }
            
            return validGifts;
        }
        
        public bool ClaimGift(string playerId, string giftId)
        {
            var gift = gifts.Find(g => g.id == giftId && g.receiverId == playerId);
            if (gift == null || gift.isClaimed || gift.isExpired) return false;
            
            var gameManager = OptimizedCoreSystem.Instance.Resolve<GameManager>();
            if (gameManager == null) return false;
            
            // Award gift
            switch (gift.type)
            {
                case GiftType.Coins:
                    gameManager.AddCurrency("coins", gift.amount);
                    break;
                case GiftType.Gems:
                    gameManager.AddCurrency("gems", gift.amount);
                    break;
                case GiftType.Energy:
                    var energySystem = OptimizedCoreSystem.Instance.Resolve<EnergySystem>();
                    energySystem?.AddEnergy(gift.amount);
                    break;
            }
            
            gift.isClaimed = true;
            SaveSocialData();
            
            return true;
        }
        
        // Helper Methods
        private string GenerateInviteCode()
        {
            return Guid.NewGuid().ToString().Substring(0, 8).ToUpper();
        }
        
        private string GetPlayerRegion(string playerId)
        {
            // This would integrate with your analytics system
            return "US";
        }
        
        private string GetPlayerName(string playerId)
        {
            // This would integrate with your player data system
            return "Player " + playerId.Substring(0, 8);
        }
        
        private string GetPlayerAvatar(string playerId)
        {
            // This would integrate with your player data system
            return "default_avatar";
        }
        
        private TeamMember GetNextLeader(Team team)
        {
            var members = new List<TeamMember>();
            foreach (var memberId in team.memberIds)
            {
                if (_teamMemberLookup.ContainsKey(memberId))
                {
                    members.Add(_teamMemberLookup[memberId]);
                }
            }
            
            members.Sort((a, b) => 
            {
                if (a.role != b.role) return a.role.CompareTo(b.role);
                return b.contribution.CompareTo(a.contribution);
            });
            
            return members.Count > 0 ? members[0] : null;
        }
        
        private void CleanupOldMessages()
        {
            var cutoffTime = DateTime.Now.AddDays(-chatMessageExpiry);
            chatMessages.RemoveAll(m => m.timestamp < cutoffTime);
            
            foreach (var teamChat in _teamChatLookup.Values)
            {
                teamChat.RemoveAll(m => m.timestamp < cutoffTime);
            }
        }
        
        private System.Collections.IEnumerator UpdateLeaderboards()
        {
            while (true)
            {
                yield return new WaitForSeconds(leaderboardUpdateInterval);
                
                // Update all active leaderboards
                foreach (var leaderboard in leaderboards)
                {
                    if (leaderboard.isActive)
                    {
                        // This would integrate with your analytics system
                        // to update leaderboard scores
                    }
                }
            }
        }
        
        private void LoadSocialData()
        {
            string path = Application.persistentDataPath + "/social_data.json";
            if (System.IO.File.Exists(path))
            {
                string json = System.IO.File.ReadAllText(path);
                var saveData = JsonUtility.FromJson<SocialSaveData>(json);
                
                teams = saveData.teams;
                leaderboards = saveData.leaderboards;
                socialEvents = saveData.socialEvents;
                chatMessages = saveData.chatMessages;
                gifts = saveData.gifts;
            }
        }
        
        public void SaveSocialData()
        {
            var saveData = new SocialSaveData
            {
                teams = teams,
                leaderboards = leaderboards,
                socialEvents = socialEvents,
                chatMessages = chatMessages,
                gifts = gifts
            };
            
            string json = JsonUtility.ToJson(saveData, true);
            System.IO.File.WriteAllText(Application.persistentDataPath + "/social_data.json", json);
        }
        
        #region AI Social Systems
        
        private void InitializeAISocialSystems()
        {
            if (!enableAISocial) return;
            
            Debug.Log("👥 Initializing AI Social Systems...");
            
            _aiService = UnifiedAIAPIService.Instance;
            if (_aiService == null)
            {
                var aiServiceGO = new GameObject("UnifiedAIAPIService");
                _aiService = aiServiceGO.AddComponent<UnifiedAIAPIService>();
            }
            
            Debug.Log("✅ AI Social Systems Initialized with Unified API");
        }
        
        public void FindOptimalTeamMatches(string playerId)
        {
            if (!enableAISocial || _aiService == null) return;
            
            var context = new SocialContext
            {
                SocialAction = "team_matchmaking",
                PlayerId = playerId,
                SocialData = new Dictionary<string, object>
                {
                    ["player_level"] = GetPlayerLevel(playerId),
                    ["preferred_team_types"] = new List<string>(),
                    ["activity_level"] = GetPlayerActivityLevel(playerId)
                },
                TeamId = "",
                Message = ""
            };
            
            _aiService.RequestSocialAI(playerId, context, (response) => {
                if (response != null)
                {
                    ApplyTeamMatchmaking(response);
                }
            });
        }
        
        public void ModerateChatMessage(string message, string senderId)
        {
            if (!enableAISocial || _aiService == null) return;
            
            var context = new SocialContext
            {
                SocialAction = "chat_moderation",
                PlayerId = senderId,
                SocialData = new Dictionary<string, object>
                {
                    ["message"] = message,
                    ["sender_id"] = senderId,
                    ["message_length"] = message.Length,
                    ["timestamp"] = DateTime.Now
                },
                TeamId = GetPlayerTeamId(senderId),
                Message = message
            };
            
            _aiService.RequestSocialAI(senderId, context, (response) => {
                if (response != null)
                {
                    ApplyChatModeration(response);
                }
            });
        }
        
        public void GenerateSocialRecommendations(string playerId)
        {
            if (!enableAISocial || _aiService == null) return;
            
            var context = new SocialContext
            {
                SocialAction = "generate_recommendations",
                PlayerId = playerId,
                SocialData = new Dictionary<string, object>
                {
                    ["player_preferences"] = GetPlayerPreferences(playerId),
                    ["social_history"] = GetPlayerSocialHistory(playerId),
                    ["activity_patterns"] = GetPlayerActivityPatterns(playerId)
                },
                TeamId = GetPlayerTeamId(playerId),
                Message = ""
            };
            
            _aiService.RequestSocialAI(playerId, context, (response) => {
                if (response != null)
                {
                    ApplySocialRecommendations(response);
                }
            });
        }
        
        public void OptimizeSocialFeatures()
        {
            if (!enableAISocial || _aiService == null) return;
            
            var context = new SocialContext
            {
                SocialAction = "optimize_features",
                PlayerId = "system",
                SocialData = new Dictionary<string, object>
                {
                    ["total_teams"] = teams.Count,
                    ["total_players"] = _teamMemberLookup.Count,
                    ["engagement_metrics"] = GetEngagementMetrics()
                },
                TeamId = "",
                Message = ""
            };
            
            _aiService.RequestSocialAI("system", context, (response) => {
                if (response != null)
                {
                    ApplySocialOptimizations(response);
                }
            });
        }
        
        public void AnalyzePlayerSocialBehavior(string playerId)
        {
            if (!enableAISocial || _aiService == null) return;
            
            var context = new SocialContext
            {
                SocialAction = "analyze_behavior",
                PlayerId = playerId,
                SocialData = new Dictionary<string, object>
                {
                    ["team_interactions"] = GetPlayerTeamInteractions(playerId),
                    ["chat_activity"] = GetPlayerChatActivity(playerId),
                    ["social_engagement"] = GetPlayerSocialEngagement(playerId)
                },
                TeamId = GetPlayerTeamId(playerId),
                Message = ""
            };
            
            _aiService.RequestSocialAI(playerId, context, (response) => {
                if (response != null)
                {
                    ApplySocialBehaviorAnalysis(response);
                }
            });
        }
        
        private void ApplyTeamMatchmaking(SocialAIResponse response)
        {
            // Apply team matchmaking from AI
            if (!string.IsNullOrEmpty(response.TeamMatch))
            {
                Debug.Log($"AI Team Match: {response.TeamMatch}");
            }
            
            if (response.SocialRecommendations != null)
            {
                foreach (var recommendation in response.SocialRecommendations)
                {
                    Debug.Log($"Social AI Recommendation: {recommendation}");
                }
            }
        }
        
        private void ApplyChatModeration(SocialAIResponse response)
        {
            // Apply chat moderation from AI
            if (!string.IsNullOrEmpty(response.Message))
            {
                Debug.Log($"AI Chat Moderation: {response.Message}");
            }
        }
        
        private void ApplySocialRecommendations(SocialAIResponse response)
        {
            // Apply social recommendations from AI
            if (!string.IsNullOrEmpty(response.FriendRecommendation))
            {
                Debug.Log($"AI Friend Recommendation: {response.FriendRecommendation}");
            }
            
            if (!string.IsNullOrEmpty(response.EventRecommendation))
            {
                Debug.Log($"AI Event Recommendation: {response.EventRecommendation}");
            }
        }
        
        private void ApplySocialOptimizations(SocialAIResponse response)
        {
            // Apply social optimizations from AI
            Debug.Log("AI Social Optimizations Applied");
        }
        
        private void ApplySocialBehaviorAnalysis(SocialAIResponse response)
        {
            // Apply social behavior analysis from AI
            Debug.Log("AI Social Behavior Analysis Applied");
        }
        
        // Helper methods for social data
        private int GetPlayerLevel(string playerId)
        {
            // Get player level
            return 1; // Simplified
        }
        
        private float GetPlayerActivityLevel(string playerId)
        {
            // Get player activity level
            return 0.5f; // Simplified
        }
        
        private string GetPlayerTeamId(string playerId)
        {
            // Get player team ID
            var team = GetPlayerTeam(playerId);
            return team?.id ?? "";
        }
        
        private Dictionary<string, object> GetPlayerPreferences(string playerId)
        {
            // Get player preferences
            return new Dictionary<string, object>();
        }
        
        private Dictionary<string, object> GetPlayerSocialHistory(string playerId)
        {
            // Get player social history
            return new Dictionary<string, object>();
        }
        
        private Dictionary<string, object> GetPlayerActivityPatterns(string playerId)
        {
            // Get player activity patterns
            return new Dictionary<string, object>();
        }
        
        private Dictionary<string, object> GetEngagementMetrics()
        {
            // Get engagement metrics
            return new Dictionary<string, object>
            {
                ["total_teams"] = teams.Count,
                ["active_players"] = _teamMemberLookup.Count,
                ["engagement_score"] = 0.7f
            };
        }
        
        private Dictionary<string, object> GetPlayerTeamInteractions(string playerId)
        {
            // Get player team interactions
            return new Dictionary<string, object>();
        }
        
        private Dictionary<string, object> GetPlayerChatActivity(string playerId)
        {
            // Get player chat activity
            return new Dictionary<string, object>();
        }
        
        private Dictionary<string, object> GetPlayerSocialEngagement(string playerId)
        {
            // Get player social engagement
            return new Dictionary<string, object>();
        }
        
        private void ShowTeamRecommendations(List<TeamMatch> matches)
        {
            // Show team recommendations to the player
            foreach (var match in matches)
            {
                Debug.Log($"Recommended team: {match.TeamName} (Match score: {match.MatchScore:F2})");
            }
        }
        
        private void ApplyModerationResult(ChatModerationResult result)
        {
            // Apply chat moderation result
            if (result.IsApproved)
            {
                // Message is approved
                Debug.Log("Message approved by AI moderation");
            }
            else
            {
                // Message is rejected or flagged
                Debug.Log($"Message rejected: {result.Reason}");
            }
        }
        
        private void ShowSocialRecommendations(List<SocialRecommendation> recommendations)
        {
            // Show social recommendations to the player
            foreach (var recommendation in recommendations)
            {
                Debug.Log($"Social recommendation: {recommendation.Type} - {recommendation.Description}");
            }
        }
        
        #endregion

        void OnDestroy()
        {
            SaveSocialData();
        }
    }
    
    [System.Serializable]
    public class SocialSaveData
    {
        public List<Team> teams;
        public List<Leaderboard> leaderboards;
        public List<SocialEvent> socialEvents;
        public List<ChatMessage> chatMessages;
        public List<Gift> gifts;
    }
}

#region AI Social System Classes

public class AISocialMatchmakingEngine
{
    private SocialSystem _socialSystem;
    private Dictionary<string, PlayerSocialProfile> _playerProfiles;
    
    public void Initialize(SocialSystem socialSystem)
    {
        _socialSystem = socialSystem;
        _playerProfiles = new Dictionary<string, PlayerSocialProfile>();
    }
    
    public List<TeamMatch> FindOptimalMatches(string playerId)
    {
        if (!_playerProfiles.ContainsKey(playerId))
        {
            _playerProfiles[playerId] = new PlayerSocialProfile();
        }
        
        var playerProfile = _playerProfiles[playerId];
        var matches = new List<TeamMatch>();
        
        // Find optimal team matches based on player profile
        var availableTeams = _socialSystem.GetAvailableTeams(playerId);
        
        foreach (var team in availableTeams)
        {
            var matchScore = CalculateMatchScore(playerProfile, team);
            if (matchScore > 0.6f) // Minimum match threshold
            {
                matches.Add(new TeamMatch
                {
                    TeamId = team.id,
                    TeamName = team.name,
                    MatchScore = matchScore,
                    Reasons = GetMatchReasons(playerProfile, team)
                });
            }
        }
        
        // Sort by match score
        matches.Sort((a, b) => b.MatchScore.CompareTo(a.MatchScore));
        
        return matches.Take(5).ToList(); // Return top 5 matches
    }
    
    private float CalculateMatchScore(PlayerSocialProfile playerProfile, Team team)
    {
        float score = 0f;
        
        // Calculate compatibility based on various factors
        score += CalculateLevelCompatibility(playerProfile, team);
        score += CalculatePlayStyleCompatibility(playerProfile, team);
        score += CalculateActivityCompatibility(playerProfile, team);
        score += CalculateLanguageCompatibility(playerProfile, team);
        
        return score / 4f; // Average of all factors
    }
    
    private float CalculateLevelCompatibility(PlayerSocialProfile playerProfile, Team team)
    {
        // Calculate compatibility based on player level
        var levelDiff = Mathf.Abs(playerProfile.Level - team.level);
        return Mathf.Clamp01(1f - levelDiff / 10f);
    }
    
    private float CalculatePlayStyleCompatibility(PlayerSocialProfile playerProfile, Team team)
    {
        // Calculate compatibility based on play style
        return 0.8f; // Simplified
    }
    
    private float CalculateActivityCompatibility(PlayerSocialProfile playerProfile, Team team)
    {
        // Calculate compatibility based on activity patterns
        return 0.7f; // Simplified
    }
    
    private float CalculateLanguageCompatibility(PlayerSocialProfile playerProfile, Team team)
    {
        // Calculate compatibility based on language preferences
        return playerProfile.Language == team.language ? 1f : 0.5f;
    }
    
    private List<string> GetMatchReasons(PlayerSocialProfile playerProfile, Team team)
    {
        var reasons = new List<string>();
        
        if (Mathf.Abs(playerProfile.Level - team.level) <= 2)
        {
            reasons.Add("Similar level");
        }
        
        if (playerProfile.Language == team.language)
        {
            reasons.Add("Same language");
        }
        
        if (team.memberIds.Count < team.maxMembers * 0.8f)
        {
            reasons.Add("Active team");
        }
        
        return reasons;
    }
}

public class AIChatModerationSystem
{
    private SocialSystem _socialSystem;
    private Dictionary<string, ChatModerationProfile> _moderationProfiles;
    
    public void Initialize(SocialSystem socialSystem)
    {
        _socialSystem = socialSystem;
        _moderationProfiles = new Dictionary<string, ChatModerationProfile>();
    }
    
    public ChatModerationResult ModerateMessage(string message, string senderId)
    {
        if (!_moderationProfiles.ContainsKey(senderId))
        {
            _moderationProfiles[senderId] = new ChatModerationProfile();
        }
        
        var profile = _moderationProfiles[senderId];
        var result = new ChatModerationResult();
        
        // Analyze message content
        result.IsApproved = AnalyzeMessageContent(message, profile);
        result.Confidence = CalculateModerationConfidence(message, profile);
        result.Reason = GetModerationReason(message, profile);
        
        // Update profile based on result
        UpdateModerationProfile(profile, message, result);
        
        return result;
    }
    
    private bool AnalyzeMessageContent(string message, ChatModerationProfile profile)
    {
        // Analyze message for inappropriate content
        var inappropriateWords = new string[] { "spam", "hate", "abuse" }; // Simplified
        
        foreach (var word in inappropriateWords)
        {
            if (message.ToLower().Contains(word))
            {
                return false;
            }
        }
        
        // Check message length
        if (message.Length > 500)
        {
            return false;
        }
        
        // Check for excessive caps
        var capsCount = message.Count(c => char.IsUpper(c));
        if (capsCount > message.Length * 0.7f)
        {
            return false;
        }
        
        return true;
    }
    
    private float CalculateModerationConfidence(string message, ChatModerationProfile profile)
    {
        // Calculate confidence in moderation decision
        var confidence = 0.8f;
        
        // Adjust based on sender history
        if (profile.ViolationCount > 0)
        {
            confidence += 0.1f;
        }
        
        // Adjust based on message characteristics
        if (message.Length < 10)
        {
            confidence -= 0.1f;
        }
        
        return Mathf.Clamp01(confidence);
    }
    
    private string GetModerationReason(string message, ChatModerationProfile profile)
    {
        if (message.Length > 500)
        {
            return "Message too long";
        }
        
        var capsCount = message.Count(c => char.IsUpper(c));
        if (capsCount > message.Length * 0.7f)
        {
            return "Excessive caps";
        }
        
        return "Message approved";
    }
    
    private void UpdateModerationProfile(ChatModerationProfile profile, string message, ChatModerationResult result)
    {
        profile.MessageCount++;
        
        if (!result.IsApproved)
        {
            profile.ViolationCount++;
        }
        
        profile.LastMessage = DateTime.Now;
    }
}

public class AISocialRecommendationEngine
{
    private SocialSystem _socialSystem;
    private Dictionary<string, SocialRecommendationProfile> _playerProfiles;
    
    public void Initialize(SocialSystem socialSystem)
    {
        _socialSystem = socialSystem;
        _playerProfiles = new Dictionary<string, SocialRecommendationProfile>();
    }
    
    public List<SocialRecommendation> GenerateRecommendations(string playerId)
    {
        if (!_playerProfiles.ContainsKey(playerId))
        {
            _playerProfiles[playerId] = new SocialRecommendationProfile();
        }
        
        var profile = _playerProfiles[playerId];
        var recommendations = new List<SocialRecommendation>();
        
        // Generate team recommendations
        var teamRecommendations = GenerateTeamRecommendations(playerId, profile);
        recommendations.AddRange(teamRecommendations);
        
        // Generate friend recommendations
        var friendRecommendations = GenerateFriendRecommendations(playerId, profile);
        recommendations.AddRange(friendRecommendations);
        
        // Generate event recommendations
        var eventRecommendations = GenerateEventRecommendations(playerId, profile);
        recommendations.AddRange(eventRecommendations);
        
        return recommendations;
    }
    
    private List<SocialRecommendation> GenerateTeamRecommendations(string playerId, SocialRecommendationProfile profile)
    {
        var recommendations = new List<SocialRecommendation>();
        
        // Find teams that match player preferences
        var availableTeams = _socialSystem.GetAvailableTeams(playerId);
        
        foreach (var team in availableTeams.Take(3))
        {
            recommendations.Add(new SocialRecommendation
            {
                Type = "Team",
                Title = $"Join {team.name}",
                Description = $"This team matches your play style and level",
                Confidence = 0.8f,
                Action = $"Join team {team.id}"
            });
        }
        
        return recommendations;
    }
    
    private List<SocialRecommendation> GenerateFriendRecommendations(string playerId, SocialRecommendationProfile profile)
    {
        var recommendations = new List<SocialRecommendation>();
        
        // Generate friend recommendations based on similar players
        recommendations.Add(new SocialRecommendation
        {
            Type = "Friend",
            Title = "Add Similar Players",
            Description = "Players with similar levels and interests",
            Confidence = 0.7f,
            Action = "View friend suggestions"
        });
        
        return recommendations;
    }
    
    private List<SocialRecommendation> GenerateEventRecommendations(string playerId, SocialRecommendationProfile profile)
    {
        var recommendations = new List<SocialRecommendation>();
        
        // Generate event recommendations
        recommendations.Add(new SocialRecommendation
        {
            Type = "Event",
            Title = "Weekly Tournament",
            Description = "Compete in this week's tournament",
            Confidence = 0.9f,
            Action = "Join tournament"
        });
        
        return recommendations;
    }
}

public class AISocialOptimizer
{
    private SocialSystem _socialSystem;
    private SocialOptimizationProfile _optimizationProfile;
    
    public void Initialize(SocialSystem socialSystem)
    {
        _socialSystem = socialSystem;
        _optimizationProfile = new SocialOptimizationProfile();
    }
    
    public void OptimizeSocialFeatures()
    {
        // Optimize social features
        OptimizeTeamMatching();
        OptimizeChatSystem();
        OptimizeLeaderboards();
        OptimizeSocialEvents();
    }
    
    private void OptimizeTeamMatching()
    {
        // Optimize team matching algorithm
        Debug.Log("Optimizing team matching");
    }
    
    private void OptimizeChatSystem()
    {
        // Optimize chat system performance
        Debug.Log("Optimizing chat system");
    }
    
    private void OptimizeLeaderboards()
    {
        // Optimize leaderboard updates
        Debug.Log("Optimizing leaderboards");
    }
    
    private void OptimizeSocialEvents()
    {
        // Optimize social events
        Debug.Log("Optimizing social events");
    }
}

public class AISocialBehaviorAnalyzer
{
    private SocialSystem _socialSystem;
    private Dictionary<string, SocialBehaviorProfile> _behaviorProfiles;
    
    public void Initialize(SocialSystem socialSystem)
    {
        _socialSystem = socialSystem;
        _behaviorProfiles = new Dictionary<string, SocialBehaviorProfile>();
    }
    
    public void AnalyzePlayerBehavior(string playerId)
    {
        if (!_behaviorProfiles.ContainsKey(playerId))
        {
            _behaviorProfiles[playerId] = new SocialBehaviorProfile();
        }
        
        var profile = _behaviorProfiles[playerId];
        AnalyzeBehavior(profile);
    }
    
    private void AnalyzeBehavior(SocialBehaviorProfile profile)
    {
        // Analyze social behavior patterns
        AnalyzeTeamBehavior(profile);
        AnalyzeChatBehavior(profile);
        AnalyzeEventBehavior(profile);
        AnalyzeGiftBehavior(profile);
    }
    
    private void AnalyzeTeamBehavior(SocialBehaviorProfile profile)
    {
        // Analyze team-related behavior
        Debug.Log("Analyzing team behavior");
    }
    
    private void AnalyzeChatBehavior(SocialBehaviorProfile profile)
    {
        // Analyze chat behavior
        Debug.Log("Analyzing chat behavior");
    }
    
    private void AnalyzeEventBehavior(SocialBehaviorProfile profile)
    {
        // Analyze event participation behavior
        Debug.Log("Analyzing event behavior");
    }
    
    private void AnalyzeGiftBehavior(SocialBehaviorProfile profile)
    {
        // Analyze gift giving/receiving behavior
        Debug.Log("Analyzing gift behavior");
    }
}

#region AI Social Data Structures

public class PlayerSocialProfile
{
    public string PlayerId;
    public int Level;
    public string Language;
    public List<string> PreferredTeamTypes;
    public List<string> PreferredPlayStyles;
    public float ActivityLevel;
    public DateTime LastActive;
}

public class TeamMatch
{
    public string TeamId;
    public string TeamName;
    public float MatchScore;
    public List<string> Reasons;
}

public class ChatModerationProfile
{
    public string PlayerId;
    public int MessageCount;
    public int ViolationCount;
    public DateTime LastMessage;
    public float TrustScore;
}

public class ChatModerationResult
{
    public bool IsApproved;
    public float Confidence;
    public string Reason;
    public DateTime Timestamp;
}

public class SocialRecommendation
{
    public string Type;
    public string Title;
    public string Description;
    public float Confidence;
    public string Action;
}

public class SocialRecommendationProfile
{
    public string PlayerId;
    public List<string> PreferredTeamTypes;
    public List<string> PreferredEventTypes;
    public List<string> PreferredFriendTypes;
    public float SocialActivityLevel;
}

public class SocialOptimizationProfile
{
    public float TeamMatchingEfficiency;
    public float ChatSystemPerformance;
    public float LeaderboardUpdateSpeed;
    public float EventEngagement;
    public bool IsOptimized;
}

public class SocialBehaviorProfile
{
    public string PlayerId;
    public TeamBehavior TeamBehavior;
    public ChatBehavior ChatBehavior;
    public EventBehavior EventBehavior;
    public GiftBehavior GiftBehavior;
    public DateTime LastAnalyzed;
}

public class TeamBehavior
{
    public int TeamsJoined;
    public int TeamsLeft;
    public float AverageTeamDuration;
    public List<string> PreferredTeamRoles;
}

public class ChatBehavior
{
    public int MessagesSent;
    public int MessagesReceived;
    public float AverageMessageLength;
    public List<string> MostUsedWords;
}

public class EventBehavior
{
    public int EventsParticipated;
    public int EventsWon;
    public float AverageEventScore;
    public List<string> PreferredEventTypes;
}

public class GiftBehavior
{
    public int GiftsSent;
    public int GiftsReceived;
    public float TotalGiftValue;
    public List<string> PreferredGiftTypes;
}

#endregion