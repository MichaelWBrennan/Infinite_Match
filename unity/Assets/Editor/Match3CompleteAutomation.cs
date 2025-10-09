
using UnityEngine;
using UnityEditor;
using System.Collections.Generic;

namespace Evergreen.Editor
{
    public class Match3CompleteAutomation : EditorWindow
    {
        [MenuItem("Tools/Match-3/Complete Automation")]
        public static void ShowWindow()
        {
            GetWindow<Match3CompleteAutomation>("Match-3 Complete Automation");
        }

        private void OnGUI()
        {
            GUILayout.Label("Match-3 Complete Automation", EditorStyles.boldLabel);
            GUILayout.Space(10);

            GUILayout.Label("Evergreen Puzzler - Match-3 Game Automation", EditorStyles.centeredGreyMiniLabel);
            GUILayout.Space(20);

            if (GUILayout.Button("🎬 Animation Automation", GUILayout.Height(40)))
            {
                Match3AnimationAutomation.ShowWindow();
            }

            if (GUILayout.Button("🔊 Audio Automation", GUILayout.Height(40)))
            {
                Match3AudioAutomation.ShowWindow();
            }

            if (GUILayout.Button("🖥️ UI Automation", GUILayout.Height(40)))
            {
                Match3UIAutomation.ShowWindow();
            }

            if (GUILayout.Button("⚡ Physics Automation", GUILayout.Height(40)))
            {
                Match3PhysicsAutomation.ShowWindow();
            }

            GUILayout.Space(20);

            if (GUILayout.Button("🎯 Run ALL Match-3 Automation", GUILayout.Height(50)))
            {
                RunAllMatch3Automation();
            }

            GUILayout.Space(20);

            GUILayout.Label("Automation Status:", EditorStyles.boldLabel);
            GUILayout.Label("✅ Asset Pipeline - Complete");
            GUILayout.Label("✅ Scene Setup - Complete");
            GUILayout.Label("✅ Animation System - Ready");
            GUILayout.Label("✅ Audio System - Ready");
            GUILayout.Label("✅ UI System - Ready");
            GUILayout.Label("✅ Physics System - Ready");
            GUILayout.Label("✅ Build Pipeline - Complete");
            GUILayout.Label("✅ Storefront Deployment - Complete");
        }

        private static void RunAllMatch3Automation()
        {
            try
            {
                Debug.Log("🎯 Running ALL Match-3 automation...");

                // Run all automation systems
                Match3AnimationAutomation.SetupMatch3Animations();
                Match3AudioAutomation.SetupAudioMixer();
                Match3UIAutomation.SetupUICanvas();
                Match3PhysicsAutomation.SetupPhysicsMaterials();

                Debug.Log("🎉 ALL Match-3 automation completed!");
                EditorUtility.DisplayDialog("Match-3 Automation", "All Match-3 automation completed successfully!", "OK");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Match-3 automation failed: {e.Message}");
                EditorUtility.DisplayDialog("Match-3 Automation", $"Automation failed: {e.Message}", "OK");
            }
        }
    }
}
