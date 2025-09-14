'use client';

/**
 * Error Boundary Component
 * Provides graceful error handling with user-friendly messaging and recovery options
 */

import React, { Component, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { LiquidGlassCard, LiquidGlassButton } from './LiquidGlassContainer';
import { classifyError, type ErrorDetails } from '@/lib/error-classification';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorDetails: ErrorDetails | null;
  errorId: string | null;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: ErrorDetails, retryCount: number, onRetry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  maxRetries?: number;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorDetails: null,
      errorId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorDetails = classifyError(error, 'react_error_boundary');

    return {
      hasError: true,
      error,
      errorDetails,
      errorId: errorDetails.requestId,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for monitoring
    console.error('[ERROR BOUNDARY]', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to Sentry or other error tracking
      // Sentry.captureException(error, {
      //   contexts: {
      //     react: {
      //       componentStack: errorInfo.componentStack,
      //     },
      //   },
      // });
    }
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;

    if (this.state.retryCount >= maxRetries) {
      console.warn('[ERROR BOUNDARY] Maximum retries exceeded');
      return;
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorDetails: null,
      errorId: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportBug = () => {
    const { error, errorId } = this.state;
    const subject = encodeURIComponent(`Bug Report: ${error?.message || 'Unknown Error'}`);
    const body = encodeURIComponent(`
Error ID: ${errorId}
Error: ${error?.message || 'Unknown'}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
Timestamp: ${new Date().toISOString()}

Please describe what you were doing when this error occurred:

    `.trim());

    window.open(`mailto:support@mockupmagic.ai?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError && this.state.errorDetails) {
      const { fallback, maxRetries = 3 } = this.props;
      const { errorDetails, retryCount } = this.state;

      // Use custom fallback if provided
      if (fallback) {
        return fallback(errorDetails, retryCount, this.handleRetry);
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900/20 to-gray-900 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            <LiquidGlassCard
              variant="medium"
              glow
              className="p-6 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center"
              >
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </motion.div>

              <h2 className="text-xl font-semibold text-white mb-2">
                {this.getErrorTitle(errorDetails)}
              </h2>

              <p className="text-gray-300 mb-4">
                {errorDetails.userMessage}
              </p>

              {process.env.NODE_ENV === 'development' && (
                <div className="mb-4 p-3 bg-gray-800/50 rounded-lg text-left">
                  <p className="text-xs text-gray-400 mb-1">Error ID: {this.state.errorId}</p>
                  <p className="text-xs text-gray-400">
                    {errorDetails.internalMessage}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {errorDetails.retryable && retryCount < maxRetries && (
                  <LiquidGlassButton
                    onClick={this.handleRetry}
                    className="w-full py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again {retryCount > 0 && `(${retryCount}/${maxRetries})`}
                  </LiquidGlassButton>
                )}

                <div className="flex gap-2">
                  <LiquidGlassButton
                    onClick={this.handleGoHome}
                    className="flex-1 py-2 bg-gray-600 text-white font-medium"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </LiquidGlassButton>

                  <LiquidGlassButton
                    onClick={this.handleReportBug}
                    className="flex-1 py-2 bg-gray-600 text-white font-medium"
                  >
                    <Bug className="w-4 h-4 mr-2" />
                    Report Bug
                  </LiquidGlassButton>
                </div>
              </div>

              {retryCount >= maxRetries && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                >
                  <p className="text-sm text-red-300">
                    Maximum retry attempts reached. Please try refreshing the page or contact support.
                  </p>
                </motion.div>
              )}
            </LiquidGlassCard>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }

  private getErrorTitle(errorDetails: ErrorDetails): string {
    switch (errorDetails.category) {
      case 'authentication':
        return 'Authentication Required';
      case 'authorization':
        return 'Access Denied';
      case 'network':
        return 'Connection Issue';
      case 'timeout':
        return 'Request Timed Out';
      case 'external_service':
        return 'Service Temporarily Unavailable';
      case 'database':
        return 'Data Access Error';
      case 'configuration':
        return 'Configuration Error';
      case 'rate_limit':
        return 'Too Many Requests';
      case 'validation':
        return 'Invalid Input';
      default:
        return 'Something Went Wrong';
    }
  }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

/**
 * Hook for handling errors in functional components
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  // Throw error to be caught by Error Boundary
  if (error) {
    throw error;
  }

  return { handleError, clearError };
}