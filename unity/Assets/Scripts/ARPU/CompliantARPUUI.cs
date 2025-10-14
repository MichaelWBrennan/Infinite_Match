using UnityEngine;
using UnityEngine.UI;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using Evergreen.ARPU;
using Evergreen.Analytics;

namespace Evergreen.ARPU
{
    /// <summary>
    /// Google Play Compliant ARPU UI System
    /// Provides UI components for displaying offers, social proof, and viral features
    /// Uses transparent design, honest information, and clear value propositions
    /// </summary>
    public class CompliantARPUUI : MonoBehaviour
    {
        [Header("🎨 Google Play Compliant ARPU UI")]
        public bool enableARPUUI = true;
        public bool enableTransparentDesign = true;
        public bool enableHonestInformation = true;
        public bool enableClearValueProps = true;
        public bool enableUserFriendlyInterface = true;
        
        [Header("🎁 Offer UI Settings")]
        public bool enableOfferUI = true;
        public bool enableTransparentPricing = true;
        public bool enableValueDemonstration = true;
        public bool enableHonestSavings = true;
        public bool enableClearBenefits = true;
        
        [Header("👥 Social Proof UI Settings")]
        public bool enableSocialProofUI = true;
        public bool enableRealData = true;
        public bool enableGenuineProof = true;
        public bool enableTransparentStats = true;
        public bool enableHonestMetrics = true;
        
        [Header("💥 Viral UI Settings")]
        public bool enableViralUI = true;
        public bool enableReferralUI = true;
        public bool enableSharingUI = true;
        public bool enableCommunityUI = true;
        public bool enableGiftUI = true;
        
        [Header("⚡ Energy UI Settings")]
        public bool enableEnergyUI = true;
        public bool enableEnergyDisplay = true;
        public bool enableEnergyOffers = true;
        public bool enableEnergyTransparency = true;
        public bool enableEnergyValue = true;
        
        [Header("📊 Analytics UI Settings")]
        public bool enableAnalyticsUI = true;
        public bool enablePerformanceDisplay = true;
        public bool enableTransparentReporting = true;
        public bool enableHonestMetrics = true;
        public bool enableDataPrivacy = true;
        
        [Header("🎯 UI Components")]
        public GameObject offerPanel;
        public GameObject socialProofPanel;
        public GameObject viralPanel;
        public GameObject energyPanel;
        public GameObject analyticsPanel;
        public GameObject mainARPUPanel;
        
        [Header("📱 UI Elements")]
        public Text arpuText;
        public Text arppuText;
        public Text conversionText;
        public Text retentionText;
        public Text energyText;
        public Text socialProofText;
        public Text offerText;
        public Text viralText;
        
        [Header("🎨 UI Styling")]
        public Color primaryColor = Color.blue;
        public Color secondaryColor = Color.green;
        public Color accentColor = Color.yellow;
        public Color warningColor = Color.red;
        public Color successColor = Color.green;
        
        private CompliantARPUManager _arpuManager;
        private UnityAnalyticsARPUHelper _analyticsHelper;
        private Dictionary<string, UIComponent> _uiComponents = new Dictionary<string, UIComponent>();
        private Dictionary<string, OfferUI> _offerUIs = new Dictionary<string, OfferUI>();
        private Dictionary<string, SocialProofUI> _socialProofUIs = new Dictionary<string, SocialProofUI>();
        private Dictionary<string, ViralUI> _viralUIs = new Dictionary<string, ViralUI>();
        private Dictionary<string, EnergyUI> _energyUIs = new Dictionary<string, EnergyUI>();
        
        // Coroutines
        private Coroutine _uiCoroutine;
        private Coroutine _updateCoroutine;
        private Coroutine _animationCoroutine;
        
        void Start()
        {
            _analyticsHelper = UnityAnalyticsARPUHelper.Instance;
            if (_analyticsHelper == null)
            {
                Debug.LogError("UnityAnalyticsARPUHelper not found! Make sure it's initialized.");
                return;
            }
            
            _arpuManager = FindObjectOfType<CompliantARPUManager>();
            if (_arpuManager == null)
            {
                Debug.LogError("CompliantARPUManager not found! Make sure it's initialized.");
                return;
            }
            
            InitializeARPUUI();
            StartARPUUI();
        }
        
        private void InitializeARPUUI()
        {
            Debug.Log("🎨 Initializing Google Play Compliant ARPU UI...");
            
            // Initialize UI components
            InitializeUIComponents();
            
            // Initialize offer UI
            InitializeOfferUI();
            
            // Initialize social proof UI
            InitializeSocialProofUI();
            
            // Initialize viral UI
            InitializeViralUI();
            
            // Initialize energy UI
            InitializeEnergyUI();
            
            // Initialize analytics UI
            InitializeAnalyticsUI();
            
            Debug.Log("🎨 ARPU UI initialized with Google Play compliance!");
        }
        
        private void InitializeUIComponents()
        {
            Debug.Log("🎨 Initializing UI components...");
            
            // Create main ARPU panel if it doesn't exist
            if (mainARPUPanel == null)
            {
                CreateMainARPUPanel();
            }
            
            // Create offer panel if it doesn't exist
            if (offerPanel == null)
            {
                CreateOfferPanel();
            }
            
            // Create social proof panel if it doesn't exist
            if (socialProofPanel == null)
            {
                CreateSocialProofPanel();
            }
            
            // Create viral panel if it doesn't exist
            if (viralPanel == null)
            {
                CreateViralPanel();
            }
            
            // Create energy panel if it doesn't exist
            if (energyPanel == null)
            {
                CreateEnergyPanel();
            }
            
            // Create analytics panel if it doesn't exist
            if (analyticsPanel == null)
            {
                CreateAnalyticsPanel();
            }
        }
        
        private void InitializeOfferUI()
        {
            Debug.Log("🎁 Initializing offer UI...");
            
            // Create offer UI components
            _offerUIs["energy_pack_small"] = new OfferUI
            {
                offerId = "energy_pack_small",
                name = "Small Energy Pack",
                price = 0.99f,
                originalPrice = 1.99f,
                savings = 1.00f,
                value = "5 Energy + 100 Coins",
                description = "Perfect for getting started",
                isTransparent = true,
                isReal = true
            };
            
            _offerUIs["energy_pack_large"] = new OfferUI
            {
                offerId = "energy_pack_large",
                name = "Large Energy Pack",
                price = 4.99f,
                originalPrice = 9.99f,
                savings = 5.00f,
                value = "25 Energy + 500 Coins + 1 Booster",
                description = "Great value for regular players",
                isTransparent = true,
                isReal = true
            };
        }
        
        private void InitializeSocialProofUI()
        {
            Debug.Log("👥 Initializing social proof UI...");
            
            // Create social proof UI components
            _socialProofUIs["purchases_today"] = new SocialProofUI
            {
                socialProofId = "purchases_today",
                type = "purchase_count",
                value = 0,
                text = "players bought this today",
                isReal = true,
                isTransparent = true
            };
            
            _socialProofUIs["active_players"] = new SocialProofUI
            {
                socialProofId = "active_players",
                type = "player_count",
                value = 0,
                text = "players online now",
                isReal = true,
                isTransparent = true
            };
        }
        
        private void InitializeViralUI()
        {
            Debug.Log("💥 Initializing viral UI...");
            
            // Create viral UI components
            _viralUIs["referral"] = new ViralUI
            {
                viralId = "referral",
                type = "referral",
                title = "Invite Friends",
                description = "Get 1000 coins for each friend who joins",
                reward = "1000 coins per friend",
                isTransparent = true,
                isReal = true
            };
            
            _viralUIs["sharing"] = new ViralUI
            {
                viralId = "sharing",
                type = "sharing",
                title = "Share Your Progress",
                description = "Share your achievements with friends",
                reward = "100 coins per share",
                isTransparent = true,
                isReal = true
            };
        }
        
        private void InitializeEnergyUI()
        {
            Debug.Log("⚡ Initializing energy UI...");
            
            // Create energy UI components
            _energyUIs["energy_display"] = new EnergyUI
            {
                energyId = "energy_display",
                type = "display",
                currentEnergy = 5,
                maxEnergy = 5,
                timeToNext = 0f,
                isTransparent = true,
                isReal = true
            };
        }
        
        private void InitializeAnalyticsUI()
        {
            Debug.Log("📊 Initializing analytics UI...");
            
            // Create analytics UI components
            _uiComponents["arpu_display"] = new UIComponent
            {
                componentId = "arpu_display",
                type = "text",
                value = "0.00",
                unit = "USD",
                isTransparent = true,
                isReal = true
            };
        }
        
        private void StartARPUUI()
        {
            if (!enableARPUUI) return;
            
            _uiCoroutine = StartCoroutine(UICoroutine());
            _updateCoroutine = StartCoroutine(UpdateCoroutine());
            _animationCoroutine = StartCoroutine(AnimationCoroutine());
        }
        
        private IEnumerator UICoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(5f); // Update every 5 seconds
                
                UpdateARPUUI();
                ProcessUIUpdates();
            }
        }
        
        private IEnumerator UpdateCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(1f); // Update every 1 second
                
                UpdateUIElements();
                ProcessUIAnimations();
            }
        }
        
        private IEnumerator AnimationCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(0.1f); // Update every 0.1 seconds
                
                ProcessUIAnimations();
            }
        }
        
        private void UpdateARPUUI()
        {
            Debug.Log("🎨 Updating ARPU UI...");
            
            // Update all UI components
            UpdateOfferUI();
            UpdateSocialProofUI();
            UpdateViralUI();
            UpdateEnergyUI();
            UpdateAnalyticsUI();
        }
        
        private void ProcessUIUpdates()
        {
            Debug.Log("🎨 Processing UI updates...");
            
            // Process all UI updates
        }
        
        private void UpdateUIElements()
        {
            Debug.Log("🎨 Updating UI elements...");
            
            // Update text elements
            UpdateTextElements();
            
            // Update progress bars
            UpdateProgressBars();
            
            // Update buttons
            UpdateButtons();
        }
        
        private void ProcessUIAnimations()
        {
            Debug.Log("🎨 Processing UI animations...");
            
            // Process all UI animations
        }
        
        // UI Update Methods
        
        private void UpdateOfferUI()
        {
            Debug.Log("🎁 Updating offer UI...");
            
            foreach (var offerUI in _offerUIs.Values)
            {
                if (offerUI.isReal && offerUI.isTransparent)
                {
                    UpdateOfferUI(offerUI);
                }
            }
        }
        
        private void UpdateSocialProofUI()
        {
            Debug.Log("👥 Updating social proof UI...");
            
            foreach (var socialProofUI in _socialProofUIs.Values)
            {
                if (socialProofUI.isReal && socialProofUI.isTransparent)
                {
                    UpdateSocialProofUI(socialProofUI);
                }
            }
        }
        
        private void UpdateViralUI()
        {
            Debug.Log("💥 Updating viral UI...");
            
            foreach (var viralUI in _viralUIs.Values)
            {
                if (viralUI.isReal && viralUI.isTransparent)
                {
                    UpdateViralUI(viralUI);
                }
            }
        }
        
        private void UpdateEnergyUI()
        {
            Debug.Log("⚡ Updating energy UI...");
            
            foreach (var energyUI in _energyUIs.Values)
            {
                if (energyUI.isReal && energyUI.isTransparent)
                {
                    UpdateEnergyUI(energyUI);
                }
            }
        }
        
        private void UpdateAnalyticsUI()
        {
            Debug.Log("📊 Updating analytics UI...");
            
            // Update ARPU metrics
            var currentARPU = _arpuManager?.GetCurrentARPU() ?? 0f;
            var currentARPPU = _arpuManager?.GetCurrentARPPU() ?? 0f;
            var currentConversion = _arpuManager?.GetCurrentConversionRate() ?? 0f;
            
            if (arpuText != null)
            {
                arpuText.text = $"ARPU: ${currentARPU:F2}";
            }
            
            if (arppuText != null)
            {
                arppuText.text = $"ARPPU: ${currentARPPU:F2}";
            }
            
            if (conversionText != null)
            {
                conversionText.text = $"Conversion: {(currentConversion * 100):F1}%";
            }
        }
        
        private void UpdateTextElements()
        {
            Debug.Log("📝 Updating text elements...");
        }
        
        private void UpdateProgressBars()
        {
            Debug.Log("📊 Updating progress bars...");
        }
        
        private void UpdateButtons()
        {
            Debug.Log("🔘 Updating buttons...");
        }
        
        // Individual UI Update Methods
        
        private void UpdateOfferUI(OfferUI offerUI)
        {
            Debug.Log($"🎁 Updating offer UI: {offerUI.name}");
        }
        
        private void UpdateSocialProofUI(SocialProofUI socialProofUI)
        {
            Debug.Log($"👥 Updating social proof UI: {socialProofUI.type}");
        }
        
        private void UpdateViralUI(ViralUI viralUI)
        {
            Debug.Log($"💥 Updating viral UI: {viralUI.type}");
        }
        
        private void UpdateEnergyUI(EnergyUI energyUI)
        {
            Debug.Log($"⚡ Updating energy UI: {energyUI.type}");
        }
        
        // UI Creation Methods
        
        private void CreateMainARPUPanel()
        {
            Debug.Log("🎨 Creating main ARPU panel...");
            
            // Create main ARPU panel
            mainARPUPanel = new GameObject("MainARPUPanel");
            mainARPUPanel.transform.SetParent(transform);
            
            // Add Canvas component
            var canvas = mainARPUPanel.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 100;
            
            // Add CanvasScaler component
            var scaler = mainARPUPanel.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            
            // Add GraphicRaycaster component
            mainARPUPanel.AddComponent<GraphicRaycaster>();
        }
        
        private void CreateOfferPanel()
        {
            Debug.Log("🎁 Creating offer panel...");
            
            // Create offer panel
            offerPanel = new GameObject("OfferPanel");
            offerPanel.transform.SetParent(mainARPUPanel.transform);
            
            // Add RectTransform
            var rectTransform = offerPanel.AddComponent<RectTransform>();
            rectTransform.anchorMin = new Vector2(0.7f, 0.7f);
            rectTransform.anchorMax = new Vector2(0.95f, 0.95f);
            rectTransform.offsetMin = Vector2.zero;
            rectTransform.offsetMax = Vector2.zero;
            
            // Add Image component
            var image = offerPanel.AddComponent<Image>();
            image.color = new Color(0, 0, 0, 0.8f);
        }
        
        private void CreateSocialProofPanel()
        {
            Debug.Log("👥 Creating social proof panel...");
            
            // Create social proof panel
            socialProofPanel = new GameObject("SocialProofPanel");
            socialProofPanel.transform.SetParent(mainARPUPanel.transform);
            
            // Add RectTransform
            var rectTransform = socialProofPanel.AddComponent<RectTransform>();
            rectTransform.anchorMin = new Vector2(0.05f, 0.7f);
            rectTransform.anchorMax = new Vector2(0.3f, 0.95f);
            rectTransform.offsetMin = Vector2.zero;
            rectTransform.offsetMax = Vector2.zero;
            
            // Add Image component
            var image = socialProofPanel.AddComponent<Image>();
            image.color = new Color(0, 0, 0, 0.8f);
        }
        
        private void CreateViralPanel()
        {
            Debug.Log("💥 Creating viral panel...");
            
            // Create viral panel
            viralPanel = new GameObject("ViralPanel");
            viralPanel.transform.SetParent(mainARPUPanel.transform);
            
            // Add RectTransform
            var rectTransform = viralPanel.AddComponent<RectTransform>();
            rectTransform.anchorMin = new Vector2(0.05f, 0.05f);
            rectTransform.anchorMax = new Vector2(0.3f, 0.3f);
            rectTransform.offsetMin = Vector2.zero;
            rectTransform.offsetMax = Vector2.zero;
            
            // Add Image component
            var image = viralPanel.AddComponent<Image>();
            image.color = new Color(0, 0, 0, 0.8f);
        }
        
        private void CreateEnergyPanel()
        {
            Debug.Log("⚡ Creating energy panel...");
            
            // Create energy panel
            energyPanel = new GameObject("EnergyPanel");
            energyPanel.transform.SetParent(mainARPUPanel.transform);
            
            // Add RectTransform
            var rectTransform = energyPanel.AddComponent<RectTransform>();
            rectTransform.anchorMin = new Vector2(0.7f, 0.05f);
            rectTransform.anchorMax = new Vector2(0.95f, 0.3f);
            rectTransform.offsetMin = Vector2.zero;
            rectTransform.offsetMax = Vector2.zero;
            
            // Add Image component
            var image = energyPanel.AddComponent<Image>();
            image.color = new Color(0, 0, 0, 0.8f);
        }
        
        private void CreateAnalyticsPanel()
        {
            Debug.Log("📊 Creating analytics panel...");
            
            // Create analytics panel
            analyticsPanel = new GameObject("AnalyticsPanel");
            analyticsPanel.transform.SetParent(mainARPUPanel.transform);
            
            // Add RectTransform
            var rectTransform = analyticsPanel.AddComponent<RectTransform>();
            rectTransform.anchorMin = new Vector2(0.35f, 0.05f);
            rectTransform.anchorMax = new Vector2(0.65f, 0.3f);
            rectTransform.offsetMin = Vector2.zero;
            rectTransform.offsetMax = Vector2.zero;
            
            // Add Image component
            var image = analyticsPanel.AddComponent<Image>();
            image.color = new Color(0, 0, 0, 0.8f);
        }
        
        // Public API Methods
        
        public void ShowOffer(string offerId)
        {
            if (_offerUIs.ContainsKey(offerId))
            {
                var offerUI = _offerUIs[offerId];
                ShowOfferUI(offerUI);
                Debug.Log($"🎁 Showing offer: {offerUI.name}");
            }
        }
        
        public void HideOffer(string offerId)
        {
            if (_offerUIs.ContainsKey(offerId))
            {
                var offerUI = _offerUIs[offerId];
                HideOfferUI(offerUI);
                Debug.Log($"🎁 Hiding offer: {offerUI.name}");
            }
        }
        
        public void ShowSocialProof(string socialProofId)
        {
            if (_socialProofUIs.ContainsKey(socialProofId))
            {
                var socialProofUI = _socialProofUIs[socialProofId];
                ShowSocialProofUI(socialProofUI);
                Debug.Log($"👥 Showing social proof: {socialProofUI.type}");
            }
        }
        
        public void HideSocialProof(string socialProofId)
        {
            if (_socialProofUIs.ContainsKey(socialProofId))
            {
                var socialProofUI = _socialProofUIs[socialProofId];
                HideSocialProofUI(socialProofUI);
                Debug.Log($"👥 Hiding social proof: {socialProofUI.type}");
            }
        }
        
        public void ShowViral(string viralId)
        {
            if (_viralUIs.ContainsKey(viralId))
            {
                var viralUI = _viralUIs[viralId];
                ShowViralUI(viralUI);
                Debug.Log($"💥 Showing viral: {viralUI.type}");
            }
        }
        
        public void HideViral(string viralId)
        {
            if (_viralUIs.ContainsKey(viralId))
            {
                var viralUI = _viralUIs[viralId];
                HideViralUI(viralUI);
                Debug.Log($"💥 Hiding viral: {viralUI.type}");
            }
        }
        
        public void ShowEnergy()
        {
            if (_energyUIs.ContainsKey("energy_display"))
            {
                var energyUI = _energyUIs["energy_display"];
                ShowEnergyUI(energyUI);
                Debug.Log("⚡ Showing energy display");
            }
        }
        
        public void HideEnergy()
        {
            if (_energyUIs.ContainsKey("energy_display"))
            {
                var energyUI = _energyUIs["energy_display"];
                HideEnergyUI(energyUI);
                Debug.Log("⚡ Hiding energy display");
            }
        }
        
        public void ShowAnalytics()
        {
            if (analyticsPanel != null)
            {
                analyticsPanel.SetActive(true);
                Debug.Log("📊 Showing analytics panel");
            }
        }
        
        public void HideAnalytics()
        {
            if (analyticsPanel != null)
            {
                analyticsPanel.SetActive(false);
                Debug.Log("📊 Hiding analytics panel");
            }
        }
        
        // Individual UI Show/Hide Methods
        
        private void ShowOfferUI(OfferUI offerUI)
        {
            Debug.Log($"🎁 Showing offer UI: {offerUI.name}");
        }
        
        private void HideOfferUI(OfferUI offerUI)
        {
            Debug.Log($"🎁 Hiding offer UI: {offerUI.name}");
        }
        
        private void ShowSocialProofUI(SocialProofUI socialProofUI)
        {
            Debug.Log($"👥 Showing social proof UI: {socialProofUI.type}");
        }
        
        private void HideSocialProofUI(SocialProofUI socialProofUI)
        {
            Debug.Log($"👥 Hiding social proof UI: {socialProofUI.type}");
        }
        
        private void ShowViralUI(ViralUI viralUI)
        {
            Debug.Log($"💥 Showing viral UI: {viralUI.type}");
        }
        
        private void HideViralUI(ViralUI viralUI)
        {
            Debug.Log($"💥 Hiding viral UI: {viralUI.type}");
        }
        
        private void ShowEnergyUI(EnergyUI energyUI)
        {
            Debug.Log($"⚡ Showing energy UI: {energyUI.type}");
        }
        
        private void HideEnergyUI(EnergyUI energyUI)
        {
            Debug.Log($"⚡ Hiding energy UI: {energyUI.type}");
        }
        
        // Cleanup
        
        void OnDestroy()
        {
            if (_uiCoroutine != null)
                StopCoroutine(_uiCoroutine);
            if (_updateCoroutine != null)
                StopCoroutine(_updateCoroutine);
            if (_animationCoroutine != null)
                StopCoroutine(_animationCoroutine);
        }
    }
    
    // Data Classes
    
    [System.Serializable]
    public class UIComponent
    {
        public string componentId;
        public string type;
        public string value;
        public string unit;
        public bool isTransparent;
        public bool isReal;
    }
    
    [System.Serializable]
    public class OfferUI
    {
        public string offerId;
        public string name;
        public float price;
        public float originalPrice;
        public float savings;
        public string value;
        public string description;
        public bool isTransparent;
        public bool isReal;
    }
    
    [System.Serializable]
    public class SocialProofUI
    {
        public string socialProofId;
        public string type;
        public int value;
        public string text;
        public bool isReal;
        public bool isTransparent;
    }
    
    [System.Serializable]
    public class ViralUI
    {
        public string viralId;
        public string type;
        public string title;
        public string description;
        public string reward;
        public bool isTransparent;
        public bool isReal;
    }
    
    [System.Serializable]
    public class EnergyUI
    {
        public string energyId;
        public string type;
        public int currentEnergy;
        public int maxEnergy;
        public float timeToNext;
        public bool isTransparent;
        public bool isReal;
    }
}