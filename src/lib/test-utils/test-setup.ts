/**
 * Test setup utilities for MSW and test environment configuration
 */

import { handlers, errorHandlers } from './mocks/handlers';
import { server } from './mocks/server';

// Environment detection
export const isNode = typeof window === 'undefined';
export const isBrowser = typeof window !== 'undefined';

// Test scenario configurations
export interface TestScenario {
  name: string;
  description: string;
  handlers: any[];
}

export const testScenarios: Record<string, TestScenario> = {
  success: {
    name: 'success',
    description: 'All services working correctly',
    handlers: handlers,
  },
  authFailure: {
    name: 'authFailure',
    description: 'Authentication failures and errors',
    handlers: errorHandlers,
  },
  serviceDown: {
    name: 'serviceDown',
    description: 'External services temporarily unavailable',
    handlers: [
      ...errorHandlers,
      // Additional handlers for complete service outage
    ],
  },
};

/**
 * Setup MSW for tests with specific scenario
 */
export function setupTestScenario(scenarioName: keyof typeof testScenarios = 'success') {
  const scenario = testScenarios[scenarioName];

  if (!scenario) {
    throw new Error(`Unknown test scenario: ${scenarioName}`);
  }

  if (isNode) {
    // Reset and apply new handlers for Node.js tests
    server.resetHandlers(...scenario.handlers);
  } else {
    // For browser tests, we'll need to import the worker dynamically
    console.warn('Browser MSW scenario switching should be done through worker.use()');
  }

  return scenario;
}

/**
 * Mock fetch responses for direct API testing
 */
export function mockFetch(mockImplementation?: jest.MockedFunction<typeof fetch>) {
  if (typeof global !== 'undefined') {
    global.fetch = mockImplementation || jest.fn();
  }
}

/**
 * Reset all mocks and handlers
 */
export function resetTestEnvironment() {
  if (isNode) {
    server.resetHandlers();
  }

  // Reset any global mocks
  if (typeof jest !== 'undefined') {
    jest.resetAllMocks();
    jest.clearAllMocks();
  }
}

/**
 * Test data factories for consistent test data
 */
export const testData = {
  whopUser: {
    valid: {
      id: 'test_user_123',
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
    },
    invalid: {
      id: '',
      email: 'invalid-email',
      name: '',
      username: '',
    },
  },

  convexUser: {
    starter: {
      _id: 'convex_user_123',
      whopUserId: 'test_user_123',
      email: 'test@example.com',
      name: 'Test User',
      subscriptionTier: 'starter',
      creditsRemaining: 5,
      creditsUsedThisMonth: 0,
      lifetimeCreditsUsed: 0,
      onboardingCompleted: false,
    },
    premium: {
      _id: 'convex_user_456',
      whopUserId: 'test_user_456',
      email: 'premium@example.com',
      name: 'Premium User',
      subscriptionTier: 'premium',
      creditsRemaining: 100,
      creditsUsedThisMonth: 25,
      lifetimeCreditsUsed: 500,
      onboardingCompleted: true,
    },
  },

  errors: {
    auth: {
      unauthorized: { error: 'Unauthorized', details: 'Invalid or missing token' },
      forbidden: { error: 'Forbidden', details: 'Access denied' },
      serverError: { error: 'Database error', details: 'Failed to sync user data' },
      serviceUnavailable: {
        error: 'Service temporarily unavailable',
        details: 'Backend services are recovering. Please try again in a moment.',
        retry_after: 30
      },
    },
  },
};

/**
 * Assertion helpers for common test patterns
 */
export const testAssertions = {
  expectAuthSuccess: (response: any) => {
    expect(response).toHaveProperty('whopUser');
    expect(response).toHaveProperty('isAuthenticated', true);
    expect(response.whopUser).toHaveProperty('id');
    expect(response.whopUser).toHaveProperty('email');
  },

  expectAuthFailure: (response: any, expectedStatus: number) => {
    expect(response).toHaveProperty('error');
    expect(response).not.toHaveProperty('whopUser');
    expect(response).not.toHaveProperty('isAuthenticated');
  },

  expectHealthy: (response: any) => {
    expect(response).toHaveProperty('overall_status', 'healthy');
    expect(response).toHaveProperty('services');
    expect(Array.isArray(response.services)).toBe(true);
  },

  expectDegraded: (response: any) => {
    expect(response.overall_status).toMatch(/degraded|unhealthy/);
    expect(response.summary.unhealthy + response.summary.degraded).toBeGreaterThan(0);
  },
};

/**
 * Test environment helpers
 */
export const testHelpers = {
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  retry: async (fn: () => Promise<any>, maxAttempts = 3, delay = 100) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error;
        }
        await testHelpers.waitFor(delay * attempt);
      }
    }
  },

  mockConsole: () => {
    const originalConsole = { ...console };
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
    return originalConsole;
  },

  restoreConsole: (originalConsole: any) => {
    Object.assign(console, originalConsole);
  },
};