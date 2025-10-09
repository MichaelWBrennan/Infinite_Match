/**
 * Workflow Engine
 * Manages execution of workflow steps with state management
 */

import { Logger } from 'core/logger/index.js';
import { ErrorHandler } from 'core/errors/ErrorHandler.js';

const logger = new Logger('WorkflowEngine');

export class WorkflowStep {
  constructor(name, executeFn, options = {}) {
    this.name = name;
    this.executeFn = executeFn;
    this.options = {
      retries: 0,
      timeout: 30000,
      continueOnError: false,
      ...options,
    };
  }

  async execute(state) {
    const startTime = Date.now();
    logger.info(`Executing step: ${this.name}`);

    try {
      const result = await this.executeWithTimeout(state);
      const duration = Date.now() - startTime;

      logger.info(`Step completed: ${this.name} (${duration}ms)`);
      return {
        success: true,
        result,
        duration,
        step: this.name,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorInfo = ErrorHandler.handle(error, { step: this.name });

      logger.error(`Step failed: ${this.name}`, {
        error: errorInfo.message,
        duration,
      });

      return {
        success: false,
        error: errorInfo,
        duration,
        step: this.name,
      };
    }
  }

  async executeWithTimeout(state) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(
          new Error(
            `Step ${this.name} timed out after ${this.options.timeout}ms`
          )
        );
      }, this.options.timeout);

      this.executeFn(state)
        .then((result) => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }
}

export class WorkflowEngine {
  constructor() {
    this.steps = [];
    this.state = new Map();
    this.results = [];
    this.isRunning = false;
  }

  /**
   * Add a step to the workflow
   * @param {WorkflowStep|Object} step - Step to add
   * @returns {WorkflowEngine} This instance for chaining
   */
  addStep(step) {
    if (typeof step === 'object' && !(step instanceof WorkflowStep)) {
      step = new WorkflowStep(step.name, step.execute, step.options);
    }

    this.steps.push(step);
    logger.debug(`Added step: ${step.name}`);
    return this;
  }

  /**
   * Set a value in the workflow state
   * @param {string} key - State key
   * @param {*} value - State value
   * @returns {WorkflowEngine} This instance for chaining
   */
  setState(key, value) {
    this.state.set(key, value);
    return this;
  }

  /**
   * Get a value from the workflow state
   * @param {string} key - State key
   * @returns {*} State value
   */
  getState(key) {
    return this.state.get(key);
  }

  /**
   * Execute all workflow steps
   * @param {Object} initialState - Initial state values
   * @returns {Object} Execution results
   */
  async execute(initialState = {}) {
    if (this.isRunning) {
      throw new Error('Workflow is already running');
    }

    this.isRunning = true;
    this.results = [];

    // Set initial state
    for (const [key, value] of Object.entries(initialState)) {
      this.setState(key, value);
    }

    logger.info(`Starting workflow with ${this.steps.length} steps`);

    const startTime = Date.now();
    let successCount = 0;
    let failureCount = 0;

    try {
      for (let i = 0; i < this.steps.length; i++) {
        const step = this.steps[i];
        const stepResult = await step.execute(this.state);

        this.results.push(stepResult);

        if (stepResult.success) {
          successCount++;
        } else {
          failureCount++;

          if (!step.options.continueOnError) {
            logger.error(`Workflow stopped due to step failure: ${step.name}`);
            break;
          }
        }
      }

      const totalDuration = Date.now() - startTime;
      const overallSuccess = failureCount === 0;

      const summary = {
        success: overallSuccess,
        totalSteps: this.steps.length,
        successfulSteps: successCount,
        failedSteps: failureCount,
        duration: totalDuration,
        results: this.results,
      };

      logger.info('Workflow completed', summary);
      return summary;
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      logger.error('Workflow execution failed', {
        error: error.message,
        duration: totalDuration,
      });

      return {
        success: false,
        error: error.message,
        totalSteps: this.steps.length,
        successfulSteps: successCount,
        failedSteps: failureCount + 1,
        duration: totalDuration,
        results: this.results,
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get workflow statistics
   * @returns {Object} Workflow statistics
   */
  getStats() {
    const totalDuration = this.results.reduce(
      (sum, result) => sum + result.duration,
      0
    );
    const successRate =
      this.results.length > 0
        ? (
          (this.results.filter((r) => r.success).length /
              this.results.length) *
            100
        ).toFixed(2)
        : 0;

    return {
      totalSteps: this.steps.length,
      executedSteps: this.results.length,
      successRate: `${successRate}%`,
      totalDuration: `${totalDuration}ms`,
      averageStepDuration:
        this.results.length > 0
          ? `${Math.round(totalDuration / this.results.length)}ms`
          : '0ms',
    };
  }

  /**
   * Clear workflow state and results
   */
  clear() {
    this.steps = [];
    this.state.clear();
    this.results = [];
    this.isRunning = false;
    logger.debug('Workflow cleared');
  }

  /**
   * Get step by name
   * @param {string} name - Step name
   * @returns {WorkflowStep|undefined} Step instance
   */
  getStep(name) {
    return this.steps.find((step) => step.name === name);
  }

  /**
   * Remove step by name
   * @param {string} name - Step name
   * @returns {boolean} True if step was removed
   */
  removeStep(name) {
    const index = this.steps.findIndex((step) => step.name === name);
    if (index !== -1) {
      this.steps.splice(index, 1);
      logger.debug(`Removed step: ${name}`);
      return true;
    }
    return false;
  }
}

export default WorkflowEngine;
