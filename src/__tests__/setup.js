/**
 * Jest Test Setup
 * Global test configuration and utilities
 */

import { jest } from '@jest/globals';
import os from 'os';
import path from 'path';

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
process.env.UNITY_CLIENT_SECRET =
  process.env.UNITY_CLIENT_SECRET || 'test-client-secret-for-testing-only';

// Social state goes to a temp file, never the working tree. A test file may set its own.
process.env.SOCIAL_STORE_FILE =
  process.env.SOCIAL_STORE_FILE || path.join(os.tmpdir(), `social-test-${process.pid}.json`);

// Global test timeout
jest.setTimeout(10000);
