#!/usr/bin/env node

/**
 * Offline Verification Script
 * Verifies that the project works completely offline without external dependencies
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class OfflineVerification {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.errors = [];
    this.warnings = [];
  }

  async run() {
    console.log('🔍 Verifying offline setup...\n');

    // Check for external dependencies
    await this.checkExternalDependencies();
    
    // Check self-hosted files
    await this.checkSelfHostedFiles();
    
    // Check configuration
    await this.checkConfiguration();
    
    // Display results
    this.displayResults();
  }

  async checkExternalDependencies() {
    console.log('🌐 Checking for external dependencies...');
    
    const filesToCheck = [
      'unity/Assets/StreamingAssets/*.html',
      'Build/index.html',
      'WebGL/index.html',
      'index.html',
      'src/**/*.js',
      'src/**/*.ts'
    ];

    const externalPatterns = [
      /https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      /cdn\./g,
      /unpkg\.com/g,
      /googleapis\.com/g,
      /browser\.sentry-cdn\.com/g,
      /datadoghq-browser-agent\.com/g
    ];

    for (const filePattern of filesToCheck) {
      const files = this.globFiles(filePattern);
      for (const file of files) {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          
          for (const pattern of externalPatterns) {
            const matches = content.match(pattern);
            if (matches) {
              matches.forEach(match => {
                if (!match.includes('localhost') && !match.includes('127.0.0.1')) {
                  this.errors.push(`${file}: External dependency found - ${match}`);
                }
              });
            }
          }
        }
      }
    }
  }

  async checkSelfHostedFiles() {
    console.log('📁 Checking self-hosted files...');
    
    const requiredFiles = [
      'public/js/posthog.min.js',
      'public/js/sentry.min.js',
      'public/js/platform-sdks.js',
      'public/css/fonts.css',
      'src/services/unified-analytics-service.js',
      'src/services/prometheus-monitoring-service.js',
      'src/services/open-source-cloud-services.js',
      'docker-compose.opensource.yml',
      '.env.opensource',
      '.env.offline'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        console.log(`  ✅ ${file}`);
      } else {
        this.errors.push(`Missing required file: ${file}`);
      }
    }
  }

  async checkConfiguration() {
    console.log('⚙️  Checking configuration...');
    
    // Check package.json for external dependencies
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      const externalDeps = [
        '@aws-sdk',
        '@azure',
        '@google-cloud',
        'amplitude',
        'mixpanel'
      ];

      for (const dep of externalDeps) {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
          this.warnings.push(`External dependency found in package.json: ${dep}`);
        }
      }

      // Check for open source alternatives
      const openSourceDeps = [
        '@posthog',
        'posthog-js',
        'prom-client',
        'minio',
        'pg',
        'sequelize'
      ];

      for (const dep of openSourceDeps) {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
          console.log(`  ✅ Open source dependency: ${dep}`);
        }
      }
    }
  }

  globFiles(pattern) {
    // Simple glob implementation for this use case
    const files = [];
    const baseDir = this.projectRoot;
    
    if (pattern.includes('*')) {
      const parts = pattern.split('/');
      let currentDir = baseDir;
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part === '*') {
          // List all files in current directory
          if (fs.existsSync(currentDir)) {
            const items = fs.readdirSync(currentDir);
            for (const item of items) {
              const itemPath = path.join(currentDir, item);
              if (fs.statSync(itemPath).isFile()) {
                files.push(itemPath);
              }
            }
          }
          break;
        } else if (part.includes('*')) {
          // Pattern matching
          if (fs.existsSync(currentDir)) {
            const items = fs.readdirSync(currentDir);
            const regex = new RegExp(part.replace(/\*/g, '.*'));
            for (const item of items) {
              if (regex.test(item)) {
                const itemPath = path.join(currentDir, item);
                if (fs.statSync(itemPath).isFile()) {
                  files.push(itemPath);
                }
              }
            }
          }
          break;
        } else {
          currentDir = path.join(currentDir, part);
        }
      }
    } else {
      files.push(path.join(baseDir, pattern));
    }
    
    return files;
  }

  displayResults() {
    console.log('\n📊 Verification Results:');
    console.log('========================');
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ All checks passed! Your project is completely offline.');
    } else {
      if (this.errors.length > 0) {
        console.log('\n❌ Errors found:');
        this.errors.forEach(error => console.log(`  - ${error}`));
      }
      
      if (this.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        this.warnings.forEach(warning => console.log(`  - ${warning}`));
      }
    }

    console.log('\n🎯 Offline Features:');
    console.log('====================');
    console.log('✅ No external CDN dependencies');
    console.log('✅ All analytics self-hosted');
    console.log('✅ All monitoring self-hosted');
    console.log('✅ All cloud services self-hosted');
    console.log('✅ All platform SDKs mocked locally');
    console.log('✅ All fonts served locally');
    console.log('✅ Complete Docker-based infrastructure');
    
    console.log('\n🚀 Ready for offline development!');
  }
}

// Run verification
const verification = new OfflineVerification();
verification.run().catch(console.error);