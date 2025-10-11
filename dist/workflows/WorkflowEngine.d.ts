export class WorkflowStep {
    constructor(name: any, executeFn: any, options?: {});
    name: any;
    executeFn: any;
    options: {
        retries: number;
        timeout: number;
        continueOnError: boolean;
    };
    execute(state: any): Promise<{
        success: boolean;
        result: any;
        duration: number;
        step: any;
        error?: never;
    } | {
        success: boolean;
        error: Object;
        duration: number;
        step: any;
        result?: never;
    }>;
    executeWithTimeout(state: any): Promise<any>;
}
export class WorkflowEngine {
    steps: any[];
    state: Map<any, any>;
    results: any[];
    isRunning: boolean;
    /**
     * Add a step to the workflow
     * @param {WorkflowStep|Object} step - Step to add
     * @returns {WorkflowEngine} This instance for chaining
     */
    addStep(step: WorkflowStep | Object): WorkflowEngine;
    /**
     * Set a value in the workflow state
     * @param {string} key - State key
     * @param {*} value - State value
     * @returns {WorkflowEngine} This instance for chaining
     */
    setState(key: string, value: any): WorkflowEngine;
    /**
     * Get a value from the workflow state
     * @param {string} key - State key
     * @returns {*} State value
     */
    getState(key: string): any;
    /**
     * Execute all workflow steps
     * @param {Object} initialState - Initial state values
     * @returns {Object} Execution results
     */
    execute(initialState?: Object): Object;
    /**
     * Get workflow statistics
     * @returns {Object} Workflow statistics
     */
    getStats(): Object;
    /**
     * Clear workflow state and results
     */
    clear(): void;
    /**
     * Get step by name
     * @param {string} name - Step name
     * @returns {WorkflowStep|undefined} Step instance
     */
    getStep(name: string): WorkflowStep | undefined;
    /**
     * Remove step by name
     * @param {string} name - Step name
     * @returns {boolean} True if step was removed
     */
    removeStep(name: string): boolean;
}
export default WorkflowEngine;
//# sourceMappingURL=WorkflowEngine.d.ts.map