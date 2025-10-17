using UnityEngine;
using UnityEngine.UI;
using Evergreen.Core;
using Evergreen.Economy;
using Evergreen.Monetization;
using Evergreen.Social;
using Evergreen.Analytics;
using System.Collections.Generic;

namespace Evergreen.UI
{
    /// <summary>
    /// Example UI integration for ARPU systems
    /// This shows how to integrate the ARPU systems into your UI
    /// </summary>
    public class ARPUUIExample : MonoBehaviour
    {
        [Header("UI References")]
        public Text energyText;
        public Text coinsText;
        public Text gemsText;
        public Button playButton;
        public Button energyButton;
        public Button subscriptionButton;
        public Button offersButton;
        public Button socialButton;
        public Transform offersContainer;
        public GameObject offerPrefab;
        
        [Header("Settings")]
        public string playerId = "player_123";
        public float updateInterval = 1f;
        
        private GameManager _gameManager;
        private float _updateTimer;
        
        void Start()
        {
            _gameManager = OptimizedCoreSystem.Instance;
            
            // Setup button listeners
            if (playButton != null)
                playButton.onClick.AddListener(OnPlayButtonClicked);
            
            if (energyButton != null)
                energyButton.onClick.AddListener(OnEnergyButtonClicked);
            
            if (subscriptionButton != null)
                subscriptionButton.onClick.AddListener(OnSubscriptionButtonClicked);
            
            if (offersButton != null)
                offersButton.onClick.AddListener(OnOffersButtonClicked);
            
            if (socialButton != null)
                socialButton.onClick.AddListener(OnSocialButtonClicked);
            
            // Initial update
            UpdateUI();
        }
        
        void Update()
        {
            _updateTimer += Time.deltaTime;
            if (_updateTimer >= updateInterval)
            {
                UpdateUI();
                _updateTimer = 0f;
            }
        }
        
        private void UpdateUI()
        {
            if (_gameManager == null) return;
            
            // Update energy display
            if (energyText != null)
            {
                var currentEnergy = _gameManager.GetCurrentEnergy();
                var maxEnergy = _gameManager.GetMaxEnergy();
                energyText.text = $"Energy: {currentEnergy}/{maxEnergy}";
            }
            
            // Update currency display
            if (coinsText != null)
            {
                var coins = _gameManager.GetCurrency("coins");
                coinsText.text = $"Coins: {coins:N0}";
            }
            
            if (gemsText != null)
            {
                var gems = _gameManager.GetCurrency("gems");
                gemsText.text = $"Gems: {gems:N0}";
            }
            
            // Update play button state
            if (playButton != null)
            {
                playButton.interactable = _gameManager.CanPlayLevel();
            }
        }
        
        private void OnPlayButtonClicked()
        {
            if (_gameManager.CanPlayLevel())
            {
                // Start level
                _gameManager.TryConsumeEnergy(1);
                _gameManager.TrackPlayerAction(playerId, "level_start", new Dictionary<string, object>
                {
                    ["source"] = "ui_button"
                });
                
                Debug.Log("Level started!");
            }
            else
            {
                // Show energy purchase options
                ShowEnergyPurchaseOptions();
            }
        }
        
        private void OnEnergyButtonClicked()
        {
            var energySystem = OptimizedGameSystem.Instance;
            if (energySystem != null)
            {
                if (energySystem.CanWatchEnergyAd())
                {
                    // Show rewarded ad for energy
                    energySystem.RefillEnergyWithAd();
                }
                else
                {
                    // Show energy packs
                    ShowEnergyPacks();
                }
            }
        }
        
        private void OnSubscriptionButtonClicked()
        {
            var subscriptionSystem = SubscriptionSystem.Instance;
            if (subscriptionSystem != null)
            {
                if (!subscriptionSystem.HasActiveSubscription(playerId))
                {
                    // Show subscription tiers
                    ShowSubscriptionTiers();
                }
                else
                {
                    // Show subscription benefits
                    ShowSubscriptionBenefits();
                }
            }
        }
        
        private void OnOffersButtonClicked()
        {
            var offers = _gameManager.GetPersonalizedOffers(playerId);
            ShowPersonalizedOffers(offers);
        }
        
        private void OnSocialButtonClicked()
        {
            var socialSystem = SocialCompetitionSystem.Instance;
            if (socialSystem != null)
            {
                // Show social features
                ShowSocialFeatures();
            }
        }
        
        private void ShowEnergyPurchaseOptions()
        {
            Debug.Log("Showing energy purchase options");
            // Implement your energy purchase UI here
        }
        
        private void ShowEnergyPacks()
        {
            var energySystem = OptimizedGameSystem.Instance;
            if (energySystem != null)
            {
                var packs = energySystem.GetAvailableEnergyPacks();
                Debug.Log($"Available energy packs: {packs.Length}");
                
                foreach (var pack in packs)
                {
                    Debug.Log($"Pack: {pack.name} - {pack.energy} energy for {pack.cost} {pack.costType}");
                }
            }
        }
        
        private void ShowSubscriptionTiers()
        {
            var subscriptionSystem = SubscriptionSystem.Instance;
            if (subscriptionSystem != null)
            {
                var tiers = subscriptionSystem.GetAvailableTiers();
                Debug.Log($"Available subscription tiers: {tiers.Length}");
                
                foreach (var tier in tiers)
                {
                    Debug.Log($"Tier: {tier.name} - ${tier.price} for {tier.duration} days");
                }
            }
        }
        
        private void ShowSubscriptionBenefits()
        {
            var subscriptionSystem = SubscriptionSystem.Instance;
            if (subscriptionSystem != null)
            {
                var subscription = subscriptionSystem.GetPlayerSubscription(playerId);
                if (subscription != null)
                {
                    Debug.Log($"Active subscription: {subscription.tierName}");
                    Debug.Log($"Benefits: {subscription.benefits.Count}");
                }
            }
        }
        
        private void ShowPersonalizedOffers(List<PersonalizedOffer> offers)
        {
            Debug.Log($"Personalized offers: {offers.Count}");
            
            // Clear existing offers
            if (offersContainer != null)
            {
                foreach (Transform child in offersContainer)
                {
                    Destroy(child.gameObject);
                }
            }
            
            // Create offer UI elements
            foreach (var offer in offers)
            {
                CreateOfferUI(offer);
            }
        }
        
        private void CreateOfferUI(PersonalizedOffer offer)
        {
            if (offerPrefab == null || offersContainer == null) return;
            
            var offerGO = Instantiate(offerPrefab, offersContainer);
            var offerText = offerGO.GetComponentInChildren<Text>();
            var offerButton = offerGO.GetComponentInChildren<Button>();
            
            if (offerText != null)
            {
                offerText.text = $"{offer.name}\n${offer.personalizedPrice:F2} (was ${offer.originalPrice:F2})\n{offer.discount:P0} off";
            }
            
            if (offerButton != null)
            {
                offerButton.onClick.AddListener(() => PurchaseOffer(offer));
            }
        }
        
        private void PurchaseOffer(PersonalizedOffer offer)
        {
            var offerSystem = PersonalizedOfferSystem.Instance;
            if (offerSystem != null)
            {
                bool success = offerSystem.PurchaseOffer(offer.id, playerId);
                if (success)
                {
                    Debug.Log($"Purchased offer: {offer.name}");
                    UpdateUI();
                }
                else
                {
                    Debug.Log("Failed to purchase offer");
                }
            }
        }
        
        private void ShowSocialFeatures()
        {
            var socialSystem = SocialCompetitionSystem.Instance;
            if (socialSystem != null)
            {
                // Show leaderboard
                var leaderboard = socialSystem.GetLeaderboard(LeaderboardType.WeeklyScore, 5);
                Debug.Log("Weekly Leaderboard:");
                
                for (int i = 0; i < leaderboard.Count; i++)
                {
                    var entry = leaderboard[i];
                    Debug.Log($"{i + 1}. {entry.playerName} - {entry.score} points");
                }
                
                // Show active challenges
                var challenges = socialSystem.GetActiveChallenges();
                Debug.Log($"Active challenges: {challenges.Count}");
            }
        }
    }
}