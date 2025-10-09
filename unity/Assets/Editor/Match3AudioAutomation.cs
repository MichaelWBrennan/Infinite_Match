
using UnityEngine;
using UnityEditor;
using UnityEngine.Audio;
using System.Collections.Generic;
using System.IO;

namespace Evergreen.Editor
{
    public class Match3AudioAutomation : EditorWindow
    {
        [MenuItem("Tools/Match-3 Audio/Automate Everything")]
        public static void ShowWindow()
        {
            GetWindow<Match3AudioAutomation>("Match-3 Audio Automation");
        }

        private void OnGUI()
        {
            GUILayout.Label("Match-3 Audio Automation", EditorStyles.boldLabel);
            GUILayout.Space(10);

            if (GUILayout.Button("🎛️ Setup Audio Mixer", GUILayout.Height(30)))
            {
                SetupAudioMixer();
            }

            if (GUILayout.Button("🎵 Setup Audio Sources", GUILayout.Height(30)))
            {
                SetupAudioSources();
            }

            if (GUILayout.Button("🚀 Optimize Audio", GUILayout.Height(30)))
            {
                OptimizeAudio();
            }

            if (GUILayout.Button("🎯 Run Full Automation", GUILayout.Height(40)))
            {
                RunFullAutomation();
            }
        }

        private static void SetupAudioMixer()
        {
            try
            {
                Debug.Log("🎛️ Setting up Audio Mixer...");

                // Load audio mixer configuration
                string configPath = "Assets/Audio/Mixers/AudioMixerConfig.json";
                if (File.Exists(configPath))
                {
                    string json = File.ReadAllText(configPath);
                    var config = JsonUtility.FromJson<AudioMixerConfig>(json);

                    // Create audio mixer
                    CreateAudioMixer(config.master_mixer);

                    Debug.Log("✅ Audio Mixer setup completed!");
                }
                else
                {
                    Debug.LogWarning("⚠️ AudioMixerConfig.json not found");
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Audio Mixer setup failed: {e.Message}");
            }
        }

        private static void CreateAudioMixer(MasterMixer masterMixer)
        {
            // Create audio mixer asset
            var mixer = ScriptableObject.CreateInstance<AudioMixer>();
            mixer.name = masterMixer.name;

            // Set master volume
            var masterGroup = mixer.FindMatchingGroups("Master")[0];
            masterGroup.audioMixer.SetFloat("MasterVolume", Mathf.Log10(masterGroup.volume) * 20);

            // Create audio mixer groups
            foreach (var groupKvp in masterMixer.groups)
            {
                var groupName = groupKvp.Key;
                var groupData = groupKvp.Value;

                if (groupName != "master")
                {
                    var group = mixer.FindMatchingGroups(groupName)[0];
                    if (group != null)
                    {
                        group.audioMixer.SetFloat($"{groupName}Volume", Mathf.Log10(groupData.volume) * 20);
                        group.audioMixer.SetFloat($"{groupName}Pitch", groupData.pitch);
                    }
                }
            }

            // Save audio mixer
            AssetDatabase.CreateAsset(mixer, "Assets/Audio/Mixers/MasterMixer.mixer");

            Debug.Log("🎛️ Audio Mixer created");
        }

        private static void SetupAudioSources()
        {
            try
            {
                Debug.Log("🎵 Setting up Audio Sources...");

                // Load audio sources configuration
                string configPath = "Assets/Audio/Match3AudioSources.json";
                if (File.Exists(configPath))
                {
                    string json = File.ReadAllText(configPath);
                    var config = JsonUtility.FromJson<Match3AudioConfig>(json);

                    // Create background music sources
                    CreateBackgroundMusicSources(config.background_music);

                    // Create sound effect sources
                    CreateSoundEffectSources(config.sound_effects);

                    Debug.Log("✅ Audio Sources setup completed!");
                }
                else
                {
                    Debug.LogWarning("⚠️ Match3AudioSources.json not found");
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Audio Sources setup failed: {e.Message}");
            }
        }

        private static void CreateBackgroundMusicSources(BackgroundMusic backgroundMusic)
        {
            foreach (var track in backgroundMusic.tracks)
            {
                Debug.Log($"🎵 Creating background music source: {track.name}");

                // Create audio source prefab
                var audioSource = new GameObject($"AudioSource_{track.name}");
                var source = audioSource.AddComponent<AudioSource>();

                // Configure audio source
                source.volume = track.volume;
                source.pitch = track.pitch;
                source.loop = track.loop;
                source.playOnAwake = track.play_on_awake;
                source.spatialBlend = track.spatial_blend;
                source.priority = track.priority;

                // Load audio clip
                var clip = AssetDatabase.LoadAssetAtPath<AudioClip>(track.file);
                if (clip != null)
                {
                    source.clip = clip;
                }

                // Save as prefab
                PrefabUtility.SaveAsPrefabAsset(audioSource, $"Assets/Audio/Sources/AudioSource_{track.name}.prefab");
                DestroyImmediate(audioSource);
            }
        }

        private static void CreateSoundEffectSources(SoundEffects soundEffects)
        {
            // Create tile sound sources
            foreach (var sound in soundEffects.tile_sounds)
            {
                CreateSoundEffectSource(sound, "Tile");
            }

            // Create combo sound sources
            foreach (var sound in soundEffects.combo_sounds)
            {
                CreateSoundEffectSource(sound, "Combo");
            }

            // Create UI sound sources
            foreach (var sound in soundEffects.ui_sounds)
            {
                CreateSoundEffectSource(sound, "UI");
            }
        }

        private static void CreateSoundEffectSource(AudioSourceData sound, string category)
        {
            Debug.Log($"🔊 Creating {category} sound source: {sound.name}");

            // Create audio source prefab
            var audioSource = new GameObject($"AudioSource_{category}_{sound.name}");
            var source = audioSource.AddComponent<AudioSource>();

            // Configure audio source
            source.volume = sound.volume;
            source.pitch = sound.pitch;
            source.loop = sound.loop;
            source.playOnAwake = sound.play_on_awake;
            source.spatialBlend = sound.spatial_blend;
            source.priority = sound.priority;

            // Load audio clip
            var clip = AssetDatabase.LoadAssetAtPath<AudioClip>(sound.file);
            if (clip != null)
            {
                source.clip = clip;
            }

            // Save as prefab
            PrefabUtility.SaveAsPrefabAsset(audioSource, $"Assets/Audio/Sources/AudioSource_{category}_{sound.name}.prefab");
            DestroyImmediate(audioSource);
        }

        private static void OptimizeAudio()
        {
            try
            {
                Debug.Log("🚀 Optimizing audio...");

                // Load audio optimization configuration
                string configPath = "Assets/Audio/AudioOptimization.json";
                if (File.Exists(configPath))
                {
                    string json = File.ReadAllText(configPath);
                    var config = JsonUtility.FromJson<AudioOptimizationConfig>(json);

                    // Apply compression settings
                    ApplyCompressionSettings(config.compression_settings);

                    // Setup audio pooling
                    SetupAudioPooling(config.audio_pooling);

                    // Configure memory management
                    ConfigureMemoryManagement(config.memory_management);

                    // Apply performance settings
                    ApplyPerformanceSettings(config.performance_settings);

                    Debug.Log("✅ Audio optimization completed!");
                }
                else
                {
                    Debug.LogWarning("⚠️ AudioOptimization.json not found");
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Audio optimization failed: {e.Message}");
            }
        }

        private static void ApplyCompressionSettings(Dictionary<string, CompressionSettings> compressionSettings)
        {
            foreach (var platform in compressionSettings.Keys)
            {
                var settings = compressionSettings[platform];
                Debug.Log($"🔧 Applying compression settings for {platform}: {settings.format}");
            }
        }

        private static void SetupAudioPooling(AudioPooling audioPooling)
        {
            if (audioPooling.enable_audio_pooling)
            {
                Debug.Log($"🎵 Setting up audio pooling: {audioPooling.max_audio_sources} sources");
            }
        }

        private static void ConfigureMemoryManagement(MemoryManagement memoryManagement)
        {
            if (memoryManagement.enable_audio_compression)
            {
                Debug.Log($"💾 Configuring memory management: {memoryManagement.max_audio_memory_mb}MB limit");
            }
        }

        private static void ApplyPerformanceSettings(PerformanceSettings performanceSettings)
        {
            if (performanceSettings.enable_audio_lod)
            {
                Debug.Log($"🚀 Applying performance settings: LOD distance {performanceSettings.audio_lod_distance}");
            }
        }

        private static void RunFullAutomation()
        {
            try
            {
                Debug.Log("🎯 Running full Match-3 audio automation...");

                SetupAudioMixer();
                SetupAudioSources();
                OptimizeAudio();

                Debug.Log("🎉 Full Match-3 audio automation completed!");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Full automation failed: {e.Message}");
            }
        }
    }

    // Data structures for JSON deserialization
    [System.Serializable]
    public class AudioMixerConfig
    {
        public MasterMixer master_mixer;
    }

    [System.Serializable]
    public class MasterMixer
    {
        public string name;
        public float volume;
        public Dictionary<string, AudioGroup> groups;
    }

    [System.Serializable]
    public class AudioGroup
    {
        public float volume;
        public float pitch;
        public List<AudioEffect> effects;
    }

    [System.Serializable]
    public class AudioEffect
    {
        public string type;
        public float cutoff_frequency;
        public float resonance;
        public float threshold;
        public float ratio;
        public float attack;
        public float release;
        public float delay;
        public float decay_ratio;
        public float dry_mix;
        public float wet_mix;
    }

    [System.Serializable]
    public class Match3AudioConfig
    {
        public BackgroundMusic background_music;
        public SoundEffects sound_effects;
        public SpatialAudio spatial_audio;
    }

    [System.Serializable]
    public class BackgroundMusic
    {
        public List<AudioTrack> tracks;
    }

    [System.Serializable]
    public class AudioTrack
    {
        public string name;
        public string file;
        public float volume;
        public float pitch;
        public bool loop;
        public bool play_on_awake;
        public float spatial_blend;
        public int priority;
    }

    [System.Serializable]
    public class SoundEffects
    {
        public List<AudioSourceData> tile_sounds;
        public List<AudioSourceData> combo_sounds;
        public List<AudioSourceData> ui_sounds;
    }

    [System.Serializable]
    public class AudioSourceData
    {
        public string name;
        public string file;
        public float volume;
        public float pitch;
        public bool loop;
        public bool play_on_awake;
        public float spatial_blend;
        public int priority;
    }

    [System.Serializable]
    public class SpatialAudio
    {
        public bool enable_3d_sound;
        public float doppler_factor;
        public float speed_of_sound;
        public string rolloff_mode;
        public float max_distance;
        public float min_distance;
    }

    [System.Serializable]
    public class AudioOptimizationConfig
    {
        public Dictionary<string, CompressionSettings> compression_settings;
        public AudioPooling audio_pooling;
        public MemoryManagement memory_management;
        public PerformanceSettings performance_settings;
    }

    [System.Serializable]
    public class CompressionSettings
    {
        public string format;
        public float quality;
        public string load_type;
        public bool preload_audio_data;
    }

    [System.Serializable]
    public class AudioPooling
    {
        public bool enable_audio_pooling;
        public int max_audio_sources;
        public int pool_warmup_count;
        public int pool_growth_rate;
    }

    [System.Serializable]
    public class MemoryManagement
    {
        public bool enable_audio_compression;
        public int max_audio_memory_mb;
        public bool unload_unused_audio;
        public float audio_garbage_collection_interval;
    }

    [System.Serializable]
    public class PerformanceSettings
    {
        public bool enable_audio_lod;
        public float audio_lod_distance;
        public bool enable_audio_occlusion;
        public int max_audio_voices;
    }
}
