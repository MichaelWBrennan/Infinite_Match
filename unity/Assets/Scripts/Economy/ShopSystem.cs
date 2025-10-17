using System;
using System.Collections.Generic;
using UnityEngine;
using Evergreen.Core;
using RemoteConfig;

namespace Evergreen.Economy
{
    /// <summary>
    /// Shop system for purchasing items, boosters, and consumables
    /// Integrates with CurrencyManager and RewardSystem
    /// </summary>
    public class ShopSystem : MonoBehaviour
    {
        [Header("Shop Configuration")]
        [SerializeField] private ShopItem[] shopItems;
        [SerializeField] private bool enableDynamicPricing = true;
        [SerializeField] private bool enablePersonalizedOffers = true;
        [SerializeField] private bool enableLimitedTimeOffers = true;
        
        [Header("Categories")]
        [SerializeField] private ShopCategory[] categories;
        
        private Dictionary<string, ShopItem> _shopItems = new Dictionary<string, ShopItem>();
        private Dictionary<string, ShopCategory> _categories = new Dictionary<string, ShopCategory>();
        private Dictionary<string, PlayerPurchaseHistory> _purchaseHistory = new Dictionary<string, PlayerPurchaseHistory>();
        private Dictionary<string, LimitedTimeOffer> _limitedTimeOffers = new Dictionary<string, LimitedTimeOffer>();
        
        // Events
        public System.Action<ShopItem, string> OnItemPurchased; // item, playerId
        public System.Action<ShopItem> OnItemAdded;
        public System.Action<ShopItem> OnItemRemoved;
        public System.Action<LimitedTimeOffer> OnLimitedTimeOfferStarted;
        public System.Action<LimitedTimeOffer> OnLimitedTimeOfferEnded;
        
        public static ShopSystem Instance { get; private set; }
        
        [System.Serializable]
        public class ShopItem
        {
            public string id;
            public string name;
            public string description;
            public ShopItemType type;
            public ShopItemRarity rarity;
            public List<ShopItemCost> costs = new List<ShopItemCost>();
            public List<ShopItemReward> rewards = new List<ShopItemReward>();
            public ShopItemConditions conditions;
            public bool isAvailable = true;
            public bool isLimitedTime = false;
            public DateTime? availableUntil;
            public int maxPurchases = -1; // -1 = unlimited
            public int currentPurchases = 0;
            public string categoryId;
            public string iconPath;
            public string previewPath;
            public int displayOrder = 0;
            public bool isPopular = false;
            public bool isRecommended = false;
        }
        
        [System.Serializable]
        public class ShopItemCost
        {
            public string currencyId;
            public int amount;
            public bool isDiscounted = false;
            public int originalAmount;
            public float discountPercentage = 0f;
        }
        
        [System.Serializable]
        public class ShopItemReward
        {
            public string type; // "currency", "item", "booster", "decoration", "character"
            public string itemId;
            public int amount;
            public int rarity;
            public bool isBonus = false;
        }
        
        [System.Serializable]
        public class ShopItemConditions
        {
            public int minLevel = 1;
            public int maxLevel = int.MaxValue;
            public int minPurchaseCount = 0;
            public int maxPurchaseCount = int.MaxValue;
            public string[] requiredAchievements;
            public string[] requiredItems;
            public bool requireFirstTime = false;
            public bool requireVIP = false;
        }
        
        [System.Serializable]
        public class ShopCategory
        {
            public string id;
            public string name;
            public string description;
            public string iconPath;
            public int displayOrder = 0;
            public bool isActive = true;
        }
        
        [System.Serializable]
        public class LimitedTimeOffer
        {
            public string id;
            public string itemId;
            public float discountPercentage;
            public DateTime startTime;
            public DateTime endTime;
            public bool isActive = false;
            public int maxPurchases = -1;
            public int currentPurchases = 0;
        }
        
        [System.Serializable]
        public class PlayerPurchaseHistory
        {
            public string playerId;
            public Dictionary<string, int> itemPurchaseCounts = new Dictionary<string, int>();
            public Dictionary<string, DateTime> lastPurchaseTimes = new Dictionary<string, DateTime>();
            public float totalSpent = 0f;
            public DateTime lastPurchaseTime = DateTime.MinValue;
        }
        
        public enum ShopItemType
        {
            Currency,
            Booster,
            Decoration,
            Character,
            Consumable,
            Permanent,
            Subscription,
            Special
        }
        
        public enum ShopItemRarity
        {
            Common,
            Uncommon,
            Rare,
            Epic,
            Legendary
        }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeShopsystemSafe();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            LoadShopData();
            SetupDefaultItems();
            SetupDefaultCategories();
            StartCoroutine(UpdateShopsystemSafe());
        }
        
        private void InitializeShopsystemSafe()
        {
            Debug.Log("Shop System initialized");
        }
        
        private void SetupDefaultItems()
        {
            if (shopItems == null || shopItems.Length == 0)
            {
                shopItems = new ShopItem[]
                {
                    // TIER 1 - $0.99 - Entry Point (Highest Conversion)
                    new ShopItem
                    {
                        id = "starter_pack_99",
                        name = "Starter Pack",
                        description = "Perfect for new players! Great value!",
                        type = ShopItemType.Currency,
                        rarity = ShopItemRarity.Common,
                        costs = new List<ShopItemCost>
                        {
                            new ShopItemCost { currencyId = "gems", amount = 20, originalAmount = 20, isDiscounted = true, discountPercentage = 50f }
                        },
                        rewards = new List<ShopItemReward>
                        {
                            new ShopItemReward { type = "currency", itemId = "coins", amount = 1000 },
                            new ShopItemReward { type = "currency", itemId = "energy", amount = 5, isBonus = true }
                        },
                        conditions = new ShopItemConditions
                        {
                            minLevel = 1,
                            maxLevel = 10,
                            maxPurchaseCount = 1
                        },
                        isAvailable = true,
                        maxPurchases = 1,
                        categoryId = "starter",
                        displayOrder = 1,
                        isPopular = true,
                        isRecommended = true
                    },
                    
                    // TIER 2 - $4.99 - Sweet Spot (Best Revenue)
                    new ShopItem
                    {
                        id = "value_pack_499",
                        name = "Value Pack",
                        description = "Most popular choice! Amazing value!",
                        type = ShopItemType.Currency,
                        rarity = ShopItemRarity.Uncommon,
                        costs = new List<ShopItemCost>
                        {
                            new ShopItemCost { currencyId = "gems", amount = 120, originalAmount = 120 }
                        },
                        rewards = new List<ShopItemReward>
                        {
                            new ShopItemReward { type = "currency", itemId = "coins", amount = 5000 },
                            new ShopItemReward { type = "currency", itemId = "energy", amount = 10, isBonus = true },
                            new ShopItemReward { type = "booster", itemId = "extra_moves", amount = 3, isBonus = true }
                        },
                        conditions = new ShopItemConditions
                        {
                            minLevel = 3,
                            maxLevel = int.MaxValue
                        },
                        isAvailable = true,
                        maxPurchases = -1,
                        categoryId = "currency",
                        displayOrder = 2,
                        isPopular = true,
                        isRecommended = true
                    },
                    
                    // TIER 3 - $9.99 - High Value (Whale Conversion)
                    new ShopItem
                    {
                        id = "premium_pack_999",
                        name = "Premium Pack",
                        description = "For serious players! Maximum value!",
                        type = ShopItemType.Currency,
                        rarity = ShopItemRarity.Rare,
                        costs = new List<ShopItemCost>
                        {
                            new ShopItemCost { currencyId = "gems", amount = 300, originalAmount = 300 }
                        },
                        rewards = new List<ShopItemReward>
                        {
                            new ShopItemReward { type = "currency", itemId = "coins", amount = 15000 },
                            new ShopItemReward { type = "currency", itemId = "energy", amount = 20, isBonus = true },
                            new ShopItemReward { type = "booster", itemId = "extra_moves", amount = 5, isBonus = true },
                            new ShopItemReward { type = "booster", itemId = "color_bomb", amount = 2, isBonus = true }
                        },
                        conditions = new ShopItemConditions
                        {
                            minLevel = 5,
                            maxLevel = int.MaxValue
                        },
                        isAvailable = true,
                        maxPurchases = -1,
                        categoryId = "currency",
                        displayOrder = 3,
                        isPopular = true,
                        isRecommended = true
                    },
                    
                    // TIER 4 - $19.99 - Whale Tier (High Revenue)
                    new ShopItem
                    {
                        id = "mega_pack_1999",
                        name = "Mega Pack",
                        description = "Ultimate value for power players!",
                        type = ShopItemType.Currency,
                        rarity = ShopItemRarity.Epic,
                        costs = new List<ShopItemCost>
                        {
                            new ShopItemCost { currencyId = "gems", amount = 700, originalAmount = 700 }
                        },
                        rewards = new List<ShopItemReward>
                        {
                            new ShopItemReward { type = "currency", itemId = "coins", amount = 40000 },
                            new ShopItemReward { type = "currency", itemId = "energy", amount = 50, isBonus = true },
                            new ShopItemReward { type = "booster", itemId = "extra_moves", amount = 10, isBonus = true },
                            new ShopItemReward { type = "booster", itemId = "color_bomb", amount = 5, isBonus = true },
                            new ShopItemReward { type = "booster", itemId = "rainbow_blast", amount = 3, isBonus = true }
                        },
                        conditions = new ShopItemConditions
                        {
                            minLevel = 10,
                            maxLevel = int.MaxValue
                        },
                        isAvailable = true,
                        maxPurchases = -1,
                        categoryId = "currency",
                        displayOrder = 4,
                        isPopular = false,
                        isRecommended = true
                    },
                    
                    // ENERGY PACKS - High Frequency Purchases
                    new ShopItem
                    {
                        id = "energy_small",
                        name = "Energy Boost",
                        description = "Quick energy refill",
                        type = ShopItemType.Consumable,
                        rarity = ShopItemRarity.Common,
                        costs = new List<ShopItemCost>
                        {
                            new ShopItemCost { currencyId = "gems", amount = 5, originalAmount = 5 }
                        },
                        rewards = new List<ShopItemReward>
                        {
                            new ShopItemReward { type = "currency", itemId = "energy", amount = 5 }
                        },
                        conditions = new ShopItemConditions
                        {
                            minLevel = 1,
                            maxLevel = int.MaxValue
                        },
                        isAvailable = true,
                        maxPurchases = 20,
                        categoryId = "consumables",
                        displayOrder = 1
                    },
                    
                    new ShopItem
                    {
                        id = "energy_large",
                        name = "Energy Surge",
                        description = "Maximum energy boost!",
                        type = ShopItemType.Consumable,
                        rarity = ShopItemRarity.Uncommon,
                        costs = new List<ShopItemCost>
                        {
                            new ShopItemCost { currencyId = "gems", amount = 15, originalAmount = 15 }
                        },
                        rewards = new List<ShopItemReward>
                        {
                            new ShopItemReward { type = "currency", itemId = "energy", amount = 20 }
                        },
                        conditions = new ShopItemConditions
                        {
                            minLevel = 3,
                            maxLevel = int.MaxValue
                        },
                        isAvailable = true,
                        maxPurchases = 10,
                        categoryId = "consumables",
                        displayOrder = 2
                    },
                    
                    // BOOSTER PACKS - High Engagement
                    new ShopItem
                    {
                        id = "booster_pack_small",
                        name = "Booster Bundle",
                        description = "Essential boosters for success!",
                        type = ShopItemType.Booster,
                        rarity = ShopItemRarity.Uncommon,
                        costs = new List<ShopItemCost>
                        {
                            new ShopItemCost { currencyId = "coins", amount = 500, originalAmount = 500 }
                        },
                        rewards = new List<ShopItemReward>
                        {
                            new ShopItemReward { type = "booster", itemId = "extra_moves", amount = 5 },
                            new ShopItemReward { type = "booster", itemId = "color_bomb", amount = 2 },
                            new ShopItemReward { type = "booster", itemId = "striped_candy", amount = 3 }
                        },
                        conditions = new ShopItemConditions
                        {
                            minLevel = 2,
                            maxLevel = int.MaxValue
                        },
                        isAvailable = true,
                        maxPurchases = 10,
                        categoryId = "boosters",
                        displayOrder = 1
                    },
                    
                    new ShopItem
                    {
                        id = "booster_pack_large",
                        name = "Power Pack",
                        description = "Ultimate booster collection!",
                        type = ShopItemType.Booster,
                        rarity = ShopItemRarity.Rare,
                        costs = new List<ShopItemCost>
                        {
                            new ShopItemCost { currencyId = "gems", amount = 25, originalAmount = 25 }
                        },
                        rewards = new List<ShopItemReward>
                        {
                            new ShopItemReward { type = "booster", itemId = "extra_moves", amount = 10 },
                            new ShopItemReward { type = "booster", itemId = "color_bomb", amount = 5 },
                            new ShopItemReward { type = "booster", itemId = "rainbow_blast", amount = 3 },
                            new ShopItemReward { type = "booster", itemId = "striped_candy", amount = 5 }
                        },
                        conditions = new ShopItemConditions
                        {
                            minLevel = 5,
                            maxLevel = int.MaxValue
                        },
                        isAvailable = true,
                        maxPurchases = 5,
                        categoryId = "boosters",
                        displayOrder = 2
                    },
                    
                    // COMEBACK PACK - Retention
                    new ShopItem
                    {
                        id = "comeback_pack",
                        name = "Welcome Back!",
                        description = "We missed you! Special comeback offer!",
                        type = ShopItemType.Special,
                        rarity = ShopItemRarity.Epic,
                        costs = new List<ShopItemCost>
                        {
                            new ShopItemCost { currencyId = "gems", amount = 50, originalAmount = 100, isDiscounted = true, discountPercentage = 50f }
                        },
                        rewards = new List<ShopItemReward>
                        {
                            new ShopItemReward { type = "currency", itemId = "coins", amount = 8000 },
                            new ShopItemReward { type = "currency", itemId = "energy", amount = 15, isBonus = true },
                            new ShopItemReward { type = "booster", itemId = "extra_moves", amount = 8, isBonus = true },
                            new ShopItemReward { type = "booster", itemId = "color_bomb", amount = 3, isBonus = true }
                        },
                        conditions = new ShopItemConditions
                        {
                            minLevel = 1,
                            maxLevel = int.MaxValue,
                            maxPurchaseCount = 1
                        },
                        isAvailable = true,
                        maxPurchases = 1,
                        categoryId = "special",
                        displayOrder = 1,
                        isPopular = true,
                        isRecommended = true
                    },
                    
                    // FLASH SALE - Urgency
                    new ShopItem
                    {
                        id = "flash_sale_limited",
                        name = "Flash Sale!",
                        description = "Limited time! 75% off everything!",
                        type = ShopItemType.Special,
                        rarity = ShopItemRarity.Legendary,
                        costs = new List<ShopItemCost>
                        {
                            new ShopItemCost { currencyId = "gems", amount = 25, originalAmount = 100, isDiscounted = true, discountPercentage = 75f }
                        },
                        rewards = new List<ShopItemReward>
                        {
                            new ShopItemReward { type = "currency", itemId = "coins", amount = 10000 },
                            new ShopItemReward { type = "currency", itemId = "energy", amount = 25, isBonus = true },
                            new ShopItemReward { type = "booster", itemId = "extra_moves", amount = 15, isBonus = true },
                            new ShopItemReward { type = "booster", itemId = "color_bomb", amount = 8, isBonus = true },
                            new ShopItemReward { type = "booster", itemId = "rainbow_blast", amount = 5, isBonus = true }
                        },
                        conditions = new ShopItemConditions
                        {
                            minLevel = 1,
                            maxLevel = int.MaxValue,
                            maxPurchaseCount = 3
                        },
                        isAvailable = true,
                        maxPurchases = 3,
                        categoryId = "special",
                        displayOrder = 0,
                        isPopular = true,
                        isRecommended = true,
                        isLimitedTime = true,
                        availableUntil = DateTime.Now.AddHours(6)
                    }
                };
            }
            
            foreach (var item in shopItems)
            {
                _shopItems[item.id] = item;
            }
        }
        
        private void SetupDefaultCategories()
        {
            if (categories == null || categories.Length == 0)
            {
                categories = new ShopCategory[]
                {
                    new ShopCategory
                    {
                        id = "starter",
                        name = "Starter Packs",
                        description = "Perfect for new players",
                        displayOrder = 1,
                        isActive = true
                    },
                    new ShopCategory
                    {
                        id = "currency",
                        name = "Value Packs",
                        description = "Best value currency packs",
                        displayOrder = 2,
                        isActive = true
                    },
                    new ShopCategory
                    {
                        id = "boosters",
                        name = "Boosters",
                        description = "Power-ups for levels",
                        displayOrder = 3,
                        isActive = true
                    },
                    new ShopCategory
                    {
                        id = "consumables",
                        name = "Energy",
                        description = "Energy refills and boosts",
                        displayOrder = 4,
                        isActive = true
                    },
                    new ShopCategory
                    {
                        id = "special",
                        name = "Special Offers",
                        description = "Limited time deals",
                        displayOrder = 5,
                        isActive = true
                    }
                };
            }
            
            foreach (var category in categories)
            {
                _categories[category.id] = category;
            }
        }
        
        public bool PurchaseItem(string itemId, string playerId)
        {
            if (!_shopItems.ContainsKey(itemId)) return false;
            
            var item = _shopItems[itemId];
            var history = GetPlayerPurchaseHistory(playerId);
            
            // Check if item is available
            if (!IsItemAvailable(item, playerId, history)) return false;
            
            // Check if player can afford the item
            if (!CanAffordItem(item, playerId)) return false;
            
            // Process purchase
            if (!ProcessPurchase(item, playerId)) return false;
            
            // Award rewards
            AwardItemRewards(item, playerId);
            
            // Update purchase history
            UpdatePurchaseHistory(playerId, item);
            
            // Fire event
            OnItemPurchased?.Invoke(item, playerId);
            
            SaveShopData();
            return true;
        }
        
        public List<ShopItem> GetAvailableItems(string playerId)
        {
            var availableItems = new List<ShopItem>();
            var history = GetPlayerPurchaseHistory(playerId);
            
            foreach (var item in _shopItems.Values)
            {
                if (IsItemAvailable(item, playerId, history))
                {
                    availableItems.Add(item);
                }
            }
            
            // Sort by display order and popularity
            availableItems.Sort((a, b) => 
            {
                if (a.isRecommended != b.isRecommended)
                    return b.isRecommended.CompareTo(a.isRecommended);
                if (a.isPopular != b.isPopular)
                    return b.isPopular.CompareTo(a.isPopular);
                return a.displayOrder.CompareTo(b.displayOrder);
            });
            
            return availableItems;
        }
        
        public List<ShopItem> GetItemsByCategory(string categoryId, string playerId)
        {
            var items = new List<ShopItem>();
            var history = GetPlayerPurchaseHistory(playerId);
            
            foreach (var item in _shopItems.Values)
            {
                if (item.categoryId == categoryId && IsItemAvailable(item, playerId, history))
                {
                    items.Add(item);
                }
            }
            
            return items;
        }
        
        public List<ShopCategory> GetCategories()
        {
            var activeCategories = new List<ShopCategory>();
            
            foreach (var category in _categories.Values)
            {
                if (category.isActive)
                {
                    activeCategories.Add(category);
                }
            }
            
            activeCategories.Sort((a, b) => a.displayOrder.CompareTo(b.displayOrder));
            return activeCategories;
        }
        
        public ShopItem GetItem(string itemId)
        {
            return _shopItems.ContainsKey(itemId) ? _shopItems[itemId] : null;
        }
        
        public bool CanAffordItem(ShopItem item, string playerId)
        {
            var currencyManager = OptimizedCoreSystem.Instance.Resolve<CurrencyManager>();
            if (currencyManager == null) return false;
            
            foreach (var cost in item.costs)
            {
                if (!currencyManager.CanAfford(cost.currencyId, cost.amount))
                {
                    return false;
                }
            }
            
            return true;
        }
        
        private bool IsItemAvailable(ShopItem item, string playerId, PlayerPurchaseHistory history)
        {
            if (!item.isAvailable) return false;
            
            // Check level requirements
            var gameManager = OptimizedCoreSystem.Instance.Resolve<GameManager>();
            if (gameManager != null)
            {
                int playerLevel = gameManager.GetCurrency("level"); // Assuming level is stored as currency
                if (playerLevel < item.conditions.minLevel || playerLevel > item.conditions.maxLevel)
                    return false;
            }
            
            // Check purchase count limits
            if (item.maxPurchases > 0 && item.currentPurchases >= item.maxPurchases)
                return false;
            
            // Check player purchase limits
            if (history.itemPurchaseCounts.ContainsKey(item.id))
            {
                int playerPurchases = history.itemPurchaseCounts[item.id];
                if (playerPurchases >= item.conditions.maxPurchaseCount)
                    return false;
            }
            
            // Check limited time availability
            if (item.isLimitedTime && item.availableUntil.HasValue)
            {
                if (DateTime.Now > item.availableUntil.Value)
                    return false;
            }
            
            return true;
        }
        
        private bool ProcessPurchase(ShopItem item, string playerId)
        {
            var currencyManager = OptimizedCoreSystem.Instance.Resolve<CurrencyManager>();
            if (currencyManager == null) return false;
            
            // Spend currencies
            foreach (var cost in item.costs)
            {
                if (!currencyManager.SpendCurrency(cost.currencyId, cost.amount, $"shop_purchase_{item.id}"))
                {
                    return false;
                }
            }
            
            // Update item purchase count
            item.currentPurchases++;
            
            return true;
        }
        
        private void AwardItemRewards(ShopItem item, string playerId)
        {
            var currencyManager = OptimizedCoreSystem.Instance.Resolve<CurrencyManager>();
            if (currencyManager == null) return;
            
            foreach (var reward in item.rewards)
            {
                switch (reward.type)
                {
                    case "currency":
                        currencyManager.AddCurrency(reward.itemId, reward.amount, $"shop_purchase_{item.id}");
                        break;
                    case "booster":
                        // Award booster - this would integrate with your booster system
                        Debug.Log($"Awarded booster: {reward.itemId} x{reward.amount}");
                        break;
                    case "decoration":
                        // Award decoration - this would integrate with your decoration system
                        Debug.Log($"Awarded decoration: {reward.itemId}");
                        break;
                    case "character":
                        // Award character - this would integrate with your character system
                        Debug.Log($"Awarded character: {reward.itemId}");
                        break;
                }
            }
        }
        
        private void UpdatePurchaseHistory(string playerId, ShopItem item)
        {
            var history = GetPlayerPurchaseHistory(playerId);
            
            if (!history.itemPurchaseCounts.ContainsKey(item.id))
            {
                history.itemPurchaseCounts[item.id] = 0;
            }
            
            history.itemPurchaseCounts[item.id]++;
            history.lastPurchaseTimes[item.id] = DateTime.Now;
            history.lastPurchaseTime = DateTime.Now;
            
            // Calculate total spent
            foreach (var cost in item.costs)
            {
                history.totalSpent += cost.amount;
            }
        }
        
        private PlayerPurchaseHistory GetPlayerPurchaseHistory(string playerId)
        {
            if (!_purchaseHistory.ContainsKey(playerId))
            {
                _purchaseHistory[playerId] = new PlayerPurchaseHistory
                {
                    playerId = playerId,
                    itemPurchaseCounts = new Dictionary<string, int>(),
                    lastPurchaseTimes = new Dictionary<string, DateTime>(),
                    totalSpent = 0f,
                    lastPurchaseTime = DateTime.MinValue
                };
            }
            
            return _purchaseHistory[playerId];
        }
        
        public void AddLimitedTimeOffer(string itemId, float discountPercentage, int hours, int maxPurchases = -1)
        {
            if (!_shopItems.ContainsKey(itemId)) return;
            
            var offer = new LimitedTimeOffer
            {
                id = System.Guid.NewGuid().ToString(),
                itemId = itemId,
                discountPercentage = discountPercentage,
                startTime = DateTime.Now,
                endTime = DateTime.Now.AddHours(hours),
                isActive = true,
                maxPurchases = maxPurchases,
                currentPurchases = 0
            };
            
            _limitedTimeOffers[offer.id] = offer;
            
            // Apply discount to item
            var item = _shopItems[itemId];
            foreach (var cost in item.costs)
            {
                cost.isDiscounted = true;
                cost.originalAmount = cost.amount;
                cost.amount = Mathf.RoundToInt(cost.amount * (1f - discountPercentage / 100f));
                cost.discountPercentage = discountPercentage;
            }
            
            OnLimitedTimeOfferStarted?.Invoke(offer);
        }
        
        private System.Collections.IEnumerator UpdateShopsystemSafe()
        {
            while (true)
            {
                // Update limited time offers
                UpdateLimitedTimeOffers();
                
                // Update dynamic pricing
                if (enableDynamicPricing)
                {
                    UpdateDynamicPricing();
                }
                
                yield return new WaitForSeconds(60f); // Update every minute
            }
        }
        
        private void UpdateLimitedTimeOffers()
        {
            var expiredOffers = new List<string>();
            
            foreach (var offer in _limitedTimeOffers.Values)
            {
                if (offer.isActive && DateTime.Now > offer.endTime)
                {
                    // Restore original pricing
                    var item = _shopItems[offer.itemId];
                    foreach (var cost in item.costs)
                    {
                        cost.isDiscounted = false;
                        cost.amount = cost.originalAmount;
                        cost.discountPercentage = 0f;
                    }
                    
                    offer.isActive = false;
                    expiredOffers.Add(offer.id);
                    
                    OnLimitedTimeOfferEnded?.Invoke(offer);
                }
            }
            
            // Remove expired offers
            foreach (var offerId in expiredOffers)
            {
                _limitedTimeOffers.Remove(offerId);
            }
        }
        
        private void UpdateDynamicPricing()
        {
            // Apply starter offer discount and availability from Remote Config
            try
            {
                var rc = RemoteConfigManager.Instance;
                if (rc != null && _shopItems.ContainsKey("starter_pack_99"))
                {
                    var starterEnabled = rc.GetBool("starter_offer_enabled", true);
                    var starterDiscount = rc.GetFloat("starter_offer_discount", 0.5f);
                    var starterItem = _shopItems["starter_pack_99"];
                    starterItem.isAvailable = starterEnabled;
                    foreach (var cost in starterItem.costs)
                    {
                        cost.isDiscounted = starterDiscount > 0f;
                        cost.discountPercentage = Mathf.Clamp(starterDiscount * 100f, 0f, 95f);
                        cost.originalAmount = Mathf.Max(cost.originalAmount, cost.amount);
                        cost.amount = Mathf.RoundToInt(cost.originalAmount * (1f - starterDiscount));
                        if (cost.amount < 1) cost.amount = 1;
                    }
                }
            }
            catch { }
        }
        
        private void SaveShopData()
        {
            var saveData = new ShopSaveData
            {
                shopItems = new Dictionary<string, ShopItem>(_shopItems),
                purchaseHistory = new Dictionary<string, PlayerPurchaseHistory>(_purchaseHistory),
                limitedTimeOffers = new Dictionary<string, LimitedTimeOffer>(_limitedTimeOffers)
            };
            
            string json = JsonUtility.ToJson(saveData, true);
            System.IO.File.WriteAllText(Application.persistentDataPath + "/shop_data.json", json);
        }
        
        private void LoadShopData()
        {
            string path = Application.persistentDataPath + "/shop_data.json";
            if (System.IO.File.Exists(path))
            {
                try
                {
                    string json = System.IO.File.ReadAllText(path);
                    var saveData = JsonUtility.FromJson<ShopSaveData>(json);
                    
                    if (saveData.shopItems != null)
                    {
                        _shopItems = saveData.shopItems;
                    }
                    
                    if (saveData.purchaseHistory != null)
                    {
                        _purchaseHistory = saveData.purchaseHistory;
                    }
                    
                    if (saveData.limitedTimeOffers != null)
                    {
                        _limitedTimeOffers = saveData.limitedTimeOffers;
                    }
                }
                catch (Exception e)
                {
                    Debug.LogError($"Failed to load shop data: {e.Message}");
                }
            }
        }
        
        [System.Serializable]
        private class ShopSaveData
        {
            public Dictionary<string, ShopItem> shopItems;
            public Dictionary<string, PlayerPurchaseHistory> purchaseHistory;
            public Dictionary<string, LimitedTimeOffer> limitedTimeOffers;
        }
        
        void OnDestroy()
        {
            SaveShopData();
        }
    }
}