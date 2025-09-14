/**
 * Retry Utilities with Exponential Backoff
 * Based on Convex Action Retrier patterns and industry best practices
 */

import { classifyError, ErrorAnalyzer, ErrorRecoveryStrategy, type ErrorDetails } from './error-classification';

// Retry configuration interface
export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  base: number;
  jitterPercent: number;
  timeoutMs: number;
  operationName: string;
}

// Default retry configurations for different operation types
export const RetryProfiles = {
  // Fast operations (API calls, database queries)
  fast: {
    maxAttempts: 3,
    initialDelayMs: 250,
    maxDelayMs: 5000,
    base: 2,
    jitterPercent: 0.1,
    timeoutMs: 5000,
  } as Partial<RetryConfig>,

  // Standard operations (file uploads, data processing)
  standard: {
    maxAttempts: 4,
    initialDelayMs: 1000,
    maxDelayMs: 15000,
    base: 2,
    jitterPercent: 0.2,
    timeoutMs: 30000,
  } as Partial<RetryConfig>,

  // Slow operations (AI generation, complex processing)
  slow: {
    maxAttempts: 5,
    initialDelayMs: 2000,
    maxDelayMs: 60000,
    base: 1.5,
    jitterPercent: 0.3,
    timeoutMs: 120000,
  } as Partial<RetryConfig>,

  // Critical operations (authentication, payments)
  critical: {
    maxAttempts: 6,
    initialDelayMs: 500,
    maxDelayMs: 30000,
    base: 2.5,
    jitterPercent: 0.15,
    timeoutMs: 10000,
  } as Partial<RetryConfig>,
} as const;

/**
 * Enhanced retry function with comprehensive error handling and monitoring
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> & { operationName: string }
): Promise<T> {
  const fullConfig: RetryConfig = {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    base: 2,
    jitterPercent: 0.1,
    timeoutMs: 30000,
    ...config,
  };

  let lastError: unknown;
  let errorDetails: ErrorDetails | null = null;

  for (let attempt = 1; attempt <= fullConfig.maxAttempts; attempt++) {
    try {
      // Execute operation with timeout
      const result = await executeWithTimeout(operation, fullConfig.timeoutMs);

      // Log successful retry if it wasn't the first attempt
      if (attempt > 1) {
        console.info(`[RETRY SUCCESS] ${fullConfig.operationName} succeeded on attempt ${attempt}/${fullConfig.maxAttempts}`);
      }

      return result;
    } catch (error) {
      lastError = error;
      errorDetails = classifyError(error, fullConfig.operationName);

      // Record error for monitoring
      ErrorAnalyzer.recordError(errorDetails, fullConfig.operationName);

      // Check if we should retry
      if (!ErrorRecoveryStrategy.shouldRetry(errorDetails, attempt, fullConfig.maxAttempts)) {
        console.warn(`[RETRY STOPPED] ${fullConfig.operationName} failed on attempt ${attempt}/${fullConfig.maxAttempts} - not retryable (${errorDetails.category})`);
        break;
      }

      if (attempt === fullConfig.maxAttempts) {
        console.error(`[RETRY EXHAUSTED] ${fullConfig.operationName} failed all ${fullConfig.maxAttempts} attempts`);
        break;
      }

      // Calculate backoff delay with jitter
      const baseDelay = fullConfig.initialDelayMs * Math.pow(fullConfig.base, attempt - 1);
      const jitter = baseDelay * fullConfig.jitterPercent * (Math.random() - 0.5);
      const delayMs = Math.min(baseDelay + jitter, fullConfig.maxDelayMs);

      console.warn(
        `[RETRY] ${fullConfig.operationName} attempt ${attempt}/${fullConfig.maxAttempts} failed (${errorDetails.category}), retrying in ${Math.round(delayMs)}ms:`,
        errorDetails.internalMessage
      );

      // Wait before retry
      await ErrorRecoveryStrategy.delay(delayMs);
    }
  }

  // All retries exhausted, throw the last error with enhanced context
  if (errorDetails) {
    const enhancedError = new Error(
      `${fullConfig.operationName} failed after ${fullConfig.maxAttempts} attempts: ${errorDetails.internalMessage}`
    );
    (enhancedError as any).originalError = lastError;
    (enhancedError as any).errorDetails = errorDetails;
    (enhancedError as any).attempts = fullConfig.maxAttempts;
    throw enhancedError;
  }

  throw lastError;
}

/**
 * Execute operation with timeout
 */
async function executeWithTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    operation()
      .then((result) => {
        clearTimeout(timeout);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

/**
 * Convex-specific retry wrapper following official patterns
 */
export async function retryConvexOperation<T>(
  operation: () => Promise<T>,
  operationName: string = 'convex_operation'
): Promise<T> {
  return retryOperation(operation, {
    ...RetryProfiles.fast,
    operationName,
    maxAttempts: 4, // Following Convex Action Retrier default
    initialDelayMs: 250, // Following Convex Action Retrier default
    base: 2, // Following Convex Action Retrier default
  });
}

/**
 * Whop API-specific retry wrapper
 */
export async function retryWhopOperation<T>(
  operation: () => Promise<T>,
  operationName: string = 'whop_operation'
): Promise<T> {
  return retryOperation(operation, {
    ...RetryProfiles.standard,
    operationName,
    maxAttempts: 3,
    initialDelayMs: 1000,
    base: 2.5, // Slightly more aggressive for external API
  });
}

/**
 * File upload retry wrapper (for large operations)
 */
export async function retryFileOperation<T>(
  operation: () => Promise<T>,
  operationName: string = 'file_operation'
): Promise<T> {
  return retryOperation(operation, {
    ...RetryProfiles.slow,
    operationName,
    maxAttempts: 5,
    initialDelayMs: 2000,
    base: 1.5, // Gentler backoff for file operations
  });
}

/**
 * Authentication retry wrapper (critical operations)
 */
export async function retryAuthOperation<T>(
  operation: () => Promise<T>,
  operationName: string = 'auth_operation'
): Promise<T> {
  return retryOperation(operation, {
    ...RetryProfiles.critical,
    operationName,
    maxAttempts: 2, // Limited retries for auth to prevent account lockout
    initialDelayMs: 500,
    base: 3, // More aggressive backoff for auth
  });
}

/**
 * Retry statistics for monitoring and debugging
 */
export class RetryMonitor {
  private static retryStats = new Map<string, {
    attempts: number;
    successes: number;
    failures: number;
    avgAttempts: number;
    lastSuccess: number;
    lastFailure: number;
  }>();

  static recordAttempt(operationName: string, attempt: number, success: boolean): void {
    const stats = this.retryStats.get(operationName) || {
      attempts: 0,
      successes: 0,
      failures: 0,
      avgAttempts: 0,
      lastSuccess: 0,
      lastFailure: 0,
    };

    stats.attempts += attempt;
    if (success) {
      stats.successes++;
      stats.lastSuccess = Date.now();
    } else {
      stats.failures++;
      stats.lastFailure = Date.now();
    }
    stats.avgAttempts = stats.attempts / (stats.successes + stats.failures);

    this.retryStats.set(operationName, stats);
  }

  static getStats(operationName?: string) {
    if (operationName) {
      return this.retryStats.get(operationName);
    }
    return Object.fromEntries(this.retryStats);
  }

  static resetStats(): void {
    this.retryStats.clear();
  }

  static getHealthMetrics() {
    const allStats = Array.from(this.retryStats.values());
    const totalOperations = allStats.reduce((sum, stats) => sum + stats.successes + stats.failures, 0);
    const totalSuccesses = allStats.reduce((sum, stats) => sum + stats.successes, 0);
    const averageAttempts = allStats.reduce((sum, stats) => sum + stats.avgAttempts, 0) / allStats.length || 0;

    return {
      totalOperations,
      successRate: totalOperations > 0 ? totalSuccesses / totalOperations : 0,
      averageAttempts: averageAttempts || 1,
      operationsTracked: this.retryStats.size,
    };
  }
}

/**
 * Utility functions for common retry patterns
 */
export const RetryUtils = {
  /**
   * Create a retryable version of any async function
   */
  withRetry<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    config: Partial<RetryConfig> & { operationName: string }
  ) {
    return async (...args: T): Promise<R> => {
      return retryOperation(() => fn(...args), config);
    };
  },

  /**
   * Batch retry operations with controlled concurrency
   */
  async batchRetry<T>(
    operations: Array<() => Promise<T>>,
    concurrency: number = 3,
    config: Partial<RetryConfig> = {}
  ): Promise<Array<{ success: boolean; result?: T; error?: unknown }>> {
    const results: Array<{ success: boolean; result?: T; error?: unknown }> = [];
    const executing: Promise<void>[] = [];

    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i];
      const operationName = config.operationName || `batch_operation_${i}`;

      const promise = retryOperation(operation, { ...config, operationName })
        .then((result) => {
          results[i] = { success: true, result };
        })
        .catch((error) => {
          results[i] = { success: false, error };
        });

      executing.push(promise);

      // Control concurrency
      if (executing.length >= concurrency) {
        await Promise.race(executing);
        const completed = executing.findIndex(p =>
          results.some((r, idx) => idx >= i - executing.length + 1 && r !== undefined)
        );
        if (completed >= 0) {
          executing.splice(completed, 1);
        }
      }
    }

    // Wait for all remaining operations
    await Promise.all(executing);
    return results;
  },

  /**
   * Create a circuit breaker + retry combination
   */
  withCircuitBreakerAndRetry<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    circuitBreaker: any, // Circuit breaker instance
    retryConfig: Partial<RetryConfig> & { operationName: string }
  ) {
    return async (...args: T): Promise<R> => {
      return retryOperation(
        () => circuitBreaker.execute(() => fn(...args)),
        retryConfig
      );
    };
  },
};