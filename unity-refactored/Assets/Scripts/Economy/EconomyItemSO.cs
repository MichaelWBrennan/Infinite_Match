using UnityEngine;

namespace Evergreen.Economy
{
    /// <summary>
    /// ScriptableObject for economy items generated from CSV data
    /// </summary>
    [CreateAssetMenu(fileName = "EconomyItem", menuName = "Economy/Economy Item")]
    public class EconomyItemSO : ScriptableObject
    {
        [Header("Basic Information")]
        public string itemId;
        public string itemType;
        public string itemName;
        public string description;
        public string rarity;
        public string category;
        
        [Header("Pricing")]
        public int costGems;
        public int costCoins;
        public int quantity;
        
        [Header("Properties")]
        public bool isPurchasable;
        public bool isConsumable;
        public bool isTradeable;
        
        [Header("Visual")]
        public string iconPath;
        public Sprite icon;
        
        [Header("Metadata")]
        public string lastUpdated;
        public string version;
        
        /// <summary>
        /// Initialize the ScriptableObject with CSV data
        /// </summary>
        public void Initialize(EconomyCSVParser.EconomyItemData data)
        {
            itemId = data.id;
            itemType = data.type;
            itemName = data.name;
            description = data.description;
            rarity = data.rarity;
            category = data.category;
            costGems = data.costGems;
            costCoins = data.costCoins;
            quantity = data.quantity;
            isPurchasable = data.isPurchasable;
            isConsumable = data.isConsumable;
            isTradeable = data.isTradeable;
            iconPath = data.iconPath;
            lastUpdated = System.DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
            version = Application.version;
            
            // Load icon if path is provided
            if (!string.IsNullOrEmpty(iconPath))
            {
                icon = Resources.Load<Sprite>(iconPath);
            }
        }
        
        /// <summary>
        /// Get the total cost in gems (including exchange rate)
        /// </summary>
        public int GetTotalCostInGems()
        {
            // Assuming 100 coins = 1 gem exchange rate
            int coinCostInGems = Mathf.CeilToInt(costCoins / 100f);
            return costGems + coinCostInGems;
        }
        
        /// <summary>
        /// Check if item can be purchased with given resources
        /// </summary>
        public bool CanAfford(int availableGems, int availableCoins)
        {
            return availableGems >= costGems && availableCoins >= costCoins;
        }
        
        /// <summary>
        /// Get display price string
        /// </summary>
        public string GetDisplayPrice()
        {
            if (costGems > 0 && costCoins > 0)
            {
                return $"{costGems} Gems + {costCoins} Coins";
            }
            else if (costGems > 0)
            {
                return $"{costGems} Gems";
            }
            else if (costCoins > 0)
            {
                return $"{costCoins} Coins";
            }
            else
            {
                return "Free";
            }
        }
        
        /// <summary>
        /// Get rarity color
        /// </summary>
        public Color GetRarityColor()
        {
            switch (rarity.ToLower())
            {
                case "common":
                    return Color.white;
                case "uncommon":
                    return Color.green;
                case "rare":
                    return Color.blue;
                case "epic":
                    return Color.magenta;
                case "legendary":
                    return Color.yellow;
                default:
                    return Color.white;
            }
        }
        
        /// <summary>
        /// Check if item is a currency
        /// </summary>
        public bool IsCurrency()
        {
            return itemType == "currency";
        }
        
        /// <summary>
        /// Check if item is a booster
        /// </summary>
        public bool IsBooster()
        {
            return itemType == "booster";
        }
        
        /// <summary>
        /// Check if item is a pack
        /// </summary>
        public bool IsPack()
        {
            return itemType == "pack";
        }
        
        /// <summary>
        /// Get formatted description with quantity
        /// </summary>
        public string GetFormattedDescription()
        {
            if (quantity > 1)
            {
                return $"{description} (x{quantity})";
            }
            return description;
        }
        
        /// <summary>
        /// Validate the item data
        /// </summary>
        public bool IsValid()
        {
            return !string.IsNullOrEmpty(itemId) && 
                   !string.IsNullOrEmpty(itemName) && 
                   !string.IsNullOrEmpty(itemType) &&
                   quantity > 0;
        }
        
        void OnValidate()
        {
            // Ensure itemId is set from name if not set
            if (string.IsNullOrEmpty(itemId) && !string.IsNullOrEmpty(itemName))
            {
                itemId = itemName.ToLower().Replace(" ", "_");
            }
        }
    }
}