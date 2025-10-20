/**
 * Service Container for Dependency Injection
 * Centralized service management and dependency resolution
 */
export interface ServiceDefinition<T = any> {
    factory: (container: ServiceContainer) => T;
    singleton: boolean;
}
export declare class ServiceContainer {
    private services;
    private singletons;
    /**
     * Register a service factory
     */
    register<T>(name: string, factory: (container: ServiceContainer) => T, singleton?: boolean): void;
    /**
     * Register a service instance
     */
    registerInstance<T>(name: string, instance: T): void;
    /**
     * Get a service instance
     */
    get<T>(name: string): T;
    /**
     * Check if a service is registered
     */
    has(name: string): boolean;
    /**
     * Clear all services (useful for testing)
     */
    clear(): void;
    /**
     * Get all registered service names
     */
    getServiceNames(): string[];
}
export declare const container: ServiceContainer;
export default container;
//# sourceMappingURL=ServiceContainer.d.ts.map