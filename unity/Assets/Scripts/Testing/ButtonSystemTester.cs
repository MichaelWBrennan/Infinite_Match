using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;
using Evergreen.UI;
using Evergreen.Testing;

namespace Evergreen.Testing
{
    /// <summary>
    /// Button System Tester - Comprehensive test of the button fixing system
    /// This script tests all aspects of the button functionality
    /// </summary>
    public class ButtonSystemTester : MonoBehaviour
    {
        [Header("Test Settings")]
        public bool runTestsOnStart = false;
        public bool showDetailedResults = true;
        public bool testButtonClicks = false;
        
        [Header("Test Results")]
        public ButtonTestSummary testSummary;
        
        void Start()
        {
            if (runTestsOnStart)
            {
                RunAllTests();
            }
        }
        
        [ContextMenu("Run All Tests")]
        public void RunAllTests()
        {
            Debug.Log("🧪 Starting comprehensive button system tests...");
            
            testSummary = new ButtonTestSummary
            {
                SceneName = SceneManager.GetActiveScene().name,
                TestStartTime = System.DateTime.Now
            };
            
            // Test 1: Button Detection
            TestButtonDetection();
            
            // Test 2: Button Manager Creation
            TestButtonManagerCreation();
            
            // Test 3: Button Wiring
            TestButtonWiring();
            
            // Test 4: Button Functionality
            TestButtonFunctionality();
            
            // Test 5: Button Verification
            TestButtonVerification();
            
            // Test 6: Button Performance
            TestButtonPerformance();
            
            // Generate final report
            GenerateTestReport();
            
            Debug.Log("🧪 All button system tests completed!");
        }
        
        private void TestButtonDetection()
        {
            Debug.Log("🔍 Testing button detection...");
            
            Button[] allButtons = FindObjectsOfType<Button>();
            testSummary.TotalButtonsFound = allButtons.Length;
            
            Debug.Log($"Found {allButtons.Length} buttons in scene");
            
            // Categorize buttons
            foreach (Button button in allButtons)
            {
                string buttonName = button.name.ToLower();
                
                if (buttonName.Contains("play") || buttonName.Contains("start"))
                    testSummary.PlayButtons++;
                else if (buttonName.Contains("back") || buttonName.Contains("return"))
                    testSummary.BackButtons++;
                else if (buttonName.Contains("settings"))
                    testSummary.SettingsButtons++;
                else if (buttonName.Contains("shop"))
                    testSummary.ShopButtons++;
                else if (buttonName.Contains("social"))
                    testSummary.SocialButtons++;
                else if (buttonName.Contains("pause"))
                    testSummary.PauseButtons++;
                else
                    testSummary.OtherButtons++;
            }
            
            Debug.Log($"Button categories: Play({testSummary.PlayButtons}), Back({testSummary.BackButtons}), Settings({testSummary.SettingsButtons}), Shop({testSummary.ShopButtons}), Social({testSummary.SocialButtons}), Pause({testSummary.PauseButtons}), Other({testSummary.OtherButtons})");
        }
        
        private void TestButtonManagerCreation()
        {
            Debug.Log("🔧 Testing button manager creation...");
            
            // Test if button manager exists
            UniversalButtonManager existingManager = FindObjectOfType<UniversalButtonManager>();
            if (existingManager != null)
            {
                testSummary.ButtonManagerExists = true;
                Debug.Log("✅ Button manager already exists");
            }
            else
            {
                // Create button manager
                GameObject managerObj = new GameObject("UniversalButtonManager");
                UniversalButtonManager newManager = managerObj.AddComponent<UniversalButtonManager>();
                DontDestroyOnLoad(managerObj);
                
                testSummary.ButtonManagerExists = true;
                testSummary.ButtonManagerCreated = true;
                Debug.Log("✅ Button manager created successfully");
            }
        }
        
        private void TestButtonWiring()
        {
            Debug.Log("🔌 Testing button wiring...");
            
            UniversalButtonManager buttonManager = FindObjectOfType<UniversalButtonManager>();
            if (buttonManager == null)
            {
                Debug.LogError("❌ Button manager not found for wiring test");
                return;
            }
            
            Button[] allButtons = FindObjectsOfType<Button>();
            int wiredButtons = 0;
            int failedWires = 0;
            
            foreach (Button button in allButtons)
            {
                try
                {
                    // Clear existing listeners
                    button.onClick.RemoveAllListeners();
                    
                    // Wire the button
                    buttonManager.WireButton(button);
                    
                    // Check if button has listeners
                    if (button.onClick.GetPersistentEventCount() > 0)
                    {
                        wiredButtons++;
                    }
                    else
                    {
                        failedWires++;
                        Debug.LogWarning($"❌ Failed to wire button: {button.name}");
                    }
                }
                catch (System.Exception e)
                {
                    failedWires++;
                    Debug.LogError($"❌ Error wiring button {button.name}: {e.Message}");
                }
            }
            
            testSummary.ButtonsWired = wiredButtons;
            testSummary.WiringFailures = failedWires;
            testSummary.WiringSuccessRate = (wiredButtons * 100f) / allButtons.Length;
            
            Debug.Log($"Button wiring: {wiredButtons} wired, {failedWires} failed ({testSummary.WiringSuccessRate:F1}%)");
        }
        
        private void TestButtonFunctionality()
        {
            Debug.Log("⚡ Testing button functionality...");
            
            Button[] allButtons = FindObjectsOfType<Button>();
            int functionalButtons = 0;
            int nonFunctionalButtons = 0;
            
            foreach (Button button in allButtons)
            {
                if (IsButtonFunctional(button))
                {
                    functionalButtons++;
                }
                else
                {
                    nonFunctionalButtons++;
                    Debug.LogWarning($"❌ Non-functional button: {button.name}");
                }
            }
            
            testSummary.FunctionalButtons = functionalButtons;
            testSummary.NonFunctionalButtons = nonFunctionalButtons;
            testSummary.FunctionalitySuccessRate = (functionalButtons * 100f) / allButtons.Length;
            
            Debug.Log($"Button functionality: {functionalButtons} functional, {nonFunctionalButtons} non-functional ({testSummary.FunctionalitySuccessRate:F1}%)");
        }
        
        private void TestButtonVerification()
        {
            Debug.Log("🔍 Testing button verification system...");
            
            ButtonVerificationSystem verifier = FindObjectOfType<ButtonVerificationSystem>();
            if (verifier == null)
            {
                GameObject verifierObj = new GameObject("ButtonVerificationSystem");
                verifier = verifierObj.AddComponent<ButtonVerificationSystem>();
            }
            
            // Run verification
            verifier.VerifyAllButtonsInScene();
            
            // Get results
            var results = verifier.GetTestResults();
            testSummary.VerificationResults = results;
            testSummary.VerificationSuccessRate = verifier.GetSuccessRate();
            
            Debug.Log($"Button verification: {testSummary.VerificationSuccessRate:F1}% success rate");
        }
        
        private void TestButtonPerformance()
        {
            Debug.Log("⚡ Testing button performance...");
            
            Button[] allButtons = FindObjectsOfType<Button>();
            
            // Test wiring performance
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();
            
            UniversalButtonManager buttonManager = FindObjectOfType<UniversalButtonManager>();
            foreach (Button button in allButtons)
            {
                buttonManager.WireButton(button);
            }
            
            stopwatch.Stop();
            
            testSummary.WiringTimeMs = stopwatch.ElapsedMilliseconds;
            testSummary.ButtonsPerSecond = (allButtons.Length * 1000f) / stopwatch.ElapsedMilliseconds;
            
            Debug.Log($"Button performance: {testSummary.WiringTimeMs}ms to wire {allButtons.Length} buttons ({testSummary.ButtonsPerSecond:F1} buttons/sec)");
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
        
        private void GenerateTestReport()
        {
            testSummary.TestEndTime = System.DateTime.Now;
            testSummary.TestDuration = testSummary.TestEndTime - testSummary.TestStartTime;
            
            string report = "\n🧪 BUTTON SYSTEM TEST REPORT\n";
            report += "=" * 50 + "\n";
            report += $"Scene: {testSummary.SceneName}\n";
            report += $"Test Duration: {testSummary.TestDuration.TotalSeconds:F2}s\n";
            report += $"Test Time: {testSummary.TestStartTime:HH:mm:ss} - {testSummary.TestEndTime:HH:mm:ss}\n\n";
            
            report += "BUTTON DETECTION:\n";
            report += $"  Total Buttons: {testSummary.TotalButtonsFound}\n";
            report += $"  Play Buttons: {testSummary.PlayButtons}\n";
            report += $"  Back Buttons: {testSummary.BackButtons}\n";
            report += $"  Settings Buttons: {testSummary.SettingsButtons}\n";
            report += $"  Shop Buttons: {testSummary.ShopButtons}\n";
            report += $"  Social Buttons: {testSummary.SocialButtons}\n";
            report += $"  Pause Buttons: {testSummary.PauseButtons}\n";
            report += $"  Other Buttons: {testSummary.OtherButtons}\n\n";
            
            report += "BUTTON MANAGER:\n";
            report += $"  Manager Exists: {testSummary.ButtonManagerExists}\n";
            report += $"  Manager Created: {testSummary.ButtonManagerCreated}\n\n";
            
            report += "BUTTON WIRING:\n";
            report += $"  Buttons Wired: {testSummary.ButtonsWired}\n";
            report += $"  Wiring Failures: {testSummary.WiringFailures}\n";
            report += $"  Wiring Success Rate: {testSummary.WiringSuccessRate:F1}%\n\n";
            
            report += "BUTTON FUNCTIONALITY:\n";
            report += $"  Functional Buttons: {testSummary.FunctionalButtons}\n";
            report += $"  Non-functional Buttons: {testSummary.NonFunctionalButtons}\n";
            report += $"  Functionality Success Rate: {testSummary.FunctionalitySuccessRate:F1}%\n\n";
            
            report += "VERIFICATION:\n";
            report += $"  Verification Success Rate: {testSummary.VerificationSuccessRate:F1}%\n\n";
            
            report += "PERFORMANCE:\n";
            report += $"  Wiring Time: {testSummary.WiringTimeMs}ms\n";
            report += $"  Buttons Per Second: {testSummary.ButtonsPerSecond:F1}\n\n";
            
            // Overall assessment
            if (testSummary.FunctionalitySuccessRate >= 95f)
            {
                report += "OVERALL ASSESSMENT: ✅ EXCELLENT - All buttons are functional\n";
            }
            else if (testSummary.FunctionalitySuccessRate >= 80f)
            {
                report += "OVERALL ASSESSMENT: ✅ GOOD - Most buttons are functional\n";
            }
            else if (testSummary.FunctionalitySuccessRate >= 60f)
            {
                report += "OVERALL ASSESSMENT: ⚠️ FAIR - Some buttons need attention\n";
            }
            else
            {
                report += "OVERALL ASSESSMENT: ❌ POOR - Many buttons need fixing\n";
            }
            
            Debug.Log(report);
        }
        
        [ContextMenu("Test Button Clicks")]
        public void TestButtonClicks()
        {
            if (!testButtonClicks)
            {
                Debug.LogWarning("Button click testing is disabled. Enable 'testButtonClicks' to test button clicks.");
                return;
            }
            
            Debug.Log("🧪 Testing button clicks...");
            
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
    }
    
    [System.Serializable]
    public class ButtonTestSummary
    {
        public string SceneName;
        public System.DateTime TestStartTime;
        public System.DateTime TestEndTime;
        public System.TimeSpan TestDuration;
        
        // Button Detection
        public int TotalButtonsFound;
        public int PlayButtons;
        public int BackButtons;
        public int SettingsButtons;
        public int ShopButtons;
        public int SocialButtons;
        public int PauseButtons;
        public int OtherButtons;
        
        // Button Manager
        public bool ButtonManagerExists;
        public bool ButtonManagerCreated;
        
        // Button Wiring
        public int ButtonsWired;
        public int WiringFailures;
        public float WiringSuccessRate;
        
        // Button Functionality
        public int FunctionalButtons;
        public int NonFunctionalButtons;
        public float FunctionalitySuccessRate;
        
        // Verification
        public float VerificationSuccessRate;
        public System.Collections.Generic.List<ButtonTestResult> VerificationResults;
        
        // Performance
        public long WiringTimeMs;
        public float ButtonsPerSecond;
    }
}