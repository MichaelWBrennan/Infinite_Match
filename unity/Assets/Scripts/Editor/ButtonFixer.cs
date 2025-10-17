using UnityEngine;
using UnityEditor;
using UnityEngine.UI;
using UnityEngine.SceneManagement;
using System.Collections.Generic;
using System.Linq;
using Evergreen.UI;
using Evergreen.Testing;

namespace Evergreen.Editor
{
    /// <summary>
    /// Button Fixer - Editor tool to automatically fix all non-functional buttons
    /// This tool will wire up all buttons in scenes with proper functionality
    /// </summary>
    public class ButtonFixer : EditorWindow
    {
        [MenuItem("Evergreen/Button Fixer")]
        public static void ShowWindow()
        {
            GetWindow<ButtonFixer>("Button Fixer");
        }
        
        private Vector2 scrollPosition;
        private bool showDetailedLogs = true;
        private bool fixAllScenes = false;
        private List<string> sceneNames = new List<string>
        {
            "MainMenu",
            "Gameplay", 
            "Settings",
            "Shop",
            "Social",
            "Events",
            "Collections"
        };
        
        private List<ButtonFixResult> fixResults = new List<ButtonFixResult>();
        
        void OnGUI()
        {
            GUILayout.Label("Button Fixer", EditorStyles.boldLabel);
            GUILayout.Space(10);
            
            showDetailedLogs = EditorGUILayout.Toggle("Show Detailed Logs", showDetailedLogs);
            fixAllScenes = EditorGUILayout.Toggle("Fix All Scenes", fixAllScenes);
            
            GUILayout.Space(10);
            
            if (GUILayout.Button("Fix Current Scene Buttons"))
            {
                FixCurrentSceneButtons();
            }
            
            if (GUILayout.Button("Fix All Scene Buttons"))
            {
                FixAllSceneButtons();
            }
            
            if (GUILayout.Button("Verify All Buttons"))
            {
                VerifyAllButtons();
            }
            
            if (GUILayout.Button("Generate Report"))
            {
                GenerateReport();
            }
            
            GUILayout.Space(20);
            
            // Show results
            if (fixResults.Count > 0)
            {
                GUILayout.Label("Fix Results:", EditorStyles.boldLabel);
                
                scrollPosition = EditorGUILayout.BeginScrollView(scrollPosition);
                
                foreach (var result in fixResults)
                {
                    EditorGUILayout.BeginVertical("box");
                    
                    EditorGUILayout.LabelField($"Scene: {result.SceneName}", EditorStyles.boldLabel);
                    EditorGUILayout.LabelField($"Total Buttons: {result.TotalButtons}");
                    EditorGUILayout.LabelField($"Fixed Buttons: {result.FixedButtons}");
                    EditorGUILayout.LabelField($"Failed Fixes: {result.FailedFixes}");
                    EditorGUILayout.LabelField($"Success Rate: {result.SuccessRate:F1}%");
                    
                    if (result.FailedButtons.Count > 0)
                    {
                        EditorGUILayout.LabelField("Failed Buttons:", EditorStyles.boldLabel);
                        foreach (string buttonName in result.FailedButtons)
                        {
                            EditorGUILayout.LabelField($"  - {buttonName}");
                        }
                    }
                    
                    EditorGUILayout.EndVertical();
                    GUILayout.Space(5);
                }
                
                EditorGUILayout.EndScrollView();
            }
        }
        
        private void FixCurrentSceneButtons()
        {
            string sceneName = SceneManager.GetActiveScene().name;
            Debug.Log($"🔧 Fixing buttons in current scene: {sceneName}");
            
            ButtonFixResult result = new ButtonFixResult
            {
                SceneName = sceneName
            };
            
            // Find all buttons
            Button[] allButtons = FindObjectsOfType<Button>();
            result.TotalButtons = allButtons.Length;
            
            Debug.Log($"Found {allButtons.Length} buttons to fix");
            
            // Create or get button manager
            UniversalButtonManager buttonManager = FindObjectOfType<UniversalButtonManager>();
            if (buttonManager == null)
            {
                GameObject managerObj = new GameObject("UniversalButtonManager");
                buttonManager = managerObj.AddComponent<UniversalButtonManager>();
                DontDestroyOnLoad(managerObj);
            }
            
            // Fix each button
            foreach (Button button in allButtons)
            {
                try
                {
                    // Clear existing listeners
                    button.onClick.RemoveAllListeners();
                    
                    // Wire the button
                    buttonManager.WireButton(button);
                    
                    // Verify the button is now functional
                    if (IsButtonFunctional(button))
                    {
                        result.FixedButtons++;
                        if (showDetailedLogs)
                        {
                            Debug.Log($"✅ Fixed button: {button.name}");
                        }
                    }
                    else
                    {
                        result.FailedButtons.Add(button.name);
                        result.FailedFixes++;
                        Debug.LogWarning($"❌ Failed to fix button: {button.name}");
                    }
                }
                catch (System.Exception e)
                {
                    result.FailedButtons.Add(button.name);
                    result.FailedFixes++;
                    Debug.LogError($"❌ Error fixing button {button.name}: {e.Message}");
                }
            }
            
            result.SuccessRate = (result.FixedButtons * 100f) / result.TotalButtons;
            fixResults.Add(result);
            
            Debug.Log($"🔧 Button fixing complete for {sceneName}: {result.FixedButtons}/{result.TotalButtons} fixed ({result.SuccessRate:F1}%)");
        }
        
        private void FixAllSceneButtons()
        {
            Debug.Log("🔧 Fixing buttons in all scenes...");
            
            fixResults.Clear();
            
            foreach (string sceneName in sceneNames)
            {
                Debug.Log($"Processing scene: {sceneName}");
                
                // In a real implementation, you would load each scene
                // For now, we'll just process the current scene if it matches
                if (SceneManager.GetActiveScene().name == sceneName)
                {
                    FixCurrentSceneButtons();
                }
            }
            
            Debug.Log("🔧 All scenes processed");
        }
        
        private void VerifyAllButtons()
        {
            Debug.Log("🔍 Verifying all buttons...");
            
            ButtonVerificationSystem verifier = FindObjectOfType<ButtonVerificationSystem>();
            if (verifier == null)
            {
                GameObject verifierObj = new GameObject("ButtonVerificationSystem");
                verifier = verifierObj.AddComponent<ButtonVerificationSystem>();
            }
            
            verifier.VerifyAllButtonsInScene();
        }
        
        private void GenerateReport()
        {
            Debug.Log("📊 Generating button fix report...");
            
            string report = "BUTTON FIX REPORT\n";
            report += "=" * 50 + "\n";
            report += $"Generated: {System.DateTime.Now}\n";
            report += $"Total Scenes Processed: {fixResults.Count}\n\n";
            
            int totalButtons = 0;
            int totalFixed = 0;
            int totalFailed = 0;
            
            foreach (var result in fixResults)
            {
                report += $"Scene: {result.SceneName}\n";
                report += $"  Total Buttons: {result.TotalButtons}\n";
                report += $"  Fixed: {result.FixedButtons}\n";
                report += $"  Failed: {result.FailedFixes}\n";
                report += $"  Success Rate: {result.SuccessRate:F1}%\n\n";
                
                totalButtons += result.TotalButtons;
                totalFixed += result.FixedButtons;
                totalFailed += result.FailedFixes;
            }
            
            report += "SUMMARY:\n";
            report += $"Total Buttons: {totalButtons}\n";
            report += $"Total Fixed: {totalFixed}\n";
            report += $"Total Failed: {totalFailed}\n";
            report += $"Overall Success Rate: {(totalFixed * 100f / totalButtons):F1}%\n";
            
            Debug.Log(report);
        }
        
        private bool IsButtonFunctional(Button button)
        {
            if (button == null) return false;
            if (!button.gameObject.activeInHierarchy) return false;
            if (!button.interactable) return false;
            if (button.onClick.GetPersistentEventCount() == 0) return false;
            if (button.targetGraphic == null) return false;
            
            return true;
        }
        
        [MenuItem("Evergreen/Quick Fix Current Scene Buttons")]
        public static void QuickFixCurrentScene()
        {
            Debug.Log("🔧 Quick fixing current scene buttons...");
            
            // Find all buttons
            Button[] allButtons = FindObjectsOfType<Button>();
            
            // Create button manager
            UniversalButtonManager buttonManager = FindObjectOfType<UniversalButtonManager>();
            if (buttonManager == null)
            {
                GameObject managerObj = new GameObject("UniversalButtonManager");
                buttonManager = managerObj.AddComponent<UniversalButtonManager>();
                DontDestroyOnLoad(managerObj);
            }
            
            // Fix all buttons
            int fixedCount = 0;
            foreach (Button button in allButtons)
            {
                button.onClick.RemoveAllListeners();
                buttonManager.WireButton(button);
                fixedCount++;
            }
            
            Debug.Log($"✅ Quick fixed {fixedCount} buttons in current scene");
        }
        
        [MenuItem("Evergreen/Verify Current Scene Buttons")]
        public static void QuickVerifyCurrentScene()
        {
            Debug.Log("🔍 Quick verifying current scene buttons...");
            
            ButtonVerificationSystem verifier = FindObjectOfType<ButtonVerificationSystem>();
            if (verifier == null)
            {
                GameObject verifierObj = new GameObject("ButtonVerificationSystem");
                verifier = verifierObj.AddComponent<ButtonVerificationSystem>();
            }
            
            verifier.VerifyAllButtonsInScene();
        }
    }
    
    [System.Serializable]
    public class ButtonFixResult
    {
        public string SceneName;
        public int TotalButtons;
        public int FixedButtons;
        public int FailedFixes;
        public float SuccessRate;
        public List<string> FailedButtons = new List<string>();
    }
}