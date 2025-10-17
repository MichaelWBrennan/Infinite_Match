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
        
        private Dictionary<string, Team> _teamLookup = new Dictionary<string, Team>();
        private Dictionary<string, TeamMember> _teamMemberLookup = new Dictionary<string, TeamMember>();
        private Dictionary<string, Leaderboard> _leaderboardLookup = new Dictionary<string, Leaderboard>();
        private Dictionary<string, SocialEvent> _socialEventLookup = new Dictionary<string, SocialEvent>();
        private Dictionary<string, List<ChatMessage>> _teamChatLookup = new Dictionary<string, List<ChatMessage>>();
        private Dictionary<string, List<Gift>> _playerGiftsLookup = new Dictionary<string, List<Gift>>();
        
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