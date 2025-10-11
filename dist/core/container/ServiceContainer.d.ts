export class ServiceContainer {
    services: Map<any, any>;
    singletons: Map<any, any>;
    factories: Map<any, any>;
    /**
     * Register a service factory
     * @param {string} name - Service name
     * @param {Function} factory - Factory function that creates the service
     * @param {boolean} singleton - Whether to create as singleton
     */
    register(name: string, factory: Function, singleton?: boolean): void;
    /**
     * Register a service instance
     * @param {string} name - Service name
     * @param {*} instance - Service instance
     */
    registerInstance(name: string, instance: any): void;
    /**
     * Get a service instance
     * @param {string} name - Service name
     * @returns {*} Service instance
     */
    get(name: string): any;
    /**
     * Check if a service is registered
     * @param {string} name - Service name
     * @returns {boolean}
     */
    has(name: string): boolean;
    /**
     * Clear all services (useful for testing)
     */
    clear(): void;
    /**
     * Get all registered service names
     * @returns {string[]}
     */
    getServiceNames(): string[];
}
export const container: ServiceContainer;
export default container;
//# sourceMappingURL=ServiceContainer.d.ts.map