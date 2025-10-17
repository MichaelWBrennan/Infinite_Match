/**
 * Platform-Specific Build Configuration
 * Optimizes Unity builds for different platforms and distribution channels
 */

import { Logger } from '../logger/index.js';
import { PlatformDetector, PlatformInfo } from '../platform/PlatformDetector.js';
import { AppConfig } from '../config/index.js';

export interface BuildConfiguration {
  platform: string;
  target: string;
  architecture: string;
  optimization: 'debug' | 'release';
  compression: 'gzip' | 'brotli' | 'none';
  memorySize: number;
  textureFormat: 'astc' | 'etc2' | 'dxt' | 'none';
  audioFormat: 'mp3' | 'ogg' | 'wav';
  features: {
    webgl: boolean;
    mobile: boolean;
    desktop: boolean;
    ads: boolean;
    iap: boolean;
    analytics: boolean;
    social: boolean;
  };
  buildSettings: {
    developmentBuild: boolean;
    allowDebugging: boolean;
    scriptDebugging: boolean;
    il2cpp: boolean;
    managedStrippingLevel: 'disabled' | 'minimal' | 'medium' | 'high';
  };
  playerSettings: {
    companyName: string;
    productName: string;
    productVersion: string;
    bundleIdentifier: string;
    targetSdkVersion: string;
    minSdkVersion: string;
  };
  qualitySettings: {
    pixelLightCount: number;
    shadows: 'disable' | 'hardOnly' | 'all';
    shadowResolution: 'low' | 'medium' | 'high' | 'veryHigh';
    shadowDistance: number;
    textureQuality: number;
    anisotropicFiltering: 'disable' | 'enable' | 'forceEnable';
    antiAliasing: number;
    softVegetation: boolean;
    realtimeReflectionProbes: boolean;
  };
}

export class PlatformBuildConfig {
  private logger: Logger;
  private platformDetector: PlatformDetector;
  private buildConfigs: Map<string, BuildConfiguration> = new Map();

  constructor() {
    this.logger = new Logger('PlatformBuildConfig');
    this.platformDetector = new PlatformDetector();
    this.initializeBuildConfigs();
  }

  /**
   * Initialize platform-specific build configurations
   */
  private initializeBuildConfigs(): void {
    // WebGL Configuration
    this.buildConfigs.set('webgl', {
      platform: 'webgl',
      target: 'webgl',
      architecture: 'wasm32',
      optimization: 'release',
      compression: 'gzip',
      memorySize: 256,
      textureFormat: 'astc',
      audioFormat: 'mp3',
      features: {
        webgl: true,
        mobile: false,
        desktop: false,
        ads: false,
        iap: false,
        analytics: true,
        social: false,
      },
      buildSettings: {
        developmentBuild: false,
        allowDebugging: false,
        scriptDebugging: false,
        il2cpp: true,
        managedStrippingLevel: 'high',
      },
      playerSettings: {
        companyName: 'Your Company',
        productName: 'Match 3 Game',
        productVersion: '1.0.0',
        bundleIdentifier: 'com.yourcompany.match3game',
        targetSdkVersion: 'latest',
        minSdkVersion: 'latest',
      },
      qualitySettings: {
        pixelLightCount: 4,
        shadows: 'hardOnly',
        shadowResolution: 'medium',
        shadowDistance: 50,
        textureQuality: 1,
        anisotropicFiltering: 'enable',
        antiAliasing: 2,
        softVegetation: false,
        realtimeReflectionProbes: false,
      },
    });

    // Kongregate Configuration
    this.buildConfigs.set('kongregate', {
      platform: 'kongregate',
      target: 'webgl',
      architecture: 'wasm32',
      optimization: 'release',
      compression: 'gzip',
      memorySize: 128,
      textureFormat: 'dxt',
      audioFormat: 'mp3',
      features: {
        webgl: true,
        mobile: false,
        desktop: false,
        ads: true,
        iap: true,
        analytics: true,
        social: true,
      },
      buildSettings: {
        developmentBuild: false,
        allowDebugging: false,
        scriptDebugging: false,
        il2cpp: true,
        managedStrippingLevel: 'high',
      },
      playerSettings: {
        companyName: 'Your Company',
        productName: 'Match 3 Game - Kongregate',
        productVersion: '1.0.0',
        bundleIdentifier: 'com.yourcompany.match3game.kongregate',
        targetSdkVersion: 'latest',
        minSdkVersion: 'latest',
      },
      qualitySettings: {
        pixelLightCount: 2,
        shadows: 'disable',
        shadowResolution: 'low',
        shadowDistance: 25,
        textureQuality: 0.75,
        anisotropicFiltering: 'disable',
        antiAliasing: 0,
        softVegetation: false,
        realtimeReflectionProbes: false,
      },
    });

    // Poki Configuration
    this.buildConfigs.set('poki', {
      platform: 'poki',
      target: 'webgl',
      architecture: 'wasm32',
      optimization: 'release',
      compression: 'brotli',
      memorySize: 64,
      textureFormat: 'etc2',
      audioFormat: 'ogg',
      features: {
        webgl: true,
        mobile: false,
        desktop: false,
        ads: true,
        iap: true,
        analytics: true,
        social: true,
      },
      buildSettings: {
        developmentBuild: false,
        allowDebugging: false,
        scriptDebugging: false,
        il2cpp: true,
        managedStrippingLevel: 'high',
      },
      playerSettings: {
        companyName: 'Your Company',
        productName: 'Match 3 Game - Poki',
        productVersion: '1.0.0',
        bundleIdentifier: 'com.yourcompany.match3game.poki',
        targetSdkVersion: 'latest',
        minSdkVersion: 'latest',
      },
      qualitySettings: {
        pixelLightCount: 1,
        shadows: 'disable',
        shadowResolution: 'low',
        shadowDistance: 10,
        textureQuality: 0.5,
        anisotropicFiltering: 'disable',
        antiAliasing: 0,
        softVegetation: false,
        realtimeReflectionProbes: false,
      },
    });

    // Game Crazy Configuration
    this.buildConfigs.set('gamecrazy', {
      platform: 'gamecrazy',
      target: 'webgl',
      architecture: 'wasm32',
      optimization: 'release',
      compression: 'gzip',
      memorySize: 32,
      textureFormat: 'dxt',
      audioFormat: 'mp3',
      features: {
        webgl: true,
        mobile: false,
        desktop: false,
        ads: true,
        iap: true,
        analytics: true,
        social: false,
      },
      buildSettings: {
        developmentBuild: false,
        allowDebugging: false,
        scriptDebugging: false,
        il2cpp: true,
        managedStrippingLevel: 'high',
      },
      playerSettings: {
        companyName: 'Your Company',
        productName: 'Match 3 Game - Game Crazy',
        productVersion: '1.0.0',
        bundleIdentifier: 'com.yourcompany.match3game.gamecrazy',
        targetSdkVersion: 'latest',
        minSdkVersion: 'latest',
      },
      qualitySettings: {
        pixelLightCount: 1,
        shadows: 'disable',
        shadowResolution: 'low',
        shadowDistance: 5,
        textureQuality: 0.25,
        anisotropicFiltering: 'disable',
        antiAliasing: 0,
        softVegetation: false,
        realtimeReflectionProbes: false,
      },
    });

    // Android Configuration
    this.buildConfigs.set('android', {
      platform: 'android',
      target: 'android',
      architecture: 'arm64',
      optimization: 'release',
      compression: 'none',
      memorySize: 512,
      textureFormat: 'astc',
      audioFormat: 'mp3',
      features: {
        webgl: false,
        mobile: true,
        desktop: false,
        ads: true,
        iap: true,
        analytics: true,
        social: true,
      },
      buildSettings: {
        developmentBuild: false,
        allowDebugging: false,
        scriptDebugging: false,
        il2cpp: true,
        managedStrippingLevel: 'high',
      },
      playerSettings: {
        companyName: 'Your Company',
        productName: 'Match 3 Game',
        productVersion: '1.0.0',
        bundleIdentifier: 'com.yourcompany.match3game',
        targetSdkVersion: '33',
        minSdkVersion: '21',
      },
      qualitySettings: {
        pixelLightCount: 8,
        shadows: 'all',
        shadowResolution: 'high',
        shadowDistance: 100,
        textureQuality: 1,
        anisotropicFiltering: 'forceEnable',
        antiAliasing: 4,
        softVegetation: true,
        realtimeReflectionProbes: true,
      },
    });

    // iOS Configuration
    this.buildConfigs.set('ios', {
      platform: 'ios',
      target: 'ios',
      architecture: 'arm64',
      optimization: 'release',
      compression: 'none',
      memorySize: 256,
      textureFormat: 'astc',
      audioFormat: 'mp3',
      features: {
        webgl: false,
        mobile: true,
        desktop: false,
        ads: true,
        iap: true,
        analytics: true,
        social: true,
      },
      buildSettings: {
        developmentBuild: false,
        allowDebugging: false,
        scriptDebugging: false,
        il2cpp: true,
        managedStrippingLevel: 'high',
      },
      playerSettings: {
        companyName: 'Your Company',
        productName: 'Match 3 Game',
        productVersion: '1.0.0',
        bundleIdentifier: 'com.yourcompany.match3game',
        targetSdkVersion: 'latest',
        minSdkVersion: '12.0',
      },
      qualitySettings: {
        pixelLightCount: 6,
        shadows: 'all',
        shadowResolution: 'high',
        shadowDistance: 75,
        textureQuality: 1,
        anisotropicFiltering: 'forceEnable',
        antiAliasing: 2,
        softVegetation: true,
        realtimeReflectionProbes: true,
      },
    });
  }

  /**
   * Get build configuration for platform
   */
  getBuildConfig(platformName: string): BuildConfiguration | null {
    return this.buildConfigs.get(platformName) || null;
  }

  /**
   * Get optimized build configuration for detected platform
   */
  async getOptimizedBuildConfig(): Promise<BuildConfiguration> {
    try {
      const platform = await this.platformDetector.detectPlatform();
      const baseConfig = this.buildConfigs.get(platform.name);

      if (!baseConfig) {
        this.logger.warn(
          `No build config found for platform: ${platform.name}, using WebGL default`,
        );
        return this.buildConfigs.get('webgl')!;
      }

      // Optimize configuration based on platform capabilities
      const optimizedConfig = this.optimizeConfigForPlatform(baseConfig, platform);

      this.logger.info(`Generated optimized build config for platform: ${platform.name}`);
      return optimizedConfig;
    } catch (error) {
      this.logger.error('Failed to get optimized build config:', error);
      return this.buildConfigs.get('webgl')!;
    }
  }

  /**
   * Optimize configuration for specific platform capabilities
   */
  private optimizeConfigForPlatform(
    config: BuildConfiguration,
    platform: PlatformInfo,
  ): BuildConfiguration {
    const optimized = { ...config };

    // Memory optimization
    if (platform.capabilities.maxMemory < config.memorySize) {
      optimized.memorySize = Math.min(platform.capabilities.maxMemory, config.memorySize);
      this.logger.info(
        `Reduced memory size to ${optimized.memorySize}MB for platform capabilities`,
      );
    }

    // Texture optimization
    if (platform.capabilities.maxTextureSize < 2048) {
      optimized.textureFormat = 'dxt'; // More compatible format
      this.logger.info('Switched to DXT texture format for better compatibility');
    }

    // Quality optimization for mobile
    if (platform.type === 'mobile') {
      optimized.qualitySettings.pixelLightCount = Math.min(
        4,
        optimized.qualitySettings.pixelLightCount,
      );
      optimized.qualitySettings.shadowResolution = 'medium';
      optimized.qualitySettings.antiAliasing = 0; // Disable AA on mobile for performance
      this.logger.info('Optimized quality settings for mobile platform');
    }

    // WebGL-specific optimizations
    if (platform.type === 'web') {
      optimized.buildSettings.il2cpp = true; // Always use IL2CPP for WebGL
      optimized.buildSettings.managedStrippingLevel = 'high'; // Aggressive stripping for WebGL
      this.logger.info('Applied WebGL-specific optimizations');
    }

    // Platform-specific features
    optimized.features.ads = platform.capabilities.ads;
    optimized.features.iap = platform.capabilities.iap;
    optimized.features.social = platform.capabilities.social;
    optimized.features.analytics = platform.capabilities.analytics;

    return optimized;
  }

  /**
   * Generate Unity build command
   */
  generateBuildCommand(config: BuildConfiguration): string {
    const commands: string[] = [];

    // Basic Unity command
    commands.push('Unity.exe -batchmode -quit');

    // Project path
    commands.push(`-projectPath "${process.cwd()}/unity"`);

    // Build target
    commands.push(`-buildTarget ${config.target}`);

    // Build method
    commands.push('-executeMethod BuildScript.Build');

    // Build settings
    if (config.buildSettings.developmentBuild) {
      commands.push('-developmentBuild');
    }

    if (config.buildSettings.allowDebugging) {
      commands.push('-allowDebugging');
    }

    if (config.buildSettings.scriptDebugging) {
      commands.push('-scriptDebugging');
    }

    // IL2CPP
    if (config.buildSettings.il2cpp) {
      commands.push('-il2cpp');
    }

    // Managed stripping level
    commands.push(`-managedStrippingLevel ${config.buildSettings.managedStrippingLevel}`);

    // Platform-specific settings
    if (config.platform === 'android') {
      commands.push('-androidSdkPath "$ANDROID_SDK_ROOT"');
      commands.push('-androidTargetSdkVersion ' + config.playerSettings.targetSdkVersion);
    }

    if (config.platform === 'ios') {
      commands.push('-iosTargetSdkVersion ' + config.playerSettings.targetSdkVersion);
    }

    // Output path
    const outputPath = `"${process.cwd()}/Builds/${config.platform}"`;
    commands.push(`-buildPath ${outputPath}`);

    return commands.join(' ');
  }

  /**
   * Generate build configuration file
   */
  generateBuildConfigFile(config: BuildConfiguration): string {
    return JSON.stringify(
      {
        platform: config.platform,
        target: config.target,
        architecture: config.architecture,
        optimization: config.optimization,
        compression: config.compression,
        memorySize: config.memorySize,
        textureFormat: config.textureFormat,
        audioFormat: config.audioFormat,
        features: config.features,
        buildSettings: config.buildSettings,
        playerSettings: config.playerSettings,
        qualitySettings: config.qualitySettings,
        generatedAt: new Date().toISOString(),
        version: '1.0.0',
      },
      null,
      2,
    );
  }

  /**
   * Validate build configuration
   */
  validateBuildConfig(config: BuildConfiguration): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate required fields
    if (!config.platform) {
      errors.push('Platform is required');
    }

    if (!config.target) {
      errors.push('Target is required');
    }

    if (!config.architecture) {
      errors.push('Architecture is required');
    }

    // Validate memory size
    if (config.memorySize < 32 || config.memorySize > 2048) {
      errors.push('Memory size must be between 32MB and 2048MB');
    }

    // Validate texture format
    const validTextureFormats = ['astc', 'etc2', 'dxt', 'none'];
    if (!validTextureFormats.includes(config.textureFormat)) {
      errors.push(`Invalid texture format: ${config.textureFormat}`);
    }

    // Validate audio format
    const validAudioFormats = ['mp3', 'ogg', 'wav'];
    if (!validAudioFormats.includes(config.audioFormat)) {
      errors.push(`Invalid audio format: ${config.audioFormat}`);
    }

    // Validate compression
    const validCompressions = ['gzip', 'brotli', 'none'];
    if (!validCompressions.includes(config.compression)) {
      errors.push(`Invalid compression: ${config.compression}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get all available build configurations
   */
  getAllBuildConfigs(): Map<string, BuildConfiguration> {
    return new Map(this.buildConfigs);
  }

  /**
   * Get build configuration statistics
   */
  getBuildConfigStats(): any {
    const stats = {
      totalConfigs: this.buildConfigs.size,
      platforms: Array.from(this.buildConfigs.keys()),
      memorySizes: Array.from(this.buildConfigs.values()).map((c) => c.memorySize),
      textureFormats: Array.from(this.buildConfigs.values()).map((c) => c.textureFormat),
      audioFormats: Array.from(this.buildConfigs.values()).map((c) => c.audioFormat),
      compressions: Array.from(this.buildConfigs.values()).map((c) => c.compression),
    };

    return stats;
  }
}

export default PlatformBuildConfig;
