using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Evergreen.MetaGame;

namespace Evergreen.UI
{
    public class DecorationItem : MonoBehaviour
    {
        [Header("UI References")]
        public Image decorationIcon;
        public TextMeshProUGUI decorationNameText;
        public TextMeshProUGUI decorationDescriptionText;
        public TextMeshProUGUI costText;
        public Button purchaseButton;
        public Button placeButton;
        public GameObject purchasedOverlay;
        public GameObject placedOverlay;
        public Image rarityBackground;
        
        private Decoration _decoration;
        private System.Action<Decoration> _onDecorationClicked;
        
        public void Setup(Decoration decoration, System.Action<Decoration> onDecorationClicked)
        {
            _decoration = decoration;
            _onDecorationClicked = onDecorationClicked;
            
            RefreshUI();
            
            purchaseButton.onClick.RemoveAllListeners();
            purchaseButton.onClick.AddListener(OnPurchaseClicked);
            
            placeButton.onClick.RemoveAllListeners();
            placeButton.onClick.AddListener(OnPlaceClicked);
        }
        
        private void RefreshUI()
        {
            if (_decoration == null) return;
            
            decorationNameText.text = _decoration.name;
            decorationDescriptionText.text = _decoration.description;
            
            // Update cost display
            costText.text = $"{_decoration.cost} {_decoration.currencyType}";
            
            // Update visual states
            purchasedOverlay.SetActive(_decoration.isPurchased);
            placedOverlay.SetActive(_decoration.isPlaced);
            
            // Update button states
            purchaseButton.gameObject.SetActive(!_decoration.isPurchased);
            placeButton.gameObject.SetActive(_decoration.isPurchased);
            
            // Update rarity background color
            Color rarityColor = GetRarityColor(_decoration.rarity);
            rarityBackground.color = rarityColor;
            
            // Update button interactability based on affordability
            if (!_decoration.isPurchased)
            {
                var gameManager = OptimizedCoreSystem.Instance.Resolve<GameManager>();
                if (gameManager != null)
                {
                    int currentAmount = gameManager.GetCurrency(_decoration.currencyType);
                    purchaseButton.interactable = currentAmount >= _decoration.cost;
                }
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
        
        private void OnPlaceClicked()
        {
            _onDecorationClicked?.Invoke(_decoration);
        }
    }
}