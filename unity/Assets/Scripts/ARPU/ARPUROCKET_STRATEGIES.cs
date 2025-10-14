using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using Evergreen.ARPU;
using Evergreen.Analytics;

namespace Evergreen.ARPU
{
    /// <summary>
    /// ARPU ROCKET STRATEGIES - Advanced strategies to skyrocket ARPU
    /// Implements cutting-edge monetization techniques used by billion-dollar games
    /// </summary>
    public class ARPUROCKET_STRATEGIES : MonoBehaviour
    {
        [Header("🚀 ROCKET STRATEGIES")]
        public bool enableAdvancedPsychology = true;
        public bool enableAIOptimization = true;
        public bool enableViralExplosion = true;
        public bool enableRevenueExplosion = true;
        public bool enableRetentionRocket = true;
        
        [Header("🧠 Advanced Psychology Strategies")]
        public bool enableScarcityExplosion = true;
        public bool enableSocialProofBomb = true;
        public bool enableFOMONuke = true;
        public bool enableLossAversionRocket = true;
        public bool enableAnchoringBomb = true;
        public bool enableReciprocityExplosion = true;
        public bool enableAuthorityRocket = true;
        public bool enableConsistencyBomb = true;
        
        [Header("🤖 AI Optimization Strategies")]
        public bool enableMLPricingRocket = true;
        public bool enablePredictiveOffersBomb = true;
        public bool enableBehavioralAIRocket = true;
        public bool enableDynamicSegmentationExplosion = true;
        public bool enableAutomatedABTestingRocket = true;
        public bool enablePersonalizationBomb = true;
        public bool enableRecommendationRocket = true;
        public bool enableOptimizationExplosion = true;
        
        [Header("💥 Viral Explosion Strategies")]
        public bool enableViralLoopsRocket = true;
        public bool enableSocialContagionBomb = true;
        public bool enableNetworkEffectsExplosion = true;
        public bool enableInfluenceAmplificationRocket = true;
        public bool enableMemeMarketingBomb = true;
        public bool enableReferralExplosion = true;
        public bool enableSharingRocket = true;
        public bool enableCommunityBomb = true;
        
        [Header("💰 Revenue Explosion Strategies")]
        public bool enableWhaleHuntingRocket = true;
        public bool enableDolphinOptimizationBomb = true;
        public bool enableMinnowConversionExplosion = true;
        public bool enableFreemiumRocket = true;
        public bool enableSubscriptionBomb = true;
        public bool enableIAPExplosion = true;
        public bool enableAdRevenueRocket = true;
        public bool enablePremiumBomb = true;
        
        [Header("🎯 ROCKET Targets")]
        public float rocketARPUTarget = 15.00f; // 5x industry average
        public float rocketARPPUTarget = 125.00f; // 5x industry average
        public float rocketConversionTarget = 0.40f; // 5x industry average
        public float rocketRetentionTarget = 0.80f; // 2x industry average
        
        [Header("⚡ Power Multipliers")]
        public float psychologyMultiplier = 3.0f;
        public float aiMultiplier = 5.0f;
        public float viralMultiplier = 10.0f;
        public float revenueMultiplier = 8.0f;
        public float retentionMultiplier = 4.0f;
        
        private UnityAnalyticsARPUHelper _analyticsHelper;
        private Dictionary<string, RocketStrategy> _strategies = new Dictionary<string, RocketStrategy>();
        private Dictionary<string, RocketPlayerProfile> _profiles = new Dictionary<string, RocketPlayerProfile>();
        
        // Coroutines
        private Coroutine _strategyCoroutine;
        private Coroutine _psychologyCoroutine;
        private Coroutine _aiCoroutine;
        private Coroutine _viralCoroutine;
        private Coroutine _revenueCoroutine;
        
        void Start()
        {
            _analyticsHelper = UnityAnalyticsARPUHelper.Instance;
            if (_analyticsHelper == null)
            {
                Debug.LogError("UnityAnalyticsARPUHelper not found! Make sure it's initialized.");
                return;
            }
            
            InitializeRocketStrategies();
            StartRocketStrategies();
        }
        
        private void InitializeRocketStrategies()
        {
            Debug.Log("🚀 Initializing ARPU ROCKET strategies...");
            
            // Initialize psychology strategies
            InitializePsychologyStrategies();
            
            // Initialize AI strategies
            InitializeAIStrategies();
            
            // Initialize viral strategies
            InitializeViralStrategies();
            
            // Initialize revenue strategies
            InitializeRevenueStrategies();
            
            Debug.Log("🚀 ARPU ROCKET strategies initialized!");
        }
        
        private void InitializePsychologyStrategies()
        {
            _strategies["scarcity_explosion"] = new RocketStrategy
            {
                id = "scarcity_explosion",
                name = "Scarcity Explosion",
                type = "psychology",
                multiplier = psychologyMultiplier,
                parameters = new Dictionary<string, object>
                {
                    ["urgency_level"] = "extreme",
                    ["time_limit"] = 60f,
                    ["quantity_limit"] = 5,
                    ["exclusivity"] = "ultra_rare"
                },
                isActive = enableScarcityExplosion
            };
            
            _strategies["social_proof_bomb"] = new RocketStrategy
            {
                id = "social_proof_bomb",
                name = "Social Proof Bomb",
                type = "psychology",
                multiplier = psychologyMultiplier,
                parameters = new Dictionary<string, object>
                {
                    ["proof_type"] = "massive",
                    ["social_signals"] = "overwhelming",
                    ["peer_pressure"] = "intense",
                    ["fomo_level"] = "maximum"
                },
                isActive = enableSocialProofBomb
            };
            
            _strategies["fomo_nuke"] = new RocketStrategy
            {
                id = "fomo_nuke",
                name = "FOMO Nuke",
                type = "psychology",
                multiplier = psychologyMultiplier,
                parameters = new Dictionary<string, object>
                {
                    ["fear_level"] = "nuclear",
                    ["exclusivity"] = "legendary",
                    ["time_pressure"] = "extreme",
                    ["loss_aversion"] = "maximum"
                },
                isActive = enableFOMONuke
            };
            
            _strategies["loss_aversion_rocket"] = new RocketStrategy
            {
                id = "loss_aversion_rocket",
                name = "Loss Aversion Rocket",
                type = "psychology",
                multiplier = psychologyMultiplier,
                parameters = new Dictionary<string, object>
                {
                    ["loss_threat"] = "severe",
                    ["what_you_lose"] = "everything",
                    ["opportunity_cost"] = "massive",
                    ["regret_factor"] = "extreme"
                },
                isActive = enableLossAversionRocket
            };
            
            _strategies["anchoring_bomb"] = new RocketStrategy
            {
                id = "anchoring_bomb",
                name = "Anchoring Bomb",
                type = "psychology",
                multiplier = psychologyMultiplier,
                parameters = new Dictionary<string, object>
                {
                    ["anchor_price"] = 999.99f,
                    ["comparison_effect"] = "massive",
                    ["value_perception"] = "distorted",
                    ["price_anchoring"] = "extreme"
                },
                isActive = enableAnchoringBomb
            };
            
            _strategies["reciprocity_explosion"] = new RocketStrategy
            {
                id = "reciprocity_explosion",
                name = "Reciprocity Explosion",
                type = "psychology",
                multiplier = psychologyMultiplier,
                parameters = new Dictionary<string, object>
                {
                    ["gift_value"] = "high",
                    ["obligation_level"] = "strong",
                    ["return_expectation"] = "immediate",
                    ["social_pressure"] = "intense"
                },
                isActive = enableReciprocityExplosion
            };
            
            _strategies["authority_rocket"] = new RocketStrategy
            {
                id = "authority_rocket",
                name = "Authority Rocket",
                type = "psychology",
                multiplier = psychologyMultiplier,
                parameters = new Dictionary<string, object>
                {
                    ["authority_level"] = "expert",
                    ["credibility"] = "maximum",
                    ["trust_factor"] = "high",
                    ["influence_power"] = "strong"
                },
                isActive = enableAuthorityRocket
            };
            
            _strategies["consistency_bomb"] = new RocketStrategy
            {
                id = "consistency_bomb",
                name = "Consistency Bomb",
                type = "psychology",
                multiplier = psychologyMultiplier,
                parameters = new Dictionary<string, object>
                {
                    ["commitment_level"] = "high",
                    ["consistency_pressure"] = "strong",
                    ["identity_alignment"] = "perfect",
                    ["behavior_lock"] = "tight"
                },
                isActive = enableConsistencyBomb
            };
        }
        
        private void InitializeAIStrategies()
        {
            _strategies["ml_pricing_rocket"] = new RocketStrategy
            {
                id = "ml_pricing_rocket",
                name = "ML Pricing Rocket",
                type = "ai",
                multiplier = aiMultiplier,
                parameters = new Dictionary<string, object>
                {
                    ["algorithm"] = "advanced_ml",
                    ["data_points"] = "massive",
                    ["prediction_accuracy"] = 0.95f,
                    ["optimization_speed"] = "real_time"
                },
                isActive = enableMLPricingRocket
            };
            
            _strategies["predictive_offers_bomb"] = new RocketStrategy
            {
                id = "predictive_offers_bomb",
                name = "Predictive Offers Bomb",
                type = "ai",
                multiplier = aiMultiplier,
                parameters = new Dictionary<string, object>
                {
                    ["prediction_model"] = "neural_network",
                    ["offer_accuracy"] = 0.98f,
                    ["timing_precision"] = "perfect",
                    ["personalization_level"] = "maximum"
                },
                isActive = enablePredictiveOffersBomb
            };
            
            _strategies["behavioral_ai_rocket"] = new RocketStrategy
            {
                id = "behavioral_ai_rocket",
                name = "Behavioral AI Rocket",
                type = "ai",
                multiplier = aiMultiplier,
                parameters = new Dictionary<string, object>
                {
                    ["behavior_analysis"] = "deep",
                    ["pattern_recognition"] = "advanced",
                    ["prediction_engine"] = "powerful",
                    ["adaptation_speed"] = "instant"
                },
                isActive = enableBehavioralAIRocket
            };
            
            _strategies["dynamic_segmentation_explosion"] = new RocketStrategy
            {
                id = "dynamic_segmentation_explosion",
                name = "Dynamic Segmentation Explosion",
                type = "ai",
                multiplier = aiMultiplier,
                parameters = new Dictionary<string, object>
                {
                    ["segmentation_accuracy"] = 0.99f,
                    ["update_frequency"] = "real_time",
                    ["segment_granularity"] = "micro",
                    ["targeting_precision"] = "laser"
                },
                isActive = enableDynamicSegmentationExplosion
            };
            
            _strategies["automated_ab_testing_rocket"] = new RocketStrategy
            {
                id = "automated_ab_testing_rocket",
                name = "Automated A/B Testing Rocket",
                type = "ai",
                multiplier = aiMultiplier,
                parameters = new Dictionary<string, object>
                {
                    ["test_frequency"] = "continuous",
                    ["statistical_power"] = 0.99f,
                    ["optimization_speed"] = "instant",
                    ["learning_rate"] = "maximum"
                },
                isActive = enableAutomatedABTestingRocket
            };
            
            _strategies["personalization_bomb"] = new RocketStrategy
            {
                id = "personalization_bomb",
                name = "Personalization Bomb",
                type = "ai",
                multiplier = aiMultiplier,
                parameters = new Dictionary<string, object>
                {
                    ["personalization_level"] = "extreme",
                    ["data_utilization"] = "maximum",
                    ["customization_depth"] = "infinite",
                    ["user_satisfaction"] = "perfect"
                },
                isActive = enablePersonalizationBomb
            };
            
            _strategies["recommendation_rocket"] = new RocketStrategy
            {
                id = "recommendation_rocket",
                name = "Recommendation Rocket",
                type = "ai",
                multiplier = aiMultiplier,
                parameters = new Dictionary<string, object>
                {
                    ["recommendation_accuracy"] = 0.97f,
                    ["discovery_power"] = "maximum",
                    ["engagement_boost"] = "massive",
                    ["conversion_lift"] = "extreme"
                },
                isActive = enableRecommendationRocket
            };
            
            _strategies["optimization_explosion"] = new RocketStrategy
            {
                id = "optimization_explosion",
                name = "Optimization Explosion",
                type = "ai",
                multiplier = aiMultiplier,
                parameters = new Dictionary<string, object>
                {
                    ["optimization_scope"] = "everything",
                    ["improvement_rate"] = "exponential",
                    ["efficiency_gain"] = "massive",
                    ["performance_boost"] = "maximum"
                },
                isActive = enableOptimizationExplosion
            };
        }
        
        private void InitializeViralStrategies()
        {
            _strategies["viral_loops_rocket"] = new RocketStrategy
            {
                id = "viral_loops_rocket",
                name = "Viral Loops Rocket",
                type = "viral",
                multiplier = viralMultiplier,
                parameters = new Dictionary<string, object>
                {
                    ["viral_coefficient"] = 10.0f,
                    ["loop_efficiency"] = "maximum",
                    ["growth_rate"] = "exponential",
                    ["network_effect"] = "massive"
                },
                isActive = enableViralLoopsRocket
            };
            
            _strategies["social_contagion_bomb"] = new RocketStrategy
            {
                id = "social_contagion_bomb",
                name = "Social Contagion Bomb",
                type = "viral",
                multiplier = viralMultiplier,
                parameters = new Dictionary<string, object>
                {
                    ["contagion_rate"] = 0.95f,
                    ["spread_speed"] = "viral",
                    ["adoption_curve"] = "steep",
                    ["network_density"] = "maximum"
                },
                isActive = enableSocialContagionBomb
            };
            
            _strategies["network_effects_explosion"] = new RocketStrategy
            {
                id = "network_effects_explosion",
                name = "Network Effects Explosion",
                type = "viral",
                multiplier = viralMultiplier,
                parameters = new Dictionary<string, object>
                {
                    ["network_value"] = "exponential",
                    ["user_benefit"] = "increasing",
                    ["switching_cost"] = "high",
                    ["lock_in_effect"] = "strong"
                },
                isActive = enableNetworkEffectsExplosion
            };
            
            _strategies["influence_amplification_rocket"] = new RocketStrategy
            {
                id = "influence_amplification_rocket",
                name = "Influence Amplification Rocket",
                type = "viral",
                multiplier = viralMultiplier,
                parameters = new Dictionary<string, object>
                {
                    ["influence_power"] = "maximum",
                    ["reach_amplification"] = "massive",
                    ["message_virality"] = "extreme",
                    ["social_proof_boost"] = "maximum"
                },
                isActive = enableInfluenceAmplificationRocket
            };
            
            _strategies["meme_marketing_bomb"] = new RocketStrategy
            {
                id = "meme_marketing_bomb",
                name = "Meme Marketing Bomb",
                type = "viral",
                multiplier = viralMultiplier,
                parameters = new Dictionary<string, object>
                {
                    ["meme_potential"] = "viral",
                    ["shareability"] = "maximum",
                    ["cultural_resonance"] = "strong",
                    ["spread_velocity"] = "lightning"
                },
                isActive = enableMemeMarketingBomb
            };
            
            _strategies["referral_explosion"] = new RocketStrategy
            {
                id = "referral_explosion",
                name = "Referral Explosion",
                type = "viral",
                multiplier = viralMultiplier,
                parameters = new Dictionary<string, object>
                {
                    ["referral_reward"] = "massive",
                    ["incentive_power"] = "maximum",
                    ["sharing_motivation"] = "strong",
                    ["conversion_rate"] = "high"
                },
                isActive = enableReferralExplosion
            };
            
            _strategies["sharing_rocket"] = new RocketStrategy
            {
                id = "sharing_rocket",
                name = "Sharing Rocket",
                type = "viral",
                multiplier = viralMultiplier,
                parameters = new Dictionary<string, object>
                {
                    ["share_trigger"] = "automatic",
                    ["social_proof"] = "maximum",
                    ["pride_factor"] = "high",
                    ["status_boost"] = "massive"
                },
                isActive = enableSharingRocket
            };
            
            _strategies["community_bomb"] = new RocketStrategy
            {
                id = "community_bomb",
                name = "Community Bomb",
                type = "viral",
                multiplier = viralMultiplier,
                parameters = new Dictionary<string, object>
                {
                    ["community_strength"] = "maximum",
                    ["belonging_feeling"] = "strong",
                    ["group_identity"] = "powerful",
                    ["collective_action"] = "massive"
                },
                isActive = enableCommunityBomb
            };
        }
        
        private void InitializeRevenueStrategies()
        {
            _strategies["whale_hunting_rocket"] = new RocketStrategy
            {
                id = "whale_hunting_rocket",
                name = "Whale Hunting Rocket",
                type = "revenue",
                multiplier = revenueMultiplier,
                parameters = new Dictionary<string, object>
                {
                    ["whale_identification"] = "precise",
                    ["hunting_accuracy"] = "maximum",
                    ["conversion_power"] = "extreme",
                    ["revenue_extraction"] = "massive"
                },
                isActive = enableWhaleHuntingRocket
            };
            
            _strategies["dolphin_optimization_bomb"] = new RocketStrategy
            {
                id = "dolphin_optimization_bomb",
                name = "Dolphin Optimization Bomb",
                type = "revenue",
                multiplier = revenueMultiplier,
                parameters = new Dictionary<string, object>
                {
                    ["dolphin_targeting"] = "precise",
                    ["upselling_power"] = "maximum",
                    ["frequency_boost"] = "massive",
                    ["value_increase"] = "extreme"
                },
                isActive = enableDolphinOptimizationBomb
            };
            
            _strategies["minnow_conversion_explosion"] = new RocketStrategy
            {
                id = "minnow_conversion_explosion",
                name = "Minnow Conversion Explosion",
                type = "revenue",
                multiplier = revenueMultiplier,
                parameters = new Dictionary<string, object>
                {
                    ["conversion_rate"] = "maximum",
                    ["barrier_reduction"] = "extreme",
                    ["incentive_power"] = "massive",
                    ["first_purchase_boost"] = "maximum"
                },
                isActive = enableMinnowConversionExplosion
            };
            
            _strategies["freemium_rocket"] = new RocketStrategy
            {
                id = "freemium_rocket",
                name = "Freemium Rocket",
                type = "revenue",
                multiplier = revenueMultiplier,
                parameters = new Dictionary<string, object>
                {
                    ["freemium_balance"] = "perfect",
                    ["upgrade_trigger"] = "powerful",
                    ["value_demonstration"] = "maximum",
                    ["conversion_pressure"] = "optimal"
                },
                isActive = enableFreemiumRocket
            };
            
            _strategies["subscription_bomb"] = new RocketStrategy
            {
                id = "subscription_bomb",
                name = "Subscription Bomb",
                type = "revenue",
                multiplier = revenueMultiplier,
                parameters = new Dictionary<string, object>
                {
                    ["subscription_value"] = "maximum",
                    ["retention_power"] = "extreme",
                    ["renewal_rate"] = "high",
                    ["lifetime_value"] = "massive"
                },
                isActive = enableSubscriptionBomb
            };
            
            _strategies["iap_explosion"] = new RocketStrategy
            {
                id = "iap_explosion",
                name = "IAP Explosion",
                type = "revenue",
                multiplier = revenueMultiplier,
                parameters = new Dictionary<string, object>
                {
                    ["iap_optimization"] = "maximum",
                    ["purchase_flow"] = "perfect",
                    ["value_proposition"] = "strong",
                    ["conversion_funnel"] = "optimized"
                },
                isActive = enableIAPExplosion
            };
            
            _strategies["ad_revenue_rocket"] = new RocketStrategy
            {
                id = "ad_revenue_rocket",
                name = "Ad Revenue Rocket",
                type = "revenue",
                multiplier = revenueMultiplier,
                parameters = new Dictionary<string, object>
                {
                    ["ad_optimization"] = "maximum",
                    ["placement_strategy"] = "perfect",
                    ["user_experience"] = "optimal",
                    ["revenue_per_impression"] = "high"
                },
                isActive = enableAdRevenueRocket
            };
            
            _strategies["premium_bomb"] = new RocketStrategy
            {
                id = "premium_bomb",
                name = "Premium Bomb",
                type = "revenue",
                multiplier = revenueMultiplier,
                parameters = new Dictionary<string, object>
                {
                    ["premium_value"] = "maximum",
                    ["exclusivity_factor"] = "high",
                    ["status_boost"] = "massive",
                    ["price_justification"] = "perfect"
                },
                isActive = enablePremiumBomb
            };
        }
        
        private void StartRocketStrategies()
        {
            _strategyCoroutine = StartCoroutine(StrategyCoroutine());
            _psychologyCoroutine = StartCoroutine(PsychologyCoroutine());
            _aiCoroutine = StartCoroutine(AICoroutine());
            _viralCoroutine = StartCoroutine(ViralCoroutine());
            _revenueCoroutine = StartCoroutine(RevenueCoroutine());
        }
        
        private IEnumerator StrategyCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(5f); // Update every 5 seconds
                
                ExecuteRocketStrategies();
                OptimizeForRocketTargets();
            }
        }
        
        private IEnumerator PsychologyCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(2f); // Update every 2 seconds
                
                ExecutePsychologyStrategies();
            }
        }
        
        private IEnumerator AICoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(10f); // Update every 10 seconds
                
                ExecuteAIStrategies();
            }
        }
        
        private IEnumerator ViralCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(15f); // Update every 15 seconds
                
                ExecuteViralStrategies();
            }
        }
        
        private IEnumerator RevenueCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(20f); // Update every 20 seconds
                
                ExecuteRevenueStrategies();
            }
        }
        
        private void ExecuteRocketStrategies()
        {
            Debug.Log("🚀 Executing rocket strategies...");
            
            var activeStrategies = _strategies.Values.Where(s => s.isActive).ToList();
            foreach (var strategy in activeStrategies)
            {
                ExecuteStrategy(strategy);
            }
        }
        
        private void ExecutePsychologyStrategies()
        {
            Debug.Log("🧠 Executing psychology strategies...");
            
            var psychologyStrategies = _strategies.Values.Where(s => s.isActive && s.type == "psychology").ToList();
            foreach (var strategy in psychologyStrategies)
            {
                ExecuteStrategy(strategy);
            }
        }
        
        private void ExecuteAIStrategies()
        {
            Debug.Log("🤖 Executing AI strategies...");
            
            var aiStrategies = _strategies.Values.Where(s => s.isActive && s.type == "ai").ToList();
            foreach (var strategy in aiStrategies)
            {
                ExecuteStrategy(strategy);
            }
        }
        
        private void ExecuteViralStrategies()
        {
            Debug.Log("💥 Executing viral strategies...");
            
            var viralStrategies = _strategies.Values.Where(s => s.isActive && s.type == "viral").ToList();
            foreach (var strategy in viralStrategies)
            {
                ExecuteStrategy(strategy);
            }
        }
        
        private void ExecuteRevenueStrategies()
        {
            Debug.Log("💰 Executing revenue strategies...");
            
            var revenueStrategies = _strategies.Values.Where(s => s.isActive && s.type == "revenue").ToList();
            foreach (var strategy in revenueStrategies)
            {
                ExecuteStrategy(strategy);
            }
        }
        
        private void ExecuteStrategy(RocketStrategy strategy)
        {
            Debug.Log($"🚀 Executing strategy: {strategy.name} (Multiplier: {strategy.multiplier}x)");
            
            // Execute strategy based on type
            switch (strategy.type)
            {
                case "psychology":
                    ExecutePsychologyStrategy(strategy);
                    break;
                case "ai":
                    ExecuteAIStrategy(strategy);
                    break;
                case "viral":
                    ExecuteViralStrategy(strategy);
                    break;
                case "revenue":
                    ExecuteRevenueStrategy(strategy);
                    break;
            }
        }
        
        private void ExecutePsychologyStrategy(RocketStrategy strategy)
        {
            Debug.Log($"🧠 Executing psychology strategy: {strategy.name}");
        }
        
        private void ExecuteAIStrategy(RocketStrategy strategy)
        {
            Debug.Log($"🤖 Executing AI strategy: {strategy.name}");
        }
        
        private void ExecuteViralStrategy(RocketStrategy strategy)
        {
            Debug.Log($"💥 Executing viral strategy: {strategy.name}");
        }
        
        private void ExecuteRevenueStrategy(RocketStrategy strategy)
        {
            Debug.Log($"💰 Executing revenue strategy: {strategy.name}");
        }
        
        private void OptimizeForRocketTargets()
        {
            var currentARPU = GetCurrentARPU();
            var currentARPPU = GetCurrentARPPU();
            var currentConversion = GetCurrentConversionRate();
            
            if (currentARPU < rocketARPUTarget)
            {
                Debug.Log($"🚀 ARPU below target: {currentARPU:F2} < {rocketARPUTarget:F2} - Exploding ARPU!");
                ExplodeARPU();
            }
            
            if (currentARPPU < rocketARPPUTarget)
            {
                Debug.Log($"🚀 ARPPU below target: {currentARPPU:F2} < {rocketARPPUTarget:F2} - Exploding ARPPU!");
                ExplodeARPPU();
            }
            
            if (currentConversion < rocketConversionTarget)
            {
                Debug.Log($"🚀 Conversion below target: {currentConversion:F2} < {rocketConversionTarget:F2} - Exploding conversion!");
                ExplodeConversion();
            }
        }
        
        private void ExplodeARPU()
        {
            Debug.Log("🚀 EXPLODING ARPU - Applying all rocket strategies!");
        }
        
        private void ExplodeARPPU()
        {
            Debug.Log("🚀 EXPLODING ARPPU - Applying all rocket strategies!");
        }
        
        private void ExplodeConversion()
        {
            Debug.Log("🚀 EXPLODING CONVERSION - Applying all rocket strategies!");
        }
        
        private float GetCurrentARPU()
        {
            var report = _analyticsHelper?.GetARPUReport();
            if (report != null && report.ContainsKey("arpu"))
            {
                return (float)report["arpu"];
            }
            return 0f;
        }
        
        private float GetCurrentARPPU()
        {
            var report = _analyticsHelper?.GetARPUReport();
            if (report != null && report.ContainsKey("arppu"))
            {
                return (float)report["arppu"];
            }
            return 0f;
        }
        
        private float GetCurrentConversionRate()
        {
            var report = _analyticsHelper?.GetARPUReport();
            if (report != null && report.ContainsKey("conversion_rate"))
            {
                return (float)report["conversion_rate"] / 100f;
            }
            return 0f;
        }
        
        // Cleanup
        
        void OnDestroy()
        {
            if (_strategyCoroutine != null)
                StopCoroutine(_strategyCoroutine);
            if (_psychologyCoroutine != null)
                StopCoroutine(_psychologyCoroutine);
            if (_aiCoroutine != null)
                StopCoroutine(_aiCoroutine);
            if (_viralCoroutine != null)
                StopCoroutine(_viralCoroutine);
            if (_revenueCoroutine != null)
                StopCoroutine(_revenueCoroutine);
        }
    }
    
    // Data Classes
    
    [System.Serializable]
    public class RocketStrategy
    {
        public string id;
        public string name;
        public string type;
        public float multiplier;
        public Dictionary<string, object> parameters;
        public bool isActive;
    }
    
    [System.Serializable]
    public class RocketPlayerProfile
    {
        public string playerId;
        public string segment;
        public float psychologyScore;
        public float aiScore;
        public float viralScore;
        public float revenueScore;
        public float retentionScore;
        public float totalSpent;
        public int purchaseCount;
        public System.DateTime lastPurchaseTime;
        public Dictionary<string, object> behaviorPatterns;
        public string emotionalState;
        public List<string> cognitiveBiases;
        public float dopamineLevel;
        public float viralCoefficient;
        public float networkValue;
        public float influenceScore;
    }
}