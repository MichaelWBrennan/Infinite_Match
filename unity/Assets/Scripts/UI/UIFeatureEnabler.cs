using UnityEngine;
using Evergreen.UI;
using Evergreen.HybridGameplay;

namespace Evergreen.UI
{
    /// <summary>
    /// Simple script to enable all UI features on game start
    /// Attach this to any GameObject in your scene to automatically enable all features
    /// </summary>
    public class UIFeatureEnabler : MonoBehaviour
    {
        [Header("Auto-Enable Settings")]
        [SerializeField] private bool enableOnStart = true;
        [SerializeField] private bool enableAllFeatures = true;
        [SerializeField] private bool showDebugInfo = true;
        
        [Header("Feature Flags")]
        [SerializeField] private bool enableRPG = true;
        [SerializeField] private bool enableRacing = true;
        [SerializeField] private bool enableStrategy = true;
        [SerializeField] private bool enableHybridModes = true;
        
        private OptimizedUISystem uiSystem;
        private RoyalMatchUIManager royalMatchUI;
        private HybridGameplayManager hybridManager;
        
        void Start()
        {
            if (enableOnStart)
            {
                EnableFeatures();
            }
        }
        
        /// <summary>
        /// Enable all features and UI elements
        /// </summary>
        public void EnableFeatures()
        {
            Debug.Log("🎮 UIFeatureEnabler: Starting feature enablement...");
            
            // Get UI system (prefer Royal Match UI)
            royalMatchUI = FindObjectOfType<RoyalMatchUIManager>();
            if (royalMatchUI == null)
            {
                uiSystem = FindObjectOfType<OptimizedUISystem>();
                if (uiSystem == null)
                {
                    Debug.LogError("❌ No UI system found! Please add RoyalMatchUIManager or OptimizedUISystem to your scene.");
                    return;
                }
            }
            
            // Get hybrid gameplay manager
            hybridManager = FindObjectOfType<HybridGameplayManager>();
            if (hybridManager == null)
            {
                Debug.LogWarning("⚠️ HybridGameplayManager not found! Some features may not be available.");
            }
            
            // Enable hybrid gameplay features
            if (hybridManager != null && enableAllFeatures)
            {
                hybridManager.EnableFeature(FeatureType.RPG, enableRPG);
                hybridManager.EnableFeature(FeatureType.Racing, enableRacing);
                hybridManager.EnableFeature(FeatureType.Strategy, enableStrategy);
                hybridManager.EnableFeature(FeatureType.HybridModes, enableHybridModes);
                
                Debug.Log($"✅ Hybrid Features Enabled - RPG: {enableRPG}, Racing: {enableRacing}, Strategy: {enableStrategy}, Hybrid: {enableHybridModes}");
            }
            
            // Enable UI system features
            if (royalMatchUI != null)
            {
                royalMatchUI.EnableAllFeatures();
                
                if (showDebugInfo)
                {
                    royalMatchUI.CheckUIStatus();
                }
            }
            else if (uiSystem != null)
            {
                uiSystem.EnableAllFeatures();
                
                if (showDebugInfo)
                {
                    uiSystem.CheckUIStatus();
                }
            }
            
            Debug.Log("🎉 All features enabled successfully!");
        }
        
        /// <summary>
        /// Check current UI status
        /// </summary>
        [ContextMenu("Check UI Status")]
        public void CheckStatus()
        {
            if (royalMatchUI != null)
            {
                royalMatchUI.CheckUIStatus();
            }
            else if (uiSystem != null)
            {
                uiSystem.CheckUIStatus();
            }
            else
            {
                Debug.LogWarning("No UI System found!");
            }
        }
        
        /// <summary>
        /// Force enable all features (useful for testing)
        /// </summary>
        [ContextMenu("Force Enable All Features")]
        public void ForceEnableAll()
        {
            enableAllFeatures = true;
            enableRPG = true;
            enableRacing = true;
            enableStrategy = true;
            enableHybridModes = true;
            EnableFeatures();
        }
    }
}