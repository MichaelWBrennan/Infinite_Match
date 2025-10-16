/**
 * Report Generation Workflow Step
 * Generates comprehensive reports
 */

import { Logger } from 'core/logger/index.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getService } from 'core/services/ServiceRegistry.js';

const logger = new Logger('ReportGenerationStep');

export class ReportGenerationStep {
  constructor() {
    this.name = 'reportGeneration';
  }

  async execute(state) {
    logger.info('Starting report generation...');

    try {
      const economyService = getService('economyService');
      const cacheManager = getService('cacheManager');

      // Get data from state
      const healthStatus = state.get('healthStatus');
      const deployResults = state.get('deployResults');
      // const economyData = state.get('economyData');

      // Generate economy report
      const economyReport = await economyService.generateReport();

      // Generate comprehensive report
      const report = {
        timestamp: new Date().toISOString(),
        workflow: {
          status: 'completed',
          steps: ['healthCheck', 'economyDeploy', 'reportGeneration'],
        },
        health: healthStatus,
        deployment: deployResults,
        economy: economyReport,
        system: {
          memory: process.memoryUsage(),
          uptime: process.uptime(),
          cacheStats: cacheManager.getStats(),
        },
      };

      // Save report to file
      const reportsDir = join(process.cwd(), 'src', 'core', 'reports');
      await mkdir(reportsDir, { recursive: true });

      const reportPath = join(reportsDir, `automation_report_${Date.now()}.json`);
      await writeFile(reportPath, JSON.stringify(report, null, 2));

      // Store report in state
      state.set('report', report);
      state.set('reportPath', reportPath);

      logger.info('Report generation completed', {
        path: reportPath,
        status: 'completed',
        summary: {
          failedSteps: report.workflow.failedSteps || 0,
          successfulSteps: report.workflow.successfulSteps || 3,
          totalSteps: report.workflow.totalSteps || 3,
        },
      });

      return {
        success: true,
        reportPath,
        report,
      };
    } catch (error) {
      logger.error('Report generation failed', { error: error.message });
      throw error;
    }
  }
}

export default ReportGenerationStep;
