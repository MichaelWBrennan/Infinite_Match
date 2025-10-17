using UnityEngine;
using UnityEngine.UI;
using Evergreen.Core;

namespace Evergreen.UI
{
    public class ShopUI : MonoBehaviour
    {
        [Header("UI References")]
        [SerializeField] private Button backButton;
        [SerializeField] private Button purchaseButton;

        void Start()
        {
            InitializeUI();
        }

        private void InitializeUI()
        {
            // Setup button listeners
            if (backButton != null)
            {
                backButton.onClick.AddListener(OnBackButtonClicked);
            }

            if (purchaseButton != null)
            {
                purchaseButton.onClick.AddListener(OnPurchaseButtonClicked);
            }
        }

        public void OnBackButtonClicked()
        {
            try
            {
                SceneManager.Instance.GoToMainMenu();
                Logger.Info("Returning to main menu", "Shop");
            }
            catch (System.Exception e)
            {
                Logger.LogException(e, "Shop");
            }
        }

        public void OnPurchaseButtonClicked()
        {
            try
            {
                // Purchase logic here
                Logger.Info("Purchase initiated", "Shop");
            }
            catch (System.Exception e)
            {
                Logger.LogException(e, "Shop");
            }
        }

        void OnDestroy()
        {
            // Clean up button listeners
            if (backButton != null)
            {
                backButton.onClick.RemoveListener(OnBackButtonClicked);
            }

            if (purchaseButton != null)
            {
                purchaseButton.onClick.RemoveListener(OnPurchaseButtonClicked);
            }
        }
    }
}