#if UNITY_EDITOR
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using System.Linq;

[InitializeOnLoad]
public static class AutoProjectSetup
{
    static AutoProjectSetup()
    {
        // Run once on editor load to ensure scenes are in build and play mode scene set
        EnsureScenesInBuild();
        EnsurePlayModeStartScene();
    }

    [MenuItem("Tools/Setup/Ensure Scenes & PlayMode Scene")]
    public static void RunSetup()
    {
        EnsureScenesInBuild();
        EnsurePlayModeStartScene();
        Debug.Log("AutoProjectSetup: Scenes ensured and PlayMode start scene set.");
    }

    private static void EnsureScenesInBuild()
    {
        string[] required = new[]
        {
            "Assets/Scenes/Bootstrap.unity",
            "Assets/Scenes/MainMenu.unity",
            "Assets/Scenes/Gameplay.unity",
        };

        var existing = EditorBuildSettings.scenes.Select(s => s.path).ToList();
        bool changed = false;

        foreach (var path in required)
        {
            var sceneAsset = AssetDatabase.LoadAssetAtPath<SceneAsset>(path);
            if (sceneAsset == null) continue;
            if (!existing.Contains(path))
            {
                var list = EditorBuildSettings.scenes.ToList();
                list.Add(new EditorBuildSettingsScene(path, true));
                EditorBuildSettings.scenes = list.ToArray();
                changed = true;
            }
        }

        if (changed)
        {
            Debug.Log("AutoProjectSetup: Updated EditorBuildSettings scenes.");
        }
    }

    private static void EnsurePlayModeStartScene()
    {
        // Prefer Bootstrap, else MainMenu
        var bootstrap = AssetDatabase.LoadAssetAtPath<SceneAsset>("Assets/Scenes/Bootstrap.unity");
        var mainmenu = AssetDatabase.LoadAssetAtPath<SceneAsset>("Assets/Scenes/MainMenu.unity");
        if (bootstrap != null)
        {
            EditorSceneManager.playModeStartScene = bootstrap;
        }
        else if (mainmenu != null)
        {
            EditorSceneManager.playModeStartScene = mainmenu;
        }
    }
}
#endif
