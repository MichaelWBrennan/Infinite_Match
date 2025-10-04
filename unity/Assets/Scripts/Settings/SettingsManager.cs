using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System;

namespace Evergreen.Settings
{
    [System.Serializable]
    public class GameSettings
    {
        [Header("Audio Settings")]
        public float masterVolume = 1f;
        public float musicVolume = 0.7f;
        public float sfxVolume = 1f;
        public float uiVolume = 1f;
        public float ambientVolume = 0.5f;
        public bool muteAll = false;
        
        [Header("Graphics Settings")]
        public int graphicsQuality = 2; // 0 = Low, 1 = Medium, 2 = High, 3 = Ultra
        public bool fullscreen = true;
        public int resolutionIndex = 0;
        public bool vsync = true;
        public int targetFPS = 60;
        public bool particleEffects = true;
        public bool screenShake = true;
        public bool bloom = true;
        public bool shadows = true;
        
        [Header("Gameplay Settings")]
        public bool autoSave = true;
        public bool cloudSave = true;
        public bool notifications = true;
        public bool vibration = true;
        public bool hapticFeedback = true;
        public bool showTutorials = true;
        public bool showHints = true;
        public bool showParticleEffects = true;
        public bool showScreenShake = true;
        
        [Header("Social Settings")]
        public bool allowFriendRequests = true;
        public bool showOnlineStatus = true;
        public bool allowChat = true;
        public bool allowGifts = true;
        
        [Header("Privacy Settings")]
        public bool analyticsEnabled = true;
        public bool crashReporting = true;
        public bool personalizedAds = true;
        public bool dataCollection = true;
        
        [Header("Language Settings")]
        public string language = "en";
        public bool autoDetectLanguage = true;
        
        [Header("Accessibility Settings")]
        public bool colorblindMode = false;
        public bool highContrast = false;
        public bool largeText = false;
        public bool reducedMotion = false;
        public bool screenReader = false;
    }
    
    public class SettingsManager : MonoBehaviour
    {
        [Header("Settings UI")]
        public GameObject settingsPanel;
        public Button settingsButton;
        public Button closeButton;
        
        [Header("Audio Settings UI")]
        public Slider masterVolumeSlider;
        public Slider musicVolumeSlider;
        public Slider sfxVolumeSlider;
        public Slider uiVolumeSlider;
        public Slider ambientVolumeSlider;
        public Toggle muteAllToggle;
        public TextMeshProUGUI masterVolumeText;
        public TextMeshProUGUI musicVolumeText;
        public TextMeshProUGUI sfxVolumeText;
        public TextMeshProUGUI uiVolumeText;
        public TextMeshProUGUI ambientVolumeText;
        
        [Header("Graphics Settings UI")]
        public Dropdown graphicsQualityDropdown;
        public Toggle fullscreenToggle;
        public Dropdown resolutionDropdown;
        public Toggle vsyncToggle;
        public Dropdown targetFPSDropdown;
        public Toggle particleEffectsToggle;
        public Toggle screenShakeToggle;
        public Toggle bloomToggle;
        public Toggle shadowsToggle;
        
        [Header("Gameplay Settings UI")]
        public Toggle autoSaveToggle;
        public Toggle cloudSaveToggle;
        public Toggle notificationsToggle;
        public Toggle vibrationToggle;
        public Toggle hapticFeedbackToggle;
        public Toggle showTutorialsToggle;
        public Toggle showHintsToggle;
        public Toggle showParticleEffectsToggle;
        public Toggle showScreenShakeToggle;
        
        [Header("Social Settings UI")]
        public Toggle allowFriendRequestsToggle;
        public Toggle showOnlineStatusToggle;
        public Toggle allowChatToggle;
        public Toggle allowGiftsToggle;
        
        [Header("Privacy Settings UI")]
        public Toggle analyticsEnabledToggle;
        public Toggle crashReportingToggle;
        public Toggle personalizedAdsToggle;
        public Toggle dataCollectionToggle;
        
        [Header("Language Settings UI")]
        public Dropdown languageDropdown;
        public Toggle autoDetectLanguageToggle;
        
        [Header("Accessibility Settings UI")]
        public Toggle colorblindModeToggle;
        public Toggle highContrastToggle;
        public Toggle largeTextToggle;
        public Toggle reducedMotionToggle;
        public Toggle screenReaderToggle;
        
        [Header("Reset Settings")]
        public Button resetToDefaultButton;
        public Button resetAudioButton;
        public Button resetGraphicsButton;
        public Button resetGameplayButton;
        public Button resetPrivacyButton;
        
        public static SettingsManager Instance { get; private set; }
        
        private GameSettings currentSettings;
        private Resolution[] availableResolutions;
        private string[] availableLanguages = { "en", "es", "fr", "de", "ja", "ko", "zh", "ru", "pt", "ar" };
        private string[] languageNames = { "English", "Español", "Français", "Deutsch", "日本語", "한국어", "中文", "Русский", "Português", "العربية" };
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeSettings();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            LoadSettings();
            SetupUI();
            ApplySettings();
        }
        
        private void InitializeSettings()
        {
            currentSettings = new GameSettings();
            availableResolutions = Screen.resolutions;
        }
        
        private void SetupUI()
        {
            // Setup button listeners
            if (settingsButton != null)
                settingsButton.onClick.AddListener(ShowSettings);
            
            if (closeButton != null)
                closeButton.onClick.AddListener(HideSettings);
            
            // Setup audio sliders
            SetupAudioSliders();
            
            // Setup graphics dropdowns
            SetupGraphicsDropdowns();
            
            // Setup gameplay toggles
            SetupGameplayToggles();
            
            // Setup social toggles
            SetupSocialToggles();
            
            // Setup privacy toggles
            SetupPrivacyToggles();
            
            // Setup language dropdown
            SetupLanguageDropdown();
            
            // Setup accessibility toggles
            SetupAccessibilityToggles();
            
            // Setup reset buttons
            SetupResetButtons();
        }
        
        private void SetupAudioSliders()
        {
            if (masterVolumeSlider != null)
            {
                masterVolumeSlider.onValueChanged.AddListener(OnMasterVolumeChanged);
            }
            
            if (musicVolumeSlider != null)
            {
                musicVolumeSlider.onValueChanged.AddListener(OnMusicVolumeChanged);
            }
            
            if (sfxVolumeSlider != null)
            {
                sfxVolumeSlider.onValueChanged.AddListener(OnSFXVolumeChanged);
            }
            
            if (uiVolumeSlider != null)
            {
                uiVolumeSlider.onValueChanged.AddListener(OnUIVolumeChanged);
            }
            
            if (ambientVolumeSlider != null)
            {
                ambientVolumeSlider.onValueChanged.AddListener(OnAmbientVolumeChanged);
            }
            
            if (muteAllToggle != null)
            {
                muteAllToggle.onValueChanged.AddListener(OnMuteAllChanged);
            }
        }
        
        private void SetupGraphicsDropdowns()
        {
            if (graphicsQualityDropdown != null)
            {
                graphicsQualityDropdown.options.Clear();
                graphicsQualityDropdown.options.Add(new Dropdown.OptionData("Low"));
                graphicsQualityDropdown.options.Add(new Dropdown.OptionData("Medium"));
                graphicsQualityDropdown.options.Add(new Dropdown.OptionData("High"));
                graphicsQualityDropdown.options.Add(new Dropdown.OptionData("Ultra"));
                graphicsQualityDropdown.onValueChanged.AddListener(OnGraphicsQualityChanged);
            }
            
            if (resolutionDropdown != null)
            {
                resolutionDropdown.options.Clear();
                for (int i = 0; i < availableResolutions.Length; i++)
                {
                    var resolution = availableResolutions[i];
                    resolutionDropdown.options.Add(new Dropdown.OptionData($"{resolution.width}x{resolution.height}"));
                }
                resolutionDropdown.onValueChanged.AddListener(OnResolutionChanged);
            }
            
            if (targetFPSDropdown != null)
            {
                targetFPSDropdown.options.Clear();
                targetFPSDropdown.options.Add(new Dropdown.OptionData("30 FPS"));
                targetFPSDropdown.options.Add(new Dropdown.OptionData("60 FPS"));
                targetFPSDropdown.options.Add(new Dropdown.OptionData("120 FPS"));
                targetFPSDropdown.options.Add(new Dropdown.OptionData("Unlimited"));
                targetFPSDropdown.onValueChanged.AddListener(OnTargetFPSChanged);
            }
            
            if (fullscreenToggle != null)
                fullscreenToggle.onValueChanged.AddListener(OnFullscreenChanged);
            
            if (vsyncToggle != null)
                vsyncToggle.onValueChanged.AddListener(OnVSyncChanged);
            
            if (particleEffectsToggle != null)
                particleEffectsToggle.onValueChanged.AddListener(OnParticleEffectsChanged);
            
            if (screenShakeToggle != null)
                screenShakeToggle.onValueChanged.AddListener(OnScreenShakeChanged);
            
            if (bloomToggle != null)
                bloomToggle.onValueChanged.AddListener(OnBloomChanged);
            
            if (shadowsToggle != null)
                shadowsToggle.onValueChanged.AddListener(OnShadowsChanged);
        }
        
        private void SetupGameplayToggles()
        {
            if (autoSaveToggle != null)
                autoSaveToggle.onValueChanged.AddListener(OnAutoSaveChanged);
            
            if (cloudSaveToggle != null)
                cloudSaveToggle.onValueChanged.AddListener(OnCloudSaveChanged);
            
            if (notificationsToggle != null)
                notificationsToggle.onValueChanged.AddListener(OnNotificationsChanged);
            
            if (vibrationToggle != null)
                vibrationToggle.onValueChanged.AddListener(OnVibrationChanged);
            
            if (hapticFeedbackToggle != null)
                hapticFeedbackToggle.onValueChanged.AddListener(OnHapticFeedbackChanged);
            
            if (showTutorialsToggle != null)
                showTutorialsToggle.onValueChanged.AddListener(OnShowTutorialsChanged);
            
            if (showHintsToggle != null)
                showHintsToggle.onValueChanged.AddListener(OnShowHintsChanged);
            
            if (showParticleEffectsToggle != null)
                showParticleEffectsToggle.onValueChanged.AddListener(OnShowParticleEffectsChanged);
            
            if (showScreenShakeToggle != null)
                showScreenShakeToggle.onValueChanged.AddListener(OnShowScreenShakeChanged);
        }
        
        private void SetupSocialToggles()
        {
            if (allowFriendRequestsToggle != null)
                allowFriendRequestsToggle.onValueChanged.AddListener(OnAllowFriendRequestsChanged);
            
            if (showOnlineStatusToggle != null)
                showOnlineStatusToggle.onValueChanged.AddListener(OnShowOnlineStatusChanged);
            
            if (allowChatToggle != null)
                allowChatToggle.onValueChanged.AddListener(OnAllowChatChanged);
            
            if (allowGiftsToggle != null)
                allowGiftsToggle.onValueChanged.AddListener(OnAllowGiftsChanged);
        }
        
        private void SetupPrivacyToggles()
        {
            if (analyticsEnabledToggle != null)
                analyticsEnabledToggle.onValueChanged.AddListener(OnAnalyticsEnabledChanged);
            
            if (crashReportingToggle != null)
                crashReportingToggle.onValueChanged.AddListener(OnCrashReportingChanged);
            
            if (personalizedAdsToggle != null)
                personalizedAdsToggle.onValueChanged.AddListener(OnPersonalizedAdsChanged);
            
            if (dataCollectionToggle != null)
                dataCollectionToggle.onValueChanged.AddListener(OnDataCollectionChanged);
        }
        
        private void SetupLanguageDropdown()
        {
            if (languageDropdown != null)
            {
                languageDropdown.options.Clear();
                for (int i = 0; i < availableLanguages.Length; i++)
                {
                    languageDropdown.options.Add(new Dropdown.OptionData(languageNames[i]));
                }
                languageDropdown.onValueChanged.AddListener(OnLanguageChanged);
            }
            
            if (autoDetectLanguageToggle != null)
                autoDetectLanguageToggle.onValueChanged.AddListener(OnAutoDetectLanguageChanged);
        }
        
        private void SetupAccessibilityToggles()
        {
            if (colorblindModeToggle != null)
                colorblindModeToggle.onValueChanged.AddListener(OnColorblindModeChanged);
            
            if (highContrastToggle != null)
                highContrastToggle.onValueChanged.AddListener(OnHighContrastChanged);
            
            if (largeTextToggle != null)
                largeTextToggle.onValueChanged.AddListener(OnLargeTextChanged);
            
            if (reducedMotionToggle != null)
                reducedMotionToggle.onValueChanged.AddListener(OnReducedMotionChanged);
            
            if (screenReaderToggle != null)
                screenReaderToggle.onValueChanged.AddListener(OnScreenReaderChanged);
        }
        
        private void SetupResetButtons()
        {
            if (resetToDefaultButton != null)
                resetToDefaultButton.onClick.AddListener(ResetToDefault);
            
            if (resetAudioButton != null)
                resetAudioButton.onClick.AddListener(ResetAudio);
            
            if (resetGraphicsButton != null)
                resetGraphicsButton.onClick.AddListener(ResetGraphics);
            
            if (resetGameplayButton != null)
                resetGameplayButton.onClick.AddListener(ResetGameplay);
            
            if (resetPrivacyButton != null)
                resetPrivacyButton.onClick.AddListener(ResetPrivacy);
        }
        
        // Audio Settings
        private void OnMasterVolumeChanged(float value)
        {
            currentSettings.masterVolume = value;
            UpdateVolumeText(masterVolumeText, value);
            ApplyAudioSettings();
        }
        
        private void OnMusicVolumeChanged(float value)
        {
            currentSettings.musicVolume = value;
            UpdateVolumeText(musicVolumeText, value);
            ApplyAudioSettings();
        }
        
        private void OnSFXVolumeChanged(float value)
        {
            currentSettings.sfxVolume = value;
            UpdateVolumeText(sfxVolumeText, value);
            ApplyAudioSettings();
        }
        
        private void OnUIVolumeChanged(float value)
        {
            currentSettings.uiVolume = value;
            UpdateVolumeText(uiVolumeText, value);
            ApplyAudioSettings();
        }
        
        private void OnAmbientVolumeChanged(float value)
        {
            currentSettings.ambientVolume = value;
            UpdateVolumeText(ambientVolumeText, value);
            ApplyAudioSettings();
        }
        
        private void OnMuteAllChanged(bool value)
        {
            currentSettings.muteAll = value;
            ApplyAudioSettings();
        }
        
        private void UpdateVolumeText(TextMeshProUGUI text, float value)
        {
            if (text != null)
            {
                text.text = Mathf.RoundToInt(value * 100) + "%";
            }
        }
        
        // Graphics Settings
        private void OnGraphicsQualityChanged(int value)
        {
            currentSettings.graphicsQuality = value;
            ApplyGraphicsSettings();
        }
        
        private void OnResolutionChanged(int value)
        {
            currentSettings.resolutionIndex = value;
            ApplyGraphicsSettings();
        }
        
        private void OnFullscreenChanged(bool value)
        {
            currentSettings.fullscreen = value;
            ApplyGraphicsSettings();
        }
        
        private void OnVSyncChanged(bool value)
        {
            currentSettings.vsync = value;
            ApplyGraphicsSettings();
        }
        
        private void OnTargetFPSChanged(int value)
        {
            currentSettings.targetFPS = value == 3 ? -1 : (value + 1) * 30; // 30, 60, 120, or -1 for unlimited
            ApplyGraphicsSettings();
        }
        
        private void OnParticleEffectsChanged(bool value)
        {
            currentSettings.particleEffects = value;
            ApplyGraphicsSettings();
        }
        
        private void OnScreenShakeChanged(bool value)
        {
            currentSettings.screenShake = value;
            ApplyGraphicsSettings();
        }
        
        private void OnBloomChanged(bool value)
        {
            currentSettings.bloom = value;
            ApplyGraphicsSettings();
        }
        
        private void OnShadowsChanged(bool value)
        {
            currentSettings.shadows = value;
            ApplyGraphicsSettings();
        }
        
        // Gameplay Settings
        private void OnAutoSaveChanged(bool value)
        {
            currentSettings.autoSave = value;
            ApplyGameplaySettings();
        }
        
        private void OnCloudSaveChanged(bool value)
        {
            currentSettings.cloudSave = value;
            ApplyGameplaySettings();
        }
        
        private void OnNotificationsChanged(bool value)
        {
            currentSettings.notifications = value;
            ApplyGameplaySettings();
        }
        
        private void OnVibrationChanged(bool value)
        {
            currentSettings.vibration = value;
            ApplyGameplaySettings();
        }
        
        private void OnHapticFeedbackChanged(bool value)
        {
            currentSettings.hapticFeedback = value;
            ApplyGameplaySettings();
        }
        
        private void OnShowTutorialsChanged(bool value)
        {
            currentSettings.showTutorials = value;
            ApplyGameplaySettings();
        }
        
        private void OnShowHintsChanged(bool value)
        {
            currentSettings.showHints = value;
            ApplyGameplaySettings();
        }
        
        private void OnShowParticleEffectsChanged(bool value)
        {
            currentSettings.showParticleEffects = value;
            ApplyGameplaySettings();
        }
        
        private void OnShowScreenShakeChanged(bool value)
        {
            currentSettings.showScreenShake = value;
            ApplyGameplaySettings();
        }
        
        // Social Settings
        private void OnAllowFriendRequestsChanged(bool value)
        {
            currentSettings.allowFriendRequests = value;
            ApplySocialSettings();
        }
        
        private void OnShowOnlineStatusChanged(bool value)
        {
            currentSettings.showOnlineStatus = value;
            ApplySocialSettings();
        }
        
        private void OnAllowChatChanged(bool value)
        {
            currentSettings.allowChat = value;
            ApplySocialSettings();
        }
        
        private void OnAllowGiftsChanged(bool value)
        {
            currentSettings.allowGifts = value;
            ApplySocialSettings();
        }
        
        // Privacy Settings
        private void OnAnalyticsEnabledChanged(bool value)
        {
            currentSettings.analyticsEnabled = value;
            ApplyPrivacySettings();
        }
        
        private void OnCrashReportingChanged(bool value)
        {
            currentSettings.crashReporting = value;
            ApplyPrivacySettings();
        }
        
        private void OnPersonalizedAdsChanged(bool value)
        {
            currentSettings.personalizedAds = value;
            ApplyPrivacySettings();
        }
        
        private void OnDataCollectionChanged(bool value)
        {
            currentSettings.dataCollection = value;
            ApplyPrivacySettings();
        }
        
        // Language Settings
        private void OnLanguageChanged(int value)
        {
            currentSettings.language = availableLanguages[value];
            ApplyLanguageSettings();
        }
        
        private void OnAutoDetectLanguageChanged(bool value)
        {
            currentSettings.autoDetectLanguage = value;
            ApplyLanguageSettings();
        }
        
        // Accessibility Settings
        private void OnColorblindModeChanged(bool value)
        {
            currentSettings.colorblindMode = value;
            ApplyAccessibilitySettings();
        }
        
        private void OnHighContrastChanged(bool value)
        {
            currentSettings.highContrast = value;
            ApplyAccessibilitySettings();
        }
        
        private void OnLargeTextChanged(bool value)
        {
            currentSettings.largeText = value;
            ApplyAccessibilitySettings();
        }
        
        private void OnReducedMotionChanged(bool value)
        {
            currentSettings.reducedMotion = value;
            ApplyAccessibilitySettings();
        }
        
        private void OnScreenReaderChanged(bool value)
        {
            currentSettings.screenReader = value;
            ApplyAccessibilitySettings();
        }
        
        // Apply Settings
        private void ApplySettings()
        {
            ApplyAudioSettings();
            ApplyGraphicsSettings();
            ApplyGameplaySettings();
            ApplySocialSettings();
            ApplyPrivacySettings();
            ApplyLanguageSettings();
            ApplyAccessibilitySettings();
        }
        
        private void ApplyAudioSettings()
        {
            if (Evergreen.Audio.AudioManager.Instance != null)
            {
                if (currentSettings.muteAll)
                {
                    Evergreen.Audio.AudioManager.Instance.SetMasterVolume(0f);
                }
                else
                {
                    Evergreen.Audio.AudioManager.Instance.SetMasterVolume(currentSettings.masterVolume);
                    Evergreen.Audio.AudioManager.Instance.SetMusicVolume(currentSettings.musicVolume);
                    Evergreen.Audio.AudioManager.Instance.SetSFXVolume(currentSettings.sfxVolume);
                    Evergreen.Audio.AudioManager.Instance.SetUIVolume(currentSettings.uiVolume);
                    Evergreen.Audio.AudioManager.Instance.SetAmbientVolume(currentSettings.ambientVolume);
                }
            }
        }
        
        private void ApplyGraphicsSettings()
        {
            // Apply graphics quality
            QualitySettings.SetQualityLevel(currentSettings.graphicsQuality);
            
            // Apply resolution and fullscreen
            if (currentSettings.resolutionIndex < availableResolutions.Length)
            {
                var resolution = availableResolutions[currentSettings.resolutionIndex];
                Screen.SetResolution(resolution.width, resolution.height, currentSettings.fullscreen);
            }
            
            // Apply VSync
            QualitySettings.vSyncCount = currentSettings.vsync ? 1 : 0;
            
            // Apply target FPS
            if (currentSettings.targetFPS > 0)
            {
                Application.targetFrameRate = currentSettings.targetFPS;
            }
            else
            {
                Application.targetFrameRate = -1; // Unlimited
            }
            
            // Apply particle effects
            // This would be applied to particle systems throughout the game
            
            // Apply screen shake
            // This would be applied to camera shake systems
            
            // Apply bloom
            // This would be applied to post-processing effects
            
            // Apply shadows
            // This would be applied to shadow settings
        }
        
        private void ApplyGameplaySettings()
        {
            // Apply auto save
            if (Evergreen.CloudSave.CloudSaveManager.Instance != null)
            {
                Evergreen.CloudSave.CloudSaveManager.Instance.autoSave = currentSettings.autoSave;
            }
            
            // Apply cloud save
            if (Evergreen.CloudSave.CloudSaveManager.Instance != null)
            {
                Evergreen.CloudSave.CloudSaveManager.Instance.enableCloudSave = currentSettings.cloudSave;
            }
            
            // Apply notifications
            // This would be applied to notification systems
            
            // Apply vibration
            // This would be applied to haptic feedback systems
            
            // Apply tutorial settings
            if (Evergreen.Tutorial.TutorialSystem.Instance != null)
            {
                Evergreen.Tutorial.TutorialSystem.Instance.enableTutorials = currentSettings.showTutorials;
            }
        }
        
        private void ApplySocialSettings()
        {
            // Apply social settings
            // This would be applied to social systems
        }
        
        private void ApplyPrivacySettings()
        {
            // Apply analytics settings
            if (Evergreen.Analytics.EnhancedAnalytics.Instance != null)
            {
                Evergreen.Analytics.EnhancedAnalytics.Instance.enableAnalytics = currentSettings.analyticsEnabled;
            }
        }
        
        private void ApplyLanguageSettings()
        {
            // Apply language settings
            // This would be applied to localization systems
        }
        
        private void ApplyAccessibilitySettings()
        {
            // Apply accessibility settings
            // This would be applied to UI and visual systems
        }
        
        // Reset Functions
        private void ResetToDefault()
        {
            currentSettings = new GameSettings();
            UpdateUI();
            ApplySettings();
            SaveSettings();
        }
        
        private void ResetAudio()
        {
            currentSettings.masterVolume = 1f;
            currentSettings.musicVolume = 0.7f;
            currentSettings.sfxVolume = 1f;
            currentSettings.uiVolume = 1f;
            currentSettings.ambientVolume = 0.5f;
            currentSettings.muteAll = false;
            UpdateAudioUI();
            ApplyAudioSettings();
        }
        
        private void ResetGraphics()
        {
            currentSettings.graphicsQuality = 2;
            currentSettings.fullscreen = true;
            currentSettings.resolutionIndex = 0;
            currentSettings.vsync = true;
            currentSettings.targetFPS = 60;
            currentSettings.particleEffects = true;
            currentSettings.screenShake = true;
            currentSettings.bloom = true;
            currentSettings.shadows = true;
            UpdateGraphicsUI();
            ApplyGraphicsSettings();
        }
        
        private void ResetGameplay()
        {
            currentSettings.autoSave = true;
            currentSettings.cloudSave = true;
            currentSettings.notifications = true;
            currentSettings.vibration = true;
            currentSettings.hapticFeedback = true;
            currentSettings.showTutorials = true;
            currentSettings.showHints = true;
            currentSettings.showParticleEffects = true;
            currentSettings.showScreenShake = true;
            UpdateGameplayUI();
            ApplyGameplaySettings();
        }
        
        private void ResetPrivacy()
        {
            currentSettings.analyticsEnabled = true;
            currentSettings.crashReporting = true;
            currentSettings.personalizedAds = true;
            currentSettings.dataCollection = true;
            UpdatePrivacyUI();
            ApplyPrivacySettings();
        }
        
        // UI Update Functions
        private void UpdateUI()
        {
            UpdateAudioUI();
            UpdateGraphicsUI();
            UpdateGameplayUI();
            UpdateSocialUI();
            UpdatePrivacyUI();
            UpdateLanguageUI();
            UpdateAccessibilityUI();
        }
        
        private void UpdateAudioUI()
        {
            if (masterVolumeSlider != null)
                masterVolumeSlider.value = currentSettings.masterVolume;
            if (musicVolumeSlider != null)
                musicVolumeSlider.value = currentSettings.musicVolume;
            if (sfxVolumeSlider != null)
                sfxVolumeSlider.value = currentSettings.sfxVolume;
            if (uiVolumeSlider != null)
                uiVolumeSlider.value = currentSettings.uiVolume;
            if (ambientVolumeSlider != null)
                ambientVolumeSlider.value = currentSettings.ambientVolume;
            if (muteAllToggle != null)
                muteAllToggle.isOn = currentSettings.muteAll;
        }
        
        private void UpdateGraphicsUI()
        {
            if (graphicsQualityDropdown != null)
                graphicsQualityDropdown.value = currentSettings.graphicsQuality;
            if (fullscreenToggle != null)
                fullscreenToggle.isOn = currentSettings.fullscreen;
            if (resolutionDropdown != null)
                resolutionDropdown.value = currentSettings.resolutionIndex;
            if (vsyncToggle != null)
                vsyncToggle.isOn = currentSettings.vsync;
            if (targetFPSDropdown != null)
                targetFPSDropdown.value = currentSettings.targetFPS == -1 ? 3 : (currentSettings.targetFPS / 30) - 1;
            if (particleEffectsToggle != null)
                particleEffectsToggle.isOn = currentSettings.particleEffects;
            if (screenShakeToggle != null)
                screenShakeToggle.isOn = currentSettings.screenShake;
            if (bloomToggle != null)
                bloomToggle.isOn = currentSettings.bloom;
            if (shadowsToggle != null)
                shadowsToggle.isOn = currentSettings.shadows;
        }
        
        private void UpdateGameplayUI()
        {
            if (autoSaveToggle != null)
                autoSaveToggle.isOn = currentSettings.autoSave;
            if (cloudSaveToggle != null)
                cloudSaveToggle.isOn = currentSettings.cloudSave;
            if (notificationsToggle != null)
                notificationsToggle.isOn = currentSettings.notifications;
            if (vibrationToggle != null)
                vibrationToggle.isOn = currentSettings.vibration;
            if (hapticFeedbackToggle != null)
                hapticFeedbackToggle.isOn = currentSettings.hapticFeedback;
            if (showTutorialsToggle != null)
                showTutorialsToggle.isOn = currentSettings.showTutorials;
            if (showHintsToggle != null)
                showHintsToggle.isOn = currentSettings.showHints;
            if (showParticleEffectsToggle != null)
                showParticleEffectsToggle.isOn = currentSettings.showParticleEffects;
            if (showScreenShakeToggle != null)
                showScreenShakeToggle.isOn = currentSettings.showScreenShake;
        }
        
        private void UpdateSocialUI()
        {
            if (allowFriendRequestsToggle != null)
                allowFriendRequestsToggle.isOn = currentSettings.allowFriendRequests;
            if (showOnlineStatusToggle != null)
                showOnlineStatusToggle.isOn = currentSettings.showOnlineStatus;
            if (allowChatToggle != null)
                allowChatToggle.isOn = currentSettings.allowChat;
            if (allowGiftsToggle != null)
                allowGiftsToggle.isOn = currentSettings.allowGifts;
        }
        
        private void UpdatePrivacyUI()
        {
            if (analyticsEnabledToggle != null)
                analyticsEnabledToggle.isOn = currentSettings.analyticsEnabled;
            if (crashReportingToggle != null)
                crashReportingToggle.isOn = currentSettings.crashReporting;
            if (personalizedAdsToggle != null)
                personalizedAdsToggle.isOn = currentSettings.personalizedAds;
            if (dataCollectionToggle != null)
                dataCollectionToggle.isOn = currentSettings.dataCollection;
        }
        
        private void UpdateLanguageUI()
        {
            if (languageDropdown != null)
            {
                int languageIndex = System.Array.IndexOf(availableLanguages, currentSettings.language);
                if (languageIndex >= 0)
                    languageDropdown.value = languageIndex;
            }
            if (autoDetectLanguageToggle != null)
                autoDetectLanguageToggle.isOn = currentSettings.autoDetectLanguage;
        }
        
        private void UpdateAccessibilityUI()
        {
            if (colorblindModeToggle != null)
                colorblindModeToggle.isOn = currentSettings.colorblindMode;
            if (highContrastToggle != null)
                highContrastToggle.isOn = currentSettings.highContrast;
            if (largeTextToggle != null)
                largeTextToggle.isOn = currentSettings.largeText;
            if (reducedMotionToggle != null)
                reducedMotionToggle.isOn = currentSettings.reducedMotion;
            if (screenReaderToggle != null)
                screenReaderToggle.isOn = currentSettings.screenReader;
        }
        
        // Show/Hide Settings
        public void ShowSettings()
        {
            if (settingsPanel != null)
                settingsPanel.SetActive(true);
        }
        
        public void HideSettings()
        {
            if (settingsPanel != null)
                settingsPanel.SetActive(false);
            
            SaveSettings();
        }
        
        // Save/Load Settings
        private void SaveSettings()
        {
            try
            {
                string jsonData = JsonUtility.ToJson(currentSettings, true);
                PlayerPrefs.SetString("GameSettings", jsonData);
                PlayerPrefs.Save();
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to save settings: {e.Message}");
            }
        }
        
        private void LoadSettings()
        {
            try
            {
                string jsonData = PlayerPrefs.GetString("GameSettings", "");
                if (!string.IsNullOrEmpty(jsonData))
                {
                    currentSettings = JsonUtility.FromJson<GameSettings>(jsonData);
                }
                else
                {
                    currentSettings = new GameSettings();
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to load settings: {e.Message}");
                currentSettings = new GameSettings();
            }
        }
        
        // Public Getters
        public GameSettings GetSettings()
        {
            return currentSettings;
        }
        
        public bool GetSettingBool(string settingName)
        {
            var field = typeof(GameSettings).GetField(settingName);
            if (field != null && field.FieldType == typeof(bool))
            {
                return (bool)field.GetValue(currentSettings);
            }
            return false;
        }
        
        public float GetSettingFloat(string settingName)
        {
            var field = typeof(GameSettings).GetField(settingName);
            if (field != null && field.FieldType == typeof(float))
            {
                return (float)field.GetValue(currentSettings);
            }
            return 0f;
        }
        
        public int GetSettingInt(string settingName)
        {
            var field = typeof(GameSettings).GetField(settingName);
            if (field != null && field.FieldType == typeof(int))
            {
                return (int)field.GetValue(currentSettings);
            }
            return 0;
        }
        
        public string GetSettingString(string settingName)
        {
            var field = typeof(GameSettings).GetField(settingName);
            if (field != null && field.FieldType == typeof(string))
            {
                return (string)field.GetValue(currentSettings);
            }
            return "";
        }
    }
}