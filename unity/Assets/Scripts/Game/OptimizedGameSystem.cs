using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using Evergreen.Core;
using Evergreen.Analytics;
using Evergreen.Economy;
using Evergreen.Social;
using Evergreen.ARPU;

namespace Evergreen.Game
{
    /// <summary>
    /// OPTIMIZED GAME SYSTEM - Consolidated Game Management
    /// Combines: Board, LevelManager, OptimizedLevelManager, EnergySystem, GameState, GameIntegration
    /// Reduces 6+ files to 1 optimized system
    /// </summary>
    public class OptimizedGameSystem : MonoBehaviour
    {
        [Header("Game Configuration")]
        public int boardWidth = 8;
        public int boardHeight = 8;
        public int minMatchLength = 3;
        public float tileSize = 1f;
        public float animationDuration = 0.3f;
        
        [Header("Energy System")]
        public int maxEnergy = 100;
        public int energyRegenRate = 1;
        public float energyRegenInterval = 30f;
        public int energyPerMove = 1;
        
        [Header("Level System")]
        public int currentLevel = 1;
        public int maxLevel = 100;
        public int targetScore = 1000;
        public int movesRemaining = 30;
        public float timeLimit = 60f;
        
        [Header("Match-3 Settings")]
        public bool enableSpecialTiles = true;
        public bool enableComboSystem = true;
        public bool enableCascadeEffects = true;
        public float specialTileChance = 0.1f;
        
        [Header("Performance Settings")]
        public bool enableObjectPooling = true;
        public bool enableBatchUpdates = true;
        public int maxPooledTiles = 200;
        public float updateInterval = 0.1f;
        
        // Game Board
        private Tile[,] _board;
        private List<Tile> _selectedTiles = new List<Tile>();
        private List<Match> _currentMatches = new List<Match>();
        private bool _isProcessingMatches = false;
        private bool _isAnimating = false;
        
        // Energy System
        private int _currentEnergy;
        private float _lastEnergyRegen;
        private Coroutine _energyRegenCoroutine;
        
        // Level Management
        private LevelData _currentLevelData;
        private List<LevelData> _levelDatabase = new List<LevelData>();
        private int _currentScore = 0;
        private int _currentMoves = 0;
        private float _currentTime = 0f;
        private bool _isLevelComplete = false;
        
        // Object Pooling
        private Dictionary<TileType, Queue<Tile>> _tilePools = new Dictionary<TileType, Queue<Tile>>();
        private List<Tile> _activeTiles = new List<Tile>();
        
        // Performance Optimization
        private List<GameUpdateRequest> _pendingUpdates = new List<GameUpdateRequest>();
        private Coroutine _batchUpdateCoroutine;
        
        // System References
        private OptimizedCoreSystem _coreSystem;
        private GameAnalyticsManager _analyticsManager;
        private IEconomyManager _economyManager;
        private AdvancedSocialSystem _socialSystem;
        
        // Events
        public static event Action<int> OnScoreChanged;
        public static event Action<int> OnMovesChanged;
        public static event Action<int> OnEnergyChanged;
        public static event Action<int> OnLevelChanged;
        public static event Action<Match> OnMatchFound;
        public static event Action<Combo> OnComboCreated;
        public static event Action<bool> OnLevelComplete;
        public static event Action<Tile> OnTileSelected;
        public static event Action<Tile> OnTileDeselected;
        
        public static OptimizedGameSystem Instance { get; private set; }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeGameSystem();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            StartNewLevel(currentLevel);
            StartBatchUpdates();
        }
        
        #region Initialization
        
        private void InitializeGameSystem()
        {
            Log("🎮 Initializing Optimized Game System...");
            
            // Get system references
            _coreSystem = OptimizedCoreSystem.Instance;
            _analyticsManager = _coreSystem?.Resolve<GameAnalyticsManager>();
            _economyManager = _coreSystem?.Resolve<IEconomyManager>();
            _socialSystem = _coreSystem?.Resolve<AdvancedSocialSystem>();
            
            // Initialize board
            InitializeBoard();
            
            // Initialize energy system
            InitializeEnergySystem();
            
            // Initialize level system
            InitializeLevelSystem();
            
            // Initialize object pooling
            if (enableObjectPooling)
            {
                InitializeObjectPooling();
            }
            
            // Load level database
            LoadLevelDatabase();
            
            Log("✅ Game System Initialized");
        }
        
        private void InitializeBoard()
        {
            _board = new Tile[boardWidth, boardHeight];
            _selectedTiles = new List<Tile>();
            _currentMatches = new List<Match>();
            
            Log("Game board initialized");
        }
        
        private void InitializeEnergySystem()
        {
            _currentEnergy = maxEnergy;
            _lastEnergyRegen = Time.time;
            
            if (_energyRegenCoroutine != null)
            {
                StopCoroutine(_energyRegenCoroutine);
            }
            _energyRegenCoroutine = StartCoroutine(EnergyRegenerationCoroutine());
            
            Log("Energy system initialized");
        }
        
        private void InitializeLevelSystem()
        {
            _currentLevel = 1;
            _currentScore = 0;
            _currentMoves = 0;
            _currentTime = 0f;
            _isLevelComplete = false;
            
            Log("Level system initialized");
        }
        
        private void InitializeObjectPooling()
        {
            var tileTypes = System.Enum.GetValues(typeof(TileType)).Cast<TileType>();
            
            foreach (var tileType in tileTypes)
            {
                _tilePools[tileType] = new Queue<Tile>();
            }
            
            Log("Object pooling initialized");
        }
        
        private void LoadLevelDatabase()
        {
            // Load level data from resources or generate procedurally
            for (int i = 1; i <= maxLevel; i++)
            {
                var levelData = GenerateLevelData(i);
                _levelDatabase.Add(levelData);
            }
            
            Log($"Level database loaded: {_levelDatabase.Count} levels");
        }
        
        private LevelData GenerateLevelData(int level)
        {
            return new LevelData
            {
                level = level,
                targetScore = 1000 + (level * 200),
                movesLimit = 30 - (level / 10),
                timeLimit = 60f + (level * 5f),
                specialTilesEnabled = level >= 5,
                comboSystemEnabled = level >= 10,
                cascadeEffectsEnabled = level >= 15
            };
        }
        
        #endregion
        
        #region Game Board Management
        
        public void StartNewLevel(int level)
        {
            if (level < 1 || level > maxLevel)
            {
                LogError($"Invalid level: {level}");
                return;
            }
            
            _currentLevel = level;
            _currentLevelData = _levelDatabase[level - 1];
            
            // Reset game state
            _currentScore = 0;
            _currentMoves = 0;
            _currentTime = 0f;
            _isLevelComplete = false;
            
            // Update UI
            OnLevelChanged?.Invoke(_currentLevel);
            OnScoreChanged?.Invoke(_currentScore);
            OnMovesChanged?.Invoke(_currentMoves);
            
            // Generate new board
            GenerateBoard();
            
            Log($"Started level {level}");
        }
        
        private void GenerateBoard()
        {
            // Clear existing board
            ClearBoard();
            
            // Generate new tiles
            for (int x = 0; x < boardWidth; x++)
            {
                for (int y = 0; y < boardHeight; y++)
                {
                    var tile = CreateTile(x, y);
                    _board[x, y] = tile;
                    _activeTiles.Add(tile);
                }
            }
            
            // Ensure no initial matches
            RemoveInitialMatches();
        }
        
        private void ClearBoard()
        {
            foreach (var tile in _activeTiles)
            {
                if (tile != null)
                {
                    ReturnTileToPool(tile);
                }
            }
            
            _activeTiles.Clear();
            
            for (int x = 0; x < boardWidth; x++)
            {
                for (int y = 0; y < boardHeight; y++)
                {
                    _board[x, y] = null;
                }
            }
        }
        
        private Tile CreateTile(int x, int y)
        {
            var tileType = GetRandomTileType();
            Tile tile;
            
            if (enableObjectPooling && _tilePools[tileType].Count > 0)
            {
                tile = _tilePools[tileType].Dequeue();
            }
            else
            {
                tile = new Tile();
            }
            
            tile.Initialize(tileType, x, y);
            tile.transform.position = new Vector3(x * tileSize, y * tileSize, 0);
            
            return tile;
        }
        
        private TileType GetRandomTileType()
        {
            var tileTypes = System.Enum.GetValues(typeof(TileType)).Cast<TileType>().ToArray();
            return tileTypes[UnityEngine.Random.Range(0, tileTypes.Length)];
        }
        
        private void RemoveInitialMatches()
        {
            bool hasMatches = true;
            int attempts = 0;
            const int maxAttempts = 100;
            
            while (hasMatches && attempts < maxAttempts)
            {
                hasMatches = false;
                var matches = FindMatches();
                
                if (matches.Count > 0)
                {
                    hasMatches = true;
                    foreach (var match in matches)
                    {
                        foreach (var tile in match.tiles)
                        {
                            var newTileType = GetRandomTileType();
                            while (newTileType == tile.tileType)
                            {
                                newTileType = GetRandomTileType();
                            }
                            tile.tileType = newTileType;
                        }
                    }
                }
                
                attempts++;
            }
        }
        
        #endregion
        
        #region Tile Interaction
        
        public void SelectTile(Tile tile)
        {
            if (_isProcessingMatches || _isAnimating) return;
            if (tile == null || !tile.IsSelectable()) return;
            
            if (_selectedTiles.Count == 0)
            {
                // First tile selection
                _selectedTiles.Add(tile);
                tile.SetSelected(true);
                OnTileSelected?.Invoke(tile);
            }
            else if (_selectedTiles.Count == 1)
            {
                var firstTile = _selectedTiles[0];
                
                if (tile == firstTile)
                {
                    // Deselect same tile
                    DeselectTile(tile);
                }
                else if (IsAdjacent(firstTile, tile))
                {
                    // Select adjacent tile
                    _selectedTiles.Add(tile);
                    tile.SetSelected(true);
                    OnTileSelected?.Invoke(tile);
                    
                    // Try to swap tiles
                    StartCoroutine(SwapTiles(firstTile, tile));
                }
                else
                {
                    // Deselect first tile and select new one
                    DeselectTile(firstTile);
                    _selectedTiles.Add(tile);
                    tile.SetSelected(true);
                    OnTileSelected?.Invoke(tile);
                }
            }
        }
        
        public void DeselectTile(Tile tile)
        {
            if (_selectedTiles.Contains(tile))
            {
                _selectedTiles.Remove(tile);
                tile.SetSelected(false);
                OnTileDeselected?.Invoke(tile);
            }
        }
        
        private bool IsAdjacent(Tile tile1, Tile tile2)
        {
            int dx = Mathf.Abs(tile1.x - tile2.x);
            int dy = Mathf.Abs(tile1.y - tile2.y);
            return (dx == 1 && dy == 0) || (dx == 0 && dy == 1);
        }
        
        private IEnumerator SwapTiles(Tile tile1, Tile tile2)
        {
            _isAnimating = true;
            
            // Swap positions
            var pos1 = tile1.transform.position;
            var pos2 = tile2.transform.position;
            
            float elapsed = 0f;
            while (elapsed < animationDuration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / animationDuration;
                
                tile1.transform.position = Vector3.Lerp(pos1, pos2, t);
                tile2.transform.position = Vector3.Lerp(pos2, pos1, t);
                
                yield return null;
            }
            
            // Swap in board array
            _board[tile1.x, tile1.y] = tile2;
            _board[tile2.x, tile2.y] = tile1;
            
            // Update tile positions
            int tempX = tile1.x;
            int tempY = tile1.y;
            tile1.x = tile2.x;
            tile1.y = tile2.y;
            tile2.x = tempX;
            tile2.y = tempY;
            
            // Check for matches
            var matches = FindMatches();
            
            if (matches.Count > 0)
            {
                // Valid swap - process matches
                _currentMatches = matches;
                StartCoroutine(ProcessMatches());
            }
            else
            {
                // Invalid swap - swap back
                yield return StartCoroutine(SwapTiles(tile2, tile1));
            }
            
            // Clear selection
            ClearSelection();
            _isAnimating = false;
        }
        
        private void ClearSelection()
        {
            foreach (var tile in _selectedTiles)
            {
                tile.SetSelected(false);
                OnTileDeselected?.Invoke(tile);
            }
            _selectedTiles.Clear();
        }
        
        #endregion
        
        #region Match Detection
        
        private List<Match> FindMatches()
        {
            var matches = new List<Match>();
            
            // Find horizontal matches
            for (int y = 0; y < boardHeight; y++)
            {
                for (int x = 0; x < boardWidth - 2; x++)
                {
                    var match = FindHorizontalMatch(x, y);
                    if (match != null)
                    {
                        matches.Add(match);
                    }
                }
            }
            
            // Find vertical matches
            for (int x = 0; x < boardWidth; x++)
            {
                for (int y = 0; y < boardHeight - 2; y++)
                {
                    var match = FindVerticalMatch(x, y);
                    if (match != null)
                    {
                        matches.Add(match);
                    }
                }
            }
            
            return matches;
        }
        
        private Match FindHorizontalMatch(int startX, int y)
        {
            var tiles = new List<Tile>();
            var tileType = _board[startX, y]?.tileType;
            
            if (tileType == null) return null;
            
            for (int x = startX; x < boardWidth; x++)
            {
                var tile = _board[x, y];
                if (tile != null && tile.tileType == tileType)
                {
                    tiles.Add(tile);
                }
                else
                {
                    break;
                }
            }
            
            return tiles.Count >= minMatchLength ? new Match(tiles) : null;
        }
        
        private Match FindVerticalMatch(int x, int startY)
        {
            var tiles = new List<Tile>();
            var tileType = _board[x, startY]?.tileType;
            
            if (tileType == null) return null;
            
            for (int y = startY; y < boardHeight; y++)
            {
                var tile = _board[x, y];
                if (tile != null && tile.tileType == tileType)
                {
                    tiles.Add(tile);
                }
                else
                {
                    break;
                }
            }
            
            return tiles.Count >= minMatchLength ? new Match(tiles) : null;
        }
        
        #endregion
        
        #region Match Processing
        
        private IEnumerator ProcessMatches()
        {
            _isProcessingMatches = true;
            
            while (_currentMatches.Count > 0)
            {
                // Process current matches
                foreach (var match in _currentMatches)
                {
                    ProcessMatch(match);
                }
                
                // Remove matched tiles
                yield return StartCoroutine(RemoveMatchedTiles());
                
                // Drop tiles down
                yield return StartCoroutine(DropTiles());
                
                // Fill empty spaces
                yield return StartCoroutine(FillEmptySpaces());
                
                // Find new matches
                _currentMatches = FindMatches();
            }
            
            _isProcessingMatches = false;
        }
        
        private void ProcessMatch(Match match)
        {
            // Calculate score
            int score = CalculateMatchScore(match);
            AddScore(score);
            
            // Create combo if applicable
            if (enableComboSystem)
            {
                CreateCombo(match);
            }
            
            // Trigger events
            OnMatchFound?.Invoke(match);
            
            Log($"Match found: {match.tiles.Count} tiles, {score} points");
        }
        
        private int CalculateMatchScore(Match match)
        {
            int baseScore = match.tiles.Count * 100;
            int multiplier = 1;
            
            // Apply special tile bonuses
            foreach (var tile in match.tiles)
            {
                if (tile.isSpecial)
                {
                    multiplier += 1;
                }
            }
            
            return baseScore * multiplier;
        }
        
        private void CreateCombo(Match match)
        {
            var combo = new Combo
            {
                tiles = match.tiles,
                score = CalculateMatchScore(match),
                multiplier = 1
            };
            
            OnComboCreated?.Invoke(combo);
        }
        
        private IEnumerator RemoveMatchedTiles()
        {
            var tilesToRemove = new List<Tile>();
            
            foreach (var match in _currentMatches)
            {
                tilesToRemove.AddRange(match.tiles);
            }
            
            foreach (var tile in tilesToRemove)
            {
                // Animate removal
                yield return StartCoroutine(AnimateTileRemoval(tile));
                
                // Remove from board
                _board[tile.x, tile.y] = null;
                _activeTiles.Remove(tile);
                
                // Return to pool
                ReturnTileToPool(tile);
            }
        }
        
        private IEnumerator AnimateTileRemoval(Tile tile)
        {
            var startScale = tile.transform.localScale;
            var targetScale = Vector3.zero;
            
            float elapsed = 0f;
            while (elapsed < animationDuration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / animationDuration;
                tile.transform.localScale = Vector3.Lerp(startScale, targetScale, t);
                yield return null;
            }
        }
        
        private IEnumerator DropTiles()
        {
            bool tilesDropped = true;
            
            while (tilesDropped)
            {
                tilesDropped = false;
                
                for (int x = 0; x < boardWidth; x++)
                {
                    for (int y = 1; y < boardHeight; y++)
                    {
                        var tile = _board[x, y];
                        if (tile != null && _board[x, y - 1] == null)
                        {
                            // Move tile down
                            _board[x, y - 1] = tile;
                            _board[x, y] = null;
                            tile.y = y - 1;
                            
                            // Animate movement
                            yield return StartCoroutine(AnimateTileDrop(tile, y));
                            
                            tilesDropped = true;
                        }
                    }
                }
            }
        }
        
        private IEnumerator AnimateTileDrop(Tile tile, int fromY)
        {
            var startPos = tile.transform.position;
            var targetPos = new Vector3(tile.x * tileSize, (tile.y) * tileSize, 0);
            
            float elapsed = 0f;
            while (elapsed < animationDuration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / animationDuration;
                tile.transform.position = Vector3.Lerp(startPos, targetPos, t);
                yield return null;
            }
            
            tile.transform.position = targetPos;
        }
        
        private IEnumerator FillEmptySpaces()
        {
            for (int x = 0; x < boardWidth; x++)
            {
                for (int y = 0; y < boardHeight; y++)
                {
                    if (_board[x, y] == null)
                    {
                        var tile = CreateTile(x, y);
                        _board[x, y] = tile;
                        _activeTiles.Add(tile);
                        
                        // Animate tile appearance
                        yield return StartCoroutine(AnimateTileAppearance(tile));
                    }
                }
            }
        }
        
        private IEnumerator AnimateTileAppearance(Tile tile)
        {
            var startScale = Vector3.zero;
            var targetScale = Vector3.one;
            
            tile.transform.localScale = startScale;
            
            float elapsed = 0f;
            while (elapsed < animationDuration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / animationDuration;
                tile.transform.localScale = Vector3.Lerp(startScale, targetScale, t);
                yield return null;
            }
            
            tile.transform.localScale = targetScale;
        }
        
        #endregion
        
        #region Energy System
        
        private IEnumerator EnergyRegenerationCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(energyRegenInterval);
                
                if (_currentEnergy < maxEnergy)
                {
                    _currentEnergy = Mathf.Min(_currentEnergy + energyRegenRate, maxEnergy);
                    OnEnergyChanged?.Invoke(_currentEnergy);
                }
            }
        }
        
        public bool CanMakeMove()
        {
            return _currentEnergy >= energyPerMove;
        }
        
        public void ConsumeEnergy(int amount)
        {
            _currentEnergy = Mathf.Max(_currentEnergy - amount, 0);
            OnEnergyChanged?.Invoke(_currentEnergy);
        }
        
        public void AddEnergy(int amount)
        {
            _currentEnergy = Mathf.Min(_currentEnergy + amount, maxEnergy);
            OnEnergyChanged?.Invoke(_currentEnergy);
        }
        
        #endregion
        
        #region Score and Level Management
        
        public void AddScore(int points)
        {
            _currentScore += points;
            OnScoreChanged?.Invoke(_currentScore);
            
            // Check level completion
            if (_currentScore >= _currentLevelData.targetScore)
            {
                CompleteLevel();
            }
        }
        
        public void UseMove()
        {
            _currentMoves++;
            OnMovesChanged?.Invoke(_currentMoves);
            
            // Check if out of moves
            if (_currentMoves >= _currentLevelData.movesLimit)
            {
                // Level failed
                FailLevel();
            }
        }
        
        private void CompleteLevel()
        {
            if (_isLevelComplete) return;
            
            _isLevelComplete = true;
            OnLevelComplete?.Invoke(true);
            
            // Give rewards
            GiveLevelRewards();
            
            // Track analytics
            _analyticsManager?.TrackEvent("level_completed", new Dictionary<string, object>
            {
                {"level", _currentLevel},
                {"score", _currentScore},
                {"moves", _currentMoves},
                {"time", _currentTime}
            });
            
            Log($"Level {_currentLevel} completed!");
        }
        
        private void FailLevel()
        {
            OnLevelComplete?.Invoke(false);
            
            // Track analytics
            _analyticsManager?.TrackEvent("level_failed", new Dictionary<string, object>
            {
                {"level", _currentLevel},
                {"score", _currentScore},
                {"moves", _currentMoves},
                {"time", _currentTime}
            });
            
            Log($"Level {_currentLevel} failed!");
        }
        
        private void GiveLevelRewards()
        {
            // Give coins based on score
            int coins = _currentScore / 100;
            _economyManager?.AddCurrency("coins", coins);
            
            // Give experience
            int experience = _currentLevel * 10;
            _economyManager?.AddCurrency("experience", experience);
            
            Log($"Rewards given: {coins} coins, {experience} experience");
        }
        
        #endregion
        
        #region Object Pooling
        
        private void ReturnTileToPool(Tile tile)
        {
            if (enableObjectPooling && _tilePools.ContainsKey(tile.tileType))
            {
                tile.Reset();
                _tilePools[tile.tileType].Enqueue(tile);
            }
            else
            {
                Destroy(tile.gameObject);
            }
        }
        
        #endregion
        
        #region Performance Optimization
        
        private void StartBatchUpdates()
        {
            if (enableBatchUpdates)
            {
                _batchUpdateCoroutine = StartCoroutine(BatchUpdateCoroutine());
            }
        }
        
        private IEnumerator BatchUpdateCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(updateInterval);
                
                ProcessPendingUpdates();
            }
        }
        
        private void ProcessPendingUpdates()
        {
            foreach (var update in _pendingUpdates)
            {
                update.UpdateAction?.Invoke();
            }
            
            _pendingUpdates.Clear();
        }
        
        public void RequestGameUpdate(System.Action updateAction)
        {
            if (enableBatchUpdates)
            {
                _pendingUpdates.Add(new GameUpdateRequest
                {
                    UpdateAction = updateAction
                });
            }
            else
            {
                updateAction?.Invoke();
            }
        }
        
        #endregion
        
        #region Utility Methods
        
        public Tile GetTileAt(int x, int y)
        {
            if (x >= 0 && x < boardWidth && y >= 0 && y < boardHeight)
            {
                return _board[x, y];
            }
            return null;
        }
        
        public bool IsValidPosition(int x, int y)
        {
            return x >= 0 && x < boardWidth && y >= 0 && y < boardHeight;
        }
        
        public void PauseGame()
        {
            Time.timeScale = 0f;
        }
        
        public void ResumeGame()
        {
            Time.timeScale = 1f;
        }
        
        public void RestartLevel()
        {
            StartNewLevel(_currentLevel);
        }
        
        public void NextLevel()
        {
            if (_currentLevel < maxLevel)
            {
                StartNewLevel(_currentLevel + 1);
            }
        }
        
        #endregion
        
        #region Logging
        
        private void Log(string message)
        {
            Debug.Log($"[OptimizedGame] {message}");
        }
        
        private void LogWarning(string message)
        {
            Debug.LogWarning($"[OptimizedGame] {message}");
        }
        
        private void LogError(string message)
        {
            Debug.LogError($"[OptimizedGame] {message}");
        }
        
        #endregion
        
        #region Unity Lifecycle
        
        void Update()
        {
            if (!_isLevelComplete)
            {
                _currentTime += Time.deltaTime;
            }
        }
        
        void OnDestroy()
        {
            if (_energyRegenCoroutine != null)
            {
                StopCoroutine(_energyRegenCoroutine);
            }
            
            if (_batchUpdateCoroutine != null)
            {
                StopCoroutine(_batchUpdateCoroutine);
            }
        }
        
        #endregion
    }
    
    #region Data Structures
    
    [System.Serializable]
    public class Tile : MonoBehaviour
    {
        public TileType tileType;
        public int x, y;
        public bool isSpecial;
        public bool isSelected;
        
        public void Initialize(TileType type, int x, int y)
        {
            this.tileType = type;
            this.x = x;
            this.y = y;
            this.isSpecial = false;
            this.isSelected = false;
        }
        
        public void SetSelected(bool selected)
        {
            isSelected = selected;
            // Update visual state
        }
        
        public bool IsSelectable()
        {
            return !isSelected;
        }
        
        public void Reset()
        {
            isSpecial = false;
            isSelected = false;
            gameObject.SetActive(false);
        }
    }
    
    [System.Serializable]
    public class Match
    {
        public List<Tile> tiles;
        public int score;
        
        public Match(List<Tile> tiles)
        {
            this.tiles = tiles;
            this.score = tiles.Count * 100;
        }
    }
    
    [System.Serializable]
    public class Combo
    {
        public List<Tile> tiles;
        public int score;
        public int multiplier;
    }
    
    [System.Serializable]
    public class LevelData
    {
        public int level;
        public int targetScore;
        public int movesLimit;
        public float timeLimit;
        public bool specialTilesEnabled;
        public bool comboSystemEnabled;
        public bool cascadeEffectsEnabled;
    }
    
    [System.Serializable]
    public class GameUpdateRequest
    {
        public System.Action UpdateAction;
    }
    
    public enum TileType
    {
        Red, Blue, Green, Yellow, Purple, Orange, Pink, Cyan
    }
    
    #endregion
}