/**
 * Service Registry
 * Registers all services with the container
 */

import { container } from '../container/ServiceContainer.js';
import { AppConfig } from '../config/index.js';
import DataLoader from '../../data/DataLoader.js';
import EconomyValidator from '../../data/validators/EconomyValidator.js';
import CacheManager from '../cache/CacheManager.js';
import EconomyService from '../../services/economy/EconomyService.js';
import HeadlessUnityService from '../../services/unity/headless-unity-service.js';

/**
 * Register all services with the container
 */
export function registerServices() {
  // Register core services
  container.register('dataLoader', () => new DataLoader(), true);
  container.register('economyValidator', () => new EconomyValidator(), true);
  container.register('cacheManager', () => new CacheManager(), true);

  // Register business services
  container.register(
    'economyService',
    (c) =>
      new EconomyService(c.get('dataLoader'), c.get('economyValidator'), c.get('cacheManager')),
    true,
  );

  container.register('unityService', (c) => new HeadlessUnityService(c.get('cacheManager')), true);

  // Register configuration
  container.registerInstance('config', AppConfig);
}

/**
 * Get a service from the container
 * @param {string} serviceName - Name of the service
 * @returns {*} Service instance
 */
export function getService(serviceName) {
  return container.get(serviceName);
}

/**
 * Check if a service is registered
 * @param {string} serviceName - Name of the service
 * @returns {boolean}
 */
export function hasService(serviceName) {
  return container.has(serviceName);
}

export default { registerServices, getService, hasService };
