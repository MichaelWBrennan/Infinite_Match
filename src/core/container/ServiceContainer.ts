/**
 * Service Container for Dependency Injection
 * Centralized service management and dependency resolution
 */

import { Logger } from '../logger/index.js';

const logger = new Logger('ServiceContainer');

export interface ServiceDefinition<T = any> {
  factory: (container: ServiceContainer) => T;
  singleton: boolean;
}

export class ServiceContainer {
  private services = new Map<string, ServiceDefinition>();
  private singletons = new Map<string, any>();

  /**
   * Register a service factory
   */
  register<T>(name: string, factory: (container: ServiceContainer) => T, singleton: boolean = false): void {
    this.services.set(name, { factory, singleton });
    logger.debug(`Registered service: ${name} (singleton: ${singleton})`);
  }

  /**
   * Register a service instance
   */
  registerInstance<T>(name: string, instance: T): void {
    this.singletons.set(name, instance);
    logger.debug(`Registered service instance: ${name}`);
  }

  /**
   * Get a service instance
   */
  get<T>(name: string): T {
    // Check if it's a registered instance first
    if (this.singletons.has(name)) {
      return this.singletons.get(name) as T;
    }

    const service = this.services.get(name);
    if (!service) {
      throw new Error(
        `Service '${name}' not found. Available services: ${Array.from(this.services.keys()).join(', ')}`
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
            error: (error as Error).message,
          });
          throw error;
        }
      }
      return this.singletons.get(name) as T;
    }

    try {
      return service.factory(this) as T;
    } catch (error) {
      logger.error(`Failed to create service ${name}`, {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Check if a service is registered
   */
  has(name: string): boolean {
    return this.services.has(name) || this.singletons.has(name);
  }

  /**
   * Clear all services (useful for testing)
   */
  clear(): void {
    this.services.clear();
    this.singletons.clear();
    logger.debug('Cleared all services');
  }

  /**
   * Get all registered service names
   */
  getServiceNames(): string[] {
    return Array.from(this.services.keys());
  }
}

// Create and export a default container instance
export const container = new ServiceContainer();
export default container;