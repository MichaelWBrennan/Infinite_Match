using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Evergreen.Social;

namespace Evergreen.Social
{
    /// <summary>
    /// Social Media UI - Comprehensive UI system for social media integration
    /// Handles sharing interface, platform selection, and social features
    /// </summary>
    public class SocialMediaUI : MonoBehaviour
    {
        [Header("UI References")]
        public GameObject socialPanel;
        public GameObject sharePanel;
        public GameObject platformSelectionPanel;
        public GameObject analyticsPanel;
        public GameObject viralPanel;
        
        [Header("Platform Buttons")]
        public Button facebookButton;
        public Button twitterButton;
        public Button instagramButton;
        public Button tiktokButton;
        public Button youtubeButton;
        public Button discordButton;
        public Button linkedinButton;
        public Button redditButton;
        public Button whatsappButton;
        public Button telegramButton;
        public Button snapchatButton;
        public Button pinterestButton;
        public Button twitchButton;
        public Button steamButton;
        
        [Header("Share UI")]
        public TMP_InputField shareTextInput;
        public Button shareButton;
        public Button cancelButton;
        public Toggle includeScreenshotToggle;
        public Toggle includeScoreToggle;
        public Toggle includeLevelToggle;
        public Toggle includeAchievementToggle;
        
        [Header("Analytics UI")]
        public TextMeshProUGUI totalSharesText;
        public TextMeshProUGUI totalLikesText;
        public TextMeshProUGUI totalCommentsText;
        public TextMeshProUGUI viralPostsText;
        public TextMeshProUGUI engagementRateText;
        public Transform platformStatsContainer;
        public Transform hashtagStatsContainer;
        public Transform topPostsContainer;
        
        [Header("Viral UI")]
        public TextMeshProUGUI viralCountText;
        public TextMeshProUGUI viralRewardText;
        public Button claimViralRewardButton;
        public Transform viralPostsContainer;
        
        [Header("Platform Icons")]
        public Sprite facebookIcon;
        public Sprite twitterIcon;
        public Sprite instagramIcon;
        public Sprite tiktokIcon;
        public Sprite youtubeIcon;
        public Sprite discordIcon;
        public Sprite linkedinIcon;
        public Sprite redditIcon;
        public Sprite whatsappIcon;
        public Sprite telegramIcon;
        public Sprite snapchatIcon;
        public Sprite pinterestIcon;
        public Sprite twitchIcon;
        public Sprite steamIcon;
        
        [Header("Prefabs")]
        public GameObject platformButtonPrefab;
        public GameObject platformStatPrefab;
        public GameObject hashtagStatPrefab;
        public GameObject topPostPrefab;
        public GameObject viralPostPrefab;
        
        // References
        private SocialMediaManager socialManager;
        private GameManager gameManager;
        private Dictionary<string, Button> platformButtons = new Dictionary<string, Button>();
        private Dictionary<string, GameObject> platformStatItems = new Dictionary<string, GameObject>();
        private Dictionary<string, GameObject> hashtagStatItems = new Dictionary<string, GameObject>();
        private List<GameObject> topPostItems = new List<GameObject>();
        private List<GameObject> viralPostItems = new List<GameObject>();
        
        // State
        private string selectedPlatform = "all";
        private bool isSharing = false;
        private SocialAnalytics currentAnalytics;
        
        void Start()
        {
            InitializeUI();
            SetupEventListeners();
            UpdateUI();
        }
        
        /// <summary>
        /// Initialize UI
        /// </summary>
        private void InitializeUI()
        {
            // Get references
            socialManager = SocialMediaManager.Instance;
            gameManager = GameManager.Instance;
            
            // Initialize platform buttons
            InitializePlatformButtons();
            
            // Initialize panels
            if (socialPanel != null) socialPanel.SetActive(false);
            if (sharePanel != null) sharePanel.SetActive(false);
            if (platformSelectionPanel != null) platformSelectionPanel.SetActive(false);
            if (analyticsPanel != null) analyticsPanel.SetActive(false);
            if (viralPanel != null) viralPanel.SetActive(false);
            
            Debug.Log("📱 Social Media UI initialized");
        }
        
        /// <summary>
        /// Initialize platform buttons
        /// </summary>
        private void InitializePlatformButtons()
        {
            // Facebook
            if (facebookButton != null)
            {
                platformButtons["facebook"] = facebookButton;
                facebookButton.onClick.AddListener(() => SelectPlatform("facebook"));
            }
            
            // Twitter
            if (twitterButton != null)
            {
                platformButtons["twitter"] = twitterButton;
                twitterButton.onClick.AddListener(() => SelectPlatform("twitter"));
            }
            
            // Instagram
            if (instagramButton != null)
            {
                platformButtons["instagram"] = instagramButton;
                instagramButton.onClick.AddListener(() => SelectPlatform("instagram"));
            }
            
            // TikTok
            if (tiktokButton != null)
            {
                platformButtons["tiktok"] = tiktokButton;
                tiktokButton.onClick.AddListener(() => SelectPlatform("tiktok"));
            }
            
            // YouTube
            if (youtubeButton != null)
            {
                platformButtons["youtube"] = youtubeButton;
                youtubeButton.onClick.AddListener(() => SelectPlatform("youtube"));
            }
            
            // Discord
            if (discordButton != null)
            {
                platformButtons["discord"] = discordButton;
                discordButton.onClick.AddListener(() => SelectPlatform("discord"));
            }
            
            // LinkedIn
            if (linkedinButton != null)
            {
                platformButtons["linkedin"] = linkedinButton;
                linkedinButton.onClick.AddListener(() => SelectPlatform("linkedin"));
            }
            
            // Reddit
            if (redditButton != null)
            {
                platformButtons["reddit"] = redditButton;
                redditButton.onClick.AddListener(() => SelectPlatform("reddit"));
            }
            
            // WhatsApp
            if (whatsappButton != null)
            {
                platformButtons["whatsapp"] = whatsappButton;
                whatsappButton.onClick.AddListener(() => SelectPlatform("whatsapp"));
            }
            
            // Telegram
            if (telegramButton != null)
            {
                platformButtons["telegram"] = telegramButton;
                telegramButton.onClick.AddListener(() => SelectPlatform("telegram"));
            }
            
            // Snapchat
            if (snapchatButton != null)
            {
                platformButtons["snapchat"] = snapchatButton;
                snapchatButton.onClick.AddListener(() => SelectPlatform("snapchat"));
            }
            
            // Pinterest
            if (pinterestButton != null)
            {
                platformButtons["pinterest"] = pinterestButton;
                pinterestButton.onClick.AddListener(() => SelectPlatform("pinterest"));
            }
            
            // Twitch
            if (twitchButton != null)
            {
                platformButtons["twitch"] = twitchButton;
                twitchButton.onClick.AddListener(() => SelectPlatform("twitch"));
            }
            
            // Steam
            if (steamButton != null)
            {
                platformButtons["steam"] = steamButton;
                steamButton.onClick.AddListener(() => SelectPlatform("steam"));
            }
        }
        
        /// <summary>
        /// Setup event listeners
        /// </summary>
        private void SetupEventListeners()
        {
            // Share button
            if (shareButton != null)
            {
                shareButton.onClick.AddListener(OnShareButtonClicked);
            }
            
            // Cancel button
            if (cancelButton != null)
            {
                cancelButton.onClick.AddListener(OnCancelButtonClicked);
            }
            
            // Claim viral reward button
            if (claimViralRewardButton != null)
            {
                claimViralRewardButton.onClick.AddListener(OnClaimViralRewardClicked);
            }
            
            // Social manager events
            if (socialManager != null)
            {
                socialManager.OnPlatformConnected += OnPlatformConnected;
                socialManager.OnPostShared += OnPostShared;
                socialManager.OnViralAchievement += OnViralAchievement;
                socialManager.OnAnalyticsUpdated += OnAnalyticsUpdated;
            }
        }
        
        /// <summary>
        /// Update UI
        /// </summary>
        private void UpdateUI()
        {
            UpdatePlatformButtons();
            UpdateAnalyticsUI();
            UpdateViralUI();
        }
        
        /// <summary>
        /// Update platform buttons
        /// </summary>
        private void UpdatePlatformButtons()
        {
            if (socialManager == null) return;
            
            var availablePlatforms = socialManager.GetAvailablePlatforms();
            
            foreach (var button in platformButtons)
            {
                bool isAvailable = availablePlatforms.Contains(button.Key);
                button.Value.interactable = isAvailable;
                
                // Update visual state
                var image = button.Value.GetComponent<Image>();
                if (image != null)
                {
                    image.color = isAvailable ? Color.white : Color.gray;
                }
            }
        }
        
        /// <summary>
        /// Update analytics UI
        /// </summary>
        private void UpdateAnalyticsUI()
        {
            if (socialManager == null) return;
            
            currentAnalytics = socialManager.GetSocialAnalytics();
            
            // Update text fields
            if (totalSharesText != null)
                totalSharesText.text = currentAnalytics.totalShares.ToString();
            
            if (totalLikesText != null)
                totalLikesText.text = currentAnalytics.totalLikes.ToString();
            
            if (totalCommentsText != null)
                totalCommentsText.text = currentAnalytics.totalComments.ToString();
            
            if (viralPostsText != null)
                viralPostsText.text = currentAnalytics.viralPosts.ToString();
            
            if (engagementRateText != null)
                engagementRateText.text = (currentAnalytics.engagementRate * 100).ToString("F1") + "%";
            
            // Update platform stats
            UpdatePlatformStats();
            
            // Update hashtag stats
            UpdateHashtagStats();
            
            // Update top posts
            UpdateTopPosts();
        }
        
        /// <summary>
        /// Update platform stats
        /// </summary>
        private void UpdatePlatformStats()
        {
            if (platformStatsContainer == null) return;
            
            // Clear existing items
            foreach (var item in platformStatItems.Values)
            {
                if (item != null)
                {
                    Destroy(item);
                }
            }
            platformStatItems.Clear();
            
            // Create new items
            foreach (var stat in currentAnalytics.platformStats)
            {
                if (platformStatPrefab != null)
                {
                    GameObject item = Instantiate(platformStatPrefab, platformStatsContainer);
                    var text = item.GetComponentInChildren<TextMeshProUGUI>();
                    if (text != null)
                    {
                        text.text = $"{stat.Key}: {stat.Value}";
                    }
                    platformStatItems[stat.Key] = item;
                }
            }
        }
        
        /// <summary>
        /// Update hashtag stats
        /// </summary>
        private void UpdateHashtagStats()
        {
            if (hashtagStatsContainer == null) return;
            
            // Clear existing items
            foreach (var item in hashtagStatItems.Values)
            {
                if (item != null)
                {
                    Destroy(item);
                }
            }
            hashtagStatItems.Clear();
            
            // Create new items
            foreach (var stat in currentAnalytics.hashtagStats)
            {
                if (hashtagStatPrefab != null)
                {
                    GameObject item = Instantiate(hashtagStatPrefab, hashtagStatsContainer);
                    var text = item.GetComponentInChildren<TextMeshProUGUI>();
                    if (text != null)
                    {
                        text.text = $"{stat.Key}: {stat.Value}";
                    }
                    hashtagStatItems[stat.Key] = item;
                }
            }
        }
        
        /// <summary>
        /// Update top posts
        /// </summary>
        private void UpdateTopPosts()
        {
            if (topPostsContainer == null) return;
            
            // Clear existing items
            foreach (var item in topPostItems)
            {
                if (item != null)
                {
                    Destroy(item);
                }
            }
            topPostItems.Clear();
            
            // Create new items
            foreach (var post in currentAnalytics.topPosts)
            {
                if (topPostPrefab != null)
                {
                    GameObject item = Instantiate(topPostPrefab, topPostsContainer);
                    var texts = item.GetComponentsInChildren<TextMeshProUGUI>();
                    if (texts.Length >= 3)
                    {
                        texts[0].text = post.platform;
                        texts[1].text = post.content;
                        texts[2].text = $"Likes: {post.likes}, Shares: {post.shares}";
                    }
                    topPostItems.Add(item);
                }
            }
        }
        
        /// <summary>
        /// Update viral UI
        /// </summary>
        private void UpdateViralUI()
        {
            if (socialManager == null) return;
            
            var analytics = socialManager.GetSocialAnalytics();
            
            if (viralCountText != null)
                viralCountText.text = analytics.viralPosts.ToString();
            
            if (viralRewardText != null)
                viralRewardText.text = $"Reward: {analytics.viralPosts * 100} coins";
            
            if (claimViralRewardButton != null)
                claimViralRewardButton.interactable = analytics.viralPosts > 0;
        }
        
        /// <summary>
        /// Select platform
        /// </summary>
        private void SelectPlatform(string platform)
        {
            selectedPlatform = platform;
            
            // Update button visuals
            foreach (var button in platformButtons)
            {
                var image = button.Value.GetComponent<Image>();
                if (image != null)
                {
                    image.color = button.Key == platform ? Color.yellow : Color.white;
                }
            }
            
            Debug.Log($"📱 Selected platform: {platform}");
        }
        
        /// <summary>
        /// On share button clicked
        /// </summary>
        private void OnShareButtonClicked()
        {
            if (isSharing) return;
            
            StartCoroutine(ShareContent());
        }
        
        /// <summary>
        /// Share content coroutine
        /// </summary>
        private IEnumerator ShareContent()
        {
            isSharing = true;
            
            // Get share text
            string shareText = shareTextInput != null ? shareTextInput.text : "";
            
            // Add game info
            if (includeScoreToggle != null && includeScoreToggle.isOn)
            {
                if (gameManager != null)
                {
                    shareText += $"\nScore: {gameManager.playerScore}";
                }
            }
            
            if (includeLevelToggle != null && includeLevelToggle.isOn)
            {
                if (gameManager != null)
                {
                    shareText += $"\nLevel: {gameManager.currentLevel}";
                }
            }
            
            if (includeAchievementToggle != null && includeAchievementToggle.isOn)
            {
                shareText += $"\nAchievement unlocked!";
            }
            
            // Add hashtags
            shareText += $"\n{socialManager.gameHashtag}";
            
            // Share to selected platform
            if (selectedPlatform == "all")
            {
                var availablePlatforms = socialManager.GetAvailablePlatforms();
                foreach (var platform in availablePlatforms)
                {
                    socialManager.ShareContent(platform, shareText);
                    yield return new WaitForSeconds(0.5f);
                }
            }
            else
            {
                socialManager.ShareContent(selectedPlatform, shareText);
            }
            
            // Take screenshot if enabled
            if (includeScreenshotToggle != null && includeScreenshotToggle.isOn)
            {
                yield return StartCoroutine(TakeScreenshot());
            }
            
            isSharing = false;
            
            // Close share panel
            if (sharePanel != null)
            {
                sharePanel.SetActive(false);
            }
        }
        
        /// <summary>
        /// Take screenshot
        /// </summary>
        private IEnumerator TakeScreenshot()
        {
            yield return new WaitForEndOfFrame();
            
            // Capture screenshot
            Texture2D screenshot = new Texture2D(Screen.width, Screen.height, TextureFormat.RGB24, false);
            screenshot.ReadPixels(new Rect(0, 0, Screen.width, Screen.height), 0, 0);
            screenshot.Apply();
            
            // Share screenshot
            socialManager.ShareScreenshot(screenshot, "Check out my game progress!", selectedPlatform);
            
            // Clean up
            Destroy(screenshot);
        }
        
        /// <summary>
        /// On cancel button clicked
        /// </summary>
        private void OnCancelButtonClicked()
        {
            if (sharePanel != null)
            {
                sharePanel.SetActive(false);
            }
        }
        
        /// <summary>
        /// On claim viral reward clicked
        /// </summary>
        private void OnClaimViralRewardClicked()
        {
            if (socialManager == null) return;
            
            var analytics = socialManager.GetSocialAnalytics();
            if (analytics.viralPosts > 0)
            {
                // Give rewards
                if (gameManager != null)
                {
                    int coins = analytics.viralPosts * 100;
                    int gems = analytics.viralPosts * 10;
                    
                    gameManager.AddCoins(coins);
                    gameManager.AddGems(gems);
                    
                    Debug.Log($"🎉 Claimed viral rewards: {coins} coins, {gems} gems");
                }
            }
        }
        
        /// <summary>
        /// On platform connected
        /// </summary>
        private void OnPlatformConnected(string platform, bool connected)
        {
            UpdatePlatformButtons();
        }
        
        /// <summary>
        /// On post shared
        /// </summary>
        private void OnPostShared(string platform, SocialPost post)
        {
            UpdateAnalyticsUI();
        }
        
        /// <summary>
        /// On viral achievement
        /// </summary>
        private void OnViralAchievement(string platform, int engagement)
        {
            UpdateViralUI();
            
            // Show viral notification
            ShowViralNotification(platform, engagement);
        }
        
        /// <summary>
        /// On analytics updated
        /// </summary>
        private void OnAnalyticsUpdated(SocialAnalytics analytics)
        {
            UpdateAnalyticsUI();
        }
        
        /// <summary>
        /// Show viral notification
        /// </summary>
        private void ShowViralNotification(string platform, int engagement)
        {
            // Create viral notification UI
            GameObject notification = new GameObject("ViralNotification");
            notification.transform.SetParent(transform);
            
            // Add notification components
            var canvas = notification.AddComponent<Canvas>();
            canvas.overrideSorting = true;
            canvas.sortingOrder = 1000;
            
            var image = notification.AddComponent<Image>();
            image.color = new Color(1f, 0.5f, 0f, 0.8f);
            
            var text = notification.AddComponent<TextMeshProUGUI>();
            text.text = $"🔥 VIRAL! {platform} - {engagement} engagement!";
            text.fontSize = 24;
            text.color = Color.white;
            text.alignment = TextAlignmentOptions.Center;
            
            // Position notification
            var rectTransform = notification.GetComponent<RectTransform>();
            rectTransform.anchorMin = new Vector2(0.5f, 0.8f);
            rectTransform.anchorMax = new Vector2(0.5f, 0.8f);
            rectTransform.sizeDelta = new Vector2(400, 100);
            rectTransform.anchoredPosition = Vector2.zero;
            
            // Animate notification
            StartCoroutine(AnimateViralNotification(notification));
        }
        
        /// <summary>
        /// Animate viral notification
        /// </summary>
        private IEnumerator AnimateViralNotification(GameObject notification)
        {
            float duration = 3f;
            float elapsed = 0f;
            
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float alpha = Mathf.Lerp(1f, 0f, elapsed / duration);
                
                var image = notification.GetComponent<Image>();
                var text = notification.GetComponent<TextMeshProUGUI>();
                
                if (image != null)
                {
                    var color = image.color;
                    color.a = alpha;
                    image.color = color;
                }
                
                if (text != null)
                {
                    var color = text.color;
                    color.a = alpha;
                    text.color = color;
                }
                
                yield return null;
            }
            
            Destroy(notification);
        }
        
        /// <summary>
        /// Show social panel
        /// </summary>
        public void ShowSocialPanel()
        {
            if (socialPanel != null)
            {
                socialPanel.SetActive(true);
                UpdateUI();
            }
        }
        
        /// <summary>
        /// Hide social panel
        /// </summary>
        public void HideSocialPanel()
        {
            if (socialPanel != null)
            {
                socialPanel.SetActive(false);
            }
        }
        
        /// <summary>
        /// Show share panel
        /// </summary>
        public void ShowSharePanel()
        {
            if (sharePanel != null)
            {
                sharePanel.SetActive(true);
                
                // Set default share text
                if (shareTextInput != null)
                {
                    shareTextInput.text = socialManager.gameDescription;
                }
            }
        }
        
        /// <summary>
        /// Show analytics panel
        /// </summary>
        public void ShowAnalyticsPanel()
        {
            if (analyticsPanel != null)
            {
                analyticsPanel.SetActive(true);
                UpdateAnalyticsUI();
            }
        }
        
        /// <summary>
        /// Show viral panel
        /// </summary>
        public void ShowViralPanel()
        {
            if (viralPanel != null)
            {
                viralPanel.SetActive(true);
                UpdateViralUI();
            }
        }
        
        /// <summary>
        /// Quick share achievement
        /// </summary>
        public void QuickShareAchievement(string achievementName, int score)
        {
            socialManager.ShareAchievement(achievementName, score, selectedPlatform);
        }
        
        /// <summary>
        /// Quick share high score
        /// </summary>
        public void QuickShareHighScore(int score, int level)
        {
            socialManager.ShareHighScore(score, level, selectedPlatform);
        }
        
        /// <summary>
        /// Quick share level completion
        /// </summary>
        public void QuickShareLevelCompletion(int level, int moves)
        {
            socialManager.ShareLevelCompletion(level, moves, selectedPlatform);
        }
        
        /// <summary>
        /// Quick share power-up usage
        /// </summary>
        public void QuickSharePowerUpUsage(string powerUpName, int score)
        {
            socialManager.SharePowerUpUsage(powerUpName, score, selectedPlatform);
        }
    }
}