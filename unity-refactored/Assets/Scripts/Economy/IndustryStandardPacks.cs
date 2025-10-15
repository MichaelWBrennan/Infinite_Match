using System;
using System.Collections.Generic;
using UnityEngine;

namespace Evergreen.Economy
{
    /// <summary>
    /// Industry-standard pack configurations based on proven monetization data
    /// From top-grossing mobile games and successful monetization strategies
    /// </summary>
    public static class IndustryStandardPacks
    {
        /// <summary>
        /// Get industry-standard pack configurations optimized for conversion and revenue
        /// Based on data from Candy Crush Saga, Clash of Clans, Pokemon GO, and other top games
        /// </summary>
        public static List<ShopItem> GetOptimizedPacks()
        {
            return new List<ShopItem>
            {
                // TIER 1 - $0.99 - Entry Point (15-20% conversion rate target)
                new ShopItem
                {
                    id = "starter_pack_99",
                    name = "Starter Pack",
                    description = "Perfect for new players! 50% off!",
                    type = ShopItemType.Currency,
                    rarity = ShopItemRarity.Common,
                    costs = new List<ShopItemCost>
                    {
                        new ShopItemCost 
                        { 
                            currencyId = "gems", 
                            amount = 20, 
                            originalAmount = 40, 
                            isDiscounted = true, 
                            discountPercentage = 50f 
                        }
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
                
                // TIER 2 - $4.99 - Sweet Spot (8-12% conversion rate target)
                new ShopItem
                {
                    id = "value_pack_499",
                    name = "Value Pack",
                    description = "Most popular! Amazing value!",
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
                
                // TIER 3 - $9.99 - High Value (5-8% conversion rate target)
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
                
                // TIER 4 - $19.99 - Whale Tier (2-5% conversion rate target)
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
                
                // TIER 5 - $49.99 - Ultra Whale (1-3% conversion rate target)
                new ShopItem
                {
                    id = "ultimate_pack_4999",
                    name = "Ultimate Pack",
                    description = "The ultimate collection!",
                    type = ShopItemType.Currency,
                    rarity = ShopItemRarity.Legendary,
                    costs = new List<ShopItemCost>
                    {
                        new ShopItemCost { currencyId = "gems", amount = 2000, originalAmount = 2000 }
                    },
                    rewards = new List<ShopItemReward>
                    {
                        new ShopItemReward { type = "currency", itemId = "coins", amount = 100000 },
                        new ShopItemReward { type = "currency", itemId = "energy", amount = 100, isBonus = true },
                        new ShopItemReward { type = "booster", itemId = "extra_moves", amount = 25, isBonus = true },
                        new ShopItemReward { type = "booster", itemId = "color_bomb", amount = 15, isBonus = true },
                        new ShopItemReward { type = "booster", itemId = "rainbow_blast", amount = 10, isBonus = true },
                        new ShopItemReward { type = "booster", itemId = "striped_candy", amount = 20, isBonus = true }
                    },
                    conditions = new ShopItemConditions
                    {
                        minLevel = 15,
                        maxLevel = int.MaxValue
                    },
                    isAvailable = true,
                    maxPurchases = -1,
                    categoryId = "currency",
                    displayOrder = 5,
                    isPopular = false,
                    isRecommended = false
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
                
                // COMEBACK PACK - Retention (50% discount)
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
                
                // FLASH SALE - Urgency (75% discount, limited time)
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
                },
                
                // WEEKLY PACK - Recurring Revenue
                new ShopItem
                {
                    id = "weekly_pack",
                    name = "Weekly Special",
                    description = "This week only! Amazing value!",
                    type = ShopItemType.Special,
                    rarity = ShopItemRarity.Rare,
                    costs = new List<ShopItemCost>
                    {
                        new ShopItemCost { currencyId = "gems", amount = 80, originalAmount = 80 }
                    },
                    rewards = new List<ShopItemReward>
                    {
                        new ShopItemReward { type = "currency", itemId = "coins", amount = 12000 },
                        new ShopItemReward { type = "currency", itemId = "energy", amount = 30, isBonus = true },
                        new ShopItemReward { type = "booster", itemId = "extra_moves", amount = 8, isBonus = true },
                        new ShopItemReward { type = "booster", itemId = "color_bomb", amount = 4, isBonus = true }
                    },
                    conditions = new ShopItemConditions
                    {
                        minLevel = 3,
                        maxLevel = int.MaxValue,
                        maxPurchaseCount = 1
                    },
                    isAvailable = true,
                    maxPurchases = 1,
                    categoryId = "special",
                    displayOrder = 2,
                    isPopular = true,
                    isRecommended = true,
                    isLimitedTime = true,
                    availableUntil = DateTime.Now.AddDays(7)
                }
            };
        }
        
        /// <summary>
        /// Get industry-standard pricing tiers based on successful mobile games
        /// </summary>
        public static Dictionary<string, PricingTier> GetPricingTiers()
        {
            return new Dictionary<string, PricingTier>
            {
                ["tier_1"] = new PricingTier
                {
                    id = "tier_1",
                    name = "Entry Point",
                    basePrice = 0.99f,
                    minPrice = 0.99f,
                    maxPrice = 0.99f,
                    type = PricingTierType.Basic,
                    applicableCurrencies = new string[] { "USD", "EUR", "GBP" },
                    targetConversionRate = 0.15f,
                    description = "Lowest barrier to entry, highest conversion"
                },
                
                ["tier_2"] = new PricingTier
                {
                    id = "tier_2",
                    name = "Sweet Spot",
                    basePrice = 4.99f,
                    minPrice = 4.99f,
                    maxPrice = 4.99f,
                    type = PricingTierType.Standard,
                    applicableCurrencies = new string[] { "USD", "EUR", "GBP" },
                    targetConversionRate = 0.08f,
                    description = "Best revenue per user, optimal value perception"
                },
                
                ["tier_3"] = new PricingTier
                {
                    id = "tier_3",
                    name = "High Value",
                    basePrice = 9.99f,
                    minPrice = 9.99f,
                    maxPrice = 9.99f,
                    type = PricingTierType.Premium,
                    applicableCurrencies = new string[] { "USD", "EUR", "GBP" },
                    targetConversionRate = 0.05f,
                    description = "Premium tier for engaged players"
                },
                
                ["tier_4"] = new PricingTier
                {
                    id = "tier_4",
                    name = "Whale Tier",
                    basePrice = 19.99f,
                    minPrice = 19.99f,
                    maxPrice = 19.99f,
                    type = PricingTierType.Luxury,
                    applicableCurrencies = new string[] { "USD", "EUR", "GBP" },
                    targetConversionRate = 0.02f,
                    description = "High-value packs for whales"
                },
                
                ["tier_5"] = new PricingTier
                {
                    id = "tier_5",
                    name = "Ultra Whale",
                    basePrice = 49.99f,
                    minPrice = 49.99f,
                    maxPrice = 49.99f,
                    type = PricingTierType.Luxury,
                    applicableCurrencies = new string[] { "USD", "EUR", "GBP" },
                    targetConversionRate = 0.01f,
                    description = "Ultimate packs for top spenders"
                }
            };
        }
        
        /// <summary>
        /// Get proven discount strategies that increase conversion
        /// </summary>
        public static Dictionary<string, DiscountStrategy> GetDiscountStrategies()
        {
            return new Dictionary<string, DiscountStrategy>
            {
                ["starter_discount"] = new DiscountStrategy
                {
                    id = "starter_discount",
                    name = "Starter Discount",
                    discountPercentage = 50f,
                    targetAudience = "new_players",
                    duration = 7, // days
                    maxUses = 1,
                    description = "50% off for new players to reduce barrier to entry"
                },
                
                ["comeback_discount"] = new DiscountStrategy
                {
                    id = "comeback_discount",
                    name = "Comeback Discount",
                    discountPercentage = 50f,
                    targetAudience = "returning_players",
                    duration = 3, // days
                    maxUses = 1,
                    description = "50% off for returning players to re-engage"
                },
                
                ["flash_sale"] = new DiscountStrategy
                {
                    id = "flash_sale",
                    name = "Flash Sale",
                    discountPercentage = 75f,
                    targetAudience = "all_players",
                    duration = 6, // hours
                    maxUses = 3,
                    description = "75% off limited time offer to create urgency"
                },
                
                ["weekly_special"] = new DiscountStrategy
                {
                    id = "weekly_special",
                    name = "Weekly Special",
                    discountPercentage = 30f,
                    targetAudience = "regular_players",
                    duration = 7, // days
                    maxUses = 1,
                    description = "30% off weekly rotating special"
                }
            };
        }
        
        [System.Serializable]
        public class PricingTier
        {
            public string id;
            public string name;
            public float basePrice;
            public float minPrice;
            public float maxPrice;
            public PricingTierType type;
            public string[] applicableCurrencies;
            public float targetConversionRate;
            public string description;
        }
        
        [System.Serializable]
        public class DiscountStrategy
        {
            public string id;
            public string name;
            public float discountPercentage;
            public string targetAudience;
            public int duration; // in hours or days
            public int maxUses;
            public string description;
        }
        
        public enum PricingTierType
        {
            Basic,
            Standard,
            Premium,
            Luxury,
            Custom
        }
    }
}