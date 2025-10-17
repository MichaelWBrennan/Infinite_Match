using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Evergreen.Core;
using Evergreen.Economy;
using Evergreen.Monetization;
using Evergreen.Social;
using Evergreen.Analytics;

namespace Evergreen.Core
{
    /// <summary>
    /// ARPU Integration Manager
    /// Centralizes all ARPU maximization systems and ensures proper integration
    /// </summary>
    public class ARPUIntegrationManager : MonoBehaviour
    {
        [Header("ARPU Systems")]
        public bool enableEnergySystem = true;
        public bool enableSubscriptionSystem = true;
        public bool enablePersonalizedOffers = true;
        public bool enableSocialFeatures = true;
        public bool enableARPUAnalytics = true;
        public bool enableAdvancedMonetization = true;
        
        [Header("Integration Settings")]
        public float integrationCheckInterval = 60f; // 1 minute
        public bool enableCrossSystemOptimization = true;
        public bool enableRealTimeOptimization = true;
        
        private Coroutine _integrationCoroutine;
        private Dictionary<string, object> _systemStatus = new Dictionary<string, object>();
        
        // Events
        public static event Action<string, bool> OnSystemStatusChanged;
        public static event Action<Dictionary<string, object>> OnARPUOptimized;
        
        public static ARPUIntegrationManager Instance { get; private set; }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeARPUIntegration();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            StartIntegrationMonitoring();
        }
        
        private void InitializeARPUIntegration()
        {
            Debug.Log("ARPU Integration Manager initialized - All systems integrated for maximum revenue!");
            
            // Initialize system status
            _systemStatus["energy_system"] = false;
            _systemStatus["subscription_system"] = false;
            _systemStatus["personalized_offers"] = false;
            _systemStatus["social_features"] = false;
            _systemStatus["arpu_analytics"] = false;
            _systemStatus["advanced_monetization"] = false;
            
            // Check system availability
            CheckSystemAvailability();
        }
        
        private void StartIntegrationMonitoring()
        {
            _integrationCoroutine = StartCoroutine(IntegrationMonitoringCoroutine());
        }
        
        private IEnumerator IntegrationMonitoringCoroutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(integrationCheckInterval);
                
                CheckSystemAvailability();
                OptimizeARPU();
            }
        }
        
        private void CheckSystemAvailability()
        {
            // Check Energy System
            var energySystem = OptimizedGameSystem.Instance;
            _systemStatus["energy_system"] = energySystem != null && enableEnergySystem;
            
            // Check Subscription System
            var subscriptionSystem = SubscriptionSystem.Instance;
            _systemStatus["subscription_system"] = subscriptionSystem != null && enableSubscriptionSystem;
            
            // Check Personalized Offer System
            var offerSystem = PersonalizedOfferSystem.Instance;
            _systemStatus["personalized_offers"] = offerSystem != null && enablePersonalizedOffers;
            
            // Check Social Features
            var socialSystem = SocialCompetitionSystem.Instance;
            _systemStatus["social_features"] = socialSystem != null && enableSocialFeatures;
            
            // Check ARPU Analytics
            var arpuAnalytics = ARPUAnalyticsSystem.Instance;
            _systemStatus["arpu_analytics"] = arpuAnalytics != null && enableARPUAnalytics;
            
            // Check Advanced Monetization
            var monetizationSystem = AdvancedMonetizationSystem.Instance;
            _systemStatus["advanced_monetization"] = monetizationSystem != null && enableAdvancedMonetization;
            
            // Notify status changes
            foreach (var kvp in _systemStatus)
            {
                OnSystemStatusChanged?.Invoke(kvp.Key, (bool)kvp.Value);
            }
        }
        
        private void OptimizeARPU()
        {
            if (!enableCrossSystemOptimization) return;
            
            var optimizationData = new Dictionary<string, object>();
            
            // Energy System Optimization
            if ((bool)_systemStatus["energy_system"])
            {
                var energySystem = OptimizedGameSystem.Instance;
                if (energySystem != null)
                {
                    optimizationData["energy_level"] = energySystem.GetCurrentEnergy();
                    optimizationData["energy_max"] = energySystem.GetMaxEnergy();
                    optimizationData["energy_refill_progress"] = energySystem.GetEnergyRefillProgress();
                }
            }
            
            // Subscription System Optimization
            if ((bool)_systemStatus["subscription_system"])
            {
                var subscriptionSystem = SubscriptionSystem.Instance;
                if (subscriptionSystem != null)
                {
                    var stats = subscriptionSystem.GetSubscriptionStatistics();
                    optimizationData["subscription_stats"] = stats;
                }
            }
            
            // Personalized Offers Optimization
            if ((bool)_systemStatus["personalized_offers"])
            {
                var offerSystem = PersonalizedOfferSystem.Instance;
                if (offerSystem != null)
                {
                    var stats = offerSystem.GetOfferStatistics();
                    optimizationData["offer_stats"] = stats;
                }
            }
            
            // Social Features Optimization
            if ((bool)_systemStatus["social_features"])
            {
                var socialSystem = SocialCompetitionSystem.Instance;
                if (socialSystem != null)
                {
                    var stats = socialSystem.GetSocialStatistics();
                    optimizationData["social_stats"] = stats;
                }
            }
            
            // ARPU Analytics Optimization
            if ((bool)_systemStatus["arpu_analytics"])
            {
                var arpuAnalytics = ARPUAnalyticsSystem.Instance;
                if (arpuAnalytics != null)
                {
                    var report = arpuAnalytics.GetARPUReport();
                    optimizationData["arpu_report"] = report;
                }
            }
            
            // Advanced Monetization Optimization
            if ((bool)_systemStatus["advanced_monetization"])
            {
                var monetizationSystem = AdvancedMonetizationSystem.Instance;
                if (monetizationSystem != null)
                {
                    var stats = monetizationSystem.GetMonetizationStatistics();
                    optimizationData["monetization_stats"] = stats;
                }
            }
            
            // Apply cross-system optimizations
            ApplyCrossSystemOptimizations(optimizationData);
            
            OnARPUOptimized?.Invoke(optimizationData);
        }
        
        private void ApplyCrossSystemOptimizations(Dictionary<string, object> data)
        {
            // Energy-based offer optimization
            if (data.ContainsKey("energy_level") && data.ContainsKey("energy_max"))
            {
                var energyLevel = (int)data["energy_level"];
                var energyMax = (int)data["energy_max"];
                var energyPercentage = (float)energyLevel / energyMax;
                
                if (energyPercentage < 0.3f) // Low energy
                {
                    // Trigger energy-focused offers
                    TriggerEnergyOffers();
                }
            }
            
            // Subscription-based optimization
            if (data.ContainsKey("subscription_stats"))
            {
                var subscriptionStats = data["subscription_stats"] as Dictionary<string, object>;
                if (subscriptionStats != null)
                {
                    var activeSubscriptions = (int)subscriptionStats["active_subscriptions"];
                    if (activeSubscriptions < 10) // Low subscription count
                    {
                        // Trigger subscription-focused offers
                        TriggerSubscriptionOffers();
                    }
                }
            }
            
            // Social engagement optimization
            if (data.ContainsKey("social_stats"))
            {
                var socialStats = data["social_stats"] as Dictionary<string, object>;
                if (socialStats != null)
                {
                    var socialEngagement = (float)socialStats["social_engagement"];
                    if (socialEngagement < 0.5f) // Low social engagement
                    {
                        // Trigger social-focused features
                        TriggerSocialFeatures();
                    }
                }
            }
        }
        
        private void TriggerEnergyOffers()
        {
            // Trigger energy-focused offers when energy is low
            var offerSystem = PersonalizedOfferSystem.Instance;
            if (offerSystem != null)
            {
                // This would trigger energy-specific offers
                Debug.Log("Triggering energy-focused offers due to low energy");
            }
        }
        
        private void TriggerSubscriptionOffers()
        {
            // Trigger subscription-focused offers when subscription count is low
            var offerSystem = PersonalizedOfferSystem.Instance;
            if (offerSystem != null)
            {
                // This would trigger subscription-specific offers
                Debug.Log("Triggering subscription-focused offers due to low subscription count");
            }
        }
        
        private void TriggerSocialFeatures()
        {
            // Trigger social features when engagement is low
            var socialSystem = SocialCompetitionSystem.Instance;
            if (socialSystem != null)
            {
                // This would trigger social challenges or features
                Debug.Log("Triggering social features due to low engagement");
            }
        }
        
        public Dictionary<string, object> GetSystemStatus()
        {
            return new Dictionary<string, object>(_systemStatus);
        }
        
        public bool IsSystemActive(string systemName)
        {
            return _systemStatus.ContainsKey(systemName) && (bool)_systemStatus[systemName];
        }
        
        public void EnableSystem(string systemName, bool enabled)
        {
            if (_systemStatus.ContainsKey(systemName))
            {
                _systemStatus[systemName] = enabled;
                OnSystemStatusChanged?.Invoke(systemName, enabled);
            }
        }
        
        public Dictionary<string, object> GetARPUOptimizationReport()
        {
            var report = new Dictionary<string, object>
            {
                ["system_status"] = _systemStatus,
                ["active_systems"] = GetActiveSystemCount(),
                ["integration_health"] = GetIntegrationHealth(),
                ["optimization_enabled"] = enableCrossSystemOptimization,
                ["real_time_optimization"] = enableRealTimeOptimization
            };
            
            return report;
        }
        
        private int GetActiveSystemCount()
        {
            int count = 0;
            foreach (var status in _systemStatus.Values)
            {
                if ((bool)status) count++;
            }
            return count;
        }
        
        private float GetIntegrationHealth()
        {
            int totalSystems = _systemStatus.Count;
            int activeSystems = GetActiveSystemCount();
            return totalSystems > 0 ? (float)activeSystems / totalSystems : 0f;
        }
        
        void OnDestroy()
        {
            if (_integrationCoroutine != null)
            {
                StopCoroutine(_integrationCoroutine);
            }
        }
    }
}