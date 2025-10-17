using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Evergreen.Gameplay;
using Evergreen.Core;
using Evergreen.AI;

namespace Evergreen.Gameplay
{
    /// <summary>
    /// Power-Up System for Match-3 Game
    /// Handles special tiles, power-ups, and their effects
    /// </summary>
    public class PowerUpSystem : MonoBehaviour
    {
        [Header("Power-Up Configuration")]
        public int powerUpSpawnChance = 10; // Percentage chance to spawn power-up
        public int minMatchLengthForPowerUp = 4;
        public int maxPowerUpsPerLevel = 3;
        
        [Header("Power-Up Prefabs")]
        public GameObject bombPrefab;
        public GameObject lightningPrefab;
        public GameObject rainbowPrefab;
        public GameObject starPrefab;
        public GameObject colorBombPrefab;
        
        [Header("Visual Effects")]
        public ParticleSystem powerUpEffect;
        public ParticleSystem explosionEffect;
        public ParticleSystem lightningEffect;
        public ParticleSystem rainbowEffect;
        
        [Header("Audio")]
        public AudioClip powerUpSpawnSound;
        public AudioClip powerUpActivateSound;
        public AudioClip explosionSound;
        public AudioClip lightningSound;
        public AudioClip rainbowSound;
        
        // References
        private Match3Board board;
        private AIInfiniteContentManager aiContentManager;
        private GameAnalyticsManager analyticsManager;
        
        // Power-up state
        private int powerUpsUsed = 0;
        private List<PowerUpData> activePowerUps = new List<PowerUpData>();
        
        // Events
        public System.Action<PowerUpType, Vector2Int> OnPowerUpSpawned;
        public System.Action<PowerUpType, Vector2Int> OnPowerUpActivated;
        public System.Action<PowerUpType, int> OnPowerUpEffect;
        
        public enum PowerUpType
        {
            None,
            Bomb,
            Lightning,
            Rainbow,
            Star,
            ColorBomb,
            Hammer,
            Shuffle,
            ExtraMoves,
            ScoreMultiplier
        }
        
        [System.Serializable]
        public class PowerUpData
        {
            public PowerUpType type;
            public Vector2Int position;
            public int value;
            public float duration;
            public bool isActive;
        }
        
        void Start()
        {
            // Get references
            board = FindObjectOfType<Match3Board>();
            aiContentManager = FindObjectOfType<AIInfiniteContentManager>();
            analyticsManager = FindObjectOfType<GameAnalyticsManager>();
            
            if (board == null)
            {
                Debug.LogError("PowerUpSystem: No Match3Board found!");
                return;
            }
            
            // Subscribe to board events
            if (board != null)
            {
                board.OnMatchFound += OnMatchFound;
            }
            
            Debug.Log("⚡ Power-Up System initialized");
        }
        
        /// <summary>
        /// Handle match found event
        /// </summary>
        private void OnMatchFound(Match3Tile[] matchedTiles)
        {
            // Check if we should spawn a power-up
            if (ShouldSpawnPowerUp(matchedTiles))
            {
                SpawnPowerUp(matchedTiles);
            }
        }
        
        /// <summary>
        /// Check if we should spawn a power-up
        /// </summary>
        private bool ShouldSpawnPowerUp(Match3Tile[] matchedTiles)
        {
            // Check if we've reached max power-ups
            if (powerUpsUsed >= maxPowerUpsPerLevel)
                return false;
            
            // Check match length
            if (matchedTiles.Length < minMatchLengthForPowerUp)
                return false;
            
            // Random chance
            int random = Random.Range(0, 100);
            return random < powerUpSpawnChance;
        }
        
        /// <summary>
        /// Spawn a power-up
        /// </summary>
        private void SpawnPowerUp(Match3Tile[] matchedTiles)
        {
            // Choose power-up type based on match
            PowerUpType powerUpType = ChoosePowerUpType(matchedTiles);
            
            if (powerUpType == PowerUpType.None)
                return;
            
            // Choose position (center of match)
            Vector2Int position = GetCenterPosition(matchedTiles);
            
            // Create power-up
            CreatePowerUp(powerUpType, position);
            
            // Track power-up spawn
            analyticsManager?.TrackEvent("power_up_spawned", new Dictionary<string, object>
            {
                {"power_up_type", powerUpType.ToString()},
                {"position", position},
                {"match_length", matchedTiles.Length}
            });
            
            OnPowerUpSpawned?.Invoke(powerUpType, position);
            
            Debug.Log($"⚡ Spawned {powerUpType} power-up at {position}");
        }
        
        /// <summary>
        /// Choose power-up type based on match
        /// </summary>
        private PowerUpType ChoosePowerUpType(Match3Tile[] matchedTiles)
        {
            int matchLength = matchedTiles.Length;
            
            // AI-powered power-up selection
            if (aiContentManager != null)
            {
                return GetAIPowerUpRecommendation(matchedTiles);
            }
            
            // Default logic based on match length
            if (matchLength >= 5)
            {
                return PowerUpType.ColorBomb;
            }
            else if (matchLength >= 4)
            {
                // Random between bomb and lightning
                return Random.Range(0, 2) == 0 ? PowerUpType.Bomb : PowerUpType.Lightning;
            }
            else
            {
                return PowerUpType.Bomb;
            }
        }
        
        /// <summary>
        /// Get AI-powered power-up recommendation
        /// </summary>
        private PowerUpType GetAIPowerUpRecommendation(Match3Tile[] matchedTiles)
        {
            // Create context for AI
            var context = new Dictionary<string, object>
            {
                {"match_length", matchedTiles.Length},
                {"match_types", System.Array.ConvertAll(matchedTiles, t => t.TileType)},
                {"board_state", GetBoardState()},
                {"power_ups_used", powerUpsUsed},
                {"moves_remaining", board.GetMoves()}
            };
            
            // Get AI recommendation
            var recommendation = aiContentManager?.GetPersonalizedRecommendations("power_up", null);
            
            if (recommendation != null && recommendation.Count > 0)
            {
                // Parse AI recommendation
                var powerUpType = ParseAIPowerUpRecommendation(recommendation[0]);
                return powerUpType;
            }
            
            // Fallback to default logic
            return ChoosePowerUpType(matchedTiles);
        }
        
        /// <summary>
        /// Parse AI power-up recommendation
        /// </summary>
        private PowerUpType ParseAIPowerUpRecommendation(object recommendation)
        {
            // This would parse the AI recommendation
            // For now, return a random power-up
            PowerUpType[] powerUps = {
                PowerUpType.Bomb,
                PowerUpType.Lightning,
                PowerUpType.Rainbow,
                PowerUpType.Star
            };
            
            return powerUps[Random.Range(0, powerUps.Length)];
        }
        
        /// <summary>
        /// Get current board state
        /// </summary>
        private int[,] GetBoardState()
        {
            int[,] state = new int[board.boardWidth, board.boardHeight];
            
            for (int x = 0; x < board.boardWidth; x++)
            {
                for (int y = 0; y < board.boardHeight; y++)
                {
                    Match3Tile tile = board.GetTile(x, y);
                    state[x, y] = tile != null ? tile.TileType : -1;
                }
            }
            
            return state;
        }
        
        /// <summary>
        /// Get center position of matched tiles
        /// </summary>
        private Vector2Int GetCenterPosition(Match3Tile[] matchedTiles)
        {
            int totalX = 0;
            int totalY = 0;
            
            foreach (Match3Tile tile in matchedTiles)
            {
                totalX += tile.X;
                totalY += tile.Y;
            }
            
            return new Vector2Int(
                totalX / matchedTiles.Length,
                totalY / matchedTiles.Length
            );
        }
        
        /// <summary>
        /// Create power-up at position
        /// </summary>
        private void CreatePowerUp(PowerUpType powerUpType, Vector2Int position)
        {
            // Get tile at position
            Match3Tile tile = board.GetTile(position.x, position.y);
            if (tile == null) return;
            
            // Make tile special
            Match3Tile.TileSpecialType specialType = GetSpecialType(powerUpType);
            tile.MakeSpecial(specialType);
            
            // Create power-up data
            PowerUpData powerUpData = new PowerUpData
            {
                type = powerUpType,
                position = position,
                value = GetPowerUpValue(powerUpType),
                duration = GetPowerUpDuration(powerUpType),
                isActive = false
            };
            
            activePowerUps.Add(powerUpData);
            
            // Play spawn effect
            PlayPowerUpEffect(powerUpType, position);
        }
        
        /// <summary>
        /// Get special type for power-up
        /// </summary>
        private Match3Tile.TileSpecialType GetSpecialType(PowerUpType powerUpType)
        {
            switch (powerUpType)
            {
                case PowerUpType.Bomb:
                    return Match3Tile.TileSpecialType.Bomb;
                case PowerUpType.Lightning:
                    return Match3Tile.TileSpecialType.Lightning;
                case PowerUpType.Rainbow:
                    return Match3Tile.TileSpecialType.Rainbow;
                case PowerUpType.Star:
                    return Match3Tile.TileSpecialType.Star;
                default:
                    return Match3Tile.TileSpecialType.Normal;
            }
        }
        
        /// <summary>
        /// Get power-up value
        /// </summary>
        private int GetPowerUpValue(PowerUpType powerUpType)
        {
            switch (powerUpType)
            {
                case PowerUpType.Bomb:
                    return 100;
                case PowerUpType.Lightning:
                    return 150;
                case PowerUpType.Rainbow:
                    return 200;
                case PowerUpType.Star:
                    return 250;
                case PowerUpType.ColorBomb:
                    return 300;
                default:
                    return 50;
            }
        }
        
        /// <summary>
        /// Get power-up duration
        /// </summary>
        private float GetPowerUpDuration(PowerUpType powerUpType)
        {
            switch (powerUpType)
            {
                case PowerUpType.Bomb:
                    return 5f;
                case PowerUpType.Lightning:
                    return 3f;
                case PowerUpType.Rainbow:
                    return 4f;
                case PowerUpType.Star:
                    return 6f;
                default:
                    return 2f;
            }
        }
        
        /// <summary>
        /// Activate power-up
        /// </summary>
        public void ActivatePowerUp(PowerUpType powerUpType, Vector2Int position)
        {
            // Find power-up data
            PowerUpData powerUpData = activePowerUps.Find(p => p.type == powerUpType && p.position == position);
            if (powerUpData == null) return;
            
            // Activate power-up
            powerUpData.isActive = true;
            powerUpsUsed++;
            
            // Apply power-up effect
            StartCoroutine(ApplyPowerUpEffect(powerUpData));
            
            // Track activation
            analyticsManager?.TrackEvent("power_up_activated", new Dictionary<string, object>
            {
                {"power_up_type", powerUpType.ToString()},
                {"position", position},
                {"value", powerUpData.value}
            });
            
            OnPowerUpActivated?.Invoke(powerUpType, position);
            
            Debug.Log($"⚡ Activated {powerUpType} power-up at {position}");
        }
        
        /// <summary>
        /// Apply power-up effect
        /// </summary>
        private IEnumerator ApplyPowerUpEffect(PowerUpData powerUpData)
        {
            Vector2Int pos = powerUpData.position;
            
            switch (powerUpData.type)
            {
                case PowerUpType.Bomb:
                    yield return StartCoroutine(ApplyBombEffect(pos));
                    break;
                case PowerUpType.Lightning:
                    yield return StartCoroutine(ApplyLightningEffect(pos));
                    break;
                case PowerUpType.Rainbow:
                    yield return StartCoroutine(ApplyRainbowEffect(pos));
                    break;
                case PowerUpType.Star:
                    yield return StartCoroutine(ApplyStarEffect(pos));
                    break;
                case PowerUpType.ColorBomb:
                    yield return StartCoroutine(ApplyColorBombEffect(pos));
                    break;
            }
            
            // Remove power-up
            activePowerUps.Remove(powerUpData);
            OnPowerUpEffect?.Invoke(powerUpData.type, powerUpData.value);
        }
        
        /// <summary>
        /// Apply bomb effect
        /// </summary>
        private IEnumerator ApplyBombEffect(Vector2Int position)
        {
            // Play explosion effect
            if (explosionEffect != null)
            {
                explosionEffect.transform.position = new Vector3(position.x, position.y, 0);
                explosionEffect.Play();
            }
            
            if (explosionSound != null)
            {
                AudioSource.PlayClipAtPoint(explosionSound, Camera.main.transform.position);
            }
            
            // Destroy surrounding tiles
            for (int x = position.x - 1; x <= position.x + 1; x++)
            {
                for (int y = position.y - 1; y <= position.y + 1; y++)
                {
                    Match3Tile tile = board.GetTile(x, y);
                    if (tile != null)
                    {
                        tile.Destroy();
                    }
                }
            }
            
            yield return new WaitForSeconds(0.5f);
        }
        
        /// <summary>
        /// Apply lightning effect
        /// </summary>
        private IEnumerator ApplyLightningEffect(Vector2Int position)
        {
            // Play lightning effect
            if (lightningEffect != null)
            {
                lightningEffect.transform.position = new Vector3(position.x, position.y, 0);
                lightningEffect.Play();
            }
            
            if (lightningSound != null)
            {
                AudioSource.PlayClipAtPoint(lightningSound, Camera.main.transform.position);
            }
            
            // Destroy entire row
            for (int x = 0; x < board.boardWidth; x++)
            {
                Match3Tile tile = board.GetTile(x, position.y);
                if (tile != null)
                {
                    tile.Destroy();
                }
            }
            
            yield return new WaitForSeconds(0.3f);
        }
        
        /// <summary>
        /// Apply rainbow effect
        /// </summary>
        private IEnumerator ApplyRainbowEffect(Vector2Int position)
        {
            // Play rainbow effect
            if (rainbowEffect != null)
            {
                rainbowEffect.transform.position = new Vector3(position.x, position.y, 0);
                rainbowEffect.Play();
            }
            
            if (rainbowSound != null)
            {
                AudioSource.PlayClipAtPoint(rainbowSound, Camera.main.transform.position);
            }
            
            // Destroy all tiles of the same type
            Match3Tile centerTile = board.GetTile(position.x, position.y);
            if (centerTile != null)
            {
                int targetType = centerTile.TileType;
                
                for (int x = 0; x < board.boardWidth; x++)
                {
                    for (int y = 0; y < board.boardHeight; y++)
                    {
                        Match3Tile tile = board.GetTile(x, y);
                        if (tile != null && tile.TileType == targetType)
                        {
                            tile.Destroy();
                        }
                    }
                }
            }
            
            yield return new WaitForSeconds(0.4f);
        }
        
        /// <summary>
        /// Apply star effect
        /// </summary>
        private IEnumerator ApplyStarEffect(Vector2Int position)
        {
            // Play star effect
            if (powerUpEffect != null)
            {
                powerUpEffect.transform.position = new Vector3(position.x, position.y, 0);
                powerUpEffect.Play();
            }
            
            // Destroy cross pattern
            // Horizontal
            for (int x = 0; x < board.boardWidth; x++)
            {
                Match3Tile tile = board.GetTile(x, position.y);
                if (tile != null)
                {
                    tile.Destroy();
                }
            }
            
            // Vertical
            for (int y = 0; y < board.boardHeight; y++)
            {
                Match3Tile tile = board.GetTile(position.x, y);
                if (tile != null)
                {
                    tile.Destroy();
                }
            }
            
            yield return new WaitForSeconds(0.3f);
        }
        
        /// <summary>
        /// Apply color bomb effect
        /// </summary>
        private IEnumerator ApplyColorBombEffect(Vector2Int position)
        {
            // Play color bomb effect
            if (rainbowEffect != null)
            {
                rainbowEffect.transform.position = new Vector3(position.x, position.y, 0);
                rainbowEffect.Play();
            }
            
            // Destroy all tiles on board
            for (int x = 0; x < board.boardWidth; x++)
            {
                for (int y = 0; y < board.boardHeight; y++)
                {
                    Match3Tile tile = board.GetTile(x, y);
                    if (tile != null)
                    {
                        tile.Destroy();
                    }
                }
            }
            
            yield return new WaitForSeconds(0.5f);
        }
        
        /// <summary>
        /// Play power-up effect
        /// </summary>
        private void PlayPowerUpEffect(PowerUpType powerUpType, Vector2Int position)
        {
            if (powerUpEffect != null)
            {
                powerUpEffect.transform.position = new Vector3(position.x, position.y, 0);
                powerUpEffect.Play();
            }
            
            if (powerUpSpawnSound != null)
            {
                AudioSource.PlayClipAtPoint(powerUpSpawnSound, Camera.main.transform.position);
            }
        }
        
        /// <summary>
        /// Get active power-ups
        /// </summary>
        public List<PowerUpData> GetActivePowerUps()
        {
            return new List<PowerUpData>(activePowerUps);
        }
        
        /// <summary>
        /// Get power-ups used count
        /// </summary>
        public int GetPowerUpsUsed()
        {
            return powerUpsUsed;
        }
        
        /// <summary>
        /// Reset power-up system
        /// </summary>
        public void Reset()
        {
            powerUpsUsed = 0;
            activePowerUps.Clear();
        }
    }
}