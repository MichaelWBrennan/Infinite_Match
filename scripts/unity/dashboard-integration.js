#!/usr/bin/env node
/**
 * Unity Cloud Dashboard Integration
 * Integrates repository workflows with Unity Cloud dashboard population
 */

import { Logger } from '../../src/core/logger/index.js';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const logger = new Logger('DashboardIntegration');

class DashboardIntegration {
  constructor() {
    this.workflows = [
      'unity-cloud-api-deploy.yml',
      'optimized-ci-cd.yml',
      'performance-testing.yml',
      'security-maintenance.yml',
      'unity-dashboard-population.yml'
    ];
    this.monitoringData = {};
    this.economyData = {};
    this.buildMetrics = {};
  }

  async loadWorkflowData() {
    try {
      logger.info('Loading workflow data and metrics...');
      
      // Load economy data
      await this.loadEconomyData();
      
      // Load monitoring reports
      await this.loadMonitoringData();
      
      // Load build metrics
      await this.loadBuildMetrics();
      
      // Load workflow status
      await this.loadWorkflowStatus();
      
      logger.info('Workflow data loaded successfully');
      return true;
    } catch (error) {
      logger.error('Failed to load workflow data', { error: error.message });
      throw error;
    }
  }

  async loadEconomyData() {
    try {
      const currenciesCSV = await readFile(join(process.cwd(), 'economy', 'currencies.csv'), 'utf-8');
      const inventoryCSV = await readFile(join(process.cwd(), 'economy', 'inventory.csv'), 'utf-8');
      const catalogCSV = await readFile(join(process.cwd(), 'economy', 'catalog.csv'), 'utf-8');

      this.economyData = {
        currencies: this.parseCSV(currenciesCSV, ['id', 'name', 'type', 'initial', 'maximum']),
        inventory: this.parseCSV(inventoryCSV, ['id', 'name', 'type', 'tradable', 'stackable']),
        catalog: this.parseCSV(catalogCSV, ['id', 'name', 'cost_currency', 'cost_amount', 'rewards'])
      };

      logger.info('Economy data loaded', {
        currencies: this.economyData.currencies.length,
        inventory: this.economyData.inventory.length,
        catalog: this.economyData.catalog.length
      });
    } catch (error) {
      logger.error('Failed to load economy data', { error: error.message });
      throw error;
    }
  }

  async loadMonitoringData() {
    try {
      const { stdout } = await execAsync('find monitoring/reports -name "*.json" | sort');
      const files = stdout.trim().split('\n').filter(f => f);
      
      const reports = {
        health: [],
        performance: [],
        maintenance: []
      };

      for (const file of files) {
        try {
          const content = await readFile(file, 'utf-8');
          const report = JSON.parse(content);
          
          if (file.includes('health_report')) {
            reports.health.push(report);
          } else if (file.includes('performance_report')) {
            reports.performance.push(report);
          } else if (file.includes('maintenance_report')) {
            reports.maintenance.push(report);
          }
        } catch (error) {
          logger.warn(`Failed to parse report: ${file}`, { error: error.message });
        }
      }

      this.monitoringData = reports;
      
      logger.info('Monitoring data loaded', {
        healthReports: reports.health.length,
        performanceReports: reports.performance.length,
        maintenanceReports: reports.maintenance.length
      });
    } catch (error) {
      logger.warn('Failed to load monitoring data', { error: error.message });
      this.monitoringData = { health: [], performance: [], maintenance: [] };
    }
  }

  async loadBuildMetrics() {
    try {
      // Get latest build information
      const { stdout: gitLog } = await execAsync('git log --oneline -10');
      const commits = gitLog.trim().split('\n');
      
      // Get workflow run information
      const { stdout: workflowRuns } = await execAsync('gh run list --limit 10 --json status,conclusion,createdAt,workflowName', { timeout: 10000 }).catch(() => ({ stdout: '[]' }));
      const runs = JSON.parse(workflowRuns);

      this.buildMetrics = {
        recentCommits: commits.length,
        recentRuns: runs.length,
        successfulRuns: runs.filter(r => r.conclusion === 'success').length,
        failedRuns: runs.filter(r => r.conclusion === 'failure').length,
        lastRun: runs[0]?.createdAt || new Date().toISOString()
      };

      logger.info('Build metrics loaded', this.buildMetrics);
    } catch (error) {
      logger.warn('Failed to load build metrics', { error: error.message });
      this.buildMetrics = {
        recentCommits: 0,
        recentRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        lastRun: new Date().toISOString()
      };
    }
  }

  async loadWorkflowStatus() {
    try {
      const workflowStatus = {};
      
      for (const workflow of this.workflows) {
        try {
          const { stdout } = await execAsync(`gh workflow list --json name,state,createdAt | jq '.[] | select(.name == "${workflow}")'`, { timeout: 5000 });
          const status = JSON.parse(stdout);
          workflowStatus[workflow] = status;
        } catch (error) {
          workflowStatus[workflow] = { state: 'unknown', error: error.message };
        }
      }

      this.workflowStatus = workflowStatus;
      logger.info('Workflow status loaded', { workflows: Object.keys(workflowStatus).length });
    } catch (error) {
      logger.warn('Failed to load workflow status', { error: error.message });
      this.workflowStatus = {};
    }
  }

  parseCSV(csvData, headers) {
    const lines = csvData.trim().split('\n');
    const result = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const obj = {};

      headers.forEach((header, index) => {
        let value = values[index] || '';

        if (['initial', 'maximum', 'cost_amount'].includes(header)) {
          value = parseInt(value) || 0;
        }

        if (['tradable', 'stackable'].includes(header)) {
          value = value.toLowerCase() === 'true';
        }

        obj[header] = value;
      });

      result.push(obj);
    }

    return result;
  }

  async generateDashboardData() {
    try {
      logger.info('Generating comprehensive dashboard data...');
      
      const dashboardData = {
        timestamp: new Date().toISOString(),
        project: {
          name: 'Evergreen Match-3 Unity Game',
          repository: process.env.GITHUB_REPOSITORY || 'unknown',
          branch: process.env.GITHUB_REF_NAME || 'unknown'
        },
        economy: this.economyData,
        monitoring: this.monitoringData,
        build: this.buildMetrics,
        workflows: this.workflowStatus,
        health: this.calculateOverallHealth(),
        recommendations: this.generateRecommendations()
      };

      // Ensure monitoring directory exists
      await mkdir(join(process.cwd(), 'monitoring', 'reports'), { recursive: true });
      
      // Save dashboard data
      const dashboardPath = join(process.cwd(), 'monitoring', 'reports', `dashboard_integration_${Date.now()}.json`);
      await writeFile(dashboardPath, JSON.stringify(dashboardData, null, 2));
      
      logger.info('Dashboard data generated', { path: dashboardPath });
      return dashboardData;
    } catch (error) {
      logger.error('Failed to generate dashboard data', { error: error.message });
      throw error;
    }
  }

  calculateOverallHealth() {
    const healthScore = this.monitoringData.health[this.monitoringData.health.length - 1]?.health_score || 0;
    const performanceScore = this.monitoringData.performance[this.monitoringData.performance.length - 1]?.performance_score || 0;
    const successRate = this.buildMetrics.recentRuns > 0 ? this.buildMetrics.successfulRuns / this.buildMetrics.recentRuns : 1;
    
    const overallScore = (healthScore + performanceScore + successRate * 100) / 3;
    
    return {
      score: overallScore,
      status: overallScore >= 80 ? 'excellent' : overallScore >= 60 ? 'good' : overallScore >= 40 ? 'fair' : 'poor',
      components: {
        health: healthScore,
        performance: performanceScore,
        reliability: successRate * 100
      }
    };
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.buildMetrics.failedRuns > 0) {
      recommendations.push('Fix failing workflow runs to improve reliability');
    }
    
    if (this.monitoringData.health.length > 0) {
      const latestHealth = this.monitoringData.health[this.monitoringData.health.length - 1];
      if (latestHealth.health_score < 0.8) {
        recommendations.push('Address health check issues to improve overall system health');
      }
    }
    
    if (this.monitoringData.performance.length > 0) {
      const latestPerformance = this.monitoringData.performance[this.monitoringData.performance.length - 1];
      if (latestPerformance.performance_score < 90) {
        recommendations.push('Optimize performance metrics to improve build quality');
      }
    }
    
    if (this.economyData.currencies.length === 0) {
      recommendations.push('Ensure economy data is properly configured');
    }
    
    return recommendations;
  }

  async generateUnityCloudConfig() {
    try {
      logger.info('Generating Unity Cloud configuration...');
      
      const config = {
        projectId: process.env.UNITY_PROJECT_ID || '0dd5a03e-7f23-49c4-964e-7919c48c0574',
        environmentId: process.env.UNITY_ENV_ID || '1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d',
        licenseType: 'personal',
        cloudServicesAvailable: true,
        economy: {
          currencies: this.economyData.currencies,
          inventory: this.economyData.inventory,
          catalog: this.economyData.catalog
        },
        analytics: {
          healthScore: this.calculateOverallHealth().score,
          lastUpdate: new Date().toISOString(),
          workflowStatus: this.workflowStatus
        },
        monitoring: {
          reports: this.monitoringData,
          buildMetrics: this.buildMetrics
        }
      };

      const configPath = join(process.cwd(), 'unity', 'Assets', 'StreamingAssets', 'unity_services_config.json');
      await writeFile(configPath, JSON.stringify(config, null, 2));
      
      logger.info('Unity Cloud configuration updated', { path: configPath });
      return config;
    } catch (error) {
      logger.error('Failed to generate Unity Cloud config', { error: error.message });
      throw error;
    }
  }

  async integrateWithWorkflows() {
    try {
      logger.info('Integrating dashboard data with workflows...');
      
      // Load all data
      await this.loadWorkflowData();
      
      // Generate dashboard data
      const dashboardData = await this.generateDashboardData();
      
      // Update Unity Cloud configuration
      const config = await this.generateUnityCloudConfig();
      
      logger.info('Dashboard integration completed successfully', {
        economyItems: dashboardData.economy.currencies.length + dashboardData.economy.inventory.length + dashboardData.economy.catalog.length,
        healthScore: dashboardData.health.score,
        recommendations: dashboardData.recommendations.length
      });
      
      return {
        success: true,
        dashboardData,
        config,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Dashboard integration failed', { error: error.message });
      throw error;
    }
  }
}

// Run integration
const integration = new DashboardIntegration();
integration
  .integrateWithWorkflows()
  .then((result) => {
    logger.info('Dashboard integration completed successfully', result);
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Dashboard integration failed', { error: error.message });
    process.exit(1);
  });