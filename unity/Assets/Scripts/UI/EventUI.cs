using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Evergreen.LiveOps;
using System;

namespace Evergreen.UI
{
    public class EventUI : MonoBehaviour
    {
        [Header("UI Elements")]
        public TextMeshProUGUI eventNameText;
        public TextMeshProUGUI eventDescriptionText;
        public TextMeshProUGUI timeRemainingText;
        public TextMeshProUGUI progressText;
        public Image progressBar;
        public Button participateButton;
        public Button claimButton;
        public GameObject activeIndicator;
        public GameObject completedIndicator;
        public GameObject expiredIndicator;
        
        [Header("Event Type Icons")]
        public Sprite tournamentIcon;
        public Sprite dailyIcon;
        public Sprite weeklyIcon;
        public Sprite specialIcon;
        public Image eventTypeIcon;
        
        private GameEvent eventData;
        
        public void SetupEvent(GameEvent evt)
        {
            eventData = evt;
            UpdateUI();
        }
        
        private void UpdateUI()
        {
            if (eventData == null) return;
            
            eventNameText.text = eventData.name;
            eventDescriptionText.text = eventData.description;
            
            // Set event type icon
            if (eventTypeIcon != null)
            {
                eventTypeIcon.sprite = GetEventTypeIcon(eventData.type);
            }
            
            // Update status indicators
            activeIndicator.SetActive(eventData.status == EventStatus.Active);
            completedIndicator.SetActive(eventData.status == EventStatus.Completed);
            expiredIndicator.SetActive(eventData.status == EventStatus.Expired);
            
            // Update time remaining
            UpdateTimeRemaining();
            
            // Update progress
            UpdateProgress();
            
            // Update buttons
            UpdateButtons();
        }
        
        private Sprite GetEventTypeIcon(EventType type)
        {
            switch (type)
            {
                case EventType.Tournament: return tournamentIcon;
                case EventType.DailyChallenge: return dailyIcon;
                case EventType.WeeklyChallenge: return weeklyIcon;
                case EventType.Special: return specialIcon;
                default: return specialIcon;
            }
        }
        
        private void UpdateTimeRemaining()
        {
            if (eventData.status == EventStatus.Expired)
            {
                timeRemainingText.text = "Expired";
                return;
            }
            
            var currentTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var timeRemaining = eventData.endTime - currentTime;
            
            if (timeRemaining <= 0)
            {
                timeRemainingText.text = "Ending Soon";
            }
            else
            {
                var timeSpan = TimeSpan.FromSeconds(timeRemaining);
                if (timeSpan.TotalDays >= 1)
                    timeRemainingText.text = $"{timeSpan.Days}d {timeSpan.Hours}h";
                else if (timeSpan.TotalHours >= 1)
                    timeRemainingText.text = $"{timeSpan.Hours}h {timeSpan.Minutes}m";
                else
                    timeRemainingText.text = $"{timeSpan.Minutes}m {timeSpan.Seconds}s";
            }
        }
        
        private void UpdateProgress()
        {
            if (eventData.status != EventStatus.Active)
            {
                progressText.gameObject.SetActive(false);
                progressBar.gameObject.SetActive(false);
                return;
            }
            
            progressText.gameObject.SetActive(true);
            progressBar.gameObject.SetActive(true);
            
            // Calculate progress based on requirements
            int totalProgress = 0;
            int totalRequired = 0;
            
            foreach (var requirement in eventData.requirements)
            {
                var required = Convert.ToInt32(requirement.Value);
                var current = eventData.progress.ContainsKey(requirement.Key) ? 
                    Convert.ToInt32(eventData.progress[requirement.Key]) : 0;
                
                totalProgress += Mathf.Min(current, required);
                totalRequired += required;
            }
            
            if (totalRequired > 0)
            {
                float progressRatio = (float)totalProgress / totalRequired;
                progressBar.fillAmount = progressRatio;
                progressText.text = $"{totalProgress}/{totalRequired}";
            }
            else
            {
                progressBar.fillAmount = 0f;
                progressText.text = "0/0";
            }
        }
        
        private void UpdateButtons()
        {
            switch (eventData.status)
            {
                case EventStatus.Active:
                    participateButton.gameObject.SetActive(true);
                    claimButton.gameObject.SetActive(false);
                    participateButton.interactable = true;
                    break;
                    
                case EventStatus.Completed:
                    participateButton.gameObject.SetActive(false);
                    claimButton.gameObject.SetActive(true);
                    claimButton.interactable = true;
                    break;
                    
                case EventStatus.Expired:
                case EventStatus.Upcoming:
                case EventStatus.Locked:
                    participateButton.gameObject.SetActive(false);
                    claimButton.gameObject.SetActive(false);
                    break;
            }
        }
        
        public void OnParticipateButtonClicked()
        {
            if (eventData == null) return;
            
            // Start participating in the event
            Debug.Log($"Participating in event: {eventData.name}");
            
            // This would typically start the event or show event details
            ShowEventDetails();
        }
        
        public void OnClaimButtonClicked()
        {
            if (eventData == null) return;
            
            // Claim event rewards
            Debug.Log($"Claiming rewards for event: {eventData.name}");
            
            // Grant rewards
            GrantEventRewards();
            
            // Update UI
            UpdateUI();
        }
        
        private void ShowEventDetails()
        {
            // This would open a detailed event popup
            Debug.Log($"Showing details for event: {eventData.name}");
        }
        
        private void GrantEventRewards()
        {
            if (eventData.rewards == null) return;
            
            foreach (var reward in eventData.rewards)
            {
                switch (reward.Key)
                {
                    case "coins":
                        Evergreen.Game.GameState.AddCoins(Convert.ToInt32(reward.Value));
                        break;
                    case "gems":
                        Evergreen.Game.GameState.AddGems(Convert.ToInt32(reward.Value));
                        break;
                    case "energy":
                        for (int i = 0; i < Convert.ToInt32(reward.Value); i++)
                        {
                            Evergreen.Game.GameState.RefillEnergy();
                        }
                        break;
                }
            }
            
            ShowNotification($"Event rewards claimed!");
        }
        
        private void ShowNotification(string message)
        {
            var notificationUI = FindObjectOfType<EnhancedMainMenuUI>();
            if (notificationUI != null)
            {
                notificationUI.ShowNotification(message);
            }
        }
        
        void Update()
        {
            // Update time remaining every second
            if (eventData != null && eventData.status == EventStatus.Active)
            {
                UpdateTimeRemaining();
            }
        }
    }
}