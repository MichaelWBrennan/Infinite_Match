using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using Evergreen.Core;
using Evergreen.Analytics;

namespace Evergreen.Monetization
{
    /// <summary>
    /// Advanced Personalized Offer System with AI-driven targeting
    /// Maximizes conversion rates through intelligent offer personalization
    /// </summary>
    public class PersonalizedOfferSystem : MonoBehaviour
    {
        [Header("Personalization Settings")]
        public bool enablePersonalization = true;
        public bool enableAITargeting = true;
        public bool enableBehavioralAnalysis = true;
        public float personalizationUpdateInterval = 300f; // 5 minutes
        
        [Header("Offer Settings")]
        public int maxActiveOffers = 3;
        public float offerRefreshInterval = 1800f; // 30 minutes
        public float offerExpiryTime = 3600f; // 1 hour
        
        [Header("Targeting Settings")]
        public float highValueThreshold = 100f; // USD spent
        public float lowValueThreshold = 10f; // USD spent
        public int newPlayerThreshold = 7; // days
        public int churnRiskThreshold = 3; // days inactive
        
        private Dictionary<string, PersonalizedOffer> _activeOffers = new Dictionary<string, PersonalizedOffer>();
        private Dictionary<string, PlayerOfferProfile> _playerProfiles = new Dictionary<string, PlayerOfferProfile>();
        private Dictionary<string, OfferTemplate> _offerTemplates = new Dictionary<string, OfferTemplate>();
        
        private Coroutine _personalizationCoroutine;
        private Coroutine _offerRefreshCoroutine;
        
        // Events
        public static event Action<PersonalizedOffer> OnOfferCreated;
        public static event Action<PersonalizedOffer> OnOfferExpired;
        public static event Action<PersonalizedOffer> OnOfferPurchased;
        public static event Action<PlayerOfferProfile> OnProfileUpdated;
        
        public static PersonalizedOfferSystem Instance { get; private set; }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeOfferSystem();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            if (enablePersonalization)
            {
                InitializeOfferTemplates();
                StartPersonalization();
            }
        }
        
        private void InitializeOfferSystem()
        {
            Debug.Log("Personalized Offer System initialized - AI targeting mode activated!");
        }
        
        private void InitializeOfferTemplates()
        {
            // Starter offers for new players
            _offerTemplates["starter_pack"] = new OfferTemplate
            {
                id = "starter_pack",
                name = "Starter Pack",
                basePrice = 4.99f,
                baseDiscount = 0.8f,
                targetSegments = new[] { "new_players", "low_value" },
                conditions = new Dictionary<string, object>
                {
                    ["max_level"] = 10,
                    ["max_spent"] = 5f,
                    ["days_since_install"] = 7
                },
                rewards = new Dictionary<string, int>
                {
                    ["coins"] = 1000,
                    ["gems"] = 50,
                    ["energy"] = 20
                }
            };
            
            // Comeback offers for returning players
            _offerTemplates["comeback_pack"] = new OfferTemplate
            {
                id = "comeback_pack",
                name = "Welcome Back!",
                basePrice = 9.99f,
                baseDiscount = 0.7f,
                targetSegments = new[] { "returning_players", "churn_risk" },
                conditions = new Dictionary<string, object>
                {
                    ["days_since_last_play"] = 3,
                    ["max_days_since_last_play"] = 30
                },
                rewards = new Dictionary<string, int>
                {
                    ["coins"] = 2000,
                    ["gems"] = 100,
                    ["energy"] = 50
                }
            };
            
            // High-value offers for spenders
            _offerTemplates["premium_pack"] = new OfferTemplate
            {
                id = "premium_pack",
                name = "Premium Pack",
                basePrice = 19.99f,
                baseDiscount = 0.6f,
                targetSegments = new[] { "high_value", "whales" },
                conditions = new Dictionary<string, object>
                {
                    ["min_spent"] = 50f,
                    ["min_level"] = 20
                },
                rewards = new Dictionary<string, int>
                {
                    ["coins"] = 5000,
                    ["gems"] = 300,
                    ["energy"] = 100
                }
            };
            
            // Energy offers for energy-depleted players
            _offerTemplates["energy_boost"] = new OfferTemplate
            {
                id = "energy_boost",
                name = "Energy Boost",
                basePrice = 2.99f,
                baseDiscount = 0.5f,
                targetSegments = new[] { "energy_depleted", "active_players" },
                conditions = new Dictionary<string, object>
                {
                    ["max_energy"] = 5,
                    ["min_level"] = 5
                },
                rewards = new Dictionary<string, int>
                {
                    ["energy"] = 30
                }
            };
            
            // Flash sale offers
            _offerTemplates["flash_sale"] = new OfferTemplate
            {
                id = "flash_sale",
                name = "Flash Sale!",
                basePrice = 14.99f,
                baseDiscount = 0.4f,
                targetSegments = new[] { "all_players" },
                conditions = new Dictionary<string, object>
                {
                    ["time_of_day"] = "peak_hours"
                },
                rewards = new Dictionary<string, int>
                {
                    ["coins"] = 3000,
                    ["gems"] = 200,
                    ["energy"] = 75
                }
            };
        }
        
        private void StartPersonalization()
        {
            _personalizationCoroutine = StartCoroutine(PersonalizationCoroutine());
            _offerRefreshCoroutine = StartCoroutine(OfferRefreshCoroutine());
        }
        
        private IEnumerator PersonalizationCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(personalizationUpdateInterval);
                
                UpdatePlayerProfiles();
                GeneratePersonalizedOffers();
            }
        }
        
        private IEnumerator OfferRefreshCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(offerRefreshInterval);
                
                RefreshExpiredOffers();
            }
        }
        
        private void UpdatePlayerProfiles()
        {
            // Update player profiles based on current behavior
            // This would integrate with your analytics system
        }
        
        private void GeneratePersonalizedOffers()
        {
            var activePlayerIds = GetActivePlayerIds();
            
            foreach (var playerId in activePlayerIds)
            {
                var profile = GetPlayerProfile(playerId);
                var offers = GenerateOffersForPlayer(profile);
                
                foreach (var offer in offers)
                {
                    if (_activeOffers.Count < maxActiveOffers)
                    {
                        _activeOffers[offer.id] = offer;
                        OnOfferCreated?.Invoke(offer);
                    }
                }
            }
        }
        
        private List<string> GetActivePlayerIds()
        {
            // Get list of active players
            // This would integrate with your player management system
            return new List<string>();
        }
        
        private PlayerOfferProfile GetPlayerProfile(string playerId)
        {
            if (!_playerProfiles.ContainsKey(playerId))
            {
                _playerProfiles[playerId] = new PlayerOfferProfile
                {
                    playerId = playerId,
                    totalSpent = 0f,
                    level = 1,
                    lastPlayTime = DateTime.Now,
                    installDate = DateTime.Now,
                    purchaseHistory = new List<string>(),
                    offerHistory = new List<string>(),
                    playerSegment = "new_players",
                    churnRisk = 0f,
                    energyLevel = 30,
                    preferredOfferTypes = new List<string>()
                };
            }
            
            return _playerProfiles[playerId];
        }
        
        private List<PersonalizedOffer> GenerateOffersForPlayer(PlayerOfferProfile profile)
        {
            var offers = new List<PersonalizedOffer>();
            
            foreach (var template in _offerTemplates.Values)
            {
                if (ShouldShowOffer(template, profile))
                {
                    var offer = CreatePersonalizedOffer(template, profile);
                    offers.Add(offer);
                }
            }
            
            return offers;
        }
        
        private bool ShouldShowOffer(OfferTemplate template, PlayerOfferProfile profile)
        {
            // Check if player matches target segments
            if (!template.targetSegments.Contains(profile.playerSegment))
                return false;
            
            // Check conditions
            foreach (var condition in template.conditions)
            {
                if (!EvaluateCondition(condition.Key, condition.Value, profile))
                    return false;
            }
            
            // Check if player has already seen this offer recently
            if (profile.offerHistory.Contains(template.id))
                return false;
            
            return true;
        }
        
        private bool EvaluateCondition(string conditionType, object conditionValue, PlayerOfferProfile profile)
        {
            switch (conditionType)
            {
                case "max_level":
                    return profile.level <= (int)conditionValue;
                case "min_level":
                    return profile.level >= (int)conditionValue;
                case "max_spent":
                    return profile.totalSpent <= (float)conditionValue;
                case "min_spent":
                    return profile.totalSpent >= (float)conditionValue;
                case "days_since_install":
                    return (DateTime.Now - profile.installDate).TotalDays <= (int)conditionValue;
                case "days_since_last_play":
                    return (DateTime.Now - profile.lastPlayTime).TotalDays >= (int)conditionValue;
                case "max_days_since_last_play":
                    return (DateTime.Now - profile.lastPlayTime).TotalDays <= (int)conditionValue;
                case "max_energy":
                    return profile.energyLevel <= (int)conditionValue;
                case "time_of_day":
                    return IsPeakHours();
                default:
                    return true;
            }
        }
        
        private bool IsPeakHours()
        {
            var hour = DateTime.Now.Hour;
            return hour >= 18 && hour <= 22; // 6 PM to 10 PM
        }
        
        private PersonalizedOffer CreatePersonalizedOffer(OfferTemplate template, PlayerOfferProfile profile)
        {
            var personalizedPrice = CalculatePersonalizedPrice(template, profile);
            var personalizedDiscount = CalculatePersonalizedDiscount(template, profile);
            
            return new PersonalizedOffer
            {
                id = Guid.NewGuid().ToString(),
                templateId = template.id,
                name = template.name,
                originalPrice = template.basePrice,
                personalizedPrice = personalizedPrice,
                discount = personalizedDiscount,
                rewards = new Dictionary<string, int>(template.rewards),
                playerId = profile.playerId,
                createdAt = DateTime.Now,
                expiresAt = DateTime.Now.AddSeconds(offerExpiryTime),
                isActive = true,
                personalizationFactors = GetPersonalizationFactors(profile)
            };
        }
        
        private float CalculatePersonalizedPrice(OfferTemplate template, PlayerOfferProfile profile)
        {
            var basePrice = template.basePrice;
            var multiplier = 1f;
            
            // High-value players get higher prices
            if (profile.totalSpent > highValueThreshold)
            {
                multiplier *= 1.2f;
            }
            // Low-value players get lower prices
            else if (profile.totalSpent < lowValueThreshold)
            {
                multiplier *= 0.8f;
            }
            
            // Churn risk players get discounts
            if (profile.churnRisk > 0.7f)
            {
                multiplier *= 0.7f;
            }
            
            // New players get discounts
            if (profile.playerSegment == "new_players")
            {
                multiplier *= 0.6f;
            }
            
            return basePrice * multiplier;
        }
        
        private float CalculatePersonalizedDiscount(OfferTemplate template, PlayerOfferProfile profile)
        {
            var baseDiscount = template.baseDiscount;
            var additionalDiscount = 0f;
            
            // Churn risk players get extra discount
            if (profile.churnRisk > 0.7f)
            {
                additionalDiscount += 0.2f;
            }
            
            // New players get extra discount
            if (profile.playerSegment == "new_players")
            {
                additionalDiscount += 0.1f;
            }
            
            // Low-value players get extra discount
            if (profile.totalSpent < lowValueThreshold)
            {
                additionalDiscount += 0.1f;
            }
            
            return Mathf.Clamp01(baseDiscount + additionalDiscount);
        }
        
        private Dictionary<string, object> GetPersonalizationFactors(PlayerOfferProfile profile)
        {
            return new Dictionary<string, object>
            {
                ["player_segment"] = profile.playerSegment,
                ["total_spent"] = profile.totalSpent,
                ["churn_risk"] = profile.churnRisk,
                ["energy_level"] = profile.energyLevel,
                ["level"] = profile.level
            };
        }
        
        private void RefreshExpiredOffers()
        {
            var expiredOffers = new List<string>();
            
            foreach (var kvp in _activeOffers)
            {
                var offer = kvp.Value;
                if (offer.expiresAt <= DateTime.Now)
                {
                    offer.isActive = false;
                    expiredOffers.Add(kvp.Key);
                    OnOfferExpired?.Invoke(offer);
                }
            }
            
            foreach (var offerId in expiredOffers)
            {
                _activeOffers.Remove(offerId);
            }
        }
        
        public List<PersonalizedOffer> GetOffersForPlayer(string playerId)
        {
            return _activeOffers.Values
                .Where(o => o.playerId == playerId && o.isActive)
                .OrderByDescending(o => o.discount)
                .ToList();
        }
        
        public bool PurchaseOffer(string offerId, string playerId)
        {
            if (!_activeOffers.ContainsKey(offerId)) return false;
            
            var offer = _activeOffers[offerId];
            if (offer.playerId != playerId || !offer.isActive) return false;
            
            // Process purchase
            offer.isActive = false;
            _activeOffers.Remove(offerId);
            
            // Award rewards
            AwardOfferRewards(offer);
            
            // Update player profile
            var profile = GetPlayerProfile(playerId);
            profile.purchaseHistory.Add(offer.templateId);
            profile.offerHistory.Add(offer.templateId);
            profile.totalSpent += offer.personalizedPrice;
            
            OnOfferPurchased?.Invoke(offer);
            
            // Track analytics
            var analytics = AdvancedAnalyticsSystem.Instance;
            if (analytics != null)
            {
                analytics.TrackEvent("personalized_offer_purchased", new Dictionary<string, object>
                {
                    ["offer_id"] = offerId,
                    ["template_id"] = offer.templateId,
                    ["price"] = offer.personalizedPrice,
                    ["discount"] = offer.discount,
                    ["player_segment"] = profile.playerSegment
                });
            }
            
            return true;
        }
        
        private void AwardOfferRewards(PersonalizedOffer offer)
        {
            var economyManager = EconomyManager.Instance;
            if (economyManager == null) return;
            
            foreach (var reward in offer.rewards)
            {
                switch (reward.Key)
                {
                    case "coins":
                        economyManager.AddCurrency("coins", reward.Value);
                        break;
                    case "gems":
                        economyManager.AddCurrency("gems", reward.Value);
                        break;
                    case "energy":
                        var energySystem = EnergySystem.Instance;
                        if (energySystem != null)
                        {
                            energySystem.AddEnergy(reward.Value);
                        }
                        break;
                }
            }
        }
        
        public Dictionary<string, object> GetOfferStatistics()
        {
            var totalOffers = _activeOffers.Count;
            var totalRevenue = _activeOffers.Values.Sum(o => o.personalizedPrice);
            var averageDiscount = _activeOffers.Values.Average(o => o.discount);
            
            return new Dictionary<string, object>
            {
                ["active_offers"] = totalOffers,
                ["total_revenue"] = totalRevenue,
                ["average_discount"] = averageDiscount,
                ["conversion_rate"] = 0f // This would be calculated from actual data
            };
        }
        
        void OnDestroy()
        {
            if (_personalizationCoroutine != null)
                StopCoroutine(_personalizationCoroutine);
            if (_offerRefreshCoroutine != null)
                StopCoroutine(_offerRefreshCoroutine);
        }
    }
    
    [System.Serializable]
    public class OfferTemplate
    {
        public string id;
        public string name;
        public float basePrice;
        public float baseDiscount;
        public string[] targetSegments;
        public Dictionary<string, object> conditions;
        public Dictionary<string, int> rewards;
    }
    
    [System.Serializable]
    public class PersonalizedOffer
    {
        public string id;
        public string templateId;
        public string name;
        public float originalPrice;
        public float personalizedPrice;
        public float discount;
        public Dictionary<string, int> rewards;
        public string playerId;
        public DateTime createdAt;
        public DateTime expiresAt;
        public bool isActive;
        public Dictionary<string, object> personalizationFactors;
    }
    
    [System.Serializable]
    public class PlayerOfferProfile
    {
        public string playerId;
        public float totalSpent;
        public int level;
        public DateTime lastPlayTime;
        public DateTime installDate;
        public List<string> purchaseHistory;
        public List<string> offerHistory;
        public string playerSegment;
        public float churnRisk;
        public int energyLevel;
        public List<string> preferredOfferTypes;
    }
}