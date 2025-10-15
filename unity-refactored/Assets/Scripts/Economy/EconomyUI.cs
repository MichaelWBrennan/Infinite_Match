using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using Evergreen.Core;

namespace Evergreen.Economy
{
    /// <summary>
    /// UI component for displaying economy information and shop interface
    /// </summary>
    public class EconomyUI : MonoBehaviour
    {
        [Header("Currency Display")]
        [SerializeField] private Transform currencyContainer;
        [SerializeField] private GameObject currencyPrefab;
        [SerializeField] private Text totalCoinsText;
        [SerializeField] private Text totalGemsText;
        [SerializeField] private Text totalEnergyText;
        
        [Header("Shop UI")]
        [SerializeField] private GameObject shopPanel;
        [SerializeField] private Transform shopItemContainer;
        [SerializeField] private GameObject shopItemPrefab;
        [SerializeField] private Button shopToggleButton;
        [SerializeField] private Button closeShopButton;
        
        [Header("Rewards UI")]
        [SerializeField] private GameObject rewardsPanel;
        [SerializeField] private Transform rewardsContainer;
        [SerializeField] private GameObject rewardPrefab;
        [SerializeField] private Button rewardsToggleButton;
        [SerializeField] private Button closeRewardsButton;
        
        [Header("Economy Report")]
        [SerializeField] private GameObject reportPanel;
        [SerializeField] private Text reportText;
        [SerializeField] private Button reportToggleButton;
        [SerializeField] private Button closeReportButton;
        
        private EconomyService _economyService;
        private Dictionary<string, Text> _currencyTexts = new Dictionary<string, Text>();
        private List<GameObject> _shopItemObjects = new List<GameObject>();
        private List<GameObject> _rewardObjects = new List<GameObject>();
        
        void Start()
        {
            InitializeUI();
            SetupEventListeners();
            StartCoroutine(UpdateUI());
        }
        
        private void InitializeUI()
        {
            // Get economy service
            _economyService = ServiceLocator.Get<EconomyService>();
            if (_economyService == null)
            {
                Debug.LogError("EconomyService not found! Make sure it's registered in GameManager.");
                return;
            }
            
            // Subscribe to economy events
            _economyService.OnCurrencyChanged += OnCurrencyChanged;
            _economyService.OnRewardEarned += OnRewardEarned;
            _economyService.OnRewardClaimed += OnRewardClaimed;
            
            // Initialize currency display
            InitializeCurrencyDisplay();
            
            // Initialize shop
            InitializeShop();
            
            // Initialize rewards
            InitializeRewards();
            
            // Initialize report
            InitializeReport();
        }
        
        private void SetupEventListeners()
        {
            if (shopToggleButton != null)
                shopToggleButton.onClick.AddListener(ToggleShop);
            
            if (closeShopButton != null)
                closeShopButton.onClick.AddListener(CloseShop);
            
            if (rewardsToggleButton != null)
                rewardsToggleButton.onClick.AddListener(ToggleRewards);
            
            if (closeRewardsButton != null)
                closeRewardsButton.onClick.AddListener(CloseRewards);
            
            if (reportToggleButton != null)
                reportToggleButton.onClick.AddListener(ToggleReport);
            
            if (closeReportButton != null)
                closeReportButton.onClick.AddListener(CloseReport);
        }
        
        private void InitializeCurrencyDisplay()
        {
            if (currencyContainer == null || currencyPrefab == null) return;
            
            // Clear existing currency displays
            foreach (Transform child in currencyContainer)
            {
                Destroy(child.gameObject);
            }
            
            // Get all currencies from economy service
            var currencyManager = ServiceLocator.Get<CurrencyManager>();
            if (currencyManager != null)
            {
                var currencies = currencyManager.GetAllCurrencies();
                
                foreach (var currency in currencies)
                {
                    GameObject currencyObj = Instantiate(currencyPrefab, currencyContainer);
                    
                    // Set up currency display
                    Text nameText = currencyObj.transform.Find("Name")?.GetComponent<Text>();
                    Text amountText = currencyObj.transform.Find("Amount")?.GetComponent<Text>();
                    Image iconImage = currencyObj.transform.Find("Icon")?.GetComponent<Image>();
                    
                    if (nameText != null)
                        nameText.text = currency.name;
                    
                    if (amountText != null)
                    {
                        amountText.text = "0";
                        _currencyTexts[currency.id] = amountText;
                    }
                    
                    if (iconImage != null)
                    {
                        // Load icon from resources
                        Sprite icon = Resources.Load<Sprite>(currency.iconPath);
                        if (icon != null)
                            iconImage.sprite = icon;
                    }
                }
            }
        }
        
        private void InitializeShop()
        {
            if (shopPanel != null)
                shopPanel.SetActive(false);
        }
        
        private void InitializeRewards()
        {
            if (rewardsPanel != null)
                rewardsPanel.SetActive(false);
        }
        
        private void InitializeReport()
        {
            if (reportPanel != null)
                reportPanel.SetActive(false);
        }
        
        private System.Collections.IEnumerator UpdateUI()
        {
            while (true)
            {
                UpdateCurrencyDisplay();
                yield return new WaitForSeconds(1f); // Update every second
            }
        }
        
        private void UpdateCurrencyDisplay()
        {
            if (_economyService == null) return;
            
            // Update individual currency displays
            foreach (var kvp in _currencyTexts)
            {
                int amount = _economyService.GetCurrency(kvp.Key);
                kvp.Value.text = amount.ToString();
            }
            
            // Update legacy currency displays
            if (totalCoinsText != null)
                totalCoinsText.text = _economyService.GetCurrency("coins").ToString();
            
            if (totalGemsText != null)
                totalGemsText.text = _economyService.GetCurrency("gems").ToString();
            
            if (totalEnergyText != null)
                totalEnergyText.text = _economyService.GetCurrency("energy").ToString();
        }
        
        private void ToggleShop()
        {
            if (shopPanel == null) return;
            
            bool isActive = shopPanel.activeSelf;
            shopPanel.SetActive(!isActive);
            
            if (!isActive)
            {
                RefreshShop();
            }
        }
        
        private void CloseShop()
        {
            if (shopPanel != null)
                shopPanel.SetActive(false);
        }
        
        private void RefreshShop()
        {
            if (shopItemContainer == null || shopItemPrefab == null) return;
            
            // Clear existing shop items
            foreach (var obj in _shopItemObjects)
            {
                if (obj != null)
                    Destroy(obj);
            }
            _shopItemObjects.Clear();
            
            // Get available shop items
            var shopSystem = ServiceLocator.Get<ShopSystem>();
            if (shopSystem != null)
            {
                var items = shopSystem.GetAvailableItems("player1"); // Replace with actual player ID
                
                foreach (var item in items)
                {
                    GameObject itemObj = Instantiate(shopItemPrefab, shopItemContainer);
                    _shopItemObjects.Add(itemObj);
                    
                    // Set up shop item display
                    Text nameText = itemObj.transform.Find("Name")?.GetComponent<Text>();
                    Text descriptionText = itemObj.transform.Find("Description")?.GetComponent<Text>();
                    Text priceText = itemObj.transform.Find("Price")?.GetComponent<Text>();
                    Button buyButton = itemObj.transform.Find("BuyButton")?.GetComponent<Button>();
                    Image iconImage = itemObj.transform.Find("Icon")?.GetComponent<Image>();
                    
                    if (nameText != null)
                        nameText.text = item.name;
                    
                    if (descriptionText != null)
                        descriptionText.text = item.description;
                    
                    if (priceText != null && item.costs.Count > 0)
                    {
                        var cost = item.costs[0];
                        priceText.text = $"{cost.amount} {cost.currencyId}";
                    }
                    
                    if (buyButton != null)
                    {
                        buyButton.onClick.RemoveAllListeners();
                        buyButton.onClick.AddListener(() => PurchaseItem(item.id));
                    }
                    
                    if (iconImage != null)
                    {
                        // Load icon from resources
                        Sprite icon = Resources.Load<Sprite>(item.iconPath);
                        if (icon != null)
                            iconImage.sprite = icon;
                    }
                }
            }
        }
        
        private void PurchaseItem(string itemId)
        {
            var shopSystem = ServiceLocator.Get<ShopSystem>();
            if (shopSystem != null)
            {
                bool success = shopSystem.PurchaseItem(itemId, "player1"); // Replace with actual player ID
                
                if (success)
                {
                    Debug.Log($"Successfully purchased item: {itemId}");
                    RefreshShop(); // Refresh shop to update availability
                }
                else
                {
                    Debug.LogWarning($"Failed to purchase item: {itemId}");
                }
            }
        }
        
        private void ToggleRewards()
        {
            if (rewardsPanel == null) return;
            
            bool isActive = rewardsPanel.activeSelf;
            rewardsPanel.SetActive(!isActive);
            
            if (!isActive)
            {
                RefreshRewards();
            }
        }
        
        private void CloseRewards()
        {
            if (rewardsPanel != null)
                rewardsPanel.SetActive(false);
        }
        
        private void RefreshRewards()
        {
            if (rewardsContainer == null || rewardPrefab == null) return;
            
            // Clear existing rewards
            foreach (var obj in _rewardObjects)
            {
                if (obj != null)
                    Destroy(obj);
            }
            _rewardObjects.Clear();
            
            // Get player rewards
            var rewardSystem = ServiceLocator.Get<RewardSystem>();
            if (rewardSystem != null)
            {
                var rewards = rewardSystem.GetPlayerRewards("player1", true); // Replace with actual player ID
                
                foreach (var reward in rewards)
                {
                    GameObject rewardObj = Instantiate(rewardPrefab, rewardsContainer);
                    _rewardObjects.Add(rewardObj);
                    
                    // Set up reward display
                    Text nameText = rewardObj.transform.Find("Name")?.GetComponent<Text>();
                    Text descriptionText = rewardObj.transform.Find("Description")?.GetComponent<Text>();
                    Button claimButton = rewardObj.transform.Find("ClaimButton")?.GetComponent<Button>();
                    
                    if (nameText != null)
                        nameText.text = reward.template.name;
                    
                    if (descriptionText != null)
                        descriptionText.text = reward.template.description;
                    
                    if (claimButton != null)
                    {
                        claimButton.onClick.RemoveAllListeners();
                        claimButton.onClick.AddListener(() => ClaimReward(reward.id));
                    }
                }
            }
        }
        
        private void ClaimReward(string rewardId)
        {
            var rewardSystem = ServiceLocator.Get<RewardSystem>();
            if (rewardSystem != null)
            {
                bool success = rewardSystem.ClaimReward(rewardId);
                
                if (success)
                {
                    Debug.Log($"Successfully claimed reward: {rewardId}");
                    RefreshRewards(); // Refresh rewards to update display
                }
                else
                {
                    Debug.LogWarning($"Failed to claim reward: {rewardId}");
                }
            }
        }
        
        private void ToggleReport()
        {
            if (reportPanel == null) return;
            
            bool isActive = reportPanel.activeSelf;
            reportPanel.SetActive(!isActive);
            
            if (!isActive)
            {
                RefreshReport();
            }
        }
        
        private void CloseReport()
        {
            if (reportPanel != null)
                reportPanel.SetActive(false);
        }
        
        private void RefreshReport()
        {
            if (reportText == null) return;
            
            var economyAnalytics = ServiceLocator.Get<EconomyAnalytics>();
            if (economyAnalytics != null)
            {
                reportText.text = economyAnalytics.GetReport();
            }
            else
            {
                reportText.text = "Economy analytics not available";
            }
        }
        
        private void OnCurrencyChanged(string currencyId, int oldAmount, int newAmount)
        {
            // Update currency display immediately
            UpdateCurrencyDisplay();
        }
        
        private void OnRewardEarned(RewardInstance reward)
        {
            Debug.Log($"New reward earned: {reward.template.name}");
            // Could show a notification here
        }
        
        private void OnRewardClaimed(RewardInstance reward)
        {
            Debug.Log($"Reward claimed: {reward.template.name}");
            // Could show a notification here
        }
        
        void OnDestroy()
        {
            // Unsubscribe from events
            if (_economyService != null)
            {
                _economyService.OnCurrencyChanged -= OnCurrencyChanged;
                _economyService.OnRewardEarned -= OnRewardEarned;
                _economyService.OnRewardClaimed -= OnRewardClaimed;
            }
        }
    }
}