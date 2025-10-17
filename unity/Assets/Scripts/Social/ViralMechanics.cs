using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using Evergreen.Social;
using Evergreen.Core;
using Evergreen.Integration;

namespace Evergreen.Social
{
    /// <summary>
    /// Viral Mechanics - Advanced viral sharing and engagement system
    /// Handles viral content generation, sharing incentives, and community features
    /// </summary>
    public class ViralMechanics : MonoBehaviour
    {
        [Header("Viral Configuration")]
        public bool enableViralMechanics = true;
        public float viralCheckInterval = 30f;
        public int viralThreshold = 1000;
        public float viralMultiplier = 1.5f;
        public int maxViralRewards = 10;
        
        [Header("Sharing Incentives")]
        public int shareRewardCoins = 100;
        public int shareRewardGems = 10;
        public int viralRewardCoins = 500;
        public int viralRewardGems = 50;
        public int referralRewardCoins = 200;
        public int referralRewardGems = 20;
        
        [Header("Content Generation")]
        public bool enableAIContent = true;
        public float contentUpdateInterval = 60f;
        public int maxContentQueue = 20;
        public string[] viralTemplates = {
            "🔥 Just scored {score} points in {gameTitle}! Can you beat my score? {hashtag}",
            "⚡ Used {powerUp} and got {score} points! This game is amazing! {hashtag}",
            "🏆 Completed level {level} in {moves} moves! Who's up for the challenge? {hashtag}",
            "🎉 Unlocked {achievement} in {gameTitle}! This game never gets old! {hashtag}",
            "💎 Earned {gems} gems and {coins} coins! The rewards are incredible! {hashtag}"
        };
        
        [Header("Community Features")]
        public bool enableCommunityChallenges = true;
        public bool enableLeaderboardSharing = true;
        public bool enableTeamChallenges = true;
        public bool enableSocialProof = true;
        
        [Header("Analytics")]
        public bool enableViralAnalytics = true;
        public float analyticsUpdateInterval = 60f;
        
        // Singleton
        public static ViralMechanics Instance { get; private set; }
        
        // References
        private SocialMediaManager socialManager;
        private GameManager gameManager;
        private AIInfiniteContentManager aiContentManager;
        private GameAnalyticsManager analyticsManager;
        private BackendConnector backendConnector;
        
        // Viral State
        private List<ViralContent> viralContent = new List<ViralContent>();
        private List<ViralReward> pendingRewards = new List<ViralReward>();
        private Dictionary<string, int> shareCounts = new Dictionary<string, int>();
        private Dictionary<string, int> viralCounts = new Dictionary<string, int>();
        private Dictionary<string, float> engagementRates = new Dictionary<string, float>();
        private List<CommunityChallenge> activeChallenges = new List<CommunityChallenge>();
        private List<SocialProof> socialProofs = new List<SocialProof>();
        
        // Events
        public System.Action<ViralContent> OnViralContentGenerated;
        public System.Action<ViralReward> OnViralRewardEarned;
        public System.Action<CommunityChallenge> OnChallengeCreated;
        public System.Action<SocialProof> OnSocialProofGenerated;
        public System.Action<string, int> OnViralAchievement;
        
        [System.Serializable]
        public class ViralContent
        {
            public string id;
            public string title;
            public string content;
            public string mediaUrl;
            public string[] hashtags;
            public string[] platforms;
            public int targetEngagement;
            public int currentEngagement;
            public bool isViral;
            public DateTime createdAt;
            public DateTime expiresAt;
            public Dictionary<string, object> metadata;
        }
        
        [System.Serializable]
        public class ViralReward
        {
            public string id;
            public string type;
            public int coins;
            public int gems;
            public string description;
            public bool isClaimed;
            public DateTime earnedAt;
            public Dictionary<string, object> metadata;
        }
        
        [System.Serializable]
        public class CommunityChallenge
        {
            public string id;
            public string title;
            public string description;
            public int targetValue;
            public int currentValue;
            public string rewardType;
            public int rewardValue;
            public DateTime startTime;
            public DateTime endTime;
            public bool isActive;
            public List<string> participants;
            public Dictionary<string, object> metadata;
        }
        
        [System.Serializable]
        public class SocialProof
        {
            public string id;
            public string type;
            public string content;
            public string playerName;
            public int value;
            public string platform;
            public DateTime timestamp;
            public bool isVisible;
            public Dictionary<string, object> metadata;
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
            if (enableViralMechanics)
            {
                StartCoroutine(ViralMechanicsLoop());
                StartCoroutine(ContentGenerationLoop());
                StartCoroutine(AnalyticsLoop());
            }
        }
        
        /// <summary>
        /// Initialize viral mechanics
        /// </summary>
        private void Initialize()
        {
            // Get references
            socialManager = SocialMediaManager.Instance;
            gameManager = OptimizedCoreSystem.Instance;
            aiContentManager = FindObjectOfType<AIInfiniteContentManager>();
            analyticsManager = FindObjectOfType<GameAnalyticsManager>();
            backendConnector = BackendConnector.Instance;
            
            // Initialize viral content
            InitializeViralContent();
            
            Debug.Log("🔥 Viral Mechanics initialized");
        }
        
        /// <summary>
        /// Initialize viral content
        /// </summary>
        private void InitializeViralContent()
        {
            // Generate initial viral content
            for (int i = 0; i < 5; i++)
            {
                GenerateViralContent();
            }
        }
        
        /// <summary>
        /// Viral mechanics loop
        /// </summary>
        private IEnumerator ViralMechanicsLoop()
        {
            while (true)
            {
                yield return new WaitForSeconds(viralCheckInterval);
                
                // Check for viral content
                CheckViralContent();
                
                // Update engagement rates
                UpdateEngagementRates();
                
                // Generate new content
                if (viralContent.Count < maxContentQueue)
                {
                    GenerateViralContent();
                }
                
                // Create community challenges
                if (enableCommunityChallenges && activeChallenges.Count < 3)
                {
                    CreateCommunityChallenge();
                }
                
                // Generate social proof
                if (enableSocialProof && socialProofs.Count < 10)
                {
                    GenerateSocialProof();
                }
            }
        }
        
        /// <summary>
        /// Content generation loop
        /// </summary>
        private IEnumerator ContentGenerationLoop()
        {
            while (true)
            {
                yield return new WaitForSeconds(contentUpdateInterval);
                
                if (enableAIContent && aiContentManager != null)
                {
                    GenerateAIContent();
                }
            }
        }
        
        /// <summary>
        /// Analytics loop
        /// </summary>
        private IEnumerator AnalyticsLoop()
        {
            while (true)
            {
                yield return new WaitForSeconds(analyticsUpdateInterval);
                
                if (enableViralAnalytics)
                {
                    UpdateViralAnalytics();
                }
            }
        }
        
        /// <summary>
        /// Generate viral content
        /// </summary>
        private void GenerateViralContent()
        {
            var content = new ViralContent
            {
                id = System.Guid.NewGuid().ToString(),
                title = GenerateViralTitle(),
                content = GenerateViralContentText(),
                hashtags = GenerateViralHashtags(),
                platforms = GetAvailablePlatforms(),
                targetEngagement = UnityEngine.Random.Range(500, 2000),
                currentEngagement = 0,
                isViral = false,
                createdAt = DateTime.Now,
                expiresAt = DateTime.Now.AddDays(7),
                metadata = new Dictionary<string, object>()
            };
            
            viralContent.Add(content);
            OnViralContentGenerated?.Invoke(content);
            
            Debug.Log($"🔥 Generated viral content: {content.title}");
        }
        
        /// <summary>
        /// Generate viral title
        /// </summary>
        private string GenerateViralTitle()
        {
            string[] titles = {
                "Can you beat my score?",
                "This move was incredible!",
                "Level completed in record time!",
                "Power-up combo was insane!",
                "New high score achieved!",
                "This game is addictive!",
                "Challenge accepted!",
                "Who's up for the challenge?",
                "This is why I love this game!",
                "Incredible match-3 action!"
            };
            
            return titles[UnityEngine.Random.Range(0, titles.Length)];
        }
        
        /// <summary>
        /// Generate viral content text
        /// </summary>
        private string GenerateViralContentText()
        {
            if (gameManager == null) return "Playing an amazing match-3 game!";
            
            string template = viralTemplates[UnityEngine.Random.Range(0, viralTemplates.Length)];
            
            return template
                .Replace("{score}", gameManager.playerScore.ToString())
                .Replace("{gameTitle}", socialManager.gameTitle)
                .Replace("{powerUp}", "Amazing Power-up")
                .Replace("{level}", gameManager.currentLevel)
                .Replace("{moves}", "30")
                .Replace("{achievement}", "Epic Achievement")
                .Replace("{gems}", gameManager.playerGems.ToString())
                .Replace("{coins}", gameManager.playerCoins.ToString())
                .Replace("{hashtag}", socialManager.gameHashtag);
        }
        
        /// <summary>
        /// Generate viral hashtags
        /// </summary>
        private string[] GenerateViralHashtags()
        {
            string[] baseHashtags = {
                socialManager.gameHashtag,
                "#Match3",
                "#PuzzleGame",
                "#MobileGame",
                "#AIGaming"
            };
            
            string[] additionalHashtags = {
                "#Gaming",
                "#Fun",
                "#Challenge",
                "#Score",
                "#Achievement",
                "#PowerUp",
                "#Level",
                "#Addictive",
                "#Amazing",
                "#Epic"
            };
            
            List<string> hashtags = new List<string>(baseHashtags);
            
            // Add random additional hashtags
            int additionalCount = UnityEngine.Random.Range(2, 5);
            for (int i = 0; i < additionalCount; i++)
            {
                string hashtag = additionalHashtags[UnityEngine.Random.Range(0, additionalHashtags.Length)];
                if (!hashtags.Contains(hashtag))
                {
                    hashtags.Add(hashtag);
                }
            }
            
            return hashtags.ToArray();
        }
        
        /// <summary>
        /// Get available platforms
        /// </summary>
        private string[] GetAvailablePlatforms()
        {
            if (socialManager == null) return new string[] { "twitter" };
            
            return socialManager.GetAvailablePlatforms().ToArray();
        }
        
        /// <summary>
        /// Generate AI content
        /// </summary>
        private void GenerateAIContent()
        {
            if (aiContentManager == null) return;
            
            // Generate AI-powered viral content
            aiContentManager.GenerateAIContent("viral_content", (content) => {
                if (content != null)
                {
                    var viralContent = new ViralContent
                    {
                        id = System.Guid.NewGuid().ToString(),
                        title = "AI-Generated Viral Content",
                        content = content.ToString(),
                        hashtags = GenerateViralHashtags(),
                        platforms = GetAvailablePlatforms(),
                        targetEngagement = UnityEngine.Random.Range(1000, 5000),
                        currentEngagement = 0,
                        isViral = false,
                        createdAt = DateTime.Now,
                        expiresAt = DateTime.Now.AddDays(7),
                        metadata = new Dictionary<string, object>()
                    };
                    
                    this.viralContent.Add(viralContent);
                    OnViralContentGenerated?.Invoke(viralContent);
                    
                    Debug.Log("🤖 Generated AI viral content");
                }
            });
        }
        
        /// <summary>
        /// Check viral content
        /// </summary>
        private void CheckViralContent()
        {
            foreach (var content in viralContent)
            {
                if (content.isViral) continue;
                
                // Simulate engagement growth
                int engagementGrowth = UnityEngine.Random.Range(10, 100);
                content.currentEngagement += engagementGrowth;
                
                // Check if content went viral
                if (content.currentEngagement >= viralThreshold)
                {
                    content.isViral = true;
                    OnViralAchievement?.Invoke(content.platforms[0], content.currentEngagement);
                    
                    // Give viral reward
                    GiveViralReward(content);
                    
                    Debug.Log($"🔥 Content went viral: {content.title} - {content.currentEngagement} engagement!");
                }
            }
        }
        
        /// <summary>
        /// Give viral reward
        /// </summary>
        private void GiveViralReward(ViralContent content)
        {
            var reward = new ViralReward
            {
                id = System.Guid.NewGuid().ToString(),
                type = "viral",
                coins = viralRewardCoins,
                gems = viralRewardGems,
                description = $"Viral content: {content.title}",
                isClaimed = false,
                earnedAt = DateTime.Now,
                metadata = new Dictionary<string, object>
                {
                    {"content_id", content.id},
                    {"engagement", content.currentEngagement}
                }
            };
            
            pendingRewards.Add(reward);
            OnViralRewardEarned?.Invoke(reward);
            
            // Auto-claim reward
            ClaimReward(reward);
        }
        
        /// <summary>
        /// Claim reward
        /// </summary>
        public void ClaimReward(ViralReward reward)
        {
            if (reward.isClaimed) return;
            
            reward.isClaimed = true;
            
            // Give rewards to player
            if (gameManager != null)
            {
                gameManager.AddCoins(reward.coins);
                gameManager.AddGems(reward.gems);
            }
            
            // Track analytics
            TrackViralEvent("reward_claimed", new Dictionary<string, object>
            {
                {"reward_type", reward.type},
                {"coins", reward.coins},
                {"gems", reward.gems}
            });
            
            Debug.Log($"🎉 Claimed viral reward: {reward.coins} coins, {reward.gems} gems");
        }
        
        /// <summary>
        /// Create community challenge
        /// </summary>
        private void CreateCommunityChallenge()
        {
            string[] challengeTypes = {
                "Total Score",
                "Levels Completed",
                "Power-ups Used",
                "Matches Made",
                "Coins Earned"
            };
            
            string challengeType = challengeTypes[UnityEngine.Random.Range(0, challengeTypes.Length)];
            
            var challenge = new CommunityChallenge
            {
                id = System.Guid.NewGuid().ToString(),
                title = $"Community Challenge: {challengeType}",
                description = $"Work together to reach {challengeType} goal!",
                targetValue = UnityEngine.Random.Range(10000, 100000),
                currentValue = 0,
                rewardType = "coins",
                rewardValue = UnityEngine.Random.Range(500, 2000),
                startTime = DateTime.Now,
                endTime = DateTime.Now.AddDays(7),
                isActive = true,
                participants = new List<string>(),
                metadata = new Dictionary<string, object>
                {
                    {"challenge_type", challengeType}
                }
            };
            
            activeChallenges.Add(challenge);
            OnChallengeCreated?.Invoke(challenge);
            
            Debug.Log($"🏆 Created community challenge: {challenge.title}");
        }
        
        /// <summary>
        /// Generate social proof
        /// </summary>
        private void GenerateSocialProof()
        {
            string[] proofTypes = {
                "High Score",
                "Level Completion",
                "Power-up Usage",
                "Achievement Unlocked",
                "Viral Content"
            };
            
            string proofType = proofTypes[UnityEngine.Random.Range(0, proofTypes.Length)];
            
            var proof = new SocialProof
            {
                id = System.Guid.NewGuid().ToString(),
                type = proofType,
                content = GenerateSocialProofContent(proofType),
                playerName = GeneratePlayerName(),
                value = UnityEngine.Random.Range(100, 10000),
                platform = GetRandomPlatform(),
                timestamp = DateTime.Now,
                isVisible = true,
                metadata = new Dictionary<string, object>()
            };
            
            socialProofs.Add(proof);
            OnSocialProofGenerated?.Invoke(proof);
            
            Debug.Log($"👥 Generated social proof: {proof.content}");
        }
        
        /// <summary>
        /// Generate social proof content
        /// </summary>
        private string GenerateSocialProofContent(string proofType)
        {
            switch (proofType)
            {
                case "High Score":
                    return $"Just scored {UnityEngine.Random.Range(1000, 10000)} points!";
                case "Level Completion":
                    return $"Completed level {UnityEngine.Random.Range(1, 100)} in record time!";
                case "Power-up Usage":
                    return $"Used amazing power-up and got {UnityEngine.Random.Range(500, 5000)} points!";
                case "Achievement Unlocked":
                    return $"Unlocked epic achievement!";
                case "Viral Content":
                    return $"My post went viral with {UnityEngine.Random.Range(1000, 10000)} engagement!";
                default:
                    return "Amazing achievement unlocked!";
            }
        }
        
        /// <summary>
        /// Generate player name
        /// </summary>
        private string GeneratePlayerName()
        {
            string[] names = {
                "Player123", "GameMaster", "PuzzlePro", "Match3King", "ScoreChaser",
                "LevelBoss", "PowerUpPro", "ViralGamer", "SocialStar", "CommunityHero"
            };
            
            return names[UnityEngine.Random.Range(0, names.Length)];
        }
        
        /// <summary>
        /// Get random platform
        /// </summary>
        private string GetRandomPlatform()
        {
            string[] platforms = { "Facebook", "Twitter", "Instagram", "TikTok", "YouTube" };
            return platforms[UnityEngine.Random.Range(0, platforms.Length)];
        }
        
        /// <summary>
        /// Update engagement rates
        /// </summary>
        private void UpdateEngagementRates()
        {
            foreach (var content in viralContent)
            {
                if (content.currentEngagement > 0)
                {
                    float rate = (float)content.currentEngagement / content.targetEngagement;
                    engagementRates[content.id] = rate;
                }
            }
        }
        
        /// <summary>
        /// Update viral analytics
        /// </summary>
        private void UpdateViralAnalytics()
        {
            // Calculate viral metrics
            int totalViralContent = 0;
            int totalEngagement = 0;
            int totalRewards = pendingRewards.Count;
            
            foreach (var content in viralContent)
            {
                if (content.isViral)
                {
                    totalViralContent++;
                }
                totalEngagement += content.currentEngagement;
            }
            
            // Track analytics
            TrackViralEvent("viral_analytics", new Dictionary<string, object>
            {
                {"total_viral_content", totalViralContent},
                {"total_engagement", totalEngagement},
                {"total_rewards", totalRewards},
                {"active_challenges", activeChallenges.Count},
                {"social_proofs", socialProofs.Count}
            });
        }
        
        /// <summary>
        /// Track viral event
        /// </summary>
        private void TrackViralEvent(string eventName, Dictionary<string, object> eventData)
        {
            if (analyticsManager != null)
            {
                analyticsManager.TrackEvent($"viral_{eventName}", eventData);
            }
            
            if (backendConnector != null)
            {
                backendConnector.TrackEvent($"viral_{eventName}", eventData);
            }
        }
        
        /// <summary>
        /// Share viral content
        /// </summary>
        public void ShareViralContent(ViralContent content, string platform = "all")
        {
            if (socialManager == null) return;
            
            string shareText = $"{content.title}\n\n{content.content}\n\n{string.Join(" ", content.hashtags)}";
            
            if (platform == "all")
            {
                foreach (var platformName in content.platforms)
                {
                    socialManager.ShareContent(platformName, shareText);
                }
            }
            else
            {
                socialManager.ShareContent(platform, shareText);
            }
            
            // Track share
            TrackViralEvent("viral_content_shared", new Dictionary<string, object>
            {
                {"content_id", content.id},
                {"platform", platform}
            });
        }
        
        /// <summary>
        /// Get viral content
        /// </summary>
        public List<ViralContent> GetViralContent()
        {
            return new List<ViralContent>(viralContent);
        }
        
        /// <summary>
        /// Get pending rewards
        /// </summary>
        public List<ViralReward> GetPendingRewards()
        {
            return new List<ViralReward>(pendingRewards);
        }
        
        /// <summary>
        /// Get active challenges
        /// </summary>
        public List<CommunityChallenge> GetActiveChallenges()
        {
            return new List<CommunityChallenge>(activeChallenges);
        }
        
        /// <summary>
        /// Get social proofs
        /// </summary>
        public List<SocialProof> GetSocialProofs()
        {
            return new List<SocialProof>(socialProofs);
        }
        
        /// <summary>
        /// Get viral statistics
        /// </summary>
        public Dictionary<string, object> GetViralStatistics()
        {
            return new Dictionary<string, object>
            {
                {"total_viral_content", viralContent.Count},
                {"viral_content_count", viralContent.FindAll(c => c.isViral).Count},
                {"total_engagement", viralContent.Sum(c => c.currentEngagement)},
                {"pending_rewards", pendingRewards.Count},
                {"active_challenges", activeChallenges.Count},
                {"social_proofs", socialProofs.Count}
            };
        }
    }
}