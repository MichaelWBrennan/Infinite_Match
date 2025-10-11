/**
 * Jest Test Setup
 * Global test configuration and utilities
 */

import { jest } from '@jest/globals';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-testing-only';
process.env.UNITY_PROJECT_ID = 'test-project-id';
process.env.UNITY_ENV_ID = 'test-env-id';
process.env.UNITY_CLIENT_ID = 'test-client-id';
process.env.UNITY_CLIENT_SECRET = process.env.UNITY_CLIENT_SECRET || 'test-client-secret-for-testing-only';

// Global test timeout
jest.setTimeout(10000);
