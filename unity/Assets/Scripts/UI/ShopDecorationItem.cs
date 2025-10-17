using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Evergreen.MetaGame;

namespace Evergreen.UI
{
    public class ShopDecorationItem : MonoBehaviour
    {
        [Header("UI References")]
        public Image decorationIcon;
        public TextMeshProUGUI decorationNameText;
        public TextMeshProUGUI decorationDescriptionText;
        public TextMeshProUGUI costText;
        public Button purchaseButton;
        public Image rarityBackground;
        public TextMeshProUGUI rarityText;
        
        private Decoration _decoration;
        private System.Action<Decoration> _onDecorationClicked;
        
        public void Setup(Decoration decoration, System.Action<Decoration> onDecorationClicked)
        {
            _decoration = decoration;
            _onDecorationClicked = onDecorationClicked;
            
            RefreshUI();
            
            purchaseButton.onClick.RemoveAllListeners();
            purchaseButton.onClick.AddListener(OnPurchaseClicked);
        }
        
        private void RefreshUI()
        {
            if (_decoration == null) return;
            
            decorationNameText.text = _decoration.name;
            decorationDescriptionText.text = _decoration.description;
            costText.text = $"{_decoration.cost} {_decoration.currencyType}";
            
            // Update rarity display
            rarityText.text = GetRarityText(_decoration.rarity);
            
            // Update rarity background color
            Color rarityColor = GetRarityColor(_decoration.rarity);
            rarityBackground.color = rarityColor;
            
            // Update button interactability based on affordability
            var gameManager = OptimizedCoreSystem.Instance.Resolve<GameManager>();
            if (gameManager != null)
            {
                int currentAmount = gameManager.GetCurrency(_decoration.currencyType);
                purchaseButton.interactable = currentAmount >= _decoration.cost;
            }
        }
        
        private string GetRarityText(int rarity)
        {
            switch (rarity)
            {
                case 1: return "Common";
                case 2: return "Uncommon";
                case 3: return "Rare";
                case 4: return "Epic";
                case 5: return "Legendary";
                default: return "Common";
            }
        }
        
        private Color GetRarityColor(int rarity)
        {
            switch (rarity)
            {
                case 1: return new Color(0.5f, 0.5f, 0.5f, 0.3f); // Gray
                case 2: return new Color(0.2f, 0.8f, 0.2f, 0.3f); // Green
                case 3: return new Color(0.2f, 0.2f, 0.8f, 0.3f); // Blue
                case 4: return new Color(0.8f, 0.2f, 0.8f, 0.3f); // Purple
                case 5: return new Color(0.8f, 0.8f, 0.2f, 0.3f); // Gold
                default: return new Color(0.5f, 0.5f, 0.5f, 0.3f);
            }
        }
        
        private void OnPurchaseClicked()
        {
            _onDecorationClicked?.Invoke(_decoration);
        }
    }
}