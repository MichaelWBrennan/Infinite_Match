using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using System;
using Evergreen.Core;
using Evergreen.AI;

namespace Evergreen.Game
{
    /// <summary>
    /// Advanced procedural level generation system with AI-driven difficulty and variety
    /// </summary>
    public class ProceduralLevelGenerator : MonoBehaviour
    {
        public static ProceduralLevelGenerator Instance { get; private set; }

        [Header("Generation Settings")]
        public bool enableProceduralGeneration = true;
        public int maxLevels = 1000;
        public float difficultyProgression = 0.1f;
        public bool enableAIAdjustment = true;
        public bool enablePlayerFeedback = true;

        [Header("Level Templates")]
        public LevelTemplate[] levelTemplates;
        public SpecialPieceTemplate[] specialPieceTemplates;
        public ObstacleTemplate[] obstacleTemplates;

        [Header("Generation Rules")]
        public GenerationRule[] generationRules;
        public QualityRule[] qualityRules;
        public VarietyRule[] varietyRules;

        private Dictionary<int, GeneratedLevel> _generatedLevels = new Dictionary<int, GeneratedLevel>();
        private Dictionary<string, LevelTemplate> _templateCache = new Dictionary<string, LevelTemplate>();
        private LevelAnalyzer _levelAnalyzer;
        private DifficultyCalculator _difficultyCalculator;
        private VarietyEngine _varietyEngine;

        public class GeneratedLevel
        {
            public int levelId;
            public Vector2Int size;
            public int numColors;
            public int moveLimit;
            public List<Goal> goals;
            public Dictionary<Vector2Int, PieceType> pieces;
            public Dictionary<Vector2Int, ObstacleType> obstacles;
            public Dictionary<Vector2Int, SpecialPieceType> specialPieces;
            public float difficulty;
            public float variety;
            public float quality;
            public DateTime generatedAt;
            public string templateUsed;
        }

        public class LevelTemplate
        {
            public string templateId;
            public string name;
            public Vector2Int size;
            public int minColors;
            public int maxColors;
            public int minMoves;
            public int maxMoves;
            public List<GoalTemplate> goalTemplates;
            public List<ObstacleTemplate> obstacleTemplates;
            public List<SpecialPieceTemplate> specialPieceTemplates;
            public float difficultyWeight;
            public string[] tags;
        }

        public class SpecialPieceTemplate
        {
            public string templateId;
            public SpecialPieceType type;
            public float spawnProbability;
            public int minLevel;
            public int maxLevel;
            public Dictionary<string, object> parameters;
        }

        public class ObstacleTemplate
        {
            public string templateId;
            public ObstacleType type;
            public float spawnProbability;
            public int minLevel;
            public int maxLevel;
            public Dictionary<string, object> parameters;
        }

        public class GenerationRule
        {
            public string ruleId;
            public string condition;
            public string action;
            public float weight;
            public int priority;
        }

        public class QualityRule
        {
            public string ruleId;
            public string metric;
            public float minValue;
            public float maxValue;
            public float weight;
        }

        public class VarietyRule
        {
            public string ruleId;
            public string element;
            public float minVariety;
            public float maxVariety;
            public float weight;
        }

        public enum PieceType
        {
            Normal,
            Special,
            Obstacle
        }

        public enum ObstacleType
        {
            Ice,
            Chocolate,
            Lock,
            Crate,
            Jelly,
            Hole,
            Portal,
            Conveyor
        }

        public enum SpecialPieceType
        {
            Bomb,
            Rocket,
            ColorBomb,
            Lightning,
            Rainbow
        }

        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeGenerator();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        private void InitializeGenerator()
        {
            _levelAnalyzer = new LevelAnalyzer();
            _difficultyCalculator = new DifficultyCalculator();
            _varietyEngine = new VarietyEngine();

            LoadTemplates();
            Logger.Info("Procedural Level Generator initialized", "LevelGenerator");
        }

        private void LoadTemplates()
        {
            // Load level templates from resources or create default ones
            CreateDefaultTemplates();
        }

        private void CreateDefaultTemplates()
        {
            // Basic template
            var basicTemplate = new LevelTemplate
            {
                templateId = "basic",
                name = "Basic Level",
                size = new Vector2Int(9, 9),
                minColors = 3,
                maxColors = 5,
                minMoves = 20,
                maxMoves = 30,
                difficultyWeight = 0.3f,
                tags = new[] { "beginner", "basic" }
            };

            _templateCache["basic"] = basicTemplate;

            // Advanced template
            var advancedTemplate = new LevelTemplate
            {
                templateId = "advanced",
                name = "Advanced Level",
                size = new Vector2Int(9, 9),
                minColors = 4,
                maxColors = 6,
                minMoves = 15,
                maxMoves = 25,
                difficultyWeight = 0.7f,
                tags = new[] { "advanced", "challenging" }
            };

            _templateCache["advanced"] = advancedTemplate;

            // Expert template
            var expertTemplate = new LevelTemplate
            {
                templateId = "expert",
                name = "Expert Level",
                size = new Vector2Int(9, 9),
                minColors = 5,
                maxColors = 7,
                minMoves = 10,
                maxMoves = 20,
                difficultyWeight = 1.0f,
                tags = new[] { "expert", "difficult" }
            };

            _templateCache["expert"] = expertTemplate;
        }

        #region Level Generation
        public GeneratedLevel GenerateLevel(int levelId, string playerId = null)
        {
            if (_generatedLevels.ContainsKey(levelId))
            {
                return _generatedLevels[levelId];
            }

            var level = new GeneratedLevel
            {
                levelId = levelId,
                generatedAt = DateTime.Now
            };

            // Select template based on level and player
            var template = SelectTemplate(levelId, playerId);
            level.templateUsed = template.templateId;

            // Generate basic level structure
            GenerateBasicStructure(level, template);

            // Add obstacles
            AddObstacles(level, template);

            // Add special pieces
            AddSpecialPieces(level, template);

            // Add goals
            AddGoals(level, template);

            // Calculate difficulty
            level.difficulty = _difficultyCalculator.CalculateDifficulty(level);

            // Calculate variety
            level.variety = _varietyEngine.CalculateVariety(level);

            // Calculate quality
            level.quality = _levelAnalyzer.CalculateQuality(level);

            // Apply AI adjustments if enabled
            if (enableAIAdjustment && !string.IsNullOrEmpty(playerId))
            {
                ApplyAIAdjustments(level, playerId);
            }

            // Validate and refine level
            ValidateAndRefineLevel(level);

            _generatedLevels[levelId] = level;
            return level;
        }

        private LevelTemplate SelectTemplate(int levelId, string playerId)
        {
            // Get player profile if available
            var playerProfile = GetPlayerProfile(playerId);
            var difficulty = CalculateTargetDifficulty(levelId, playerProfile);

            // Select template based on difficulty
            var suitableTemplates = _templateCache.Values
                .Where(t => Mathf.Abs(t.difficultyWeight - difficulty) < 0.3f)
                .OrderBy(t => Mathf.Abs(t.difficultyWeight - difficulty))
                .ToList();

            if (suitableTemplates.Count == 0)
            {
                suitableTemplates = _templateCache.Values.ToList();
            }

            // Add some randomness for variety
            var randomIndex = UnityEngine.Random.Range(0, Mathf.Min(3, suitableTemplates.Count));
            return suitableTemplates[randomIndex];
        }

        private void GenerateBasicStructure(GeneratedLevel level, LevelTemplate template)
        {
            level.size = template.size;
            level.numColors = UnityEngine.Random.Range(template.minColors, template.maxColors + 1);
            level.moveLimit = UnityEngine.Random.Range(template.minMoves, template.maxMoves + 1);
            level.pieces = new Dictionary<Vector2Int, PieceType>();

            // Fill board with normal pieces
            for (int x = 0; x < level.size.x; x++)
            {
                for (int y = 0; y < level.size.y; y++)
                {
                    level.pieces[new Vector2Int(x, y)] = PieceType.Normal;
                }
            }
        }

        private void AddObstacles(GeneratedLevel level, LevelTemplate template)
        {
            level.obstacles = new Dictionary<Vector2Int, ObstacleType>();

            // Add obstacles based on template and level difficulty
            var obstacleCount = CalculateObstacleCount(level);
            var availablePositions = GetAvailablePositions(level);

            for (int i = 0; i < obstacleCount && availablePositions.Count > 0; i++)
            {
                var position = availablePositions[UnityEngine.Random.Range(0, availablePositions.Count)];
                var obstacleType = SelectObstacleType(level);
                
                level.obstacles[position] = obstacleType;
                availablePositions.Remove(position);
            }
        }

        private void AddSpecialPieces(GeneratedLevel level, LevelTemplate template)
        {
            level.specialPieces = new Dictionary<Vector2Int, SpecialPieceType>();

            // Add special pieces based on template and level difficulty
            var specialPieceCount = CalculateSpecialPieceCount(level);
            var availablePositions = GetAvailablePositions(level);

            for (int i = 0; i < specialPieceCount && availablePositions.Count > 0; i++)
            {
                var position = availablePositions[UnityEngine.Random.Range(0, availablePositions.Count)];
                var specialPieceType = SelectSpecialPieceType(level);
                
                level.specialPieces[position] = specialPieceType;
                availablePositions.Remove(position);
            }
        }

        private void AddGoals(GeneratedLevel level, LevelTemplate template)
        {
            level.goals = new List<Goal>();

            // Add goals based on template
            var goalCount = CalculateGoalCount(level);
            var goalTypes = GetAvailableGoalTypes(level);

            for (int i = 0; i < goalCount; i++)
            {
                var goalType = goalTypes[UnityEngine.Random.Range(0, goalTypes.Count)];
                var goal = CreateGoal(goalType, level);
                level.goals.Add(goal);
            }
        }

        private Goal CreateGoal(GoalType goalType, GeneratedLevel level)
        {
            switch (goalType)
            {
                case GoalType.CollectColor:
                    return new Goal
                    {
                        type = goalType,
                        target = UnityEngine.Random.Range(0, level.numColors),
                        count = UnityEngine.Random.Range(10, 30)
                    };
                case GoalType.ClearJelly:
                    return new Goal
                    {
                        type = goalType,
                        count = UnityEngine.Random.Range(5, 15)
                    };
                case GoalType.DeliverIngredients:
                    return new Goal
                    {
                        type = goalType,
                        count = UnityEngine.Random.Range(3, 8)
                    };
                default:
                    return new Goal
                    {
                        type = goalType,
                        count = 1
                    };
            }
        }
        #endregion

        #region AI Adjustments
        private void ApplyAIAdjustments(GeneratedLevel level, string playerId)
        {
            var playerProfile = GetPlayerProfile(playerId);
            if (playerProfile == null) return;

            // Adjust difficulty based on player skill
            var skillAdjustment = (playerProfile.skillLevel - 0.5f) * 0.3f;
            level.difficulty = Mathf.Clamp01(level.difficulty + skillAdjustment);

            // Adjust move limit based on player performance
            var moveAdjustment = (playerProfile.averageMovesPerLevel - 20f) * 0.1f;
            level.moveLimit = Mathf.Max(5, level.moveLimit + Mathf.RoundToInt(moveAdjustment));

            // Adjust color count based on player preference
            if (playerProfile.playStyleWeights.ContainsKey("colorful"))
            {
                level.numColors = Mathf.Min(7, level.numColors + 1);
            }

            // Adjust special pieces based on player engagement
            if (playerProfile.engagementLevel > 0.7f)
            {
                AddMoreSpecialPieces(level);
            }
        }

        private PlayerProfile GetPlayerProfile(string playerId)
        {
            if (string.IsNullOrEmpty(playerId)) return null;
            
            var aiSystem = AdvancedAISystem.Instance;
            if (aiSystem == null) return null;

            // This would get the player profile from the AI system
            return null; // Simplified for now
        }

        private void AddMoreSpecialPieces(GeneratedLevel level)
        {
            var availablePositions = GetAvailablePositions(level);
            var additionalCount = UnityEngine.Random.Range(1, 3);

            for (int i = 0; i < additionalCount && availablePositions.Count > 0; i++)
            {
                var position = availablePositions[UnityEngine.Random.Range(0, availablePositions.Count)];
                var specialPieceType = SelectSpecialPieceType(level);
                
                level.specialPieces[position] = specialPieceType;
                availablePositions.Remove(position);
            }
        }
        #endregion

        #region Helper Methods
        private float CalculateTargetDifficulty(int levelId, PlayerProfile playerProfile)
        {
            var baseDifficulty = Mathf.Clamp01(levelId * difficultyProgression);
            
            if (playerProfile != null)
            {
                var playerAdjustment = (playerProfile.skillLevel - 0.5f) * 0.2f;
                baseDifficulty = Mathf.Clamp01(baseDifficulty + playerAdjustment);
            }

            return baseDifficulty;
        }

        private int CalculateObstacleCount(GeneratedLevel level)
        {
            var baseCount = Mathf.RoundToInt(level.difficulty * 10);
            return Mathf.Clamp(baseCount, 0, 15);
        }

        private int CalculateSpecialPieceCount(GeneratedLevel level)
        {
            var baseCount = Mathf.RoundToInt(level.difficulty * 5);
            return Mathf.Clamp(baseCount, 0, 8);
        }

        private int CalculateGoalCount(GeneratedLevel level)
        {
            return UnityEngine.Random.Range(1, 4);
        }

        private List<Vector2Int> GetAvailablePositions(GeneratedLevel level)
        {
            var positions = new List<Vector2Int>();
            
            for (int x = 0; x < level.size.x; x++)
            {
                for (int y = 0; y < level.size.y; y++)
                {
                    var pos = new Vector2Int(x, y);
                    if (!level.obstacles.ContainsKey(pos) && !level.specialPieces.ContainsKey(pos))
                    {
                        positions.Add(pos);
                    }
                }
            }

            return positions;
        }

        private ObstacleType SelectObstacleType(GeneratedLevel level)
        {
            var obstacleTypes = System.Enum.GetValues(typeof(ObstacleType)).Cast<ObstacleType>().ToList();
            return obstacleTypes[UnityEngine.Random.Range(0, obstacleTypes.Count)];
        }

        private SpecialPieceType SelectSpecialPieceType(GeneratedLevel level)
        {
            var specialPieceTypes = System.Enum.GetValues(typeof(SpecialPieceType)).Cast<SpecialPieceType>().ToList();
            return specialPieceTypes[UnityEngine.Random.Range(0, specialPieceTypes.Count)];
        }

        private List<GoalType> GetAvailableGoalTypes(GeneratedLevel level)
        {
            var goalTypes = new List<GoalType>
            {
                GoalType.CollectColor,
                GoalType.ClearJelly,
                GoalType.DeliverIngredients
            };

            return goalTypes;
        }
        #endregion

        #region Validation and Refinement
        private void ValidateAndRefineLevel(GeneratedLevel level)
        {
            // Ensure level is solvable
            if (!IsLevelSolvable(level))
            {
                RefineLevel(level);
            }

            // Ensure level has good variety
            if (level.variety < 0.3f)
            {
                AddVariety(level);
            }

            // Ensure level quality is acceptable
            if (level.quality < 0.5f)
            {
                ImproveQuality(level);
            }
        }

        private bool IsLevelSolvable(GeneratedLevel level)
        {
            // Simplified solvability check
            // In a real implementation, this would use a more sophisticated algorithm
            return level.moveLimit > 5 && level.goals.Count > 0;
        }

        private void RefineLevel(GeneratedLevel level)
        {
            // Increase move limit if level seems too difficult
            if (level.moveLimit < 10)
            {
                level.moveLimit += 5;
            }

            // Reduce obstacle count if too many
            if (level.obstacles.Count > level.size.x * level.size.y / 3)
            {
                var obstaclesToRemove = level.obstacles.Keys.Take(level.obstacles.Count / 2).ToList();
                foreach (var pos in obstaclesToRemove)
                {
                    level.obstacles.Remove(pos);
                }
            }
        }

        private void AddVariety(GeneratedLevel level)
        {
            // Add more special pieces
            var availablePositions = GetAvailablePositions(level);
            if (availablePositions.Count > 0)
            {
                var position = availablePositions[UnityEngine.Random.Range(0, availablePositions.Count)];
                var specialPieceType = SelectSpecialPieceType(level);
                level.specialPieces[position] = specialPieceType;
            }
        }

        private void ImproveQuality(GeneratedLevel level)
        {
            // Ensure level has good balance
            if (level.goals.Count < 2)
            {
                var goalType = GetAvailableGoalTypes(level)[0];
                var goal = CreateGoal(goalType, level);
                level.goals.Add(goal);
            }
        }
        #endregion

        #region Data Structures
        public class Goal
        {
            public GoalType type;
            public int target;
            public int count;
            public int current;
        }

        public enum GoalType
        {
            CollectColor,
            ClearJelly,
            DeliverIngredients,
            ClearObstacles,
            ReachScore
        }
        #endregion

        #region Statistics
        public Dictionary<string, object> GetGeneratorStatistics()
        {
            return new Dictionary<string, object>
            {
                {"generated_levels", _generatedLevels.Count},
                {"templates_loaded", _templateCache.Count},
                {"average_difficulty", _generatedLevels.Values.Average(l => l.difficulty)},
                {"average_variety", _generatedLevels.Values.Average(l => l.variety)},
                {"average_quality", _generatedLevels.Values.Average(l => l.quality)},
                {"enable_procedural_generation", enableProceduralGeneration},
                {"enable_ai_adjustment", enableAIAdjustment},
                {"max_levels", maxLevels}
            };
        }
        #endregion
    }

    /// <summary>
    /// Level analyzer for quality assessment
    /// </summary>
    public class LevelAnalyzer
    {
        public float CalculateQuality(ProceduralLevelGenerator.GeneratedLevel level)
        {
            var quality = 0f;

            // Check goal balance
            quality += CalculateGoalBalance(level) * 0.3f;

            // Check difficulty progression
            quality += CalculateDifficultyProgression(level) * 0.2f;

            // Check variety
            quality += CalculateVariety(level) * 0.2f;

            // Check solvability
            quality += CalculateSolvability(level) * 0.3f;

            return Mathf.Clamp01(quality);
        }

        private float CalculateGoalBalance(ProceduralLevelGenerator.GeneratedLevel level)
        {
            if (level.goals.Count == 0) return 0f;
            return Mathf.Clamp01(level.goals.Count / 3f);
        }

        private float CalculateDifficultyProgression(ProceduralLevelGenerator.GeneratedLevel level)
        {
            return Mathf.Clamp01(level.difficulty);
        }

        private float CalculateVariety(ProceduralLevelGenerator.GeneratedLevel level)
        {
            var variety = 0f;
            variety += level.obstacles.Count / 10f;
            variety += level.specialPieces.Count / 5f;
            variety += level.goals.Count / 3f;
            return Mathf.Clamp01(variety);
        }

        private float CalculateSolvability(ProceduralLevelGenerator.GeneratedLevel level)
        {
            // Simplified solvability check
            return level.moveLimit > 5 ? 1f : 0f;
        }
    }

    /// <summary>
    /// Difficulty calculator for level assessment
    /// </summary>
    public class DifficultyCalculator
    {
        public float CalculateDifficulty(ProceduralLevelGenerator.GeneratedLevel level)
        {
            var difficulty = 0f;

            // Base difficulty from move limit
            difficulty += (50f - level.moveLimit) / 50f * 0.3f;

            // Obstacle difficulty
            difficulty += level.obstacles.Count / 15f * 0.2f;

            // Color difficulty
            difficulty += (level.numColors - 3) / 4f * 0.2f;

            // Goal difficulty
            difficulty += level.goals.Count / 3f * 0.2f;

            // Special pieces difficulty
            difficulty += level.specialPieces.Count / 8f * 0.1f;

            return Mathf.Clamp01(difficulty);
        }
    }

    /// <summary>
    /// Variety engine for level diversity
    /// </summary>
    public class VarietyEngine
    {
        public float CalculateVariety(ProceduralLevelGenerator.GeneratedLevel level)
        {
            var variety = 0f;

            // Obstacle variety
            var obstacleTypes = level.obstacles.Values.Distinct().Count();
            variety += obstacleTypes / 8f * 0.3f;

            // Special piece variety
            var specialPieceTypes = level.specialPieces.Values.Distinct().Count();
            variety += specialPieceTypes / 5f * 0.3f;

            // Goal variety
            var goalTypes = level.goals.Select(g => g.type).Distinct().Count();
            variety += goalTypes / 5f * 0.4f;

            return Mathf.Clamp01(variety);
        }
    }
}