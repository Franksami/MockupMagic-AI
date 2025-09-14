/**
 * Convex Mock Provider for testing React components
 * Provides mocked Convex hooks and context without requiring real Convex backend
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { testData } from './test-setup';

// Mock Convex client interface
interface MockConvexClient {
  query: jest.MockedFunction<any>;
  mutation: jest.MockedFunction<any>;
  action: jest.MockedFunction<any>;
}

// Mock Convex context
interface MockConvexContext {
  client: MockConvexClient;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
}

const ConvexMockContext = createContext<MockConvexContext | null>(null);

// Mock Convex Provider component
interface ConvexMockProviderProps {
  children: ReactNode;
  mockData?: {
    user?: any;
    isLoading?: boolean;
    isAuthenticated?: boolean;
    error?: Error | null;
  };
  mockBehavior?: {
    queryDelay?: number;
    mutationDelay?: number;
    shouldFailQueries?: boolean;
    shouldFailMutations?: boolean;
  };
}

export function ConvexMockProvider({
  children,
  mockData = {},
  mockBehavior = {},
}: ConvexMockProviderProps) {
  const {
    user = testData.convexUser.starter,
    isLoading = false,
    isAuthenticated = true,
    error = null,
  } = mockData;

  const {
    queryDelay = 0,
    mutationDelay = 0,
    shouldFailQueries = false,
    shouldFailMutations = false,
  } = mockBehavior;

  // Create mock client with configurable behavior
  const mockClient: MockConvexClient = {
    query: jest.fn().mockImplementation(async (functionName: string, args?: any) => {
      if (queryDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, queryDelay));
      }

      if (shouldFailQueries) {
        throw new Error(`Mock query failure for ${functionName}`);
      }

      // Mock responses based on function name
      if (functionName.includes('getUserByWhopId')) {
        return user;
      }

      if (functionName.includes('getUserProjects')) {
        return [];
      }

      if (functionName.includes('getMockups')) {
        return [];
      }

      // Default response
      return null;
    }),

    mutation: jest.fn().mockImplementation(async (functionName: string, args?: any) => {
      if (mutationDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, mutationDelay));
      }

      if (shouldFailMutations) {
        throw new Error(`Mock mutation failure for ${functionName}`);
      }

      // Mock responses based on function name
      if (functionName.includes('syncWhopUser')) {
        return user._id;
      }

      if (functionName.includes('createProject')) {
        return 'mock_project_id';
      }

      if (functionName.includes('createMockup')) {
        return 'mock_mockup_id';
      }

      // Default response
      return 'mock_result';
    }),

    action: jest.fn().mockImplementation(async (functionName: string, args?: any) => {
      if (shouldFailMutations) {
        throw new Error(`Mock action failure for ${functionName}`);
      }

      return 'mock_action_result';
    }),
  };

  const contextValue: MockConvexContext = {
    client: mockClient,
    isLoading,
    isAuthenticated,
    error,
  };

  return (
    <ConvexMockContext.Provider value={contextValue}>
      {children}
    </ConvexMockContext.Provider>
  );
}

// Hook to access mock Convex context
export function useMockConvex(): MockConvexContext {
  const context = useContext(ConvexMockContext);
  if (!context) {
    throw new Error('useMockConvex must be used within a ConvexMockProvider');
  }
  return context;
}

// Mock implementations of Convex React hooks
export const mockConvexHooks = {
  useQuery: jest.fn().mockImplementation((functionName: string, args?: any) => {
    const context = useContext(ConvexMockContext);
    if (!context) {
      return undefined; // No provider, return undefined like real Convex
    }

    if (context.isLoading) {
      return undefined;
    }

    if (context.error) {
      throw context.error;
    }

    // Mock query results based on function name
    if (functionName.includes('getUserByWhopId')) {
      return testData.convexUser.starter;
    }

    if (functionName.includes('getUserProjects')) {
      return [];
    }

    if (functionName.includes('getMockups')) {
      return [];
    }

    return null;
  }),

  useMutation: jest.fn().mockImplementation((functionName: string) => {
    const context = useContext(ConvexMockContext);

    return jest.fn().mockImplementation(async (args?: any) => {
      if (!context) {
        throw new Error('No Convex provider');
      }

      return context.client.mutation(functionName, args);
    });
  }),

  useAction: jest.fn().mockImplementation((functionName: string) => {
    const context = useContext(ConvexMockContext);

    return jest.fn().mockImplementation(async (args?: any) => {
      if (!context) {
        throw new Error('No Convex provider');
      }

      return context.client.action(functionName, args);
    });
  }),
};

// Utility to create a test wrapper with ConvexMockProvider
export function createConvexTestWrapper(mockConfig?: {
  mockData?: ConvexMockProviderProps['mockData'];
  mockBehavior?: ConvexMockProviderProps['mockBehavior'];
}) {
  return function ConvexTestWrapper({ children }: { children: ReactNode }) {
    return (
      <ConvexMockProvider
        mockData={mockConfig?.mockData}
        mockBehavior={mockConfig?.mockBehavior}
      >
        {children}
      </ConvexMockProvider>
    );
  };
}

// Test scenarios for different Convex states
export const convexTestScenarios = {
  // Successful authentication and data loading
  authenticated: {
    mockData: {
      user: testData.convexUser.starter,
      isLoading: false,
      isAuthenticated: true,
      error: null,
    },
  },

  // Loading state
  loading: {
    mockData: {
      user: null,
      isLoading: true,
      isAuthenticated: false,
      error: null,
    },
  },

  // Authentication failed
  unauthenticated: {
    mockData: {
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    },
  },

  // Network/database error
  error: {
    mockData: {
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: new Error('Database connection failed'),
    },
  },

  // Premium user with full access
  premium: {
    mockData: {
      user: testData.convexUser.premium,
      isLoading: false,
      isAuthenticated: true,
      error: null,
    },
  },

  // Slow network simulation
  slowNetwork: {
    mockData: {
      user: testData.convexUser.starter,
      isLoading: false,
      isAuthenticated: true,
      error: null,
    },
    mockBehavior: {
      queryDelay: 1000,
      mutationDelay: 1500,
    },
  },

  // Service failures
  serviceFailure: {
    mockData: {
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    },
    mockBehavior: {
      shouldFailQueries: true,
      shouldFailMutations: true,
    },
  },
};

// Helper to wrap render functions with ConvexMockProvider
export function renderWithConvex(
  ui: React.ReactElement,
  scenario: keyof typeof convexTestScenarios = 'authenticated'
) {
  const config = convexTestScenarios[scenario];
  const Wrapper = createConvexTestWrapper(config);

  return {
    wrapper: Wrapper,
    ...config,
  };
}