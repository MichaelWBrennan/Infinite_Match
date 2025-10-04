using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Evergreen.MetaGame;

namespace Evergreen.UI
{
    public class DecorationUI : MonoBehaviour
    {
        [Header("UI Elements")]
        public Image itemImage;
        public TextMeshProUGUI itemNameText;
        public TextMeshProUGUI itemDescriptionText;
        public TextMeshProUGUI costText;
        public Button purchaseButton;
        public Button placeButton;
        public Button removeButton;
        public GameObject ownedIndicator;
        public GameObject placedIndicator;
        public Image rarityBorder;
        
        [Header("Rarity Colors")]
        public Color commonColor = Color.white;
        public Color uncommonColor = Color.green;
        public Color rareColor = Color.blue;
        public Color epicColor = Color.magenta;
        public Color legendaryColor = Color.yellow;
        
        private DecorationItem itemData;
        
        public void SetupDecoration(DecorationItem item)
        {
            itemData = item;
            UpdateUI();
        }
        
        private void UpdateUI()
        {
            if (itemData == null) return;
            
            itemNameText.text = itemData.name;
            itemDescriptionText.text = itemData.description;
            
            // Set rarity border color
            if (rarityBorder != null)
            {
                rarityBorder.color = GetRarityColor(itemData.rarity);
            }
            
            // Update cost display
            if (itemData.isPurchased)
            {
                costText.gameObject.SetActive(false);
                purchaseButton.gameObject.SetActive(false);
                ownedIndicator.SetActive(true);
                
                if (itemData.isPlaced)
                {
                    placeButton.gameObject.SetActive(false);
                    removeButton.gameObject.SetActive(true);
                    placedIndicator.SetActive(true);
                }
                else
                {
                    placeButton.gameObject.SetActive(true);
                    removeButton.gameObject.SetActive(false);
                    placedIndicator.SetActive(false);
                }
            }
            else
            {
                costText.gameObject.SetActive(true);
                purchaseButton.gameObject.SetActive(true);
                ownedIndicator.SetActive(false);
                placeButton.gameObject.SetActive(false);
                removeButton.gameObject.SetActive(false);
                placedIndicator.SetActive(false);
                
                string costString = $"{itemData.cost} ";
                if (itemData.currency == "coins")
                    costString += "Coins";
                else
                    costString += "Gems";
                
                costText.text = costString;
                
                // Check if can purchase
                bool canPurchase = DecorationSystem.Instance.CanPurchaseDecoration(itemData.id);
                purchaseButton.interactable = canPurchase;
                
                if (!canPurchase)
                {
                    var buttonText = purchaseButton.GetComponentInChildren<TextMeshProUGUI>();
                    if (buttonText != null)
                    {
                        if (itemData.currency == "coins" && Evergreen.Game.GameState.Coins < itemData.cost)
                            buttonText.text = "Need Coins";
                        else if (itemData.currency == "gems" && Evergreen.Game.GameState.Gems < itemData.cost)
                            buttonText.text = "Need Gems";
                    }
                }
                else
                {
                    var buttonText = purchaseButton.GetComponentInChildren<TextMeshProUGUI>();
                    if (buttonText != null)
                        buttonText.text = "Buy";
                }
            }
        }
        
        private Color GetRarityColor(string rarity)
        {
            switch (rarity.ToLower())
            {
                case "common": return commonColor;
                case "uncommon": return uncommonColor;
                case "rare": return rareColor;
                case "epic": return epicColor;
                case "legendary": return legendaryColor;
                default: return commonColor;
            }
        }
        
        public void OnPurchaseButtonClicked()
        {
            if (itemData == null) return;
            
            if (DecorationSystem.Instance.PurchaseDecoration(itemData.id))
            {
                UpdateUI();
                ShowNotification($"Purchased: {itemData.name}!");
            }
        }
        
        public void OnPlaceButtonClicked()
        {
            if (itemData == null) return;
            
            // Open placement UI (this would show a room selection and grid placement interface)
            Debug.Log($"Placing item: {itemData.name}");
            ShowPlacementUI();
        }
        
        public void OnRemoveButtonClicked()
        {
            if (itemData == null) return;
            
            // Remove from current position
            if (DecorationSystem.Instance.RemoveDecorationAt(0, itemData.gridPosition)) // Assuming room 0 for now
            {
                UpdateUI();
                ShowNotification($"Removed: {itemData.name}");
            }
        }
        
        private void ShowPlacementUI()
        {
            // This would open a room selection and grid placement interface
            Debug.Log("Opening placement UI");
        }
        
        private void ShowNotification(string message)
        {
            var notificationUI = FindObjectOfType<EnhancedMainMenuUI>();
            if (notificationUI != null)
            {
                notificationUI.ShowNotification(message);
            }
        }
    }
}