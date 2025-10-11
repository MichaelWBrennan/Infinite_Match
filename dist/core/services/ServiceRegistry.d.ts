/**
 * Register all services with the container
 */
export function registerServices(): void;
/**
 * Get a service from the container
 * @param {string} serviceName - Name of the service
 * @returns {*} Service instance
 */
export function getService(serviceName: string): any;
/**
 * Check if a service is registered
 * @param {string} serviceName - Name of the service
 * @returns {boolean}
 */
export function hasService(serviceName: string): boolean;
declare namespace _default {
    export { registerServices };
    export { getService };
    export { hasService };
}
export default _default;
//# sourceMappingURL=ServiceRegistry.d.ts.map