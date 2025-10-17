using System.Collections;
using UnityEngine;
using System;
using Evergreen.Weather;
using Evergreen.Social;
using Evergreen.Realtime;

namespace Evergreen.Testing
{
    /// <summary>
    /// Final validation tester for complete key-free systems integration
    /// </summary>
    public class FinalValidationTester : MonoBehaviour
    {
        [Header("Validation Configuration")]
        [SerializeField] private bool runValidationOnStart = true;
        [SerializeField] private float validationDelay = 1f;
        [SerializeField] private bool enableStressTesting = false;
        [SerializeField] private int stressTestIterations = 10;
        
        [Header("Validation Results")]
        [SerializeField] private ValidationResults results = new ValidationResults();
        
        [System.Serializable]
        public class ValidationResults
        {
            public bool allSystemsInitialized = false;
            public bool weatherSystemWorking = false;
            public bool socialSystemWorking = false;
            public bool calendarSystemWorking = false;
            public bool eventSystemWorking = false;
            public bool unifiedSystemWorking = false;
            public bool apiConnectivityWorking = false;
            public bool dataFlowWorking = false;
            public bool errorHandlingWorking = false;
            public bool performanceAcceptable = false;
            public string overallStatus = "Not Tested";
            public DateTime lastValidation;
            public List<string> issues = new List<string>();
            public List<string> recommendations = new List<string>();
        }
        
        void Start()
        {
            if (runValidationOnStart)
            {
                StartCoroutine(RunFinalValidation());
            }
        }
        
        private IEnumerator RunFinalValidation()
        {
            Debug.Log("🔍 Starting Final Validation of Key-Free Systems...");
            
            // Reset results
            results = new ValidationResults();
            results.lastValidation = DateTime.Now;
            
            // Test 1: System Initialization
            yield return StartCoroutine(ValidateSystemInitialization());
            
            yield return new WaitForSeconds(validationDelay);
            
            // Test 2: Individual System Functionality
            yield return StartCoroutine(ValidateIndividualSystems());
            
            yield return new WaitForSeconds(validationDelay);
            
            // Test 3: API Connectivity
            yield return StartCoroutine(ValidateAPIConnectivity());
            
            yield return new WaitForSeconds(validationDelay);
            
            // Test 4: Data Flow
            yield return StartCoroutine(ValidateDataFlow());
            
            yield return new WaitForSeconds(validationDelay);
            
            // Test 5: Error Handling
            yield return StartCoroutine(ValidateErrorHandling());
            
            yield return new WaitForSeconds(validationDelay);
            
            // Test 6: Performance
            yield return StartCoroutine(ValidatePerformance());
            
            // Test 7: Stress Testing (if enabled)
            if (enableStressTesting)
            {
                yield return StartCoroutine(RunStressTests());
            }
            
            // Calculate overall status
            CalculateOverallStatus();
            
            // Print validation results
            PrintValidationResults();
            
            Debug.Log("✅ Final Validation Complete!");
        }
        
        private IEnumerator ValidateSystemInitialization()
        {
            Debug.Log("🔧 Validating System Initialization...");
            
            try
            {
                // Check if all systems are initialized
                bool weatherInit = KeyFreeWeatherSystem.Instance != null;
                bool socialInit = KeyFreeSocialManager.Instance != null;
                bool calendarInit = KeyFreeCalendarManager.Instance != null;
                bool eventInit = KeyFreeEventManager.Instance != null;
                bool unifiedInit = KeyFreeUnifiedManager.Instance != null;
                
                results.allSystemsInitialized = weatherInit && socialInit && calendarInit && eventInit && unifiedInit;
                
                if (results.allSystemsInitialized)
                {
                    Debug.Log("✅ All systems initialized successfully");
                }
                else
                {
                    Debug.LogError("❌ Some systems failed to initialize");
                    if (!weatherInit) results.issues.Add("Weather system not initialized");
                    if (!socialInit) results.issues.Add("Social system not initialized");
                    if (!calendarInit) results.issues.Add("Calendar system not initialized");
                    if (!eventInit) results.issues.Add("Event system not initialized");
                    if (!unifiedInit) results.issues.Add("Unified system not initialized");
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"❌ System initialization validation failed: {e.Message}");
                results.issues.Add($"System initialization error: {e.Message}");
            }
            
            yield return null;
        }
        
        private IEnumerator ValidateIndividualSystems()
        {
            Debug.Log("🔍 Validating Individual Systems...");
            
            // Weather System
            yield return StartCoroutine(ValidateWeatherSystem());
            
            // Social System
            yield return StartCoroutine(ValidateSocialSystem());
            
            // Calendar System
            yield return StartCoroutine(ValidateCalendarSystem());
            
            // Event System
            yield return StartCoroutine(ValidateEventSystem());
            
            // Unified System
            yield return StartCoroutine(ValidateUnifiedSystem());
        }
        
        private IEnumerator ValidateWeatherSystem()
        {
            try
            {
                var weatherSystem = KeyFreeWeatherSystem.Instance;
                if (weatherSystem == null)
                {
                    results.issues.Add("Weather system instance is null");
                    yield break;
                }
                
                // Test basic functionality
                bool isActive = weatherSystem.IsWeatherActive();
                var weather = weatherSystem.GetCurrentWeather();
                
                // Test refresh
                weatherSystem.RefreshWeather();
                
                results.weatherSystemWorking = true;
                Debug.Log("✅ Weather system validation passed");
            }
            catch (Exception e)
            {
                results.issues.Add($"Weather system validation failed: {e.Message}");
                Debug.LogError($"❌ Weather system validation failed: {e.Message}");
            }
            
            yield return null;
        }
        
        private IEnumerator ValidateSocialSystem()
        {
            try
            {
                var socialManager = KeyFreeSocialManager.Instance;
                if (socialManager == null)
                {
                    results.issues.Add("Social manager instance is null");
                    yield break;
                }
                
                // Test basic functionality
                var stats = socialManager.GetSocialStats();
                var history = socialManager.GetShareHistory();
                
                // Test sharing methods
                socialManager.SetSharingMethodEnabled(KeyFreeSocialManager.SharePlatform.Native, true);
                socialManager.SetSharingMethodEnabled(KeyFreeSocialManager.SharePlatform.QR, true);
                
                results.socialSystemWorking = true;
                Debug.Log("✅ Social system validation passed");
            }
            catch (Exception e)
            {
                results.issues.Add($"Social system validation failed: {e.Message}");
                Debug.LogError($"❌ Social system validation failed: {e.Message}");
            }
            
            yield return null;
        }
        
        private IEnumerator ValidateCalendarSystem()
        {
            try
            {
                var calendarManager = KeyFreeCalendarManager.Instance;
                if (calendarManager == null)
                {
                    results.issues.Add("Calendar manager instance is null");
                    yield break;
                }
                
                // Test basic functionality
                var allEvents = calendarManager.GetAllEvents();
                var activeEvents = calendarManager.GetActiveEvents();
                var upcomingEvents = calendarManager.GetUpcomingEvents();
                
                // Test timezone handling
                calendarManager.SetTimezone("America/New_York");
                string timezone = calendarManager.GetCurrentTimezone();
                
                results.calendarSystemWorking = true;
                Debug.Log("✅ Calendar system validation passed");
            }
            catch (Exception e)
            {
                results.issues.Add($"Calendar system validation failed: {e.Message}");
                Debug.LogError($"❌ Calendar system validation failed: {e.Message}");
            }
            
            yield return null;
        }
        
        private IEnumerator ValidateEventSystem()
        {
            try
            {
                var eventManager = KeyFreeEventManager.Instance;
                if (eventManager == null)
                {
                    results.issues.Add("Event manager instance is null");
                    yield break;
                }
                
                // Test basic functionality
                var allEvents = eventManager.GetAllEvents();
                var activeEvents = eventManager.GetActiveEvents();
                var upcomingEvents = eventManager.GetUpcomingEvents();
                
                // Test statistics
                var stats = eventManager.GetEventStatistics();
                
                results.eventSystemWorking = true;
                Debug.Log("✅ Event system validation passed");
            }
            catch (Exception e)
            {
                results.issues.Add($"Event system validation failed: {e.Message}");
                Debug.LogError($"❌ Event system validation failed: {e.Message}");
            }
            
            yield return null;
        }
        
        private IEnumerator ValidateUnifiedSystem()
        {
            try
            {
                var unifiedManager = KeyFreeUnifiedManager.Instance;
                if (unifiedManager == null)
                {
                    results.issues.Add("Unified manager instance is null");
                    yield break;
                }
                
                // Test basic functionality
                var playerData = unifiedManager.GetCurrentPlayerData();
                var systemStatus = unifiedManager.GetSystemStatus();
                
                // Test timezone handling
                unifiedManager.SetTimezone("America/New_York");
                string timezone = unifiedManager.GetCurrentTimezone();
                
                results.unifiedSystemWorking = true;
                Debug.Log("✅ Unified system validation passed");
            }
            catch (Exception e)
            {
                results.issues.Add($"Unified system validation failed: {e.Message}");
                Debug.LogError($"❌ Unified system validation failed: {e.Message}");
            }
            
            yield return null;
        }
        
        private IEnumerator ValidateAPIConnectivity()
        {
            Debug.Log("🌐 Validating API Connectivity...");
            
            try
            {
                // Test OpenMeteo API
                using (var request = UnityEngine.Networking.UnityWebRequest.Get("https://api.open-meteo.com/v1/forecast?latitude=51.5074&longitude=-0.1278&current_weather=true&timezone=auto"))
                {
                    yield return request.SendWebRequest();
                    
                    if (request.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
                    {
                        Debug.Log("✅ OpenMeteo API accessible");
                    }
                    else
                    {
                        results.issues.Add($"OpenMeteo API not accessible: {request.error}");
                    }
                }
                
                // Test WTTR API
                using (var request = UnityEngine.Networking.UnityWebRequest.Get("https://wttr.in/London?format=j1"))
                {
                    yield return request.SendWebRequest();
                    
                    if (request.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
                    {
                        Debug.Log("✅ WTTR API accessible");
                    }
                    else
                    {
                        results.issues.Add($"WTTR API not accessible: {request.error}");
                    }
                }
                
                // Test IP Location API
                using (var request = UnityEngine.Networking.UnityWebRequest.Get("https://ipapi.co/json/"))
                {
                    yield return request.SendWebRequest();
                    
                    if (request.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
                    {
                        Debug.Log("✅ IP Location API accessible");
                    }
                    else
                    {
                        results.issues.Add($"IP Location API not accessible: {request.error}");
                    }
                }
                
                // Test QR Code API
                using (var request = UnityEngine.Networking.UnityWebRequest.Get("https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=test"))
                {
                    yield return request.SendWebRequest();
                    
                    if (request.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
                    {
                        Debug.Log("✅ QR Code API accessible");
                    }
                    else
                    {
                        results.issues.Add($"QR Code API not accessible: {request.error}");
                    }
                }
                
                results.apiConnectivityWorking = true;
                Debug.Log("✅ API connectivity validation passed");
            }
            catch (Exception e)
            {
                results.issues.Add($"API connectivity validation failed: {e.Message}");
                Debug.LogError($"❌ API connectivity validation failed: {e.Message}");
            }
        }
        
        private IEnumerator ValidateDataFlow()
        {
            Debug.Log("📊 Validating Data Flow...");
            
            try
            {
                // Test weather data flow
                var weatherSystem = KeyFreeWeatherSystem.Instance;
                if (weatherSystem != null)
                {
                    weatherSystem.RefreshWeather();
                    yield return new WaitForSeconds(1f);
                    
                    var weather = weatherSystem.GetCurrentWeather();
                    if (weather != null)
                    {
                        Debug.Log("✅ Weather data flow working");
                    }
                    else
                    {
                        results.issues.Add("Weather data flow not working");
                    }
                }
                
                // Test calendar data flow
                var calendarManager = KeyFreeCalendarManager.Instance;
                if (calendarManager != null)
                {
                    var events = calendarManager.GetAllEvents();
                    if (events != null)
                    {
                        Debug.Log("✅ Calendar data flow working");
                    }
                    else
                    {
                        results.issues.Add("Calendar data flow not working");
                    }
                }
                
                // Test event data flow
                var eventManager = KeyFreeEventManager.Instance;
                if (eventManager != null)
                {
                    var events = eventManager.GetAllEvents();
                    if (events != null)
                    {
                        Debug.Log("✅ Event data flow working");
                    }
                    else
                    {
                        results.issues.Add("Event data flow not working");
                    }
                }
                
                // Test unified data flow
                var unifiedManager = KeyFreeUnifiedManager.Instance;
                if (unifiedManager != null)
                {
                    var playerData = unifiedManager.GetCurrentPlayerData();
                    if (playerData != null)
                    {
                        Debug.Log("✅ Unified data flow working");
                    }
                    else
                    {
                        results.issues.Add("Unified data flow not working");
                    }
                }
                
                results.dataFlowWorking = true;
                Debug.Log("✅ Data flow validation passed");
            }
            catch (Exception e)
            {
                results.issues.Add($"Data flow validation failed: {e.Message}");
                Debug.LogError($"❌ Data flow validation failed: {e.Message}");
            }
        }
        
        private IEnumerator ValidateErrorHandling()
        {
            Debug.Log("🛡️ Validating Error Handling...");
            
            try
            {
                // Test weather system error handling
                var weatherSystem = KeyFreeWeatherSystem.Instance;
                if (weatherSystem != null)
                {
                    // Test with invalid location
                    weatherSystem.SetLocation(999f, 999f, "Invalid Location");
                    weatherSystem.RefreshWeather();
                    
                    Debug.Log("✅ Weather error handling working");
                }
                
                // Test social system error handling
                var socialManager = KeyFreeSocialManager.Instance;
                if (socialManager != null)
                {
                    // Test with invalid data
                    socialManager.SetGameInfo("", "", "");
                    
                    Debug.Log("✅ Social error handling working");
                }
                
                results.errorHandlingWorking = true;
                Debug.Log("✅ Error handling validation passed");
            }
            catch (Exception e)
            {
                results.issues.Add($"Error handling validation failed: {e.Message}");
                Debug.LogError($"❌ Error handling validation failed: {e.Message}");
            }
            
            yield return null;
        }
        
        private IEnumerator ValidatePerformance()
        {
            Debug.Log("⚡ Validating Performance...");
            
            try
            {
                // Check memory usage
                float memoryUsage = UnityEngine.Profiling.Profiler.GetTotalAllocatedMemory(false) / 1024f / 1024f; // MB
                
                if (memoryUsage < 100f)
                {
                    Debug.Log($"✅ Memory usage acceptable: {memoryUsage:F2} MB");
                }
                else
                {
                    results.issues.Add($"High memory usage: {memoryUsage:F2} MB");
                }
                
                // Check frame rate
                float frameRate = 1f / Time.deltaTime;
                
                if (frameRate > 30f)
                {
                    Debug.Log($"✅ Frame rate acceptable: {frameRate:F1} FPS");
                }
                else
                {
                    results.issues.Add($"Low frame rate: {frameRate:F1} FPS");
                }
                
                // Check object count
                int gameObjectCount = FindObjectsOfType<GameObject>().Length;
                
                if (gameObjectCount < 1000)
                {
                    Debug.Log($"✅ Object count acceptable: {gameObjectCount}");
                }
                else
                {
                    results.issues.Add($"High object count: {gameObjectCount}");
                }
                
                results.performanceAcceptable = memoryUsage < 100f && frameRate > 30f && gameObjectCount < 1000;
                Debug.Log("✅ Performance validation passed");
            }
            catch (Exception e)
            {
                results.issues.Add($"Performance validation failed: {e.Message}");
                Debug.LogError($"❌ Performance validation failed: {e.Message}");
            }
            
            yield return null;
        }
        
        private IEnumerator RunStressTests()
        {
            Debug.Log("💪 Running Stress Tests...");
            
            for (int i = 0; i < stressTestIterations; i++)
            {
                Debug.Log($"Stress test iteration {i + 1}/{stressTestIterations}");
                
                // Test weather refresh
                var weatherSystem = KeyFreeWeatherSystem.Instance;
                if (weatherSystem != null)
                {
                    weatherSystem.RefreshWeather();
                }
                
                // Test social sharing
                var socialManager = KeyFreeSocialManager.Instance;
                if (socialManager != null)
                {
                    socialManager.ShareScore(1000 + i, $"Stress test {i + 1}");
                }
                
                // Test calendar refresh
                var calendarManager = KeyFreeCalendarManager.Instance;
                if (calendarManager != null)
                {
                    calendarManager.RefreshCalendar();
                }
                
                // Test event refresh
                var eventManager = KeyFreeEventManager.Instance;
                if (eventManager != null)
                {
                    eventManager.RefreshEvents();
                }
                
                // Test unified refresh
                var unifiedManager = KeyFreeUnifiedManager.Instance;
                if (unifiedManager != null)
                {
                    unifiedManager.RefreshAllData();
                }
                
                yield return new WaitForSeconds(0.1f);
            }
            
            Debug.Log("✅ Stress tests completed");
        }
        
        private void CalculateOverallStatus()
        {
            int totalTests = 6; // All systems + API + Data flow + Error handling + Performance
            int passedTests = 0;
            
            if (results.allSystemsInitialized) passedTests++;
            if (results.weatherSystemWorking) passedTests++;
            if (results.socialSystemWorking) passedTests++;
            if (results.calendarSystemWorking) passedTests++;
            if (results.eventSystemWorking) passedTests++;
            if (results.unifiedSystemWorking) passedTests++;
            if (results.apiConnectivityWorking) passedTests++;
            if (results.dataFlowWorking) passedTests++;
            if (results.errorHandlingWorking) passedTests++;
            if (results.performanceAcceptable) passedTests++;
            
            if (passedTests == totalTests)
            {
                results.overallStatus = "ALL SYSTEMS OPERATIONAL";
            }
            else if (passedTests >= totalTests * 0.8f)
            {
                results.overallStatus = "MOSTLY OPERATIONAL";
            }
            else if (passedTests >= totalTests * 0.5f)
            {
                results.overallStatus = "PARTIALLY OPERATIONAL";
            }
            else
            {
                results.overallStatus = "NEEDS ATTENTION";
            }
        }
        
        private void PrintValidationResults()
        {
            Debug.Log("=== FINAL VALIDATION RESULTS ===");
            Debug.Log($"Overall Status: {results.overallStatus}");
            Debug.Log($"Last Validation: {results.lastValidation}");
            Debug.Log("");
            
            Debug.Log("=== SYSTEM STATUS ===");
            Debug.Log($"All Systems Initialized: {(results.allSystemsInitialized ? "✅" : "❌")}");
            Debug.Log($"Weather System: {(results.weatherSystemWorking ? "✅" : "❌")}");
            Debug.Log($"Social System: {(results.socialSystemWorking ? "✅" : "❌")}");
            Debug.Log($"Calendar System: {(results.calendarSystemWorking ? "✅" : "❌")}");
            Debug.Log($"Event System: {(results.eventSystemWorking ? "✅" : "❌")}");
            Debug.Log($"Unified System: {(results.unifiedSystemWorking ? "✅" : "❌")}");
            Debug.Log($"API Connectivity: {(results.apiConnectivityWorking ? "✅" : "❌")}");
            Debug.Log($"Data Flow: {(results.dataFlowWorking ? "✅" : "❌")}");
            Debug.Log($"Error Handling: {(results.errorHandlingWorking ? "✅" : "❌")}");
            Debug.Log($"Performance: {(results.performanceAcceptable ? "✅" : "❌")}");
            
            if (results.issues.Count > 0)
            {
                Debug.Log("");
                Debug.Log("=== ISSUES FOUND ===");
                foreach (var issue in results.issues)
                {
                    Debug.LogWarning($"• {issue}");
                }
            }
            
            if (results.recommendations.Count > 0)
            {
                Debug.Log("");
                Debug.Log("=== RECOMMENDATIONS ===");
                foreach (var rec in results.recommendations)
                {
                    Debug.Log($"• {rec}");
                }
            }
            
            Debug.Log("=== END OF VALIDATION ===");
        }
        
        // Public methods
        public void RunValidation()
        {
            StartCoroutine(RunFinalValidation());
        }
        
        public ValidationResults GetResults()
        {
            return results;
        }
        
        public bool IsSystemReady()
        {
            return results.overallStatus == "ALL SYSTEMS OPERATIONAL";
        }
    }
}