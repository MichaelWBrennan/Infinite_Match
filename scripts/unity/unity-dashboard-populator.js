#!/usr/bin/env node
/**
 * Unity Cloud Dashboard Populator
 * Automatically populates Unity Cloud dashboard using repository workflows and data
 */

import { Logger } from '../../src/core/logger/index.js';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const logger = new Logger('UnityDashboardPopulator');

class UnityDashboardPopulator {
  constructor() {
    this.projectId = process.env.UNITY_PROJECT_ID || '0dd5a03e-7f23-49c4-964e-7919c48c0574';
    this.environmentId = process.env.UNITY_ENV_ID || '1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d';
    this.clientId = process.env.UNITY_CLIENT_ID;
    this.clientSecret = process.env.UNITY_CLIENT_SECRET;
    this.baseUrl = 'https://services.api.unity.com';
    this.accessToken = null;
    this.dashboardData = {
      economy: {},
      analytics: {},
      remoteConfig: {},
      cloudCode: {},
      buildMetrics: {},
      healthMetrics: {}
    };
  }

  async authenticate() {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('UNITY_CLIENT_ID and UNITY_CLIENT_SECRET environment variables are required');
    }

    try {
      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          scope: 'economy inventory cloudcode remoteconfig analytics',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OAuth failed: ${response.status} ${error}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      
      logger.info('Successfully authenticated with Unity Cloud Services', {
        tokenType: data.token_type,
        expiresIn: data.expires_in,
        scope: data.scope,
      });

      return true;
    } catch (error) {
      logger.error('Unity Cloud API authentication failed', { error: error.message });
      throw error;
    }
  }

  async makeRequest(endpoint, options = {}) {
    if (!this.accessToken) {
      await this.authenticate();
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.accessToken = null;
          await this.authenticate();
          
          const retryResponse = await fetch(url, {
            ...options,
            headers: {
              ...headers,
              'Authorization': `Bearer ${this.accessToken}`,
            },
          });

          if (!retryResponse.ok) {
            throw new Error(`API request failed after re-authentication: ${retryResponse.status}`);
          }

          return await retryResponse.json();
        }
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Unity Cloud API request failed', { endpoint, error: error.message });
      throw error;
    }
  }

  async loadEconomyData() {
    try {
      logger.info('Loading economy data from CSV files...');
      
      // Load currencies
      const currenciesCSV = await readFile(join(process.cwd(), 'economy', 'currencies.csv'), 'utf-8');
      const currencies = this.parseCSV(currenciesCSV, ['id', 'name', 'type', 'initial', 'maximum']);

      // Load inventory
      const inventoryCSV = await readFile(join(process.cwd(), 'economy', 'inventory.csv'), 'utf-8');
      const inventory = this.parseCSV(inventoryCSV, ['id', 'name', 'type', 'tradable', 'stackable']);

      // Load catalog
      const catalogCSV = await readFile(join(process.cwd(), 'economy', 'catalog.csv'), 'utf-8');
      const catalog = this.parseCSV(catalogCSV, ['id', 'name', 'cost_currency', 'cost_amount', 'rewards']);

      this.dashboardData.economy = { currencies, inventory, catalog };
      
      logger.info('Economy data loaded successfully', {
        currencies: currencies.length,
        inventory: inventory.length,
        catalog: catalog.length
      });

      return { currencies, inventory, catalog };
    } catch (error) {
      logger.error('Failed to load economy data', { error: error.message });
      throw error;
    }
  }

  async loadWorkflowMetrics() {
    try {
      logger.info('Loading workflow metrics and monitoring data...');
      
      // Load health reports
      const healthReports = await this.loadMonitoringReports('health_report');
      const performanceReports = await this.loadMonitoringReports('performance_report');
      const maintenanceReports = await this.loadMonitoringReports('maintenance_report');

      // Aggregate metrics
      const latestHealth = healthReports[healthReports.length - 1] || {};
      const latestPerformance = performanceReports[performanceReports.length - 1] || {};

      this.dashboardData.healthMetrics = {
        overallHealth: latestHealth.overall_health || 'unknown',
        healthScore: latestHealth.health_score || 0,
        lastCheck: latestHealth.timestamp || new Date().toISOString(),
        checks: latestHealth.checks || {}
      };

      this.dashboardData.buildMetrics = {
        performanceScore: latestPerformance.performance_score || 0,
        buildSuccess: latestPerformance.build_metrics?.build_success || false,
        buildDuration: latestPerformance.build_metrics?.build_duration || 0,
        testCoverage: latestPerformance.test_metrics?.coverage_percentage || 0,
        testsPassed: latestPerformance.test_metrics?.tests_passed || 0,
        testsFailed: latestPerformance.test_metrics?.tests_failed || 0
      };

      logger.info('Workflow metrics loaded successfully', {
        healthScore: this.dashboardData.healthMetrics.healthScore,
        performanceScore: this.dashboardData.buildMetrics.performanceScore,
        testCoverage: this.dashboardData.buildMetrics.testCoverage
      });

      return this.dashboardData;
    } catch (error) {
      logger.error('Failed to load workflow metrics', { error: error.message });
      throw error;
    }
  }

  async loadMonitoringReports(reportType) {
    try {
      const { stdout } = await execAsync(`find monitoring/reports -name "${reportType}_*.json" | sort`);
      const files = stdout.trim().split('\n').filter(f => f);
      
      const reports = [];
      for (const file of files) {
        try {
          const content = await readFile(file, 'utf-8');
          const report = JSON.parse(content);
          reports.push(report);
        } catch (error) {
          logger.warn(`Failed to parse report file: ${file}`, { error: error.message });
        }
      }
      
      return reports;
    } catch (error) {
      logger.warn(`Failed to load ${reportType} reports`, { error: error.message });
      return [];
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

        // Convert numeric values
        if (['initial', 'maximum', 'cost_amount'].includes(header)) {
          value = parseInt(value) || 0;
        }

        // Convert boolean values
        if (['tradable', 'stackable'].includes(header)) {
          value = value.toLowerCase() === 'true';
        }

        obj[header] = value;
      });

      result.push(obj);
    }

    return result;
  }

  async deployEconomyData() {
    try {
      logger.info('Deploying economy data to Unity Cloud...');
      
      const { currencies, inventory, catalog } = this.dashboardData.economy;
      const results = {
        currencies: [],
        inventory: [],
        catalog: [],
        errors: []
      };

      // Deploy currencies
      for (const currency of currencies) {
        try {
          const result = await this.createCurrency(currency);
          results.currencies.push(result);
          logger.info(`Currency deployed: ${currency.name} (${currency.id})`);
        } catch (error) {
          results.errors.push({
            type: 'currency',
            id: currency.id,
            error: error.message,
          });
          logger.error(`Failed to deploy currency: ${currency.id}`, { error: error.message });
        }
      }

      // Deploy inventory items
      for (const item of inventory) {
        try {
          const result = await this.createInventoryItem(item);
          results.inventory.push(result);
          logger.info(`Inventory item deployed: ${item.name} (${item.id})`);
        } catch (error) {
          results.errors.push({
            type: 'inventory',
            id: item.id,
            error: error.message,
          });
          logger.error(`Failed to deploy inventory item: ${item.id}`, { error: error.message });
        }
      }

      // Deploy catalog items
      for (const item of catalog) {
        try {
          const result = await this.createCatalogItem(item);
          results.catalog.push(result);
          logger.info(`Catalog item deployed: ${item.name} (${item.id})`);
        } catch (error) {
          results.errors.push({
            type: 'catalog',
            id: item.id,
            error: error.message,
          });
          logger.error(`Failed to deploy catalog item: ${item.id}`, { error: error.message });
        }
      }

      logger.info('Economy data deployment completed', {
        currenciesDeployed: results.currencies.length,
        inventoryDeployed: results.inventory.length,
        catalogDeployed: results.catalog.length,
        errors: results.errors.length
      });

      return results;
    } catch (error) {
      logger.error('Economy data deployment failed', { error: error.message });
      throw error;
    }
  }

  async createCurrency(currencyData) {
    const endpoint = `/economy/v1/projects/${this.projectId}/environments/${this.environmentId}/currencies`;
    
    const result = await this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(currencyData),
    });
    
    return result;
  }

  async createInventoryItem(itemData) {
    const endpoint = `/economy/v1/projects/${this.projectId}/environments/${this.environmentId}/inventory-items`;
    
    const result = await this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
    
    return result;
  }

  async createCatalogItem(catalogData) {
    const endpoint = `/economy/v1/projects/${this.projectId}/environments/${this.environmentId}/catalog-items`;
    
    const result = await this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(catalogData),
    });
    
    return result;
  }

  async generateDashboardReport() {
    try {
      logger.info('Generating comprehensive dashboard report...');
      
      const report = {
        timestamp: new Date().toISOString(),
        project: {
          id: this.projectId,
          environment: this.environmentId,
          name: 'Evergreen Match-3 Unity Game'
        },
        economy: {
          currencies: this.dashboardData.economy.currencies?.length || 0,
          inventory: this.dashboardData.economy.inventory?.length || 0,
          catalog: this.dashboardData.economy.catalog?.length || 0
        },
        health: this.dashboardData.healthMetrics,
        performance: this.dashboardData.buildMetrics,
        workflows: {
          totalWorkflows: 7,
          activeWorkflows: ['unity-cloud-api-deploy', 'optimized-ci-cd', 'performance-testing', 'security-maintenance'],
          lastDeployment: new Date().toISOString()
        },
        recommendations: this.generateRecommendations()
      };

      // Save report
      const reportPath = join(process.cwd(), 'monitoring', 'reports', `dashboard_population_${Date.now()}.json`);
      await writeFile(reportPath, JSON.stringify(report, null, 2));
      
      logger.info('Dashboard report generated', { reportPath });
      return report;
    } catch (error) {
      logger.error('Failed to generate dashboard report', { error: error.message });
      throw error;
    }
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.dashboardData.healthMetrics.healthScore < 0.8) {
      recommendations.push('Improve overall health score by addressing failing checks');
    }
    
    if (this.dashboardData.buildMetrics.testCoverage < 80) {
      recommendations.push('Increase test coverage to improve code quality');
    }
    
    if (this.dashboardData.buildMetrics.testsFailed > 0) {
      recommendations.push('Fix failing tests to improve build stability');
    }
    
    if (this.dashboardData.buildMetrics.performanceScore < 90) {
      recommendations.push('Optimize performance to improve build metrics');
    }
    
    return recommendations;
  }

  async generateDashboardScripts() {
    try {
      logger.info('Generating dashboard population scripts...');
      
      // Generate JavaScript for manual dashboard population
      const dashboardScript = `
// Unity Cloud Dashboard Auto-Population Script
// Generated on ${new Date().toISOString()}

const dashboardData = ${JSON.stringify(this.dashboardData, null, 2)};

// Auto-populate economy data
function populateEconomy() {
  console.log('🚀 Starting Unity Cloud Dashboard population...');
  
  // Populate currencies
  dashboardData.economy.currencies.forEach((currency, index) => {
    setTimeout(() => {
      console.log(\`Populating currency \${index + 1}/\${dashboardData.economy.currencies.length}: \${currency.name}\`);
      // Add form filling logic here
    }, index * 1000);
  });
  
  // Populate inventory items
  dashboardData.economy.inventory.forEach((item, index) => {
    setTimeout(() => {
      console.log(\`Populating inventory item \${index + 1}/\${dashboardData.economy.inventory.length}: \${item.name}\`);
      // Add form filling logic here
    }, (dashboardData.economy.currencies.length + index) * 1000);
  });
  
  // Populate catalog items
  dashboardData.economy.catalog.forEach((item, index) => {
    setTimeout(() => {
      console.log(\`Populating catalog item \${index + 1}/\${dashboardData.economy.catalog.length}: \${item.name}\`);
      // Add form filling logic here
    }, (dashboardData.economy.currencies.length + dashboardData.economy.inventory.length + index) * 1000);
  });
}

// Run population
populateEconomy();
`;

      const scriptPath = join(process.cwd(), 'unity_dashboard_population.js');
      await writeFile(scriptPath, dashboardScript);
      
      logger.info('Dashboard population script generated', { scriptPath });
      return scriptPath;
    } catch (error) {
      logger.error('Failed to generate dashboard scripts', { error: error.message });
      throw error;
    }
  }

  async populateDashboard() {
    try {
      logger.info('Starting Unity Cloud Dashboard population...');

      // Authenticate
      await this.authenticate();

      // Load all data
      await this.loadEconomyData();
      await this.loadWorkflowMetrics();

      // Deploy economy data
      const deploymentResults = await this.deployEconomyData();

      // Generate reports and scripts
      const report = await this.generateDashboardReport();
      const scriptPath = await this.generateDashboardScripts();

      logger.info('Unity Cloud Dashboard population completed successfully', {
        economyDeployed: {
          currencies: deploymentResults.currencies.length,
          inventory: deploymentResults.inventory.length,
          catalog: deploymentResults.catalog.length
        },
        errors: deploymentResults.errors.length,
        reportGenerated: true,
        scriptGenerated: scriptPath
      });

      return {
        success: true,
        deploymentResults,
        report,
        scriptPath
      };
    } catch (error) {
      logger.error('Unity Cloud Dashboard population failed', { error: error.message });
      throw error;
    }
  }
}

// Run dashboard population
const populator = new UnityDashboardPopulator();
populator
  .populateDashboard()
  .then((result) => {
    logger.info('Dashboard population completed successfully', result);
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Dashboard population failed', { error: error.message });
    process.exit(1);
  });