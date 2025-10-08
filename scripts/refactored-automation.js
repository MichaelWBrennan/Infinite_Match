#!/usr/bin/env node
/**
 * Refactored Automation Script
 * Uses the new workflow engine and service container
 */

import { registerServices } from '../src/core/services/ServiceRegistry.js';
import { WorkflowEngine } from '../src/workflows/WorkflowEngine.js';
import HealthCheckStep from '../src/workflows/steps/HealthCheckStep.js';
import EconomyDeployStep from '../src/workflows/steps/EconomyDeployStep.js';
import ReportGenerationStep from '../src/workflows/steps/ReportGenerationStep.js';
import { Logger } from '../src/core/logger/index.js';

const logger = new Logger('RefactoredAutomation');

class RefactoredAutomation {
  constructor() {
    this.workflow = new WorkflowEngine();
    this.setupWorkflow();
  }

  setupWorkflow() {
    // Register all services
    registerServices();

    // Add workflow steps
    this.workflow
      .addStep(new HealthCheckStep())
      .addStep(new EconomyDeployStep())
      .addStep(new ReportGenerationStep());
  }

  async run() {
    try {
      logger.info('Starting refactored automation workflow...');

      const result = await this.workflow.execute();

      if (result.success) {
        logger.info('Automation workflow completed successfully', {
          totalSteps: result.totalSteps,
          successfulSteps: result.successfulSteps,
          failedSteps: result.failedSteps,
          duration: `${result.duration}ms`,
        });
      } else {
        logger.error('Automation workflow failed', {
          error: result.error,
          totalSteps: result.totalSteps,
          successfulSteps: result.successfulSteps,
          failedSteps: result.failedSteps,
          duration: `${result.duration}ms`,
        });
        process.exit(1);
      }

      return result;

    } catch (error) {
      logger.error('Automation workflow execution failed', { error: error.message });
      process.exit(1);
    }
  }
}

// Run automation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const automation = new RefactoredAutomation();
  automation.run().catch(error => {
    logger.error('Failed to run automation', { error: error.message });
    process.exit(1);
  });
}

export default RefactoredAutomation;