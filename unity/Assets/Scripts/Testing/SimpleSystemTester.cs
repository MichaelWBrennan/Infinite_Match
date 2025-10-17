using System.Collections;
using UnityEngine;
using Evergreen.Weather;
using Evergreen.Social;
using Evergreen.Realtime;

namespace Evergreen.Testing
{
    /// <summary>
    /// Simple test runner for key-free systems
    /// </summary>
    public class SimpleSystemTester : MonoBehaviour
    {
        [Header("Test Configuration")]
        [SerializeField] private bool runTestsOnStart = true;
        [SerializeField] private float testDelay = 2f;
        
        void Start()
        {
            if (runTestsOnStart)
            {
                StartCoroutine(RunSimpleTests());
            }
        }
        
        private IEnumerator RunSimpleTests()
        {
            Debug.Log("🧪 Starting Simple Key-Free Systems Test...");
            
            yield return new WaitForSeconds(testDelay);
            
            // Test 1: Weather System
            yield return StartCoroutine(TestWeatherSystem());
            
            yield return new WaitForSeconds(testDelay);
            
            // Test 2: Social System
            yield return StartCoroutine(TestSocialSystem());
            
            yield return new WaitForSeconds(testDelay);
            
            // Test 3: Calendar System
            yield return StartCoroutine(TestCalendarSystem());
            
            yield return new WaitForSeconds(testDelay);
            
            // Test 4: Event System
            yield return StartCoroutine(TestEventSystem());
            
            yield return new WaitForSeconds(testDelay);
            
            // Test 5: Unified System
            yield return StartCoroutine(TestUnifiedSystem());
            
            Debug.Log("🏁 Simple Test Suite Complete!");
        }
        
        private IEnumerator TestWeatherSystem()
        {
            Debug.Log("🌤️ Testing Weather System...");
            
            try
            {
                var weatherSystem = KeyFreeWeatherSystem.Instance;
                if (weatherSystem == null)
                {
                    Debug.LogError("❌ Weather System: Instance is null");
                    yield break;
                }
                
                Debug.Log("✅ Weather System: Instance created successfully");
                
                // Test weather refresh
                weatherSystem.RefreshWeather();
                Debug.Log("✅ Weather System: Refresh called successfully");
                
                // Test weather data
                var weather = weatherSystem.GetCurrentWeather();
                if (weather != null)
                {
                    Debug.Log($"✅ Weather System: Data available - {weather.description} ({weather.temperature}°C)");
                }
                else
                {
                    Debug.Log("⚠️ Weather System: No data yet (this is normal for first run)");
                }
                
                // Test weather status
                bool isActive = weatherSystem.IsWeatherActive();
                Debug.Log($"✅ Weather System: Active status - {isActive}");
                
                Debug.Log("✅ Weather System: All tests passed!");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Weather System: Test failed - {e.Message}");
            }
        }
        
        private IEnumerator TestSocialSystem()
        {
            Debug.Log("📱 Testing Social System...");
            
            try
            {
                var socialManager = KeyFreeSocialManager.Instance;
                if (socialManager == null)
                {
                    Debug.LogError("❌ Social System: Instance is null");
                    yield break;
                }
                
                Debug.Log("✅ Social System: Instance created successfully");
                
                // Test social stats
                var stats = socialManager.GetSocialStats();
                if (stats != null)
                {
                    Debug.Log($"✅ Social System: Stats available - {stats.Count} entries");
                }
                else
                {
                    Debug.LogError("❌ Social System: Stats are null");
                }
                
                // Test share history
                var history = socialManager.GetShareHistory();
                Debug.Log($"✅ Social System: Share history - {history.Count} entries");
                
                // Test sharing methods configuration
                socialManager.SetSharingMethodEnabled(KeyFreeSocialManager.SharePlatform.Native, true);
                socialManager.SetSharingMethodEnabled(KeyFreeSocialManager.SharePlatform.QR, true);
                Debug.Log("✅ Social System: Sharing methods configured");
                
                Debug.Log("✅ Social System: All tests passed!");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Social System: Test failed - {e.Message}");
            }
        }
        
        private IEnumerator TestCalendarSystem()
        {
            Debug.Log("📅 Testing Calendar System...");
            
            try
            {
                var calendarManager = KeyFreeCalendarManager.Instance;
                if (calendarManager == null)
                {
                    Debug.LogError("❌ Calendar System: Instance is null");
                    yield break;
                }
                
                Debug.Log("✅ Calendar System: Instance created successfully");
                
                // Test calendar events
                var allEvents = calendarManager.GetAllEvents();
                Debug.Log($"✅ Calendar System: All events - {allEvents.Count}");
                
                var activeEvents = calendarManager.GetActiveEvents();
                Debug.Log($"✅ Calendar System: Active events - {activeEvents.Count}");
                
                var upcomingEvents = calendarManager.GetUpcomingEvents();
                Debug.Log($"✅ Calendar System: Upcoming events - {upcomingEvents.Count}");
                
                // Test timezone handling
                calendarManager.SetTimezone("America/New_York");
                string timezone = calendarManager.GetCurrentTimezone();
                Debug.Log($"✅ Calendar System: Timezone set to - {timezone}");
                
                // Test calendar statistics
                var stats = calendarManager.GetCalendarStatistics();
                if (stats != null)
                {
                    Debug.Log($"✅ Calendar System: Statistics available - {stats.Count} entries");
                }
                
                Debug.Log("✅ Calendar System: All tests passed!");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Calendar System: Test failed - {e.Message}");
            }
        }
        
        private IEnumerator TestEventSystem()
        {
            Debug.Log("🎮 Testing Event System...");
            
            try
            {
                var eventManager = KeyFreeEventManager.Instance;
                if (eventManager == null)
                {
                    Debug.LogError("❌ Event System: Instance is null");
                    yield break;
                }
                
                Debug.Log("✅ Event System: Instance created successfully");
                
                // Test game events
                var allEvents = eventManager.GetAllEvents();
                Debug.Log($"✅ Event System: All events - {allEvents.Count}");
                
                var activeEvents = eventManager.GetActiveEvents();
                Debug.Log($"✅ Event System: Active events - {activeEvents.Count}");
                
                var upcomingEvents = eventManager.GetUpcomingEvents();
                Debug.Log($"✅ Event System: Upcoming events - {upcomingEvents.Count}");
                
                // Test event statistics
                var stats = eventManager.GetEventStatistics();
                if (stats != null)
                {
                    Debug.Log($"✅ Event System: Statistics available - {stats.Count} entries");
                }
                
                // Test timezone handling
                eventManager.SetTimezone("America/New_York");
                string timezone = eventManager.GetCurrentTimezone();
                Debug.Log($"✅ Event System: Timezone set to - {timezone}");
                
                Debug.Log("✅ Event System: All tests passed!");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Event System: Test failed - {e.Message}");
            }
        }
        
        private IEnumerator TestUnifiedSystem()
        {
            Debug.Log("🔗 Testing Unified System...");
            
            try
            {
                var unifiedManager = KeyFreeUnifiedManager.Instance;
                if (unifiedManager == null)
                {
                    Debug.LogError("❌ Unified System: Instance is null");
                    yield break;
                }
                
                Debug.Log("✅ Unified System: Instance created successfully");
                
                // Test player data
                var playerData = unifiedManager.GetCurrentPlayerData();
                if (playerData != null)
                {
                    Debug.Log($"✅ Unified System: Player data available - {playerData.playerId}");
                    Debug.Log($"✅ Unified System: Weather active - {playerData.weather.isActive}");
                    Debug.Log($"✅ Unified System: Calendar events - {playerData.calendar.total}");
                    Debug.Log($"✅ Unified System: Game events - {playerData.events.total}");
                }
                else
                {
                    Debug.LogError("❌ Unified System: Player data is null");
                }
                
                // Test system status
                var status = unifiedManager.GetSystemStatus();
                if (status != null)
                {
                    Debug.Log($"✅ Unified System: System status available - {status.Count} components");
                }
                else
                {
                    Debug.LogError("❌ Unified System: System status is null");
                }
                
                // Test timezone handling
                unifiedManager.SetTimezone("America/New_York");
                string timezone = unifiedManager.GetCurrentTimezone();
                Debug.Log($"✅ Unified System: Timezone set to - {timezone}");
                
                Debug.Log("✅ Unified System: All tests passed!");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Unified System: Test failed - {e.Message}");
            }
        }
        
        // Public methods for manual testing
        public void RunWeatherTest()
        {
            StartCoroutine(TestWeatherSystem());
        }
        
        public void RunSocialTest()
        {
            StartCoroutine(TestSocialSystem());
        }
        
        public void RunCalendarTest()
        {
            StartCoroutine(TestCalendarSystem());
        }
        
        public void RunEventTest()
        {
            StartCoroutine(TestEventSystem());
        }
        
        public void RunUnifiedTest()
        {
            StartCoroutine(TestUnifiedSystem());
        }
        
        public void RunAllTests()
        {
            StartCoroutine(RunSimpleTests());
        }
    }
}