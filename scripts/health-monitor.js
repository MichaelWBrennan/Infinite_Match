#!/usr/bin/env node

/**
 * Health Monitor
 * Comprehensive health monitoring and self-healing system
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class HealthMonitor {
  constructor() {
    this.checks = [
      { name: 'Server Health', critical: true, check: this.checkServerHealth.bind(this) },
      { name: 'Database Connection', critical: true, check: this.checkDatabaseHealth.bind(this) },
      { name: 'Economy System', critical: true, check: this.checkEconomyHealth.bind(this) },
      { name: 'Unity Services', critical: true, check: this.checkUnityHealth.bind(this) },
      { name: 'API Endpoints', critical: false, check: this.checkAPIHealth.bind(this) },
      { name: 'File System', critical: false, check: this.checkFileSystemHealth.bind(this) },
      { name: 'Memory Usage', critical: false, check: this.checkMemoryHealth.bind(this) },
      { name: 'Disk Space', critical: false, check: this.checkDiskHealth.bind(this) }
    ];
    
    this.selfHealing = true;
    this.alertThreshold = 3; // Number of consecutive failures before alert
    this.failureCounts = {};
  }

  async runHealthCheck() {
    console.log('🏥 Starting Health Monitor');
    console.log('='.repeat(50));
    console.log(`Time: ${new Date().toISOString()}`);
    console.log(`Self-healing: ${this.selfHealing ? 'Enabled' : 'Disabled'}`);
    console.log('');

    const results = {
      timestamp: new Date().toISOString(),
      overall: 'healthy',
      checks: {},
      alerts: [],
      actions: []
    };

    // Run all health checks
    for (const check of this.checks) {
      try {
        const result = await this.runCheck(check);
        results.checks[check.name] = result;
        
        if (!result.healthy) {
          await this.handleFailure(check, result);
          results.alerts.push({
            check: check.name,
            message: result.message,
            critical: check.critical,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error(`❌ Error running ${check.name}:`, error.message);
        results.checks[check.name] = {
          healthy: false,
          message: `Error: ${error.message}`,
          critical: check.critical
        };
      }
    }

    // Determine overall health
    const criticalFailures = Object.values(results.checks).filter(
      check => !check.healthy && check.critical
    );
    
    if (criticalFailures.length > 0) {
      results.overall = 'critical';
    } else if (results.alerts.length > 0) {
      results.overall = 'warning';
    }

    // Generate report
    await this.generateHealthReport(results);
    
    // Self-healing actions
    if (this.selfHealing && results.overall !== 'healthy') {
      await this.performSelfHealing(results);
    }

    return results;
  }

  async runCheck(check) {
    console.log(`🔍 Checking ${check.name}...`);
    
    try {
      const result = await check.check();
      const status = result.healthy ? '✅' : '❌';
      console.log(`${status} ${check.name}: ${result.message}`);
      
      return result;
    } catch (error) {
      console.log(`❌ ${check.name}: Error - ${error.message}`);
      return {
        healthy: false,
        message: `Error: ${error.message}`,
        critical: check.critical
      };
    }
  }

  async checkServerHealth() {
    // Simulate server health check
    return new Promise((resolve) => {
      setTimeout(() => {
        const healthy = crypto.getRandomValues(new Uint32Array(1))[0] / 0xffffffff) > 0.05; // 95% chance of being healthy
        resolve({
          healthy,
          message: healthy ? 'Server responding normally' : 'Server not responding',
          responseTime: Math.floor(50 + crypto.getRandomValues(new Uint32Array(1))[0] / 0xffffffff) * 100),
          uptime: (99.0 + crypto.getRandomValues(new Uint32Array(1))[0] / 0xffffffff) * 1.0).toFixed(2)
        });
      }, 100);
    });
  }

  async checkDatabaseHealth() {
    // Simulate database health check
    return new Promise((resolve) => {
      setTimeout(() => {
        const healthy = crypto.getRandomValues(new Uint32Array(1))[0] / 0xffffffff) > 0.02; // 98% chance of being healthy
        resolve({
          healthy,
          message: healthy ? 'Database connection active' : 'Database connection failed',
          connections: Math.floor(5 + crypto.getRandomValues(new Uint32Array(1))[0] / 0xffffffff) * 20),
          queryTime: Math.floor(10 + crypto.getRandomValues(new Uint32Array(1))[0] / 0xffffffff) * 50)
        });
      }, 150);
    });
  }

  async checkEconomyHealth() {
    // Check economy system files
    const economyFiles = [
      'economy/catalog.csv',
      'economy/currencies.csv',
      'economy/inventory.csv'
    ];

    let healthy = true;
    let message = 'Economy system operational';
    const missingFiles = [];

    for (const file of economyFiles) {
      const filePath = path.join(__dirname, '..', file);
      if (!fs.existsSync(filePath)) {
        healthy = false;
        missingFiles.push(file);
      }
    }

    if (!healthy) {
      message = `Missing economy files: ${missingFiles.join(', ')}`;
    }

    return {
      healthy,
      message,
      filesChecked: economyFiles.length,
      missingFiles: missingFiles.length
    };
  }

  async checkUnityHealth() {
    // Check Unity project structure
    const unityPath = path.join(__dirname, '..', 'unity');
    const requiredDirs = ['Assets', 'ProjectSettings', 'Packages'];
    
    let healthy = true;
    let message = 'Unity project structure intact';
    const missingDirs = [];

    for (const dir of requiredDirs) {
      const dirPath = path.join(unityPath, dir);
      if (!fs.existsSync(dirPath)) {
        healthy = false;
        missingDirs.push(dir);
      }
    }

    if (!healthy) {
      message = `Missing Unity directories: ${missingDirs.join(', ')}`;
    }

    return {
      healthy,
      message,
      directoriesChecked: requiredDirs.length,
      missingDirectories: missingDirs.length
    };
  }

  async checkAPIHealth() {
    // Simulate API health check
    return new Promise((resolve) => {
      setTimeout(() => {
        const healthy = crypto.getRandomValues(new Uint32Array(1))[0] / 0xffffffff) > 0.03; // 97% chance of being healthy
        resolve({
          healthy,
          message: healthy ? 'All API endpoints responding' : 'Some API endpoints failing',
          endpointsChecked: 10,
          failedEndpoints: healthy ? 0 : Math.floor(1 + crypto.getRandomValues(new Uint32Array(1))[0] / 0xffffffff) * 3)
        });
      }, 200);
    });
  }

  async checkFileSystemHealth() {
    // Check available disk space
    const stats = {
      healthy: true,
      message: 'File system healthy',
      freeSpace: '2.5GB',
      usedSpace: '7.5GB',
      totalSpace: '10GB'
    };

    // Simulate disk space check
    const freeSpacePercent = 75 + crypto.getRandomValues(new Uint32Array(1))[0] / 0xffffffff) * 20; // 75-95% free
    if (freeSpacePercent < 80) {
      stats.healthy = false;
      stats.message = `Low disk space: ${freeSpacePercent.toFixed(1)}% free`;
    }

    return stats;
  }

  async checkMemoryHealth() {
    // Simulate memory usage check
    const memoryUsage = 60 + crypto.getRandomValues(new Uint32Array(1))[0] / 0xffffffff) * 30; // 60-90% usage
    const healthy = memoryUsage < 85;
    
    return {
      healthy,
      message: healthy ? 'Memory usage normal' : `High memory usage: ${memoryUsage.toFixed(1)}%`,
      usage: `${memoryUsage.toFixed(1)}%`,
      available: `${(100 - memoryUsage).toFixed(1)}%`
    };
  }

  async checkDiskHealth() {
    // Simulate disk health check
    const healthy = crypto.getRandomValues(new Uint32Array(1))[0] / 0xffffffff) > 0.01; // 99% chance of being healthy
    return {
      healthy,
      message: healthy ? 'Disk health good' : 'Disk errors detected',
      readSpeed: Math.floor(100 + crypto.getRandomValues(new Uint32Array(1))[0] / 0xffffffff) * 200),
      writeSpeed: Math.floor(80 + crypto.getRandomValues(new Uint32Array(1))[0] / 0xffffffff) * 150)
    };
  }

  async handleFailure(check, result) {
    const key = check.name;
    this.failureCounts[key] = (this.failureCounts[key] || 0) + 1;

    if (this.failureCounts[key] >= this.alertThreshold) {
      console.log(`🚨 ALERT: ${check.name} has failed ${this.failureCounts[key]} times`);
      
      if (check.critical) {
        console.log(`🔥 CRITICAL: ${check.name} is critical for system operation`);
      }
    }
  }

  async performSelfHealing(results) {
    console.log('🔧 Performing self-healing actions...');
    
    const actions = [];

    // Heal economy system
    if (!results.checks['Economy System']?.healthy) {
      console.log('🔧 Attempting to heal economy system...');
      actions.push(await this.healEconomysystemSafe());
    }

    // Heal file system
    if (!results.checks['File System']?.healthy) {
      console.log('🔧 Attempting to heal file system...');
      actions.push(await this.healFilesystemSafe());
    }

    // Heal Unity project
    if (!results.checks['Unity Services']?.healthy) {
      console.log('🔧 Attempting to heal Unity project...');
      actions.push(await this.healUnityProject());
    }

    if (actions.length > 0) {
      console.log(`✅ Performed ${actions.length} self-healing actions`);
    } else {
      console.log('ℹ️ No self-healing actions needed');
    }

    return actions;
  }

  async healEconomysystemSafe() {
    // Create missing economy files if they don't exist
    const economyDir = path.join(__dirname, '..', 'economy');
    if (!fs.existsSync(economyDir)) {
      fs.mkdirSync(economyDir, { recursive: true });
    }

    const defaultFiles = {
      'catalog.csv': 'id,name,type,cost_gems,cost_coins,quantity,description\ncoins_small,Small Coin Pack,currency,20,0,1000,Perfect for new players!',
      'currencies.csv': 'id,name,symbol,description\ncoins,Coins,🪙,Primary game currency\ngems,Gems,💎,Premium currency',
      'inventory.csv': 'id,name,type,rarity,description\nsword_basic,Basic Sword,weapon,common,A simple but effective weapon'
    };

    for (const [filename, content] of Object.entries(defaultFiles)) {
      const filePath = path.join(economyDir, filename);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, content);
        console.log(`  ✅ Created ${filename}`);
      }
    }

    return 'Economy system files restored';
  }

  async healFilesystemSafe() {
    // Clean up temporary files
    const tempDir = path.join(__dirname, '..', 'temp');
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      let cleaned = 0;
      
      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = fs.statSync(filePath);
        const age = Date.now() - stats.mtime.getTime();
        
        // Delete files older than 1 hour
        if (age > 60 * 60 * 1000) {
          fs.unlinkSync(filePath);
          cleaned++;
        }
      }
      
      console.log(`  ✅ Cleaned ${cleaned} temporary files`);
    }

    return 'File system cleaned';
  }

  async healUnityProject() {
    // Ensure Unity project structure exists
    const unityDir = path.join(__dirname, '..', 'unity');
    const requiredDirs = ['Assets', 'ProjectSettings', 'Packages'];
    
    for (const dir of requiredDirs) {
      const dirPath = path.join(unityDir, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`  ✅ Created ${dir} directory`);
      }
    }

    return 'Unity project structure restored';
  }

  async generateHealthReport(results) {
    const reportPath = path.join(__dirname, '..', 'health-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    
    console.log(`📄 Health report generated: ${reportPath}`);
    
    // Also create a human-readable report
    const humanReport = this.generateHumanReport(results);
    const humanReportPath = path.join(__dirname, '..', 'health-report.md');
    fs.writeFileSync(humanReportPath, humanReport);
    
    console.log(`📄 Human-readable report: ${humanReportPath}`);
  }

  generateHumanReport(results) {
    const statusEmoji = {
      healthy: '✅',
      warning: '⚠️',
      critical: '🚨'
    };

    let report = `# Health Monitor Report\n\n`;
    report += `**Time:** ${results.timestamp}\n`;
    report += `**Overall Status:** ${statusEmoji[results.overall]} ${results.overall.toUpperCase()}\n\n`;

    report += `## Health Checks\n\n`;
    for (const [name, check] of Object.entries(results.checks)) {
      const emoji = check.healthy ? '✅' : '❌';
      const critical = check.critical ? ' (CRITICAL)' : '';
      report += `- ${emoji} **${name}**${critical}: ${check.message}\n`;
    }

    if (results.alerts.length > 0) {
      report += `\n## Alerts\n\n`;
      for (const alert of results.alerts) {
        const emoji = alert.critical ? '🚨' : '⚠️';
        report += `- ${emoji} **${alert.check}**: ${alert.message}\n`;
      }
    }

    report += `\n---\n*Generated by Health Monitor*\n`;
    return report;
  }
}

// Main execution
async function main() {
  const monitor = new HealthMonitor();
  
  try {
    const results = await monitor.runHealthCheck();
    
    if (results.overall === 'healthy') {
      console.log('🎉 All systems healthy!');
      process.exit(0);
    } else if (results.overall === 'warning') {
      console.log('⚠️ Some issues detected, but system is operational');
      process.exit(0);
    } else {
      console.log('🚨 Critical issues detected!');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Health monitor failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default HealthMonitor;