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
        
        [Header("Event Asset References")]
        [SerializeField] private GameObject dailyEventPanel;
        [SerializeField] private GameObject tournamentPanel;
        [SerializeField] private GameObject seasonalEventPanel;
        [SerializeField] private GameObject holidayEventPanel;
        
        [Header("Event Visual Assets")]
        [SerializeField] private Sprite dailyEventIcon;
        [SerializeField] private Sprite tournamentIcon;
        [SerializeField] private Sprite seasonalEventIcon;
        [SerializeField] private Sprite holidayEventIcon;
        
        [Header("Event Audio Assets")]
        [SerializeField] private AudioClip buttonClickAudioClip;
        [SerializeField] private AudioClip eventOpenAudioClip;
        [SerializeField] private AudioClip eventCloseAudioClip;

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
                
                // Show daily event panel with proper assets
                if (dailyEventPanel != null)
                {
                    dailyEventPanel.SetActive(true);
                }
                
                // Play audio feedback
                PlayEventAudio(eventOpenAudioClip);
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
                
                // Show tournament panel with proper assets
                if (tournamentPanel != null)
                {
                    tournamentPanel.SetActive(true);
                }
                
                // Play audio feedback
                PlayEventAudio(eventOpenAudioClip);
            }
            catch (System.Exception e)
            {
                Logger.LogException(e, "Events");
            }
        }
        
        private void PlayEventAudio(AudioClip audioClip)
        {
            if (audioClip != null)
            {
                var audioSource = GetComponent<AudioSource>();
                if (audioSource == null)
                {
                    audioSource = gameObject.AddComponent<AudioSource>();
                }
                audioSource.PlayOneShot(audioClip);
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