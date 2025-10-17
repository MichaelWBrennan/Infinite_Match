using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
using Evergreen.Game;
using Evergreen.Social;
using Evergreen.Core;
using Evergreen.Ads;

public class MainMenuUI : MonoBehaviour
{
    [Header("UI References")]
    [SerializeField] private Button startGameButton;
    [SerializeField] private Button chatButton;
    [SerializeField] private Text coinsText;
    [SerializeField] private Text gemsText;
    [SerializeField] private Text energyText;
    
    private UnityAdsManager _adsManager;
    private Canvas _canvas;

    void Start()
    {
        InitializeUI();
        UpdateUI();
    }

    private void InitializeUI()
    {
        // Get canvas reference
        _canvas = GetComponentInParent<Canvas>();
        if (_canvas == null)
        {
            _canvas = FindObjectOfType<Canvas>();
        }

        // Get ads manager from service locator
        _adsManager = OptimizedCoreSystem.Instance.Resolve<UnityAdsManager>();

        // Create chat button if it doesn't exist
        CreateChatButtonIfNeeded();

        // Setup button listeners
        if (startGameButton != null)
        {
            startGameButton.onClick.AddListener(OnStartGame);
        }

        if (chatButton != null)
        {
            chatButton.onClick.AddListener(OnOpenChat);
        }

        // Auto-wire all buttons in scene
        WireAllButtonsInScene();
    }

    private void WireAllButtonsInScene()
    {
        Button[] allButtons = FindObjectsOfType<Button>();
        foreach (Button button in allButtons)
        {
            // Skip if already wired
            if (button.onClick.GetPersistentEventCount() > 0) continue;
            
            string buttonName = button.name.ToLower();
            
            // Wire buttons based on name patterns
            if (buttonName.Contains("play") || buttonName.Contains("start") || buttonName.Contains("game"))
            {
                button.onClick.AddListener(OnStartGame);
            }
            else if (buttonName.Contains("chat"))
            {
                button.onClick.AddListener(OnOpenChat);
            }
            else if (buttonName.Contains("settings"))
            {
                button.onClick.AddListener(() => Evergreen.Core.SceneManager.Instance.OpenSettings());
            }
            else if (buttonName.Contains("shop"))
            {
                button.onClick.AddListener(() => Evergreen.Core.SceneManager.Instance.OpenShop());
            }
            else if (buttonName.Contains("social"))
            {
                button.onClick.AddListener(() => Evergreen.Core.SceneManager.Instance.OpenSocial());
            }
            else if (buttonName.Contains("events"))
            {
                button.onClick.AddListener(() => Evergreen.Core.SceneManager.Instance.OpenEvents());
            }
            else if (buttonName.Contains("collections"))
            {
                button.onClick.AddListener(() => Evergreen.Core.SceneManager.Instance.OpenCollections());
            }
            else if (buttonName.Contains("back") || buttonName.Contains("return") || buttonName.Contains("menu"))
            {
                button.onClick.AddListener(() => Evergreen.Core.SceneManager.Instance.GoToMainMenu());
            }
        }
    }

    private void CreateChatButtonIfNeeded()
    {
        var existing = GameObject.Find("ChatButton");
        if (existing == null && _canvas != null)
        {
            var btnGo = new GameObject("ChatButton");
            btnGo.transform.SetParent(_canvas.transform, false);
            
            var img = btnGo.AddComponent<Image>();
            img.color = new Color(0.2f, 0.5f, 1f, 0.85f);
            
            var btn = btnGo.AddComponent<Button>();
            var rt = btnGo.GetComponent<RectTransform>();
            rt.anchorMin = new Vector2(0.85f, 0.9f);
            rt.anchorMax = new Vector2(0.98f, 0.98f);
            rt.offsetMin = rt.offsetMax = Vector2.zero;
            
            // Label
            var textGo = new GameObject("Text");
            textGo.transform.SetParent(btnGo.transform, false);
            var txt = textGo.AddComponent<Text>();
            txt.text = "Chat";
            txt.alignment = TextAnchor.MiddleCenter;
            txt.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
            txt.color = Color.white;
            
            var trt = textGo.GetComponent<RectTransform>();
            trt.anchorMin = Vector2.zero;
            trt.anchorMax = Vector2.one;
            trt.offsetMin = trt.offsetMax = Vector2.zero;
            
            btn.onClick.AddListener(OnOpenChat);
        }
    }

    public void OnStartGame()
    {
        try
        {
            if (!GameState.ConsumeEnergy(1))
            {
                // Show rewarded ad for energy
                if (_adsManager != null)
                {
                    _adsManager.ShowRewarded(() => 
                    {
                        GameState.AddCoins(5);
                        UpdateUI();
                        Logger.Info("Player watched ad for coins", "MainMenu");
                    });
                }
                else
                {
                    Logger.Warning("Ads manager not available", "MainMenu");
                }
                return;
            }

            Logger.Info("Starting game", "MainMenu");
            SceneManager.LoadScene("Gameplay");
        }
        catch (System.Exception e)
        {
            Logger.LogException(e, "MainMenu");
        }
    }

    public static void Show()
    {
        SceneManager.LoadScene("MainMenu");
    }

    public void OnOpenChat()
    {
        try
        {
            TeamChatUIFactory.Show();
            Logger.Info("Opened team chat", "MainMenu");
        }
        catch (System.Exception e)
        {
            Logger.LogException(e, "MainMenu");
        }
    }

    private void UpdateUI()
    {
        if (coinsText != null)
        {
            coinsText.text = $"Coins: {GameState.Coins}";
        }

        if (gemsText != null)
        {
            gemsText.text = $"Gems: {GameState.Gems}";
        }

        if (energyText != null)
        {
            energyText.text = $"Energy: {GameState.EnergyCurrent}/{GameState.EnergyMax}";
        }
    }

    void Update()
    {
        // Update UI periodically
        if (Time.frameCount % 60 == 0) // Update every 60 frames
        {
            UpdateUI();
        }
    }

    void OnDestroy()
    {
        // Clean up button listeners
        if (startGameButton != null)
        {
            startGameButton.onClick.RemoveListener(OnStartGame);
        }

        if (chatButton != null)
        {
            chatButton.onClick.RemoveListener(OnOpenChat);
        }
    }
}
