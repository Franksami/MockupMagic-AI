/**
 * Jest/Vitest setup file for MSW integration
 * Add this to your test configuration: setupFilesAfterEnv: ['<rootDir>/src/lib/test-utils/jest-setup.ts']
 */

import { setupMSWServer, resetMSWServer, cleanupMSWServer } from './mocks/server';

// Establish API mocking before all tests
beforeAll(() => {
  setupMSWServer();
});

// Reset any request handlers after each test
afterEach(() => {
  resetMSWServer();
});

// Clean up after all tests
afterAll(() => {
  cleanupMSWServer();
});

// Global test environment setup
global.console = {
  ...console,
  // Suppress MSW console outputs during tests unless debugging
  log: process.env.DEBUG_TESTS ? console.log : jest.fn(),
  debug: process.env.DEBUG_TESTS ? console.debug : jest.fn(),
  info: process.env.DEBUG_TESTS ? console.info : jest.fn(),
  warn: console.warn, // Keep warnings
  error: console.error, // Keep errors
};