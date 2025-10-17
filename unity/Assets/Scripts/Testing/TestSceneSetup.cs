using UnityEngine;
using Evergreen.Weather;
using Evergreen.Social;
using Evergreen.Realtime;

namespace Evergreen.Testing
{
    /// <summary>
    /// Sets up test scene with all key-free systems
    /// </summary>
    public class TestSceneSetup : MonoBehaviour
    {
        [Header("System Configuration")]
        [SerializeField] private bool createWeatherSystem = true;
        [SerializeField] private bool createSocialSystem = true;
        [SerializeField] private bool createCalendarSystem = true;
        [SerializeField] private bool createEventSystem = true;
        [SerializeField] private bool createUnifiedSystem = true;
        
        [Header("Test Configuration")]
        [SerializeField] private bool runTestsOnStart = true;
        [SerializeField] private bool enableDetailedLogging = true;
        
        void Start()
        {
            Debug.Log("🔧 Setting up Key-Free Systems Test Scene...");
            
            // Create all systems
            CreateSystems();
            
            // Run tests if enabled
            if (runTestsOnStart)
            {
                var tester = GetComponent<SimpleSystemTester>();
                if (tester == null)
                {
                    tester = gameObject.AddComponent<SimpleSystemTester>();
                }
            }
            
            Debug.Log("✅ Test Scene Setup Complete!");
        }
        
        private void CreateSystems()
        {
            // Create Weather System
            if (createWeatherSystem)
            {
                CreateWeatherSystem();
            }
            
            // Create Social System
            if (createSocialSystem)
            {
                CreateSocialSystem();
            }
            
            // Create Calendar System
            if (createCalendarSystem)
            {
                CreateCalendarSystem();
            }
            
            // Create Event System
            if (createEventSystem)
            {
                CreateEventSystem();
            }
            
            // Create Unified System
            if (createUnifiedSystem)
            {
                CreateUnifiedSystem();
            }
        }
        
        private void CreateWeatherSystem()
        {
            try
            {
                var weatherSystem = KeyFreeWeatherSystem.Instance;
                if (weatherSystem == null)
                {
                    var weatherGO = new GameObject("WeatherSystem");
                    weatherSystem = weatherGO.AddComponent<KeyFreeWeatherSystem>();
                    Debug.Log("✅ Weather System created");
                }
                else
                {
                    Debug.Log("✅ Weather System already exists");
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Failed to create Weather System: {e.Message}");
            }
        }
        
        private void CreateSocialSystem()
        {
            try
            {
                var socialManager = KeyFreeSocialManager.Instance;
                if (socialManager == null)
                {
                    var socialGO = new GameObject("SocialManager");
                    socialManager = socialGO.AddComponent<KeyFreeSocialManager>();
                    Debug.Log("✅ Social System created");
                }
                else
                {
                    Debug.Log("✅ Social System already exists");
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Failed to create Social System: {e.Message}");
            }
        }
        
        private void CreateCalendarSystem()
        {
            try
            {
                var calendarManager = KeyFreeCalendarManager.Instance;
                if (calendarManager == null)
                {
                    var calendarGO = new GameObject("CalendarManager");
                    calendarManager = calendarGO.AddComponent<KeyFreeCalendarManager>();
                    Debug.Log("✅ Calendar System created");
                }
                else
                {
                    Debug.Log("✅ Calendar System already exists");
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Failed to create Calendar System: {e.Message}");
            }
        }
        
        private void CreateEventSystem()
        {
            try
            {
                var eventManager = KeyFreeEventManager.Instance;
                if (eventManager == null)
                {
                    var eventGO = new GameObject("EventManager");
                    eventManager = eventGO.AddComponent<KeyFreeEventManager>();
                    Debug.Log("✅ Event System created");
                }
                else
                {
                    Debug.Log("✅ Event System already exists");
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Failed to create Event System: {e.Message}");
            }
        }
        
        private void CreateUnifiedSystem()
        {
            try
            {
                var unifiedManager = KeyFreeUnifiedManager.Instance;
                if (unifiedManager == null)
                {
                    var unifiedGO = new GameObject("UnifiedManager");
                    unifiedManager = unifiedGO.AddComponent<KeyFreeUnifiedManager>();
                    Debug.Log("✅ Unified System created");
                }
                else
                {
                    Debug.Log("✅ Unified System already exists");
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Failed to create Unified System: {e.Message}");
            }
        }
        
        // Public methods for manual testing
        public void CreateAllSystems()
        {
            CreateSystems();
        }
        
        public void TestAllSystems()
        {
            var tester = GetComponent<SimpleSystemTester>();
            if (tester == null)
            {
                tester = gameObject.AddComponent<SimpleSystemTester>();
            }
            tester.RunAllTests();
        }
        
        public void TestWeatherSystem()
        {
            var tester = GetComponent<SimpleSystemTester>();
            if (tester == null)
            {
                tester = gameObject.AddComponent<SimpleSystemTester>();
            }
            tester.RunWeatherTest();
        }
        
        public void TestSocialSystem()
        {
            var tester = GetComponent<SimpleSystemTester>();
            if (tester == null)
            {
                tester = gameObject.AddComponent<SimpleSystemTester>();
            }
            tester.RunSocialTest();
        }
        
        public void TestCalendarSystem()
        {
            var tester = GetComponent<SimpleSystemTester>();
            if (tester == null)
            {
                tester = gameObject.AddComponent<SimpleSystemTester>();
            }
            tester.RunCalendarTest();
        }
        
        public void TestEventSystem()
        {
            var tester = GetComponent<SimpleSystemTester>();
            if (tester == null)
            {
                tester = gameObject.AddComponent<SimpleSystemTester>();
            }
            tester.RunEventTest();
        }
        
        public void TestUnifiedSystem()
        {
            var tester = GetComponent<SimpleSystemTester>();
            if (tester == null)
            {
                tester = gameObject.AddComponent<SimpleSystemTester>();
            }
            tester.RunUnifiedTest();
        }
    }
}