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
        
        [Header("AI Enhancement Settings")]
        public bool enableAIContentVariety = true;
        public bool enableAIPersonalization = true;
        public bool enableAIQualityOptimization = true;
        public bool enableAIPerformancePrediction = true;
        public float aiPersonalizationStrength = 0.8f;
        public float aiQualityThreshold = 0.7f;
        
        [Header("Web AI Settings")]
        public bool enableWebAI = true;
        public bool enableAlgorithmicAI = true;
        public bool enableDataDrivenAI = true;
        public string webAIServiceUrl = ""; // Optional web AI service
        public bool useFallbackAI = true;

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
        private AIContentVarietyEngine _aiContentVarietyEngine;
        private AIPersonalizationEngine _aiPersonalizationEngine;
        private AIQualityOptimizer _aiQualityOptimizer;
        private AIPerformancePredictor _aiPerformancePredictor;
        private WebAIAdapter _webAIAdapter;
        private AlgorithmicAIEngine _algorithmicAIEngine;

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
            _aiContentVarietyEngine = new AIContentVarietyEngine();
            _aiPersonalizationEngine = new AIPersonalizationEngine();
            _aiQualityOptimizer = new AIQualityOptimizer();
            _aiPerformancePredictor = new AIPerformancePredictor();
            _webAIAdapter = new WebAIAdapter();
            _algorithmicAIEngine = new AlgorithmicAIEngine();

            LoadTemplates();
            Logger.Info("Web-Compatible AI-Enhanced Procedural Level Generator initialized", "LevelGenerator");
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

            // Apply AI content variety enhancement
            if (enableAIContentVariety && !string.IsNullOrEmpty(playerId))
            {
                ApplyAIContentVariety(level, playerId);
            }

            // Apply AI personalization
            if (enableAIPersonalization && !string.IsNullOrEmpty(playerId))
            {
                ApplyAIPersonalization(level, playerId);
            }

            // Apply AI quality optimization
            if (enableAIQualityOptimization)
            {
                ApplyAIQualityOptimization(level);
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

        private void ApplyAIContentVariety(GeneratedLevel level, string playerId)
        {
            if (_aiContentVarietyEngine == null) return;

            ContentVarietyEnhancement varietyEnhancement;
            
            // Try web AI first, fallback to algorithmic AI
            if (enableWebAI && !string.IsNullOrEmpty(webAIServiceUrl))
            {
                varietyEnhancement = _webAIAdapter?.GenerateContentVariety(level, playerId) ?? 
                                   _aiContentVarietyEngine.GenerateContentVariety(level, playerId);
            }
            else if (enableAlgorithmicAI)
            {
                varietyEnhancement = _algorithmicAIEngine?.GenerateContentVariety(level, playerId) ?? 
                                   _aiContentVarietyEngine.GenerateContentVariety(level, playerId);
            }
            else
            {
                varietyEnhancement = _aiContentVarietyEngine.GenerateContentVariety(level, playerId);
            }
            
            // Apply AI-generated variety enhancements
            if (varietyEnhancement.ObstacleVariety > 0)
            {
                AddAIObstacleVariety(level, varietyEnhancement.ObstacleVariety);
            }
            
            if (varietyEnhancement.SpecialPieceVariety > 0)
            {
                AddAISpecialPieceVariety(level, varietyEnhancement.SpecialPieceVariety);
            }
            
            if (varietyEnhancement.GoalVariety > 0)
            {
                AddAIGoalVariety(level, varietyEnhancement.GoalVariety);
            }
        }

        private void ApplyAIPersonalization(GeneratedLevel level, string playerId)
        {
            if (_aiPersonalizationEngine == null) return;

            PersonalizationData personalizationData;
            
            // Try web AI first, fallback to algorithmic AI
            if (enableWebAI && !string.IsNullOrEmpty(webAIServiceUrl))
            {
                personalizationData = _webAIAdapter?.GeneratePersonalizationData(level, playerId) ?? 
                                    _aiPersonalizationEngine.GeneratePersonalizationData(level, playerId);
            }
            else if (enableAlgorithmicAI)
            {
                personalizationData = _algorithmicAIEngine?.GeneratePersonalizationData(level, playerId) ?? 
                                    _aiPersonalizationEngine.GeneratePersonalizationData(level, playerId);
            }
            else
            {
                personalizationData = _aiPersonalizationEngine.GeneratePersonalizationData(level, playerId);
            }
            
            // Apply AI personalization
            level.difficulty = Mathf.Lerp(level.difficulty, personalizationData.OptimalDifficulty, aiPersonalizationStrength);
            level.numColors = Mathf.RoundToInt(Mathf.Lerp(level.numColors, personalizationData.OptimalColors, aiPersonalizationStrength));
            level.moveLimit = Mathf.RoundToInt(Mathf.Lerp(level.moveLimit, personalizationData.OptimalMoves, aiPersonalizationStrength));
        }

        private void ApplyAIQualityOptimization(GeneratedLevel level)
        {
            if (_aiQualityOptimizer == null) return;

            var qualityScore = _aiQualityOptimizer.CalculateQualityScore(level);
            
            if (qualityScore < aiQualityThreshold)
            {
                var optimizations = _aiQualityOptimizer.GenerateOptimizations(level, qualityScore);
                ApplyQualityOptimizations(level, optimizations);
            }
        }

        private void AddAIObstacleVariety(GeneratedLevel level, float varietyStrength)
        {
            var additionalObstacles = Mathf.RoundToInt(varietyStrength * 3);
            var availablePositions = GetAvailablePositions(level);
            
            for (int i = 0; i < additionalObstacles && availablePositions.Count > 0; i++)
            {
                var position = availablePositions[UnityEngine.Random.Range(0, availablePositions.Count)];
                var obstacleType = _aiContentVarietyEngine.SelectOptimalObstacleType(level, position);
                
                level.obstacles[position] = obstacleType;
                availablePositions.Remove(position);
            }
        }

        private void AddAISpecialPieceVariety(GeneratedLevel level, float varietyStrength)
        {
            var additionalSpecialPieces = Mathf.RoundToInt(varietyStrength * 2);
            var availablePositions = GetAvailablePositions(level);
            
            for (int i = 0; i < additionalSpecialPieces && availablePositions.Count > 0; i++)
            {
                var position = availablePositions[UnityEngine.Random.Range(0, availablePositions.Count)];
                var specialPieceType = _aiContentVarietyEngine.SelectOptimalSpecialPieceType(level, position);
                
                level.specialPieces[position] = specialPieceType;
                availablePositions.Remove(position);
            }
        }

        private void AddAIGoalVariety(GeneratedLevel level, float varietyStrength)
        {
            var additionalGoals = Mathf.RoundToInt(varietyStrength * 2);
            var goalTypes = GetAvailableGoalTypes(level);
            
            for (int i = 0; i < additionalGoals; i++)
            {
                var goalType = _aiContentVarietyEngine.SelectOptimalGoalType(level, goalTypes);
                var goal = CreateGoal(goalType, level);
                level.goals.Add(goal);
            }
        }

        private void ApplyQualityOptimizations(GeneratedLevel level, List<QualityOptimization> optimizations)
        {
            foreach (var optimization in optimizations)
            {
                switch (optimization.Type)
                {
                    case "difficulty_balance":
                        level.moveLimit = Mathf.RoundToInt(level.moveLimit * optimization.Value);
                        break;
                    case "obstacle_distribution":
                        OptimizeObstacleDistribution(level, optimization.Value);
                        break;
                    case "goal_balance":
                        OptimizeGoalBalance(level, optimization.Value);
                        break;
                }
            }
        }

        private void OptimizeObstacleDistribution(GeneratedLevel level, float optimizationValue)
        {
            // AI-driven obstacle distribution optimization
            var obstaclesToRemove = Mathf.RoundToInt(level.obstacles.Count * (1 - optimizationValue));
            var obstacleKeys = new List<Vector2Int>(level.obstacles.Keys);
            
            for (int i = 0; i < obstaclesToRemove && obstacleKeys.Count > 0; i++)
            {
                var randomIndex = UnityEngine.Random.Range(0, obstacleKeys.Count);
                level.obstacles.Remove(obstacleKeys[randomIndex]);
                obstacleKeys.RemoveAt(randomIndex);
            }
        }

        private void OptimizeGoalBalance(GeneratedLevel level, float optimizationValue)
        {
            // AI-driven goal balance optimization
            if (level.goals.Count > 0)
            {
                var goalsToKeep = Mathf.RoundToInt(level.goals.Count * optimizationValue);
                if (goalsToKeep < level.goals.Count)
                {
                    level.goals = level.goals.Take(goalsToKeep).ToList();
                }
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
                {"enable_ai_content_variety", enableAIContentVariety},
                {"enable_ai_personalization", enableAIPersonalization},
                {"enable_ai_quality_optimization", enableAIQualityOptimization},
                {"enable_ai_performance_prediction", enableAIPerformancePrediction},
                {"max_levels", maxLevels}
            };
        }

        // AI Content Optimization Methods
        public void OptimizeLevelContent(GeneratedLevel level, string playerId = null)
        {
            if (_aiQualityOptimizer == null) return;

            var qualityScore = _aiQualityOptimizer.CalculateQualityScore(level);
            if (qualityScore < aiQualityThreshold)
            {
                var optimizations = _aiQualityOptimizer.GenerateOptimizations(level, qualityScore);
                ApplyQualityOptimizations(level, optimizations);
                
                Debug.Log($"[ProceduralLevelGenerator] Applied AI quality optimizations to level {level.levelId}, " +
                         $"quality improved from {qualityScore:F2} to {_aiQualityOptimizer.CalculateQualityScore(level):F2}");
            }
        }

        public PerformancePrediction PredictLevelPerformance(GeneratedLevel level, string playerId = null)
        {
            if (_aiPerformancePredictor == null) return null;

            return _aiPerformancePredictor.PredictLevelPerformance(level, playerId);
        }

        public void UpdateLevelPerformance(GeneratedLevel level, string playerId, LevelPerformanceData performance)
        {
            // Update AI systems with performance data
            if (_aiPersonalizationEngine != null)
            {
                // This would integrate with the AIPersonalizationSystem
                var personalizationSystem = AIPersonalizationSystem.Instance;
                if (personalizationSystem != null)
                {
                    personalizationSystem.UpdateLevelPerformance(playerId, level.levelId, performance);
                }
            }

            // Update level quality based on performance
            if (_aiQualityOptimizer != null)
            {
                var qualityAdjustment = CalculateQualityAdjustment(performance);
                level.quality = Mathf.Clamp01(level.quality + qualityAdjustment);
            }

            Debug.Log($"[ProceduralLevelGenerator] Updated performance data for level {level.levelId}, " +
                     $"player {playerId}, completed: {performance.Completed}");
        }

        private float CalculateQualityAdjustment(LevelPerformanceData performance)
        {
            var adjustment = 0f;
            
            if (performance.Completed)
            {
                // Positive adjustment for completion
                adjustment += 0.1f;
                
                // Additional adjustment for good performance
                if (performance.Score > 1000)
                    adjustment += 0.05f;
                
                if (performance.MovesUsed < performance.MoveLimit * 0.5f)
                    adjustment += 0.05f;
            }
            else
            {
                // Negative adjustment for failure
                adjustment -= 0.05f;
            }
            
            return adjustment;
        }

        public List<GeneratedLevel> GenerateLevelSequence(int startLevel, int count, string playerId = null)
        {
            var levels = new List<GeneratedLevel>();
            
            for (int i = 0; i < count; i++)
            {
                var levelId = startLevel + i;
                var level = GenerateLevel(levelId, playerId);
                
                // Apply AI optimizations
                OptimizeLevelContent(level, playerId);
                
                // Predict performance
                var prediction = PredictLevelPerformance(level, playerId);
                if (prediction != null)
                {
                    Debug.Log($"[ProceduralLevelGenerator] Generated level {levelId} with predicted " +
                             $"completion rate: {prediction.PredictedCompletionRate:F2}, " +
                             $"engagement: {prediction.PredictedEngagement:F2}");
                }
                
                levels.Add(level);
            }
            
            return levels;
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

    /// <summary>
    /// AI Content Variety Engine for enhanced level variety
    /// </summary>
    public class AIContentVarietyEngine
    {
        public ContentVarietyEnhancement GenerateContentVariety(GeneratedLevel level, string playerId)
        {
            return new ContentVarietyEnhancement
            {
                ObstacleVariety = CalculateObstacleVariety(level),
                SpecialPieceVariety = CalculateSpecialPieceVariety(level),
                GoalVariety = CalculateGoalVariety(level)
            };
        }

        public ObstacleType SelectOptimalObstacleType(GeneratedLevel level, Vector2Int position)
        {
            // AI-driven obstacle type selection based on level context
            var obstacleTypes = System.Enum.GetValues(typeof(ObstacleType)).Cast<ObstacleType>().ToList();
            var weights = CalculateObstacleWeights(level, position);
            
            return SelectWeightedRandom(obstacleTypes, weights);
        }

        public SpecialPieceType SelectOptimalSpecialPieceType(GeneratedLevel level, Vector2Int position)
        {
            // AI-driven special piece type selection
            var specialPieceTypes = System.Enum.GetValues(typeof(SpecialPieceType)).Cast<SpecialPieceType>().ToList();
            var weights = CalculateSpecialPieceWeights(level, position);
            
            return SelectWeightedRandom(specialPieceTypes, weights);
        }

        public GoalType SelectOptimalGoalType(GeneratedLevel level, List<GoalType> availableTypes)
        {
            // AI-driven goal type selection
            var weights = CalculateGoalWeights(level, availableTypes);
            return SelectWeightedRandom(availableTypes, weights);
        }

        private float CalculateObstacleVariety(GeneratedLevel level)
        {
            var currentVariety = level.obstacles.Values.Distinct().Count() / 8f;
            return Mathf.Clamp01(1.0f - currentVariety);
        }

        private float CalculateSpecialPieceVariety(GeneratedLevel level)
        {
            var currentVariety = level.specialPieces.Values.Distinct().Count() / 5f;
            return Mathf.Clamp01(1.0f - currentVariety);
        }

        private float CalculateGoalVariety(GeneratedLevel level)
        {
            var currentVariety = level.goals.Select(g => g.type).Distinct().Count() / 5f;
            return Mathf.Clamp01(1.0f - currentVariety);
        }

        private List<float> CalculateObstacleWeights(GeneratedLevel level, Vector2Int position)
        {
            // AI-driven obstacle weight calculation
            var weights = new List<float>();
            var obstacleTypes = System.Enum.GetValues(typeof(ObstacleType)).Cast<ObstacleType>().ToList();
            
            foreach (var type in obstacleTypes)
            {
                float weight = 1.0f;
                
                // Adjust weight based on level difficulty
                if (level.difficulty > 0.7f && (type == ObstacleType.Lock || type == ObstacleType.Crate))
                    weight *= 1.5f;
                
                // Adjust weight based on position
                if (IsCornerPosition(position) && type == ObstacleType.Ice)
                    weight *= 0.5f;
                
                weights.Add(weight);
            }
            
            return weights;
        }

        private List<float> CalculateSpecialPieceWeights(GeneratedLevel level, Vector2Int position)
        {
            var weights = new List<float>();
            var specialPieceTypes = System.Enum.GetValues(typeof(SpecialPieceType)).Cast<SpecialPieceType>().ToList();
            
            foreach (var type in specialPieceTypes)
            {
                float weight = 1.0f;
                
                // Adjust weight based on level difficulty
                if (level.difficulty > 0.8f && type == SpecialPieceType.ColorBomb)
                    weight *= 1.3f;
                
                weights.Add(weight);
            }
            
            return weights;
        }

        private List<float> CalculateGoalWeights(GeneratedLevel level, List<GoalType> availableTypes)
        {
            var weights = new List<float>();
            
            foreach (var type in availableTypes)
            {
                float weight = 1.0f;
                
                // Adjust weight based on level content
                if (type == GoalType.ClearJelly && level.obstacles.ContainsValue(ObstacleType.Jelly))
                    weight *= 1.5f;
                
                weights.Add(weight);
            }
            
            return weights;
        }

        private T SelectWeightedRandom<T>(List<T> items, List<float> weights)
        {
            if (items.Count != weights.Count || items.Count == 0)
                return items[UnityEngine.Random.Range(0, items.Count)];
            
            float totalWeight = weights.Sum();
            float randomValue = UnityEngine.Random.Range(0f, totalWeight);
            
            float currentWeight = 0f;
            for (int i = 0; i < items.Count; i++)
            {
                currentWeight += weights[i];
                if (randomValue <= currentWeight)
                    return items[i];
            }
            
            return items[items.Count - 1];
        }

        private bool IsCornerPosition(Vector2Int position)
        {
            return (position.x == 0 || position.x == 8) && (position.y == 0 || position.y == 8);
        }
    }

    /// <summary>
    /// AI Personalization Engine for player-specific level customization
    /// </summary>
    public class AIPersonalizationEngine
    {
        public PersonalizationData GeneratePersonalizationData(GeneratedLevel level, string playerId)
        {
            // Simplified AI personalization - in a real system, this would use machine learning
            return new PersonalizationData
            {
                OptimalDifficulty = CalculateOptimalDifficulty(level, playerId),
                OptimalColors = CalculateOptimalColors(level, playerId),
                OptimalMoves = CalculateOptimalMoves(level, playerId),
                PreferredMechanics = GetPreferredMechanics(playerId),
                EngagementTriggers = GetEngagementTriggers(playerId)
            };
        }

        private float CalculateOptimalDifficulty(GeneratedLevel level, string playerId)
        {
            // AI-driven difficulty calculation
            return Mathf.Clamp01(level.difficulty + UnityEngine.Random.Range(-0.2f, 0.2f));
        }

        private int CalculateOptimalColors(GeneratedLevel level, string playerId)
        {
            // AI-driven color count optimization
            return Mathf.Clamp(level.numColors + UnityEngine.Random.Range(-1, 2), 3, 7);
        }

        private int CalculateOptimalMoves(GeneratedLevel level, string playerId)
        {
            // AI-driven move limit optimization
            return Mathf.Clamp(level.moveLimit + UnityEngine.Random.Range(-3, 4), 5, 50);
        }

        private List<string> GetPreferredMechanics(string playerId)
        {
            // AI-driven mechanic preference detection
            return new List<string> { "matching", "combos", "special_pieces" };
        }

        private List<string> GetEngagementTriggers(string playerId)
        {
            // AI-driven engagement trigger identification
            return new List<string> { "challenge", "variety", "progression" };
        }
    }

    /// <summary>
    /// AI Quality Optimizer for level quality enhancement
    /// </summary>
    public class AIQualityOptimizer
    {
        public float CalculateQualityScore(GeneratedLevel level)
        {
            var quality = 0f;
            
            // Goal balance quality
            quality += CalculateGoalBalanceQuality(level) * 0.3f;
            
            // Difficulty progression quality
            quality += CalculateDifficultyProgressionQuality(level) * 0.2f;
            
            // Obstacle distribution quality
            quality += CalculateObstacleDistributionQuality(level) * 0.2f;
            
            // Solvability quality
            quality += CalculateSolvabilityQuality(level) * 0.3f;
            
            return Mathf.Clamp01(quality);
        }

        public List<QualityOptimization> GenerateOptimizations(GeneratedLevel level, float currentQuality)
        {
            var optimizations = new List<QualityOptimization>();
            
            if (currentQuality < 0.5f)
            {
                optimizations.Add(new QualityOptimization
                {
                    Type = "difficulty_balance",
                    Value = 1.2f,
                    Description = "Improve difficulty balance"
                });
            }
            
            if (level.obstacles.Count > level.size.x * level.size.y / 2)
            {
                optimizations.Add(new QualityOptimization
                {
                    Type = "obstacle_distribution",
                    Value = 0.7f,
                    Description = "Reduce obstacle density"
                });
            }
            
            if (level.goals.Count < 2)
            {
                optimizations.Add(new QualityOptimization
                {
                    Type = "goal_balance",
                    Value = 1.5f,
                    Description = "Add more goals"
                });
            }
            
            return optimizations;
        }

        private float CalculateGoalBalanceQuality(GeneratedLevel level)
        {
            if (level.goals.Count == 0) return 0f;
            return Mathf.Clamp01(level.goals.Count / 3f);
        }

        private float CalculateDifficultyProgressionQuality(GeneratedLevel level)
        {
            return Mathf.Clamp01(level.difficulty);
        }

        private float CalculateObstacleDistributionQuality(GeneratedLevel level)
        {
            var obstacleDensity = level.obstacles.Count / (float)(level.size.x * level.size.y);
            return Mathf.Clamp01(1.0f - Mathf.Abs(obstacleDensity - 0.3f) * 2f);
        }

        private float CalculateSolvabilityQuality(GeneratedLevel level)
        {
            return level.moveLimit > 5 ? 1f : 0f;
        }
    }

    /// <summary>
    /// AI Performance Predictor for level performance forecasting
    /// </summary>
    public class AIPerformancePredictor
    {
        public PerformancePrediction PredictLevelPerformance(GeneratedLevel level, string playerId)
        {
            return new PerformancePrediction
            {
                PredictedCompletionRate = CalculateCompletionRate(level, playerId),
                PredictedEngagement = CalculateEngagement(level, playerId),
                PredictedRetention = CalculateRetention(level, playerId),
                PredictedDifficulty = CalculateDifficulty(level, playerId)
            };
        }

        private float CalculateCompletionRate(GeneratedLevel level, string playerId)
        {
            // AI-driven completion rate prediction
            var baseRate = 0.8f;
            var difficultyPenalty = level.difficulty * 0.3f;
            var moveBonus = Mathf.Clamp01((level.moveLimit - 10) / 20f) * 0.2f;
            
            return Mathf.Clamp01(baseRate - difficultyPenalty + moveBonus);
        }

        private float CalculateEngagement(GeneratedLevel level, string playerId)
        {
            // AI-driven engagement prediction
            var varietyScore = (level.obstacles.Count + level.specialPieces.Count) / 20f;
            var goalScore = level.goals.Count / 3f;
            
            return Mathf.Clamp01((varietyScore + goalScore) / 2f);
        }

        private float CalculateRetention(GeneratedLevel level, string playerId)
        {
            // AI-driven retention prediction
            var completionRate = CalculateCompletionRate(level, playerId);
            var engagement = CalculateEngagement(level, playerId);
            
            return Mathf.Clamp01((completionRate + engagement) / 2f);
        }

        private float CalculateDifficulty(GeneratedLevel level, string playerId)
        {
            // AI-driven difficulty prediction
            return level.difficulty;
        }
    }

    // Data Structures
    public class ContentVarietyEnhancement
    {
        public float ObstacleVariety;
        public float SpecialPieceVariety;
        public float GoalVariety;
    }

    public class PersonalizationData
    {
        public float OptimalDifficulty;
        public int OptimalColors;
        public int OptimalMoves;
        public List<string> PreferredMechanics;
        public List<string> EngagementTriggers;
    }

    public class QualityOptimization
    {
        public string Type;
        public float Value;
        public string Description;
    }

    public class PerformancePrediction
    {
        public float PredictedCompletionRate;
        public float PredictedEngagement;
        public float PredictedRetention;
        public float PredictedDifficulty;
    }

    /// <summary>
    /// Web AI Adapter for external AI services (optional)
    /// </summary>
    public class WebAIAdapter
    {
        private string _serviceUrl;
        private bool _isAvailable;

        public WebAIAdapter(string serviceUrl = "")
        {
            _serviceUrl = serviceUrl;
            _isAvailable = !string.IsNullOrEmpty(serviceUrl);
        }

        public ContentVarietyEnhancement GenerateContentVariety(GeneratedLevel level, string playerId)
        {
            if (!_isAvailable) return null;

            try
            {
                // In a real implementation, this would make HTTP requests to web AI services
                // For now, return null to use fallback
                return null;
            }
            catch (System.Exception)
            {
                return null;
            }
        }

        public PersonalizationData GeneratePersonalizationData(GeneratedLevel level, string playerId)
        {
            if (!_isAvailable) return null;

            try
            {
                // In a real implementation, this would make HTTP requests to web AI services
                // For now, return null to use fallback
                return null;
            }
            catch (System.Exception)
            {
                return null;
            }
        }
    }

    /// <summary>
    /// Algorithmic AI Engine - Pure algorithmic approach for web compatibility
    /// </summary>
    public class AlgorithmicAIEngine
    {
        private Dictionary<string, PlayerBehaviorPattern> _playerPatterns;
        private Dictionary<string, LevelPerformanceHistory> _levelHistory;

        public AlgorithmicAIEngine()
        {
            _playerPatterns = new Dictionary<string, PlayerBehaviorPattern>();
            _levelHistory = new Dictionary<string, LevelPerformanceHistory>();
        }

        public ContentVarietyEnhancement GenerateContentVariety(GeneratedLevel level, string playerId)
        {
            var pattern = GetPlayerBehaviorPattern(playerId);
            var levelHistory = GetLevelPerformanceHistory(level.levelId.ToString());

            return new ContentVarietyEnhancement
            {
                ObstacleVariety = CalculateAlgorithmicObstacleVariety(level, pattern, levelHistory),
                SpecialPieceVariety = CalculateAlgorithmicSpecialPieceVariety(level, pattern, levelHistory),
                GoalVariety = CalculateAlgorithmicGoalVariety(level, pattern, levelHistory)
            };
        }

        public PersonalizationData GeneratePersonalizationData(GeneratedLevel level, string playerId)
        {
            var pattern = GetPlayerBehaviorPattern(playerId);
            var levelHistory = GetLevelPerformanceHistory(level.levelId.ToString());

            return new PersonalizationData
            {
                OptimalDifficulty = CalculateAlgorithmicDifficulty(level, pattern, levelHistory),
                OptimalColors = CalculateAlgorithmicColors(level, pattern, levelHistory),
                OptimalMoves = CalculateAlgorithmicMoves(level, pattern, levelHistory),
                PreferredMechanics = GetAlgorithmicPreferredMechanics(pattern),
                EngagementTriggers = GetAlgorithmicEngagementTriggers(pattern)
            };
        }

        private PlayerBehaviorPattern GetPlayerBehaviorPattern(string playerId)
        {
            if (!_playerPatterns.ContainsKey(playerId))
            {
                _playerPatterns[playerId] = new PlayerBehaviorPattern
                {
                    AverageScore = 1000f,
                    AverageMoves = 20f,
                    CompletionRate = 0.8f,
                    PreferredDifficulty = 0.5f,
                    ColorPreference = 5,
                    EngagementLevel = 0.7f
                };
            }
            return _playerPatterns[playerId];
        }

        private LevelPerformanceHistory GetLevelPerformanceHistory(string levelId)
        {
            if (!_levelHistory.ContainsKey(levelId))
            {
                _levelHistory[levelId] = new LevelPerformanceHistory
                {
                    AverageCompletionRate = 0.8f,
                    AverageEngagement = 0.7f,
                    DifficultyRating = 0.5f,
                    PopularityScore = 0.5f
                };
            }
            return _levelHistory[levelId];
        }

        private float CalculateAlgorithmicObstacleVariety(GeneratedLevel level, PlayerBehaviorPattern pattern, LevelPerformanceHistory history)
        {
            // Algorithmic calculation based on player patterns and level history
            var baseVariety = 0.5f;
            var playerAdjustment = pattern.EngagementLevel * 0.3f;
            var levelAdjustment = (1f - history.DifficultyRating) * 0.2f;
            
            return Mathf.Clamp01(baseVariety + playerAdjustment + levelAdjustment);
        }

        private float CalculateAlgorithmicSpecialPieceVariety(GeneratedLevel level, PlayerBehaviorPattern pattern, LevelPerformanceHistory history)
        {
            var baseVariety = 0.4f;
            var playerAdjustment = pattern.CompletionRate * 0.4f;
            var levelAdjustment = history.PopularityScore * 0.2f;
            
            return Mathf.Clamp01(baseVariety + playerAdjustment + levelAdjustment);
        }

        private float CalculateAlgorithmicGoalVariety(GeneratedLevel level, PlayerBehaviorPattern pattern, LevelPerformanceHistory history)
        {
            var baseVariety = 0.6f;
            var playerAdjustment = pattern.AverageScore / 2000f;
            var levelAdjustment = history.AverageEngagement * 0.3f;
            
            return Mathf.Clamp01(baseVariety + playerAdjustment + levelAdjustment);
        }

        private float CalculateAlgorithmicDifficulty(GeneratedLevel level, PlayerBehaviorPattern pattern, LevelPerformanceHistory history)
        {
            var baseDifficulty = level.difficulty;
            var playerAdjustment = (pattern.PreferredDifficulty - 0.5f) * 0.3f;
            var performanceAdjustment = (pattern.CompletionRate - 0.8f) * 0.2f;
            
            return Mathf.Clamp01(baseDifficulty + playerAdjustment + performanceAdjustment);
        }

        private int CalculateAlgorithmicColors(GeneratedLevel level, PlayerBehaviorPattern pattern, LevelPerformanceHistory history)
        {
            var baseColors = level.numColors;
            var playerAdjustment = pattern.ColorPreference - 5;
            var performanceAdjustment = pattern.AverageScore > 1500 ? 1 : 0;
            
            return Mathf.Clamp(baseColors + playerAdjustment + performanceAdjustment, 3, 7);
        }

        private int CalculateAlgorithmicMoves(GeneratedLevel level, PlayerBehaviorPattern pattern, LevelPerformanceHistory history)
        {
            var baseMoves = level.moveLimit;
            var playerAdjustment = Mathf.RoundToInt((pattern.AverageMoves - 20f) * 0.5f);
            var performanceAdjustment = pattern.CompletionRate < 0.7f ? 3 : 0;
            
            return Mathf.Clamp(baseMoves + playerAdjustment + performanceAdjustment, 5, 50);
        }

        private List<string> GetAlgorithmicPreferredMechanics(PlayerBehaviorPattern pattern)
        {
            var mechanics = new List<string>();
            
            if (pattern.AverageScore > 1200)
                mechanics.Add("combos");
            if (pattern.CompletionRate > 0.8f)
                mechanics.Add("matching");
            if (pattern.EngagementLevel > 0.7f)
                mechanics.Add("special_pieces");
            
            return mechanics;
        }

        private List<string> GetAlgorithmicEngagementTriggers(PlayerBehaviorPattern pattern)
        {
            var triggers = new List<string>();
            
            if (pattern.EngagementLevel > 0.8f)
                triggers.Add("challenge");
            if (pattern.AverageScore > 1000)
                triggers.Add("progression");
            if (pattern.CompletionRate > 0.9f)
                triggers.Add("variety");
            
            return triggers;
        }

        public void UpdatePlayerPattern(string playerId, LevelPerformanceData performance)
        {
            var pattern = GetPlayerBehaviorPattern(playerId);
            
            // Update pattern based on performance
            pattern.AverageScore = Mathf.Lerp(pattern.AverageScore, performance.Score, 0.1f);
            pattern.AverageMoves = Mathf.Lerp(pattern.AverageMoves, performance.MovesUsed, 0.1f);
            pattern.CompletionRate = Mathf.Lerp(pattern.CompletionRate, performance.Completed ? 1f : 0f, 0.1f);
            
            // Update difficulty preference
            if (performance.Completed && performance.MovesUsed < performance.MoveLimit * 0.5f)
            {
                pattern.PreferredDifficulty = Mathf.Min(1f, pattern.PreferredDifficulty + 0.05f);
            }
            else if (!performance.Completed)
            {
                pattern.PreferredDifficulty = Mathf.Max(0.1f, pattern.PreferredDifficulty - 0.05f);
            }
        }
    }

    // Data structures for algorithmic AI
    public class PlayerBehaviorPattern
    {
        public float AverageScore;
        public float AverageMoves;
        public float CompletionRate;
        public float PreferredDifficulty;
        public int ColorPreference;
        public float EngagementLevel;
    }

    public class LevelPerformanceHistory
    {
        public float AverageCompletionRate;
        public float AverageEngagement;
        public float DifficultyRating;
        public float PopularityScore;
    }
}