using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections.Generic;
using System.Linq;
using Evergreen.ARPU;

namespace Evergreen.UI
{
    /// <summary>
    /// Complete ARPU UI - All-in-one UI system for ARPU features
    /// Handles energy, subscriptions, offers, social, analytics, and retention UI
    /// </summary>
    public class CompleteARPUUI : MonoBehaviour
    {
        [Header("Main UI References")]
        public GameObject mainPanel;
        public GameObject energyPanel;
        public GameObject subscriptionPanel;
        public GameObject offersPanel;
        public GameObject socialPanel;
        public GameObject analyticsPanel;
        public GameObject retentionPanel;
        
        [Header("Energy UI")]
        public TextMeshProUGUI energyText;
        public Slider energySlider;
        public Button energyRefillButton;
        public Button energyAdButton;
        public Transform energyPacksContainer;
        public GameObject energyPackPrefab;
        
        [Header("Subscription UI")]
        public TextMeshProUGUI subscriptionStatusText;
        public Transform subscriptionTiersContainer;
        public GameObject subscriptionTierPrefab;
        public Button subscriptionButton;
        
        [Header("Offers UI")]
        public Transform offersContainer;
        public GameObject offerPrefab;
        public TextMeshProUGUI offersCountText;
        public Button refreshOffersButton;
        
        [Header("Social UI")]
        public Transform leaderboardContainer;
        public GameObject leaderboardEntryPrefab;
        public Transform guildsContainer;
        public GameObject guildPrefab;
        public Transform challengesContainer;
        public GameObject challengePrefab;
        public Button createGuildButton;
        public Button joinGuildButton;
        public Button startChallengeButton;
        
        [Header("Analytics UI")]
        public TextMeshProUGUI arpuText;
        public TextMeshProUGUI conversionRateText;
        public TextMeshProUGUI totalRevenueText;
        public TextMeshProUGUI playerCountText;
        public Transform revenueSourcesContainer;
        public GameObject revenueSourcePrefab;
        public Transform segmentsContainer;
        public GameObject segmentPrefab;
        
        [Header("Retention UI")]
        public TextMeshProUGUI streakText;
        public TextMeshProUGUI dailyTaskText;
        public Transform dailyTasksContainer;
        public GameObject dailyTaskPrefab;
        public Button claimDailyRewardButton;
        public TextMeshProUGUI dailyRewardText;
        
        [Header("Settings")]
        public string playerId = "player_123";
        public float updateInterval = 1f;
        public bool showDebugInfo = true;
        
        private CompleteARPUManager _arpuManager;
        private float _updateTimer;
        private Dictionary<string, GameObject> _activeUIElements = new Dictionary<string, GameObject>();
        
        void Start()
        {
            _arpuManager = CompleteARPUManager.Instance;
            
            if (_arpuManager == null)
            {
                Debug.LogError("CompleteARPUManager not found! Make sure it's initialized.");
                return;
            }
            
            SetupUI();
            SetupButtonListeners();
            UpdateAllUI();
        }
        
        void Update()
        {
            _updateTimer += Time.deltaTime;
            if (_updateTimer >= updateInterval)
            {
                UpdateAllUI();
                _updateTimer = 0f;
            }
        }
        
        private void SetupUI()
        {
            // Initialize all panels
            if (mainPanel != null) mainPanel.SetActive(true);
            if (energyPanel != null) energyPanel.SetActive(false);
            if (subscriptionPanel != null) subscriptionPanel.SetActive(false);
            if (offersPanel != null) offersPanel.SetActive(false);
            if (socialPanel != null) socialPanel.SetActive(false);
            if (analyticsPanel != null) analyticsPanel.SetActive(false);
            if (retentionPanel != null) retentionPanel.SetActive(false);
        }
        
        private void SetupButtonListeners()
        {
            // Energy UI
            if (energyRefillButton != null)
                energyRefillButton.onClick.AddListener(OnEnergyRefillClicked);
            if (energyAdButton != null)
                energyAdButton.onClick.AddListener(OnEnergyAdClicked);
            
            // Subscription UI
            if (subscriptionButton != null)
                subscriptionButton.onClick.AddListener(OnSubscriptionClicked);
            
            // Offers UI
            if (refreshOffersButton != null)
                refreshOffersButton.onClick.AddListener(OnRefreshOffersClicked);
            
            // Social UI
            if (createGuildButton != null)
                createGuildButton.onClick.AddListener(OnCreateGuildClicked);
            if (joinGuildButton != null)
                joinGuildButton.onClick.AddListener(OnJoinGuildClicked);
            if (startChallengeButton != null)
                startChallengeButton.onClick.AddListener(OnStartChallengeClicked);
            
            // Retention UI
            if (claimDailyRewardButton != null)
                claimDailyRewardButton.onClick.AddListener(OnClaimDailyRewardClicked);
        }
        
        private void UpdateAllUI()
        {
            UpdateEnergyUI();
            UpdateSubscriptionUI();
            UpdateOffersUI();
            UpdateSocialUI();
            UpdateAnalyticsUI();
            UpdateRetentionUI();
        }
        
        private void UpdateEnergyUI()
        {
            if (_arpuManager == null) return;
            
            var currentEnergy = _arpuManager.GetCurrentEnergy(playerId);
            var maxEnergy = _arpuManager.GetMaxEnergy(playerId);
            var energyPercentage = (float)currentEnergy / maxEnergy;
            
            // Update energy text
            if (energyText != null)
            {
                energyText.text = $"Energy: {currentEnergy}/{maxEnergy}";
            }
            
            // Update energy slider
            if (energySlider != null)
            {
                energySlider.value = energyPercentage;
            }
            
            // Update energy refill button
            if (energyRefillButton != null)
            {
                energyRefillButton.interactable = currentEnergy < maxEnergy;
            }
            
            // Update energy ad button
            if (energyAdButton != null)
            {
                energyAdButton.interactable = currentEnergy < maxEnergy;
            }
            
            // Update energy packs
            UpdateEnergyPacks();
        }
        
        private void UpdateEnergyPacks()
        {
            if (energyPacksContainer == null || energyPackPrefab == null) return;
            
            // Clear existing packs
            foreach (Transform child in energyPacksContainer)
            {
                Destroy(child.gameObject);
            }
            
            // Create energy pack UI elements
            var energyPacks = new[]
            {
                new { id = "energy_small", name = "Energy Boost", energy = 10, cost = 5, costType = "gems" },
                new { id = "energy_medium", name = "Energy Surge", energy = 25, cost = 10, costType = "gems" },
                new { id = "energy_large", name = "Energy Rush", energy = 50, cost = 18, costType = "gems" },
                new { id = "energy_ultimate", name = "Unlimited Energy", energy = 999, cost = 50, costType = "gems" }
            };
            
            foreach (var pack in energyPacks)
            {
                var packGO = Instantiate(energyPackPrefab, energyPacksContainer);
                var packText = packGO.GetComponentInChildren<TextMeshProUGUI>();
                var packButton = packGO.GetComponentInChildren<Button>();
                
                if (packText != null)
                {
                    packText.text = $"{pack.name}\n{pack.energy} Energy\n{pack.cost} {pack.costType}";
                }
                
                if (packButton != null)
                {
                    packButton.onClick.AddListener(() => PurchaseEnergyPack(pack.id));
                }
            }
        }
        
        private void UpdateSubscriptionUI()
        {
            if (_arpuManager == null) return;
            
            var hasSubscription = _arpuManager.HasActiveSubscription(playerId);
            
            // Update subscription status
            if (subscriptionStatusText != null)
            {
                subscriptionStatusText.text = hasSubscription ? "Active Subscription" : "No Subscription";
            }
            
            // Update subscription button
            if (subscriptionButton != null)
            {
                subscriptionButton.GetComponentInChildren<TextMeshProUGUI>().text = hasSubscription ? "Manage Subscription" : "Get Subscription";
            }
            
            // Update subscription tiers
            UpdateSubscriptionTiers();
        }
        
        private void UpdateSubscriptionTiers()
        {
            if (subscriptionTiersContainer == null || subscriptionTierPrefab == null) return;
            
            // Clear existing tiers
            foreach (Transform child in subscriptionTiersContainer)
            {
                Destroy(child.gameObject);
            }
            
            // Create subscription tier UI elements
            var tiers = new[]
            {
                new { id = "basic", name = "Basic Pass", price = 4.99f, description = "1.5x Energy, 1.2x Coins, Daily 100 Coins" },
                new { id = "premium", name = "Premium Pass", price = 9.99f, description = "2x Energy, 1.5x Coins, 1.3x Gems, Daily 200 Coins + 10 Gems" },
                new { id = "ultimate", name = "Ultimate Pass", price = 19.99f, description = "Unlimited Energy, 2x Coins, 1.5x Gems, Daily 500 Coins + 25 Gems" }
            };
            
            foreach (var tier in tiers)
            {
                var tierGO = Instantiate(subscriptionTierPrefab, subscriptionTiersContainer);
                var tierText = tierGO.GetComponentInChildren<TextMeshProUGUI>();
                var tierButton = tierGO.GetComponentInChildren<Button>();
                
                if (tierText != null)
                {
                    tierText.text = $"{tier.name}\n${tier.price:F2}\n{tier.description}";
                }
                
                if (tierButton != null)
                {
                    tierButton.onClick.AddListener(() => PurchaseSubscription(tier.id));
                }
            }
        }
        
        private void UpdateOffersUI()
        {
            if (_arpuManager == null) return;
            
            var offers = _arpuManager.GetPersonalizedOffers(playerId);
            
            // Update offers count
            if (offersCountText != null)
            {
                offersCountText.text = $"Active Offers: {offers.Count}";
            }
            
            // Update offers container
            if (offersContainer != null && offerPrefab != null)
            {
                // Clear existing offers
                foreach (Transform child in offersContainer)
                {
                    Destroy(child.gameObject);
                }
                
                // Create offer UI elements
                foreach (var offer in offers)
                {
                    var offerGO = Instantiate(offerPrefab, offersContainer);
                    var offerText = offerGO.GetComponentInChildren<TextMeshProUGUI>();
                    var offerButton = offerGO.GetComponentInChildren<Button>();
                    
                    if (offerText != null)
                    {
                        offerText.text = $"{offer.name}\n${offer.personalizedPrice:F2} (was ${offer.originalPrice:F2})\n{offer.discount:P0} off";
                    }
                    
                    if (offerButton != null)
                    {
                        offerButton.onClick.AddListener(() => PurchaseOffer(offer.id));
                    }
                }
            }
        }
        
        private void UpdateSocialUI()
        {
            if (_arpuManager == null) return;
            
            // Update leaderboard
            UpdateLeaderboard();
            
            // Update guilds
            UpdateGuilds();
            
            // Update challenges
            UpdateChallenges();
        }
        
        private void UpdateLeaderboard()
        {
            if (leaderboardContainer == null || leaderboardEntryPrefab == null) return;
            
            // Clear existing entries
            foreach (Transform child in leaderboardContainer)
            {
                Destroy(child.gameObject);
            }
            
            // Get leaderboard data
            var leaderboard = _arpuManager.GetLeaderboard("weekly_score", 10);
            
            // Create leaderboard entry UI elements
            for (int i = 0; i < leaderboard.Count; i++)
            {
                var entry = leaderboard[i];
                var entryGO = Instantiate(leaderboardEntryPrefab, leaderboardContainer);
                var entryText = entryGO.GetComponentInChildren<TextMeshProUGUI>();
                
                if (entryText != null)
                {
                    entryText.text = $"{i + 1}. {entry.playerName} - {entry.score:N0}";
                }
            }
        }
        
        private void UpdateGuilds()
        {
            if (guildsContainer == null || guildPrefab == null) return;
            
            // Clear existing guilds
            foreach (Transform child in guildsContainer)
            {
                Destroy(child.gameObject);
            }
            
            // Create guild UI elements (placeholder)
            var guilds = new[]
            {
                new { name = "Dragon Slayers", members = 25, level = 3 },
                new { name = "Crystal Collectors", members = 18, level = 2 },
                new { name = "Match Masters", members = 32, level = 4 }
            };
            
            foreach (var guild in guilds)
            {
                var guildGO = Instantiate(guildPrefab, guildsContainer);
                var guildText = guildGO.GetComponentInChildren<TextMeshProUGUI>();
                var guildButton = guildGO.GetComponentInChildren<Button>();
                
                if (guildText != null)
                {
                    guildText.text = $"{guild.name}\nLevel {guild.level} - {guild.members} members";
                }
                
                if (guildButton != null)
                {
                    guildButton.onClick.AddListener(() => JoinGuild(guild.name));
                }
            }
        }
        
        private void UpdateChallenges()
        {
            if (challengesContainer == null || challengePrefab == null) return;
            
            // Clear existing challenges
            foreach (Transform child in challengesContainer)
            {
                Destroy(child.gameObject);
            }
            
            // Create challenge UI elements (placeholder)
            var challenges = new[]
            {
                new { name = "Weekly Score Challenge", participants = 45, reward = "500 Coins" },
                new { name = "Level Race", participants = 23, reward = "200 Gems" },
                new { name = "Collection Challenge", participants = 67, reward = "1000 Coins" }
            };
            
            foreach (var challenge in challenges)
            {
                var challengeGO = Instantiate(challengePrefab, challengesContainer);
                var challengeText = challengeGO.GetComponentInChildren<TextMeshProUGUI>();
                var challengeButton = challengeGO.GetComponentInChildren<Button>();
                
                if (challengeText != null)
                {
                    challengeText.text = $"{challenge.name}\n{challenge.participants} participants\nReward: {challenge.reward}";
                }
                
                if (challengeButton != null)
                {
                    challengeButton.onClick.AddListener(() => JoinChallenge(challenge.name));
                }
            }
        }
        
        private void UpdateAnalyticsUI()
        {
            if (_arpuManager == null) return;
            
            var report = _arpuManager.GetARPUReport();
            
            // Update ARPU text
            if (arpuText != null)
            {
                var arpu = report.ContainsKey("arpu") ? (float)report["arpu"] : 0f;
                arpuText.text = $"ARPU: ${arpu:F2}";
            }
            
            // Update conversion rate text
            if (conversionRateText != null)
            {
                var conversionRate = report.ContainsKey("conversion_rate") ? (float)report["conversion_rate"] : 0f;
                conversionRateText.text = $"Conversion: {conversionRate:F1}%";
            }
            
            // Update total revenue text
            if (totalRevenueText != null)
            {
                var totalRevenue = report.ContainsKey("total_revenue") ? (float)report["total_revenue"] : 0f;
                totalRevenueText.text = $"Revenue: ${totalRevenue:N0}";
            }
            
            // Update player count text
            if (playerCountText != null)
            {
                var totalPlayers = report.ContainsKey("total_players") ? (int)report["total_players"] : 0;
                var payingPlayers = report.ContainsKey("paying_players") ? (int)report["paying_players"] : 0;
                playerCountText.text = $"Players: {totalPlayers} ({payingPlayers} paying)";
            }
            
            // Update revenue sources
            UpdateRevenueSources(report);
            
            // Update segments
            UpdateSegments(report);
        }
        
        private void UpdateRevenueSources(Dictionary<string, object> report)
        {
            if (revenueSourcesContainer == null || revenueSourcePrefab == null) return;
            
            // Clear existing sources
            foreach (Transform child in revenueSourcesContainer)
            {
                Destroy(child.gameObject);
            }
            
            // Get revenue sources
            var revenueSources = report.ContainsKey("revenue_sources") ? 
                (Dictionary<string, float>)report["revenue_sources"] : new Dictionary<string, float>();
            
            // Create revenue source UI elements
            foreach (var source in revenueSources)
            {
                var sourceGO = Instantiate(revenueSourcePrefab, revenueSourcesContainer);
                var sourceText = sourceGO.GetComponentInChildren<TextMeshProUGUI>();
                
                if (sourceText != null)
                {
                    sourceText.text = $"{source.Key}: {source.Value:F1}%";
                }
            }
        }
        
        private void UpdateSegments(Dictionary<string, object> report)
        {
            if (segmentsContainer == null || segmentPrefab == null) return;
            
            // Clear existing segments
            foreach (Transform child in segmentsContainer)
            {
                Destroy(child.gameObject);
            }
            
            // Get segment distribution
            var segments = report.ContainsKey("segment_distribution") ? 
                (Dictionary<string, int>)report["segment_distribution"] : new Dictionary<string, int>();
            
            // Create segment UI elements
            foreach (var segment in segments)
            {
                var segmentGO = Instantiate(segmentPrefab, segmentsContainer);
                var segmentText = segmentGO.GetComponentInChildren<TextMeshProUGUI>();
                
                if (segmentText != null)
                {
                    segmentText.text = $"{segment.Key}: {segment.Value} players";
                }
            }
        }
        
        private void UpdateRetentionUI()
        {
            if (_arpuManager == null) return;
            
            var profile = _arpuManager.GetPlayerProfile(playerId);
            
            // Update streak text
            if (streakText != null)
            {
                streakText.text = $"Current Streak: {profile.weeklyScore} days";
            }
            
            // Update daily task text
            if (dailyTaskText != null)
            {
                dailyTaskText.text = "Complete daily tasks to earn rewards!";
            }
            
            // Update daily tasks
            UpdateDailyTasks();
            
            // Update daily reward
            UpdateDailyReward();
        }
        
        private void UpdateDailyTasks()
        {
            if (dailyTasksContainer == null || dailyTaskPrefab == null) return;
            
            // Clear existing tasks
            foreach (Transform child in dailyTasksContainer)
            {
                Destroy(child.gameObject);
            }
            
            // Create daily task UI elements (placeholder)
            var tasks = new[]
            {
                new { name = "Play 3 Levels", progress = "2/3", reward = "100 Coins" },
                new { name = "Use 5 Boosters", progress = "3/5", reward = "50 Gems" },
                new { name = "Complete 1 Challenge", progress = "0/1", reward = "200 Coins" }
            };
            
            foreach (var task in tasks)
            {
                var taskGO = Instantiate(dailyTaskPrefab, dailyTasksContainer);
                var taskText = taskGO.GetComponentInChildren<TextMeshProUGUI>();
                var taskButton = taskGO.GetComponentInChildren<Button>();
                
                if (taskText != null)
                {
                    taskText.text = $"{task.name}\n{task.progress}\nReward: {task.reward}";
                }
                
                if (taskButton != null)
                {
                    taskButton.onClick.AddListener(() => CompleteTask(task.name));
                }
            }
        }
        
        private void UpdateDailyReward()
        {
            if (dailyRewardText != null)
            {
                dailyRewardText.text = "Daily Reward Available!";
            }
            
            if (claimDailyRewardButton != null)
            {
                claimDailyRewardButton.interactable = true;
            }
        }
        
        // Button Event Handlers
        
        private void OnEnergyRefillClicked()
        {
            Debug.Log("Energy refill clicked");
            // Implement energy refill logic
        }
        
        private void OnEnergyAdClicked()
        {
            Debug.Log("Energy ad clicked");
            // Implement energy ad logic
        }
        
        private void OnSubscriptionClicked()
        {
            Debug.Log("Subscription clicked");
            // Toggle subscription panel
            if (subscriptionPanel != null)
            {
                subscriptionPanel.SetActive(!subscriptionPanel.activeSelf);
            }
        }
        
        private void OnRefreshOffersClicked()
        {
            Debug.Log("Refresh offers clicked");
            UpdateOffersUI();
        }
        
        private void OnCreateGuildClicked()
        {
            Debug.Log("Create guild clicked");
            // Implement guild creation logic
        }
        
        private void OnJoinGuildClicked()
        {
            Debug.Log("Join guild clicked");
            // Implement guild joining logic
        }
        
        private void OnStartChallengeClicked()
        {
            Debug.Log("Start challenge clicked");
            // Implement challenge starting logic
        }
        
        private void OnClaimDailyRewardClicked()
        {
            Debug.Log("Claim daily reward clicked");
            // Implement daily reward claiming logic
        }
        
        // Purchase Methods
        
        private void PurchaseEnergyPack(string packId)
        {
            Debug.Log($"Purchase energy pack: {packId}");
            // Implement energy pack purchase logic
        }
        
        private void PurchaseSubscription(string tierId)
        {
            Debug.Log($"Purchase subscription: {tierId}");
            // Implement subscription purchase logic
        }
        
        private void PurchaseOffer(string offerId)
        {
            if (_arpuManager != null)
            {
                bool success = _arpuManager.PurchaseOffer(playerId, offerId);
                if (success)
                {
                    Debug.Log($"Purchased offer: {offerId}");
                    UpdateOffersUI();
                }
                else
                {
                    Debug.Log("Failed to purchase offer");
                }
            }
        }
        
        private void JoinGuild(string guildName)
        {
            Debug.Log($"Join guild: {guildName}");
            // Implement guild joining logic
        }
        
        private void JoinChallenge(string challengeName)
        {
            Debug.Log($"Join challenge: {challengeName}");
            // Implement challenge joining logic
        }
        
        private void CompleteTask(string taskName)
        {
            Debug.Log($"Complete task: {taskName}");
            // Implement task completion logic
        }
        
        // Panel Toggle Methods
        
        public void ToggleEnergyPanel()
        {
            if (energyPanel != null)
            {
                energyPanel.SetActive(!energyPanel.activeSelf);
            }
        }
        
        public void ToggleSubscriptionPanel()
        {
            if (subscriptionPanel != null)
            {
                subscriptionPanel.SetActive(!subscriptionPanel.activeSelf);
            }
        }
        
        public void ToggleOffersPanel()
        {
            if (offersPanel != null)
            {
                offersPanel.SetActive(!offersPanel.activeSelf);
            }
        }
        
        public void ToggleSocialPanel()
        {
            if (socialPanel != null)
            {
                socialPanel.SetActive(!socialPanel.activeSelf);
            }
        }
        
        public void ToggleAnalyticsPanel()
        {
            if (analyticsPanel != null)
            {
                analyticsPanel.SetActive(!analyticsPanel.activeSelf);
            }
        }
        
        public void ToggleRetentionPanel()
        {
            if (retentionPanel != null)
            {
                retentionPanel.SetActive(!retentionPanel.activeSelf);
            }
        }
    }
}