'use client';

/**
 * API Error Handling Hook
 * Provides consistent error handling for API calls with toast notifications
 */

import { useCallback } from 'react';
import { useToast } from '@/components/ui/Toast';
import { classifyError, type ErrorDetails } from '@/lib/error-classification';
import { retryAuthOperation, retryConvexOperation, retryWhopOperation } from '@/lib/retry-utils';

interface UseApiErrorOptions {
  showToast?: boolean;
  retryEnabled?: boolean;
  operation?: string;
}

export function useApiError(options: UseApiErrorOptions = {}) {
  const { addErrorToast, addSuccessToast, addWarningToast } = useToast();
  const { showToast = true, retryEnabled = true, operation = 'api_call' } = options;

  const handleError = useCallback(async (
    error: unknown,
    retryFn?: () => Promise<any>,
    context?: string
  ): Promise<{ success: boolean; data?: any; error?: ErrorDetails }> => {
    const errorDetails = classifyError(error, context || operation);

    // Log error for monitoring
    console.error(`[API ERROR] ${operation}:`, {
      category: errorDetails.category,
      message: errorDetails.internalMessage,
      requestId: errorDetails.requestId,
    });

    // Show toast notification
    if (showToast) {
      const toastId = addErrorToast(
        errorDetails,
        retryEnabled && retryFn ? retryFn : undefined
      );
    }

    return {
      success: false,
      error: errorDetails,
    };
  }, [addErrorToast, showToast, retryEnabled, operation]);

  const handleSuccess = useCallback((message?: string, data?: any) => {
    if (showToast && message) {
      addSuccessToast('Success', message);
    }

    return {
      success: true,
      data,
    };
  }, [addSuccessToast, showToast]);

  const handleWarning = useCallback((message: string, data?: any) => {
    if (showToast) {
      addWarningToast('Warning', message);
    }

    return {
      success: true,
      data,
      warning: message,
    };
  }, [addWarningToast, showToast]);

  const withErrorHandling = useCallback(<T>(
    apiCall: () => Promise<T>,
    retryType: 'auth' | 'convex' | 'whop' | 'standard' = 'standard'
  ) => {
    return async (): Promise<{ success: boolean; data?: T; error?: ErrorDetails }> => {
      try {
        let result: T;

        // Apply appropriate retry strategy
        switch (retryType) {
          case 'auth':
            result = await retryAuthOperation(apiCall, operation);
            break;
          case 'convex':
            result = await retryConvexOperation(apiCall, operation);
            break;
          case 'whop':
            result = await retryWhopOperation(apiCall, operation);
            break;
          default:
            result = await apiCall();
            break;
        }

        return handleSuccess(undefined, result);
      } catch (error) {
        return handleError(error, retryEnabled ? apiCall : undefined);
      }
    };
  }, [handleError, handleSuccess, retryEnabled, operation]);

  return {
    handleError,
    handleSuccess,
    handleWarning,
    withErrorHandling,
  };
}

/**
 * Specialized hooks for different types of API operations
 */

export function useAuthApi() {
  return useApiError({
    operation: 'authentication',
    retryEnabled: true,
    showToast: true,
  });
}

export function useConvexApi() {
  return useApiError({
    operation: 'convex_operation',
    retryEnabled: true,
    showToast: true,
  });
}

export function useWhopApi() {
  return useApiError({
    operation: 'whop_api',
    retryEnabled: true,
    showToast: true,
  });
}

export function useFileApi() {
  return useApiError({
    operation: 'file_operation',
    retryEnabled: true,
    showToast: true,
  });
}

/**
 * API response wrapper that includes error handling
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
  requestId?: string;
  retryable?: boolean;
  retryAfter?: number;
}

/**
 * Hook for making API calls with automatic error handling
 */
export function useApiCall<T = any>(endpoint: string, options: RequestInit = {}) {
  const { withErrorHandling } = useApiError({
    operation: `api_${endpoint.replace(/\//g, '_')}`,
  });

  const makeRequest = useCallback(async (
    requestOptions?: RequestInit
  ): Promise<{ success: boolean; data?: T; error?: ErrorDetails }> => {
    const apiCall = async (): Promise<T> => {
      const response = await fetch(endpoint, {
        ...options,
        ...requestOptions,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
          ...requestOptions?.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        (error as any).status = response.status;
        (error as any).response = errorData;
        throw error;
      }

      return response.json();
    };

    return withErrorHandling(apiCall)();
  }, [endpoint, options, withErrorHandling]);

  return makeRequest;
}

/**
 * Utility function to show service status toasts
 */
export function useServiceStatus() {
  const { addWarningToast, addInfoToast, addSuccessToast } = useToast();

  const showServiceRecovery = useCallback((serviceName: string) => {
    addSuccessToast(
      'Service Restored',
      `${serviceName} is back online and working normally.`
    );
  }, [addSuccessToast]);

  const showServiceDegradation = useCallback((serviceName: string, details?: string) => {
    addWarningToast(
      'Service Issue',
      `${serviceName} is experiencing issues. ${details || 'Some features may be temporarily unavailable.'}`
    );
  }, [addWarningToast]);

  const showMaintenanceMode = useCallback((serviceName: string, estimatedTime?: string) => {
    addInfoToast(
      'Scheduled Maintenance',
      `${serviceName} is undergoing maintenance. ${estimatedTime ? `Expected completion: ${estimatedTime}` : 'Service will be restored shortly.'}`
    );
  }, [addInfoToast]);

  return {
    showServiceRecovery,
    showServiceDegradation,
    showMaintenanceMode,
  };
}