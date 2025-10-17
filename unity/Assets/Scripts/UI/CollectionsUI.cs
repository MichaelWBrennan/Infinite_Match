using UnityEngine;
using UnityEngine.UI;
using Evergreen.Core;

namespace Evergreen.UI
{
    public class CollectionsUI : MonoBehaviour
    {
        [Header("UI References")]
        [SerializeField] private Button backButton;
        [SerializeField] private Button achievementsButton;
        [SerializeField] private Button rewardsButton;

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

            if (achievementsButton != null)
            {
                achievementsButton.onClick.AddListener(OnAchievementsButtonClicked);
            }

            if (rewardsButton != null)
            {
                rewardsButton.onClick.AddListener(OnRewardsButtonClicked);
            }
        }

        public void OnBackButtonClicked()
        {
            try
            {
                SceneManager.Instance.GoToMainMenu();
                Logger.Info("Returning to main menu", "Collections");
            }
            catch (System.Exception e)
            {
                Logger.LogException(e, "Collections");
            }
        }

        public void OnAchievementsButtonClicked()
        {
            try
            {
                // Achievements logic here
                Logger.Info("Opening achievements", "Collections");
            }
            catch (System.Exception e)
            {
                Logger.LogException(e, "Collections");
            }
        }

        public void OnRewardsButtonClicked()
        {
            try
            {
                // Rewards logic here
                Logger.Info("Opening rewards", "Collections");
            }
            catch (System.Exception e)
            {
                Logger.LogException(e, "Collections");
            }
        }

        void OnDestroy()
        {
            // Clean up button listeners
            if (backButton != null)
            {
                backButton.onClick.RemoveListener(OnBackButtonClicked);
            }

            if (achievementsButton != null)
            {
                achievementsButton.onClick.RemoveListener(OnAchievementsButtonClicked);
            }

            if (rewardsButton != null)
            {
                rewardsButton.onClick.RemoveListener(OnRewardsButtonClicked);
            }
        }
    }
}