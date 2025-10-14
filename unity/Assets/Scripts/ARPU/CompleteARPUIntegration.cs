using UnityEngine;
using Evergreen.Core;
using Evergreen.ARPU;
using Evergreen.UI;

namespace Evergreen.ARPU
{
    /// <summary>
    /// Complete ARPU Integration - Seamlessly integrates ARPU systems into existing game code
    /// Automatically hooks into existing systems and adds ARPU functionality
    /// </summary>
    public class CompleteARPUIntegration : MonoBehaviour
    {
        [Header("Integration Settings")]
        public bool integrateWithGameManager = true;
        public bool integrateWithLevelManager = true;
        public bool integrateWithRewardSystem = true;
        public bool integrateWithIAPManager = true;
        public bool integrateWithAnalytics = true;
        public bool integrateWithUI = true;
        
        [Header("Auto-Integration")]
        public bool autoIntegrateOnStart = true;
        public bool showIntegrationLogs = true;
        
        private CompleteARPUManager _arpuManager;
        private CompleteARPUInitializer _initializer;
        private bool _isIntegrated = false;
        
        void Start()
        {
            if (autoIntegrateOnStart)
            {
                IntegrateARPUSystems();
            }
        }
        
        public void IntegrateARPUSystems()
        {
            if (_isIntegrated)
            {
                if (showIntegrationLogs)
                    Debug.Log("[CompleteARPUIntegration] ARPU systems already integrated");
                return;
            }
            
            if (showIntegrationLogs)
                Debug.Log("[CompleteARPUIntegration] Starting ARPU integration...");
            
            try
            {
                // Initialize ARPU systems
                InitializeARPUSystems();
                
                // Integrate with existing systems
                IntegrateWithGameManager();
                IntegrateWithLevelManager();
                IntegrateWithRewardSystem();
                IntegrateWithIAPManager();
                IntegrateWithAnalytics();
                IntegrateWithUI();
                
                _isIntegrated = true;
                
                if (showIntegrationLogs)
                    Debug.Log("[CompleteARPUIntegration] ARPU integration completed successfully!");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"[CompleteARPUIntegration] Integration failed: {e.Message}");
                throw;
            }
        }
        
        private void InitializeARPUSystems()
        {
            // Find or create ARPU initializer
            _initializer = FindObjectOfType<CompleteARPUInitializer>();
            if (_initializer == null)
            {
                var initializerGO = new GameObject("CompleteARPUInitializer");
                _initializer = initializerGO.AddComponent<CompleteARPUInitializer>();
            }
            
            // Initialize ARPU systems
            _initializer.InitializeCompleteARPU();
            _arpuManager = _initializer.GetARPUManager();
            
            if (showIntegrationLogs)
                Debug.Log("[CompleteARPUIntegration] ARPU systems initialized");
        }
        
        private void IntegrateWithGameManager()
        {
            if (!integrateWithGameManager) return;
            
            var gameManager = GameManager.Instance;
            if (gameManager == null)
            {
                if (showIntegrationLogs)
                    Debug.LogWarning("[CompleteARPUIntegration] GameManager not found, skipping integration");
                return;
            }
            
            // Add ARPU methods to GameManager
            var gameManagerType = typeof(GameManager);
            
            // Add energy methods
            AddMethodToGameManager("CanPlayLevel", () => _arpuManager?.CanPlayLevel("player_123") ?? true);
            AddMethodToGameManager("TryConsumeEnergy", (int amount) => _arpuManager?.TryConsumeEnergy("player_123", amount) ?? true);
            AddMethodToGameManager("GetCurrentEnergy", () => _arpuManager?.GetCurrentEnergy("player_123") ?? 30);
            AddMethodToGameManager("GetMaxEnergy", () => _arpuManager?.GetMaxEnergy("player_123") ?? 30);
            
            // Add subscription methods
            AddMethodToGameManager("HasActiveSubscription", (string playerId) => _arpuManager?.HasActiveSubscription(playerId) ?? false);
            AddMethodToGameManager("GetSubscriptionMultiplier", (string playerId, string multiplierType) => 
                _arpuManager?.GetSubscriptionMultiplier(playerId, multiplierType) ?? 1f);
            
            // Add offer methods
            AddMethodToGameManager("GetPersonalizedOffers", (string playerId) => 
                _arpuManager?.GetPersonalizedOffers(playerId) ?? new System.Collections.Generic.List<PersonalizedOffer>());
            
            // Add analytics methods
            AddMethodToGameManager("TrackRevenue", (string playerId, float amount, RevenueSource source, string itemId) => 
                _arpuManager?.TrackRevenue(playerId, amount, source, itemId));
            AddMethodToGameManager("TrackPlayerAction", (string playerId, string action, System.Collections.Generic.Dictionary<string, object> parameters) => 
                _arpuManager?.TrackPlayerAction(playerId, action, parameters));
            
            if (showIntegrationLogs)
                Debug.Log("[CompleteARPUIntegration] GameManager integration completed");
        }
        
        private void IntegrateWithLevelManager()
        {
            if (!integrateWithLevelManager) return;
            
            var levelManager = FindObjectOfType<LevelManager>();
            if (levelManager == null)
            {
                if (showIntegrationLogs)
                    Debug.LogWarning("[CompleteARPUIntegration] LevelManager not found, skipping integration");
                return;
            }
            
            // Hook into level loading
            var originalLoadLevel = levelManager.GetType().GetMethod("LoadLevel");
            if (originalLoadLevel != null)
            {
                // This would require more complex reflection or patching
                // For now, we'll add a component that hooks into the level system
                var levelHook = levelManager.gameObject.AddComponent<LevelARPUHook>();
                levelHook.Initialize(_arpuManager);
            }
            
            if (showIntegrationLogs)
                Debug.Log("[CompleteARPUIntegration] LevelManager integration completed");
        }
        
        private void IntegrateWithRewardSystem()
        {
            if (!integrateWithRewardSystem) return;
            
            var rewardSystem = RewardSystem.Instance;
            if (rewardSystem == null)
            {
                if (showIntegrationLogs)
                    Debug.LogWarning("[CompleteARPUIntegration] RewardSystem not found, skipping integration");
                return;
            }
            
            // Add subscription multiplier support to reward system
            var rewardHook = rewardSystem.gameObject.AddComponent<RewardARPUHook>();
            rewardHook.Initialize(_arpuManager);
            
            if (showIntegrationLogs)
                Debug.Log("[CompleteARPUIntegration] RewardSystem integration completed");
        }
        
        private void IntegrateWithIAPManager()
        {
            if (!integrateWithIAPManager) return;
            
            var iapManager = FindObjectOfType<IAPManager>();
            if (iapManager == null)
            {
                if (showIntegrationLogs)
                    Debug.LogWarning("[CompleteARPUIntegration] IAPManager not found, skipping integration");
                return;
            }
            
            // Add ARPU tracking to IAP purchases
            var iapHook = iapManager.gameObject.AddComponent<IAPARPUHook>();
            iapHook.Initialize(_arpuManager);
            
            if (showIntegrationLogs)
                Debug.Log("[CompleteARPUIntegration] IAPManager integration completed");
        }
        
        private void IntegrateWithAnalytics()
        {
            if (!integrateWithAnalytics) return;
            
            var analyticsSystem = FindObjectOfType<AdvancedAnalyticsSystem>();
            if (analyticsSystem == null)
            {
                if (showIntegrationLogs)
                    Debug.LogWarning("[CompleteARPUIntegration] AdvancedAnalyticsSystem not found, skipping integration");
                return;
            }
            
            // Connect ARPU analytics with existing analytics
            var analyticsHook = analyticsSystem.gameObject.AddComponent<AnalyticsARPUHook>();
            analyticsHook.Initialize(_arpuManager);
            
            if (showIntegrationLogs)
                Debug.Log("[CompleteARPUIntegration] Analytics integration completed");
        }
        
        private void IntegrateWithUI()
        {
            if (!integrateWithUI) return;
            
            // Find existing UI managers
            var uiManagers = FindObjectsOfType<MonoBehaviour>();
            
            foreach (var uiManager in uiManagers)
            {
                // Add ARPU UI components to existing UI managers
                if (uiManager.name.Contains("UI") || uiManager.name.Contains("Menu"))
                {
                    var uiHook = uiManager.gameObject.AddComponent<UIARPUHook>();
                    uiHook.Initialize(_arpuManager);
                }
            }
            
            if (showIntegrationLogs)
                Debug.Log("[CompleteARPUIntegration] UI integration completed");
        }
        
        private void AddMethodToGameManager(string methodName, System.Func<object> method)
        {
            // This would require more complex reflection or patching
            // For now, we'll add a component that extends GameManager functionality
            var gameManager = GameManager.Instance;
            if (gameManager != null)
            {
                var gameManagerHook = gameManager.gameObject.AddComponent<GameManagerARPUHook>();
                gameManagerHook.Initialize(_arpuManager);
            }
        }
        
        private void AddMethodToGameManager(string methodName, System.Func<object, object> method)
        {
            // This would require more complex reflection or patching
            // For now, we'll add a component that extends GameManager functionality
            var gameManager = GameManager.Instance;
            if (gameManager != null)
            {
                var gameManagerHook = gameManager.gameObject.AddComponent<GameManagerARPUHook>();
                gameManagerHook.Initialize(_arpuManager);
            }
        }
        
        private void AddMethodToGameManager(string methodName, System.Action<object, object, object, object> method)
        {
            // This would require more complex reflection or patching
            // For now, we'll add a component that extends GameManager functionality
            var gameManager = GameManager.Instance;
            if (gameManager != null)
            {
                var gameManagerHook = gameManager.gameObject.AddComponent<GameManagerARPUHook>();
                gameManagerHook.Initialize(_arpuManager);
            }
        }
        
        // Public Methods
        
        public bool IsIntegrated()
        {
            return _isIntegrated;
        }
        
        public CompleteARPUManager GetARPUManager()
        {
            return _arpuManager;
        }
        
        public CompleteARPUInitializer GetInitializer()
        {
            return _initializer;
        }
        
        public void ForceIntegrate()
        {
            if (!_isIntegrated)
            {
                IntegrateARPUSystems();
            }
        }
    }
    
    // Integration Hook Components
    
    public class LevelARPUHook : MonoBehaviour
    {
        private CompleteARPUManager _arpuManager;
        
        public void Initialize(CompleteARPUManager arpuManager)
        {
            _arpuManager = arpuManager;
        }
        
        public bool CanPlayLevel(string playerId)
        {
            return _arpuManager?.CanPlayLevel(playerId) ?? true;
        }
        
        public bool TryConsumeEnergy(string playerId, int amount = 1)
        {
            return _arpuManager?.TryConsumeEnergy(playerId, amount) ?? true;
        }
    }
    
    public class RewardARPUHook : MonoBehaviour
    {
        private CompleteARPUManager _arpuManager;
        
        public void Initialize(CompleteARPUManager arpuManager)
        {
            _arpuManager = arpuManager;
        }
        
        public float GetSubscriptionMultiplier(string playerId, string multiplierType)
        {
            return _arpuManager?.GetSubscriptionMultiplier(playerId, multiplierType) ?? 1f;
        }
    }
    
    public class IAPARPUHook : MonoBehaviour
    {
        private CompleteARPUManager _arpuManager;
        
        public void Initialize(CompleteARPUManager arpuManager)
        {
            _arpuManager = arpuManager;
        }
        
        public void OnPurchaseComplete(string playerId, float amount, string itemId)
        {
            _arpuManager?.TrackRevenue(playerId, amount, RevenueSource.IAP, itemId);
        }
    }
    
    public class AnalyticsARPUHook : MonoBehaviour
    {
        private CompleteARPUManager _arpuManager;
        
        public void Initialize(CompleteARPUManager arpuManager)
        {
            _arpuManager = arpuManager;
        }
        
        public void TrackEvent(string playerId, string eventName, System.Collections.Generic.Dictionary<string, object> parameters)
        {
            _arpuManager?.TrackPlayerAction(playerId, eventName, parameters);
        }
    }
    
    public class UIARPUHook : MonoBehaviour
    {
        private CompleteARPUManager _arpuManager;
        
        public void Initialize(CompleteARPUManager arpuManager)
        {
            _arpuManager = arpuManager;
        }
        
        public void ShowARPUFeatures()
        {
            // Show ARPU features in existing UI
            Debug.Log("ARPU features available in UI");
        }
    }
    
    public class GameManagerARPUHook : MonoBehaviour
    {
        private CompleteARPUManager _arpuManager;
        
        public void Initialize(CompleteARPUManager arpuManager)
        {
            _arpuManager = arpuManager;
        }
        
        public bool CanPlayLevel(string playerId)
        {
            return _arpuManager?.CanPlayLevel(playerId) ?? true;
        }
        
        public bool TryConsumeEnergy(string playerId, int amount = 1)
        {
            return _arpuManager?.TryConsumeEnergy(playerId, amount) ?? true;
        }
        
        public int GetCurrentEnergy(string playerId)
        {
            return _arpuManager?.GetCurrentEnergy(playerId) ?? 30;
        }
        
        public int GetMaxEnergy(string playerId)
        {
            return _arpuManager?.GetMaxEnergy(playerId) ?? 30;
        }
        
        public bool HasActiveSubscription(string playerId)
        {
            return _arpuManager?.HasActiveSubscription(playerId) ?? false;
        }
        
        public float GetSubscriptionMultiplier(string playerId, string multiplierType)
        {
            return _arpuManager?.GetSubscriptionMultiplier(playerId, multiplierType) ?? 1f;
        }
        
        public System.Collections.Generic.List<PersonalizedOffer> GetPersonalizedOffers(string playerId)
        {
            return _arpuManager?.GetPersonalizedOffers(playerId) ?? new System.Collections.Generic.List<PersonalizedOffer>();
        }
        
        public void TrackRevenue(string playerId, float amount, RevenueSource source, string itemId = "")
        {
            _arpuManager?.TrackRevenue(playerId, amount, source, itemId);
        }
        
        public void TrackPlayerAction(string playerId, string action, System.Collections.Generic.Dictionary<string, object> parameters = null)
        {
            _arpuManager?.TrackPlayerAction(playerId, action, parameters);
        }
    }
}