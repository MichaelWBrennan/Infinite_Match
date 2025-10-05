using System.Collections.Generic;
using UnityEngine;
using System;
using System.Security.Cryptography;
using System.Text;
using Evergreen.Core;

namespace Evergreen.Security
{
    /// <summary>
    /// Comprehensive security and anti-cheat system with data protection, validation, and detection
    /// </summary>
    public class SecurityManager : MonoBehaviour
    {
        public static SecurityManager Instance { get; private set; }

        [Header("Security Settings")]
        public bool enableSecurity = true;
        public bool enableAntiCheat = true;
        public bool enableDataEncryption = true;
        public bool enableInputValidation = true;
        public bool enableMemoryProtection = true;

        [Header("Anti-Cheat Settings")]
        public bool enableSpeedHackDetection = true;
        public bool enableMemoryHackDetection = true;
        public bool enableValueValidation = true;
        public bool enableBehaviorAnalysis = true;
        public float detectionThreshold = 0.8f;

        [Header("Data Protection")]
        public bool enableDataHashing = true;
        public bool enableDataSigning = true;
        public bool enableSecureStorage = true;
        public string encryptionKey = "default_key";

        [Header("Network Security")]
        public bool enableNetworkEncryption = true;
        public bool enableRequestValidation = true;
        public bool enableRateLimiting = true;
        public int maxRequestsPerMinute = 60;

        private Dictionary<string, PlayerSecurityProfile> _playerProfiles = new Dictionary<string, PlayerSecurityProfile>();
        private Dictionary<string, SecurityEvent> _securityEvents = new Dictionary<string, SecurityEvent>();
        private Dictionary<string, CheatDetection> _cheatDetections = new Dictionary<string, CheatDetection>();

        private DataEncryptor _dataEncryptor;
        private CheatDetector _cheatDetector;
        private InputValidator _inputValidator;
        private MemoryProtector _memoryProtector;
        private NetworkSecurity _networkSecurity;
        private BehaviorAnalyzer _behaviorAnalyzer;

        public class PlayerSecurityProfile
        {
            public string playerId;
            public SecurityLevel securityLevel;
            public List<SecurityViolation> violations;
            public Dictionary<string, object> behaviorData;
            public DateTime lastActivity;
            public bool isBanned;
            public bool isSuspicious;
            public float trustScore;
        }

        public class SecurityEvent
        {
            public string eventId;
            public string playerId;
            public SecurityEventType eventType;
            public string description;
            public Dictionary<string, object> data;
            public DateTime timestamp;
            public SecurityLevel severity;
        }

        public class CheatDetection
        {
            public string detectionId;
            public string playerId;
            public CheatType cheatType;
            public float confidence;
            public Dictionary<string, object> evidence;
            public DateTime detectedAt;
            public bool isConfirmed;
        }

        public class SecurityViolation
        {
            public string violationId;
            public ViolationType violationType;
            public string description;
            public DateTime timestamp;
            public SecurityLevel severity;
            public bool isResolved;
        }

        public enum SecurityLevel
        {
            Low,
            Medium,
            High,
            Critical
        }

        public enum SecurityEventType
        {
            Login,
            Logout,
            DataAccess,
            DataModification,
            SuspiciousActivity,
            CheatDetection,
            Violation,
            Ban
        }

        public enum CheatType
        {
            SpeedHack,
            MemoryHack,
            ValueModification,
            InputManipulation,
            NetworkManipulation,
            Exploit,
            Bot,
            Unknown
        }

        public enum ViolationType
        {
            DataTampering,
            UnauthorizedAccess,
            SuspiciousBehavior,
            CheatUsage,
            ExploitUsage,
            BotUsage,
            MultipleAccounts,
            Spam
        }

        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeSecurity();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        private void InitializeSecurity()
        {
            if (!enableSecurity) return;

            _dataEncryptor = new DataEncryptor(encryptionKey);
            _cheatDetector = new CheatDetector();
            _inputValidator = new InputValidator();
            _memoryProtector = new MemoryProtector();
            _networkSecurity = new NetworkSecurity();
            _behaviorAnalyzer = new BehaviorAnalyzer();

            StartCoroutine(MonitorSecurity());
            StartCoroutine(UpdateSecurityProfiles());

            Logger.Info("Security Manager initialized", "Security");
        }

        #region Player Security
        public void RegisterPlayer(string playerId)
        {
            var profile = new PlayerSecurityProfile
            {
                playerId = playerId,
                securityLevel = SecurityLevel.Low,
                violations = new List<SecurityViolation>(),
                behaviorData = new Dictionary<string, object>(),
                lastActivity = DateTime.Now,
                isBanned = false,
                isSuspicious = false,
                trustScore = 1.0f
            };

            _playerProfiles[playerId] = profile;
            LogSecurityEvent(playerId, SecurityEventType.Login, "Player registered");
        }

        public void UpdatePlayerActivity(string playerId, Dictionary<string, object> activityData)
        {
            if (!_playerProfiles.ContainsKey(playerId)) return;

            var profile = _playerProfiles[playerId];
            profile.lastActivity = DateTime.Now;

            // Analyze behavior
            if (enableBehaviorAnalysis)
            {
                _behaviorAnalyzer.AnalyzeBehavior(profile, activityData);
            }

            // Check for suspicious activity
            if (profile.isSuspicious)
            {
                LogSecurityEvent(playerId, SecurityEventType.SuspiciousActivity, "Suspicious activity detected");
            }
        }

        public SecurityLevel GetPlayerSecurityLevel(string playerId)
        {
            return _playerProfiles.GetValueOrDefault(playerId)?.securityLevel ?? SecurityLevel.Low;
        }

        public bool IsPlayerBanned(string playerId)
        {
            return _playerProfiles.GetValueOrDefault(playerId)?.isBanned ?? false;
        }

        public bool IsPlayerSuspicious(string playerId)
        {
            return _playerProfiles.GetValueOrDefault(playerId)?.isSuspicious ?? false;
        }
        #endregion

        #region Data Protection
        public string EncryptData(string data)
        {
            if (!enableDataEncryption) return data;

            return _dataEncryptor.Encrypt(data);
        }

        public string DecryptData(string encryptedData)
        {
            if (!enableDataEncryption) return encryptedData;

            return _dataEncryptor.Decrypt(encryptedData);
        }

        public string HashData(string data)
        {
            if (!enableDataHashing) return data;

            return _dataEncryptor.Hash(data);
        }

        public bool ValidateDataIntegrity(string data, string hash)
        {
            if (!enableDataHashing) return true;

            var calculatedHash = _dataEncryptor.Hash(data);
            return calculatedHash == hash;
        }

        public string SignData(string data)
        {
            if (!enableDataSigning) return data;

            return _dataEncryptor.Sign(data);
        }

        public bool VerifyDataSignature(string data, string signature)
        {
            if (!enableDataSigning) return true;

            return _dataEncryptor.VerifySignature(data, signature);
        }
        #endregion

        #region Input Validation
        public bool ValidateInput(string playerId, InputType inputType, Dictionary<string, object> inputData)
        {
            if (!enableInputValidation) return true;

            var isValid = _inputValidator.Validate(inputType, inputData);
            
            if (!isValid)
            {
                LogSecurityEvent(playerId, SecurityEventType.Violation, $"Invalid input: {inputType}");
                RecordViolation(playerId, ViolationType.InputManipulation, "Invalid input detected");
            }

            return isValid;
        }

        public bool ValidateGameAction(string playerId, string actionType, Dictionary<string, object> actionData)
        {
            if (!enableInputValidation) return true;

            var isValid = _inputValidator.ValidateGameAction(actionType, actionData);
            
            if (!isValid)
            {
                LogSecurityEvent(playerId, SecurityEventType.Violation, $"Invalid game action: {actionType}");
                RecordViolation(playerId, ViolationType.DataTampering, "Invalid game action detected");
            }

            return isValid;
        }
        #endregion

        #region Cheat Detection
        public void CheckForCheats(string playerId, Dictionary<string, object> gameData)
        {
            if (!enableAntiCheat) return;

            var profile = _playerProfiles.GetValueOrDefault(playerId);
            if (profile == null) return;

            // Speed hack detection
            if (enableSpeedHackDetection)
            {
                CheckSpeedHack(playerId, gameData);
            }

            // Memory hack detection
            if (enableMemoryHackDetection)
            {
                CheckMemoryHack(playerId, gameData);
            }

            // Value validation
            if (enableValueValidation)
            {
                CheckValueValidation(playerId, gameData);
            }
        }

        private void CheckSpeedHack(string playerId, Dictionary<string, object> gameData)
        {
            var speedHackDetected = _cheatDetector.DetectSpeedHack(gameData);
            if (speedHackDetected)
            {
                RecordCheatDetection(playerId, CheatType.SpeedHack, 0.9f, gameData);
            }
        }

        private void CheckMemoryHack(string playerId, Dictionary<string, object> gameData)
        {
            var memoryHackDetected = _cheatDetector.DetectMemoryHack(gameData);
            if (memoryHackDetected)
            {
                RecordCheatDetection(playerId, CheatType.MemoryHack, 0.8f, gameData);
            }
        }

        private void CheckValueValidation(string playerId, Dictionary<string, object> gameData)
        {
            var valueHackDetected = _cheatDetector.DetectValueHack(gameData);
            if (valueHackDetected)
            {
                RecordCheatDetection(playerId, CheatType.ValueModification, 0.7f, gameData);
            }
        }

        private void RecordCheatDetection(string playerId, CheatType cheatType, float confidence, Dictionary<string, object> evidence)
        {
            var detection = new CheatDetection
            {
                detectionId = Guid.NewGuid().ToString(),
                playerId = playerId,
                cheatType = cheatType,
                confidence = confidence,
                evidence = evidence,
                detectedAt = DateTime.Now,
                isConfirmed = false
            };

            _cheatDetections[detection.detectionId] = detection;

            // Update player profile
            var profile = _playerProfiles.GetValueOrDefault(playerId);
            if (profile != null)
            {
                profile.isSuspicious = true;
                profile.trustScore = Mathf.Max(0f, profile.trustScore - 0.2f);
            }

            LogSecurityEvent(playerId, SecurityEventType.CheatDetection, $"Cheat detected: {cheatType}");
        }
        #endregion

        #region Violation Management
        private void RecordViolation(string playerId, ViolationType violationType, string description)
        {
            var profile = _playerProfiles.GetValueOrDefault(playerId);
            if (profile == null) return;

            var violation = new SecurityViolation
            {
                violationId = Guid.NewGuid().ToString(),
                violationType = violationType,
                description = description,
                timestamp = DateTime.Now,
                severity = GetViolationSeverity(violationType),
                isResolved = false
            };

            profile.violations.Add(violation);
            profile.trustScore = Mathf.Max(0f, profile.trustScore - 0.1f);

            // Check if player should be banned
            if (ShouldBanPlayer(profile))
            {
                BanPlayer(playerId, "Multiple violations");
            }
        }

        private SecurityLevel GetViolationSeverity(ViolationType violationType)
        {
            switch (violationType)
            {
                case ViolationType.DataTampering:
                case ViolationType.CheatUsage:
                case ViolationType.ExploitUsage:
                    return SecurityLevel.Critical;
                case ViolationType.UnauthorizedAccess:
                case ViolationType.BotUsage:
                    return SecurityLevel.High;
                case ViolationType.SuspiciousBehavior:
                case ViolationType.MultipleAccounts:
                    return SecurityLevel.Medium;
                case ViolationType.Spam:
                    return SecurityLevel.Low;
                default:
                    return SecurityLevel.Medium;
            }
        }

        private bool ShouldBanPlayer(PlayerSecurityProfile profile)
        {
            var criticalViolations = profile.violations.Count(v => v.severity == SecurityLevel.Critical);
            var highViolations = profile.violations.Count(v => v.severity == SecurityLevel.High);
            var totalViolations = profile.violations.Count;

            return criticalViolations >= 3 || highViolations >= 5 || totalViolations >= 10;
        }

        public void BanPlayer(string playerId, string reason)
        {
            var profile = _playerProfiles.GetValueOrDefault(playerId);
            if (profile == null) return;

            profile.isBanned = true;
            profile.securityLevel = SecurityLevel.Critical;

            LogSecurityEvent(playerId, SecurityEventType.Ban, reason);
        }

        public void UnbanPlayer(string playerId)
        {
            var profile = _playerProfiles.GetValueOrDefault(playerId);
            if (profile == null) return;

            profile.isBanned = false;
            profile.securityLevel = SecurityLevel.Medium;

            LogSecurityEvent(playerId, SecurityEventType.Login, "Player unbanned");
        }
        #endregion

        #region Network Security
        public bool ValidateNetworkRequest(string playerId, string endpoint, Dictionary<string, object> requestData)
        {
            if (!enableNetworkEncryption) return true;

            // Rate limiting
            if (enableRateLimiting && !_networkSecurity.CheckRateLimit(playerId))
            {
                LogSecurityEvent(playerId, SecurityEventType.Violation, "Rate limit exceeded");
                return false;
            }

            // Request validation
            if (enableRequestValidation && !_networkSecurity.ValidateRequest(endpoint, requestData))
            {
                LogSecurityEvent(playerId, SecurityEventType.Violation, "Invalid request");
                return false;
            }

            return true;
        }

        public string EncryptNetworkData(string data)
        {
            if (!enableNetworkEncryption) return data;

            return _networkSecurity.Encrypt(data);
        }

        public string DecryptNetworkData(string encryptedData)
        {
            if (!enableNetworkEncryption) return encryptedData;

            return _networkSecurity.Decrypt(encryptedData);
        }
        #endregion

        #region Security Monitoring
        private System.Collections.IEnumerator MonitorSecurity()
        {
            while (true)
            {
                // Monitor for suspicious activity
                foreach (var profile in _playerProfiles.Values)
                {
                    if (profile.isSuspicious && !profile.isBanned)
                    {
                        MonitorSuspiciousPlayer(profile);
                    }
                }

                // Clean up old security events
                CleanupOldEvents();

                yield return new WaitForSeconds(30f); // Check every 30 seconds
            }
        }

        private void MonitorSuspiciousPlayer(PlayerSecurityProfile profile)
        {
            // Additional monitoring for suspicious players
            var timeSinceLastActivity = (DateTime.Now - profile.lastActivity).TotalMinutes;
            if (timeSinceLastActivity > 60)
            {
                // Player inactive for too long, might be bot
                RecordViolation(profile.playerId, ViolationType.BotUsage, "Inactive for extended period");
            }
        }

        private void CleanupOldEvents()
        {
            var cutoffTime = DateTime.Now.AddDays(-30);
            var eventsToRemove = new List<string>();

            foreach (var kvp in _securityEvents)
            {
                if (kvp.Value.timestamp < cutoffTime)
                {
                    eventsToRemove.Add(kvp.Key);
                }
            }

            foreach (var eventId in eventsToRemove)
            {
                _securityEvents.Remove(eventId);
            }
        }

        private System.Collections.IEnumerator UpdateSecurityProfiles()
        {
            while (true)
            {
                foreach (var profile in _playerProfiles.Values)
                {
                    // Update trust score based on recent activity
                    var timeSinceLastActivity = (DateTime.Now - profile.lastActivity).TotalHours;
                    if (timeSinceLastActivity < 24)
                    {
                        profile.trustScore = Mathf.Min(1.0f, profile.trustScore + 0.01f);
                    }

                    // Update security level based on trust score
                    if (profile.trustScore > 0.8f)
                    {
                        profile.securityLevel = SecurityLevel.Low;
                    }
                    else if (profile.trustScore > 0.6f)
                    {
                        profile.securityLevel = SecurityLevel.Medium;
                    }
                    else if (profile.trustScore > 0.4f)
                    {
                        profile.securityLevel = SecurityLevel.High;
                    }
                    else
                    {
                        profile.securityLevel = SecurityLevel.Critical;
                    }
                }

                yield return new WaitForSeconds(300f); // Update every 5 minutes
            }
        }
        #endregion

        #region Logging
        private void LogSecurityEvent(string playerId, SecurityEventType eventType, string description)
        {
            var securityEvent = new SecurityEvent
            {
                eventId = Guid.NewGuid().ToString(),
                playerId = playerId,
                eventType = eventType,
                description = description,
                data = new Dictionary<string, object>(),
                timestamp = DateTime.Now,
                severity = SecurityLevel.Low
            };

            _securityEvents[securityEvent.eventId] = securityEvent;
            Logger.Info($"Security Event: {eventType} - {description}", "Security");
        }
        #endregion

        #region Statistics
        public Dictionary<string, object> GetSecurityStatistics()
        {
            return new Dictionary<string, object>
            {
                {"total_players", _playerProfiles.Count},
                {"banned_players", _playerProfiles.Values.Count(p => p.isBanned)},
                {"suspicious_players", _playerProfiles.Values.Count(p => p.isSuspicious)},
                {"total_violations", _playerProfiles.Values.Sum(p => p.violations.Count)},
                {"total_cheat_detections", _cheatDetections.Count},
                {"total_security_events", _securityEvents.Count},
                {"enable_security", enableSecurity},
                {"enable_anti_cheat", enableAntiCheat},
                {"enable_data_encryption", enableDataEncryption},
                {"enable_input_validation", enableInputValidation},
                {"enable_memory_protection", enableMemoryProtection}
            };
        }
        #endregion
    }

    /// <summary>
    /// Data encryptor
    /// </summary>
    public class DataEncryptor
    {
        private string encryptionKey;

        public DataEncryptor(string key)
        {
            encryptionKey = key;
        }

        public string Encrypt(string data)
        {
            // Simple encryption implementation
            return Convert.ToBase64String(Encoding.UTF8.GetBytes(data));
        }

        public string Decrypt(string encryptedData)
        {
            // Simple decryption implementation
            return Encoding.UTF8.GetString(Convert.FromBase64String(encryptedData));
        }

        public string Hash(string data)
        {
            using (var sha256 = SHA256.Create())
            {
                var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(data));
                return Convert.ToBase64String(hash);
            }
        }

        public string Sign(string data)
        {
            // Simple signing implementation
            return Hash(data + encryptionKey);
        }

        public bool VerifySignature(string data, string signature)
        {
            return Sign(data) == signature;
        }
    }

    /// <summary>
    /// Cheat detector
    /// </summary>
    public class CheatDetector
    {
        public bool DetectSpeedHack(Dictionary<string, object> gameData)
        {
            // Speed hack detection logic
            return false;
        }

        public bool DetectMemoryHack(Dictionary<string, object> gameData)
        {
            // Memory hack detection logic
            return false;
        }

        public bool DetectValueHack(Dictionary<string, object> gameData)
        {
            // Value hack detection logic
            return false;
        }
    }

    /// <summary>
    /// Input validator
    /// </summary>
    public class InputValidator
    {
        public bool Validate(InputType inputType, Dictionary<string, object> inputData)
        {
            // Input validation logic
            return true;
        }

        public bool ValidateGameAction(string actionType, Dictionary<string, object> actionData)
        {
            // Game action validation logic
            return true;
        }
    }

    /// <summary>
    /// Memory protector
    /// </summary>
    public class MemoryProtector
    {
        public void ProtectMemory()
        {
            // Memory protection logic
        }
    }

    /// <summary>
    /// Network security
    /// </summary>
    public class NetworkSecurity
    {
        private Dictionary<string, List<DateTime>> requestHistory = new Dictionary<string, List<DateTime>>();

        public bool CheckRateLimit(string playerId)
        {
            if (!requestHistory.ContainsKey(playerId))
            {
                requestHistory[playerId] = new List<DateTime>();
            }

            var now = DateTime.Now;
            var recentRequests = requestHistory[playerId].Where(r => (now - r).TotalMinutes < 1).ToList();
            
            if (recentRequests.Count >= 60) // 60 requests per minute
            {
                return false;
            }

            requestHistory[playerId].Add(now);
            return true;
        }

        public bool ValidateRequest(string endpoint, Dictionary<string, object> requestData)
        {
            // Request validation logic
            return true;
        }

        public string Encrypt(string data)
        {
            // Network encryption logic
            return data;
        }

        public string Decrypt(string encryptedData)
        {
            // Network decryption logic
            return encryptedData;
        }
    }

    /// <summary>
    /// Behavior analyzer
    /// </summary>
    public class BehaviorAnalyzer
    {
        public void AnalyzeBehavior(PlayerSecurityProfile profile, Dictionary<string, object> activityData)
        {
            // Behavior analysis logic
        }
    }

    /// <summary>
    /// Input type enum
    /// </summary>
    public enum InputType
    {
        Touch,
        Keyboard,
        Mouse,
        Gamepad,
        Voice,
        Gesture
    }
}