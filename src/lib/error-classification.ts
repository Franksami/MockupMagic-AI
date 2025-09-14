/**
 * Structured Error Classification System
 * Provides consistent error handling, logging, and user feedback across the application
 */

import { ConvexError } from 'convex/values';

// Error categories for systematic classification
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  NETWORK = 'network',
  DATABASE = 'database',
  EXTERNAL_SERVICE = 'external_service',
  RATE_LIMIT = 'rate_limit',
  TIMEOUT = 'timeout',
  CONFIGURATION = 'configuration',
  UNKNOWN = 'unknown',
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',           // Minor issues, graceful degradation possible
  MEDIUM = 'medium',     // Functionality impacted, user can work around
  HIGH = 'high',         // Major functionality broken, immediate attention needed
  CRITICAL = 'critical', // System down, emergency response required
}

// Error details interface
export interface ErrorDetails {
  category: ErrorCategory;
  severity: ErrorSeverity;
  httpStatus: number;
  userMessage: string;
  internalMessage: string;
  retryable: boolean;
  retryAfterMs?: number;
  requestId?: string;
  metadata?: Record<string, any>;
}

/**
 * Classify errors into structured categories with appropriate response handling
 */
export function classifyError(error: unknown, context?: string): ErrorDetails {
  const requestId = generateRequestId();

  // Handle ConvexError specifically
  if (error instanceof ConvexError) {
    return classifyConvexError(error, requestId);
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return classifyStandardError(error, requestId, context);
  }

  // Handle string errors
  if (typeof error === 'string') {
    return classifyStringError(error, requestId);
  }

  // Unknown error type
  return {
    category: ErrorCategory.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    httpStatus: 500,
    userMessage: 'An unexpected error occurred',
    internalMessage: `Unknown error type: ${typeof error}`,
    retryable: false,
    requestId,
    metadata: { originalError: error },
  };
}

/**
 * Classify Convex-specific errors
 */
function classifyConvexError(error: ConvexError, requestId: string): ErrorDetails {
  const data = error.data;
  const message = typeof data === 'string' ? data : (data?.message || 'Convex operation failed');

  // Check for specific Convex error types
  if (message.includes('Function not found') || message.includes('Unknown function')) {
    return {
      category: ErrorCategory.CONFIGURATION,
      severity: ErrorSeverity.HIGH,
      httpStatus: 500,
      userMessage: 'Service configuration error',
      internalMessage: `Convex function not found: ${message}`,
      retryable: false,
      requestId,
      metadata: { convexError: data },
    };
  }

  if (message.includes('validation') || message.includes('Invalid')) {
    return {
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.MEDIUM,
      httpStatus: 400,
      userMessage: 'Invalid request data',
      internalMessage: `Convex validation error: ${message}`,
      retryable: false,
      requestId,
      metadata: { convexError: data },
    };
  }

  if (message.includes('timeout') || message.includes('deadline')) {
    return {
      category: ErrorCategory.TIMEOUT,
      severity: ErrorSeverity.MEDIUM,
      httpStatus: 504,
      userMessage: 'Request timed out, please try again',
      internalMessage: `Convex timeout: ${message}`,
      retryable: true,
      retryAfterMs: 5000,
      requestId,
      metadata: { convexError: data },
    };
  }

  // Default Convex error classification
  return {
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.HIGH,
    httpStatus: 500,
    userMessage: 'Database operation failed',
    internalMessage: `Convex error: ${message}`,
    retryable: true,
    retryAfterMs: 10000,
    requestId,
    metadata: { convexError: data },
  };
}

/**
 * Classify standard JavaScript Error objects
 */
function classifyStandardError(error: Error, requestId: string, context?: string): ErrorDetails {
  const message = error.message.toLowerCase();

  // Authentication errors
  if (message.includes('unauthorized') || message.includes('invalid token') || message.includes('authentication')) {
    return {
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.MEDIUM,
      httpStatus: 401,
      userMessage: 'Authentication required',
      internalMessage: `Auth error: ${error.message}`,
      retryable: false,
      requestId,
      metadata: { context, stack: error.stack },
    };
  }

  // Authorization errors
  if (message.includes('forbidden') || message.includes('access denied') || message.includes('permission')) {
    return {
      category: ErrorCategory.AUTHORIZATION,
      severity: ErrorSeverity.MEDIUM,
      httpStatus: 403,
      userMessage: 'Access denied',
      internalMessage: `Authorization error: ${error.message}`,
      retryable: false,
      requestId,
      metadata: { context, stack: error.stack },
    };
  }

  // Network errors
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return {
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.MEDIUM,
      httpStatus: 502,
      userMessage: 'Network connectivity issue, please try again',
      internalMessage: `Network error: ${error.message}`,
      retryable: true,
      retryAfterMs: 3000,
      requestId,
      metadata: { context, stack: error.stack },
    };
  }

  // Timeout errors
  if (message.includes('timeout') || message.includes('deadline') || message.includes('aborted')) {
    return {
      category: ErrorCategory.TIMEOUT,
      severity: ErrorSeverity.MEDIUM,
      httpStatus: 504,
      userMessage: 'Request timed out, please try again',
      internalMessage: `Timeout error: ${error.message}`,
      retryable: true,
      retryAfterMs: 5000,
      requestId,
      metadata: { context, stack: error.stack },
    };
  }

  // Circuit breaker errors
  if (message.includes('circuit breaker') && message.includes('open')) {
    return {
      category: ErrorCategory.EXTERNAL_SERVICE,
      severity: ErrorSeverity.MEDIUM,
      httpStatus: 503,
      userMessage: 'Service temporarily unavailable',
      internalMessage: `Circuit breaker open: ${error.message}`,
      retryable: true,
      retryAfterMs: 30000, // 30 seconds
      requestId,
      metadata: { context, circuitBreakerStatus: 'OPEN' },
    };
  }

  // Configuration errors
  if (message.includes('not configured') || message.includes('missing') || message.includes('environment')) {
    return {
      category: ErrorCategory.CONFIGURATION,
      severity: ErrorSeverity.HIGH,
      httpStatus: 500,
      userMessage: 'Service configuration error',
      internalMessage: `Configuration error: ${error.message}`,
      retryable: false,
      requestId,
      metadata: { context, stack: error.stack },
    };
  }

  // Default error classification
  return {
    category: ErrorCategory.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    httpStatus: 500,
    userMessage: 'An unexpected error occurred',
    internalMessage: `Unclassified error: ${error.message}`,
    retryable: false,
    requestId,
    metadata: { context, stack: error.stack },
  };
}

/**
 * Classify string error messages
 */
function classifyStringError(errorString: string, requestId: string): ErrorDetails {
  const message = errorString.toLowerCase();

  if (message.includes('401') || message.includes('unauthorized')) {
    return {
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.MEDIUM,
      httpStatus: 401,
      userMessage: 'Authentication required',
      internalMessage: errorString,
      retryable: false,
      requestId,
    };
  }

  if (message.includes('403') || message.includes('forbidden')) {
    return {
      category: ErrorCategory.AUTHORIZATION,
      severity: ErrorSeverity.MEDIUM,
      httpStatus: 403,
      userMessage: 'Access denied',
      internalMessage: errorString,
      retryable: false,
      requestId,
    };
  }

  if (message.includes('timeout') || message.includes('504')) {
    return {
      category: ErrorCategory.TIMEOUT,
      severity: ErrorSeverity.MEDIUM,
      httpStatus: 504,
      userMessage: 'Request timed out, please try again',
      internalMessage: errorString,
      retryable: true,
      retryAfterMs: 5000,
      requestId,
    };
  }

  return {
    category: ErrorCategory.UNKNOWN,
    severity: ErrorSeverity.LOW,
    httpStatus: 500,
    userMessage: 'An error occurred',
    internalMessage: errorString,
    retryable: false,
    requestId,
  };
}

/**
 * Generate unique request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Log error with structured format for monitoring and debugging
 */
export function logStructuredError(
  errorDetails: ErrorDetails,
  operation: string,
  additionalContext?: Record<string, any>
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    requestId: errorDetails.requestId,
    operation,
    category: errorDetails.category,
    severity: errorDetails.severity,
    httpStatus: errorDetails.httpStatus,
    userMessage: errorDetails.userMessage,
    internalMessage: errorDetails.internalMessage,
    retryable: errorDetails.retryable,
    retryAfterMs: errorDetails.retryAfterMs,
    metadata: {
      ...errorDetails.metadata,
      ...additionalContext,
    },
  };

  // Log based on severity level
  switch (errorDetails.severity) {
    case ErrorSeverity.CRITICAL:
      console.error('[CRITICAL ERROR]', logEntry);
      break;
    case ErrorSeverity.HIGH:
      console.error('[HIGH ERROR]', logEntry);
      break;
    case ErrorSeverity.MEDIUM:
      console.warn('[MEDIUM ERROR]', logEntry);
      break;
    case ErrorSeverity.LOW:
      console.log('[LOW ERROR]', logEntry);
      break;
  }
}

/**
 * Create standardized error response for HTTP endpoints
 */
export function createErrorResponse(errorDetails: ErrorDetails): Response {
  const responseBody = {
    error: errorDetails.userMessage,
    details: process.env.NODE_ENV === 'development' ? errorDetails.internalMessage : undefined,
    requestId: errorDetails.requestId,
    retryable: errorDetails.retryable,
    retryAfter: errorDetails.retryAfterMs ? Math.ceil(errorDetails.retryAfterMs / 1000) : undefined,
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (errorDetails.retryAfterMs) {
    headers['Retry-After'] = Math.ceil(errorDetails.retryAfterMs / 1000).toString();
  }

  return new Response(JSON.stringify(responseBody), {
    status: errorDetails.httpStatus,
    headers,
  });
}

/**
 * Error analysis for monitoring and alerting
 */
export class ErrorAnalyzer {
  private static errorCounts = new Map<string, number>();
  private static lastReset = Date.now();
  private static readonly RESET_INTERVAL = 60000; // 1 minute

  static recordError(errorDetails: ErrorDetails, operation: string): void {
    // Reset counters periodically
    const now = Date.now();
    if (now - this.lastReset > this.RESET_INTERVAL) {
      this.errorCounts.clear();
      this.lastReset = now;
    }

    // Count errors by category and operation
    const key = `${operation}:${errorDetails.category}`;
    this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1);

    // Log structured error
    logStructuredError(errorDetails, operation);

    // Check for error rate spikes
    this.checkErrorSpikes(operation, errorDetails.category);
  }

  private static checkErrorSpikes(operation: string, category: ErrorCategory): void {
    const key = `${operation}:${category}`;
    const count = this.errorCounts.get(key) || 0;

    // Alert thresholds
    const thresholds = {
      [ErrorCategory.AUTHENTICATION]: 10,
      [ErrorCategory.DATABASE]: 5,
      [ErrorCategory.NETWORK]: 15,
      [ErrorCategory.TIMEOUT]: 8,
      [ErrorCategory.EXTERNAL_SERVICE]: 12,
    };

    const threshold = thresholds[category] || 20;

    if (count >= threshold) {
      console.error(`[ALERT] Error spike detected: ${key} (${count} errors in ${this.RESET_INTERVAL/1000}s)`);

      // In production, this would trigger alerting systems
      if (process.env.NODE_ENV === 'production') {
        // TODO: Integrate with monitoring service (Sentry, DataDog, etc.)
        // await alertingService.sendAlert({
        //   operation,
        //   category,
        //   count,
        //   severity: 'high'
        // });
      }
    }
  }

  static getErrorStats(): Record<string, number> {
    return Object.fromEntries(this.errorCounts);
  }

  static resetStats(): void {
    this.errorCounts.clear();
    this.lastReset = Date.now();
  }
}

/**
 * Higher-order function for consistent error handling in API routes
 */
export function withErrorHandling<T extends any[], R>(
  operation: string,
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args);
    } catch (error) {
      const errorDetails = classifyError(error, operation);
      ErrorAnalyzer.recordError(errorDetails, operation);
      throw error; // Re-throw for caller to handle
    }
  };
}

/**
 * Error recovery strategies based on error classification
 */
export class ErrorRecoveryStrategy {
  static shouldRetry(errorDetails: ErrorDetails, attemptCount: number, maxAttempts: number = 3): boolean {
    if (attemptCount >= maxAttempts) {
      return false;
    }

    if (!errorDetails.retryable) {
      return false;
    }

    // Don't retry certain error categories
    const nonRetryableCategories = [
      ErrorCategory.AUTHENTICATION,
      ErrorCategory.AUTHORIZATION,
      ErrorCategory.VALIDATION,
      ErrorCategory.CONFIGURATION,
    ];

    return !nonRetryableCategories.includes(errorDetails.category);
  }

  static calculateBackoffMs(
    attemptCount: number,
    initialDelayMs: number = 1000,
    maxDelayMs: number = 30000,
    base: number = 2
  ): number {
    const delay = initialDelayMs * Math.pow(base, attemptCount - 1);
    const jitter = Math.random() * 0.1 * delay; // Add 10% jitter
    return Math.min(delay + jitter, maxDelayMs);
  }

  static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Retry wrapper function with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    base?: number;
    operationName?: string;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    base = 2,
    operationName = 'unknown',
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await operation();

      // Log successful retry if it wasn't the first attempt
      if (attempt > 1) {
        console.info(`[RETRY SUCCESS] ${operationName} succeeded on attempt ${attempt}/${maxAttempts}`);
      }

      return result;
    } catch (error) {
      lastError = error;
      const errorDetails = classifyError(error, operationName);

      // Check if we should retry
      if (!ErrorRecoveryStrategy.shouldRetry(errorDetails, attempt, maxAttempts)) {
        console.warn(`[RETRY STOPPED] ${operationName} failed on attempt ${attempt}/${maxAttempts} - not retryable`);
        break;
      }

      if (attempt === maxAttempts) {
        console.error(`[RETRY EXHAUSTED] ${operationName} failed all ${maxAttempts} attempts`);
        break;
      }

      // Calculate backoff delay
      const delayMs = ErrorRecoveryStrategy.calculateBackoffMs(attempt, initialDelayMs, maxDelayMs, base);

      console.warn(`[RETRY] ${operationName} attempt ${attempt}/${maxAttempts} failed, retrying in ${delayMs}ms:`, errorDetails.internalMessage);

      // Record error for monitoring
      ErrorAnalyzer.recordError(errorDetails, operationName);

      // Wait before retry
      await ErrorRecoveryStrategy.delay(delayMs);
    }
  }

  // All retries exhausted, throw the last error
  throw lastError;
}

/**
 * Error context for debugging and support
 */
export interface ErrorContext {
  operation: string;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  ip?: string;
  timestamp: string;
  environment: string;
  version?: string;
}

/**
 * Create error context for enhanced debugging
 */
export function createErrorContext(
  operation: string,
  request?: Request,
  additionalContext?: Record<string, any>
): ErrorContext {
  return {
    operation,
    userId: additionalContext?.userId,
    sessionId: additionalContext?.sessionId,
    userAgent: request?.headers.get('user-agent') || undefined,
    ip: request?.headers.get('x-forwarded-for') ||
        request?.headers.get('x-real-ip') ||
        'unknown',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    version: process.env.npm_package_version,
    ...additionalContext,
  };
}