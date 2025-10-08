using System.Collections.Generic;
using UnityEngine;
using Evergreen.Core;
using Evergreen.Data;

namespace Evergreen.MetaGame
{
    [System.Serializable]
    public class Room
    {
        public string id;
        public string name;
        public string description;
        public bool isUnlocked;
        public int unlockLevel;
        public Vector2 position;
        public List<Decoration> decorations = new List<Decoration>();
        public List<Task> tasks = new List<Task>();
        public float completionPercentage;
        public bool isCompleted;
    }

    [System.Serializable]
    public class Decoration
    {
        public string id;
        public string name;
        public string description;
        public int cost;
        public string currencyType; // "coins" or "gems"
        public bool isPurchased;
        public bool isPlaced;
        public Vector2 position;
        public string prefabPath;
        public string category; // "furniture", "wall", "floor", "ceiling", "special"
        public int rarity; // 1-5 stars
    }

    [System.Serializable]
    public class Task
    {
        public string id;
        public string description;
        public TaskType type;
        public int targetValue;
        public int currentValue;
        public bool isCompleted;
        public Reward reward;
        public int priority; // Higher = more important
    }

    [System.Serializable]
    public class Reward
    {
        public string type; // "coins", "gems", "decoration", "energy"
        public int amount;
        public string itemId;
    }

    public enum TaskType
    {
        ClearLevels,
        CollectCoins,
        CollectGems,
        PurchaseDecorations,
        CompleteRooms,
        UseSpecialPieces,
        CreateCombos,
        WinStreak
    }

    public class CastleRenovationSystem : MonoBehaviour
    {
        [Header("Castle Settings")]
        public List<Room> rooms = new List<Room>();
        public int currentRoomIndex = 0;
        public int totalCoinsEarned = 0;
        public int totalGemsEarned = 0;
        
        [Header("Progression")]
        public int levelsCleared = 0;
        public int currentStreak = 0;
        public int bestStreak = 0;
        public int specialPiecesUsed = 0;
        public int combosCreated = 0;
        
        [Header("UI References")]
        public GameObject castleViewPrefab;
        public GameObject roomDetailPrefab;
        public GameObject decorationShopPrefab;
        
        private Dictionary<string, Room> _roomLookup = new Dictionary<string, Room>();
        private Dictionary<string, Decoration> _decorationLookup = new Dictionary<string, Decoration>();
        private List<Task> _activeTasks = new List<Task>();
        private Dictionary<string, int> _taskProgress = new Dictionary<string, int>();
        
        // Events
        public System.Action<Room> OnRoomUnlocked;
        public System.Action<Room> OnRoomCompleted;
        public System.Action<Decoration> OnDecorationPurchased;
        public System.Action<Task> OnTaskCompleted;
        public System.Action<Reward> OnRewardEarned;
        
        public static CastleRenovationSystem Instance { get; private set; }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializesystemSafe();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            LoadProgress();
            UpdateAllTasks();
            CheckRoomUnlocks();
        }
        
        private void InitializesystemSafe()
        {
            CreateDefaultRooms();
            CreateDefaultDecorations();
            CreateDefaultTasks();
            BuildLookupTables();
        }
        
        private void CreateDefaultRooms()
        {
            rooms.Clear();
            
            // Throne Room - Starting room
            var throneRoom = new Room
            {
                id = "throne_room",
                name = "Throne Room",
                description = "The heart of your kingdom",
                isUnlocked = true,
                unlockLevel = 1,
                position = new Vector2(0, 0),
                tasks = new List<Task>()
            };
            rooms.Add(throneRoom);
            
            // Royal Bedroom - Unlock at level 10
            var bedroom = new Room
            {
                id = "royal_bedroom",
                name = "Royal Bedroom",
                description = "A luxurious sleeping chamber",
                isUnlocked = false,
                unlockLevel = 10,
                position = new Vector2(2, 0),
                tasks = new List<Task>()
            };
            rooms.Add(bedroom);
            
            // Royal Kitchen - Unlock at level 25
            var kitchen = new Room
            {
                id = "royal_kitchen",
                name = "Royal Kitchen",
                description = "Where the finest meals are prepared",
                isUnlocked = false,
                unlockLevel = 25,
                position = new Vector2(0, 2),
                tasks = new List<Task>()
            };
            rooms.Add(kitchen);
            
            // Royal Garden - Unlock at level 50
            var garden = new Room
            {
                id = "royal_garden",
                name = "Royal Garden",
                description = "A beautiful outdoor sanctuary",
                isUnlocked = false,
                unlockLevel = 50,
                position = new Vector2(-2, 0),
                tasks = new List<Task>()
            };
            rooms.Add(garden);
            
            // Royal Library - Unlock at level 75
            var library = new Room
            {
                id = "royal_library",
                name = "Royal Library",
                description = "A vast collection of knowledge",
                isUnlocked = false,
                unlockLevel = 75,
                position = new Vector2(0, -2),
                tasks = new List<Task>()
            };
            rooms.Add(library);
        }
        
        private void CreateDefaultDecorations()
        {
            // Throne Room Decorations
            var throne = new Decoration
            {
                id = "golden_throne",
                name = "Golden Throne",
                description = "A magnificent golden throne",
                cost = 1000,
                currencyType = "coins",
                category = "furniture",
                rarity = 5,
                prefabPath = "Decorations/ThroneRoom/GoldenThrone"
            };
            
            var royalCarpet = new Decoration
            {
                id = "royal_carpet",
                name = "Royal Carpet",
                description = "A luxurious red carpet",
                cost = 500,
                currencyType = "coins",
                category = "floor",
                rarity = 3,
                prefabPath = "Decorations/ThroneRoom/RoyalCarpet"
            };
            
            var crown = new Decoration
            {
                id = "royal_crown",
                name = "Royal Crown",
                description = "The crown of the kingdom",
                cost = 2000,
                currencyType = "gems",
                category = "special",
                rarity = 5,
                prefabPath = "Decorations/ThroneRoom/RoyalCrown"
            };
            
            // Add decorations to throne room
            rooms[0].decorations.AddRange(new[] { throne, royalCarpet, crown });
        }
        
        private void CreateDefaultTasks()
        {
            // Throne Room Tasks
            var clearLevelsTask = new Task
            {
                id = "clear_10_levels",
                description = "Clear 10 levels to prove your worth",
                type = TaskType.ClearLevels,
                targetValue = 10,
                currentValue = 0,
                reward = new Reward { type = "coins", amount = 500 },
                priority = 1
            };
            
            var collectCoinsTask = new Task
            {
                id = "collect_1000_coins",
                description = "Collect 1000 coins for the royal treasury",
                type = TaskType.CollectCoins,
                targetValue = 1000,
                currentValue = 0,
                reward = new Reward { type = "gems", amount = 50 },
                priority = 2
            };
            
            var purchaseThroneTask = new Task
            {
                id = "purchase_golden_throne",
                description = "Purchase the Golden Throne to rule in style",
                type = TaskType.PurchaseDecorations,
                targetValue = 1,
                currentValue = 0,
                reward = new Reward { type = "decoration", itemId = "royal_crown" },
                priority = 3
            };
            
            rooms[0].tasks.AddRange(new[] { clearLevelsTask, collectCoinsTask, purchaseThroneTask });
        }
        
        private void BuildLookupTables()
        {
            _roomLookup.Clear();
            _decorationLookup.Clear();
            
            foreach (var room in rooms)
            {
                _roomLookup[room.id] = room;
                foreach (var decoration in room.decorations)
                {
                    _decorationLookup[decoration.id] = decoration;
                }
            }
        }
        
        public void OnLevelCompleted(int levelNumber, int score, int movesUsed)
        {
            levelsCleared++;
            currentStreak++;
            if (currentStreak > bestStreak) bestStreak = currentStreak;
            
            // Award coins based on performance
            int coinsEarned = CalculateCoinsEarned(score, movesUsed);
            totalCoinsEarned += coinsEarned;
            
            // Award gems for perfect performance
            if (movesUsed <= 5) // Perfect clear
            {
                int gemsEarned = 5;
                totalGemsEarned += gemsEarned;
                ServiceLocator.Get<GameManager>()?.AddCurrency("gems", gemsEarned);
            }
            
            ServiceLocator.Get<GameManager>()?.AddCurrency("coins", coinsEarned);
            
            UpdateAllTasks();
            CheckRoomUnlocks();
            SaveProgress();
        }
        
        public void OnLevelFailed()
        {
            currentStreak = 0;
            SaveProgress();
        }
        
        public void OnSpecialPieceUsed(string pieceType)
        {
            specialPiecesUsed++;
            UpdateAllTasks();
        }
        
        public void OnComboCreated(int comboSize)
        {
            combosCreated += comboSize;
            UpdateAllTasks();
        }
        
        private int CalculateCoinsEarned(int score, int movesUsed)
        {
            int baseCoins = Mathf.FloorToInt(score / 100f);
            int efficiencyBonus = Mathf.Max(0, 20 - movesUsed) * 10;
            int streakBonus = currentStreak * 5;
            
            return baseCoins + efficiencyBonus + streakBonus;
        }
        
        private void UpdateAllTasks()
        {
            foreach (var room in rooms)
            {
                foreach (var task in room.tasks)
                {
                    if (task.isCompleted) continue;
                    
                    int newValue = GetTaskProgress(task);
                    if (newValue != task.currentValue)
                    {
                        task.currentValue = newValue;
                        if (task.currentValue >= task.targetValue)
                        {
                            CompleteTask(task);
                        }
                    }
                }
            }
        }
        
        private int GetTaskProgress(Task task)
        {
            switch (task.type)
            {
                case TaskType.ClearLevels:
                    return levelsCleared;
                case TaskType.CollectCoins:
                    return totalCoinsEarned;
                case TaskType.CollectGems:
                    return totalGemsEarned;
                case TaskType.PurchaseDecorations:
                    return GetPurchasedDecorationsCount();
                case TaskType.CompleteRooms:
                    return GetCompletedRoomsCount();
                case TaskType.UseSpecialPieces:
                    return specialPiecesUsed;
                case TaskType.CreateCombos:
                    return combosCreated;
                case TaskType.WinStreak:
                    return bestStreak;
                default:
                    return 0;
            }
        }
        
        private int GetPurchasedDecorationsCount()
        {
            int count = 0;
            foreach (var room in rooms)
            {
                foreach (var decoration in room.decorations)
                {
                    if (decoration.isPurchased) count++;
                }
            }
            return count;
        }
        
        private int GetCompletedRoomsCount()
        {
            int count = 0;
            foreach (var room in rooms)
            {
                if (room.isCompleted) count++;
            }
            return count;
        }
        
        private void CompleteTask(Task task)
        {
            task.isCompleted = true;
            task.currentValue = task.targetValue;
            
            // Award reward
            AwardReward(task.reward);
            
            // Update room completion
            UpdateRoomCompletion(GetRoomForTask(task));
            
            OnTaskCompleted?.Invoke(task);
            OnRewardEarned?.Invoke(task.reward);
            
            SaveProgress();
        }
        
        private Room GetRoomForTask(Task task)
        {
            foreach (var room in rooms)
            {
                if (room.tasks.Contains(task))
                    return room;
            }
            return null;
        }
        
        private void AwardReward(Reward reward)
        {
            switch (reward.type)
            {
                case "coins":
                    ServiceLocator.Get<GameManager>()?.AddCurrency("coins", reward.amount);
                    totalCoinsEarned += reward.amount;
                    break;
                case "gems":
                    ServiceLocator.Get<GameManager>()?.AddCurrency("gems", reward.amount);
                    totalGemsEarned += reward.amount;
                    break;
                case "decoration":
                    if (_decorationLookup.ContainsKey(reward.itemId))
                    {
                        _decorationLookup[reward.itemId].isPurchased = true;
                        OnDecorationPurchased?.Invoke(_decorationLookup[reward.itemId]);
                    }
                    break;
                case "energy":
                    // Add energy system integration here
                    break;
            }
        }
        
        private void UpdateRoomCompletion(Room room)
        {
            if (room == null) return;
            
            int completedTasks = 0;
            foreach (var task in room.tasks)
            {
                if (task.isCompleted) completedTasks++;
            }
            
            room.completionPercentage = (float)completedTasks / room.tasks.Count;
            room.isCompleted = room.completionPercentage >= 1.0f;
            
            if (room.isCompleted)
            {
                OnRoomCompleted?.Invoke(room);
            }
        }
        
        private void CheckRoomUnlocks()
        {
            foreach (var room in rooms)
            {
                if (!room.isUnlocked && levelsCleared >= room.unlockLevel)
                {
                    room.isUnlocked = true;
                    OnRoomUnlocked?.Invoke(room);
                }
            }
        }
        
        public bool PurchaseDecoration(string decorationId)
        {
            if (!_decorationLookup.ContainsKey(decorationId))
                return false;
                
            var decoration = _decorationLookup[decorationId];
            if (decoration.isPurchased)
                return false;
                
            var gameManager = ServiceLocator.Get<GameManager>();
            if (gameManager == null)
                return false;
                
            int currentAmount = gameManager.GetCurrency(decoration.currencyType);
            if (currentAmount < decoration.cost)
                return false;
                
            gameManager.SpendCurrency(decoration.currencyType, decoration.cost);
            decoration.isPurchased = true;
            
            OnDecorationPurchased?.Invoke(decoration);
            UpdateAllTasks();
            SaveProgress();
            
            return true;
        }
        
        public List<Room> GetUnlockedRooms()
        {
            return rooms.FindAll(r => r.isUnlocked);
        }
        
        public List<Decoration> GetAvailableDecorations(string roomId)
        {
            var room = _roomLookup.ContainsKey(roomId) ? _roomLookup[roomId] : null;
            if (room == null) return new List<Decoration>();
            
            return room.decorations.FindAll(d => !d.isPurchased);
        }
        
        public List<Task> GetActiveTasks()
        {
            var activeTasks = new List<Task>();
            foreach (var room in rooms)
            {
                foreach (var task in room.tasks)
                {
                    if (!task.isCompleted)
                        activeTasks.Add(task);
                }
            }
            return activeTasks;
        }
        
        private void SaveProgress()
        {
            var saveData = new CastleSaveData
            {
                levelsCleared = levelsCleared,
                currentStreak = currentStreak,
                bestStreak = bestStreak,
                totalCoinsEarned = totalCoinsEarned,
                totalGemsEarned = totalGemsEarned,
                specialPiecesUsed = specialPiecesUsed,
                combosCreated = combosCreated,
                rooms = rooms,
                currentRoomIndex = currentRoomIndex
            };
            
            string json = JsonUtility.ToJson(saveData, true);
            System.IO.File.WriteAllText(Application.persistentDataPath + "/castle_progress.json", json);
        }
        
        private void LoadProgress()
        {
            string path = Application.persistentDataPath + "/castle_progress.json";
            if (System.IO.File.Exists(path))
            {
                string json = System.IO.File.ReadAllText(path);
                var saveData = JsonUtility.FromJson<CastleSaveData>(json);
                
                levelsCleared = saveData.levelsCleared;
                currentStreak = saveData.currentStreak;
                bestStreak = saveData.bestStreak;
                totalCoinsEarned = saveData.totalCoinsEarned;
                totalGemsEarned = saveData.totalGemsEarned;
                specialPiecesUsed = saveData.specialPiecesUsed;
                combosCreated = saveData.combosCreated;
                currentRoomIndex = saveData.currentRoomIndex;
                
                // Merge loaded room data with default rooms
                foreach (var savedRoom in saveData.rooms)
                {
                    if (_roomLookup.ContainsKey(savedRoom.id))
                    {
                        var room = _roomLookup[savedRoom.id];
                        room.isUnlocked = savedRoom.isUnlocked;
                        room.completionPercentage = savedRoom.completionPercentage;
                        room.isCompleted = savedRoom.isCompleted;
                        
                        // Update decorations
                        foreach (var savedDecoration in savedRoom.decorations)
                        {
                            if (_decorationLookup.ContainsKey(savedDecoration.id))
                            {
                                var decoration = _decorationLookup[savedDecoration.id];
                                decoration.isPurchased = savedDecoration.isPurchased;
                                decoration.isPlaced = savedDecoration.isPlaced;
                            }
                        }
                        
                        // Update tasks
                        foreach (var savedTask in savedRoom.tasks)
                        {
                            var task = room.tasks.Find(t => t.id == savedTask.id);
                            if (task != null)
                            {
                                task.currentValue = savedTask.currentValue;
                                task.isCompleted = savedTask.isCompleted;
                            }
                        }
                    }
                }
            }
        }
    }
    
    [System.Serializable]
    public class CastleSaveData
    {
        public int levelsCleared;
        public int currentStreak;
        public int bestStreak;
        public int totalCoinsEarned;
        public int totalGemsEarned;
        public int specialPiecesUsed;
        public int combosCreated;
        public List<Room> rooms;
        public int currentRoomIndex;
    }
}