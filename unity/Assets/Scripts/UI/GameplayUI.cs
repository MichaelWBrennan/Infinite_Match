using UnityEngine;
using UnityEngine.UI;
using Evergreen.Match3;
using Evergreen.Game;
using Evergreen.AI;
using System.Collections.Generic;
using System.Collections;

public class GameplayUI : MonoBehaviour
{
    [SerializeField] private Transform gridRoot;
    [SerializeField] private GameObject tilePrefab;
    [SerializeField] private Button pauseButton;
    
    [Header("AI Gameplay Enhancement")]
    public bool enableAIGameplay = true;
    public bool enableAIHints = true;
    public bool enableAIDifficultyAdaptation = true;
    public bool enableAIPerformanceOptimization = true;
    public bool enableAIRealTimeAssistance = true;
    public float aiHintFrequency = 0.3f;
    public float aiAdaptationStrength = 0.8f;

    private Board _board;
    private AIGameplayAssistant _aiAssistant;
    private AIPerformanceOptimizer _aiOptimizer;
    private AIHintSystem _aiHintSystem;
    private AIDifficultyManager _aiDifficultyManager;

    void Start()
    {
        EnsureGridRoot();
        EnsureTilePrefab();
        InitializeUI();
        InitializeAISystems();

        var lm = OptimizedGameSystem.Instance;
        if (lm == null) { var go = new GameObject("LevelManager"); lm = go.AddComponent<LevelManager>(); }
        lm.LoadLevel(GameState.CurrentLevel);
        _board = new Board(lm.BoardSize, lm.NumColors);
        BuildGrid();
        
        if (enableAIGameplay)
        {
            StartAIGameplaySystems();
        }
    }

    private void InitializeUI()
    {
        // Setup button listeners
        if (pauseButton != null)
        {
            pauseButton.onClick.AddListener(OnPauseButtonClicked);
        }
    }

    public void OnPauseButtonClicked()
    {
        try
        {
            // Pause game logic here
            Debug.Log("Game paused");
            Logger.Info("Game paused", "Gameplay");
        }
        catch (System.Exception e)
        {
            Logger.LogException(e, "Gameplay");
        }
    }

    private void BuildGrid()
    {
        foreach (Transform c in gridRoot) Destroy(c.gameObject);

        // Add GridLayoutGroup for automatic tiling
        var glg = gridRoot.GetComponent<GridLayoutGroup>();
        if (glg == null)
        {
            glg = gridRoot.gameObject.AddComponent<GridLayoutGroup>();
            glg.cellSize = new Vector2(64, 64);
            glg.spacing = new Vector2(4, 4);
            glg.constraint = GridLayoutGroup.Constraint.FixedColumnCount;
            glg.constraintCount = _board.Size.x;
        }

        for (int y = 0; y < _board.Size.y; y++)
        {
            for (int x = 0; x < _board.Size.x; x++)
            {
                var go = Instantiate(tilePrefab, gridRoot);
                go.name = $"Cell_{x}_{y}";
            }
        }
    }

    private void EnsureGridRoot()
    {
        if (gridRoot != null) return;
        var canvas = GameObject.FindObjectOfType<Canvas>();
        if (canvas == null)
        {
            var cgo = new GameObject("Canvas");
            canvas = cgo.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            cgo.AddComponent<CanvasScaler>();
            cgo.AddComponent<GraphicRaycaster>();
        }
        var root = new GameObject("GridRoot");
        var rt = root.AddComponent<RectTransform>();
        root.transform.SetParent(canvas.transform, false);
        rt.anchorMin = new Vector2(0.1f, 0.1f);
        rt.anchorMax = new Vector2(0.9f, 0.9f);
        rt.offsetMin = rt.offsetMax = Vector2.zero;
        gridRoot = root.transform;
    }

    private void EnsureTilePrefab()
    {
        if (tilePrefab != null) return;
        var go = new GameObject("Tile");
        var img = go.AddComponent<Image>();
        img.color = new Color(0.9f, 0.9f, 0.9f, 1f);
        var btn = go.AddComponent<Button>();
        var rt = go.GetComponent<RectTransform>();
        rt.sizeDelta = new Vector2(64, 64);
        tilePrefab = go;
    }

    #region AI Gameplay Systems
    
    private void InitializeAISystems()
    {
        if (!enableAIGameplay) return;
        
        _aiAssistant = new AIGameplayAssistant();
        _aiOptimizer = new AIPerformanceOptimizer();
        _aiHintSystem = new AIHintSystem();
        _aiDifficultyManager = new AIDifficultyManager();
        
        Debug.Log("AI Gameplay Systems initialized");
    }
    
    private void StartAIGameplaySystems()
    {
        if (_aiAssistant != null)
        {
            _aiAssistant.Initialize(_board);
        }
        
        if (_aiOptimizer != null)
        {
            _aiOptimizer.StartOptimization();
        }
        
        if (_aiHintSystem != null)
        {
            StartCoroutine(AIHintCoroutine());
        }
        
        if (_aiDifficultyManager != null)
        {
            _aiDifficultyManager.StartDifficultyMonitoring();
        }
    }
    
    private IEnumerator AIHintCoroutine()
    {
        while (enableAIHints && _aiHintSystem != null)
        {
            yield return new WaitForSeconds(1f / aiHintFrequency);
            
            if (_aiHintSystem.ShouldShowHint())
            {
                var hint = _aiHintSystem.GenerateHint(_board);
                if (hint != null)
                {
                    ShowAIHint(hint);
                }
            }
        }
    }
    
    private void ShowAIHint(AIHint hint)
    {
        // Show visual hint on the board
        if (hint.Type == AIHintType.MoveSuggestion)
        {
            HighlightSuggestedMove(hint.Position, hint.TargetPosition);
        }
        else if (hint.Type == AIHintType.PatternRecognition)
        {
            HighlightPattern(hint.Positions);
        }
        else if (hint.Type == AIHintType.StrategyAdvice)
        {
            ShowStrategyAdvice(hint.Message);
        }
    }
    
    private void HighlightSuggestedMove(Vector2Int from, Vector2Int to)
    {
        // Highlight the suggested move with visual effects
        var fromTile = GetTileAt(from);
        var toTile = GetTileAt(to);
        
        if (fromTile != null)
        {
            StartCoroutine(AnimateTileHighlight(fromTile, Color.cyan, 1f));
        }
        
        if (toTile != null)
        {
            StartCoroutine(AnimateTileHighlight(toTile, Color.yellow, 1f));
        }
    }
    
    private void HighlightPattern(List<Vector2Int> positions)
    {
        foreach (var pos in positions)
        {
            var tile = GetTileAt(pos);
            if (tile != null)
            {
                StartCoroutine(AnimateTileHighlight(tile, Color.magenta, 0.5f));
            }
        }
    }
    
    private void ShowStrategyAdvice(string message)
    {
        // Show strategy advice as a temporary UI element
        Debug.Log($"AI Strategy Advice: {message}");
        // You could show this in a UI popup or notification
    }
    
    private GameObject GetTileAt(Vector2Int position)
    {
        // Find the tile at the given position
        string tileName = $"Cell_{position.x}_{position.y}";
        return GameObject.Find(tileName);
    }
    
    private IEnumerator AnimateTileHighlight(GameObject tile, Color highlightColor, float duration)
    {
        if (tile == null) yield break;
        
        var image = tile.GetComponent<Image>();
        if (image == null) yield break;
        
        Color originalColor = image.color;
        float elapsed = 0f;
        
        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            float t = Mathf.PingPong(elapsed * 2f, 1f);
            image.color = Color.Lerp(originalColor, highlightColor, t);
            yield return null;
        }
        
        image.color = originalColor;
    }
    
    public void OnPlayerMove(Vector2Int from, Vector2Int to)
    {
        if (_aiAssistant != null)
        {
            _aiAssistant.RecordPlayerMove(from, to);
        }
        
        if (_aiOptimizer != null)
        {
            _aiOptimizer.AnalyzeMove(from, to);
        }
        
        if (_aiDifficultyManager != null)
        {
            _aiDifficultyManager.UpdateDifficultyBasedOnMove(from, to);
        }
    }
    
    public void OnMatchFound(List<Vector2Int> matchedPositions, int matchSize)
    {
        if (_aiAssistant != null)
        {
            _aiAssistant.RecordMatch(matchedPositions, matchSize);
        }
        
        if (_aiOptimizer != null)
        {
            _aiOptimizer.OptimizeForMatch(matchedPositions, matchSize);
        }
    }
    
    public void OnLevelComplete(int score, int moves, float time)
    {
        if (_aiAssistant != null)
        {
            _aiAssistant.RecordLevelCompletion(score, moves, time);
        }
        
        if (_aiDifficultyManager != null)
        {
            _aiDifficultyManager.AdjustDifficultyForNextLevel(score, moves, time);
        }
    }
    
    #endregion

    void OnDestroy()
    {
        // Clean up button listeners
        if (pauseButton != null)
        {
            pauseButton.onClick.RemoveListener(OnPauseButtonClicked);
        }
        
        // Clean up AI systems
        if (_aiAssistant != null)
        {
            _aiAssistant.Cleanup();
        }
        
        if (_aiOptimizer != null)
        {
            _aiOptimizer.StopOptimization();
        }
        
        if (_aiDifficultyManager != null)
        {
            _aiDifficultyManager.StopDifficultyMonitoring();
        }
    }
}

#region AI Gameplay Data Structures

public class AIGameplayAssistant
{
    private Board _board;
    private List<PlayerMove> _playerMoves = new List<PlayerMove>();
    private List<MatchData> _matches = new List<MatchData>();
    private PlayerPerformanceProfile _performanceProfile;
    
    public void Initialize(Board board)
    {
        _board = board;
        _performanceProfile = new PlayerPerformanceProfile();
    }
    
    public void RecordPlayerMove(Vector2Int from, Vector2Int to)
    {
        var move = new PlayerMove
        {
            From = from,
            To = to,
            Timestamp = Time.time,
            BoardState = GetCurrentBoardState()
        };
        
        _playerMoves.Add(move);
        _performanceProfile.UpdateWithMove(move);
    }
    
    public void RecordMatch(List<Vector2Int> positions, int matchSize)
    {
        var match = new MatchData
        {
            Positions = positions,
            Size = matchSize,
            Timestamp = Time.time,
            Score = CalculateMatchScore(matchSize)
        };
        
        _matches.Add(match);
        _performanceProfile.UpdateWithMatch(match);
    }
    
    public void RecordLevelCompletion(int score, int moves, float time)
    {
        _performanceProfile.UpdateWithLevelCompletion(score, moves, time);
    }
    
    private BoardState GetCurrentBoardState()
    {
        // Convert current board state to data structure
        return new BoardState
        {
            Tiles = _board.GetAllTiles(),
            Timestamp = Time.time
        };
    }
    
    private int CalculateMatchScore(int matchSize)
    {
        return matchSize * 100; // Simple scoring
    }
    
    public void Cleanup()
    {
        _playerMoves.Clear();
        _matches.Clear();
    }
}

public class AIPerformanceOptimizer
{
    private bool _isOptimizing = false;
    private List<OptimizationRule> _optimizationRules = new List<OptimizationRule>();
    
    public void StartOptimization()
    {
        _isOptimizing = true;
        InitializeOptimizationRules();
    }
    
    public void StopOptimization()
    {
        _isOptimizing = false;
    }
    
    public void AnalyzeMove(Vector2Int from, Vector2Int to)
    {
        if (!_isOptimizing) return;
        
        // Analyze move efficiency and suggest optimizations
        var moveEfficiency = CalculateMoveEfficiency(from, to);
        
        if (moveEfficiency < 0.5f)
        {
            SuggestMoveOptimization(from, to);
        }
    }
    
    public void OptimizeForMatch(List<Vector2Int> positions, int matchSize)
    {
        if (!_isOptimizing) return;
        
        // Optimize for better matches
        if (matchSize < 3)
        {
            SuggestBetterMatchStrategy();
        }
    }
    
    private void InitializeOptimizationRules()
    {
        _optimizationRules.Add(new OptimizationRule
        {
            Name = "Efficient Moves",
            Condition = (move) => move.Efficiency > 0.7f,
            Action = () => Debug.Log("Good move efficiency!")
        });
        
        _optimizationRules.Add(new OptimizationRule
        {
            Name = "Pattern Recognition",
            Condition = (move) => HasPattern(move),
            Action = () => Debug.Log("Pattern detected!")
        });
    }
    
    private float CalculateMoveEfficiency(Vector2Int from, Vector2Int to)
    {
        // Calculate how efficient this move is
        float distance = Vector2Int.Distance(from, to);
        return Mathf.Clamp01(1f - distance / 10f);
    }
    
    private void SuggestMoveOptimization(Vector2Int from, Vector2Int to)
    {
        Debug.Log($"Consider a more efficient move from {from} to {to}");
    }
    
    private void SuggestBetterMatchStrategy()
    {
        Debug.Log("Try to create larger matches for better scores");
    }
    
    private bool HasPattern(PlayerMove move)
    {
        // Check if move follows a known pattern
        return false; // Simplified
    }
}

public class AIHintSystem
{
    private float _lastHintTime = 0f;
    private float _hintCooldown = 2f;
    private List<AIHint> _availableHints = new List<AIHint>();
    
    public bool ShouldShowHint()
    {
        return Time.time - _lastHintTime > _hintCooldown;
    }
    
    public AIHint GenerateHint(Board board)
    {
        _lastHintTime = Time.time;
        
        // Generate different types of hints
        var hintType = (AIHintType)Random.Range(0, 3);
        
        switch (hintType)
        {
            case AIHintType.MoveSuggestion:
                return GenerateMoveSuggestion(board);
            case AIHintType.PatternRecognition:
                return GeneratePatternHint(board);
            case AIHintType.StrategyAdvice:
                return GenerateStrategyAdvice();
            default:
                return null;
        }
    }
    
    private AIHint GenerateMoveSuggestion(Board board)
    {
        // Find a good move to suggest
        var goodMoves = FindGoodMoves(board);
        if (goodMoves.Count > 0)
        {
            var move = goodMoves[Random.Range(0, goodMoves.Count)];
            return new AIHint
            {
                Type = AIHintType.MoveSuggestion,
                Position = move.From,
                TargetPosition = move.To,
                Message = "Try this move for a good match!"
            };
        }
        
        return null;
    }
    
    private AIHint GeneratePatternHint(Board board)
    {
        // Find patterns on the board
        var patterns = FindPatterns(board);
        if (patterns.Count > 0)
        {
            var pattern = patterns[Random.Range(0, patterns.Count)];
            return new AIHint
            {
                Type = AIHintType.PatternRecognition,
                Positions = pattern,
                Message = "Look for this pattern!"
            };
        }
        
        return null;
    }
    
    private AIHint GenerateStrategyAdvice()
    {
        var advice = new string[]
        {
            "Focus on creating larger matches for better scores",
            "Look for opportunities to create special pieces",
            "Plan your moves to create chain reactions",
            "Try to clear the bottom rows first"
        };
        
        return new AIHint
        {
            Type = AIHintType.StrategyAdvice,
            Message = advice[Random.Range(0, advice.Length)]
        };
    }
    
    private List<MoveSuggestion> FindGoodMoves(Board board)
    {
        // Simplified - find moves that would create matches
        return new List<MoveSuggestion>();
    }
    
    private List<List<Vector2Int>> FindPatterns(Board board)
    {
        // Simplified - find patterns on the board
        return new List<List<Vector2Int>>();
    }
}

public class AIDifficultyManager
{
    private bool _isMonitoring = false;
    private float _currentDifficulty = 0.5f;
    private PlayerDifficultyProfile _difficultyProfile;
    
    public void StartDifficultyMonitoring()
    {
        _isMonitoring = true;
        _difficultyProfile = new PlayerDifficultyProfile();
    }
    
    public void StopDifficultyMonitoring()
    {
        _isMonitoring = false;
    }
    
    public void UpdateDifficultyBasedOnMove(Vector2Int from, Vector2Int to)
    {
        if (!_isMonitoring) return;
        
        // Adjust difficulty based on player performance
        var moveQuality = AssessMoveQuality(from, to);
        _difficultyProfile.UpdateWithMove(moveQuality);
        
        AdjustDifficulty();
    }
    
    public void AdjustDifficultyForNextLevel(int score, int moves, float time)
    {
        if (!_isMonitoring) return;
        
        var performance = AssessLevelPerformance(score, moves, time);
        _difficultyProfile.UpdateWithLevelCompletion(performance);
        
        AdjustDifficulty();
    }
    
    private float AssessMoveQuality(Vector2Int from, Vector2Int to)
    {
        // Assess how good this move was
        return Random.Range(0.3f, 1f); // Simplified
    }
    
    private float AssessLevelPerformance(int score, int moves, float time)
    {
        // Assess overall level performance
        float scoreRatio = score / 1000f;
        float moveEfficiency = 1f - (moves / 50f);
        float timeEfficiency = 1f - (time / 300f);
        
        return (scoreRatio + moveEfficiency + timeEfficiency) / 3f;
    }
    
    private void AdjustDifficulty()
    {
        var performance = _difficultyProfile.GetAveragePerformance();
        
        if (performance > 0.8f)
        {
            _currentDifficulty = Mathf.Min(1f, _currentDifficulty + 0.1f);
        }
        else if (performance < 0.4f)
        {
            _currentDifficulty = Mathf.Max(0.1f, _currentDifficulty - 0.1f);
        }
        
        ApplyDifficultyAdjustments();
    }
    
    private void ApplyDifficultyAdjustments()
    {
        // Apply difficulty adjustments to the game
        Debug.Log($"AI adjusted difficulty to: {_currentDifficulty:F2}");
    }
}

#region AI Data Structures

public class AIHint
{
    public AIHintType Type;
    public Vector2Int Position;
    public Vector2Int TargetPosition;
    public List<Vector2Int> Positions;
    public string Message;
}

public enum AIHintType
{
    MoveSuggestion,
    PatternRecognition,
    StrategyAdvice
}

public class PlayerMove
{
    public Vector2Int From;
    public Vector2Int To;
    public float Timestamp;
    public BoardState BoardState;
    public float Efficiency;
}

public class MatchData
{
    public List<Vector2Int> Positions;
    public int Size;
    public float Timestamp;
    public int Score;
}

public class BoardState
{
    public Tile[,] Tiles;
    public float Timestamp;
}

public class PlayerPerformanceProfile
{
    public float AverageMoveEfficiency;
    public float AverageMatchSize;
    public float AverageScore;
    public int TotalMoves;
    public int TotalMatches;
    
    public void UpdateWithMove(PlayerMove move)
    {
        TotalMoves++;
        // Update averages
    }
    
    public void UpdateWithMatch(MatchData match)
    {
        TotalMatches++;
        // Update averages
    }
    
    public void UpdateWithLevelCompletion(int score, int moves, float time)
    {
        // Update profile with level completion data
    }
}

public class OptimizationRule
{
    public string Name;
    public System.Func<PlayerMove, bool> Condition;
    public System.Action Action;
}

public class MoveSuggestion
{
    public Vector2Int From;
    public Vector2Int To;
    public float Confidence;
}

public class PlayerDifficultyProfile
{
    public float AveragePerformance;
    public int TotalMoves;
    public int CompletedLevels;
    
    public void UpdateWithMove(float moveQuality)
    {
        TotalMoves++;
        // Update average performance
    }
    
    public void UpdateWithLevelCompletion(float performance)
    {
        CompletedLevels++;
        // Update average performance
    }
    
    public float GetAveragePerformance()
    {
        return AveragePerformance;
    }
}

#endregion
