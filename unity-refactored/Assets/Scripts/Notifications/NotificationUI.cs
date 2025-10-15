using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Evergreen.Notifications;

namespace Evergreen.UI
{
    public class NotificationUI : MonoBehaviour
    {
        [Header("UI Elements")]
        public Image iconImage;
        public TextMeshProUGUI titleText;
        public TextMeshProUGUI messageText;
        public TextMeshProUGUI timeText;
        public Button actionButton;
        public Button dismissButton;
        public Image backgroundImage;
        public Image priorityIndicator;
        
        [Header("Colors")]
        public Color infoColor = Color.blue;
        public Color successColor = Color.green;
        public Color warningColor = Color.yellow;
        public Color errorColor = Color.red;
        public Color achievementColor = Color.magenta;
        public Color eventColor = Color.cyan;
        public Color socialColor = Color.blue;
        public Color purchaseColor = Color.green;
        public Color levelColor = Color.orange;
        public Color energyColor = Color.yellow;
        public Color giftColor = Color.pink;
        public Color tournamentColor = Color.purple;
        public Color dailyColor = Color.cyan;
        public Color weeklyColor = Color.blue;
        
        private Notification notificationData;
        
        public void SetupNotification(Notification notification)
        {
            notificationData = notification;
            UpdateUI();
        }
        
        private void UpdateUI()
        {
            if (notificationData == null) return;
            
            // Set title and message
            if (titleText != null)
                titleText.text = notificationData.title;
            
            if (messageText != null)
                messageText.text = notificationData.message;
            
            // Set time
            if (timeText != null)
            {
                var timeSpan = System.DateTimeOffset.UtcNow - System.DateTimeOffset.FromUnixTimeSeconds(notificationData.timestamp);
                timeText.text = FormatTimeAgo(timeSpan);
            }
            
            // Set icon
            if (iconImage != null)
            {
                iconImage.sprite = GetNotificationIcon(notificationData.type);
            }
            
            // Set background color
            if (backgroundImage != null)
            {
                backgroundImage.color = GetNotificationColor(notificationData.type);
            }
            
            // Set priority indicator
            if (priorityIndicator != null)
            {
                priorityIndicator.color = GetPriorityColor(notificationData.priority);
                priorityIndicator.gameObject.SetActive(notificationData.priority == NotificationPriority.High || 
                                                     notificationData.priority == NotificationPriority.Critical);
            }
            
            // Setup action button
            if (actionButton != null)
            {
                if (!string.IsNullOrEmpty(notificationData.actionText))
                {
                    actionButton.gameObject.SetActive(true);
                    var buttonText = actionButton.GetComponentInChildren<TextMeshProUGUI>();
                    if (buttonText != null)
                        buttonText.text = notificationData.actionText;
                    
                    actionButton.onClick.RemoveAllListeners();
                    actionButton.onClick.AddListener(OnActionButtonClicked);
                }
                else
                {
                    actionButton.gameObject.SetActive(false);
                }
            }
            
            // Setup dismiss button
            if (dismissButton != null)
            {
                dismissButton.onClick.RemoveAllListeners();
                dismissButton.onClick.AddListener(OnDismissButtonClicked);
            }
        }
        
        private string FormatTimeAgo(System.TimeSpan timeSpan)
        {
            if (timeSpan.TotalMinutes < 1)
                return "Just now";
            else if (timeSpan.TotalMinutes < 60)
                return $"{(int)timeSpan.TotalMinutes}m ago";
            else if (timeSpan.TotalHours < 24)
                return $"{(int)timeSpan.TotalHours}h ago";
            else if (timeSpan.TotalDays < 7)
                return $"{(int)timeSpan.TotalDays}d ago";
            else
                return $"{(int)timeSpan.TotalDays / 7}w ago";
        }
        
        private Sprite GetNotificationIcon(NotificationType type)
        {
            if (NotificationManager.Instance == null) return null;
            
            switch (type)
            {
                case NotificationType.Info:
                    return NotificationManager.Instance.infoIcon;
                case NotificationType.Success:
                    return NotificationManager.Instance.successIcon;
                case NotificationType.Warning:
                    return NotificationManager.Instance.warningIcon;
                case NotificationType.Error:
                    return NotificationManager.Instance.errorIcon;
                case NotificationType.Achievement:
                    return NotificationManager.Instance.achievementIcon;
                case NotificationType.Event:
                    return NotificationManager.Instance.eventIcon;
                case NotificationType.Social:
                    return NotificationManager.Instance.socialIcon;
                case NotificationType.Purchase:
                    return NotificationManager.Instance.purchaseIcon;
                case NotificationType.Level:
                    return NotificationManager.Instance.levelIcon;
                case NotificationType.Energy:
                    return NotificationManager.Instance.energyIcon;
                case NotificationType.Gift:
                    return NotificationManager.Instance.giftIcon;
                case NotificationType.Tournament:
                    return NotificationManager.Instance.tournamentIcon;
                case NotificationType.Daily:
                    return NotificationManager.Instance.dailyIcon;
                case NotificationType.Weekly:
                    return NotificationManager.Instance.weeklyIcon;
                default:
                    return NotificationManager.Instance.infoIcon;
            }
        }
        
        private Color GetNotificationColor(NotificationType type)
        {
            switch (type)
            {
                case NotificationType.Info:
                    return infoColor;
                case NotificationType.Success:
                    return successColor;
                case NotificationType.Warning:
                    return warningColor;
                case NotificationType.Error:
                    return errorColor;
                case NotificationType.Achievement:
                    return achievementColor;
                case NotificationType.Event:
                    return eventColor;
                case NotificationType.Social:
                    return socialColor;
                case NotificationType.Purchase:
                    return purchaseColor;
                case NotificationType.Level:
                    return levelColor;
                case NotificationType.Energy:
                    return energyColor;
                case NotificationType.Gift:
                    return giftColor;
                case NotificationType.Tournament:
                    return tournamentColor;
                case NotificationType.Daily:
                    return dailyColor;
                case NotificationType.Weekly:
                    return weeklyColor;
                default:
                    return infoColor;
            }
        }
        
        private Color GetPriorityColor(NotificationPriority priority)
        {
            switch (priority)
            {
                case NotificationPriority.Low:
                    return Color.gray;
                case NotificationPriority.Normal:
                    return Color.white;
                case NotificationPriority.High:
                    return Color.yellow;
                case NotificationPriority.Critical:
                    return Color.red;
                default:
                    return Color.white;
            }
        }
        
        private void OnActionButtonClicked()
        {
            if (notificationData != null)
            {
                // Mark as read
                if (NotificationManager.Instance != null)
                {
                    NotificationManager.Instance.MarkNotificationAsRead(notificationData.id);
                }
                
                // Execute action
                notificationData.onAction?.Invoke();
                
                // Remove notification
                if (NotificationManager.Instance != null)
                {
                    NotificationManager.Instance.RemoveNotification(notificationData.id);
                }
            }
        }
        
        private void OnDismissButtonClicked()
        {
            if (notificationData != null)
            {
                // Mark as read
                if (NotificationManager.Instance != null)
                {
                    NotificationManager.Instance.MarkNotificationAsRead(notificationData.id);
                }
                
                // Execute dismiss action
                notificationData.onDismiss?.Invoke();
                
                // Remove notification
                if (NotificationManager.Instance != null)
                {
                    NotificationManager.Instance.RemoveNotification(notificationData.id);
                }
            }
        }
        
        public string GetNotificationId()
        {
            return notificationData?.id ?? "";
        }
        
        public Notification GetNotification()
        {
            return notificationData;
        }
        
        public void MarkAsRead()
        {
            if (notificationData != null)
            {
                notificationData.isRead = true;
                
                // Update UI to show read state
                if (backgroundImage != null)
                {
                    var color = backgroundImage.color;
                    color.a = 0.5f;
                    backgroundImage.color = color;
                }
            }
        }
    }
}