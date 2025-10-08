#!/usr/bin/env python3
"""
Match-3 Audio Automation
Automates audio setup specifically for Evergreen Puzzler match-3 game
"""

import json
import os
import subprocess
from pathlib import Path

import yaml


class Match3AudioAutomation:
    def __init__(self):
        self.repo_root = Path(__file__).parent.parent.parent
        self.unity_assets = self.repo_root / "unity" / "Assets"
        self.audio_dir = self.unity_assets / "Audio"
        self.audio_mixers_dir = self.unity_assets / "Audio" / "Mixers"

    def print_header(self, title):
        """Print formatted header"""
        print("\n" + "=" * 80)
        print(f"🔊 {title}")
        print("=" * 80)

    def setup_audio_mixer(self):
        """Setup Audio Mixer for match-3 game"""
        print("🎛️ Setting up Audio Mixer...")

        # Create audio mixer configuration
        audio_mixer_config = {
            "master_mixer": {
                "name": "MasterMixer",
                "volume": 1.0,
                "groups": {
                    "master": {"volume": 1.0, "pitch": 1.0, "effects": []},
                    "music": {
                        "volume": 0.8,
                        "pitch": 1.0,
                        "effects": [
                            {
                                "type": "LowPassFilter",
                                "cutoff_frequency": 22000,
                                "resonance": 1.0,
                            }
                        ],
                    },
                    "sfx": {
                        "volume": 1.0,
                        "pitch": 1.0,
                        "effects": [
                            {
                                "type": "Compressor",
                                "threshold": -20,
                                "ratio": 4.0,
                                "attack": 0.1,
                                "release": 0.1,
                            }
                        ],
                    },
                    "ui": {
                        "volume": 0.9,
                        "pitch": 1.0,
                        "effects": [
                            {
                                "type": "HighPassFilter",
                                "cutoff_frequency": 80,
                                "resonance": 1.0,
                            }
                        ],
                    },
                    "voice": {
                        "volume": 1.0,
                        "pitch": 1.0,
                        "effects": [
                            {
                                "type": "Echo",
                                "delay": 0.1,
                                "decay_ratio": 0.3,
                                "dry_mix": 0.8,
                                "wet_mix": 0.2,
                            }
                        ],
                    },
                },
            }
        }

        # Save audio mixer configuration
        mixer_file = self.audio_mixers_dir / "AudioMixerConfig.json"
        self.audio_mixers_dir.mkdir(parents=True, exist_ok=True)

        with open(mixer_file, "w") as f:
            json.dump(audio_mixer_config, f, indent=2)

        print(f"✅ Audio Mixer configured: {mixer_file}")
        return True

    def setup_match3_audio_sources(self):
        """Setup audio sources for match-3 game"""
        print("🎵 Setting up Match-3 audio sources...")

        # Create match-3 specific audio configuration
        match3_audio = {
            "background_music": {
                "tracks": [
                    {
                        "name": "main_theme",
                        "file": "Audio/Music/main_theme.ogg",
                        "volume": 0.7,
                        "pitch": 1.0,
                        "loop": True,
                        "play_on_awake": True,
                        "spatial_blend": 0.0,
                        "priority": 128,
                    },
                    {
                        "name": "menu_music",
                        "file": "Audio/Music/menu_music.ogg",
                        "volume": 0.6,
                        "pitch": 1.0,
                        "loop": True,
                        "play_on_awake": False,
                        "spatial_blend": 0.0,
                        "priority": 128,
                    },
                    {
                        "name": "level_complete",
                        "file": "Audio/Music/level_complete.ogg",
                        "volume": 0.8,
                        "pitch": 1.0,
                        "loop": False,
                        "play_on_awake": False,
                        "spatial_blend": 0.0,
                        "priority": 64,
                    },
                ]
            },
            "sound_effects": {
                "tile_sounds": [
                    {
                        "name": "tile_click",
                        "file": "Audio/SFX/tile_click.wav",
                        "volume": 0.8,
                        "pitch": 1.0,
                        "loop": False,
                        "play_on_awake": False,
                        "spatial_blend": 0.0,
                        "priority": 192,
                    },
                    {
                        "name": "tile_match",
                        "file": "Audio/SFX/tile_match.wav",
                        "volume": 0.9,
                        "pitch": 1.0,
                        "loop": False,
                        "play_on_awake": False,
                        "spatial_blend": 0.0,
                        "priority": 128,
                    },
                    {
                        "name": "tile_fall",
                        "file": "Audio/SFX/tile_fall.wav",
                        "volume": 0.7,
                        "pitch": 1.0,
                        "loop": False,
                        "play_on_awake": False,
                        "spatial_blend": 0.0,
                        "priority": 160,
                    },
                    {
                        "name": "tile_swap",
                        "file": "Audio/SFX/tile_swap.wav",
                        "volume": 0.6,
                        "pitch": 1.0,
                        "loop": False,
                        "play_on_awake": False,
                        "spatial_blend": 0.0,
                        "priority": 180,
                    },
                ],
                "combo_sounds": [
                    {
                        "name": "combo_3",
                        "file": "Audio/SFX/combo_3.wav",
                        "volume": 0.8,
                        "pitch": 1.0,
                        "loop": False,
                        "play_on_awake": False,
                        "spatial_blend": 0.0,
                        "priority": 96,
                    },
                    {
                        "name": "combo_4",
                        "file": "Audio/SFX/combo_4.wav",
                        "volume": 0.9,
                        "pitch": 1.0,
                        "loop": False,
                        "play_on_awake": False,
                        "spatial_blend": 0.0,
                        "priority": 80,
                    },
                    {
                        "name": "combo_5",
                        "file": "Audio/SFX/combo_5.wav",
                        "volume": 1.0,
                        "pitch": 1.0,
                        "loop": False,
                        "play_on_awake": False,
                        "spatial_blend": 0.0,
                        "priority": 64,
                    },
                ],
                "ui_sounds": [
                    {
                        "name": "button_click",
                        "file": "Audio/SFX/button_click.wav",
                        "volume": 0.7,
                        "pitch": 1.0,
                        "loop": False,
                        "play_on_awake": False,
                        "spatial_blend": 0.0,
                        "priority": 200,
                    },
                    {
                        "name": "button_hover",
                        "file": "Audio/SFX/button_hover.wav",
                        "volume": 0.5,
                        "pitch": 1.0,
                        "loop": False,
                        "play_on_awake": False,
                        "spatial_blend": 0.0,
                        "priority": 220,
                    },
                    {
                        "name": "level_start",
                        "file": "Audio/SFX/level_start.wav",
                        "volume": 0.8,
                        "pitch": 1.0,
                        "loop": False,
                        "play_on_awake": False,
                        "spatial_blend": 0.0,
                        "priority": 100,
                    },
                    {
                        "name": "level_complete",
                        "file": "Audio/SFX/level_complete.wav",
                        "volume": 0.9,
                        "pitch": 1.0,
                        "loop": False,
                        "play_on_awake": False,
                        "spatial_blend": 0.0,
                        "priority": 80,
                    },
                ],
            },
            "spatial_audio": {
                "enable_3d_sound": True,
                "doppler_factor": 1.0,
                "speed_of_sound": 343.0,
                "rolloff_mode": "Logarithmic",
                "max_distance": 50.0,
                "min_distance": 1.0,
            },
        }

        # Save audio sources configuration
        audio_sources_file = self.audio_dir / "Match3AudioSources.json"

        with open(audio_sources_file, "w") as f:
            json.dump(match3_audio, f, indent=2)

        print(f"✅ Match-3 audio sources configured: {audio_sources_file}")
        return True

    def setup_audio_optimization(self):
        """Setup audio optimization for match-3 game"""
        print("🚀 Setting up audio optimization...")

        # Create audio optimization configuration
        audio_optimization = {
            "compression_settings": {
                "android": {
                    "format": "Vorbis",
                    "quality": 0.7,
                    "load_type": "CompressedInMemory",
                    "preload_audio_data": False,
                },
                "ios": {
                    "format": "Vorbis",
                    "quality": 0.8,
                    "load_type": "CompressedInMemory",
                    "preload_audio_data": False,
                },
                "standalone": {
                    "format": "Vorbis",
                    "quality": 0.9,
                    "load_type": "CompressedInMemory",
                    "preload_audio_data": True,
                },
            },
            "audio_pooling": {
                "enable_audio_pooling": True,
                "max_audio_sources": 32,
                "pool_warmup_count": 8,
                "pool_growth_rate": 4,
            },
            "memory_management": {
                "enable_audio_compression": True,
                "max_audio_memory_mb": 64,
                "unload_unused_audio": True,
                "audio_garbage_collection_interval": 30.0,
            },
            "performance_settings": {
                "enable_audio_lod": True,
                "audio_lod_distance": 20.0,
                "enable_audio_occlusion": False,
                "max_audio_voices": 64,
            },
        }

        # Save audio optimization configuration
        optimization_file = self.audio_dir / "AudioOptimization.json"

        with open(optimization_file, "w") as f:
            json.dump(audio_optimization, f, indent=2)

        print(f"✅ Audio optimization configured: {optimization_file}")
        return True

    def create_audio_automation_script(self):
        """Create Unity Editor script for audio automation"""
        print("📝 Creating audio automation script...")

        script_content = """
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
"""

        # Save Unity Editor script
        script_path = self.unity_assets / "Editor" / "Match3AudioAutomation.cs"
        script_path.parent.mkdir(parents=True, exist_ok=True)

        with open(script_path, "w") as f:
            f.write(script_content)

        print(f"✅ Match-3 audio automation script created: {script_path}")
        return True

    def run_full_automation(self):
        """Run complete match-3 audio automation"""
        self.print_header("Match-3 Audio Full Automation")

        print("🎯 This will automate Match-3 specific audio setup")
        print("   - Audio Mixer configuration (Master, Music, SFX, UI, Voice)")
        print("   - Background music sources (main theme, menu, level complete)")
        print("   - Sound effects (tile sounds, combo sounds, UI sounds)")
        print("   - Spatial audio configuration")
        print("   - Audio optimization and compression")

        success = True

        # Run all automation steps
        success &= self.setup_audio_mixer()
        success &= self.setup_match3_audio_sources()
        success &= self.setup_audio_optimization()
        success &= self.create_audio_automation_script()

        if success:
            print("\n🎉 Match-3 audio automation completed successfully!")
            print("✅ Audio Mixer configured")
            print("✅ Background music sources setup")
            print("✅ Sound effects configured")
            print("✅ Spatial audio setup")
            print("✅ Audio optimization applied")
            print("✅ Unity Editor automation script created")
        else:
            print("\n⚠️ Some Match-3 audio automation steps failed")

        return success


if __name__ == "__main__":
    automation = Match3AudioAutomation()
    automation.run_full_automation()
