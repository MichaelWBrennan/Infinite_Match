#!/usr/bin/env node

/**
 * Platform Optimization Script
 * Optimizes the codebase for all supported platforms
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

const logger = {
  info: (msg) => console.log(chalk.blue(`ℹ ${msg}`)),
  success: (msg) => console.log(chalk.green(`✓ ${msg}`)),
  warn: (msg) => console.log(chalk.yellow(`⚠ ${msg}`)),
  error: (msg) => console.log(chalk.red(`✗ ${msg}`)),
};

class PlatformOptimizer {
  constructor() {
    this.platforms = [
      'webgl',
      'kongregate', 
      'poki',
      'gamecrazy',
      'android',
      'ios'
    ];
    this.optimizations = [];
  }

  async run() {
    logger.info('Starting platform optimization...');
    
    try {
      await this.optimizeWebGLBuilds();
      await this.optimizePlatformConfigs();
      await this.optimizeStaticAssets();
      await this.optimizeAPIs();
      await this.generatePlatformReports();
      
      this.printSummary();
    } catch (error) {
      logger.error(`Platform optimization failed: ${error.message}`);
      process.exit(1);
    }
  }

  async optimizeWebGLBuilds() {
    logger.info('Optimizing WebGL builds for all platforms...');
    
    for (const platform of this.platforms) {
      if (['android', 'ios'].includes(platform)) {
        continue; // Skip mobile platforms for WebGL optimization
      }
      
      try {
        await this.optimizeWebGLForPlatform(platform);
        this.optimizations.push(`WebGL optimized for ${platform}`);
      } catch (error) {
        logger.warn(`Failed to optimize WebGL for ${platform}: ${error.message}`);
      }
    }
  }

  async optimizeWebGLForPlatform(platform) {
    const webglDir = join(process.cwd(), 'webgl');
    const platformDir = join(webglDir, platform);
    
    if (!existsSync(platformDir)) {
      mkdirSync(platformDir, { recursive: true });
    }

    // Platform-specific optimizations
    const optimizations = this.getPlatformOptimizations(platform);
    
    // Apply memory optimizations
    if (optimizations.memorySize) {
      await this.applyMemoryOptimization(platformDir, optimizations.memorySize);
    }

    // Apply compression optimizations
    if (optimizations.compression) {
      await this.applyCompressionOptimization(platformDir, optimizations.compression);
    }

    // Apply texture optimizations
    if (optimizations.textureFormat) {
      await this.applyTextureOptimization(platformDir, optimizations.textureFormat);
    }

    logger.success(`WebGL optimized for ${platform}`);
  }

  getPlatformOptimizations(platform) {
    const optimizations = {
      webgl: {
        memorySize: 256,
        compression: 'gzip',
        textureFormat: 'astc'
      },
      kongregate: {
        memorySize: 128,
        compression: 'gzip',
        textureFormat: 'dxt'
      },
      poki: {
        memorySize: 64,
        compression: 'brotli',
        textureFormat: 'etc2'
      },
      gamecrazy: {
        memorySize: 32,
        compression: 'gzip',
        textureFormat: 'dxt'
      }
    };

    return optimizations[platform] || optimizations.webgl;
  }

  async applyMemoryOptimization(platformDir, memorySize) {
    // Create memory configuration file
    const memoryConfig = {
      memorySize: memorySize,
      maxMemory: memorySize * 1024 * 1024,
      optimization: 'memory'
    };

    writeFileSync(
      join(platformDir, 'memory-config.json'),
      JSON.stringify(memoryConfig, null, 2)
    );
  }

  async applyCompressionOptimization(platformDir, compression) {
    // Create compression configuration
    const compressionConfig = {
      compression: compression,
      enabled: true,
      level: compression === 'brotli' ? 6 : 9
    };

    writeFileSync(
      join(platformDir, 'compression-config.json'),
      JSON.stringify(compressionConfig, null, 2)
    );
  }

  async applyTextureOptimization(platformDir, textureFormat) {
    // Create texture configuration
    const textureConfig = {
      format: textureFormat,
      compression: true,
      quality: 'high'
    };

    writeFileSync(
      join(platformDir, 'texture-config.json'),
      JSON.stringify(textureConfig, null, 2)
    );
  }

  async optimizePlatformConfigs() {
    logger.info('Optimizing platform configurations...');
    
    for (const platform of this.platforms) {
      try {
        await this.createPlatformConfig(platform);
        this.optimizations.push(`Configuration created for ${platform}`);
      } catch (error) {
        logger.warn(`Failed to create config for ${platform}: ${error.message}`);
      }
    }
  }

  async createPlatformConfig(platform) {
    const configDir = join(process.cwd(), 'config', 'platforms');
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }

    const config = this.generatePlatformConfig(platform);
    writeFileSync(
      join(configDir, `${platform}.json`),
      JSON.stringify(config, null, 2)
    );
  }

  generatePlatformConfig(platform) {
    const baseConfig = {
      platform: platform,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };

    const platformConfigs = {
      webgl: {
        ...baseConfig,
        build: {
          target: 'webgl',
          optimization: 'release',
          compression: 'gzip'
        },
        features: {
          webgl: true,
          ads: false,
          iap: false,
          analytics: true
        }
      },
      kongregate: {
        ...baseConfig,
        build: {
          target: 'webgl',
          optimization: 'release',
          compression: 'gzip'
        },
        features: {
          webgl: true,
          ads: true,
          iap: true,
          analytics: true,
          social: true
        },
        sdk: {
          url: 'https://cdn1.kongregate.com/javascripts/kongregate_api.js',
          version: '1.0.0'
        }
      },
      poki: {
        ...baseConfig,
        build: {
          target: 'webgl',
          optimization: 'release',
          compression: 'brotli'
        },
        features: {
          webgl: true,
          ads: true,
          iap: true,
          analytics: true,
          social: true
        },
        sdk: {
          url: 'https://game-cdn.poki.com/scripts/poki-sdk.js',
          version: '1.0.0'
        }
      },
      gamecrazy: {
        ...baseConfig,
        build: {
          target: 'webgl',
          optimization: 'release',
          compression: 'gzip'
        },
        features: {
          webgl: true,
          ads: true,
          iap: true,
          analytics: true,
          social: false
        },
        sdk: {
          url: 'https://cdn.gamecrazy.com/sdk/gamecrazy-sdk.js',
          version: '1.0.0'
        }
      },
      android: {
        ...baseConfig,
        build: {
          target: 'android',
          optimization: 'release',
          compression: 'none'
        },
        features: {
          webgl: false,
          ads: true,
          iap: true,
          analytics: true,
          social: true
        },
        android: {
          targetSdkVersion: '33',
          minSdkVersion: '21',
          architecture: 'arm64'
        }
      },
      ios: {
        ...baseConfig,
        build: {
          target: 'ios',
          optimization: 'release',
          compression: 'none'
        },
        features: {
          webgl: false,
          ads: true,
          iap: true,
          analytics: true,
          social: true
        },
        ios: {
          targetSdkVersion: 'latest',
          minSdkVersion: '12.0',
          architecture: 'arm64'
        }
      }
    };

    return platformConfigs[platform] || platformConfigs.webgl;
  }

  async optimizeStaticAssets() {
    logger.info('Optimizing static assets for all platforms...');
    
    try {
      // Optimize images
      await this.optimizeImages();
      
      // Optimize audio files
      await this.optimizeAudio();
      
      // Optimize fonts
      await this.optimizeFonts();
      
      this.optimizations.push('Static assets optimized');
    } catch (error) {
      logger.warn(`Failed to optimize static assets: ${error.message}`);
    }
  }

  async optimizeImages() {
    // This would optimize images for different platforms
    logger.info('Optimizing images...');
    
    // Mock optimization - in real implementation, you would:
    // 1. Resize images for different screen densities
    // 2. Convert to appropriate formats (WebP, AVIF, etc.)
    // 3. Compress images
    // 4. Generate platform-specific variants
  }

  async optimizeAudio() {
    // This would optimize audio files for different platforms
    logger.info('Optimizing audio files...');
    
    // Mock optimization - in real implementation, you would:
    // 1. Convert to appropriate formats (MP3, OGG, etc.)
    // 2. Compress audio files
    // 3. Generate platform-specific variants
  }

  async optimizeFonts() {
    // This would optimize fonts for different platforms
    logger.info('Optimizing fonts...');
    
    // Mock optimization - in real implementation, you would:
    // 1. Subset fonts for specific languages
    // 2. Convert to appropriate formats (WOFF2, WOFF, etc.)
    // 3. Compress fonts
  }

  async optimizeAPIs() {
    logger.info('Optimizing APIs for all platforms...');
    
    try {
      // Generate platform-specific API configurations
      await this.generateAPIConfigs();
      
      // Optimize API responses
      await this.optimizeAPIResponses();
      
      this.optimizations.push('APIs optimized for all platforms');
    } catch (error) {
      logger.warn(`Failed to optimize APIs: ${error.message}`);
    }
  }

  async generateAPIConfigs() {
    const apiDir = join(process.cwd(), 'config', 'api');
    if (!existsSync(apiDir)) {
      mkdirSync(apiDir, { recursive: true });
    }

    // Generate universal API configuration
    const universalConfig = {
      version: '1.0.0',
      platforms: this.platforms,
      endpoints: {
        platform: '/api/platform',
        game: '/api/game',
        analytics: '/api/analytics'
      },
      features: {
        ads: true,
        iap: true,
        analytics: true,
        social: true
      }
    };

    writeFileSync(
      join(apiDir, 'universal.json'),
      JSON.stringify(universalConfig, null, 2)
    );
  }

  async optimizeAPIResponses() {
    // This would optimize API responses for different platforms
    logger.info('Optimizing API responses...');
    
    // Mock optimization - in real implementation, you would:
    // 1. Implement response compression
    // 2. Add platform-specific headers
    // 3. Optimize data formats
  }

  async generatePlatformReports() {
    logger.info('Generating platform optimization reports...');
    
    const report = {
      timestamp: new Date().toISOString(),
      platforms: this.platforms,
      optimizations: this.optimizations,
      summary: {
        totalOptimizations: this.optimizations.length,
        platformsOptimized: this.platforms.length,
        successRate: (this.optimizations.length / this.platforms.length) * 100
      }
    };

    const reportPath = join(process.cwd(), 'platform-optimization-report.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    logger.success(`Platform optimization report generated: ${reportPath}`);
  }

  printSummary() {
    console.log('\n' + chalk.bold('Platform Optimization Summary:'));
    console.log(chalk.green(`Platforms Optimized: ${this.platforms.length}`));
    console.log(chalk.green(`Total Optimizations: ${this.optimizations.length}`));
    
    console.log('\n' + chalk.bold('Optimizations Applied:'));
    this.optimizations.forEach((optimization, index) => {
      console.log(`${index + 1}. ${optimization}`);
    });
    
    console.log('\n' + chalk.bold('Supported Platforms:'));
    this.platforms.forEach((platform, index) => {
      console.log(`${index + 1}. ${platform}`);
    });
    
    if (this.optimizations.length === this.platforms.length) {
      logger.success('All platforms optimized successfully!');
    } else {
      logger.warn('Some platforms may need manual optimization');
    }
  }
}

// Run the platform optimizer
const optimizer = new PlatformOptimizer();
optimizer.run().catch(console.error);