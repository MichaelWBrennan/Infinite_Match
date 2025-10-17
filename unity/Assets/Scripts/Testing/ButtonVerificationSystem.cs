using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;
using System.Collections.Generic;
using System.Linq;
using Evergreen.UI;

namespace Evergreen.Testing
{
    /// <summary>
    /// Button Verification System - Comprehensive testing of all buttons in scenes
    /// Ensures all buttons are functional and properly wired
    /// </summary>
    public class ButtonVerificationSystem : MonoBehaviour
    {
        [Header("Verification Settings")]
        public bool runVerificationOnStart = false;
        public bool showDetailedLogs = true;
        public bool testButtonClicks = false; // Set to true to actually test button clicks
        
        [Header("Test Results")]
        public List<ButtonTestResult> testResults = new List<ButtonTestResult>();
        
        private UniversalButtonManager _buttonManager;
        
        public static ButtonVerificationSystem Instance { get; private set; }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            if (runVerificationOnStart)
            {
                VerifyAllButtonsInScene();
            }
        }
        
        public void VerifyAllButtonsInScene()
        {
            string sceneName = SceneManager.GetActiveScene().name;
            Debug.Log($"🔍 Starting button verification for scene: {sceneName}");
            
            // Clear previous results
            testResults.Clear();
            
            // Find all buttons in the scene
            Button[] allButtons = FindObjectsOfType<Button>();
            
            Debug.Log($"Found {allButtons.Length} buttons to verify");
            
            int functionalButtons = 0;
            int nonFunctionalButtons = 0;
            
            foreach (Button button in allButtons)
            {
                ButtonTestResult result = VerifyButton(button);
                testResults.Add(result);
                
                if (result.IsFunctional)
                {
                    functionalButtons++;
                    if (showDetailedLogs)
                    {
                        Debug.Log($"✅ {result.ButtonName}: {result.Status}");
                    }
                }
                else
                {
                    nonFunctionalButtons++;
                    Debug.LogWarning($"❌ {result.ButtonName}: {result.Status}");
                }
            }
            
            // Summary
            Debug.Log($"📊 Button Verification Complete for {sceneName}:");
            Debug.Log($"   ✅ Functional: {functionalButtons}");
            Debug.Log($"   ❌ Non-functional: {nonFunctionalButtons}");
            Debug.Log($"   📈 Success Rate: {(functionalButtons * 100f / allButtons.Length):F1}%");
            
            // Generate report
            GenerateVerificationReport();
        }
        
        private ButtonTestResult VerifyButton(Button button)
        {
            ButtonTestResult result = new ButtonTestResult
            {
                ButtonName = button.name,
                SceneName = SceneManager.GetActiveScene().name,
                GameObjectPath = GetGameObjectPath(button.gameObject)
            };
            
            // Test 1: Button exists and is active
            if (button == null)
            {
                result.Status = "Button is null";
                result.IsFunctional = false;
                return result;
            }
            
            if (!button.gameObject.activeInHierarchy)
            {
                result.Status = "Button GameObject is inactive";
                result.IsFunctional = false;
                return result;
            }
            
            // Test 2: Button is interactable
            if (!button.interactable)
            {
                result.Status = "Button is not interactable";
                result.IsFunctional = false;
                return result;
            }
            
            // Test 3: Button has click listeners
            int listenerCount = button.onClick.GetPersistentEventCount();
            if (listenerCount == 0)
            {
                result.Status = "Button has no click listeners";
                result.IsFunctional = false;
                return result;
            }
            
            // Test 4: Button has valid target graphic
            if (button.targetGraphic == null)
            {
                result.Status = "Button has no target graphic";
                result.IsFunctional = false;
                return result;
            }
            
            // Test 5: Button has proper RectTransform
            RectTransform rectTransform = button.GetComponent<RectTransform>();
            if (rectTransform == null)
            {
                result.Status = "Button has no RectTransform";
                result.IsFunctional = false;
                return result;
            }
            
            // Test 6: Button has proper size
            if (rectTransform.sizeDelta.x <= 0 || rectTransform.sizeDelta.y <= 0)
            {
                result.Status = "Button has invalid size";
                result.IsFunctional = false;
                return result;
            }
            
            // Test 7: Button is visible (has Image component)
            Image image = button.GetComponent<Image>();
            if (image == null)
            {
                result.Status = "Button has no Image component";
                result.IsFunctional = false;
                return result;
            }
            
            // Test 8: Button has proper color (not transparent)
            if (image.color.a < 0.1f)
            {
                result.Status = "Button is nearly transparent";
                result.IsFunctional = false;
                return result;
            }
            
            // Test 9: Button has text or icon
            Text buttonText = button.GetComponentInChildren<Text>();
            Image buttonIcon = button.GetComponentInChildren<Image>();
            if (buttonText == null && buttonIcon == null)
            {
                result.Status = "Button has no text or icon";
                result.IsFunctional = false;
                return result;
            }
            
            // Test 10: Button is properly positioned
            if (rectTransform.anchoredPosition.x < -10000 || rectTransform.anchoredPosition.x > 10000 ||
                rectTransform.anchoredPosition.y < -10000 || rectTransform.anchoredPosition.y > 10000)
            {
                result.Status = "Button is positioned off-screen";
                result.IsFunctional = false;
                return result;
            }
            
            // If we get here, the button is functional
            result.Status = "Button is functional";
            result.IsFunctional = true;
            result.ListenerCount = listenerCount;
            
            // Additional info
            result.HasText = buttonText != null;
            result.HasIcon = buttonIcon != null;
            result.ButtonSize = rectTransform.sizeDelta;
            result.ButtonPosition = rectTransform.anchoredPosition;
            
            return result;
        }
        
        private string GetGameObjectPath(GameObject obj)
        {
            string path = obj.name;
            Transform parent = obj.transform.parent;
            
            while (parent != null)
            {
                path = parent.name + "/" + path;
                parent = parent.parent;
            }
            
            return path;
        }
        
        private void GenerateVerificationReport()
        {
            string report = "\n📋 BUTTON VERIFICATION REPORT\n";
            report += "=" * 50 + "\n";
            report += $"Scene: {SceneManager.GetActiveScene().name}\n";
            report += $"Total Buttons: {testResults.Count}\n";
            report += $"Functional: {testResults.Count(r => r.IsFunctional)}\n";
            report += $"Non-functional: {testResults.Count(r => !r.IsFunctional)}\n";
            report += $"Success Rate: {(testResults.Count(r => r.IsFunctional) * 100f / testResults.Count):F1}%\n\n";
            
            // Group by status
            var groupedResults = testResults.GroupBy(r => r.Status);
            
            foreach (var group in groupedResults)
            {
                report += $"{group.Key}: {group.Count()} buttons\n";
                foreach (var result in group)
                {
                    report += $"  - {result.ButtonName}\n";
                }
                report += "\n";
            }
            
            Debug.Log(report);
        }
        
        public void FixNonFunctionalButtons()
        {
            Debug.Log("🔧 Attempting to fix non-functional buttons...");
            
            // Get or create button manager
            _buttonManager = UniversalButtonManager.Instance;
            if (_buttonManager == null)
            {
                GameObject managerObj = new GameObject("UniversalButtonManager");
                _buttonManager = managerObj.AddComponent<UniversalButtonManager>();
                DontDestroyOnLoad(managerObj);
            }
            
            // Find all buttons
            Button[] allButtons = FindObjectsOfType<Button>();
            
            int fixedButtons = 0;
            
            foreach (Button button in allButtons)
            {
                // Check if button needs fixing
                ButtonTestResult result = VerifyButton(button);
                if (!result.IsFunctional)
                {
                    // Try to fix the button
                    _buttonManager.WireButton(button);
                    
                    // Verify again
                    ButtonTestResult newResult = VerifyButton(button);
                    if (newResult.IsFunctional)
                    {
                        fixedButtons++;
                        Debug.Log($"✅ Fixed button: {button.name}");
                    }
                    else
                    {
                        Debug.LogWarning($"❌ Could not fix button: {button.name}");
                    }
                }
            }
            
            Debug.Log($"🔧 Fixed {fixedButtons} buttons");
            
            // Re-verify all buttons
            VerifyAllButtonsInScene();
        }
        
        public void TestAllButtonClicks()
        {
            if (!testButtonClicks)
            {
                Debug.LogWarning("Button click testing is disabled. Enable 'testButtonClicks' to test button clicks.");
                return;
            }
            
            Debug.Log("🧪 Testing all button clicks...");
            
            Button[] allButtons = FindObjectsOfType<Button>();
            int testedButtons = 0;
            int successfulClicks = 0;
            
            foreach (Button button in allButtons)
            {
                if (button.interactable)
                {
                    testedButtons++;
                    try
                    {
                        button.onClick.Invoke();
                        successfulClicks++;
                        Debug.Log($"✅ Button click successful: {button.name}");
                    }
                    catch (System.Exception e)
                    {
                        Debug.LogError($"❌ Button click failed: {button.name} - {e.Message}");
                    }
                }
            }
            
            Debug.Log($"🧪 Button click testing complete: {successfulClicks}/{testedButtons} successful");
        }
        
        public void ExportReportToFile()
        {
            string report = GenerateDetailedReport();
            string fileName = $"ButtonVerificationReport_{SceneManager.GetActiveScene().name}_{System.DateTime.Now:yyyyMMdd_HHmmss}.txt";
            string filePath = System.IO.Path.Combine(Application.persistentDataPath, fileName);
            
            System.IO.File.WriteAllText(filePath, report);
            Debug.Log($"📄 Report exported to: {filePath}");
        }
        
        private string GenerateDetailedReport()
        {
            string report = "DETAILED BUTTON VERIFICATION REPORT\n";
            report += "=" * 50 + "\n";
            report += $"Generated: {System.DateTime.Now}\n";
            report += $"Scene: {SceneManager.GetActiveScene().name}\n";
            report += $"Unity Version: {Application.unityVersion}\n\n";
            
            report += "BUTTON DETAILS:\n";
            report += "-" * 30 + "\n";
            
            foreach (var result in testResults)
            {
                report += $"Button: {result.ButtonName}\n";
                report += $"  Status: {result.Status}\n";
                report += $"  Functional: {result.IsFunctional}\n";
                report += $"  Path: {result.GameObjectPath}\n";
                report += $"  Listeners: {result.ListenerCount}\n";
                report += $"  Has Text: {result.HasText}\n";
                report += $"  Has Icon: {result.HasIcon}\n";
                report += $"  Size: {result.ButtonSize}\n";
                report += $"  Position: {result.ButtonPosition}\n";
                report += "\n";
            }
            
            return report;
        }
        
        #region Public API
        
        public void VerifyScene(string sceneName)
        {
            if (SceneManager.GetActiveScene().name == sceneName)
            {
                VerifyAllButtonsInScene();
            }
            else
            {
                Debug.LogWarning($"Current scene is not {sceneName}. Cannot verify buttons.");
            }
        }
        
        public void VerifyAllScenes()
        {
            string[] sceneNames = { "MainMenu", "Gameplay", "Settings", "Shop", "Social", "Events", "Collections" };
            
            foreach (string sceneName in sceneNames)
            {
                Debug.Log($"Verifying scene: {sceneName}");
                // Note: In a real implementation, you would load each scene and verify
                // For now, we'll just verify the current scene
                if (SceneManager.GetActiveScene().name == sceneName)
                {
                    VerifyAllButtonsInScene();
                }
            }
        }
        
        public List<ButtonTestResult> GetTestResults()
        {
            return new List<ButtonTestResult>(testResults);
        }
        
        public int GetFunctionalButtonCount()
        {
            return testResults.Count(r => r.IsFunctional);
        }
        
        public int GetNonFunctionalButtonCount()
        {
            return testResults.Count(r => !r.IsFunctional);
        }
        
        public float GetSuccessRate()
        {
            if (testResults.Count == 0) return 0f;
            return (GetFunctionalButtonCount() * 100f) / testResults.Count;
        }
        
        #endregion
    }
    
    [System.Serializable]
    public class ButtonTestResult
    {
        public string ButtonName;
        public string SceneName;
        public string GameObjectPath;
        public string Status;
        public bool IsFunctional;
        public int ListenerCount;
        public bool HasText;
        public bool HasIcon;
        public Vector2 ButtonSize;
        public Vector2 ButtonPosition;
    }
}