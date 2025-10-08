using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Evergreen.Core;
using Evergreen.Economy;
using Evergreen.Analytics;
using Evergreen.Authentication;
using Evergreen.CloudCode;
using System.Threading.Tasks;

namespace Evergreen.Testing
{
    /// <summary>
    /// Test script to verify local services work without Unity Services
    /// </summary>
    public class LocalServicesTest : MonoBehaviour
    {
        [Header("Test Settings")]
        [SerializeField] private bool runTestsOnStart = true;
        [SerializeField] private bool enableDebugLogs = true;
        [SerializeField] private float testDelay = 1f;
        
        private LocalServicesManager _servicesManager;
        private bool _testsCompleted = false;
        
        void Start()
        {
            if (runTestsOnStart)
            {
                StartCoroutine(RunTests());
            }
        }
        
        private IEnumerator RunTests()
        {
            yield return new WaitForSeconds(testDelay);
            
            Log("=== Starting Local Services Tests ===");
            
            // Test 1: Initialize Local Services Manager
            yield return StartCoroutine(TestLocalServicesManager());
            
            // Test 2: Test Authentication
            yield return StartCoroutine(TestAuthentication());
            
            // Test 3: Test Economy
            yield return StartCoroutine(TestEconomy());
            
            // Test 4: Test Analytics
            yield return StartCoroutine(TestAnalytics());
            
            // Test 5: Test Cloud Code
            yield return StartCoroutine(TestCloudCode());
            
            // Test 6: Test Integration
            yield return StartCoroutine(TestIntegration());
            
            _testsCompleted = true;
            Log("=== All Tests Completed ===");
        }
        
        private IEnumerator TestLocalServicesManager()
        {
            Log("Testing Local Services Manager...");
            
            _servicesManager = FindObjectOfType<LocalServicesManager>();
            if (_servicesManager == null)
            {
                var go = new GameObject("LocalServicesManager");
                _servicesManager = go.AddComponent<LocalServicesManager>();
            }
            
            // Wait for initialization
            float timeout = 10f;
            float elapsed = 0f;
            while (!_servicesManager.IsInitialized && elapsed < timeout)
            {
                elapsed += Time.deltaTime;
                yield return null;
            }
            
            if (_servicesManager.IsInitialized)
            {
                Log("✅ Local Services Manager initialized successfully");
                _servicesManager.LogServicesStatus();
            }
            else
            {
                Log("❌ Local Services Manager failed to initialize");
            }
        }
        
        private IEnumerator TestAuthentication()
        {
            Log("Testing Authentication Service...");
            
            var authManager = _servicesManager?.GetService<LocalAuthenticationManager>();
            if (authManager == null)
            {
                Log("❌ Authentication Manager not found");
                yield break;
            }
            
            // Test anonymous sign-in
            var signInTask = authManager.SignInAnonymously();
            yield return new WaitUntil(() => signInTask.IsCompleted);
            
            if (authManager.IsAuthenticated)
            {
                Log($"✅ Authentication successful - Player ID: {authManager.PlayerId}");
                Log($"   Player Name: {authManager.PlayerName}");
            }
            else
            {
                Log("❌ Authentication failed");
            }
        }
        
        private IEnumerator TestEconomy()
        {
            Log("Testing Economy Service...");
            
            var economyManager = _servicesManager?.GetService<RuntimeEconomyManager>();
            if (economyManager == null)
            {
                Log("❌ Economy Manager not found");
                yield break;
            }
            
            // Test getting balances
            int coins = economyManager.GetPlayerBalance("coins");
            int gems = economyManager.GetPlayerBalance("gems");
            int energy = economyManager.GetPlayerBalance("energy");
            
            Log($"✅ Economy Service working - Coins: {coins}, Gems: {gems}, Energy: {energy}");
            
            // Test adding currency
            var addTask = economyManager.AddCurrency("coins", 100);
            yield return new WaitUntil(() => addTask.IsCompleted);
            
            if (addTask.Result)
            {
                int newCoins = economyManager.GetPlayerBalance("coins");
                Log($"✅ Added 100 coins - New balance: {newCoins}");
            }
            else
            {
                Log("❌ Failed to add currency");
            }
        }
        
        private IEnumerator TestAnalytics()
        {
            Log("Testing Analytics Service...");
            
            var analyticsManager = _servicesManager?.GetService<LocalAnalyticsManager>();
            if (analyticsManager == null)
            {
                Log("❌ Analytics Manager not found");
                yield break;
            }
            
            // Test tracking events
            analyticsManager.TrackEvent("test_event", new Dictionary<string, object>
            {
                {"test_param", "test_value"},
                {"test_number", 42}
            });
            
            analyticsManager.TrackLevelStart(1, "test");
            analyticsManager.TrackLevelComplete(1, 1000, 3, 10, 30f);
            
            Log("✅ Analytics Service working - Events tracked");
        }
        
        private IEnumerator TestCloudCode()
        {
            Log("Testing Cloud Code Service...");
            
            var cloudCodeManager = _servicesManager?.GetService<LocalCloudCodeManager>();
            if (cloudCodeManager == null)
            {
                Log("❌ Cloud Code Manager not found");
                yield break;
            }
            
            // Test calling a function
            var callTask = cloudCodeManager.CallFunction("GetPlayerData", new Dictionary<string, object>());
            yield return new WaitUntil(() => callTask.IsCompleted);
            
            var result = callTask.Result;
            if (result.success)
            {
                Log("✅ Cloud Code Service working - Function executed successfully");
                Log($"   Execution time: {result.executionTimeMs}ms");
            }
            else
            {
                Log($"❌ Cloud Code function failed: {result.errorMessage}");
            }
            
            // Test available functions
            var functions = cloudCodeManager.GetAvailableFunctions();
            Log($"   Available functions: {string.Join(", ", functions)}");
        }
        
        private IEnumerator TestIntegration()
        {
            Log("Testing Service Integration...");
            
            // Test that all services work together
            var authManager = _servicesManager?.GetService<LocalAuthenticationManager>();
            var economyManager = _servicesManager?.GetService<RuntimeEconomyManager>();
            var analyticsManager = _servicesManager?.GetService<LocalAnalyticsManager>();
            var cloudCodeManager = _servicesManager?.GetService<LocalCloudCodeManager>();
            
            bool allServicesReady = authManager != null && economyManager != null && 
                                  analyticsManager != null && cloudCodeManager != null;
            
            if (allServicesReady)
            {
                Log("✅ All services integrated successfully");
                
                // Test a complete workflow
                analyticsManager.TrackEvent("integration_test", new Dictionary<string, object>
                {
                    {"player_id", authManager.PlayerId},
                    {"coins_balance", economyManager.GetPlayerBalance("coins")}
                });
                
                var callTask = cloudCodeManager.CallFunction("TrackEvent", new Dictionary<string, object>
                {
                    {"eventName", "cloud_code_integration_test"},
                    {"test_data", "integration_successful"}
                });
                
                yield return new WaitUntil(() => callTask.IsCompleted);
                
                if (callTask.Result.success)
                {
                    Log("✅ Complete integration test successful");
                }
                else
                {
                    Log("❌ Integration test failed");
                }
            }
            else
            {
                Log("❌ Not all services are ready");
            }
        }
        
        private void Log(string message)
        {
            if (enableDebugLogs)
            {
                Debug.Log($"[LocalServicesTest] {message}");
            }
        }
        
        void OnGUI()
        {
            if (!_testsCompleted) return;
            
            GUILayout.BeginArea(new Rect(10, 10, 300, 200));
            GUILayout.Label("Local Services Test Results", GUI.skin.box);
            
            if (_servicesManager != null)
            {
                var status = _servicesManager.GetServicesStatus();
                GUILayout.Label($"Initialized: {status["is_initialized"]}");
                GUILayout.Label($"All Services Ready: {status["all_services_ready"]}");
                
                var services = status["services"] as Dictionary<string, object>;
                if (services != null)
                {
                    foreach (var service in services)
                    {
                        GUILayout.Label($"{service.Key}: {(service.Value ? "Ready" : "Not Ready")}");
                    }
                }
            }
            
            GUILayout.EndArea();
        }
    }
}