using UnityEngine;
using Evergreen.Core;
using Evergreen.Economy;
using Evergreen.Monetization;
using Evergreen.Social;
using Evergreen.Analytics;

namespace Evergreen.Examples
{
    /// <summary>
    /// Example usage of ARPU maximization systems
    /// This shows how to integrate the systems into your game
    /// </summary>
    public class ARPUUsageExample : MonoBehaviour
    {
        [Header("Example Settings")]
        public string playerId = "player_123";
        public bool enableExamples = true;
        
        void Start()
        {
            if (enableExamples)
            {
                StartCoroutine(RunARPUExamples());
            }
        }
        
        private System.Collections.IEnumerator RunARPUExamples()
        {
            // Wait for systems to initialize
            yield return new WaitForSeconds(2f);
            
            // Example 1: Energy System Usage
            ExampleEnergySystem();
            
            yield return new WaitForSeconds(1f);
            
            // Example 2: Subscription System Usage
            ExampleSubscriptionSystem();
            
            yield return new WaitForSeconds(1f);
            
            // Example 3: Personalized Offers Usage
            ExamplePersonalizedOffers();
            
            yield return new WaitForSeconds(1f);
            
            // Example 4: Social Features Usage
            ExampleSocialFeatures();
            
            yield return new WaitForSeconds(1f);
            
            // Example 5: ARPU Analytics Usage
            ExampleARPUAnalytics();
        }
        
        private void ExampleEnergySystem()
        {
            var energySystem = EnergySystem.Instance;
            if (energySystem != null)
            {
                Debug.Log($"[ARPU Example] Energy System - Current: {energySystem.GetCurrentEnergy()}/{energySystem.GetMaxEnergy()}");
                
                // Check if player can play level
                if (!energySystem.CanPlayLevel())
                {
                    Debug.Log("[ARPU Example] Player needs energy! Showing energy purchase options...");
                    
                    // Show energy packs
                    var energyPacks = energySystem.GetAvailableEnergyPacks();
                    foreach (var pack in energyPacks)
                    {
                        Debug.Log($"[ARPU Example] Energy Pack: {pack.name} - {pack.energy} energy for {pack.cost} {pack.costType}");
                    }
                }
                else
                {
                    // Consume energy for level
                    energySystem.TryConsumeEnergy(1);
                    Debug.Log("[ARPU Example] Energy consumed for level play");
                }
            }
        }
        
        private void ExampleSubscriptionSystem()
        {
            var subscriptionSystem = SubscriptionSystem.Instance;
            if (subscriptionSystem != null)
            {
                // Check if player has active subscription
                if (!subscriptionSystem.HasActiveSubscription(playerId))
                {
                    Debug.Log("[ARPU Example] Player has no subscription. Showing subscription options...");
                    
                    // Show available subscription tiers
                    var tiers = subscriptionSystem.GetAvailableTiers();
                    foreach (var tier in tiers)
                    {
                        Debug.Log($"[ARPU Example] Subscription: {tier.name} - ${tier.price} for {tier.duration} days");
                    }
                    
                    // Start a subscription (example)
                    // subscriptionSystem.StartSubscription(playerId, "basic");
                }
                else
                {
                    var subscription = subscriptionSystem.GetPlayerSubscription(playerId);
                    Debug.Log($"[ARPU Example] Player has active subscription: {subscription.tierName}");
                }
            }
        }
        
        private void ExamplePersonalizedOffers()
        {
            var offerSystem = PersonalizedOfferSystem.Instance;
            if (offerSystem != null)
            {
                // Get personalized offers for player
                var offers = offerSystem.GetOffersForPlayer(playerId);
                Debug.Log($"[ARPU Example] Found {offers.Count} personalized offers for player");
                
                foreach (var offer in offers)
                {
                    Debug.Log($"[ARPU Example] Offer: {offer.name} - ${offer.personalizedPrice:F2} (was ${offer.originalPrice:F2}) - {offer.discount:P0} off");
                }
                
                // Purchase an offer (example)
                if (offers.Count > 0)
                {
                    // offerSystem.PurchaseOffer(offers[0].id, playerId);
                }
            }
        }
        
        private void ExampleSocialFeatures()
        {
            var socialSystem = SocialCompetitionSystem.Instance;
            if (socialSystem != null)
            {
                // Get leaderboard
                var leaderboard = socialSystem.GetLeaderboard(LeaderboardType.WeeklyScore, 5);
                Debug.Log($"[ARPU Example] Weekly Score Leaderboard:");
                
                for (int i = 0; i < leaderboard.Count; i++)
                {
                    var entry = leaderboard[i];
                    Debug.Log($"[ARPU Example] {i + 1}. {entry.playerName} - {entry.score} points");
                }
                
                // Get active challenges
                var challenges = socialSystem.GetActiveChallenges();
                Debug.Log($"[ARPU Example] Active challenges: {challenges.Count}");
                
                foreach (var challenge in challenges)
                {
                    Debug.Log($"[ARPU Example] Challenge: {challenge.type} - {challenge.participants.Count} participants");
                }
            }
        }
        
        private void ExampleARPUAnalytics()
        {
            var arpuAnalytics = ARPUAnalyticsSystem.Instance;
            if (arpuAnalytics != null)
            {
                // Track a revenue event
                arpuAnalytics.TrackRevenue(playerId, 4.99f, RevenueSource.IAP, "starter_pack");
                Debug.Log("[ARPU Example] Revenue event tracked: $4.99 IAP");
                
                // Track player action
                arpuAnalytics.TrackPlayerAction(playerId, "level_complete", new System.Collections.Generic.Dictionary<string, object>
                {
                    ["level_id"] = 1,
                    ["score"] = 1500,
                    ["moves"] = 25
                });
                Debug.Log("[ARPU Example] Player action tracked: level_complete");
                
                // Get ARPU report
                var report = arpuAnalytics.GetARPUReport();
                Debug.Log($"[ARPU Example] ARPU Report - Total Players: {report["total_players"]}, ARPU: ${report["arpu"]:F2}");
            }
        }
        
        // Example methods for UI integration
        public void OnEnergyButtonClicked()
        {
            var energySystem = EnergySystem.Instance;
            if (energySystem != null)
            {
                if (energySystem.CanWatchEnergyAd())
                {
                    energySystem.RefillEnergyWithAd();
                }
                else
                {
                    // Show energy packs UI
                    ShowEnergyPacksUI();
                }
            }
        }
        
        public void OnSubscriptionButtonClicked()
        {
            var subscriptionSystem = SubscriptionSystem.Instance;
            if (subscriptionSystem != null)
            {
                if (!subscriptionSystem.HasActiveSubscription(playerId))
                {
                    // Show subscription tiers UI
                    ShowSubscriptionUI();
                }
                else
                {
                    // Show subscription benefits UI
                    ShowSubscriptionBenefitsUI();
                }
            }
        }
        
        public void OnOffersButtonClicked()
        {
            var offerSystem = PersonalizedOfferSystem.Instance;
            if (offerSystem != null)
            {
                var offers = offerSystem.GetOffersForPlayer(playerId);
                // Show offers UI
                ShowOffersUI(offers);
            }
        }
        
        public void OnSocialButtonClicked()
        {
            var socialSystem = SocialCompetitionSystem.Instance;
            if (socialSystem != null)
            {
                // Show social features UI
                ShowSocialUI();
            }
        }
        
        private void ShowEnergyPacksUI()
        {
            Debug.Log("[ARPU Example] Showing Energy Packs UI");
            // Implement your UI here
        }
        
        private void ShowSubscriptionUI()
        {
            Debug.Log("[ARPU Example] Showing Subscription UI");
            // Implement your UI here
        }
        
        private void ShowSubscriptionBenefitsUI()
        {
            Debug.Log("[ARPU Example] Showing Subscription Benefits UI");
            // Implement your UI here
        }
        
        private void ShowOffersUI(System.Collections.Generic.List<PersonalizedOffer> offers)
        {
            Debug.Log($"[ARPU Example] Showing Offers UI with {offers.Count} offers");
            // Implement your UI here
        }
        
        private void ShowSocialUI()
        {
            Debug.Log("[ARPU Example] Showing Social UI");
            // Implement your UI here
        }
    }
}