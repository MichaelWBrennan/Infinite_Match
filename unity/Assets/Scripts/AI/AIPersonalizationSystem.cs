using UnityEngine;
using System.Collections.Generic;
using System;
using System.Collections;
using Evergreen.Core;
using Evergreen.Analytics;

namespace Evergreen.AI
{
    [System.Serializable]
    public class PlayerProfile
    {
        public string playerId;
        public PlayerSegment segment;
        public PlayerBehaviorPattern behaviorPattern;
        public DifficultyPreference difficultyPreference;
        public ContentPreference contentPreference;
        public MonetizationProfile monetizationProfile;
        public EngagementProfile engagementProfile;
        public PerformanceProfile performanceProfile;
        public DateTime lastUpdated;
        public float confidenceScore;
        public Dictionary<string, float> featureWeights = new Dictionary<string, float>();
        public List<string> recommendedContent = new List<string>();
        public List<string> recommendedOffers = new List<string>();
        public List<string> recommendedEvents = new List<string>();
    }

    [System.Serializable]
    public class PlayerSegment
    {
        public string id;
        public string name;
        public string description;
        public List<SegmentCriteria> criteria = new List<SegmentCriteria>();
        public float priority;
        public Dictionary<string, float> preferences = new Dictionary<string, float>();
        public List<string> recommendedFeatures = new List<string>();
        public List<string> recommendedContent = new List<string>();
        public List<string> recommendedOffers = new List<string>();
    }

    [System.Serializable]
    public class SegmentCriteria
    {
        public string metric;
        public string operatorType;
        public float value;
        public float weight;
    }

    [System.Serializable]
    public class PlayerBehaviorPattern
    {
        public string patternId;
        public string name;
        public string description;
        public List<BehaviorMetric> metrics = new List<BehaviorMetric>();
        public float confidence;
        public DateTime lastSeen;
        public int frequency;
        public Dictionary<string, float> predictions = new Dictionary<string, float>();
    }

    [System.Serializable]
    public class BehaviorMetric
    {
        public string name;
        public float value;
        public float weight;
        public DateTime timestamp;
    }

    [System.Serializable]
    public class DifficultyPreference
    {
        public float preferredDifficulty;
        public float difficultyTolerance;
        public float challengeSeeking;
        public float frustrationThreshold;
        public List<DifficultyAdjustment> adjustments = new List<DifficultyAdjustment>();
        public DateTime lastAdjusted;
    }

    [System.Serializable]
    public class DifficultyAdjustment
    {
        public string reason;
        public float adjustment;
        public DateTime timestamp;
        public bool wasSuccessful;
    }

    [System.Serializable]
    public class ContentPreference
    {
        public Dictionary<string, float> contentTypes = new Dictionary<string, float>();
        public Dictionary<string, float> themes = new Dictionary<string, float>();
        public Dictionary<string, float> mechanics = new Dictionary<string, float>();
        public List<string> favoriteContent = new List<string>();
        public List<string> dislikedContent = new List<string>();
        public float noveltySeeking;
        public float completionRate;
    }

    [System.Serializable]
    public class MonetizationProfile
    {
        public float spendingTendency;
        public float priceSensitivity;
        public List<string> preferredOfferTypes = new List<string>();
        public List<string> preferredCurrencies = new List<string>();
        public float averagePurchaseValue;
        public int purchaseFrequency;
        public float conversionRate;
        public List<string> purchaseTriggers = new List<string>();
        public DateTime lastPurchase;
        public float lifetimeValue;
    }

    [System.Serializable]
    public class EngagementProfile
    {
        public float sessionFrequency;
        public float sessionDuration;
        public float retentionRate;
        public List<string> engagementTriggers = new List<string>();
        public List<string> disengagementFactors = new List<string>();
        public float socialEngagement;
        public float competitiveEngagement;
        public float explorationEngagement;
        public DateTime lastActive;
        public int consecutiveDays;
    }

    [System.Serializable]
    public class PerformanceProfile
    {
        public float averageScore;
        public float averageMoves;
        public float averageTime;
        public float completionRate;
        public float failureRate;
        public List<string> strengths = new List<string>();
        public List<string> weaknesses = new List<string>();
        public float improvementRate;
        public DateTime lastAssessment;
    }

    [System.Serializable]
    public class PersonalizationRule
    {
        public string id;
        public string name;
        public string description;
        public List<RuleCondition> conditions = new List<RuleCondition>();
        public List<RuleAction> actions = new List<RuleAction>();
        public float priority;
        public bool isActive;
        public DateTime lastTriggered;
        public int triggerCount;
        public float successRate;
    }

    [System.Serializable]
    public class RuleCondition
    {
        public string metric;
        public string operatorType;
        public float value;
        public float weight;
    }

    [System.Serializable]
    public class RuleAction
    {
        public string actionType;
        public Dictionary<string, object> parameters = new Dictionary<string, object>();
        public float intensity;
    }

    [System.Serializable]
    public class PersonalizationModel
    {
        public string modelId;
        public string name;
        public string description;
        public List<string> inputFeatures = new List<string>();
        public List<string> outputFeatures = new List<string>();
        public Dictionary<string, float> weights = new Dictionary<string, float>();
        public float accuracy;
        public DateTime lastTrained;
        public int trainingSamples;
        public bool isActive;
    }

    public class AIPersonalizationSystem : MonoBehaviour
    {
        [Header("AI Settings")]
        public bool enablePersonalization = true;
        public bool enableLearning = true;
        public bool enablePrediction = true;
        public bool enableRecommendation = true;
        public bool enableDifficultyAdjustment = true;
        
        [Header("Web AI Settings")]
        public bool enableWebAI = false;
        public bool enableAlgorithmicAI = true;
        public string webAIServiceUrl = "";
        public bool useLocalDataOnly = true;
        
        [Header("Model Settings")]
        public float modelUpdateInterval = 3600f; // 1 hour
        public int minSamplesForTraining = 100;
        public float learningRate = 0.01f;
        public float regularizationStrength = 0.1f;
        public int maxIterations = 1000;
        
        [Header("Personalization Settings")]
        public float personalizationStrength = 0.8f;
        public float confidenceThreshold = 0.7f;
        public int maxRecommendations = 10;
        public float recommendationDecay = 0.9f;
        
        private Dictionary<string, PlayerProfile> _playerProfiles = new Dictionary<string, PlayerProfile>();
        private Dictionary<string, PersonalizationRule> _personalizationRules = new Dictionary<string, PersonalizationRule>();
        private Dictionary<string, PersonalizationModel> _personalizationModels = new Dictionary<string, PersonalizationModel>();
        private Dictionary<string, List<BehaviorMetric>> _behaviorHistory = new Dictionary<string, List<BehaviorMetric>>();
        private Dictionary<string, float> _featureImportance = new Dictionary<string, float>();
        private WebAIPersonalizationAdapter _webAIAdapter;
        private AlgorithmicPersonalizationEngine _algorithmicEngine;
        
        // Events
        public System.Action<PlayerProfile> OnProfileUpdated;
        public System.Action<PersonalizationRule> OnRuleTriggered;
        public System.Action<PersonalizationModel> OnModelUpdated;
        public System.Action<string, List<string>> OnRecommendationsGenerated;
        
        public static AIPersonalizationSystem Instance { get; private set; }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializePersonalizationsystemSafe();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            LoadPersonalizationData();
            CreateDefaultRules();
            CreateDefaultModels();
            StartCoroutine(UpdatePersonalizationModels());
        }
        
        private void InitializePersonalizationsystemSafe()
        {
            if (!enablePersonalization) return;
            
            // Initialize web-compatible AI components
            if (enableWebAI && !string.IsNullOrEmpty(webAIServiceUrl))
            {
                _webAIAdapter = new WebAIPersonalizationAdapter(webAIServiceUrl);
            }
            
            if (enableAlgorithmicAI)
            {
                _algorithmicEngine = new AlgorithmicPersonalizationEngine();
            }
            
            Debug.Log("Web-Compatible AI Personalization System initialized");
        }
        
        private void CreateDefaultRules()
        {
            if (_personalizationRules.Count == 0)
            {
                // High Spender Rule
                var highSpenderRule = new PersonalizationRule
                {
                    id = "high_spender_rule",
                    name = "High Spender Personalization",
                    description = "Personalize experience for high-spending players",
                    conditions = new List<RuleCondition>
                    {
                        new RuleCondition { metric = "lifetime_value", operatorType = "greater_than", value = 100f, weight = 1.0f },
                        new RuleCondition { metric = "purchase_frequency", operatorType = "greater_than", value = 5f, weight = 0.8f }
                    },
                    actions = new List<RuleAction>
                    {
                        new RuleAction { actionType = "increase_offer_frequency", parameters = new Dictionary<string, object> { {"multiplier", 1.5f} }, intensity = 0.8f },
                        new RuleAction { actionType = "show_premium_content", parameters = new Dictionary<string, object> { {"priority", 1.0f} }, intensity = 0.9f }
                    },
                    priority = 1.0f,
                    isActive = true
                };
                _personalizationRules[highSpenderRule.id] = highSpenderRule;
                
                // Struggling Player Rule
                var strugglingPlayerRule = new PersonalizationRule
                {
                    id = "struggling_player_rule",
                    name = "Struggling Player Support",
                    description = "Provide support for struggling players",
                    conditions = new List<RuleCondition>
                    {
                        new RuleCondition { metric = "completion_rate", operatorType = "less_than", value = 0.3f, weight = 1.0f },
                        new RuleCondition { metric = "failure_rate", operatorType = "greater_than", value = 0.7f, weight = 0.9f }
                    },
                    actions = new List<RuleAction>
                    {
                        new RuleAction { actionType = "reduce_difficulty", parameters = new Dictionary<string, object> { {"reduction", 0.2f} }, intensity = 0.7f },
                        new RuleAction { actionType = "show_tutorials", parameters = new Dictionary<string, object> { {"frequency", 1.0f} }, intensity = 0.8f },
                        new RuleAction { actionType = "offer_help", parameters = new Dictionary<string, object> { {"type", "hints"} }, intensity = 0.6f }
                    },
                    priority = 0.9f,
                    isActive = true
                };
                _personalizationRules[strugglingPlayerRule.id] = strugglingPlayerRule;
                
                // Engaged Player Rule
                var engagedPlayerRule = new PersonalizationRule
                {
                    id = "engaged_player_rule",
                    name = "Engaged Player Enhancement",
                    description = "Enhance experience for highly engaged players",
                    conditions = new List<RuleCondition>
                    {
                        new RuleCondition { metric = "session_frequency", operatorType = "greater_than", value = 0.8f, weight = 1.0f },
                        new RuleCondition { metric = "retention_rate", operatorType = "greater_than", value = 0.9f, weight = 0.8f }
                    },
                    actions = new List<RuleAction>
                    {
                        new RuleAction { actionType = "increase_challenge", parameters = new Dictionary<string, object> { {"increase", 0.1f} }, intensity = 0.6f },
                        new RuleAction { actionType = "show_new_content", parameters = new Dictionary<string, object> { {"priority", 1.0f} }, intensity = 0.8f },
                        new RuleAction { actionType = "enable_social_features", parameters = new Dictionary<string, object> { {"features", "leaderboards,teams"} }, intensity = 0.7f }
                    },
                    priority = 0.8f,
                    isActive = true
                };
                _personalizationRules[engagedPlayerRule.id] = engagedPlayerRule;
            }
        }
        
        private void CreateDefaultModels()
        {
            if (_personalizationModels.Count == 0)
            {
                // Content Recommendation Model
                var contentModel = new PersonalizationModel
                {
                    modelId = "content_recommendation",
                    name = "Content Recommendation Model",
                    description = "Recommends content based on player preferences",
                    inputFeatures = new List<string> { "level", "completion_rate", "content_types", "themes", "mechanics" },
                    outputFeatures = new List<string> { "content_recommendations" },
                    weights = new Dictionary<string, float>(),
                    accuracy = 0.0f,
                    lastTrained = DateTime.Now,
                    trainingSamples = 0,
                    isActive = true
                };
                _personalizationModels[contentModel.modelId] = contentModel;
                
                // Offer Recommendation Model
                var offerModel = new PersonalizationModel
                {
                    modelId = "offer_recommendation",
                    name = "Offer Recommendation Model",
                    description = "Recommends offers based on player behavior",
                    inputFeatures = new List<string> { "spending_tendency", "price_sensitivity", "purchase_history", "currency_balance" },
                    outputFeatures = new List<string> { "offer_recommendations" },
                    weights = new Dictionary<string, float>(),
                    accuracy = 0.0f,
                    lastTrained = DateTime.Now,
                    trainingSamples = 0,
                    isActive = true
                };
                _personalizationModels[offerModel.modelId] = offerModel;
                
                // Difficulty Adjustment Model
                var difficultyModel = new PersonalizationModel
                {
                    modelId = "difficulty_adjustment",
                    name = "Difficulty Adjustment Model",
                    description = "Adjusts difficulty based on player performance",
                    inputFeatures = new List<string> { "completion_rate", "average_score", "average_moves", "failure_rate" },
                    outputFeatures = new List<string> { "difficulty_adjustment" },
                    weights = new Dictionary<string, float>(),
                    accuracy = 0.0f,
                    lastTrained = DateTime.Now,
                    trainingSamples = 0,
                    isActive = true
                };
                _personalizationModels[difficultyModel.modelId] = difficultyModel;
            }
        }
        
        public PlayerProfile GetPlayerProfile(string playerId)
        {
            if (!_playerProfiles.ContainsKey(playerId))
            {
                _playerProfiles[playerId] = CreateDefaultProfile(playerId);
            }
            
            return _playerProfiles[playerId];
        }
        
        private PlayerProfile CreateDefaultProfile(string playerId)
        {
            return new PlayerProfile
            {
                playerId = playerId,
                segment = new PlayerSegment
                {
                    id = "new_player",
                    name = "New Player",
                    description = "New player with no history",
                    criteria = new List<SegmentCriteria>(),
                    priority = 0.5f,
                    preferences = new Dictionary<string, float>(),
                    recommendedFeatures = new List<string>(),
                    recommendedContent = new List<string>(),
                    recommendedOffers = new List<string>()
                },
                behaviorPattern = new PlayerBehaviorPattern
                {
                    patternId = "unknown",
                    name = "Unknown Pattern",
                    description = "No pattern detected yet",
                    metrics = new List<BehaviorMetric>(),
                    confidence = 0.0f,
                    lastSeen = DateTime.Now,
                    frequency = 0,
                    predictions = new Dictionary<string, float>()
                },
                difficultyPreference = new DifficultyPreference
                {
                    preferredDifficulty = 0.5f,
                    difficultyTolerance = 0.2f,
                    challengeSeeking = 0.5f,
                    frustrationThreshold = 0.8f,
                    adjustments = new List<DifficultyAdjustment>(),
                    lastAdjusted = DateTime.Now
                },
                contentPreference = new ContentPreference
                {
                    contentTypes = new Dictionary<string, float>(),
                    themes = new Dictionary<string, float>(),
                    mechanics = new Dictionary<string, float>(),
                    favoriteContent = new List<string>(),
                    dislikedContent = new List<string>(),
                    noveltySeeking = 0.5f,
                    completionRate = 0.0f
                },
                monetizationProfile = new MonetizationProfile
                {
                    spendingTendency = 0.0f,
                    priceSensitivity = 0.5f,
                    preferredOfferTypes = new List<string>(),
                    preferredCurrencies = new List<string>(),
                    averagePurchaseValue = 0.0f,
                    purchaseFrequency = 0,
                    conversionRate = 0.0f,
                    purchaseTriggers = new List<string>(),
                    lastPurchase = DateTime.MinValue,
                    lifetimeValue = 0.0f
                },
                engagementProfile = new EngagementProfile
                {
                    sessionFrequency = 0.0f,
                    sessionDuration = 0.0f,
                    retentionRate = 0.0f,
                    engagementTriggers = new List<string>(),
                    disengagementFactors = new List<string>(),
                    socialEngagement = 0.0f,
                    competitiveEngagement = 0.0f,
                    explorationEngagement = 0.0f,
                    lastActive = DateTime.Now,
                    consecutiveDays = 0
                },
                performanceProfile = new PerformanceProfile
                {
                    averageScore = 0.0f,
                    averageMoves = 0.0f,
                    averageTime = 0.0f,
                    completionRate = 0.0f,
                    failureRate = 0.0f,
                    strengths = new List<string>(),
                    weaknesses = new List<string>(),
                    improvementRate = 0.0f,
                    lastAssessment = DateTime.Now
                },
                lastUpdated = DateTime.Now,
                confidenceScore = 0.0f,
                featureWeights = new Dictionary<string, float>(),
                recommendedContent = new List<string>(),
                recommendedOffers = new List<string>(),
                recommendedEvents = new List<string>()
            };
        }
        
        public void UpdatePlayerBehavior(string playerId, string metric, float value, float weight = 1.0f)
        {
            if (!enablePersonalization) return;
            
            var profile = GetPlayerProfile(playerId);
            var behaviorMetric = new BehaviorMetric
            {
                name = metric,
                value = value,
                weight = weight,
                timestamp = DateTime.Now
            };
            
            if (!_behaviorHistory.ContainsKey(playerId))
            {
                _behaviorHistory[playerId] = new List<BehaviorMetric>();
            }
            _behaviorHistory[playerId].Add(behaviorMetric);
            
            // Update profile based on behavior
            UpdateProfileFromBehavior(profile, behaviorMetric);
            
            // Check for rule triggers
            CheckRuleTriggers(profile);
            
            // Update recommendations
            UpdateRecommendations(profile);
            
            OnProfileUpdated?.Invoke(profile);
        }
        
        private void UpdateProfileFromBehavior(PlayerProfile profile, BehaviorMetric metric)
        {
            switch (metric.name)
            {
                case "level_complete":
                    profile.performanceProfile.completionRate = Mathf.Lerp(profile.performanceProfile.completionRate, 1.0f, 0.1f);
                    profile.engagementProfile.sessionFrequency += 0.01f;
                    break;
                case "level_fail":
                    profile.performanceProfile.failureRate = Mathf.Lerp(profile.performanceProfile.failureRate, 1.0f, 0.1f);
                    break;
                case "purchase":
                    profile.monetizationProfile.purchaseFrequency++;
                    profile.monetizationProfile.lifetimeValue += metric.value;
                    profile.monetizationProfile.spendingTendency = Mathf.Lerp(profile.monetizationProfile.spendingTendency, 1.0f, 0.1f);
                    break;
                case "session_duration":
                    profile.engagementProfile.sessionDuration = Mathf.Lerp(profile.engagementProfile.sessionDuration, metric.value, 0.1f);
                    break;
                case "score":
                    profile.performanceProfile.averageScore = Mathf.Lerp(profile.performanceProfile.averageScore, metric.value, 0.1f);
                    break;
                case "moves":
                    profile.performanceProfile.averageMoves = Mathf.Lerp(profile.performanceProfile.averageMoves, metric.value, 0.1f);
                    break;
            }
            
            profile.lastUpdated = DateTime.Now;
        }
        
        private void CheckRuleTriggers(PlayerProfile profile)
        {
            foreach (var rule in _personalizationRules.Values)
            {
                if (!rule.isActive) continue;
                
                bool shouldTrigger = true;
                foreach (var condition in rule.conditions)
                {
                    float value = GetMetricValue(profile, condition.metric);
                    if (!EvaluateCondition(value, condition.operatorType, condition.value))
                    {
                        shouldTrigger = false;
                        break;
                    }
                }
                
                if (shouldTrigger)
                {
                    ExecuteRuleActions(profile, rule);
                    rule.lastTriggered = DateTime.Now;
                    rule.triggerCount++;
                    OnRuleTriggered?.Invoke(rule);
                }
            }
        }
        
        private float GetMetricValue(PlayerProfile profile, string metric)
        {
            switch (metric)
            {
                case "lifetime_value":
                    return profile.monetizationProfile.lifetimeValue;
                case "purchase_frequency":
                    return profile.monetizationProfile.purchaseFrequency;
                case "completion_rate":
                    return profile.performanceProfile.completionRate;
                case "failure_rate":
                    return profile.performanceProfile.failureRate;
                case "session_frequency":
                    return profile.engagementProfile.sessionFrequency;
                case "retention_rate":
                    return profile.engagementProfile.retentionRate;
                case "spending_tendency":
                    return profile.monetizationProfile.spendingTendency;
                case "price_sensitivity":
                    return profile.monetizationProfile.priceSensitivity;
                default:
                    return 0.0f;
            }
        }
        
        private bool EvaluateCondition(float value, string operatorType, float threshold)
        {
            switch (operatorType)
            {
                case "greater_than":
                    return value > threshold;
                case "less_than":
                    return value < threshold;
                case "equals":
                    return Mathf.Abs(value - threshold) < 0.01f;
                case "not_equals":
                    return Mathf.Abs(value - threshold) >= 0.01f;
                default:
                    return false;
            }
        }
        
        private void ExecuteRuleActions(PlayerProfile profile, PersonalizationRule rule)
        {
            foreach (var action in rule.actions)
            {
                ExecuteAction(profile, action);
            }
        }
        
        private void ExecuteAction(PlayerProfile profile, RuleAction action)
        {
            switch (action.actionType)
            {
                case "increase_offer_frequency":
                    // This would integrate with your offer system
                    break;
                case "show_premium_content":
                    // This would integrate with your content system
                    break;
                case "reduce_difficulty":
                    float reduction = Convert.ToSingle(action.parameters["reduction"]);
                    profile.difficultyPreference.preferredDifficulty = Mathf.Max(0.1f, profile.difficultyPreference.preferredDifficulty - reduction);
                    break;
                case "show_tutorials":
                    // This would integrate with your tutorial system
                    break;
                case "offer_help":
                    // This would integrate with your help system
                    break;
                case "increase_challenge":
                    float increase = Convert.ToSingle(action.parameters["increase"]);
                    profile.difficultyPreference.preferredDifficulty = Mathf.Min(1.0f, profile.difficultyPreference.preferredDifficulty + increase);
                    break;
                case "show_new_content":
                    // This would integrate with your content system
                    break;
                case "enable_social_features":
                    // This would integrate with your social system
                    break;
            }
        }
        
        private void UpdateRecommendations(PlayerProfile profile)
        {
            if (!enableRecommendation) return;
            
            // Update content recommendations
            profile.recommendedContent = GenerateContentRecommendations(profile);
            
            // Update offer recommendations
            profile.recommendedOffers = GenerateOfferRecommendations(profile);
            
            // Update event recommendations
            profile.recommendedEvents = GenerateEventRecommendations(profile);
        }
        
        private List<string> GenerateContentRecommendations(PlayerProfile profile)
        {
            var recommendations = new List<string>();
            
            // Simple recommendation logic - in a real system, this would use machine learning
            if (profile.contentPreference.contentTypes.ContainsKey("puzzle"))
            {
                recommendations.Add("puzzle_levels");
            }
            if (profile.contentPreference.contentTypes.ContainsKey("action"))
            {
                recommendations.Add("action_levels");
            }
            if (profile.engagementProfile.socialEngagement > 0.7f)
            {
                recommendations.Add("social_events");
            }
            if (profile.engagementProfile.competitiveEngagement > 0.7f)
            {
                recommendations.Add("tournaments");
            }
            
            return recommendations;
        }
        
        private List<string> GenerateOfferRecommendations(PlayerProfile profile)
        {
            var recommendations = new List<string>();
            
            // Simple recommendation logic
            if (profile.monetizationProfile.spendingTendency > 0.7f)
            {
                recommendations.Add("premium_pack");
                recommendations.Add("energy_pack");
            }
            if (profile.monetizationProfile.priceSensitivity < 0.3f)
            {
                recommendations.Add("discounted_offers");
            }
            if (profile.engagementProfile.sessionFrequency > 0.8f)
            {
                recommendations.Add("subscription");
            }
            
            return recommendations;
        }
        
        private List<string> GenerateEventRecommendations(PlayerProfile profile)
        {
            var recommendations = new List<string>();
            
            // Simple recommendation logic
            if (profile.engagementProfile.socialEngagement > 0.6f)
            {
                recommendations.Add("team_challenge");
            }
            if (profile.engagementProfile.competitiveEngagement > 0.6f)
            {
                recommendations.Add("tournament");
            }
            if (profile.contentPreference.noveltySeeking > 0.7f)
            {
                recommendations.Add("special_event");
            }
            
            return recommendations;
        }
        
        public float GetDifficultyAdjustment(string playerId)
        {
            if (!enableDifficultyAdjustment) return 1.0f;
            
            var profile = GetPlayerProfile(playerId);
            return profile.difficultyPreference.preferredDifficulty;
        }

        // AI Level Integration Methods
        public LevelPersonalizationData GetLevelPersonalizationData(string playerId, int levelId)
        {
            var profile = GetPlayerProfile(playerId);
            if (profile == null) return null;

            LevelPersonalizationData personalizationData;

            // Try web AI first, fallback to algorithmic AI
            if (enableWebAI && _webAIAdapter != null)
            {
                personalizationData = _webAIAdapter?.GetLevelPersonalizationData(playerId, levelId, profile);
            }
            
            if (personalizationData == null && enableAlgorithmicAI && _algorithmicEngine != null)
            {
                personalizationData = _algorithmicEngine?.GetLevelPersonalizationData(playerId, levelId, profile);
            }

            // Fallback to local calculation
            if (personalizationData == null)
            {
                personalizationData = new LevelPersonalizationData
                {
                    PlayerId = playerId,
                    LevelId = levelId,
                    OptimalDifficulty = CalculateOptimalLevelDifficulty(profile, levelId),
                    PreferredMechanics = GetPreferredMechanics(profile),
                    EngagementTriggers = GetEngagementTriggers(profile),
                    RetentionFactors = GetRetentionFactors(profile),
                    PerformancePrediction = PredictLevelPerformance(profile, levelId),
                    RecommendedAdjustments = GenerateRecommendedAdjustments(profile, levelId)
                };
            }

            return personalizationData;
        }

        public void UpdateLevelPerformance(string playerId, int levelId, LevelPerformanceData performance)
        {
            if (!enableLearning) return;

            var profile = GetPlayerProfile(playerId);
            if (profile == null) return;

            // Update performance metrics
            UpdatePerformanceMetrics(profile, performance);

            // Update difficulty preferences based on performance
            UpdateDifficultyPreferences(profile, performance);

            // Update content preferences
            UpdateContentPreferences(profile, performance);

            // Update engagement profile
            UpdateEngagementProfile(profile, performance);

            // Trigger real-time adaptations if needed
            if (enableDifficultyAdjustment)
            {
                TriggerRealTimeAdaptations(profile, performance);
            }

            OnProfileUpdated?.Invoke(profile);
        }

        private float CalculateOptimalLevelDifficulty(PlayerProfile profile, int levelId)
        {
            var baseDifficulty = Mathf.Clamp01(levelId * 0.1f);
            var skillAdjustment = (profile.performanceProfile.averageScore - 1000f) / 2000f;
            var challengeSeeking = profile.difficultyPreference.challengeSeeking;
            
            return Mathf.Clamp01(baseDifficulty + skillAdjustment * 0.3f + challengeSeeking * 0.2f);
        }

        private List<string> GetPreferredMechanics(PlayerProfile profile)
        {
            var mechanics = new List<string>();
            
            if (profile.contentPreference.mechanics.ContainsKey("matching") && 
                profile.contentPreference.mechanics["matching"] > 0.7f)
                mechanics.Add("matching");
            
            if (profile.contentPreference.mechanics.ContainsKey("combos") && 
                profile.contentPreference.mechanics["combos"] > 0.7f)
                mechanics.Add("combos");
            
            if (profile.contentPreference.mechanics.ContainsKey("special_pieces") && 
                profile.contentPreference.mechanics["special_pieces"] > 0.7f)
                mechanics.Add("special_pieces");
            
            return mechanics;
        }

        private List<string> GetEngagementTriggers(PlayerProfile profile)
        {
            var triggers = new List<string>();
            
            if (profile.engagementProfile.socialEngagement > 0.6f)
                triggers.Add("social_features");
            
            if (profile.engagementProfile.competitiveEngagement > 0.6f)
                triggers.Add("competitive_features");
            
            if (profile.engagementProfile.explorationEngagement > 0.6f)
                triggers.Add("exploration_features");
            
            return triggers;
        }

        private List<string> GetRetentionFactors(PlayerProfile profile)
        {
            var factors = new List<string>();
            
            if (profile.performanceProfile.completionRate > 0.8f)
                factors.Add("achievement_satisfaction");
            
            if (profile.engagementProfile.sessionDuration > 600f) // 10 minutes
                factors.Add("deep_engagement");
            
            if (profile.monetizationProfile.lifetimeValue > 50f)
                factors.Add("investment_commitment");
            
            return factors;
        }

        private PerformancePrediction PredictLevelPerformance(PlayerProfile profile, int levelId)
        {
            return new PerformancePrediction
            {
                PredictedCompletionRate = CalculatePredictedCompletionRate(profile, levelId),
                PredictedEngagement = CalculatePredictedEngagement(profile, levelId),
                PredictedRetention = CalculatePredictedRetention(profile, levelId),
                PredictedDifficulty = CalculateOptimalLevelDifficulty(profile, levelId)
            };
        }

        private List<LevelAdjustment> GenerateRecommendedAdjustments(PlayerProfile profile, int levelId)
        {
            var adjustments = new List<LevelAdjustment>();
            
            // Difficulty adjustments
            var optimalDifficulty = CalculateOptimalLevelDifficulty(profile, levelId);
            if (Mathf.Abs(optimalDifficulty - profile.difficultyPreference.preferredDifficulty) > 0.2f)
            {
                adjustments.Add(new LevelAdjustment
                {
                    Type = "difficulty",
                    Value = optimalDifficulty,
                    Reason = "Player skill level adjustment"
                });
            }
            
            // Move limit adjustments
            var optimalMoves = CalculateOptimalMoveLimit(profile, levelId);
            adjustments.Add(new LevelAdjustment
            {
                Type = "move_limit",
                Value = optimalMoves,
                Reason = "Player performance optimization"
            });
            
            // Color complexity adjustments
            var optimalColors = CalculateOptimalColorCount(profile, levelId);
            adjustments.Add(new LevelAdjustment
            {
                Type = "color_count",
                Value = optimalColors,
                Reason = "Player preference optimization"
            });
            
            return adjustments;
        }

        private void UpdatePerformanceMetrics(PlayerProfile profile, LevelPerformanceData performance)
        {
            // Update completion rate
            if (performance.Completed)
            {
                profile.performanceProfile.completionRate = Mathf.Lerp(profile.performanceProfile.completionRate, 1.0f, 0.1f);
            }
            else
            {
                profile.performanceProfile.failureRate = Mathf.Lerp(profile.performanceProfile.failureRate, 1.0f, 0.1f);
            }
            
            // Update average score
            profile.performanceProfile.averageScore = Mathf.Lerp(profile.performanceProfile.averageScore, performance.Score, 0.1f);
            
            // Update average moves
            profile.performanceProfile.averageMoves = Mathf.Lerp(profile.performanceProfile.averageMoves, performance.MovesUsed, 0.1f);
            
            // Update average time
            profile.performanceProfile.averageTime = Mathf.Lerp(profile.performanceProfile.averageTime, performance.CompletionTime, 0.1f);
        }

        private void UpdateDifficultyPreferences(PlayerProfile profile, LevelPerformanceData performance)
        {
            var difficultyAdjustment = new DifficultyAdjustment
            {
                reason = "Real-time performance adaptation",
                adjustment = CalculateDifficultyAdjustment(profile, performance),
                timestamp = DateTime.Now,
                wasSuccessful = performance.Completed
            };
            
            profile.difficultyPreference.adjustments.Add(difficultyAdjustment);
            profile.difficultyPreference.lastAdjusted = DateTime.Now;
            
            // Update preferred difficulty
            if (performance.Completed && performance.MovesUsed < performance.MoveLimit * 0.5f)
            {
                profile.difficultyPreference.preferredDifficulty = Mathf.Min(1.0f, 
                    profile.difficultyPreference.preferredDifficulty + 0.05f);
            }
            else if (!performance.Completed || performance.MovesUsed >= performance.MoveLimit * 0.9f)
            {
                profile.difficultyPreference.preferredDifficulty = Mathf.Max(0.1f, 
                    profile.difficultyPreference.preferredDifficulty - 0.05f);
            }
        }

        private void UpdateContentPreferences(PlayerProfile profile, LevelPerformanceData performance)
        {
            // Update content type preferences based on performance
            if (performance.Completed && performance.Score > 1000)
            {
                if (!profile.contentPreference.contentTypes.ContainsKey("puzzle"))
                    profile.contentPreference.contentTypes["puzzle"] = 0f;
                profile.contentPreference.contentTypes["puzzle"] = Mathf.Min(1.0f, 
                    profile.contentPreference.contentTypes["puzzle"] + 0.1f);
            }
        }

        private void UpdateEngagementProfile(PlayerProfile profile, LevelPerformanceData performance)
        {
            // Update session duration
            profile.engagementProfile.sessionDuration = Mathf.Lerp(profile.engagementProfile.sessionDuration, 
                performance.CompletionTime, 0.1f);
            
            // Update last active time
            profile.engagementProfile.lastActive = DateTime.Now;
        }

        private void TriggerRealTimeAdaptations(PlayerProfile profile, LevelPerformanceData performance)
        {
            // Check if player is struggling
            if (performance.MovesUsed >= performance.MoveLimit * 0.9f && !performance.Completed)
            {
                // Trigger struggling player rule
                var strugglingRule = _personalizationRules.Values.FirstOrDefault(r => r.id == "struggling_player_rule");
                if (strugglingRule != null)
                {
                    ExecuteRuleActions(profile, strugglingRule);
                }
            }
            
            // Check if player is excelling
            if (performance.Completed && performance.MovesUsed < performance.MoveLimit * 0.3f)
            {
                // Trigger engaged player rule
                var engagedRule = _personalizationRules.Values.FirstOrDefault(r => r.id == "engaged_player_rule");
                if (engagedRule != null)
                {
                    ExecuteRuleActions(profile, engagedRule);
                }
            }
        }

        private float CalculateDifficultyAdjustment(PlayerProfile profile, LevelPerformanceData performance)
        {
            if (performance.Completed)
            {
                if (performance.MovesUsed < performance.MoveLimit * 0.5f)
                    return 0.05f; // Increase difficulty
                else if (performance.MovesUsed > performance.MoveLimit * 0.8f)
                    return -0.05f; // Decrease difficulty
            }
            else
            {
                return -0.1f; // Decrease difficulty for failed levels
            }
            
            return 0f;
        }

        private float CalculatePredictedCompletionRate(PlayerProfile profile, int levelId)
        {
            var baseRate = profile.performanceProfile.completionRate;
            var difficultyFactor = 1.0f - (levelId * 0.01f);
            return Mathf.Clamp01(baseRate * difficultyFactor);
        }

        private float CalculatePredictedEngagement(PlayerProfile profile, int levelId)
        {
            var baseEngagement = profile.engagementProfile.sessionFrequency;
            var noveltyFactor = 1.0f + (levelId * 0.005f);
            return Mathf.Clamp01(baseEngagement * noveltyFactor);
        }

        private float CalculatePredictedRetention(PlayerProfile profile, int levelId)
        {
            var completionRate = CalculatePredictedCompletionRate(profile, levelId);
            var engagement = CalculatePredictedEngagement(profile, levelId);
            return Mathf.Clamp01((completionRate + engagement) / 2f);
        }

        private int CalculateOptimalMoveLimit(PlayerProfile profile, int levelId)
        {
            var baseMoves = 20;
            var skillAdjustment = (profile.performanceProfile.averageMoves - 20f) * 0.5f;
            var difficultyAdjustment = levelId * 0.5f;
            
            return Mathf.RoundToInt(baseMoves + skillAdjustment + difficultyAdjustment);
        }

        private int CalculateOptimalColorCount(PlayerProfile profile, int levelId)
        {
            var baseColors = 5;
            var skillAdjustment = profile.performanceProfile.averageScore > 1500 ? 1 : 0;
            var difficultyAdjustment = levelId > 50 ? 1 : 0;
            
            return Mathf.Clamp(baseColors + skillAdjustment + difficultyAdjustment, 3, 7);
        }
        
        public List<string> GetRecommendations(string playerId, string type)
        {
            var profile = GetPlayerProfile(playerId);
            
            switch (type)
            {
                case "content":
                    return profile.recommendedContent;
                case "offers":
                    return profile.recommendedOffers;
                case "events":
                    return profile.recommendedEvents;
                default:
                    return new List<string>();
            }
        }
        
        private System.Collections.IEnumerator UpdatePersonalizationModels()
        {
            while (true)
            {
                yield return new WaitForSeconds(modelUpdateInterval);
                
                if (!enableLearning) continue;
                
                foreach (var model in _personalizationModels.Values)
                {
                    if (model.isActive && _behaviorHistory.Count >= minSamplesForTraining)
                    {
                        TrainModel(model);
                    }
                }
            }
        }
        
        private void TrainModel(PersonalizationModel model)
        {
            // Simple training logic - in a real system, this would use proper machine learning
            var trainingData = CollectTrainingData(model);
            
            if (trainingData.Count < minSamplesForTraining) return;
            
            // Update model weights (simplified)
            foreach (var feature in model.inputFeatures)
            {
                if (!model.weights.ContainsKey(feature))
                {
                    model.weights[feature] = 0.0f;
                }
                
                // Simple weight update
                model.weights[feature] += learningRate * (1.0f - model.weights[feature]);
            }
            
            model.lastTrained = DateTime.Now;
            model.trainingSamples = trainingData.Count;
            model.accuracy = CalculateModelAccuracy(model, trainingData);
            
            OnModelUpdated?.Invoke(model);
        }
        
        private List<Dictionary<string, float>> CollectTrainingData(PersonalizationModel model)
        {
            var trainingData = new List<Dictionary<string, float>>();
            
            foreach (var playerId in _behaviorHistory.Keys)
            {
                var profile = GetPlayerProfile(playerId);
                var dataPoint = new Dictionary<string, float>();
                
                foreach (var feature in model.inputFeatures)
                {
                    dataPoint[feature] = GetMetricValue(profile, feature);
                }
                
                trainingData.Add(dataPoint);
            }
            
            return trainingData;
        }
        
        private float CalculateModelAccuracy(PersonalizationModel model, List<Dictionary<string, float>> trainingData)
        {
            // Simple accuracy calculation - in a real system, this would be more sophisticated
            return Mathf.Min(1.0f, trainingData.Count / 1000.0f);
        }
        
        private void LoadPersonalizationData()
        {
            string path = Application.persistentDataPath + "/personalization_data.json";
            if (System.IO.File.Exists(path))
            {
                string json = System.IO.File.ReadAllText(path);
                var saveData = JsonUtility.FromJson<PersonalizationSaveData>(json);
                
                _playerProfiles = saveData.playerProfiles;
                _personalizationRules = saveData.personalizationRules;
                _personalizationModels = saveData.personalizationModels;
                _behaviorHistory = saveData.behaviorHistory;
            }
        }
        
        public void SavePersonalizationData()
        {
            var saveData = new PersonalizationSaveData
            {
                playerProfiles = _playerProfiles,
                personalizationRules = _personalizationRules,
                personalizationModels = _personalizationModels,
                behaviorHistory = _behaviorHistory
            };
            
            string json = JsonUtility.ToJson(saveData, true);
            System.IO.File.WriteAllText(Application.persistentDataPath + "/personalization_data.json", json);
        }
        
        void OnDestroy()
        {
            SavePersonalizationData();
        }
    }
    
    [System.Serializable]
    public class PersonalizationSaveData
    {
        public Dictionary<string, PlayerProfile> playerProfiles;
        public Dictionary<string, PersonalizationRule> personalizationRules;
        public Dictionary<string, PersonalizationModel> personalizationModels;
        public Dictionary<string, List<BehaviorMetric>> behaviorHistory;
    }

    // AI Level Integration Data Structures
    [System.Serializable]
    public class LevelPersonalizationData
    {
        public string PlayerId;
        public int LevelId;
        public float OptimalDifficulty;
        public List<string> PreferredMechanics;
        public List<string> EngagementTriggers;
        public List<string> RetentionFactors;
        public PerformancePrediction PerformancePrediction;
        public List<LevelAdjustment> RecommendedAdjustments;
    }

    [System.Serializable]
    public class LevelPerformanceData
    {
        public string PlayerId;
        public int LevelId;
        public bool Completed;
        public int Score;
        public int MovesUsed;
        public int MoveLimit;
        public float CompletionTime;
        public List<string> UsedPowerups;
        public Dictionary<string, float> PerformanceMetrics;
    }

    [System.Serializable]
    public class LevelAdjustment
    {
        public string Type;
        public float Value;
        public string Reason;
        public DateTime Timestamp;
    }

    [System.Serializable]
    public class PerformancePrediction
    {
        public float PredictedCompletionRate;
        public float PredictedEngagement;
        public float PredictedRetention;
        public float PredictedDifficulty;
    }

    /// <summary>
    /// Web AI Personalization Adapter for external AI services
    /// </summary>
    public class WebAIPersonalizationAdapter
    {
        private string _serviceUrl;
        private bool _isAvailable;

        public WebAIPersonalizationAdapter(string serviceUrl)
        {
            _serviceUrl = serviceUrl;
            _isAvailable = !string.IsNullOrEmpty(serviceUrl);
        }

        public LevelPersonalizationData GetLevelPersonalizationData(string playerId, int levelId, PlayerProfile profile)
        {
            if (!_isAvailable) return null;

            try
            {
                // In a real implementation, this would make HTTP requests to web AI services
                // For now, return null to use fallback
                return null;
            }
            catch (System.Exception)
            {
                return null;
            }
        }
    }

    /// <summary>
    /// Algorithmic Personalization Engine - Pure algorithmic approach for web compatibility
    /// </summary>
    public class AlgorithmicPersonalizationEngine
    {
        private Dictionary<string, PlayerBehaviorData> _playerBehaviorData;
        private Dictionary<string, LevelPerformanceData> _levelPerformanceData;

        public AlgorithmicPersonalizationEngine()
        {
            _playerBehaviorData = new Dictionary<string, PlayerBehaviorData>();
            _levelPerformanceData = new Dictionary<string, LevelPerformanceData>();
        }

        public LevelPersonalizationData GetLevelPersonalizationData(string playerId, int levelId, PlayerProfile profile)
        {
            var behaviorData = GetPlayerBehaviorData(playerId);
            var levelData = GetLevelPerformanceData(levelId.ToString());

            return new LevelPersonalizationData
            {
                PlayerId = playerId,
                LevelId = levelId,
                OptimalDifficulty = CalculateAlgorithmicDifficulty(profile, behaviorData, levelData),
                PreferredMechanics = CalculateAlgorithmicMechanics(profile, behaviorData),
                EngagementTriggers = CalculateAlgorithmicTriggers(profile, behaviorData),
                RetentionFactors = CalculateAlgorithmicRetentionFactors(profile, behaviorData),
                PerformancePrediction = CalculateAlgorithmicPrediction(profile, behaviorData, levelData),
                RecommendedAdjustments = CalculateAlgorithmicAdjustments(profile, behaviorData, levelData)
            };
        }

        private PlayerBehaviorData GetPlayerBehaviorData(string playerId)
        {
            if (!_playerBehaviorData.ContainsKey(playerId))
            {
                _playerBehaviorData[playerId] = new PlayerBehaviorData
                {
                    AverageScore = 1000f,
                    AverageMoves = 20f,
                    CompletionRate = 0.8f,
                    SessionDuration = 300f,
                    EngagementLevel = 0.7f,
                    DifficultyPreference = 0.5f,
                    ColorPreference = 5,
                    MechanicPreferences = new Dictionary<string, float>
                    {
                        {"matching", 0.8f},
                        {"combos", 0.6f},
                        {"special_pieces", 0.7f}
                    }
                };
            }
            return _playerBehaviorData[playerId];
        }

        private LevelPerformanceData GetLevelPerformanceData(string levelId)
        {
            if (!_levelPerformanceData.ContainsKey(levelId))
            {
                _levelPerformanceData[levelId] = new LevelPerformanceData
                {
                    AverageCompletionRate = 0.8f,
                    AverageEngagement = 0.7f,
                    DifficultyRating = 0.5f,
                    PopularityScore = 0.5f,
                    RetentionRate = 0.6f
                };
            }
            return _levelPerformanceData[levelId];
        }

        private float CalculateAlgorithmicDifficulty(PlayerProfile profile, PlayerBehaviorData behaviorData, LevelPerformanceData levelData)
        {
            var baseDifficulty = Mathf.Clamp01(profile.performanceProfile.averageScore / 2000f);
            var behaviorAdjustment = (behaviorData.DifficultyPreference - 0.5f) * 0.3f;
            var performanceAdjustment = (behaviorData.CompletionRate - 0.8f) * 0.2f;
            var levelAdjustment = (levelData.DifficultyRating - 0.5f) * 0.1f;
            
            return Mathf.Clamp01(baseDifficulty + behaviorAdjustment + performanceAdjustment + levelAdjustment);
        }

        private List<string> CalculateAlgorithmicMechanics(PlayerProfile profile, PlayerBehaviorData behaviorData)
        {
            var mechanics = new List<string>();
            
            foreach (var mechanic in behaviorData.MechanicPreferences)
            {
                if (mechanic.Value > 0.6f)
                {
                    mechanics.Add(mechanic.Key);
                }
            }
            
            return mechanics;
        }

        private List<string> CalculateAlgorithmicTriggers(PlayerProfile profile, PlayerBehaviorData behaviorData)
        {
            var triggers = new List<string>();
            
            if (behaviorData.EngagementLevel > 0.8f)
                triggers.Add("challenge");
            if (behaviorData.AverageScore > 1200f)
                triggers.Add("progression");
            if (behaviorData.SessionDuration > 600f)
                triggers.Add("deep_engagement");
            if (behaviorData.CompletionRate > 0.9f)
                triggers.Add("achievement");
            
            return triggers;
        }

        private List<string> CalculateAlgorithmicRetentionFactors(PlayerProfile profile, PlayerBehaviorData behaviorData)
        {
            var factors = new List<string>();
            
            if (behaviorData.CompletionRate > 0.8f)
                factors.Add("achievement_satisfaction");
            if (behaviorData.SessionDuration > 600f)
                factors.Add("deep_engagement");
            if (profile.monetizationProfile.lifetimeValue > 50f)
                factors.Add("investment_commitment");
            if (behaviorData.EngagementLevel > 0.7f)
                factors.Add("high_engagement");
            
            return factors;
        }

        private PerformancePrediction CalculateAlgorithmicPrediction(PlayerProfile profile, PlayerBehaviorData behaviorData, LevelPerformanceData levelData)
        {
            return new PerformancePrediction
            {
                PredictedCompletionRate = CalculatePredictedCompletionRate(behaviorData, levelData),
                PredictedEngagement = CalculatePredictedEngagement(behaviorData, levelData),
                PredictedRetention = CalculatePredictedRetention(behaviorData, levelData),
                PredictedDifficulty = CalculateAlgorithmicDifficulty(profile, behaviorData, levelData)
            };
        }

        private List<LevelAdjustment> CalculateAlgorithmicAdjustments(PlayerProfile profile, PlayerBehaviorData behaviorData, LevelPerformanceData levelData)
        {
            var adjustments = new List<LevelAdjustment>();
            
            // Difficulty adjustment
            var optimalDifficulty = CalculateAlgorithmicDifficulty(profile, behaviorData, levelData);
            if (Mathf.Abs(optimalDifficulty - behaviorData.DifficultyPreference) > 0.2f)
            {
                adjustments.Add(new LevelAdjustment
                {
                    Type = "difficulty",
                    Value = optimalDifficulty,
                    Reason = "Algorithmic difficulty optimization"
                });
            }
            
            // Move limit adjustment
            var optimalMoves = CalculateOptimalMoves(behaviorData, levelData);
            adjustments.Add(new LevelAdjustment
            {
                Type = "move_limit",
                Value = optimalMoves,
                Reason = "Algorithmic move optimization"
            });
            
            // Color adjustment
            var optimalColors = CalculateOptimalColors(behaviorData, levelData);
            adjustments.Add(new LevelAdjustment
            {
                Type = "color_count",
                Value = optimalColors,
                Reason = "Algorithmic color optimization"
            });
            
            return adjustments;
        }

        private float CalculatePredictedCompletionRate(PlayerBehaviorData behaviorData, LevelPerformanceData levelData)
        {
            var baseRate = behaviorData.CompletionRate;
            var levelFactor = levelData.AverageCompletionRate;
            var engagementFactor = behaviorData.EngagementLevel;
            
            return Mathf.Clamp01((baseRate + levelFactor + engagementFactor) / 3f);
        }

        private float CalculatePredictedEngagement(PlayerBehaviorData behaviorData, LevelPerformanceData levelData)
        {
            var baseEngagement = behaviorData.EngagementLevel;
            var levelEngagement = levelData.AverageEngagement;
            var scoreFactor = Mathf.Clamp01(behaviorData.AverageScore / 2000f);
            
            return Mathf.Clamp01((baseEngagement + levelEngagement + scoreFactor) / 3f);
        }

        private float CalculatePredictedRetention(PlayerBehaviorData behaviorData, LevelPerformanceData levelData)
        {
            var completionRate = CalculatePredictedCompletionRate(behaviorData, levelData);
            var engagement = CalculatePredictedEngagement(behaviorData, levelData);
            var levelRetention = levelData.RetentionRate;
            
            return Mathf.Clamp01((completionRate + engagement + levelRetention) / 3f);
        }

        private int CalculateOptimalMoves(PlayerBehaviorData behaviorData, LevelPerformanceData levelData)
        {
            var baseMoves = 20;
            var behaviorAdjustment = Mathf.RoundToInt((behaviorData.AverageMoves - 20f) * 0.5f);
            var difficultyAdjustment = Mathf.RoundToInt((levelData.DifficultyRating - 0.5f) * 10f);
            
            return Mathf.Clamp(baseMoves + behaviorAdjustment + difficultyAdjustment, 5, 50);
        }

        private int CalculateOptimalColors(PlayerBehaviorData behaviorData, LevelPerformanceData levelData)
        {
            var baseColors = 5;
            var behaviorAdjustment = behaviorData.ColorPreference - 5;
            var scoreAdjustment = behaviorData.AverageScore > 1500 ? 1 : 0;
            
            return Mathf.Clamp(baseColors + behaviorAdjustment + scoreAdjustment, 3, 7);
        }

        public void UpdatePlayerBehavior(string playerId, LevelPerformanceData performance)
        {
            var behaviorData = GetPlayerBehaviorData(playerId);
            
            // Update behavior data based on performance
            behaviorData.AverageScore = Mathf.Lerp(behaviorData.AverageScore, performance.Score, 0.1f);
            behaviorData.AverageMoves = Mathf.Lerp(behaviorData.AverageMoves, performance.MovesUsed, 0.1f);
            behaviorData.CompletionRate = Mathf.Lerp(behaviorData.CompletionRate, performance.Completed ? 1f : 0f, 0.1f);
            behaviorData.SessionDuration = Mathf.Lerp(behaviorData.SessionDuration, performance.CompletionTime, 0.1f);
            
            // Update difficulty preference
            if (performance.Completed && performance.MovesUsed < performance.MoveLimit * 0.5f)
            {
                behaviorData.DifficultyPreference = Mathf.Min(1f, behaviorData.DifficultyPreference + 0.05f);
            }
            else if (!performance.Completed)
            {
                behaviorData.DifficultyPreference = Mathf.Max(0.1f, behaviorData.DifficultyPreference - 0.05f);
            }
        }
    }

    // Data structures for algorithmic personalization
    public class PlayerBehaviorData
    {
        public float AverageScore;
        public float AverageMoves;
        public float CompletionRate;
        public float SessionDuration;
        public float EngagementLevel;
        public float DifficultyPreference;
        public int ColorPreference;
        public Dictionary<string, float> MechanicPreferences;
    }

    public class LevelPerformanceData
    {
        public float AverageCompletionRate;
        public float AverageEngagement;
        public float DifficultyRating;
        public float PopularityScore;
        public float RetentionRate;
    }
}