using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System;

namespace Evergreen.Notifications
{
    [System.Serializable]
    public class Notification
    {
        public string id;
        public string title;
        public string message;
        public NotificationType type;
        public NotificationPriority priority;
        public float duration;
        public bool isPersistent;
        public Dictionary<string, object> data = new Dictionary<string, object>();
        public long timestamp;
        public bool isRead;
        public string actionText;
        public System.Action onAction;
        public System.Action onDismiss;
    }
    
    public enum NotificationType
    {
        Info,
        Success,
        Warning,
        Error,
        Achievement,
        Event,
        Social,
        Purchase,
        Level,
        Energy,
        Gift,
        Tournament,
        Daily,
        Weekly
    }
    
    public enum NotificationPriority
    {
        Low,
        Normal,
        High,
        Critical
    }
    
    public class NotificationManager : MonoBehaviour
    {
        [Header("Notification UI")]
        public GameObject notificationPrefab;
        public Transform notificationContainer;
        public GameObject notificationPanel;
        public TextMeshProUGUI notificationCountText;
        public Button notificationButton;
        public Button clearAllButton;
        
        [Header("Notification Settings")]
        public int maxNotifications = 10;
        public float defaultDuration = 3f;
        public float animationDuration = 0.3f;
        public bool enableSound = true;
        public bool enableVibration = true;
        public bool enablePushNotifications = true;
        
        [Header("Notification Icons")]
        public Sprite infoIcon;
        public Sprite successIcon;
        public Sprite warningIcon;
        public Sprite errorIcon;
        public Sprite achievementIcon;
        public Sprite eventIcon;
        public Sprite socialIcon;
        public Sprite purchaseIcon;
        public Sprite levelIcon;
        public Sprite energyIcon;
        public Sprite giftIcon;
        public Sprite tournamentIcon;
        public Sprite dailyIcon;
        public Sprite weeklyIcon;
        
        public static NotificationManager Instance { get; private set; }
        
        private List<Notification> notifications = new List<Notification>();
        private List<GameObject> notificationUIElements = new List<GameObject>();
        private Queue<Notification> notificationQueue = new Queue<Notification>();
        private bool isShowingNotification = false;
        private Coroutine notificationCoroutine;
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeNotifications();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            SetupUI();
            LoadNotifications();
            CheckScheduledNotifications();
        }
        
        void Update()
        {
            ProcessNotificationQueue();
        }
        
        private void InitializeNotifications()
        {
            // Initialize notification system
            Debug.Log("Initializing Notification Manager");
        }
        
        private void SetupUI()
        {
            if (notificationButton != null)
                notificationButton.onClick.AddListener(ToggleNotificationPanel);
            
            if (clearAllButton != null)
                clearAllButton.onClick.AddListener(ClearAllNotifications);
            
            if (notificationPanel != null)
                notificationPanel.SetActive(false);
        }
        
        public void ShowNotification(string title, string message, NotificationType type = NotificationType.Info, float duration = -1f)
        {
            var notification = new Notification
            {
                id = System.Guid.NewGuid().ToString(),
                title = title,
                message = message,
                type = type,
                priority = GetDefaultPriority(type),
                duration = duration > 0 ? duration : defaultDuration,
                isPersistent = false,
                timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                isRead = false
            };
            
            ShowNotification(notification);
        }
        
        public void ShowNotification(Notification notification)
        {
            if (notification == null) return;
            
            // Add to queue if already showing a notification
            if (isShowingNotification)
            {
                notificationQueue.Enqueue(notification);
                return;
            }
            
            // Add to notifications list
            notifications.Add(notification);
            
            // Remove old notifications if we exceed the limit
            while (notifications.Count > maxNotifications)
            {
                var oldNotification = notifications[0];
                notifications.RemoveAt(0);
                RemoveNotificationUI(oldNotification.id);
            }
            
            // Show the notification
            StartCoroutine(ShowNotificationCoroutine(notification));
            
            // Play sound and vibration
            PlayNotificationEffects(notification);
            
            // Update UI
            UpdateNotificationUI();
            
            // Analytics
            TrackNotificationShown(notification);
        }
        
        private IEnumerator ShowNotificationCoroutine(Notification notification)
        {
            isShowingNotification = true;
            
            // Create notification UI
            var notificationUI = CreateNotificationUI(notification);
            if (notificationUI != null)
            {
                notificationUIElements.Add(notificationUI);
                
                // Animate in
                yield return StartCoroutine(AnimateNotificationIn(notificationUI));
                
                // Wait for duration
                yield return new WaitForSeconds(notification.duration);
                
                // Animate out
                yield return StartCoroutine(AnimateNotificationOut(notificationUI));
                
                // Remove from UI
                notificationUIElements.Remove(notificationUI);
                Destroy(notificationUI);
            }
            
            isShowingNotification = false;
        }
        
        private GameObject CreateNotificationUI(Notification notification)
        {
            if (notificationPrefab == null || notificationContainer == null) 
            {
                Debug.LogError("NotificationManager: Missing notification prefab or container");
                // Create a simple text-based notification as fallback
                return CreateFallbackNotification(notification);
            }
            
            var notificationUI = Instantiate(notificationPrefab, notificationContainer);
            var notificationScript = notificationUI.GetComponent<NotificationUI>();
            if (notificationScript != null)
            {
                notificationScript.SetupNotification(notification);
            }
            
            return notificationUI;
        }
        
        private IEnumerator AnimateNotificationIn(GameObject notificationUI)
        {
            var rectTransform = notificationUI.GetComponent<RectTransform>();
            if (rectTransform != null)
            {
                var originalPosition = rectTransform.anchoredPosition;
                rectTransform.anchoredPosition = new Vector2(originalPosition.x + 400f, originalPosition.y);
                
                var elapsedTime = 0f;
                while (elapsedTime < animationDuration)
                {
                    elapsedTime += Time.deltaTime;
                    var t = elapsedTime / animationDuration;
                    t = Mathf.SmoothStep(0f, 1f, t);
                    
                    rectTransform.anchoredPosition = Vector2.Lerp(
                        new Vector2(originalPosition.x + 400f, originalPosition.y),
                        originalPosition,
                        t
                    );
                    
                    yield return null;
                }
                
                rectTransform.anchoredPosition = originalPosition;
            }
        }
        
        private IEnumerator AnimateNotificationOut(GameObject notificationUI)
        {
            var rectTransform = notificationUI.GetComponent<RectTransform>();
            if (rectTransform != null)
            {
                var originalPosition = rectTransform.anchoredPosition;
                
                var elapsedTime = 0f;
                while (elapsedTime < animationDuration)
                {
                    elapsedTime += Time.deltaTime;
                    var t = elapsedTime / animationDuration;
                    t = Mathf.SmoothStep(0f, 1f, t);
                    
                    rectTransform.anchoredPosition = Vector2.Lerp(
                        originalPosition,
                        new Vector2(originalPosition.x + 400f, originalPosition.y),
                        t
                    );
                    
                    yield return null;
                }
            }
        }
        
        private void ProcessNotificationQueue()
        {
            if (!isShowingNotification && notificationQueue.Count > 0)
            {
                var notification = notificationQueue.Dequeue();
                ShowNotification(notification);
            }
        }
        
        private void PlayNotificationEffects(Notification notification)
        {
            if (enableSound)
            {
                PlayNotificationSound(notification.type);
            }
            
            if (enableVibration)
            {
                PlayNotificationVibration(notification.priority);
            }
        }
        
        private void PlayNotificationSound(NotificationType type)
        {
            if (Evergreen.Audio.AudioManager.Instance != null)
            {
                switch (type)
                {
                    case NotificationType.Achievement:
                        Evergreen.Audio.AudioManager.Instance.PlayAchievementSound();
                        break;
                    case NotificationType.Success:
                        Evergreen.Audio.AudioManager.Instance.PlayUISound("success");
                        break;
                    case NotificationType.Error:
                        Evergreen.Audio.AudioManager.Instance.PlayUISound("error");
                        break;
                    case NotificationType.Energy:
                        Evergreen.Audio.AudioManager.Instance.PlayUISound("energy_ready");
                        break;
                    default:
                        Evergreen.Audio.AudioManager.Instance.PlayNotificationSound();
                        break;
                }
            }
        }
        
        private void PlayNotificationVibration(NotificationPriority priority)
        {
            if (Evergreen.Settings.SettingsManager.Instance != null)
            {
                if (!Evergreen.Settings.SettingsManager.Instance.GetSettingBool("vibration"))
                    return;
            }
            
            switch (priority)
            {
                case NotificationPriority.Low:
                    Handheld.Vibrate();
                    break;
                case NotificationPriority.Normal:
                    Handheld.Vibrate();
                    break;
                case NotificationPriority.High:
                    Handheld.Vibrate();
                    break;
                case NotificationPriority.Critical:
                    Handheld.Vibrate();
                    break;
            }
        }
        
        private NotificationPriority GetDefaultPriority(NotificationType type)
        {
            switch (type)
            {
                case NotificationType.Error:
                case NotificationType.Critical:
                    return NotificationPriority.Critical;
                case NotificationType.Achievement:
                case NotificationType.Tournament:
                    return NotificationPriority.High;
                case NotificationType.Energy:
                case NotificationType.Gift:
                    return NotificationPriority.Normal;
                default:
                    return NotificationPriority.Low;
                }
        }
        
        private void UpdateNotificationUI()
        {
            if (notificationCountText != null)
            {
                int unreadCount = 0;
                foreach (var notification in notifications)
                {
                    if (!notification.isRead)
                        unreadCount++;
                }
                
                notificationCountText.text = unreadCount.ToString();
                notificationCountText.gameObject.SetActive(unreadCount > 0);
            }
        }
        
        public void ToggleNotificationPanel()
        {
            if (notificationPanel != null)
            {
                notificationPanel.SetActive(!notificationPanel.activeInHierarchy);
            }
        }
        
        public void ClearAllNotifications()
        {
            notifications.Clear();
            
            foreach (var notificationUI in notificationUIElements)
            {
                if (notificationUI != null)
                    Destroy(notificationUI);
            }
            notificationUIElements.Clear();
            
            UpdateNotificationUI();
        }
        
        public void MarkNotificationAsRead(string notificationId)
        {
            var notification = notifications.Find(n => n.id == notificationId);
            if (notification != null)
            {
                notification.isRead = true;
                UpdateNotificationUI();
            }
        }
        
        public void RemoveNotification(string notificationId)
        {
            var notification = notifications.Find(n => n.id == notificationId);
            if (notification != null)
            {
                notifications.Remove(notification);
                RemoveNotificationUI(notificationId);
                UpdateNotificationUI();
            }
        }
        
        private void RemoveNotificationUI(string notificationId)
        {
            var notificationUI = notificationUIElements.Find(ui => 
            {
                var script = ui.GetComponent<NotificationUI>();
                return script != null && script.GetNotificationId() == notificationId;
            });
            
            if (notificationUI != null)
            {
                notificationUIElements.Remove(notificationUI);
                Destroy(notificationUI);
            }
        }
        
        // Predefined notification methods
        public void ShowAchievementNotification(string achievementName)
        {
            ShowNotification("Achievement Unlocked!", achievementName, NotificationType.Achievement, 5f);
        }
        
        public void ShowLevelCompleteNotification(int level, int stars)
        {
            ShowNotification("Level Complete!", $"Level {level} completed with {stars} stars!", NotificationType.Success, 4f);
        }
        
        public void ShowEnergyReadyNotification()
        {
            ShowNotification("Energy Ready!", "Your energy has been restored!", NotificationType.Energy, 3f);
        }
        
        public void ShowGiftNotification(string senderName, string giftName)
        {
            ShowNotification("Gift Received!", $"{senderName} sent you {giftName}!", NotificationType.Gift, 4f);
        }
        
        public void ShowTournamentNotification(string tournamentName, string position)
        {
            ShowNotification("Tournament Result!", $"You finished #{position} in {tournamentName}!", NotificationType.Tournament, 5f);
        }
        
        public void ShowDailyRewardNotification(string rewardName)
        {
            ShowNotification("Daily Reward!", $"You received {rewardName}!", NotificationType.Daily, 3f);
        }
        
        public void ShowPurchaseNotification(string itemName, float price)
        {
            ShowNotification("Purchase Complete!", $"You bought {itemName} for ${price:F2}!", NotificationType.Purchase, 3f);
        }
        
        public void ShowErrorNotification(string errorMessage)
        {
            ShowNotification("Error", errorMessage, NotificationType.Error, 5f);
        }
        
        public void ShowWarningNotification(string warningMessage)
        {
            ShowNotification("Warning", warningMessage, NotificationType.Warning, 4f);
        }
        
        public void ShowInfoNotification(string infoMessage)
        {
            ShowNotification("Info", infoMessage, NotificationType.Info, 3f);
        }
        
        // Scheduled notifications
        public void ScheduleNotification(string title, string message, NotificationType type, float delay)
        {
            StartCoroutine(ScheduleNotificationCoroutine(title, message, type, delay));
        }
        
        private IEnumerator ScheduleNotificationCoroutine(string title, string message, NotificationType type, float delay)
        {
            yield return new WaitForSeconds(delay);
            ShowNotification(title, message, type);
        }
        
        // Push notifications
        public void SchedulePushNotification(string title, string message, float delay)
        {
            if (!enablePushNotifications) return;
            
            // Schedule push notification
            // This would integrate with Unity's local notification system
            Debug.Log($"Scheduling push notification: {title} - {message} in {delay} seconds");
        }
        
        private void CheckScheduledNotifications()
        {
            // Check for scheduled notifications that should be shown
            // This would check local notification system
        }
        
        private void TrackNotificationShown(Notification notification)
        {
            if (Evergreen.Analytics.EnhancedAnalytics.Instance != null)
            {
                Evergreen.Analytics.EnhancedAnalytics.Instance.TrackCustomEvent("notification_shown", new Dictionary<string, object>
                {
                    {"notification_id", notification.id},
                    {"notification_type", notification.type.ToString()},
                    {"notification_priority", notification.priority.ToString()},
                    {"is_persistent", notification.isPersistent}
                });
            }
        }
        
        private void LoadNotifications()
        {
            // Load persistent notifications from save data
            // This would load from PlayerPrefs or save file
        }
        
        private void SaveNotifications()
        {
            // Save persistent notifications
            // This would save to PlayerPrefs or save file
        }
        
        // Public getters
        public List<Notification> GetNotifications()
        {
            return new List<Notification>(notifications);
        }
        
        public int GetUnreadCount()
        {
            int count = 0;
            foreach (var notification in notifications)
            {
                if (!notification.isRead)
                    count++;
            }
            return count;
        }
        
        public bool HasUnreadNotifications()
        {
            return GetUnreadCount() > 0;
        }
        
        void OnApplicationPause(bool pauseStatus)
        {
            if (pauseStatus)
            {
                SaveNotifications();
            }
        }
        
        void OnApplicationFocus(bool hasFocus)
        {
            if (hasFocus)
            {
                CheckScheduledNotifications();
            }
        }
        
        private GameObject CreateFallbackNotification(Notification notification)
        {
            var fallbackObject = new GameObject($"Notification_{notification.id}");
            var canvas = fallbackObject.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 1000;
            
            var text = fallbackObject.AddComponent<UnityEngine.UI.Text>();
            text.text = notification.title;
            text.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
            text.fontSize = 16;
            text.color = Color.white;
            
            var rectTransform = fallbackObject.GetComponent<RectTransform>();
            rectTransform.sizeDelta = new Vector2(300, 50);
            rectTransform.anchoredPosition = new Vector2(0, 200);
            
            return fallbackObject;
        }
    }
}