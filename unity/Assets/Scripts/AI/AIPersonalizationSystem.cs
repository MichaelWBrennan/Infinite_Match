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
            
            Debug.Log("AI Personalization System initialized");
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
}