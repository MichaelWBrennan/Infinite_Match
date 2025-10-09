
using UnityEngine;
using UnityEditor;
using UnityEditor.Animations;
using UnityEngine.Timeline;
using UnityEngine.Playables;
using System.Collections.Generic;

namespace Evergreen.Editor
{
    public class Match3AnimationAutomation : EditorWindow
    {
        [MenuItem("Tools/Match-3 Animation/Automate Everything")]
        public static void ShowWindow()
        {
            GetWindow<Match3AnimationAutomation>("Match-3 Animation Automation");
        }

        private void OnGUI()
        {
            GUILayout.Label("Match-3 Animation Automation", EditorStyles.boldLabel);
            GUILayout.Space(10);

            if (GUILayout.Button("🎮 Setup Match-3 Animations", GUILayout.Height(30)))
            {
                SetupMatch3Animations();
            }

            if (GUILayout.Button("🎭 Setup Animator Controllers", GUILayout.Height(30)))
            {
                SetupAnimatorControllers();
            }

            if (GUILayout.Button("⏰ Setup Timeline", GUILayout.Height(30)))
            {
                SetupTimeline();
            }

            if (GUILayout.Button("🎯 Run Full Automation", GUILayout.Height(40)))
            {
                RunFullAutomation();
            }
        }

        private static void SetupMatch3Animations()
        {
            try
            {
                Debug.Log("🎮 Setting up Match-3 animations...");

                // Load animation configuration
                string configPath = "Assets/Animations/Match3Animations.json";
                if (File.Exists(configPath))
                {
                    string json = File.ReadAllText(configPath);
                    var config = JsonUtility.FromJson<Match3AnimationConfig>(json);

                    // Create tile animations
                    CreateTileAnimations(config.tile_animations);

                    // Create UI animations
                    CreateUIAnimations(config.ui_animations);

                    // Create particle animations
                    CreateParticleAnimations(config.particle_animations);

                    Debug.Log("✅ Match-3 animations setup completed!");
                }
                else
                {
                    Debug.LogWarning("⚠️ Match3Animations.json not found");
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Match-3 animation setup failed: {e.Message}");
            }
        }

        private static void CreateTileAnimations(Dictionary<string, TileAnimation> tileAnimations)
        {
            foreach (var kvp in tileAnimations)
            {
                var animName = kvp.Key;
                var anim = kvp.Value;

                Debug.Log($"🎬 Creating tile animation: {animName}");

                // Create animation clip for tile
                var clip = new AnimationClip();
                clip.name = $"Tile_{animName}";

                // Set up scale animation
                var scaleCurve = AnimationCurve.EaseInOut(0f, anim.scale_from[0], anim.duration, anim.scale_to[0]);
                clip.SetCurve("", typeof(Transform), "localScale.x", scaleCurve);
                clip.SetCurve("", typeof(Transform), "localScale.y", scaleCurve);
                clip.SetCurve("", typeof(Transform), "localScale.z", scaleCurve);

                // Set up rotation animation
                var rotationCurve = AnimationCurve.EaseInOut(0f, anim.rotation_from[0], anim.duration, anim.rotation_to[0]);
                clip.SetCurve("", typeof(Transform), "localEulerAngles.z", rotationCurve);

                // Save animation clip
                AssetDatabase.CreateAsset(clip, $"Assets/Animations/Tile_{animName}.anim");
            }
        }

        private static void CreateUIAnimations(Dictionary<string, UIAnimation> uiAnimations)
        {
            foreach (var kvp in uiAnimations)
            {
                var animName = kvp.Key;
                var anim = kvp.Value;

                Debug.Log($"🖥️ Creating UI animation: {animName}");

                // Create animation clip for UI
                var clip = new AnimationClip();
                clip.name = $"UI_{animName}";

                // Set up scale animation
                var scaleCurve = AnimationCurve.EaseInOut(0f, anim.scale_from[0], anim.duration, anim.scale_to[0]);
                clip.SetCurve("", typeof(Transform), "localScale.x", scaleCurve);
                clip.SetCurve("", typeof(Transform), "localScale.y", scaleCurve);
                clip.SetCurve("", typeof(Transform), "localScale.z", scaleCurve);

                // Set up alpha animation
                if (anim.alpha_from != anim.alpha_to)
                {
                    var alphaCurve = AnimationCurve.EaseInOut(0f, anim.alpha_from, anim.duration, anim.alpha_to);
                    clip.SetCurve("", typeof(CanvasGroup), "alpha", alphaCurve);
                }

                // Save animation clip
                AssetDatabase.CreateAsset(clip, $"Assets/Animations/UI_{animName}.anim");
            }
        }

        private static void CreateParticleAnimations(Dictionary<string, ParticleAnimation> particleAnimations)
        {
            foreach (var kvp in particleAnimations)
            {
                var animName = kvp.Key;
                var anim = kvp.Value;

                Debug.Log($"✨ Creating particle animation: {animName}");

                // Create particle system prefab
                var particleSystem = new GameObject($"Particle_{animName}");
                var ps = particleSystem.AddComponent<ParticleSystem>();

                // Configure particle system
                var main = ps.main;
                main.duration = anim.duration;
                main.maxParticles = anim.particle_count;
                main.startLifetime = anim.duration;
                main.startSpeed = anim.velocity;

                var shape = ps.shape;
                shape.shapeType = ParticleSystemShapeType.Circle;
                shape.radius = anim.burst_radius;

                // Save particle system
                PrefabUtility.SaveAsPrefabAsset(particleSystem, $"Assets/Animations/Particle_{animName}.prefab");
                DestroyImmediate(particleSystem);
            }
        }

        private static void SetupAnimatorControllers()
        {
            try
            {
                Debug.Log("🎭 Setting up Animator Controllers...");

                // Create tile animator controller
                CreateTileAnimatorController();

                // Create UI animator controller
                CreateUIAnimatorController();

                Debug.Log("✅ Animator Controllers setup completed!");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Animator Controller setup failed: {e.Message}");
            }
        }

        private static void CreateTileAnimatorController()
        {
            var controller = AnimatorController.CreateAnimatorControllerAtPath("Assets/Animators/TileAnimator.controller");

            // Add states
            var idleState = controller.layers[0].stateMachine.AddState("Idle");
            var spawnState = controller.layers[0].stateMachine.AddState("Spawn");
            var matchState = controller.layers[0].stateMachine.AddState("Match");
            var fallState = controller.layers[0].stateMachine.AddState("Fall");

            // Set default state
            controller.layers[0].stateMachine.defaultState = idleState;

            // Add transitions
            var idleToSpawn = idleState.AddTransition(spawnState);
            idleToSpawn.hasExitTime = false;
            idleToSpawn.duration = 0.25f;

            var spawnToIdle = spawnState.AddTransition(idleState);
            spawnToIdle.hasExitTime = true;
            spawnToIdle.duration = 0.25f;

            var idleToMatch = idleState.AddTransition(matchState);
            idleToMatch.hasExitTime = false;
            idleToMatch.duration = 0.25f;

            var matchToFall = matchState.AddTransition(fallState);
            matchToFall.hasExitTime = true;
            matchToFall.duration = 0.5f;

            var fallToIdle = fallState.AddTransition(idleState);
            fallToIdle.hasExitTime = true;
            fallToIdle.duration = 0.4f;

            Debug.Log("🎭 Tile Animator Controller created");
        }

        private static void CreateUIAnimatorController()
        {
            var controller = AnimatorController.CreateAnimatorControllerAtPath("Assets/Animators/UIAnimator.controller");

            // Add states
            var hiddenState = controller.layers[0].stateMachine.AddState("Hidden");
            var showState = controller.layers[0].stateMachine.AddState("Show");

            // Set default state
            controller.layers[0].stateMachine.defaultState = hiddenState;

            // Add transitions
            var hiddenToShow = hiddenState.AddTransition(showState);
            hiddenToShow.hasExitTime = false;
            hiddenToShow.duration = 0.25f;

            var showToHidden = showState.AddTransition(hiddenState);
            showToHidden.hasExitTime = false;
            showToHidden.duration = 0.25f;

            Debug.Log("🎭 UI Animator Controller created");
        }

        private static void SetupTimeline()
        {
            try
            {
                Debug.Log("⏰ Setting up Timeline...");

                // Load timeline configuration
                string configPath = "Assets/Animations/TimelineConfig.json";
                if (File.Exists(configPath))
                {
                    string json = File.ReadAllText(configPath);
                    var config = JsonUtility.FromJson<TimelineConfig>(json);

                    // Create timeline assets
                    CreateTimelineAssets(config);

                    Debug.Log("✅ Timeline setup completed!");
                }
                else
                {
                    Debug.LogWarning("⚠️ TimelineConfig.json not found");
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Timeline setup failed: {e.Message}");
            }
        }

        private static void CreateTimelineAssets(TimelineConfig config)
        {
            foreach (var kvp in config.timelines)
            {
                var timelineName = kvp.Key;
                var timeline = kvp.Value;

                Debug.Log($"⏰ Creating timeline: {timelineName}");

                // Create timeline asset
                var timelineAsset = ScriptableObject.CreateInstance<TimelineAsset>();
                timelineAsset.name = timelineName;

                // Save timeline asset
                AssetDatabase.CreateAsset(timelineAsset, $"Assets/Animations/{timelineName}.playable");
            }
        }

        private static void RunFullAutomation()
        {
            try
            {
                Debug.Log("🎯 Running full Match-3 animation automation...");

                SetupMatch3Animations();
                SetupAnimatorControllers();
                SetupTimeline();

                Debug.Log("🎉 Full Match-3 animation automation completed!");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Full automation failed: {e.Message}");
            }
        }
    }

    // Data structures for JSON deserialization
    [System.Serializable]
    public class Match3AnimationConfig
    {
        public Dictionary<string, TileAnimation> tile_animations;
        public Dictionary<string, UIAnimation> ui_animations;
        public Dictionary<string, ParticleAnimation> particle_animations;
    }

    [System.Serializable]
    public class TileAnimation
    {
        public float duration;
        public string ease_type;
        public float[] scale_from;
        public float[] scale_to;
        public float[] rotation_from;
        public float[] rotation_to;
        public float[] position_offset;
    }

    [System.Serializable]
    public class UIAnimation
    {
        public float duration;
        public string ease_type;
        public float[] scale_from;
        public float[] scale_to;
        public float alpha_from;
        public float alpha_to;
        public float[] position_offset;
    }

    [System.Serializable]
    public class ParticleAnimation
    {
        public float duration;
        public int particle_count;
        public float burst_radius;
        public float velocity;
        public string[] colors;
    }

    [System.Serializable]
    public class TimelineConfig
    {
        public Dictionary<string, TimelineData> timelines;
    }

    [System.Serializable]
    public class TimelineData
    {
        public float duration;
        public List<TrackData> tracks;
    }

    [System.Serializable]
    public class TrackData
    {
        public string name;
        public string type;
        public List<ClipData> clips;
    }

    [System.Serializable]
    public class ClipData
    {
        public float start_time;
        public float duration;
        public string action;
        public string target;
    }
}
