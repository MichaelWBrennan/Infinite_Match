using UnityEngine;
using UnityEngine.UI;
using Evergreen.Core;

namespace Evergreen.UI
{
    public class EventsUI : MonoBehaviour
    {
        [Header("UI References")]
        [SerializeField] private Button backButton;
        [SerializeField] private Button dailyEventButton;
        [SerializeField] private Button tournamentButton;

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

            if (dailyEventButton != null)
            {
                dailyEventButton.onClick.AddListener(OnDailyEventButtonClicked);
            }

            if (tournamentButton != null)
            {
                tournamentButton.onClick.AddListener(OnTournamentButtonClicked);
            }
        }

        public void OnBackButtonClicked()
        {
            try
            {
                SceneManager.Instance.GoToMainMenu();
                Logger.Info("Returning to main menu", "Events");
            }
            catch (System.Exception e)
            {
                Logger.LogException(e, "Events");
            }
        }

        public void OnDailyEventButtonClicked()
        {
            try
            {
                // Daily event logic here
                Logger.Info("Opening daily event", "Events");
            }
            catch (System.Exception e)
            {
                Logger.LogException(e, "Events");
            }
        }

        public void OnTournamentButtonClicked()
        {
            try
            {
                // Tournament logic here
                Logger.Info("Opening tournament", "Events");
            }
            catch (System.Exception e)
            {
                Logger.LogException(e, "Events");
            }
        }

        void OnDestroy()
        {
            // Clean up button listeners
            if (backButton != null)
            {
                backButton.onClick.RemoveListener(OnBackButtonClicked);
            }

            if (dailyEventButton != null)
            {
                dailyEventButton.onClick.RemoveListener(OnDailyEventButtonClicked);
            }

            if (tournamentButton != null)
            {
                tournamentButton.onClick.RemoveListener(OnTournamentButtonClicked);
            }
        }
    }
}