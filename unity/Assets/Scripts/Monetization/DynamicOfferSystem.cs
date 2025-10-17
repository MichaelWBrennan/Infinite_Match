using UnityEngine;
using System.Collections.Generic;
using System;
using Evergreen.Core;

namespace Evergreen.Monetization
{
    [System.Serializable]
    public class Offer
    {
        public string id;
        public string name;
        public string description;
        public OfferType type;
        public OfferTrigger trigger;
        public int priority;
        public bool isActive;
        public DateTime startTime;
        public DateTime endTime;
        public int maxPurchases;
        public int currentPurchases;
        public List<OfferReward> rewards = new List<OfferReward>();
        public List<OfferCondition> conditions = new List<OfferCondition>();
        public OfferPricing pricing;
        public string iconPath;
        public string bannerPath;
        public int displayOrder;
        public bool isLimitedTime;
        public bool isPopular;
        public bool isRecommended;
    }

    [System.Serializable]
    public class OfferReward
    {
        public string type; // "coins", "gems", "energy", "decoration", "character", "ability"
        public int amount;
        public string itemId;
        public int rarity;
        public bool isBonus;
    }

    [System.Serializable]
    public class OfferCondition
    {
        public string type; // "level", "purchase_count", "time_since_last_purchase", "currency_balance", "streak", "completion_rate"
        public string operatorType; // "greater_than", "less_than", "equals", "not_equals"
        public int value;
        public string currencyType;
        public int timeWindow; // in hours
    }

    [System.Serializable]
    public class OfferPricing
    {
        public string currencyType; // "USD", "EUR", "GBP", etc.
        public float basePrice;
        public float currentPrice;
        public float discountPercentage;
        public bool isDiscounted;
        public string priceTier; // "tier_1", "tier_2", "tier_3"
        public Dictionary<string, float> regionalPricing = new Dictionary<string, float>();
    }

    public enum OfferType
    {
        StarterPack,
        ComebackPack,
        FlashSale,
        PiggyBank,
        RescueBundle,
        EnergyPack,
        CoinPack,
        GemPack,
        DecorationPack,
        CharacterPack,
        AbilityPack,
        Subscription,
        BattlePass,
        LimitedTime,
        DailyDeal,
        WeeklyDeal,
        MonthlyDeal
    }

    public enum OfferTrigger
    {
        OnStart,
        OnLevelFail,
        OnEnergyDepleted,
        OnFirstPurchase,
        OnReturn,
        OnLevelComplete,
        OnStreakBreak,
        OnCurrencyLow,
        OnTimeBased,
        OnEventBased,
        OnPersonalized
    }

    [System.Serializable]
    public class PlayerSegment
    {
        public string id;
        public string name;
        public List<OfferCondition> conditions = new List<OfferCondition>();
        public float priorityMultiplier = 1.0f;
        public float priceMultiplier = 1.0f;
        public List<string> preferredOfferTypes = new List<string>();
        public bool isActive = true;
    }

    [System.Serializable]
    public class ABTest
    {
        public string id;
        public string name;
        public List<string> variants = new List<string>();
        public float trafficAllocation = 1.0f;
        public DateTime startTime;
        public DateTime endTime;
        public bool isActive = true;
        public Dictionary<string, float> variantWeights = new Dictionary<string, float>();
    }

    public class DynamicOfferSystem : MonoBehaviour
    {
        [Header("Offer Settings")]
        public List<Offer> offers = new List<Offer>();
        public List<PlayerSegment> playerSegments = new List<PlayerSegment>();
        public List<ABTest> abTests = new List<ABTest>();
        
        [Header("Personalization Settings")]
        public bool enablePersonalization = true;
        public bool enableABTesting = true;
        public bool enableDynamicPricing = true;
        public float personalizationWeight = 0.7f;
        public float abTestWeight = 0.3f;
        
        [Header("Analytics Settings")]
        public bool trackOfferViews = true;
        public bool trackOfferClicks = true;
        public bool trackOfferPurchases = true;
        public bool trackOfferConversions = true;
        
        private Dictionary<string, Offer> _offerLookup = new Dictionary<string, Offer>();
        private Dictionary<string, PlayerSegment> _segmentLookup = new Dictionary<string, PlayerSegment>();
        private Dictionary<string, ABTest> _abTestLookup = new Dictionary<string, ABTest>();
        private Dictionary<string, List<Offer>> _playerOffers = new Dictionary<string, List<Offer>>();
        private Dictionary<string, PlayerBehavior> _playerBehavior = new Dictionary<string, PlayerBehavior>();
        
        // Events
        public System.Action<Offer> OnOfferShown;
        public System.Action<Offer> OnOfferClicked;
        public System.Action<Offer> OnOfferPurchased;
        public System.Action<Offer> OnOfferExpired;
        
        public static DynamicOfferSystem Instance { get; private set; }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeOffersystemSafe();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            LoadOfferData();
            CreateDefaultOffers();
            CreateDefaultSegments();
            CreateDefaultABTests();
            BuildLookupTables();
        }
        
        private void InitializeOffersystemSafe()
        {
            // Initialize offer system
            Debug.Log("Dynamic Offer System initialized");
        }
        
        private void CreateDefaultOffers()
        {
            if (offers.Count == 0)
            {
                // Starter Pack
                var starterPack = new Offer
                {
                    id = "starter_pack_1",
                    name = "Starter Pack",
                    description = "Perfect for new players!",
                    type = OfferType.StarterPack,
                    trigger = OfferTrigger.OnStart,
                    priority = 100,
                    isActive = true,
                    startTime = DateTime.Now,
                    endTime = DateTime.Now.AddDays(7),
                    maxPurchases = 1,
                    currentPurchases = 0,
                    rewards = new List<OfferReward>
                    {
                        new OfferReward { type = "coins", amount = 1000, isBonus = false },
                        new OfferReward { type = "gems", amount = 50, isBonus = false },
                        new OfferReward { type = "energy", amount = 10, isBonus = true }
                    },
                    conditions = new List<OfferCondition>
                    {
                        new OfferCondition { type = "level", operatorType = "less_than", value = 10 }
                    },
                    pricing = new OfferPricing
                    {
                        currencyType = "USD",
                        basePrice = 4.99f,
                        currentPrice = 0.99f,
                        discountPercentage = 80f,
                        isDiscounted = true,
                        priceTier = "tier_1"
                    },
                    displayOrder = 1,
                    isLimitedTime = true,
                    isPopular = true,
                    isRecommended = true
                };
                offers.Add(starterPack);
                
                // Comeback Pack
                var comebackPack = new Offer
                {
                    id = "comeback_pack_1",
                    name = "Welcome Back!",
                    description = "We missed you! Here's a special deal.",
                    type = OfferType.ComebackPack,
                    trigger = OfferTrigger.OnReturn,
                    priority = 90,
                    isActive = true,
                    startTime = DateTime.Now,
                    endTime = DateTime.Now.AddDays(3),
                    maxPurchases = 1,
                    currentPurchases = 0,
                    rewards = new List<OfferReward>
                    {
                        new OfferReward { type = "coins", amount = 2000, isBonus = false },
                        new OfferReward { type = "gems", amount = 100, isBonus = false },
                        new OfferReward { type = "energy", amount = 20, isBonus = true }
                    },
                    conditions = new List<OfferCondition>
                    {
                        new OfferCondition { type = "time_since_last_purchase", operatorType = "greater_than", value = 24, timeWindow = 168 }
                    },
                    pricing = new OfferPricing
                    {
                        currencyType = "USD",
                        basePrice = 9.99f,
                        currentPrice = 2.99f,
                        discountPercentage = 70f,
                        isDiscounted = true,
                        priceTier = "tier_2"
                    },
                    displayOrder = 2,
                    isLimitedTime = true,
                    isPopular = false,
                    isRecommended = true
                };
                offers.Add(comebackPack);
                
                // Energy Pack
                var energyPack = new Offer
                {
                    id = "energy_pack_1",
                    name = "Energy Boost",
                    description = "Never run out of energy again!",
                    type = OfferType.EnergyPack,
                    trigger = OfferTrigger.OnEnergyDepleted,
                    priority = 80,
                    isActive = true,
                    startTime = DateTime.Now,
                    endTime = DateTime.Now.AddDays(30),
                    maxPurchases = 10,
                    currentPurchases = 0,
                    rewards = new List<OfferReward>
                    {
                        new OfferReward { type = "energy", amount = 30, isBonus = false },
                        new OfferReward { type = "gems", amount = 20, isBonus = true }
                    },
                    conditions = new List<OfferCondition>
                    {
                        new OfferCondition { type = "currency_balance", operatorType = "less_than", value = 5, currencyType = "energy" }
                    },
                    pricing = new OfferPricing
                    {
                        currencyType = "USD",
                        basePrice = 2.99f,
                        currentPrice = 1.99f,
                        discountPercentage = 33f,
                        isDiscounted = true,
                        priceTier = "tier_1"
                    },
                    displayOrder = 3,
                    isLimitedTime = false,
                    isPopular = true,
                    isRecommended = false
                };
                offers.Add(energyPack);
                
                // Flash Sale
                var flashSale = new Offer
                {
                    id = "flash_sale_1",
                    name = "Flash Sale!",
                    description = "Limited time offer - 50% off everything!",
                    type = OfferType.FlashSale,
                    trigger = OfferTrigger.OnTimeBased,
                    priority = 95,
                    isActive = true,
                    startTime = DateTime.Now,
                    endTime = DateTime.Now.AddHours(6),
                    maxPurchases = 3,
                    currentPurchases = 0,
                    rewards = new List<OfferReward>
                    {
                        new OfferReward { type = "coins", amount = 5000, isBonus = false },
                        new OfferReward { type = "gems", amount = 200, isBonus = false },
                        new OfferReward { type = "energy", amount = 50, isBonus = true }
                    },
                    conditions = new List<OfferCondition>(),
                    pricing = new OfferPricing
                    {
                        currencyType = "USD",
                        basePrice = 19.99f,
                        currentPrice = 9.99f,
                        discountPercentage = 50f,
                        isDiscounted = true,
                        priceTier = "tier_3"
                    },
                    displayOrder = 0,
                    isLimitedTime = true,
                    isPopular = true,
                    isRecommended = true
                };
                offers.Add(flashSale);
            }
        }
        
        private void CreateDefaultSegments()
        {
            if (playerSegments.Count == 0)
            {
                // New Players
                var newPlayers = new PlayerSegment
                {
                    id = "new_players",
                    name = "New Players",
                    conditions = new List<OfferCondition>
                    {
                        new OfferCondition { type = "level", operatorType = "less_than", value = 20 }
                    },
                    priorityMultiplier = 1.2f,
                    priceMultiplier = 0.8f,
                    preferredOfferTypes = new List<string> { "StarterPack", "EnergyPack" },
                    isActive = true
                };
                playerSegments.Add(newPlayers);
                
                // High Spenders
                var highSpenders = new PlayerSegment
                {
                    id = "high_spenders",
                    name = "High Spenders",
                    conditions = new List<OfferCondition>
                    {
                        new OfferCondition { type = "purchase_count", operatorType = "greater_than", value = 10 }
                    },
                    priorityMultiplier = 1.5f,
                    priceMultiplier = 1.1f,
                    preferredOfferTypes = new List<string> { "FlashSale", "LimitedTime", "BattlePass" },
                    isActive = true
                };
                playerSegments.Add(highSpenders);
                
                // Return Players
                var returnPlayers = new PlayerSegment
                {
                    id = "return_players",
                    name = "Return Players",
                    conditions = new List<OfferCondition>
                    {
                        new OfferCondition { type = "time_since_last_purchase", operatorType = "greater_than", value = 48, timeWindow = 168 }
                    },
                    priorityMultiplier = 1.3f,
                    priceMultiplier = 0.9f,
                    preferredOfferTypes = new List<string> { "ComebackPack", "FlashSale" },
                    isActive = true
                };
                playerSegments.Add(returnPlayers);
            }
        }
        
        private void CreateDefaultABTests()
        {
            if (abTests.Count == 0)
            {
                // Pricing Test
                var pricingTest = new ABTest
                {
                    id = "pricing_test_1",
                    name = "Starter Pack Pricing Test",
                    variants = new List<string> { "control", "discount_20", "discount_40" },
                    trafficAllocation = 0.5f,
                    startTime = DateTime.Now,
                    endTime = DateTime.Now.AddDays(14),
                    isActive = true,
                    variantWeights = new Dictionary<string, float>
                    {
                        { "control", 0.33f },
                        { "discount_20", 0.33f },
                        { "discount_40", 0.34f }
                    }
                };
                abTests.Add(pricingTest);
                
                // Offer Display Test
                var displayTest = new ABTest
                {
                    id = "display_test_1",
                    name = "Offer Display Test",
                    variants = new List<string> { "grid", "carousel", "popup" },
                    trafficAllocation = 0.3f,
                    startTime = DateTime.Now,
                    endTime = DateTime.Now.AddDays(7),
                    isActive = true,
                    variantWeights = new Dictionary<string, float>
                    {
                        { "grid", 0.33f },
                        { "carousel", 0.33f },
                        { "popup", 0.34f }
                    }
                };
                abTests.Add(displayTest);
            }
        }
        
        private void BuildLookupTables()
        {
            _offerLookup.Clear();
            _segmentLookup.Clear();
            _abTestLookup.Clear();
            
            foreach (var offer in offers)
            {
                _offerLookup[offer.id] = offer;
            }
            
            foreach (var segment in playerSegments)
            {
                _segmentLookup[segment.id] = segment;
            }
            
            foreach (var abTest in abTests)
            {
                _abTestLookup[abTest.id] = abTest;
            }
        }
        
        public List<Offer> GetOffersForPlayer(string playerId, int maxOffers = 5)
        {
            var playerBehavior = GetPlayerBehavior(playerId);
            var playerSegment = GetPlayerSegment(playerId);
            var availableOffers = new List<Offer>();
            
            foreach (var offer in offers)
            {
                if (IsOfferAvailable(offer, playerId, playerBehavior, playerSegment))
                {
                    availableOffers.Add(offer);
                }
            }
            
            // Sort by priority and personalization
            availableOffers.Sort((a, b) => 
            {
                float scoreA = CalculateOfferScore(a, playerId, playerBehavior, playerSegment);
                float scoreB = CalculateOfferScore(b, playerId, playerBehavior, playerSegment);
                return scoreB.CompareTo(scoreA);
            });
            
            // Apply AB testing
            if (enableABTesting)
            {
                availableOffers = ApplyABTesting(availableOffers, playerId);
            }
            
            // Apply dynamic pricing
            if (enableDynamicPricing)
            {
                availableOffers = ApplyDynamicPricing(availableOffers, playerId, playerSegment);
            }
            
            // Limit to max offers
            if (availableOffers.Count > maxOffers)
            {
                availableOffers = availableOffers.GetRange(0, maxOffers);
            }
            
            // Track offer views
            if (trackOfferViews)
            {
                foreach (var offer in availableOffers)
                {
                    TrackOfferView(offer, playerId);
                }
            }
            
            return availableOffers;
        }
        
        private bool IsOfferAvailable(Offer offer, string playerId, PlayerBehavior behavior, PlayerSegment segment)
        {
            if (!offer.isActive) return false;
            if (offer.currentPurchases >= offer.maxPurchases) return false;
            if (DateTime.Now < offer.startTime || DateTime.Now > offer.endTime) return false;
            
            // Check conditions
            foreach (var condition in offer.conditions)
            {
                if (!EvaluateCondition(condition, playerId, behavior)) return false;
            }
            
            return true;
        }
        
        private bool EvaluateCondition(OfferCondition condition, string playerId, PlayerBehavior behavior)
        {
            int value = GetConditionValue(condition, playerId, behavior);
            
            switch (condition.operatorType)
            {
                case "greater_than":
                    return value > condition.value;
                case "less_than":
                    return value < condition.value;
                case "equals":
                    return value == condition.value;
                case "not_equals":
                    return value != condition.value;
                default:
                    return false;
            }
        }
        
        private int GetConditionValue(OfferCondition condition, string playerId, PlayerBehavior behavior)
        {
            switch (condition.type)
            {
                case "level":
                    return behavior.level;
                case "purchase_count":
                    return behavior.purchaseCount;
                case "time_since_last_purchase":
                    return (int)(DateTime.Now - behavior.lastPurchaseTime).TotalHours;
                case "currency_balance":
                    var gameManager = OptimizedCoreSystem.Instance.Resolve<GameManager>();
                    return gameManager?.GetCurrency(condition.currencyType) ?? 0;
                case "streak":
                    return behavior.currentStreak;
                case "completion_rate":
                    return Mathf.RoundToInt(behavior.completionRate * 100);
                default:
                    return 0;
            }
        }
        
        private float CalculateOfferScore(Offer offer, string playerId, PlayerBehavior behavior, PlayerSegment segment)
        {
            float score = offer.priority;
            
            // Apply segment multiplier
            if (segment != null)
            {
                score *= segment.priorityMultiplier;
            }
            
            // Apply personalization
            if (enablePersonalization)
            {
                score *= CalculatePersonalizationScore(offer, behavior, segment);
            }
            
            // Apply time-based scoring
            if (offer.isLimitedTime)
            {
                float timeRemaining = (float)(offer.endTime - DateTime.Now).TotalHours;
                float timeTotal = (float)(offer.endTime - offer.startTime).TotalHours;
                score *= (timeRemaining / timeTotal) * 1.5f;
            }
            
            return score;
        }
        
        private float CalculatePersonalizationScore(Offer offer, PlayerBehavior behavior, PlayerSegment segment)
        {
            float score = 1.0f;
            
            // Check if offer type is preferred by segment
            if (segment != null && segment.preferredOfferTypes.Contains(offer.type.ToString()))
            {
                score *= 1.3f;
            }
            
            // Check purchase history
            if (behavior.purchaseHistory.ContainsKey(offer.type.ToString()))
            {
                score *= 1.2f;
            }
            
            // Check currency needs
            var gameManager = OptimizedCoreSystem.Instance.Resolve<GameManager>();
            if (gameManager != null)
            {
                foreach (var reward in offer.rewards)
                {
                    if (reward.type == "coins" && gameManager.GetCurrency("coins") < 1000)
                    {
                        score *= 1.2f;
                    }
                    if (reward.type == "gems" && gameManager.GetCurrency("gems") < 100)
                    {
                        score *= 1.2f;
                    }
                    if (reward.type == "energy" && gameManager.GetCurrency("energy") < 5)
                    {
                        score *= 1.3f;
                    }
                }
            }
            
            return score;
        }
        
        private List<Offer> ApplyABTesting(List<Offer> offers, string playerId)
        {
            var modifiedOffers = new List<Offer>(offers);
            
            foreach (var abTest in abTests)
            {
                if (!abTest.isActive) continue;
                if (DateTime.Now < abTest.startTime || DateTime.Now > abTest.endTime) continue;
                
                string variant = GetABTestVariant(abTest, playerId);
                modifiedOffers = ApplyABTestVariant(modifiedOffers, abTest, variant);
            }
            
            return modifiedOffers;
        }
        
        private string GetABTestVariant(ABTest abTest, string playerId)
        {
            // Simple hash-based variant selection
            int hash = playerId.GetHashCode();
            float random = (hash % 1000) / 1000.0f;
            
            float cumulative = 0f;
            foreach (var kvp in abTest.variantWeights)
            {
                cumulative += kvp.Value;
                if (random <= cumulative)
                {
                    return kvp.Key;
                }
            }
            
            return abTest.variants[0];
        }
        
        private List<Offer> ApplyABTestVariant(List<Offer> offers, ABTest abTest, string variant)
        {
            var modifiedOffers = new List<Offer>();
            
            foreach (var offer in offers)
            {
                var modifiedOffer = new Offer(offer);
                
                switch (abTest.id)
                {
                    case "pricing_test_1":
                        if (variant == "discount_20")
                        {
                            modifiedOffer.pricing.currentPrice = offer.pricing.basePrice * 0.8f;
                            modifiedOffer.pricing.discountPercentage = 20f;
                        }
                        else if (variant == "discount_40")
                        {
                            modifiedOffer.pricing.currentPrice = offer.pricing.basePrice * 0.6f;
                            modifiedOffer.pricing.discountPercentage = 40f;
                        }
                        break;
                        
                    case "display_test_1":
                        // This would affect UI display, not offer data
                        break;
                }
                
                modifiedOffers.Add(modifiedOffer);
            }
            
            return modifiedOffers;
        }
        
        private List<Offer> ApplyDynamicPricing(List<Offer> offers, string playerId, PlayerSegment segment)
        {
            var modifiedOffers = new List<Offer>();
            
            foreach (var offer in offers)
            {
                var modifiedOffer = new Offer(offer);
                
                if (segment != null)
                {
                    modifiedOffer.pricing.currentPrice *= segment.priceMultiplier;
                }
                
                // Apply regional pricing
                string region = GetPlayerRegion(playerId);
                if (modifiedOffer.pricing.regionalPricing.ContainsKey(region))
                {
                    modifiedOffer.pricing.currentPrice = modifiedOffer.pricing.regionalPricing[region];
                }
                
                modifiedOffers.Add(modifiedOffer);
            }
            
            return modifiedOffers;
        }
        
        private string GetPlayerRegion(string playerId)
        {
            // This would integrate with your analytics system
            return "US"; // Default to US
        }
        
        public bool PurchaseOffer(string offerId, string playerId)
        {
            if (!_offerLookup.ContainsKey(offerId)) return false;
            
            var offer = _offerLookup[offerId];
            if (!IsOfferAvailable(offer, playerId, GetPlayerBehavior(playerId), GetPlayerSegment(playerId))) return false;
            
            // Process purchase
            offer.currentPurchases++;
            
            // Award rewards
            var gameManager = OptimizedCoreSystem.Instance.Resolve<GameManager>();
            if (gameManager != null)
            {
                foreach (var reward in offer.rewards)
                {
                    AwardReward(reward, gameManager);
                }
            }
            
            // Update player behavior
            UpdatePlayerBehavior(playerId, offer);
            
            // Track purchase
            if (trackOfferPurchases)
            {
                TrackOfferPurchase(offer, playerId);
            }
            
            OnOfferPurchased?.Invoke(offer);
            
            return true;
        }
        
        private void AwardReward(OfferReward reward, GameManager gameManager)
        {
            switch (reward.type)
            {
                case "coins":
                    gameManager.AddCurrency("coins", reward.amount);
                    break;
                case "gems":
                    gameManager.AddCurrency("gems", reward.amount);
                    break;
                case "energy":
                    var energySystem = OptimizedCoreSystem.Instance.Resolve<EnergySystem>();
                    energySystem?.AddEnergy(reward.amount);
                    break;
                case "decoration":
                    var castleSystem = OptimizedCoreSystem.Instance.Resolve<CastleRenovationSystem>();
                    if (castleSystem != null && !string.IsNullOrEmpty(reward.itemId))
                    {
                        castleSystem.PurchaseDecoration(reward.itemId);
                    }
                    break;
            }
        }
        
        private void UpdatePlayerBehavior(string playerId, Offer offer)
        {
            var behavior = GetPlayerBehavior(playerId);
            behavior.purchaseCount++;
            behavior.lastPurchaseTime = DateTime.Now;
            behavior.totalSpent += offer.pricing.currentPrice;
            
            if (!behavior.purchaseHistory.ContainsKey(offer.type.ToString()))
            {
                behavior.purchaseHistory[offer.type.ToString()] = 0;
            }
            behavior.purchaseHistory[offer.type.ToString()]++;
            
            _playerBehavior[playerId] = behavior;
        }
        
        private PlayerBehavior GetPlayerBehavior(string playerId)
        {
            if (!_playerBehavior.ContainsKey(playerId))
            {
                _playerBehavior[playerId] = new PlayerBehavior
                {
                    playerId = playerId,
                    level = 1,
                    purchaseCount = 0,
                    lastPurchaseTime = DateTime.MinValue,
                    totalSpent = 0f,
                    currentStreak = 0,
                    completionRate = 0f,
                    purchaseHistory = new Dictionary<string, int>()
                };
            }
            return _playerBehavior[playerId];
        }
        
        private PlayerSegment GetPlayerSegment(string playerId)
        {
            var behavior = GetPlayerBehavior(playerId);
            
            foreach (var segment in playerSegments)
            {
                if (!segment.isActive) continue;
                
                bool matches = true;
                foreach (var condition in segment.conditions)
                {
                    if (!EvaluateCondition(condition, playerId, behavior))
                    {
                        matches = false;
                        break;
                    }
                }
                
                if (matches) return segment;
            }
            
            return null;
        }
        
        private void TrackOfferView(Offer offer, string playerId)
        {
            Debug.Log($"Offer viewed: {offer.id} by player {playerId}");
            // Integrate with your analytics system
        }
        
        private void TrackOfferPurchase(Offer offer, string playerId)
        {
            Debug.Log($"Offer purchased: {offer.id} by player {playerId}");
            // Integrate with your analytics system
        }
        
        private void LoadOfferData()
        {
            string path = Application.persistentDataPath + "/offer_data.json";
            if (System.IO.File.Exists(path))
            {
                string json = System.IO.File.ReadAllText(path);
                var saveData = JsonUtility.FromJson<OfferSaveData>(json);
                
                offers = saveData.offers;
                playerSegments = saveData.playerSegments;
                abTests = saveData.abTests;
            }
        }
        
        public void SaveOfferData()
        {
            var saveData = new OfferSaveData
            {
                offers = offers,
                playerSegments = playerSegments,
                abTests = abTests
            };
            
            string json = JsonUtility.ToJson(saveData, true);
            System.IO.File.WriteAllText(Application.persistentDataPath + "/offer_data.json", json);
        }
        
        void OnDestroy()
        {
            SaveOfferData();
        }
    }
    
    [System.Serializable]
    public class PlayerBehavior
    {
        public string playerId;
        public int level;
        public int purchaseCount;
        public DateTime lastPurchaseTime;
        public float totalSpent;
        public int currentStreak;
        public float completionRate;
        public Dictionary<string, int> purchaseHistory = new Dictionary<string, int>();
    }
    
    [System.Serializable]
    public class OfferSaveData
    {
        public List<Offer> offers;
        public List<PlayerSegment> playerSegments;
        public List<ABTest> abTests;
    }
}