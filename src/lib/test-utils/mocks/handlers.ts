/**
 * Mock Service Worker (MSW) handlers for API endpoints
 * Provides consistent test data and isolates tests from external dependencies
 */

import { http, HttpResponse } from 'msw';

// Mock data for consistent testing
const mockWhopUser = {
  id: 'test_user_123',
  email: 'test@example.com',
  name: 'Test User',
  username: 'testuser',
  profilePicture: undefined,
};

const mockConvexUser = {
  _id: 'convex_user_123',
  _creationTime: Date.now(),
  whopUserId: 'test_user_123',
  email: 'test@example.com',
  name: 'Test User',
  subscriptionTier: 'starter',
  creditsRemaining: 5,
  creditsUsedThisMonth: 0,
  lifetimeCreditsUsed: 0,
  onboardingCompleted: false,
  preferences: {
    autoSaveEnabled: true,
    emailNotifications: true,
  },
  limits: {
    apiRateLimit: 10,
    maxConcurrentJobs: 1,
    maxFileSize: 10,
  },
  metadata: {
    source: 'test',
  },
  createdAt: Date.now(),
  lastActiveAt: Date.now(),
  lastSyncedAt: Date.now(),
};

export const handlers = [
  // Mock Whop authentication endpoint
  http.get('/api/auth/whop', ({ request }) => {
    const url = new URL(request.url);
    const forceError = url.searchParams.get('forceError');

    if (forceError === 'unauthorized') {
      return HttpResponse.json(
        { error: 'Unauthorized', details: 'Invalid or missing token' },
        { status: 401 }
      );
    }

    if (forceError === 'server') {
      return HttpResponse.json(
        { error: 'Database error', details: 'Failed to sync user data' },
        { status: 500 }
      );
    }

    if (forceError === 'service_unavailable') {
      return HttpResponse.json(
        { error: 'Service temporarily unavailable', details: 'Backend services are recovering. Please try again in a moment.', retry_after: 30 },
        { status: 503 }
      );
    }

    // Default successful response
    return HttpResponse.json({
      whopUser: mockWhopUser,
      convexUser: mockConvexUser,
      isAuthenticated: true,
      source: 'test',
    });
  }),

  // Mock health check endpoint
  http.get('/api/health', () => {
    return HttpResponse.json({
      timestamp: new Date().toISOString(),
      overall_status: 'healthy',
      total_response_time_ms: 10,
      services: [
        {
          service: 'convex',
          status: 'healthy',
          response_time_ms: 5,
          details: 'Convex API accessible and functions deployed',
        },
        {
          service: 'whop',
          status: 'healthy',
          response_time_ms: 3,
          details: 'Whop API accessible and authenticated',
        },
        {
          service: 'auth_functions',
          status: 'healthy',
          response_time_ms: 2,
          details: 'Auth functions (syncWhopUser, getUserByWhopId) are available',
        },
      ],
      summary: {
        healthy: 3,
        degraded: 0,
        unhealthy: 0,
      },
    });
  }),

  // Mock diagnostic endpoint
  http.get('/api/debug/env', () => {
    return HttpResponse.json({
      timestamp: new Date().toISOString(),
      environment: 'test',
      services: {
        convex: {
          configured: true,
          issues: [],
          variables: {
            NEXT_PUBLIC_CONVEX_URL: {
              present: true,
              value: 'CONFIGURED',
            },
            CONVEX_DEPLOY_KEY: {
              present: true,
              value: 'SET',
            },
          },
        },
        whop: {
          configured: true,
          issues: [],
          variables: {
            NEXT_PUBLIC_WHOP_APP_ID: {
              present: true,
              value: 'CONFIGURED',
            },
            WHOP_API_KEY: {
              present: true,
              value: 'CONFIGURED',
            },
            WHOP_WEBHOOK_SECRET: {
              present: true,
              value: 'CONFIGURED',
            },
          },
        },
        other: {
          REPLICATE_API_TOKEN: {
            present: true,
            value: 'SET',
          },
          OPENAI_API_KEY: {
            present: true,
            value: 'SET',
          },
        },
      },
      recommendations: [],
      health: {
        status: 'healthy',
        critical_issues: 0,
        minor_issues: 0,
      },
      next_steps: ['Environment appears to be configured correctly'],
    });
  }),

  // Mock Convex operations (for when circuit breaker is bypassed in tests)
  http.post('https://*.convex.cloud/api/query', ({ request }) => {
    return HttpResponse.json({
      success: true,
      result: mockConvexUser,
    });
  }),

  http.post('https://*.convex.cloud/api/mutation', ({ request }) => {
    return HttpResponse.json({
      success: true,
      result: 'convex_user_123',
    });
  }),

  // Mock Whop API
  http.get('https://api.whop.com/api/v2/me', ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      id: 'test_whop_user',
      email: 'test@whop.com',
      username: 'testuser',
    });
  }),
];

// Error simulation handlers for testing failure scenarios
export const errorHandlers = [
  // Force auth endpoint to return various error states
  http.get('/api/auth/whop', ({ request }) => {
    return HttpResponse.json(
      { error: 'Database error', details: 'Simulated database failure for testing' },
      { status: 500 }
    );
  }),

  // Force health check to show degraded state
  http.get('/api/health', () => {
    return HttpResponse.json({
      timestamp: new Date().toISOString(),
      overall_status: 'degraded',
      total_response_time_ms: 150,
      services: [
        {
          service: 'convex',
          status: 'healthy',
          response_time_ms: 5,
          details: 'Convex API accessible and functions deployed',
        },
        {
          service: 'whop',
          status: 'unhealthy',
          response_time_ms: 145,
          details: 'Whop API authentication failed',
          error: 'HTTP 403: Forbidden',
        },
        {
          service: 'auth_functions',
          status: 'degraded',
          response_time_ms: 0,
          details: 'Auth module not found in Convex API',
        },
      ],
      summary: {
        healthy: 1,
        degraded: 1,
        unhealthy: 1,
      },
    });
  }),
];

export default handlers;