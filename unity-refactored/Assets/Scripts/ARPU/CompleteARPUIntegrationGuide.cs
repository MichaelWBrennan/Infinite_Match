using UnityEngine;
using Evergreen.ARPU;

namespace Evergreen.ARPU
{
    /// <summary>
    /// Complete ARPU Integration Guide - Step-by-step integration instructions
    /// This component provides in-editor guidance for integrating ARPU systems
    /// </summary>
    public class CompleteARPUIntegrationGuide : MonoBehaviour
    {
        [Header("Integration Status")]
        public bool isARPUInitialized = false;
        public bool isARPUIntegrated = false;
        public bool isARPUUICreated = false;
        public bool isARPUConfigured = false;
        
        [Header("Integration Steps")]
        public bool step1_AddInitializer = false;
        public bool step2_ConfigureSettings = false;
        public bool step3_IntegrateSystems = false;
        public bool step4_CreateUI = false;
        public bool step5_TestSystems = false;
        public bool step6_MonitorARPU = false;
        
        [Header("Configuration")]
        public CompleteARPUConfig arpuConfig;
        public bool autoDetectIntegration = true;
        public bool showIntegrationHelp = true;
        
        private CompleteARPUInitializer _initializer;
        private CompleteARPUIntegration _integration;
        private CompleteARPUManager _arpuManager;
        private CompleteARPUUI _arpuUI;
        
        void Start()
        {
            if (autoDetectIntegration)
            {
                DetectIntegrationStatus();
            }
            
            if (showIntegrationHelp)
            {
                ShowIntegrationHelp();
            }
        }
        
        private void DetectIntegrationStatus()
        {
            // Check if ARPU systems are initialized
            _initializer = FindObjectOfType<CompleteARPUInitializer>();
            isARPUInitialized = _initializer != null && _initializer.IsInitialized();
            
            // Check if ARPU systems are integrated
            _integration = FindObjectOfType<CompleteARPUIntegration>();
            isARPUIntegrated = _integration != null && _integration.IsIntegrated();
            
            // Check if ARPU UI is created
            _arpuUI = FindObjectOfType<CompleteARPUUI>();
            isARPUUICreated = _arpuUI != null;
            
            // Check if ARPU is configured
            isARPUConfigured = arpuConfig != null;
            
            // Check integration steps
            step1_AddInitializer = _initializer != null;
            step2_ConfigureSettings = arpuConfig != null;
            step3_IntegrateSystems = _integration != null;
            step4_CreateUI = _arpuUI != null;
            step5_TestSystems = isARPUInitialized && isARPUIntegrated;
            step6_MonitorARPU = step5_TestSystems;
        }
        
        private void ShowIntegrationHelp()
        {
            Debug.Log("=== Complete ARPU Integration Guide ===");
            Debug.Log("Follow these steps to integrate ARPU systems:");
            Debug.Log("");
            Debug.Log("Step 1: Add CompleteARPUInitializer to your main scene");
            Debug.Log("Step 2: Create and configure CompleteARPUConfig asset");
            Debug.Log("Step 3: Add CompleteARPUIntegration to integrate with existing systems");
            Debug.Log("Step 4: Create CompleteARPUUI for ARPU features");
            Debug.Log("Step 5: Test all ARPU systems");
            Debug.Log("Step 6: Monitor ARPU metrics and optimize");
            Debug.Log("");
            Debug.Log("For detailed instructions, see the integration guide in the project root.");
        }
        
        // Public Methods for Integration
        
        [ContextMenu("Step 1: Add ARPU Initializer")]
        public void AddARPUInitializer()
        {
            if (_initializer == null)
            {
                var initializerGO = new GameObject("CompleteARPUInitializer");
                _initializer = initializerGO.AddComponent<CompleteARPUInitializer>();
                step1_AddInitializer = true;
                Debug.Log("✅ Step 1 Complete: ARPU Initializer added");
            }
            else
            {
                Debug.Log("⚠️ Step 1 Already Complete: ARPU Initializer already exists");
            }
        }
        
        [ContextMenu("Step 2: Create ARPU Config")]
        public void CreateARPUConfig()
        {
            if (arpuConfig == null)
            {
                arpuConfig = ScriptableObject.CreateInstance<CompleteARPUConfig>();
                step2_ConfigureSettings = true;
                Debug.Log("✅ Step 2 Complete: ARPU Config created");
            }
            else
            {
                Debug.Log("⚠️ Step 2 Already Complete: ARPU Config already exists");
            }
        }
        
        [ContextMenu("Step 3: Add ARPU Integration")]
        public void AddARPUIntegration()
        {
            if (_integration == null)
            {
                var integrationGO = new GameObject("CompleteARPUIntegration");
                _integration = integrationGO.AddComponent<CompleteARPUIntegration>();
                step3_IntegrateSystems = true;
                Debug.Log("✅ Step 3 Complete: ARPU Integration added");
            }
            else
            {
                Debug.Log("⚠️ Step 3 Already Complete: ARPU Integration already exists");
            }
        }
        
        [ContextMenu("Step 4: Create ARPU UI")]
        public void CreateARPUUI()
        {
            if (_arpuUI == null)
            {
                var uiGO = new GameObject("CompleteARPUUI");
                _arpuUI = uiGO.AddComponent<CompleteARPUUI>();
                step4_CreateUI = true;
                Debug.Log("✅ Step 4 Complete: ARPU UI created");
            }
            else
            {
                Debug.Log("⚠️ Step 4 Already Complete: ARPU UI already exists");
            }
        }
        
        [ContextMenu("Step 5: Test ARPU Systems")]
        public void TestARPUSystems()
        {
            if (_initializer != null && _integration != null)
            {
                _initializer.ForceInitialize();
                _integration.ForceIntegrate();
                
                _arpuManager = _initializer.GetARPUManager();
                if (_arpuManager != null)
                {
                    step5_TestSystems = true;
                    step6_MonitorARPU = true;
                    Debug.Log("✅ Step 5 Complete: ARPU Systems tested and working");
                }
                else
                {
                    Debug.LogError("❌ Step 5 Failed: ARPU Manager not found");
                }
            }
            else
            {
                Debug.LogError("❌ Step 5 Failed: ARPU Initializer or Integration not found");
            }
        }
        
        [ContextMenu("Step 6: Monitor ARPU")]
        public void MonitorARPU()
        {
            if (_arpuManager != null)
            {
                var report = _arpuManager.GetARPUReport();
                var status = _arpuManager.GetSystemStatus();
                
                Debug.Log("=== ARPU Monitoring Report ===");
                Debug.Log($"Total Players: {report.GetValueOrDefault("total_players", 0)}");
                Debug.Log($"Total Revenue: ${report.GetValueOrDefault("total_revenue", 0f):F2}");
                Debug.Log($"ARPU: ${report.GetValueOrDefault("arpu", 0f):F2}");
                Debug.Log($"Conversion Rate: {report.GetValueOrDefault("conversion_rate", 0f):F1}%");
                Debug.Log("");
                Debug.Log("=== System Status ===");
                foreach (var kvp in status)
                {
                    Debug.Log($"{kvp.Key}: {kvp.Value}");
                }
                
                step6_MonitorARPU = true;
                Debug.Log("✅ Step 6 Complete: ARPU monitoring active");
            }
            else
            {
                Debug.LogError("❌ Step 6 Failed: ARPU Manager not found");
            }
        }
        
        [ContextMenu("Complete Integration")]
        public void CompleteIntegration()
        {
            AddARPUInitializer();
            CreateARPUConfig();
            AddARPUIntegration();
            CreateARPUUI();
            TestARPUSystems();
            MonitorARPU();
            
            Debug.Log("🎉 Complete ARPU Integration Finished!");
            Debug.Log("All ARPU systems are now active and ready to maximize revenue!");
        }
        
        [ContextMenu("Show Integration Status")]
        public void ShowIntegrationStatus()
        {
            DetectIntegrationStatus();
            
            Debug.Log("=== ARPU Integration Status ===");
            Debug.Log($"Step 1 - Add Initializer: {(step1_AddInitializer ? "✅" : "❌")}");
            Debug.Log($"Step 2 - Configure Settings: {(step2_ConfigureSettings ? "✅" : "❌")}");
            Debug.Log($"Step 3 - Integrate Systems: {(step3_IntegrateSystems ? "✅" : "❌")}");
            Debug.Log($"Step 4 - Create UI: {(step4_CreateUI ? "✅" : "❌")}");
            Debug.Log($"Step 5 - Test Systems: {(step5_TestSystems ? "✅" : "❌")}");
            Debug.Log($"Step 6 - Monitor ARPU: {(step6_MonitorARPU ? "✅" : "❌")}");
            Debug.Log("");
            Debug.Log($"Overall Status: {(step6_MonitorARPU ? "🎉 Complete" : "⚠️ Incomplete")}");
        }
        
        [ContextMenu("Reset Integration")]
        public void ResetIntegration()
        {
            // Reset all steps
            step1_AddInitializer = false;
            step2_ConfigureSettings = false;
            step3_IntegrateSystems = false;
            step4_CreateUI = false;
            step5_TestSystems = false;
            step6_MonitorARPU = false;
            
            // Reset status
            isARPUInitialized = false;
            isARPUIntegrated = false;
            isARPUUICreated = false;
            isARPUConfigured = false;
            
            Debug.Log("🔄 ARPU Integration reset. Run 'Complete Integration' to start over.");
        }
        
        // Helper Methods
        
        public bool IsIntegrationComplete()
        {
            return step1_AddInitializer && step2_ConfigureSettings && step3_IntegrateSystems && 
                   step4_CreateUI && step5_TestSystems && step6_MonitorARPU;
        }
        
        public int GetCompletionPercentage()
        {
            int completedSteps = 0;
            if (step1_AddInitializer) completedSteps++;
            if (step2_ConfigureSettings) completedSteps++;
            if (step3_IntegrateSystems) completedSteps++;
            if (step4_CreateUI) completedSteps++;
            if (step5_TestSystems) completedSteps++;
            if (step6_MonitorARPU) completedSteps++;
            
            return (completedSteps * 100) / 6;
        }
        
        public string GetNextStep()
        {
            if (!step1_AddInitializer) return "Step 1: Add ARPU Initializer";
            if (!step2_ConfigureSettings) return "Step 2: Create ARPU Config";
            if (!step3_IntegrateSystems) return "Step 3: Add ARPU Integration";
            if (!step4_CreateUI) return "Step 4: Create ARPU UI";
            if (!step5_TestSystems) return "Step 5: Test ARPU Systems";
            if (!step6_MonitorARPU) return "Step 6: Monitor ARPU";
            return "Integration Complete!";
        }
        
        // Editor Helpers
        
        #if UNITY_EDITOR
        [ContextMenu("Open Integration Guide")]
        public void OpenIntegrationGuide()
        {
            string guidePath = "Assets/ARPU_INTEGRATION.md";
            if (System.IO.File.Exists(guidePath))
            {
                UnityEditor.AssetDatabase.OpenAsset(UnityEditor.AssetDatabase.LoadAssetAtPath<UnityEngine.Object>(guidePath));
            }
            else
            {
                Debug.Log("Integration guide not found. Check the project root for ARPU_INTEGRATION.md");
            }
        }
        
        [ContextMenu("Create ARPU Config Asset")]
        public void CreateARPUConfigAsset()
        {
            if (arpuConfig == null)
            {
                arpuConfig = ScriptableObject.CreateInstance<CompleteARPUConfig>();
                string path = "Assets/ARPUConfig.asset";
                UnityEditor.AssetDatabase.CreateAsset(arpuConfig, path);
                UnityEditor.AssetDatabase.SaveAssets();
                UnityEditor.AssetDatabase.Refresh();
                Debug.Log($"✅ ARPU Config asset created at {path}");
            }
            else
            {
                Debug.Log("⚠️ ARPU Config already exists");
            }
        }
        #endif
    }
}