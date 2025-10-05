using System.Collections.Generic;
using System.IO;
using UnityEngine;
using Evergreen.Match3;
using Evergreen.Game;
using Evergreen.Data;

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

    private void LoadLevelFromFile(int id)
    {
        var path = Path.Combine(Application.streamingAssetsPath, "levels", $"level_{id}.json");
        if (File.Exists(path))
        {
            var txt = File.ReadAllText(path);
            LevelConfig = JsonUtility.FromJsonToDictionary(txt);
        }
        else
        {
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
