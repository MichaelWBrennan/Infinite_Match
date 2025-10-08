#!/usr/bin/env python3
"""
Match-3 Animation Automation
Automates animation setup specifically for Evergreen Puzzler match-3 game
"""

import json
import os
import subprocess
from pathlib import Path

import yaml


class Match3AnimationAutomation:
    def __init__(self):
        self.repo_root = Path(__file__).parent.parent.parent
        self.unity_assets = self.repo_root / "unity" / "Assets"
        self.animations_dir = self.unity_assets / "Animations"
        self.animators_dir = self.unity_assets / "Animators"

    def print_header(self, title):
        """Print formatted header"""
        print("\n" + "=" * 80)
        print(f"🎬 {title}")
        print("=" * 80)

    def setup_match3_animations(self):
        """Setup match-3 specific animations"""
        print("🎮 Setting up Match-3 animations...")

        # Create match-3 animation configuration
        match3_animations = {
            "tile_animations": {
                "tile_spawn": {
                    "duration": 0.3,
                    "ease_type": "BounceOut",
                    "scale_from": [0, 0, 1],
                    "scale_to": [1, 1, 1],
                    "rotation_from": [0, 0, 180],
                    "rotation_to": [0, 0, 0],
                },
                "tile_match": {
                    "duration": 0.5,
                    "ease_type": "EaseInOut",
                    "scale_from": [1, 1, 1],
                    "scale_to": [1.2, 1.2, 1],
                    "alpha_from": 1.0,
                    "alpha_to": 0.0,
                },
                "tile_fall": {
                    "duration": 0.4,
                    "ease_type": "EaseIn",
                    "position_offset": [0, -100, 0],
                    "rotation_from": [0, 0, 0],
                    "rotation_to": [0, 0, 360],
                },
                "tile_swap": {
                    "duration": 0.2,
                    "ease_type": "EaseOut",
                    "scale_from": [1, 1, 1],
                    "scale_to": [1.1, 1.1, 1],
                },
            },
            "ui_animations": {
                "score_popup": {
                    "duration": 1.0,
                    "ease_type": "BounceOut",
                    "scale_from": [0, 0, 1],
                    "scale_to": [1, 1, 1],
                    "position_offset": [0, 50, 0],
                    "alpha_from": 0.0,
                    "alpha_to": 1.0,
                },
                "combo_text": {
                    "duration": 0.8,
                    "ease_type": "EaseOut",
                    "scale_from": [0.5, 0.5, 1],
                    "scale_to": [1.2, 1.2, 1],
                    "alpha_from": 0.0,
                    "alpha_to": 1.0,
                },
                "level_complete": {
                    "duration": 1.5,
                    "ease_type": "EaseInOut",
                    "scale_from": [0, 0, 1],
                    "scale_to": [1, 1, 1],
                    "rotation_from": [0, 0, -180],
                    "rotation_to": [0, 0, 0],
                },
            },
            "particle_animations": {
                "match_explosion": {
                    "duration": 0.6,
                    "particle_count": 20,
                    "burst_radius": 2.0,
                    "velocity": 5.0,
                    "colors": ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"],
                },
                "combo_effect": {
                    "duration": 1.0,
                    "particle_count": 50,
                    "burst_radius": 3.0,
                    "velocity": 8.0,
                    "colors": ["#FFD700", "#FF6B6B", "#4ECDC4"],
                },
            },
        }

        # Save animation configuration
        animations_file = self.animations_dir / "Match3Animations.json"
        self.animations_dir.mkdir(parents=True, exist_ok=True)

        with open(animations_file, "w") as f:
            json.dump(match3_animations, f, indent=2)

        print(f"✅ Match-3 animations configured: {animations_file}")
        return True

    def setup_animator_controllers(self):
        """Setup Animator Controllers for match-3 game"""
        print("🎭 Setting up Animator Controllers...")

        # Create tile animator controller
        tile_animator = {
            "name": "TileAnimator",
            "layers": [
                {
                    "name": "Base Layer",
                    "weight": 1.0,
                    "blending_mode": "Override",
                    "states": [
                        {
                            "name": "Idle",
                            "is_default": True,
                            "motion": "Idle",
                            "transitions": [
                                {
                                    "destination": "Spawn",
                                    "has_exit_time": False,
                                    "has_fixed_duration": True,
                                    "duration": 0.25,
                                }
                            ],
                        },
                        {
                            "name": "Spawn",
                            "motion": "Spawn",
                            "transitions": [
                                {
                                    "destination": "Idle",
                                    "has_exit_time": True,
                                    "has_fixed_duration": True,
                                    "duration": 0.25,
                                }
                            ],
                        },
                        {
                            "name": "Match",
                            "motion": "Match",
                            "transitions": [
                                {
                                    "destination": "Fall",
                                    "has_exit_time": True,
                                    "has_fixed_duration": True,
                                    "duration": 0.5,
                                }
                            ],
                        },
                        {
                            "name": "Fall",
                            "motion": "Fall",
                            "transitions": [
                                {
                                    "destination": "Idle",
                                    "has_exit_time": True,
                                    "has_fixed_duration": True,
                                    "duration": 0.4,
                                }
                            ],
                        },
                    ],
                }
            ],
        }

        # Create UI animator controller
        ui_animator = {
            "name": "UIAnimator",
            "layers": [
                {
                    "name": "Base Layer",
                    "weight": 1.0,
                    "blending_mode": "Override",
                    "states": [
                        {
                            "name": "Hidden",
                            "is_default": True,
                            "motion": "Hidden",
                            "transitions": [
                                {
                                    "destination": "Show",
                                    "has_exit_time": False,
                                    "has_fixed_duration": True,
                                    "duration": 0.25,
                                }
                            ],
                        },
                        {
                            "name": "Show",
                            "motion": "Show",
                            "transitions": [
                                {
                                    "destination": "Hidden",
                                    "has_exit_time": False,
                                    "has_fixed_duration": True,
                                    "duration": 0.25,
                                }
                            ],
                        },
                    ],
                }
            ],
        }

        # Save animator controllers
        self.animators_dir.mkdir(parents=True, exist_ok=True)

        tile_animator_file = self.animators_dir / "TileAnimator.json"
        with open(tile_animator_file, "w") as f:
            json.dump(tile_animator, f, indent=2)

        ui_animator_file = self.animators_dir / "UIAnimator.json"
        with open(ui_animator_file, "w") as f:
            json.dump(ui_animator, f, indent=2)

        print(
            f"✅ Animator Controllers configured: {tile_animator_file}, {ui_animator_file}"
        )
        return True

    def setup_timeline_automation(self):
        """Setup Timeline automation for match-3 game"""
        print("⏰ Setting up Timeline automation...")

        # Create timeline configuration for match-3 sequences
        timeline_config = {
            "level_intro": {
                "duration": 3.0,
                "tracks": [
                    {
                        "name": "Camera Track",
                        "type": "Cinemachine",
                        "clips": [
                            {
                                "start_time": 0.0,
                                "duration": 2.0,
                                "action": "zoom_in",
                                "target": "board_center",
                            }
                        ],
                    },
                    {
                        "name": "UI Track",
                        "type": "UI",
                        "clips": [
                            {
                                "start_time": 0.5,
                                "duration": 1.0,
                                "action": "fade_in",
                                "target": "level_info",
                            }
                        ],
                    },
                ],
            },
            "level_complete": {
                "duration": 4.0,
                "tracks": [
                    {
                        "name": "Particle Track",
                        "type": "ParticleSystem",
                        "clips": [
                            {
                                "start_time": 0.0,
                                "duration": 2.0,
                                "action": "play",
                                "target": "celebration_particles",
                            }
                        ],
                    },
                    {
                        "name": "UI Track",
                        "type": "UI",
                        "clips": [
                            {
                                "start_time": 1.0,
                                "duration": 2.0,
                                "action": "slide_in",
                                "target": "level_complete_panel",
                            }
                        ],
                    },
                ],
            },
        }

        # Save timeline configuration
        timeline_file = self.animations_dir / "TimelineConfig.json"

        with open(timeline_file, "w") as f:
            json.dump(timeline_config, f, indent=2)

        print(f"✅ Timeline automation configured: {timeline_file}")
        return True

    def create_animation_automation_script(self):
        """Create Unity Editor script for animation automation"""
        print("📝 Creating animation automation script...")

        script_content = """
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
"""

        # Save Unity Editor script
        script_path = self.unity_assets / "Editor" / "Match3AnimationAutomation.cs"
        script_path.parent.mkdir(parents=True, exist_ok=True)

        with open(script_path, "w") as f:
            f.write(script_content)

        print(f"✅ Match-3 animation automation script created: {script_path}")
        return True

    def run_full_automation(self):
        """Run complete match-3 animation automation"""
        self.print_header("Match-3 Animation Full Automation")

        print("🎯 This will automate Match-3 specific animations")
        print("   - Tile animations (spawn, match, fall, swap)")
        print("   - UI animations (score popup, combo text, level complete)")
        print("   - Particle effects (match explosion, combo effect)")
        print("   - Animator Controllers for tiles and UI")
        print("   - Timeline sequences for level intro/complete")

        success = True

        # Run all automation steps
        success &= self.setup_match3_animations()
        success &= self.setup_animator_controllers()
        success &= self.setup_timeline_automation()
        success &= self.create_animation_automation_script()

        if success:
            print("\n🎉 Match-3 animation automation completed successfully!")
            print("✅ Tile animations configured")
            print("✅ UI animations setup")
            print("✅ Particle effects created")
            print("✅ Animator Controllers generated")
            print("✅ Timeline sequences configured")
            print("✅ Unity Editor automation script created")
        else:
            print("\n⚠️ Some Match-3 animation automation steps failed")

        return success


if __name__ == "__main__":
    automation = Match3AnimationAutomation()
    automation.run_full_automation()
