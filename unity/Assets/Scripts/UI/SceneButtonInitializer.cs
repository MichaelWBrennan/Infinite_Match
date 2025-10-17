using UnityEngine;
using UnityEngine.SceneManagement;
using Evergreen.UI;

namespace Evergreen.UI
{
    /// <summary>
    /// Scene Button Initializer - Automatically wires buttons when scenes load
    /// Attach this to a GameObject in each scene to ensure buttons are functional
    /// </summary>
    public class SceneButtonInitializer : MonoBehaviour
    {
        [Header("Initialization Settings")]
        public bool initializeOnStart = true;
        public bool initializeOnAwake = false;
        public float initializationDelay = 0.1f;
        public bool showDebugLogs = true;
        
        [Header("Scene-Specific Buttons")]
        public Button[] additionalButtons;
        
        private UniversalButtonManager _buttonManager;
        
        void Awake()
        {
            if (initializeOnAwake)
            {
                InitializeButtons();
            }
        }
        
        void Start()
        {
            if (initializeOnStart)
            {
                if (initializationDelay > 0)
                {
                    Invoke(nameof(InitializeButtons), initializationDelay);
                }
                else
                {
                    InitializeButtons();
                }
            }
        }
        
        private void InitializeButtons()
        {
            // Get or create the universal button manager
            _buttonManager = UniversalButtonManager.Instance;
            if (_buttonManager == null)
            {
                GameObject managerObj = new GameObject("UniversalButtonManager");
                _buttonManager = managerObj.AddComponent<UniversalButtonManager>();
                DontDestroyOnLoad(managerObj);
            }
            
            // Wire all buttons in the scene
            _buttonManager.WireAllButtonsInScene();
            
            // Wire any additional buttons specified in the inspector
            if (additionalButtons != null)
            {
                foreach (Button button in additionalButtons)
                {
                    if (button != null)
                    {
                        _buttonManager.WireButton(button);
                    }
                }
            }
            
            if (showDebugLogs)
            {
                Debug.Log($"Scene Button Initializer: Wired all buttons in scene '{SceneManager.GetActiveScene().name}'");
            }
        }
        
        public void ManualInitialize()
        {
            InitializeButtons();
        }
        
        public void AddButton(Button button)
        {
            if (button != null && _buttonManager != null)
            {
                _buttonManager.WireButton(button);
            }
        }
        
        public void RefreshButtons()
        {
            InitializeButtons();
        }
    }
}