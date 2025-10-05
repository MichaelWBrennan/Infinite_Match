using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using System.Linq;

namespace Evergreen.AI
{
    [System.Serializable]
    public class PlayerProfile
    {
        public string playerId;
        public PlayStyle playStyle;
        public SkillLevel skillLevel;
        public PlayerPreferences preferences;
        public EmotionalState emotionalState;
        public List<BehaviorPattern> behaviorPatterns = new List<BehaviorPattern>();
        public List<PersonalizedContent> personalizedContent = new List<PersonalizedContent>();
        public DateTime lastUpdated;
        public float engagementScore;
        public float satisfactionScore;
        public float difficultyPreference;
        public List<string> favoriteGemTypes = new List<string>();
        public List<string> favoriteLevelTypes = new List<string>();
        public float averageSessionLength;
        public int totalSessions;
        public float churnRisk;
    }
    
    public enum PlayStyle
    {
        Casual,
        Competitive,
        Explorer,
        Achiever,
        Social,
        Collector,
        Strategist,
        SpeedRunner
    }
    
    public enum SkillLevel
    {
        Beginner,
        Novice,
        Intermediate,
        Advanced,
        Expert,
        Master
    }
    
    [System.Serializable]
    public class PlayerPreferences
    {
        public float visualComplexityPreference;
        public float audioIntensityPreference;
        public float challengePreference;
        public float socialInteractionPreference;
        public float explorationPreference;
        public float collectionPreference;
        public float competitionPreference;
        public float relaxationPreference;
    }
    
    public enum EmotionalState
    {
        Excited,
        Frustrated,
        Bored,
        Satisfied,
        Confused,
        Engaged,
        Relaxed,
        Stressed
    }
    
    [System.Serializable]
    public class BehaviorPattern
    {
        public string patternId;
        public string description;
        public float confidence;
        public List<string> triggers = new List<string>();
        public List<string> actions = new List<string>();
        public DateTime firstObserved;
        public DateTime lastObserved;
        public int frequency;
    }
    
    [System.Serializable]
    public class PersonalizedContent
    {
        public string contentId;
        public string contentType;
        public float relevanceScore;
        public float engagementScore;
        public Dictionary<string, object> parameters = new Dictionary<string, object>();
        public DateTime created;
        public DateTime lastShown;
        public int timesShown;
        public bool isActive;
    }
    
    public class AIPersonalizationEngine : MonoBehaviour
    {
        [Header("AI Settings")]
        public bool enableMachineLearning = true;
        public bool enableRealTimeAdaptation = true;
        public float learningRate = 0.1f;
        public float adaptationThreshold = 0.7f;
        public int maxBehaviorPatterns = 50;
        public int maxPersonalizedContent = 100;
        
        [Header("Analysis Settings")]
        public float analysisInterval = 30f;
        public int minDataPoints = 10;
        public float confidenceThreshold = 0.6f;
        
        [Header("Content Generation")]
        public bool enableDynamicContent = true;
        public bool enablePredictiveHints = true;
        public bool enableEmotionalAdaptation = true;
        
        public static AIPersonalizationEngine Instance { get; private set; }
        
        private Dictionary<string, PlayerProfile> playerProfiles = new Dictionary<string, PlayerProfile>();
        private Dictionary<string, List<GameEvent>> gameEvents = new Dictionary<string, List<GameEvent>>();
        private MachineLearningModel mlModel;
        private BehaviorAnalyzer behaviorAnalyzer;
        private ContentGenerator contentGenerator;
        private EmotionalAnalyzer emotionalAnalyzer;
        private ChurnPredictor churnPredictor;
        
        [System.Serializable]
        public class GameEvent
        {
            public string eventType;
            public Dictionary<string, object> parameters;
            public DateTime timestamp;
            public float duration;
            public string context;
        }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeAI();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            InitializeComponents();
            StartCoroutine(ContinuousAnalysis());
        }
        
        private void InitializeAI()
        {
            // Initialize AI components
            mlModel = new MachineLearningModel();
            behaviorAnalyzer = new BehaviorAnalyzer();
            contentGenerator = new ContentGenerator();
            emotionalAnalyzer = new EmotionalAnalyzer();
            churnPredictor = new ChurnPredictor();
        }
        
        private void InitializeComponents()
        {
            // Initialize machine learning model
            if (enableMachineLearning)
            {
                mlModel.Initialize(learningRate, adaptationThreshold);
            }
            
            // Initialize analyzers
            behaviorAnalyzer.Initialize(maxBehaviorPatterns, confidenceThreshold);
            emotionalAnalyzer.Initialize();
            churnPredictor.Initialize();
            
            // Initialize content generator
            if (enableDynamicContent)
            {
                contentGenerator.Initialize(maxPersonalizedContent);
            }
        }
        
        private IEnumerator ContinuousAnalysis()
        {
            while (true)
            {
                yield return new WaitForSeconds(analysisInterval);
                
                if (enableRealTimeAdaptation)
                {
                    AnalyzeAllPlayers();
                    GeneratePersonalizedContent();
                    PredictChurn();
                }
            }
        }
        
        public void RecordGameEvent(string playerId, string eventType, Dictionary<string, object> parameters = null, float duration = 0f, string context = "")
        {
            if (!gameEvents.ContainsKey(playerId))
            {
                gameEvents[playerId] = new List<GameEvent>();
            }
            
            var gameEvent = new GameEvent
            {
                eventType = eventType,
                parameters = parameters ?? new Dictionary<string, object>(),
                timestamp = DateTime.Now,
                duration = duration,
                context = context
            };
            
            gameEvents[playerId].Add(gameEvent);
            
            // Keep only recent events (last 24 hours)
            var cutoffTime = DateTime.Now.AddHours(-24);
            gameEvents[playerId] = gameEvents[playerId].Where(e => e.timestamp > cutoffTime).ToList();
            
            // Analyze player behavior in real-time
            if (enableRealTimeAdaptation)
            {
                AnalyzePlayerBehavior(playerId);
            }
        }
        
        public PlayerProfile GetPlayerProfile(string playerId)
        {
            if (!playerProfiles.ContainsKey(playerId))
            {
                CreatePlayerProfile(playerId);
            }
            
            return playerProfiles[playerId];
        }
        
        private void CreatePlayerProfile(string playerId)
        {
            var profile = new PlayerProfile
            {
                playerId = playerId,
                playStyle = PlayStyle.Casual,
                skillLevel = SkillLevel.Beginner,
                preferences = new PlayerPreferences(),
                emotionalState = EmotionalState.Engaged,
                lastUpdated = DateTime.Now,
                engagementScore = 0.5f,
                satisfactionScore = 0.5f,
                difficultyPreference = 0.5f,
                averageSessionLength = 0f,
                totalSessions = 0,
                churnRisk = 0.1f
            };
            
            playerProfiles[playerId] = profile;
        }
        
        private void AnalyzePlayerBehavior(string playerId)
        {
            if (!gameEvents.ContainsKey(playerId) || gameEvents[playerId].Count < minDataPoints)
                return;
            
            var profile = GetPlayerProfile(playerId);
            var events = gameEvents[playerId];
            
            // Analyze play style
            profile.playStyle = AnalyzePlayStyle(events);
            
            // Analyze skill level
            profile.skillLevel = AnalyzeSkillLevel(events);
            
            // Analyze preferences
            profile.preferences = AnalyzePreferences(events);
            
            // Analyze emotional state
            profile.emotionalState = AnalyzeEmotionalState(events);
            
            // Analyze behavior patterns
            var newPatterns = behaviorAnalyzer.AnalyzePatterns(events);
            foreach (var pattern in newPatterns)
            {
                if (!profile.behaviorPatterns.Any(p => p.patternId == pattern.patternId))
                {
                    profile.behaviorPatterns.Add(pattern);
                }
            }
            
            // Update engagement and satisfaction scores
            profile.engagementScore = CalculateEngagementScore(events);
            profile.satisfactionScore = CalculateSatisfactionScore(events);
            
            // Update difficulty preference
            profile.difficultyPreference = CalculateDifficultyPreference(events);
            
            // Update session data
            UpdateSessionData(profile, events);
            
            // Calculate churn risk
            profile.churnRisk = churnPredictor.PredictChurn(profile, events);
            
            profile.lastUpdated = DateTime.Now;
        }
        
        private PlayStyle AnalyzePlayStyle(List<GameEvent> events)
        {
            var styleScores = new Dictionary<PlayStyle, float>();
            
            foreach (var playStyle in Enum.GetValues(typeof(PlayStyle)).Cast<PlayStyle>())
            {
                styleScores[playStyle] = 0f;
            }
            
            foreach (var evt in events)
            {
                switch (evt.eventType)
                {
                    case "level_complete":
                        if (evt.parameters.ContainsKey("time") && (float)evt.parameters["time"] < 30f)
                            styleScores[PlayStyle.SpeedRunner] += 1f;
                        else
                            styleScores[PlayStyle.Casual] += 0.5f;
                        break;
                    case "tournament_participation":
                        styleScores[PlayStyle.Competitive] += 2f;
                        break;
                    case "exploration_action":
                        styleScores[PlayStyle.Explorer] += 1f;
                        break;
                    case "achievement_unlocked":
                        styleScores[PlayStyle.Achiever] += 1f;
                        break;
                    case "social_interaction":
                        styleScores[PlayStyle.Social] += 1f;
                        break;
                    case "collection_item":
                        styleScores[PlayStyle.Collector] += 1f;
                        break;
                    case "strategic_planning":
                        styleScores[PlayStyle.Strategist] += 1f;
                        break;
                }
            }
            
            return styleScores.OrderByDescending(kvp => kvp.Value).First().Key;
        }
        
        private SkillLevel AnalyzeSkillLevel(List<GameEvent> events)
        {
            float skillScore = 0f;
            int levelCompletions = 0;
            float totalTime = 0f;
            int perfectLevels = 0;
            
            foreach (var evt in events)
            {
                if (evt.eventType == "level_complete")
                {
                    levelCompletions++;
                    if (evt.parameters.ContainsKey("time"))
                        totalTime += (float)evt.parameters["time"];
                    if (evt.parameters.ContainsKey("stars") && (int)evt.parameters["stars"] == 3)
                        perfectLevels++;
                }
            }
            
            if (levelCompletions == 0) return SkillLevel.Beginner;
            
            float averageTime = totalTime / levelCompletions;
            float perfectRate = (float)perfectLevels / levelCompletions;
            
            skillScore = (perfectRate * 0.6f) + ((300f - averageTime) / 300f * 0.4f);
            
            if (skillScore < 0.2f) return SkillLevel.Beginner;
            if (skillScore < 0.4f) return SkillLevel.Novice;
            if (skillScore < 0.6f) return SkillLevel.Intermediate;
            if (skillScore < 0.8f) return SkillLevel.Advanced;
            if (skillScore < 0.95f) return SkillLevel.Expert;
            return SkillLevel.Master;
        }
        
        private PlayerPreferences AnalyzePreferences(List<GameEvent> events)
        {
            var preferences = new PlayerPreferences();
            
            // Analyze visual complexity preference
            var visualEvents = events.Count(e => e.eventType.Contains("visual") || e.eventType.Contains("effect"));
            preferences.visualComplexityPreference = Mathf.Clamp01((float)visualEvents / events.Count);
            
            // Analyze audio intensity preference
            var audioEvents = events.Count(e => e.eventType.Contains("audio") || e.eventType.Contains("sound"));
            preferences.audioIntensityPreference = Mathf.Clamp01((float)audioEvents / events.Count);
            
            // Analyze challenge preference
            var challengeEvents = events.Count(e => e.eventType.Contains("challenge") || e.eventType.Contains("difficult"));
            preferences.challengePreference = Mathf.Clamp01((float)challengeEvents / events.Count);
            
            // Analyze social interaction preference
            var socialEvents = events.Count(e => e.eventType.Contains("social") || e.eventType.Contains("friend"));
            preferences.socialInteractionPreference = Mathf.Clamp01((float)socialEvents / events.Count);
            
            // Analyze exploration preference
            var explorationEvents = events.Count(e => e.eventType.Contains("explore") || e.eventType.Contains("discover"));
            preferences.explorationPreference = Mathf.Clamp01((float)explorationEvents / events.Count);
            
            // Analyze collection preference
            var collectionEvents = events.Count(e => e.eventType.Contains("collect") || e.eventType.Contains("item"));
            preferences.collectionPreference = Mathf.Clamp01((float)collectionEvents / events.Count);
            
            // Analyze competition preference
            var competitionEvents = events.Count(e => e.eventType.Contains("tournament") || e.eventType.Contains("leaderboard"));
            preferences.competitionPreference = Mathf.Clamp01((float)competitionEvents / events.Count);
            
            // Analyze relaxation preference
            var relaxationEvents = events.Count(e => e.eventType.Contains("relax") || e.eventType.Contains("casual"));
            preferences.relaxationPreference = Mathf.Clamp01((float)relaxationEvents / events.Count);
            
            return preferences;
        }
        
        private EmotionalState AnalyzeEmotionalState(List<GameEvent> events)
        {
            var recentEvents = events.Where(e => e.timestamp > DateTime.Now.AddMinutes(-30)).ToList();
            
            if (recentEvents.Count == 0) return EmotionalState.Engaged;
            
            var emotionalIndicators = new Dictionary<EmotionalState, float>();
            
            foreach (var emotionalState in Enum.GetValues(typeof(EmotionalState)).Cast<EmotionalState>())
            {
                emotionalIndicators[emotionalState] = 0f;
            }
            
            foreach (var evt in recentEvents)
            {
                switch (evt.eventType)
                {
                    case "level_complete":
                        if (evt.parameters.ContainsKey("stars") && (int)evt.parameters["stars"] == 3)
                            emotionalIndicators[EmotionalState.Satisfied] += 2f;
                        else
                            emotionalIndicators[EmotionalState.Engaged] += 1f;
                        break;
                    case "level_failed":
                        emotionalIndicators[EmotionalState.Frustrated] += 1f;
                        break;
                    case "achievement_unlocked":
                        emotionalIndicators[EmotionalState.Excited] += 2f;
                        break;
                    case "long_pause":
                        emotionalIndicators[EmotionalState.Bored] += 1f;
                        break;
                    case "quick_exit":
                        emotionalIndicators[EmotionalState.Stressed] += 1f;
                        break;
                    case "social_interaction":
                        emotionalIndicators[EmotionalState.Engaged] += 1f;
                        break;
                }
            }
            
            return emotionalIndicators.OrderByDescending(kvp => kvp.Value).First().Key;
        }
        
        private float CalculateEngagementScore(List<GameEvent> events)
        {
            if (events.Count == 0) return 0f;
            
            float score = 0f;
            var recentEvents = events.Where(e => e.timestamp > DateTime.Now.AddHours(-1)).ToList();
            
            // Session frequency
            score += Mathf.Clamp01(recentEvents.Count / 20f) * 0.3f;
            
            // Event diversity
            var uniqueEventTypes = recentEvents.Select(e => e.eventType).Distinct().Count();
            score += Mathf.Clamp01(uniqueEventTypes / 10f) * 0.2f;
            
            // Interaction depth
            var interactionEvents = recentEvents.Count(e => e.eventType.Contains("interaction") || e.eventType.Contains("action"));
            score += Mathf.Clamp01(interactionEvents / 15f) * 0.3f;
            
            // Social engagement
            var socialEvents = recentEvents.Count(e => e.eventType.Contains("social"));
            score += Mathf.Clamp01(socialEvents / 5f) * 0.2f;
            
            return Mathf.Clamp01(score);
        }
        
        private float CalculateSatisfactionScore(List<GameEvent> events)
        {
            if (events.Count == 0) return 0f;
            
            float score = 0f;
            var recentEvents = events.Where(e => e.timestamp > DateTime.Now.AddHours(-1)).ToList();
            
            // Success rate
            var successEvents = recentEvents.Count(e => e.eventType.Contains("complete") || e.eventType.Contains("success"));
            var totalEvents = recentEvents.Count;
            score += (totalEvents > 0 ? (float)successEvents / totalEvents : 0f) * 0.4f;
            
            // Achievement rate
            var achievementEvents = recentEvents.Count(e => e.eventType.Contains("achievement"));
            score += Mathf.Clamp01(achievementEvents / 3f) * 0.3f;
            
            // Positive feedback
            var positiveEvents = recentEvents.Count(e => e.eventType.Contains("like") || e.eventType.Contains("favorite"));
            score += Mathf.Clamp01(positiveEvents / 2f) * 0.3f;
            
            return Mathf.Clamp01(score);
        }
        
        private float CalculateDifficultyPreference(List<GameEvent> events)
        {
            if (events.Count == 0) return 0.5f;
            
            var levelEvents = events.Where(e => e.eventType == "level_complete" || e.eventType == "level_failed").ToList();
            if (levelEvents.Count == 0) return 0.5f;
            
            float totalDifficulty = 0f;
            int difficultyCount = 0;
            
            foreach (var evt in levelEvents)
            {
                if (evt.parameters.ContainsKey("difficulty"))
                {
                    totalDifficulty += (float)evt.parameters["difficulty"];
                    difficultyCount++;
                }
            }
            
            return difficultyCount > 0 ? totalDifficulty / difficultyCount : 0.5f;
        }
        
        private void UpdateSessionData(PlayerProfile profile, List<GameEvent> events)
        {
            var sessionEvents = events.Where(e => e.eventType == "session_start" || e.eventType == "session_end").ToList();
            profile.totalSessions = sessionEvents.Count(e => e.eventType == "session_start");
            
            if (profile.totalSessions > 0)
            {
                var sessionDurations = new List<float>();
                for (int i = 0; i < sessionEvents.Count - 1; i++)
                {
                    if (sessionEvents[i].eventType == "session_start" && sessionEvents[i + 1].eventType == "session_end")
                    {
                        var duration = (float)(sessionEvents[i + 1].timestamp - sessionEvents[i].timestamp).TotalMinutes;
                        sessionDurations.Add(duration);
                    }
                }
                
                if (sessionDurations.Count > 0)
                {
                    profile.averageSessionLength = sessionDurations.Average();
                }
            }
        }
        
        private void AnalyzeAllPlayers()
        {
            foreach (var playerId in gameEvents.Keys)
            {
                AnalyzePlayerBehavior(playerId);
            }
        }
        
        private void GeneratePersonalizedContent()
        {
            if (!enableDynamicContent) return;
            
            foreach (var profile in playerProfiles.Values)
            {
                var content = contentGenerator.GenerateContent(profile);
                if (content != null)
                {
                    profile.personalizedContent.Add(content);
                    
                    // Keep only recent content
                    if (profile.personalizedContent.Count > maxPersonalizedContent)
                    {
                        profile.personalizedContent = profile.personalizedContent
                            .OrderByDescending(c => c.created)
                            .Take(maxPersonalizedContent)
                            .ToList();
                    }
                }
            }
        }
        
        private void PredictChurn()
        {
            foreach (var profile in playerProfiles.Values)
            {
                if (gameEvents.ContainsKey(profile.playerId))
                {
                    profile.churnRisk = churnPredictor.PredictChurn(profile, gameEvents[profile.playerId]);
                }
            }
        }
        
        public PersonalizedContent GetPersonalizedContent(string playerId, string contentType)
        {
            var profile = GetPlayerProfile(playerId);
            return profile.personalizedContent
                .Where(c => c.contentType == contentType && c.isActive)
                .OrderByDescending(c => c.relevanceScore)
                .FirstOrDefault();
        }
        
        public List<PersonalizedContent> GetAllPersonalizedContent(string playerId)
        {
            var profile = GetPlayerProfile(playerId);
            return profile.personalizedContent
                .Where(c => c.isActive)
                .OrderByDescending(c => c.relevanceScore)
                .ToList();
        }
        
        public void UpdateContentEngagement(string playerId, string contentId, float engagementScore)
        {
            var profile = GetPlayerProfile(playerId);
            var content = profile.personalizedContent.FirstOrDefault(c => c.contentId == contentId);
            if (content != null)
            {
                content.engagementScore = engagementScore;
                content.lastShown = DateTime.Now;
                content.timesShown++;
            }
        }
        
        public bool ShouldShowHint(string playerId)
        {
            if (!enablePredictiveHints) return false;
            
            var profile = GetPlayerProfile(playerId);
            return profile.emotionalState == EmotionalState.Frustrated || 
                   profile.engagementScore < 0.3f;
        }
        
        public string GetPersonalizedHint(string playerId)
        {
            var profile = GetPlayerProfile(playerId);
            
            switch (profile.playStyle)
            {
                case PlayStyle.Casual:
                    return "Take your time and enjoy the puzzle!";
                case PlayStyle.Competitive:
                    return "Focus on creating the biggest combos!";
                case PlayStyle.Explorer:
                    return "Try different strategies to discover new patterns!";
                case PlayStyle.Achiever:
                    return "Aim for three stars to unlock achievements!";
                case PlayStyle.Social:
                    return "Share your progress with friends!";
                case PlayStyle.Collector:
                    return "Look for special gems to add to your collection!";
                case PlayStyle.Strategist:
                    return "Plan your moves several steps ahead!";
                case PlayStyle.SpeedRunner:
                    return "Quick thinking leads to faster completion!";
                default:
                    return "You're doing great! Keep it up!";
            }
        }
        
        public float GetOptimalDifficulty(string playerId)
        {
            var profile = GetPlayerProfile(playerId);
            return profile.difficultyPreference;
        }
        
        public List<string> GetRecommendedGemTypes(string playerId)
        {
            var profile = GetPlayerProfile(playerId);
            return profile.favoriteGemTypes;
        }
        
        public List<string> GetRecommendedLevelTypes(string playerId)
        {
            var profile = GetPlayerProfile(playerId);
            return profile.favoriteLevelTypes;
        }
        
        public bool IsPlayerAtRiskOfChurning(string playerId)
        {
            var profile = GetPlayerProfile(playerId);
            return profile.churnRisk > 0.7f;
        }
        
        public void TriggerRetentionAction(string playerId)
        {
            var profile = GetPlayerProfile(playerId);
            
            // Generate personalized retention content
            var retentionContent = new PersonalizedContent
            {
                contentId = $"retention_{playerId}_{DateTime.Now.Ticks}",
                contentType = "retention",
                relevanceScore = 1.0f,
                engagementScore = 0.0f,
                created = DateTime.Now,
                isActive = true
            };
            
            // Add retention-specific parameters
            retentionContent.parameters["offer_type"] = "comeback";
            retentionContent.parameters["discount"] = 0.5f;
            retentionContent.parameters["message"] = "We miss you! Here's a special offer!";
            
            profile.personalizedContent.Add(retentionContent);
        }
        
        public Dictionary<string, object> GetPlayerInsights(string playerId)
        {
            var profile = GetPlayerProfile(playerId);
            
            return new Dictionary<string, object>
            {
                {"play_style", profile.playStyle.ToString()},
                {"skill_level", profile.skillLevel.ToString()},
                {"emotional_state", profile.emotionalState.ToString()},
                {"engagement_score", profile.engagementScore},
                {"satisfaction_score", profile.satisfactionScore},
                {"churn_risk", profile.churnRisk},
                {"total_sessions", profile.totalSessions},
                {"average_session_length", profile.averageSessionLength},
                {"behavior_patterns_count", profile.behaviorPatterns.Count},
                {"personalized_content_count", profile.personalizedContent.Count}
            };
        }
    }
    
    // Supporting classes
    public class MachineLearningModel
    {
        public void Initialize(float learningRate, float adaptationThreshold) { }
    }
    
    public class BehaviorAnalyzer
    {
        public void Initialize(int maxPatterns, float confidenceThreshold) { }
        public List<BehaviorPattern> AnalyzePatterns(List<AIPersonalizationEngine.GameEvent> events) { return new List<BehaviorPattern>(); }
    }
    
    public class ContentGenerator
    {
        public void Initialize(int maxContent) { }
        public PersonalizedContent GenerateContent(PlayerProfile profile) { return null; }
    }
    
    public class EmotionalAnalyzer
    {
        public void Initialize() { }
    }
    
    public class ChurnPredictor
    {
        public void Initialize() { }
        public float PredictChurn(PlayerProfile profile, List<AIPersonalizationEngine.GameEvent> events) { return 0.1f; }
    }
}