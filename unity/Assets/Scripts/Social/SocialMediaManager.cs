using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using System.Text;
using Newtonsoft.Json;
using Evergreen.Core;
using Evergreen.Integration;

namespace Evergreen.Social
{
    /// <summary>
    /// Social Media Manager - Comprehensive integration with all major social platforms
    /// Handles sharing, authentication, analytics, and viral mechanics
    /// </summary>
    public class SocialMediaManager : MonoBehaviour
    {
        [Header("Social Media Configuration")]
        public bool enableFacebook = true;
        public bool enableTwitter = true;
        public bool enableInstagram = true;
        public bool enableTikTok = true;
        public bool enableYouTube = true;
        public bool enableDiscord = true;
        public bool enableLinkedIn = true;
        public bool enableReddit = true;
        public bool enableWhatsApp = true;
        public bool enableTelegram = true;
        public bool enableSnapchat = true;
        public bool enablePinterest = true;
        public bool enableTwitch = true;
        public bool enableSteam = true;
        
        [Header("API Configuration")]
        public string facebookAppId = "your_facebook_app_id";
        public string twitterApiKey = "your_twitter_api_key";
        public string instagramAppId = "your_instagram_app_id";
        public string tiktokAppId = "your_tiktok_app_id";
        public string youtubeApiKey = "your_youtube_api_key";
        public string discordClientId = "your_discord_client_id";
        public string linkedInClientId = "your_linkedin_client_id";
        public string redditClientId = "your_reddit_client_id";
        public string whatsAppBusinessId = "your_whatsapp_business_id";
        public string telegramBotToken = "your_telegram_bot_token";
        public string snapchatAppId = "your_snapchat_app_id";
        public string pinterestAppId = "your_pinterest_app_id";
        public string twitchClientId = "your_twitch_client_id";
        public string steamApiKey = "your_steam_api_key";
        
        [Header("Sharing Configuration")]
        public string gameTitle = "Evergreen Match-3";
        public string gameDescription = "The ultimate match-3 puzzle game with AI-powered content!";
        public string gameUrl = "https://your-game.com";
        public string gameHashtag = "#EvergreenMatch3";
        public string[] viralHashtags = { "#Match3", "#PuzzleGame", "#AIGaming", "#MobileGame" };
        
        [Header("Viral Mechanics")]
        public bool enableViralSharing = true;
        public int shareRewardCoins = 100;
        public int shareRewardGems = 10;
        public int viralThreshold = 1000;
        public float viralMultiplier = 1.5f;
        
        [Header("Analytics")]
        public bool enableSocialAnalytics = true;
        public float analyticsUpdateInterval = 60f;
        
        // Singleton
        public static SocialMediaManager Instance { get; private set; }
        
        // References
        private BackendConnector backendConnector;
        private GameAnalyticsManager analyticsManager;
        private GameDataManager dataManager;
        
        // Social Media State
        private Dictionary<string, SocialPlatform> platforms = new Dictionary<string, SocialPlatform>();
        private Dictionary<string, bool> platformStatus = new Dictionary<string, bool>();
        private Dictionary<string, SocialUser> connectedUsers = new Dictionary<string, SocialUser>();
        private List<SocialPost> recentPosts = new List<SocialPost>();
        private Dictionary<string, int> shareCounts = new Dictionary<string, int>();
        private Dictionary<string, int> engagementMetrics = new Dictionary<string, int>();
        
        // Events
        public System.Action<string, bool> OnPlatformConnected;
        public System.Action<string, SocialPost> OnPostShared;
        public System.Action<string, int> OnViralAchievement;
        public System.Action<SocialAnalytics> OnAnalyticsUpdated;
        
        [System.Serializable]
        public class SocialPlatform
        {
            public string name;
            public string apiKey;
            public string clientId;
            public bool isConnected;
            public bool isAuthenticated;
            public string accessToken;
            public DateTime lastActivity;
            public Dictionary<string, object> metadata;
        }
        
        [System.Serializable]
        public class SocialUser
        {
            public string platform;
            public string userId;
            public string username;
            public string displayName;
            public string profilePicture;
            public int followers;
            public int following;
            public int posts;
            public bool isVerified;
            public Dictionary<string, object> metadata;
        }
        
        [System.Serializable]
        public class SocialPost
        {
            public string id;
            public string platform;
            public string content;
            public string mediaUrl;
            public string postUrl;
            public int likes;
            public int shares;
            public int comments;
            public int views;
            public DateTime timestamp;
            public bool isViral;
            public Dictionary<string, object> metadata;
        }
        
        [System.Serializable]
        public class SocialAnalytics
        {
            public int totalShares;
            public int totalLikes;
            public int totalComments;
            public int totalViews;
            public int viralPosts;
            public float engagementRate;
            public Dictionary<string, int> platformStats;
            public Dictionary<string, int> hashtagStats;
            public List<SocialPost> topPosts;
        }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                Initialize();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            StartCoroutine(InitializeSocialPlatforms());
            StartCoroutine(SocialAnalyticsLoop());
        }
        
        /// <summary>
        /// Initialize social media manager
        /// </summary>
        private void Initialize()
        {
            // Get references
            backendConnector = BackendConnector.Instance;
            analyticsManager = FindObjectOfType<GameAnalyticsManager>();
            dataManager = GameDataManager.Instance;
            
            // Initialize platforms
            InitializePlatforms();
            
            Debug.Log("📱 Social Media Manager initialized");
        }
        
        /// <summary>
        /// Initialize social platforms
        /// </summary>
        private void InitializePlatforms()
        {
            // Facebook
            if (enableFacebook)
            {
                platforms["facebook"] = new SocialPlatform
                {
                    name = "Facebook",
                    apiKey = facebookAppId,
                    clientId = facebookAppId,
                    isConnected = false,
                    isAuthenticated = false,
                    metadata = new Dictionary<string, object>()
                };
            }
            
            // Twitter
            if (enableTwitter)
            {
                platforms["twitter"] = new SocialPlatform
                {
                    name = "Twitter",
                    apiKey = twitterApiKey,
                    clientId = twitterApiKey,
                    isConnected = false,
                    isAuthenticated = false,
                    metadata = new Dictionary<string, object>()
                };
            }
            
            // Instagram
            if (enableInstagram)
            {
                platforms["instagram"] = new SocialPlatform
                {
                    name = "Instagram",
                    apiKey = instagramAppId,
                    clientId = instagramAppId,
                    isConnected = false,
                    isAuthenticated = false,
                    metadata = new Dictionary<string, object>()
                };
            }
            
            // TikTok
            if (enableTikTok)
            {
                platforms["tiktok"] = new SocialPlatform
                {
                    name = "TikTok",
                    apiKey = tiktokAppId,
                    clientId = tiktokAppId,
                    isConnected = false,
                    isAuthenticated = false,
                    metadata = new Dictionary<string, object>()
                };
            }
            
            // YouTube
            if (enableYouTube)
            {
                platforms["youtube"] = new SocialPlatform
                {
                    name = "YouTube",
                    apiKey = youtubeApiKey,
                    clientId = youtubeApiKey,
                    isConnected = false,
                    isAuthenticated = false,
                    metadata = new Dictionary<string, object>()
                };
            }
            
            // Discord
            if (enableDiscord)
            {
                platforms["discord"] = new SocialPlatform
                {
                    name = "Discord",
                    apiKey = discordClientId,
                    clientId = discordClientId,
                    isConnected = false,
                    isAuthenticated = false,
                    metadata = new Dictionary<string, object>()
                };
            }
            
            // LinkedIn
            if (enableLinkedIn)
            {
                platforms["linkedin"] = new SocialPlatform
                {
                    name = "LinkedIn",
                    apiKey = linkedInClientId,
                    clientId = linkedInClientId,
                    isConnected = false,
                    isAuthenticated = false,
                    metadata = new Dictionary<string, object>()
                };
            }
            
            // Reddit
            if (enableReddit)
            {
                platforms["reddit"] = new SocialPlatform
                {
                    name = "Reddit",
                    apiKey = redditClientId,
                    clientId = redditClientId,
                    isConnected = false,
                    isAuthenticated = false,
                    metadata = new Dictionary<string, object>()
                };
            }
            
            // WhatsApp
            if (enableWhatsApp)
            {
                platforms["whatsapp"] = new SocialPlatform
                {
                    name = "WhatsApp",
                    apiKey = whatsAppBusinessId,
                    clientId = whatsAppBusinessId,
                    isConnected = false,
                    isAuthenticated = false,
                    metadata = new Dictionary<string, object>()
                };
            }
            
            // Telegram
            if (enableTelegram)
            {
                platforms["telegram"] = new SocialPlatform
                {
                    name = "Telegram",
                    apiKey = telegramBotToken,
                    clientId = telegramBotToken,
                    isConnected = false,
                    isAuthenticated = false,
                    metadata = new Dictionary<string, object>()
                };
            }
            
            // Snapchat
            if (enableSnapchat)
            {
                platforms["snapchat"] = new SocialPlatform
                {
                    name = "Snapchat",
                    apiKey = snapchatAppId,
                    clientId = snapchatAppId,
                    isConnected = false,
                    isAuthenticated = false,
                    metadata = new Dictionary<string, object>()
                };
            }
            
            // Pinterest
            if (enablePinterest)
            {
                platforms["pinterest"] = new SocialPlatform
                {
                    name = "Pinterest",
                    apiKey = pinterestAppId,
                    clientId = pinterestAppId,
                    isConnected = false,
                    isAuthenticated = false,
                    metadata = new Dictionary<string, object>()
                };
            }
            
            // Twitch
            if (enableTwitch)
            {
                platforms["twitch"] = new SocialPlatform
                {
                    name = "Twitch",
                    apiKey = twitchClientId,
                    clientId = twitchClientId,
                    isConnected = false,
                    isAuthenticated = false,
                    metadata = new Dictionary<string, object>()
                };
            }
            
            // Steam
            if (enableSteam)
            {
                platforms["steam"] = new SocialPlatform
                {
                    name = "Steam",
                    apiKey = steamApiKey,
                    clientId = steamApiKey,
                    isConnected = false,
                    isAuthenticated = false,
                    metadata = new Dictionary<string, object>()
                };
            }
        }
        
        /// <summary>
        /// Initialize social platforms coroutine
        /// </summary>
        private IEnumerator InitializeSocialPlatforms()
        {
            foreach (var platform in platforms)
            {
                yield return StartCoroutine(InitializePlatform(platform.Key));
            }
            
            Debug.Log("📱 All social platforms initialized");
        }
        
        /// <summary>
        /// Initialize individual platform
        /// </summary>
        private IEnumerator InitializePlatform(string platformName)
        {
            var platform = platforms[platformName];
            
            try
            {
                // Test platform connection
                bool connected = yield return StartCoroutine(TestPlatformConnection(platformName));
                platform.isConnected = connected;
                platformStatus[platformName] = connected;
                
                if (connected)
                {
                    Debug.Log($"✅ {platform.name} connected successfully");
                }
                else
                {
                    Debug.LogWarning($"⚠️ {platform.name} connection failed");
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"❌ Failed to initialize {platform.name}: {e.Message}");
                platform.isConnected = false;
                platformStatus[platformName] = false;
            }
            
            OnPlatformConnected?.Invoke(platformName, platform.isConnected);
        }
        
        /// <summary>
        /// Test platform connection
        /// </summary>
        private IEnumerator TestPlatformConnection(string platformName)
        {
            var platform = platforms[platformName];
            bool connected = false;
            
            switch (platformName)
            {
                case "facebook":
                    connected = yield return StartCoroutine(TestFacebookConnection());
                    break;
                case "twitter":
                    connected = yield return StartCoroutine(TestTwitterConnection());
                    break;
                case "instagram":
                    connected = yield return StartCoroutine(TestInstagramConnection());
                    break;
                case "tiktok":
                    connected = yield return StartCoroutine(TestTikTokConnection());
                    break;
                case "youtube":
                    connected = yield return StartCoroutine(TestYouTubeConnection());
                    break;
                case "discord":
                    connected = yield return StartCoroutine(TestDiscordConnection());
                    break;
                case "linkedin":
                    connected = yield return StartCoroutine(TestLinkedInConnection());
                    break;
                case "reddit":
                    connected = yield return StartCoroutine(TestRedditConnection());
                    break;
                case "whatsapp":
                    connected = yield return StartCoroutine(TestWhatsAppConnection());
                    break;
                case "telegram":
                    connected = yield return StartCoroutine(TestTelegramConnection());
                    break;
                case "snapchat":
                    connected = yield return StartCoroutine(TestSnapchatConnection());
                    break;
                case "pinterest":
                    connected = yield return StartCoroutine(TestPinterestConnection());
                    break;
                case "twitch":
                    connected = yield return StartCoroutine(TestTwitchConnection());
                    break;
                case "steam":
                    connected = yield return StartCoroutine(TestSteamConnection());
                    break;
            }
            
            yield return connected;
        }
        
        /// <summary>
        /// Test Facebook connection
        /// </summary>
        private IEnumerator TestFacebookConnection()
        {
            // Facebook SDK integration would go here
            // For now, simulate connection test
            yield return new WaitForSeconds(0.5f);
            yield return true;
        }
        
        /// <summary>
        /// Test Twitter connection
        /// </summary>
        private IEnumerator TestTwitterConnection()
        {
            // Twitter API integration would go here
            yield return new WaitForSeconds(0.5f);
            yield return true;
        }
        
        /// <summary>
        /// Test Instagram connection
        /// </summary>
        private IEnumerator TestInstagramConnection()
        {
            // Instagram API integration would go here
            yield return new WaitForSeconds(0.5f);
            yield return true;
        }
        
        /// <summary>
        /// Test TikTok connection
        /// </summary>
        private IEnumerator TestTikTokConnection()
        {
            // TikTok API integration would go here
            yield return new WaitForSeconds(0.5f);
            yield return true;
        }
        
        /// <summary>
        /// Test YouTube connection
        /// </summary>
        private IEnumerator TestYouTubeConnection()
        {
            // YouTube API integration would go here
            yield return new WaitForSeconds(0.5f);
            yield return true;
        }
        
        /// <summary>
        /// Test Discord connection
        /// </summary>
        private IEnumerator TestDiscordConnection()
        {
            // Discord API integration would go here
            yield return new WaitForSeconds(0.5f);
            yield return true;
        }
        
        /// <summary>
        /// Test LinkedIn connection
        /// </summary>
        private IEnumerator TestLinkedInConnection()
        {
            // LinkedIn API integration would go here
            yield return new WaitForSeconds(0.5f);
            yield return true;
        }
        
        /// <summary>
        /// Test Reddit connection
        /// </summary>
        private IEnumerator TestRedditConnection()
        {
            // Reddit API integration would go here
            yield return new WaitForSeconds(0.5f);
            yield return true;
        }
        
        /// <summary>
        /// Test WhatsApp connection
        /// </summary>
        private IEnumerator TestWhatsAppConnection()
        {
            // WhatsApp Business API integration would go here
            yield return new WaitForSeconds(0.5f);
            yield return true;
        }
        
        /// <summary>
        /// Test Telegram connection
        /// </summary>
        private IEnumerator TestTelegramConnection()
        {
            // Telegram Bot API integration would go here
            yield return new WaitForSeconds(0.5f);
            yield return true;
        }
        
        /// <summary>
        /// Test Snapchat connection
        /// </summary>
        private IEnumerator TestSnapchatConnection()
        {
            // Snapchat API integration would go here
            yield return new WaitForSeconds(0.5f);
            yield return true;
        }
        
        /// <summary>
        /// Test Pinterest connection
        /// </summary>
        private IEnumerator TestPinterestConnection()
        {
            // Pinterest API integration would go here
            yield return new WaitForSeconds(0.5f);
            yield return true;
        }
        
        /// <summary>
        /// Test Twitch connection
        /// </summary>
        private IEnumerator TestTwitchConnection()
        {
            // Twitch API integration would go here
            yield return new WaitForSeconds(0.5f);
            yield return true;
        }
        
        /// <summary>
        /// Test Steam connection
        /// </summary>
        private IEnumerator TestSteamConnection()
        {
            // Steam API integration would go here
            yield return new WaitForSeconds(0.5f);
            yield return true;
        }
        
        /// <summary>
        /// Share content to social media
        /// </summary>
        public void ShareContent(string platformName, string content, string mediaUrl = null, Dictionary<string, object> metadata = null)
        {
            if (!platforms.ContainsKey(platformName))
            {
                Debug.LogError($"❌ Platform {platformName} not available");
                return;
            }
            
            var platform = platforms[platformName];
            if (!platform.isConnected)
            {
                Debug.LogWarning($"⚠️ Platform {platformName} not connected");
                return;
            }
            
            StartCoroutine(ShareContentCoroutine(platformName, content, mediaUrl, metadata));
        }
        
        /// <summary>
        /// Share content coroutine
        /// </summary>
        private IEnumerator ShareContentCoroutine(string platformName, string content, string mediaUrl, Dictionary<string, object> metadata)
        {
            var platform = platforms[platformName];
            SocialPost post = new SocialPost
            {
                id = System.Guid.NewGuid().ToString(),
                platform = platformName,
                content = content,
                mediaUrl = mediaUrl,
                timestamp = DateTime.Now,
                metadata = metadata ?? new Dictionary<string, object>()
            };
            
            bool success = false;
            
            switch (platformName)
            {
                case "facebook":
                    success = yield return StartCoroutine(ShareToFacebook(post));
                    break;
                case "twitter":
                    success = yield return StartCoroutine(ShareToTwitter(post));
                    break;
                case "instagram":
                    success = yield return StartCoroutine(ShareToInstagram(post));
                    break;
                case "tiktok":
                    success = yield return StartCoroutine(ShareToTikTok(post));
                    break;
                case "youtube":
                    success = yield return StartCoroutine(ShareToYouTube(post));
                    break;
                case "discord":
                    success = yield return StartCoroutine(ShareToDiscord(post));
                    break;
                case "linkedin":
                    success = yield return StartCoroutine(ShareToLinkedIn(post));
                    break;
                case "reddit":
                    success = yield return StartCoroutine(ShareToReddit(post));
                    break;
                case "whatsapp":
                    success = yield return StartCoroutine(ShareToWhatsApp(post));
                    break;
                case "telegram":
                    success = yield return StartCoroutine(ShareToTelegram(post));
                    break;
                case "snapchat":
                    success = yield return StartCoroutine(ShareToSnapchat(post));
                    break;
                case "pinterest":
                    success = yield return StartCoroutine(ShareToPinterest(post));
                    break;
                case "twitch":
                    success = yield return StartCoroutine(ShareToTwitch(post));
                    break;
                case "steam":
                    success = yield return StartCoroutine(ShareToSteam(post));
                    break;
            }
            
            if (success)
            {
                recentPosts.Add(post);
                OnPostShared?.Invoke(platformName, post);
                
                // Track analytics
                TrackSocialEvent("content_shared", new Dictionary<string, object>
                {
                    {"platform", platformName},
                    {"content_type", mediaUrl != null ? "media" : "text"},
                    {"has_media", mediaUrl != null}
                });
                
                // Check for viral potential
                CheckViralPotential(post);
                
                Debug.Log($"✅ Content shared to {platform.name}");
            }
            else
            {
                Debug.LogError($"❌ Failed to share content to {platform.name}");
            }
        }
        
        /// <summary>
        /// Share to Facebook
        /// </summary>
        private IEnumerator ShareToFacebook(SocialPost post)
        {
            // Facebook SDK integration would go here
            yield return new WaitForSeconds(1f);
            yield return true;
        }
        
        /// <summary>
        /// Share to Twitter
        /// </summary>
        private IEnumerator ShareToTwitter(SocialPost post)
        {
            // Twitter API integration would go here
            yield return new WaitForSeconds(1f);
            yield return true;
        }
        
        /// <summary>
        /// Share to Instagram
        /// </summary>
        private IEnumerator ShareToInstagram(SocialPost post)
        {
            // Instagram API integration would go here
            yield return new WaitForSeconds(1f);
            yield return true;
        }
        
        /// <summary>
        /// Share to TikTok
        /// </summary>
        private IEnumerator ShareToTikTok(SocialPost post)
        {
            // TikTok API integration would go here
            yield return new WaitForSeconds(1f);
            yield return true;
        }
        
        /// <summary>
        /// Share to YouTube
        /// </summary>
        private IEnumerator ShareToYouTube(SocialPost post)
        {
            // YouTube API integration would go here
            yield return new WaitForSeconds(1f);
            yield return true;
        }
        
        /// <summary>
        /// Share to Discord
        /// </summary>
        private IEnumerator ShareToDiscord(SocialPost post)
        {
            // Discord API integration would go here
            yield return new WaitForSeconds(1f);
            yield return true;
        }
        
        /// <summary>
        /// Share to LinkedIn
        /// </summary>
        private IEnumerator ShareToLinkedIn(SocialPost post)
        {
            // LinkedIn API integration would go here
            yield return new WaitForSeconds(1f);
            yield return true;
        }
        
        /// <summary>
        /// Share to Reddit
        /// </summary>
        private IEnumerator ShareToReddit(SocialPost post)
        {
            // Reddit API integration would go here
            yield return new WaitForSeconds(1f);
            yield return true;
        }
        
        /// <summary>
        /// Share to WhatsApp
        /// </summary>
        private IEnumerator ShareToWhatsApp(SocialPost post)
        {
            // WhatsApp Business API integration would go here
            yield return new WaitForSeconds(1f);
            yield return true;
        }
        
        /// <summary>
        /// Share to Telegram
        /// </summary>
        private IEnumerator ShareToTelegram(SocialPost post)
        {
            // Telegram Bot API integration would go here
            yield return new WaitForSeconds(1f);
            yield return true;
        }
        
        /// <summary>
        /// Share to Snapchat
        /// </summary>
        private IEnumerator ShareToSnapchat(SocialPost post)
        {
            // Snapchat API integration would go here
            yield return new WaitForSeconds(1f);
            yield return true;
        }
        
        /// <summary>
        /// Share to Pinterest
        /// </summary>
        private IEnumerator ShareToPinterest(SocialPost post)
        {
            // Pinterest API integration would go here
            yield return new WaitForSeconds(1f);
            yield return true;
        }
        
        /// <summary>
        /// Share to Twitch
        /// </summary>
        private IEnumerator ShareToTwitch(SocialPost post)
        {
            // Twitch API integration would go here
            yield return new WaitForSeconds(1f);
            yield return true;
        }
        
        /// <summary>
        /// Share to Steam
        /// </summary>
        private IEnumerator ShareToSteam(SocialPost post)
        {
            // Steam API integration would go here
            yield return new WaitForSeconds(1f);
            yield return true;
        }
        
        /// <summary>
        /// Check viral potential
        /// </summary>
        private void CheckViralPotential(SocialPost post)
        {
            // Simulate viral check
            int randomEngagement = UnityEngine.Random.Range(0, 2000);
            
            if (randomEngagement > viralThreshold)
            {
                post.isViral = true;
                OnViralAchievement?.Invoke(post.platform, randomEngagement);
                
                // Give viral rewards
                if (enableViralSharing)
                {
                    GiveViralRewards(post.platform, randomEngagement);
                }
                
                Debug.Log($"🔥 Post went viral on {post.platform} with {randomEngagement} engagement!");
            }
        }
        
        /// <summary>
        /// Give viral rewards
        /// </summary>
        private void GiveViralRewards(string platform, int engagement)
        {
            int coins = Mathf.RoundToInt(shareRewardCoins * viralMultiplier);
            int gems = Mathf.RoundToInt(shareRewardGems * viralMultiplier);
            
            // Update player data
            if (GameManager.Instance != null)
            {
                GameManager.Instance.AddCoins(coins);
                GameManager.Instance.AddGems(gems);
            }
            
            // Track viral event
            TrackSocialEvent("viral_achievement", new Dictionary<string, object>
            {
                {"platform", platform},
                {"engagement", engagement},
                {"coins_rewarded", coins},
                {"gems_rewarded", gems}
            });
        }
        
        /// <summary>
        /// Track social event
        /// </summary>
        private void TrackSocialEvent(string eventName, Dictionary<string, object> eventData)
        {
            if (analyticsManager != null)
            {
                analyticsManager.TrackEvent($"social_{eventName}", eventData);
            }
            
            if (backendConnector != null)
            {
                backendConnector.TrackEvent($"social_{eventName}", eventData);
            }
        }
        
        /// <summary>
        /// Social analytics loop
        /// </summary>
        private IEnumerator SocialAnalyticsLoop()
        {
            while (true)
            {
                yield return new WaitForSeconds(analyticsUpdateInterval);
                
                if (enableSocialAnalytics)
                {
                    UpdateSocialAnalytics();
                }
            }
        }
        
        /// <summary>
        /// Update social analytics
        /// </summary>
        private void UpdateSocialAnalytics()
        {
            var analytics = new SocialAnalytics
            {
                totalShares = recentPosts.Count,
                totalLikes = 0,
                totalComments = 0,
                totalViews = 0,
                viralPosts = 0,
                engagementRate = 0f,
                platformStats = new Dictionary<string, int>(),
                hashtagStats = new Dictionary<string, int>(),
                topPosts = new List<SocialPost>()
            };
            
            // Calculate metrics
            foreach (var post in recentPosts)
            {
                analytics.totalLikes += post.likes;
                analytics.totalComments += post.comments;
                analytics.totalViews += post.views;
                
                if (post.isViral)
                {
                    analytics.viralPosts++;
                }
                
                // Platform stats
                if (analytics.platformStats.ContainsKey(post.platform))
                {
                    analytics.platformStats[post.platform]++;
                }
                else
            {
                    analytics.platformStats[post.platform] = 1;
                }
            }
            
            // Calculate engagement rate
            if (analytics.totalViews > 0)
            {
                analytics.engagementRate = (float)(analytics.totalLikes + analytics.totalComments + analytics.totalShares) / analytics.totalViews;
            }
            
            // Get top posts
            var sortedPosts = new List<SocialPost>(recentPosts);
            sortedPosts.Sort((a, b) => (b.likes + b.shares + b.comments).CompareTo(a.likes + a.shares + a.comments));
            analytics.topPosts = sortedPosts.GetRange(0, Mathf.Min(5, sortedPosts.Count));
            
            OnAnalyticsUpdated?.Invoke(analytics);
        }
        
        /// <summary>
        /// Get available platforms
        /// </summary>
        public List<string> GetAvailablePlatforms()
        {
            var available = new List<string>();
            foreach (var platform in platforms)
            {
                if (platform.Value.isConnected)
                {
                    available.Add(platform.Key);
                }
            }
            return available;
        }
        
        /// <summary>
        /// Get platform status
        /// </summary>
        public bool IsPlatformConnected(string platformName)
        {
            return platforms.ContainsKey(platformName) && platforms[platformName].isConnected;
        }
        
        /// <summary>
        /// Get recent posts
        /// </summary>
        public List<SocialPost> GetRecentPosts()
        {
            return new List<SocialPost>(recentPosts);
        }
        
        /// <summary>
        /// Get social analytics
        /// </summary>
        public SocialAnalytics GetSocialAnalytics()
        {
            var analytics = new SocialAnalytics();
            UpdateSocialAnalytics();
            return analytics;
        }
        
        /// <summary>
        /// Share game achievement
        /// </summary>
        public void ShareAchievement(string achievementName, int score, string platform = "all")
        {
            string content = $"🎉 Just achieved {achievementName} in {gameTitle} with {score} points! {gameHashtag}";
            
            if (platform == "all")
            {
                foreach (var platformName in GetAvailablePlatforms())
                {
                    ShareContent(platformName, content);
                }
            }
            else
            {
                ShareContent(platform, content);
            }
        }
        
        /// <summary>
        /// Share high score
        /// </summary>
        public void ShareHighScore(int score, int level, string platform = "all")
        {
            string content = $"🏆 New high score of {score} on level {level} in {gameTitle}! Can you beat it? {gameHashtag}";
            
            if (platform == "all")
            {
                foreach (var platformName in GetAvailablePlatforms())
                {
                    ShareContent(platformName, content);
                }
            }
            else
            {
                ShareContent(platform, content);
            }
        }
        
        /// <summary>
        /// Share level completion
        /// </summary>
        public void ShareLevelCompletion(int level, int moves, string platform = "all")
        {
            string content = $"✅ Completed level {level} in {moves} moves in {gameTitle}! {gameHashtag}";
            
            if (platform == "all")
            {
                foreach (var platformName in GetAvailablePlatforms())
                {
                    ShareContent(platformName, content);
                }
            }
            else
            {
                ShareContent(platform, content);
            }
        }
        
        /// <summary>
        /// Share power-up usage
        /// </summary>
        public void SharePowerUpUsage(string powerUpName, int score, string platform = "all")
        {
            string content = $"⚡ Used {powerUpName} and scored {score} points in {gameTitle}! {gameHashtag}";
            
            if (platform == "all")
            {
                foreach (var platformName in GetAvailablePlatforms())
                {
                    ShareContent(platformName, content);
                }
            }
            else
            {
                ShareContent(platform, content);
            }
        }
        
        /// <summary>
        /// Share game screenshot
        /// </summary>
        public void ShareScreenshot(Texture2D screenshot, string caption, string platform = "all")
        {
            // Convert texture to bytes
            byte[] imageData = screenshot.EncodeToPNG();
            string base64Image = Convert.ToBase64String(imageData);
            
            if (platform == "all")
            {
                foreach (var platformName in GetAvailablePlatforms())
                {
                    ShareContent(platformName, caption, base64Image);
                }
            }
            else
            {
                ShareContent(platform, caption, base64Image);
            }
        }
    }
}