using System.Collections.Generic;
using UnityEngine;
using System;

namespace Evergreen.MetaGame
{
    [Serializable]
    public class Room
    {
        public int id;
        public string name;
        public string description;
        public bool isUnlocked;
        public int unlockLevel;
        public int coinsRequired;
        public int gemsRequired;
        public List<DecorationItem> decorations = new List<DecorationItem>();
        public Vector2Int gridSize = new Vector2Int(8, 8);
    }
    
    [Serializable]
    public class DecorationItem
    {
        public int id;
        public string name;
        public string category;
        public int cost;
        public string currency; // "coins" or "gems"
        public bool isPurchased;
        public bool isPlaced;
        public Vector2Int gridPosition;
        public int rotation; // 0, 90, 180, 270
        public string prefabPath;
        public Dictionary<string, object> properties = new Dictionary<string, object>();
    }
    
    [Serializable]
    public class DecorationCategory
    {
        public string name;
        public string icon;
        public List<DecorationItem> items = new List<DecorationItem>();
        public bool isUnlocked;
        public int unlockLevel;
    }
    
    public class DecorationSystem : MonoBehaviour
    {
        [Header("Rooms")]
        public List<Room> rooms = new List<Room>();
        
        [Header("Categories")]
        public List<DecorationCategory> categories = new List<DecorationCategory>();
        
        [Header("Progression")]
        public int currentRoom = 0;
        public int totalCoinsEarned = 0;
        public int totalGemsEarned = 0;
        
        public static DecorationSystem Instance { get; private set; }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeDefaultRooms();
                InitializeCategories();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            LoadProgress();
        }
        
        private void InitializeDefaultRooms()
        {
            rooms = new List<Room>
            {
                new Room
                {
                    id = 0,
                    name = "Living Room",
                    description = "Your cozy living space",
                    isUnlocked = true,
                    unlockLevel = 1,
                    coinsRequired = 0,
                    gemsRequired = 0
                },
                new Room
                {
                    id = 1,
                    name = "Kitchen",
                    description = "Cook up some magic",
                    isUnlocked = false,
                    unlockLevel = 25,
                    coinsRequired = 1000,
                    gemsRequired = 0
                },
                new Room
                {
                    id = 2,
                    name = "Bedroom",
                    description = "Your peaceful retreat",
                    isUnlocked = false,
                    unlockLevel = 50,
                    coinsRequired = 2500,
                    gemsRequired = 50
                },
                new Room
                {
                    id = 3,
                    name = "Garden",
                    description = "A magical outdoor space",
                    isUnlocked = false,
                    unlockLevel = 100,
                    coinsRequired = 5000,
                    gemsRequired = 100
                },
                new Room
                {
                    id = 4,
                    name = "Study",
                    description = "Your creative workspace",
                    isUnlocked = false,
                    unlockLevel = 150,
                    coinsRequired = 10000,
                    gemsRequired = 200
                }
            };
        }
        
        private void InitializeCategories()
        {
            categories = new List<DecorationCategory>
            {
                new DecorationCategory
                {
                    name = "Furniture",
                    icon = "furniture_icon",
                    isUnlocked = true,
                    unlockLevel = 1,
                    items = new List<DecorationItem>
                    {
                        new DecorationItem { id = 0, name = "Basic Sofa", category = "Furniture", cost = 100, currency = "coins", prefabPath = "Furniture/BasicSofa" },
                        new DecorationItem { id = 1, name = "Coffee Table", category = "Furniture", cost = 150, currency = "coins", prefabPath = "Furniture/CoffeeTable" },
                        new DecorationItem { id = 2, name = "Bookshelf", category = "Furniture", cost = 200, currency = "coins", prefabPath = "Furniture/Bookshelf" },
                        new DecorationItem { id = 3, name = "Luxury Sofa", category = "Furniture", cost = 500, currency = "coins", prefabPath = "Furniture/LuxurySofa" },
                        new DecorationItem { id = 4, name = "Golden Table", category = "Furniture", cost = 1000, currency = "gems", prefabPath = "Furniture/GoldenTable" }
                    }
                },
                new DecorationCategory
                {
                    name = "Decorations",
                    icon = "decor_icon",
                    isUnlocked = true,
                    unlockLevel = 1,
                    items = new List<DecorationItem>
                    {
                        new DecorationItem { id = 10, name = "Plant", category = "Decorations", cost = 50, currency = "coins", prefabPath = "Decorations/Plant" },
                        new DecorationItem { id = 11, name = "Lamp", category = "Decorations", cost = 75, currency = "coins", prefabPath = "Decorations/Lamp" },
                        new DecorationItem { id = 12, name = "Painting", category = "Decorations", cost = 100, currency = "coins", prefabPath = "Decorations/Painting" },
                        new DecorationItem { id = 13, name = "Crystal Vase", category = "Decorations", cost = 300, currency = "gems", prefabPath = "Decorations/CrystalVase" }
                    }
                },
                new DecorationCategory
                {
                    name = "Flooring",
                    icon = "floor_icon",
                    isUnlocked = false,
                    unlockLevel = 20,
                    items = new List<DecorationItem>
                    {
                        new DecorationItem { id = 20, name = "Wood Floor", category = "Flooring", cost = 200, currency = "coins", prefabPath = "Flooring/WoodFloor" },
                        new DecorationItem { id = 21, name = "Carpet", category = "Flooring", cost = 300, currency = "coins", prefabPath = "Flooring/Carpet" },
                        new DecorationItem { id = 22, name = "Marble Floor", category = "Flooring", cost = 500, currency = "gems", prefabPath = "Flooring/MarbleFloor" }
                    }
                },
                new DecorationCategory
                {
                    name = "Walls",
                    icon = "wall_icon",
                    isUnlocked = false,
                    unlockLevel = 30,
                    items = new List<DecorationItem>
                    {
                        new DecorationItem { id = 30, name = "Wallpaper", category = "Walls", cost = 150, currency = "coins", prefabPath = "Walls/Wallpaper" },
                        new DecorationItem { id = 31, name = "Brick Wall", category = "Walls", cost = 250, currency = "coins", prefabPath = "Walls/BrickWall" },
                        new DecorationItem { id = 32, name = "Gold Wall", category = "Walls", cost = 400, currency = "gems", prefabPath = "Walls/GoldWall" }
                    }
                }
            };
        }
        
        public bool CanUnlockRoom(int roomId)
        {
            var room = GetRoom(roomId);
            if (room == null || room.isUnlocked) return false;
            
            var gameState = FindObjectOfType<Evergreen.Game.GameState>();
            if (gameState == null) return false;
            
            return Evergreen.Game.GameState.CurrentLevel >= room.unlockLevel &&
                   Evergreen.Game.GameState.Coins >= room.coinsRequired &&
                   Evergreen.Game.GameState.Gems >= room.gemsRequired;
        }
        
        public bool UnlockRoom(int roomId)
        {
            if (!CanUnlockRoom(roomId)) return false;
            
            var room = GetRoom(roomId);
            room.isUnlocked = true;
            
            // Deduct costs
            Evergreen.Game.GameState.SpendCoins(room.coinsRequired);
            Evergreen.Game.GameState.SpendGems(room.gemsRequired);
            
            // Analytics
            Evergreen.Game.AnalyticsAdapter.CustomEvent("room_unlocked", new Dictionary<string, object>
            {
                {"room_id", roomId},
                {"room_name", room.name}
            });
            
            SaveProgress();
            return true;
        }
        
        public bool CanPurchaseDecoration(int itemId)
        {
            var item = GetDecorationItem(itemId);
            if (item == null || item.isPurchased) return false;
            
            var gameState = FindObjectOfType<Evergreen.Game.GameState>();
            if (gameState == null) return false;
            
            if (item.currency == "coins")
                return Evergreen.Game.GameState.Coins >= item.cost;
            else
                return Evergreen.Game.GameState.Gems >= item.cost;
        }
        
        public bool PurchaseDecoration(int itemId)
        {
            if (!CanPurchaseDecoration(itemId)) return false;
            
            var item = GetDecorationItem(itemId);
            item.isPurchased = true;
            
            // Deduct cost
            if (item.currency == "coins")
                Evergreen.Game.GameState.SpendCoins(item.cost);
            else
                Evergreen.Game.GameState.SpendGems(item.cost);
            
            // Analytics
            Evergreen.Game.AnalyticsAdapter.CustomEvent("decoration_purchased", new Dictionary<string, object>
            {
                {"item_id", itemId},
                {"item_name", item.name},
                {"cost", item.cost},
                {"currency", item.currency}
            });
            
            SaveProgress();
            return true;
        }
        
        public bool PlaceDecoration(int itemId, int roomId, Vector2Int position, int rotation = 0)
        {
            var item = GetDecorationItem(itemId);
            var room = GetRoom(roomId);
            
            if (item == null || room == null || !item.isPurchased) return false;
            
            // Check if position is valid
            if (!IsValidPosition(room, position, itemId)) return false;
            
            // Remove any existing decoration at this position
            RemoveDecorationAt(roomId, position);
            
            // Place the decoration
            item.isPlaced = true;
            item.gridPosition = position;
            item.rotation = rotation;
            
            // Analytics
            Evergreen.Game.AnalyticsAdapter.CustomEvent("decoration_placed", new Dictionary<string, object>
            {
                {"item_id", itemId},
                {"room_id", roomId},
                {"position", position}
            });
            
            SaveProgress();
            return true;
        }
        
        public bool RemoveDecorationAt(int roomId, Vector2Int position)
        {
            var room = GetRoom(roomId);
            if (room == null) return false;
            
            foreach (var item in room.decorations)
            {
                if (item.isPlaced && item.gridPosition == position)
                {
                    item.isPlaced = false;
                    item.gridPosition = Vector2Int.zero;
                    return true;
                }
            }
            return false;
        }
        
        private bool IsValidPosition(Room room, Vector2Int position, int itemId)
        {
            // Check bounds
            if (position.x < 0 || position.x >= room.gridSize.x ||
                position.y < 0 || position.y >= room.gridSize.y)
                return false;
            
            // Check if position is already occupied
            foreach (var item in room.decorations)
            {
                if (item.isPlaced && item.gridPosition == position)
                    return false;
            }
            
            return true;
        }
        
        public Room GetRoom(int roomId)
        {
            return rooms.Find(r => r.id == roomId);
        }
        
        public DecorationItem GetDecorationItem(int itemId)
        {
            foreach (var category in categories)
            {
                var item = category.items.Find(i => i.id == itemId);
                if (item != null) return item;
            }
            return null;
        }
        
        public List<DecorationItem> GetAvailableDecorations()
        {
            var available = new List<DecorationItem>();
            foreach (var category in categories)
            {
                if (category.isUnlocked)
                {
                    available.AddRange(category.items);
                }
            }
            return available;
        }
        
        public void EarnRewards(int coins, int gems)
        {
            totalCoinsEarned += coins;
            totalGemsEarned += gems;
            
            Evergreen.Game.GameState.AddCoins(coins);
            Evergreen.Game.GameState.AddGems(gems);
            
            SaveProgress();
        }
        
        private void LoadProgress()
        {
            // Load from PlayerPrefs or save file
            var saveData = PlayerPrefs.GetString("DecorationProgress", "");
            if (!string.IsNullOrEmpty(saveData))
            {
                // Parse and apply save data
                // This would be expanded with proper JSON serialization
            }
        }
        
        private void SaveProgress()
        {
            // Save to PlayerPrefs or save file
            // This would be expanded with proper JSON serialization
            PlayerPrefs.SetString("DecorationProgress", "saved");
        }
    }
}