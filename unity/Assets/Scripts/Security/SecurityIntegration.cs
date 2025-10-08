using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Evergreen.Core;

namespace Evergreen.Security
{
    /// <summary>
    /// Comprehensive security integration system
    /// Coordinates all security components and provides unified interface
    /// </summary>
    public class SecurityIntegration : MonoBehaviour
    {
        [Header("Security Components")]
        public AdvancedSecuritySystem advancedSecurity;
        public SecurityManager securityManager;
        public ServerValidation serverValidation;
        public ClientAntiCheat clientAntiCheat;
        
        [Header("Integration Settings")]
        public bool enableIntegratedSecurity = true;
        public bool enableServerSync = true;
        public float syncInterval = 30f;
        public bool enableRealTimeValidation = true;
        
        [Header("Security Policies")]
        public SecurityPolicy securityPolicy = SecurityPolicy.Balanced;
        public bool enableAutoBan = true;
        public float autoBanThreshold = 0.8f;
        public bool enableProgressivePenalties = true;
        
        [Header("Debug")]
        public bool enableDebugLogs = true;
        public bool enableSecurityDashboard = false;
        
        // Security state
        private Dictionary<string, PlayerSecurityState> playerStates = new Dictionary<string, PlayerSecurityState>();
        private SecurityMetrics securityMetrics = new SecurityMetrics();
        private Coroutine securitySyncCoroutine;
        
        // Events
        public event Action<SecurityEvent> OnSecurityEvent;
        public event Action<PlayerBanEvent> OnPlayerBanned;
        public event Action<SecurityAlert> OnSecurityAlert;
        public event Action<SecurityMetrics> OnMetricsUpdated;
        
        public static SecurityIntegration Instance { get; private set; }
        
        [System.Serializable]
        public class PlayerSecurityState
        {
            public string playerId;
            public float riskScore;
            public int violationCount;
            public int suspiciousActivityCount;
            public bool isBanned;
            public bool isSuspicious;
            public DateTime lastActivity;
            public List<SecurityViolation> violations = new List<SecurityViolation>();
            public List<SuspiciousActivity> suspiciousActivities = new List<SuspiciousActivity>();
        }
        
        [System.Serializable]
        public class SecurityViolation
        {
            public string id;
            public string type;
            public string description;
            public float severity;
            public float confidence;
            public DateTime timestamp;
            public string source; // "client", "server", "advanced"
            public Dictionary<string, object> evidence;
        }
        
        [System.Serializable]
        public class SuspiciousActivity
        {
            public string id;
            public string type;
            public string description;
            public float confidence;
            public DateTime timestamp;
            public string source;
            public Dictionary<string, object> evidence;
        }
        
        [System.Serializable]
        public class SecurityEvent
        {
            public string id;
            public string type;
            public string playerId;
            public string description;
            public float severity;
            public DateTime timestamp;
            public Dictionary<string, object> data;
        }
        
        [System.Serializable]
        public class PlayerBanEvent
        {
            public string playerId;
            public string reason;
            public float riskScore;
            public DateTime timestamp;
        }
        
        [System.Serializable]
        public class SecurityAlert
        {
            public string id;
            public string type;
            public string message;
            public float severity;
            public DateTime timestamp;
            public Dictionary<string, object> data;
        }
        
        [System.Serializable]
        public class SecurityMetrics
        {
            public int totalPlayers;
            public int bannedPlayers;
            public int suspiciousPlayers;
            public int totalViolations;
            public int totalSuspiciousActivities;
            public float averageRiskScore;
            public int securityEvents;
            public DateTime lastUpdated;
        }
        
        public enum SecurityPolicy
        {
            Permissive,    // Allow most activities, minimal restrictions
            Balanced,      // Balanced approach with moderate restrictions
            Strict,        // Strict enforcement with high restrictions
            Paranoid       // Maximum security with all restrictions enabled
        }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeSecurityIntegration();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            if (enableIntegratedSecurity)
            {
                StartSecurityIntegration();
            }
        }
        
        private void InitializeSecurityIntegration()
        {
            // Initialize security components
            InitializeSecurityComponents();
            
            // Setup event handlers
            SetupEventHandlers();
            
            // Apply security policy
            ApplySecurityPolicy();
            
            if (enableDebugLogs)
            {
                Debug.Log("[SecurityIntegration] Security integration system initialized");
            }
        }
        
        private void InitializeSecurityComponents()
        {
            // Get or create security components
            if (advancedSecurity == null)
                advancedSecurity = FindObjectOfType<AdvancedSecuritySystem>();
            
            if (securityManager == null)
                securityManager = FindObjectOfType<SecurityManager>();
            
            if (serverValidation == null)
                serverValidation = FindObjectOfType<ServerValidation>();
            
            if (clientAntiCheat == null)
                clientAntiCheat = FindObjectOfType<ClientAntiCheat>();
            
            // Create components if they don't exist
            if (advancedSecurity == null)
            {
                GameObject advancedSecurityObj = new GameObject("AdvancedSecuritySystem");
                advancedSecurity = advancedSecurityObj.AddComponent<AdvancedSecuritySystem>();
            }
            
            if (securityManager == null)
            {
                GameObject securityManagerObj = new GameObject("SecurityManager");
                securityManager = securityManagerObj.AddComponent<SecurityManager>();
            }
            
            if (serverValidation == null)
            {
                GameObject serverValidationObj = new GameObject("ServerValidation");
                serverValidation = serverValidationObj.AddComponent<ServerValidation>();
            }
            
            if (clientAntiCheat == null)
            {
                GameObject clientAntiCheatObj = new GameObject("ClientAntiCheat");
                clientAntiCheat = clientAntiCheatObj.AddComponent<ClientAntiCheat>();
            }
        }
        
        private void SetupEventHandlers()
        {
            // Advanced Security System events
            if (advancedSecurity != null)
            {
                advancedSecurity.OnSecurityViolation += HandleAdvancedSecurityViolation;
                advancedSecurity.OnSecurityAlert += HandleAdvancedSecurityAlert;
                advancedSecurity.OnFraudDetected += HandleAdvancedFraudDetected;
                advancedSecurity.OnPlayerBanned += HandleAdvancedPlayerBanned;
            }
            
            // Security Manager events
            if (securityManager != null)
            {
                // Add event handlers for SecurityManager
            }
            
            // Server Validation events
            if (serverValidation != null)
            {
                serverValidation.OnValidationResult += HandleServerValidationResult;
                serverValidation.OnValidationError += HandleServerValidationError;
                serverValidation.OnServerConnectionStatus += HandleServerConnectionStatus;
            }
            
            // Client Anti-Cheat events
            if (clientAntiCheat != null)
            {
                clientAntiCheat.OnViolationDetected += HandleClientViolation;
                clientAntiCheat.OnCheatDetected += HandleClientCheatDetected;
                clientAntiCheat.OnRiskScoreUpdated += HandleClientRiskScoreUpdated;
            }
        }
        
        private void ApplySecurityPolicy()
        {
            switch (securityPolicy)
            {
                case SecurityPolicy.Permissive:
                    ApplyPermissivePolicy();
                    break;
                case SecurityPolicy.Balanced:
                    ApplyBalancedPolicy();
                    break;
                case SecurityPolicy.Strict:
                    ApplyStrictPolicy();
                    break;
                case SecurityPolicy.Paranoid:
                    ApplyParanoidPolicy();
                    break;
            }
        }
        
        private void ApplyPermissivePolicy()
        {
            if (advancedSecurity != null)
            {
                advancedSecurity.enableAntiCheat = true;
                advancedSecurity.enableDataProtection = true;
                advancedSecurity.maxViolationsBeforeBan = 10;
                advancedSecurity.fraudDetectionThreshold = 0.9f;
            }
            
            if (clientAntiCheat != null)
            {
                clientAntiCheat.enableClientAntiCheat = true;
                clientAntiCheat.maxViolationsBeforeReport = 5;
                clientAntiCheat.speedHackThreshold = 2.0f;
            }
        }
        
        private void ApplyBalancedPolicy()
        {
            if (advancedSecurity != null)
            {
                advancedSecurity.enableAntiCheat = true;
                advancedSecurity.enableDataProtection = true;
                advancedSecurity.enableFraudDetection = true;
                advancedSecurity.maxViolationsBeforeBan = 5;
                advancedSecurity.fraudDetectionThreshold = 0.8f;
            }
            
            if (clientAntiCheat != null)
            {
                clientAntiCheat.enableClientAntiCheat = true;
                clientAntiCheat.maxViolationsBeforeReport = 3;
                clientAntiCheat.speedHackThreshold = 1.5f;
            }
        }
        
        private void ApplyStrictPolicy()
        {
            if (advancedSecurity != null)
            {
                advancedSecurity.enableAntiCheat = true;
                advancedSecurity.enableDataProtection = true;
                advancedSecurity.enableFraudDetection = true;
                advancedSecurity.enablePlayerVerification = true;
                advancedSecurity.maxViolationsBeforeBan = 3;
                advancedSecurity.fraudDetectionThreshold = 0.7f;
            }
            
            if (clientAntiCheat != null)
            {
                clientAntiCheat.enableClientAntiCheat = true;
                clientAntiCheat.maxViolationsBeforeReport = 2;
                clientAntiCheat.speedHackThreshold = 1.2f;
            }
        }
        
        private void ApplyParanoidPolicy()
        {
            if (advancedSecurity != null)
            {
                advancedSecurity.enableAntiCheat = true;
                advancedSecurity.enableDataProtection = true;
                advancedSecurity.enableFraudDetection = true;
                advancedSecurity.enablePlayerVerification = true;
                advancedSecurity.enableDeviceFingerprinting = true;
                advancedSecurity.maxViolationsBeforeBan = 2;
                advancedSecurity.fraudDetectionThreshold = 0.6f;
            }
            
            if (clientAntiCheat != null)
            {
                clientAntiCheat.enableClientAntiCheat = true;
                clientAntiCheat.maxViolationsBeforeReport = 1;
                clientAntiCheat.speedHackThreshold = 1.1f;
            }
        }
        
        private void StartSecurityIntegration()
        {
            if (enableServerSync)
            {
                securitySyncCoroutine = StartCoroutine(SecuritySyncCoroutine());
            }
            
            if (enableDebugLogs)
            {
                Debug.Log("[SecurityIntegration] Security integration started");
            }
        }
        
        private IEnumerator SecuritySyncCoroutine()
        {
            while (enableServerSync)
            {
                yield return new WaitForSeconds(syncInterval);
                
                // Sync security data with server
                SyncSecurityDataWithServer();
                
                // Update security metrics
                UpdateSecurityMetrics();
            }
        }
        
        private void SyncSecurityDataWithServer()
        {
            if (serverValidation == null) return;
            
            // Sync player security profiles
            foreach (var kvp in playerStates)
            {
                string playerId = kvp.Key;
                var state = kvp.Value;
                
                // Send security data to server
                var securityData = new Dictionary<string, object>
                {
                    {"playerId", playerId},
                    {"riskScore", state.riskScore},
                    {"violationCount", state.violationCount},
                    {"suspiciousActivityCount", state.suspiciousActivityCount},
                    {"isBanned", state.isBanned},
                    {"isSuspicious", state.isSuspicious},
                    {"lastActivity", state.lastActivity.ToString("O")}
                };
                
                serverValidation.SubmitGameData("security_sync", securityData);
            }
        }
        
        private void UpdateSecurityMetrics()
        {
            securityMetrics.totalPlayers = playerStates.Count;
            securityMetrics.bannedPlayers = 0;
            securityMetrics.suspiciousPlayers = 0;
            securityMetrics.totalViolations = 0;
            securityMetrics.totalSuspiciousActivities = 0;
            securityMetrics.averageRiskScore = 0f;
            
            foreach (var state in playerStates.Values)
            {
                if (state.isBanned) securityMetrics.bannedPlayers++;
                if (state.isSuspicious) securityMetrics.suspiciousPlayers++;
                securityMetrics.totalViolations += state.violationCount;
                securityMetrics.totalSuspiciousActivities += state.suspiciousActivityCount;
                securityMetrics.averageRiskScore += state.riskScore;
            }
            
            if (playerStates.Count > 0)
            {
                securityMetrics.averageRiskScore /= playerStates.Count;
            }
            
            securityMetrics.lastUpdated = DateTime.Now;
            
            OnMetricsUpdated?.Invoke(securityMetrics);
        }
        
        // Event handlers
        private void HandleAdvancedSecurityViolation(SecurityViolation violation)
        {
            ProcessSecurityViolation(violation, "advanced");
        }
        
        private void HandleAdvancedSecurityAlert(SecurityAlert alert)
        {
            ProcessSecurityAlert(alert);
        }
        
        private void HandleAdvancedFraudDetected(FraudDetection fraud)
        {
            ProcessFraudDetection(fraud);
        }
        
        private void HandleAdvancedPlayerBanned(string playerId)
        {
            ProcessPlayerBan(playerId, "Advanced security system ban");
        }
        
        private void HandleServerValidationResult(ServerValidation.ValidationResult result)
        {
            if (!result.isValid)
            {
                var violation = new SecurityViolation
                {
                    id = Guid.NewGuid().ToString(),
                    type = "server_validation_failed",
                    description = result.message,
                    severity = 1.0f,
                    confidence = 1.0f,
                    timestamp = DateTime.Now,
                    source = "server",
                    evidence = new Dictionary<string, object>()
                };
                
                ProcessSecurityViolation(violation, "server");
            }
        }
        
        private void HandleServerValidationError(string error)
        {
            var alert = new SecurityAlert
            {
                id = Guid.NewGuid().ToString(),
                type = "server_validation_error",
                message = error,
                severity = 0.7f,
                timestamp = DateTime.Now,
                data = new Dictionary<string, object> { {"error", error} }
            };
            
            ProcessSecurityAlert(alert);
        }
        
        private void HandleServerConnectionStatus(bool isConnected)
        {
            var alert = new SecurityAlert
            {
                id = Guid.NewGuid().ToString(),
                type = isConnected ? "server_connected" : "server_disconnected",
                message = isConnected ? "Server connection established" : "Server connection lost",
                severity = isConnected ? 0.1f : 0.8f,
                timestamp = DateTime.Now,
                data = new Dictionary<string, object> { {"isConnected", isConnected} }
            };
            
            ProcessSecurityAlert(alert);
        }
        
        private void HandleClientViolation(ClientAntiCheat.ClientViolation violation)
        {
            var securityViolation = new SecurityViolation
            {
                id = violation.id,
                type = violation.type,
                description = violation.description,
                severity = violation.severity,
                confidence = violation.confidence,
                timestamp = DateTime.FromOADate(violation.timestamp),
                source = "client",
                evidence = violation.evidence
            };
            
            ProcessSecurityViolation(securityViolation, "client");
        }
        
        private void HandleClientCheatDetected(string cheatType)
        {
            var alert = new SecurityAlert
            {
                id = Guid.NewGuid().ToString(),
                type = "cheat_detected",
                message = $"Cheat detected: {cheatType}",
                severity = 0.9f,
                timestamp = DateTime.Now,
                data = new Dictionary<string, object> { {"cheatType", cheatType} }
            };
            
            ProcessSecurityAlert(alert);
        }
        
        private void HandleClientRiskScoreUpdated(float riskScore)
        {
            string playerId = GetCurrentPlayerId();
            if (!string.IsNullOrEmpty(playerId))
            {
                UpdatePlayerRiskScore(playerId, riskScore);
            }
        }
        
        private void ProcessSecurityViolation(SecurityViolation violation, string source)
        {
            string playerId = GetCurrentPlayerId();
            if (string.IsNullOrEmpty(playerId)) return;
            
            // Get or create player state
            if (!playerStates.ContainsKey(playerId))
            {
                playerStates[playerId] = new PlayerSecurityState
                {
                    playerId = playerId,
                    riskScore = 0f,
                    violationCount = 0,
                    suspiciousActivityCount = 0,
                    isBanned = false,
                    isSuspicious = false,
                    lastActivity = DateTime.Now,
                    violations = new List<SecurityViolation>(),
                    suspiciousActivities = new List<SuspiciousActivity>()
                };
            }
            
            var state = playerStates[playerId];
            state.violations.Add(violation);
            state.violationCount++;
            state.lastActivity = DateTime.Now;
            
            // Update risk score
            state.riskScore = CalculatePlayerRiskScore(state);
            
            // Check if player should be banned
            if (enableAutoBan && state.riskScore >= autoBanThreshold)
            {
                ProcessPlayerBan(playerId, $"High risk score: {state.riskScore:F2}");
            }
            
            // Create security event
            var securityEvent = new SecurityEvent
            {
                id = Guid.NewGuid().ToString(),
                type = "security_violation",
                playerId = playerId,
                description = violation.description,
                severity = violation.severity,
                timestamp = DateTime.Now,
                data = new Dictionary<string, object>
                {
                    {"violationType", violation.type},
                    {"source", source},
                    {"confidence", violation.confidence}
                }
            };
            
            OnSecurityEvent?.Invoke(securityEvent);
            
            if (enableDebugLogs)
            {
                Debug.LogWarning($"[SecurityIntegration] Security violation: {violation.type} - {violation.description}");
            }
        }
        
        private void ProcessSecurityAlert(SecurityAlert alert)
        {
            OnSecurityAlert?.Invoke(alert);
            
            if (enableDebugLogs)
            {
                Debug.Log($"[SecurityIntegration] Security alert: {alert.type} - {alert.message}");
            }
        }
        
        private void ProcessFraudDetection(FraudDetection fraud)
        {
            string playerId = fraud.PlayerId;
            if (string.IsNullOrEmpty(playerId)) return;
            
            // Get or create player state
            if (!playerStates.ContainsKey(playerId))
            {
                playerStates[playerId] = new PlayerSecurityState
                {
                    playerId = playerId,
                    riskScore = 0f,
                    violationCount = 0,
                    suspiciousActivityCount = 0,
                    isBanned = false,
                    isSuspicious = false,
                    lastActivity = DateTime.Now,
                    violations = new List<SecurityViolation>(),
                    suspiciousActivities = new List<SuspiciousActivity>()
                };
            }
            
            var state = playerStates[playerId];
            state.isSuspicious = true;
            state.lastActivity = DateTime.Now;
            
            // Update risk score
            state.riskScore = CalculatePlayerRiskScore(state);
            
            // Create security event
            var securityEvent = new SecurityEvent
            {
                id = Guid.NewGuid().ToString(),
                type = "fraud_detected",
                playerId = playerId,
                description = $"Fraud detected: {fraud.Type}",
                severity = fraud.RiskScore,
                timestamp = DateTime.Now,
                data = new Dictionary<string, object>
                {
                    {"fraudType", fraud.Type},
                    {"riskScore", fraud.RiskScore},
                    {"evidence", fraud.Evidence}
                }
            };
            
            OnSecurityEvent?.Invoke(securityEvent);
        }
        
        private void ProcessPlayerBan(string playerId, string reason)
        {
            if (!playerStates.ContainsKey(playerId)) return;
            
            var state = playerStates[playerId];
            state.isBanned = true;
            state.lastActivity = DateTime.Now;
            
            var banEvent = new PlayerBanEvent
            {
                playerId = playerId,
                reason = reason,
                riskScore = state.riskScore,
                timestamp = DateTime.Now
            };
            
            OnPlayerBanned?.Invoke(banEvent);
            
            if (enableDebugLogs)
            {
                Debug.LogWarning($"[SecurityIntegration] Player banned: {playerId} - {reason}");
            }
        }
        
        private void UpdatePlayerRiskScore(string playerId, float riskScore)
        {
            if (!playerStates.ContainsKey(playerId)) return;
            
            var state = playerStates[playerId];
            state.riskScore = riskScore;
            state.lastActivity = DateTime.Now;
            
            // Check if player should be banned
            if (enableAutoBan && riskScore >= autoBanThreshold)
            {
                ProcessPlayerBan(playerId, $"High risk score: {riskScore:F2}");
            }
        }
        
        private float CalculatePlayerRiskScore(PlayerSecurityState state)
        {
            float riskScore = 0f;
            
            // Base risk from violations
            riskScore += state.violationCount * 0.1f;
            
            // Risk from violation severity
            foreach (var violation in state.violations)
            {
                riskScore += violation.severity * violation.confidence * 0.2f;
            }
            
            // Risk from suspicious activities
            riskScore += state.suspiciousActivityCount * 0.05f;
            
            // Risk from being suspicious
            if (state.isSuspicious)
            {
                riskScore += 0.3f;
            }
            
            // Risk from being banned
            if (state.isBanned)
            {
                riskScore = 1.0f;
            }
            
            return Mathf.Clamp01(riskScore);
        }
        
        private string GetCurrentPlayerId()
        {
            // Return current player ID
            return "player_1"; // Placeholder
        }
        
        /// <summary>
        /// Get security statistics
        /// </summary>
        public Dictionary<string, object> GetSecurityStatistics()
        {
            return new Dictionary<string, object>
            {
                {"totalPlayers", securityMetrics.totalPlayers},
                {"bannedPlayers", securityMetrics.bannedPlayers},
                {"suspiciousPlayers", securityMetrics.suspiciousPlayers},
                {"totalViolations", securityMetrics.totalViolations},
                {"totalSuspiciousActivities", securityMetrics.totalSuspiciousActivities},
                {"averageRiskScore", securityMetrics.averageRiskScore},
                {"securityEvents", securityMetrics.securityEvents},
                {"lastUpdated", securityMetrics.lastUpdated.ToString("O")}
            };
        }
        
        /// <summary>
        /// Get player security state
        /// </summary>
        public PlayerSecurityState GetPlayerSecurityState(string playerId)
        {
            return playerStates.ContainsKey(playerId) ? playerStates[playerId] : null;
        }
        
        void OnDestroy()
        {
            if (securitySyncCoroutine != null)
            {
                StopCoroutine(securitySyncCoroutine);
            }
        }
    }
}