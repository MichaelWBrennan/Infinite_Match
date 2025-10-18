using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
using Evergreen.Game;
using Evergreen.Social;
using Evergreen.Core;
using Evergreen.Ads;

public class OptimizedMainMenuUI : MonoBehaviour
{
    [Header("UI References")]
    [SerializeField] private Button startGameButton;
    [SerializeField] private Button chatButton;
    [SerializeField] private Button playButton;
    [SerializeField] private Button settingsButton;
    [SerializeField] private Button shopButton;
    [SerializeField] private Button socialButton;
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

        if (playButton != null)
        {
            playButton.onClick.AddListener(OnStartGame);
        }

        if (chatButton != null)
        {
            chatButton.onClick.AddListener(OnOpenChat);
        }

        if (settingsButton != null)
        {
            settingsButton.onClick.AddListener(OnOpenSettings);
        }

        if (shopButton != null)
        {
            shopButton.onClick.AddListener(OnOpenShop);
        }

        if (socialButton != null)
        {
            socialButton.onClick.AddListener(OnOpenSocial);
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

    public void OnOpenSettings()
    {
        try
        {
            Evergreen.Core.SceneManager.Instance.OpenSettings();
            Logger.Info("Opening settings", "MainMenu");
        }
        catch (System.Exception e)
        {
            Logger.LogException(e, "MainMenu");
        }
    }

    public void OnOpenShop()
    {
        try
        {
            Evergreen.Core.SceneManager.Instance.OpenShop();
            Logger.Info("Opening shop", "MainMenu");
        }
        catch (System.Exception e)
        {
            Logger.LogException(e, "MainMenu");
        }
    }

    public void OnOpenSocial()
    {
        try
        {
            Evergreen.Core.SceneManager.Instance.OpenSocial();
            Logger.Info("Opening social", "MainMenu");
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

        if (playButton != null)
        {
            playButton.onClick.RemoveListener(OnStartGame);
        }

        if (chatButton != null)
        {
            chatButton.onClick.RemoveListener(OnOpenChat);
        }

        if (settingsButton != null)
        {
            settingsButton.onClick.RemoveListener(OnOpenSettings);
        }

        if (shopButton != null)
        {
            shopButton.onClick.RemoveListener(OnOpenShop);
        }

        if (socialButton != null)
        {
            socialButton.onClick.RemoveListener(OnOpenSocial);
        }
    }
}
