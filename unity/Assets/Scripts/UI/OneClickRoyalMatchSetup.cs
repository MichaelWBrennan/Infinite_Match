using UnityEngine;
using Evergreen.UI;

namespace Evergreen.UI
{
    /// <summary>
    /// One-Click Royal Match Setup
    /// Simply add this to any GameObject and it will set up everything automatically
    /// </summary>
    public class OneClickRoyalMatchSetup : MonoBehaviour
    {
        [Header("One-Click Setup")]
        [SerializeField] private bool setupOnStart = true;
        [SerializeField] private bool showDebugInfo = true;
        
        void Start()
        {
            if (setupOnStart)
            {
                SetupRoyalMatch();
            }
        }
        
        [ContextMenu("Setup Royal Match UI")]
        public void SetupRoyalMatch()
        {
            Debug.Log("👑 Starting One-Click Royal Match Setup...");
            
            // Create the scene setup component
            var sceneSetup = gameObject.AddComponent<RoyalMatchSceneSetup>();
            
            // Configure it
            sceneSetup.setupOnStart = false; // We're doing it manually
            sceneSetup.enableAllFeatures = true;
            sceneSetup.showDebugInfo = showDebugInfo;
            sceneSetup.createUIPanels = true;
            sceneSetup.applyRoyalMatchStyling = true;
            sceneSetup.setupButtonAnimations = true;
            
            // Start the setup
            sceneSetup.SetupRoyalMatchSceneManual();
            
            Debug.Log("✅ One-Click Royal Match Setup Complete!");
            Debug.Log("🎮 Your Royal Match UI is now ready to use!");
        }
    }
}