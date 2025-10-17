using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;
using Evergreen.UI;
using Evergreen.Testing;

namespace Evergreen.UI
{
    /// <summary>
    /// Scene Button Auto Fixer - Automatically fixes all buttons when scene loads
    /// This is a simple component that can be added to any scene to ensure buttons work
    /// </summary>
    public class SceneButtonAutoFixer : MonoBehaviour
    {
        [Header("Auto Fix Settings")]
        public bool fixOnStart = true;
        public bool fixOnAwake = false;
        public float fixDelay = 0.1f;
        public bool showDebugLogs = true;
        public bool verifyAfterFix = true;
        
        [Header("Scene Info")]
        public string sceneName;
        
        private void Awake()
        {
            if (string.IsNullOrEmpty(sceneName))
            {
                sceneName = SceneManager.GetActiveScene().name;
            }
            
            if (fixOnAwake)
            {
                FixAllButtons();
            }
        }
        
        private void Start()
        {
            if (fixOnStart)
            {
                if (fixDelay > 0)
                {
                    Invoke(nameof(FixAllButtons), fixDelay);
                }
                else
                {
                    FixAllButtons();
                }
            }
        }
        
        public void FixAllButtons()
        {
            if (showDebugLogs)
            {
                Debug.Log($"🔧 Auto-fixing buttons in scene: {sceneName}");
            }
            
            // Find all buttons in the scene
            Button[] allButtons = FindObjectsOfType<Button>();
            
            if (showDebugLogs)
            {
                Debug.Log($"Found {allButtons.Length} buttons to fix");
            }
            
            // Create or get button manager
            UniversalButtonManager buttonManager = UniversalButtonManager.Instance;
            if (buttonManager == null)
            {
                GameObject managerObj = new GameObject("UniversalButtonManager");
                buttonManager = managerObj.AddComponent<UniversalButtonManager>();
                DontDestroyOnLoad(managerObj);
            }
            
            // Fix each button
            int fixedCount = 0;
            int failedCount = 0;
            
            foreach (Button button in allButtons)
            {
                try
                {
                    // Clear existing listeners
                    button.onClick.RemoveAllListeners();
                    
                    // Wire the button
                    buttonManager.WireButton(button);
                    
                    // Check if button is now functional
                    if (IsButtonFunctional(button))
                    {
                        fixedCount++;
                        if (showDebugLogs)
                        {
                            Debug.Log($"✅ Fixed button: {button.name}");
                        }
                    }
                    else
                    {
                        failedCount++;
                        Debug.LogWarning($"❌ Failed to fix button: {button.name}");
                    }
                }
                catch (System.Exception e)
                {
                    failedCount++;
                    Debug.LogError($"❌ Error fixing button {button.name}: {e.Message}");
                }
            }
            
            if (showDebugLogs)
            {
                Debug.Log($"🔧 Auto-fix complete: {fixedCount} fixed, {failedCount} failed");
            }
            
            // Verify buttons if requested
            if (verifyAfterFix)
            {
                VerifyButtons();
            }
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
        
        private void VerifyButtons()
        {
            ButtonVerificationSystem verifier = FindObjectOfType<ButtonVerificationSystem>();
            if (verifier == null)
            {
                GameObject verifierObj = new GameObject("ButtonVerificationSystem");
                verifier = verifierObj.AddComponent<ButtonVerificationSystem>();
            }
            
            verifier.VerifyAllButtonsInScene();
        }
        
        public void ManualFix()
        {
            FixAllButtons();
        }
        
        public void ManualVerify()
        {
            VerifyButtons();
        }
        
        // Public method to be called from other scripts
        public static void FixSceneButtons()
        {
            SceneButtonAutoFixer fixer = FindObjectOfType<SceneButtonAutoFixer>();
            if (fixer != null)
            {
                fixer.FixAllButtons();
            }
            else
            {
                Debug.LogWarning("No SceneButtonAutoFixer found in current scene");
            }
        }
        
        // Public method to verify scene buttons
        public static void VerifySceneButtons()
        {
            SceneButtonAutoFixer fixer = FindObjectOfType<SceneButtonAutoFixer>();
            if (fixer != null)
            {
                fixer.VerifyButtons();
            }
            else
            {
                Debug.LogWarning("No SceneButtonAutoFixer found in current scene");
            }
        }
    }
}