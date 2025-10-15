using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Economy;

namespace UI
{
    public class EconomyUI : MonoBehaviour
    {
        [Header("Currency UI")]
        public TextMeshProUGUI coinsText;
        public TextMeshProUGUI gemsText;
        public TextMeshProUGUI energyText;
        
        [Header("Inventory UI")]
        public Transform inventoryParent;
        public GameObject inventoryItemPrefab;
        
        [Header("Shop UI")]
        public Transform shopParent;
        public GameObject shopItemPrefab;
        
        [Header("Debug UI")]
        public Button testButton;
        public Button refreshButton;
        
        private Dictionary<string, GameObject> inventoryItems = new Dictionary<string, GameObject>();
        private Dictionary<string, GameObject> shopItems = new Dictionary<string, GameObject>();

        private void Start()
        {
            InitializeUI();
            SubscribeToEvents();
            
            if (testButton != null)
            {
                testButton.onClick.AddListener(TestEconomySystem);
            }
            
            if (refreshButton != null)
            {
                refreshButton.onClick.AddListener(RefreshUI);
            }
        }

        private void OnDestroy()
        {
            UnsubscribeFromEvents();
        }

        private void InitializeUI()
        {
            UpdateCurrencyDisplay();
            CreateInventoryUI();
            CreateShopUI();
        }

        private void SubscribeToEvents()
        {
            EconomyManager.OnCurrencyChanged += OnCurrencyChanged;
            EconomyManager.OnInventoryChanged += OnInventoryChanged;
            EconomyManager.OnPurchaseCompleted += OnPurchaseCompleted;
            EconomyManager.OnError += OnError;
        }

        private void UnsubscribeFromEvents()
        {
            EconomyManager.OnCurrencyChanged -= OnCurrencyChanged;
            EconomyManager.OnInventoryChanged -= OnInventoryChanged;
            EconomyManager.OnPurchaseCompleted -= OnPurchaseCompleted;
            EconomyManager.OnError -= OnError;
        }

        private void OnCurrencyChanged(Currency currency)
        {
            UpdateCurrencyDisplay();
        }

        private void OnInventoryChanged(InventoryItem item)
        {
            UpdateInventoryItem(item);
        }

        private void OnPurchaseCompleted(string itemId, int cost)
        {
            Debug.Log($"[EconomyUI] Purchase completed: {itemId} for {cost}");
            RefreshUI();
        }

        private void OnError(string errorType, string message)
        {
            Debug.LogError($"[EconomyUI] Error: {errorType} - {message}");
        }

        private void UpdateCurrencyDisplay()
        {
            if (EconomyManager.Instance != null)
            {
                if (coinsText != null)
                {
                    coinsText.text = EconomyManager.Instance.GetCurrencyAmount("coins").ToString();
                }
                
                if (gemsText != null)
                {
                    gemsText.text = EconomyManager.Instance.GetCurrencyAmount("gems").ToString();
                }
                
                if (energyText != null)
                {
                    energyText.text = EconomyManager.Instance.GetCurrencyAmount("energy").ToString();
                }
            }
        }

        private void CreateInventoryUI()
        {
            if (inventoryParent == null || inventoryItemPrefab == null) return;
            
            // Clear existing items
            foreach (Transform child in inventoryParent)
            {
                Destroy(child.gameObject);
            }
            inventoryItems.Clear();
            
            if (EconomyManager.Instance != null)
            {
                var inventory = EconomyManager.Instance.GetAllInventoryItems();
                
                foreach (var item in inventory.Values)
                {
                    CreateInventoryItemUI(item);
                }
            }
        }

        private void CreateInventoryItemUI(InventoryItem item)
        {
            GameObject itemObj = Instantiate(inventoryItemPrefab, inventoryParent);
            
            // Set up the UI elements
            var nameText = itemObj.GetComponentInChildren<TextMeshProUGUI>();
            if (nameText != null)
            {
                nameText.text = $"{item.name} x{item.quantity}";
            }
            
            // Add button functionality
            var button = itemObj.GetComponent<Button>();
            if (button != null)
            {
                button.onClick.AddListener(() => UseInventoryItem(item.id));
            }
            
            inventoryItems[item.id] = itemObj;
        }

        private void UpdateInventoryItem(InventoryItem item)
        {
            if (inventoryItems.TryGetValue(item.id, out GameObject itemObj))
            {
                var nameText = itemObj.GetComponentInChildren<TextMeshProUGUI>();
                if (nameText != null)
                {
                    nameText.text = $"{item.name} x{item.quantity}";
                }
            }
        }

        private void CreateShopUI()
        {
            if (shopParent == null || shopItemPrefab == null) return;
            
            // Clear existing items
            foreach (Transform child in shopParent)
            {
                Destroy(child.gameObject);
            }
            shopItems.Clear();
            
            if (EconomyManager.Instance != null)
            {
                var catalog = EconomyManager.Instance.GetAllCatalogItems();
                
                foreach (var item in catalog.Values)
                {
                    CreateShopItemUI(item);
                }
            }
        }

        private void CreateShopItemUI(CatalogItem item)
        {
            GameObject itemObj = Instantiate(shopItemPrefab, shopParent);
            
            // Set up the UI elements
            var texts = itemObj.GetComponentsInChildren<TextMeshProUGUI>();
            if (texts.Length >= 2)
            {
                texts[0].text = item.name;
                texts[1].text = $"{item.cost_amount} {item.cost_currency}";
            }
            
            // Add button functionality
            var button = itemObj.GetComponent<Button>();
            if (button != null)
            {
                button.onClick.AddListener(() => PurchaseItem(item.id));
            }
            
            shopItems[item.id] = itemObj;
        }

        private void UseInventoryItem(string itemId)
        {
            if (EconomyManager.Instance != null)
            {
                EconomyManager.Instance.UseInventoryItem(itemId, 1);
            }
        }

        private void PurchaseItem(string itemId)
        {
            if (EconomyManager.Instance != null)
            {
                EconomyManager.Instance.PurchaseItem(itemId);
            }
        }

        private void TestEconomySystem()
        {
            Debug.Log("[EconomyUI] Testing economy system...");
            
            if (EconomyManager.Instance != null)
            {
                // Test adding currency
                EconomyManager.Instance.AddCurrency("coins", 100);
                EconomyManager.Instance.AddCurrency("gems", 10);
                
                // Test adding inventory items
                EconomyManager.Instance.AddInventoryItem("booster_extra_moves", 2);
                EconomyManager.Instance.AddInventoryItem("booster_color_bomb", 1);
                
                // Test Cloud Code functions
                if (CloudCode.CloudCodeManager.Instance != null)
                {
                    CloudCode.CloudCodeManager.Instance.TestAllCloudCodeFunctions();
                }
            }
        }

        private void RefreshUI()
        {
            UpdateCurrencyDisplay();
            CreateInventoryUI();
            CreateShopUI();
        }
    }
}
