using UnityEngine;
using UnityEngine.UI;
using Evergreen.Core;

namespace Evergreen.UI
{
    /// <summary>
    /// Simple button initializer that wires up buttons when scene loads
    /// Add this component to any scene to ensure buttons are functional
    /// </summary>
    public class ButtonInitializer : MonoBehaviour
    {
        [Header("Settings")]
        public bool wireOnStart = true;
        public bool wireOnAwake = false;
        public float wireDelay = 0.1f;
        
        void Awake()
        {
            if (wireOnAwake)
            {
                WireAllButtons();
            }
        }
        
        void Start()
        {
            if (wireOnStart)
            {
                if (wireDelay > 0)
                {
                    Invoke(nameof(WireAllButtons), wireDelay);
                }
                else
                {
                    WireAllButtons();
                }
            }
        }
        
        public void WireAllButtons()
        {
            Button[] allButtons = FindObjectsOfType<Button>();
            int wiredCount = 0;
            
            foreach (Button button in allButtons)
            {
                // Skip if already wired
                if (button.onClick.GetPersistentEventCount() > 0) continue;
                
                string buttonName = button.name.ToLower();
                
                // Wire buttons based on name patterns
                if (buttonName.Contains("play") || buttonName.Contains("start") || buttonName.Contains("game"))
                {
                    button.onClick.AddListener(() => SceneManager.Instance.StartGameplay());
                    wiredCount++;
                }
                else if (buttonName.Contains("main") || buttonName.Contains("menu"))
                {
                    button.onClick.AddListener(() => SceneManager.Instance.GoToMainMenu());
                    wiredCount++;
                }
                else if (buttonName.Contains("settings"))
                {
                    button.onClick.AddListener(() => SceneManager.Instance.OpenSettings());
                    wiredCount++;
                }
                else if (buttonName.Contains("shop"))
                {
                    button.onClick.AddListener(() => SceneManager.Instance.OpenShop());
                    wiredCount++;
                }
                else if (buttonName.Contains("social") || buttonName.Contains("leaderboard") || buttonName.Contains("friends"))
                {
                    button.onClick.AddListener(() => SceneManager.Instance.OpenSocial());
                    wiredCount++;
                }
                else if (buttonName.Contains("event") || buttonName.Contains("daily") || buttonName.Contains("tournament"))
                {
                    button.onClick.AddListener(() => SceneManager.Instance.OpenEvents());
                    wiredCount++;
                }
                else if (buttonName.Contains("achievement") || buttonName.Contains("reward"))
                {
                    button.onClick.AddListener(() => SceneManager.Instance.OpenCollections());
                    wiredCount++;
                }
                else if (buttonName.Contains("back") || buttonName.Contains("return"))
                {
                    button.onClick.AddListener(() => SceneManager.Instance.GoToMainMenu());
                    wiredCount++;
                }
                else if (buttonName.Contains("pause"))
                {
                    button.onClick.AddListener(() => {
                        // Pause game logic here
                        Debug.Log("Game paused");
                    });
                    wiredCount++;
                }
                else if (buttonName.Contains("resume"))
                {
                    button.onClick.AddListener(() => {
                        // Resume game logic here
                        Debug.Log("Game resumed");
                    });
                    wiredCount++;
                }
                else if (buttonName.Contains("restart"))
                {
                    button.onClick.AddListener(() => SceneManager.Instance.ReloadCurrentScene());
                    wiredCount++;
                }
            }
            
            Debug.Log($"ButtonInitializer: Wired {wiredCount} buttons in scene {UnityEngine.SceneManagement.SceneManager.GetActiveScene().name}");
        }
        
        [ContextMenu("Wire All Buttons")]
        public void WireAllButtonsManual()
        {
            WireAllButtons();
        }
    }
}