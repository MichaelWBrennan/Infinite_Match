#!/usr/bin/env node

/**
 * Status Check - Quick overview of automation status
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class StatusCheck {
  constructor() {
    this.projectName = 'Evergreen Match-3 Unity Game';
    this.version = '1.0.0';
  }

  async runStatusCheck() {
    console.log('🎯 Push and Forget - Status Check');
    console.log('='.repeat(50));
    console.log(`Project: ${this.projectName}`);
    console.log(`Version: ${this.version}`);
    console.log(`Time: ${new Date().toISOString()}`);
    console.log('');

    // Check automation status
    await this.checkAutomationStatus();
    
    // Check recent activity
    await this.checkRecentActivity();
    
    // Check system health
    await this.checkSystemHealth();
    
    // Show next steps
    this.showNextSteps();
  }

  async checkAutomationStatus() {
    console.log('🤖 Automation Status');
    console.log('-'.repeat(30));
    
    const workflows = [
      { name: 'Push and Forget', file: '.github/workflows/push-and-forget.yml', status: '✅ Active' },
      { name: 'Auto-Merge', file: '.github/workflows/auto-merge.yml', status: '✅ Active' },
      { name: 'Notifications', file: '.github/workflows/notifications.yml', status: '✅ Active' },
      { name: 'CI/CD Pipeline', file: '.github/workflows/ci-cd.yml', status: '✅ Active' },
      { name: 'Complete Automation', file: '.github/workflows/complete-automation.yml', status: '✅ Active' }
    ];

    workflows.forEach(workflow => {
      const exists = fs.existsSync(path.join(__dirname, '..', workflow.file));
      const status = exists ? workflow.status : '❌ Missing';
      console.log(`${workflow.name}: ${status}`);
    });

    console.log('');
  }

  async checkRecentActivity() {
    console.log('📊 Recent Activity');
    console.log('-'.repeat(30));
    
    // Check for recent reports
    const reports = [
      'deployment-status.json',
      'health-report.json',
      'test-report.json'
    ];

    let recentActivity = false;
    reports.forEach(report => {
      const reportPath = path.join(__dirname, '..', report);
      if (fs.existsSync(reportPath)) {
        const stats = fs.statSync(reportPath);
        const age = Date.now() - stats.mtime.getTime();
        const ageMinutes = Math.floor(age / (1000 * 60));
        
        if (ageMinutes < 60) {
          console.log(`📄 ${report}: Updated ${ageMinutes} minutes ago`);
          recentActivity = true;
        }
      }
    });

    if (!recentActivity) {
      console.log('ℹ️ No recent activity detected');
    }

    console.log('');
  }

  async checkSystemHealth() {
    console.log('🏥 System Health');
    console.log('-'.repeat(30));
    
    // Check key files and directories
    const checks = [
      { name: 'Package.json', path: 'package.json', critical: true },
      { name: 'Scripts Directory', path: 'scripts', critical: true },
      { name: 'GitHub Workflows', path: '.github/workflows', critical: true },
      { name: 'Economy Data', path: 'economy', critical: true },
      { name: 'Unity Project', path: 'unity', critical: false },
      { name: 'Documentation', path: 'docs', critical: false }
    ];

    checks.forEach(check => {
      const checkPath = path.join(__dirname, '..', check.path);
      const exists = fs.existsSync(checkPath);
      const status = exists ? '✅ OK' : (check.critical ? '❌ Missing' : '⚠️ Missing');
      console.log(`${check.name}: ${status}`);
    });

    console.log('');
  }

  showNextSteps() {
    console.log('🚀 Next Steps');
    console.log('-'.repeat(30));
    console.log('1. Write your code');
    console.log('2. Commit and push to GitHub');
    console.log('3. Watch the automation work!');
    console.log('');
    console.log('📋 Available Commands:');
    console.log('  npm run status     - This status check');
    console.log('  npm run dashboard  - Deployment dashboard');
    console.log('  npm run monitor    - Health monitoring');
    console.log('  npm run deploy:all - Manual deployment');
    console.log('');
    console.log('🎯 Your system is ready for push-and-forget automation!');
    console.log('');
  }
}

// Main execution
async function main() {
  const statusCheck = new StatusCheck();
  
  try {
    await statusCheck.runStatusCheck();
    console.log('✅ Status check completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Status check failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default StatusCheck;