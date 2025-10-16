/**
 * Service Container for Dependency Injection
 * Centralized service management and dependency resolution
 */

import { Logger } from '../logger/index.js';

const logger = new Logger('ServiceContainer');

export class ServiceContainer {
  constructor() {
    this.services = new Map();
    this.singletons = new Map();
    this.factories = new Map();
  }

  /**
   * Register a service factory
   * @param {string} name - Service name
   * @param {Function} factory - Factory function that creates the service
   * @param {boolean} singleton - Whether to create as singleton
   */
  register(name, factory, singleton = false) {
    this.services.set(name, { factory, singleton });
    logger.debug(`Registered service: ${name} (singleton: ${singleton})`);
  }

  /**
   * Register a service instance
   * @param {string} name - Service name
   * @param {*} instance - Service instance
   */
  registerInstance(name, instance) {
    this.singletons.set(name, instance);
    logger.debug(`Registered service instance: ${name}`);
  }

  /**
   * Get a service instance
   * @param {string} name - Service name
   * @returns {*} Service instance
   */
  get(name) {
    // Check if it's a registered instance first
    if (this.singletons.has(name)) {
      return this.singletons.get(name);
    }

    const service = this.services.get(name);
    if (!service) {
      throw new Error(
        `Service '${name}' not found. Available services: ${Array.from(this.services.keys()).join(', ')}`,
      );
    }

    if (service.singleton) {
      if (!this.singletons.has(name)) {
        try {
          const instance = service.factory(this);
          this.singletons.set(name, instance);
          logger.debug(`Created singleton instance: ${name}`);
        } catch (error) {
          logger.error(`Failed to create singleton ${name}`, {
            error: error.message,
          });
          throw error;
        }
      }
      return this.singletons.get(name);
    }

    try {
      return service.factory(this);
    } catch (error) {
      logger.error(`Failed to create service ${name}`, {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Check if a service is registered
   * @param {string} name - Service name
   * @returns {boolean}
   */
  has(name) {
    return this.services.has(name) || this.singletons.has(name);
  }

  /**
   * Clear all services (useful for testing)
   */
  clear() {
    this.services.clear();
    this.singletons.clear();
    this.factories.clear();
    logger.debug('Cleared all services');
  }

  /**
   * Get all registered service names
   * @returns {string[]}
   */
  getServiceNames() {
    return Array.from(this.services.keys());
  }
}

// Create and export a default container instance
export const container = new ServiceContainer();
export default container;
