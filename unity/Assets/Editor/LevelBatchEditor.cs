using UnityEditor;using UnityEngine;using System.IO;using System.Collections.Generic;using Evergreen.Match3;using Evergreen.Game;

public class LevelBatchEditor : EditorWindow
{
    private int levelsToGenerate = 10;
    private Vector2Int boardSize = new Vector2Int(8,8);
    private int numColors = 5;
    private int moveLimit = 20;

    [MenuItem("Evergreen/Level Batch Generator")]    public static void ShowWindow(){ GetWindow<LevelBatchEditor>("Level Batch Generator"); }
    void OnGUI(){
        GUILayout.Label("Batch Generate Levels", EditorStyles.boldLabel);
        levelsToGenerate = EditorGUILayout.IntField("Count", levelsToGenerate);
        boardSize = EditorGUILayout.Vector2IntField("Board Size", boardSize);
        numColors = EditorGUILayout.IntField("Num Colors", numColors);
        moveLimit = EditorGUILayout.IntField("Move Limit", moveLimit);
        if (GUILayout.Button("Generate")) Generate();
    }
    void Generate(){
        var outDir = Path.Combine(Application.dataPath, "StreamingAssets/levels"); Directory.CreateDirectory(outDir);
        for (int i=1;i<=levelsToGenerate;i++){
            var cfg = new Dictionary<string, object>{
                {"id", i}, {"size", new List<object>{boardSize.x, boardSize.y}}, {"num_colors", numColors}, {"move_limit", moveLimit}
            };
            var json = MiniJSON.Json.Serialize(cfg);
            File.WriteAllText(Path.Combine(outDir, $"level_{i}.json"), json);
        }
        AssetDatabase.Refresh();
        Debug.Log($"Generated {levelsToGenerate} levels.");
    }
}
