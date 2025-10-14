using System.Collections;
using UnityEngine;
using Evergreen.Core;
using Evergreen.Economy;
using Evergreen.Monetization;
using Evergreen.Social;
using Evergreen.Analytics;

namespace Evergreen.Core
{
    /// <summary>
    /// ARPU Initializer - Sets up all ARPU maximization systems in Unity
    /// Call this from your main GameManager or scene initialization
    /// </summary>
    public class ARPUInitializer : MonoBehaviour
    {
        [Header("ARPU Systems to Initialize")]
        public bool initializeEnergySystem = true;
        public bool initializeSubscriptionSystem = true;
        public bool initializePersonalizedOffers = true;
        public bool initializeSocialFeatures = true;
        public bool initializeARPUAnalytics = true;
        public bool initializeAdvancedMonetization = true;
        public bool initializeRetentionSystem = true;
        
        [Header("Initialization Settings")]
        public float initializationDelay = 1f;
        public bool initializeOnStart = true;
        public bool showDebugLogs = true;
        
        private bool _isInitialized = false;
        
        void Start()
        {
            if (initializeOnStart)
            {
                StartCoroutine(InitializeARPUSystems());
            }
        }
        
        public IEnumerator InitializeARPUSystems()
        {
            if (_isInitialized)
            {
                if (showDebugLogs)
                    Debug.Log("[ARPUInitializer] Systems already initialized");
                yield break;
            }
            
            if (showDebugLogs)
                Debug.Log("[ARPUInitializer] Starting ARPU system initialization...");
            
            yield return new WaitForSeconds(initializationDelay);
            
            // Initialize Energy System
            if (initializeEnergySystem)
            {
                yield return StartCoroutine(InitializeEnergySystem());
            }
            
            // Initialize Subscription System
            if (initializeSubscriptionSystem)
            {
                yield return StartCoroutine(InitializeSubscriptionSystem());
            }
            
            // Initialize Personalized Offer System
            if (initializePersonalizedOffers)
            {
                yield return StartCoroutine(InitializePersonalizedOffers());
            }
            
            // Initialize Social Features
            if (initializeSocialFeatures)
            {
                yield return StartCoroutine(InitializeSocialFeatures());
            }
            
            // Initialize ARPU Analytics
            if (initializeARPUAnalytics)
            {
                yield return StartCoroutine(InitializeARPUAnalytics());
            }
            
            // Initialize Advanced Monetization
            if (initializeAdvancedMonetization)
            {
                yield return StartCoroutine(InitializeAdvancedMonetization());
            }
            
            // Initialize Retention System
            if (initializeRetentionSystem)
            {
                yield return StartCoroutine(InitializeRetentionSystem());
            }
            
            // Initialize Integration Manager
            yield return StartCoroutine(InitializeIntegrationManager());
            
            _isInitialized = true;
            
            if (showDebugLogs)
                Debug.Log("[ARPUInitializer] All ARPU systems initialized successfully!");
        }
        
        private IEnumerator InitializeEnergySystem()
        {
            if (showDebugLogs)
                Debug.Log("[ARPUInitializer] Initializing Energy System...");
            
            var energySystemGO = new GameObject("EnergySystem");
            energySystemGO.AddComponent<EnergySystem>();
            DontDestroyOnLoad(energySystemGO);
            
            yield return new WaitForEndOfFrame();
            
            if (showDebugLogs)
                Debug.Log("[ARPUInitializer] Energy System initialized");
        }
        
        private IEnumerator InitializeSubscriptionSystem()
        {
            if (showDebugLogs)
                Debug.Log("[ARPUInitializer] Initializing Subscription System...");
            
            var subscriptionSystemGO = new GameObject("SubscriptionSystem");
            subscriptionSystemGO.AddComponent<SubscriptionSystem>();
            DontDestroyOnLoad(subscriptionSystemGO);
            
            yield return new WaitForEndOfFrame();
            
            if (showDebugLogs)
                Debug.Log("[ARPUInitializer] Subscription System initialized");
        }
        
        private IEnumerator InitializePersonalizedOffers()
        {
            if (showDebugLogs)
                Debug.Log("[ARPUInitializer] Initializing Personalized Offer System...");
            
            var offerSystemGO = new GameObject("PersonalizedOfferSystem");
            offerSystemGO.AddComponent<PersonalizedOfferSystem>();
            DontDestroyOnLoad(offerSystemGO);
            
            yield return new WaitForEndOfFrame();
            
            if (showDebugLogs)
                Debug.Log("[ARPUInitializer] Personalized Offer System initialized");
        }
        
        private IEnumerator InitializeSocialFeatures()
        {
            if (showDebugLogs)
                Debug.Log("[ARPUInitializer] Initializing Social Features...");
            
            var socialSystemGO = new GameObject("SocialCompetitionSystem");
            socialSystemGO.AddComponent<SocialCompetitionSystem>();
            DontDestroyOnLoad(socialSystemGO);
            
            yield return new WaitForEndOfFrame();
            
            if (showDebugLogs)
                Debug.Log("[ARPUInitializer] Social Features initialized");
        }
        
        private IEnumerator InitializeARPUAnalytics()
        {
            if (showDebugLogs)
                Debug.Log("[ARPUInitializer] Initializing ARPU Analytics...");
            
            var analyticsSystemGO = new GameObject("ARPUAnalyticsSystem");
            analyticsSystemGO.AddComponent<ARPUAnalyticsSystem>();
            DontDestroyOnLoad(analyticsSystemGO);
            
            yield return new WaitForEndOfFrame();
            
            if (showDebugLogs)
                Debug.Log("[ARPUInitializer] ARPU Analytics initialized");
        }
        
        private IEnumerator InitializeAdvancedMonetization()
        {
            if (showDebugLogs)
                Debug.Log("[ARPUInitializer] Initializing Advanced Monetization...");
            
            var monetizationSystemGO = new GameObject("AdvancedMonetizationSystem");
            monetizationSystemGO.AddComponent<AdvancedMonetizationSystem>();
            DontDestroyOnLoad(monetizationSystemGO);
            
            yield return new WaitForEndOfFrame();
            
            if (showDebugLogs)
                Debug.Log("[ARPUInitializer] Advanced Monetization initialized");
        }
        
        private IEnumerator InitializeRetentionSystem()
        {
            if (showDebugLogs)
                Debug.Log("[ARPUInitializer] Initializing Retention System...");
            
            var retentionSystemGO = new GameObject("AdvancedRetentionSystem");
            retentionSystemGO.AddComponent<AdvancedRetentionSystem>();
            DontDestroyOnLoad(retentionSystemGO);
            
            yield return new WaitForEndOfFrame();
            
            if (showDebugLogs)
                Debug.Log("[ARPUInitializer] Retention System initialized");
        }
        
        private IEnumerator InitializeIntegrationManager()
        {
            if (showDebugLogs)
                Debug.Log("[ARPUInitializer] Initializing Integration Manager...");
            
            var integrationManagerGO = new GameObject("ARPUIntegrationManager");
            integrationManagerGO.AddComponent<ARPUIntegrationManager>();
            DontDestroyOnLoad(integrationManagerGO);
            
            yield return new WaitForEndOfFrame();
            
            if (showDebugLogs)
                Debug.Log("[ARPUInitializer] Integration Manager initialized");
        }
        
        public bool IsInitialized()
        {
            return _isInitialized;
        }
        
        public void ForceInitialize()
        {
            if (!_isInitialized)
            {
                StartCoroutine(InitializeARPUSystems());
            }
        }
    }
}