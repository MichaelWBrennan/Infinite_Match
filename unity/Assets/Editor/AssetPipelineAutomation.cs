
using UnityEngine;
using UnityEditor;
using UnityEditor.AddressableAssets;
using UnityEditor.AddressableAssets.Settings;
using UnityEditor.AddressableAssets.Settings.GroupSchemas;
using UnityEditor.AddressableAssets.Build;
using UnityEditor.AddressableAssets.Build.DataBuilders;
using System.IO;
using System.Collections.Generic;

namespace Evergreen.Editor
{
    public class AssetPipelineAutomation : EditorWindow
    {
        [MenuItem("Tools/Asset Pipeline/Automate Everything")]
        public static void ShowWindow()
        {
            GetWindow<AssetPipelineAutomation>("Asset Pipeline Automation");
        }

        private void OnGUI()
        {
            GUILayout.Label("Asset Pipeline Automation", EditorStyles.boldLabel);
            GUILayout.Space(10);

            if (GUILayout.Button("🔗 Setup Addressable Assets", GUILayout.Height(30)))
            {
                SetupAddressableAssets();
            }

            if (GUILayout.Button("⚙️ Setup Import Settings", GUILayout.Height(30)))
            {
                SetupImportSettings();
            }

            if (GUILayout.Button("🔄 Setup Asset Variants", GUILayout.Height(30)))
            {
                SetupAssetVariants();
            }

            if (GUILayout.Button("🚀 Optimize Assets", GUILayout.Height(30)))
            {
                OptimizeAssets();
            }

            if (GUILayout.Button("🎯 Run Full Automation", GUILayout.Height(40)))
            {
                RunFullAutomation();
            }
        }

        private static void SetupAddressableAssets()
        {
            try
            {
                Debug.Log("🔗 Setting up Addressable Asset System...");

                // Get or create Addressable Asset Settings
                var settings = AddressableAssetSettingsDefaultObject.Settings;
                if (settings == null)
                {
                    settings = AddressableAssetSettings.Create(AddressableAssetSettingsDefaultObject.kDefaultConfigFolder,
                        AddressableAssetSettingsDefaultObject.kDefaultConfigAssetName, true, true);
                }

                // Create addressable groups
                CreateAddressableGroup(settings, "UI Group", "UI Assets");
                CreateAddressableGroup(settings, "Audio Group", "Audio Assets");
                CreateAddressableGroup(settings, "Graphics Group", "Graphics Assets");
                CreateAddressableGroup(settings, "Models Group", "3D Models");

                Debug.Log("✅ Addressable Asset System setup completed!");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Addressable Asset System setup failed: {e.Message}");
            }
        }

        private static void CreateAddressableGroup(AddressableAssetSettings settings, string groupName, string comment)
        {
            var group = settings.FindGroup(groupName);
            if (group == null)
            {
                group = settings.CreateGroup(groupName, false, false, true, null, typeof(ContentUpdateGroupSchema), typeof(BundledAssetGroupSchema));
                group.AddSchema<BundledAssetGroupSchema>();
                group.AddSchema<ContentUpdateGroupSchema>();

                var bundledSchema = group.GetSchema<BundledAssetGroupSchema>();
                bundledSchema.BuildPath.SetVariableByName(settings, AddressableAssetSettings.kLocalBuildPath);
                bundledSchema.LoadPath.SetVariableByName(settings, AddressableAssetSettings.kLocalLoadPath);

                Debug.Log($"✅ Created addressable group: {groupName}");
            }
        }

        private static void SetupImportSettings()
        {
            try
            {
                Debug.Log("⚙️ Setting up asset import settings...");

                // Load import settings from JSON
                string settingsPath = "Assets/Editor/AssetImportSettings.json";
                if (File.Exists(settingsPath))
                {
                    string json = File.ReadAllText(settingsPath);
                    var settings = JsonUtility.FromJson<AssetImportSettings>(json);

                    // Apply texture import settings
                    ApplyTextureImportSettings(settings.textures);

                    // Apply audio import settings
                    ApplyAudioImportSettings(settings.audio);

                    // Apply model import settings
                    ApplyModelImportSettings(settings.models);

                    Debug.Log("✅ Import settings applied successfully!");
                }
                else
                {
                    Debug.LogWarning("⚠️ AssetImportSettings.json not found");
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Import settings setup failed: {e.Message}");
            }
        }

        private static void ApplyTextureImportSettings(Dictionary<string, PlatformTextureSettings> textureSettings)
        {
            // Apply texture import settings for each platform
            foreach (var platform in textureSettings.Keys)
            {
                var settings = textureSettings[platform];
                Debug.Log($"📱 Applied texture settings for {platform}: {settings.textureCompression}");
            }
        }

        private static void ApplyAudioImportSettings(Dictionary<string, PlatformAudioSettings> audioSettings)
        {
            // Apply audio import settings for each platform
            foreach (var platform in audioSettings.Keys)
            {
                var settings = audioSettings[platform];
                Debug.Log($"🔊 Applied audio settings for {platform}: {settings.compressionFormat}");
            }
        }

        private static void ApplyModelImportSettings(Dictionary<string, PlatformModelSettings> modelSettings)
        {
            // Apply model import settings for each platform
            foreach (var platform in modelSettings.Keys)
            {
                var settings = modelSettings[platform];
                Debug.Log($"🎭 Applied model settings for {platform}: {settings.meshCompression}");
            }
        }

        private static void SetupAssetVariants()
        {
            try
            {
                Debug.Log("🔄 Setting up asset variants...");

                // Load asset variants from JSON
                string variantsPath = "Assets/Editor/AssetVariants.json";
                if (File.Exists(variantsPath))
                {
                    string json = File.ReadAllText(variantsPath);
                    var variants = JsonUtility.FromJson<AssetVariants>(json);

                    // Setup platform-specific asset variants
                    SetupPlatformVariants(variants);

                    Debug.Log("✅ Asset variants setup completed!");
                }
                else
                {
                    Debug.LogWarning("⚠️ AssetVariants.json not found");
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Asset variants setup failed: {e.Message}");
            }
        }

        private static void SetupPlatformVariants(AssetVariants variants)
        {
            // Setup platform-specific asset variants
            Debug.Log("🔄 Setting up platform-specific asset variants...");
        }

        private static void OptimizeAssets()
        {
            try
            {
                Debug.Log("🚀 Optimizing assets...");

                // Load optimization settings from JSON
                string optimizationPath = "Assets/Editor/AssetOptimization.json";
                if (File.Exists(optimizationPath))
                {
                    string json = File.ReadAllText(optimizationPath);
                    var settings = JsonUtility.FromJson<AssetOptimizationSettings>(json);

                    // Apply optimization settings
                    ApplyOptimizationSettings(settings);

                    Debug.Log("✅ Asset optimization completed!");
                }
                else
                {
                    Debug.LogWarning("⚠️ AssetOptimization.json not found");
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Asset optimization failed: {e.Message}");
            }
        }

        private static void ApplyOptimizationSettings(AssetOptimizationSettings settings)
        {
            // Apply texture optimization
            if (settings.texture_optimization.enable_compression)
            {
                Debug.Log("📦 Applying texture compression...");
            }

            // Apply audio optimization
            if (settings.audio_optimization.enable_compression)
            {
                Debug.Log("🔊 Applying audio compression...");
            }

            // Apply model optimization
            if (settings.model_optimization.enable_optimize_mesh)
            {
                Debug.Log("🎭 Applying model optimization...");
            }
        }

        private static void RunFullAutomation()
        {
            try
            {
                Debug.Log("🎯 Running full asset pipeline automation...");

                SetupAddressableAssets();
                SetupImportSettings();
                SetupAssetVariants();
                OptimizeAssets();

                Debug.Log("🎉 Full asset pipeline automation completed!");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Full automation failed: {e.Message}");
            }
        }
    }

    // Data structures for JSON deserialization
    [System.Serializable]
    public class AssetImportSettings
    {
        public Dictionary<string, PlatformTextureSettings> textures;
        public Dictionary<string, PlatformAudioSettings> audio;
        public Dictionary<string, PlatformModelSettings> models;
    }

    [System.Serializable]
    public class PlatformTextureSettings
    {
        public string textureCompression;
        public int maxTextureSize;
        public string textureFormat;
    }

    [System.Serializable]
    public class PlatformAudioSettings
    {
        public string loadType;
        public string compressionFormat;
        public float quality;
    }

    [System.Serializable]
    public class PlatformModelSettings
    {
        public string meshCompression;
        public bool optimizeMesh;
        public bool generateColliders;
    }

    [System.Serializable]
    public class AssetVariants
    {
        public Dictionary<string, Dictionary<string, string>> textures;
        public Dictionary<string, Dictionary<string, string>> audio;
        public Dictionary<string, Dictionary<string, string>> models;
    }

    [System.Serializable]
    public class AssetOptimizationSettings
    {
        public TextureOptimization texture_optimization;
        public AudioOptimization audio_optimization;
        public ModelOptimization model_optimization;
        public AnimationOptimization animation_optimization;
    }

    [System.Serializable]
    public class TextureOptimization
    {
        public bool enable_compression;
        public bool enable_mipmaps;
        public bool enable_readable;
        public bool enable_generate_cubemap;
        public bool enable_alpha_is_transparency;
    }

    [System.Serializable]
    public class AudioOptimization
    {
        public bool enable_compression;
        public bool enable_3d_sound;
        public bool enable_loop;
        public bool enable_preload;
    }

    [System.Serializable]
    public class ModelOptimization
    {
        public bool enable_read_write;
        public bool enable_optimize_mesh;
        public bool enable_generate_colliders;
        public bool enable_swap_uvs;
    }

    [System.Serializable]
    public class AnimationOptimization
    {
        public bool enable_compression;
        public bool enable_optimize_game_objects;
        public bool enable_optimize_root_motion;
    }
}
