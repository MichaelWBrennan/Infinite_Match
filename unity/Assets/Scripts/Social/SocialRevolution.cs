using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using System.Linq;

namespace Evergreen.Social
{
    [System.Serializable]
    public class SocialProfile
    {
        public string playerId;
        public string username;
        public string displayName;
        public string avatarUrl;
        public string bio;
        public int level;
        public int experience;
        public List<string> friends = new List<string>();
        public List<string> followers = new List<string>();
        public List<string> following = new List<string>();
        public List<string> blocked = new List<string>();
        public SocialStats stats = new SocialStats();
        public List<Achievement> achievements = new List<Achievement>();
        public List<Content> createdContent = new List<Content>();
        public List<Content> likedContent = new List<Content>();
        public List<Content> sharedContent = new List<Content>();
        public List<Guild> guilds = new List<Guild>();
        public List<Event> events = new List<Event>();
        public DateTime lastActive;
        public bool isOnline;
        public PrivacySettings privacy = new PrivacySettings();
    }
    
    [System.Serializable]
    public class SocialStats
    {
        public int totalLikes;
        public int totalShares;
        public int totalViews;
        public int totalContent;
        public int totalFriends;
        public int totalFollowers;
        public int totalFollowing;
        public float engagementRate;
        public float influenceScore;
        public int streakDays;
        public DateTime lastStreakDate;
    }
    
    [System.Serializable]
    public class Content
    {
        public string contentId;
        public string creatorId;
        public ContentType contentType;
        public string title;
        public string description;
        public string data; // JSON or binary data
        public List<string> tags = new List<string>();
        public List<string> likes = new List<string>();
        public List<string> shares = new List<string>();
        public List<Comment> comments = new List<Comment>();
        public int views;
        public float rating;
        public bool isPublic;
        public bool isFeatured;
        public DateTime created;
        public DateTime lastModified;
        public ContentStatus status;
        public Dictionary<string, object> metadata = new Dictionary<string, object>();
    }
    
    public enum ContentType
    {
        Level,
        Decoration,
        Artwork,
        Video,
        Screenshot,
        Guide,
        Tutorial,
        Story,
        Challenge,
        Event
    }
    
    public enum ContentStatus
    {
        Draft,
        Published,
        Featured,
        Removed,
        Flagged
    }
    
    [System.Serializable]
    public class Comment
    {
        public string commentId;
        public string authorId;
        public string content;
        public DateTime timestamp;
        public List<string> likes = new List<string>();
        public List<Comment> replies = new List<Comment>();
        public bool isEdited;
    }
    
    [System.Serializable]
    public class Guild
    {
        public string guildId;
        public string name;
        public string description;
        public string iconUrl;
        public string bannerUrl;
        public List<string> members = new List<string>();
        public List<string> admins = new List<string>();
        public string ownerId;
        public GuildType guildType;
        public int maxMembers;
        public int level;
        public int experience;
        public List<GuildAchievement> achievements = new List<GuildAchievement>();
        public List<GuildEvent> events = new List<GuildEvent>();
        public Dictionary<string, object> settings = new Dictionary<string, object>();
        public DateTime created;
        public DateTime lastActive;
    }
    
    public enum GuildType
    {
        Casual,
        Competitive,
        Creative,
        Social,
        Trading,
        Learning,
        Roleplay,
        Speedrun
    }
    
    [System.Serializable]
    public class GuildAchievement
    {
        public string achievementId;
        public string name;
        public string description;
        public DateTime unlocked;
        public Dictionary<string, object> data = new Dictionary<string, object>();
    }
    
    [System.Serializable]
    public class GuildEvent
    {
        public string eventId;
        public string name;
        public string description;
        public EventType eventType;
        public DateTime startTime;
        public DateTime endTime;
        public List<string> participants = new List<string>();
        public Dictionary<string, object> rewards = new Dictionary<string, object>();
        public bool isActive;
    }
    
    public enum EventType
    {
        Tournament,
        Contest,
        Collaboration,
        Social,
        Learning,
        Celebration,
        Challenge,
        Workshop
    }
    
    [System.Serializable]
    public class PrivacySettings
    {
        public bool showOnlineStatus;
        public bool showLastActive;
        public bool allowFriendRequests;
        public bool allowMessages;
        public bool showAchievements;
        public bool showContent;
        public bool showGuilds;
        public bool showStats;
        public List<string> blockedUsers = new List<string>();
    }
    
    [System.Serializable]
    public class CreatorEconomy
    {
        public string creatorId;
        public float totalEarnings;
        public float monthlyEarnings;
        public float weeklyEarnings;
        public int totalSales;
        public int monthlySales;
        public int weeklySales;
        public List<Transaction> transactions = new List<Transaction>();
        public List<Content> marketplaceContent = new List<Content>();
        public float commissionRate;
        public bool isVerified;
        public DateTime joinedDate;
        public DateTime lastPayout;
    }
    
    [System.Serializable]
    public class Transaction
    {
        public string transactionId;
        public string buyerId;
        public string sellerId;
        public string contentId;
        public float amount;
        public string currency;
        public TransactionType type;
        public DateTime timestamp;
        public Dictionary<string, object> metadata = new Dictionary<string, object>();
    }
    
    public enum TransactionType
    {
        Purchase,
        Sale,
        Commission,
        Tip,
        Reward,
        Refund
    }
    
    public class SocialRevolution : MonoBehaviour
    {
        [Header("Social Settings")]
        public bool enableSocialFeatures = true;
        public bool enableCreatorEconomy = true;
        public bool enableGuildSystem = true;
        public bool enableContentSharing = true;
        public bool enableLiveStreaming = true;
        
        [Header("Creator Economy Settings")]
        public float platformCommissionRate = 0.1f; // 10%
        public float minimumPayout = 10f;
        public string supportedCurrency = "USD";
        public bool enableNFTs = true;
        public bool enableCryptocurrency = true;
        
        [Header("Content Settings")]
        public int maxContentPerUser = 1000;
        public int maxFileSize = 100; // MB
        public List<string> allowedFileTypes = new List<string> { "png", "jpg", "mp4", "json", "txt" };
        public bool enableContentModeration = true;
        
        [Header("Guild Settings")]
        public int maxGuildsPerUser = 5;
        public int maxGuildMembers = 100;
        public int maxGuildAdmins = 10;
        public bool enableGuildChat = true;
        public bool enableGuildEvents = true;
        
        public static SocialRevolution Instance { get; private set; }
        
        private Dictionary<string, SocialProfile> socialProfiles = new Dictionary<string, SocialProfile>();
        private Dictionary<string, Content> contentLibrary = new Dictionary<string, Content>();
        private Dictionary<string, Guild> guilds = new Dictionary<string, Guild>();
        private Dictionary<string, CreatorEconomy> creatorEconomies = new Dictionary<string, CreatorEconomy>();
        private SocialAnalytics socialAnalytics;
        private ContentModerator contentModerator;
        private PaymentProcessor paymentProcessor;
        private LiveStreamingManager liveStreamingManager;
        private NotificationManager notificationManager;
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeSocialRevolution();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            InitializeComponents();
            LoadSocialData();
        }
        
        private void InitializeSocialRevolution()
        {
            // Initialize social analytics
            socialAnalytics = gameObject.AddComponent<SocialAnalytics>();
            
            // Initialize content moderator
            if (enableContentModeration)
            {
                contentModerator = gameObject.AddComponent<ContentModerator>();
            }
            
            // Initialize payment processor
            if (enableCreatorEconomy)
            {
                paymentProcessor = gameObject.AddComponent<PaymentProcessor>();
            }
            
            // Initialize live streaming manager
            if (enableLiveStreaming)
            {
                liveStreamingManager = gameObject.AddComponent<LiveStreamingManager>();
            }
            
            // Initialize notification manager
            notificationManager = gameObject.AddComponent<NotificationManager>();
        }
        
        private void InitializeComponents()
        {
            // Initialize all components
            if (socialAnalytics != null)
            {
                socialAnalytics.Initialize();
            }
            
            if (contentModerator != null)
            {
                contentModerator.Initialize();
            }
            
            if (paymentProcessor != null)
            {
                paymentProcessor.Initialize(platformCommissionRate, minimumPayout, supportedCurrency);
            }
            
            if (liveStreamingManager != null)
            {
                liveStreamingManager.Initialize();
            }
            
            if (notificationManager != null)
            {
                notificationManager.Initialize();
            }
        }
        
        private void LoadSocialData()
        {
            // Load social data from save system
            // This would integrate with the cloud save system
        }
        
        // Social Profile Management
        public SocialProfile CreateSocialProfile(string playerId, string username, string displayName)
        {
            var profile = new SocialProfile
            {
                playerId = playerId,
                username = username,
                displayName = displayName,
                level = 1,
                experience = 0,
                stats = new SocialStats(),
                lastActive = DateTime.Now,
                isOnline = true,
                privacy = new PrivacySettings()
            };
            
            socialProfiles[playerId] = profile;
            
            // Initialize creator economy if enabled
            if (enableCreatorEconomy)
            {
                var creatorEconomy = new CreatorEconomy
                {
                    creatorId = playerId,
                    totalEarnings = 0f,
                    monthlyEarnings = 0f,
                    weeklyEarnings = 0f,
                    totalSales = 0,
                    monthlySales = 0,
                    weeklySales = 0,
                    commissionRate = platformCommissionRate,
                    isVerified = false,
                    joinedDate = DateTime.Now
                };
                
                creatorEconomies[playerId] = creatorEconomy;
            }
            
            return profile;
        }
        
        public SocialProfile GetSocialProfile(string playerId)
        {
            return socialProfiles.ContainsKey(playerId) ? socialProfiles[playerId] : null;
        }
        
        public void UpdateSocialProfile(string playerId, Dictionary<string, object> updates)
        {
            var profile = GetSocialProfile(playerId);
            if (profile == null) return;
            
            foreach (var update in updates)
            {
                switch (update.Key)
                {
                    case "displayName":
                        profile.displayName = update.Value.ToString();
                        break;
                    case "bio":
                        profile.bio = update.Value.ToString();
                        break;
                    case "avatarUrl":
                        profile.avatarUrl = update.Value.ToString();
                        break;
                    case "privacy":
                        if (update.Value is Dictionary<string, object> privacyDict)
                        {
                            UpdatePrivacySettings(profile, privacyDict);
                        }
                        break;
                }
            }
            
            profile.lastActive = DateTime.Now;
        }
        
        private void UpdatePrivacySettings(SocialProfile profile, Dictionary<string, object> privacyDict)
        {
            foreach (var setting in privacyDict)
            {
                switch (setting.Key)
                {
                    case "showOnlineStatus":
                        profile.privacy.showOnlineStatus = (bool)setting.Value;
                        break;
                    case "showLastActive":
                        profile.privacy.showLastActive = (bool)setting.Value;
                        break;
                    case "allowFriendRequests":
                        profile.privacy.allowFriendRequests = (bool)setting.Value;
                        break;
                    case "allowMessages":
                        profile.privacy.allowMessages = (bool)setting.Value;
                        break;
                    case "showAchievements":
                        profile.privacy.showAchievements = (bool)setting.Value;
                        break;
                    case "showContent":
                        profile.privacy.showContent = (bool)setting.Value;
                        break;
                    case "showGuilds":
                        profile.privacy.showGuilds = (bool)setting.Value;
                        break;
                    case "showStats":
                        profile.privacy.showStats = (bool)setting.Value;
                        break;
                }
            }
        }
        
        // Friend System
        public bool SendFriendRequest(string fromPlayerId, string toPlayerId)
        {
            var toProfile = GetSocialProfile(toPlayerId);
            if (toProfile == null || !toProfile.privacy.allowFriendRequests) return false;
            
            // Check if already friends
            if (toProfile.friends.Contains(fromPlayerId)) return false;
            
            // Send notification
            if (notificationManager != null)
            {
                notificationManager.SendFriendRequestNotification(toPlayerId, fromPlayerId);
            }
            
            return true;
        }
        
        public bool AcceptFriendRequest(string playerId, string friendId)
        {
            var profile = GetSocialProfile(playerId);
            var friendProfile = GetSocialProfile(friendId);
            
            if (profile == null || friendProfile == null) return false;
            
            if (!profile.friends.Contains(friendId))
            {
                profile.friends.Add(friendId);
                profile.stats.totalFriends++;
            }
            
            if (!friendProfile.friends.Contains(playerId))
            {
                friendProfile.friends.Add(playerId);
                friendProfile.stats.totalFriends++;
            }
            
            return true;
        }
        
        public bool RemoveFriend(string playerId, string friendId)
        {
            var profile = GetSocialProfile(playerId);
            if (profile == null) return false;
            
            profile.friends.Remove(friendId);
            profile.stats.totalFriends = Mathf.Max(0, profile.stats.totalFriends - 1);
            
            return true;
        }
        
        // Content Creation and Sharing
        public Content CreateContent(string creatorId, ContentType contentType, string title, string description, string data, List<string> tags = null)
        {
            var profile = GetSocialProfile(creatorId);
            if (profile == null) 
            {
                Debug.LogError($"SocialRevolution: Profile not found for creator {creatorId}");
                return null;
            }
            
            // Check content limit
            if (profile.createdContent.Count >= maxContentPerUser) 
            {
                Debug.LogWarning($"SocialRevolution: Content limit reached for user {creatorId}");
                return null;
            }
            
            var content = new Content
            {
                contentId = Guid.NewGuid().ToString(),
                creatorId = creatorId,
                contentType = contentType,
                title = title,
                description = description,
                data = data,
                tags = tags ?? new List<string>(),
                views = 0,
                rating = 0f,
                isPublic = true,
                isFeatured = false,
                created = DateTime.Now,
                lastModified = DateTime.Now,
                status = ContentStatus.Published
            };
            
            // Moderate content if enabled
            if (enableContentModeration && contentModerator != null)
            {
                content.status = contentModerator.ModerateContent(content);
            }
            
            contentLibrary[content.contentId] = content;
            profile.createdContent.Add(content);
            
            // Update creator economy
            if (enableCreatorEconomy && creatorEconomies.ContainsKey(creatorId))
            {
                creatorEconomies[creatorId].marketplaceContent.Add(content);
            }
            
            return content;
        }
        
        public Content GetContent(string contentId)
        {
            return contentLibrary.ContainsKey(contentId) ? contentLibrary[contentId] : null;
        }
        
        public List<Content> GetContentByCreator(string creatorId, int limit = 20)
        {
            return contentLibrary.Values
                .Where(c => c.creatorId == creatorId && c.isPublic)
                .OrderByDescending(c => c.created)
                .Take(limit)
                .ToList();
        }
        
        public List<Content> GetFeaturedContent(int limit = 20)
        {
            return contentLibrary.Values
                .Where(c => c.isFeatured && c.isPublic)
                .OrderByDescending(c => c.rating)
                .Take(limit)
                .ToList();
        }
        
        public List<Content> SearchContent(string query, List<string> tags = null, ContentType? contentType = null, int limit = 20)
        {
            var results = contentLibrary.Values.Where(c => c.isPublic);
            
            if (!string.IsNullOrEmpty(query))
            {
                results = results.Where(c => 
                    c.title.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                    c.description.Contains(query, StringComparison.OrdinalIgnoreCase));
            }
            
            if (tags != null && tags.Count > 0)
            {
                results = results.Where(c => tags.Any(tag => c.tags.Contains(tag)));
            }
            
            if (contentType.HasValue)
            {
                results = results.Where(c => c.contentType == contentType.Value);
            }
            
            return results
                .OrderByDescending(c => c.rating)
                .ThenByDescending(c => c.views)
                .Take(limit)
                .ToList();
        }
        
        // Content Interaction
        public bool LikeContent(string playerId, string contentId)
        {
            var content = GetContent(contentId);
            if (content == null) return false;
            
            if (!content.likes.Contains(playerId))
            {
                content.likes.Add(playerId);
                
                // Update creator stats
                var creatorProfile = GetSocialProfile(content.creatorId);
                if (creatorProfile != null)
                {
                    creatorProfile.stats.totalLikes++;
                }
                
                // Update content rating
                content.rating = CalculateContentRating(content);
            }
            
            return true;
        }
        
        public bool ShareContent(string playerId, string contentId)
        {
            var content = GetContent(contentId);
            if (content == null) return false;
            
            if (!content.shares.Contains(playerId))
            {
                content.shares.Add(playerId);
                
                // Update creator stats
                var creatorProfile = GetSocialProfile(content.creatorId);
                if (creatorProfile != null)
                {
                    creatorProfile.stats.totalShares++;
                }
            }
            
            return true;
        }
        
        public bool ViewContent(string playerId, string contentId)
        {
            var content = GetContent(contentId);
            if (content == null) return false;
            
            content.views++;
            
            // Update creator stats
            var creatorProfile = GetSocialProfile(content.creatorId);
            if (creatorProfile != null)
            {
                creatorProfile.stats.totalViews++;
            }
            
            return true;
        }
        
        public Comment AddComment(string playerId, string contentId, string commentText, string parentCommentId = null)
        {
            var content = GetContent(contentId);
            if (content == null) 
            {
                Debug.LogError($"SocialRevolution: Content not found for ID {contentId}");
                return null;
            }
            
            var comment = new Comment
            {
                commentId = Guid.NewGuid().ToString(),
                authorId = playerId,
                content = commentText,
                timestamp = DateTime.Now,
                isEdited = false
            };
            
            if (string.IsNullOrEmpty(parentCommentId))
            {
                content.comments.Add(comment);
            }
            else
            {
                var parentComment = FindComment(content.comments, parentCommentId);
                if (parentComment != null)
                {
                    parentComment.replies.Add(comment);
                }
            }
            
            return comment;
        }
        
        private Comment FindComment(List<Comment> comments, string commentId)
        {
            foreach (var comment in comments)
            {
                if (comment.commentId == commentId) return comment;
                
                var found = FindComment(comment.replies, commentId);
                if (found != null) return found;
            }
            
            return null;
        }
        
        private float CalculateContentRating(Content content)
        {
            if (content.likes.Count == 0) return 0f;
            
            var engagementScore = (content.likes.Count * 1f + content.shares.Count * 2f + content.views * 0.1f) / 100f;
            return Mathf.Clamp01(engagementScore);
        }
        
        // Guild System
        public Guild CreateGuild(string ownerId, string name, string description, GuildType guildType)
        {
            var profile = GetSocialProfile(ownerId);
            if (profile == null) 
            {
                Debug.LogError($"SocialRevolution: Profile not found for owner {ownerId}");
                return null;
            }
            
            // Check guild limit
            if (profile.guilds.Count >= maxGuildsPerUser) 
            {
                Debug.LogWarning($"SocialRevolution: Guild limit reached for user {ownerId}");
                return null;
            }
            
            var guild = new Guild
            {
                guildId = Guid.NewGuid().ToString(),
                name = name,
                description = description,
                ownerId = ownerId,
                guildType = guildType,
                maxMembers = maxGuildMembers,
                level = 1,
                experience = 0,
                created = DateTime.Now,
                lastActive = DateTime.Now
            };
            
            guild.members.Add(ownerId);
            guild.admins.Add(ownerId);
            
            guilds[guild.guildId] = guild;
            profile.guilds.Add(guild);
            
            return guild;
        }
        
        public bool JoinGuild(string playerId, string guildId)
        {
            var guild = GetGuild(guildId);
            var profile = GetSocialProfile(playerId);
            
            if (guild == null || profile == null) return false;
            if (guild.members.Count >= guild.maxMembers) return false;
            if (guild.members.Contains(playerId)) return false;
            
            guild.members.Add(playerId);
            profile.guilds.Add(guild);
            
            return true;
        }
        
        public bool LeaveGuild(string playerId, string guildId)
        {
            var guild = GetGuild(guildId);
            var profile = GetSocialProfile(playerId);
            
            if (guild == null || profile == null) return false;
            if (guild.ownerId == playerId) return false; // Owner can't leave
            
            guild.members.Remove(playerId);
            guild.admins.Remove(playerId);
            profile.guilds.Remove(guild);
            
            return true;
        }
        
        public Guild GetGuild(string guildId)
        {
            return guilds.ContainsKey(guildId) ? guilds[guildId] : null;
        }
        
        public List<Guild> SearchGuilds(string query, GuildType? guildType = null, int limit = 20)
        {
            var results = guilds.Values.AsEnumerable();
            
            if (!string.IsNullOrEmpty(query))
            {
                results = results.Where(g => 
                    g.name.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                    g.description.Contains(query, StringComparison.OrdinalIgnoreCase));
            }
            
            if (guildType.HasValue)
            {
                results = results.Where(g => g.guildType == guildType.Value);
            }
            
            return results
                .OrderByDescending(g => g.members.Count)
                .ThenByDescending(g => g.level)
                .Take(limit)
                .ToList();
        }
        
        // Creator Economy
        public bool PurchaseContent(string buyerId, string contentId, float amount)
        {
            var content = GetContent(contentId);
            if (content == null) return false;
            
            var buyerProfile = GetSocialProfile(buyerId);
            var creatorEconomy = creatorEconomies.ContainsKey(content.creatorId) ? creatorEconomies[content.creatorId] : null;
            
            if (buyerProfile == null || creatorEconomy == null) return false;
            
            // Process payment
            if (paymentProcessor != null)
            {
                var success = paymentProcessor.ProcessPayment(buyerId, content.creatorId, amount, contentId);
                if (!success) return false;
            }
            
            // Create transaction
            var transaction = new Transaction
            {
                transactionId = Guid.NewGuid().ToString(),
                buyerId = buyerId,
                sellerId = content.creatorId,
                contentId = contentId,
                amount = amount,
                currency = supportedCurrency,
                type = TransactionType.Purchase,
                timestamp = DateTime.Now
            };
            
            creatorEconomy.transactions.Add(transaction);
            creatorEconomy.totalEarnings += amount;
            creatorEconomy.monthlyEarnings += amount;
            creatorEconomy.weeklyEarnings += amount;
            creatorEconomy.totalSales++;
            creatorEconomy.monthlySales++;
            creatorEconomy.weeklySales++;
            
            return true;
        }
        
        public float GetCreatorEarnings(string creatorId)
        {
            var creatorEconomy = creatorEconomies.ContainsKey(creatorId) ? creatorEconomies[creatorId] : null;
            return creatorEconomy?.totalEarnings ?? 0f;
        }
        
        public List<Transaction> GetCreatorTransactions(string creatorId, int limit = 50)
        {
            var creatorEconomy = creatorEconomies.ContainsKey(creatorId) ? creatorEconomies[creatorId] : null;
            if (creatorEconomy == null) return new List<Transaction>();
            
            return creatorEconomy.transactions
                .OrderByDescending(t => t.timestamp)
                .Take(limit)
                .ToList();
        }
        
        // Live Streaming
        public bool StartLiveStream(string playerId, string title, string description)
        {
            if (!enableLiveStreaming || liveStreamingManager == null) return false;
            
            return liveStreamingManager.StartStream(playerId, title, description);
        }
        
        public bool StopLiveStream(string playerId)
        {
            if (!enableLiveStreaming || liveStreamingManager == null) return false;
            
            return liveStreamingManager.StopStream(playerId);
        }
        
        public bool JoinLiveStream(string viewerId, string streamerId)
        {
            if (!enableLiveStreaming || liveStreamingManager == null) return false;
            
            return liveStreamingManager.JoinStream(viewerId, streamerId);
        }
        
        // Analytics
        public Dictionary<string, object> GetSocialAnalytics(string playerId)
        {
            if (socialAnalytics == null) return new Dictionary<string, object>();
            
            return socialAnalytics.GetPlayerAnalytics(playerId);
        }
        
        public Dictionary<string, object> GetContentAnalytics(string contentId)
        {
            if (socialAnalytics == null) return new Dictionary<string, object>();
            
            return socialAnalytics.GetContentAnalytics(contentId);
        }
        
        public Dictionary<string, object> GetGuildAnalytics(string guildId)
        {
            if (socialAnalytics == null) return new Dictionary<string, object>();
            
            return socialAnalytics.GetGuildAnalytics(guildId);
        }
        
        // Utility Methods
        public List<SocialProfile> GetOnlineFriends(string playerId)
        {
            var profile = GetSocialProfile(playerId);
            if (profile == null) return new List<SocialProfile>();
            
            return profile.friends
                .Select(friendId => GetSocialProfile(friendId))
                .Where(friend => friend != null && friend.isOnline)
                .ToList();
        }
        
        public List<Content> GetFeed(string playerId, int limit = 20)
        {
            var profile = GetSocialProfile(playerId);
            if (profile == null) return new List<Content>();
            
            var friendIds = profile.friends;
            var guildIds = profile.guilds.Select(g => g.guildId).ToList();
            
            return contentLibrary.Values
                .Where(c => c.isPublic && (
                    friendIds.Contains(c.creatorId) ||
                    guildIds.Any(guildId => guilds.ContainsKey(guildId) && guilds[guildId].members.Contains(c.creatorId))
                ))
                .OrderByDescending(c => c.created)
                .Take(limit)
                .ToList();
        }
        
        public void UpdatePlayerStatus(string playerId, bool isOnline)
        {
            var profile = GetSocialProfile(playerId);
            if (profile == null) return;
            
            profile.isOnline = isOnline;
            profile.lastActive = DateTime.Now;
        }
        
        private void SaveSocialData()
        {
            // Save social data to cloud save system
            // This would integrate with the existing cloud save system
        }
    }
    
    // Supporting classes
    public class SocialAnalytics : MonoBehaviour
    {
        public void Initialize() { }
        public Dictionary<string, object> GetPlayerAnalytics(string playerId) { return new Dictionary<string, object>(); }
        public Dictionary<string, object> GetContentAnalytics(string contentId) { return new Dictionary<string, object>(); }
        public Dictionary<string, object> GetGuildAnalytics(string guildId) { return new Dictionary<string, object>(); }
    }
    
    public class ContentModerator : MonoBehaviour
    {
        public void Initialize() { }
        public ContentStatus ModerateContent(Content content) { return ContentStatus.Published; }
    }
    
    public class PaymentProcessor : MonoBehaviour
    {
        public void Initialize(float commissionRate, float minimumPayout, string currency) { }
        public bool ProcessPayment(string buyerId, string sellerId, float amount, string contentId) { return true; }
    }
    
    public class LiveStreamingManager : MonoBehaviour
    {
        public void Initialize() { }
        public bool StartStream(string playerId, string title, string description) { return true; }
        public bool StopStream(string playerId) { return true; }
        public bool JoinStream(string viewerId, string streamerId) { return true; }
    }
    
    public class NotificationManager : MonoBehaviour
    {
        public void Initialize() { }
        public void SendFriendRequestNotification(string toPlayerId, string fromPlayerId) { }
    }
}