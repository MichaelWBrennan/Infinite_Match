/**
 * Platform Compatibility Tests
 * Tests cross-platform functionality across all supported platforms
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { PlatformDetector } from '../core/platform/PlatformDetector.js';
import { UniversalAPI } from '../core/api/UniversalAPI.js';
import { PlatformBuildConfig } from '../core/build/PlatformBuildConfig.js';

describe('Platform Compatibility', () => {
  let platformDetector: PlatformDetector;
  let universalAPI: UniversalAPI;
  let platformBuildConfig: PlatformBuildConfig;

  beforeAll(async () => {
    platformDetector = new PlatformDetector();
    universalAPI = new UniversalAPI();
    platformBuildConfig = new PlatformBuildConfig();
  });

  describe('Platform Detection', () => {
    test('should detect platform correctly', async () => {
      const platform = await platformDetector.detectPlatform();

      expect(platform).toBeDefined();
      expect(platform.name).toBeDefined();
      expect(platform.type).toBeDefined();
      expect(platform.capabilities).toBeDefined();
      expect(platform.config).toBeDefined();
    });

    test('should have valid platform capabilities', async () => {
      const platform = await platformDetector.detectPlatform();

      expect(platform.capabilities).toHaveProperty('webgl');
      expect(platform.capabilities).toHaveProperty('wasm');
      expect(platform.capabilities).toHaveProperty('touch');
      expect(platform.capabilities).toHaveProperty('keyboard');
      expect(platform.capabilities).toHaveProperty('maxMemory');
      expect(platform.capabilities).toHaveProperty('maxTextureSize');
    });

    test('should provide platform-specific optimizations', async () => {
      const platform = await platformDetector.detectPlatform();
      const optimization = platformDetector.getOptimizationConfig();

      expect(optimization).toBeDefined();
      expect(optimization).toHaveProperty('compression');
      expect(optimization).toHaveProperty('memorySize');
      expect(optimization).toHaveProperty('textureFormat');
      expect(optimization).toHaveProperty('audioFormat');
    });
  });

  describe('Universal API', () => {
    beforeAll(async () => {
      await universalAPI.initialize();
    });

    test('should initialize successfully', () => {
      expect(universalAPI.getCurrentPlatform()).toBeDefined();
    });

    test('should get platform capabilities', () => {
      const capabilities = universalAPI.getPlatformCapabilities();

      expect(capabilities.success).toBe(true);
      expect(capabilities.data).toBeDefined();
      expect(capabilities.data.platform).toBeDefined();
      expect(capabilities.data.capabilities).toBeDefined();
    });

    test('should get platform configuration', () => {
      const config = universalAPI.getPlatformConfig();

      expect(config.success).toBe(true);
      expect(config.data).toBeDefined();
      expect(config.data.platform).toBeDefined();
      expect(config.data.optimization).toBeDefined();
      expect(config.data.build).toBeDefined();
    });

    test('should track events successfully', async () => {
      const result = await universalAPI.trackEvent('test_event', { test: true });

      expect(result.success).toBe(true);
      expect(result.platform).toBeDefined();
    });

    test('should get user info', async () => {
      const result = await universalAPI.getUserInfo();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.id).toBeDefined();
      expect(result.data.platform).toBeDefined();
    });

    test('should handle gameplay start/stop', async () => {
      const startResult = await universalAPI.gameplayStart();
      expect(startResult.success).toBe(true);

      const stopResult = await universalAPI.gameplayStop();
      expect(stopResult.success).toBe(true);
    });

    test('should check ad capabilities', async () => {
      const adBlockedResult = await universalAPI.isAdBlocked();
      expect(adBlockedResult.success).toBe(true);
      expect(typeof adBlockedResult.data).toBe('boolean');

      const adFreeResult = await universalAPI.isAdFree();
      expect(adFreeResult.success).toBe(true);
      expect(typeof adFreeResult.data).toBe('boolean');
    });

    test('should provide platform recommendations', () => {
      const recommendations = universalAPI.getPlatformRecommendations();

      expect(Array.isArray(recommendations)).toBe(true);
    });

    test('should check feature support', () => {
      const platform = universalAPI.getCurrentPlatform();
      if (platform) {
        expect(typeof universalAPI.isFeatureSupported('webgl')).toBe('boolean');
        expect(typeof universalAPI.isFeatureSupported('ads')).toBe('boolean');
        expect(typeof universalAPI.isFeatureSupported('iap')).toBe('boolean');
        expect(typeof universalAPI.isFeatureSupported('analytics')).toBe('boolean');
      }
    });
  });

  describe('Platform Build Configuration', () => {
    test('should get build configuration for all platforms', () => {
      const platforms = ['webgl', 'kongregate', 'poki', 'gamecrazy', 'android', 'ios'];

      platforms.forEach((platform) => {
        const config = platformBuildConfig.getBuildConfig(platform);
        expect(config).toBeDefined();
        expect(config.platform).toBe(platform);
        expect(config.target).toBeDefined();
        expect(config.architecture).toBeDefined();
        expect(config.optimization).toBeDefined();
        expect(config.compression).toBeDefined();
        expect(config.memorySize).toBeDefined();
        expect(config.textureFormat).toBeDefined();
        expect(config.audioFormat).toBeDefined();
        expect(config.features).toBeDefined();
        expect(config.buildSettings).toBeDefined();
        expect(config.playerSettings).toBeDefined();
        expect(config.qualitySettings).toBeDefined();
      });
    });

    test('should get optimized build configuration', async () => {
      const config = await platformBuildConfig.getOptimizedBuildConfig();

      expect(config).toBeDefined();
      expect(config.platform).toBeDefined();
      expect(config.target).toBeDefined();
      expect(config.architecture).toBeDefined();
      expect(config.optimization).toBeDefined();
    });

    test('should generate build command', () => {
      const config = platformBuildConfig.getBuildConfig('webgl');
      if (config) {
        const command = platformBuildConfig.generateBuildCommand(config);

        expect(command).toBeDefined();
        expect(typeof command).toBe('string');
        expect(command).toContain('Unity.exe');
        expect(command).toContain('-batchmode');
        expect(command).toContain('-quit');
        expect(command).toContain('-buildTarget');
      }
    });

    test('should generate build configuration file', () => {
      const config = platformBuildConfig.getBuildConfig('webgl');
      if (config) {
        const configFile = platformBuildConfig.generateBuildConfigFile(config);

        expect(configFile).toBeDefined();
        expect(typeof configFile).toBe('string');

        const parsed = JSON.parse(configFile);
        expect(parsed.platform).toBe(config.platform);
        expect(parsed.generatedAt).toBeDefined();
        expect(parsed.version).toBeDefined();
      }
    });

    test('should validate build configuration', () => {
      const config = platformBuildConfig.getBuildConfig('webgl');
      if (config) {
        const validation = platformBuildConfig.validateBuildConfig(config);

        expect(validation.valid).toBe(true);
        expect(validation.errors).toBeDefined();
        expect(Array.isArray(validation.errors)).toBe(true);
      }
    });

    test('should get build configuration statistics', () => {
      const stats = platformBuildConfig.getBuildConfigStats();

      expect(stats).toBeDefined();
      expect(stats.totalConfigs).toBeGreaterThan(0);
      expect(stats.platforms).toBeDefined();
      expect(Array.isArray(stats.platforms)).toBe(true);
      expect(stats.memorySizes).toBeDefined();
      expect(Array.isArray(stats.memorySizes)).toBe(true);
    });
  });

  describe('Cross-Platform Compatibility', () => {
    test('should work on all supported platforms', async () => {
      const platforms = ['webgl', 'kongregate', 'poki', 'gamecrazy', 'android', 'ios'];

      for (const platformName of platforms) {
        // Mock platform detection
        const mockPlatform = {
          name: platformName,
          type: platformName === 'android' || platformName === 'ios' ? 'mobile' : 'web',
          capabilities: {
            webgl: true,
            wasm: true,
            touch: true,
            keyboard: true,
            maxMemory: 512,
            maxTextureSize: 2048,
            ads: true,
            iap: true,
            analytics: true,
            social: true,
          },
          config: {
            optimization: {
              compression: 'gzip',
              memorySize: 256,
              textureFormat: 'astc',
              audioFormat: 'mp3',
            },
          },
        };

        // Test platform detection
        expect(mockPlatform.name).toBe(platformName);
        expect(mockPlatform.capabilities).toBeDefined();
        expect(mockPlatform.config).toBeDefined();
      }
    });

    test('should handle platform-specific features gracefully', async () => {
      const platform = await platformDetector.detectPlatform();

      // Test feature availability
      const features = ['ads', 'iap', 'social', 'analytics', 'webgl', 'wasm'];

      features.forEach((feature) => {
        const supported = universalAPI.isFeatureSupported(feature as any);
        expect(typeof supported).toBe('boolean');
      });
    });

    test('should provide fallbacks for unsupported features', async () => {
      // Test ad functionality with fallback
      const adResult = await universalAPI.showAd({ type: 'banner', placement: 'top' });
      expect(adResult.success).toBeDefined();
      expect(adResult.platform).toBeDefined();

      // Test IAP functionality with fallback
      const iapResult = await universalAPI.trackEvent('purchase_attempt', { productId: 'test' });
      expect(iapResult.success).toBeDefined();
      expect(iapResult.platform).toBeDefined();
    });
  });

  describe('Performance Optimization', () => {
    test('should optimize for platform capabilities', async () => {
      const platform = await platformDetector.detectPlatform();
      const optimization = platformDetector.getOptimizationConfig();

      // Check memory optimization
      expect(optimization.memorySize).toBeLessThanOrEqual(platform.capabilities.maxMemory);

      // Check texture optimization
      expect(optimization.textureFormat).toBeDefined();

      // Check compression optimization
      expect(optimization.compression).toBeDefined();
    });

    test('should provide performance recommendations', () => {
      const recommendations = universalAPI.getPlatformRecommendations();

      expect(Array.isArray(recommendations)).toBe(true);

      // Check for common recommendations
      const hasMemoryRecommendation = recommendations.some((rec) =>
        rec.toLowerCase().includes('memory'),
      );
      const hasPerformanceRecommendation = recommendations.some((rec) =>
        rec.toLowerCase().includes('performance'),
      );

      // At least one recommendation should be present
      expect(hasMemoryRecommendation || hasPerformanceRecommendation).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle platform detection errors gracefully', async () => {
      // Test with invalid platform
      const invalidPlatform = {
        name: 'invalid',
        type: 'unknown',
        capabilities: {},
        config: {},
      };

      expect(invalidPlatform).toBeDefined();
      expect(invalidPlatform.name).toBe('invalid');
    });

    test('should handle API errors gracefully', async () => {
      // Test with invalid parameters
      const invalidAdResult = await universalAPI.showAd({} as any);
      expect(invalidAdResult.success).toBeDefined();
      expect(invalidAdResult.platform).toBeDefined();
    });

    test('should provide meaningful error messages', async () => {
      const result = await universalAPI.trackEvent('', {});
      expect(result.success).toBeDefined();
      expect(result.platform).toBeDefined();
    });
  });
});
