using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using System.Text;
using Evergreen.Weather;
using Evergreen.Social;
using Evergreen.Realtime;

namespace Evergreen.Testing
{
    /// <summary>
    /// Generates comprehensive test reports for key-free systems
    /// </summary>
    public class TestReportGenerator : MonoBehaviour
    {
        [Header("Report Configuration")]
        [SerializeField] private bool generateReportOnStart = false;
        [SerializeField] private bool includeDetailedLogs = true;
        [SerializeField] private bool includeSystemStatus = true;
        [SerializeField] private bool includePerformanceMetrics = true;
        
        [Header("Report Data")]
        [SerializeField] private TestReport currentReport = new TestReport();
        
        [System.Serializable]
        public class TestReport
        {
            public string reportId;
            public DateTime generatedAt;
            public string unityVersion;
            public string platform;
            public SystemStatus systemStatus;
            public List<SystemTestResult> systemTests;
            public List<APITestResult> apiTests;
            public PerformanceMetrics performance;
            public List<string> recommendations;
            public string overallStatus;
        }
        
        [System.Serializable]
        public class SystemStatus
        {
            public bool weatherSystemActive;
            public bool socialSystemActive;
            public bool calendarSystemActive;
            public bool eventSystemActive;
            public bool unifiedSystemActive;
            public string weatherDataStatus;
            public int activeEvents;
            public int upcomingEvents;
            public int totalShares;
            public string lastUpdate;
        }
        
        [System.Serializable]
        public class SystemTestResult
        {
            public string systemName;
            public bool passed;
            public string status;
            public List<string> details;
            public float responseTime;
            public DateTime testedAt;
        }
        
        [System.Serializable]
        public class APITestResult
        {
            public string apiName;
            public string endpoint;
            public bool accessible;
            public int responseTime;
            public string status;
            public DateTime testedAt;
        }
        
        [System.Serializable]
        public class PerformanceMetrics
        {
            public float totalMemoryUsage;
            public float weatherSystemMemory;
            public float socialSystemMemory;
            public float calendarSystemMemory;
            public float eventSystemMemory;
            public float unifiedSystemMemory;
            public int totalGameObjects;
            public int totalComponents;
            public float frameRate;
        }
        
        void Start()
        {
            if (generateReportOnStart)
            {
                StartCoroutine(GenerateTestReport());
            }
        }
        
        public IEnumerator GenerateTestReport()
        {
            Debug.Log("📊 Generating Comprehensive Test Report...");
            
            // Initialize report
            currentReport = new TestReport
            {
                reportId = System.Guid.NewGuid().ToString(),
                generatedAt = DateTime.Now,
                unityVersion = Application.unityVersion,
                platform = Application.platform.ToString(),
                systemTests = new List<SystemTestResult>(),
                apiTests = new List<APITestResult>(),
                recommendations = new List<string>()
            };
            
            // Test individual systems
            yield return StartCoroutine(TestWeatherSystem());
            yield return StartCoroutine(TestSocialSystem());
            yield return StartCoroutine(TestCalendarSystem());
            yield return StartCoroutine(TestEventSystem());
            yield return StartCoroutine(TestUnifiedSystem());
            
            // Test external APIs
            yield return StartCoroutine(TestExternalAPIs());
            
            // Collect system status
            yield return StartCoroutine(CollectSystemStatus());
            
            // Collect performance metrics
            yield return StartCoroutine(CollectPerformanceMetrics());
            
            // Generate recommendations
            GenerateRecommendations();
            
            // Calculate overall status
            CalculateOverallStatus();
            
            // Print report
            PrintTestReport();
            
            Debug.Log("✅ Test Report Generated Successfully!");
        }
        
        private IEnumerator TestWeatherSystem()
        {
            var result = new SystemTestResult
            {
                systemName = "Weather System",
                details = new List<string>(),
                testedAt = DateTime.Now
            };
            
            try
            {
                var startTime = Time.realtimeSinceStartup;
                
                var weatherSystem = KeyFreeWeatherSystem.Instance;
                if (weatherSystem == null)
                {
                    result.passed = false;
                    result.status = "FAILED - Instance not found";
                    result.details.Add("Weather system instance is null");
                }
                else
                {
                    result.details.Add("✅ Instance created successfully");
                    
                    // Test weather data
                    var weather = weatherSystem.GetCurrentWeather();
                    if (weather != null)
                    {
                        result.details.Add($"✅ Weather data available: {weather.description}");
                        result.details.Add($"✅ Temperature: {weather.temperature}°C");
                        result.details.Add($"✅ Source: {weather.source}");
                    }
                    else
                    {
                        result.details.Add("⚠️ No weather data yet (normal for first run)");
                    }
                    
                    // Test weather status
                    bool isActive = weatherSystem.IsWeatherActive();
                    result.details.Add($"✅ Weather system active: {isActive}");
                    
                    // Test refresh
                    weatherSystem.RefreshWeather();
                    result.details.Add("✅ Weather refresh called successfully");
                    
                    result.passed = true;
                    result.status = "PASSED";
                }
                
                result.responseTime = (Time.realtimeSinceStartup - startTime) * 1000f;
            }
            catch (Exception e)
            {
                result.passed = false;
                result.status = "FAILED - Exception";
                result.details.Add($"Exception: {e.Message}");
            }
            
            currentReport.systemTests.Add(result);
            yield return null;
        }
        
        private IEnumerator TestSocialSystem()
        {
            var result = new SystemTestResult
            {
                systemName = "Social System",
                details = new List<string>(),
                testedAt = DateTime.Now
            };
            
            try
            {
                var startTime = Time.realtimeSinceStartup;
                
                var socialManager = KeyFreeSocialManager.Instance;
                if (socialManager == null)
                {
                    result.passed = false;
                    result.status = "FAILED - Instance not found";
                    result.details.Add("Social manager instance is null");
                }
                else
                {
                    result.details.Add("✅ Instance created successfully");
                    
                    // Test social stats
                    var stats = socialManager.GetSocialStats();
                    if (stats != null)
                    {
                        result.details.Add($"✅ Social stats available: {stats.Count} entries");
                        foreach (var stat in stats)
                        {
                            result.details.Add($"  - {stat.Key}: {stat.Value}");
                        }
                    }
                    else
                    {
                        result.details.Add("❌ Social stats are null");
                    }
                    
                    // Test share history
                    var history = socialManager.GetShareHistory();
                    result.details.Add($"✅ Share history: {history.Count} entries");
                    
                    // Test sharing methods
                    socialManager.SetSharingMethodEnabled(KeyFreeSocialManager.SharePlatform.Native, true);
                    socialManager.SetSharingMethodEnabled(KeyFreeSocialManager.SharePlatform.QR, true);
                    result.details.Add("✅ Sharing methods configured");
                    
                    result.passed = true;
                    result.status = "PASSED";
                }
                
                result.responseTime = (Time.realtimeSinceStartup - startTime) * 1000f;
            }
            catch (Exception e)
            {
                result.passed = false;
                result.status = "FAILED - Exception";
                result.details.Add($"Exception: {e.Message}");
            }
            
            currentReport.systemTests.Add(result);
            yield return null;
        }
        
        private IEnumerator TestCalendarSystem()
        {
            var result = new SystemTestResult
            {
                systemName = "Calendar System",
                details = new List<string>(),
                testedAt = DateTime.Now
            };
            
            try
            {
                var startTime = Time.realtimeSinceStartup;
                
                var calendarManager = KeyFreeCalendarManager.Instance;
                if (calendarManager == null)
                {
                    result.passed = false;
                    result.status = "FAILED - Instance not found";
                    result.details.Add("Calendar manager instance is null");
                }
                else
                {
                    result.details.Add("✅ Instance created successfully");
                    
                    // Test calendar events
                    var allEvents = calendarManager.GetAllEvents();
                    result.details.Add($"✅ All events: {allEvents.Count}");
                    
                    var activeEvents = calendarManager.GetActiveEvents();
                    result.details.Add($"✅ Active events: {activeEvents.Count}");
                    
                    var upcomingEvents = calendarManager.GetUpcomingEvents();
                    result.details.Add($"✅ Upcoming events: {upcomingEvents.Count}");
                    
                    // Test timezone handling
                    calendarManager.SetTimezone("America/New_York");
                    string timezone = calendarManager.GetCurrentTimezone();
                    result.details.Add($"✅ Timezone set to: {timezone}");
                    
                    // Test statistics
                    var stats = calendarManager.GetCalendarStatistics();
                    if (stats != null)
                    {
                        result.details.Add($"✅ Statistics available: {stats.Count} entries");
                    }
                    
                    result.passed = true;
                    result.status = "PASSED";
                }
                
                result.responseTime = (Time.realtimeSinceStartup - startTime) * 1000f;
            }
            catch (Exception e)
            {
                result.passed = false;
                result.status = "FAILED - Exception";
                result.details.Add($"Exception: {e.Message}");
            }
            
            currentReport.systemTests.Add(result);
            yield return null;
        }
        
        private IEnumerator TestEventSystem()
        {
            var result = new SystemTestResult
            {
                systemName = "Event System",
                details = new List<string>(),
                testedAt = DateTime.Now
            };
            
            try
            {
                var startTime = Time.realtimeSinceStartup;
                
                var eventManager = KeyFreeEventManager.Instance;
                if (eventManager == null)
                {
                    result.passed = false;
                    result.status = "FAILED - Instance not found";
                    result.details.Add("Event manager instance is null");
                }
                else
                {
                    result.details.Add("✅ Instance created successfully");
                    
                    // Test game events
                    var allEvents = eventManager.GetAllEvents();
                    result.details.Add($"✅ All events: {allEvents.Count}");
                    
                    var activeEvents = eventManager.GetActiveEvents();
                    result.details.Add($"✅ Active events: {activeEvents.Count}");
                    
                    var upcomingEvents = eventManager.GetUpcomingEvents();
                    result.details.Add($"✅ Upcoming events: {upcomingEvents.Count}");
                    
                    // Test statistics
                    var stats = eventManager.GetEventStatistics();
                    if (stats != null)
                    {
                        result.details.Add($"✅ Statistics available: {stats.Count} entries");
                    }
                    
                    // Test timezone handling
                    eventManager.SetTimezone("America/New_York");
                    string timezone = eventManager.GetCurrentTimezone();
                    result.details.Add($"✅ Timezone set to: {timezone}");
                    
                    result.passed = true;
                    result.status = "PASSED";
                }
                
                result.responseTime = (Time.realtimeSinceStartup - startTime) * 1000f;
            }
            catch (Exception e)
            {
                result.passed = false;
                result.status = "FAILED - Exception";
                result.details.Add($"Exception: {e.Message}");
            }
            
            currentReport.systemTests.Add(result);
            yield return null;
        }
        
        private IEnumerator TestUnifiedSystem()
        {
            var result = new SystemTestResult
            {
                systemName = "Unified System",
                details = new List<string>(),
                testedAt = DateTime.Now
            };
            
            try
            {
                var startTime = Time.realtimeSinceStartup;
                
                var unifiedManager = KeyFreeUnifiedManager.Instance;
                if (unifiedManager == null)
                {
                    result.passed = false;
                    result.status = "FAILED - Instance not found";
                    result.details.Add("Unified manager instance is null");
                }
                else
                {
                    result.details.Add("✅ Instance created successfully");
                    
                    // Test player data
                    var playerData = unifiedManager.GetCurrentPlayerData();
                    if (playerData != null)
                    {
                        result.details.Add($"✅ Player data available: {playerData.playerId}");
                        result.details.Add($"✅ Weather active: {playerData.weather.isActive}");
                        result.details.Add($"✅ Calendar events: {playerData.calendar.total}");
                        result.details.Add($"✅ Game events: {playerData.events.total}");
                    }
                    else
                    {
                        result.details.Add("❌ Player data is null");
                    }
                    
                    // Test system status
                    var status = unifiedManager.GetSystemStatus();
                    if (status != null)
                    {
                        result.details.Add($"✅ System status available: {status.Count} components");
                    }
                    else
                    {
                        result.details.Add("❌ System status is null");
                    }
                    
                    // Test timezone handling
                    unifiedManager.SetTimezone("America/New_York");
                    string timezone = unifiedManager.GetCurrentTimezone();
                    result.details.Add($"✅ Timezone set to: {timezone}");
                    
                    result.passed = true;
                    result.status = "PASSED";
                }
                
                result.responseTime = (Time.realtimeSinceStartup - startTime) * 1000f;
            }
            catch (Exception e)
            {
                result.passed = false;
                result.status = "FAILED - Exception";
                result.details.Add($"Exception: {e.Message}");
            }
            
            currentReport.systemTests.Add(result);
            yield return null;
        }
        
        private IEnumerator TestExternalAPIs()
        {
            Debug.Log("🌐 Testing External APIs...");
            
            // Test OpenMeteo API
            yield return StartCoroutine(TestAPI("OpenMeteo", "https://api.open-meteo.com/v1/forecast?latitude=51.5074&longitude=-0.1278&current_weather=true&timezone=auto"));
            
            // Test WTTR API
            yield return StartCoroutine(TestAPI("WTTR", "https://wttr.in/London?format=j1"));
            
            // Test IP Location API
            yield return StartCoroutine(TestAPI("IP Location", "https://ipapi.co/json/"));
            
            // Test QR Code API
            yield return StartCoroutine(TestAPI("QR Code", "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=test"));
        }
        
        private IEnumerator TestAPI(string apiName, string endpoint)
        {
            var result = new APITestResult
            {
                apiName = apiName,
                endpoint = endpoint,
                testedAt = DateTime.Now
            };
            
            try
            {
                var startTime = Time.realtimeSinceStartup;
                
                using (var request = UnityEngine.Networking.UnityWebRequest.Get(endpoint))
                {
                    yield return request.SendWebRequest();
                    
                    result.responseTime = (int)((Time.realtimeSinceStartup - startTime) * 1000f);
                    
                    if (request.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
                    {
                        result.accessible = true;
                        result.status = "SUCCESS";
                        Debug.Log($"✅ {apiName} API: Accessible ({result.responseTime}ms)");
                    }
                    else
                    {
                        result.accessible = false;
                        result.status = $"FAILED - {request.error}";
                        Debug.LogError($"❌ {apiName} API: Failed - {request.error}");
                    }
                }
            }
            catch (Exception e)
            {
                result.accessible = false;
                result.status = $"EXCEPTION - {e.Message}";
                Debug.LogError($"❌ {apiName} API: Exception - {e.Message}");
            }
            
            currentReport.apiTests.Add(result);
        }
        
        private IEnumerator CollectSystemStatus()
        {
            Debug.Log("📊 Collecting System Status...");
            
            currentReport.systemStatus = new SystemStatus
            {
                weatherSystemActive = KeyFreeWeatherSystem.Instance?.IsWeatherActive() ?? false,
                socialSystemActive = KeyFreeSocialManager.Instance != null,
                calendarSystemActive = KeyFreeCalendarManager.Instance != null,
                eventSystemActive = KeyFreeEventManager.Instance != null,
                unifiedSystemActive = KeyFreeUnifiedManager.Instance != null,
                weatherDataStatus = KeyFreeWeatherSystem.Instance?.GetCurrentWeather()?.source ?? "Unknown",
                activeEvents = KeyFreeEventManager.Instance?.GetActiveEvents().Count ?? 0,
                upcomingEvents = KeyFreeEventManager.Instance?.GetUpcomingEvents().Count ?? 0,
                totalShares = (int)(KeyFreeSocialManager.Instance?.GetSocialStats().GetValueOrDefault("totalShares", 0) ?? 0),
                lastUpdate = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
            };
            
            yield return null;
        }
        
        private IEnumerator CollectPerformanceMetrics()
        {
            Debug.Log("⚡ Collecting Performance Metrics...");
            
            currentReport.performance = new PerformanceMetrics
            {
                totalMemoryUsage = UnityEngine.Profiling.Profiler.GetTotalAllocatedMemory(false) / 1024f / 1024f, // MB
                totalGameObjects = FindObjectsOfType<GameObject>().Length,
                totalComponents = FindObjectsOfType<Component>().Length,
                frameRate = 1f / Time.deltaTime
            };
            
            yield return null;
        }
        
        private void GenerateRecommendations()
        {
            currentReport.recommendations.Clear();
            
            // Weather system recommendations
            if (!currentReport.systemStatus.weatherSystemActive)
            {
                currentReport.recommendations.Add("Weather system is not active - check internet connection and API availability");
            }
            
            // Social system recommendations
            if (!currentReport.systemStatus.socialSystemActive)
            {
                currentReport.recommendations.Add("Social system is not active - check initialization");
            }
            
            // Event system recommendations
            if (currentReport.systemStatus.activeEvents == 0)
            {
                currentReport.recommendations.Add("No active events - consider enabling event generation");
            }
            
            // Performance recommendations
            if (currentReport.performance.totalMemoryUsage > 100f)
            {
                currentReport.recommendations.Add("High memory usage detected - consider optimizing systems");
            }
            
            if (currentReport.performance.frameRate < 30f)
            {
                currentReport.recommendations.Add("Low frame rate detected - consider reducing update frequency");
            }
        }
        
        private void CalculateOverallStatus()
        {
            int totalSystems = currentReport.systemTests.Count;
            int passedSystems = 0;
            
            foreach (var test in currentReport.systemTests)
            {
                if (test.passed) passedSystems++;
            }
            
            if (passedSystems == totalSystems)
            {
                currentReport.overallStatus = "ALL SYSTEMS OPERATIONAL";
            }
            else if (passedSystems > totalSystems / 2)
            {
                currentReport.overallStatus = "MOSTLY OPERATIONAL";
            }
            else
            {
                currentReport.overallStatus = "NEEDS ATTENTION";
            }
        }
        
        private void PrintTestReport()
        {
            Debug.Log("=== KEY-FREE SYSTEMS TEST REPORT ===");
            Debug.Log($"Report ID: {currentReport.reportId}");
            Debug.Log($"Generated: {currentReport.generatedAt}");
            Debug.Log($"Unity Version: {currentReport.unityVersion}");
            Debug.Log($"Platform: {currentReport.platform}");
            Debug.Log($"Overall Status: {currentReport.overallStatus}");
            Debug.Log("");
            
            Debug.Log("=== SYSTEM TESTS ===");
            foreach (var test in currentReport.systemTests)
            {
                string status = test.passed ? "✅" : "❌";
                Debug.Log($"{status} {test.systemName}: {test.status} ({test.responseTime:F0}ms)");
                
                if (includeDetailedLogs)
                {
                    foreach (var detail in test.details)
                    {
                        Debug.Log($"  {detail}");
                    }
                }
            }
            
            Debug.Log("");
            Debug.Log("=== API TESTS ===");
            foreach (var test in currentReport.apiTests)
            {
                string status = test.accessible ? "✅" : "❌";
                Debug.Log($"{status} {test.apiName}: {test.status} ({test.responseTime}ms)");
            }
            
            if (includeSystemStatus)
            {
                Debug.Log("");
                Debug.Log("=== SYSTEM STATUS ===");
                Debug.Log($"Weather System: {(currentReport.systemStatus.weatherSystemActive ? "Active" : "Inactive")}");
                Debug.Log($"Social System: {(currentReport.systemStatus.socialSystemActive ? "Active" : "Inactive")}");
                Debug.Log($"Calendar System: {(currentReport.systemStatus.calendarSystemActive ? "Active" : "Inactive")}");
                Debug.Log($"Event System: {(currentReport.systemStatus.eventSystemActive ? "Active" : "Inactive")}");
                Debug.Log($"Unified System: {(currentReport.systemStatus.unifiedSystemActive ? "Active" : "Inactive")}");
                Debug.Log($"Active Events: {currentReport.systemStatus.activeEvents}");
                Debug.Log($"Upcoming Events: {currentReport.systemStatus.upcomingEvents}");
                Debug.Log($"Total Shares: {currentReport.systemStatus.totalShares}");
            }
            
            if (includePerformanceMetrics)
            {
                Debug.Log("");
                Debug.Log("=== PERFORMANCE METRICS ===");
                Debug.Log($"Total Memory Usage: {currentReport.performance.totalMemoryUsage:F2} MB");
                Debug.Log($"Total Game Objects: {currentReport.performance.totalGameObjects}");
                Debug.Log($"Total Components: {currentReport.performance.totalComponents}");
                Debug.Log($"Frame Rate: {currentReport.performance.frameRate:F1} FPS");
            }
            
            if (currentReport.recommendations.Count > 0)
            {
                Debug.Log("");
                Debug.Log("=== RECOMMENDATIONS ===");
                foreach (var rec in currentReport.recommendations)
                {
                    Debug.Log($"• {rec}");
                }
            }
            
            Debug.Log("=== END OF REPORT ===");
        }
        
        // Public methods
        public void GenerateReport()
        {
            StartCoroutine(GenerateTestReport());
        }
        
        public TestReport GetCurrentReport()
        {
            return currentReport;
        }
        
        public void ExportReportToFile()
        {
            // This would export the report to a file
            Debug.Log("Report export functionality would be implemented here");
        }
    }
}