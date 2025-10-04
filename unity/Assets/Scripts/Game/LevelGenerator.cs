using System.Collections.Generic;
using UnityEngine;
using System.IO;
using System.Linq;

namespace Evergreen.Match3
{
    public static class LevelGenerator
    {
        private static System.Random _rng = new System.Random();
        
        public static void GenerateLevels(int startId, int count)
        {
            for (int i = 0; i < count; i++)
            {
                var levelId = startId + i;
                var level = GenerateLevel(levelId);
                SaveLevel(levelId, level);
            }
        }
        
        private static Dictionary<string, object> GenerateLevel(int id)
        {
            // Progressive difficulty curve
            var difficulty = Mathf.Clamp01((id - 1) / 1000f);
            
            // Board size increases with difficulty
            var size = GetBoardSize(difficulty);
            var numColors = GetNumColors(difficulty);
            var moveLimit = GetMoveLimit(difficulty);
            
            // Generate goals based on difficulty
            var goals = GenerateGoals(difficulty, size);
            
            // Add blockers based on difficulty
            var blockers = GenerateBlockers(difficulty, size);
            
            // Score stars scale with difficulty
            var baseScore = 500 + (id * 50);
            var scoreStars = new[] { baseScore, baseScore * 2, baseScore * 3 };
            
            var level = new Dictionary<string, object>
            {
                {"id", id},
                {"size", new[] {size.x, size.y}},
                {"num_colors", numColors},
                {"move_limit", moveLimit},
                {"goals", goals},
                {"score_stars", scoreStars}
            };
            
            // Merge blockers into level config
            foreach (var blocker in blockers)
            {
                level[blocker.Key] = blocker.Value;
            }
            
            return level;
        }
        
        private static Vector2Int GetBoardSize(float difficulty)
        {
            if (difficulty < 0.2f) return new Vector2Int(6, 6);
            if (difficulty < 0.4f) return new Vector2Int(7, 7);
            if (difficulty < 0.6f) return new Vector2Int(8, 8);
            if (difficulty < 0.8f) return new Vector2Int(9, 9);
            return new Vector2Int(10, 10);
        }
        
        private static int GetNumColors(float difficulty)
        {
            if (difficulty < 0.3f) return 4;
            if (difficulty < 0.6f) return 5;
            if (difficulty < 0.8f) return 6;
            return 7;
        }
        
        private static int GetMoveLimit(float difficulty)
        {
            var baseMoves = 15 + (int)(difficulty * 20);
            return Mathf.Clamp(baseMoves, 10, 35);
        }
        
        private static List<Dictionary<string, object>> GenerateGoals(float difficulty, Vector2Int size)
        {
            var goals = new List<Dictionary<string, object>>();
            var totalCells = size.x * size.y;
            
            // Color collection goals (most common)
            var numColorGoals = Random.Range(1, 4);
            for (int i = 0; i < numColorGoals; i++)
            {
                var color = Random.Range(0, 6);
                var amount = Mathf.RoundToInt(totalCells * Random.Range(0.3f, 0.8f));
                goals.Add(new Dictionary<string, object>
                {
                    {"type", "collect_color"},
                    {"color", color},
                    {"amount", amount}
                });
            }
            
            // Jelly goals (moderate difficulty)
            if (difficulty > 0.2f && Random.value < 0.6f)
            {
                var jellyCount = Mathf.RoundToInt(totalCells * Random.Range(0.1f, 0.4f));
                goals.Add(new Dictionary<string, object>
                {
                    {"type", "clear_jelly"},
                    {"amount", jellyCount}
                });
            }
            
            // Ingredient goals (high difficulty)
            if (difficulty > 0.5f && Random.value < 0.4f)
            {
                var ingredientCount = Random.Range(1, 4);
                goals.Add(new Dictionary<string, object>
                {
                    {"type", "deliver_ingredients"},
                    {"amount", ingredientCount}
                });
            }
            
            // Special blocker goals
            if (difficulty > 0.3f)
            {
                var specialGoals = new[] {"clear_vines", "clear_licorice", "clear_honey"};
                foreach (var goalType in specialGoals)
                {
                    if (Random.value < 0.3f)
                    {
                        var amount = Random.Range(1, 5);
                        goals.Add(new Dictionary<string, object>
                        {
                            {"type", goalType},
                            {"amount", amount}
                        });
                    }
                }
            }
            
            return goals;
        }
        
        private static Dictionary<string, object> GenerateBlockers(float difficulty, Vector2Int size)
        {
            var blockers = new Dictionary<string, object>();
            
            // Jelly layers
            if (difficulty > 0.1f)
            {
                var jelly = new int[size.x, size.y];
                var jellyCount = Mathf.RoundToInt(size.x * size.y * Random.Range(0.1f, 0.4f));
                PlaceRandomBlockers(jelly, jellyCount, 1, 3);
                blockers["jelly"] = Convert2DArray(jelly);
            }
            
            // Ice
            if (difficulty > 0.2f)
            {
                var ice = new int[size.x, size.y];
                var iceCount = Mathf.RoundToInt(size.x * size.y * Random.Range(0.05f, 0.2f));
                PlaceRandomBlockers(ice, iceCount, 1, 2);
                blockers["ice"] = Convert2DArray(ice);
            }
            
            // Crates
            if (difficulty > 0.3f)
            {
                var crates = new int[size.x, size.y];
                var crateCount = Mathf.RoundToInt(size.x * size.y * Random.Range(0.03f, 0.15f));
                PlaceRandomBlockers(crates, crateCount, 1, 2);
                blockers["crates"] = Convert2DArray(crates);
            }
            
            // Holes
            if (difficulty > 0.4f)
            {
                var holes = new bool[size.x, size.y];
                var holeCount = Mathf.RoundToInt(size.x * size.y * Random.Range(0.02f, 0.1f));
                PlaceRandomHoles(holes, holeCount);
                blockers["holes"] = Convert2DBoolArray(holes);
            }
            
            // Locks
            if (difficulty > 0.5f)
            {
                var locks = new bool[size.x, size.y];
                var lockCount = Mathf.RoundToInt(size.x * size.y * Random.Range(0.02f, 0.08f));
                PlaceRandomHoles(locks, lockCount);
                blockers["locks"] = Convert2DBoolArray(locks);
            }
            
            // Chocolate
            if (difficulty > 0.6f)
            {
                var chocolate = new int[size.x, size.y];
                var chocoCount = Mathf.RoundToInt(size.x * size.y * Random.Range(0.01f, 0.05f));
                PlaceRandomBlockers(chocolate, chocoCount, 1, 1);
                blockers["chocolate"] = Convert2DArray(chocolate);
            }
            
            // Advanced blockers
            if (difficulty > 0.7f)
            {
                var advancedBlockers = new[] {"vines", "licorice", "honey", "portals", "conveyors"};
                foreach (var blockerType in advancedBlockers)
                {
                    if (Random.value < 0.3f)
                    {
                        var count = Random.Range(1, 4);
                        blockers[blockerType] = GenerateAdvancedBlocker(size, blockerType, count);
                    }
                }
            }
            
            return blockers;
        }
        
        private static void PlaceRandomBlockers(int[,] array, int count, int minValue, int maxValue)
        {
            var positions = new List<Vector2Int>();
            for (int x = 0; x < array.GetLength(0); x++)
            {
                for (int y = 0; y < array.GetLength(1); y++)
                {
                    positions.Add(new Vector2Int(x, y));
                }
            }
            
            positions = positions.OrderBy(x => Random.value).ToList();
            
            for (int i = 0; i < Mathf.Min(count, positions.Count); i++)
            {
                var pos = positions[i];
                array[pos.x, pos.y] = Random.Range(minValue, maxValue + 1);
            }
        }
        
        private static void PlaceRandomHoles(bool[,] array, int count)
        {
            var positions = new List<Vector2Int>();
            for (int x = 0; x < array.GetLength(0); x++)
            {
                for (int y = 0; y < array.GetLength(1); y++)
                {
                    positions.Add(new Vector2Int(x, y));
                }
            }
            
            positions = positions.OrderBy(x => Random.value).ToList();
            
            for (int i = 0; i < Mathf.Min(count, positions.Count); i++)
            {
                var pos = positions[i];
                array[pos.x, pos.y] = true;
            }
        }
        
        private static object GenerateAdvancedBlocker(Vector2Int size, string type, int count)
        {
            var result = new List<Dictionary<string, object>>();
            
            for (int i = 0; i < count; i++)
            {
                var blocker = new Dictionary<string, object>
                {
                    {"x", Random.Range(0, size.x)},
                    {"y", Random.Range(0, size.y)}
                };
                
                switch (type)
                {
                    case "portals":
                        blocker["target_x"] = Random.Range(0, size.x);
                        blocker["target_y"] = Random.Range(0, size.y);
                        break;
                    case "conveyors":
                        var directions = new[] {"up", "down", "left", "right"};
                        blocker["direction"] = directions[Random.Range(0, directions.Length)];
                        break;
                }
                
                result.Add(blocker);
            }
            
            return result;
        }
        
        private static object Convert2DArray(int[,] array)
        {
            var result = new List<List<int>>();
            for (int x = 0; x < array.GetLength(0); x++)
            {
                var row = new List<int>();
                for (int y = 0; y < array.GetLength(1); y++)
                {
                    row.Add(array[x, y]);
                }
                result.Add(row);
            }
            return result;
        }
        
        private static object Convert2DBoolArray(bool[,] array)
        {
            var result = new List<List<bool>>();
            for (int x = 0; x < array.GetLength(0); x++)
            {
                var row = new List<bool>();
                for (int y = 0; y < array.GetLength(1); y++)
                {
                    row.Add(array[x, y]);
                }
                result.Add(row);
            }
            return result;
        }
        
        private static void SaveLevel(int id, Dictionary<string, object> level)
        {
            var path = Path.Combine(Application.dataPath, "StreamingAssets", "levels", $"level_{id}.json");
            var json = MiniJSON.Json.Serialize(level);
            File.WriteAllText(path, json);
        }
        
        [ContextMenu("Generate 500 Levels")]
        public static void Generate500Levels()
        {
            GenerateLevels(1, 500);
            Debug.Log("Generated 500 levels!");
        }
    }
}