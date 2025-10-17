using UnityEngine;
using UnityEngine.UI;
using Evergreen.Core;

namespace Evergreen.UI
{
    public class SocialUI : MonoBehaviour
    {
        [Header("UI References")]
        [SerializeField] private Button backButton;
        [SerializeField] private Button leaderboardButton;
        [SerializeField] private Button friendsButton;

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

            if (leaderboardButton != null)
            {
                leaderboardButton.onClick.AddListener(OnLeaderboardButtonClicked);
            }

            if (friendsButton != null)
            {
                friendsButton.onClick.AddListener(OnFriendsButtonClicked);
            }
        }

        public void OnBackButtonClicked()
        {
            try
            {
                SceneManager.Instance.GoToMainMenu();
                Logger.Info("Returning to main menu", "Social");
            }
            catch (System.Exception e)
            {
                Logger.LogException(e, "Social");
            }
        }

        public void OnLeaderboardButtonClicked()
        {
            try
            {
                // Leaderboard logic here
                Logger.Info("Opening leaderboard", "Social");
            }
            catch (System.Exception e)
            {
                Logger.LogException(e, "Social");
            }
        }

        public void OnFriendsButtonClicked()
        {
            try
            {
                // Friends logic here
                Logger.Info("Opening friends", "Social");
            }
            catch (System.Exception e)
            {
                Logger.LogException(e, "Social");
            }
        }

        void OnDestroy()
        {
            // Clean up button listeners
            if (backButton != null)
            {
                backButton.onClick.RemoveListener(OnBackButtonClicked);
            }

            if (leaderboardButton != null)
            {
                leaderboardButton.onClick.RemoveListener(OnLeaderboardButtonClicked);
            }

            if (friendsButton != null)
            {
                friendsButton.onClick.RemoveListener(OnFriendsButtonClicked);
            }
        }
    }
}