using System.Collections.Generic;
using System.IO;
using UnityEngine;
using Evergreen.Match3;
using Evergreen.Game;

public class LevelManager : MonoBehaviour
{
    public Vector2Int BoardSize = new Vector2Int(8, 8);
    public int NumColors = 5;
    public int MoveLimit = 20;
    public int[] ScoreStars = new []{500, 1500, 3000};

    public Dictionary<string, object> LevelConfig;

    public void LoadLevel(int id)
    {
        var path = Path.Combine(Application.streamingAssetsPath, "levels", $"level_{id}.json");
        if (File.Exists(path))
        {
            var txt = File.ReadAllText(path);
            LevelConfig = MiniJSON.Json.Deserialize(txt) as Dictionary<string, object>;
            ApplyConfig();
        }
        else
        {
            LevelConfig = new Dictionary<string, object>();
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
