using UnityEngine;
using UnityEngine.UI;
using Evergreen.Core;

namespace Evergreen.UI
{
    public class SettingsUI : MonoBehaviour
    {
        [Header("UI References")]
        [SerializeField] private Button backButton;
        [SerializeField] private Button applyButton;
        [SerializeField] private Button resetButton;

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

            if (applyButton != null)
            {
                applyButton.onClick.AddListener(OnApplyButtonClicked);
            }

            if (resetButton != null)
            {
                resetButton.onClick.AddListener(OnResetButtonClicked);
            }
        }

        public void OnBackButtonClicked()
        {
            try
            {
                SceneManager.Instance.GoToMainMenu();
                Logger.Info("Returning to main menu", "Settings");
            }
            catch (System.Exception e)
            {
                Logger.LogException(e, "Settings");
            }
        }

        public void OnApplyButtonClicked()
        {
            try
            {
                // Apply settings logic here
                Logger.Info("Settings applied", "Settings");
            }
            catch (System.Exception e)
            {
                Logger.LogException(e, "Settings");
            }
        }

        public void OnResetButtonClicked()
        {
            try
            {
                // Reset settings logic here
                Logger.Info("Settings reset", "Settings");
            }
            catch (System.Exception e)
            {
                Logger.LogException(e, "Settings");
            }
        }

        void OnDestroy()
        {
            // Clean up button listeners
            if (backButton != null)
            {
                backButton.onClick.RemoveListener(OnBackButtonClicked);
            }

            if (applyButton != null)
            {
                applyButton.onClick.RemoveListener(OnApplyButtonClicked);
            }

            if (resetButton != null)
            {
                resetButton.onClick.RemoveListener(OnResetButtonClicked);
            }
        }
    }
}