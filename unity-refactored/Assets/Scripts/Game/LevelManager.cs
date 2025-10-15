using System.Collections.Generic;
using System.IO;
using UnityEngine;
using Evergreen.Match3;
using Evergreen.Game;
using Evergreen.Data;
using Evergreen.Core;
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

    public Dictionary<string, object> LevelConfig { get; private set; }
    
    private LevelCacheManager _cacheManager;

    void Start()
    {
        _cacheManager = LevelCacheManager.Instance;
        
        if (enableCaching)
        {
            // Preload next few levels
            PreloadNextLevels();
        }
    }

    public void LoadLevel(int id)
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
            if (enableCaching)
            {
                LevelConfig = _cacheManager.GetLevelData(id);
            }
            else
            {
                LoadLevelFromFile(id);
            }
            
            ApplyConfig();
            
            // Consume energy for level play
            if (gameManager != null)
            {
                gameManager.TryConsumeEnergy(1);
                gameManager.TrackPlayerAction("player_123", "level_start", new Dictionary<string, object>
                {
                    ["level_id"] = id,
                    ["board_size"] = BoardSize,
                    ["move_limit"] = MoveLimit
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
}
