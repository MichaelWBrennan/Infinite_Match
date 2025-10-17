using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using Evergreen.Core;
using Evergreen.AI;

namespace Evergreen.Gameplay
{
    /// <summary>
    /// Core Match-3 Board Controller
    /// Handles board creation, tile management, and game logic
    /// </summary>
    public class Match3Board : MonoBehaviour
    {
        [Header("Board Configuration")]
        public int boardWidth = 8;
        public int boardHeight = 8;
        public float tileSize = 1f;
        public float tileSpacing = 0.1f;
        
        [Header("Tile Types")]
        public GameObject[] tilePrefabs;
        public Color[] tileColors = {
            Color.red, Color.blue, Color.green, 
            Color.yellow, Color.magenta, Color.cyan
        };
        
        [Header("Special Tiles")]
        public GameObject bombPrefab;
        public GameObject lightningPrefab;
        public GameObject rainbowPrefab;
        
        [Header("Visual Effects")]
        public ParticleSystem matchEffect;
        public ParticleSystem explosionEffect;
        public AudioClip matchSound;
        public AudioClip swapSound;
        
        // Board state
        private Match3Tile[,] board;
        private bool isProcessing = false;
        private int score = 0;
        private int moves = 30;
        private int targetScore = 1000;
        
        // AI Integration - Cache references to avoid FindObjectOfType
        private AIInfiniteContentManager aiContentManager;
        private GameAnalyticsManager analyticsManager;
        
        // Object pooling for better performance
        private Queue<Match3Tile> tilePool = new Queue<Match3Tile>();
        private List<Match3Tile> activeTiles = new List<Match3Tile>();
        
        // Events
        public System.Action<int> OnScoreChanged;
        public System.Action<int> OnMovesChanged;
        public System.Action<bool> OnGameOver;
        public System.Action<Match3Tile[]> OnMatchFound;
        
        // Game state
        private bool gameActive = true;
        private Coroutine gameLoopCoroutine;
        
        void Start()
        {
            InitializeBoard();
            StartGame();
        }
        
        /// <summary>
        /// Initialize the game board
        /// </summary>
        private void InitializeBoard()
        {
            // Cache AI and analytics managers to avoid FindObjectOfType calls
            if (aiContentManager == null)
                aiContentManager = FindObjectOfType<AIInfiniteContentManager>();
            if (analyticsManager == null)
                analyticsManager = FindObjectOfType<GameAnalyticsManager>();
            
            // Create board array
            board = new Match3Tile[boardWidth, boardHeight];
            
            // Initialize object pool
            InitializeTilePool();
            
            // Generate initial board
            GenerateInitialBoard();
            
            // Start AI content generation
            if (aiContentManager != null)
            {
                aiContentManager.StartAIContentGeneration();
            }
            
            Debug.Log("🎮 Match-3 Board initialized with AI integration and object pooling");
        }
        
        /// <summary>
        /// Generate initial board layout
        /// </summary>
        private void GenerateInitialBoard()
        {
            for (int x = 0; x < boardWidth; x++)
            {
                for (int y = 0; y < boardHeight; y++)
                {
                    CreateTile(x, y);
                }
            }
            
            // Remove initial matches
            RemoveInitialMatches();
        }
        
        /// <summary>
        /// Initialize tile object pool
        /// </summary>
        private void InitializeTilePool()
        {
            // Pre-create tiles for pooling
            int poolSize = boardWidth * boardHeight * 2; // Extra tiles for animations
            
            for (int i = 0; i < poolSize; i++)
            {
                GameObject tileObj = Instantiate(tilePrefabs[0], Vector3.zero, Quaternion.identity, transform);
                Match3Tile tile = tileObj.GetComponent<Match3Tile>();
                if (tile == null)
                {
                    tile = tileObj.AddComponent<Match3Tile>();
                }
                
                tileObj.SetActive(false);
                tilePool.Enqueue(tile);
            }
        }
        
        /// <summary>
        /// Get tile from pool or create new one
        /// </summary>
        private Match3Tile GetTileFromPool()
        {
            if (tilePool.Count > 0)
            {
                Match3Tile tile = tilePool.Dequeue();
                tile.gameObject.SetActive(true);
                activeTiles.Add(tile);
                return tile;
            }
            else
            {
                // Pool exhausted, create new tile
                GameObject tileObj = Instantiate(tilePrefabs[0], Vector3.zero, Quaternion.identity, transform);
                Match3Tile tile = tileObj.GetComponent<Match3Tile>();
                if (tile == null)
                {
                    tile = tileObj.AddComponent<Match3Tile>();
                }
                activeTiles.Add(tile);
                return tile;
            }
        }
        
        /// <summary>
        /// Return tile to pool
        /// </summary>
        private void ReturnTileToPool(Match3Tile tile)
        {
            if (tile != null)
            {
                activeTiles.Remove(tile);
                tile.gameObject.SetActive(false);
                tile.Reset();
                tilePool.Enqueue(tile);
            }
        }
        
        /// <summary>
        /// Create a tile at specified position
        /// </summary>
        private void CreateTile(int x, int y)
        {
            // Get random tile type
            int tileType = GetRandomTileType(x, y);
            
            // Get tile from pool
            Match3Tile tile = GetTileFromPool();
            
            // Setup tile
            tile.transform.position = GetWorldPosition(x, y);
            tile.Initialize(x, y, tileType, this);
            board[x, y] = tile;
        }
        
        /// <summary>
        /// Get random tile type avoiding initial matches
        /// </summary>
        private int GetRandomTileType(int x, int y)
        {
            int tileType;
            int attempts = 0;
            
            do
            {
                tileType = Random.Range(0, tilePrefabs.Length);
                attempts++;
            }
            while (WouldCreateMatch(x, y, tileType) && attempts < 10);
            
            return tileType;
        }
        
        /// <summary>
        /// Check if placing tile would create immediate match
        /// </summary>
        private bool WouldCreateMatch(int x, int y, int tileType)
        {
            // Check horizontal matches
            int leftCount = 1;
            for (int i = x - 1; i >= 0; i--)
            {
                if (board[i, y] != null && board[i, y].TileType == tileType)
                    leftCount++;
                else
                    break;
            }
            
            int rightCount = 1;
            for (int i = x + 1; i < boardWidth; i++)
            {
                if (board[i, y] != null && board[i, y].TileType == tileType)
                    rightCount++;
                else
                    break;
            }
            
            if (leftCount + rightCount >= 3) return true;
            
            // Check vertical matches
            int upCount = 1;
            for (int i = y + 1; i < boardHeight; i++)
            {
                if (board[x, i] != null && board[x, i].TileType == tileType)
                    upCount++;
                else
                    break;
            }
            
            int downCount = 1;
            for (int i = y - 1; i >= 0; i--)
            {
                if (board[x, i] != null && board[x, i].TileType == tileType)
                    downCount++;
                else
                    break;
            }
            
            return upCount + downCount >= 3;
        }
        
        /// <summary>
        /// Remove initial matches from board
        /// </summary>
        private void RemoveInitialMatches()
        {
            bool foundMatches = true;
            while (foundMatches)
            {
                foundMatches = false;
                List<Match3Tile> matches = FindAllMatches();
                
                if (matches.Count > 0)
                {
                    foundMatches = true;
                    foreach (Match3Tile tile in matches)
                    {
                        int newType = GetRandomTileType(tile.X, tile.Y);
                        tile.ChangeType(newType);
                    }
                }
            }
        }
        
        /// <summary>
        /// Start the game
        /// </summary>
        public void StartGame()
        {
            gameActive = true;
            moves = 30;
            score = 0;
            
            OnScoreChanged?.Invoke(score);
            OnMovesChanged?.Invoke(moves);
            
            // Start game loop
            if (gameLoopCoroutine != null)
            {
                StopCoroutine(gameLoopCoroutine);
            }
            gameLoopCoroutine = StartCoroutine(GameLoop());
            
            // Track game start
            analyticsManager?.TrackEvent("game_started", new Dictionary<string, object>
            {
                {"level", 1},
                {"moves", moves},
                {"target_score", targetScore}
            });
            
            Debug.Log("🎮 Match-3 Game Started!");
        }
        
        /// <summary>
        /// Main game loop
        /// </summary>
        private IEnumerator GameLoop()
        {
            while (gameActive)
            {
                // Check for matches
                List<Match3Tile> matches = FindAllMatches();
                if (matches.Count > 0)
                {
                    yield return StartCoroutine(ProcessMatches(matches));
                }
                
                // Check for possible moves
                if (!HasPossibleMoves())
                {
                    // Shuffle board
                    yield return StartCoroutine(ShuffleBoard());
                }
                
                // Check win/lose conditions
                CheckGameEnd();
                
                yield return new WaitForSeconds(0.1f);
            }
        }
        
        /// <summary>
        /// Handle tile swap
        /// </summary>
        public bool TrySwapTiles(Match3Tile tile1, Match3Tile tile2)
        {
            if (isProcessing || !gameActive) return false;
            
            // Check if tiles are adjacent
            if (!AreAdjacent(tile1, tile2)) return false;
            
            // Swap tiles
            SwapTiles(tile1, tile2);
            
            // Check for matches
            List<Match3Tile> matches = FindAllMatches();
            
            if (matches.Count > 0)
            {
                // Valid move
                moves--;
                OnMovesChanged?.Invoke(moves);
                
                // Track move
                analyticsManager?.TrackEvent("tile_swapped", new Dictionary<string, object>
                {
                    {"tile1_type", tile1.TileType},
                    {"tile2_type", tile2.TileType},
                    {"moves_remaining", moves}
                });
                
                StartCoroutine(ProcessMatches(matches));
                return true;
            }
            else
            {
                // Invalid move, swap back
                SwapTiles(tile1, tile2);
                return false;
            }
        }
        
        /// <summary>
        /// Swap two tiles
        /// </summary>
        private void SwapTiles(Match3Tile tile1, Match3Tile tile2)
        {
            // Swap positions
            Vector3 pos1 = tile1.transform.position;
            Vector3 pos2 = tile2.transform.position;
            
            tile1.MoveTo(pos2);
            tile2.MoveTo(pos1);
            
            // Swap in board array
            board[tile1.X, tile1.Y] = tile2;
            board[tile2.X, tile2.Y] = tile1;
            
            // Update tile coordinates
            int tempX = tile1.X;
            int tempY = tile1.Y;
            tile1.SetPosition(tile2.X, tile2.Y);
            tile2.SetPosition(tempX, tempY);
            
            // Play swap sound
            if (swapSound != null)
            {
                AudioSource.PlayClipAtPoint(swapSound, Camera.main.transform.position);
            }
        }
        
        /// <summary>
        /// Check if two tiles are adjacent
        /// </summary>
        private bool AreAdjacent(Match3Tile tile1, Match3Tile tile2)
        {
            int dx = Mathf.Abs(tile1.X - tile2.X);
            int dy = Mathf.Abs(tile1.Y - tile2.Y);
            return (dx == 1 && dy == 0) || (dx == 0 && dy == 1);
        }
        
        /// <summary>
        /// Find all matches on the board - Optimized version
        /// </summary>
        private List<Match3Tile> FindAllMatches()
        {
            // Use HashSet for O(1) contains check instead of List.Contains which is O(n)
            var allMatches = new HashSet<Match3Tile>();
            
            // Find horizontal matches
            for (int y = 0; y < boardHeight; y++)
            {
                for (int x = 0; x < boardWidth - 2; x++)
                {
                    var tile1 = board[x, y];
                    var tile2 = board[x + 1, y];
                    var tile3 = board[x + 2, y];
                    
                    if (tile1 != null && tile2 != null && tile3 != null &&
                        tile1.TileType == tile2.TileType && tile2.TileType == tile3.TileType)
                    {
                        // Found horizontal match - add all consecutive matching tiles
                        for (int i = x; i < boardWidth; i++)
                        {
                            var currentTile = board[i, y];
                            if (currentTile != null && currentTile.TileType == tile1.TileType)
                            {
                                allMatches.Add(currentTile);
                            }
                            else
                            {
                                break;
                            }
                        }
                    }
                }
            }
            
            // Find vertical matches
            for (int x = 0; x < boardWidth; x++)
            {
                for (int y = 0; y < boardHeight - 2; y++)
                {
                    var tile1 = board[x, y];
                    var tile2 = board[x, y + 1];
                    var tile3 = board[x, y + 2];
                    
                    if (tile1 != null && tile2 != null && tile3 != null &&
                        tile1.TileType == tile2.TileType && tile2.TileType == tile3.TileType)
                    {
                        // Found vertical match - add all consecutive matching tiles
                        for (int i = y; i < boardHeight; i++)
                        {
                            var currentTile = board[x, i];
                            if (currentTile != null && currentTile.TileType == tile1.TileType)
                            {
                                allMatches.Add(currentTile);
                            }
                            else
                            {
                                break;
                            }
                        }
                    }
                }
            }
            
            return new List<Match3Tile>(allMatches);
        }
        
        /// <summary>
        /// Process matches and update board
        /// </summary>
        private IEnumerator ProcessMatches(List<Match3Tile> matches)
        {
            isProcessing = true;
            
            // Highlight matches
            foreach (Match3Tile tile in matches)
            {
                tile.Highlight();
            }
            
            yield return new WaitForSeconds(0.3f);
            
            // Calculate score
            int matchScore = CalculateMatchScore(matches);
            score += matchScore;
            OnScoreChanged?.Invoke(score);
            
            // Track match
            analyticsManager?.TrackEvent("match_found", new Dictionary<string, object>
            {
                {"match_count", matches.Count},
                {"score_gained", matchScore},
                {"total_score", score}
            });
            
            // Remove matched tiles
            foreach (Match3Tile tile in matches)
            {
                board[tile.X, tile.Y] = null;
                ReturnTileToPool(tile);
            }
            
            // Play match effect
            if (matchEffect != null)
            {
                matchEffect.Play();
            }
            
            if (matchSound != null)
            {
                AudioSource.PlayClipAtPoint(matchSound, Camera.main.transform.position);
            }
            
            // Drop tiles down
            yield return StartCoroutine(DropTiles());
            
            // Fill empty spaces
            yield return StartCoroutine(FillEmptySpaces());
            
            isProcessing = false;
        }
        
        /// <summary>
        /// Calculate score for matches
        /// </summary>
        private int CalculateMatchScore(List<Match3Tile> matches)
        {
            int baseScore = matches.Count * 10;
            int bonus = 0;
            
            // Bonus for longer matches
            if (matches.Count >= 4) bonus += 50;
            if (matches.Count >= 5) bonus += 100;
            
            // Bonus for special tiles
            foreach (Match3Tile tile in matches)
            {
                if (tile.IsSpecial)
                {
                    bonus += 100;
                }
            }
            
            return baseScore + bonus;
        }
        
        /// <summary>
        /// Drop tiles down to fill gaps
        /// </summary>
        private IEnumerator DropTiles()
        {
            bool tilesDropped = true;
            
            while (tilesDropped)
            {
                tilesDropped = false;
                
                for (int x = 0; x < boardWidth; x++)
                {
                    for (int y = 0; y < boardHeight - 1; y++)
                    {
                        if (board[x, y] == null && board[x, y + 1] != null)
                        {
                            // Move tile down
                            Match3Tile tile = board[x, y + 1];
                            board[x, y] = tile;
                            board[x, y + 1] = null;
                            
                            tile.SetPosition(x, y);
                            tile.MoveTo(GetWorldPosition(x, y));
                            
                            tilesDropped = true;
                        }
                    }
                }
                
                if (tilesDropped)
                {
                    yield return new WaitForSeconds(0.1f);
                }
            }
        }
        
        /// <summary>
        /// Fill empty spaces with new tiles
        /// </summary>
        private IEnumerator FillEmptySpaces()
        {
            for (int x = 0; x < boardWidth; x++)
            {
                for (int y = 0; y < boardHeight; y++)
                {
                    if (board[x, y] == null)
                    {
                        CreateTile(x, y);
                        yield return new WaitForSeconds(0.05f);
                    }
                }
            }
        }
        
        /// <summary>
        /// Check if there are possible moves
        /// </summary>
        private bool HasPossibleMoves()
        {
            for (int x = 0; x < boardWidth; x++)
            {
                for (int y = 0; y < boardHeight; y++)
                {
                    if (board[x, y] != null)
                    {
                        // Check right neighbor
                        if (x < boardWidth - 1 && board[x + 1, y] != null)
                        {
                            if (WouldCreateMatchAfterSwap(x, y, x + 1, y))
                                return true;
                        }
                        
                        // Check up neighbor
                        if (y < boardHeight - 1 && board[x, y + 1] != null)
                        {
                            if (WouldCreateMatchAfterSwap(x, y, x, y + 1))
                                return true;
                        }
                    }
                }
            }
            
            return false;
        }
        
        /// <summary>
        /// Check if swapping would create a match
        /// </summary>
        private bool WouldCreateMatchAfterSwap(int x1, int y1, int x2, int y2)
        {
            // Temporarily swap tiles
            Match3Tile temp = board[x1, y1];
            board[x1, y1] = board[x2, y2];
            board[x2, y2] = temp;
            
            // Check for matches
            List<Match3Tile> matches = FindAllMatches();
            bool hasMatch = matches.Count > 0;
            
            // Swap back
            board[x2, y2] = board[x1, y1];
            board[x1, y1] = temp;
            
            return hasMatch;
        }
        
        /// <summary>
        /// Shuffle the board
        /// </summary>
        private IEnumerator ShuffleBoard()
        {
            Debug.Log("🔄 Shuffling board...");
            
            // Collect all tiles
            List<Match3Tile> allTiles = new List<Match3Tile>();
            for (int x = 0; x < boardWidth; x++)
            {
                for (int y = 0; y < boardHeight; y++)
                {
                    if (board[x, y] != null)
                    {
                        allTiles.Add(board[x, y]);
                    }
                }
            }
            
            // Shuffle tile types
            for (int i = 0; i < allTiles.Count; i++)
            {
                int randomIndex = Random.Range(i, allTiles.Count);
                int tempType = allTiles[i].TileType;
                allTiles[i].ChangeType(allTiles[randomIndex].TileType);
                allTiles[randomIndex].ChangeType(tempType);
            }
            
            yield return new WaitForSeconds(0.5f);
        }
        
        /// <summary>
        /// Check game end conditions
        /// </summary>
        private void CheckGameEnd()
        {
            if (moves <= 0)
            {
                // Game over
                gameActive = false;
                bool won = score >= targetScore;
                
                OnGameOver?.Invoke(won);
                
                // Track game end
                analyticsManager?.TrackEvent("game_ended", new Dictionary<string, object>
                {
                    {"won", won},
                    {"final_score", score},
                    {"moves_used", 30 - moves}
                });
                
                Debug.Log(won ? "🎉 You Won!" : "💀 Game Over!");
            }
        }
        
        /// <summary>
        /// Get world position for board coordinates
        /// </summary>
        private Vector3 GetWorldPosition(int x, int y)
        {
            float xPos = (x - boardWidth / 2f) * (tileSize + tileSpacing);
            float yPos = (y - boardHeight / 2f) * (tileSize + tileSpacing);
            return new Vector3(xPos, yPos, 0);
        }
        
        /// <summary>
        /// Get board coordinates from world position
        /// </summary>
        public Vector2Int GetBoardPosition(Vector3 worldPos)
        {
            float x = (worldPos.x + (boardWidth / 2f) * (tileSize + tileSpacing)) / (tileSize + tileSpacing);
            float y = (worldPos.y + (boardHeight / 2f) * (tileSize + tileSpacing)) / (tileSize + tileSpacing);
            
            return new Vector2Int(Mathf.RoundToInt(x), Mathf.RoundToInt(y));
        }
        
        /// <summary>
        /// Get tile at board position
        /// </summary>
        public Match3Tile GetTile(int x, int y)
        {
            if (x >= 0 && x < boardWidth && y >= 0 && y < boardHeight)
            {
                return board[x, y];
            }
            return null;
        }
        
        /// <summary>
        /// Pause the game
        /// </summary>
        public void PauseGame()
        {
            gameActive = false;
            if (gameLoopCoroutine != null)
            {
                StopCoroutine(gameLoopCoroutine);
            }
        }
        
        /// <summary>
        /// Resume the game
        /// </summary>
        public void ResumeGame()
        {
            gameActive = true;
            gameLoopCoroutine = StartCoroutine(GameLoop());
        }
        
        /// <summary>
        /// Get current score
        /// </summary>
        public int GetScore()
        {
            return score;
        }
        
        /// <summary>
        /// Get remaining moves
        /// </summary>
        public int GetMoves()
        {
            return moves;
        }
        
        /// <summary>
        /// Get target score
        /// </summary>
        public int GetTargetScore()
        {
            return targetScore;
        }
    }
}