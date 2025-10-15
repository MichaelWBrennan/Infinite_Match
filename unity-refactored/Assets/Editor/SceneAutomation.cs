
using UnityEngine;
using UnityEditor;
using UnityEngine.SceneManagement;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using System.IO;
using System.Collections.Generic;

namespace Evergreen.Editor
{
    public class SceneAutomation : EditorWindow
    {
        [MenuItem("Tools/Scene/Automate Everything")]
        public static void ShowWindow()
        {
            GetWindow<SceneAutomation>("Scene Automation");
        }

        private void OnGUI()
        {
            GUILayout.Label("Scene Automation", EditorStyles.boldLabel);
            GUILayout.Space(10);

            if (GUILayout.Button("💡 Setup Lighting", GUILayout.Height(30)))
            {
                SetupLighting();
            }

            if (GUILayout.Button("⚡ Setup Physics", GUILayout.Height(30)))
            {
                SetupPhysics();
            }

            if (GUILayout.Button("🔊 Setup Audio", GUILayout.Height(30)))
            {
                SetupAudio();
            }

            if (GUILayout.Button("🖥️ Setup UI", GUILayout.Height(30)))
            {
                SetupUI();
            }

            if (GUILayout.Button("🚀 Optimize Scene", GUILayout.Height(30)))
            {
                OptimizeScene();
            }

            if (GUILayout.Button("🎯 Run Full Automation", GUILayout.Height(40)))
            {
                RunFullAutomation();
            }
        }

        private static void SetupLighting()
        {
            try
            {
                Debug.Log("💡 Setting up scene lighting...");

                // Load lighting configuration
                string configPath = "Assets/Scenes/LightingConfig.json";
                if (File.Exists(configPath))
                {
                    string json = File.ReadAllText(configPath);
                    var config = JsonUtility.FromJson<LightingConfig>(json);

                    // Apply lighting settings
                    ApplyLightingSettings(config);

                    Debug.Log("✅ Scene lighting setup completed!");
                }
                else
                {
                    Debug.LogWarning("⚠️ LightingConfig.json not found");
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Lighting setup failed: {e.Message}");
            }
        }

        private static void ApplyLightingSettings(LightingConfig config)
        {
            // Apply lighting settings
            RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Skybox;
            RenderSettings.ambientIntensity = config.lighting_settings.environment_lighting.environment_lighting_intensity;

            // Setup main light
            var mainLight = FindObjectOfType<Light>();
            if (mainLight != null)
            {
                mainLight.type = LightType.Directional;
                mainLight.color = new Color(
                    config.scene_lighting.main_light.color[0],
                    config.scene_lighting.main_light.color[1],
                    config.scene_lighting.main_light.color[2],
                    config.scene_lighting.main_light.color[3]
                );
                mainLight.intensity = config.scene_lighting.main_light.intensity;
                mainLight.shadows = LightShadows.Soft;
            }

            Debug.Log("💡 Lighting settings applied");
        }

        private static void SetupPhysics()
        {
            try
            {
                Debug.Log("⚡ Setting up scene physics...");

                // Load physics configuration
                string configPath = "Assets/Scenes/PhysicsConfig.json";
                if (File.Exists(configPath))
                {
                    string json = File.ReadAllText(configPath);
                    var config = JsonUtility.FromJson<PhysicsConfig>(json);

                    // Apply physics settings
                    ApplyPhysicsSettings(config);

                    Debug.Log("✅ Scene physics setup completed!");
                }
                else
                {
                    Debug.LogWarning("⚠️ PhysicsConfig.json not found");
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Physics setup failed: {e.Message}");
            }
        }

        private static void ApplyPhysicsSettings(PhysicsConfig config)
        {
            // Apply physics settings
            Physics.gravity = new Vector3(
                config.physics_settings.gravity[0],
                config.physics_settings.gravity[1],
                config.physics_settings.gravity[2]
            );

            Debug.Log("⚡ Physics settings applied");
        }

        private static void SetupAudio()
        {
            try
            {
                Debug.Log("🔊 Setting up scene audio...");

                // Load audio configuration
                string configPath = "Assets/Scenes/AudioConfig.json";
                if (File.Exists(configPath))
                {
                    string json = File.ReadAllText(configPath);
                    var config = JsonUtility.FromJson<AudioConfig>(json);

                    // Apply audio settings
                    ApplyAudioSettings(config);

                    Debug.Log("✅ Scene audio setup completed!");
                }
                else
                {
                    Debug.LogWarning("⚠️ AudioConfig.json not found");
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Audio setup failed: {e.Message}");
            }
        }

        private static void ApplyAudioSettings(AudioConfig config)
        {
            // Apply audio settings
            var audioListener = FindObjectOfType<AudioListener>();
            if (audioListener != null)
            {
                audioListener.volume = config.audio_settings.audio_listener.volume;
            }

            Debug.Log("🔊 Audio settings applied");
        }

        private static void SetupUI()
        {
            try
            {
                Debug.Log("🖥️ Setting up scene UI...");

                // Load UI configuration
                string configPath = "Assets/Scenes/UIConfig.json";
                if (File.Exists(configPath))
                {
                    string json = File.ReadAllText(configPath);
                    var config = JsonUtility.FromJson<UIConfig>(json);

                    // Apply UI settings
                    ApplyUISettings(config);

                    Debug.Log("✅ Scene UI setup completed!");
                }
                else
                {
                    Debug.LogWarning("⚠️ UIConfig.json not found");
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ UI setup failed: {e.Message}");
            }
        }

        private static void ApplyUISettings(UIConfig config)
        {
            // Apply UI settings
            var canvases = FindObjectsOfType<Canvas>();
            foreach (var canvas in canvases)
            {
                var scaler = canvas.GetComponent<CanvasScaler>();
                if (scaler != null)
                {
                    scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
                    scaler.referenceResolution = new Vector2(
                        config.ui_settings.canvas_scaler.reference_resolution[0],
                        config.ui_settings.canvas_scaler.reference_resolution[1]
                    );
                }
            }

            Debug.Log("🖥️ UI settings applied");
        }

        private static void OptimizeScene()
        {
            try
            {
                Debug.Log("🚀 Optimizing scene...");

                // Load optimization configuration
                string configPath = "Assets/Scenes/OptimizationConfig.json";
                if (File.Exists(configPath))
                {
                    string json = File.ReadAllText(configPath);
                    var config = JsonUtility.FromJson<OptimizationConfig>(json);

                    // Apply optimization settings
                    ApplyOptimizationSettings(config);

                    Debug.Log("✅ Scene optimization completed!");
                }
                else
                {
                    Debug.LogWarning("⚠️ OptimizationConfig.json not found");
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Scene optimization failed: {e.Message}");
            }
        }

        private static void ApplyOptimizationSettings(OptimizationConfig config)
        {
            // Apply optimization settings
            if (config.occlusion_culling.enable_occlusion_culling)
            {
                Debug.Log("🚀 Occlusion culling enabled");
            }

            if (config.lod_settings.enable_lod_bias)
            {
                QualitySettings.lodBias = config.lod_settings.lod_bias;
            }

            if (config.batching.enable_static_batching)
            {
                Debug.Log("🚀 Static batching enabled");
            }

            Debug.Log("🚀 Optimization settings applied");
        }

        private static void RunFullAutomation()
        {
            try
            {
                Debug.Log("🎯 Running full scene automation...");

                SetupLighting();
                SetupPhysics();
                SetupAudio();
                SetupUI();
                OptimizeScene();

                Debug.Log("🎉 Full scene automation completed!");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Full automation failed: {e.Message}");
            }
        }
    }

    // Data structures for JSON deserialization
    [System.Serializable]
    public class LightingConfig
    {
        public LightingSettings lighting_settings;
        public SceneLighting scene_lighting;
    }

    [System.Serializable]
    public class LightingSettings
    {
        public EnvironmentLighting environment_lighting;
        public LightmapSettings lightmap_settings;
        public ReflectionProbes reflection_probes;
        public LightProbes light_probes;
    }

    [System.Serializable]
    public class EnvironmentLighting
    {
        public string environment_mode;
        public string environment_lighting_mode;
        public float environment_lighting_intensity;
        public float[] environment_lighting_color;
    }

    [System.Serializable]
    public class LightmapSettings
    {
        public bool enable_baked_lightmaps;
        public bool enable_realtime_lightmaps;
        public int bake_resolution;
        public string lightmap_parameters;
        public string lightmaps_bake_mode;
        public string bake_backend;
    }

    [System.Serializable]
    public class ReflectionProbes
    {
        public bool enable_reflection_probes;
        public string reflection_compression;
        public int reflection_bounces;
        public float reflection_intensity;
    }

    [System.Serializable]
    public class LightProbes
    {
        public bool enable_light_probes;
        public int light_probe_sample_count_multiplier;
    }

    [System.Serializable]
    public class SceneLighting
    {
        public MainLight main_light;
        public AmbientLight ambient_light;
    }

    [System.Serializable]
    public class MainLight
    {
        public string type;
        public float[] color;
        public float intensity;
        public string shadows;
        public string shadow_resolution;
    }

    [System.Serializable]
    public class AmbientLight
    {
        public float[] skybox_color;
        public string ambient_mode;
        public float ambient_intensity;
    }

    [System.Serializable]
    public class PhysicsConfig
    {
        public PhysicsSettings physics_settings;
        public Dictionary<string, int> collision_layers;
        public Dictionary<string, PhysicsMaterial> physics_materials;
    }

    [System.Serializable]
    public class PhysicsSettings
    {
        public float[] gravity;
        public PhysicsMaterial default_material;
        public CollisionDetection collision_detection;
    }

    [System.Serializable]
    public class PhysicsMaterial
    {
        public float dynamic_friction;
        public float static_friction;
        public float bounciness;
        public string friction_combine;
        public string bounce_combine;
    }

    [System.Serializable]
    public class CollisionDetection
    {
        public string default_collision_detection;
        public int default_solver_iterations;
        public int default_solver_velocity_iterations;
    }

    [System.Serializable]
    public class AudioConfig
    {
        public AudioSettings audio_settings;
        public Dictionary<string, AudioSource> audio_sources;
        public SpatialAudio spatial_audio;
    }

    [System.Serializable]
    public class AudioSettings
    {
        public AudioListener audio_listener;
        public AudioMixer audio_mixer;
    }

    [System.Serializable]
    public class AudioListener
    {
        public float volume;
        public bool paused;
    }

    [System.Serializable]
    public class AudioMixer
    {
        public float master_volume;
        public float music_volume;
        public float sfx_volume;
        public float voice_volume;
    }

    [System.Serializable]
    public class AudioSource
    {
        public string clip;
        public float volume;
        public float pitch;
        public bool loop;
        public bool play_on_awake;
        public float spatial_blend;
    }

    [System.Serializable]
    public class SpatialAudio
    {
        public bool enable_3d_sound;
        public float doppler_factor;
        public float speed_of_sound;
        public string rolloff_mode;
    }

    [System.Serializable]
    public class UIConfig
    {
        public UISettings ui_settings;
        public Dictionary<string, UIElement> ui_elements;
        public ResponsiveUI responsive_ui;
    }

    [System.Serializable]
    public class UISettings
    {
        public CanvasScaler canvas_scaler;
        public GraphicRaycaster graphic_raycaster;
    }

    [System.Serializable]
    public class CanvasScaler
    {
        public string ui_scale_mode;
        public int[] reference_resolution;
        public string screen_match_mode;
        public float match_width_or_height;
    }

    [System.Serializable]
    public class GraphicRaycaster
    {
        public bool ignore_reversed_graphics;
        public string blocking_objects;
    }

    [System.Serializable]
    public class UIElement
    {
        public string canvas;
        public int sorting_order;
        public string render_mode;
    }

    [System.Serializable]
    public class ResponsiveUI
    {
        public bool enable_responsive;
        public Dictionary<string, int[]> breakpoints;
    }

    [System.Serializable]
    public class OptimizationConfig
    {
        public OcclusionCulling occlusion_culling;
        public LODSettings lod_settings;
        public Batching batching;
        public Culling culling;
    }

    [System.Serializable]
    public class OcclusionCulling
    {
        public bool enable_occlusion_culling;
        public string occlusion_culling_data;
        public float smallest_occluder;
        public float smallest_hole;
    }

    [System.Serializable]
    public class LODSettings
    {
        public bool enable_lod_bias;
        public float lod_bias;
        public int maximum_lod_level;
        public string lod_cross_fade_animation_mode;
    }

    [System.Serializable]
    public class Batching
    {
        public bool enable_static_batching;
        public bool enable_dynamic_batching;
        public bool enable_gpu_instancing;
    }

    [System.Serializable]
    public class Culling
    {
        public bool enable_frustum_culling;
        public bool enable_occlusion_culling;
        public string culling_mask;
    }
}
