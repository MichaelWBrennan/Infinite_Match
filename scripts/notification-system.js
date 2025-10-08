#!/usr/bin/env node

/**
 * Advanced Notification System
 * Provides comprehensive notifications via Slack, Discord, Email, and more
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class NotificationSystem {
  constructor() {
    this.config = {
      slack: {
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        channel: process.env.SLACK_CHANNEL || '#deployments',
        username: 'Deployment Bot',
        icon: ':robot_face:',
      },
      discord: {
        webhookUrl: process.env.DISCORD_WEBHOOK_URL,
        username: 'Deployment Bot',
        avatar: 'https://cdn.discordapp.com/embed/avatars/0.png',
      },
      email: {
        smtp: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        },
        from: process.env.EMAIL_FROM,
        to: process.env.EMAIL_TO,
      },
      teams: {
        webhookUrl: process.env.TEAMS_WEBHOOK_URL,
      },
    };

    this.notificationTypes = {
      deployment_success: {
        priority: 'info',
        channels: ['slack', 'discord', 'email'],
        template: 'deployment_success',
      },
      deployment_failure: {
        priority: 'critical',
        channels: ['slack', 'discord', 'email', 'teams'],
        template: 'deployment_failure',
      },
      test_failure: {
        priority: 'high',
        channels: ['slack', 'discord'],
        template: 'test_failure',
      },
      security_alert: {
        priority: 'critical',
        channels: ['slack', 'discord', 'email', 'teams'],
        template: 'security_alert',
      },
      performance_warning: {
        priority: 'medium',
        channels: ['slack'],
        template: 'performance_warning',
      },
      health_check_failure: {
        priority: 'high',
        channels: ['slack', 'discord', 'email'],
        template: 'health_check_failure',
      },
      backup_completed: {
        priority: 'info',
        channels: ['slack'],
        template: 'backup_completed',
      },
      rollback_executed: {
        priority: 'high',
        channels: ['slack', 'discord', 'email'],
        template: 'rollback_executed',
      },
    };
  }

  async sendNotification(type, data) {
    const notificationConfig = this.notificationTypes[type];

    if (!notificationConfig) {
      console.error(`❌ Unknown notification type: ${type}`);
      return false;
    }

    console.log(`📢 Sending ${type} notification...`);

    try {
      const message = this.buildMessage(type, data);

      // Send to configured channels
      for (const channel of notificationConfig.channels) {
        await this.sendToChannel(channel, message, notificationConfig.priority);
      }

      console.log('✅ Notification sent successfully');
      return true;
    } catch (error) {
      console.error(`❌ Failed to send notification: ${error.message}`);
      return false;
    }
  }

  buildMessage(type, data) {
    const templates = {
      deployment_success: {
        title: '🚀 Deployment Successful',
        color: 'good',
        fields: [
          { title: 'Environment', value: data.environment, short: true },
          { title: 'Branch', value: data.branch, short: true },
          { title: 'Commit', value: data.commit, short: true },
          { title: 'Duration', value: data.duration, short: true },
          {
            title: 'Deployed By',
            value: data.deployedBy || 'Automated System',
            short: true,
          },
        ],
        text: `Successfully deployed to ${data.environment} environment`,
      },

      deployment_failure: {
        title: '❌ Deployment Failed',
        color: 'danger',
        fields: [
          { title: 'Environment', value: data.environment, short: true },
          { title: 'Branch', value: data.branch, short: true },
          { title: 'Commit', value: data.commit, short: true },
          { title: 'Error', value: data.error, short: false },
          {
            title: 'Rollback',
            value: data.rollback ? 'Executed' : 'Not Required',
            short: true,
          },
        ],
        text: `Deployment to ${data.environment} failed: ${data.error}`,
      },

      test_failure: {
        title: '🧪 Test Failure',
        color: 'warning',
        fields: [
          { title: 'Test Suite', value: data.testSuite, short: true },
          { title: 'Failed Tests', value: data.failedTests, short: true },
          { title: 'Total Tests', value: data.totalTests, short: true },
          { title: 'Duration', value: data.duration, short: true },
          { title: 'Error Details', value: data.errorDetails, short: false },
        ],
        text: `${data.failedTests} out of ${data.totalTests} tests failed in ${data.testSuite}`,
      },

      security_alert: {
        title: '🔒 Security Alert',
        color: 'danger',
        fields: [
          { title: 'Severity', value: data.severity, short: true },
          { title: 'Vulnerability', value: data.vulnerability, short: true },
          { title: 'File', value: data.file, short: true },
          { title: 'Line', value: data.line, short: true },
          { title: 'Description', value: data.description, short: false },
          {
            title: 'Fix Applied',
            value: data.fixApplied ? 'Yes' : 'No',
            short: true,
          },
        ],
        text: `Security vulnerability detected: ${data.vulnerability}`,
      },

      performance_warning: {
        title: '⚡ Performance Warning',
        color: 'warning',
        fields: [
          { title: 'Metric', value: data.metric, short: true },
          { title: 'Current Value', value: data.currentValue, short: true },
          { title: 'Threshold', value: data.threshold, short: true },
          { title: 'Impact', value: data.impact, short: false },
          { title: 'Optimization', value: data.optimization, short: false },
        ],
        text: `Performance issue detected: ${data.metric} is ${data.currentValue} (threshold: ${data.threshold})`,
      },

      health_check_failure: {
        title: '🏥 Health Check Failed',
        color: 'danger',
        fields: [
          { title: 'Service', value: data.service, short: true },
          { title: 'Status', value: data.status, short: true },
          { title: 'Error', value: data.error, short: false },
          {
            title: 'Recovery',
            value: data.recovery ? 'In Progress' : 'Manual Required',
            short: true,
          },
          { title: 'Last Check', value: data.lastCheck, short: true },
        ],
        text: `Health check failed for ${data.service}: ${data.error}`,
      },

      backup_completed: {
        title: '💾 Backup Completed',
        color: 'good',
        fields: [
          { title: 'Type', value: data.type, short: true },
          { title: 'Size', value: data.size, short: true },
          { title: 'Duration', value: data.duration, short: true },
          { title: 'Location', value: data.location, short: true },
          { title: 'Status', value: data.status, short: true },
        ],
        text: `Backup completed successfully: ${data.type}`,
      },

      rollback_executed: {
        title: '🔄 Rollback Executed',
        color: 'warning',
        fields: [
          { title: 'Environment', value: data.environment, short: true },
          { title: 'From Version', value: data.fromVersion, short: true },
          { title: 'To Version', value: data.toVersion, short: true },
          { title: 'Reason', value: data.reason, short: false },
          { title: 'Duration', value: data.duration, short: true },
          { title: 'Status', value: data.status, short: true },
        ],
        text: `Rollback executed for ${data.environment}: ${data.reason}`,
      },
    };

    return (
      templates[type] || {
        title: '📢 Notification',
        color: 'info',
        text: 'System notification',
        fields: [],
      }
    );
  }

  async sendToChannel(channel, message, priority) {
    try {
      switch (channel) {
        case 'slack':
          await this.sendToSlack(message);
          break;
        case 'discord':
          await this.sendToDiscord(message);
          break;
        case 'email':
          await this.sendToEmail(message, priority);
          break;
        case 'teams':
          await this.sendToTeams(message);
          break;
        default:
          console.warn(`⚠️ Unknown channel: ${channel}`);
      }
    } catch (error) {
      console.error(`❌ Failed to send to ${channel}: ${error.message}`);
    }
  }

  async sendToSlack(message) {
    if (!this.config.slack.webhookUrl) {
      console.warn('⚠️ Slack webhook URL not configured');
      return;
    }

    const payload = {
      channel: this.config.slack.channel,
      username: this.config.slack.username,
      icon_emoji: this.config.slack.icon,
      attachments: [
        {
          color: message.color,
          title: message.title,
          text: message.text,
          fields: message.fields,
          footer: 'Deployment Bot',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    const response = await fetch(this.config.slack.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`);
    }
  }

  async sendToDiscord(message) {
    if (!this.config.discord.webhookUrl) {
      console.warn('⚠️ Discord webhook URL not configured');
      return;
    }

    const colorMap = {
      good: 0x00ff00,
      warning: 0xffaa00,
      danger: 0xff0000,
      info: 0x0099ff,
    };

    const embed = {
      title: message.title,
      description: message.text,
      color: colorMap[message.color] || 0x0099ff,
      fields: message.fields,
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Deployment Bot',
      },
    };

    const payload = {
      username: this.config.discord.username,
      avatar_url: this.config.discord.avatar,
      embeds: [embed],
    };

    const response = await fetch(this.config.discord.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Discord API error: ${response.status}`);
    }
  }

  async sendToEmail(message, priority) {
    if (!this.config.email.smtp.host) {
      console.warn('⚠️ Email SMTP not configured');
      return;
    }

    // In a real implementation, you would use nodemailer or similar
    console.log(`📧 Email notification (${priority}): ${message.title}`);
    console.log(`   To: ${this.config.email.to}`);
    console.log(`   Subject: ${message.title}`);
    console.log(`   Body: ${message.text}`);
  }

  async sendToTeams(message) {
    if (!this.config.teams.webhookUrl) {
      console.warn('⚠️ Teams webhook URL not configured');
      return;
    }

    const colorMap = {
      good: '00ff00',
      warning: 'ffaa00',
      danger: 'ff0000',
      info: '0099ff',
    };

    const payload = {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      themeColor: colorMap[message.color] || '0099ff',
      summary: message.title,
      sections: [
        {
          activityTitle: message.title,
          activitySubtitle: message.text,
          facts: message.fields.map((field) => ({
            name: field.title,
            value: field.value,
          })),
          markdown: true,
        },
      ],
    };

    const response = await fetch(this.config.teams.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Teams API error: ${response.status}`);
    }
  }

  // Convenience methods for common notifications
  async notifyDeploymentSuccess(
    environment,
    branch,
    commit,
    duration,
    deployedBy
  ) {
    return await this.sendNotification('deployment_success', {
      environment,
      branch,
      commit,
      duration,
      deployedBy,
    });
  }

  async notifyDeploymentFailure(
    environment,
    branch,
    commit,
    error,
    rollback = false
  ) {
    return await this.sendNotification('deployment_failure', {
      environment,
      branch,
      commit,
      error,
      rollback,
    });
  }

  async notifyTestFailure(
    testSuite,
    failedTests,
    totalTests,
    duration,
    errorDetails
  ) {
    return await this.sendNotification('test_failure', {
      testSuite,
      failedTests,
      totalTests,
      duration,
      errorDetails,
    });
  }

  async notifySecurityAlert(
    severity,
    vulnerability,
    file,
    line,
    description,
    fixApplied = false
  ) {
    return await this.sendNotification('security_alert', {
      severity,
      vulnerability,
      file,
      line,
      description,
      fixApplied,
    });
  }

  async notifyPerformanceWarning(
    metric,
    currentValue,
    threshold,
    impact,
    optimization
  ) {
    return await this.sendNotification('performance_warning', {
      metric,
      currentValue,
      threshold,
      impact,
      optimization,
    });
  }

  async notifyHealthCheckFailure(
    service,
    status,
    error,
    recovery = false,
    lastCheck
  ) {
    return await this.sendNotification('health_check_failure', {
      service,
      status,
      error,
      recovery,
      lastCheck,
    });
  }

  async notifyBackupCompleted(type, size, duration, location, status) {
    return await this.sendNotification('backup_completed', {
      type,
      size,
      duration,
      location,
      status,
    });
  }

  async notifyRollbackExecuted(
    environment,
    fromVersion,
    toVersion,
    reason,
    duration,
    status
  ) {
    return await this.sendNotification('rollback_executed', {
      environment,
      fromVersion,
      toVersion,
      reason,
      duration,
      status,
    });
  }

  // Test notification system
  async testNotifications() {
    console.log('🧪 Testing notification system...');

    const testData = {
      deployment_success: {
        environment: 'staging',
        branch: 'feature/test',
        commit: 'abc123',
        duration: '2m 30s',
        deployedBy: 'Test User',
      },
      deployment_failure: {
        environment: 'production',
        branch: 'main',
        commit: 'def456',
        error: 'Build timeout after 10 minutes',
        rollback: true,
      },
      test_failure: {
        testSuite: 'Unit Tests',
        failedTests: 3,
        totalTests: 25,
        duration: '1m 45s',
        errorDetails: 'AssertionError: Expected 5 but got 3',
      },
      security_alert: {
        severity: 'high',
        vulnerability: 'SQL Injection',
        file: 'src/database.js',
        line: 42,
        description: 'User input not properly sanitized',
        fixApplied: true,
      },
      performance_warning: {
        metric: 'Memory Usage',
        currentValue: '85%',
        threshold: '80%',
        impact: 'May cause slowdowns',
        optimization: 'Garbage collection triggered',
      },
    };

    for (const [type, data] of Object.entries(testData)) {
      console.log(`\n📢 Testing ${type} notification...`);
      await this.sendNotification(type, data);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Rate limiting
    }

    console.log('\n✅ Notification system test completed');
  }
}

// Main execution
async function main() {
  const notifications = new NotificationsystemSafe();

  // Test the notification system
  await notifications.testNotifications();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default NotificationSystem;
