using System.Collections.Generic;
using UnityEngine;
using System;
using System.Collections;
using Evergreen.Core;

namespace Evergreen.Accessibility
{
    /// <summary>
    /// Comprehensive accessibility manager with support for visual, auditory, motor, and cognitive accessibility
    /// </summary>
    public class AccessibilityManager : MonoBehaviour
    {
        public static AccessibilityManager Instance { get; private set; }

        [Header("Accessibility Settings")]
        public bool enableAccessibility = true;
        public bool enableVisualAccessibility = true;
        public bool enableAuditoryAccessibility = true;
        public bool enableMotorAccessibility = true;
        public bool enableCognitiveAccessibility = true;

        [Header("Visual Accessibility")]
        public bool enableHighContrast = true;
        public bool enableColorBlindSupport = true;
        public bool enableTextScaling = true;
        public bool enableScreenReader = true;
        public bool enableVisualIndicators = true;
        public float textScale = 1.0f;
        public float contrastRatio = 1.0f;

        [Header("Auditory Accessibility")]
        public bool enableSubtitles = true;
        public bool enableVisualAudio = true;
        public bool enableHapticFeedback = true;
        public bool enableAudioDescription = true;
        public float subtitleSize = 1.0f;
        public float audioVolume = 1.0f;

        [Header("Motor Accessibility")]
        public bool enableOneHandedMode = true;
        public bool enableSwitchControl = true;
        public bool enableVoiceControl = true;
        public bool enableGestureControl = true;
        public bool enableAssistiveTouch = true;
        public float touchSensitivity = 1.0f;
        public float holdDuration = 0.5f;

        [Header("Cognitive Accessibility")]
        public bool enableSimplifiedUI = true;
        public bool enableClearInstructions = true;
        public bool enableProgressIndicators = true;
        public bool enableErrorPrevention = true;
        public bool enableMemoryAids = true;
        public bool enableFocusMode = true;

        private Dictionary<string, AccessibilityProfile> _playerProfiles = new Dictionary<string, AccessibilityProfile>();
        private Dictionary<string, AccessibilityFeature> _accessibilityFeatures = new Dictionary<string, AccessibilityFeature>();

        private VisualAccessibilityManager _visualManager;
        private AuditoryAccessibilityManager _auditoryManager;
        private MotorAccessibilityManager _motorManager;
        private CognitiveAccessibilityManager _cognitiveManager;
        private ScreenReaderManager _screenReaderManager;
        private VoiceControlManager _voiceControlManager;

        public class AccessibilityProfile
        {
            public string playerId;
            public VisualAccessibilitySettings visualSettings;
            public AuditoryAccessibilitySettings auditorySettings;
            public MotorAccessibilitySettings motorSettings;
            public CognitiveAccessibilitySettings cognitiveSettings;
            public List<string> enabledFeatures;
            public DateTime lastUpdated;
        }

        public class VisualAccessibilitySettings
        {
            public bool highContrast;
            public ColorBlindType colorBlindType;
            public float textScale;
            public float contrastRatio;
            public bool screenReader;
            public bool visualIndicators;
            public bool reduceMotion;
            public bool largeText;
        }

        public class AuditoryAccessibilitySettings
        {
            public bool subtitles;
            public bool visualAudio;
            public bool hapticFeedback;
            public bool audioDescription;
            public float subtitleSize;
            public float audioVolume;
            public bool monoAudio;
            public bool reduceAudio;
        }

        public class MotorAccessibilitySettings
        {
            public bool oneHandedMode;
            public bool switchControl;
            public bool voiceControl;
            public bool gestureControl;
            public bool assistiveTouch;
            public float touchSensitivity;
            public float holdDuration;
            public bool stickyKeys;
        }

        public class CognitiveAccessibilitySettings
        {
            public bool simplifiedUI;
            public bool clearInstructions;
            public bool progressIndicators;
            public bool errorPrevention;
            public bool memoryAids;
            public bool focusMode;
            public bool reduceDistractions;
            public bool pauseOnFocusLoss;
        }

        public class AccessibilityFeature
        {
            public string featureId;
            public string featureName;
            public AccessibilityType featureType;
            public bool isEnabled;
            public Dictionary<string, object> parameters;
            public DateTime lastUsed;
        }

        public enum ColorBlindType
        {
            None,
            Protanopia,
            Deuteranopia,
            Tritanopia,
            Monochromacy
        }

        public enum AccessibilityType
        {
            Visual,
            Auditory,
            Motor,
            Cognitive,
            Universal
        }

        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeAccessibility();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        private void InitializeAccessibility()
        {
            if (!enableAccessibility) return;

            _visualManager = new VisualAccessibilityManager();
            _auditoryManager = new AuditoryAccessibilityManager();
            _motorManager = new MotorAccessibilityManager();
            _cognitiveManager = new CognitiveAccessibilityManager();
            _screenReaderManager = new ScreenReaderManager();
            _voiceControlManager = new VoiceControlManager();

            InitializeAccessibilityFeatures();
            StartCoroutine(UpdateAccessibility());

            Logger.Info("Accessibility Manager initialized", "Accessibility");
        }

        #region Player Profiles
        public void CreateAccessibilityProfile(string playerId)
        {
            var profile = new AccessibilityProfile
            {
                playerId = playerId,
                visualSettings = new VisualAccessibilitySettings
                {
                    highContrast = false,
                    colorBlindType = ColorBlindType.None,
                    textScale = 1.0f,
                    contrastRatio = 1.0f,
                    screenReader = false,
                    visualIndicators = true,
                    reduceMotion = false,
                    largeText = false
                },
                auditorySettings = new AuditoryAccessibilitySettings
                {
                    subtitles = false,
                    visualAudio = false,
                    hapticFeedback = true,
                    audioDescription = false,
                    subtitleSize = 1.0f,
                    audioVolume = 1.0f,
                    monoAudio = false,
                    reduceAudio = false
                },
                motorSettings = new MotorAccessibilitySettings
                {
                    oneHandedMode = false,
                    switchControl = false,
                    voiceControl = false,
                    gestureControl = false,
                    assistiveTouch = false,
                    touchSensitivity = 1.0f,
                    holdDuration = 0.5f,
                    stickyKeys = false
                },
                cognitiveSettings = new CognitiveAccessibilitySettings
                {
                    simplifiedUI = false,
                    clearInstructions = true,
                    progressIndicators = true,
                    errorPrevention = true,
                    memoryAids = false,
                    focusMode = false,
                    reduceDistractions = false,
                    pauseOnFocusLoss = false
                },
                enabledFeatures = new List<string>(),
                lastUpdated = DateTime.Now
            };

            _playerProfiles[playerId] = profile;
        }

        public AccessibilityProfile GetAccessibilityProfile(string playerId)
        {
            if (!_playerProfiles.ContainsKey(playerId))
            {
                CreateAccessibilityProfile(playerId);
            }

            return _playerProfiles[playerId];
        }

        public void UpdateAccessibilityProfile(string playerId, AccessibilityProfile profile)
        {
            if (_playerProfiles.ContainsKey(playerId))
            {
                profile.lastUpdated = DateTime.Now;
                _playerProfiles[playerId] = profile;
                ApplyAccessibilitySettings(playerId, profile);
            }
        }
        #endregion

        #region Visual Accessibility
        public void SetHighContrast(string playerId, bool enabled)
        {
            var profile = GetAccessibilityProfile(playerId);
            profile.visualSettings.highContrast = enabled;
            _visualManager.SetHighContrast(enabled);
        }

        public void SetColorBlindSupport(string playerId, ColorBlindType colorBlindType)
        {
            var profile = GetAccessibilityProfile(playerId);
            profile.visualSettings.colorBlindType = colorBlindType;
            _visualManager.SetColorBlindSupport(colorBlindType);
        }

        public void SetTextScale(string playerId, float scale)
        {
            var profile = GetAccessibilityProfile(playerId);
            profile.visualSettings.textScale = scale;
            _visualManager.SetTextScale(scale);
        }

        public void SetScreenReader(string playerId, bool enabled)
        {
            var profile = GetAccessibilityProfile(playerId);
            profile.visualSettings.screenReader = enabled;
            _screenReaderManager.SetEnabled(enabled);
        }

        public void SetVisualIndicators(string playerId, bool enabled)
        {
            var profile = GetAccessibilityProfile(playerId);
            profile.visualSettings.visualIndicators = enabled;
            _visualManager.SetVisualIndicators(enabled);
        }

        public void SetReduceMotion(string playerId, bool enabled)
        {
            var profile = GetAccessibilityProfile(playerId);
            profile.visualSettings.reduceMotion = enabled;
            _visualManager.SetReduceMotion(enabled);
        }
        #endregion

        #region Auditory Accessibility
        public void SetSubtitles(string playerId, bool enabled)
        {
            var profile = GetAccessibilityProfile(playerId);
            profile.auditorySettings.subtitles = enabled;
            _auditoryManager.SetSubtitles(enabled);
        }

        public void SetVisualAudio(string playerId, bool enabled)
        {
            var profile = GetAccessibilityProfile(playerId);
            profile.auditorySettings.visualAudio = enabled;
            _auditoryManager.SetVisualAudio(enabled);
        }

        public void SetHapticFeedback(string playerId, bool enabled)
        {
            var profile = GetAccessibilityProfile(playerId);
            profile.auditorySettings.hapticFeedback = enabled;
            _auditoryManager.SetHapticFeedback(enabled);
        }

        public void SetAudioDescription(string playerId, bool enabled)
        {
            var profile = GetAccessibilityProfile(playerId);
            profile.auditorySettings.audioDescription = enabled;
            _auditoryManager.SetAudioDescription(enabled);
        }

        public void SetSubtitleSize(string playerId, float size)
        {
            var profile = GetAccessibilityProfile(playerId);
            profile.auditorySettings.subtitleSize = size;
            _auditoryManager.SetSubtitleSize(size);
        }

        public void SetAudioVolume(string playerId, float volume)
        {
            var profile = GetAccessibilityProfile(playerId);
            profile.auditorySettings.audioVolume = volume;
            _auditoryManager.SetAudioVolume(volume);
        }
        #endregion

        #region Motor Accessibility
        public void SetOneHandedMode(string playerId, bool enabled)
        {
            var profile = GetAccessibilityProfile(playerId);
            profile.motorSettings.oneHandedMode = enabled;
            _motorManager.SetOneHandedMode(enabled);
        }

        public void SetSwitchControl(string playerId, bool enabled)
        {
            var profile = GetAccessibilityProfile(playerId);
            profile.motorSettings.switchControl = enabled;
            _motorManager.SetSwitchControl(enabled);
        }

        public void SetVoiceControl(string playerId, bool enabled)
        {
            var profile = GetAccessibilityProfile(playerId);
            profile.motorSettings.voiceControl = enabled;
            _voiceControlManager.SetEnabled(enabled);
        }

        public void SetGestureControl(string playerId, bool enabled)
        {
            var profile = GetAccessibilityProfile(playerId);
            profile.motorSettings.gestureControl = enabled;
            _motorManager.SetGestureControl(enabled);
        }

        public void SetAssistiveTouch(string playerId, bool enabled)
        {
            var profile = GetAccessibilityProfile(playerId);
            profile.motorSettings.assistiveTouch = enabled;
            _motorManager.SetAssistiveTouch(enabled);
        }

        public void SetTouchSensitivity(string playerId, float sensitivity)
        {
            var profile = GetAccessibilityProfile(playerId);
            profile.motorSettings.touchSensitivity = sensitivity;
            _motorManager.SetTouchSensitivity(sensitivity);
        }

        public void SetHoldDuration(string playerId, float duration)
        {
            var profile = GetAccessibilityProfile(playerId);
            profile.motorSettings.holdDuration = duration;
            _motorManager.SetHoldDuration(duration);
        }
        #endregion

        #region Cognitive Accessibility
        public void SetSimplifiedUI(string playerId, bool enabled)
        {
            var profile = GetAccessibilityProfile(playerId);
            profile.cognitiveSettings.simplifiedUI = enabled;
            _cognitiveManager.SetSimplifiedUI(enabled);
        }

        public void SetClearInstructions(string playerId, bool enabled)
        {
            var profile = GetAccessibilityProfile(playerId);
            profile.cognitiveSettings.clearInstructions = enabled;
            _cognitiveManager.SetClearInstructions(enabled);
        }

        public void SetProgressIndicators(string playerId, bool enabled)
        {
            var profile = GetAccessibilityProfile(playerId);
            profile.cognitiveSettings.progressIndicators = enabled;
            _cognitiveManager.SetProgressIndicators(enabled);
        }

        public void SetErrorPrevention(string playerId, bool enabled)
        {
            var profile = GetAccessibilityProfile(playerId);
            profile.cognitiveSettings.errorPrevention = enabled;
            _cognitiveManager.SetErrorPrevention(enabled);
        }

        public void SetMemoryAids(string playerId, bool enabled)
        {
            var profile = GetAccessibilityProfile(playerId);
            profile.cognitiveSettings.memoryAids = enabled;
            _cognitiveManager.SetMemoryAids(enabled);
        }

        public void SetFocusMode(string playerId, bool enabled)
        {
            var profile = GetAccessibilityProfile(playerId);
            profile.cognitiveSettings.focusMode = enabled;
            _cognitiveManager.SetFocusMode(enabled);
        }

        public void SetReduceDistractions(string playerId, bool enabled)
        {
            var profile = GetAccessibilityProfile(playerId);
            profile.cognitiveSettings.reduceDistractions = enabled;
            _cognitiveManager.SetReduceDistractions(enabled);
        }
        #endregion

        #region Feature Management
        private void InitializeAccessibilityFeatures()
        {
            // Visual features
            _accessibilityFeatures["high_contrast"] = new AccessibilityFeature
            {
                featureId = "high_contrast",
                featureName = "High Contrast",
                featureType = AccessibilityType.Visual,
                isEnabled = false,
                parameters = new Dictionary<string, object>()
            };

            _accessibilityFeatures["color_blind_support"] = new AccessibilityFeature
            {
                featureId = "color_blind_support",
                featureName = "Color Blind Support",
                featureType = AccessibilityType.Visual,
                isEnabled = false,
                parameters = new Dictionary<string, object>()
            };

            _accessibilityFeatures["text_scaling"] = new AccessibilityFeature
            {
                featureId = "text_scaling",
                featureName = "Text Scaling",
                featureType = AccessibilityType.Visual,
                isEnabled = false,
                parameters = new Dictionary<string, object>()
            };

            // Auditory features
            _accessibilityFeatures["subtitles"] = new AccessibilityFeature
            {
                featureId = "subtitles",
                featureName = "Subtitles",
                featureType = AccessibilityType.Auditory,
                isEnabled = false,
                parameters = new Dictionary<string, object>()
            };

            _accessibilityFeatures["haptic_feedback"] = new AccessibilityFeature
            {
                featureId = "haptic_feedback",
                featureName = "Haptic Feedback",
                featureType = AccessibilityType.Auditory,
                isEnabled = true,
                parameters = new Dictionary<string, object>()
            };

            // Motor features
            _accessibilityFeatures["one_handed_mode"] = new AccessibilityFeature
            {
                featureId = "one_handed_mode",
                featureName = "One Handed Mode",
                featureType = AccessibilityType.Motor,
                isEnabled = false,
                parameters = new Dictionary<string, object>()
            };

            _accessibilityFeatures["voice_control"] = new AccessibilityFeature
            {
                featureId = "voice_control",
                featureName = "Voice Control",
                featureType = AccessibilityType.Motor,
                isEnabled = false,
                parameters = new Dictionary<string, object>()
            };

            // Cognitive features
            _accessibilityFeatures["simplified_ui"] = new AccessibilityFeature
            {
                featureId = "simplified_ui",
                featureName = "Simplified UI",
                featureType = AccessibilityType.Cognitive,
                isEnabled = false,
                parameters = new Dictionary<string, object>()
            };

            _accessibilityFeatures["focus_mode"] = new AccessibilityFeature
            {
                featureId = "focus_mode",
                featureName = "Focus Mode",
                featureType = AccessibilityType.Cognitive,
                isEnabled = false,
                parameters = new Dictionary<string, object>()
            };
        }

        public void EnableFeature(string playerId, string featureId)
        {
            if (_accessibilityFeatures.ContainsKey(featureId))
            {
                var feature = _accessibilityFeatures[featureId];
                feature.isEnabled = true;
                feature.lastUsed = DateTime.Now;

                var profile = GetAccessibilityProfile(playerId);
                if (!profile.enabledFeatures.Contains(featureId))
                {
                    profile.enabledFeatures.Add(featureId);
                }

                ApplyFeature(playerId, feature);
            }
        }

        public void DisableFeature(string playerId, string featureId)
        {
            if (_accessibilityFeatures.ContainsKey(featureId))
            {
                var feature = _accessibilityFeatures[featureId];
                feature.isEnabled = false;

                var profile = GetAccessibilityProfile(playerId);
                profile.enabledFeatures.Remove(featureId);

                RemoveFeature(playerId, feature);
            }
        }

        private void ApplyFeature(string playerId, AccessibilityFeature feature)
        {
            switch (feature.featureId)
            {
                case "high_contrast":
                    SetHighContrast(playerId, true);
                    break;
                case "color_blind_support":
                    SetColorBlindSupport(playerId, ColorBlindType.Protanopia);
                    break;
                case "text_scaling":
                    SetTextScale(playerId, 1.2f);
                    break;
                case "subtitles":
                    SetSubtitles(playerId, true);
                    break;
                case "one_handed_mode":
                    SetOneHandedMode(playerId, true);
                    break;
                case "voice_control":
                    SetVoiceControl(playerId, true);
                    break;
                case "simplified_ui":
                    SetSimplifiedUI(playerId, true);
                    break;
                case "focus_mode":
                    SetFocusMode(playerId, true);
                    break;
            }
        }

        private void RemoveFeature(string playerId, AccessibilityFeature feature)
        {
            switch (feature.featureId)
            {
                case "high_contrast":
                    SetHighContrast(playerId, false);
                    break;
                case "color_blind_support":
                    SetColorBlindSupport(playerId, ColorBlindType.None);
                    break;
                case "text_scaling":
                    SetTextScale(playerId, 1.0f);
                    break;
                case "subtitles":
                    SetSubtitles(playerId, false);
                    break;
                case "one_handed_mode":
                    SetOneHandedMode(playerId, false);
                    break;
                case "voice_control":
                    SetVoiceControl(playerId, false);
                    break;
                case "simplified_ui":
                    SetSimplifiedUI(playerId, false);
                    break;
                case "focus_mode":
                    SetFocusMode(playerId, false);
                    break;
            }
        }
        #endregion

        #region Settings Application
        private void ApplyAccessibilitySettings(string playerId, AccessibilityProfile profile)
        {
            // Apply visual settings
            _visualManager.ApplySettings(profile.visualSettings);

            // Apply auditory settings
            _auditoryManager.ApplySettings(profile.auditorySettings);

            // Apply motor settings
            _motorManager.ApplySettings(profile.motorSettings);

            // Apply cognitive settings
            _cognitiveManager.ApplySettings(profile.cognitiveSettings);
        }
        #endregion

        #region Updates
        private System.Collections.IEnumerator UpdateAccessibility()
        {
            while (true)
            {
                // Update accessibility features
                foreach (var profile in _playerProfiles.Values)
                {
                    UpdatePlayerAccessibility(profile);
                }

                yield return new WaitForSeconds(1f);
            }
        }

        private void UpdatePlayerAccessibility(AccessibilityProfile profile)
        {
            // Update visual accessibility
            if (profile.visualSettings.screenReader)
            {
                _screenReaderManager.Update();
            }

            // Update motor accessibility
            if (profile.motorSettings.voiceControl)
            {
                _voiceControlManager.Update();
            }

            // Update cognitive accessibility
            if (profile.cognitiveSettings.focusMode)
            {
                _cognitiveManager.UpdateFocusMode();
            }
        }
        #endregion

        #region Statistics
        public Dictionary<string, object> GetAccessibilityStatistics()
        {
            return new Dictionary<string, object>
            {
                {"total_players", _playerProfiles.Count},
                {"players_with_visual_accessibility", _playerProfiles.Values.Count(p => p.visualSettings.highContrast || p.visualSettings.screenReader)},
                {"players_with_auditory_accessibility", _playerProfiles.Values.Count(p => p.auditorySettings.subtitles || p.auditorySettings.hapticFeedback)},
                {"players_with_motor_accessibility", _playerProfiles.Values.Count(p => p.motorSettings.oneHandedMode || p.motorSettings.voiceControl)},
                {"players_with_cognitive_accessibility", _playerProfiles.Values.Count(p => p.cognitiveSettings.simplifiedUI || p.cognitiveSettings.focusMode)},
                {"total_features", _accessibilityFeatures.Count},
                {"enabled_features", _accessibilityFeatures.Values.Count(f => f.isEnabled)},
                {"enable_accessibility", enableAccessibility},
                {"enable_visual_accessibility", enableVisualAccessibility},
                {"enable_auditory_accessibility", enableAuditoryAccessibility},
                {"enable_motor_accessibility", enableMotorAccessibility},
                {"enable_cognitive_accessibility", enableCognitiveAccessibility}
            };
        }
        #endregion
    }

    /// <summary>
    /// Visual accessibility manager
    /// </summary>
    public class VisualAccessibilityManager
    {
        public void SetHighContrast(bool enabled)
        {
            // Implement high contrast mode
        }

        public void SetColorBlindSupport(ColorBlindType colorBlindType)
        {
            // Implement color blind support
        }

        public void SetTextScale(float scale)
        {
            // Implement text scaling
        }

        public void SetVisualIndicators(bool enabled)
        {
            // Implement visual indicators
        }

        public void SetReduceMotion(bool enabled)
        {
            // Implement motion reduction
        }

        public void ApplySettings(VisualAccessibilitySettings settings)
        {
            // Apply all visual settings
        }
    }

    /// <summary>
    /// Auditory accessibility manager
    /// </summary>
    public class AuditoryAccessibilityManager
    {
        public void SetSubtitles(bool enabled)
        {
            // Implement subtitles
        }

        public void SetVisualAudio(bool enabled)
        {
            // Implement visual audio cues
        }

        public void SetHapticFeedback(bool enabled)
        {
            // Implement haptic feedback
        }

        public void SetAudioDescription(bool enabled)
        {
            // Implement audio description
        }

        public void SetSubtitleSize(float size)
        {
            // Implement subtitle sizing
        }

        public void SetAudioVolume(float volume)
        {
            // Implement audio volume control
        }

        public void ApplySettings(AuditoryAccessibilitySettings settings)
        {
            // Apply all auditory settings
        }
    }

    /// <summary>
    /// Motor accessibility manager
    /// </summary>
    public class MotorAccessibilityManager
    {
        public void SetOneHandedMode(bool enabled)
        {
            // Implement one-handed mode
        }

        public void SetSwitchControl(bool enabled)
        {
            // Implement switch control
        }

        public void SetGestureControl(bool enabled)
        {
            // Implement gesture control
        }

        public void SetAssistiveTouch(bool enabled)
        {
            // Implement assistive touch
        }

        public void SetTouchSensitivity(float sensitivity)
        {
            // Implement touch sensitivity
        }

        public void SetHoldDuration(float duration)
        {
            // Implement hold duration
        }

        public void ApplySettings(MotorAccessibilitySettings settings)
        {
            // Apply all motor settings
        }
    }

    /// <summary>
    /// Cognitive accessibility manager
    /// </summary>
    public class CognitiveAccessibilityManager
    {
        public void SetSimplifiedUI(bool enabled)
        {
            // Implement simplified UI
        }

        public void SetClearInstructions(bool enabled)
        {
            // Implement clear instructions
        }

        public void SetProgressIndicators(bool enabled)
        {
            // Implement progress indicators
        }

        public void SetErrorPrevention(bool enabled)
        {
            // Implement error prevention
        }

        public void SetMemoryAids(bool enabled)
        {
            // Implement memory aids
        }

        public void SetFocusMode(bool enabled)
        {
            // Implement focus mode
        }

        public void SetReduceDistractions(bool enabled)
        {
            // Implement distraction reduction
        }

        public void UpdateFocusMode()
        {
            // Update focus mode
        }

        public void ApplySettings(CognitiveAccessibilitySettings settings)
        {
            // Apply all cognitive settings
        }
    }

    /// <summary>
    /// Screen reader manager
    /// </summary>
    public class ScreenReaderManager
    {
        public void SetEnabled(bool enabled)
        {
            // Enable/disable screen reader
        }

        public void Update()
        {
            // Update screen reader
        }
    }

    /// <summary>
    /// Voice control manager
    /// </summary>
    public class VoiceControlManager
    {
        public void SetEnabled(bool enabled)
        {
            // Enable/disable voice control
        }

        public void Update()
        {
            // Update voice control
        }
    }
}