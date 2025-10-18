using System.Collections.Generic;
using System.IO;
using UnityEngine;
using Evergreen.Match3;
using Evergreen.Game;
using Evergreen.Data;
using Evergreen.Core;
using Evergreen.AI;
using Core;

public class LevelManager : MonoBehaviour
{
    [Header("Level Settings")]
    public Vector2Int BoardSize = new Vector2Int(8, 8);
    public int NumColors = 5;
    public int MoveLimit = 20;
    public int[] ScoreStars = new []{500, 1500, 3000};

    [Header("Cache Settings")]
    public bool enableCaching = true;
    public int preloadLevels = 5;

    [Header("AI Settings")]
    public bool enableAILevelSelection = true;
    public bool enableAIDifficultyAdaptation = true;
    public bool enableAIRealTimeAdaptation = true;
    public float aiAdaptationStrength = 0.8f;

    public Dictionary<string, object> LevelConfig { get; private set; }
    
    private LevelCacheManager _cacheManager;
    private AIPersonalizationSystem _aiPersonalization;
    private AILevelPredictor _aiPredictor;
    private AILevelOptimizer _aiOptimizer;

    void Start()
    {
        _cacheManager = LevelCacheManager.Instance;
        _aiPersonalization = AIPersonalizationSystem.Instance;
        _aiPredictor = new AILevelPredictor();
        _aiOptimizer = new AILevelOptimizer();
        
        if (enableCaching)
        {
            // Preload next few levels
            PreloadNextLevels();
        }
    }

    public void LoadLevel(int id, string playerId = null)
    {
        // Check energy before loading level
        var gameManager = GameManager.Instance;
        if (gameManager != null && !gameManager.CanPlayLevel())
        {
            Debug.Log("[LevelManager] Not enough energy to play level");
            ShowEnergyPurchaseUI();
            return;
        }
        
        try
        {
            // AI-enhanced level selection
            if (enableAILevelSelection && !string.IsNullOrEmpty(playerId))
            {
                var aiLevelRecommendation = _aiPredictor?.GetOptimalLevel(playerId, id);
                if (aiLevelRecommendation != null)
                {
                    id = aiLevelRecommendation.RecommendedLevelId;
                    Debug.Log($"[LevelManager] AI recommended level {id} for player {playerId}");
                }
            }

            if (enableCaching)
            {
                LevelConfig = _cacheManager.GetLevelData(id);
            }
            else
            {
                LoadLevelFromFile(id);
            }
            
            // AI-enhanced configuration application
            ApplyConfigWithAI(playerId);
            
            // Consume energy for level play
            if (gameManager != null)
            {
                gameManager.TryConsumeEnergy(1);
                gameManager.TrackPlayerAction(playerId ?? "player_123", "level_start", new Dictionary<string, object>
                {
                    ["level_id"] = id,
                    ["board_size"] = BoardSize,
                    ["move_limit"] = MoveLimit,
                    ["ai_enhanced"] = enableAILevelSelection
                });
            }
            
            // Preload next levels if caching is enabled
            if (enableCaching)
            {
                PreloadNextLevels();
            }
        }
        catch (System.Exception e)
        {
            Debug.LogError($"Failed to load level {id}: {e.Message}");
            LevelConfig = new Dictionary<string, object>();
            ApplyConfig();
        }
    }
    
    private void ShowEnergyPurchaseUI()
    {
        // This would show your energy purchase UI
        Debug.Log("[LevelManager] Show energy purchase UI");
        // Example: UIManager.Instance.ShowEnergyPurchasePanel();
    }

    private void LoadLevelFromFile(int id)
    {
        try
        {
            string fileName = $"level_{id}.json";
            string txt = RobustFileManager.ReadTextFile(fileName, FileLocation.StreamingAssets, "levels");
            
            if (!string.IsNullOrEmpty(txt))
            {
                LevelConfig = JsonUtility.FromJsonToDictionary(txt);
                Debug.Log($"[LevelManager] Successfully loaded level {id} from file");
            }
            else
            {
                Debug.LogWarning($"[LevelManager] Failed to load level {id} from file, using default config");
                LevelConfig = new Dictionary<string, object>();
            }
        }
        catch (System.Exception ex)
        {
            Debug.LogError($"[LevelManager] Error loading level {id}: {ex.Message}");
            LevelConfig = new Dictionary<string, object>();
        }
    }

    private void PreloadNextLevels()
    {
        if (_cacheManager != null)
        {
            var currentLevel = GameState.CurrentLevel;
            _cacheManager.PreloadLevels(currentLevel + 1, currentLevel + preloadLevels);
        }
    }

    private void ApplyConfig()
    {
        BoardSize = new Vector2Int(8, 8);
        NumColors = 5;
        MoveLimit = 20;
        ScoreStars = new []{500, 1500, 3000};
        if (LevelConfig != null)
        {
            if (LevelConfig.TryGetValue("size", out var sizeObj))
            {
                var arr = sizeObj as List<object>;
                if (arr != null && arr.Count >= 2)
                {
                    BoardSize = new Vector2Int((int)(long)arr[0], (int)(long)arr[1]);
                }
            }
            if (LevelConfig.TryGetValue("num_colors", out var nco)) NumColors = (int)(long)nco;
            if (LevelConfig.TryGetValue("move_limit", out var mlo)) MoveLimit = (int)(long)mlo;
            if (LevelConfig.TryGetValue("score_stars", out var sso))
            {
                var arr = sso as List<object>;
                if (arr != null && arr.Count >= 3)
                {
                    ScoreStars = new []{ (int)(long)arr[0], (int)(long)arr[1], (int)(long)arr[2] };
                }
            }
        }
    }

    private void ApplyConfigWithAI(string playerId)
    {
        // Apply base configuration first
        ApplyConfig();
        
        // Apply AI enhancements if enabled and player ID provided
        if (enableAIDifficultyAdaptation && !string.IsNullOrEmpty(playerId) && _aiPersonalization != null)
        {
            var playerProfile = _aiPersonalization.GetPlayerProfile(playerId);
            if (playerProfile != null)
            {
                // AI difficulty adjustment
                var difficultyAdjustment = _aiPersonalization.GetDifficultyAdjustment(playerId);
                MoveLimit = Mathf.RoundToInt(MoveLimit * difficultyAdjustment);
                
                // AI color complexity adjustment
                if (playerProfile.contentPreference.contentTypes.ContainsKey("colorful"))
                {
                    NumColors = Mathf.Min(7, NumColors + 1);
                }
                
                // AI board size optimization
                var optimalBoardSize = _aiPredictor?.GetOptimalBoardSize(playerId, playerProfile);
                if (optimalBoardSize.HasValue)
                {
                    BoardSize = optimalBoardSize.Value;
                }
                
                // AI score star adjustment
                var scoreMultiplier = _aiPredictor?.GetScoreMultiplier(playerId, playerProfile);
                if (scoreMultiplier.HasValue)
                {
                    for (int i = 0; i < ScoreStars.Length; i++)
                    {
                        ScoreStars[i] = Mathf.RoundToInt(ScoreStars[i] * scoreMultiplier.Value);
                    }
                }
                
                Debug.Log($"[LevelManager] Applied AI adjustments for player {playerId}: " +
                         $"Moves={MoveLimit}, Colors={NumColors}, Board={BoardSize}");
            }
        }
    }

    // AI Enhancement Methods
    public void AdaptLevelInRealTime(string playerId, PlayerPerformance performance)
    {
        if (!enableAIRealTimeAdaptation || string.IsNullOrEmpty(playerId)) return;
        
        var adaptation = _aiOptimizer?.CalculateRealTimeAdaptation(performance, playerId);
        if (adaptation != null)
        {
            ApplyRealTimeAdaptation(adaptation);
            Debug.Log($"[LevelManager] Applied real-time AI adaptation for player {playerId}");
        }
    }

    private void ApplyRealTimeAdaptation(AILevelAdaptation adaptation)
    {
        if (adaptation.DifficultyAdjustment != 0)
        {
            MoveLimit = Mathf.Max(5, MoveLimit + adaptation.DifficultyAdjustment);
        }
        
        if (adaptation.ColorAdjustment != 0)
        {
            NumColors = Mathf.Clamp(NumColors + adaptation.ColorAdjustment, 3, 7);
        }
    }

    public AILevelRecommendation GetAILevelRecommendation(string playerId, int currentLevel)
    {
        return _aiPredictor?.GetOptimalLevel(playerId, currentLevel);
    }
}

// AI Helper Classes
public class AILevelPredictor
{
    public AILevelRecommendation GetOptimalLevel(string playerId, int currentLevel)
    {
        // Simplified AI prediction - in a real system, this would use machine learning
        var recommendation = new AILevelRecommendation
        {
            RecommendedLevelId = currentLevel,
            PredictedEngagement = 0.8f,
            PredictedCompletionTime = 300f,
            PredictedDifficulty = 0.5f,
            RecommendedPowerups = new List<string> { "hint", "shuffle" },
            ChurnRisk = 0.2f
        };
        
        return recommendation;
    }

    public Vector2Int? GetOptimalBoardSize(string playerId, PlayerProfile profile)
    {
        // AI-driven board size optimization
        if (profile.performanceProfile.averageScore > 1000)
            return new Vector2Int(9, 9);
        else if (profile.performanceProfile.averageScore > 500)
            return new Vector2Int(8, 8);
        else
            return new Vector2Int(7, 7);
    }

    public float? GetScoreMultiplier(string playerId, PlayerProfile profile)
    {
        // AI-driven score adjustment
        if (profile.performanceProfile.averageScore > 1500)
            return 1.2f;
        else if (profile.performanceProfile.averageScore < 500)
            return 0.8f;
        else
            return 1.0f;
    }
}

public class AILevelOptimizer
{
    public AILevelAdaptation CalculateRealTimeAdaptation(PlayerPerformance performance, string playerId)
    {
        var adaptation = new AILevelAdaptation();
        
        // AI-driven real-time difficulty adjustment
        if (performance.MovesUsed > performance.MoveLimit * 0.8f)
        {
            adaptation.DifficultyAdjustment = 2; // Give more moves
        }
        else if (performance.MovesUsed < performance.MoveLimit * 0.3f)
        {
            adaptation.DifficultyAdjustment = -1; // Reduce moves for challenge
        }
        
        // AI-driven color complexity adjustment
        if (performance.ColorConfusion > 0.7f)
        {
            adaptation.ColorAdjustment = -1; // Reduce colors
        }
        else if (performance.ColorConfusion < 0.3f)
        {
            adaptation.ColorAdjustment = 1; // Increase colors
        }
        
        return adaptation;
    }
}

// Data Structures
public class AILevelRecommendation
{
    public int RecommendedLevelId;
    public float PredictedEngagement;
    public float PredictedCompletionTime;
    public float PredictedDifficulty;
    public List<string> RecommendedPowerups;
    public float ChurnRisk;
}

public class AILevelAdaptation
{
    public int DifficultyAdjustment;
    public int ColorAdjustment;
    public List<string> RecommendedActions;
}

public class PlayerPerformance
{
    public int MovesUsed;
    public int MoveLimit;
    public float ColorConfusion;
    public float CompletionTime;
    public int Score;
    public bool Completed;
}
