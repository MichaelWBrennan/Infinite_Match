#!/usr/bin/env node

/**
 * Advanced Error Recovery and Rollback System
 * Provides intelligent error recovery and automatic rollback capabilities
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ErrorRecoverySystem {
  constructor() {
    this.backupDir = path.join(__dirname, '..', 'backups');
    this.logFile = path.join(__dirname, '..', 'error-recovery.log');
    this.maxBackups = 10;
    this.recoveryStrategies = {
      deployment_failure: this.handleDeploymentFailure.bind(this),
      database_error: this.handleDatabaseError.bind(this),
      service_unavailable: this.handleServiceUnavailable.bind(this),
      build_failure: this.handleBuildFailure.bind(this),
      test_failure: this.handleTestFailure.bind(this),
      network_error: this.handleNetworkError.bind(this),
    };
  }

  async initialize() {
    // Create backup directory
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    console.log('🛡️ Error Recovery System initialized');
  }

  async createBackup(type = 'automatic') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `${type}_${timestamp}`;
    const backupPath = path.join(this.backupDir, backupName);

    try {
      fs.mkdirSync(backupPath, { recursive: true });

      // Backup critical files
      const criticalFiles = [
        'package.json',
        'package-lock.json',
        'economy/catalog.csv',
        'economy/currencies.csv',
        'economy/inventory.csv',
        'config/remote/game_config.json',
        'cloud-code/AddCurrency.js',
        'cloud-code/SpendCurrency.js',
        'cloud-code/AddInventoryItem.js',
        'cloud-code/UseInventoryItem.js',
      ];

      for (const file of criticalFiles) {
        const sourcePath = path.join(__dirname, '..', file);
        if (fs.existsSync(sourcePath)) {
          const destPath = path.join(backupPath, file);
          const destDir = path.dirname(destPath);

          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }

          fs.copyFileSync(sourcePath, destPath);
        }
      }

      // Create backup manifest
      const manifest = {
        timestamp: new Date().toISOString(),
        type: type,
        files: criticalFiles.filter((f) =>
          fs.existsSync(path.join(__dirname, '..', f))
        ),
        version: this.getCurrentVersion(),
      };

      fs.writeFileSync(
        path.join(backupPath, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
      );

      console.log(`✅ Backup created: ${backupName}`);
      return backupPath;
    } catch (error) {
      console.error(`❌ Backup creation failed: ${error.message}`);
      throw error;
    }
  }

  async handleError(error, context = {}) {
    const errorType = this.classifyError(error);
    const recoveryStrategy = this.recoveryStrategies[errorType];

    console.log(`🚨 Error detected: ${errorType}`);
    console.log(`📝 Error details: ${error.message}`);

    // Log error
    await this.logError(error, context);

    if (recoveryStrategy) {
      console.log(`🔧 Attempting recovery with strategy: ${errorType}`);
      const success = await recoveryStrategy(error, context);

      if (success) {
        console.log(`✅ Recovery successful for ${errorType}`);
        return true;
      } else {
        console.log(`❌ Recovery failed for ${errorType}`);
        return false;
      }
    } else {
      console.log(`⚠️ No recovery strategy for ${errorType}`);
      return false;
    }
  }

  classifyError(error) {
    const message = error.message.toLowerCase();

    if (message.includes('deployment') || message.includes('deploy')) {
      return 'deployment_failure';
    } else if (message.includes('database') || message.includes('connection')) {
      return 'database_error';
    } else if (message.includes('service') || message.includes('unavailable')) {
      return 'service_unavailable';
    } else if (message.includes('build') || message.includes('compile')) {
      return 'build_failure';
    } else if (message.includes('test') || message.includes('spec')) {
      return 'test_failure';
    } else if (message.includes('network') || message.includes('timeout')) {
      return 'network_error';
    } else {
      return 'unknown_error';
    }
  }

  async handleDeploymentFailure(error, context) {
    try {
      console.log('🔄 Handling deployment failure...');

      // 1. Check if we have a recent backup
      const latestBackup = await this.findLatestBackup();
      if (latestBackup) {
        console.log('📦 Found backup, attempting rollback...');
        await this.rollbackToBackup(latestBackup);
      }

      // 2. Verify system health
      await this.verifySystemHealth();

      // 3. Retry deployment with exponential backoff
      await this.retryWithBackoff(() => this.retryDeployment(), 3);

      return true;
    } catch (recoveryError) {
      console.error(`❌ Deployment recovery failed: ${recoveryError.message}`);
      return false;
    }
  }

  async handleDatabaseError(error, context) {
    try {
      console.log('🔄 Handling database error...');

      // 1. Check database connectivity
      await this.checkDatabaseConnectivity();

      // 2. Attempt to reconnect
      await this.reconnectDatabase();

      // 3. Verify data integrity
      await this.verifyDataIntegrity();

      return true;
    } catch (recoveryError) {
      console.error(`❌ Database recovery failed: ${recoveryError.message}`);
      return false;
    }
  }

  async handleServiceUnavailable(error, context) {
    try {
      console.log('🔄 Handling service unavailable...');

      // 1. Check service health
      await this.checkServiceHealth();

      // 2. Attempt service restart
      await this.restartServices();

      // 3. Verify service availability
      await this.verifyServiceAvailability();

      return true;
    } catch (recoveryError) {
      console.error(`❌ Service recovery failed: ${recoveryError.message}`);
      return false;
    }
  }

  async handleBuildFailure(error, context) {
    try {
      console.log('🔄 Handling build failure...');

      // 1. Clean build artifacts
      await this.cleanBuildArtifacts();

      // 2. Clear caches
      await this.clearCaches();

      // 3. Retry build
      await this.retryBuild();

      return true;
    } catch (recoveryError) {
      console.error(`❌ Build recovery failed: ${recoveryError.message}`);
      return false;
    }
  }

  async handleTestFailure(error, context) {
    try {
      console.log('🔄 Handling test failure...');

      // 1. Check test environment
      await this.checkTestEnvironment();

      // 2. Fix test data
      await this.fixTestData();

      // 3. Retry tests
      await this.retryTests();

      return true;
    } catch (recoveryError) {
      console.error(`❌ Test recovery failed: ${recoveryError.message}`);
      return false;
    }
  }

  async handleNetworkError(error, context) {
    try {
      console.log('🔄 Handling network error...');

      // 1. Check network connectivity
      await this.checkNetworkConnectivity();

      // 2. Retry with exponential backoff
      await this.retryWithBackoff(() => this.retryNetworkOperation(), 5);

      return true;
    } catch (recoveryError) {
      console.error(`❌ Network recovery failed: ${recoveryError.message}`);
      return false;
    }
  }

  async rollbackToBackup(backupPath) {
    try {
      console.log(`🔄 Rolling back to backup: ${backupPath}`);

      const manifestPath = path.join(backupPath, 'manifest.json');
      if (!fs.existsSync(manifestPath)) {
        throw new Error('Backup manifest not found');
      }

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

      for (const file of manifest.files) {
        const sourcePath = path.join(backupPath, file);
        const destPath = path.join(__dirname, '..', file);

        if (fs.existsSync(sourcePath)) {
          const destDir = path.dirname(destPath);
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }

          fs.copyFileSync(sourcePath, destPath);
          console.log(`  ✅ Restored: ${file}`);
        }
      }

      console.log('✅ Rollback completed successfully');
      return true;
    } catch (error) {
      console.error(`❌ Rollback failed: ${error.message}`);
      return false;
    }
  }

  async findLatestBackup() {
    try {
      const backups = fs
        .readdirSync(this.backupDir)
        .filter((name) =>
          fs.statSync(path.join(this.backupDir, name)).isDirectory()
        )
        .sort()
        .reverse();

      if (backups.length > 0) {
        return path.join(this.backupDir, backups[0]);
      }

      return null;
    } catch (error) {
      console.error(`❌ Failed to find latest backup: ${error.message}`);
      return null;
    }
  }

  async retryWithBackoff(operation, maxRetries) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${maxRetries}...`);
        await operation();
        console.log(`✅ Operation succeeded on attempt ${attempt}`);
        return true;
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  async logError(error, context) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        type: this.classifyError(error),
      },
      context: context,
      recovery: {
        attempted: true,
        strategies: Object.keys(this.recoveryStrategies),
      },
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(this.logFile, logLine);
  }

  getCurrentVersion() {
    try {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8')
      );
      return packageJson.version;
    } catch (error) {
      return 'unknown';
    }
  }

  // Placeholder methods for actual implementation
  async verifySystemHealth() {
    console.log('🔍 Verifying system health...');
    // Implementation would check various system health indicators
  }

  async retryDeployment() {
    console.log('🚀 Retrying deployment...');
    // Implementation would retry the deployment process
  }

  async checkDatabaseConnectivity() {
    console.log('🔍 Checking database connectivity...');
    // Implementation would check database connection
  }

  async reconnectDatabase() {
    console.log('🔄 Reconnecting to database...');
    // Implementation would reconnect to database
  }

  async verifyDataIntegrity() {
    console.log('🔍 Verifying data integrity...');
    // Implementation would verify data integrity
  }

  async checkServiceHealth() {
    console.log('🔍 Checking service health...');
    // Implementation would check service health
  }

  async restartServices() {
    console.log('🔄 Restarting services...');
    // Implementation would restart services
  }

  async verifyServiceAvailability() {
    console.log('🔍 Verifying service availability...');
    // Implementation would verify service availability
  }

  async cleanBuildArtifacts() {
    console.log('🧹 Cleaning build artifacts...');
    // Implementation would clean build artifacts
  }

  async clearCaches() {
    console.log('🧹 Clearing caches...');
    // Implementation would clear caches
  }

  async retryBuild() {
    console.log('🔨 Retrying build...');
    // Implementation would retry build
  }

  async checkTestEnvironment() {
    console.log('🔍 Checking test environment...');
    // Implementation would check test environment
  }

  async fixTestData() {
    console.log('🔧 Fixing test data...');
    // Implementation would fix test data
  }

  async retryTests() {
    console.log('🧪 Retrying tests...');
    // Implementation would retry tests
  }

  async checkNetworkConnectivity() {
    console.log('🔍 Checking network connectivity...');
    // Implementation would check network connectivity
  }

  async retryNetworkOperation() {
    console.log('🌐 Retrying network operation...');
    // Implementation would retry network operation
  }
}

// Main execution
async function main() {
  const recovery = new ErrorRecoverysystemSafe();
  await recovery.initialize();

  // Example usage
  try {
    // Simulate an error
    throw new Error('Deployment failed: Service unavailable');
  } catch (error) {
    await recovery.handleError(error, {
      operation: 'deployment',
      step: 'service_start',
    });
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default ErrorRecoverySystem;
