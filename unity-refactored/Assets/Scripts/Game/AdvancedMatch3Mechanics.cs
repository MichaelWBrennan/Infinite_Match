using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using Evergreen.Core;

namespace Evergreen.Game
{
    /// <summary>
    /// Advanced Match-3 mechanics with special pieces, power-ups, and combo systems
    /// </summary>
    public class AdvancedMatch3Mechanics : MonoBehaviour
    {
        public static AdvancedMatch3Mechanics Instance { get; private set; }

        [Header("Special Pieces")]
        public GameObject bombPrefab;
        public GameObject rocketPrefab;
        public GameObject colorBombPrefab;
        public GameObject lightningPrefab;
        public GameObject rainbowPrefab;
        public GameObject rainbowBombPrefab;

        [Header("Power-ups")]
        public GameObject hammerPowerUp;
        public GameObject shufflePowerUp;
        public GameObject extraMovesPowerUp;
        public GameObject timeFreezePowerUp;

        [Header("Combo Settings")]
        public float comboMultiplier = 1.2f;
        public int maxComboChain = 10;
        public float comboTimeWindow = 2f;

        [Header("Special Effects")]
        public ParticleSystem matchEffect;
        public ParticleSystem comboEffect;
        public ParticleSystem specialEffect;
        public AudioClip matchSound;
        public AudioClip comboSound;
        public AudioClip specialSound;

        private Dictionary<Vector2Int, SpecialPiece> _specialPieces = new Dictionary<Vector2Int, SpecialPiece>();
        private List<ComboChain> _activeCombos = new List<ComboChain>();
        private Dictionary<string, PowerUp> _activePowerUps = new Dictionary<string, PowerUp>();
        private int _currentComboCount = 0;
        private float _lastMatchTime = 0f;

        public enum SpecialPieceType
        {
            Normal,
            Bomb,
            RocketHorizontal,
            RocketVertical,
            ColorBomb,
            Lightning,
            Rainbow,
            RainbowBomb
        }

        public enum PowerUpType
        {
            Hammer,
            Shuffle,
            ExtraMoves,
            TimeFreeze,
            ColorChange,
            BoardClear
        }

        public class SpecialPiece
        {
            public SpecialPieceType type;
            public Vector2Int position;
            public int color;
            public float power;
            public bool isActivated;
            public GameObject visualObject;
        }

        public class ComboChain
        {
            public int comboCount;
            public float multiplier;
            public float startTime;
            public List<Vector2Int> matchedPositions;
            public int totalScore;
        }

        public class PowerUp
        {
            public string id;
            public PowerUpType type;
            public float duration;
            public float remainingTime;
            public Dictionary<string, object> parameters;
            public bool isActive;
        }

        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeMechanics();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        private void InitializeMechanics()
        {
            Logger.Info("Advanced Match-3 Mechanics initialized", "Match3Mechanics");
        }

        #region Special Piece Creation
        public SpecialPiece CreateSpecialPiece(SpecialPieceType type, Vector2Int position, int color = -1)
        {
            var specialPiece = new SpecialPiece
            {
                type = type,
                position = position,
                color = color,
                power = GetSpecialPiecePower(type),
                isActivated = false
            };

            // Create visual representation
            specialPiece.visualObject = CreateSpecialPieceVisual(type, position, color);
            _specialPieces[position] = specialPiece;

            return specialPiece;
        }

        private GameObject CreateSpecialPieceVisual(SpecialPieceType type, Vector2Int position, int color)
        {
            GameObject prefab = null;
            switch (type)
            {
                case SpecialPieceType.Bomb:
                    prefab = bombPrefab;
                    break;
                case SpecialPieceType.RocketHorizontal:
                    prefab = rocketPrefab;
                    break;
                case SpecialPieceType.RocketVertical:
                    prefab = rocketPrefab;
                    break;
                case SpecialPieceType.ColorBomb:
                    prefab = colorBombPrefab;
                    break;
                case SpecialPieceType.Lightning:
                    prefab = lightningPrefab;
                    break;
                case SpecialPieceType.Rainbow:
                    prefab = rainbowPrefab;
                    break;
                case SpecialPieceType.RainbowBomb:
                    prefab = rainbowBombPrefab;
                    break;
            }

            if (prefab != null)
            {
                var visual = Instantiate(prefab, new Vector3(position.x, position.y, 0), Quaternion.identity);
                return visual;
            }

            return null;
        }

        private float GetSpecialPiecePower(SpecialPieceType type)
        {
            switch (type)
            {
                case SpecialPieceType.Bomb:
                    return 1.5f;
                case SpecialPieceType.RocketHorizontal:
                case SpecialPieceType.RocketVertical:
                    return 2.0f;
                case SpecialPieceType.ColorBomb:
                    return 3.0f;
                case SpecialPieceType.Lightning:
                    return 2.5f;
                case SpecialPieceType.Rainbow:
                    return 4.0f;
                case SpecialPieceType.RainbowBomb:
                    return 5.0f;
                default:
                    return 1.0f;
            }
        }
        #endregion

        #region Match Detection and Processing
        public List<MatchResult> ProcessMatches(List<Vector2Int> matchedPositions, int color)
        {
            var results = new List<MatchResult>();
            var currentTime = Time.time;

            // Check for combo continuation
            if (currentTime - _lastMatchTime <= comboTimeWindow)
            {
                _currentComboCount++;
            }
            else
            {
                _currentComboCount = 1;
            }

            _lastMatchTime = currentTime;

            // Process each matched position
            foreach (var position in matchedPositions)
            {
                var result = ProcessMatchAtPosition(position, color);
                if (result != null)
                {
                    results.Add(result);
                }
            }

            // Check for special piece creation
            CheckForSpecialPieceCreation(matchedPositions, color);

            // Process combos
            ProcessComboChain(results);

            return results;
        }

        private MatchResult ProcessMatchAtPosition(Vector2Int position, int color)
        {
            var result = new MatchResult
            {
                position = position,
                color = color,
                score = CalculateBaseScore(color),
                specialEffects = new List<SpecialEffect>()
            };

            // Check if position has special piece
            if (_specialPieces.ContainsKey(position))
            {
                var specialPiece = _specialPieces[position];
                result = ActivateSpecialPiece(specialPiece, result);
            }

            // Apply combo multiplier
            if (_currentComboCount > 1)
            {
                result.score = Mathf.RoundToInt(result.score * Mathf.Pow(comboMultiplier, _currentComboCount - 1));
                result.comboCount = _currentComboCount;
            }

            return result;
        }

        private MatchResult ActivateSpecialPiece(SpecialPiece specialPiece, MatchResult result)
        {
            specialPiece.isActivated = true;

            switch (specialPiece.type)
            {
                case SpecialPieceType.Bomb:
                    result.specialEffects.AddRange(ActivateBomb(specialPiece));
                    break;
                case SpecialPieceType.RocketHorizontal:
                    result.specialEffects.AddRange(ActivateRocketHorizontal(specialPiece));
                    break;
                case SpecialPieceType.RocketVertical:
                    result.specialEffects.AddRange(ActivateRocketVertical(specialPiece));
                    break;
                case SpecialPieceType.ColorBomb:
                    result.specialEffects.AddRange(ActivateColorBomb(specialPiece));
                    break;
                case SpecialPieceType.Lightning:
                    result.specialEffects.AddRange(ActivateLightning(specialPiece));
                    break;
                case SpecialPieceType.Rainbow:
                    result.specialEffects.AddRange(ActivateRainbow(specialPiece));
                    break;
                case SpecialPieceType.RainbowBomb:
                    result.specialEffects.AddRange(ActivateRainbowBomb(specialPiece));
                    break;
            }

            result.score = Mathf.RoundToInt(result.score * specialPiece.power);
            return result;
        }

        private List<SpecialEffect> ActivateBomb(SpecialPiece bomb)
        {
            var effects = new List<SpecialEffect>();
            var positions = GetBombPositions(bomb.position);

            foreach (var pos in positions)
            {
                effects.Add(new SpecialEffect
                {
                    type = SpecialEffectType.Explosion,
                    position = pos,
                    damage = 1,
                    radius = 1
                });
            }

            PlaySpecialEffect(specialEffect, bomb.position);
            return effects;
        }

        private List<SpecialEffect> ActivateRocketHorizontal(SpecialPiece rocket)
        {
            var effects = new List<SpecialEffect>();
            var positions = GetHorizontalLinePositions(rocket.position);

            foreach (var pos in positions)
            {
                effects.Add(new SpecialEffect
                {
                    type = SpecialEffectType.LineClear,
                    position = pos,
                    damage = 1,
                    direction = Vector2Int.right
                });
            }

            PlaySpecialEffect(specialEffect, rocket.position);
            return effects;
        }

        private List<SpecialEffect> ActivateRocketVertical(SpecialPiece rocket)
        {
            var effects = new List<SpecialEffect>();
            var positions = GetVerticalLinePositions(rocket.position);

            foreach (var pos in positions)
            {
                effects.Add(new SpecialEffect
                {
                    type = SpecialEffectType.LineClear,
                    position = pos,
                    damage = 1,
                    direction = Vector2Int.up
                });
            }

            PlaySpecialEffect(specialEffect, rocket.position);
            return effects;
        }

        private List<SpecialEffect> ActivateColorBomb(SpecialPiece colorBomb)
        {
            var effects = new List<SpecialEffect>();
            var positions = GetAllPositionsOfColor(colorBomb.color);

            foreach (var pos in positions)
            {
                effects.Add(new SpecialEffect
                {
                    type = SpecialEffectType.ColorClear,
                    position = pos,
                    damage = 1,
                    color = colorBomb.color
                });
            }

            PlaySpecialEffect(specialEffect, colorBomb.position);
            return effects;
        }

        private List<SpecialEffect> ActivateLightning(SpecialPiece lightning)
        {
            var effects = new List<SpecialEffect>();
            var positions = GetLightningPositions(lightning.position);

            foreach (var pos in positions)
            {
                effects.Add(new SpecialEffect
                {
                    type = SpecialEffectType.Lightning,
                    position = pos,
                    damage = 1,
                    radius = 2
                });
            }

            PlaySpecialEffect(specialEffect, lightning.position);
            return effects;
        }

        private List<SpecialEffect> ActivateRainbow(SpecialPiece rainbow)
        {
            var effects = new List<SpecialEffect>();
            var positions = GetRainbowPositions(rainbow.position);

            foreach (var pos in positions)
            {
                effects.Add(new SpecialEffect
                {
                    type = SpecialEffectType.Rainbow,
                    position = pos,
                    damage = 1,
                    radius = 3
                });
            }

            PlaySpecialEffect(specialEffect, rainbow.position);
            return effects;
        }

        private List<SpecialEffect> ActivateRainbowBomb(SpecialPiece rainbowBomb)
        {
            var effects = new List<SpecialEffect>();
            var positions = GetRainbowBombPositions(rainbowBomb.position);

            foreach (var pos in positions)
            {
                effects.Add(new SpecialEffect
                {
                    type = SpecialEffectType.RainbowBomb,
                    position = pos,
                    damage = 2,
                    radius = 4
                });
            }

            PlaySpecialEffect(specialEffect, rainbowBomb.position);
            return effects;
        }
        #endregion

        #region Position Calculation
        private List<Vector2Int> GetBombPositions(Vector2Int center)
        {
            var positions = new List<Vector2Int>();
            for (int x = -1; x <= 1; x++)
            {
                for (int y = -1; y <= 1; y++)
                {
                    positions.Add(center + new Vector2Int(x, y));
                }
            }
            return positions;
        }

        private List<Vector2Int> GetHorizontalLinePositions(Vector2Int center)
        {
            var positions = new List<Vector2Int>();
            for (int x = 0; x < 9; x++) // Assuming 9x9 board
            {
                positions.Add(new Vector2Int(x, center.y));
            }
            return positions;
        }

        private List<Vector2Int> GetVerticalLinePositions(Vector2Int center)
        {
            var positions = new List<Vector2Int>();
            for (int y = 0; y < 9; y++) // Assuming 9x9 board
            {
                positions.Add(new Vector2Int(center.x, y));
            }
            return positions;
        }

        private List<Vector2Int> GetAllPositionsOfColor(int color)
        {
            var positions = new List<Vector2Int>();
            // This would need access to the board to find all positions of a specific color
            // For now, return empty list
            return positions;
        }

        private List<Vector2Int> GetLightningPositions(Vector2Int center)
        {
            var positions = new List<Vector2Int>();
            // Lightning strikes in a cross pattern
            for (int i = -2; i <= 2; i++)
            {
                positions.Add(center + new Vector2Int(i, 0));
                positions.Add(center + new Vector2Int(0, i));
            }
            return positions;
        }

        private List<Vector2Int> GetRainbowPositions(Vector2Int center)
        {
            var positions = new List<Vector2Int>();
            // Rainbow affects a 3x3 area
            for (int x = -1; x <= 1; x++)
            {
                for (int y = -1; y <= 1; y++)
                {
                    positions.Add(center + new Vector2Int(x, y));
                }
            }
            return positions;
        }

        private List<Vector2Int> GetRainbowBombPositions(Vector2Int center)
        {
            var positions = new List<Vector2Int>();
            // Rainbow bomb affects a 5x5 area
            for (int x = -2; x <= 2; x++)
            {
                for (int y = -2; y <= 2; y++)
                {
                    positions.Add(center + new Vector2Int(x, y));
                }
            }
            return positions;
        }
        #endregion

        #region Combo System
        private void ProcessComboChain(List<MatchResult> results)
        {
            var currentCombo = new ComboChain
            {
                comboCount = _currentComboCount,
                multiplier = Mathf.Pow(comboMultiplier, _currentComboCount - 1),
                startTime = Time.time,
                matchedPositions = results.Select(r => r.position).ToList(),
                totalScore = results.Sum(r => r.score)
            };

            _activeCombos.Add(currentCombo);

            // Play combo effect
            if (_currentComboCount > 1)
            {
                PlayComboEffect();
            }

            // Clean up old combos
            _activeCombos.RemoveAll(c => Time.time - c.startTime > comboTimeWindow * 2);
        }

        private void PlayComboEffect()
        {
            if (comboEffect != null)
            {
                comboEffect.Play();
            }

            if (comboSound != null)
            {
                AudioSource.PlayClipAtPoint(comboSound, Vector3.zero);
            }
        }
        #endregion

        #region Power-ups
        public void ActivatePowerUp(string powerUpId, PowerUpType type, Dictionary<string, object> parameters = null)
        {
            var powerUp = new PowerUp
            {
                id = powerUpId,
                type = type,
                duration = GetPowerUpDuration(type),
                remainingTime = GetPowerUpDuration(type),
                parameters = parameters ?? new Dictionary<string, object>(),
                isActive = true
            };

            _activePowerUps[powerUpId] = powerUp;
            ApplyPowerUpEffect(powerUp);
        }

        private float GetPowerUpDuration(PowerUpType type)
        {
            switch (type)
            {
                case PowerUpType.Hammer:
                    return 10f;
                case PowerUpType.Shuffle:
                    return 0f; // Instant
                case PowerUpType.ExtraMoves:
                    return 0f; // Instant
                case PowerUpType.TimeFreeze:
                    return 15f;
                case PowerUpType.ColorChange:
                    return 0f; // Instant
                case PowerUpType.BoardClear:
                    return 0f; // Instant
                default:
                    return 5f;
            }
        }

        private void ApplyPowerUpEffect(PowerUp powerUp)
        {
            switch (powerUp.type)
            {
                case PowerUpType.Hammer:
                    // Enable hammer mode
                    break;
                case PowerUpType.Shuffle:
                    // Shuffle the board
                    ShuffleBoard();
                    break;
                case PowerUpType.ExtraMoves:
                    // Add extra moves
                    AddExtraMoves(5);
                    break;
                case PowerUpType.TimeFreeze:
                    // Freeze time
                    FreezeTime();
                    break;
                case PowerUpType.ColorChange:
                    // Change colors
                    ChangeRandomColors();
                    break;
                case PowerUpType.BoardClear:
                    // Clear entire board
                    ClearBoard();
                    break;
            }
        }

        private void ShuffleBoard()
        {
            // Implementation for shuffling the board
            Logger.Info("Board shuffled", "Match3Mechanics");
        }

        private void AddExtraMoves(int moves)
        {
            // Implementation for adding extra moves
            Logger.Info($"Added {moves} extra moves", "Match3Mechanics");
        }

        private void FreezeTime()
        {
            // Implementation for freezing time
            Logger.Info("Time frozen", "Match3Mechanics");
        }

        private void ChangeRandomColors()
        {
            // Implementation for changing random colors
            Logger.Info("Random colors changed", "Match3Mechanics");
        }

        private void ClearBoard()
        {
            // Implementation for clearing the board
            Logger.Info("Board cleared", "Match3Mechanics");
        }
        #endregion

        #region Effects and Audio
        private void PlaySpecialEffect(ParticleSystem effect, Vector2Int position)
        {
            if (effect != null)
            {
                effect.transform.position = new Vector3(position.x, position.y, 0);
                effect.Play();
            }
        }

        private int CalculateBaseScore(int color)
        {
            return 100 + (color * 10);
        }
        #endregion

        #region Special Piece Creation Logic
        private void CheckForSpecialPieceCreation(List<Vector2Int> matchedPositions, int color)
        {
            // Check for 4-in-a-row (creates rocket)
            var horizontalGroups = GroupPositionsByRow(matchedPositions);
            foreach (var group in horizontalGroups.Values)
            {
                if (group.Count >= 4)
                {
                    CreateSpecialPiece(SpecialPieceType.RocketHorizontal, group[group.Count / 2], color);
                }
            }

            // Check for 4-in-a-column (creates rocket)
            var verticalGroups = GroupPositionsByColumn(matchedPositions);
            foreach (var group in verticalGroups.Values)
            {
                if (group.Count >= 4)
                {
                    CreateSpecialPiece(SpecialPieceType.RocketVertical, group[group.Count / 2], color);
                }
            }

            // Check for 5-in-a-row or L-shape (creates bomb)
            if (matchedPositions.Count >= 5)
            {
                CreateSpecialPiece(SpecialPieceType.Bomb, matchedPositions[matchedPositions.Count / 2], color);
            }

            // Check for T-shape or L-shape (creates color bomb)
            if (IsTShape(matchedPositions) || IsLShape(matchedPositions))
            {
                CreateSpecialPiece(SpecialPieceType.ColorBomb, matchedPositions[0], color);
            }
        }

        private Dictionary<int, List<Vector2Int>> GroupPositionsByRow(List<Vector2Int> positions)
        {
            return positions.GroupBy(p => p.y).ToDictionary(g => g.Key, g => g.ToList());
        }

        private Dictionary<int, List<Vector2Int>> GroupPositionsByColumn(List<Vector2Int> positions)
        {
            return positions.GroupBy(p => p.x).ToDictionary(g => g.Key, g => g.ToList());
        }

        private bool IsTShape(List<Vector2Int> positions)
        {
            // Simplified T-shape detection
            return positions.Count >= 5;
        }

        private bool IsLShape(List<Vector2Int> positions)
        {
            // Simplified L-shape detection
            return positions.Count >= 5;
        }
        #endregion

        #region Data Structures
        public class MatchResult
        {
            public Vector2Int position;
            public int color;
            public int score;
            public int comboCount;
            public List<SpecialEffect> specialEffects;
        }

        public class SpecialEffect
        {
            public SpecialEffectType type;
            public Vector2Int position;
            public int damage;
            public int radius;
            public Vector2Int direction;
            public int color;
        }

        public enum SpecialEffectType
        {
            Explosion,
            LineClear,
            ColorClear,
            Lightning,
            Rainbow,
            RainbowBomb
        }
        #endregion

        #region Statistics
        public Dictionary<string, object> GetMechanicsStatistics()
        {
            return new Dictionary<string, object>
            {
                {"active_special_pieces", _specialPieces.Count},
                {"active_combos", _activeCombos.Count},
                {"current_combo_count", _currentComboCount},
                {"active_power_ups", _activePowerUps.Count},
                {"total_special_pieces_created", _specialPieces.Count},
                {"max_combo_achieved", _activeCombos.Count > 0 ? _activeCombos.Max(c => c.comboCount) : 0}
            };
        }
        #endregion
    }
}