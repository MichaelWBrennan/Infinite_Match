/**
 * Local Settings Manager - Handles game settings and preferences
 */

class LocalSettingsManager {
  constructor() {
    this.settings = {
      audio: {
        masterVolume: 1.0,
        musicVolume: 0.8,
        soundVolume: 0.8,
        musicEnabled: true,
        soundEnabled: true,
        voiceEnabled: true
      },
      graphics: {
        quality: 'high', // low, medium, high, ultra
        particles: true,
        shadows: true,
        bloom: true,
        antiAliasing: true,
        vsync: true,
        fullscreen: false,
        resolution: 'auto' // auto, 720p, 1080p, 1440p, 4k
      },
      gameplay: {
        hints: true,
        animations: true,
        haptics: true,
        autoSave: true,
        confirmQuit: true,
        showFPS: false,
        showDebugInfo: false,
        difficulty: 'normal' // easy, normal, hard, expert
      },
      controls: {
        touchSensitivity: 1.0,
        swipeThreshold: 50,
        doubleTapDelay: 300,
        holdDelay: 500,
        vibration: true
      },
      accessibility: {
        colorBlindMode: false,
        highContrast: false,
        largeText: false,
        screenReader: false,
        reducedMotion: false,
        subtitles: false
      },
      privacy: {
        analytics: true,
        crashReporting: true,
        personalizedAds: true,
        dataCollection: true
      },
      language: {
        locale: 'en-US',
        region: 'US',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h' // 12h, 24h
      }
    };
  }

  async initialize() {
    console.log('⚙️ Initializing Settings Manager...');
    
    this.loadData();
    this.applySettings();
    
    console.log('✅ Settings Manager initialized');
  }

  getSettings() {
    return { ...this.settings };
  }

  getSetting(category, key) {
    return this.settings[category]?.[key];
  }

  setSetting(category, key, value) {
    if (this.settings[category] && this.settings[category].hasOwnProperty(key)) {
      this.settings[category][key] = value;
      this.saveData();
      this.applySettings();
      return true;
    }
    return false;
  }

  getAudioSettings() {
    return { ...this.settings.audio };
  }

  updateAudioSettings(audioSettings) {
    this.settings.audio = { ...this.settings.audio, ...audioSettings };
    this.saveData();
    this.applyAudioSettings();
    return true;
  }

  getGraphicsSettings() {
    return { ...this.settings.graphics };
  }

  updateGraphicsSettings(graphicsSettings) {
    this.settings.graphics = { ...this.settings.graphics, ...graphicsSettings };
    this.saveData();
    this.applyGraphicsSettings();
    return true;
  }

  getGameplaySettings() {
    return { ...this.settings.gameplay };
  }

  updateGameplaySettings(gameplaySettings) {
    this.settings.gameplay = { ...this.settings.gameplay, ...gameplaySettings };
    this.saveData();
    this.applyGameplaySettings();
    return true;
  }

  getControlSettings() {
    return { ...this.settings.controls };
  }

  updateControlSettings(controlSettings) {
    this.settings.controls = { ...this.settings.controls, ...controlSettings };
    this.saveData();
    this.applyControlSettings();
    return true;
  }

  getAccessibilitySettings() {
    return { ...this.settings.accessibility };
  }

  updateAccessibilitySettings(accessibilitySettings) {
    this.settings.accessibility = { ...this.settings.accessibility, ...accessibilitySettings };
    this.saveData();
    this.applyAccessibilitySettings();
    return true;
  }

  getPrivacySettings() {
    return { ...this.settings.privacy };
  }

  updatePrivacySettings(privacySettings) {
    this.settings.privacy = { ...this.settings.privacy, ...privacySettings };
    this.saveData();
    this.applyPrivacySettings();
    return true;
  }

  getLanguageSettings() {
    return { ...this.settings.language };
  }

  updateLanguageSettings(languageSettings) {
    this.settings.language = { ...this.settings.language, ...languageSettings };
    this.saveData();
    this.applyLanguageSettings();
    return true;
  }

  resetSettings() {
    this.settings = {
      audio: {
        masterVolume: 1.0,
        musicVolume: 0.8,
        soundVolume: 0.8,
        musicEnabled: true,
        soundEnabled: true,
        voiceEnabled: true
      },
      graphics: {
        quality: 'high',
        particles: true,
        shadows: true,
        bloom: true,
        antiAliasing: true,
        vsync: true,
        fullscreen: false,
        resolution: 'auto'
      },
      gameplay: {
        hints: true,
        animations: true,
        haptics: true,
        autoSave: true,
        confirmQuit: true,
        showFPS: false,
        showDebugInfo: false,
        difficulty: 'normal'
      },
      controls: {
        touchSensitivity: 1.0,
        swipeThreshold: 50,
        doubleTapDelay: 300,
        holdDelay: 500,
        vibration: true
      },
      accessibility: {
        colorBlindMode: false,
        highContrast: false,
        largeText: false,
        screenReader: false,
        reducedMotion: false,
        subtitles: false
      },
      privacy: {
        analytics: true,
        crashReporting: true,
        personalizedAds: true,
        dataCollection: true
      },
      language: {
        locale: 'en-US',
        region: 'US',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h'
      }
    };
    
    this.saveData();
    this.applySettings();
    return true;
  }

  resetCategory(category) {
    const defaultSettings = {
      audio: {
        masterVolume: 1.0,
        musicVolume: 0.8,
        soundVolume: 0.8,
        musicEnabled: true,
        soundEnabled: true,
        voiceEnabled: true
      },
      graphics: {
        quality: 'high',
        particles: true,
        shadows: true,
        bloom: true,
        antiAliasing: true,
        vsync: true,
        fullscreen: false,
        resolution: 'auto'
      },
      gameplay: {
        hints: true,
        animations: true,
        haptics: true,
        autoSave: true,
        confirmQuit: true,
        showFPS: false,
        showDebugInfo: false,
        difficulty: 'normal'
      },
      controls: {
        touchSensitivity: 1.0,
        swipeThreshold: 50,
        doubleTapDelay: 300,
        holdDelay: 500,
        vibration: true
      },
      accessibility: {
        colorBlindMode: false,
        highContrast: false,
        largeText: false,
        screenReader: false,
        reducedMotion: false,
        subtitles: false
      },
      privacy: {
        analytics: true,
        crashReporting: true,
        personalizedAds: true,
        dataCollection: true
      },
      language: {
        locale: 'en-US',
        region: 'US',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h'
      }
    };

    if (defaultSettings[category]) {
      this.settings[category] = { ...defaultSettings[category] };
      this.saveData();
      this.applySettings();
      return true;
    }
    return false;
  }

  applySettings() {
    this.applyAudioSettings();
    this.applyGraphicsSettings();
    this.applyGameplaySettings();
    this.applyControlSettings();
    this.applyAccessibilitySettings();
    this.applyPrivacySettings();
    this.applyLanguageSettings();
  }

  applyAudioSettings() {
    const audio = this.settings.audio;
    
    // Apply master volume
    if (typeof window !== 'undefined' && window.gameAPI) {
      window.gameAPI.setMasterVolume(audio.masterVolume);
    }
    
    // Apply music volume
    if (typeof window !== 'undefined' && window.gameAPI) {
      window.gameAPI.setMusicVolume(audio.musicVolume);
      window.gameAPI.setMusicEnabled(audio.musicEnabled);
    }
    
    // Apply sound volume
    if (typeof window !== 'undefined' && window.gameAPI) {
      window.gameAPI.setSoundVolume(audio.soundVolume);
      window.gameAPI.setSoundEnabled(audio.soundEnabled);
    }
  }

  applyGraphicsSettings() {
    const graphics = this.settings.graphics;
    
    // Apply graphics quality
    if (typeof window !== 'undefined' && window.gameAPI) {
      window.gameAPI.setGraphicsQuality(graphics.quality);
      window.gameAPI.setParticlesEnabled(graphics.particles);
      window.gameAPI.setShadowsEnabled(graphics.shadows);
      window.gameAPI.setBloomEnabled(graphics.bloom);
      window.gameAPI.setAntiAliasingEnabled(graphics.antiAliasing);
      window.gameAPI.setVSyncEnabled(graphics.vsync);
      window.gameAPI.setFullscreen(graphics.fullscreen);
    }
  }

  applyGameplaySettings() {
    const gameplay = this.settings.gameplay;
    
    // Apply gameplay settings
    if (typeof window !== 'undefined' && window.gameAPI) {
      window.gameAPI.setHintsEnabled(gameplay.hints);
      window.gameAPI.setAnimationsEnabled(gameplay.animations);
      window.gameAPI.setHapticsEnabled(gameplay.haptics);
      window.gameAPI.setAutoSaveEnabled(gameplay.autoSave);
      window.gameAPI.setShowFPS(gameplay.showFPS);
      window.gameAPI.setShowDebugInfo(gameplay.showDebugInfo);
      window.gameAPI.setDifficulty(gameplay.difficulty);
    }
  }

  applyControlSettings() {
    const controls = this.settings.controls;
    
    // Apply control settings
    if (typeof window !== 'undefined' && window.gameAPI) {
      window.gameAPI.setTouchSensitivity(controls.touchSensitivity);
      window.gameAPI.setSwipeThreshold(controls.swipeThreshold);
      window.gameAPI.setDoubleTapDelay(controls.doubleTapDelay);
      window.gameAPI.setHoldDelay(controls.holdDelay);
      window.gameAPI.setVibrationEnabled(controls.vibration);
    }
  }

  applyAccessibilitySettings() {
    const accessibility = this.settings.accessibility;
    
    // Apply accessibility settings
    if (typeof window !== 'undefined' && window.gameAPI) {
      window.gameAPI.setColorBlindMode(accessibility.colorBlindMode);
      window.gameAPI.setHighContrast(accessibility.highContrast);
      window.gameAPI.setLargeText(accessibility.largeText);
      window.gameAPI.setScreenReader(accessibility.screenReader);
      window.gameAPI.setReducedMotion(accessibility.reducedMotion);
      window.gameAPI.setSubtitles(accessibility.subtitles);
    }
  }

  applyPrivacySettings() {
    const privacy = this.settings.privacy;
    
    // Apply privacy settings
    if (typeof window !== 'undefined' && window.gameAPI) {
      window.gameAPI.setAnalyticsEnabled(privacy.analytics);
      window.gameAPI.setCrashReportingEnabled(privacy.crashReporting);
      window.gameAPI.setPersonalizedAdsEnabled(privacy.personalizedAds);
      window.gameAPI.setDataCollectionEnabled(privacy.dataCollection);
    }
  }

  applyLanguageSettings() {
    const language = this.settings.language;
    
    // Apply language settings
    if (typeof window !== 'undefined' && window.gameAPI) {
      window.gameAPI.setLocale(language.locale);
      window.gameAPI.setRegion(language.region);
      window.gameAPI.setCurrency(language.currency);
      window.gameAPI.setDateFormat(language.dateFormat);
      window.gameAPI.setTimeFormat(language.timeFormat);
    }
  }

  getRecommendedSettings() {
    // Detect device capabilities and recommend settings
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isLowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
    
    return {
      audio: {
        masterVolume: 1.0,
        musicVolume: 0.7,
        soundVolume: 0.8,
        musicEnabled: true,
        soundEnabled: true,
        voiceEnabled: true
      },
      graphics: {
        quality: isLowEnd ? 'medium' : 'high',
        particles: !isLowEnd,
        shadows: !isLowEnd,
        bloom: !isLowEnd,
        antiAliasing: !isLowEnd,
        vsync: true,
        fullscreen: !isMobile,
        resolution: 'auto'
      },
      gameplay: {
        hints: true,
        animations: true,
        haptics: isMobile,
        autoSave: true,
        confirmQuit: true,
        showFPS: false,
        showDebugInfo: false,
        difficulty: 'normal'
      },
      controls: {
        touchSensitivity: isMobile ? 1.2 : 1.0,
        swipeThreshold: 50,
        doubleTapDelay: 300,
        holdDelay: 500,
        vibration: isMobile
      }
    };
  }

  applyRecommendedSettings() {
    const recommended = this.getRecommendedSettings();
    
    this.settings.audio = { ...this.settings.audio, ...recommended.audio };
    this.settings.graphics = { ...this.settings.graphics, ...recommended.graphics };
    this.settings.gameplay = { ...this.settings.gameplay, ...recommended.gameplay };
    this.settings.controls = { ...this.settings.controls, ...recommended.controls };
    
    this.saveData();
    this.applySettings();
    return true;
  }

  loadData() {
    try {
      const data = JSON.parse(localStorage.getItem('game_settings') || '{}');
      this.settings = { ...this.settings, ...data };
    } catch (error) {
      console.error('Failed to load settings data:', error);
    }
  }

  saveData() {
    localStorage.setItem('game_settings', JSON.stringify(this.settings));
  }

  export() {
    return { ...this.settings };
  }

  import(data) {
    this.settings = { ...this.settings, ...data };
    this.saveData();
    this.applySettings();
  }
}

// Make it globally available
window.LocalSettingsManager = LocalSettingsManager;